'use strict';
/* P1 read-only Japanese comparison of source-pinned GS training, Verra and
 * separate unverified Japanese AG-005. Never runs formal climate calculations.
 * CI verifies the lane identities against the independent Node source registry.
 */
var RICE_METHODS_ROUTE='method-family';
var RICE_METHODS_JA={
 schema:'naft-p1-method-family-view-v1',
 snapshot:'SOURCE_PINNED_RESEARCH_2026_10_19',
 source_state:'REFERENCE_ONLY_NOT_CERTIFIED',
 programs:[
  {id:'GOLD_STANDARD_AWD_WORKBOOK',label:'Gold Standard — AWD教材計算',
   version:'TRAINING_WORKBOOK_V1_1',
   warning:'VVBチェックリストQ23とワークブックでTier 1/3の分類が衝突しています。',
   lanes:[
    {id:'TIER_1_SIMPLIFIED',name:'Tier 1｜簡易排出係数',formula:'Tier 1_Simplified!E5',
     kind:'TRAINING_ARITHMETIC_ONLY'},
    {id:'TIER_2_COUNTRY_SPECIFIC',name:'Tier 2｜国別排出係数',formula:'Tier 2_Country specific!E4',
     kind:'TRAINING_ARITHMETIC_ONLY'},
    {id:'TIER_3_DIRECT',name:'Tier 3｜直接測定',formula:'Tier 3_Direct measurement!E4',
     kind:'TRAINING_ARITHMETIC_ONLY'}
   ]},
  {id:'VERRA_VM0051',label:'Verra — VM0051参照版',
   version:'V1.1_REFERENCE_2026_07_14',
   warning:'VerraのQA1/QA2/QA3はGold StandardのTier番号と相互変換できません。',
   lanes:[
    {id:'QA1_MODEL',name:'QA1｜生物地球化学モデル',formula:null,kind:'REFERENCE_ONLY'},
    {id:'QA2_DIRECT_CHAMBER',name:'QA2｜チャンバー直接測定',formula:null,kind:'REFERENCE_ONLY'},
    {id:'QA3_DEFAULT_EF',name:'QA3｜既定係数・数式',formula:null,kind:'REFERENCE_ONLY'}
   ]},
  {id:'J_CREDIT_AG005',label:'J-クレジット — AG-005',
   version:'CURRENT_ADOPTED_VERSION_UNVERIFIED',
   warning:'現行の正式採択版・適用係数はこの研究デモでは未確認です。',
   lanes:[]}
 ],
 automatic_cross_standard_mapping:false,
 official_approval:false,
 independently_accepted_field_ch4:false,
 certified_tco2e:null
};
function riceMethodsHeader(){
 return '<header><span class="eyebrow">NaFT · P1 Source-Specific Methods</span>'+
  '<h1>水田MRV｜方法論と計算方式を比較</h1>'+
  '<p>文書版・式・証憑要件を混同しないための研究用ガイドです。</p>'+
  '<nav aria-label="研究画面の切替"><a href="#/source-readiness">観測証憑の品質確認</a>'+
  '<a href="#/climatechain">ClimateChain差分再検証</a>'+
  '<a href="#/methodologies">NaFT研究UI</a></nav></header>';
}
function pgRiceMethodsJa(){
 var m=RICE_METHODS_JA;
 if(m.certified_tco2e!==null||m.official_approval!==false||
    m.automatic_cross_standard_mapping!==false||
    m.independently_accepted_field_ch4!==false)
  throw Error('RICE_METHOD_VIEW_UNSUPPORTED_CERTIFICATION');
 if(m.programs.length!==3||m.programs[0].lanes.length!==3||
    m.programs[1].lanes.length!==3||m.programs[2].lanes.length!==0)
  throw Error('RICE_METHOD_VIEW_NAMESPACES_UNEXPECTED');
 var out='<section class="card"><h2>制度をまたぐ番号の自動対応付けはしません</h2>'+
  '<div class="notice"><b>研究・教材のみ：</b>Gold Standardの教材式が再現できても、温室効果ガス削減量の正式認証や実測の妥当性は証明できません。</div>'+
  '<p>出典のSHA-256と資料版は研究用レジストリで管理。ここでは現場の排出量・クレジット額を計算しません。</p></section>';
 for(var p of m.programs){
  out+='<section class="card" data-rice-program="'+esc(p.id)+'">'+
   '<h2>'+esc(p.label)+'</h2><p><b>資料版：</b><code>'+esc(p.version)+'</code></p>'+
   '<p>'+esc(p.warning)+'</p>';
  if(p.lanes.length){
   out+='<div class="scroll"><table><thead><tr><th scope="col">文書固有の区分</th>'+
   '<th scope="col">式の出典</th><th scope="col">今回の検証範囲</th></tr></thead><tbody>'+
   p.lanes.map(function(lane){return '<tr data-rice-lane="'+esc(lane.id)+'">'+
    '<th scope="row">'+esc(lane.name)+'</th><td>'+
    (lane.formula?'<code>'+esc(lane.formula)+'</code>':'文献参照のみ')+
    '</td><td>'+(lane.kind==='TRAINING_ARITHMETIC_ONLY'?
      '教材の特定セルに限り独立再計算':'適用条件の参照・計算未対応')+
    '</td></tr>';}).join('')+'</tbody></table></div>';
  }else out+='<p><b>現時点の実装状況：</b>別体系として保留。適用条件と正式採択版を確認するまで自動ルーティングしません。</p>';
  out+='</section>';
 }
 return out+'<section class="card"><h2>数値一致だけでは認証できない理由</h2>'+
  '<p>Gold Standardの3つの演習式について、Node BigIntとPython Decimalを別々に実行して結果を照合するCLIを用意しました。</p>'+
  '<pre>node scripts/p1-method-family-comparison.mjs --format markdown\nnode scripts/p1-gs-independent-replay.mjs generate training-request.json</pre>'+
  '<p>測定時刻・欠測、出典とQC、正しい文書版、適用可能性、他の温室効果ガス、外部の独立検証が未解決の場合、認証値はnullです。</p>'+
  '<p><a href="https://github.com/Takzin1/NaFT/blob/feat/p1-rice-methods-independent-replay-ja-20261102/docs/p1-method-comparison-ja-2026-11-02.md" target="_blank" rel="noopener noreferrer">実装・データ境界・再現手順を見る</a></p></section>';
}
