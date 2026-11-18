import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import vm from 'node:vm';

// P78: the lazy GIS layer manifest is the single wiring point for prefecture panels.
const html=readFileSync('naft-app.html','utf8');
const m=/<script type="application\/json" id="gx-lazy-layer-manifest">\n([\s\S]*?)\n<\/script>/.exec(html);
assert.ok(m,'manifest block missing');
const manifest=JSON.parse(m[1]);
const ctx={};vm.createContext(ctx);vm.runInContext(readFileSync('src/gx-layer-loader.js','utf8'),ctx);
ctx.__m=manifest;vm.runInContext('gxLayerManifestValidate(__m)',ctx);

const soil=manifest.layers.filter(l=>l.kind==='soil');
assert.equal(soil.length,47);
assert.deepEqual(soil.map(l=>l.pref),Array.from({length:47},(_,i)=>String(i+1).padStart(2,'0')));
const reg=JSON.parse(readFileSync('research/p76-national-soil-evidence-registry-v1.json','utf8'));
for(const l of soil){
 assert.ok(existsSync(l.src),l.src);
 const src=readFileSync(l.src,'utf8');
 assert.ok(src.includes('function '+l.panel+'('),l.panel);
 assert.ok(src.includes("prefCode!=='"+l.pref+"'"),'panel guard/manifest code mismatch '+l.src);
 const name=/gx-([a-z]+)-soil\.js$/.exec(l.src)[1];
 const rec=reg.records.find(r=>r.source.ledger_path.includes('-'+name+'-soil-'));
 assert.equal(rec.prefecture_code,l.pref,'P76 registry code mismatch '+name);
}
// No eager prefecture soil scripts; loader before explorer; forest Packs after the compiler.
assert.equal((html.match(/<script defer src="src\/gx-[a-z]+-soil\.js">/g)||[]).length,0);
const order=f=>html.indexOf('<script defer src="'+f+'"');
assert.ok(order('src/mrv-compiler.js')<order('src/forest-packs.js'));
assert.ok(order('src/gx-layer-loader.js')<order('src/gx-data-explorer.js'));
assert.ok(order('src/gx-forest-stand.js')<order('src/gx-data-explorer.js'));
// Manifest validation fails closed on path or kind tampering.
for(const bad of [{...soil[0],src:'https://evil.example/x.js'},{...soil[0],src:'src/../x-soil.js'},{...soil[0],kind:'mine'},{...soil[0],pref:'48'},{...soil[0],panel:'alert'}]){
 ctx.__m={schema:manifest.schema,layers:[bad]};
 assert.throws(()=>vm.runInContext('gxLayerManifestValidate(__m)',ctx),/P78_LAYER_/);
}
ctx.__m={schema:manifest.schema,layers:[soil[0],soil[0]]};
assert.throws(()=>vm.runInContext('gxLayerManifestValidate(__m)',ctx),/P78_LAYER_DUPLICATE/);
const scripts=(html.match(/<script defer src=/g)||[]).length;
// Budget guards against returning to per-prefecture eager loading (was 76); small feature modules may be added.
assert.ok(scripts<=40,'eager script count regressed: '+scripts);
console.log('NAFT_P78_GIS_LAYER_MANIFEST_PASS',JSON.stringify({soil_layers:soil.length,eager_scripts:scripts}));
