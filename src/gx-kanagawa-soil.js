/* P42: Kanagawa soil GIS. Preserve source JCODE/name and GUN/name ambiguity; block unverified joins. */
'use strict';
var GX_KANAGAWA_SOURCE_HASH="997a9ceac06fd70c2223cfb086f4aebc9ad38a74070fa43fe7bf80797ad84282";
var GX_KANAGAWA_LANDUSE=[["田",262],["普通畑",499],["牧草地",7],["樹園地",292]];
var GX_KANAGAWA_CODE_NAME_PAIRS=[["13209","中央区",0,1,0,1],["13209","南区",0,1,0,0],["13209","緑区",0,1,0,1],["13209","青葉区",1,1,0,0],["13209","麻生区",1,3,0,3],["13225","麻生区",0,3,0,1],["14101","港北区",0,1,0,1],["14101","鶴見区",0,3,0,4],["14102","保土ヶ谷区",0,1,0,0],["14102","港北区",1,1,0,1],["14102","神奈川区",2,1,0,1],["14106","保土ヶ谷区",0,5,0,1],["14106","旭区",0,2,0,0],["14106","緑区",0,2,0,0],["14107","港南区",0,2,0,0],["14107","磯子区",0,4,0,2],["14108","金沢区",0,1,0,0],["14109","港北区",0,7,0,4],["14109","緑区",0,1,0,0],["14109","都筑区",0,3,0,1],["14109","高津区",0,1,0,0],["14110","戸塚区",6,13,0,6],["14110","栄区",1,1,0,0],["14110","泉区",0,1,0,0],["14110","港南区",0,1,0,0],["14110","藤沢市",1,4,0,0],["14110","鎌倉市",0,3,0,0],["14111","栄区",0,3,0,0],["14111","港南区",1,6,0,0],["14112","旭区",1,3,0,3],["14112","瀬谷区",0,1,0,0],["14112","緑区",0,2,0,0],["14113","緑区",4,9,0,7],["14113","都筑区",0,2,0,3],["14113","青葉区",2,0,0,1],["14114","大和市",0,1,0,0],["14114","泉区",0,1,0,0],["14114","瀬谷区",1,5,0,0],["14115","栄区",3,8,0,1],["14116","大和市",0,1,0,0],["14116","泉区",4,7,0,6],["14116","藤沢市",3,3,0,4],["14117","宮前区",0,3,0,1],["14117","都筑区",0,3,0,0],["14117","青葉区",4,14,0,11],["14117","麻生区",0,6,0,2],["14118","宮前区",0,1,0,1],["14118","都筑区",4,9,0,6],["14133","中原区",0,2,0,1],["14134","宮前区",0,1,0,0],["14134","高津区",0,5,0,4],["14135","多摩区",1,7,0,8],["14135","麻生区",0,1,0,0],["14136","宮前区",0,5,0,3],["14137","麻生区",3,7,0,7],["14151","中央区",0,1,0,0],["14151","緑区",7,7,1,7],["14152","中央区",2,3,0,4],["14152","南区",1,2,0,0],["14153","南区",4,5,0,2],["14153","座間市",2,1,0,0],["14201","三浦市",0,2,0,0],["14201","横須賀市",6,15,0,4],["14201","葉山町",1,0,0,0],["14203","中井町",0,2,0,0],["14203","伊勢原市",7,6,0,2],["14203","厚木市",1,3,0,0],["14203","大磯町",0,2,0,1],["14203","平塚市",16,22,2,11],["14203","秦野市",2,3,0,1],["14203","茅ケ崎市",0,2,0,0],["14204","藤沢市",0,2,0,0],["14204","鎌倉市",2,7,0,1],["14205","大和市",2,1,0,0],["14205","寒川町",2,2,0,0],["14205","海老名市",0,1,0,1],["14205","綾瀬市",3,4,0,0],["14205","茅ケ崎市",2,4,0,0],["14205","藤沢市",9,13,2,11],["14206","中井町",0,1,0,3],["14206","二宮町",0,1,0,1],["14206","南足柄市",3,0,0,1],["14206","大井町",2,2,0,2],["14206","小田原市",13,18,0,21],["14206","箱根町",1,0,0,0],["14206","開成町",2,0,0,0],["14207","寒川町",2,3,0,0],["14207","茅ケ崎市",9,14,0,3],["14208","逗子市",0,1,0,0],["14210","三浦市",3,12,0,2],["14211","中井町",0,2,0,2],["14211","伊勢原市",0,2,0,1],["14211","松田町",0,1,0,0],["14211","秦野市",11,9,0,6],["14212","伊勢原市",2,1,0,2],["14212","厚木市",15,15,0,10],["14212","愛川町",2,1,0,0],["14213","大和市",3,2,0,1],["14213","綾瀬市",0,1,0,0],["14214","伊勢原市",13,16,0,8],["14215","寒川町",1,0,0,0],["14215","座間市",3,4,0,1],["14215","海老名市",10,10,0,7],["14215","綾瀬市",0,2,0,0],["14216","座間市",5,4,0,1],["14217","南足柄市",7,7,0,8],["14217","開成町",3,1,0,0],["14218","綾瀬市",2,5,0,5],["14301","葉山町",1,2,0,1],["14321","寒川町",8,8,0,6],["14341","二宮町",0,2,0,4],["14341","大磯町",4,12,0,8],["14342","中井町",1,0,0,1],["14342","二宮町",1,8,0,5],["14361","中井町",2,5,0,4],["14361","大井町",0,1,0,0],["14362","大井町",5,5,0,8],["14362","松田町",1,0,0,1],["14363","山北町",0,1,0,0],["14363","松田町",2,5,0,4],["14364","山北町",2,5,1,7],["14366","開成町",3,3,0,2],["14382","箱根町",1,0,1,1],["14383","湯河原町",0,0,0,2],["14383","真鶴町",0,1,0,4],["14384","湯河原町",0,3,0,5],["14401","愛川町",4,4,0,2],["14402","清川村",2,5,0,1]];
var GX_KANAGAWA_GUN=[["",885],["三浦郡",4],["中郡",46],["愛甲郡",18],["足柄上郡",67],["足柄下郡",18],["高座郡",22]];
var GX_KANAGAWA_GUN_NAME_PAIRS=[["","三浦市",3,14,0,2],["","中井町",0,5,0,5],["","中原区",0,2,0,1],["","中央区",2,5,0,5],["","二宮町",0,1,0,1],["","伊勢原市",22,25,0,13],["","保土ヶ谷区",0,6,0,1],["","南区",5,8,0,2],["","南足柄市",10,7,0,9],["","厚木市",16,18,0,10],["","多摩区",1,7,0,8],["","大井町",2,2,0,2],["","大和市",5,5,0,1],["","大磯町",0,2,0,1],["","宮前区",0,10,0,5],["","寒川町",5,5,0,0],["","小田原市",13,18,0,21],["","平塚市",16,22,2,11],["","座間市",10,9,0,2],["","愛川町",2,1,0,0],["","戸塚区",6,13,0,6],["","旭区",1,5,0,3],["","松田町",0,1,0,0],["","栄区",4,12,0,1],["","横須賀市",6,15,0,4],["","泉区",4,9,0,6],["","海老名市",10,11,0,8],["","港北区",1,9,0,6],["","港南区",1,9,0,0],["","瀬谷区",1,6,0,0],["","磯子区",0,4,0,2],["","神奈川区",2,1,0,1],["","秦野市",13,12,0,7],["","箱根町",1,0,0,0],["","綾瀬市",5,12,0,5],["","緑区",11,22,1,15],["","茅ケ崎市",11,20,0,3],["","葉山町",1,0,0,0],["","藤沢市",13,22,2,15],["","逗子市",0,1,0,0],["","都筑区",4,17,0,10],["","金沢区",0,1,0,0],["","鎌倉市",2,10,0,1],["","開成町",5,1,0,0],["","青葉区",7,15,0,12],["","高津区",0,6,0,4],["","鶴見区",0,3,0,4],["","麻生区",4,20,0,13],["三浦郡","葉山町",1,2,0,1],["中郡","中井町",1,0,0,1],["中郡","二宮町",1,10,0,9],["中郡","大磯町",4,12,0,8],["愛甲郡","愛川町",4,4,0,2],["愛甲郡","清川村",2,5,0,1],["足柄上郡","中井町",2,5,0,4],["足柄上郡","大井町",5,6,0,8],["足柄上郡","山北町",2,6,1,7],["足柄上郡","松田町",3,5,0,5],["足柄上郡","開成町",3,3,0,2],["足柄下郡","湯河原町",0,3,0,7],["足柄下郡","真鶴町",0,1,0,4],["足柄下郡","箱根町",1,0,1,1],["高座郡","寒川町",8,8,0,6]];
function gxKanagawaSoilValidate(){
 if(GX_KANAGAWA_CODE_NAME_PAIRS.length!==128||GX_KANAGAWA_GUN_NAME_PAIRS.length!==63||GX_KANAGAWA_LANDUSE.length!==4)throw Error('P42_KANAGAWA_PAIR_LENGTH');
 var codes=new Map(),names=new Map(),seen=new Set(),totals=[0,0,0,0],foreign=0,foreignPairs=0;
 GX_KANAGAWA_CODE_NAME_PAIRS.forEach(function(r){
  if(r.length!==6||!/^(13|14)[0-9]{3}$/.test(r[0])||!r[1])throw Error('P42_KANAGAWA_CODE');
  var key=r[0]+'|'+r[1];if(seen.has(key))throw Error('P42_KANAGAWA_DUPLICATE');
  seen.add(key);
  if(!codes.has(r[0]))codes.set(r[0],new Set());codes.get(r[0]).add(r[1]);
  if(!names.has(r[1]))names.set(r[1],new Set());names.get(r[1]).add(r[0]);
  var n=r.slice(2).reduce(function(acc,v,i){if(!Number.isSafeInteger(v)||v<0)throw Error('P42_KANAGAWA_INVALID_COUNT');totals[i]+=v;return acc+v;},0);
  if(r[0].startsWith('13')){foreign+=n;foreignPairs++;}
 });
 if(codes.size!==55||names.size!==52||foreign!==18||foreignPairs!==6)throw Error('P42_KANAGAWA_CODE_NAME_ANOMALY');
 if([...codes.values()].filter(function(s){return s.size>1;}).length!==36||[...names.values()].filter(function(s){return s.size>1;}).length!==39)throw Error('P42_KANAGAWA_MULTIPLE_MAPPINGS');
 if(totals.reduce(function(a,b){return a+b;},0)!==1060)throw Error('P42_KANAGAWA_TOTAL');
 GX_KANAGAWA_LANDUSE.forEach(function(r,i){if(totals[i]!==r[1])throw Error('P42_KANAGAWA_LANDUSE');});
 var gun=Object.fromEntries(GX_KANAGAWA_GUN),gunSeen=new Set(),gTotals=[0,0,0,0],gCounts={};
 GX_KANAGAWA_GUN_NAME_PAIRS.forEach(function(r){
  if(r.length!==6||typeof r[0]!=='string'||!r[1])throw Error('P42_KANAGAWA_GUN_PAIR');
  var key=r[0]+'|'+r[1];if(gunSeen.has(key))throw Error('P42_KANAGAWA_DUP_GUN_PAIR');gunSeen.add(key);
  r.slice(2).forEach(function(n,i){if(!Number.isSafeInteger(n)||n<0)throw Error('P42_KANAGAWA_BAD_GUN_COUNT');gTotals[i]+=n;gCounts[r[0]]=(gCounts[r[0]]||0)+n;});
 });
 if(GX_KANAGAWA_GUN_NAME_PAIRS.length!==63||Object.keys(gun).length!==7||gun['']!==885||gun['中郡']!==46||Object.values(gun).reduce(function(a,b){return a+b;},0)!==1060)throw Error('P42_KANAGAWA_GUN_TOTAL');
 if(GX_KANAGAWA_GUN.some(function(r){return r[1]!==gCounts[r[0]];}))throw Error('P42_KANAGAWA_GUN_PARITY');
 if(gTotals.some(function(n,i){return n!==GX_KANAGAWA_LANDUSE[i][1];}))throw Error('P42_KANAGAWA_GUN_LANDUSE');
 var suspicious=GX_KANAGAWA_GUN_NAME_PAIRS.find(function(r){return r[0]==='中郡'&&r[1]==='中井町';});
 if(!suspicious||JSON.stringify(suspicious.slice(2))!==JSON.stringify([1,0,0,1]))throw Error('P42_KANAGAWA_NAKAI_GUN');
 return true;
}
function gxKanagawaSoilPanel(prefCode){
 if(prefCode!=='14')return '';
 gxKanagawaSoilValidate();
 var fmt=function(n){return Number(n).toLocaleString('ja-JP');};
 var cards=GX_KANAGAWA_LANDUSE.map(function(r){return '<article class="gx-data-card"><span class="gx-kicker">地目区分 / Polygon features</span><strong>'+fmt(r[1])+' <small>件</small></strong><p>'+gxEsc(r[0])+'（面積haではありません）</p></article>';}).join('');
 var cn=new Map(),nc=new Map();
 GX_KANAGAWA_CODE_NAME_PAIRS.forEach(function(r){cn.set(r[0],(cn.get(r[0])||0)+1);nc.set(r[1],(nc.get(r[1])||0)+1);});
 var head='<thead><tr><th scope="col">市区町村名（原本）</th><th scope="col">JCODE（原本）</th><th scope="col">田</th><th scope="col">普通畑</th><th scope="col">牧草地</th><th scope="col">樹園地</th><th scope="col">計</th><th scope="col">照合</th></tr></thead>';
 var body=GX_KANAGAWA_CODE_NAME_PAIRS.map(function(r){
  var issues=[];
  if(!r[0].startsWith('14'))issues.push('東京都コード13');
  if(cn.get(r[0])>1||nc.get(r[1])>1)issues.push('コード・名称複数対応');
  return '<tr><th scope="row">'+gxEsc(r[1])+'</th><td>'+gxEsc(r[0])+'</td>'+r.slice(2).map(function(n){return '<td>'+fmt(n)+'</td>';}).join('')+'<td>'+fmt(r.slice(2).reduce(function(a,b){return a+b;},0))+'</td><td>'+(issues.length?gxEsc(issues.join('／'))+'・要照合':'原本値')+'</td></tr>';
 }).join('');
 var gun=GX_KANAGAWA_GUN.filter(function(r){return r[0]!=='';}).map(function(r){return '<tr><th scope="row">'+gxEsc(r[0])+'</th><td>'+fmt(r[1])+'</td><td>'+(r[0]==='中郡'?'中井町2件・要照合':'原本値')+'</td></tr>';}).join('');
 var gunHead='<thead><tr><th scope="col">GUN郡名（原本）</th><th scope="col">件数</th><th scope="col">照合状態</th></tr></thead>';
 var gunDetail=GX_KANAGAWA_GUN_NAME_PAIRS.map(function(r){return '<tr><th scope="row">'+gxEsc(r[1])+'</th><td>'+gxEsc(r[0]||'（空欄）')+'</td>'+r.slice(2).map(function(n){return '<td>'+fmt(n)+'</td>';}).join('')+'<td>'+(r[0]==='中郡'&&r[1]==='中井町'?'郡名に疑義・要照合':'原本値')+'</td></tr>';}).join('');
 return '<section class="gx-dashboard" aria-labelledby="gx-kanagawa-soil-title">'+
  '<div class="gx-section-heading"><span class="gx-kicker">KANAGAWA SOIL GIS · P42 · SOURCE AUDITED / CODE & GUN PENDING</span>'+
  '<h2 id="gx-kanagawa-soil-title">神奈川県の農耕地土壌GISを確認する。</h2>'+
  '<p>JGD2000の原本ポリゴン1,060件。市区町村名52種類（横浜市・川崎市・相模原市の区名を含む）、JCODE55種類、組合せ128通り。土壌群17種類・詳細分類63種類。原本XML作成日2017年1月17日。</p></div>'+
  '<p class="gx-anomaly"><b>行政コードと郡名の不整合は未解消：</b>東京都「13」系のJCODEが6組合せ・18ポリゴン含まれます。36コードが複数の市区町村名に、39名称が複数コードに対応。さらにGUN「中郡／中井町」が2ポリゴン（田1・樹園地1）あり、現行の郡名との対応に疑義があります。原本を自動訂正せず、行政コード・郡名による外部統計JOINを保留します。</p>'+
  '<div class="gx-detail-grid">'+cards+'</div>'+
  '<details><summary>原本GUN（郡名）別件数を見る</summary><div class="scroll"><table>'+gunHead+'<tbody>'+gun+'</tbody></table></div><p>GUN空欄は885件。郡名付きは175件。中井町と「中郡」の2件は要照合であり、ここに示すのは原本の属性をそのまま集計した研究用データです。</p></details>'+
  '<details><summary>原本のGUN×市区町村名63組合せを見る</summary><div class="scroll"><table><thead><tr><th>市区町村名</th><th>GUN（原本）</th><th>田</th><th>普通畑</th><th>牧草地</th><th>樹園地</th><th>照合</th></tr></thead><tbody>'+gunDetail+'</tbody></table></div></details>'+
  '<details><summary>原本のJCODE×市区町村名128組合せを見る（要照合）</summary><div class="scroll"><table>'+head+'<tbody>'+body+'</tbody></table></div></details>'+
  '<p class="gx-advisory"><b>出典候補と科学的境界：</b>農研機構「日本土壌インベントリー」を元資料の候補として記録していますが、公式神奈川県ZIPとのSHA一致と適用ライセンスは未照合。生Shapefile・DBF・ZIPは公開GitHubへ複製せず、ハッシュと派生集計のみ登録。ポリゴン件数は農地面積ha、農地筆数、CH₄実測値、土壌炭素量、CO₂e削減量を意味しません。現行行政コード、2024年水稲統計、JAXA土地被覆との自動結合はしません。原本監査台帳：research/p42-kanagawa-soil-shapefile-source-v1.json。検証方法：docs/p42-kanagawa-soil-gis-ja.md。</p></section>';
}
