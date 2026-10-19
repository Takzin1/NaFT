import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {buildResearchReadinessReport,renderResearchReadinessMarkdown,stableJson} from '../scripts/lib/research-readiness-report.mjs';

const json=path=>JSON.parse(readFileSync(path,'utf8'));
const inputs={
 coverage:json('research/japanflux-jp-hrt-v200/selected-native-source-coverage.json'),
 badm:json('research/japanflux-jp-hrt-v200/badm-concordance-2026-10-19.json'),
 thesis:json('research/japanflux-jp-hrt-v200/komiya-thesis-study-to-published-lineage.json'),
 tellus:json('research/japanflux-jp-hrt-v200/tellus-ueyama-2012-ec-options-reference.json'),
 rice:json('research/rice-mrv-2026-10-19/standards-and-training-source-manifest.json')
};
const before=JSON.stringify(inputs);
let n=0;
const eq=(a,b)=>{assert.deepEqual(a,b);n++;};
const rej=(fn,match)=>{assert.throws(fn,new RegExp(match));n++;};
const r=buildResearchReadinessReport(inputs);
eq(r.kind,'RESEARCH_DEMO_NOT_AUDIT_CERTIFICATE');
eq(r.snapshot_label,'PINNED_RESEARCH_SOURCES_2026_10_19');
eq(r.evidence_fingerprint_kind,'SHA256_OF_MANIFESTS_NOT_PUBLISHER_SIGNATURE');
eq(r.readiness.original_sensor_to_published_fch4,'BLOCKED');
eq(r.readiness.gold_full_workbook_independent_replay,'BLOCKED');
eq(r.readiness.formal_mrv_accreditation,'NOT_CLAIMED');
eq(r.counts.source_references,6);
eq(r.counts.supported_or_bounded_claims,7);
eq(r.counts.open_blockers,7);
eq(r.counts.p0,4);
eq(r.counts.p1,3);
eq(r.counts.jp_hrt_half_hour_slots,17520);
eq(r.counts.jp_hrt_flux_numeric_qc_unknown,1915);
eq(r.counts.jp_hrt_missing_flux,15605);
eq(r.counts.jp_hrt_qc_verified_observations,0);
eq(r.unresolved_blockers.every(b=>b.status==='OPEN_NOT_HUMAN_OVERRIDABLE'),true);
eq(r.unresolved_blockers.filter(b=>b.scope==='JP_HRT').length,4);
eq(r.claims.find(c=>c.id==='GOLD_SCENARIO_3_CH4_COMPONENT').details.includes('81900'),true);
eq(r.sources.tellus_ec_options.scope,'MSE_2005_H_LE_CO2_NOT_JP_HRT_CH4');
eq(r.original_measurement_rows_republished,false);
eq(r.source_correspondence_or_personal_email_republished,false);
eq(r.operator_override_unverified_science,false);
eq(r.annual_ch4_mg_m2,null);
eq(r.officially_certified_tco2e,null);
eq(r.final_credit_issuance,null);
eq(/^[0-9a-f]{64}$/.test(r.content_sha256),true);
const {content_sha256,...unhashed}=r;
eq(content_sha256,createHash('sha256').update(stableJson(unhashed)).digest('hex'));
eq(JSON.stringify(r),JSON.stringify(buildResearchReadinessReport(inputs)));
eq(JSON.stringify(inputs),before);
rej(()=>buildResearchReadinessReport({}),'ALL_FIVE_SOURCE_MANIFESTS');
rej(()=>buildResearchReadinessReport({...inputs,tellus:null}),'ALL_FIVE_SOURCE_MANIFESTS');
const modified=(fn,match)=>{
 const copy=structuredClone(inputs);fn(copy);
 rej(()=>buildResearchReadinessReport(copy),match);
};
modified(x=>{x.coverage.hourly_half_hourly.fch4_numeric_qc_unclassified_rows=17520},'COVERAGE_OR_QC');
modified(x=>{x.coverage.certified_tco2e=1},'UNSUPPORTED_ATTESTATION');
modified(x=>{x.badm.hh_numeric_before_badm_start=0},'BADM_METHOD_OR_DATE');
modified(x=>{x.thesis.published_japanflux.site_team_per_record_qc_provenance='VERIFIED'},'PUBLISHED_DATA');
modified(x=>{x.tellus.study.ch4_experiment_data_present=true},'EXPERIMENT_SITE_OR_GAS');
modified(x=>{x.rice.source_files.gold_validation_checklist.tier_labels_as_printed.Tier1='SIMPLIFIED_DEFAULT_FACTORS'},'VVB');
modified(x=>{x.rice.cross_source_conclusions.full_scenario_outputs_proven_reproduced=true},'CROSS_PROGRAM');
modified(x=>{x.rice.cross_source_conclusions.formal_credit_tco2e=81900},'CROSS_PROGRAM');
modified(x=>{x.rice.source_files.verra_vm0051_v11.version='1.0'},'VERRA');
modified(x=>{x.rice.source_files.gold_calculation_tool.gwp_ch4_ar5=27.2},'WORKBOOK');
const markdown=renderResearchReadinessMarkdown(r);
eq(markdown.includes('JP_HRT_ROW_QC_OR_GAPFILL'),true);
eq(markdown.includes('NOT a formal MRV certification'),true);
eq(markdown.includes(r.content_sha256),true);
eq(markdown.includes('Independently QC-approved observations: 0'),true);
eq(markdown.includes('81900'),true);
rej(()=>renderResearchReadinessMarkdown({...r,counts:{...r.counts,jp_hrt_qc_verified_observations:1915}}),'HASH_INTEGRITY_FAILED');
rej(()=>renderResearchReadinessMarkdown({...r,content_sha256:'0'.repeat(64)}),'HASH_INTEGRITY_FAILED');
const cli=args=>spawnSync(process.execPath,['scripts/report-research-readiness.mjs',...args],{
 encoding:'utf8',timeout:20000,maxBuffer:1048576});
const plain=cli([]);
eq(plain.status,0);
eq(JSON.parse(plain.stdout).content_sha256,r.content_sha256);
eq(plain.stderr,'');
const prettymd=cli(['--format','markdown','--verify',r.content_sha256]);
eq(prettymd.status,0);
eq(prettymd.stdout,markdown);
const wrong=cli(['--verify','0'.repeat(64)]);
assert.notEqual(wrong.status,0);n++;
eq(wrong.stdout,'');
eq(wrong.stderr.includes('READINESS_DIGEST_MISMATCH'),true);
const unsupported=cli(['--format','csv']);
assert.notEqual(unsupported.status,0);n++;
eq(unsupported.stdout,'');
const malicious=cli(['--format','json','--unknown']);
assert.notEqual(malicious.status,0);n++;
eq(malicious.stdout,'');
const help=cli(['--help']);
eq(help.status,0);
eq(help.stdout.includes('Usage: node scripts/report-research-readiness.mjs'),true);
console.log('NAFT_RESEARCH_READINESS_PASS: '+n+' deterministic provenance, fail-closed, CLI and integrity assertions');
