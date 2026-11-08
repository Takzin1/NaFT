/* P30: original user-provided 2017 Aomori agricultural soil GIS; feature counts, not ha. */
'use strict';
var GX_AOMORI_SOURCE_HASH="8fc34f2d1dfa18569c4411f36c6fc6dac5400fa63763734b4efc18af7484d321";
var GX_AOMORI_LANDUSE=[["田",457],["普通畑",394],["牧草地",180],["樹園地",280]];
var GX_AOMORI_MUNICIPALITIES=[["02201","青森市",23,19,12,19],["02202","弘前市",22,15,2,24],["02203","八戸市",20,16,8,11],["02204","黒石市",15,4,1,14],["02205","五所川原市",24,21,3,18],["02206","十和田市",18,17,10,12],["02207","三沢市",7,6,2,1],["02208","むつ市",10,14,11,6],["02209","つがる市",17,16,4,12],["02210","平川市",18,17,1,20],["02301","平内町",6,6,3,1],["02303","今別町",7,6,3,2],["02304","蓬田村",6,6,1,0],["02307","外ヶ浜町",9,9,4,2],["02321","鰺ヶ沢町",15,10,3,9],["02323","深浦町",8,7,6,3],["02343","西目屋村",5,3,1,5],["02361","藤崎町",10,7,0,11],["02362","大鰐町",10,7,0,13],["02367","田舎館村",10,5,0,8],["02381","板柳町",11,9,0,13],["02384","鶴田町",11,9,0,10],["02387","中泊町",11,10,3,2],["02401","野辺地町",8,6,6,1],["02402","七戸町",15,15,9,6],["02405","六戸町",10,9,4,2],["02406","横浜町",9,8,7,1],["02408","東北町",14,14,9,2],["02411","六ケ所村",6,7,4,0],["02412","おいらせ町",11,10,5,2],["02423","大間町",4,3,6,0],["02424","東通村",6,9,9,2],["02425","風間浦村",2,2,0,0],["02426","佐井村",4,4,4,0],["02441","三戸町",17,15,10,12],["02442","五戸町",15,16,7,11],["02443","田子町",9,9,5,6],["02445","南部町",16,14,4,13],["02446","階上町",11,8,8,4],["02450","新郷村",7,6,5,2]];
function gxAomoriSoilValidate(){
 if(GX_AOMORI_MUNICIPALITIES.length!==40 || GX_AOMORI_LANDUSE.length!==4)throw Error('P30_AOMORI_MUNICIPALITIES');
 var codes=new Set(),totals=[0,0,0,0];
 GX_AOMORI_MUNICIPALITIES.forEach(function(row){
  if(row.length!==6 || !/^02[0-9]{3}$/.test(row[0]) || codes.has(row[0]) || typeof row[1]!=='string')throw Error('P30_AOMORI_CODE');
  codes.add(row[0]);
  row.slice(2).forEach(function(x,i){if(!Number.isSafeInteger(x)||x<0)throw Error('P30_AOMORI_COUNT');totals[i]+=x;});
 });
 if(totals.reduce(function(a,b){return a+b;},0)!==1311)throw Error('P30_AOMORI_TOTAL');
 GX_AOMORI_LANDUSE.forEach(function(row,i){if(totals[i]!==row[1])throw Error('P30_AOMORI_LANDUSE_PARITY');});
 return true;
}
function gxAomoriSoilPanel(prefCode){
 if(prefCode!=='02')return '';
 gxAomoriSoilValidate();
 var fmt=function(n){return Number(n).toLocaleString('ja-JP');};
 var cards=GX_AOMORI_LANDUSE.map(function(row){return '<article class="gx-data-card"><span class="gx-kicker">地目区分 / Polygon features</span><strong>'+fmt(row[1])+' <small>件</small></strong><p>'+gxEsc(row[0])+'（面積haではありません）</p></article>';}).join('');
 var heading='<thead><tr><th scope="col">市町村</th><th scope="col">JCODE</th><th scope="col">田</th><th scope="col">普通畑</th><th scope="col">牧草地</th><th scope="col">樹園地</th><th scope="col">合計</th></tr></thead>';
 var lines=GX_AOMORI_MUNICIPALITIES.map(function(row){return '<tr><th scope="row">'+gxEsc(row[1])+'</th><td>'+gxEsc(row[0])+'</td>'+row.slice(2).map(function(n){return '<td>'+fmt(n)+'</td>';}).join('')+'<td>'+fmt(row.slice(2).reduce(function(a,b){return a+b;},0))+'</td></tr>';}).join('');
 return '<section class="gx-dashboard" aria-labelledby="gx-aomori-soil-title"><div class="gx-section-heading">'+
  '<span class="gx-kicker">AOMORI SOIL GIS · P30 · SOURCE AUDITED</span>'+
  '<h2 id="gx-aomori-soil-title">青森県の農耕地土壌GISを確認する。</h2>'+
  '<p>ユーザー提供のShapefile原本を検査し、1,311ポリゴン、40市町村、4つの地目区分を整理。座標系はJGD2000。Esriメタデータ作成日は2017年1月17日で、2026年の農地現況ではありません。</p></div>'+
  '<div class="gx-detail-grid">'+cards+'</div>'+
  '<details><summary>40市町村別の地目レコード数を見る</summary><div class="scroll"><table>'+heading+'<tbody>'+lines+'</tbody></table></div></details>'+
  '<p class="gx-advisory"><b>原本・研究利用の境界：</b>これは土壌分類を持つポリゴンの件数であり、面積ha、土壌炭素蓄積量、CH₄実測、排出削減量ではありません。'+
  '原GISの公開者・再配布許諾は未検証のため原Shapefileは公開リポジトリへ複製していません。2024年の稲作統計やJAXA土地被覆と自動結合せず、クレジット認証への昇格もしません。'+
  '原本ハッシュ・監査台帳：research/p30-aomori-soil-shapefile-source-v1.json。検証手順：docs/p30-aomori-soil-gis-ja.md。</p></section>';
}
