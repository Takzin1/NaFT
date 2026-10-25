'use strict';
// UI-only translation adapter. Original IEEE algorithms, identifiers, source hashes,
// JSON, public Sepolia evidence and existing Japanese AG-005 machinery are unchanged.
// Translate visible text nodes; preserve HTML attributes and <pre>/<code> payloads.
var CLIMATECHAIN_JAPANESE_LABELS={
  'Research UI ↗':'日本語研究UI ↗',
  'Version-Aware Climate MRV':'版管理型 気候MRV',
  'Carbon markets need evidence that survives methodology change.':'方法論が改定されても検証可能な証拠を、カーボン市場へ。',
  'Carbon Markets &amp; Emissions Transparency':'カーボン市場と排出情報の透明性',
  'When climate MRV rules change, ':'気候MRVのルールが改定されたら、',
  'know what needs re-verification.':'どの申請を再検証するべきかを特定する。',
  'NaFT turns methodology change into a traceable engineering decision.':'NaFTは方法論改定を追跡可能な判断へ変換します。',
  ' Find affected claims, preserve unaffected ones, and link each successor to the exact package it replaces.':' 影響対象を特定し、非影響対象を維持し、後継版と元のパッケージを連結します。',
  'Run 100-claim methodology update':'合成100件の方法論改定を実行',
  'LIVE SYNTHETIC DEMO':'合成データによるライブ実験',
  'Only intensive claims receive additional requirements.':'特定区分のみ追加要件の対象。',
  'Independently verifiable':'独立検証可能',
  'Proof that can be inspected.':'検証できる技術的証拠',
  'change classes':'変更区分','adversarial cases':'反例テスト',
  'tested synthetic state space':'試験した合成条件内',
  'Research prototype.':'研究プロトタイプ。',
  'Synthetic claims; no certification, credit issuance, or claim of real-world accuracy.':'合成申請のみ。正式認証・クレジット発行・実環境精度を主張しません。',
  'Rules change':'方法論変更','Trace dependencies':'依存関係追跡',
  'Re-verify affected':'影響対象の再検証','Witness lineage':'変更履歴の証跡化',
  'Real-world reference context':'現実の制度との接点',
  'Why this problem exists outside the demo':'この問題が実際の制度にも存在する理由',
  'Reference evidence, not a carbon-credit claim':'参考文献による研究であり、認証済みクレジットではない',
  'Inspect source-attributed Japan baseline →':'日本の出典付き研究資料を見る →',
  'Verification protocol →':'検証手順 →',
  'Research-only AG-005 calculation CLI →':'研究用AG-005計算CLI →',
  'Boundary:':'検証範囲：','Not field evidence:':'実測の証明ではない：',
  '01 / Selective re-verification':'01 / 選択的再検証',
  'One rule change. Not every claim changes.':'方法論が変わっても、すべての申請が変わるわけではない。',
  'The impact analyzer computes the affected set from the synthetic methodology transition. Nothing in this breakdown is a claimed productivity improvement.':'合成方法論の改定について、解析器が影響する申請を実際に計算します。この比率は作業効率の実測結果ではありません。',
  '100-claim change-impact breakdown':'100件の変更影響内訳',
  'computed from live analyzer output':'解析器の実行結果',
  'Candidate claims':'対象申請','Re-verify':'再検証','Unaffected':'影響なし',
  'Automatically re-evaluated':'自動再評価','Needs new evidence':'新たな証憑が必要',
  'same methodology family':'同じ方法論系列',
  'semantic dependency changed':'依存関係の実質変更',
  'no successor generated':'後継版は生成しない',
  'View claim trace':'申請の変更理由を表示',
  'Download impact analysis JSON':'影響解析JSONを保存',
  'Download audit receipt JSON':'監査レシートJSONを保存',
  'Prepare blockchain anchor plan':'ブロックチェーン記録計画を作成',
  'Run tamper challenge':'改ざん検知を検証',
  'Verify all three pillars':'3要素を独立検証',
  'Download 3-pillar proof JSON':'3要素の証明JSONを保存',
  'From package P1 to P2, on chain.':'公開チェーン上のP1からP2への継承記録',
  'Genesis package':'元のパッケージ',
  'Successor package':'後継パッケージ',
  'Claim head':'申請の最新記録',
  'Browser planner status:':'ブラウザ内での準備状態：',
  'Prepared transaction arguments':'送信前の引数（送信はしない）',
  'Download anchor plan JSON':'アンカー計画JSONを保存',
  'Change one evidence byte. Detect an invalid manifest.':'証拠の1バイトを変えて改ざん検知を確かめる',
  'Before':'変更前','After':'変更後','Tamper rejected':'改ざんを拒否',
  'Inspect failure codes and package hash changes':'失敗コードとハッシュの変化を見る',
  'Download tamper challenge JSON':'改ざん検証JSONを保存',
  'External witness, not climate truth':'公開証跡は環境測定の真実を保証しない',
  'On-chain':'オンチェーン','Off-chain':'オフチェーン','Never claimed':'主張しない内容',
  'Who uses NaFT?':'NaFTの利用者',
  'Project aggregator':'プロジェクト統括者',
  'MRV / verification operator':'MRV・検証担当者',
  'Registry / carbon program':'登録簿・制度運営者',
  'Designed to fail closed':'不明な場合は安全側で停止',
  'Adversarial cases':'反例テスト',
  'False negatives':'偽陰性',
  'Change classes':'変更の種類',
  'within the tested synthetic state space':'試験した合成条件内',
  'methodology · evidence · parameter · field · activity':'方法論・証拠・係数・圃場・活動',
  'Contract':'コントラクト','Deploy Tx':'配置取引',
  'P1 Tx':'P1取引','P2 Tx':'P2取引',
  'Read-only verifier':'読み取り専用検証器',
  'VERIFIED TESTNET':'検証済みテストネット',
  'NOT SUBMITTED':'未送信'
};
var climateJapaneseKeys=Object.keys(CLIMATECHAIN_JAPANESE_LABELS).sort(function(a,b){return b.length-a.length;});
function climateJapaneseText(text) {
  for(var i=0;i<climateJapaneseKeys.length;i++){
    var k=climateJapaneseKeys[i];
    if(text.indexOf(k)>=0)text=text.split(k).join(CLIMATECHAIN_JAPANESE_LABELS[k]);
  }
  return text;
}
function climateJapaneseHtml(html) {
  // Preserve machine-readable inspector JSON and output code fragments byte for byte.
  return html.split(/(<pre\b[^>]*>[\s\S]*?<\/pre>|<code\b[^>]*>[\s\S]*?<\/code>)/gi)
    .map(function(part){
      if(/^<(pre|code)\b/i.test(part))return part;
      return part.replace(/>([^<>]+)</g,function(_,visible){
        return '>'+climateJapaneseText(visible)+'<';
      });
    }).join('');
}
// Wrappers do not alter the original function or evaluation state.
var climatePageOriginal=pgClimateChainDemo;
pgClimateChainDemo=function(){return climateJapaneseHtml(climatePageOriginal());};
var climateHeaderOriginal=climateChainHeader;
climateChainHeader=function(){return climateJapaneseHtml(climateHeaderOriginal());};
