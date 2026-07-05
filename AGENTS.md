# AGENTS.md — AIエージェント向け開発ガイド

Claude (Opus/Sonnet)・OpenAI Codex・GitHub Copilot 等のコーディングエージェントが、このリポジトリを安全に継続開発するためのガイドです。**作業前に必ず本書と docs/legal-risk-map.md §2 を読んでください。**

## 0. 絶対的ガードレール（違反するPRは自動的に不採用）

1. **実決済・送金・換金・出金機能を追加しない**（Stripe等の決済SDK導入も禁止）
2. **実カーボンクレジットの売買・移転・償却機能を追加しない**（購入予約は「意思表示」のまま）
3. **ポイント/チケットに換金性・ユーザー間送付機能を持たせない**
4. **`DISCLAIMER` 定数と免責表示（フッター・LP・登録画面）を削除・弱体化しない**
5. **AIによる審査の自動承認・自動付与を実装しない**（docs/human-in-the-loop.md）
6. **秘密情報（APIキー・秘密鍵・トークン）をコミットしない。外部API呼び出しを追加しない**
7. 「儲かる・利回り・投資・換金」等の金融誤認表現を使わない（docs/legal-risk-map.md §2）

## 1. リポジトリ地図

| パス | 内容 | 触るときの注意 |
|---|---|---|
| `naft-app.html` | アプリ本体（唯一の実行コード） | 下記§2の内部レイアウト参照 |
| `tests/` | スモークテスト46項目 | 変更後は必ず `bash tests/run.sh` |
| `contracts/` | Solidity雛形（未接続） | メインネット前提のコードにしない |
| `docs/` | 設計・法務・運用文書 | 挙動変更時は該当文書も更新 |
| `skills/` | Claude Skills | 各SKILL.mdの手順に従う |

## 2. naft-app.html の内部レイアウト（関数名で検索して位置特定すること。行番号は使わない）

| レイヤ | 目印となる識別子 |
|---|---|
| CSS設計システム | `:root{`（CSS変数 `--g900`〜`--gold`） |
| Storage/定数/シード | `var store =` / `var DISCLAIMER` / `function seedDB()` |
| 台帳・監査（書込の唯一の入口） | `function addTx(` / `function audit(` |
| 状態・ルーター | `var S = {` / `function route(p)` / `function render()` |
| 共有UI | `function projectCard(` / `function txTable(` / `function modalFrame(` |
| 認証・オンボーディング | `function doLogin` / `function doRegister` / `function pgOnboarding` |
| 市民ユースケース | `function execSupport` / `function execReserve` / `function redeemByCode` |
| 事業者 | `function pgProjectForm` / `function saveProject` |
| 審査（HITL） | `function modalReview` / `function reviewAction` |
| ダッシュボード/集計 | `function regionStats` / `function nationalStats` / `function txCSV` |
| 初期化 | `(async function init()` |

## 3. コーディング規約

- **スタイル**: ビルドなしのVanilla JS（`var`＋`function`宣言、テンプレートは文字列連結）。既存スタイルに合わせ、新構文（class, import等）を持ち込まない（Phase Aのモジュール分割まで）。
- **描画**: ページ関数 `pg*()` はHTML文字列を返す純関数に保つ。副作用（db変更・保存）はユースケース関数（`exec*`, `save*`, `do*`）へ。
- **エスケープ**: ユーザー由来の値を`innerHTML`に入れる際は必ず `esc()`。onclick属性へ埋め込む値は英数字IDのみ許可。
- **価値移動**: 残高・支援額・チケットを変更するときは必ず `addTx()` を併記。管理操作は必ず `audit()` を併記。`saveDB()` を忘れない。
- **ルート追加**: `route()` に分岐追加 → 対応する `*Shell()` のnavにリンク追加 → `pg*()` 実装、の3点セット。
- **ID規約**: `uid('接頭辞')`。既存接頭辞は docs/data-model.md 参照。

## 4. 開発ループ

```bash
# 1) 編集前に現状確認
bash tests/run.sh                      # 46/46 が基準線
# 2) 編集（str_replace等で最小差分）
# 3) 検証
python3 tests/extract-app-js.py && node --check tests/_app.js
node tests/smoke.test.js               # 追加機能にはアサーションを追記する
# 4) セキュリティスキャン（docs/security-checklist.md §1のコマンド）
```

## 5. よくあるタスクのレシピ

- **新しいページを追加**: §3ルート追加の3点セット + smoke.test.js に描画アサーション1件追加。
- **新しい取引種別を追加**: `TT_MAP` に表示名追加 → `addTx()` 呼び出し箇所を実装 → data-model.md の一覧更新。
- **集計項目の追加**: `regionStats()`/`nationalStats()` は純関数。ここに項目を足し、`statCard()` で表示。
- **文言変更**: legal-risk-map §2 の禁止語に照らしてから変更。
- **バグ調査**: docs/debugging-guide.md 参照。

## 6. 着手できるタスク

[.github/ISSUES_BACKLOG.md](.github/ISSUES_BACKLOG.md) に難易度・対象関数・受入条件つきで列挙済み。
