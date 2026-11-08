import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {prescreenBdasGreenLaser,prescreenMidseasonEvidence,MLIT_SHA,MAFF_RICE_SHA}
  from '../scripts/p26-official-mrv-prescreen.mjs';
const load=path=>JSON.parse(readFileSync(path,'utf8'));
const copy=x=>JSON.parse(JSON.stringify(x));
const bdas=load('fixtures/p26-bdas-green-laser-synthetic.json');
const rice=load('fixtures/p26-maff-midseason-synthetic.json');
const src=load('research/registry-source-intake-2026-11-08/official-mrv-pdfs-2026.json');
const agg=load('data/registry-source-intake-2026-11-08/official-2026-government-context.json');
function deny(fn,code){assert.throws(fn,new RegExp('P26_OFFICIAL_PRESCREEN_BLOCKED:'+code));}

test('all four government PDFs have exact byte SHA, issuance and rights boundaries',()=>{
  assert.equal(src.documents.length,4);
  assert.deepEqual(src.documents.map(x=>x.pages),[35,2,72,2]);
  assert.deepEqual(src.documents.map(x=>x.bytes),[2735787,773433,2249767,611162]);
  assert.deepEqual(src.documents.map(x=>x.sha256),[
    MLIT_SHA,
    '4fa0408fcd5b574c6669c5db91ae22cc26406c699838bb4aa2ffd4f6d7b9b8a4',
    '097ed2284acabea6a65806c0a5584275ff9fb50d0687a961a645ec6a73b175f3',
    MAFF_RICE_SHA]);
  assert.equal(src.raw_pdf_files_committed,false);
  assert.equal(src.production_mint_authorized,false);
  assert.equal(src.formal_certification,false);
  assert.equal(src.legal_credit_rights_verified,false);
});
test('BDAS 4-column synthetic mesh passes CSV shape prescreen but never submits',()=>{
  const x=prescreenBdasGreenLaser(bdas);
  assert.equal(x.cells_checked,2);
  assert.equal(x.classification,'CSV_SHAPE_ONLY_NOT_BDAS_ACCEPTANCE');
  assert.equal(x.no_real_bdas_submission,true);
  assert.equal(x.grid_coverage_quality,'NOT_VERIFIED');
  assert.equal(x.official_issued_credit_quantity,null);
  assert.equal(x.production_mint_authorized,false);
  assert.equal(x.certified_tco2e,null);
  assert.deepEqual(x,prescreenBdasGreenLaser(copy(bdas)));
});
test('BDAS wrong columns, precision, height, intensity are rejected',()=>{
  for(const [line,reason] of [
    ['1.00,2.00,3.00','CSV_FOUR_COLUMNS'],
    ['1.0,2.00,3.00,7','CSV_TWO_DECIMAL_METRIC'],
    ['1.00,2.00,-3.00,7','NEGATIVE_VEGETATION_HEIGHT'],
    ['1.00,2.00,3.00,-5','INVALID_INTENSITY'],
    ['1.00;2.00;3.00;7','CSV_FORMAT']]){
    const v=copy(bdas);v.csv=line;
    deny(()=>prescreenBdasGreenLaser(v),reason);
  }
});
test('BDAS no metadata and unsupported sonar/satellite cannot be treated as green laser',()=>{
  const a=copy(bdas);a.metadata.observation_date='2026-02-30';
  deny(()=>prescreenBdasGreenLaser(a),'INVALID_DATE');
  const b=copy(bdas);b.metadata.sensor_type='SONAR';
  deny(()=>prescreenBdasGreenLaser(b),'GREEN_LASER_ONLY');
  const c=copy(bdas);c.metadata.coordinate_reference='';
  deny(()=>prescreenBdasGreenLaser(c),'COORDINATE_REFERENCE_REQUIRED');
  const d=copy(bdas);d.manual_sha256='f'.repeat(64);
  deny(()=>prescreenBdasGreenLaser(d),'MANUAL_VERSION_MISMATCH');
});
test('midseason two-year baseline and 7-day conservative screen never create credit',()=>{
  const r=prescreenMidseasonEvidence(rice);
  assert.equal(r.baseline_years,2);
  assert.equal(r.longest_documented_baseline_days,9);
  assert.equal(r.reported_activity_days,16);
  assert.equal(r.conservative_extension_days,7);
  assert.equal(r.seven_day_conservative_screen_met,true);
  assert.equal(r.prescreen_status,'DOCUMENTARY_CONSERVATIVE_SCREEN_ONLY');
  assert.equal(r.official_methodology_version_checked,false);
  assert.equal(r.production_mint_authorized,false);
  assert.equal(r.certified_tco2e,null);
});
test('insufficient baseline history is rejected; baseline years cannot repeat',()=>{
  const a=copy(rice);a.baseline_history=a.baseline_history.slice(0,1);
  deny(()=>prescreenMidseasonEvidence(a),'TWO_BASELINE_YEARS_REQUIRED');
  const b=copy(rice);b.baseline_history[1].year=2023;
  deny(()=>prescreenMidseasonEvidence(b),'INVALID_BASELINE_YEAR');
});
test('under-seven-day case is not treated as a passing evidence screen',()=>{
  const v=copy(rice);v.reported_drying_days=15;v.drying_end='2025-06-16';
  const x=prescreenMidseasonEvidence(v);
  assert.equal(x.conservative_extension_days,6);
  assert.equal(x.seven_day_conservative_screen_met,false);
  assert.equal(x.prescreen_status,'LESS_THAN_CONSERVATIVE_7_DAY_SCREEN');
});
test('overdry risk or emergency irrigation prioritizes crop safety, not credit',()=>{
  const a=copy(rice);a.crop_safety_risk=true;
  let r=prescreenMidseasonEvidence(a);
  assert.equal(r.prescreen_status,'STOP_AND_REVIEW_CROP_SAFETY_NO_CREDIT');
  assert.equal(r.seven_day_conservative_screen_met,false);
  assert.equal(r.crop_safety_has_priority,true);
  const b=copy(rice);b.supplemental_irrigation_during_extension=true;
  r=prescreenMidseasonEvidence(b);
  assert.equal(r.prescreen_status,'STOP_AND_REVIEW_CROP_SAFETY_NO_CREDIT');
  assert.equal(r.official_issued_credit_quantity,null);
});
test('missing field provenance, unsafe dates, fake certification claims blocked',()=>{
  const a=copy(rice);a.activity_records_sha256='X';
  deny(()=>prescreenMidseasonEvidence(a),'EVIDENCE_HASH_REQUIRED');
  const b=copy(rice);b.drying_start='2025-02-30';
  deny(()=>prescreenMidseasonEvidence(b),'INVALID_DATE');
  const c=copy(rice);c.formal_certification=true;
  deny(()=>prescreenMidseasonEvidence(c),'UNEXPECTED_FIELDS');
  const d=copy(rice);d.pamphlet_sha256='0'.repeat(64);
  deny(()=>prescreenMidseasonEvidence(d),'PAMPHLET_VERSION_MISMATCH');
  const e=copy(rice);e.reported_drying_days=19;
  deny(()=>prescreenMidseasonEvidence(e),'DATE_DURATION_INCONSISTENT');
});
test('inventory and heat adaptation facts are historical contextual data',()=>{
  assert.equal(agg.national_inventory.rice_ch4_2024_kt_co2eq,'11841');
  assert.equal(agg.national_inventory.total_agriculture_2024_kt_co2eq,'30278');
  assert.equal(agg.national_inventory.inventory_reduction_model_illustration_percent,'30');
  assert.equal(agg.national_inventory.scope_guard,
    'NATIONAL_INVENTORY_NOT_JCREDIT_AG005_NOT_APPROVED_FIELD_COEFFICIENTS');
  assert.equal(agg.heat_adaptation.prefectures_with_introduced_varieties_2025,44);
  assert.equal(agg.heat_adaptation.national_heat_tolerant_paddy_share_2025_percent,'18.2');
  assert.equal(agg.heat_adaptation.heat_tolerant_rice_cultivar_2025_ha,'249000');
  assert.equal(agg.heat_adaptation.selected_prefecture_samples.length,5);
  assert.equal(agg.heat_adaptation.no_direct_ghg_reduction_factor,true);
  assert.equal(agg.pamphlet.price_role,'HYPOTHETICAL_FOR_BROCHURE_EXAMPLE_NOT_CURRENT_MARKET');
  assert.equal(agg.live_jcredit_registry_access,false);
  assert.equal(agg.production_mint_authorized,false);
});
test('manual is green-laser-specific and references separate J-Blue guidance v2.5',()=>{
  const m=src.documents[0],inventory=src.documents[2];
  assert.equal(m.content_scope,'GREEN_LASER_ONLY');
  assert.ok(m.extracts.some(x=>x.section==='4.1-4.2'&&x.page===25));
  assert.ok(m.extracts.some(x=>x.page===26&&x.fact.includes('Ver.2.5')));
  assert.ok(inventory.extracts.some(x=>x.page===37&&x.name==='midseason_extension_reduction_national_assumption'));
  assert.ok(src.cross_document_rules.some(x=>x.includes('Ver.2.6')));
});
