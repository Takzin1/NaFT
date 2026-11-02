# Japan Crop Production 1883–2022 — NaFT full remaster v1

> **Public research-data remaster, NOT government-certified MRV data.**
> Upstream creator and dataset redistribution terms have not been independently established. This repository does **not** grant a new license for the underlying source dataset. Verify upstream permission/attribution before independent republication or commercial reuse.

## About this dataset

Six original user-provided crops across 140 years and 58 geographic records per crop/year:
**Barley, Potato, Rice, Soybean, SweetPotato, Wheat**; 1883–2022; 47 historical/modern prefecture keys plus 10 aggregate region records and one country record. The original archive has **146,160 metric rows**. This remaster represents the exact same three source-reported metrics with **48,720 rows**—one for each `crop × year × geographic key`—to improve querying, joins, provenance and data QA.

| File | Records | Data fields |
|---|---:|---|
| [barley.csv](barley.csv) | 8,120 | 3 source values + 3 original source labels |
| [potato.csv](potato.csv) | 8,120 | same |
| [rice.csv](rice.csv) | 8,120 | same |
| [soybean.csv](soybean.csv) | 8,120 | same |
| [sweetpotato.csv](sweetpotato.csv) | 8,120 | same |
| [wheat.csv](wheat.csv) | 8,120 | same |

All six CSVs are committed to the repository, not merely advertised or generated on demand. Every file has frozen **SHA-256** and **Git blob SHA-1** values in [MANIFEST.json](MANIFEST.json). The Git blob hashes were independently computed from a full offline Python remaster of the original user-supplied ZIP and checked against the uploaded GitHub objects.

## Provenance

Original user-provided archive: `CropProduction_JP_1883-2022(1).zip`

- Original archive SHA-256: `8e8ec4ef894f179b9d3ceb66fe8e9319f707b45cc652f4ece50a29a14e8772e6`
- Original primary CSV SHA-256: `6cfaec5fe79fcead2149c2427490e57acbf9c4f24c370e847131c9bde41a920e`
- Original metadata workbook: `CropProduction_JP_DataSources.xlsx` (not republished here), plus `Prefecture_Code.csv` and `Japanese_Calendar.csv`.
- The source workbook cites historical agricultural publications including *Nou-Shoumu Toukeihyou*, *Nou-Rin-Shou Toukeihyou*, government crop statistics and certain e-Stat records. Example historical source-link appearing in the workbook: `http://www.e-stat.go.jp/SG1/estat/List.do?bid=000001024932&cycode=0` (legacy URL, **not independently retested for current resolution**).
- The workbook document properties include the names `Tomomichi` and `BUAREAL KANOKRAT`; these are **document creation/edit metadata only**, **not independently established dataset authors or rights holders**. Avoid attributing ownership on this basis alone.

Each remastered row carries original `production_source`, `area_source`, `yield_source`; the values are stored as the original CSV numeric strings without conversion, imputation, or interpolation. `quality_flag` is **newly added by the NaFT remaster**, and is explicitly not a publisher-supplied QC classification.

## Quality and scientific boundaries

| Flag | Records | Meaning |
|---|---:|---|
| `SOURCE_REPORTED_NOT_INDEPENDENTLY_QCED` | 44,902 | Source fields preserved, but no independent primary-source scientific approval |
| `ALL_ZERO_SOURCE_VALUE_UNVERIFIED` | 2,500 | Source says all three metrics are zero; no proof this represents actual absent cultivation |
| `SOURCE_COVERAGE_GAP_SUSPECTED` | 1,218 | Seven specific early years × three crops × 58 geographic records, conservatively flagged |
| `POSITIVE_PRODUCTION_ZERO_REPORTED_AREA` | 59 | Positive production but zero area, so calculated yield is not meaningful |
| `PREFECTURE_ZERO_MEANING_UNVERIFIED` | 41 | 2022 SweetPotato prefecture rows reported as zero; status unresolved |

The source gives 1885, 1886, 1888, 1889, 1890, 1891, and 1893 as all-zero national years for Potato, Soybean and SweetPotato; we do not claim actual complete absence of production. The three metrics are kept unchanged even for anomalous records. Area, production and reported yield retain their original units (ha, tonnes, tonnes/ha). Historical prefecture boundaries, source-method shifts, food-use classifications and comparison to NaFT's independently registered 2023–2026 rice statistics remain unharmonized.

**This data is NOT:**
- CH₄ chamber flux, groundwater measurements, satellite-derived water management, or independently verified carbon offset evidence;
- proof of field-level emission reduction, causal treatment response, GHG accounting accuracy, J-Credit eligibility, or tradable certified tCO₂e;
- an independently reverified republication of each historical government source (the provided compilation itself is the immediate record).

## Exact reproduction from the original ZIP

```bash
# Requires the identical upstream ZIP locally; script does not download anything.
python3 scripts/p17-japan-crop-full-remaster.py \
  /private/CropProduction_JP_1883-2022.zip --verify-committed

# To generate local files yourself, supply an already-created empty directory:
mkdir -p /private/p17-output
python3 scripts/p17-japan-crop-full-remaster.py \
  /private/CropProduction_JP_1883-2022.zip --out /private/p17-output

# Standalone CI checks every public CSV (no original ZIP required):
node tests/p17-japan-crop-full-remaster.test.mjs
```

## Redistribution and intellectual-property caution

The provided ZIP includes no explicit LICENSE/rights grant, and the original repository URL or dataset DOI was not established from its contents. Public availability of facts, citations or government reports **does not automatically confirm** that the particular original compilation, accompanying workbook, or annotations are license-free. The underlying values are published in this repository at the user's explicit request as a technical remaster with the source files' provenance and a conspicuous unresolved-rights notice. The remaster **does not** state CC-BY, MIT, public-domain status or official endorsement for third-party original content.

For the creator or rightsholder: open a repository issue with the authoritative source URI and redistribution terms so the source metadata, acknowledgments, copyright notice, or access policy can be reconciled. Publication should be revisited if rights are not available.

See also the [P16 original-archive audit](../../../docs/p16-japan-six-crop-history-real-zip-ja-2026-11-03.md) and [P17 regeneration code](../../../scripts/p17-japan-crop-full-remaster.py).
