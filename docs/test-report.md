# Compiler test report

## Before / After

Baseline: `8747ca889cb2412778e47ee6115bda3ff060574e`, **182 passed / 0 failed**.
After: **535 passed / 0 failed** = original 182 + Compiler 343 + Mitou impact experiment 10 assertions. 既存525 assertionsは削除・skip・書換えせず保持し、Compiler lineage integrity regression A-Hとして10 assertionsを追加した。GitHub ActionsはNode 24で全suiteを実行する。

Run `bash tests/run.sh`. It checks all runtime syntax, the original suite, the new suite, static links, prohibited dependency/secret patterns and whitespace. There is no timing threshold. `node tests/measure.js` records physical LOC, actual six routes, stored-array collections and roles; see [baseline](../reports/baseline.json) and [after](../reports/size-after.json). LOC includes comments/blank lines; JSON fixtures and prose are excluded. Counts are not a maintainability or performance score.

## Original regression suite

182 assertions retained byte-for-byte in tests/smoke.test.js: SHA-256 native parity including padding/UTF-8/5 MiB, canonicalization, dates/baselines, AG-005 supplied-factor preview/null certified output, Manifest byte/hash/version/field binding, actor/snapshot checks after async hashing, duplicates, stale/tampered inputs, scope, audit chains, exception decisions, Pack release, explicit attestation, export reproducibility, UI escaping, six renderers, action dispatch and store/schema checks.

## Added Compiler suite

343 assertions cover Pack schema/deep-freeze/version coexistence, Diff categories and removals, unknown operations, 36 labeled Corpus cases with independent expected results, JSON adapter parsing, unknown applicability, graph node/edge integrity and determinism, transitive dependency traversal, evidence ordering, all four change types, conditional added rules, unused parameters, no-op changes, exact scope and full-recomputation comparison. They also cover stale packages/reviews, material overrides, non-overridable errors, Pack release/final acknowledgement, exception-level `ACCEPT / REJECT / NEED_MORE_EVIDENCE / ABSTAIN`, stale decisions after input/Pack change, hard-error override refusal, decision-hash tamper detection, package-hash reproducibility, stored tampering, sequential changes, duplicate stored activities, round-trip persistence, all six full-runtime renderers, XSS and Demo A/B/C through actual handlers with DOM stubs. 追加10 assertionsは、配列順変更に依存しないcurrent head、旧attested exportのstale維持、fork、missing parent、cross-Claim supersedes、破損peerの先行拒否、A→B→Cのcurrent/stale、保存→reload後のlineage一致を検証する。

## 100-Claim selective re-verification experiment

`tests/mitou-impact.test.js` and the browser Reviewer Demo share `mitouReviewerClaims()` / `runMitouReviewerExperiment()`. The CI suite deterministically generates 100 synthetic Claims and applies `NAFT-SYNTHETIC@1 → @2`. Expected result: 100 potentially affected candidates, 30 requiring re-verification, 70 unaffected, 15 `AUTO_REEVALUATED`, 15 `EVIDENCE_REQUIRED`, and no Human Review or Unsupported result. The test also verifies source Claim immutability, deterministic replay, linked successor packages and absence of successor packages for unaffected Claims.

The generated [Mitou impact report](../reports/mitou-impact-experiment.json) records a **0.70 count-based scope reduction ratio**. This is a ratio of Claims excluded from successor re-verification, not a runtime, cost, accuracy or field-effect estimate.

## Automatically measured KPIs

[36-case Corpus](../fixtures/evaluation-corpus.json), metadata origin=synthetic, real_farmer_data=false. Twelve categories × three deterministic input variants. Expected status/flags/arithmetic are fixture labels, not compiler-generated predictions. Label source is synthetic engineering design, not institutional expertise or a held-out field study.

**36/36 synthetic conformance cases matched expected outputs.** This is an engineering conformance result only; it is not field, production, institutional or real-world MRV accuracy.

[Generated report](../reports/evaluation-kpis.json):

| Metric | Result on this Corpus |
|---|---|
| Synthetic conformance: evidence completeness / usable evidence detection | 36/36 |
| Missing evidence precision / recall | 9/9 and 9/9 |
| Methodology binding mismatch | 3/3 positive, 33/33 negative |
| Tamper detection | 3/3 positive, 33/33 negative |
| Duplicate/overlap detection | 3/3 positive, 33/33 negative |
| Calculation arithmetic oracle | 36/36 |
| Deterministic compilation repeat | 36/36 |
| Impact coverage, conditional transition vs full recomputation | 3/3 affected Claims |

Tampered/version-mismatched evidence is not usable evidence and is labeled missing for completeness purposes. The separate three ambiguous-field cases are human-review tests, not overlap true positives. Impact coverage is a narrow synthetic oracle; it is not proof of completeness/minimality for arbitrary institutional methodologies. False negatives/positives are exported as confusion counts. Field MRV cost, review time, income and verifier acceptance remain null, not estimated.

## Reviewer Demo validation boundary

The Reviewer Demo displays the 100-Claim result from the same computation used by the Mitou impact suite rather than presentation-only constants. Assertion count is **535 passed / 0 failed**. A separate GitHub Actions browser check starts the static app, opens `naft-app.html#/reviewer-demo` in headless Chrome, clicks `reviewer-run`, and verifies the rendered metrics are exactly 100 / 30 / 70 / 15 / 15.

## Validation limits

The core UI handler suites still use DOM stubs, while the Reviewer Demo route now has a real-browser click-and-metric smoke in headless Chrome. File chooser, browser download, accessibility, persistence, responsive visual layout and the complete six-route workflow remain unverified in an actual browser. There is no production authentication, independent audit witness, concurrent-client transaction guarantee or real farmer/verifier validation. No mixed-domain UI performance result is reused.
