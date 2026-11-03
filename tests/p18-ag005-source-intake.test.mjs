import assert from 'node:assert/strict';
import {loadP18Register,checkP18Register,precheckP18Evidence,verifyP18LocalSource} from '../scripts/p18-ag005-source-intake.mjs';
const r=loadP18Register();assert.equal(checkP18Register(r),true);
const good={schema:'naft-p18-research-precheck-input-v1',crop_year:2026,
 baseline_rice_years:[{year:2024,days:7},{year:2025,days:9}],project_drain_days:16,
 drain_start:'2026-06-01',drain_end:'2026-06-17',heading_date:'2026-08-01',
 uninterrupted_inlet_closed_outlet_open:true,management_records_verified:true,
 start_end_evidence_verified:true,rice_area_proof_reference:'record:example-only',
 area_evidence_lot_id:'県市区画・証拠番号',straw_and_compost_records_verified:true,
 emaff_lot_id:'県市地番100',field_ecology_food_safety_reviewed:true};
const p=precheckP18Evidence(good);assert.equal(p.status,'RESEARCH_PRECHECK_COMPLETE_HUMAN_REVIEW_STILL_REQUIRED');assert.equal(p.baseline_days_mean,8);assert.equal(p.project_extension_days,8);assert.equal(p.certified_tco2e,null);assert.equal(p.issuer_approval,false);
const broken=(patch)=>precheckP18Evidence({...good,...patch});
assert(broken({project_drain_days:14}).findings.some(x=>x.claim_id==='OVERVIEW_SEVEN_DAY'));
assert(broken({uninterrupted_inlet_closed_outlet_open:false}).findings.some(x=>x.claim_id==='OVERVIEW_CONTINUITY'));
assert(broken({baseline_rice_years:[{year:2025,days:5}]}).findings.some(x=>x.claim_id==='OVERVIEW_BASELINE'));
assert(broken({drain_end:'2026-08-04'}).findings.some(x=>x.claim_id==='OVERVIEW_BEFORE_HEADING'));
assert(broken({emaff_lot_id:''}).findings.some(x=>x.claim_id==='GUIDE_2025_PARCEL'));
assert(!broken({emaff_lot_id:'',emaff_absence_screenshot_verified:true,fallback_lot_document:'FARM_PLAN_OR_RICE_INSURANCE'}).findings.some(x=>x.claim_id==='GUIDE_2025_PARCEL'));
assert(!broken({crop_year:2024,baseline_rice_years:[{year:2022,days:7},{year:2023,days:9}],emaff_lot_id:''}).findings.some(x=>x.claim_id==='GUIDE_2025_PARCEL'));
for(const id of ['MAFF_AG005_OVERVIEW_2026_07','MAFF_AG005_ACTIVITY_GUIDE_2025_12'])assert(r.documents.some(x=>x.id===id));
for(const key of ['publisher_byte_authentication_verified','current_methodology_adoption_verified','licensed_for_redistribution'])assert.throws(()=>checkP18Register({...r,[key]:true}),/NAFT_P18_GUIDANCE_BLOCKED/);
assert.throws(()=>checkP18Register({...r,documents:r.documents.map((x,i)=>i?x:{...x,sha256:'f'.repeat(64)})}),/SOURCE_IDENTITY/);
assert.throws(()=>checkP18Register({...r,claims:r.claims.map((x,i)=>i?x:{...x,pdf_page:42})}),/CLAIM_SCOPE/);
assert.throws(()=>verifyP18LocalSource('MAFF_AG005_OVERVIEW_2026_07','/missing/p18.pdf'),/ENOENT/);
console.log('P18 AG-005 guidance: source identity, page claims, anti-certification and evidence year gates PASS');
