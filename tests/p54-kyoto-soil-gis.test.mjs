import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import vm from 'node:vm';

const m=JSON.parse(readFileSync('research/p54-kyoto-soil-shapefile-source-v1.json','utf8'));
const sha='f5440640ef355f37e6bd4ee67f2039521407f252398fdfdabcb3b5fbf221bf9a';
const land={'田':452,'普通畑':279,'牧草地':11,'樹園地':227};
assert.equal(m.schema,'naft-p54-kyoto-soil-shapefile-v1');
assert.equal(m.source.provided_filename,'京都府.zip');
assert.equal(m.source.source_zip_sha256,sha);
assert.equal(m.source.zip_bytes,3960656);
assert.equal(m.source.uncompressed_bytes,6770512);
assert.equal(m.source.members.length,7);
assert.equal(m.source.members.reduce((a,r)=>a+r.bytes,0),6770512);
assert.ok(m.source.members.every(r=>r.name.startsWith('k26京都府.')&&/^[0-9a-f]{64}$/.test(r.sha256)));
assert.equal(m.source.publisher_authentication,'NOT_VERIFIED');
assert.equal(m.source.redistribution_rights,'NOT_VERIFIED');
assert.equal(m.source.source_match,'CONSISTENT_METADATA_NO_OFFICIAL_ZIP_SHA_COMPARISON');
assert.equal(m.source.original_zip_committed,false);
assert.equal(m.source.raw_geometry_committed,false);

assert.equal(m.geometry.type,'POLYGON');
assert.equal(m.geometry.crs,'GCS_JGD_2000');
assert.equal(m.geometry.shape_count,969);
assert.equal(m.geometry.municipality_name_count,33);
assert.equal(m.geometry.unique_jcodes,37);
assert.equal(m.geometry.administrative_code_name_pairs,75);
assert.deepEqual(m.geometry.bounds_lon_lat,[134.8673268777947,34.70883381293244,136.04693401420027,35.7663518420321]);
assert.deepEqual(m.geometry.sicho_counts,{'':969});
assert.deepEqual(m.geometry.sicho_unique_values,['']);
assert.deepEqual(m.geometry.gun_counts,{
  '':742,'与謝郡':46,'久世郡':12,'乙訓郡':5,'大飯郡':1,'相楽郡':64,'綴喜郡':41,'船井郡':58
});
assert.deepEqual(m.feature_counts_by_landuse,land);
assert.equal(m.soil_group_code_categories,18);
assert.equal(m.soil_fine_class_categories,64);
assert.equal(m.soil_group_missing_features,1);
assert.equal(m.soil_detail_missing_features,1);
assert.deepEqual(m.soil_missing_records,[{
 record_index_zero_based:227,JCODE:'26407',municipality_name:'京丹波町',gun:'船井郡',
 landuse:'田',missing_fields:['包括_統群','統群コード','亜群コード','群コード']
}]);

const cp=m.jcode_name_pairs_counts_by_landuse;
const gp=m.gun_name_pairs_counts_by_landuse;
const counts=rows=>[0,1,2,3].map(i=>rows.reduce((a,r)=>a+r[i+2],0));
assert.equal(cp.length,75);
assert.equal(gp.length,44);
assert.equal(new Set(cp.map(r=>r[0]+'|'+r[1])).size,75);
assert.equal(new Set(gp.map(r=>r[0]+'|'+r[1])).size,44);
assert.deepEqual(counts(cp),[452,279,11,227]);
assert.deepEqual(counts(gp),[452,279,11,227]);
assert.equal(new Set(cp.map(r=>r[0])).size,37);
assert.equal(new Set(cp.map(r=>r[1])).size,33);

const foreign=cp.filter(r=>!r[0].startsWith('26'));
assert.equal(foreign.length,6);
assert.equal(foreign.reduce((a,r)=>a+r.slice(2).reduce((b,n)=>b+n,0),0),10);
assert.deepEqual(m.source_code_name_anomalies.foreign_prefecture_code_pairs,foreign);
assert.deepEqual(m.source_code_name_anomalies.foreign_code_prefix_totals,{'18':1,'24':2,'25':7});
assert.equal(m.source_code_name_anomalies.foreign_prefecture_code_feature_count,10);
assert.equal(Object.keys(m.source_code_name_anomalies.codes_with_multiple_names).length,23);
assert.equal(Object.keys(m.source_code_name_anomalies.names_with_multiple_codes).length,26);
assert.equal(m.source_code_name_anomalies.one_to_one_code_name_mapping,false);
assert.equal(m.source_code_name_anomalies.status,'UNRESOLVED_ORIGINAL_KEPT_NO_CITY_JOIN');

const quality=m.source_gun_quality;
assert.equal(quality.empty_gun_features_for_names_with_county_elsewhere,88);
assert.equal(quality.empty_gun_name_pairs_with_nonempty_gun_elsewhere.reduce((a,r)=>a+r.empty_gun_polygon_count,0),88);
assert.deepEqual(quality.multiple_nonempty_guns_per_municipality_name,{'和束町':['相楽郡','綴喜郡']});
assert.deepEqual(quality.foreign_gun_name_records,[{'gun':'大飯郡','municipality_name':'舞鶴市','JCODE':'18481','landuse':'田'}]);
assert.deepEqual(gp.find(r=>r[0]==='大飯郡'&&r[1]==='舞鶴市'),['大飯郡','舞鶴市',1,0,0,0]);
assert.deepEqual(gp.find(r=>r[0]==='綴喜郡'&&r[1]==='和束町'),['綴喜郡','和束町',0,0,0,1]);
assert.equal(quality.status,'UNRESOLVED_ORIGINAL_KEPT_NO_GUN_JOIN');
assert.equal(m.scientific_boundaries.jcode_name_conflict_detected,true);
assert.equal(m.scientific_boundaries.gun_name_conflict_detected,true);
assert.equal(m.scientific_boundaries.soil_classification_missing_detected,true);
assert.equal(m.scientific_boundaries.official_credit_tco2e,null);
assert.equal(m.scientific_boundaries.calculation_of_certified_credits_prohibited,true);
assert.equal(m.scientific_boundaries.municipality_level_aggregations_pending_reconciliation,true);

const audit=spawnSync('python3',['scripts/p54-kyoto-soil-audit.py','audit'],{encoding:'utf8',timeout:20000});
assert.equal(audit.status,0,audit.stderr);
const result=JSON.parse(audit.stdout);
assert.equal(result.status,'REGISTER_CONSISTENT_RAW_NOT_COMMITTED');
assert.equal(result.polygons,969);
assert.equal(result.raw_original_verified_in_ci,false);
const invalid=spawnSync('python3',['scripts/p54-kyoto-soil-audit.py','verify','/dev/null'],{encoding:'utf8',timeout:20000});
assert.notEqual(invalid.status,0);
assert.match(invalid.stderr,/P54_KYOTO_SOURCE_BLOCKED:ORIGINAL_ZIP_SIZE/);

const context={gxEsc:s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;')};
vm.createContext(context);
vm.runInContext(readFileSync('src/gx-kyoto-soil.js','utf8'),context);
assert.equal(context.GX_KYOTO_HASH,sha);
assert.equal(context.gxKyotoSoilValidate(),true);
assert.deepEqual(JSON.parse(JSON.stringify(context.GX_KYOTO_CODE_PAIRS)),cp);
assert.deepEqual(JSON.parse(JSON.stringify(context.GX_KYOTO_GUN_PAIRS)),gp);
assert.deepEqual(JSON.parse(JSON.stringify(Object.fromEntries(context.GX_KYOTO_GUN_COUNTS))),m.geometry.gun_counts);
assert.equal(context.gxKyotoSoilPanel('25'),'');
assert.equal(context.gxKyotoSoilPanel('24'),'');
const html=context.gxKyotoSoilPanel('26');
for(const term of ['京都府の農耕地土壌GIS','969件','75組合せ','44組合せ','京丹波町','JCODE26407','舞鶴市','大飯郡','和束町','綴喜郡','88件','10件','要照合','面積haではありません','p54-kyoto-soil-shapefile-source-v1.json']){
 assert.ok(html.includes(term),term);
}
context.GX_KYOTO_CODE_PAIRS[0][2]++;
assert.throws(()=>context.gxKyotoSoilValidate(),/P54_KYOTO_/);
context.GX_KYOTO_CODE_PAIRS[0][2]--;
context.GX_KYOTO_GUN_PAIRS.find(r=>r[0]==='大飯郡'&&r[1]==='舞鶴市')[2]++;
assert.throws(()=>context.gxKyotoSoilValidate(),/P54_KYOTO_/);

const app=readFileSync('naft-app.html','utf8');
const atlas=readFileSync('src/gx-data-explorer.js','utf8');
assert.ok(app.includes('src/gx-kyoto-soil.js'));
assert.ok(app.indexOf('src/gx-kyoto-soil.js')<app.indexOf('src/gx-data-explorer.js'));
assert.ok(atlas.includes('gxKyotoSoilPanel(current.code)'));
for(const name of ['Hokkaido','Aomori','Iwate','Miyagi','Yamagata','Akita','Fukushima',
'Ibaraki','Tochigi','Saitama','Gunma','Tokyo','Chiba','Kanagawa','Niigata','Ishikawa',
'Toyama','Fukui','Yamanashi','Nagano','Gifu','Shizuoka','Aichi','Mie','Shiga']){
 assert.ok(atlas.includes('gx'+name+'SoilPanel(current.code)'),name);
}
console.log('NAFT_P54_KYOTO_969_FEATURES_75_JCODE_PAIRS_44_GUN_PAIRS_10_FOREIGN_SOIL_MISSING_GUARD_PASS');
