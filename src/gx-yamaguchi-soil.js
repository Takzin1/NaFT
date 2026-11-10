/* NaFT P63 Yamaguchi: source-audited derived soil GIS aggregates; no raw SHP/DBF or automatic administrative JOIN. */
'use strict';
var GX_YAMAGUCHI_SOURCE_SHA="9331249a4b2fef18bba89979954c06a12ea69e8c33708aa1b89282f66c50d957";
var GX_YAMAGUCHI_LANDUSE=[["田",483],["普通畑",276],["牧草地",59],["樹園地",215]];
var GX_YAMAGUCHI_CODE_PAIRS=[["32501","萩市",0,0,0,1],["32505","岩国市",2,0,0,0],["34211","岩国市",1,0,0,0],["35201","下関市",33,25,9,22],["35201","山陽小野田市",4,0,1,0],["35201","美祢市",5,0,0,0],["35201","長門市",2,0,0,0],["35202","宇部市",20,17,3,8],["35202","山口市",3,3,0,0],["35202","山陽小野田市",2,0,0,0],["35202","美祢市",1,0,0,0],["35203","周南市",1,0,0,0],["35203","山口市",40,25,8,19],["35203","防府市",4,0,0,0],["35204","萩市",38,22,2,20],["35204","長門市",0,0,1,0],["35204","阿武町",3,2,0,0],["35206","周南市",1,0,1,1],["35206","防府市",23,16,3,10],["35207","下松市",21,11,0,4],["35207","周南市",10,2,0,0],["35208","光市",2,0,0,0],["35208","周南市",1,0,1,0],["35208","和木町",0,1,0,0],["35208","岩国市",36,28,7,22],["35208","柳井市",2,0,0,0],["35208","田布施町",2,0,0,0],["35210","光市",22,12,1,8],["35210","周南市",3,1,0,0],["35210","柳井市",1,0,0,0],["35210","田布施町",5,0,0,0],["35211","長門市",34,16,4,15],["35212","平生町",1,0,0,2],["35212","柳井市",25,14,3,9],["35212","田布施町",3,0,0,0],["35213","山陽小野田市",2,0,0,0],["35213","美祢市",16,7,3,13],["35215","周南市",35,24,5,17],["35216","山陽小野田市",19,11,5,5],["35305","周防大島町",15,10,0,15],["35321","和木町",2,1,0,0],["35341","上関町",5,6,1,6],["35343","平生町",1,0,0,0],["35343","田布施町",12,5,0,4],["35344","平生町",12,5,0,2],["35502","阿武町",13,12,1,12]];
var GX_YAMAGUCHI_GUN_PAIRS=[["","下松市",21,11,0,4],["","下関市",33,25,9,22],["","光市",24,12,1,8],["","周南市",51,27,7,18],["","和木町",0,1,0,0],["","宇部市",20,17,3,8],["","山口市",43,28,8,19],["","山陽小野田市",27,11,6,5],["","岩国市",37,28,7,22],["","平生町",1,0,0,2],["","柳井市",28,14,3,9],["","田布施町",10,0,0,0],["","美祢市",22,7,3,13],["","萩市",38,22,2,20],["","長門市",36,16,5,15],["","防府市",27,16,3,10],["","阿武町",3,2,0,0],["大島郡","周防大島町",15,10,0,15],["熊毛郡","上関町",5,6,1,6],["熊毛郡","平生町",13,5,0,2],["熊毛郡","田布施町",12,5,0,4],["玖珂郡","和木町",2,1,0,0],["阿武郡","阿武町",13,12,1,12],["鹿足郡","岩国市",2,0,0,0],["鹿足郡","萩市",0,0,0,1]];
var GX_YAMAGUCHI_GUN_COUNTS=[["",890],["熊毛郡",59],["大島郡",40],["阿武郡",38],["鹿足郡",3],["玖珂郡",3]];
function gxYamaguchiSoilValidate(){
  if(GX_YAMAGUCHI_SOURCE_SHA!=='9331249a4b2fef18bba89979954c06a12ea69e8c33708aa1b89282f66c50d957')throw Error('P63_YAMAGUCHI_SOURCE_SHA');
  if(GX_YAMAGUCHI_CODE_PAIRS.length!==46||GX_YAMAGUCHI_GUN_PAIRS.length!==25)throw Error('P63_YAMAGUCHI_PAIR_LENGTH');
  var ct=[0,0,0,0],gt=[0,0,0,0],codeNames=new Map(),nameCodes=new Map(),codeKeys=new Set(),gunKeys=new Set(),foreign={'32':0,'34':0};
  GX_YAMAGUCHI_CODE_PAIRS.forEach(function(r){
    if(r.length!==6||!/^\d{5}$/.test(r[0])||!r[1])throw Error('P63_YAMAGUCHI_CODE_FORMAT');
    var key=r[0]+'|'+r[1];if(codeKeys.has(key))throw Error('P63_YAMAGUCHI_DUPLICATE_CODE');codeKeys.add(key);
    if(!codeNames.has(r[0]))codeNames.set(r[0],new Set());codeNames.get(r[0]).add(r[1]);
    if(!nameCodes.has(r[1]))nameCodes.set(r[1],new Set());nameCodes.get(r[1]).add(r[0]);
    r.slice(2).forEach(function(n,i){if(!Number.isSafeInteger(n)||n<0)throw Error('P63_YAMAGUCHI_COUNT');ct[i]+=n;});
    if(!r[0].startsWith('35')){var p=r[0].slice(0,2);if(!(p in foreign))throw Error('P63_YAMAGUCHI_FOREIGN_CODE');foreign[p]+=r.slice(2).reduce(function(a,b){return a+b;},0);}
  });
  if(codeNames.size!==22||nameCodes.size!==19||foreign['32']!==3||foreign['34']!==1)throw Error('P63_YAMAGUCHI_CODE_TOTALS');
  if([...codeNames.values()].filter(function(s){return s.size>1;}).length!==11||[...nameCodes.values()].filter(function(s){return s.size>1;}).length!==14)throw Error('P63_YAMAGUCHI_CODE_CONFLICTS');
  GX_YAMAGUCHI_GUN_PAIRS.forEach(function(r){if(r.length!==6||!r[1])throw Error('P63_YAMAGUCHI_GUN_FORMAT');
    var key=r[0]+'|'+r[1];if(gunKeys.has(key))throw Error('P63_YAMAGUCHI_DUPLICATE_GUN');gunKeys.add(key);
    r.slice(2).forEach(function(n,i){if(!Number.isSafeInteger(n)||n<0)throw Error('P63_YAMAGUCHI_GUN_COUNT');gt[i]+=n;});
  });
  if(JSON.stringify(ct)!==JSON.stringify([483,276,59,215])||JSON.stringify(gt)!==JSON.stringify(ct))throw Error('P63_YAMAGUCHI_LAND_PARITY');
  var guns=Object.fromEntries(GX_YAMAGUCHI_GUN_COUNTS);
  GX_YAMAGUCHI_GUN_COUNTS.forEach(function(g){var sum=GX_YAMAGUCHI_GUN_PAIRS.filter(function(r){return r[0]===g[0];}).reduce(function(s,r){return s+r.slice(2).reduce(function(a,b){return a+b;},0);},0);if(sum!==g[1])throw Error('P63_YAMAGUCHI_GUN_PARITY');});
  if(guns['']!==890||guns['鹿足郡']!==3)throw Error('P63_YAMAGUCHI_GUN_ANOMALY');
  return true;
}
function gxYamaguchiSoilPanel(prefCode){
  if(prefCode!=='35')return '';
  gxYamaguchiSoilValidate();
  var fmt=function(n){return Number(n).toLocaleString('ja-JP');};
  var cards=GX_YAMAGUCHI_LANDUSE.map(function(r){return '<article class="gx-data-card"><span class="gx-kicker">地目区分 / Polygon features</span><strong>'+fmt(r[1])+' <small>件</small></strong><p>'+gxEsc(r[0])+'（農地面積haではありません）</p></article>';}).join('');
  var codes=new Map(),names=new Map();
  GX_YAMAGUCHI_CODE_PAIRS.forEach(function(r){codes.set(r[0],(codes.get(r[0])||0)+1);names.set(r[1],(names.get(r[1])||0)+1);});
  var codeRows=GX_YAMAGUCHI_CODE_PAIRS.map(function(r){var warn=[];if(!r[0].startsWith('35'))warn.push('県外系JCODE');if(codes.get(r[0])>1||names.get(r[1])>1)warn.push('コード・名称が複数対応');return '<tr><th scope="row">'+gxEsc(r[1])+'</th><td>'+gxEsc(r[0])+'</td>'+r.slice(2).map(function(n){return '<td>'+fmt(n)+'</td>';}).join('')+'<td>'+gxEsc(warn.length?warn.join('／')+'・要照合':'原本値')+'</td></tr>';}).join('');
  var gunRows=GX_YAMAGUCHI_GUN_PAIRS.map(function(r){var warn=r[0]==='鹿足郡'?'島根県の郡名・要照合':!r[0]?'郡名空欄・要照合':'原本値';return '<tr><th scope="row">'+gxEsc(r[1])+'</th><td>'+gxEsc(r[0]||'（空欄）')+'</td>'+r.slice(2).map(function(n){return '<td>'+fmt(n)+'</td>';}).join('')+'<td>'+gxEsc(warn)+'</td></tr>';}).join('');
  var hd='<th scope="col">市町村名</th><th scope="col">区分</th><th scope="col">田</th><th scope="col">普通畑</th><th scope="col">牧草地</th><th scope="col">樹園地</th><th scope="col">照合</th>';
  return '<section class="gx-dashboard" aria-labelledby="gx-yamaguchi-soil-title">'+
   '<div class="gx-section-heading"><span class="gx-kicker">YAMAGUCHI SOIL GIS · P63 · ORIGINAL ATTRIBUTES / RECONCILIATION PENDING</span><h2 id="gx-yamaguchi-soil-title">山口県の農耕地土壌GISを確認する。</h2><p>JGD2000・ポリゴン1,033件。田483件、普通畑276件、牧草地59件、樹園地215件。市町村名19種類、JCODE22種類、土壌群15種類、詳細分類68種類。原本XML作成日2017年1月17日。</p></div>'+
   '<p class="gx-anomaly"><b>行政属性の要照合：</b>原本に県外系JCODEが4件（島根県32系3件・広島県34系1件）。GUN（郡名）は890件が空欄で、島根県の郡名「鹿足郡」3件が岩国市・萩市に混在します。JCODEと市町村名に多対多の対応があるため、原本を無断補正せず、現行自治体への自動JOINを保留します。ポリゴン件数は農地面積haやGHG削減量、認証済みクレジット量ではありません。</p>'+
   '<div class="gx-detail-grid">'+cards+'</div>'+
   '<details><summary>原本JCODE×市町村名46組合せ</summary><div class="scroll"><table><thead><tr>'+hd.replace('<th scope="col">区分</th>','<th scope="col">JCODE</th>')+'</tr></thead><tbody>'+codeRows+'</tbody></table></div></details>'+
   '<details><summary>原本GUN×市町村名25組合せ</summary><div class="scroll"><table><thead><tr>'+hd.replace('<th scope="col">区分</th>','<th scope="col">GUN</th>')+'</tr></thead><tbody>'+gunRows+'</tbody></table></div></details>'+
   '<p class="gx-kicker">Source ledger: research/p63-yamaguchi-soil-shapefile-source-v1.json · 元ZIP・SHP・DBF・地物座標は公開していません。</p></section>';
}
