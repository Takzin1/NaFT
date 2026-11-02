/* P14: source-bound research dashboard for genuine 2022-24 Gimje CH4 files.
 * These are original-user-file verified research observation counts, NOT 8,391
 * valid flux measurements. Raw laboratory tables, exact field coordinates,
 * derived certification or unpublished instrument QC are NOT distributed.
 */
'use strict';
var GX_GIMJE_REAL_SOURCE_P14={
  sourceDoi:'10.5281/zenodo.17111992',
  archiveSha256:'719b148d1a4f08e31bc146f412c920ae1472ca1a3a4d6dd81d882c1ef79fe813',
  metadataSha256:'6c609759ab25bc84cb909830800be4bac086e42a51ac43a11c4367a9c52b1298',
  canonicalSha256:'132e1cc623df49e3bae8dc57289037dcc6b218954773e450df50e65f65c4b140',
  rows:8391,observed:1422,missing:6969,negative:31,fieldCount:60,
  stage:{flooding:5895,drainage:2019,awd:477},
  years:[
   {year:2022,fields:18,rows:2502,observed:576,missing:1926,negative:19},
   {year:2023,fields:15,rows:2055,observed:330,missing:1725,negative:0},
   {year:2024,fields:27,rows:3834,observed:516,missing:3318,negative:12}
  ],
  treatments:[
   ['cf',21,438],['md_14days',9,222],['md_14days+awd',9,222],
   ['md_21days',9,222],['md_21days+awd',6,126],
   ['md_28days',3,96],['md_28days+awd',3,96]
  ]
};
function gxGimjeRealSourcePanel(){
  var g=GX_GIMJE_REAL_SOURCE_P14;
  var n=function(x){return x.toLocaleString('ja-JP');};
  var years=g.years.map(function(y){
    return '<article class="gx-data-card"><span class="gx-kicker">ORIGINAL DATA / '+y.year+'</span>'+
      '<strong>'+n(y.observed)+' <small>実測値あり</small></strong>'+
      '<p>'+y.fields+'圃場、'+n(y.rows)+'日別行、欠測'+n(y.missing)+'件、負の値'+y.negative+'件</p></article>';
  }).join('');
  var treatments=g.treatments.map(function(t){
    return '<tr><th scope="row">'+gxEsc(t[0])+'</th><td>'+t[1]+'</td><td>'+n(t[2])+'</td></tr>';
  }).join('');
  return '<section class="gx-dashboard" aria-labelledby="gx-gimje-source-title">'+
   '<div class="gx-section-heading"><span class="gx-kicker">05 / REPLAYED ORIGINAL RESEARCH OBSERVATIONS · P14</span>'+
   '<h2 id="gx-gimje-source-title">韓国Gimje水田CH₄：公開原本の照合とデータ接続</h2>'+
   '<p>ユーザー提供のZIPを解凍し、60のCSVと60圃場のExcel属性をIDで結合。両原本はZenodo配布MD5と一致。独立研究用の静的監査結果です。</p></div>'+
   '<div class="gx-detail-grid"><article class="gx-data-card"><span class="gx-kicker">圃場CSV / original</span><strong>'+g.fieldCount+
   ' <small>files</small></strong><p>2022–2024。原本を再配布せず、SHA-256で版を固定。</p></article>'+
   '<article class="gx-data-card"><span class="gx-kicker">CH₄ fluxが記録された行</span><strong>'+n(g.observed)+
   ' <small>/ '+n(g.rows)+' 行</small></strong><p>残り'+n(g.missing)+'行は欠測として保持。日別行数を実測フラックス数と誤認しません。</p></article>'+
   '<article class="gx-data-card"><span class="gx-kicker">レビュー要：負のフラックス</span><strong>'+n(g.negative)+
   ' <small>件</small></strong><p>無条件に0へ補正・除外しない。測定法とQCの独立検証待ち。</p></article></div>'+
   '<div class="gx-detail-grid">'+years+'</div>'+
   '<p class="gx-advisory">日別の原本 <code>course_type</code>：flooding '+n(g.stage.flooding)+
   ' / drainage '+n(g.stage.drainage)+' / awd '+n(g.stage.awd)+
   ' 行。これは圃場の処理群（Excel <code>water_management</code>）と別の変数です。</p>'+
   '<details><summary>圃場の処理区分と原データの位置づけを見る</summary>'+
   '<div class="scroll"><table><thead><tr><th>元Excelの処理区分</th><th>圃場数</th><th>フラックス値あり</th></tr></thead>'+
   '<tbody>'+treatments+'</tbody></table></div>'+
   '<p class="gx-advisory">CH₄単位は原著申告のg CH₄/m²/day。日別の空欄は補間せず、実測QC判定はUNKNOWN。'+
   ' 期間積分、削減率、J-クレジット認証値は算出しません。</p></details>'+
   '<p class="gx-advisory"><b>Source integrity ≠ scientific validation.</b> '+
   'original ZIP SHA-256: <code>'+g.archiveSha256.slice(0,16)+'…</code> / '+
   'P7 canonical SHA-256: <code>'+g.canonicalSha256.slice(0,16)+'…</code>。'+
   ' <a href="https://zenodo.org/records/17111992" target="_blank" rel="noopener noreferrer">Zenodo原典</a> · '+
   '<a href="https://github.com/Takzin1/NaFT/blob/main/docs/p14-gimje-original-real-zip-intake-ja-2026-11-03.md" target="_blank" rel="noopener noreferrer">取込仕様と制限</a></p></section>';
}
