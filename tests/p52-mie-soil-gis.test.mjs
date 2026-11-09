import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import vm from 'node:vm';

const m=JSON.parse(readFileSync('research/p52-mie-soil-shapefile-source-v1.json','utf8'));
const SHA='d5664f056820a9957a7dadfca398d927f82e694532ad5965a8ad812337523ce1';
assert.equal(m.schema,'naft-p52-mie-soil-shapefile-v1');
assert.equal(m.source.provided_filename,'三重県.zip');
assert.equal(m.source.source_zip_sha256,SHA);
assert.equal(m.source.zip_bytes,7025476);
assert.equal(m.source.uncompressed_bytes,11810962);
assert.equal(m.source.members.length,7);
assert.equal(m.source.members.reduce((s,x)=>s+x.bytes,0),11810962);
assert.ok(m.source.members.every(x=>x.name.startsWith('k24三重県.')&&/^[a-f0-9]{64}$/.test(x.sha256)));
assert.equal(m.source.publisher_authentication,'NOT_VERIFIED');
assert.equal(m.source.redistribution_rights,'NOT_VERIFIED');
assert.equal(m.source.source_match,'CONSISTENT_METADATA_NO_OFFICIAL_ZIP_SHA_COMPARISON');
assert.equal(m.source.original_zip_committed,false);
assert.equal(m.source.raw_geometry_committed,false);
assert.equal(m.geometry.type,'POLYGON');
assert.equal(m.geometry.crs,'GCS_JGD_2000');
assert.deepEqual(m.geometry.bounds_lon_lat,[135.85774174419456,33.724702511083706,136.92376760129673,35.236689212016046]);
assert.equal(m.geometry.shape_count,1626);
assert.equal(m.geometry.municipality_name_count,29);
assert.equal(m.geometry.unique_jcodes,31);
assert.equal(m.geometry.administrative_code_name_pairs,58);
assert.deepEqual(m.geometry.sicho_unique_values,['']);
assert.deepEqual(m.geometry.sicho_counts,{'':1626});
const gun={'':1104,'三重郡':61,'北牟婁郡':29,'南牟婁郡':79,'員弁郡':21,'多気郡':159,'度会郡':161,'桑名郡':12};
assert.deepEqual(m.geometry.gun_counts,gun);
assert.deepEqual(m.feature_counts_by_landuse,{'田':669,'普通畑':509,'牧草地':36,'樹園地':412});
assert.equal(m.soil_group_code_categories,18);
assert.equal(m.soil_fine_class_categories,99);
assert.equal(m.soil_group_missing_features,1);
assert.equal(m.soil_detail_missing_features,1);
assert.deepEqual(m.soil_missing_record_examples,[{
 record_number_1based:413,jcode:'24210',municipality_name:'亀山市',
 landuse:'田',missing_fields:['包括_統群','統群コード','亜群コード','群コード']
}]);
const cp=m.jcode_name_pairs_counts_by_landuse,gp=m.gun_name_pairs_counts_by_landuse;
assert.equal(cp.length,58);
assert.equal(gp.length,41);
assert.equal(new Set(cp.map(r=>r[0]+'|'+r[1])).size,58);
assert.equal(new Set(gp.map(r=>r[0]+'|'+r[1])).size,41);
assert.equal(new Set(cp.map(r=>r[0])).size,31);
assert.equal(new Set(cp.map(r=>r[1])).size,29);
assert.deepEqual([0,1,2,3].map(i=>cp.reduce((s,r)=>s+r[i+2],0)),[669,509,36,412]);
assert.deepEqual([0,1,2,3].map(i=>gp.reduce((s,r)=>s+r[i+2],0)),[669,509,36,412]);
const a=m.source_code_name_anomalies;
assert.deepEqual(cp.filter(r=>!r[0].startsWith('24')),[
 ['21221','桑名市',3,0,0,3],['23235','木曽岬町',2,1,0,0]
]);
assert.deepEqual(a.foreign_prefecture_code_pairs,cp.filter(r=>!r[0].startsWith('24')));
assert.equal(a.foreign_prefecture_code_feature_count,9);
assert.deepEqual(a.foreign_code_prefix_totals,{'21':6,'23':3});
assert.deepEqual(a.foreign_prefixes,['21','23']);
assert.equal(Object.keys(a.codes_with_multiple_names).length,14);
assert.equal(Object.keys(a.names_with_multiple_codes).length,19);
assert.equal(a.one_to_one_code_name_mapping,false);
assert.equal(a.status,'UNRESOLVED_ORIGINAL_KEPT_NO_CITY_JOIN');
const q=m.source_gun_quality;
assert.deepEqual(q.gun_feature_counts,gun);
assert.equal(q.empty_gun_features_for_names_with_county_elsewhere,80);
assert.equal(q.empty_gun_name_pairs_with_nonempty_gun_elsewhere.reduce((s,r)=>s+r.empty_gun_polygon_count,0),80);
assert.deepEqual(q.multiple_nonempty_guns_per_municipality_name,{
 '大紀町':['多気郡','度会郡'],'度会町':['多気郡','度会郡'],'玉城町':['多気郡','度会郡']
});
assert.equal(q.status,'UNRESOLVED_ORIGINAL_KEPT_NO_GUN_JOIN');
assert.equal(m.scientific_boundaries.official_credit_tco2e,null);
assert.equal(m.scientific_boundaries.soil_classification_null_detected,true);
assert.equal(m.scientific_boundaries.municipality_level_aggregations_pending_reconciliation,true);
const ares=spawnSync('python3',['scripts/p52-mie-soil-audit.py','audit'],{encoding:'utf8',timeout:20000});
assert.equal(ares.status,0,ares.stderr);
const result=JSON.parse(ares.stdout);
assert.equal(result.status,'REGISTER_CONSISTENT_RAW_NOT_COMMITTED');
assert.equal(result.polygons,1626);
assert.equal(result.raw_original_verified_in_ci,false);
const bad=spawnSync('python3',['scripts/p52-mie-soil-audit.py','verify','/dev/null'],{encoding:'utf8',timeout:20000});
assert.notEqual(bad.status,0);
assert.match(bad.stderr,/P52_MIE_SOURCE_BLOCKED:ZIP_FILE_SIZE/);
const ctx={gxEsc:s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;')};
vm.createContext(ctx);
vm.runInContext(readFileSync('src/gx-mie-soil.js','utf8'),ctx);
assert.equal(ctx.gxMieSoilValidate(),true);
assert.equal(ctx.GX_MIE_SOURCE_HASH,SHA);
assert.deepEqual(JSON.parse(JSON.stringify(ctx.GX_MIE_CODE_NAME_PAIRS)),cp);
assert.deepEqual(JSON.parse(JSON.stringify(ctx.GX_MIE_GUN_NAME_PAIRS)),gp);
assert.deepEqual(JSON.parse(JSON.stringify(Object.fromEntries(ctx.GX_MIE_GUN))),gun);
assert.deepEqual(JSON.parse(JSON.stringify(Object.fromEntries(ctx.GX_MIE_LANDUSE))),m.feature_counts_by_landuse);
assert.deepEqual(JSON.parse(JSON.stringify(ctx.GX_MIE_SOIL_NULL)),m.soil_missing_record_examples);
assert.equal(ctx.gxMieSoilPanel('23'),'');
assert.equal(ctx.gxMieSoilPanel('21'),'');
const html=ctx.gxMieSoilPanel('24');
assert.match(html,/三重県の農耕地土壌GIS/);
assert.match(html,/1,626件/);
assert.match(html,/58組合せ/);
assert.match(html,/41組合せ/);
assert.match(html,/桑名市/);
assert.match(html,/木曽岬町/);
assert.match(html,/郡名空欄80件/);
assert.match(html,/土壌分類4項目が空欄/);
assert.match(html,/亀山市/);
assert.match(html,/原本を自動補正せず/);
assert.match(html,/原本GUN/);
assert.match(html,/面積haではありません/);
assert.match(html,/要照合/);
assert.match(html,/p52-mie-soil-shapefile-source-v1.json/);
ctx.GX_MIE_CODE_NAME_PAIRS[0][2]++;
assert.throws(()=>ctx.gxMieSoilValidate(),/P52_MIE_/);
ctx.GX_MIE_CODE_NAME_PAIRS[0][2]--;
ctx.GX_MIE_GUN_NAME_PAIRS.find(r=>r[0]==='多気郡'&&r[1]==='玉城町')[2]++;
assert.throws(()=>ctx.gxMieSoilValidate(),/P52_MIE_/);
ctx.GX_MIE_GUN_NAME_PAIRS.find(r=>r[0]==='多気郡'&&r[1]==='玉城町')[2]--;
ctx.GX_MIE_SOIL_NULL[0].missing_fields.pop();
assert.throws(()=>ctx.gxMieSoilValidate(),/P52_MIE_SOIL_NULL/);
const app=readFileSync('naft-app.html','utf8');
const atlas=readFileSync('src/gx-data-explorer.js','utf8');
assert.ok(app.includes('src/gx-mie-soil.js'));
assert.ok(app.indexOf('src/gx-mie-soil.js')<app.indexOf('src/gx-data-explorer.js'));
assert.ok(atlas.includes('gxMieSoilPanel(current.code)'));
for(const name of ['Hokkaido','Aomori','Iwate','Miyagi','Yamagata','Akita','Fukushima',
 'Ibaraki','Tochigi','Saitama','Gunma','Tokyo','Chiba','Kanagawa','Niigata','Ishikawa',
 'Toyama','Fukui','Yamanashi','Nagano','Gifu','Shizuoka','Aichi']){
 assert.ok(atlas.includes('gx'+name+'SoilPanel(current.code)'),name);
}
console.log('NAFT_P52_MIE_1626_POLYGONS_58_CODE_PAIRS_41_GUN_PAIRS_SOURCE_NULL_GUARD_PASS');
