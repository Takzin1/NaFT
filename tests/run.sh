#!/usr/bin/env bash
# NaFT テスト一括実行: 構文チェック + スモークテスト
set -e
cd "$(dirname "$0")/.."
python3 tests/extract-app-js.py
node --check tests/_app.js && echo "syntax: OK"
node tests/smoke.test.js
