/* NaFT P50 · Shizuoka agricultural soil GIS; source-preserving derived counts. */
'use strict';
var GX_SHIZUOKA_SOURCE_HASH="5f742daa989dac20ad00e0ab10a43ec7ee42a2f529a9b5f4fb20cb512b66b799";
var GX_SHIZUOKA_LANDUSE=[["田",412],["普通畑",451],["牧草地",44],["樹園地",469]];
var GX_SHIZUOKA_CODE_NAME_PAIRS=[["14382","三島市",0,0,1,0],["14382","裾野市",0,0,1,0],["14384","熱海市",0,1,0,0],["19430","富士宮市",0,0,1,0],["22101","川根本町",0,2,1,2],["22101","清水区",1,2,0,3],["22101","葵区",8,10,2,15],["22101","藤枝市",0,1,0,3],["22101","駿河区",2,0,0,3],["22102","清水区",0,2,0,3],["22102","焼津市",0,0,0,1],["22102","藤枝市",0,0,0,1],["22102","駿河区",6,5,0,11],["22103","富士市",0,1,0,3],["22103","清水区",7,18,0,17],["22131","中区",8,4,0,1],["22131","南区",4,0,0,0],["22131","東区",3,0,0,0],["22131","西区",1,1,0,1],["22132","北区",0,1,0,1],["22132","南区",2,2,0,0],["22132","東区",11,10,0,3],["22132","浜北区",4,4,0,1],["22133","北区",0,1,0,2],["22133","南区",4,3,0,0],["22133","西区",11,12,0,3],["22134","南区",14,13,0,1],["22135","北区",12,12,0,18],["22135","天竜区",0,0,0,1],["22135","浜北区",0,2,0,2],["22135","湖西市",0,0,0,1],["22136","天竜区",0,2,0,0],["22136","浜北区",11,14,0,9],["22137","天竜区",9,12,0,13],["22137","森町",0,0,0,1],["22203","三島市",1,0,0,0],["22203","伊豆の国市",0,0,0,2],["22203","伊豆市",0,0,0,1],["22203","函南町",1,0,0,0],["22203","富士市",1,2,0,2],["22203","沼津市",8,15,1,9],["22203","長泉町",0,1,0,0],["22205","熱海市",0,1,0,1],["22206","三島市",4,6,1,5],["22206","函南町",2,2,0,0],["22206","清水町",1,2,0,0],["22206","裾野市",2,1,0,0],["22207","富士宮市",13,19,4,11],["22207","富士市",1,4,0,4],["22208","伊東市",1,5,1,4],["22209","吉田町",1,0,0,2],["22209","島田市",6,7,1,17],["22209","掛川市",1,1,0,3],["22209","牧之原市",0,0,0,6],["22209","菊川市",0,0,0,3],["22209","藤枝市",1,0,0,3],["22210","富士市",15,18,0,14],["22211","森町",1,0,0,1],["22211","磐田市",19,17,0,15],["22211","袋井市",8,5,0,3],["22212","焼津市",7,10,0,12],["22212","藤枝市",3,1,0,2],["22213","御前崎市",0,1,0,0],["22213","掛川市",14,18,9,23],["22213","森町",0,0,0,1],["22213","菊川市",7,1,0,6],["22213","袋井市",6,1,1,7],["22214","藤枝市",8,8,0,9],["22215","小山町",2,2,0,1],["22215","御殿場市",4,7,2,2],["22215","裾野市",2,1,1,0],["22216","森町",5,2,0,4],["22216","袋井市",13,12,1,20],["22219","下田市",7,8,0,8],["22219","南伊豆町",1,0,0,1],["22220","裾野市",3,8,1,3],["22220","長泉町",0,1,0,0],["22221","湖西市",16,20,0,10],["22222","伊豆の国市",2,0,0,0],["22222","伊豆市",6,11,2,9],["22222","西伊豆町",0,0,2,0],["22223","御前崎市",7,10,0,15],["22223","牧之原市",3,3,0,6],["22223","菊川市",1,0,0,1],["22224","牧之原市",0,0,0,2],["22224","菊川市",11,10,0,20],["22225","伊豆の国市",9,8,1,5],["22225","函南町",4,0,0,0],["22226","吉田町",3,0,0,0],["22226","牧之原市",8,11,0,12],["22301","東伊豆町",4,3,0,7],["22301","河津町",0,0,0,3],["22302","河津町",4,7,0,7],["22304","南伊豆町",7,5,1,6],["22304","松崎町",0,0,0,1],["22305","松崎町",6,6,0,6],["22306","西伊豆町",4,6,2,1],["22325","函南町",7,7,5,5],["22341","清水町",2,2,0,0],["22342","長泉町",1,4,1,2],["22344","小山町",3,5,1,2],["22424","吉田町",6,3,0,4],["22429","川根本町",1,2,0,6],["22461","森町",10,6,0,14]];
var GX_SHIZUOKA_GUN_NAME_PAIRS=[["","三島市",5,6,1,5],["","下田市",7,8,0,8],["","中区",8,4,0,1],["","伊東市",1,5,1,4],["","伊豆の国市",11,8,1,7],["","伊豆市",6,11,2,10],["","函南町",7,2,0,0],["","北区",12,14,0,21],["","南伊豆町",1,0,0,1],["","南区",24,18,0,1],["","吉田町",4,0,0,2],["","天竜区",9,14,0,14],["","富士宮市",13,19,4,11],["","富士市",17,25,0,23],["","小山町",2,2,0,1],["","島田市",6,7,1,17],["","川根本町",0,2,1,2],["","御前崎市",7,11,0,15],["","御殿場市",4,7,2,2],["","掛川市",15,19,9,26],["","東区",14,10,0,3],["","森町",6,2,0,7],["","沼津市",8,15,1,9],["","浜北区",15,20,0,12],["","清水区",8,22,0,23],["","清水町",1,2,0,0],["","湖西市",16,20,0,11],["","焼津市",7,10,0,13],["","熱海市",0,1,0,1],["","牧之原市",11,14,0,26],["","磐田市",19,17,0,15],["","菊川市",19,11,0,30],["","葵区",8,10,2,15],["","藤枝市",12,10,0,18],["","袋井市",27,18,2,30],["","裾野市",7,10,2,3],["","西伊豆町",0,0,2,0],["","西区",12,13,0,4],["","長泉町",0,2,0,0],["","駿河区",8,5,0,14],["南都留郡","富士宮市",0,0,1,0],["周智郡","森町",10,6,0,14],["榛原郡","吉田町",6,3,0,4],["榛原郡","川根本町",1,2,0,6],["田方郡","函南町",7,7,5,5],["賀茂郡","南伊豆町",7,5,1,6],["賀茂郡","東伊豆町",4,3,0,7],["賀茂郡","松崎町",6,6,0,7],["賀茂郡","河津町",4,7,0,10],["賀茂郡","西伊豆町",4,6,2,1],["足柄下郡","三島市",0,0,1,0],["足柄下郡","熱海市",0,1,0,0],["足柄下郡","裾野市",0,0,1,0],["駿東郡","小山町",3,5,1,2],["駿東郡","清水町",2,2,0,0],["駿東郡","長泉町",1,4,1,2]];
var GX_SHIZUOKA_GUN=[["",1187],["南都留郡",1],["周智郡",30],["榛原郡",22],["田方郡",24],["賀茂郡",86],["足柄下郡",3],["駿東郡",23]];
var GX_SHIZUOKA_MISSING_GUN_NAMES=["三島市","函南町","南伊豆町","吉田町","富士宮市","小山町","川根本町","森町","清水町","熱海市","裾野市","西伊豆町","長泉町"];
function gxShizuokaSoilValidate(){
 if(GX_SHIZUOKA_CODE_NAME_PAIRS.length!==104||GX_SHIZUOKA_GUN_NAME_PAIRS.length!==56||GX_SHIZUOKA_LANDUSE.length!==4)throw Error('P50_SHIZUOKA_LENGTH');
 var codes=new Map(),names=new Map(),seen=new Set(),counts=[0,0,0,0],foreign={'14':0,'19':0},foreignPairs=0;
 GX_SHIZUOKA_CODE_NAME_PAIRS.forEach(function(r){
  if(r.length!==6||!/^(14|19|22)[0-9]{3}$/.test(r[0])||!r[1])throw Error('P50_SHIZUOKA_CODE');
  var k=r[0]+'|'+r[1];if(seen.has(k))throw Error('P50_SHIZUOKA_DUPLICATE_CODE');seen.add(k);
  if(!codes.has(r[0]))codes.set(r[0],new Set());codes.get(r[0]).add(r[1]);
  if(!names.has(r[1]))names.set(r[1],new Set());names.get(r[1]).add(r[0]);
  var n=r.slice(2).reduce(function(sum,v,i){if(!Number.isSafeInteger(v)||v<0)throw Error('P50_SHIZUOKA_BAD_COUNT');counts[i]+=v;return sum+v;},0);
  if(!r[0].startsWith('22')){foreign[r[0].slice(0,2)]+=n;foreignPairs++;}
 });
 if(codes.size!==46||names.size!==43||foreign['14']!==3||foreign['19']!==1||foreignPairs!==4)throw Error('P50_SHIZUOKA_FOREIGN_JCODE');
 if([...codes.values()].filter(function(s){return s.size>1;}).length!==28||[...names.values()].filter(function(s){return s.size>1;}).length!==34)throw Error('P50_SHIZUOKA_AMBIGUITY');
 var expected=[412,451,44,469];
 if(counts.some(function(n,i){return n!==expected[i]||n!==GX_SHIZUOKA_LANDUSE[i][1];}))throw Error('P50_SHIZUOKA_LANDUSE');
 var g=new Map(),gt=[0,0,0,0],namesWithGun=new Set(),gunSeen=new Set();
 GX_SHIZUOKA_GUN_NAME_PAIRS.forEach(function(r){
  if(r.length!==6||!r[1])throw Error('P50_SHIZUOKA_GUN_PAIR');
  var key=r[0]+'|'+r[1];if(gunSeen.has(key))throw Error('P50_SHIZUOKA_DUPLICATE_GUN');gunSeen.add(key);
  var n=r.slice(2).reduce(function(sum,v,i){if(!Number.isSafeInteger(v)||v<0)throw Error('P50_SHIZUOKA_GUN_COUNT');gt[i]+=v;return sum+v;},0);
  g.set(r[0],(g.get(r[0])||0)+n);
  if(r[0])namesWithGun.add(r[1]);
 });
 if(gt.some(function(n,i){return n!==expected[i];})||g.size!==8||g.get('')!==1187||g.get('南都留郡')!==1||g.get('足柄下郡')!==3)throw Error('P50_SHIZUOKA_GUN_TOTAL');
 if(GX_SHIZUOKA_GUN.some(function(r){return r[1]!==g.get(r[0]);}))throw Error('P50_SHIZUOKA_GUN_PARITY');
 var blank=GX_SHIZUOKA_GUN_NAME_PAIRS.filter(function(r){return r[0]===''&&namesWithGun.has(r[1]);});
 if(blank.length!==13||blank.reduce(function(sum,r){return sum+r.slice(2).reduce(function(a,b){return a+b;},0);},0)!==137)throw Error('P50_SHIZUOKA_GUN_BLANK');
 if(blank.some(function(r){return !GX_SHIZUOKA_MISSING_GUN_NAMES.includes(r[1]);})||new Set(GX_SHIZUOKA_MISSING_GUN_NAMES).size!==13)throw Error('P50_SHIZUOKA_GUN_BLANK_NAMES');
 return true;
}
function gxShizuokaSoilPanel(prefCode){
 if(prefCode!=='22')return '';
 gxShizuokaSoilValidate();
 var fmt=function(n){return Number(n).toLocaleString('ja-JP');};
 var cards=GX_SHIZUOKA_LANDUSE.map(function(r){return '<article class="gx-data-card"><span class="gx-kicker">地目区分 / Polygon features</span><strong>'+fmt(r[1])+' <small>件</small></strong><p>'+gxEsc(r[0])+'（面積haではありません）</p></article>';}).join('');
 var codes=new Map(),names=new Map();
 GX_SHIZUOKA_CODE_NAME_PAIRS.forEach(function(r){codes.set(r[0],(codes.get(r[0])||0)+1);names.set(r[1],(names.get(r[1])||0)+1);});
 var head='<thead><tr><th>市区町村名（原本）</th><th>JCODE（原本）</th><th>田</th><th>普通畑</th><th>牧草地</th><th>樹園地</th><th>計</th><th>照合事項</th></tr></thead>';
 var rows=GX_SHIZUOKA_CODE_NAME_PAIRS.map(function(r){
  var flags=[];
  if(!r[0].startsWith('22'))flags.push('県外コード'+r[0].slice(0,2));
  if(codes.get(r[0])>1||names.get(r[1])>1)flags.push('コード・名称複数対応');
  if(['中区','東区','浜北区','西区','南区','北区'].includes(r[1]))flags.push('浜松市旧行政区名称');
  return '<tr><th scope="row">'+gxEsc(r[1])+'</th><td>'+gxEsc(r[0])+'</td>'+r.slice(2).map(function(v){return '<td>'+fmt(v)+'</td>';}).join('')+'<td>'+fmt(r.slice(2).reduce(function(a,b){return a+b;},0))+'</td><td>'+(flags.length?gxEsc(flags.join('／'))+'・要照合':'原本値')+'</td></tr>';
 }).join('');
 var gunSummary=GX_SHIZUOKA_GUN.filter(function(r){return r[0]!=='';}).map(function(r){return '<tr><th scope="row">'+gxEsc(r[0])+'</th><td>'+fmt(r[1])+'</td><td>'+(['足柄下郡','南都留郡'].includes(r[0])?'県外郡名・要照合':'原本値')+'</td></tr>';}).join('');
 var gunDetail=GX_SHIZUOKA_GUN_NAME_PAIRS.map(function(r){
  var flags=[];
  if(['足柄下郡','南都留郡'].includes(r[0]))flags.push('県外郡名');
  if(!r[0]&&GX_SHIZUOKA_MISSING_GUN_NAMES.includes(r[1]))flags.push('原本郡名空欄');
  return '<tr><th scope="row">'+gxEsc(r[1])+'</th><td>'+gxEsc(r[0]||'（空欄）')+'</td>'+r.slice(2).map(function(n){return '<td>'+fmt(n)+'</td>';}).join('')+'<td>'+(flags.length?gxEsc(flags.join('／'))+'・要照合':'原本値')+'</td></tr>';
 }).join('');
 return '<section class="gx-dashboard" aria-labelledby="gx-shizuoka-soil-title">'+
  '<div class="gx-section-heading"><span class="gx-kicker">SHIZUOKA SOIL GIS · P50 · ORIGINAL ATTRIBUTE AUDIT</span>'+
  '<h2 id="gx-shizuoka-soil-title">静岡県の農耕地土壌GISを確認する。</h2>'+
  '<p>原本JGD2000の土壌ポリゴン1,376件。地目は田412件・普通畑451件・牧草地44件・樹園地469件。原本の市区町村名43種類（旧浜松市の区名を含む）、JCODE46種類、組合せ104通り。土壌群17種類・詳細分類99種類。原本XMLの作成日は2017年1月17日。</p></div>'+
  '<p class="gx-anomaly"><b>原本の自治体コード・郡名に要照合事項：</b>静岡県22系以外のJCODEが4件（神奈川県14系3、山梨県19系1）。28のコードが複数名称に、34の名称が複数JCODEに対応。県外GUNも4件（足柄下郡3・南都留郡1）含むほか、同じ名称に郡名付きレコードがあるのにGUN空欄が13組合せ・137ポリゴンあります。原本の浜松市旧区名も現在の区名へ自動置換せず保持。自治体統計・郡別統計への外部JOINは保留します。</p>'+
  '<div class="gx-detail-grid">'+cards+'</div>'+
  '<details><summary>原本GUN（郡名）別の記録件数を確認する</summary><div class="scroll"><table><thead><tr><th>郡名（原本）</th><th>ポリゴン件数</th><th>照合事項</th></tr></thead><tbody>'+gunSummary+'</tbody></table></div><p>GUN空欄は1,187件。原本属性であり、現行の正式な郡別統計ではありません。</p></details>'+
  '<details><summary>原本GUN×市区町村名56組合せを見る</summary><div class="scroll"><table><thead><tr><th>市区町村名</th><th>GUN（原本）</th><th>田</th><th>普通畑</th><th>牧草地</th><th>樹園地</th><th>照合</th></tr></thead><tbody>'+gunDetail+'</tbody></table></div></details>'+
  '<details><summary>原本JCODE×市区町村名104組合せを見る（要照合）</summary><div class="scroll"><table>'+head+'<tbody>'+rows+'</tbody></table></div></details>'+
  '<p class="gx-advisory"><b>出典候補と研究上の制約：</b>農研機構「日本土壌インベントリー」は出典候補ですが、公式静岡県ZIPとのSHA-256完全一致・具体的ライセンスの適用は未確認。原Shapefile・DBF・ZIPは公開GitHubに複製せず原本ハッシュと派生集計のみ収録。ポリゴン件数は農地面積ha、筆数、CH₄実測値、土壌炭素量、CO₂e削減量、認証済みクレジットではありません。現行自治体境界・2024年水稲統計・JAXA土地被覆との行政コード自動結合をしていません。原本監査台帳：research/p50-shizuoka-soil-shapefile-source-v1.json。手順：docs/p50-shizuoka-soil-gis-ja.md。</p></section>';
}
