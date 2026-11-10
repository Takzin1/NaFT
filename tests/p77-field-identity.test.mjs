import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {
 SCHEMA,newFieldId,emptyFieldRegistry,addField,stageObservation,suggestContinuity,
 proposeLink,reviewLink,attestLineage,addFieldEvidence,assertFieldRegistry,buildPublicReceipt
} from '../scripts/lib/p77-field-identity.mjs';
import {normalizeFudeFeature,importLocalPolygonDataset,sha256File} from '../scripts/p77-fude-local-intake.mjs';

const H=x=>createHash('sha256').update(x).digest('hex');
const f1='fld_aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const f2='fld_bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const f3='fld_cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const f4='fld_dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const source=H('P77 synthetic source file');
const geometry=H('P77 synthetic geometry');
const A='11111111-1111-4111-8111-111111111111';
const B='33333333-3333-4333-8333-333333333333';
const evidence=H('Synthetic evidence bytes');
const obs=(uuid,yr,last=null)=>({polygon_uuid:uuid,issue_year:yr,land_type:100,local_government_cd:'072010',source_file_sha256:source,geometry_sha256:geometry,last_polygon_uuid:last});

test('P77 stable field IDs are independent of changing MAFF annual UUIDs',()=>{
 assert.equal(SCHEMA,'naft-p77-field-identity-v1');
 assert.match(newFieldId(),/^fld_[0-9a-f-]{36}$/);
 let s=emptyFieldRegistry();
 s=addField(s,{field_id:f1,prefecture_code:'07',reference_hash:H('private local reference')});
 s=stageObservation(s,obs(A,2026));
 const obsA=s.observations[0].observation_id;
 assert.equal(suggestContinuity(s,obsA).length,0);
 s=addFieldEvidence(s,{evidence_id:'SYNTHETIC-PHOTO-2026',field_id:f1,evidence_sha256:evidence,evidence_kind:'FIELD_PHOTO',activity_year:2026,source_sha256:source});
 s=proposeLink(s,{field_id:f1,observation_id:obsA,reason:'MANUAL_REVIEW',proposal_basis_sha256:source});
 assert.equal(s.observations[0].approved_field_id,null,'pending is never automatically an approval');
 assert.equal(s.candidates[0].status,'PENDING_HUMAN_REVIEW');
 assert.throws(()=>reviewLink(s,{candidate_id:s.candidates[0].candidate_id,decision:'APPROVE',reviewer_reference_hash:source,decision_evidence_sha256:source,reason:'too short'}),/REVIEW_EVIDENCE_REQUIRED/);
 s=reviewLink(s,{candidate_id:s.candidates[0].candidate_id,decision:'APPROVE',reviewer_reference_hash:H('human reviewer'),decision_evidence_sha256:H('recorded human decision'),reason:'Synthetic reviewer confirmed source linkage'});
 assert.equal(s.observations[0].approved_field_id,f1);
 s=stageObservation(s,obs(B,2027,A));
 const obsB=s.observations[1].observation_id;
 assert.deepEqual(suggestContinuity(s,obsB),[{field_id:f1,observation_id:obsB,reason:'SAME_SHAPE_PREV_UUID',status:'CANDIDATE_REQUIRES_HUMAN_REVIEW'}]);
 s=proposeLink(s,{field_id:f1,observation_id:obsB,reason:'SAME_SHAPE_PREV_UUID',proposal_basis_sha256:H('synthetic annual UUID continuity')});
 assert.equal(s.observations[1].approved_field_id,null,'matching last_polygon_uuid cannot auto-approve');
 s=reviewLink(s,{candidate_id:s.candidates.at(-1).candidate_id,decision:'APPROVE',reviewer_reference_hash:H('human reviewer second year'),decision_evidence_sha256:H('second decision evidence'),reason:'Synthetic reviewer independently checked continuity'});
 assert.equal(s.observations[1].approved_field_id,f1,'durable field id stays stable through annual UUID changes');
 assert.equal(s.evidence[0].field_id,f1,'field evidence remains on durable field id');
 assert.equal(s.evidence[0].evidence_sha256,evidence);
 const receipt=buildPublicReceipt(s);
 assert.equal(receipt.counts.annual_observations,2);
 assert.equal(receipt.counts.links_approved,2);
 assert.equal(receipt.counts.evidence_records,1);
 assert.equal(receipt.original_geometry_disclosed,false);
 assert.equal(receipt.formal_certification,false);
 assert.equal(receipt.certified_tco2e,null);
 assert.ok(!JSON.stringify(receipt).includes(A));
 assert.ok(!JSON.stringify(receipt).includes(f1));
 assertFieldRegistry(s);
 const modified=structuredClone(s);
 modified.events[0].event_hash='f'.repeat(64);
 assert.throws(()=>assertFieldRegistry(modified),/AUDIT_EVENT_TAMPER/);
});

test('P77 split/merge lineage requires human evidence, preserves distinct identities, blocks cycles',()=>{
 let s=emptyFieldRegistry();
 for(const id of [f1,f2,f3,f4])s=addField(s,{field_id:id,prefecture_code:'07',reference_hash:H(id)});
 assert.throws(()=>attestLineage(s,{kind:'SPLIT',source_field_ids:[f1],target_field_ids:[f2,f3],reviewer_reference_hash:'none',evidence_sha256:source,reason:'Synthetic spatial review is pending'}),/LINEAGE_HITL_REQUIRED/);
 s=attestLineage(s,{kind:'SPLIT',source_field_ids:[f1],target_field_ids:[f2,f3],reviewer_reference_hash:H('reviewer'),evidence_sha256:source,reason:'Synthetic split independently attested'});
 assert.deepEqual(s.lineage.map(x=>[x.from,x.to]),[[f1,f2],[f1,f3]]);
 s=attestLineage(s,{kind:'MERGE',source_field_ids:[f2,f3],target_field_ids:[f4],reviewer_reference_hash:H('reviewer'),evidence_sha256:source,reason:'Synthetic merge independently attested'});
 assert.equal(s.lineage.length,4);
 assert.equal(s.fields.length,4);
 assert.throws(()=>attestLineage(s,{kind:'MERGE',source_field_ids:[f2,f4],target_field_ids:[f1],reviewer_reference_hash:H('reviewer'),evidence_sha256:source,reason:'This should create a cycle in lineage'}),/LINEAGE_CYCLE/);
 assert.throws(()=>attestLineage(s,{kind:'SPLIT',source_field_ids:[f1],target_field_ids:[f1,f3],reviewer_reference_hash:H('reviewer'),evidence_sha256:source,reason:'Self relationship must fail review'}),/SELF_LINEAGE/);
 assert.equal(s.observations.length,0,'attested lineage does not invent parcel UUID mappings');
 assertFieldRegistry(s);
});

test('P77 rejects duplicate annual UUIDs, auto-approved claims, double assignment, wrong period and wrong binding',()=>{
 let s=addField(emptyFieldRegistry(),{field_id:f1,prefecture_code:'07',reference_hash:H('ref1')});
 s=addField(s,{field_id:f2,prefecture_code:'07',reference_hash:H('ref2')});
 assert.throws(()=>addField(s,{field_id:f1,prefecture_code:'07',reference_hash:source}),/DUPLICATE_FIELD_ID/);
 assert.throws(()=>stageObservation(s,obs(A,2021)),/ISSUE_YEAR/);
 assert.throws(()=>stageObservation(s,{...obs(A,2026),polygon_uuid:'not-uuid'}),/POLYGON_UUID_V4/);
 assert.throws(()=>stageObservation(s,{...obs(A,2026),source_file_sha256:'invalid'}),/SOURCE_OR_GEOMETRY_SHA/);
 s=stageObservation(s,obs(A,2026));
 assert.throws(()=>stageObservation(s,obs(A,2027)),/UUID_REUSED_ACROSS_YEARS/);
 const id=s.observations[0].observation_id;
 assert.throws(()=>proposeLink(s,{field_id:f1,observation_id:id,reason:'SAME_SHAPE_PREV_UUID',proposal_basis_sha256:source}),/PREVIOUS_UUID_NOT_ATTESTED/);
 s=proposeLink(s,{field_id:f1,observation_id:id,reason:'MANUAL_REVIEW',proposal_basis_sha256:source});
 s=proposeLink(s,{field_id:f2,observation_id:id,reason:'MANUAL_REVIEW',proposal_basis_sha256:source});
 const attrs={decision:'APPROVE',reviewer_reference_hash:H('reviewer'),decision_evidence_sha256:H('decision'),reason:'Explicit synthetic review acceptance'};
 s=reviewLink(s,{candidate_id:s.candidates[0].candidate_id,...attrs});
 assert.throws(()=>reviewLink(s,{candidate_id:s.candidates[1].candidate_id,...attrs}),/OBSERVATION_ALREADY_LINKED/);
 assert.throws(()=>proposeLink(s,{field_id:f2,observation_id:id,reason:'MANUAL_REVIEW',proposal_basis_sha256:source}),/OBSERVATION_ALREADY_APPROVED/);
 const faked=structuredClone(s);faked.formal_certification=true;
 assert.throws(()=>assertFieldRegistry(faked),/FALSE_CERTIFICATION_CLAIM/);
 assertFieldRegistry(s);
});

test('P77 offline importer validates geometry, year, MAFF attributes and never retains coordinates',async()=>{
 const path='fixtures/p77-fude-2026-synthetic.geojsons';
 const fileHash=await sha256File(path);
 assert.match(fileHash,/^[0-9a-f]{64}$/);
 const features=readFileSync(path,'utf8').trim().split('\n').map(JSON.parse);
 const normalized=normalizeFudeFeature(features[0],{issue_year:2026,source_file_sha256:fileHash});
 assert.equal(normalized.polygon_uuid,A);
 assert.equal(normalized.land_type,100);
 assert.equal(normalized.history_sha256.length,64);
 assert.ok(!JSON.stringify(normalized).includes('140.001'),'geometry redacted from observation');
 assert.throws(()=>normalizeFudeFeature({...features[0],properties:{...features[0].properties,issue_year:2027}},{issue_year:2026,source_file_sha256:fileHash}),/ISSUE_YEAR_MISMATCH/);
 assert.throws(()=>normalizeFudeFeature({...features[0],geometry:{type:'Point',coordinates:[140,37]}},{issue_year:2026,source_file_sha256:fileHash}),/NOT_POLYGON_GEOMETRY/);
 assert.throws(()=>normalizeFudeFeature({...features[0],geometry:{type:'Polygon',coordinates:[[[200,37],[201,37],[201,38],[200,37]]]}},{issue_year:2026,source_file_sha256:fileHash}),/COORDINATE_RANGE/);
 const result=await importLocalPolygonDataset({input_path:path,issue_year:2026,prefecture_code:'07',max_features:10});
 assert.equal(result.state.observations.length,2);
 assert.equal(result.state.candidates.length,0);
 assert.equal(result.receipt.decoded_polygons,2);
 assert.equal(result.receipt.source_file_sha256,fileHash);
 assert.equal(result.receipt.raw_geometry_persisted,false);
 assert.equal(result.receipt.source_crs_attested,false);
 assert.equal(result.receipt.area_ha,null);
 assert.ok(!JSON.stringify(result.state).includes('140.001'));
 assert.ok(!JSON.stringify(result.receipt).includes(A));
 const geo=await importLocalPolygonDataset({input_path:'fixtures/p77-fude-2027-synthetic.geojson',issue_year:2027,prefecture_code:'07',max_features:2});
 assert.equal(geo.state.observations.length,1);
 assert.equal(geo.state.observations[0].last_polygon_uuid,A);
 await assert.rejects(()=>importLocalPolygonDataset({input_path:path,issue_year:2026,prefecture_code:'07',max_features:1}),/MAX_FEATURES_EXCEEDED/);
 await assert.rejects(()=>importLocalPolygonDataset({input_path:path,issue_year:2026,prefecture_code:'13',max_features:10}),/OTHER_PREF_CODE_REQUIRES_REVIEW/);
});

test('P77 CLI returns only redacted research receipt; private output cannot write inside repository',()=>{
 const bin='scripts/p77-fude-local-intake.mjs',input='fixtures/p77-fude-2026-synthetic.geojsons';
 const ok=spawnSync('node',[bin,'--input',input,'--year','2026','--pref','07','--max','10'],{encoding:'utf8',timeout:20000});
 assert.equal(ok.status,0,ok.stderr);
 const receipt=JSON.parse(ok.stdout);
 assert.equal(receipt.decoded_polygons,2);
 assert.equal(receipt.original_geometry_disclosed,false);
 assert.equal(receipt.counts.annual_observations,2);
 assert.ok(!ok.stdout.includes('140.001'));
 const bad=spawnSync('node',[bin,'--input',input,'--year','2026','--pref','07','--private-out','./local-p77-secret.json'],{encoding:'utf8',timeout:20000});
 assert.notEqual(bad.status,0);
 assert.match(bad.stderr,/PRIVATE_OUTPUT_MUST_BE_OUTSIDE_REPOSITORY/);
 const noFile=spawnSync('node',[bin,'--input','no-file.fgb','--year','2026','--pref','07'],{encoding:'utf8',timeout:20000});
 assert.notEqual(noFile.status,0);
 assert.match(noFile.stderr,/INPUT_FILE_MISSING/);
});
