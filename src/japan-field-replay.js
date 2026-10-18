'use strict';
// Japanese field research: replays transcribed published aggregates. NOT raw-flux reproduction.
// Source-table values, environment metadata, authorship and treatment assignment are NOT independently attested.
var NAFT_JP_FIELD_STATUS='SECONDARY_TRANSCRIPTION_ORIGINAL_TABLE_NOT_RECHECKED';
function jpFieldStop(s){throw Error(s);}
function jpFieldFinite(v,k,negative){if(typeof v!=='number'||!Number.isFinite(v)||(!negative&&v<0))jpFieldStop('INVALID_FIELD_NUMBER:'+k);return v;}
function jpFieldRead(s,k,negative){if(typeof s!=='string'||!/^[-]?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(s))jpFieldStop('INVALID_PUBLISHED_DECIMAL:'+k);return jpFieldFinite(Number(s),k,negative);}
function jpFieldSource(f){
 if(!f||f.schema!=='naft-jp-field-published-aggregate-1'||
 f.provenance_status!==NAFT_JP_FIELD_STATUS||
 f.raw_observation_series_available!==false||f.study_measurement_protocol_independently_verified!==false||
 f.formal_jcredit_eligibility!==null||!Array.isArray(f.sources)||f.sources.length!==2)
  jpFieldStop('FIELD_SOURCE_SCHEMA_NOT_REPRODUCIBLE');
 var a=f.sources.find(v=>v.study_id==='YAGI_1996'),b=f.sources.find(v=>v.study_id==='NISHIMURA_2004');
 if(!a||!b||a.doi!=='10.1029/96GB00517'||b.doi!=='10.1029/2003GB002207'||
 a.source_kind!=='PUBLISHED_AGGREGATE_TRANSCRIPTION'||b.source_kind!==a.source_kind)
  jpFieldStop('FIELD_SOURCE_PROVENANCE_UNVERIFIED');
 for(var s of [a,b])if(s.country!=='JP'||s.experimental_setup_verified!==false||
 s.site_coordinates!==null||s.flux_time_series!==null||s.temperature_series!==null||
 s.water_depth_series!==null||s.soil!==null)jpFieldStop('FIELD_ENVIRONMENT_FALSIFIED');
 return {yagi:a,nishimura:b};
}
function japanFieldReplayYagi(f){
 var a=jpFieldSource(f).yagi;
 if(!Array.isArray(a.years)||a.years.length!==2)jpFieldStop('YAGI_YEAR_COUNT');
 var pinned={'1991':['14.8','8.63'],'1993':['9.49','5.18']},seen=new Set();
 var rows=a.years.map(v=>{
  if(!v||!Number.isInteger(v.year)||seen.has(v.year)||!pinned[v.year])jpFieldStop('YAGI_YEAR_MISMATCH');
  seen.add(v.year);
  var c=jpFieldRead(v.continuous_flooding_g_m2,'continuous',false);
  var d=jpFieldRead(v.intermittent_drainage_g_m2,'intermittent',false);
  if(c!==Number(pinned[v.year][0])||d!==Number(pinned[v.year][1]))
    jpFieldStop('YAGI_PUBLISHED_AGGREGATE_MUTATED');
  if(c===0)jpFieldStop('YAGI_ZERO_REFERENCE');
  // 1 g/m² × 10,000 m²/ha ÷ 1,000 g/kg = 10 kg/ha.
  return {year:v.year,country:'JP',continuous_flooding_kg_ch4_ha:c*10,
   intermittent_drainage_kg_ch4_ha:d*10,paired_difference_kg_ch4_ha:(c-d)*10,
   arithmetic_difference_percent:(c-d)/c*100,unit:'kg_CH4/ha/period',
   comparison_scope:'WITHIN_REPORTED_YEAR_ONLY',causal_attribution:null};
 });
 return {status:'PUBLISHED_AGGREGATE_ARITHMETIC_ONLY',study_id:'YAGI_1996',doi:a.doi,rows,
  numerical_inference:'WITHIN_YEAR_TREATMENT_CONTRAST_ONLY',paired_plot_equivalence_verified:false,
  meteorology_and_soil_matching_verified:false,formal_jcredit_eligibility:null};
}
function japanFieldReplayNishimura(f){
 var b=jpFieldSource(f).nishimura;
 if(b.year!==2002||jpFieldRead(b.growing_mg_m2,'growing',true)!==3180||
 jpFieldRead(b.fallow_mg_m2,'fallow',true)!==-51||
 jpFieldRead(b.published_annual_mg_m2,'annual',true)!==3128||
 jpFieldRead(b.published_precision_mg_m2,'precision',false)!==1)
  jpFieldStop('NISHIMURA_PUBLISHED_AGGREGATE_MUTATED');
 var computed=3180-51,printed=3128,delta=printed-computed;
 // Each printed whole-mg component and total may have ±0.5 mg/m² rounding error.
 // Bound is compatibility only, not a causal assignment to rounding.
 var bound=1.5;
 return {status:'PUBLISHED_AGGREGATE_ARITHMETIC_ONLY',study_id:'NISHIMURA_2004',doi:b.doi,
  year:2002,growing_kg_ch4_ha:3180*.01,fallow_kg_ch4_ha:-51*.01,
  computed_annual_kg_ch4_ha:computed*.01,published_annual_kg_ch4_ha:printed*.01,
  signed_reported_minus_sum_kg_ch4_ha:delta*.01,
  rounding_compatibility_bound_kg_ch4_ha:bound*.01,
  observed_rounding_compatible:Math.abs(delta)<=bound,
  inferred_cause:null,source_flux_data_verified:false,formal_jcredit_eligibility:null};
}
var JP_FIELD_MATCH_KEYS=['site_id','calendar_year','crop_season','measurement_start','measurement_end',
 'soil_class','irrigation','organic_amendment','fertilizer','measurement_protocol','gas','mass_basis',
 'climate_observation_ref','plot_lineage'];
function japanFieldCompareEnvironment(a,b){
 var missing=[],mismatched=[];
 for(var k of JP_FIELD_MATCH_KEYS){
  var v=a&&a[k],w=b&&b[k];
  if(typeof v!=='string'||!v.trim()||typeof w!=='string'||!w.trim()||v==='UNKNOWN'||w==='UNKNOWN')
    missing.push(k);
  else if(v!==w)mismatched.push(k);
 }
 return {same_environment_metadata:missing.length===0&&mismatched.length===0,
  missing_keys:missing,mismatched_keys:mismatched,
  independently_attested:false,source_condition_proof:null};
}
function japanFieldAllocateAreaRate(x){
 if(!x||!['SYNTHETIC','PRIMARY_MEASUREMENT'].includes(x.data_status))
   jpFieldStop('FIELD_ALLOCATION_DATA_STATUS_UNSUPPORTED');
 // Do not accept caller-supplied booleans/hashes as independent primary-source attestation.
 if(x.data_status==='PRIMARY_MEASUREMENT')return {status:'BLOCKED_UNATTESTED_PRIMARY',
  source_verified:false,difference_kg_ch4:null,area_component_kg_ch4:null,
  intensity_component_kg_ch4:null,causal_effect:null};
 var check=japanFieldCompareEnvironment(x.observed&&x.observed.context,x.predicted&&x.predicted.context);
 var provenance=x.data_status==='PRIMARY_MEASUREMENT'&&x.independent_source_bytes_verified===true&&
  x.observed&&x.predicted&&/^[0-9a-f]{64}$/.test(x.observed.source_sha256||'')&&
  /^[0-9a-f]{64}$/.test(x.predicted.source_sha256||'');
 if(!check.same_environment_metadata||(x.data_status==='PRIMARY_MEASUREMENT'&&!provenance)){
  return {status:'BLOCKED_CONTEXT_OR_PROVENANCE',metadata:check,
   source_verified:!!provenance,difference_kg_ch4:null,area_component_kg_ch4:null,
   intensity_component_kg_ch4:null,causal_effect:null};
 }
 var o=x.observed,p=x.predicted;
 var ao=jpFieldFinite(o.area_ha,'observed_area',false),ap=jpFieldFinite(p.area_ha,'predicted_area',false);
 var ro=jpFieldFinite(o.rate_kg_ch4_ha,'observed_rate',true),rp=jpFieldFinite(p.rate_kg_ch4_ha,'predicted_rate',true);
 // Exact two-factor symmetric/Shapley identity, descriptive arithmetic, NOT causal inference.
 var area=(ao-ap)*(ro+rp)/2;
 var intensity=(ro-rp)*(ao+ap)/2;
 var delta=ao*ro-ap*rp;
 if(![delta,area,intensity].every(Number.isFinite))jpFieldStop('FIELD_ALLOCATION_OVERFLOW');
 var remainder=delta-area-intensity;
 if(Math.abs(remainder)>1e-9*Math.max(1,Math.abs(delta)))
  jpFieldStop('FIELD_ALLOCATION_IDENTITY_FAILED');
 return {status:x.data_status==='SYNTHETIC'?'SYNTHETIC_ACCOUNTING_ONLY':'PRIMARY_RECORD_ACCOUNTING_NOT_CAUSAL',
  metadata:check,source_verified:!!provenance,difference_kg_ch4:delta,
  area_component_kg_ch4:area,intensity_component_kg_ch4:intensity,
  numeric_remainder_kg_ch4:remainder,causal_effect:null,
  observational_uncertainty_estimated:false,formal_jcredit_eligibility:null};
}
