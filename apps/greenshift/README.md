# NaFT GreenShift — P81–P90
New standalone research prototype initiated 2026-11-25 for Green Shift Hacks.
## Run
Node 20+ for tests: `node --test *.test.mjs`.
Serve this directory with `python3 -m http.server 8000 --bind 127.0.0.1`, then open http://127.0.0.1:8000/.
No dependencies, keys, or backend. Export is local.
## Model
A = total hectares; B = baseline methane emissions in tCO2e/ha over the same assumed period; f = adoption fraction; r = assumed methane reduction fraction; E = additional project emissions per treated ha; C = incremental cost per treated ha.
Baseline = A × B. Net avoided emissions = A × f × (B × r − E). Projected emissions = baseline − net avoided emissions. Cost = A × f × C. Negative net values are retained. Low/expected/high are user-provided sensitivity assumptions, not probabilities or confidence intervals. This is a simplified scenario model, not a formal methodology; other emissions and agronomic constraints may matter.
All defaults are synthetic illustrative values, not field data or approved emission factors. No verified impact, issuance, payments, or trading. Cost per tonne is null for nonpositive net benefit.
## Provenance and eligibility
The parent repository predates the hackathon. This directory is new work and imports no existing NaFT code, data or third-party assets. Do not submit the full repository as an original hackathon project. Export only this directory into a dedicated repository before submission, retaining authorship/development disclosures. Organizer confirmation required before integrating the pre-existing NaFT core. Rules: https://green-shift-hacks.devpost.com/rules
## Roadmap
P81 planner, P82 baseline, P83 scenario comparison: initial implementation. P84 evidence intake and P85 impact status: initial implementation. P86–P88 decision lab: initial implementation. P89 standalone shadow valuation and replay: initial implementation. P90 submission draft: prepared; runtime and deployment gates pending. Existing core integration remains pending permission. No changes to parent workflows or existing files.

## P84–P85 evidence workflow
Use localhost or HTTPS for Web Crypto. Attach only synthetic files (1 byte–10 MiB, 24 records max); raw bytes and file names are not persisted or exported. Evidence categories are a research checklist inspired by agricultural monitoring, not an AG-005 compliance test. Duplicate SHA-256 content is rejected. Self-review requires three categories, explicit confirmation and a SHA-256 scope binding normalized assumptions and sorted evidence metadata. Changes invalidate review. JSON is an unsigned manifest; external rechecking requires original bytes and independent review. No verified tonnes even after self-review.
Sources: https://www.maff.go.jp/j/kanbo/kankyo/seisaku/climate/jcredit/241226.html ; https://www.maff.go.jp/j/wpaper/w_maff/r5/r5_h/trend/part1/chap1/c1_4_00.html ; https://www.w3.org/TR/prov-dm/ (conceptual inspiration, not PROV conformance).

## P86–P88 decision lab
Separate synthetic UI and report, intentionally not part of the evidence self-review scope. The robust model enumerates 16 corners for baseline, adoption, reduction and added emissions, preserves negative reductions, caps adoption at 1, and reports one-at-a-time sensitivity. Bounds are deterministic scenarios, not statistical confidence intervals. The claim function generates fixed qualified language from the recomputed model; no verified claims. The optimizer enumerates all affordable portfolios (maximum 6 groups, 5 options each plus no action), selects one action per group, maximizes summed lower-bound reduction then minimizes upper cost, and returns the nondominated cost/lower-bound frontier. All land groups must be disjoint; independent additive effects and fixed per-ha cost assumed; no real agronomic recommendations or field overlap checks. Upper cost rounds up to whole yen per action. Sources are conceptual, not compliance claims:
- https://www.ipcc-nggip.iges.or.jp/faq/faq
- https://ghgprotocol.org/blog/inventory-and-project-accounting
- https://cdm.unfccc.int/Reference/catalogue/document?doc_id=000003240
- https://www.worldbank.org/en/news/feature/2023/04/20/what-you-need-to-know-about-abatement-costs-and-decarbonisation

## P89–P90 replay and value
Decision reports are replayed from validated inputs, budget and spreads; compare all fields with recomputation. Key order does not matter. This is not a signature: someone who changes inputs and recomputes a consistent report can pass. Evidence self-review is separate. Hypothetical price × projected signed net reduction gives shadow value; subtract upper cost and derive break-even price only for positive reduction. USD conversion uses user-entered assumptions, not live FX. No credit revenue, trading or token integration. See SUBMISSION.md for draft and release gates.
