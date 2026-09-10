# NaFT for IEEE ClimateChain Hackathon

## One Auditable Path

NaFT turns fragmented climate evidence into a human-reviewed, hash-linked candidate environmental record and tracks the lifecycle of demo climate units through issuance, transfer, retirement, and double-counting prevention.

Local project operators hold photos, spreadsheets, plans and sensor summaries in different places. Reviewers need to know which evidence and human decision support a claim, then prevent the same reviewed input from generating two demo balances.

## Four-minute demo (240 seconds)

Use `naft-app.html#/ieee`. A normal browser starts fresh on reload (memory-only storage); an Artifact environment may persist data. The default solar scenario `pj9` starts pending review. The existing `pj1`/`pj2` records are clearly seeded examples; no candidate units or transfers are pre-issued.

| Time | Stage | Exact action / visible result |
|---|---|---|
| 0:00–0:20 | 1. Evidence / problem | Show **One Auditable Path**, fragmented field evidence and the Candidate / Simulation boundary. |
| 0:20–1:00 | 2. Deterministic MRV Readiness | Click **1. Project Operator**, then **Run Deterministic MRV Readiness**. Show `NEEDS_REVIEW`, draft evidence, completeness and methodology checks. Optionally select the missing-evidence scenario, run it to show `ABSTAIN`, then return to solar. |
| 1:00–1:35 | 3. Human Review | Click **2. Human Reviewer**. Inspect evidence metadata and activity/methodology details. Enter a human-authored review note in **Human review note / ABSTAIN override reason**; click **Human: approve evidence**. No approval occurs just by running checks. |
| 1:35–1:55 | 4. Verified Environmental Record | Show the named reviewer, decision, SHA-256 input fingerprint and previous record hash. “Verified” means human-reviewed within this prototype, not certification. |
| 1:55–2:20 | 5. Candidate Climate Unit | Click **Issue Candidate Unit**. Show total / available / retired and `candidate_not_formally_issued`. The quantity is the approved operator estimate, not independently verified abatement. |
| 2:20–2:45 | 6. Transfer | Default **From: Demo operator**, **To: Demo partner**, full available quantity. Click **Record demo transfer**. The sender loses custody, partner gains it, aggregate available remains unchanged. |
| 2:45–3:15 | 7. Retirement | The source now defaults to Demo partner. Type a reason, e.g. “Remove this simulated claim from the demonstration balance.” Click **Human: retire candidate quantity**. Show available 0, retired total, `fully_retired`. |
| 3:15–3:40 | 8. Double-counting Block | Click **Try retired-unit transfer → BLOCKED**. Show `RETIRED_UNITS_CANNOT_BE_REUSED`. Click **Try duplicate issuance → BLOCKED** to show `DUPLICATE_ISSUANCE_BLOCKED`. Expand **Inspect provenance, transfer ledger, and blocked attempts**. |
| 3:40–4:00 | Message | Deliver the two sentences below, with the guard-scope qualifier. |

NaFT does not decide whether climate action is real.

It makes the evidence, human decision, candidate unit lifecycle, and retirement traceable — and blocks the same claim from being counted twice.

Scope qualifier: identical environmental record or canonical input in this demo dataset. It does not discover semantically overlapping claims or duplicates across registries.

## ABSTAIN branch

Select `pj10`, sign in as Project Operator, click **Operator: submit for human review** and run readiness. Switch to Human Reviewer. A short override (under 20 trimmed characters) is blocked; only a human's explicit sufficiently long explanation can approve. The length gate records accountability; it does not establish the substantive adequacy of the justification. Issuance also requires a positive finite quantity, vintage and methodology reference. Do not present missing evidence as verified emission reductions.

## Prototype Boundary

- Candidate Climate Unit — Simulation only — Not a formally issued carbon credit.
- Retirement in this prototype means permanent removal from the demo candidate-unit balance. It is not a formal carbon-credit retirement in any external registry.
- Deterministic Verification Assist / Deterministic MRV Readiness Engine: no AI model or emissions-truth engine.
- Hash-linked provenance prototype / tamper-evident design direction. SHA-256 is not a signature, blockchain connection, or protection against complete local state replacement.
- Fixed demo custody accounts only. No connection to citizen points, wallets, money, tokens or external registries.
- `contracts/` is a **Future testnet extension**, unconnected to this demo.
- Browser roles are demo identities. Server enforcement, durable transactions and cross-client duplicate guards remain future work.

## Repository metadata suggestions

Description: Human-in-the-loop climate MRV and candidate environmental-unit provenance prototype for the IEEE ClimateChain Hackathon.

Topics: `climate-tech`, `mrv`, `carbon-accounting`, `climatechain`, `human-in-the-loop`, `provenance`, `hackathon`.

These are documented suggestions; repository metadata is not changed by the application.

## Optional methodology-aware extension

The four-minute generic flow above is unchanged. A separate `#/primary-mrv` screen demonstrates AG-005 reference checks, actual-byte evidence manifests, field/activity identity, human-reviewed candidate drafts, audit-chain verification and draft Monitoring Package JSON. Use the [separate scenario](primary-industry-mrv.md#methodology-aware-demo) after the IEEE demo; do not attempt to squeeze both demonstrations into the same four minutes.

AG-005 drafts do not feed IEEE unit issuance. They retain CONFIG REQUIRED and do not calculate an officially usable reduction quantity. The audit function now chains new generic and methodology events, while preserving the original historical entries through a disclosed legacy anchor.
