'use strict';
// Standalone, Japanese research lab. Never mutates official Compiler packs or saved Claims.
(function(){
 function init(){
  var root=document.getElementById('japan-calculation-lab');
  if(!root)return;
  root.innerHTML=
  '<div class="card"><p class="eyebrow">NaFT Japan Research Lab · 研究用 / 制度認証ではありません</p>'+
  '<h2>J-クレジット・GX-ETS算定式と再検証コスト</h2>'+
  '<p class="notice">入力値はすべて架空の演習値です。AG-005 Ver.3.3の参考式を使用します。現行適用版Ver.3.5の原典・係数、GX-ETS正式係数は未確認のため、削減量の認証・制度報告・実際の費用削減を主張しません。</p>'+
  '<p><a href="docs/ja-ag005-gxets-cost-sync.md" target="_blank" rel="noopener noreferrer">計算仕様と一次資料・制約を見る</a></p></div>'+
  '<div class="grid"><section class="card"><h3>① AG-005 水田メタンの参照計算</h3>'+
  '<p><small>面積×(延長前EF−延長後EF)×16/12×GWP×0.001。合成係数から研究用プレビューのみ表示。</small></p>'+
  '<label>対象面積（ha） <input id="ja-area" type="number" min="0.001" step="any" value="2"></label>'+
  '<label>無施用EF（kg-CH4-C/ha/年、架空） <input id="ja-e0" type="number" min="0" step="any" value="100"></label>'+
  '<label>稲わらEF（同、架空） <input id="ja-es" type="number" min="0" step="any" value="200"></label>'+
  '<label>堆肥EF（同、架空） <input id="ja-ec" type="number" min="0" step="any" value="150"></label>'+
  '<label>稲わらすき込み割合（%） <input id="ja-straw" type="number" min="0" max="100" step="any" value="45"></label>'+
  '<label>堆肥施用量（t/10a） <input id="ja-compost" type="number" min="0" step="any" value="0"></label>'+
  '<label>GWP（架空の演習値） <input id="ja-gwp" type="number" min="0" step="any" value="30"></label>'+
  '<button id="ja-run-ag" type="button">研究用削減量を試算</button>'+
  '<pre id="ja-ag-result" role="status" aria-live="polite">未計算</pre></section>'+
  '<section class="card"><h3>② GX-ETS 燃料起源CO₂の参照計算</h3>'+
  '<p><small>燃料使用量×単位発熱量×炭素排出係数×44/12。購入電力・工業プロセスの排出量は対象外。</small></p>'+
  '<label>燃料使用量（kL、架空） <input id="ja-fuel" type="number" min="0" step="any" value="10"></label>'+
  '<label>単位発熱量（GJ/kL、架空） <input id="ja-heat" type="number" min="0" step="any" value="35"></label>'+
  '<label>炭素排出係数（tC/GJ、架空） <input id="ja-cf" type="number" min="0" step="any" value="0.02"></label>'+
  '<button id="ja-run-gx" type="button">燃料起源CO₂を試算</button>'+
  '<pre id="ja-gx-result" role="status" aria-live="polite">未計算</pre></section></div>'+
  '<section class="card"><h3>③ 再検証コストの仮定試算（IEEE版と共通ロジック）</h3>'+
  '<p>100件の合成Claimに方法論変更を適用し、実際のNaFT影響解析から再検証対象件数を取得します。<strong>架空条件での比較であり、実測された費用削減率ではありません。</strong></p>'+
  '<div class="grid"><label>1件あたり人手レビュー（時間、仮定） <input id="ja-hours" type="number" min="0" step="any" value="2"></label>'+
  '<label>時間単価（円、仮定） <input id="ja-rate" type="number" min="0" step="any" value="3000"></label>'+
  '<label>1回の固定費（円、仮定） <input id="ja-overhead" type="number" min="0" step="any" value="0"></label>'+
  '<label>円/ドル（仮定） <input id="ja-fx" type="number" min="0.001" step="any" value="150"></label></div>'+
  '<button id="ja-run-cost" type="button">実際の影響解析と費用仮定を同期</button>'+
  '<pre id="ja-cost-result" role="status" aria-live="polite">未計算</pre></section>';
  function get(id){
    var raw=document.getElementById(id).value;
    if(raw.trim()==='')throw Error('入力値が空です: '+id);
    var n=Number(raw);
    if(!Number.isFinite(n))throw Error('数値を確認してください: '+id);
    return n;
  }
  function run(button,out,fn){
    document.getElementById(button).addEventListener('click',function(){
      var el=document.getElementById(out);
      try {el.textContent=JSON.stringify(fn(),null,2);}
      catch(e) {el.textContent='計算を停止: '+e.message;}
    });
  }
  run('ja-run-ag','ja-ag-result',function(){
    var a=japanRefAG005({method_version:'3.3-reference',data_kind:'SYNTHETIC',
      area_ha:get('ja-area'),gwp_ch4:get('ja-gwp'),ef_none:get('ja-e0'),
      ef_straw:get('ja-es'),ef_compost:get('ja-ec'),
      straw_percent:get('ja-straw'),compost_t_per_10a:get('ja-compost')});
    return {説明:'AG-005 Ver.3.3参照、架空入力。J-クレジット認証不可',
      単位:a.units,参考削減量_tCO2e:a.preview_tco2e,
      認証済み削減量:a.certified_tco2e,制度適格性:a.jcredit_eligibility,
      根拠状態:a.status,係数が公式確認済み:a.official_coefficient_verified};
  });
  run('ja-run-gx','ja-gx-result',function(){
    var a=japanRefGXETSFuel({source_type:'FUEL_COMBUSTION',fuel_unit:'kL',
      heat_unit:'GJ/kL',carbon_factor_unit:'tC/GJ',
      fuel_quantity:get('ja-fuel'),heat_value:get('ja-heat'),carbon_factor:get('ja-cf')});
    return {説明:'燃料起源CO2のみ。架空入力、制度上の報告値ではありません',
      参考燃料起源_tCO2:a.preview_tco2,報告値_tCO2:a.reported_direct_tco2,
      排出枠:a.allowances,根拠状態:a.status};
  });
  run('ja-run-cost','ja-cost-result',function(){
    if(typeof syntheticClaim!=='function'||typeof analyzeImpact!=='function')
      throw Error('SYNTHETIC_ANALYZER_UNAVAILABLE');
    var claims=[];
    for(var i=1;i<=100;i++){
      var kind=i<=70?'standard':i<=85?'intensive':'intensive_complete';
      claims.push(syntheticClaim('JA-COST-'+String(i).padStart(3,'0'),kind));
    }
    var impact=analyzeImpact(claims,{type:'methodology',
      old_key:'NAFT-SYNTHETIC@1',new_key:'NAFT-SYNTHETIC@2'});
    var c=impact.counts;
    var estimate=estimateReverificationCost({
      total_plots:c.total,flagged_plots:c.require_reverification,
      hours_per_plot:get('ja-hours'),hourly_rate_jpy:get('ja-rate'),
      fixed_overhead_jpy:get('ja-overhead'),jpy_per_usd:get('ja-fx'),
      reasons:{AUTO_REEVALUATED:c.AUTO_REEVALUATED,EVIDENCE_REQUIRED:c.EVIDENCE_REQUIRED,
        HUMAN_REVIEW_REQUIRED:c.HUMAN_REVIEW_REQUIRED,UNSUPPORTED:c.UNSUPPORTED}});
    return {説明:'NaFT合成Claim解析の件数×仮定の人件費。実測コストではない',
      解析件数:c.total,要再検証件数:c.require_reverification,全件仮定費用_円:estimate.full.cost_jpy,
      選択的仮定費用_円:estimate.selective.cost_jpy,
      仮定上の差額_円:estimate.difference.cost_jpy,
      仮定上の削減時間_時間:estimate.difference.hours,
      必要な注意:estimate.disclaimer,仮定:estimate.assumptions};
  });
 }
 if(typeof document!=='undefined'){
   if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
   else init();
 }
})();
