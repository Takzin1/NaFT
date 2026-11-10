/* NaFT P55 Osaka soil GIS — original codes/landuse; no unverified normalization. */
'use strict';
var GX_OSAKA_HASH="1f75d80027ea0d1ea2718d00f0c8d5106694991733440544f3fd040155f8909d";
var GX_OSAKA_LANDUSE=[["田",391],["普通畑",158],["牧草地",2],["樹園地",213]];
var GX_OSAKA_CODE_PAIRS=[["26111","高槻市",1,0,0,0],["26206","能勢町",1,0,0,0],["26206","茨木市",1,0,0,1],["26206","豊能町",1,0,0,0],["26211","枚方市",1,1,0,0],["27114","吹田市",1,0,0,0],["27114","摂津市",1,0,0,0],["27114","東淀川区",1,2,0,0],["27120","住吉区",2,2,0,0],["27120","東住吉区",1,0,0,0],["27121","平野区",1,1,0,0],["27121","東住吉区",1,1,0,0],["27121","松原市",1,0,0,0],["27124","門真市",0,1,0,0],["27124","鶴見区",1,1,0,0],["27125","住之江区",0,1,0,0],["27126","八尾市",1,0,0,1],["27126","平野区",4,2,0,1],["27126","松原市",1,1,0,0],["27141","堺区",0,1,0,0],["27142","中区",6,4,0,0],["27142","北区",1,0,0,0],["27142","南区",1,2,0,0],["27142","東区",1,0,0,0],["27142","西区",1,1,0,0],["27143","北区",1,0,0,0],["27143","大阪狭山市",3,0,0,0],["27143","東区",4,3,0,0],["27143","美原区",2,0,0,0],["27144","南区",1,0,0,0],["27144","和泉市",1,0,0,0],["27144","西区",2,0,0,0],["27144","高石市",1,0,0,0],["27145","南区",5,5,0,6],["27145","和泉市",0,0,0,3],["27145","大阪狭山市",2,1,0,0],["27145","河内長野市",1,0,0,0],["27146","北区",4,1,0,0],["27146","松原市",2,0,0,0],["27147","大阪狭山市",1,0,0,4],["27147","富田林市",1,0,0,0],["27147","松原市",1,0,0,0],["27147","美原区",9,1,0,5],["27147","羽曳野市",4,0,0,0],["27202","和泉市",2,0,0,6],["27202","岸和田市",7,7,0,11],["27202","忠岡町",1,0,0,0],["27202","貝塚市",3,0,0,6],["27203","豊中市",4,2,0,1],["27204","池田市",4,3,0,3],["27204","箕面市",0,0,0,2],["27205","吹田市",4,2,0,1],["27206","泉大津市",3,2,0,0],["27207","島本町",1,0,0,0],["27207","摂津市",2,0,0,0],["27207","茨木市",3,0,0,0],["27207","高槻市",10,4,0,1],["27208","泉佐野市",2,0,0,0],["27208","熊取町",2,0,0,2],["27208","貝塚市",6,0,0,7],["27209","守口市",1,1,0,0],["27210","交野市",2,1,0,0],["27210","寝屋川市",1,1,0,0],["27210","枚方市",10,7,0,3],["27211","摂津市",1,0,0,0],["27211","箕面市",3,0,0,0],["27211","茨木市",9,6,0,3],["27211","豊能町",1,0,0,0],["27212","八尾市",4,4,0,2],["27212","東大阪市",1,1,0,0],["27212","柏原市",1,2,0,0],["27212","藤井寺市",1,1,0,0],["27213","泉佐野市",7,3,0,5],["27213","泉南市",3,0,0,1],["27213","熊取町",3,0,0,0],["27213","田尻町",3,0,0,0],["27214","千早赤阪村",1,1,0,5],["27214","大阪狭山市",3,0,0,1],["27214","太子町",3,0,0,1],["27214","富田林市",12,6,0,10],["27214","河内長野市",4,0,0,1],["27214","河南町",7,3,0,2],["27214","羽曳野市",4,0,0,0],["27215","交野市",1,1,0,0],["27215","四条畷市",2,2,0,0],["27215","大東市",1,0,0,0],["27215","寝屋川市",4,3,0,3],["27215","門真市",0,1,0,0],["27216","千早赤阪村",0,0,0,1],["27216","和泉市",0,0,0,2],["27216","大阪狭山市",1,0,0,1],["27216","河内長野市",11,0,0,11],["27217","松原市",8,1,0,0],["27217","羽曳野市",2,0,0,0],["27217","藤井寺市",1,0,0,0],["27218","四条畷市",1,0,0,0],["27218","大東市",7,0,0,0],["27219","和泉市",6,8,0,11],["27219","高石市",1,0,0,0],["27220","箕面市",4,1,0,3],["27221","柏原市",6,6,0,8],["27221","羽曳野市",1,0,0,1],["27221","藤井寺市",1,0,0,0],["27222","太子町",1,0,0,5],["27222","羽曳野市",10,1,0,7],["27222","藤井寺市",5,1,0,1],["27223","門真市",1,1,0,1],["27224","摂津市",1,1,0,0],["27225","高石市",1,0,0,0],["27226","藤井寺市",6,1,0,1],["27227","東大阪市",6,6,0,2],["27228","泉南市",6,2,0,4],["27228","田尻町",1,0,0,0],["27229","四条畷市",4,3,0,0],["27230","交野市",2,2,0,1],["27231","大阪狭山市",9,1,0,4],["27232","阪南市",7,3,0,1],["27301","島本町",2,1,0,2],["27321","豊能町",5,4,0,6],["27322","能勢町",6,1,2,11],["27341","忠岡町",4,1,0,0],["27361","熊取町",4,2,0,5],["27362","田尻町",2,0,0,0],["27366","岬町",4,2,0,3],["27381","太子町",8,2,0,9],["27381","河南町",2,0,0,1],["27382","千早赤阪村",4,0,0,1],["27382","河南町",11,9,0,4],["27383","千早赤阪村",6,2,0,8]];
var GX_OSAKA_GUN_PAIRS=[["","中区",6,4,0,0],["","交野市",5,4,0,1],["","住之江区",0,1,0,0],["","住吉区",2,2,0,0],["","八尾市",5,4,0,3],["","北区",6,1,0,0],["","千早赤阪村",1,1,0,6],["","南区",7,7,0,6],["","吹田市",5,2,0,1],["","和泉市",9,8,0,22],["","四条畷市",7,5,0,0],["","堺区",0,1,0,0],["","大東市",8,0,0,0],["","大阪狭山市",19,2,0,10],["","太子町",4,0,0,6],["","守口市",1,1,0,0],["","富田林市",13,6,0,10],["","寝屋川市",5,4,0,3],["","岸和田市",7,7,0,11],["","島本町",1,0,0,0],["","平野区",5,3,0,1],["","忠岡町",1,0,0,0],["","摂津市",5,1,0,0],["","東住吉区",2,1,0,0],["","東区",5,3,0,0],["","東大阪市",7,7,0,2],["","東淀川区",1,2,0,0],["","松原市",13,2,0,0],["","枚方市",11,8,0,3],["","柏原市",7,8,0,8],["","池田市",4,3,0,3],["","河内長野市",16,0,0,12],["","河南町",7,3,0,2],["","泉佐野市",9,3,0,5],["","泉南市",9,2,0,5],["","泉大津市",3,2,0,0],["","熊取町",5,0,0,2],["","田尻町",4,0,0,0],["","箕面市",7,1,0,5],["","美原区",11,1,0,5],["","羽曳野市",21,1,0,8],["","能勢町",1,0,0,0],["","茨木市",13,6,0,4],["","藤井寺市",14,3,0,2],["","西区",3,1,0,0],["","豊中市",4,2,0,1],["","豊能町",2,0,0,0],["","貝塚市",9,0,0,13],["","門真市",1,3,0,1],["","阪南市",7,3,0,1],["","高槻市",11,4,0,1],["","高石市",3,0,0,0],["","鶴見区",1,1,0,0],["三島郡","島本町",2,1,0,2],["南河内郡","千早赤阪村",10,2,0,9],["南河内郡","太子町",8,2,0,9],["南河内郡","河南町",13,9,0,5],["泉北郡","忠岡町",4,1,0,0],["泉南郡","岬町",4,2,0,3],["泉南郡","熊取町",4,2,0,5],["泉南郡","田尻町",2,0,0,0],["豊能郡","能勢町",6,1,2,11],["豊能郡","豊能町",5,4,0,6]];
var GX_OSAKA_GUN_TOTALS=[["",630],["三島郡",5],["南河内郡",67],["泉北郡",5],["泉南郡",22],["豊能郡",35]];
var GX_OSAKA_MISSING_CLASS=[{"record_index_zero_based":0,"JCODE":"27214","municipality_name":"千早赤阪村","gun":"","landuse":"樹園地","missing_fields":["包括_統群","統群コード","亜群コード","群コード"]},{"record_index_zero_based":1,"JCODE":"27214","municipality_name":"富田林市","gun":"","landuse":"樹園地","missing_fields":["包括_統群","統群コード","亜群コード","群コード"]}];
function gxOsakaSoilValidate(){
 if(GX_OSAKA_CODE_PAIRS.length!==129||GX_OSAKA_GUN_PAIRS.length!==63||GX_OSAKA_MISSING_CLASS.length!==2)throw Error('P55_OSAKA_PAIR_COUNT');
 var fmtArr=[0,0,0,0],cn=new Map(),nc=new Map(),unique=new Set(),foreign=0,foreignPairs=0;
 GX_OSAKA_CODE_PAIRS.forEach(function(r){
  if(r.length!==6||!/^(26|27)[0-9]{3}$/.test(r[0])||!r[1]||r.slice(2).some(function(v){return !Number.isSafeInteger(v)||v<0;}))throw Error('P55_OSAKA_JCODE_FORMAT');
  var key=r[0]+'|'+r[1];if(unique.has(key))throw Error('P55_OSAKA_JCODE_DUPLICATE');unique.add(key);
  if(!cn.has(r[0]))cn.set(r[0],new Set());cn.get(r[0]).add(r[1]);
  if(!nc.has(r[1]))nc.set(r[1],new Set());nc.get(r[1]).add(r[0]);
  r.slice(2).forEach(function(v,i){fmtArr[i]+=v;});
  if(!r[0].startsWith('27')){foreign+=r.slice(2).reduce(function(a,b){return a+b;},0);foreignPairs++;}
 });
 if(cn.size!==57||nc.size!==54||foreign!==7||foreignPairs!==5||[...cn.values()].filter(function(x){return x.size>1;}).length!==31||[...nc.values()].filter(function(x){return x.size>1;}).length!==41)throw Error('P55_OSAKA_CODE_NAME_CONFLICT');
 if(fmtArr.some(function(v,i){return v!==GX_OSAKA_LANDUSE[i][1];})||fmtArr.reduce(function(a,b){return a+b;},0)!==764)throw Error('P55_OSAKA_LANDUSE_PARITY');
 var named=new Set(),gtotal={},gland=[0,0,0,0],seen=new Set(),blank=0;
 GX_OSAKA_GUN_PAIRS.forEach(function(r){if(r[0])named.add(r[1]);});
 GX_OSAKA_GUN_PAIRS.forEach(function(r){
  if(r.length!==6||!r[1]||r.slice(2).some(function(v){return !Number.isSafeInteger(v)||v<0;}))throw Error('P55_OSAKA_GUN_FORMAT');
  var key=r[0]+'|'+r[1];if(seen.has(key))throw Error('P55_OSAKA_GUN_DUPLICATE');seen.add(key);
  var n=r.slice(2).reduce(function(a,b){return a+b;},0);
  gtotal[r[0]]=(gtotal[r[0]]||0)+n;
  r.slice(2).forEach(function(v,i){gland[i]+=v;});
  if(!r[0]&&named.has(r[1]))blank+=n;
 });
 if(blank!==46||GX_OSAKA_GUN_TOTALS.some(function(r){return gtotal[r[0]]!==r[1];})||gland.some(function(x,i){return x!==fmtArr[i];}))throw Error('P55_OSAKA_GUN_MISSING_PARITY');
 if(GX_OSAKA_MISSING_CLASS.some(function(r,i){return r.record_index_zero_based!==i||r.JCODE!=='27214'||r.landuse!=='樹園地'||r.missing_fields.length!==4;})||GX_OSAKA_MISSING_CLASS[0].municipality_name!=='千早赤阪村'||GX_OSAKA_MISSING_CLASS[1].municipality_name!=='富田林市')throw Error('P55_OSAKA_SOIL_NULL_GUARD');
 return true;
}
function gxOsakaSoilPanel(prefCode){
 if(prefCode!=='27')return '';
 gxOsakaSoilValidate();
 var fmt=function(n){return Number(n).toLocaleString('ja-JP');};
 var cards=GX_OSAKA_LANDUSE.map(function(r){return '<article class="gx-data-card"><span class="gx-kicker">地目区分 / Polygon features</span><strong>'+fmt(r[1])+' <small>件</small></strong><p>'+gxEsc(r[0])+'（面積haではありません）</p></article>';}).join('');
 var cn=new Map(),nc=new Map();
 GX_OSAKA_CODE_PAIRS.forEach(function(r){cn.set(r[0],(cn.get(r[0])||0)+1);nc.set(r[1],(nc.get(r[1])||0)+1);});
 var head='<thead><tr><th scope="col">市区町村名（原本）</th><th scope="col">JCODE（原本）</th><th scope="col">田</th><th scope="col">普通畑</th><th scope="col">牧草地</th><th scope="col">樹園地</th><th scope="col">合計</th><th scope="col">照合状態</th></tr></thead>';
 var rows=GX_OSAKA_CODE_PAIRS.map(function(r){
  var warnings=[];
  if(!r[0].startsWith('27'))warnings.push('府外JCODE：京都府系26');
  if(cn.get(r[0])>1||nc.get(r[1])>1)warnings.push('JCODE・名称複数対応');
  return '<tr><th scope="row">'+gxEsc(r[1])+'</th><td>'+gxEsc(r[0])+'</td>'+r.slice(2).map(function(x){return '<td>'+fmt(x)+'</td>';}).join('')+'<td>'+fmt(r.slice(2).reduce(function(a,b){return a+b;},0))+'</td><td>'+(warnings.length?gxEsc(warnings.join('／'))+'・要照合':'原本値')+'</td></tr>';
 }).join('');
 var hasGun=new Set(GX_OSAKA_GUN_PAIRS.filter(function(r){return !!r[0];}).map(function(r){return r[1];}));
 var gunRow=GX_OSAKA_GUN_TOTALS.filter(function(r){return !!r[0];}).map(function(r){return '<tr><th scope="row">'+gxEsc(r[0])+'</th><td>'+fmt(r[1])+'</td></tr>';}).join('');
 var gunDetail=GX_OSAKA_GUN_PAIRS.map(function(r){
  return '<tr><th scope="row">'+gxEsc(r[1])+'</th><td>'+gxEsc(r[0]||'（空欄）')+'</td>'+r.slice(2).map(function(x){return '<td>'+fmt(x)+'</td>';}).join('')+'<td>'+(!r[0]&&hasGun.has(r[1])?'同名の郡名付き記録あり・要照合':'原本値')+'</td></tr>';
 }).join('');
 var blanks=GX_OSAKA_MISSING_CLASS.map(function(r){return '<tr><th scope="row">'+gxEsc(r.municipality_name)+'</th><td>'+gxEsc(r.JCODE)+'</td><td>'+gxEsc(r.landuse)+'</td><td>'+gxEsc(r.missing_fields.join('・'))+'</td></tr>';}).join('');
 return '<section class="gx-dashboard" aria-labelledby="gx-osaka-soil-title">'+
  '<div class="gx-section-heading"><span class="gx-kicker">OSAKA SOIL GIS · P55 · ORIGINAL ATTRIBUTES AUDITED</span>'+
  '<h2 id="gx-osaka-soil-title">大阪府の農耕地土壌GISを確認する。</h2>'+
  '<p>原本JGD2000の土壌ポリゴン764件。田391件、普通畑158件、牧草地2件、樹園地213件。市区町村名54種類、JCODE57種類、組合せ129通り。土壌群12種類・詳細分類43種類（空欄を含む）。原本XML作成日2017年1月17日。</p></div>'+
  '<p class="gx-anomaly"><b>府外JCODE・郡名空欄・土壌分類欠損を要照合：</b>大阪府「27」以外の京都府「26」系JCODEが7ポリゴン（5組合せ）。31コードが複数名称に、41名称が複数コードに対応。GUN空欄630件のうち、郡名付きレコードも存在する町村名について原本GUNが空欄のものは46件。千早赤阪村・富田林市の樹園地各1件（計2件）は包括_統群・統群コード・亜群コード・群コードがすべて空欄。元データを補完・正規化せず、自治体統計との自動JOINは保留します。</p>'+
  '<div class="gx-detail-grid">'+cards+'</div>'+
  '<details><summary>原本GUN（郡名）別の件数を見る</summary><div class="scroll"><table><thead><tr><th scope="col">郡名</th><th scope="col">ポリゴン件数</th></tr></thead><tbody>'+gunRow+'</tbody></table></div><p>GUN空欄630件・記載134件。ここに示すのは原本の属性件数であり、現在の郡別農地面積ではありません。</p></details>'+
  '<details><summary>原本GUN×名称63組合せを見る</summary><div class="scroll"><table><thead><tr><th>市区町村名</th><th>郡名GUN（原本）</th><th>田</th><th>普通畑</th><th>牧草地</th><th>樹園地</th><th>照合状態</th></tr></thead><tbody>'+gunDetail+'</tbody></table></div></details>'+
  '<details><summary>JCODE×名称129組合せを見る（要照合）</summary><div class="scroll"><table>'+head+'<tbody>'+rows+'</tbody></table></div></details>'+
  '<details><summary>土壌分類が空欄の2ポリゴンを見る</summary><div class="scroll"><table><thead><tr><th>原本市区町村名</th><th>JCODE</th><th>地目</th><th>空欄の土壌分類属性</th></tr></thead><tbody>'+blanks+'</tbody></table></div></details>'+
  '<p class="gx-advisory"><b>出典と科学・配布上の制約：</b>農研機構「日本土壌インベントリー」は配布元候補だが、公式大阪府ZIPとのSHA一致・個別ライセンス適用は未確認。再配布権利が確定するまで原本SHP・DBF・ZIPを公開GitHubに複製せず、原本SHAと派生集計のみ登録。ポリゴン件数は農地面積ha、筆数、CH₄実測、土壌炭素、CO₂e削減量、認証済クレジット数量ではありません。現行の市区町村統計・2024年水稲統計・JAXA土地被覆との無検証な行政コードJOINは行いません。原本監査台帳：research/p55-osaka-soil-shapefile-source-v1.json。検証：docs/p55-osaka-soil-gis-ja.md。</p></section>';
}
