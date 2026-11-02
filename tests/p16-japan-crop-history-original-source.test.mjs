import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import vm from 'node:vm';
const read=p=>readFileSync(p,'utf8');
const source=JSON.parse(read('research/p16-japan-six-crop-1883-2022-original-source-receipt.json'));
assert.equal(source.schema,'naft-p16-japan-crop-archive-1883-2022-source-receipt-v1');
assert.equal(source.archive_sha256,'8e8ec4ef894f179b9d3ceb66fe8e9319f707b45cc652f4ece50a29a14e8772e6');
assert.equal(source.original_record_count,146160);
assert.equal(source.geography.prefecture_entries,47);
assert.equal(source.geography.regional_totals,10);
assert.equal(source.geography.national_total,1);
assert.equal(source.years.first,1883);
assert.equal(source.years.last,2022);
assert.equal(source.nationally_aggregated_crop_years,840);
assert.equal(source.national_area_production_vs_prefecture_sum_discrepancies,0);
assert.equal(source.regional_area_production_vs_prefecture_sum_discrepancies,0);
assert.equal(source.maximum_original_yield_rounding_error_tonnes_per_ha,0.005);
assert.equal(source.positive_production_zero_reported_area_records,59);
assert.equal(source.sweetpotato_2022_prefecture_zero_records,41);
assert.deepEqual(source.national_all_zero_years_for_potato_soybean_sweetpotato,[1885,1886,1888,1889,1890,1891,1893]);
assert.equal(source.registered_raw_source_redistributed,false);
assert.equal(source.publisher_license_verified_for_public_raw_redistribution,false);
assert.equal(source.cross_vintage_2023_2025_direct_comparison_authorized,false);
assert.equal(source.official_abatement_tco2e,null);
const expected=['Barley','Potato','Rice','Soybean','SweetPotato','Wheat'];
assert.deepEqual(source.crops,expected);
const ctx={};
vm.createContext(ctx);
for(const path of ['src/gx-japan-crop-history.js','src/gx-2025-prefecture.js','src/gx-data-explorer.js']){
 vm.runInContext(read(path),ctx,{timeout:5000,filename:path});
}
const data=JSON.parse(JSON.stringify(ctx.GX_CROP_HISTORY_BASE36));
assert.deepEqual(Object.keys(data),expected);
const raw=expected.map(crop=>crop+':'+data[crop]).join('\n');
const calculated=createHash('sha256').update(raw).digest('hex');
assert.equal(calculated,source.packed_national_vectors_sha256,'PACKED_NATIONAL_SERIES_DIFFERENT_FROM_REAL_ORIGINAL');
assert.equal(source.packed_national_vectors_sha256,'c67875e44bb2fecd4a6c0f56d35918bcc10cc6f28b5e9cc155a8897ec8176dac');
for(const crop of expected){
 const annual=JSON.parse(JSON.stringify(ctx.gxCropHistoryData(crop)));
 assert.equal(annual.length,140,crop);
 assert.equal(annual[0].year,1883);
 assert.equal(annual[139].year,2022);
 assert.ok(annual.every((y,i)=>y.year===1883+i&&Number.isInteger(y.production)&&Number.isInteger(y.surface)&&Number.isInteger(y.yield100)),crop);
 assert.ok(annual.every(y=>y.production>=0&&y.surface>=0&&y.yield100>=0),crop);
 const zeros=annual.filter(y=>y.possibleMissing).map(y=>y.year);
 assert.deepEqual(zeros,['Potato','Soybean','SweetPotato'].includes(crop)?
  [1885,1886,1888,1889,1890,1891,1893]:[],crop);
 for(const item of annual.filter(y=>!y.possibleMissing&&y.surface>0)){
  assert.ok(Math.abs(item.production/item.surface-item.yield100/100)<=0.0051,
    'yield rounding for '+crop+' '+item.year);
 }
}
const validate=(crop,first,last)=>{
 const arr=JSON.parse(JSON.stringify(ctx.gxCropHistoryData(crop)));
 assert.equal(arr[0].production,first);
 assert.equal(arr[139].production,last);
};
validate('Barley',637996,215898);
validate('Potato',48303,2282324);
validate('Rice',4566292,7266984);
validate('Soybean',284688,242806);
validate('SweetPotato',1096764,617000);
validate('Wheat',340253,993467);
ctx.GX_SELECTED_CROP_HISTORY='Rice';ctx.GX_SELECTED_CROP_HISTORY_YEAR=2022;
const rice=ctx.gxCropHistoryPanel();
for(const s of ['日本の農業生産','146,160','7,266,984','1,354,325','5.37','gx-crop-history-select',
'gx-crop-history-year','svg','1883','2022','41件','認証'])assert.ok(rice.includes(s),s);
ctx.GX_SELECTED_CROP_HISTORY='Potato';ctx.GX_SELECTED_CROP_HISTORY_YEAR=1885;
const missing=ctx.gxCropHistoryPanel();
assert.match(missing,/欠測疑い/);
assert.ok(!missing.includes('0 <small>t</small>'));
const page=ctx.pgGxDataExplorer();
assert.ok(page.includes('140-YEAR CROP PRODUCTION ARCHIVE'));
assert.ok(page.includes('2025'));
const html=read('naft-app.html');
const ui=read('src/mrv-ui.js');
assert.ok(html.includes('<script defer src="src/gx-japan-crop-history.js"></script>'));
assert.ok(html.indexOf('src/gx-japan-crop-history.js')<html.indexOf('src/gx-data-explorer.js'));
assert.ok(ui.includes("event.target.id==='gx-crop-history-select'"));
assert.ok(ui.includes("event.target.id==='gx-crop-history-year'"));
const py=spawnSync('python3',['-c',"import ast,pathlib;ast.parse(pathlib.Path('scripts/p16-japan-six-crop-original-zip-audit.py').read_text())"],{encoding:'utf8',timeout:15000});
assert.equal(py.status,0,py.stderr);
const script=read('scripts/p16-japan-six-crop-original-zip-audit.py');
for(const s of ['ARCHIVE_SHA','source_member_sha256','POSITIVE_PRODUCTION_ZERO_AREA_ANOMALY_COUNT_CHANGED',
 'SUSPECT_NATIONAL_ALL_ZERO_YEAR_CHANGED','national_packed_base36','PRIVATE_OUTPUT_EXISTS']){
 assert.ok(script.includes(s),s);
}
assert.ok(!script.includes('official_co2e_credits=1'));
console.log('NAFT_P16_JAPAN_CROP_HISTORY_PASS: 146160 original source observations in offline input; 840 national crop-years, 47 prefecture sum parity, 59 anomalies and no carbon credits');
