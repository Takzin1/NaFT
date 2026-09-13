# NaFT アーキテクチャ

## 1. 設計方針

NaFTは「ビルド不要・サーバー不要・依存最小で、どの環境でも確実に動くPoC」を最優先に、**単一HTMLファイルのSPA**として実装されています。ただし内部は将来の分割・移植を前提に、明確なレイヤと責務境界を持ちます。

```
naft-app.html
├── <style>          … デザインシステム（CSS変数トークン + コンポーネントクラス）
├── <script> L1      … Storage Adapter（store.get/set/del）+ 定数（CATS/ROLE_MAP等）
│                      + seedDB() + loadDB/saveDB/resetDB + DBヘルパー + addTx()/audit()
├── <script> L2      … アプリ状態 S + ハッシュルーター route() + render()ループ
│                      + 共有UIコンポーネント（projectCard/txTable/badge/modalFrame…）
├── <script> L3      … 公開ページ（LP/マーケット/詳細）+ 認証 + オンボーディング
├── <script> L4      … 市民ページ + 支援/予約/チケットのユースケース
├── <script> L5      … 事業者ページ + プロジェクト登録/提出
├── <script> L6      … 管理者/加盟店ページ + 審査/チケット管理/CSV/監査ログ
└── <script> L7      … 全国プラットフォーム + 設定/リセット + init()
```

## 2. コアとなる4つの不変条件（invariants）

1. **台帳原則** — あらゆる価値移動（付与・支援・チケット発行/利用・予約）は必ず `addTx()` を経由する。`addTx()` は取引コード、地域、Web3拡張カラム（`transaction_hash`/`chain_id`/`token_contract_address`/`credit_token_id`/`offchain_transaction_id`/`onchain_status`）を自動付与する。直接 `db.transactions.push()` してはならない。
2. **監査原則** — ログイン・登録・審査・付与・作成・リセットなどの操作は `audit(action, entityType, entityId, note)` で記録する。監査ログを削除・改変するUIは存在しない（今後も追加しない）。
3. **HITL原則** — `review_status` を `approved` に遷移できるのは人間の管理者ロールの操作のみ。AI・バッチ・自動処理による承認・ポイント付与は実装しない（docs/human-in-the-loop.md）。
4. **MRV分離原則** — `buildVerificationAssessment()` は証憑メタデータを決定論的に検査し、`READY / NEEDS REVIEW / ABSTAIN` 相当の参考結果だけを返す。状態遷移と `environmental_records` 作成は `reviewAction()` 内の人間操作に限定する。

## 3. データフロー

```
UI操作(onclick) → ユースケース関数(execSupport 等)
  → バリデーション（残高・状態・権限）
  → db 変異（wallet/project/user_rewards…）
  → addTx()（台帳） + audit()（監査ログ）
  → await saveDB()（Storage Adapter経由で永続化）
  → render()（画面全体を state から再構築）
```

IEEE ClimateChain向けMRVフローは価値移動と分離する。

```
Evidence metadata
  → runVerificationAssist()（構造化・不足検知）
  → buildVerificationAssessment()（決定論的チェック）
  → reviewAction()（人間の最終判断）
  → createEnvironmentalRecord()（候補記録＋前レコードhash）
```

補助実行だけではプロジェクト状態、残高、台帳は一切変化しない。候補記録も正式クレジットではなく、オフチェーンの来歴デモである。

- `render()` は「状態 → HTML文字列 → innerHTML」の純粋な一方向。ページ関数（`pg*`）は**文字列を返すだけの純関数**に近く、副作用はユースケース関数に隔離。
- フォームは再描画で値が消えるため、**送信時に `getElementById` で読む**方式（中間再描画をしない）。
- ユーザー入力の表示は必ず `esc()` を通す（XSS対策）。

## 4. Storage Adapter（移植の継ぎ目）

```js
store = { get(key), set(key,value), del(key) }   // すべて async
```

- Claude Artifact環境: `window.storage`（Artifact永続ストレージAPI）に `naft_db_v1`（全データのJSON）と `naft_session_v1`（ログイン中ユーザーID）の2キーで保存。
- 非対応環境: メモリ内オブジェクトにフォールバック（リロードで初期化）。
- **localStorage / IndexedDB は不使用**（Artifact環境で動作しないため）。
- サーバー移行時はこの3メソッドをAPI呼び出しに差し替えるのが第一歩（ただし最終形は §6 のAPI分割）。

## 5. 責務分離マップ（将来分割の設計図）

単一ファイル内の関数群は、以下のモジュール境界に沿って命名・配置されています。分割時はこの表の単位でファイルに切り出します。

| 将来のモジュール | 現在の関数群 | 純度 |
|---|---|---|
| `core/storage.ts` | `store`, `loadDB/saveDB/resetDB` | 副作用 |
| `core/domain.ts` | `CATS/RS_MAP/TT_MAP/TOKEN_MAP/SCOPE_MAP/ROLE_MAP…`, `pct`, `hashPw`, `uid/rnd/txCode` | 純粋 |
| `core/ledger.ts` | `addTx`, `audit` | 副作用（唯一の書込口） |
| `core/queries.ts` | `findUser/walletOf/regionOf/projectOf/…`, `regionStats`, `nationalStats`, `filteredProjects` | 純粋（読取） |
| `features/auth` | `doLogin/doRegister/doLogout/pgLogin/pgRegister/pgOnboarding/ob*` | 混在 |
| `features/support` | `openSupport/confirmSupport/execSupport/modalSupport` | 混在 |
| `features/reserve` | `openReserve/execReserve/modalReserve` | 混在 |
| `features/rewards` | `rewardCardHTML/pgRewards/modalRewardDetail/createReward/redeemByCode` | 混在 |
| `features/projects` | `pgProjectForm/saveProject/pgProjectDetail/producer*` | 混在 |
| `features/review` | `pgAdminReviews/modalReview/reviewAction` | 混在 |
| `features/verification` | `buildVerificationAssessment/runVerificationAssist/pgVerificationWorkbench/pgVerificationRecords` | 純粋＋監査付き副作用 |
| `features/environmental-records` | `buildEnvironmentalRecord/createEnvironmentalRecord/environmentalRecordFor` | 純粋＋人間承認時のみ副作用 |
| `features/dashboard` | `pgAdminHome/pgPlatformHome/reportBlock/txCSV/pjCSV` | 純粋寄り |
| `ui/components` | `badge/statCard/projectCard/txTable/modalFrame/logoHTML/…` | 純粋 |
| `app/router.ts` | `S`, `route`, `render`, `go`, `roleHome` | 副作用 |

**移植ロードマップ**: Phase A: `<script>` を ES Modules に分割（挙動不変、tests/がリグレッション検知）→ Phase B: docs/data-model.md から TypeScript 型を起こす → Phase C: Next.js + PostgreSQL(RLS) へ移行し、ユースケース関数をAPIハンドラ化（README §7のAPI設計に対応）。**tests/smoke.test.js が各Phaseの受入基準**。

## 6. 外部依存

| 依存 | 用途 | フォールバック |
|---|---|---|
| qrcodejs 1.0.0（cdnjs） | QRコード描画 | 読込失敗時はコード文字列表示 |

ネットワーク呼び出し（fetch/XHR）はゼロ。API キー・秘密情報は存在しない（docs/security-checklist.md のスキャン結果参照）。

## IEEE candidate lifecycle (v3)

The executable application remains one HTML file, with no new SDK, external API or build requirement.

`issueCandidateUnit(recordId)` checks scope/role, SHA-256 record integrity, current approved project and approved run, named human reviewer, current fingerprint, ABSTAIN justification, quantity and duplicate guards before issuing. Project owners or authorized reviewers may issue an already reviewed record. Transfer and retirement require an authorized regional or platform human reviewer controlling fixed demo accounts.

`transferCandidateUnit(unitId, fromHolder, toHolder, quantity)` records simulation custody. `retireCandidateUnit(unitId, quantity, reason, holder)` removes spendable quantity; default holder is `demo_partner`. No citizen points or wallet balances move. Both use a per-unit hash-linked transfer ledger, a transaction entry and an audit entry.

Canonical JSON sorts object keys and preserves arrays; evidence snapshots are separately sorted by content. UTF-8 canonical bytes feed SHA-256. `sha256Canonical()` prefers Web Crypto `crypto.subtle.digest('SHA-256', ...)`; the synchronous `digestText()` fallback computes the same standard SHA-256 for pure assessment/rendering/seed and transfer functions. Tests compare known vectors, Unicode/multiple blocks and the native Web Crypto output. These are hashes, not signatures.

Readiness captures an input snapshot before awaiting Web Crypto and rechecks current input and actor before storing it. Human approval precomputes the record hash and rechecks actor, current run, pending status and predecessor before committing. Issuance rechecks integrity/actor/duplicates after its asynchronous hash. Balance and duplicate-check mutations contain no intermediate await, preventing same-event-loop double-click races. `saveDB()` still stores a single JSON document: this does **not** provide cross-tab, multi-user or database transaction safety. Concurrent approvals on different records require retry if the predecessor changed.

`#/ieee` provides one 8-stage screen, role switching, two seeded scenarios, explicit human approval, full/partial quantity controls, persistent guard messages and expandable JSON provenance. Page rendering does not mutate lifecycle data. Human approval is never triggered by assist, seeding a new unit, routing or a timer.

Before any distributed deployment: enforce authenticated permissions server-side, lock balances transactionally, add unique constraints on record/input/issuance fingerprints, preserve evidence files, and provide independently witnessed provenance. Current storage and hashes alone are not immutable or a blockchain registry.

## Primary Industry MRV extension

The application adds a logically separate domain section and `#/primary-mrv`; the seven script blocks and existing generic IEEE flow remain intact. `METHODOLOGY_RULE_PACKS` reserves the methodology boundary; the only executable pack is AG-005's reference subset. There is no rule DSL or automatic official-source update.

`registerPrimaryActivity` validates and creates/reuses Program → Farmer → Field, then registers a draft activity. `attachPrimaryEvidence` hashes actual file bytes using Web Crypto or the identical byte-oriented fallback, creates a manifest and rechecks actor/snapshot after awaits. `assessAG005` and `calculateAG005` are deterministic read-only functions; `runAG005` persists their hash-bound result. `reviewPrimaryActivity` is the explicit platform-human gate. `monitoringPackage` and `exportMonitoringJSON` verify current input, reviewed record integrity and audit chain before export.

The new collections use `primary_schema_version:1` alongside DB version 3. Audit migration anchors original historical entries without changing them. The existing `audit()` write entry now chains all new events; `verifyAuditChain()` checks count, order, event payloads and checkpoint. Only new methodology actions fail closed on a broken chain; the generic IEEE action behavior is preserved. No independent anchor or cross-client transaction protocol is present.

See [source selection, sequence, security boundaries](primary-industry-mrv.md). AG-005 draft records are separate from IEEE `environmental_records` and cannot issue units. Shared primitives are canonical SHA-256, storage, users, audit and UI conventions. This separation prevents unresolved methodology configuration from becoming a demo quantity.

## MRV view projections and render budget

`primaryPortfolio()` builds per-call lookup maps and a paginated projection of authorized programs. Its status is explicitly the saved workflow state, not a live integrity result for every field. Selecting a field builds one fresh `primarySnapshot`; `assessAG005Snapshot` and run comparison reuse that snapshot during the same render. Manifest checks run once per manifest and latest rechecks use a map. No authorization or integrity result is cached across actions.

Primary record/manifest/calculation JSON and IEEE provenance are materialized only after an explicit inspection action. Activity/evidence tables and the recheck selector use ten-row pages. Text drafts and selected file DOM nodes are retained only in transient UI state for the same user and activity during view-only changes; changing fields clears them. Program data is not duplicated into a new persistent collection.

The passive view no longer verifies the entire audit history on every render. Its audit badge says **Last explicit verification**, with time and a historical-result qualifier. `primaryGuard`, approval and export retain their full authoritative verification. The typed-array SHA-256 fallback eliminates per-round arrays while preserving standard byte output; padding boundary vectors are checked against Node crypto.
