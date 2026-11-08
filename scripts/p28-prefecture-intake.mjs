#!/usr/bin/env node
/**
 * P28: prefecture-specific PDF candidate intake.
 * Keep the existing P9 national statistics and its reviewed 15 source entries immutable.
 * A candidate URL is NEVER proof that the original PDF or its contents were verified.
 */
import {readFileSync,writeFileSync,lstatSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT=fileURLToPath(new URL('../',import.meta.url));
const P9=resolve(ROOT,'research/p9-japan-47-prefecture-paddy-pdf-source-register-2026-11-03.json');
const REG=resolve(ROOT,'research/p28-prefecture-candidates-v1.json');
const UI=resolve(ROOT,'src/gx-prefecture-candidates.js');
const ME=fileURLToPath(import.meta.url);
const INPUT='naft-p28-prefecture-pdf-intake-v1';
const OUTPUT='naft-p28-prefecture-pdf-candidates-v1';
const fail=(s)=>{throw Error('P28_INTAKE_BLOCKED:'+s);};
const check=(ok,code)=>{if(!ok)fail(code);};
const legalCode=(s)=>typeof s==='string'&&/^(0[1-9]|[1-3][0-9]|4[0-7])$/.test(s);

function readJson(path){
 const s=lstatSync(path);
 check(s.isFile()&&!s.isSymbolicLink()&&s.size>0&&s.size<=1024*1024,'UNSAFE_JSON');
 return JSON.parse(readFileSync(path,'utf8'));
}
function isOfficialPrefUrl(value){
 if(typeof value!=='string'||value.length>2048)return false;
 let u;try{u=new URL(value);}catch{return false;}
 if(u.protocol!=='https:'||u.username||u.password||u.port||u.hash)return false;
 const host=u.hostname.toLowerCase();
 return /^([a-z0-9-]+\.)*pref\.[a-z0-9-]+\.(lg\.jp|jp)$/.test(host)
   || /^([a-z0-9-]+\.)*metro\.tokyo\.lg\.jp$/.test(host);
}
function pdfDigest(relative,dir){
 check(typeof relative==='string'&&relative.startsWith('./')
  &&!relative.split('/').includes('..')&&!relative.includes('\\'),'UNSAFE_PDF_PATH');
 const file=resolve(dir,relative);
 check(file.startsWith(resolve(dir)+sep),'PDF_OUTSIDE_MANIFEST_DIR');
 const s=lstatSync(file);
 check(s.isFile()&&!s.isSymbolicLink()&&s.size>20&&s.size<=16*1024*1024,'PDF_SIZE_OR_SYMLINK');
 const bytes=readFileSync(file);
 check(bytes.subarray(0,5).toString('ascii')==='%PDF-'
   &&bytes.subarray(Math.max(0,bytes.length-1024)).toString('latin1').includes('%%EOF'),
   'PDF_HEADER_OR_TRAILER');
 return {size:s.size,sha256:createHash('sha256').update(bytes).digest('hex')};
}
export function intake(base,current,input,manifestDir){
 check(base?.prefectures?.length===47&&base.regional_pdf_sources?.length===15,'P9_BASELINE_MISMATCH');
 check(current?.schema===OUTPUT&&Array.isArray(current.candidates),'CURRENT_SCHEMA');
 check(input?.schema===INPUT&&Array.isArray(input.candidates)&&input.candidates.length>=1
   &&input.candidates.length<=32,'INPUT_SCHEMA');
 const valid=new Set(base.prefectures.map(p=>p.jis_code));
 const claimed=new Set(base.regional_pdf_sources.map(p=>p.prefecture_code));
 const candidates=current.candidates.slice();
 for(const p of candidates){
  check(legalCode(p.prefecture_code)&&!claimed.has(p.prefecture_code),'CURRENT_DUPLICATE');
  claimed.add(p.prefecture_code);
 }
 for(const p of input.candidates){
  check(p&&typeof p==='object'&&!Array.isArray(p)&&Object.keys(p).every(k=>
   ['prefecture_code','title','year','source_url','local_pdf'].includes(k)),'FIELDS');
  check(legalCode(p.prefecture_code)&&valid.has(p.prefecture_code),'PREFECTURE_CODE');
  check(!claimed.has(p.prefecture_code),'DUPLICATE_PREFECTURE');
  check(typeof p.title==='string'&&p.title.trim().length>=3&&p.title.length<=200,'TITLE');
  check(Number.isInteger(p.year)&&p.year>=2000&&p.year<=2100,'YEAR');
  check(isOfficialPrefUrl(p.source_url),'NOT_PREFECTURE_GOVERNMENT_URL');
  const pdf=Object.hasOwn(p,'local_pdf')?pdfDigest(p.local_pdf,manifestDir):null;
  candidates.push({
   prefecture_code:p.prefecture_code,title:p.title.trim(),year:p.year,url:p.source_url,
   verification_level:'USER_DECLARED_NOT_AUTHENTICATED',
   local_pdf_sha256:pdf?.sha256??null,local_pdf_size_bytes:pdf?.size??null,
   publisher_authentication_verified:false,original_content_verified:false,
   auto_promote_to_emission_factor:false,auto_replace_official_statistics:false,
   certified_tco2e:null
  });
  claimed.add(p.prefecture_code);
 }
 check(candidates.length<=32,'TOO_MANY_PREFECTURES');
 return {schema:OUTPUT,candidates:candidates.sort((a,b)=>a.prefecture_code.localeCompare(b.prefecture_code))};
}
export function coverage(base,current){
 check(base?.prefectures?.length===47&&base.regional_pdf_sources?.length===15,'P9_BASELINE_MISMATCH');
 check(current?.schema===OUTPUT&&Array.isArray(current.candidates),'CURRENT_SCHEMA');
 const all=[...base.regional_pdf_sources.map(x=>x.prefecture_code),
   ...current.candidates.map(x=>x.prefecture_code)];
 check(new Set(all).size===all.length,'DUPLICATE');
 return {national_statistical_coverage:47,reviewed_prefecture_pdf_source_links:15,
  additional_unverified_candidates:current.candidates.length,
  missing_prefecture_pdf_sources:47-all.length,
  missing_codes:base.prefectures.map(x=>x.jis_code).filter(x=>!all.includes(x)),
  validated_field_ch4_rows:0,certified_tco2e:null};
}
export function generateBrowserData(current){
 check(current?.schema===OUTPUT&&Array.isArray(current.candidates),'CURRENT_SCHEMA');
 return '/* Generated by P28 importer: candidate links are NOT source authenticated. */\n'
 + 'var GX_P28_PREFECTURE_CANDIDATES='
 + JSON.stringify(current.candidates).replace(/</g,'\\u003c')+';\n';
}
function main(argv){
 const base=readJson(P9),current=readJson(REG);
 if(argv.length===1&&argv[0]==='status'){
  console.log(JSON.stringify(coverage(base,current),null,2));return;
 }
 check(argv.length===2&&['preview','import'].includes(argv[0]),'USAGE');
 const manifest=resolve(argv[1]);
 const next=intake(base,current,readJson(manifest),dirname(manifest));
 if(argv[0]==='import'){
  // Only source metadata is written; no original PDF is republished.
  writeFileSync(REG,JSON.stringify(next,null,2)+'\n');
  writeFileSync(UI,generateBrowserData(next));
 }
 console.log(JSON.stringify({mode:argv[0],...coverage(base,next)},null,2));
}
if(process.argv[1]&&resolve(process.argv[1])===ME){
 try{main(process.argv.slice(2));}
 catch(e){console.error(e.message);process.exitCode=1;}
}
