/**
 * NaFT Edition Bridge v1 — read-only intake of Blue Carbon v0.3.0 CLI exports.
 * No raw evidence bytes, private keys, blockchain writes, official certification,
 * or dependency on the Blue Carbon repository at runtime.
 *
 * Independently checks source bindings and illustrative arithmetic. This is
 * deterministic software verification, NOT scientific evidence verification.
 */
import {createHash} from 'node:crypto';

export const EDITION_BRIDGE_SCHEMA = 'naft-edition-bridge-receipt/1';
const HEX64 = /^[a-f0-9]{64}$/;
const METHODS = new Map([
  ['NAFT-RESEARCH', '0.1.0'],
  ['JBLUE-REFERENCE', '2.6'],
  ['VM0033-REFERENCE', '2.1']
]);
const requiredEvidence = ['boundary', 'monitoring', 'baseline', 'factor'];

function fail(code) { throw new Error('BLUECARBON_BRIDGE_' + code); }
function object(x) { return !!x && typeof x === 'object' && !Array.isArray(x); }
function insist(condition, code) { if (!condition) fail(code); }
function finite(x) { return typeof x === 'number' && Number.isFinite(x); }
function string(x) { return typeof x === 'string' && x.length > 0 && x.length < 2000; }
function stable(value) {
  if (Array.isArray(value)) return '[' + value.map(stable).join(',') + ']';
  if (object(value)) return '{' + Object.keys(value).sort()
    .filter(k => value[k] !== undefined)
    .map(k => JSON.stringify(k) + ':' + stable(value[k])).join(',') + '}';
  return JSON.stringify(value);
}
function digest(value) { return createHash('sha256').update(stable(value)).digest('hex'); }
function safeJson(value, depth = 0) {
  insist(depth <= 32, 'JSON_DEPTH_LIMIT');
  if (Array.isArray(value)) {
    insist(value.length <= 1500, 'JSON_ARRAY_LIMIT');
    for (const child of value) safeJson(child, depth + 1);
  } else if (object(value)) {
    const keys = Object.keys(value);
    insist(keys.length <= 500, 'JSON_OBJECT_LIMIT');
    for (const key of keys) {
      insist(!['__proto__', 'constructor', 'prototype'].includes(key), 'UNSAFE_JSON_KEY');
      safeJson(value[key], depth + 1);
    }
  } else {
    insist(value === null || typeof value === 'boolean' || finite(value) ||
      (typeof value === 'string' && value.length <= 30000), 'INVALID_JSON_VALUE');
  }
}
function sameNumber(actual, expected, code) {
  insist(finite(actual) && finite(expected) && Object.is(actual, expected), code);
}
function exact(actual, expected, code) {
  insist(stable(actual) === stable(expected), code);
}
function boundEvidence(source, claim) {
  const linked = source.evidence.filter(e => claim.evidenceIds.includes(e.id))
    .sort((a, b) => a.id.localeCompare(b.id));
  return linked.map(e => ({
    id: e.id, type: e.type, sha256: e.sha256 || null,
    sourceUrl: e.sourceUrl || null, note: e.note || null,
    observedAt: e.observedAt || null
  }));
}
function boundMonitoring(source, claimId) {
  const rows = name => (source[name] || [])
    .filter(r => r.claimId === claimId)
    .map(r => ({...r, evidenceIds: [...r.evidenceIds].sort()}))
    .sort((a, b) => a.id.localeCompare(b.id));
  return {carbonPools: rows('carbonPools'), gasFluxes: rows('gasFluxes')};
}
function checkEstimate(claim, evidence, result) {
  for (const k of ['areaHa', 'baselineRate', 'projectRate', 'projectEmissions',
    'leakage', 'uncertaintyPct']) insist(finite(claim[k]), 'INVALID_CLAIM_NUMBER');
  const start = Date.parse(claim.periodStart + 'T00:00:00Z');
  const end = Date.parse(claim.periodEnd + 'T00:00:00Z');
  insist(finite(start) && finite(end) && start < end, 'INVALID_PERIOD');
  const years = (end - start) / 86400000 / 365.2425;
  const grossDelta = claim.areaHa * years * (claim.projectRate - claim.baselineRate);
  const beforeUncertainty = grossDelta - claim.projectEmissions - claim.leakage;
  const uncertaintyDeduction = Math.max(0, beforeUncertainty) * claim.uncertaintyPct / 100;
  const estimateTco2e = Math.max(0, beforeUncertainty - uncertaintyDeduction);
  const missing = requiredEvidence.filter(kind =>
    !evidence.some(e => claim.evidenceIds.includes(e.id) && e.type === kind && e.sha256));
  if (!claim.factorCitation || !claim.factorCitation.trim()) missing.push('factor citation');
  const expected = {
    years, grossDelta, projectEmissions: claim.projectEmissions, leakage: claim.leakage,
    uncertaintyDeduction, estimateTco2e,
    readiness: missing.length ? 'EVIDENCE_GAPS' : 'RESEARCH_ESTIMATE',
    missing, certifiedTco2e: null, issuedCredits: null
  };
  exact(result, expected, 'ESTIMATE_REPLAY_MISMATCH');
  insist(finite(estimateTco2e), 'INVALID_ESTIMATE');
  return estimateTco2e;
}
function checkMonitoring(source, claim, record) {
  const m = record.monitoring;
  insist(object(m) && m.schema === 'NAFT-OBSERVATION-LEDGER/0.3.0' &&
    m.claimId === claim.id, 'MONITORING_SCHEMA');
  const inputs = boundMonitoring(source, claim.id);
  const pools = inputs.carbonPools.map(p => {
    insist(['stocks', 'sediment'].includes(p.measurementKind) && finite(p.areaHa) &&
      finite(p.uncertaintyPct), 'MONITORING_POOL_INVALID');
    const stock = name => {
      if (p.measurementKind === 'stocks') return p[name + 'StockTcHa'];
      const v = p[name];
      insist(object(v) && finite(v.bulkDensityGcm3) &&
        finite(v.depthCm) && finite(v.organicCarbonFraction), 'MONITORING_SEDIMENT_INVALID');
      return v.bulkDensityGcm3 * v.depthCm * 100 * v.organicCarbonFraction;
    };
    const startTcHa = stock('start'), endTcHa = stock('end');
    insist(finite(startTcHa) && finite(endTcHa), 'MONITORING_STOCK_INVALID');
    const changeTc = (endTcHa - startTcHa) * p.areaHa;
    const changeTco2e = changeTc * (44 / 12);
    return {
      id: p.id, pool: p.pool, measurementKind: p.measurementKind,
      areaHa: p.areaHa, startStockTcHa: startTcHa, endStockTcHa: endTcHa,
      changeTc, changeTco2e,
      uncertaintyDisplayTco2e: Math.abs(changeTco2e) * p.uncertaintyPct / 100,
      evidenceIds: p.evidenceIds, factorCitation: p.factorCitation
    };
  });
  const gases = inputs.gasFluxes.map(g => {
    insist(finite(g.totalKg) && finite(g.gwp100), 'MONITORING_GAS_INVALID');
    return {
      id: g.id, gas: g.gas, totalKg: g.totalKg, gwp100: g.gwp100,
      emissionTco2e: g.totalKg * g.gwp100 / 1000,
      evidenceIds: g.evidenceIds, factorCitation: g.factorCitation
    };
  });
  exact(m.pools, pools, 'MONITORING_POOL_REPLAY_MISMATCH');
  exact(m.gases, gases, 'MONITORING_GAS_REPLAY_MISMATCH');
  insist(m.hasObservations === (pools.length + gases.length > 0),
    'MONITORING_OBSERVATION_FLAG');
  sameNumber(m.stockChangeTco2e,
    pools.reduce((sum, p) => sum + p.changeTco2e, 0), 'MONITORING_STOCK_TOTAL');
  sameNumber(m.gasEmissionTco2e,
    gases.reduce((sum, g) => sum + g.emissionTco2e, 0), 'MONITORING_GAS_TOTAL');
  sameNumber(m.uncertaintyDisplayTco2e,
    pools.reduce((sum, p) => sum + p.uncertaintyDisplayTco2e, 0),
    'MONITORING_UNCERTAINTY_TOTAL');
  insist(m.netCreditableTco2e === null && m.netDiagnosticTco2e === null &&
    m.certifiedTco2e === null, 'CERTIFIED_MONITORING_FORBIDDEN');
}
export function importBlueCarbonBundle(bundle) {
  insist(object(bundle) && object(bundle.package) && object(bundle.sourceProject),
    'BUNDLE_REQUIRED');
  const source = bundle.sourceProject, pack = bundle.package;
  insist(Buffer.byteLength(JSON.stringify(bundle), 'utf8') <= 8 * 1024 * 1024,
    'BUNDLE_TOO_LARGE');
  safeJson(bundle);
  insist(pack.schema === '0.3.0' && pack.observationSchema ===
    'NAFT-OBSERVATION-LEDGER/0.3.0', 'UNSUPPORTED_SCHEMA');
  insist(pack.researchOnly === true && pack.formalCertification === false &&
    pack.registryConnected === false && pack.certifiedTco2e === null &&
    pack.issuedCredits === null, 'CERTIFICATION_BOUNDARY');
  insist(object(source.methodology) &&
    METHODS.get(source.methodology.id) === source.methodology.version,
    'UNSUPPORTED_METHOD_REFERENCE');
  insist(string(source.id) && string(source.name) &&
    pack.projectId === source.id && pack.projectName === source.name,
    'PROJECT_IDENTITY_MISMATCH');
  exact(pack.methodology, source.methodology, 'METHODOLOGY_MISMATCH');
  insist(Array.isArray(source.evidence) && source.evidence.length <= 500 &&
    Array.isArray(source.claims) && source.claims.length > 0 &&
    source.claims.length <= 500 && Array.isArray(pack.records) &&
    pack.records.length === source.claims.length &&
    pack.claimCount === source.claims.length, 'CLAIM_COUNT_MISMATCH');
  for (const name of ['carbonPools', 'gasFluxes']) {
    insist(source[name] === undefined ||
      (Array.isArray(source[name]) && source[name].length <= 200), 'OBSERVATION_LIMIT');
  }
  const evidenceIds = new Set(), claimIds = new Set();
  for (const e of source.evidence) {
    insist(object(e) && string(e.id) && string(e.type) &&
      (!e.sha256 || HEX64.test(e.sha256)), 'EVIDENCE_INVALID');
    insist(!evidenceIds.has(e.id), 'DUPLICATE_EVIDENCE');
    evidenceIds.add(e.id);
  }
  for (const c of source.claims) {
    insist(object(c) && string(c.id) && !claimIds.has(c.id) &&
      Array.isArray(c.evidenceIds) && c.evidenceIds.every(id => evidenceIds.has(id)) &&
      c.evidenceIds.length === new Set(c.evidenceIds).size, 'CLAIM_EVIDENCE_INVALID');
    claimIds.add(c.id);
  }
  insist(HEX64.test(pack.packageHash || '') &&
    pack.packageHash === digest({schema: pack.schema, records: pack.records,
      projectId: source.id}), 'PACKAGE_HASH_MISMATCH');
  const claims = [];
  let total = 0;
  for (let i = 0; i < source.claims.length; i++) {
    const c = source.claims[i], r = pack.records[i];
    insist(object(r) && r.claimId === c.id && r.habitat === c.habitat &&
      HEX64.test(r.fingerprint || ''), 'CLAIM_BINDING_MISMATCH');
    const dep = {
      projectId: source.id, methodology: source.methodology,
      claim: {...c, evidenceIds: [...c.evidenceIds].sort()},
      evidence: boundEvidence(source, c), monitoring: boundMonitoring(source, c.id)
    };
    insist(r.fingerprint === digest(dep), 'SOURCE_FINGERPRINT_MISMATCH');
    exact(r.evidenceIds, c.evidenceIds, 'CLAIM_EVIDENCE_MISMATCH');
    const estimate = checkEstimate(c, source.evidence, r.result);
    checkMonitoring(source, c, r);
    total += estimate;
    claims.push({
      claim_id: c.id, habitat: c.habitat, fingerprint: r.fingerprint,
      readiness: r.result.readiness, research_estimate_tco2e: estimate,
      evidence_ids: [...c.evidenceIds].sort(),
      observation_rows: r.monitoring.pools.length + r.monitoring.gases.length
    });
  }
  sameNumber(pack.sumResearchEstimateTco2e, total, 'PROJECT_TOTAL_MISMATCH');
  const receipt = {
    schema: EDITION_BRIDGE_SCHEMA,
    edition: 'BLUE_CARBON',
    source_repository: 'Takzin1/NaFT_BlueCarbon_MRV_Edition',
    source_schema: pack.schema, source_package_hash: pack.packageHash,
    project_id: source.id,
    methodology: {...source.methodology, status: 'RESEARCH_REFERENCE_ONLY'},
    claim_count: claims.length, claims,
    total_research_estimate_tco2e: total,
    replay: {source_fingerprints: 'MATCH', research_arithmetic: 'MATCH',
      monitoring_arithmetic: 'MATCH', package_hash: 'MATCH'},
    scientific_validation: false, evidence_origin_verified: false,
    formal_certification: false, certified_tco2e: null, issued_credits: null,
    web3_anchor_status: 'NOT_SUBMITTED',
    warning: 'Deterministic research replay only; no observational truth, methodology compliance or credit issuance.'
  };
  return {...receipt, receipt_hash: digest(receipt)};
}
