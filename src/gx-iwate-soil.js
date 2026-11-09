/* P31: original user-provided 2017 Iwate agricultural soil GIS; feature counts, not ha. */
'use strict';
var GX_IWATE_SOURCE_HASH="65e6493313866af25ee5695ef2e1882c4bf9f5cbd12a798c2fb394027d1315ff";
var GX_IWATE_LANDUSE=[["田",726],["普通畑",641],["牧草地",415],["樹園地",367]];
var GX_IWATE_MUNICIPALITIES=[["03201","盛岡市",47,43,22,34],["03202","宮古市",36,30,16,11],["03203","大船渡市",23,19,17,12],["03205","花巻市",53,45,29,42],["03206","北上市",34,29,9,14],["03207","久慈市",26,23,18,7],["03208","遠野市",38,32,29,15],["03209","一関市",47,41,39,36],["03210","陸前高田市",18,17,10,7],["03211","釜石市",14,13,6,7],["03213","二戸市",23,23,7,11],["03214","八幡平市",20,19,14,10],["03215","奥州市",34,28,25,24],["03301","雫石町",27,23,23,5],["03302","葛巻町",14,13,12,6],["03303","岩手町",17,15,11,8],["03305","滝沢村",13,13,7,7],["03321","紫波町",34,29,17,27],["03322","矢巾町",35,20,4,20],["03366","西和賀町",12,13,8,1],["03381","金ヶ崎町",13,9,5,9],["03402","平泉町",16,9,3,5],["03441","住田町",13,13,4,5],["03461","大槌町",9,10,3,1],["03482","山田町",14,11,7,5],["03483","岩泉町",17,16,12,6],["03484","田野畑村",6,8,6,2],["03485","普代村",2,5,5,0],["03501","軽米町",18,17,13,10],["03503","野田村",7,11,4,2],["03506","九戸村",13,11,10,5],["03507","洋野町",16,16,13,5],["03524","一戸町",17,17,7,8]];
function gxIwateSoilValidate(){
 if(GX_IWATE_MUNICIPALITIES.length!==33 || GX_IWATE_LANDUSE.length!==4)throw Error('P31_IWATE_MUNICIPALITIES');
 var codes=new Set(),totals=[0,0,0,0];
 GX_IWATE_MUNICIPALITIES.forEach(function(row){
  if(row.length!==6 || !/^03[0-9]{3}$/.test(row[0]) || codes.has(row[0]) || typeof row[1]!=='string')throw Error('P31_IWATE_CODE');
  codes.add(row[0]);
  row.slice(2).forEach(function(x,i){if(!Number.isSafeInteger(x)||x<0)throw Error('P31_IWATE_COUNT');totals[i]+=x;});
 });
 if(totals.reduce(function(a,b){return a+b;},0)!==2149)throw Error('P31_IWATE_TOTAL');
 GX_IWATE_LANDUSE.forEach(function(row,i){if(totals[i]!==row[1])throw Error('P31_IWATE_LANDUSE_PARITY');});
 if(!GX_IWATE_MUNICIPALITIES.some(function(row){return row[0]==='03305'&&row[1]==='滝沢村';}))throw Error('P31_IWATE_HISTORIC_NAME');
 return true;
}
function gxIwateSoilPanel(prefCode){
 if(prefCode!=='03')return '';
 gxIwateSoilValidate();
 var fmt=function(n){return Number(n).toLocaleString('ja-JP');};
 var cards=GX_IWATE_LANDUSE.map(function(row){return '<article class="gx-data-card"><span class="gx-kicker">地目区分 / Polygon features</span><strong>'+fmt(row[1])+' <small>件</small></strong><p>'+gxEsc(row[0])+'（面積haではありません）</p></article>';}).join('');
 var heading='<thead><tr><th scope="col">市町村</th><th scope="col">JCODE</th><th scope="col">田</th><th scope="col">普通畑</th><th scope="col">牧草地</th><th scope="col">樹園地</th><th scope="col">合計</th></tr></thead>';
 var lines=GX_IWATE_MUNICIPALITIES.map(function(row){return '<tr><th scope="row">'+gxEsc(row[1])+'</th><td>'+gxEsc(row[0])+'</td>'+row.slice(2).map(function(n){return '<td>'+fmt(n)+'</td>';}).join('')+'<td>'+fmt(row.slice(2).reduce(function(a,b){return a+b;},0))+'</td></tr>';}).join('');
 return '<section class="gx-dashboard" aria-labelledby="gx-iwate-soil-title"><div class="gx-section-heading">'+
  '<span class="gx-kicker">IWATE SOIL GIS · P31 · SOURCE AUDITED</span>'+
  '<h2 id="gx-iwate-soil-title">岩手県の農耕地土壌GISを確認する。</h2>'+
  '<p>ユーザー提供のShapefile原本を検査し、2,149ポリゴン、33市町村、4つの地目区分を整理。座標系はJGD2000。Esriメタデータ作成日は2017年1月17日で、2026年の農地現況ではありません。原本には旧自治体名「滝沢村」が含まれ、現行市町村名への自動置換はしていません。</p></div>'+
  '<div class="gx-detail-grid">'+cards+'</div>'+
  '<details><summary>33市町村別の地目レコード数を見る</summary><div class="scroll"><table>'+heading+'<tbody>'+lines+'</tbody></table></div></details>'+
  '<p class="gx-advisory"><b>原本・研究利用の境界：</b>これは土壌分類を持つポリゴンの件数であり、面積ha、土壌炭素蓄積量、CH₄実測、排出削減量ではありません。'+
  '原GISの公開者・再配布許諾は未検証のため原Shapefileは公開リポジトリへ複製していません。2024年の稲作統計やJAXA土地被覆と自動結合せず、クレジット認証への昇格もしません。'+
  '原本ハッシュ・監査台帳：research/p30-iwate-soil-shapefile-source-v1.json。検証手順：docs/p30-iwate-soil-gis-ja.md。</p></section>';
}
