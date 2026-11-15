'use strict';
/**
 * NaFT Evidence Intelligence — transport-independent API.
 *
 * eiApiHandle({method, path, body}) -> {status, body}. Stateless and pure: every request
 * carries its own Claims, nothing is stored, nothing is fetched and no clock is read, so
 * the same request always returns the same response. It is a computation interface, not
 * an authorization endpoint: session mutations, human decisions and attestation stay in
 * compiler-session.js behind the role and audit guards.
 */
var EI_API_VERSION = 'v1';
var EI_API_LIMITS = Object.freeze({max_claims: 500, max_trace_seeds: 50});
var EI_API_ROUTES = Object.freeze([
  ['GET', '/v1/meta', 'Engine versions, limits, boundary statement and route list'],
  ['GET', '/v1/standards', 'Standards scope register and accounting contexts'],
  ['GET', '/v1/methodologies', 'Version catalog of methodology Packs and coefficients'],
  ['GET', '/v1/methodologies/{key}', 'One immutable Pack by exact methodology_id@version'],
  ['POST', '/v1/methodologies/diff', 'Structured diff of two versions of one methodology'],
  ['POST', '/v1/methodologies/candidates', 'Advisory list of versions effective for a period'],
  ['POST', '/v1/compile', 'Evaluate Claims: records, statuses, aggregates, optional legacy parity'],
  ['POST', '/v1/impact', 'Apply one change differentially and report affected Claims'],
  ['POST', '/v1/report', 'Grounded evidence report for one Claim (json or markdown)'],
  ['POST', '/v1/graph', 'Dependency graph, optional upstream/downstream trace'],
  ['POST', '/v1/explanations/template', 'Deterministic template explanation sidecar'],
  ['POST', '/v1/explanations/validate', 'Validate an externally written explanation draft'],
  ['POST', '/v1/audit/verify', 'Verify an audit log hash chain']
]);
var EI_API_NOT_FOUND = ['EI_CLAIM_NOT_FOUND', 'EI_PACK_NOT_FOUND', 'UNKNOWN_GRAPH_NODE', 'EVIDENCE_NOT_FOUND'];

function eiApiContext(body) {
  var name = body && body.factor_registry !== undefined ? body.factor_registry : 'default';
  if(name === 'default') return eiDefaultContext();
  if(name === 'with-synthetic-correction') return {packs: EI_PACK_REGISTRY, factors: EI_FACTOR_REGISTRY_NEXT};
  eiFail('UNKNOWN_FACTOR_REGISTRY');
}
function eiApiClaims(body) {
  if(!body || !Array.isArray(body.claims) || !body.claims.length || body.claims.length > EI_API_LIMITS.max_claims) eiFail('API_CLAIMS_REQUIRED_OR_LIMIT');
  return body.claims;
}
function eiApiClaimSummary(state, id) {
  var c = state.claims[id];
  return {claim_id: id, pack_key: c.pack_key, status: c.status, record_hash: c.record_hash, semantic_hash: c.semantic_hash, nodes: c.order.length};
}
var EI_API_HANDLERS = {
  'GET /v1/meta': function() {
    return {name: 'NaFT Evidence Intelligence API', api_version: EI_API_VERSION, engine_version: EI_ENGINE_VERSION, calculation_engine: EI_CALC_VERSION, limits: EI_API_LIMITS,
      properties: ['stateless', 'deterministic', 'read-only', 'no-external-calls'], routes: EI_API_ROUTES.map(function(r) { return {method: r[0], path: r[1], summary: r[2]}; })};
  },
  'GET /v1/standards': function() { return {accounting_contexts: EI_ACCOUNTING_CONTEXTS, intended_uses: EI_INTENDED_USES, standards: EI_STANDARDS_SCOPE}; },
  'GET /v1/methodologies': function() { var ctx = eiDefaultContext(); return eiVersionCatalog(ctx.packs, ctx.factors); },
  'GET /v1/methodologies/{key}': function(body, key) {
    var pack = EI_PACK_REGISTRY[key];
    if(!pack) eiFail('PACK_NOT_FOUND');
    return {key: key, pack_hash: hashObject(pack), accounting_context: eiPackAccountingContext(pack), features: eiPackFeatures(pack), pack: pack};
  },
  'POST /v1/methodologies/diff': function(body) {
    var a = EI_PACK_REGISTRY[body.old_key], b = EI_PACK_REGISTRY[body.new_key];
    if(!a || !b) eiFail('PACK_NOT_FOUND');
    return compareMethodologyVersions(a, b);
  },
  'POST /v1/methodologies/candidates': function(body) { return eiPackCandidates(EI_PACK_REGISTRY, body.methodology_id, body.start, body.end); },
  'POST /v1/compile': function(body) {
    var ctx = eiApiContext(body), state = eiBuild(eiApiClaims(body), ctx), ids = Object.keys(state.claims).sort();
    return {state_digest: eiStateDigest(state), counters: state.build_counters,
      claims: ids.map(function(id) {
        var row = eiApiClaimSummary(state, id);
        if(body.include_records === true) row.record = eiRecord(state, id).record;
        if(body.legacy_parity === true) row.legacy_parity = eiLegacyParity(state, id, ctx).status;
        return row;
      }), aggregates: eiAggregateView(state)};
  },
  'POST /v1/impact': function(body) {
    var before = eiApiContext(body), state = eiBuild(eiApiClaims(body), before), change = body.change, after = before;
    if(change && change.type === 'factor_registry') after = eiApiContext({factor_registry: change.factor_registry});
    var applied = eiApplyChange(state, change && change.type === 'factor_registry' ? {type: 'factor_registry'} : change, after);
    var out = {impact: eiImpactReport(applied.delta), state_digest_before: eiStateDigest(state), state_digest_after: eiStateDigest(applied.state), aggregates_after: eiAggregateView(applied.state)};
    if(body.verify === true) out.full_rebuild_check = eiVerifyState(applied.state, after);
    return out;
  },
  'POST /v1/report': function(body) {
    var state = eiBuild(eiApiClaims(body), eiApiContext(body));
    var report = eiClaimReport(state, body.claim_id, {locale: body.locale || 'ja', intended_use: body.intended_use || 'ENGINEERING_RESEARCH'});
    return body.format === 'markdown' ? {report_hash: report.report_hash, markdown: eiRenderReport(report)} : {report: report, verification: eiVerifyReport(state, report)};
  },
  'POST /v1/graph': function(body) {
    var state = eiBuild(eiApiClaims(body), eiApiContext(body)), graph = eiGraph(state, body.claim_ids), out = {graph: graph, validation: eiValidateGraph(graph)};
    if(body.trace) {
      if(!Array.isArray(body.trace.seeds) || !body.trace.seeds.length || body.trace.seeds.length > EI_API_LIMITS.max_trace_seeds) eiFail('API_TRACE_SEEDS_REQUIRED_OR_LIMIT');
      out.trace = {seeds: body.trace.seeds, direction: body.trace.direction, nodes: eiTrace(eiGraphIndex(graph), body.trace.seeds, body.trace.direction)};
    }
    return out;
  },
  'POST /v1/explanations/template': function(body) {
    var state = eiBuild(eiApiClaims(body), eiApiContext(body)), report = eiClaimReport(state, body.claim_id, {locale: body.locale || 'ja'}), context = eiExplanationContext(report);
    return {context: context, sidecar: eiTemplateExplanation(context)};
  },
  'POST /v1/explanations/validate': function(body) {
    var state = eiBuild(eiApiClaims(body), eiApiContext(body)), report = eiClaimReport(state, body.claim_id, {locale: body.locale || 'ja'}), context = eiExplanationContext(report);
    return {context_hash: context.context_hash, record_hash: report.generated_from.record_hash, sidecar: eiValidateExternalExplanation(context, body.draft)};
  },
  'POST /v1/audit/verify': function(body) { return eiAuditVerify(body.log, body.checkpoint); }
};
function eiApiRespond(status, payload) {
  return {status: status, body: Object.assign({api_version: EI_API_VERSION}, payload, {boundary: {disclaimer: DISCLAIMER, formal_certification: false, certified_result: null}})};
}
function eiApiHandle(request) {
  try {
    if(!request || typeof request.method !== 'string' || typeof request.path !== 'string') return eiApiRespond(400, {status: 'ERROR', error: {code: 'INVALID_REQUEST'}});
    var method = request.method.toUpperCase(), path = request.path.split('?')[0].replace(/\/+$/, '') || '/', arg, route = method + ' ' + path;
    var prefix = '/v1/methodologies/';
    if(method === 'GET' && path.indexOf(prefix) === 0 && path.length > prefix.length) {
      try { arg = decodeURIComponent(path.slice(prefix.length)); } catch(error) { return eiApiRespond(400, {status: 'ERROR', error: {code: 'INVALID_PATH_ENCODING'}}); }
      route = 'GET /v1/methodologies/{key}';
    }
    if(!Object.prototype.hasOwnProperty.call(EI_API_HANDLERS, route)) {
      var known = EI_API_ROUTES.some(function(r) { return r[1] === path; });
      return eiApiRespond(known ? 405 : 404, {status: 'ERROR', error: {code: known ? 'METHOD_NOT_ALLOWED' : 'ROUTE_NOT_FOUND'}});
    }
    var body = request.body === undefined || request.body === null ? {} : request.body;
    if(method === 'POST' && (typeof body !== 'object' || Array.isArray(body))) return eiApiRespond(400, {status: 'ERROR', error: {code: 'JSON_OBJECT_BODY_REQUIRED'}});
    var data = EI_API_HANDLERS[route](body, arg);
    return eiApiRespond(200, {status: 'OK', data: data, data_hash: hashObject(data)});
  } catch(error) {
    var code = error && typeof error.message === 'string' && /^[A-Z][A-Z0-9_:.@-]{2,120}$/.test(error.message) ? error.message : 'INTERNAL_ERROR';
    var status = code === 'INTERNAL_ERROR' ? 500 : EI_API_NOT_FOUND.indexOf(code) >= 0 ? 404 : 422;
    return eiApiRespond(status, {status: 'ERROR', error: {code: code}});
  }
}
