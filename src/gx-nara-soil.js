/* NaFT P57 Nara soil GIS: original JCODE, GUN and municipality name attributes, no automatic normalization. */
'use strict';
var GX_NARA_SOURCE_HASH="6a1787c976149b29fead495730d749b0ce072e1e5d9922f4d25786aba3d61d16";
var GX_NARA_LANDUSE=[["田",401],["普通畑",265],["牧草地",9],["樹園地",180]];
var GX_NARA_JCODE_PAIRS=[["24201","御杖村",1,0,0,2],["24208","宇陀市",0,1,0,0],["24208","山添村",1,0,0,1],["24216","奈良市",1,2,0,0],["26214","奈良市",3,0,0,1],["26364","奈良市",1,0,0,1],["26366","奈良市",1,0,0,0],["26366","生駒市",1,0,0,0],["26367","奈良市",4,0,0,4],["27210","生駒市",1,0,0,0],["27222","香芝市",0,0,0,1],["27227","生駒市",1,0,0,0],["27229","生駒市",2,1,0,0],["27230","生駒市",2,0,0,0],["29201","大和郡山市",6,1,0,0],["29201","天理市",5,2,0,3],["29201","奈良市",15,14,0,18],["29201","宇陀市",2,0,0,2],["29201","山添村",5,1,0,6],["29201","生駒市",1,1,0,0],["29202","大和高田市",8,6,0,0],["29202","広陵町",2,0,0,0],["29202","御所市",1,0,0,0],["29202","橿原市",4,0,0,0],["29202","葛城市",5,3,0,0],["29202","香芝市",1,0,0,0],["29203","大和郡山市",11,6,0,4],["29203","天理市",4,3,0,0],["29203","安堵町",3,0,0,0],["29203","川西町",1,0,0,0],["29203","斑鳩町",1,1,0,0],["29204","天理市",14,7,0,9],["29204","川西町",1,1,0,0],["29204","桜井市",4,1,0,2],["29204","田原本町",4,3,0,0],["29205","広陵町",2,0,0,3],["29205","御所市",2,0,0,0],["29205","明日香村",5,3,0,2],["29205","桜井市",4,2,0,0],["29205","橿原市",10,11,0,7],["29205","田原本町",5,0,0,0],["29205","高取町",3,1,0,0],["29206","宇陀市",1,0,0,0],["29206","明日香村",1,2,0,0],["29206","桜井市",11,10,0,4],["29206","田原本町",1,0,0,0],["29207","下市町",1,0,0,3],["29207","五條市",12,8,0,12],["29207","大淀町",0,0,0,1],["29207","御所市",3,1,0,2],["29208","大淀町",1,0,0,1],["29208","御所市",8,8,2,6],["29208","葛城市",4,0,0,0],["29208","高取町",4,0,0,0],["29209","生駒市",8,4,0,1],["29210","上牧町",2,0,0,0],["29210","広陵町",1,0,0,0],["29210","王寺町",1,0,0,0],["29210","葛城市",3,0,0,0],["29210","香芝市",7,5,0,1],["29211","葛城市",7,4,0,3],["29212","宇陀市",11,13,1,10],["29212","山添村",1,0,0,0],["29212","東吉野村",1,0,0,0],["29322","山添村",9,4,0,8],["29342","三郷町",1,0,0,1],["29342","平群町",5,4,0,2],["29342","斑鳩町",1,0,0,0],["29343","三郷町",2,3,0,0],["29344","安堵町",5,1,0,0],["29344","斑鳩町",7,4,0,5],["29344","河合町",1,0,0,1],["29345","安堵町",5,3,0,0],["29361","三宅町",1,2,0,0],["29361","川西町",5,5,0,0],["29361","河合町",1,0,0,0],["29362","三宅町",8,5,0,0],["29362","広陵町",2,1,0,0],["29362","河合町",0,1,0,0],["29362","田原本町",3,1,0,0],["29363","広陵町",2,0,0,1],["29363","田原本町",8,7,0,2],["29385","御杖村",0,0,1,0],["29385","曽爾村",5,5,1,0],["29386","御杖村",4,4,2,0],["29401","明日香村",4,2,0,1],["29401","高取町",7,7,0,2],["29402","明日香村",7,6,0,6],["29424","上牧町",4,2,0,2],["29424","河合町",1,1,0,0],["29424","王寺町",0,1,0,0],["29425","河合町",1,0,0,0],["29425","王寺町",4,2,0,0],["29426","広陵町",7,4,0,1],["29426","河合町",2,0,0,0],["29427","河合町",8,4,0,5],["29441","吉野町",7,8,0,7],["29441","大淀町",0,2,0,1],["29442","大淀町",7,6,0,4],["29443","下市町",8,10,0,8],["29443","黒滝村",0,0,0,1],["29444","黒滝村",6,4,0,2],["29446","天川村",3,6,0,2],["29447","野迫川村",2,4,1,0],["29449","十津川村",7,8,1,2],["29450","下北山村",1,2,0,2],["29451","上北山村",0,2,0,0],["29452","川上村",0,4,0,3],["29453","東吉野村",3,4,0,1]];
var GX_NARA_GUN_COUNTS=[["",464],["北葛城郡",49],["吉野郡",139],["宇陀郡",22],["山辺郡",21],["生駒郡",51],["相楽郡",12],["磯城郡",55],["高市郡",42]];
var GX_NARA_GUN_PAIRS=[["","上牧町",2,0,0,0],["","下市町",1,0,0,3],["","五條市",12,8,0,12],["","大和郡山市",17,7,0,4],["","大和高田市",8,6,0,0],["","大淀町",1,0,0,2],["","天理市",23,12,0,12],["","奈良市",19,16,0,19],["","宇陀市",14,14,1,12],["","安堵町",3,0,0,0],["","山添村",7,1,0,7],["","川西町",2,1,0,0],["","広陵町",5,0,0,3],["","御所市",14,9,2,8],["","御杖村",1,0,0,2],["","斑鳩町",1,1,0,0],["","明日香村",6,5,0,2],["","東吉野村",1,0,0,0],["","桜井市",19,13,0,6],["","橿原市",14,11,0,7],["","王寺町",1,0,0,0],["","生駒市",15,6,0,1],["","田原本町",10,3,0,0],["","葛城市",19,7,0,3],["","香芝市",8,5,0,2],["","高取町",7,1,0,0],["北葛城郡","上牧町",4,2,0,2],["北葛城郡","広陵町",7,4,0,1],["北葛城郡","河合町",12,5,0,5],["北葛城郡","王寺町",4,3,0,0],["吉野郡","上北山村",0,2,0,0],["吉野郡","下北山村",1,2,0,2],["吉野郡","下市町",8,10,0,8],["吉野郡","十津川村",7,8,1,2],["吉野郡","吉野町",7,8,0,7],["吉野郡","大淀町",7,8,0,5],["吉野郡","天川村",3,6,0,2],["吉野郡","川上村",0,4,0,3],["吉野郡","東吉野村",3,4,0,1],["吉野郡","野迫川村",2,4,1,0],["吉野郡","黒滝村",6,4,0,3],["宇陀郡","御杖村",4,4,3,0],["宇陀郡","曽爾村",5,5,1,0],["山辺郡","山添村",9,4,0,8],["生駒郡","三郷町",3,3,0,1],["生駒郡","安堵町",10,4,0,0],["生駒郡","平群町",5,4,0,2],["生駒郡","斑鳩町",8,4,0,5],["生駒郡","河合町",1,0,0,1],["相楽郡","奈良市",6,0,0,5],["相楽郡","生駒市",1,0,0,0],["磯城郡","三宅町",9,7,0,0],["磯城郡","川西町",5,5,0,0],["磯城郡","広陵町",4,1,0,1],["磯城郡","河合町",1,1,0,0],["磯城郡","田原本町",11,8,0,2],["高市郡","明日香村",11,8,0,7],["高市郡","高取町",7,7,0,2]];
function gxNaraSoilValidate(){
 var landTotals=[0,0,0,0],foreign={'24':0,'26':0,'27':0},codeNames=new Map(),nameCodes=new Map(),seen=new Set();
 if(GX_NARA_LANDUSE.length!==4||GX_NARA_JCODE_PAIRS.length!==109||GX_NARA_GUN_PAIRS.length!==58)throw Error('P57_NARA_PAIR_LENGTH');
 GX_NARA_JCODE_PAIRS.forEach(function(r){
  if(r.length!==6||!/^(24|26|27|29)[0-9]{3}$/.test(r[0])||!r[1])throw Error('P57_NARA_JCODE');
  var key=r[0]+'|'+r[1];if(seen.has(key))throw Error('P57_NARA_DUP_JCODE');seen.add(key);
  if(!codeNames.has(r[0]))codeNames.set(r[0],new Set());codeNames.get(r[0]).add(r[1]);
  if(!nameCodes.has(r[1]))nameCodes.set(r[1],new Set());nameCodes.get(r[1]).add(r[0]);
  var n=r.slice(2).reduce(function(acc,v,i){if(!Number.isSafeInteger(v)||v<0)throw Error('P57_NARA_COUNT');landTotals[i]+=v;return acc+v;},0);
  if(!r[0].startsWith('29'))foreign[r[0].slice(0,2)]+=n;
 });
 if(codeNames.size!==51||nameCodes.size!==39||Object.keys(foreign).some(function(k){return foreign[k]!==({'24':9,'26':16,'27':8})[k];}))throw Error('P57_NARA_CODE_ANOMALY');
 if([...codeNames.values()].filter(function(v){return v.size>1;}).length!==24||[...nameCodes.values()].filter(function(v){return v.size>1;}).length!==28)throw Error('P57_NARA_AMBIGUOUS_CODES');
 if(GX_NARA_LANDUSE.some(function(r,i){return r[1]!==landTotals[i];})||landTotals.reduce(function(a,b){return a+b;},0)!==855)throw Error('P57_NARA_LANDUSE_PARITY');
 var gunTotals={},gunLand=[0,0,0,0],knownNames=new Set(GX_NARA_GUN_PAIRS.filter(function(r){return !!r[0];}).map(function(r){return r[1];})),gunNames=new Map(),gunKeys=new Set(),missing=0,missingTowns=0;
 GX_NARA_GUN_PAIRS.forEach(function(r){
  if(r.length!==6||!r[1])throw Error('P57_NARA_GUN_NAME');
  var key=r[0]+'|'+r[1];if(gunKeys.has(key))throw Error('P57_NARA_GUN_DUP');gunKeys.add(key);
  var n=r.slice(2).reduce(function(acc,v,i){if(!Number.isSafeInteger(v)||v<0)throw Error('P57_NARA_GUN_COUNT');gunLand[i]+=v;return acc+v;},0);
  gunTotals[r[0]]=(gunTotals[r[0]]||0)+n;
  if(!r[0]&&knownNames.has(r[1])){missing+=n;if(/[町村]$/.test(r[1]))missingTowns+=n;}
  if(r[0]){if(!gunNames.has(r[1]))gunNames.set(r[1],new Set());gunNames.get(r[1]).add(r[0]);}
 });
 if(Object.keys(gunTotals).length!==9||gunTotals['']!==464||gunTotals['相楽郡']!==12||missing!==155||missingTowns!==79||gunLand.some(function(v,i){return v!==landTotals[i];}))throw Error('P57_NARA_GUN_TOTAL');
 if(GX_NARA_GUN_COUNTS.some(function(r){return r[1]!==gunTotals[r[0]];}))throw Error('P57_NARA_GUN_MARGINS');
 if(JSON.stringify([...gunNames.get('河合町')].sort())!==JSON.stringify(['北葛城郡','生駒郡','磯城郡'])||JSON.stringify([...gunNames.get('広陵町')].sort())!==JSON.stringify(['北葛城郡','磯城郡']))throw Error('P57_NARA_MULTIGUN');
 if(GX_NARA_GUN_PAIRS.filter(function(r){return r[0]==='相楽郡';}).length!==2||!GX_NARA_GUN_PAIRS.some(function(r){return r[0]==='相楽郡'&&r[1]==='奈良市'&&JSON.stringify(r.slice(2))==='[6,0,0,5]';}))throw Error('P57_NARA_FOREIGN_GUN');
 return true;
}
function gxNaraSoilPanel(prefCode){
 if(prefCode!=='29')return '';
 gxNaraSoilValidate();
 var fmt=function(v){return Number(v).toLocaleString('ja-JP');};
 var cards=GX_NARA_LANDUSE.map(function(r){return '<article class="gx-data-card"><span class="gx-kicker">地目区分 / Polygon features</span><strong>'+fmt(r[1])+' <small>件</small></strong><p>'+gxEsc(r[0])+'（面積haではありません）</p></article>';}).join('');
 var codes=new Map(),names=new Map();
 GX_NARA_JCODE_PAIRS.forEach(function(r){codes.set(r[0],(codes.get(r[0])||0)+1);names.set(r[1],(names.get(r[1])||0)+1);});
 var cpRows=GX_NARA_JCODE_PAIRS.map(function(r){
  var flags=[];if(!r[0].startsWith('29'))flags.push('県外JCODE '+r[0].slice(0,2));
  if(codes.get(r[0])>1||names.get(r[1])>1)flags.push('コード・名称の複数対応');
  return '<tr><th scope="row">'+gxEsc(r[1])+'</th><td>'+gxEsc(r[0])+'</td>'+r.slice(2).map(function(v){return '<td>'+fmt(v)+'</td>';}).join('')+'<td>'+fmt(r.slice(2).reduce(function(a,b){return a+b;},0))+'</td><td>'+(flags.length?gxEsc(flags.join('／'))+'・要照合':'原本値')+'</td></tr>';
 }).join('');
 var known=new Set(GX_NARA_GUN_PAIRS.filter(function(r){return !!r[0];}).map(function(r){return r[1];}));
 var multi=new Set(['広陵町','河合町']);
 var gpRows=GX_NARA_GUN_PAIRS.map(function(r){
  var flags=[];if(r[0]==='相楽郡')flags.push('京都府系の郡名');
  if(!r[0]&&known.has(r[1]))flags.push('同一名称に郡名付き記録あり・原本GUN空欄');
  if(multi.has(r[1]))flags.push('郡名複数対応');
  return '<tr><th scope="row">'+gxEsc(r[1])+'</th><td>'+gxEsc(r[0]||'（空欄）')+'</td>'+r.slice(2).map(function(v){return '<td>'+fmt(v)+'</td>';}).join('')+'<td>'+(flags.length?gxEsc(flags.join('／'))+'・要照合':'原本値')+'</td></tr>';
 }).join('');
 var gr=GX_NARA_GUN_COUNTS.filter(function(r){return !!r[0];}).map(function(r){return '<tr><th scope="row">'+gxEsc(r[0])+'</th><td>'+fmt(r[1])+'</td><td>'+(r[0]==='相楽郡'?'県外（京都府）の郡名・要照合':'原本値')+'</td></tr>';}).join('');
 var cpHead='<thead><tr><th>市町村名（原本）</th><th>JCODE（原本）</th><th>田</th><th>普通畑</th><th>牧草地</th><th>樹園地</th><th>計</th><th>照合状態</th></tr></thead>';
 return '<section class="gx-dashboard" aria-labelledby="gx-nara-soil-title">'+
  '<div class="gx-section-heading"><span class="gx-kicker">NARA SOIL GIS · P57 · ORIGINAL ATTRIBUTES AUDITED / MUNICIPALITY JOIN PENDING</span>'+
  '<h2 id="gx-nara-soil-title">奈良県の農耕地土壌GISを確認する。</h2>'+
  '<p>原本JGD2000のポリゴン855件。地目は田401件、普通畑265件、牧草地9件、樹園地180件。市町村名39種類、JCODE51種類、コード×名称109組合せ。土壌群12種類・詳細分類42種類、分類空欄0件。原本XMLのメタデータ作成日2017年1月17日。</p></div>'+
  '<p class="gx-anomaly"><b>県外JCODE・県外郡名・多重郡名は要照合：</b>奈良県「29」以外のJCODEが33件（京都府26系16・三重県24系9・大阪府27系8）。24コードが複数名称、28名称が複数JCODEに対応します。GUNには京都府の「相楽郡」が12件（奈良市11・生駒市1）。河合町の3郡、広陵町の2郡も原本の複数対応です。郡名付き記録もある名称に対するGUN空欄は155件（町村79・市76）あります。原本属性を修正せず、現在の自治体・郡別正式統計への自動JOINは保留します。</p>'+
  '<div class="gx-detail-grid">'+cards+'</div>'+
  '<details><summary>原本GUN（郡名）別件数を見る</summary><div class="scroll"><table><thead><tr><th>GUN原本</th><th>件数</th><th>要照合</th></tr></thead><tbody>'+gr+'</tbody></table></div><p>GUN空欄464件、記載391件。郡名の件数を農地面積や現行自治体統計と混同しないでください。</p></details>'+
  '<details><summary>GUN×市町村名58組合せを見る（要照合）</summary><div class="scroll"><table><thead><tr><th>市町村名</th><th>GUN（原本）</th><th>田</th><th>普通畑</th><th>牧草地</th><th>樹園地</th><th>照合状態</th></tr></thead><tbody>'+gpRows+'</tbody></table></div></details>'+
  '<details><summary>JCODE×市町村名109組合せを見る（要照合）</summary><div class="scroll"><table>'+cpHead+'<tbody>'+cpRows+'</tbody></table></div></details>'+
  '<p class="gx-advisory"><b>来歴と科学上の制約：</b>農研機構の日本土壌インベントリーは配布元候補だが、公式奈良県ZIPとのSHA一致・再配布権利は未検証。原本SHP・DBF・ZIPを公開GitHubに複製せず、SHA・派生集計・検証コードのみ記録。ポリゴン件数は農地面積ha、筆数、CH₄実測、土壌炭素、CO₂e削減量、認証済クレジット量ではありません。2024年水稲統計やJAXA土地被覆との無検証の自動JOINも行いません。原本検証台帳：research/p57-nara-soil-shapefile-source-v1.json。再検査：docs/p57-nara-soil-gis-ja.md。</p></section>';
}
