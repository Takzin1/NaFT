'use strict';
/* Visible Japanese evidence-backed calculation lab: published aggregate vs raw data boundary. */
(function(){
 function mount(){
  const root=document.getElementById('japan-calculation-lab');
  if(!root||document.getElementById('japan-original-observation-lab'))return;
  const section=document.createElement('section');
  section.id='japan-original-observation-lab';section.className='card';
  section.innerHTML=
    '<p class="eyebrow">NaFT Research / peer-reviewed Japan observations</p>'+
    '<h3>⑤ 原著論文の実測集計値を独立再計算する</h3>'+
    '<p>Yagi et al. 1996：1991年・1993年の常時湛水／間断排水を<strong>同一年内だけ</strong>比較。'+
    'Nishimura et al. 2004：2002年の作付期・休閑期・通年値を検算。'+
    '出典本文で公表された値の再計算であり、当時の気温・降水量・土壌・日次フラックスを再現したわけではありません。</p>'+
    '<button id="jp-replay-original-studies" type="button">原著実測値を再計算</button>'+
    '<button id="jp-replay-accounting" type="button">合成例：面積と排出強度の算術按分</button>'+
    '<pre id="jp-original-studies-result" role="status" aria-live="polite">未実行</pre>'+
    '<small>実験区差は因果要因ごとの按分ではありません。原本測定ログ未取得のため環境差・モデル差の割合は自動配賦しません。'+
    ' <a href="docs/japan-original-field-replay-protocol-2026-10-18.md" target="_blank" rel="noopener noreferrer">実測条件・按分プロトコル・出典</a></small>';
  root.appendChild(section);
  const output=section.querySelector('#jp-original-studies-result');
  section.querySelector('#jp-replay-accounting').addEventListener('click',function(){
    try{
      const keys=['site_id','calendar_year','crop_cycle','treatment_regime','measurement_start','measurement_end','soil_class','irrigation_schedule','organic_management','fertilizer_schedule','flux_measurement_method','climate_record_id','gas','mass_basis','plot_lineage'];
      const cx=Object.fromEntries(keys.map(k=>[k,'SYNTH_'+k]));
      cx.gas='CH4';cx.mass_basis='kg_CH4_per_ha_period';
      const x=naftJpSyntheticAttribution({data_status:'SYNTHETIC',
       observed:{area_ha:'2',rate_kg_ch4_ha:'100',context:cx},
       predicted:{area_ha:'1',rate_kg_ch4_ha:'90',context:{...cx}}});
      output.textContent=JSON.stringify({注意:'架空データの面積・強度の数学的分解であり、実測論文の因果推定ではありません',計算:x},null,2);
    }catch(e){output.textContent='按分検証を停止: '+e.message;}
  });
  section.querySelector('#jp-replay-original-studies').addEventListener('click',function(){
    output.textContent='原著の公表集計値を照合中…';
    try{
      const f=globalThis.NAFT_JP_STUDY_FIXTURE;
      if(!f)throw Error('OBSERVATION_STATIC_FIXTURE_NOT_AVAILABLE');
      const y=naftJpYagiReplay(f),n=naftJpNishimuraReplay(f);
      output.textContent=JSON.stringify({
        注意:'論文掲載の実測集計値だけを再計算。原本測定ログ・気象条件の再現・J-クレジット認証は行わない。',
        同一年内の水管理比較:y.results,
        作付期と休閑期の集計検算:n.results,
        因果的な環境按分:'利用可能な実測時系列がないため、未帰属とする',
        公式認証値:null
      },null,2);
    }catch(e){output.textContent='検証を中止: '+e.message}
  });
 }
 if(typeof document!=='undefined'){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);
  else mount();
 }
})();
