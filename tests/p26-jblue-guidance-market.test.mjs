import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {replayJblueMethod1Research,P26_GUIDANCE_SHA}
  from '../scripts/p26-jblue-method1-research.mjs';

const clone=x=>JSON.parse(JSON.stringify(x));
const json=path=>JSON.parse(readFileSync(path,'utf8'));
const base=json('fixtures/p26-jblue-method1-synthetic.json');
const register=json('research/registry-source-intake-2026-11-08/jblue-guidance-market-evidence.json');
function deny(v,code){assert.throws(()=>replayJblueMethod1Research(v),
  new RegExp('P26_JBLUE_RESEARCH_BLOCKED:'+code));}

test('both attached PDFs are digested and registered, not redistributed',()=>{
  assert.equal(register.sources.length,2);
  assert.equal(register.sources[0].uploaded_sha256,P26_GUIDANCE_SHA);
  assert.equal(register.sources[0].uploaded_bytes,8321466);
  assert.equal(register.sources[0].pdf_pages,70);
  assert.equal(register.sources[0].version,'2.6');
  assert.equal(register.sources[1].uploaded_sha256,
    '8fe9ce2d68d560be63e1f9864e8ee72a2b3c62dfb61e561da434475bcf65257b');
  assert.equal(register.sources[1].pdf_pages,8);
  assert.equal(register.sources[1].doi,'10.1038/s44183-026-00213-1');
  assert.ok(register.sources.every(x=>x.full_pdf_committed===false));
  assert.equal(register.official_issuance_supported,false);
  assert.equal(register.carbon_token_issuance_supported,false);
});
test('guide scientific rules and method boundaries are source-pinned',()=>{
  const x=register.guidance_conditions;
  assert.equal(x.minimum_application_tco2,'0.1');
  assert.equal(x.lookback_years_max,'5');
  assert.equal(x.eligible_storage_years_min,'100');
  assert.equal(x.accounting_period,'ONE_YEAR_PER_APPLICATION_PERIOD');
  assert.equal(x.calculation_research_blueprint.formula_2_biomass_and_aquaculture,
    'NOT_IMPLEMENTED');
  assert.ok(x.checklist.some(c=>c.id==='CERTAINTY_HUMAN_DETERMINATION'&&
    c.review==='INDEPENDENT_JBE_COMMITTEE'));
  assert.ok(x.checklist.some(c=>c.id==='DOUBLE_COUNTING_REVIEW'));
  assert.ok(x.checklist.some(c=>c.id==='BASELINE_BEFORE_AFTER_CONTROL_IMPACT'));
});
test('Method 1 reproduces 10ha synthetic scenario and never certifies',()=>{
  const r=replayJblueMethod1Research(base);
  assert.equal(r.gross_tco2_before_subtractions,'15.12');
  assert.equal(r.illustrative_net_tco2,'13.77');
  assert.equal(r.numeric_minimum_0_1_tco2_satisfied,true);
  assert.equal(r.certified_tco2e,null);
  assert.equal(r.formal_certification,false);
  assert.equal(r.official_credit_issuance,false);
  assert.equal(r.registry_rights_verified,false);
  assert.equal(r.production_mint_authorized,false);
  assert.equal(r.transaction_submitted,false);
  assert.equal(r.rounding,'RESEARCH_ONLY_6_DECIMAL_HALF_UP_NOT_JBE_APPROVED');
  assert.equal(r.receipt_sha256,replayJblueMethod1Research(clone(base)).receipt_sha256);
});
test('credit minimum only a numeric threshold, never approval',()=>{
  const less=clone(base);
  less.area_ha='0.01';
  less.baseline_tco2='0';
  less.vessel_emissions_tco2='0';
  less.new_material_emissions_tco2='0';
  const r=replayJblueMethod1Research(less);
  assert.equal(r.numeric_minimum_0_1_tco2_satisfied,false);
  assert.equal(r.result_class,'BELOW_NUMERICAL_MINIMUM');
  assert.equal(r.certified_tco2e,null);
  assert.equal(r.production_mint_authorized,false);
});
test('negative results stay explicit and are not converted into credits',()=>{
  const v=clone(base);v.baseline_tco2='25';
  const r=replayJblueMethod1Research(v);
  assert.ok(r.illustrative_net_tco2.startsWith('-'));
  assert.equal(r.numeric_minimum_0_1_tco2_satisfied,false);
  assert.equal(r.official_credit_issuance,false);
});
test('unsupported Methods 2, 2-1, 2-2 blocked not silently mapped to Method 1',()=>{
  for(const method of ['JBLUE_METHOD_2_BIOMASS','JBLUE_2_1_AQUACULTURE',
    'JBLUE_2_2_ROPE']){const v=clone(base);v.method=method;deny(v,'OTHER_METHOD_NOT_IMPLEMENTED');}
});
test('fake guide version or unauthorized certification states blocked',()=>{
  const v=clone(base);v.source_guidance_sha256='f'.repeat(64);
  deny(v,'UNVERIFIED_GUIDANCE_VERSION');
  const w=clone(base);w.review_status='JBE_CERTIFIED';
  deny(w,'OFFICIAL_APPROVAL_ASSERTION_FORBIDDEN');
  const x=clone(base);x.official_credit_issuance=true;
  deny(x,'UNKNOWN_INPUT_FIELDS');
});
test('certainty must be explicit decimal string in [0,1]',()=>{
  for(const bad of ['1.000001','2','-0.1',0.8,'NaN','0.0000001','1e-3']){
    const v=clone(base);v.area_certainty=bad;
    deny(v,typeof bad==='string'&&/^(1\.000001|2)$/.test(bad)?
      'CERTAINTY_OUT_OF_RANGE':'EXACT_DECIMAL_REQUIRED');
  }
  const v=clone(base);v.rate_certainty='1.5';
  deny(v,'CERTAINTY_OUT_OF_RANGE');
});
test('annual period and calendar dates fail closed',()=>{
  const v=clone(base);v.period_end='2025-06-01';deny(v,'ANNUAL_PERIOD_REQUIRED');
  const w=clone(base);w.period_start='2025-02-30';deny(w,'INVALID_DATE');
  const x=clone(base);x.period_end='2027-01-01';deny(x,'ANNUAL_PERIOD_REQUIRED');
});
test('source evidence hash required but hash is not external authenticity',()=>{
  const v=clone(base);v.evidence_manifest_sha256='NOT_A_HASH';
  deny(v,'EVIDENCE_DIGEST_REQUIRED');
  const a=replayJblueMethod1Research(base);
  const b=clone(base);b.evidence_manifest_sha256='d'.repeat(64);
  assert.notEqual(a.receipt_sha256,replayJblueMethod1Research(b).receipt_sha256);
  assert.equal(a.area_and_absorption_factor_provenance,
    'REFERENCED_BUT_NOT_EXTERNALLY_AUTHENTICATED');
});
test('historical observational study figures are not live registry balances',()=>{
  const x=register.empirical_snapshot;
  assert.equal(x.project_count,61);
  assert.equal(x.project_count_for_selected_association_analysis,60);
  assert.equal(x.transactions,471);
  assert.equal(x.certification_period,'2021-2025');
  assert.equal(x.certified_project_tco2,'9185');
  assert.equal(x.total_offered_tco2,'3482');
  assert.equal(x.public_offering_purchased_tco2,'1081');
  assert.equal(x.transaction_value_jpy,'61805452');
  assert.ok(Number(x.public_offering_purchased_tco2)<=Number(x.total_offered_tco2));
  assert.ok(Number(x.total_offered_tco2)<=Number(x.certified_project_tco2));
  assert.equal(x.row_level_transaction_data_loaded,false);
  assert.equal(x.statistical_model_refitted,false);
  assert.equal(x.causal_claims_supported,false);
  assert.equal(register.live_market_price_feed,false);
});
test('different exchange rates inside uploaded paper retained, not silently reconciled',()=>{
  const p=register.empirical_snapshot.forex_warning;
  assert.equal(p.results_section_jpy_per_usd,'145.96');
  assert.equal(p.methods_section_jpy_per_usd,'147.15');
  assert.equal(p.discrepancy,'INTERNAL_PAPER_FX_DIFFERENCE_NOT_RECONCILED');
  assert.equal(p.cannot_use_as_live_fx_or_price_feed,true);
});
