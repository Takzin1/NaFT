#!/usr/bin/env node
/* P76: independently rebuild national registry from all P29..P75 source manifests.
   Derived attributes only. No raw geometry, ZIP or official licence assumptions. */
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const REGISTRY='research/p76-national-soil-evidence-registry-v1.json';
const LAND=['田','普通畑','牧草地','樹園地'];
const QUALITY=['foreign_jcode_features','blank_gun_features','ambiguous_jcodes','ambiguous_names','ambiguous_guns','soil_group_missing_features','soil_detail_missing_features'];
const SHA=/^[0-9a-f]{64}$/;
const has=(obj,key)=>Object.prototype.hasOwnProperty.call(obj,key);
const field=(obj,key)=>has(obj,key)?obj[key]:null;
const sum=(rows,get)=>rows.reduce((a,r)=>a+get(r),0);

export function buildNationalRegistry(root=ROOT){
 const files=readdirSync(join(root,'research')).filter(f=>/^p\d+-[a-z0-9-]+-soil-shapefile-source-v1\.json$/.test(f))
  .sort((a,b)=>Number(a.match(/^p(\d+)/)[1])-Number(b.match(/^p(\d+)/)[1]));
 assert.equal(files.length,47,'P76 must cover exactly 47 source ledgers');
 const records=files.map((file,i)=>{
  const p=Number(file.match(/^p(\d+)/)[1]);
  assert.equal(p,29+i,'P76 source ledger range P29..P75 must be complete');
  const path='research/'+file,raw=JSON.parse(readFileSync(join(root,path),'utf8'));
  const s=raw.source||{},g=raw.geometry||{},c=raw.source_code_name_anomalies||{},q=raw.source_gun_quality||{},land=raw.feature_counts_by_landuse||{};
  const name=/^k(\d{2})(.+)$/.exec(s.member_folder||'');
  assert.ok(name&&name[2],'P76 missing original prefecture folder '+file);
  assert.ok(Number.isSafeInteger(g.shape_count)&&g.shape_count>0,'P76 bad polygon count '+file);
  assert.equal(sum(LAND,k=>land[k]),g.shape_count,'P76 original landuse count mismatch '+file);
  assert.ok(SHA.test(s.source_zip_sha256),'P76 bad ZIP SHA '+file);
  assert.ok(Number.isSafeInteger(s.zip_bytes)&&s.zip_bytes>0,'P76 bad original size '+file);
  assert.equal(s.members?.length,7,'P76 original member count '+file);
  for(const member of s.members){
   assert.ok(SHA.test(member.sha256)&&Number.isSafeInteger(member.bytes)&&member.bytes>0,'P76 bad member provenance '+file);
  }
  assert.equal(s.redistribution_rights,'NOT_VERIFIED','P76 cannot claim unconfirmed licence');
  assert.ok([null,'CONSISTENT_METADATA_NO_OFFICIAL_ZIP_SHA_COMPARISON'].includes(field(s,'source_match')),'P76 unreviewed official match state');
  const zipCommitted=field(s,'original_zip_committed')??field(s,'source_zip_committed');
  const geoCommitted=field(s,'raw_geometry_committed')??field(s,'original_shapefile_committed');
  assert.equal(zipCommitted,false,'P76 original archive must not be committed');
  assert.equal(geoCommitted,false,'P76 original geometry must not be committed');
  return {
   p,prefecture_code:name[1],prefecture_name:name[2],polygon_features:g.shape_count,
   landuse_counts:Object.fromEntries(LAND.map(k=>[k,land[k]])),
   source:{ledger_path:path,zip_sha256:s.source_zip_sha256,zip_bytes:s.zip_bytes,
    official_source_match:field(s,'source_match'),publisher_authentication:field(s,'publisher_authentication'),
    redistribution_rights:s.redistribution_rights,original_zip_committed:zipCommitted,raw_geometry_committed:geoCommitted},
   quality:{
    foreign_jcode_features:field(c,'foreign_prefecture_code_feature_count'),
    blank_gun_features:field(q,'blank_gun_features'),
    ambiguous_jcodes:c.codes_with_multiple_names?Object.keys(c.codes_with_multiple_names).length:null,
    ambiguous_names:c.names_with_multiple_codes?Object.keys(c.names_with_multiple_codes).length:null,
    ambiguous_guns:q.multiple_nonempty_guns_per_municipality_name?Object.keys(q.multiple_nonempty_guns_per_municipality_name).length:null,
    soil_group_missing_features:field(raw,'soil_group_missing_features'),
    soil_detail_missing_features:field(raw,'soil_detail_missing_features')
   }
  };
 });
 assert.equal(new Set(records.map(r=>r.prefecture_code)).size,47,'P76 duplicate Japanese prefecture codes');
 for(const r of records)for(const key of QUALITY){
  const v=r.quality[key];
  assert.ok(v===null||(Number.isSafeInteger(v)&&v>=0),'P76 invalid quality flag '+r.p+' '+key);
 }
 const coverage=Object.fromEntries(QUALITY.map(key=>{
  const vals=records.map(r=>r.quality[key]);
  return [key,{reported_prefectures:vals.filter(x=>x!==null).length,
   unreported_prefectures:vals.filter(x=>x===null).length,
   reported_positive_prefectures:vals.filter(x=>x!==null&&x>0).length,
   reported_counts_total:vals.reduce((a,b)=>a+(b===null?0:b),0)}];
 }));
 const summary={
  prefecture_ledgers:47,
  polygon_features:sum(records,r=>r.polygon_features),
  landuse_counts:Object.fromEntries(LAND.map(k=>[k,sum(records,r=>r.landuse_counts[k])])),
  zip_sha256_recorded_prefectures:47,
  official_zip_sha256_match_verified_prefectures:0,
  redistribution_rights_verified_prefectures:0,
  quality_field_coverage:coverage
 };
 return {records,summary};
}
export function checkNationalRegistry(snapshot,root=ROOT){
 assert.equal(snapshot.schema,'naft-p76-national-soil-evidence-registry-v1');
 assert.equal(snapshot.status,'RESEARCH_ONLY_NO_FORMAL_CREDIT_CALCULATION');
 assert.equal(snapshot.scientific_boundaries.polygon_counts_not_farm_area_ha,true);
 assert.equal(snapshot.scientific_boundaries.do_not_auto_join_modern_municipalities,true);
 assert.equal(snapshot.scientific_boundaries.no_certified_credit_or_co2e_claims,true);
 assert.equal(snapshot.scientific_boundaries.individual_geometry_not_published,true);
 const expected=buildNationalRegistry(root);
 assert.deepEqual(snapshot.records,expected.records,'P76 registry diverged from source-ledger data');
 assert.deepEqual(snapshot.summary,expected.summary,'P76 national rollup diverged from source-ledger data');
 checkBundledRegistry(snapshot,root);
 return {status:'P76_NATIONAL_SOURCE_REGISTRY_PASS',prefectures:expected.records.length,polygons:expected.summary.polygon_features,
  foreign_jcode_unreported_prefectures:expected.summary.quality_field_coverage.foreign_jcode_features.unreported_prefectures,
  gun_blank_unreported_prefectures:expected.summary.quality_field_coverage.blank_gun_features.unreported_prefectures,
  rights_claims_verified:expected.summary.redistribution_rights_verified_prefectures};
}
export function checkBundledRegistry(snapshot,root=ROOT){
 const js=readFileSync(join(root,'src/gx-national-soil-registry.js'),'utf8');
 const begin='/* P76_STATIC_SNAPSHOT_BEGIN */\nvar GX_NATIONAL_SOIL_REGISTRY_CACHE=';
 const end=';\n/* P76_STATIC_SNAPSHOT_END */';
 const a=js.indexOf(begin),b=js.indexOf(end,a+begin.length);
 assert.ok(a>=0&&b>a&&js.indexOf(begin,a+begin.length)<0,'P76 static snapshot marker invalid');
 const embedded=JSON.parse(js.slice(a+begin.length,b));
 assert.deepEqual(embedded,snapshot,'P76 static browser registry diverged from research JSON');
 return {embedded,begin,end};
}
function run(){
 const args=process.argv.slice(2);
 if(args.length!==1||!['--check','--write'].includes(args[0]))throw Error('USAGE: node scripts/p76-national-soil-registry-audit.mjs --check|--write');
 const output=join(ROOT,REGISTRY);
 if(args[0]==='--write'){
  const original=JSON.parse(readFileSync(output,'utf8')),derived=buildNationalRegistry();
  original.records=derived.records;original.summary=derived.summary;
  writeFileSync(output,JSON.stringify(original,null,2)+'\n');
  const jsFile=join(ROOT,'src/gx-national-soil-registry.js'),existing=readFileSync(jsFile,'utf8');
  const begin='/* P76_STATIC_SNAPSHOT_BEGIN */\nvar GX_NATIONAL_SOIL_REGISTRY_CACHE=';
  const end=';\n/* P76_STATIC_SNAPSHOT_END */';
  const a=existing.indexOf(begin),b=existing.indexOf(end,a+begin.length);
  assert.ok(a>=0&&b>a,'P76 static snapshot markers unavailable');
  writeFileSync(jsFile,existing.slice(0,a+begin.length)+JSON.stringify(original)+existing.slice(b));
 }
 const snapshot=JSON.parse(readFileSync(output,'utf8'));
 process.stdout.write(JSON.stringify(checkNationalRegistry(snapshot))+'\n');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{run();}catch(e){process.stderr.write(String(e.stack||e)+'\n');process.exitCode=1;}
}
