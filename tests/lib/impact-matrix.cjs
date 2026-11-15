'use strict';
/**
 * The deterministic adversarial change matrix of tests/impact-proof.test.js, exposed as
 * data so a second analyzer can be judged on exactly the same cases. The consumer asserts
 * that the legacy analyzer reproduces reports/impact-proof.json on this matrix, which
 * keeps the two definitions from drifting apart.
 *
 * Requires the Core, Compiler and compiler-demo globals to be loaded in this context.
 */
function valueAt(obj, path) {
  return String(path || '').split('.').reduce(function(v, k) { return v && Object.prototype.hasOwnProperty.call(v, k) ? v[k] : undefined; }, obj);
}
function oracleWhen(input, when) { return !when || canonicalize(valueAt(input, when.path)) === canonicalize(when.equals); }
function rebindMethodology(input, version) {
  var next = clone(input), oldVersion = next.activity.methodology_version;
  next.activity.methodology_version = version;
  next.evidence = (next.evidence || []).map(function(e) { return e.methodology_version === oldVersion ? Object.assign({}, e, {methodology_version: version}) : e; });
  return next;
}
/** Independent oracle: full legacy compilation, normalized to verification semantics. */
function semanticView(input, pack) {
  var pkg = compileEvidence(input, pack).document;
  var activeRequirements = Object.keys(pack.evidence_requirements).sort().filter(function(id) { return oracleWhen(input, pack.evidence_requirements[id].when); }).map(function(id) {
    var r = pack.evidence_requirements[id];
    return {id: id, category: r.category, required: !!r.required};
  });
  var used = new Set((pack.calculation_spec.parameters || []).slice());
  Object.keys(pack.rules).sort().forEach(function(id) { var r = pack.rules[id]; if(oracleWhen(input, r.when) && r.parameter) used.add(r.parameter); });
  var usedParameters = {};
  Array.from(used).sort().forEach(function(id) { usedParameters[id] = pkg.calculation.inputs.parameters[id]; });
  return {
    rules: pkg.evaluation.rules.map(function(r) { return {id: r.id, pass: r.pass, supported: r.supported, input: r.input, value: r.value, threshold: r.threshold}; }),
    evidence_requirements: activeRequirements,
    missing_evidence: pkg.evaluation.missing_evidence.slice().sort(),
    issues: pkg.evaluation.issues.map(function(i) { return {code: i.code, status: i.status}; }),
    used_parameters: usedParameters,
    calculation_spec: {operation: pack.calculation_spec.operation, inputs: clone(pack.calculation_spec.inputs || []), parameters: clone(pack.calculation_spec.parameters || []), unit: pack.calculation_spec.unit || null},
    calculation_values: clone(pkg.calculation.inputs.values),
    arithmetic_preview: pkg.calculation.arithmetic_preview,
    status: pkg.evaluation.status
  };
}
function variantClaim(id, variant) {
  var input = syntheticClaim(id, ['intensive', 'intensive_complete', 'sensitive', 'expert', 'ambiguous', 'unsupported'].includes(variant) ? variant : undefined);
  if(variant === 'low_days') input.activity.days = 5;
  if(variant === 'zero_area') input.field.area_ha = 0;
  if(variant === 'missing_record') input.evidence = input.evidence.filter(function(e) { return e.category !== 'record'; });
  if(variant === 'tamper') input.evidence[0].content += '-tampered';
  if(variant === 'unknown_stratum') delete input.activity.stratum;
  return input;
}
function proofPack(index, mutate) {
  var p = clone(COMPILER_REGISTRY['NAFT-SYNTHETIC@1']), n = String(index).padStart(2, '0');
  p.methodology_version = 'proof-' + n; p.rule_pack_version = 'impact-proof-' + n; p.source_url = 'urn:naft:impact-proof:' + n;
  p.source_hash = 'SYNTHETIC-PROOF-' + n; p.source_checked_at = '2026-09-29';
  p.scope = 'Deterministic adversarial proof fixture; not an institutional methodology.';
  mutate(p);
  return p;
}
const variants = ['standard', 'intensive', 'intensive_complete', 'sensitive', 'expert', 'ambiguous', 'unsupported', 'low_days', 'zero_area', 'missing_record', 'tamper', 'unknown_stratum'];
const mutations = [
  ['metadata_only', function() {}],
  ['rule_threshold', function(p) { p.rules.area.value = 1; }],
  ['rule_operation', function(p) { p.rules.area.op = 'gte'; }],
  ['rule_add_unconditional', function(p) { p.rules.proof = {op: 'gte', input: 'activity.days', value: 1}; }],
  ['rule_add_conditional', function(p) { p.rules.proof = {op: 'gte', input: 'activity.days', value: 9, when: {path: 'activity.stratum', equals: 'intensive'}}; }],
  ['rule_removed', function(p) { delete p.rules.area; }],
  ['rule_condition_changed', function(p) { p.rules.area.when = {path: 'activity.stratum', equals: 'intensive'}; }],
  ['rule_input_changed', function(p) { p.rules.area.input = 'activity.days'; }],
  ['rule_metadata_only', function(p) { p.rules.area.note = 'proof-metadata-only'; }],
  ['parameter_used_calculation', function(p) { p.parameters.factor.value = 3; }],
  ['parameter_used_rule', function(p) { p.parameters.minimum_days.value = 8; }],
  ['parameter_unused', function(p) { p.parameters.unused.value = 9; }],
  ['calculation_unit', function(p) { p.calculation_spec.unit = 'proof-index'; }],
  ['calculation_inputs', function(p) { p.calculation_spec.inputs = ['field.area_ha']; }],
  ['calculation_parameters', function(p) { p.calculation_spec.parameters = []; }],
  ['calculation_operation', function(p) { p.calculation_spec.operation = 'UNSUPPORTED'; }],
  ['requirement_add_unconditional', function(p) { p.evidence_requirements.sensor = {category: 'sensor', required: true}; }],
  ['requirement_add_conditional', function(p) { p.evidence_requirements.sensor = {category: 'sensor', required: true, when: {path: 'activity.stratum', equals: 'intensive'}}; }],
  ['requirement_removed', function(p) { delete p.evidence_requirements.record; }],
  ['requirement_category_changed', function(p) { p.evidence_requirements.record.category = 'photo'; }],
  ['requirement_required_changed', function(p) { p.evidence_requirements.record.required = false; }],
  ['exception_add_inactive', function(p) { p.exceptions.proof = {input: 'activity.proof_flag', equals: true, disposition: 'HUMAN_REVIEW_REQUIRED'}; }],
  ['exception_add_conditional', function(p) { p.exceptions.proof = {input: 'activity.sensitive', equals: true, when: {path: 'activity.sensitive', equals: true}, disposition: 'HUMAN_REVIEW_REQUIRED'}; }],
  ['exception_disposition', function(p) { p.exceptions.expert.disposition = 'UNSUPPORTED'; }],
  ['unsupported_condition_changed', function(p) { p.unsupported_conditions.special_process.equals = false; }],
  ['effective_period', function(p) { p.effective_to = '2026-06-15'; }],
  ['pack_status', function(p) { p.status = 'UNSUPPORTED'; }],
  ['pack_provenance_metadata', function(p) { p.provenance = 'public'; }],
  ['unknown_condition_rule', function(p) { p.rules.proof = {op: 'gte', input: 'activity.days', value: 1, when: {path: 'activity.missing_gate', equals: true}}; }],
  ['interaction_rule_parameter', function(p) { p.parameters.minimum_days.value = 8; p.rules.proof = {op: 'gte', input: 'activity.days', value: 9}; }],
  ['interaction_rule_requirement', function(p) { p.rules.proof = {op: 'gte', input: 'activity.days', value: 9, when: {path: 'activity.stratum', equals: 'intensive'}}; p.evidence_requirements.sensor = {category: 'sensor', required: true, when: {path: 'activity.stratum', equals: 'intensive'}}; }],
  ['interaction_calculation_parameter', function(p) { p.parameters.factor.value = 3; p.calculation_spec.inputs = ['field.area_ha']; }],
  ['interaction_condition_parameter', function(p) { p.parameters.minimum_days.value = 8; p.rules.duration.when = {path: 'activity.stratum', equals: 'intensive'}; }],
  ['interaction_multi_category', function(p) { p.rules.area.value = 1; p.parameters.factor.value = 3; p.evidence_requirements.sensor = {category: 'sensor', required: true, when: {path: 'activity.stratum', equals: 'intensive'}}; p.exceptions.proof = {input: 'activity.sensitive', equals: true, when: {path: 'activity.sensitive', equals: true}, disposition: 'HUMAN_REVIEW_REQUIRED'}; }]
];
const activitySpecs = [['days', {days: 12}], ['stratum', {stratum: 'intensive'}], ['start', {start: '2026-06-02'}], ['unused_sensitive_flag', {sensitive: true}]];
const evidenceMutations = [
  ['content', function(e) { e.content += '-proof-change'; }],
  ['adapter', function(e) { e.adapter = 'photo-bytes-v1'; }],
  ['activity_binding', function(e) { e.activity_id = 'OTHER-ACTIVITY'; }],
  ['field_binding', function(e) { e.field_id = 'OTHER-FIELD'; }],
  ['methodology_binding', function(e) { e.methodology_version = 'wrong'; }],
  ['period', function(e) { e.period = Object.assign({}, e.period, {end: '2026-07-01'}); }],
  ['category', function(e) { e.category = 'photo'; }],
  ['expected_hash', function(e) { e.expected_hash = '0'.repeat(64); }],
  ['provenance', function(e) { e.provenance = 'private'; }],
  ['source_metadata_only', function(e) { e.source = 'urn:naft:changed-source-metadata'; }]
];
/** Each case: {group, label, before, after, oldPack, newPack, change, registry}. */
function impactMatrix() {
  var p1 = COMPILER_REGISTRY['NAFT-SYNTHETIC@1'], cases = [], pad = function(n) { return String(n).padStart(2, '0'); };
  mutations.forEach(function(entry, index) {
    var next = proofPack(index + 1, entry[1]), registry = createMethodologyRegistry([p1, next]);
    variants.forEach(function(variant, vindex) {
      var before = variantClaim('PROOF-M-' + pad(index + 1) + '-' + pad(vindex + 1), variant);
      cases.push({group: 'methodology', label: entry[0] + '/' + variant, before: before, after: rebindMethodology(before, next.methodology_version), oldPack: p1, newPack: registry[compilerKey(next)], registry: registry,
        change: {type: 'methodology', old_key: compilerKey(p1), new_key: compilerKey(next)}});
    });
  });
  [['USED', 'used_factor', 'factor', 3], ['UNUSED', 'unused_parameter', 'unused', 9]].forEach(function(spec) {
    variants.forEach(function(variant, index) {
      var before = variantClaim('PROOF-P-' + spec[0] + '-' + pad(index + 1), variant), after = clone(before);
      after.parameter_overrides = Object.assign({}, after.parameter_overrides || {}); after.parameter_overrides[spec[2]] = spec[3];
      cases.push({group: 'parameter', label: spec[1] + '/' + variant, before: before, after: after, oldPack: p1, newPack: p1, registry: COMPILER_REGISTRY,
        change: {type: 'parameter', pack_key: compilerKey(p1), parameter: spec[2], value: spec[3]}});
    });
  });
  [['AREA', 'area', {area_ha: 3}], ['AMB', 'ambiguity', {ambiguous: true}]].forEach(function(spec) {
    variants.forEach(function(variant, index) {
      var before = variantClaim('PROOF-F-' + spec[0] + '-' + pad(index + 1), variant), after = clone(before);
      Object.assign(after.field, spec[2]);
      cases.push({group: 'field', label: spec[1] + '/' + variant, before: before, after: after, oldPack: p1, newPack: p1, registry: COMPILER_REGISTRY,
        change: {type: 'field', field_id: before.field.id, patch: clone(spec[2])}});
    });
  });
  activitySpecs.forEach(function(spec) {
    variants.forEach(function(variant, index) {
      var before = variantClaim('PROOF-A-' + spec[0].toUpperCase() + '-' + pad(index + 1), variant), after = clone(before);
      after.activity = Object.assign({}, after.activity, clone(spec[1]));
      cases.push({group: 'activity', label: spec[0] + '/' + variant, before: before, after: after, oldPack: p1, newPack: p1, registry: COMPILER_REGISTRY,
        change: {type: 'activity', activity_id: before.activity.id, patch: clone(spec[1])}});
    });
  });
  evidenceMutations.forEach(function(spec) {
    variants.forEach(function(variant, index) {
      var before = variantClaim('PROOF-E-' + spec[0].toUpperCase() + '-' + pad(index + 1), variant);
      if(!before.evidence.length) return;
      var targetId = before.evidence[0].id, replacement = clone(before.evidence[0]);
      spec[1](replacement, before);
      var after = clone(before);
      after.evidence = after.evidence.map(function(e) { return e.id === targetId ? clone(replacement) : e; });
      cases.push({group: 'evidence', label: spec[0] + '/' + variant, before: before, after: after, oldPack: p1, newPack: p1, registry: COMPILER_REGISTRY,
        change: {type: 'evidence', activity_id: before.activity.id, evidence_id: targetId, replacement: replacement}});
    });
  });
  return cases;
}
module.exports = {impactMatrix, semanticView, variantClaim, variants};
