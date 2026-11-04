import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const prior=[
 ['p21-jaxa-lulc-2024-v25-04-batch01.json','tiles'],
 ['p22-jaxa-lulc-2024-v25-04-batch02.json','rasters'],
 ['p23-jaxa-lulc-2024-v25-04-batch03.json','rasters'],
 ['p24-jaxa-lulc-2024-v25-04-batch04.json','rasters']
];
const docs=prior.map(([name,key])=>JSON.parse(readFileSync('research/'+name,'utf8'))[key]);
const latest=JSON.parse(readFileSync('research/p25-jaxa-lulc-2024-v25-04-batch05.json','utf8'));
assert.equal(latest.schema,'naft-p25-jaxa-lulc-2024-v25-04-batch05');
assert.equal(latest.year,2024);assert.equal(latest.version,'25.04');
assert.equal(latest.new_tiles,6);assert.equal(latest.known_tiles_after_batch,22);
assert.equal(latest.national_coverage_complete,false);
assert.equal(latest.source_geotiff_redistribution_permission_verified,false);
assert.equal(latest.source_publisher_byte_authentication_verified,false);
assert.equal(latest.original_geotiffs_committed,false);
assert.equal(latest.field_area_ha,null);assert.equal(latest.certified_tco2e,null);
assert.deepEqual(latest.rasters.map(t=>t.paddy_pixels),[0,680166,0,903110,7551974,3101175]);
assert.deepEqual(latest.rasters.map(t=>t.nodata),[null,null,null,0,null,null]);
assert.equal(latest.rasters.reduce((s,t)=>s+t.paddy_pixels,0),12236425);
const indexed=new Map();
for(const t of [...docs.flat(),...latest.rasters]){
 assert(!indexed.has(t.id),'DUPLICATE_JAXA_ID:'+t.id);indexed.set(t.id,t);
 assert.equal(t.count_by_class.length,15);
 assert.equal(t.count_by_class.reduce((s,n)=>s+n,0),144000000);
 assert.equal(t.count_by_class[0],t.water_pixels);
 assert.equal(t.count_by_class[2],t.paddy_pixels);
 assert.equal(t.ha,null);
}
assert.equal(indexed.size,22);
const scope={};vm.createContext(scope);
vm.runInContext(readFileSync('src/gx-jaxa-landcover-2024.js','utf8'),scope);
assert.equal(scope.gxJaxaValidate(),true);
const atlas=JSON.parse(JSON.stringify(scope.GX_JAXA_TILES));
assert.equal(atlas.length,22);
for(const t of atlas){
 const source=indexed.get(t.id);assert(source,'UI_WITHOUT_SOURCE:'+t.id);
 assert.deepEqual(t.bounds,source.bounds);assert.deepEqual(t.counts,source.count_by_class);
 assert.equal(t.water,source.water_pixels);assert.equal(t.paddy,source.paddy_pixels);
}
scope.GX_JAXA_SELECTED_TILE='LC_N39E141';
let html=scope.gxJaxaLandcoverPanel();
assert.match(html,/7,551,974/);assert.match(html,/22枚/);
assert.equal((html.match(/<option value=/g)||[]).length,22);
scope.GX_JAXA_SELECTED_TILE='LC_N40E141';html=scope.gxJaxaLandcoverPanel();assert.match(html,/3,101,175/);
scope.GX_JAXA_SELECTED_TILE='LC_N31E140';html=scope.gxJaxaLandcoverPanel();assert.match(html,/水田 \/ 分類3/);
scope.GX_JAXA_TILES[21].counts[0]+=1;
assert.throws(()=>scope.gxJaxaValidate(),/JAXA_CATEGORY_COUNT_MISMATCH/);
const smoke=readFileSync('tests/browser-gx-data-smoke.mjs','utf8');
assert.match(smoke,/P25_JAXA_39N141E/);assert.match(smoke,/P25_JAXA_40N141E/);
console.log('NAFT_P25_SIX_NEW_JAXA_RASTERS_22_TILE_ATLAS_SOURCE_PARITY_PASS');
