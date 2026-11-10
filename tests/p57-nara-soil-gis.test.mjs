import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import vm from 'node:vm';

const m=JSON.parse(readFileSync('research/p57-nara-soil-shapefile-source-v1.json','utf8'));
const sha='6a1787c976149b29fead495730d749b0ce072e1e5d9922f4d25786aba3d61d16';
const lands={'田':401,'普通畑':265,'牧草地':9,'樹園地':180};
const landKeys=['田','普通畑','牧草地','樹園地'];
assert.equal(m.schema,'naft-p57-nara-soil-shapefile-v1');
assert.equal(m.source.provided_filename,'奈良県.zip');
assert.equal(m.source.source_zip_sha256,sha);
assert.equal(m.source.zip_bytes,3703958);
assert.equal(m.source.uncompressed_bytes,6289996);
assert.equal(m.source.zip_entries,7);
assert.equal(m.source.members.length,7);
assert.equal(m.source.members.reduce((a,r)=>a+r.bytes,0),6289996);
assert.ok(m.source.members.every(x=>x.name.startsWith('k29奈良県.')&&/^[a-f0-9]{64}$/.test(x.sha256)));
assert.equal(m.source.redistribution_rights,'NOT_VERIFIED');
assert.equal(m.source.publisher_authentication,'NOT_VERIFIED');
assert.equal(m.source.source_match,'CONSISTENT_METADATA_NO_OFFICIAL_ZIP_SHA_COMPARISON');
assert.equal(m.source.raw_geometry_committed,false);
assert.equal(m.source.original_zip_committed,false);
assert.equal(m.geometry.type,'POLYGON');
assert.equal(m.geometry.shape_count,855);
assert.equal(m.geometry.crs,'GCS_JGD_2000');
assert.deepEqual(m.geometry.bounds_lon_lat,[135.56310091626395,33.87643163780173,136.21964315993296,34.777998616262266]);
assert.deepEqual(m.geometry.sicho_unique_values,['']);
assert.deepEqual(m.geometry.sicho_counts,{'':855});
assert.equal(m.geometry.municipality_name_count,39);
assert.equal(m.geometry.unique_jcodes,51);
assert.equal(m.geometry.administrative_code_name_pairs,109);
assert.deepEqual(m.geometry.gun_counts,{
  '':464,'北葛城郡':49,'吉野郡':139,'宇陀郡':22,
  '山辺郡':21,'生駒郡':51,'相楽郡':12,'磯城郡':55,'高市郡':42
});
assert.deepEqual(m.feature_counts_by_landuse,lands);
assert.equal(m.soil_group_code_categories,12);
assert.equal(m.soil_fine_class_categories,42);
assert.equal(m.soil_group_missing_features,0);
assert.equal(m.soil_detail_missing_features,0);
assert.deepEqual(m.soil_classification_missing_records,[]);
const cp=m.jcode_name_pairs_counts_by_landuse;
const gp=m.gun_name_pairs_counts_by_landuse;
assert.equal(cp.length,109);
assert.equal(gp.length,58);
assert.equal(new Set(cp.map(r=>r[0]+'|'+r[1])).size,109);
assert.equal(new Set(gp.map(r=>r[0]+'|'+r[1])).size,58);
assert.equal(new Set(cp.map(r=>r[0])).size,51);
assert.equal(new Set(cp.map(r=>r[1])).size,39);
for(const rows of [cp,gp]){
 assert.ok(rows.every(r=>r.length===6&&r.slice(2).every(v=>Number.isInteger(v)&&v>=0)));
 assert.deepEqual(landKeys.map((_,i)=>rows.reduce((a,r)=>a+r[i+2],0)),[401,265,9,180]);
}
const an=m.source_code_name_anomalies;
const f=cp.filter(r=>r[0].slice(0,2)!=='29');
assert.equal(f.length,14);
assert.equal(f.reduce((a,r)=>a+r.slice(2).reduce((b,v)=>b+v,0),0),33);
assert.deepEqual(f,an.foreign_prefecture_code_pairs);
assert.deepEqual(an.foreign_code_prefix_totals,{'24':9,'26':16,'27':8});
assert.deepEqual(an.foreign_prefixes,['24','26','27']);
assert.equal(an.foreign_prefecture_code_feature_count,33);
assert.equal(Object.keys(an.codes_with_multiple_names).length,24);
assert.equal(Object.keys(an.names_with_multiple_codes).length,28);
assert.equal(an.one_to_one_code_name_mapping,false);
assert.equal(an.status,'UNRESOLVED_ORIGINAL_KEPT_NO_CITY_JOIN');
const gq=m.source_gun_quality;
assert.deepEqual(gq.foreign_prefecture_gun_names,{'相楽郡':12});
assert.deepEqual(gq.foreign_prefecture_gun_name_pairs,[
 ['相楽郡','奈良市',6,0,0,5],['相楽郡','生駒市',1,0,0,0]
]);
assert.deepEqual(gq.multiple_nonempty_guns_per_municipality_name,{
 '広陵町':['北葛城郡','磯城郡'],'河合町':['北葛城郡','生駒郡','磯城郡']
});
assert.equal(gq.empty_gun_features_for_names_with_county_elsewhere,155);
assert.equal(gq.empty_gun_features_in_town_village_names,79);
assert.equal(gq.empty_gun_name_pairs_with_nonempty_gun_elsewhere.reduce((a,r)=>a+r.empty_gun_polygon_count,0),155);
assert.equal(gq.status,'UNRESOLVED_ORIGINAL_KEPT_NO_GUN_JOIN');
assert.equal(m.scientific_boundaries.official_credit_tco2e,null);
assert.equal(m.scientific_boundaries.calculation_of_certified_credits_prohibited,true);
assert.equal(m.scientific_boundaries.municipality_level_aggregations_pending_reconciliation,true);

const audit=spawnSync('python3',['scripts/p57-nara-soil-audit.py','audit'],{encoding:'utf8',timeout:20000});
assert.equal(audit.status,0,audit.stderr);
const audited=JSON.parse(audit.stdout);
assert.equal(audited.status,'REGISTER_CONSISTENT_RAW_NOT_COMMITTED');
assert.equal(audited.polygons,855);
assert.equal(audited.raw_original_verified_in_ci,false);
const invalid=spawnSync('python3',['scripts/p57-nara-soil-audit.py','verify','/dev/null'],{encoding:'utf8',timeout:20000});
assert.notEqual(invalid.status,0);
assert.match(invalid.stderr,/P57_NARA_SOURCE_BLOCKED:ORIGINAL_ZIP_SIZE/);

const ctx={gxEsc:s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;')};
vm.createContext(ctx);
vm.runInContext(readFileSync('src/gx-nara-soil.js','utf8'),ctx);
assert.equal(ctx.gxNaraSoilValidate(),true);
assert.equal(ctx.GX_NARA_SOURCE_HASH,sha);
assert.deepEqual(JSON.parse(JSON.stringify(ctx.GX_NARA_JCODE_PAIRS)),cp);
assert.deepEqual(JSON.parse(JSON.stringify(ctx.GX_NARA_GUN_PAIRS)),gp);
assert.deepEqual(JSON.parse(JSON.stringify(Object.fromEntries(ctx.GX_NARA_GUN_COUNTS))),m.geometry.gun_counts);
assert.deepEqual(JSON.parse(JSON.stringify(Object.fromEntries(ctx.GX_NARA_LANDUSE))),lands);
assert.equal(ctx.gxNaraSoilPanel('27'),'');
assert.equal(ctx.gxNaraSoilPanel('28'),'');
const html=ctx.gxNaraSoilPanel('29');
assert.match(html,/奈良県の農耕地土壌GIS/);
assert.match(html,/855件/);
assert.match(html,/109組合せ/);
assert.match(html,/58組合せ/);
assert.match(html,/相楽郡/);
assert.match(html,/33件/);
assert.match(html,/155件/);
assert.match(html,/79/);
assert.match(html,/河合町/);
assert.match(html,/広陵町/);
assert.match(html,/要照合/);
assert.match(html,/面積haではありません/);
assert.match(html,/p57-nara-soil-shapefile-source-v1.json/);
ctx.GX_NARA_JCODE_PAIRS[0][2]++;
assert.throws(()=>ctx.gxNaraSoilValidate(),/P57_NARA_/);
ctx.GX_NARA_JCODE_PAIRS[0][2]--;
ctx.GX_NARA_GUN_PAIRS.find(r=>r[0]==='相楽郡'&&r[1]==='奈良市')[2]++;
assert.throws(()=>ctx.gxNaraSoilValidate(),/P57_NARA_/);

const app=readFileSync('naft-app.html','utf8');
const atlas=readFileSync('src/gx-data-explorer.js','utf8');
const runner=readFileSync('tests/run.sh','utf8');
assert.ok(app.includes('src/gx-nara-soil.js'));
assert.ok(app.indexOf('src/gx-nara-soil.js')<app.indexOf('src/gx-data-explorer.js'));
assert.ok(atlas.includes('gxNaraSoilPanel(current.code)'));
assert.ok(runner.includes('python3 scripts/p57-nara-soil-audit.py audit'));
assert.ok(runner.includes('node tests/p57-nara-soil-gis.test.mjs'));
for(const name of ['Hokkaido','Aomori','Iwate','Miyagi','Yamagata','Akita','Fukushima','Ibaraki','Tochigi','Saitama','Gunma','Tokyo','Chiba','Kanagawa','Niigata','Ishikawa','Toyama','Fukui','Yamanashi','Nagano','Gifu','Shizuoka','Aichi','Mie','Shiga','Kyoto','Osaka','Hyogo']){
 assert.ok(atlas.includes('gx'+name+'SoilPanel(current.code)'),name);
}
console.log('NAFT_P57_NARA_855_FEATURES_109_JCODE_PAIRS_58_GUN_PAIRS_ALL_GUARDS_PASS');
