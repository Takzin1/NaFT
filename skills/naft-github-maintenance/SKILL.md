---
name: naft-github-maintenance
description: NaFTリポジトリの保守作業（Issue実装・バグ修正・リファクタ・ドキュメント同期・リリース準備）を規約通りに行うためのスキル。naft-app.htmlの編集、テスト実行、PR準備のワークフローを定義する。
---

# NaFT GitHub保守スキル

## ワークフロー（すべての変更で共通）
1. **基準線**: `bash tests/run.sh` → 46/46（＋既存追加分）を確認。失敗があれば先にそれを直す。
2. **位置特定**: naft-app.html 内は行番号でなく**関数名で検索**（AGENTS.md §2 の識別子マップ）。
3. **編集規約**（AGENTS.md §3 準拠の要点）:
   - `pg*()` は文字列を返す純関数。変異は `exec*/save*/do*` へ
   - 価値移動= `addTx()` 併記、管理操作= `audit()` 併記、最後に `await saveDB()`
   - ユーザー由来値は `esc()`、onclick属性には英数字IDのみ
   - localStorage/IndexedDB/外部API/新規CDNを追加しない
4. **テスト追記**: 新挙動に対応するアサーションを tests/smoke.test.js に追加 → `bash tests/run.sh` 全通過。
5. **ドキュメント同期**: data-model / architecture / demo-script / known-limitations のうち影響があるものを同一コミットで更新。
6. **最終確認**: docs/pr-checklist.md を全項目チェック → docs/security-checklist.md §1 のスキャンコマンドを再実行。

## リリース（タグ）前チェック
README のデモアカウント表が実データと一致／demo-script が現UIで再現可能／ISSUES_BACKLOG のステータス更新／`tests/_app.js`（生成物）がコミットされていないこと（tests/.gitignore対象）。

## 禁止
AGENTS.md §0 の7項目。該当依頼が来た場合は実装せず、legal-risk-map の該当論点を示して人間の判断を仰ぐ。
