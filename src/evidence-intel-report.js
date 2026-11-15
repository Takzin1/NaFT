'use strict';
/**
 * NaFT Evidence Intelligence — grounded reports.
 *
 * Every statement carries the graph nodes (id + value hash) it was derived from. A report
 * can be re-verified against a state: a statement whose grounds are missing or whose hash
 * no longer matches makes the report STALE_OR_TAMPERED. Texts are deterministic templates.
 *
 * Requires the engine modules. Pure; no clock. No certification is asserted.
 */
var EI_REPORT_SCHEMA = 'naft-evidence-report-1';
var EI_REPORT_LOCALES = ['ja', 'en'];

var EI_REPORT_TEXT = {
  boundary: {ja: function() { return '研究用プロトタイプの出力です。正式な認証・登録・クレジット発行ではありません。認証済み算定結果は null です。'; },
    en: function() { return 'Research prototype output. Not a formal certification, registration or credit issuance. The certified result is null.'; }},
  context: {ja: function(v) { return '会計文脈は ' + v.accounting_context + ' です。本出力は企業GHGインベントリ算定でもカーボンクレジット認証でもありません。'; },
    en: function(v) { return 'Accounting context: ' + v.accounting_context + '. ' + v.statement; }},
  methodology: {ja: function(v) { return '方法論 ' + v.key + '（Rule Pack ' + v.rule_pack_version + '、状態 ' + v.status + '）で評価しました。'; },
    en: function(v) { return 'Evaluated with methodology ' + v.key + ' (rule pack ' + v.rule_pack_version + ', status ' + v.status + ').'; }},
  factor: {ja: function(v) { return 'パラメータ ' + v.parameter + ' は係数 ' + v.factor_id + '@' + v.version + '（値 ' + v.value + ' ' + v.unit_label + '、状態 ' + v.status + '）を使用しました。'; },
    en: function(v) { return 'Parameter ' + v.parameter + ' uses coefficient ' + v.factor_id + '@' + v.version + ' (value ' + v.value + ' ' + v.unit_label + ', status ' + v.status + ').'; }},
  evidence: {ja: function(v) { return '証憑 ' + v.id + '（区分 ' + v.category + '）: 内容ハッシュ照合 ' + (v.content_verified ? '一致' : '不一致') + '、対象との結び付き ' + (v.binding_valid ? '有効' : '無効') + '。'; },
    en: function(v) { return 'Evidence ' + v.id + ' (category ' + v.category + '): content hash ' + (v.content_verified ? 'matches' : 'does not match') + ', binding ' + (v.binding_valid ? 'valid' : 'invalid') + '.'; }},
  requirement: {ja: function(v) { return '証憑要件 ' + v.id + '（区分 ' + v.category + '）: ' + (v.missing ? '不足' : '充足') + (v.contradictory ? '、内容が矛盾する証憑あり' : '') + '。'; },
    en: function(v) { return 'Evidence requirement ' + v.id + ' (category ' + v.category + '): ' + (v.missing ? 'missing' : 'satisfied') + (v.contradictory ? ', contradictory evidence present' : '') + '.'; }},
  rule: {ja: function(v) { return 'ルール ' + v.id + ': 入力 ' + v.input + ' = ' + v.value + '、基準値 ' + v.threshold + '、判定 ' + (v.pass ? '適合' : '不適合') + '。'; },
    en: function(v) { return 'Rule ' + v.id + ': input ' + v.input + ' = ' + v.value + ', threshold ' + v.threshold + ', result ' + (v.pass ? 'pass' : 'fail') + '.'; }},
  issue: {ja: function(v) { return '検出事項 ' + v.code + '（' + v.status + '）。'; }, en: function(v) { return 'Issue ' + v.code + ' (' + v.status + ').'; }},
  calculation: {ja: function(v) { return v.ok ? '決定論的算定（' + v.operation + '）の算術プレビューは ' + v.exact + ' ' + v.unit + ' です。これは認証済み数量ではありません。' : '算定は実行できませんでした（CONFIG REQUIRED / UNSUPPORTED）。'; },
    en: function(v) { return v.ok ? 'Deterministic calculation (' + v.operation + ') arithmetic preview: ' + v.exact + ' ' + v.unit + '. This is not a certified quantity.' : 'The calculation could not be executed (CONFIG REQUIRED / UNSUPPORTED).'; }},
  status: {ja: function(v) { return '評価状態は ' + v.status + ' です。例外判断と最終確認は人間が行います。'; },
    en: function(v) { return 'Evaluation status: ' + v.status + '. Exception decisions and final attestation remain human.'; }}
};
function eiNumerals(values) {
  var out = [];
  (function walk(v) {
    if(typeof v === 'number' && Number.isFinite(v)) out.push(String(v));
    else if(typeof v === 'string' && eiIsDecimal(v)) out.push(v);
    else if(Array.isArray(v)) v.forEach(walk);
    else if(v && typeof v === 'object') Object.keys(v).sort().forEach(function(k) { walk(v[k]); });
  })(values);
  return Array.from(new Set(out)).sort();
}
function eiClaimReport(state, claimId, options) {
  options = Object.assign({intended_use: 'ENGINEERING_RESEARCH', locale: 'ja'}, options || {});
  if(EI_REPORT_LOCALES.indexOf(options.locale) < 0) eiFail('UNSUPPORTED_LOCALE');
  var c = state.claims[claimId];
  if(!c) eiFail('CLAIM_NOT_FOUND');
  var record = c.nodes[c.outputs.record].value, K = c.pack_key, context = record.methodology.accounting_context;
  eiAssertIntendedUse(context, options.intended_use);
  var statements = [];
  function ground(id) { var n = c.nodes[id] || state.shared[id]; if(!n) eiFail('GROUND_NODE_MISSING'); return {node: id, hash: n.vh}; }
  function say(section, kind, values, grounds, citable) {
    statements.push({id: 'S' + String(statements.length + 1).padStart(3, '0'), section: section, kind: kind, text: EI_REPORT_TEXT[kind][options.locale](values), values: values, numerals: eiNumerals(citable === undefined ? values : citable), grounds: grounds});
  }
  say('boundary', 'boundary', {formal_certification: false, certified_result: null}, [{node: 'const:DISCLAIMER', hash: hashObject(DISCLAIMER)}]);
  say('boundary', 'context', {accounting_context: context, statement: eiContextStatement(context), intended_use: options.intended_use}, [ground('source:' + K)]);
  say('methodology', 'methodology', {key: K, rule_pack_version: record.methodology.rule_pack_version, status: record.methodology.source.status, pack_hash: record.methodology.pack_hash, source_url: record.methodology.source.url, source_hash: record.methodology.source.hash, source_checked_at: record.methodology.source.checked_at},
    [ground('source:' + K), ground('pack:' + K)]);
  record.factors.forEach(function(f) { say('methodology', 'factor', f, [ground('factor:' + f.factor_id + '@' + f.version), ground('param:' + claimId + ':' + f.parameter)]); });
  c.order.filter(function(id) { return c.nodes[id].kind === 'manifest'; }).sort().forEach(function(id) {
    var m = c.nodes[id].value;
    say('evidence', 'evidence', {id: m.id, category: m.category, adapter: m.adapter, content_hash: m.content_hash, manifest_hash: m.manifest_hash, content_verified: m.content_verified, binding_valid: m.binding_valid, provenance: m.provenance, source: m.source}, [ground(id)]);
  });
  c.order.filter(function(id) { return c.nodes[id].kind === 'requirement_result' && c.nodes[id].value.applicable; }).sort().forEach(function(id) {
    var r = c.nodes[id].value;
    say('verification', 'requirement', {id: r.id, category: r.category, required: r.required, missing: r.missing, contradictory: r.contradictory, usable: r.usable}, [ground(id)].concat(c.nodes[id].deps.filter(function(d) { return d.role === 'evidence'; }).map(function(d) { return ground(d.id); })));
  });
  c.order.filter(function(id) { return c.nodes[id].kind === 'rule_result' && c.nodes[id].value.applicable; }).sort().forEach(function(id) {
    say('verification', 'rule', c.nodes[id].value.result, [ground(id)].concat(c.nodes[id].deps.map(function(d) { return ground(d.id); })));
  });
  c.order.filter(function(id) { var v = c.nodes[id].value; return id !== c.outputs.evaluation && v && Array.isArray(v.issues) && v.issues.length; }).sort().forEach(function(id) {
    c.nodes[id].value.issues.forEach(function(issue) { say('verification', 'issue', {code: issue.code, status: issue.status, detail: issue.detail}, [ground(id)]); });
  });
  var calc = c.nodes[c.outputs.calculation];
  say('calculation', 'calculation', {operation: calc.value.operation, ok: calc.value.ok, exact: calc.value.exact, arithmetic_preview: calc.value.arithmetic_preview, unit: calc.value.unit, unit_check: calc.value.unit_check, values: calc.value.values, input_paths: calc.value.input_paths, parameter_ids: calc.value.parameter_ids, trace: calc.value.trace, result: null},
    [ground(c.outputs.calculation)].concat(calc.deps.map(function(d) { return ground(d.id); })),
    // Citable numbers are values, not step indexes or operand positions of the trace.
    {exact: calc.value.exact, arithmetic_preview: calc.value.arithmetic_preview, values: calc.value.values, intermediate: calc.value.trace.map(function(t) { return t.value; })});
  say('verification', 'status', {status: record.evaluation.status, missing_evidence: record.evaluation.missing_evidence}, [ground(c.outputs.evaluation)]);
  var report = {schema: EI_REPORT_SCHEMA, report_kind: 'CLAIM_EVIDENCE_REPORT', options: {intended_use: options.intended_use, locale: options.locale}, claim_id: claimId,
    generated_from: {record_hash: c.record_hash, semantic_hash: c.semantic_hash, engine_version: EI_ENGINE_VERSION, calculation_engine: EI_CALC_VERSION, input_merkle: record.input_merkle, factor_registry_hash: state.factor_registry_hash},
    boundary: {disclaimer: DISCLAIMER, accounting_context: context, context_statement: eiContextStatement(context), is_ghg_inventory: false, is_credit_certification: false, formal_certification: false, certified_result: null,
      standards_scope: EI_STANDARDS_SCOPE.map(function(s) { return {id: s.id, version: s.version, accounting_context: s.accounting_context, naft_use: s.naft_use, primary_text_verified: s.primary_text_verified}; })},
    statements: statements,
    lineage: {superseded_records: c.history.map(function(h) { return {record_hash: h.record_hash, pack_key: h.pack_key, superseded_by_change: h.superseded_by_change}; }),
      evidence_revisions: Object.keys(c.evidence_lineage).sort().map(function(eid) { return {evidence_id: eid, revisions: c.evidence_lineage[eid].length, head: c.evidence_lineage[eid][c.evidence_lineage[eid].length - 1].revision_hash}; })},
    unresolved: record.evaluation.issues.map(function(i) { return {code: i.code, status: i.status}; }).concat([{code: 'formal_external_verification', status: 'NOT_PERFORMED'}])};
  report.report_hash = hashObject(report);
  return report;
}
/** Re-derive the report from the state and check every ground. */
function eiVerifyReport(state, report) {
  var failures = [];
  if(!report || report.schema !== EI_REPORT_SCHEMA || !Array.isArray(report.statements)) return {status: 'STALE_OR_TAMPERED', failures: ['INVALID_REPORT']};
  var body = Object.assign({}, report); delete body.report_hash;
  if(hashObject(body) !== report.report_hash) failures.push('REPORT_HASH_MISMATCH');
  var c = state.claims[report.claim_id];
  if(!c) return {status: 'STALE_OR_TAMPERED', failures: failures.concat(['CLAIM_NOT_FOUND'])};
  report.statements.forEach(function(s) {
    if(!Array.isArray(s.grounds) || !s.grounds.length) return failures.push('UNGROUNDED_STATEMENT:' + s.id);
    s.grounds.forEach(function(g) {
      var actual = g.node === 'const:DISCLAIMER' ? hashObject(DISCLAIMER) : (c.nodes[g.node] || state.shared[g.node] || {}).vh;
      if(actual !== g.hash) failures.push('GROUND_MISMATCH:' + s.id + ':' + g.node);
    });
  });
  if(!failures.length) {
    var fresh = eiClaimReport(state, report.claim_id, report.options);
    if(fresh.report_hash !== report.report_hash) failures.push('REPORT_NOT_REPRODUCIBLE_FROM_STATE');
  }
  return {status: failures.length ? 'STALE_OR_TAMPERED' : 'VERIFIED', failures: failures, statements: report.statements.length};
}
function eiRenderReport(report) {
  var titles = {boundary: '1. Boundary / 境界', methodology: '2. Methodology and coefficients / 方法論・係数', evidence: '3. Evidence / 証憑', verification: '4. Verification / 検証', calculation: '5. Calculation / 算定'};
  var lines = ['# Evidence report — ' + report.claim_id, '', 'record `' + report.generated_from.record_hash + '` · report `' + report.report_hash + '`', ''];
  Object.keys(titles).forEach(function(section) {
    var rows = report.statements.filter(function(s) { return s.section === section; });
    if(!rows.length) return;
    lines.push('## ' + titles[section], '');
    rows.forEach(function(s) { lines.push('- [' + s.id + '] ' + s.text + ' — grounds: ' + s.grounds.map(function(g) { return '`' + g.node + '@' + g.hash.slice(0, 12) + '`'; }).join(', ')); });
    lines.push('');
  });
  var calc = report.statements.filter(function(s) { return s.kind === 'calculation'; })[0];
  if(calc && calc.values.trace.length) {
    lines.push('### Calculation trace', '');
    calc.values.trace.forEach(function(t) { lines.push('- step ' + t.step + ': ' + (t.kind === 'op' ? t.op + '(' + t.operands.join(', ') + ')' : t.kind + ' ' + t.ref) + ' = ' + t.value); });
    lines.push('');
  }
  lines.push('## Unresolved', '');
  report.unresolved.forEach(function(u) { lines.push('- ' + u.code + ' (' + u.status + ')'); });
  lines.push('', '> ' + report.boundary.disclaimer, '> ' + report.boundary.context_statement, '');
  return lines.join('\n');
}
function eiImpactReport(delta) {
  var rows = delta.claims.filter(function(r) { return r.classification !== 'NO_OP'; }).map(function(r) {
    return {claim_id: r.claim_id, classification: r.classification, requires_reverification: r.requires_reverification, status_before: r.status_before, status_after: r.status_after,
      preview_before: r.preview_before, preview_after: r.preview_after, because: r.changed_leaves, recomputed: r.recomputed_nodes, stopped_at: r.cutoff_nodes,
      previous_record_hash: r.previous_record_hash, record_hash: r.record_hash, human_decisions_stale: true};
  });
  var report = {schema: 'naft-impact-report-1', change: delta.change, change_hash: delta.change_hash, counts: delta.counts, claims: rows,
    boundary: {disclaimer: DISCLAIMER, formal_certification: false, note: 'SEMANTIC_CHANGE requires re-verification. PROVENANCE_ONLY changes the record hash without changing verification semantics; earlier human decisions are stale in both cases.'}};
  report.report_hash = hashObject(report);
  return report;
}
function eiPortfolioReport(state) {
  var ids = Object.keys(state.claims).sort(), byStatus = {};
  ids.forEach(function(id) { var s = state.claims[id].status; byStatus[s] = (byStatus[s] || 0) + 1; });
  var report = {schema: 'naft-portfolio-report-1', claims: ids.length, by_status: byStatus, aggregates: eiAggregateView(state), state_digest: eiStateDigest(state),
    boundary: {disclaimer: DISCLAIMER, is_ghg_inventory: false, is_credit_certification: false, certified_total: null}};
  report.report_hash = hashObject(report);
  return report;
}
