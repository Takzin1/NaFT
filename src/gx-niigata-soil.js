/* P43 Niigata. All JCODE prefixes are 15 but 86 code/name pairs are not one-to-one. Do not auto-join municipalities. */
'use strict';
var GX_NIIGATA_SOURCE_HASH="7e1e4877d7d7b9443b1bfc34fb71d1333fbfa4949a626837ee1fb83b6ff0246f";
var GX_NIIGATA_LANDUSE=[["田",682],["普通畑",524],["牧草地",86],["樹園地",211]];
var GX_NIIGATA_CODE_NAME_PAIRS=[["15101","北区",12,10,0,7],["15101","新発田市",7,1,0,0],["15101","聖籠町",3,1,0,3],["15101","阿賀野市",5,0,0,0],["15102","東区",3,3,0,1],["15102","江南区",2,2,0,0],["15103","中央区",3,3,0,0],["15104","南区",1,2,0,0],["15104","江南区",11,9,2,7],["15104","阿賀野市",3,2,0,0],["15105","五泉市",4,0,0,0],["15105","南区",2,0,0,0],["15105","田上町",3,2,0,0],["15105","秋葉区",13,8,1,8],["15105","阿賀野市",0,1,1,0],["15106","三条市",0,0,0,1],["15106","加茂市",6,0,0,2],["15106","南区",15,13,0,8],["15106","田上町",1,0,0,0],["15106","西区",3,1,0,0],["15106","西蒲区",8,0,0,2],["15107","西区",10,10,0,0],["15107","西蒲区",6,3,0,0],["15108","弥彦村",3,1,0,1],["15108","燕市",6,1,0,1],["15108","西蒲区",11,12,0,7],["15202","三条市",2,0,0,0],["15202","出雲崎町",3,0,0,0],["15202","刈羽村",2,0,0,0],["15202","十日町市",2,1,0,0],["15202","小千谷市",6,6,0,1],["15202","燕市",9,1,0,0],["15202","見附市",8,4,0,0],["15202","長岡市",31,34,10,17],["15202","魚沼市",2,3,0,0],["15204","三条市",22,18,3,11],["15204","加茂市",2,1,0,1],["15204","燕市",5,2,0,1],["15204","見附市",5,3,0,0],["15205","上越市",0,0,1,0],["15205","刈羽村",3,1,0,2],["15205","十日町市",1,0,0,1],["15205","柏崎市",13,12,3,5],["15206","新発田市",22,22,10,11],["15206","聖籠町",8,4,0,1],["15206","胎内市",7,1,0,0],["15206","阿賀野市",5,0,0,0],["15208","十日町市",4,0,0,0],["15208","小千谷市",15,17,1,2],["15209","五泉市",3,0,0,0],["15209","加茂市",12,7,1,4],["15209","田上町",2,1,0,0],["15210","上越市",1,0,0,0],["15210","十日町市",14,17,4,4],["15210","南魚沼市",2,0,0,0],["15210","津南町",2,3,0,0],["15211","見附市",13,11,3,6],["15212","村上市",25,24,3,14],["15212","胎内市",8,3,0,1],["15212","関川村",2,1,0,0],["15213","弥彦村",4,2,0,0],["15213","燕市",13,14,0,4],["15216","糸魚川市",20,12,1,5],["15217","上越市",13,5,1,0],["15217","妙高市",18,20,4,2],["15218","五泉市",16,15,2,9],["15218","阿賀野市",3,1,0,0],["15222","上越市",24,24,8,13],["15223","阿賀野市",18,12,1,4],["15224","佐渡市",22,19,6,11],["15225","南魚沼市",5,0,0,0],["15225","魚沼市",19,19,4,4],["15226","南魚沼市",21,18,2,5],["15226","湯沢町",0,0,1,0],["15227","胎内市",15,17,4,5],["15227","関川村",2,0,0,1],["15307","聖籠町",8,7,0,5],["15342","弥彦村",4,7,0,2],["15361","田上町",5,4,0,2],["15385","阿賀町",15,16,5,6],["15405","出雲崎町",5,3,0,2],["15461","湯沢町",3,3,0,0],["15482","津南町",8,8,2,0],["15504","刈羽村",5,2,0,0],["15581","関川村",14,13,2,1],["15586","粟島浦村",0,1,0,0]];
var GX_NIIGATA_GUN=[["",1345],["三島郡",10],["中魚沼郡",18],["刈羽郡",7],["北蒲原郡",20],["南蒲原郡",11],["南魚沼郡",6],["岩船郡",31],["東蒲原郡",42],["西蒲原郡",13]];
var GX_NIIGATA_GUN_NAME_PAIRS=[["","三条市",24,18,3,12],["","上越市",38,29,10,13],["","中央区",3,3,0,0],["","五泉市",23,15,2,9],["","佐渡市",22,19,6,11],["","出雲崎町",3,0,0,0],["","刈羽村",5,1,0,2],["","加茂市",20,8,1,7],["","北区",12,10,0,7],["","十日町市",21,18,4,5],["","南区",18,15,0,8],["","南魚沼市",28,18,2,5],["","妙高市",18,20,4,2],["","小千谷市",21,23,1,3],["","弥彦村",7,3,0,1],["","新発田市",29,23,10,11],["","村上市",25,24,3,14],["","東区",3,3,0,1],["","柏崎市",13,12,3,5],["","江南区",13,11,2,7],["","津南町",2,3,0,0],["","湯沢町",0,0,1,0],["","燕市",33,18,0,6],["","田上町",6,3,0,0],["","秋葉区",13,8,1,8],["","糸魚川市",20,12,1,5],["","聖籠町",11,5,0,4],["","胎内市",30,21,4,6],["","西区",13,11,0,0],["","西蒲区",25,15,0,9],["","見附市",26,18,3,6],["","長岡市",31,34,10,17],["","関川村",4,1,0,1],["","阿賀野市",34,16,2,4],["","魚沼市",21,22,4,4],["三島郡","出雲崎町",5,3,0,2],["中魚沼郡","津南町",8,8,2,0],["刈羽郡","刈羽村",5,2,0,0],["北蒲原郡","聖籠町",8,7,0,5],["南蒲原郡","田上町",5,4,0,2],["南魚沼郡","湯沢町",3,3,0,0],["岩船郡","粟島浦村",0,1,0,0],["岩船郡","関川村",14,13,2,1],["東蒲原郡","阿賀町",15,16,5,6],["西蒲原郡","弥彦村",4,7,0,2]];
function gxNiigataSoilValidate(){
 if(GX_NIIGATA_CODE_NAME_PAIRS.length!==86||GX_NIIGATA_GUN_NAME_PAIRS.length!==45||GX_NIIGATA_GUN.length!==10)throw Error('P43_NIIGATA_PAIR_LENGTH');
 var codes=new Map(),names=new Map(),seen=new Set(),totals=[0,0,0,0],foreign=0;
 GX_NIIGATA_CODE_NAME_PAIRS.forEach(function(r){
  if(r.length!==6||!/^15[0-9]{3}$/.test(r[0])||typeof r[1]!=='string'||!r[1])throw Error('P43_NIIGATA_CODE');
  var key=r[0]+'|'+r[1];if(seen.has(key))throw Error('P43_NIIGATA_DUPLICATE_PAIR');
  seen.add(key);
  if(!codes.has(r[0]))codes.set(r[0],new Set());codes.get(r[0]).add(r[1]);
  if(!names.has(r[1]))names.set(r[1],new Set());names.get(r[1]).add(r[0]);
  r.slice(2).forEach(function(n,i){if(!Number.isSafeInteger(n)||n<0)throw Error('P43_NIIGATA_BAD_COUNT');totals[i]+=n;});
  if(!r[0].startsWith('15'))foreign++;
 });
 if(foreign!==0||codes.size!==37||names.size!==37)throw Error('P43_NIIGATA_FOREIGN_OR_CODE_NAME');
 if([...codes.values()].filter(function(s){return s.size>1;}).length!==21||[...names.values()].filter(function(s){return s.size>1;}).length!==25)throw Error('P43_NIIGATA_MULTIPLE_MAPPINGS');
 if(totals.reduce(function(a,b){return a+b;},0)!==1503)throw Error('P43_NIIGATA_TOTAL');
 GX_NIIGATA_LANDUSE.forEach(function(r,i){if(totals[i]!==r[1])throw Error('P43_NIIGATA_LANDUSE_PARITY');});
 var g=Object.fromEntries(GX_NIIGATA_GUN),gsums={},gland=[0,0,0,0],gunPairs=new Set();
 GX_NIIGATA_GUN_NAME_PAIRS.forEach(function(r){
  if(r.length!==6||typeof r[0]!=='string'||!r[1])throw Error('P43_NIIGATA_GUN_PAIR');
  var key=r[0]+'|'+r[1];if(gunPairs.has(key))throw Error('P43_NIIGATA_DUP_GUN_PAIR');gunPairs.add(key);
  r.slice(2).forEach(function(n,i){if(!Number.isSafeInteger(n)||n<0)throw Error('P43_NIIGATA_BAD_GUN_COUNT');gsums[r[0]]=(gsums[r[0]]||0)+n;gland[i]+=n;});
 });
 if(Object.keys(g).length!==10||g['']!==1345||Object.values(g).reduce(function(a,b){return a+b;},0)!==1503)throw Error('P43_NIIGATA_GUN_TOTAL');
 if(GX_NIIGATA_GUN.some(function(r){return r[1]!==gsums[r[0]];}))throw Error('P43_NIIGATA_GUN_PARITY');
 if(gland.some(function(n,i){return n!==GX_NIIGATA_LANDUSE[i][1];}))throw Error('P43_NIIGATA_GUN_LANDUSE');
 return true;
}
function gxNiigataSoilPanel(prefCode){
 if(prefCode!=='15')return '';
 gxNiigataSoilValidate();
 var fmt=function(n){return Number(n).toLocaleString('ja-JP');};
 var cards=GX_NIIGATA_LANDUSE.map(function(r){return '<article class="gx-data-card"><span class="gx-kicker">地目区分 / Polygon features</span><strong>'+fmt(r[1])+' <small>件</small></strong><p>'+gxEsc(r[0])+'（面積haではありません）</p></article>';}).join('');
 var codes=new Map(),names=new Map();
 GX_NIIGATA_CODE_NAME_PAIRS.forEach(function(r){codes.set(r[0],(codes.get(r[0])||0)+1);names.set(r[1],(names.get(r[1])||0)+1);});
 var head='<thead><tr><th>市区町村名（原本）</th><th>JCODE（原本）</th><th>田</th><th>普通畑</th><th>牧草地</th><th>樹園地</th><th>合計</th><th>照合状態</th></tr></thead>';
 var body=GX_NIIGATA_CODE_NAME_PAIRS.map(function(r){
  var flag=codes.get(r[0])>1||names.get(r[1])>1?'複数対応・要照合':'原本値';
  return '<tr><th scope="row">'+gxEsc(r[1])+'</th><td>'+gxEsc(r[0])+'</td>'+r.slice(2).map(function(n){return '<td>'+fmt(n)+'</td>';}).join('')+'<td>'+fmt(r.slice(2).reduce(function(a,b){return a+b;},0))+'</td><td>'+flag+'</td></tr>';
 }).join('');
 var gun=GX_NIIGATA_GUN.filter(function(r){return r[0]!=='';}).map(function(r){return '<tr><th scope="row">'+gxEsc(r[0])+'</th><td>'+fmt(r[1])+'</td></tr>';}).join('');
 var gDetail=GX_NIIGATA_GUN_NAME_PAIRS.map(function(r){return '<tr><th scope="row">'+gxEsc(r[1])+'</th><td>'+gxEsc(r[0]||'（空欄）')+'</td>'+r.slice(2).map(function(n){return '<td>'+fmt(n)+'</td>';}).join('')+'</tr>';}).join('');
 return '<section class="gx-dashboard" aria-labelledby="gx-niigata-soil-title">'+
  '<div class="gx-section-heading"><span class="gx-kicker">NIIGATA SOIL GIS · P43 · SOURCE AUDITED / MUNICIPALITY LINKS PENDING</span>'+
  '<h2 id="gx-niigata-soil-title">新潟県の農耕地土壌GISを確認する。</h2>'+
  '<p>原本JGD2000の土壌ポリゴン1,503件。地目は田682件、普通畑524件、牧草地86件、樹園地211件。市区町村名37種類（新潟市の区名を含む）、JCODE37種類、組合せ86通り。土壌群19種類・詳細分類78種類。原本XMLのメタデータ作成日は2017年1月17日。</p></div>'+
  '<p class="gx-anomaly"><b>県外JCODEは0件。ただし市区町村単位の結合は保留：</b>コード接頭は全件新潟県「15」ですが、21コードが複数名称に、25名称が複数JCODEに対応しています。例えば15202は長岡市だけでなく周辺の複数市町村名に対応します。県コードの正しさを自治体コードの正しさと混同せず、原本86組合せを保持したまま要照合とし、現行自治体統計への自動JOINを行いません。</p>'+
  '<div class="gx-detail-grid">'+cards+'</div>'+
  '<details><summary>原本GUN（郡名）別の記録件数を見る</summary><div class="scroll"><table><thead><tr><th>原本の郡名</th><th>ポリゴン件数</th></tr></thead><tbody>'+gun+'</tbody></table></div><p>GUN空欄は1,345件。郡名付きは158件。ここに示すのは原本属性の集計であり、現行の正式な郡別農地面積ではありません。</p></details>'+
  '<details><summary>原本のGUN×市区町村名45組合せを見る</summary><div class="scroll"><table><thead><tr><th>市区町村名</th><th>GUN（原本）</th><th>田</th><th>普通畑</th><th>牧草地</th><th>樹園地</th></tr></thead><tbody>'+gDetail+'</tbody></table></div></details>'+
  '<details><summary>原本のJCODE×市区町村名86組合せを見る（要照合）</summary><div class="scroll"><table>'+head+'<tbody>'+body+'</tbody></table></div></details>'+
  '<p class="gx-advisory"><b>来歴と研究上の制約：</b>農研機構「日本土壌インベントリー」は出典候補ですが、公式新潟県ZIPとのSHA-256完全一致は未確認。再配布権利の確定前につき原Shapefile・DBF・ZIPは公開GitHubに複製せず、原本ハッシュと派生件数のみ登録。ポリゴン数は農地面積ha、筆数、CH₄実測値、土壌炭素量、CO₂e認証量ではありません。2024年水稲統計やJAXAデータとの無検証の行政コードJOINはしていません。原本監査台帳：research/p43-niigata-soil-shapefile-source-v1.json。検証方法：docs/p43-niigata-soil-gis-ja.md。</p></section>';
}
