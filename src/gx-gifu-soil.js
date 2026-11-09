/* NaFT P49 · Gifu agricultural soil GIS. Derived counts only; source code/GUN/soil-class anomalies retained. */
'use strict';
var GX_GIFU_SOURCE_HASH="aacfafa39e6864d1407d25e0190e33b8163d451e56dfaabf7b347797e5926edd";
var GX_GIFU_LANDUSE=[["田",758],["普通畑",617],["牧草地",101],["樹園地",466]];
var GX_GIFU_CODE_NAME_PAIRS=[["16201","飛騨市",0,1,0,0],["16210","白川村",1,0,0,0],["20423","中津川市",1,0,0,0],["21201","北方町",3,0,0,0],["21201","各務原市",5,3,0,0],["21201","山県市",6,0,0,0],["21201","岐南町",0,1,0,0],["21201","岐阜市",21,19,0,16],["21201","本巣市",5,0,0,4],["21201","瑞穂市",1,1,0,0],["21201","笠松町",5,1,0,0],["21201","羽島市",0,3,0,1],["21201","関市",1,0,0,0],["21202","垂井町",5,0,0,2],["21202","大垣市",19,15,0,20],["21202","安八町",3,3,0,1],["21202","池田町",3,1,0,0],["21202","神戸町",8,0,0,1],["21202","輪之内町",0,1,0,0],["21202","養老町",4,2,0,0],["21203","郡上市",0,2,1,0],["21203","飛騨市",3,2,0,0],["21203","高山市",29,36,21,25],["21204","可児市",1,0,0,0],["21204","多治見市",11,7,0,2],["21205","坂祝町",1,1,0,0],["21205","富加町",2,1,0,0],["21205","山県市",2,0,0,0],["21205","美濃加茂市",2,2,0,0],["21205","美濃市",5,3,0,0],["21205","関市",25,20,1,19],["21206","中津川市",25,27,14,30],["21206","恵那市",5,1,0,1],["21207","美濃市",8,6,0,6],["21208","御嵩町",1,0,0,0],["21208","恵那市",3,0,0,1],["21208","瑞浪市",15,13,5,5],["21209","海津市",2,3,0,0],["21209","笠松町",7,3,0,0],["21209","羽島市",14,13,0,10],["21209","輪之内町",0,0,0,1],["21210","恵那市",26,32,13,24],["21211","可児市",0,1,0,0],["21211","坂祝町",5,4,0,2],["21211","富加町",9,3,0,1],["21211","川辺町",4,1,0,2],["21211","美濃加茂市",18,15,2,14],["21212","土岐市",11,8,1,1],["21213","各務原市",16,18,0,9],["21213","岐南町",1,1,0,0],["21213","笠松町",1,2,0,0],["21214","可児市",10,12,1,9],["21214","坂祝町",0,1,0,0],["21214","御嵩町",4,2,0,2],["21215","山県市",22,16,1,12],["21216","北方町",0,2,0,1],["21216","安八町",3,2,0,0],["21216","本巣市",4,1,0,2],["21216","瑞穂市",12,5,0,13],["21216","神戸町",0,1,0,1],["21217","飛騨市",19,18,7,9],["21218","北方町",1,0,0,3],["21218","揖斐川町",4,0,0,0],["21218","本巣市",25,19,0,22],["21219","郡上市",25,27,14,19],["21220","下呂市",19,23,11,17],["21221","海津市",18,20,0,17],["21221","輪之内町",4,1,0,0],["21221","養老町",4,3,0,1],["21302","岐南町",6,5,0,0],["21302","笠松町",3,2,0,0],["21303","笠松町",11,10,0,0],["21341","垂井町",3,0,0,1],["21341","輪之内町",1,1,0,0],["21341","養老町",14,10,0,7],["21361","垂井町",14,14,4,6],["21361","関ケ原町",3,0,0,1],["21362","関ケ原町",8,3,0,7],["21381","大野町",1,0,0,1],["21381","池田町",1,0,0,0],["21381","神戸町",9,7,0,5],["21382","安八町",1,1,1,0],["21382","輪之内町",7,3,1,2],["21383","安八町",7,4,0,1],["21401","大野町",2,0,0,0],["21401","揖斐川町",22,19,0,16],["21401","池田町",2,1,0,0],["21403","大野町",14,8,0,13],["21404","池田町",7,6,0,6],["21421","北方町",5,3,0,2],["21501","坂祝町",12,10,0,9],["21502","富加町",14,10,0,9],["21503","七宗町",1,2,0,0],["21503","八百津町",3,0,0,0],["21503","川辺町",9,11,0,4],["21504","七宗町",12,13,0,11],["21505","八百津町",11,12,0,15],["21506","白川町",14,13,1,13],["21507","東白川村",7,8,0,8],["21521","御嵩町",7,6,0,3],["21604","白川村",10,6,2,0]];
var GX_GIFU_GUN=[["",1363],["不破郡",60],["加茂郡",232],["可児郡",16],["大野郡",18],["安八郡",52],["揖斐郡",116],["木曽郡",1],["本巣郡",10],["羽島郡",37],["養老郡",37]];
var GX_GIFU_GUN_NAME_PAIRS=[["","下呂市",19,23,11,17],["","中津川市",25,27,14,30],["","北方町",4,2,0,4],["","可児市",11,13,1,9],["","各務原市",21,21,0,9],["","土岐市",11,8,1,1],["","坂祝町",6,6,0,2],["","垂井町",5,0,0,2],["","多治見市",11,7,0,2],["","大垣市",19,15,0,20],["","安八町",6,5,0,1],["","富加町",11,4,0,1],["","山県市",30,16,1,12],["","岐南町",1,2,0,0],["","岐阜市",21,19,0,16],["","川辺町",4,1,0,2],["","御嵩町",5,2,0,2],["","恵那市",34,33,13,26],["","揖斐川町",4,0,0,0],["","本巣市",34,20,0,28],["","池田町",3,1,0,0],["","海津市",20,23,0,17],["","瑞浪市",15,13,5,5],["","瑞穂市",13,6,0,13],["","白川村",1,0,0,0],["","神戸町",8,1,0,2],["","笠松町",13,6,0,0],["","美濃加茂市",20,17,2,14],["","美濃市",13,9,0,6],["","羽島市",14,16,0,11],["","輪之内町",4,2,0,1],["","郡上市",25,29,15,19],["","関市",26,20,1,19],["","飛騨市",22,21,7,9],["","養老町",8,5,0,1],["","高山市",29,36,21,25],["不破郡","垂井町",14,14,4,6],["不破郡","関ケ原町",11,3,0,8],["加茂郡","七宗町",13,15,0,11],["加茂郡","八百津町",14,12,0,15],["加茂郡","坂祝町",12,10,0,9],["加茂郡","富加町",14,10,0,9],["加茂郡","川辺町",9,11,0,4],["加茂郡","東白川村",7,8,0,8],["加茂郡","白川町",14,13,1,13],["可児郡","御嵩町",7,6,0,3],["大野郡","白川村",10,6,2,0],["安八郡","大野町",1,0,0,1],["安八郡","安八町",8,5,1,1],["安八郡","池田町",1,0,0,0],["安八郡","神戸町",9,7,0,5],["安八郡","輪之内町",7,3,1,2],["揖斐郡","大野町",16,8,0,13],["揖斐郡","揖斐川町",22,19,0,16],["揖斐郡","池田町",9,7,0,6],["木曽郡","中津川市",1,0,0,0],["本巣郡","北方町",5,3,0,2],["羽島郡","岐南町",6,5,0,0],["羽島郡","笠松町",14,12,0,0],["養老郡","垂井町",3,0,0,1],["養老郡","輪之内町",1,1,0,0],["養老郡","養老町",14,10,0,7]];
var GX_GIFU_MULTI_GUN={"垂井町":["不破郡","養老郡"],"大野町":["安八郡","揖斐郡"],"池田町":["安八郡","揖斐郡"],"輪之内町":["安八郡","養老郡"]};
var GX_GIFU_BLANK_TAXONOMY=[{"jcode":"21211","municipality_name":"美濃加茂市","gun":"","landuse":"田","group_code":"","fine_class":"","subgroup_code":"","series_code":""}];
function gxGifuSoilValidate(){
 var categories=[758,617,101,466],totals=[0,0,0,0],gtotals=[0,0,0,0];
 if(GX_GIFU_CODE_NAME_PAIRS.length!==101||GX_GIFU_GUN_NAME_PAIRS.length!==62||GX_GIFU_LANDUSE.length!==4)throw Error('P49_GIFU_ROW_LENGTH');
 var cn=new Map(),nc=new Map(),foreign={'16':0,'20':0},foreignPairs=0,codePairs=new Set();
 GX_GIFU_CODE_NAME_PAIRS.forEach(function(r){
  if(r.length!==6||!/^(16|20|21)[0-9]{3}$/.test(r[0])||!r[1])throw Error('P49_GIFU_CODE');
  var key=r[0]+'|'+r[1];if(codePairs.has(key))throw Error('P49_GIFU_CODE_DUP');codePairs.add(key);
  if(!cn.has(r[0]))cn.set(r[0],new Set());cn.get(r[0]).add(r[1]);
  if(!nc.has(r[1]))nc.set(r[1],new Set());nc.get(r[1]).add(r[0]);
  var n=r.slice(2).reduce(function(s,v,i){if(!Number.isSafeInteger(v)||v<0)throw Error('P49_GIFU_CODE_COUNT');totals[i]+=v;return s+v;},0);
  if(!r[0].startsWith('21')){foreign[r[0].slice(0,2)]+=n;foreignPairs++;}
 });
 if(cn.size!==45||nc.size!==42||foreign['16']!==2||foreign['20']!==1||foreignPairs!==3)throw Error('P49_GIFU_FOREIGN_CODE');
 if([...cn.values()].filter(function(v){return v.size>1;}).length!==21||[...nc.values()].filter(function(v){return v.size>1;}).length!==33)throw Error('P49_GIFU_CODE_NAME_MANY');
 if(totals.some(function(v,i){return v!==categories[i];})||totals.reduce(function(a,b){return a+b;},0)!==1942)throw Error('P49_GIFU_LAND_TOTAL');
 GX_GIFU_LANDUSE.forEach(function(r,i){if(r[1]!==totals[i])throw Error('P49_GIFU_LAND_ROW');});
 var gunCount=new Map(),gunNames=new Map(),gunPairs=new Set();
 GX_GIFU_GUN_NAME_PAIRS.forEach(function(r){
  if(r.length!==6||!r[1])throw Error('P49_GIFU_GUN');
  var key=r[0]+'|'+r[1];if(gunPairs.has(key))throw Error('P49_GIFU_GUN_DUP');gunPairs.add(key);
  var n=r.slice(2).reduce(function(s,v,i){if(!Number.isSafeInteger(v)||v<0)throw Error('P49_GIFU_GUN_COUNT');gtotals[i]+=v;return s+v;},0);
  gunCount.set(r[0],(gunCount.get(r[0])||0)+n);
  if(r[0]){if(!gunNames.has(r[1]))gunNames.set(r[1],new Set());gunNames.get(r[1]).add(r[0]);}
 });
 if(gtotals.some(function(v,i){return v!==totals[i];}))throw Error('P49_GIFU_GUN_LAND');
 if(GX_GIFU_GUN.length!==11||GX_GIFU_GUN.some(function(r){return gunCount.get(r[0])!==r[1];})||gunCount.get('')!==1363||gunCount.get('木曽郡')!==1)throw Error('P49_GIFU_GUN_PARITY');
 var blanks=GX_GIFU_GUN_NAME_PAIRS.filter(function(r){return !r[0]&&gunNames.has(r[1]);});
 if(blanks.length!==16||blanks.reduce(function(s,r){return s+r.slice(2).reduce(function(a,b){return a+b;},0);},0)!==234)throw Error('P49_GIFU_BLANK_GUN');
 if(Object.keys(GX_GIFU_MULTI_GUN).length!==4||Object.keys(GX_GIFU_MULTI_GUN).some(function(k){return !gunNames.has(k)||JSON.stringify([...gunNames.get(k)].sort())!==JSON.stringify(GX_GIFU_MULTI_GUN[k]);}))throw Error('P49_GIFU_MULTIPLE_GUN');
 if(GX_GIFU_BLANK_TAXONOMY.length!==1||GX_GIFU_BLANK_TAXONOMY[0].jcode!=='21211'||GX_GIFU_BLANK_TAXONOMY[0].municipality_name!=='美濃加茂市'||GX_GIFU_BLANK_TAXONOMY[0].landuse!=='田'||GX_GIFU_BLANK_TAXONOMY[0].group_code!==''||GX_GIFU_BLANK_TAXONOMY[0].fine_class!=='')throw Error('P49_GIFU_SOIL_BLANK');
 return true;
}
function gxGifuSoilPanel(prefCode){
 if(prefCode!=='21')return '';
 gxGifuSoilValidate();
 var fmt=function(n){return Number(n).toLocaleString('ja-JP');};
 var cards=GX_GIFU_LANDUSE.map(function(r){return '<article class="gx-data-card"><span class="gx-kicker">地目区分 / Polygon features</span><strong>'+fmt(r[1])+' <small>件</small></strong><p>'+gxEsc(r[0])+'（面積haではありません）</p></article>';}).join('');
 var codes=new Map(),names=new Map();
 GX_GIFU_CODE_NAME_PAIRS.forEach(function(r){codes.set(r[0],(codes.get(r[0])||0)+1);names.set(r[1],(names.get(r[1])||0)+1);});
 var codeHead='<thead><tr><th scope="col">市町村名（原本）</th><th scope="col">JCODE</th><th>田</th><th>普通畑</th><th>牧草地</th><th>樹園地</th><th>計</th><th>照合状態</th></tr></thead>';
 var codeRows=GX_GIFU_CODE_NAME_PAIRS.map(function(r){
  var flags=[];if(!r[0].startsWith('21'))flags.push('県外コード'+r[0].slice(0,2));
  if(codes.get(r[0])>1||names.get(r[1])>1)flags.push('コード・名称複数対応');
  return '<tr><th scope="row">'+gxEsc(r[1])+'</th><td>'+gxEsc(r[0])+'</td>'+r.slice(2).map(function(v){return '<td>'+fmt(v)+'</td>';}).join('')+'<td>'+fmt(r.slice(2).reduce(function(a,b){return a+b;},0))+'</td><td>'+(flags.length?gxEsc(flags.join('／'))+'・要照合':'原本値')+'</td></tr>';
 }).join('');
 var gunNameByTown=new Map();
 GX_GIFU_GUN_NAME_PAIRS.forEach(function(r){if(r[0]){if(!gunNameByTown.has(r[1]))gunNameByTown.set(r[1],new Set());gunNameByTown.get(r[1]).add(r[0]);}});
 var gunHead='<thead><tr><th scope="col">郡名（原本）</th><th scope="col">ポリゴン件数</th><th scope="col">照合状態</th></tr></thead>';
 var gunRows=GX_GIFU_GUN.filter(function(r){return r[0]!=='';}).map(function(r){return '<tr><th scope="row">'+gxEsc(r[0])+'</th><td>'+fmt(r[1])+'</td><td>'+(r[0]==='木曽郡'?'県外郡名・要照合':'原本値')+'</td></tr>';}).join('');
 var gunDetail=GX_GIFU_GUN_NAME_PAIRS.map(function(r){
  var flags=[];
  if(r[0]==='木曽郡')flags.push('長野県の郡名');
  if(!r[0]&&gunNameByTown.has(r[1]))flags.push('郡名空欄');
  if(GX_GIFU_MULTI_GUN[r[1]])flags.push('同一名称に複数郡名');
  return '<tr><th scope="row">'+gxEsc(r[1])+'</th><td>'+gxEsc(r[0]||'（空欄）')+'</td>'+r.slice(2).map(function(v){return '<td>'+fmt(v)+'</td>';}).join('')+'<td>'+(flags.length?gxEsc(flags.join('／'))+'・要照合':'原本値')+'</td></tr>';
 }).join('');
 var missing=GX_GIFU_BLANK_TAXONOMY[0];
 return '<section class="gx-dashboard" aria-labelledby="gx-gifu-soil-title">'+
  '<div class="gx-section-heading"><span class="gx-kicker">GIFU SOIL GIS · P49 · ORIGINAL ATTRIBUTE AUDIT</span>'+
  '<h2 id="gx-gifu-soil-title">岐阜県の農耕地土壌GISを確認する。</h2>'+
  '<p>原本JGD2000の農耕地土壌ポリゴン1,942件。田758件、普通畑617件、牧草地101件、樹園地466件。市町村名42種類、JCODE45種類、組合せ101通り。土壌群コード17種類・詳細分類80種類（いずれも空欄を1分類として計数）。原本XML作成日は2017年1月17日。</p></div>'+
  '<p class="gx-anomaly"><b>コード・郡名・土壌分類を要照合：</b>岐阜県「21」以外のJCODEが3件（富山県「16」系2、長野県「20」系1）。21コードが複数市町村名に、33名称が複数JCODEに対応。中津川市に長野県の「木曽郡」が付いた田1件、郡名が空欄でも同一名称に郡名付きデータが存在する234件を確認。大野町・池田町・垂井町・輪之内町にはそれぞれ複数の郡名が記録。美濃加茂市の田1件では土壌群コード・詳細分類名が空欄。原本の属性を修正せず、自動JOINや土壌分類の推定補完は保留。</p>'+
  '<div class="gx-detail-grid">'+cards+'</div>'+
  '<details><summary>原本のGUN（郡名）別件数を確認する</summary><div class="scroll"><table>'+gunHead+'<tbody>'+gunRows+'</tbody></table></div><p>郡名空欄1,363件、郡名付き579件。県外の「木曽郡」1件も原本の値で、正式な郡別農地面積ではありません。</p></details>'+
  '<details><summary>原本のGUN×市町村名62組合せを見る（要照合）</summary><div class="scroll"><table><thead><tr><th>市町村名</th><th>GUN</th><th>田</th><th>普通畑</th><th>牧草地</th><th>樹園地</th><th>照合状態</th></tr></thead><tbody>'+gunDetail+'</tbody></table></div></details>'+
  '<details><summary>原本のJCODE×市町村名101組合せを見る（要照合）</summary><div class="scroll"><table>'+codeHead+'<tbody>'+codeRows+'</tbody></table></div></details>'+
  '<details><summary>原本で土壌分類が空欄の1件を見る</summary><p>JCODE '+gxEsc(missing.jcode)+'／'+gxEsc(missing.municipality_name)+'／田1ポリゴン。土壌群コード、統群・亜群コード、詳細分類名が空欄。原因不明のため他の分類へ推定補完しません。</p></details>'+
  '<p class="gx-advisory"><b>出典・科学的境界：</b>農研機構「日本土壌インベントリー」は配布元候補ですが、公式岐阜県ZIPとのハッシュ一致と適用ライセンスは未確認。生Shapefile・DBF・ZIPは公開GitHubに複製せず、ハッシュと派生集計を掲載。ポリゴン数は農地面積ha、農地筆数、CH₄実測、土壌炭素量、CO₂e削減量、認証済クレジットではありません。2024年水稲統計・JAXAデータとの自治体コードJOINは要照合。原本監査台帳：research/p49-gifu-soil-shapefile-source-v1.json。検証：docs/p49-gifu-soil-gis-ja.md。</p></section>';
}
