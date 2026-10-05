# ClimateChain testnet anchor runbook

This runbook starts **after** the repository CI is green. It intentionally does not store private keys, RPC credentials, or wallet secrets.

## Goal

Produce verifiable evidence for one NaFT claim lineage:

1. deploy `NaFTMRVAnchor.sol` to a public EVM testnet;
2. anchor the existing package `P1` as the genesis package;
3. anchor the successor package `P2` with `previousPackageHash = P1`;
4. record the chain ID, contract address and both transaction hashes in the submission docs.

## Required local inputs

Generate the exact transaction arguments from the browser demo:

1. open `naft-app.html#/climatechain`;
2. run the 100-claim methodology update;
3. click **Prepare blockchain anchor plan**;
4. download `naft-climatechain-anchor-plan.json`.

The JSON must remain `chain_status: NOT_SUBMITTED` until a real transaction is confirmed.

## Deployment boundary

Use a human-controlled wallet on the chosen public testnet. Do **not** commit:

- private keys;
- seed phrases;
- RPC credentials;
- signed raw transactions containing secrets.

The contract has no owner privilege, minting, payment, marketplace or certification path.

## Verification checklist

Before claiming that NaFT is anchored on-chain, record all of the following:

- network name and numeric chain ID;
- deployed contract address;
- exact source commit SHA;
- compiler version (`solc 0.8.24`);
- deployment transaction hash;
- genesis anchor transaction hash;
- successor anchor transaction hash;
- `claimIdHash`;
- genesis `packageHash`;
- successor `packageHash`;
- successor `previousPackageHash`;
- explorer links.

Confirm on the explorer that:

- both `MRVPackageAnchored` events exist;
- the successor's previous package equals the genesis package;
- `headByClaim(claimIdHash)` equals the successor package hash.

## What the submission may say after verification

> NaFT anchors the version lineage of MRV packages on a public testnet. The chain witnesses package hashes and parentage only; it does not certify climate impact or issue a carbon credit.

Until all checklist items are available, keep the demo wording as **NOT_SUBMITTED**.
