# NaFTMRVAnchor

`NaFTMRVAnchor.sol` is the only blockchain contract used by the ClimateChain branch.

It is deliberately dependency-free and contains no token standard, marketplace, payment flow or privileged certification role. Anyone may submit a provenance witness; the contract records the submitter and only enforces hash-lineage invariants.

## Two-step lineage example

For a claim whose existing NaFT package is `P1` and re-verification creates successor `P2`:

1. anchor `P1` with `previousPackageHash = 0x00…00`;
2. anchor `P2` with `previousPackageHash = P1`.

The second call succeeds only when `P1` is the current head of the same claim hash.

## Safety boundary

An anchor proves that particular bytes32 values were recorded in a chain transaction. It does not prove that evidence is authentic, that an MRV methodology is officially applicable, that a reduction occurred, or that a carbon credit was issued.

The repository does not contain private keys or RPC credentials. Do not commit them.
