/* NaFT P52 · Mie soil GIS. Preserve original code, GUN and soil classification nulls. */
'use strict';
var GX_MIE_SOURCE_HASH="d5664f056820a9957a7dadfca398d927f82e694532ad5965a8ad812337523ce1";
var GX_MIE_LANDUSE=[["田",669],["普通畑",509],["牧草地",36],["樹園地",412]];
var GX_MIE_CODE_NAME_PAIRS=[["21221","桑名市",3,0,0,3],["23235","木曽岬町",2,1,0,0],["24201","亀山市",2,2,0,3],["24201","松阪市",4,1,0,0],["24201","津市",40,41,3,37],["24201","鈴鹿市",3,0,0,2],["24202","いなべ市",1,1,0,0],["24202","四日市市",29,23,0,19],["24202","川越町",2,0,0,0],["24202","東員町",0,2,0,0],["24202","菰野町",7,0,0,3],["24202","鈴鹿市",5,5,0,5],["24203","伊勢市",28,20,0,13],["24203","明和町",3,2,0,0],["24203","玉城町",7,2,0,1],["24204","多気町",3,3,0,0],["24204","明和町",8,6,0,0],["24204","松阪市",43,46,3,35],["24205","朝日町",1,1,0,0],["24205","東員町",5,1,0,0],["24205","桑名市",20,21,0,15],["24207","亀山市",10,6,0,2],["24207","鈴鹿市",35,32,0,20],["24208","伊賀市",7,2,2,1],["24208","名張市",24,18,3,11],["24209","尾鷲市",5,6,0,4],["24210","亀山市",27,20,4,21],["24211","鳥羽市",15,12,0,2],["24212","御浜町",0,0,0,6],["24212","熊野市",23,14,0,12],["24214","いなべ市",25,23,2,15],["24214","東員町",5,1,0,0],["24214","菰野町",3,2,1,2],["24215","志摩市",19,17,2,9],["24216","伊賀市",35,35,8,20],["24303","木曽岬町",7,4,0,1],["24324","東員町",12,7,0,2],["24341","菰野町",17,12,0,10],["24343","川越町",2,0,0,0],["24343","朝日町",7,3,0,2],["24344","川越町",5,3,0,0],["24441","多気町",25,24,0,25],["24441","大台町",1,1,0,1],["24441","度会町",0,1,0,0],["24441","明和町",2,0,0,0],["24441","玉城町",4,0,0,1],["24442","明和町",19,13,0,4],["24442","玉城町",1,0,0,0],["24443","大台町",12,8,1,13],["24443","大紀町",2,0,0,1],["24461","玉城町",17,12,3,11],["24470","度会町",19,7,0,17],["24471","大紀町",15,13,2,12],["24472","南伊勢町",11,10,2,10],["24543","紀北町",15,8,0,6],["24561","御浜町",14,7,0,19],["24561","紀宝町",0,0,0,3],["24562","紀宝町",13,10,0,13]];
var GX_MIE_GUN=[["",1104],["三重郡",61],["北牟婁郡",29],["南牟婁郡",79],["員弁郡",21],["多気郡",159],["度会郡",161],["桑名郡",12]];
var GX_MIE_GUN_NAME_PAIRS=[["","いなべ市",26,24,2,15],["","亀山市",39,28,4,26],["","伊勢市",28,20,0,13],["","伊賀市",42,37,10,21],["","名張市",24,18,3,11],["","四日市市",29,23,0,19],["","多気町",3,3,0,0],["","尾鷲市",5,6,0,4],["","川越町",2,0,0,0],["","御浜町",0,0,0,6],["","志摩市",19,17,2,9],["","明和町",11,8,0,0],["","朝日町",1,1,0,0],["","木曽岬町",2,1,0,0],["","東員町",10,4,0,0],["","松阪市",47,47,3,35],["","桑名市",23,21,0,18],["","津市",40,41,3,37],["","熊野市",23,14,0,12],["","玉城町",7,2,0,1],["","菰野町",10,2,1,5],["","鈴鹿市",43,37,0,27],["","鳥羽市",15,12,0,2],["三重郡","川越町",7,3,0,0],["三重郡","朝日町",7,3,0,2],["三重郡","菰野町",17,12,0,10],["北牟婁郡","紀北町",15,8,0,6],["南牟婁郡","御浜町",14,7,0,19],["南牟婁郡","紀宝町",13,10,0,16],["員弁郡","東員町",12,7,0,2],["多気郡","多気町",25,24,0,25],["多気郡","大台町",13,9,1,14],["多気郡","大紀町",2,0,0,1],["多気郡","度会町",0,1,0,0],["多気郡","明和町",21,13,0,4],["多気郡","玉城町",5,0,0,1],["度会郡","南伊勢町",11,10,2,10],["度会郡","大紀町",15,13,2,12],["度会郡","度会町",19,7,0,17],["度会郡","玉城町",17,12,3,11],["桑名郡","木曽岬町",7,4,0,1]];
var GX_MIE_SOIL_NULL=[{"record_number_1based":413,"jcode":"24210","municipality_name":"亀山市","landuse":"田","missing_fields":["包括_統群","統群コード","亜群コード","群コード"]}];
function gxMieSoilValidate(){
 if(GX_MIE_LANDUSE.length!==4||GX_MIE_CODE_NAME_PAIRS.length!==58||GX_MIE_GUN_NAME_PAIRS.length!==41)throw Error('P52_MIE_PAIR_LENGTH');
 var cn=new Map(),nc=new Map(),seen=new Set(),totals=[0,0,0,0],foreign={'21':0,'23':0},foreignPairs=0;
 GX_MIE_CODE_NAME_PAIRS.forEach(function(r){
  if(r.length!==6||!/^(21|23|24)[0-9]{3}$/.test(r[0])||!r[1])throw Error('P52_MIE_CODE');
  var key=r[0]+'|'+r[1];if(seen.has(key))throw Error('P52_MIE_DUP_CODE');seen.add(key);
  if(!cn.has(r[0]))cn.set(r[0],new Set());cn.get(r[0]).add(r[1]);
  if(!nc.has(r[1]))nc.set(r[1],new Set());nc.get(r[1]).add(r[0]);
  var n=r.slice(2).reduce(function(a,v,i){if(!Number.isSafeInteger(v)||v<0)throw Error('P52_MIE_COUNT');totals[i]+=v;return a+v;},0);
  if(!r[0].startsWith('24')){foreign[r[0].slice(0,2)]+=n;foreignPairs++;}
 });
 if(cn.size!==31||nc.size!==29||foreign['21']!==6||foreign['23']!==3||foreignPairs!==2)throw Error('P52_MIE_JCODE_ANOMALY');
 if([...cn.values()].filter(function(s){return s.size>1;}).length!==14||[...nc.values()].filter(function(s){return s.size>1;}).length!==19)throw Error('P52_MIE_AMBIGUOUS_MAPPING');
 if(totals.reduce(function(a,b){return a+b;},0)!==1626||GX_MIE_LANDUSE.some(function(r,i){return r[1]!==totals[i];}))throw Error('P52_MIE_LANDUSE');
 var gun=Object.fromEntries(GX_MIE_GUN),gunSum={},gunSeen=new Set(),gunTotals=[0,0,0,0],named=new Map();
 GX_MIE_GUN_NAME_PAIRS.forEach(function(r){if(r[0]){if(!named.has(r[1]))named.set(r[1],new Set());named.get(r[1]).add(r[0]);}});
 var missing=0;
 GX_MIE_GUN_NAME_PAIRS.forEach(function(r){
  if(r.length!==6||!r[1])throw Error('P52_MIE_GUN_ROW');
  var key=r[0]+'|'+r[1];if(gunSeen.has(key))throw Error('P52_MIE_DUP_GUN');gunSeen.add(key);
  var count=r.slice(2).reduce(function(a,v,i){if(!Number.isSafeInteger(v)||v<0)throw Error('P52_MIE_GUN_COUNT');gunTotals[i]+=v;return a+v;},0);
  gunSum[r[0]]=(gunSum[r[0]]||0)+count;
  if(!r[0]&&named.has(r[1]))missing+=count;
 });
 if(Object.keys(gun).length!==8||gun['']!==1104||Object.values(gun).reduce(function(a,b){return a+b;},0)!==1626)throw Error('P52_MIE_GUN_TOTAL');
 if(GX_MIE_GUN.some(function(r){return gunSum[r[0]]!==r[1];})||gunTotals.some(function(v,i){return v!==totals[i];}))throw Error('P52_MIE_GUN_PARITY');
 if(missing!==80||named.size===0)throw Error('P52_MIE_GUN_BLANK');
 var multiple=[...named.entries()].filter(function(r){return r[1].size>1;}).map(function(r){return r[0];}).sort();
 if(JSON.stringify(multiple)!==JSON.stringify(['大紀町','度会町','玉城町'].sort()))throw Error('P52_MIE_MULTIPLE_GUNS');
 if(GX_MIE_SOIL_NULL.length!==1||GX_MIE_SOIL_NULL[0].record_number_1based!==413||GX_MIE_SOIL_NULL[0].jcode!=='24210'||GX_MIE_SOIL_NULL[0].municipality_name!=='亀山市'||GX_MIE_SOIL_NULL[0].landuse!=='田'||GX_MIE_SOIL_NULL[0].missing_fields.join('|')!=='包括_統群|統群コード|亜群コード|群コード')throw Error('P52_MIE_SOIL_NULL');
 return true;
}
function gxMieSoilPanel(prefCode){
 if(prefCode!=='24')return '';
 gxMieSoilValidate();
 var fmt=function(n){return Number(n).toLocaleString('ja-JP');};
 var cards=GX_MIE_LANDUSE.map(function(r){return '<article class="gx-data-card"><span class="gx-kicker">地目区分 / Polygon features</span><strong>'+fmt(r[1])+' <small>件</small></strong><p>'+gxEsc(r[0])+'（面積haではありません）</p></article>';}).join('');
 var cn=new Map(),nc=new Map(),named=new Map();
 GX_MIE_CODE_NAME_PAIRS.forEach(function(r){cn.set(r[0],(cn.get(r[0])||0)+1);nc.set(r[1],(nc.get(r[1])||0)+1);});
 GX_MIE_GUN_NAME_PAIRS.forEach(function(r){if(r[0]){if(!named.has(r[1]))named.set(r[1],new Set());named.get(r[1]).add(r[0]);}});
 var h='<thead><tr><th scope="col">市町村名（原本）</th><th scope="col">JCODE（原本）</th><th scope="col">田</th><th scope="col">普通畑</th><th scope="col">牧草地</th><th scope="col">樹園地</th><th scope="col">計</th><th scope="col">照合状態</th></tr></thead>';
 var codeRows=GX_MIE_CODE_NAME_PAIRS.map(function(r){
  var flag=[];if(!r[0].startsWith('24'))flag.push('県外JCODE '+r[0].slice(0,2));
  if(cn.get(r[0])>1||nc.get(r[1])>1)flag.push('コード・名称複数対応');
  if(r[0]==='24210'&&r[1]==='亀山市')flag.push('田1件の土壌分類4項目欠損');
  return '<tr><th scope="row">'+gxEsc(r[1])+'</th><td>'+gxEsc(r[0])+'</td>'+r.slice(2).map(function(n){return '<td>'+fmt(n)+'</td>';}).join('')+'<td>'+fmt(r.slice(2).reduce(function(a,b){return a+b;},0))+'</td><td>'+(flag.length?gxEsc(flag.join('／'))+'・要照合':'原本値')+'</td></tr>';
 }).join('');
 var gunRows=GX_MIE_GUN.filter(function(r){return !!r[0];}).map(function(r){return '<tr><th scope="row">'+gxEsc(r[0])+'</th><td>'+fmt(r[1])+'</td></tr>';}).join('');
 var details=GX_MIE_GUN_NAME_PAIRS.map(function(r){
  var flag=[];if(r[0]&&named.get(r[1])&&named.get(r[1]).size>1)flag.push('同一名称に複数郡名');
  if(!r[0]&&named.has(r[1]))flag.push('同名に郡名付き記録／原本GUN空欄');
  return '<tr><th scope="row">'+gxEsc(r[1])+'</th><td>'+gxEsc(r[0]||'（空欄）')+'</td>'+r.slice(2).map(function(n){return '<td>'+fmt(n)+'</td>';}).join('')+'<td>'+(flag.length?gxEsc(flag.join('／'))+'・要照合':'原本値')+'</td></tr>';
 }).join('');
 return '<section class="gx-dashboard" aria-labelledby="gx-mie-soil-title">'+
  '<div class="gx-section-heading"><span class="gx-kicker">MIE SOIL GIS · P52 · SOURCE AUDITED / CODE, GUN, SOIL NULL PENDING</span>'+
  '<h2 id="gx-mie-soil-title">三重県の農耕地土壌GISを確認する。</h2>'+
  '<p>原本JGD2000の土壌ポリゴン1,626件。田669件、普通畑509件、牧草地36件、樹園地412件。市町村名29種類、JCODE31種類、組合せ58通り。土壌群18種類・詳細分類99種類（空欄含む）。原本XML作成日は2017年1月17日。</p></div>'+
  '<p class="gx-anomaly"><b>県外コード・郡名・土壌分類を要照合：</b>三重県「24」以外のJCODEが計9件（岐阜県21系「21221／桑名市」6件、愛知県23系「23235／木曽岬町」3件）。14コードが複数名称に、19名称が複数コードに対応。原本GUNは大紀町・度会町・玉城町に「多気郡」「度会郡」の複数対応があり、同名にGUN付きレコードのある郡名空欄80件もあります。さらに原本413番目の「亀山市／田／24210」は土壌分類4項目が空欄です。原本を自動補正せず、自治体・郡別統計へのJOINと欠損土壌分類の推定を保留します。</p>'+
  '<div class="gx-detail-grid">'+cards+'</div>'+
  '<details><summary>原本GUN（郡名）別件数を確認する</summary><div class="scroll"><table><thead><tr><th scope="col">郡名（原本）</th><th scope="col">ポリゴン件数</th></tr></thead><tbody>'+gunRows+'</tbody></table></div><p>原本GUN空欄1,104件、郡名記載522件。郡名の値は原本属性の集計であり、現行行政界と照合済みの郡別農地面積ではありません。</p></details>'+
  '<details><summary>原本GUN×市町村名41組合せを見る（要照合）</summary><div class="scroll"><table><thead><tr><th scope="col">市町村名</th><th scope="col">GUN原本</th><th scope="col">田</th><th scope="col">普通畑</th><th scope="col">牧草地</th><th scope="col">樹園地</th><th scope="col">照合状態</th></tr></thead><tbody>'+details+'</tbody></table></div></details>'+
  '<details><summary>原本JCODE×市町村名58組合せを見る（要照合）</summary><div class="scroll"><table>'+h+'<tbody>'+codeRows+'</tbody></table></div></details>'+
  '<p class="gx-advisory"><b>出典候補と科学的制約：</b>農研機構「日本土壌インベントリー」は配布元候補ですが、公式三重県ZIPとのSHA一致と再配布権利は未照合。生Shapefile・DBF・ZIPはGitHubに複製せず、原本のハッシュ・派生件数・監査コードのみ掲載。ポリゴン件数は農地面積ha、筆数、CH₄実測値、土壌炭素量、CO₂e削減量、J-クレジット認証量ではありません。外部行政統計やJAXA土地被覆との無検証のJOINも保留します。研究台帳：research/p52-mie-soil-shapefile-source-v1.json。検証：docs/p52-mie-soil-gis-ja.md。</p></section>';
}
