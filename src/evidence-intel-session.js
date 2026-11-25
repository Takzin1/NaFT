'use strict';
/**
 * NaFT Evidence Intelligence — guarded session adapter.
 *
 * Persists engine runs, individual exception decisions, final research attestations and
 * provenance anchors through the existing store (`db` / saveDB), actor/role guards and
 * append-only audit chain of mrv-core.js. Nothing derived is trusted from storage: every
 * read rebuilds the engine state from the stored Claim inputs and compares hashes, so
 * there is no long-lived integrity cache.
 *
 * Human operations remain: exception decisions (reviewer), Rule Pack release (maintainer,
 * existing pack_releases) and final attestation (reviewer). Deterministic FAIL / MISSING /
 * UNSUPPORTED issues are not overridable. Attestation is of a research package, never a
 * formal certification, GHG inventory or credit issuance. Anchors are NOT_SUBMITTED.
 *
 * Requires mrv-core.js, methodology-packs.js, mrv-compiler.js and the evidence-intel modules.
 */
var EI_SESSION_COLLECTIONS = ['ei_runs', 'ei_decisions', 'ei_attestations', 'ei_anchors'];
var EI_SESSION_REGISTRIES = ['default', 'with-synthetic-correction'];
var EI_SESSION_DECISIONS = ['ACCEPT', 'REJECT', 'NEED_MORE_EVIDENCE', 'ABSTAIN'];

function eiSessionCollections() {
  if(!db) throw new Error('EI_SESSION_DATASET_REQUIRED');
  EI_SESSION_COLLECTIONS.forEach(function(k) { if(db[k] === undefined) db[k] = []; if(!Array.isArray(db[k])) throw new Error('EI_INVALID_SESSION_DATASET'); });
}
function eiSessionContext(registry) {
  if(EI_SESSION_REGISTRIES.indexOf(registry) < 0) throw new Error('EI_UNKNOWN_FACTOR_REGISTRY');
  return registry === 'default' ? eiDefaultContext() : {packs: EI_PACK_REGISTRY, factors: EI_FACTOR_REGISTRY_NEXT};
}
function eiSessionLabel(label) {
  if(typeof label !== 'string' || !/^[A-Za-z0-9._:-]{1,80}$/.test(label)) throw new Error('EI_INVALID_ANCHOR_LABEL');
  return label;
}
/** Runs persist inputs and hashes only; the state is rebuilt on every use. */
function eiSessionRebuild(run) {
  var ctx = eiSessionContext(run.factor_registry);
  return {ctx: ctx, state: eiBuild(run.claim_inputs, ctx)};
}
function eiSessionRunBody(owner, label, registry, state, supersedes, change, changeHash) {
  var ids = Object.keys(state.claims).sort(), log = eiAuditBuild(eiAuditNew(), state);
  if(change) log = eiAuditAppend(log, [{type: 'CHANGE', subject: 'change:' + changeHash, payload: {change: change, change_hash: changeHash}}]);
  return {owner: owner, label: label, factor_registry: registry, claim_inputs: ids.map(function(id) { return state.claims[id].input; }),
    state_digest: eiStateDigest(state), records: ids.map(function(id) { return {claim_id: id, record_hash: state.claims[id].record_hash, status: state.claims[id].status}; }),
    engine_audit_head: log.head, engine_audit_entries: log.entries.length, supersedes: supersedes, change: change || null, change_hash: changeHash || null,
    engine_version: EI_ENGINE_VERSION, calculation_engine: EI_CALC_VERSION, formal_certification: false};
}
function eiSessionVerifyRun(run) {
  requireAudit();
  if(!run || typeof run.id !== 'string' || !sealed(run, 'run_hash') || !eventBinds('ei_run', run.id, {hash: run.run_hash})) throw new Error('EI_RUN_INTEGRITY');
  var rebuilt = eiSessionRebuild(run), body = eiSessionRunBody(run.owner, run.label, run.factor_registry, rebuilt.state, run.supersedes, run.change, run.change_hash);
  ['claim_inputs', 'state_digest', 'records', 'engine_audit_head', 'engine_audit_entries', 'engine_version', 'calculation_engine'].forEach(function(k) {
    if(canonicalize(body[k]) !== canonicalize(run[k])) throw new Error('EI_RUN_INTEGRITY');
  });
  return rebuilt;
}
/** One lineage per (owner, label); exactly one head. */
function eiSessionLineage(owner, label) {
  eiSessionCollections(); requireAudit();
  var runs = db.ei_runs.filter(function(r) { return r.owner === owner && r.label === label; });
  if(!runs.length) return {runs: [], current: null};
  var byHash = new Map(), children = new Map();
  runs.forEach(function(r) { if(byHash.has(r.run_hash)) throw new Error('EI_RUN_LINEAGE_CONFLICT'); byHash.set(r.run_hash, r); });
  runs.forEach(function(r) {
    if(r.supersedes === null) return;
    if(!byHash.has(r.supersedes)) throw new Error('EI_RUN_LINEAGE_BROKEN');
    if(children.has(r.supersedes)) throw new Error('EI_RUN_LINEAGE_CONFLICT');
    children.set(r.supersedes, r);
  });
  // Walking from the single root must reach every run: this rejects several roots, cycles and detached runs.
  var roots = runs.filter(function(r) { return r.supersedes === null; }), ordered = [], cursor = roots.length === 1 ? roots[0] : null;
  while(cursor) { ordered.push(cursor); cursor = children.get(cursor.run_hash); }
  if(ordered.length !== runs.length) throw new Error('EI_RUN_LINEAGE_CONFLICT');
  return {runs: ordered, current: ordered[ordered.length - 1]};
}
function eiSessionAccess(run) {
  var u = currentUser();
  if(!u || !(u.role === 'reviewer' || (u.role === 'operator' && u.id === run.owner))) throw new Error('ROLE_BLOCKED');
  return u;
}
function eiSessionRun(id) {
  eiSessionCollections();
  var run = db.ei_runs.find(function(r) { return r.id === id; });
  if(!run) throw new Error('EI_RUN_NOT_FOUND');
  eiSessionAccess(run);
  return run;
}
/** Current head of its lineage, verified by full rebuild. */
function eiSessionCurrent(id) {
  var run = eiSessionRun(id), head = eiSessionLineage(run.owner, run.label).current;
  if(!head || head.id !== id) throw new Error('STALE_PACKAGE');
  return {run: run, rebuilt: eiSessionVerifyRun(run)};
}
function eiSessionClaimIndex() {
  var index = new Map();
  db.ei_runs.forEach(function(r) {
    var lineage = eiSessionLineage(r.owner, r.label);
    if(lineage.current !== r) return;
    r.records.forEach(function(x) { index.set(x.claim_id, r); });
  });
  return index;
}
async function eiSessionPersist(mutate) {
  var before = clone(db);
  try { var out = mutate(); await saveDB(); return out; } catch(error) { db = before; throw error; }
}

// ---- Operator: compile and change --------------------------------------------------------
async function eiSessionCompile(claims, options) {
  var u = requireRole('operator'); requireAudit(); eiSessionCollections();
  options = options || {};
  var label = eiSessionLabel(options.label === undefined ? 'portfolio' : options.label), registry = options.factor_registry === undefined ? 'default' : options.factor_registry;
  if(eiSessionLineage(u.id, label).current) throw new Error('EI_LABEL_IN_USE_APPLY_CHANGE_INSTEAD');
  var ctx = eiSessionContext(registry), state = eiBuild(claims, ctx), index = eiSessionClaimIndex();
  Object.keys(state.claims).forEach(function(id) { if(index.has(id)) throw new Error(index.get(id).owner === u.id ? 'EI_CLAIM_ALREADY_IN_CURRENT_RUN' : 'ROLE_BLOCKED'); });
  var run = seal(Object.assign({id: uid('eirun')}, eiSessionRunBody(u.id, label, registry, state, null, null, null)), 'run_hash');
  return eiSessionPersist(function() { db.ei_runs.push(run); audit('ei_run', run.id, {hash: run.run_hash}); return run; });
}
/** A change appends a successor run; earlier runs, decisions and attestations become historical. */
async function eiSessionApplyChange(runId, change) {
  // eiSessionCurrent() -> eiSessionAccess() already restricts an operator to their own runs.
  var u = requireRole('operator'), current = eiSessionCurrent(runId);
  var registry = current.run.factor_registry, ctx = current.rebuilt.ctx, engineChange = change;
  if(change && change.type === 'factor_registry') {
    registry = change.factor_registry; ctx = eiSessionContext(registry); engineChange = {type: 'factor_registry'};
    if(registry === current.run.factor_registry) throw new Error('EI_FACTOR_REGISTRY_UNCHANGED');
  }
  var applied = eiApplyChange(current.rebuilt.state, engineChange, ctx), recorded = change && change.type === 'factor_registry' ? {type: 'factor_registry', factor_registry: registry} : clone(change);
  var index = eiSessionClaimIndex();
  Object.keys(applied.state.claims).forEach(function(id) { var owner = index.get(id); if(owner && owner.id !== runId) throw new Error('EI_CLAIM_ALREADY_IN_CURRENT_RUN'); });
  var run = seal(Object.assign({id: uid('eirun')}, eiSessionRunBody(u.id, current.run.label, registry, applied.state, current.run.run_hash, recorded, applied.delta.change_hash)), 'run_hash');
  await eiSessionPersist(function() { db.ei_runs.push(run); audit('ei_run', run.id, {hash: run.run_hash}); });
  return {run: run, delta: applied.delta};
}

// ---- Maintainer: research Pack release for Packs outside the legacy registry ---------------
/** Same record and audit shape as approveVersionedPack(); release never changes official adoption status. */
async function eiSessionApprovePack(key, note) {
  var u = requireRole('maintainer'); requireAudit();
  var pack = EI_PACK_REGISTRY[key];
  if(!pack) throw new Error('UNSUPPORTED_METHODOLOGY');
  if(packRelease(pack)) throw new Error('PACK_ALREADY_RELEASED');
  var r = seal({id: uid('release'), pack_key: key, pack_hash: hashObject(pack), approved_by: u.id, approved_at: nowISO(), note: humanNote(note), scope: 'research_only', official_adoption_confirmed: false}, 'release_hash');
  return eiSessionPersist(function() { db.pack_releases.push(r); audit('pack_release', r.id, {hash: r.release_hash}); return r; });
}

// ---- Reviewer: exception decisions and final attestation ----------------------------------
function eiSessionRecord(rebuilt, claimId) {
  if(!rebuilt.state.claims[claimId]) throw new Error('EI_CLAIM_NOT_FOUND');
  return eiRecord(rebuilt.state, claimId);
}
function eiSessionDecisionBinding(d) {
  return {run_id: d.run_id, run_hash: d.run_hash, claim_id: d.claim_id, record_hash: d.record_hash, exception_code: d.exception_code, reviewer: d.reviewer, reason: d.reason, decision: d.decision};
}
/** Decisions valid for this exact run and record; anything else is integrity failure or stale. */
function eiSessionDecisions(run, claimId, recordHash, issues) {
  var list = db.ei_decisions.filter(function(d) { return d.run_id === run.id && d.claim_id === claimId; });
  var seen = new Set();
  list.forEach(function(d) {
    var reviewer = db.users.find(function(x) { return x.id === d.reviewer && x.role === 'reviewer' && x.status === 'active'; });
    if(!reviewer || d.decision_hash !== hashObject(eiSessionDecisionBinding(d)) || !eventBinds('ei_decision', d.id, {hash: d.decision_hash})) throw new Error('DECISION_INTEGRITY_BLOCKED');
    if(d.run_hash !== run.run_hash || d.record_hash !== recordHash) throw new Error('STALE_REVIEW');
    if(EI_SESSION_DECISIONS.indexOf(d.decision) < 0 || seen.has(d.exception_code)) throw new Error('DECISION_INTEGRITY_BLOCKED');
    if(!issues.some(function(i) { return i.code === d.exception_code && i.status === 'HUMAN_REVIEW_REQUIRED'; })) throw new Error('BLOCKING_EXCEPTION_NOT_OVERRIDABLE');
    seen.add(d.exception_code);
  });
  return list.slice().sort(function(a, b) { return a.exception_code < b.exception_code ? -1 : a.exception_code > b.exception_code ? 1 : 0; });
}
async function eiSessionDecide(runId, claimId, exceptionCode, decision, reason) {
  var u = requireRole('reviewer'), current = eiSessionCurrent(runId), rec = eiSessionRecord(current.rebuilt, claimId), issues = rec.record.evaluation.issues;
  if(db.ei_attestations.some(function(a) { return a.run_id === runId && a.claim_id === claimId; })) throw new Error('ATTESTED_ACTIVITY_LOCKED');
  if(EI_SESSION_DECISIONS.indexOf(decision) < 0) throw new Error('INVALID_HUMAN_DECISION');
  var target = issues.find(function(i) { return i.code === exceptionCode; });
  if(!target || target.status !== 'HUMAN_REVIEW_REQUIRED') throw new Error('BLOCKING_EXCEPTION_NOT_OVERRIDABLE');
  if(eiSessionDecisions(current.run, claimId, rec.record_hash, issues).some(function(d) { return d.exception_code === exceptionCode; })) throw new Error('EXCEPTION_ALREADY_DECIDED');
  var d = {id: uid('eidecision'), run_id: runId, run_hash: current.run.run_hash, claim_id: claimId, record_hash: rec.record_hash, exception_code: exceptionCode, reviewer: u.id, reason: humanNote(reason), decision: decision};
  d.decision_hash = hashObject(eiSessionDecisionBinding(d));
  return eiSessionPersist(function() { db.ei_decisions.push(d); audit('ei_decision', d.id, {hash: d.decision_hash}); return d; });
}
/** Attestable only when nothing blocking remains and every judgement issue is individually ACCEPTed. */
function eiSessionGate(run, rebuilt, claimId) {
  var rec = eiSessionRecord(rebuilt, claimId), evaluation = rec.record.evaluation, decisions = eiSessionDecisions(run, claimId, rec.record_hash, evaluation.issues);
  var outstanding = evaluation.issues.filter(function(i) {
    if(i.status !== 'HUMAN_REVIEW_REQUIRED') return true;
    var d = decisions.find(function(x) { return x.exception_code === i.code; });
    return !d || d.decision !== 'ACCEPT';
  });
  return {record: rec, decisions: decisions, outstanding: outstanding.map(function(i) { return {code: i.code, status: i.status}; })};
}
async function eiSessionAttest(runId, claimId, note, acknowledged) {
  var u = requireRole('reviewer'), current = eiSessionCurrent(runId);
  if(acknowledged !== true) throw new Error('ATTESTATION_ACKNOWLEDGEMENT_REQUIRED');
  note = humanNote(note);
  if(db.ei_attestations.some(function(a) { return a.run_id === runId && a.claim_id === claimId; })) throw new Error('DUPLICATE_ATTESTATION_BLOCKED');
  var rec = eiSessionRecord(current.rebuilt, claimId), pack = current.rebuilt.ctx.packs[rec.record.methodology.key];
  if(!pack || !validRelease(pack)) throw new Error('PACK_RELEASE_APPROVAL_REQUIRED');
  var gate = eiSessionGate(current.run, current.rebuilt, claimId);
  if(gate.outstanding.length) throw new Error('UNRESOLVED_EXCEPTIONS');
  var report = eiClaimReport(current.rebuilt.state, claimId);
  var document = {schema: 'naft-ei-attested-research-package-1', status: 'ATTESTED_RESEARCH_PACKAGE', claim_id: claimId, run_id: runId, run_hash: current.run.run_hash,
    record_hash: gate.record.record_hash, semantic_hash: gate.record.record.semantic_hash, report_hash: report.report_hash, report: report,
    decisions: gate.decisions.map(function(d) { return {id: d.id, exception_code: d.exception_code, decision: d.decision, decision_hash: d.decision_hash}; }),
    pack_release: clone(packRelease(pack)), attestation: {reviewer: u.id, note: note, acknowledged: true, scope: 'research_package_only_not_certification'},
    boundary: {disclaimer: DISCLAIMER, formal_certification: false, certified_result: null, is_ghg_inventory: false, is_credit_certification: false}};
  var att = seal({id: uid('eiattestation'), run_id: runId, claim_id: claimId, document: document, package_hash: hashObject(document)}, 'attestation_hash');
  return eiSessionPersist(function() { db.ei_attestations.push(att); audit('ei_attested', att.id, {hash: att.attestation_hash}); return att; });
}
function eiSessionAttestationValid(att) {
  var reviewer = att && att.document && db.users.find(function(x) { return x.id === att.document.attestation.reviewer && x.role === 'reviewer' && x.status === 'active'; });
  return !!(att && sealed(att, 'attestation_hash') && hashObject(att.document) === att.package_hash && eventBinds('ei_attested', att.id, {hash: att.attestation_hash}) && reviewer);
}
/** Draft: grounded report from the rebuilt current state. Attested: integrity, currency and release re-checked. */
function eiSessionExport(runId, claimId, attested) {
  var current = eiSessionCurrent(runId);
  if(!attested) {
    var gate = eiSessionGate(current.run, current.rebuilt, claimId);
    return canonicalize({status: 'DRAFT', claim_id: claimId, run_id: runId, record_hash: gate.record.record_hash, report: eiClaimReport(current.rebuilt.state, claimId),
      decisions: gate.decisions, outstanding: gate.outstanding, formal_certification: false, certified_result: null});
  }
  var att = db.ei_attestations.find(function(a) { return a.run_id === runId && a.claim_id === claimId; });
  if(!att || !eiSessionAttestationValid(att)) throw new Error('ATTESTATION_INTEGRITY_BLOCKED');
  var rec = eiSessionRecord(current.rebuilt, claimId), pack = current.rebuilt.ctx.packs[rec.record.methodology.key];
  if(att.document.record_hash !== rec.record_hash || att.document.run_hash !== current.run.run_hash || !validRelease(pack) ||
     eiVerifyReport(current.rebuilt.state, att.document.report).status !== 'VERIFIED') throw new Error('STALE_PACKAGE');
  return canonicalize({package_hash: att.package_hash, document: att.document});
}

// ---- Reviewer: provenance anchor over attested packages -----------------------------------
/** Commits the current run state, its engine audit head and the attested reports. NOT_SUBMITTED. */
async function eiSessionAnchor(runId) {
  requireRole('reviewer');
  var current = eiSessionCurrent(runId);
  var attestations = db.ei_attestations.filter(function(a) { return a.run_id === runId; });
  if(!attestations.length) throw new Error('EI_ANCHOR_REQUIRES_ATTESTED_PACKAGE');
  attestations.forEach(function(a) { if(!eiSessionAttestationValid(a)) throw new Error('ATTESTATION_INTEGRITY_BLOCKED'); });
  var label = current.run.owner + '.' + current.run.label, previous = db.ei_anchors.filter(function(x) { return x.label === label; }).slice(-1)[0];
  if(previous && !(sealed(previous, 'record_hash') && eventBinds('ei_anchor', previous.id, {hash: previous.record_hash}))) throw new Error('EI_ANCHOR_INTEGRITY');
  var options = {label: label, audit_log: eiAuditBuild(eiAuditNew(), current.rebuilt.state), reports: attestations.map(function(a) { return a.document.report; })};
  if(previous) options.previous_anchor_hash = previous.anchor.anchor_hash;
  var anchor = eiAnchorPayload(current.rebuilt.state, options);
  var record = seal({id: uid('eianchor'), run_id: runId, run_hash: current.run.run_hash, label: label, attestation_ids: attestations.map(function(a) { return a.id; }).sort(),
    anchor: anchor, call_plan: eiAnchorArguments(anchor), chain_status: 'NOT_SUBMITTED'}, 'record_hash');
  return eiSessionPersist(function() { db.ei_anchors.push(record); audit('ei_anchor', record.id, {hash: record.record_hash}); return record; });
}
function eiSessionVerifyAnchors(owner, label) {
  eiSessionCollections(); requireAudit();
  var full = owner + '.' + label, list = db.ei_anchors.filter(function(x) { return x.label === full; });
  if(!list.length) return {status: 'NONE', anchors: 0};
  var failures = [];
  list.forEach(function(x, i) {
    if(!sealed(x, 'record_hash') || !eventBinds('ei_anchor', x.id, {hash: x.record_hash})) failures.push('RECORD_INTEGRITY:' + i);
    var run = db.ei_runs.find(function(r) { return r.id === x.run_id; });
    if(!run || run.run_hash !== x.run_hash) { failures.push('RUN_MISSING:' + i); return; }
    var atts = db.ei_attestations.filter(function(a) { return x.attestation_ids.indexOf(a.id) >= 0; });
    if(atts.length !== x.attestation_ids.length) { failures.push('ATTESTATION_MISSING:' + i); return; }
    var rebuilt = eiSessionVerifyRun(run);
    var check = eiVerifyAnchor(rebuilt.state, x.anchor, {audit_log: eiAuditBuild(eiAuditNew(), rebuilt.state), reports: atts.map(function(a) { return a.document.report; })});
    if(check.status !== 'VERIFIED') failures.push('ANCHOR_MISMATCH:' + i);
  });
  var chain = eiAnchorChainValid(list.map(function(x) { return x.anchor; }));
  if(chain.status !== 'VALID') failures = failures.concat(chain.failures);
  return {status: failures.length ? 'INVALID' : 'VALID', anchors: list.length, failures: failures, head: list[list.length - 1].anchor.anchor_hash, chain_status: 'NOT_SUBMITTED'};
}
/** Read-only summary for a caller with access. */
function eiSessionSummary(runId) {
  var current = eiSessionCurrent(runId);
  return {run_id: runId, label: current.run.label, owner: current.run.owner, factor_registry: current.run.factor_registry, state_digest: current.run.state_digest,
    history: eiSessionLineage(current.run.owner, current.run.label).runs.map(function(r) { return {run_id: r.id, run_hash: r.run_hash, change: r.change}; }),
    claims: current.run.records.map(function(x) {
      var gate = eiSessionGate(current.run, current.rebuilt, x.claim_id);
      return {claim_id: x.claim_id, status: x.status, record_hash: x.record_hash, outstanding: gate.outstanding, decisions: gate.decisions.length,
        attested: db.ei_attestations.some(function(a) { return a.run_id === runId && a.claim_id === x.claim_id; })};
    })};
}
