/* P39: user-provided Gunma soil GIS, original attributes preserved. Do not join on unverified municipality codes. */
'use strict';
var GX_GUNMA_SOURCE_HASH="b0e17480fb6e63a9d06282021bdf4cb9d8370d1d9609395b23ee475eed609596";
var GX_GUNMA_LANDUSE=[["田",411],["普通畑",554],["牧草地",62],["樹園地",304]];
var GX_GUNMA_CODE_NAME_PAIRS=[["09202","太田市",3,1,0,0],["09202","桐生市",1,1,0,0],["09202","邑楽町",6,3,0,0],["09202","館林市",0,1,0,0],["09203","板倉町",5,1,0,0],["09204","館林市",0,1,0,1],["10201","伊勢崎市",6,7,0,6],["10201","前橋市",24,30,4,18],["10201","吉岡町",2,5,0,0],["10201","桐生市",2,4,0,0],["10201","榛東村",0,1,0,0],["10201","渋川市",1,1,0,0],["10201","玉村町",4,4,0,0],["10201","高崎市",5,7,0,0],["10202","安中市",3,0,0,8],["10202","富岡市",1,3,0,2],["10202","東吾妻町",1,1,0,0],["10202","榛東村",3,4,1,4],["10202","玉村町",1,3,0,0],["10202","甘楽町",2,2,0,5],["10202","藤岡市",4,6,0,2],["10202","高崎市",23,32,6,26],["10203","みどり市",1,7,0,3],["10203","伊勢崎市",2,4,0,4],["10203","太田市",0,3,0,0],["10203","桐生市",13,23,0,13],["10204","みどり市",4,3,0,3],["10204","伊勢崎市",16,22,1,14],["10204","太田市",4,5,0,0],["10204","玉村町",3,3,0,0],["10205","みどり市",1,2,0,1],["10205","大泉町",4,2,0,0],["10205","太田市",18,18,0,6],["10205","邑楽町",4,0,0,0],["10206","みなかみ町",3,3,0,0],["10206","川場村",3,6,1,2],["10206","昭和村",1,1,0,0],["10206","沼田市",5,13,3,10],["10206","片品村",1,2,0,0],["10206","高山村",0,1,0,0],["10207","千代田町",3,2,0,0],["10207","明和町",6,3,0,0],["10207","板倉町",6,0,0,0],["10207","邑楽町",3,2,0,0],["10207","館林市",12,11,0,2],["10208","吉岡町",1,4,0,2],["10208","昭和村",0,1,0,1],["10208","東吾妻町",0,1,0,0],["10208","渋川市",11,18,3,12],["10209","玉村町",0,1,0,0],["10209","藤岡市",9,10,1,9],["10210","下仁田町",0,4,0,2],["10210","安中市",0,7,0,1],["10210","富岡市",12,18,2,12],["10210","甘楽町",3,3,0,3],["10211","安中市",8,13,2,11],["10212","みどり市",7,19,0,12],["10344","吉岡町",2,2,0,1],["10344","榛東村",6,6,1,5],["10345","吉岡町",4,7,2,6],["10366","上野村",0,3,0,2],["10367","神流町",0,5,1,3],["10382","下仁田町",7,10,6,8],["10382","南牧村",0,1,0,0],["10383","南牧村",0,4,0,2],["10384","甘楽町",5,11,2,9],["10421","みなかみ町",0,2,0,0],["10421","中之条町",10,11,3,10],["10421","東吾妻町",0,2,0,3],["10421","草津町",0,1,0,0],["10421","長野原町",0,1,0,0],["10421","高山村",2,2,0,1],["10424","嬬恋村",1,2,0,0],["10424","長野原町",4,6,3,2],["10425","嬬恋村",4,6,3,3],["10425","草津町",0,1,1,0],["10426","草津町",0,1,0,0],["10428","高山村",3,12,4,6],["10429","東吾妻町",13,19,2,13],["10443","片品村",4,6,2,4],["10444","川場村",2,6,1,4],["10448","昭和村",2,4,1,2],["10449","みなかみ町",15,19,4,13],["10464","玉村町",9,11,1,2],["10521","明和町",2,0,0,0],["10521","板倉町",7,5,0,3],["10522","千代田町",4,0,0,0],["10522","明和町",8,9,0,5],["10523","千代田町",12,8,0,0],["10523","大泉町",1,2,0,0],["10523","邑楽町",2,1,0,0],["10524","大泉町",8,6,1,1],["10524","邑楽町",4,1,0,0],["10525","邑楽町",9,8,0,1]];
function gxGunmaSoilValidate(){
 if(GX_GUNMA_CODE_NAME_PAIRS.length!==94||GX_GUNMA_LANDUSE.length!==4)throw Error('P39_GUNMA_PAIR_LENGTH');
 var pairs=new Set(),codes=new Map(),names=new Map(),totals=[0,0,0,0],foreignCount=0,foreignPairs=0;
 GX_GUNMA_CODE_NAME_PAIRS.forEach(function(r){
  if(r.length!==6||!/^((09)|(10))[0-9]{3}$/.test(r[0])||typeof r[1]!=='string'||!r[1])throw Error('P39_GUNMA_CODE');
  var key=r[0]+'|'+r[1];if(pairs.has(key))throw Error('P39_GUNMA_DUPLICATE_PAIR');
  pairs.add(key);
  if(!codes.has(r[0]))codes.set(r[0],new Set());codes.get(r[0]).add(r[1]);
  if(!names.has(r[1]))names.set(r[1],new Set());names.get(r[1]).add(r[0]);
  var n=r.slice(2).reduce(function(a,v,i){if(!Number.isSafeInteger(v)||v<0)throw Error('P39_GUNMA_COUNT');totals[i]+=v;return a+v;},0);
  if(r[0].startsWith('09')){foreignCount+=n;foreignPairs++;}
 });
 if(codes.size!==38||names.size!==35||foreignCount!==24||foreignPairs!==6)throw Error('P39_GUNMA_CODE_NAME_ANOMALY');
 if([...codes.values()].filter(function(s){return s.size>1;}).length!==20||[...names.values()].filter(function(s){return s.size>1;}).length!==30)throw Error('P39_GUNMA_NONBIJECTIVE');
 if(totals.reduce(function(a,b){return a+b;},0)!==1331)throw Error('P39_GUNMA_TOTAL');
 GX_GUNMA_LANDUSE.forEach(function(row,i){if(totals[i]!==row[1])throw Error('P39_GUNMA_LANDUSE_PARITY');});
 return true;
}
function gxGunmaSoilPanel(prefCode){
 if(prefCode!=='10')return '';
 gxGunmaSoilValidate();
 var fmt=function(n){return Number(n).toLocaleString('ja-JP');};
 var cards=GX_GUNMA_LANDUSE.map(function(row){
  return '<article class="gx-data-card"><span class="gx-kicker">地目区分 / Polygon features</span><strong>'+fmt(row[1])+' <small>件</small></strong><p>'+gxEsc(row[0])+'（面積haではありません）</p></article>';
 }).join('');
 var head='<thead><tr><th scope="col">市町村名（原本）</th><th scope="col">JCODE（原本）</th><th scope="col">田</th><th scope="col">普通畑</th><th scope="col">牧草地</th><th scope="col">樹園地</th><th scope="col">計</th><th scope="col">状態</th></tr></thead>';
 var rows=GX_GUNMA_CODE_NAME_PAIRS.map(function(r){
  var issue=r[0].startsWith('09')?'県外コード09・要照合':'複数コード・名称対応を要照合';
  return '<tr><th scope="row">'+gxEsc(r[1])+'</th><td>'+gxEsc(r[0])+'</td>'+r.slice(2).map(function(n){return '<td>'+fmt(n)+'</td>';}).join('')+'<td>'+fmt(r.slice(2).reduce(function(a,b){return a+b;},0))+'</td><td>'+issue+'</td></tr>';
 }).join('');
 return '<section class="gx-dashboard" aria-labelledby="gx-gunma-soil-title">'+
  '<div class="gx-section-heading"><span class="gx-kicker">GUNMA SOIL GIS · P39 · SOURCE AUDITED / ADMINISTRATIVE CODES PENDING</span>'+
  '<h2 id="gx-gunma-soil-title">群馬県の農耕地土壌GISを確認する。</h2>'+
  '<p>原本JGD2000の土壌ポリゴン1,331件。市町村名35種類、JCODE38種類、コード×市町村名94組合せ。土壌群13種類、詳細分類71種類。元XMLメタデータの作成日は2017年1月17日。</p></div>'+
  '<p class="gx-anomaly"><b>行政コードの不整合・要照合：</b>栃木県に対応する接頭「09」のJCODEが原本の6組合せ・24ポリゴンに含まれます。群馬県を示す「10」系コードも複数自治体名に対応し、20コードに複数名称、30市町村名に複数コードが対応しています。市町村単位の確定統計や別データとのコード結合は行わず、94組合せを原本のまま保持しています。</p>'+
  '<div class="gx-detail-grid">'+cards+'</div>'+
  '<details><summary>原本のJCODE×市町村名94組合せ（要照合）を見る</summary><div class="scroll"><table>'+head+'<tbody>'+rows+'</tbody></table></div></details>'+
  '<p class="gx-advisory"><b>来歴・科学的境界：</b>農研機構「日本土壌インベントリー」は出典候補ですが、公式群馬県ZIPとのハッシュ一致は未確認。元Shapefileの再配布条件を具体的原本へ適用できるか確認できるまでは、生データを公開GitHubに複製せず、原本のハッシュと派生集計のみ登録しています。ポリゴン件数は面積ha、筆数、実測CH₄、土壌炭素量、CO₂e削減量ではなく、2024年水稲統計やJAXA土地被覆との無検証の自動結合はしません。原本台帳：research/p39-gunma-soil-shapefile-source-v1.json。監査手順：docs/p39-gunma-soil-gis-ja.md。</p></section>';
}
