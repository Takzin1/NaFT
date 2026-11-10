/* NaFT P69 Saga: source-audited read-only soil aggregates; original GIS and unsafe joins excluded. */
'use strict';
var GX_SAGA_SOURCE_SHA="2603d2c858c58e61ac653b87e724693b5d1644c7bb716c06be11fb386ce92ca2";
var GX_SAGA_LANDUSE=[["田",309],["普通畑",182],["牧草地",11],["樹園地",210]];
var GX_SAGA_CODE_PAIRS=[["40203","みやき町",2,0,0,0],["40203","神埼市",1,0,0,0],["40203","鳥栖市",2,0,0,0],["40212","佐賀市",1,0,0,0],["40212","神埼市",1,0,0,0],["40216","基山町",1,0,0,0],["40216","鳥栖市",2,0,0,0],["40217","基山町",0,1,0,0],["40230","唐津市",0,0,1,0],["40305","吉野ヶ里町",1,0,0,0],["41201","佐賀市",23,19,2,16],["41201","唐津市",1,0,0,0],["41201","小城市",4,0,0,1],["41201","神埼市",6,1,1,2],["41202","伊万里市",1,2,0,4],["41202","唐津市",24,21,1,22],["41202","多久市",0,0,0,1],["41202","玄海町",7,2,0,5],["41203","みやき町",2,0,0,2],["41203","基山町",2,0,0,2],["41203","鳥栖市",7,3,0,7],["41204","多久市",11,7,3,10],["41204","小城市",3,0,1,1],["41204","武雄市",0,1,0,1],["41204","江北町",1,0,0,1],["41205","伊万里市",14,13,0,13],["41205","有田町",3,0,0,1],["41205","武雄市",4,0,0,2],["41206","大町町",3,1,0,1],["41206","嬉野市",2,0,0,0],["41206","有田町",0,0,0,2],["41206","武雄市",17,13,0,14],["41206","白石町",2,1,0,2],["41207","太良町",0,1,0,3],["41207","嬉野市",4,1,0,2],["41207","白石町",1,0,0,0],["41207","鹿島市",9,8,0,9],["41208","小城市",12,8,1,10],["41208","江北町",1,2,0,2],["41209","嬉野市",14,10,1,15],["41209","白石町",2,0,0,1],["41210","吉野ヶ里町",5,0,0,1],["41210","神埼市",18,8,0,6],["41327","みやき町",2,0,0,0],["41327","上峰町",2,1,0,1],["41327","吉野ヶ里町",10,7,0,4],["41341","基山町",6,3,0,6],["41345","みやき町",6,0,0,0],["41345","上峰町",9,3,0,2],["41346","みやき町",9,10,0,3],["41387","玄海町",11,7,0,4],["41401","有田町",10,8,0,9],["41423","大町町",5,4,0,3],["41423","江北町",1,0,0,0],["41424","江北町",7,5,0,5],["41425","白石町",5,5,0,2],["41441","太良町",12,6,0,12]];
var GX_SAGA_GUN_PAIRS=[["","みやき町",4,0,0,2],["","伊万里市",15,15,0,17],["","佐賀市",24,19,2,16],["","吉野ヶ里町",5,0,0,1],["","唐津市",25,21,2,22],["","基山町",3,1,0,2],["","多久市",11,7,3,11],["","大町町",3,1,0,1],["","太良町",0,1,0,3],["","嬉野市",20,11,1,17],["","小城市",19,8,2,12],["","有田町",3,0,0,3],["","武雄市",21,14,0,17],["","江北町",2,2,0,3],["","玄海町",7,2,0,5],["","白石町",5,1,0,3],["","神埼市",26,9,1,8],["","鳥栖市",11,3,0,7],["","鹿島市",9,8,0,9],["三養基郡","みやき町",15,10,0,3],["三養基郡","上峰町",9,3,0,2],["三養基郡","基山町",6,3,0,6],["東松浦郡","玄海町",11,7,0,4],["杵島郡","大町町",5,4,0,3],["杵島郡","江北町",8,5,0,5],["杵島郡","白石町",5,5,0,2],["神埼郡","みやき町",2,0,0,0],["神埼郡","上峰町",2,1,0,1],["神埼郡","吉野ヶ里町",10,7,0,4],["筑紫郡","吉野ヶ里町",1,0,0,0],["藤津郡","太良町",12,6,0,12],["西松浦郡","有田町",10,8,0,9]];
var GX_SAGA_GUN_COUNTS=[["藤津郡",30],["",506],["神埼郡",27],["三養基郡",57],["西松浦郡",27],["杵島郡",42],["東松浦郡",22],["筑紫郡",1]];
var GX_SAGA_MISSING_SOIL={"missing_soil_feature_count":1,"dbf_record_number_1_based":211,"original_jcode":"41205","original_municipality_name":"伊万里市","landuse":"田","missing_fields":["包括_統群","統群コード","亜群コード","群コード"],"status":"UNRESOLVED_ORIGINAL_SOIL_CLASSIFICATION_MISSING_NO_IMPUTATION"};
function gxSagaSoilValidate(){
  if(GX_SAGA_SOURCE_SHA!=='2603d2c858c58e61ac653b87e724693b5d1644c7bb716c06be11fb386ce92ca2')throw Error('P69_SAGA_SOURCE_SHA');
  if(GX_SAGA_CODE_PAIRS.length!==57||GX_SAGA_GUN_PAIRS.length!==32)throw Error('P69_SAGA_PAIR_LENGTH');
  var codes=new Map(),names=new Map(),guns=new Map(),seenCodes=new Set(),seenGuns=new Set(),codeTotals=[0,0,0,0],gunTotals=[0,0,0,0],foreign=0,foreignGun=0;
  GX_SAGA_CODE_PAIRS.forEach(function(r){
    if(r.length!==6||!/^\d{5}$/.test(r[0])||!r[1])throw Error('P69_SAGA_CODE_FORMAT');
    var key=r[0]+'|'+r[1];if(seenCodes.has(key))throw Error('P69_SAGA_CODE_DUP');seenCodes.add(key);
    if(!codes.has(r[0]))codes.set(r[0],new Set());codes.get(r[0]).add(r[1]);
    if(!names.has(r[1]))names.set(r[1],new Set());names.get(r[1]).add(r[0]);
    r.slice(2).forEach(function(n,i){if(!Number.isSafeInteger(n)||n<0)throw Error('P69_SAGA_CODE_COUNT');codeTotals[i]+=n;});
    if(!r[0].startsWith('41')){if(!r[0].startsWith('40'))throw Error('P69_SAGA_UNEXPECTED_CODE_PREFIX');foreign+=r.slice(2).reduce(function(a,b){return a+b;},0);}
  });
  if(codes.size!==26||names.size!==20||foreign!==13)throw Error('P69_SAGA_ADMIN_TOTALS');
  if([...codes.values()].filter(function(s){return s.size>1;}).length!==16||[...names.values()].filter(function(s){return s.size>1;}).length!==19)throw Error('P69_SAGA_ADMIN_MULTIPLE');
  GX_SAGA_GUN_PAIRS.forEach(function(r){
    if(r.length!==6||!r[1])throw Error('P69_SAGA_GUN_FORMAT');
    var key=r[0]+'|'+r[1];if(seenGuns.has(key))throw Error('P69_SAGA_GUN_DUP');seenGuns.add(key);
    if(r[0]){if(!guns.has(r[1]))guns.set(r[1],new Set());guns.get(r[1]).add(r[0]);}
    r.slice(2).forEach(function(n,i){if(!Number.isSafeInteger(n)||n<0)throw Error('P69_SAGA_GUN_COUNT');gunTotals[i]+=n;});
    if(r[0]==='筑紫郡')foreignGun+=r.slice(2).reduce(function(a,b){return a+b;},0);
  });
  if(JSON.stringify(codeTotals)!==JSON.stringify([309,182,11,210])||JSON.stringify(codeTotals)!==JSON.stringify(gunTotals))throw Error('P69_SAGA_LAND_PARITY');
  if([...guns.values()].filter(function(s){return s.size>1;}).length!==3||foreignGun!==1)throw Error('P69_SAGA_GUN_ANOMALIES');
  var gCounts=Object.fromEntries(GX_SAGA_GUN_COUNTS);
  GX_SAGA_GUN_COUNTS.forEach(function(g){var observed=GX_SAGA_GUN_PAIRS.filter(function(r){return r[0]===g[0];}).reduce(function(s,r){return s+r.slice(2).reduce(function(a,b){return a+b;},0);},0);if(observed!==g[1])throw Error('P69_SAGA_GUN_PARITY');});
  if(gCounts['']!==506||gCounts['筑紫郡']!==1)throw Error('P69_SAGA_GUN_COUNTS');
  if(GX_SAGA_MISSING_SOIL.missing_soil_feature_count!==1||GX_SAGA_MISSING_SOIL.dbf_record_number_1_based!==211||GX_SAGA_MISSING_SOIL.original_jcode!=='41205'||GX_SAGA_MISSING_SOIL.original_municipality_name!=='伊万里市'||GX_SAGA_MISSING_SOIL.landuse!=='田'||GX_SAGA_MISSING_SOIL.missing_fields.length!==4)throw Error('P69_SAGA_SOIL_MISSING');
  return true;
}
function gxSagaSoilPanel(prefCode){
  if(prefCode!=='41')return '';
  gxSagaSoilValidate();
  var fmt=function(n){return Number(n).toLocaleString('ja-JP');};
  var cards=GX_SAGA_LANDUSE.map(function(r){return '<article class="gx-data-card"><span class="gx-kicker">地目区分 / Polygon features</span><strong>'+fmt(r[1])+' <small>件</small></strong><p>'+gxEsc(r[0])+'（農地面積haではありません）</p></article>';}).join('');
  var codes=new Map(),names=new Map(),guns=new Map();
  GX_SAGA_CODE_PAIRS.forEach(function(r){codes.set(r[0],(codes.get(r[0])||0)+1);names.set(r[1],(names.get(r[1])||0)+1);});
  GX_SAGA_GUN_PAIRS.forEach(function(r){if(r[0]){if(!guns.has(r[1]))guns.set(r[1],new Set());guns.get(r[1]).add(r[0]);}});
  var codeRows=GX_SAGA_CODE_PAIRS.map(function(r){var warn=[];
    if(!r[0].startsWith('41'))warn.push('福岡県系JCODE');
    if(codes.get(r[0])>1||names.get(r[1])>1)warn.push('コード・名称の複数対応');
    return '<tr><th scope="row">'+gxEsc(r[1])+'</th><td>'+gxEsc(r[0])+'</td>'+r.slice(2).map(function(n){return '<td>'+fmt(n)+'</td>';}).join('')+'<td>'+gxEsc(warn.length?warn.join('／')+'・要照合':'原本値')+'</td></tr>';
  }).join('');
  var gunRows=GX_SAGA_GUN_PAIRS.map(function(r){var warn=[];
    if(!r[0])warn.push('郡名空欄');
    if(r[0]==='筑紫郡')warn.push('福岡県系郡名');
    if(r[0]&&guns.get(r[1])&&guns.get(r[1]).size>1)warn.push('郡名が複数対応');
    return '<tr><th scope="row">'+gxEsc(r[1])+'</th><td>'+gxEsc(r[0]||'（空欄）')+'</td>'+r.slice(2).map(function(n){return '<td>'+fmt(n)+'</td>';}).join('')+'<td>'+gxEsc(warn.length?warn.join('／')+'・要照合':'原本値')+'</td></tr>';
  }).join('');
  var columns='<th scope="col">市町村名</th><th scope="col">区分</th><th scope="col">田</th><th scope="col">普通畑</th><th scope="col">牧草地</th><th scope="col">樹園地</th><th scope="col">照合</th>';
  return '<section class="gx-dashboard" aria-labelledby="gx-saga-soil-title">'+
    '<div class="gx-section-heading"><span class="gx-kicker">SAGA SOIL GIS · P69 · ORIGINAL ATTRIBUTES / CLASSIFICATION & ADMIN REVIEW REQUIRED</span><h2 id="gx-saga-soil-title">佐賀県の農耕地土壌GISを確認する。</h2><p>JGD2000・ポリゴン712件。田309件、普通畑182件、牧草地11件、樹園地210件。市町村名20種類、JCODE26種類、土壌群16種類・詳細分類54種類（いずれも空欄を除く）。XML作成日2017年1月17日。</p></div>'+
    '<p class="gx-anomaly"><b>土壌分類の欠損（要確認）：</b>原本DBFの第211レコードは伊万里市・JCODE 41205・田で、群コード／亜群コード／統群コード／包括_統群がすべて空欄です。地目件数には含めますが、土壌分類済みは711件だけです。推定値の補完や炭素算定への利用は行いません。</p>'+
    '<p class="gx-anomaly"><b>原本行政属性の要照合：</b>福岡県系JCODEが13件（40系）、郡名GUN空欄506件、福岡県の郡名「筑紫郡」1件（吉野ヶ里町）。みやき町・上峰町・吉野ヶ里町は郡名が複数対応します。原本の行政属性は無断補正せず、現行自治体との自動JOINを保留します。ポリゴン数は面積ha・GHG削減量・認証済み炭素クレジットではありません。</p>'+
    '<div class="gx-detail-grid">'+cards+'</div>'+
    '<details><summary>原本JCODE×市町村名57組合せ</summary><div class="scroll"><table><thead><tr>'+columns.replace('<th scope="col">区分</th>','<th scope="col">JCODE</th>')+'</tr></thead><tbody>'+codeRows+'</tbody></table></div></details>'+
    '<details><summary>原本GUN×市町村名32組合せ</summary><div class="scroll"><table><thead><tr>'+columns.replace('<th scope="col">区分</th>','<th scope="col">GUN</th>')+'</tr></thead><tbody>'+gunRows+'</tbody></table></div></details>'+
    '<p class="gx-kicker">Source ledger: research/p69-saga-soil-shapefile-source-v1.json · 元ZIP/SHP/DBF・個別の地物座標は公開していません。</p></section>';
}
