# NaFT Japan | Observation Adapters and QC Coverage v2 (2026-10-19)

**Research only.** This change introduces an offline input normalization layer, not a verified Japanese AG-005 calculation, real flux-data acquisition, or an authenticated field-measurement dataset.

## Motivation and compatibility

The previous strict \`scripts/lib/japan-raw-flux.mjs\` accepts complete, consecutive \`mg_CH4/m²/day\` **interval-mean rates** only. It remains unchanged and retains its strict gap rejection. The new \`scripts/lib/japan-observation-adapters.mjs\` accepts *explicit supported intervals* with transparent missing coverage; its full-period total is **null** whenever coverage is partial or absent. This is a versioned alternative, not a silently relaxed interpretation of v1.

The same normalized CSV shape applies across adapters:

\`\`\`csv
start_utc,end_utc,value,qc_status
2026-06-01T00:00:00Z,2026-06-02T00:00:00Z,0.001500,OBSERVED_GOOD
\`\`\`

This is a **normalized ingestion contract**. Raw JapanFlux, FLUXNET-CH₄, chamber concentrations and Korean data files may have different column names, quality flags, dates, timezone, variable definitions and temporal support. No real source file was downloaded, independently hashed, licensed for redistributing, or imported in this PR; such files require a *source-specific, reviewed adapter* before invoking this normalized layer. Do not mislabel a point-in-time chamber measurement as an interval mean.

## Three explicit adapters

| Adapter ID | Input unit and valid temporal support | Conversion to mg-CH₄/m² |
| --- | --- | --- |
| INTERVAL_MG_CH4_M2_DAY_V1 | mg_CH4/m²/day, declared interval <= 7 days | \`value × seconds/86400\` |
| DAILY_G_CH4_M2_DAY_V1 | g_CH4/m²/day, exactly 86400 seconds | \`value × 1000 × seconds/86400\` |
| EDDY_NMOL_CH4_M2_S_V1 | nmol_CH4/m²/s, interval <= 3600 seconds | \`value × seconds × 16.04 / 1e6\` |

The eddy CH₄ molar mass **16.04 g/mol** is a pinned research approximation, not a Japanese or foreign regulatory emission factor. The manifest must pin this value, gas and molecular mass basis. Temporal start/end must be explicit valid ISO UTC seconds. Local-day conversion, daylight-saving interpretation, standard conditions and instantaneous gas concentration/chamber regression are not guessed.

All calculations use JS BigInt rational sums for 6-decimal input rates with rounding **once at output** to 9 decimal places (half-away-from-zero). Independent Python tests use Decimal and datetime with a separate implementation. No CH₄-C conversion, N₂O or GWP is silently applied.

## Coverage model

QC \`OBSERVED_GOOD\` and \`OBSERVED_ACCEPTABLE\` count only the explicitly covered observed intervals. \`MISSING\` and \`IMPUTED_RESEARCH\` require a **blank rate**, are excluded from observed totals, and count toward \`excluded_qc_seconds\`. Gaps between successive rows and uncovered start/end count as \`unrepresented_gap_seconds\`. Segments must never overlap, duplicate, or extend beyond the declared observation window. The identity

\`observed_seconds + excluded_qc_seconds + unrepresented_gap_seconds = window_seconds\`

is mandatory; reported \`measured_coverage_percent = 100 × observed_seconds/window_seconds\`. A reported interval with bad QC is **not** a measurement even if its time boundaries are present.

| Coverage state | Observed-only integral | Full-period integral |
| --- | --- | --- |
| COMPLETE_OBSERVED | Computed | Computed, still scientifically unattested |
| PARTIAL_OBSERVED | Computed | **null** |
| NO_OBSERVATION | **null** | **null** |

**Never scale an incomplete observed integral to a full season or year by dividing by coverage.** Whether gaps can be filled requires a separate research protocol, recorded calibration, water regime and uncertainty model.

## Synthetic benchmark and independent results

- \`interval\`: 24h at 1.5, 12h at -0.5, 12h at 2.0 mg_CH4/m²/day → **2.25 mg_CH4/m²**, identical to previous v1 fixture.
- \`daily\`: first day +0.0015 g/m²/day, second day missing, third day -0.00025 g/m²/day → observed-only **1.25 mg_CH4/m²**, **66.666667%** measured coverage, **no full-window total**.
- \`eddy\`: first 30m +10, second 30m -5 nmol/m²/s → **0.14436 mg_CH4/m²**, full 60-minute coverage. Synthetic values; **not extracted from FLUXNET**.

\`\`\`sh
node scripts/replay-japan-observation-adapters.mjs interval
node scripts/replay-japan-observation-adapters.mjs daily
node scripts/replay-japan-observation-adapters.mjs eddy
node tests/japan-observation-adapters.test.mjs
python3 tests/japan-observation-adapters-independent.test.py
bash tests/run.sh
\`\`\`

## Provenance and regulatory gates

Every input is either \`SYNTHETIC\` or \`USER_SUPPLIED_UNVERIFIED\`. An input-provided \`original_publisher_bytes_verified:true\`, \`conditions_independently_matched:true\`, or \`official_eligibility_verified:true\` is rejected. SHA-256 equality with an input manifest establishes consistency between two supplied objects, **not publisher attestation**. Regardless of coverage, \`certified_tco2e:null\`, \`official_japan_factor_applicable:null\`, \`uncertainty_interval:null\`, and \`causal_attribution:null\`.

### Next research development / TODO

1. Retrieve **original real dataset bytes** with a repository and DOI, license and SHA-256 verified **independently**, not by user-assigned metadata. Confirm source variables, timezone, sensor QC meaning, chamber/eddy methodology and sampling support from accompanying documents.
2. Implement source-specific mapping for any supported data source after verified records are available. Field-replicated experiments and heat-/gas-flux time series should be treated separately; harmonization alone cannot prove climate comparability.
3. Develop source-reviewed missing-data methods as distinct outputs \`IMPUTED_RESEARCH\`, with documented uncertainty, and a distinct residual attribution interface. Preserve the observed-only result unchanged.
4. Apply Japanese J-Credit AG-005 current methodology, emission factors and applicability as a separate authoritative versioned Rule Pack only after primary text and factors are independently checked.

**References for potential future acquisition (not used as data):** [JapanFlux2024 JP-Hrt](https://ads.nipr.ac.jp/data/meta/A20241210-020), [Zenodo rice methane research](https://zenodo.org/records/17111992), [FLUXNET KR-CRK](https://fluxnet.org/sites/siteinfo/KR-CRK). No download or independent file license verification occurred as part of this PR.
