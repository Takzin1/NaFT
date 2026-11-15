#!/usr/bin/env node
'use strict';
/**
 * Local timing harness: existing compiler / analyzer versus the Evidence Intelligence engine.
 *
 *   node scripts/benchmark-evidence-intel.cjs --quick          # 100 Claims, prints JSON
 *   node scripts/benchmark-evidence-intel.cjs --write          # 100/1000/5000 Claims -> reports/
 *
 * Every timed result is first checked for correctness (full-rebuild oracle, legacy parity).
 * Timings are single-process medians on synthetic inputs and depend on the machine; they
 * are not a production throughput, cost or field-efficacy claim.
 */
const fs = require('node:fs'), os = require('node:os');
require('./lib/evidence-intel-load.cjs').loadEvidenceIntel();
for(const name of ['compiler-session', 'incremental-compiler-research']) require('node:vm').runInThisContext(fs.readFileSync(__dirname + '/../src/' + name + '.js', 'utf8'), {filename: name + '.js'});

const quick = process.argv.includes('--quick'), write = process.argv.includes('--write');
const sizes = quick ? [100] : [100, 1000, 5000];
function ms(fn) { const t = process.hrtime.bigint(); const value = fn(); return {ms: Number(process.hrtime.bigint() - t) / 1e6, value}; }
function sample(fn, runs) {
  fn();                                             // warm-up, excluded
  const xs = Array.from({length: runs}, () => ms(fn).ms).sort((a, b) => a - b);
  return {median_ms: round(xs[Math.floor(xs.length / 2)]), min_ms: round(xs[0]), max_ms: round(xs[xs.length - 1]), runs};
}
function round(x) { return Math.round(x * 1000) / 1000; }
function ratio(a, b) { return b.median_ms > 0 ? round(a.median_ms / b.median_ms) : null; }
function claimsOf(n) { return Array.from({length: n}, (_, i) => syntheticClaim('BENCH-' + String(i + 1).padStart(5, '0'), i % 10 < 7 ? 'standard' : i % 10 < 9 ? 'intensive' : 'intensive_complete')); }
function must(ok, label) { if(!ok) throw new Error('BENCHMARK_CORRECTNESS:' + label); }

const ctx = eiDefaultContext(), scenarios = [];
for(const n of sizes) {
  const runs = quick ? 1 : n >= 5000 ? 3 : 5, fine = quick ? 1 : 9, claims = claimsOf(n), pack1 = COMPILER_REGISTRY['NAFT-SYNTHETIC@1'];
  const state = eiBuild(claims, ctx);
  must(eiVerifyState(state, ctx).status === 'MATCH', 'build ' + n);
  must(claims.slice(0, 50).every(c => eiLegacyParity(state, c.activity.id, ctx).status === 'MATCH'), 'parity ' + n);

  // 1. Full evaluation of every Claim
  const legacyFull = sample(() => claims.forEach(c => compileEvidence(c, pack1)), runs);
  const engineFull = sample(() => eiBuild(claims, ctx), runs);

  // 2. One evidence item replaced in one Claim
  const target = claims[Math.floor(n / 2)], replacement = clone(target.evidence[0]);
  replacement.content = JSON.stringify(Object.assign(JSON.parse(replacement.content), {revision: 2})); replacement.expected_hash = digestText(replacement.content);
  const evidenceChange = {type: 'evidence', activity_id: target.activity.id, evidence_id: replacement.id, replacement};
  const applied = eiApplyChange(state, evidenceChange, ctx);
  must(eiVerifyState(applied.state, ctx).status === 'MATCH', 'evidence delta ' + n);
  const legacyEvidence = sample(() => analyzeImpact(claims, evidenceChange), n >= 5000 ? 1 : runs);
  const engineEvidence = sample(() => eiApplyChange(state, evidenceChange, ctx), fine);
  const changedClaims = claims.map(c => c === target ? Object.assign(clone(c), {evidence: c.evidence.map(e => e.id === replacement.id ? replacement : e)}) : c);
  let researchCache = null;
  if(n <= 1000) {
    const registry = {'NAFT-SYNTHETIC@1': pack1}, base = compileIncrementalResearch(claims, registry);
    researchCache = sample(() => compileIncrementalResearch(changedClaims, registry, base.snapshot), runs);
  }
  const oneClaimLegacy = sample(() => { compileEvidence(target, pack1); compileEvidence(changedClaims[Math.floor(n / 2)], pack1); }, fine);

  // 3. Methodology transition touching every Claim
  const transition = {type: 'methodology', old_key: 'NAFT-SYNTHETIC@1', new_key: 'NAFT-SYNTHETIC@2'};
  const migrated = eiApplyChange(state, transition, ctx), legacyImpact = analyzeImpact(claims, transition);
  must(eiVerifyState(migrated.state, ctx).status === 'MATCH', 'transition ' + n);
  must(canonicalize(migrated.delta.claims.filter(r => r.requires_reverification).map(r => r.claim_id)) === canonicalize(legacyImpact.claims.filter(r => r.requires_reverification).map(r => r.claim_id)), 'transition set ' + n);
  const legacyTransition = sample(() => analyzeImpact(claims, transition), n >= 5000 ? 1 : runs);
  const engineTransition = sample(() => eiApplyChange(state, transition, ctx), runs);

  // 4. Dependents of one shared parameter across the whole graph
  const graph = eiGraph(state), seed = 'parameter:NAFT-SYNTHETIC@1:factor';
  const index = eiGraphIndex(graph), reached = eiTrace(index, [seed], 'downstream');
  let legacyTrace = null;
  if(n <= 1000) {
    must(canonicalize(traceDependents(graph, [seed])) === canonicalize(reached), 'trace ' + n);
    legacyTrace = sample(() => traceDependents(graph, [seed]), n >= 1000 ? 3 : runs);
  }
  const indexedTrace = sample(() => eiTrace(eiGraphIndex(graph), [seed], 'downstream'), runs);

  // 5. Audit log of inputs, calculations and verification results
  const log = eiAuditBuild(eiAuditNew(), state), checkpoint = eiAuditCheckpoint(log), logNext = eiAuditDelta(log, applied.state, applied.delta);
  must(eiAuditVerify(logNext).status === 'VALID' && eiAuditCrossCheck(logNext, applied.state).status === 'MATCH', 'audit ' + n);
  const auditFull = sample(() => eiAuditVerify(logNext), runs), auditTail = sample(() => eiAuditVerify(logNext, checkpoint), fine);

  scenarios.push({claims: n, graph: {nodes: graph.nodes.length, edges: graph.edges.length},
    full_evaluation: {legacy_compile_all: legacyFull, engine_build: engineFull, engine_over_legacy: ratio(engineFull, legacyFull)},
    single_evidence_change: {legacy_analyze_impact_stateless: legacyEvidence, legacy_two_compiles_of_the_one_claim: oneClaimLegacy, existing_per_claim_cache: researchCache, engine_apply_change: engineEvidence,
      legacy_over_engine: ratio(legacyEvidence, engineEvidence), work: applied.delta.counts},
    methodology_transition_all_claims: {legacy_analyze_impact: legacyTransition, engine_apply_change: engineTransition, legacy_over_engine: ratio(legacyTransition, engineTransition), work: migrated.delta.counts},
    dependents_of_shared_parameter: {reached_nodes: reached.length, legacy_trace_dependents: legacyTrace, engine_index_plus_trace: indexedTrace, legacy_over_engine: legacyTrace ? ratio(legacyTrace, indexedTrace) : null},
    audit_log: {entries: logNext.entries.length, verify_full: auditFull, verify_after_checkpoint: auditTail},
    heap_used_mb_after_scenario: round(process.memoryUsage().heapUsed / 1048576)});
}

// Existing session audit chain: each append re-verifies the whole chain (by design, no integrity cache).
const sessionAudit = [];
db = seedDB();
for(const target of quick ? [200] : [200, 800, 1600]) {
  while(db.audit_events.length < target) audit('benchmark_event', 'bench', {hash: hashObject(db.audit_events.length)});
  sessionAudit.push({existing_events: target, append_one_event: sample(() => { audit('benchmark_event', 'bench', {hash: 'x'}); db.audit_events.pop(); db.audit_head = db.audit_events[db.audit_events.length - 1].event_hash; }, quick ? 1 : 5)});
}

const result = {schema: 'naft-evidence-intel-benchmark-1', fixture: 'SYNTHETIC_ONLY', mode: quick ? 'quick' : 'full', statistic: 'median of N runs after one excluded warm-up', unit: 'milliseconds',
  environment: {node: process.version, platform: process.platform, arch: process.arch, cpu: (os.cpus()[0] || {}).model || 'unknown', logical_cpus: os.cpus().length},
  scenarios, existing_session_audit_chain: sessionAudit,
  correctness_gates: 'Each scenario passed the full-rebuild oracle, legacy parity on a sample, analyzer set equality and audit cross-check before timing.',
  limitations: 'Single process, synthetic Claims with small evidence payloads, pure-JS SHA-256, no GC control, no confidence intervals. Legacy analyzeImpact is stateless and recompiles every baseline, while the engine keeps an in-memory state; the comparison measures that architectural difference, not a tuned legacy implementation. Not a production throughput, cost, review-time or field claim.'};
const text = JSON.stringify(result, null, 2) + '\n';
if(write) fs.writeFileSync('reports/evidence-intel-benchmark.json', text);
process.stdout.write(quick ? JSON.stringify({mode: 'quick', scenarios: scenarios.length, correctness: 'PASS'}) + '\n' : text);
