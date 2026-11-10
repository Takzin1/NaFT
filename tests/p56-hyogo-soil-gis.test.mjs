import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import vm from 'node:vm';

const reg=JSON.parse(readFileSync('research/p56-hyogo-soil-shapefile-source-v1.json','utf8'));
const hash='d0e2c012e060014b341595d3a34aadb83498476290c7a1ae1cd2a27363733e38';
const land={'田':615,'普通畑':333,'牧草地':60,'樹園地':208};
assert.equal(reg.schema,'naft-p56-hyogo-soil-shapefile-v1');
assert.equal(reg.source.provided_filename,'兵庫県.zip');
assert.equal(reg.source.source_zip_sha256,hash);
assert.equal(reg.source.zip_bytes,11256943);
assert.equal(reg.source.uncompressed_bytes,17355914);
assert.equal(reg.source.members.length,7);
assert.equal(reg.source.members.reduce((acc,r)=>acc+r.bytes,0),17355914);
assert.ok(reg.source.members.every(r=>r.name.startsWith('k28兵庫県.')&&/^[a-f0-9]{64}$/.test(r.sha256)));
assert.equal(reg.source.original_zip_committed,false);
assert.equal(reg.source.raw_geometry_committed,false);
assert.equal(reg.source.redistribution_rights,'NOT_VERIFIED');
assert.equal(reg.source.publisher_authentication,'NOT_VERIFIED');
assert.equal(reg.source.source_match,'CONSISTENT_METADATA_NO_OFFICIAL_ZIP_SHA_COMPARISON');
assert.equal(reg.geometry.type,'POLYGON');
assert.equal(reg.geometry.crs,'GCS_JGD_2000');
assert.equal(reg.geometry.shape_count,1216);
assert.deepEqual(reg.geometry.bounds_lon_lat,[134.27031944612435,34.16185850089661,135.4491554823112,35.668150185835]);
assert.deepEqual(reg.geometry.sicho_counts,{'':1216});
assert.equal(reg.geometry.unique_jcodes,46);
assert.equal(reg.geometry.municipality_name_count,44);
assert.equal(reg.geometry.administrative_code_name_pairs,102);
assert.equal(reg.soil_group_code_categories,18);
assert.equal(reg.soil_fine_class_categories,68);
assert.equal(reg.soil_group_missing_features,0);
assert.equal(reg.soil_detail_missing_features,0);
assert.deepEqual(reg.feature_counts_by_landuse,land);
assert.deepEqual(reg.geometry.gun_counts,{'':942,'佐用郡':40,'加古郡':15,'多可郡':23,'川辺郡':20,'揖保郡':10,'神崎郡':47,'美方郡':106,'船井郡':1,'赤穂郡':12});

const cp=reg.jcode_name_pairs_counts_by_landuse,gp=reg.gun_name_pairs_counts_by_landuse;
assert.equal(cp.length,102);
assert.equal(gp.length,52);
assert.equal(new Set(cp.map(r=>r[0]+'|'+r[1])).size,102);
assert.equal(new Set(gp.map(r=>r[0]+'|'+r[1])).size,52);
assert.equal(new Set(cp.map(r=>r[0])).size,46);
assert.equal(new Set(cp.map(r=>r[1])).size,44);
for(const rows of [cp,gp]){
  assert.deepEqual([0,1,2,3].map(i=>rows.reduce((sum,r)=>sum+r[i+2],0)),[615,333,60,208]);
}
const foreign=cp.filter(r=>!r[0].startsWith('28'));
assert.equal(foreign.length,5);
assert.equal(foreign.reduce((a,r)=>a+r.slice(2).reduce((b,v)=>b+v,0),0),8);
assert.deepEqual(foreign,reg.source_code_name_anomalies.foreign_prefecture_code_pairs);
assert.deepEqual(reg.source_code_name_anomalies.foreign_code_prefix_totals,{'26':6,'27':2});
assert.equal(Object.keys(reg.source_code_name_anomalies.codes_with_multiple_names).length,25);
assert.equal(Object.keys(reg.source_code_name_anomalies.names_with_multiple_codes).length,31);
assert.deepEqual(reg.source_code_name_anomalies.historical_place_name_polygon_counts,{'篠山市':32});
assert.equal(cp.filter(r=>r[1]==='篠山市').reduce((a,r)=>a+r.slice(2).reduce((b,c)=>b+c,0),0),32);
assert.deepEqual(gp.find(r=>r[0]==='船井郡'&&r[1]==='篠山市'),['船井郡','篠山市',1,0,0,0]);
assert.equal(reg.source_gun_quality.empty_gun_features_for_names_with_county_elsewhere,71);
assert.equal(reg.source_gun_quality.empty_gun_features_in_town_village_names,40);
assert.equal(reg.source_gun_quality.empty_gun_features_in_historical_city_name,31);
assert.equal(reg.source_gun_quality.empty_gun_name_pairs_with_nonempty_gun_elsewhere.reduce((a,r)=>a+r.empty_gun_polygon_count,0),71);
assert.equal(reg.source_gun_quality.foreign_gun_name_pairs_suspected[0].jcode,'26407');
assert.equal(reg.source_code_name_anomalies.status,'UNRESOLVED_ORIGINAL_KEPT_NO_CITY_JOIN');
assert.equal(reg.source_gun_quality.status,'UNRESOLVED_ORIGINAL_KEPT_NO_GUN_JOIN');
assert.equal(reg.scientific_boundaries.municipality_level_aggregations_pending_reconciliation,true);
assert.equal(reg.scientific_boundaries.calculation_of_certified_credits_prohibited,true);
assert.equal(reg.scientific_boundaries.official_credit_tco2e,null);

const audit=spawnSync('python3',['scripts/p56-hyogo-soil-audit.py','audit'],{encoding:'utf8',timeout:20000});
assert.equal(audit.status,0,audit.stderr);
assert.equal(JSON.parse(audit.stdout).status,'REGISTER_CONSISTENT_RAW_NOT_COMMITTED');
assert.equal(JSON.parse(audit.stdout).raw_original_verified_in_ci,false);
const bogus=spawnSync('python3',['scripts/p56-hyogo-soil-audit.py','verify','/dev/null'],{encoding:'utf8',timeout:20000});
assert.notEqual(bogus.status,0);
assert.match(bogus.stderr,/P56_HYOGO_SOURCE_BLOCKED:SOURCE_ZIP_BYTES/);

const context={gxEsc:s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;')};
vm.createContext(context);
vm.runInContext(readFileSync('src/gx-hyogo-soil.js','utf8'),context);
assert.equal(context.gxHyogoSoilValidate(),true);
assert.equal(context.GX_HYOGO_SOURCE_HASH,hash);
assert.deepEqual(JSON.parse(JSON.stringify(context.GX_HYOGO_CODE_PAIRS)),cp);
assert.deepEqual(JSON.parse(JSON.stringify(context.GX_HYOGO_GUN_PAIRS)),gp);
assert.deepEqual(JSON.parse(JSON.stringify(Object.fromEntries(context.GX_HYOGO_GUN))),reg.geometry.gun_counts);
assert.deepEqual(JSON.parse(JSON.stringify(Object.fromEntries(context.GX_HYOGO_LANDUSE))),land);
assert.equal(context.gxHyogoSoilPanel('27'),'');
assert.equal(context.gxHyogoSoilPanel('26'),'');
const panel=context.gxHyogoSoilPanel('28');
for(const re of [/兵庫県の農耕地土壌GIS/,/1,216件/,/102通り/,/52組合せ/,/8ポリゴン/,/船井郡/,/篠山市/,/丹波篠山市/,/71件/,/40件/,/31件/,/面積haではありません/,/自動JOIN/,/要照合/,/p56-hyogo-soil-shapefile-source-v1.json/]){
 assert.match(panel,re,String(re));
}
context.GX_HYOGO_CODE_PAIRS[0][2]++;
assert.throws(()=>context.gxHyogoSoilValidate(),/P56_HYOGO_/);
context.GX_HYOGO_CODE_PAIRS[0][2]--;
context.GX_HYOGO_GUN_PAIRS.find(r=>r[0]==='船井郡'&&r[1]==='篠山市')[2]++;
assert.throws(()=>context.gxHyogoSoilValidate(),/P56_HYOGO_/);

const app=readFileSync('naft-app.html','utf8');
const explorer=readFileSync('src/gx-data-explorer.js','utf8');
assert.ok(app.includes('src/gx-hyogo-soil.js'));
assert.ok(app.indexOf('src/gx-hyogo-soil.js')<app.indexOf('src/gx-data-explorer.js'));
assert.ok(explorer.includes('gxHyogoSoilPanel(current.code)'));
for(const name of ['Hokkaido','Aomori','Iwate','Miyagi','Yamagata','Akita','Fukushima','Ibaraki','Tochigi','Saitama','Gunma','Tokyo','Chiba','Kanagawa','Niigata','Ishikawa','Toyama','Fukui','Yamanashi','Nagano','Gifu','Shizuoka','Aichi','Mie','Shiga','Kyoto','Osaka']){
 assert.ok(explorer.includes('gx'+name+'SoilPanel(current.code)'),name);
}
console.log('NAFT_P56_HYOGO_1216_POLYGONS_102_CODES_52_GUN_8_FOREIGN_OLD_NAME_32_SOURCE_AUDIT_PASS');
