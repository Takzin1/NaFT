/* P37: Tochigi soil GIS; source code/name combinations are unreliable and must not be silently normalized. */
'use strict';
var GX_TOCHIGI_SOURCE_HASH="780db24d2bdb7f088e3c8f203bb52cbe20c9789534651b6327455d42f3b2b1c4";
var GX_TOCHIGI_LANDUSE=[["田",755],["普通畑",615],["牧草地",135],["樹園地",293]];
var GX_TOCHIGI_CODE_NAME_PAIRS=[["08204","小山市",1,0,0,0],["08207","小山市",4,3,0,1],["08225","茂木町",1,0,0,0],["08227","小山市",0,0,0,1],["08227","真岡市",2,1,0,0],["08231","益子町",2,2,0,0],["08364","大田原市",1,0,0,0],["09201","さくら市",1,0,0,0],["09201","上三川町",10,4,0,0],["09201","下野市",3,3,0,0],["09201","塩谷町",2,1,0,0],["09201","壬生町",3,1,0,0],["09201","宇都宮市",26,24,4,14],["09201","日光市",5,0,0,3],["09201","真岡市",5,3,0,1],["09201","芳賀町",2,2,0,2],["09201","高根沢町",2,1,0,1],["09201","鹿沼市",6,2,0,3],["09202","佐野市",6,3,0,1],["09202","足利市",22,22,0,14],["09203","下野市",1,1,0,0],["09203","佐野市",2,2,0,0],["09203","壬生町",1,2,0,0],["09203","小山市",14,4,0,0],["09203","岩舟町",6,7,0,2],["09203","栃木市",39,32,1,17],["09203","鹿沼市",2,2,0,0],["09204","佐野市",26,25,3,18],["09204","岩舟町",2,0,0,0],["09205","壬生町",5,3,0,1],["09205","日光市",2,1,0,0],["09205","鹿沼市",25,24,2,12],["09206","塩谷町",3,1,1,0],["09206","日光市",12,26,7,9],["09208","下野市",12,4,0,5],["09208","小山市",32,20,0,17],["09208","野木町",8,3,0,1],["09209","上三川町",4,3,0,0],["09209","下野市",5,1,0,0],["09209","市貝町",5,1,0,0],["09209","益子町",2,3,0,0],["09209","真岡市",26,25,5,13],["09209","芳賀町",4,2,0,0],["09210","さくら市",3,1,1,1],["09210","大田原市",29,27,14,17],["09210","矢板市",4,0,0,0],["09210","那珂川町",7,8,3,3],["09210","那須塩原市",7,4,0,0],["09210","那須町",5,0,0,0],["09211","さくら市",10,0,0,0],["09211","塩谷町",4,1,0,0],["09211","矢板市",14,14,5,7],["09211","那須塩原市",1,0,0,0],["09213","那須塩原市",21,21,10,11],["09213","那須町",5,3,0,0],["09214","さくら市",25,16,6,7],["09214","塩谷町",2,0,0,0],["09214","那珂川町",2,0,1,1],["09214","那須烏山市",7,2,2,2],["09214","高根沢町",7,0,0,0],["09215","市貝町",2,1,0,2],["09215","茂木町",1,3,0,0],["09215","那珂川町",3,0,2,2],["09215","那須烏山市",29,32,14,18],["09215","高根沢町",4,3,4,2],["09216","上三川町",13,7,0,0],["09216","下野市",24,19,4,8],["09216","壬生町",3,3,0,2],["09301","上三川町",21,20,0,3],["09342","市貝町",5,5,0,2],["09342","益子町",13,16,2,6],["09342","茂木町",3,3,0,0],["09343","市貝町",2,5,2,0],["09343","茂木町",11,16,6,3],["09344","市貝町",10,14,5,12],["09344","芳賀町",6,2,2,1],["09345","芳賀町",8,8,3,5],["09345","高根沢町",6,3,2,0],["09361","壬生町",15,13,0,2],["09364","野木町",9,10,0,4],["09367","岩舟町",9,13,0,12],["09384","塩谷町",11,11,9,4],["09386","高根沢町",13,6,3,3],["09407","那須町",17,14,4,3],["09411","那珂川町",22,27,8,14]];
function gxTochigiSoilValidate(){
 if(GX_TOCHIGI_CODE_NAME_PAIRS.length!==85||GX_TOCHIGI_LANDUSE.length!==4)throw Error('P37_TOCHIGI_PAIR_LENGTH');
 var pairs=new Set(),codes=new Map(),names=new Map(),totals=[0,0,0,0],foreign=0,foreignPairs=0,old=0;
 GX_TOCHIGI_CODE_NAME_PAIRS.forEach(function(r){
  if(r.length!==6||!/^0[89][0-9]{3}$/.test(r[0])||typeof r[1]!=='string'||!r[1])throw Error('P37_TOCHIGI_CODE');
  var key=r[0]+'|'+r[1];if(pairs.has(key))throw Error('P37_TOCHIGI_DUPLICATE_PAIR');
  pairs.add(key);
  if(!codes.has(r[0]))codes.set(r[0],new Set());codes.get(r[0]).add(r[1]);
  if(!names.has(r[1]))names.set(r[1],new Set());names.get(r[1]).add(r[0]);
  var n=r.slice(2).reduce(function(a,v,i){if(!Number.isSafeInteger(v)||v<0)throw Error('P37_TOCHIGI_COUNT');totals[i]+=v;return a+v;},0);
  if(r[0].startsWith('08')){foreign+=n;foreignPairs++;}
  if(r[1]==='岩舟町')old+=n;
 });
 if(codes.size!==32||names.size!==26||foreign!==19||foreignPairs!==7||old!==51)throw Error('P37_TOCHIGI_CODE_NAME_ANOMALY');
 if(totals.reduce(function(a,b){return a+b;},0)!==1798)throw Error('P37_TOCHIGI_TOTAL');
 GX_TOCHIGI_LANDUSE.forEach(function(row,i){if(totals[i]!==row[1])throw Error('P37_TOCHIGI_LANDUSE_PARITY');});
 if([...codes.values()].filter(function(s){return s.size>1;}).length!==19||[...names.values()].filter(function(s){return s.size>1;}).length!==23)throw Error('P37_TOCHIGI_NONBIJECTIVE');
 return true;
}
function gxTochigiSoilPanel(prefCode){
 if(prefCode!=='09')return '';
 gxTochigiSoilValidate();
 var fmt=function(n){return Number(n).toLocaleString('ja-JP');};
 var cards=GX_TOCHIGI_LANDUSE.map(function(row){
  return '<article class="gx-data-card"><span class="gx-kicker">地目区分 / Polygon features</span><strong>'+fmt(row[1])+' <small>件</small></strong><p>'+gxEsc(row[0])+'（面積haではありません）</p></article>';
 }).join('');
 var head='<thead><tr><th scope="col">市町村名（原本）</th><th scope="col">JCODE（原本）</th><th scope="col">田</th><th scope="col">普通畑</th><th scope="col">牧草地</th><th scope="col">樹園地</th><th scope="col">計</th><th scope="col">状態</th></tr></thead>';
 var body=GX_TOCHIGI_CODE_NAME_PAIRS.map(function(r){
  var check=r[0].startsWith('08')?'要照合：08系':r[1]==='岩舟町'?'旧自治体名・要照合':'要照合：複数対応';
  return '<tr><th scope="row">'+gxEsc(r[1])+'</th><td>'+gxEsc(r[0])+'</td>'+r.slice(2).map(function(n){return '<td>'+fmt(n)+'</td>';}).join('')+'<td>'+fmt(r.slice(2).reduce(function(a,b){return a+b;},0))+'</td><td>'+check+'</td></tr>';
 }).join('');
 return '<section class="gx-dashboard" aria-labelledby="gx-tochigi-soil-title">'+
  '<div class="gx-section-heading"><span class="gx-kicker">TOCHIGI SOIL GIS · P37 · SOURCE AUDITED / CODE PAIRS PENDING</span>'+
  '<h2 id="gx-tochigi-soil-title">栃木県の農耕地土壌GISを確認する。</h2>'+
  '<p>原本JGD2000の土壌ポリゴン1,798件。市町村名26種類（旧称「岩舟町」を含む）、JCODE32種類、コード×市町村名85組合せ。土壌群14種類・詳細分類96種類。原本XMLメタデータ作成日2017年1月17日。</p></div>'+
  '<p class="gx-anomaly"><b>重要：行政コードと市町村名が一致していません。</b>原本には茨城県の接頭コード「08」で始まるJCODEが6種類・7組合せ、計19ポリゴン含まれています。栃木県の「09」コードも複数自治体名に対応しており、1対1で結合できません。旧名「岩舟町」も51件含みます。市町村別の確定統計には利用せず、原本85組合せを要照合として保持しています。</p>'+
  '<div class="gx-detail-grid">'+cards+'</div>'+
  '<details><summary>原本の85コード×市町村名組合せを確認する（要照合）</summary><div class="scroll"><table>'+head+'<tbody>'+body+'</tbody></table></div></details>'+
  '<p class="gx-advisory"><b>原本・科学的境界：</b>農研機構の日本土壌インベントリーは出典候補ですが、公式ZIPとのSHA-256照合は未実施。再配布条件の確定前につき生のShapefile・DBFは公開GitHubに複製せず、ハッシュと集計のみ収録しています。この件数は面積ha、筆数、CH₄実測・土壌炭素量・CO₂e削減量ではなく、2024年水稲統計やJAXA土地被覆との自治体単位の自動結合をしません。原本監査台帳：research/p37-tochigi-soil-shapefile-source-v1.json。検証方法：docs/p37-tochigi-soil-gis-ja.md。</p></section>';
}
