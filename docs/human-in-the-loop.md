# Human-in-the-loop 設計原則

IEEE実装は **Deterministic Verification Assist** であり、AIモデルを実行しません。将来導入するAIの役割は「**人間の判断を補助する**」ことに限定されます。意思決定の自動化は行いません。

## 原則

1. **承認は人間だけが行う** — `review_status` の遷移（承認/差し戻し/却下/停止）は、地域管理者・金融パートナー・プラットフォーム管理者の明示的な操作＋コメントによってのみ発生する。AI・バッチ・スケジューラによる自動承認は実装しない。
2. **価値の付与は人間の設計したルールに従う** — 初回付与・チケット発行は事前定義ルール（コードとして監査可能）で行い、AIが金額・対象を動的に決めない。
3. **AIの出力は「参考情報」として明示する** — 将来AI補助機能を追加する場合、UI上で「AIによる参考情報」バッジ・根拠の提示・人間の上書き手段を必須とする。
4. **AI関与の監査可能性** — AI補助を経た判断は `audit_logs` に「AI提案あり／最終判断者」を記録する。
5. **説明責任の非移転** — 審査結果の説明責任は常に人間の審査者にあり、「AIが承認した」という状態を作らない。

## 将来のAI補助機能（すべて提案・下書き・検知まで。確定は人間）

| 機能 | AIがすること | 人間がすること |
|---|---|---|
| 審査補助 | 証憑と算定根拠の要約、チェックリスト照合結果の提示、類似事例の提示 | 証憑確認・承認/差し戻しの決定・コメント作成 |
| 算定レビュー補助 | 算定方法の妥当性に関する論点の列挙（方法論との差分指摘） | 妥当性の最終判断 |
| 異常検知 | 大口・高頻度・パターン異常のフラグ提示（現在はルールベース50,000pt閾値） | 調査・凍結等の対応決定 |
| 文章補助 | プロジェクト説明・審査コメントの下書き | 内容の確認・確定 |
| レポート補助 | PoCレポート草稿の生成 | 数値検証・提出判断 |

## IEEE ClimateChain PoCでの実装

- `runVerificationAssist()` は外部AI APIを呼ばない Deterministic Verification Assist。証憑メタデータを構造化し、不足・未確定資料を提示する。
- `buildVerificationAssessment()` は同一入力から同一の `input_fingerprint` とチェック結果を作る。結果は `ready_for_human_review / needs_review / abstain` の3段階。
- `abstain` は「不合格」ではなく「補助層が結論を出さない」。人間が上書き承認する場合は20文字以上の理由を必須とする。
- 補助実行後も `review_status` は変化しない。`verification_runs.final_decision` と `environmental_records` は、人間が審査ボタンを押した時だけ更新・作成する。
- 画面には常に「Deterministic Verification Assist」と表示し、最終判断者・日時・コメントを記録する。

## 実装ガードレール（AIエージェント向け）

- `reviewAction()` を UI 操作以外から呼ぶコードを追加しない。
- `addTx()` / `w.naft_point_balance` を変更する新規コードパスには、必ず対応する人間操作（ボタン等）と `audit()` を伴わせる。
- 「AI審査済み」「自動承認」等のラベル・状態を追加しない。

## Candidate issuance and retirement gate

Human approval is enforced at the action boundary, including reviewer role and permitted region. Stale input requires another readiness run and explicit human decision. `NEEDS_REVIEW` never silently passes; `ABSTAIN` approval requires at least 20 trimmed characters explaining the human override. Character count cannot judge substantive adequacy and is disclosed as a prototype limitation.

Candidate issuance requires the approved record and approved run, a current input fingerprint, record-hash integrity, and the human reviewer identity. Readiness alone cannot issue. An operator may issue only their own approved project; simulated transfers and retirements require a scoped human reviewer. Retirement additionally requires a reason and positive available holder balance. There is no automatic review, issuance, transfer or retirement timer.

## AG-005 methodology review

`#/primary-mrv` uses a separate human gate. Producers manage their own Program activities; only active platform/super-admin demo identities can approve or reject this prototype's methodology records. Regional admin permission does not automatically extend to these programs. A matching active stored user and session role is checked at the action boundary and after evidence hashing awaits.

A run must match its original snapshot and hash. FAIL/MISSING cannot produce a candidate record. A 20-character human reason is required for both approval and rejection; this is an accountability prompt, not a substantive-quality metric. Rejection is retained in `primary_reviews`; another decision requires a new run. An approved activity cannot receive further attachments or another candidate record. Amendment/revocation workflows remain unimplemented.

Unconfirmed adopted methodology and coefficients remain CONFIG REQUIRED even after approval. The human approves only a reviewed draft, not an eligible/certified reduction. Synthetic evidence warnings survive into the record and Monitoring Package. Original files require human inspection outside the app. No machine action finalizes a record or unit; AG-005 drafts cannot enter generic IEEE unit issuance.
