# NaFT Japan: segment-flux ingest, independent replay, and provenance gate (2026-10-19)

**Scope:** This is an OFFLINE **research-only** ingestion protocol, not measured original Yagi (1996) / Nishimura (2004) data. It does not implement AG-005's current approved rule pack, a registered project, a validated sensor, or climate-effect attribution.

## State before this PR

The existing [published observation baseline](../data/japan-original-field-observation-aggregates.json) preserves Yagi (1996) within-year treatment aggregates and Nishimura (2004) annual CH₄/N₂O-N cumulative figures. Independent BigInt vs Python Decimal checks replay the paper's printed aggregates; the full daily/2-hour flux data, weather, soil redox, water depth, instrument calibration and original scanned tables are **not available** in the repository. No model-vs-observation physical replication exists yet.

## New ingestion contract

\`scripts/lib/japan-raw-flux.mjs\` + \`scripts/replay-japan-raw-flux.mjs\` accept a local CSV with the exact header \`start_utc,end_utc,flux_mg_m2_day,qc_status\`. Each row expresses **the interval-mean CH₄ flux rate** in \`mg_CH4/m²/day\`, not a single timestamp instantaneous chamber reading. The algorithm integrates each valid interval as:

\[
M_{\mathrm{mg}/m^2}=\sum_{i} f_i [\mathrm{mg}/m^2/\mathrm{day}]\ \Delta t_i[\mathrm{s}]/86400;
\qquad M_{\mathrm{kg}/ha}=0.01 M_{\mathrm{mg}/m^2}.
\]

Here the full-precision original decimal and integer seconds are accumulated using JS BigInt rational arithmetic, and only the output is half-away-from-zero rounded to 9 decimal places. The independent implementation uses Python \`Decimal\` and \`datetime\`, not the JS integration function.

### Strict fail-closed conditions

- SHA-256 of the original CSV **bytes** must equal the manifest's declared checksum; hash equality proves a consistency check only, **not authenticity of publisher data**.
- Exact UTC timestamps and explicit interval starts/ends are required, with every row adjoining the next and the manifest's declared outer interval. Duplicate, overlapping, out-of-order, gapped, oversized, malformed or imputed rows are rejected; no interpolation is done automatically.
- Require country \`JP\`, gas \`CH4\`, molecular (not carbon mass) flux basis, unit \`mg_CH4_m2_day\`, and sampling semantics \`INTERVAL_MEAN_FLUX_RATE\`. N₂O-N, hourly instantaneous readings, chamber raw concentrations, CH₄-C and season totals **cannot** be silently treated as rates.
- \`SYNTHETIC\` or \`USER_SUPPLIED_UNVERIFIED\` are the only data classes. A caller cannot set \`original_publisher_bytes_verified=true\` to bypass attestation.
- Unknown calibration, rainfall, temperature, fertilizer, soil/water match or instrument protocol remain \`UNKNOWN\` in metadata rather than being synthesized.
- The output always sets \`original_publisher_attested=false\`, \`conditions_independently_matched=false\`, scientific uncertainty \`null\`, causal residual allocation \`null\`, and formally approved tCO₂e \`null\`. Even when hash and coverage checks pass, the status remains \`SOURCE_UNATTESTED_ENVIRONMENT_UNMATCHED\`.

### Fixture and reproducibility

\`research/japan-field-raw-flux-2026-10-19/synthetic-flux.csv\` is a **fabricated 48-hour** 3-segment trace:
- 24 hours at +1.5 mg/m²/day
- 12 hours at −0.5 mg/m²/day
- 12 hours at +2.0 mg/m²/day

Independent computed amount = \`1.5 × 1 − 0.5 × 0.5 + 2 × 0.5 = 2.25 mg-CH4/m² = 0.0225 kg-CH4/ha\`. It is **not** data from either published Japanese study.

\`\`\`sh
node scripts/replay-japan-raw-flux.mjs --manifest research/japan-field-raw-flux-2026-10-19/synthetic-manifest.json --csv research/japan-field-raw-flux-2026-10-19/synthetic-flux.csv
node tests/japan-raw-flux.test.mjs
python3 tests/japan-raw-flux-independent.test.py
bash tests/run.sh
\`\`\`

### Reproducing paper results responsibly (not yet done)

For Yagi/Nishimura: obtain the publisher's original full paper, any supplementary tables and raw flux data, check licensing and verbatim citation with original file byte checksums. Determine whether observations report instantaneous chamber concentrations, irregular flux samples or already gap-filled daily/interval-mean rates; **do not import measurements of a different type**. Record soil, chamber design, plot/treatment, water depth, weather, missing-data policy and temporal coverage. Derive daily flux with a separately validated *measurement-protocol-specific* estimator before invoking the segment integrator; compare the integrated totals to the paper's reported aggregates and leave any unexplained residual unallocated. Independent publication/source review must gate any use beyond exploratory replay.

**Blocked stages:** source-byte authenticity, observation protocol reconstruction, raw calibration, geographic/season comparability, statistical/measurement uncertainty and Japanese certification. The repo contains only a synthetic CSV example and paper-reported aggregates. GitHub CI confirms reproducible arithmetic, not physical fidelity.
