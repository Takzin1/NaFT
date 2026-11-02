#!/usr/bin/env node
/**
 * P2 preflight: a reproducible manifest-only boundary packet (not field-data
 * assurance). Cross-checks P0 evidence QC gate with P1 method namespaces.
 * No original source bytes, credentials, network, clocks or formal claims.
 */
import {createHash} from 'node:crypto';
import {readFileSync,statSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {buildResearchReadinessReport,stableJson} from './lib/research-readiness-report.mjs';
import {buildP1Comparison} from './p1-method-family-comparison.mjs';

const ROOT=fileURLToPath(new URL('../',import.meta.url));
const paths=Object.freeze({
 coverage:'research/japanflux-jp-hrt-v200/selected-native-source-coverage.json',
 badm:'research/japanflux-jp-hrt-v200/badm-concordance-2026-10-19.json',
 thesis:'research/japanflux-jp-hrt-v200/komiya-thesis-study-to-published-lineage.json',
 tellus:'research/japanflux-jp-hrt-v200/tellus-ueyama-2012-ec-options-reference.json',
 rice:'research/rice-mrv-2026-10-19/standards-and-training-source-manifest.json'
});
const digest=x=>createHash('sha256').update(stableJson(x)).digest('hex');
function guard(ok,code){if(!ok)throw Error('NAFT_P2_PREFLIGHT_BLOCKED:'+code)}
export function loadPreflightManifests(){
 return Object.fromEntries(Object.entries(paths).map(([name,p])=>[
  name,JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'))
 ]));
}
export function buildP2Preflight(manifests=loadPreflightManifests()){
 const p0=buildResearchReadinessReport(manifests);
 const p1=buildP1Comparison(undefined,manifests.rice);
 guard(p0.counts.open_blockers>0
   &&p0.unresolved_blockers.every(x=>x.status==='OPEN_NOT_HUMAN_OVERRIDABLE')
   &&p0.counts.jp_hrt_qc_verified_observations===0
   &&p0.officially_certified_tco2e===null
   &&p1.final_certified_tco2e===null
   &&p1.cross_program_equivalence.automatic===false
   &&p1.programs.length===3
   &&p1.programs.find(x=>x.program==='J_CREDIT_AG005')?.official_adoption_verified===false,
   'EXTERNAL_SCIENCE_OR_METHOD_STATUS_REQUIRES_REVIEW');
 const unresolved=p0.unresolved_blockers.map(x=>({
  id:x.id,priority:x.priority,status:'OPEN',
  required_evidence:x.required_evidence,source:x.source
 }));
 const unsigned={
  schema:'naft-p2-audit-packet-preflight-v1',
  mode:'PINNED_MANIFEST_ONLY_REVIEW_READINESS',
  status:'BLOCKED_FOR_FORMAL_CLIMATE_OR_CREDIT_CLAIMS',
  snapshot:'P0_P1_SOURCE_PINNED_2026_10_19',
  input_manifest_sha256:Object.fromEntries(
   Object.entries(manifests).sort(([a],[b])=>a.localeCompare(b))
    .map(([name,value])=>[name,digest(value)])),
  p0_report_sha256:p0.content_sha256,
  p1_method_family_sha256:p1.report_sha256,
  program_scopes:p1.programs.map(p=>({
   program:p.program,version:p.version,lane_count:p.lanes.length,
   formal_adoption_verified:p.official_adoption_verified
  })),
  source_evidence:{
   observed_half_hour_slots:p0.counts.jp_hrt_half_hour_slots,
   numeric_ch4_qc_unknown:p0.counts.jp_hrt_flux_numeric_qc_unknown,
   missing_ch4_slots:p0.counts.jp_hrt_missing_flux,
   independently_qc_accepted_ch4_rows:p0.counts.jp_hrt_qc_verified_observations,
   original_source_bytes_checked_by_this_packet:false
  },
  open_blockers:unresolved,
  blocker_counts:{
   total:unresolved.length,
   P0:unresolved.filter(x=>x.priority==='P0').length,
   P1:unresolved.filter(x=>x.priority==='P1').length
  },
  pending_review_sections:[
   {id:'S01',name:'原観測から公開行までの出典とQC',state:'EVIDENCE_BLOCKED'},
   {id:'S02',name:'制度・方法論の版と適用条件',state:'HUMAN_AND_ISSUER_REVIEW_REQUIRED'},
   {id:'S03',name:'原シート3式の算術再計算',state:'EDUCATIONAL_TESTED_SEPARATE_EXECUTION_NOT_INCLUDED'},
   {id:'S04',name:'変更影響と不確実性',state:'FIELD_RECALCULATION_NOT_READY'},
   {id:'S05',name:'外部確認・承認・真正性',state:'EXTERNAL_ATTESTATION_NOT_OBTAINED'}
  ],
  original_field_data_transferred:false,
  independent_python_oracle_executed_in_this_preflight:false,
  source_publisher_identity_verified:false,
  institutional_eligibility_verified:false,
  financial_or_registry_actions_performed:false,
  real_world_annual_ch4:null,
  certified_tco2e:null,
  credit_issuance:null
 };
 return {...unsigned,preflight_sha256:digest(unsigned)};
}
export function verifyP2Preflight(report,manifests=loadPreflightManifests()){
 guard(report!==null&&typeof report==='object'&&!Array.isArray(report),'REPORT_OBJECT_REQUIRED');
 const expected=buildP2Preflight(manifests);
 guard(stableJson(report)===stableJson(expected),'P2_PREFLIGHT_MISMATCH');
 return {status:'SOURCE_MANIFEST_PREFLIGHT_REPRODUCED',
  preflight_sha256:expected.preflight_sha256,certified_tco2e:null};
}
export function renderP2PreflightJa(report){
 const {preflight_sha256,...unsigned}=report||{};
 guard(report?.schema==='naft-p2-audit-packet-preflight-v1'
  &&preflight_sha256===digest(unsigned),'P2_PREFLIGHT_HASH_MISMATCH');
 return [
  '# NaFT P2｜監査パケット事前点検（研究用）','',
  '**正式認証ではありません。実測・科学的QCと制度適用が未確認です。**','',
  '- 判定：'+report.status,
  '- 内容ハッシュ：'+report.preflight_sha256,
  '- P0証憑レポートSHA-256：'+report.p0_report_sha256,
  '- P1方法論比較SHA-256：'+report.p1_method_family_sha256,
  '- 原観測の独立QC承認行：'+report.source_evidence.independently_qc_accepted_ch4_rows,
  '- 未解決：'+report.blocker_counts.total+'件（P0: '+report.blocker_counts.P0+'、P1: '+report.blocker_counts.P1+'）','',
  '## 未完了の証拠','',
  ...report.open_blockers.map(x=>'- '+x.priority+' '+x.id+': '+x.required_evidence),'',
  '## P2で必要な作業','',
  ...report.pending_review_sections.map(x=>'- '+x.id+' '+x.name+' ['+x.state+']'),'',
  '公式認証tCO2e：未算定（null）',''
 ].join('\n');
}
function main(args){
 if(args.length===2&&args[0]==='--format'&&['json','markdown'].includes(args[1])){
  const r=buildP2Preflight();
  process.stdout.write(args[1]==='json'?JSON.stringify(r,null,2)+'\n':renderP2PreflightJa(r));
  return;
 }
 if(args.length===2&&args[0]==='--verify'){
  const filename=resolve(args[1]);
  const st=statSync(filename);
  guard(st.isFile()&&st.size<=200_000,'REPORT_INPUT_TOO_LARGE');
  const r=JSON.parse(readFileSync(filename,'utf8'));
  console.log(JSON.stringify(verifyP2Preflight(r)));return;
 }
 throw Error('NAFT_P2_PREFLIGHT_BLOCKED:USAGE_--format_json_or_markdown_OR_--verify_FILE');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{main(process.argv.slice(2))}
 catch(err){console.error(err.message);process.exitCode=1;}
}
