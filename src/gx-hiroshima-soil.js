/* NaFT P62 Hiroshima soil GIS: verified derived aggregates only; raw SHP, DBF and geometry not redistributed. */
'use strict';
var GX_HIROSHIMA_SOURCE_SHA="44953dd998ad968355c0d33dc910fd8806dd1a2064c4d1a10976902c0aafb626";
var GX_HIROSHIMA_LANDUSE=[["田",478],["普通畑",407],["牧草地",125],["樹園地",199]];
var GX_HIROSHIMA_CODE_PAIRS=[["32343","庄原市",0,1,0,0],["32449","安芸高田市",3,0,0,0],["33205","福山市",1,1,0,0],["33207","福山市",2,2,0,0],["33209","神石高原町",2,0,0,0],["33210","庄原市",3,0,0,0],["34102","東区",4,6,0,0],["34103","南区",0,2,0,1],["34104","西区",2,2,0,0],["34105","安佐北区",1,0,0,0],["34105","安佐南区",14,5,0,0],["34106","北広島町",2,1,0,0],["34106","安佐北区",19,18,0,1],["34106","安芸太田町",0,1,0,0],["34106","安芸高田市",3,0,0,0],["34107","安芸区",6,7,0,0],["34107","熊野町",2,0,0,0],["34108","佐伯区",11,7,3,3],["34108","廿日市市",0,0,1,0],["34202","呉市",17,15,1,14],["34202","東広島市",7,2,0,0],["34203","三原市",2,1,0,0],["34203","東広島市",0,3,0,0],["34203","竹原市",16,15,0,7],["34204","三原市",27,22,6,14],["34204","世羅町",4,1,1,0],["34204","尾道市",2,2,0,1],["34204","東広島市",4,0,0,0],["34205","世羅町",1,0,0,0],["34205","尾道市",21,17,0,16],["34205","府中市",1,0,0,0],["34205","福山市",2,2,0,3],["34207","府中市",0,1,0,0],["34207","福山市",21,22,1,20],["34208","三次市",2,0,0,0],["34208","府中市",18,19,6,6],["34208","神石高原町",2,1,0,0],["34209","三次市",40,33,19,13],["34209","世羅町",7,1,1,0],["34209","安芸高田市",1,1,0,0],["34209","庄原市",4,1,2,0],["34209","東広島市",3,0,0,0],["34210","庄原市",35,38,28,22],["34210","神石高原町",4,1,0,0],["34211","大竹市",2,2,1,2],["34211","廿日市市",0,1,0,0],["34212","世羅町",2,0,0,0],["34212","安芸高田市",1,0,0,0],["34212","東広島市",33,34,11,19],["34213","廿日市市",16,17,3,10],["34214","安芸高田市",27,30,9,11],["34215","江田島市",3,2,0,2],["34302","府中町",1,2,0,0],["34304","海田町",1,1,0,0],["34307","熊野町",8,2,0,1],["34309","坂町",2,5,0,1],["34368","北広島町",1,0,1,0],["34368","安芸太田町",9,11,8,9],["34369","北広島町",27,21,13,8],["34431","大崎上島町",1,3,0,4],["34462","世羅町",14,13,5,5],["34545","神石高原町",14,12,5,6]];
var GX_HIROSHIMA_GUN_PAIRS=[["","三原市",29,23,6,14],["","三次市",42,33,19,13],["","世羅町",14,2,2,0],["","佐伯区",11,7,3,3],["","北広島町",2,1,0,0],["","南区",0,2,0,1],["","呉市",17,15,1,14],["","大竹市",2,2,1,2],["","安佐北区",20,18,0,1],["","安佐南区",14,5,0,0],["","安芸区",6,7,0,0],["","安芸太田町",0,1,0,0],["","安芸高田市",32,31,9,11],["","尾道市",23,19,0,17],["","庄原市",42,39,30,22],["","府中市",19,20,6,6],["","廿日市市",16,18,4,10],["","東区",4,6,0,0],["","東広島市",47,39,11,19],["","江田島市",3,2,0,2],["","熊野町",2,0,0,0],["","神石高原町",8,2,0,0],["","福山市",26,27,1,23],["","竹原市",16,15,0,7],["","西区",2,2,0,0],["世羅郡","世羅町",14,13,5,5],["仁多郡","庄原市",0,1,0,0],["安芸郡","坂町",2,5,0,1],["安芸郡","府中町",1,2,0,0],["安芸郡","海田町",1,1,0,0],["安芸郡","熊野町",8,2,0,1],["山県郡","北広島町",28,21,14,8],["山県郡","安芸太田町",9,11,8,9],["神石郡","神石高原町",14,12,5,6],["豊田郡","大崎上島町",1,3,0,4],["邑智郡","安芸高田市",3,0,0,0]];
var GX_HIROSHIMA_GUN_COUNTS=[["",991],["世羅郡",37],["仁多郡",1],["安芸郡",24],["山県郡",108],["神石郡",37],["豊田郡",8],["邑智郡",3]];
function gxHiroshimaSoilValidate(){
  if(GX_HIROSHIMA_SOURCE_SHA!=='44953dd998ad968355c0d33dc910fd8806dd1a2064c4d1a10976902c0aafb626')throw Error('P62_HIROSHIMA_SOURCE_SHA');
  if(GX_HIROSHIMA_CODE_PAIRS.length!==62||GX_HIROSHIMA_GUN_PAIRS.length!==36)throw Error('P62_HIROSHIMA_PAIR_LENGTH');
  var codeNames=new Map(),nameCodes=new Map(),cpSeen=new Set(),gpSeen=new Set(),codeTotals=[0,0,0,0],gunTotals=[0,0,0,0],foreign={'32':0,'33':0};
  GX_HIROSHIMA_CODE_PAIRS.forEach(function(r){
    if(r.length!==6||!/^\d{5}$/.test(r[0])||!r[1])throw Error('P62_HIROSHIMA_CODE_FORMAT');
    var key=r[0]+'|'+r[1];if(cpSeen.has(key))throw Error('P62_HIROSHIMA_DUPLICATE_CODE');cpSeen.add(key);
    if(!codeNames.has(r[0]))codeNames.set(r[0],new Set());codeNames.get(r[0]).add(r[1]);
    if(!nameCodes.has(r[1]))nameCodes.set(r[1],new Set());nameCodes.get(r[1]).add(r[0]);
    r.slice(2).forEach(function(n,i){if(!Number.isSafeInteger(n)||n<0)throw Error('P62_HIROSHIMA_CODE_COUNT');codeTotals[i]+=n;});
    if(!r[0].startsWith('34')){var prefix=r[0].slice(0,2);if(!(prefix in foreign))throw Error('P62_HIROSHIMA_FOREIGN_PREFIX');foreign[prefix]+=r.slice(2).reduce(function(a,b){return a+b;},0);}
  });
  if(codeNames.size!==35||nameCodes.size!==29||foreign['32']!==4||foreign['33']!==11)throw Error('P62_HIROSHIMA_CODE_TOTALS');
  if([...codeNames.values()].filter(function(s){return s.size>1;}).length!==15||[...nameCodes.values()].filter(function(s){return s.size>1;}).length!==15)throw Error('P62_HIROSHIMA_MANY_TO_MANY');
  GX_HIROSHIMA_GUN_PAIRS.forEach(function(r){
    if(r.length!==6||!r[1])throw Error('P62_HIROSHIMA_GUN_FORMAT');
    var key=r[0]+'|'+r[1];if(gpSeen.has(key))throw Error('P62_HIROSHIMA_DUP_GUN');gpSeen.add(key);
    r.slice(2).forEach(function(n,i){if(!Number.isSafeInteger(n)||n<0)throw Error('P62_HIROSHIMA_GUN_COUNT');gunTotals[i]+=n;});
  });
  if(JSON.stringify(codeTotals)!==JSON.stringify([478,407,125,199])||JSON.stringify(gunTotals)!==JSON.stringify(codeTotals))throw Error('P62_HIROSHIMA_LAND_PARITY');
  var guns=Object.fromEntries(GX_HIROSHIMA_GUN_COUNTS);
  GX_HIROSHIMA_GUN_COUNTS.forEach(function(r){var sum=GX_HIROSHIMA_GUN_PAIRS.filter(function(x){return x[0]===r[0];}).reduce(function(s,x){return s+x.slice(2).reduce(function(a,b){return a+b;},0);},0);if(sum!==r[1])throw Error('P62_HIROSHIMA_GUN_PARITY');});
  if(guns['']!==991||guns['仁多郡']!==1||guns['邑智郡']!==3)throw Error('P62_HIROSHIMA_FOREIGN_GUN');
  return true;
}
function gxHiroshimaSoilPanel(prefCode){
  if(prefCode!=='34')return '';
  gxHiroshimaSoilValidate();
  var fmt=function(n){return Number(n).toLocaleString('ja-JP');};
  var cards=GX_HIROSHIMA_LANDUSE.map(function(r){return '<article class="gx-data-card"><span class="gx-kicker">地目区分 / Polygon features</span><strong>'+fmt(r[1])+' <small>件</small></strong><p>'+gxEsc(r[0])+'（農地面積haではありません）</p></article>';}).join('');
  var codeCounts=new Map(),nameCounts=new Map();
  GX_HIROSHIMA_CODE_PAIRS.forEach(function(r){codeCounts.set(r[0],(codeCounts.get(r[0])||0)+1);nameCounts.set(r[1],(nameCounts.get(r[1])||0)+1);});
  var codeRows=GX_HIROSHIMA_CODE_PAIRS.map(function(r){var w=[];if(!r[0].startsWith('34'))w.push('県外系JCODE');if(codeCounts.get(r[0])>1||nameCounts.get(r[1])>1)w.push('コード・名称が複数対応');return '<tr><th scope="row">'+gxEsc(r[1])+'</th><td>'+gxEsc(r[0])+'</td>'+r.slice(2).map(function(n){return '<td>'+fmt(n)+'</td>';}).join('')+'<td>'+gxEsc(w.length?w.join('／')+'・要照合':'原本値')+'</td></tr>';}).join('');
  var gunRows=GX_HIROSHIMA_GUN_PAIRS.map(function(r){var warning=['仁多郡','邑智郡'].includes(r[0])?'島根県の郡名・要照合':!r[0]?'郡名空欄・要照合':'原本値';return '<tr><th scope="row">'+gxEsc(r[1])+'</th><td>'+gxEsc(r[0]||'（空欄）')+'</td>'+r.slice(2).map(function(n){return '<td>'+fmt(n)+'</td>';}).join('')+'<td>'+gxEsc(warning)+'</td></tr>';}).join('');
  var header='<th scope="col">市町村・区名</th><th scope="col">区分</th><th scope="col">田</th><th scope="col">普通畑</th><th scope="col">牧草地</th><th scope="col">樹園地</th><th scope="col">照合</th>';
  return '<section class="gx-dashboard" aria-labelledby="gx-hiroshima-soil-title">'+
    '<div class="gx-section-heading"><span class="gx-kicker">HIROSHIMA SOIL GIS · P62 · ORIGINAL ATTRIBUTES / RECONCILIATION PENDING</span><h2 id="gx-hiroshima-soil-title">広島県の農耕地土壌GISを確認する。</h2><p>JGD2000・ポリゴン1,209件。田478件、普通畑407件、牧草地125件、樹園地199件。原本の市町村・区名29種類、JCODE35種類、土壌群16種類、詳細分類85種類。XML作成日2017年1月17日。</p></div>'+
    '<p class="gx-anomaly"><b>行政属性の要照合：</b>広島県の原本に県外系JCODEが15件（島根県32系4件・岡山県33系11件）、GUN（郡名）は991件が空欄。島根県の郡名「仁多郡」1件・「邑智郡」3件が混在します。JCODEと名称の多対多対応を無断で修正せず、現行自治体統計との自動JOINを保留します。ポリゴン件数は面積・GHG削減量・炭素クレジットではありません。</p>'+
    '<div class="gx-detail-grid">'+cards+'</div>'+
    '<details><summary>原本JCODE×市町村・区名62組合せ</summary><div class="scroll"><table><thead><tr>'+header.replace('<th scope="col">区分</th>','<th scope="col">JCODE</th>')+'</tr></thead><tbody>'+codeRows+'</tbody></table></div></details>'+
    '<details><summary>原本GUN×市町村・区名36組合せ</summary><div class="scroll"><table><thead><tr>'+header.replace('<th scope="col">区分</th>','<th scope="col">GUN</th>')+'</tr></thead><tbody>'+gunRows+'</tbody></table></div></details>'+
    '<p class="gx-kicker">Source ledger: research/p62-hiroshima-soil-shapefile-source-v1.json · 元ZIP・SHP・DBF・ポリゴン座標は公開していません。</p></section>';
}
