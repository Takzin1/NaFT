# Mitou reviewer demo — synthetic inputs only

Open `naft-app.html#/reviewer-demo` (or `index.html#/reviewer-demo`) in a browser. No build.

## 60-second reviewer flow

1. Press **「100 Claim変更影響実験を実行」**.
2. Confirm the live-computed result:
   - 100 candidate Claims
   - 30 require re-verification
   - 70 unaffected
   - 15 AUTO_REEVALUATED
   - 15 EVIDENCE_REQUIRED
3. Expand representative Claims to inspect why each Claim is unaffected / auto re-evaluated / blocked for missing Evidence. The detail includes previous package hash, dependency nodes, successor existence, and supersedes linkage when applicable.
4. Read the boundary notice: **70% is count-based re-verification scope reduction only**. It is not time, cost, accuracy, field validation, verifier acceptance, or official certification.
5. In **Human Decision binding**, choose one of ACCEPT / REJECT / NEED_MORE_EVIDENCE / ABSTAIN and press **「Human Decision stale化を見る」**. The demo computes the old/new input fingerprint and Pack hash and shows that the old decision binding is stale after the change.
6. If more detail is needed, move to the ordinary six-step research UI.

The Reviewer Demo and `tests/mitou-impact.test.js` share the same 100-Claim generator and `analyzeImpact` computation. The 100 / 30 / 70 / 15 / 15 counts are not presentation-only labels.

## Three-minute research UI

Keep Demo actor as Operator. All three Compiler demos explicitly use invented data, not real farmer observations or official methodology transitions.

1. **Demo A — ~45 sec.** Press “Demo A · Evidence → draft”. Evidence hashes, JSON normalization, identity/version/date checks, deterministic rules/calculation and graph are computed automatically. AUTO_REEVALUATED appears with a draft hash. Download the draft, inspect methodology/rules/source/manifests/calculation/unresolved items. No approval is required to generate it.
2. **Demo B — ~60 sec.** Press “Demo B · version diff / impact”. This remains the lightweight six-Claim fixture: 6 candidates → 4 re-verifications → 1 automatic / 2 evidence required / 1 judgement; 2 unaffected. Claim IDs are listed; download full impact JSON with successor graphs. These counts are computed, not stored labels in the UI.
3. **Demo C — ~45 sec.** Press “Demo C · ambiguous → review”. HUMAN_REVIEW_REQUIRED appears. Open Human Review, switch to Reviewer, write an explicit reason and resolve the judgement exception. Hard failures and missing evidence cannot be accepted this way.

For final attestation, first use Maintainer on Methodology, select `NAFT-SYNTHETIC@1` (or 2 for an updated claim) and approve research Pack release with a reason. Return to Reviewer, provide final statement, check the acknowledgement and attest. Export the attested Package. This does not perform formal certification. A subsequent new run for that Claim makes the old current export stale.

For custom inputs use the Evidence page's Compiler JSON editor. Text/photo bytes and structured farm-log/IoT/GIS JSON adapters normalize bytes/structure, not environmental meaning. Unknown institutional configuration stops evaluation. The separate existing AG-005 reference workflow remains below the Compiler panel and retains its original constraints.

Automated handler checks use DOM stubs. Unless an actual browser QA result is separately recorded, this document does not claim an actual-browser PASS.
