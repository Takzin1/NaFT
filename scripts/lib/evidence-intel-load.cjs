'use strict';
// Loads the build-free browser scripts into this V8 context, in dependency order.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const EVIDENCE_INTEL_SOURCES = ['mrv-core', 'methodology-packs', 'mrv-compiler', 'compiler-demo',
  'evidence-intel-calc', 'evidence-intel-versions', 'evidence-intel-engine', 'evidence-intel-report',
  'evidence-intel-explain', 'evidence-intel-audit', 'evidence-intel-api'];
let loaded = false;
function loadEvidenceIntel() {
  if(loaded) return;
  const root = path.resolve(__dirname, '..', '..', 'src');
  for(const name of EVIDENCE_INTEL_SOURCES) vm.runInThisContext(fs.readFileSync(path.join(root, name + '.js'), 'utf8'), {filename: name + '.js'});
  loaded = true;
}
module.exports = {loadEvidenceIntel, EVIDENCE_INTEL_SOURCES};
