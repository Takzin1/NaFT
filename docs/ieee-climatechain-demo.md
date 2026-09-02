# NaFT for IEEE ClimateChain Hackathon

## One-line proposition

**NaFT turns fragmented local climate-action evidence into a reviewable, hash-linked candidate environmental record without removing human accountability.**

## Problem and stakeholder

Local climate-action operators—small farms, forestry groups, community energy projects, and local businesses—hold photos, spreadsheets, plans, and sensor summaries in different formats. Municipal and regional-finance reviewers must check whether the activity, period, quantification, method, and evidence are complete while retaining an explainable decision trail.

The hackathon build focuses on that bottleneck. Citizen rewards and the wider NaFT economy remain in the repository, but the IEEE judging path is deliberately narrower.

## Implemented workflow

| Stage | System action | Output | Decision owner |
|---|---|---|---|
| Evidence | Receives project fields and evidence metadata | Review package | Project operator |
| Assist | Structures evidence descriptions and detects gaps | Summary, missing items, risk signals | Reference only |
| Verify | Runs deterministic checks | `READY_FOR_HUMAN_REVIEW`, `NEEDS_REVIEW`, or `ABSTAIN` | Rule engine cannot approve |
| Human review | Shows the package, original metadata, checks, and history | Approve, return, reject, suspend | Named human reviewer |
| Record | Links input fingerprint, final reviewer, and previous record hash | Candidate environmental record | Created only after human approval |

## What is real in this prototype

- Working project-operator MRV workbench.
- Six deterministic checks: actor/location, activity period, quantification, methodology, evidence set, and traceability.
- Risk detection for explicitly unfinished evidence such as “準備中” or “draft”.
- Stable input fingerprint for unchanged inputs.
- Automatic invalidation warning when project fields or evidence change after a run.
- `ABSTAIN` behavior when critical evidence is missing.
- Human-review override requiring a documented reason for an `ABSTAIN` case.
- Hash-linked candidate environmental records with named final reviewer and audit-log entries.
- Region-scoped and nationwide record views.
- English IEEE entry page at `#/ieee`.
- Dependency-free automated regression suite.

## Prototype boundary

This build does **not** perform payment, token transfer, formal carbon-credit issuance, transfer, or retirement. Evidence files are not uploaded; only their metadata is stored. The local assist engine is a deterministic demonstration adapter and does not call an external model. Record hashes are PoC identifiers, not cryptographic signatures or an on-chain ledger.

These boundaries are intentional: IEEE evaluation can inspect the complete evidence-to-decision path without confusing a hackathon prototype with a regulated market function.

## Four-minute judging demo

1. Open `#/ieee` and state the two stakeholders and the evidence bottleneck.
2. Click **Start as Project Operator**, open `営農型ソーラーシェアリング準備プロジェクト`, then open the MRV workbench. Show `NEEDS REVIEW`, the input fingerprint, and the unfinished permit evidence.
3. Sign in as `admin@naft.demo`, open project review, compare the assist output with evidence metadata, enter a human comment, and approve.
4. Open **検証済み記録**. Show the new `NAFT-ER-*` record, named reviewer, prior hash, and candidate-only disclaimer.
5. Run the workbench for `会津 雪室活用・低温貯蔵省エネプロジェクト` without evidence. Show `ABSTAIN` and that the project is not automatically approved.

## Success measures for a field pilot

- Median operator time to prepare a reviewable package.
- Missing-item detection precision and reviewer agreement.
- Reviewer time per project with and without the workbench.
- Rate and reasons for `ABSTAIN`, return, and human override.
- Percentage of decisions with a complete provenance trail.
