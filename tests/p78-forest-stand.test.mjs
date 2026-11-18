import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {readFileSync,mkdtempSync,writeFileSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import vm from 'node:vm';
import * as F from '../scripts/lib/forest-stand-identity.mjs';
import {main as cli} from '../scripts/forest-stand-cli.mjs';

const PROFILE=JSON.parse(readFileSync('config/forest-register-profiles/synthetic-v1.json','utf8'));
const SJIS={...PROFILE,encoding:'shift_jis'};
const H=s=>F.digest(s);
const csv2026=readFileSync('fixtures/p78-forest-register-2026-synthetic.csv');
const csv2027=readFileSync('fixtures/p78-forest-register-2027-synthetic-sjis.csv');
const mapLines=readFileSync('fixtures/p78-forest-plan-2026-synthetic.geojsons','utf8').trim().split('\n').map(l=>JSON.parse(l));
const reg=(bytes,profile,year)=>F.normalizeRegister(F.decodeRegisterBytes(bytes,profile.encoding),profile,{prefecture_code:'20',plan_year:year,source_file_sha256:H(bytes)});
const blocked=(fn,code)=>assert.throws(fn,e=>e.message.includes(code),code);

function compiler(){
 const ctx={TextEncoder,TextDecoder,Uint8Array,console};vm.createContext(ctx);
 for(const f of ['src/mrv-core.js','src/methodology-packs.js','src/mrv-compiler.js','src/forest-packs.js'])vm.runInContext(readFileSync(f,'utf8'),ctx,{filename:f});
 return ctx;
}

test('synthetic register fixtures retain original CRLF and encoded Git blob bytes',()=>{
 const fixtures=[[csv2026,'5c630923d310910f8e11077fdbdfffd86e6d5bb0'],[csv2027,'b9147d2f459ecf55c41b870b65bb7eb70e4653e3']];
 for(const [bytes,expected] of fixtures){
  const actual=createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
  assert.equal(actual,expected,'fixture bytes changed');
  assert.ok(bytes.includes(Buffer.from('\r\n')));
  assert.equal(bytes.toString('latin1').replace(/\r\n/g,'').includes('\n'),false,'mixed line endings');
 }
 assert.equal(F.decodeRegisterBytes(csv2026,'utf-8').split(',')[0],'市町村コード');
 assert.equal(F.decodeRegisterBytes(csv2027,'shift_jis').split(',')[0],'市町村コード');
 assert.throws(()=>new TextDecoder('utf-8',{fatal:true}).decode(csv2027));
});

test('forest original byte SHA-256, public anomaly counts and prefecture-scoped map replacement',()=>{
 assert.equal(F.digest(Buffer.from('abc')),'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
 assert.equal(F.digest(csv2027),createHash('sha256').update(csv2027).digest('hex'));
 assert.notEqual(F.digest(csv2027),F.digest(JSON.stringify(csv2027)));
 const r=reg(csv2026,PROFILE,2026);
 const otherCSV=F.decodeRegisterBytes(csv2026,PROFILE.encoding).replaceAll('20999','21999');
 const other=F.normalizeRegister(otherCSV,PROFILE,{prefecture_code:'21',plan_year:2026,source_file_sha256:H(otherCSV)});
 let s=F.stageObservations(F.emptyStandRegistry(),[...r.observations,...other.observations]);
 const feats=mapLines.map(f=>F.normalizePlanFeature(f,{prefecture_code:'20',properties:PROFILE.map_properties}));
 const initial=F.applyPlanMap(s,2026,feats,H('map'),'20');
 s=initial.state;
 assert.deepEqual(s.observations.filter(o=>o.prefecture_code==='21'),other.observations);
 assert.throws(()=>F.applyPlanMap(s,2026,feats,H('map'),'21'),/MAP_PREF_SCOPE/);
 assert.throws(()=>F.applyPlanMap(s,2026,feats,H('map')),/MAP_PREF_CODE/);
 const matched=s.observations.filter(o=>o.prefecture_code==='20'&&o.map_state==='MATCHED_BY_LOCAL_KEY');
 assert.ok(matched.length>1);
 const replacement=F.applyPlanMap(s,2026,[feats.find(f=>f.local_key===matched[0].local_key)],H('new-map'),'20').state;
 assert.equal(replacement.observations.find(o=>o.observation_id===matched[1].observation_id).geometry_sha256,null);
 const receipt=F.buildPublicReceipt(s,{duplicate_local_keys:['20999-5-1-0'],polygons_without_register:['20999-9-1-0'],unmapped_forest_type:{SECRET_RAW_LABEL:2}});
 assert.deepEqual(receipt.anomalies,{duplicate_local_keys_count:1,polygons_without_register_count:1,unmapped_forest_type_count:2});
 assert.ok(!JSON.stringify(receipt).includes('20999-')&&!JSON.stringify(receipt).includes('SECRET_RAW_LABEL'));
});

test('CSV parser: quotes, escaped quotes, CRLF, BOM and fail-closed malformed input',()=>{
 assert.deepEqual(F.parseCsv('a,"b,c","d""e"\r\n1,2,3\n'),[['a','b,c','d"e'],['1','2','3']]);
 assert.equal(F.decodeRegisterBytes(Buffer.from('﻿x,y'),'utf-8'),'x,y');
 blocked(()=>F.parseCsv('a,"b'),'CSV_UNTERMINATED_QUOTE');
 blocked(()=>F.parseCsv('a,b"c"'),'CSV_QUOTE_POSITION');
 blocked(()=>F.decodeRegisterBytes(Buffer.from([0x82]),'shift_jis'),'ENCODING_DECODE_FAILED');
 blocked(()=>F.decodeRegisterBytes(Buffer.from('x'),'euc-jp'),'ENCODING_UNSUPPORTED');
});

test('森林簿 normalization maps forest class, maturity and anomalies without inventing values',()=>{
 const r=reg(csv2026,PROFILE,2026);
 assert.equal(r.observations.length,10);
 const by=k=>r.observations.find(o=>o.local_key===k);
 assert.equal(by('20999-1-1-0').age_class,'MATURE');          // スギ 52 ≥ 40 (synthetic threshold)
 assert.equal(by('20999-1-2-0').age_class,'IMMATURE');        // ヒノキ 38 < 45
 assert.equal(by('20999-2-1-0').forest_class,'TENNEN');
 assert.equal(by('20999-2-1-0').restricted_forest,true);
 assert.equal(by('20999-2-2-0').restricted_forest,false);
 assert.equal(by('20999-2-1-0').age_class,'NOT_APPLICABLE');
 assert.equal(by('20999-3-1-0').forest_class,'BAMBOO');
 assert.equal(by('20999-6-1-0').forest_class,'UNKNOWN');      // 未立木地 is not in the profile map
 assert.equal(by('20999-5-1-0').age_class,'UNKNOWN');         // アカマツ has no threshold
 assert.equal(by('20999-7-1-0').area_ha,1250);                // quoted "1,250.00"
 assert.deepEqual(r.anomalies.unmapped_forest_type,{'未立木地':1});
 assert.deepEqual(r.anomalies.unknown_maturity_species,{'アカマツ':1});
 assert.ok(r.observations.every(o=>/^[0-9a-f]{64}$/.test(o.row_sha256)&&o.map_state==='NOT_JOINED'));
 const r27=reg(csv2027,SJIS,2027);
 assert.deepEqual(r27.anomalies.duplicate_local_keys,['20999-5-1-0']);
 assert.equal(r27.observations.filter(o=>o.review_state==='DUPLICATE_LOCAL_KEY').length,2);
});

test('profiles, personal data and source terms fail closed',()=>{
 blocked(()=>F.validateProfile({...PROFILE,columns:{...PROFILE.columns,owner:'所有者'}}),'PROFILE_COLUMN_UNKNOWN');
 blocked(()=>F.validateProfile({...PROFILE,source:{...PROFILE.source,redistribution:'MAYBE'}}),'PROFILE_SOURCE_TERMS');
 blocked(()=>F.validateProfile({...PROFILE,source:{...PROFILE.source,personal_info_removed:false}}),'PROFILE_SOURCE_TERMS');
 blocked(()=>F.validateProfile({...PROFILE,forest_class_map:{'人工林':'UNKNOWN'}}),'PROFILE_FOREST_CLASS_MAP');
 const template=JSON.parse(readFileSync('config/forest-register-profiles/TEMPLATE-prefecture.json','utf8'));
 assert.equal(template.source.redistribution,'NOT_VERIFIED');
 const withOwner=Buffer.from(readFileSync('fixtures/p78-forest-register-2026-synthetic.csv','utf8').replace('制限林','制限林,森林所有者').replace(/\r\n(?=.)/g,',X\r\n').replace('森林所有者,X','森林所有者'));
 blocked(()=>reg(withOwner,PROFILE,2026),'PERSONAL_DATA_COLUMNS_PRESENT');
 blocked(()=>reg(Buffer.from('市町村コード,林班\r\n20999,1\r\n'),PROFILE,2026),'CSV_COLUMN_NOT_FOUND');
 blocked(()=>F.normalizeRegister('市町村コード,林班,小班,枝番,林種,樹種,林齢,面積,制限林\r\n13101,1,1,,人工林,スギ,10,1,\r\n',PROFILE,{prefecture_code:'20',plan_year:2026,source_file_sha256:'0'.repeat(64)}),'MUNICIPALITY_CODE');
});

test('plan map polygons are hashed, joined by local key and never retained as coordinates',()=>{
 const feats=mapLines.map(f=>F.normalizePlanFeature(f,{prefecture_code:'20',properties:PROFILE.map_properties}));
 assert.ok(feats.every(f=>Object.keys(f).sort().join()==='geometry_sha256,local_key'));
 const j=F.joinPlanMap(reg(csv2026,PROFILE,2026).observations,feats);
 assert.deepEqual(j.anomalies.polygons_without_register,['20999-9-1-0']);
 assert.equal(j.anomalies.register_without_polygon,2);
 const bad=structuredClone(mapLines[0]);bad.geometry.coordinates[0][0]=[0,0];
 blocked(()=>F.normalizePlanFeature(bad,{prefecture_code:'20',properties:PROFILE.map_properties}),'POLYGON_RING_INVALID');
 const far=structuredClone(mapLines[0]);far.geometry.coordinates=[[[10,10],[11,10],[11,11],[10,10]]];
 blocked(()=>F.normalizePlanFeature(far,{prefecture_code:'20',properties:PROFILE.map_properties}),'COORDINATE_OUTSIDE_JAPAN_LONLAT');
});

function linkedRegistry(){
 let s=F.emptyStandRegistry();
 s=F.stageObservations(s,reg(csv2026,PROFILE,2026).observations);
 s=F.applyPlanMap(s,2026,mapLines.map(f=>F.normalizePlanFeature(f,{prefecture_code:'20',properties:PROFILE.map_properties})),H('map'),'20').state;
 const ids={};
 for(const key of ['20999-1-1-0','20999-1-2-0','20999-1-3-0','20999-2-1-0','20999-4-1-0']){
  const stand_id='std_'+H(key).slice(0,8)+'-0000-4000-8000-'+H(key).slice(8,20);
  s=F.addStand(s,{stand_id,prefecture_code:'20',reference_hash:H('ref:'+key)});ids[key]=stand_id;
  const o=s.observations.find(x=>x.local_key===key&&x.plan_year===2026);
  s=F.proposeLink(s,{stand_id,observation_id:o.observation_id,reason:'MANUAL_REVIEW',basis_sha256:H('basis:'+key)});
  s=F.reviewLink(s,{candidate_id:s.candidates.at(-1).candidate_id,decision:'APPROVE',reviewer_reference_hash:H('reviewer'),decision_evidence_sha256:H('plan-sheet:'+key),reason:'森林計画図と森林簿の林小班番号・面積を目視で照合した'});
 }
 return {s,ids};
}

test('stand identity: renumbering and splits are never auto-linked; every link needs a hashed human decision',()=>{
 let {s,ids}=linkedRegistry();
 s=F.stageObservations(s,reg(csv2027,SJIS,2027).observations);
 const o27=k=>s.observations.find(x=>x.plan_year===2027&&x.local_key===k);
 const sug=F.suggestContinuity(s,o27('20999-1-1-0').observation_id);
 assert.equal(sug.length,1);assert.equal(sug[0].stand_id,ids['20999-1-1-0']);assert.equal(sug[0].auto_approved,false);
 assert.equal(o27('20999-1-1-0').approved_stand_id,null);                    // suggestion did not link
 assert.deepEqual(F.suggestContinuity(s,o27('20999-1-3-1').observation_id),[]); // split child: no key continuity
 assert.deepEqual(F.suggestContinuity(s,o27('20999-8-1-0').observation_id),[]); // renumbered 4-1 → 8-1: no false match
 blocked(()=>F.proposeLink(s,{stand_id:ids['20999-1-1-0'],observation_id:s.observations.find(x=>x.plan_year===2027&&x.review_state==='DUPLICATE_LOCAL_KEY').observation_id,reason:'MANUAL_REVIEW',basis_sha256:H('x')}),'DUPLICATE_LOCAL_KEY_REQUIRES_SOURCE_CORRECTION');
 let t=F.proposeLink(s,{stand_id:ids['20999-1-1-0'],observation_id:o27('20999-1-1-0').observation_id,reason:'SAME_LOCAL_KEY_EARLIER_PLAN',basis_sha256:H('b')});
 const cid=t.candidates.at(-1).candidate_id;
 blocked(()=>F.reviewLink(t,{candidate_id:cid,decision:'APPROVE',reviewer_reference_hash:H('r'),decision_evidence_sha256:H('e'),reason:'short'}),'DECISION_REASON_TOO_SHORT');
 t=F.reviewLink(t,{candidate_id:cid,decision:'APPROVE',reviewer_reference_hash:H('r'),decision_evidence_sha256:H('e'),reason:'2027年計画図で同一林小班・同一面積を確認した'});
 assert.equal(t.observations.find(x=>x.observation_id===o27('20999-1-1-0').observation_id).approved_stand_id,ids['20999-1-1-0']);
 // Integrity: tampering with the audit chain or forging a link is rejected.
 const forged=structuredClone(t);forged.observations.find(x=>x.plan_year===2027&&x.local_key==='20999-1-2-0').approved_stand_id=ids['20999-1-2-0'];
 blocked(()=>F.assertStandRegistry(forged),'NO_HUMAN_LINK_DECISION');
 const tampered=structuredClone(t);tampered.events[1].event='X';
 blocked(()=>F.assertStandRegistry(tampered),'AUDIT_EVENT_TAMPER');
 const claimed=structuredClone(t);claimed.formal_certification=true;
 blocked(()=>F.assertStandRegistry(claimed),'FALSE_CERTIFICATION_CLAIM');
});

test('real-data claims enter the Evidence Compiler and stay honest about unverified evidence',()=>{
 let {s,ids}=linkedRegistry();
 const k='20999-1-1-0',sid=ids[k];
 for(const [id,cat] of [['plan-1','forest_management_plan'],['op-1','operation_record']])
  s=F.addStandEvidence(s,{evidence_id:id,stand_id:sid,category:cat,evidence_sha256:H(id),period_start:'2026-04-01',period_end:'2027-03-31'});
 const req={plan_id:'PLAN-X',manager_id:'MGR-X',methodology_id:'FOREST-SYNTHETIC',methodology_version:'1',period_start:'2026-04-01',period_end:'2027-03-31',
  activities:{[sid]:{operation:'THINNING',management_plan_certified:true,planned_thinning_sites:2,land_conversion_planned:false},[ids['20999-2-1-0']]:{operation:'PROTECTION',management_plan_certified:true,planned_thinning_sites:1,land_conversion_planned:false,volume_table_period:4}}};
 const c=compiler(),pack=c.FOREST_REGISTRY['FOREST-SYNTHETIC@1'];
 const unverified=F.standClaims(s,req);
 const u=c.compileEvidence(unverified.find(x=>x.field.id===sid),pack).document.evaluation;
 assert.equal(u.status,'UNSUPPORTED');
 assert.ok(u.issues.some(i=>i.code==='content_hash:plan-1'));
 const verified=F.standClaims(s,req,new Set(['plan-1','op-1']));
 const v=c.compileEvidence(verified.find(x=>x.field.id===sid),pack).document;
 assert.equal(v.evaluation.status,'AUTO_REEVALUATED',JSON.stringify(v.evaluation.outstanding_issues));
 assert.equal(v.calculation.result,null);
 // Natural forest without protection evidence must not pass.
 const n=c.compileEvidence(verified.find(x=>x.field.id===ids['20999-2-1-0']),pack).document.evaluation;
 assert.equal(n.status,'EVIDENCE_REQUIRED');assert.deepEqual([...n.missing_evidence],['management_plan','protection_record']);
 // Version change: the mature stand needs final-harvest evidence; the natural stand fails the table rule.
 const impact=c.analyzeImpact(verified,{type:'methodology',old_key:'FOREST-SYNTHETIC@1',new_key:'FOREST-SYNTHETIC@2'},c.FOREST_REGISTRY);
 assert.equal(impact.counts.require_reverification,2);
 // Reference FO-001 Pack never auto-passes.
 const ref=F.standClaims(s,{...req,methodology_id:'FO-001',methodology_version:'guide-2026.03-reference'},new Set(['plan-1','op-1']));
 const rd=c.compileEvidence(ref.find(x=>x.field.id===sid),c.FOREST_REGISTRY['FO-001@guide-2026.03-reference']).document;
 assert.equal(rd.evaluation.status,'UNSUPPORTED');assert.equal(rd.calculation.result,null);
 assert.ok(rd.evaluation.issues.some(i=>i.code==='official_configuration'));
});

test('synthetic 60-stand impact matches an independent full recomputation oracle',()=>{
 const c=compiler(),demo=c.forestImpactDemo();
 assert.equal(demo.rows.length,60);
 const p1=c.FOREST_REGISTRY['FOREST-SYNTHETIC@1'],p2=c.FOREST_REGISTRY['FOREST-SYNTHETIC@2'];
 const strip=e=>JSON.stringify({rules:e.rules,missing:e.missing_evidence,issues:e.issues.map(i=>i.code+':'+i.status),status:e.status});
 for(const s of c.forestSyntheticStands(60)){
  const row=demo.rows.find(r=>r.stand_id===s.stand_id);
  const before=c.compileEvidence(c.forestStandClaim(s,'1'),p1).document.evaluation;
  const after=c.compileEvidence(c.forestStandClaim(s,'2'),p2).document.evaluation;
  const outcomeChanged=strip(before)!==strip(after);
  // Soundness: every claim whose recomputed outcome changes is flagged (no false negatives).
  if(outcomeChanged)assert.equal(row.requires_reverification,true,s.stand_id);
  // Precision bound: flagged-but-unchanged claims must have used the changed parameter or requirement.
  if(row.requires_reverification&&!outcomeChanged)assert.ok(s.attributes.forest_class==='TENNEN'||s.attributes.age_class==='MATURE',s.stand_id);
  if(!row.requires_reverification)assert.equal(row.status,'UNAFFECTED');
  if(row.requires_reverification)assert.ok(row.why.length>0,s.stand_id);
 }
 // Blocked inputs stay blocked: unknown maturity and bamboo never become re-evaluated passes.
 for(const r of demo.rows.filter(r=>r.age_class==='UNKNOWN'||r.forest_class==='BAMBOO'))
  assert.equal(c.compileEvidence(c.forestStandClaim(c.forestSyntheticStands(60).find(s=>s.stand_id===r.stand_id),'2'),p2).document.evaluation.status,'UNSUPPORTED');
 assert.deepEqual(JSON.parse(JSON.stringify(demo.methodology_diff)),{changed_parameters:['natural_volume_table_min_period'],changed_evidence_requirements:['final_harvest_timing'],changed_rules:[]});
 // Separate registry: agricultural registry and its keys are untouched.
 assert.equal(Object.keys(c.COMPILER_REGISTRY).filter(k=>k.startsWith('FO')).length,0);
 assert.deepEqual(JSON.parse(JSON.stringify(c.forestImpactDemo())),JSON.parse(JSON.stringify(demo)));   // deterministic
});

test('CLI keeps private state and claims outside the repository',async()=>{
 const W=mkdtempSync(join(tmpdir(),'naft-p78-'));
 await assert.rejects(cli(['--action','init','--state','./p78-private.json']),/STATE_CANNOT_BE_INSIDE_REPOSITORY/);
 await assert.rejects(cli(['--action','init','--state',join(W,'s.json'),'--bogus','1']),/UNKNOWN_OPTION/);
 const r=await cli(['--action','init','--state',join(W,'s.json')]);assert.equal(r.formal_certification,false);
 await assert.rejects(cli(['--action','init','--state',join(W,'s.json')]),/STATE_EXISTS/);
 const imp=await cli(['--action','import-register','--state',join(W,'s.json'),'--input','fixtures/p78-forest-register-2026-synthetic.csv','--profile','config/forest-register-profiles/synthetic-v1.json','--pref','20','--year','2026']);
 assert.equal(imp.counts.observations,10);assert.equal(imp.local_keys_disclosed,false);
 assert.ok(!JSON.stringify(imp).includes('20999-'),'public receipt must not disclose local keys');
 writeFileSync(join(W,'p.json'),JSON.stringify({plan_id:'P',manager_id:'M',methodology_id:'FOREST-SYNTHETIC',methodology_version:'1',period_start:'2026-04-01',period_end:'2027-03-31',activities:{}}));
 await assert.rejects(cli(['--action','claims','--state',join(W,'s.json'),'--payload',join(W,'p.json'),'--out','./claims.json']),/CLAIMS_OUT_CANNOT_BE_INSIDE_REPOSITORY/);
 const out=spawnSync(process.execPath,['scripts/forest-stand-cli.mjs','--action','receipt','--state',join(W,'s.json')],{encoding:'utf8'});
 assert.equal(out.status,0,out.stderr);assert.equal(JSON.parse(out.stdout).counts.observations,10);
 assert.ok(!existsSync('p78-private.json')&&!existsSync('claims.json'));
});
