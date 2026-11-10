/* NaFT P74 Kagoshima: original-source derived soil GIS attributes. No raw polygons or unverifiable modern administrative JOIN. */
'use strict';
var GX_KAGOSHIMA_SOURCE_SHA="26b91128ec49d96d48285157295e5aef2bc3b7fe464c24ac0349493bafc8e817";
var GX_KAGOSHIMA_LANDUSE=[["田",467],["普通畑",616],["牧草地",111],["樹園地",355]];
var GX_KAGOSHIMA_CODE_PAIRS=[["43205","伊佐市",0,0,1,1],["45202","曽於市",8,10,0,1],["45202","霧島市",0,1,0,0],["45207","志布志市",1,0,0,0],["45209","湧水町",3,0,0,0],["46201","南九州市",1,0,0,0],["46201","姶良市",1,0,0,1],["46201","指宿市",0,1,0,0],["46201","日置市",5,2,0,1],["46201","鹿児島市",19,20,1,12],["46203","垂水市",0,0,1,0],["46203","大崎町",1,3,0,1],["46203","曽於市",1,4,0,0],["46203","東串良町",2,1,0,0],["46203","肝付町",4,3,0,0],["46203","錦江町",0,1,0,1],["46203","霧島市",2,2,0,0],["46203","鹿屋市",13,21,4,7],["46204","南さつま市",0,5,0,6],["46204","南九州市",0,2,0,3],["46204","枕崎市",7,13,2,12],["46206","出水市",3,2,0,4],["46206","薩摩川内市",1,0,1,0],["46206","阿久根市",14,11,1,14],["46208","伊佐市",0,0,1,0],["46208","出水市",29,29,2,18],["46210","南九州市",0,0,0,1],["46210","指宿市",7,16,4,11],["46213","中種子町",0,1,0,0],["46213","西之表市",5,11,1,1],["46214","垂水市",4,6,3,5],["46214","霧島市",0,0,2,0],["46215","いちき串木野市",1,0,0,0],["46215","さつま町",6,1,1,1],["46215","姶良市",3,0,0,1],["46215","日置市",1,0,0,0],["46215","薩摩川内市",28,22,4,17],["46216","いちき串木野市",0,1,0,3],["46216","南さつま市",1,2,0,0],["46216","日置市",16,19,3,11],["46217","大崎町",1,2,0,0],["46217","志布志市",5,4,0,3],["46217","曽於市",14,22,9,11],["46217","霧島市",3,6,0,0],["46218","さつま町",1,0,0,0],["46218","姶良市",3,2,0,1],["46218","湧水町",2,1,1,2],["46218","霧島市",14,23,7,16],["46219","いちき串木野市",12,10,1,7],["46220","南さつま市",22,18,3,16],["46220","南九州市",1,2,0,1],["46221","大崎町",6,5,0,1],["46221","志布志市",13,15,5,9],["46222","大和村",0,0,0,1],["46222","奄美市",8,17,2,13],["46222","龍郷町",0,0,0,2],["46223","南九州市",15,23,6,13],["46224","さつま町",2,1,0,0],["46224","伊佐市",14,19,3,6],["46224","湧水町",3,2,0,0],["46225","姶良市",13,9,0,5],["46392","さつま町",19,18,2,12],["46404","長島町",9,6,2,6],["46452","湧水町",12,9,4,5],["46468","大崎町",9,9,2,5],["46468","東串良町",1,5,0,0],["46482","東串良町",7,10,0,1],["46482","肝付町",2,1,0,0],["46490","南大隅町",1,3,0,0],["46490","錦江町",7,9,3,5],["46491","南大隅町",8,12,2,4],["46492","肝付町",9,12,0,6],["46501","中種子町",11,10,0,5],["46501","南種子町",2,1,0,2],["46502","南種子町",9,9,2,2],["46505","屋久島町",9,14,4,13],["46523","大和村",1,7,2,8],["46524","宇検村",0,5,1,6],["46525","瀬戸内町",2,8,4,5],["46527","龍郷町",4,11,3,10],["46529","喜界町",0,6,1,3],["46530","伊仙町",0,4,1,0],["46530","天城町",0,1,0,0],["46530","徳之島町",3,18,4,8],["46531","天城町",1,12,2,4],["46532","伊仙町",0,7,2,4],["46533","和泊町",0,8,0,0],["46533","知名町",0,3,0,0],["46534","知名町",1,5,1,0],["46535","与論町",1,2,0,1]];
var GX_KAGOSHIMA_GUN_PAIRS=[["","いちき串木野市",13,11,1,10],["","さつま町",9,2,1,1],["","中種子町",0,1,0,0],["","伊佐市",14,19,5,7],["","出水市",32,31,2,22],["","南さつま市",23,25,3,22],["","南九州市",17,27,6,18],["","垂水市",4,6,4,5],["","大和村",0,0,0,1],["","大崎町",8,10,0,2],["","奄美市",8,17,2,13],["","姶良市",20,11,0,8],["","志布志市",19,19,5,12],["","指宿市",7,17,4,11],["","日置市",22,21,3,12],["","曽於市",23,36,9,12],["","東串良町",2,1,0,0],["","枕崎市",7,13,2,12],["","湧水町",8,3,1,2],["","肝付町",4,3,0,0],["","薩摩川内市",29,22,5,17],["","西之表市",5,11,1,1],["","錦江町",0,1,0,1],["","阿久根市",14,11,1,14],["","霧島市",19,32,9,16],["","鹿児島市",19,20,1,12],["","鹿屋市",13,21,4,7],["","龍郷町",0,0,0,2],["出水郡","長島町",9,6,2,6],["大島郡","与論町",1,2,0,1],["大島郡","伊仙町",0,11,3,4],["大島郡","和泊町",0,8,0,0],["大島郡","喜界町",0,6,1,3],["大島郡","大和村",1,7,2,8],["大島郡","天城町",1,13,2,4],["大島郡","宇検村",0,5,1,6],["大島郡","徳之島町",3,18,4,8],["大島郡","瀬戸内町",2,8,4,5],["大島郡","知名町",1,8,1,0],["大島郡","龍郷町",4,11,3,10],["姶良郡","湧水町",12,9,4,5],["曽於郡","大崎町",9,9,2,5],["曽於郡","東串良町",1,5,0,0],["熊毛郡","中種子町",11,10,0,5],["熊毛郡","南種子町",11,10,2,4],["熊毛郡","屋久島町",9,14,4,13],["肝属郡","南大隅町",9,15,2,4],["肝属郡","東串良町",7,10,0,1],["肝属郡","肝付町",11,13,0,6],["肝属郡","錦江町",7,9,3,5],["薩摩郡","さつま町",19,18,2,12]];
var GX_KAGOSHIMA_GUN_COUNTS=[["",1039],["出水郡",23],["熊毛郡",93],["大島郡",180],["姶良郡",30],["薩摩郡",51],["肝属郡",102],["曽於郡",31]];
function gxKagoshimaSoilValidate(){
 if(GX_KAGOSHIMA_SOURCE_SHA!=='26b91128ec49d96d48285157295e5aef2bc3b7fe464c24ac0349493bafc8e817')throw Error('P74_KAGOSHIMA_SOURCE_SHA');
 if(GX_KAGOSHIMA_CODE_PAIRS.length!==90||GX_KAGOSHIMA_GUN_PAIRS.length!==51)throw Error('P74_KAGOSHIMA_PAIRS');
 var ct=[0,0,0,0],gt=[0,0,0,0],codes=new Map(),names=new Map(),guns=new Map(),seenC=new Set(),seenG=new Set(),foreign43=0,foreign45=0;
 GX_KAGOSHIMA_CODE_PAIRS.forEach(function(r){
  if(r.length!==6||!/^\d{5}$/.test(r[0])||!r[1])throw Error('P74_KAGOSHIMA_CODE_FORMAT');
  var key=r[0]+'|'+r[1];if(seenC.has(key))throw Error('P74_KAGOSHIMA_CODE_DUPLICATE');seenC.add(key);
  if(!codes.has(r[0]))codes.set(r[0],new Set());codes.get(r[0]).add(r[1]);
  if(!names.has(r[1]))names.set(r[1],new Set());names.get(r[1]).add(r[0]);
  r.slice(2).forEach(function(n,i){if(!Number.isSafeInteger(n)||n<0)throw Error('P74_KAGOSHIMA_INVALID_CODE_COUNT');ct[i]+=n;});
  var pre=r[0].slice(0,2),n=r.slice(2).reduce(function(a,b){return a+b;},0);
  if(pre==='43')foreign43+=n;else if(pre==='45')foreign45+=n;else if(pre!=='46')throw Error('P74_KAGOSHIMA_FOREIGN_PREFIX');
 });
 if(codes.size!==45||names.size!==41||foreign43!==2||foreign45!==24)throw Error('P74_KAGOSHIMA_CODE_TOTALS');
 if([...codes.values()].filter(function(s){return s.size>1;}).length!==23||[...names.values()].filter(function(s){return s.size>1;}).length!==27)throw Error('P74_KAGOSHIMA_MANY_TO_MANY');
 GX_KAGOSHIMA_GUN_PAIRS.forEach(function(r){
  if(r.length!==6||!r[1])throw Error('P74_KAGOSHIMA_GUN_FORMAT');
  var key=r[0]+'|'+r[1];if(seenG.has(key))throw Error('P74_KAGOSHIMA_GUN_DUPLICATE');seenG.add(key);
  if(r[0]){if(!guns.has(r[1]))guns.set(r[1],new Set());guns.get(r[1]).add(r[0]);}
  r.slice(2).forEach(function(n,i){if(!Number.isSafeInteger(n)||n<0)throw Error('P74_KAGOSHIMA_INVALID_GUN_COUNT');gt[i]+=n;});
 });
 if(JSON.stringify(ct)!==JSON.stringify([467,616,111,355])||JSON.stringify(gt)!==JSON.stringify(ct))throw Error('P74_KAGOSHIMA_LAND_PARITY');
 if([...guns.values()].filter(function(s){return s.size>1;}).length!==1||JSON.stringify([...guns.get('東串良町')].sort())!==JSON.stringify(['曽於郡','肝属郡']))throw Error('P74_KAGOSHIMA_AMBIGUOUS_GUN');
 var all=Object.fromEntries(GX_KAGOSHIMA_GUN_COUNTS);
 GX_KAGOSHIMA_GUN_COUNTS.forEach(function(r){var count=GX_KAGOSHIMA_GUN_PAIRS.filter(function(x){return x[0]===r[0];}).reduce(function(a,x){return a+x.slice(2).reduce(function(y,z){return y+z;},0);},0);if(count!==r[1])throw Error('P74_KAGOSHIMA_GUN_PARITY');});
 if(all['']!==1039||all['肝属郡']!==102||all['曽於郡']!==31)throw Error('P74_KAGOSHIMA_GUN_COUNTS');
 return true;
}
function gxKagoshimaSoilPanel(prefCode){
 if(prefCode!=='46')return '';
 gxKagoshimaSoilValidate();
 var fmt=function(n){return Number(n).toLocaleString('ja-JP');};
 var cards=GX_KAGOSHIMA_LANDUSE.map(function(r){return '<article class="gx-data-card"><span class="gx-kicker">地目区分 / Polygon features</span><strong>'+fmt(r[1])+' <small>件</small></strong><p>'+gxEsc(r[0])+'（農地面積haではありません）</p></article>';}).join('');
 var cf=new Map(),nf=new Map(),ng=new Map();
 GX_KAGOSHIMA_CODE_PAIRS.forEach(function(r){cf.set(r[0],(cf.get(r[0])||0)+1);nf.set(r[1],(nf.get(r[1])||0)+1);});
 GX_KAGOSHIMA_GUN_PAIRS.forEach(function(r){if(r[0]){if(!ng.has(r[1]))ng.set(r[1],new Set());ng.get(r[1]).add(r[0]);}});
 var codes=GX_KAGOSHIMA_CODE_PAIRS.map(function(r){var w=[];if(r[0].startsWith('43'))w.push('熊本県系JCODE');else if(r[0].startsWith('45'))w.push('宮崎県系JCODE');if(cf.get(r[0])>1||nf.get(r[1])>1)w.push('行政コード・名称の複数対応');return '<tr><th scope="row">'+gxEsc(r[1])+'</th><td>'+gxEsc(r[0])+'</td>'+r.slice(2).map(function(n){return '<td>'+fmt(n)+'</td>';}).join('')+'<td>'+gxEsc(w.length?w.join('／')+'・要照合':'原本値')+'</td></tr>';}).join('');
 var guns=GX_KAGOSHIMA_GUN_PAIRS.map(function(r){var w=[];if(!r[0])w.push('郡名空欄');if(r[0]&&ng.get(r[1])&&ng.get(r[1]).size>1)w.push('複数郡名対応');return '<tr><th scope="row">'+gxEsc(r[1])+'</th><td>'+gxEsc(r[0]||'（空欄）')+'</td>'+r.slice(2).map(function(n){return '<td>'+fmt(n)+'</td>';}).join('')+'<td>'+gxEsc(w.length?w.join('／')+'・要照合':'原本値')+'</td></tr>';}).join('');
 var header='<th scope="col">市町村名</th><th scope="col">区分</th><th scope="col">田</th><th scope="col">普通畑</th><th scope="col">牧草地</th><th scope="col">樹園地</th><th scope="col">照合</th>';
 return '<section class="gx-dashboard" aria-labelledby="gx-kagoshima-soil-title">'+
 '<div class="gx-section-heading"><span class="gx-kicker">KAGOSHIMA SOIL GIS · P74 · SOURCE ATTRIBUTES / ADMIN RECONCILIATION PENDING</span><h2 id="gx-kagoshima-soil-title">鹿児島県の農耕地土壌GISを確認する。</h2><p>JGD2000・ポリゴン1,549件。田467件、普通畑616件、牧草地111件、樹園地355件。市町村名41種類、JCODE45種類、土壌群23種類・詳細分類108種類。原本XML作成日2017年1月17日。</p></div>'+
 '<p class="gx-anomaly"><b>原本行政属性の要照合：</b>熊本県系JCODEは2件（43205：伊佐市）、宮崎県系JCODEは24件（45202・45207・45209）。郡名GUNは1,039件空欄。東串良町には「曽於郡」「肝属郡」の両方が記録されています。現行市町村への自動JOINは保留し、原本値を無断修正しません。ポリゴン数は農地面積ha、GHG削減量、認証済み炭素クレジットではありません。</p>'+
 '<div class="gx-detail-grid">'+cards+'</div>'+
 '<details><summary>原本JCODE×市町村名90組合せ</summary><div class="scroll"><table><thead><tr>'+header.replace('<th scope="col">区分</th>','<th scope="col">JCODE</th>')+'</tr></thead><tbody>'+codes+'</tbody></table></div></details>'+
 '<details><summary>原本GUN×市町村名51組合せ</summary><div class="scroll"><table><thead><tr>'+header.replace('<th scope="col">区分</th>','<th scope="col">GUN</th>')+'</tr></thead><tbody>'+guns+'</tbody></table></div></details>'+
 '<p class="gx-kicker">Source ledger: research/p74-kagoshima-soil-shapefile-source-v1.json · 元ZIP/SHP/DBF・地物座標は公開していません。</p></section>';
}
