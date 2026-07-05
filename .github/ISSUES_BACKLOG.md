# ISSUES BACKLOG — AIエージェント着手用

各Issueは AGENTS.md の規約に従い、`bash tests/run.sh` 全通過＋アサーション追加＋docs同期で完了とする。
難易度: ★=Copilot/Codex向け小修正、★★=Sonnet向け機能実装、★★★=Opus向け設計を伴う変更。

| # | タイトル | 難易度 | 対象（関数/ファイル） | 受入条件 |
|---|---|---|---|---|
| 1 | 監査ログの地域スコープフィルタ | ★★ | `audit()` に region_id を追加し `pgAuditLogs(regionIds)` でフィルタ | 地域管理者は担当地域のログのみ表示。既存ログ(region_idなし)は全国扱い。テスト2件追加 |
| 2 | 異常系スモークテストの拡充 | ★ | tests/smoke.test.js | 残高不足支援の拒否／未承認PJ支援の拒否／重複メール登録の拒否／コメントなし却下の拒否、の4アサーション追加 |
| 3 | チケット期限切れの一括判定と表示改善 | ★★ | `pgRewards()` の遅延評価を `loadDB()` 後の整合処理へ移動 | 期限切れが全画面で一貫。`expired_at` 記録。テスト1件 |
| 4 | マーケットのフィルタ状態をURLハッシュに保持 | ★★ | `applyMF()` / `route()` | `#/market?cat=Forest` 形式で共有可能。リロードで復元。テスト1件 |
| 5 | 取引履歴のページネーション（50件/頁） | ★ | `txTable()` 呼び出し側 | 全台帳画面で適用。表示件数・頁切替の描画テスト |
| 6 | 支援時の確認画面に地域還元予定を表示 | ★ | `modalSupport()` step2 | `regional_return_plan` を表示。XSS回帰なし（esc確認） |
| 7 | 管理者ダッシュボードに月次推移（CSSバー） | ★★ | `regionStats()` に月次集計追加 | 直近6ヶ月の支援額バー表示。純関数のユニット的アサーション |
| 8 | プロデューサー編集時の証憑削除UI | ★★ | `pgProjectForm()` / `saveProject()` | draft/差し戻しのみ削除可。audit記録。テスト1件 |
| 9 | `esc()` のXSS回帰テスト | ★ | tests/smoke.test.js | `<img onerror>` 等を含む名前で登録→描画出力にタグが残らないことを検証 |
| 10 | reset後の状態遷移テスト | ★ | tests/smoke.test.js | `execReset()` 後に db が10PJ/6ユーザーへ戻ることを検証 |
| 11 | Phase A: ESモジュール分割の実施 | ★★★ | architecture.md §5 の表どおりに分割、index.html化 | ビルドなし(type=module)で同一挙動。46項目全通過が受入基準 |
| 12 | AI審査補助（HITL）プロトタイプ設計 | ★★★ | docs/human-in-the-loop.md 準拠の設計書作成（実装はサーバー版で） | 「AI提案あり/最終判断者」の監査ログ設計、UIモック、評価指標を含むdocs追加。**自動承認は設計に含めない** |
| 13 | アクセシビリティ初期対応 | ★★ | モーダルのフォーカストラップ、aria-label | キーボードのみで支援フロー完走可能 |
| 14 | 加盟店の利用履歴を自地域分に限定 | ★ | `pgMerchant()` | region_id一致の reward_redeem のみ表示。テスト1件 |

**着手宣言の書式**: 「Issue #N に着手。基準線46/46確認済み。」→ 完了時に pr-checklist.md の結果を添付。
