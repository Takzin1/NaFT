import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

function load(){
 const ctx={TextEncoder,TextDecoder,Uint8Array,console};vm.createContext(ctx);
 for(const f of ['src/mrv-core.js','src/methodology-packs.js','src/mrv-compiler.js','src/ag005-text-packs.js'])vm.runInContext(readFileSync(f,'utf8'),ctx,{filename:f});
 return ctx;
}
const plain=x=>JSON.parse(JSON.stringify(x));
const c=load();
const K31='AG-005@3.1-pc-text',K33='AG-005@3.3-pc-draft-text';

test('source binding: Ver.3.1 hash is the one pinned in research; Ver.3.3 bytes are not claimed',()=>{
 const p2=JSON.parse(readFileSync('research/method-governance/p2-jcredit-gs-soc-source-boundaries-2026-11-02.json','utf8')).jcredit.history;
 const pinned=p2.find(h=>h.version==='3.1').sha256;
 assert.equal(c.AG005_TEXT_REGISTRY[K31].source_hash,pinned);
 assert.equal(c.AG005_TEXT_REGISTRY[K31].source_hash,c.COMPILER_REGISTRY['AG-005@3.1-reference'].source_hash);
 assert.equal(p2.find(h=>h.version==='3.3').sha256,null);
 assert.equal(c.AG005_TEXT_REGISTRY[K33].source_hash,'UNKNOWN');
 for(const k of [K31,K33]){
  const p=c.AG005_TEXT_REGISTRY[k];
  assert.equal(p.status,'REFERENCE');assert.equal(p.calculation_spec.result,null);
  assert.equal(p.parameters.emission_factors.status,'CONFIG_REQUIRED');
  assert.ok(Object.isFrozen(p));
 }
});

test('every translated item has a clause locator, and nothing else does',()=>{
 for(const k of [K31,K33]){
  const p=c.AG005_TEXT_REGISTRY[k],m=c.AG005_TEXT_CLAUSES[k];
  const items=[...Object.keys(p.rules).map(x=>'rules.'+x),...Object.keys(p.evidence_requirements).map(x=>'evidence_requirements.'+x)].sort();
  assert.deepEqual(Object.keys(m).sort(),items,k);
  assert.ok(Object.values(m).every(v=>/p\.\d/.test(v)),k);
 }
});

test('the structured diff is the Ver.3.3 changes read from the texts (3 additions, 1 removed option)',()=>{
 const d=plain(c.compareMethodologyVersions(c.AG005_TEXT_REGISTRY[K31],c.AG005_TEXT_REGISTRY[K33]));
 assert.deepEqual(d.changed_rules.map(x=>x.id+':'+x.change).sort(),['certification_start_not_before_extension:added','certification_start_within_next_year:removed']);
 assert.deepEqual(d.changed_evidence_requirements.map(x=>x.id+':'+x.change).sort(),['activity_report_list:added','percolation_record_proof:added']);
 assert.deepEqual(d.changed_parameters,[]);                    // 7 days, 2 years, 1.22, 7.5/12.5 unchanged
 assert.ok(c.AG005_TEXT_CLAUSES[K33]['evidence_requirements.percolation_record_proof'].includes('Ver.3.3追加'));
});

test('適用条件1 averaging rounds fractions up and rejects malformed input',()=>{
 assert.deepEqual(plain(c.ag005ExtensionDays(45,[34,35])),{baseline_average_days:35,extension_days:10,baseline_years:2});
 assert.equal(c.ag005ExtensionDays(42,[34,35]).extension_days,7);
 assert.equal(c.ag005ExtensionDays(41,[34,35]).extension_days,6);
 for(const bad of [[45,[]],[45,[34.5]],[-1,[30,30]],['45',[30,30]]])assert.throws(()=>c.ag005ExtensionDays(...bad),/AG005_EXTENSION_INPUT/);
});

test('REFERENCE Packs never certify: every paddy is UNSUPPORTED with a null result under both versions',()=>{
 for(let i=1;i<=48;i++){
  const p=c.ag005SyntheticPaddy(i);
  for(const [k,v] of [[K31,'3.1-pc-text'],[K33,'3.3-pc-draft-text']]){
   const doc=c.compileEvidence(c.ag005PaddyClaim(p,v),c.AG005_TEXT_REGISTRY[k]).document;
   assert.equal(doc.evaluation.status,'UNSUPPORTED');
   assert.equal(doc.calculation.result,null);
   assert.ok(doc.evaluation.issues.some(x=>x.code==='official_configuration'));
  }
 }
});

test('revision triage matches an independent reading of the Ver.3.3 additions',()=>{
 const d=plain(c.ag005RevisionDemo());
 assert.equal(d.rows.length,48);
 for(const r of d.rows){
  const p=c.ag005SyntheticPaddy(Number(r.paddy_id.slice(-3)));
  const expected=[];
  if(p.post_2025_activity)expected.push('missing_evidence:activity_report_list');
  if(p.drainage_basis==='MEASURED')expected.push('missing_evidence:percolation_record_proof');
  if(p.cert_start_year<p.extension_start_year)expected.push('rule:certification_start_not_before_extension');
  assert.deepEqual(r.new_issues,expected.sort(),r.paddy_id);
  // A rule that applies to every paddy was added, so every claim must be re-evaluated (soundness).
  assert.equal(r.requires_reverification,true,r.paddy_id);
  assert.equal(r.triage,!expected.length?'NO_NEW_DEMAND':expected.some(x=>x.startsWith('rule:'))?'RULE_NOT_MET':'NEW_EVIDENCE');
 }
 const t=d.triage;assert.equal(t.NO_NEW_DEMAND+t.NEW_EVIDENCE+t.RULE_NOT_MET,48);
 assert.ok(t.NO_NEW_DEMAND>0&&t.NEW_EVIDENCE>0&&t.RULE_NOT_MET>0,'fixture must exercise all three paths');
 assert.deepEqual(plain(c.ag005RevisionDemo()),d);           // deterministic
});

test('P80 operators: 3.1 next-year upper bound and 3.3 input-to-input comparison are evaluated, not pre-computed',()=>{
 const p=c.ag005SyntheticPaddy(1),late={...p,cert_start_year:p.registration_year+2,years_cert_start_after_registration:2};
 const e31=c.compileEvidence(c.ag005PaddyClaim(late,'3.1-pc-text'),c.AG005_TEXT_REGISTRY[K31]).document.evaluation;
 assert.ok(e31.issues.some(i=>i.code==='rule:certification_start_within_next_year'));
 const e33=c.compileEvidence(c.ag005PaddyClaim(late,'3.3-pc-draft-text'),c.AG005_TEXT_REGISTRY[K33]).document.evaluation;
 assert.ok(!e33.issues.some(i=>i.code.startsWith('rule:certification')));
 const r=plain(e33.rules.find(x=>x.id==='certification_start_not_before_extension'));
 assert.equal(r.input_ref,'activity.extension_start_year');assert.equal(r.threshold,p.extension_start_year);
});

test('agricultural registry and the legacy 3.1-reference Pack are untouched',()=>{
 assert.deepEqual(Object.keys(c.COMPILER_REGISTRY).sort(),['AG-004@UNKNOWN','AG-005@3.1-reference','NAFT-SYNTHETIC@1','NAFT-SYNTHETIC@2']);
 assert.equal(Object.keys(c.COMPILER_REGISTRY['AG-005@3.1-reference'].rules).join(),'reference_extension');
});
