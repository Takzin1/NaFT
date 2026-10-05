# IEEE ClimateChain 2026 — 4 Minute Demo Script

Target length: **about 4:00–4:20**. Keep the browser on `#/climatechain` unless an explorer transaction is shown.

## 0:00–0:25 — Problem

> Carbon markets depend on evidence. But evidence is not static. Methodologies, parameters and required records change over time. When that happens, project operators need to know which historical claims must be reviewed again — without silently reusing stale decisions or rechecking everything.

Show the hero and the agricultural MRV reference context.

## 0:25–0:50 — What NaFT is

> NaFT is a version-aware MRV evidence compiler. It binds claims to an exact methodology version, builds a dependency and provenance graph, and traces the impact of later changes.

Point at the flow: rule change → trace dependencies → re-verify affected claims → anchor lineage.

## 0:50–1:35 — Main live demo

Click **Run 100-claim methodology update**.

> In this synthetic workload, 100 claims were created under version one. Version two introduces additional requirements that only affect the intensive claims.

Show:

- 100 candidate claims
- 30 require re-verification
- 70 unaffected
- 15 auto re-evaluated
- 15 need new evidence

> These numbers are fixture-derived, not a performance claim. The important point is that the decision is derived from explicit dependencies and change semantics.

## 1:35–2:05 — Why one claim changed

Open the representative lineage detail.

> For this claim, NaFT can show why the rule change matters, which dependency was affected, and the exact successor package. The new package explicitly supersedes the old one rather than mutating history.

Show old package → successor package.

## 2:05–2:35 — Fail-closed behavior

> If required evidence is missing, NaFT does not turn uncertainty into a pass. And human decisions are bound to the input and methodology state, so a stale decision cannot silently survive a later change.

Briefly point to the evidence-required count and trust boundary.

## 2:35–3:10 — Blockchain provenance

Click **Prepare blockchain anchor plan**.

If testnet record is still `NOT_SUBMITTED`:

> The browser prepares exact package-lineage hashes but does not pretend that a blockchain transaction exists. Until a real public-testnet transaction is independently confirmed, the project remains explicitly NOT SUBMITTED.

If the record is `VERIFIED_TESTNET`:

> The same package lineage is anchored to a public testnet. The blockchain witnesses package hashes and parentage. It does not decide climate truth or issue a carbon credit.

Show explorer evidence only if the verified record is complete.

## 3:10–3:35 — Practical adoption

> NaFT is not a consumer wallet. A project aggregator uses it to organize claims, a verification operator uses it to focus review on affected cases, and a registry or program can inspect package lineage without receiving raw private evidence on-chain.

Show the three adoption cards.

## 3:35–3:55 — Engineering evidence

> The prototype is tested across five change classes. An independent full-recomputation oracle covers 614 deterministic adversarial changes. We observed zero false negatives within that tested synthetic state space, while keeping the limitations explicit.

Show the engineering evidence section.

## 3:55–4:10 — Closing

> Carbon credits need more than a ledger. They need evidence that survives change. NaFT makes climate MRV version-aware, selectively re-verifiable and independently traceable.

End on the NaFT title and the ClimateChain track name.
