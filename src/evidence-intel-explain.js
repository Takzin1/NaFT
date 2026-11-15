'use strict';
/**
 * NaFT Evidence Intelligence — explanation boundary.
 *
 * The deterministic engine decides; an explanation only describes. This module is the
 * single place where narrative text meets engine facts, and it is one-directional:
 *
 *   state -> grounded report -> explanation context (facts) -> explanation sidecar
 *
 * Nothing here is imported by the engine, the calculation interpreter or the reports.
 * A sidecar is never part of a record, package or report hash and cannot be submitted as
 * a change. Text from a generative model is untrusted input: it is accepted only as a
 * NON-AUTHORITATIVE sidecar after every sentence cites existing facts and every number in
 * it appears in a cited fact. No model is called from this repository.
 *
 * The checks are lexical. They do not prove that a sentence is true, only that it is
 * anchored to facts and introduces no number or certification wording of its own.
 */
var EI_EXPLANATION_SCHEMA = 'naft-explanation-sidecar-1';
var EI_EXPLANATION_LIMITS = Object.freeze({max_statements: 60, max_text: 600});
var EI_EXPLANATION_FORBIDDEN = /certif|verified\b|eligib|guarantee|issued\b|approved\b|認証|検証済|適格|保証|承認済|発行済/i;

function eiExplanationContext(report) {
  if(!report || report.schema !== EI_REPORT_SCHEMA) eiFail('INVALID_REPORT');
  var body = Object.assign({}, report); delete body.report_hash;
  if(hashObject(body) !== report.report_hash) eiFail('REPORT_HASH_MISMATCH');
  var context = {schema: 'naft-explanation-context-1', claim_id: report.claim_id, report_hash: report.report_hash, record_hash: report.generated_from.record_hash,
    facts: report.statements.map(function(s) { return {fact_id: s.id, kind: s.kind, text: s.text, numerals: s.numerals, grounds: s.grounds}; }),
    boundary: [report.boundary.disclaimer, report.boundary.context_statement],
    instructions: 'Describe only these facts. Cite fact_id for every sentence. Do not add numbers, judgements of eligibility or certification wording.'};
  context.context_hash = hashObject(context);
  return deepFreeze(context);
}
function eiNumberTokens(text) {
  var normalized = String(text).normalize('NFKC'), out = [], pattern = /\d[\d,]*(?:\.\d+)?(?:[eE][+-]?\d+)?/g, m;
  while((m = pattern.exec(normalized)) !== null) out.push(m[0].replace(/,/g, ''));
  return out;
}
function eiSameNumber(a, b) { return eiIsDecimal(a) && eiIsDecimal(b) && eiCompareDecimal(a, b) === 0; }
function eiSealSidecar(context, generator, statements, validation) {
  var sidecar = {schema: EI_EXPLANATION_SCHEMA, authoritative: false, affects_calculation: false, claim_id: context.claim_id, context_hash: context.context_hash,
    report_hash: context.report_hash, record_hash: context.record_hash, generator: generator, statements: statements, validation: validation, boundary: context.boundary};
  sidecar.sidecar_hash = hashObject(sidecar);
  return sidecar;
}
/** Built-in explainer: fixed templates over the facts, one cited fact per sentence. */
function eiTemplateExplanation(context) {
  var statements = context.facts.map(function(f) { return {text: f.text, cites: [f.fact_id]}; });
  return eiSealSidecar(context, {kind: 'deterministic-template', name: 'naft-template-explainer', version: '1'}, statements, {status: 'DETERMINISTIC_TEMPLATE', violations: []});
}
/**
 * Validate a draft produced outside the deterministic boundary (for example by a language
 * model operated by the caller). Returns a sealed sidecar; REJECTED drafts keep no text.
 */
function eiValidateExternalExplanation(context, draft) {
  var violations = [];
  function violation(code, index) { violations.push({code: code, statement: index === undefined ? null : index}); }
  if(!context || context.schema !== 'naft-explanation-context-1') eiFail('INVALID_EXPLANATION_CONTEXT');
  var contextBody = Object.assign({}, context); delete contextBody.context_hash;
  if(hashObject(contextBody) !== context.context_hash) eiFail('INVALID_EXPLANATION_CONTEXT');
  var generator = {kind: 'external-model', name: 'UNKNOWN', version: 'UNKNOWN'};
  if(!draft || typeof draft !== 'object' || Array.isArray(draft)) violation('INVALID_DRAFT');
  else {
    if(draft.generator && typeof draft.generator === 'object') {
      generator.name = String(draft.generator.name || 'UNKNOWN').slice(0, 80);
      generator.version = String(draft.generator.version || 'UNKNOWN').slice(0, 80);
    }
    if(draft.context_hash !== context.context_hash) violation('CONTEXT_HASH_MISMATCH');
    if(!Array.isArray(draft.statements) || !draft.statements.length || draft.statements.length > EI_EXPLANATION_LIMITS.max_statements) violation('INVALID_STATEMENT_COUNT');
  }
  var facts = new Map(context.facts.map(function(f) { return [f.fact_id, f]; })), accepted = [];
  if(!violations.length) draft.statements.forEach(function(s, index) {
    if(!s || typeof s.text !== 'string' || !s.text.trim() || s.text.length > EI_EXPLANATION_LIMITS.max_text) return violation('INVALID_TEXT', index);
    if(!Array.isArray(s.cites) || !s.cites.length || s.cites.some(function(id) { return !facts.has(id); })) return violation('MISSING_OR_UNKNOWN_CITATION', index);
    if(/[<>]/.test(s.text) || /https?:/i.test(s.text)) violation('MARKUP_OR_LINK_NOT_ALLOWED', index);
    if(EI_EXPLANATION_FORBIDDEN.test(s.text.normalize('NFKC'))) violation('CERTIFICATION_WORDING_NOT_ALLOWED', index);
    var allowed = [];
    s.cites.forEach(function(id) { var f = facts.get(id); allowed = allowed.concat(f.numerals, eiNumberTokens(f.text)); });
    eiNumberTokens(s.text).forEach(function(token) {
      if(!allowed.some(function(n) { return eiSameNumber(token, n); })) violation('UNGROUNDED_NUMBER', index);
    });
    accepted.push({text: s.text, cites: s.cites.slice().sort()});
  });
  var ok = !violations.length;
  return eiSealSidecar(context, generator, ok ? accepted : [], {status: ok ? 'ACCEPTED_AS_NON_AUTHORITATIVE' : 'REJECTED', violations: violations,
    checks: 'LEXICAL_GROUNDING_ONLY: citations exist, numbers appear in cited facts, no certification wording, markup or links'});
}
function eiVerifySidecar(context, sidecar) {
  if(!sidecar || sidecar.schema !== EI_EXPLANATION_SCHEMA) return false;
  var body = Object.assign({}, sidecar); delete body.sidecar_hash;
  return sidecar.authoritative === false && sidecar.affects_calculation === false && hashObject(body) === sidecar.sidecar_hash &&
    sidecar.context_hash === context.context_hash && sidecar.report_hash === context.report_hash;
}
