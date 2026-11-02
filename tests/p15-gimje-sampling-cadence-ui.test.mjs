import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const f=p=>readFileSync(p,'utf8');
const data=JSON.parse(f('research/p15-gimje-sampling-cadence-2026-11-03.json'));
const orig=JSON.parse(f('research/p14-gimje-real-original-source-audit-2026-11-03.json'));
assert.equal(data.zip_sha256,orig.source_files.ch4_zip.sha256);
assert.equal(data.xlsx_sha256,orig.source_files.input_fields_meta_xlsx.sha256);
assert.equal(data.daily_grid_rows,orig.observations.native_day_rows);
assert.equal(data.observed_flux_rows,orig.observations.valid_reported_flux);
assert.equal(data.unmeasured_daily_grid_rows,orig.observations.missing_flux);
assert.equal(data.negative_flux_values,orig.observations.negative_flux);
assert.deepEqual(data.daily_water_stage_counts,orig.observations.source_daily_course_type_counts);
assert.equal(data.gaps_at_least_14_days,27);
assert.equal(data.maximum_sampling_gap_days,16);
assert.equal(data.sampling_gap_days_histogram['16'],27);
assert.equal(data.field_count,60);
assert.equal(data.unmeasured_grid_is_not_diagnosed_instrument_failure,true);
assert.equal(data.publisher_independent_measurement_qc_verified,false);
assert.equal(data.missing_flux_imputed,0);
assert.equal(data.negative_flux_removed,0);
assert.equal(data.official_emissions_reductions_tco2e,null);
assert.equal(data.issued_carbon_credits,null);
assert.ok(!JSON.stringify(data).includes('GJ2022010111'));
const ctx={};vm.createContext(ctx);
for(const name of ['src/gimje-sampling-qc-view.js','src/gimje-real-source-view.js',
                   'src/gx-2025-prefecture.js','src/gx-data-explorer.js']){
 vm.runInContext(f(name),ctx,{timeout:5000,filename:name});
}
const view=JSON.parse(JSON.stringify(ctx.GX_GIMJE_SAMPLING_P15));
assert.equal(view.grid,data.daily_grid_rows);
assert.equal(view.observed,data.observed_flux_rows);
assert.equal(view.unmeasured,data.unmeasured_daily_grid_rows);
assert.equal(view.negative,data.negative_flux_values);
assert.equal(view.fields,data.field_count);
assert.equal(view.longGaps,data.gaps_at_least_14_days);
assert.equal(view.maxGap,data.maximum_sampling_gap_days);
for(let i=0;i<3;i++){
 assert.equal(view.annual[i].year,data.by_year[i].year);
 assert.equal(view.annual[i].measured,data.by_year[i].observed_flux_rows);
 assert.equal(view.annual[i].grid,data.by_year[i].daily_grid_rows);
 assert.deepEqual(view.annual[i].samples,
    Object.entries(data.by_year[i].sample_counts_per_field));
}
for(const stage of view.stage){
 assert.equal(stage[1],data.observed_water_stage_counts[stage[0]]);
 assert.equal(stage[2],data.daily_water_stage_counts[stage[0]]);
}
assert.deepEqual(view.gapDays.map(v=>v[0]).sort((a,b)=>a-b),
 Object.keys(data.sampling_gap_days_histogram).map(Number).sort((a,b)=>a-b));
const panel=ctx.gxGimjeSamplingQCPanel();
for(const string of ['6,969','1,422','2024','32測定日','22測定日','16','27',
                      'ゼロ補完','間欠','実験計画','tCO₂e'])assert.ok(panel.includes(string),string);
assert.ok(!panel.includes('削減済み認証量'));
const page=ctx.pgGxDataExplorer();
assert.ok(page.includes('非測定日と測定上の欠損を混同しない'));
assert.ok(page.includes('韓国Gimje水田CH₄'));
const html=f('naft-app.html');
assert.ok(html.includes('src/gimje-sampling-qc-view.js'));
assert.ok(html.indexOf('src/gimje-sampling-qc-view.js')<html.indexOf('src/gimje-real-source-view.js'));
assert.ok(html.indexOf('src/gimje-real-source-view.js')<html.indexOf('src/gx-data-explorer.js'));
console.log('P15_GIMJE_SAMPLING_QC_UI_PASS: 60 fields; 1422 observed flux samples; 6969 unmeasured grid days; 27 long intervals; no credits');
