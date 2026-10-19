# NaFT — Research Evidence Readiness Report (2026-10-19)

**Objective:** Provide a third-party-readable account of what is supported by a source manifest, what is merely a study result, and which evidence is still missing before any independent scientific replay. This is NOT an assurance opinion, a VVB report, a certification, or a new calculation engine.

## One reproducible command

From the repository root (Node.js 20+, no added dependencies):

~~~sh
node scripts/report-research-readiness.mjs --format markdown
node scripts/report-research-readiness.mjs --format json
~~~

The report includes a `content_sha256` of its own canonical data, and supports hash matching of independently re-run outputs:

~~~sh
node scripts/report-research-readiness.mjs --format json --verify YOUR_PREVIOUS_SHA256
~~~

Unknown options, wrong hashes, modified source versions, falsely approved QC, unjustified calculations and scientific status promotion are rejected. Hashes are **integrity commitments to the on-repository report source manifests**, not independent digital signatures, trusted timestamps, original sensor samples or a publisher-origin certificate. The script never makes API calls and never reads private emails.

## Evidence actually present

| Assessment | Outcome |
| --- | --- |
| JP-Hrt original ZIP identity | User-supplied file hash pinned, publisher-origin independently unverified |
| 2013 EC methodology | Described in Komiya dissertation for study scope; not proven mapped to every published 2024 row |
| Published FCH4 numeric coverage | 1,915 QC-unknown candidates, 15,605 missing on 17,520 native HH rows |
| BADM metadata reconciliation | 1,689 candidates predate the documented 2013-08-31 start; human source review required |
| Tellus EC processing method | Reference experiment on MSE 2005 CO2/H/LE; not JP-Hrt CH4 |
| Verra VM0051 v1.1 vs GS AWD | Source/version/approach namespaces separate; automatic label transfer forbidden |
| Gold Standard training calculations | Independent CH4-only subterm calculated, but NOT full workbook/credit replay |

## What must be acquired to move forward

The deterministic JSON contains 7 evidence blockers, with explicit required evidence and source links.

**P0 JP-Hrt:** a site PI response or local provenance files that establish the 10Hz to 30min to submitted FCH4 calculation history; per-row QC and pre-submission gap filling; measurement start/date and method discrepancy; timezone and monitoring coverage.

**P1 other research:** Gold Standard confirmation of the VVB/checklist Tier 1 versus workbook Tier 1 semantics; workbook exact scenario cell binding and fully independent, multi-gas re-execution; external VVB/official program validation if a formal claim is ever sought.

The sole independent CH4 example (10,000 ha × (420 - 95) kg CH4/ha, GWP 28 and illustrative 10% deduction) is a **bounded arithmetic demonstration**, not a certified project reduction or the Gold Standard workbook answer. No current AG-005 interpretation or credits are asserted.

## Security, lineage and scientific restraint

- Source identity alone does not establish sensor calibration, QC, source team gap treatment, or scientific truth.
- All source binary data, raw measurement values, received private email correspondence and researcher contacts remain outside the public repository.
- The file/hash anchors are sourced from previously inspected user files; the CI uses the committed derived metadata only, **not the original 153MB ZIP or Excel binary**.
- Versioned upstream methodology source fields are pinned, but new versions require explicit examination and registry update.
- Compiling the readiness report creates no client attestation, registry operation or financial transfer.

## Code

- `scripts/lib/research-readiness-report.mjs` composes existing source gate evaluations into claims, evidence blockers and a deterministic report digest.
- `scripts/report-research-readiness.mjs` exposes a local read-only JSON/Markdown CLI.
- `tests/research-readiness-report.test.mjs` verifies source tamper/fake science boundaries, checksum stability, deterministic rendering, CLI error handling.
- All regression tests are integrated in `bash tests/run.sh`.

**Scope decision:** This feature lives in a follow-up branch dependent on source review PR #40, not in main. No claim of independent reprocessing of the source 10Hz waveforms is made.
