/* NaFT P73 Miyazaki: original-source derived soil GIS aggregates; raw geometries & unverified joins excluded. */
'use strict';
var GX_MIYAZAKI_SOURCE_SHA="2d2bd2bf4a29927698cc550c04850b850dd3aa5cf3f8ab357af2f6ad08024f51";
var GX_MIYAZAKI_LANDUSE=[["田",297],["普通畑",249],["牧草地",58],["樹園地",152]];
var GX_MIYAZAKI_CODE_PAIRS=[["43428","高千穂町",2,1,1,0],["45201","国富町",3,1,0,0],["45201","宮崎市",22,25,4,14],["45201","小林市",0,1,0,1],["45201","新富町",1,1,0,0],["45201","日南市",0,0,1,0],["45201","綾町",4,2,0,0],["45201","西都市",3,2,1,0],["45201","都城市",2,2,0,0],["45202","三股町",4,3,0,0],["45202","都城市",22,23,3,9],["45202","高原町",3,3,0,1],["45203","延岡市",21,19,5,11],["45203","日之影町",1,0,0,0],["45204","日南市",13,5,1,7],["45205","えびの市",3,1,0,1],["45205","小林市",9,11,5,8],["45205","綾町",1,0,0,0],["45205","高原町",4,2,1,0],["45206","日向市",14,12,3,7],["45206","美郷町",2,0,0,0],["45206","都農町",2,1,0,0],["45207","串間市",12,11,3,7],["45208","国富町",3,2,0,2],["45208","新富町",3,3,0,0],["45208","木城町",1,2,0,1],["45208","西都市",14,12,3,7],["45209","えびの市",10,6,2,3],["45341","三股町",9,8,0,3],["45361","高原町",8,6,2,2],["45382","国富町",12,6,1,4],["45382","綾町",2,1,0,0],["45383","綾町",3,4,2,4],["45401","川南町",2,2,0,0],["45401","新富町",2,2,2,2],["45401","木城町",5,2,0,1],["45401","高鍋町",7,7,2,2],["45402","新富町",7,6,2,4],["45403","西米良村",2,1,0,3],["45404","川南町",2,0,0,1],["45404","木城町",8,5,1,3],["45405","川南町",5,8,2,6],["45405","都農町",3,2,0,2],["45406","都農町",6,8,1,7],["45421","門川町",9,5,1,1],["45429","美郷町",1,0,0,0],["45429","諸塚村",3,4,1,3],["45430","椎葉村",1,1,1,2],["45430","美郷町",0,0,0,2],["45431","美郷町",10,9,4,11],["45441","高千穂町",5,3,2,3],["45442","日之影町",3,3,1,3],["45443","五ケ瀬町",3,5,0,4]];
var GX_MIYAZAKI_GUN_PAIRS=[["","えびの市",13,7,2,4],["","三股町",4,3,0,0],["","串間市",12,11,3,7],["","国富町",6,3,0,2],["","宮崎市",22,25,4,14],["","小林市",9,12,5,9],["","延岡市",21,19,5,11],["","新富町",4,4,0,0],["","日之影町",1,0,0,0],["","日南市",13,5,2,7],["","日向市",14,12,3,7],["","木城町",1,2,0,1],["","綾町",5,2,0,0],["","美郷町",2,0,0,0],["","西都市",17,14,4,7],["","都城市",24,25,3,9],["","都農町",2,1,0,0],["","高原町",7,5,1,1],["児湯郡","川南町",9,10,2,7],["児湯郡","新富町",9,8,4,6],["児湯郡","木城町",13,7,1,4],["児湯郡","西米良村",2,1,0,3],["児湯郡","都農町",9,10,1,9],["児湯郡","高鍋町",7,7,2,2],["北諸県郡","三股町",9,8,0,3],["東臼杵郡","椎葉村",1,1,1,2],["東臼杵郡","美郷町",11,9,4,13],["東臼杵郡","諸塚村",3,4,1,3],["東臼杵郡","門川町",9,5,1,1],["東諸県郡","国富町",12,6,1,4],["東諸県郡","綾町",5,5,2,4],["西臼杵郡","五ケ瀬町",3,5,0,4],["西臼杵郡","日之影町",3,3,1,3],["西臼杵郡","高千穂町",5,3,2,3],["西諸県郡","高原町",8,6,2,2],["阿蘇郡","高千穂町",2,1,1,0]];
var GX_MIYAZAKI_GUN_COUNTS=[["",438],["西諸県郡",18],["東諸県郡",39],["児湯郡",133],["東臼杵郡",69],["西臼杵郡",35],["北諸県郡",20],["阿蘇郡",4]];
function gxMiyazakiSoilValidate(){
  if(GX_MIYAZAKI_SOURCE_SHA!=='2d2bd2bf4a29927698cc550c04850b850dd3aa5cf3f8ab357af2f6ad08024f51')throw Error('P73_MIYAZAKI_SOURCE_SHA');
  if(GX_MIYAZAKI_CODE_PAIRS.length!==53||GX_MIYAZAKI_GUN_PAIRS.length!==36)throw Error('P73_MIYAZAKI_PAIR_COUNT');
  var ct=[0,0,0,0],gt=[0,0,0,0],codeNames=new Map(),nameCodes=new Map(),nameGuns=new Map(),seenCodes=new Set(),seenGuns=new Set(),foreign=0,foreignGun=0;
  GX_MIYAZAKI_CODE_PAIRS.forEach(function(r){
    if(r.length!==6||!/^\d{5}$/.test(r[0])||!r[1])throw Error('P73_MIYAZAKI_CODE_FORMAT');
    var id=r[0]+'|'+r[1];if(seenCodes.has(id))throw Error('P73_MIYAZAKI_CODE_DUP');seenCodes.add(id);
    if(!codeNames.has(r[0]))codeNames.set(r[0],new Set());codeNames.get(r[0]).add(r[1]);
    if(!nameCodes.has(r[1]))nameCodes.set(r[1],new Set());nameCodes.get(r[1]).add(r[0]);
    r.slice(2).forEach(function(n,i){if(!Number.isSafeInteger(n)||n<0)throw Error('P73_MIYAZAKI_CODE_VALUE');ct[i]+=n;});
    if(!r[0].startsWith('45')){if(r[0]!=='43428'||r[1]!=='高千穂町')throw Error('P73_MIYAZAKI_FOREIGN_CODE');foreign+=r.slice(2).reduce(function(a,b){return a+b;},0);}
  });
  if(codeNames.size!==27||nameCodes.size!==26||foreign!==4)throw Error('P73_MIYAZAKI_ADMIN_COUNTS');
  if([...codeNames.values()].filter(function(s){return s.size>1;}).length!==12||[...nameCodes.values()].filter(function(s){return s.size>1;}).length!==16)throw Error('P73_MIYAZAKI_ADMIN_AMBIGUITY');
  GX_MIYAZAKI_GUN_PAIRS.forEach(function(r){
    if(r.length!==6||!r[1])throw Error('P73_MIYAZAKI_GUN_FORMAT');
    var id=r[0]+'|'+r[1];if(seenGuns.has(id))throw Error('P73_MIYAZAKI_GUN_DUP');seenGuns.add(id);
    if(r[0]){if(!nameGuns.has(r[1]))nameGuns.set(r[1],new Set());nameGuns.get(r[1]).add(r[0]);}
    r.slice(2).forEach(function(n,i){if(!Number.isSafeInteger(n)||n<0)throw Error('P73_MIYAZAKI_GUN_VALUE');gt[i]+=n;});
    if(r[0]==='阿蘇郡')foreignGun+=r.slice(2).reduce(function(a,b){return a+b;},0);
  });
  if(JSON.stringify(ct)!==JSON.stringify([297,249,58,152])||JSON.stringify(gt)!==JSON.stringify(ct))throw Error('P73_MIYAZAKI_LAND_PARITY');
  if(foreignGun!==4||[...nameGuns.values()].filter(function(s){return s.size>1;}).length!==1||JSON.stringify([...nameGuns.get('高千穂町')].sort())!==JSON.stringify(['西臼杵郡','阿蘇郡']))throw Error('P73_MIYAZAKI_GUN_MULTIPLE');
  var g=Object.fromEntries(GX_MIYAZAKI_GUN_COUNTS);
  GX_MIYAZAKI_GUN_COUNTS.forEach(function(row){var actual=GX_MIYAZAKI_GUN_PAIRS.filter(function(r){return r[0]===row[0];}).reduce(function(s,r){return s+r.slice(2).reduce(function(a,b){return a+b;},0);},0);if(actual!==row[1])throw Error('P73_MIYAZAKI_GUN_PARITY');});
  if(g['']!==438||g['阿蘇郡']!==4||g['西臼杵郡']!==35)throw Error('P73_MIYAZAKI_GUN_TOTALS');
  return true;
}
function gxMiyazakiSoilPanel(prefCode){
  if(prefCode!=='45')return '';
  gxMiyazakiSoilValidate();
  var fmt=function(n){return Number(n).toLocaleString('ja-JP');};
  var cards=GX_MIYAZAKI_LANDUSE.map(function(r){return '<article class="gx-data-card"><span class="gx-kicker">地目区分 / Polygon features</span><strong>'+fmt(r[1])+' <small>件</small></strong><p>'+gxEsc(r[0])+'（農地面積haではありません）</p></article>';}).join('');
  var cf=new Map(),nf=new Map(),ng=new Map();
  GX_MIYAZAKI_CODE_PAIRS.forEach(function(r){cf.set(r[0],(cf.get(r[0])||0)+1);nf.set(r[1],(nf.get(r[1])||0)+1);});
  GX_MIYAZAKI_GUN_PAIRS.forEach(function(r){if(r[0]){if(!ng.has(r[1]))ng.set(r[1],new Set());ng.get(r[1]).add(r[0]);}});
  var crows=GX_MIYAZAKI_CODE_PAIRS.map(function(r){var w=[];if(!r[0].startsWith('45'))w.push('熊本県系JCODE');if(cf.get(r[0])>1||nf.get(r[1])>1)w.push('コード・名称の複数対応');return '<tr><th scope="row">'+gxEsc(r[1])+'</th><td>'+gxEsc(r[0])+'</td>'+r.slice(2).map(function(n){return '<td>'+fmt(n)+'</td>';}).join('')+'<td>'+gxEsc(w.length?w.join('／')+'・要照合':'原本値')+'</td></tr>';}).join('');
  var grows=GX_MIYAZAKI_GUN_PAIRS.map(function(r){var w=[];if(!r[0])w.push('郡名空欄');if(r[0]==='阿蘇郡')w.push('熊本県系郡名');if(r[0]&&ng.get(r[1])&&ng.get(r[1]).size>1)w.push('複数郡名対応');return '<tr><th scope="row">'+gxEsc(r[1])+'</th><td>'+gxEsc(r[0]||'（空欄）')+'</td>'+r.slice(2).map(function(n){return '<td>'+fmt(n)+'</td>';}).join('')+'<td>'+gxEsc(w.length?w.join('／')+'・要照合':'原本値')+'</td></tr>';}).join('');
  var heads='<th scope="col">市町村名</th><th scope="col">区分</th><th scope="col">田</th><th scope="col">普通畑</th><th scope="col">牧草地</th><th scope="col">樹園地</th><th scope="col">照合</th>';
  return '<section class="gx-dashboard" aria-labelledby="gx-miyazaki-soil-title">'+
    '<div class="gx-section-heading"><span class="gx-kicker">MIYAZAKI SOIL GIS · P73 · SOURCE-ONLY / ADMIN RECONCILIATION PENDING</span><h2 id="gx-miyazaki-soil-title">宮崎県の農耕地土壌GISを確認する。</h2><p>JGD2000・ポリゴン756件。田297件、普通畑249件、牧草地58件、樹園地152件。原本市町村名26種類、JCODE27種類、土壌群14種類・詳細分類68種類。原本XML作成日2017年1月17日。</p></div>'+
    '<p class="gx-anomaly"><b>原本行政属性の要照合：</b>熊本県系JCODE「43428」が高千穂町に4件（田2・普通畑1・牧草地1）、県外系郡名「阿蘇郡」も高千穂町に4件。高千穂町は「西臼杵郡」と「阿蘇郡」の両方が記録されています。郡名GUNは438件空欄。原本値を無断補正せず、現行自治体への自動JOINを保留します。ポリゴン件数は農地面積ha、GHG削減量、認証済み炭素クレジット数ではありません。</p>'+
    '<div class="gx-detail-grid">'+cards+'</div>'+
    '<details><summary>原本JCODE×市町村名53組合せ</summary><div class="scroll"><table><thead><tr>'+heads.replace('<th scope="col">区分</th>','<th scope="col">JCODE</th>')+'</tr></thead><tbody>'+crows+'</tbody></table></div></details>'+
    '<details><summary>原本GUN×市町村名36組合せ</summary><div class="scroll"><table><thead><tr>'+heads.replace('<th scope="col">区分</th>','<th scope="col">GUN</th>')+'</tr></thead><tbody>'+grows+'</tbody></table></div></details>'+
    '<p class="gx-kicker">Source ledger: research/p73-miyazaki-soil-shapefile-source-v1.json · 原本ZIP・SHP・DBF・地物座標は公開していません。</p></section>';
}
