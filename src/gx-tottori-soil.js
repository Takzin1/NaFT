/* NaFT P59 Tottori soil GIS: read-only original attribute aggregates; no raw shapefile and no automated municipality join. */
'use strict';
var GX_TOTTORI_SOURCE_SHA="a4bdf588790b48d87d445d25c03151caae781937b5ccb3b3054e574acf558915";
var GX_TOTTORI_LANDUSE=[["田",352],["普通畑",358],["牧草地",41],["樹園地",281]];
var GX_TOTTORI_CODE_PAIRS=[["28586","岩美町",1,0,0,0],["28586","鳥取市",0,0,1,0],["31201","三朝町",0,0,1,0],["31201","八頭町",2,0,1,3],["31201","岩美町",1,0,1,0],["31201","湯梨浜町",1,1,0,3],["31201","鳥取市",27,36,10,36],["31202","伯耆町",7,1,0,0],["31202","南部町",3,1,0,0],["31202","大山町",4,1,0,0],["31202","日吉津村",4,1,0,0],["31202","米子市",26,27,4,16],["31203","倉吉市",37,37,2,33],["31203","北栄町",7,6,0,4],["31203","湯梨浜町",2,1,0,6],["31204","境港市",1,2,0,0],["31302","岩美町",18,10,0,8],["31325","八頭町",2,1,0,0],["31325","若桜町",3,5,0,5],["31328","智頭町",5,3,0,6],["31329","八頭町",17,16,0,21],["31364","三朝町",12,11,1,14],["31364","湯梨浜町",0,0,0,1],["31370","湯梨浜町",20,22,0,32],["31371","北栄町",1,8,0,1],["31371","大山町",0,1,0,1],["31371","琴浦町",18,26,1,16],["31372","北栄町",14,23,1,17],["31384","日吉津村",5,3,0,0],["31386","伯耆町",0,1,1,0],["31386","大山町",21,32,6,24],["31389","伯耆町",1,2,0,1],["31389","南部町",18,15,1,10],["31389","日南町",1,0,0,0],["31390","伯耆町",17,18,4,11],["31390","江府町",1,2,0,0],["31401","日南町",22,14,2,10],["31402","日野町",14,14,0,1],["31402","江府町",1,0,0,0],["31403","江府町",18,17,4,1]];
var GX_TOTTORI_GUN_PAIRS=[["","三朝町",0,0,1,0],["","伯耆町",7,1,0,0],["","倉吉市",37,37,2,33],["","八頭町",2,0,1,3],["","北栄町",7,6,0,4],["","南部町",3,1,0,0],["","境港市",1,2,0,0],["","大山町",4,1,0,0],["","岩美町",1,0,1,0],["","日吉津村",4,1,0,0],["","湯梨浜町",3,2,0,9],["","米子市",26,27,4,16],["","鳥取市",27,36,10,36],["八頭郡","八頭町",19,17,0,21],["八頭郡","智頭町",5,3,0,6],["八頭郡","若桜町",3,5,0,5],["岩美郡","岩美町",18,10,0,8],["日野郡","日南町",22,14,2,10],["日野郡","日野町",14,14,0,1],["日野郡","江府町",19,17,4,1],["東伯郡","三朝町",12,11,1,14],["東伯郡","北栄町",15,31,1,18],["東伯郡","大山町",0,1,0,1],["東伯郡","湯梨浜町",20,22,0,33],["東伯郡","琴浦町",18,26,1,16],["美方郡","岩美町",1,0,0,0],["美方郡","鳥取市",0,0,1,0],["西伯郡","伯耆町",18,21,5,12],["西伯郡","南部町",18,15,1,10],["西伯郡","大山町",21,32,6,24],["西伯郡","日南町",1,0,0,0],["西伯郡","日吉津村",5,3,0,0],["西伯郡","江府町",1,2,0,0]];
var GX_TOTTORI_GUN_COUNTS=[["",356],["東伯郡",241],["西伯郡",195],["日野郡",118],["八頭郡",84],["岩美郡",36],["美方郡",2]];
function gxTottoriSoilValidate(){
  if(GX_TOTTORI_SOURCE_SHA!=='a4bdf588790b48d87d445d25c03151caae781937b5ccb3b3054e574acf558915')throw Error('P59_TOTTORI_SOURCE_SHA');
  if(GX_TOTTORI_CODE_PAIRS.length!==40||GX_TOTTORI_GUN_PAIRS.length!==33)throw Error('P59_TOTTORI_PAIR_LENGTH');
  var tot=[0,0,0,0], county=[0,0,0,0], codes=new Map(),names=new Map(),n=0;
  GX_TOTTORI_CODE_PAIRS.forEach(function(r){
    if(r.length!==6||!/^\d{5}$/.test(r[0])||!r[1])throw Error('P59_TOTTORI_CODE_FORMAT');
    if(!codes.has(r[0]))codes.set(r[0],new Set());codes.get(r[0]).add(r[1]);
    if(!names.has(r[1]))names.set(r[1],new Set());names.get(r[1]).add(r[0]);
    r.slice(2).forEach(function(v,i){if(!Number.isSafeInteger(v)||v<0)throw Error('P59_TOTTORI_COUNT');tot[i]+=v;});
    if(!r[0].startsWith('31')){if(r[0]!=='28586')throw Error('P59_TOTTORI_FOREIGN_CODE');n+=r.slice(2).reduce(function(a,b){return a+b;},0);}
  });
  if(codes.size!==20||names.size!==19||n!==2)throw Error('P59_TOTTORI_CODE_TOTALS');
  if([...codes.values()].filter(function(s){return s.size>1;}).length!==11||[...names.values()].filter(function(s){return s.size>1;}).length!==12)throw Error('P59_TOTTORI_NON_UNIQUE_CODES');
  GX_TOTTORI_GUN_PAIRS.forEach(function(r){if(r.length!==6||!r[1])throw Error('P59_TOTTORI_GUN_FORMAT');r.slice(2).forEach(function(v,i){if(!Number.isSafeInteger(v)||v<0)throw Error('P59_TOTTORI_GUN_COUNT');county[i]+=v;});});
  if(JSON.stringify(tot)!==JSON.stringify([352,358,41,281])||JSON.stringify(county)!==JSON.stringify(tot))throw Error('P59_TOTTORI_LANDUSE_PARITY');
  var byGun=Object.fromEntries(GX_TOTTORI_GUN_COUNTS);
  GX_TOTTORI_GUN_COUNTS.forEach(function(g){var found=GX_TOTTORI_GUN_PAIRS.filter(function(r){return r[0]===g[0];}).reduce(function(s,r){return s+r.slice(2).reduce(function(a,b){return a+b;},0);},0);if(found!==g[1])throw Error('P59_TOTTORI_GUN_TOTAL');});
  if(byGun['美方郡']!==2||byGun['']!==356)throw Error('P59_TOTTORI_FOREIGN_GUN');
  return true;
}
function gxTottoriSoilPanel(prefCode){
  if(prefCode!=='31')return '';
  gxTottoriSoilValidate();
  var fmt=function(v){return Number(v).toLocaleString('ja-JP');};
  var cards=GX_TOTTORI_LANDUSE.map(function(r){return '<article class="gx-data-card"><span class="gx-kicker">地目区分 / Polygon features</span><strong>'+fmt(r[1])+' <small>件</small></strong><p>'+gxEsc(r[0])+'（農地面積haではありません）</p></article>';}).join('');
  var codeRows=GX_TOTTORI_CODE_PAIRS.map(function(r){var warn=!r[0].startsWith('31')?'兵庫県系コード・要照合':'原本（行政コード要照合）';return '<tr><th scope="row">'+gxEsc(r[1])+'</th><td>'+gxEsc(r[0])+'</td>'+r.slice(2).map(function(v){return '<td>'+fmt(v)+'</td>';}).join('')+'<td>'+gxEsc(warn)+'</td></tr>';}).join('');
  var gunRows=GX_TOTTORI_GUN_PAIRS.map(function(r){return '<tr><th scope="row">'+gxEsc(r[1])+'</th><td>'+gxEsc(r[0]||'（空欄）')+'</td>'+r.slice(2).map(function(v){return '<td>'+fmt(v)+'</td>';}).join('')+'<td>'+(r[0]==='美方郡'?'県外郡名・要照合':'原本（郡名要照合）')+'</td></tr>';}).join('');
  var columns='<th>市町村名</th><th>区分</th><th>田</th><th>普通畑</th><th>牧草地</th><th>樹園地</th><th>照合</th>';
  return '<section class="gx-dashboard" aria-labelledby="gx-tottori-soil-title">'+
    '<div class="gx-section-heading"><span class="gx-kicker">TOTTORI SOIL GIS · P59 · ORIGINAL ATTRIBUTES / PENDING RECONCILIATION</span><h2 id="gx-tottori-soil-title">鳥取県の農耕地土壌GISを確認する。</h2><p>JGD2000・ポリゴン1,032件。田352件、普通畑358件、牧草地41件、樹園地281件。土壌群20種類、詳細分類97種類。元XML作成日2017-01-17。</p></div>'+
    '<p class="gx-anomaly"><b>原本属性の要照合：</b>兵庫県系JCODE 28586 が2件（岩美町・鳥取市）、兵庫県の郡名「美方郡」が2件。JCODEは複数自治体名に対応し、郡名も空欄356件・複数郡名が混在しています。原本を修正せず現行行政統計への自動結合を保留します。ポリゴン件数は面積・炭素貯留量・GHG削減量・認証済みクレジット数ではありません。</p>'+
    '<div class="gx-detail-grid">'+cards+'</div>'+
    '<details><summary>原本JCODE×市町村名40組合せ</summary><div class="scroll"><table><thead><tr>'+columns.replace('<th>区分</th>','<th>JCODE</th>')+'</tr></thead><tbody>'+codeRows+'</tbody></table></div></details>'+
    '<details><summary>原本GUN×市町村名33組合せ</summary><div class="scroll"><table><thead><tr>'+columns.replace('<th>区分</th>','<th>GUN</th>')+'</tr></thead><tbody>'+gunRows+'</tbody></table></div></details>'+
    '<p class="gx-kicker">Original ZIP hashes and audit: research/p59-tottori-soil-shapefile-source-v1.json · 原本ZIPと地物座標はGitHub上に再配布しません。</p></section>';
}
