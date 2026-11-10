/* NaFT P70 Nagasaki: derived agricultural soil source attributes; no licensed geometry, no unsafe auto-JOIN. */
'use strict';
var GX_NAGASAKI_SOURCE_SHA="b164c6fdbdea997356b05f6658005d2acc855916d2837ec459aed994fc764b1e";
var GX_NAGASAKI_LANDUSE=[["田",327],["普通畑",290],["牧草地",27],["樹園地",219]];
var GX_NAGASAKI_CODE_PAIRS=[["41205","松浦市",3,0,0,0],["41206","波佐見町",1,1,0,1],["41209","東彼杵町",0,0,0,2],["41401","佐世保市",1,1,0,0],["41401","波佐見町",1,1,0,1],["41441","諫早市",1,1,0,4],["42201","時津町",0,2,0,0],["42201","西海市",4,1,0,2],["42201","諫早市",2,2,0,1],["42201","長与町",0,0,0,1],["42201","長崎市",24,17,4,16],["42202","佐々町",2,1,0,0],["42202","佐世保市",27,21,3,15],["42202","川棚町",0,0,0,1],["42202","平戸市",3,0,0,0],["42202","松浦市",1,1,0,2],["42202","波佐見町",0,0,0,1],["42203","南島原市",0,2,0,0],["42203","島原市",10,15,1,4],["42203","雲仙市",2,3,0,0],["42204","大村市",0,2,0,2],["42204","諫早市",27,26,1,18],["42204","長与町",0,0,1,1],["42204","雲仙市",3,1,0,0],["42205","大村市",21,11,3,17],["42205","東彼杵町",0,0,0,1],["42207","平戸市",21,18,0,7],["42207","松浦市",2,1,0,0],["42208","松浦市",23,15,0,11],["42209","対馬市",10,13,6,7],["42210","壱岐市",15,8,0,2],["42211","五島市",13,20,4,5],["42212","西海市",17,12,1,15],["42213","南島原市",0,2,1,1],["42213","雲仙市",15,22,2,11],["42214","南島原市",16,17,0,13],["42307","時津町",0,0,0,3],["42307","長与町",6,4,0,8],["42308","時津町",7,5,0,9],["42321","東彼杵町",8,7,0,8],["42322","川棚町",9,7,0,5],["42322","波佐見町",1,2,0,0],["42323","波佐見町",12,5,0,9],["42383","小値賀町",2,4,0,0],["42391","佐々町",15,10,0,8],["42411","新上五島町",2,9,0,7]];
var GX_NAGASAKI_GUN_PAIRS=[["","五島市",13,20,4,5],["","佐々町",2,1,0,0],["","佐世保市",27,21,3,15],["","南島原市",16,21,1,14],["","壱岐市",15,8,0,2],["","大村市",21,13,3,19],["","対馬市",10,13,6,7],["","島原市",10,15,1,4],["","川棚町",0,0,0,1],["","平戸市",24,18,0,7],["","時津町",0,2,0,0],["","東彼杵町",0,0,0,3],["","松浦市",29,17,0,13],["","波佐見町",1,1,0,2],["","西海市",21,13,1,17],["","諫早市",29,28,1,19],["","長与町",0,0,1,2],["","長崎市",24,17,4,16],["","雲仙市",20,26,2,11],["北松浦郡","佐々町",15,10,0,8],["北松浦郡","小値賀町",2,4,0,0],["南松浦郡","新上五島町",2,9,0,7],["東彼杵郡","川棚町",9,7,0,5],["東彼杵郡","東彼杵町",8,7,0,8],["東彼杵郡","波佐見町",13,7,0,9],["藤津郡","諫早市",1,1,0,4],["西彼杵郡","時津町",7,5,0,12],["西彼杵郡","長与町",6,4,0,8],["西松浦郡","佐世保市",1,1,0,0],["西松浦郡","波佐見町",1,1,0,1]];
var GX_NAGASAKI_GUN_COUNTS=[["",680],["東彼杵郡",73],["西彼杵郡",42],["北松浦郡",39],["南松浦郡",18],["藤津郡",6],["西松浦郡",5]];
function gxNagasakiSoilValidate(){
  if(GX_NAGASAKI_SOURCE_SHA!=='b164c6fdbdea997356b05f6658005d2acc855916d2837ec459aed994fc764b1e')throw Error('P70_NAGASAKI_SOURCE_SHA');
  if(GX_NAGASAKI_CODE_PAIRS.length!==46||GX_NAGASAKI_GUN_PAIRS.length!==30)throw Error('P70_NAGASAKI_PAIR_COUNT');
  var ct=[0,0,0,0],gt=[0,0,0,0],codeNames=new Map(),nameCodes=new Map(),nameGuns=new Map(),seenC=new Set(),seenG=new Set(),foreign=0,foreignGuns=0;
  GX_NAGASAKI_CODE_PAIRS.forEach(function(r){
    if(r.length!==6||!/^\d{5}$/.test(r[0])||!r[1])throw Error('P70_NAGASAKI_CODE_FORMAT');
    var key=r[0]+'|'+r[1];if(seenC.has(key))throw Error('P70_NAGASAKI_DUP_CODE');seenC.add(key);
    if(!codeNames.has(r[0]))codeNames.set(r[0],new Set());codeNames.get(r[0]).add(r[1]);
    if(!nameCodes.has(r[1]))nameCodes.set(r[1],new Set());nameCodes.get(r[1]).add(r[0]);
    r.slice(2).forEach(function(n,i){if(!Number.isSafeInteger(n)||n<0)throw Error('P70_NAGASAKI_INVALID_CODE_COUNT');ct[i]+=n;});
    if(!r[0].startsWith('42')){if(!r[0].startsWith('41'))throw Error('P70_NAGASAKI_FOREIGN_CODE_PREFIX');foreign+=r.slice(2).reduce(function(a,b){return a+b;},0);}
  });
  if(codeNames.size!==26||nameCodes.size!==21||foreign!==19)throw Error('P70_NAGASAKI_CODE_TOTALS');
  if([...codeNames.values()].filter(function(s){return s.size>1;}).length!==10||[...nameCodes.values()].filter(function(s){return s.size>1;}).length!==14)throw Error('P70_NAGASAKI_MULTIPLE_CODES');
  GX_NAGASAKI_GUN_PAIRS.forEach(function(r){
    if(r.length!==6||!r[1])throw Error('P70_NAGASAKI_GUN_FORMAT');
    var key=r[0]+'|'+r[1];if(seenG.has(key))throw Error('P70_NAGASAKI_DUP_GUN');seenG.add(key);
    if(r[0]){if(!nameGuns.has(r[1]))nameGuns.set(r[1],new Set());nameGuns.get(r[1]).add(r[0]);}
    r.slice(2).forEach(function(n,i){if(!Number.isSafeInteger(n)||n<0)throw Error('P70_NAGASAKI_GUN_VALUE');gt[i]+=n;});
    if(r[0]==='藤津郡'||r[0]==='西松浦郡')foreignGuns+=r.slice(2).reduce(function(a,b){return a+b;},0);
  });
  if(JSON.stringify(ct)!==JSON.stringify([327,290,27,219])||JSON.stringify(gt)!==JSON.stringify(ct))throw Error('P70_NAGASAKI_LAND_PARITY');
  if(foreignGuns!==11||[...nameGuns.values()].filter(function(s){return s.size>1;}).length!==1||!nameGuns.get('波佐見町')||nameGuns.get('波佐見町').size!==2)throw Error('P70_NAGASAKI_GUN_AMBIGUITY');
  var guns=Object.fromEntries(GX_NAGASAKI_GUN_COUNTS);
  GX_NAGASAKI_GUN_COUNTS.forEach(function(g){var sum=GX_NAGASAKI_GUN_PAIRS.filter(function(r){return r[0]===g[0];}).reduce(function(a,r){return a+r.slice(2).reduce(function(x,y){return x+y;},0);},0);if(sum!==g[1])throw Error('P70_NAGASAKI_GUN_PARITY');});
  if(guns['']!==680||guns['藤津郡']!==6||guns['西松浦郡']!==5)throw Error('P70_NAGASAKI_GUN_COUNTS');
  return true;
}
function gxNagasakiSoilPanel(prefCode){
  if(prefCode!=='42')return '';
  gxNagasakiSoilValidate();
  var fmt=function(n){return Number(n).toLocaleString('ja-JP');};
  var cards=GX_NAGASAKI_LANDUSE.map(function(r){return '<article class="gx-data-card"><span class="gx-kicker">地目区分 / Polygon features</span><strong>'+fmt(r[1])+' <small>件</small></strong><p>'+gxEsc(r[0])+'（農地面積haではありません）</p></article>';}).join('');
  var cFreq=new Map(),nFreq=new Map(),gNames=new Map();
  GX_NAGASAKI_CODE_PAIRS.forEach(function(r){cFreq.set(r[0],(cFreq.get(r[0])||0)+1);nFreq.set(r[1],(nFreq.get(r[1])||0)+1);});
  GX_NAGASAKI_GUN_PAIRS.forEach(function(r){if(r[0]){if(!gNames.has(r[1]))gNames.set(r[1],new Set());gNames.get(r[1]).add(r[0]);}});
  var cr=GX_NAGASAKI_CODE_PAIRS.map(function(r){var w=[];if(!r[0].startsWith('42'))w.push('佐賀県系JCODE');if(cFreq.get(r[0])>1||nFreq.get(r[1])>1)w.push('行政コード・名称の複数対応');return '<tr><th scope="row">'+gxEsc(r[1])+'</th><td>'+gxEsc(r[0])+'</td>'+r.slice(2).map(function(x){return '<td>'+fmt(x)+'</td>';}).join('')+'<td>'+gxEsc(w.length?w.join('／')+'・要照合':'原本値')+'</td></tr>';}).join('');
  var gr=GX_NAGASAKI_GUN_PAIRS.map(function(r){var w=[];if(!r[0])w.push('郡名空欄');if(r[0]==='藤津郡'||r[0]==='西松浦郡')w.push('佐賀県系郡名');if(r[0]&&gNames.get(r[1])&&gNames.get(r[1]).size>1)w.push('郡名の複数対応');return '<tr><th scope="row">'+gxEsc(r[1])+'</th><td>'+gxEsc(r[0]||'（空欄）')+'</td>'+r.slice(2).map(function(x){return '<td>'+fmt(x)+'</td>';}).join('')+'<td>'+gxEsc(w.length?w.join('／')+'・要照合':'原本値')+'</td></tr>';}).join('');
  var header='<th scope="col">市町村名</th><th scope="col">区分</th><th scope="col">田</th><th scope="col">普通畑</th><th scope="col">牧草地</th><th scope="col">樹園地</th><th scope="col">照合</th>';
  return '<section class="gx-dashboard" aria-labelledby="gx-nagasaki-soil-title">'+
    '<div class="gx-section-heading"><span class="gx-kicker">NAGASAKI SOIL GIS · P70 · SOURCE-ONLY / ADMIN RECONCILIATION PENDING</span><h2 id="gx-nagasaki-soil-title">長崎県の農耕地土壌GISを確認する。</h2><p>JGD2000・ポリゴン863件。田327件、普通畑290件、牧草地27件、樹園地219件。原本市町村名21種類、JCODE26種類、土壌群20種類・詳細分類80種類。元XMLの作成日2017年1月17日。</p></div>'+
    '<p class="gx-anomaly"><b>行政属性の要照合：</b>原本に佐賀県系JCODE（41系）が19件、佐賀県系の郡名「藤津郡」6件・「西松浦郡」5件が含まれます。GUN（郡名）は680件が空欄。波佐見町は「東彼杵郡」と「西松浦郡」の両方が記録されています。原本値を無断補正せず現行市町村への自動JOINを保留します。ポリゴン数は農地面積ha・GHG削減量・認証済み炭素クレジット数ではありません。</p>'+
    '<div class="gx-detail-grid">'+cards+'</div>'+
    '<details><summary>原本JCODE×市町村名46組合せ</summary><div class="scroll"><table><thead><tr>'+header.replace('<th scope="col">区分</th>','<th scope="col">JCODE</th>')+'</tr></thead><tbody>'+cr+'</tbody></table></div></details>'+
    '<details><summary>原本GUN×市町村名30組合せ</summary><div class="scroll"><table><thead><tr>'+header.replace('<th scope="col">区分</th>','<th scope="col">GUN</th>')+'</tr></thead><tbody>'+gr+'</tbody></table></div></details>'+
    '<p class="gx-kicker">Source ledger: research/p70-nagasaki-soil-shapefile-source-v1.json · 元ZIP・SHP・DBF・地物座標は公開していません。</p></section>';
}
