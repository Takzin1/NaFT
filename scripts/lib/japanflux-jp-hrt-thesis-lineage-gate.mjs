/* JP-Hrt evidence lineage: PhD 2013 methods != JapanFlux2024 FCH4 row provenance.
 * Pure deterministic source-evidence audit. No calculation, clock or network.
 */
const fail=reason=>{throw Error(reason)};
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const EXPECTED_PDF='613b17df36750cc0917d5c142c377d4f42f58a21b14c14cdaaf591f63b8d376e';
const EXPECTED_ZIP='bffad17bd7acf962eb1af9fa4f2092c038a813291b9fc4c79e548674101d40eb';
const QC=['WIND_DIRECTION_JAPAN','USTAR_LOW_TURBULENCE','RAINFALL','EC150_CO2_OR_H2O_SIGNAL_STRENGTH','NONSTATIONARITY','FOOTPRINT_RICE_PADDY'];
const REQUIREMENTS=[
 'SITE_TEAM_PRE_SUBMISSION_RAW_TO_FCH4_PROVENANCE',
 'PER_ROW_QC_AND_GAP_FILL_STATE',
 'DATE_START_BADM_DISCREPANCY_RESOLUTION',
 'JP_HRT_PDF_METHOD_DESCRIPTION_RECONCILIATION',
 'TIMESTAMP_TIME_BASIS_VALIDATION',
 'INDEPENDENT_BUDGET_REPLAY_WITH_COVERAGE'
];
export function auditJpHrtThesisLineage(data){
 if(!data||data.schema!=='naft-jp-hrt-multi-source-lineage-v1'||
  data.site_id!=='JP-Hrt'||data.site_version!=='2.00'||
  !data.citations||data.citations.komiya_dissertation?.user_supplied_pdf_sha256!==EXPECTED_PDF||
  data.citations.komiya_dissertation?.pdf_not_independently_publisher_hashed!==true||
  data.citations.komiya_dissertation?.permalink!=='http://hdl.handle.net/10291/19662'||
  data.citations.japanflux_data_paper?.doi!=='10.5194/essd-17-3807-2025'||
  data.citations.japanflux_site_dataset?.doi!=='10.17592/001.2024121020'||
  data.citations.japanflux_site_dataset?.original_zip_sha256!==EXPECTED_ZIP)
   fail('JP_HRT_LITERATURE_SOURCE_IDENTITY_OR_HASH_MISMATCH');
 const x=data.observational_thesis;
 if(!x||x.scope!=='STUDY_LEVEL_NOT_PER_PUBLISHED_CSV_ROW'||
  x.country!=='JP'||x.year!==2013||
  x.ch4_method!=='CLOSED_PATH_EDDY_COVARIANCE'||
  x.thai_comparison_method!=='HREA_IN_THAI_2014_NOT_JP_2013'||
  x.ch4_instrument!=='Picarro G2301-f'||
  x.sonic_anemometer!=='Campbell CSAT3A'||
  x.raw_sampling_hz!==10||x.flux_interval_minutes!==30||
  x.flux_calculation_equation!=='KOMIYA_THESIS_EQ_2_5'||
  x.flux_calculation_native_unit!=='mg_CH4_m2_s'||
  !equal(x.correction_steps,['DESPIKING','DOUBLE_ROTATION','LAG_TIME_COMPENSATION','BANDPASS_COVARIANCE_HIGH_FREQUENCY_LOSS'])||
  !Array.isArray(x.quality_rules_study_only)||
  !equal(x.quality_rules_study_only.map(r=>r.rule),QC)||
  x.quality_rules_study_only[1].threshold!=='0.07 m s-1'||
  x.quality_rules_study_only[3].threshold!==0.7||
  x.quality_rules_study_only[4].threshold_percent!==40||
  x.quality_rules_study_only[5].threshold_percent!==60||
  x.quality_rules_documented_pdf_page!==22)
   fail('JP_HRT_THESIS_EC_METHOD_QC_RULES_CHANGED');
 const gap=x.study_ch4_gapfill;
 if(!gap||gap.method!=='SITE_SPECIFIC_LOG_CH4_VS_AIR_TEMPERATURE_REGRESSION'||
  gap.coefficients_or_fitted_parameters_available_in_current_evidence!==false||
  !equal(x.study_budgets,[{period:'DAT36_TO_90',g_CH4_m2:6.8,includes_study_gapfill:true},{period:'DAT0_TO_115',g_CH4_m2:10.1,includes_study_gapfill:true}])||
  x.budget_source_pdf_page!==43||
  x.field_period?.transplanting_jp!=='2013-06-05'||
  x.field_period?.flooding_start!=='2013-05-31'||
  x.field_period?.year_fch4_rows_original_japanflux_not_verified_equal_study_rows!==true)
   fail('JP_HRT_THESIS_BUDGET_OR_GAPFILL_MISMATCH');
 const pub=data.published_japanflux;
 if(!pub||pub.id!=='JAPANFLUX_2024_PUBLISHED_PRODUCT_NOT_STUDY_BUDGET'||
  pub.public_30min_ch4_unit_from_essd_section_2_5!=='nmol_CH4_m2_s'||
  pub.unit_assertion_scope!=='DATA_PAPER_COLUMN_SPECIFICATION_ONLY'||
  pub.network_ch4_gapfill_policy!=='NO_NETWORK_WIDE_CH4_GAP_FILL'||
  pub.site_team_pre_submission_imputation_status!=='UNKNOWN'||
  pub.site_fch4_data_product!=='ALLVARS_HH'||
  pub.site_team_precursor_measurement_to_public_fch4_mapping!=='UNVERIFIED'||
  pub.site_team_per_record_qc_provenance!=='UNVERIFIED'||
  pub.site_timestamp_utc_conversion_approved!==false||
  pub.site_QC_to_thesis_rule_verification!==false||
  pub.retained_qc_unknown_numeric_rows!==1915||
  pub.missing_rows!==15605)
   fail('JP_HRT_PUBLISHED_DATA_PROVENANCE_PROMOTION_BLOCKED');
 const badm=data.badm_legacy_conflicts;
 if(!badm||badm.method_pdf_general!=='HREA_AND_CHAMBER_FOR_CH4'||
  badm.method_badm!=='EDDY_COVARIANCE_FOR_CH4'||
  badm.method_komiya_japan_2013!=='CLOSED_PATH_EDDY_COVARIANCE'||
  badm.thesis_and_badm_method_family_consistent!==true||
  badm.pdf_to_fch4_method_unresolved!==true||
  badm.badm_reported_ch4_start!=='2013-08-31'||
  badm.earlier_fch4_numeric_candidates!==1689||
  badm.early_rows_source_trace_unresolved!==true||
  data.status!=='LITERATURE_PROTOCOL_IDENTIFIED_PUBLISHED_FCH4_ROW_MAPPING_BLOCKED'||
  data.safe_to_use_in_observation_integral!==false||
  data.safe_to_use_in_jcredit!==false||
  data.certified_tco2e!==null||data.scientific_replayed_total!==null||
  !equal(data.missing_requirements,REQUIREMENTS))
   fail('JP_HRT_PUBLICATION_TO_THESIS_TRACE_NOT_CLEARED');
 return {
  schema:'naft-jp-hrt-literature-protocol-gate-v1',
  status:'THESIS_CLOSED_PATH_EC_IDENTIFIED_PUBLISHED_ROWS_NOT_ATTESTED',
  thesis_study_method:'CLOSED_PATH_EDDY_COVARIANCE',
  thesis_comparison_thailand_method:'HREA',
  thesis_study_half_hour_ch4_unit:'mg_CH4_m2_s',
  published_japanflux_spec_half_hour_ch4_unit:'nmol_CH4_m2_s',
  published_japanflux_spec_unit_supported:true,
  published_japanflux_unit_per_row_calibration_attested:false,
  thesis_qc_rule_count:QC.length,
  thesis_qc_applied_to_uploaded_fch4_rows:false,
  original_site_team_processing_unknown:true,
  common_japanflux_ch4_gapfill_applied:false,
  site_team_gapfill_before_submission_verified:false,
  thesis_cultivation_period_gapfill:'LOG_CH4_VS_AIR_TEMPERATURE_REGRESSION',
  thesis_budget_g_CH4_m2:{DAT36_TO_90:6.8,DAT0_TO_115:10.1},
  thesis_budget_replicated_from_japanflux_csv:false,
  badm_method_discrepancy_unresolved:true,
  badm_start_date_discrepancy_unresolved:true,
  published_fch4_verified_observations:0,
  published_fch4_observed_integral:null,
  annual_ch4:null,
  certified_tco2e:null
 };
}
