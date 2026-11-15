'use strict';
/**
 * Evidence Intelligence suite: exact calculation, version/scope registers, fine-grained
 * dependency graph, differential re-computation, grounded reports, explanation boundary,
 * audit log and API. Dependency-free Node assertions; synthetic data only.
 */
const fs = require('fs'), assert = require('assert/strict');
require('../scripts/lib/evidence-intel-load.cjs').loadEvidenceIntel();

let passed = 0, failed = 0;
function check(value, label) { try { assert.ok(value, label); passed++; } catch(error) { failed++; console.error('FAIL: ' + label); process.exitCode = 1; } }
function eq(a, b, label) { check(canonicalize(a) === canonicalize(b), label + ' (got ' + canonicalize(a).slice(0, 160) + ')'); }
function blocks(fn, message, label) { try { fn(); check(false, label + ' did not block'); } catch(e) { check(e.message === message, label + ' (got ' + e.message + ')'); } }
function lcg(seed) { var s = seed >>> 0; return function() { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
function eiClaim(id, variant, area, days) {
  const input = syntheticClaim(id, variant);
  input.activity.methodology_id = 'NAFT-SYNTHETIC-EI';
  input.evidence.forEach(function(e) { e.methodology_id = 'NAFT-SYNTHETIC-EI'; });
  if(area !== undefined) input.field.area_ha = area;
  if(days !== undefined) input.activity.days = days;
  return input;
}
function evidenceItem(claim, category, adapter, suffix) {
  const content = JSON.stringify({provenance: 'synthetic', claim: claim.activity.id, category: category, note: suffix || 'added'});
  return {id: claim.activity.id + '-' + category + (suffix ? '-' + suffix : ''), category: category, adapter: adapter, content: content, expected_hash: digestText(content), activity_id: claim.activity.id,
    field_id: claim.field.id, methodology_id: claim.activity.methodology_id, methodology_version: claim.activity.methodology_version, period: {start: claim.activity.start, end: claim.activity.end}, source: 'urn:naft:synthetic-fixture', provenance: 'synthetic'};
}
const ctx = eiDefaultContext(), ctxNext = {packs: EI_PACK_REGISTRY, factors: EI_FACTOR_REGISTRY_NEXT};
const corpus = JSON.parse(fs.readFileSync('fixtures/evaluation-corpus.json', 'utf8'));

// ===== A. Exact deterministic calculation =================================================
(function calculation() {
  const env = {inputs: {}, params: {}};
  function run(expr, e) { return eiEvaluateExpression(expr, e || env); }
  eq(run({op: 'add', args: [{const: '0.1'}, {const: '0.2'}]}).text, '0.3', 'decimal addition is exact');
  check(0.1 + 0.2 !== 0.3, 'the same addition is inexact in binary floating point');
  eq(run({op: 'mul', args: [{const: 0.1}, {const: 3}]}).text, '0.3', 'JS numbers enter through their shortest decimal text');
  eq(run({op: 'sub', args: [{const: '1'}, {const: '0.9'}]}).text, '0.1', 'subtraction exact');
  eq(run({op: 'div', args: [{const: '1'}, {const: '8'}]}).text, '0.125', 'terminating division exact');
  const third = run({op: 'div', args: [{const: '1'}, {const: '3'}]});
  eq([third.text, third.terminating], ['1/3', false], 'non-terminating division stays an exact fraction');
  eq(run({op: 'round', dp: 4, mode: 'HALF_EVEN', args: [{op: 'div', args: [{const: '1'}, {const: '3'}]}]}).text, '0.3333', 'explicit rounding terminates a fraction');
  [['0.125', 2, 'HALF_EVEN', '0.12'], ['0.135', 2, 'HALF_EVEN', '0.14'], ['0.125', 2, 'HALF_UP', '0.13'], ['0.129', 2, 'DOWN', '0.12'], ['2.5', 0, 'HALF_EVEN', '2'], ['3.5', 0, 'HALF_EVEN', '4'], ['2.5', 0, 'HALF_UP', '3']].forEach(function(c) {
    eq(eiRatFixed(eiRatRound(eiDecimal(c[0]), c[1], c[2]), c[1]), c[3] + (c[1] && c[3].indexOf('.') < 0 ? '.' + '0'.repeat(c[1]) : ''), 'rounding ' + c.join(' '));
  });
  eq(eiRatFixed(eiRatRound(eiRat(-25n, 10n), 0, 'HALF_UP'), 0), '-3', 'HALF_UP rounds ties away from zero for negatives');
  eq(eiRatFixed(eiRatRound(eiRat(-25n, 10n), 0, 'HALF_EVEN'), 0), '-2', 'HALF_EVEN rounds negative ties to even');
  eq(eiRatFixed(eiRatRound(eiRat(-29n, 10n), 0, 'DOWN'), 0), '-2', 'DOWN truncates toward zero');
  eq(run({op: 'min', args: [{const: '2'}, {const: '1.5'}, {const: '3'}]}).text, '1.5', 'min');
  eq(run({op: 'max', args: [{const: '2'}, {const: '1.5'}, {const: '3'}]}).text, '3', 'max');
  eq(run({op: 'neg', args: [{const: '2'}]}).text, '-2', 'neg');
  eq(eiRatText(eiDecimal('1e-3')), '0.001', 'exponent notation parsed exactly');
  eq(eiRatText(eiDecimal(1e21)), '1000000000000000000000', 'large JS number text parsed exactly');
  eq(eiRatText(eiDecimal('-0.50')), '-0.5', 'canonical text drops trailing zeros');
  ['', 'abc', '1.', '.5', '0x10', '1,000', 'NaN', 'Infinity', ' 1'].forEach(function(x) { blocks(function() { eiDecimal(x); }, 'EI_CALC_INVALID_NUMBER', 'rejects non-decimal ' + JSON.stringify(x)); });
  [NaN, Infinity, null, undefined, true, {}].forEach(function(x) { blocks(function() { eiDecimal(x); }, 'EI_CALC_INVALID_NUMBER', 'rejects non-number ' + String(x)); });
  // Order independence: every permutation of exact multiplication agrees; the float fold does not.
  const xs = ['0.1', '0.7', '1.1', '3'], perms = [[0, 1, 2, 3], [3, 2, 1, 0], [1, 3, 0, 2], [2, 0, 3, 1]];
  const exact = perms.map(function(p) { return run({op: 'mul', args: p.map(function(i) { return {const: xs[i]}; })}).text; });
  check(new Set(exact).size === 1 && exact[0] === '0.231', 'exact product is independent of operand order');
  const floats = perms.map(function(p) { return p.reduce(function(acc, i) { return acc * Number(xs[i]); }, 1); });
  check(new Set(floats).size > 1, 'float product of the same operands depends on order (documented legacy limitation)');
  // Fail closed
  eq(run({op: 'pow', args: [{const: 2}, {const: 3}]}).error_code, 'UNSUPPORTED_OPERATION', 'unknown operation not executed');
  eq(run({op: 'div', args: [{const: 1}, {const: 0}]}).error_code, 'DIVISION_BY_ZERO', 'division by zero');
  eq(run({op: 'sub', args: [{const: 1}]}).error_code, 'INVALID_ARITY', 'arity enforced');
  eq(run({input: 'field.area_ha'}).error_code, 'MISSING_INPUT', 'missing input');
  eq(run({param: 'factor'}).error_code, 'MISSING_PARAM', 'missing parameter');
  eq(run({const: '-1'}).error_code, 'NEGATIVE_VALUE', 'negative leaf refused by default');
  eq(run({const: '-1', allow_negative: true}).text, '-1', 'negative leaf allowed only when declared');
  eq(run({op: 'round', dp: 99, mode: 'HALF_EVEN', args: [{const: 1}]}).error_code, 'INVALID_ROUNDING', 'rounding precision limit');
  eq(run({op: 'round', dp: 2, mode: 'BANKERS', args: [{const: 1}]}).error_code, 'INVALID_ROUNDING', 'unknown rounding mode');
  eq(run('2+2').error_code, 'INVALID_EXPRESSION', 'strings are not evaluated');
  var deep = {const: 1}; for(var i = 0; i < 40; i++) deep = {op: 'neg', args: [deep]};
  eq(run(deep).error_code, 'EXPRESSION_LIMIT', 'depth limit');
  eq(run({op: 'add', args: Array.from({length: 300}, function() { return {const: 1}; })}).error_code, 'EXPRESSION_LIMIT', 'node limit');
  // Units
  const area = {const: '2', unit: {ha: 1}}, days = {const: '10', unit: {day: 1}}, factor = {const: '2.5', unit: {index: 1, ha: -1, day: -1}};
  eq(run({op: 'mul', args: [area, days, factor]}).unit, {index: 1}, 'unit exponents cancel');
  eq(run({op: 'add', args: [area, days]}).error_code, 'UNIT_MISMATCH', 'adding different units fails closed');
  eq(run({op: 'div', args: [area, days]}).unit, {day: -1, ha: 1}, 'division subtracts exponents');
  eq(run({const: '1', unit: {'bad unit': 1}}).error_code, 'INVALID_UNIT', 'invalid unit name');
  eq(run({op: 'add', args: [{const: 1}, {const: 2}]}).unit, null, 'undeclared units stay undeclared');
  // Trace
  const traced = run({op: 'round', dp: 2, mode: 'HALF_EVEN', args: [{op: 'mul', args: [{input: 'a'}, {param: 'k'}]}]}, {inputs: {a: '1.005'}, params: {k: '3'}});
  eq(traced.steps.map(function(s) { return s.kind === 'op' ? s.op : s.kind + ':' + s.ref; }), ['input:a', 'param:k', 'mul', 'round'], 'trace lists every step in evaluation order');
  eq([traced.steps[2].value, traced.steps[3].value], ['3.015', '3.02'], 'trace carries exact intermediate values');
  eq(run({op: 'mul', args: [{input: 'a'}, {param: 'k'}]}, {inputs: {a: '1.005'}, params: {k: '3'}}), run({op: 'mul', args: [{input: 'a'}, {param: 'k'}]}, {inputs: {a: '1.005'}, params: {k: '3'}}), 'evaluation is deterministic');
  eq(eiExpressionLeaves({op: 'mul', args: [{input: 'x'}, {param: 'p'}, {op: 'add', args: [{input: 'x'}, {input: 'y'}]}]}), {inputs: ['x', 'y'], params: ['p']}, 'expression leaves in first-use order');
  eq([eiCompareDecimal('7', 7), eiCompareDecimal('7.0001', 7), eiCompareDecimal(6, '7'), eiCompareDecimal('UNKNOWN', 7)], [0, 1, -1, null], 'exact comparison, non-decimals are not comparable');
})();

// ===== B. Version and scope registers ======================================================
(function versions() {
  const lsrs = EI_STANDARDS_SCOPE.find(function(s) { return s.id === 'GHGP-LSRS'; });
  eq([lsrs.version, lsrs.accounting_context, lsrs.executable, lsrs.naft_use], ['1.1', 'CORPORATE_INVENTORY', false, 'SCOPE_REFERENCE_ONLY'], 'LSR Standard v1.1 is a corporate-inventory scope reference, not executable');
  eq([lsrs.source_hash, lsrs.primary_text_verified], ['UNKNOWN', false], 'unverified primary text is recorded as unverified');
  check(lsrs.out_of_scope_for_naft_use.some(function(x) { return /credit/.test(x); }), 'credit quantification is outside the referenced inventory standard');
  check(EI_STANDARDS_SCOPE.filter(function(s) { return s.accounting_context === 'CORPORATE_INVENTORY'; }).every(function(s) { return !s.executable; }), 'no inventory standard is executable');
  check(Object.isFrozen(EI_STANDARDS_SCOPE) && Object.isFrozen(lsrs), 'scope register frozen');
  eq(eiPackAccountingContext(EI_PACK_REGISTRY['AG-005@3.1-reference']), 'PROJECT_CREDITING', 'AG-005 is a crediting-programme methodology');
  eq(eiPackAccountingContext(EI_PACK_REGISTRY['NAFT-SYNTHETIC@1']), 'SYNTHETIC_ENGINEERING', 'synthetic Pack context');
  blocks(function() { eiPackAccountingContext({accounting_context: 'OFFSET_INVENTORY', status: 'SYNTHETIC'}); }, 'EI_UNKNOWN_ACCOUNTING_CONTEXT', 'unknown declared context refused');
  eq(eiPackAccountingContext({methodology_id: 'X', status: 'REFERENCE'}), 'UNKNOWN', 'undeclared context is UNKNOWN');
  ['PROJECT_CREDITING', 'SYNTHETIC_ENGINEERING', 'CORPORATE_INVENTORY', 'UNKNOWN'].forEach(function(c) { blocks(function() { eiAssertIntendedUse(c, 'CORPORATE_INVENTORY'); }, 'EI_INVENTORY_ACCOUNTING_NOT_IMPLEMENTED', 'inventory use never available for ' + c); });
  blocks(function() { eiAssertIntendedUse('SYNTHETIC_ENGINEERING', 'PROJECT_CREDITING_PRECHECK'); }, 'EI_ACCOUNTING_CONTEXT_MISMATCH', 'synthetic result cannot be labelled a crediting pre-check');
  blocks(function() { eiAssertIntendedUse('UNKNOWN', 'PROJECT_CREDITING_PRECHECK'); }, 'EI_ACCOUNTING_CONTEXT_MISMATCH', 'unknown context cannot be labelled a crediting pre-check');
  check(eiAssertIntendedUse('PROJECT_CREDITING', 'PROJECT_CREDITING_PRECHECK') && eiAssertIntendedUse('SYNTHETIC_ENGINEERING', 'ENGINEERING_RESEARCH'), 'matching uses allowed');
  blocks(function() { eiAssertIntendedUse('PROJECT_CREDITING', 'CREDIT_ISSUANCE'); }, 'EI_UNKNOWN_INTENDED_USE', 'issuance is not an intended use');
  ['PROJECT_CREDITING', 'SYNTHETIC_ENGINEERING', 'UNKNOWN'].forEach(function(c) { check(/neither a GHG inventory.*nor a carbon-credit certification/.test(eiContextStatement(c)), 'context statement separates inventory and certification: ' + c); });

  // Existing registry untouched; extended registry is additive
  eq(VERSIONED_PACKS.length, 4, 'legacy Pack list unchanged');
  eq(Object.keys(COMPILER_REGISTRY).sort(), ['AG-004@UNKNOWN', 'AG-005@3.1-reference', 'NAFT-SYNTHETIC@1', 'NAFT-SYNTHETIC@2'], 'legacy registry keys unchanged');
  Object.keys(COMPILER_REGISTRY).forEach(function(k) { eq(hashObject(EI_PACK_REGISTRY[k]), hashObject(COMPILER_REGISTRY[k]), 'immutable identity preserved in extended registry: ' + k); });
  check(Object.isFrozen(EI_PACK_REGISTRY['NAFT-SYNTHETIC-EI@1'].calculation_spec.expression), 'extended Packs deep frozen');
  eq(eiPackFeatures(COMPILER_REGISTRY['NAFT-SYNTHETIC@1']).legacy_compatible, true, 'legacy Pack is parity-checkable');
  eq(eiPackFeatures(EI_PACK_REGISTRY['NAFT-SYNTHETIC-EI@1']), {factor_bound_parameters: true, decimal_string_parameters: true, decimal_string_rule_values: false, expression_calculation: true, legacy_compatible: false}, 'extended Pack features detected');
  eq(compileEvidence(eiClaim('LEGACY-ON-EI'), EI_PACK_REGISTRY['NAFT-SYNTHETIC-EI@1']).document.evaluation.status, 'UNSUPPORTED', 'legacy compiler fails closed on extended Pack features');

  // Coefficient registry
  const base = EI_FACTORS[0];
  function f(over) { return Object.assign({}, base, over); }
  check(Object.isFrozen(EI_FACTOR_REGISTRY['SYN-EF@2026.1']), 'factor registry frozen');
  blocks(function() { createFactorRegistry([base, base]); }, 'EI_DUPLICATE_FACTOR_VERSION', 'duplicate coefficient version refused');
  blocks(function() { createFactorRegistry([f({version: 'x', supersedes: 'SYN-EF@missing'})]); }, 'EI_FACTOR_LINEAGE_BROKEN', 'supersedes must exist');
  blocks(function() { createFactorRegistry([base, f({version: 'a', supersedes: 'SYN-EF@2026.1'}), f({version: 'b', supersedes: 'SYN-EF@2026.1'})]); }, 'EI_FACTOR_LINEAGE_CONFLICT', 'branching supersession refused');
  blocks(function() { createFactorRegistry([f({version: 'a', supersedes: 'SYN-EF@b'}), f({version: 'b', supersedes: 'SYN-EF@a'})]); }, 'EI_FACTOR_LINEAGE_CONFLICT', 'cyclic supersession refused');
  blocks(function() { createFactorRegistry([base, f({factor_id: 'OTHER', version: 'a', supersedes: 'SYN-EF@2026.1'})]); }, 'EI_FACTOR_LINEAGE_BROKEN', 'supersession across coefficients refused');
  blocks(function() { createFactorRegistry([f({value: 'abc'})]); }, 'EI_INVALID_FACTOR_VALUE', 'synthetic coefficient needs a decimal value');
  blocks(function() { createFactorRegistry([f({value: 2.5})]); }, 'EI_INVALID_FACTOR_VALUE', 'coefficient value must be a decimal string');
  blocks(function() { createFactorRegistry([f({status: 'OFFICIAL'})]); }, 'EI_UNSUPPORTED_FACTOR_STATUS', 'no OFFICIAL coefficient status exists');
  blocks(function() { var x = f({}); delete x.effective_to; createFactorRegistry([x]); }, 'EI_FACTOR_FIELD_REQUIRED:effective_to', 'applicability period required');
  blocks(function() { createFactorRegistry([f({version: 'a@b'})]); }, 'EI_INVALID_FACTOR_ID', 'version cannot contain separator');
  eq(resolveFactor(EI_FACTOR_REGISTRY, 'SYN-EF', '2026-06-01', '2026-06-30').key, 'SYN-EF@2026.1', 'single effective version resolved');
  eq(resolveFactor(EI_FACTOR_REGISTRY_NEXT, 'SYN-EF', '2026-06-01', '2026-06-30'), {status: 'RESOLVED', factor_id: 'SYN-EF', key: 'SYN-EF@2026.2', version: '2026.2', superseded: ['SYN-EF@2026.1']}, 'superseding correction wins for the same period');
  eq(resolveFactor(EI_FACTOR_REGISTRY, 'SYN-EF', '2025-12-01', '2026-01-31').status, 'NOT_EFFECTIVE', 'period outside the effective window fails closed');
  eq(resolveFactor(EI_FACTOR_REGISTRY, 'NOPE', '2026-06-01', '2026-06-30').status, 'UNKNOWN_FACTOR', 'unknown coefficient');
  eq(resolveFactor(EI_FACTOR_REGISTRY, 'AG005-EF', '2026-06-01', '2026-06-30').status, 'NOT_EFFECTIVE', 'UNKNOWN effective period never resolves');
  eq(resolveFactor(EI_FACTOR_REGISTRY, 'SYN-EF', '2026-06-30', '2026-06-01').status, 'NOT_EFFECTIVE', 'reversed period fails closed');
  const halves = createFactorRegistry([f({version: 'h1', effective_to: '2026-06-30'}), f({version: 'h2', effective_from: '2026-07-01'})]);
  eq(resolveFactor(halves, 'SYN-EF', '2026-06-15', '2026-07-15').status, 'NOT_EFFECTIVE', 'period straddling two versions is not split');
  eq(resolveFactor(halves, 'SYN-EF', '2026-07-01', '2026-07-15').key, 'SYN-EF@h2', 'second window resolved');
  eq(resolveFactor(createFactorRegistry([f({version: 'p'}), f({version: 'q'})]), 'SYN-EF', '2026-06-01', '2026-06-30').status, 'AMBIGUOUS', 'overlapping unrelated versions are ambiguous');
  eq(EI_FACTOR_REGISTRY['AG005-EF@UNKNOWN'].status, 'CONFIG_REQUIRED', 'AG-005 coefficient explicitly absent');
  check(eiFactorRegistryHash(EI_FACTOR_REGISTRY) !== eiFactorRegistryHash(EI_FACTOR_REGISTRY_NEXT), 'registry hash changes with a new version');
  eq(eiFactorLineage(EI_FACTOR_REGISTRY_NEXT, 'SYN-EF').map(function(x) { return [x.version, x.supersedes]; }), [['2026.1', null], ['2026.2', 'SYN-EF@2026.1']], 'coefficient lineage');

  // Methodology candidates are advisory
  eq(eiPackCandidates(EI_PACK_REGISTRY, 'AG-005', '2026-06-01', '2026-06-30').status, 'NO_EFFECTIVE_VERSION', 'UNKNOWN effective period never matches');
  eq(eiPackCandidates(EI_PACK_REGISTRY, 'NAFT-SYNTHETIC', '2026-06-01', '2026-06-30').status, 'AMBIGUOUS_PIN_REQUIRED', 'undeclared supersession stays ambiguous');
  eq(eiPackCandidates(EI_PACK_REGISTRY, 'NAFT-SYNTHETIC-EI', '2026-06-01', '2026-06-30').candidates, ['NAFT-SYNTHETIC-EI@2'], 'declared supersession yields one candidate');
  eq(eiPackCandidates(EI_PACK_REGISTRY, 'NAFT-SYNTHETIC-EI', '2027-01-01', '2027-01-31').status, 'NO_EFFECTIVE_VERSION', 'outside window');
  const catalog = eiVersionCatalog(EI_PACK_REGISTRY, EI_FACTOR_REGISTRY_NEXT);
  eq([catalog.methodologies.length, catalog.factors.length], [6, 3], 'catalog lists every version');
  check(catalog.methodologies.every(function(m) { return /^[a-f0-9]{64}$/.test(m.pack_hash); }), 'catalog carries Pack hashes');

  // Evidence lineage
  var lineage = eiLineageAppend([], 'c1', 'm1', null); lineage = eiLineageAppend(lineage, 'c2', 'm1', 'change-1');
  check(eiLineageValid(lineage) && lineage[1].supersedes === lineage[0].revision_hash, 'evidence lineage links revisions');
  var broken = clone(lineage); broken[0].content_hash = 'tampered';
  check(!eiLineageValid(broken), 'tampered lineage detected');
  check(!eiLineageValid(lineage.slice(1)), 'truncated lineage detected');
})();

// ===== C. Engine equals the existing compiler ==============================================
const hundred = Array.from({length: 100}, function(_, i) { return syntheticClaim('EI-H-' + String(i + 1).padStart(3, '0'), i < 70 ? 'standard' : i < 85 ? 'intensive' : 'intensive_complete'); });
(function parity() {
  corpus.cases.forEach(function(c) {
    const before = canonicalize(c.input), state = eiBuild([c.input], ctx), id = c.input.activity.id, parity = eiLegacyParity(state, id, ctx);
    eq(parity.status, 'MATCH', 'corpus parity with compileEvidence ' + c.id + ' ' + parity.differences.join(','));
    eq(state.claims[id].status, c.expected.status, 'corpus expected status ' + c.id);
    eq(eiRecord(state, id).record.calculation.arithmetic_preview, c.expected.expected_arithmetic_preview, 'corpus arithmetic label ' + c.id);
    eq(canonicalize(c.input), before, 'input not mutated ' + c.id);
  });
  const state = eiBuild(hundred, ctx);
  check(hundred.every(function(c) { return eiLegacyParity(state, c.activity.id, ctx).status === 'MATCH'; }), '100 synthetic Claims agree with compileEvidence');
  eq(eiStateDigest(state), eiStateDigest(eiBuild(hundred.slice().reverse(), ctx)), 'state digest independent of Claim order');
  eq(eiStateDigest(state), eiStateDigest(eiBuild(clone(hundred), ctx)), 'build is reproducible');
  const permuted = clone(hundred[80]); permuted.evidence.reverse();
  eq(eiBuild([permuted], ctx).claims[permuted.activity.id].record_hash, state.claims[permuted.activity.id].record_hash, 'record independent of evidence order');
  eq(eiVerifyState(state, ctx).status, 'MATCH', 'full-rebuild oracle accepts a fresh state');

  // Institutional unknowns stay fail closed, certified result null
  const ag = syntheticClaim('AG-REF');
  ag.activity.methodology_id = 'AG-005'; ag.activity.methodology_version = '3.1-reference'; ag.activity.extension_days = 9;
  ag.evidence.forEach(function(e) { e.methodology_id = 'AG-005'; e.methodology_version = '3.1-reference'; });
  const agState = eiBuild([ag], ctx), agRecord = eiRecord(agState, 'AG-REF').record;
  eq([agRecord.evaluation.status, agRecord.calculation.result, agRecord.calculation.arithmetic_preview, agRecord.certified_result, agRecord.formal_certification], ['UNSUPPORTED', null, null, null, false], 'AG-005 reference stays UNSUPPORTED with null results');
  check(agRecord.evaluation.issues.some(function(i) { return i.code === 'official_configuration'; }) && agRecord.evaluation.issues.some(function(i) { return i.code === 'calculation_configuration'; }), 'CONFIG REQUIRED surfaced');
  eq(eiLegacyParity(agState, 'AG-REF', ctx).status, 'MATCH', 'AG-005 parity');
  const ag4 = syntheticClaim('AG4'); ag4.activity.methodology_id = 'AG-004'; ag4.activity.methodology_version = 'UNKNOWN';
  eq(eiBuild([ag4], ctx).claims.AG4.status, 'UNSUPPORTED', 'AG-004 fail closed');
  check(Object.keys(agState.claims).every(function(id) { return eiRecord(agState, id).record.calculation.result === null; }), 'no record carries a certified result');

  // Boundary validation
  blocks(function() { eiBuild([syntheticClaim('A'), syntheticClaim('A')], ctx); }, 'EI_DUPLICATE_CLAIM_ID', 'duplicate Claim refused');
  blocks(function() { const x = syntheticClaim('X'); x.activity.methodology_version = '99'; eiBuild([x], ctx); }, 'EI_UNKNOWN_PACK', 'unknown exact version refused, never "latest"');
  blocks(function() { const x = syntheticClaim('X'); x.field.area_ha = NaN; eiBuild([x], ctx); }, 'EI_NON_CANONICAL_INPUT', 'NaN refused instead of hashing as null');
  blocks(function() { const x = syntheticClaim('X'); x.activity.days = Infinity; eiBuild([x], ctx); }, 'EI_NON_CANONICAL_INPUT', 'Infinity refused');
  check(canonicalize({a: NaN}) === canonicalize({a: null}), 'documented legacy limitation: canonicalize maps NaN to null');
  blocks(function() { eiBuild([{activity: {id: ''}, field: {}}], ctx); }, 'EI_CLAIM_ID_REQUIRED', 'Claim id required');
  blocks(function() { eiBuild([{}], ctx); }, 'EI_IDENTITY_REQUIRED', 'identity required');
  blocks(function() { eiBuild('nope', ctx); }, 'EI_CLAIMS_LIMIT', 'claims must be a list');
  blocks(function() { eiBuild([], null); }, 'EI_CONTEXT_REQUIRED', 'context required');
})();

// ===== D. Fine-grained dependency graph ====================================================
(function graph() {
  const claim = syntheticClaim('G1', 'intensive_complete'), state = eiBuild([claim, syntheticClaim('G2')], ctx), g = eiGraph(state), index = eiGraphIndex(g);
  eq(eiValidateGraph(g).status, 'VALID', 'graph has no dangling edge and no cycle');
  const kinds = new Set(g.nodes.map(function(n) { return n.kind; }));
  ['pack', 'source', 'rule', 'requirement', 'parameter', 'calculation_spec', 'identity', 'attribute', 'evidence_content', 'evidence_meta', 'evidence_digest', 'manifest', 'evidence_check', 'condition', 'parameter_value', 'parameter_check',
    'rule_result', 'requirement_result', 'exception_result', 'calculation', 'evaluation', 'input_root', 'record', 'aggregate'].forEach(function(k) { check(kinds.has(k), 'graph node kind ' + k); });
  check(g.nodes.every(function(n) { return /^[a-f0-9]{64}$/.test(n.hash); }), 'every node carries a content hash');
  const down = eiTrace(index, ['evidence_content:G1:G1-record'], 'downstream');
  check(['digest:G1:G1-record', 'manifest:G1:G1-record', 'reqres:G1:record', 'eval:G1', 'record:G1'].every(function(n) { return down.includes(n); }), 'evidence bytes reach requirement, evaluation and record');
  check(down.some(function(n) { return n.indexOf('aggregate:') === 0; }), 'evidence reaches the programme aggregate');
  check(!down.includes('calc:G1') && !down.includes('ruleres:G1:duration'), 'evidence bytes do NOT reach calculation or unrelated rules');
  check(!down.some(function(n) { return /:G2/.test(n); }), 'another Claim is not downstream of this evidence');
  const calcUp = eiTrace(index, ['calc:G1'], 'upstream');
  eq(calcUp, ['attr:G1:activity.days', 'attr:G1:field.area_ha', 'calc:G1', 'calcspec:NAFT-SYNTHETIC@1', 'param:G1:factor', 'parameter:NAFT-SYNTHETIC@1:factor'], 'calculation depends exactly on its inputs, coefficient and specification');
  const legacyGraph = compileEvidence(claim, ctx.packs['NAFT-SYNTHETIC@1']).document.provenance_graph;
  check(traceDependents(legacyGraph, ['evidence:G1-record']).includes('calculation:G1'), 'legacy activity-scope graph conservatively links evidence to calculation');
  const areaDown = eiTrace(index, ['attr:G1:field.area_ha'], 'downstream');
  check(areaDown.includes('ruleres:G1:area') && areaDown.includes('calc:G1') && !areaDown.includes('ruleres:G1:duration') && !areaDown.includes('reqres:G1:record'), 'field area reaches only the area rule and the calculation');
  const sharedDown = eiTrace(index, ['parameter:NAFT-SYNTHETIC@1:factor'], 'downstream');
  check(sharedDown.includes('calc:G1') && sharedDown.includes('calc:G2'), 'a shared coefficient reaches every Claim that uses it');
  check(!eiTrace(index, ['parameter:NAFT-SYNTHETIC@1:unused'], 'downstream').some(function(n) { return /^(calc|eval|ruleres):/.test(n); }), 'an unused parameter reaches no calculation, rule or evaluation');
  eq(eiDependencyPath(index, 'evidence_content:G1:G1-sensor', 'reqres:G1:record'), null, 'sensor evidence has no path to the record requirement');
  eq(eiDependencyPath(index, 'evidence_content:G1:G1-record', 'eval:G1'), ['evidence_content:G1:G1-record', 'digest:G1:G1-record', 'manifest:G1:G1-record', 'evcheck:G1:G1-record', 'eval:G1'], 'shortest dependency path');
  eq(eiDependencyPath(index, 'record:G1', 'calc:G1'), null, 'no path against edge direction');
  blocks(function() { eiTrace(index, ['nope'], 'downstream'); }, 'UNKNOWN_GRAPH_NODE', 'unknown seed refused');
  blocks(function() { eiTrace(index, ['calc:G1'], 'sideways'); }, 'EI_UNKNOWN_DIRECTION', 'unknown direction refused');
  const order = eiTopologicalOrder(index), position = new Map(order.map(function(id, i) { return [id, i]; }));
  check(g.edges.every(function(e) { return position.get(e.from) < position.get(e.to); }), 'topological order respects every edge');
  const cyclic = clone(g); cyclic.edges.push({from: 'record:G1', to: 'attr:G1:field.area_ha', type: 'tamper'});
  blocks(function() { eiValidateGraph(cyclic); }, 'EI_GRAPH_CYCLE', 'cycle detected');
  const dangling = clone(g); dangling.edges.push({from: 'ghost', to: 'record:G1', type: 'tamper'});
  blocks(function() { eiValidateGraph(dangling); }, 'EI_DANGLING_GRAPH_EDGE', 'dangling edge detected');
  const duplicate = clone(g); duplicate.nodes.push(duplicate.nodes[0]);
  blocks(function() { eiValidateGraph(duplicate); }, 'EI_DUPLICATE_GRAPH_NODE', 'duplicate node detected');
  eq(eiGraph(state), eiGraph(eiBuild([syntheticClaim('G2'), claim], ctx)), 'graph export deterministic and order independent');
  eq(eiGraph(state, ['G2']).nodes.filter(function(n) { return n.scope === 'claim:G1'; }).length, 0, 'graph can be restricted to selected Claims');
  // Every derived node was computed from its declared dependencies only: recomputing each one in isolation reproduces its hash.
  const c = state.claims.G1;
  check(c.order.filter(function(id) { return c.nodes[id].op; }).every(function(id) {
    const n = c.nodes[id], look = function(dep) { return c.nodes[dep] || state.shared[dep]; };
    const d = {one: function(r) { const x = n.deps.find(function(q) { return q.role === r; }); return x ? look(x.id).value : undefined; }, all: function(r) { return n.deps.filter(function(q) { return q.role === r; }).map(function(q) { return look(q.id).value; }); },
      has: function(r) { return n.deps.some(function(q) { return q.role === r; }); }, hash: function(r) { const x = n.deps.find(function(q) { return q.role === r; }); return x ? look(x.id).vh : undefined; },
      hashes: function(r) { return n.deps.filter(function(q) { return q.role === r; }).map(function(q) { return [q.id, look(q.id).vh]; }); }};
    return hashObject(EI_OPS[n.op](d, n.args)) === n.vh;
  }), 'each derived node is reproducible from its declared dependencies alone');
})();

// ===== E. Differential re-computation ======================================================
(function differential() {
  const fifty = Array.from({length: 50}, function(_, i) { return syntheticClaim('EI-D-' + String(i + 1).padStart(2, '0'), ['standard', 'intensive', 'intensive_complete', 'sensitive'][i % 4]); });
  const state = eiBuild(fifty, ctx), digest = eiStateDigest(state);
  function apply(s, change, context) { const out = eiApplyChange(s, change, context || ctx); eq(eiVerifyState(out.state, context || ctx).status, 'MATCH', 'incremental equals full rebuild after ' + change.type); return out; }

  // One evidence item among 50 Claims
  const target = fifty[2], replacement = clone(target.evidence.find(function(e) { return e.category === 'sensor'; })); replacement.content = JSON.stringify(Object.assign(JSON.parse(replacement.content), {revision: 2})); replacement.expected_hash = digestText(replacement.content);
  const ev = apply(state, {type: 'evidence', activity_id: target.activity.id, evidence_id: replacement.id, replacement: replacement});
  eq([ev.delta.counts.examined, ev.delta.counts.untouched], [1, 49], 'one evidence change examines one Claim');
  eq(ev.delta.claims[0].classification, 'PROVENANCE_ONLY', 'verified replacement of the same category changes provenance, not semantics');
  check(ev.delta.claims[0].recomputed_nodes.includes('digest:' + target.activity.id + ':' + replacement.id) && !ev.delta.claims[0].recomputed_nodes.includes('calc:' + target.activity.id), 'only the affected evidence chain is recomputed');
  check(ev.delta.claims[0].cutoff_nodes.includes('evcheck:' + target.activity.id + ':' + replacement.id) && !ev.delta.claims[0].recomputed_nodes.some(function(n) { return /^(reqres|ruleres):/.test(n); }), 'early cutoff: the evidence check is unchanged and v1 has no sensor requirement to re-evaluate');
  check(ev.delta.counts.nodes_recomputed < ev.delta.claims[0].nodes_total / 3, 'most nodes of the affected Claim are reused');
  eq(eiStateDigest(state), digest, 'previous state is not modified');
  check(Object.keys(state.claims).filter(function(id) { return id !== target.activity.id; }).every(function(id) { return ev.state.claims[id] === state.claims[id]; }), 'untouched Claims are shared structurally, not recomputed');
  eq(ev.state.claims[target.activity.id].evidence_lineage[replacement.id].length, 2, 'evidence revision recorded');
  check(eiLineageValid(ev.state.claims[target.activity.id].evidence_lineage[replacement.id]), 'evidence lineage valid');
  eq(ev.state.claims[target.activity.id].history.map(function(h) { return h.record_hash; }), [state.claims[target.activity.id].record_hash], 'superseded record retained in history');

  // Tampered content is a semantic change
  const tampered = clone(target.evidence[0]); tampered.content += '-tamper';
  const tam = apply(state, {type: 'evidence', activity_id: target.activity.id, evidence_id: tampered.id, replacement: tampered});
  eq([tam.delta.claims[0].classification, tam.delta.claims[0].status_after], ['SEMANTIC_CHANGE', 'UNSUPPORTED'], 'hash mismatch is a semantic change and blocks');
  eq(apply(state, {type: 'evidence', activity_id: target.activity.id, evidence_id: target.evidence[0].id, replacement: clone(target.evidence[0])}).delta.claims[0].classification, 'NO_OP', 'identical replacement is a no-op');
  const meta = clone(target.evidence[0]); meta.source = 'urn:naft:other-source';
  eq(apply(state, {type: 'evidence', activity_id: target.activity.id, evidence_id: meta.id, replacement: meta}).delta.claims[0].classification, 'PROVENANCE_ONLY', 'source metadata change is provenance only');

  // Add / withdraw evidence
  const missing = fifty[1], added = apply(state, {type: 'evidence_add', activity_id: missing.activity.id, evidence: evidenceItem(missing, 'sensor', 'iot-json-v1')});
  eq(added.delta.claims[0].classification, 'PROVENANCE_ONLY', 'evidence not required by v1 changes provenance only');
  const withdrawn = apply(state, {type: 'evidence_withdraw', activity_id: missing.activity.id, evidence_id: missing.activity.id + '-photo'});
  eq([withdrawn.delta.claims[0].classification, withdrawn.delta.claims[0].status_after], ['SEMANTIC_CHANGE', 'EVIDENCE_REQUIRED'], 'withdrawing required evidence blocks');
  check(withdrawn.delta.claims[0].removed_nodes.includes('manifest:' + missing.activity.id + ':' + missing.activity.id + '-photo'), 'withdrawn evidence nodes removed from the graph');
  blocks(function() { eiApplyChange(state, {type: 'evidence_add', activity_id: missing.activity.id, evidence: clone(missing.evidence[0])}, ctx); }, 'EI_EVIDENCE_ID_CONFLICT', 'adding an existing evidence id refused');
  blocks(function() { eiApplyChange(state, {type: 'evidence_withdraw', activity_id: missing.activity.id, evidence_id: 'nope'}, ctx); }, 'EVIDENCE_NOT_FOUND', 'withdrawing unknown evidence refused');
  blocks(function() { eiApplyChange(state, {type: 'evidence', activity_id: missing.activity.id, evidence_id: 'nope', replacement: {}}, ctx); }, 'EVIDENCE_NOT_FOUND', 'replacing unknown evidence refused');

  // Methodology transition agrees with the legacy analyzer, Claim by Claim
  const change = {type: 'methodology', old_key: 'NAFT-SYNTHETIC@1', new_key: 'NAFT-SYNTHETIC@2'};
  const hundredState = eiBuild(hundred, ctx), migrated = apply(hundredState, change), legacy = analyzeImpact(hundred, change);
  eq(migrated.delta.claims.filter(function(r) { return r.requires_reverification; }).map(function(r) { return r.claim_id; }), legacy.claims.filter(function(r) { return r.requires_reverification; }).map(function(r) { return r.claim_id; }), 're-verification set equals the legacy analyzer on 100 Claims');
  eq(migrated.delta.claims.map(function(r) { return [r.claim_id, r.status_after]; }), legacy.claims.map(function(r) { return [r.claim_id, r.requires_reverification ? r.status : r.successor ? r.status : compileEvidence(r.next_input, r.next_pack).document.evaluation.status]; }), 'status after transition equals the legacy compiler');
  check(migrated.delta.claims.every(function(r) { return r.human_decisions_stale === true; }), 'human decisions are stale for every changed record');
  check(hundred.every(function(c) { return eiLegacyParity(migrated.state, c.activity.id, ctx).status === 'MATCH'; }), 'migrated state agrees with compileEvidence on v2');
  check(migrated.delta.counts.nodes_reused > 0 && migrated.delta.claims.every(function(r) { return r.recomputed_nodes.length < r.nodes_total; }), 'a version transition reuses part of every Claim');
  check(migrated.delta.claims.every(function(r) { return !r.recomputed_nodes.some(function(n) { return /^(digest|calc):/.test(n); }); }), 'a version transition re-digests no evidence bytes and repeats no calculation');
  check(migrated.delta.claims.filter(function(r) { return r.classification === 'PROVENANCE_ONLY'; }).every(function(r) { return r.cutoff_nodes.includes('idcheck:' + r.claim_id) && r.cutoff_nodes.includes('reqres:' + r.claim_id + ':record'); }), 'unaffected Claims are cut off at unchanged identity and requirement results');
  eq(eiApplyChange(hundredState, change, ctx).delta, migrated.delta, 'delta is reproducible');
  blocks(function() { eiApplyChange(state, {type: 'methodology', old_key: 'NAFT-SYNTHETIC@1', new_key: 'NAFT-SYNTHETIC@9'}, ctx); }, 'UNKNOWN_TARGET_PACK', 'unknown target version refused');
  blocks(function() { eiApplyChange(state, {type: 'methodology', old_key: 'NAFT-SYNTHETIC@1', new_key: 'AG-004@UNKNOWN'}, ctx); }, 'DIFFERENT_METHODOLOGIES', 'cross-methodology transition refused');

  // Parameter, field, activity
  const used = apply(state, {type: 'parameter', pack_key: 'NAFT-SYNTHETIC@1', parameter: 'factor', value: 3});
  check(used.delta.claims.every(function(r) { return r.classification === 'SEMANTIC_CHANGE' && /HUMAN_REVIEW_REQUIRED|UNSUPPORTED|EVIDENCE_REQUIRED/.test(r.status_after); }), 'material override of a used parameter requires human judgement');
  const unused = apply(state, {type: 'parameter', pack_key: 'NAFT-SYNTHETIC@1', parameter: 'unused', value: 9});
  check(unused.delta.claims.every(function(r) { return r.classification === 'PROVENANCE_ONLY' && r.recomputed_nodes.indexOf('calc:' + r.claim_id) < 0; }), 'unused parameter override never reaches the calculation');
  blocks(function() { eiApplyChange(state, {type: 'parameter', pack_key: 'NAFT-SYNTHETIC@1', parameter: 'nope', value: 1}, ctx); }, 'UNKNOWN_PARAMETER', 'unknown parameter refused');
  const field = apply(state, {type: 'field', field_id: fifty[0].field.id, patch: {area_ha: 3}});
  eq([field.delta.counts.examined, field.delta.claims[0].classification, field.delta.claims[0].preview_after], [1, 'SEMANTIC_CHANGE', '60'], 'field area revision recalculates exactly one Claim');
  check(!field.delta.claims[0].recomputed_nodes.some(function(n) { return /^(digest|manifest|reqres):/.test(n); }), 'field revision does not re-verify evidence');
  const activity = apply(state, {type: 'activity', activity_id: fifty[0].activity.id, patch: {days: 5}});
  eq([activity.delta.claims[0].classification, activity.delta.claims[0].status_after], ['SEMANTIC_CHANGE', 'UNSUPPORTED'], 'activity revision below threshold fails deterministically');
  eq(apply(state, {type: 'activity', activity_id: fifty[0].activity.id, patch: {note: 'unreferenced attribute'}}).delta.claims[0].classification, 'PROVENANCE_ONLY', 'unreferenced attribute changes provenance only');
  blocks(function() { eiApplyChange(state, {type: 'activity', activity_id: fifty[0].activity.id, patch: {field_id: 'OTHER'}}, ctx); }, 'ACTIVITY_IDENTITY_CHANGE_UNSUPPORTED', 'identity rewrite refused');
  blocks(function() { eiApplyChange(state, {type: 'field', field_id: fifty[0].field.id, patch: {id: 'OTHER'}}, ctx); }, 'EI_FIELD_IDENTITY_CHANGE_UNSUPPORTED', 'field id rewrite refused');
  blocks(function() { eiApplyChange(state, {type: 'activity', activity_id: fifty[0].activity.id, patch: JSON.parse('{"__proto__":{"polluted":true}}')}, ctx); }, 'UNSAFE_CHANGE_PATCH_KEY', 'prototype pollution key refused');
  check(({}).polluted === undefined, 'prototype not polluted');
  blocks(function() { eiApplyChange(state, {type: 'activity', activity_id: 'nope', patch: {days: 1}}, ctx); }, 'EI_CLAIM_NOT_FOUND', 'unknown Claim refused');
  blocks(function() { eiApplyChange(state, {type: 'explanation', text: 'x'}, ctx); }, 'EI_UNSUPPORTED_CHANGE_TYPE', 'an explanation cannot be submitted as a change');
  blocks(function() { eiApplyChange(state, {type: 'activity', activity_id: fifty[0].activity.id, patch: {days: NaN}}, ctx); }, 'EI_NON_CANONICAL_INPUT', 'non-finite patch refused');
  blocks(function() { eiApplyChange(state, {type: 'field', field_id: 'x', patch: {area_ha: 1}}, ctxNext); }, 'EI_FACTOR_REGISTRY_MISMATCH', 'a different coefficient registry requires an explicit registry change');
  blocks(function() { eiApplyChange({}, {type: 'field', field_id: 'x', patch: {}}, ctx); }, 'EI_INVALID_STATE', 'invalid state refused');
  const conflicting = clone(COMPILER_REGISTRY['NAFT-SYNTHETIC@1']); conflicting.parameters.factor.value = 99;
  const forged = {packs: Object.assign({}, EI_PACK_REGISTRY, {'NAFT-SYNTHETIC@1': conflicting}), factors: EI_FACTOR_REGISTRY};
  blocks(function() { eiApplyChange(state, {type: 'activity', activity_id: fifty[0].activity.id, patch: {days: 11}}, forged); }, 'EI_PACK_IDENTITY_CONFLICT', 'a Pack with the same key but different content is refused');
  eq(eiStateDigest(state), digest, 'state unchanged after every experiment above');

  // Corrupted state is caught by the full-rebuild oracle
  const corrupted = Object.assign({}, state, {claims: Object.assign({}, state.claims)});
  const victim = fifty[0].activity.id, bad = Object.assign({}, state.claims[victim], {record_hash: '0'.repeat(64)});
  corrupted.claims[victim] = bad;
  eq(eiVerifyState(corrupted, ctx).mismatches, [victim], 'full-rebuild oracle detects a corrupted record');

  // Deterministic pseudo-random change sequence: after every step incremental == full
  const random = lcg(20261114), pool = Array.from({length: 24}, function(_, i) { return syntheticClaim('EI-R-' + String(i + 1).padStart(2, '0'), ['standard', 'intensive', 'intensive_complete', 'expert'][i % 4]); });
  var current = eiBuild(pool, ctx), steps = 0, semantic = 0, provenance = 0, noop = 0;
  for(var step = 0; step < 60; step++) {
    const id = Object.keys(current.claims).sort()[Math.floor(random() * 24)], c = current.claims[id], roll = Math.floor(random() * 6);
    var ch;
    if(roll === 0) ch = {type: 'activity', activity_id: id, patch: {days: 4 + Math.floor(random() * 10)}};
    else if(roll === 1) ch = {type: 'field', field_id: c.input.field.id, patch: {area_ha: 1 + Math.floor(random() * 5) / 2}};
    else if(roll === 2) ch = {type: 'activity', activity_id: id, patch: {stratum: random() < 0.5 ? 'intensive' : 'standard'}};
    else if(roll === 3) { const e = clone(c.input.evidence[0]); e.source = 'urn:naft:step-' + step; ch = {type: 'evidence', activity_id: id, evidence_id: e.id, replacement: e}; }
    else if(roll === 4) { const e2 = clone(c.input.evidence[0]); e2.content += '.'; if(random() < 0.5) e2.expected_hash = digestText(e2.content); ch = {type: 'evidence', activity_id: id, evidence_id: e2.id, replacement: e2}; }
    else ch = {type: 'parameter', pack_key: c.pack_key, parameter: random() < 0.5 ? 'unused' : 'minimum_days', value: 6 + Math.floor(random() * 3)};
    const out = eiApplyChange(current, ch, ctx);
    out.delta.claims.forEach(function(r) { if(r.classification === 'SEMANTIC_CHANGE') semantic++; else if(r.classification === 'PROVENANCE_ONLY') provenance++; else noop++; });
    current = out.state; steps++;
    if(eiVerifyState(current, ctx).status !== 'MATCH') { check(false, 'random sequence diverged at step ' + step + ' ' + ch.type); break; }
  }
  check(steps === 60 && semantic > 0 && provenance > 0, '60-step change sequence stays equal to a full rebuild at every step (non-vacuous)');
  check(Object.keys(current.claims).every(function(id) { return eiLegacyParity(current, id, ctx).status === 'MATCH'; }), 'final state of the sequence agrees with compileEvidence');
  check(Object.keys(current.claims).every(function(id) { return Object.keys(current.claims[id].evidence_lineage).every(function(e) { return eiLineageValid(current.claims[id].evidence_lineage[e]); }); }), 'evidence lineages remain valid through the sequence');

  // Aggregates: exact, incremental, never mixed across context or unit
  const mixed = [syntheticClaim('AGG-1'), syntheticClaim('AGG-2'), eiClaim('AGG-3', undefined, 2.35, 10), eiClaim('AGG-4', undefined, 0.1, 7)];
  mixed[1].activity.program_id = mixed[1].field.program_id = 'OTHER-PROGRAM';
  const agg = eiBuild(mixed, ctx), view = eiAggregateView(agg);
  eq(view.map(function(a) { return [a.program_id, a.methodology_id, a.claims, a.preview_total]; }), [['OTHER-PROGRAM', 'NAFT-SYNTHETIC', 1, '40'], ['SYNTHETIC-PROGRAM', 'NAFT-SYNTHETIC-EI', 2, '0.0605'], ['SYNTHETIC-PROGRAM', 'NAFT-SYNTHETIC', 1, '40']], 'aggregates are separated by programme and methodology');
  check(view.every(function(a) { return a.certified_total === null; }), 'aggregate certified total is null');
  eq(view[1].preview_total, eiRatText(eiRatAdd(eiDecimal('0.05875'), eiDecimal('0.00175'))), 'exact aggregate equals the independently summed previews');
  const other = clone(COMPILER_REGISTRY['NAFT-SYNTHETIC@1']); other.methodology_id = 'NAFT-SYNTHETIC-B'; other.calculation_spec.unit = 'other-index';
  const unitCtx = {packs: createMethodologyRegistry(VERSIONED_PACKS.concat(EI_PACKS, [other])), factors: EI_FACTOR_REGISTRY};
  const b = syntheticClaim('AGG-B'); b.activity.methodology_id = 'NAFT-SYNTHETIC-B'; b.evidence.forEach(function(e) { e.methodology_id = 'NAFT-SYNTHETIC-B'; });
  eq(eiAggregateView(eiBuild([syntheticClaim('AGG-A'), b], unitCtx)).map(function(a) { return [a.unit, a.claims]; }), [['other-index', 1], ['synthetic-index', 1]], 'different units are never summed together');
  const aggChanged = eiApplyChange(agg, {type: 'activity', activity_id: 'AGG-1', patch: {days: 5}}, ctx);
  eq(eiAggregateView(aggChanged.state), eiAggregateView(eiBuild(Object.keys(aggChanged.state.claims).sort().map(function(id) { return aggChanged.state.claims[id].input; }), ctx)), 'incrementally maintained aggregate equals a full recomputation');
  eq(eiAggregateView(aggChanged.state).filter(function(a) { return a.program_id === 'SYNTHETIC-PROGRAM' && a.methodology_id === 'NAFT-SYNTHETIC'; }).map(function(a) { return [a.by_status, a.preview_claims, a.preview_total]; }), [[{UNSUPPORTED: 1}, 0, '0']], 'a blocked Claim leaves the preview total');
})();

// ===== F. Exact arithmetic + versioned coefficient Pack ====================================
(function extended() {
  const claims = [eiClaim('EX-1', undefined, 2.35, 10), eiClaim('EX-2', 'intensive_complete', 1.1, 9), eiClaim('EX-3', 'intensive', 3, 12), syntheticClaim('EX-L')];
  const state = eiBuild(claims, ctx), r1 = eiRecord(state, 'EX-1').record;
  // Independent expectation with BigInt: area * days * 2.5 * 0.001 at 6 dp
  function expected(area, days, factor) { const scaled = BigInt(Math.round(area * 100)) * BigInt(days) * BigInt(Math.round(factor * 10)); return eiRatText(eiRat(scaled, 1000000n)); }
  eq([r1.evaluation.status, r1.calculation.exact, r1.calculation.unit_check, r1.calculation.result], ['AUTO_REEVALUATED', expected(2.35, 10, 2.5), 'CONSISTENT', null], 'exact preview with coefficient 2026.1');
  eq(r1.factors.map(function(f) { return [f.parameter, f.factor_id, f.version, f.value, f.status]; }), [['synthetic_factor', 'SYN-EF', '2026.1', '2.5', 'SYNTHETIC']], 'record names the coefficient version used');
  eq(eiRecord(state, 'EX-2').record.calculation.exact, expected(1.1, 9, 2.5), 'second exact preview');
  eq(eiRecord(state, 'EX-3').record.evaluation.status, 'EVIDENCE_REQUIRED', 'conditional sensor requirement applies to intensive Claims');
  eq(eiLegacyParity(state, 'EX-1', ctx).status, 'NOT_APPLICABLE', 'extended Pack is outside legacy parity and says so');
  eq(eiLegacyParity(state, 'EX-L', ctx).status, 'MATCH', 'legacy Claim in the same state still matches');
  eq(r1.calculation.trace.filter(function(s) { return s.kind === 'op'; }).map(function(s) { return s.op; }), ['mul', 'round'], 'calculation trace recorded');

  // Coefficient correction: only Claims bound to the coefficient are re-examined
  const corrected = eiApplyChange(state, {type: 'factor_registry'}, ctxNext);
  eq(corrected.delta.claims.map(function(r) { return [r.claim_id, r.classification]; }), [['EX-1', 'SEMANTIC_CHANGE'], ['EX-2', 'SEMANTIC_CHANGE'], ['EX-3', 'SEMANTIC_CHANGE']], 'coefficient correction re-examines exactly the Claims bound to that coefficient');
  eq(corrected.delta.claims[2].status_after, 'EVIDENCE_REQUIRED', 'a recalculated preview never unblocks missing evidence');
  eq(corrected.delta.counts.untouched, 1, 'legacy Claim untouched by the coefficient correction');
  eq([corrected.delta.claims[0].preview_before, corrected.delta.claims[0].preview_after], [expected(2.35, 10, 2.5), expected(2.35, 10, 2.4)], 'preview recalculated with coefficient 2026.2');
  eq(corrected.delta.claims[0].recomputed_nodes, ['param:EX-1:synthetic_factor', 'pcheck:EX-1:synthetic_factor', 'calc:EX-1', 'eval:EX-1', 'record:EX-1'], 'coefficient change recomputes only the coefficient chain');
  eq(eiVerifyState(corrected.state, ctxNext).status, 'MATCH', 'coefficient correction equals a full rebuild');
  eq(eiVerifyState(corrected.state, ctx).status, 'MISMATCH', 'the state does not verify against the superseded registry');
  eq(eiRecord(corrected.state, 'EX-1').record.factors[0].version, '2026.2', 'record names the corrected coefficient');
  eq(eiApplyChange(corrected.state, {type: 'factor_registry'}, ctxNext).delta.counts.examined, 0, 're-applying the same registry examines nothing');

  // Fail closed variants
  function withPack(mutate, factors) {
    const p = clone(EI_PACK_REGISTRY['NAFT-SYNTHETIC-EI@1']); p.methodology_version = 'x'; mutate(p);
    const c = eiClaim('EX-X', undefined, 2, 10); c.activity.methodology_version = 'x'; c.evidence.forEach(function(e) { e.methodology_version = 'x'; });
    const s = eiBuild([c], {packs: createMethodologyRegistry([p]), factors: factors || EI_FACTOR_REGISTRY});
    return eiRecord(s, 'EX-X').record;
  }
  var r = withPack(function(p) { p.calculation_spec.unit_dimensions = {t_CO2e: 1}; });
  eq([r.evaluation.status, r.calculation.arithmetic_preview, r.calculation.unit_check], ['UNSUPPORTED', null, 'MISMATCH'], 'declared unit mismatch blocks the calculation');
  r = withPack(function(p) { p.parameters.synthetic_factor.factor_ref = 'AG005-EF'; });
  eq([r.evaluation.status, r.calculation.arithmetic_preview], ['UNSUPPORTED', null], 'CONFIG_REQUIRED coefficient blocks the calculation');
  check(r.evaluation.issues.some(function(i) { return i.code === 'factor_resolution:synthetic_factor'; }), 'unresolved coefficient is reported');
  r = withPack(function(p) { p.parameters.synthetic_factor.factor_ref = 'REF-EF'; }, createFactorRegistry([Object.assign({}, EI_FACTORS[0], {factor_id: 'REF-EF', status: 'REFERENCE'})]));
  check(r.evaluation.status === 'UNSUPPORTED' && r.evaluation.issues.some(function(i) { return i.code === 'factor_configuration:synthetic_factor'; }), 'a REFERENCE coefficient is never executed');
  r = withPack(function(p) { p.calculation_spec.expression.args[0].args.push({op: 'exp', args: [{const: 1}]}); });
  eq([r.evaluation.status, r.calculation.error_code], ['UNSUPPORTED', 'UNSUPPORTED_OPERATION'], 'unknown expression operation not executed');
  r = withPack(function(p) { p.calculation_spec.expression = {op: 'div', args: [{input: 'field.area_ha'}, {const: 3}]}; delete p.calculation_spec.unit_dimensions; });
  eq(r.calculation.error_code, 'NON_TERMINATING_RESULT_REQUIRES_ROUNDING', 'a non-terminating result must declare rounding');
  r = withPack(function(p) { p.calculation_spec.expression.args[0].args[0] = {input: 'field.missing'}; });
  eq(r.calculation.error_code, 'MISSING_INPUT', 'missing calculation input fails closed');
  const straddle = eiClaim('EX-S', undefined, 2, 10); straddle.activity.end = '2027-01-05';
  check(eiRecord(eiBuild([straddle], ctx), 'EX-S').record.evaluation.issues.some(function(i) { return i.code === 'factor_resolution:synthetic_factor'; }), 'activity period outside the coefficient window does not resolve');
  const overridden = eiApplyChange(state, {type: 'parameter', pack_key: 'NAFT-SYNTHETIC-EI@1', parameter: 'synthetic_factor', value: '9.9'}, ctx);
  eq(eiRecord(overridden.state, 'EX-1').record.evaluation.status, 'HUMAN_REVIEW_REQUIRED', 'overriding a versioned coefficient requires human judgement');

  // Extended methodology transition v1 -> v2
  const transition = eiApplyChange(state, {type: 'methodology', old_key: 'NAFT-SYNTHETIC-EI@1', new_key: 'NAFT-SYNTHETIC-EI@2'}, ctx);
  eq(transition.delta.claims.map(function(x) { return [x.claim_id, x.classification, x.status_after]; }), [['EX-1', 'PROVENANCE_ONLY', 'AUTO_REEVALUATED'], ['EX-2', 'SEMANTIC_CHANGE', 'AUTO_REEVALUATED'], ['EX-3', 'SEMANTIC_CHANGE', 'EVIDENCE_REQUIRED']], 'extended version transition is selective');
  eq(eiVerifyState(transition.state, ctx).status, 'MATCH', 'extended transition equals a full rebuild');
})();

// ===== G. Grounded reports =================================================================
(function reports() {
  const claims = [eiClaim('RP-1', undefined, 2.35, 10), syntheticClaim('RP-2', 'intensive')], state = eiBuild(claims, ctx), report = eiClaimReport(state, 'RP-1');
  eq(eiVerifyReport(state, report).status, 'VERIFIED', 'report verifies against its state');
  check(report.statements.length > 8 && report.statements.every(function(s) { return s.grounds.length > 0 && s.grounds.every(function(g) { return /^[a-f0-9]{64}$/.test(g.hash); }); }), 'every statement is grounded in hashed graph nodes');
  eq([report.boundary.is_ghg_inventory, report.boundary.is_credit_certification, report.boundary.formal_certification, report.boundary.certified_result, report.boundary.disclaimer === DISCLAIMER], [false, false, false, null, true], 'report boundary is explicit');
  check(report.boundary.standards_scope.some(function(s) { return s.id === 'GHGP-LSRS' && s.accounting_context === 'CORPORATE_INVENTORY' && s.naft_use === 'SCOPE_REFERENCE_ONLY'; }), 'report states that the inventory standard is a scope reference only');
  const calc = report.statements.find(function(s) { return s.kind === 'calculation'; });
  eq([calc.values.exact, calc.values.result], ['0.05875', null], 'calculation statement carries the exact preview and a null result');
  check(calc.grounds.some(function(g) { return g.node === 'param:RP-1:synthetic_factor'; }) && report.statements.some(function(s) { return s.kind === 'factor' && s.grounds.some(function(g) { return g.node === 'factor:SYN-EF@2026.1'; }); }), 'coefficient version is cited as a ground');
  eq(eiClaimReport(state, 'RP-1'), report, 'report generation deterministic');
  check(eiClaimReport(state, 'RP-1', {locale: 'en'}).report_hash !== report.report_hash && eiVerifyReport(state, eiClaimReport(state, 'RP-1', {locale: 'en'})).status === 'VERIFIED', 'English report verifies separately');
  blocks(function() { eiClaimReport(state, 'RP-1', {locale: 'fr'}); }, 'EI_UNSUPPORTED_LOCALE', 'unsupported locale refused');
  // Tamper / stale
  var t = clone(report); t.statements[5].text += ' (edited)';
  check(eiVerifyReport(state, t).failures.includes('REPORT_HASH_MISMATCH'), 'edited statement detected');
  t = clone(report); t.statements[4].grounds[0].hash = '0'.repeat(64); delete t.report_hash; t.report_hash = hashObject(t);
  check(eiVerifyReport(state, t).failures.some(function(f) { return f.indexOf('GROUND_MISMATCH') === 0; }), 're-sealed report with a false ground detected');
  t = clone(report); t.statements[3].grounds = []; delete t.report_hash; t.report_hash = hashObject(t);
  check(eiVerifyReport(state, t).failures.some(function(f) { return f.indexOf('UNGROUNDED_STATEMENT') === 0; }), 'ungrounded statement detected');
  t = clone(report); t.statements.pop(); delete t.report_hash; t.report_hash = hashObject(t);
  check(eiVerifyReport(state, t).failures.includes('REPORT_NOT_REPRODUCIBLE_FROM_STATE'), 'omitted statement detected');
  const changed = eiApplyChange(state, {type: 'field', field_id: claims[0].field.id, patch: {area_ha: 3}}, ctx);
  eq(eiVerifyReport(changed.state, report).status, 'STALE_OR_TAMPERED', 'report is stale after its inputs change');
  eq(eiVerifyReport(changed.state, eiClaimReport(changed.state, 'RP-1')).status, 'VERIFIED', 'a new report verifies against the new state');
  eq(eiClaimReport(changed.state, 'RP-1').lineage.superseded_records.map(function(x) { return x.record_hash; }), [state.claims['RP-1'].record_hash], 'report links the superseded record');
  eq(eiVerifyReport(state, {}).status, 'STALE_OR_TAMPERED', 'invalid report rejected');
  // Accounting-context guards
  blocks(function() { eiClaimReport(state, 'RP-1', {intended_use: 'CORPORATE_INVENTORY'}); }, 'EI_INVENTORY_ACCOUNTING_NOT_IMPLEMENTED', 'no report can be issued as a GHG inventory');
  blocks(function() { eiClaimReport(state, 'RP-1', {intended_use: 'PROJECT_CREDITING_PRECHECK'}); }, 'EI_ACCOUNTING_CONTEXT_MISMATCH', 'a synthetic result cannot be issued as a crediting pre-check');
  const ag = syntheticClaim('RP-AG'); ag.activity.methodology_id = 'AG-005'; ag.activity.methodology_version = '3.1-reference'; ag.evidence.forEach(function(e) { e.methodology_id = 'AG-005'; e.methodology_version = '3.1-reference'; });
  const agState = eiBuild([ag], ctx), agReport = eiClaimReport(agState, 'RP-AG', {intended_use: 'PROJECT_CREDITING_PRECHECK'});
  eq([agReport.boundary.accounting_context, agReport.statements.find(function(s) { return s.kind === 'calculation'; }).values.ok, agReport.boundary.certified_result], ['PROJECT_CREDITING', false, null], 'AG-005 pre-check report has no calculated quantity');
  blocks(function() { eiClaimReport(agState, 'RP-AG', {intended_use: 'CORPORATE_INVENTORY'}); }, 'EI_INVENTORY_ACCOUNTING_NOT_IMPLEMENTED', 'a crediting methodology result is never relabelled as an inventory');
  // Rendering
  const md = eiRenderReport(report);
  check(md === eiRenderReport(report) && md.indexOf('## 5. Calculation') > 0 && md.indexOf('step 4: mul(0, 1, 2, 3) = 0.05875') > 0 && md.indexOf(DISCLAIMER) > 0 && md.indexOf('grounds: `') > 0, 'markdown rendering is deterministic and carries grounds, trace and boundary');
  const second = eiClaimReport(state, 'RP-2');
  check(second.statements.some(function(s) { return s.kind === 'issue' && s.values.code === 'identity_ambiguity'; }) === false && second.unresolved.some(function(u) { return u.code === 'formal_external_verification'; }), 'unresolved items always include external verification');
  const blocked = eiClaimReport(eiBuild([syntheticClaim('RP-3', 'ambiguous')], ctx), 'RP-3');
  check(blocked.statements.some(function(s) { return s.kind === 'issue' && s.values.code === 'identity_ambiguity' && s.grounds[0].node === 'idcheck:RP-3'; }), 'an issue statement is grounded in the node that raised it');
  const impact = eiImpactReport(changed.delta);
  eq([impact.claims.length, impact.claims[0].because, impact.claims[0].human_decisions_stale, impact.boundary.formal_certification], [1, ['attr:RP-1:field.area_ha', 'rest:RP-1'], true, false], 'impact report names the changed inputs');
  const portfolio = eiPortfolioReport(state);
  eq([portfolio.claims, portfolio.boundary.certified_total, portfolio.boundary.is_ghg_inventory, portfolio.state_digest], [2, null, false, eiStateDigest(state)], 'portfolio report bound to the state digest');
})();

// ===== H. Explanation boundary =============================================================
(function explanation() {
  const state = eiBuild([eiClaim('XP-1', undefined, 2.35, 10)], ctx), recordHash = state.claims['XP-1'].record_hash, digest = eiStateDigest(state);
  const report = eiClaimReport(state, 'XP-1', {locale: 'en'}), context = eiExplanationContext(report), reportText = canonicalize(report);
  check(Object.isFrozen(context) && Object.isFrozen(context.facts) && context.facts.length === report.statements.length, 'explanation context is a frozen copy of the report facts');
  const template = eiTemplateExplanation(context);
  eq([template.authoritative, template.affects_calculation, template.generator.kind, eiVerifySidecar(context, template)], [false, false, 'deterministic-template', true], 'template explanation is a non-authoritative sidecar');
  check(template.statements.every(function(s) { return s.cites.length === 1; }), 'every template sentence cites a fact');
  const calcFact = context.facts.find(function(f) { return f.kind === 'calculation'; }), ruleFact = context.facts.find(function(f) { return f.kind === 'rule' && /duration/.test(f.text); });
  function draft(statements, over) { return Object.assign({context_hash: context.context_hash, generator: {name: 'external-test-model', version: '0'}, statements: statements}, over || {}); }
  const good = eiValidateExternalExplanation(context, draft([{text: 'The arithmetic preview is 0.05875 synthetic-index, computed from 2.35 ha over 10 days.', cites: [calcFact.fact_id]}, {text: 'The duration rule compares 10 days with the threshold 7.', cites: [ruleFact.fact_id]}]));
  eq([good.validation.status, good.authoritative, good.affects_calculation, good.generator.kind, good.statements.length], ['ACCEPTED_AS_NON_AUTHORITATIVE', false, false, 'external-model', 2], 'grounded external draft accepted only as non-authoritative');
  check(eiVerifySidecar(context, good), 'accepted sidecar is sealed to the context');
  function rejected(statements, code, label, over) {
    const out = eiValidateExternalExplanation(context, draft(statements, over));
    check(out.validation.status === 'REJECTED' && out.validation.violations.some(function(v) { return v.code === code; }) && out.statements.length === 0, label + ' (' + canonicalize(out.validation.violations) + ')');
  }
  rejected([{text: 'The arithmetic preview is 0.06 synthetic-index.', cites: [calcFact.fact_id]}], 'UNGROUNDED_NUMBER', 'a rounded or invented number is rejected');
  rejected([{text: 'The reduction is 12 tonnes.', cites: [calcFact.fact_id]}], 'UNGROUNDED_NUMBER', 'a number absent from the cited fact is rejected');
  rejected([{text: 'プレビューは０．０６です。', cites: [calcFact.fact_id]}], 'UNGROUNDED_NUMBER', 'full-width digits are normalized before checking');
  rejected([{text: 'The threshold is 7.', cites: [calcFact.fact_id]}], 'UNGROUNDED_NUMBER', 'a number from an uncited fact is rejected');
  rejected([{text: 'The preview is 0.05875.', cites: ['S999']}], 'MISSING_OR_UNKNOWN_CITATION', 'unknown citation rejected');
  rejected([{text: 'The preview is 0.05875.', cites: []}], 'MISSING_OR_UNKNOWN_CITATION', 'uncited sentence rejected');
  rejected([{text: 'This claim is certified.', cites: [calcFact.fact_id]}], 'CERTIFICATION_WORDING_NOT_ALLOWED', 'certification wording rejected');
  rejected([{text: 'The activity is eligible for credits.', cites: [calcFact.fact_id]}], 'CERTIFICATION_WORDING_NOT_ALLOWED', 'eligibility wording rejected');
  rejected([{text: 'この削減量は認証されました。', cites: [calcFact.fact_id]}], 'CERTIFICATION_WORDING_NOT_ALLOWED', 'Japanese certification wording rejected');
  rejected([{text: 'See <b>details</b>.', cites: [calcFact.fact_id]}], 'MARKUP_OR_LINK_NOT_ALLOWED', 'markup rejected');
  rejected([{text: 'See https://example.invalid/x', cites: [calcFact.fact_id]}], 'MARKUP_OR_LINK_NOT_ALLOWED', 'links rejected');
  rejected([{text: '', cites: [calcFact.fact_id]}], 'INVALID_TEXT', 'empty text rejected');
  rejected([{text: 'x'.repeat(601), cites: [calcFact.fact_id]}], 'INVALID_TEXT', 'overlong text rejected');
  rejected([], 'INVALID_STATEMENT_COUNT', 'empty draft rejected');
  rejected([{text: 'ok', cites: [calcFact.fact_id]}], 'CONTEXT_HASH_MISMATCH', 'draft for another context rejected', {context_hash: '0'.repeat(64)});
  eq(eiValidateExternalExplanation(context, null).validation.status, 'REJECTED', 'null draft rejected');
  eq(eiValidateExternalExplanation(context, 'free text').validation.status, 'REJECTED', 'free text draft rejected');
  blocks(function() { eiValidateExternalExplanation(Object.assign({}, context, {facts: []}), draft([])); }, 'EI_INVALID_EXPLANATION_CONTEXT', 'a modified context is refused');
  blocks(function() { const bad = clone(report); bad.statements[0].text = 'edited'; eiExplanationContext(bad); }, 'EI_REPORT_HASH_MISMATCH', 'context cannot be built from an edited report');
  const forged = clone(good); forged.authoritative = true;
  check(!eiVerifySidecar(context, forged), 'a sidecar claiming authority does not verify');
  const resealed = clone(good); resealed.authoritative = true; delete resealed.sidecar_hash; resealed.sidecar_hash = hashObject(resealed);
  check(!eiVerifySidecar(context, resealed), 'a re-sealed sidecar claiming authority does not verify');
  // Explanations change nothing
  eq([state.claims['XP-1'].record_hash, eiStateDigest(state), canonicalize(report), eiClaimReport(state, 'XP-1', {locale: 'en'}).report_hash], [recordHash, digest, reportText, report.report_hash], 'record, state and report are unchanged by producing or validating explanations');
  eq(eiVerifyReport(state, report).status, 'VERIFIED', 'report still verifies after explanations');
  check(!('explanation' in report) && !canonicalize(eiRecord(state, 'XP-1').record).includes('sidecar'), 'no explanation text is stored in the record or the report');
  // Static separation: decision modules never reference the explanation module
  const symbols = /eiExplanationContext|eiTemplateExplanation|eiValidateExternalExplanation|eiVerifySidecar|eiSealSidecar|EI_EXPLANATION/;
  ['evidence-intel-calc', 'evidence-intel-versions', 'evidence-intel-engine', 'evidence-intel-report', 'evidence-intel-audit', 'mrv-core', 'mrv-compiler', 'compiler-session'].forEach(function(name) {
    check(!symbols.test(fs.readFileSync('src/' + name + '.js', 'utf8')), 'no reference to the explanation module in ' + name + '.js');
  });
  const explainSource = fs.readFileSync('src/evidence-intel-explain.js', 'utf8');
  check(!/eiApplyChange|eiBuild\(|compileEvidence|saveDB|audit\(/.test(explainSource), 'explanation module cannot compute, change or persist');
  ['evidence-intel-calc', 'evidence-intel-versions', 'evidence-intel-engine', 'evidence-intel-report', 'evidence-intel-explain', 'evidence-intel-audit', 'evidence-intel-api'].forEach(function(name) {
    check(!/Date\.now|new Date\(|Math\.random|setTimeout|XMLHttpRequest|localStorage|document\./.test(fs.readFileSync('src/' + name + '.js', 'utf8')), 'pure module uses no clock, randomness, network or DOM: ' + name + '.js');
  });
})();

// ===== I. Audit log =========================================================================
(function auditLog() {
  const claims = [eiClaim('AU-1', undefined, 2, 10), syntheticClaim('AU-2')], state = eiBuild(claims, ctx);
  const empty = eiAuditNew(), built = eiAuditBuild(empty, state, {actor: 'operator', at: '2026-11-14T00:00:00Z'});
  eq([empty.entries.length, built.entries.length, eiAuditVerify(built).status], [0, 6, 'VALID'], 'build logs input, calculation and verification per Claim; append does not mutate');
  eq(built.entries.map(function(e) { return e.type; }), ['INPUT', 'CALCULATION', 'VERIFICATION', 'INPUT', 'CALCULATION', 'VERIFICATION'], 'entry types in order');
  const calcEntry = eiAuditQuery(built, {type: 'CALCULATION', claim_id: 'AU-1'})[0];
  eq([calcEntry.payload.exact_preview, calcEntry.payload.result, calcEntry.payload.calculation_engine, calcEntry.actor, calcEntry.at], ['0.05', null, EI_CALC_VERSION, 'operator', '2026-11-14T00:00:00Z'], 'calculation entry records exact preview, null result and engine version');
  eq(eiAuditQuery(built, {type: 'INPUT', claim_id: 'AU-1'})[0].payload.factors[0].key, 'SYN-EF@2026.1', 'input entry records the coefficient version');
  eq(eiAuditQuery(built, {type: 'VERIFICATION', claim_id: 'AU-2'})[0].payload.record_hash, state.claims['AU-2'].record_hash, 'verification entry binds the record hash');
  eq(eiAuditCrossCheck(built, state).status, 'MATCH', 'log and state agree');
  const applied = eiApplyChange(state, {type: 'field', field_id: claims[0].field.id, patch: {area_ha: 3}}, ctx);
  eq(eiAuditCrossCheck(built, applied.state).mismatches, ['AU-1'], 'a state that advanced without logging is detected');
  const checkpoint = eiAuditCheckpoint(built), next = eiAuditDelta(built, applied.state, applied.delta, {actor: 'operator'});
  eq([next.entries.length, next.entries[6].type, next.entries[6].payload.change_hash, eiAuditCrossCheck(next, applied.state).status], [10, 'CHANGE', applied.delta.change_hash, 'MATCH'], 'change and re-verification are logged');
  eq(eiAuditQuery(next, {type: 'INPUT', claim_id: 'AU-1'})[1].payload.change_hash, applied.delta.change_hash, 'new input entry cites the change');
  eq(eiAuditVerify(next, checkpoint), {status: 'VALID', reason: null, entries: 10, verified_from: 6, head: next.head}, 'checkpoint verification re-hashes only new entries');
  const report = eiClaimReport(applied.state, 'AU-1', {locale: 'en'}), context = eiExplanationContext(report);
  const full = eiAuditExplanation(eiAuditReport(next, report), eiTemplateExplanation(context));
  eq(full.entries.slice(-2).map(function(e) { return [e.type, e.payload.authoritative === undefined ? null : e.payload.authoritative]; }), [['REPORT', null], ['EXPLANATION', false]], 'reports and explanations are logged as separate entry types');
  eq(eiAuditVerify(full).status, 'VALID', 'full log valid');
  eq(eiAuditQuery(full, {subject: 'claim:AU-1'}).length, 8, 'query by subject');
  eq(eiAuditQuery(full, {from_seq: 11}).length, 2, 'query by sequence');
  // Tamper detection
  function tamper(mutate) { const t = clone(full); mutate(t); return eiAuditVerify(t).status; }
  eq(tamper(function(t) { t.entries[1].payload.exact_preview = '999'; }), 'BROKEN', 'edited calculation payload detected');
  eq(tamper(function(t) { t.entries[1].payload.exact_preview = '999'; t.entries[1].payload_hash = hashObject(t.entries[1].payload); }), 'BROKEN', 'edited payload with recomputed payload hash detected');
  eq(tamper(function(t) { t.entries.splice(3, 1); }), 'BROKEN', 'deleted entry detected');
  eq(tamper(function(t) { const x = t.entries[2]; t.entries[2] = t.entries[3]; t.entries[3] = x; }), 'BROKEN', 'reordered entries detected');
  eq(tamper(function(t) { t.entries.pop(); }), 'BROKEN', 'truncated log detected');
  eq(tamper(function(t) { t.head = '0'.repeat(64); }), 'BROKEN', 'wrong head detected');
  eq(tamper(function(t) { t.entries[0].actor = 'reviewer'; }), 'BROKEN', 'edited actor detected');
  const rewritten = clone(full); rewritten.entries[1].payload.exact_preview = '999';
  eq(eiAuditVerify(rewritten, checkpoint).status, 'VALID', 'documented limit: a checkpoint does not re-check entries before it');
  eq(eiAuditVerify(rewritten).status, 'BROKEN', 'a full verification still detects that edit');
  eq(eiAuditVerify(full, {seq: 6, head: '0'.repeat(64)}).reason, 'CHECKPOINT_MISMATCH', 'a checkpoint that does not match the log is refused');
  eq(eiAuditVerify(full, {seq: 99, head: full.head}).reason, 'CHECKPOINT_OUT_OF_RANGE', 'out-of-range checkpoint refused');
  eq(eiAuditVerify({}).status, 'BROKEN', 'invalid log');
  blocks(function() { eiAuditAppend(empty, [{type: 'APPROVAL', subject: 'x', payload: {}}]); }, 'EI_INVALID_AUDIT_ENTRY', 'unknown entry type refused');
  blocks(function() { eiAuditAppend(empty, [{type: 'INPUT', subject: 'x', payload: {v: NaN}}]); }, 'EI_NON_CANONICAL_INPUT', 'non-canonical payload refused');
  blocks(function() { eiAuditAppend(empty, [{type: 'INPUT', subject: 'x', payload: {}}], {at: 'yesterday'}); }, 'EI_INVALID_AUDIT_TIME', 'invalid time refused');
  blocks(function() { eiAuditAppend({}, []); }, 'EI_INVALID_AUDIT_LOG', 'invalid log refused');
  eq(eiAuditBuild(eiAuditNew(), state, {actor: 'operator', at: '2026-11-14T00:00:00Z'}), built, 'log construction is deterministic for the same inputs and supplied time');
  eq(eiAuditBuild(eiAuditNew(), state).entries[0].at, null, 'no clock is read: time is null unless supplied');
})();

// ===== J. API ================================================================================
(function api() {
  const claims = [eiClaim('API-1', undefined, 2.35, 10), syntheticClaim('API-2', 'intensive'), syntheticClaim('API-3')];
  function call(method, path, body) { return eiApiHandle({method: method, path: path, body: body}); }
  const meta = call('GET', '/v1/meta');
  eq([meta.status, meta.body.status, meta.body.boundary.formal_certification, meta.body.boundary.disclaimer === DISCLAIMER], [200, 'OK', false, true], 'meta responds with the boundary');
  eq(meta.body.data.routes.map(function(r) { return r.method + ' ' + r.path; }).sort(), Object.keys(EI_API_HANDLERS).sort(), 'documented routes equal implemented handlers');
  eq(call('GET', '/v1/standards').body.data.standards.find(function(s) { return s.id === 'GHGP-LSRS'; }).accounting_context, 'CORPORATE_INVENTORY', 'standards route');
  eq(call('GET', '/v1/methodologies').body.data.methodologies.length, 6, 'catalog route');
  eq(call('GET', '/v1/methodologies/' + encodeURIComponent('AG-005@3.1-reference')).body.data.accounting_context, 'PROJECT_CREDITING', 'Pack route by exact key');
  eq([call('GET', '/v1/methodologies/NOPE@1').status, call('GET', '/v1/methodologies/NOPE@1').body.error.code], [404, 'EI_PACK_NOT_FOUND'], 'unknown Pack is 404');
  eq(call('GET', '/v1/methodologies/%E0%A4%A').status, 400, 'bad path encoding is 400');
  eq(call('POST', '/v1/methodologies/diff', {old_key: 'NAFT-SYNTHETIC@1', new_key: 'NAFT-SYNTHETIC@2'}).body.data.changed_rules.map(function(r) { return r.id; }), ['extended'], 'diff route');
  eq(call('POST', '/v1/methodologies/candidates', {methodology_id: 'AG-005', start: '2026-06-01', end: '2026-06-30'}).body.data.status, 'NO_EFFECTIVE_VERSION', 'candidates route');
  const compiled = call('POST', '/v1/compile', {claims: claims, legacy_parity: true, include_records: true});
  eq(compiled.body.data.claims.map(function(c) { return [c.claim_id, c.status, c.legacy_parity]; }), [['API-1', 'AUTO_REEVALUATED', 'NOT_APPLICABLE'], ['API-2', 'AUTO_REEVALUATED', 'MATCH'], ['API-3', 'AUTO_REEVALUATED', 'MATCH']], 'compile route with parity');
  check(compiled.body.data.claims.every(function(c) { return c.record.calculation.result === null && c.record.formal_certification === false; }), 'API records carry no certified result');
  eq(compiled.body.data.state_digest, eiStateDigest(eiBuild(claims, ctx)), 'API state digest equals the in-process engine');
  eq(call('POST', '/v1/compile', {claims: clone(claims), legacy_parity: true, include_records: true}).body.data_hash, compiled.body.data_hash, 'same request, same response hash');
  const impact = call('POST', '/v1/impact', {claims: claims, change: {type: 'methodology', old_key: 'NAFT-SYNTHETIC@1', new_key: 'NAFT-SYNTHETIC@2'}, verify: true});
  eq([impact.body.data.impact.claims.map(function(c) { return [c.claim_id, c.classification]; }), impact.body.data.full_rebuild_check.status], [[['API-2', 'SEMANTIC_CHANGE'], ['API-3', 'PROVENANCE_ONLY']], 'MATCH'], 'impact route with full-rebuild check');
  const factorImpact = call('POST', '/v1/impact', {claims: claims, change: {type: 'factor_registry', factor_registry: 'with-synthetic-correction'}, verify: true});
  eq([factorImpact.body.data.impact.claims.map(function(c) { return c.claim_id; }), factorImpact.body.data.impact.claims[0].preview_after, factorImpact.body.data.full_rebuild_check.status], [['API-1'], '0.0564', 'MATCH'], 'coefficient correction through the API');
  const reportResponse = call('POST', '/v1/report', {claims: claims, claim_id: 'API-1', locale: 'en'});
  eq([reportResponse.body.data.verification.status, reportResponse.body.data.report.boundary.is_credit_certification], ['VERIFIED', false], 'report route returns a verified grounded report');
  check(call('POST', '/v1/report', {claims: claims, claim_id: 'API-1', format: 'markdown'}).body.data.markdown.indexOf('# Evidence report — API-1') === 0, 'markdown report route');
  eq(call('POST', '/v1/report', {claims: claims, claim_id: 'API-1', intended_use: 'CORPORATE_INVENTORY'}).body.error.code, 'EI_INVENTORY_ACCOUNTING_NOT_IMPLEMENTED', 'inventory use refused through the API');
  eq([call('POST', '/v1/report', {claims: claims, claim_id: 'NOPE'}).status, call('POST', '/v1/report', {claims: claims, claim_id: 'NOPE'}).body.error.code], [404, 'EI_CLAIM_NOT_FOUND'], 'unknown Claim is 404');
  const graph = call('POST', '/v1/graph', {claims: claims, claim_ids: ['API-1'], trace: {seeds: ['factor:SYN-EF@2026.1'], direction: 'downstream'}});
  check(graph.body.data.validation.status === 'VALID' && graph.body.data.trace.nodes.includes('calc:API-1') && !graph.body.data.trace.nodes.includes('calc:API-2'), 'graph route with trace');
  eq(call('POST', '/v1/graph', {claims: claims, trace: {seeds: ['nope'], direction: 'downstream'}}).status, 404, 'unknown graph node is 404');
  const templ = call('POST', '/v1/explanations/template', {claims: claims, claim_id: 'API-1', locale: 'en'});
  eq([templ.body.data.sidecar.authoritative, templ.body.data.sidecar.affects_calculation], [false, false], 'template explanation route');
  const fact = templ.body.data.context.facts.find(function(f) { return f.kind === 'calculation'; });
  const validated = call('POST', '/v1/explanations/validate', {claims: claims, claim_id: 'API-1', locale: 'en', draft: {context_hash: templ.body.data.context.context_hash, statements: [{text: 'Preview 0.05875.', cites: [fact.fact_id]}]}});
  eq(validated.body.data.sidecar.validation.status, 'ACCEPTED_AS_NON_AUTHORITATIVE', 'validate route accepts a grounded draft');
  eq(call('POST', '/v1/explanations/validate', {claims: claims, claim_id: 'API-1', locale: 'en', draft: {context_hash: templ.body.data.context.context_hash, statements: [{text: 'Preview 1.0.', cites: [fact.fact_id]}]}}).body.data.sidecar.validation.status, 'REJECTED', 'validate route rejects an ungrounded draft');
  eq(validated.body.data.record_hash, compiled.body.data.claims[0].record_hash, 'validating an explanation does not change the record');
  const log = eiAuditBuild(eiAuditNew(), eiBuild(claims, ctx));
  eq(call('POST', '/v1/audit/verify', {log: log}).body.data.status, 'VALID', 'audit verify route');
  const brokenLog = clone(log); brokenLog.entries[0].payload.pack_key = 'x';
  eq(call('POST', '/v1/audit/verify', {log: brokenLog}).body.data.status, 'BROKEN', 'audit verify route detects tampering');
  // Errors and limits
  eq([call('GET', '/v1/nope').status, call('GET', '/v1/nope').body.error.code], [404, 'ROUTE_NOT_FOUND'], 'unknown route');
  eq([call('GET', '/v1/compile').status, call('DELETE', '/v1/meta').status], [405, 405], 'wrong method');
  eq(call('POST', '/v1/compile', []).status, 400, 'array body refused');
  eq(call('POST', '/v1/compile', {}).body.error.code, 'EI_API_CLAIMS_REQUIRED_OR_LIMIT', 'claims required');
  eq(call('POST', '/v1/compile', {claims: Array.from({length: 501}, function(_, i) { return syntheticClaim('L' + i); })}).status, 422, 'claim limit enforced');
  eq(call('POST', '/v1/compile', {claims: claims, factor_registry: 'mine'}).body.error.code, 'EI_UNKNOWN_FACTOR_REGISTRY', 'only named registries');
  eq(call('POST', '/v1/impact', {claims: claims, change: {type: 'certify'}}).body.error.code, 'EI_UNSUPPORTED_CHANGE_TYPE', 'no certification operation exists');
  eq(eiApiHandle(null).status, 400, 'invalid request object');
  eq(eiApiHandle({method: 'GET', path: '/v1/meta/?x=1'}).status, 200, 'query string and trailing slash ignored');
  const before = canonicalize(claims); call('POST', '/v1/impact', {claims: claims, change: {type: 'field', field_id: claims[0].field.id, patch: {area_ha: 9}}});
  eq(canonicalize(claims), before, 'API does not mutate request Claims');
  check(Object.keys(EI_API_HANDLERS).every(function(route) { return !/attest|approve|certif|register|issue|delete|put/i.test(route); }), 'API exposes no attestation, approval, certification or registry operation');
})();

console.log('EVIDENCE INTEL RESULT: ' + passed + ' passed, ' + failed + ' failed');
if(failed) process.exit(1);
