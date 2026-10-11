'use strict';
/* 本番と同じCDP/Chromeで日本語表示と100件の実計算を動作確認する。 */
import assert from 'node:assert/strict';
const base=process.env.NAFT_CDP_URL||'http://127.0.0.1:9222';
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let page;
for(let i=0;i<30;i++){
  const pages=await fetch(base+'/json/list').then(r=>r.json());
  page=pages.find(p=>p.type==='page'&&(p.url.includes('naft-app.html')||p.url.includes('gikuten.html')));
  if(page)break;
  await sleep(200);
}
assert.ok(page,'CDPで画面を発見できません');
const ws=new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
let next=1;
const waiting=new Map(),errors=[];
ws.addEventListener('message',event=>{
  const msg=JSON.parse(event.data);
  if(msg.method==='Runtime.exceptionThrown')errors.push('exception: '+(msg.params?.exceptionDetails?.text||'unknown'));
  if(msg.method==='Log.entryAdded'&&msg.params?.entry?.level==='error')errors.push('console: '+msg.params.entry.text);
  if(msg.id&&waiting.has(msg.id)){
    const {resolve,reject}=waiting.get(msg.id);waiting.delete(msg.id);
    if(msg.error)reject(Error(msg.error.message));else resolve(msg.result);
  }
});
function send(method,params={}){
  return new Promise((resolve,reject)=>{const id=next++;waiting.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
}
async function evaluate(expression){
  const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
  if(r.exceptionDetails)throw Error('実ブラウザでの評価に失敗: '+expression);
  return r.result?.value;
}
async function until(expression,label){
  for(let i=0;i<50;i++){if(await evaluate(expression))return;await sleep(200);}
  throw Error('日本語版の表示が完了しません: '+label);
}
await send('Page.enable');
await send('Runtime.enable');
await send('Log.enable');
await send('Emulation.setDeviceMetricsOverride',{width:375,height:812,deviceScaleFactor:1,mobile:true});
await send('Page.navigate',{url:'http://127.0.0.1:4173/gikuten.html#/reviewer-demo'});
await until("document.querySelector('[data-action=\\\"reviewer-run\\\"]')!==null&&document.body.innerText.includes('技育展・日本語デモ')",'日本語版審査画面');
const first=await evaluate("({lang:document.documentElement.lang,title:document.title,heading:document.querySelector('.reviewer-header h1')?.textContent,button:document.querySelector('[data-action=\\\"reviewer-run\\\"]')?.textContent,width:document.documentElement.scrollWidth,viewport:innerWidth})");
assert.equal(first.lang,'ja');
assert.match(first.title,/技育展/);
assert.match(first.heading,/審査員向けデモ/);
assert.match(first.button,/100件/);
assert.ok(first.width<=first.viewport,'日本語画面が横方向にあふれています');
await evaluate("document.querySelector('[data-action=\\\"reviewer-run\\\"]').click();true");
await until("document.querySelectorAll('.metric').length===5",'変更影響の指標');
const values=await evaluate("Array.from(document.querySelectorAll('.metric strong')).map(n=>n.textContent.trim())");
assert.deepEqual(values,['100','30','70','15','15']);
await evaluate("location.hash='#/methodologies';true");
await until("document.querySelector('nav a')?.textContent.includes('方法論')",'日本語の6画面');
const app=await evaluate("({links:document.querySelectorAll('nav a').length,hasTranslation:document.body.innerText.includes('実演A｜証憑から下書きを自動生成'),hasResearchBoundary:document.body.innerText.includes('正式認証にはなりません')})");
assert.equal(app.links,6);
assert.equal(app.hasTranslation,true);
assert.equal(app.hasResearchBoundary,true);
assert.deepEqual(errors,[],'コンソールまたは実行時エラー');
ws.close();
console.log('技育展日本語版: 実ブラウザ・100件実計算・6画面・モバイル表示 OK');
