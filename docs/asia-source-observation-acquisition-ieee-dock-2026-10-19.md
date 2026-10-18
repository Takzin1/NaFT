# NaFT Japan → IEEE: Monsoon Asia original-data accession and source dock

Date: 2026-10-19. **Discovery != acquisition != valid field measurement != certified credits.**

## Catalog of research references

See [machine-readable source index](../research/asia-source-dock-2026-10-19/source-index.json). Research landing pages/DOIs were rechecked 2026-10-19, but this environment cannot retrieve Zenodo binary files: its network returned a failed download/DNS. The record has 8 study/dataset sources and 7 publisher-advertised file checksums. The **actual scientific original SHA-256 values are null**. The cited MD5 values come from Zenodo *publisher listing*, not a successful independently downloaded file.

| Source | Scientific layer | DOI / research URL | Ingest plan |
| --- | --- | --- | --- |
| Korea Gimje 2022–2024 | **daily static-chamber field observations** | [10.5281/zenodo.17111992](https://doi.org/10.5281/zenodo.17111992); [2026 peer-reviewed field/model paper](https://doi.org/10.1038/s41598-026-49883-4) | unzip ch4.zip, inspect per-file units, QC, DAT + transplant date, site metadata. Only then map to daywise adapter |
| Eastern China hourly / season | **eddy covariance field observations** | [10.5281/zenodo.8067998](https://doi.org/10.5281/zenodo.8067998) | inspect both CSVs and timestamp timezone, rate units; do not treat concentration/instantaneous or seasonal sums as interval-mean |
| Japan JP-Hrt | **tower site** | [10.17592/001.2024121020](https://doi.org/10.17592/001.2024121020), [JapanFlux2024 data paper](https://doi.org/10.5194/essd-17-3807-2025) | review published corrigendum, site variables and CH4 coverage first |
| Korea KR-CRK | **harmonized FLUXNET-CH4** | [FLUXNET policies](https://fluxnet.org/data/fluxnet-ch4-community-product/), [download portal](https://fluxnet.org/download-data/) | Tier 1/Tier 2 license is site-dependent, timestamps local standard time (not UTC), -9999 missing |
| Monsoon Asia (Ouyang) | **spatial model predictions, not raw field observations** | [10.5281/zenodo.7145497](https://doi.org/10.5281/zenodo.7145497) | external-grid benchmark only; no field observation certification |
| SEA-9 inventory (Casas / Ismail, 2026) | **regional model and Monte Carlo** | [10.5281/zenodo.20453139](https://doi.org/10.5281/zenodo.20453139) | Monte Carlo/decomposition independent benchmark; companion manuscript under review, not confirmed peer reviewed |
| Yagi (1996) | **published aggregate only** | [10.1029/96GB00517](https://doi.org/10.1029/96GB00517) | previously computed published totals; raw time series missing |
| Nishimura (2004) | **published aggregate only** | [10.1029/2003GB002207](https://doi.org/10.1029/2003GB002207) | previous annual totals; raw chamber concentration and sampling metadata missing |

Zenodo landing pages show publisher-side MD5 values, but the license *display* is not sufficient in this acquisition environment to assert the specific record permission. Every source retains **license_status=REVIEW_REQUIRED**. Public read access **does not itself grant republication**, and even a downloaded ZIP will not automatically be committed to public GitHub.

## Harvester behavior and how to actually acquire

\`python3 scripts/harvest-asia-source-index.py\` checks the source register **offline**.

\`python3 scripts/harvest-asia-source-index.py --fetch\` on an internet-connected machine attempts five strictly allowlisted Zenodo files (two Korean, one China, one annual Asia model and one SEA-9 inventory ZIP). Downloads are held **only in memory**, up to 15MB each, with HTTPS hostname/redirect restrictions. Every original downloaded byte stream is checked against the **publisher-advertised MD5**, SHA-256 is computed, ZIP is inspected for member paths and oversized content without extracting it, and a source-specific report is printed to stdout. A verified MD5 is a byte-consistency check with the published checksum — **not a validated experimental condition, independently validated license, or certification**.

A separate manually dispatchable / branch-triggered [GitHub workflow](../.github/workflows/asia-source-harvest.yml) attempts these remote fetches. Its CI result and logs, not the landing-page index, establish whether any bytes were actually fetched. Failures remain visible and do not promote the source stage. Raw scientific ZIPs are never committed or published by the workflow.

## IEEE dock protocol (prepared, not yet inserted into IEEE)

\`\`\`bash
node scripts/asia-source-dock-export.mjs
node tests/asia-source-dock.test.mjs
python3 scripts/harvest-asia-source-index.py
\`\`\`

Export schema \`naft-ieee-observation-source-dock-v1\` is a portable, deterministic **metadata-only** representation including DOI, jurisdiction, data class, publisher MD5 and the index SHA256. Explicitly:
- The IEEE edition must **not** infer a field observation from gridded modeled CH4, Tier 2 uncertainty outputs or a paper's published summaries.
- Foreign project emission coefficients are **not** Japan AG-005 emission factors.
- Do not convert reference-catalog entries to \`original_sha256\`, independent environmental equality, agri-credit eligibility, or actual greenhouse gas reductions.
- First obtain original publisher bytes and pin real SHA-256, then separately review licenses, file columns, units, time basis, QC flags, temporal coverage, site/soil/water conditions, model comparability and method version.
- A downloaded primary file is evidence of source bytes, **not proof that the measurement or derived seasonal budget is correct**.

Only then move from \`SOURCE_CATALOG_ONLY\` to independently checked data and build a **new source-specific adapter**. No unattended claim of measurement accuracy is permitted.

## Evidence expectations for later real-data comparison

For a field observation, retain site ID, observation date support, farm management, soil class, climate context, flux measuring method, instrument calibration/QC and observation completeness. Compare annual vs cropping season separately. Missing periods stay missing. Even if an archived research series can be reproduced numerically, it is not a Japan J-Credit-certified quantity.

**This phase commits source metadata + a reproducible acquisition and future IEEE docking tool, not unpublished datasets or any verified original observation values.**
