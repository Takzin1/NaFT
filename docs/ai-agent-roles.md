# AIエージェントの役割分担

NaFTの継続開発における、モデル/ツール別の推奨分担です。共通の前提は [AGENTS.md](../AGENTS.md)（特にガードレール§0）。

| エージェント | 得意な担当 | 具体タスク例 | 参照必須 |
|---|---|---|---|
| **Claude Opus** | アーキテクチャ判断・法務文書・未踏応募文書・大規模リファクタ設計 | モジュール分割（Phase A）の設計と実施、legal-risk-mapの更新、応募書類の推敲 | architecture.md / legal-risk-map.md / skills/naft-mitou-application |
| **Claude Sonnet** | 機能実装・中規模修正・テスト追加・ドキュメント同期 | ISSUES_BACKLOGの実装、smoke.test.jsへのアサーション追加、demo-script更新 | AGENTS.md §3–5 |
| **Codex（CLI/クラウド）** | 反復的な修正・一括置換・テスト駆動のバグ修正 | エスケープ漏れの一括点検、UI文言修正、CSV列追加 | .github/copilot-instructions.md |
| **GitHub Copilot** | エディタ内の補完・小さな関数の実装 | `pg*()` 内のHTML組み立て、集計関数の項目追加 | .github/copilot-instructions.md |

## ハンドオフ・プロトコル

1. **開始**: 対象Issue番号（ISSUES_BACKLOG）を宣言し、`bash tests/run.sh` で基準線46/46を確認。
2. **作業**: 最小差分で編集。価値移動には `addTx()`、管理操作には `audit()`。
3. **終了**: (a) テスト全通過 (b) 追加アサーション (c) 変更した挙動に対応するdocsの更新 (d) security-checklist §1 スキャン再実行、をコミットメッセージに記載。
4. **人間レビュー**: HITL原則により、法務関連文言・審査フロー・価値付与ロジックの変更は必ず人間がレビューしてからマージ。

## プロンプト例

- Sonnet向け:「ISSUES_BACKLOG #3 を実装してください。AGENTS.md §3 の規約に従い、tests/smoke.test.js にアサーションを追加し、bash tests/run.sh の全通過を確認してから差分を提示してください。」
- Opus向け:「docs/architecture.md §5 の表に従い、naft-app.html のL1レイヤを core/ 配下のESモジュールへ分割する移行計画を、テストを壊さない手順つきで提案してください。」
