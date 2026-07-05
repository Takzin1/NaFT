# PRチェックリスト

すべてのPR（人間・AIエージェント共通）は以下を満たすこと。

## 機能・品質
- [ ] `bash tests/run.sh` が 46/46（＋追加分）で全通過
- [ ] 新機能・修正に対応するアサーションを `tests/smoke.test.js` に追加した
- [ ] `pg*()` は副作用なし／変異は `exec*/save*/do*` に置いた
- [ ] 価値移動に `addTx()`、管理操作に `audit()`、永続化に `saveDB()` を伴わせた

## セキュリティ
- [ ] ユーザー由来の値は `esc()` を通した（onclick属性には英数字IDのみ）
- [ ] 外部通信・SDK・秘密情報を追加していない（security-checklist §1 のスキャン再実行済み）

## コンプライアンス（docs/legal-risk-map.md）
- [ ] 実決済・換金・送付・実クレジット売買に該当する機能を追加していない
- [ ] `DISCLAIMER` と免責表示を削除・弱体化していない
- [ ] 追加した文言に禁止表現（儲かる/利回り/投資/換金 等）がない
- [ ] 審査の自動承認につながる変更をしていない（HITL原則）

## ドキュメント
- [ ] 挙動変更に対応する docs（data-model / architecture / demo-script 等）を更新した
- [ ] ISSUES_BACKLOG の該当Issueにステータスを記載した
