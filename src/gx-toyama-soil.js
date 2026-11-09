/* P45: Toyama soil GIS. Original code↔name ambiguities and GUN blanks preserved. */
'use strict';
var GX_TOYAMA_SOURCE_HASH="fbbe882b713db76fc18fde6106cdbaeb2a82a2302e97b1cb8dc33b1d8cc19ab7";
var GX_TOYAMA_LANDUSE=[["田",428],["普通畑",116],["牧草地",18],["樹園地",70]];
var GX_TOYAMA_CODE_NAME_PAIRS=[["16201","上市町",8,0,0,0],["16201","富山市",45,27,7,9],["16201","射水市",8,4,0,3],["16201","滑川市",2,0,0,0],["16201","砺波市",3,0,0,0],["16201","立山町",1,0,0,0],["16201","舟橋村",3,1,0,0],["16202","射水市",4,1,0,1],["16202","小矢部市",6,0,0,0],["16202","氷見市",2,1,0,0],["16202","砺波市",12,0,0,0],["16202","高岡市",26,7,1,7],["16204","魚津市",19,6,0,13],["16204","黒部市",6,0,0,0],["16205","氷見市",10,8,0,4],["16206","上市町",7,0,0,0],["16206","滑川市",16,2,0,3],["16207","入善町",5,0,0,0],["16207","黒部市",21,5,4,2],["16208","南砺市",7,1,0,0],["16208","射水市",2,1,0,0],["16208","小矢部市",5,0,0,0],["16208","砺波市",23,6,0,2],["16209","南砺市",3,0,0,0],["16209","小矢部市",24,8,1,1],["16210","南砺市",30,13,4,8],["16211","射水市",17,11,0,8],["16321","上市町",1,0,0,0],["16321","立山町",9,0,0,0],["16321","舟橋村",9,0,0,0],["16322","上市町",21,3,1,3],["16322","立山町",6,0,0,1],["16323","立山町",23,6,0,4],["16342","入善町",14,0,0,0],["16342","朝日町",10,0,0,0],["16343","朝日町",20,5,0,1]];
var GX_TOYAMA_GUN=[["",495],["下新川郡",50],["中新川郡",87]];
var GX_TOYAMA_GUN_NAME_PAIRS=[["","上市町",15,0,0,0],["","入善町",5,0,0,0],["","南砺市",40,14,4,8],["","富山市",45,27,7,9],["","射水市",31,17,0,12],["","小矢部市",35,8,1,1],["","氷見市",12,9,0,4],["","滑川市",18,2,0,3],["","砺波市",38,6,0,2],["","立山町",1,0,0,0],["","舟橋村",3,1,0,0],["","高岡市",26,7,1,7],["","魚津市",19,6,0,13],["","黒部市",27,5,4,2],["下新川郡","入善町",14,0,0,0],["下新川郡","朝日町",30,5,0,1],["中新川郡","上市町",22,3,1,3],["中新川郡","立山町",38,6,0,5],["中新川郡","舟橋村",9,0,0,0]];
var GX_TOYAMA_EMPTY_GUN_KNOWN_TOWNS=[{"municipality_name":"上市町","empty_gun_landuse_counts":{"田":15,"普通畑":0,"牧草地":0,"樹園地":0},"empty_gun_polygon_count":15,"gun_names_seen_elsewhere":["中新川郡"]},{"municipality_name":"入善町","empty_gun_landuse_counts":{"田":5,"普通畑":0,"牧草地":0,"樹園地":0},"empty_gun_polygon_count":5,"gun_names_seen_elsewhere":["下新川郡"]},{"municipality_name":"立山町","empty_gun_landuse_counts":{"田":1,"普通畑":0,"牧草地":0,"樹園地":0},"empty_gun_polygon_count":1,"gun_names_seen_elsewhere":["中新川郡"]},{"municipality_name":"舟橋村","empty_gun_landuse_counts":{"田":3,"普通畑":1,"牧草地":0,"樹園地":0},"empty_gun_polygon_count":4,"gun_names_seen_elsewhere":["中新川郡"]}];
function gxToyamaSoilValidate(){
 if(GX_TOYAMA_LANDUSE.length!==4||GX_TOYAMA_CODE_NAME_PAIRS.length!==36||GX_TOYAMA_GUN_NAME_PAIRS.length!==19||GX_TOYAMA_GUN.length!==3)throw Error('P45_TOYAMA_PAIR_COUNT');
 var codes=new Map(),names=new Map(),seen=new Set(),total=[0,0,0,0],foreign=0;
 GX_TOYAMA_CODE_NAME_PAIRS.forEach(function(row){
  if(row.length!==6||!/^16[0-9]{3}$/.test(row[0])||!row[1])throw Error('P45_TOYAMA_JCODE');
  var key=row[0]+'|'+row[1];if(seen.has(key))throw Error('P45_TOYAMA_DUPLICATE_CODE_NAME');seen.add(key);
  if(!codes.has(row[0]))codes.set(row[0],new Set());codes.get(row[0]).add(row[1]);
  if(!names.has(row[1]))names.set(row[1],new Set());names.get(row[1]).add(row[0]);
  row.slice(2).forEach(function(n,i){if(!Number.isSafeInteger(n)||n<0)throw Error('P45_TOYAMA_INVALID_COUNT');total[i]+=n;});
 });
 if(codes.size!==15||names.size!==15||foreign!==0)throw Error('P45_TOYAMA_CODE_NAME');
 if([...codes.values()].filter(function(s){return s.size>1;}).length!==10||[...names.values()].filter(function(s){return s.size>1;}).length!==12)throw Error('P45_TOYAMA_MULTIPLE_MAPPINGS');
 if(total.reduce(function(a,b){return a+b;},0)!==632)throw Error('P45_TOYAMA_TOTAL');
 GX_TOYAMA_LANDUSE.forEach(function(r,i){if(total[i]!==r[1])throw Error('P45_TOYAMA_LANDUSE');});
 var gun=Object.fromEntries(GX_TOYAMA_GUN),gPairs=new Set(),gTotals=[0,0,0,0],byGun={};
 GX_TOYAMA_GUN_NAME_PAIRS.forEach(function(r){
  if(r.length!==6||!r[1]||typeof r[0]!=='string')throw Error('P45_TOYAMA_GUN_ROW');
  var key=r[0]+'|'+r[1];if(gPairs.has(key))throw Error('P45_TOYAMA_GUN_DUPLICATE');gPairs.add(key);
  r.slice(2).forEach(function(n,i){if(!Number.isSafeInteger(n)||n<0)throw Error('P45_TOYAMA_GUN_COUNT');gTotals[i]+=n;byGun[r[0]]=(byGun[r[0]]||0)+n;});
 });
 if(gun['']!==495||gun['下新川郡']!==50||gun['中新川郡']!==87||Object.values(gun).reduce(function(a,b){return a+b;},0)!==632)throw Error('P45_TOYAMA_GUN_TOTAL');
 if(Object.keys(gun).some(function(g){return gun[g]!==byGun[g];}))throw Error('P45_TOYAMA_GUN_PARITY');
 if(gTotals.some(function(n,i){return n!==GX_TOYAMA_LANDUSE[i][1];}))throw Error('P45_TOYAMA_GUN_LANDUSE');
 if(GX_TOYAMA_EMPTY_GUN_KNOWN_TOWNS.length!==4)throw Error('P45_TOYAMA_MISSING_GUN_ROWS');
 var expected={'上市町':['中新川郡',15],'入善町':['下新川郡',5],'立山町':['中新川郡',1],'舟橋村':['中新川郡',4]},missing=0;
 GX_TOYAMA_EMPTY_GUN_KNOWN_TOWNS.forEach(function(d){
  var want=expected[d.municipality_name];
  if(!want||d.gun_names_seen_elsewhere.length!==1||d.gun_names_seen_elsewhere[0]!==want[0]||d.empty_gun_polygon_count!==want[1])throw Error('P45_TOYAMA_MISSING_GUN_META');
  var r=GX_TOYAMA_GUN_NAME_PAIRS.find(function(row){return row[0]===''&&row[1]===d.municipality_name;});
  if(!r||r.slice(2).reduce(function(a,b){return a+b;},0)!==want[1]||
    ['田','普通畑','牧草地','樹園地'].some(function(c,i){return r[i+2]!==d.empty_gun_landuse_counts[c];}))throw Error('P45_TOYAMA_MISSING_GUN_PARITY');
  missing+=want[1];
 });
 if(missing!==25)throw Error('P45_TOYAMA_GUN_EMPTY_TOTAL');
 return true;
}
function gxToyamaSoilPanel(prefCode){
 if(prefCode!=='16')return '';
 gxToyamaSoilValidate();
 var fmt=function(n){return Number(n).toLocaleString('ja-JP');};
 var cards=GX_TOYAMA_LANDUSE.map(function(r){return '<article class="gx-data-card"><span class="gx-kicker">地目区分 / Polygon features</span><strong>'+fmt(r[1])+' <small>件</small></strong><p>'+gxEsc(r[0])+'（面積haではありません）</p></article>';}).join('');
 var codes=new Map(),names=new Map();
 GX_TOYAMA_CODE_NAME_PAIRS.forEach(function(r){codes.set(r[0],(codes.get(r[0])||0)+1);names.set(r[1],(names.get(r[1])||0)+1);});
 var header='<thead><tr><th>市町村名（原本）</th><th>JCODE（原本）</th><th>田</th><th>普通畑</th><th>牧草地</th><th>樹園地</th><th>計</th><th>照合状態</th></tr></thead>';
 var codeRows=GX_TOYAMA_CODE_NAME_PAIRS.map(function(r){
  var state=(codes.get(r[0])>1||names.get(r[1])>1)?'コード・名称複数対応／要照合':'原本値';
  return '<tr><th scope="row">'+gxEsc(r[1])+'</th><td>'+gxEsc(r[0])+'</td>'+r.slice(2).map(function(n){return '<td>'+fmt(n)+'</td>';}).join('')+'<td>'+fmt(r.slice(2).reduce(function(a,b){return a+b;},0))+'</td><td>'+state+'</td></tr>';
 }).join('');
 var gunRows=GX_TOYAMA_GUN.filter(function(r){return r[0]!=='';}).map(function(r){return '<tr><th scope="row">'+gxEsc(r[0])+'</th><td>'+fmt(r[1])+'</td></tr>';}).join('');
 var known=new Set(GX_TOYAMA_EMPTY_GUN_KNOWN_TOWNS.map(function(r){return r.municipality_name;}));
 var gunDetail=GX_TOYAMA_GUN_NAME_PAIRS.map(function(r){
  var state=r[0]===''&&known.has(r[1])?'原本GUN空欄・要照合':'原本値';
  return '<tr><th scope="row">'+gxEsc(r[1])+'</th><td>'+gxEsc(r[0]||'（空欄）')+'</td>'+r.slice(2).map(function(n){return '<td>'+fmt(n)+'</td>';}).join('')+'<td>'+state+'</td></tr>';
 }).join('');
 var missing=GX_TOYAMA_EMPTY_GUN_KNOWN_TOWNS.map(function(r){return gxEsc(r.municipality_name)+' '+fmt(r.empty_gun_polygon_count)+'件';}).join('、');
 return '<section class="gx-dashboard" aria-labelledby="gx-toyama-soil-title">'+
  '<div class="gx-section-heading"><span class="gx-kicker">TOYAMA SOIL GIS · P45 · SOURCE AUDITED / MUNICIPALITY JOIN PENDING</span>'+
  '<h2 id="gx-toyama-soil-title">富山県の農耕地土壌GISを確認する。</h2>'+
  '<p>JGD2000の原本ポリゴン632件。田428件、普通畑116件、牧草地18件、樹園地70件。市町村名15種類、JCODE15種類、組合せ36通り。土壌群15種類・詳細分類59種類。原本XML作成日2017年1月17日。</p></div>'+
  '<p class="gx-anomaly"><b>県外JCODEは0件。ただし市町村別のJOINは要照合：</b>10コードが複数市町村名に、12名称が複数JCODEに対応しています。さらに、郡名が記録されたレコードもある上市町・入善町・立山町・舟橋村の4町村について、GUNが空欄の原本レコードが計25件あります（'+missing+'）。これらの原本値は無断補完せず、別データとのコード・郡名結合を保留します。</p>'+
  '<div class="gx-detail-grid">'+cards+'</div>'+
  '<details><summary>原本GUN（郡名）別の件数を見る</summary><div class="scroll"><table><thead><tr><th>郡名（原本）</th><th>ポリゴン件数</th></tr></thead><tbody>'+gunRows+'</tbody></table></div><p>原本GUN空欄は495件、郡名付き137件。これは記録された属性の分布であり、確認済みの郡別農地統計ではありません。</p></details>'+
  '<details><summary>原本のGUN×市町村名19組合せを見る</summary><div class="scroll"><table><thead><tr><th>市町村名</th><th>GUN（原本）</th><th>田</th><th>普通畑</th><th>牧草地</th><th>樹園地</th><th>照合</th></tr></thead><tbody>'+gunDetail+'</tbody></table></div></details>'+
  '<details><summary>原本のJCODE×市町村名36組合せを見る（要照合）</summary><div class="scroll"><table>'+header+'<tbody>'+codeRows+'</tbody></table></div></details>'+
  '<p class="gx-advisory"><b>来歴と科学的制約：</b>農研機構「日本土壌インベントリー」は原本候補ですが、公式富山県ZIPとのSHA一致は未確認。生Shapefile・DBF・ZIPは再配布条件を確かめるまで公開せず、元データのハッシュと派生集計だけ登録。ポリゴン件数は農地面積ha、筆数、土壌炭素量、CH₄実測値、CO₂e削減量、認証済みJ-クレジット量ではありません。現行自治体統計・水稲統計・土地被覆との自動JOINもしません。原本監査台帳：research/p45-toyama-soil-shapefile-source-v1.json。検証：docs/p45-toyama-soil-gis-ja.md。</p></section>';
}
