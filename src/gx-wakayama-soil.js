/* NaFT P58 Wakayama agricultural soil GIS. Original JCODE/GUN are unnormalized. */
'use strict';
var GX_WAKAYAMA_SOURCE_SHA='c663a62ae93deb5672cc7645ec9ec98d18b1bb80171171ce1c74f8b591090453';
var GX_WAKAYAMA_LANDUSE=[["田",280],["普通畑",209],["牧草地",8],["樹園地",325]];
var GX_WAKAYAMA_CODE_PAIRS=[["27216","かつらぎ町",0,0,0,1],["27366","和歌山市",0,0,0,1],["29207","橋本市",5,0,0,3],["29207","高野町",1,0,0,0],["30201","和歌山市",14,11,0,8],["30201","岩出市",3,0,0,0],["30201","海南市",4,3,0,4],["30201","紀の川市",0,0,0,1],["30202","有田川町",0,0,0,1],["30202","有田市",0,0,0,2],["30202","海南市",9,9,1,12],["30202","紀の川市",2,2,0,4],["30202","紀美野町",2,0,0,2],["30203","かつらぎ町",0,0,0,3],["30203","九度山町",2,0,0,4],["30203","橋本市",15,4,0,17],["30204","有田川町",0,0,0,3],["30204","有田市",8,6,0,13],["30204","湯浅町",0,0,0,1],["30205","印南町",1,1,0,0],["30205","御坊市",10,4,0,8],["30205","日高川町",3,1,0,2],["30205","日高町",2,0,0,1],["30205","美浜町",1,0,0,0],["30206","みなべ町",0,0,0,4],["30206","上富田町",0,0,0,2],["30206","田辺市",14,12,2,20],["30207","新宮市",10,12,0,7],["30208","かつらぎ町",1,0,0,8],["30208","岩出市",3,0,0,0],["30208","紀の川市",16,13,0,22],["30208","紀美野町",1,0,0,0],["30209","岩出市",11,8,0,3],["30304","紀美野町",5,6,0,5],["30341","かつらぎ町",12,11,0,20],["30341","九度山町",0,0,0,3],["30341","有田川町",0,1,0,0],["30341","高野町",1,1,0,0],["30343","九度山町",5,3,0,6],["30343","高野町",0,0,0,1],["30344","高野町",4,8,0,4],["30361","広川町",0,0,0,2],["30361","有田川町",1,0,0,3],["30361","湯浅町",5,1,0,9],["30362","広川町",6,3,0,6],["30366","有田川町",11,11,2,20],["30381","日高町",3,0,0,0],["30381","美浜町",6,3,0,4],["30382","日高町",4,5,0,6],["30383","由良町",4,4,0,6],["30390","みなべ町",0,1,0,2],["30390","印南町",8,9,0,8],["30391","みなべ町",10,7,0,11],["30392","日高川町",12,8,0,10],["30401","上富田町",1,0,0,1],["30401","白浜町",8,8,0,12],["30404","上富田町",6,5,1,8],["30406","すさみ町",4,5,2,3],["30421","太地町",1,0,0,0],["30421","那智勝浦町",8,6,0,10],["30422","太地町",1,2,0,2],["30424","古座川町",8,7,0,3],["30427","北山村",3,2,0,1],["30428","串本町",5,6,0,2]];
var GX_WAKAYAMA_GUN_COUNTS=[["",383],["伊都郡",80],["日高郡",131],["有田郡",80],["東牟婁郡",67],["泉南郡",1],["海草郡",16],["西牟婁郡",64]];
var GX_WAKAYAMA_GUN_PAIRS=[["","かつらぎ町",1,0,0,12],["","みなべ町",0,0,0,4],["","上富田町",0,0,0,2],["","九度山町",2,0,0,4],["","印南町",1,1,0,0],["","和歌山市",14,11,0,8],["","岩出市",17,8,0,3],["","御坊市",10,4,0,8],["","新宮市",10,12,0,7],["","日高川町",3,1,0,2],["","日高町",2,0,0,1],["","有田川町",0,0,0,4],["","有田市",8,6,0,15],["","橋本市",20,4,0,20],["","海南市",13,12,1,16],["","湯浅町",0,0,0,1],["","田辺市",14,12,2,20],["","紀の川市",18,15,0,27],["","紀美野町",3,0,0,2],["","美浜町",1,0,0,0],["","高野町",1,0,0,0],["伊都郡","かつらぎ町",12,11,0,20],["伊都郡","九度山町",5,3,0,9],["伊都郡","有田川町",0,1,0,0],["伊都郡","高野町",5,9,0,5],["日高郡","みなべ町",10,8,0,13],["日高郡","印南町",8,9,0,8],["日高郡","日高川町",12,8,0,10],["日高郡","日高町",7,5,0,6],["日高郡","由良町",4,4,0,6],["日高郡","美浜町",6,3,0,4],["有田郡","広川町",6,3,0,8],["有田郡","有田川町",12,11,2,23],["有田郡","湯浅町",5,1,0,9],["東牟婁郡","串本町",5,6,0,2],["東牟婁郡","北山村",3,2,0,1],["東牟婁郡","古座川町",8,7,0,3],["東牟婁郡","太地町",2,2,0,2],["東牟婁郡","那智勝浦町",8,6,0,10],["泉南郡","和歌山市",0,0,0,1],["海草郡","紀美野町",5,6,0,5],["西牟婁郡","すさみ町",4,5,2,3],["西牟婁郡","上富田町",7,5,1,9],["西牟婁郡","白浜町",8,8,0,12]];
function gxWakayamaSoilValidate(){
 if(GX_WAKAYAMA_SOURCE_SHA!=='c663a62ae93deb5672cc7645ec9ec98d18b1bb80171171ce1c74f8b591090453')throw Error('P58_WAKAYAMA_SHA');
 if(GX_WAKAYAMA_LANDUSE.length!==4||GX_WAKAYAMA_CODE_PAIRS.length!==64||GX_WAKAYAMA_GUN_PAIRS.length!==44)throw Error('P58_WAKAYAMA_PAIR_LENGTH');
 var byCode=new Map(),byName=new Map(),keys=new Set(),total=[0,0,0,0],foreign={'27':0,'29':0},foreignPairs=0;
 GX_WAKAYAMA_CODE_PAIRS.forEach(function(r){
  if(r.length!==6||!/^(27|29|30)[0-9]{3}$/.test(r[0])||!r[1])throw Error('P58_WAKAYAMA_CODE_FORMAT');
  var key=r[0]+'|'+r[1];if(keys.has(key))throw Error('P58_WAKAYAMA_DUP_CODE_PAIR');keys.add(key);
  if(!byCode.has(r[0]))byCode.set(r[0],new Set());byCode.get(r[0]).add(r[1]);
  if(!byName.has(r[1]))byName.set(r[1],new Set());byName.get(r[1]).add(r[0]);
  var n=r.slice(2).reduce(function(s,x,i){if(!Number.isSafeInteger(x)||x<0)throw Error('P58_WAKAYAMA_PAIR_COUNT');total[i]+=x;return s+x;},0);
  if(!r[0].startsWith('30')){foreign[r[0].slice(0,2)]+=n;foreignPairs++;}
 });
 if(byCode.size!==33||byName.size!==30||foreign['27']!==2||foreign['29']!==9||foreignPairs!==4)throw Error('P58_WAKAYAMA_CODE_COUNTS');
 if([...byCode.values()].filter(function(s){return s.size>1;}).length!==15||[...byName.values()].filter(function(s){return s.size>1;}).length!==20)throw Error('P58_WAKAYAMA_MANY_TO_MANY');
 if(total.reduce(function(a,b){return a+b;},0)!==822||GX_WAKAYAMA_LANDUSE.some(function(r,i){return r[1]!==total[i];}))throw Error('P58_WAKAYAMA_LAND_COUNT');
 var named=new Map(),sumCounty=[0,0,0,0],counties={},seen=new Set(),blank=0,blankTowns=0,foreignGun=0;
 GX_WAKAYAMA_GUN_PAIRS.forEach(function(r){
  if(r[0]){if(!named.has(r[1]))named.set(r[1],new Set());named.get(r[1]).add(r[0]);}
 });
 GX_WAKAYAMA_GUN_PAIRS.forEach(function(r){
  if(r.length!==6||!r[1])throw Error('P58_WAKAYAMA_GUN_FORMAT');
  var key=r[0]+'|'+r[1];if(seen.has(key))throw Error('P58_WAKAYAMA_DUP_GUN_PAIR');seen.add(key);
  var n=r.slice(2).reduce(function(s,x,i){if(!Number.isSafeInteger(x)||x<0)throw Error('P58_WAKAYAMA_GUN_COUNT');sumCounty[i]+=x;return s+x;},0);
  counties[r[0]]=(counties[r[0]]||0)+n;
  if(!r[0]&&named.has(r[1])){blank+=n;if(/[町村]$/.test(r[1]))blankTowns+=n;}
  if(r[0]==='泉南郡'){if(r[1]!=='和歌山市'||JSON.stringify(r.slice(2))!==JSON.stringify([0,0,0,1]))throw Error('P58_WAKAYAMA_OSAKA_GUN');foreignGun+=n;}
 });
 if(GX_WAKAYAMA_GUN_COUNTS.length!==8||GX_WAKAYAMA_GUN_COUNTS.some(function(r){return counties[r[0]]!==r[1];}))throw Error('P58_WAKAYAMA_GUN_TOTAL');
 if(sumCounty.some(function(v,i){return v!==total[i];})||Object.values(counties).reduce(function(a,b){return a+b;},0)!==822)throw Error('P58_WAKAYAMA_GUN_PARITY');
 if(blank!==81||blankTowns!==48||foreignGun!==1)throw Error('P58_WAKAYAMA_GUN_ANOMALY_COUNTS');
 var mult=[...named.entries()].filter(function(x){return x[1].size>1;});
 if(mult.length!==1||mult[0][0]!=='有田川町'||!mult[0][1].has('伊都郡')||!mult[0][1].has('有田郡'))throw Error('P58_WAKAYAMA_MULTI_GUN');
 return true;
}
function gxWakayamaSoilPanel(prefCode){
 if(prefCode!=='30')return '';
 gxWakayamaSoilValidate();
 var fmt=function(n){return Number(n).toLocaleString('ja-JP');};
 var cards=GX_WAKAYAMA_LANDUSE.map(function(r){return '<article class="gx-data-card"><span class="gx-kicker">地目区分 / Polygon features</span><strong>'+fmt(r[1])+' <small>件</small></strong><p>'+gxEsc(r[0])+'（農地面積haではありません）</p></article>';}).join('');
 var cn=new Map(),nc=new Map();
 GX_WAKAYAMA_CODE_PAIRS.forEach(function(r){cn.set(r[0],(cn.get(r[0])||0)+1);nc.set(r[1],(nc.get(r[1])||0)+1);});
 var cpRows=GX_WAKAYAMA_CODE_PAIRS.map(function(r){
  var warnings=[];
  if(!r[0].startsWith('30'))warnings.push('県外JCODE：'+r[0].slice(0,2));
  if(cn.get(r[0])>1||nc.get(r[1])>1)warnings.push('コードと名称が複数対応');
  return '<tr><th scope="row">'+gxEsc(r[1])+'</th><td>'+gxEsc(r[0])+'</td>'+r.slice(2).map(function(n){return '<td>'+fmt(n)+'</td>';}).join('')+'<td>'+fmt(r.slice(2).reduce(function(a,b){return a+b;},0))+'</td><td>'+(warnings.length?gxEsc(warnings.join('／'))+'・要照合':'原本値')+'</td></tr>';
 }).join('');
 var named=new Map();
 GX_WAKAYAMA_GUN_PAIRS.forEach(function(r){if(r[0]){if(!named.has(r[1]))named.set(r[1],new Set());named.get(r[1]).add(r[0]);}});
 var gunCounts=GX_WAKAYAMA_GUN_COUNTS.map(function(r){return '<tr><th scope="row">'+gxEsc(r[0]||'（空欄）')+'</th><td>'+fmt(r[1])+'</td><td>'+(r[0]==='泉南郡'?'県外郡名・要照合':'原本値')+'</td></tr>';}).join('');
 var gunRows=GX_WAKAYAMA_GUN_PAIRS.map(function(r){
  var warnings=[];
  if(r[0]==='泉南郡')warnings.push('大阪府の郡名');
  if(named.has(r[1])&&named.get(r[1]).size>1)warnings.push('同一名称の複数郡名');
  if(!r[0]&&named.has(r[1]))warnings.push('郡名空欄（同名の郡名付き原本あり）');
  return '<tr><th scope="row">'+gxEsc(r[1])+'</th><td>'+gxEsc(r[0]||'（空欄）')+'</td>'+r.slice(2).map(function(n){return '<td>'+fmt(n)+'</td>';}).join('')+'<td>'+(warnings.length?gxEsc(warnings.join('／'))+'・要照合':'原本値')+'</td></tr>';
 }).join('');
 return '<section class="gx-dashboard" aria-labelledby="gx-wakayama-soil-title">'+
  '<div class="gx-section-heading"><span class="gx-kicker">WAKAYAMA SOIL GIS · P58 · ORIGINAL ATTRIBUTES / CODE AND GUN PENDING</span>'+
  '<h2 id="gx-wakayama-soil-title">和歌山県の農耕地土壌GISを確認する。</h2>'+
  '<p>原本JGD2000の農耕地土壌ポリゴン822件。田280件、普通畑209件、牧草地8件、樹園地325件。市町村名30種類、JCODE33種類、64組合せ。土壌群11種類・詳細分類38種類、分類空欄0件。XMLメタデータ作成日は2017年1月17日。</p></div>'+
  '<p class="gx-anomaly"><b>行政コード・郡名は要照合：</b>和歌山県「30」以外のJCODEが11件（奈良県29系9・大阪府27系2）。15コードに複数名称、20名称に複数JCODEが記録されています。GUNには和歌山市の樹園地1件に大阪府の「泉南郡」が混在。有田川町の郡名も「有田郡」「伊都郡」の2種類。同じ名称に郡名付き原本があるGUN空欄は81件（町村48件・和歌山市33件）。原本を無断修正せず、現行自治体・郡別統計との自動JOINは保留します。</p>'+
  '<div class="gx-detail-grid">'+cards+'</div>'+
  '<details><summary>GUN（郡名）別の原本件数を見る</summary><div class="scroll"><table><thead><tr><th scope="col">郡名</th><th scope="col">ポリゴン件数</th><th scope="col">照合</th></tr></thead><tbody>'+gunCounts+'</tbody></table></div><p>GUN空欄383件、記載439件。GUNは原本属性であり、現在の正式な郡別農地面積ではありません。</p></details>'+
  '<details><summary>原本GUN×市町村名44組合せを見る</summary><div class="scroll"><table><thead><tr><th scope="col">市町村名</th><th scope="col">GUN</th><th scope="col">田</th><th scope="col">普通畑</th><th scope="col">牧草地</th><th scope="col">樹園地</th><th scope="col">照合状態</th></tr></thead><tbody>'+gunRows+'</tbody></table></div></details>'+
  '<details><summary>原本JCODE×市町村名64組合せを見る</summary><div class="scroll"><table><thead><tr><th scope="col">市町村名</th><th scope="col">JCODE</th><th scope="col">田</th><th scope="col">普通畑</th><th scope="col">牧草地</th><th scope="col">樹園地</th><th scope="col">合計</th><th scope="col">照合状態</th></tr></thead><tbody>'+cpRows+'</tbody></table></div></details>'+
  '<p class="gx-advisory"><b>来歴と科学的制約：</b>農研機構「日本土壌インベントリー」は配布元候補だが、公式和歌山県ZIPとのSHA照合・個別再配布条件は未確認。原本のZIP・SHP・DBFを公開GitHubへ複製せず、元ZIPと7ファイルのハッシュおよび派生集計・検証コードを保存。ポリゴン件数は農地面積ha、筆数、CH₄実測、土壌炭素、CO₂e削減量、認証済クレジット量ではありません。2024年水稲統計やJAXA土地被覆との無検証の行政コードJOINも行いません。原本台帳：research/p58-wakayama-soil-shapefile-source-v1.json。監査手順：docs/p58-wakayama-soil-gis-ja.md。</p></section>';
}
