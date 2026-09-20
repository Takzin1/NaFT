# Research scope and implementation status

## Implemented research baseline

The branch is an MRV-only prototype with a version-pinned reference Pack, evidence byte hashes and manifests, identity/overlap guards, deterministic checks/arithmetic, exception routing, Pack release approval, one final package attestation, auditable provenance and repeatable structured export.

## Unresolved research questions

| Question | Present evidence | Not implemented / not demonstrated |
|---|---|---|
| Can a package retain meaning when a methodology changes? | Exact rule/version/hash snapshots | Cross-version equivalence, diff impact, selective re-evaluation |
| How much human work can be limited to exceptions? | Conflict routing, hard failure refusal, single normal-case attestation | Field-measured exception frequency, review time and error costs |
| Can heterogeneous source material be made reproducible? | File-byte manifest and declared metadata | Semantic adapters, parser validation, original retention |
| Can independent verifiers replay a package? | Canonical JSON and pinned local provenance | Official format mapping, external-verifier acceptance, independent witness |
| Can regional programs aggregate safely? | Scoped grouping and unique-field area | Concurrent transactional updates, real tenant isolation, verified field identity |

This document distinguishes research questions from delivered features. It is not a commitment to production readiness or institutional acceptance.
