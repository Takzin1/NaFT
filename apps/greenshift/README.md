# NaFT GreenShift — P81–P85
New standalone research prototype initiated 2026-11-25 for Green Shift Hacks.
## Run
Node 20+ for tests: `node --test engine.test.mjs evidence.test.mjs`.
Serve this directory with `python3 -m http.server 8000 --bind 127.0.0.1`, then open http://127.0.0.1:8000/.
No dependencies, keys, or backend. Export is local.
## Model
A = total hectares; B = baseline methane emissions in tCO2e/ha over the same assumed period; f = adoption fraction; r = assumed methane reduction fraction; E = additional project emissions per treated ha; C = incremental cost per treated ha.
Baseline = A × B. Net avoided emissions = A × f × (B × r − E). Projected emissions = baseline − net avoided emissions. Cost = A × f × C. Negative net values are retained. Low/expected/high are user-provided sensitivity assumptions, not probabilities or confidence intervals. This is a simplified scenario model, not a formal methodology; other emissions and agronomic constraints may matter.
All defaults are synthetic illustrative values, not field data or approved emission factors. No verified impact, issuance, payments, or trading. Cost per tonne is null for nonpositive net benefit.
## Provenance and eligibility
The parent repository predates the hackathon. This directory is new work and imports no existing NaFT code, data or third-party assets. Do not submit the full repository as an original hackathon project. Export only this directory into a dedicated repository before submission, retaining authorship/development disclosures. Organizer confirmation required before integrating the pre-existing NaFT core. Rules: https://green-shift-hacks.devpost.com/rules
## Roadmap
P81 planner, P82 baseline, P83 scenario comparison: initial implementation. P84 evidence intake and P85 impact status: initial implementation. P86 uncertainty expansion, P87 claims gate, P88 optimization, P89 optional permitted core integration, P90 submission package: pending. No changes to parent workflows or existing files.

## P84–P85 evidence workflow
Use localhost or HTTPS for Web Crypto. Attach only synthetic files (1 byte–10 MiB, 24 records max); raw bytes and file names are not persisted or exported. Evidence categories are a research checklist inspired by agricultural monitoring, not an AG-005 compliance test. Duplicate SHA-256 content is rejected. Self-review requires three categories, explicit confirmation and a SHA-256 scope binding normalized assumptions and sorted evidence metadata. Changes invalidate review. JSON is an unsigned manifest; external rechecking requires original bytes and independent review. No verified tonnes even after self-review.
Sources: https://www.maff.go.jp/j/kanbo/kankyo/seisaku/climate/jcredit/241226.html ; https://www.maff.go.jp/j/wpaper/w_maff/r5/r5_h/trend/part1/chap1/c1_4_00.html ; https://www.w3.org/TR/prov-dm/ (conceptual inspiration, not PROV conformance).
