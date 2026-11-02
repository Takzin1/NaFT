#!/usr/bin/env node
/**
 * NaFT P5 offline clause -> evidence -> review/Rule Pack impact graph.
 *
 * Clauses are manually summarized from public official web/PDF text; original
 * PDF bytes are not committed or re-hashed. No source authenticity attestation,
 * legal interpretation engine, VVB decision, MRV quantity or certificate.
 */
import {createHash} from 'node:crypto';
import {readFileSync,lstatSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {stableJson} from './lib/research-readiness-report.mjs';
import {buildP2Preflight} from './p2-audit-packet-preflight.mjs';
import {loadGovernanceRegistry,checkGovernanceRegistry} from './p2-method-soc-gate.mjs';

const ROOT=fileURLToPath(new URL('../research/method-governance/p5-official-clause-evidence-trace-2026-11-02.json',import.meta.url));
const ME=fileURLToPath(import.meta.url);
const reject=message=>{throw Error('NAFT_P5_CLAUSE_TRACE_BLOCKED:'+message)};
const assure=(test,reason)=>{if(!test)reject(reason)};
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const exactKeys=(x,keys)=>object(x)&&Object.keys(x).sort().join('|')===keys.slice().sort().join('|');
const digest=x=>createHash('sha256').update(stableJson(x)).digest('hex');
const uniq=x=>new Set(x).size===x.length;
const sorted=x=>[...x].sort();
const expectedIds=(array,key)=>sorted([...new Set(array.flatMap(c=>c[key]))]);
const PROGRAMS=['GS_AWD_SOC','VERRA_VM0051','J_CREDIT_AG005'];
const statuses=['MISSING','PROVIDED_UNVERIFIED'];
const ISO_DATE=/^\d{4}-\d{2}-\d{2}$/;
function validDay(x){
 if(typeof x!=='string'||!ISO_DATE.test(x))return false;
 const [y,m,d]=x.split('-').map(Number);
 const n=new Date(Date.UTC(y,m-1,d));
 return n.getUTCFullYear()===y&&n.getUTCMonth()===m-1&&n.getUTCDate()===d;
}
export function loadP5Graph(){return JSON.parse(readFileSync(ROOT,'utf8'));}
export function checkP5Graph(g){
 assure(g?.schema==='naft-p5-official-clause-evidence-trace-v1'
  &&g.snapshot_date==='2026-11-02'
  &&g.research_only===true&&g.compiler_pack_replaced===false
  &&g.original_external_pdf_bytes_vendored===false
  &&g.independent_publisher_authentication===false
  &&g.all_computations_officially_approved===false,'UNSAFE_GRAPH_SCOPE');
 assure(Array.isArray(g.source_index)&&g.source_index.length===4
   &&uniq(g.source_index.map(s=>s.id)),'SOURCE_INDEX_IDENTITY');
 const sources=new Map(g.source_index.map(s=>[s.id,s]));
 for(const s of g.source_index){
  assure(PROGRAMS.includes(s.program)
   &&typeof s.url==='string'&&s.url.startsWith('https://')
   &&s.raw_pdf_bytes_downloaded_to_repo===false&&s.automatic_certification===false
   &&typeof s.source_review_state==='string','UNSAFE_SOURCE_ROW');
 }
 const gs=sources.get('GS_SOC_2025_12_22'),old=sources.get('GS_SOC_2025_07_07'),
   verra=sources.get('VERRA_VM0051_1_1'),ag=sources.get('AG005_3_1_REFERENCE');
 assure(gs?.program==='GS_AWD_SOC'&&gs.publication_date==='2025-12-22'
   &&gs.listed_applicable_rule_update===true&&gs.general_monitoring_window_from==='2026-07-01'
   &&gs.url.endsWith('Rice-Methodology-1.pdf')
   &&gs.official_listing_url==='https://globalgoals.goldstandard.org/rule-updates/'
   &&gs.raw_pdf_sha256===null,'GOLD_CURRENT_OFFICIAL_INDEX_BOUNDARY');
 assure(old?.program==='GS_AWD_SOC'&&old.publication_date==='2025-07-07'
   &&old.listed_applicable_rule_update===false&&old.general_monitoring_window_from==='2026-01-01'
   &&old.raw_pdf_sha256===null
   &&old.url.endsWith('Rice-Methodology.pdf'),'GOLD_OLD_RULE_MUST_NOT_DRIVE_CLAIMS');
 assure(verra?.program==='VERRA_VM0051'&&verra.publication_date==='2026-07-14'
   &&verra.url==='https://verra.org/methodologies/vm0051-improved-management-in-rice-production-systems-v1-1/'
   &&verra.raw_pdf_sha256===null,'VERRA_METHOD_PAGE_BOUNDARY');
 assure(ag?.program==='J_CREDIT_AG005'
   &&ag.listed_applicable_rule_update===false
   &&ag.raw_pdf_sha256==='f861e4af40f3fa1fb3a0b54327cd7720f6e5028ae99455bf39274f97140a2050'
   &&ag.source_review_state==='PAST_RESEARCH_REFERENCE_HASH_NOT_CURRENT_APPLICABILITY',
   'AG005_HISTORICAL_ONLY');
 const co=g.observed_source_conflict;
 assure(co?.official_current_listing===gs.id&&co.older_reference===old.id
  &&co.older_general_date==='2026-01-01'&&co.current_general_date==='2026-07-01'
  &&co.does_not_imply_publisher_binary_authentication===true
  &&co.resolved_by==='OFFICIAL_APPLICABLE_RULE_UPDATES_LISTING',
  'GOLD_TIMELINE_CONFLICT_NOT_RESOLVED');
 assure(Array.isArray(g.clauses)&&g.clauses.length===14
  &&uniq(g.clauses.map(c=>c.id)),'CLAUSE_IDENTITY');
 const listKeys=['evidence','review','modules'];
 for(const c of g.clauses){
  const src=sources.get(c.source_id);
  assure(!!src&&typeof c.id==='string'&&c.id.length<96&&
   typeof c.locator==='string'&&c.locator.length>2
   &&typeof c.summary_ja==='string'&&c.summary_ja.length>8
   &&c.source_pdf_raw_bytes_rechecked_in_p5===false
   &&c.fully_translated_rule===false&&c.officially_approved_computation===false,
   'UNSAFE_CLAUSE_CONTENT');
  if(src.id==='GS_SOC_2025_07_07')reject('OLDER_GS_RULE_USED_AS_CURRENT_CLAUSE');
  for(const key of listKeys){
   assure(Array.isArray(c[key])&&c[key].length>0&&uniq(c[key])
    &&c[key].every(v=>typeof v==='string'&&/^[A-Z][A-Z0-9_]*$/.test(v)),
    'CLAUSE_EDGES_INVALID:'+key);
  }
 }
 for(const key of listKeys){
  const field=key==='evidence'?'controlled_evidence_ids':
    key==='review'?'controlled_review_ids':'controlled_module_ids';
  assure(Array.isArray(g[field])&&g[field].join('|')===expectedIds(g.clauses,key).join('|'),
   'GRAPH_EDGE_INDEX_INCONSISTENT:'+field);
 }
 const p=g.formal_output_policy;
 assure(p?.official_adoption_automatic===false
  &&p.source_text_semantic_parsing_automatic===false
  &&p.scientific_recalculation_automatic===false
  &&p.verified_credits_tco2e===null&&p.credit_issuance===null,
  'GATE_NOT_FAIL_CLOSED');
 return true;
}
export function buildP5ClauseTrace(request,g=loadP5Graph()){
 checkP5Graph(g);
 const p2=loadGovernanceRegistry();checkGovernanceRegistry(p2);
 assure(exactKeys(request,['schema','program','changed_clause_ids','evidence_status','monitoring_window']),
  'REQUEST_KEYS');
 assure(request.schema==='naft-p5-clause-impact-request-v1'
   &&PROGRAMS.includes(request.program),'REQUEST_SCHEMA_OR_PROGRAM');
 const ids=request.changed_clause_ids;
 assure(Array.isArray(ids)&&ids.length>0&&ids.length<=14
   &&uniq(ids)&&ids.every(s=>typeof s==='string'),'CLAUSE_SELECTION');
 const sourceMap=new Map(g.source_index.map(s=>[s.id,s]));
 const clauses=new Map(g.clauses.map(c=>[c.id,c]));
 const selected=ids.map(id=>{
  const c=clauses.get(id);
  assure(!!c,'UNKNOWN_CLAUSE:'+id);
  assure(sourceMap.get(c.source_id).program===request.program,'CROSS_PROGRAM_CLAUSE:'+id);
  return c;
 });
 const required=expectedIds(selected,'evidence');
 assure(exactKeys(request.evidence_status,required),'EVIDENCE_STATUS_EXACT_COVERAGE');
 for(const k of required)assure(statuses.includes(request.evidence_status[k]),
  'SOURCE_EVIDENCE_CANNOT_SELF_VERIFY:'+k);
 const w=request.monitoring_window;
 assure(exactKeys(w,['start_date','end_date','ccp_label_requested'])
   &&validDay(w.start_date)&&validDay(w.end_date)
   &&w.end_date>=w.start_date&&typeof w.ccp_label_requested==='boolean',
   'MONITORING_WINDOW_INVALID');
 const gsDate=g.observed_source_conflict.current_general_date;
 let dateSignal='REVIEW_DOCUMENT_EFFECTIVE_DATES_INDEPENDENTLY';
 if(request.program==='GS_AWD_SOC'){
  dateSignal=w.ccp_label_requested?'CCP_LABEL_PERIOD_REQUIRES_INDEPENDENT_EARLY_DATE_REVIEW':
   w.end_date<gsDate?'BEFORE_CURRENT_GENERAL_DATE_BUT_VOLUNTARY_AND_CCP_EXCEPTIONS_REQUIRE_REVIEW':
   w.start_date>=gsDate?'ON_OR_AFTER_2026_07_01_REQUIRES_REVIEW':
    'CROSSES_2026_07_01_REQUIRES_REVIEW';
 }else if(request.program==='VERRA_VM0051'){
  dateSignal=w.start_date>='2027-08-01'?'VERIFY_VM0051_V10_PHASEOUT_FOR_REGISTRATION_OR_RENEWAL':
   'VERIFY_VM0051_1_1_AND_LEGACY_PROJECT_TRANSITION';
 }else dateSignal='AG005_CURRENT_VERSION_NOT_INDEPENDENTLY_PINNED';
 const evidence=required.map(id=>({
   id,status:request.evidence_status[id],independently_verified:false,
   disposition:request.evidence_status[id]==='MISSING'?
      'NEEDS_ORIGINAL_SOURCE':'NEEDS_INDEPENDENT_QC_AND_HUMAN_REVIEW',
   triggered_by:selected.filter(c=>c.evidence.includes(id)).map(c=>c.id)
 }));
 const reviewNodes=expectedIds(selected,'review');
 const modules=expectedIds(selected,'modules');
 const unsigned={
   schema:'naft-p5-clause-evidence-trace-plan-v1',
   status:'BLOCKED_FOR_INSTITUTIONAL_METHOD_USE',
   request_sha256:digest(request),
   clause_graph_sha256:digest(g),
   p2_research_governance_sha256:digest(p2),
   p2_preflight_sha256:buildP2Preflight().preflight_sha256,
   program:request.program,
   clauses:selected.map(c=>({
     id:c.id,source_id:c.source_id,source_url:sourceMap.get(c.source_id).url,
     source_locator:c.locator,summary_ja:c.summary_ja,
     source_original_bytes_independently_authenticated:false,
     clause_executable_translation_verified:false
   })),
   evidence,
   evidence_missing:evidence.filter(x=>x.status==='MISSING').length,
   evidence_submitted_but_unverified:evidence.filter(x=>x.status==='PROVIDED_UNVERIFIED').length,
   review_nodes:reviewNodes,
   candidate_replay_modules:modules,
   monitoring_window:{...w},
   temporal_review_signal:dateSignal,
   observed_outdated_rule_excluded_from_graph:true,
   actual_original_pdf_clause_text_diff_extracted:false,
   clause_to_rulepack_dependency_candidate_only:true,
   complete_rulepack_dependency_coverage_verified:false,
   independent_qc_passed:false,
   human_or_vvb_approved:false,
   production_rule_pack_mutated:false,
   field_recalculation_executed:false,
   applicability_decided:false,
   certified_field_cases_recalculated:0,
   soc_stock_loss_tco2e:null,
   officially_certified_tco2e:null,
   credit_issuance:null,
   ledger_or_financial_action:false
 };
 return {...unsigned,plan_sha256:digest(unsigned)};
}
export function verifyP5ClauseTrace(request,plan,g=loadP5Graph()){
 assure(object(plan),'PLAN_REQUIRED');
 const expected=buildP5ClauseTrace(request,g);
 assure(stableJson(expected)===stableJson(plan),'TRACE_REPLAY_MISMATCH');
 return {status:'GRAPH_AND_LOCAL_REQUEST_REPLAY_MATCH',plan_sha256:expected.plan_sha256,
   officially_certified_tco2e:null};
}
export function renderP5ClauseTraceJa(plan){
 const {plan_sha256,...u}=plan||{};
 assure(plan?.schema==='naft-p5-clause-evidence-trace-plan-v1'
  &&digest(u)===plan_sha256,'PLAN_HASH_MISMATCH');
 const rows=['# NaFT P5｜原典条項→証憑→再検証候補','',
  '**資料上の条項IDを人手で登録した研究用トレーサビリティ。原PDFの原本認証や正式な算定・認証ではない。**','',
  '- 対象：'+plan.program,'- 状態：'+plan.status,
  '- 時点上の確認事項：'+plan.temporal_review_signal,
  '- 証憑不足：'+plan.evidence_missing+'件',
  '- 提出されたが独立検証前：'+plan.evidence_submitted_but_unverified+'件',
  '- 影響候補の再検証モジュール：'+plan.candidate_replay_modules.join(', '),
  '- ハッシュ：'+plan.plan_sha256,'','## 条項の参照元',''];
 for(const c of plan.clauses)rows.push('- '+c.id+' / '+c.source_locator+' / '+c.source_url);
 rows.push('','## 必要な証憑','');
 for(const e of plan.evidence)rows.push('- '+e.id+' / '+e.disposition+' ← '+e.triggered_by.join(', '));
 rows.push('','正式な削減量・認証済みtCO2e：null。正式制度版、現場の独立QC、VVB承認は保留。','');
 return rows.join('\n');
}
function readJson(path){
 assure(typeof path==='string'&&path.length>0,'INPUT_PATH');
 const file=resolve(path),s=lstatSync(file);
 assure(s.isFile()&&!s.isSymbolicLink()&&s.size>0&&s.size<=90000,'INPUT_FILE');
 try{return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(readFileSync(file)));}
 catch{reject('INPUT_JSON');}
}
function main(args){
 if(args.length===2&&args[0]==='generate'){
  console.log(JSON.stringify(buildP5ClauseTrace(readJson(args[1])),null,2));return;
 }
 if(args.length===3&&args[0]==='verify'){
  console.log(JSON.stringify(verifyP5ClauseTrace(readJson(args[1]),readJson(args[2])),null,2));return;
 }
 if(args.length===2&&args[0]==='markdown'){
  console.log(renderP5ClauseTraceJa(buildP5ClauseTrace(readJson(args[1]))));return;
 }
 reject('USAGE_generate_REQUEST_or_verify_REQUEST_PLAN_or_markdown_REQUEST');
}
if(process.argv[1]&&resolve(process.argv[1])===ME){
 try{main(process.argv.slice(2));}
 catch(e){console.error(e.message);process.exitCode=1;}
}
