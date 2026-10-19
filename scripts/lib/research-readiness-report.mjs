/* NaFT deterministic research-evidence readiness report.
 * This report audits pinned SOURCE MANIFESTS, not original source bytes.
 * No external attestation, no wall clock, no network, no raw flux replay.
 */
import {createHash} from 'node:crypto';
import {reviewJapanfluxJpHrtSource} from './japanflux-jp-hrt-source-gate.mjs';
import {auditRiceStandardsSources,examineGoldScenario3MethaneSubterm} from './rice-standards-source-gate.mjs';

const requireFact=(condition,code)=>{if(!condition)throw Error(code)};
export const stableJson=(value)=>{
 if(value===null||typeof value!=='object')return JSON.stringify(value);
 if(Array.isArray(value))return '['+value.map(stableJson).join(',')+']';
 return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+stableJson(value[k])).join(',')+'}';
};
const hashData=value=>createHash('sha256').update(stableJson(value),'utf8').digest('hex');
const claim=(id,scope,assurance,status,source,details)=>({id,scope,assurance,status,source,details});
const blocker=(id,priority,scope,reason,required_evidence,source)=>({
 id,priority,scope,status:'OPEN_NOT_HUMAN_OVERRIDABLE',reason,required_evidence,source
});
export function buildResearchReadinessReport({coverage,badm,thesis,tellus,rice}={}){
 // Independent strict source audits are required first; a source-supplied
 // "verified" flag cannot bypass them, and an optional source cannot be a
 // missing/invalid bypass in this reproducible comprehensive profile.
 requireFact(coverage&&badm&&thesis&&tellus&&rice,'READINESS_ALL_FIVE_SOURCE_MANIFESTS_REQUIRED');
 const jp=reviewJapanfluxJpHrtSource(coverage,badm,thesis,tellus);
 const gs=auditRiceStandardsSources(rice);
 const sub=examineGoldScenario3MethaneSubterm(rice);
 requireFact(jp.status==='SOURCE_CH4_ROW_QC_AND_LINEAGE_BLOCKED'&&
  jp.literature_protocol_audit.status==='THESIS_CLOSED_PATH_EC_IDENTIFIED_PUBLISHED_ROWS_NOT_ATTESTED'&&
  jp.ec_method_options_supplementary_audit.status==='EC_OPTIONS_CONTEXT_ONLY_CH4_REPLAY_BLOCKED'&&
  gs.status==='SOURCE_INSPECTED_NOT_INDEPENDENT_ORACLE_VERIFIED'&&
  gs.cross_document_tier_number_conflict===true&&
  sub.final_certified_emission_reductions_tco2e===null&&
  coverage.hourly_half_hourly.row_count===
   coverage.hourly_half_hourly.fch4_numeric_qc_unclassified_rows+coverage.hourly_half_hourly.fch4_missing_rows,
  'READINESS_SCIENCE_OR_TIER_STATUS_CHANGED');
 const hr=coverage.hourly_half_hourly;
 const sourceRefs={
  japanflux_zip:{
   scope:'USER_SUPPLIED_JP_HRT_V2_ARCHIVE_HASH_ONLY',
   sha256:coverage.archive_sha256,
   version:coverage.source_version,
   url:'https://doi.org/10.17592/001.2024121020'
  },
  komiya_dissertation:{
   scope:'THESIS_STUDY_2013_NOT_PUBLIC_FCH4_ROWS',
   sha256:thesis.citations.komiya_dissertation.user_supplied_pdf_sha256,
   version:'USER_PDF_RESEARCH_COPY',
   url:thesis.citations.komiya_dissertation.repository_url
  },
  tellus_ec_options:{
   scope:'MSE_2005_H_LE_CO2_NOT_JP_HRT_CH4',
   sha256:tellus.source.pdf_sha256,
   version:'TELLUS_B_2012',
   url:tellus.source.url
  },
  verra_vm0051:{
   scope:'VERRA_METHOD_2026_NOT_JAPAN_AG005',
   sha256:rice.source_files.verra_vm0051_v11.sha256,
   version:'VM0051_V1.1',
   url:rice.source_files.verra_vm0051_v11.source_url
  },
  gold_workbook:{
   scope:'GOLD_AWD_TRAINING_ONLY',
   sha256:rice.source_files.gold_calculation_tool.sha256,
   version:'AWD_TOOL_V1.1',
   url:'https://globalgoals.goldstandard.org/'
  },
  gold_validation_checklist:{
   scope:'GOLD_AWD_VVB_CHECKLIST_ONLY',
   sha256:rice.source_files.gold_validation_checklist.sha256,
   version:'VVB_V1.0',
   url:'https://globalgoals.goldstandard.org/'
  }
 };
 const claims=[
  claim('JP_HRT_ARCHIVE_FINGERPRINT','JP_HRT','SOURCE_BYTES_HASH_PINNED','SUPPORTED_AS_LOCAL_FILE_FINGERPRINT','japanflux_zip',
    'The supplied original ZIP and selected CSV/PDF identities are pinned, not independently publisher-attested.'),
  claim('JP_HRT_FCH4_AVAILABILITY','JP_HRT','STRUCTURAL_ONLY','SUPPORTED_WITH_QC_UNKNOWN','japanflux_zip',
    'HH: '+hr.fch4_numeric_qc_unclassified_rows+'/'+hr.row_count+
    ' numeric FCH4 lexemes; '+hr.fch4_missing_rows+' missing; numeric does not mean valid measured flux.'),
  claim('JP_HRT_THESIS_METHOD','2013_JAPAN_STUDY','LITERATURE_LEVEL','SUPPORTED_STUDY_SCOPE_ONLY','komiya_dissertation',
    'The cited Japanese 2013 thesis study used closed-path EC; the published 2024 row-level lineage remains unknown.'),
  claim('JP_HRT_PUBLISHED_UNIT','JAPANFLUX_PUBLIC_SPEC','DATA_PAPER_SPECIFICATION_ONLY','SUPPORTED_SPEC_ONLY','japanflux_zip',
    'Data-paper public CH4 unit nmol m-2 s-1, not per-record calibrated or QC-accepted.'),
  claim('TELLUS_METHOD_COMPARISON','MSE_2005','COMPARATIVE_REFERENCE_ONLY','NOT_JP_HRT_CH4_EVIDENCE','tellus_ec_options',
    'Eddy covariance options for H/LE/CO2; not a CH4 correction coefficient or original site software settings.'),
  claim('GOLD_TIER_DOCUMENT_CONFLICT','GOLD_AWD','CONFLICT_PRESERVED','REVIEW_REQUIRED','gold_validation_checklist',
    'Gold Standard VVB Tier 1/3 labeling differs from the accompanying tool/scenarios; do not auto-map bare labels.'),
  claim('GOLD_SCENARIO_3_CH4_COMPONENT','GOLD_AWD_TRAINING','TRAINING_ARITHMETIC_ONLY','ILLUSTRATIVE_NOT_COMPLETE_ER','gold_workbook',
    'CH4 only: '+sub.illustrative_methane_component_after_10pct_deduction_tco2e_per_year+
    ' tCO2e/year after illustrative 10% deduction; N2O, fuel and eligibility not accounted for.')
 ];
 const blockers=[
  blocker('JP_HRT_SOURCE_TO_ROW_LINEAGE','P0','JP_HRT',
   'A site-level published FCH4 numeric value is not mapped to the upstream sensor/computation/QC record.',
   'Site PI 10Hz/processed 30-min files, instrument version, Flux Calculator options, timestamp matching and reviewable transformation log.',
   'japanflux_zip'),
  blocker('JP_HRT_ROW_QC_OR_GAPFILL','P0','JP_HRT',
   'The 1,915 numeric FCH4 candidates cannot be automatically promoted to independently QC-verified observations.',
   'Per-record QC/rejection reasons, source-team pre-submission imputation history and measured-vs-modeled classifications.',
   'komiya_dissertation'),
  blocker('JP_HRT_BADM_DATE_AND_METHOD','P0','JP_HRT',
   '1,689 numeric candidates predate the BADM CH4 start date and shared metadata contains broader site-method labels.',
   'Site PI explanation of the 2013-08-31 metadata, and source-specific FCH4 production method by period.',
   'japanflux_zip'),
  blocker('JP_HRT_TIMESTAMP_AND_COVERAGE','P0','JP_HRT',
   'UTC offset declaration is not sufficient to certify interval semantics; only 1,915 of 17,520 native HH slots contain FCH4 values.',
   'Source-specific timestamp specification, site seasons/field coverage and scientifically justified gap treatment.',
   'japanflux_zip'),
  blocker('GOLD_STANDARD_TIER_INCONSISTENCY','P1','GOLD_AWD',
   'VVB checklist Tier 1/3 descriptions conflict with the workbook and exercises.',
   'Gold Standard publisher clarification or methodology-version resolution; never silently translate labels.',
   'gold_validation_checklist'),
  blocker('GOLD_WORKBOOK_ORACLE_INCOMPLETE','P1','GOLD_AWD',
   'The CH4-only subterm is not a source-workbook three-scenario independent replay.',
   'Version-locked input-cell maps, independent recalculation, N2O/fuel/leakage factors and complete case reconciliation.',
   'gold_workbook'),
  blocker('EXTERNAL_ATTESTATION_ABSENT','P1','CROSS_PROGRAM',
   'No accredited validation, independent publisher signature or official credit issuance is established.',
   'Appropriate VVB review, current official methodology eligibility and trustworthy signed provenance after separate review.',
   'verra_vm0051')
 ];
 const report={
  schema:'naft-research-readiness-report-v1',
  kind:'RESEARCH_DEMO_NOT_AUDIT_CERTIFICATE',
  snapshot_label:'PINNED_RESEARCH_SOURCES_2026_10_19',
  evidence_fingerprint_kind:'SHA256_OF_MANIFESTS_NOT_PUBLISHER_SIGNATURE',
  sources:sourceRefs,
  claims,
  unresolved_blockers:blockers,
  readiness:{
   reproducible_source_manifest_audit:'PASS_ON_PINNED_LOCAL_RESEARCH_MANIFESTS',
   original_sensor_to_published_fch4:'BLOCKED',
   jp_hrt_scientific_observation_integral:'BLOCKED',
   gold_full_workbook_independent_replay:'BLOCKED',
   source_specific_methods_interoperability:'CONFLICT_REVIEW_REQUIRED',
   methodological_label_integrity:'CONFLICT_DETECTED',
   formal_mrv_accreditation:'NOT_CLAIMED'
  },
  counts:{
   source_references:Object.keys(sourceRefs).length,
   supported_or_bounded_claims:claims.length,
   open_blockers:blockers.length,
   p0:blockers.filter(x=>x.priority==='P0').length,
   p1:blockers.filter(x=>x.priority==='P1').length,
   jp_hrt_half_hour_slots:hr.row_count,
   jp_hrt_flux_numeric_qc_unknown:hr.fch4_numeric_qc_unclassified_rows,
   jp_hrt_missing_flux:hr.fch4_missing_rows,
   jp_hrt_qc_verified_observations:jp.classes.VERIFIED_MEASURED
  },
  original_measurement_rows_republished:false,
  source_correspondence_or_personal_email_republished:false,
  operator_override_unverified_science:false,
  annual_ch4_mg_m2:null,
  officially_certified_tco2e:null,
  final_credit_issuance:null
 };
 return {...report,content_sha256:hashData(report)};
}
export function renderResearchReadinessMarkdown(report){
 requireFact(report?.schema==='naft-research-readiness-report-v1'&&
  report.content_sha256===hashData(Object.fromEntries(Object.entries(report).filter(([key])=>key!=='content_sha256'))),
  'READINESS_REPORT_HASH_INTEGRITY_FAILED');
 const lines=[
  '# NaFT — Research Evidence Readiness',
  '',
  'This is a reproducible research-source audit, NOT a formal MRV certification.',
  '',
  'Report SHA-256: '+report.content_sha256,
  '',
  '## Coverage and scope',
  '',
  'JP-Hrt half-hour slots: '+report.counts.jp_hrt_half_hour_slots,
  'FCH4 numeric, QC unknown: '+report.counts.jp_hrt_flux_numeric_qc_unknown,
  'FCH4 missing: '+report.counts.jp_hrt_missing_flux,
  'Independently QC-approved observations: '+report.counts.jp_hrt_qc_verified_observations,
  '',
  '## Open evidence requirements',
  ''
 ];
 for(const x of report.unresolved_blockers){
  lines.push('- '+x.priority+' / '+x.id+': '+x.reason);
  lines.push('  Needed: '+x.required_evidence+' (source: '+x.source+')');
 }
 lines.push('','## Evidence boundaries','');
 for(const c of report.claims)lines.push('- '+c.id+' ['+c.assurance+']: '+c.details);
 lines.push('','Annual CH4 / certified credits: NOT calculated, NOT attested.','');
 return lines.join('\n');
}
