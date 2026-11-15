// Real loopback HTTP round trips against the stateless Evidence Intelligence API adapter.
import assert from 'node:assert/strict';
import http from 'node:http';
import {spawnSync} from 'node:child_process';
import {createEvidenceIntelServer} from '../scripts/evidence-intel-api.mjs';

let passed = 0;
function ok(value, label) { assert.ok(value, label); passed++; }
function equal(a, b, label) { assert.deepEqual(a, b, label); passed++; }
function request(port, method, path, body, headers) {
  return new Promise((resolve, reject) => {
    const text = body === undefined ? null : typeof body === 'string' ? body : JSON.stringify(body);
    const req = http.request({host: '127.0.0.1', port, method, path, headers: Object.assign(text === null ? {} : {'content-type': 'application/json', 'content-length': Buffer.byteLength(text)}, headers || {})}, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => { const raw = Buffer.concat(chunks).toString('utf8'); let json = null; try { json = JSON.parse(raw); } catch { /* raw only */ } resolve({status: res.statusCode, headers: res.headers, json, raw}); });
    });
    req.on('error', reject);
    if(text !== null) req.write(text);
    req.end();
  });
}
const claim = id => globalThis.syntheticClaim(id);
const server = createEvidenceIntelServer();
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
try {
  equal(server.address().address, '127.0.0.1', 'server binds to the loopback interface only');
  const meta = await request(port, 'GET', '/v1/meta');
  equal([meta.status, meta.json.status, meta.json.boundary.formal_certification], [200, 'OK', false], 'GET /v1/meta over HTTP');
  ok(/^application\/json/.test(meta.headers['content-type']) && meta.headers['cache-control'] === 'no-store' && meta.headers['x-content-type-options'] === 'nosniff', 'JSON response with no-store and nosniff');
  ok(meta.headers['access-control-allow-origin'] === undefined, 'no CORS header is sent');
  const claims = [claim('HTTP-1'), claim('HTTP-2')];
  const compiled = await request(port, 'POST', '/v1/compile', {claims, legacy_parity: true});
  equal(compiled.json.data.claims.map(c => [c.claim_id, c.status, c.legacy_parity]), [['HTTP-1', 'AUTO_REEVALUATED', 'MATCH'], ['HTTP-2', 'AUTO_REEVALUATED', 'MATCH']], 'POST /v1/compile over HTTP');
  const inProcess = globalThis.eiApiHandle({method: 'POST', path: '/v1/compile', body: {claims, legacy_parity: true}});
  equal(compiled.json, JSON.parse(JSON.stringify(inProcess.body)), 'HTTP response equals the in-process API response');
  const again = await request(port, 'POST', '/v1/compile', {claims, legacy_parity: true});
  equal(again.raw, compiled.raw, 'repeated request returns byte-identical JSON');
  const impact = await request(port, 'POST', '/v1/impact', {claims, change: {type: 'activity', activity_id: 'HTTP-1', patch: {days: 5}}, verify: true});
  equal([impact.json.data.impact.claims[0].classification, impact.json.data.impact.claims[0].status_after, impact.json.data.full_rebuild_check.status], ['SEMANTIC_CHANGE', 'UNSUPPORTED', 'MATCH'], 'POST /v1/impact over HTTP');
  const report = await request(port, 'POST', '/v1/report', {claims, claim_id: 'HTTP-1', format: 'markdown'});
  ok(report.json.data.markdown.startsWith('# Evidence report — HTTP-1'), 'POST /v1/report markdown over HTTP');
  equal((await request(port, 'GET', '/v1/nope')).status, 404, 'unknown route is 404');
  equal((await request(port, 'PUT', '/v1/meta', {})).status, 405, 'PUT is refused');
  equal((await request(port, 'DELETE', '/v1/meta')).status, 405, 'DELETE is refused');
  equal((await request(port, 'POST', '/v1/compile', '{not json')).json.error.code, 'INVALID_JSON', 'invalid JSON is 400');
  equal((await request(port, 'POST', '/v1/compile', JSON.stringify({claims}), {'content-type': 'text/plain'})).status, 415, 'non-JSON content type refused');
  equal((await request(port, 'GET', '/v1/meta', undefined, {host: 'attacker.example'})).json.error.code, 'HOST_NOT_ALLOWED', 'foreign Host header refused');
  equal((await request(port, 'GET', '/v1/meta', undefined, {host: 'localhost:' + port})).status, 200, 'localhost Host accepted');
  equal((await request(port, 'POST', '/v1/report', {claims, claim_id: 'HTTP-1', intended_use: 'CORPORATE_INVENTORY'})).json.error.code, 'EI_INVENTORY_ACCOUNTING_NOT_IMPLEMENTED', 'inventory use refused over HTTP');
  const big = await request(port, 'POST', '/v1/compile', JSON.stringify({claims: [], pad: 'x'.repeat(5 * 1024 * 1024 + 10)}));
  equal([big.status, big.json.error.code], [413, 'BODY_TOO_LARGE'], 'oversized body refused with a delivered 413');
  const after = await request(port, 'GET', '/v1/meta');
  equal(after.raw, meta.raw, 'server holds no state between requests');
} finally {
  await new Promise(resolve => server.close(resolve));
}
// One-shot CLI
const cli = spawnSync(process.execPath, ['scripts/evidence-intel-api.mjs', '--request', JSON.stringify({method: 'GET', path: '/v1/standards'})], {encoding: 'utf8'});
equal(cli.status, 0, 'CLI exits 0 on success');
equal(JSON.parse(cli.stdout).data.standards.find(s => s.id === 'GHGP-LSRS').naft_use, 'SCOPE_REFERENCE_ONLY', 'CLI prints the API response');
const cliError = spawnSync(process.execPath, ['scripts/evidence-intel-api.mjs', '--request', JSON.stringify({method: 'GET', path: '/v1/nope'})], {encoding: 'utf8'});
equal([cliError.status, JSON.parse(cliError.stdout).error.code], [1, 'ROUTE_NOT_FOUND'], 'CLI exits non-zero on an API error');
console.log('EVIDENCE INTEL API HTTP RESULT: ' + passed + ' passed, 0 failed');
