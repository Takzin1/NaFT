# Test report — IEEE candidate lifecycle

## Results

Baseline at `fe70f544436b520fceb9ef03f3ffc4adb894465f`: **63 passed, 0 failed**.
Final local run (2026-09-08): **137 passed, 0 failed**; **74 added assertions**.

```
syntax: OK
RESULT: 137 passed, 0 failed / tx=11, audit=15
security and whitespace: OK
```

Run `bash tests/run.sh` (Node 18+ and Python 3, no dependency install). It extracts the seven HTML script blocks, runs `node --check`, executes all smoke assertions and checks prohibited network/secret patterns, tracked environment files and whitespace. CI additionally checks committed whitespace. CI status for the pushed commit is recorded in PR #1, rather than predicting a workflow result in this report.

## Existing coverage retained

All 63 baseline cases remain: public pages, IEEE landing, seeded readiness runs/records, deterministic assessment and stale input, citizen login/wallet/support/rewards/reservations, producer submission, human review and ABSTAIN override rejection, region/platform dashboards, audit/transaction pages, QR redemption, CSV, registration and initial grant.

Only three baseline expectation values change with the requested interface: five → eight stages, AI disclosure → Deterministic Verification Assist, and 16 → 64 hexadecimal record-hash characters. Their assertions are retained, not removed or skipped.

## Added coverage (74 assertions)

- Standard SHA-256 known vectors (empty/abc/Unicode/multiple blocks), canonical key order and delimiter ambiguity, Web Crypto equality with the offline fallback, evidence-order stability, input fingerprint independent of local project ID.
- Activity dates, actor and location changes invalidate prior readiness; stale human approval and stale issuance are blocked.
- Approval required before issue; citizen cannot approve; readiness cannot issue; canonical record integrity; changed approved quantity rejected.
- Concurrent issue allows one unit; duplicate record and same input under another record blocked; fully retired claim cannot be reissued.
- Transfer updates both holders, preserves aggregate available, hashes the full transfer, rejects zero/negative/NaN/infinite/overprecision/overavailable quantities, invalid holders and former-holder double spending.
- Retirement requires scoped human action, positive quantity and reason; partial and full retirement preserve integer-millionth conservation; overavailable retirement, retransfer of retired quantity and full-retirement reuse are blocked.
- Successful and rejected operations produce the expected audit logs; lifecycle transactions render simulated t-CO2, never points; malicious reason text is escaped; disclaimers and guard messages render.
- ABSTAIN short reason rejected; explicit long human override accepted; v2 migration preserves legacy fingerprints, marks them stale and adds empty lifecycle collections.
- The **actual generated IEEE button handlers** are executed in the DOM-stub harness: operator role → readiness → reviewer role → human approval → issue → transfer → retirement → retired reuse blocked → duplicate issue blocked.

The last scenario reseeds the database. The final `tx=11, audit=15` counts describe that scenario, not cumulative counts across every test.

## Verification limits

These are Node smoke tests using a minimal DOM stub, including handler-binding checks. They are not actual browser E2E tests. Cloud Browser rejected localhost and file URLs under its URL policy; browser layout and real clicks were not verified. No workaround was used. The 240-second demo script is provided but no timed live rehearsal is claimed.

`contracts/` was source-reviewed. `CarbonMarketplace` now inherits OpenZeppelin `ERC1155Holder`, addressing missing receiver support. Solidity compilation, deployments and contract tests were not run; the contracts are an unconnected Future testnet extension.

Production security, concurrent clients, external persistence and global semantic/cross-registry duplicate detection remain outside this prototype. See `known-limitations.md`.
