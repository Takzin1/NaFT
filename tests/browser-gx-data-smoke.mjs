'use strict';
/** Real Chrome CDP smoke for the new GX source atlas, no external networks. */
const base=process.env.NAFT_CDP_URL||'http://127.0.0.1:9222';
const wait=ms=>new Promise(r=>setTimeout(r,ms));
let page;
for(let i=0;i<50;i++){
 try{
  const pages=await fetch(base+'/json/list').then(r=>r.json());
  page=pages.find(p=>p.type==='page'&&p.url.includes('naft-app.html'));
  if(page)break;
 }catch{}
 await wait(150);
}
if(!page)throw Error('GX_BROWSER_PAGE_NOT_FOUND');
const ws=new WebSocket(page.webSocketDebuggerUrl);
await new Promise((ok,bad)=>{ws.addEventListener('open',ok,{once:true});ws.addEventListener('error',bad,{once:true});});
let seq=1;const pending=new Map(),errors=[];
ws.addEventListener('message',e=>{
 const m=JSON.parse(e.data);
 if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails?.text||'runtime exception');
 if(m.id&&pending.has(m.id)){
  const {ok,bad}=pending.get(m.id);pending.delete(m.id);
  if(m.error)bad(Error(m.error.message));else ok(m.result);
 }
});
const send=(method,params={})=>new Promise((ok,bad)=>{
 const id=seq++;pending.set(id,{ok,bad});ws.send(JSON.stringify({id,method,params}));
});
const ev=async expression=>{
 const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
 if(r.exceptionDetails)throw Error('GX_BROWSER_JS:'+r.exceptionDetails.text);
 return r.result.value;
};
const until=async(expression,label)=>{
 for(let i=0;i<40;i++){if(await ev(expression))return;await wait(180);}
 throw Error('GX_BROWSER_TIMEOUT:'+label);
};
try{
 await send('Runtime.enable');
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await ev("location.hash='#/gx-data';true");
 await until("document.querySelector('#gx-pref-select')?.options.length===107",'47 prefectures route');
 await until("document.querySelector('#gx-ch4-year-select')?.options.length===15",'15 CH4 atlas years');
 const initialMap=await ev("({s:document.querySelector('#gx-ch4-year-select').value,tiles:document.querySelectorAll('.gx-ch4-map rect').length,title:document.querySelector('#gx-ch4-title')?.textContent})");
 if(initialMap.s!=='2015'||initialMap.tiles<200||!initialMap.title.includes('メタン'))throw Error('GX_P19_CH4_INITIAL_MAP:'+JSON.stringify(initialMap));
 await ev("(()=>{const s=document.querySelector('#gx-ch4-year-select');s.value='2001';s.dispatchEvent(new Event('change',{bubbles:true}));return true})()");
 await until("document.querySelector('#gx-ch4-year-select')?.value==='2001' && document.querySelector('.gx-ch4-figure')?.innerHTML.includes('2001')",'P19 year switch');
 const afterMap=await ev("({s:document.querySelector('#gx-ch4-year-select').value,tiles:document.querySelectorAll('.gx-ch4-map rect').length,body:document.querySelector('#gx-ch4-title')?.closest('section')?.innerText})");
 if(afterMap.s!=='2001'||afterMap.tiles!==200||!afterMap.body.includes('29,192'))throw Error('GX_P19_CH4_2001_MAP:'+JSON.stringify(afterMap));

 await until("document.querySelector('#gx-jaxa-tile-select')?.options.length===4",'JAXA batches 1-3 10 tiles');
 const j0=await ev("({s:document.querySelector('#gx-jaxa-tile-select')?.value,text:document.querySelector('#gx-jaxa-title')?.closest('section')?.innerText})");
 if(j0.s!=='LC_N30E131'||!j0.text.includes('32,028'))throw Error('P21_JAXA_DEFAULT:'+JSON.stringify(j0));
 await ev("(()=>{const s=document.querySelector('#gx-jaxa-tile-select');s.value='LC_N24E131';s.dispatchEvent(new Event('change',{bubbles:true}));return true})()");
 await until("document.querySelector('#gx-jaxa-tile-select')?.value==='LC_N24E131'",'JAXA change');
 const j1=await ev("({s:document.querySelector('#gx-jaxa-tile-select')?.value,text:document.querySelector('#gx-jaxa-title')?.closest('section')?.innerText})");
 if(j1.s!=='LC_N24E131'||!j1.text.includes('143,981,729'))throw Error('P21_JAXA_SWITCH:'+JSON.stringify(j1));
 await ev("(()=>{const s=document.querySelector('#gx-jaxa-tile-select');s.value='LC_N30E129';s.dispatchEvent(new Event('change',{bubbles:true}));return true})()");
 await until("document.querySelector('#gx-jaxa-tile-select')?.value==='LC_N30E129'",'JAXA batch2 new tile switch');
 const j2=await ev("({id:document.querySelector('#gx-jaxa-tile-select')?.value,text:document.querySelector('#gx-jaxa-title')?.closest('section')?.innerText})");
 if(j2.id!=='LC_N30E129'||!j2.text.includes('143,766,652'))throw Error('P22_JAXA_BATCH02_CHANGE:'+JSON.stringify(j2));

 await ev("(()=>{const s=document.querySelector('#gx-jaxa-tile-select');s.value='LC_N35E140';s.dispatchEvent(new Event('change',{bubbles:true}));return true})()");
 await until("document.querySelector('#gx-jaxa-tile-select')?.value==='LC_N35E140'",'JAXA batch3 35N140E');
 const j3=await ev("({s:document.querySelector('#gx-jaxa-tile-select')?.value,text:document.querySelector('#gx-jaxa-title')?.closest('section')?.innerText,options:document.querySelector('#gx-jaxa-tile-select')?.options.length})");
 if(j3.s!=='LC_N35E140'||!j3.text.includes('12,721,336')||j3.options!==10)throw Error('P23_JAXA_35N140E:'+JSON.stringify(j3));
 await ev("(()=>{const s=document.querySelector('#gx-jaxa-tile-select');s.value='LC_N38E139';s.dispatchEvent(new Event('change',{bubbles:true}));return true})()");
 await until("document.querySelector('#gx-jaxa-tile-select')?.value==='LC_N38E139'",'JAXA batch3 38N139E');
 const j4=await ev("({s:document.querySelector('#gx-jaxa-tile-select')?.value,text:document.querySelector('#gx-jaxa-title')?.closest('section')?.innerText})");
 if(j4.s!=='LC_N38E139'||!j4.text.includes('6,828,139'))throw Error('P23_JAXA_38N139E:'+JSON.stringify(j4));
 const mobile=await ev("({page:document.body.dataset.page,width:innerWidth,scroll:document.documentElement.scrollWidth,title:document.querySelector('.gx-hero h2')?.textContent, cards:document.querySelectorAll('.gx-period-card').length,style:getComputedStyle(document.querySelector('.gx-hero')).backgroundImage,source:document.querySelector('.gx-source-panel').textContent,options:document.querySelector('#gx-pref-select').options.length})");
 if(mobile.page!=='gx-data'||mobile.cards!==3||mobile.options!==47)throw Error('GX_MOBILE_DATA_RENDER:'+JSON.stringify(mobile));
 if(mobile.scroll>mobile.width+1)throw Error('GX_MOBILE_HORIZONTAL_OVERFLOW:'+JSON.stringify(mobile));
 if(!mobile.title.includes('土地の記録')||!mobile.source.includes('南会津'))throw Error('GX_FIRST_VIEW_OR_SOURCE_MISSING');
 if(!mobile.style.includes('gradient'))throw Error('GX_DESIGN_CSS_NOT_APPLIED');
 await ev("(()=>{const s=document.querySelector('#gx-pref-select');s.value='13';s.dispatchEvent(new Event('change',{bubbles:true}));return true})()");
 await until("document.querySelector('.gx-data-card strong')?.textContent.includes('107')",'Tokyo switch');
 const tokyo=await ev("({selected:document.querySelector('#gx-pref-select').value,text:document.querySelector('.gx-source-panel').textContent,one:document.querySelector('.gx-data-card strong').textContent})");
 if(tokyo.selected!=='13'||!tokyo.text.includes('まだ台帳未登録')||!tokyo.one.includes('107'))throw Error('GX_PREFECTURE_SWITCH_FAILED:'+JSON.stringify(tokyo));
 await send('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});
 const desktop=await ev("({width:innerWidth,scroll:document.documentElement.scrollWidth,cards:document.querySelectorAll('.gx-period-card').length,columns:getComputedStyle(document.querySelector('.gx-period-grid')).gridTemplateColumns.split(' ').length})");
 if(desktop.scroll>desktop.width+1||desktop.cards!==3||desktop.columns<3)throw Error('GX_DESKTOP_GRID_FAILED:'+JSON.stringify(desktop));
 await ev("location.hash='#/methodologies';true");
 await until("document.body.innerText.includes('Rule Packを版で固定する')",'original MRV route');
 if(errors.length)throw Error('GX_RUNTIME_EXCEPTIONS:'+JSON.stringify(errors));
 console.log('NAFT_P10_GX_BROWSER_PASS: Chrome 390px + 1280px, 47-pref selector, Tokyo switch, original six-route, no overflow');
}finally{ws.close();}
