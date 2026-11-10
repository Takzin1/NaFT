/* NaFT P56 · Hyogo agricultural soil GIS. Preserve original source codes and place names. */
'use strict';
var GX_HYOGO_SOURCE_HASH="d0e2c012e060014b341595d3a34aadb83498476290c7a1ae1cd2a27363733e38";
var GX_HYOGO_LANDUSE=[["田",615],["普通畑",333],["牧草地",60],["樹園地",208]];
var GX_HYOGO_CODE_PAIRS=[["26201","丹波市",3,0,0,0],["26201","朝来市",0,1,0,0],["26201","篠山市",1,0,0,0],["26407","篠山市",1,0,0,0],["27204","川西市",0,1,0,1],["28107","垂水区",1,0,0,0],["28107","須磨区",2,0,0,0],["28108","垂水区",1,2,0,0],["28109","三木市",2,0,0,0],["28109","三田市",3,0,0,0],["28109","北区",16,3,1,5],["28109","西区",1,0,0,0],["28109","西宮市",3,0,0,0],["28111","三木市",4,0,0,0],["28111","明石市",4,3,0,1],["28111","稲美町",3,1,0,0],["28111","西区",17,9,1,6],["28201","たつの市",2,0,0,0],["28201","加古川市",3,0,0,0],["28201","加西市",3,0,0,0],["28201","太子町",4,0,0,0],["28201","姫路市",22,15,0,8],["28201","福崎町",6,1,0,0],["28201","高砂市",3,1,0,0],["28202","伊丹市",2,0,0,0],["28202","尼崎市",2,2,0,0],["28203","加古川市",1,0,0,0],["28203","播磨町",1,0,0,0],["28203","明石市",4,1,1,1],["28204","西宮市",4,2,0,0],["28205","南あわじ市",6,2,0,2],["28205","洲本市",15,13,2,8],["28205","淡路市",4,1,0,0],["28206","芦屋市",1,1,0,0],["28207","伊丹市",2,2,0,2],["28207","宝塚市",1,1,0,1],["28207","川西市",1,0,0,0],["28208","たつの市",1,0,0,0],["28208","相生市",11,3,0,1],["28208","赤穂市",1,0,0,0],["28209","豊岡市",22,23,6,12],["28210","三木市",1,0,0,0],["28210","加古川市",16,6,1,4],["28210","加西市",1,0,0,1],["28210","小野市",2,0,0,1],["28210","播磨町",1,0,0,0],["28210","稲美町",8,0,0,0],["28210","高砂市",1,0,0,0],["28212","上郡町",2,0,0,0],["28212","赤穂市",13,11,0,4],["28213","加東市",2,0,0,0],["28213","多可町",3,1,0,0],["28213","西脇市",11,4,1,2],["28214","三田市",2,0,0,0],["28214","宝塚市",8,3,1,4],["28214","川西市",0,1,0,1],["28214","猪名川町",0,0,0,1],["28215","三木市",12,6,3,4],["28215","三田市",1,0,0,1],["28215","加東市",1,0,0,1],["28215","小野市",2,0,0,0],["28215","稲美町",3,1,0,0],["28216","高砂市",6,5,0,1],["28217","川西市",4,2,0,2],["28217","猪名川町",1,0,0,0],["28218","加東市",6,0,0,0],["28218","加西市",1,1,0,1],["28218","小野市",11,5,5,5],["28219","三田市",10,5,2,2],["28219","加東市",1,0,0,0],["28219","篠山市",0,0,0,1],["28220","加東市",5,2,0,1],["28220","加西市",10,6,3,6],["28220","福崎町",1,0,0,0],["28221","加東市",2,0,0,0],["28221","篠山市",13,5,1,10],["28222","朝来市",1,0,0,0],["28222","養父市",15,16,4,4],["28223","丹波市",20,19,2,15],["28224","南あわじ市",18,16,3,12],["28225","朝来市",11,7,0,4],["28226","淡路市",9,9,4,12],["28227","たつの市",1,0,0,0],["28227","宍粟市",25,21,2,10],["28228","加東市",14,5,2,5],["28229","たつの市",10,8,3,6],["28229","佐用町",1,0,1,0],["28229","太子町",2,0,0,0],["28301","猪名川町",11,3,0,6],["28365","多可町",16,5,0,2],["28381","稲美町",9,6,0,0],["28442","市川町",7,3,0,0],["28442","神河町",2,0,0,0],["28442","福崎町",1,0,0,0],["28443","福崎町",10,3,0,0],["28446","神河町",9,6,0,6],["28464","太子町",7,3,0,0],["28481","上郡町",6,5,0,1],["28501","佐用町",17,10,3,10],["28585","新温泉町",2,0,0,0],["28585","香美町",29,19,5,9],["28586","新温泉町",17,17,3,5]];
var GX_HYOGO_GUN=[["",942],["佐用郡",40],["加古郡",15],["多可郡",23],["川辺郡",20],["揖保郡",10],["神崎郡",47],["美方郡",106],["船井郡",1],["赤穂郡",12]];
var GX_HYOGO_GUN_PAIRS=[["","たつの市",14,8,3,6],["","三木市",19,6,3,4],["","三田市",16,5,2,3],["","上郡町",2,0,0,0],["","丹波市",23,19,2,15],["","伊丹市",4,2,0,2],["","佐用町",1,0,1,0],["","加古川市",20,6,1,4],["","加東市",31,7,2,7],["","加西市",15,7,3,8],["","北区",16,3,1,5],["","南あわじ市",24,18,3,14],["","垂水区",2,2,0,0],["","多可町",3,1,0,0],["","太子町",6,0,0,0],["","姫路市",22,15,0,8],["","宍粟市",25,21,2,10],["","宝塚市",9,4,1,5],["","小野市",15,5,5,6],["","尼崎市",2,2,0,0],["","川西市",5,4,0,4],["","播磨町",2,0,0,0],["","明石市",8,4,1,2],["","朝来市",12,8,0,4],["","洲本市",15,13,2,8],["","淡路市",13,10,4,12],["","猪名川町",1,0,0,1],["","相生市",11,3,0,1],["","福崎町",7,1,0,0],["","稲美町",14,2,0,0],["","篠山市",14,5,1,11],["","芦屋市",1,1,0,0],["","西区",18,9,1,6],["","西宮市",7,2,0,0],["","西脇市",11,4,1,2],["","豊岡市",22,23,6,12],["","赤穂市",14,11,0,4],["","須磨区",2,0,0,0],["","養父市",15,16,4,4],["","高砂市",10,6,0,1],["佐用郡","佐用町",17,10,3,10],["加古郡","稲美町",9,6,0,0],["多可郡","多可町",16,5,0,2],["川辺郡","猪名川町",11,3,0,6],["揖保郡","太子町",7,3,0,0],["神崎郡","市川町",7,3,0,0],["神崎郡","神河町",11,6,0,6],["神崎郡","福崎町",11,3,0,0],["美方郡","新温泉町",19,17,3,5],["美方郡","香美町",29,19,5,9],["船井郡","篠山市",1,0,0,0],["赤穂郡","上郡町",6,5,0,1]];

function gxHyogoSoilValidate(){
 var cn=new Map(),nc=new Map(),keys=new Set(),total=[0,0,0,0],foreign={'26':0,'27':0},foreignPairs=0,historic=0;
 if(GX_HYOGO_LANDUSE.length!==4||GX_HYOGO_CODE_PAIRS.length!==102||GX_HYOGO_GUN_PAIRS.length!==52)throw Error('P56_HYOGO_DATA_LENGTH');
 GX_HYOGO_CODE_PAIRS.forEach(function(r){
  if(r.length!==6||!/^(26|27|28)[0-9]{3}$/.test(r[0])||!r[1])throw Error('P56_HYOGO_JCODE');
  var key=r[0]+'|'+r[1];if(keys.has(key))throw Error('P56_HYOGO_DUP_JCODE_NAME');keys.add(key);
  if(!cn.has(r[0]))cn.set(r[0],new Set());cn.get(r[0]).add(r[1]);
  if(!nc.has(r[1]))nc.set(r[1],new Set());nc.get(r[1]).add(r[0]);
  var n=r.slice(2).reduce(function(a,v,i){if(!Number.isSafeInteger(v)||v<0)throw Error('P56_HYOGO_COUNT');total[i]+=v;return a+v;},0);
  if(!r[0].startsWith('28')){foreign[r[0].slice(0,2)]+=n;foreignPairs++;}
  if(r[1]==='篠山市')historic+=n;
 });
 if(cn.size!==46||nc.size!==44||foreign['26']!==6||foreign['27']!==2||foreignPairs!==5||historic!==32)throw Error('P56_HYOGO_CODE_ANOMALY');
 if([...cn.values()].filter(function(s){return s.size>1;}).length!==25||[...nc.values()].filter(function(s){return s.size>1;}).length!==31)throw Error('P56_HYOGO_MAPPING_AMBIGUITY');
 if(total.reduce(function(a,b){return a+b;},0)!==1216||GX_HYOGO_LANDUSE.some(function(r,i){return r[1]!==total[i];}))throw Error('P56_HYOGO_TOTAL');
 var county=Object.fromEntries(GX_HYOGO_GUN),seen=new Set(),actual={},gTotal=[0,0,0,0],known=new Set();
 GX_HYOGO_GUN_PAIRS.forEach(function(r){if(r[0])known.add(r[1]);});
 var blank=0,townBlank=0,oldCityBlank=0,suspect=null;
 GX_HYOGO_GUN_PAIRS.forEach(function(r){
  if(r.length!==6||!r[1])throw Error('P56_HYOGO_GUN_ROW');
  var key=r[0]+'|'+r[1];if(seen.has(key))throw Error('P56_HYOGO_DUP_GUN_NAME');seen.add(key);
  var n=r.slice(2).reduce(function(a,v,i){if(!Number.isSafeInteger(v)||v<0)throw Error('P56_HYOGO_GUN_COUNT');gTotal[i]+=v;return a+v;},0);
  actual[r[0]]=(actual[r[0]]||0)+n;
  if(!r[0]&&known.has(r[1])){blank+=n;if(/[町村]$/.test(r[1]))townBlank+=n;if(r[1]==='篠山市')oldCityBlank+=n;}
  if(r[0]==='船井郡'&&r[1]==='篠山市')suspect=r;
 });
 if(Object.keys(county).length!==10||county['']!==942||county['船井郡']!==1||GX_HYOGO_GUN.some(function(r){return r[1]!==actual[r[0]];})||gTotal.some(function(v,i){return v!==total[i];}))throw Error('P56_HYOGO_GUN_TOTAL');
 if(blank!==71||townBlank!==40||oldCityBlank!==31||!suspect||JSON.stringify(suspect.slice(2))!==JSON.stringify([1,0,0,0]))throw Error('P56_HYOGO_GUN_ANOMALY');
 return true;
}
function gxHyogoSoilPanel(prefCode){
 if(prefCode!=='28')return '';
 gxHyogoSoilValidate();
 var fmt=function(n){return Number(n).toLocaleString('ja-JP');};
 var cards=GX_HYOGO_LANDUSE.map(function(r){return '<article class="gx-data-card"><span class="gx-kicker">地目区分 / Polygon features</span><strong>'+fmt(r[1])+' <small>件</small></strong><p>'+gxEsc(r[0])+'（面積haではありません）</p></article>';}).join('');
 var codes=new Map(),names=new Map();
 GX_HYOGO_CODE_PAIRS.forEach(function(r){codes.set(r[0],(codes.get(r[0])||0)+1);names.set(r[1],(names.get(r[1])||0)+1);});
 var h='<thead><tr><th scope="col">市区町村名（原本）</th><th scope="col">JCODE（原本）</th><th scope="col">田</th><th scope="col">普通畑</th><th scope="col">牧草地</th><th scope="col">樹園地</th><th scope="col">合計</th><th scope="col">照合状態</th></tr></thead>';
 var body=GX_HYOGO_CODE_PAIRS.map(function(r){
  var f=[];
  if(!r[0].startsWith('28'))f.push('県外JCODE '+r[0].slice(0,2));
  if(codes.get(r[0])>1||names.get(r[1])>1)f.push('コード・名称複数対応');
  if(r[1]==='篠山市')f.push('2017年時点の名称（現在は丹波篠山市）');
  return '<tr><th scope="row">'+gxEsc(r[1])+'</th><td>'+gxEsc(r[0])+'</td>'+r.slice(2).map(function(x){return '<td>'+fmt(x)+'</td>';}).join('')+'<td>'+fmt(r.slice(2).reduce(function(a,b){return a+b;},0))+'</td><td>'+(f.length?gxEsc(f.join('／'))+'・要照合':'原本値')+'</td></tr>';
 }).join('');
 var known=new Set(GX_HYOGO_GUN_PAIRS.filter(function(r){return !!r[0];}).map(function(r){return r[1];}));
 var gr=GX_HYOGO_GUN.filter(function(r){return r[0];}).map(function(r){return '<tr><th scope="row">'+gxEsc(r[0])+'</th><td>'+fmt(r[1])+'</td><td>'+(r[0]==='船井郡'?'「篠山市」の1件・府外郡名要照合':'原本値')+'</td></tr>';}).join('');
 var detail=GX_HYOGO_GUN_PAIRS.map(function(r){
  var f=[];
  if(r[0]==='船井郡'&&r[1]==='篠山市')f.push('府外郡名／京都府系JCODE');
  if(!r[0]&&known.has(r[1]))f.push('同名に郡名付き原本あり（市は必ずしも欠損ではない）');
  if(r[1]==='篠山市')f.push('2017年時点の市名');
  return '<tr><th scope="row">'+gxEsc(r[1])+'</th><td>'+gxEsc(r[0]||'（空欄）')+'</td>'+r.slice(2).map(function(v){return '<td>'+fmt(v)+'</td>';}).join('')+'<td>'+(f.length?gxEsc(f.join('／'))+'・要照合':'原本値')+'</td></tr>';
 }).join('');
 return '<section class="gx-dashboard" aria-labelledby="gx-hyogo-soil-title">'+
  '<div class="gx-section-heading"><span class="gx-kicker">HYOGO SOIL GIS · P56 · SOURCE ATTRIBUTES AUDITED</span>'+
  '<h2 id="gx-hyogo-soil-title">兵庫県の農耕地土壌GISを確認する。</h2>'+
  '<p>原本JGD2000の土壌ポリゴン1,216件。田615件、普通畑333件、牧草地60件、樹園地208件。市区町村名44種類、JCODE46種類、原本組合せ102通り。土壌群18種類・詳細分類68種類（両分類の空欄は0件）。原本XMLのメタデータ作成日は2017年1月17日。</p></div>'+
  '<p class="gx-anomaly"><b>府県境・郡名と旧自治体名の照合保留：</b>県外JCODEは計8ポリゴン（京都府26系6件、大阪府27系2件、5組合せ）。JCODE25種類が複数の名称、名称31種類が複数のJCODEに対応します。「篠山市」は原本32件、2019年の市名変更前なので2017年時点の記録として保持します。ただし「篠山市／船井郡／JCODE 26407」1件は京都府の郡名・コードが混在するため要照合です。GUN空欄942件、うち同名に郡名付き原本がある空欄71件は町村名40件と旧市名「篠山市」31件を区別しています。無断補正や自治体別統計との自動JOINは保留します。</p>'+
  '<div class="gx-detail-grid">'+cards+'</div>'+
  '<details><summary>原本GUN（郡名）別件数を見る</summary><div class="scroll"><table><thead><tr><th>原本郡名</th><th>件数</th><th>照合状態</th></tr></thead><tbody>'+gr+'</tbody></table></div><p>郡名空欄942件、記載274件。府外の「船井郡」1件を含みます。ここに示すのは原本属性の件数であり、現在の正式な郡別農地面積ではありません。</p></details>'+
  '<details><summary>原本GUN×市区町村名52組合せを見る</summary><div class="scroll"><table><thead><tr><th>市区町村名</th><th>GUN原本</th><th>田</th><th>普通畑</th><th>牧草地</th><th>樹園地</th><th>要照合</th></tr></thead><tbody>'+detail+'</tbody></table></div></details>'+
  '<details><summary>原本JCODE×市区町村名102組合せを見る（要照合）</summary><div class="scroll"><table>'+h+'<tbody>'+body+'</tbody></table></div></details>'+
  '<p class="gx-advisory"><b>来歴と科学的・配布上の制約：</b>農研機構「日本土壌インベントリー」は原本の候補ですが、公式兵庫県ZIPとのSHA完全一致・個別再配布ライセンス適用は未確認。原Shapefile・DBF・ZIPを公開GitHubに複製せず、原本ハッシュと派生集計を登録。ポリゴン件数は農地面積ha・筆数・CH₄実測・土壌炭素量・CO₂e削減量・J-クレジット認証量ではありません。2024年水稲統計やJAXA土地被覆との無検証な行政コードJOINも行いません。原本監査台帳：research/p56-hyogo-soil-shapefile-source-v1.json。検証方法：docs/p56-hyogo-soil-gis-ja.md。</p></section>';
}
