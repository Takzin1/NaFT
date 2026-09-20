# IEEE ClimateChain Hackathon — Frozen Build v1.0

Frozen source commit: 6f7717da6e737c946b9b09e073a2dfc1ebd4e7fa
Branch: release/ieee-climatechain-2026
Requested tag: ieee-climatechain-v1.0 (not published: the available connector has no tag-creation action, Git push lacks credentials, and the browser requires a separate sign-in). The branch and full commit SHA above are the published frozen source references.

This release preserves the existing IEEE ClimateChain Hackathon build without adding or changing application code.

Evidence → Deterministic Verification Assist → Human Review → Candidate Environmental Record → Candidate Climate Unit → Demo Transfer → Demo Retirement → Double-counting guards.

Boundary: Simulation / Demo / Off-chain / Not formally issued.
External registry未接続。production MRVではない。No formally issued carbon credits, certified emissions reductions, real credit transfer/retirement, financial settlement or blockchain integration.

Double-counting guards cover the identical record or canonical input within the demo dataset, duplicate issuance and reuse of retired demo balances. They do not establish cross-registry or concurrent-client uniqueness. Human review is mandatory. SHA-256 links provenance but is not a signature or an independent audit witness.

Reproduce from a clean checkout of the commit above with Node.js 18+ and Python 3:

    git switch --detach 6f7717da6e737c946b9b09e073a2dfc1ebd4e7fa
    bash tests/run.sh

Release audit: Node.js v24.19.0; 137 passed / 0 failed; syntax, security and whitespace checks passed. Original commit GitHub Actions push and pull_request runs succeeded. Open naft-app.html#/ieee for the demo. Tests use a Node DOM stub; actual browser interaction and layout are not verified by this result. Optional QR rendering uses the existing CDN with a text fallback. No package installation or build step is required.
