'use strict';
// Publicly reported-aggregate arithmetic. Read-only: never writes Claims or official Packs.
(function(){
function init(){
 const root=document.getElementById('japan-calculation-lab');
 if(!root||document.getElementById('ja-field-replay'))return;
 const el=document.createElement('section');el.id='ja-field-replay';el.className='card';
 el.innerHTML='<h3>⑤ 日本の原著研究・公表実測集計値の独立検算（研究用）</h3>'+
 '<p class="notice">原著論文の公表集計値を暫定転記した例です。原表の独立照合・元の時系列・水位・土壌・気象データは未取得。圃場環境の完全再現、温室効果ガスの認証値、削減効果の因果推定ではありません。</p>'+
 '<p><a target="_blank" rel="noopener noreferrer" href="docs/japan-field-replay-protocol-2026-10-18.md">原著論文リンク・差分按分プロトコル・未取得データ</a></p>'+
 '<button type="button" id="ja-field-yagi">Yagi 1991・1993 水管理比較の集計を検算</button>'+
 '<button type="button" id="ja-field-nishimura">Nishimura 2002 作付期・休閑期を検算</button>'+
 '<button type="button" id="ja-field-allocation">合成例で面積×排出強度の差分按分を検証</button>'+
 '<pre id="ja-field-output" role="status" aria-live="polite">データの読み込み待ち</pre>';
 root.appendChild(el);
 const output=el.querySelector('#ja-field-output');
 let data=null;
 // The bundled fixture is checked against the JSON source in CI; no runtime network calls.
 try{
  if(typeof JAPAN_FIELD_PUBLISHED_DATA==='undefined')throw Error('OFFLINE_FIXTURE_MISSING');
  data=JAPAN_FIELD_PUBLISHED_DATA;
  japanFieldReplayYagi(data);japanFieldReplayNishimura(data);
  output.textContent='オフラインの暫定転記フィクスチャを確認しました。原著原表・観測原本は未検証です。';
 }catch(e){data=null;output.textContent='研究フィクスチャ検証停止: '+e.message;}
 function show(fn){
  if(!data){output.textContent='研究用データ未確認のため停止';return;}
  try{output.textContent=JSON.stringify(fn(),null,2)}
  catch(e){output.textContent='検証停止: '+e.message}
 }
 el.querySelector('#ja-field-yagi').addEventListener('click',()=>show(()=>japanFieldReplayYagi(data)));
 el.querySelector('#ja-field-nishimura').addEventListener('click',()=>show(()=>japanFieldReplayNishimura(data)));
 el.querySelector('#ja-field-allocation').addEventListener('click',()=>show(()=>{
  const keys=['site_id','calendar_year','crop_season','measurement_start','measurement_end',
  'soil_class','irrigation','organic_amendment','fertilizer','measurement_protocol','gas','mass_basis',
  'climate_observation_ref','plot_lineage'];
  const context=Object.fromEntries(keys.map(k=>[k,'SYNTHETIC_'+k]));
  const result=japanFieldAllocateAreaRate({data_status:'SYNTHETIC',
   observed:{area_ha:2,rate_kg_ch4_ha:100,context},
   predicted:{area_ha:1,rate_kg_ch4_ha:90,context:{...context}}});
  return {注意:'これは架空の入力に対する算術的按分であり、原著論文の差分を因果分解したものではありません',result};
 }));
}
if(typeof document!=='undefined'){
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
 else init();
}
})();