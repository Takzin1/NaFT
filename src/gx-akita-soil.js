/* P34: Akita agricultural soil GIS, original ZIP audited; polygon feature counts only. */
'use strict';
var GX_AKITA_SOURCE_HASH="3c5b27c3d7da16265add6de7958e10d0cd7cee286d7de093d8f3df760621fa34";
var GX_AKITA_LANDUSE=[["田",432],["普通畑",342],["牧草地",113],["樹園地",159]];
var GX_AKITA_MUNICIPALITIES=[["05201","秋田市",29,26,6,10],["05202","能代市",32,25,5,5],["05203","横手市",29,28,8,23],["05204","大館市",21,21,5,10],["05206","男鹿市",15,12,5,4],["05207","湯沢市",24,16,3,20],["05209","鹿角市",10,11,6,8],["05210","由利本荘市",29,25,14,7],["05211","潟上市",9,3,0,2],["05212","大仙市",35,30,18,16],["05213","北秋田市",11,12,5,6],["05214","にかほ市",19,13,4,3],["05215","仙北市",34,21,12,5],["05303","小坂町",7,5,1,2],["05327","上小阿仁村",5,7,2,1],["05346","藤里町",12,9,0,3],["05348","三種町",15,13,6,5],["05349","八峰町",18,13,0,3],["05361","五城目町",10,8,0,3],["05363","八郎潟町",6,2,0,1],["05366","井川町",9,4,2,2],["05368","大潟村",9,3,1,1],["05434","美郷町",21,13,5,9],["05463","羽後町",14,16,3,9],["05464","東成瀬村",9,6,2,1]];
function gxAkitaSoilValidate(){
 if(GX_AKITA_MUNICIPALITIES.length!==25 || GX_AKITA_LANDUSE.length!==4)throw Error('P34_AKITA_MUNICIPALITIES');
 var codes=new Set(),totals=[0,0,0,0];
 GX_AKITA_MUNICIPALITIES.forEach(function(row){
  if(row.length!==6 || !/^05[0-9]{3}$/.test(row[0]) || codes.has(row[0]) || typeof row[1]!=='string' || !row[1])throw Error('P34_AKITA_CODE');
  codes.add(row[0]);
  row.slice(2).forEach(function(n,i){if(!Number.isSafeInteger(n)||n<0)throw Error('P34_AKITA_COUNT');totals[i]+=n;});
 });
 if(totals.reduce(function(a,b){return a+b;},0)!==1046)throw Error('P34_AKITA_TOTAL');
 GX_AKITA_LANDUSE.forEach(function(row,i){if(totals[i]!==row[1])throw Error('P34_AKITA_LANDUSE_PARITY');});
 return true;
}
function gxAkitaSoilPanel(prefCode){
 if(prefCode!=='05')return '';
 gxAkitaSoilValidate();
 var fmt=function(n){return Number(n).toLocaleString('ja-JP');};
 var cards=GX_AKITA_LANDUSE.map(function(row){
  return '<article class="gx-data-card"><span class="gx-kicker">地目区分 / Polygon features</span><strong>'+fmt(row[1])+' <small>件</small></strong><p>'+gxEsc(row[0])+'（面積haではありません）</p></article>';
 }).join('');
 var head='<thead><tr><th scope="col">市町村名（原本）</th><th scope="col">JCODE</th><th scope="col">田</th><th scope="col">普通畑</th><th scope="col">牧草地</th><th scope="col">樹園地</th><th scope="col">計</th></tr></thead>';
 var rows=GX_AKITA_MUNICIPALITIES.map(function(row){
  return '<tr><th scope="row">'+gxEsc(row[1])+'</th><td>'+gxEsc(row[0])+'</td>'+row.slice(2).map(function(n){return '<td>'+fmt(n)+'</td>';}).join('')+'<td>'+fmt(row.slice(2).reduce(function(a,b){return a+b;},0))+'</td></tr>';
 }).join('');
 return '<section class="gx-dashboard" aria-labelledby="gx-akita-soil-title">'+
  '<div class="gx-section-heading"><span class="gx-kicker">AKITA SOIL GIS · P34 · SOURCE AUDITED</span>'+
  '<h2 id="gx-akita-soil-title">秋田県の農耕地土壌GISを確認する。</h2>'+
  '<p>提供元ZIPからJGD2000の土壌ポリゴン1,046件を照合。25市町村別の地目区分と、土壌群17種類・詳細分類79種類を整理。原本Esriメタデータ作成日は2017年1月17日で、現行の地目・農地面積を意味しません。</p></div>'+
  '<div class="gx-detail-grid">'+cards+'</div>'+
  '<details><summary>25市町村別の地目レコード数を見る</summary><div class="scroll"><table>'+head+'<tbody>'+rows+'</tbody></table></div></details>'+
  '<p class="gx-advisory"><b>来歴と科学的境界：</b>数字は土壌ポリゴンの件数であり、農地面積ha、筆数、土壌炭素量、CH₄実測値、CO₂e削減量ではありません。原Shapefileの配布元と再配布ライセンスは独立確認できていないため、生データは公開GitHubへ複製せず、原本ハッシュと派生集計のみ登録しています。2024年水稲統計・JAXA土地被覆との自動結合、クレジット認証・発行はしません。'+
  '原本ハッシュ・監査台帳：research/p34-akita-soil-shapefile-source-v1.json。検証手順：docs/p34-akita-soil-gis-ja.md。</p></section>';
}
