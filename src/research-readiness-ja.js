'use strict';
/* Research Evidence Readiness — pinned 2026-10-19 metadata-only Japanese view.
 * Not a live sensor reader. CI compares every status, count, source ID and
 * blocker against the deterministic research source-gate report.
 * Do not treat a published numeric field as an independently QC-approved reading.
 */
var RESEARCH_READINESS_ROUTE='source-readiness';
var RESEARCH_READINESS_JA={
  schema:'naft-research-readiness-ui-snapshot-v1',
  snapshot_label:'PINNED_RESEARCH_SOURCES_2026_10_19',
  scientific_status:'BLOCKED',
  source_refs:[
    'japanflux_zip','komiya_dissertation','tellus_ec_options',
    'verra_vm0051','gold_workbook','gold_validation_checklist'
  ],
  bounded_claims:7,
  half_hour_slots:17520,
  numeric_qc_unknown:1915,
  missing_fch4:15605,
  qc_verified:0,
  before_badm_start:1689,
  certified_tco2e:null,
  annual_ch4:null,
  blockers:[
    {id:'JP_HRT_SOURCE_TO_ROW_LINEAGE',priority:'P0',source:'japanflux_zip',
     label:'原センサーから公開値までの系譜が未確認',
     why:'公表されたFCH4値を、元センサー・演算・QCの行別証跡に対応付けられない。',
     needed:'10Hz原信号・30分処理データ、演算ソフト設定、タイムスタンプ照合、変換履歴の確認'},
    {id:'JP_HRT_ROW_QC_OR_GAPFILL',priority:'P0',source:'komiya_dissertation',
     label:'観測値の品質判定と欠測補完履歴が未確認',
     why:'数値候補1,915件はQC不明で、独立に検証された観測値ではない。',
     needed:'行別のQC・棄却理由、事前補完履歴、実測とモデル推定値の区別'},
    {id:'JP_HRT_BADM_DATE_AND_METHOD',priority:'P0',source:'japanflux_zip',
     label:'BADMの測定開始日と公開データの不整合',
     why:'1,689件の数値候補が、BADMに記録されたCH4開始日より前にある。',
     needed:'観測チームによる開始日の説明、期間別のFCH4測定・処理方法'},
    {id:'JP_HRT_TIMESTAMP_AND_COVERAGE',priority:'P0',source:'japanflux_zip',
     label:'時刻定義・期間・欠測の取扱いが未確定',
     why:'17,520枠中15,605枠が欠測。UTCオフセットだけでは時間積算の妥当性を保証できない。',
     needed:'原資料の時刻定義、測定期間・圃場カバレッジ、根拠ある欠測処理'},
    {id:'GOLD_STANDARD_TIER_INCONSISTENCY',priority:'P1',source:'gold_validation_checklist',
     label:'Gold StandardのTier番号が文書間で衝突',
     why:'検証チェックリストのTier 1/3と、ワークブックのTier 1/3は異なる意味を持つ。',
     needed:'文書版を特定した公式説明。番号だけの自動変換は禁止'},
    {id:'GOLD_WORKBOOK_ORACLE_INCOMPLETE',priority:'P1',source:'gold_workbook',
     label:'Gold Standard計算例の完全な独立再現が未完了',
     why:'CH4のみの例示計算は、全ガス・全シナリオを含むワークブック検証ではない。',
     needed:'セル参照と式、N2O・燃料・漏出・適格性を含む独立再計算'},
    {id:'EXTERNAL_ATTESTATION_ABSENT',priority:'P1',source:'verra_vm0051',
     label:'外部認証・発行の証拠がない',
     why:'公表資料の照合は、正式な妥当性確認・クレジット認証を意味しない。',
     needed:'該当制度の現行要件、必要な検証機関の評価、正式な出典証明'}
  ]
};
function researchReadinessHeader(){
 return '<header><span class="eyebrow">NaFT · Research Evidence Readiness</span>'+
  '<h1>原観測・証憑の検証状況</h1><p>研究資料の出典、観測値の品質、制度別方法論を切り分ける読み取り専用の日本語版です。</p>'+
  '<nav aria-label="研究画面の切替"><a href="#/climatechain">ClimateChain差分再検証</a>'+
  '<a href="#/methodologies">NaFT MRV研究UI</a></nav></header>';
}
function researchReadinessItem(x){
 return '<details class="card" data-evidence-blocker="'+esc(x.id)+'">'+
  '<summary><strong>'+esc(x.priority)+'｜'+esc(x.label)+'</strong></summary>'+
  '<p>'+esc(x.why)+'</p><p><b>次に必要な証拠：</b>'+esc(x.needed)+'</p>'+
  '<p class="muted">Evidence ID: <code>'+esc(x.id)+'</code> · Source: <code>'+esc(x.source)+'</code></p>'+
  '</details>';
}
function pgResearchReadinessJa(){
 var x=RESEARCH_READINESS_JA,p0=x.blockers.filter(function(b){return b.priority==='P0';}),
 p1=x.blockers.filter(function(b){return b.priority==='P1';});
 if(x.qc_verified!==0||x.certified_tco2e!==null||x.annual_ch4!==null)
  throw new Error('RESEARCH_READINESS_UNSUPPORTED_CLAIM');
 if(x.numeric_qc_unknown+x.missing_fch4!==x.half_hour_slots)
  throw new Error('RESEARCH_READINESS_COVERAGE_MISMATCH');
 return '<section class="card" aria-label="研究資料の検証範囲">'+
  '<span class="eyebrow">SOURCE-BOUND / NOT CERTIFIED</span>'+
  '<h2>数値の存在と、科学的な検証は別です</h2>'+
  '<p>2026年10月19日に固定した研究メタデータのスナップショットです。現在の現場測定を読み込んだ画面ではありません。</p>'+
  '<div class="notice"><b>正式認証なし・年排出量未算定</b>。原データの出版社認証、行別QC、正式クレジット発行は確認できません。</div>'+
  '<table><caption>JapanFlux JP-Hrt 公開データの30分枠（固定調査時点）</caption><tbody>'+
  '<tr><th scope="row">全データ枠</th><td>'+esc(x.half_hour_slots.toLocaleString('ja-JP'))+'</td></tr>'+
  '<tr><th scope="row">FCH4数値候補（QC不明）</th><td>'+esc(x.numeric_qc_unknown.toLocaleString('ja-JP'))+'</td></tr>'+
  '<tr><th scope="row">FCH4欠測</th><td>'+esc(x.missing_fch4.toLocaleString('ja-JP'))+'</td></tr>'+
  '<tr><th scope="row">独立QC検証済みの観測値</th><td><strong>'+esc(x.qc_verified)+'</strong>（数値候補から自動認定しません）</td></tr>'+
  '<tr><th scope="row">BADM開始日より前の数値候補</th><td>'+esc(x.before_badm_start.toLocaleString('ja-JP'))+'（要説明）</td></tr>'+
  '</tbody></table>'+
  '<p class="muted">原測定ZIP・研究者の連絡先・著作権不明資料は、この表示に収録していません。</p></section>'+
  '<section aria-labelledby="research-p0"><h2 id="research-p0">P0｜科学的検証を止めている未解決事項（'+p0.length+'件）</h2>'+
  p0.map(researchReadinessItem).join('')+'</section>'+
  '<section aria-labelledby="research-p1"><h2 id="research-p1">P1｜制度間整合・外部検証（'+p1.length+'件）</h2>'+
  p1.map(researchReadinessItem).join('')+'</section>'+
  '<section class="card"><h2>再現方法・検証範囲</h2>'+
  '<p>元の資料情報を厳格な出典ゲートで監査し、ソース参照'+esc(x.source_refs.length)+'件、限定された根拠付き主張'+esc(x.bounded_claims)+'件、未解決項目'+x.blockers.length+'件をレポートします。</p>'+
  '<p>CIでこの画面の数値とブロッカーIDを、研究レポート生成器の実行結果と照合します。</p>'+
  '<pre>node scripts/report-research-readiness.mjs --format markdown\nnode scripts/report-research-readiness.mjs --format json</pre>'+
  '<p><a href="https://github.com/Takzin1/NaFT/blob/feat/naft-evidence-readiness-ja-20261102/docs/research-readiness-evidence-report-2026-10-19.md" target="_blank" rel="noopener noreferrer">出典別・検証範囲の文書</a></p>'+
  '<p class="muted">この画面自体は監査証明書ではなく、事後的な科学的保証を付与しません。</p></section>';
}
