# MRV Compiler implementation status

## Completed

- [x] MRV-only six-route UI and shared cryptographic/audit primitives.
- [x] Immutable Versioned Pack schema, old AG-005 reference retention and AG-004 fail-closed placeholder.
- [x] Synthetic old/new version coexistence and deterministic structured methodology diff.
- [x] Evidence JSON normalization, dependency graph and reproducible package hashes.
- [x] Methodology / evidence / parameter / field / activity impact analysis and selective re-verification, with identity-changing activity patches rejected fail-closed.
- [x] Audited exception-only review, Pack release approval, final attestation and stale current export guards.
- [x] Thirty-six synthetic Corpus cases, automatic KPIs and three demo flows.
- [x] Original 182 MRV regression assertions preserved.
- [x] Headless-Chrome Reviewer Demo plus Operator Activity → SYNTHETIC Evidence → Evaluation flow across all six routes, with mobile overflow and browser runtime-error checks.
- [x] New Compiler browser role handoff: Operator draft → Maintainer research Pack release → Reviewer attestation → attested JSON export with non-certification boundary checks.
- [x] Headless-Chrome Evidence file input: real runner file → SHA-256 Manifest → same-original recheck MATCH, while retaining `content_storage=not_stored`.

## Unresolved technical debt

- [ ] Latest adopted AG-005, AG-004 source confirmation and full institutional translation.
- [ ] Real semantic evidence adapters, authoritative identity, calibration and original custody.
- [ ] Proof of impact-analysis soundness/minimality beyond the tested interpreter and synthetic Corpus.
- [ ] Authenticated multi-party decisions, independent witness, concurrent transactions and cross-owner field changes.
- [ ] Formal amendment/revocation, signatures and legacy-to-Compiler conversion.
- [ ] Native OS file-picker UX, native download behavior, accessibility, persistence and production-authenticated browser verification.
- [ ] Field MRV cost/review time/income measurements and external verifier acceptance.

## Evidence Intelligence — stage 1 (2026-11-14)

Additive modules `src/evidence-intel-*.js`; existing compiler, session, UI, fixtures and reports are unchanged. See [design](../docs/evidence-intelligence-design-ja.md), [audit](../docs/evidence-intelligence-audit-ja.md) and [measurements](../docs/evidence-intelligence-measurements-ja.md).

### Completed and verified

- [x] Exact rational calculation interpreter with explicit rounding, unit dimensions and a step trace; independent Python `Fraction` oracle.
- [x] Coefficient registry with versions, effective periods and supersession; advisory methodology candidates; evidence revision lineage; standards scope register with accounting contexts.
- [x] Node-level dependency graph that is the computation itself; O(V+E) upstream/downstream trace, cycle detection and dependency paths.
- [x] Differential re-computation with reuse and early cutoff; equal to a full rebuild and to `compileEvidence` on the 614-case matrix, a 60-step change sequence and every change type.
- [x] Explanation boundary: one-directional context, deterministic template explainer, validator for externally written drafts.
- [x] Typed audit log for inputs, calculations, verification results, changes, reports and explanations.
- [x] Grounded reports with re-verification; stateless API with loopback HTTP adapter and CLI.
- [x] Benchmarks at 100 / 1,000 / 5,000 synthetic Claims with correctness gates.

### Not done (do not report as complete)

- [ ] AI-generated explanations: no model is called; only the boundary and the validator exist.
- [ ] Session persistence, role/scope guards and binding to the existing audit chain for engine states and logs.
- [ ] UI inside the six routes; CI real-browser coverage for the new modules.
- [ ] Corporate GHG inventory accounting; pinned primary text of the GHG Protocol LSR Standard v1.1.
- [ ] Real coefficients, period splitting across coefficient versions, conditional or tabular calculation.
- [ ] Signatures, external timestamps or an independent witness for the audit log.

### Evidence Intelligence 次のPR計画

| PR | Scope | Gate before merge |
| --- | --- | --- |
| PR-2 Session integration | Persist engine state and audit log through the existing store adapter; operator/reviewer/maintainer guards; bind the log head to `audit()`; bind exception decisions and attestation to `record_hash`; stale-export rules | Existing 1,165 assertions unchanged; negative tests for every guard; tamper tests on persisted state |
| PR-3 UI in the six routes | Read-only panels: dependency trace, impact, grounded report download, explanation sidecar display with the non-authoritative label; `esc` and delegated handlers only | Headless-Chrome flow in CI; mobile overflow; no new route |
| PR-4 Analyzer convergence | Route `analyzeImpact` / `applyCompilerChange` through the engine behind an explicit option; keep the legacy path as oracle; decide the future of `incremental-compiler-research.js` | 614-case matrix and 100-Claim experiment identical on both paths; package hashes unchanged |
| PR-5 Source pinning and scope | Pin LSR Standard v1.1 bytes and SHA-256 (needs network allowance); clause-level scope notes; current AG-005 version check. No executable inventory Pack until text is verified | Source ledger test; register stays `executable: false` |
| PR-6 Calculation coverage | Conditional expressions, lookup tables, stratified sums, uncertainty propagation; period splitting across coefficient versions | Independent oracle for every new operation; fail-closed tests |
| PR-7 Audit witness and scale | Merkle inclusion proofs, optional external timestamp/signature, persisted structural sharing, memory profile above 5,000 Claims, large evidence payloads | Tamper matrix; benchmark report with the same correctness gates |
| PR-8 External explainer adapter | Adapter outside the deterministic core for a caller-operated model; evaluation set for validator false accepts/rejects, including paraphrase attacks | Validator metrics reported; sidecar never enters any hash |

## Web3 — provenance anchoring only (2026-11-25)

Tradable tokens are **not** implemented. `LICENSE` and `AGENTS.md` still prohibit exchangeable tokens, payments and trading of certified credits without prior legal review, and NaFT has no certified quantity to represent. See [legal issues](../docs/web3-token-legal-issues-ja.md) and [anchoring design](../docs/web3-provenance-anchoring-design-ja.md).

### Completed and verified

- [x] Non-transferable anchor payload: Merkle root of Claim records, state digest, coefficient registry, optional audit head and report root, previous-anchor link, fixed no-token boundary.
- [x] Prepared `anchorPackage(bytes32,bytes32,bytes32,bytes32)` arguments with `value_wei: "0"` and `NOT_SUBMITTED`; caller-supplied observation check without fetching.
- [x] Inclusion proofs, anchor chains, `ANCHOR` audit entries, three API routes; Python hashlib recomputation of the anchor.

### Not done (each needs a separate decision)

- [ ] Contract semantics for portfolio anchors and a testnet run.
- [ ] Submission tool outside the pure core (human action, testnet only, secrets outside the repository); depends on how the external-API rule in `AGENTS.md` is applied.
- [ ] Session integration: anchor only attested packages, bind to the existing audit chain.
- [ ] Any tradable token: blocked until every gate in the legal issues document section 5 is met and the owner changes `LICENSE` / `AGENTS.md`.

## Evidence Intelligence — PR-2 session integration (2026-11-25)

- [x] `src/evidence-intel-session.js`: runs, successor runs, individual decisions, final research attestation, attested export, maintainer release for extended Packs and NOT_SUBMITTED anchors over attested packages, all through `db` / `saveDB`, role guards and `audit()`; rebuild-and-compare on every read; rollback on store failure; older snapshots load unchanged.
- [x] 90 assertions; mutation check of 17 guards, all detected.
- [ ] PR-3: read-only panels in the six routes and CI real-browser coverage.
- [ ] PR-4: route `analyzeImpact` / `applyCompilerChange` through the engine with the legacy path as oracle.
