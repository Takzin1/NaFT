/* NaFT P60 Shimane agricultural soil GIS: derived aggregates only, unresolved administration codes. */
'use strict';
var GX_SHIMANE_SOURCE_SHA="1c54bcdf1360103a856404e32bb6a31e5072ab35eb76b805b367ad8c500e0d90";
var GX_SHIMANE_LANDUSE=[["田",350],["普通畑",309],["牧草地",81],["樹園地",187]];
var GX_SHIMANE_CODE_PAIRS=[["31202","安来市",1,0,0,0],["32201","出雲市",2,0,0,0],["32201","安来市",0,1,0,1],["32201","松江市",27,31,4,13],["32201","雲南市",1,1,0,1],["32202","江津市",1,0,0,0],["32202","浜田市",22,21,5,15],["32202","益田市",2,0,0,0],["32202","邑南町",1,0,0,0],["32203","出雲市",25,28,6,25],["32203","大田市",1,0,0,0],["32203","雲南市",7,3,0,3],["32204","益田市",23,23,9,16],["32205","大田市",26,26,8,14],["32205","川本町",1,0,1,0],["32205","美郷町",1,1,1,0],["32205","飯南町",0,0,2,0],["32206","安来市",21,19,3,13],["32207","川本町",1,0,0,0],["32207","江津市",19,20,2,5],["32209","雲南市",25,24,10,15],["32343","奥出雲町",27,17,4,6],["32386","美郷町",1,0,0,0],["32386","飯南町",18,12,9,4],["32441","川本町",13,11,0,9],["32441","美郷町",1,0,0,0],["32448","美郷町",13,10,1,6],["32449","邑南町",22,16,4,6],["32501","吉賀町",0,1,0,0],["32501","津和野町",20,20,3,22],["32505","吉賀町",14,9,0,7],["32525","海士町",1,2,1,1],["32526","西ノ島町",2,3,3,1],["32527","知夫村",1,1,1,0],["32528","隠岐の島町",10,9,4,4]];
var GX_SHIMANE_GUN_PAIRS=[["","出雲市",27,28,6,25],["","大田市",27,26,8,14],["","安来市",22,20,3,14],["","川本町",2,0,1,0],["","松江市",27,31,4,13],["","江津市",20,20,2,5],["","浜田市",22,21,5,15],["","益田市",25,23,9,16],["","美郷町",1,1,1,0],["","邑南町",1,0,0,0],["","雲南市",33,28,10,19],["","飯南町",0,0,2,0],["仁多郡","奥出雲町",27,17,4,6],["邑智郡","川本町",13,11,0,9],["邑智郡","美郷町",14,10,1,6],["邑智郡","邑南町",22,16,4,6],["隠岐郡","海士町",1,2,1,1],["隠岐郡","知夫村",1,1,1,0],["隠岐郡","西ノ島町",2,3,3,1],["隠岐郡","隠岐の島町",10,9,4,4],["飯石郡","美郷町",1,0,0,0],["飯石郡","飯南町",18,12,9,4],["鹿足郡","吉賀町",14,10,0,7],["鹿足郡","津和野町",20,20,3,22]];
var GX_SHIMANE_GUN_COUNTS=[["",577],["邑智郡",112],["鹿足郡",96],["仁多郡",54],["隠岐郡",44],["飯石郡",44]];
function gxShimaneSoilValidate(){
  if(GX_SHIMANE_SOURCE_SHA!=='1c54bcdf1360103a856404e32bb6a31e5072ab35eb76b805b367ad8c500e0d90')throw Error('P60_SHIMANE_SHA');
  if(GX_SHIMANE_CODE_PAIRS.length!==35||GX_SHIMANE_GUN_PAIRS.length!==24)throw Error('P60_SHIMANE_PAIR_LENGTH');
  var codeNames=new Map(),nameCodes=new Map(),nameGuns=new Map(),count=[0,0,0,0],gunCount=[0,0,0,0],foreign=0;
  GX_SHIMANE_CODE_PAIRS.forEach(function(r){
    if(r.length!==6||!/^\d{5}$/.test(r[0])||!r[1])throw Error('P60_SHIMANE_CODE_FORMAT');
    if(!codeNames.has(r[0]))codeNames.set(r[0],new Set());codeNames.get(r[0]).add(r[1]);
    if(!nameCodes.has(r[1]))nameCodes.set(r[1],new Set());nameCodes.get(r[1]).add(r[0]);
    r.slice(2).forEach(function(v,i){if(!Number.isSafeInteger(v)||v<0)throw Error('P60_SHIMANE_COUNT');count[i]+=v;});
    if(!r[0].startsWith('32')){if(r[0]!=='31202')throw Error('P60_SHIMANE_FOREIGN_CODE');foreign+=r.slice(2).reduce(function(a,b){return a+b;},0);}
  });
  if(codeNames.size!==20||nameCodes.size!==19||foreign!==1)throw Error('P60_SHIMANE_CODE_TOTALS');
  if([...codeNames.values()].filter(function(s){return s.size>1;}).length!==8||[...nameCodes.values()].filter(function(s){return s.size>1;}).length!==11)throw Error('P60_SHIMANE_CODE_CONFLICTS');
  GX_SHIMANE_GUN_PAIRS.forEach(function(r){
    if(r.length!==6||!r[1])throw Error('P60_SHIMANE_GUN_FORMAT');
    if(r[0]){if(!nameGuns.has(r[1]))nameGuns.set(r[1],new Set());nameGuns.get(r[1]).add(r[0]);}
    r.slice(2).forEach(function(v,i){if(!Number.isSafeInteger(v)||v<0)throw Error('P60_SHIMANE_GUN_COUNT');gunCount[i]+=v;});
  });
  if(JSON.stringify(count)!==JSON.stringify([350,309,81,187])||JSON.stringify(gunCount)!==JSON.stringify(count))throw Error('P60_SHIMANE_LANDUSE_PARITY');
  var gcounts=Object.fromEntries(GX_SHIMANE_GUN_COUNTS);
  GX_SHIMANE_GUN_COUNTS.forEach(function(g){var c=GX_SHIMANE_GUN_PAIRS.filter(function(r){return r[0]===g[0];}).reduce(function(s,r){return s+r.slice(2).reduce(function(a,b){return a+b;},0);},0);if(g[1]!==c)throw Error('P60_SHIMANE_GUN_TOTAL');});
  if(gcounts['']!==577||gcounts['邑智郡']!==112||nameGuns.get('美郷町').size!==2)throw Error('P60_SHIMANE_GUN_ANOMALY');
  return true;
}
function gxShimaneSoilPanel(prefCode){
  if(prefCode!=='32')return '';
  gxShimaneSoilValidate();
  var fmt=function(n){return Number(n).toLocaleString('ja-JP');};
  var cards=GX_SHIMANE_LANDUSE.map(function(r){return '<article class="gx-data-card"><span class="gx-kicker">地目区分 / Polygon features</span><strong>'+fmt(r[1])+' <small>件</small></strong><p>'+gxEsc(r[0])+'（農地面積haではありません）</p></article>';}).join('');
  var codeRows=GX_SHIMANE_CODE_PAIRS.map(function(r){var warn=!r[0].startsWith('32')?'鳥取県系コード・要照合':'原本属性（行政コード要照合）';return '<tr><th scope="row">'+gxEsc(r[1])+'</th><td>'+gxEsc(r[0])+'</td>'+r.slice(2).map(function(v){return '<td>'+fmt(v)+'</td>';}).join('')+'<td>'+gxEsc(warn)+'</td></tr>';}).join('');
  var gunRows=GX_SHIMANE_GUN_PAIRS.map(function(r){var warn=r[1]==='美郷町'&&r[0]?'同名の複数郡・要照合':!r[0]?'郡名空欄・要照合':'原本値';return '<tr><th scope="row">'+gxEsc(r[1])+'</th><td>'+gxEsc(r[0]||'（空欄）')+'</td>'+r.slice(2).map(function(v){return '<td>'+fmt(v)+'</td>';}).join('')+'<td>'+gxEsc(warn)+'</td></tr>';}).join('');
  var th='<th>市町村名</th><th>区分</th><th>田</th><th>普通畑</th><th>牧草地</th><th>樹園地</th><th>照合</th>';
  return '<section class="gx-dashboard" aria-labelledby="gx-shimane-soil-title">'+
    '<div class="gx-section-heading"><span class="gx-kicker">SHIMANE SOIL GIS · P60 · ORIGINAL ATTRIBUTES / RECONCILIATION PENDING</span><h2 id="gx-shimane-soil-title">島根県の農耕地土壌GISを確認する。</h2><p>JGD2000・ポリゴン927件。田350件、普通畑309件、牧草地81件、樹園地187件。市町村名19種類、JCODE20種類、土壌群19種類・詳細分類74種類。XML作成日2017-01-17。</p></div>'+
    '<p class="gx-anomaly"><b>原本属性の要照合：</b>島根県内の原本に鳥取県系JCODE 31202 が1件（安来市の田）。郡名GUNは577件空欄、同じ美郷町に「邑智郡」「飯石郡」が記録されています。コードと市町村名には多対多の対応があり、原本を無断補正せず、現行自治体・行政統計への自動結合を保留します。ポリゴン件数は面積、土壌炭素量、GHG削減量、認証済みJ-クレジット量ではありません。</p>'+
    '<div class="gx-detail-grid">'+cards+'</div>'+
    '<details><summary>原本JCODE×市町村名35組合せ</summary><div class="scroll"><table><thead><tr>'+th.replace('<th>区分</th>','<th>JCODE</th>')+'</tr></thead><tbody>'+codeRows+'</tbody></table></div></details>'+
    '<details><summary>原本GUN×市町村名24組合せ</summary><div class="scroll"><table><thead><tr>'+th.replace('<th>区分</th>','<th>GUN</th>')+'</tr></thead><tbody>'+gunRows+'</tbody></table></div></details>'+
    '<p class="gx-kicker">Source manifest: research/p60-shimane-soil-shapefile-source-v1.json · 元ZIP・原本GIS座標はGitHubで公開しません。</p></section>';
}
