import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import vm from 'node:vm';

const g=JSON.parse(readFileSync('research/p35-fukushima-soil-shapefile-source-v1.json','utf8'));
assert.equal(g.schema,'naft-p35-fukushima-soil-shapefile-v1');
assert.equal(g.source.source_zip_sha256,'db264851d4e3ca44bcb90bf778e1cfa58a877f1af1ce1a5c77958ea1f56f7de6');
assert.equal(g.source.zip_bytes,18951682);
assert.equal(g.source.uncompressed_bytes,29683752);
assert.equal(g.source.members.length,7);
assert.equal(g.source.members.reduce((sum,m)=>sum+m.bytes,0),29683752);
assert.ok(g.source.members.every(m=>m.name.startsWith('k7福島県.')&&/^[a-f0-9]{64}$/.test(m.sha256)));
assert.equal(g.source.original_zip_committed,false);
assert.equal(g.source.raw_geometry_committed,false);
assert.equal(g.source.redistribution_rights,'NOT_VERIFIED');
assert.equal(g.geometry.shape_count,2407);
assert.equal(g.geometry.municipalities,59);
assert.equal(g.geometry.crs,'GCS_JGD_2000');
assert.deepEqual(g.geometry.sicho_unique_values,['']);
assert.deepEqual(g.geometry.bounds_lon_lat,[139.28773851975052,36.7546237957464,141.03852980345184,37.97169932055496]);
assert.deepEqual(g.feature_counts_by_landuse,{'田':865,'普通畑':856,'牧草地':259,'樹園地':427});
assert.equal(g.soil_group_code_categories,19);
assert.equal(g.soil_fine_class_categories,77);
assert.equal(g.scientific_boundaries.official_credit_tco2e,null);
assert.equal(g.scientific_boundaries.raw_geometry_licensed_for_publication,false);
for(const k of ['radiation_measurements_included','evacuation_zone_status_included','agricultural_resumption_status_included'])assert.equal(g.scientific_boundaries[k],false);
const rows=g.municipalities_counts_by_landuse;
assert.equal(rows.length,59);
assert.equal(new Set(rows.map(r=>r[0])).size,59);
assert.ok(rows.every(r=>r.length===6&&/^07[0-9]{3}$/.test(r[0])));
assert.deepEqual([0,1,2,3].map(i=>rows.reduce((s,r)=>s+r[2+i],0)),[865,856,259,427]);
for(const [code,name] of [['07201','福島市'],['07202','会津若松市'],['07545','大熊町'],['07546','双葉町'],['07547','浪江町'],['07564','飯舘村']]){
 assert.ok(rows.some(row=>row[0]===code&&row[1]===name),code);
}
const audit=spawnSync('python3',['scripts/p35-fukushima-soil-audit.py','audit'],{encoding:'utf8',timeout:10000});
assert.equal(audit.status,0,audit.stderr);
assert.equal(JSON.parse(audit.stdout).status,'REGISTER_CONSISTENT_RAW_NOT_COMMITTED');
const reject=spawnSync('python3',['scripts/p35-fukushima-soil-audit.py','verify','/dev/null'],{encoding:'utf8',timeout:10000});
assert.notEqual(reject.status,0);
assert.match(reject.stderr,/P35_FUKUSHIMA_SOURCE_BLOCKED:ZIP_SIZE/);

const box={gxEsc:s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;')};
vm.createContext(box);
vm.runInContext(readFileSync('src/gx-fukushima-soil.js','utf8'),box);
assert.equal(box.gxFukushimaSoilValidate(),true);
assert.equal(box.GX_FUKUSHIMA_SOURCE_HASH,g.source.source_zip_sha256);
assert.deepEqual(JSON.parse(JSON.stringify(box.GX_FUKUSHIMA_MUNICIPALITIES)),rows);
assert.deepEqual(JSON.parse(JSON.stringify(Object.fromEntries(box.GX_FUKUSHIMA_LANDUSE))),g.feature_counts_by_landuse);
assert.equal(box.gxFukushimaSoilPanel('01'),'');
assert.equal(box.gxFukushimaSoilPanel('05'),'');
const html=box.gxFukushimaSoilPanel('07');
assert.match(html,/福島県の農耕地土壌GIS/);
assert.match(html,/2,407/);
assert.match(html,/59市町村/);
assert.match(html,/会津若松市/);
assert.match(html,/原本ハッシュ/);
assert.match(html,/放射性物質/);
assert.match(html,/営農可否/);
assert.match(html,/面積haではありません/);
assert.equal((html.match(/<tr>/g)||[]).length,60);
box.GX_FUKUSHIMA_MUNICIPALITIES[0][2]++;
assert.throws(()=>box.gxFukushimaSoilValidate(),/P35_FUKUSHIMA_TOTAL/);

const app=readFileSync('naft-app.html','utf8');
const explorer=readFileSync('src/gx-data-explorer.js','utf8');
assert.ok(app.indexOf('src/gx-fukushima-soil.js')>0);
assert.ok(app.indexOf('src/gx-fukushima-soil.js')<app.indexOf('src/gx-data-explorer.js'));
assert.ok(explorer.includes('gxFukushimaSoilPanel(current.code)'));
for(const name of ['Hokkaido','Aomori','Iwate','Miyagi','Yamagata','Akita']){
 assert.ok(explorer.includes('gx'+name+'SoilPanel(current.code)'));
}
console.log('NAFT_P35_FUKUSHIMA_SOIL_GIS_INTAKE_AND_UI_PASS');
