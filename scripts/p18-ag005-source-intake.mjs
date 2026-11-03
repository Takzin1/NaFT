#!/usr/bin/env node
/** Page-scoped MAFF guidance intake; advisory research preflight, never credit issuance. */
import {createHash} from 'node:crypto';
import {readFileSync,lstatSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const ROOT=fileURLToPath(new URL('../research/p18-maff-ag005-two-guides-2026-11-03.json',import.meta.url));
const HERE=fileURLToPath(import.meta.url);
const hash=b=>createHash('sha256').update(b).digest('hex');
const fail=s=>{throw Error('NAFT_P18_GUIDANCE_BLOCKED:'+s)};
const check=(v,s)=>{if(!v)fail(s)};
const isObj=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const SHA=/^[0-9a-f]{64}$/;
const docs={MAFF_AG005_OVERVIEW_2026_07:{sha256:'770e772866403a0f8e08a6ced5339272db74a3b324c9143e6e6eaee15cfc8776',bytes:2464882,pages:41},MAFF_AG005_ACTIVITY_GUIDE_2025_12:{sha256:'a026b2da0cf8348d03e7c166644bf82df41bfe1695334dd4fa77a9640375f3c5',bytes:1016213,pages:33}};
export function loadP18Register(){return JSON.parse(readFileSync(ROOT,'utf8'));}
export function checkP18Register(r=loadP18Register()){
 check(r.schema==='naft-p18-maff-ag005-two-guidance-sources-v1'&&r.snapshot_date==='2026-11-03'&&r.source_type==='USER_SUPPLIED_MAFF_GUIDANCE_COPY_NOT_ADOPTED_METHODOLOGY'&&r.raw_source_files_committed===false&&r.publisher_byte_authentication_verified===false&&r.current_methodology_adoption_verified===false&&r.licensed_for_redistribution===false&&r.certified_tco2e===null,'RESEARCH_BOUNDARY');
 check(Array.isArray(r.documents)&&r.documents.length===2&&new Set(r.documents.map(x=>x.id)).size===2,'DOCUMENT_COUNT');
 for(const [id,d] of Object.entries(docs)){
  const s=r.documents.find(x=>x.id===id);
  check(!!s&&s.sha256===d.sha256&&SHA.test(s.sha256)&&s.bytes===d.bytes&&s.pages===d.pages&&s.format==='pdf'&&s.source_body_is_not_methodology===true&&s.citation_authentication_status==='USER_SUPPLIED_COPY_SHA256_PINNED_PUBLISHER_NOT_RECHECKED'&&s.raw_copy_in_repository===false,'SOURCE_IDENTITY:'+id);
 }
 check(Array.isArray(r.claims)&&r.claims.length>=15&&new Set(r.claims.map(x=>x.id)).size===r.claims.length,'CLAIMS');
 for(const c of r.claims){const doc=r.documents.find(x=>x.id===c.source_id);check(!!doc&&Number.isInteger(c.pdf_page)&&c.pdf_page>=1&&c.pdf_page<=doc.pages&&typeof c.summary_ja==='string'&&c.summary_ja.length>=20&&c.official_certification_inferred===false,'CLAIM_SCOPE:'+c.id);}
 check(r.registration_rule_overview==='UNVERIFIED_CURRENT_RULE_REFERENCE_ONLY'&&r.guidance_not_primary_legal_authority===true&&r.emission_factor_approved===false,'NO_AUTO_PROMOTION');
 return true;
}
export function verifyP18LocalSource(id,path,r=loadP18Register()){
 checkP18Register(r);const s=r.documents.find(x=>x.id===id);check(!!s,'UNKNOWN_SOURCE');
 check(typeof path==='string'&&path.length>0,'LOCAL_PATH_REQUIRED');const st=lstatSync(resolve(path));
 check(st.isFile()&&!st.isSymbolicLink()&&st.size===s.bytes&&st.size<=12*1024*1024,'LOCAL_FILE_TYPE_OR_SIZE');
 const b=readFileSync(resolve(path));check(b.subarray(0,5).toString()==='%PDF-'&&hash(b)===s.sha256,'LOCAL_BYTES_MISMATCH');
 return {status:'MATCHES_USER_SUPPLIED_SOURCE_COPY_NOT_PUBLISHER_AUTHENTICATED',source_id:id,sha256:s.sha256,bytes:s.bytes,official_adoption_verified:false};
}
function isoDay(s){if(typeof s!=='string'||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(s))return null;const t=new Date(s+'T00:00:00.000Z');return Number.isFinite(t.getTime())&&t.toISOString().slice(0,10)===s?t:null;}
const safeDays=xs=>Array.isArray(xs)&&xs.length>=2&&xs.length<=20&&xs.every(x=>isObj(x)&&Number.isInteger(x.year)&&Number.isInteger(x.days)&&x.days>=0&&x.days<=120);
export function precheckP18Evidence(p,r=loadP18Register()){
 checkP18Register(r);check(isObj(p)&&p.schema==='naft-p18-research-precheck-input-v1'&&Number.isInteger(p.crop_year)&&p.crop_year>=2023&&p.crop_year<=2100,'INPUT_YEAR');
 const findings=[];const add=(id,detail)=>findings.push({claim_id:id,detail});
 if(!safeDays(p.baseline_rice_years)||new Set((p.baseline_rice_years||[]).map(x=>x.year)).size!==(p.baseline_rice_years||[]).length||(p.baseline_rice_years||[]).some(x=>x.year>=p.crop_year))add('OVERVIEW_BASELINE','Need at least two distinct prior rice-cultivation years with actual records; non-rice years may be skipped');
 const baselineOk=!findings.some(x=>x.claim_id==='OVERVIEW_BASELINE');
 const average=baselineOk?p.baseline_rice_years.reduce((a,x)=>a+x.days,0)/p.baseline_rice_years.length:null;
 if(!Number.isInteger(p.project_drain_days)||p.project_drain_days<0||p.project_drain_days>120||!baselineOk||p.project_drain_days-average<7)add('OVERVIEW_SEVEN_DAY','Continuous project draining must exceed recorded rice-year baseline mean by at least seven days');
 const start=isoDay(p.drain_start),end=isoDay(p.drain_end),heading=isoDay(p.heading_date);
 if(!start||!end||!heading||start>=end||end>=heading||start.getUTCFullYear()!==p.crop_year||end.getUTCFullYear()!==p.crop_year)add('OVERVIEW_BEFORE_HEADING','Valid draining start and end must precede heading in the project crop year');
 if(p.uninterrupted_inlet_closed_outlet_open!==true)add('OVERVIEW_CONTINUITY','No intermittent rewatering or concatenation of separate draining periods');
 if(p.management_records_verified!==true||p.start_end_evidence_verified!==true)add('OVERVIEW_MONITORING','Management records plus objectively checkable start/end evidence required');
 if(!(typeof p.rice_area_proof_reference==='string'&&p.rice_area_proof_reference.trim().length>0)||!(typeof p.area_evidence_lot_id==='string'&&p.area_evidence_lot_id.trim().length>0))add('OVERVIEW_AREA','Rice planted area, locality and underlying evidence parcel identifier required');
 if(p.straw_and_compost_records_verified!==true)add('OVERVIEW_ORGANIC','Previous rice crop straw removal and compost inputs need supporting records');
 if(p.crop_year>=2025){
  if(typeof p.emaff_lot_id!=='string'||!p.emaff_lot_id.trim()){
   if(p.emaff_absence_screenshot_verified!==true||!['FARM_PLAN_OR_RICE_INSURANCE','PROPERTY_TAX_NOTICE','EQUIVALENT_RECONCILED_DOCUMENT'].includes(p.fallback_lot_document))add('GUIDE_2025_PARCEL','2025+ requires eMAFF lot one-row transcription, or screenshot-backed absence with ordered fallback documents');
  }
  if(!(typeof p.area_evidence_lot_id==='string'&&p.area_evidence_lot_id.trim()))add('GUIDE_2025_AREA_PARCEL','Keep area-source lot identity separately from eMAFF lot identity');
 }
 if(p.field_ecology_food_safety_reviewed!==true)add('OVERVIEW_ENVIRONMENTAL','Human agronomic, aquatic ecology and cadmium/food safety risk review required');
 return {schema:'naft-p18-guidance-evidence-precheck-v1',source_sha256:r.documents.map(d=>({id:d.id,sha256:d.sha256})),crop_year:p.crop_year,baseline_days_mean:average,project_extension_days:average===null?null:p.project_drain_days-average,status:findings.length?'RESEARCH_EVIDENCE_INCOMPLETE_OR_CONFLICT':'RESEARCH_PRECHECK_COMPLETE_HUMAN_REVIEW_STILL_REQUIRED',findings,issuer_approval:false,official_rules_checked:false,official_emission_factors_loaded:false,certified_tco2e:null,carbon_credits_issued:null};
}
function main(args){if(args[0]==='audit'&&args.length===1){const r=loadP18Register();checkP18Register(r);console.log(JSON.stringify({status:'TWO_USER_PDFS_RECORDED_NO_ORIGINALS_REDISTRIBUTED',sources:r.documents.map(x=>({id:x.id,sha256:x.sha256,pages:x.pages})),claims:r.claims.length},null,2));return;}
 if(args[0]==='verify-local'&&args.length===3){console.log(JSON.stringify(verifyP18LocalSource(args[1],args[2]),null,2));return;}
 if(args[0]==='precheck'&&args.length===2){console.log(JSON.stringify(precheckP18Evidence(JSON.parse(readFileSync(resolve(args[1]),'utf8'))),null,2));return;}fail('USAGE_AUDIT_VERIFY_LOCAL_PRECHECK');}
if(process.argv[1]&&resolve(process.argv[1])===HERE){try{main(process.argv.slice(2));}catch(e){console.error(e.message);process.exitCode=1;}}
