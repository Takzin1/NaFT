/* P33: user-provided Yamagata soil GIS, original bytes audited. Counts are polygons, not ha. */
'use strict';
var GX_YAMAGATA_SOURCE_HASH="ec2890ef0329b30054159a8a85ba731027d13f952f5ec1c849c36a38d4ec7e2c";
var GX_YAMAGATA_LANDUSE=[["田",618],["普通畑",500],["牧草地",138],["樹園地",395]];
var GX_YAMAGATA_MUNICIPALITIES=[["06201","山形市",31,27,3,28],["06202","米沢市",19,14,3,14],["06203","鶴岡市",37,34,8,29],["06204","酒田市",32,29,6,19],["06205","新庄市",24,18,8,10],["06206","寒河江市",14,13,1,16],["06207","上山市",20,18,6,15],["06208","村山市",25,24,2,20],["06209","長井市",20,13,6,12],["06210","天童市",14,12,3,15],["06211","東根市",18,13,3,18],["06212","尾花沢市",21,18,0,7],["06213","南陽市",15,18,5,17],["06301","山辺町",17,12,3,12],["06302","中山町",9,9,0,13],["06321","河北町",16,8,1,10],["06322","西川町",15,7,1,9],["06323","朝日町",22,15,3,17],["06324","大江町",12,14,1,16],["06341","大石田町",16,16,2,11],["06361","金山町",10,7,3,3],["06362","最上町",17,12,7,6],["06363","舟形町",18,12,3,5],["06364","真室川町",12,9,2,6],["06365","大蔵村",17,14,6,3],["06366","鮭川村",14,9,3,2],["06367","戸沢村",15,5,3,2],["06381","高畠町",19,17,11,17],["06382","川西町",14,13,7,8],["06401","小国町",14,14,12,4],["06402","白鷹町",17,19,7,16],["06403","飯豊町",12,10,5,0],["06426","三川町",9,5,0,1],["06428","庄内町",19,15,2,6],["06461","遊佐町",14,7,2,8]];
function gxYamagataSoilValidate(){
 if(GX_YAMAGATA_MUNICIPALITIES.length!==35 || GX_YAMAGATA_LANDUSE.length!==4)throw Error('P33_YAMAGATA_MUNICIPALITIES');
 var codes=new Set(),totals=[0,0,0,0];
 GX_YAMAGATA_MUNICIPALITIES.forEach(function(row){
  if(row.length!==6 || !/^06[0-9]{3}$/.test(row[0]) || codes.has(row[0]) || typeof row[1]!=='string' || !row[1])throw Error('P33_YAMAGATA_CODE');
  codes.add(row[0]);
  row.slice(2).forEach(function(n,i){if(!Number.isSafeInteger(n)||n<0)throw Error('P33_YAMAGATA_COUNT');totals[i]+=n;});
 });
 if(totals.reduce(function(a,b){return a+b;},0)!==1651)throw Error('P33_YAMAGATA_TOTAL');
 GX_YAMAGATA_LANDUSE.forEach(function(row,i){if(totals[i]!==row[1])throw Error('P33_YAMAGATA_LANDUSE_PARITY');});
 return true;
}
function gxYamagataSoilPanel(prefCode){
 if(prefCode!=='06')return '';
 gxYamagataSoilValidate();
 var fmt=function(n){return Number(n).toLocaleString('ja-JP');};
 var cards=GX_YAMAGATA_LANDUSE.map(function(row){
  return '<article class="gx-data-card"><span class="gx-kicker">地目区分 / Polygon features</span><strong>'+fmt(row[1])+' <small>件</small></strong><p>'+gxEsc(row[0])+'（面積haではありません）</p></article>';
 }).join('');
 var head='<thead><tr><th scope="col">市町村名（原本）</th><th scope="col">JCODE</th><th scope="col">田</th><th scope="col">普通畑</th><th scope="col">牧草地</th><th scope="col">樹園地</th><th scope="col">計</th></tr></thead>';
 var rows=GX_YAMAGATA_MUNICIPALITIES.map(function(row){
  return '<tr><th scope="row">'+gxEsc(row[1])+'</th><td>'+gxEsc(row[0])+'</td>'+row.slice(2).map(function(n){return '<td>'+fmt(n)+'</td>';}).join('')+'<td>'+fmt(row.slice(2).reduce(function(a,b){return a+b;},0))+'</td></tr>';
 }).join('');
 return '<section class="gx-dashboard" aria-labelledby="gx-yamagata-soil-title">'+
  '<div class="gx-section-heading"><span class="gx-kicker">YAMAGATA SOIL GIS · P33 · SOURCE AUDITED</span>'+
  '<h2 id="gx-yamagata-soil-title">山形県の農耕地土壌GISを確認する。</h2>'+
  '<p>提供元ZIPからJGD2000のポリゴン1,651件を受入検証。35市町村別の地目区分と、土壌群18種類・詳細分類93種類を整理。原本メタデータの作成日は2017年1月17日で、最新の農地現況を保証しません。</p></div>'+
  '<div class="gx-detail-grid">'+cards+'</div>'+
  '<details><summary>35市町村別の地目レコード数を見る</summary><div class="scroll"><table>'+head+'<tbody>'+rows+'</tbody></table></div></details>'+
  '<p class="gx-advisory"><b>来歴と科学的境界：</b>件数は土壌ポリゴンの数であり、農地面積ha、筆数、土壌炭素量、CH₄実測値、CO₂e削減量ではありません。元Shapefileの配布元と再配布ライセンスは独立確認できていないため原形状は公開GitHubに複製せず、ハッシュと派生集計のみ登録しています。2024年水稲統計・JAXA土地被覆との自動結合、クレジット発行・認証はしません。'+
  '原本ハッシュ・監査台帳：research/p33-yamagata-soil-shapefile-source-v1.json。検証手順：docs/p33-yamagata-soil-gis-ja.md。</p></section>';
}
