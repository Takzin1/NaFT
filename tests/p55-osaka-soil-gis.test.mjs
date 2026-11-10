import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import vm from 'node:vm';

const reg=JSON.parse(readFileSync('research/p55-osaka-soil-shapefile-source-v1.json','utf8'));
const sha='1f75d80027ea0d1ea2718d00f0c8d5106694991733440544f3fd040155f8909d';
const land={'田':391,'普通畑':158,'牧草地':2,'樹園地':213};
assert.equal(reg.schema,'naft-p55-osaka-soil-shapefile-v1');
assert.equal(reg.source.provided_filename,'大阪府.zip');
assert.equal(reg.source.source_zip_sha256,sha);
assert.equal(reg.source.zip_bytes,1989097);
assert.equal(reg.source.uncompressed_bytes,3780922);
assert.equal(reg.source.zip_entries,7);
assert.equal(reg.source.members.length,7);
assert.equal(reg.source.members.reduce((a,x)=>a+x.bytes,0),3780922);
assert.deepEqual(reg.source.members.map(x=>x.name),
  ['dbf','prj','sbn','sbx','shp','shp.xml','shx'].map(x=>'k27大阪府.'+x));
assert.ok(reg.source.members.every(x=>/^[a-f0-9]{64}$/.test(x.sha256)));
assert.equal(reg.source.original_zip_committed,false);
assert.equal(reg.source.raw_geometry_committed,false);
assert.equal(reg.source.redistribution_rights,'NOT_VERIFIED');
assert.equal(reg.source.publisher_authentication,'NOT_VERIFIED');
assert.equal(reg.source.source_match,'CONSISTENT_METADATA_NO_OFFICIAL_ZIP_SHA_COMPARISON');
assert.equal(reg.source.metadata_creation_date,'2017-01-17');
assert.equal(reg.geometry.type,'POLYGON');
assert.equal(reg.geometry.shape_count,764);
assert.equal(reg.geometry.crs,'GCS_JGD_2000');
assert.deepEqual(reg.geometry.bounds_lon_lat,[135.09810442287565,34.273691451029,135.74367044727964,35.042092491955]);
assert.equal(reg.geometry.municipality_name_count,54);
assert.equal(reg.geometry.unique_jcodes,57);
assert.equal(reg.geometry.administrative_code_name_pairs,129);
assert.deepEqual(reg.geometry.sicho_counts,{'':764});
assert.deepEqual(reg.geometry.gun_counts,{'':630,'三島郡':5,'南河内郡':67,'泉北郡':5,'泉南郡':22,'豊能郡':35});
assert.deepEqual(reg.feature_counts_by_landuse,land);
assert.equal(reg.soil_group_code_categories,12);
assert.equal(reg.soil_fine_class_categories,43);
assert.equal(reg.soil_group_missing_features,2);
assert.equal(reg.soil_detail_missing_features,2);
assert.equal(reg.soil_class_missing_records.length,2);
assert.deepEqual(reg.soil_class_missing_records.map(r=>r.municipality_name),['千早赤阪村','富田林市']);
assert.deepEqual(reg.soil_class_missing_records.map(r=>r.record_index_zero_based),[0,1]);
assert.ok(reg.soil_class_missing_records.every(r=>r.JCODE==='27214'&&r.landuse==='樹園地'&&r.missing_fields.length===4));

const codePairs=reg.jcode_name_pairs_counts_by_landuse;
const gunPairs=reg.gun_name_pairs_counts_by_landuse;
assert.equal(codePairs.length,129);
assert.equal(gunPairs.length,63);
assert.equal(new Set(codePairs.map(r=>r[0]+'|'+r[1])).size,129);
assert.equal(new Set(gunPairs.map(r=>r[0]+'|'+r[1])).size,63);
assert.equal(new Set(codePairs.map(r=>r[0])).size,57);
assert.equal(new Set(codePairs.map(r=>r[1])).size,54);
const landValues=Object.values(land);
for(const pairs of [codePairs,gunPairs]){
 assert.ok(pairs.every(r=>r.length===6&&r.slice(2).every(v=>Number.isInteger(v)&&v>=0)));
 assert.deepEqual([0,1,2,3].map(i=>pairs.reduce((a,r)=>a+r[2+i],0)),landValues);
}
const foreign=codePairs.filter(r=>!r[0].startsWith('27'));
assert.equal(foreign.length,5);
assert.equal(foreign.reduce((a,r)=>a+r.slice(2).reduce((b,c)=>b+c,0),0),7);
assert.deepEqual(foreign,reg.source_code_name_anomalies.foreign_prefecture_code_pairs);
assert.deepEqual(reg.source_code_name_anomalies.foreign_code_prefix_totals,{'26':7});
assert.equal(Object.keys(reg.source_code_name_anomalies.codes_with_multiple_names).length,31);
assert.equal(Object.keys(reg.source_code_name_anomalies.names_with_multiple_codes).length,41);
assert.equal(reg.source_code_name_anomalies.one_to_one_code_name_mapping,false);
assert.equal(reg.source_code_name_anomalies.status,'UNRESOLVED_ORIGINAL_KEPT_NO_CITY_JOIN');
const gq=reg.source_gun_quality;
assert.equal(gq.empty_gun_features_for_known_gun_towns,46);
assert.equal(gq.empty_gun_name_pairs_with_nonempty_gun_elsewhere.reduce((a,r)=>a+r.empty_gun_polygon_count,0),46);
assert.deepEqual(gq.multiple_nonempty_guns_per_municipality_name,{});
assert.equal(gq.status,'SOURCE_NULL_PRESERVED_GUN_COMPLETENESS_PENDING');
assert.equal(reg.scientific_boundaries.calculation_of_certified_credits_prohibited,true);
assert.equal(reg.scientific_boundaries.official_credit_tco2e,null);
assert.equal(reg.scientific_boundaries.soil_class_missingness_detected,true);
assert.equal(reg.scientific_boundaries.municipality_level_aggregations_pending_reconciliation,true);

const run=spawnSync('python3',['scripts/p55-osaka-soil-audit.py','audit'],{encoding:'utf8',timeout:20000});
assert.equal(run.status,0,run.stderr);
const status=JSON.parse(run.stdout);
assert.equal(status.status,'REGISTER_CONSISTENT_RAW_NOT_COMMITTED');
assert.equal(status.polygons,764);
assert.equal(status.raw_original_verified_in_ci,false);
const bad=spawnSync('python3',['scripts/p55-osaka-soil-audit.py','verify','/dev/null'],{encoding:'utf8',timeout:20000});
assert.notEqual(bad.status,0);
assert.match(bad.stderr,/P55_OSAKA_SOURCE_BLOCKED:ZIP_SIZE/);

const ctx={gxEsc:s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;')};
vm.createContext(ctx);
vm.runInContext(readFileSync('src/gx-osaka-soil.js','utf8'),ctx);
assert.equal(ctx.gxOsakaSoilValidate(),true);
assert.equal(ctx.GX_OSAKA_HASH,sha);
assert.deepEqual(JSON.parse(JSON.stringify(ctx.GX_OSAKA_CODE_PAIRS)),codePairs);
assert.deepEqual(JSON.parse(JSON.stringify(ctx.GX_OSAKA_GUN_PAIRS)),gunPairs);
assert.deepEqual(JSON.parse(JSON.stringify(Object.fromEntries(ctx.GX_OSAKA_LANDUSE))),land);
assert.equal(ctx.gxOsakaSoilPanel('26'),'');
assert.equal(ctx.gxOsakaSoilPanel('25'),'');
const html=ctx.gxOsakaSoilPanel('27');
for(const value of ['大阪府の農耕地土壌GIS','764件','129通り','63組合せ',
                     '京都府','千早赤阪村','富田林市','46件','2件','要照合',
                     '元データを補完・正規化せず','面積haではありません',
                     'p55-osaka-soil-shapefile-source-v1.json'])assert.ok(html.includes(value),value);
ctx.GX_OSAKA_CODE_PAIRS[0][2]++;
assert.throws(()=>ctx.gxOsakaSoilValidate(),/P55_OSAKA_/);
ctx.GX_OSAKA_CODE_PAIRS[0][2]--;
ctx.GX_OSAKA_GUN_PAIRS[0][2]++;
assert.throws(()=>ctx.gxOsakaSoilValidate(),/P55_OSAKA_/);
ctx.GX_OSAKA_GUN_PAIRS[0][2]--;
ctx.GX_OSAKA_MISSING_CLASS[0].JCODE='99999';
assert.throws(()=>ctx.gxOsakaSoilValidate(),/P55_OSAKA_SOIL_NULL_GUARD/);

const app=readFileSync('naft-app.html','utf8');
const atlas=readFileSync('src/gx-data-explorer.js','utf8');
assert.ok(app.includes('src/gx-osaka-soil.js'));
assert.ok(app.indexOf('src/gx-osaka-soil.js')<app.indexOf('src/gx-data-explorer.js'));
assert.ok(atlas.includes('gxOsakaSoilPanel(current.code)'));
for(const name of ['Hokkaido','Aomori','Iwate','Miyagi','Yamagata','Akita',
 'Fukushima','Ibaraki','Tochigi','Saitama','Gunma','Tokyo','Chiba','Kanagawa',
 'Niigata','Ishikawa','Toyama','Fukui','Yamanashi','Nagano','Gifu','Shizuoka',
 'Aichi','Mie','Shiga','Kyoto']){
 assert.ok(atlas.includes('gx'+name+'SoilPanel(current.code)'),name);
}
console.log('NAFT_P55_OSAKA_764_POLYGONS_CODE129_GUN63_ORIGINAL_ANOMALIES_GUARDED_PASS');
