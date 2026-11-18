'use strict';
/* P79 · AG-005 (水稲栽培における中干し期間の延長) Packs translated from the e-Gov source texts.
 *
 *   AG-005@3.1-pc-text      ← e-Gov seqNo=0000281460 (Ver.3.1, SHA-256 pinned in research: f861e4af…)
 *   AG-005@3.3-pc-draft-text ← e-Gov seqNo=0000288301 (Ver.3.3 public-comment text; dates shown as 2025.3.XX;
 *                              bytes NOT pinned in this repository)
 *
 * Both are status REFERENCE: the Compiler always reports official_configuration / effective_period /
 * calculation_configuration as UNSUPPORTED. Emission-factor tables, GWP and the current adopted version
 * (Ver.3.5, 2026-03-04 per the official list) are not pinned, so no tCO2e is ever produced.
 *
 * Translation is partial by design. Clause locators live in AG005_TEXT_CLAUSES (outside the Packs) so that
 * page-number shifts between versions are not mistaken for semantic rule changes by impact analysis.
 * Inputs prefixed years_* / extension_days are adapter-normalized facts (see ag005ExtensionDays()).
 */
var AG005_TEXT_COMMON_EVIDENCE={
  heading_date_record:{category:'heading_date_record',required:true},
  baseline_drainage_days:{category:'baseline_drainage_days_record',required:true},
  project_drainage_dates:{category:'project_drainage_dates_record',required:true},
  drainage_start_end_proof:{category:'drainage_start_end_proof',required:true},
  planted_area_record:{category:'planted_area_record',required:true},
  organic_matter_record:{category:'organic_matter_record',required:true},
  percolation_record:{category:'percolation_measurement_record',required:true,when:{path:'activity.drainage_basis',equals:'MEASURED'}},
  no_rain_record:{category:'no_rain_record',required:true,when:{path:'activity.drainage_basis',equals:'MEASURED'}},
  consolidation_documents:{category:'land_consolidation_lot_mapping',required:true,when:{path:'activity.land_consolidation',equals:true}}
};
function ag005TextPack(version,extra){
  var p={
    methodology_id:'AG-005',methodology_version:version.id,rule_pack_version:'naft-ag005-text-'+version.short,
    effective_from:'UNKNOWN',effective_to:'UNKNOWN',source_url:version.url,source_hash:version.hash,source_checked_at:'2026-11-18',
    status:'REFERENCE',provenance:'public',scope:version.scope,
    parameters:{
      minimum_extension_days:{value:7,status:'REFERENCE'},
      minimum_baseline_years:{value:2,status:'REFERENCE'},
      percolation_multiplier:{value:1.22,status:'REFERENCE'},
      drainage_poor_below_mm_day:{value:7.5,status:'REFERENCE'},
      drainage_daily_below_mm_day:{value:12.5,status:'REFERENCE'},
      emission_factors:{value:'UNKNOWN',status:'CONFIG_REQUIRED'},
      gwp_ch4:{value:'UNKNOWN',status:'CONFIG_REQUIRED'}
    },
    evidence_requirements:clone(AG005_TEXT_COMMON_EVIDENCE),
    rules:{
      extension:{op:'gte',input:'activity.extension_days',parameter:'minimum_extension_days',status:'REFERENCE'},
      baseline_years:{op:'gte',input:'activity.baseline_years',parameter:'minimum_baseline_years',status:'REFERENCE'},
      certification_start_not_before_registration:{op:'gte',input:'activity.years_cert_start_after_registration',value:0,status:'REFERENCE'}
    },
    calculation_spec:{operation:'UNSUPPORTED',result:null,reason:'CONFIG_REQUIRED: inventory emission-factor table, GWP and adopted version not pinned'},
    exceptions:{},
    unsupported_conditions:{adoption:'NOT_CURRENT_VERSION',complete_translation:'PARTIAL'}
  };
  (extra||function(){})(p);
  return p;
}
var AG005_TEXT_PACKS=[
  ag005TextPack({id:'3.1-pc-text',short:'3.1',url:'https://public-comment.e-gov.go.jp/pcm/download?seqNo=0000281460',
    hash:'f861e4af40f3fa1fb3a0b54327cd7720f6e5028ae99455bf39274f97140a2050',
    scope:'Ver.3.1 text (hash pinned in research). Partial translation: certification start upper bound (翌暦年まで) not expressible with gte/gt/eq and not translated.'}),
  ag005TextPack({id:'3.3-pc-draft-text',short:'3.3',url:'https://public-comment.e-gov.go.jp/pcm/download?seqNo=0000288301',hash:'UNKNOWN',
    scope:'Ver.3.3 public-comment text reviewed 2026-11-18; bytes not pinned; dates shown as 2025.3.XX. Partial translation.'},
    function(p){
      // Ver.3.3: objective proof that each 日減水深 record matches reality (≥1 per measurement site).
      p.evidence_requirements.percolation_record_proof={category:'percolation_record_proof',required:true,when:{path:'activity.drainage_basis',equals:'MEASURED'}};
      // Ver.3.3: activity lists including activities from 2025-01-01 follow the 付記 (地番 notation).
      p.evidence_requirements.activity_report_list={category:'activity_report_list_lot_numbers',required:true,when:{path:'activity.post_2025_activity',equals:true}};
      // Ver.3.3: certification start = later of registration-application year and extension-start year.
      p.rules.certification_start_not_before_extension={op:'gte',input:'activity.years_cert_start_after_extension_start',value:0,status:'REFERENCE'};
    })
];
var AG005_TEXT_REGISTRY=createMethodologyRegistry(AG005_TEXT_PACKS);

/* Clause map (outside the Packs). p = printed page in the respective source. */
var AG005_TEXT_CLAUSES={
  'AG-005@3.1-pc-text':{
    'rules.extension':'適用条件1 p.1 (7日間以上)','rules.baseline_years':'適用条件1 p.1–2 (直近2か年以上)',
    'rules.certification_start_not_before_registration':'認証対象期間 p.8–9 (登録申請日の暦年又は翌暦年)',
    'evidence_requirements.heading_date_record':'検証時の証跡 p.9','evidence_requirements.baseline_drainage_days':'検証時の証跡 p.9',
    'evidence_requirements.project_drainage_dates':'検証時の証跡 p.9','evidence_requirements.drainage_start_end_proof':'中干し開始・終了の証跡 p.9–10 (Ver.3.0〜)',
    'evidence_requirements.planted_area_record':'モニタリング A_PJ p.4','evidence_requirements.organic_matter_record':'モニタリング l 施用有機物 ※4 p.4–6',
    'evidence_requirements.percolation_record':'日減水深 p.7, p.9–11','evidence_requirements.no_rain_record':'日減水深 降雨なしの資料 p.9–10',
    'evidence_requirements.consolidation_documents':'換地等 p.2, p.10'},
  'AG-005@3.3-pc-draft-text':{
    'rules.extension':'適用条件1 p.1','rules.baseline_years':'適用条件1 p.1–3','rules.certification_start_not_before_registration':'認証対象期間 p.9',
    'rules.certification_start_not_before_extension':'認証対象期間 p.9 (いずれか遅い方) — Ver.3.3追加',
    'evidence_requirements.heading_date_record':'検証時の証跡 p.9','evidence_requirements.baseline_drainage_days':'検証時の証跡 p.9',
    'evidence_requirements.project_drainage_dates':'検証時の証跡 p.9','evidence_requirements.drainage_start_end_proof':'中干し記録の実態確認 p.9–10',
    'evidence_requirements.planted_area_record':'モニタリング A_PJ p.4','evidence_requirements.organic_matter_record':'施用有機物 p.11',
    'evidence_requirements.percolation_record':'日減水深 p.6–7, p.10–12','evidence_requirements.no_rain_record':'日減水深 降雨なしの資料 p.7',
    'evidence_requirements.percolation_record_proof':'測定記録の証跡 p.10–11 — Ver.3.3追加',
    'evidence_requirements.activity_report_list':'個別活動実績報告リスト 付記 p.9 — Ver.3.3追加',
    'evidence_requirements.consolidation_documents':'換地等 p.10'}
};

/* Adapter: 適用条件1 averaging — baseline days averaged over ≥2 recent years, fractions rounded UP. */
function ag005ExtensionDays(projectDays,baselineDays){
  if(!Number.isInteger(projectDays)||projectDays<0||!Array.isArray(baselineDays)||!baselineDays.length||!baselineDays.every(function(d){return Number.isInteger(d)&&d>=0;})) throw new Error('AG005_EXTENSION_INPUT');
  var avg=Math.ceil(baselineDays.reduce(function(a,b){return a+b;},0)/baselineDays.length);
  return {baseline_average_days:avg,extension_days:projectDays-avg,baseline_years:baselineDays.length};
}

/* Deterministic synthetic paddies for the real-revision demo (no clock, no randomness). */
function ag005SyntheticPaddy(i){
  var n=String(i).padStart(3,'0'),season=i%2?2024:2025,measured=i%3===0,consolidation=i%13===0;
  var registrationYear=season,extensionStartYear=i%7===0?season+1:season,certStartYear=registrationYear;
  var ext=ag005ExtensionDays(i%11===0?40:45,[34,35]);
  return {paddy_id:'PADDY-SYN-'+n,farmer_id:'FARMER-SYN-'+String(Math.ceil(i/8)).padStart(2,'0'),area_ha:0.3+(i%6)*0.1,season:season,
    drainage_basis:measured?'MEASURED':'DEFAULT',land_consolidation:consolidation,post_2025_activity:season>=2025,
    extension_days:ext.extension_days,baseline_years:ext.baseline_years,
    years_cert_start_after_registration:certStartYear-registrationYear,years_cert_start_after_extension_start:certStartYear-extensionStartYear};
}
function ag005PaddyClaim(p,version){
  var id='RCLAIM-'+p.paddy_id.replace(/^PADDY-/,''),start=p.season+'-06-01',end=p.season+'-08-31';
  var input={provenance:'synthetic',program:{id:'AG005-SYN-PROGRAM'},
    field:{id:p.paddy_id,farmer_id:p.farmer_id,program_id:'AG005-SYN-PROGRAM',area_ha:p.area_ha,ambiguous:false},
    activity:{id:id,field_id:p.paddy_id,farmer_id:p.farmer_id,program_id:'AG005-SYN-PROGRAM',methodology_id:'AG-005',methodology_version:version,
      type:'midseason_drainage_extension',start:start,end:end,extension_days:p.extension_days,baseline_years:p.baseline_years,
      drainage_basis:p.drainage_basis,land_consolidation:p.land_consolidation,post_2025_activity:p.post_2025_activity,
      years_cert_start_after_registration:p.years_cert_start_after_registration,years_cert_start_after_extension_start:p.years_cert_start_after_extension_start},
    evidence:[],peers:[]};
  var cats=['heading_date_record','baseline_drainage_days_record','project_drainage_dates_record','drainage_start_end_proof','planted_area_record','organic_matter_record'];
  if(p.drainage_basis==='MEASURED') cats.push('percolation_measurement_record','no_rain_record');
  if(p.land_consolidation) cats.push('land_consolidation_lot_mapping');
  cats.forEach(function(cat){
    var content=JSON.stringify({provenance:'synthetic',paddy:p.paddy_id,category:cat,observation:'engineering fixture'});
    input.evidence.push({id:id+'-'+cat,category:cat,adapter:'farm-log-json-v1',content:content,expected_hash:digestText(content),activity_id:id,field_id:p.paddy_id,
      methodology_id:'AG-005',methodology_version:version,period:{start:start,end:end},source:'urn:naft:synthetic-paddy-fixture',provenance:'synthetic'});
  });
  return input;
}
/* Issues that every REFERENCE Pack raises; excluded when triaging what a revision newly demands. */
var AG005_CONSTANT_ISSUES=['official_configuration','effective_period','calculation_configuration','unsupported_conditions:adoption','unsupported_conditions:complete_translation'];
function ag005NewIssues(beforeEval,afterEval){
  var before=new Set(beforeEval.issues.map(function(i){return i.code;}));
  return afterEval.issues.filter(function(i){return AG005_CONSTANT_ISSUES.indexOf(i.code)<0&&!before.has(i.code);}).map(function(i){return i.code;}).sort();
}
function ag005RevisionDemo(count){
  var paddies=[];for(var i=1;i<=(count||48);i++) paddies.push(ag005SyntheticPaddy(i));
  var oldKey='AG-005@3.1-pc-text',newKey='AG-005@3.3-pc-draft-text',oldPack=AG005_TEXT_REGISTRY[oldKey],newPack=AG005_TEXT_REGISTRY[newKey];
  var claims=paddies.map(function(p){return ag005PaddyClaim(p,'3.1-pc-text');});
  var diff=compareMethodologyVersions(oldPack,newPack);
  var impact=analyzeImpact(claims,{type:'methodology',old_key:oldKey,new_key:newKey},AG005_TEXT_REGISTRY);
  var triage={NO_NEW_DEMAND:0,NEW_EVIDENCE:0,RULE_NOT_MET:0};
  var rows=impact.claims.map(function(r,idx){
    var p=paddies.filter(function(x){return 'RCLAIM-'+x.paddy_id.replace(/^PADDY-/,'')===r.claim_id;})[0];
    var before=compileEvidence(claims.filter(function(c){return c.activity.id===r.claim_id;})[0],oldPack).document.evaluation;
    var after=compileEvidence(ag005PaddyClaim(p,'3.3-pc-draft-text'),newPack).document.evaluation;
    var added=r.requires_reverification?ag005NewIssues(before,after):[];
    var kind=!added.length?'NO_NEW_DEMAND':added.some(function(c){return c.indexOf('rule:')===0;})?'RULE_NOT_MET':'NEW_EVIDENCE';
    if(r.requires_reverification) triage[kind]++;
    return {claim_id:r.claim_id,paddy_id:p.paddy_id,season:p.season,drainage_basis:p.drainage_basis,requires_reverification:r.requires_reverification,triage:r.requires_reverification?kind:'UNAFFECTED',new_issues:added};
  });
  return {schema:'naft-ag005-real-revision-demo-1',from:oldKey,to:newKey,
    boundary:'Rule changes come from the e-Gov Ver.3.1 and Ver.3.3 texts (partial translation). Paddies and records are SYNTHETIC. Both Packs stay UNSUPPORTED for certification; no tCO2e.',
    methodology_diff:{changed_rules:diff.changed_rules.map(function(c){return c.id+':'+c.change;}),changed_evidence_requirements:diff.changed_evidence_requirements.map(function(c){return c.id+':'+c.change;}),changed_parameters:diff.changed_parameters.map(function(c){return c.id+':'+c.change;})},
    counts:impact.counts,triage:triage,rows:rows};
}
