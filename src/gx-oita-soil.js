/* NaFT P71 Oita: derived-only soil GIS. No raw geometry or administrative auto-JOIN. */
'use strict';
var GX_OITA_SOURCE_SHA="8bc9152a0d50d6e3dcdea6eb1ecc304b386ddafe1de4af1575ebde4f5aa70965";
var GX_OITA_LANDUSE=[["田",311],["普通畑",234],["牧草地",80],["樹園地",195]];
var GX_OITA_CODE_PAIRS=[["40225","日田市",1,0,0,1],["40228","日田市",0,0,0,1],["40448","日田市",2,0,0,0],["40646","中津市",1,0,0,0],["43214","竹田市",0,1,0,0],["43423","九重町",0,0,1,0],["43423","日田市",1,0,0,0],["43424","九重町",0,0,2,0],["43424","日田市",2,1,1,0],["43424","玖珠町",0,0,1,0],["43425","竹田市",2,1,2,0],["43428","竹田市",0,2,0,0],["44201","別府市",0,0,0,1],["44201","大分市",19,18,6,19],["44201","由布市",7,0,0,0],["44201","竹田市",2,0,0,0],["44201","臼杵市",1,0,0,0],["44201","豊後大野市",2,0,1,0],["44202","別府市",8,2,2,6],["44202","宇佐市",1,0,0,0],["44202","由布市",4,0,0,1],["44203","中津市",19,18,1,12],["44203","宇佐市",3,3,0,1],["44203","日田市",0,1,0,0],["44203","玖珠町",1,0,0,0],["44204","日田市",12,9,6,13],["44204","玖珠町",2,1,1,0],["44205","佐伯市",19,17,1,16],["44206","臼杵市",19,17,1,12],["44206","豊後大野市",4,4,0,0],["44207","津久見市",0,2,0,4],["44208","由布市",0,0,1,0],["44208","竹田市",16,14,12,14],["44208","豊後大野市",4,0,0,1],["44209","宇佐市",3,1,0,0],["44209","杵築市",0,1,0,1],["44209","豊後高田市",13,9,1,8],["44210","国東市",1,1,1,1],["44210","宇佐市",5,1,0,1],["44210","日出町",3,1,0,3],["44210","杵築市",19,12,3,11],["44211","宇佐市",18,13,4,7],["44211","玖珠町",1,0,0,0],["44212","豊後大野市",19,20,8,12],["44213","九重町",1,1,0,0],["44213","由布市",16,12,6,12],["44214","国東市",18,18,4,14],["44322","姫島村",3,4,0,1],["44341","日出町",14,8,2,11],["44461","九重町",11,7,6,9],["44461","玖珠町",3,0,1,0],["44462","玖珠町",11,14,5,2]];
var GX_OITA_GUN_PAIRS=[["","中津市",19,18,1,12],["","九重町",1,1,0,0],["","佐伯市",19,17,1,16],["","別府市",8,2,2,7],["","国東市",19,19,5,15],["","大分市",19,18,6,19],["","宇佐市",30,18,4,9],["","日出町",3,1,0,3],["","日田市",13,10,6,15],["","杵築市",19,13,3,12],["","津久見市",0,2,0,4],["","玖珠町",4,1,1,0],["","由布市",27,12,7,13],["","竹田市",18,15,12,14],["","臼杵市",20,17,1,12],["","豊後大野市",29,24,9,13],["","豊後高田市",13,9,1,8],["朝倉郡","日田市",2,0,0,0],["東国東郡","姫島村",3,4,0,1],["玖珠郡","九重町",11,7,6,9],["玖珠郡","玖珠町",14,14,6,2],["築上郡","中津市",1,0,0,0],["速見郡","日出町",14,8,2,11],["阿蘇郡","九重町",0,0,3,0],["阿蘇郡","日田市",3,1,1,0],["阿蘇郡","玖珠町",0,0,1,0],["阿蘇郡","竹田市",2,3,2,0]];
var GX_OITA_GUN_COUNTS=[["",689],["玖珠郡",69],["速見郡",35],["阿蘇郡",16],["東国東郡",8],["朝倉郡",2],["築上郡",1]];

function gxOitaSoilValidate(){
  if(GX_OITA_SOURCE_SHA!=='8bc9152a0d50d6e3dcdea6eb1ecc304b386ddafe1de4af1575ebde4f5aa70965')throw Error('P71_OITA_SOURCE_SHA');
  if(GX_OITA_CODE_PAIRS.length!==52||GX_OITA_GUN_PAIRS.length!==27)throw Error('P71_OITA_PAIR_LENGTH');
  var ct=[0,0,0,0],gt=[0,0,0,0],codes=new Map(),names=new Map(),guns=new Map(),seenC=new Set(),seenG=new Set(),f40=0,f43=0,foreignGun=0;
  GX_OITA_CODE_PAIRS.forEach(function(r){
    if(r.length!==6||!/^\d{5}$/.test(r[0])||!r[1])throw Error('P71_OITA_CODE_FORMAT');
    var id=r[0]+'|'+r[1];if(seenC.has(id))throw Error('P71_OITA_DUPLICATE_CODE');seenC.add(id);
    if(!codes.has(r[0]))codes.set(r[0],new Set());codes.get(r[0]).add(r[1]);
    if(!names.has(r[1]))names.set(r[1],new Set());names.get(r[1]).add(r[0]);
    r.slice(2).forEach(function(n,i){if(!Number.isSafeInteger(n)||n<0)throw Error('P71_OITA_INVALID_CODE_COUNT');ct[i]+=n;});
    var prefix=r[0].slice(0,2),cnt=r.slice(2).reduce(function(a,b){return a+b;},0);
    if(prefix==='40')f40+=cnt;else if(prefix==='43')f43+=cnt;else if(prefix!=='44')throw Error('P71_OITA_FOREIGN_PREFIX');
  });
  if(codes.size!==27||names.size!==18||f40!==6||f43!==17)throw Error('P71_OITA_CODE_COUNTS');
  if([...codes.values()].filter(function(s){return s.size>1;}).length!==13||[...names.values()].filter(function(s){return s.size>1;}).length!==13)throw Error('P71_OITA_CODE_NAME_AMBIGUITY');
  GX_OITA_GUN_PAIRS.forEach(function(r){
    if(r.length!==6||!r[1])throw Error('P71_OITA_GUN_FORMAT');
    var id=r[0]+'|'+r[1];if(seenG.has(id))throw Error('P71_OITA_DUPLICATE_GUN');seenG.add(id);
    if(r[0]){if(!guns.has(r[1]))guns.set(r[1],new Set());guns.get(r[1]).add(r[0]);}
    r.slice(2).forEach(function(n,i){if(!Number.isSafeInteger(n)||n<0)throw Error('P71_OITA_INVALID_GUN_COUNT');gt[i]+=n;});
    if(['阿蘇郡','朝倉郡','築上郡'].includes(r[0]))foreignGun+=r.slice(2).reduce(function(a,b){return a+b;},0);
  });
  if(JSON.stringify(ct)!==JSON.stringify([311,234,80,195])||JSON.stringify(gt)!==JSON.stringify(ct))throw Error('P71_OITA_LAND_PARITY');
  if(foreignGun!==19||[...guns.values()].filter(function(s){return s.size>1;}).length!==3)throw Error('P71_OITA_GUN_MULTIPLE');
  var actual=Object.fromEntries(GX_OITA_GUN_COUNTS);
  GX_OITA_GUN_COUNTS.forEach(function(g){var n=GX_OITA_GUN_PAIRS.filter(function(r){return r[0]===g[0];}).reduce(function(s,r){return s+r.slice(2).reduce(function(a,b){return a+b;},0);},0);if(n!==g[1])throw Error('P71_OITA_GUN_PARITY');});
  if(actual['']!==689||actual['阿蘇郡']!==16||actual['朝倉郡']!==2||actual['築上郡']!==1)throw Error('P71_OITA_GUN_SOURCE_COUNTS');
  return true;
}
function gxOitaSoilPanel(prefCode){
  if(prefCode!=='44')return '';
  gxOitaSoilValidate();
  var fmt=function(n){return Number(n).toLocaleString('ja-JP');};
  var cards=GX_OITA_LANDUSE.map(function(r){return '<article class="gx-data-card"><span class="gx-kicker">地目区分 / Polygon features</span><strong>'+fmt(r[1])+' <small>件</small></strong><p>'+gxEsc(r[0])+'（農地面積haではありません）</p></article>';}).join('');
  var cf=new Map(),nf=new Map(),ng=new Map();
  GX_OITA_CODE_PAIRS.forEach(function(r){cf.set(r[0],(cf.get(r[0])||0)+1);nf.set(r[1],(nf.get(r[1])||0)+1);});
  GX_OITA_GUN_PAIRS.forEach(function(r){if(r[0]){if(!ng.has(r[1]))ng.set(r[1],new Set());ng.get(r[1]).add(r[0]);}});
  var crows=GX_OITA_CODE_PAIRS.map(function(r){var w=[];if(r[0].startsWith('40'))w.push('福岡県系JCODE');else if(r[0].startsWith('43'))w.push('熊本県系JCODE');if(cf.get(r[0])>1||nf.get(r[1])>1)w.push('コード・名称の複数対応');return '<tr><th scope="row">'+gxEsc(r[1])+'</th><td>'+gxEsc(r[0])+'</td>'+r.slice(2).map(function(x){return '<td>'+fmt(x)+'</td>';}).join('')+'<td>'+gxEsc(w.length?w.join('／')+'・要照合':'原本値')+'</td></tr>';}).join('');
  var grows=GX_OITA_GUN_PAIRS.map(function(r){var w=[];if(!r[0])w.push('郡名空欄');if(['阿蘇郡','朝倉郡','築上郡'].includes(r[0]))w.push('県外の郡名');if(r[0]&&ng.get(r[1])&&ng.get(r[1]).size>1)w.push('複数郡名対応');return '<tr><th scope="row">'+gxEsc(r[1])+'</th><td>'+gxEsc(r[0]||'（空欄）')+'</td>'+r.slice(2).map(function(x){return '<td>'+fmt(x)+'</td>';}).join('')+'<td>'+gxEsc(w.length?w.join('／')+'・要照合':'原本値')+'</td></tr>';}).join('');
  var cols='<th scope="col">市町村名</th><th scope="col">区分</th><th scope="col">田</th><th scope="col">普通畑</th><th scope="col">牧草地</th><th scope="col">樹園地</th><th scope="col">照合</th>';
  return '<section class="gx-dashboard" aria-labelledby="gx-oita-soil-title">'+
    '<div class="gx-section-heading"><span class="gx-kicker">OITA SOIL GIS · P71 · ORIGINAL ATTRIBUTES / RECONCILIATION PENDING</span><h2 id="gx-oita-soil-title">大分県の農耕地土壌GISを確認する。</h2><p>JGD2000・ポリゴン820件。田311件、普通畑234件、牧草地80件、樹園地195件。原本市町村名18種類、JCODE27種類、土壌群15種類・詳細分類53種類。XML作成日2017年1月17日。</p></div>'+
    '<p class="gx-anomaly"><b>原本行政属性の要照合：</b>福岡県系JCODEが6件、熊本県系JCODEが17件。県外の郡名が19件（阿蘇郡16件・朝倉郡2件・築上郡1件）。郡名GUNは689件空欄で、九重町・玖珠町・日田市には複数の郡名が対応しています。原本の行政属性を無断補正せず、現行自治体との自動JOINを保留します。ポリゴン件数は農地面積ha、GHG削減量、認証済み炭素クレジット数ではありません。</p>'+
    '<div class="gx-detail-grid">'+cards+'</div>'+
    '<details><summary>原本JCODE×市町村名52組合せ</summary><div class="scroll"><table><thead><tr>'+cols.replace('<th scope="col">区分</th>','<th scope="col">JCODE</th>')+'</tr></thead><tbody>'+crows+'</tbody></table></div></details>'+
    '<details><summary>原本GUN×市町村名27組合せ</summary><div class="scroll"><table><thead><tr>'+cols.replace('<th scope="col">区分</th>','<th scope="col">GUN</th>')+'</tr></thead><tbody>'+grows+'</tbody></table></div></details>'+
    '<p class="gx-kicker">Source ledger: research/p71-oita-soil-shapefile-source-v1.json · 元ZIP・SHP・DBF・地物座標は公開していません。</p></section>';
}
