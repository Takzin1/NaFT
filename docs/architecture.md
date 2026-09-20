# Architecture — Version-aware MRV Evidence Infrastructure

## Runtime boundary

A build-free static application loads two local scripts: `src/mrv-core.js` and `src/mrv-ui.js`. There are no runtime packages, external scripts, external APIs or contract dependencies. The Core can execute independently of the DOM. Page functions return escaped HTML; use-case functions own mutations.

## Responsibilities

| Layer | Main functions / records |
|---|---|
| Methodology Registry / Rule Pack | `METHODOLOGY_REGISTRY`, `methodologyPack`, `approvePack`, `validRelease` |
| Evidence Adapter / Manifest | `attachEvidence`, `hashEvidenceBytes`, `verifyEvidenceContent` |
| Field / Activity Identity | `registerActivity`, `fieldIdentity`, `activityIdentity`, `activityConflict` |
| Deterministic Rule Evaluation | `snapshotFor`, `evaluateSnapshot`, `evaluateActivity`, `evaluationCurrent` |
| Deterministic Calculation | `calculateAG005`, pinned calculation version; illustrative arithmetic only |
| Exception Detection | blocking checks and conflicting evidence groups |
| Human Review | `decideException`, `attestPackage` |
| Provenance | canonical JSON, SHA-256, `audit`, `verifyAuditChain`, event-bound object hashes |
| Monitoring Package | `draftPackage`, `monitoringPackage`, `exportMonitoringJSON` |
| Program Aggregation | `programAggregate`, unique-field area and saved counts |

## Execution

Methodology → Evidence → Evaluation → Exception → Human Review → Monitoring Package. Evaluation constructs a snapshot-bound result. Draft construction is deterministic and requires no approval. A normal case proceeds straight to one final attestation. Judgement exceptions require a reason tied to the exact evaluation; hard failures cannot be waived. Pack release approval belongs to the pack lifecycle, not each activity.

Hash routes are `/methodologies`, `/evidence`, `/readiness`, `/exceptions`, `/review`, `/packages`; static hosting uses `#/…`. Unknown paths resolve to the methodology entry. No separate dashboard is needed: package view includes Program aggregation.

## Integrity

File bytes are copied before an asynchronous digest; actor, scope and snapshot are rechecked afterwards. Manifests bind content hash, period, methodology version, rule hash and adapter version. Assessment checks the binding and the attachment audit event. Evaluations, decisions, releases and attestations have their own hashes bound to audit events. Action and export gates recompute the full chain.

An attested document and its hash are frozen in the dataset. Export verifies live prerequisites, then returns the stored document. The output does not include a changing current audit head. Its historical anchors remain explicitly historical. Same saved input gives byte-identical canonical JSON despite unrelated audit additions.

## Storage / identity

`naft_mrv_core_v1` is an independent schema and storage namespace. No migration is implied. Artifact storage uses one JSON document; otherwise memory only. Three client demo identities: operator (own Program), reviewer (all demo activities), maintainer (Rule Pack only). These are prototype gates, not production authorization or tenant isolation.

[Limitations](known-limitations.md) · [Data model](data-model.md)
