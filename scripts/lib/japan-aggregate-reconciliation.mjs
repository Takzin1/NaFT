/* NaFT Japan: explicitly scoped observed-period vs supplied aggregate comparison.
 * OFFLINE RESEARCH ONLY. It never verifies publisher identity, physical comparability
 * or J-Credit eligibility. No gap filling, cross-window extrapolation or attribution.
 */
import {createHash} from 'node:crypto';
import {replayObservationSeries} from './japan-observation-adapters.mjs';

const stop=code=>{throw Error(code)};
const DECIMAL=/^-?(?:0|[1-9]\d{0,8})(?:\.\d{1,9})?$/;
const SCALE=1000000000n;
function fixed9(s,code){
 if(typeof s!=='string'||!DECIMAL.test(s))stop(code);
 const negative=s.startsWith('-');
 const [whole,fraction='']=(negative?s.slice(1):s).split('.');
 const integer=BigInt(whole)*SCALE+BigInt(fraction.padEnd(9,'0')||'0');
 return negative?-integer:integer;
}
function display9(v){
 const negative=v<0n,abs=negative?-v:v;
 const whole=abs/SCALE,frac=(abs%SCALE).toString().padStart(9,'0');
 return (negative&&abs!==0n?'-':'')+whole+'.'+frac;
}
const EXACT_FIELDS=Object.freeze([
 'source_uri','site_id','plot_id','treatment','measurement_method',
 'observation_start_utc','observation_end_utc','country','gas','mass_basis',
 'data_class','source_license_status'
]);
function isValidSourceClass(value){return value==='SYNTHETIC'||value==='USER_SUPPLIED_UNVERIFIED'}
export function reconcileObservationAggregate(csvBytes,manifest,reference){
 // Always re-run the complete byte/period/QC/manifest validator; never trust
 // a caller-supplied prior JSON result that could falsely assert full coverage.
 const replay=replayObservationSeries(csvBytes,manifest);
 if(!reference||typeof reference!=='object'||Array.isArray(reference)||
    reference.schema!=='naft-observation-aggregate-reference-v1'||
    reference.comparison_purpose!=='RESEARCH_ARITHMETIC_ONLY'||
    reference.aggregate_semantics!=='EXPLICIT_WINDOW_CUMULATIVE_CH4'||
    reference.aggregate_unit!=='mg_CH4_m2'||
    reference.window_basis!=='EXPLICIT_OBSERVED_INTERVALS')
  stop('RECON_REFERENCE_SCHEMA_OR_UNIT_UNSUPPORTED');
 if(manifest.mass_basis!=='CH4_MOLECULAR')stop('RECON_INPUT_MASS_BASIS_UNSUPPORTED');
 if(!isValidSourceClass(reference.data_class)||reference.data_class!==manifest.data_class)
  stop('RECON_DATA_CLASS_MISMATCH');
 if(reference.original_publisher_bytes_verified!==false||
    reference.conditions_independently_matched!==false||
    reference.official_eligibility_verified!==false)
  stop('RECON_SELF_ATTESTATION_FORBIDDEN');
 if(reference.csv_sha256!==replay.csv_digest_sha256)
  stop('RECON_INPUT_DIGEST_MISMATCH');
 for(const key of EXACT_FIELDS){
  if(typeof reference[key]!=='string'||!reference[key].trim()||
     reference[key]!==manifest[key])stop('RECON_CONTEXT_MISMATCH:'+key);
 }
 // Dates/temporal semantics and the observation window are already checked in
 // replayObservationSeries, and are now cross-checked against the reference.
 if(replay.coverage_status!=='COMPLETE_OBSERVED'||
    replay.observed_seconds!==replay.window_seconds||
    replay.excluded_qc_seconds!=='0'||replay.unrepresented_gap_seconds!=='0'||
    replay.gap_fill_applied!==false||replay.certified_tco2e!==null)
  stop('RECON_FULL_OBSERVED_COVERAGE_REQUIRED');
 const report=fixed9(reference.reported_cumulative_mg_ch4_m2,'RECON_REPORTED_DECIMAL_INVALID');
 const resolution=fixed9(reference.printed_resolution_mg_ch4_m2,'RECON_RESOLUTION_INVALID');
 if(resolution<=0n)stop('RECON_RESOLUTION_NONPOSITIVE');
 // On the ingestion side, summation is exact until the existing replay output
 // rounds to 9 decimal places. The comparison never substitutes a modelled total.
 const observed=fixed9(replay.full_window_total_mg_ch4_m2,'RECON_REPLAY_TOTAL_INVALID');
 const difference=observed-report;
 const abs=difference<0n?-difference:difference;
 const referenceDigest=createHash('sha256').update(JSON.stringify(reference)).digest('hex');
 return {
  schema:'naft-observation-aggregate-comparison-v1',
  status:'RESEARCH_ARITHMETIC_NOT_SOURCE_VERIFICATION',
  comparison_scope:'SAME_DECLARED_SITE_PLOT_TREATMENT_METHOD_AND_EXACT_WINDOW',
  data_class:replay.data_class,gas:'CH4',mass_basis:'CH4_MOLECULAR',
  reference_semantics:reference.aggregate_semantics,
  csv_digest_sha256:replay.csv_digest_sha256,
  reference_json_sha256:referenceDigest,
  observation_start_utc:manifest.observation_start_utc,
  observation_end_utc:manifest.observation_end_utc,
  coverage_status:replay.coverage_status,
  replayed_mg_ch4_m2:display9(observed),
  supplied_reported_mg_ch4_m2:display9(report),
  replayed_minus_reported_mg_ch4_m2:display9(difference),
  absolute_difference_mg_ch4_m2:display9(abs),
  declared_printed_resolution_mg_ch4_m2:display9(resolution),
  display_resolution_compatible:abs*2n<=resolution,
  rounding_cause_verified:false,
  reference_content_independently_attested:false,
  environmental_conditions_independently_verified:false,
  original_publisher_observations_reproduced:false,
  uncertainty_interval:null,causal_attribution:null,
  official_japan_factor_applicable:null,certified_tco2e:null,
  warning:'Matching user-declared metadata and printed precision do not prove original-source authenticity, exact scientific comparability, or why values differ.'
 };
}
