import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyFudePolygonResearchLink}
  from '../scripts/p26-ag005-fude-polygon-reference.mjs';

const json=path=>JSON.parse(readFileSync(path,'utf8'));
const copy=x=>JSON.parse(JSON.stringify(x));
const fixture=json('fixtures/p26-ag005-fude-reference-synthetic.json');
const links=json('research/registry-source-intake-2026-11-08/maff-fude-polygon-2026-links.json');
const originals=json('research/registry-source-intake-2026-11-08/ipcc-moe-maff-evidence-2026-11-08.json');
const roles=json('data/registry-source-intake-2026-11-08/ipcc-moe-maff-source-role-matrix.json');
const mustBlock=(v,reason)=>assert.throws(()=>verifyFudePolygonResearchLink(v),
  new RegExp('P26_AG005_FUDE_BLOCKED:'+reason));
test('7 uploaded originals exact bytes/sha and never published in public GitHub',()=>{
  assert.equal(originals.source_count,7);
  assert.deepEqual(originals.sources.map(s=>s.pages),[1,55,8,102,4,24,33]);
  assert.deepEqual(originals.sources.map(s=>s.bytes),
    [273245,1196013,507167,1835807,312509,16594377,1016213]);
  assert.deepEqual(originals.sources.map(s=>s.sha256),
    ['612c029f070f8ecfa6990690c7504934c4d4ff52ec972e37d16ed42749b1941f',
    'c858bec0b9fa239f225edb945be9e33a018fd5f748f5f6a0fd11c7f02bf3f0f3',
    '79d1d18ff1d1c7e6f78e70e8ebfa05de3f7054adce6c5ca788d0e42d3afe592b',
    'eecbf328eed9ef43cd3f091352fe9545e7c078288d89bf5d32adcae1f7805eda',
    '7cd865f623147e9c08198b650cc893469b73064ae9e4a7cb8a94b9baff58414f',
    '285636eaeeee308c7a116c299c2524bd186c06e879e8919c03456b699fdfed17',
    'a026b2da0cf8348d03e7c166644bf82df41bfe1695334dd4fa77a9640375f3c5']);
  assert.equal(originals.rights_policy.raw_pdf_bytes_committed,false);
  assert.equal(originals.registry_login_performed,false);
  assert.equal(originals.production_mint_authorized,false);
});
test('official polygon and eMAFF links are exact, distinct, 2026 version-bound',()=>{
  const x=Object.fromEntries(links.official_link_registry.map(s=>[s.id,s]));
  assert.equal(x.MAFF_FUDE_INFO.url,
    'https://www.maff.go.jp/j/tokei/porigon/index.html');
  assert.equal(x.MAFF_FUDE_VIEWER_DOWNLOAD_2026.url,
    'https://open.fude.maff.go.jp/');
  assert.equal(x.MAFF_FUDE_FGB_2026.url,
    'https://www.maff.go.jp/j/tokei/census/shuraku_data/2025/mb/index.html');
  assert.equal(x.MAFF_FUDE_FGB_2026.format,'FlatGeobuf');
  assert.equal(x.MAFF_EMAFF_NOUCHI_NAV.url,'https://map.maff.go.jp/');
  assert.equal(x.MAFF_EMAFF_NOUCHI_NAV.not_same_dataset_as_public_fude_polygons,true);
  assert.equal(links.polygon_dataset_year,2026);
  assert.equal(links.data_state.downloaded_flatgeobuf,false);
  assert.equal(links.data_state.field_chiban_verified,false);
  assert.equal(links.data_state.production_mint_authorized,false);
});
test('2025 activity registered under AG-005 v3.0 still uses new chiban guidance',()=>{
  const r=verifyFudePolygonResearchLink(fixture);
  assert.equal(r.report_rule_effective_from,'2025-01-01');
  assert.equal(r.original_methodology_version,'AG-005 Ver. 3.0');
  assert.equal(r.guide_source,'MAFF_AG005_CHIBAN_GUIDE_2025_12');
  assert.equal(r.not_historical_polygon_snapshot,true);
  assert.equal(r.polygon_dataset_year,2026);
  assert.equal(r.primary_chiban_source_url,'https://map.maff.go.jp/');
  assert.equal(r.actual_geometry_overlap_measured,false);
  assert.equal(r.legal_cadastral_boundary_verified,false);
  assert.equal(r.emaff_chiban_source_verified,false);
  assert.equal(r.certified_tco2e,null);
  assert.equal(r.production_mint_authorized,false);
  assert.equal(r.status,'EVIDENCE_LINK_CREATED_REQUIRES_HUMAN_SPATIAL_AND_REGISTRY_REVIEW');
  assert.ok(!JSON.stringify(r).includes('TEST県TEST市TEST町'));
});
test('recognizes other supported historical methodology versions for 2025+ activity',()=>{
  for(const version of links.ag005_2025_plus_rules.applies_to_registered_versions){
    const v=copy(fixture);v.methodology_version=version;
    assert.equal(verifyFudePolygonResearchLink(v).production_mint_authorized,false);
  }
});
test('2024 and pre-2025 periods are not silently treated under 2025 guidance',()=>{
  const v=copy(fixture);v.activity_date='2024-12-31';
  mustBlock(v,'LEGACY_PERIOD_NOT_SUPPORTED');
  const w=copy(fixture);w.activity_date='2025-02-30';
  mustBlock(w,'DATE_INVALID');
});
test('source URL spoofing, wrong version, unknown methodology rejected',()=>{
  const a=copy(fixture);a.polygon_source_url='https://example.com/download';
  mustBlock(a,'SOURCE_URL_NOT_AUTHORIZED');
  const b=copy(fixture);b.polygon_dataset_year=2025;
  mustBlock(b,'POLYGON_DATASET_VERSION_MISMATCH');
  const c=copy(fixture);c.methodology_version='AG-005 Ver. 99.0';
  mustBlock(c,'METHODOLOGY_VERSION_NOT_INDEXED');
});
test('without eMAFF chiban evidence requires documented absence screenshot and area reference',()=>{
  const a=copy(fixture);a.emaff_chiban=null;
  mustBlock(a,'EMAF_ABSENCE_SCREENSHOT_EVIDENCE_REQUIRED');
  a.emaff_absence_screenshot_sha256='b'.repeat(64);
  const receipt=verifyFudePolygonResearchLink(a);
  assert.equal(receipt.no_emaff_chiban_exception_evidence_provided,true);
  assert.equal(receipt.legal_cadastral_boundary_verified,false);
  const b=copy(a);b.area_document_sha256='invalid';
  mustBlock(b,'AREA_EVIDENCE_SHA_REQUIRED');
});
test('mutually exclusive normal eMAFF chiban and absence screenshot',()=>{
  const a=copy(fixture);a.emaff_absence_screenshot_sha256='c'.repeat(64);
  mustBlock(a,'CONFLICTING_ABSENCE_SCREENSHOT');
});
test('area numeric/provenance and human authorization fail closed',()=>{
  const a=copy(fixture);a.area_ha='0';
  mustBlock(a,'POSITIVE_AREA_REQUIRED');
  const b=copy(fixture);b.area_ha='-1.5';
  mustBlock(b,'POSITIVE_AREA_REQUIRED');
  const c=copy(fixture);c.review_status='J_CREDIT_APPROVED';
  mustBlock(c,'APPROVAL_CANNOT_BE_SELF_ASSERTED');
  const d=copy(fixture);d.production_mint_authorized=true;
  mustBlock(d,'UNKNOWN_FIELDS');
});
test('science source roles preserve national uncertainty and QA/QC scope',()=>{
  assert.equal(roles.layers.length,7);
  const u=roles.layers.find(x=>x.layer==='NATIONAL_INVENTORY_UNCERTAINTY');
  assert.equal(u.numeric_reference.agriculture_2024_uncertainty_down_percent,'-10');
  assert.equal(u.numeric_reference.agriculture_2024_uncertainty_up_percent,'+22');
  assert.equal(u.numeric_reference.national_scope_only,true);
  assert.equal(roles.numeric_is_global_or_national_not_field_certification,true);
  assert.equal(roles.qa_interpretation.includes('QC at best'),true);
  assert.equal(roles.actual_geometry_loaded,false);
  assert.equal(roles.production_mint_authorized,false);
});
test('one-to-many polygons are manual, no automatic parcel/ownership assertions',()=>{
  assert.equal(links.ag005_2025_plus_rules.if_emaff_nav_chiban_not_provided,
    'SCREENSHOT_EVIDENCING_ABSENCE_REQUIRED_THEN_FALLBACK_TO_AREA_DOCUMENT_CHIBAN');
  assert.ok(links.ag005_2025_plus_rules.do_not_infer.includes('NOT'));
  const r=verifyFudePolygonResearchLink(fixture);
  assert.equal(r.automated_emaff_to_fude_geometry_join_performed,false);
  assert.equal(r.land_ownership_or_credit_rights_verified,false);
  assert.equal(r.actual_credit_issuance_verified,false);
  assert.equal(r.formal_certification,false);
});
