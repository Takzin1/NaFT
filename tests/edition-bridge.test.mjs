import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {importBlueCarbonBundle, EDITION_BRIDGE_SCHEMA} from '../src/edition-bridge.mjs';

const stable = value => {
  if (Array.isArray(value)) return '[' + value.map(stable).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).sort()
    .filter(k => value[k] !== undefined)
    .map(k => JSON.stringify(k) + ':' + stable(value[k])).join(',') + '}';
  return JSON.stringify(value);
};
const hash = value => createHash('sha256').update(stable(value)).digest('hex');

function fixture() {
  const sourceProject = {
    id: 'SYNTHETIC-BRIDGE-001',
    name: 'Synthetic coastal research only',
    methodology: {id: 'NAFT-RESEARCH', version: '0.1.0'},
    evidence: ['boundary', 'monitoring', 'baseline', 'factor']
      .map((type, i) => ({id: 'EV-' + type, type, sha256: String(i + 1).repeat(64)})),
    claims: [{
      id: 'C-01', habitat: 'seagrass', periodStart: '2025-01-01',
      periodEnd: '2026-01-01', areaHa: 1.5,
      baselineRate: 1, projectRate: 2, projectEmissions: 0.2,
      leakage: 0.1, uncertaintyPct: 10, factorCitation: 'SYNTHETIC',
      evidenceIds: ['EV-boundary', 'EV-monitoring', 'EV-baseline', 'EV-factor']
    }]
  };
  const c = sourceProject.claims[0];
  const evidence = sourceProject.evidence.map(e => ({
    id: e.id, type: e.type, sha256: e.sha256,
    sourceUrl: null, note: null, observedAt: null
  })).sort((a, b) => a.id.localeCompare(b.id));
  const dependence = {
    projectId: sourceProject.id, methodology: sourceProject.methodology,
    claim: {...c, evidenceIds: [...c.evidenceIds].sort()},
    evidence, monitoring: {carbonPools: [], gasFluxes: []}
  };
  const years = (Date.parse('2026-01-01T00:00:00Z') -
    Date.parse('2025-01-01T00:00:00Z')) / 86400000 / 365.2425;
  const grossDelta = 1.5 * years * (2 - 1);
  const before = grossDelta - .2 - .1;
  const uncertaintyDeduction = Math.max(0, before) * 10 / 100;
  const estimateTco2e = Math.max(0, before - uncertaintyDeduction);
  const records = [{
    claimId: c.id, habitat: c.habitat, fingerprint: hash(dependence),
    evidenceIds: c.evidenceIds,
    result: {years, grossDelta, projectEmissions: .2, leakage: .1,
      uncertaintyDeduction, estimateTco2e, readiness: 'RESEARCH_ESTIMATE',
      missing: [], certifiedTco2e: null, issuedCredits: null},
    monitoring: {
      schema: 'NAFT-OBSERVATION-LEDGER/0.3.0', claimId: c.id,
      hasObservations: false, pools: [], gases: [],
      stockChangeTco2e: 0, gasEmissionTco2e: 0,
      uncertaintyDisplayTco2e: 0, netCreditableTco2e: null,
      netDiagnosticTco2e: null, certifiedTco2e: null, warnings: []
    }
  }];
  const packageHash = hash({schema: '0.3.0', records, projectId: sourceProject.id});
  return {
    sourceProject,
    package: {
      schema: '0.3.0', observationSchema: 'NAFT-OBSERVATION-LEDGER/0.3.0',
      researchOnly: true, formalCertification: false, registryConnected: false,
      projectId: sourceProject.id, projectName: sourceProject.name,
      methodology: sourceProject.methodology, records, packageHash,
      claimCount: 1, sumResearchEstimateTco2e: estimateTco2e,
      certifiedTco2e: null, issuedCredits: null
    }
  };
}
const clone = x => JSON.parse(JSON.stringify(x));
const rejects = (x, code) => assert.throws(() => importBlueCarbonBundle(x),
  new RegExp('BLUECARBON_BRIDGE_' + code));

test('synthetic Blue Carbon bundle yields reproducible, non-certified receipt', () => {
  const bundle = fixture();
  const a = importBlueCarbonBundle(bundle), b = importBlueCarbonBundle(clone(bundle));
  assert.deepEqual(a, b);
  assert.equal(a.schema, EDITION_BRIDGE_SCHEMA);
  assert.equal(a.replay.package_hash, 'MATCH');
  assert.equal(a.claim_count, 1);
  assert.equal(a.certified_tco2e, null);
  assert.equal(a.web3_anchor_status, 'NOT_SUBMITTED');
  assert.match(a.receipt_hash, /^[a-f0-9]{64}$/);
  assert.equal(JSON.stringify(a).includes('EV-boundary'), true);
  assert.equal(JSON.stringify(a).includes('Synthetic coastal research only'), false);
});
test('rejects tampered hash', () => {
  const b = fixture(); b.package.packageHash = '0'.repeat(64);
  rejects(b, 'PACKAGE_HASH_MISMATCH');
});
test('rejects changed source with matching original package', () => {
  const b = fixture(); b.sourceProject.claims[0].areaHa = 99;
  rejects(b, 'SOURCE_FINGERPRINT_MISMATCH');
});
test('rejects forged numeric result even if attacker recomputes package hash', () => {
  const b = fixture(); b.package.records[0].result.estimateTco2e = 999;
  b.package.sumResearchEstimateTco2e = 999;
  b.package.packageHash = hash({schema: '0.3.0', records: b.package.records,
    projectId: b.package.projectId});
  rejects(b, 'ESTIMATE_REPLAY_MISMATCH');
});
test('rejects certification upgrade', () => {
  const b = fixture(); b.package.formalCertification = true;
  rejects(b, 'CERTIFICATION_BOUNDARY');
});
test('rejects synthetic or arbitrary unsupported methodology', () => {
  const b = fixture(); b.sourceProject.methodology = {id: 'UNVERIFIED', version: '0'};
  rejects(b, 'UNSUPPORTED_METHOD_REFERENCE');
});
test('rejects prototype keys and impossible inputs', () => {
  const b = fixture(); b.sourceProject.__proto__ = {harmless: true};
  const raw = JSON.parse(JSON.stringify(fixture()).replace(
    '"sourceProject":{', '"sourceProject":{"__proto__":{"x":true},'));
  rejects(raw, 'UNSAFE_JSON_KEY');
});
