'use strict';
/** P78 real Chrome CDP smoke: lazy prefecture GIS layers, JIS-correct national registry, forest impact panel. */
const base=process.env.NAFT_CDP_URL||'http://127.0.0.1:9222';
const wait=ms=>new Promise(r=>setTimeout(r,ms));
let page;
for(let i=0;i<50;i++){
 try{const pages=await fetch(base+'/json/list').then(r=>r.json());page=pages.find(p=>p.type==='page'&&p.url.includes('naft-app.html'));if(page)break;}catch{}
 await wait(150);
}
if(!page)throw Error('P78_BROWSER_PAGE_NOT_FOUND');
const ws=new WebSocket(page.webSocketDebuggerUrl);
await new Promise((ok,bad)=>{ws.addEventListener('open',ok,{once:true});ws.addEventListener('error',bad,{once:true});});
let seq=1;const pending=new Map(),errors=[];
ws.addEventListener('message',e=>{
 const m=JSON.parse(e.data);
 if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails?.exception?.description||m.params.exceptionDetails?.text||'runtime exception');
 if(m.id&&pending.has(m.id)){const {ok,bad}=pending.get(m.id);pending.delete(m.id);if(m.error)bad(Error(m.error.message));else ok(m.result);}
});
const send=(method,params={})=>new Promise((ok,bad)=>{const id=seq++;pending.set(id,{ok,bad});ws.send(JSON.stringify({id,method,params}));});
const ev=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error('P78_BROWSER_JS:'+r.exceptionDetails.text);return r.result.value;};
const until=async(expression,label)=>{
 for(let i=0;i<90;i++){try{if(await ev('Boolean('+expression+')'))return;}catch{}await wait(180);}
 const debug=await ev("({hash:location.hash,layers:[...document.querySelectorAll('script[data-gx-layer]')].map(s=>s.dataset.gxLayer),body:document.body.innerText.slice(0,400)})").catch(()=>({}));
 throw Error('P78_BROWSER_TIMEOUT:'+label+':'+JSON.stringify(debug)+':runtimeErrors='+JSON.stringify(errors));
};
try{
 await send('Runtime.enable');
 await send('Page.enable');
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 // Fresh document on a non-GX route: no prefecture GIS module may be loaded.
 const url=page.url.split('#')[0].split('?')[0]+'?p78-cold-start=1#/methodologies';
 await send('Page.navigate',{url});
 await until("location.search.includes('p78-cold-start')&&document.readyState==='complete'&&typeof render==='function'&&document.body.innerText.includes('Rule Pack')",'fresh methodologies route');
 const cold=await ev("({lazy:document.querySelectorAll('script[data-gx-layer]').length,eager:[...document.scripts].filter(s=>/gx-[a-z]+-soil\\.js$/.test(s.src)).length,tokyo:typeof gxTokyoSoilPanel,forest:typeof forestImpactDemo,total:document.scripts.length})");
 if(cold.lazy!==0||cold.eager!==0||cold.tokyo!=='undefined'||cold.forest!=='function')throw Error('P78_COLD_START_LOADED_SOIL:'+JSON.stringify(cold));
 // GX route: only the selected prefecture (07) is fetched; forest panel is computed by the compiler.
 await ev("location.hash='#/gx-data';true");
 await until("typeof gxFukushimaSoilPanel==='function'&&document.querySelector('#gx-fukushima-soil-title, [id^=gx-fukushima]')",'Fukushima soil lazy load');
 await until("document.querySelector('#gx-forest-stand')",'forest panel');
 const first=await ev("({layers:[...document.querySelectorAll('script[data-gx-layer]')].map(s=>s.dataset.gxLayer),forest:document.querySelector('#gx-forest-stand').innerText,rows:[...document.querySelectorAll('#gx-forest-stand [data-stand-count]')].reduce((a,el)=>a+Number(el.dataset.standCount),0)})");
 if(JSON.stringify(first.layers)!=='["soil:07"]')throw Error('P78_ONLY_SELECTED_LAYER_EXPECTED:'+JSON.stringify(first.layers));
 const counts=await ev("(()=>{const d=forestImpactDemo();return {total:d.counts.total,re:d.counts.require_reverification,un:d.counts.UNAFFECTED}})()");
 if(counts.total!==first.rows+counts.un||counts.re!==first.rows)throw Error('P78_FOREST_TABLE_PARITY:'+JSON.stringify({counts,rows:first.rows}));
 if(!first.forest.includes('合成')||!first.forest.includes('小班')||first.forest.includes('NaN'))throw Error('P78_FOREST_PANEL_TEXT:'+first.forest.slice(0,300));
 // Niigata (JIS 15): publisher folder k18 must not leak Fukui/Yamanashi data into the selection.
 await ev("(()=>{const s=document.querySelector('#gx-pref-select');s.value='15';s.dispatchEvent(new Event('change',{bubbles:true}));return true})()");
 await until("typeof gxNiigataSoilPanel==='function'&&document.querySelector('#gx-niigata-soil-title')",'Niigata lazy soil panel');
 await until("document.querySelector('#gx-national-soil-registry h3')",'national registry hydrated');
 const nii=await ev("({h3:[...document.querySelectorAll('#gx-national-soil-registry h3')].map(h=>h.textContent).join('|'),layers:[...document.querySelectorAll('script[data-gx-layer]')].map(s=>s.dataset.gxLayer).sort()})");
 if(!nii.h3.includes('新潟県｜県別品質監査')||nii.h3.includes('山梨県｜'))throw Error('P78_NIIGATA_REGISTRY_MISMATCH:'+JSON.stringify(nii));
 if(JSON.stringify(nii.layers)!=='["soil:07","soil:15"]')throw Error('P78_LAYER_SET:'+JSON.stringify(nii.layers));
 const mobile=await ev("({w:innerWidth,s:document.documentElement.scrollWidth})");
 if(mobile.s>mobile.w+1)throw Error('P78_MOBILE_OVERFLOW:'+JSON.stringify(mobile));
 if(errors.length)throw Error('P78_RUNTIME_EXCEPTIONS:'+JSON.stringify(errors));
 console.log('NAFT_P78_BROWSER_PASS: cold start 0 soil modules, lazy 07→15, Niigata JIS registry, forest panel parity, 390px no overflow',JSON.stringify({scripts:cold.total,forest:counts}));
}finally{ws.close();}
