#!/usr/bin/env node
/**
 * NaFT P2: version-aware source provenance and soil-carbon loss research gate.
 * All current institutional eligibility/official carbon figures remain blocked.
 * We audit local research metadata, never fetch PDFs or issue credits.
 */
import {createHash} from 'node:crypto';
import {readFileSync,statSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {stableJson} from './lib/research-readiness-report.mjs';
import {buildP2Preflight} from './p2-audit-packet-preflight.mjs';

const REGISTER=fileURLToPath(new URL('../research/method-governance/p2-jcredit-gs-soc-source-boundaries-2026-11-02.json',import.meta.url));
const PACKS=fileURLToPath(new URL('../src/methodology-packs.js',import.meta.url));
const ME=fileURLToPath(import.meta.url);
const HASH=/^[a-f0-9]{64}$/;
const SOIL=['SOC_BASELINE','SOC_PROJECT','SOC_COMPARABILITY','SOC_ACCOUNTING'];
const KINDS=['MISSING','PROVIDED_UNVERIFIED'];
const VERSIONS=[
 ['3.1','PUBLIC_COMMENT_REFERENCE_HASH_PINNED','HISTORICAL_TEACHING_REFERENCE_ONLY'],
 ['3.3','EGOV_PRIMARY_TEXT_REVIEWED_BYTES_NOT_PINNED','SOURCE_DISCOVERY_ONLY'],
 ['3.4','SECONDARY_REFERENCE_NO_PRIMARY_BYTES','UNVERIFIED_VERSION_REFERENCE_ONLY'],
 ['3.5','MENTIONED_BUT_ORIGINAL_BYTES_UNVERIFIED','UNVERIFIED_VERSION_REFERENCE_ONLY']
];
const sha=x=>createHash('sha256').update(stableJson(x)).digest('hex');
const requireTrue=(ok,reason)=>{if(!ok)throw Error('NAFT_METHOD_SOC_GATE_BLOCKED:'+reason)};
const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const own=(x,keys)=>plain(x)&&Object.keys(x).sort().join(',')===keys.slice().sort().join(',');
const noClaimedNumbers=(r)=>r.current_official_version==='UNKNOWN'&&
 r.current_adoption_verified===false&&r.official_current_pdf_sha256===null&&
 r.effective_date_verified===false&&r.transition_rules_verified===false&&
 r.executable_method_ready===false;
export function loadGovernanceRegistry(){
 return JSON.parse(readFileSync(REGISTER,'utf8'));
}
export function checkGovernanceRegistry(r){
 requireTrue(r?.schema==='naft-p2-method-provenance-soc-register-v1'&&r.snapshot_date==='2026-11-02',
  'REGISTRY_SCHEMA');
 const j=r.jcredit,g=r.gold_standard,p=r.policy;
 requireTrue(plain(j)&&j.methodology_id==='AG-005'&&noClaimedNumbers(j)
  &&j.legacy_executable_pack_version==='3.1-reference'
  &&j.legacy_executable_pack_sha256==='f861e4af40f3fa1fb3a0b54327cd7720f6e5028ae99455bf39274f97140a2050',
  'JCREDIT_CURRENT_SOURCE_NOT_VERIFIED');
 requireTrue(Array.isArray(j.history)&&j.history.length===4,'JCREDIT_VERSION_COUNT');
 for(let i=0;i<VERSIONS.length;i++){
  const [version,kind,use]=VERSIONS[i],v=j.history[i];
  requireTrue(v.version===version&&v.source_kind===kind&&v.allowed_use===use
   &&(i===0?v.sha256===j.legacy_executable_pack_sha256&&
      v.reference==='https://public-comment.e-gov.go.jp/pcm/download?seqNo=0000281460'
     :v.sha256===null)
   &&(i===1?v.reference==='https://public-comment.e-gov.go.jp/pcm/download?seqNo=0000288301'
       :i===0||v.reference===null),
   'JCREDIT_VERSION_SOURCE_METADATA_CHANGED:'+version);
 }
 requireTrue(Array.isArray(j.unresolved)&&j.unresolved.length===4
  &&j.unresolved.includes('CURRENT_OFFICIAL_SOURCE_BYTES_AND_HASH')
  &&j.unresolved.includes('VERSION_EFFECTIVE_DATES_AND_TRANSITION'),
  'JCREDIT_UNRESOLVED_SOURCE_GATES');
 requireTrue(g?.program==='GS_AWD_TRAINING_2024'
  &&g.soc_risk_checklist_status==='PRELIMINARY_RESEARCH_SCREENING_NOT_VERIFIED_OFFICIAL_RULE'
  &&g.update_document_bytes_verified===false
  &&g.applicable_update_version_verified===false
  &&g.formal_soc_method_calculation_enabled===false
  &&g.current_method_applicability_verified===false
  &&g.soil_carbon_change_tco2e===null&&g.certified_tco2e===null,
  'GOLD_SOC_SCOPE_NOT_VERIFIED');
 requireTrue(g.reported_official_update_url===
  'https://globalgoals.goldstandard.org/methodology-standards-paris-agreement-alignment-and-other-updates/',
  'GOLD_SOURCE_LINK_CHANGED');
 requireTrue(Array.isArray(g.checklist)&&g.checklist.length===4
  &&g.checklist.every((x,i)=>x.id===SOIL[i]&&x.status==='SOURCE_EVIDENCE_REQUIRED'
   &&typeof x.meaning_ja==='string'&&x.meaning_ja.length>8),
  'SOC_CHECKLIST_INTEGRITY');
 requireTrue(p?.reference_only===true&&p.auto_adopt_new_method_version===false
  &&p.auto_cross_program_formula_reuse===false
  &&p.official_certification_allowed===false&&p.missing_source_must_block===true
  &&p.user_claimed_evidence_is_not_independent_verification===true,
  'SCOPE_AND_CERTIFICATION_POLICY');
 return true;
}
function legacyPackFingerprint(){
 // The local source is trusted code already subject to this repository's CI.
 // Reading the Pack does NOT authenticate institutional PDF sources.
 const js=readFileSync(PACKS,'utf8');
 const context=vm.createContext({hashObject:()=> 'SYNTHETIC_LOCAL_VIEW_ONLY'});
 const code=js+'\nJSON.stringify(VERSIONED_PACKS.filter(p=>p.methodology_id===\'AG-005\'))';
 const arr=JSON.parse(vm.runInContext(code,context,{timeout:2000,filename:'methodology-packs.js'}));
 requireTrue(arr.length===1&&arr[0].methodology_version==='3.1-reference'
  &&arr[0].status==='CONFIG_REQUIRED'&&arr[0].source_hash===
  'f861e4af40f3fa1fb3a0b54327cd7720f6e5028ae99455bf39274f97140a2050'
  &&arr[0].effective_from==='UNKNOWN'&&arr[0].effective_to==='UNKNOWN'
  &&arr[0].calculation_spec?.operation==='UNSUPPORTED'
  &&arr[0].calculation_spec?.result===null
  &&arr[0].unsupported_conditions?.adoption==='UNKNOWN',
  'EXISTING_AG005_PACK_NOT_FAIL_CLOSED');
 return {ref:'src/methodology-packs.js',source_sha256:createHash('sha256').update(js).digest('hex'),
  checked_methodology:'AG-005@3.1-reference',pack_status:'CONFIG_REQUIRED'};
}
export function buildMethodSocGate(request,registry=loadGovernanceRegistry()){
 checkGovernanceRegistry(registry);
 requireTrue(own(request,['schema','ag005_reference_version','soil_evidence']),
  'REQUEST_EXACT_KEYS');
 requireTrue(request.schema==='naft-p2-method-soc-gate-request-v1','REQUEST_SCHEMA');
 requireTrue(typeof request.ag005_reference_version==='string'&&
  VERSIONS.some(v=>v[0]===request.ag005_reference_version),'UNKNOWN_AG005_VERSION');
 const evidence=request.soil_evidence;
 requireTrue(own(evidence,SOIL),'SOC_EVIDENCE_KEYS');
 for(const key of SOIL)requireTrue(KINDS.includes(evidence[key]),'UNVERIFIED_SOURCE_STATUS_ONLY:'+key);
 const j=registry.jcredit,g=registry.gold_standard,preflight=buildP2Preflight();
 const pack=legacyPackFingerprint();
 const selected=j.history.find(x=>x.version===request.ag005_reference_version);
 const gaps=g.checklist.map(x=>({
  id:x.id,meaning_ja:x.meaning_ja,
  provided_reference:evidence[x.id]==='PROVIDED_UNVERIFIED',
  independently_verified:false,
  disposition:evidence[x.id]==='MISSING'?'SOURCE_MISSING':'EXTERNAL_REVIEW_REQUIRED'
 }));
 const unsigned={
  schema:'naft-p2-method-soc-gate-decision-v1',
  status:'BLOCKED_FOR_OFFICIAL_METHOD_USE_AND_CERTIFIED_CREDITS',
  scope:'PINNED_LOCAL_RESEARCH_MANIFESTS_ONLY',
  register_sha256:sha(registry),
  request_sha256:sha(request),
  p2_preflight_sha256:preflight.preflight_sha256,
  legacy_executable_pack:pack,
  jcredit:{
   candidate: selected.version,
   candidate_source_kind:selected.source_kind,
   candidate_allowed_use:selected.allowed_use,
   official_current_adopted_version:'UNKNOWN',
   candidate_source_bytes_rechecked_this_run:false,
   original_pdf_hash_pinned_for_candidate:!!selected.sha256,
   candidate_is_confirmed_current:false,
   official_use_allowed:false,
   unverified_requirements:j.unresolved
  },
  gold_standard:{
   program:g.program,
   update_website_original_bytes_checked:false,
   soc_checklist_is_independent_official_requirements:false,
   screening:gaps,
   screening_missing:gaps.filter(x=>x.disposition==='SOURCE_MISSING').length,
   screening_unverified:gaps.filter(x=>x.disposition==='EXTERNAL_REVIEW_REQUIRED').length,
   applicable_methodology_verified:false,
   quantified_soc_loss_tco2e:null,
   official_method_eligibility:false
  },
  cross_program_method_equivalence:false,
  sourced_field_measurements_verified:false,
  source_publisher_attestation_verified:false,
  officially_certified_tco2e:null,
  credit_issuance:null,
  chain_or_financial_operation:false
 };
 return {...unsigned,decision_sha256:sha(unsigned)};
}
export function verifyMethodSocGate(request,receipt,registry=loadGovernanceRegistry()){
 requireTrue(plain(receipt),'RECEIPT_REQUIRED');
 const expected=buildMethodSocGate(request,registry);
 requireTrue(stableJson(receipt)===stableJson(expected),'DECISION_REPLAY_MISMATCH');
 return {status:'SOURCE_GATES_REEXECUTED_MATCH',decision_sha256:expected.decision_sha256,
  officially_certified_tco2e:null};
}
export function renderMethodSocGateJa(r){
 const {decision_sha256,...unsigned}=r||{};
 requireTrue(r?.schema==='naft-p2-method-soc-gate-decision-v1'&&decision_sha256===sha(unsigned),
  'REPORT_INTEGRITY');
 const lines=['# NaFT P2｜AG-005版管理とGold Standard SOCリスク確認','',
  '**研究用の保留事項です。現行の制度対応や外部認証の証明ではありません。**','',
  '- 判定：'+r.status,
  '- AG-005資料候補：'+r.jcredit.candidate,
  '- 資料分類：'+r.jcredit.candidate_source_kind,
  '- 現行採択版：UNKNOWN',
  '- Gold Standard教材：'+r.gold_standard.program,
  '- SOC資料不足：'+r.gold_standard.screening_missing+'項目',
  '- SOC資料提出済み・未検証：'+r.gold_standard.screening_unverified+'項目',
  '- SHA-256：'+r.decision_sha256,'','## SOCの調査チェックリスト',''];
 for(const x of r.gold_standard.screening)lines.push('- '+x.id+'｜'+x.meaning_ja+'｜'+x.disposition);
 lines.push('','原計測・SOC損失の独立定量、制度適格性、正式なクレジットは未検証。','',
  'certified_tco2e: null','');
 return lines.join('\n');
}
function readInput(path,max=80000){
 requireTrue(typeof path==='string'&&path.length>0,'FILE_REQUIRED');
 const file=resolve(path),st=statSync(file);
 requireTrue(st.isFile()&&st.size>0&&st.size<=max,'FILE_SIZE');
 return JSON.parse(readFileSync(file,'utf8'));
}
function main(args){
 requireTrue(args.length===2||args.length===3,'USAGE');
 if(args[0]==='generate'&&args.length===2){
  console.log(JSON.stringify(buildMethodSocGate(readInput(args[1])),null,2));return;
 }
 if(args[0]==='verify'&&args.length===3){
  console.log(JSON.stringify(verifyMethodSocGate(readInput(args[1]),readInput(args[2])),null,2));return;
 }
 if(args[0]==='markdown'&&args.length===2){
  console.log(renderMethodSocGateJa(buildMethodSocGate(readInput(args[1]))));return;
 }
 throw Error('NAFT_METHOD_SOC_GATE_BLOCKED:USAGE_generate_REQUEST_or_verify_REQUEST_RECEIPT_or_markdown_REQUEST');
}
if(process.argv[1]&&resolve(process.argv[1])===ME){
 try{main(process.argv.slice(2))}catch(e){console.error(e.message);process.exitCode=1;}
}
