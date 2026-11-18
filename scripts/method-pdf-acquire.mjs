#!/usr/bin/env node
// P78 follow-up: explicit, local-only acquisition; never fetch from UI, compiler or CI.
import {createHash} from 'node:crypto';
import {mkdirSync,mkdtempSync,realpathSync,lstatSync,writeFileSync,readFileSync} from 'node:fs';
import {resolve,isAbsolute,relative,join,dirname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {tmpdir} from 'node:os';

const ROOT=realpathSync(fileURLToPath(new URL('../',import.meta.url)));
const ME=fileURLToPath(import.meta.url);
const MAX=12*1024*1024, SHA=/^[a-f0-9]{64}$/;
const CATALOG=Object.freeze([
 {
  "id": "AG005_31_PC",
  "family": "AG-005",
  "version": "3.1",
  "kind": "PUBLIC_COMMENT_REFERENCE",
  "url": "https://public-comment.e-gov.go.jp/pcm/download?seqNo=0000281460",
  "pin": "f861e4af40f3fa1fb3a0b54327cd7720f6e5028ae99455bf39274f97140a2050"
 },
 {
  "id": "AG005_33_PC",
  "family": "AG-005",
  "version": "3.3",
  "kind": "PUBLIC_COMMENT_DRAFT",
  "url": "https://public-comment.e-gov.go.jp/pcm/download?seqNo=0000288301",
  "pin": null
 },
 {
  "id": "AG005_35_CANDIDATE",
  "family": "AG-005",
  "version": "3.5",
  "kind": "METHOD_VERSION_CANDIDATE",
  "url": "https://japancredit.go.jp/pdf/methodology/AG-005_v3.5.pdf",
  "pin": null
 },
 {
  "id": "FO001_64_CANDIDATE",
  "family": "FO-001",
  "version": "6.4",
  "kind": "METHOD_VERSION_CANDIDATE",
  "url": "https://japancredit.go.jp/pdf/methodology/FO-001_v6.4.pdf",
  "pin": null
 },
 {
  "id": "MAFF_AG005_OVERVIEW",
  "family": "AG-005",
  "version": "2026-07",
  "kind": "GUIDANCE",
  "url": "https://www.maff.go.jp/j/seisan/kankyo/ondanka/attach/pdf/index-175.pdf",
  "pin": "770e772866403a0f8e08a6ced5339272db74a3b324c9143e6e6eaee15cfc8776"
 },
 {
  "id": "MAFF_AG005_ACTIVITY_GUIDE",
  "family": "AG-005",
  "version": "2025-12",
  "kind": "GUIDANCE",
  "url": "https://www.maff.go.jp/j/seisan/kankyo/ondanka/pdf/nakaboshi_guide.pdf",
  "pin": "a026b2da0cf8348d03e7c166644bf82df41bfe1695334dd4fa77a9640375f3c5"
 }
].map(Object.freeze));
const hash=b=>createHash('sha256').update(b).digest('hex');
const fail=code=>{throw new Error('NAFT_PDF_SOURCE:'+code);};
const guard=(v,c)=>{if(!v)fail(c);};
export function listSources(){return CATALOG.map(s=>({...s}));}
function source(id){const s=CATALOG.find(x=>x.id===id);guard(s,'UNKNOWN_SOURCE');return s;}
function boundary(p){
 const rel=relative(ROOT,p);
 guard(rel==='..'||rel.startsWith('..'+sep)||isAbsolute(rel),'OUTSIDE_REPOSITORY_REQUIRED');
 return p;
}
function workspace(parent){
 guard(typeof parent==='string'&&parent.length>0,'OUTPUT_PARENT_REQUIRED');
 const p=boundary(realpathSync(resolve(parent)));
 guard(lstatSync(p).isDirectory(),'OUTPUT_PARENT_NOT_DIRECTORY');
 return mkdtempSync(join(p,'naft-method-pdf-'));
}
function checkPdf(b){
 guard(Buffer.isBuffer(b)&&b.length>=24&&b.length<=MAX,'PDF_SIZE_LIMIT');
 guard(/^%PDF-[12]\\.[0-9](\\r?\\n|\\r)/.test(b.subarray(0,12).toString('latin1')),'PDF_HEADER');
 guard(/%%EOF[\\t \\r\\n]*$/.test(b.subarray(-1024).toString('latin1')),'PDF_EOF');
}
function record(s,status,more={}){
 return {schema:'naft-method-pdf-acquisition-v1',source_id:s.id,family:s.family,
  version_candidate:s.version,source_kind:s.kind,requested_url:s.url,
  expected_sha256:s.pin,status,...more,publisher_authentication_verified:false,
  official_adoption_verified:false,semantic_diff_verified:false,redistribution_rights_verified:false,
  rule_pack_release_allowed:false,certified_tco2e:null};
}
export async function acquireSource(id,{request=globalThis.fetch,timeoutMs=30000}={}){
 const s=source(id);
 let res;
 try{
  // Exact fixed URLs, no redirect, no credentials, no cookies, no retry on denial.
  res=await request(s.url,{method:'GET',redirect:'manual',credentials:'omit',
   headers:{Accept:'application/pdf'},signal:AbortSignal.timeout(timeoutMs)});
 }catch{return {receipt:record(s,'NETWORK_UNAVAILABLE')};}
 const stop=async(status,more={})=>{try{await res.body?.cancel();}catch{}return {receipt:record(s,status,more)};};
 if(res.status!==200)return stop(res.status>=300&&res.status<400?'REDIRECT_BLOCKED':'HTTP_UNAVAILABLE',{http_status:res.status});
 const ct=(res.headers.get('content-type')||'').split(';')[0].trim().toLowerCase();
 if(!['application/pdf','application/octet-stream'].includes(ct))return stop('CONTENT_TYPE_REJECTED',{http_status:200});
 const len=res.headers.get('content-length');
 if(len!==null&&(!/^\\d+$/.test(len)||Number(len)>MAX))return stop('SIZE_LIMIT',{http_status:200});
 let bytes;
 try{
  const parts=[];let size=0;
  guard(res.body,'EMPTY_RESPONSE');
  for await(const chunk of res.body){size+=chunk.byteLength;guard(size<=MAX,'PDF_SIZE_LIMIT');parts.push(Buffer.from(chunk));}
  bytes=Buffer.concat(parts,size);checkPdf(bytes);
 }catch{return {receipt:record(s,'PDF_REJECTED',{http_status:200})};}
 const sha=hash(bytes);
 if(s.pin&&sha!==s.pin)return {receipt:record(s,'PIN_CONFLICT_BLOCKED',{http_status:200,observed_sha256:sha,bytes:bytes.length}),quarantine:bytes};
 return {receipt:record(s,s.pin?'MATCHES_RECORDED_BYTES_REVIEW_REQUIRED':'NEW_BYTES_REVIEW_REQUIRED',
  {http_status:200,raw_pdf_sha256:sha,bytes:bytes.length,pdf_marker_check:'HEADER_EOF_ONLY'}),bytes};
}
export async function acquireBatch(ids,parent,{request=globalThis.fetch}={}){
 guard(Array.isArray(ids)&&ids.length>0&&new Set(ids).size===ids.length,'SOURCE_SELECTION');
 ids.forEach(source);
 const dir=workspace(parent),receipts=[];
 for(const id of ids){
  const result=await acquireSource(id,{request});
  const r={...result.receipt};
  if(result.bytes){r.local_filename=id+'-'+r.raw_pdf_sha256+'.pdf';writeFileSync(join(dir,r.local_filename),result.bytes,{mode:0o600,flag:'wx'});}
  if(result.quarantine){r.quarantine_filename=id+'-'+r.observed_sha256+'.quarantine';writeFileSync(join(dir,r.quarantine_filename),result.quarantine,{mode:0o600,flag:'wx'});}
  receipts.push(r);
 }
 const report={schema:'naft-method-pdf-acquisition-batch-v1',received_at:new Date().toISOString(),receipts,official_adoption_verified:false,certified_tco2e:null};
 writeFileSync(join(dir,'receipts.json'),JSON.stringify(report,null,2)+'\\n',{mode:0o600,flag:'wx'});
 return {directory:dir,...report};
}
function checkedReceipt(path,id){
 const s=source(id),p=boundary(realpathSync(resolve(path))),st=lstatSync(p);
 guard(st.isFile()&&st.size<=128*1024,'RECEIPT_FILE');
 const a=JSON.parse(readFileSync(p,'utf8'));
 guard(a.schema==='naft-method-pdf-acquisition-batch-v1'&&Array.isArray(a.receipts),'RECEIPT_SCHEMA');
 const matches=a.receipts.filter(x=>x.source_id===id);guard(matches.length===1,'RECEIPT_SOURCE');
 const r=matches[0];
 guard(r.schema==='naft-method-pdf-acquisition-v1'&&r.family===s.family&&r.version_candidate===s.version&&r.source_kind===s.kind&&r.requested_url===s.url&&r.expected_sha256===s.pin,'RECEIPT_CATALOG_MISMATCH');
 guard(['MATCHES_RECORDED_BYTES_REVIEW_REQUIRED','NEW_BYTES_REVIEW_REQUIRED'].includes(r.status)&&SHA.test(r.raw_pdf_sha256)&&r.local_filename===id+'-'+r.raw_pdf_sha256+'.pdf','SOURCE_NOT_ACCEPTED');
 guard(r.official_adoption_verified===false&&r.rule_pack_release_allowed===false&&r.certified_tco2e===null,'RECEIPT_BOUNDARY');
 const f=join(dirname(p),r.local_filename),fs=lstatSync(f);
 guard(fs.isFile()&&!fs.isSymbolicLink()&&fs.size<=MAX&&fs.size===r.bytes,'PDF_FILE');
 const b=readFileSync(f);checkPdf(b);guard(hash(b)===r.raw_pdf_sha256&&(!s.pin||s.pin===hash(b)),'BYTE_REPLAY_MISMATCH');
 return {source_id:id,family:s.family,kind:s.kind,version_candidate:s.version,sha256:hash(b),bytes:b.length};
}
export function compareSnapshots(oldPath,oldId,newPath,newId){
 const before=checkedReceipt(oldPath,oldId),after=checkedReceipt(newPath,newId);
 guard(before.family===after.family&&before.kind!=='GUIDANCE'&&after.kind!=='GUIDANCE','INCOMPARABLE_SOURCES');
 const changed=before.sha256!==after.sha256,version=before.version_candidate!==after.version_candidate;
 return {schema:'naft-method-pdf-byte-delta-v1',before,after,byte_changed:changed,version_label_changed:version,
  decision:changed?'SOURCE_BYTES_CHANGED_CLAUSE_REVIEW_REQUIRED':version?'IDENTICAL_BYTES_VERSION_LABEL_REVIEW_REQUIRED':'SAME_BYTES_OFFICIAL_REVIEW_REQUIRED',
  review_candidates:changed||version?['SOURCE_PROVENANCE','ELIGIBILITY','EFFECTIVE_DATES','MONITORING_EVIDENCE','FACTORS_AND_CALCULATION']:[],
  semantic_diff_verified:false,official_adoption_verified:false,rule_pack_release_allowed:false,certified_tco2e:null};
}
if(process.argv[1]&&resolve(process.argv[1])===ME){
 try{
  const [cmd,...args]=process.argv.slice(2);
  let out;
  if(cmd==='list'&&!args.length)out=listSources();
  else if(cmd==='fetch'&&(args.length===1||args.length===2))out=await acquireBatch(args[0]==='all'?CATALOG.map(x=>x.id):[args[0]],args[1]||tmpdir());
  else if(cmd==='verify'&&args.length===2)out=checkedReceipt(args[0],args[1]);
  else if(cmd==='compare'&&args.length===4)out=compareSnapshots(...args);
  else fail('USAGE_list_OR_fetch_ID_or_all_PARENT_DIR_OR_verify_RECEIPT_ID_OR_compare_OLD_RECEIPT_ID_NEW_RECEIPT_ID');
  console.log(JSON.stringify(out,null,2));
  if(cmd==='fetch'&&out.receipts.some(r=>!r.local_filename))process.exitCode=2;
 }catch(e){console.error(e.message);process.exitCode=1;}
}
