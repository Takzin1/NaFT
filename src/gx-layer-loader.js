/* P78: on-demand GIS evidence layer loader.
 * The layer manifest is declared in naft-app.html (#gx-lazy-layer-manifest). Each prefecture panel
 * module is loaded only when that prefecture is selected on #/gx-data, instead of 47 eager scripts.
 * No network beyond same-origin static files; manifest paths are allow-listed before use.
 */
'use strict';
var GX_LAYER_KINDS=['soil','forest'];
var GX_LAYER_STATE={manifest:null,loading:Object.create(null),loaded:Object.create(null),failed:Object.create(null)};

function gxLayerManifestValidate(m){
 if(!m||m.schema!=='naft-gis-layer-manifest-1'||!Array.isArray(m.layers))throw Error('P78_LAYER_MANIFEST_SCHEMA');
 var seen=new Set();
 m.layers.forEach(function(l){
  if(!l||GX_LAYER_KINDS.indexOf(l.kind)<0)throw Error('P78_LAYER_KIND');
  if(!/^(0[1-9]|[1-3][0-9]|4[0-7])$/.test(l.pref))throw Error('P78_LAYER_PREF_CODE');
  if(!new RegExp('^src/gx-[a-z]+-'+l.kind+'\\.js$').test(l.src))throw Error('P78_LAYER_SRC');
  if(!/^gx[A-Z][A-Za-z]+(Soil|Forest)Panel$/.test(l.panel))throw Error('P78_LAYER_PANEL');
  var key=l.kind+':'+l.pref;if(seen.has(key))throw Error('P78_LAYER_DUPLICATE');seen.add(key);
 });
 return m;
}
function gxLayerManifest(){
 if(GX_LAYER_STATE.manifest)return GX_LAYER_STATE.manifest;
 if(typeof document==='undefined')return null;
 var el=document.getElementById('gx-lazy-layer-manifest');
 if(!el)return null;
 GX_LAYER_STATE.manifest=gxLayerManifestValidate(JSON.parse(el.textContent));
 return GX_LAYER_STATE.manifest;
}
function gxLayersFor(prefCode){
 var m=gxLayerManifest();
 return m?m.layers.filter(function(l){return l.pref===prefCode;}):[];
}
function gxLayerReady(layer){
 return typeof globalThis[layer.panel]==='function';
}
function gxLayerEnsure(prefCode,onChange){
 gxLayersFor(prefCode).forEach(function(layer){
  if(gxLayerReady(layer)){GX_LAYER_STATE.loaded[layer.src]=true;return;}
  if(GX_LAYER_STATE.loading[layer.src]||GX_LAYER_STATE.failed[layer.src])return;
  GX_LAYER_STATE.loading[layer.src]=true;
  var s=document.createElement('script');
  s.src=layer.src;s.async=true;s.setAttribute('data-gx-layer',layer.kind+':'+layer.pref);
  s.onload=function(){
   delete GX_LAYER_STATE.loading[layer.src];
   if(gxLayerReady(layer))GX_LAYER_STATE.loaded[layer.src]=true;else GX_LAYER_STATE.failed[layer.src]='P78_LAYER_PANEL_MISSING';
   if(onChange)onChange(layer);
  };
  s.onerror=function(){
   delete GX_LAYER_STATE.loading[layer.src];GX_LAYER_STATE.failed[layer.src]='P78_LAYER_LOAD_FAILED';
   if(onChange)onChange(layer);
  };
  document.head.appendChild(s);
 });
}
function gxLayerHydrate(){
 if(typeof document==='undefined'||typeof GX_SELECTED_PREF_CODE==='undefined')return;
 try{
  gxLayerEnsure(GX_SELECTED_PREF_CODE,function(){
   if(typeof render==='function'&&typeof GX_DATA_ROUTE!=='undefined'&&location.hash==='#/'+GX_DATA_ROUTE)render();
  });
 }catch(err){GX_LAYER_STATE.failed['manifest']=err.message;}
}
function gxLayerStatusPanel(prefCode){
 var layers;
 try{layers=gxLayersFor(prefCode);}catch(err){
  return '<p class="gx-anomaly" role="alert">GISレイヤー定義を検証できないため表示を停止しました（'+gxEsc(err.message)+'）。</p>';
 }
 var pending=layers.filter(function(l){return !gxLayerReady(l)&&!GX_LAYER_STATE.failed[l.src];});
 var failed=layers.filter(function(l){return GX_LAYER_STATE.failed[l.src];});
 if(!pending.length&&!failed.length)return '';
 return '<p class="gx-anomaly" role="status" aria-live="polite">'+
  (pending.length?'この都道府県のGIS証拠レイヤー（'+gxEsc(pending.map(function(l){return l.kind;}).join('・'))+'）を読み込んでいます。':'')+
  (failed.length?'読み込みに失敗したレイヤー：'+gxEsc(failed.map(function(l){return l.kind+'（'+GX_LAYER_STATE.failed[l.src]+'）';}).join('、'))+'。':'')+
  '</p>';
}
