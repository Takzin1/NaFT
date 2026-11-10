/* P76: one lightweight JSON registry fetch; original ZIP/SHP/DBF never loaded in the browser. */
'use strict';
var GX_NATIONAL_SOIL_REGISTRY_CACHE=null;
function gxNationalSoilEvidencePanel(prefCode){
 return '<section id="gx-national-soil-registry" class="gx-dashboard" data-pref-code="'+gxEsc(prefCode)+'" aria-live="polite">'+
 '<div class="gx-section-heading"><span class="gx-kicker">P76 · NATIONAL SOIL EVIDENCE REGISTRY</span><h2>全国47都道府県の証拠台帳・品質例外</h2><p>全国の原本由来集計の監査情報を読み込んでいます。</p></div></section>';
}
function gxNationalSoilRegistryValidate(reg){
 if(!reg||reg.schema!=='naft-p76-national-soil-evidence-registry-v1'||!Array.isArray(reg.records)||reg.records.length!==47)throw Error('P76_REGISTRY_SCHEMA_OR_COVERAGE');
 var keys=['田','普通畑','牧草地','樹園地'],total=0,land=[0,0,0,0],codes=new Set();
 reg.records.forEach(function(r,i){
  if(r.p!==i+29||!/^\d{2}$/.test(r.prefecture_code)||codes.has(r.prefecture_code)||!r.prefecture_name)throw Error('P76_REGISTRY_PREF_CODE');
  codes.add(r.prefecture_code);
  if(!r.source||!/^[0-9a-f]{64}$/.test(r.source.zip_sha256)||r.source.redistribution_rights!=='NOT_VERIFIED'||r.source.original_zip_committed!==false||r.source.raw_geometry_committed!==false)throw Error('P76_REGISTRY_PROVENANCE');
  if(!new RegExp('^research/p'+r.p+'-[a-z0-9-]+-soil-shapefile-source-v1\\.json$').test(r.source.ledger_path))throw Error('P76_REGISTRY_LEDGER_PATH');
  var vals=keys.map(function(k){return r.landuse_counts[k];});
  if(vals.some(function(n){return !Number.isSafeInteger(n)||n<0;})||vals.reduce(function(a,b){return a+b;},0)!==r.polygon_features)throw Error('P76_REGISTRY_LAND_PARITY');
  ['foreign_jcode_features','blank_gun_features','ambiguous_jcodes','ambiguous_names','ambiguous_guns','soil_group_missing_features','soil_detail_missing_features'].forEach(function(k){var n=r.quality[k];if(n!==null&&(!Number.isSafeInteger(n)||n<0))throw Error('P76_REGISTRY_QUALITY_VALUE');});
  total+=r.polygon_features;vals.forEach(function(v,j){land[j]+=v;});
 });
 if(codes.size!==47||total!==reg.summary.polygon_features||reg.summary.prefecture_ledgers!==47||reg.summary.official_zip_sha256_match_verified_prefectures!==0||reg.summary.redistribution_rights_verified_prefectures!==0)throw Error('P76_REGISTRY_TOTALS_OR_VERIFICATION');
 if(JSON.stringify(land)!==JSON.stringify(keys.map(function(k){return reg.summary.landuse_counts[k];})))throw Error('P76_REGISTRY_NATIONAL_LAND_PARITY');
 return reg;
}
function gxNationalSoilRegistryLoad(){
 if(!GX_NATIONAL_SOIL_REGISTRY_CACHE){
  GX_NATIONAL_SOIL_REGISTRY_CACHE=fetch('research/p76-national-soil-evidence-registry-v1.json').then(function(resp){if(!resp.ok)throw Error('P76_REGISTRY_HTTP_'+resp.status);return resp.json();}).then(gxNationalSoilRegistryValidate).catch(function(err){GX_NATIONAL_SOIL_REGISTRY_CACHE=null;throw err;});
 }
 return GX_NATIONAL_SOIL_REGISTRY_CACHE;
}
function gxNationalSoilRegistryHtml(reg,prefCode){
 var rows=reg.records,summary=reg.summary,selected=rows.find(function(r){return r.prefecture_code===prefCode;})||rows[0];
 var fmt=function(n){return Number(n).toLocaleString('ja-JP');};
 var count=function(n,unit){return n===null?'<span class="gx-label">未記録</span>':fmt(n)+(unit||'件');};
 var ledgerUrl=function(r){return 'https://github.com/Takzin1/NaFT/blob/main/'+r.source.ledger_path;};
 var qc=selected.quality,reasons=[];
 if(qc.foreign_jcode_features===null)reasons.push('県外系JCODE：未記録');
 else if(qc.foreign_jcode_features>0)reasons.push('県外系JCODE：'+fmt(qc.foreign_jcode_features)+'件（要照合）');
 if(qc.blank_gun_features===null)reasons.push('郡名空欄：未記録');
 else if(qc.blank_gun_features>0)reasons.push('郡名空欄：'+fmt(qc.blank_gun_features)+'件');
 if(qc.ambiguous_jcodes===null)reasons.push('複数名称JCODE：未記録');
 else if(qc.ambiguous_jcodes>0)reasons.push('複数名称JCODE：'+fmt(qc.ambiguous_jcodes)+'種類（要照合）');
 if(qc.ambiguous_guns===null)reasons.push('複数郡名：未記録');
 else if(qc.ambiguous_guns>0)reasons.push('複数郡名：'+fmt(qc.ambiguous_guns)+'種類（要照合）');
 if(qc.soil_group_missing_features===null)reasons.push('土壌群欠損：未記録');
 else if(qc.soil_group_missing_features>0)reasons.push('土壌群欠損：'+fmt(qc.soil_group_missing_features)+'件（要照合）');
 var land=['田','普通畑','牧草地','樹園地'].map(function(k){return gxEsc(k)+' '+fmt(selected.landuse_counts[k])+'件';}).join('／');
 var tableRows=rows.map(function(r){
  return '<tr'+(r.prefecture_code===prefCode?' class="gx-active"':'')+'><th scope="row">'+gxEsc(r.prefecture_name)+'</th>'+
  '<td>'+gxEsc(r.prefecture_code)+'</td><td>'+fmt(r.polygon_features)+'</td><td>'+count(r.quality.foreign_jcode_features)+'</td>'+
  '<td>'+count(r.quality.blank_gun_features)+'</td><td>'+count(r.quality.ambiguous_jcodes,'種類')+'</td>'+
  '<td><span class="gx-label">未照合</span></td><td><span class="gx-label">未確認</span></td>'+
  '<td><a href="'+gxEsc(ledgerUrl(r))+'" target="_blank" rel="noopener noreferrer">台帳 ↗</a></td></tr>';
 }).join('');
 var cov=summary.quality_field_coverage;
 return '<div class="gx-section-heading"><span class="gx-kicker">P76 · NATIONAL SOIL EVIDENCE REGISTRY / RESEARCH ONLY</span>'+
 '<h2 id="gx-national-soil-registry-title">全国47都道府県の証拠台帳と品質例外。</h2>'+
 '<p>原本由来の派生集計を統合。元ZIPのSHAは記録済みですが、公式ZIPのバイト一致・再配布許諾は未確認です。未記録を0件と扱わず、現行自治体との自動JOINもしません。</p></div>'+
 '<div class="gx-detail-grid">'+
 '<article class="gx-data-card"><span class="gx-kicker">都道府県別監査台帳</span><strong>47 <small>/ 47県</small></strong><p>出典への追跡リンク付き</p></article>'+
 '<article class="gx-data-card"><span class="gx-kicker">全国の土壌ポリゴン</span><strong>'+fmt(summary.polygon_features)+' <small>件</small></strong><p>農地面積haではありません</p></article>'+
 '<article class="gx-data-card"><span class="gx-kicker">公式ZIPとの同一性確認</span><strong>0 <small>/ 47県</small></strong><p>確認済みとして報告できる県は未登録</p></article>'+
 '<article class="gx-data-card"><span class="gx-kicker">再配布許諾の個別確認</span><strong>0 <small>/ 47県</small></strong><p>個別の利用条件を引き続き要確認</p></article></div>'+
 '<p class="gx-anomaly"><b>品質情報の報告率：</b>県外系JCODE件数 '+fmt(cov.foreign_jcode_features.reported_prefectures)+'/47県（未記録 '+fmt(cov.foreign_jcode_features.unreported_prefectures)+'県）。郡名空欄数 '+fmt(cov.blank_gun_features.reported_prefectures)+'/47県（未記録 '+fmt(cov.blank_gun_features.unreported_prefectures)+'県）。土壌群欠損の報告済み件数合計 '+fmt(cov.soil_group_missing_features.reported_counts_total)+'件。未記録県は合計に含めていません。</p>'+
 '<div class="gx-source-panel"><div><h3>'+gxEsc(selected.prefecture_name)+'｜県別品質監査</h3>'+
 '<p>ポリゴン '+fmt(selected.polygon_features)+'件（'+land+'）。</p>'+
 '<p>'+gxEsc(reasons.join('。')||'報告済みの品質例外はありません')+'。</p></div>'+
 '<div><h3>出典証拠と確認状況</h3><p>ZIP SHA-256：<code>'+gxEsc(selected.source.zip_sha256)+'</code></p>'+
 '<p>公式ZIPバイト一致：<b>NOT_VERIFIED</b>／再配布許諾：<b>NOT_VERIFIED</b></p>'+
 '<p><a href="'+gxEsc(ledgerUrl(selected))+'" target="_blank" rel="noopener noreferrer">元データ由来の監査台帳 ↗</a></p></div></div>'+
 '<details><summary>全国47都道府県｜品質・来歴の一覧表を表示</summary><div class="scroll"><table><thead><tr>'+
 '<th scope="col">県名</th><th scope="col">コード</th><th scope="col">地物数</th><th scope="col">県外JCODE</th>'+
 '<th scope="col">郡名空欄</th><th scope="col">複数名JCODE</th><th scope="col">原本</th><th scope="col">権利</th><th scope="col">参照</th>'+
 '</tr></thead><tbody>'+tableRows+'</tbody></table></div></details>'+
 '<p class="gx-kicker">research/p76-national-soil-evidence-registry-v1.json · 元ZIP・SHP・DBF・個別地物座標は未公開。ここから認証済みGHG削減量やクレジットは計算・発行しません。</p>';
}
function gxNationalSoilEvidenceHydrate(){
 if(typeof document==='undefined'||typeof fetch!=='function')return;
 var slot=document.getElementById('gx-national-soil-registry');
 if(!slot)return;
 var prefCode=slot.getAttribute('data-pref-code');
 gxNationalSoilRegistryLoad().then(function(reg){
  if(slot.isConnected)slot.innerHTML=gxNationalSoilRegistryHtml(reg,prefCode);
 }).catch(function(err){
  if(slot.isConnected)slot.innerHTML='<div class="gx-section-heading"><h2>全国レジストリの表示を停止しました</h2><p>'+gxEsc(err.message)+'</p></div>';
 });
}
