'use strict';
/**
 * NaFT Evidence Intelligence — deterministic exact-arithmetic calculation engine.
 *
 * Decimal inputs are parsed into BigInt rationals, so results do not depend on
 * IEEE-754 evaluation order or platform. Every operation is recorded as a step.
 * No clock, randomness, network, DOM or mutable database access.
 *
 * This is an arithmetic interpreter, not a GHG methodology. It never produces a
 * certified quantity: callers keep `result: null` and expose only a preview.
 */
var EI_CALC_VERSION = 'naft-ei-calc-1';
var EI_CALC_LIMITS = Object.freeze({max_nodes: 256, max_depth: 32, max_digits: 400, max_dp: 30});
var EI_ROUNDING_MODES = Object.freeze(['HALF_EVEN', 'HALF_UP', 'DOWN']);
var EI_DECIMAL_PATTERN = /^([+-]?)(\d+)(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/;

function EiCalcError(code) { var e = new Error('EI_CALC_' + code); e.ei_code = code; return e; }
function eiGcd(a, b) { if(a < 0n) a = -a; if(b < 0n) b = -b; while(b) { var t = a % b; a = b; b = t; } return a; }
function eiRat(n, d) {
  if(d === 0n) throw EiCalcError('DIVISION_BY_ZERO');
  if(d < 0n) { n = -n; d = -d; }
  var g = eiGcd(n, d) || 1n;
  return {n: n / g, d: d / g};
}
/** Strict decimal parser. Numbers use their shortest round-trip decimal string. */
function eiDecimal(x) {
  var text;
  if(typeof x === 'number') { if(!Number.isFinite(x)) throw EiCalcError('INVALID_NUMBER'); text = String(x); }
  else if(typeof x === 'string') text = x;
  else throw EiCalcError('INVALID_NUMBER');
  var m = EI_DECIMAL_PATTERN.exec(text);
  if(!m || text.length > EI_CALC_LIMITS.max_digits) throw EiCalcError('INVALID_NUMBER');
  var exp = m[4] ? Number(m[4]) : 0;
  if(!Number.isInteger(exp) || Math.abs(exp) > EI_CALC_LIMITS.max_digits) throw EiCalcError('INVALID_NUMBER');
  var frac = m[3] || '', n = BigInt(m[2] + frac), scale = frac.length - exp;
  if(m[1] === '-') n = -n;
  return scale >= 0 ? eiRat(n, 10n ** BigInt(scale)) : eiRat(n * 10n ** BigInt(-scale), 1n);
}
function eiIsDecimal(x) {
  if(typeof x === 'number') return Number.isFinite(x);
  return typeof x === 'string' && x.length <= EI_CALC_LIMITS.max_digits && EI_DECIMAL_PATTERN.test(x);
}
function eiRatAdd(a, b) { return eiRat(a.n * b.d + b.n * a.d, a.d * b.d); }
function eiRatSub(a, b) { return eiRat(a.n * b.d - b.n * a.d, a.d * b.d); }
function eiRatMul(a, b) { return eiRat(a.n * b.n, a.d * b.d); }
function eiRatDiv(a, b) { if(b.n === 0n) throw EiCalcError('DIVISION_BY_ZERO'); return eiRat(a.n * b.d, a.d * b.n); }
function eiRatCmp(a, b) { var x = a.n * b.d, y = b.n * a.d; return x < y ? -1 : x > y ? 1 : 0; }
function eiRatTerminates(r) { var d = r.d; while(d % 2n === 0n) d /= 2n; while(d % 5n === 0n) d /= 5n; return d === 1n; }
/** Round to `dp` decimal places. The mode is always explicit in the calculation spec. */
function eiRatRound(r, dp, mode) {
  if(!Number.isInteger(dp) || dp < 0 || dp > EI_CALC_LIMITS.max_dp) throw EiCalcError('INVALID_ROUNDING');
  if(EI_ROUNDING_MODES.indexOf(mode) < 0) throw EiCalcError('INVALID_ROUNDING');
  var scale = 10n ** BigInt(dp), negative = r.n < 0n, num = (negative ? -r.n : r.n) * scale;
  var q = num / r.d, rem = num % r.d, twice = rem * 2n;
  if(mode === 'HALF_UP' && twice >= r.d) q += 1n;
  if(mode === 'HALF_EVEN' && (twice > r.d || (twice === r.d && q % 2n === 1n))) q += 1n;
  return eiRat(negative ? -q : q, scale);
}
/** Exact decimal string for terminating rationals; `n/d` otherwise. */
function eiRatText(r) {
  if(!eiRatTerminates(r)) return r.n.toString() + '/' + r.d.toString();
  var d = r.d, twos = 0, fives = 0;
  while(d % 2n === 0n) { d /= 2n; twos++; }
  while(d % 5n === 0n) { d /= 5n; fives++; }
  return eiRatFixed(r, Math.max(twos, fives));
}
/** Fixed-point text. Callers pass a value that is exact at `dp` places (e.g. after eiRatRound). */
function eiRatFixed(r, dp) {
  var scaled = r.n * (10n ** BigInt(dp)) / r.d, negative = scaled < 0n, digits = (negative ? -scaled : scaled).toString();
  if(dp > 0) { while(digits.length <= dp) digits = '0' + digits; digits = digits.slice(0, -dp) + '.' + digits.slice(-dp); }
  return (negative ? '-' : '') + digits;
}
function eiRatPortable(r) { return {n: r.n.toString(), d: r.d.toString()}; }
function eiRatFromPortable(p) {
  if(!p || typeof p.n !== 'string' || typeof p.d !== 'string' || !/^-?\d+$/.test(p.n) || !/^\d+$/.test(p.d)) throw EiCalcError('INVALID_NUMBER');
  return eiRat(BigInt(p.n), BigInt(p.d));
}

// Units are exponent maps such as {ha: 1, day: 1}. An absent unit means "not declared".
function eiUnitValid(u) {
  return !!u && typeof u === 'object' && !Array.isArray(u) && Object.keys(u).every(function(k) {
    return /^[A-Za-z][A-Za-z0-9_]{0,31}$/.test(k) && Number.isInteger(u[k]) && Math.abs(u[k]) <= 8;
  });
}
function eiUnitNormalize(u) { var out = {}; Object.keys(u).sort().forEach(function(k) { if(u[k] !== 0) out[k] = u[k]; }); return out; }
function eiUnitCombine(a, b, sign) {
  if(a === null || b === null) return null;
  var out = Object.assign({}, a);
  Object.keys(b).forEach(function(k) { out[k] = (out[k] || 0) + sign * b[k]; });
  return eiUnitNormalize(out);
}
function eiUnitSame(a, b) { return a === null || b === null || canonicalize(a) === canonicalize(b); }

function eiExpressionLeaves(expr) {
  var inputs = [], params = [], count = 0;
  (function walk(e, depth) {
    if(++count > EI_CALC_LIMITS.max_nodes || depth > EI_CALC_LIMITS.max_depth || !e || typeof e !== 'object' || Array.isArray(e)) return;
    if(typeof e.input === 'string') { if(inputs.indexOf(e.input) < 0) inputs.push(e.input); return; }
    if(typeof e.param === 'string') { if(params.indexOf(e.param) < 0) params.push(e.param); return; }
    if(Array.isArray(e.args)) e.args.forEach(function(x) { walk(x, depth + 1); });
  })(expr, 0);
  return {inputs: inputs, params: params};
}
/**
 * Evaluate an expression tree. env = {inputs: {path: value}, params: {id: value}}.
 * Returns {status:'OK', exact, text, unit, steps} or {status:'ERROR', error_code, steps}.
 * Data problems never throw: unknown operations, missing values and unit errors fail closed.
 */
function eiEvaluateExpression(expr, env) {
  var steps = [], count = 0;
  function leaf(kind, ref, raw, e) {
    if(raw === undefined || raw === null) throw EiCalcError('MISSING_' + kind.toUpperCase());
    var value = eiDecimal(raw);
    if(value.n < 0n && e.allow_negative !== true) throw EiCalcError('NEGATIVE_VALUE');
    if(e.unit !== undefined && !eiUnitValid(e.unit)) throw EiCalcError('INVALID_UNIT');
    var unit = e.unit === undefined ? null : eiUnitNormalize(e.unit);
    steps.push({step: steps.length, kind: kind, ref: ref, value: eiRatText(value), unit: unit});
    return {value: value, unit: unit, step: steps.length - 1};
  }
  function walk(e, depth) {
    if(++count > EI_CALC_LIMITS.max_nodes || depth > EI_CALC_LIMITS.max_depth) throw EiCalcError('EXPRESSION_LIMIT');
    if(!e || typeof e !== 'object' || Array.isArray(e)) throw EiCalcError('INVALID_EXPRESSION');
    if(Object.prototype.hasOwnProperty.call(e, 'const')) return leaf('const', String(e.const), e.const, e);
    if(typeof e.input === 'string') return leaf('input', e.input, Object.prototype.hasOwnProperty.call(env.inputs, e.input) ? env.inputs[e.input] : undefined, e);
    if(typeof e.param === 'string') return leaf('param', e.param, Object.prototype.hasOwnProperty.call(env.params, e.param) ? env.params[e.param] : undefined, e);
    if(typeof e.op !== 'string' || !Array.isArray(e.args) || !e.args.length) throw EiCalcError('INVALID_EXPRESSION');
    var arity = {add: 0, mul: 0, min: 0, max: 0, sub: 2, div: 2, neg: 1, round: 1}[e.op];
    if(arity === undefined) throw EiCalcError('UNSUPPORTED_OPERATION');
    if(arity && e.args.length !== arity) throw EiCalcError('INVALID_ARITY');
    var xs = e.args.map(function(a) { return walk(a, depth + 1); }), value = xs[0].value, unit = xs[0].unit, extra = {};
    if(e.op === 'add' || e.op === 'sub' || e.op === 'min' || e.op === 'max') {
      xs.slice(1).forEach(function(x) {
        if(!eiUnitSame(unit, x.unit)) throw EiCalcError('UNIT_MISMATCH');
        if(unit === null) unit = x.unit;
        if(e.op === 'add') value = eiRatAdd(value, x.value);
        else if(e.op === 'sub') value = eiRatSub(value, x.value);
        else if(e.op === 'min') value = eiRatCmp(x.value, value) < 0 ? x.value : value;
        else value = eiRatCmp(x.value, value) > 0 ? x.value : value;
      });
    } else if(e.op === 'mul') {
      xs.slice(1).forEach(function(x) { value = eiRatMul(value, x.value); unit = eiUnitCombine(unit, x.unit, 1); });
    } else if(e.op === 'div') {
      value = eiRatDiv(value, xs[1].value); unit = eiUnitCombine(unit, xs[1].unit, -1);
    } else if(e.op === 'neg') {
      value = eiRat(-value.n, value.d);
    } else {
      value = eiRatRound(value, e.dp, e.mode); extra = {dp: e.dp, mode: e.mode};
    }
    if(value.n.toString().length + value.d.toString().length > EI_CALC_LIMITS.max_digits * 4) throw EiCalcError('MAGNITUDE_LIMIT');
    steps.push(Object.assign({step: steps.length, kind: 'op', op: e.op, operands: xs.map(function(x) { return x.step; }), value: eiRatText(value), unit: unit}, extra));
    return {value: value, unit: unit, step: steps.length - 1};
  }
  try {
    var out = walk(expr, 0);
    return {status: 'OK', exact: eiRatPortable(out.value), text: eiRatText(out.value), terminating: eiRatTerminates(out.value), unit: out.unit, steps: steps};
  } catch(error) {
    if(!error || !error.ei_code) throw error;
    return {status: 'ERROR', error_code: error.ei_code, steps: steps};
  }
}
/** Exact comparison for rule operators when either side is a decimal string. */
function eiCompareDecimal(left, right) {
  if(!eiIsDecimal(left) || !eiIsDecimal(right)) return null;
  return eiRatCmp(eiDecimal(left), eiDecimal(right));
}
