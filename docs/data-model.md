# Data model

## Versioned Methodology Pack

Required fields: methodology_id, methodology_version, rule_pack_version, effective_from, effective_to, source_url, source_hash, source_checked_at, status, parameters, evidence_requirements, rules, calculation_spec, exceptions, unsupported_conditions. Keys are exact `id@version`, never “latest”. Registry entries are deep-frozen copies. Unknown official data is explicit and blocks successful compilation.

## Compiler input

A Claim is one Activity (id, field_id, farmer_id, program_id, methodology id/version, start/end, type and declared observations), Field metadata, raw Evidence records, optional known peer activities and parameter overrides. Dataset provenance is public / synthetic / derived. Shipped Corpus data are all synthetic; no real farmer data.

Evidence carries id, category, adapter, content string or byte array, expected_hash, activity/field identity, methodology version, period, source and provenance. SHA-256 covers original bytes. JSON adapters preserve parsed JSON in normalized_data; text/photo bytes stay opaque. Manifest hash binds metadata, content hash and parse/binding checks. Methodology migration derives a new manifest binding only for previously matching evidence versions; original inputs remain in the old run.

## Package and graph

Envelope: `{package_hash, document}`. Hash is SHA-256(canonical JSON(document)), excluding the envelope's own hash. The document includes methodology/rule version, source, Pack hash, Field/Activity identity, evidence manifests, calculation inputs and result/status, exceptions, optional human decision, graph reference plus full graph, input fingerprint and unresolved items. `formal_certification=false`; certified result is null. Synthetic arithmetic_preview is an experimental index.

Graph IDs are typed and deterministic. Edges point dependency to dependent. Review node identities bind decision content. Successor packages retain a supersedes edge to the previous hash. Sorting makes graph construction independent of evidence input ordering. No graph database.

## Stored arrays

Existing: users, programs, farmers, fields, activities, evidence_manifests, evidence_content_checks, evaluations, exception_decisions, pack_releases, attestations, audit_events.

Added: compiler_runs (input/Pack/draft snapshots with owner/hash), compiler_decisions (one record per exact exception: claim_id, run_id, exception_code, input_fingerprint, pack_hash, reviewer, reason, decision, decision_hash), compiler_attestations (immutable document/hash). Decision values are `ACCEPT / REJECT / NEED_MORE_EVIDENCE / ABSTAIN`. All are audit-bound. Three demo roles: operator, reviewer, maintainer.

Run IDs and audit timestamps may vary. They are outside the undecided pure draft hash. Supplying an explicit Human Decision set or supersedes reference is a different compilation input and deliberately changes the Package hash; the same input, same Pack and same explicit decision objects reproduce the same Package hash. The legacy AG-005 path retains its historical ID/time behavior.

## Evidence Intelligence session arrays (optional, created on first use)

- `ei_runs`: `{id, owner, label, factor_registry, claim_inputs, state_digest, records:[{claim_id, record_hash, status}], engine_audit_head, engine_audit_entries, supersedes, change, change_hash, engine_version, calculation_engine, formal_certification:false, run_hash}`. No derived state is stored; reads rebuild and compare.
- `ei_decisions`: `{id, run_id, run_hash, claim_id, record_hash, exception_code, reviewer, reason, decision, decision_hash}`.
- `ei_attestations`: `{id, run_id, claim_id, document, package_hash, attestation_hash}` where `document` is `naft-ei-attested-research-package-1` with the grounded report, decisions, Pack release and an explicit non-certification boundary.
- `ei_anchors`: `{id, run_id, run_hash, label, attestation_ids, anchor, call_plan, chain_status:'NOT_SUBMITTED', record_hash}`.

Each is paired with an `audit()` event (`ei_run`, `ei_decision`, `ei_attested`, `ei_anchor`). Older snapshots without these arrays load unchanged.

## Evidence Intelligence schemas (additive)

None of these replace the Package above. They are produced by `src/evidence-intel-*.js` from the same Claim input and are not stored by the session layer yet.

- `naft-evidence-intel-state-1`: `{shared, packs, factor_registry_hash, claims, aggregates}`. Each Claim holds its canonical input, typed nodes `{id, kind, op, args, deps:[{role,id}], value, vh}`, evaluation order, `record_hash`, `semantic_hash`, evidence revision lineage and superseded record history. States are immutable by contract and structurally shared.
- `naft-evidence-intel-record-1`: methodology/source, `input_merkle`, evidence manifest hashes, parameters, coefficient versions, evaluation (checks, rules, requirements, issues, status), calculation (operation, values, `exact`, `arithmetic_preview`, unit check, trace, `result: null`), `semantic_hash`, `formal_certification: false`, `certified_result: null`.
- `naft-evidence-graph-1`: nodes `{id, kind, hash, scope}` and edges `{from, to, type}`, dependency → dependent.
- `naft-evidence-intel-delta-1`: change, `change_hash`, counts and per-Claim `SEMANTIC_CHANGE / PROVENANCE_ONLY / NO_OP` with changed leaves, recomputed, cut-off, added and removed nodes.
- `naft-evidence-report-1`: statements `{id, section, kind, text, values, numerals, grounds:[{node, hash}]}`, boundary (`is_ghg_inventory: false`, `is_credit_certification: false`), lineage, unresolved items, `report_hash`.
- `naft-explanation-sidecar-1`: `authoritative: false`, `affects_calculation: false`, generator, cited statements, validation result, `sidecar_hash`. Never part of a record, report or Package hash.
- `naft-evidence-intel-audit-1`: `{entries:[{seq, type, subject, payload, payload_hash, actor, at, previous_hash, entry_hash}], head}` with types `INPUT / CALCULATION / VERIFICATION / CHANGE / REPORT / EXPLANATION`.
- Coefficient entry: `factor_id, version, value (decimal string), unit, unit_label, status (SYNTHETIC / REFERENCE / CONFIG_REQUIRED), effective_from, effective_to, source_url, source_hash, source_checked_at, supersedes`. Only `SYNTHETIC` entries are executed.
- Optional Pack fields used only by the engine: `accounting_context`, `supersedes`, parameter `factor_ref`, decimal-string parameter values, `calculation_spec.operation: "expression"` with `expression`, `unit_dimensions`. The legacy compiler fails closed on them.
