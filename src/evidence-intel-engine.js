'use strict';
/**
 * NaFT Evidence Intelligence — fine-grained dependency graph and differential re-computation.
 *
 * A Claim is planned into typed nodes. A derived node is computed by an operation that
 * receives ONLY the values of its declared dependencies, so the graph is the computation
 * rather than a description written next to it. A node is reused when its operation,
 * arguments and dependency value hashes are unchanged; a recomputed node whose value hash
 * is unchanged stops propagation ("early cutoff").
 *
 * Pure: no clock, randomness, network, DOM or mutable database. States are immutable by
 * contract and structurally shared between versions. Human decisions and attestation stay
 * in the existing session layer; this engine never certifies anything.
 *
 * Requires Core, Compiler, evidence-intel-calc.js and evidence-intel-versions.js.
 */
var EI_ENGINE_VERSION = 'naft-ei-engine-1';
var EI_STATE_SCHEMA = 'naft-evidence-intel-state-1';
var EI_RECORD_SCHEMA = 'naft-evidence-intel-record-1';
var EI_LIMITS = Object.freeze({max_claims: 20000, max_evidence_per_claim: 500});
var EI_JSON_ADAPTERS = ['farm-log-json-v1', 'iot-json-v1', 'gis-json-v1'];
var EI_ADAPTERS = ['text-v1', 'photo-bytes-v1'].concat(EI_JSON_ADAPTERS);
var EI_CHANGE_TYPES = ['methodology', 'evidence', 'evidence_add', 'evidence_withdraw', 'parameter', 'field', 'activity', 'factor_registry'];

function eiFail(code) { throw new Error('EI_' + code); }
function eiOwn(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
/** canonicalize() maps NaN/Infinity to null, so non-finite numbers are rejected at the boundary. */
function eiAssertJsonSafe(value, depth) {
  depth = depth || 0;
  if(depth > 64) eiFail('NON_CANONICAL_INPUT');
  if(value === null || typeof value === 'string' || typeof value === 'boolean') return true;
  if(typeof value === 'number') { if(!Number.isFinite(value)) eiFail('NON_CANONICAL_INPUT'); return true; }
  if(Array.isArray(value)) { for(var i = 0; i < value.length; i++) eiAssertJsonSafe(value[i], depth + 1); return true; }
  if(typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    Object.keys(value).forEach(function(k) { if(value[k] !== undefined) eiAssertJsonSafe(value[k], depth + 1); });
    return true;
  }
  eiFail('NON_CANONICAL_INPUT');
}
function eiAttr(input, path) { var v = getPath(input, path); return v === undefined ? {defined: false} : {defined: true, value: v}; }
function eiAttrValue(a) { return a && a.defined ? a.value : undefined; }
function eiIssue(code, status, detail) { return {code: code, status: status, detail: detail || code}; }
function eiCheck(out, code, ok, status) { out.checks.push({code: code, pass: !!ok}); if(!ok) out.issues.push(eiIssue(code, status || 'UNSUPPORTED')); }
function eiCalcInputs(spec) { return spec && spec.operation === 'expression' ? eiExpressionLeaves(spec.expression).inputs : (spec && Array.isArray(spec.inputs) ? spec.inputs : []); }
function eiCalcParams(spec) { return spec && spec.operation === 'expression' ? eiExpressionLeaves(spec.expression).params : (spec && Array.isArray(spec.parameters) ? spec.parameters : []); }
function eiNonNegativeNumeric(v) {
  if(typeof v === 'number') return Number.isFinite(v) && v >= 0;
  return typeof v === 'string' && eiIsDecimal(v) && eiDecimal(v).n >= 0n;
}
/** Packs using only legacy features can be cross-checked against compileEvidence(). */
function eiPackFeatures(pack) {
  var factorBound = Object.keys(pack.parameters).some(function(k) { var d = pack.parameters[k]; return d && typeof d === 'object' && d.factor_ref !== undefined; });
  var stringParams = Object.keys(pack.parameters).some(function(k) { var d = pack.parameters[k]; return d && typeof d === 'object' && typeof d.value === 'string' && eiIsDecimal(d.value); });
  var stringRules = Object.keys(pack.rules).some(function(k) { var r = pack.rules[k]; return r && typeof r === 'object' && typeof r.value === 'string' && eiIsDecimal(r.value); });
  var expression = pack.calculation_spec.operation === 'expression';
  return {factor_bound_parameters: factorBound, decimal_string_parameters: stringParams, decimal_string_rule_values: stringRules, expression_calculation: expression,
    legacy_compatible: !factorBound && !stringParams && !stringRules && !expression};
}

// ---- Operations: each sees only its declared dependencies ---------------------------
var EI_OPS = {
  input_root: function(d) { return {merkle: hashObject(d.hashes('leaf'))}; },
  digest: function(d) {
    var e = d.one('content');
    var content = typeof e.content === 'string' ? new TextEncoder().encode(e.content) :
      Array.isArray(e.bytes) && e.bytes.every(function(n) { return Number.isInteger(n) && n >= 0 && n <= 255; }) ? new Uint8Array(e.bytes) : null;
    var normalized = null, parseValid = !!content;
    if(EI_JSON_ADAPTERS.indexOf(e.adapter) >= 0) {
      try { normalized = JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(content)); parseValid = !!normalized && typeof normalized === 'object'; }
      catch(error) { parseValid = false; }
    }
    return {content_hash: content ? digestBytes(content) : null, byte_length: content ? content.length : null, normalized_data: normalized, parse_valid: parseValid};
  },
  manifest: function(d) {
    var e = d.one('meta'), g = d.one('digest'), a = d.one('identity').activity;
    var value = {id: e.id, category: e.category, adapter: e.adapter || 'text-v1', activity_id: e.activity_id, field_id: e.field_id, methodology_id: e.methodology_id,
      methodology_version: e.methodology_version, period: clone(e.period || {}), source: e.source || 'UNKNOWN', provenance: e.provenance || 'UNKNOWN',
      content_hash: g.content_hash, expected_hash: e.expected_hash || null, byte_length: g.byte_length, normalized_data: g.normalized_data, parse_valid: g.parse_valid,
      content_verified: !!(g.content_hash && e.expected_hash === g.content_hash),
      binding_valid: e.activity_id === a.id && e.field_id === a.field_id && e.methodology_id === a.methodology_id && e.methodology_version === a.methodology_version};
    value.manifest_hash = hashObject(value);
    return value;
  },
  evidence_checks: function(d) {
    var e = d.one('manifest'), a = d.one('identity').activity, out = {checks: [], issues: []};
    eiCheck(out, 'content_hash:' + e.id, e.content_verified);
    eiCheck(out, 'evidence_parse:' + e.id, e.parse_valid);
    eiCheck(out, 'evidence_id:' + e.id, typeof e.id === 'string' && !!e.id && typeof e.category === 'string');
    eiCheck(out, 'manifest_binding:' + e.id, e.binding_valid);
    eiCheck(out, 'evidence_period:' + e.id, !!inclusiveDays(e.period.start, e.period.end) && e.period.start >= a.start && e.period.end <= a.end);
    eiCheck(out, 'adapter:' + e.id, EI_ADAPTERS.indexOf(e.adapter) >= 0);
    if(['public', 'synthetic', 'derived'].indexOf(e.provenance) < 0) out.issues.push(eiIssue('evidence_provenance:' + e.id, 'UNSUPPORTED'));
    return out;
  },
  evidence_set: function(d) {
    var ids = d.all('manifest').map(function(m) { return m.id; }), out = {checks: [], issues: []};
    eiCheck(out, 'duplicate_evidence_id', new Set(ids).size === ids.length);
    return out;
  },
  identity_checks: function(d) {
    var id = d.one('identity'), a = id.activity, f = id.field, pack = d.one('pack'), peers = d.one('peers'), out = {checks: [], issues: []};
    eiCheck(out, 'methodology_mismatch', a.methodology_id === pack.methodology_id && a.methodology_version === pack.methodology_version);
    eiCheck(out, 'field_identity', !!a.id && !!f.id && !!a.program_id && !!a.farmer_id && a.field_id === f.id && a.farmer_id === f.farmer_id && a.program_id === f.program_id, 'UNSUPPORTED');
    eiCheck(out, 'identity_ambiguity', !eiAttrValue(d.one('ambiguous')), 'HUMAN_REVIEW_REQUIRED');
    eiCheck(out, 'activity_period', !!inclusiveDays(a.start, a.end));
    eiCheck(out, 'effective_period', isoDay(pack.effective_from) !== null && isoDay(pack.effective_to) !== null && a.start >= pack.effective_from && a.end <= pack.effective_to);
    if(pack.status !== 'SYNTHETIC') out.issues.push(eiIssue('official_configuration', 'UNSUPPORTED', 'UNKNOWN / CONFIG_REQUIRED: complete institutional semantics not implemented'));
    var duplicates = (peers || []).some(function(p) { return p.id !== a.id && p.field_id === a.field_id && p.methodology_id === a.methodology_id && p.type === a.type && p.start <= a.end && p.end >= a.start; });
    eiCheck(out, 'duplicate_overlap', !duplicates);
    return out;
  },
  condition: function(d, args) {
    var when = d.one('def').when, v = eiAttrValue(d.one('attr')), ambiguous = v === undefined;
    return {active: canonicalize(v) === canonicalize(when.equals), ambiguous: ambiguous,
      issues: ambiguous ? [eiIssue('ambiguous_condition:' + args.group + ':' + args.id, 'UNSUPPORTED')] : []};
  },
  param_value: function(d, args) {
    var def = d.one('def'), out = {id: args.id, defined: false, source: 'absent', override_differs: false, factor: null, issues: []};
    if(def === undefined || def === null || typeof def !== 'object') return out;
    var base = def.value;
    if(def.factor_ref !== undefined) {
      base = undefined;
      if(args.resolution && args.resolution.status === 'RESOLVED') {
        var factor = d.one('factor');
        out.factor = {factor_id: factor.factor_id, version: factor.version, status: factor.status, value: factor.value, unit_label: factor.unit_label, factor_hash: d.hash('factor')};
        if(factor.status === 'SYNTHETIC' && eiNonNegativeNumeric(factor.value)) base = factor.value;
        else out.issues.push(eiIssue('factor_configuration:' + args.id, 'UNSUPPORTED', 'CONFIG_REQUIRED: coefficient ' + factor.factor_id + '@' + factor.version + ' is not an executable value'));
      } else {
        out.issues.push(eiIssue('factor_resolution:' + args.id, 'UNSUPPORTED', 'Coefficient resolution ' + (args.resolution ? args.resolution.status : 'UNKNOWN_FACTOR')));
      }
      out.source = 'factor';
    } else out.source = 'pack';
    var value = base;
    if(d.has('override')) {
      var override = d.one('override').value;
      value = override; out.source = 'override'; out.override_differs = canonicalize(override) !== canonicalize(base);
    }
    if(value !== undefined) { out.defined = true; out.value = value; }
    return out;
  },
  parameter_check: function(d, args) {
    var p = d.one('param'), rules = d.all('rule'), conds = d.all('cond'), ci = 0;
    var used = eiCalcParams(d.one('spec')).indexOf(args.id) >= 0;
    args.rules.forEach(function(ref, i) {
      var active = ref.conditional ? conds[ci++].active : true;
      if(active && rules[i] && rules[i].parameter === args.id) used = true;
    });
    var out = {id: args.id, used: used, value: p.defined ? p.value : null, issues: used ? p.issues.slice() : []};
    if(used && p.override_differs) out.issues.push(eiIssue('material_parameter_override:' + args.id, 'HUMAN_REVIEW_REQUIRED'));
    if(used && !(p.defined && eiNonNegativeNumeric(p.value))) out.issues.push(eiIssue('parameter_configuration:' + args.id, 'UNSUPPORTED'));
    return out;
  },
  unknown_parameter: function(d, args) { return {issues: [eiIssue('unknown_parameter:' + args.id, 'UNSUPPORTED')]}; },
  rule_result: function(d, args) {
    if(d.has('cond') && !d.one('cond').active) return {applicable: false, result: null, issues: []};
    var rule = d.one('def'), left = eiAttrValue(d.one('input')), right = rule.value;
    if(rule.parameter) { var p = d.one('param'); right = p.defined ? p.value : undefined; }
    var supported = ['gte', 'gt', 'eq'].indexOf(rule.op) >= 0, ok = false;
    if(rule.op === 'eq') ok = left !== undefined && canonicalize(left) === canonicalize(right);
    else if(typeof left === 'number' && Number.isFinite(left) && typeof right === 'number' && Number.isFinite(right)) ok = rule.op === 'gte' ? left >= right : rule.op === 'gt' && left > right;
    else if(supported && (typeof left === 'string' || typeof right === 'string')) {
      var cmp = eiCompareDecimal(left, right);
      ok = cmp !== null && (rule.op === 'gte' ? cmp >= 0 : cmp > 0);
    }
    var out = {applicable: true, result: {id: args.id, pass: ok, supported: supported, input: rule.input, value: left === undefined ? null : left, threshold: right === undefined ? null : right}, issues: []};
    if(!supported || !ok) out.issues.push(eiIssue('rule:' + args.id, 'UNSUPPORTED', supported ? 'Deterministic rule failed; correction required' : 'Unsupported rule operation'));
    return out;
  },
  requirement_result: function(d, args) {
    var r = d.one('def'), base = {id: args.id, category: r.category, required: !!r.required};
    if(d.has('cond') && !d.one('cond').active) return Object.assign(base, {applicable: false, missing: false, contradictory: false, usable: [], issues: []});
    var items = d.all('evidence').filter(function(e) { return e.category === r.category && e.content_verified && e.binding_valid; });
    var missing = !!r.required && !items.length, contradictory = new Set(items.map(function(e) { return e.content_hash; })).size > 1, issues = [];
    if(missing) issues.push(eiIssue('missing_evidence:' + args.id, 'EVIDENCE_REQUIRED'));
    if(contradictory) issues.push(eiIssue('contradictory_evidence:' + args.id, 'HUMAN_REVIEW_REQUIRED'));
    return Object.assign(base, {applicable: true, missing: missing, contradictory: contradictory, usable: items.map(function(e) { return e.id; }).sort(), issues: issues});
  },
  exception_result: function(d, args) {
    var e = d.one('def'), code = args.group + ':' + args.id;
    if(e === null || typeof e !== 'object' || !e.input) return {issues: [eiIssue(code, 'UNSUPPORTED')]};
    var active = !d.has('cond') || d.one('cond').active;
    if(active && canonicalize(eiAttrValue(d.one('input'))) === canonicalize(e.equals)) {
      return {issues: [eiIssue(code, args.group === 'exceptions' && e.disposition === 'HUMAN_REVIEW_REQUIRED' ? 'HUMAN_REVIEW_REQUIRED' : 'UNSUPPORTED')]};
    }
    return {issues: []};
  },
  calculation: function(d) {
    var spec = d.one('spec'), paths = eiCalcInputs(spec), ids = eiCalcParams(spec);
    var inputValues = d.all('input').map(eiAttrValue), paramValues = d.all('param').map(function(p) { return p.defined ? p.value : undefined; });
    var values = inputValues.concat(paramValues);
    var out = {operation: spec.operation, input_paths: paths, parameter_ids: ids, values: values.map(function(v) { return v === undefined ? null : v; }),
      unit: spec.unit || 'UNKNOWN', ok: false, arithmetic_preview: null, exact: null, unit_check: 'NOT_DECLARED', trace: [], issues: []};
    if(spec.operation === 'multiply') {
      // Legacy float fold is kept bit-for-bit for package parity; the exact value is reported next to it.
      var ok = values.length > 0 && values.every(function(v) { return typeof v === 'number' && Number.isFinite(v) && v >= 0; });
      var preview = ok ? values.reduce(function(x, y) { return x * y; }, 1) : null;
      if(ok && Number.isFinite(preview)) {
        var exact = eiEvaluateExpression({op: 'mul', args: values.map(function(v) { return {const: v}; })}, {inputs: {}, params: {}});
        out.ok = true; out.arithmetic_preview = preview; out.exact = exact.status === 'OK' ? exact.text : null; out.trace = exact.steps;
        out.float_matches_exact = exact.status === 'OK' && eiIsDecimal(exact.text) && eiCompareDecimal(preview, exact.text) === 0;
      }
    } else if(spec.operation === 'expression') {
      var env = {inputs: {}, params: {}};
      paths.forEach(function(p, i) { if(inputValues[i] !== undefined) env.inputs[p] = inputValues[i]; });
      ids.forEach(function(k, i) { if(paramValues[i] !== undefined) env.params[k] = paramValues[i]; });
      var result = eiEvaluateExpression(spec.expression, env);
      out.trace = result.steps;
      if(result.status === 'OK' && result.terminating) {
        var declared = spec.unit_dimensions === undefined ? null : eiUnitValid(spec.unit_dimensions) ? eiUnitNormalize(spec.unit_dimensions) : undefined;
        out.unit_check = declared === null || result.unit === null ? 'NOT_DECLARED' : declared !== undefined && canonicalize(declared) === canonicalize(result.unit) ? 'CONSISTENT' : 'MISMATCH';
        if(out.unit_check !== 'MISMATCH') { out.ok = true; out.exact = result.text; out.arithmetic_preview = Number(result.text); }
        else out.error_code = 'UNIT_MISMATCH';
      } else out.error_code = result.status === 'OK' ? 'NON_TERMINATING_RESULT_REQUIRES_ROUNDING' : result.error_code;
    }
    if(!out.ok) out.issues.push(eiIssue('calculation_configuration', 'UNSUPPORTED', out.error_code ? 'calculation_configuration:' + out.error_code : undefined));
    return out;
  },
  evaluation: function(d) {
    var issues = [], checks = [];
    ['identity', 'evidence_set', 'evidence', 'condition', 'parameter', 'unknown', 'rule', 'requirement', 'exception', 'calculation'].forEach(function(role) {
      d.all(role).forEach(function(v) { (v.issues || []).forEach(function(i) { issues.push(i); }); (v.checks || []).forEach(function(c) { checks.push(c); }); });
    });
    var requirements = d.all('requirement');
    var used = {};
    d.all('parameter').filter(function(p) { return p.used; }).forEach(function(p) { used[p.id] = p.value; });
    var out = {checks: stableSort(checks), rules: d.all('rule').filter(function(r) { return r.applicable; }).map(function(r) { return r.result; }),
      requirements: requirements.map(function(r) { return {id: r.id, category: r.category, required: r.required, applicable: r.applicable, missing: r.missing, contradictory: r.contradictory, usable: r.usable}; }),
      missing_evidence: requirements.filter(function(r) { return r.missing; }).map(function(r) { return r.id; }),
      used_parameters: used, issues: stableSort(issues), status: 'AUTO_REEVALUATED'};
    if(issues.some(function(e) { return e.status === 'UNSUPPORTED'; })) out.status = 'UNSUPPORTED';
    else if(issues.some(function(e) { return e.status === 'EVIDENCE_REQUIRED'; })) out.status = 'EVIDENCE_REQUIRED';
    else if(issues.length) out.status = 'HUMAN_REVIEW_REQUIRED';
    return out;
  },
  record: function(d, args) {
    var evaluation = d.one('evaluation'), calculation = d.one('calculation'), source = d.one('source'), params = d.all('param');
    var parameters = {}, factors = [];
    params.forEach(function(p) { if(p.defined) parameters[p.id] = p.value; if(p.factor) factors.push(Object.assign({parameter: p.id}, p.factor)); });
    var semantic = eiSemanticView(evaluation, calculation);
    return {schema: EI_RECORD_SCHEMA, engine_version: EI_ENGINE_VERSION, calculation_engine: EI_CALC_VERSION, claim_id: args.claim_id,
      methodology: source, input_merkle: d.one('input_root').merkle,
      evidence: d.all('manifest').map(function(m) { return {id: m.id, category: m.category, adapter: m.adapter, manifest_hash: m.manifest_hash, content_hash: m.content_hash, content_verified: m.content_verified, binding_valid: m.binding_valid, provenance: m.provenance}; }),
      parameters: parameters, factors: factors, evaluation: evaluation,
      calculation: Object.assign({}, calculation, {status: evaluation.status === 'AUTO_REEVALUATED' ? 'SYNTHETIC_PASS' : evaluation.status, result: null}),
      semantic_hash: hashObject(semantic), data_provenance: d.one('rest').provenance || 'UNKNOWN',
      human_review: 'NOT_IN_ENGINE_SCOPE: exception decisions and attestation remain in the audited session layer',
      formal_certification: false, certified_result: null};
  }
};
/** Verification semantics only: identifiers of versions and sources are provenance, not semantics. */
function eiSemanticView(evaluation, calculation) {
  return {rules: evaluation.rules,
    evidence_requirements: evaluation.requirements.filter(function(r) { return r.applicable; }).map(function(r) { return {id: r.id, category: r.category, required: r.required}; }),
    missing_evidence: evaluation.missing_evidence.slice().sort(),
    issues: evaluation.issues.map(function(i) { return {code: i.code, status: i.status}; }),
    used_parameters: evaluation.used_parameters,
    calculation_spec: {operation: calculation.operation, inputs: calculation.input_paths, parameters: calculation.parameter_ids, unit: calculation.unit},
    calculation_values: calculation.values, arithmetic_preview: calculation.arithmetic_preview, exact_preview: calculation.exact, status: evaluation.status};
}

// ---- Shared (Pack / coefficient) nodes ------------------------------------------------
function eiSharedNode(id, kind, value) { return {id: id, kind: kind, shared: true, value: value, vh: hashObject(value)}; }
function eiPackNodes(pack) {
  var K = compilerKey(pack), nodes = [], packHash = hashObject(pack);
  nodes.push(eiSharedNode('pack:' + K, 'pack', {methodology_id: pack.methodology_id, methodology_version: pack.methodology_version, status: pack.status, effective_from: pack.effective_from, effective_to: pack.effective_to}));
  nodes.push(eiSharedNode('source:' + K, 'source', {key: K, pack_hash: packHash, rule_pack_version: pack.rule_pack_version, accounting_context: eiPackAccountingContext(pack),
    source: {url: pack.source_url, hash: pack.source_hash, checked_at: pack.source_checked_at, status: pack.status}, scope: pack.scope || null, supersedes: typeof pack.supersedes === 'string' ? pack.supersedes : null}));
  nodes.push(eiSharedNode('calcspec:' + K, 'calculation_spec', pack.calculation_spec));
  [['rules', 'rule'], ['evidence_requirements', 'requirement'], ['parameters', 'parameter'], ['exceptions', 'exception'], ['unsupported_conditions', 'unsupported_condition']].forEach(function(g) {
    Object.keys(pack[g[0]]).sort().forEach(function(id) { nodes.push(eiSharedNode(g[1] + ':' + K + ':' + id, g[1], pack[g[0]][id])); });
  });
  return {key: K, pack_hash: packHash, nodes: nodes};
}

// ---- Planner ------------------------------------------------------------------------
function eiPlanClaim(input, pack, factors) {
  var a = input.activity, f = input.field, C = a.id, K = compilerKey(pack), leaves = [], derived = [], attrs = Object.create(null), sharedUsed = [];
  function shared(id) { if(sharedUsed.indexOf(id) < 0) sharedUsed.push(id); return id; }
  function leaf(id, kind, value, same) { leaves.push({id: id, kind: kind, value: value, same: same}); return id; }
  function node(id, kind, op, args, deps) { derived.push({id: id, kind: kind, op: op, args: args || {}, deps: deps}); return id; }
  function attr(path) {
    var key = typeof path === 'string' ? path : JSON.stringify(path === undefined ? null : path), id = 'attr:' + C + ':' + key;
    if(!attrs[id]) { attrs[id] = true; leaf(id, 'attribute', eiAttr(input, path)); }
    return id;
  }
  var identity = leaf('identity:' + C, 'identity', {
    activity: {id: a.id, field_id: a.field_id, farmer_id: a.farmer_id, program_id: a.program_id, methodology_id: a.methodology_id, methodology_version: a.methodology_version, type: a.type, start: a.start, end: a.end},
    field: {id: f.id, farmer_id: f.farmer_id, program_id: f.program_id}});
  var peers = leaf('peers:' + C, 'peers', input.peers || []);
  var rest = {};
  Object.keys(input).forEach(function(k) { if(['evidence', 'peers', 'parameter_overrides'].indexOf(k) < 0) rest[k] = input[k]; });
  var restId = leaf('rest:' + C, 'claim_input', rest);
  var overrides = input.parameter_overrides || {}, overrideIds = Object.create(null);
  Object.keys(overrides).sort().forEach(function(k) { if(overrides[k] !== undefined) overrideIds[k] = leaf('override:' + C + ':' + k, 'parameter_override', {value: overrides[k]}); });

  // Evidence: content and metadata are separate leaves so re-binding does not re-digest bytes.
  var evidence = (input.evidence || []).slice(), seenIds = Object.create(null), manifestIds = [], manifestByCategory = Object.create(null), evcheckIds = [];
  if(evidence.length > EI_LIMITS.max_evidence_per_claim) eiFail('EVIDENCE_LIMIT');
  var duplicated = evidence.some(function(e, i) { return evidence.findIndex(function(x) { return x.id === e.id; }) !== i; });
  if(duplicated) evidence = stableSort(evidence);
  evidence.forEach(function(e) {
    var base = String(e.id), n = seenIds[base] = (seenIds[base] || 0) + 1, eid = n === 1 ? base : base + '~' + n;
    var meta = {};
    Object.keys(e).forEach(function(k) { if(k !== 'content' && k !== 'bytes') meta[k] = e[k]; });
    var contentId = leaf('evidence_content:' + C + ':' + eid, 'evidence_content', {content: e.content, bytes: e.bytes, adapter: e.adapter},
      function(x, y) { return x.content === y.content && x.bytes === y.bytes && x.adapter === y.adapter; });
    var metaId = leaf('evidence_meta:' + C + ':' + eid, 'evidence_meta', meta);
    var digestId = node('digest:' + C + ':' + eid, 'evidence_digest', 'digest', {}, [{role: 'content', id: contentId}]);
    var manifestId = node('manifest:' + C + ':' + eid, 'manifest', 'manifest', {}, [{role: 'meta', id: metaId}, {role: 'digest', id: digestId}, {role: 'identity', id: identity}]);
    evcheckIds.push(node('evcheck:' + C + ':' + eid, 'evidence_check', 'evidence_checks', {}, [{role: 'manifest', id: manifestId}, {role: 'identity', id: identity}]));
    manifestIds.push(manifestId);
    var cat = typeof e.category === 'string' ? e.category : JSON.stringify(e.category === undefined ? null : e.category);
    (manifestByCategory[cat] = manifestByCategory[cat] || []).push(manifestId);
  });
  manifestIds.sort(); evcheckIds.sort();
  var evset = node('evset:' + C, 'evidence_set', 'evidence_set', {}, manifestIds.map(function(id) { return {role: 'manifest', id: id}; }));
  var idcheck = node('idcheck:' + C, 'identity_check', 'identity_checks', {}, [{role: 'identity', id: identity}, {role: 'pack', id: shared('pack:' + K)}, {role: 'peers', id: peers}, {role: 'ambiguous', id: attr('field.ambiguous')}]);

  // Conditions
  var condIds = [], condOf = Object.create(null);
  [['rules', 'rule'], ['evidence_requirements', 'requirement'], ['exceptions', 'exception'], ['unsupported_conditions', 'unsupported_condition']].forEach(function(g) {
    Object.keys(pack[g[0]]).sort().forEach(function(id) {
      var item = pack[g[0]][id];
      if(item && typeof item === 'object' && item.when) {
        var cid = node('cond:' + C + ':' + g[0] + ':' + id, 'condition', 'condition', {group: g[0], id: id}, [{role: 'def', id: shared(g[1] + ':' + K + ':' + id)}, {role: 'attr', id: attr(item.when.path)}]);
        condOf[g[0] + ':' + id] = cid; condIds.push(cid);
      }
    });
  });

  // Parameters (Pack parameters plus any parameter referenced by a rule or the calculation)
  var paramKeys = Object.keys(pack.parameters), calcParams = eiCalcParams(pack.calculation_spec), ruleIds = Object.keys(pack.rules).sort();
  var referenced = calcParams.slice();
  ruleIds.forEach(function(id) { var r = pack.rules[id]; if(r && typeof r.parameter === 'string' && referenced.indexOf(r.parameter) < 0) referenced.push(r.parameter); });
  var allParams = Array.from(new Set(paramKeys.concat(referenced))).sort(), paramNode = Object.create(null), factorRefs = {};
  allParams.forEach(function(k) {
    var deps = [], args = {id: k}, def = eiOwn(pack.parameters, k) ? pack.parameters[k] : undefined;
    if(def !== undefined) {
      deps.push({role: 'def', id: shared('parameter:' + K + ':' + k)});
      if(def && typeof def === 'object' && def.factor_ref !== undefined) {
        var resolution = typeof def.factor_ref === 'string' ? resolveFactor(factors, def.factor_ref, a.start, a.end) : {status: 'UNKNOWN_FACTOR', key: null};
        args.resolution = {status: resolution.status, key: resolution.key};
        factorRefs[k] = resolution.key;
        if(resolution.status === 'RESOLVED') deps.push({role: 'factor', id: shared('factor:' + resolution.key)});
      }
      if(overrideIds[k]) deps.push({role: 'override', id: overrideIds[k]});
    }
    paramNode[k] = node('param:' + C + ':' + k, 'parameter_value', 'param_value', args, deps);
  });
  var unknownIds = Object.keys(overrideIds).sort().filter(function(k) { return !eiOwn(pack.parameters, k); }).map(function(k) {
    return node('unknownparam:' + C + ':' + k, 'parameter_check', 'unknown_parameter', {id: k}, [{role: 'override', id: overrideIds[k]}]);
  });
  var pcheckIds = referenced.slice().sort().map(function(k) {
    var deps = [{role: 'param', id: paramNode[k]}, {role: 'spec', id: shared('calcspec:' + K)}], refs = [];
    ruleIds.forEach(function(id) {
      var r = pack.rules[id];
      if(!r || r.parameter !== k) return;
      refs.push({id: id, conditional: !!condOf['rules:' + id]});
      deps.push({role: 'rule', id: shared('rule:' + K + ':' + id)});
    });
    refs.forEach(function(ref) { if(ref.conditional) deps.push({role: 'cond', id: condOf['rules:' + ref.id]}); });
    return node('pcheck:' + C + ':' + k, 'parameter_check', 'parameter_check', {id: k, rules: refs}, deps);
  });

  // Rules, requirements, exceptions
  var ruleNodeIds = ruleIds.map(function(id) {
    var r = pack.rules[id], deps = [{role: 'def', id: shared('rule:' + K + ':' + id)}];
    if(condOf['rules:' + id]) deps.push({role: 'cond', id: condOf['rules:' + id]});
    deps.push({role: 'input', id: attr(r ? r.input : undefined)});
    if(r && r.parameter) deps.push({role: 'param', id: paramNode[r.parameter]});
    return node('ruleres:' + C + ':' + id, 'rule_result', 'rule_result', {id: id}, deps);
  });
  var reqNodeIds = Object.keys(pack.evidence_requirements).sort().map(function(id) {
    var r = pack.evidence_requirements[id], deps = [{role: 'def', id: shared('requirement:' + K + ':' + id)}];
    if(condOf['evidence_requirements:' + id]) deps.push({role: 'cond', id: condOf['evidence_requirements:' + id]});
    var cat = r && typeof r.category === 'string' ? r.category : JSON.stringify(r && r.category === undefined ? null : r && r.category);
    (manifestByCategory[cat] || []).slice().sort().forEach(function(mid) { deps.push({role: 'evidence', id: mid}); });
    return node('reqres:' + C + ':' + id, 'requirement_result', 'requirement_result', {id: id}, deps);
  });
  var excNodeIds = [];
  [['exceptions', 'exception'], ['unsupported_conditions', 'unsupported_condition']].forEach(function(g) {
    Object.keys(pack[g[0]]).sort().forEach(function(id) {
      var e = pack[g[0]][id], deps = [{role: 'def', id: shared(g[1] + ':' + K + ':' + id)}];
      if(condOf[g[0] + ':' + id]) deps.push({role: 'cond', id: condOf[g[0] + ':' + id]});
      if(e && typeof e === 'object' && e.input) deps.push({role: 'input', id: attr(e.input)});
      excNodeIds.push(node('excres:' + C + ':' + g[0] + ':' + id, 'exception_result', 'exception_result', {group: g[0], id: id}, deps));
    });
  });

  // Calculation, evaluation, record
  var calcDeps = [{role: 'spec', id: shared('calcspec:' + K)}];
  eiCalcInputs(pack.calculation_spec).forEach(function(p) { calcDeps.push({role: 'input', id: attr(p)}); });
  calcParams.forEach(function(k) { calcDeps.push({role: 'param', id: paramNode[k]}); });
  var calc = node('calc:' + C, 'calculation', 'calculation', {}, calcDeps);
  var evalDeps = [{role: 'identity', id: idcheck}, {role: 'evidence_set', id: evset}];
  [['evidence', evcheckIds], ['condition', condIds], ['parameter', pcheckIds], ['unknown', unknownIds], ['rule', ruleNodeIds], ['requirement', reqNodeIds], ['exception', excNodeIds]].forEach(function(g) {
    g[1].forEach(function(id) { evalDeps.push({role: g[0], id: id}); });
  });
  evalDeps.push({role: 'calculation', id: calc});
  var evaluation = node('eval:' + C, 'evaluation', 'evaluation', {}, evalDeps);
  var root = {id: 'inputroot:' + C, kind: 'input_root', op: 'input_root', args: {}, deps: leaves.map(function(l) { return l.id; }).sort().map(function(id) { return {role: 'leaf', id: id}; })};
  derived.unshift(root);
  var recordDeps = [{role: 'evaluation', id: evaluation}, {role: 'calculation', id: calc}, {role: 'source', id: shared('source:' + K)}, {role: 'input_root', id: root.id}, {role: 'rest', id: restId}];
  manifestIds.forEach(function(id) { recordDeps.push({role: 'manifest', id: id}); });
  allParams.forEach(function(k) { recordDeps.push({role: 'param', id: paramNode[k]}); });
  var record = node('record:' + C, 'record', 'record', {claim_id: C}, recordDeps);
  return {claim_id: C, pack_key: K, leaves: leaves, derived: derived, shared_used: sharedUsed, outputs: {evaluation: evaluation, calculation: calc, record: record},
    meta: {field_id: f.id, program_id: a.program_id, factor_refs: factorRefs}};
}

// ---- Evaluation with reuse ------------------------------------------------------------
function eiSameList(a, b) { if(a.length !== b.length) return false; for(var i = 0; i < a.length; i++) if(a[i] !== b[i]) return false; return true; }
function eiEvaluatePlan(plan, shared, prev, counters) {
  var nodes = Object.create(null), order = [], recomputed = [], cutoff = [], changedLeaves = [];
  function lookup(id) { var n = nodes[id] || shared[id]; if(!n) eiFail('DANGLING_DEPENDENCY'); return n; }
  plan.leaves.forEach(function(l) {
    var old = prev && prev.nodes[l.id], reuse = !!old && (old.value === l.value || (!!l.same && l.same(old.value, l.value)));
    var vh = reuse ? old.vh : hashObject(l.value);
    if(!reuse) counters.leaves_hashed++;
    if(!old || old.vh !== vh) changedLeaves.push(l.id);
    nodes[l.id] = {id: l.id, kind: l.kind, value: reuse ? old.value : l.value, vh: vh};
    order.push(l.id);
  });
  plan.derived.forEach(function(n) {
    var dv = n.deps.map(function(dep) { return lookup(dep.id).vh; });
    var sig = n.op + '|' + canonicalize(n.args) + '|' + n.deps.map(function(dep) { return dep.role; }).join(',');
    var old = prev && prev.nodes[n.id], node = {id: n.id, kind: n.kind, op: n.op, args: n.args, deps: n.deps, sig: sig, dv: dv};
    if(old && old.sig === sig && eiSameList(old.dv, dv)) { node.value = old.value; node.vh = old.vh; counters.nodes_reused++; }
    else {
      var d = {
        one: function(role) { for(var i = 0; i < n.deps.length; i++) if(n.deps[i].role === role) return lookup(n.deps[i].id).value; return undefined; },
        all: function(role) { return n.deps.filter(function(dep) { return dep.role === role; }).map(function(dep) { return lookup(dep.id).value; }); },
        has: function(role) { return n.deps.some(function(dep) { return dep.role === role; }); },
        hash: function(role) { for(var i = 0; i < n.deps.length; i++) if(n.deps[i].role === role) return lookup(n.deps[i].id).vh; return undefined; },
        hashes: function(role) { return n.deps.filter(function(dep) { return dep.role === role; }).map(function(dep) { return [dep.id, lookup(dep.id).vh]; }); }
      };
      node.value = EI_OPS[n.op](d, n.args); node.vh = hashObject(node.value);
      counters.nodes_recomputed++; recomputed.push(n.id);
      if(old && old.vh === node.vh) cutoff.push(n.id);
    }
    nodes[n.id] = node; order.push(n.id);
  });
  return {nodes: nodes, order: order, recomputed: recomputed, cutoff: cutoff, changed_leaves: changedLeaves};
}
function eiClaimState(input, pack, factors, shared, prev, counters) {
  var plan = eiPlanClaim(input, pack, factors);
  plan.shared_used.forEach(function(id) { if(!shared[id]) eiFail('SHARED_NODE_MISSING'); });
  var run = eiEvaluatePlan(plan, shared, prev, counters), record = run.nodes[plan.outputs.record];
  var calc = run.nodes[plan.outputs.calculation].value, evaluation = run.nodes[plan.outputs.evaluation].value;
  var context = shared['source:' + plan.pack_key].value.accounting_context, methodology = shared['pack:' + plan.pack_key].value.methodology_id;
  return {state: {claim_id: plan.claim_id, pack_key: plan.pack_key, input: input, nodes: run.nodes, order: run.order, outputs: plan.outputs, shared_used: plan.shared_used, meta: plan.meta,
      record_hash: record.vh, semantic_hash: record.value.semantic_hash, status: evaluation.status,
      contribution: {key: [plan.meta.program_id === undefined ? null : plan.meta.program_id, methodology, context, calc.unit].join('|'), program_id: plan.meta.program_id === undefined ? null : plan.meta.program_id,
        methodology_id: methodology, accounting_context: context, unit: calc.unit,
        status: evaluation.status, exact: evaluation.status === 'AUTO_REEVALUATED' && calc.exact && eiIsDecimal(calc.exact) ? calc.exact : null},
      evidence_lineage: prev ? prev.evidence_lineage : {}, history: prev ? prev.history : []},
    run: run};
}

// ---- Aggregates (exact, incrementally maintained) --------------------------------------
function eiAggregateApply(aggregates, contribution, sign) {
  var current = aggregates[contribution.key] || {key: contribution.key, program_id: contribution.program_id, methodology_id: contribution.methodology_id, accounting_context: contribution.accounting_context, unit: contribution.unit,
    claims: 0, by_status: {}, preview_claims: 0, preview_total: {n: '0', d: '1'}, certified_total: null};
  var next = Object.assign({}, current, {by_status: Object.assign({}, current.by_status)});
  next.claims += sign;
  next.by_status[contribution.status] = (next.by_status[contribution.status] || 0) + sign;
  if(!next.by_status[contribution.status]) delete next.by_status[contribution.status];
  if(contribution.exact !== null) {
    var total = eiRatFromPortable(next.preview_total), value = eiDecimal(contribution.exact);
    next.preview_total = eiRatPortable(sign > 0 ? eiRatAdd(total, value) : eiRatSub(total, value));
    next.preview_claims += sign;
  }
  var out = Object.assign({}, aggregates);
  if(next.claims === 0) delete out[contribution.key]; else out[contribution.key] = next;
  return out;
}
function eiAggregateView(state) {
  return Object.keys(state.aggregates).sort().map(function(k) {
    var g = state.aggregates[k];
    return {program_id: g.program_id, methodology_id: g.methodology_id, accounting_context: g.accounting_context, unit: g.unit, claims: g.claims, by_status: g.by_status, preview_claims: g.preview_claims,
      preview_total: eiRatText(eiRatFromPortable(g.preview_total)), certified_total: null,
      note: 'Sum of arithmetic previews of AUTO_REEVALUATED Claims only. Never summed across programmes, methodologies, accounting contexts or units. Not an inventory total or a credit quantity.'};
  });
}

// ---- Build / verify -----------------------------------------------------------------
function eiCounters() { return {claims_planned: 0, leaves_hashed: 0, nodes_recomputed: 0, nodes_reused: 0}; }
function eiEnsureShared(shared, packsInState, pack, factors, factorKeys) {
  var K = compilerKey(pack), known = packsInState[K], hash = hashObject(pack);
  if(known && known !== hash) eiFail('PACK_IDENTITY_CONFLICT');
  if(!known) { eiPackNodes(pack).nodes.forEach(function(n) { shared[n.id] = n; }); packsInState[K] = hash; }
  (factorKeys || []).forEach(function(key) { if(key && !shared['factor:' + key]) shared['factor:' + key] = eiSharedNode('factor:' + key, 'factor', factors[key]); });
}
function eiFactorKeysFor(pack, factors, activity) {
  return Object.keys(pack.parameters).map(function(k) {
    var def = pack.parameters[k];
    return def && typeof def === 'object' && typeof def.factor_ref === 'string' ? resolveFactor(factors, def.factor_ref, activity.start, activity.end).key : null;
  }).filter(Boolean);
}
function eiPrepareInput(raw) {
  if(!raw || typeof raw !== 'object' || !raw.activity || !raw.field) eiFail('IDENTITY_REQUIRED');
  if(typeof raw.activity.id !== 'string' || !raw.activity.id || raw.activity.id.length > 180) eiFail('CLAIM_ID_REQUIRED');
  eiAssertJsonSafe(raw);
  return canonicalCompilerInput(raw);
}
function eiBuild(claims, ctx) {
  if(!Array.isArray(claims) || claims.length > EI_LIMITS.max_claims) eiFail('CLAIMS_LIMIT');
  if(!ctx || !ctx.packs || !ctx.factors) eiFail('CONTEXT_REQUIRED');
  var shared = Object.create(null), packs = Object.create(null), out = Object.create(null), aggregates = {}, counters = eiCounters();
  claims.forEach(function(raw) {
    var input = eiPrepareInput(raw), id = input.activity.id;
    if(out[id]) eiFail('DUPLICATE_CLAIM_ID');
    var pack = ctx.packs[compilerKey(input.activity)];
    if(!pack) eiFail('UNKNOWN_PACK');
    eiEnsureShared(shared, packs, pack, ctx.factors, eiFactorKeysFor(pack, ctx.factors, input.activity));
    var built = eiClaimState(input, pack, ctx.factors, shared, null, counters).state;
    counters.claims_planned++;
    Object.keys(built.nodes).forEach(function(nid) {
      var n = built.nodes[nid];
      if(n.kind !== 'evidence_meta') return;
      var eid = nid.slice(('evidence_meta:' + id + ':').length);
      built.evidence_lineage = Object.assign({}, built.evidence_lineage);
      built.evidence_lineage[eid] = eiLineageAppend([], built.nodes['digest:' + id + ':' + eid].value.content_hash, n.vh, null);
    });
    out[id] = built;
    aggregates = eiAggregateApply(aggregates, built.contribution, 1);
  });
  return {schema: EI_STATE_SCHEMA, engine_version: EI_ENGINE_VERSION, shared: shared, packs: packs, factor_registry_hash: eiFactorRegistryHash(ctx.factors),
    claims: out, aggregates: aggregates, build_counters: counters};
}
/** Order-independent digest of all node value hashes, record hashes and aggregates. */
function eiStateDigest(state) {
  var ids = Object.keys(state.claims).sort();
  return hashObject({schema: EI_STATE_SCHEMA, factor_registry_hash: state.factor_registry_hash,
    claims: ids.map(function(id) { var c = state.claims[id]; return [id, c.pack_key, c.record_hash, hashObject(c.order.slice().sort().map(function(n) { return [n, c.nodes[n].vh]; }))]; }),
    aggregates: eiAggregateView(state)});
}
/** Independent check: rebuild everything from the stored inputs and compare digests. */
function eiVerifyState(state, ctx) {
  var ids = Object.keys(state.claims).sort(), rebuilt = eiBuild(ids.map(function(id) { return state.claims[id].input; }), ctx);
  var mismatches = ids.filter(function(id) {
    var a = state.claims[id], b = rebuilt.claims[id];
    return a.record_hash !== b.record_hash || a.order.length !== b.order.length || a.order.some(function(n) { return !b.nodes[n] || b.nodes[n].vh !== a.nodes[n].vh; });
  });
  var digestMatch = eiStateDigest(state) === eiStateDigest(rebuilt);
  return {status: !mismatches.length && digestMatch ? 'MATCH' : 'MISMATCH', compared_claims: ids.length, mismatches: mismatches, aggregates_match: canonicalize(eiAggregateView(state)) === canonicalize(eiAggregateView(rebuilt)),
    oracle: 'FULL_REBUILD_FROM_STORED_INPUTS', state_digest: eiStateDigest(state)};
}
function eiRecord(state, claimId) {
  var c = state.claims[claimId];
  if(!c) eiFail('CLAIM_NOT_FOUND');
  return {record_hash: c.record_hash, record: c.nodes[c.outputs.record].value};
}

// ---- Differential re-computation -------------------------------------------------------
function eiValidateChange(change) {
  if(!change || typeof change !== 'object' || Array.isArray(change) || EI_CHANGE_TYPES.indexOf(change.type) < 0) eiFail('UNSUPPORTED_CHANGE_TYPE');
  if(change.type === 'field' || change.type === 'activity') validateChangePatch(change.patch);
  if(change.type === 'activity' && Object.keys(change.patch).some(function(k) { return ['id', 'field_id', 'farmer_id', 'program_id', 'methodology_id', 'methodology_version'].indexOf(k) >= 0; })) throw new Error('ACTIVITY_IDENTITY_CHANGE_UNSUPPORTED');
  if(change.type === 'field' && eiOwn(change.patch, 'id')) eiFail('FIELD_IDENTITY_CHANGE_UNSUPPORTED');
  if(change.type !== 'factor_registry') eiAssertJsonSafe(change);
  return change;
}
function eiChangeHash(change, nextCtx) {
  if(change.type === 'factor_registry') return hashObject({type: 'factor_registry', factor_registry_hash: eiFactorRegistryHash(nextCtx.factors)});
  return hashObject(change);
}
/**
 * Apply one change. `ctx` is the context AFTER the change (for `factor_registry`, the new
 * registry). Returns a new state plus a delta; the given state is not modified.
 */
function eiApplyChange(state, change, ctx) {
  eiValidateChange(change);
  if(!state || state.schema !== EI_STATE_SCHEMA) eiFail('INVALID_STATE');
  var registryHash = eiFactorRegistryHash(ctx.factors);
  if(change.type !== 'factor_registry' && registryHash !== state.factor_registry_hash) eiFail('FACTOR_REGISTRY_MISMATCH');
  var ids = Object.keys(state.claims), planned = [], changeHash = eiChangeHash(change, ctx);
  function plan(c, input, pack) { planned.push({claim: c, input: input, pack: pack}); }
  if(change.type === 'methodology') {
    var oldPack = ctx.packs[change.old_key], newPack = ctx.packs[change.new_key];
    if(!oldPack) throw new Error('UNKNOWN_ORIGINAL_PACK');
    if(!newPack) throw new Error('UNKNOWN_TARGET_PACK');
    compareMethodologyVersions(oldPack, newPack);
    ids.forEach(function(id) {
      var c = state.claims[id];
      if(c.pack_key !== change.old_key) return;
      var input = Object.assign({}, c.input, {activity: Object.assign({}, c.input.activity, {methodology_version: newPack.methodology_version})});
      // Re-binding creates new derived evidence metadata; original inputs stay in the previous state.
      input.evidence = c.input.evidence.map(function(e) { return e.methodology_version === oldPack.methodology_version ? Object.assign({}, e, {methodology_version: newPack.methodology_version}) : e; });
      plan(c, input, newPack);
    });
  } else if(change.type === 'parameter') {
    var target = ctx.packs[change.pack_key];
    if(!target) throw new Error('UNKNOWN_ORIGINAL_PACK');
    if(!eiOwn(target.parameters, change.parameter)) throw new Error('UNKNOWN_PARAMETER');
    ids.forEach(function(id) {
      var c = state.claims[id];
      if(c.pack_key !== change.pack_key) return;
      var overrides = Object.assign({}, c.input.parameter_overrides || {}); overrides[change.parameter] = clone(change.value);
      plan(c, Object.assign({}, c.input, {parameter_overrides: overrides}), target);
    });
  } else if(change.type === 'field') {
    ids.forEach(function(id) {
      var c = state.claims[id];
      if(c.meta.field_id === change.field_id) plan(c, Object.assign({}, c.input, {field: Object.assign({}, c.input.field, clone(change.patch))}), ctx.packs[c.pack_key]);
    });
  } else if(change.type === 'factor_registry') {
    ids.forEach(function(id) {
      var c = state.claims[id], pack = ctx.packs[c.pack_key], refs = c.meta.factor_refs;
      if(!Object.keys(refs).length) return;
      var differs = Object.keys(refs).some(function(k) {
        var key = resolveFactor(ctx.factors, pack.parameters[k].factor_ref, c.input.activity.start, c.input.activity.end).key;
        return key !== refs[k] || (key && hashObject(ctx.factors[key]) !== (state.shared['factor:' + key] || {}).vh);
      });
      if(differs) plan(c, c.input, pack);
    });
  } else {
    var c = state.claims[change.activity_id];
    if(!c) eiFail('CLAIM_NOT_FOUND');
    var input = Object.assign({}, c.input);
    if(change.type === 'activity') input.activity = Object.assign({}, c.input.activity, clone(change.patch));
    else if(change.type === 'evidence') {
      if(!c.input.evidence.some(function(e) { return e.id === change.evidence_id; })) throw new Error('EVIDENCE_NOT_FOUND');
      input.evidence = c.input.evidence.map(function(e) { return e.id === change.evidence_id ? clone(change.replacement) : e; });
    } else if(change.type === 'evidence_add') {
      if(!change.evidence || typeof change.evidence !== 'object' || c.input.evidence.some(function(e) { return e.id === change.evidence.id; })) eiFail('EVIDENCE_ID_CONFLICT');
      input.evidence = c.input.evidence.concat([clone(change.evidence)]);
    } else {
      if(!c.input.evidence.some(function(e) { return e.id === change.evidence_id; })) throw new Error('EVIDENCE_NOT_FOUND');
      input.evidence = c.input.evidence.filter(function(e) { return e.id !== change.evidence_id; });
    }
    plan(c, input, ctx.packs[c.pack_key]);
  }

  var shared = state.shared, packs = state.packs, sharedCopied = false, claims = state.claims, claimsCopied = false, aggregates = state.aggregates, counters = eiCounters(), rows = [];
  planned.forEach(function(p) {
    if(!p.pack) eiFail('UNKNOWN_PACK');
    var K = compilerKey(p.pack), factorKeys = eiFactorKeysFor(p.pack, ctx.factors, p.input.activity);
    var needsShared = !packs[K] || factorKeys.some(function(key) { return !shared['factor:' + key] || shared['factor:' + key].vh !== hashObject(ctx.factors[key]); });
    if(needsShared && !sharedCopied) { shared = Object.assign(Object.create(null), shared); packs = Object.assign(Object.create(null), packs); sharedCopied = true; }
    if(needsShared) factorKeys.forEach(function(key) { if(shared['factor:' + key] && shared['factor:' + key].vh !== hashObject(ctx.factors[key])) delete shared['factor:' + key]; });
    eiEnsureShared(shared, packs, p.pack, ctx.factors, factorKeys);
    var old = p.claim, built = eiClaimState(p.input, p.pack, ctx.factors, shared, old, counters), next = built.state, run = built.run;
    counters.claims_planned++;
    var before = old.nodes[old.outputs.record].value, after = next.nodes[next.outputs.record].value;
    var classification = next.record_hash === old.record_hash ? 'NO_OP' : next.semantic_hash === old.semantic_hash ? 'PROVENANCE_ONLY' : 'SEMANTIC_CHANGE';
    if(classification === 'NO_OP') return rows.push({claim_id: old.claim_id, classification: 'NO_OP', record_hash: old.record_hash});
    // Evidence revision lineage
    var lineage = Object.assign({}, old.evidence_lineage);
    Object.keys(next.nodes).forEach(function(nid) {
      var n = next.nodes[nid];
      if(n.kind !== 'evidence_meta') return;
      var eid = nid.slice(('evidence_meta:' + old.claim_id + ':').length), contentHash = next.nodes['digest:' + old.claim_id + ':' + eid].value.content_hash;
      var list = lineage[eid] || [], last = list[list.length - 1];
      if(!last || last.content_hash !== contentHash || last.meta_hash !== n.vh) lineage[eid] = eiLineageAppend(list, contentHash, n.vh, changeHash);
    });
    next.evidence_lineage = lineage;
    next.history = old.history.concat([{record_hash: old.record_hash, semantic_hash: old.semantic_hash, pack_key: old.pack_key, superseded_by_change: changeHash}]);
    if(!claimsCopied) { claims = Object.assign(Object.create(null), claims); claimsCopied = true; }
    claims[old.claim_id] = next;
    aggregates = eiAggregateApply(eiAggregateApply(aggregates, old.contribution, -1), next.contribution, 1);
    var removed = old.order.filter(function(id) { return !next.nodes[id]; }), added = next.order.filter(function(id) { return !old.nodes[id]; });
    rows.push({claim_id: old.claim_id, classification: classification, requires_reverification: classification === 'SEMANTIC_CHANGE',
      previous_record_hash: old.record_hash, record_hash: next.record_hash, previous_semantic_hash: old.semantic_hash, semantic_hash: next.semantic_hash,
      previous_pack_key: old.pack_key, pack_key: next.pack_key, status_before: before.evaluation.status, status_after: after.evaluation.status,
      preview_before: before.calculation.exact, preview_after: after.calculation.exact,
      changed_leaves: run.changed_leaves.slice().sort(), recomputed_nodes: run.recomputed, cutoff_nodes: run.cutoff, added_nodes: added, removed_nodes: removed,
      nodes_total: next.order.length, nodes_reused: next.order.length - run.recomputed.length - run.changed_leaves.length,
      human_decisions_stale: true});
  });
  rows.sort(function(x, y) { return x.claim_id < y.claim_id ? -1 : x.claim_id > y.claim_id ? 1 : 0; });
  var effective = rows.filter(function(r) { return r.classification !== 'NO_OP'; });
  var next = {schema: EI_STATE_SCHEMA, engine_version: EI_ENGINE_VERSION, shared: shared, packs: packs, factor_registry_hash: registryHash, claims: claims, aggregates: aggregates, build_counters: state.build_counters};
  return {state: next, delta: {schema: 'naft-evidence-intel-delta-1', change: change.type === 'factor_registry' ? {type: 'factor_registry', factor_registry_hash: registryHash} : clone(change), change_hash: changeHash,
    counts: {total_claims: ids.length, examined: planned.length, semantic_change: effective.filter(function(r) { return r.classification === 'SEMANTIC_CHANGE'; }).length,
      provenance_only: effective.filter(function(r) { return r.classification === 'PROVENANCE_ONLY'; }).length, no_op: rows.length - effective.length, untouched: ids.length - planned.length,
      leaves_hashed: counters.leaves_hashed, nodes_recomputed: counters.nodes_recomputed, nodes_reused: counters.nodes_reused},
    claims: rows,
    semantics: 'NODE_LEVEL_REUSE_BY_DEPENDENCY_VALUE_HASH_WITH_EARLY_CUTOFF', formal_certification: false}};
}

// ---- Graph export and traversal --------------------------------------------------------
/** Edges point dependency -> dependent, the same convention as naft-provenance-1. */
function eiGraph(state, claimIds) {
  var ids = (claimIds || Object.keys(state.claims)).slice().sort(), nodes = [], edges = [], seenShared = Object.create(null);
  ids.forEach(function(id) {
    var c = state.claims[id];
    if(!c) eiFail('CLAIM_NOT_FOUND');
    c.shared_used.forEach(function(sid) { if(!seenShared[sid]) { seenShared[sid] = true; nodes.push({id: sid, kind: state.shared[sid].kind, hash: state.shared[sid].vh, scope: 'shared'}); } });
    c.order.forEach(function(nid) {
      var n = c.nodes[nid];
      nodes.push({id: nid, kind: n.kind, hash: n.vh, scope: 'claim:' + id});
      (n.deps || []).forEach(function(dep) { edges.push({from: dep.id, to: nid, type: dep.role}); });
    });
    var aggregate = 'aggregate:' + c.contribution.key;
    if(!seenShared[aggregate]) { seenShared[aggregate] = true; nodes.push({id: aggregate, kind: 'aggregate', hash: hashObject(state.aggregates[c.contribution.key]), scope: 'portfolio'}); }
    edges.push({from: c.outputs.record, to: aggregate, type: 'aggregated_into'});
  });
  return {schema: 'naft-evidence-graph-1', edge_direction: 'dependency_to_dependent', nodes: nodes, edges: edges};
}
function eiGraphIndex(graph) {
  var out = new Map(), inn = new Map(), kinds = new Map();
  graph.nodes.forEach(function(n) { if(kinds.has(n.id)) eiFail('DUPLICATE_GRAPH_NODE'); kinds.set(n.id, n); out.set(n.id, []); inn.set(n.id, []); });
  graph.edges.forEach(function(e) { if(!kinds.has(e.from) || !kinds.has(e.to)) eiFail('DANGLING_GRAPH_EDGE'); out.get(e.from).push(e.to); inn.get(e.to).push(e.from); });
  return {nodes: kinds, out: out, inn: inn};
}
/** Breadth-first closure in O(V + E). direction: 'downstream' (dependents) or 'upstream' (dependencies). */
function eiTrace(index, seeds, direction) {
  var adjacency = direction === 'upstream' ? index.inn : direction === 'downstream' ? index.out : eiFail('UNKNOWN_DIRECTION');
  seeds.forEach(function(id) { if(!index.nodes.has(id)) throw new Error('UNKNOWN_GRAPH_NODE'); });
  var found = new Set(seeds), queue = seeds.slice(), head = 0;
  while(head < queue.length) {
    var next = adjacency.get(queue[head++]);
    for(var i = 0; i < next.length; i++) if(!found.has(next[i])) { found.add(next[i]); queue.push(next[i]); }
  }
  return Array.from(found).sort();
}
function eiTopologicalOrder(index) {
  var degree = new Map(), queue = [], order = [], head = 0;
  index.nodes.forEach(function(n, id) { degree.set(id, index.inn.get(id).length); });
  Array.from(degree.keys()).sort().forEach(function(id) { if(degree.get(id) === 0) queue.push(id); });
  while(head < queue.length) {
    var id = queue[head++]; order.push(id);
    index.out.get(id).forEach(function(to) { degree.set(to, degree.get(to) - 1); if(degree.get(to) === 0) queue.push(to); });
  }
  if(order.length !== index.nodes.size) eiFail('GRAPH_CYCLE');
  return order;
}
function eiValidateGraph(graph) {
  if(!graph || graph.schema !== 'naft-evidence-graph-1' || graph.edge_direction !== 'dependency_to_dependent') eiFail('INVALID_GRAPH');
  var index = eiGraphIndex(graph);
  eiTopologicalOrder(index);
  return {status: 'VALID', nodes: graph.nodes.length, edges: graph.edges.length};
}
/** Shortest dependency path from an input to an output, for "why did this change" answers. */
function eiDependencyPath(index, from, to) {
  if(!index.nodes.has(from) || !index.nodes.has(to)) throw new Error('UNKNOWN_GRAPH_NODE');
  var parent = new Map([[from, null]]), queue = [from], head = 0;
  while(head < queue.length) {
    var current = queue[head++];
    if(current === to) { var path = []; while(current !== null) { path.unshift(current); current = parent.get(current); } return path; }
    index.out.get(current).slice().sort().forEach(function(next) { if(!parent.has(next)) { parent.set(next, current); queue.push(next); } });
  }
  return null;
}

// ---- Differential oracle against the existing compiler ---------------------------------
/** For Packs within the legacy feature set, the engine must agree with compileEvidence(). */
function eiLegacyParity(state, claimId, ctx) {
  var c = state.claims[claimId];
  if(!c) eiFail('CLAIM_NOT_FOUND');
  var pack = ctx.packs[c.pack_key];
  if(!eiPackFeatures(pack).legacy_compatible) return {status: 'NOT_APPLICABLE', reason: 'Pack uses exact-arithmetic or versioned-coefficient features outside the legacy compiler', differences: []};
  var legacy = compileEvidence(c.input, pack).document, record = c.nodes[c.outputs.record].value, differences = [];
  function compare(name, a, b) { if(canonicalize(a) !== canonicalize(b)) differences.push(name); }
  compare('status', legacy.evaluation.status, record.evaluation.status);
  compare('issues', legacy.evaluation.issues, record.evaluation.issues);
  compare('rules', legacy.evaluation.rules, record.evaluation.rules);
  compare('missing_evidence', legacy.evaluation.missing_evidence, record.evaluation.missing_evidence);
  compare('checks', stableSort(legacy.evaluation.checks), record.evaluation.checks);
  compare('calculation_values', legacy.calculation.inputs.values, record.calculation.values);
  compare('calculation_parameters', legacy.calculation.inputs.parameters, record.parameters);
  compare('arithmetic_preview', legacy.calculation.arithmetic_preview, record.calculation.arithmetic_preview);
  compare('unit', legacy.calculation.unit, record.calculation.unit);
  compare('calculation_status', legacy.calculation.status, record.calculation.status);
  compare('manifest_hashes', legacy.evidence_manifests.map(function(m) { return m.manifest_hash; }).sort(), record.evidence.map(function(e) { return e.manifest_hash; }).sort());
  return {status: differences.length ? 'MISMATCH' : 'MATCH', differences: differences, legacy_package_hash: hashObject(legacy), legacy_input_fingerprint: legacy.input_fingerprint};
}
