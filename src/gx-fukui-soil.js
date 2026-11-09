/* P46: Fukui soil GIS derived aggregates. Never auto-normalize JCODE or GUN from original DBF. */
'use strict';
var GX_FUKUI_SOURCE_HASH="4c81e96c9a94f48990cd4ba8ba14cf44ce9fced90321cb30ca65f0dbc2ec5357";
var GX_FUKUI_LANDUSE=[["田",265],["普通畑",159],["牧草地",19],["樹園地",67]];
var GX_FUKUI_CODE_NAME_PAIRS=[["17206","あわら市",0,0,0,1],["18201","坂井市",10,4,0,0],["18201","永平寺町",4,0,0,0],["18201","福井市",30,21,6,8],["18201","越前町",3,0,0,0],["18201","鯖江市",1,0,0,0],["18202","敦賀市",12,5,0,1],["18204","小浜市",12,10,0,3],["18204","若狭町",3,0,0,0],["18205","勝山市",0,0,1,0],["18205","大野市",14,6,1,0],["18206","勝山市",11,9,2,1],["18207","越前市",7,0,0,0],["18207","越前町",2,0,0,0],["18207","鯖江市",10,5,0,1],["18208","あわら市",16,10,0,6],["18208","坂井市",11,3,0,1],["18209","南越前町",2,1,0,0],["18209","越前市",18,13,0,3],["18209","越前町",1,0,0,0],["18210","坂井市",19,17,1,3],["18210","永平寺町",4,0,0,0],["18322","永平寺町",10,7,0,3],["18382","池田町",7,7,2,1],["18404","南越前町",7,7,0,4],["18423","越前町",11,6,1,8],["18442","美浜町",11,10,2,7],["18442","若狭町",1,0,0,1],["18481","高浜町",8,4,1,2],["18483","おおい町",7,7,1,4],["18501","若狭町",13,7,1,9]];
var GX_FUKUI_GUN=[["",333],["三方上中郡",30],["三方郡",32],["丹生郡",26],["今立郡",17],["南条郡",18],["吉田郡",20],["大飯郡",34]];
var GX_FUKUI_GUN_NAME_PAIRS=[["","あわら市",16,10,0,7],["","勝山市",11,9,3,1],["","南越前町",2,1,0,0],["","坂井市",40,24,1,4],["","大野市",14,6,1,0],["","小浜市",12,10,0,3],["","敦賀市",12,5,0,1],["","永平寺町",8,0,0,0],["","福井市",30,21,6,8],["","若狭町",3,0,0,0],["","越前市",25,13,0,3],["","越前町",6,0,0,0],["","鯖江市",11,5,0,1],["三方上中郡","若狭町",13,7,1,9],["三方郡","美浜町",11,10,2,7],["三方郡","若狭町",1,0,0,1],["丹生郡","越前町",11,6,1,8],["今立郡","池田町",7,7,2,1],["南条郡","南越前町",7,7,0,4],["吉田郡","永平寺町",10,7,0,3],["大飯郡","おおい町",7,7,1,4],["大飯郡","高浜町",8,4,1,2]];
var GX_FUKUI_MISSING_GUN_NAMES=[{"municipality_name":"南越前町","empty_gun_landuse_counts":{"田":2,"普通畑":1,"牧草地":0,"樹園地":0},"empty_gun_polygon_count":3,"gun_names_seen_elsewhere":["南条郡"]},{"municipality_name":"永平寺町","empty_gun_landuse_counts":{"田":8,"普通畑":0,"牧草地":0,"樹園地":0},"empty_gun_polygon_count":8,"gun_names_seen_elsewhere":["吉田郡"]},{"municipality_name":"若狭町","empty_gun_landuse_counts":{"田":3,"普通畑":0,"牧草地":0,"樹園地":0},"empty_gun_polygon_count":3,"gun_names_seen_elsewhere":["三方上中郡","三方郡"]},{"municipality_name":"越前町","empty_gun_landuse_counts":{"田":6,"普通畑":0,"牧草地":0,"樹園地":0},"empty_gun_polygon_count":6,"gun_names_seen_elsewhere":["丹生郡"]}];
function gxFukuiSoilValidate(){
 if(GX_FUKUI_CODE_NAME_PAIRS.length!==31||GX_FUKUI_GUN_NAME_PAIRS.length!==22||GX_FUKUI_LANDUSE.length!==4)throw Error('P46_FUKUI_TABLE_LENGTH');
 var codes=new Map(),names=new Map(),pairs=new Set(),totals=[0,0,0,0],foreign=0,foreignPairs=0;
 GX_FUKUI_CODE_NAME_PAIRS.forEach(function(r){
  if(r.length!==6||!/^(17|18)[0-9]{3}$/.test(r[0])||typeof r[1]!=='string'||!r[1])throw Error('P46_FUKUI_CODE');
  var key=r[0]+'|'+r[1];if(pairs.has(key))throw Error('P46_FUKUI_DUPLICATE_PAIR');pairs.add(key);
  if(!codes.has(r[0]))codes.set(r[0],new Set());codes.get(r[0]).add(r[1]);
  if(!names.has(r[1]))names.set(r[1],new Set());names.get(r[1]).add(r[0]);
  var n=r.slice(2).reduce(function(a,v,i){if(!Number.isSafeInteger(v)||v<0)throw Error('P46_FUKUI_BAD_COUNT');totals[i]+=v;return a+v;},0);
  if(r[0].startsWith('17')){foreign+=n;foreignPairs++;}
 });
 if(codes.size!==18||names.size!==17||foreign!==1||foreignPairs!==1)throw Error('P46_FUKUI_CODE_ANOMALY');
 if([...codes.values()].filter(function(s){return s.size>1;}).length!==8||[...names.values()].filter(function(s){return s.size>1;}).length!==9)throw Error('P46_FUKUI_AMBIGUITY');
 if(totals.reduce(function(a,b){return a+b;},0)!==510)throw Error('P46_FUKUI_TOTAL');
 GX_FUKUI_LANDUSE.forEach(function(r,i){if(totals[i]!==r[1])throw Error('P46_FUKUI_LANDUSE');});
 var gun=Object.fromEntries(GX_FUKUI_GUN),gs=new Set(),gtotals=[0,0,0,0],gcounts={};
 GX_FUKUI_GUN_NAME_PAIRS.forEach(function(r){
  if(r.length!==6||typeof r[0]!=='string'||!r[1])throw Error('P46_FUKUI_GUN_ROW');
  var key=r[0]+'|'+r[1];if(gs.has(key))throw Error('P46_FUKUI_DUP_GUN_PAIR');gs.add(key);
  r.slice(2).forEach(function(v,i){if(!Number.isSafeInteger(v)||v<0)throw Error('P46_FUKUI_BAD_GUN_COUNT');gtotals[i]+=v;gcounts[r[0]]=(gcounts[r[0]]||0)+v;});
 });
 if(Object.keys(gun).length!==8||gun['']!==333||gun['三方郡']!==32||gun['三方上中郡']!==30||Object.values(gun).reduce(function(a,b){return a+b;},0)!==510)throw Error('P46_FUKUI_GUN_TOTAL');
 if(GX_FUKUI_GUN.some(function(r){return gcounts[r[0]]!==r[1];}))throw Error('P46_FUKUI_GUN_COUNTS');
 if(gtotals.some(function(n,i){return n!==GX_FUKUI_LANDUSE[i][1];}))throw Error('P46_FUKUI_GUN_LANDUSE');
 var wakasa=GX_FUKUI_GUN_NAME_PAIRS.find(function(r){return r[0]==='三方郡'&&r[1]==='若狭町';});
 var wakasaOther=GX_FUKUI_GUN_NAME_PAIRS.find(function(r){return r[0]==='三方上中郡'&&r[1]==='若狭町';});
 if(!wakasa||JSON.stringify(wakasa.slice(2))!==JSON.stringify([1,0,0,1])||!wakasaOther||JSON.stringify(wakasaOther.slice(2))!==JSON.stringify([13,7,1,9]))throw Error('P46_FUKUI_WAKASA_GUN');
 if(GX_FUKUI_MISSING_GUN_NAMES.length!==4)throw Error('P46_FUKUI_MISSING_GUN_NAMES');
 var missingTotal=0;
 GX_FUKUI_MISSING_GUN_NAMES.forEach(function(v){
  if(v.empty_gun_polygon_count!==Object.values(v.empty_gun_landuse_counts).reduce(function(a,b){return a+b;},0))throw Error('P46_FUKUI_MISSING_COUNT');
  var row=GX_FUKUI_GUN_NAME_PAIRS.find(function(r){return r[0]===''&&r[1]===v.municipality_name;});
  if(!row||JSON.stringify(row.slice(2))!==JSON.stringify(['田','普通畑','牧草地','樹園地'].map(function(cat){return v.empty_gun_landuse_counts[cat];})))throw Error('P46_FUKUI_MISSING_PAIR');
  var listed=GX_FUKUI_GUN_NAME_PAIRS.filter(function(r){return r[0]!==''&&r[1]===v.municipality_name;}).map(function(r){return r[0];}).sort();
  if(JSON.stringify(listed)!==JSON.stringify(v.gun_names_seen_elsewhere.slice().sort()))throw Error('P46_FUKUI_MISSING_GUN_LABELS');
  missingTotal+=v.empty_gun_polygon_count;
 });
 if(missingTotal!==20)throw Error('P46_FUKUI_MISSING_GUN_TOTAL');
 return true;
}
function gxFukuiSoilPanel(prefCode){
 if(prefCode!=='18')return '';
 gxFukuiSoilValidate();
 var fmt=function(n){return Number(n).toLocaleString('ja-JP');};
 var cards=GX_FUKUI_LANDUSE.map(function(r){return '<article class="gx-data-card"><span class="gx-kicker">地目区分 / Polygon features</span><strong>'+fmt(r[1])+' <small>件</small></strong><p>'+gxEsc(r[0])+'（面積haではありません）</p></article>';}).join('');
 var cn=new Map(),nc=new Map();
 GX_FUKUI_CODE_NAME_PAIRS.forEach(function(r){cn.set(r[0],(cn.get(r[0])||0)+1);nc.set(r[1],(nc.get(r[1])||0)+1);});
 var tableHead='<thead><tr><th>市町村名（原本）</th><th>JCODE（原本）</th><th>田</th><th>普通畑</th><th>牧草地</th><th>樹園地</th><th>合計</th><th>照合</th></tr></thead>';
 var codeRows=GX_FUKUI_CODE_NAME_PAIRS.map(function(r){
  var flags=[];
  if(!r[0].startsWith('18'))flags.push('石川県系JCODE17');
  if(cn.get(r[0])>1||nc.get(r[1])>1)flags.push('コード・名称複数対応');
  return '<tr><th scope="row">'+gxEsc(r[1])+'</th><td>'+gxEsc(r[0])+'</td>'+r.slice(2).map(function(v){return '<td>'+fmt(v)+'</td>';}).join('')+'<td>'+fmt(r.slice(2).reduce(function(a,b){return a+b;},0))+'</td><td>'+(flags.length?gxEsc(flags.join('／'))+'・要照合':'原本値')+'</td></tr>';
 }).join('');
 var gunRows=GX_FUKUI_GUN.filter(function(r){return r[0]!=='';}).map(function(r){
  var issue=r[0]==='三方郡'?'若狭町2件と郡名の揺れ・要照合':'原本値';
  return '<tr><th scope="row">'+gxEsc(r[0])+'</th><td>'+fmt(r[1])+'</td><td>'+issue+'</td></tr>';
 }).join('');
 var gunPairs=GX_FUKUI_GUN_NAME_PAIRS.map(function(r){
  var flags=[];
  if(r[0]===''&&GX_FUKUI_MISSING_GUN_NAMES.some(function(v){return v.municipality_name===r[1];}))flags.push('郡名空欄・要照合');
  if(r[1]==='若狭町'&&(r[0]==='三方郡'||r[0]==='三方上中郡'))flags.push('若狭町の郡名揺れ・要照合');
  return '<tr><th scope="row">'+gxEsc(r[1])+'</th><td>'+gxEsc(r[0]||'（空欄）')+'</td>'+r.slice(2).map(function(n){return '<td>'+fmt(n)+'</td>';}).join('')+'<td>'+(flags.length?gxEsc(flags.join('／')):'原本値')+'</td></tr>';
 }).join('');
 return '<section class="gx-dashboard" aria-labelledby="gx-fukui-soil-title">'+
  '<div class="gx-section-heading"><span class="gx-kicker">FUKUI SOIL GIS · P46 · SOURCE AUDITED / MUNICIPALITY LINKS PENDING</span>'+
  '<h2 id="gx-fukui-soil-title">福井県の農耕地土壌GISを確認する。</h2>'+
  '<p>JGD2000の原本土壌ポリゴン510件。田265件、普通畑159件、牧草地19件、樹園地67件。市町村名17種類、JCODE18種類、JCODE×名称31組合せ。土壌群16種類、詳細分類48種類。元GISのXMLメタデータ作成日2017年1月17日。</p></div>'+
  '<p class="gx-anomaly"><b>県外コードと郡名を要照合：</b>石川県「17」系のJCODE「17206／あわら市」が樹園地1件として収録。8コードが複数市町村名に、9名称が複数JCODEに対応。若狭町ではGUN「三方上中郡」30件、「三方郡」2件が混在し、郡名空欄3件もあります。さらに南越前町3件、永平寺町8件、越前町6件で郡名が空欄（郡名付きも同じ原本内に存在）です。疑義のある郡名を自動修正せず、現行自治体統計へのJCODE/GUNでの自動JOINを保留します。</p>'+
  '<div class="gx-detail-grid">'+cards+'</div>'+
  '<details><summary>原本GUN（郡名）別の件数を見る</summary><div class="scroll"><table><thead><tr><th>原本の郡名</th><th>ポリゴン件数</th><th>照合状態</th></tr></thead><tbody>'+gunRows+'</tbody></table></div><p>GUN空欄は333件、郡名付き177件。これは原本属性の件数であり、正式な郡別の農地面積ではありません。</p></details>'+
  '<details><summary>原本GUN×市町村名22組合せを見る（要照合）</summary><div class="scroll"><table><thead><tr><th>市町村名</th><th>GUN（原本）</th><th>田</th><th>普通畑</th><th>牧草地</th><th>樹園地</th><th>照合</th></tr></thead><tbody>'+gunPairs+'</tbody></table></div></details>'+
  '<details><summary>原本JCODE×市町村名31組合せを見る（要照合）</summary><div class="scroll"><table>'+tableHead+'<tbody>'+codeRows+'</tbody></table></div></details>'+
  '<p class="gx-advisory"><b>原本来歴と科学的境界：</b>農研機構「日本土壌インベントリー」は出典候補ですが、公式の福井県ZIPとのSHA一致と適用ライセンスは未確認。再配布権利の確認前なので生のShapefile/DBF/ZIPは公開GitHubへ複製せず、ハッシュと派生集計のみ登録。ポリゴン件数は農地面積ha、筆数、CH₄実測値、土壌炭素量、CO₂e削減量、認証クレジットではありません。無検証な行政コードJOINは行いません。原本監査台帳：research/p46-fukui-soil-shapefile-source-v1.json。検証方法：docs/p46-fukui-soil-gis-ja.md。</p></section>';
}
