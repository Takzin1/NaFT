'use strict';
// Read-only synthetic research card; does not alter NaFT Claims or approved Packs.
(function(){
 function init(){
  var root=document.getElementById('japan-calculation-lab');
  if(!root||document.getElementById('ja-asia-mrv-card'))return;
  var section=document.createElement('section');section.className='card';section.id='ja-asia-mrv-card';
  section.innerHTML='<h3>④ 日本とアジアの算定基準・単位比較（研究用）</h3>'+
   '<p>IPCCの公開算定例を独立再計算し、CH₄-C↔CH₄の物理量換算と海外係数の転用拒否を確認します。制度上の認証値ではありません。</p>'+
   '<button type="button" id="ja-asia-ipcc">IPCC公開例を再計算</button>'+
   '<button type="button" id="ja-asia-parity">単位換算・国別係数の境界を検証</button>'+
   '<pre role="status" aria-live="polite" id="ja-asia-result">未実行</pre>'+
   '<small>研究用の合成例。実圃場、J-クレジット認証、GX-ETS制度報告の結果とは異なります。</small>';
  root.appendChild(section);
  var out=section.querySelector('#ja-asia-result');
  section.querySelector('#ja-asia-ipcc').onclick=function(){
   try{
    var v=[['CF',1500000,1.48,102],['MD',1500000,.81,102],['rainfed',900000,.59,102],
     ['upland',450000,0,102],['deepwater',150000,.18,220]].map(function(a){
      return {id:a[0],harvested_area_ha_year:a[1],daily_ef_kg_ch4_ha_day:a[2],
       season_days:a[3],unit:'kg_CH4_ha_day',status:'PUBLISHED_ROUNDED_REFERENCE'};
     });
    out.textContent=JSON.stringify(naftAsiaIpcc2019Example(v),null,2);
   }catch(e){out.textContent='停止: '+e.message}
  };
  section.querySelector('#ja-asia-parity').onclick=function(){
   try{
    var s={assertion_id:'SYNTH-2026',field_id:'SYNTH-FIELD',country:'JP',gas:'CH4',
     quantity_kind:'emission_factor',area_unit:'ha',period_basis:'crop_year',
     period_id:'2026',stratum_id:'SYNTH-SOIL',water_regime:'MIDSEASON',
     methodology_id:'AG-005@3.3-reference',source_uri:'urn:synthetic:naft:parity',
     data_status:'SYNTHETIC'};
    var p=naftAsiaPhysicalCompare(Object.assign({},s,{mass_basis:'kg_CH4_C',value_kg_per_ha:12}),
     Object.assign({},s,{mass_basis:'kg_CH4',value_kg_per_ha:16,methodology_id:'IEEE-RESEARCH'}));
    var block='';
    try{
     naftAsiaRegulatoryFactorGate({country:'PH',methodology_id:'PH_AM004',methodology_version:'1.0',period_id:'2026',status:'RESEARCH_REFERENCE'},
      {country:'JP',methodology_id:'AG-005',methodology_version:'3.3-reference',period_id:'2026'});
    }catch(e){block=e.message}
    out.textContent=JSON.stringify({物理量の検算:p,海外係数の流用検査:block},null,2);
   }catch(e){out.textContent='停止: '+e.message}
  };
 }
 if(typeof document!=='undefined'){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();
 }
})();
