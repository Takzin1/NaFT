/* P15 verified original-source sampling-cadence facts, aggregated only.
 * No field-level data, locations, observation values or carbon credit claims.
 */
'use strict';
var GX_GIMJE_SAMPLING_P15={
 source:'10.5281/zenodo.17111992', fields:60, grid:8391,observed:1422,
 unmeasured:6969,negative:31,longGaps:27,maxGap:16,weatherMissing:0,
 annual:[
  {year:2022,fields:18,measured:576,grid:2502,samples:[['32',18]],longGaps:0},
  {year:2023,fields:15,measured:330,grid:2055,samples:[['22',15]],longGaps:0},
  {year:2024,fields:27,measured:516,grid:3834,samples:[['18',12],['20',15]],longGaps:27}
 ],
 stage:[['flooding',990,5895],['drainage',342,2019],['awd',90,477]],
 gapDays:[[1,18],[2,81],[3,228],[4,207],[5,210],[6,192],[7,207],[8,42],[9,123],[12,27],[16,27]]
};
function gxGimjeSamplingQCPanel(){
 var a=GX_GIMJE_SAMPLING_P15,sep=function(n){return n.toLocaleString('ja-JP');};
 var ann=a.annual.map(function(y){
   var freq=y.samples.map(function(e){return e[0]+'測定日×'+e[1]+'圃場';}).join(' / ');
   return '<article class="gx-data-card"><span class="gx-kicker">SAMPLING CADENCE / '+y.year+'</span>'+
   '<strong>'+sep(y.measured)+' <small>記録あり</small></strong>'+
   '<p>'+y.fields+'圃場・'+sep(y.grid)+'日別行・'+freq+'</p>'+
   '<p>測定日間隔14日以上：'+y.longGaps+'区間</p></article>';
 }).join('');
 var stages=a.stage.map(function(r){
   var ratio=100*r[1]/r[2];
   return '<tr><th scope="row">'+r[0]+'</th><td>'+sep(r[1])+
     '</td><td>'+sep(r[2])+'</td><td>'+ratio.toFixed(1)+'%</td></tr>';
 }).join('');
 var gaps=a.gapDays.map(function(r){
  return '<tr><th scope="row">'+r[0]+'日</th><td>'+r[1]+'区間</td></tr>';
 }).join('');
 return '<section class="gx-dashboard" aria-labelledby="gx-gimje-sampling-title">'+
 '<div class="gx-section-heading"><span class="gx-kicker">06 / MEASUREMENT CADENCE · P15</span>'+
 '<h2 id="gx-gimje-sampling-title">非測定日と測定上の欠損を混同しない</h2>'+
 '<p>原本には毎日の水管理・気象データがあり、CH₄フラックスの記録日は間欠的です。'+
 '6,969行は<strong>CH₄値なしの日別グリッド</strong>で、測定器の故障や欠測事故と断定できません。</p></div>'+
 '<div class="gx-detail-grid">'+ann+'</div>'+
 '<div class="gx-detail-grid"><article class="gx-data-card">'+
 '<span class="gx-kicker">ORIGINAL DAILY GRID</span><strong>'+sep(a.grid)+'</strong>'+
 '<p>観測日'+sep(a.observed)+'件・CH₄非測定日'+sep(a.unmeasured)+'行。非測定日は0に補完しません。</p></article>'+
 '<article class="gx-data-card"><span class="gx-kicker">SAMPLING-INTERVAL REVIEW</span>'+
 '<strong>'+a.maxGap+' <small>日 / 最大観測間隔</small></strong>'+
 '<p>14日以上の観測間隔'+a.longGaps+'区間（2024年）。異常と即断せず、実験計画との照合が必要です。</p></article>'+
 '<article class="gx-data-card"><span class="gx-kicker">SOURCE REPORTED CH₄</span>'+
 '<strong>'+a.negative+' <small>負値あり</small></strong>'+
 '<p>0への置換・削除は実施せず、機器校正・ガスフラックス算出手順の検証待ち。</p></article></div>'+
 '<details><summary>水管理フェーズ別の記録密度・観測間隔を表示</summary>'+
 '<p>下記は原CSVの日別 <code>course_type</code> であり、Excelの圃場処理群とは別の軸です。</p>'+
 '<div class="scroll"><table><thead><tr><th>日別フェーズ</th><th>CH₄値あり</th><th>日別全行</th><th>記録割合</th></tr></thead><tbody>'+stages+
 '</tbody></table></div><div class="scroll"><table><thead><tr><th>連続するCH₄記録日の間隔</th><th>区間数</th></tr></thead>'+
 '<tbody>'+gaps+'</tbody></table></div></details>'+
 '<p class="gx-advisory"><b>研究用QCのみ：</b>元ファイルのバイト同一性は検証済み。'+
 ' CH₄観測の全1,422行に対する出版社・機器の独立QCフラグは存在せず、公式認証もありません。'+
 ' 日付間の線形補間、季節積分、群間の因果効果、tCO₂e認証値は算出していません。'+
 ' <a href="https://github.com/Takzin1/NaFT/blob/main/docs/p15-gimje-sampling-cadence-qc-ja-2026-11-03.md" target="_blank" rel="noopener noreferrer">再現手順・研究制限</a></p></section>';
}
