import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const reg=JSON.parse(readFileSync('research/p21-jaxa-lulc-2024-v25-04-batch01.json','utf8'));
assert.equal(reg.version,'25.04');assert.equal(reg.year,2024);
assert.equal(reg.complete_national_coverage,false);assert.equal(reg.source_geotiff_committed,false);
assert.equal(reg.field_area_ha,null);assert.equal(reg.formal_credit_tco2e,null);
assert.equal(reg.categories.length,15);assert.equal(reg.categories[0].en,'Water bodies');assert.equal(reg.categories[2].en,'Paddy field');
assert.deepEqual(reg.tiles.map(t=>t.paddy_pixels),[0,32028,0]);
assert.deepEqual(reg.tiles.map(t=>t.water_pixels),[143981729,141661823,143999206]);
assert.deepEqual(reg.tiles.map(t=>t.nodata),[null,null,0]);
for(const t of reg.tiles){assert.equal(t.count_by_class.reduce((a,b)=>a+b,0),144000000);assert.equal(t.count_by_class[0],t.water_pixels);assert.equal(t.count_by_class[2],t.paddy_pixels);}
const box={};vm.createContext(box);vm.runInContext(readFileSync('src/gx-jaxa-landcover-2024.js','utf8'),box);
assert.equal(box.gxJaxaValidate(),true);
assert.equal(box.GX_JAXA_CATEGORIES[2],'水田');
for(let i=0;i<3;i++){assert.equal(box.GX_JAXA_TILES[i].id,reg.tiles[i].id);assert.deepEqual(Array.from(box.GX_JAXA_TILES[i].counts),reg.tiles[i].count_by_class);}
let s=box.gxJaxaLandcoverPanel();assert.match(s,/32,028/);assert.match(s,/NoData/);
assert.equal((s.match(/<tr>/g)||[]).length,16);box.GX_JAXA_SELECTED_TILE='LC_N24E131';
assert.match(box.gxJaxaLandcoverPanel(),/143,981,729/);
box.GX_JAXA_TILES[0].counts[0]++;assert.throws(()=>box.gxJaxaValidate(),/CATEGORY_COUNT_MISMATCH/);
const app=readFileSync('naft-app.html','utf8'),ui=readFileSync('src/mrv-ui.js','utf8'),gx=readFileSync('src/gx-data-explorer.js','utf8');
assert.ok(app.includes('src/gx-jaxa-landcover-2024.js'));assert.ok(app.indexOf('gx-jaxa-landcover-2024.js')<app.indexOf('gx-data-explorer.js'));
assert.ok(ui.includes('gx-jaxa-tile-select'));assert.ok(gx.includes('gxJaxaLandcoverPanel'));
console.log('P21_JAXA_2024_V2504_BATCH01_SOURCE_AND_UI_PASS');
