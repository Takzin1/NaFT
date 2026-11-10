#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
bash -n scripts/ci-browser-smoke.sh
node tests/readme-docs-contract.test.mjs
node --test tests/edition-bridge.test.mjs
node tests/provenance-why-where.test.js
node tests/opm-fair-interop.test.js
node tests/incremental-compiler-research.test.js
node scripts/benchmark-incremental-research.js
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
node tests/p28-prefecture-intake.test.mjs
python3 scripts/p29-hokkaido-soil-audit.py audit
node tests/p29-hokkaido-soil-source.test.mjs
python3 scripts/p30-aomori-soil-audit.py audit
node tests/p30-aomori-soil-gis.test.mjs
python3 scripts/p31-iwate-soil-audit.py audit
node tests/p31-iwate-soil-gis.test.mjs
python3 scripts/p32-miyagi-soil-audit.py audit
node tests/p32-miyagi-soil-gis.test.mjs
python3 scripts/p33-yamagata-soil-audit.py audit
node tests/p33-yamagata-soil-gis.test.mjs
python3 scripts/p34-akita-soil-audit.py audit
node tests/p34-akita-soil-gis.test.mjs
python3 scripts/p35-fukushima-soil-audit.py audit
node tests/p35-fukushima-soil-gis.test.mjs
python3 scripts/p36-ibaraki-soil-audit.py audit
node tests/p36-ibaraki-soil-gis.test.mjs
python3 scripts/p37-tochigi-soil-audit.py audit
node tests/p37-tochigi-soil-gis.test.mjs
python3 scripts/p38-saitama-soil-audit.py audit
node tests/p38-saitama-soil-gis.test.mjs
python3 scripts/p39-gunma-soil-audit.py audit
node tests/p39-gunma-soil-gis.test.mjs
python3 scripts/p40-tokyo-soil-audit.py audit
node tests/p40-tokyo-soil-gis.test.mjs
python3 scripts/p41-chiba-soil-audit.py audit
node tests/p41-chiba-soil-gis.test.mjs
python3 scripts/p42-kanagawa-soil-audit.py audit
node tests/p42-kanagawa-soil-gis.test.mjs
python3 scripts/p43-niigata-soil-audit.py audit
node tests/p43-niigata-soil-gis.test.mjs
python3 scripts/p44-ishikawa-soil-audit.py audit
node tests/p44-ishikawa-soil-gis.test.mjs
python3 scripts/p45-toyama-soil-audit.py audit
node tests/p45-toyama-soil-gis.test.mjs
python3 scripts/p46-fukui-soil-audit.py audit
node tests/p46-fukui-soil-gis.test.mjs
python3 scripts/p47-yamanashi-soil-audit.py audit
node tests/p47-yamanashi-soil-gis.test.mjs
python3 scripts/p48-nagano-soil-audit.py audit
node tests/p48-nagano-soil-gis.test.mjs
python3 scripts/p49-gifu-soil-audit.py audit
node tests/p49-gifu-soil-gis.test.mjs
python3 scripts/p50-shizuoka-soil-audit.py audit
node tests/p50-shizuoka-soil-gis.test.mjs
python3 scripts/p51-aichi-soil-audit.py audit
node tests/p51-aichi-soil-gis.test.mjs
python3 scripts/p52-mie-soil-audit.py audit
node tests/p52-mie-soil-gis.test.mjs
python3 scripts/p53-shiga-soil-audit.py audit
node tests/p53-shiga-soil-gis.test.mjs
python3 scripts/p54-kyoto-soil-audit.py audit
node tests/p54-kyoto-soil-gis.test.mjs
python3 scripts/p55-osaka-soil-audit.py audit
node tests/p55-osaka-soil-gis.test.mjs
python3 scripts/p56-hyogo-soil-audit.py audit
node tests/p56-hyogo-soil-gis.test.mjs
python3 scripts/p57-nara-soil-audit.py audit
node tests/p57-nara-soil-gis.test.mjs
python3 scripts/p58-wakayama-soil-audit.py audit
node tests/p58-wakayama-soil-gis.test.mjs
python3 scripts/p59-tottori-soil-audit.py audit
node tests/p59-tottori-soil-gis.test.mjs
python3 scripts/p60-shimane-soil-audit.py audit
node tests/p60-shimane-soil-gis.test.mjs
python3 scripts/p61-okayama-soil-audit.py audit
node tests/p61-okayama-soil-gis.test.mjs
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
node tests/p24-jaxa-lulc-batch04.test.mjs
python3 tests/p24-jaxa-lulc-batch04.test.py
node tests/p25-jaxa-lulc-batch05.test.mjs
python3 tests/p25-jaxa-lulc-batch05.test.py
python3 tests/p26-global-registry-intake.test.py
python3 tests/p26-jcredit-registration-intake.test.py
python3 tests/p26-maff-r7-adaptation-intake.test.py
python3 scripts/p26-maff-r7-adaptation-intake.py > /tmp/naft-p26-maff-r7-adaptation.json
node --test tests/p26-ag005-fude-polygon-reference.test.mjs
node scripts/p26-ag005-fude-polygon-reference.mjs fixtures/p26-ag005-fude-reference-synthetic.json > /tmp/naft-p26-fude-receipt.json
node --test tests/p26-official-mrv-prescreen.test.mjs
node scripts/p26-official-mrv-prescreen.mjs bdas fixtures/p26-bdas-green-laser-synthetic.json > /tmp/naft-p26-bdas-prescreen.json
node scripts/p26-official-mrv-prescreen.mjs midseason fixtures/p26-maff-midseason-synthetic.json > /tmp/naft-p26-maff-midseason-prescreen.json
node --test tests/p26-jblue-guidance-market.test.mjs
node scripts/p26-jblue-method1-research.mjs fixtures/p26-jblue-method1-synthetic.json > /tmp/naft-p26-jblue-method1.json
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
python3 tests/p27-sea9-archive-intake.test.py
python3 tests/p27-gmw-isotope-intake.test.py
node tests/asia-native-field-header.test.mjs
node tests/china-rice-native-preflight.test.mjs
python3 tests/japanflux-jp-hrt-v200-source.test.py
node tests/japanflux-jp-hrt-source-gate.test.mjs
python3 tests/japanflux-jp-hrt-badm.test.py
python3 tests/asia-ephemeral-provenance.test.py
python3 tests/check-static.py
bash tests/security.sh
