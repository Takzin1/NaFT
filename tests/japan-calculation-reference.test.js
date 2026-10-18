'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx={Date,Math,Number,Error};vm.createContext(ctx);
vm.runInContext(fs.readFileSync('src/japan-calculation-reference.js','utf8'),ctx);
vm.runInContext(fs.readFileSync('src/cost-estimator.js','utf8'),ctx);
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,a+' != '+b);
function org(w,c){return ctx.japanRefOrganicEF({ef_none:100,ef_straw:200,ef_compost:150,straw_percent:w,compost_t_per_10a:c});}
near(org(0,0),100);near(org(45,0),150);near(org(0,.5),125);
near(org(89,0),100+100*89/90);near(org(90,0),200);
near(org(90,1),200);near(org(100,5),200);
assert.throws(()=>org(101,0),/INVALID_REFERENCE_INPUT/);
assert.equal(ctx.japanRefDrainage(7.499/1.22).reference_class,'POOR_DRAINAGE');
assert.equal(ctx.japanRefDrainage(7.5/1.22).reference_class,'DAILY_DRAINAGE');
assert.equal(ctx.japanRefDrainage(12.5/1.22).reference_class,'FOUR_HOUR_DRAINAGE');
const mids=ctx.japanRefMidseason({prior_crop_days:[10,11],start:'2026-07-01',end:'2026-07-18',heading:'2026-07-31'});
assert.equal(mids.baseline_days,11);assert.equal(mids.project_days,18);
assert.equal(mids.meets_seven_day_arithmetic,true);
assert.equal(ctx.japanRefMidseason({prior_crop_days:[10,11],start:'2026-07-01',end:'2026-07-19',heading:'2026-07-15'}).project_days,14);
assert.throws(()=>ctx.japanRefMidseason({prior_crop_days:[10],start:'2026-07-01',end:'2026-07-18',heading:'2026-07-31'}),/EVIDENCE_REQUIRED/);
assert.throws(()=>ctx.japanRefMidseason({prior_crop_days:[10,10],start:'2026-02-30',end:'2026-03-01',heading:'2026-03-15'}),/INVALID_REFERENCE_INPUT/);
const ag=ctx.japanRefAG005({method_version:'3.3-reference',data_kind:'SYNTHETIC',
 area_ha:2,gwp_ch4:30,ef_none:100,ef_straw:100,ef_compost:100,straw_percent:0,compost_t_per_10a:0});
near(ag.preview_tco2e,2.4);
assert.equal(ag.certified_tco2e,null);assert.equal(ag.jcredit_eligibility,null);
assert.throws(()=>ctx.japanRefAG005({method_version:'3.5',data_kind:'SYNTHETIC',area_ha:2}),/UNSUPPORTED/);
const gx=ctx.japanRefGXETSFuel({source_type:'FUEL_COMBUSTION',fuel_unit:'kL',
 heat_unit:'GJ/kL',carbon_factor_unit:'tC/GJ',fuel_quantity:10,heat_value:35,carbon_factor:0.02});
near(gx.preview_tco2,10*35*.02*44/12);
assert.equal(gx.reported_direct_tco2,null);
assert.throws(()=>ctx.japanRefGXETSFuel({source_type:'PURCHASED_ELECTRICITY',fuel_unit:'kL',heat_unit:'GJ/kL',carbon_factor_unit:'tC/GJ',fuel_quantity:10,heat_value:35,carbon_factor:0.02}),/UNSUPPORTED/);
const cost=ctx.estimateReverificationCost({total_plots:100,flagged_plots:30,
 hours_per_plot:2,hourly_rate_jpy:3000,fixed_overhead_jpy:0,jpy_per_usd:150});
assert.equal(cost.full.cost_jpy,600000);assert.equal(cost.selective.cost_jpy,180000);
assert.equal(cost.difference.cost_jpy,420000);
assert.equal(cost.illustrative,true);assert.equal(cost.difference.plots_not_reverified,70);
assert.throws(()=>ctx.estimateReverificationCost({total_plots:1,flagged_plots:2,hours_per_plot:1,hourly_rate_jpy:1,jpy_per_usd:1}),/INVALID_COST_INPUT/);
const html=fs.readFileSync('gikuten.html','utf8');
for(const s of ['src/japan-calculation-reference.js','src/cost-estimator.js','src/gikuten-calculation-lab.js','japan-calculation-lab'])assert.ok(html.includes(s),s);
const costDefault=JSON.parse(fs.readFileSync('config/cost-estimator.defaults.json','utf8'));
assert.match(costDefault._comment,/ASSUMPTIONS ONLY/);
console.log('JA_AG005_GXETS_COST_REFERENCE_PASS: 27 safeguards / calculations');
