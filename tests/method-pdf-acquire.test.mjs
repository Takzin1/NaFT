import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {listSources,acquireSource,acquireBatch,compareSnapshots} from '../scripts/method-pdf-acquire.mjs';
const pdf=Buffer.from('%PDF-1.7\nsynthetic test fixture\n%%EOF\n');
const pdf2=Buffer.from('%PDF-1.7\nchanged synthetic fixture\n%%EOF\n');
const ok=b=>new Response(b,{status:200,headers:{'content-type':'application/pdf'}});
const id='AG005_33_PC';

test('catalog uses fixed HTTPS sources and unknown IDs never request',async()=>{
 const a=listSources();assert.equal(a.length,6);assert.equal(new Set(a.map(s=>s.id)).size,6);
 assert.ok(a.every(s=>new URL(s.url).protocol==='https:'));
 let called=false;await assert.rejects(acquireSource('https://evil.invalid',{request:()=>{called=true}}),/UNKNOWN_SOURCE/);assert.equal(called,false);
});
test('403, redirects, HTML, oversized and malformed content are rejected',async()=>{
 const variants=[
 [new Response('blocked',{status:403}),'HTTP_UNAVAILABLE'],
 [new Response(null,{status:302,headers:{location:'https://evil.invalid'}}),'REDIRECT_BLOCKED'],
 [new Response('<html>fake</html>',{status:200,headers:{'content-type':'text/html'}}),'CONTENT_TYPE_REJECTED'],
 [new Response(pdf,{status:200,headers:{'content-type':'application/pdf','content-length':'99999999'}}),'SIZE_LIMIT'],
 [ok(Buffer.from('%PDF-1.7\nno trailer')),'PDF_REJECTED']
 ];
 for(const [response,status] of variants){
  const x=await acquireSource(id,{request:async(url,o)=>{assert.equal(o.redirect,'manual');assert.equal(o.credentials,'omit');return response}});
  assert.equal(x.receipt.status,status);assert.equal(x.bytes,undefined);assert.equal(x.receipt.certified_tco2e,null);
 }
 let x=await acquireSource(id,{request:async()=>{throw Error('network')}});assert.equal(x.receipt.status,'NETWORK_UNAVAILABLE');
});
test('raw bytes hash, known pin mismatch quarantine, no promotion',async()=>{
 let x=await acquireSource(id,{request:async()=>ok(pdf)});
 assert.equal(x.receipt.raw_pdf_sha256,createHash('sha256').update(pdf).digest('hex'));
 assert.deepEqual(x.bytes,pdf);assert.equal(x.receipt.official_adoption_verified,false);
 x=await acquireSource('AG005_31_PC',{request:async()=>ok(pdf)});
 assert.equal(x.receipt.status,'PIN_CONFLICT_BLOCKED');assert.equal(x.bytes,undefined);assert.deepEqual(x.quarantine,pdf);
});
test('private batch persistence, replay, byte delta, tamper and cross-family guards',async()=>{
 const root=mkdtempSync(join(tmpdir(),'naft-acq-test-'));
 try{
  const a=await acquireBatch([id],root,{request:async()=>ok(pdf)});
  const b=await acquireBatch([id,'FO001_64_CANDIDATE'],root,{request:async()=>ok(pdf2)});
  const ap=join(a.directory,'receipts.json'),bp=join(b.directory,'receipts.json');
  const result=compareSnapshots(ap,id,bp,id);assert.equal(result.byte_changed,true);assert.equal(result.semantic_diff_verified,false);assert.equal(result.rule_pack_release_allowed,false);
  assert.throws(()=>compareSnapshots(ap,id,bp,'FO001_64_CANDIDATE'),/INCOMPARABLE_SOURCES/);
  writeFileSync(join(a.directory,a.receipts[0].local_filename),pdf2);
  assert.throws(()=>compareSnapshots(ap,id,bp,id),/PDF_FILE|BYTE_REPLAY_MISMATCH/);
  await assert.rejects(acquireBatch([id],'.',{request:async()=>ok(pdf)}),/OUTSIDE_REPOSITORY_REQUIRED/);
 }finally{rmSync(root,{recursive:true,force:true});}
});
