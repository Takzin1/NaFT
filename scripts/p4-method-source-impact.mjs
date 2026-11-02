#!/usr/bin/env node
/**
 * P4 local method-PDF change impact candidate planner.
 *
 * Replays BOTH P3 byte-intake receipts. A byte hash/label difference is NOT
 * proof of methodology clause changes or certified field impact. All impact
 * categories are review candidates and official results remain null.
 * No network, clock, PDF parsing, file write, or institutional promotion.
 */
import {createHash} from 'node:crypto';
import {readFileSync,lstatSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {stableJson} from './lib/research-readiness-report.mjs';
import {buildOfflineMethodIntake,validateMethodSourceRequest} from './p3-method-document-intake.mjs';
import {loadGovernanceRegistry,checkGovernanceRegistry} from './p2-method-soc-gate.mjs';

const ME=fileURLToPath(import.meta.url);
const MAX_PDF=12*1024*1024,MAX_JSON=80*1024;
const sha=x=>createHash('sha256').update(Buffer.isBuffer(x)?x:Buffer.from(stableJson(x),'utf8')).digest('hex');
const guard=(yes,code)=>{if(!yes)throw Error('NAFT_P4_SOURCE_IMPACT_BLOCKED:'+code)};
const isObject=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const same=(a,b)=>stableJson(a)===stableJson(b);
const domains=Object.freeze([
 ['DOCUMENT_PROVENANCE','版・原典URL・原本の出所の再確認'],
 ['METHOD_ELIGIBILITY','適用要件・有効日・経過措置の原典確認'],
 ['RULE_PACK_TRANSLATION','算定規則・係数・例外処理の条文単位差分'],
 ['FIELD_BASELINE_AND_MONITORING','農地・基準期間・実施記録と必要監視項目'],
 ['OBSERVATION_QC','原観測と品質フラグ・欠測の独立確認'],
 ['UNCERTAINTY_AND_REPLAY','不確実性・独立再演算・入力依存関係の再検査'],
 ['FINAL_ATTESTATION','VVB・制度運営者の認証／発行判断の確認']
]);
const goldExtra=['SOIL_CARBON_ACCOUNTING','SOC損失・深度と時期の比較可能性・他GHGとの非同値'];
const classify=(delta)=>{
 if(!delta.candidate_version_changed&&!delta.raw_pdf_bytes_changed
    &&!delta.reference_url_changed&&!delta.declared_filename_changed)
   return 'NO_LOCAL_REFERENCE_CHANGE_OFFICIAL_REVIEW_STILL_REQUIRED';
 if(!delta.candidate_version_changed&&delta.raw_pdf_bytes_changed)
   return 'UNEXPLAINED_SAME_VERSION_LABEL_DIFFERENT_BYTES_BLOCKED';
 if(delta.candidate_version_changed&&!delta.raw_pdf_bytes_changed)
   return 'VERSION_LABEL_CHANGED_IDENTICAL_BYTES_REVIEW_REQUIRED';
 if(delta.candidate_version_changed&&delta.raw_pdf_bytes_changed)
   return 'VERSION_AND_LOCAL_BYTES_CHANGED_REVIEW_REQUIRED';
 return 'SOURCE_DECLARATION_METADATA_CHANGED_REVIEW_REQUIRED';
};
export function buildP4SourceImpact(oldRequest,oldBytes,newRequest,newBytes,
                                    registry=loadGovernanceRegistry()){
 checkGovernanceRegistry(registry);
 validateMethodSourceRequest(oldRequest,registry);
 validateMethodSourceRequest(newRequest,registry);
 guard(oldRequest.program===newRequest.program,'CROSS_PROGRAM_DIFF_NOT_COMPARABLE');
 const before=buildOfflineMethodIntake(oldRequest,oldBytes,registry);
 const after=buildOfflineMethodIntake(newRequest,newBytes,registry);
 guard(before.governance_register_sha256===after.governance_register_sha256
  &&before.p2_readiness_sha256===after.p2_readiness_sha256,
  'SOURCE_REGISTRY_CHANGED_DURING_REPLAY');
 const delta={
  candidate_version_changed:before.candidate_version_label_unverified!==after.candidate_version_label_unverified,
  raw_pdf_bytes_changed:before.raw_pdf_sha256!==after.raw_pdf_sha256,
  reference_url_changed:before.claimed_source_page_url!==after.claimed_source_page_url,
  declared_filename_changed:before.filename_claim!==after.filename_claim
 };
 const classification=classify(delta);
 const changed=Object.values(delta).some(Boolean);
 const targeted=[...domains];
 if(before.program==='GOLD_STANDARD_SOC')targeted.splice(6,0,goldExtra);
 const reviewers=targeted.map(([id,description_ja])=>({
  id,description_ja,
  status:changed?'SOURCE_CHANGE_REVIEW_CANDIDATE':'OFFICIAL_SOURCE_REVIEW_STILL_REQUIRED',
  actual_clause_change_proven:false,
  source_scope:before.program
 }));
 const unsigned={
  schema:'naft-p4-source-change-impact-plan-v1',
  scope:'OFFLINE_DOCUMENT_BYTE_DELTA_NOT_METHOD_CLAUSE_OR_FIELD_IMPACT',
  classification,
  program:before.program,
  baseline:{
   version_claim:before.candidate_version_label_unverified,
   pdf_sha256:before.raw_pdf_sha256,
   request_sha256:before.request_sha256,
   intake_receipt_sha256:before.receipt_sha256
  },
  candidate:{
   version_claim:after.candidate_version_label_unverified,
   pdf_sha256:after.raw_pdf_sha256,
   request_sha256:after.request_sha256,
   intake_receipt_sha256:after.receipt_sha256
  },
  local_change_flags:delta,
  source_registry_sha256:before.governance_register_sha256,
  p2_readiness_sha256:before.p2_readiness_sha256,
  review_candidates:reviewers,
  review_candidate_count:reviewers.length,
  source_declaration_change_detected:changed,
  known_clause_level_diff_extracted:false,
  scientific_calculation_impact_determined:false,
  certified_field_cases_recalculated:0,
  independent_publisher_confirmation:false,
  current_formal_method_version_verified:false,
  safe_to_release_rule_pack:false,
  final_attestation_allowed:false,
  calculated_soc_loss_tco2e:null,
  officially_certified_tco2e:null,
  final_credit_issuance:null,
  registry_or_financial_action:false
 };
 return {...unsigned,plan_sha256:sha(unsigned)};
}
export function verifyP4SourceImpact(oldRequest,oldBytes,newRequest,newBytes,plan,
                                    registry=loadGovernanceRegistry()){
 guard(isObject(plan),'PLAN_OBJECT_REQUIRED');
 const expected=buildP4SourceImpact(oldRequest,oldBytes,newRequest,newBytes,registry);
 guard(same(expected,plan),'IMPACT_PLAN_REPLAY_MISMATCH');
 return {status:'LOCAL_INPUTS_AND_IMPACT_CANDIDATES_REPRODUCED',
   plan_sha256:expected.plan_sha256,officially_certified_tco2e:null};
}
export function renderP4SourceImpactJa(plan){
 const {plan_sha256,...payload}=plan||{};
 guard(plan?.schema==='naft-p4-source-change-impact-plan-v1'&&sha(payload)===plan_sha256,
  'PLAN_HASH_MISMATCH');
 const lines=['# NaFT P4｜方法論版・PDF変更の影響候補レビュー','',
  '**本レポートは原典ファイルのローカルバイト差分です。実際に改定された条文・適格性・算定量を証明しません。**','',
  '- 判定：'+plan.classification,
  '- 対象制度：'+plan.program,
  '- 旧版候補：'+plan.baseline.version_claim,
  '- 新版候補：'+plan.candidate.version_claim,
  '- PDFのバイト変更：'+(plan.local_change_flags.raw_pdf_bytes_changed?'YES':'NO'),
  '- 宣言版の変更：'+(plan.local_change_flags.candidate_version_changed?'YES':'NO'),
  '- 影響候補：'+plan.review_candidate_count+'項目',
  '- 監査ハッシュ：'+plan.plan_sha256,'','## レビューが必要な可能性のある領域',''];
 for(const row of plan.review_candidates)
   lines.push('- '+row.id+'：'+row.description_ja+' / '+row.status);
 lines.push('','原文条文の改訂内容、独立QC、承認量・クレジット発行：未検証（null）。','');
 return lines.join('\n');
}
function localBytes(path,limit){
 guard(typeof path==='string'&&path.length>0,'LOCAL_PATH_REQUIRED');
 const file=resolve(path),s=lstatSync(file);
 guard(s.isFile()&&!s.isSymbolicLink()&&s.size>0&&s.size<=limit,'LOCAL_FILE_UNSAFE_OR_TOO_LARGE');
 const bytes=readFileSync(file);
 guard(bytes.length===s.size,'LOCAL_FILE_CHANGED_DURING_READ');
 return bytes;
}
function jsonFile(path){
 const bytes=localBytes(path,MAX_JSON);
 try{return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}
 catch{throw Error('NAFT_P4_SOURCE_IMPACT_BLOCKED:INVALID_JSON_INPUT');}
}
function getInputs(args){
 return [jsonFile(args[1]),localBytes(args[2],MAX_PDF),
  jsonFile(args[3]),localBytes(args[4],MAX_PDF)];
}
function main(args){
 if(args.length===5&&args[0]==='generate'){
  console.log(JSON.stringify(buildP4SourceImpact(...getInputs(args)),null,2));return;
 }
 if(args.length===6&&args[0]==='verify'){
  console.log(JSON.stringify(verifyP4SourceImpact(...getInputs(args),jsonFile(args[5])),null,2));return;
 }
 if(args.length===5&&args[0]==='markdown'){
  console.log(renderP4SourceImpactJa(buildP4SourceImpact(...getInputs(args))));return;
 }
 throw Error('NAFT_P4_SOURCE_IMPACT_BLOCKED:USAGE_generate_OR_markdown_OLD_REQUEST_OLD_PDF_NEW_REQUEST_NEW_PDF_OR_verify_with_PLAN');
}
if(process.argv[1]&&resolve(process.argv[1])===ME){
 try{main(process.argv.slice(2));}
 catch(err){console.error(err.message);process.exitCode=1;}
}
