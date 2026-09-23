'use strict';

const cdpBase=process.env.NAFT_CDP_URL||'http://127.0.0.1:9222';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

async function targetPage() {
  for(let i=0;i<40;i++) {
    try {
      const pages=await fetch(cdpBase+'/json/list').then(r=>r.json());
      const page=pages.find(p=>p.type==='page'&&p.url.includes('naft-app.html'));
      if(page) return page;
    } catch(e) {}
    await sleep(250);
  }
  throw new Error('CDP_PAGE_NOT_FOUND');
}

const page=await targetPage();
const ws=new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve,reject)=>{
  ws.addEventListener('open',resolve,{once:true});
  ws.addEventListener('error',reject,{once:true});
});

let nextId=1;
const pending=new Map();
ws.addEventListener('message',event=>{
  const msg=JSON.parse(event.data);
  if(msg.id&&pending.has(msg.id)) {
    const pair=pending.get(msg.id);pending.delete(msg.id);
    if(msg.error) pair.reject(new Error(msg.error.message||'CDP_ERROR'));
    else pair.resolve(msg.result);
  }
});
function send(method,params={}) {
  return new Promise((resolve,reject)=>{
    const id=nextId++;pending.set(id,{resolve,reject});
    ws.send(JSON.stringify({id,method,params}));
  });
}
async function evaluate(expression) {
  const result=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
  if(result.exceptionDetails) throw new Error('BROWSER_EVAL_FAILED');
  return result.result&&result.result.value;
}
async function until(expression,label) {
  for(let i=0;i<40;i++) {
    if(await evaluate(expression)) return;
    await sleep(250);
  }
  throw new Error('BROWSER_TIMEOUT:'+label);
}

await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride',{width:375,height:812,deviceScaleFactor:1,mobile:true});
await until(
  "document.querySelector('[data-action=\\\"reviewer-run\\\"]')!==null && document.body.innerText.includes('未踏アドバンスト審査用デモ')",
  'reviewer route render'
);
const firstView=await evaluate("({headingTop:document.querySelector('.reviewer-hero h2').getBoundingClientRect().top,scrollWidth:document.documentElement.scrollWidth,innerWidth:window.innerWidth,hasOperationalControls:!!document.querySelector('#actor,#activity,nav'),hasAg005Banner:document.body.innerText.includes('AG-005参照版')})");
if(firstView.headingTop>=812) throw new Error('REVIEWER_HEADING_BELOW_FIRST_VIEW:'+JSON.stringify(firstView));
if(firstView.scrollWidth>firstView.innerWidth) throw new Error('REVIEWER_HORIZONTAL_OVERFLOW:'+JSON.stringify(firstView));
if(firstView.hasOperationalControls||firstView.hasAg005Banner) throw new Error('REVIEWER_HEADER_NOT_ISOLATED:'+JSON.stringify(firstView));

await evaluate("document.querySelector('[data-action=\\\"reviewer-run\\\"]').click(); true");
await until("document.querySelectorAll('.metric').length===5",'metric render');

const metrics=await evaluate("Array.from(document.querySelectorAll('.metric')).map(function(x){return [x.querySelector('span').textContent.trim(),x.querySelector('strong').textContent.trim()];})");
const expected=[
  ['変更候補','100'],
  ['再検証対象','30'],
  ['影響なし','70'],
  ['自動再評価','15'],
  ['追加証憑が必要','15']
];
if(JSON.stringify(metrics)!==JSON.stringify(expected)) {
  throw new Error('UNEXPECTED_METRICS:'+JSON.stringify(metrics));
}
const text=await evaluate("document.body.innerText");
for(const phrase of [
  'この画面は合成方法論 NAFT-SYNTHETIC@1 → @2 の研究デモです。AG-005の制度評価ではありません。',
  'v2ではstratum=intensiveのClaimに対して、追加ルール extended（intensive_min_days=9）とsensor証憑要件が加わります。',
  'standard 70件 / intensive（sensorなし） 15件 / intensive_complete（sensorあり） 15件。',
  '30 / 70 は性能指標ではありません。',
  'fixture構成を変えれば30 / 70も変わります。',
  '実制度の再検証率を予測するものではありません。',
  'この70件は、fixture内のstandard 70件がv2のintensive専用変更に依存しないため非影響となった合成結果です。',
  '時間・費用・精度が70%改善したという意味ではなく、実制度の再検証率を予測するものでもありません。',
  '再検証30件 / 影響なし70件'
]) {
  if(!text.includes(phrase)) throw new Error('MISSING_REVIEWER_TEXT:'+phrase);
}
await evaluate("location.hash='#/methodologies'; true");
await until("document.body.innerText.includes('Rule Packを版で固定する')",'methodologies route render');
const methodologyViewport=await evaluate("({scrollWidth:document.documentElement.scrollWidth,innerWidth:window.innerWidth})");
if(methodologyViewport.scrollWidth>methodologyViewport.innerWidth) throw new Error('METHODOLOGY_HORIZONTAL_OVERFLOW:'+JSON.stringify(methodologyViewport));
console.log('Reviewer Demo browser click/mobile: PASS');
console.log(JSON.stringify(Object.fromEntries(metrics)));
ws.close();
