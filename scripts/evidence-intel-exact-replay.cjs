#!/usr/bin/env node
'use strict';
/**
 * Replays arithmetic through the JavaScript engine for an independent oracle.
 * stdin: {"expressions":[{expr,env}], "claims":[{id,area,days,variant}], "factor_registry":"default", "anchor_claims":[id]}
 * stdout: {"expressions":[...], "claims":[...], "aggregates":[...]}
 * Synthetic inputs only. Not a methodology and not a certified quantity.
 */
require('./lib/evidence-intel-load.cjs').loadEvidenceIntel();
const request = JSON.parse(require('node:fs').readFileSync(0, 'utf8'));
const out = {expressions: (request.expressions || []).map(c => {
  const r = eiEvaluateExpression(c.expr, c.env || {inputs: {}, params: {}});
  return r.status === 'OK' ? {status: 'OK', text: r.text, terminating: r.terminating} : {status: 'ERROR', error_code: r.error_code};
})};
if(request.claims) {
  const ctx = request.factor_registry === 'with-synthetic-correction' ? {packs: EI_PACK_REGISTRY, factors: EI_FACTOR_REGISTRY_NEXT} : eiDefaultContext();
  const claims = request.claims.map(row => {
    const input = syntheticClaim(row.id, row.variant);
    input.activity.methodology_id = 'NAFT-SYNTHETIC-EI';
    input.evidence.forEach(e => { e.methodology_id = 'NAFT-SYNTHETIC-EI'; });
    input.field.area_ha = row.area; input.activity.days = row.days;
    return input;
  });
  const state = eiBuild(claims, ctx);
  out.claims = request.claims.map(row => {
    const record = eiRecord(state, row.id).record;
    return {id: row.id, status: record.evaluation.status, exact: record.calculation.exact, result: record.calculation.result, factor: record.factors.map(f => f.factor_id + '@' + f.version + '=' + f.value)};
  });
  out.aggregates = eiAggregateView(state);
}
if(request.anchor_claims) {
  const state = eiBuild(request.anchor_claims.map(id => syntheticClaim(id)), eiDefaultContext()), ids = Object.keys(state.claims).sort();
  out.anchor = eiAnchorPayload(state);
  out.anchor_leaf_preimages = ids.map(id => eiAnchorClaimProof(state, id).leaf_preimage);
}
process.stdout.write(JSON.stringify(out));
