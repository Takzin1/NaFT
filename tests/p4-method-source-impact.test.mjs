import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {stableJson} from '../scripts/lib/research-readiness-report.mjs';
import {loadGovernanceRegistry} from '../scripts/p2-method-soc-gate.mjs';
import {buildP4SourceImpact,verifyP4SourceImpact,renderP4SourceImpactJa}
 from '../scripts/p4-method-source-impact.mjs';

let count=0;
const eq=(a,b)=>{assert.deepEqual(a,b);count++};
const rejected=(fn,reason)=>{assert.throws(fn,new RegExp(reason));count++};
const old=JSON.parse(readFileSync('fixtures/p3-ag005-unverified-intake-request.json','utf8'));
const gs=JSON.parse(readFileSync('fixtures/p3-gold-soc-unverified-intake-request.json','utf8'));
const r=loadGovernanceRegistry();
const next={...old,candidate_version:'3.4',source_page_url:null};
const oldPdf=Buffer.from('%PDF-1.7\n1 0 obj\n<< /Type /SyntheticHistoricalA >>\nendobj\n%%EOF\n');
const newPdf=Buffer.from('%PDF-1.7\n1 0 obj\n<< /Type /SyntheticHistoricalB >>\nendobj\n%%EOF\n');
const difference=buildP4SourceImpact(old,oldPdf,next,newPdf);
eq(difference.schema,'naft-p4-source-change-impact-plan-v1');
eq(difference.classification,'VERSION_AND_LOCAL_BYTES_CHANGED_REVIEW_REQUIRED');
eq(difference.program,'J_CREDIT_AG005');
eq(difference.local_change_flags,{candidate_version_changed:true,raw_pdf_bytes_changed:true,
 reference_url_changed:true,declared_filename_changed:false});
eq(difference.source_declaration_change_detected,true);
eq(difference.review_candidate_count,7);
eq(difference.review_candidates.map(x=>x.id),[
 'DOCUMENT_PROVENANCE','METHOD_ELIGIBILITY','RULE_PACK_TRANSLATION',
 'FIELD_BASELINE_AND_MONITORING','OBSERVATION_QC','UNCERTAINTY_AND_REPLAY',
 'FINAL_ATTESTATION'
]);
eq(difference.review_candidates.every(x=>x.status==='SOURCE_CHANGE_REVIEW_CANDIDATE'),true);
eq(difference.review_candidates.every(x=>x.actual_clause_change_proven===false),true);
eq(difference.known_clause_level_diff_extracted,false);
eq(difference.scientific_calculation_impact_determined,false);
eq(difference.certified_field_cases_recalculated,0);
eq(difference.independent_publisher_confirmation,false);
eq(difference.current_formal_method_version_verified,false);
eq(difference.safe_to_release_rule_pack,false);
eq(difference.final_attestation_allowed,false);
eq(difference.officially_certified_tco2e,null);
eq(difference.calculated_soc_loss_tco2e,null);
eq(difference.final_credit_issuance,null);
eq(difference.registry_or_financial_action,false);
eq(difference.baseline.pdf_sha256,createHash('sha256').update(oldPdf).digest('hex'));
eq(difference.candidate.pdf_sha256,createHash('sha256').update(newPdf).digest('hex'));
const {plan_sha256,...unsigned}=difference;
eq(plan_sha256,createHash('sha256').update(stableJson(unsigned)).digest('hex'));
eq(difference,buildP4SourceImpact(old,oldPdf,next,newPdf));
eq(verifyP4SourceImpact(old,oldPdf,next,newPdf,difference).status,
 'LOCAL_INPUTS_AND_IMPACT_CANDIDATES_REPRODUCED');
const unchanged=buildP4SourceImpact(old,oldPdf,old,oldPdf);
eq(unchanged.classification,'NO_LOCAL_REFERENCE_CHANGE_OFFICIAL_REVIEW_STILL_REQUIRED');
eq(unchanged.source_declaration_change_detected,false);
eq(unchanged.review_candidates.every(x=>x.status==='OFFICIAL_SOURCE_REVIEW_STILL_REQUIRED'),true);
eq(unchanged.safe_to_release_rule_pack,false);
eq(unchanged.officially_certified_tco2e,null);
const mutable=buildP4SourceImpact(old,oldPdf,old,newPdf);
eq(mutable.classification,'UNEXPLAINED_SAME_VERSION_LABEL_DIFFERENT_BYTES_BLOCKED');
eq(mutable.local_change_flags.candidate_version_changed,false);
eq(mutable.local_change_flags.raw_pdf_bytes_changed,true);
const versionOnly=buildP4SourceImpact(old,oldPdf,next,oldPdf);
eq(versionOnly.classification,'VERSION_LABEL_CHANGED_IDENTICAL_BYTES_REVIEW_REQUIRED');
eq(versionOnly.local_change_flags.candidate_version_changed,true);
eq(versionOnly.local_change_flags.raw_pdf_bytes_changed,false);
const nameChange=buildP4SourceImpact(old,oldPdf,{...old,declared_filename:'renamed-example.pdf'},oldPdf);
eq(nameChange.classification,'SOURCE_DECLARATION_METADATA_CHANGED_REVIEW_REQUIRED');
eq(nameChange.local_change_flags.declared_filename_changed,true);
const gsChanged=buildP4SourceImpact(gs,oldPdf,gs,newPdf);
eq(gsChanged.program,'GOLD_STANDARD_SOC');
eq(gsChanged.classification,'UNEXPLAINED_SAME_VERSION_LABEL_DIFFERENT_BYTES_BLOCKED');
eq(gsChanged.review_candidate_count,8);
eq(gsChanged.review_candidates.some(x=>x.id==='SOIL_CARBON_ACCOUNTING'),true);
eq(gsChanged.officially_certified_tco2e,null);
const markdown=renderP4SourceImpactJa(difference);
assert.match(markdown,/原典ファイルのローカルバイト差分/);count++;
assert.match(markdown,/影響候補：7項目/);count++;
assert.match(markdown,new RegExp(difference.plan_sha256));count++;
rejected(()=>renderP4SourceImpactJa({...difference,officially_certified_tco2e:1}),
 'PLAN_HASH_MISMATCH');
rejected(()=>verifyP4SourceImpact(old,oldPdf,next,newPdf,
 {...difference,safe_to_release_rule_pack:true}),'IMPACT_PLAN_REPLAY_MISMATCH');
rejected(()=>verifyP4SourceImpact(old,oldPdf,next,oldPdf,difference),'IMPACT_PLAN_REPLAY_MISMATCH');
rejected(()=>buildP4SourceImpact(old,oldPdf,gs,newPdf),'CROSS_PROGRAM_DIFF_NOT_COMPARABLE');
rejected(()=>buildP4SourceImpact(old,oldPdf,{...next,candidate_version:'4.0'},newPdf),
 'UNKNOWN_JCREDIT_VERSION');
rejected(()=>buildP4SourceImpact({...old,acquisition:'INDEPENDENTLY_VERIFIED'},oldPdf,next,newPdf),
 'REQUEST_UNTRUSTED_ACQUISITION');
const alteredRegistry=structuredClone(r);alteredRegistry.jcredit.current_adoption_verified=true;
rejected(()=>buildP4SourceImpact(old,oldPdf,next,newPdf,alteredRegistry),
 'JCREDIT_CURRENT_SOURCE_NOT_VERIFIED');
eq(JSON.stringify(r),JSON.stringify(loadGovernanceRegistry()));
const cli=(...args)=>spawnSync(process.execPath,['scripts/p4-method-source-impact.mjs',...args],
 {encoding:'utf8',timeout:15000,maxBuffer:250000});
const dir=mkdtempSync(join(tmpdir(),'naft-p4-source-change-'));
try{
 const oldReq=join(dir,'old.json'),newReq=join(dir,'new.json'),
  pOld=join(dir,'old.pdf'),pNew=join(dir,'new.pdf'),plan=join(dir,'plan.json');
 writeFileSync(oldReq,JSON.stringify(old));writeFileSync(newReq,JSON.stringify(next));
 writeFileSync(pOld,oldPdf);writeFileSync(pNew,newPdf);
 const gen=cli('generate',oldReq,pOld,newReq,pNew);
 eq(gen.status,0);
 eq(JSON.parse(gen.stdout),difference);
 writeFileSync(plan,gen.stdout);
 const valid=cli('verify',oldReq,pOld,newReq,pNew,plan);
 eq(valid.status,0);
 eq(JSON.parse(valid.stdout).plan_sha256,difference.plan_sha256);
 const md=cli('markdown',oldReq,pOld,newReq,pNew);
 eq(md.status,0);eq(md.stdout,markdown+'\n');
 writeFileSync(pNew,oldPdf);
 const tamperedSource=cli('verify',oldReq,pOld,newReq,pNew,plan);
 eq(tamperedSource.status!==0,true);
 eq(tamperedSource.stderr.includes('IMPACT_PLAN_REPLAY_MISMATCH'),true);
 writeFileSync(pNew,newPdf);
 writeFileSync(plan,JSON.stringify({...difference,final_credit_issuance:999}));
 const forged=cli('verify',oldReq,pOld,newReq,pNew,plan);
 eq(forged.status!==0,true);
 writeFileSync(plan,gen.stdout);
 const linked=join(dir,'source-symlink.pdf');symlinkSync(pOld,linked);
 const blocked=cli('generate',oldReq,linked,newReq,pNew);
 eq(blocked.status!==0,true);
 eq(blocked.stderr.includes('LOCAL_FILE_UNSAFE_OR_TOO_LARGE'),true);
 const missing=cli('generate',oldReq,pOld);
 eq(missing.status!==0,true);
}finally{rmSync(dir,{recursive:true,force:true})}
console.log('NAFT_P4_SOURCE_IMPACT_PASS: '+count+
 ' checks; 7+1 evidence domains, same-version drift blocked, zero official claims');
