'use strict';

var REVIEWER_DEMO_ROUTE='reviewer-demo';
var ReviewerDemo={impact:null,stale:null,message:''};

function mitouReviewerClaims() {
  var claims=[];
  for(var i=1;i<=100;i++) {
    var variant=i<=70?'standard':i<=85?'intensive':'intensive_complete';
    claims.push(syntheticClaim('MITOU-'+String(i).padStart(3,'0'),variant));
  }
  return claims;
}

function runMitouReviewerExperiment() {
  return analyzeImpact(
    mitouReviewerClaims(),
    {type:'methodology',old_key:'NAFT-SYNTHETIC@1',new_key:'NAFT-SYNTHETIC@2'}
  );
}

function reviewerRepresentativeRows(impact) {
  if(!impact) return [];
  var wanted=['UNAFFECTED','AUTO_REEVALUATED','EVIDENCE_REQUIRED'];
  return wanted.map(function(status) {
    return impact.claims.find(function(row) { return row.status===status; });
  }).filter(Boolean);
}

function reviewerImpactExplanation(row) {
  if(!row) return null;
  var successor=row.successor&&row.successor.document;
  return {
    claim_id:row.claim_id,
    transition:'NAFT-SYNTHETIC@1 → @2',
    candidate_because:row.reasons,
    requires_reverification:row.requires_reverification,
    status:row.status,
    active_dependency_result:row.requires_reverification
      ? 'The active semantic projection changed for this Claim.'
      : 'The methodology version changed, but this Claim\'s active semantic projection did not.',
    affected_nodes:row.affected_nodes,
    previous_package_hash:row.previous_package_hash,
    previous_package_stale:row.previous_package_stale,
    successor_exists:!!row.successor,
    successor_package_hash:row.successor?row.successor.package_hash:null,
    supersedes:successor
      ? successor.provenance_graph.edges.filter(function(e) { return e.type==='supersedes'; })
      : []
  };
}

function runReviewerStaleProof(decision) {
  var oldInput=syntheticClaim('MITOU-STALE','ambiguous');
  var oldPack=COMPILER_REGISTRY['NAFT-SYNTHETIC@1'];
  var oldFingerprint=inputFingerprint(oldInput),oldPackHash=hashObject(oldPack);
  var changed=clone(oldInput);
  changed.activity.methodology_version='2';
  changed.evidence=changed.evidence.map(function(e) {
    return Object.assign({},e,{methodology_version:'2'});
  });
  var nextPack=COMPILER_REGISTRY['NAFT-SYNTHETIC@2'];
  var nextFingerprint=inputFingerprint(changed),nextPackHash=hashObject(nextPack);
  return {
    decision:decision||'ACCEPT',
    exception_code:'FIELD_IDENTITY_AMBIGUOUS',
    old_binding:{input_fingerprint:oldFingerprint,pack_hash:oldPackHash},
    changed_binding:{input_fingerprint:nextFingerprint,pack_hash:nextPackHash},
    stale:oldFingerprint!==nextFingerprint||oldPackHash!==nextPackHash,
    enforcement:'Session validation rejects a decision bound to different input_fingerprint / pack_hash as STALE_REVIEW. Hard errors remain non-overridable.'
  };
}

function reviewerMetric(label,value,note) {
  return '<div class="metric"><span>'+esc(label)+'</span><strong>'+esc(value)+'</strong><small>'+esc(note||'')+'</small></div>';
}

function reviewerRepresentativeCard(row) {
  var d=reviewerImpactExplanation(row);
  return '<details class="card impact-detail"><summary><b>'+esc(d.claim_id)+'</b> · '+esc(d.status)+'</summary>'+
    '<p><b>再検証:</b> '+esc(d.requires_reverification?'必要':'不要')+'</p>'+
    '<p>'+esc(d.active_dependency_result)+'</p>'+
    '<p><b>変更理由:</b> '+esc(d.candidate_because.join(', ')||'none')+'</p>'+
    '<p><b>successor:</b> '+esc(d.successor_exists?'generated':'none')+'</p>'+
    '<p><b>affected dependency nodes:</b> '+esc(d.affected_nodes.length)+'</p>'+
    '<details><summary>Dependency / package detail</summary>'+jsonView(d)+'</details>'+
  '</details>';
}

function pgReviewerDemo() {
  var impact=ReviewerDemo.impact;
  var out='<section class="card reviewer-hero"><span class="eyebrow">Mitou Advanced · Reviewer Demo</span>'+
    '<h2>方法論が変わったとき、過去100 Claimの何を再検証するか？</h2>'+
    '<p>NaFTは、方法論・Evidence・係数・人間判断の依存関係を版付きで保持し、変更差分から再検証対象を根拠付きで絞り込みます。</p>'+
    '<div class="flow"><span>Methodology v1</span><b>→ semantic change →</b><span>Methodology v2</span></div>'+
    button('100 Claim変更影響実験を実行','reviewer-run',false)+
    '<p class="muted">Synthetic engineering experiment only · 正式認証・実制度性能保証ではありません。</p></section>';

  if(!impact) {
    out+='<section class="card"><h3>このボタンが行うこと</h3><p>申請書で示した100 Claim合成改定実験と同じ生成規則・同じ <code>analyzeImpact</code> をその場で実行します。数値カードは固定表示ではなく計算結果です。</p></section>';
  } else {
    var c=impact.counts;
    out+='<section class="card"><span class="eyebrow">Computed live</span><h2>変更影響の計算結果</h2>'+
      '<div class="metric-grid">'+
        reviewerMetric('Candidate Claims',c.potentially_affected,'変更版の候補集合')+
        reviewerMetric('Re-verification',c.require_reverification,'successor生成対象')+
        reviewerMetric('Unaffected',c.UNAFFECTED,'successorを生成しない')+
        reviewerMetric('Auto re-evaluated',c.AUTO_REEVALUATED,'自動再評価')+
        reviewerMetric('Evidence required',c.EVIDENCE_REQUIRED,'不足Evidenceで停止')+
      '</div>'+
      '<div class="notice"><b>70% = 件数ベースの再検証スコープ削減のみ。</b> 処理時間、費用、精度、field validation、verifier acceptanceの70%改善を意味しません。</div>'+
      '<h3>なぜ30件だけなのか</h3><p>100件すべてが方法論版変更の候補ですが、Claimごとのactive dependency projectionを比較し、意味上の影響がある30件だけsuccessorを作ります。</p>'+
      reviewerRepresentativeRows(impact).map(reviewerRepresentativeCard).join('')+
      button('Impact JSONをダウンロード','reviewer-export',false)+
      '</section>';
  }

  out+='<section class="card"><span class="eyebrow">Human Decision binding</span><h2>人間判断も変更後は使い回さない</h2>'+
    '<p>Human DecisionはClaim/run、exception、input fingerprint、Pack hashへ束縛します。入力またはPackが変われば、以前の判断はstaleです。</p>'+
    '<label>例として記録する判断<select id="reviewer-decision"><option>ACCEPT</option><option>REJECT</option><option>NEED_MORE_EVIDENCE</option><option>ABSTAIN</option></select></label>'+
    button('Human Decision stale化を見る','reviewer-stale',false);
  if(ReviewerDemo.stale) {
    out+='<div class="notice"><b>STALE = '+esc(ReviewerDemo.stale.stale)+'</b> · '+esc(ReviewerDemo.stale.decision)+' は変更前input/Packへの判断であり、変更後の最終attestationへ再利用できません。</div>'+
      '<details><summary>Binding差分を見る</summary>'+jsonView(ReviewerDemo.stale)+'</details>';
  }
  out+='<p class="muted">UNSUPPORTED / EVIDENCE_REQUIRED / tamper / methodology mismatch / deterministic failure 等のhard errorはHuman Reviewでoverrideできません。</p></section>';

  out+='<section class="card"><h3>60秒で見る順番</h3><ol>'+
    '<li>方法論 v1 → v2 が変わる</li>'+
    '<li>100 Claimの候補集合を計算する</li>'+
    '<li>30件だけ再検証、70件は非影響</li>'+
    '<li>不足Evidenceは止める</li>'+
    '<li>Human Decisionも変更後はstale</li>'+
    '<li>Claimごとのdependency / successor理由を確認する</li>'+
    '</ol><p><a href="#/methodologies">通常の6ステップ研究UIへ →</a></p></section>';
  return out;
}

function handleReviewerAction(action) {
  if(action==='reviewer-run') {
    ReviewerDemo.impact=runMitouReviewerExperiment();
    ReviewerDemo.message='100 Claim synthetic impact analysis completed.';
  }
  if(action==='reviewer-export'&&ReviewerDemo.impact) {
    downloadJSON(canonicalize(ReviewerDemo.impact),'naft-mitou-reviewer-impact.json');
  }
  if(action==='reviewer-stale') {
    var el=document.getElementById('reviewer-decision');
    ReviewerDemo.stale=runReviewerStaleProof(el?el.value:'ACCEPT');
  }
}
