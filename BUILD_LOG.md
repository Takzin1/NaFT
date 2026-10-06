# IEEE ClimateChain 2026 — Build Log

## Baseline

Hackathon work starts from the pre-existing NaFT research prototype at:

- Repository: `Takzin1/NaFT`
- Baseline commit: `11126e8c236cfec8479157a2c5cf79c2fd5d8c20`
- Baseline date: 2026-09-29
- Hackathon branch: `hackathon/ieee-climatechain-2026`

The baseline already contained the Version-aware MRV Evidence Compiler, methodology diff and impact analysis, selective re-verification, provenance graph, append-only successor packages, human-decision staleness guards, synthetic evaluation corpus, independent full-recomputation oracle, and browser reviewer demo.

## ClimateChain additions

Work added specifically on this branch:

1. **English ClimateChain demo route** — `#/climatechain`
   - runs the existing deterministic 100-claim methodology-change experiment;
   - explains the 30 re-verify / 70 unaffected result as fixture-derived, not a performance claim;
   - exposes representative package lineage and the `supersedes` relationship.

2. **Minimal blockchain provenance contract** — `contracts/NaFTMRVAnchor.sol`
   - anchors claim, package, methodology and previous-package hashes;
   - restricts lineage writes to the deployment wallet (`anchorWriter`), while keeping certification semantics off-chain;
   - rejects duplicate package hashes;
   - rejects missing parents;
   - rejects lineage forks against the current claim head;
   - does **not** mint, transfer, price, retire or certify carbon credits.

3. **Deterministic anchor-plan export**
   - prepares exact `bytes32` arguments for a genesis package followed by its successor;
   - browser status is explicitly `NOT_SUBMITTED` until a real transaction is independently sent;
   - no wallet, RPC endpoint or external API is called by the static demo.

4. **Judge-first ClimateChain presentation layer**
   - adds a real-world Japanese rice-paddy MRV reference context without claiming current institutional implementation;
   - adds project-aggregator / verification-operator / registry adoption roles;
   - makes the on-chain / off-chain trust boundary explicit;
   - surfaces the 614-case independent-oracle result with its synthetic-state-space limitation.

5. **Lineage hardening**
   - rejects a successor whose parent package belongs to a different claim;
   - retains duplicate, missing-parent and current-head / fork guards.

6. **Regression coverage**
   - Node tests cover impact counts, package lineage, real-world/context boundaries, adoption roles, anchor argument shape and contract guards;
   - real headless Chrome checks the English judge-first narrative, mobile overflow, calculated metrics and anchor-plan boundary;
   - branch-specific ClimateChain checks total 56 assertions on top of the 1165 baseline assertions.

7. **Testnet completion runbook**
   - documents the human-signed deployment and two-transaction lineage flow;
   - forbids claiming on-chain anchoring until chain ID, contract address and transaction hashes are actually recorded.

8. **Fail-closed testnet evidence record**
   - adds `src/climatechain-testnet-record.js` with explicit `NOT_SUBMITTED` / `VERIFIED_TESTNET` states;
   - rejects partial chain metadata while unverified;
   - requires complete network, contract, transaction, explorer, source-commit and timestamp evidence before verified status.

9. **Submission operations**
   - adds a final submission checklist;
   - adds a 4-minute judge-oriented demo script;
   - surfaces testnet evidence state and engineering proof in the first ClimateChain viewport.

10. **Final judging / submission package**
   - adds a Devpost-ready submission draft with safe claim boundaries;
   - adds a 15-question judge Q&A;
   - adds an exact-SHA submission freeze procedure;
   - switches the ClimateChain document language/title to English and compiles Solidity ABI + bytecode in CI.

11. **Web3 execution / verification layer**
   - adds a deterministic CLI that regenerates the same P1 → P2 anchor arguments as the browser demo;
   - adds a read-only public-RPC verifier for chain ID, contract bytecode, deployment and lineage transactions;
   - compares on-chain calldata with the exact four-`bytes32` NaFT anchor plan and verifies indexed event topics;
   - reconstructs both contract source and anchor plan from the recorded deployment commit, then verifies creation/runtime bytecode, function selector, full event signature/data, writer identity and final `headByClaim`;
   - adds a local mock JSON-RPC test where valid lineage passes and corrupted successor calldata fails closed;
   - derives contract / deploy / P1 / P2 explorer links only from a fully validated `VERIFIED_TESTNET` record.

## Submission boundary

NaFT is a research prototype. Synthetic methodology transitions and synthetic claims are used for the hackathon demo. An on-chain hash is an external provenance witness only: it does not establish observation truth, methodology eligibility, verified emissions reductions, registry acceptance or formal certification.

A real testnet deployment/transaction may be added later, but it must be recorded with chain ID, contract address and transaction hash before the project claims that a package is anchored on-chain.

12. **Executable contract security behavior**
   - executes `NaFTMRVAnchor` on a local Ganache EVM in CI;
   - verifies deployer-only writes, unauthorized successor rejection, duplicate rejection, fork rejection, cross-claim-parent rejection and final claim head;
   - terminates the Ganache process group explicitly so EVM checks cannot leave CI runners hanging.
