/* P21: JAXA user-supplied 2024 v25.04 cumulative source summary; read-only. */
'use strict';
var GX_JAXA_SELECTED_TILE='LC_N30E131';
var GX_JAXA_CATEGORIES=["水域","人工構造物","水田","畑地","草地","落葉広葉樹林","落葉針葉樹林","常緑広葉樹林","常緑針葉樹林","裸地","竹林","ソーラーパネル","湿地","農業用温室","岩礁・干潟"];
var GX_JAXA_TILES=[{"id":"LC_N24E131","bounds":[131,24,132,25],"paddy":0,"water":143981729,"counts":[143981729,0,0,0,10083,0,0,62,0,5375,0,0,0,0,2751],"ha":null},{"id":"LC_N30E131","bounds":[131,30,132,31],"paddy":32028,"water":141661823,"counts":[141661823,32432,32028,316846,163211,404,3,1258129,237174,50040,171086,311,7443,1107,67963],"ha":null},{"id":"LC_N31E139","bounds":[139,31,140,32],"paddy":0,"water":143999206,"counts":[143999206,1,0,0,0,0,0,0,0,72,0,0,0,0,721],"ha":null},{"id":"LC_N30E129","bounds":[129,30,130,31],"paddy":0,"water":143766652,"counts":[143766652,861,0,1925,25342,1414,8,116478,539,19246,62474,0,21,11,5029],"ha":null},{"id":"LC_N24E153","bounds":[153,24,154,25],"paddy":0,"water":143975747,"counts":[143975747,2241,0,0,12548,0,0,142,0,4849,0,0,0,0,4473],"ha":null},{"id":"LC_N34E131","bounds":[131,34,132,35],"paddy":2709897,"water":66521080,"counts":[66521080,4032097,2709897,2290603,2810157,15499825,12718,21230041,21035752,680464,6092475,125590,806826,56195,96280],"ha":null},{"id":"LC_N42E145","bounds":[145,42,146,43],"paddy":0,"water":143981391,"counts":[143981391,2,0,0,9800,2731,17,11,2751,1831,34,0,48,0,1384],"ha":null},{"id":"LC_N38E139","bounds":[139,38,140,39],"paddy":6828139,"water":80347201,"counts":[80347201,2277400,6828139,1446216,3813692,39400908,271193,138528,7912196,451537,167335,22781,744446,138716,39712],"ha":null},{"id":"LC_N35E140","bounds":[140,35,141,36],"paddy":12721336,"water":76927932,"counts":[76927932,14948497,12721336,6489465,5441346,3427479,14403,5668902,6463351,1008274,6457514,423475,3427344,376599,204083],"ha":null},{"id":"LC_N44E142","bounds":[142,44,143,45],"paddy":1365944,"water":16759638,"counts":[16759638,535596,1365944,4853202,15988755,93690393,2226663,161,6647269,285104,0,1658,1575659,19799,50159],"ha":null},{"id":"LC_N42E142","bounds":[142,42,143,43],"paddy":398614,"water":41519836,"counts":[41519836,631502,398614,2953991,13334476,73222708,5539079,73785,4784946,640996,6753,19040,750773,84382,39119],"ha":null},{"id":"LC_N36E136","bounds":[136,36,137,37],"paddy":8173654,"water":64297088,"counts":[64297088,7920630,8173654,2536218,4762060,39407471,223246,1190042,11724993,827389,1815254,90439,896326,107588,27602],"ha":null},{"id":"LC_N29E129","bounds":[129,29,130,30],"paddy":345,"water":142629951,"counts":[142629951,5914,345,3183,167532,16477,820,607003,35247,238903,241254,3,9232,12,44124],"ha":null},{"id":"LC_N45E148","bounds":[148,45,149,46],"paddy":276,"water":125209878,"counts":[125209878,4287,276,28,10345795,7144754,214272,0,38913,319830,0,0,536155,0,185812],"ha":null},{"id":"LC_N35E133","bounds":[133,35,134,36],"paddy":2660132,"water":70919619,"counts":[70919619,3553904,2660132,2911966,3910154,22899399,125321,5070983,26502525,471719,4046077,81002,685683,112569,48947],"ha":null},{"id":"LC_N32E131","bounds":[131,32,132,33],"paddy":2655618,"water":40555140,"counts":[40555140,2901616,2655618,2418999,7699131,18911774,196626,26422850,33712312,1204299,5875233,112510,1009757,214699,109436],"ha":null}];
function gxJaxaValidate(){
 if(GX_JAXA_TILES.length!==16||GX_JAXA_CATEGORIES.length!==15)throw Error('JAXA_BATCH_INCOMPLETE');
 GX_JAXA_TILES.forEach(function(t){
  if(t.counts.length!==15||t.counts.some(function(v){return !Number.isSafeInteger(v)||v<0;})||
   t.counts.reduce(function(a,b){return a+b;},0)!==144000000||
   t.counts[0]!==t.water||t.counts[2]!==t.paddy||t.ha!==null)throw Error('JAXA_CATEGORY_COUNT_MISMATCH');
 });
 return true;
}
function gxJaxaLandcoverPanel(){
 gxJaxaValidate();
 var t=GX_JAXA_TILES.find(function(x){return x.id===GX_JAXA_SELECTED_TILE;})||GX_JAXA_TILES[1];
 var fmt=function(v){return v.toLocaleString('ja-JP');};
 var opts=GX_JAXA_TILES.map(function(x){return '<option value="'+x.id+'"'+(x.id===t.id?' selected':'')+'>'+x.id+'</option>';}).join('');
 var rows=GX_JAXA_CATEGORIES.map(function(name,i){return '<tr><th scope="row">'+(i+1)+'</th><td>'+name+'</td><td>'+fmt(t.counts[i])+'</td><td>'+(100*t.counts[i]/144000000).toFixed(4)+'%</td></tr>';}).join('');
 return '<section class="gx-dashboard" aria-labelledby="gx-jaxa-title">'+
 '<div class="gx-section-heading"><span class="gx-kicker">09 / JAXA 2024 LAND COVER · v25.04 · P21–P24</span>'+
 '<h2 id="gx-jaxa-title">土地被覆の原典から、水田分類を確認する。</h2>'+
 '<p>JAXAの2024年GeoTIFF'+GX_JAXA_TILES.length+'枚を１度四方ずつ受入。元データ12,000×12,000画素と15分類のハッシュ・画素数を検査しています。全国の取り込み完了ではありません。</p></div>'+
 '<label class="gx-filter-label" for="gx-jaxa-tile-select">取り込み済みのタイル</label>'+
 '<select class="gx-filter-select" id="gx-jaxa-tile-select">'+opts+'</select>'+
 '<div class="gx-detail-grid">'+
 '<article class="gx-data-card"><span class="gx-kicker">水田 / 分類3</span><strong>'+fmt(t.paddy)+' <small>画素</small></strong><p>区画数・面積haではありません</p></article>'+
 '<article class="gx-data-card"><span class="gx-kicker">水域 / 分類1</span><strong>'+fmt(t.water)+' <small>画素</small></strong><p>水域は有効な分類。NoDataとは異なります</p></article>'+
 '<article class="gx-data-card"><span class="gx-kicker">水域以外</span><strong>'+fmt(144000000-t.water)+' <small>画素</small></strong><p>水田以外の陸域等を含む値</p></article></div>'+
 '<p class="gx-advisory">選択範囲：北緯'+t.bounds[1]+'〜'+t.bounds[3]+'度、東経'+t.bounds[0]+'〜'+t.bounds[2]+'度。原本GeoTIFFは再配布していません。</p>'+
 '<details class="gx-jaxa-details"><summary>15分類をすべて確認</summary><div class="scroll"><table><thead><tr><th>コード</th><th>分類</th><th>画素数</th><th>全画素%</th></tr></thead><tbody>'+rows+'</tbody></table></div></details>'+
 '<p class="gx-advisory"><b>科学的境界：</b>2024年のJAXA土地被覆図と2001〜2015年のCH₄推計は別年代・別座標系。自動重畳して排出量や削減量を確定しない。EPSG:4326の格子を一定面積とみなさないため、haへの換算は未実施。原本再配布条件・現地分類精度も別途確認が必要。<a href="https://www.eorc.jaxa.jp/ALOS/jp/dataset/lulc/lulc_v2504_j.htm" target="_blank" rel="noopener noreferrer">JAXA出典</a> · <a href="https://github.com/Takzin1/NaFT/blob/main/docs/p21-jaxa-lulc-batch01-ja-2026-11-03.md" target="_blank" rel="noopener noreferrer">P21技術記録</a> · <a href="https://github.com/Takzin1/NaFT/blob/main/docs/p22-jaxa-lulc-batch02-ja-2026-11-03.md" target="_blank" rel="noopener noreferrer">P22追加タイル監査</a> · <a href="https://github.com/Takzin1/NaFT/blob/main/docs/p23-jaxa-lulc-batch03-ja-2026-11-03.md" target="_blank" rel="noopener noreferrer">P23 第３バッチ監査</a> · <a href="https://github.com/Takzin1/NaFT/blob/main/docs/p24-jaxa-lulc-batch04-ja-2026-11-03.md" target="_blank" rel="noopener noreferrer">P24 第４バッチ監査</a></p></section>';
}
