# NaFT Japan independent CH4 arithmetic and cross-IEEE parity
Created 2026-10-19. **Independent numerical replay of synthetic cases, not reconstruction of original field observations.**

## Architecture
Japan already contains a research-only five-adapter flux integrator and a Python Decimal test. This addition introduces a separate, portable IEEE-ClimateChain-aligned BigInt/Decimal two-engine test protocol and a cross-edition parity comparison.

- [Eight synthetic, typed reference cases](../research/asia-independent-observation-2026-10-19/cases.json): 5 explicit CH4 rate formats, observed and unobserved windows, QC exclusion, negative flux, zero and missing-only controls.
- [Independent BigInt rational integrator](../scripts/independent-observation-js.mjs) and [Python Decimal UTC reference integrator](../scripts/independent-observation-py.py). These are separate source implementations, not one calculation called twice.
- [Exact parity gate](../scripts/observation-dual-oracle.mjs) compares all computed fields on the same input SHA256 and outputs a deterministic proof fingerprint. Nine-decimal rounding is matched exactly and deviations fail CI.
- [Independent oracle test suite](../tests/independent-observation-dual.test.mjs) enforces golden outputs and rejection cases.
- [Japanese production-research adapter parity test](../tests/japan-ieee-oracle-parity.test.mjs) compares the existing Japanese five-adapter engine against the portable stand-alone independent results on separately stored synthetic series. Both cannot silently drift without triggering CI.

## Mathematical normalization

| Input form | Molecular CH4 integral in mg/m2 |
| --- | --- |
| mg-CH4/m2/day interval mean | rate * seconds/86400 |
| g-CH4/m2/day daily mean | rate * seconds/86400 * 1000 |
| nmol-CH4/m2/s eddy interval mean | rate * seconds * 16.04 * 0.000001 |
| umol-CH4/m2/s eddy interval mean | rate * seconds * 16.04 * 0.001 |
| g-CH4-C/m2/day daily mean | rate * seconds/86400 * (16/12) * 1000 |

The methane molar-mass value (16.04 g/mol) and CH4-C research conversion (16/12) are distinct conventions. Neither is a Japan J-Credit AG-005 officially approved project factor. A rate must already have independently reviewed interval-mean semantics before any scientific original is mapped.

Coverage: observed + excluded-by-QC + unrepresented intervals equals total declared time. No filling; an observed zero remains zero; no observations produces null; any missing period makes full-period total null.

## Reproducibility and scientific boundary

Run node scripts/observation-dual-oracle.mjs, then node tests/japan-ieee-oracle-parity.test.mjs and bash tests/run.sh. Both NaFT Japan and the IEEE demo use the same reference fixture bytes, but their real certification/rule paths remain separate.

This research lane is limited to SYNTHETIC_TEST_ONLY. It rejects self-declared attested original bytes or certified reductions. The [upstream real-data accession catalog](asia-source-observation-acquisition-ieee-dock-2026-10-19.md) records six temporary publisher-checksum-matched source files; that alone does not validate original field period, treatment assignment, transplant-date offset, instrument QC, agency methodology eligibility, precision, emission impacts, uncertainty or data license. No actual Korean, Chinese or Japanese original flux measurements are imported into this dual oracle yet.

Next: independent native-source record review and authorized ingestion, especially Korean DAT-to-transplant calendar mapping and Chinese hourly methane molecule vs daily methane carbon-mass conventions. Only then may the system compare measured seasonal emissions and independent reported values; until so, causal attribution and certified tCO2e stay null.
