'use strict';
/**
 * NaFT Evidence Intelligence — non-transferable provenance anchoring.
 *
 * Builds a deterministic anchor payload that commits to an engine state (every Claim's
 * record hash in a Merkle tree), optionally the head of the typed audit log and a set
 * of grounded reports, and links to the previous anchor. It prepares bytes32 arguments
 * in the shape of the existing NaFTMRVAnchor.anchorPackage(bytes32,bytes32,bytes32,bytes32)
 * call, and verifies a caller-supplied observation of such a call.
 *
 * Boundaries enforced by construction and by eiVerifyAnchor():
 * - no token, no balance, no transfer, no price and no quantity of any kind;
 * - no transaction is sent, no network is used, no signing secret is handled;
 * - an anchor witnesses that some bytes existed; it does not certify climate truth,
 *   methodology eligibility, registry acceptance or credit issuance.
 *
 * Requires the engine, report and audit modules. Pure; no clock.
 */
var EI_ANCHOR_SCHEMA = 'naft-provenance-anchor-1';
var EI_ANCHOR_CONTRACT_FUNCTION = 'anchorPackage(bytes32,bytes32,bytes32,bytes32)';
var EI_ANCHOR_ZERO = '0'.repeat(64);
var EI_ANCHOR_BOUNDARY = Object.freeze({
  transferable: false, value_bearing: false, represents_quantity: false, token: null,
  formal_certification: false, certified_result: null, carbon_credit_issued: false,
  statement: 'Provenance witness only. Not a token, not a carbon credit, not a certification and not a GHG inventory.'
});
var EI_ANCHOR_BOUNDARY_KEYS = Object.keys(EI_ANCHOR_BOUNDARY).sort();

function eiHex64(x) { return typeof x === 'string' && /^[a-f0-9]{64}$/.test(x); }
// Domain-separated binary Merkle tree. An odd node is promoted unchanged rather than
// duplicated, so two different leaf lists cannot share a root by duplication.
function eiMerkleLeaf(hex) { if(!eiHex64(hex)) eiFail('INVALID_MERKLE_LEAF'); return digestText('naft-merkle-leaf:' + hex); }
function eiMerkleNode(left, right) { return digestText('naft-merkle-node:' + left + right); }
function eiMerkleLevels(leafHashes) {
  var level = leafHashes.map(eiMerkleLeaf), levels = [level];
  while(level.length > 1) {
    var next = [];
    for(var i = 0; i < level.length; i += 2) next.push(i + 1 < level.length ? eiMerkleNode(level[i], level[i + 1]) : level[i]);
    levels.push(next); level = next;
  }
  return levels;
}
function eiMerkleRoot(leafHashes) {
  if(!Array.isArray(leafHashes)) eiFail('INVALID_MERKLE_LEAVES');
  if(!leafHashes.length) return digestText('naft-merkle-empty');
  var levels = eiMerkleLevels(leafHashes);
  return levels[levels.length - 1][0];
}
function eiMerkleProof(leafHashes, index) {
  if(!Number.isInteger(index) || index < 0 || index >= leafHashes.length) eiFail('INVALID_MERKLE_INDEX');
  var levels = eiMerkleLevels(leafHashes), path = [], i = index;
  for(var d = 0; d < levels.length - 1; d++) {
    var level = levels[d], sibling = i % 2 ? i - 1 : i + 1;
    if(sibling < level.length) path.push({side: i % 2 ? 'left' : 'right', hash: level[sibling]});
    i = Math.floor(i / 2);
  }
  return path;
}
function eiMerkleVerify(leafHash, path, root) {
  if(!eiHex64(leafHash) || !Array.isArray(path) || !eiHex64(root)) return false;
  var acc = eiMerkleLeaf(leafHash);
  for(var i = 0; i < path.length; i++) {
    var step = path[i];
    if(!step || !eiHex64(step.hash) || (step.side !== 'left' && step.side !== 'right')) return false;
    acc = step.side === 'left' ? eiMerkleNode(step.hash, acc) : eiMerkleNode(acc, step.hash);
  }
  return acc === root;
}

// ---- Commitments ------------------------------------------------------------------------
/** Hashes and identifiers only. Status is included so a later change of verdict is visible. */
function eiAnchorClaimLeaf(state, claimId) {
  var c = state.claims[claimId];
  if(!c) eiFail('CLAIM_NOT_FOUND');
  return hashObject({claim_id: claimId, pack_key: c.pack_key, record_hash: c.record_hash, semantic_hash: c.semantic_hash, status: c.status});
}
function eiAnchorClaimIds(state) { return Object.keys(state.claims).sort(); }
function eiAnchorPayload(state, options) {
  options = options || {};
  if(!state || state.schema !== EI_STATE_SCHEMA) eiFail('INVALID_STATE');
  var known = ['audit_log', 'reports', 'previous_anchor_hash', 'label'];
  Object.keys(options).forEach(function(k) { if(known.indexOf(k) < 0) eiFail('UNKNOWN_ANCHOR_OPTION:' + k); });
  var label = options.label === undefined ? 'naft-portfolio' : options.label;
  if(typeof label !== 'string' || !/^[A-Za-z0-9._:-]{1,80}$/.test(label)) eiFail('INVALID_ANCHOR_LABEL');
  var previous = options.previous_anchor_hash === undefined ? null : options.previous_anchor_hash;
  if(previous !== null && !eiHex64(previous)) eiFail('INVALID_PREVIOUS_ANCHOR');
  var audit = null;
  if(options.audit_log !== undefined) {
    var checked = eiAuditVerify(options.audit_log);
    if(checked.status !== 'VALID') eiFail('AUDIT_LOG_NOT_VALID');
    if(eiAuditCrossCheck(options.audit_log, state).status !== 'MATCH') eiFail('AUDIT_LOG_DOES_NOT_MATCH_STATE');
    audit = {head: options.audit_log.head, entries: options.audit_log.entries.length};
  }
  var reports = null;
  if(options.reports !== undefined) {
    if(!Array.isArray(options.reports) || !options.reports.length) eiFail('INVALID_ANCHOR_REPORTS');
    options.reports.forEach(function(r) { if(eiVerifyReport(state, r).status !== 'VERIFIED') eiFail('REPORT_NOT_VERIFIED:' + (r && r.claim_id)); });
    var reportHashes = options.reports.map(function(r) { return r.report_hash; }).sort();
    if(new Set(reportHashes).size !== reportHashes.length) eiFail('DUPLICATE_ANCHOR_REPORT');
    reports = {root: eiMerkleRoot(reportHashes), count: reportHashes.length};
  }
  var ids = eiAnchorClaimIds(state), leaves = ids.map(function(id) { return eiAnchorClaimLeaf(state, id); });
  var payload = {schema: EI_ANCHOR_SCHEMA, label: label, engine_version: EI_ENGINE_VERSION, calculation_engine: EI_CALC_VERSION,
    state_digest: eiStateDigest(state), claims: {root: eiMerkleRoot(leaves), count: ids.length, leaf: 'SHA-256(canonical {claim_id, pack_key, record_hash, semantic_hash, status})'},
    factor_registry_hash: state.factor_registry_hash, audit: audit, reports: reports, previous_anchor_hash: previous,
    boundary: clone(EI_ANCHOR_BOUNDARY)};
  return Object.assign({}, payload, {anchor_hash: hashObject(payload)});
}
/** Arguments in the shape of the existing NaFTMRVAnchor call. Nothing is submitted. */
function eiAnchorArguments(anchor) {
  if(!anchor || anchor.schema !== EI_ANCHOR_SCHEMA || !eiHex64(anchor.anchor_hash)) eiFail('INVALID_ANCHOR');
  var subject = digestText('naft-anchor-subject:' + anchor.label);
  var args = [subject, anchor.anchor_hash, anchor.factor_registry_hash, anchor.previous_anchor_hash || EI_ANCHOR_ZERO];
  return {schema: 'naft-anchor-call-plan-1', contract: 'NaFTMRVAnchor', function: EI_ANCHOR_CONTRACT_FUNCTION,
    arguments: args.map(function(h) { return '0x' + h; }),
    argument_meaning: ['subject: SHA-256("naft-anchor-subject:" + label)', 'anchor_hash', 'factor_registry_hash', 'previous_anchor_hash (zero for the first anchor)'],
    value_wei: '0', chain_status: 'NOT_SUBMITTED', boundary: clone(EI_ANCHOR_BOUNDARY),
    note: 'Prepared arguments only. Submission, if ever performed, happens outside this pure module with a human decision and is not certification.'};
}
function eiAnchorClaimProof(state, claimId) {
  var ids = eiAnchorClaimIds(state), index = ids.indexOf(claimId);
  if(index < 0) eiFail('CLAIM_NOT_FOUND');
  var leaves = ids.map(function(id) { return eiAnchorClaimLeaf(state, id); });
  return {schema: 'naft-anchor-inclusion-proof-1', claim_id: claimId, leaf: leaves[index], leaf_preimage: {claim_id: claimId, pack_key: state.claims[claimId].pack_key,
    record_hash: state.claims[claimId].record_hash, semantic_hash: state.claims[claimId].semantic_hash, status: state.claims[claimId].status},
    path: eiMerkleProof(leaves, index), root: eiMerkleRoot(leaves), claim_count: ids.length};
}
/** Checks a single Claim against an anchor without the rest of the portfolio. */
function eiVerifyClaimProof(proof, anchor) {
  var failures = [];
  if(!proof || proof.schema !== 'naft-anchor-inclusion-proof-1') return {status: 'INVALID', failures: ['INVALID_PROOF']};
  if(!proof.leaf_preimage || hashObject(proof.leaf_preimage) !== proof.leaf) failures.push('LEAF_PREIMAGE_MISMATCH');
  if(!eiMerkleVerify(proof.leaf, proof.path, proof.root)) failures.push('MERKLE_PATH_INVALID');
  if(anchor && (!anchor.claims || anchor.claims.root !== proof.root)) failures.push('ROOT_NOT_IN_ANCHOR');
  if(anchor && eiVerifyAnchorIntegrity(anchor).status !== 'VALID') failures.push('ANCHOR_INTEGRITY');
  return {status: failures.length ? 'INVALID' : 'INCLUDED', failures: failures};
}

// ---- Verification -----------------------------------------------------------------------
function eiVerifyAnchorIntegrity(anchor) {
  var failures = [];
  if(!anchor || anchor.schema !== EI_ANCHOR_SCHEMA) return {status: 'INVALID', failures: ['INVALID_ANCHOR']};
  var body = Object.assign({}, anchor); delete body.anchor_hash;
  if(hashObject(body) !== anchor.anchor_hash) failures.push('ANCHOR_HASH_MISMATCH');
  if(!anchor.boundary || canonicalize(Object.keys(anchor.boundary).sort()) !== canonicalize(EI_ANCHOR_BOUNDARY_KEYS) || canonicalize(anchor.boundary) !== canonicalize(EI_ANCHOR_BOUNDARY)) failures.push('BOUNDARY_ALTERED');
  var allowed = ['schema', 'label', 'engine_version', 'calculation_engine', 'state_digest', 'claims', 'factor_registry_hash', 'audit', 'reports', 'previous_anchor_hash', 'boundary', 'anchor_hash'];
  Object.keys(anchor).forEach(function(k) { if(allowed.indexOf(k) < 0) failures.push('UNEXPECTED_FIELD:' + k); });
  return {status: failures.length ? 'INVALID' : 'VALID', failures: failures};
}
/** Recomputes the anchor from the state (and the same optional inputs) and compares. */
function eiVerifyAnchor(state, anchor, options) {
  var integrity = eiVerifyAnchorIntegrity(anchor);
  if(integrity.status !== 'VALID') return {status: 'MISMATCH', failures: integrity.failures};
  var rebuilt;
  try { rebuilt = eiAnchorPayload(state, Object.assign({label: anchor.label, previous_anchor_hash: anchor.previous_anchor_hash === null ? undefined : anchor.previous_anchor_hash}, options || {})); }
  catch(error) { return {status: 'MISMATCH', failures: ['REBUILD_FAILED:' + error.message]}; }
  var failures = [];
  ['state_digest', 'claims', 'factor_registry_hash', 'audit', 'reports', 'engine_version', 'calculation_engine'].forEach(function(k) {
    if(canonicalize(rebuilt[k]) !== canonicalize(anchor[k])) failures.push('DIFFERS:' + k);
  });
  if(rebuilt.anchor_hash !== anchor.anchor_hash && !failures.length) failures.push('DIFFERS:anchor_hash');
  return {status: failures.length ? 'MISMATCH' : 'VERIFIED', failures: failures, anchor_hash: anchor.anchor_hash};
}
/**
 * Compares a caller-supplied observation of an on-chain call with the expected arguments.
 * Nothing is fetched: MATCH means the supplied values agree, not that the chain was read.
 */
function eiVerifyObservedAnchor(anchor, observed) {
  var expected = eiAnchorArguments(anchor), failures = [];
  if(!observed || typeof observed !== 'object') return {status: 'MISMATCH', failures: ['OBSERVATION_REQUIRED']};
  if(!Number.isInteger(observed.chain_id) || observed.chain_id <= 0) failures.push('CHAIN_ID_REQUIRED');
  if(!/^0x[a-fA-F0-9]{40}$/.test(observed.contract_address || '') || /^0x0{40}$/i.test(observed.contract_address)) failures.push('CONTRACT_ADDRESS_INVALID');
  if(!/^0x[a-fA-F0-9]{64}$/.test(observed.tx_hash || '')) failures.push('TX_HASH_INVALID');
  if(observed.function !== EI_ANCHOR_CONTRACT_FUNCTION) failures.push('FUNCTION_MISMATCH');
  if(observed.value_wei !== undefined && String(observed.value_wei) !== '0') failures.push('VALUE_TRANSFER_NOT_ALLOWED');
  if(!Array.isArray(observed.arguments) || observed.arguments.length !== 4) failures.push('ARGUMENTS_REQUIRED');
  else observed.arguments.forEach(function(a, i) { if(String(a).toLowerCase() !== expected.arguments[i]) failures.push('ARGUMENT_MISMATCH:' + i); });
  return {status: failures.length ? 'MISMATCH' : 'MATCH', failures: failures, source: 'CALLER_SUPPLIED_OBSERVATION_NOT_FETCHED',
    meaning: 'The supplied call arguments equal the anchor. This does not establish that the transaction exists, is final, or that any claim is true or certified.'};
}
/** Anchors form a hash-linked sequence through previous_anchor_hash. */
function eiAnchorChainValid(anchors) {
  if(!Array.isArray(anchors) || !anchors.length) return {status: 'INVALID', failures: ['EMPTY_CHAIN']};
  var failures = [];
  anchors.forEach(function(a, i) {
    if(eiVerifyAnchorIntegrity(a).status !== 'VALID') failures.push('ANCHOR_INVALID:' + i);
    var expected = i === 0 ? null : anchors[i - 1].anchor_hash;
    if(a.previous_anchor_hash !== expected) failures.push('LINK_BROKEN:' + i);
    if(i > 0 && a.label !== anchors[0].label) failures.push('LABEL_CHANGED:' + i);
  });
  return {status: failures.length ? 'INVALID' : 'VALID', failures: failures, length: anchors.length, head: anchors[anchors.length - 1].anchor_hash};
}
function eiAuditAnchor(log, anchor, meta) {
  if(eiVerifyAnchorIntegrity(anchor).status !== 'VALID') eiFail('INVALID_ANCHOR');
  return eiAuditAppend(log, [{type: 'ANCHOR', subject: 'anchor:' + anchor.label, payload: {anchor_hash: anchor.anchor_hash, state_digest: anchor.state_digest, claims_root: anchor.claims.root,
    claim_count: anchor.claims.count, previous_anchor_hash: anchor.previous_anchor_hash, chain_status: 'NOT_SUBMITTED', transferable: false, value_bearing: false}}], meta);
}
