#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
for script in src/*.js; do node --check "$script"; done
node --check src/mrv-ui.js
node --check tests/smoke.test.js
node tests/smoke.test.js
node tests/compiler.test.js
node tests/mitou-impact.test.js
python3 tests/check-static.py
bash tests/security.sh
