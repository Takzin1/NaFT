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

Added: compiler_runs (input/Pack/draft snapshots with owner/hash), compiler_decisions (reviewer, accepted judgement codes, note, input/Pack hashes), compiler_attestations (immutable document/hash). All are audit-bound. Three demo roles: operator, reviewer, maintainer.

Run IDs and audit timestamps may vary. They are outside the pure draft hash. Supplying a different human decision or supersedes reference is a different input and deliberately changes the Package hash. The legacy AG-005 path retains its historical ID/time behavior.
