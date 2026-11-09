/* P44 Ishikawa user-provided soil GIS. Original municipal JCODE and GUN are not normalized. */
'use strict';
var GX_ISHIKAWA_SOURCE_HASH="84cb6318af859e65827319e613baa60ce9d0c2913d859dce3e9c3f1c0050f9ad";
var GX_ISHIKAWA_LANDUSE=[["田",309],["普通畑",198],["牧草地",33],["樹園地",90]];
var GX_ISHIKAWA_CODE_NAME_PAIRS=[["16205","宝達志水町",1,0,0,0],["16209","津幡町",3,0,0,0],["16210","金沢市",1,0,0,0],["17201","内灘町",0,1,0,0],["17201","津幡町",4,2,0,1],["17201","白山市",8,1,0,0],["17201","野々市町",2,0,0,0],["17201","金沢市",17,15,4,6],["17202","七尾市",14,12,4,3],["17202","中能登町",3,0,0,0],["17202","志賀町",1,0,0,0],["17202","穴水町",1,0,0,0],["17203","加賀市",4,4,0,0],["17203","小松市",17,16,0,4],["17203","能美市",7,0,0,0],["17204","珠洲市",1,0,0,0],["17204","穴水町",0,0,0,2],["17204","能登町",2,0,0,2],["17204","輪島市",13,13,2,3],["17205","珠洲市",13,13,3,5],["17205","能登町",0,1,0,0],["17206","加賀市",13,15,0,9],["17207","中能登町",5,1,0,0],["17207","宝達志水町",4,1,0,1],["17207","志賀町",3,2,0,1],["17207","羽咋市",12,15,0,3],["17209","かほく市",12,9,2,6],["17209","内灘町",0,2,0,0],["17209","宝達志水町",5,0,1,0],["17209","津幡町",5,2,0,2],["17210","川北町",9,0,0,1],["17210","白山市",16,13,0,5],["17210","能美市",2,0,0,0],["17210","野々市町",4,0,0,0],["17211","川北町",3,0,0,0],["17211","能美市",13,7,1,0],["17324","川北町",10,0,0,0],["17344","野々市町",5,0,0,0],["17361","津幡町",10,8,0,4],["17365","内灘町",3,3,3,0],["17384","中能登町",1,0,0,0],["17384","志賀町",12,11,4,8],["17386","宝達志水町",18,9,3,7],["17407","中能登町",6,6,0,6],["17461","穴水町",10,4,1,3],["17461","能登町",2,3,1,3],["17463","能登町",14,9,4,5]];
var GX_ISHIKAWA_GUN=[["",434],["河北郡",31],["石川郡",5],["羽咋郡",73],["能美郡",10],["鳳珠郡",59],["鹿島郡",18]];
var GX_ISHIKAWA_GUN_NAME_PAIRS=[["","かほく市",12,9,2,6],["","七尾市",14,12,4,3],["","中能登町",8,1,0,0],["","内灘町",0,3,0,0],["","加賀市",17,19,0,9],["","宝達志水町",10,1,1,1],["","小松市",17,16,0,4],["","川北町",12,0,0,1],["","志賀町",4,2,0,1],["","津幡町",12,4,0,3],["","珠洲市",14,13,3,5],["","白山市",24,14,0,5],["","穴水町",1,0,0,2],["","羽咋市",12,15,0,3],["","能登町",2,1,0,2],["","能美市",22,7,1,0],["","輪島市",13,13,2,3],["","野々市町",6,0,0,0],["","金沢市",18,15,4,6],["河北郡","内灘町",3,3,3,0],["河北郡","津幡町",10,8,0,4],["石川郡","野々市町",5,0,0,0],["羽咋郡","中能登町",1,0,0,0],["羽咋郡","宝達志水町",18,9,3,7],["羽咋郡","志賀町",12,11,4,8],["能美郡","川北町",10,0,0,0],["鳳珠郡","穴水町",10,4,1,3],["鳳珠郡","能登町",16,12,5,8],["鹿島郡","中能登町",6,6,0,6]];
function gxIshikawaSoilValidate(){
 if(GX_ISHIKAWA_CODE_NAME_PAIRS.length!==47||GX_ISHIKAWA_GUN_NAME_PAIRS.length!==29||GX_ISHIKAWA_LANDUSE.length!==4)throw Error('P44_ISHIKAWA_LENGTH');
 var codes=new Map(),names=new Map(),seen=new Set(),totals=[0,0,0,0],foreign=0,foreignPairs=0,oldName=0;
 GX_ISHIKAWA_CODE_NAME_PAIRS.forEach(function(r){
  if(r.length!==6||!/^(16|17)[0-9]{3}$/.test(r[0])||typeof r[1]!=='string'||!r[1])throw Error('P44_ISHIKAWA_CODE');
  var key=r[0]+'|'+r[1];if(seen.has(key))throw Error('P44_ISHIKAWA_PAIR_DUPLICATE');seen.add(key);
  if(!codes.has(r[0]))codes.set(r[0],new Set());codes.get(r[0]).add(r[1]);
  if(!names.has(r[1]))names.set(r[1],new Set());names.get(r[1]).add(r[0]);
  var n=r.slice(2).reduce(function(sum,x,i){if(!Number.isSafeInteger(x)||x<0)throw Error('P44_ISHIKAWA_BAD_COUNT');totals[i]+=x;return sum+x;},0);
  if(r[0].startsWith('16')){foreign+=n;foreignPairs++;}
  if(r[1]==='野々市町')oldName+=n;
 });
 if(codes.size!==22||names.size!==19||foreign!==5||foreignPairs!==3||oldName!==11)throw Error('P44_ISHIKAWA_CODE_NAME_ANOMALY');
 if([...codes.values()].filter(function(v){return v.size>1;}).length!==11||[...names.values()].filter(function(v){return v.size>1;}).length!==14)throw Error('P44_ISHIKAWA_MULTIPLE_MAPPINGS');
 if(totals.reduce(function(a,b){return a+b;},0)!==630)throw Error('P44_ISHIKAWA_TOTAL');
 GX_ISHIKAWA_LANDUSE.forEach(function(r,i){if(totals[i]!==r[1])throw Error('P44_ISHIKAWA_LANDUSE');});
 var gun=Object.fromEntries(GX_ISHIKAWA_GUN),gunSeen=new Set(),gTotals=[0,0,0,0],gCounts={};
 GX_ISHIKAWA_GUN_NAME_PAIRS.forEach(function(r){
  if(r.length!==6||typeof r[0]!=='string'||typeof r[1]!=='string'||!r[1])throw Error('P44_ISHIKAWA_GUN_PAIR');
  var key=r[0]+'|'+r[1];if(gunSeen.has(key))throw Error('P44_ISHIKAWA_GUN_DUPLICATE');gunSeen.add(key);
  r.slice(2).forEach(function(x,i){if(!Number.isSafeInteger(x)||x<0)throw Error('P44_ISHIKAWA_BAD_GUN_COUNT');gTotals[i]+=x;gCounts[r[0]]=(gCounts[r[0]]||0)+x;});
 });
 if(Object.keys(gun).length!==7||gun['']!==434||gun['羽咋郡']!==73||gun['鹿島郡']!==18||Object.values(gun).reduce(function(a,b){return a+b;},0)!==630)throw Error('P44_ISHIKAWA_GUN_COUNTS');
 if(GX_ISHIKAWA_GUN.some(function(r){return r[1]!==gCounts[r[0]];}))throw Error('P44_ISHIKAWA_GUN_PARITY');
 if(gTotals.some(function(n,i){return n!==GX_ISHIKAWA_LANDUSE[i][1];}))throw Error('P44_ISHIKAWA_GUN_LANDUSE');
 var suspect=GX_ISHIKAWA_GUN_NAME_PAIRS.find(function(r){return r[0]==='羽咋郡'&&r[1]==='中能登町';});
 if(!suspect||JSON.stringify(suspect.slice(2))!==JSON.stringify([1,0,0,0]))throw Error('P44_ISHIKAWA_NAKANOTO_GUN');
 return true;
}
function gxIshikawaSoilPanel(prefCode){
 if(prefCode!=='17')return '';
 gxIshikawaSoilValidate();
 var fmt=function(n){return Number(n).toLocaleString('ja-JP');};
 var cards=GX_ISHIKAWA_LANDUSE.map(function(r){return '<article class="gx-data-card"><span class="gx-kicker">地目区分 / Polygon features</span><strong>'+fmt(r[1])+' <small>件</small></strong><p>'+gxEsc(r[0])+'（面積haではありません）</p></article>';}).join('');
 var codeNames=new Map(),nameCodes=new Map();
 GX_ISHIKAWA_CODE_NAME_PAIRS.forEach(function(r){codeNames.set(r[0],(codeNames.get(r[0])||0)+1);nameCodes.set(r[1],(nameCodes.get(r[1])||0)+1);});
 var head='<thead><tr><th scope="col">市町村名（原本）</th><th scope="col">JCODE（原本）</th><th scope="col">田</th><th scope="col">普通畑</th><th scope="col">牧草地</th><th scope="col">樹園地</th><th scope="col">計</th><th scope="col">照合状態</th></tr></thead>';
 var body=GX_ISHIKAWA_CODE_NAME_PAIRS.map(function(r){
  var flags=[];
  if(!r[0].startsWith('17'))flags.push('富山県系JCODE16');
  if(codeNames.get(r[0])>1||nameCodes.get(r[1])>1)flags.push('コード・名称複数対応');
  if(r[1]==='野々市町')flags.push('原本の旧自治体名');
  return '<tr><th scope="row">'+gxEsc(r[1])+'</th><td>'+gxEsc(r[0])+'</td>'+r.slice(2).map(function(n){return '<td>'+fmt(n)+'</td>';}).join('')+'<td>'+fmt(r.slice(2).reduce(function(a,b){return a+b;},0))+'</td><td>'+(flags.length?gxEsc(flags.join('／'))+'・要照合':'原本値')+'</td></tr>';
 }).join('');
 var gun=GX_ISHIKAWA_GUN.filter(function(r){return r[0]!=='';}).map(function(r){return '<tr><th scope="row">'+gxEsc(r[0])+'</th><td>'+fmt(r[1])+'</td><td>'+(r[0]==='羽咋郡'?'中能登町1件に疑義・要照合':r[0]==='石川郡'?'旧名称「野々市町」・要照合':'原本値')+'</td></tr>';}).join('');
 var detail=GX_ISHIKAWA_GUN_NAME_PAIRS.map(function(r){return '<tr><th scope="row">'+gxEsc(r[1])+'</th><td>'+gxEsc(r[0]||'（空欄）')+'</td>'+r.slice(2).map(function(n){return '<td>'+fmt(n)+'</td>';}).join('')+'<td>'+(r[0]==='羽咋郡'&&r[1]==='中能登町'?'郡名不整合・要照合':r[1]==='野々市町'?'旧自治体名・要照合':'原本値')+'</td></tr>';}).join('');
 return '<section class="gx-dashboard" aria-labelledby="gx-ishikawa-soil-title">'+
  '<div class="gx-section-heading"><span class="gx-kicker">ISHIKAWA SOIL GIS · P44 · ORIGINAL ATTRIBUTE AUDITED</span>'+
  '<h2 id="gx-ishikawa-soil-title">石川県の農耕地土壌GISを確認する。</h2>'+
  '<p>原本JGD2000の土壌ポリゴン630件。田309件、普通畑198件、牧草地33件、樹園地90件。市町村名19種類、JCODE22種類、組合せ47通り。土壌群18種類・詳細分類59種類。原本のXML作成日2017年1月17日。</p></div>'+
  '<p class="gx-anomaly"><b>行政コード・旧自治体名・郡名が要照合：</b>石川県「17」でなく富山県「16」系のJCODEが3組合せ・5ポリゴンあります。JCODE11種類が複数名称に、名称14種類が複数コードに対応。原本の旧自治体名「野々市町」は11件。GUN「羽咋郡／中能登町」は1件（田）で、本来の郡名（鹿島郡）との整合に疑義があります。原本を自動修正せず、市町村・郡名別の確定集計や外部統計とのJOINを保留します。</p>'+
  '<div class="gx-detail-grid">'+cards+'</div>'+
  '<details><summary>原本GUN（郡名）別の件数を見る</summary><div class="scroll"><table><thead><tr><th scope="col">郡名（原本）</th><th scope="col">ポリゴン件数</th><th scope="col">要照合事項</th></tr></thead><tbody>'+gun+'</tbody></table></div><p>郡名空欄434件、郡名付き196件。郡名は原本属性であり、現行自治体と照合済みの正式な郡別統計ではありません。</p></details>'+
  '<details><summary>GUN×市町村名29組合せを見る</summary><div class="scroll"><table><thead><tr><th>市町村名</th><th>GUN（原本）</th><th>田</th><th>普通畑</th><th>牧草地</th><th>樹園地</th><th>照合状態</th></tr></thead><tbody>'+detail+'</tbody></table></div></details>'+
  '<details><summary>JCODE×市町村名47組合せを見る（要照合）</summary><div class="scroll"><table>'+head+'<tbody>'+body+'</tbody></table></div></details>'+
  '<p class="gx-advisory"><b>出典候補と科学的・配布上の境界：</b>農研機構「日本土壌インベントリー」は原本の候補ですが、公式石川県ZIPとのSHA一致・適用ライセンスは未照合。原Shapefile・DBF・ZIPを公開GitHubへ複製せず、原本ハッシュと派生集計のみ登録。ポリゴン件数は農地面積ha、筆数、土壌炭素量、CH₄実測、CO₂e削減量、J-クレジット認証量ではありません。2024年水稲統計や土地被覆との行政コードによる自動結合も行いません。原本監査台帳：research/p44-ishikawa-soil-shapefile-source-v1.json。検証：docs/p44-ishikawa-soil-gis-ja.md。</p></section>';
}
