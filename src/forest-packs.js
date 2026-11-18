'use strict';
/* P78 · Forest (J-Credit FO-001 森林経営活動) Packs for the existing Evidence Compiler.
 *
 * FO-001@guide-2026.03-reference: applicability conditions paraphrased from the Forestry Agency
 *   practitioner guide (Ver.2.0, 2026-03-31). Status CONFIG_REQUIRED: the official FO-001 text, version,
 *   coefficients and complete institutional translation are NOT pinned, so the Compiler fails closed.
 * FOREST-SYNTHETIC@1/@2: an invented engineering protocol under a separate methodology ID. The v1→v2
 *   transition is shaped after topics deliberated by the J-Credit steering committee in 2026 (natural-forest
 *   stem-volume tables after NFI period 5; checks on intentionally deferred final harvest), but it is NOT an
 *   official revision and carries no institutional thresholds.
 * Separate registry: the agricultural COMPILER_REGISTRY and its tested counts are left unchanged.
 */
var FOREST_PACKS=[
  {
    methodology_id:'FO-001',methodology_version:'guide-2026.03-reference',rule_pack_version:'naft-fo001-reference-1',
    effective_from:'UNKNOWN',effective_to:'UNKNOWN',
    source_url:'https://www.rinya.maff.go.jp/j/sin_riyou/ondanka/attach/pdf/J-credit-70.pdf',
    source_hash:'UNKNOWN',source_checked_at:'2026-11-18',status:'CONFIG_REQUIRED',provenance:'public',
    scope:'Practitioner guide (not the methodology text). Applicability conditions 1–4 and calculation targets ①–③ are paraphrased as REFERENCE rules only; permanence (condition 5), environmental/social safeguards (6) and additionality are not translated.',
    parameters:{minimum_thinning_sites:{value:1,status:'REFERENCE'},removal_factors:{value:'UNKNOWN',status:'CONFIG_REQUIRED'}},
    evidence_requirements:{
      management_plan:{category:'forest_management_plan',required:true,source_section:'guide II 適用条件1'},
      forest_register:{category:'forest_register',required:true,source_section:'guide ch.3 算定対象森林'},
      operation_record:{category:'operation_record',required:true,when:{path:'activity.operation',equals:'THINNING'},source_section:'guide ch.3 ①②'},
      protection_record:{category:'protection_record',required:true,when:{path:'activity.operation',equals:'PROTECTION'},source_section:'guide ch.3 ①③'}
    },
    rules:{
      plan_unit:{op:'eq',input:'activity.management_plan_certified',value:true,source_section:'guide II 適用条件1',status:'REFERENCE'},
      thinning_planned:{op:'gte',input:'activity.planned_thinning_sites',parameter:'minimum_thinning_sites',source_section:'guide II 適用条件3',status:'REFERENCE'},
      no_conversion:{op:'eq',input:'activity.land_conversion_planned',value:false,source_section:'guide II 適用条件4',status:'REFERENCE'},
      natural_forest_restricted:{op:'eq',input:'field.restricted_forest',value:true,when:{path:'field.forest_class',equals:'TENNEN'},source_section:'guide ch.3 ③ 制限林に限る',status:'REFERENCE'}
    },
    calculation_spec:{operation:'UNSUPPORTED',result:null,reason:'CONFIG_REQUIRED: official FO-001 text, removal factors and harvested-wood rules are not pinned'},
    exceptions:{final_harvest_balance:{input:'activity.includes_final_harvest',equals:true,disposition:'UNSUPPORTED',source_section:'guide II 適用条件2 (吸収見込量−排出見込量>0) not translated'}},
    unsupported_conditions:{bamboo:{input:'field.forest_class',equals:'BAMBOO'},unknown_forest_class:{input:'field.forest_class',equals:'UNKNOWN'},adoption:'UNKNOWN',complete_translation:'UNSUPPORTED'}
  },
  {
    methodology_id:'FOREST-SYNTHETIC',methodology_version:'1',rule_pack_version:'forest-synthetic-rules-1',
    effective_from:'2026-04-01',effective_to:'2027-03-31',source_url:'urn:naft:synthetic:forest-protocol:1',
    source_checked_at:'2026-11-18',status:'SYNTHETIC',provenance:'synthetic',
    scope:'Engineering experiment only. No institutional thresholds, real forest owners or certified removals.',
    parameters:{minimum_thinning_sites:{value:1,status:'SYNTHETIC'},natural_volume_table_min_period:{value:4,status:'SYNTHETIC'},growth_index:{value:3,status:'SYNTHETIC'}},
    evidence_requirements:{
      management_plan:{category:'forest_management_plan',required:true},
      forest_register:{category:'forest_register',required:true},
      operation_record:{category:'operation_record',required:true,when:{path:'activity.operation',equals:'THINNING'}},
      protection_record:{category:'protection_record',required:true,when:{path:'activity.operation',equals:'PROTECTION'}}
    },
    rules:{
      plan_unit:{op:'eq',input:'activity.management_plan_certified',value:true},
      thinning_planned:{op:'gte',input:'activity.planned_thinning_sites',parameter:'minimum_thinning_sites'},
      no_conversion:{op:'eq',input:'activity.land_conversion_planned',value:false},
      area:{op:'gt',input:'field.area_ha',value:0},
      natural_forest_restricted:{op:'eq',input:'field.restricted_forest',value:true,when:{path:'field.forest_class',equals:'TENNEN'}},
      natural_volume_table:{op:'gte',input:'field.volume_table_period',parameter:'natural_volume_table_min_period',when:{path:'field.forest_class',equals:'TENNEN'}}
    },
    calculation_spec:{operation:'multiply',inputs:['field.area_ha'],parameters:['growth_index'],unit:'synthetic-forest-index'},
    exceptions:{natural_disturbance:{input:'activity.natural_disturbance',equals:true,disposition:'HUMAN_REVIEW_REQUIRED'}},
    unsupported_conditions:{bamboo:{input:'field.forest_class',equals:'BAMBOO'},unknown_forest_class:{input:'field.forest_class',equals:'UNKNOWN'},unknown_age_class:{input:'field.age_class',equals:'UNKNOWN'}}
  },
  {
    methodology_id:'FOREST-SYNTHETIC',methodology_version:'2',rule_pack_version:'forest-synthetic-rules-2',
    effective_from:'2026-04-01',effective_to:'2027-03-31',source_url:'urn:naft:synthetic:forest-protocol:2',
    source_checked_at:'2026-11-18',status:'SYNTHETIC',provenance:'synthetic',
    scope:'Engineered version transition shaped after 2026 deliberation topics; not an FO-001 revision.',
    parameters:{minimum_thinning_sites:{value:1,status:'SYNTHETIC'},natural_volume_table_min_period:{value:5,status:'SYNTHETIC'},growth_index:{value:3,status:'SYNTHETIC'}},
    evidence_requirements:{
      management_plan:{category:'forest_management_plan',required:true},
      forest_register:{category:'forest_register',required:true},
      operation_record:{category:'operation_record',required:true,when:{path:'activity.operation',equals:'THINNING'}},
      protection_record:{category:'protection_record',required:true,when:{path:'activity.operation',equals:'PROTECTION'}},
      final_harvest_timing:{category:'final_harvest_review',required:true,when:{path:'field.age_class',equals:'MATURE'}}
    },
    rules:{
      plan_unit:{op:'eq',input:'activity.management_plan_certified',value:true},
      thinning_planned:{op:'gte',input:'activity.planned_thinning_sites',parameter:'minimum_thinning_sites'},
      no_conversion:{op:'eq',input:'activity.land_conversion_planned',value:false},
      area:{op:'gt',input:'field.area_ha',value:0},
      natural_forest_restricted:{op:'eq',input:'field.restricted_forest',value:true,when:{path:'field.forest_class',equals:'TENNEN'}},
      natural_volume_table:{op:'gte',input:'field.volume_table_period',parameter:'natural_volume_table_min_period',when:{path:'field.forest_class',equals:'TENNEN'}}
    },
    calculation_spec:{operation:'multiply',inputs:['field.area_ha'],parameters:['growth_index'],unit:'synthetic-forest-index'},
    exceptions:{natural_disturbance:{input:'activity.natural_disturbance',equals:true,disposition:'HUMAN_REVIEW_REQUIRED'}},
    unsupported_conditions:{bamboo:{input:'field.forest_class',equals:'BAMBOO'},unknown_forest_class:{input:'field.forest_class',equals:'UNKNOWN'},unknown_age_class:{input:'field.age_class',equals:'UNKNOWN'}}
  }
];
FOREST_PACKS.filter(function(p){return p.provenance==='synthetic';}).forEach(function(p){
  p.source_hash_scope='canonical_pack_without_source_hash';delete p.source_hash;p.source_hash=hashObject(p);
});
var FOREST_REGISTRY=createMethodologyRegistry(FOREST_PACKS);

/* Deterministic synthetic stands (小班). Index-derived, no clock or randomness. */
function forestSyntheticStand(i){
  var n=String(i).padStart(3,'0'),k={forest_class:'IKUSEI',operation:'THINNING',age_class:'IMMATURE',restricted_forest:false,volume_table_period:5,natural_disturbance:false};
  if(i<=12) k.age_class='MATURE';
  else if(i<=36) {}
  else if(i<=44) k.operation='PROTECTION';
  else if(i<=56) { k.forest_class='TENNEN';k.operation='PROTECTION';k.age_class='NOT_APPLICABLE';k.restricted_forest=true;k.volume_table_period=i<=52?4:5; }
  else if(i<=58) { k.forest_class='BAMBOO';k.operation='PROTECTION';k.age_class='NOT_APPLICABLE'; }
  else if(i===59) k.natural_disturbance=true;
  else k.age_class='UNKNOWN';
  return {stand_id:'STAND-SYN-'+n,local_key:'SYN-'+String(Math.ceil(i/6)).padStart(3,'0')+'-'+String((i-1)%6+1)+'-0',plan_id:'PLAN-SYN-01',manager_id:'MANAGER-SYN',area_ha:1+(i%5)*0.5,attributes:k};
}
function forestSyntheticStands(count){
  var out=[];for(var i=1;i<=(count||60);i++) out.push(forestSyntheticStand(i));return out;
}
function forestStandClaim(stand,version,options){
  options=options||{};version=version||'1';
  var a=stand.attributes,id='FCLAIM-'+stand.stand_id.replace(/^STAND-/,''),start='2026-04-01',end='2027-03-31';
  var input={provenance:'synthetic',program:{id:stand.plan_id},
    field:{id:stand.stand_id,farmer_id:stand.manager_id,program_id:stand.plan_id,area_ha:stand.area_ha,ambiguous:false,local_key:stand.local_key,
      forest_class:a.forest_class,restricted_forest:a.restricted_forest,age_class:a.age_class,volume_table_period:a.volume_table_period},
    activity:{id:id,field_id:stand.stand_id,farmer_id:stand.manager_id,program_id:stand.plan_id,methodology_id:options.methodology_id||'FOREST-SYNTHETIC',methodology_version:version,
      type:'forest_management',operation:a.operation,start:start,end:end,management_plan_certified:true,planned_thinning_sites:1,land_conversion_planned:false,
      natural_disturbance:a.natural_disturbance,includes_final_harvest:false},
    evidence:[],peers:[]};
  function ev(category,adapter){
    var content=JSON.stringify({provenance:'synthetic',stand:stand.stand_id,local_key:stand.local_key,category:category,observation:'engineering fixture'});
    return {id:id+'-'+category,category:category,adapter:adapter,content:content,expected_hash:digestText(content),activity_id:id,field_id:stand.stand_id,
      methodology_id:input.activity.methodology_id,methodology_version:version,period:{start:start,end:end},source:'urn:naft:synthetic-forest-fixture',provenance:'synthetic'};
  }
  input.evidence.push(ev('forest_management_plan','text-v1'),ev('forest_register','gis-json-v1'));
  input.evidence.push(a.operation==='THINNING'?ev('operation_record','farm-log-json-v1'):ev('protection_record','farm-log-json-v1'));
  return input;
}
function forestImpactDemo(stands){
  stands=stands||forestSyntheticStands(60);
  var claims=stands.map(function(s){return forestStandClaim(s,'1');});
  var diff=compareMethodologyVersions(FOREST_REGISTRY['FOREST-SYNTHETIC@1'],FOREST_REGISTRY['FOREST-SYNTHETIC@2']);
  var impact=analyzeImpact(claims,{type:'methodology',old_key:'FOREST-SYNTHETIC@1',new_key:'FOREST-SYNTHETIC@2'},FOREST_REGISTRY);
  var byStand=Object.create(null);stands.forEach(function(s){byStand['FCLAIM-'+s.stand_id.replace(/^STAND-/,'')]=s;});
  var rows=impact.claims.map(function(r){
    var s=byStand[r.claim_id],a=s.attributes,why=[];
    if(r.requires_reverification){
      if(a.forest_class==='TENNEN') why.push('天然生林：幹材積表の版の下限が変わった');
      if(a.age_class==='MATURE') why.push('主伐期到達：主伐時期の確認記録が新たに必要');
    }
    return {claim_id:r.claim_id,stand_id:s.stand_id,local_key:s.local_key,forest_class:a.forest_class,age_class:a.age_class,operation:a.operation,
      requires_reverification:r.requires_reverification,status:r.status,why:why};
  });
  return {schema:'naft-forest-impact-demo-1',boundary:'SYNTHETIC stands and SYNTHETIC rules. Not FO-001 policy, not certified removals.',
    methodology_diff:{changed_parameters:diff.changed_parameters.map(function(c){return c.id;}),changed_evidence_requirements:diff.changed_evidence_requirements.map(function(c){return c.id;}),changed_rules:diff.changed_rules.map(function(c){return c.id;})},
    counts:impact.counts,rows:rows};
}
