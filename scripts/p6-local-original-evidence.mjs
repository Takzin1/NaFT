#!/usr/bin/env node
/**
 * P6: local original-copy identity & page-scoped scientific evidence review.
 * The original binaries remain outside public GitHub. No publisher
 * authentication, method adoption, legal eligibility, or certified reductions.
 */
import {createHash} from 'node:crypto';
import {readFileSync,lstatSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {stableJson} from './lib/research-readiness-report.mjs';
import {loadP5Graph,checkP5Graph} from './p5-clause-evidence-trace.mjs';
const ROOT=fileURLToPath(new URL('../research/method-governance/p6-user-supplied-original-source-register-2026-11-02.json',import.meta.url));
const ROUTING=fileURLToPath(new URL('../research/rice-methodology-routing/source-formula-register.json',import.meta.url));
const ME=fileURLToPath(import.meta.url);
const obj=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const fail=id=>{throw Error('NAFT_P6_SOURCE_EVIDENCE_BLOCKED:'+id)};
const check=(good,id)=>{if(!good)fail(id)};
const hash=x=>createHash('sha256').update(x).digest('hex');
const digest=x=>hash(stableJson(x));
const SHA=/^[a-f0-9]{64}$/;
const ID=/^[A-Z][A-Z0-9_.]*$/;
const ACCEPT=['MISSING','PROVIDED_UNVERIFIED'];
const EXPECTED={
 VERRA_VM0051_2026:{sha256:'9b9738840824f5919e3a76f8807c68743ae3d64b5d931cda27598f3ab32c64e2',pages:90,raw_bytes:1335524,document_format:'pdf',version:'1.1'},
 GS_TRAINING_SCENARIOS:{sha256:'77519262ddf83e00a3dd04f89be7cef46a79f534c50496f1c770325e5f1ef461',pages:2,raw_bytes:100924,document_format:'pdf',version:'TRAINING_EXERCISES'},
 GS_AWD_VVB_CHECKLIST_2024:{sha256:'532ec2c31daf95d911367b2516a5e0c67d17ba47031457c89d9d55844217478a',pages:38,raw_bytes:276403,document_format:'docx',version:'1.0'}
};
const perSourceClaimCounts={VERRA_VM0051_2026:10,GS_TRAINING_SCENARIOS:3,GS_AWD_VVB_CHECKLIST_2024:2};
const sorted=xs=>[...xs].sort();
const uniq=xs=>new Set(xs).size===xs.length;
const same=(x,y)=>stableJson(x)===stableJson(y);
export function loadP6SourceRegister(){return JSON.parse(readFileSync(ROOT,'utf8'));}
export function checkP6SourceRegister(g=loadP6SourceRegister()){
 check(g?.schema==='naft-p6-local-original-source-evidence-v1'
   &&g.snapshot_date==='2026-11-02'
   &&g.verification_scope==='THREE_USER_SUPPLIED_DOCUMENT_RAW_BYTE_HASHES_MATCH_EXISTING_RESEARCH_REGISTRY'
   &&g.publisher_authenticated_original_files===false
   &&g.redistribution_authorized===false&&g.raw_originals_committed===false
   &&g.live_current_adoption_verified===false
   &&g.method_rules_are_not_computed===true
   &&g.formal_amount_tco2e===null&&g.issuance===null,'RESEARCH_BOUNDARY');
 const expectedIds=Object.keys(EXPECTED);
 check(Array.isArray(g.source_references)&&g.source_references.length===3
   &&uniq(g.source_references.map(x=>x.source_id))
   &&same(sorted(g.source_references.map(x=>x.source_id)),sorted(expectedIds)),
   'SOURCE_IDENTITY');
 const sourceMap=new Map(g.source_references.map(s=>[s.source_id,s]));
 const old=JSON.parse(readFileSync(ROUTING,'utf8'));
 const oldSources=new Map((old.sources||[]).map(x=>[x.id,x]));
 for(const id of expectedIds){
  const s=sourceMap.get(id),fixed=EXPECTED[id],historical=oldSources.get(id);
  check(!!s&&!!historical&&s.sha256===fixed.sha256&&historical.sha256===s.sha256
    &&s.raw_bytes===fixed.raw_bytes&&s.pages===fixed.pages
    &&s.version===fixed.version&&s.document_format===fixed.document_format
    &&typeof s.file_name==='string'&&s.file_name===historical.file
    &&typeof s.title==='string'&&s.title.length>15
    &&s.raw_copy_location==='USER_PROVIDED_LIBRARY_NOT_COMMITTED'
    &&s.local_uploaded_copy_sha_verified==='2026-11-02'
    &&s.redistribution_license_verified===false
    &&s.independent_publisher_download_verified===false
    &&s.file_is_publisher_authenticated===false&&s.current_program_adoption_verified===false,
    'SOURCE_HASH_AND_LEGACY_REGISTER_CONFLICT:'+id);
 }
 check(Array.isArray(g.claims)&&g.claims.length===15
   &&uniq(g.claims.map(c=>c.id)),'CLAIM_COUNT_OR_DUPLICATE');
 const p5=loadP5Graph();checkP5Graph(p5);
 const p5Ids=new Set(p5.clauses.map(x=>x.id));
 const p5Map=new Map(p5.clauses.map(x=>[x.id,x]));
 const expectedP5=new Set(['VERRA.VM0051.9.3.1','VERRA.VM0051.9.3.3']);
 for(const c of g.claims){
  const s=sourceMap.get(c.source_id);
  check(!!s&&typeof c.id==='string'&&c.id.length<=90
    &&c.id.startsWith(c.source_id==='VERRA_VM0051_2026'?'VERRA.':'GS.')
    &&Number.isInteger(c.page_start)&&Number.isInteger(c.page_end)
    &&c.page_start>=1&&c.page_end>=c.page_start&&c.page_end<=s.pages
    &&typeof c.locator==='string'&&c.locator.length>6
    &&typeof c.statement_ja==='string'&&c.statement_ja.length>35
    &&Array.isArray(c.evidence_ids)&&c.evidence_ids.length>0
    &&uniq(c.evidence_ids)&&c.evidence_ids.every(e=>ID.test(e))
    &&Array.isArray(c.p5_links)&&uniq(c.p5_links)
    &&c.p5_links.every(x=>p5Ids.has(x)&&x.startsWith('VERRA.VM0051.'))
    &&c.original_text_copied_into_repo===false&&c.official_adoption_inferred===false
    &&c.real_project_data_verified===false&&c.certifiable_output===null,
    'CLAIM_BOUNDARY_OR_ORPHAN:'+c.id);
  check(c.kind===(c.source_id==='VERRA_VM0051_2026'?
    'METHOD_PRIMARY_SOURCE_PARAPHRASE':c.source_id==='GS_TRAINING_SCENARIOS'?
    'EDUCATIONAL_ILLUSTRATION_NOT_MEASURED':'HISTORICAL_VALIDATION_CHECKLIST'),
    'EDUCATIONAL_SOURCE_ESCALATED_TO_POLICY:'+c.id);
  for(const linked of c.p5_links)
   check(p5Map.get(linked).source_id==='VERRA_VM0051_1_1',
     'CROSS_METHOD_P5_LINEAGE:'+c.id);
 }
 for(const id of expectedIds)
  check(g.claims.filter(x=>x.source_id===id).length===perSourceClaimCounts[id],
   'PER_SOURCE_CLAIM_COUNT:'+id);
 const edges=sorted([...new Set(g.claims.flatMap(c=>c.evidence_ids))]);
 check(same(edges,g.evidence_catalog),'EVIDENCE_CATALOG_MISMATCH');
 const p5links=sorted([...new Set(g.claims.flatMap(c=>c.p5_links))]);
 check(same(p5links,g.p5_bound_clause_ids)
  &&p5links.length===2&&p5links.every(x=>expectedP5.has(x)),
  'P5_DEPENDENCY_MISMATCH');
 return true;
}
export function buildP6SourceEvidenceReview(request,g=loadP6SourceRegister()){
 checkP6SourceRegister(g);
 check(obj(request)&&sorted(Object.keys(request)).join('|')===
  ['claim_ids','evidence_status','schema','source_id'].join('|'),'REQUEST_KEYS');
 check(request.schema==='naft-p6-source-claim-review-request-v1','REQUEST_SCHEMA');
 const s=g.source_references.find(x=>x.source_id===request.source_id);
 check(!!s,'UNKNOWN_SOURCE');
 const candidates=new Map(g.claims.filter(x=>x.source_id===s.source_id).map(x=>[x.id,x]));
 check(Array.isArray(request.claim_ids)&&request.claim_ids.length>0&&request.claim_ids.length<=15
   &&uniq(request.claim_ids)&&request.claim_ids.every(x=>typeof x==='string'),
   'CLAIM_SELECTION');
 const selected=request.claim_ids.map(id=>{
  const c=candidates.get(id);check(!!c,'CROSS_SOURCE_OR_UNKNOWN_CLAIM:'+id);return c;
 });
 const needed=sorted([...new Set(selected.flatMap(x=>x.evidence_ids))]);
 check(obj(request.evidence_status)&&same(sorted(Object.keys(request.evidence_status)),needed),
  'EVIDENCE_COVERAGE');
 for(const k of needed)check(ACCEPT.includes(request.evidence_status[k]),
   'SELF_ASSERTED_QC_NOT_PERMITTED:'+k);
 const evidence=needed.map(id=>({id,
   status:request.evidence_status[id],
   independently_verified:false,
   claim_ids:selected.filter(x=>x.evidence_ids.includes(id)).map(x=>x.id),
   next_action:request.evidence_status[id]==='MISSING'?
    'COLLECT_ORIGINAL_AND_CONTEXT':'INDEPENDENT_QC_AND_HUMAN_REVIEW'
 }));
 const unsigned={schema:'naft-p6-original-scientific-claim-review-v1',
   status:'RESEARCH_CLAIMS_REQUIRE_INDEPENDENT_FIELD_AND_METHOD_REVIEW',
   original_local_copy_sha256:s.sha256,
   original_source_id:s.source_id,
   original_file_size:s.raw_bytes,
   original_pages:s.pages,
   original_binary_committed:false,
   source_publisher_original_authenticated:false,
   current_institutional_adoption_verified:false,
   original_source_registry_sha256:digest(g),
   p5_clause_graph_sha256:digest(loadP5Graph()),
   request_sha256:digest(request),
   claims:selected.map(x=>({id:x.id,locator:x.locator,page_start:x.page_start,
     page_end:x.page_end,statement_ja:x.statement_ja,kind:x.kind,p5_links:x.p5_links,
     original_document_quote_verbatim:false,
     formal_computational_rule_not_implemented:true})),
   evidence,
   evidence_missing:evidence.filter(x=>x.status==='MISSING').length,
   evidence_unverified:evidence.filter(x=>x.status==='PROVIDED_UNVERIFIED').length,
   linked_p5_clauses:sorted([...new Set(selected.flatMap(x=>x.p5_links))]),
   sourced_project_data_independently_qc_verified:false,
   science_derived_emission_result:null,
   officially_certified_tco2e:null,credit_issuance:null,
   environment_or_financial_change_performed:false
 };
 return {...unsigned,review_sha256:digest(unsigned)};
}
export function replayP6SourceEvidenceReview(req,report,g=loadP6SourceRegister()){
 check(obj(report),'RECEIPT_REQUIRED');
 const expected=buildP6SourceEvidenceReview(req,g);
 check(same(expected,report),'REVIEW_REPLAY_MISMATCH');
 return {status:'RESEARCH_ONLY_BYTE_HASH_BOUND_CLAIM_REPLAY_MATCH',
   sha256:expected.review_sha256,certified_tco2e:null};
}
export function checkLocalOriginalCopy(id,path,g=loadP6SourceRegister()){
 checkP6SourceRegister(g);
 const s=g.source_references.find(x=>x.source_id===id);
 check(!!s,'UNKNOWN_SOURCE');
 check(typeof path==='string'&&path.length>0,'PATH_REQUIRED');
 const f=resolve(path),meta=lstatSync(f);
 check(meta.isFile()&&!meta.isSymbolicLink()&&meta.size===s.raw_bytes
   &&meta.size<=12*1024*1024,'FILE_TYPE_OR_SIZE_MISMATCH');
 const b=readFileSync(f);
 check(b.length===meta.size&&hash(b)===s.sha256,'RAW_BYTES_SHA256_MISMATCH');
 return {status:'LOCAL_COPY_MATCHES_PINNED_SHA256_NOT_PUBLISHER_AUTHENTICATED',
  source_id:id,sha256:s.sha256,bytes:s.raw_bytes,
  original_publisher_authenticated:false,official_method_adoption_verified:false};
}
export function renderP6SourceReviewJa(report){
 const {review_sha256,...unsigned}=report||{};
 check(report?.schema==='naft-p6-original-scientific-claim-review-v1'&&
  digest(unsigned)===review_sha256,'REPORT_HASH_MISMATCH');
 return ['# NaFT P6｜原著を根拠にした再検証候補','',
   '**ユーザー提供の原本コピーについて、既存出典台帳とのSHA-256一致を確認。出版社による独立原本認証ではありません。**','',
   '- 資料：'+report.original_source_id,
   '- SHA-256：'+report.original_local_copy_sha256,
   '- 証憑不足：'+report.evidence_missing+'種類',
   '- 提出済み・未検証：'+report.evidence_unverified+'種類',
   '- 正式認証削減量：null','',
   '## 原著の根拠箇所',
   ...report.claims.map(c=>'- '+c.id+' / '+c.locator+' (pp.'+c.page_start+'-'+c.page_end+')：'+c.statement_ja),
   '','## 不足する証憑',
   ...report.evidence.map(e=>'- '+e.id+'：'+e.next_action),
   '','原典の再配布、正式適格性、観測QC、VVB認証、排出量計算を行っていません。',''
 ].join('\n');
}
function readJson(path){
 const st=lstatSync(resolve(path));
 check(st.isFile()&&!st.isSymbolicLink()&&st.size>0&&st.size<100000,'INPUT_FILE');
 return JSON.parse(readFileSync(resolve(path),'utf8'));
}
function main(args){
 if(args[0]==='verify-original'&&args.length===3){
  console.log(JSON.stringify(checkLocalOriginalCopy(args[1],args[2]),null,2));return;
 }
 if(args[0]==='generate'&&args.length===2){
  console.log(JSON.stringify(buildP6SourceEvidenceReview(readJson(args[1])),null,2));return;
 }
 if(args[0]==='verify'&&args.length===3){
  console.log(JSON.stringify(replayP6SourceEvidenceReview(readJson(args[1]),readJson(args[2])),null,2));return;
 }
 if(args[0]==='markdown'&&args.length===2){
  console.log(renderP6SourceReviewJa(buildP6SourceEvidenceReview(readJson(args[1]))));return;
 }
 fail('USAGE_VERIFY_ORIGINAL_GENERATE_VERIFY_MARKDOWN');
}
if(process.argv[1]&&resolve(process.argv[1])===ME){
 try{main(process.argv.slice(2))}
 catch(e){console.error(e.message);process.exitCode=1;}
}
