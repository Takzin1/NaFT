/* NaFT P66 Ehime: source-audited derived soil GIS; raw geometry and unverified administrative joins excluded. */
'use strict';
var GX_EHIME_SOURCE_SHA="3af0a956b989b9eaac0746695e6bc9930dab6267a62061a3aca84aa6bceecbbc";
var GX_EHIME_LANDUSE=[["田",219],["普通畑",189],["牧草地",14],["樹園地",207]];
var GX_EHIME_CODE_PAIRS=[["36208","四国中央市",0,0,0,1],["38201","今治市",0,0,0,2],["38201","東温市",3,0,0,2],["38201","松山市",20,12,3,18],["38201","砥部町",2,0,0,3],["38202","今治市",13,12,0,12],["38203","宇和島市",11,11,0,11],["38203","西予市",0,0,0,1],["38203","鬼北町",2,1,0,0],["38204","伊方町",0,0,0,1],["38204","八幡浜市",4,3,0,7],["38204","大洲市",0,0,0,2],["38204","西予市",1,0,0,1],["38205","新居浜市",10,11,0,8],["38205","西条市",3,0,0,0],["38206","西条市",19,12,1,17],["38207","内子町",2,2,0,1],["38207","大洲市",18,16,0,14],["38207","西予市",0,2,0,0],["38210","伊予市",12,15,0,11],["38210","内子町",0,1,0,1],["38210","松前町",6,1,0,0],["38210","砥部町",0,0,0,4],["38213","四国中央市",14,13,0,14],["38214","西予市",14,11,6,13],["38214","鬼北町",2,0,0,0],["38215","東温市",6,7,0,8],["38356","上島町",2,2,0,3],["38386","久万高原町",11,10,3,7],["38401","松前町",8,6,0,0],["38402","砥部町",6,5,0,9],["38422","内子町",8,10,0,9],["38442","伊方町",0,3,1,4],["38484","松野町",5,6,0,5],["38484","鬼北町",0,0,0,1],["38488","鬼北町",7,9,0,9],["38506","愛南町",10,8,0,8]];
var GX_EHIME_GUN_PAIRS=[["","今治市",13,12,0,14],["","伊予市",12,15,0,11],["","伊方町",0,0,0,1],["","八幡浜市",4,3,0,7],["","内子町",2,3,0,2],["","四国中央市",14,13,0,15],["","大洲市",18,16,0,16],["","宇和島市",11,11,0,11],["","新居浜市",10,11,0,8],["","東温市",9,7,0,10],["","松前町",6,1,0,0],["","松山市",20,12,3,18],["","砥部町",2,0,0,7],["","西予市",15,13,6,15],["","西条市",22,12,1,17],["","鬼北町",4,1,0,0],["上浮穴郡","久万高原町",11,10,3,7],["伊予郡","松前町",8,6,0,0],["伊予郡","砥部町",6,5,0,9],["北宇和郡","松野町",5,6,0,5],["北宇和郡","鬼北町",7,9,0,10],["南宇和郡","愛南町",10,8,0,8],["喜多郡","内子町",8,10,0,9],["西宇和郡","伊方町",0,3,1,4],["越智郡","上島町",2,2,0,3]];
var GX_EHIME_GUN_COUNTS=[["",454],["上浮穴郡",31],["伊予郡",34],["北宇和郡",42],["南宇和郡",26],["喜多郡",27],["西宇和郡",8],["越智郡",7]];
function gxEhimeSoilValidate(){
  if(GX_EHIME_SOURCE_SHA!=='3af0a956b989b9eaac0746695e6bc9930dab6267a62061a3aca84aa6bceecbbc')throw Error('P66_EHIME_SOURCE_SHA');
  if(GX_EHIME_CODE_PAIRS.length!==37||GX_EHIME_GUN_PAIRS.length!==25)throw Error('P66_EHIME_PAIR_COUNT');
  var cTotals=[0,0,0,0],gTotals=[0,0,0,0],codes=new Map(),names=new Map(),seenCode=new Set(),seenGun=new Set(),foreign=0;
  GX_EHIME_CODE_PAIRS.forEach(function(r){
    if(r.length!==6||!/^\d{5}$/.test(r[0])||!r[1])throw Error('P66_EHIME_CODE_FORMAT');
    var id=r[0]+'|'+r[1];if(seenCode.has(id))throw Error('P66_EHIME_DUP_CODE_PAIR');seenCode.add(id);
    if(!codes.has(r[0]))codes.set(r[0],new Set());codes.get(r[0]).add(r[1]);
    if(!names.has(r[1]))names.set(r[1],new Set());names.get(r[1]).add(r[0]);
    r.slice(2).forEach(function(n,i){if(!Number.isSafeInteger(n)||n<0)throw Error('P66_EHIME_COUNT');cTotals[i]+=n;});
    if(!r[0].startsWith('38')){if(r[0]!=='36208'||r[1]!=='四国中央市')throw Error('P66_EHIME_FOREIGN_CODE');foreign+=r.slice(2).reduce(function(a,b){return a+b;},0);}
  });
  if(codes.size!==21||names.size!==20||foreign!==1)throw Error('P66_EHIME_CODE_TOTALS');
  if([...codes.values()].filter(function(s){return s.size>1;}).length!==8||[...names.values()].filter(function(s){return s.size>1;}).length!==11)throw Error('P66_EHIME_CODE_AMBIGUITY');
  GX_EHIME_GUN_PAIRS.forEach(function(r){
    if(r.length!==6||!r[1])throw Error('P66_EHIME_GUN_FORMAT');
    var id=r[0]+'|'+r[1];if(seenGun.has(id))throw Error('P66_EHIME_DUP_GUN_PAIR');seenGun.add(id);
    r.slice(2).forEach(function(n,i){if(!Number.isSafeInteger(n)||n<0)throw Error('P66_EHIME_GUN_COUNT');gTotals[i]+=n;});
  });
  if(JSON.stringify(cTotals)!==JSON.stringify([219,189,14,207])||JSON.stringify(gTotals)!==JSON.stringify(cTotals))throw Error('P66_EHIME_LAND_PARITY');
  var gunCounts=Object.fromEntries(GX_EHIME_GUN_COUNTS);
  GX_EHIME_GUN_COUNTS.forEach(function(g){var total=GX_EHIME_GUN_PAIRS.filter(function(r){return r[0]===g[0];}).reduce(function(s,r){return s+r.slice(2).reduce(function(a,b){return a+b;},0);},0);if(total!==g[1])throw Error('P66_EHIME_GUN_PARITY');});
  if(gunCounts['']!==454||gunCounts['北宇和郡']!==42)throw Error('P66_EHIME_GUN_ANOMALY');
  return true;
}
function gxEhimeSoilPanel(prefCode){
  if(prefCode!=='38')return '';
  gxEhimeSoilValidate();
  var fmt=function(n){return Number(n).toLocaleString('ja-JP');};
  var cards=GX_EHIME_LANDUSE.map(function(r){return '<article class="gx-data-card"><span class="gx-kicker">地目区分 / Polygon features</span><strong>'+fmt(r[1])+' <small>件</small></strong><p>'+gxEsc(r[0])+'（農地面積haではありません）</p></article>';}).join('');
  var codeFrequency=new Map(),nameFrequency=new Map();
  GX_EHIME_CODE_PAIRS.forEach(function(r){codeFrequency.set(r[0],(codeFrequency.get(r[0])||0)+1);nameFrequency.set(r[1],(nameFrequency.get(r[1])||0)+1);});
  var cRows=GX_EHIME_CODE_PAIRS.map(function(r){var warnings=[];if(!r[0].startsWith('38'))warnings.push('徳島県系JCODE');if(codeFrequency.get(r[0])>1||nameFrequency.get(r[1])>1)warnings.push('行政コード・名称の複数対応');return '<tr><th scope="row">'+gxEsc(r[1])+'</th><td>'+gxEsc(r[0])+'</td>'+r.slice(2).map(function(v){return '<td>'+fmt(v)+'</td>';}).join('')+'<td>'+gxEsc(warnings.length?warnings.join('／')+'・要照合':'原本値')+'</td></tr>';}).join('');
  var gRows=GX_EHIME_GUN_PAIRS.map(function(r){return '<tr><th scope="row">'+gxEsc(r[1])+'</th><td>'+gxEsc(r[0]||'（空欄）')+'</td>'+r.slice(2).map(function(v){return '<td>'+fmt(v)+'</td>';}).join('')+'<td>'+gxEsc(!r[0]?'郡名空欄・要照合':'原本値')+'</td></tr>';}).join('');
  var header='<th scope="col">市町村名</th><th scope="col">区分</th><th scope="col">田</th><th scope="col">普通畑</th><th scope="col">牧草地</th><th scope="col">樹園地</th><th scope="col">照合</th>';
  return '<section class="gx-dashboard" aria-labelledby="gx-ehime-soil-title">'+
    '<div class="gx-section-heading"><span class="gx-kicker">EHIME SOIL GIS · P66 · ORIGINAL ATTRIBUTES / ADMIN JOIN PENDING</span><h2 id="gx-ehime-soil-title">愛媛県の農耕地土壌GISを確認する。</h2><p>JGD2000・ポリゴン629件。田219件、普通畑189件、牧草地14件、樹園地207件。市町村名20種類・JCODE21種類・土壌群13種類・詳細分類50種類。原本XML作成日2017-01-17。</p></div>'+
    '<p class="gx-anomaly"><b>原本行政属性の要照合：</b>愛媛県の原本に徳島県系JCODE「36208」が四国中央市の樹園地に1件。JCODEと市町村名の多対多の対応に加え、郡名GUNが454件空欄で、そのうち29件は同一町名の郡名付き原本が存在します。原本を無断補正せず現行自治体統計への自動JOINは保留します。ポリゴン件数は農地面積ha、GHG削減量、認証済み炭素クレジットではありません。</p>'+
    '<div class="gx-detail-grid">'+cards+'</div>'+
    '<details><summary>原本JCODE×市町村名37組合せ</summary><div class="scroll"><table><thead><tr>'+header.replace('<th scope="col">区分</th>','<th scope="col">JCODE</th>')+'</tr></thead><tbody>'+cRows+'</tbody></table></div></details>'+
    '<details><summary>原本GUN×市町村名25組合せ</summary><div class="scroll"><table><thead><tr>'+header.replace('<th scope="col">区分</th>','<th scope="col">GUN</th>')+'</tr></thead><tbody>'+gRows+'</tbody></table></div></details>'+
    '<p class="gx-kicker">Source ledger: research/p66-ehime-soil-shapefile-source-v1.json · 元ZIP/SHP/DBF・地物座標は公開していません。</p></section>';
}
