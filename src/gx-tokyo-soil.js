/* P40: Tokyo agricultural soil GIS; original ZIP verified. City codes and island subprefectures remain separate. */
'use strict';
var GX_TOKYO_SOURCE_HASH="b4dcede3f7664f4366d7d6ab5ead2c06314602c8c9d691a946d90984af3d9c1e";
var GX_TOKYO_LANDUSE=[["田",48],["普通畑",248],["牧草地",5],["樹園地",171]];
var GX_TOKYO_CODE_NAME_PAIRS=[["11209","青梅市",0,2,0,0],["11225","瑞穂町",0,2,0,1],["11225","青梅市",0,0,0,3],["11229","板橋区",0,1,0,0],["11229","練馬区",0,1,0,1],["11230","東久留米市",0,1,0,0],["11230","清瀬市",0,2,0,0],["11230","練馬区",0,1,0,0],["13110","目黒区",0,1,0,0],["13111","大田区",0,1,0,0],["13112","三鷹市",0,1,0,0],["13112","世田谷区",0,9,0,0],["13112","杉並区",0,1,0,0],["13112","狛江市",0,1,0,0],["13112","調布市",0,1,0,0],["13114","中野区",0,1,0,0],["13114","練馬区",0,1,0,0],["13115","三鷹市",0,1,0,0],["13115","杉並区",0,2,0,1],["13119","板橋区",0,3,0,1],["13120","武蔵野市",0,1,0,0],["13120","練馬区",0,3,0,4],["13120","西東京市",0,3,0,0],["13201","八王子市",5,13,0,13],["13201","多摩市",0,1,0,1],["13201","日野市",0,2,0,0],["13201","町田市",0,0,0,1],["13202","昭島市",0,3,0,1],["13202","武蔵村山市",0,1,0,1],["13202","福生市",0,0,0,1],["13202","立川市",2,6,0,5],["13203","三鷹市",0,1,0,0],["13203","小金井市",0,1,0,0],["13203","武蔵野市",0,2,0,2],["13204","三鷹市",0,4,0,4],["13204","調布市",0,2,0,1],["13205","瑞穂町",0,1,0,1],["13205","羽村市",0,1,0,0],["13205","青梅市",6,14,1,13],["13206","国分寺市",0,1,0,0],["13206","国立市",1,1,0,0],["13206","小金井市",0,1,0,0],["13206","府中市",2,5,0,6],["13206","調布市",0,2,0,2],["13207","昭島市",2,8,0,3],["13208","狛江市",0,1,0,0],["13208","調布市",4,6,0,2],["13209","多摩市",0,2,0,0],["13209","町田市",4,9,0,10],["13210","国分寺市",0,1,0,0],["13210","小平市",0,1,0,0],["13210","小金井市",0,2,0,2],["13211","小平市",0,2,0,2],["13211","東久留米市",0,2,0,0],["13212","多摩市",1,0,0,0],["13212","日野市",4,8,0,7],["13213","東久留米市",0,1,0,1],["13213","東大和市",0,0,0,1],["13213","東村山市",1,7,0,6],["13213","清瀬市",0,1,0,0],["13214","国分寺市",0,4,0,1],["13215","国立市",3,4,0,3],["13218","福生市",0,3,0,1],["13219","狛江市",0,5,0,3],["13220","東大和市",0,4,0,5],["13221","清瀬市",0,4,0,3],["13222","東久留米市",0,4,0,4],["13222","西東京市",0,0,0,1],["13223","武蔵村山市",0,6,0,6],["13223","瑞穂町",0,2,0,0],["13224","多摩市",0,5,0,2],["13224","稲城市",0,1,0,0],["13225","稲城市",3,7,0,6],["13227","羽村市",1,3,0,5],["13228","あきる野市",3,11,0,11],["13228","日の出町",1,1,0,2],["13229","西東京市",1,3,1,3],["13303","瑞穂町",0,5,0,4],["13305","日の出町",1,6,0,5],["13307","檜原村",0,2,0,2],["13308","奥多摩町",2,3,0,2],["13361","大島町",0,1,1,1],["13362","利島村",0,1,0,1],["13363","新島村",0,3,0,0],["13364","神津島村",0,1,0,0],["13381","三宅村",0,4,1,1],["13401","八丈町",1,2,1,2]];
var GX_TOKYO_SICHO=[["",451],["三宅支庁",6],["八丈支庁",6],["大島支庁",9]];
var GX_TOKYO_ISLAND_PAIRS=[["三宅支庁","三宅村"],["八丈支庁","八丈町"],["大島支庁","利島村"],["大島支庁","大島町"],["大島支庁","新島村"],["大島支庁","神津島村"]];
function gxTokyoSoilValidate(){
 if(GX_TOKYO_CODE_NAME_PAIRS.length!==87||GX_TOKYO_LANDUSE.length!==4||GX_TOKYO_SICHO.length!==4)throw Error('P40_TOKYO_LENGTH');
 var codes=new Map(),names=new Map(),pairs=new Set(),totals=[0,0,0,0],foreign=0,foreignPairs=0;
 GX_TOKYO_CODE_NAME_PAIRS.forEach(function(r){
  if(r.length!==6||!/^(11|13)[0-9]{3}$/.test(r[0])||typeof r[1]!=='string'||!r[1])throw Error('P40_TOKYO_CODE');
  var key=r[0]+'|'+r[1];if(pairs.has(key))throw Error('P40_TOKYO_DUPLICATE_PAIR');
  pairs.add(key);
  if(!codes.has(r[0]))codes.set(r[0],new Set());codes.get(r[0]).add(r[1]);
  if(!names.has(r[1]))names.set(r[1],new Set());names.get(r[1]).add(r[0]);
  var count=r.slice(2).reduce(function(sum,v,i){if(!Number.isSafeInteger(v)||v<0)throw Error('P40_TOKYO_BAD_COUNT');totals[i]+=v;return sum+v;},0);
  if(r[0].startsWith('11')){foreign+=count;foreignPairs++;}
 });
 if(codes.size!==47||names.size!==43||foreign!==15||foreignPairs!==8)throw Error('P40_TOKYO_CODE_NAME_ANOMALY');
 if([...codes.values()].filter(function(s){return s.size>1;}).length!==23||[...names.values()].filter(function(s){return s.size>1;}).length!==26)throw Error('P40_TOKYO_MULTIPLE_MAPPINGS');
 if(totals.reduce(function(a,b){return a+b;},0)!==472)throw Error('P40_TOKYO_TOTAL');
 GX_TOKYO_LANDUSE.forEach(function(row,i){if(totals[i]!==row[1])throw Error('P40_TOKYO_LANDUSE_PARITY');});
 var sub=Object.fromEntries(GX_TOKYO_SICHO);
 if(GX_TOKYO_SICHO.length!==4||sub['']!==451||sub['三宅支庁']!==6||sub['八丈支庁']!==6||sub['大島支庁']!==9)throw Error('P40_TOKYO_ISLAND_SICHO_COUNTS');
 if(Object.values(sub).reduce(function(a,b){return a+b;},0)!==472||GX_TOKYO_ISLAND_PAIRS.length!==6)throw Error('P40_TOKYO_ISLAND_PARITY');
 return true;
}
function gxTokyoSoilPanel(prefCode){
 if(prefCode!=='13')return '';
 gxTokyoSoilValidate();
 var fmt=function(n){return Number(n).toLocaleString('ja-JP');};
 var cards=GX_TOKYO_LANDUSE.map(function(row){
  return '<article class="gx-data-card"><span class="gx-kicker">地目区分 / Polygon features</span><strong>'+fmt(row[1])+' <small>件</small></strong><p>'+gxEsc(row[0])+'（面積haではありません）</p></article>';
 }).join('');
 var codes=new Map(),names=new Map();
 GX_TOKYO_CODE_NAME_PAIRS.forEach(function(r){
  codes.set(r[0],(codes.get(r[0])||0)+1);names.set(r[1],(names.get(r[1])||0)+1);
 });
 var head='<thead><tr><th scope="col">市区町村名（原本）</th><th scope="col">JCODE（原本）</th><th scope="col">田</th><th scope="col">普通畑</th><th scope="col">牧草地</th><th scope="col">樹園地</th><th scope="col">計</th><th scope="col">照合状態</th></tr></thead>';
 var body=GX_TOKYO_CODE_NAME_PAIRS.map(function(r){
  var issue=r[0].startsWith('11')?'県外コード11系・要照合':codes.get(r[0])>1||names.get(r[1])>1?'複数対応・要照合':'原本値';
  return '<tr><th scope="row">'+gxEsc(r[1])+'</th><td>'+gxEsc(r[0])+'</td>'+r.slice(2).map(function(n){return '<td>'+fmt(n)+'</td>';}).join('')+'<td>'+fmt(r.slice(2).reduce(function(a,b){return a+b;},0))+'</td><td>'+issue+'</td></tr>';
 }).join('');
 var sub=GX_TOKYO_SICHO.filter(function(r){return r[0]!=='';}).map(function(r){
  return '<tr><th scope="row">'+gxEsc(r[0])+'</th><td>'+fmt(r[1])+'</td></tr>';
 }).join('');
 var isle=GX_TOKYO_ISLAND_PAIRS.map(function(r){return gxEsc(r[0])+'／'+gxEsc(r[1]);}).join('、');
 return '<section class="gx-dashboard" aria-labelledby="gx-tokyo-soil-title">'+
  '<div class="gx-section-heading"><span class="gx-kicker">TOKYO SOIL GIS · P40 · SOURCE AUDITED</span>'+
  '<h2 id="gx-tokyo-soil-title">東京都の農耕地土壌GISを確認する。</h2>'+
  '<p>原本ZIPのJGD2000ポリゴン472件を検証。普通畑248件、樹園地171件などを原本どおり集計。市区町村名43種類・JCODE47種類、87組合せ。土壌群15種類、詳細分類30種類。原本XMLメタデータ作成日は2017年1月17日。</p></div>'+
  '<p class="gx-anomaly"><b>行政コードの照合が必要：</b>東京都ではなく埼玉県を示す「11」系JCODEが4コード・8組合せ、計15ポリゴン含まれています。また23コードが複数市区町村名に、26名称が複数JCODEに対応しています。原本の値は変更せず、行政コードによる市区町村の確定集計や外部統計との自動JOINは保留します。</p>'+
  '<div class="gx-detail-grid">'+cards+'</div>'+
  '<details><summary>島しょ部の支庁別レコード数を確認する</summary><div class="scroll"><table><thead><tr><th scope="col">原本のSICHO（支庁）</th><th scope="col">ポリゴン件数</th></tr></thead><tbody>'+sub+'</tbody></table></div><p>島しょ部の記録は21件（大島支庁9、三宅支庁6、八丈支庁6）。対応する原本名称：'+isle+'。本ファイルに収録されていない市区町村があっても、当該地域に農地が存在しないことを意味しません。</p></details>'+
  '<details><summary>原本の87 JCODE×市区町村名組合せを見る（要照合）</summary><div class="scroll"><table>'+head+'<tbody>'+body+'</tbody></table></div></details>'+
  '<p class="gx-advisory"><b>科学的・配布上の境界：</b>農研機構「日本土壌インベントリー」は出典候補ですが、公式東京都ZIPと原本のSHA一致は未確認。原Shapefile/DBF/ZIPは公開GitHubへ置かず、原本ハッシュと派生集計のみを掲載。ここに示すのはポリゴン件数であり、農地面積ha・筆数・CH₄実測値・土壌炭素量・CO₂e削減量ではありません。2024年水稲統計やJAXA土地被覆との自治体単位の自動結合はしていません。監査台帳：research/p40-tokyo-soil-shapefile-source-v1.json。検証：docs/p40-tokyo-soil-gis-ja.md。</p></section>';
}
