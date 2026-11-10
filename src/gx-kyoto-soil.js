/* NaFT P54 Kyoto soil GIS: preserve source JCODE and GUN; no automatic corrections. */
'use strict';
var GX_KYOTO_HASH="f5440640ef355f37e6bd4ee67f2039521407f252398fdfdabcb3b5fbf221bf9a";
var GX_KYOTO_LANDUSE=[["田",452],["普通畑",279],["牧草地",11],["樹園地",227]];
var GX_KYOTO_CODE_PAIRS=[["18481","舞鶴市",1,0,0,0],["24216","南山城村",2,0,0,0],["25201","宇治田原町",0,0,0,1],["25201","山科区",1,0,0,1],["25209","和束町",1,0,0,2],["25209","宇治田原町",0,0,0,1],["26101","北区",6,6,0,1],["26101","左京区",3,0,0,0],["26103","左京区",13,5,0,0],["26106","下京区",2,0,0,0],["26106","南区",1,0,0,0],["26106","右京区",1,0,0,0],["26107","伏見区",2,1,0,0],["26107","南区",7,3,0,0],["26107","向日市",1,0,0,0],["26107","西京区",0,1,0,0],["26108","亀岡市",1,0,0,0],["26108","南丹市",1,0,0,0],["26108","右京区",14,12,0,4],["26109","久御山町",2,1,0,0],["26109","伏見区",17,10,0,2],["26109","八幡市",2,3,0,0],["26109","宇治市",3,0,0,1],["26109","山科区",2,1,0,1],["26109","長岡京市",2,0,0,0],["26110","山科区",3,4,0,1],["26111","向日市",1,0,0,1],["26111","西京区",10,4,0,8],["26111","長岡京市",2,2,0,3],["26201","宮津市",1,0,0,0],["26201","福知山市",26,19,2,17],["26201","綾部市",5,1,0,0],["26202","宮津市",1,0,0,0],["26202","舞鶴市",14,19,1,11],["26203","京丹波町",1,0,0,0],["26203","綾部市",19,23,0,20],["26204","久御山町",3,0,0,0],["26204","城陽市",1,0,0,0],["26204","宇治市",10,3,0,6],["26205","伊根町",3,0,0,0],["26205","宮津市",19,19,0,3],["26206","亀岡市",20,7,1,10],["26206","南丹市",3,1,0,0],["26207","久御山町",1,0,0,1],["26207","井手町",0,0,0,1],["26207","城陽市",5,4,0,6],["26208","向日市",4,1,0,0],["26208","長岡京市",1,0,0,0],["26209","大山崎町",0,1,0,1],["26209","長岡京市",6,4,0,3],["26210","久御山町",0,1,0,1],["26210","京田辺市",4,3,0,3],["26210","八幡市",10,8,0,6],["26211","京田辺市",13,10,0,9],["26211","精華町",3,0,0,1],["26212","京丹後市",20,24,4,11],["26212","伊根町",0,0,1,0],["26213","南丹市",29,17,1,8],["26214","井手町",1,0,0,2],["26214","和束町",3,0,0,4],["26214","木津川市",14,7,0,12],["26214","精華町",2,2,0,0],["26303","大山崎町",2,0,0,3],["26322","久御山町",8,4,0,0],["26343","井手町",10,1,0,7],["26344","和束町",0,0,0,1],["26344","宇治田原町",8,4,0,10],["26364","南山城村",0,0,0,1],["26364","笠置町",3,3,0,3],["26365","和束町",13,1,0,13],["26366","精華町",11,4,0,0],["26367","南山城村",4,1,0,7],["26407","京丹波町",24,18,1,15],["26463","伊根町",12,7,0,2],["26465","与謝野町",14,9,0,2]];
var GX_KYOTO_GUN_COUNTS=[["",742],["与謝郡",46],["久世郡",12],["乙訓郡",5],["大飯郡",1],["相楽郡",64],["綴喜郡",41],["船井郡",58]];
var GX_KYOTO_GUN_PAIRS=[["","下京区",2,0,0,0],["","久御山町",6,2,0,2],["","亀岡市",21,7,1,10],["","井手町",1,0,0,3],["","京丹後市",20,24,4,11],["","京丹波町",1,0,0,0],["","京田辺市",17,13,0,12],["","伊根町",3,0,1,0],["","伏見区",19,11,0,2],["","八幡市",12,11,0,6],["","北区",6,6,0,1],["","南丹市",33,18,1,8],["","南区",8,3,0,0],["","南山城村",2,0,0,0],["","右京区",15,12,0,4],["","向日市",6,1,0,1],["","和束町",4,0,0,6],["","城陽市",6,4,0,6],["","大山崎町",0,1,0,1],["","宇治市",13,3,0,7],["","宇治田原町",0,0,0,2],["","宮津市",21,19,0,3],["","山科区",6,5,0,3],["","左京区",16,5,0,0],["","木津川市",14,7,0,12],["","福知山市",26,19,2,17],["","精華町",5,2,0,1],["","綾部市",24,24,0,20],["","舞鶴市",14,19,1,11],["","西京区",10,5,0,8],["","長岡京市",11,6,0,6],["与謝郡","与謝野町",14,9,0,2],["与謝郡","伊根町",12,7,0,2],["久世郡","久御山町",8,4,0,0],["乙訓郡","大山崎町",2,0,0,3],["大飯郡","舞鶴市",1,0,0,0],["相楽郡","南山城村",4,1,0,8],["相楽郡","和束町",13,1,0,13],["相楽郡","笠置町",3,3,0,3],["相楽郡","精華町",11,4,0,0],["綴喜郡","井手町",10,1,0,7],["綴喜郡","和束町",0,0,0,1],["綴喜郡","宇治田原町",8,4,0,10],["船井郡","京丹波町",24,18,1,15]];
function gxKyotoSoilValidate(){
 var j=GX_KYOTO_CODE_PAIRS,g=GX_KYOTO_GUN_PAIRS,total=[0,0,0,0],gtotal=[0,0,0,0],codes=new Map(),names=new Map(),foreign={'18':0,'24':0,'25':0},seen=new Set();
 if(GX_KYOTO_HASH!=='f5440640ef355f37e6bd4ee67f2039521407f252398fdfdabcb3b5fbf221bf9a'||j.length!==75||g.length!==44)throw Error('P54_KYOTO_REGISTRY');
 j.forEach(function(r){
  if(r.length!==6||!/^(18|24|25|26)[0-9]{3}$/.test(r[0])||!r[1])throw Error('P54_KYOTO_JCODE');
  var k=r[0]+'|'+r[1];if(seen.has(k))throw Error('P54_KYOTO_DUP');seen.add(k);
  if(!codes.has(r[0]))codes.set(r[0],new Set());codes.get(r[0]).add(r[1]);
  if(!names.has(r[1]))names.set(r[1],new Set());names.get(r[1]).add(r[0]);
  r.slice(2).forEach(function(n,i){if(!Number.isSafeInteger(n)||n<0)throw Error('P54_KYOTO_COUNT');total[i]+=n;if(!r[0].startsWith('26'))foreign[r[0].slice(0,2)]+=n;});
 });
 if(codes.size!==37||names.size!==33||[...codes.values()].filter(function(v){return v.size>1;}).length!==23||[...names.values()].filter(function(v){return v.size>1;}).length!==26)throw Error('P54_KYOTO_MAPPING');
 if(foreign['18']!==1||foreign['24']!==2||foreign['25']!==7||total.some(function(n,i){return n!==[452,279,11,227][i];}))throw Error('P54_KYOTO_FOREIGN_OR_TOTAL');
 var gset=new Set(),gc={},nonempty=new Set(),missing=0,maizuru=false,wazuka=false;
 g.forEach(function(r){if(r[0])nonempty.add(r[1]);});
 g.forEach(function(r){
  if(r.length!==6||!r[1])throw Error('P54_KYOTO_GUN_ROW');
  var key=r[0]+'|'+r[1];if(gset.has(key))throw Error('P54_KYOTO_GUN_DUP');gset.add(key);
  var rowtotal=0;r.slice(2).forEach(function(n,i){if(!Number.isSafeInteger(n)||n<0)throw Error('P54_KYOTO_GUN_COUNT');gtotal[i]+=n;rowtotal+=n;});
  gc[r[0]]=(gc[r[0]]||0)+rowtotal;
  if(!r[0]&&nonempty.has(r[1]))missing+=rowtotal;
  if(r[0]==='大飯郡'&&r[1]==='舞鶴市'&&JSON.stringify(r.slice(2))==='[1,0,0,0]')maizuru=true;
  if(r[0]==='綴喜郡'&&r[1]==='和束町'&&JSON.stringify(r.slice(2))==='[0,0,0,1]')wazuka=true;
 });
 if(GX_KYOTO_LANDUSE.some(function(r,i){return r[1]!==total[i];})||gtotal.some(function(n,i){return n!==total[i];})||GX_KYOTO_GUN_COUNTS.some(function(r){return gc[r[0]]!==r[1];})||missing!==88||!maizuru||!wazuka||gc['']!==742)throw Error('P54_KYOTO_GUN_PARITY');
 return true;
}
function gxKyotoSoilPanel(prefCode){
 if(prefCode!=='26')return '';
 gxKyotoSoilValidate();
 var fmt=function(n){return Number(n).toLocaleString('ja-JP');};
 var cards=GX_KYOTO_LANDUSE.map(function(r){return '<article class="gx-data-card"><span class="gx-kicker">地目 / Polygon features</span><strong>'+fmt(r[1])+' <small>件</small></strong><p>'+gxEsc(r[0])+'（面積haではありません）</p></article>';}).join('');
 var cn=new Map(),nc=new Map();GX_KYOTO_CODE_PAIRS.forEach(function(r){cn.set(r[0],(cn.get(r[0])||0)+1);nc.set(r[1],(nc.get(r[1])||0)+1);});
 var codeRows=GX_KYOTO_CODE_PAIRS.map(function(r){var f=[];if(!r[0].startsWith('26'))f.push('県外JCODE '+r[0].slice(0,2));if(cn.get(r[0])>1||nc.get(r[1])>1)f.push('コード・名称複数対応');return '<tr><th>'+gxEsc(r[1])+'</th><td>'+gxEsc(r[0])+'</td>'+r.slice(2).map(function(n){return '<td>'+fmt(n)+'</td>';}).join('')+'<td>'+fmt(r.slice(2).reduce(function(a,b){return a+b;},0))+'</td><td>'+(f.length?gxEsc(f.join('／'))+'・要照合':'原本値')+'</td></tr>';}).join('');
 var known=new Set(GX_KYOTO_GUN_PAIRS.filter(function(r){return !!r[0];}).map(function(r){return r[1];}));
 var countyRows=GX_KYOTO_GUN_PAIRS.map(function(r){var f=[];if(!r[0]&&known.has(r[1]))f.push('同名に郡名あり／空欄');if(r[0]==='大飯郡'&&r[1]==='舞鶴市')f.push('福井県系・県外郡名');if(r[0]==='綴喜郡'&&r[1]==='和束町')f.push('郡名混在');return '<tr><th>'+gxEsc(r[1])+'</th><td>'+gxEsc(r[0]||'（空欄）')+'</td>'+r.slice(2).map(function(n){return '<td>'+fmt(n)+'</td>';}).join('')+'<td>'+(f.length?gxEsc(f.join('／'))+'・要照合':'原本値')+'</td></tr>';}).join('');
 var gunRows=GX_KYOTO_GUN_COUNTS.map(function(r){return '<tr><th>'+gxEsc(r[0]||'（空欄）')+'</th><td>'+fmt(r[1])+'</td></tr>';}).join('');
 var landHead='<thead><tr><th>名称（原本）</th><th>コード・郡名（原本）</th><th>田</th><th>普通畑</th><th>牧草地</th><th>樹園地</th><th>照合</th></tr></thead>';
 return '<section class="gx-dashboard" aria-labelledby="gx-kyoto-soil-title">'+
 '<div class="gx-section-heading"><span class="gx-kicker">KYOTO SOIL GIS · P54 · PROVENANCE AUDITED</span><h2 id="gx-kyoto-soil-title">京都府の農耕地土壌GISを確認する。</h2>'+
 '<p>原本JGD2000の土壌ポリゴン969件。田452件、普通畑279件、牧草地11件、樹園地227件。市区町村名33種類、JCODE37種類・75組合せ。土壌群18種類・詳細分類64種類（空欄含む）。原本メタデータ作成日2017年1月17日。</p></div>'+
 '<p class="gx-anomaly"><b>県外コードと原本分類欠損は要照合：</b>京都府26系以外のJCODE10件（滋賀県25系7、三重県24系2、福井県18系1）。「舞鶴市／大飯郡」1件は福井県の郡名。「和束町／綴喜郡」1件は「相楽郡」と混在。郡名空欄の要照合88件。京丹波町の田1件（JCODE26407）は土壌分類4項目すべて空欄。原本属性を勝手に補完せず、外部自治体統計への自動JOINを保留します。</p>'+
 '<div class="gx-detail-grid">'+cards+'</div>'+
 '<details><summary>原本GUN（郡名）別の件数を見る</summary><div class="scroll"><table><thead><tr><th>郡名</th><th>ポリゴン件数</th></tr></thead><tbody>'+gunRows+'</tbody></table></div><p>郡名空欄742件、記載227件。現行行政区域に照合した面積統計ではありません。</p></details>'+
 '<details><summary>原本GUN×名称44組合せを見る（要照合）</summary><div class="scroll"><table>'+landHead+'<tbody>'+countyRows+'</tbody></table></div></details>'+
 '<details><summary>原本JCODE×名称75組合せを見る（要照合）</summary><div class="scroll"><table>'+landHead+'<tbody>'+codeRows+'</tbody></table></div></details>'+
 '<p class="gx-advisory"><b>来歴・科学的境界：</b>農研機構「日本土壌インベントリー」は元データ候補ですが公式ZIPとのSHA一致・再配布権利の確定は未確認です。生Shapefile・DBF・ZIPをGitHubに公開せず、原本ハッシュと派生件数のみ保全。ポリゴン数は農地面積ha、筆数、CH₄実測値、土壌炭素量、CO₂e削減量、認証クレジット量を表しません。水稲統計・JAXA土地被覆との自動行政コードJOINは禁止。原本台帳：research/p54-kyoto-soil-shapefile-source-v1.json。検証方法：docs/p54-kyoto-soil-gis-ja.md。</p></section>';
}
