#!/usr/bin/env node
/** P1 method-family comparability: source-scoped references, never credit certification.
 * Read-only metadata. The J-Credit AG-005 current adopted version is unverified here.
 */
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {loadRegistry,validateRegistry} from './rice-methodology-router.mjs';
import {auditRiceStandardsSources} from './lib/rice-standards-source-gate.mjs';
import {digestObject} from './ieee-gs-worksheet-replay.mjs';

const manifestPath=fileURLToPath(new URL('../research/rice-mrv-2026-10-19/standards-and-training-source-manifest.json',import.meta.url));
function check(ok,code){if(!ok)throw Error('NAFT_P1_METHOD_COMPARE_BLOCKED:'+code)}
const japanese=Object.freeze({
 TIER_1_SIMPLIFIED:'簡易排出係数',TIER_2_COUNTRY_SPECIFIC:'国別係数',
 TIER_3_DIRECT:'直接測定',QA1_MODEL:'生物地球化学モデル',
 QA2_DIRECT_CHAMBER:'フラックスチャンバーによる直接測定',
 QA3_DEFAULT_EF:'既定係数・数式'
});
export function buildP1Comparison(registry=loadRegistry(),manifest=JSON.parse(readFileSync(manifestPath,'utf8'))){
 validateRegistry(registry);
 const audit=auditRiceStandardsSources(manifest);
 check(audit.cross_document_tier_number_conflict===true
  &&audit.no_automatic_label_mapping===true,'GS_TIER_INCONSISTENCY_LOST');
 const gs=registry.programs.GS_AWD_TRAINING_2024;
 const verra=registry.programs.VERRA_VM0051_V1_1_2026;
 const gsRows=Object.entries(gs.lanes).map(([id,ref])=>({
  label:id,description_ja:japanese[id],source:'GOLD_STANDARD_TRAINING_WORKBOOK',
  formula_location:ref.sheet+'!'+ref.formula_cell,formula:ref.formula,
  evidence_required:ref.evidence_required,
  educational_arithmetic_available:true,
  full_climate_calculation_implemented:false
 }));
 const verraRows=Object.entries(verra.lanes).map(([id,ref])=>({
  label:id,description_ja:japanese[id],source:'VERRA_VM0051_V1_1_REFERENCE',
  formula_location:null,formula:null,evidence_required:ref.requires,
  educational_arithmetic_available:false,
  full_climate_calculation_implemented:false
 }));
 check(gsRows.length===3&&verraRows.length===3
  &&gsRows.every(r=>typeof r.description_ja==='string'&&r.formula.startsWith('='))
  &&verraRows.every(r=>typeof r.description_ja==='string'&&r.formula===null),
 'UNKNOWN_LANE_SEMANTICS');
 const result={
  schema:'naft-p1-method-family-comparison-v1',
  status:'REFERENCE_MAPPING_ONLY_NOT_SCIENTIFIC_OR_FORMAL_VALIDATION',
  snapshot:'SOURCE_PINNED_RESEARCH_2026_10_19',
  source_reg_digest:digestObject(registry),
  programs:[
   {program:'GOLD_STANDARD_AWD_WORKBOOK',version:'TRAINING_WORKBOOK_V1_1',
    meaning:'出典付き教材の計算式のみ',lanes:gsRows,
    tier_1_3_document_conflict:'UNRESOLVED',official_adoption_verified:false},
   {program:'VERRA_VM0051',version:'V1.1_REFERENCE_2026_07_14',
    meaning:'方法論・測定方式の研究用ルーティング',lanes:verraRows,
    tier_1_3_document_conflict:null,official_adoption_verified:false},
   {program:'J_CREDIT_AG005',version:'CURRENT_ADOPTED_VERSION_UNVERIFIED',
    meaning:'別の方法論体系。IEEE版・GS版との自動対応付け禁止',lanes:[],
    tier_1_3_document_conflict:null,official_adoption_verified:false}
  ],
  cross_program_equivalence:{automatic:false,
   reason:'Gold Tier、Verra QA、日本のAG-005は計算方法・適用条件・文書版が異なる'},
  original_source_files_redistributed:false,
  third_party_publisher_origin_verified:false,
  gold_full_workbook_replayed:false,
  actual_field_observation_approved:false,
  current_jcredit_rulepack_certified:false,
  final_certified_tco2e:null
 };
 return {...result,report_sha256:digestObject(result)};
}
export function renderP1JapaneseMarkdown(report){
 check(report?.schema==='naft-p1-method-family-comparison-v1','REPORT_SCHEMA');
 const {report_sha256,...unsigned}=report;
 check(report_sha256===digestObject(unsigned),'REPORT_SHA_MISMATCH');
 const lines=[
 '# NaFT｜水田MRVの方法論比較（研究用）','',
 '**教材の再計算・方法論参照であり、正式認証値や現行制度の適用承認ではありません。**','',
 'レポート SHA-256: '+report.report_sha256,'',
 '| 制度・資料版 | 項目 | 意味 | 計算状態 |','| --- | --- | --- | --- |'
 ];
 for(const program of report.programs){
  if(!program.lanes.length){
   lines.push('| '+program.program+' / '+program.version+' | 未対応 | '+program.meaning+' | 公式版・適用条件未確認 |');
  }
  for(const lane of program.lanes){
   lines.push('| '+program.program+' / '+program.version+' | '+lane.label+
    ' | '+lane.description_ja+' | '+(lane.educational_arithmetic_available?
      '教材の式のみ再計算可':'方法論の参照のみ')+' |');
  }
 }
 lines.push('','## 危険な自動変換は拒否','','- Gold StandardワークブックとVVBチェックリストQ23のTier 1/3表記は不一致。','- Verra QA2は直接測定の中でもチャンバー方式の要件があり、JapanFluxのEC観測値だけで置換できない。','- J-クレジットAG-005の現行採択版・係数は別途確認が必要。','- この一覧の式は全ガス・適格性・欠測・実績値を含む完全な排出削減計算ではない。','- 独立した2エンジンの教材再計算は scripts/p1-gs-independent-replay.mjs で別途実行。','',
 '正式に認証されたtCO2e：未算定（null）','');
 return lines.join('\n');
}
function main(argv){
 const report=buildP1Comparison();
 if(argv.length!==2||argv[0]!=='--format'||!['json','markdown'].includes(argv[1]))
  throw Error('NAFT_P1_METHOD_COMPARE_BLOCKED:USAGE_--format_json_or_markdown');
 process.stdout.write(argv[1]==='json'?JSON.stringify(report,null,2)+'\n':
  renderP1JapaneseMarkdown(report));
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{main(process.argv.slice(2))}
 catch(e){console.error(e.message);process.exitCode=1}
}
