# NaFT roadmap — Primary Industry MRV Infrastructure

## Implemented prototype

Generic IEEE evidence/readiness/human review/candidate record/unit transfer/retirement with local duplicate guards remains available at `#/ieee`. The separate `#/primary-mrv` adds AG-005 reference checks, actual-byte evidence hashes, field/activity identity, audit verification, reviewed draft Monitoring Package JSON and Program aggregation. See [implementation scope](primary-industry-mrv.md) and [test report](test-report.md).

## Partial / configuration required

The AG-005 pack references an official public-comment v3.1 document. Current adopted status and coefficient applicability are unconfirmed. Calculated reduction `result` stays null; supplied parameters can only produce an arithmetic preview. Land changes and a complete methodology implementation are absent. Draft package acceptance by a third-party verifier has not been demonstrated.

## Mitou research and development

1. Versioned multi-methodology rules (including AG-004), DSL/configuration and expert-reviewed coefficients/exception semantics.
2. Provenance graph, secure evidence storage and independent audit anchors.
3. Server-side authorization, tenant isolation, transactional uniqueness and concurrent balance/accounting guarantees.
4. Large Program aggregation, amendment/rejection workflows and cross-project/field-alias/geometry duplicate detection.
5. External verifier interface and conditionally authorized registry-adapter specification.
6. Quantitative evaluation and consent-based field PoC, using the KPIs in [Mitou concept](mitou-advanced-concept.md).

These are research/deployment requirements, not implemented features or commitments to issue credits. Framework/database choices remain open; a full Next.js/PostgreSQL migration is not part of this change. Blockchain, crypto, payments, tokenomics and autonomous certification are not objectives.
