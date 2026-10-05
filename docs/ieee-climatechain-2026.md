# NaFT for IEEE ClimateChain Global Hackathon 2026

## Project thesis

**Carbon markets need evidence that survives methodology change.**

NaFT is a version-aware MRV evidence compiler. It binds evidence to an exact methodology version, constructs a dependency/provenance graph, and determines which claims require re-verification when methodology, evidence, parameters, field data or activity data change.

The ClimateChain branch adds a minimal blockchain provenance witness for the resulting versioned MRV packages. The chain is not used to decide climate truth.

## Track fit

Primary submission framing: **Carbon Markets & Emissions Transparency**.

Problem addressed:
- environmental evidence is fragmented;
- verification state can become stale when methodologies or evidence change;
- re-checking every historical claim is wasteful, while missing a materially affected claim is unsafe;
- provenance needs an external, independently inspectable witness without pretending that a ledger itself validates climate impact.

## 3–5 minute demo path

1. Open `naft-app.html#/climatechain`.
2. Explain the synthetic methodology transition `NAFT-SYNTHETIC@1 → @2`.
3. Click **Run 100-claim methodology update**.
4. Show the computed result:
   - 100 candidate claims;
   - 30 require re-verification;
   - 70 unaffected;
   - 15 automatically re-evaluated;
   - 15 require new evidence.
5. Open the representative lineage and show why the claim changed.
6. Click **Prepare blockchain anchor plan**.
7. Show the genesis package hash followed by the successor package hash and exact previous-package linkage.
8. Explain that the smart contract rejects duplicates, missing parents and forks.
9. Close with the engineering evidence: deterministic tests, independent full-recomputation oracle and browser CI.

## Architecture

```text
Raw / structured evidence
          |
          v
Versioned Evidence Compiler
          |
          v
Dependency + provenance graph
          |
          v
Methodology / evidence / parameter change
          |
          v
Selective impact analysis
      /             \
re-verify         unaffected
    |
    v
Successor MRV package
    |
    v
NaFTMRVAnchor
(package hash + methodology hash + previous package hash)
```

## Why blockchain is minimal

The contract stores only the information needed to witness package lineage:

- `claimIdHash`
- `packageHash`
- `methodologyHash`
- `previousPackageHash`
- submitter
- block timestamp

The contract intentionally has no token, marketplace, payment or carbon-credit issuance path.

## Evaluation already present in NaFT

The underlying research prototype retains:

- 36 labeled synthetic conformance cases;
- deterministic calculation and re-evaluation checks;
- a 100-claim synthetic methodology-transition workload;
- an independent full-recomputation semantic oracle over 614 deterministic adversarial changes;
- current tested matrix: TP 429 / TN 78 / FP 107 / FN 0.

These numbers are engineering results within the explicitly tested synthetic state space. They are not field accuracy, measured runtime savings, verifier acceptance or proof for all institutional methodologies.

## Before submission

Verify the final Devpost fields, deadlines, track wording and video requirements against the live challenge page. If a real testnet anchor is added, record the chain ID, deployed contract address, transaction hash, compiler version and exact source commit here and in the Devpost submission.
