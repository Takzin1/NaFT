import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {stableJson} from '../scripts/lib/research-readiness-report.mjs';
import {loadP9PrefectureRegister,validateP9PrefectureRegister,
 researchP9PrefectureAudit,historicalAg005Preview,verifyP9Preview}
 from '../scripts/p9-prefecture-rice-source-guard.mjs';
let n=0;const eq=(a,b)=>{assert.deepEqual(a,b);n++};
const denied=(fn,msg)=>{assert.throws(fn,new RegExp(msg));n++};
const g=loadP9PrefectureRegister();
const fixture=JSON.parse(readFileSync('fixtures/p9-synthetic-ag005-v1-preview.json','utf8'));
eq(validateP9PrefectureRegister(g),true);
eq(g.prefectures.length,47);
eq(g.regional_pdf_sources.length,15);
eq(g.prefectures[0].name,'北海道');
eq(g.prefectures[46].name,'沖縄県');
eq(g.prefectures[12].rice_area_ha,107);
eq(g.prefectures[6].rice_area_ha,62700);
eq(g.prefectures[6].reported_harvest_brown_rice_t,356800);
eq(g.prefectures[14].reported_harvest_brown_rice_t,622800);
eq(g.prefectures[38].reported_yield_kg_per_10a,409);
eq(g.national_source.raw_pdf_sha256,null);
eq(g.publisher_authenticated_raw_files,0);
eq(g.certified_ag005_emission_factors,0);
eq(g.verified_ch4_flux_rows_added,0);
eq(g.officially_certified_tco2e,null);
eq(g.prefecture_specific_pdf_coverage_incomplete,true);
eq(g.historical_method_source.current_adopted_version_verified,false);
eq(g.formula_registry.length,4);
eq(g.formula_registry.every(x=>x.official_credit_calculation===false),true);
const audit=researchP9PrefectureAudit(g);
eq(audit.national_pdf_claimed_prefecture_count,47);
eq(audit.regional_individual_pdf_indexed_count,15);
eq(audit.remaining_prefectures_without_prefecture_specific_pdf_index,32);
eq(audit.reported_prefecture_area_sum_ha,1359126);
eq(audit.national_pdf_area_ha,1359000);
eq(audit.reported_prefecture_harvest_sum_t,7344993);
eq(audit.national_pdf_harvest_t,7345000);
eq(audit.flagged_table_rows.map(x=>x.name),['徳島県','高知県']);
eq(audit.flagged_table_rows.map(x=>x.status),
 ['REVIEW_SOURCE_TABLE_OR_MULTI_CROP_AND_ROUNDING','REVIEW_SOURCE_TABLE_OR_MULTI_CROP_AND_ROUNDING']);
eq(audit.prefecture_checks.length,47);
eq(audit.all_prefectures_individually_pdf_reviewed,false);
eq(audit.aggregate_paddy_harvest_not_methane_credit,true);
eq(audit.official_factors_loaded,0);
eq(audit.field_emissions_tco2e,null);
eq(audit.verified_credits_tco2e,null);
const {report_sha256,...beforeHash}=audit;
eq(report_sha256,createHash('sha256').update(stableJson(beforeHash)).digest('hex'));
eq(researchP9PrefectureAudit(g),audit);
const p=historicalAg005Preview(fixture,g);
eq(p.status,'ILLUSTRATIVE_LEGACY_FORMULA_NOT_CERTIFIABLE');
eq(p.prefecture,'福島県');
eq(p.baseline_mean_drain_days,8.5);
eq(p.project_drain_days,16);
eq(p.increment_days,7.5);
eq(p.drainage_duration_7day_precheck,'CANDIDATE_ONLY_REQUIRE_RECORD_REVIEW');
eq(p.display_preview_difference_tco2e,2.24);
eq(p.display_preview_baseline_tco2e,7.466667);
eq(p.display_preview_project_tco2e,5.226667);
eq(p.user_supplied_ef_validated_from_official_inventory,false);
eq(p.current_method_applicability_verified,false);
eq(p.physical_field_area_verified,false);
eq(p.independent_measurement_qc_verified,false);
eq(p.official_credits_tco2e,null);
eq(p.issuance_performed,false);
eq(p.formal_approval_or_vvb_attestation,false);
eq(verifyP9Preview(fixture,p).status,'RESEARCH_ONLY_INPUT_AND_FORMULA_REPLAY_MATCH');
eq(historicalAg005Preview(fixture,g),p);
const shortened=structuredClone(fixture);shortened.project_midseason_drain_days=15;
eq(historicalAg005Preview(shortened).drainage_duration_7day_precheck,'FAIL_PRECHECK');
const multi=structuredClone(fixture);
multi.baseline_years=[{year:2021,crop_drain_days:[8,10]},{year:2022,crop_drain_days:[9]}];
eq(historicalAg005Preview(multi).baseline_mean_drain_days,9);
const zero=structuredClone(fixture);zero.strata[0].baseline_ef_kg_ch4_c_ha_year=0;
eq(historicalAg005Preview(zero).display_preview_baseline_tco2e,0);
denied(()=>verifyP9Preview(fixture,{...p,official_credits_tco2e:999}),'RECEIPT_REPLAY_MISMATCH');
denied(()=>historicalAg005Preview({...fixture,method_version:'AG005_V4_CURRENT_APPROVED'}),
 'METHOD_NOT_CURRENT_OR_UNKNOWN');
denied(()=>historicalAg005Preview({...fixture,prefecture_code:'99'}),'PREFECTURE_NOT_FOUND');
denied(()=>historicalAg005Preview({...fixture,unauthorized_issuance:true}),'PREVIEW_KEYS');
denied(()=>historicalAg005Preview({...fixture,baseline_years:[fixture.baseline_years[0]]}),
 'REQUIRED_PRIOR_TWO_YEARS_DOCUMENTATION');
denied(()=>historicalAg005Preview({...fixture,baseline_years:[
 fixture.baseline_years[0],fixture.baseline_years[0]]}),
 'REQUIRED_PRIOR_TWO_YEARS_DOCUMENTATION');
denied(()=>historicalAg005Preview({...fixture,strata:[{
 ...fixture.strata[0],area_ha:62701}]}),'AREA_EXCEEDS_2024_PREFECTURE_AGGREGATE');
denied(()=>historicalAg005Preview({...fixture,gwp_ch4:NaN}),
 'NUMBER_NOT_FINITE_OR_OUT_OF_RANGE');
denied(()=>historicalAg005Preview({...fixture,strata:[{
 ...fixture.strata[0],baseline_ef_kg_ch4_c_ha_year:-3}]}),
 'NUMBER_NOT_FINITE_OR_OUT_OF_RANGE');
denied(()=>historicalAg005Preview({...fixture,gwp_year_source:''}),
 'FACTOR_OR_GWP_PROVENANCE_REQUIRED');
denied(()=>historicalAg005Preview({...fixture,factor_source_and_version:''}),
 'FACTOR_OR_GWP_PROVENANCE_REQUIRED');
const wrongYear=structuredClone(g);wrongYear.prefectures[0].year=2025;
denied(()=>validateP9PrefectureRegister(wrongYear),'MIXED_YEAR_OR_FAKE_FIELD_DATA');
const fakeOfficial=structuredClone(g);fakeOfficial.officially_certified_tco2e=1;
denied(()=>validateP9PrefectureRegister(fakeOfficial),'RESEARCH_SCOPE');
const fakeSource=structuredClone(g);fakeSource.national_source.official_pdf_bytes_local_verified=true;
denied(()=>validateP9PrefectureRegister(fakeSource),'NATIONAL_SOURCE_SCOPE_OR_VINTAGE');
const fakeLocal=structuredClone(g);fakeLocal.regional_pdf_sources[0].raw_pdf_sha256='a'.repeat(64);
denied(()=>validateP9PrefectureRegister(fakeLocal),'REGIONAL_PDF_PROMOTED_TO_CERTIFIED');
const mix=structuredClone(g);mix.prefectures[46].jis_code='01';
denied(()=>validateP9PrefectureRegister(mix),'PREFECTURE_COVERAGE');
const changedSum=structuredClone(g);changedSum.prefectures[3].reported_harvest_brown_rice_t=1000;
denied(()=>validateP9PrefectureRegister(changedSum),'NATIONAL_TRANSCRIPTION_CHECKSUM');
const fakeFormula=structuredClone(g);fakeFormula.formula_registry[1].official_credit_calculation=true;
denied(()=>validateP9PrefectureRegister(fakeFormula),'UNSUPPORTED_FORMULA_POLICY');
const cli=(...args)=>spawnSync(process.execPath,['scripts/p9-prefecture-rice-source-guard.mjs',...args],
 {encoding:'utf8',timeout:15000,maxBuffer:600000});
const dir=mkdtempSync(join(tmpdir(),'naft-p9-'));
try{
 const input=join(dir,'input.json'),receipt=join(dir,'receipt.json');
 writeFileSync(input,JSON.stringify(fixture));
 const call=cli('preview',input);eq(call.status,0);eq(JSON.parse(call.stdout),p);
 writeFileSync(receipt,call.stdout);
 const verified=cli('verify',input,receipt);eq(verified.status,0);
 eq(JSON.parse(verified.stdout).receipt_sha256,p.receipt_sha256);
 const aud=cli('audit');eq(aud.status,0);eq(JSON.parse(aud.stdout),audit);
 const h=cli('prefecture','01');eq(h.status,0);
 eq(JSON.parse(h.stdout).statistics.name,'北海道');
 eq(JSON.parse(h.stdout).prefecture_local_pdf_sources.length,1);
 const unknown=cli('prefecture','48');eq(unknown.status!==0,true);
 writeFileSync(receipt,JSON.stringify({...p,official_credits_tco2e:100}));
 const invalid=cli('verify',input,receipt);eq(invalid.status!==0,true);
}finally{rmSync(dir,{force:true,recursive:true})}
console.log('NAFT_P9_47_PREFECTURE_PASS: '+n+
 ' checks; 47 MAFF rice rows, 15 local PDF leads, 2 identity anomaly flags, zero certified CO2e');
