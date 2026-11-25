'use strict';
/**
 * Non-transferable provenance anchoring: Merkle commitments, anchor payloads, prepared
 * call arguments, caller-supplied observations, anchor chains and the "no token" boundary.
 */
const fs = require('fs'), assert = require('assert/strict');
require('../scripts/lib/evidence-intel-load.cjs').loadEvidenceIntel();

let passed = 0, failed = 0;
function check(value, label) { try { assert.ok(value, label); passed++; } catch(error) { failed++; console.error('FAIL: ' + label); process.exitCode = 1; } }
function eq(a, b, label) { check(canonicalize(a) === canonicalize(b), label + ' (got ' + canonicalize(a).slice(0, 200) + ')'); }
function blocks(fn, message, label) { try { fn(); check(false, label + ' did not block'); } catch(e) { check(e.message === message, label + ' (got ' + e.message + ')'); } }
function reseal(anchor) { const x = clone(anchor); delete x.anchor_hash; return Object.assign(x, {anchor_hash: hashObject(x)}); }
const ctx = eiDefaultContext();
const claims = Array.from({length: 25}, function(_, i) { return syntheticClaim('AN-' + String(i + 1).padStart(2, '0'), ['standard', 'intensive', 'intensive_complete', 'expert', 'unsupported'][i % 5]); });
const state = eiBuild(claims, ctx);

// ===== Merkle commitments =====================================================================
(function merkle() {
  const leaves = Array.from({length: 17}, function(_, i) { return digestText('leaf-' + i); });
  for(var n = 1; n <= leaves.length; n++) {
    const xs = leaves.slice(0, n), root = eiMerkleRoot(xs);
    check(xs.every(function(leaf, i) { return eiMerkleVerify(leaf, eiMerkleProof(xs, i), root); }), 'every inclusion proof verifies for ' + n + ' leaves');
  }
  const xs = leaves.slice(0, 7), root = eiMerkleRoot(xs), proof = eiMerkleProof(xs, 3);
  check(!eiMerkleVerify(xs[4], proof, root), 'proof of one leaf does not verify another');
  check(!eiMerkleVerify(xs[3], proof.map(function(s) { return {side: s.side === 'left' ? 'right' : 'left', hash: s.hash}; }), root), 'swapped sides fail');
  check(!eiMerkleVerify(xs[3], proof.slice(1), root), 'truncated path fails');
  check(!eiMerkleVerify(xs[3], proof.concat([{side: 'left', hash: xs[0]}]), root), 'extended path fails');
  check(!eiMerkleVerify(xs[3], [{side: 'up', hash: xs[0]}], root), 'unknown side fails');
  check(eiMerkleRoot(leaves.slice(0, 3)) !== eiMerkleRoot(leaves.slice(0, 3).concat([leaves[2]])), 'odd node promotion: duplicating the last leaf changes the root');
  check(eiMerkleRoot([leaves[0], leaves[1]]) !== eiMerkleRoot([leaves[1], leaves[0]]), 'leaf order is committed');
  check(eiMerkleRoot([eiMerkleNode(eiMerkleLeaf(leaves[0]), eiMerkleLeaf(leaves[1]))]) !== eiMerkleRoot([leaves[0], leaves[1]]), 'an inner node cannot pose as a leaf (domain separation)');
  eq(eiMerkleRoot([]), digestText('naft-merkle-empty'), 'empty tree has a fixed root');
  blocks(function() { eiMerkleRoot(['not-a-hash']); }, 'EI_INVALID_MERKLE_LEAF', 'invalid leaf refused');
  blocks(function() { eiMerkleProof(xs, 7); }, 'EI_INVALID_MERKLE_INDEX', 'out-of-range proof refused');
})();

// ===== Anchor payload ========================================================================
const anchor = eiAnchorPayload(state);
(function payload() {
  eq([anchor.schema, anchor.claims.count, anchor.previous_anchor_hash, anchor.audit, anchor.reports], [EI_ANCHOR_SCHEMA, 25, null, null, null], 'anchor commits to every Claim');
  eq(anchor.boundary, {transferable: false, value_bearing: false, represents_quantity: false, token: null, formal_certification: false, certified_result: null, carbon_credit_issued: false,
    statement: 'Provenance witness only. Not a token, not a carbon credit, not a certification and not a GHG inventory.'}, 'boundary is fixed: no token, no value, no quantity, no certification');
  eq(anchor.state_digest, eiStateDigest(state), 'anchor binds the state digest');
  eq(eiAnchorPayload(eiBuild(claims.slice().reverse(), ctx)), anchor, 'anchor independent of Claim order');
  eq(eiAnchorPayload(eiBuild(clone(claims), ctx)), anchor, 'anchor reproducible');
  check(eiVerifyAnchorIntegrity(anchor).status === 'VALID' && eiVerifyAnchor(state, anchor).status === 'VERIFIED', 'anchor verifies against its state');
  // No numbers other than counts, and no field that could carry a quantity or ownership.
  const numbers = [];
  (function walk(v, path) {
    if(typeof v === 'number') numbers.push(path);
    else if(v && typeof v === 'object') Object.keys(v).forEach(function(k) { walk(v[k], path + '.' + k); });
  })(eiAnchorPayload(state, {audit_log: eiAuditBuild(eiAuditNew(), state), reports: [eiClaimReport(state, 'AN-01')]}), '');
  eq(numbers.sort(), ['.audit.entries', '.claims.count', '.reports.count'], 'the only numbers in an anchor are counts');
  const keys = [];
  (function walk(v) { if(v && typeof v === 'object') Object.keys(v).forEach(function(k) { keys.push(k); walk(v[k]); }); })(Object.assign({}, anchor, {boundary: null}));
  check(!keys.some(function(k) { return /preview|exact|total|amount|balance|price|quantity|supply|owner|holder|transfer|wallet|address/i.test(k); }), 'no quantity, balance, price, owner or transfer field outside the fixed boundary');
  check(!/"(exact|arithmetic_preview|preview_total)"/.test(canonicalize(anchor)), 'no calculation preview leaks into the anchor');
  // Options
  blocks(function() { eiAnchorPayload(state, {token_supply: 100}); }, 'EI_UNKNOWN_ANCHOR_OPTION:token_supply', 'unknown option (e.g. a supply) refused');
  blocks(function() { eiAnchorPayload(state, {value: '1'}); }, 'EI_UNKNOWN_ANCHOR_OPTION:value', 'value option refused');
  blocks(function() { eiAnchorPayload(state, {label: 'has space'}); }, 'EI_INVALID_ANCHOR_LABEL', 'invalid label refused');
  blocks(function() { eiAnchorPayload(state, {previous_anchor_hash: 'abc'}); }, 'EI_INVALID_PREVIOUS_ANCHOR', 'invalid previous anchor refused');
  blocks(function() { eiAnchorPayload({}); }, 'EI_INVALID_STATE', 'invalid state refused');
  const log = eiAuditBuild(eiAuditNew(), state), withAudit = eiAnchorPayload(state, {audit_log: log});
  eq(withAudit.audit, {head: log.head, entries: log.entries.length}, 'audit head committed');
  check(withAudit.anchor_hash !== anchor.anchor_hash, 'committing the audit head changes the anchor');
  const brokenLog = clone(log); brokenLog.entries[2].payload.status = 'TAMPERED';
  blocks(function() { eiAnchorPayload(state, {audit_log: brokenLog}); }, 'EI_AUDIT_LOG_NOT_VALID', 'tampered audit log refused');
  const otherState = eiBuild(claims.slice(1), ctx);
  blocks(function() { eiAnchorPayload(state, {audit_log: eiAuditBuild(eiAuditNew(), otherState)}); }, 'EI_AUDIT_LOG_DOES_NOT_MATCH_STATE', 'audit log of another state refused');
  const report = eiClaimReport(state, 'AN-02');
  eq(eiAnchorPayload(state, {reports: [report]}).reports, {root: eiMerkleRoot([report.report_hash]), count: 1}, 'report hashes committed');
  blocks(function() { eiAnchorPayload(state, {reports: [report, report]}); }, 'EI_DUPLICATE_ANCHOR_REPORT', 'duplicate report refused');
  const forged = clone(report); forged.statements[0].text = 'edited';
  blocks(function() { eiAnchorPayload(state, {reports: [forged]}); }, 'EI_REPORT_NOT_VERIFIED:AN-02', 'unverified report refused');
  blocks(function() { eiAnchorPayload(state, {reports: []}); }, 'EI_INVALID_ANCHOR_REPORTS', 'empty report list refused');
})();

// ===== Change sensitivity, verification and tampering ==========================================
(function verification() {
  const target = claims[0], meta = clone(target.evidence[0]); meta.source = 'urn:naft:anchor-test';
  const provenanceOnly = eiApplyChange(state, {type: 'evidence', activity_id: target.activity.id, evidence_id: meta.id, replacement: meta}, ctx);
  eq(provenanceOnly.delta.claims[0].classification, 'PROVENANCE_ONLY', 'fixture: provenance-only change');
  check(eiAnchorPayload(provenanceOnly.state).claims.root !== anchor.claims.root, 'even a provenance-only change moves the Claim root');
  const semantic = eiApplyChange(state, {type: 'activity', activity_id: target.activity.id, patch: {days: 5}}, ctx);
  eq(eiVerifyAnchor(semantic.state, anchor).failures, ['DIFFERS:state_digest', 'DIFFERS:claims'], 'old anchor no longer verifies after a semantic change');
  const noop = eiApplyChange(state, {type: 'evidence', activity_id: target.activity.id, evidence_id: target.evidence[0].id, replacement: clone(target.evidence[0])}, ctx);
  eq(eiAnchorPayload(noop.state).anchor_hash, anchor.anchor_hash, 'a no-op change keeps the anchor');
  var t = clone(anchor); t.state_digest = '0'.repeat(64);
  eq(eiVerifyAnchorIntegrity(t).failures, ['ANCHOR_HASH_MISMATCH'], 'edited anchor detected');
  t = clone(anchor); t.boundary.transferable = true;
  eq(eiVerifyAnchorIntegrity(reseal(t)).failures, ['BOUNDARY_ALTERED'], 're-sealed anchor claiming transferability rejected');
  t = clone(anchor); t.boundary.represents_quantity = true;
  eq(eiVerifyAnchor(state, reseal(t)).status, 'MISMATCH', 're-sealed anchor claiming a quantity rejected');
  t = clone(anchor); t.boundary.certified_result = '100';
  eq(eiVerifyAnchorIntegrity(reseal(t)).failures, ['BOUNDARY_ALTERED'], 're-sealed anchor claiming a certified result rejected');
  t = clone(anchor); delete t.boundary.token;
  eq(eiVerifyAnchorIntegrity(reseal(t)).failures, ['BOUNDARY_ALTERED'], 'removing a boundary field rejected');
  t = clone(anchor); t.token_supply = 1000;
  eq(eiVerifyAnchorIntegrity(reseal(t)).failures, ['UNEXPECTED_FIELD:token_supply'], 'an added supply field rejected');
  t = clone(anchor); t.owner = '0x' + '1'.repeat(40);
  eq(eiVerifyAnchorIntegrity(reseal(t)).failures, ['UNEXPECTED_FIELD:owner'], 'an added owner field rejected');
  eq(eiVerifyAnchorIntegrity(null).status, 'INVALID', 'null anchor invalid');
  const log = eiAuditBuild(eiAuditNew(), state), withAudit = eiAnchorPayload(state, {audit_log: log});
  eq(eiVerifyAnchor(state, withAudit, {audit_log: log}).status, 'VERIFIED', 'anchor with audit head verifies with the same log');
  eq(eiVerifyAnchor(state, withAudit).failures, ['DIFFERS:audit'], 'verification without the committed log reports the difference');
})();

// ===== Inclusion proofs ======================================================================
(function proofs() {
  check(claims.every(function(c) { const p = eiAnchorClaimProof(state, c.activity.id); return eiVerifyClaimProof(p, anchor).status === 'INCLUDED'; }), 'every Claim record has a verifying inclusion proof');
  const proof = eiAnchorClaimProof(state, 'AN-07');
  eq(proof.leaf_preimage, {claim_id: 'AN-07', pack_key: 'NAFT-SYNTHETIC@1', record_hash: state.claims['AN-07'].record_hash, semantic_hash: state.claims['AN-07'].semantic_hash, status: state.claims['AN-07'].status}, 'proof discloses hashes and status only');
  var t = clone(proof); t.leaf_preimage.status = 'TAMPERED';
  check(eiVerifyClaimProof(t, anchor).failures.includes('LEAF_PREIMAGE_MISMATCH'), 'edited status in a proof detected');
  t = clone(proof); t.path[0].hash = '0'.repeat(64);
  check(eiVerifyClaimProof(t, anchor).failures.includes('MERKLE_PATH_INVALID'), 'edited path detected');
  const changed = eiApplyChange(state, {type: 'activity', activity_id: 'AN-01', patch: {days: 5}}, ctx);
  check(eiVerifyClaimProof(eiAnchorClaimProof(changed.state, 'AN-07'), anchor).failures.includes('ROOT_NOT_IN_ANCHOR'), 'a proof from a later state does not match an older anchor');
  eq(eiVerifyClaimProof(proof).status, 'INCLUDED', 'a proof can be checked against its own root without the anchor');
  blocks(function() { eiAnchorClaimProof(state, 'NOPE'); }, 'EI_CLAIM_NOT_FOUND', 'unknown Claim refused');
  eq(eiVerifyClaimProof({}).status, 'INVALID', 'invalid proof');
})();

// ===== Prepared call arguments and caller-supplied observations ===================================
(function callPlan() {
  const plan = eiAnchorArguments(anchor);
  eq([plan.contract, plan.function, plan.value_wei, plan.chain_status, plan.arguments.length], ['NaFTMRVAnchor', 'anchorPackage(bytes32,bytes32,bytes32,bytes32)', '0', 'NOT_SUBMITTED', 4], 'call plan shape');
  check(fs.readFileSync('src/climatechain-demo.js', 'utf8').indexOf("function:'" + plan.function + "'") > 0, 'same function signature as the existing ClimateChain anchor plan');
  check(plan.arguments.every(function(a) { return /^0x[a-f0-9]{64}$/.test(a); }), 'arguments are bytes32 hex');
  eq(plan.arguments.slice(1), ['0x' + anchor.anchor_hash, '0x' + anchor.factor_registry_hash, '0x' + '0'.repeat(64)], 'first anchor links to zero');
  eq(plan.boundary, anchor.boundary, 'call plan carries the same boundary');
  blocks(function() { eiAnchorArguments({}); }, 'EI_INVALID_ANCHOR', 'invalid anchor refused');
  const observed = {chain_id: 11155111, contract_address: '0x1B7a3d1217Ffe5Ddd7d80E9734CeB6E32d4293B0', tx_hash: '0x' + 'ab'.repeat(32), function: plan.function, value_wei: '0', arguments: plan.arguments.slice()};
  const match = eiVerifyObservedAnchor(anchor, observed);
  eq([match.status, match.source], ['MATCH', 'CALLER_SUPPLIED_OBSERVATION_NOT_FETCHED'], 'matching observation; nothing fetched');
  check(/does not establish that the transaction exists/.test(match.meaning), 'MATCH is explicitly not proof of existence or truth');
  eq(eiVerifyObservedAnchor(anchor, Object.assign({}, observed, {arguments: observed.arguments.map(function(a) { return a.toUpperCase().replace('0X', '0x'); })})).status, 'MATCH', 'hex case ignored');
  function fails(patch, code, label) { check(eiVerifyObservedAnchor(anchor, Object.assign({}, observed, patch)).failures.includes(code), label); }
  fails({value_wei: '1'}, 'VALUE_TRANSFER_NOT_ALLOWED', 'a call carrying value is refused');
  fails({value_wei: 1}, 'VALUE_TRANSFER_NOT_ALLOWED', 'numeric value refused');
  fails({function: 'transfer(address,uint256)'}, 'FUNCTION_MISMATCH', 'a transfer call is not an anchor');
  fails({arguments: [observed.arguments[0], observed.arguments[1], observed.arguments[2], '0x' + '1'.repeat(64)]}, 'ARGUMENT_MISMATCH:3', 'wrong previous link detected');
  fails({arguments: observed.arguments.slice(0, 3)}, 'ARGUMENTS_REQUIRED', 'missing argument detected');
  fails({contract_address: '0x' + '0'.repeat(40)}, 'CONTRACT_ADDRESS_INVALID', 'zero address refused');
  fails({tx_hash: '0x12'}, 'TX_HASH_INVALID', 'invalid tx hash refused');
  fails({chain_id: 0}, 'CHAIN_ID_REQUIRED', 'chain id required');
  eq(eiVerifyObservedAnchor(anchor, null).status, 'MISMATCH', 'observation required');
})();

// ===== Anchor chain and audit ==================================================================
(function chain() {
  const a1 = eiAnchorPayload(state);
  const s2 = eiApplyChange(state, {type: 'activity', activity_id: 'AN-02', patch: {days: 12}}, ctx).state, a2 = eiAnchorPayload(s2, {previous_anchor_hash: a1.anchor_hash});
  const s3 = eiApplyChange(s2, {type: 'methodology', old_key: 'NAFT-SYNTHETIC@1', new_key: 'NAFT-SYNTHETIC@2'}, ctx).state, a3 = eiAnchorPayload(s3, {previous_anchor_hash: a2.anchor_hash});
  eq(eiAnchorChainValid([a1, a2, a3]).status, 'VALID', 'three anchors over successive changes form a valid chain');
  eq(eiAnchorArguments(a3).arguments[3], '0x' + a2.anchor_hash, 'successor call links the previous anchor');
  check(eiAnchorChainValid([a1, a3]).failures.includes('LINK_BROKEN:1'), 'a skipped anchor breaks the chain');
  check(eiAnchorChainValid([a2, a1, a3]).failures.length > 0, 'reordered chain invalid');
  check(eiAnchorChainValid([a1, eiAnchorPayload(s2, {previous_anchor_hash: a1.anchor_hash, label: 'other'})]).failures.includes('LABEL_CHANGED:1'), 'label cannot change within a chain');
  eq(eiAnchorChainValid([]).status, 'INVALID', 'empty chain invalid');
  eq([eiVerifyAnchor(s3, a3).status, eiVerifyAnchor(s2, a2).status, eiVerifyAnchor(s3, a2).status], ['VERIFIED', 'VERIFIED', 'MISMATCH'], 'each anchor verifies only against its own state');
  const log = eiAuditAnchor(eiAuditBuild(eiAuditNew(), state), a1, {actor: 'operator'});
  const entry = log.entries[log.entries.length - 1];
  eq([entry.type, entry.payload.anchor_hash, entry.payload.chain_status, entry.payload.transferable, entry.payload.value_bearing, eiAuditVerify(log).status], ['ANCHOR', a1.anchor_hash, 'NOT_SUBMITTED', false, false, 'VALID'], 'anchor preparation is logged');
  const bad = clone(a1); bad.state_digest = '0'.repeat(64);
  blocks(function() { eiAuditAnchor(log, bad); }, 'EI_INVALID_ANCHOR', 'an invalid anchor cannot be logged');
})();

// ===== API =========================================================================================
(function api() {
  const body = {claims: claims.slice(0, 5)};
  const made = eiApiHandle({method: 'POST', path: '/v1/anchor/payload', body: body});
  eq([made.status, made.body.data.call_plan.chain_status, made.body.data.anchor.boundary.transferable], [200, 'NOT_SUBMITTED', false], 'payload route');
  eq(eiApiHandle({method: 'POST', path: '/v1/anchor/payload', body: clone(body)}).body.data_hash, made.body.data_hash, 'payload route deterministic');
  const withAll = eiApiHandle({method: 'POST', path: '/v1/anchor/payload', body: Object.assign({include_audit: true, include_reports: true, label: 'pilot-1'}, body)}).body.data.anchor;
  eq([withAll.label, withAll.reports.count, withAll.audit.entries], ['pilot-1', 5, 15], 'audit head and reports rebuilt server-side from the Claims');
  const verified = eiApiHandle({method: 'POST', path: '/v1/anchor/verify', body: Object.assign({anchor: withAll, include_audit: true, include_reports: true}, body)}).body.data;
  eq(verified.recomputation.status, 'VERIFIED', 'verify route recomputes the anchor');
  const changed = clone(body); changed.claims[0].activity.days = 5;
  eq(eiApiHandle({method: 'POST', path: '/v1/anchor/verify', body: Object.assign({anchor: withAll, include_audit: true, include_reports: true}, changed)}).body.data.recomputation.status, 'MISMATCH', 'verify route detects changed Claims');
  const plan = made.body.data.call_plan, observed = {chain_id: 11155111, contract_address: '0x1B7a3d1217Ffe5Ddd7d80E9734CeB6E32d4293B0', tx_hash: '0x' + 'cd'.repeat(32), function: plan.function, arguments: plan.arguments};
  eq(eiApiHandle({method: 'POST', path: '/v1/anchor/verify', body: Object.assign({anchor: made.body.data.anchor, observed: observed}, body)}).body.data.observation.status, 'MATCH', 'verify route compares a caller-supplied observation');
  const proof = eiApiHandle({method: 'POST', path: '/v1/anchor/proof', body: Object.assign({claim_id: body.claims[2].activity.id}, body)}).body.data;
  eq([proof.verification.status, proof.anchor_hash], ['INCLUDED', made.body.data.anchor.anchor_hash], 'proof route');
  eq(eiApiHandle({method: 'POST', path: '/v1/anchor/payload', body: Object.assign({token_supply: 1}, body)}).body.data.anchor.anchor_hash, made.body.data.anchor.anchor_hash, 'API ignores fields it does not define; no supply can be injected');
  eq(eiApiHandle({method: 'POST', path: '/v1/anchor/payload', body: Object.assign({label: 'bad label'}, body)}).body.error.code, 'EI_INVALID_ANCHOR_LABEL', 'invalid label through the API');
  check(Object.keys(EI_API_HANDLERS).every(function(route) { return !/transfer|mint|trade|swap|order|wallet|sign|submit|send/i.test(route); }), 'API has no transfer, mint, trade, wallet, signing or submission route');
})();

// ===== Static boundaries =========================================================================
(function staticBoundaries() {
  const source = fs.readFileSync('src/evidence-intel-anchor.js', 'utf8');
  check(!/Date\.now|new Date\(|Math\.random|setTimeout|XMLHttpRequest|localStorage|document\./.test(source), 'anchor module is pure: no clock, randomness, network or DOM');
  check(!/sendTransaction|signTransaction|eth_|ethereum\.request|window\.ethereum|personal_sign/.test(source), 'anchor module contains no transaction or signing call');
  check(!/eiExplanationContext|eiTemplateExplanation|eiValidateExternalExplanation|EI_EXPLANATION/.test(source), 'anchor module does not reference the explanation module');
  const runtime = fs.readdirSync('src').filter(function(f) { return /\.(js|mjs)$/.test(f); }).map(function(f) { return fs.readFileSync('src/' + f, 'utf8'); }).join('\n') + fs.readFileSync('naft-app.html', 'utf8');
  check(!/function\s+transfer|ERC-?20|ERC-?721|ERC-?1155|\bmint\(|sendTransaction|signTransaction|window\.ethereum|eth_send/i.test(runtime), 'no runtime source implements a token, transfer, mint or transaction submission');
  const license = fs.readFileSync('LICENSE', 'utf8');
  check(/must not be modified to implement,\s+real payment\s+processing,\s+exchangeable tokens,\s+or trading of certified carbon credits\s+without prior legal review/.test(license), 'LICENSE boundary on exchangeable tokens is unchanged');
  check(/financial operations/.test(fs.readFileSync('AGENTS.md', 'utf8')), 'AGENTS.md boundary on financial operations is unchanged');
})();

console.log('EVIDENCE INTEL ANCHOR RESULT: ' + passed + ' passed, ' + failed + ' failed');
if(failed) process.exit(1);
