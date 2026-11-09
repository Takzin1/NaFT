/* NaFT P47 · Yamanashi soil GIS. Original JCODE and GUN attributes remain unmodified. */
'use strict';
var GX_YAMANASHI_SOURCE_HASH="78df028c3de6bd2e4544cd12f6f7aca98aa5a9af7de60b1bd574a4fa1c5f1842";
var GX_YAMANASHI_LANDUSE=[["田",163],["普通畑",193],["牧草地",18],["樹園地",190]];
var GX_YAMANASHI_CODE_NAME_PAIRS=[["14151","上野原市",0,1,0,0],["19201","中央市",2,3,0,3],["19201","昭和町",1,0,0,0],["19201","甲府市",8,12,1,14],["19201","甲斐市",2,0,0,0],["19201","笛吹市",3,4,0,6],["19202","富士吉田市",4,5,0,1],["19202","富士河口湖町",0,1,0,0],["19202","忍野村",0,1,0,0],["19202","西桂町",1,0,0,0],["19204","大月市",1,0,0,0],["19204","西桂町",1,0,0,0],["19204","都留市",4,3,0,3],["19205","山梨市",2,8,1,10],["19205","甲州市",0,1,0,7],["19205","笛吹市",0,0,0,5],["19206","上野原市",0,1,0,0],["19206","大月市",3,7,0,2],["19207","北杜市",2,1,0,1],["19207","南アルプス市",0,0,0,2],["19207","甲斐市",2,0,0,2],["19207","韮崎市",10,10,1,12],["19208","中央市",0,1,0,1],["19208","南アルプス市",14,12,1,17],["19208","富士川町",2,0,0,2],["19209","北杜市",13,12,3,10],["19210","昭和町",3,2,0,0],["19210","甲斐市",7,9,1,6],["19211","甲州市",0,0,0,2],["19211","笛吹市",7,12,0,16],["19212","上野原市",5,7,0,7],["19213","甲州市",2,3,0,10],["19214","中央市",8,9,1,9],["19214","市川三郷町",1,2,0,1],["19214","昭和町",2,1,0,0],["19346","富士川町",0,1,0,0],["19346","市川三郷町",9,8,2,5],["19346","身延町",1,1,0,1],["19364","早川町",1,3,0,3],["19365","南部町",2,0,0,0],["19365","身延町",7,10,1,7],["19366","南部町",4,7,0,7],["19368","富士川町",7,7,2,7],["19384","昭和町",6,3,0,5],["19422","道志村",1,2,0,1],["19423","西桂町",2,2,0,0],["19424","山中湖村",1,0,0,0],["19424","忍野村",3,4,0,0],["19425","山中湖村",3,3,0,0],["19429","富士河口湖町",0,1,0,0],["19429","鳴沢村",0,3,2,0],["19430","富士河口湖町",3,6,2,2],["19442","小菅村",1,2,0,1],["19443","丹波山村",2,2,0,2]];
var GX_YAMANASHI_GUN=[["",396],["中巨摩郡",14],["北都留郡",10],["南巨摩郡",75],["南都留郡",41],["西八代郡",28]];
var GX_YAMANASHI_GUN_NAME_PAIRS=[["","上野原市",5,9,0,7],["","中央市",10,13,1,13],["","北杜市",15,13,3,11],["","南アルプス市",14,12,1,19],["","大月市",4,7,0,2],["","富士吉田市",4,5,0,1],["","富士川町",2,0,0,2],["","富士河口湖町",0,1,0,0],["","山梨市",2,8,1,10],["","市川三郷町",1,2,0,1],["","忍野村",0,1,0,0],["","昭和町",6,3,0,0],["","甲州市",2,4,0,19],["","甲府市",8,12,1,14],["","甲斐市",11,9,1,8],["","笛吹市",10,16,0,27],["","西桂町",2,0,0,0],["","都留市",4,3,0,3],["","韮崎市",10,10,1,12],["中巨摩郡","昭和町",6,3,0,5],["北都留郡","丹波山村",2,2,0,2],["北都留郡","小菅村",1,2,0,1],["南巨摩郡","南部町",6,7,0,7],["南巨摩郡","富士川町",7,7,2,7],["南巨摩郡","早川町",1,3,0,3],["南巨摩郡","身延町",7,10,1,7],["南都留郡","富士河口湖町",3,7,2,2],["南都留郡","山中湖村",4,3,0,0],["南都留郡","忍野村",3,4,0,0],["南都留郡","西桂町",2,2,0,0],["南都留郡","道志村",1,2,0,1],["南都留郡","鳴沢村",0,3,2,0],["西八代郡","富士川町",0,1,0,0],["西八代郡","市川三郷町",9,8,2,5],["西八代郡","身延町",1,1,0,1]];
function gxYamanashiSoilValidate(){
 if(GX_YAMANASHI_CODE_NAME_PAIRS.length!==54||GX_YAMANASHI_GUN_NAME_PAIRS.length!==35||GX_YAMANASHI_LANDUSE.length!==4)throw Error('P47_YAMANASHI_PAIR_LENGTH');
 var codeNames=new Map(),nameCodes=new Map(),seen=new Set(),total=[0,0,0,0],foreign=0,foreignPairs=0;
 GX_YAMANASHI_CODE_NAME_PAIRS.forEach(function(r){
  if(r.length!==6||!/^(14|19)[0-9]{3}$/.test(r[0])||!r[1])throw Error('P47_YAMANASHI_CODE_FORMAT');
  var key=r[0]+'|'+r[1];if(seen.has(key))throw Error('P47_YAMANASHI_DUPLICATE_PAIR');seen.add(key);
  if(!codeNames.has(r[0]))codeNames.set(r[0],new Set());codeNames.get(r[0]).add(r[1]);
  if(!nameCodes.has(r[1]))nameCodes.set(r[1],new Set());nameCodes.get(r[1]).add(r[0]);
  var count=r.slice(2).reduce(function(sum,v,i){if(!Number.isSafeInteger(v)||v<0)throw Error('P47_YAMANASHI_NON_INTEGER_COUNT');total[i]+=v;return sum+v;},0);
  if(r[0].startsWith('14')){foreign+=count;foreignPairs++;}
 });
 if(codeNames.size!==28||nameCodes.size!==27||foreign!==1||foreignPairs!==1)throw Error('P47_YAMANASHI_FOREIGN_CODE_ANOMALY');
 if([...codeNames.values()].filter(function(s){return s.size>1;}).length!==14||[...nameCodes.values()].filter(function(s){return s.size>1;}).length!==17)throw Error('P47_YAMANASHI_MULTI_CODE_NAME');
 if(total.reduce(function(a,b){return a+b;},0)!==564)throw Error('P47_YAMANASHI_TOTAL');
 GX_YAMANASHI_LANDUSE.forEach(function(r,i){if(total[i]!==r[1])throw Error('P47_YAMANASHI_LANDUSE_PARITY');});
 var gunCounts=Object.fromEntries(GX_YAMANASHI_GUN),gunTotals=[0,0,0,0],gunPairCounts={},nonempty=new Map(),missing={},multipleGun=new Map(),seenGun=new Set();
 GX_YAMANASHI_GUN_NAME_PAIRS.forEach(function(r){
  if(r.length!==6||typeof r[0]!=='string'||!r[1])throw Error('P47_YAMANASHI_GUN_FORMAT');
  var key=r[0]+'|'+r[1];if(seenGun.has(key))throw Error('P47_YAMANASHI_GUN_DUPLICATE');seenGun.add(key);
  var count=r.slice(2).reduce(function(sum,v,i){if(!Number.isSafeInteger(v)||v<0)throw Error('P47_YAMANASHI_GUN_NEGATIVE');gunTotals[i]+=v;return sum+v;},0);
  gunPairCounts[r[0]]=(gunPairCounts[r[0]]||0)+count;
  if(r[0]){if(!nonempty.has(r[1]))nonempty.set(r[1],new Set());nonempty.get(r[1]).add(r[0]);}
 });
 if(GX_YAMANASHI_GUN.length!==6||gunCounts['']!==396||Object.values(gunCounts).reduce(function(a,b){return a+b;},0)!==564)throw Error('P47_YAMANASHI_GUN_TOTALS');
 GX_YAMANASHI_GUN.forEach(function(r){if(gunPairCounts[r[0]]!==r[1])throw Error('P47_YAMANASHI_GUN_PARITY');});
 if(gunTotals.some(function(n,i){return n!==GX_YAMANASHI_LANDUSE[i][1];}))throw Error('P47_YAMANASHI_GUN_LANDUSE');
 GX_YAMANASHI_GUN_NAME_PAIRS.forEach(function(r){if(!r[0]&&nonempty.has(r[1]))missing[r[1]]=r.slice(2).reduce(function(a,b){return a+b;},0);});
 var missingExpected={'富士川町':4,'富士河口湖町':1,'市川三郷町':4,'忍野村':1,'昭和町':9,'西桂町':2};
 if(Object.keys(missing).length!==6||Object.keys(missingExpected).some(function(name){return missing[name]!==missingExpected[name];}))throw Error('P47_YAMANASHI_MISSING_GUN');
 if([...nonempty.values()].filter(function(s){return s.size>1;}).length!==2)throw Error('P47_YAMANASHI_MULTI_GUN');
 var irregular=GX_YAMANASHI_GUN_NAME_PAIRS.filter(function(r){return r[0]==='西八代郡'&&(r[1]==='富士川町'||r[1]==='身延町');});
 if(irregular.length!==2||JSON.stringify(irregular.map(function(r){return r.slice(2);}))!==JSON.stringify([[0,1,0,0],[1,1,0,1]]))throw Error('P47_YAMANASHI_HISTORICAL_GUN');
 return true;
}
function gxYamanashiSoilPanel(prefCode){
 if(prefCode!=='19')return '';
 gxYamanashiSoilValidate();
 var fmt=function(n){return Number(n).toLocaleString('ja-JP');};
 var cards=GX_YAMANASHI_LANDUSE.map(function(r){return '<article class="gx-data-card"><span class="gx-kicker">地目区分 / Polygon features</span><strong>'+fmt(r[1])+' <small>件</small></strong><p>'+gxEsc(r[0])+'（面積haではありません）</p></article>';}).join('');
 var codeCounts=new Map(),nameCounts=new Map(),gunNames=new Map();
 GX_YAMANASHI_CODE_NAME_PAIRS.forEach(function(r){codeCounts.set(r[0],(codeCounts.get(r[0])||0)+1);nameCounts.set(r[1],(nameCounts.get(r[1])||0)+1);});
 GX_YAMANASHI_GUN_NAME_PAIRS.forEach(function(r){if(r[0]){if(!gunNames.has(r[1]))gunNames.set(r[1],new Set());gunNames.get(r[1]).add(r[0]);}});
 var codeBody=GX_YAMANASHI_CODE_NAME_PAIRS.map(function(r){
  var flags=[];
  if(!r[0].startsWith('19'))flags.push('県外・神奈川県系14');
  if(codeCounts.get(r[0])>1||nameCounts.get(r[1])>1)flags.push('JCODEと名称の複数対応');
  return '<tr><th scope="row">'+gxEsc(r[1])+'</th><td>'+gxEsc(r[0])+'</td>'+r.slice(2).map(function(n){return '<td>'+fmt(n)+'</td>';}).join('')+'<td>'+fmt(r.slice(2).reduce(function(a,b){return a+b;},0))+'</td><td>'+(flags.length?gxEsc(flags.join('／'))+'・要照合':'原本値')+'</td></tr>';
 }).join('');
 var gunBody=GX_YAMANASHI_GUN.filter(function(r){return r[0]!=='';}).map(function(r){return '<tr><th scope="row">'+gxEsc(r[0])+'</th><td>'+fmt(r[1])+'</td><td>'+(r[0]==='西八代郡'?'富士川町・身延町を要照合':'原本値')+'</td></tr>';}).join('');
 var gunDetail=GX_YAMANASHI_GUN_NAME_PAIRS.map(function(r){
  var flags=[];
  if(!r[0]&&gunNames.has(r[1]))flags.push('原本GUN空欄・郡名付き記録も存在');
  if(gunNames.has(r[1])&&gunNames.get(r[1]).size>1)flags.push('複数郡名対応');
  if(r[0]==='西八代郡'&&(r[1]==='富士川町'||r[1]==='身延町'))flags.push('旧境界・原本年代要照合');
  return '<tr><th scope="row">'+gxEsc(r[1])+'</th><td>'+gxEsc(r[0]||'（空欄）')+'</td>'+r.slice(2).map(function(n){return '<td>'+fmt(n)+'</td>';}).join('')+'<td>'+(flags.length?gxEsc(flags.join('／'))+'・要照合':'原本値')+'</td></tr>';
 }).join('');
 var landHeader='<thead><tr><th scope="col">市町村名（原本）</th><th scope="col">JCODE（原本）</th><th scope="col">田</th><th scope="col">普通畑</th><th scope="col">牧草地</th><th scope="col">樹園地</th><th scope="col">合計</th><th scope="col">照合</th></tr></thead>';
 return '<section class="gx-dashboard" aria-labelledby="gx-yamanashi-soil-title">'+
 '<div class="gx-section-heading"><span class="gx-kicker">YAMANASHI SOIL GIS · P47 · SOURCE AUDITED / CODES & GUN PENDING</span>'+
 '<h2 id="gx-yamanashi-soil-title">山梨県の農耕地土壌GISを確認する。</h2>'+
 '<p>原本JGD2000の土壌ポリゴン564件。田163件、普通畑193件、牧草地18件、樹園地190件。市町村名27種類、JCODE28種類、JCODE×名称54組合せ。土壌群13種類・詳細分類51種類。XMLメタデータ作成日2017年1月17日。</p></div>'+
 '<p class="gx-anomaly"><b>コード・郡名の照合が必要：</b>神奈川県「14」系のJCODE「14151／上野原市」が普通畑1ポリゴンあります。14コードが複数名称に、17名称が複数コードに対応。郡名は富士川町・身延町で「南巨摩郡」と「西八代郡」が並存。郡名付き記録のある市町村でも21ポリゴンは原本GUN空欄です。これらを勝手に修正せず、現行自治体統計とのJCODE/GUNによる自動JOINを保留します。</p>'+
 '<div class="gx-detail-grid">'+cards+'</div>'+
 '<details><summary>原本GUN（郡名）別件数を見る</summary><div class="scroll"><table><thead><tr><th>原本の郡名</th><th>ポリゴン件数</th><th>照合</th></tr></thead><tbody>'+gunBody+'</tbody></table></div><p>GUN空欄396件、郡名付き168件。西八代郡28件のうち富士川町1件・身延町3件は現行郡境界との照合が必要です。</p></details>'+
 '<details><summary>GUN×市町村名35組合せを見る</summary><div class="scroll"><table><thead><tr><th>市町村名</th><th>GUN（原本）</th><th>田</th><th>普通畑</th><th>牧草地</th><th>樹園地</th><th>照合</th></tr></thead><tbody>'+gunDetail+'</tbody></table></div></details>'+
 '<details><summary>JCODE×市町村名54組合せを見る（要照合）</summary><div class="scroll"><table>'+landHeader+'<tbody>'+codeBody+'</tbody></table></div></details>'+
 '<p class="gx-advisory"><b>来歴と科学的制限：</b>農研機構「日本土壌インベントリー」は出典候補ですが、公式山梨県ZIPとのバイトSHA一致・再配布権利の適用は未確認。生Shapefile・DBF・ZIPは公開GitHubへ複製せず、ハッシュと派生集計のみ登録。ポリゴン数は農地面積ha、筆数、土壌炭素量、CH₄実測値、CO₂e削減量・認証済みクレジット量を意味しません。現行行政コードや2024年水稲統計・土地被覆との未照合な自動結合は行いません。原本監査台帳：research/p47-yamanashi-soil-shapefile-source-v1.json。監査：docs/p47-yamanashi-soil-gis-ja.md。</p></section>';
}
