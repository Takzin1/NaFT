/* P77 · Field identity and annual fude polygon references, synthetic explanation panel.
 * This is NOT a field ledger in the browser, and no private geometry is loaded.
 */
'use strict';
function gxFieldIdentityPanel(prefCode){
 if(!/^\d{2}$/.test(prefCode))return '';
 var selected=typeof GX_RICE_STATS!=='undefined'&&Array.isArray(GX_RICE_STATS)?
   GX_RICE_STATS.find(function(x){return x.code===prefCode;}):null;
 var pref=selected?selected.name:'選択地域';
 return '<section class="gx-dashboard" aria-labelledby="gx-p77-title">'+
 '<div class="gx-section-heading"><span class="gx-kicker">P77 · FIELD IDENTITY v1 · SYNTHETIC / LOCAL-FIRST</span>'+
 '<h2 id="gx-p77-title">年度が変わっても、圃場の証拠を見失わない。</h2>'+
 '<p>'+gxEsc(pref)+'を含む全国の筆ポリゴンは、年度ごとに外部UUIDが変わる設計。NaFT独自の恒久field_idを持ち、変更前後の照合は必ず人が確認します。以下は架空の表示例です。</p></div>'+
 '<div class="gx-detail-grid">'+
 '<article class="gx-data-card"><span class="gx-kicker">恒久圃場ID（合成例）</span><strong>field_id</strong><p>NaFTが証拠と記録の継続先を管理</p></article>'+
 '<article class="gx-data-card"><span class="gx-kicker">2026年版の外部ポリゴン</span><strong>UUID A</strong><p>原本の年度にひも付く観測ID</p></article>'+
 '<article class="gx-data-card"><span class="gx-kicker">2027年版の外部ポリゴン</span><strong>UUID B</strong><p>前年同一の候補でも自動確定しない</p></article>'+
 '<article class="gx-data-card"><span class="gx-kicker">判断ステータス</span><strong>HITL</strong><p>候補 → 根拠の記録 → 人が承認／却下</p></article></div>'+
 '<p class="gx-anomaly"><b>重要：</b>筆ポリゴンUUIDは恒久的な農地識別子ではありません。分割・統合は新しいfield_id間の関係として保存し、写真・記録・水位・原本ハッシュは元のfield_idに保持します。外部の筆ポリゴンは測量済みの筆界、所有権、農地面積、炭素クレジット適格性を証明しません。</p>'+
 '<div class="gx-source-panel"><div><h3>ローカル取込・実装済み</h3><p>2026年版のFlatGeobufはGDALのogr2ogrを使い、GeoJSONSeqへローカル変換して検証可能。GeoJSON/GeoJSONSeqは直接検査。個別座標を公開GitHubに置かず、ソースハッシュと年度別IDだけを管理します。</p></div>'+
 '<div><h3>原本と出典の状態</h3><p>農水省 2026年公開筆ポリゴン：ソースの正式同一性・最新利用条件はローカル取込時に別途確認。WAGRI API接続・土壌ポリゴンとの実空間照合は未実施。</p>'+
 '<p><a href="https://github.com/Takzin1/NaFT/blob/main/docs/p77-field-identity-ja.md" target="_blank" rel="noopener noreferrer">P77の実行手順と検証範囲 ↗</a></p></div></div></section>';
}
