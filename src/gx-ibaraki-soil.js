/* P36: Ibaraki agricultural soil GIS. Historical JCODE/name anomaly retained, never repaired silently. */
'use strict';
var GX_IBARAKI_SOURCE_HASH="af1bbf9d3c12eb51137e9ec8686f1255010eafa2e5424466a8d39b262d11a44f";
var GX_IBARAKI_LANDUSE=[["田",472],["普通畑",504],["牧草地",105],["樹園地",254]];
var GX_IBARAKI_CODE_NAME_PAIRS=[["08201","水戸市",18,20,6,12],["08202","日立市",5,9,3,3],["08203","土浦市",17,18,0,12],["08204","古河市",10,11,2,5],["08205","石岡市",13,15,1,13],["08207","結城市",9,14,5,7],["08208","龍ケ崎市",10,6,1,1],["08210","下妻市",12,13,3,9],["08211","守谷市",1,0,0,0],["08211","常総市",11,9,1,3],["08212","常陸太田市",8,13,6,12],["08214","高萩市",7,8,1,3],["08215","北茨城市",9,9,3,1],["08216","笠間市",14,17,6,15],["08217","取手市",4,5,1,2],["08219","牛久市",6,6,1,3],["08220","つくば市",19,25,2,13],["08221","ひたちなか市",16,15,2,4],["08222","鹿嶋市",6,5,1,1],["08223","潮来市",7,5,2,4],["08224","守谷市",8,5,2,0],["08225","常陸大宮市",11,15,5,10],["08226","那珂市",14,15,2,4],["08227","筑西市",18,19,7,14],["08228","坂東市",12,12,1,6],["08229","稲敷市",10,14,2,5],["08230","かすみがうら市",13,18,1,14],["08231","桜川市",17,22,4,7],["08232","神栖市",6,5,2,2],["08233","行方市",12,12,2,5],["08234","鉾田市",13,14,4,6],["08235","つくばみらい市",11,7,0,1],["08236","小美玉市",13,17,5,9],["08302","茨城町",16,16,2,9],["08309","大洗町",6,2,1,0],["08310","城里町",10,9,5,5],["08341","東海村",10,9,0,4],["08364","大子町",12,13,5,11],["08442","美浦村",8,8,1,2],["08443","阿見町",12,13,1,5],["08447","河内町",7,5,2,1],["08521","八千代町",10,11,3,7],["08542","五霞町",6,8,0,0],["08546","境町",11,8,1,4],["08564","利根町",4,4,0,0]];
function gxIbarakiSoilValidate(){
 if(GX_IBARAKI_CODE_NAME_PAIRS.length!==45||GX_IBARAKI_LANDUSE.length!==4)throw Error('P36_IBARAKI_PAIRS');
 var pairs=new Set(),codes=new Set(),names=new Set(),totals=[0,0,0,0];
 GX_IBARAKI_CODE_NAME_PAIRS.forEach(function(row){
  if(row.length!==6||!/^08[0-9]{3}$/.test(row[0])||typeof row[1]!=='string'||!row[1])throw Error('P36_IBARAKI_CODE');
  var key=row[0]+'|'+row[1];if(pairs.has(key))throw Error('P36_IBARAKI_DUPLICATE_PAIR');
  pairs.add(key);codes.add(row[0]);names.add(row[1]);
  row.slice(2).forEach(function(n,i){if(!Number.isSafeInteger(n)||n<0)throw Error('P36_IBARAKI_COUNT');totals[i]+=n;});
 });
 if(codes.size!==44||names.size!==44)throw Error('P36_IBARAKI_CODE_NAME_COUNTS');
 if(totals.reduce(function(a,b){return a+b;},0)!==1335)throw Error('P36_IBARAKI_TOTAL');
 GX_IBARAKI_LANDUSE.forEach(function(row,i){if(totals[i]!==row[1])throw Error('P36_IBARAKI_LANDUSE_PARITY');});
 var find=function(code,name){return GX_IBARAKI_CODE_NAME_PAIRS.find(function(row){return row[0]===code&&row[1]===name;});};
 var wrong=find('08211','守谷市'),right=find('08224','守谷市'),joso=find('08211','常総市');
 if(!wrong||wrong[2]!==1||wrong.slice(3).some(function(n){return n!==0;})||!right||!joso)throw Error('P36_IBARAKI_ORIGINAL_CODE_CONFLICT');
 return true;
}
function gxIbarakiSoilPanel(prefCode){
 if(prefCode!=='08')return '';
 gxIbarakiSoilValidate();
 var fmt=function(n){return Number(n).toLocaleString('ja-JP');};
 var cards=GX_IBARAKI_LANDUSE.map(function(row){
  return '<article class="gx-data-card"><span class="gx-kicker">地目区分 / Polygon features</span><strong>'+fmt(row[1])+' <small>件</small></strong><p>'+gxEsc(row[0])+'（面積haではありません）</p></article>';
 }).join('');
 var head='<thead><tr><th scope="col">市町村名（原本）</th><th scope="col">JCODE（原本）</th><th scope="col">田</th><th scope="col">普通畑</th><th scope="col">牧草地</th><th scope="col">樹園地</th><th scope="col">合計</th><th scope="col">照合</th></tr></thead>';
 var body=GX_IBARAKI_CODE_NAME_PAIRS.map(function(row){
  var wrong=row[0]==='08211'&&row[1]==='守谷市';
  return '<tr><th scope="row">'+gxEsc(row[1])+'</th><td>'+gxEsc(row[0])+'</td>'+row.slice(2).map(function(n){return '<td>'+fmt(n)+'</td>';}).join('')+'<td>'+fmt(row.slice(2).reduce(function(a,b){return a+b;},0))+'</td><td>'+(wrong?'要照合':'')+'</td></tr>';
 }).join('');
 return '<section class="gx-dashboard" aria-labelledby="gx-ibaraki-soil-title">'+
  '<div class="gx-section-heading"><span class="gx-kicker">IBARAKI SOIL GIS · P36 · SOURCE AUDITED</span>'+
  '<h2 id="gx-ibaraki-soil-title">茨城県の農耕地土壌GISを確認する。</h2>'+
  '<p>元のShapefileはJGD2000の土壌ポリゴン1,335件。44市町村名・44行政コードだが、コードと市名の組合せは45行。土壌群13種類、詳細分類51種類。メタデータ作成日は2017年1月17日。</p></div>'+
  '<p class="gx-anomaly"><b>原本の行政コード不整合（要照合）：</b>JCODE「08211」に「常総市」24件と「守谷市」1件が混在し、守谷市は「08224」にも15件あります。勝手にコードを書き換えず、45組合せをそのまま表示。正規化・市町村別の公式集計・地域データとの結合には原典照合と修正履歴が必要です。</p>'+
  '<div class="gx-detail-grid">'+cards+'</div>'+
  '<details><summary>原本の45コード×市名組合せ（44市町村名）を見る</summary><div class="scroll"><table>'+head+'<tbody>'+body+'</tbody></table></div></details>'+
  '<p class="gx-advisory"><b>来歴・利用制約：</b>出典候補は農研機構「日本土壌インベントリー」の農耕地包括土壌図ですが、配布元ZIPとのバイト単位一致・適用ライセンスは未照合。生のGISは公開GitHubへ複製せず、ハッシュと派生集計のみ登録。ポリゴン件数は面積ha、筆数、CH₄実測、土壌炭素量、正式CO₂e削減量ではありません。元原本作成時点と2024年水稲統計/JAXA土地被覆の整合を確認せず結合しません。'+
  '原本監査台帳：research/p36-ibaraki-soil-shapefile-source-v1.json。検証手順：docs/p36-ibaraki-soil-gis-ja.md。</p></section>';
}
