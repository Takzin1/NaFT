/* NaFT P67 Kochi soil GIS: public derived land-use + original administrative source warnings only. */
'use strict';
var GX_KOCHI_SOURCE_SHA="783d8be4ba99102f30a136ac056227eceff4b1d36d7b212e52de1b0f7d5769af";
var GX_KOCHI_LANDUSE=[["田",334],["普通畑",228],["牧草地",34],["樹園地",171]];
var GX_KOCHI_CODE_PAIRS=[["38386","梼原町",0,0,2,0],["38484","四万十市",1,0,0,0],["38506","宿毛市",3,0,0,0],["39201","いの町",2,1,0,2],["39201","南国市",6,1,0,1],["39201","土佐市",3,0,0,0],["39201","高知市",19,7,2,9],["39202","室戸市",8,8,0,6],["39203","安田町",1,0,0,0],["39203","安芸市",10,8,0,9],["39203","芸西村",2,0,0,0],["39204","南国市",13,8,3,6],["39204","香南市",1,0,0,0],["39204","香美市",4,0,0,0],["39205","佐川町",0,0,0,1],["39205","土佐市",9,7,0,7],["39205","日高村",0,0,0,2],["39206","須崎市",9,9,0,6],["39208","四万十市",2,0,0,0],["39208","大月町",1,0,0,0],["39208","宿毛市",15,9,1,8],["39209","三原村",0,1,0,1],["39209","土佐清水市",12,10,1,4],["39210","四万十市",12,14,3,11],["39210","黒潮町",1,1,0,1],["39211","香南市",19,14,0,9],["39211","香美市",3,0,0,0],["39212","香美市",15,9,2,10],["39301","東洋町",7,1,0,5],["39302","奈半利町",4,1,0,1],["39303","安田町",2,0,0,0],["39303","田野町",7,4,0,0],["39304","安田町",9,3,1,3],["39305","北川村",5,4,0,6],["39306","馬路村",1,1,0,2],["39307","芸西村",10,4,1,2],["39341","土佐町",0,0,1,0],["39341","本山町",6,3,1,1],["39344","大豊町",7,6,0,7],["39363","いの町",0,0,1,0],["39363","土佐町",4,4,2,3],["39364","大川村",2,1,1,1],["39386","いの町",8,6,0,3],["39386","日高村",0,1,0,0],["39387","仁淀川町",2,4,2,3],["39387","越知町",0,1,0,0],["39401","中土佐町",11,7,0,2],["39401","四万十町",1,0,0,0],["39401","津野町",3,1,0,1],["39402","佐川町",10,8,2,5],["39402","日高村",1,1,0,0],["39402","越知町",1,1,0,0],["39403","日高村",1,0,0,0],["39403","越知町",5,3,0,1],["39405","梼原町",7,6,0,4],["39405","津野町",0,1,0,0],["39410","日高村",4,7,0,4],["39411","津野町",6,8,1,6],["39412","四万十町",14,10,3,9],["39412","黒潮町",1,0,0,0],["39424","大月町",7,9,2,3],["39427","三原村",6,5,2,2],["39428","黒潮町",11,10,0,4]];
var GX_KOCHI_GUN_PAIRS=[["","いの町",2,1,0,2],["","三原村",0,1,0,1],["","佐川町",0,0,0,1],["","南国市",19,9,3,7],["","四万十市",14,14,3,11],["","土佐市",12,7,0,7],["","土佐清水市",12,10,1,4],["","大月町",1,0,0,0],["","安田町",1,0,0,0],["","安芸市",10,8,0,9],["","室戸市",8,8,0,6],["","宿毛市",15,9,1,8],["","日高村",0,0,0,2],["","芸西村",2,0,0,0],["","須崎市",9,9,0,6],["","香南市",20,14,0,9],["","香美市",22,9,2,10],["","高知市",19,7,2,9],["","黒潮町",1,1,0,1],["上浮穴郡","梼原町",0,0,2,0],["北宇和郡","四万十市",1,0,0,0],["南宇和郡","宿毛市",3,0,0,0],["吾川郡","いの町",8,6,0,3],["吾川郡","仁淀川町",2,4,2,3],["吾川郡","日高村",0,1,0,0],["吾川郡","越知町",0,1,0,0],["土佐郡","いの町",0,0,1,0],["土佐郡","土佐町",4,4,2,3],["土佐郡","大川村",2,1,1,1],["安芸郡","北川村",5,4,0,6],["安芸郡","奈半利町",4,1,0,1],["安芸郡","安田町",11,3,1,3],["安芸郡","東洋町",7,1,0,5],["安芸郡","田野町",7,4,0,0],["安芸郡","芸西村",10,4,1,2],["安芸郡","馬路村",1,1,0,2],["幡多郡","三原村",6,5,2,2],["幡多郡","大月町",7,9,2,3],["幡多郡","黒潮町",11,10,0,4],["長岡郡","土佐町",0,0,1,0],["長岡郡","大豊町",7,6,0,7],["長岡郡","本山町",6,3,1,1],["高岡郡","中土佐町",11,7,0,2],["高岡郡","佐川町",10,8,2,5],["高岡郡","四万十町",15,10,3,9],["高岡郡","日高村",6,8,0,4],["高岡郡","梼原町",7,6,0,4],["高岡郡","津野町",9,10,1,7],["高岡郡","越知町",6,4,0,1],["高岡郡","黒潮町",1,0,0,0]];
var GX_KOCHI_GUN_COUNTS=[["長岡郡",32],["土佐郡",19],["高岡郡",156],["幡多郡",61],["",379],["安芸郡",84],["吾川郡",30],["南宇和郡",3],["北宇和郡",1],["上浮穴郡",2]];
function gxKochiSoilValidate(){
  if(GX_KOCHI_SOURCE_SHA!=='783d8be4ba99102f30a136ac056227eceff4b1d36d7b212e52de1b0f7d5769af')throw Error('P67_KOCHI_SOURCE_SHA');
  if(GX_KOCHI_CODE_PAIRS.length!==63||GX_KOCHI_GUN_PAIRS.length!==50)throw Error('P67_KOCHI_PAIR_COUNT');
  var ct=[0,0,0,0],gt=[0,0,0,0],codeNames=new Map(),nameCodes=new Map(),nameGuns=new Map(),seenCode=new Set(),seenGun=new Set(),foreign=0,otherGuns=0;
  GX_KOCHI_CODE_PAIRS.forEach(function(r){
    if(r.length!==6||!/^\d{5}$/.test(r[0])||!r[1])throw Error('P67_KOCHI_CODE_FORMAT');
    var id=r[0]+'|'+r[1];if(seenCode.has(id))throw Error('P67_KOCHI_DUP_CODE');seenCode.add(id);
    if(!codeNames.has(r[0]))codeNames.set(r[0],new Set());codeNames.get(r[0]).add(r[1]);
    if(!nameCodes.has(r[1]))nameCodes.set(r[1],new Set());nameCodes.get(r[1]).add(r[0]);
    r.slice(2).forEach(function(v,i){if(!Number.isSafeInteger(v)||v<0)throw Error('P67_KOCHI_CODE_COUNT');ct[i]+=v;});
    if(!r[0].startsWith('39')){if(!['38386','38484','38506'].includes(r[0]))throw Error('P67_KOCHI_FOREIGN_CODE');foreign+=r.slice(2).reduce(function(a,b){return a+b;},0);}
  });
  if(codeNames.size!==37||nameCodes.size!==34||foreign!==6)throw Error('P67_KOCHI_CODE_TOTAL');
  if([...codeNames.values()].filter(function(s){return s.size>1;}).length!==18||[...nameCodes.values()].filter(function(s){return s.size>1;}).length!==19)throw Error('P67_KOCHI_ADMIN_MULTI');
  GX_KOCHI_GUN_PAIRS.forEach(function(r){
    if(r.length!==6||!r[1])throw Error('P67_KOCHI_GUN_FORMAT');
    var id=r[0]+'|'+r[1];if(seenGun.has(id))throw Error('P67_KOCHI_DUP_GUN');seenGun.add(id);
    if(r[0]){if(!nameGuns.has(r[1]))nameGuns.set(r[1],new Set());nameGuns.get(r[1]).add(r[0]);}
    r.slice(2).forEach(function(v,i){if(!Number.isSafeInteger(v)||v<0)throw Error('P67_KOCHI_GUN_COUNT');gt[i]+=v;});
    if(['上浮穴郡','北宇和郡','南宇和郡'].includes(r[0]))otherGuns+=r.slice(2).reduce(function(a,b){return a+b;},0);
  });
  if(JSON.stringify(ct)!==JSON.stringify([334,228,34,171])||JSON.stringify(gt)!==JSON.stringify(ct))throw Error('P67_KOCHI_LAND_PARITY');
  if([...nameGuns.values()].filter(function(s){return s.size>1;}).length!==6||otherGuns!==6)throw Error('P67_KOCHI_GUN_MULTI');
  var g=Object.fromEntries(GX_KOCHI_GUN_COUNTS);
  GX_KOCHI_GUN_COUNTS.forEach(function(row){var observed=GX_KOCHI_GUN_PAIRS.filter(function(r){return r[0]===row[0];}).reduce(function(a,r){return a+r.slice(2).reduce(function(x,y){return x+y;},0);},0);if(observed!==row[1])throw Error('P67_KOCHI_GUN_PARITY');});
  if(g['']!==379||g['高岡郡']!==156||g['上浮穴郡']!==2||g['北宇和郡']!==1||g['南宇和郡']!==3)throw Error('P67_KOCHI_GUN_COUNTS');
  return true;
}
function gxKochiSoilPanel(prefCode){
  if(prefCode!=='39')return '';
  gxKochiSoilValidate();
  var fmt=function(n){return Number(n).toLocaleString('ja-JP');};
  var cards=GX_KOCHI_LANDUSE.map(function(r){return '<article class="gx-data-card"><span class="gx-kicker">地目区分 / Polygon features</span><strong>'+fmt(r[1])+' <small>件</small></strong><p>'+gxEsc(r[0])+'（農地面積haではありません）</p></article>';}).join('');
  var codeCounts=new Map(),nameCounts=new Map(),nameGuns=new Map();
  GX_KOCHI_CODE_PAIRS.forEach(function(r){codeCounts.set(r[0],(codeCounts.get(r[0])||0)+1);nameCounts.set(r[1],(nameCounts.get(r[1])||0)+1);});
  GX_KOCHI_GUN_PAIRS.forEach(function(r){if(r[0]){if(!nameGuns.has(r[1]))nameGuns.set(r[1],new Set());nameGuns.get(r[1]).add(r[0]);}});
  var codes=GX_KOCHI_CODE_PAIRS.map(function(r){var warnings=[];if(!r[0].startsWith('39'))warnings.push('愛媛県系JCODE');if(codeCounts.get(r[0])>1||nameCounts.get(r[1])>1)warnings.push('行政コード・名称の複数対応');return '<tr><th scope="row">'+gxEsc(r[1])+'</th><td>'+gxEsc(r[0])+'</td>'+r.slice(2).map(function(n){return '<td>'+fmt(n)+'</td>';}).join('')+'<td>'+gxEsc(warnings.length?warnings.join('／')+'・要照合':'原本値')+'</td></tr>';}).join('');
  var guns=GX_KOCHI_GUN_PAIRS.map(function(r){var warnings=[];if(!r[0])warnings.push('郡名空欄');if(['上浮穴郡','北宇和郡','南宇和郡'].includes(r[0]))warnings.push('愛媛県系郡名');if(r[0]&&nameGuns.get(r[1])&&nameGuns.get(r[1]).size>1)warnings.push('郡名の複数対応');return '<tr><th scope="row">'+gxEsc(r[1])+'</th><td>'+gxEsc(r[0]||'（空欄）')+'</td>'+r.slice(2).map(function(n){return '<td>'+fmt(n)+'</td>';}).join('')+'<td>'+gxEsc(warnings.length?warnings.join('／')+'・要照合':'原本値')+'</td></tr>';}).join('');
  var columns='<th scope="col">市町村名</th><th scope="col">区分</th><th scope="col">田</th><th scope="col">普通畑</th><th scope="col">牧草地</th><th scope="col">樹園地</th><th scope="col">照合</th>';
  return '<section class="gx-dashboard" aria-labelledby="gx-kochi-soil-title">'+
    '<div class="gx-section-heading"><span class="gx-kicker">KOCHI SOIL GIS · P67 · SOURCE ATTRIBUTES / ADMIN RECONCILIATION PENDING</span><h2 id="gx-kochi-soil-title">高知県の農耕地土壌GISを確認する。</h2><p>JGD2000・ポリゴン767件。田334件、普通畑228件、牧草地34件、樹園地171件。市町村名34種類、JCODE37種類、土壌群15種類・詳細分類43種類。原本XML作成日2017年1月17日。</p></div>'+
    '<p class="gx-anomaly"><b>原本行政属性の要照合：</b>高知県の原本には愛媛県系JCODEが6件（38386・38484・38506）、愛媛県系郡名が6件（上浮穴郡2件・北宇和郡1件・南宇和郡3件）。郡名空欄379件、同じ市町村名で複数の郡名が対応する事例も6種類あります。原本を無断で修正せず、現行市町村との自動JOINは保留します。ポリゴン件数は農地面積ha、GHG削減量、認証済み炭素クレジットではありません。</p>'+
    '<div class="gx-detail-grid">'+cards+'</div>'+
    '<details><summary>原本JCODE×市町村名63組合せ</summary><div class="scroll"><table><thead><tr>'+columns.replace('<th scope="col">区分</th>','<th scope="col">JCODE</th>')+'</tr></thead><tbody>'+codes+'</tbody></table></div></details>'+
    '<details><summary>原本GUN×市町村名50組合せ</summary><div class="scroll"><table><thead><tr>'+columns.replace('<th scope="col">区分</th>','<th scope="col">GUN</th>')+'</tr></thead><tbody>'+guns+'</tbody></table></div></details>'+
    '<p class="gx-kicker">Source ledger: research/p67-kochi-soil-shapefile-source-v1.json · 元ZIP・SHP・DBF・地物座標は公開していません。</p></section>';
}
