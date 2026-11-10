/* NaFT P75 Okinawa: source-derived soil-GIS aggregates only. Raw geometries and unsafe municipality JOIN excluded. */
'use strict';
var GX_OKINAWA_SOURCE_SHA="68cb4b0950aaadc07ce1e98bf52497f66b34ed595cbec6b0b511f87b1310c68f";
var GX_OKINAWA_LANDUSE=[["田",71],["普通畑",366],["牧草地",109],["樹園地",117]];
var GX_OKINAWA_CODE_PAIRS=[["47201","南風原町",0,3,0,0],["47201","浦添市",0,1,0,0],["47201","西原町",0,1,0,0],["47201","豊見城市",0,2,0,0],["47201","那覇市",0,4,0,0],["47205","北中城村",0,1,0,0],["47205","宜野湾市",1,2,0,0],["47207","石垣市",13,18,15,12],["47208","浦添市",0,6,0,0],["47208","西原町",0,3,0,0],["47209","今帰仁村",0,1,0,2],["47209","名護市",6,24,2,14],["47209","大宜味村",0,1,1,0],["47209","宜野座村",0,1,1,1],["47209","本部町",0,0,0,3],["47209","東村",0,1,0,1],["47210","八重瀬町",0,6,0,2],["47210","糸満市",0,9,1,2],["47210","豊見城市",0,4,0,0],["47211","うるま市",0,4,0,0],["47211","北中城村",0,1,0,0],["47211","沖縄市",0,6,0,0],["47212","八重瀬町",0,2,1,0],["47212","南風原町",0,2,0,0],["47212","豊見城市",0,4,2,0],["47213","うるま市",2,16,8,8],["47213","恩納村",0,3,1,1],["47213","金武町",0,1,0,0],["47214","宮古島市",1,7,5,4],["47215","与那原町",0,2,0,0],["47215","八重瀬町",0,3,1,0],["47215","南城市",2,8,6,1],["47215","南風原町",1,3,1,0],["47301","国頭村",2,13,2,5],["47301","大宜味村",0,1,0,0],["47301","東村",0,0,0,1],["47302","大宜味村",2,11,2,4],["47302","東村",0,2,1,3],["47303","東村",0,10,1,8],["47306","今帰仁村",3,11,2,6],["47306","本部町",0,3,0,3],["47308","本部町",1,14,1,4],["47311","恩納村",3,14,1,1],["47311","金武町",0,1,0,0],["47313","宜野座村",0,7,3,6],["47313","金武町",0,2,0,1],["47314","金武町",5,9,3,1],["47315","伊江村",0,2,2,0],["47324","読谷村",0,5,1,0],["47325","嘉手納町",0,2,2,1],["47326","北谷町",0,2,0,0],["47327","中城村",0,3,0,0],["47327","北中城村",0,4,0,0],["47328","中城村",0,5,0,1],["47328","西原町",0,2,0,0],["47329","与那原町",0,2,0,0],["47329","南風原町",0,1,0,0],["47329","西原町",0,4,0,2],["47348","与那原町",0,4,0,0],["47348","南風原町",0,2,0,0],["47350","八重瀬町",0,2,0,0],["47350","南風原町",0,4,2,1],["47353","渡嘉敷村",2,1,0,1],["47354","座間味村",0,1,0,1],["47355","粟国村",0,4,2,0],["47356","渡名喜村",0,2,0,0],["47357","南大東村",0,5,1,0],["47358","北大東村",0,4,0,0],["47359","伊平屋村",6,10,1,0],["47360","伊是名村",3,7,2,3],["47361","久米島町",2,10,7,1],["47362","八重瀬町",0,6,5,5],["47375","多良間村",0,2,2,0],["47381","竹富町",8,11,10,6],["47382","与那国町",8,11,11,1]];
var GX_OKINAWA_GUN_PAIRS=[["","うるま市",2,20,8,8],["","与那原町",0,2,0,0],["","今帰仁村",0,1,0,2],["","八重瀬町",0,11,2,2],["","北中城村",0,2,0,0],["","南城市",2,8,6,1],["","南風原町",1,8,1,0],["","名護市",6,24,2,14],["","大宜味村",0,1,1,0],["","宜野座村",0,1,1,1],["","宜野湾市",1,2,0,0],["","宮古島市",1,7,5,4],["","恩納村",0,3,1,1],["","本部町",0,0,0,3],["","東村",0,1,0,1],["","沖縄市",0,6,0,0],["","浦添市",0,7,0,0],["","石垣市",13,18,15,12],["","糸満市",0,9,1,2],["","西原町",0,4,0,0],["","豊見城市",0,10,2,0],["","那覇市",0,4,0,0],["","金武町",0,1,0,0],["中頭郡","与那原町",0,2,0,0],["中頭郡","中城村",0,8,0,1],["中頭郡","北中城村",0,4,0,0],["中頭郡","北谷町",0,2,0,0],["中頭郡","南風原町",0,1,0,0],["中頭郡","嘉手納町",0,2,2,1],["中頭郡","西原町",0,6,0,2],["中頭郡","読谷村",0,5,1,0],["八重山郡","与那国町",8,11,11,1],["八重山郡","竹富町",8,11,10,6],["国頭郡","今帰仁村",3,11,2,6],["国頭郡","伊江村",0,2,2,0],["国頭郡","国頭村",2,13,2,5],["国頭郡","大宜味村",2,12,2,4],["国頭郡","宜野座村",0,7,3,6],["国頭郡","恩納村",3,14,1,1],["国頭郡","本部町",1,17,1,7],["国頭郡","東村",0,12,2,12],["国頭郡","金武町",5,12,3,2],["宮古郡","多良間村",0,2,2,0],["島尻郡","与那原町",0,4,0,0],["島尻郡","久米島町",2,10,7,1],["島尻郡","伊平屋村",6,10,1,0],["島尻郡","伊是名村",3,7,2,3],["島尻郡","八重瀬町",0,8,5,5],["島尻郡","北大東村",0,4,0,0],["島尻郡","南大東村",0,5,1,0],["島尻郡","南風原町",0,6,2,1],["島尻郡","座間味村",0,1,0,1],["島尻郡","渡名喜村",0,2,0,0],["島尻郡","渡嘉敷村",2,1,0,1],["島尻郡","粟国村",0,4,2,0]];
var GX_OKINAWA_GUN_COUNTS=[["",272],["国頭郡",177],["島尻郡",107],["八重山郡",66],["中頭郡",37],["宮古郡",4]];
function gxOkinawaSoilValidate(){
 if(GX_OKINAWA_SOURCE_SHA!=='68cb4b0950aaadc07ce1e98bf52497f66b34ed595cbec6b0b511f87b1310c68f')throw Error('P75_OKINAWA_SOURCE_SHA');
 if(GX_OKINAWA_CODE_PAIRS.length!==75||GX_OKINAWA_GUN_PAIRS.length!==55)throw Error('P75_OKINAWA_PAIRS');
 var codes=new Map(),names=new Map(),guns=new Map(),seenCodes=new Set(),seenGuns=new Set(),ct=[0,0,0,0],gt=[0,0,0,0];
 GX_OKINAWA_CODE_PAIRS.forEach(function(r){
   if(r.length!==6||!/^\d{5}$/.test(r[0])||!r[0].startsWith('47')||!r[1])throw Error('P75_OKINAWA_CODE_FORMAT_OR_FOREIGN_CODE');
   var key=r[0]+'|'+r[1];if(seenCodes.has(key))throw Error('P75_OKINAWA_DUP_CODE');seenCodes.add(key);
   if(!codes.has(r[0]))codes.set(r[0],new Set());codes.get(r[0]).add(r[1]);
   if(!names.has(r[1]))names.set(r[1],new Set());names.get(r[1]).add(r[0]);
   r.slice(2).forEach(function(n,i){if(!Number.isSafeInteger(n)||n<0)throw Error('P75_OKINAWA_CODE_VALUE');ct[i]+=n;});
 });
 if(codes.size!==41||names.size!==41||[...codes.values()].filter(function(s){return s.size>1;}).length!==19||[...names.values()].filter(function(s){return s.size>1;}).length!==16)throw Error('P75_OKINAWA_CODE_MAPPING');
 GX_OKINAWA_GUN_PAIRS.forEach(function(r){
   if(r.length!==6||!r[1])throw Error('P75_OKINAWA_GUN_FORMAT');
   var key=r[0]+'|'+r[1];if(seenGuns.has(key))throw Error('P75_OKINAWA_DUP_GUN');seenGuns.add(key);
   if(r[0]){if(!guns.has(r[1]))guns.set(r[1],new Set());guns.get(r[1]).add(r[0]);}
   r.slice(2).forEach(function(n,i){if(!Number.isSafeInteger(n)||n<0)throw Error('P75_OKINAWA_GUN_VALUE');gt[i]+=n;});
 });
 if(JSON.stringify(ct)!==JSON.stringify([71,366,109,117])||JSON.stringify(gt)!==JSON.stringify(ct))throw Error('P75_OKINAWA_LAND_PARITY');
 if([...guns.values()].filter(function(s){return s.size>1;}).length!==2||!guns.has('与那原町')||!guns.has('南風原町'))throw Error('P75_OKINAWA_GUN_MAPPING');
 var g=Object.fromEntries(GX_OKINAWA_GUN_COUNTS);
 GX_OKINAWA_GUN_COUNTS.forEach(function(row){var found=GX_OKINAWA_GUN_PAIRS.filter(function(r){return r[0]===row[0];}).reduce(function(s,r){return s+r.slice(2).reduce(function(a,b){return a+b;},0);},0);if(found!==row[1])throw Error('P75_OKINAWA_GUN_PARITY');});
 if(g['']!==272||g['国頭郡']!==177||g['島尻郡']!==107||g['八重山郡']!==66||g['中頭郡']!==37||g['宮古郡']!==4)throw Error('P75_OKINAWA_GUN_COUNTS');
 return true;
}
function gxOkinawaSoilPanel(prefCode){
 if(prefCode!=='47')return '';
 gxOkinawaSoilValidate();
 var fmt=function(n){return Number(n).toLocaleString('ja-JP');};
 var cards=GX_OKINAWA_LANDUSE.map(function(r){return '<article class="gx-data-card"><span class="gx-kicker">地目区分 / Polygon features</span><strong>'+fmt(r[1])+' <small>件</small></strong><p>'+gxEsc(r[0])+'（農地面積haではありません）</p></article>';}).join('');
 var cFreq=new Map(),nFreq=new Map(),gNames=new Map();
 GX_OKINAWA_CODE_PAIRS.forEach(function(r){cFreq.set(r[0],(cFreq.get(r[0])||0)+1);nFreq.set(r[1],(nFreq.get(r[1])||0)+1);});
 GX_OKINAWA_GUN_PAIRS.forEach(function(r){if(r[0]){if(!gNames.has(r[1]))gNames.set(r[1],new Set());gNames.get(r[1]).add(r[0]);}});
 var codes=GX_OKINAWA_CODE_PAIRS.map(function(r){var warn=[];if(cFreq.get(r[0])>1||nFreq.get(r[1])>1)warn.push('JCODE・名称が複数対応');return '<tr><th scope="row">'+gxEsc(r[1])+'</th><td>'+gxEsc(r[0])+'</td>'+r.slice(2).map(function(n){return '<td>'+fmt(n)+'</td>';}).join('')+'<td>'+gxEsc(warn.length?warn.join('／')+'・要照合':'原本値')+'</td></tr>';}).join('');
 var guns=GX_OKINAWA_GUN_PAIRS.map(function(r){var warn=[];if(!r[0])warn.push('郡名空欄');if(r[0]&&gNames.get(r[1])&&gNames.get(r[1]).size>1)warn.push('複数郡名対応');return '<tr><th scope="row">'+gxEsc(r[1])+'</th><td>'+gxEsc(r[0]||'（空欄）')+'</td>'+r.slice(2).map(function(n){return '<td>'+fmt(n)+'</td>';}).join('')+'<td>'+gxEsc(warn.length?warn.join('／')+'・要照合':'原本値')+'</td></tr>';}).join('');
 var heads='<th scope="col">市町村名</th><th scope="col">区分</th><th scope="col">田</th><th scope="col">普通畑</th><th scope="col">牧草地</th><th scope="col">樹園地</th><th scope="col">照合</th>';
 return '<section class="gx-dashboard" aria-labelledby="gx-okinawa-soil-title">'+
 '<div class="gx-section-heading"><span class="gx-kicker">OKINAWA SOIL GIS · P75 · SOURCE ATTRIBUTES / ADMIN RECONCILIATION PENDING</span><h2 id="gx-okinawa-soil-title">沖縄県の農耕地土壌GISを確認する。</h2><p>JGD2000・ポリゴン663件。田71件、普通畑366件、牧草地109件、樹園地117件。市町村名41種類、JCODE41種類、土壌群12種類・詳細分類40種類。原本XML作成日2017年1月17日。</p></div>'+
 '<p class="gx-anomaly"><b>原本行政属性の要照合：</b>47系以外のJCODEは0件。ただし同一JCODEに複数市町村名があるものが19種類。郡名GUNは272件空欄で、南風原町・与那原町には「中頭郡」と「島尻郡」の両方が記録されています。原本値は無断補正せず現行自治体への自動JOINを保留します。ポリゴン数は農地面積ha、GHG削減量、認証済み炭素クレジット数ではありません。</p>'+
 '<div class="gx-detail-grid">'+cards+'</div>'+
 '<details><summary>原本JCODE×市町村名75組合せ</summary><div class="scroll"><table><thead><tr>'+heads.replace('<th scope="col">区分</th>','<th scope="col">JCODE</th>')+'</tr></thead><tbody>'+codes+'</tbody></table></div></details>'+
 '<details><summary>原本GUN×市町村名55組合せ</summary><div class="scroll"><table><thead><tr>'+heads.replace('<th scope="col">区分</th>','<th scope="col">GUN</th>')+'</tr></thead><tbody>'+guns+'</tbody></table></div></details>'+
 '<p class="gx-kicker">Source ledger: research/p75-okinawa-soil-shapefile-source-v1.json · 原本ZIP・SHP・DBF・個別地物座標は公開していません。</p></section>';
}
