# NaFT Blue Carbon Edition Bridge v1 — read-only interoperability

NaFT Core consumes the externally generated research package from the public [Blue Carbon edition](https://github.com/Takzin1/NaFT_BlueCarbon_MRV_Edition). It does NOT fork or vendor the coastal calculation engine. The existing IEEE ClimateChain route and agricultural Methodology Packs remain unchanged.

## Run offline with Node 20+

In the Blue Carbon checkout, generate its normal CLI export:

    node src/cli.mjs > /tmp/bluecarbon-export.json

In the NaFT Core checkout, validate it and produce a portable, reduced receipt:

    node scripts/bridge-bluecarbon.mjs /tmp/bluecarbon-export.json > /tmp/naft-bluecarbon-receipt.json
    node --test tests/edition-bridge.test.mjs

This needs no network, credential, private key, wallet, original evidence file upload, or external npm package.

## Supported contract

- Input: the JSON object produced by the Blue Carbon v0.3.0 CLI with two keys, package and sourceProject.
- Source version: 0.3.0 and observation ledger 0.3.0. Supported methodology IDs and versions: NAFT-RESEARCH 0.1.0, JBLUE-REFERENCE 2.6, VM0033-REFERENCE 2.1. The latter two are reference labels, NOT executable institutional certification.
- Checks: research-only flags, project/claim identity, source-bound fingerprints, package SHA-256, evidence links, independent illustrative estimate arithmetic, carbon-stock and CH4/N2O observation arithmetic, and aggregate total.
- Output: normalized bridge receipt with version, reference methodology, claim fingerprints, research estimates and verification states. No source project name, raw observations or source bytes. Claim identifiers and estimates may still be sensitive.
- Always retains formal_certification=false, certified_tco2e=null, issued_credits=null and web3_anchor_status=NOT_SUBMITTED.
- Fails closed on unsupported schema, modification, a changed source fingerprint, unexpected certification, unsupported methodology version and mismatched arithmetic.

## Reproducibility and upstream pin

The [cross-repository workflow](../.github/workflows/bluecarbon-edition-bridge.yml) checks out Blue Carbon source at commit e09d109119d141e5a26a9906749ba322e82bfa2f, runs its own tests, generates its actual baseline JSON and an observation-rich synthetic JSON, then imports both into NaFT. It also deliberately tampers with the source project to verify rejection. Update the pinned commit only after reviewing changes and rerunning the contract checks.

## Critical limits

The bridge is a read-only Node.js integration. It does not insert coastal Claims into the agricultural MRV store, deploy a service, write to any Ethereum network, or offer a live web UI.

A matching digest proves deterministic consistency of encoded content, not authentic origin, scientific validity of measurements, property rights, correct application of published methodology, or third-party acceptance. A fabricated but internally consistent dataset can pass. The synthetic research estimate is not creditable removal. Human validation and independent external evidence custody remain mandatory for real-world use.

Blue Carbon may have a different license from NaFT Core. The bridge processes its external JSON output and does not copy its source code. Verify third-party inputs and data rights before distribution.

## Next steps

1. Make a separate read-only UI for the receipt (no direct change to the Core AG-005 workflow).
2. Generalize this schema to other domain engines, including SAF, after published versioned interfaces are specified.
3. Add explicit, optional signed audit receipts, and only then investigate separate on-chain anchoring; do not anchor raw evidence or automatic carbon claims.
