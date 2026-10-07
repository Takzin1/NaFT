#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

cleanup() {
  unset PRIVATE_KEY KEY
}
trap cleanup EXIT

if [[ -n "${CLIMATECHAIN_PRIVATE_KEY:-}" ]]; then
  KEY="$CLIMATECHAIN_PRIVATE_KEY"
else
  if [[ ! -t 0 ]]; then
    echo "CLIMATECHAIN_DEPLOY_FAIL: interactive terminal required for hidden private-key input" >&2
    exit 1
  fi
  printf "Paste NaFT_Dev Ethereum private key (hidden): " >&2
  IFS= read -r -s KEY
  printf "\n" >&2
fi

# Normalize common MetaMask export/clipboard forms without ever printing the key.
KEY="$(printf '%s' "$KEY" | tr -d '[:space:]')"
KEY="${KEY#\"}"
KEY="${KEY%\"}"
KEY="${KEY#\'}"
KEY="${KEY%\'}"

# MetaMask may export a raw 64-hex key without the 0x prefix.
if [[ "$KEY" =~ ^[0-9a-fA-F]{64}$ ]]; then
  KEY="0x$KEY"
fi

if [[ ! "$KEY" =~ ^0x[0-9a-fA-F]{64}$ ]]; then
  echo "CLIMATECHAIN_DEPLOY_FAIL: expected a 64-hex Ethereum private key (with or without 0x); received ${#KEY} characters after normalization" >&2
  exit 1
fi

choose_rpc() {
  if [[ -n "${CLIMATECHAIN_RPC_URL:-}" ]]; then
    printf '%s\n' "$CLIMATECHAIN_RPC_URL"
    return 0
  fi

  local candidates=(
    "https://ethereum-sepolia-rpc.publicnode.com"
    "https://rpc.sepolia.org"
  )

  local rpc body
  for rpc in "${candidates[@]}"; do
    body="$(curl -fsS --max-time 8 \
      -H 'content-type: application/json' \
      --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' \
      "$rpc" 2>/dev/null || true)"
    if grep -Eq '"result"[[:space:]]*:[[:space:]]*"0xaa36a7"' <<<"$body"; then
      printf '%s\n' "$rpc"
      return 0
    fi
  done

  return 1
}

RPC_URL="$(choose_rpc || true)"
if [[ -z "$RPC_URL" ]]; then
  echo "CLIMATECHAIN_DEPLOY_FAIL: no public Sepolia RPC responded. Set CLIMATECHAIN_RPC_URL and rerun." >&2
  exit 1
fi

echo "Using Sepolia RPC: $RPC_URL"
echo "Private key: hidden (not stored)"

export PRIVATE_KEY="$KEY"
export RPC_URL
export NETWORK_NAME="Ethereum Sepolia"
export EXPLORER_BASE_URL="https://sepolia.etherscan.io"
export EXPECTED_CHAIN_ID="11155111"

node tools/climatechain-testnet-deploy/deploy.mjs
