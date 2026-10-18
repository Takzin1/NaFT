#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
for script in src/*.js; do node --check "$script"; done
node --check src/mrv-ui.js
node --check tests/smoke.test.js
node --check tests/compiler.test.js
node --check tests/mitou-impact.test.js
node --check tests/impact-proof.test.js
node tests/smoke.test.js
node tests/compiler.test.js
node tests/mitou-impact.test.js
node tests/impact-proof.test.js
node tests/gikuten-ja.test.js
node tests/japan-calculation-reference.test.js
node tests/asia-mrv-compat.test.js
node tests/ipcc-stage-reference.test.mjs
python3 tests/asia-independent-oracle.test.py
node tests/gikuten-asia-addon.test.js
node tests/japan-field-study-replay.test.js
python3 tests/japan-field-independent-oracle.test.py
node tests/japan-raw-flux.test.mjs
python3 tests/japan-raw-flux-independent.test.py
node tests/japan-observation-adapters.test.mjs
node tests/japan-offline-import-cli.test.mjs
node tests/japan-aggregate-reconciliation.test.mjs
python3 tests/japan-aggregate-reconciliation-independent.test.py
python3 tests/japan-observation-adapters-independent.test.py
node tests/independent-observation-dual.test.mjs
node tests/japan-ieee-oracle-parity.test.mjs
node tests/asia-source-dock.test.mjs
python3 scripts/harvest-asia-source-index.py
python3 tests/asia-source-byte-shape.test.py
node tests/asia-native-field-header.test.mjs
node tests/china-rice-native-preflight.test.mjs
python3 tests/japanflux-jp-hrt-v200-source.test.py
python3 tests/asia-ephemeral-provenance.test.py
python3 tests/check-static.py
bash tests/security.sh
