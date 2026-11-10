import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import vm from 'node:vm';

const m=JSON.parse(readFileSync('research/p75-okinawa-soil-shapefile-source-v1.json','utf8'));
const hash='68cb4b0950aaadc07ce1e98bf52497f66b34ed595cbec6b0b511f87b1310c68f';
assert.equal(m.schema,'naft-p75-okinawa-soil-shapefile-v1');
assert.equal(m.source.source_zip_sha256,hash);
assert.equal(m.source.zip_bytes,5541529);
assert.equal(m.source.uncompressed_bytes,8536300);
assert.equal(m.source.members.length,7);
assert.ok(m.source.members.every(x=>/^[a-f0-9]{64}$/.test(x.sha256)));
assert.equal(m.source.original_zip_committed,false);
assert.equal(m.source.raw_geometry_committed,false);
assert.equal(m.source.redistribution_rights,'NOT_VERIFIED');
assert.equal(m.geometry.shape_count,663);
assert.equal(m.geometry.municipality_name_count,41);
assert.equal(m.geometry.unique_jcodes,41);
assert.deepEqual(m.feature_counts_by_landuse,{'田':71,'普通畑':366,'牧草地':109,'樹園地':117});
assert.equal(m.jcode_name_pairs_counts_by_landuse.length,75);
assert.equal(m.gun_name_pairs_counts_by_landuse.length,55);
assert.equal(m.source_code_name_anomalies.foreign_prefecture_code_feature_count,0);
assert.deepEqual(m.source_code_name_anomalies.foreign_code_prefix_totals,{});
assert.deepEqual(m.source_code_name_anomalies.foreign_prefecture_code_pairs,[]);
assert.equal(Object.keys(m.source_code_name_anomalies.codes_with_multiple_names).length,19);
assert.equal(Object.keys(m.source_code_name_anomalies.names_with_multiple_codes).length,16);
assert.equal(m.source_gun_quality.blank_gun_features,272);
assert.equal(m.source_gun_quality.non_okinawa_gun_name_feature_count,0);
assert.equal(m.source_gun_quality.empty_gun_features_for_names_with_county_elsewhere,52);
assert.deepEqual(m.source_gun_quality.multiple_nonempty_guns_per_municipality_name,{'与那原町':['中頭郡','島尻郡'],'南風原町':['中頭郡','島尻郡']});
assert.equal(m.soil_group_code_categories,12);
assert.equal(m.soil_fine_class_categories,40);
assert.equal(m.soil_group_missing_features,0);
assert.equal(m.soil_detail_missing_features,0);
assert.equal(m.scientific_boundaries.calculation_of_certified_credits_prohibited,true);

const audit=spawnSync('python3',['scripts/p75-okinawa-soil-audit.py','audit'],{encoding:'utf8',timeout:30000});
assert.equal(audit.status,0,audit.stderr);
assert.equal(JSON.parse(audit.stdout).features,663);
assert.equal(JSON.parse(audit.stdout).private_zip_checked_in_ci,false);
const invalid=spawnSync('python3',['scripts/p75-okinawa-soil-audit.py','verify','/dev/null'],{encoding:'utf8',timeout:30000});
assert.notEqual(invalid.status,0);
assert.match(invalid.stderr,/P75_OKINAWA_SOURCE_BLOCKED:ORIGINAL_ZIP_SIZE/);

const ctx={gxEsc:s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;')};
vm.createContext(ctx);
vm.runInContext(readFileSync('src/gx-okinawa-soil.js','utf8'),ctx);
assert.equal(ctx.gxOkinawaSoilValidate(),true);
assert.equal(ctx.GX_OKINAWA_SOURCE_SHA,hash);
assert.deepEqual(JSON.parse(JSON.stringify(ctx.GX_OKINAWA_CODE_PAIRS)),m.jcode_name_pairs_counts_by_landuse);
assert.deepEqual(JSON.parse(JSON.stringify(ctx.GX_OKINAWA_GUN_PAIRS)),m.gun_name_pairs_counts_by_landuse);
assert.equal(ctx.gxOkinawaSoilPanel('46'),'');
const html=ctx.gxOkinawaSoilPanel('47');
for(const term of ['沖縄県の農耕地土壌GIS','663件','47系以外','中頭郡','島尻郡','与那原町','南風原町','75組合せ','55組合せ','要照合','農地面積ha'])assert.ok(html.includes(term),term);
ctx.GX_OKINAWA_CODE_PAIRS[0][2]++;
assert.throws(()=>ctx.gxOkinawaSoilValidate(),/P75_OKINAWA_/);
ctx.GX_OKINAWA_CODE_PAIRS[0][2]--;
assert.equal(ctx.gxOkinawaSoilValidate(),true);
ctx.GX_OKINAWA_GUN_PAIRS[0][2]++;
assert.throws(()=>ctx.gxOkinawaSoilValidate(),/P75_OKINAWA_/);

const app=readFileSync('naft-app.html','utf8'),explorer=readFileSync('src/gx-data-explorer.js','utf8'),runner=readFileSync('tests/run.sh','utf8');
assert.ok(app.includes('src/gx-okinawa-soil.js'));
assert.ok(app.indexOf('src/gx-okinawa-soil.js')<app.indexOf('src/gx-data-explorer.js'));
assert.ok(explorer.includes('gxKagoshimaSoilPanel(current.code)'));
assert.ok(explorer.includes('gxOkinawaSoilPanel(current.code)'));
assert.ok(runner.includes('python3 scripts/p75-okinawa-soil-audit.py audit'));
assert.ok(runner.includes('node tests/p75-okinawa-soil-gis.test.mjs'));

// National source-ledger coverage gate: 47 distinct, consecutive P29..P75 records.
// This proves aggregate-ledger presence, not that raw geospatial data may be republished.
const ledgers=readdirSync('research').filter(f=>/^p\d+-[a-z0-9-]+-soil-shapefile-source-v1\.json$/.test(f));
const indexes=ledgers.map(f=>Number(/^p(\d+)-/.exec(f)[1])).sort((a,b)=>a-b);
assert.deepEqual(indexes,Array.from({length:47},(_,i)=>i+29));
const coverage=ledgers.map(file=>JSON.parse(readFileSync('research/'+file,'utf8')));
assert.equal(coverage.length,47);
assert.ok(coverage.every(x=>Number.isSafeInteger(x.geometry?.shape_count)&&x.geometry.shape_count>0&&x.source?.members?.length===7&&/^[0-9a-f]{64}$/.test(x.source?.source_zip_sha256||'')));
console.log('NAFT_P75_OKINAWA_663_POLYGONS_75_JCODE_PAIRS_55_GUN_PAIRS_NATIONAL_47_OF_47_SOURCE_LEDGERS_PASS');
