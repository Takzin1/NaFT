#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
bash -n scripts/ci-browser-smoke.sh
node tests/japanflux-jp-hrt-thesis-lineage.test.mjs
node tests/japanflux-tellus-ec-reference.test.mjs
node tests/rice-standards-source-gate.test.mjs
node tests/research-readiness-report.test.mjs
node tests/research-readiness-ja.test.mjs
node tests/rice-methodology-router.test.mjs
node tests/ieee-gs-worksheet-replay.test.mjs
node tests/ieee-gs-selective-reverification.test.mjs
node tests/p1-gs-independent-replay.test.mjs
node tests/p1-method-family-comparison.test.mjs
node tests/p1-methods-ja.test.mjs
node tests/p2-audit-packet-preflight.test.mjs
node tests/p2-method-soc-gate.test.mjs
node tests/p3-method-document-intake.test.mjs
node tests/p4-method-source-impact.test.mjs
node tests/p5-clause-evidence-trace.test.mjs
node tests/p6-local-original-evidence.test.mjs
node tests/p7-offline-observation-qc.test.mjs
python3 tests/p8-gimje-native-dock.test.py
node tests/p9-prefecture-rice-source-guard.test.mjs
node tests/p10-gx-design-data.test.mjs
node tests/p11-real-chamber-source-audit.test.mjs
node tests/p11-rice-chromatography-guard.test.mjs
node tests/p12-estat-2025-original-source.test.mjs
node tests/p13-estat-2023-2024-original-source.test.mjs
node tests/p14-gimje-real-source-audit.test.mjs
python3 tests/p15-gimje-sampling-cadence.test.py
node tests/p15-gimje-sampling-cadence-ui.test.mjs
node tests/p16-japan-crop-history-original-source.test.mjs
node tests/p17-japan-crop-full-remaster.test.mjs
node tests/p18-ag005-source-intake.test.mjs
node tests/p19-rice-ch4-asia.test.mjs
python3 tests/p20-rice-ch4-original-replay.test.py
node tests/p21-jaxa-lulc-batch1.test.mjs
python3 tests/p21-jaxa-lulc-local-intake.test.py
node tests/p22-jaxa-lulc-batch02.test.mjs
python3 tests/p22-jaxa-lulc-batch02.test.py
node tests/p23-jaxa-lulc-batch03.test.mjs
python3 tests/p23-jaxa-lulc-batch03.test.py
node tests/dmrv-literature-register.test.mjs
node tests/climatechain-japanese.test.mjs
node tests/ieee-audit.test.mjs
node tests/ieee-triad-proof.test.mjs
node tests/ieee-source-snapshot.test.mjs
node tests/ieee-observation-receipt.test.mjs
node tests/ieee-observation-dual-replay.test.mjs
node tests/ieee-source-provenance-gateway.test.mjs
node tests/ieee-benchmark.test.mjs
node tests/carboncredit-source-audit.test.mjs
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
node tests/japanflux-jp-hrt-source-gate.test.mjs
python3 tests/japanflux-jp-hrt-badm.test.py
python3 tests/asia-ephemeral-provenance.test.py
python3 tests/check-static.py
bash tests/security.sh
