# Evidence Intelligence API (v1)

研究用の**ローカル計算API**です。状態を持たず、何も保存せず、外部へ接続せず、時計を読みません。同じリクエストは同じレスポンスを返します。正式な認証・登録・発行・人間判断・最終確認に相当する操作はありません。

設計：[Evidence Intelligence 設計書](evidence-intelligence-design-ja.md) ／ 制約：[既知の制約](known-limitations.md)

## 使い方

```bash
# 単発（サーバ不要）
node scripts/evidence-intel-api.mjs --request '{"method":"GET","path":"/v1/meta"}'
node scripts/evidence-intel-api.mjs --request-file request.json

# ループバックHTTP（127.0.0.1 のみ）
node scripts/evidence-intel-api.mjs --port 8787
curl -s http://127.0.0.1:8787/v1/standards
```

コードから直接呼ぶ場合は `eiApiHandle({method, path, body})` が `{status, body}` を返します。

## レスポンス形式

```json
{
  "api_version": "v1",
  "status": "OK",
  "data": {},
  "data_hash": "SHA-256(canonical JSON(data))",
  "boundary": {"disclaimer": "…", "formal_certification": false, "certified_result": null}
}
```

失敗時は `{"status":"ERROR","error":{"code":"…"}}`。HTTPステータス：`400` 不正なリクエスト、`404` 未知の経路・Claim・Pack・グラフノード、`405` メソッド不一致、`413` 本文が5 MiB超、`415` `application/json` 以外、`422` 検証エラー（fail closed の拒否理由コード）、`403` 許可されないHost。

## 経路

| メソッド | パス | 本文 | 返すもの |
| --- | --- | --- | --- |
| GET | `/v1/meta` | — | エンジン版、上限、経路一覧 |
| GET | `/v1/standards` | — | 基準のスコープ台帳、会計文脈、用途 |
| GET | `/v1/methodologies` | — | 方法論Packと係数の版カタログ（ハッシュ・有効期間・置換関係） |
| GET | `/v1/methodologies/{key}` | — | 完全一致キー（URLエンコード）のPack |
| POST | `/v1/methodologies/diff` | `old_key`, `new_key` | 同一方法論の2版の構造化差分 |
| POST | `/v1/methodologies/candidates` | `methodology_id`, `start`, `end` | 期間に有効な版（参考。Claimは必ず版を固定） |
| POST | `/v1/compile` | `claims`, `legacy_parity?`, `include_records?`, `factor_registry?` | 状態ダイジェスト、Claimごとの状態・ハッシュ、集計 |
| POST | `/v1/impact` | `claims`, `change`, `verify?` | 影響レポート、変更前後のダイジェスト、任意で全再構築との突合 |
| POST | `/v1/report` | `claims`, `claim_id`, `locale?`, `intended_use?`, `format?` | 根拠付きレポート（`json` は検証結果つき、`markdown` は本文） |
| POST | `/v1/graph` | `claims`, `claim_ids?`, `trace?` | 依存グラフ、検証結果、任意で上流・下流の探索 |
| POST | `/v1/explanations/template` | `claims`, `claim_id`, `locale?` | 説明コンテキストとテンプレート説明サイドカー |
| POST | `/v1/explanations/validate` | `claims`, `claim_id`, `draft` | 外部ドラフトの検証結果（非権威サイドカー） |
| POST | `/v1/audit/verify` | `log`, `checkpoint?` | 監査ログのハッシュ連鎖の検証結果 |

- `claims`：既存 `compileEvidence` と同じ入力形式（1〜500件）。
- `change`：`methodology` / `evidence` / `evidence_add` / `evidence_withdraw` / `parameter` / `field` / `activity`、または `{"type":"factor_registry","factor_registry":"with-synthetic-correction"}`。
- `factor_registry`：`default` または `with-synthetic-correction` の**名前付きレジストリのみ**。任意の係数を送り込む経路はありません。
- `intended_use`：`ENGINEERING_RESEARCH`（既定）または `PROJECT_CREDITING_PRECHECK`。`CORPORATE_INVENTORY` は常に `EI_INVENTORY_ACCOUNTING_NOT_IMPLEMENTED`。

## 例：1件の活動を修正したときの影響

```bash
node scripts/evidence-intel-api.mjs --request-file request.json
```

```json
{"method": "POST", "path": "/v1/impact", "body": {
  "claims": [],
  "change": {"type": "activity", "activity_id": "CLAIM-1", "patch": {"days": 5}},
  "verify": true
}}
```

`data.impact.claims[].classification` が `SEMANTIC_CHANGE` / `PROVENANCE_ONLY`、`because` が変わった入力ノード、`recomputed` が再計算したノード、`full_rebuild_check.status` が全再構築との一致（`MATCH`）です。

## HTTPアダプタの性質と限界

- 127.0.0.1 のみにバインド。`Host` が `127.0.0.1:port` / `localhost:port` / `[::1]:port` 以外なら拒否。CORSヘッダは出しません。
- 認証・レート制限・TLSはありません。**共有ネットワークや本番環境に公開する用途ではありません。**
- セッションの保存データ（`db`）は読みません。保存・人間判断・最終確認は `src/compiler-session.js` の役割・監査ガードの内側に残ります。

## 検証

`node tests/evidence-intel.test.js`（経路の全数、エラー、上限、決定性）と `node tests/evidence-intel-api.test.mjs`（実際のループバックHTTP往復、Host検査、本文上限、CLI）。
