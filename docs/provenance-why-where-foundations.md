# NaFT provenance foundations — Why / Where (research extension v0.1)

## Research sources (metadata only)

- Buneman, Khanna & Tan (2001), *Why and Where: A Characterization of Data Provenance*, DOI: https://doi.org/10.1007/3-540-44503-X_20. Uploaded Edinburgh peer-reviewed version: why vs. where, witness basis, minimal witnesses; relevant PDF pp. 2–3, 9–15.
- Cheney, Chiticariu & Tan (2009), *Provenance in Databases: Why, How, and Where*, DOI: https://doi.org/10.1561/1900000006. Uploaded author version: why/how/where, query-rewriting sensitivity; relevant PDF pp. 3, 7–13, 41–43, 65–67.

Registry: research/literature-2026-11-08/provenance-foundations.json. Its SHA-256 hashes are for **user-uploaded local PDF bytes**, not authenticated publisher originals. Copyright and redistribution permission remain with rights-holders. Do not commit the PDFs or extracted figures.

## Implemented scope

Read-only sidecar: src/provenance-why-where.js. Load after mrv-core.js, methodology-packs.js and mrv-compiler.js.

- explainCompilerProvenance(pkg, input, pack, outputPath): rejects stale/tampered Compiler packages, returns why-like **conservative graph ancestor lineage**, explicit direct-copy where origins for supported paths, and research-only evidence-completeness witnesses.
- compilerRequirementWitnesses(pkg, input, pack): enumerates minimal sets of verified/parsed/bound evidence records that fulfill the active **required evidence categories**, with alternative evidence tracked separately and a bounded combination limit.
- minimalProvenanceWitnesses(sets): removes duplicate and proper-superset witness sets (a finite-set helper, not a formal DQL interpreter).

Example using an existing synthetic compiler package:

    const input = syntheticClaim('DEMO-PROV');
    const pack = COMPILER_REGISTRY['NAFT-SYNTHETIC@1'];
    const pkg = compileEvidence(input, pack);
    const report = explainCompilerProvenance(
      pkg, input, pack, 'document.calculation.arithmetic_preview'
    );

## What the report means

- WHY (conservative dependency graph): every graph ancestor of the target Compiler node. This is **not** a full Buneman DQL or SQL/SPJU witness basis, nor proof that every listed node was essential.
- EVIDENCE WITNESSES: requirements satisfied by one or more evidence manifests; does not establish environmental truth, eligibility or correctness of formulas. Missing required evidence produces an empty witness set. Witness explosion fails closed.
- WHERE: source object path for an **explicit direct copy**, such as a field value or supplied Pack parameter. Calculated arithmetic previews return DERIVED_NOT_COPIED; unknown paths return UNSUPPORTED_COPY_MAPPING. Where provenance need not be invariant under equivalent rewrites.
- HOW: NOT_IMPLEMENTED. No provenance semiring, arbitrary query, rewriting or complete recursion semantics are asserted.
- Formal MRV certification: false. Certified quantity: null. No blockchain transaction or external provenance attestation.

## Regression

    node tests/provenance-why-where.test.js

Also executed from tests/run.sh. The tests check direct-copy mapping, source mutation rejection, calculation not mislabeled as copied, alternate/minimal evidence witnesses, missing evidence, bounds, and two-source metadata.

## Change boundary and follow-up

No modifications to the Compiler's package hashes or AG-005 reference code. The sidecar uses the pre-existing provenance graph and passes its scope/limitations along with each explanation. To claim precise minimal dependencies or formal query-rewrite invariance, a separately specified relational/query evaluator with differential tests is needed. Do not conflate compiler dependency lineage with full database query provenance.
