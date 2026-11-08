#!/usr/bin/env node
/**
 * P26 J-Blue Guidance v2.6: research-only Method 1 arithmetic replay.
 * Never determines official certainty or credit eligibility, never authenticates
 * JBE review, a registry, custody, carbon credit or any Web3 token.
 * Only the area × per-area absorption method is covered. Other methods in the
 * 70-page handbook (biomass/rope/aquaculture/CO2 gas exchange) are excluded.
 */
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

export const P26_GUIDANCE_SHA='f9fb2c2ae8d06325550e488d301b78195f8886ff4aabf1bbfdb11bd1ecfa0d05';
const SCALE=1000000n;
const HEX=/^[a-f0-9]{64}$/;
const DEC=/^(?:0|[1-9][0-9]{0,9})(?:\.[0-9]{1,6})?$/;
const FIELDS=['schema','source_guidance_sha256','method','period_start','period_end',
  'area_ha','area_certainty','absorption_rate_tco2_per_ha','rate_certainty',
  'baseline_tco2','vessel_emissions_tco2','new_material_emissions_tco2',
  'evidence_manifest_sha256','review_status'];
const reject=(reason)=>{throw Error('P26_JBLUE_RESEARCH_BLOCKED:'+reason);};
const check=(ok,msg)=>{if(!ok)reject(msg);};
function dec(value){
  check(typeof value==='string'&&DEC.test(value),'EXACT_DECIMAL_REQUIRED');
  const [a,b='']=value.split('.');
  return BigInt(a)*SCALE+BigInt((b+'000000').slice(0,6));
}
function fmt(value){
  const sign=value<0n?'-':'',v=value<0n?-value:value;
  return sign+(v/SCALE).toString()+'.'+(v%SCALE).toString().padStart(6,'0').replace(/0+$/,'').padEnd(1,'0');
}
function roundHalfUp(n,d){return(n+d/2n)/d;}
function date(s){
  check(typeof s==='string'&&/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(s),
    'INVALID_DATE');
  const [y,m,d]=s.split('-').map(Number);
  const ms=Date.UTC(y,m-1,d),t=new Date(ms);
  check(y>=2000&&y<=2100&&t.getUTCFullYear()===y&&
    t.getUTCMonth()+1===m&&t.getUTCDate()===d,'INVALID_DATE');
  return ms;
}
const sort=(x)=>Array.isArray(x)?x.map(sort):x&&typeof x==='object'?
  Object.fromEntries(Object.keys(x).sort().map(k=>[k,sort(x[k])])):x;
function digest(x){return createHash('sha256').update(JSON.stringify(sort(x))).digest('hex');}

export function replayJblueMethod1Research(input){
  check(input&&typeof input==='object'&&!Array.isArray(input) &&
    Object.keys(input).every(k=>FIELDS.includes(k)),'UNKNOWN_INPUT_FIELDS');
  check(input.schema==='naft-p26-jblue-method1-research-input/1',
    'SCHEMA');
  check(input.source_guidance_sha256===P26_GUIDANCE_SHA,
    'UNVERIFIED_GUIDANCE_VERSION');
  check(input.method==='JBLUE_METHOD_1_AREA_RATE_ONLY',
    'OTHER_METHOD_NOT_IMPLEMENTED');
  check(input.review_status==='RESEARCH_NOT_REVIEWED_BY_JBE',
    'OFFICIAL_APPROVAL_ASSERTION_FORBIDDEN');
  check(HEX.test(input.evidence_manifest_sha256||''),'EVIDENCE_DIGEST_REQUIRED');
  const start=date(input.period_start),end=date(input.period_end);
  const days=(end-start)/86400000;
  check(days===365||days===366,'ANNUAL_PERIOD_REQUIRED');
  check(Number(input.period_end.slice(0,4))===Number(input.period_start.slice(0,4))+1,
    'ANNUAL_YEAR_REQUIRED');
  const area=dec(input.area_ha),ac=dec(input.area_certainty),
    rate=dec(input.absorption_rate_tco2_per_ha),rc=dec(input.rate_certainty),
    baseline=dec(input.baseline_tco2),vessel=dec(input.vessel_emissions_tco2),
    materials=dec(input.new_material_emissions_tco2);
  check(ac<=SCALE&&rc<=SCALE,'CERTAINTY_OUT_OF_RANGE');
  const gross=roundHalfUp(area*ac*rate*rc,SCALE*SCALE*SCALE);
  const net=gross-baseline-vessel-materials;
  const body={
    schema:'naft-p26-jblue-method1-research-receipt/1',
    source_guidance_sha256:P26_GUIDANCE_SHA,
    source_pdf_printed_pages:[4,7,17,38,46,48,50,51],
    method:'JBLUE_METHOD_1_AREA_RATE_ONLY',
    input_sha256:digest(input),evidence_manifest_sha256:input.evidence_manifest_sha256,
    period_start:input.period_start,period_end:input.period_end,
    gross_tco2_before_subtractions:fmt(gross),
    baseline_tco2:fmt(baseline),vessel_emissions_tco2:fmt(vessel),
    new_material_emissions_tco2:fmt(materials),
    illustrative_net_tco2:fmt(net),
    numeric_minimum_0_1_tco2_satisfied:net>=100000n,
    result_class:net>=100000n?'NUMERICAL_MINIMUM_ONLY_NO_CERTIFICATION':'BELOW_NUMERICAL_MINIMUM',
    certainty_factor_source:'USER_SUPPLIED_RESEARCH_HYPOTHESIS_NOT_JBE_REVIEW',
    rounding:'RESEARCH_ONLY_6_DECIMAL_HALF_UP_NOT_JBE_APPROVED',
    area_and_absorption_factor_provenance:'REFERENCED_BUT_NOT_EXTERNALLY_AUTHENTICATED',
    baseline_additionality_double_claim_review:'NOT_PERFORMED',
    formal_certification:false,certified_tco2e:null,
    official_credit_issuance:false,registry_rights_verified:false,
    market_price_quote:null,production_mint_authorized:false,transaction_submitted:false,
    limits:['METHOD_1_ONLY','NO_AUTOMATIC_JBE_CERTAINTY_OR_APPROVAL',
      'NO_LEGAL_CARBON_CREDIT_OR_TOKEN_RIGHTS','NO_BIOMASS_OR_AQUACULTURE_METHOD']
  };
  return {...body,receipt_sha256:digest(body)};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  try{
    check(process.argv.length===3,'USAGE_JSON_PATH_REQUIRED');
    const buf=readFileSync(process.argv[2]);
    check(buf.length<=32768,'INPUT_TOO_LARGE');
    const value=replayJblueMethod1Research(JSON.parse(buf.toString('utf8')));
    process.stdout.write(JSON.stringify(value,null,2)+'\n');
  }catch(err){
    const m=String(err?.message||'');
    console.error(/^P26_JBLUE_RESEARCH_BLOCKED:[A-Z_0-9]+$/.test(m)?m:
      'P26_JBLUE_RESEARCH_BLOCKED:INVALID_INPUT');
    process.exitCode=1;
  }
}
