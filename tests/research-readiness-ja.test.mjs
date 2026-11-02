import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {buildResearchReadinessReport} from '../scripts/lib/research-readiness-report.mjs';

const read=path=>JSON.parse(readFileSync(path,'utf8'));
const report=buildResearchReadinessReport({
 coverage:read('research/japanflux-jp-hrt-v200/selected-native-source-coverage.json'),
 badm:read('research/japanflux-jp-hrt-v200/badm-concordance-2026-10-19.json'),
 thesis:read('research/japanflux-jp-hrt-v200/komiya-thesis-study-to-published-lineage.json'),
 tellus:read('research/japanflux-jp-hrt-v200/tellus-ueyama-2012-ec-options-reference.json'),
 rice:read('research/rice-mrv-2026-10-19/standards-and-training-source-manifest.json')
});
const sandbox={location:{hash:'#/source-readiness'}};
vm.createContext(sandbox);
vm.runInContext(readFileSync('src/research-readiness-ja.js','utf8'),sandbox,{filename:'src/research-readiness-ja.js'});
vm.runInContext(readFileSync('src/mrv-ui.js','utf8'),sandbox,{filename:'src/mrv-ui.js'});
const snapshot=sandbox.RESEARCH_READINESS_JA;
const plain=x=>JSON.parse(JSON.stringify(x));
assert.equal(snapshot.snapshot_label,report.snapshot_label);
assert.equal(report.kind,'RESEARCH_DEMO_NOT_AUDIT_CERTIFICATE');
assert.equal(snapshot.scientific_status,'BLOCKED');
assert.equal(snapshot.half_hour_slots,report.counts.jp_hrt_half_hour_slots);
assert.equal(snapshot.numeric_qc_unknown,report.counts.jp_hrt_flux_numeric_qc_unknown);
assert.equal(snapshot.missing_fch4,report.counts.jp_hrt_missing_flux);
assert.equal(snapshot.qc_verified,report.counts.jp_hrt_qc_verified_observations);
assert.equal(snapshot.qc_verified,0);
assert.equal(snapshot.before_badm_start,1689);
assert.equal(snapshot.certified_tco2e,report.officially_certified_tco2e);
assert.equal(snapshot.annual_ch4,report.annual_ch4_mg_m2);
assert.equal(snapshot.bounded_claims,report.counts.supported_or_bounded_claims);
assert.deepEqual(plain(snapshot.source_refs),Object.keys(report.sources));
assert.equal(snapshot.blockers.length,report.counts.open_blockers);
assert.deepEqual(plain(snapshot.blockers.map(x=>[x.id,x.priority,x.source])),
 report.unresolved_blockers.map(x=>[x.id,x.priority,x.source]));
assert.equal(snapshot.blockers.filter(x=>x.priority==='P0').length,report.counts.p0);
assert.equal(snapshot.blockers.filter(x=>x.priority==='P1').length,report.counts.p1);
assert.equal(vm.runInContext('activeRoute()',sandbox),'source-readiness');
const header=vm.runInContext('researchReadinessHeader()',sandbox);
assert.match(header,/原観測・証憑の検証状況/);
const page=vm.runInContext('pgResearchReadinessJa()',sandbox);
for(const id of snapshot.blockers.map(x=>x.id))assert.ok(page.includes('data-evidence-blocker="'+id+'"'));
assert.match(page,/独立QC検証済みの観測値/);
assert.match(page,/正式認証なし・年排出量未算定/);
assert.match(page,/15,605/);
assert.match(page,/1,915/);
assert.match(page,/node scripts\/report-research-readiness.mjs --format json/);
const app=readFileSync('naft-app.html','utf8');
assert.ok(app.indexOf('src/research-readiness-ja.js')<app.indexOf('src/mrv-ui.js'));
assert.match(readFileSync('src/mrv-ui.js','utf8'),/pgResearchReadinessJa\(\)/);
// Fail-closed behavior: pinned counts or false scientific approvals cannot render.
snapshot.qc_verified=1;
assert.throws(()=>vm.runInContext('pgResearchReadinessJa()',sandbox),/UNSUPPORTED_CLAIM/);
snapshot.qc_verified=0;
snapshot.certified_tco2e=1;
assert.throws(()=>vm.runInContext('pgResearchReadinessJa()',sandbox),/UNSUPPORTED_CLAIM/);
snapshot.certified_tco2e=null;
snapshot.numeric_qc_unknown++;
assert.throws(()=>vm.runInContext('pgResearchReadinessJa()',sandbox),/COVERAGE_MISMATCH/);
snapshot.numeric_qc_unknown--;
// HTML escapes injected text instead of creating active elements.
snapshot.blockers[0].label='<img src=x onerror=alert(1)>';
const safe=vm.runInContext('pgResearchReadinessJa()',sandbox);
assert.ok(safe.includes('&lt;img src=x onerror=alert(1)&gt;'));
assert.ok(!safe.includes('<img src=x onerror=alert(1)>'));
console.log('NAFT_RESEARCH_READINESS_JA_PASS: source-gate parity, 7 blockers, route, fail-closed and HTML escaping');
