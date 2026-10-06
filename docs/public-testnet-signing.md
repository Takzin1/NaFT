# Public testnet signing — one-command operator flow

This is the only step of the ClimateChain workflow that requires a human-controlled wallet.

The helper under `tools/climatechain-testnet-deploy/` performs:

1. exact `HEAD` freeze;
2. clean-working-tree check;
3. contract source reconstruction from that commit;
4. Solidity 0.8.24 compile;
5. deterministic P1 → P2 anchor-plan reconstruction from the same commit;
6. public-testnet contract deployment;
7. authorized P1 anchor;
8. authorized P2 anchor;
9. final `headByClaim == P2` check;
10. read-only source-to-chain verification;
11. generation of a `VERIFIED_TESTNET` record.

## Never commit secrets

The deployment helper reads the signer only from `PRIVATE_KEY`. The repository already ignores `.env*`, `*.key` and the generated `.climatechain-output/` directory.

Do not paste a private key into GitHub issues, pull requests, commit messages, source files, shell history, screenshots, or chat.

## Install

From the repository root:

```bash
cd tools/climatechain-testnet-deploy
npm install --package-lock=false
cd ../..
```

## Run

Use a funded **testnet-only** wallet.

```bash
RPC_URL="https://<rpc>" \
PRIVATE_KEY="0x<testnet-only-private-key>" \
NETWORK_NAME="<public testnet name>" \
EXPLORER_BASE_URL="https://<explorer>" \
EXPECTED_CHAIN_ID="<numeric chain id>" \
npm --prefix tools/climatechain-testnet-deploy run deploy
```

The script refuses to proceed when:

- the working tree is dirty;
- the private key format is invalid;
- the signer has zero native testnet balance;
- the RPC chain ID differs from `EXPECTED_CHAIN_ID`;
- the deterministic P1 → P2 lineage is malformed;
- deployment, P1, or P2 reverts;
- `anchorWriter` is not the deployer;
- final `headByClaim` is not P2;
- the independent read-only verifier rejects source/bytecode/calldata/event/final-state identity.

## Output

A successful run writes:

```text
.climatechain-output/verified-testnet-record.json
```

Review the contract and three transaction links before copying the record into `src/climatechain-testnet-record.js`.

The generated output is intentionally gitignored. The deploy tool also disables package-lock generation so dependency installation does not dirty the repository before the clean-tree safety check.
