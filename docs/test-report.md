# MRV Core test report

## Refactoring result

Baseline `cd06ba0c6eb96db5684dd7126cf113b023322dad`: **276 passed / 0 failed**.
MRV-only working tree: **182 passed / 0 failed** with Node.js v24.19.0.

The old combined-domain suite was replaced with Core-specific assertions. Removed-domain tests were deleted with their runtime; no skip mechanism or dead feature was retained to preserve the count. Counts represent assertions, including distinct hash boundary cases, not independent user sessions.

## Covered boundaries

- Native SHA-256 parity: empty input, padding boundaries, binary/multiblock, UTF-8 and maximum 5 MiB input; canonical ordering and ambiguity; asynchronous/fallback parity.
- Inclusive dates, leap years, heading cutoff, baseline averaging/consecutive years/overlap, extension threshold and explicitly supplied arithmetic; unknown coefficients never invented.
- Exact methodology version, adapter/rule hash and evidence binding; Program/farmer/field identity; duplicate/overlapping activity refusal and scope guards.
- Empty/oversized/changed-size uploads; changed actor/input during async upload; metadata tampering, wrong years, original-content mismatch and recheck recovery.
- Stale/tampered evaluations and rehashed-but-unanchored evaluation refusal.
- Maintainer-only Pack release, reviewer-only exception decisions and final attestation, hard-failure refusal, rejection, stale decision isolation and duplicate attestation refusal.
- Reproducible draft/attested JSON, unchanged output after unrelated audit events, document hash parity, stale input/mismatched original/altered attestation/inactive reviewer export refusal.
- Audit payload tampering, event removal/reordering and changed head; broken-chain action/export refusal.
- All six route renderers, escaping, read-only rendering and UI action dispatch through register/evidence/evaluate/release/attest/export.
- Independent storage namespace, schema rejection, removed-domain absence and no remaining contract dependency.

`bash tests/run.sh` checks Core/UI/test syntax, the assertions, local HTML/doc references, prohibited network/secret patterns and whitespace. CI runs it on Node.js 20. No timing threshold is imposed.

## Verification limits

The UI tests use Node DOM stubs, not an actual browser. A real-browser attempt was blocked by the Cloud Browser URL policy for local file URLs; no alternate browser workaround was attempted. They do not establish layout, actual file dialogs, real node replacement or download completion. There is no live field dataset, external verification, original-file storage or concurrent-client claim. The previous mixed-domain rendering benchmark does not describe this rewritten UI and was removed.
