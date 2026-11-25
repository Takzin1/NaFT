'use strict';
/**
 * Evidence Intelligence session integration: existing store, actor/role guards and audit
 * chain; individual exception decisions; final research attestation; stale exports;
 * NOT_SUBMITTED anchors over attested packages. Synthetic data only.
 */
const fs = require('fs'), vm = require('vm'), assert = require('assert/strict');
require('../scripts/lib/evidence-intel-load.cjs').loadEvidenceIntel();
for(const name of ['compiler-session', 'evidence-intel-session']) vm.runInThisContext(fs.readFileSync('src/' + name + '.js', 'utf8'), {filename: name + '.js'});

let passed = 0, failed = 0;
function check(value, label) { try { assert.ok(value, label); passed++; } catch(error) { failed++; console.error('FAIL: ' + label); process.exitCode = 1; } }
function eq(a, b, label) { check(canonicalize(a) === canonicalize(b), label + ' (got ' + canonicalize(a).slice(0, 200) + ')'); }
async function blocks(fn, message, label) { try { await fn(); check(false, label + ' did not block'); } catch(e) { check(e.message === message, label + ' (got ' + e.message + ')'); } }
const REASON = 'Synthetic reviewer rationale: inspected the expert case against the synthetic protocol.';
const ATTEST = 'I reviewed the grounded report and evidence hashes; this is a research package, not certification.';
const RELEASE = 'Synthetic engineering Pack reviewed for research use only; no official adoption implied.';
function fresh() { db = seedDB(); actorId = 'operator'; }
function eiClaim(id, variant) {
  const c = syntheticClaim(id, variant); c.activity.methodology_id = 'NAFT-SYNTHETIC-EI'; c.evidence.forEach(function(e) { e.methodology_id = 'NAFT-SYNTHETIC-EI'; }); return c;
}
function portfolio() { return [syntheticClaim('S-STD'), syntheticClaim('S-EXP', 'expert'), syntheticClaim('S-INT', 'intensive_complete'), syntheticClaim('S-UNS', 'unsupported'), eiClaim('S-EI')]; }
async function release(key) { const prev = actorId; setActor('maintainer'); const r = await approveVersionedPack(key, RELEASE); setActor(prev); return r; }
async function releaseEi(key) { const prev = actorId; setActor('maintainer'); const r = await eiSessionApprovePack(key, RELEASE); setActor(prev); return r; }

(async function() {
  // ===== Compile through the guarded session =====
  fresh();
  const run = await eiSessionCompile(portfolio(), {label: 'pilot'});
  eq([run.owner, run.label, run.supersedes, run.records.length, run.formal_certification], ['operator', 'pilot', null, 5, false], 'operator compiles a portfolio run');
  check(eventBinds('ei_run', run.id, {hash: run.run_hash}) && verifyAuditChain().status === 'VALID', 'run is sealed and bound to the existing audit chain');
  eq(run.state_digest, eiStateDigest(eiBuild(portfolio(), eiDefaultContext())), 'stored digest equals an independent engine build');
  check(!('state' in run) && !canonicalize(run).includes('"nodes"'), 'only inputs and hashes are persisted, not a derived state cache');
  eq(run.records.map(function(r) { return [r.claim_id, r.status]; }), [['S-EI', 'AUTO_REEVALUATED'], ['S-EXP', 'HUMAN_REVIEW_REQUIRED'], ['S-INT', 'AUTO_REEVALUATED'], ['S-STD', 'AUTO_REEVALUATED'], ['S-UNS', 'UNSUPPORTED']], 'statuses recorded per Claim');
  await blocks(() => eiSessionCompile(portfolio(), {label: 'pilot'}), 'EI_LABEL_IN_USE_APPLY_CHANGE_INSTEAD', 'a label has one lineage; changes go through apply');
  await blocks(() => eiSessionCompile([syntheticClaim('S-STD')], {label: 'other'}), 'EI_CLAIM_ALREADY_IN_CURRENT_RUN', 'a Claim cannot be in two current runs');
  await blocks(() => eiSessionCompile([syntheticClaim('N-1')], {label: 'bad label'}), 'EI_INVALID_ANCHOR_LABEL', 'invalid label');
  await blocks(() => eiSessionCompile([syntheticClaim('N-1')], {label: 'x', factor_registry: 'mine'}), 'EI_UNKNOWN_FACTOR_REGISTRY', 'only named coefficient registries');
  const before = db.ei_runs.length, beforeEvents = db.audit_events.length;
  await blocks(() => eiSessionCompile([syntheticClaim('N-1'), syntheticClaim('N-1')], {label: 'dup'}), 'EI_DUPLICATE_CLAIM_ID', 'engine validation applies');
  eq([db.ei_runs.length, db.audit_events.length], [before, beforeEvents], 'a failed operation leaves no run or audit event');
  for(const role of ['reviewer', 'maintainer']) { setActor(role); await blocks(() => eiSessionCompile([syntheticClaim('R-1')], {label: 'r'}), 'ROLE_BLOCKED', role + ' cannot compile'); }
  setActor('operator');

  // ===== Access and ownership =====
  db.users.push({id: 'other', name: 'Other operator', role: 'operator', status: 'active'});
  setActor('other');
  await blocks(() => eiSessionSummary(run.id), 'ROLE_BLOCKED', 'another operator cannot read the run');
  await blocks(() => eiSessionApplyChange(run.id, {type: 'activity', activity_id: 'S-STD', patch: {days: 12}}), 'ROLE_BLOCKED', 'another operator cannot change the run');
  await blocks(() => eiSessionCompile([syntheticClaim('S-STD')], {label: 'steal'}), 'ROLE_BLOCKED', 'another operator cannot take over a Claim');
  setActor('maintainer'); await blocks(() => eiSessionSummary(run.id), 'ROLE_BLOCKED', 'maintainer has no run scope');
  setActor('reviewer'); eq(eiSessionSummary(run.id).claims.length, 5, 'reviewer can read');
  setActor('operator'); eq(eiSessionSummary(run.id).claims.find(function(c) { return c.claim_id === 'S-EXP'; }).outstanding, [{code: 'exceptions:expert', status: 'HUMAN_REVIEW_REQUIRED'}], 'owner sees outstanding judgement');

  // ===== Exception decisions =====
  await blocks(() => eiSessionDecide(run.id, 'S-EXP', 'exceptions:expert', 'ACCEPT', REASON), 'ROLE_BLOCKED', 'operator cannot decide exceptions');
  setActor('reviewer');
  await blocks(() => eiSessionDecide(run.id, 'S-UNS', 'unsupported_conditions:special_process', 'ACCEPT', REASON), 'BLOCKING_EXCEPTION_NOT_OVERRIDABLE', 'UNSUPPORTED is not overridable');
  await blocks(() => eiSessionDecide(run.id, 'S-EXP', 'exceptions:expert', 'MAYBE', REASON), 'INVALID_HUMAN_DECISION', 'unknown decision value');
  await blocks(() => eiSessionDecide(run.id, 'S-EXP', 'exceptions:expert', 'ACCEPT', 'too short'), 'EXPLICIT_HUMAN_REASON_REQUIRED', 'reason required');
  await blocks(() => eiSessionDecide(run.id, 'NOPE', 'exceptions:expert', 'ACCEPT', REASON), 'EI_CLAIM_NOT_FOUND', 'unknown Claim');
  const decision = await eiSessionDecide(run.id, 'S-EXP', 'exceptions:expert', 'ACCEPT', REASON);
  eq([decision.record_hash, decision.run_hash, decision.reviewer], [run.records.find(function(r) { return r.claim_id === 'S-EXP'; }).record_hash, run.run_hash, 'reviewer'], 'decision bound to the exact record and run');
  check(eventBinds('ei_decision', decision.id, {hash: decision.decision_hash}), 'decision audited');
  await blocks(() => eiSessionDecide(run.id, 'S-EXP', 'exceptions:expert', 'REJECT', REASON), 'EXCEPTION_ALREADY_DECIDED', 'one decision per exception');

  // ===== Final attestation gates =====
  await blocks(() => eiSessionAttest(run.id, 'S-EXP', ATTEST, true), 'PACK_RELEASE_APPROVAL_REQUIRED', 'Pack release required');
  await release('NAFT-SYNTHETIC@1');
  await blocks(() => eiSessionAttest(run.id, 'S-EXP', ATTEST, false), 'ATTESTATION_ACKNOWLEDGEMENT_REQUIRED', 'explicit acknowledgement');
  await blocks(() => eiSessionAttest(run.id, 'S-EXP', 'short', true), 'EXPLICIT_HUMAN_REASON_REQUIRED', 'attestation reason');
  await blocks(() => eiSessionAttest(run.id, 'S-UNS', ATTEST, true), 'UNRESOLVED_EXCEPTIONS', 'UNSUPPORTED Claim cannot be attested');
  setActor('operator'); await blocks(() => eiSessionAttest(run.id, 'S-STD', ATTEST, true), 'ROLE_BLOCKED', 'operator cannot attest'); setActor('reviewer');
  const attExp = await eiSessionAttest(run.id, 'S-EXP', ATTEST, true), attStd = await eiSessionAttest(run.id, 'S-STD', ATTEST, true);
  eq([attExp.document.status, attExp.document.boundary.formal_certification, attExp.document.boundary.certified_result, attExp.document.boundary.is_credit_certification, attExp.document.decisions.length],
    ['ATTESTED_RESEARCH_PACKAGE', false, null, false, 1], 'attested research package with an explicit non-certification boundary');
  eq(eiVerifyReport(eiSessionVerifyRun(run).state, attExp.document.report).status, 'VERIFIED', 'attested report is grounded in the run');
  await blocks(() => eiSessionAttest(run.id, 'S-EXP', ATTEST, true), 'DUPLICATE_ATTESTATION_BLOCKED', 'duplicate attestation');
  await blocks(() => eiSessionDecide(run.id, 'S-EXP', 'exceptions:expert', 'REJECT', REASON), 'ATTESTED_ACTIVITY_LOCKED', 'attested Claim locked for decisions');
  await blocks(() => eiSessionAttest(run.id, 'S-EI', ATTEST, true), 'PACK_RELEASE_APPROVAL_REQUIRED', 'extended Pack needs its own release');
  await blocks(() => eiSessionApprovePack('NAFT-SYNTHETIC-EI@1', RELEASE), 'ROLE_BLOCKED', 'reviewer cannot release a Pack');
  setActor('maintainer');
  await blocks(() => eiSessionApprovePack('NOPE@1', RELEASE), 'UNSUPPORTED_METHODOLOGY', 'unknown Pack');
  await blocks(() => eiSessionApprovePack('NAFT-SYNTHETIC@1', RELEASE), 'PACK_ALREADY_RELEASED', 'a Pack already released through the legacy path is recognized');
  await blocks(() => eiSessionApprovePack('NAFT-SYNTHETIC-EI@1', 'short'), 'EXPLICIT_HUMAN_REASON_REQUIRED', 'release rationale required');
  setActor('reviewer');
  const eiRelease = await releaseEi('NAFT-SYNTHETIC-EI@1');
  eq([eiRelease.official_adoption_confirmed, eiRelease.scope, validRelease(EI_PACK_REGISTRY['NAFT-SYNTHETIC-EI@1'])], [false, 'research_only', true], 'research release recorded through the existing release check');
  const attEi = await eiSessionAttest(run.id, 'S-EI', ATTEST, true);
  eq(attEi.document.report.statements.find(function(s) { return s.kind === 'calculation'; }).values.result, null, 'exact preview attested with a null result');
  const exported = JSON.parse(eiSessionExport(run.id, 'S-EXP', true));
  eq([exported.package_hash, exported.document.record_hash], [attExp.package_hash, attExp.document.record_hash], 'attested export');
  const draft = JSON.parse(eiSessionExport(run.id, 'S-UNS', false));
  eq([draft.status, draft.certified_result, draft.outstanding.length > 0], ['DRAFT', null, true], 'draft export shows outstanding issues');
  await blocks(() => eiSessionExport(run.id, 'S-UNS', true), 'ATTESTATION_INTEGRITY_BLOCKED', 'no attested export without attestation');

  // ===== Anchor over attested packages =====
  setActor('operator'); await blocks(() => eiSessionAnchor(run.id), 'ROLE_BLOCKED', 'operator cannot anchor'); setActor('reviewer');
  const anchor1 = await eiSessionAnchor(run.id);
  eq([anchor1.chain_status, anchor1.call_plan.chain_status, anchor1.call_plan.value_wei, anchor1.anchor.boundary.transferable, anchor1.anchor.reports.count, anchor1.anchor.previous_anchor_hash],
    ['NOT_SUBMITTED', 'NOT_SUBMITTED', '0', false, 3, null], 'anchor commits the three attested reports; nothing submitted, nothing transferable');
  eq(eiSessionVerifyAnchors('operator', 'pilot').status, 'VALID', 'stored anchor re-verifies by full rebuild');

  // ===== A change supersedes the run; old human work becomes historical =====
  setActor('operator');
  const changed = await eiSessionApplyChange(run.id, {type: 'activity', activity_id: 'S-EXP', patch: {days: 11}});
  eq([changed.run.supersedes, changed.delta.claims.map(function(r) { return r.claim_id; })], [run.run_hash, ['S-EXP']], 'successor run links the previous run');
  await blocks(() => eiSessionExport(run.id, 'S-EXP', true), 'STALE_PACKAGE', 'old attested export is stale after a change');
  await blocks(() => eiSessionApplyChange(run.id, {type: 'activity', activity_id: 'S-STD', patch: {days: 12}}), 'STALE_PACKAGE', 'changes apply only to the current run');
  setActor('reviewer');
  eq(eiSessionSummary(changed.run.id).claims.find(function(c) { return c.claim_id === 'S-EXP'; }).outstanding, [{code: 'exceptions:expert', status: 'HUMAN_REVIEW_REQUIRED'}], 'the earlier ACCEPT does not carry over to the new record');
  await blocks(() => eiSessionAttest(changed.run.id, 'S-EXP', ATTEST, true), 'UNRESOLVED_EXCEPTIONS', 'new run needs a new decision');
  check(db.ei_attestations.some(function(a) { return a.run_id === run.id; }) && db.ei_decisions.some(function(d) { return d.run_id === run.id; }), 'historical decisions and attestations are retained');
  await eiSessionDecide(changed.run.id, 'S-EXP', 'exceptions:expert', 'ACCEPT', REASON);
  await eiSessionAttest(changed.run.id, 'S-EXP', ATTEST, true);
  const anchor2 = await eiSessionAnchor(changed.run.id);
  eq([anchor2.anchor.previous_anchor_hash, anchor2.anchor.reports.count, eiSessionVerifyAnchors('operator', 'pilot').status], [anchor1.anchor.anchor_hash, 1, 'VALID'], 'second anchor chains to the first');
  eq(eiSessionLineage('operator', 'pilot').runs.map(function(r) { return r.id; }), [run.id, changed.run.id], 'lineage ordered');

  // Coefficient registry change through the session
  setActor('operator');
  const corrected = await eiSessionApplyChange(changed.run.id, {type: 'factor_registry', factor_registry: 'with-synthetic-correction'});
  eq([corrected.run.factor_registry, corrected.delta.claims.map(function(r) { return r.claim_id; })], ['with-synthetic-correction', ['S-EI']], 'coefficient correction re-examines only the bound Claim');
  await blocks(() => eiSessionApplyChange(corrected.run.id, {type: 'factor_registry', factor_registry: 'with-synthetic-correction'}), 'EI_FACTOR_REGISTRY_UNCHANGED', 'same registry refused');
  await blocks(() => eiSessionApplyChange(corrected.run.id, {type: 'certify'}), 'EI_UNSUPPORTED_CHANGE_TYPE', 'no certification change type');
  setActor('reviewer'); await blocks(() => eiSessionApplyChange(corrected.run.id, {type: 'activity', activity_id: 'S-STD', patch: {days: 12}}), 'ROLE_BLOCKED', 'reviewer cannot change inputs');

  // ===== Persistence round trip and legacy snapshot =====
  setActor('operator');
  await saveDB(); const saved = JSON.stringify(db); db = null; await loadDB();
  eq(JSON.stringify(db), saved, 'session collections survive a store round trip');
  eq(eiSessionSummary(corrected.run.id).claims.length, 5, 'reloaded run verifies by rebuild');
  setActor('reviewer'); eq(eiSessionVerifyAnchors('operator', 'pilot').status, 'VALID', 'reloaded anchors verify'); setActor('operator');
  const legacy = JSON.parse(saved); EI_SESSION_COLLECTIONS.forEach(function(k) { delete legacy[k]; });
  memoryStore[DB_KEY] = JSON.stringify(legacy); db = null; await loadDB();
  eq(EI_SESSION_COLLECTIONS.map(function(k) { return db[k]; }), [undefined, undefined, undefined, undefined], 'older snapshots load unchanged');
  await eiSessionCompile([syntheticClaim('L-1')], {label: 'legacy'});
  eq(EI_SESSION_COLLECTIONS.map(function(k) { return Array.isArray(db[k]); }), [true, true, true, true], 'collections initialize on first use');
  db.ei_runs = {}; await blocks(() => eiSessionCompile([syntheticClaim('L-2')], {label: 'x'}), 'EI_INVALID_SESSION_DATASET', 'malformed collection refused');

  // ===== Tamper and integrity =====
  async function tampered(mutate, message, label) {
    fresh(); const r = await eiSessionCompile(portfolio(), {label: 't'}); mutate(r);
    await blocks(() => eiSessionSummary(r.id), message, label);
  }
  await tampered(function(r) { r.claim_inputs[0].field.area_ha = 99; }, 'EI_RUN_INTEGRITY', 'edited stored input detected');
  await tampered(function(r) { r.claim_inputs[0].field.area_ha = 99; delete r.run_hash; seal(r, 'run_hash'); }, 'EI_RUN_INTEGRITY', 're-sealed edited input detected through the audit binding');
  await tampered(function(r) { r.records[0].status = 'AUTO_REEVALUATED'; r.records[0].record_hash = '0'.repeat(64); }, 'EI_RUN_INTEGRITY', 'edited stored record hash detected');
  await tampered(function(r) { r.claim_inputs[0].field.area_ha = 99; const body = eiSessionRunBody(r.owner, r.label, r.factor_registry, eiBuild(r.claim_inputs, eiDefaultContext()), null, null, null); Object.assign(r, body); delete r.run_hash; seal(r, 'run_hash'); }, 'EI_RUN_INTEGRITY', 'fully recomputed forged run still fails the audit binding');
  await tampered(function() { db.audit_events[0].payload.hash = '0'.repeat(64); }, 'AUDIT_CHAIN_BROKEN', 'broken audit chain blocks reads');
  await tampered(function(r) { db.ei_runs.push(Object.assign(clone(r), {id: 'eirun_fork'})); }, 'EI_RUN_LINEAGE_CONFLICT', 'forked lineage detected');
  fresh(); await release('NAFT-SYNTHETIC@1');
  const r2 = await eiSessionCompile([syntheticClaim('T-1'), syntheticClaim('T-2', 'expert')], {label: 't2'}); setActor('reviewer');
  const d2 = await eiSessionDecide(r2.id, 'T-2', 'exceptions:expert', 'ACCEPT', REASON);
  d2.decision = 'REJECT';
  await blocks(() => eiSessionAttest(r2.id, 'T-2', ATTEST, true), 'DECISION_INTEGRITY_BLOCKED', 'edited decision detected');
  d2.decision = 'ACCEPT';
  const a2 = await eiSessionAttest(r2.id, 'T-2', ATTEST, true);
  a2.document.attestation.note += ' edited';
  await blocks(() => eiSessionExport(r2.id, 'T-2', true), 'ATTESTATION_INTEGRITY_BLOCKED', 'edited attested document detected');
  a2.document.attestation.note = ATTEST;
  db.users.find(function(u) { return u.id === 'reviewer'; }).status = 'inactive';
  await blocks(() => eiSessionExport(r2.id, 'T-2', true), 'ROLE_BLOCKED', 'inactive reviewer cannot export');
  db.users.find(function(u) { return u.id === 'reviewer'; }).status = 'active';
  db.pack_releases[0].note += ' edited';
  await blocks(() => eiSessionExport(r2.id, 'T-2', true), 'STALE_PACKAGE', 'tampered Pack release makes the attested export stale');
  db.pack_releases[0].note = RELEASE;
  const anchored = await eiSessionAnchor(r2.id);
  anchored.anchor.boundary.transferable = true;
  eq(eiSessionVerifyAnchors('operator', 't2').status, 'INVALID', 'edited stored anchor detected');
  await blocks(() => eiSessionAnchor(r2.id), 'EI_ANCHOR_INTEGRITY', 'cannot chain onto a tampered anchor');
  fresh(); await eiSessionCompile([syntheticClaim('U-1')], {label: 'u'}); setActor('reviewer');
  await blocks(() => eiSessionAnchor(db.ei_runs[0].id), 'EI_ANCHOR_REQUIRES_ATTESTED_PACKAGE', 'anchors only cover attested packages');

  // ===== Records written by a faulty writer: bindings valid, content stale =====
  // These bypass the session API on purpose: each simulates a writer that sealed and audited
  // a record whose content no longer matches what the engine derives from the stored inputs.
  fresh(); await release('NAFT-SYNTHETIC@1');
  const w = await eiSessionCompile([syntheticClaim('W-1'), syntheticClaim('W-2', 'expert')], {label: 'w'}); setActor('reviewer');
  const staleDecision = {id: uid('eidecision'), run_id: w.id, run_hash: w.run_hash, claim_id: 'W-2', record_hash: '0'.repeat(64), exception_code: 'exceptions:expert', reviewer: 'reviewer', reason: REASON, decision: 'ACCEPT'};
  staleDecision.decision_hash = hashObject(eiSessionDecisionBinding(staleDecision));
  db.ei_decisions.push(staleDecision); audit('ei_decision', staleDecision.id, {hash: staleDecision.decision_hash});
  await blocks(() => eiSessionAttest(w.id, 'W-2', ATTEST, true), 'STALE_REVIEW', 'a decision bound to another record is stale even with a valid audit binding');
  db.ei_decisions.pop();
  const att = await eiSessionAttest(w.id, 'W-1', ATTEST, true), forgedDoc = clone(att.document); forgedDoc.record_hash = '0'.repeat(64);
  const forgedAtt = seal({id: uid('eiattestation'), run_id: w.id, claim_id: 'W-1', document: forgedDoc, package_hash: hashObject(forgedDoc)}, 'attestation_hash');
  db.ei_attestations.splice(db.ei_attestations.indexOf(att), 1, forgedAtt); audit('ei_attested', forgedAtt.id, {hash: forgedAtt.attestation_hash});
  await blocks(() => eiSessionExport(w.id, 'W-1', true), 'STALE_PACKAGE', 'an attestation naming another record is stale even with a valid audit binding');
  setActor('operator');
  const wrongRun = seal(Object.assign({id: uid('eirun')}, eiSessionRunBody('operator', 'w-wrong', 'default', eiBuild([syntheticClaim('W-3')], eiDefaultContext()), null, null, null)), 'run_hash');
  wrongRun.records[0].status = 'AUTO_REEVALUATED_EDITED'; delete wrongRun.run_hash; seal(wrongRun, 'run_hash');
  db.ei_runs.push(wrongRun); audit('ei_run', wrongRun.id, {hash: wrongRun.run_hash});
  await blocks(() => eiSessionSummary(wrongRun.id), 'EI_RUN_INTEGRITY', 'stored records that differ from the rebuild are refused even with a valid audit binding');

  const secondRoot = seal(Object.assign({id: uid('eirun')}, eiSessionRunBody('operator', 'w', 'default', eiBuild([syntheticClaim('W-9')], eiDefaultContext()), null, null, null)), 'run_hash');
  db.ei_runs.push(secondRoot); audit('ei_run', secondRoot.id, {hash: secondRoot.run_hash});
  await blocks(() => eiSessionSummary(w.id), 'EI_RUN_LINEAGE_CONFLICT', 'a second independent root for the same label is a lineage conflict');

  // ===== Store failure rolls back =====
  fresh();
  const originalSet = store.set, runsBefore = db.ei_runs ? db.ei_runs.length : 0, eventsBefore = db.audit_events.length, headBefore = db.audit_head;
  store.set = async function() { throw new Error('STORE_WRITE_FAILED'); };
  try { await blocks(() => eiSessionCompile([syntheticClaim('F-1')], {label: 'f'}), 'STORE_WRITE_FAILED', 'store failure surfaces'); }
  finally { store.set = originalSet; }
  eq([(db.ei_runs || []).length, db.audit_events.length, db.audit_head, verifyAuditChain().status], [runsBefore, eventsBefore, headBefore, 'VALID'], 'a failed save leaves no run and no audit event');
  check(eiSessionLineage('operator', 'f').current === null, 'no lineage after a failed save');

  // ===== Static boundaries =====
  const source = fs.readFileSync('src/evidence-intel-session.js', 'utf8');
  check(!/localStorage|indexedDB|fetch\(|XMLHttpRequest|sendTransaction|signTransaction|window\.ethereum/.test(source), 'session adapter uses only the existing store adapter and sends nothing');
  check(!/eiExplanationContext|eiTemplateExplanation|eiValidateExternalExplanation|EI_EXPLANATION/.test(source), 'session adapter does not use the explanation module');
  check(/db\.ei_runs\.push[\s\S]*audit\('ei_run'/.test(source) && /db\.ei_decisions\.push[\s\S]*audit\('ei_decision'/.test(source) && /db\.ei_attestations\.push[\s\S]*audit\('ei_attested'/.test(source) && /db\.ei_anchors\.push[\s\S]*audit\('ei_anchor'/.test(source), 'every stored record is paired with an audit event');

  console.log('EVIDENCE INTEL SESSION RESULT: ' + passed + ' passed, ' + failed + ' failed');
  if(failed) process.exit(1);
})().catch(function(error) { console.error(error); process.exit(1); });
