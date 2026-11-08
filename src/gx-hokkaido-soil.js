/* P29 Hokkaido user-supplied shapefile, 2017 metadata; counts are polygons, not hectares. */
'use strict';
var GX_HOKKAIDO_SOIL_HASH='1b645c6234a6eb1a712246d9d5a8163b02592ab08a14afc01850ab0ded5414e3';
var GX_HOKKAIDO_SOIL_LANDUSE=[
 ['田',1390],['普通畑',2092],['牧草地',1813],['樹園地',182]
];
var GX_HOKKAIDO_SOIL_REGIONS=[
 ['オホーツク総合振興局',66,314,285,11],
 ['上川総合振興局',301,279,171,28],
 ['十勝総合振興局',27,353,320,9],
 ['宗谷総合振興局',0,20,107,0],
 ['後志総合振興局',124,167,105,27],
 ['日高振興局',76,67,105,4],
 ['根室振興局',0,19,46,0],
 ['檜山振興局',91,91,54,8],
 ['渡島総合振興局',91,110,75,10],
 ['留萌振興局',69,71,66,6],
 ['石狩振興局',111,154,114,17],
 ['空知総合振興局',331,257,120,47],
 ['胆振総合振興局',103,142,128,15],
 ['釧路総合振興局',0,48,117,0]
];
function gxHokkaidoSoilValidate(){
 if(GX_HOKKAIDO_SOIL_REGIONS.length!==14||GX_HOKKAIDO_SOIL_LANDUSE.length!==4
 ||GX_HOKKAIDO_SOIL_REGIONS.reduce(function(s,r){return s+r.slice(1).reduce(function(a,b){return a+b;},0);},0)!==5477)throw Error('P29_HOKKAIDO_TOTAL');
 var totals=[0,0,0,0];
 GX_HOKKAIDO_SOIL_REGIONS.forEach(function(r){r.slice(1).forEach(function(n,i){if(!Number.isSafeInteger(n)||n<0)throw Error('P29_HOKKAIDO_INTEGER');totals[i]+=n;});});
 GX_HOKKAIDO_SOIL_LANDUSE.forEach(function(r,i){if(r[1]!==totals[i])throw Error('P29_HOKKAIDO_LANDUSE_PARITY');});
 return true;
}
function gxHokkaidoSoilPanel(prefCode){
 if(prefCode!=='01')return '';
 gxHokkaidoSoilValidate();
 var fmt=function(n){return n.toLocaleString('ja-JP');};
 var cards=GX_HOKKAIDO_SOIL_LANDUSE.map(function(row){
  return '<article class="gx-data-card"><span class="gx-kicker">地目区分 / Polygon features</span><strong>'+fmt(row[1])+' <small>件</small></strong><p>'+gxEsc(row[0])+'（面積ではありません）</p></article>';
 }).join('');
 var header='<thead><tr><th scope="col">振興局</th><th scope="col">田</th><th scope="col">普通畑</th><th scope="col">牧草地</th><th scope="col">樹園地</th><th scope="col">計</th></tr></thead>';
 var rows=GX_HOKKAIDO_SOIL_REGIONS.map(function(row){
  return '<tr><th scope="row">'+gxEsc(row[0])+'</th>'+
   row.slice(1).map(function(n){return '<td>'+fmt(n)+'</td>';}).join('')+
   '<td>'+fmt(row.slice(1).reduce(function(a,b){return a+b;},0))+'</td></tr>';
 }).join('');
 return '<section class="gx-dashboard" aria-labelledby="gx-hokkaido-soil-title">'+
 '<div class="gx-section-heading"><span class="gx-kicker">HOKKAIDO SOIL GIS · P29 · SOURCE AUDITED</span>'+
 '<h2 id="gx-hokkaido-soil-title">北海道の農地土壌GISを確認する。</h2>'+
 '<p>ユーザー提供の北海道Shapefileから5,477ポリゴン、186市町村、14振興局、地目4分類を原バイト照合して集計。座標系はJGD2000、GISメタデータ作成日は2017-01-17。現況の2026年統計とは断定しません。</p></div>'+
 '<div class="gx-detail-grid">'+cards+'</div>'+
 '<details><summary>14振興局別の地目レコード数を見る</summary><div class="scroll"><table>'+header+'<tbody>'+rows+'</tbody></table></div></details>'+
 '<p class="gx-advisory"><b>出典と利用上の制約：</b>地目別の数字はポリゴンの件数であり、農地面積ha、土壌炭素量、CH₄実測、排出係数ではありません。県土壌図を2024年の収穫統計やJAXA土地被覆と無検証で結合しません。元Shapefileの公開者・再配布ライセンスを独立確認できていないため、元データの公開複製は行っていません。'+
 ' 原本ハッシュ・出典台帳：research/p29-hokkaido-soil-shapefile-source-v1.json。取り込み検証記録：docs/p29-hokkaido-soil-gis-intake-ja.md。</p></section>';
}
