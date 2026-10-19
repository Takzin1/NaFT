import {auditJapanfluxJpHrtBadm} from './japanflux-jp-hrt-badm-gate.mjs';
import {auditJpHrtThesisLineage} from './japanflux-jp-hrt-thesis-lineage-gate.mjs';
import {auditTellusEcOptionsReference} from './japanflux-ec-tellus-reference-gate.mjs';
/* JP-Hrt v2.00 post-inspection data-semantics gate.
 * A numeric FCH4-shaped field does not mean observed, valid, QC-approved,
 * correctly unit-normalized, or within any credited monitoring period.
 * Source PDF: HREA/chamber CH4; do not automatically call it eddy covariance.
 */
const BLOCK=code=>{throw Error(code)};
const SHA=/^[0-9a-f]{64}$/;
const ORIGINAL='bffad17bd7acf962eb1af9fa4f2092c038a813291b9fc4c79e548674101d40eb';
const PDF='855100367b84c856801119571fe0b3bd98a9a6782d7de8acfbb9818352f408ed';
const DATA=Object.freeze({
 hourly_half_hourly:{sha:'3692a7b3d4da4b8fb19eade724f785289c74e94a63de4742e62d9e08c01d2e95',rows:17520,numeric:1915,missing:15605,fields:85},
 daily:{sha:'447f5f97fa45c9f3ff9339c1a574210d51077e115c096b159a5b4e55a61ed9dc',rows:365,numeric:0,missing:365,fields:89}
});
export function reviewJapanfluxJpHrtSource(report,badm,thesisLineage,ecOptionsReference=null){
 if(!report||report.schema!=='naft-japanflux-jp-hrt-v200-native-preflight-v1'||
   report.source_id!=='A20241210-020'||report.site_id!=='JP-Hrt'||
   report.source_version!=='2.00'||report.archive_type!=='UPLOADED_ORIGINAL_SHA_MATCH')
  BLOCK('JP_HRT_SOURCE_IDENTITY_UNSUPPORTED');
 if(report.archive_sha256!==ORIGINAL||report.source_metadata_pdf_sha256!==PDF)
  BLOCK('JP_HRT_SOURCE_SHA256_UNPINNED');
 if(report.metadata_pdf_method!=='HREA_AND_CHAMBER_FOR_CH4')
  BLOCK('JP_HRT_SOURCE_METHOD_UNPINNED');
 if(report.status!=='JP_HRT_NATIVE_STRUCTURE_ONLY_REPLAY_BLOCKED'||
   report.time_zone_utc_mapping_verified!==false||
   report.source_ch4_unit_independently_verified!==false||
   report.per_reading_qc_mapping_approved!==false||
   report.source_method_to_FCH4_field_mapping_verified!==false||
   report.gap_fill_allowed!==false||
   report.all_rows_research_normalization_eligible!==false||
   report.dataset_publisher_bytes_independently_attested!==false||
   report.raw_readings_redistributed!==false||
   report.scientific_integral!==null||
   report.certified_tco2e!==null)
  BLOCK('JP_HRT_UNSUPPORTED_ATTESTATION_OR_NORMALIZATION');
 const badmAudit=auditJapanfluxJpHrtBadm(badm);
 const literatureAudit=auditJpHrtThesisLineage(thesisLineage);
 const ecReferenceAudit=ecOptionsReference===null?null:auditTellusEcOptionsReference(ecOptionsReference);
 const observations={};
 for(const [period,expected] of Object.entries(DATA)){
  const x=report[period];
  if(!x||x.source_csv_sha256!==expected.sha||!SHA.test(x.source_csv_sha256)||
   x.row_count!==expected.rows||x.field_count!==expected.fields||
   x.fch4_numeric_qc_unclassified_rows!==expected.numeric||
   x.fch4_missing_rows!==expected.missing||
   x.fch4_duplicate_columns_equal!==true||
   x.readings_accepted_as_verified_observations!==0||
   x.emissions_integral_mg_ch4_m2!==null||
   x.annual_emissions_mg_ch4_m2!==null||
   x.native_timestamp_timezone!=='UNVERIFIED_LOCAL_OR_OTHER'||
   x.native_flux_unit!=='UNVERIFIED'||x.native_flux_measurement_qc!=='UNKNOWN')
   BLOCK('JP_HRT_COVERAGE_OR_QC_EVIDENCE_MISMATCH:'+period);
  observations[period]={
   rows:expected.rows,
   numeric_lexemes_processing_unknown:expected.numeric,
   missing_flux_rows:expected.missing,
   measured_qc_verified_rows:0,
   verified_observed_emission_intervals:0,
   percentage_numeric_unclassified:(100*expected.numeric/expected.rows).toFixed(3),
   available_for_normalization:false
  };
 }
 return {
  schema:'naft-source-semantic-gate-v1',
  source_id:'A20241210-020',site_id:'JP-Hrt',source_version:'2.00',
  status:'SOURCE_CH4_ROW_QC_AND_LINEAGE_BLOCKED',
  classes:Object.freeze({
   NUMERIC_QC_UNKNOWN:observations.hourly_half_hourly.numeric_lexemes_processing_unknown,
   MISSING:observations.hourly_half_hourly.missing_flux_rows,
   VERIFIED_MEASURED:0,
   VERIFIED_GAP_FILLED:0,
   MODEL_DERIVED:0
  }),
  evidence:observations,
  badm_audit:badmAudit,
  literature_protocol_audit:literatureAudit,
  ec_method_options_supplementary_audit:ecReferenceAudit,
  published_fch4_unit_from_essd_spec:'nmol_CH4_m2_s',
  published_fch4_unit_spec_confirmed:true,
  individual_fch4_row_calibration_verified:false,
  thesis_study_budget_comparable_to_non_gapfilled_fch4:false,
  source_methods_in_conflict:true,
  badm_declared_utc_offset_hours:9,
  timezone_resolved_for_observations:false,
  numeric_flux_candidates_earlier_than_badm_start:1689,
  ch4_measurement_metadata:'HREA_AND_CHAMBER_FOR_CH4',
  published_csv_FCH4_method_trace_verified:false,
  scientific_amount_mg_ch4_m2:null,
  modeled_annual_emissions:null,
  official_factor_applicable:null,
  certified_tco2e:null,
  next_gate:'REVIEW_SITE_TEAM_PRE_SUBMISSION_FCH4_PIPELINE_ROW_QC_TIME_SUPPORT_AND_BADM_DATE_DISCREPANCY'
 };
}
