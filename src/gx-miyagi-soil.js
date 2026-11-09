/* P32: Miyagi agricultural soil GIS, source-verified polygon counts (not area). */
'use strict';
var GX_MIYAGI_SOURCE_HASH="d6f9d7f637ae210d269c806aafcea6b9498c9cc3ff37068db4ae012bc6606c4f";
var GX_MIYAGI_LANDUSE=[["田",625],["普通畑",551],["牧草地",216],["樹園地",196]];
var GX_MIYAGI_ADMIN_UNITS=[["04101","青葉区",22,13,1,4],["04102","宮城野区",9,3,0,0],["04103","若林区",9,6,0,0],["04104","太白区",31,24,7,5],["04105","泉区",16,10,5,2],["04202","石巻市",28,31,11,8],["04203","塩竃市",4,5,1,1],["04205","気仙沼市",20,25,8,9],["04206","白石市",20,19,8,9],["04207","名取市",18,19,4,6],["04208","角田市",14,16,3,9],["04209","多賀城市",13,6,0,0],["04211","岩沼市",14,13,0,5],["04212","登米市",31,29,16,22],["04213","栗原市",37,35,26,13],["04214","東松島市",15,14,4,5],["04215","大崎市",43,40,25,8],["04301","蔵王町",15,19,6,15],["04302","七ケ宿町",12,9,8,2],["04321","大河原町",7,7,3,4],["04322","村田町",11,11,7,5],["04323","柴田町",8,6,1,3],["04324","川崎町",19,21,9,4],["04341","丸森町",17,15,7,12],["04361","亘理町",15,15,2,10],["04362","山元町",14,15,5,11],["04401","松島町",11,9,1,1],["04404","七ケ浜町",3,4,0,0],["04406","利府町",9,9,1,5],["04421","大和町",14,9,5,1],["04422","大郷町",11,13,2,0],["04423","富谷町",6,6,1,2],["04424","大衡村",10,3,2,1],["04444","色麻町",19,14,10,1],["04445","加美町",30,18,8,1],["04501","涌谷町",14,10,5,1],["04505","美里町",15,10,6,3],["04581","女川町",4,4,0,1],["04606","南三陸町",17,16,8,7]];
function gxMiyagiSoilValidate(){
 if(GX_MIYAGI_ADMIN_UNITS.length!==39 || GX_MIYAGI_LANDUSE.length!==4)throw Error('P32_MIYAGI_ADMIN_UNITS');
 var seen=new Set(),sums=[0,0,0,0],wards=0;
 GX_MIYAGI_ADMIN_UNITS.forEach(function(row){
  if(row.length!==6 || !/^04[0-9]{3}$/.test(row[0]) || typeof row[1]!=='string' || !row[1] || seen.has(row[0]))throw Error('P32_MIYAGI_CODE');
  seen.add(row[0]);if(row[0].indexOf('0410')===0)wards++;
  row.slice(2).forEach(function(v,i){if(!Number.isSafeInteger(v)||v<0)throw Error('P32_MIYAGI_COUNT');sums[i]+=v;});
 });
 if(wards!==5 || !GX_MIYAGI_ADMIN_UNITS.some(function(row){return row[0]==='04423'&&row[1]==='富谷町';}))throw Error('P32_MIYAGI_WARDS_OR_HISTORIC');
 if(sums.reduce(function(a,b){return a+b;},0)!==1588)throw Error('P32_MIYAGI_TOTAL');
 GX_MIYAGI_LANDUSE.forEach(function(row,i){if(sums[i]!==row[1])throw Error('P32_MIYAGI_LANDUSE_PARITY');});
 return true;
}
function gxMiyagiSoilPanel(prefCode){
 if(prefCode!=='04')return '';
 gxMiyagiSoilValidate();
 var fmt=function(n){return Number(n).toLocaleString('ja-JP');};
 var cards=GX_MIYAGI_LANDUSE.map(function(row){return '<article class="gx-data-card"><span class="gx-kicker">地目区分 / Polygon features</span><strong>'+fmt(row[1])+' <small>件</small></strong><p>'+gxEsc(row[0])+'（面積haではありません）</p></article>';}).join('');
 var header='<thead><tr><th scope="col">原本の行政区分</th><th scope="col">JCODE</th><th scope="col">田</th><th scope="col">普通畑</th><th scope="col">牧草地</th><th scope="col">樹園地</th><th scope="col">計</th></tr></thead>';
 var rows=GX_MIYAGI_ADMIN_UNITS.map(function(row){
  return '<tr><th scope="row">'+gxEsc(row[1])+'</th><td>'+gxEsc(row[0])+'</td>'+row.slice(2).map(function(n){return '<td>'+fmt(n)+'</td>';}).join('')+'<td>'+fmt(row.slice(2).reduce(function(a,b){return a+b;},0))+'</td></tr>';
 }).join('');
 return '<section class="gx-dashboard" aria-labelledby="gx-miyagi-soil-title"><div class="gx-section-heading">'+
 '<span class="gx-kicker">MIYAGI SOIL GIS · P32 · SOURCE AUDITED</span>'+
 '<h2 id="gx-miyagi-soil-title">宮城県の農耕地土壌GISを確認する。</h2>'+
 '<p>ユーザー提供Shapefileの1,588ポリゴン、JGD2000、39行政区分コードを照合。39区分には仙台市の5区が含まれるため「39市町村」ではなく、原本コード別の研究用集計です。土壌群16種・詳細分類96種。</p></div>'+
 '<div class="gx-detail-grid">'+cards+'</div>'+
 '<details><summary>39行政区分（仙台市5区を含む）の地目件数を確認</summary><div class="scroll"><table>'+header+'<tbody>'+rows+'</tbody></table></div></details>'+
 '<p class="gx-advisory"><b>歴史的データと利用境界：</b>Esriメタデータ作成日は2017年1月17日。原本には旧称「富谷町」があり、名称と現況の一致を保証しません。ポリゴン数は面積ha、土壌炭素蓄積量、CH₄実測値、排出削減量ではありません。原本の配布元と再配布権限は独立確認できていないため、Shapefileは公開GitHubに複製せず、ハッシュと派生集計のみ登録。JAXA土地被覆や2024年の稲作統計との自動結合・クレジット認証は行いません。原本ハッシュ・監査台帳：research/p32-miyagi-soil-shapefile-source-v1.json。検証手順：docs/p32-miyagi-soil-gis-ja.md。</p></section>';
}
