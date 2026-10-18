#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const data=JSON.parse(fs.readFileSync(path.join(root,'research/japan-field-replay-2026-10-18/published-aggregates.json'),'utf8'));
const ctx={Math,Number,Set,Error};vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root,'src/japan-field-replay.js'),'utf8'),ctx);
const context={site_id:'SYNTHETIC-SITE',calendar_year:'2026',crop_season:'one',measurement_start:'2026-05-01',measurement_end:'2026-09-30',soil_class:'SYNTHETIC-SOIL',irrigation:'SYNTHETIC-FLOODING',organic_amendment:'NONE',fertilizer:'NONE',measurement_protocol:'SYNTHETIC-MANUAL',gas:'CH4',mass_basis:'kg_CH4',climate_observation_ref:'SYNTHETIC-WEATHER-REF',plot_lineage:'SYNTHETIC-PLOT'};
const accounting=ctx.japanFieldAllocateAreaRate({data_status:'SYNTHETIC',observed:{area_ha:2,rate_kg_ch4_ha:100,context},predicted:{area_ha:1,rate_kg_ch4_ha:90,context:{...context}}});
const blocked=ctx.japanFieldAllocateAreaRate({data_status:'SYNTHETIC',observed:{area_ha:2,rate_kg_ch4_ha:100,context},predicted:{area_ha:1,rate_kg_ch4_ha:90,context:{...context,soil_class:'DIFFERENT'}}});
console.log(JSON.stringify({scope:'TRANSCRIBED_PUBLISHED_AGGREGATES_AND_SYNTHETIC_ACCOUNTING_ONLY',
 yagi:ctx.japanFieldReplayYagi(data),nishimura:ctx.japanFieldReplayNishimura(data),
 synthetic_shapley:accounting,environment_mismatch_control:blocked},null,2));
