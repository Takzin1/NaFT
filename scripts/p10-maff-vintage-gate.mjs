#!/usr/bin/env node
/** P10: published MAFF rice vintage guard; one number does not mean one methodology. */
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {stableJson} from './lib/research-readiness-report.mjs';
const ROOT=fileURLToPath(new URL('../research/p10-maff-rice-release-vintages-2026-11-03.json',import.meta.url));
const failure=(m)=>{throw new Error('NAFT_P10_VINTAGE_BLOCKED:'+m);};
const ok=(a,m)=>{if(!a)failure(m);};
export function loadP10Vintages(){return JSON.parse(readFileSync(ROOT,'utf8'));}
export function checkP10Vintages(g=loadP10Vintages()){
 ok(g?.schema==='naft-p10-japan-rice-time-version-source-ledger-v1'
    &&g.snapshot_date==='2026-11-03'
    &&g.scope==='OFFICIAL_PUBLICATION_PROVENANCE_WITH_EXPLICIT_NONCOMPARABLE_MEASURES'
    &&g.raw_pdf_sha256_verified===0&&g.raw_e_stat_excel_rows_loaded===0
    &&g.regional_forecasts_are_not_prefecture_observations===true
    &&g.ag005_or_verra_factor_loaded===false&&g.officially_certified_tco2e===null,'RESEARCH_SCOPE');
 ok(Array.isArray(g.sources)&&g.sources.length===3&&new Set(g.sources.map(x=>x.id)).size===3,'SOURCE_COUNT');
 const [base,final,forecast]=g.sources;
 ok(base.id==='MAFF_RICE_2024_ALL_HARVEST_P9'&&base.season===2024&&base.status==='FINAL_HISTORICAL_STATISTICS_REPRINT'
   &&base.scope==='ALL_PADDY_RICE'&&base.harvest_t===7345000&&base.area_ha===1359000
   &&base.screen_basis==='OFFICIAL_VOLUME_METHODOLOGY_2024','2024_SOURCE');
 ok(final.id==='MAFF_RICE_2025_MAIN_FOOD_FINAL'&&final.season===2025&&final.status==='FINAL'
   &&final.publication_date==='2026-03-06'
   &&final.scope==='MAIN_FOOD_RICE'&&final.screen_basis==='PRODUCER_SIEVE'
   &&final.harvest_t===7181000&&final.area_ha===1367000,'2025_OFFICIAL_FINAL');
 ok(forecast.id==='MAFF_RICE_2026_MAIN_FOOD_SEP25_FORECAST'
   &&forecast.season===2026&&forecast.status==='FORECAST_NOT_FINAL'
   &&forecast.reference_date==='2026-09-25'&&forecast.publication_date==='2026-10-13'
   &&forecast.scope==='MAIN_FOOD_RICE'&&forecast.screen_basis==='PRODUCER_SIEVE'
   &&forecast.area_ha===1360000&&forecast.harvest_t===7105000
   &&forecast.yield_kg_per_10a===524,'2026_FORECAST_NOT_FINAL');
 for(const s of g.sources){
   ok(typeof s.source_url==='string'&&s.source_url.startsWith('https://www.')
     &&s.pdf_bytes_independently_attested===false
     &&s.grain_basis==='BROWN_RICE'&&s.harvest_t>0,'UNVERIFIED_SOURCE_OR_GRAIN');
 }
 ok(Array.isArray(g.regional_forecast_2026)&&g.regional_forecast_2026.length===2
   &&new Set(g.regional_forecast_2026.map(x=>x.region)).size===2,'REGION_COUNT');
 for(const x of g.regional_forecast_2026){
  ok(x.season===2026&&x.status==='FORECAST_NOT_FINAL'
    &&x.publication_date==='2026-10-13'&&x.reference_date==='2026-09-25'
    &&x.screen_basis==='PRODUCER_SIEVE'&&x.scope==='MAIN_FOOD_RICE'
    &&x.harvest_t<forecast.harvest_t&&x.area_ha<forecast.area_ha
    &&x.source_url.startsWith('https://www.maff.go.jp/'),'REGION_WRONG_SCOPE');
 }
 ok(g.regional_forecast_2026[0].area_ha===274700&&g.regional_forecast_2026[0].harvest_t===1443000
   &&g.regional_forecast_2026[0].yield_kg_per_10a===525,'KANTO_2026_SOURCE');
 ok(g.regional_forecast_2026[1].area_ha===153900&&g.regional_forecast_2026[1].harvest_t===747900
   &&g.regional_forecast_2026[1].yield_kg_per_10a===486,'KYUSHU_2026_SOURCE');
 ok(Array.isArray(g.secondary_official_indexes)&&g.secondary_official_indexes.length===2
   &&g.secondary_official_indexes.every(x=>x.url.startsWith('https://www.')&&typeof x.kind==='string'), 'OFFICIAL_INDEX');
 return true;
}
export function compareP10Vintages(aId,bId,g=loadP10Vintages()){
 checkP10Vintages(g);
 const a=g.sources.find(x=>x.id===aId),b=g.sources.find(x=>x.id===bId);
 ok(a&&b&&a.id!==b.id,'DISTINCT_KNOWN_VINTAGES');
 const unsigned={schema:'naft-p10-research-vintage-contrast-v1',
  ids:[a.id,b.id],seasons:[a.season,b.season],units:['tonne_of_brown_rice','tonne_of_brown_rice'],
  legal_emission_credits_tco2e:null,
  field_ch4_flux_verified:false,
  exact_published_source_status:[a.status,b.status],
  source_uris:[a.source_url,b.source_url],
  source_registry_sha256:createHash('sha256').update(stableJson(g)).digest('hex')
 };
 if(a.scope!==b.scope||a.screen_basis!==b.screen_basis||a.grain_basis!==b.grain_basis){
  return {...unsigned,conclusion:'BLOCKED_DIFFERENT_CROP_SCOPE_OR_SIEVE',difference_t:null,
    published_harvest_t:[a.harvest_t,b.harvest_t]};
 }
 if(a.status==='FORECAST_NOT_FINAL'||b.status==='FORECAST_NOT_FINAL'){
  return {...unsigned,conclusion:'NON_FINAL_ILLUSTRATIVE_PUBLISHED_DIFFERENCE_ONLY',
   difference_t:b.harvest_t-a.harvest_t,published_harvest_t:[a.harvest_t,b.harvest_t]};
 }
 return {...unsigned,conclusion:'SAME_SCOPE_HISTORICAL_STATISTICAL_COMPARISON_NOT_CH4',
  difference_t:b.harvest_t-a.harvest_t,published_harvest_t:[a.harvest_t,b.harvest_t]};
}
function main(args){
 if(args[0]==='inspect'&&args.length===1){const g=loadP10Vintages();checkP10Vintages(g);console.log(JSON.stringify(g,null,2));return;}
 if(args[0]==='compare'&&args.length===3){console.log(JSON.stringify(compareP10Vintages(args[1],args[2]),null,2));return;}
 failure('USAGE_inspect_OR_compare_ID_ID');
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 try{main(process.argv.slice(2));}catch(e){console.error(e.message);process.exitCode=1;}
}
