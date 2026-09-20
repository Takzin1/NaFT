# Three-minute demo — synthetic inputs only

Open `naft-app.html` (or index.html) in a browser. No build. Keep Demo actor as Operator. All three Compiler demos explicitly use invented data, not real farmer observations or official methodology transitions.

1. **Demo A — ~45 sec.** Press “Demo A · Evidence → draft”. Evidence hashes, JSON normalization, identity/version/date checks, deterministic rules/calculation and graph are computed automatically. AUTO_REEVALUATED appears with a draft hash. Download the draft, inspect methodology/rules/source/manifests/calculation/unresolved items. No approval is required to generate it.
2. **Demo B — ~60 sec.** Press “Demo B · version diff / impact”. Inspect changed rule, parameter, evidence requirement and added exception. Fixture-derived result: 6 candidates → 4 re-verifications → 1 automatic / 2 evidence required / 1 judgement; 2 unaffected. Claim IDs are listed; download full impact JSON with successor graphs. These counts are computed, not stored labels in the UI. This button is read-only. On Evaluation, “Apply v1 → v2…” explicitly appends successor runs for saved synthetic Claims and makes prior current exports stale.
3. **Demo C — ~45 sec.** Press “Demo C · ambiguous → review”. HUMAN_REVIEW_REQUIRED appears. Open Human Review, switch to Reviewer, write an explicit reason and resolve the judgement exception. Hard failures and missing evidence cannot be accepted this way.

For final attestation, first use Maintainer on Methodology, select `NAFT-SYNTHETIC@1` (or 2 for an updated claim) and approve research Pack release with a reason. Return to Reviewer, provide final statement, check the acknowledgement and attest. Export the attested Package. This does not perform formal certification. A subsequent new run for that Claim makes the old current export stale.

For custom inputs use the Evidence page's Compiler JSON editor. Text/photo bytes and structured farm-log/IoT/GIS JSON adapters normalize bytes/structure, not environmental meaning. Unknown institutional configuration stops evaluation. The separate existing AG-005 reference workflow remains below the Compiler panel and retains its original constraints.

Automated handler checks use DOM stubs; this script is not a claim of actual-browser validation.
