/* P78 · Forest stand (小班) change-impact panel on #/gx-data. SYNTHETIC stands and rules only.
 * The computation is the same Evidence Compiler analyzeImpact() used by the Node tests; nothing here is
 * a presentation constant. Real 森林簿/森林計画図 stay on the operator's machine (scripts/forest-stand-cli.mjs).
 */
'use strict';
var GX_FOREST_CACHE=null;
function gxForestDemo(){
 if(GX_FOREST_CACHE)return GX_FOREST_CACHE;
 if(typeof forestImpactDemo!=='function')throw Error('P78_FOREST_COMPILER_NOT_LOADED');
 GX_FOREST_CACHE=forestImpactDemo();
 return GX_FOREST_CACHE;
}
function gxForestStandPanel(prefCode){
 var d;
 try{d=gxForestDemo();}catch(err){
  return '<section class="gx-dashboard"><p class="gx-anomaly" role="alert">森林の変更影響デモを停止しました（'+gxEsc(err.message)+'）。</p></section>';
 }
 var fmt=function(n){return Number(n).toLocaleString('ja-JP');};
 var label={IKUSEI:'育成林',TENNEN:'天然生林',BAMBOO:'竹林',TREELESS:'無立木地',UNKNOWN:'不明'};
 var age={MATURE:'主伐期到達',IMMATURE:'主伐期前',NOT_APPLICABLE:'対象外',UNKNOWN:'不明'};
 var status={EVIDENCE_REQUIRED:'証拠の追加が必要',UNSUPPORTED:'自動判定を停止（是正が必要）',AUTO_REEVALUATED:'自動で再評価済み',HUMAN_REVIEW_REQUIRED:'人の判断が必要',UNAFFECTED:'影響なし'};
 var affected=d.rows.filter(function(r){return r.requires_reverification;});
 var groups={};
 affected.forEach(function(r){var k=r.status;groups[k]=(groups[k]||0)+1;});
 var cards='<article class="gx-data-card"><span class="gx-kicker">合成の小班</span><strong>'+fmt(d.counts.total)+' <small>小班</small></strong><p>育成林・天然生林・竹林・不明を含む</p></article>'+
  '<article class="gx-data-card"><span class="gx-kicker">再検証が必要</span><strong>'+fmt(d.counts.require_reverification)+' <small>小班</small></strong><p>変更されたルールを実際に使う小班だけ</p></article>'+
  '<article class="gx-data-card"><span class="gx-kicker">影響なし</span><strong>'+fmt(d.counts.UNAFFECTED)+' <small>小班</small></strong><p>以前の評価をそのまま保持</p></article>'+
  '<article class="gx-data-card"><span class="gx-kicker">正式な吸収量</span><strong>— <small>t-CO₂</small></strong><p>FO-001の係数・原文は未固定。算定しない</p></article>';
 // Group by (reason, result) so the reason stays readable on a 390px screen; stand IDs follow in a list.
 var grouped={},order=[];
 affected.forEach(function(r){
  var key=r.why.join('／')+'|'+r.status;
  if(!grouped[key]){grouped[key]={why:r.why.join('／'),status:r.status,kind:(label[r.forest_class]||r.forest_class)+'・'+(age[r.age_class]||r.age_class),ids:[]};order.push(key);}
  grouped[key].ids.push(r.stand_id.replace(/^STAND-/,''));
 });
 var rows=order.map(function(k){var g=grouped[k];
  return '<tr><td style="white-space:normal"><b>'+gxEsc(g.why)+'</b> <span data-stand-count="'+g.ids.length+'">（'+fmt(g.ids.length)+'小班）</span><br><small>'+gxEsc(g.kind)+' → 結果：'+gxEsc(status[g.status]||g.status)+'</small></td></tr>';
 }).join('');
 var idList=order.map(function(k){var g=grouped[k];return '<p><b>'+gxEsc(status[g.status]||g.status)+'</b>：'+gxEsc(g.ids.join('、'))+'</p>';}).join('');
 var names={natural_volume_table_min_period:'天然生林の幹材積表の版の下限',final_harvest_timing:'主伐時期の確認記録'};
 var nm=function(list){return list.map(function(x){return gxEsc(names[x]||x);}).join('、')||'なし';};
 var summary=Object.keys(groups).sort().map(function(k){return gxEsc(status[k]||k)+' '+fmt(groups[k]);}).join('・');
 return '<section class="gx-dashboard" id="gx-forest-stand" aria-labelledby="gx-forest-title">'+
 '<div class="gx-section-heading"><span class="gx-kicker">P78 · FOREST STAND × FO-001 · SYNTHETIC</span>'+
 '<h2 id="gx-forest-title">森林のルールが変わったら、見直す小班だけを示す。</h2>'+
 '<p>J-クレジットの森林経営活動（FO-001）を想定し、60の架空の小班を合成ルールv1で評価したあと、v2へ変えた影響をEvidence Compilerで追跡します。v2の変更は、2026年の制度運営委員会で議題になった「天然生林の幹材積表の更新」と「主伐時期の確認」を<b>模した合成</b>で、実際の改定内容ではありません。</p></div>'+
 '<div class="gx-detail-grid">'+cards+'</div>'+
 '<p class="gx-anomaly"><b>v1→v2の変更点：</b>パラメータ「'+nm(d.methodology_diff.changed_parameters)+'」、証拠要件「'+nm(d.methodology_diff.changed_evidence_requirements)+'」の追加。再検証の内訳：'+summary+'。</p>'+
 '<table><thead><tr><th scope="col" style="white-space:normal">見直す理由（小班数）・対象・再評価の結果</th></tr></thead><tbody>'+rows+'</tbody></table>'+
 (typeof gxWorklistSlot==='function'?gxWorklistSlot('forest'):'')+'<details><summary>該当する小班（合成ID・'+fmt(affected.length)+'件）</summary>'+idList+'</details>'+
 '<div class="gx-source-panel"><div><h3>実データはローカルで</h3><p>森林簿CSV（UTF-8／Shift_JIS）と森林計画図（GeoJSON・GeoJSONSeq、GDALがあればGeoPackage）を<code>scripts/forest-stand-cli.mjs</code>で取り込みます。林小班番号は計画の見直しで変わり、分割・統合も起きるため、NaFT独自の恒久<code>stand_id</code>と年度別の観測を分け、対応づけは人が根拠ハッシュと理由を残して承認したときだけ確定します。所有者名などの列があれば取り込みを止め、座標は保存せずハッシュだけを残します。</p></div>'+
 '<div><h3>出典と利用条件</h3><p>林野庁は2026年2月、民有林・国有林を統合した全国統一仕様の森林GISオープンデータ（森林計画対象森林、20mの森林資源メッシュ等）の順次公開を発表しました。都道府県の森林簿・森林計画図は県ごとに利用条件が異なり、複製・再配布を禁止する県もあります。NaFTは利用条件を取り込みプロファイルに必須で記録し、公開リポジトリに原データを置きません。</p></div></div>'+
 '<p class="gx-anomaly"><b>重要：</b>小班・ルール・結果はすべて合成です。FO-001の適用可否、森林吸収量、クレジット発行量、林地の権利や境界を示すものではありません。参照用のFO-001 Packは原文・係数が未固定のため、常に自動判定を停止します。</p>'+
 '</section>';
}
