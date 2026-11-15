'use strict';
/**
 * Judges the differential engine on the same 614-case adversarial matrix as the legacy
 * selective analyzer, against the same independent full-recomputation oracle.
 *
 *   node tests/evidence-intel-impact.test.js           # compare with the committed report
 *   node tests/evidence-intel-impact.test.js --write   # regenerate the report
 */
const fs = require('fs'), assert = require('assert/strict');
require('../scripts/lib/evidence-intel-load.cjs').loadEvidenceIntel();
const {impactMatrix, semanticView} = require('./lib/impact-matrix.cjs');

let passed = 0, failed = 0;
function check(value, label) { try { assert.ok(value, label); passed++; } catch(error) { failed++; console.error('FAIL: ' + label); process.exitCode = 1; } }
function tally() { return {cases: 0, oracle_changed: 0, oracle_unchanged: 0, true_positive: 0, true_negative: 0, false_positive: 0, false_negative: 0}; }
function record(stats, oracleChanged, flagged) {
  stats.cases++;
  stats[oracleChanged ? 'oracle_changed' : 'oracle_unchanged']++;
  stats[oracleChanged ? (flagged ? 'true_positive' : 'false_negative') : (flagged ? 'false_positive' : 'true_negative')]++;
}

const cases = impactMatrix(), legacy = tally(), engine = tally(), byGroup = {}, work = {nodes_total: 0, nodes_recomputed: 0, leaves_changed: 0};
const classifications = {SEMANTIC_CHANGE: 0, PROVENANCE_ONLY: 0, NO_OP: 0}, counterexamples = [];
cases.forEach(function(c) {
  const oracleChanged = canonicalize(semanticView(c.before, c.oldPack)) !== canonicalize(semanticView(c.after, c.newPack));
  // Legacy analyzer (unchanged code path)
  const legacyRow = analyzeImpact([c.before], c.change, c.registry).claims[0];
  record(legacy, oracleChanged, legacyRow.requires_reverification);
  // Differential engine
  const ctx = {packs: c.registry, factors: EI_FACTOR_REGISTRY}, state = eiBuild([c.before], ctx), digestBefore = eiStateDigest(state);
  const applied = eiApplyChange(state, c.change, ctx), row = applied.delta.claims[0];
  const flagged = row.classification === 'SEMANTIC_CHANGE';
  record(engine, oracleChanged, flagged);
  classifications[row.classification]++;
  const g = byGroup[c.group] = byGroup[c.group] || {legacy: tally(), engine: tally()};
  record(g.legacy, oracleChanged, legacyRow.requires_reverification); record(g.engine, oracleChanged, flagged);
  if(oracleChanged !== flagged) counterexamples.push({label: c.label, oracle_changed: oracleChanged, engine: row.classification});
  check(!(oracleChanged && !flagged), 'engine has no false negative: ' + c.group + ' ' + c.label);
  // Incremental result must equal a from-scratch build of the changed input, and both must agree with the legacy compiler.
  const id = c.before.activity.id, fresh = eiBuild([c.after], ctx);
  check(eiStateDigest(applied.state) === eiStateDigest(fresh), 'incremental equals full rebuild: ' + c.group + ' ' + c.label);
  check(eiLegacyParity(applied.state, id, ctx).status === 'MATCH', 'engine equals legacy compiler after change: ' + c.group + ' ' + c.label);
  check(eiStateDigest(state) === digestBefore, 'previous state untouched: ' + c.group + ' ' + c.label);
  if(row.classification !== 'NO_OP') { work.nodes_total += row.nodes_total; work.nodes_recomputed += row.recomputed_nodes.length; work.leaves_changed += row.changed_leaves.length; }
});

const committed = JSON.parse(fs.readFileSync('reports/impact-proof.json', 'utf8')).result;
check(legacy.cases === committed.total_cases && legacy.true_positive === committed.true_positive && legacy.true_negative === committed.true_negative &&
  legacy.false_positive === committed.false_positive && legacy.false_negative === committed.false_negative, 'shared matrix reproduces the committed legacy impact proof exactly');
check(engine.false_negative === 0, 'zero false negatives for the differential engine in the tested state space');
check(engine.false_positive <= legacy.false_positive, 'engine over-verification does not exceed the legacy analyzer');
check(engine.oracle_changed > 0 && engine.oracle_unchanged > 0, 'matrix is non-vacuous');

const report = {
  schema: 'naft-evidence-intel-impact-1',
  boundary: 'Synthetic deterministic adversarial engineering cases within the supported interpreter and change types. Not a universal soundness proof, not field accuracy, not a runtime or cost claim.',
  oracle: 'full-recomputation-semantic-view-v1 (legacy compileEvidence before/after; does not call either analyzer)',
  matrix_cases: cases.length,
  legacy_selective_analyzer: Object.assign({}, legacy, {over_verification_rate: legacy.oracle_unchanged ? legacy.false_positive / legacy.oracle_unchanged : null}),
  differential_engine: Object.assign({}, engine, {over_verification_rate: engine.oracle_unchanged ? engine.false_positive / engine.oracle_unchanged : null, classifications: classifications}),
  by_group: byGroup,
  engine_work: Object.assign({}, work, {recomputed_share: work.nodes_total ? work.nodes_recomputed / work.nodes_total : null,
    note: 'Deterministic node counts over affected Claims only (single-Claim cases). A count of operations, not a timing.'}),
  equivalence_checks: {incremental_equals_full_rebuild: cases.length, engine_equals_legacy_compiler_after_change: cases.length},
  counterexamples: counterexamples
};
const text = JSON.stringify(report, null, 2) + '\n', file = 'reports/evidence-intel-impact.json';
if(process.argv.includes('--write')) { if(!failed) fs.writeFileSync(file, text); }
else check(fs.existsSync(file) && fs.readFileSync(file, 'utf8') === text, 'committed reports/evidence-intel-impact.json is reproducible (run with --write to regenerate)');
console.log('EVIDENCE INTEL IMPACT SUMMARY ' + JSON.stringify({legacy: legacy, engine: engine, classifications: classifications}));
console.log('EVIDENCE INTEL IMPACT RESULT: ' + passed + ' passed, ' + failed + ' failed');
if(failed) process.exit(1);
