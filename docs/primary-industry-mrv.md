# Primary Industry MRV Infrastructure — implementation notes

NaFT transforms evidence from primary-industry activity into a human-reviewed candidate record and a draft Monitoring Package. It does not create environmental value, certify reductions, issue J-Credits or submit to an external registry.

## Starting-point audit (2026-09-10)

Repository: Takzin1/NaFT. Default branch: main. PR #1 was already merged by the repository owner; this work starts from main `3c4008c3427938b313cb2a752b558fee2b7ce2e1`. Its application tree matches the IEEE branch `6f7717da6e737c946b9b09e073a2dfc1ebd4e7fa`. No open PR existed at the audit. Baseline: 137 passing assertions.

| Classification before this change | Facts |
|---|---|
| A. Implemented | Generic deterministic readiness, stale checks, explicit human review, hash-linked candidate environmental records, simulation unit issuance/transfer/retirement, local exact-input duplicate guards, 8-stage IEEE route, CI. |
| B. Partial | Provenance hashed metadata, not evidence bytes. Client-only role/duplicate checks; no multi-client isolation. Audit events existed without a verifiable audit chain. Solidity receiver source fix existed, but contracts remained unconnected and uncompiled. |
| C. Concept only | AG-005 rules/calculation, field identity, content manifests, audit verifier, Monitoring Package, Program aggregation. The Mitou concept still centered on citizen participation. |

Reviewed: AGENTS.md, maintenance skill, README, index redirect, application, tests, docs, contracts and GitHub Actions. No Solidity features or framework migrations were added.

## Official-source register and fail-closed decision

Checked on 2026-09-10:

- [e-Gov AG-005 v3.1 reference PDF](https://public-comment.e-gov.go.jp/pcm/download?seqNo=0000281460), especially pp. 1–5: period and applicability rules; equations 1, 2 and 4.
- [MAFF original AG-005 publication](https://www.maff.go.jp/j/press/kanbo/b_kankyo/attach/pdf/230301-2.pdf): historical v1.0, not used as the latest version.
- [MAFF agricultural J-Credit simulator](https://www.maff.go.jp/j/kanbo/kankyo/seisaku/climate/jcredit/241226.html): explanatory simulation, not a replacement for monitoring and verification.
- [J-Credit methodology index](https://japancredit.go.jp/about/methodology/): retrieval returned HTTP 403 in this environment. Current adopted status could not be established. An official-domain public-comment attachment does not establish final adoption.

The shipped pack is therefore **`3.1-reference` / `naft-ag005-0.1`**, with `current_version_verified:false`. It is a reference-snapshot prototype, not an implementation claiming current J-Credit compliance. No emission factor or methane GWP default is invented. The pack is not remotely updated and requires source-controlled review to update.

Implemented reference arithmetic: inclusive drainage days, ending before heading; mean over crop cycles in at least two recent pre-project years, rounded upward; extension compared with the reference seven-day threshold. The prototype requires consecutive baseline years ending before the project's first year. It checks one project crop per annual activity; land consolidation/merge/split special cases fail closed as NOT IMPLEMENTED. This is a subset of the methodology, not an exhaustive eligibility determination.

Calculation Assist records inputs, formula, rule/calculation versions, warnings and missing parameters. Its equation is `A × (EF_baseline − EF_project) × 16/12 × GWP_CH4 × 0.001`, with area in ha and factors in kg-CH4-C/ha/year. Missing, invalid or nonfinite parameters are rejected. Supplied parameters can produce an explicitly labeled arithmetic preview; the reduction `result` remains `null` and status remains CONFIG REQUIRED until adopted methodology and coefficient applicability can be established. Synthetic unit-test coefficients are not production defaults.

## Methodology-aware demo

Open `naft-app.html#/primary-mrv` (also linked in public, producer and platform navigation).

1. Click **1. Project Operator**. Expand the registration JSON. The example is synthetic: one 5 ha field, two historical crop periods and a current period. Edit names, field ID and dates to create other farmers/fields. Register an activity draft.
2. Run AG-005 readiness before evidence to show **MISSING**. For real operator-provided files, choose the evidence type/year, select a file and give its source. **Hash selected file** reads bytes, not the filename. Files stay on the user's device.
3. For a presentation, **Add SYNTHETIC demo evidence** generates explicitly labeled text bytes for each missing inventory category and hashes them. It creates no human decision and proves no field observation. Re-run readiness: **REVIEW**, with reference checks and **CONFIG REQUIRED** visible.
4. Click **2. Human Reviewer** (platform demo account). Inspect original evidence outside the application, the inventory and warnings. Enter at least 20 characters acknowledging unresolved configuration and synthetic inputs where applicable. **Human: approve draft** creates a candidate record. Reject persists a rejection and requires a new readiness run before another decision.
5. **Export Monitoring Package JSON** downloads an `incomplete_reviewed_draft`. It includes missing parameters and never claims external verifier acceptance. The candidate record is inspectable on screen if download is restricted.
6. **Try duplicate record → BLOCKED** needs no retyped note after approval. **Verify audit chain** displays VALID; modified local events display BROKEN. No destructive tamper button is shipped; automated tests inject alterations.
7. Return to **IEEE: One Auditable Path** for the unchanged generic unit lifecycle. AG-005 candidate drafts do not feed that issuance endpoint.

The evidence inventory required by this prototype includes a baseline record per year, project record, start/end evidence, heading record, area record and sustainability record. These categories are NaFT's demonstration checklist, not a claim to enumerate all legally required documents. File content is not parsed. A human must verify that its declared category, dates, area and actor actually match the evidence.

## Domain and security boundaries

- Programs have operator owners; farmers belong to programs, fields to farmers, activities to fields, manifests to activities and candidate records to reviewed activities. Reusing a field across crop years does not add its area twice. Tests instantiate 100 farmers / 100 fields / 500 ha; this is a model test, not a concurrent-load benchmark.
- Field identifiers are NFKC-normalized and trimmed at registration. Exact field/method/activity identities and overlapping dates under the same field/method/activity are blocked across the current dataset. Farmer names do not establish legal identity. Field aliases, geometries, different methodologies and different datasets/registries are not reconciled.
- New methodology actions require an active stored user and matching session role. Producers operate owned programs; platform/super admins review. Regional administrators are not authorized for this new cross-region prototype. Client checks do not resist DevTools or state replacement.
- Evidence SHA-256 binds bytes, and a separate manifest hash binds metadata. No file body is persisted; maximum read size is 5 MiB. Reselection produces MATCH/MISMATCH and an audit event. An unresolved MISMATCH fails readiness and blocks export; a matching original resolves it. Original authenticity, capture time and physical activity remain human/external checks.
- Readiness hashes its snapshot and result. Human approval rejects stale or altered runs, FAIL/MISSING, short reasons and repeated decisions. Approved activities do not accept new attachments. Amendments/corrections are not implemented. CONFIG REQUIRED may be acknowledged only as a reviewed draft; it does not become PASS through approval.
- Audit migration preserves historical entries unchanged and hashes them as a legacy anchor. New events bind predecessor, sequence, actor, action, target, note digest and timestamp. `verifyAuditChain()` verifies ordering, count, legacy bytes and head checkpoint. A broken chain blocks new methodology actions/export. Historical truth and independently witnessed timestamps are not established.
- Monitoring Package contains the reviewed snapshot, inventory/hashes, rule source, eligibility, calculation, human decision, unresolved items, audit reference/current verifier result and candidate hash. It omits unrelated users' audit history. Independent audit proof verification requires the source dataset; a portable selective proof is future work.
- All hashes/checkpoints remain in one locally replaceable JSON document. A coordinated rewrite can recompute them. Existing generic IEEE actions record chained events but are not retrofitted with the new methodology module's broken-chain action gate.

## Social implementation hypothesis

Small farms may struggle to connect drainage extension, biochar and other environmental activities to additional income because evidence organization, calculations and review preparation carry administrative costs. NaFT's role is to reduce the transaction cost of turning activity evidence into data a verification process can consume. Income, demand, cost savings and verifier acceptance have not been demonstrated.

For Saitama, the Program model makes a regional operator's coordination of farmers and fields demonstrable. For INACOME, the same model frames a rural-income pathway without promising monetization. Biochar/AG-004 remains future methodology work. No contest eligibility, selection likelihood or current application requirements are asserted here.

## Visibility and navigation (2026-09-13)

The selected field now shows six progress cards, category completeness, drainage-day comparison, failed checks and the next required human action. The Program work queue searches field, farmer, program and year, and filters saved workflow states. Its counts describe saved runs; selecting an activity checks current input and record hashes. There is no claim that the overview has freshly verified every field.

Activities and evidence use ten-row pages. The original-file recheck selector follows the evidence page. **Inspect** opens only the selected record, calculation, or current page of manifests; closed JSON is not generated. Field selection resets field-specific drafts. Within the same user/field, paging and inspection preserve review text and selected file input nodes.

**Verify audit chain** performs the explicit full verification. The displayed status includes its time and says it is a historical result, not a live verdict. Mutating methodology actions and Monitoring Package export still recheck the full chain, independent of the displayed status. See [measurement and constraints](mrv-visibility-performance.md).
