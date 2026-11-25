# Compiler test report

## Before / After

Baseline: `8747ca889cb2412778e47ee6115bda3ff060574e`, **182 passed / 0 failed**.
After: **1165 passed / 0 failed** = original 182 + Compiler 354 + Mitou impact experiment 10 + Impact Proof 619 assertions. 既存1066 assertionsは削除・skip・意味変更せず保持し、Evidence replacementのadversarial comparisonをcontentからadapter / binding / period / category / expected hash / provenance / metadata-onlyまで拡張した。GitHub ActionsはNode 24で全suiteを実行する。

Run `bash tests/run.sh`. It checks all runtime syntax, the original suite, the new suite, static links, prohibited dependency/secret patterns and whitespace. There is no timing threshold. `node tests/measure.js` records physical LOC, actual six routes, stored-array collections and roles; see [baseline](../reports/baseline.json) and [after](../reports/size-after.json). LOC includes comments/blank lines; JSON fixtures and prose are excluded. Counts are not a maintainability or performance score.

## Original regression suite

182 assertions retained byte-for-byte in tests/smoke.test.js: SHA-256 native parity including padding/UTF-8/5 MiB, canonicalization, dates/baselines, AG-005 supplied-factor preview/null certified output, Manifest byte/hash/version/field binding, actor/snapshot checks after async hashing, duplicates, stale/tampered inputs, scope, audit chains, exception decisions, Pack release, explicit attestation, export reproducibility, UI escaping, six renderers, action dispatch and store/schema checks.

## Added Compiler suite

354 assertions cover Pack schema/deep-freeze/version coexistence, Diff categories and removals, unknown operations, 36 labeled Corpus cases with independent expected results, JSON adapter parsing, unknown applicability, graph node/edge integrity and determinism, transitive dependency traversal, evidence ordering, all five change types (methodology / evidence / parameter / field / activity), conditional added rules, unused parameters, no-op changes, exact scope and full-recomputation comparison. They also cover stale packages/reviews, material overrides, non-overridable errors, Pack release/final acknowledgement, exception-level `ACCEPT / REJECT / NEED_MORE_EVIDENCE / ABSTAIN`, stale decisions after input/Pack change, hard-error override refusal, decision-hash tamper detection, package-hash reproducibility, stored tampering, sequential changes, duplicate stored activities, round-trip persistence, all six full-runtime renderers, XSS and Demo A/B/C through actual handlers with DOM stubs. 既存10 lineage assertionsは、配列順変更に依存しないcurrent head、旧attested exportのstale維持、fork、missing parent、cross-Claim supersedes、破損peerの先行拒否、A→B→Cのcurrent/stale、保存→reload後のlineage一致を検証する。追加1 assertionは、sealed / audit-boundな同一ClaimのA↔B cycle topologyを専用fixtureで構築し、cycleそのものが`COMPILER_LINEAGE_CONFLICT`でfail closedすることを検証する。

## 100-Claim selective re-verification experiment

`tests/mitou-impact.test.js` and the browser Reviewer Demo share `mitouReviewerClaims()` / `runMitouReviewerExperiment()`. The CI suite deterministically generates 100 synthetic Claims and applies `NAFT-SYNTHETIC@1 → @2`. Expected result: 100 potentially affected candidates, 30 requiring re-verification, 70 unaffected, 15 `AUTO_REEVALUATED`, 15 `EVIDENCE_REQUIRED`, and no Human Review or Unsupported result. The test also verifies source Claim immutability, deterministic replay, linked successor packages and absence of successor packages for unaffected Claims.

The generated [Mitou impact report](../reports/mitou-impact-experiment.json) records `0.70` for this fixture's count-based share of Claims excluded from successor generation. **This is not a performance metric.** It follows the synthetic fixture composition (standard 70 / intensive 15 / intensive_complete 15) and would change if that composition changed. It is not a runtime, cost, accuracy, field-effect or institutional re-verification-rate estimate.

## Impact soundness adversarial harness

`tests/impact-proof.test.js` は、selective analyzer自身をoracleとして再利用しない。各caseで変更前後を `compileEvidence()` によりfull re-computationし、テスト側で独立に定義したsemantic view（active rule results、active evidence obligations、missing evidence、issue code/status、used parameter values、calculation operation/inputs/parameters/unit、calculation values/arithmetic preview、evaluation status）を比較する。methodology version ID、rule-pack version ID、source URL/hash/check timestamp、scope textはverification semanticsから分離する。

決定論的matrixは34種類のmethodology mutation × 12 Claim variant = 408件に、parameter 24件、field 24件、activity 48件、Evidence 110件を加えた**614件**。Evidenceはcontent / adapter / activity・field・methodology binding / period / category / expected hash / provenance / source metadata-onlyを横断する。単一変更だけでなくrule+parameter、rule+requirement、calculation+parameter、condition+parameter、multi-category interactionも含む。

[Generated proof report](../reports/impact-proof.json):

| Classification | Count |
|---|---:|
| Oracle semantic change | 429 |
| Oracle semantic unchanged | 185 |
| Analyzer re-verification | 536 |
| Analyzer unaffected | 78 |
| True positive | 429 |
| True negative | 78 |
| False positive | 107 |
| **False negative** | **0** |

**No false negatives found in 614 deterministic adversarial cases within the currently supported interpreter and change APIs.** これは任意の実制度Methodologyに対するsoundness/minimalityの数学的証明ではない。False positive 107件は安全側の追加再検証であり、oracle-unchanged 185件に対するconservative over-verification shareは約57.84%だが、性能KPIではない。

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

The Reviewer Demo displays the 100-Claim result from the same computation used by the Mitou impact suite rather than presentation-only constants. Assertion count is **1165 passed / 0 failed**. A separate GitHub Actions browser check starts the static app, uses a 375×812-equivalent headless Chrome viewport, opens `naft-app.html#/reviewer-demo`, clicks `reviewer-run`, verifies the rendered metrics are exactly 100 / 30 / 70 / 15 / 15, and checks the first-view/mobile-overflow boundary. The same real Chrome session then selects an active Operator through the actual UI event handler, registers the example Activity, adds SYNTHETIC Evidence, runs deterministic Evaluation, and navigates Methodology / Evidence / Evaluation / Exception / Human Review / Monitoring Package. Every route is checked for exact hash routing, horizontal overflow, render/status errors and browser runtime/console errors. The browser flow also writes a deterministic fixture file on the runner, injects it into the actual Evidence `<input type=file>` through Chrome DevTools Protocol, clicks the real attach action, verifies a 64-character SHA-256 Manifest with `content_storage=not_stored`, re-injects the same original into the recheck input, and requires the persisted/UI result to be `MATCH`. The same browser session then executes the new Compiler role handoff: Operator creates the synthetic draft, Maintainer releases the exact `NAFT-SYNTHETIC@1` research Pack with a rationale, Reviewer provides final acknowledgement/attestation, and the actual attested-export button generates a Blob JSON. The export is checked for `ATTESTED_RESEARCH_PACKAGE`, `formal_certification=false`, acknowledged `not_formal_certification` scope, stable run identity and a 64-character package hash.

## Validation limits

The core UI handler suites still use DOM stubs for many detailed action regressions, but Reviewer Demo and a normal Operator path through Activity registration → SYNTHETIC Evidence → Evaluation → all six routes now have a real-browser headless-Chrome smoke. Browser File-object upload/hash/recheck is now exercised with a real runner file, but native OS file-picker UX itself is not. Native browser download behavior including iOS Safari, persistence across reload/storage adapters, accessibility and device-specific visual rendering remain unverified. The synthetic Compiler Maintainer release → Reviewer attestation → export path is browser-tested, but institution-specific external verification and production identity/authentication are not. There is no production authentication, independent audit witness, concurrent-client transaction guarantee or real farmer/verifier validation. The Impact Proof result is bounded to the current supported interpreter/change APIs and deterministic synthetic state space; arbitrary institutional-rule translation remains unproven. No mixed-domain UI performance result is reused.

## Evidence Intelligence suites (2026-11-14, additive)

The 1,165 assertions above are unchanged. Six suites were added and run by `bash tests/run.sh`; the Node total is now **4,424 passed / 0 failed** (1,165 + 571 + 2,461 + 22 + 115 + 90), plus three Python oracle tests.

| Suite | Count | What it establishes |
|---|---:|---|
| `tests/evidence-intel.test.js` | 571 | Exact rational arithmetic, rounding and units fail closed; scope and coefficient registers; engine equals `compileEvidence` on the 36-case Corpus and 100 synthetic Claims; node-level graph reachability, cycles and dangling edges; every change type equals a full rebuild; a 60-step deterministic change sequence; exact aggregates; grounded reports and tamper/stale detection; explanation boundary including static separation; audit-log tamper matrix; every API route, error and limit |
| `tests/evidence-intel-impact.test.js` | 2,461 | The 614-case adversarial matrix against the same full-recomputation oracle: no false negative, incremental state equals a from-scratch build, the changed state equals `compileEvidence`, the previous state is untouched. Also asserts that the shared matrix reproduces `reports/impact-proof.json` for the legacy analyzer and that [the committed report](../reports/evidence-intel-impact.json) is reproducible |
| `tests/evidence-intel-api.test.mjs` | 22 | Real loopback HTTP round trips: loopback bind, Host check, no CORS header, JSON content type, 5 MiB body limit, byte-identical repeated responses, CLI exit codes |
| `tests/evidence-intel-anchor.test.js` | 115 | Non-transferable provenance anchors: Merkle proofs for 1–17 leaves and tamper cases, fixed no-token boundary, counts as the only numbers, change sensitivity, anchor chains, prepared call arguments, caller-supplied observation checks, API routes, and static checks that no runtime source implements a token, transfer, mint or transaction submission |
| `tests/evidence-intel-session.test.js` | 90 | Session integration through the existing store, roles and audit chain: compile, successor runs, individual decisions, attestation gates, attested and draft export, extended Pack release, anchors over attested packages, ownership, staleness after change, persistence round trip, older snapshots, tampering, faulty-writer records with valid bindings, store-failure rollback. A one-at-a-time mutation of 17 guards was detected in every case |
| `tests/evidence-intel-independent-oracle.test.py` | 3 tests | Python `fractions.Fraction` recomputes 442 expressions and 60 synthetic Claims under two coefficient versions, including the exact programme total; Python `hashlib` recomputes an anchor's Merkle root and hash |

`node scripts/benchmark-evidence-intel.cjs --quick` also runs in the suite as a correctness gate (full-rebuild oracle, legacy parity, analyzer set equality, audit cross-check) with no timing threshold. Measured timings and their limits are in [the measurement report](evidence-intelligence-measurements-ja.md).

Validation limits specific to this layer: synthetic Claims only; no generative model is called, so AI-written explanations are untested beyond hand-written drafts fed to the validator; the modules were loaded once in headless Chromium in the authoring session (hashes identical to Node) but are not part of the CI browser check; the session suite exercises the store, roles and audit chain in Node with the in-memory store adapter, but nothing here exercises the six routes or a real browser.
