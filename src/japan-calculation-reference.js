'use strict';
// AG-005 v3.3 RESEARCH arithmetic and separate GX-ETS fuel reference.
// No institutional adoption, coefficients, GWP, certification, or real savings are inferred.
function japanRefNumber(value,name,positive){
  if(typeof value!=='number'||!Number.isFinite(value)||(positive?value<=0:value<0))
    throw Error('INVALID_REFERENCE_INPUT:'+name);
  return value;
}
function japanRefOrganicEF(x){
  const zero=japanRefNumber(x.ef_none,'ef_none',false);
  const straw=japanRefNumber(x.ef_straw,'ef_straw',false);
  const compost=japanRefNumber(x.ef_compost,'ef_compost',false);
  const w=japanRefNumber(x.straw_percent,'straw_percent',false);
  const c=japanRefNumber(x.compost_t_per_10a,'compost_t_per_10a',false);
  if(w>100)throw Error('INVALID_REFERENCE_INPUT:straw_percent');
  if(w===0&&c===0)return zero;
  if(w>=90&&c===0)return straw;
  if(w===0&&c>=1)return compost;
  if(w>=90&&c>=1)return Math.max(straw,compost);
  if(w>0&&c===0)return zero+(straw-zero)*w/90;
  if(w===0&&c>0)return zero+(compost-zero)*c;
  // v3.3 reference equation (7): capped straw and compost interpolation.
  return Math.min(zero+(straw-zero)*Math.min(w,90)/90+
    (compost-zero)*Math.min(c,1),Math.max(straw,compost));
}
function japanRefDrainage(measuredMmPerDay){
  const converted=japanRefNumber(measuredMmPerDay,'measured_mm_day',false)*1.22;
  return {converted_mm_day:converted,reference_class:converted<7.5?'POOR_DRAINAGE':
    converted<12.5?'DAILY_DRAINAGE':'FOUR_HOUR_DRAINAGE',
    measured_evidence_verified:false,official_classification:null};
}
function japanRefDate(s){
  if(typeof s!=='string'||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(s))
    throw Error('INVALID_REFERENCE_INPUT:iso_date');
  const n=Date.parse(s+'T00:00:00.000Z');
  if(!Number.isFinite(n)||new Date(n).toISOString().slice(0,10)!==s)
    throw Error('INVALID_REFERENCE_INPUT:iso_date');
  return n/86400000;
}
function japanRefMidseason(x){
  if(!Array.isArray(x.prior_crop_days)||x.prior_crop_days.length<2)
    throw Error('EVIDENCE_REQUIRED:prior_crop_cycles');
  const vals=x.prior_crop_days.map((v)=>japanRefNumber(v,'prior_crop_day',false));
  if(!vals.every(Number.isSafeInteger))throw Error('INVALID_REFERENCE_INPUT:prior_crop_day');
  const start=japanRefDate(x.start),end=japanRefDate(x.end),heading=japanRefDate(x.heading);
  const effectiveEnd=Math.min(end,heading-1);
  const projectDays=effectiveEnd>=start?effectiveEnd-start+1:0;
  const baselineDays=Math.ceil(vals.reduce((a,b)=>a+b,0)/vals.length);
  return {baseline_days:baselineDays,project_days:projectDays,extension_days:projectDays-baselineDays,
    meets_seven_day_arithmetic:projectDays-baselineDays>=7,
    historical_crop_years_verified:false,evidence_verified:false,
    official_eligibility:null,method_version:'3.3-reference'};
}
function japanRefAG005(x){
  if(x.method_version!=='3.3-reference'||x.data_kind!=='SYNTHETIC')
    throw Error('UNSUPPORTED:official_ag005_unverified');
  const area=japanRefNumber(x.area_ha,'area_ha',true);
  const gwp=japanRefNumber(x.gwp_ch4,'gwp_ch4',true);
  const efBL=japanRefOrganicEF(x);
  const efPJ=efBL*0.7; // historical v3.3 rule only, NOT a verified v3.5 factor.
  const tco2e=area*(efBL-efPJ)*(16/12)*gwp*0.001;
  if(!Number.isFinite(tco2e))throw Error('INVALID_REFERENCE_INPUT:overflow');
  return {schema:'naft-japan-ag005-reference-1',method_version:'3.3-reference',
    data_kind:'SYNTHETIC',status:'RESEARCH_REFERENCE_ONLY',units:'tCO2e/year',
    assumptions:{area_ha:area,ef_bl_kg_ch4_c_ha_year:efBL,
      ef_pj_kg_ch4_c_ha_year:efPJ,gwp_ch4:gwp,v33_extension_ratio:0.7},
    preview_tco2e:tco2e,certified_tco2e:null,jcredit_eligibility:null,
    official_methodology_verified:false,official_coefficient_verified:false,
    official_rounding_verified:false};
}
function japanRefGXETSFuel(x){
  if(x.source_type!=='FUEL_COMBUSTION'||!['t','kL','1000m3'].includes(x.fuel_unit)||
    x.heat_unit!=='GJ/'+x.fuel_unit||x.carbon_factor_unit!=='tC/GJ')
    throw Error('UNSUPPORTED:gxets_fuel_scope_or_units');
  const q=japanRefNumber(x.fuel_quantity,'fuel_quantity',false);
  const hv=japanRefNumber(x.heat_value,'heat_value',false);
  const cf=japanRefNumber(x.carbon_factor,'carbon_factor',false);
  const tco2=q*hv*cf*(44/12);
  if(!Number.isFinite(tco2))throw Error('INVALID_REFERENCE_INPUT:overflow');
  return {schema:'naft-japan-gxets-fuel-reference-1',
    source_type:'FUEL_COMBUSTION',data_kind:'SYNTHETIC',
    status:'RESEARCH_REFERENCE_ONLY',fuel_unit:x.fuel_unit,preview_tco2:tco2,
    reported_direct_tco2:null,allowances:null,official_factors_verified:false,
    boundary_verified:false,certification:null};
}
