/* NaFT P61 Okayama soil GIS: validated public aggregates; original shapefile and municipal JOIN are restricted. */
'use strict';
var GX_OKAYAMA_SOURCE_SHA="beb5ffe3f03d788641d952b9d51621ee1d70612d7bd544b82b03476d94b3b47d";
var GX_OKAYAMA_LANDUSE=[["田",489],["普通畑",337],["牧草地",74],["樹園地",251]];
var GX_OKAYAMA_CODE_PAIRS=[["28501","美作市",1,1,0,0],["31364","真庭市",0,1,0,0],["31403","真庭市",0,1,0,0],["33101","久米南町",6,0,0,0],["33101","倉敷市",6,0,0,0],["33101","北区",24,15,7,15],["33101","吉備中央町",2,0,1,0],["33101","東区",0,0,0,1],["33101","総社市",3,0,0,0],["33101","美咲町",2,0,0,0],["33101","赤磐市",4,0,1,1],["33102","中区",7,0,0,2],["33102","東区",5,0,0,1],["33103","東区",16,10,1,17],["33103","瀬戸内市",3,1,0,0],["33103","赤磐市",0,0,0,1],["33104","倉敷市",3,0,0,0],["33104","南区",9,8,2,6],["33104","早島町",1,1,0,0],["33104","玉野市",1,1,0,0],["33202","倉敷市",19,10,2,8],["33202","早島町",2,0,0,0],["33202","浅口市",1,0,0,1],["33202","総社市",3,0,0,1],["33203","勝央町",4,2,0,0],["33203","奈義町",1,0,0,0],["33203","津山市",26,20,2,6],["33203","真庭市",1,0,0,0],["33203","美咲町",7,1,0,0],["33203","鏡野町",4,0,0,0],["33204","玉野市",10,4,0,2],["33205","井原市",2,1,0,0],["33205","浅口市",0,1,0,1],["33205","矢掛町",1,1,0,1],["33205","笠岡市",11,13,0,8],["33205","里庄町",1,0,0,1],["33207","井原市",16,12,3,8],["33207","矢掛町",2,1,1,1],["33207","総社市",0,1,0,0],["33207","高梁市",2,3,1,1],["33208","吉備中央町",1,0,0,0],["33208","矢掛町",0,0,1,0],["33208","総社市",15,14,1,10],["33209","吉備中央町",2,0,0,0],["33209","新見市",1,2,1,1],["33209","真庭市",0,1,0,0],["33209","高梁市",21,23,7,14],["33210","新見市",21,22,10,16],["33210","真庭市",0,1,0,1],["33211","備前市",10,6,1,7],["33211","和気町",2,0,0,0],["33211","瀬戸内市",3,0,0,2],["33212","瀬戸内市",12,10,2,7],["33213","久米南町",0,1,0,0],["33213","和気町",2,0,0,0],["33213","美咲町",1,0,0,0],["33213","赤磐市",15,14,0,13],["33214","真庭市",27,26,17,25],["33214","美咲町",1,1,0,0],["33215","勝央町",5,2,0,3],["33215","和気町",1,0,0,0],["33215","奈義町",2,0,0,0],["33215","美作市",19,16,0,10],["33215","美咲町",3,2,0,0],["33216","浅口市",6,7,0,5],["33216","里庄町",3,0,0,1],["33346","和気町",8,8,0,6],["33423","早島町",4,2,0,2],["33445","里庄町",4,3,0,2],["33461","矢掛町",14,7,1,8],["33586","新庄村",7,4,2,0],["33606","鏡野町",14,15,1,6],["33622","勝央町",8,6,0,4],["33622","奈義町",3,1,0,0],["33623","奈義町",6,4,1,4],["33643","西粟倉村",5,1,0,1],["33663","久米南町",10,6,2,4],["33663","美咲町",2,0,0,0],["33666","美咲町",13,11,3,7],["33681","吉備中央町",12,12,3,9]];
var GX_OKAYAMA_GUN_PAIRS=[["","中区",7,0,0,2],["","久米南町",6,1,0,0],["","井原市",18,13,3,8],["","倉敷市",28,10,2,8],["","備前市",10,6,1,7],["","勝央町",9,4,0,3],["","北区",24,15,7,15],["","南区",9,8,2,6],["","吉備中央町",5,0,1,0],["","和気町",5,0,0,0],["","奈義町",3,0,0,0],["","新見市",22,24,11,17],["","早島町",3,1,0,0],["","東区",21,10,1,19],["","津山市",26,20,2,6],["","浅口市",7,8,0,7],["","瀬戸内市",18,11,2,9],["","玉野市",11,5,0,2],["","真庭市",28,28,17,26],["","矢掛町",3,2,2,2],["","笠岡市",11,13,0,8],["","総社市",21,15,1,11],["","美作市",19,16,0,10],["","美咲町",14,4,0,0],["","赤磐市",19,14,1,15],["","里庄町",4,0,0,2],["","鏡野町",4,0,0,0],["","高梁市",23,26,8,15],["久米郡","久米南町",10,6,2,4],["久米郡","美咲町",15,11,3,7],["佐用郡","美作市",1,1,0,0],["加賀郡","吉備中央町",12,12,3,9],["勝田郡","勝央町",8,6,0,4],["勝田郡","奈義町",9,5,1,4],["和気郡","和気町",8,8,0,6],["小田郡","矢掛町",14,7,1,8],["日野郡","真庭市",0,1,0,0],["東伯郡","真庭市",0,1,0,0],["浅口郡","里庄町",4,3,0,2],["真庭郡","新庄村",7,4,2,0],["苫田郡","鏡野町",14,15,1,6],["英田郡","西粟倉村",5,1,0,1],["都窪郡","早島町",4,2,0,2]];
var GX_OKAYAMA_GUN_COUNTS=[["",891],["久米郡",58],["加賀郡",36],["勝田郡",37],["和気郡",22],["小田郡",30],["都窪郡",8],["苫田郡",36],["浅口郡",9],["英田郡",7],["佐用郡",2],["真庭郡",13],["東伯郡",1],["日野郡",1]];
function gxOkayamaSoilValidate(){
  if(GX_OKAYAMA_SOURCE_SHA!=='beb5ffe3f03d788641d952b9d51621ee1d70612d7bd544b82b03476d94b3b47d')throw Error('P61_OKAYAMA_SOURCE_SHA');
  if(GX_OKAYAMA_CODE_PAIRS.length!==80||GX_OKAYAMA_GUN_PAIRS.length!==43)throw Error('P61_OKAYAMA_PAIR_LENGTH');
  var totals=[0,0,0,0],countyTotals=[0,0,0,0],codeNames=new Map(),nameCodes=new Map(),foreign={'28':0,'31':0},codeKeys=new Set(),countyKeys=new Set();
  GX_OKAYAMA_CODE_PAIRS.forEach(function(r){
    if(r.length!==6||!/^\d{5}$/.test(r[0])||!r[1])throw Error('P61_OKAYAMA_CODE_FORMAT');
    var key=r[0]+'|'+r[1];if(codeKeys.has(key))throw Error('P61_OKAYAMA_DUPLICATE_CODE');codeKeys.add(key);
    if(!codeNames.has(r[0]))codeNames.set(r[0],new Set());codeNames.get(r[0]).add(r[1]);
    if(!nameCodes.has(r[1]))nameCodes.set(r[1],new Set());nameCodes.get(r[1]).add(r[0]);
    r.slice(2).forEach(function(n,i){if(!Number.isSafeInteger(n)||n<0)throw Error('P61_OKAYAMA_CODE_COUNT');totals[i]+=n;});
    if(!r[0].startsWith('33')){var prefix=r[0].slice(0,2);if(!(prefix in foreign))throw Error('P61_OKAYAMA_FOREIGN_PREFIX');foreign[prefix]+=r.slice(2).reduce(function(s,n){return s+n;},0);}
  });
  if(codeNames.size!==33||nameCodes.size!==30||foreign['28']!==2||foreign['31']!==2)throw Error('P61_OKAYAMA_CODE_TOTAL');
  if([...codeNames.values()].filter(function(s){return s.size>1;}).length!==18||[...nameCodes.values()].filter(function(s){return s.size>1;}).length!==22)throw Error('P61_OKAYAMA_MANY_TO_MANY');
  GX_OKAYAMA_GUN_PAIRS.forEach(function(r){
    if(r.length!==6||!r[1])throw Error('P61_OKAYAMA_GUN_FORMAT');
    var key=r[0]+'|'+r[1];if(countyKeys.has(key))throw Error('P61_OKAYAMA_DUPLICATE_GUN');countyKeys.add(key);
    r.slice(2).forEach(function(n,i){if(!Number.isSafeInteger(n)||n<0)throw Error('P61_OKAYAMA_GUN_COUNT');countyTotals[i]+=n;});
  });
  if(JSON.stringify(totals)!==JSON.stringify([489,337,74,251])||JSON.stringify(countyTotals)!==JSON.stringify(totals))throw Error('P61_OKAYAMA_LANDUSE_MISMATCH');
  var c=Object.fromEntries(GX_OKAYAMA_GUN_COUNTS);
  GX_OKAYAMA_GUN_COUNTS.forEach(function(row){var sum=GX_OKAYAMA_GUN_PAIRS.filter(function(r){return r[0]===row[0];}).reduce(function(s,r){return s+r.slice(2).reduce(function(a,b){return a+b;},0);},0);if(sum!==row[1])throw Error('P61_OKAYAMA_GUN_MISMATCH');});
  if(c['']!==891||c['佐用郡']!==2||c['日野郡']!==1||c['東伯郡']!==1)throw Error('P61_OKAYAMA_FOREIGN_GUN');
  return true;
}
function gxOkayamaSoilPanel(prefCode){
  if(prefCode!=='33')return '';
  gxOkayamaSoilValidate();
  var fmt=function(n){return Number(n).toLocaleString('ja-JP');};
  var cards=GX_OKAYAMA_LANDUSE.map(function(r){return '<article class="gx-data-card"><span class="gx-kicker">地目区分 / Polygon features</span><strong>'+fmt(r[1])+' <small>件</small></strong><p>'+gxEsc(r[0])+'（農地面積haではありません）</p></article>';}).join('');
  var codeCounts=new Map(),nameCounts=new Map();
  GX_OKAYAMA_CODE_PAIRS.forEach(function(r){codeCounts.set(r[0],(codeCounts.get(r[0])||0)+1);nameCounts.set(r[1],(nameCounts.get(r[1])||0)+1);});
  var codeRows=GX_OKAYAMA_CODE_PAIRS.map(function(r){var warning=[];if(!r[0].startsWith('33'))warning.push('県外系JCODE');if(codeCounts.get(r[0])>1||nameCounts.get(r[1])>1)warning.push('複数対応');return '<tr><th scope="row">'+gxEsc(r[1])+'</th><td>'+gxEsc(r[0])+'</td>'+r.slice(2).map(function(n){return '<td>'+fmt(n)+'</td>';}).join('')+'<td>'+gxEsc((warning.length?warning.join('／'):'原本値')+(warning.length?'・要照合':''))+'</td></tr>';}).join('');
  var gunRows=GX_OKAYAMA_GUN_PAIRS.map(function(r){var warning=['佐用郡','日野郡','東伯郡'].includes(r[0])?'県外由来の郡名・要照合':!r[0]?'郡名空欄（原本値）':'原本値';return '<tr><th scope="row">'+gxEsc(r[1])+'</th><td>'+gxEsc(r[0]||'（空欄）')+'</td>'+r.slice(2).map(function(n){return '<td>'+fmt(n)+'</td>';}).join('')+'<td>'+gxEsc(warning)+'</td></tr>';}).join('');
  var header='<th scope="col">市町村・区名</th><th scope="col">区分</th><th scope="col">田</th><th scope="col">普通畑</th><th scope="col">牧草地</th><th scope="col">樹園地</th><th scope="col">照合</th>';
  return '<section class="gx-dashboard" aria-labelledby="gx-okayama-soil-title">'+
    '<div class="gx-section-heading"><span class="gx-kicker">OKAYAMA SOIL GIS · P61 · ORIGINAL ATTRIBUTES / ADMIN JOIN PENDING</span><h2 id="gx-okayama-soil-title">岡山県の農耕地土壌GISを確認する。</h2><p>JGD2000・ポリゴン1,151件。田489件、普通畑337件、牧草地74件、樹園地251件。原本の市町村・区名30種類、JCODE33種類、土壌群18種類、詳細分類85種類。原本XML作成日2017年1月17日。</p></div>'+
    '<p class="gx-anomaly"><b>行政属性の要照合：</b>岡山県の原本に県外系JCODEが4件（28系2件・31系2件）。郡名空欄891件、佐用郡2件・東伯郡1件・日野郡1件が混在。JCODE×名称80組の間に多対多の対応があるため、原本を無断補正せず現行市区町村統計への自動JOINは保留します。件数は面積・GHG削減量・炭素クレジットではありません。</p>'+
    '<div class="gx-detail-grid">'+cards+'</div>'+
    '<details><summary>原本JCODE×市町村・区名80組合せ</summary><div class="scroll"><table><thead><tr>'+header.replace('<th scope="col">区分</th>','<th scope="col">JCODE</th>')+'</tr></thead><tbody>'+codeRows+'</tbody></table></div></details>'+
    '<details><summary>原本GUN×市町村・区名43組合せ</summary><div class="scroll"><table><thead><tr>'+header.replace('<th scope="col">区分</th>','<th scope="col">GUN</th>')+'</tr></thead><tbody>'+gunRows+'</tbody></table></div></details>'+
    '<p class="gx-kicker">Source ledger: research/p61-okayama-soil-shapefile-source-v1.json · 元ZIP・SHP・DBF・ポリゴン座標は公開していません。</p></section>';
}
