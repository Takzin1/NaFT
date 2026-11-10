/* NaFT P64 Tokushima soil GIS: verified derived aggregates, source/administrative cautions; original shape data private. */
'use strict';
var GX_TOKUSHIMA_SOURCE_SHA="2871b5b2f6f7d22840da9062b01684c67d2a221bcbfa21290362d21271d4c587";
var GX_TOKUSHIMA_LANDUSE=[["田",291],["普通畑",203],["牧草地",29],["樹園地",169]];
var GX_TOKUSHIMA_CODE_PAIRS=[["36201","佐那河内村",0,1,0,1],["36201","北島町",1,2,0,0],["36201","小松島市",1,0,0,1],["36201","徳島市",21,16,0,6],["36201","石井町",6,2,0,0],["36201","神山町",1,0,0,0],["36201","藍住町",2,1,0,0],["36202","北島町",2,3,0,1],["36202","松茂町",3,0,0,2],["36202","板野町",2,0,0,0],["36202","藍住町",3,0,0,2],["36202","鳴門市",16,7,1,13],["36203","勝浦町",0,1,0,1],["36203","小松島市",15,2,0,1],["36203","阿南市",7,1,0,1],["36204","阿南市",17,10,0,9],["36205","上板町",0,2,0,0],["36205","吉野川市",12,9,4,9],["36205","石井町",2,0,0,0],["36205","阿波市",1,2,0,0],["36206","上板町",6,2,0,0],["36206","美馬市",3,0,0,0],["36206","阿波市",17,14,6,12],["36207","つるぎ町",3,0,0,1],["36207","三好市",0,1,1,0],["36207","美馬市",11,12,5,13],["36208","三好市",8,13,4,8],["36208","東みよし町",2,2,0,1],["36301","上勝町",0,1,0,1],["36301","勝浦町",5,5,0,5],["36302","上勝町",5,1,0,2],["36321","佐那河内村",2,2,1,2],["36321","神山町",0,0,0,1],["36341","上板町",0,1,0,0],["36341","石井町",12,10,0,2],["36342","神山町",5,4,0,5],["36368","美波町",1,0,0,0],["36368","那賀町",8,10,0,9],["36383","牟岐町",4,2,0,4],["36387","美波町",11,6,0,7],["36388","海陽町",14,11,0,9],["36401","北島町",2,0,0,0],["36401","松茂町",4,4,0,3],["36402","北島町",6,6,0,2],["36403","板野町",2,2,0,0],["36403","藍住町",7,4,2,4],["36404","上板町",6,2,0,0],["36404","板野町",11,10,0,9],["36405","上板町",13,5,3,7],["36468","つるぎ町",4,8,1,6],["36489","東みよし町",7,6,1,9]];
var GX_TOKUSHIMA_GUN_PAIRS=[["","つるぎ町",3,0,0,1],["","三好市",8,14,5,8],["","上板町",6,4,0,0],["","佐那河内村",0,1,0,1],["","勝浦町",0,1,0,1],["","北島町",3,5,0,1],["","吉野川市",12,9,4,9],["","小松島市",16,2,0,2],["","徳島市",21,16,0,6],["","東みよし町",2,2,0,1],["","松茂町",3,0,0,2],["","板野町",2,0,0,0],["","石井町",8,2,0,0],["","神山町",1,0,0,0],["","美馬市",14,12,5,13],["","藍住町",5,1,0,2],["","阿南市",24,11,0,10],["","阿波市",18,16,6,12],["","鳴門市",16,7,1,13],["三好郡","東みよし町",7,6,1,9],["勝浦郡","上勝町",5,2,0,3],["勝浦郡","勝浦町",5,5,0,5],["名東郡","佐那河内村",2,2,1,2],["名東郡","神山町",0,0,0,1],["名西郡","上板町",0,1,0,0],["名西郡","石井町",12,10,0,2],["名西郡","神山町",5,4,0,5],["板野郡","上板町",19,7,3,7],["板野郡","北島町",8,6,0,2],["板野郡","松茂町",4,4,0,3],["板野郡","板野町",13,12,0,9],["板野郡","藍住町",7,4,2,4],["海部郡","海陽町",14,11,0,9],["海部郡","牟岐町",4,2,0,4],["海部郡","美波町",11,6,0,7],["美馬郡","つるぎ町",4,8,1,6],["那賀郡","美波町",1,0,0,0],["那賀郡","那賀町",8,10,0,9]];
var GX_TOKUSHIMA_GUN_COUNTS=[["",368],["板野郡",114],["海部郡",68],["名西郡",39],["那賀郡",28],["勝浦郡",25],["三好郡",23],["美馬郡",19],["名東郡",8]];
function gxTokushimaSoilValidate(){
  if(GX_TOKUSHIMA_SOURCE_SHA!=='2871b5b2f6f7d22840da9062b01684c67d2a221bcbfa21290362d21271d4c587')throw Error('P64_TOKUSHIMA_SOURCE_SHA');
  if(GX_TOKUSHIMA_CODE_PAIRS.length!==51||GX_TOKUSHIMA_GUN_PAIRS.length!==38)throw Error('P64_TOKUSHIMA_PAIR_LENGTH');
  var codeTotals=[0,0,0,0],countyTotals=[0,0,0,0],codeNames=new Map(),nameCodes=new Map(),nameGuns=new Map(),seenCodes=new Set(),seenGuns=new Set(),foreign=0;
  GX_TOKUSHIMA_CODE_PAIRS.forEach(function(r){
    if(r.length!==6||!/^\d{5}$/.test(r[0])||!r[1])throw Error('P64_TOKUSHIMA_CODE_FORMAT');
    var id=r[0]+'|'+r[1];if(seenCodes.has(id))throw Error('P64_TOKUSHIMA_CODE_DUPLICATE');seenCodes.add(id);
    if(!codeNames.has(r[0]))codeNames.set(r[0],new Set());codeNames.get(r[0]).add(r[1]);
    if(!nameCodes.has(r[1]))nameCodes.set(r[1],new Set());nameCodes.get(r[1]).add(r[0]);
    r.slice(2).forEach(function(v,i){if(!Number.isSafeInteger(v)||v<0)throw Error('P64_TOKUSHIMA_CODE_COUNT');codeTotals[i]+=v;});
    if(!r[0].startsWith('36'))foreign+=r.slice(2).reduce(function(a,b){return a+b;},0);
  });
  if(codeNames.size!==24||nameCodes.size!==24||foreign!==0)throw Error('P64_TOKUSHIMA_CODE_TOTALS');
  if([...codeNames.values()].filter(function(s){return s.size>1;}).length!==14||[...nameCodes.values()].filter(function(s){return s.size>1;}).length!==18)throw Error('P64_TOKUSHIMA_CODE_MULTIPLES');
  GX_TOKUSHIMA_GUN_PAIRS.forEach(function(r){
    if(r.length!==6||!r[1])throw Error('P64_TOKUSHIMA_GUN_FORMAT');
    var id=r[0]+'|'+r[1];if(seenGuns.has(id))throw Error('P64_TOKUSHIMA_GUN_DUPLICATE');seenGuns.add(id);
    if(r[0]){if(!nameGuns.has(r[1]))nameGuns.set(r[1],new Set());nameGuns.get(r[1]).add(r[0]);}
    r.slice(2).forEach(function(v,i){if(!Number.isSafeInteger(v)||v<0)throw Error('P64_TOKUSHIMA_GUN_COUNT');countyTotals[i]+=v;});
  });
  if(JSON.stringify(codeTotals)!==JSON.stringify([291,203,29,169])||JSON.stringify(countyTotals)!==JSON.stringify(codeTotals))throw Error('P64_TOKUSHIMA_LAND_PARITY');
  var guns=Object.fromEntries(GX_TOKUSHIMA_GUN_COUNTS);
  GX_TOKUSHIMA_GUN_COUNTS.forEach(function(g){var actual=GX_TOKUSHIMA_GUN_PAIRS.filter(function(r){return r[0]===g[0];}).reduce(function(s,r){return s+r.slice(2).reduce(function(a,b){return a+b;},0);},0);if(actual!==g[1])throw Error('P64_TOKUSHIMA_GUN_PARITY');});
  if(guns['']!==368||guns['板野郡']!==114||nameGuns.get('神山町').size!==2||nameGuns.get('上板町').size!==2||nameGuns.get('美波町').size!==2)throw Error('P64_TOKUSHIMA_GUN_AMBIGUITY');
  return true;
}
function gxTokushimaSoilPanel(prefCode){
  if(prefCode!=='36')return '';
  gxTokushimaSoilValidate();
  var fmt=function(v){return Number(v).toLocaleString('ja-JP');};
  var cards=GX_TOKUSHIMA_LANDUSE.map(function(r){return '<article class="gx-data-card"><span class="gx-kicker">地目区分 / Polygon features</span><strong>'+fmt(r[1])+' <small>件</small></strong><p>'+gxEsc(r[0])+'（農地面積haではありません）</p></article>';}).join('');
  var codes=new Map(),names=new Map(),gunNames=new Map();
  GX_TOKUSHIMA_CODE_PAIRS.forEach(function(r){codes.set(r[0],(codes.get(r[0])||0)+1);names.set(r[1],(names.get(r[1])||0)+1);});
  GX_TOKUSHIMA_GUN_PAIRS.forEach(function(r){if(r[0]){if(!gunNames.has(r[1]))gunNames.set(r[1],new Set());gunNames.get(r[1]).add(r[0]);}});
  var cr=GX_TOKUSHIMA_CODE_PAIRS.map(function(r){var warn=(codes.get(r[0])>1||names.get(r[1])>1)?'コード・名称が複数対応・要照合':'原本値';return '<tr><th scope="row">'+gxEsc(r[1])+'</th><td>'+gxEsc(r[0])+'</td>'+r.slice(2).map(function(n){return '<td>'+fmt(n)+'</td>';}).join('')+'<td>'+gxEsc(warn)+'</td></tr>';}).join('');
  var gr=GX_TOKUSHIMA_GUN_PAIRS.map(function(r){var warn=!r[0]?'郡名空欄・要照合':(gunNames.get(r[1])&&gunNames.get(r[1]).size>1)?'複数郡名・要照合':'原本値';return '<tr><th scope="row">'+gxEsc(r[1])+'</th><td>'+gxEsc(r[0]||'（空欄）')+'</td>'+r.slice(2).map(function(n){return '<td>'+fmt(n)+'</td>';}).join('')+'<td>'+gxEsc(warn)+'</td></tr>';}).join('');
  var header='<th scope="col">市町村名</th><th scope="col">区分</th><th scope="col">田</th><th scope="col">普通畑</th><th scope="col">牧草地</th><th scope="col">樹園地</th><th scope="col">照合</th>';
  return '<section class="gx-dashboard" aria-labelledby="gx-tokushima-soil-title">'+
    '<div class="gx-section-heading"><span class="gx-kicker">TOKUSHIMA SOIL GIS · P64 · ORIGINAL ATTRIBUTES / PENDING RECONCILIATION</span><h2 id="gx-tokushima-soil-title">徳島県の農耕地土壌GISを確認する。</h2><p>JGD2000・ポリゴン692件。田291件、普通畑203件、牧草地29件、樹園地169件。市町村名24種類、JCODE24種類、土壌群10種類・詳細分類39種類。XML作成日2017年1月17日。</p></div>'+
    '<p class="gx-anomaly"><b>原本行政属性の要照合：</b>県外系JCODEは0件ですが、同一市町村名に複数のJCODEが対応し、郡名GUNは368件が空欄です。神山町に「名東郡」「名西郡」、上板町に「名西郡」「板野郡」、美波町に「海部郡」「那賀郡」が混在します。原本は無断補正せず、現行行政統計との自動JOINを保留します。ポリゴン件数は農地面積ha、土壌炭素量、GHG削減量、認証済みクレジット数ではありません。</p>'+
    '<div class="gx-detail-grid">'+cards+'</div>'+
    '<details><summary>原本JCODE×市町村名51組合せ</summary><div class="scroll"><table><thead><tr>'+header.replace('<th scope="col">区分</th>','<th scope="col">JCODE</th>')+'</tr></thead><tbody>'+cr+'</tbody></table></div></details>'+
    '<details><summary>原本GUN×市町村名38組合せ</summary><div class="scroll"><table><thead><tr>'+header.replace('<th scope="col">区分</th>','<th scope="col">GUN</th>')+'</tr></thead><tbody>'+gr+'</tbody></table></div></details>'+
    '<p class="gx-kicker">Source ledger: research/p64-tokushima-soil-shapefile-source-v1.json · 元ZIP・SHP・DBF・地物座標は公開していません。</p></section>';
}
