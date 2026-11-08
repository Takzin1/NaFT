'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
for(const name of ['mrv-core','methodology-packs','mrv-compiler','compiler-demo',
                   'incremental-compiler-research']) {
  vm.runInThisContext(fs.readFileSync('src/'+name+'.js','utf8'),{filename:name+'.js'});
}
const basePack=COMPILER_REGISTRY['NAFT-SYNTHETIC@1'];
const registry={'NAFT-SYNTHETIC@1':basePack};
const claims=Array.from({length:40},(_,i)=>syntheticClaim('INC-'+String(i).padStart(3,'0')));
const initial=compileIncrementalResearch(claims,registry);
assert.equal(initial.snapshot.record_count,40);
assert.equal(initial.change_report.recomputed.length,40);
assert.equal(initial.change_report.reused.length,0);
assert.equal(validateIncrementalSnapshot(initial.snapshot),true);
assert.equal(compareIncrementalWithFull(initial.snapshot,claims,registry).status,'MATCH');
assert.ok(initial.snapshot.records.every(r=>r.certified_tco2e===null));
const noChange=compileIncrementalResearch(claims.slice().reverse(),registry,initial.snapshot);
assert.equal(noChange.change_report.recomputed.length,0);
assert.equal(noChange.change_report.reused.length,40);
assert.equal(noChange.snapshot.snapshot_hash,initial.snapshot.snapshot_hash);
const updated=claims.map(x=>clone(x));
updated[5].field.area_ha=updated[5].field.area_ha+1;
const oneChange=compileIncrementalResearch(updated,registry,noChange.snapshot);
assert.deepEqual(oneChange.change_report.recomputed,['INC-005']);
assert.equal(oneChange.change_report.reused.length,39);
assert.equal(oneChange.change_report.invalidated[0].reason,'INPUT_OR_EVIDENCE_CHANGE');
assert.equal(compareIncrementalWithFull(oneChange.snapshot,updated,registry).status,'MATCH');
const evidenceEdit=updated.map(x=>clone(x));
evidenceEdit[9].evidence[0].content += '-CHANGED';
const oneEvidence=compileIncrementalResearch(evidenceEdit,registry,oneChange.snapshot);
assert.deepEqual(oneEvidence.change_report.recomputed,['INC-009']);
assert.equal(compareIncrementalWithFull(oneEvidence.snapshot,evidenceEdit,registry).status,'MATCH');
const nextClaims=evidenceEdit.filter(x=>x.activity.id!=='INC-005');
nextClaims.push(syntheticClaim('INC-040'));
const dropAdd=compileIncrementalResearch(nextClaims,registry,oneEvidence.snapshot);
assert.deepEqual(dropAdd.change_report.removed,['INC-005']);
assert.deepEqual(dropAdd.change_report.added,['INC-040']);
assert.equal(dropAdd.change_report.recomputed.length,1);
assert.equal(dropAdd.change_report.reused.length,39);
assert.equal(compareIncrementalWithFull(dropAdd.snapshot,nextClaims,registry).status,'MATCH');
const changedPack=clone(basePack);
changedPack.parameters.factor.value=changedPack.parameters.factor.value+1;
const packRegistry={'NAFT-SYNTHETIC@1':changedPack};
const factorUpdated=compileIncrementalResearch(nextClaims,packRegistry,dropAdd.snapshot);
assert.equal(factorUpdated.change_report.recomputed.length,40);
assert.equal(factorUpdated.change_report.reused.length,0);
assert.ok(factorUpdated.change_report.invalidated.every(x=>x.reason==='METHODOLOGY_OR_PACK_CHANGE'));
assert.equal(compareIncrementalWithFull(factorUpdated.snapshot,nextClaims,packRegistry).status,'MATCH');
const orphaned=JSON.parse(JSON.stringify(initial.snapshot));orphaned.records[0].document.claim_id='FORGED';
assert.throws(()=>compileIncrementalResearch(claims,registry,orphaned),
  /NAFT_INCREMENTAL_CORRUPT_SNAPSHOT_ENTRY/);
const rootTampered=JSON.parse(JSON.stringify(initial.snapshot));rootTampered.records[0].input_hash='f'.repeat(64);
assert.throws(()=>compileIncrementalResearch(claims,registry,rootTampered),
  /NAFT_INCREMENTAL_SNAPSHOT_HASH_MISMATCH/);
assert.throws(()=>compileIncrementalResearch([claims[0],claims[0]],registry),
  /NAFT_INCREMENTAL_CLAIM_ID_OR_DUPLICATE/);
assert.throws(()=>compileIncrementalResearch([claims[0]],{}),
  /NAFT_INCREMENTAL_MISSING_OR_INVALID_PACK/);
assert.equal(compareIncrementalWithFull(oneChange.snapshot,claims,registry).status,'MISMATCH');
const s=incSupportView([
  {tuple_id:'a→c',derivation_id:'path-via-b'},
  {tuple_id:'a→c',derivation_id:'path-via-d'},
  {tuple_id:'a→e',derivation_id:'path-only-e'}
]);
assert.deepEqual(s.tuples.map(x=>[x.tuple_id,x.derivation_count]),
  [['a→c',2],['a→e',1]]);
const first=updateResearchSupports(s,{remove:['path-via-b']});
assert.deepEqual(first.delta.deleted_tuples,[]);
assert.equal(first.view.tuples[0].derivation_count,1);
const second=updateResearchSupports(first.view,{remove:['path-via-d']});
assert.deepEqual(second.delta.deleted_tuples,['a→c']);
const third=updateResearchSupports(second.view,{add:[
  {tuple_id:'a→c',derivation_id:'new-proof'}]});
assert.deepEqual(third.delta.inserted_tuples,['a→c']);
assert.equal(incValidateSupportView(third.view),true);
assert.equal(third.view.view_hash,incSupportView(third.view.derivations).view_hash);
assert.throws(()=>updateResearchSupports(s,{remove:['unknown']}),
  /NAFT_INCREMENTAL_UNKNOWN_OR_DUPLICATE_REMOVAL/);
const wrongSupport=JSON.parse(JSON.stringify(s));wrongSupport.tuples[0].derivation_count=999;
assert.throws(()=>updateResearchSupports(wrongSupport,{remove:[]}),
  /NAFT_INCREMENTAL_TAMPERED_SUPPORT_VIEW/);
const registryMeta=JSON.parse(fs.readFileSync('research/literature-2026-11-08/incremental-foundations.json'));
assert.equal(registryMeta.source_count,3);
assert.ok(registryMeta.sources.every(x=>/^[a-f0-9]{64}$/.test(x.local_pdf_sha256)&&
 x.redistribute_pdf===false));
assert.equal(registryMeta.ghg_methodology_approved,false);
console.log('INCREMENTAL_COMPILER_RESEARCH_PASS: 40 claims, no-change reuse, field/evidence/Pack edits, independent full oracle, alternatives, tamper/duplicate gates');
