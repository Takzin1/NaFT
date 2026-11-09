/* P35: Fukushima agricultural soil GIS, original ZIP audited; polygon feature counts only. */
'use strict';
var GX_FUKUSHIMA_SOURCE_HASH="db264851d4e3ca44bcb90bf778e1cfa58a877f1af1ce1a5c77958ea1f56f7de6";
var GX_FUKUSHIMA_LANDUSE=[["田",865],["普通畑",856],["牧草地",259],["樹園地",427]];
var GX_FUKUSHIMA_MUNICIPALITIES=[["07201","福島市",26,24,10,29],["07202","会津若松市",20,20,2,13],["07203","郡山市",32,30,8,24],["07204","いわき市",20,23,7,11],["07205","白河市",23,25,7,13],["07207","須賀川市",31,31,4,24],["07208","喜多方市",24,25,9,12],["07209","相馬市",18,16,2,11],["07210","二本松市",19,23,14,19],["07211","田村市",19,20,13,17],["07212","南相馬市",25,21,11,16],["07213","伊達市",17,20,11,19],["07214","本宮市",16,13,4,10],["07301","桑折町",16,13,1,14],["07303","国見町",11,9,0,11],["07308","川俣町",11,15,8,13],["07322","大玉村",16,17,6,8],["07342","鏡石町",14,15,5,11],["07344","天栄村",20,17,4,9],["07362","下郷町",12,13,2,7],["07364","桧枝岐村",0,1,0,0],["07367","只見町",9,12,0,0],["07368","南会津町",20,19,4,9],["07402","北塩原村",5,7,1,0],["07405","西会津町",12,12,1,4],["07407","磐梯町",4,4,2,2],["07408","猪苗代町",16,5,3,4],["07421","会津坂下町",16,17,2,12],["07422","湯川村",9,7,3,3],["07423","柳津町",15,14,1,1],["07444","三島町",5,7,1,1],["07445","金山町",8,5,1,2],["07446","昭和村",10,8,0,1],["07447","会津美里町",15,17,1,14],["07461","西郷村",14,10,3,0],["07464","泉崎村",16,12,1,2],["07465","中島村",12,11,4,2],["07466","矢吹町",23,18,6,6],["07481","棚倉町",21,20,2,2],["07482","矢祭町",9,16,1,5],["07483","塙町",13,17,3,8],["07484","鮫川村",10,10,5,0],["07501","石川町",13,12,6,6],["07502","玉川村",12,16,2,4],["07503","平田村",10,12,8,3],["07504","浅川町",14,13,3,2],["07505","古殿町",12,11,4,1],["07521","三春町",5,10,5,3],["07522","小野町",12,13,5,2],["07541","広野町",10,7,2,1],["07542","楢葉町",14,14,5,6],["07543","富岡町",14,12,3,4],["07544","川内村",12,13,6,4],["07545","大熊町",17,17,6,9],["07546","双葉町",11,9,3,1],["07547","浪江町",23,18,9,7],["07548","葛尾村",9,14,10,1],["07561","新地町",12,11,2,3],["07564","飯舘村",13,15,7,1]];
function gxFukushimaSoilValidate(){
 if(GX_FUKUSHIMA_MUNICIPALITIES.length!==59 || GX_FUKUSHIMA_LANDUSE.length!==4)throw Error('P35_FUKUSHIMA_MUNICIPALITIES');
 var codes=new Set(),totals=[0,0,0,0];
 GX_FUKUSHIMA_MUNICIPALITIES.forEach(function(row){
  if(row.length!==6 || !/^07[0-9]{3}$/.test(row[0]) || codes.has(row[0]) || typeof row[1]!=='string' || !row[1])throw Error('P35_FUKUSHIMA_CODE');
  codes.add(row[0]);
  row.slice(2).forEach(function(n,i){if(!Number.isSafeInteger(n)||n<0)throw Error('P35_FUKUSHIMA_COUNT');totals[i]+=n;});
 });
 if(totals.reduce(function(a,b){return a+b;},0)!==2407)throw Error('P35_FUKUSHIMA_TOTAL');
 GX_FUKUSHIMA_LANDUSE.forEach(function(row,i){if(totals[i]!==row[1])throw Error('P35_FUKUSHIMA_LANDUSE_PARITY');});
 return true;
}
function gxFukushimaSoilPanel(prefCode){
 if(prefCode!=='07')return '';
 gxFukushimaSoilValidate();
 var fmt=function(n){return Number(n).toLocaleString('ja-JP');};
 var cards=GX_FUKUSHIMA_LANDUSE.map(function(row){
  return '<article class="gx-data-card"><span class="gx-kicker">地目区分 / Polygon features</span><strong>'+fmt(row[1])+' <small>件</small></strong><p>'+gxEsc(row[0])+'（面積haではありません）</p></article>';
 }).join('');
 var head='<thead><tr><th scope="col">市町村名（原本）</th><th scope="col">JCODE</th><th scope="col">田</th><th scope="col">普通畑</th><th scope="col">牧草地</th><th scope="col">樹園地</th><th scope="col">計</th></tr></thead>';
 var rows=GX_FUKUSHIMA_MUNICIPALITIES.map(function(row){
  return '<tr><th scope="row">'+gxEsc(row[1])+'</th><td>'+gxEsc(row[0])+'</td>'+row.slice(2).map(function(n){return '<td>'+fmt(n)+'</td>';}).join('')+'<td>'+fmt(row.slice(2).reduce(function(a,b){return a+b;},0))+'</td></tr>';
 }).join('');
 return '<section class="gx-dashboard" aria-labelledby="gx-fukushima-soil-title">'+
  '<div class="gx-section-heading"><span class="gx-kicker">FUKUSHIMA SOIL GIS · P35 · SOURCE AUDITED</span>'+
  '<h2 id="gx-fukushima-soil-title">福島県の農耕地土壌GISを確認する。</h2>'+
  '<p>提供元ZIPからJGD2000の土壌ポリゴン2,407件を照合。59市町村別の地目区分と、土壌群19種類・詳細分類77種類を整理。原本Esriメタデータ作成日は2017年1月17日で、現行の地目・農地面積を意味しません。</p></div>'+
  '<div class="gx-detail-grid">'+cards+'</div>'+
  '<details><summary>59市町村別の地目レコード数を見る</summary><div class="scroll"><table>'+head+'<tbody>'+rows+'</tbody></table></div></details>'+
  '<p class="gx-advisory"><b>来歴と科学的境界：</b>数字は土壌ポリゴンの件数であり、農地面積ha、筆数、土壌炭素量、CH₄実測値、CO₂e削減量ではありません。原Shapefileの配布元と再配布ライセンスは独立確認できていないため、生データは公開GitHubへ複製せず、原本ハッシュと派生集計のみ登録しています。2024年水稲統計・JAXA土地被覆との自動結合、クレジット認証・発行はしません。原本に放射性物質の測定値、避難指示区域の状態、営農再開の許可・実績は含まれず、土壌のポリゴンだけで安全性・営農可否を判断しません。'+
  '原本ハッシュ・監査台帳：research/p35-fukushima-soil-shapefile-source-v1.json。検証手順：docs/p35-fukushima-soil-gis-ja.md。</p></section>';
}
