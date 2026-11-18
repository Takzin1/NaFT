/* P79 · AG-005 real revision (Ver.3.1 → Ver.3.3, e-Gov texts) re-verification triage on #/gx-data.
 * Computed after render (≈0.5–1 s) and cached; rule changes are source-derived, paddies are SYNTHETIC.
 */
'use strict';
var GX_AG005_REVISION={result:null,error:null,pending:false};
function gxAg005RevisionPanel(){
 return '<section class="gx-dashboard" id="gx-ag005-revision" aria-labelledby="gx-ag005-title" aria-live="polite">'+
 '<div class="gx-section-heading"><span class="gx-kicker">P79 · AG-005 Ver.3.1 → 3.3 · SOURCE-DERIVED RULES</span>'+
 '<h2 id="gx-ag005-title">本物の改定で、何を追加で求められるかを振り分ける。</h2>'+
 '<p>e-Govで公開されたAG-005のVer.3.1とVer.3.3の本文から、変わった要件だけをPackにしました。水田と記録は合成です。</p></div>'+
 '<div id="gx-ag005-slot">'+(GX_AG005_REVISION.result?gxAg005RevisionBody(GX_AG005_REVISION.result):GX_AG005_REVISION.error?gxAg005RevisionError():'<p class="gx-label">改定の影響を計算しています…</p>')+'</div></section>';
}
function gxAg005RevisionError(){
 return '<p class="gx-anomaly" role="alert">AG-005の改定比較を停止しました（'+gxEsc(GX_AG005_REVISION.error)+'）。</p>';
}
function gxAg005RevisionBody(d){
 var fmt=function(n){return Number(n).toLocaleString('ja-JP');};
 var names={
  'certification_start_not_before_extension:added':'認証対象期間の開始日が、中干し延長を始めた年より前でないこと（ルール追加）',
  'percolation_record_proof:added':'日減水深の測定記録が実態どおりである証跡（実測で排水性を区分する水田のみ）',
  'activity_report_list:added':'2025年以降の活動を含む個別活動実績報告リスト（地番表記）'
 };
 var changes=d.methodology_diff.changed_rules.concat(d.methodology_diff.changed_evidence_requirements);
 var issueNames={'missing_evidence:percolation_record_proof':'日減水深の証跡','missing_evidence:activity_report_list':'報告リスト','rule:certification_start_not_before_extension':'認証開始日の見直し'};
 var groups={},order=[];
 d.rows.forEach(function(r){
  var k=r.triage+'|'+r.new_issues.join(',');
  if(!groups[k]){groups[k]={triage:r.triage,issues:r.new_issues,n:0};order.push(k);}groups[k].n++;
 });
 var tri={NO_NEW_DEMAND:'追加の対応なし（自動で再評価）',NEW_EVIDENCE:'証拠の追加が必要',RULE_NOT_MET:'新しいルールに不適合（是正が必要）',UNAFFECTED:'影響なし'};
 var rank={NO_NEW_DEMAND:0,NEW_EVIDENCE:1,RULE_NOT_MET:2};
 order.sort(function(a,b){var x=groups[a],y=groups[b];return rank[x.triage]-rank[y.triage]||y.n-x.n||(a<b?-1:1);});
 var rows=order.map(function(k){var g=groups[k];
  return '<tr><td style="white-space:normal"><b>'+gxEsc(tri[g.triage])+'</b> <span data-paddy-count="'+g.n+'">（'+fmt(g.n)+'筆）</span><br><small>'+
   gxEsc(g.issues.length?g.issues.map(function(c){return issueNames[c]||c;}).join('・'):'新たに求められる項目なし')+'</small></td></tr>';
 }).join('');
 return '<div class="gx-detail-grid">'+
 '<article class="gx-data-card"><span class="gx-kicker">原文で変わった要件</span><strong>'+fmt(changes.length)+' <small>項目</small></strong><p>延長7日・直近2か年などは不変</p></article>'+
 '<article class="gx-data-card"><span class="gx-kicker">合成の水田</span><strong>'+fmt(d.counts.total)+' <small>筆</small></strong><p>全筆に効くルール追加があるため全筆が再評価対象</p></article>'+
 '<article class="gx-data-card"><span class="gx-kicker">追加の対応なし</span><strong>'+fmt(d.triage.NO_NEW_DEMAND)+' <small>筆</small></strong><p>自動の再評価だけで済む</p></article>'+
 '<article class="gx-data-card"><span class="gx-kicker">人の作業が要る</span><strong>'+fmt(d.triage.NEW_EVIDENCE+d.triage.RULE_NOT_MET)+' <small>筆</small></strong><p>証拠の追加 '+fmt(d.triage.NEW_EVIDENCE)+'・是正 '+fmt(d.triage.RULE_NOT_MET)+'</p></article></div>'+
 '<p class="gx-anomaly"><b>Ver.3.3で追加：</b>'+changes.map(function(c){return gxEsc(names[c]||c);}).join('／')+'。</p>'+
 '<table><thead><tr><th scope="col" style="white-space:normal">振り分け（筆数）と新たに求められる項目</th></tr></thead><tbody>'+rows+'</tbody></table>'+
 '<p class="gx-anomaly"><b>重要：</b>翻訳は部分的で、排出係数表・GWP・現行採択版（公式一覧ではVer.3.5）は固定していません。両Packとも認証用の判定は常に停止し、削減量は算定しません。Ver.3.3の原文はパブリックコメント版（日付が「2025.3.XX」）で、バイト列のハッシュは未固定です。</p>';
}
function gxAg005RevisionHydrate(){
 if(typeof document==='undefined'||GX_AG005_REVISION.result||GX_AG005_REVISION.error||GX_AG005_REVISION.pending)return;
 GX_AG005_REVISION.pending=true;
 setTimeout(function(){
  try{
   if(typeof ag005RevisionDemo!=='function')throw Error('P79_AG005_PACKS_NOT_LOADED');
   GX_AG005_REVISION.result=ag005RevisionDemo();
  }catch(err){GX_AG005_REVISION.error=err.message;}
  GX_AG005_REVISION.pending=false;
  var slot=document.getElementById('gx-ag005-slot');
  if(slot&&slot.isConnected)slot.innerHTML=GX_AG005_REVISION.result?gxAg005RevisionBody(GX_AG005_REVISION.result):gxAg005RevisionError();
 },30);
}
