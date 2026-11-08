'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
for(const name of ['mrv-core','methodology-packs','mrv-compiler','compiler-demo','provenance-why-where']) {
  vm.runInThisContext(fs.readFileSync('src/'+name+'.js','utf8'),{filename:name+'.js'});
}

const pack=COMPILER_REGISTRY['NAFT-SYNTHETIC@1'];
const input=syntheticClaim('WHY-WHERE-DEMO');
const pkg=compileEvidence(input,pack);
const output=explainCompilerProvenance(pkg,input,pack,'document.calculation.arithmetic_preview');
assert.equal(output.schema,'naft-compiler-provenance-explanation-1');
assert.equal(output.why.scope,'CONSERVATIVE_COMPILER_DEPENDENCIES_NOT_DATABASE_WITNESS_BASIS');
assert.equal(output.where.status,'DERIVED_NOT_COPIED');
assert.deepEqual(output.where.locations,[]);
assert.equal(output.how_provenance,'NOT_IMPLEMENTED');
assert.equal(output.formal_certification,false);
assert.equal(output.certified_tco2e,null);
assert.ok(output.why.nodes.some(x=>x.id==='methodology:NAFT-SYNTHETIC@1'));
assert.ok(output.why.nodes.some(x=>x.id==='evidence:WHY-WHERE-DEMO-record'));
assert.ok(output.why.nodes.some(x=>x.id==='field:FIELD-WHY-WHERE-DEMO'));

const field=explainCompilerProvenance(pkg,input,pack,'document.field_identity.area_ha');
assert.equal(field.where.status,'DIRECT_COPY');
assert.deepEqual(field.where.locations,[{source:'compiler_input',path:'field.area_ha'}]);

const values=explainCompilerProvenance(pkg,input,pack,'document.calculation_inputs.values.0');
assert.equal(values.where.status,'DIRECT_COPY');
assert.deepEqual(values.where.locations,[{source:'compiler_input',path:pack.calculation_spec.inputs[0]}]);

const param=explainCompilerProvenance(pkg,input,pack,'document.calculation_inputs.parameters.factor');
assert.deepEqual(param.where.locations,[{source:'methodology_pack',path:'parameters.factor.value'}]);

const overridden=clone(input);
overridden.parameter_overrides={factor:3};
const overridePkg=compileEvidence(overridden,pack);
const overrideReceipt=explainCompilerProvenance(overridePkg,overridden,pack,
  'document.calculation_inputs.parameters.factor');
assert.deepEqual(overrideReceipt.where.locations,[{source:'compiler_input',path:'parameter_overrides.factor'}]);

assert.deepEqual(minimalProvenanceWitnesses(
  [['a','b'],['b','a'],['a'],['c'],['a','c'],['a']]),[['a'],['c']]);

const witness=compilerRequirementWitnesses(pkg,input,pack);
assert.equal(witness.status,'REQUIREMENTS_WITNESSED');
assert.ok(witness.minimal_witnesses.some(s=>s.includes('evidence:WHY-WHERE-DEMO-record')));
assert.ok(!witness.minimal_witnesses.some(s=>s.includes('evidence:other-claim')));

const alternative=clone(input);
const extra=clone(alternative.evidence[0]);extra.id='WHY-WHERE-DEMO-record-2';
alternative.evidence.push(extra);
const altPkg=compileEvidence(alternative,pack);
const alt=compilerRequirementWitnesses(altPkg,alternative,pack);
assert.equal(alt.minimal_witnesses.length,2);
assert.deepEqual(alt.minimal_witnesses,
  [['evidence:WHY-WHERE-DEMO-record'],['evidence:WHY-WHERE-DEMO-record-2']]);

const missing=clone(input);missing.evidence=[];
const missingPkg=compileEvidence(missing,pack);
const miss=compilerRequirementWitnesses(missingPkg,missing,pack);
assert.equal(miss.status,'MISSING_REQUIRED_EVIDENCE');
assert.deepEqual(miss.minimal_witnesses,[]);

const nonexistent=explainCompilerProvenance(pkg,input,pack,'document.calculation.unit');
assert.equal(nonexistent.where.status,'UNSUPPORTED_COPY_MAPPING');
assert.deepEqual(nonexistent.where.locations,[]);

const tampered=clone(pkg);tampered.document.calculation.arithmetic_preview=999;
assert.throws(()=>explainCompilerProvenance(tampered,input,pack,
  'document.calculation.arithmetic_preview'),/PROVENANCE_STALE_PACKAGE/);
assert.throws(()=>explainCompilerProvenance(pkg,overridden,pack,
  'document.calculation.arithmetic_preview'),/PROVENANCE_STALE_PACKAGE/);
assert.throws(()=>explainCompilerProvenance(pkg,input,pack,'__proto__'),
  /PROVENANCE_INVALID_OUTPUT_PATH/);
assert.throws(()=>compilerRequirementWitnesses(altPkg,alternative,pack,1),
  /PROVENANCE_WITNESS_LIMIT_EXCEEDED/);

const meta=JSON.parse(fs.readFileSync('research/literature-2026-11-08/provenance-foundations.json'));
assert.equal(meta.sources.length,2);
assert.equal(meta.ingest_mode,'METADATA_AND_DESIGN_RATIONALE_ONLY');
assert.ok(meta.sources.every(s=>s.redistribute_pdf===false &&
 s.engine_integration==='RESEARCH_DESIGN_ONLY' && /^[a-f0-9]{64}$/.test(s.uploaded_local_sha256)));
assert.deepEqual(meta.sources.map(s=>s.identifier).sort(),
 ['10.1007/3-540-44503-X_20','10.1561/1900000006'].sort());
console.log('WHY_WHERE_PROVENANCE_PASS: graph lineage, copy origins, minimal witnesses, change rejection, research boundary');
