# MRV Core data model

Root schema: `naft-mrv-core-1`. Storage key: `naft_mrv_core_v1`.

| Collection | Contents |
|---|---|
| users | Active demo operator, reviewer and maintainer identities |
| programs | Name, owner_user_id |
| farmers | Name, program_id |
| fields | Normalized field_id, farmer_id, program_id, area_ha, region |
| activities | Program/farmer/field references, exact methodology/version, activity/crop/start years, periods, drainage, declarations, calculation parameters |
| evidence_manifests | Actual-byte SHA-256, size, original filename, source, period, field/activity IDs, methodology/version, rule_pack_hash, adapter_version, metadata hash |
| evidence_content_checks | Reselected-byte hash, MATCH/MISMATCH, actor/time, check_hash |
| evaluations | Frozen input/rule snapshot, deterministic result, exceptions, versions, fingerprint, evaluation_hash, historical audit anchor |
| exception_decisions | Evaluation ID/fingerprint, exception ID, accept_with_reason or reject, reviewer/reason/time, decision_hash |
| pack_releases | Exact pack_hash, maintainer/rationale/time, prototype-only scope, release_hash; official_adoption_confirmed=false |
| attestations | Activity/evaluation reference, fingerprint, immutable document, package_hash, attestation_hash |
| audit_events | Sequence, predecessor hash, actor/action/target/payload/time, event_hash |

`audit_head` is checked against the entire sequence, including event payloads and order. No legacy audit anchor is imported. Empty chain begins with SHA-256 of canonical `[]`.

Program → Farmer → Field → Activity → Evidence / Evaluation → Exception decisions → Attestation. Field area is aggregated once per field, not once per crop year. Duplicate matching uses normalized field ID, methodology, activity type and exact or overlapping period. It does not establish cadastral identity.

Runtime-only UI state: selected activity, route, evidence page, inspection and status message. It is not persisted. File input nodes are retained for evidence-only view toggles; actual file bodies are not stored.

The static Methodology Registry contains one frozen AG-005 `3.1-reference` descriptor. Evidence, evaluation and packages carry the descriptor/version/hash. There is no remote registry sync or arbitrary Rule Pack upload/execution.

Monitoring Package statuses: `draft_incomplete_configuration` and `attested_incomplete_configuration`. Both disclose formal_verification=not_performed and calculation.result=null. The latter includes a copied human attestation and Pack release record. Canonical exports do not add a new timestamp per download.
