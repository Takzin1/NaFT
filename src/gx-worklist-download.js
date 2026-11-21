/* P80 · Download the re-verification worklist (CSV) for the AG-005 and forest demos on #/gx-data.
 * Computed asynchronously after render and cached; the CSV is built by reverificationWorklist()/worklistCsv(). */
'use strict';
var GX_WORKLIST={cache:Object.create(null),pending:Object.create(null)};
var GX_WORKLIST_DEMOS={
 ag005:function(){var claims=[];for(var i=1;i<=48;i++)claims.push(ag005PaddyClaim(ag005SyntheticPaddy(i),'3.1-pc-text'));
  return reverificationWorklist(claims,{type:'methodology',old_key:'AG-005@3.1-pc-text',new_key:'AG-005@3.3-pc-draft-text'},AG005_TEXT_REGISTRY,AG005_TEXT_CLAUSES);},
 forest:function(){return reverificationWorklist(forestSyntheticStands(60).map(function(s){return forestStandClaim(s,'1');}),{type:'methodology',old_key:'FOREST-SYNTHETIC@1',new_key:'FOREST-SYNTHETIC@2'},FOREST_REGISTRY);}
};
function gxWorklistSlot(name){
 return '<div class="gx-worklist" data-worklist="'+gxEsc(name)+'"><p class="gx-label">見直しリスト（CSV）を準備しています…</p></div>';
}
function gxWorklistLinkHtml(name,w){
 var n=w.items.reduce(function(a,i){return a+i.tasks.length;},0);
 return '<p><a class="gx-download" data-worklist-ready="'+gxEsc(name)+'" download="naft-'+gxEsc(name)+'-reverification-worklist.csv" href="#">見直しリストをCSVでダウンロード</a> '+
  '<small>（'+Number(w.counts.claims).toLocaleString('ja-JP')+'件・作業'+Number(n).toLocaleString('ja-JP')+'行。合成データ、認証には使えません）</small></p>';
}
function gxWorklistHydrate(){
 if(typeof document==='undefined'||typeof reverificationWorklist!=='function')return;
 Array.prototype.forEach.call(document.querySelectorAll('[data-worklist]'),function(slot){
  var name=slot.getAttribute('data-worklist');if(!GX_WORKLIST_DEMOS[name])return;
  var fill=function(){
   var w=GX_WORKLIST.cache[name];if(!w||!slot.isConnected)return;
   if(w.error){slot.innerHTML='<p class="gx-anomaly" role="alert">見直しリストを作れませんでした（'+gxEsc(w.error)+'）。</p>';return;}
   slot.innerHTML=gxWorklistLinkHtml(name,w);
   var a=slot.querySelector('a');
   try{a.href=URL.createObjectURL(new Blob([worklistCsv(w)],{type:'text/csv;charset=utf-8'}));}catch(err){a.removeAttribute('href');a.textContent='このブラウザではダウンロードできません';}
  };
  if(GX_WORKLIST.cache[name]){fill();return;}
  if(GX_WORKLIST.pending[name])return;
  GX_WORKLIST.pending[name]=true;
  setTimeout(function(){
   try{GX_WORKLIST.cache[name]=GX_WORKLIST_DEMOS[name]();}catch(err){GX_WORKLIST.cache[name]={error:err.message};}
   GX_WORKLIST.pending[name]=false;
   gxWorklistHydrate();
  },60);
 });
}
