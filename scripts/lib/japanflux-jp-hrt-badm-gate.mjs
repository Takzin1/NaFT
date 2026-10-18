/* JP-Hrt BADM provenance and method/date contradiction gate.
 * Pinned descriptive statements are not scientific clearance of FCH4 units,
 * timestamps, instrumental traceability, row QC or emission integrals.
 */
const DENY=code=>{throw Error(code)};
const ARCHIVE='bffad17bd7acf962eb1af9fa4f2092c038a813291b9fc4c79e548674101d40eb';
const HASHES=Object.freeze({
 Site_General_Info:'ed2c231a290eab9aa297b491104e8c0977a986152f4a1658cfe913bad4e7f847',
 Instrument:'dca1e8ca1d1c5572ca83a0363385a982af9972185da719615c20b86e960d1d95',
 Instrument_Ops:'eaca9bc2aa28ba9ee139a20f72220852c5d4af5d1128631b8e89f3ea105693ca',
 Disturbance_and_Management:'3bcf6b6a55dbaf5e9841b442064485ebbc8af6e658042d8108fb68a0516d4ac3',
 Soil:'2b7ae9266ce49825d5f88bfdc1dced755c4eef5dc55ca58a5bab0c344e0ceb33',
 VegCover:'68583d5e04dbf77b0d7bd665791edda663383a823ea8a39acffd92ffad2256fa'
});
const same=(x,y)=>JSON.stringify(x)===JSON.stringify(y);
export function auditJapanfluxJpHrtBadm(evidence){
 if(!evidence||evidence.schema!=='naft-japanflux-jp-hrt-badm-protocol-v1'||
    evidence.site_id!=='JP-Hrt'||evidence.version!=='2.00'||
    evidence.archive_sha256!==ARCHIVE||!evidence.badm_sha256||
    !same(Object.keys(evidence.badm_sha256).sort(),Object.keys(HASHES).sort())||
    Object.entries(HASHES).some(([key,value])=>evidence.badm_sha256[key]!==value))
  DENY('JP_HRT_BADM_IDENTITY_OR_HASH_MISMATCH');
 if(evidence.site_utc_offset_hours_declared!==9||
    !same(evidence.badm_flux_variables,['CO2','H2O','CH4'])||
    !same(evidence.badm_flux_methods,['Eddy Covariance','Eddy Covariance','Eddy Covariance'])||
    !same(evidence.badm_flux_start_dates,['20130831','20130831','20130831'])||
    evidence.pdf_ch4_method!=='HREA_AND_CHAMBER_FOR_CH4'||
    !same(evidence.instrument_model_identifiers,
      ['GA_OP-Campbell EC150','GA_CP-Picarro G2301-f','SA-Campbell CSAT-3A'])||
    evidence.water_management_vocabulary!=='Irrigation')
  DENY('JP_HRT_BADM_SOURCE_FACTS_CHANGED');
 if(evidence.method_disagreement!==true||
    evidence.badm_start_inconsistent_with_hh_numeric_period!==true||
    evidence.hh_numeric_candidate_count!==1915||evidence.hh_missing_count!==15605||
    evidence.hh_first_numeric_native!=='201306010700'||
    evidence.hh_last_numeric_native!=='201309201030'||
    evidence.hh_numeric_before_badm_start!==1689)
  DENY('JP_HRT_BADM_METHOD_OR_DATE_CONFLICT_NOT_PRESERVED');
 if(evidence.status!=='BADM_METHOD_AND_START_DATE_CONFLICT_REVIEW_REQUIRED'||
    evidence.timezone_column_mapping_independently_validated!==false||
    evidence.instrument_ch4_channel_mapping_verified!==false||
    evidence.source_FCH4_native_unit_verified!==false||
    evidence.per_row_ch4_qc_flag_available!==false||
    evidence.measured_vs_gapfilled_resolved!==false||
    evidence.emission_integral!==null||evidence.certified_tco2e!==null)
  DENY('JP_HRT_BADM_SCIENTIFIC_CLEARANCE_UNSUPPORTED');
 return {
  schema:'naft-japanflux-jp-hrt-badm-gate-v1',
  status:'CONFLICTING_SOURCE_METHOD_AND_START_DATE',
  badm_offset_hours_declared:9,
  native_time_to_utc_verified:false,
  source_method_ambiguity:'PDF_HREA_AND_CHAMBER_VS_BADM_EDDY_COVARIANCE',
  declared_ch4_start_date:'20130831',
  earlier_native_numeric_flux_candidates:1689,
  earliest_flux_candidate_native:'201306010700',
  source_fch4_method_mapping_approved:false,
  observed_ch4_record_count_approved:0,
  publisher_instrument_calibration_attested:false,
  annual_ch4_total:null,
  certified_tco2e:null
 };
}
