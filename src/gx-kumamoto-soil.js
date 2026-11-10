/* NaFT P72 Kumamoto: audited derived soil GIS only. No raw geometry or unverified modern municipality JOIN. */
'use strict';
var GX_KUMAMOTO_SOURCE_SHA="313aa016909916a4400d209c297120eb8b719e94264c8263c7671dbecccecb78";
var GX_KUMAMOTO_LANDUSE=[["田",616],["普通畑",475],["牧草地",71],["樹園地",411]];
var GX_KUMAMOTO_CODE_PAIRS=[["40202","南関町",1,0,0,3],["40202","荒尾市",1,0,0,2],["40210","和水町",0,0,0,4],["40210","山鹿市",0,0,0,4],["43201","合志市",2,1,0,0],["43201","嘉島町",2,0,0,0],["43201","宇土市",1,0,0,0],["43201","宇城市",1,1,0,3],["43201","山鹿市",6,1,0,0],["43201","熊本市",24,18,0,14],["43201","玉名市",0,0,0,1],["43201","玉東町",2,0,0,3],["43201","甲佐町",2,1,0,1],["43201","益城町",3,2,0,0],["43201","菊池市",3,1,0,0],["43201","菊陽町",3,1,0,0],["43202","八代市",17,14,0,12],["43202","宇城市",1,1,0,1],["43202","氷川町",3,2,0,4],["43202","美里町",0,0,0,1],["43202","芦北町",0,1,0,1],["43203","人吉市",11,7,1,8],["43203","山江村",3,2,0,1],["43203","球磨村",3,0,0,3],["43203","相良村",1,0,0,0],["43203","錦町",2,1,0,1],["43204","南関町",0,0,0,1],["43204","玉名市",1,3,0,2],["43204","荒尾市",5,10,0,6],["43204","長洲町",2,4,0,3],["43205","水俣市",5,6,1,4],["43205","芦北町",1,0,0,0],["43206","南関町",0,2,0,0],["43206","和水町",1,0,0,3],["43206","玉名市",19,20,0,14],["43206","玉東町",1,0,0,2],["43206","長洲町",4,0,0,0],["43208","和水町",7,1,0,3],["43208","山鹿市",17,17,3,17],["43208","菊池市",4,0,0,1],["43210","合志市",6,2,0,0],["43210","大津町",1,3,0,0],["43210","菊池市",17,12,1,8],["43210","阿蘇市",0,0,1,0],["43211","宇土市",9,10,0,8],["43211","宇城市",4,2,0,3],["43212","上天草市",13,20,0,12],["43212","天草市",1,0,0,2],["43213","宇城市",25,17,0,19],["43213","氷川町",8,2,0,1],["43213","美里町",3,0,0,1],["43214","南小国町",0,1,1,0],["43214","南阿蘇村",4,0,1,0],["43214","大津町",0,0,1,0],["43214","産山村",0,3,2,0],["43214","阿蘇市",15,10,7,5],["43214","高森町",0,2,0,0],["43215","天草市",29,29,2,28],["43215","苓北町",0,1,0,2],["43216","合志市",8,7,0,3],["43216","大津町",1,0,0,0],["43216","菊陽町",1,1,0,0],["43348","山都町",2,0,0,0],["43348","甲佐町",1,1,0,2],["43348","美里町",12,9,0,13],["43364","玉東町",8,8,0,9],["43367","南関町",10,7,0,7],["43367","和水町",2,0,0,3],["43368","長洲町",7,5,0,2],["43369","和水町",14,13,0,11],["43403","大津町",4,4,0,2],["43403","益城町",0,1,0,0],["43403","菊陽町",2,3,0,1],["43403","西原村",1,2,0,1],["43404","菊陽町",4,3,0,3],["43423","南小国町",7,7,5,4],["43423","小国町",2,2,1,0],["43424","小国町",9,3,2,1],["43425","産山村",6,6,4,1],["43428","南阿蘇村",5,5,2,0],["43428","山都町",1,0,0,0],["43428","高森町",11,6,4,3],["43432","御船町",0,0,1,0],["43432","益城町",0,2,0,0],["43432","西原村",5,7,4,3],["43433","南阿蘇村",12,10,7,6],["43441","嘉島町",1,1,0,0],["43441","山都町",3,0,0,1],["43441","御船町",10,10,2,6],["43441","甲佐町",4,0,0,0],["43441","益城町",3,0,0,0],["43442","嘉島町",3,3,0,0],["43442","益城町",1,1,0,0],["43443","益城町",8,5,0,4],["43444","甲佐町",10,8,1,8],["43447","山都町",19,18,6,17],["43468","氷川町",9,4,0,7],["43482","津奈木町",1,0,0,1],["43482","球磨村",1,0,1,1],["43482","芦北町",11,10,1,12],["43484","津奈木町",7,3,0,7],["43501","あさぎり町",2,2,0,1],["43501","相良村",3,3,0,2],["43501","錦町",8,4,0,7],["43505","あさぎり町",8,2,0,1],["43505","多良木町",12,9,1,7],["43505","水上村",2,2,0,0],["43505","湯前町",5,0,0,0],["43506","水上村",3,0,0,0],["43506","湯前町",7,2,0,2],["43507","水上村",9,7,1,8],["43510","あさぎり町",0,2,0,1],["43510","山江村",1,0,1,2],["43510","相良村",7,5,3,6],["43511","五木村",2,4,0,2],["43512","山江村",3,2,0,2],["43513","球磨村",7,5,0,5],["43514","あさぎり町",11,11,2,8],["43531","苓北町",6,9,1,6]];
var GX_KUMAMOTO_GUN_PAIRS=[["","上天草市",13,20,0,12],["","人吉市",11,7,1,8],["","八代市",17,14,0,12],["","南小国町",0,1,1,0],["","南関町",1,2,0,4],["","南阿蘇村",4,0,1,0],["","合志市",16,10,0,3],["","和水町",8,1,0,10],["","嘉島町",2,0,0,0],["","大津町",2,3,1,0],["","天草市",30,29,2,30],["","宇土市",10,10,0,8],["","宇城市",31,21,0,26],["","山江村",3,2,0,1],["","山鹿市",23,18,3,21],["","水俣市",5,6,1,4],["","氷川町",11,4,0,5],["","熊本市",24,18,0,14],["","玉名市",20,23,0,17],["","玉東町",3,0,0,5],["","球磨村",3,0,0,3],["","産山村",0,3,2,0],["","甲佐町",2,1,0,1],["","益城町",3,2,0,0],["","相良村",1,0,0,0],["","美里町",3,0,0,2],["","芦北町",1,1,0,1],["","苓北町",0,1,0,2],["","荒尾市",6,10,0,8],["","菊池市",24,13,1,9],["","菊陽町",4,2,0,0],["","錦町",2,1,0,1],["","長洲町",6,4,0,3],["","阿蘇市",15,10,8,5],["","高森町",0,2,0,0],["上益城郡","嘉島町",4,4,0,0],["上益城郡","山都町",22,18,6,18],["上益城郡","御船町",10,10,2,6],["上益城郡","甲佐町",14,8,1,8],["上益城郡","益城町",12,6,0,4],["下益城郡","山都町",2,0,0,0],["下益城郡","甲佐町",1,1,0,2],["下益城郡","美里町",12,9,0,13],["八代郡","氷川町",9,4,0,7],["天草郡","苓北町",6,9,1,6],["玉名郡","南関町",10,7,0,7],["玉名郡","和水町",16,13,0,14],["玉名郡","玉東町",8,8,0,9],["玉名郡","長洲町",7,5,0,2],["球磨郡","あさぎり町",21,17,2,11],["球磨郡","五木村",2,4,0,2],["球磨郡","多良木町",12,9,1,7],["球磨郡","山江村",4,2,1,4],["球磨郡","水上村",14,9,1,8],["球磨郡","湯前町",12,2,0,2],["球磨郡","球磨村",7,5,0,5],["球磨郡","相良村",10,8,3,8],["球磨郡","錦町",8,4,0,7],["芦北郡","津奈木町",8,3,0,8],["芦北郡","球磨村",1,0,1,1],["芦北郡","芦北町",11,10,1,12],["菊池郡","大津町",4,4,0,2],["菊池郡","益城町",0,1,0,0],["菊池郡","菊陽町",6,6,0,4],["菊池郡","西原村",1,2,0,1],["阿蘇郡","南小国町",7,7,5,4],["阿蘇郡","南阿蘇村",17,15,9,6],["阿蘇郡","小国町",11,5,3,1],["阿蘇郡","山都町",1,0,0,0],["阿蘇郡","御船町",0,0,1,0],["阿蘇郡","産山村",6,6,4,1],["阿蘇郡","益城町",0,2,0,0],["阿蘇郡","西原村",5,7,4,3],["阿蘇郡","高森町",11,6,4,3]];
var GX_KUMAMOTO_GUN_COUNTS=[["",779],["球磨郡",212],["阿蘇郡",154],["上益城郡",153],["玉名郡",106],["芦北郡",56],["下益城郡",40],["菊池郡",31],["天草郡",22],["八代郡",20]];
function gxKumamotoSoilValidate(){
 if(GX_KUMAMOTO_SOURCE_SHA!=='313aa016909916a4400d209c297120eb8b719e94264c8263c7671dbecccecb78')throw Error('P72_KUMAMOTO_SOURCE_SHA');
 if(GX_KUMAMOTO_CODE_PAIRS.length!==119||GX_KUMAMOTO_GUN_PAIRS.length!==74)throw Error('P72_KUMAMOTO_PAIR_COUNT');
 var ct=[0,0,0,0],gt=[0,0,0,0],codes=new Map(),names=new Map(),guns=new Map(),seenCodes=new Set(),seenGuns=new Set(),foreign=0,blank=0;
 GX_KUMAMOTO_CODE_PAIRS.forEach(function(r){
  if(r.length!==6||!/^\d{5}$/.test(r[0])||!r[1])throw Error('P72_KUMAMOTO_CODE_FORMAT');
  var key=r[0]+'|'+r[1];if(seenCodes.has(key))throw Error('P72_KUMAMOTO_DUPLICATE_CODE_PAIR');seenCodes.add(key);
  if(!codes.has(r[0]))codes.set(r[0],new Set());codes.get(r[0]).add(r[1]);
  if(!names.has(r[1]))names.set(r[1],new Set());names.get(r[1]).add(r[0]);
  r.slice(2).forEach(function(n,i){if(!Number.isSafeInteger(n)||n<0)throw Error('P72_KUMAMOTO_INVALID_CODE_VALUE');ct[i]+=n;});
  if(!r[0].startsWith('43')){if(!r[0].startsWith('40'))throw Error('P72_KUMAMOTO_UNKNOWN_FOREIGN_CODE');foreign+=r.slice(2).reduce(function(a,b){return a+b;},0);}
 });
 if(codes.size!==47||names.size!==45||foreign!==15)throw Error('P72_KUMAMOTO_CODE_TOTALS');
 if([...codes.values()].filter(function(s){return s.size>1;}).length!==29||[...names.values()].filter(function(s){return s.size>1;}).length!==38)throw Error('P72_KUMAMOTO_CODE_AMBIGUITY');
 GX_KUMAMOTO_GUN_PAIRS.forEach(function(r){
  if(r.length!==6||!r[1])throw Error('P72_KUMAMOTO_GUN_FORMAT');
  var key=r[0]+'|'+r[1];if(seenGuns.has(key))throw Error('P72_KUMAMOTO_DUPLICATE_GUN_PAIR');seenGuns.add(key);
  if(r[0]){if(!guns.has(r[1]))guns.set(r[1],new Set());guns.get(r[1]).add(r[0]);}
  r.slice(2).forEach(function(n,i){if(!Number.isSafeInteger(n)||n<0)throw Error('P72_KUMAMOTO_INVALID_GUN_VALUE');gt[i]+=n;});
 });
 if(JSON.stringify(ct)!==JSON.stringify([616,475,71,411])||JSON.stringify(gt)!==JSON.stringify(ct))throw Error('P72_KUMAMOTO_LAND_PARITY');
 if([...guns.values()].filter(function(s){return s.size>1;}).length!==6)throw Error('P72_KUMAMOTO_GUN_MULTIPLE');
 var g=Object.fromEntries(GX_KUMAMOTO_GUN_COUNTS);
 GX_KUMAMOTO_GUN_COUNTS.forEach(function(v){var observed=GX_KUMAMOTO_GUN_PAIRS.filter(function(r){return r[0]===v[0];}).reduce(function(s,r){return s+r.slice(2).reduce(function(a,b){return a+b;},0);},0);if(observed!==v[1])throw Error('P72_KUMAMOTO_GUN_PARITY');});
 if(g['']!==779||g['芦北郡']!==56||g['球磨郡']!==212||g['阿蘇郡']!==154)throw Error('P72_KUMAMOTO_GUN_COUNTS');
 return true;
}
function gxKumamotoSoilPanel(prefCode){
 if(prefCode!=='43')return '';
 gxKumamotoSoilValidate();
 var fmt=function(n){return Number(n).toLocaleString('ja-JP');};
 var cards=GX_KUMAMOTO_LANDUSE.map(function(r){return '<article class="gx-data-card"><span class="gx-kicker">地目区分 / Polygon features</span><strong>'+fmt(r[1])+' <small>件</small></strong><p>'+gxEsc(r[0])+'（農地面積haではありません）</p></article>';}).join('');
 var cf=new Map(),nf=new Map(),ng=new Map();
 GX_KUMAMOTO_CODE_PAIRS.forEach(function(r){cf.set(r[0],(cf.get(r[0])||0)+1);nf.set(r[1],(nf.get(r[1])||0)+1);});
 GX_KUMAMOTO_GUN_PAIRS.forEach(function(r){if(r[0]){if(!ng.has(r[1]))ng.set(r[1],new Set());ng.get(r[1]).add(r[0]);}});
 var codes=GX_KUMAMOTO_CODE_PAIRS.map(function(r){var w=[];if(!r[0].startsWith('43'))w.push('福岡県系JCODE');if(cf.get(r[0])>1||nf.get(r[1])>1)w.push('コード・名称の複数対応');return '<tr><th scope="row">'+gxEsc(r[1])+'</th><td>'+gxEsc(r[0])+'</td>'+r.slice(2).map(function(x){return '<td>'+fmt(x)+'</td>';}).join('')+'<td>'+gxEsc(w.length?w.join('／')+'・要照合':'原本値')+'</td></tr>';}).join('');
 var guns=GX_KUMAMOTO_GUN_PAIRS.map(function(r){var w=[];if(!r[0])w.push('郡名空欄');if(r[0]&&ng.get(r[1])&&ng.get(r[1]).size>1)w.push('複数郡名対応');return '<tr><th scope="row">'+gxEsc(r[1])+'</th><td>'+gxEsc(r[0]||'（空欄）')+'</td>'+r.slice(2).map(function(x){return '<td>'+fmt(x)+'</td>';}).join('')+'<td>'+gxEsc(w.length?w.join('／')+'・要照合':'原本値')+'</td></tr>';}).join('');
 var h='<th scope="col">市町村名</th><th scope="col">区分</th><th scope="col">田</th><th scope="col">普通畑</th><th scope="col">牧草地</th><th scope="col">樹園地</th><th scope="col">照合</th>';
 return '<section class="gx-dashboard" aria-labelledby="gx-kumamoto-soil-title">'+
  '<div class="gx-section-heading"><span class="gx-kicker">KUMAMOTO SOIL GIS · P72 · SOURCE ATTRIBUTES / ADMIN RECONCILIATION PENDING</span><h2 id="gx-kumamoto-soil-title">熊本県の農耕地土壌GISを確認する。</h2><p>JGD2000・ポリゴン1,573件。田616件、普通畑475件、牧草地71件、樹園地411件。市町村名45種類、JCODE47種類、土壌群19種類・詳細分類95種類。原本XML作成日2017年1月17日。</p></div>'+
  '<p class="gx-anomaly"><b>行政属性の要照合：</b>福岡県系JCODEが15件（40202・40210）。原本の郡名は779件が空欄で、御船町・甲佐町・山都町・球磨村・益城町・西原村は複数の非空郡名に対応します。「芦北郡」は熊本県内の原本表記として保持しています。行政コード・郡名は無断で補正せず、現行自治体統計への自動JOINは保留します。ポリゴン数は農地面積ha、GHG削減量、認証済み炭素クレジット数ではありません。</p>'+
  '<div class="gx-detail-grid">'+cards+'</div>'+
  '<details><summary>原本JCODE×市町村名119組合せ</summary><div class="scroll"><table><thead><tr>'+h.replace('<th scope="col">区分</th>','<th scope="col">JCODE</th>')+'</tr></thead><tbody>'+codes+'</tbody></table></div></details>'+
  '<details><summary>原本GUN×市町村名74組合せ</summary><div class="scroll"><table><thead><tr>'+h.replace('<th scope="col">区分</th>','<th scope="col">GUN</th>')+'</tr></thead><tbody>'+guns+'</tbody></table></div></details>'+
  '<p class="gx-kicker">Source ledger: research/p72-kumamoto-soil-shapefile-source-v1.json · 元ZIP・SHP・DBF・地物座標は公開していません。</p></section>';
}
