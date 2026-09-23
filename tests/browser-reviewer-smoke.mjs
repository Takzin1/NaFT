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
await until(
  "document.querySelector('[data-action=\\\"reviewer-run\\\"]')!==null && document.body.innerText.includes('未踏アドバンスト審査用デモ')",
  'reviewer route render'
);

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
  'この合成実験では、100件中70件について後継パッケージを生成せずに済みました。',
  '時間・費用・精度が70%改善したという意味ではありません。',
  '再検証30件 / 影響なし70件'
]) {
  if(!text.includes(phrase)) throw new Error('MISSING_REVIEWER_TEXT:'+phrase);
}
console.log('Reviewer Demo browser click: PASS');
console.log(JSON.stringify(Object.fromEntries(metrics)));
ws.close();
