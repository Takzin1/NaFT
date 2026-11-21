import {canonical, instant, sha256, valueAsset} from './environmental-valuation.mjs';

function check(ok, code) { if (!ok) throw new Error(code); }
const key = i => canonical([i.asset.asset_id,i.valuation_scenario_id]);
function uniqueEvidence(inputs) {
  const owners = new Map();
  for (const i of inputs) {
    const k = canonical([i.asset.evidence_package_sha256,i.valuation_scenario_id]);
    check(!owners.has(k) && !owners.has(key(i) + ':asset'),'DUPLICATE_EVIDENCE_OR_ASSET');
    owners.set(k,true);
    owners.set(key(i) + ':asset',true);
  }
}
// Reconciliation is pure and atomic. Supply the complete current scenario set.
// Changed evidence/snapshot fields are dependencies. Never rewrite earlier receipts.
export async function reconcile(history, inputs, at) {
  instant(at);
  uniqueEvidence(inputs);
  const heads = new Map();
  for (const r of history) {
    const {receipt_sha256,...body} = r;
    check(await sha256(body) === receipt_sha256,'HISTORY_DIGEST');
    const id = key(r.input), prior = heads.get(id);
    check(r.previous_receipt_sha256 === (prior?.receipt_sha256 ?? null) &&
      (!prior || r.as_of >= prior.as_of),'BROKEN_LINEAGE');
    heads.set(id,r);
  }
  const ids = new Set(inputs.map(key));
  check([...heads.keys()].every(k => ids.has(k)),'MISSING_CURRENT_ASSET');
  const appended = [];
  for (const input of inputs) {
    const prior = heads.get(key(input));
    check(!prior || at >= prior.as_of,'BACKDATED_REVISION');
    // An identical snapshot can change eligibility only when an observation
    // enters/leaves its time window. Retain the same head between boundaries.
    const crossed = prior && Object.values(input.snapshot).some(o => o &&
      [o.observed_at,o.expires_at].some(t => prior.as_of < t && t <= at));
    if (prior && canonical(prior.input) === canonical(input) && !crossed) continue;
    appended.push(await valueAsset(input,at,prior?.receipt_sha256 ?? null));
  }
  return [...structuredClone(history),...appended];
}
export async function compilerAsset(pkg) {
  const d = pkg.document;
  check(d?.schema === 'naft-evidence-compiler-package-1' && d.formal_certification === false &&
    await sha256(d) === pkg.package_hash,'COMPILER_PACKAGE_INTEGRITY');
  const method = d.methodology;
  const valid = d.evaluation.status === 'AUTO_REEVALUATED' &&
    d.calculation.status === 'SYNTHETIC_PASS' && method.source.status === 'SYNTHETIC';
  const failedHash = d.evaluation.issues.some(x => x.code.startsWith('content_hash:'));
  return {asset_id:d.claim_id, asset_category:method.methodology_id === 'FO-001' ? 'FORESTRY' : 'AGRICULTURE',
    methodology_id:method.methodology_id,methodology_version:method.methodology_version,
    evidence_package_sha256:pkg.package_hash,source_record_sha256:d.input_fingerprint,
    verification_status:failedHash ? 'AUTHENTICITY_FAILED' : valid ? 'RESEARCH_ESTIMATE' : d.evaluation.status,
    quantity:valid && d.calculation.arithmetic_preview != null ? String(d.calculation.arithmetic_preview) : null,
    quantity_unit:d.calculation.unit,rights_status:'UNVERIFIED'};
}
// Accept actual analyzeImpact().claims rows. Verify the previous package binding
// before applying any successor, including hash failures that suspend listings.
export async function applyCompilerImpact(inputs, report) {
  const rows = new Map(report.claims.filter(r => r.requires_reverification).map(r => [r.claim_id,r]));
  return Promise.all(inputs.map(async input => {
    const row = rows.get(input.asset.asset_id);
    if (!row) return input;
    check(row.previous_package_hash === input.asset.evidence_package_sha256,'STALE_IMPACT');
    const next = await compilerAsset(row.successor);
    check(next.asset_id === row.claim_id,'IMPACT_IDENTITY');
    return {...input,asset:next};
  }));
}
