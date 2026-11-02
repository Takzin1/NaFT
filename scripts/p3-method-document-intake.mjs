#!/usr/bin/env node
/**
 * NaFT P3 offline evidence intake for METHOD DOCUMENT BYTES.
 * Safe boundary: hashing local supplied PDF != validating publisher, version,
 * legal applicability, scientific source content, SOC effects, or credits.
 * No network, no file copying, no executable PDF parsing, no clock.
 */
import {createHash} from 'node:crypto';
import {readFileSync,lstatSync} from 'node:fs';
import {resolve,basename} from 'node:path';
import {fileURLToPath} from 'node:url';
import {stableJson} from './lib/research-readiness-report.mjs';
import {buildP2Preflight} from './p2-audit-packet-preflight.mjs';
import {loadGovernanceRegistry,checkGovernanceRegistry} from './p2-method-soc-gate.mjs';

const ME=fileURLToPath(import.meta.url);
const MAX_PDF_BYTES=12*1024*1024;
const MAX_JSON_BYTES=80*1024;
const fail=code=>{throw Error('NAFT_P3_DOCUMENT_INTAKE_BLOCKED:'+code)};
const requireTrue=(v,code)=>{if(!v)fail(code)};
const obj=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const keysMatch=(v,keys)=>obj(v)&&Object.keys(v).sort().join('|')===keys.slice().sort().join('|');
const sha=buffer=>createHash('sha256').update(buffer).digest('hex');
const digest=v=>sha(Buffer.from(stableJson(v),'utf8'));
const safeFilename=v=>typeof v==='string'&&v.length>4&&v.length<=120
  &&/^[A-Za-z0-9][A-Za-z0-9._-]*\.pdf$/.test(v)
  &&v!=='..'&&v!=='.'&&v===basename(v);
export function validateMethodSourceRequest(request,registry=loadGovernanceRegistry()){
 checkGovernanceRegistry(registry);
 requireTrue(keysMatch(request,['schema','program','candidate_version','source_page_url',
  'declared_filename','acquisition']),'REQUEST_KEYS');
 requireTrue(request.schema==='naft-p3-method-pdf-intake-request-v1','REQUEST_SCHEMA');
 requireTrue(request.acquisition==='LOCAL_USER_SUPPLIED_UNVERIFIED','REQUEST_UNTRUSTED_ACQUISITION');
 requireTrue(safeFilename(request.declared_filename),'UNSAFE_DECLARED_FILENAME');
 if(request.program==='J_CREDIT_AG005'){
  const candidate=registry.jcredit.history.find(x=>x.version===request.candidate_version);
  requireTrue(!!candidate,'UNKNOWN_JCREDIT_VERSION');
  requireTrue(request.source_page_url===candidate.reference,'JCREDIT_REFERENCE_URL_MISMATCH');
 }else if(request.program==='GOLD_STANDARD_SOC'){
  requireTrue(request.candidate_version==='SOC_UPDATE_VERSION_UNVERIFIED',
   'GOLD_OFFICIAL_VERSION_NOT_PINNED');
  requireTrue(request.source_page_url===registry.gold_standard.reported_official_update_url,
   'GOLD_REFERENCE_URL_MISMATCH');
 }else fail('UNKNOWN_INSTITUTIONAL_PROGRAM');
 return true;
}
function describeProgram(request,registry){
 if(request.program==='J_CREDIT_AG005'){
  const candidate=registry.jcredit.history.find(x=>x.version===request.candidate_version);
  return {
   candidate_source_kind:candidate.source_kind,
   declared_url_kind:candidate.reference===null?'UNPINNED_DISCOVERY_ONLY':'REGISTERED_REFERENCE_URL_ONLY',
   pinned_research_sha256:candidate.sha256,
   requirements:registry.jcredit.unresolved
  };
 }
 return {
  candidate_source_kind:'GOLD_STANDARD_SOC_UPDATE_LANDING_PAGE_ONLY',
  declared_url_kind:'PUBLISHER_INFORMATION_PAGE_NOT_VERIFIED_ORIGINAL_PDF',
  pinned_research_sha256:null,
  requirements:[
   'OFFICIAL_SOC_UPDATE_PDF_BYTES_AND_DOCUMENT_VERSION',
   'APPLICABLE_METHOD_AND_EFFECTIVE_DATE',
   'SOC_BASELINE_AND_PROJECT_FIELD_EVIDENCE',
   'INDEPENDENT_REVIEW_OF_SOC_ACCOUNTING'
  ]
 };
}
function validatePdfMarkers(bytes){
 requireTrue(Buffer.isBuffer(bytes),'PDF_BYTES_REQUIRED');
 requireTrue(bytes.length>=24&&bytes.length<=MAX_PDF_BYTES,'PDF_SIZE_LIMIT');
 const start=bytes.subarray(0,12).toString('latin1');
 const end=bytes.subarray(Math.max(0,bytes.length-1024)).toString('latin1');
 requireTrue(/^%PDF-[12]\.[0-9](\r?\n|\r)/.test(start),'PDF_HEADER_MARKER');
 requireTrue(/%%EOF[\t \r\n]*$/.test(end),'PDF_EOF_MARKER');
 return true;
}
export function buildOfflineMethodIntake(request,pdfBytes,registry=loadGovernanceRegistry()){
 validateMethodSourceRequest(request,registry);
 validatePdfMarkers(pdfBytes);
 const d=describeProgram(request,registry);
 const rawSha=sha(pdfBytes);
 if(d.pinned_research_sha256!==null)
  requireTrue(rawSha===d.pinned_research_sha256,'CONFLICT_WITH_PREVIOUSLY_RECORDED_SOURCE_HASH');
 const readiness=buildP2Preflight();
 const unsigned={
  schema:'naft-p3-method-document-intake-receipt-v1',
  decision:'RESEARCH_FILE_HASHED_EXTERNAL_REVIEW_REQUIRED',
  scope:'LOCAL_BYTES_NOT_OFFICIAL_DOCUMENT_AUTHENTICATION',
  request_sha256:digest(request),
  governance_register_sha256:digest(registry),
  p2_readiness_sha256:readiness.preflight_sha256,
  program:request.program,
  candidate_version_label_unverified:request.candidate_version,
  claimed_source_page_url:request.source_page_url,
  filename_claim:request.declared_filename,
  bytes_processed:pdfBytes.length,
  raw_pdf_sha256:rawSha,
  pdf_marker_check:'HEADER_AND_TRAILER_ONLY_NOT_A_PDF_FORMAT_AUDIT',
  candidate_source_kind:d.candidate_source_kind,
  declared_url_kind:d.declared_url_kind,
  existing_research_source_sha256:d.pinned_research_sha256,
  research_digest_comparison:d.pinned_research_sha256===null?
    'NO_PREVIOUS_RESEARCH_RAW_PDF_SHA_AVAILABLE':'MATCHES_PREVIOUSLY_RECORDED_RESEARCH_SHA',
  unresolved_evidence_requests:[...d.requirements],
  verified_checks:{
   local_supplied_byte_integrity:true,
   matches_previous_research_snapshot:d.pinned_research_sha256!==null,
   independent_publisher_pdf_authentication:false,
   independent_license_and_reuse_clearance:false,
   official_version_and_effective_date:false,
   full_pdf_document_semantics_extracted:false,
   legal_method_applicability:false,
   independent_soc_measurement_verification:false,
   scientific_or_vvb_approval:false
  },
  external_pdf_republished:false,
  independent_attestation_signature:null,
  formal_soc_loss_tco2e:null,
  officially_certified_tco2e:null,
  final_credit_issuance:null,
  ledger_or_financial_action:false
 };
 return {...unsigned,receipt_sha256:digest(unsigned)};
}
export function verifyOfflineMethodIntake(request,pdfBytes,receipt,registry=loadGovernanceRegistry()){
 requireTrue(obj(receipt),'RECEIPT_OBJECT_REQUIRED');
 const expected=buildOfflineMethodIntake(request,pdfBytes,registry);
 requireTrue(stableJson(expected)===stableJson(receipt),'SOURCE_RECEIPT_REPLAY_MISMATCH');
 return {status:'LOCAL_BYTES_RECHECKED_NOT_PUBLISHER_AUTHENTICATED',
  receipt_sha256:expected.receipt_sha256,officially_certified_tco2e:null};
}
export function renderOfflineMethodIntakeJa(receipt){
 const {receipt_sha256,...unsigned}=receipt||{};
 requireTrue(receipt?.schema==='naft-p3-method-document-intake-receipt-v1'
   &&receipt_sha256===digest(unsigned),'RECEIPT_INTEGRITY');
 return [
  '# NaFT P3｜方法論原典ファイルのオフライン検査（研究用）','',
  '**原本ハッシュ照合は、出版社による真正性や現行採択版の確認ではありません。**','',
  '- 判定：'+receipt.decision,
  '- 制度：'+receipt.program,
  '- 版候補（未確定）：'+receipt.candidate_version_label_unverified,
  '- ファイル：'+receipt.filename_claim,
  '- ローカルPDF SHA-256：'+receipt.raw_pdf_sha256,
  '- 先行記録との照合：'+receipt.research_digest_comparison,
  '- 発行主体の独立真正性確認：未実施',
  '- 正式認証削減量：null','',
  '## 次に必要な証拠','',
  ...receipt.unresolved_evidence_requests.map(v=>'- '+v),'',
  'このレシートは原PDFの内容全文を読んだり、制度適格性を承認するものではありません。',''
 ].join('\n');
}
function readLocalBytes(path,max){
 requireTrue(typeof path==='string'&&path.length>0,'PATH_REQUIRED');
 const file=resolve(path);
 const stat=lstatSync(file);
 requireTrue(stat.isFile()&&!stat.isSymbolicLink()
   &&stat.size>0&&stat.size<=max,'UNSAFE_LOCAL_FILE');
 const bytes=readFileSync(file);
 requireTrue(bytes.length===stat.size,'LOCAL_FILE_CHANGED_DURING_READ');
 return bytes;
}
function readRequest(path){
 const bytes=readLocalBytes(path,MAX_JSON_BYTES);
 let request;
 try{request=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}
 catch{fail('REQUEST_JSON_INVALID');}
 return request;
}
function main(args){
 if(args.length===3&&args[0]==='generate'){
  console.log(JSON.stringify(buildOfflineMethodIntake(readRequest(args[1]),
    readLocalBytes(args[2],MAX_PDF_BYTES)),null,2));return;
 }
 if(args.length===4&&args[0]==='verify'){
  const receipt=readRequest(args[3]);
  console.log(JSON.stringify(verifyOfflineMethodIntake(readRequest(args[1]),
    readLocalBytes(args[2],MAX_PDF_BYTES),receipt),null,2));return;
 }
 if(args.length===3&&args[0]==='markdown'){
  console.log(renderOfflineMethodIntakeJa(buildOfflineMethodIntake(readRequest(args[1]),
    readLocalBytes(args[2],MAX_PDF_BYTES))));return;
 }
 fail('USAGE_generate_REQUEST_LOCAL_PDF_or_verify_REQUEST_LOCAL_PDF_RECEIPT_or_markdown_REQUEST_LOCAL_PDF');
}
if(process.argv[1]&&resolve(process.argv[1])===ME){
 try{main(process.argv.slice(2))}
 catch(e){console.error(e.message);process.exitCode=1}
}
