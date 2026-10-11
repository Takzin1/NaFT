'use strict';
// 技育展向けの日本語表示層。計算・認証・データモデルのコードやJSONキーは変更しない。
var GIKUTEN_JA = [
  ['Version-aware MRV Evidence Compiler + Re-verification Engine','方法論の版変更に対応するMRV証憑コンパイラ・再検証エンジン'],
  ['Version-aware MRV Evidence Compiler','版変更に対応するMRV証憑コンパイラ'],
  ['Version-aware MRV','版変更に対応するMRV'],
  ['Evidence Compiler · 3 minute synthetic demo','証憑コンパイラ｜3分間の合成データ実演'],
  ['Evidence → Package / Change → Re-verification','証憑を検証用パッケージへ／変更差分から再検証へ'],
  ['NaFT transforms heterogeneous environmental evidence into methodology-aware, reproducible, human-reviewable MRV packages.','NaFTは形式の異なる環境証憑を、方法論に対応し、再計算と人による審査が可能なMRVパッケージへ変換します。'],
  ['Reviewer Demo','審査員向けデモ'],
  ['NaFT · Research Prototype','NaFT｜研究段階の試作システム'],
  ['NaFT · MRV research prototype','NaFT｜MRV研究プロトタイプ'],
  ['Mitou Reviewer Demoを開く','変更影響デモを開く'],
  ['未踏アドバンスト審査用デモ','技育展向け・変更影響の実演'],
  ['未踏アドバンスト審査用Reviewer Demo','審査員向け実演'],
  ['Demo actor','操作する役割'],
  ['Selected field / activity','対象圃場・活動'],
  ['Select activity','活動を選択'],
  ['Client-side demo identities','ブラウザ内の実演用役割'],
  ['MRV workflow','MRV作業手順'],
  ['Methodology registry','方法論の登録・版管理'],
  ['Evidence adapter','証憑の取込・正規化'],
  ['Deterministic evaluation','再現可能な自動評価'],
  ['Human-on-the-exception','例外だけ人間が判断'],
  ['Human-at-the-attestation','最終確認は人間が担当'],
  ['Monitoring package','再現可能な検証用パッケージ'],
  ['Monitoring Package','検証用パッケージ'],
  ['Human Review','人間による確認'],
  ['Methodology','方法論'],
  ['Evidence','証憑'],
  ['Evaluation','評価'],
  ['Exception','例外'],
  ['Research Prototype','研究段階の試作システム'],
  ['CONFIG REQUIRED','制度要件の確認が必要'],
  ['Required categories:','必要な証憑区分：'],
  ['Category / year','区分・対象年'],
  ['Original file','元ファイル'],
  ['Original for recheck','再照合する元ファイル'],
  ['Source','提供元'],
  ['File / type','ファイル・区分'],
  ['Year','対象年'],
  ['Hash','ハッシュ値'],
  ['Hash selected file','選択ファイルのハッシュを記録'],
  ['Add SYNTHETIC demo evidence','架空の証憑データを追加'],
  ['Recheck manifest (this page)','このページの証憑を再照合'],
  ['Verify content hash','ファイルの同一性を照合'],
  ['Inspect page manifests','証憑の記録内容を見る'],
  ['Close manifest JSON','記録内容を閉じる'],
  ['Previous','前へ'],
  ['Next','次へ'],
  ['Page ','ページ '],
  ['Register activity','活動を登録'],
  ['Activity JSON','活動データ（JSON形式）'],
  ['Program → Farmer → Field → Activityを登録','事業 → 生産者 → 圃場 → 活動を登録'],
  ['Pack schema / source / unknowns','ルール定義・出典・未確定事項'],
  ['Versioned registry:','版管理されたルールの一覧：'],
  ['Release pack','承認対象の研究用ルール'],
  ['Release rationale','承認理由'],
  ['Pack release rationale','ルール公開承認の理由'],
  ['Approve research Pack','研究用ルールの公開を承認'],
  ['Approve prototype Rule Pack','試作ルールの利用を承認'],
  ['Pack hash:','ルールのハッシュ値：'],
  ['Prototype release:','試作ルールの状態：'],
  ['HUMAN APPROVED','人間による承認済み'],
  ['AWAITING MAINTAINER','管理担当者の確認待ち'],
  ['MAINTAINER APPROVAL REQUIRED','管理担当者の承認が必要'],
  ['INTEGRITY ERROR','整合性エラー'],
  ['Demo A · Evidence → draft','実演A｜証憑から下書きを自動生成'],
  ['Demo B · version diff / impact','実演B｜版変更の影響を分析'],
  ['Demo C · ambiguous → review','実演C｜曖昧な情報を人間が判断'],
  ['Apply v1 → v2 to saved synthetic claims','保存した架空案件に版変更を適用'],
  ['Compile normalized evidence input JSON','証憑入力データを正規化してコンパイル'],
  ['Compile evidence → evaluation → draft','証憑を評価し下書きを生成'],
  ['Download impact JSON','変更影響のJSONを保存'],
  ['Structured methodology diff','方法論の変更差分'],
  ['fixture-derived impact','合成データに基づく影響分析'],
  ['Claim','検証対象'],
  ['Scope','対象範囲'],
  ['Status','状態'],
  ['re-verify','再検証する'],
  ['unchanged','変更の影響なし'],
  ['Compiler claim','コンパイル対象'],
  ['Exceptions / calculation / provenance','例外・計算内容・根拠の連鎖'],
  ['Individual human decisions','人間が個別に下した判断'],
  ['No HUMAN_REVIEW_REQUIRED exceptions.','人間の判断を必要とする例外はありません。'],
  ['Final attestation rationale','最終確認の理由'],
  ['Attest compiler package','検証用パッケージを最終確認'],
  ['Download compiler draft','コンパイル下書きを保存'],
  ['Download attested compiler package','最終確認済みパッケージを保存'],
  ['Final attestationへ','最終確認へ'],
  ['Human rationale','人間による判断理由'],
  ['Human Decision','人間による判断'],
  ['Decision:','判断：'],
  ['Reason','理由'],
  ['Accept with reason','理由を記録して承認'],
  ['Reject','却下'],
  ['Evaluate activity','活動を評価'],
  ['Calculation Assist','試算支援'],
  ['Illustrative arithmetic:','参考計算値：'],
  ['certified result: null','認証済み削減量：なし'],
  ['Unavailable','利用不可'],
  ['Calculation inputs / formula','計算の入力値と式'],
  ['Check','検査項目'],
  ['Result','結果'],
  ['Detail','詳細'],
  ['Rule Pack release:','ルール公開承認：'],
  ['Outstanding exceptions:','未解決の例外：'],
  ['evaluation required','評価が必要'],
  ['Final attestation statement','最終確認の記録'],
  ['Attest final package','最終パッケージを確認'],
  ['Export package draft JSON','下書きJSONを保存'],
  ['Export attested package JSON','最終確認済みJSONを保存'],
  ['Attested hash:','最終確認済みハッシュ：'],
  ['Final attestation not recorded','最終確認は未記録'],
  ['Program aggregation · saved counts','事業単位の保存件数集計'],
  ['Verify audit chain','監査履歴の整合性を検査'],
  ['100 Claim変更影響実験を実行','100件の変更影響解析を実行'],
  ['100 Claim','100件の検証対象'],
  ['Claimごとの','案件ごとの'],
  ['Claimの','案件の'],
  ['Claimを','案件を'],
  ['Claimに','案件に'],
  ['Claimへ','案件へ'],
  ['Claimは','案件は'],
  ['Claimと','案件と'],
  ['Claim / Run /','案件／実行記録／'],
  ['standard','標準条件'],
  ['intensive_complete','追加条件・証憑あり'],
  ['intensive','追加条件あり'],
  ['sensor','センサー'],
  ['Synthetic engineering experiment','架空データによる工学実験'],
  ['Synthetic demo','架空データによる実演'],
  ['synthetic fixture','合成データ'],
  ['fixture','合成データ'],
  ['Provenance Graph','根拠の依存関係グラフ'],
  ['Successor Package','後継パッケージ'],
  ['stale（失効）','失効'],
  ['stale化','失効'],
  ['stale','失効'],
  ['input fingerprint','入力内容の識別値'],
  ['Methodology Pack','方法論ルール'],
  ['Pack hash','ルールのハッシュ値'],
  ['Packが','ルールが'],
  ['hard error','停止が必要なエラー'],
  ['hard failure','停止が必要なエラー'],
  ['none','なし'],
  ['AUTO_REEVALUATED','自動再評価'],
  ['EVIDENCE_REQUIRED','追加証憑が必要'],
  ['HUMAN_REVIEW_REQUIRED','人間による判断が必要'],
  ['UNAFFECTED','変更の影響なし'],
  ['NOT EVALUATED','未評価'],
  ['STALE','再確認が必要'],
  ['ATTESTED','最終確認済み'],
  ['SYNTHETIC','架空データ'],
  ['BLOCKED:','処理を停止しました：'],
  ['Data:','データ保存方式：'],
  ['Artifact storage','外部保存アダプター'],
  ['this browser session only; reload clears data','このブラウザの一時領域のみ（再読み込みで消去）'],
  ['theoretical','理論上'],
  ['Operator','登録担当者'],
  ['Reviewer','審査担当者'],
  ['Maintainer','ルール管理者'],
  ['ACCEPT','承認'],
  ['REJECT','却下'],
  ['NEED_MORE_EVIDENCE','追加資料を要求'],
  ['ABSTAIN','判断保留'],
  ["Compiler claim ","コンパイル対象 "],
  [" · draft generated automatically"," · 下書きを自動生成しました"],
  ["Synthetic version transition; originals unchanged.","架空の版変更を解析しました。元データは変更していません。"],
  ["Successor drafts saved; previous packages are historical and stale for current export.","後継の下書きを保存しました。旧パッケージは履歴として保持され、現行版としての出力はできません。"],
  ["Research Pack release approved.","研究用ルールの公開を承認しました。"],
  ["Individual exception decision recorded against exact input and Pack.","入力データとルール版に紐づけて例外判断を記録しました。"],
  ["Research package attested. Formal verification not performed.","研究用パッケージを最終確認しました。正式認証は実施していません。"],
  ["Reference Rule Pack approved for prototype use.","参照ルールの試作システムでの利用を承認しました。"],
  ["Activity registered.","活動を登録しました。"],
  ["Evidence manifest recorded; evaluate current inputs.","証憑のハッシュと記録を保存しました。現在の入力内容を評価してください。"],
  ["SYNTHETIC evidence recorded; no real field observations.","架空の証憑を追加しました。実際の現場観測ではありません。"],
  [" · package draft constructed from the evaluation."," · 評価結果から下書きパッケージを生成しました。"],
  ["Human exception decision recorded.","人間による例外判断を記録しました。"],
  ["Final package attested; formal verification not performed.","パッケージを最終確認しました。正式な検証・認証は実施していません。"],
  ["Monitoring Package exported.","検証用パッケージを出力しました。"],
  ["Audit chain:","監査履歴："],
  [" · checked at "," · 確認日時："],
  ["EVIDENCE_REQUIRED","追加証憑が必要"],
  ["Human Reviewへ","人間による確認へ"],
  ["SYNTHETICデータ","架空データ"],
  ["Monitoring Packageへ","検証用パッケージへ"],
  ["Evidenceへ","証憑へ"],
  ["Evaluationへ","評価へ"],
  ["Exceptionへ","例外へ"],
  ["Packのrelease approval","ルール公開の承認"],
  ["Calculation inputs","計算の入力値"],
  ["Rule Pack","方法論ルール"],
  ["Original","元データ"],
  ["Type","区分"],
  ["Release","公開"],
  ["Demo","実演"],
  ["JSONをダウンロード","JSONを保存"],
  ["download","保存"],
  ["Download","保存"],
  ["overview","概要"]
].sort(function(a,b){return b[0].length-a[0].length;});

function gikutenTranslateText(source) {
  // ブラウザ表示中に機械識別子を部分翻訳しない。JSON・コード値の同一性を厳守する。
  var protectedIds=[];
  var result=String(source).replace(/\bNAFT-[A-Z0-9_-]+(?:@[A-Z0-9_.-]+)?\b/g,function(id){
    var slot=protectedIds.length;protectedIds.push(id);
    return '\uE000'+slot+'\uE001';
  });
  GIKUTEN_JA.forEach(function(pair) {result=result.split(pair[0]).join(pair[1]);});
  return result.replace(/\uE000(\d+)\uE001/g,function(_,i){return protectedIds[Number(i)];});
}
function gikutenLocalize(root) {
  if(!root||typeof document==='undefined')return;
  var walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  var nodes=[],node;
  while((node=walker.nextNode()))nodes.push(node);
  nodes.forEach(function(textNode){
    var el=textNode.parentElement;
    if(!el||el.closest('pre,code,script,style,textarea,[data-raw],tbody td'))return;
    if(el.tagName==='OPTION'){
      // option.value は操作・判断のロジックで使用する。表示ラベルだけ翻訳。
      if(!el.hasAttribute('value'))el.setAttribute('value',el.textContent);
    }
    var before=textNode.nodeValue,after=gikutenTranslateText(before);
    if(before!==after)textNode.nodeValue=after;
  });
  root.querySelectorAll('input[placeholder],textarea[placeholder]').forEach(function(el){
    el.placeholder=gikutenTranslateText(el.placeholder);
  });
  root.querySelectorAll('[aria-label]').forEach(function(el){
    el.setAttribute('aria-label',gikutenTranslateText(el.getAttribute('aria-label')));
  });
}
function gikutenDecorate(){
  if(typeof document==='undefined')return;
  var app=document.getElementById('app');
  if(!app)return;
  gikutenLocalize(app);
  var hero=app.querySelector('.reviewer-hero');
  if(hero&&!hero.querySelector('.gikuten-banner')){
    hero.insertAdjacentHTML('afterbegin','<div class="gikuten-banner"><span class="gikuten-tag">技育展・日本語デモ</span><span>100件の証憑付き案件で、方法論の変更がどこに影響するかを可視化</span></div>');
  }
  document.title='NaFT｜技育展向け日本語デモ';
}
if(typeof window!=='undefined'&&typeof document!=='undefined'){
  document.documentElement.lang='ja';
  // 元の画面・イベント処理を一切変更せず、各描画後に日本語化する。
  if(typeof render==='function'){
    var gikutenOriginalRender=render;
    render=function(){gikutenOriginalRender();gikutenDecorate();};
  }
  gikutenDecorate();
}
