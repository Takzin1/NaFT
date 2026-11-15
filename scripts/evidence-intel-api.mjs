#!/usr/bin/env node
/**
 * Loopback HTTP adapter and one-shot CLI for the Evidence Intelligence API.
 *
 *   node scripts/evidence-intel-api.mjs --port 8787        # serve on 127.0.0.1 only
 *   node scripts/evidence-intel-api.mjs --request '{"method":"GET","path":"/v1/meta"}'
 *   node scripts/evidence-intel-api.mjs --request-file request.json
 *
 * The server is stateless and read-only: it stores nothing, calls nothing and exposes no
 * session data. It binds to the loopback interface, rejects foreign Host headers and
 * sends no CORS headers. It is a local research tool, not a production service: there is
 * no authentication, rate limiting or TLS.
 */
import fs from 'node:fs';
import http from 'node:http';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

const require = createRequire(import.meta.url);
require('./lib/evidence-intel-load.cjs').loadEvidenceIntel();
const handle = globalThis.eiApiHandle;
const MAX_BODY_BYTES = 5 * 1024 * 1024;

function send(res, status, body) {
  const text = JSON.stringify(body);
  res.writeHead(status, {'content-type': 'application/json; charset=utf-8', 'content-length': Buffer.byteLength(text), 'cache-control': 'no-store', 'x-content-type-options': 'nosniff'});
  res.end(text);
}
function fail(res, status, code) { send(res, status, {api_version: 'v1', status: 'ERROR', error: {code}}); }

export function createEvidenceIntelServer() {
  return http.createServer((req, res) => {
    const port = req.socket.localPort, host = String(req.headers.host || '');
    if(![`127.0.0.1:${port}`, `localhost:${port}`, `[::1]:${port}`].includes(host)) return fail(res, 403, 'HOST_NOT_ALLOWED');
    if(req.method !== 'GET' && req.method !== 'POST') return fail(res, 405, 'METHOD_NOT_ALLOWED');
    if(req.method === 'GET') { const out = handle({method: 'GET', path: req.url}); return send(res, out.status, out.body); }
    if(!/^application\/json\b/i.test(String(req.headers['content-type'] || ''))) return fail(res, 415, 'JSON_CONTENT_TYPE_REQUIRED');
    let chunks = [], size = 0, tooLarge = false;
    req.on('data', chunk => {
      size += chunk.length;
      if(size > MAX_BODY_BYTES) { tooLarge = true; chunks = []; }       // stop buffering, keep draining so the 413 is delivered
      if(size > 8 * MAX_BODY_BYTES) { req.destroy(); return; }          // hard stop for a sender that never ends
      if(!tooLarge) chunks.push(chunk);
    });
    req.on('end', () => {
      if(tooLarge) return fail(res, 413, 'BODY_TOO_LARGE');
      let body;
      try { body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); } catch { return fail(res, 400, 'INVALID_JSON'); }
      const out = handle({method: 'POST', path: req.url, body});
      send(res, out.status, out.body);
    });
  });
}

if(process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), value = name => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
  const inline = value('--request'), file = value('--request-file');
  if(inline !== undefined || file !== undefined) {
    const out = handle(JSON.parse(inline !== undefined ? inline : fs.readFileSync(file, 'utf8')));
    process.stdout.write(JSON.stringify(out.body, null, 2) + '\n');
    process.exitCode = out.status === 200 ? 0 : 1;
  } else {
    const port = Number(value('--port') || 8787);
    if(!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('INVALID_PORT');
    const server = createEvidenceIntelServer();
    server.listen(port, '127.0.0.1', () => console.log(`NaFT Evidence Intelligence API (research, loopback only): http://127.0.0.1:${server.address().port}/v1/meta`));
  }
}
