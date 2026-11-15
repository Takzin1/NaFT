'use strict';
/**
 * NaFT Evidence Intelligence — audit log for inputs, calculations and verification results.
 *
 * Append-only SHA-256 hash chain of typed entries. Pure: the log is a value, appending
 * returns a new log, and time is supplied by the caller (`at`) or left null. The chain
 * detects accidental or partial modification; it is not a signature and not an
 * independent witness — whoever controls every copy can rebuild it.
 *
 * Entry types: INPUT, CALCULATION, VERIFICATION, CHANGE, REPORT, EXPLANATION.
 */
var EI_AUDIT_SCHEMA = 'naft-evidence-intel-audit-1';
var EI_AUDIT_TYPES = ['INPUT', 'CALCULATION', 'VERIFICATION', 'CHANGE', 'REPORT', 'EXPLANATION'];

function eiAuditGenesis() { return hashObject({schema: EI_AUDIT_SCHEMA, genesis: true}); }
function eiAuditNew() { return {schema: EI_AUDIT_SCHEMA, entries: [], head: eiAuditGenesis()}; }
function eiAuditAppend(log, items, meta) {
  if(!log || log.schema !== EI_AUDIT_SCHEMA || !Array.isArray(log.entries)) eiFail('INVALID_AUDIT_LOG');
  meta = meta || {};
  var actor = meta.actor === undefined ? null : String(meta.actor).slice(0, 120), at = meta.at === undefined ? null : meta.at;
  if(at !== null && (typeof at !== 'string' || !Number.isFinite(Date.parse(at)))) eiFail('INVALID_AUDIT_TIME');
  var entries = log.entries.slice(), head = log.head;
  items.forEach(function(item) {
    if(!item || EI_AUDIT_TYPES.indexOf(item.type) < 0 || typeof item.subject !== 'string' || !item.subject) eiFail('INVALID_AUDIT_ENTRY');
    eiAssertJsonSafe(item.payload);
    var entry = {seq: entries.length + 1, type: item.type, subject: item.subject, payload: clone(item.payload), payload_hash: hashObject(item.payload), actor: actor, at: at, previous_hash: head};
    entry.entry_hash = hashObject(entry);
    entries.push(entry); head = entry.entry_hash;
  });
  return {schema: EI_AUDIT_SCHEMA, entries: entries, head: head};
}
function eiAuditCheckpoint(log) { return {seq: log.entries.length, head: log.head}; }
/**
 * Verify the chain. With a checkpoint the caller previously obtained, only entries after
 * it are re-hashed; the checkpoint itself must still match the entry at that position.
 */
function eiAuditVerify(log, checkpoint) {
  if(!log || log.schema !== EI_AUDIT_SCHEMA || !Array.isArray(log.entries)) return {status: 'BROKEN', reason: 'INVALID_LOG'};
  var start = 0, head = eiAuditGenesis();
  if(checkpoint) {
    if(!Number.isInteger(checkpoint.seq) || checkpoint.seq < 0 || checkpoint.seq > log.entries.length) return {status: 'BROKEN', reason: 'CHECKPOINT_OUT_OF_RANGE'};
    if(checkpoint.seq > 0 && log.entries[checkpoint.seq - 1].entry_hash !== checkpoint.head) return {status: 'BROKEN', reason: 'CHECKPOINT_MISMATCH'};
    if(checkpoint.seq === 0 && checkpoint.head !== head) return {status: 'BROKEN', reason: 'CHECKPOINT_MISMATCH'};
    start = checkpoint.seq; head = checkpoint.head;
  }
  for(var i = start; i < log.entries.length; i++) {
    var e = log.entries[i], body = Object.assign({}, e); delete body.entry_hash;
    if(!e || e.seq !== i + 1 || e.previous_hash !== head || e.payload_hash !== hashObject(e.payload) || e.entry_hash !== hashObject(body)) return {status: 'BROKEN', reason: 'ENTRY_' + (i + 1), verified_from: start};
    head = e.entry_hash;
  }
  return {status: head === log.head ? 'VALID' : 'BROKEN', reason: head === log.head ? null : 'HEAD_MISMATCH', entries: log.entries.length, verified_from: start, head: head};
}
function eiAuditQuery(log, filter) {
  filter = filter || {};
  return log.entries.filter(function(e) {
    return (!filter.type || e.type === filter.type) && (!filter.subject || e.subject === filter.subject) && (!filter.claim_id || e.payload.claim_id === filter.claim_id) &&
      (!filter.from_seq || e.seq >= filter.from_seq);
  });
}
function eiAuditClaimEntries(state, claimId, changeHash) {
  var c = state.claims[claimId], record = c.nodes[c.outputs.record].value, calc = record.calculation;
  return [
    {type: 'INPUT', subject: 'claim:' + claimId, payload: {claim_id: claimId, pack_key: c.pack_key, pack_hash: record.methodology.pack_hash, input_merkle: record.input_merkle, change_hash: changeHash || null,
      evidence: record.evidence.map(function(e) { return {id: e.id, category: e.category, manifest_hash: e.manifest_hash, content_hash: e.content_hash}; }),
      factors: record.factors.map(function(f) { return {parameter: f.parameter, key: f.factor_id + '@' + f.version, factor_hash: f.factor_hash}; })}},
    {type: 'CALCULATION', subject: 'claim:' + claimId, payload: {claim_id: claimId, calculation_engine: EI_CALC_VERSION, operation: calc.operation, values: calc.values, exact_preview: calc.exact, arithmetic_preview: calc.arithmetic_preview,
      unit: calc.unit, unit_check: calc.unit_check, trace_hash: hashObject(calc.trace), node_hash: c.nodes[c.outputs.calculation].vh, result: null}},
    {type: 'VERIFICATION', subject: 'claim:' + claimId, payload: {claim_id: claimId, status: record.evaluation.status, issues: record.evaluation.issues.map(function(i) { return {code: i.code, status: i.status}; }),
      missing_evidence: record.evaluation.missing_evidence, node_hash: c.nodes[c.outputs.evaluation].vh, semantic_hash: c.semantic_hash, record_hash: c.record_hash, formal_certification: false}}
  ];
}
function eiAuditBuild(log, state, meta) {
  var items = [];
  Object.keys(state.claims).sort().forEach(function(id) { items = items.concat(eiAuditClaimEntries(state, id, null)); });
  return eiAuditAppend(log, items, meta);
}
function eiAuditDelta(log, state, delta, meta) {
  var items = [{type: 'CHANGE', subject: 'change:' + delta.change_hash, payload: {change: delta.change, change_hash: delta.change_hash, counts: delta.counts,
    claims: delta.claims.map(function(r) { return {claim_id: r.claim_id, classification: r.classification, previous_record_hash: r.previous_record_hash || null, record_hash: r.record_hash}; })}}];
  delta.claims.filter(function(r) { return r.classification !== 'NO_OP'; }).forEach(function(r) { items = items.concat(eiAuditClaimEntries(state, r.claim_id, delta.change_hash)); });
  return eiAuditAppend(log, items, meta);
}
function eiAuditReport(log, report, meta) {
  return eiAuditAppend(log, [{type: 'REPORT', subject: 'claim:' + report.claim_id, payload: {claim_id: report.claim_id, report_hash: report.report_hash, record_hash: report.generated_from.record_hash, statements: report.statements.length}}], meta);
}
function eiAuditExplanation(log, sidecar, meta) {
  return eiAuditAppend(log, [{type: 'EXPLANATION', subject: 'claim:' + sidecar.claim_id, payload: {claim_id: sidecar.claim_id, sidecar_hash: sidecar.sidecar_hash, report_hash: sidecar.report_hash, generator: sidecar.generator,
    validation_status: sidecar.validation.status, authoritative: false, affects_calculation: false}}], meta);
}
/** The newest VERIFICATION entry of every Claim must name the record hash held by the state. */
function eiAuditCrossCheck(log, state) {
  var latest = new Map();
  log.entries.forEach(function(e) { if(e.type === 'VERIFICATION') latest.set(e.payload.claim_id, e.payload.record_hash); });
  var ids = Object.keys(state.claims).sort(), mismatches = ids.filter(function(id) { return latest.get(id) !== state.claims[id].record_hash; });
  return {status: mismatches.length ? 'MISMATCH' : 'MATCH', claims: ids.length, mismatches: mismatches};
}
