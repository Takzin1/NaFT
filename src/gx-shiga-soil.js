/* NaFT P53 Shiga original soil GIS; source code/name/GUN values remain unchanged. */
'use strict';
var GX_SHIGA_SOURCE_HASH="3fef4ebc36d2856543a0034f05815fb1961e37b9ad1a160883d2ad22a0229a19";
var GX_SHIGA_LANDUSE=[["田",410],["普通畑",257],["牧草地",9],["樹園地",109]];
var GX_SHIGA_CODE_NAME_PAIRS=[["21362","米原市",0,0,0,1],["24210","甲賀市",0,0,0,1],["24216","甲賀市",3,0,0,0],["25201","大津市",30,17,0,6],["25201","栗東市",1,0,0,0],["25201","甲賀市",2,0,0,0],["25201","草津市",4,1,0,1],["25201","高島市",2,0,0,0],["25202","多賀町",3,0,0,0],["25202","彦根市",15,13,0,5],["25202","愛荘町",4,0,0,0],["25202","甲良町",2,2,0,0],["25202","米原市",4,0,0,0],["25202","豊郷町",5,0,0,0],["25203","米原市",6,1,0,0],["25203","長浜市",30,25,0,10],["25204","東近江市",7,1,0,0],["25204","竜王町",3,0,0,0],["25204","近江八幡市",19,13,0,0],["25204","野洲市",5,0,0,0],["25206","守山市",3,1,0,0],["25206","栗東市",3,1,0,0],["25206","草津市",16,12,0,6],["25207","守山市",19,16,0,5],["25207","栗東市",3,0,0,0],["25207","野洲市",4,3,0,1],["25208","栗東市",3,0,0,0],["25208","湖南市",2,0,0,0],["25209","日野町",4,1,0,0],["25209","東近江市",1,0,0,0],["25209","湖南市",2,3,0,0],["25209","甲賀市",24,22,4,27],["25210","湖南市",1,0,0,0],["25210","野洲市",17,13,1,1],["25211","湖南市",11,9,0,1],["25211","竜王町",1,0,0,0],["25212","高島市",25,21,0,9],["25213","愛荘町",5,0,0,0],["25213","日野町",5,1,0,0],["25213","東近江市",27,24,1,15],["25213","竜王町",2,0,0,0],["25214","米原市",20,20,0,5],["25383","日野町",17,6,3,8],["25384","竜王町",10,7,0,5],["25425","愛荘町",14,7,0,1],["25425","豊郷町",3,0,0,0],["25441","甲良町",2,0,0,0],["25441","豊郷町",7,3,0,0],["25442","多賀町",1,1,0,0],["25442","甲良町",6,6,0,1],["25443","多賀町",7,7,0,0]];
var GX_SHIGA_GUN=[["",662],["不破郡",1],["愛知郡",25],["犬上郡",41],["蒲生郡",56]];
var GX_SHIGA_GUN_NAME_PAIRS=[["","多賀町",3,0,0,0],["","大津市",30,17,0,6],["","守山市",22,17,0,5],["","彦根市",15,13,0,5],["","愛荘町",9,0,0,0],["","日野町",9,2,0,0],["","東近江市",35,25,1,15],["","栗東市",10,1,0,0],["","湖南市",16,12,0,1],["","甲良町",2,2,0,0],["","甲賀市",29,22,4,28],["","竜王町",6,0,0,0],["","米原市",30,21,0,5],["","草津市",20,13,0,7],["","豊郷町",5,0,0,0],["","近江八幡市",19,13,0,0],["","野洲市",26,16,1,2],["","長浜市",30,25,0,10],["","高島市",27,21,0,9],["不破郡","米原市",0,0,0,1],["愛知郡","愛荘町",14,7,0,1],["愛知郡","豊郷町",3,0,0,0],["犬上郡","多賀町",8,8,0,0],["犬上郡","甲良町",8,6,0,1],["犬上郡","豊郷町",7,3,0,0],["蒲生郡","日野町",17,6,3,8],["蒲生郡","竜王町",10,7,0,5]];
function gxShigaSoilValidate(){
 if(GX_SHIGA_LANDUSE.length!==4||GX_SHIGA_CODE_NAME_PAIRS.length!==51||GX_SHIGA_GUN_NAME_PAIRS.length!==27)throw Error('P53_SHIGA_GROUP_SIZE');
 var byCode=new Map(),byName=new Map(),seen=new Set(),totals=[0,0,0,0],foreign={'21':0,'24':0},foreignPairs=0;
 GX_SHIGA_CODE_NAME_PAIRS.forEach(function(r){
  if(r.length!==6||!/^(21|24|25)[0-9]{3}$/.test(r[0])||!r[1])throw Error('P53_SHIGA_CODE_FORMAT');
  var key=r[0]+'|'+r[1];if(seen.has(key))throw Error('P53_SHIGA_DUPLICATE');seen.add(key);
  if(!byCode.has(r[0]))byCode.set(r[0],new Set());byCode.get(r[0]).add(r[1]);
  if(!byName.has(r[1]))byName.set(r[1],new Set());byName.get(r[1]).add(r[0]);
  var sum=r.slice(2).reduce(function(acc,n,i){if(!Number.isSafeInteger(n)||n<0)throw Error('P53_SHIGA_NEGATIVE');totals[i]+=n;return acc+n;},0);
  if(!r[0].startsWith('25')){foreign[r[0].slice(0,2)]+=sum;foreignPairs++;}
 });
 if(byCode.size!==22||byName.size!==19||foreign['21']!==1||foreign['24']!==4||foreignPairs!==3)throw Error('P53_SHIGA_SOURCE_CODES');
 if([...byCode.values()].filter(function(v){return v.size>1;}).length!==14||[...byName.values()].filter(function(v){return v.size>1;}).length!==15)throw Error('P53_SHIGA_MAPPING');
 if(totals.reduce(function(a,b){return a+b;},0)!==785||GX_SHIGA_LANDUSE.some(function(x,i){return totals[i]!==x[1];}))throw Error('P53_SHIGA_LANDUSE_PARITY');
 var known=new Map(),gcounts={},gunTotal=[0,0,0,0],gunSeen=new Set(),nonshiga=null;
 GX_SHIGA_GUN_NAME_PAIRS.forEach(function(r){
  if(r[0]){if(!known.has(r[1]))known.set(r[1],new Set());known.get(r[1]).add(r[0]);}
 });
 var blankTown=0,blankCity=0;
 GX_SHIGA_GUN_NAME_PAIRS.forEach(function(r){
  if(r.length!==6||!r[1])throw Error('P53_SHIGA_GUN_ROW');
  var key=r[0]+'|'+r[1];if(gunSeen.has(key))throw Error('P53_SHIGA_GUN_DUPLICATE');gunSeen.add(key);
  var sum=r.slice(2).reduce(function(a,v,i){if(!Number.isSafeInteger(v)||v<0)throw Error('P53_SHIGA_GUN_NEGATIVE');gunTotal[i]+=v;return a+v;},0);
  gcounts[r[0]]=(gcounts[r[0]]||0)+sum;
  if(!r[0]&&known.has(r[1])){if(r[1].endsWith('市'))blankCity+=sum;else blankTown+=sum;}
  if(r[0]==='不破郡'&&r[1]==='米原市')nonshiga=r;
 });
 if(GX_SHIGA_GUN.length!==5||GX_SHIGA_GUN.some(function(r){return r[1]!==gcounts[r[0]];})||gunTotal.some(function(n,i){return n!==totals[i];}))throw Error('P53_SHIGA_GUN_PARITY');
 if(blankTown!==38||blankCity!==56||!nonshiga||JSON.stringify(nonshiga.slice(2))!==JSON.stringify([0,0,0,1]))throw Error('P53_SHIGA_GUN_ANOMALIES');
 if(JSON.stringify([...known.get('豊郷町')].sort())!==JSON.stringify(['愛知郡','犬上郡']))throw Error('P53_SHIGA_TOYOSATO_GUN');
 return true;
}
function gxShigaSoilPanel(prefCode){
 if(prefCode!=='25')return '';
 gxShigaSoilValidate();
 var fmt=function(n){return Number(n).toLocaleString('ja-JP');};
 var cards=GX_SHIGA_LANDUSE.map(function(r){return '<article class="gx-data-card"><span class="gx-kicker">地目区分 / Polygon features</span><strong>'+fmt(r[1])+' <small>件</small></strong><p>'+gxEsc(r[0])+'（面積haではありません）</p></article>';}).join('');
 var byCode=new Map(),byName=new Map(),byCountyName=new Map();
 GX_SHIGA_CODE_NAME_PAIRS.forEach(function(r){byCode.set(r[0],(byCode.get(r[0])||0)+1);byName.set(r[1],(byName.get(r[1])||0)+1);});
 GX_SHIGA_GUN_NAME_PAIRS.forEach(function(r){if(r[0]){if(!byCountyName.has(r[1]))byCountyName.set(r[1],new Set());byCountyName.get(r[1]).add(r[0]);}});
 var codeHead='<thead><tr><th scope="col">市町村名（原本）</th><th scope="col">JCODE（原本）</th><th scope="col">田</th><th scope="col">普通畑</th><th scope="col">牧草地</th><th scope="col">樹園地</th><th scope="col">合計</th><th scope="col">照合状態</th></tr></thead>';
 var codeBody=GX_SHIGA_CODE_NAME_PAIRS.map(function(r){
  var flags=[];if(!r[0].startsWith('25'))flags.push('県外JCODE '+r[0].slice(0,2));
  if(byCode.get(r[0])>1||byName.get(r[1])>1)flags.push('コード・名称複数対応');
  return '<tr><th scope="row">'+gxEsc(r[1])+'</th><td>'+gxEsc(r[0])+'</td>'+r.slice(2).map(function(v){return '<td>'+fmt(v)+'</td>';}).join('')+'<td>'+fmt(r.slice(2).reduce(function(a,b){return a+b;},0))+'</td><td>'+(flags.length?gxEsc(flags.join('／'))+'・要照合':'原本値')+'</td></tr>';
 }).join('');
 var gunRows=GX_SHIGA_GUN.filter(function(r){return r[0];}).map(function(r){return '<tr><th scope="row">'+gxEsc(r[0])+'</th><td>'+fmt(r[1])+'</td><td>'+(r[0]==='不破郡'?'岐阜県の郡名・米原市1件要照合':r[0]==='愛知郡'?'豊郷町3件の郡名要照合':'原本値')+'</td></tr>';}).join('');
 var gunDetail=GX_SHIGA_GUN_NAME_PAIRS.map(function(r){
  var flags=[];if(r[0]==='不破郡'&&r[1]==='米原市')flags.push('県外郡名（岐阜県）');
  if(!r[0]&&byCountyName.has(r[1]))flags.push('原本GUN空欄・同名に郡名付き記録');
  if(r[1]==='豊郷町'&&byCountyName.get(r[1])&&byCountyName.get(r[1]).size>1)flags.push('同一町名に複数の郡名');
  return '<tr><th scope="row">'+gxEsc(r[1])+'</th><td>'+gxEsc(r[0]||'（空欄）')+'</td>'+r.slice(2).map(function(v){return '<td>'+fmt(v)+'</td>';}).join('')+'<td>'+(flags.length?gxEsc(flags.join('／'))+'・要照合':'原本値')+'</td></tr>';
 }).join('');
 return '<section class="gx-dashboard" aria-labelledby="gx-shiga-soil-title">'+
  '<div class="gx-section-heading"><span class="gx-kicker">SHIGA SOIL GIS · P53 · ORIGINAL ATTRIBUTES AUDITED</span>'+
  '<h2 id="gx-shiga-soil-title">滋賀県の農耕地土壌GISを確認する。</h2>'+
  '<p>原本JGD2000の土壌ポリゴン785件。田410件、普通畑257件、牧草地9件、樹園地109件。市町村名19種類、JCODE22種類、組合せ51通り。土壌群16種類・詳細分類64種類。主要4分類列の原本空欄は0件。原本XML作成日は2017年1月17日。</p></div>'+
  '<p class="gx-anomaly"><b>県外コードと原本郡名は要照合：</b>滋賀県「25」以外のJCODEが5ポリゴン（岐阜県21系1、三重県24系4）。14コードが複数名称に、15名称が複数コードに対応します。「米原市／不破郡」1件（樹園地）は岐阜県の郡名が原本に付いています。「豊郷町」は犬上郡・愛知郡の両方が記載されています。GUN空欄は662件、うち同名に郡名付き記録があるものは94件（町名38件・米原市56件）。市の郡名空欄56件は、県外郡名1件から機械的に抽出されたもので、欠損と断定しません。原本を無断補正せず外部自治体統計へのJOINは保留します。</p>'+
  '<div class="gx-detail-grid">'+cards+'</div>'+
  '<details><summary>原本GUN（郡名）別件数を見る</summary><div class="scroll"><table><thead><tr><th>郡名</th><th>件数</th><th>照合</th></tr></thead><tbody>'+gunRows+'</tbody></table></div><p>郡名空欄662件、郡名付き123件。ここでの件数は原本属性であり、現行行政区境界と照合した郡別農地面積ではありません。</p></details>'+
  '<details><summary>原本GUN×市町村名27組合せを見る</summary><div class="scroll"><table><thead><tr><th>市町村名</th><th>GUN（原本）</th><th>田</th><th>普通畑</th><th>牧草地</th><th>樹園地</th><th>照合</th></tr></thead><tbody>'+gunDetail+'</tbody></table></div></details>'+
  '<details><summary>原本JCODE×市町村名51組合せを見る（要照合）</summary><div class="scroll"><table>'+codeHead+'<tbody>'+codeBody+'</tbody></table></div></details>'+
  '<p class="gx-advisory"><b>出典候補と科学的制約：</b>農研機構「日本土壌インベントリー」は出典候補ですが、公式滋賀県ZIPとのバイト単位のSHA一致や再配布許諾は未確認です。元Shapefile・DBF・ZIPは公開GitHubへ複製せず、原本ハッシュと派生集計だけ登録。ポリゴン件数は農地面積ha、筆数、土壌炭素の実測、CH₄実測、CO₂e削減量、認証済クレジットではありません。2024年水稲統計・JAXA土地被覆とのJCODE自動結合も行いません。台帳：research/p53-shiga-soil-shapefile-source-v1.json。検証：docs/p53-shiga-soil-gis-ja.md。</p></section>';
}
