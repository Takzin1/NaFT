#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node --check src/mrv-core.js
node --check src/mrv-ui.js
node --check tests/smoke.test.js
node tests/smoke.test.js
python3 tests/check-static.py
bash tests/security.sh
