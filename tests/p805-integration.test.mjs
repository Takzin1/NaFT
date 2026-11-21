import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import * as F from '../scripts/lib/forest-stand-identity.mjs';

const SHA='a'.repeat(64);
const obs=(id,pref,key)=>({observation_id:id,prefecture_code:pref,plan_year:2026,
 local_key:key,geometry_sha256:null,map_state:'NOT_JOINED',review_state:'STAGED'});
const feat=(key,hash)=>({local_key:key,geometry_sha256:hash});

test('P80.5: provenance hashes the original bytes, including non-UTF-8 bytes',()=>{
 const raw=readFileSync('fixtures/p78-forest-register-2027-synthetic-sjis.csv');
 assert.equal(F.digest(raw),createHash('sha256').update(raw).digest('hex'));
 assert.equal(F.digest(Buffer.from('abc')),'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
 assert.notEqual(F.digest(raw),F.digest(JSON.stringify(raw)));
});

test('P80.5: map updates are isolated to the prefecture and clear obsolete geometry',()=>{
 let s=F.stageObservations(F.emptyStandRegistry(),[
  obs('o20a','20','20999-1-1-0'),obs('o20b','20','20999-1-2-0'),obs('o21','21','21999-1-1-0')
 ]);
 const p20=[feat('20999-1-1-0',SHA),feat('20999-1-2-0','b'.repeat(64))];
 s=F.applyPlanMap(s,2026,p20,SHA,'20').state;
 assert.equal(s.observations.find(o=>o.observation_id==='o21').map_state,'NOT_JOINED');
 assert.equal(s.observations.find(o=>o.observation_id==='o20b').geometry_sha256,'b'.repeat(64));
 assert.throws(()=>F.applyPlanMap(s,2026,p20,SHA,'21'),/MAP_PREF_SCOPE/);
 assert.throws(()=>F.applyPlanMap(s,2026,p20,SHA),/MAP_PREF_CODE/);
 s=F.applyPlanMap(s,2026,[p20[0]],SHA,'20').state;
 assert.equal(s.observations.find(o=>o.observation_id==='o20b').geometry_sha256,null);
 assert.equal(s.observations.find(o=>o.observation_id==='o20b').map_state,'NO_POLYGON');
 assert.equal(s.observations.find(o=>o.observation_id==='o21').map_state,'NOT_JOINED');
});

test('P80.5: public forest receipt never reveals key or unclassified source label',()=>{
 const s=F.stageObservations(F.emptyStandRegistry(),[obs('o20a','20','20999-1-1-0')]);
 const result=F.buildPublicReceipt(s,{
  duplicate_local_keys:['20999-1-1-0'],unmapped_forest_type:{'秘密の林種':2},
  polygons_without_register:['20999-1-2-0'],register_without_polygon:1
 });
 assert.deepEqual(result.anomalies,{duplicate_local_keys_count:1,polygons_without_register_count:1,unmapped_forest_type_count:2,register_without_polygon:1});
 assert.equal(result.local_keys_disclosed,false);
 assert.ok(!JSON.stringify(result).includes('20999'));
 assert.ok(!JSON.stringify(result).includes('秘密の林種'));
});

test('P80.5: valuation link and AG-005 review panel remain wired together',()=>{
 const ui=readFileSync('src/mrv-ui.js','utf8');
 assert.match(ui,/gxWorklistHydrate/);
 assert.match(ui,/href="valuation\.html"/);
 const run=readFileSync('tests/run.sh','utf8');
 for(const required of ['p78-forest-stand.test.mjs','p79-ag005-text-packs.test.mjs',
 'p80-ag005-farm-log-worklist.test.mjs','p80-valuation.test.mjs','method-pdf-acquire.test.mjs',
 'p805-integration.test.mjs'])assert.ok(run.includes(required),required);
});
