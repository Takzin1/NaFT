import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

/* P79: invariants every prefecture soil layer must satisfy, checked once for all 47 from the layer manifest.
 * Per-prefecture test files keep only prefecture-specific audit values; a new GIS layer needs no copy-paste. */
const html=readFileSync('naft-app.html','utf8');
const manifest=JSON.parse(/id="gx-lazy-layer-manifest">\n([\s\S]*?)\n<\/script>/.exec(html)[1]);
const reg=JSON.parse(readFileSync('research/p76-national-soil-evidence-registry-v1.json','utf8'));
const soil=manifest.layers.filter(l=>l.kind==='soil');
assert.equal(soil.length,47);
let total=0;
for(const l of soil){
 const src=readFileSync(l.src,'utf8');
 assert.ok(!/\b(fetch|XMLHttpRequest|WebSocket|importScripts|eval)\s*\(/.test(src),'no network/eval in '+l.src);
 assert.ok(!/innerHTML\s*=/.test(src),'panel modules render strings only: '+l.src);
 const escaped=[];
 const ctx={gxEsc:s=>{escaped.push(String(s));return String(s).replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';');},console};
 vm.createContext(ctx);vm.runInContext(src,ctx,{filename:l.src});
 const validate=l.panel.replace(/Panel$/,'Validate');
 assert.equal(typeof ctx[validate],'function',validate);
 assert.equal(ctx[validate](),true,validate);
 const rec=reg.records.find(r=>r.prefecture_code===l.pref);
 const lu=Object.keys(ctx).find(n=>/^GX_[A-Z_]+LANDUSE$/.test(n));
 assert.ok(lu,'landuse table in '+l.src);
 const sum=ctx[lu].reduce((a,row)=>a+row[1],0);
 assert.equal(sum,rec.polygon_features,'landuse total vs P76 registry for '+rec.prefecture_name);
 total+=sum;
 for(const other of ['01','13','47'].filter(c=>c!==l.pref))assert.equal(ctx[l.panel](other),'','guard '+l.src+' '+other);
 const out=ctx[l.panel](l.pref);
 assert.ok(out.startsWith('<section')&&out.includes(rec.prefecture_name.replace(/[都道府県]$/,'')),'panel '+l.src);
 assert.ok(!/\bundefined\b|\bNaN\b/.test(out)&&!/<script/i.test(out),'panel output '+l.src);
 assert.ok(escaped.length>0,'panel escapes source strings '+l.src);
}
assert.equal(total,reg.summary.polygon_features);
console.log('NAFT_P79_SOIL_PANELS_COMMON_PASS',JSON.stringify({layers:soil.length,polygons:total}));
