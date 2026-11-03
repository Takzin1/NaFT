/* P19 real source-derived raster summary; public view is not in situ or formal MRV. */
'use strict';
var GX_CH4_SELECTED_YEAR=2015;
var GX_CH4_STATS=[
[2001,29192,68.030985,139.730167,360.190918],[2002,30486,70.850312,140.870491,356.897156],
[2003,31075,63.571232,129.281921,299.745331],[2004,31179,66.3413,129.400113,318.727173],
[2005,29824,73.549062,151.842131,399.83139],[2006,31614,71.279339,142.717609,413.652374],
[2007,32883,69.171134,147.440076,405.187408],[2008,30162,69.010043,144.533551,454.501221],
[2009,29051,72.88739,151.266907,449.449097],[2010,28043,73.707338,150.241812,417.799103],
[2011,27167,71.843749,157.392694,448.117676],[2012,24885,71.652753,151.225833,440.295868],
[2013,26911,77.191734,159.015823,412.54071],[2014,26056,68.838439,143.258995,319.083954],
[2015,24608,71.715468,151.832153,344.02478]];
function gxCh4PackedByYear(year){
 var sources=[GX_CH4_GRID_2001_2005,GX_CH4_GRID_2006_2010,GX_CH4_GRID_2011_2015];
 for(var i=0;i<sources.length;i++)if(Object.prototype.hasOwnProperty.call(sources[i],String(year)))return sources[i][String(year)];
 return null;
}
function gxCh4DecodedTiles(year){
 var packed=gxCh4PackedByYear(year),rec=GX_CH4_STATS.find(function(s){return s[0]===Number(year);});
 if(!rec||typeof packed!=='string'||!packed.length||packed.length%8)throw Error('NAFT_P19_DATA_OR_YEAR_INVALID');
 var tiles=[],n=0,last=-1;
 for(var i=0;i<packed.length;i+=8){
  var idx=parseInt(packed.slice(i,i+2),36),mean10=parseInt(packed.slice(i+2,i+5),36),count=parseInt(packed.slice(i+5,i+8),36);
  if(!Number.isInteger(idx)||idx<=last||idx>=1248||!Number.isInteger(mean10)||mean10<0||mean10>10000||!Number.isInteger(count)||count<1||count>5000)throw Error('NAFT_P19_TILE_TAMPERING');
  last=idx;n+=count;
  tiles.push({index:idx,col:idx%48,row:Math.floor(idx/48),mean:mean10/10,count:count});
 }
 if(n!==rec[1])throw Error('NAFT_P19_TILE_COUNT_REPLAY_MISMATCH');
 return tiles;
}
function gxCh4SpatialPanel(){
 var year=GX_CH4_SELECTED_YEAR,rec=GX_CH4_STATS.find(function(s){return s[0]===year;})||GX_CH4_STATS[14];
 year=rec[0];var tiles=gxCh4DecodedTiles(year),fmt=function(n){return Number(n).toLocaleString('ja-JP');};
 var select=GX_CH4_STATS.map(function(s){return '<option value="'+s[0]+'"'+(s[0]===year?' selected':'')+'>'+s[0]+'年</option>';}).join('');
 var colors=['#d3e7b3','#9acb91','#60ae83','#318d75','#187063','#0e514e'];
 var map=tiles.map(function(t){
  var c=t.mean>=150?5:t.mean>=105?4:t.mean>=70?3:t.mean>=45?2:t.mean>=20?1:0;
  var op=(0.48+0.48*Math.min(1,Math.sqrt(t.count/500))).toFixed(2);
  return '<rect x="'+(10+12*t.col)+'" y="'+(8+12*t.row)+'" width="11.5" height="11.5" rx="1.2" fill="'+colors[c]+'" opacity="'+op+'"><title>'+year+'年：タイル'+(t.col+1)+','+(t.row+1)+' / 正値'+fmt(t.count)+'画素 / 正値画素平均'+t.mean.toFixed(1)+' mg CH₄/m²/日</title></rect>';
 }).join('');
 var points=GX_CH4_STATS.map(function(s,i){return (i?'L':'M')+(32+i*38)+','+(154-(s[2]-60)*4.5).toFixed(1);}).join(' ');
 var selectedX=32+(year-2001)*38,selectedY=(154-(rec[2]-60)*4.5).toFixed(1);
 var graph='<svg role="img" aria-label="年別正値画素の条件付き平均値の推移" viewBox="0 0 610 186" class="gx-ch4-svg"><line x1="30" y1="154" x2="580" y2="154" stroke="#b4c9ba"/><path d="'+points+'" fill="none" stroke="#177158" stroke-width="2.5" stroke-linejoin="round"/><circle cx="'+selectedX+'" cy="'+selectedY+'" r="6" fill="#b46c35" stroke="white" stroke-width="2"/><text x="30" y="176" font-size="12" fill="#4d6358">2001</text><text x="284" y="176" font-size="12" fill="#4d6358">2008</text><text x="535" y="176" font-size="12" fill="#4d6358">2015</text></svg>';
 var svg='<svg role="img" aria-label="Sinusoidal座標上の'+year+'年の水稲CH₄ラスタ縮約地図" viewBox="0 0 598 340" class="gx-ch4-svg gx-ch4-map"><rect x="10" y="8" width="576" height="312" rx="3" fill="#e7ede5"/>'+map+'<text x="12" y="332" font-size="9" fill="#51685a">Sinusoidal投影 · 5km原画像 → 48×26集計 · 行政界なし</text></svg>';
 return '<section class="gx-dashboard" aria-labelledby="gx-ch4-title"><div class="gx-section-heading"><span class="gx-kicker">08 / RICE CH₄ · 15 ANNUAL GEOTIFF RASTERS · P19</span><h2 id="gx-ch4-title">アジアの水稲メタン、2001〜2015年の空間分布。</h2><p>ユーザー提供ZIPを解凍し、15枚すべての同一5kmラスタの値・ハッシュを検証。48×26に粗視化した不可逆集計データを描画します。国内47都道府県統計や観測圃場データとは別の研究シリーズです。</p></div>'+
 '<label class="gx-filter-label" for="gx-ch4-year-select">ラスタの年を選択</label><select class="gx-filter-select" id="gx-ch4-year-select">'+select+'</select>'+
 '<div class="gx-detail-grid"><article class="gx-data-card"><span class="gx-kicker">正値画素 / '+year+'</span><strong>'+fmt(rec[1])+' <small>セル</small></strong><p>元の5km格子で値が0より大きい画素数。水田筆数や実際の排出面積ではない。</p></article>'+
 '<article class="gx-data-card"><span class="gx-kicker">正値画素の平均</span><strong>'+rec[2].toFixed(2)+' <small>mg CH₄/m²/日</small></strong><p>正値画素だけの条件付き平均。全域平均ではありません。</p></article>'+
 '<article class="gx-data-card"><span class="gx-kicker">正値画素の90パーセンタイル</span><strong>'+rec[3].toFixed(2)+' <small>mg CH₄/m²/日</small></strong><p>最大 '+rec[4].toFixed(2)+'。統計値の比較は各年の正値画素集合の違いに留意。</p></article></div>'+
 '<figure class="gx-ch4-figure"><figcaption>15年間の正値画素平均。年ごとに集計対象画素が異なるため排出削減率ではありません。</figcaption>'+graph+'</figure>'+
 '<figure class="gx-ch4-figure"><figcaption>'+year+'年 / 色＝正値画素の平均、透明度＝正値画素数の密度。地理・制度上の認証地図ではありません。</figcaption>'+svg+'</figure>'+
 '<p class="gx-advisory"><b>研究利用上の制約：</b>ゼロ画素の意味（非水田・無排出・欠損）は未検証。縮約値は元5km画素を復元できず、行政区画や圃場レベルへの利用に不適切。データの発行者・ライセンス・モデルと実測の区別も未確認。正式AG-005係数、tCO₂e算定、J-クレジット審査へ自動昇格させません。<a href="https://github.com/Takzin1/NaFT/blob/main/docs/p19-asia-rice-ch4-annual-rasters-ja-2026-11-03.md" target="_blank" rel="noopener noreferrer">原資料SHA・検証仕様と留意点</a></p></section>';
}
