import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const c={TextEncoder,TextDecoder,Uint8Array,console};vm.createContext(c);
for(const f of ['src/mrv-core.js','src/methodology-packs.js','src/mrv-compiler.js','src/compiler-demo.js','src/forest-packs.js','src/ag005-text-packs.js'])vm.runInContext(readFileSync(f,'utf8'),c,{filename:f});
const plain=x=>JSON.parse(JSON.stringify(x));
const base=plain(c.COMPILER_REGISTRY['NAFT-SYNTHETIC@1']);
function packWith(rule){const p=structuredClone(base);p.rules={probe:rule};p.methodology_version='1';return p;}
function evalRule(rule,activityPatch={}){
 const claim=c.syntheticClaim('OP-1','standard');Object.assign(claim.activity,activityPatch);
 const e=c.compileEvidence(claim,packWith(rule)).document.evaluation;
 return {pass:e.rules.find(r=>r.id==='probe').pass,supported:e.rules.find(r=>r.id==='probe').supported,issue:e.issues.find(i=>i.code==='rule:probe')?.detail||null,row:plain(e.rules.find(r=>r.id==='probe'))};
}

test('new comparison operators evaluate deterministically',()=>{
 const cases=[
  [{op:'lte',input:'activity.days',value:10},{days:10},true],[{op:'lte',input:'activity.days',value:9},{days:10},false],
  [{op:'lt',input:'activity.days',value:11},{days:10},true],[{op:'lt',input:'activity.days',value:10},{days:10},false],
  [{op:'neq',input:'activity.stratum',value:'intensive'},{},true],[{op:'neq',input:'activity.stratum',value:'standard'},{},false],
  [{op:'in',input:'activity.stratum',value:['standard','intensive']},{},true],[{op:'in',input:'activity.stratum',value:['intensive']},{},false],
  [{op:'gte',input:'activity.days',input_ref:'activity.floor'},{days:10,floor:10},true],[{op:'gte',input:'activity.days',input_ref:'activity.floor'},{days:9,floor:10},false],
  [{op:'eq',input:'activity.field_id',input_ref:'field.id'},{},true],
 ];
 for(const [rule,patch,expected] of cases){const r=evalRule(rule,patch);assert.equal(r.supported,true,JSON.stringify(rule));assert.equal(r.pass,expected,JSON.stringify(rule));}
 assert.equal(evalRule({op:'gte',input:'activity.days',input_ref:'activity.floor'},{days:9,floor:10}).row.input_ref,'activity.floor');
});

test('malformed or ambiguous rules fail closed as unsupported',()=>{
 for(const rule of [
  {op:'in',input:'activity.stratum',value:'standard'},            // in needs an array
  {op:'gte',input:'activity.days',input_ref:'activity.floor',value:1},// two right-hand sources
  {op:'gte',input:'activity.days',input_ref:'activity.floor',parameter:'minimum_days'},
  {op:'in',input:'activity.stratum',input_ref:'activity.list'},
  {op:'gte',input:'activity.days',input_ref:7},
  {op:'between',input:'activity.days',value:[1,2]}]){
  const r=evalRule(rule,{floor:1,list:['standard']});
  assert.equal(r.supported,false,JSON.stringify(rule));assert.equal(r.pass,false);assert.equal(r.issue,'Unsupported rule operation');
 }
 // Missing referenced input and non-numeric operands fail (not pass).
 assert.equal(evalRule({op:'gte',input:'activity.days',input_ref:'activity.absent'}).pass,false);
 assert.equal(evalRule({op:'neq',input:'activity.absent',value:'x'}).pass,false);
 assert.equal(evalRule({op:'lte',input:'activity.stratum',value:1}).pass,false);
 assert.equal(evalRule({op:'gte',input:'activity.days',input_ref:'__proto__.x'}).pass,false);
});

test('existing rule results keep their exact shape (no input_ref key unless used)',()=>{
 const e=c.compileEvidence(c.syntheticClaim('SHAPE','standard'),c.COMPILER_REGISTRY['NAFT-SYNTHETIC@1']).document.evaluation;
 for(const r of e.rules)assert.deepEqual(Object.keys(r).sort(),['id','input','pass','supported','threshold','value']);
});

test('impact analysis sees changes to an input_ref target',()=>{
 const p=packWith({op:'gte',input:'activity.days',input_ref:'field.min_days'});
 const reg=c.createMethodologyRegistry([p]);
 const claim=c.syntheticClaim('REF-1','standard');claim.field.min_days=5;
 const r=c.analyzeImpact([claim],{type:'field',field_id:claim.field.id,patch:{min_days:20}},reg);
 assert.equal(r.claims[0].requires_reverification,true);
 assert.equal(r.claims[0].status,'UNSUPPORTED');      // 10 days < 20 now fails
});

test('preflight lists Pack inputs and surfaces silently-absent condition inputs',()=>{
 const p=plain(c.packInputPaths(c.FOREST_REGISTRY['FOREST-SYNTHETIC@2']));
 assert.ok(p.required.includes('field.age_class')&&p.required.includes('activity.operation'));
 assert.ok(p.conditions.includes('activity.natural_disturbance'));
 assert.ok(!p.conditions.some(x=>p.required.includes(x)));
 const ag=c.AG005_TEXT_REGISTRY['AG-005@3.3-pc-draft-text'];
 assert.equal(c.preflightClaim(c.ag005PaddyClaim(c.ag005SyntheticPaddy(1),'3.3-pc-draft-text'),ag).status,'READY');
 const broken=c.ag005PaddyClaim(c.ag005SyntheticPaddy(1),'3.3-pc-draft-text');delete broken.activity.extension_start_year;
 const pf=plain(c.preflightClaim(broken,ag));
 assert.equal(pf.status,'INPUT_REQUIRED');assert.deepEqual(pf.missing_required,['activity.extension_start_year']);
 // Known gap made visible: the legacy agricultural demo never sets expert_case / special_process.
 const legacy=plain(c.preflightClaim(c.syntheticClaim('L','standard'),c.COMPILER_REGISTRY['NAFT-SYNTHETIC@2']));
 assert.equal(legacy.status,'CONDITION_INPUT_UNCONFIRMED');
 assert.deepEqual(legacy.missing_conditions,['activity.expert_case','activity.special_process']);
 // Forest claims set every condition input explicitly.
 assert.equal(c.preflightClaim(c.forestStandClaim(c.forestSyntheticStand(59),'2'),c.FOREST_REGISTRY['FOREST-SYNTHETIC@2']).status,'READY');
});
