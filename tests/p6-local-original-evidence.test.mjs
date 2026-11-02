import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {stableJson} from '../scripts/lib/research-readiness-report.mjs';
import {
 loadP6SourceRegister,checkP6SourceRegister,buildP6SourceEvidenceReview,
 replayP6SourceEvidenceReview,checkLocalOriginalCopy,renderP6SourceReviewJa
} from '../scripts/p6-local-original-evidence.mjs';
let tests=0;
const eq=(x,y)=>{assert.deepEqual(x,y);tests++};
const denied=(fn,reason)=>{assert.throws(fn,new RegExp(reason));tests++};
const g=loadP6SourceRegister();
const request=JSON.parse(readFileSync('fixtures/p6-verra-original-evidence-review-request.json','utf8'));
const training=JSON.parse(readFileSync('fixtures/p6-gs-training-evidence-review-request.json','utf8'));
eq(checkP6SourceRegister(g),true);
eq(g.source_references.length,3);
eq(g.claims.length,15);
eq(g.source_references.map(x=>x.sha256),[
 '9b9738840824f5919e3a76f8807c68743ae3d64b5d931cda27598f3ab32c64e2',
 '77519262ddf83e00a3dd04f89be7cef46a79f534c50496f1c770325e5f1ef461',
 '532ec2c31daf95d911367b2516a5e0c67d17ba47031457c89d9d55844217478a'
]);
eq(g.source_references.map(x=>x.raw_bytes),[1335524,100924,276403]);
eq(g.source_references.map(x=>x.pages),[90,2,38]);
eq(g.source_references.every(x=>x.file_is_publisher_authenticated===false),true);
eq(g.source_references.every(x=>x.redistribution_license_verified===false),true);
eq(g.raw_originals_committed,false);
eq(g.formal_amount_tco2e,null);
eq(g.issuance,null);
eq(g.p5_bound_clause_ids,['VERRA.VM0051.9.3.1','VERRA.VM0051.9.3.3']);
const r=buildP6SourceEvidenceReview(request);
eq(r.status,'RESEARCH_CLAIMS_REQUIRE_INDEPENDENT_FIELD_AND_METHOD_REVIEW');
eq(r.original_source_id,'VERRA_VM0051_2026');
eq(r.original_file_size,1335524);
eq(r.original_pages,90);
eq(r.claims.length,3);
eq(r.evidence.length,11);
eq(r.evidence_missing,9);
eq(r.evidence_unverified,2);
eq(r.evidence.every(x=>x.independently_verified===false),true);
eq(r.claims.every(x=>x.formal_computational_rule_not_implemented===true),true);
eq(r.source_publisher_original_authenticated,false);
eq(r.current_institutional_adoption_verified,false);
eq(r.officially_certified_tco2e,null);
eq(r.science_derived_emission_result,null);
eq(r.credit_issuance,null);
eq(r.environment_or_financial_change_performed,false);
eq(r.linked_p5_clauses,['VERRA.VM0051.9.3.1']);
eq(r,buildP6SourceEvidenceReview(request));
eq(replayP6SourceEvidenceReview(request,r).status,
 'RESEARCH_ONLY_BYTE_HASH_BOUND_CLAIM_REPLAY_MATCH');
const {review_sha256,...without}=r;
eq(review_sha256,createHash('sha256').update(stableJson(without)).digest('hex'));
const gr=buildP6SourceEvidenceReview(training);
eq(gr.original_source_id,'GS_TRAINING_SCENARIOS');
eq(gr.claims[0].kind,'EDUCATIONAL_ILLUSTRATION_NOT_MEASURED');
eq(gr.officially_certified_tco2e,null);
eq(gr.linked_p5_clauses,[]);
eq(gr.evidence_unverified,2);
const full=structuredClone(request);
for(const k of Object.keys(full.evidence_status))full.evidence_status[k]='PROVIDED_UNVERIFIED';
const fr=buildP6SourceEvidenceReview(full);
eq(fr.evidence_missing,0);
eq(fr.evidence_unverified,11);
eq(fr.source_publisher_original_authenticated,false);
eq(fr.officially_certified_tco2e,null);
const md=renderP6SourceReviewJa(r);
assert.match(md,/正式認証削減量：null/);tests++;
assert.match(md,/VM0051 Appendix 4 Table 9/);tests++;
assert.match(md,new RegExp(r.original_local_copy_sha256));tests++;
denied(()=>renderP6SourceReviewJa({...r,officially_certified_tco2e:123}),'REPORT_HASH_MISMATCH');
denied(()=>replayP6SourceEvidenceReview(request,{...r,credit_issuance:123}),
 'REVIEW_REPLAY_MISMATCH');
denied(()=>replayP6SourceEvidenceReview(training,r),'REVIEW_REPLAY_MISMATCH');
denied(()=>buildP6SourceEvidenceReview({...request,claim_ids:['GS.TRAINING.SCENARIO_2']}),
 'CROSS_SOURCE_OR_UNKNOWN_CLAIM');
denied(()=>buildP6SourceEvidenceReview({...request,claim_ids:['VERRA.4.UNKNOWN']}),
 'CROSS_SOURCE_OR_UNKNOWN_CLAIM');
denied(()=>buildP6SourceEvidenceReview({...request,claim_ids:[request.claim_ids[0],request.claim_ids[0]]}),
 'CLAIM_SELECTION');
denied(()=>buildP6SourceEvidenceReview({...request,evidence_status:{...request.evidence_status,FAKE:'MISSING'}}),
 'EVIDENCE_COVERAGE');
denied(()=>buildP6SourceEvidenceReview({...request,evidence_status:{...request.evidence_status,QC_PROTOCOL:'VERIFIED'}}),
 'SELF_ASSERTED_QC_NOT_PERMITTED');
denied(()=>buildP6SourceEvidenceReview({...request,certified_tco2e:100}),
 'REQUEST_KEYS');
denied(()=>buildP6SourceEvidenceReview({...request,source_id:'UNKNOWN'}),
 'UNKNOWN_SOURCE');
const t=structuredClone(g);t.source_references[0].sha256='a'.repeat(64);
denied(()=>checkP6SourceRegister(t),'SOURCE_HASH_AND_LEGACY_REGISTER_CONFLICT');
const fake=structuredClone(g);fake.source_references[0].file_is_publisher_authenticated=true;
denied(()=>checkP6SourceRegister(fake),'SOURCE_HASH_AND_LEGACY_REGISTER_CONFLICT');
const counterfeit=structuredClone(g);counterfeit.claims[0].official_adoption_inferred=true;
denied(()=>checkP6SourceRegister(counterfeit),'CLAIM_BOUNDARY_OR_ORPHAN');
const overread=structuredClone(g);overread.claims[0].page_end=91;
denied(()=>checkP6SourceRegister(overread),'CLAIM_BOUNDARY_OR_ORPHAN');
const badLink=structuredClone(g);badLink.claims[0].p5_links=['GS.SOC.2.4.1'];
denied(()=>checkP6SourceRegister(badLink),'CLAIM_BOUNDARY_OR_ORPHAN');
const wrongCount=structuredClone(g);wrongCount.claims.pop();
denied(()=>checkP6SourceRegister(wrongCount),'CLAIM_COUNT_OR_DUPLICATE');
const wrongEvidence=structuredClone(g);wrongEvidence.evidence_catalog.pop();
denied(()=>checkP6SourceRegister(wrongEvidence),'EVIDENCE_CATALOG_MISMATCH');
const wrongScope=structuredClone(g);wrongScope.redistribution_authorized=true;
denied(()=>checkP6SourceRegister(wrongScope),'RESEARCH_BOUNDARY');
const tmp=mkdtempSync(join(tmpdir(),'naft-p6-source-'));
const cli=(...args)=>spawnSync(process.execPath,['scripts/p6-local-original-evidence.mjs',...args],
 {encoding:'utf8',timeout:18000,maxBuffer:350000});
try{
 const source=join(tmp,'fake-original.pdf'),req=join(tmp,'req.json'),receipt=join(tmp,'receipt.json');
 writeFileSync(source,Buffer.from('%PDF-1.7\nNot a real institution document\n%%EOF\n'));
 denied(()=>checkLocalOriginalCopy('VERRA_VM0051_2026',source),'FILE_TYPE_OR_SIZE_MISMATCH');
 writeFileSync(req,JSON.stringify(request));
 const generated=cli('generate',req);
 eq(generated.status,0);
 eq(JSON.parse(generated.stdout),r);
 writeFileSync(receipt,generated.stdout);
 const verified=cli('verify',req,receipt);
 eq(verified.status,0);
 eq(JSON.parse(verified.stdout).sha256,r.review_sha256);
 const markdown=cli('markdown',req);
 eq(markdown.status,0);eq(markdown.stdout,md+'\n');
 const checked=cli('verify-original','VERRA_VM0051_2026',source);
 eq(checked.status!==0,true);
 eq(checked.stderr.includes('FILE_TYPE_OR_SIZE_MISMATCH'),true);
 const sym=join(tmp,'link.json');symlinkSync(req,sym);
 const refused=cli('generate',sym);
 eq(refused.status!==0,true);
 eq(refused.stderr.includes('INPUT_FILE'),true);
 writeFileSync(receipt,JSON.stringify({...r,officially_certified_tco2e:1}));
 const forged=cli('verify',req,receipt);
 eq(forged.status!==0,true);
}finally{rmSync(tmp,{recursive:true,force:true});}
console.log('NAFT_P6_ORIGINAL_SOURCE_PASS: '+tests+
 ' checks; user-provided Verra/GS raw hashes crosslinked, no original bytes in CI, official claims blocked');
