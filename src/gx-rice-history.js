/* P13: ORIGINAL user-uploaded MAFF rice XLS (2023, 2024), source-cell transcripts.
 * These are official aggregate crop statistics, not field CH4 data, emission factors
 * or certified carbon credits. Source original XLS binaries are NOT redistributed.
 * Per row: original Excel row, prefecture, D grain-area ha, E 1.70mm yield kg/10a,
 * F 1.70mm grain harvest t, G producer-sieve yield kg/10a,
 * I main-food area ha, J published main-food harvest t.
 * Year-to-year differences are allowed ONLY for the same F/D/E scope, not 2025 P12.
 */
'use strict';
var GX_RICE_HISTORY_SOURCE={
  2023:{name:'f002-05-001.xls',sheet:'f002-05-001',sha256:'3b0e088abed5aa9f187a5d83f4ea31797ee1c347af8e6005185b1a99feebdaed',bytes:54272,national:{area:1344000,yield10a:533,harvest:7165000,mainArea:1242000,mainHarvest:6610000}},
  2024:{name:'f002-06-001.xls',sheet:'f002-06-001',sha256:'e0fe569b201077da105688754bb9951df94db63fc547b5660fb77d9be0b9685d',bytes:46592,national:{area:1359000,yield10a:540,harvest:7345000,mainArea:1259000,mainHarvest:6792000}}
};
var GX_RICE_HISTORY_CSV={
2023:`26,北海道,93300,579,540200,555,82200,475900
27,青森,40500,614,248700,587,33800,207500
28,岩手,45200,551,249100,535,42800,235800
29,宮城,60900,566,344700,537,57200,323800
30,秋田,83000,552,458200,524,69900,385800
31,山形,61000,589,359300,564,52400,308600
32,福島,58400,561,327600,542,53100,297900
33,茨城,59700,530,316400,513,57800,306300
34,栃木,51400,553,284200,537,47200,261000
35,群馬,13900,504,70100,494,12400,62500
36,埼玉,28400,484,137500,472,27500,133100
37,千葉,47700,557,265700,550,45800,255100
38,東京,111,419,465,414,111,465
39,神奈川,2850,499,14200,486,2850,14200
40,新潟,115800,511,591700,502,100600,514100
41,富山,35200,528,185900,511,31200,164700
42,石川,23400,518,121200,508,20800,107700
43,福井,23300,500,116500,475,21500,107500
44,山梨,4750,542,25700,533,4660,25300
45,長野,30600,614,187900,601,29300,179900
46,岐阜,20700,484,100200,476,19700,95300
47,静岡,15100,519,78400,512,15000,77900
48,愛知,25800,480,123800,468,24700,118600
49,三重,25200,501,126300,483,24900,124700
50,滋賀,28300,504,142600,470,27000,136100
51,京都,13800,502,69300,489,13200,66300
52,大阪,4440,503,22300,489,4430,22300
53,兵庫,34200,497,170000,478,32500,161500
54,奈良,8250,517,42700,507,8200,42400
55,和歌山,5780,506,29200,498,5780,29200
56,鳥取,11900,481,57200,469,11700,56300
57,島根,16100,515,82900,489,15900,81900
58,岡山,27800,514,142900,497,26900,138300
59,広島,21100,535,112900,522,20500,109700
60,山口,17100,510,87200,493,16000,81600
61,徳島,9750,469,45700,459,9480,44500
64,香川,10200,496,50600,485,10100,50100
65,愛媛,12800,505,64600,483,12800,64600
66,高知,10300,454,46800,445,10200,46300
69,福岡,32800,480,157400,458,32300,155000
70,佐賀,22200,521,115700,500,21700,113100
71,長崎,10000,488,48800,477,10000,48800
72,熊本,30000,518,155400,496,28900,149700
73,大分,18300,491,89900,479,18100,88900
74,宮崎,14700,486,71400,477,12700,61700
77,鹿児島,17200,485,83400,476,15800,76600
80,沖縄,576,321,1850,314,544,1750`,
2024:`26,北海道,95000,592,562400,562,83700,495500
27,青森,42400,623,264200,598,37200,231800
28,岩手,45500,569,258900,546,43100,245200
29,宮城,62800,583,366100,550,58400,340500
30,秋田,84200,582,490000,552,72200,420200
31,山形,60800,583,354500,553,52400,305500
32,福島,62700,569,356800,546,56500,321500
33,茨城,62500,542,338800,523,59900,324700
34,栃木,53000,540,286200,521,49000,264600
35,群馬,14300,499,71400,483,12800,63900
36,埼玉,29600,476,140900,463,28400,135200
37,千葉,50600,569,287900,559,48300,274800
38,東京,107,414,443,405,107,443
39,神奈川,2840,481,13700,463,2840,13700
40,新潟,116200,536,622800,515,101400,543500
41,富山,35000,540,189000,515,31200,168500
42,石川,22300,521,116200,495,21200,110500
43,福井,23500,531,124800,494,21900,116300
44,山梨,4680,534,25000,518,4590,24500
45,長野,30300,620,187900,604,29000,179800
46,岐阜,21100,483,101900,474,19600,94700
47,静岡,14500,484,70200,472,14400,69700
48,愛知,26200,497,130200,480,25000,124300
49,三重,24900,485,120800,468,24500,118800
50,滋賀,28400,517,146800,484,27400,141700
51,京都,13600,527,71700,512,13000,68500
52,大阪,4290,483,20700,472,4290,20700
53,兵庫,34000,491,166900,475,32200,158100
54,奈良,8000,526,42100,517,7960,41900
55,和歌山,5680,506,28700,500,5680,28700
56,鳥取,11800,502,59200,491,11600,58200
57,島根,15900,505,80300,485,15700,79300
58,岡山,28000,510,142800,496,27200,138700
59,広島,20600,526,108400,515,20100,105700
60,山口,16800,513,86200,497,15800,81100
61,徳島,9890,470,46500,462,9790,46000
64,香川,9820,491,48200,481,9770,48000
65,愛媛,12700,502,63800,491,12700,63800
66,高知,10300,453,46700,444,10100,45800
69,福岡,32600,467,152200,442,32200,150400
70,佐賀,22400,505,113100,482,22000,111100
71,長崎,9420,487,45900,472,9360,45600
72,熊本,29700,516,153300,487,28800,148600
73,大分,18000,491,88400,459,17800,87400
74,宮崎,14500,481,69700,467,12400,59600
77,鹿児島,17100,470,80400,454,15600,73300
80,沖縄,599,326,1950,319,557,1820`
};
function gxRiceHistoryRows(year){
  if(!Object.prototype.hasOwnProperty.call(GX_RICE_HISTORY_CSV,year))throw new Error('UNSUPPORTED_RICE_YEAR');
  return GX_RICE_HISTORY_CSV[year].trim().split('\n').map(function(line,index){
    var v=line.split(',');
    if(v.length!==8)throw new Error('RICE_SOURCE_SHAPE');
    var n=v.slice(2).map(Number);
    if(n.some(function(x){return !Number.isSafeInteger(x)||x<0;}))throw new Error('RICE_SOURCE_NUMBER');
    return {code:String(index+1).padStart(2,'0'),name:v[1],excelRow:Number(v[0]),
      area:n[0],yield10a:n[1],harvest:n[2],producerSieveYield10a:n[3],
      mainFoodArea:n[4],mainFoodHarvest:n[5]};
  });
}
function gxRiceHistoryCompare(code){
  if(!/^(0[1-9]|[1-3][0-9]|4[0-7])$/.test(String(code)))throw new Error('PREFECTURE_CODE');
  var a=gxRiceHistoryRows(2023).find(function(x){return x.code===code;});
  var b=gxRiceHistoryRows(2024).find(function(x){return x.code===code;});
  if(!a||!b||a.name!==b.name)throw new Error('PREFECTURE_SOURCE_IDENTITY');
  return {status:'SAME_SCOPE_2023_2024_GRAIN_RICE_1_70MM_ONLY',prefecture:b.name,
    year2023:a,year2024:b,deltaHarvestT:b.harvest-a.harvest,
    deltaAreaHa:b.area-a.area,deltaYieldKg10a:b.yield10a-a.yield10a,
    mainFoodHarvestDeltaT:null,year2025Comparable:false,
    fieldMethaneMeasured:false,certifiedTco2e:null};
}
function gxRiceHistoryPanel(code){
  var comparison=gxRiceHistoryCompare(code),a=comparison.year2023,b=comparison.year2024;
  var num=function(x){return Number(x).toLocaleString('ja-JP');};
  var sign=function(x){return (x>0?'+':'')+num(x);};
  return '<section class="gx-dashboard" aria-labelledby="gx-rice-history-title">'+
    '<div class="gx-section-heading"><span class="gx-kicker">2023–2024 / ORIGINAL MAFF XLS · P13</span>'+
    '<h2 id="gx-rice-history-title">'+gxEsc(comparison.prefecture)+'の原本に基づく水稲統計</h2>'+
    '<p>ユーザー提供の令和5年産・令和6年産Excel（作物統計調査）から各47都道府県のセルを抽出。子実用1.70mm玄米の範囲のみ、2023→2024年の増減を示します。</p></div>'+
    '<div class="gx-detail-grid">'+[a,b].map(function(x,i){
      return '<article class="gx-data-card"><span class="gx-kicker">'+(i===0?'2023':'2024')+' / 子実用・1.70mm</span>'+
        '<strong>'+num(x.harvest)+' <small>t</small></strong><p>作付面積 '+num(x.area)+'ha / 単収 '+num(x.yield10a)+'kg/10a</p>'+
        '<p>主食用公表値 '+num(x.mainFoodHarvest)+'t（異なる集計範囲として保持）</p></article>';
    }).join('')+
    '<article class="gx-data-card"><span class="gx-kicker">2023→2024 / 同一定義のみ</span>'+
    '<strong>'+sign(comparison.deltaHarvestT)+' <small>t</small></strong>'+
    '<p>子実用面積 '+sign(comparison.deltaAreaHa)+'ha / 単収 '+sign(comparison.deltaYieldKg10a)+'kg/10a</p></article></div>'+
    '<p class="gx-advisory">出典：2023年 '+a.excelRow+'行、2024年 '+b.excelRow+'行、原表D/E/F/G/I/J列。'+
    '2025年P12の「生産者ふるい上主食用米」とは直接比較しません。'+
    '県別公表値の合算と全国公表値には丸め差があり、原表数値を補正しません。</p>'+
    '<p class="gx-advisory"><b>農業統計は水田CH₄実測値や認証済み削減量ではありません。</b> 原ファイルSHA-256は研究記録で固定。'+
    '元.xlsバイナリを公開リポジトリへ転載していません。</p></section>';
}
