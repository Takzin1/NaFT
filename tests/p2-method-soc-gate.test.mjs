import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {stableJson} from '../scripts/lib/research-readiness-report.mjs';
import {
 loadGovernanceRegistry,checkGovernanceRegistry,
 buildMethodSocGate,verifyMethodSocGate,renderMethodSocGateJa
} from '../scripts/p2-method-soc-gate.mjs';

let tests=0;
function eq(actual,expected){assert.deepEqual(actual,expected);tests++;}
function denied(cb,reason){assert.throws(cb,new RegExp(reason));tests++;}
const registry=loadGovernanceRegistry();
const snapshot=JSON.stringify(registry);
eq(checkGovernanceRegistry(registry),true);
eq(registry.jcredit.current_official_version,'UNKNOWN');
eq(registry.jcredit.current_adoption_verified,false);
eq(registry.gold_standard.update_document_bytes_verified,false);
eq(registry.gold_standard.formal_soc_method_calculation_enabled,false);
eq(registry.jcredit.history.map(x=>x.version),['3.1','3.3','3.4','3.5']);
const soil=()=>Object.fromEntries(registry.gold_standard.checklist.map(x=>[x.id,'MISSING']));
const request=version=>({schema:'naft-p2-method-soc-gate-request-v1',
 ag005_reference_version:version,soil_evidence:soil()});
for(const candidate of registry.jcredit.history){
 const req=request(candidate.version);
 const result=buildMethodSocGate(req);
 eq(result.jcredit.candidate,candidate.version);
 eq(result.jcredit.candidate_source_kind,candidate.source_kind);
 eq(result.jcredit.official_use_allowed,false);
 eq(result.jcredit.candidate_is_confirmed_current,false);
 eq(result.gold_standard.screening_missing,4);
 eq(result.gold_standard.screening_unverified,0);
 eq(result.gold_standard.official_method_eligibility,false);
 eq(result.gold_standard.quantified_soc_loss_tco2e,null);
 eq(result.officially_certified_tco2e,null);
 eq(result.credit_issuance,null);
 eq(result.p2_preflight_sha256.length,64);
 eq(result.jcredit.original_pdf_hash_pinned_for_candidate,candidate.version==='3.1');
 eq(result.source_publisher_attestation_verified,false);
 eq(result,buildMethodSocGate(req));
 eq(verifyMethodSocGate(req,result).status,'SOURCE_GATES_REEXECUTED_MATCH');
 denied(()=>verifyMethodSocGate(req,{...result,officially_certified_tco2e:999}),
  'DECISION_REPLAY_MISMATCH');
 const altered=JSON.parse(JSON.stringify(result));
 altered.gold_standard.screening[0].independently_verified=true;
 denied(()=>verifyMethodSocGate(req,altered),'DECISION_REPLAY_MISMATCH');
}
const req=request('3.3');for(const k of Object.keys(req.soil_evidence)){
 req.soil_evidence[k]='PROVIDED_UNVERIFIED';
}
const unverified=buildMethodSocGate(req);
eq(unverified.gold_standard.screening_missing,0);
eq(unverified.gold_standard.screening_unverified,4);
eq(unverified.gold_standard.screening.every(x=>x.independently_verified===false),true);
eq(unverified.officially_certified_tco2e,null);
eq(unverified.gold_standard.quantified_soc_loss_tco2e,null);
const md=renderMethodSocGateJa(unverified);
assert.match(md,/現行採択版：UNKNOWN/);tests++;
assert.match(md,/SOC資料提出済み・未検証：4項目/);tests++;
assert.match(md,/certified_tco2e: null/);tests++;
denied(()=>renderMethodSocGateJa({...unverified,credit_issuance:2}),'REPORT_INTEGRITY');
denied(()=>buildMethodSocGate({...req,ag005_reference_version:'4.0'}),
 'UNKNOWN_AG005_VERSION');
denied(()=>buildMethodSocGate({...req,soil_evidence:{...req.soil_evidence,SOC_NEW:'MISSING'}}),
 'SOC_EVIDENCE_KEYS');
denied(()=>buildMethodSocGate({...req,soil_evidence:{...req.soil_evidence,SOC_PROJECT:'INDEPENDENTLY_VERIFIED'}}),
 'UNVERIFIED_SOURCE_STATUS_ONLY');
denied(()=>buildMethodSocGate({...req,certified_tco2e:123}),
 'REQUEST_EXACT_KEYS');
denied(()=>buildMethodSocGate({...req,soil_evidence:{...req.soil_evidence,__proto__:'x'}}),
 'SOC_EVIDENCE_KEYS');
const registryFake=structuredClone(registry);
registryFake.jcredit.current_adoption_verified=true;
denied(()=>buildMethodSocGate(request('3.3'),registryFake),'JCREDIT_CURRENT_SOURCE_NOT_VERIFIED');
const fakeSOC=structuredClone(registry);
fakeSOC.gold_standard.formal_soc_method_calculation_enabled=true;
denied(()=>buildMethodSocGate(request('3.3'),fakeSOC),'GOLD_SOC_SCOPE_NOT_VERIFIED');
const fakeVersion=structuredClone(registry);
fakeVersion.jcredit.history[2].source_kind='CURRENT_VERIFIED';
denied(()=>buildMethodSocGate(request('3.4'),fakeVersion),'JCREDIT_VERSION_SOURCE_METADATA_CHANGED');
eq(JSON.stringify(registry),snapshot);
eq(stableJson(buildMethodSocGate(request('3.1'))),
 stableJson(buildMethodSocGate(request('3.1'))));

const cmd=(...args)=>spawnSync(process.execPath,['scripts/p2-method-soc-gate.mjs',...args],
 {encoding:'utf8',timeout:15000,maxBuffer:300000});
const dir=mkdtempSync(join(tmpdir(),'naft-p2-method-soc-'));
try{
 const inp=join(dir,'request.json'),out=join(dir,'receipt.json');
 writeFileSync(inp,JSON.stringify(request('3.3')));
 const generated=cmd('generate',inp);eq(generated.status,0);
 const report=JSON.parse(generated.stdout);
 eq(report,buildMethodSocGate(request('3.3')));
 writeFileSync(out,generated.stdout);
 const verified=cmd('verify',inp,out);eq(verified.status,0);
 eq(JSON.parse(verified.stdout).status,'SOURCE_GATES_REEXECUTED_MATCH');
 const rendered=cmd('markdown',inp);eq(rendered.status,0);
 eq(rendered.stdout,renderMethodSocGateJa(report)+'\n');
 writeFileSync(out,JSON.stringify({...report,credit_issuance:100}));
 const forged=cmd('verify',inp,out);
 eq(forged.status!==0,true);
 eq(forged.stderr.includes('DECISION_REPLAY_MISMATCH'),true);
 writeFileSync(inp,JSON.stringify({...request('3.3'),ag005_reference_version:'9.9'}));
 const bad=cmd('generate',inp);eq(bad.status!==0,true);
 eq(bad.stdout,'');
}finally{rmSync(dir,{recursive:true,force:true});}
console.log('NAFT_P2_METHOD_SOC_GATE_PASS: '+tests+' checks, 4 candidate refs, 4 SOC boundaries, zero formal claims');
