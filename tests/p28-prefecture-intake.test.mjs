import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import vm from 'node:vm';
import {intake,coverage,generateBrowserData} from '../scripts/p28-prefecture-intake.mjs';

const base=JSON.parse(readFileSync('research/p9-japan-47-prefecture-paddy-pdf-source-register-2026-11-03.json','utf8'));
const current=JSON.parse(readFileSync('research/p28-prefecture-candidates-v1.json','utf8'));
const report=coverage(base,current);
assert.equal(report.national_statistical_coverage,47);
assert.equal(report.reviewed_prefecture_pdf_source_links,15);
assert.equal(report.missing_prefecture_pdf_sources,32);
assert.equal(report.certified_tco2e,null);
const dir=mkdtempSync(join(tmpdir(),'naft-p28-'));
try{
 writeFileSync(join(dir,'file.pdf'),'%PDF-1.4\n1 0 obj\n<</Type/Catalog>>\nendobj\n%%EOF\n');
 const source={prefecture_code:'05',title:'秋田県の合成試験資料',year:2025,
  source_url:'https://www.pref.akita.lg.jp/example.pdf',local_pdf:'./file.pdf'};
 const input={schema:'naft-p28-prefecture-pdf-intake-v1',candidates:[source]};
 const next=intake(base,current,input,dir);
 assert.equal(next.candidates.length,1);
 assert.match(next.candidates[0].local_pdf_sha256,/^[a-f0-9]{64}$/);
 assert.equal(next.candidates[0].publisher_authentication_verified,false);
 assert.equal(next.candidates[0].original_content_verified,false);
 assert.equal(next.candidates[0].auto_promote_to_emission_factor,false);
 assert.equal(coverage(base,next).missing_prefecture_pdf_sources,31);
 const sandbox={};vm.createContext(sandbox);vm.runInContext(generateBrowserData(next),sandbox);
 assert.equal(sandbox.GX_P28_PREFECTURE_CANDIDATES[0].prefecture_code,'05');
 const fail=(x,code)=>assert.throws(()=>intake(base,current,
  {...input,candidates:[x]},dir),new RegExp(code));
 fail({...source,prefecture_code:'07'},'DUPLICATE_PREFECTURE');
 fail({...source,prefecture_code:'48'},'PREFECTURE_CODE');
 fail({...source,source_url:'https://example.com/pref.pdf'},'NOT_PREFECTURE_GOVERNMENT_URL');
 fail({...source,source_url:'http://www.pref.akita.lg.jp/file.pdf'},'NOT_PREFECTURE_GOVERNMENT_URL');
 fail({...source,year:2025.5},'YEAR');
 fail({...source,local_pdf:'../escape.pdf'},'UNSAFE_PDF_PATH');
 fail({...source,certified_tco2e:1},'FIELDS');
 assert.throws(()=>intake(base,current,{...input,candidates:[source,source]},dir),/DUPLICATE_PREFECTURE/);
 writeFileSync(join(dir,'fake.pdf'),'not valid PDF content at all');
 fail({...source,local_pdf:'./fake.pdf'},'PDF_HEADER_OR_TRAILER');
 const path=join(dir,'input.json');writeFileSync(path,JSON.stringify(input));
 const p=spawnSync(process.execPath,['scripts/p28-prefecture-intake.mjs','preview',path],
  {encoding:'utf8',timeout:15000});
 assert.equal(p.status,0,p.stderr);assert.equal(JSON.parse(p.stdout).missing_prefecture_pdf_sources,31);
 const s=spawnSync(process.execPath,['scripts/p28-prefecture-intake.mjs','status'],
  {encoding:'utf8',timeout:15000});
 assert.equal(s.status,0,s.stderr);assert.equal(JSON.parse(s.stdout).missing_prefecture_pdf_sources,32);
}finally{rmSync(dir,{recursive:true,force:true});}
console.log('NAFT_P28_PREFECTURE_INTAKE_PASS: 47 national, 15 reviewed, 32 pending, safe PDF candidate import');
