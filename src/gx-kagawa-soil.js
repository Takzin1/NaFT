/* NaFT P65 Kagawa soil GIS: read-only audited aggregates; preserve source anomalies and prevent municipal JOIN. */
'use strict';
var GX_KAGAWA_SOURCE_SHA="715f79859b59b29403ddb9b9e875074208c148cbc2fc4f4008d6392fa65858be";
var GX_KAGAWA_LANDUSE=[["田",217],["普通畑",141],["牧草地",7],["樹園地",143]];
var GX_KAGAWA_CODE_PAIRS=[["36206","東かがわ市",2,1,0,0],["36207","さぬき市",3,1,0,0],["36207","まんのう町",0,0,1,0],["36207","三木町",1,0,0,0],["36208","観音寺市",0,1,0,0],["37201","三木町",7,1,0,1],["37201","坂出市",0,0,0,1],["37201","綾川町",5,1,0,2],["37201","高松市",15,18,1,14],["37202","まんのう町",4,0,0,1],["37202","丸亀市",10,11,0,12],["37202","善通寺市",3,0,0,0],["37202","坂出市",2,0,0,3],["37202","多度津町",2,0,0,0],["37202","宇多津町",1,0,0,1],["37202","綾川町",2,0,0,0],["37203","坂出市",11,6,0,13],["37203","宇多津町",1,0,0,0],["37203","綾川町",2,0,0,1],["37204","まんのう町",1,0,0,0],["37204","三豊市",0,0,0,1],["37204","善通寺市",4,2,1,6],["37204","多度津町",3,0,0,0],["37204","琴平町",2,0,0,0],["37205","三豊市",5,2,0,1],["37205","観音寺市",13,14,0,12],["37206","さぬき市",13,10,1,9],["37206","三木町",4,0,0,1],["37206","東かがわ市",1,2,0,0],["37207","東かがわ市",12,7,0,5],["37208","まんのう町",4,0,0,3],["37208","三豊市",18,16,1,21],["37208","多度津町",0,0,0,1],["37322","土庄町",5,5,0,2],["37322","小豆島町",1,1,0,1],["37324","小豆島町",3,5,0,3],["37341","三木町",10,9,1,4],["37364","直島町",1,3,0,0],["37386","宇多津町",3,2,0,1],["37387","綾川町",12,9,1,8],["37403","まんのう町",5,0,0,0],["37403","琴平町",6,0,0,0],["37404","多度津町",5,2,0,5],["37406","まんのう町",15,12,0,10]];
var GX_KAGAWA_GUN_PAIRS=[["","さぬき市",16,11,1,9],["","まんのう町",9,0,1,4],["","三木町",12,1,0,2],["","三豊市",23,18,1,23],["","丸亀市",10,11,0,12],["","善通寺市",7,2,1,6],["","坂出市",13,6,0,17],["","多度津町",5,0,0,1],["","宇多津町",2,0,0,1],["","東かがわ市",15,10,0,5],["","琴平町",2,0,0,0],["","綾川町",9,1,0,3],["","観音寺市",13,15,0,12],["","高松市",15,18,1,14],["仲多度郡","まんのう町",20,12,0,10],["仲多度郡","多度津町",5,2,0,5],["仲多度郡","琴平町",6,0,0,0],["小豆郡","土庄町",5,5,0,2],["小豆郡","小豆島町",4,6,0,4],["木田郡","三木町",10,9,1,4],["綾歌郡","宇多津町",3,2,0,1],["綾歌郡","綾川町",12,9,1,8],["香川郡","直島町",1,3,0,0]];
var GX_KAGAWA_GUN_COUNTS=[["綾歌郡",36],["",358],["木田郡",24],["仲多度郡",60],["小豆郡",26],["香川郡",4]];
function gxKagawaSoilValidate(){
  if(GX_KAGAWA_SOURCE_SHA!=='715f79859b59b29403ddb9b9e875074208c148cbc2fc4f4008d6392fa65858be')throw Error('P65_KAGAWA_SOURCE_SHA');
  if(GX_KAGAWA_CODE_PAIRS.length!==44||GX_KAGAWA_GUN_PAIRS.length!==23)throw Error('P65_KAGAWA_PAIR_LENGTH');
  var codes=new Map(),names=new Map(),seenCodes=new Set(),seenGuns=new Set(),total=[0,0,0,0],countyTotal=[0,0,0,0],foreign=0;
  GX_KAGAWA_CODE_PAIRS.forEach(function(r){
    if(r.length!==6||!/^\d{5}$/.test(r[0])||!r[1])throw Error('P65_KAGAWA_CODE_FORMAT');
    var id=r[0]+'|'+r[1];if(seenCodes.has(id))throw Error('P65_KAGAWA_CODE_DUPLICATE');seenCodes.add(id);
    if(!codes.has(r[0]))codes.set(r[0],new Set());codes.get(r[0]).add(r[1]);
    if(!names.has(r[1]))names.set(r[1],new Set());names.get(r[1]).add(r[0]);
    r.slice(2).forEach(function(n,i){if(!Number.isSafeInteger(n)||n<0)throw Error('P65_KAGAWA_COUNT');total[i]+=n;});
    if(!r[0].startsWith('37')){if(!r[0].startsWith('36'))throw Error('P65_KAGAWA_FOREIGN_PREFIX');foreign+=r.slice(2).reduce(function(a,b){return a+b;},0);}
  });
  if(codes.size!==20||names.size!==17||foreign!==10)throw Error('P65_KAGAWA_ADMIN_TOTALS');
  if([...codes.values()].filter(function(s){return s.size>1;}).length!==10||[...names.values()].filter(function(s){return s.size>1;}).length!==13)throw Error('P65_KAGAWA_ADMIN_AMBIGUITY');
  GX_KAGAWA_GUN_PAIRS.forEach(function(r){
    if(r.length!==6||!r[1])throw Error('P65_KAGAWA_GUN_FORMAT');
    var id=r[0]+'|'+r[1];if(seenGuns.has(id))throw Error('P65_KAGAWA_GUN_DUPLICATE');seenGuns.add(id);
    r.slice(2).forEach(function(n,i){if(!Number.isSafeInteger(n)||n<0)throw Error('P65_KAGAWA_GUN_COUNT');countyTotal[i]+=n;});
  });
  if(JSON.stringify(total)!==JSON.stringify([217,141,7,143])||JSON.stringify(total)!==JSON.stringify(countyTotal))throw Error('P65_KAGAWA_LAND_PARITY');
  var counts=Object.fromEntries(GX_KAGAWA_GUN_COUNTS);
  GX_KAGAWA_GUN_COUNTS.forEach(function(g){var observed=GX_KAGAWA_GUN_PAIRS.filter(function(r){return r[0]===g[0];}).reduce(function(s,r){return s+r.slice(2).reduce(function(a,b){return a+b;},0);},0);if(observed!==g[1])throw Error('P65_KAGAWA_GUN_PARITY');});
  if(counts['']!==358||counts['仲多度郡']!==60)throw Error('P65_KAGAWA_GUN_TOTALS');
  return true;
}
function gxKagawaSoilPanel(prefCode){
  if(prefCode!=='37')return '';
  gxKagawaSoilValidate();
  var fmt=function(n){return Number(n).toLocaleString('ja-JP');};
  var cards=GX_KAGAWA_LANDUSE.map(function(r){return '<article class="gx-data-card"><span class="gx-kicker">地目区分 / Polygon features</span><strong>'+fmt(r[1])+' <small>件</small></strong><p>'+gxEsc(r[0])+'（農地面積haではありません）</p></article>';}).join('');
  var codeNames=new Map(),nameCodes=new Map();
  GX_KAGAWA_CODE_PAIRS.forEach(function(r){codeNames.set(r[0],(codeNames.get(r[0])||0)+1);nameCodes.set(r[1],(nameCodes.get(r[1])||0)+1);});
  var codes=GX_KAGAWA_CODE_PAIRS.map(function(r){var warning=[];if(!r[0].startsWith('37'))warning.push('徳島県系JCODE');if(codeNames.get(r[0])>1||nameCodes.get(r[1])>1)warning.push('コード・名称の複数対応');return '<tr><th scope="row">'+gxEsc(r[1])+'</th><td>'+gxEsc(r[0])+'</td>'+r.slice(2).map(function(n){return '<td>'+fmt(n)+'</td>';}).join('')+'<td>'+gxEsc(warning.length?warning.join('／')+'・要照合':'原本値')+'</td></tr>';}).join('');
  var guns=GX_KAGAWA_GUN_PAIRS.map(function(r){return '<tr><th scope="row">'+gxEsc(r[1])+'</th><td>'+gxEsc(r[0]||'（空欄）')+'</td>'+r.slice(2).map(function(n){return '<td>'+fmt(n)+'</td>';}).join('')+'<td>'+gxEsc(!r[0]?'郡名空欄・要照合':'原本値')+'</td></tr>';}).join('');
  var columns='<th scope="col">市町村名</th><th scope="col">区分</th><th scope="col">田</th><th scope="col">普通畑</th><th scope="col">牧草地</th><th scope="col">樹園地</th><th scope="col">照合</th>';
  return '<section class="gx-dashboard" aria-labelledby="gx-kagawa-soil-title">'+
    '<div class="gx-section-heading"><span class="gx-kicker">KAGAWA SOIL GIS · P65 · SOURCE ATTRIBUTES / ADMIN RECONCILIATION PENDING</span><h2 id="gx-kagawa-soil-title">香川県の農耕地土壌GISを確認する。</h2><p>JGD2000・ポリゴン508件。田217件、普通畑141件、牧草地7件、樹園地143件。市町村名17種類、JCODE20種類、土壌群9種類・詳細分類42種類。原本XML作成日2017年1月17日。</p></div>'+
    '<p class="gx-anomaly"><b>原本行政属性の要照合：</b>香川県の原本に徳島県系JCODEが10件（36206・36207・36208）。同一JCODEと市町村名の多対多の対応があり、GUN（郡名）は358件空欄。原本を無断補正せず、現行市町村統計との自動JOINを保留します。ポリゴン件数は農地面積ha、土壌炭素量、GHG削減量、認証済み炭素クレジット数ではありません。</p>'+
    '<div class="gx-detail-grid">'+cards+'</div>'+
    '<details><summary>原本JCODE×市町村名44組合せ</summary><div class="scroll"><table><thead><tr>'+columns.replace('<th scope="col">区分</th>','<th scope="col">JCODE</th>')+'</tr></thead><tbody>'+codes+'</tbody></table></div></details>'+
    '<details><summary>原本GUN×市町村名23組合せ</summary><div class="scroll"><table><thead><tr>'+columns.replace('<th scope="col">区分</th>','<th scope="col">GUN</th>')+'</tr></thead><tbody>'+guns+'</tbody></table></div></details>'+
    '<p class="gx-kicker">Source ledger: research/p65-kagawa-soil-shapefile-source-v1.json · 元ZIP・原本SHP・DBF・地物座標は公開していません。</p></section>';
}
