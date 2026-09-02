# NaFT データモデル

単一JSONドキュメント（storage key: `naft_db_v1`）内の14コレクション。ID規約: `u_*`(users) / `w`(wallets) / `r`(regions) / `p`(producers) / `pj`(projects) / `ev` / `rw` / `ur` / `tx` / `rev` / `al` / `rsv` / `vr` / `er`。シードデータはプレフィックス+連番（`u1`,`pj1`…）。DB version 2で `verification_runs` と `environmental_records` を追加し、version 1の保存データは読込時に空配列を補完する。

## ER概略

```
users 1─1 wallets            users 1─0..1 producers
users *─* regions(support)   producers 1─* carbon_projects ─* project_evidences
carbon_projects 1─* project_reviews      carbon_projects ─* reservations
carbon_projects 1─* verification_runs    carbon_projects 1─* environmental_records
regions 1─* carbon_projects  regions 1─* rewards
rewards 1─* user_rewards(users)          transactions →(参照) projects/rewards/regions
audit_logs →(参照) すべて
```

## コレクション定義

### users
`id, name, email, password_hash(djb2/PoC用), role, home_region_id, selected_region_id, support_region_ids[], interests[], permitted_region_ids[](管理ロール用), status, onboarded, created_at`
**role（8種）**: `citizen / producer / merchant / municipal_admin / financial_partner / local_operator / platform_admin / super_admin`

### wallets
`id, user_id, wallet_code(NAFT-WLT-XXXXXXXX), wallet_address(Web3将来用/null), demo_stable_balance, naft_point_balance, total_supported_amount, total_co2_contribution(kg), supported_project_ids[], status, created_at`

### regions
`id, name, region_type(10種: prefecture/municipality/wide_area/shopping_street/ja_area/financial_institution_area/decarbonization_area/university_area/corporate_area/community), prefecture, municipality, area_description, operator_name, operator_type(12種: municipality/regional_bank/credit_union/shinkin_bank/ja/chamber_of_commerce/shopping_street_association/university/npo/private_company/startup/community), contact_email, status, created_at`

### producers
`id, user_id(null可=シード事業者), organization_name, description, region_id, contact_email, verification_status(pending/verified), created_at`

### carbon_projects
`id, producer_id, region_id, prefecture, municipality, area_name, region_scope, is_nationwide_visible, title, category(10種), description, location, estimated_co2_reduction(t-CO2), calculation_method, reduction_type, target_amount, current_amount, support_count, status, review_status, trust_score, start_date, end_date, regional_return_plan, related_url, contact_email, main_image_url, created_at`

**review_status 状態遷移（人間の管理者のみが遷移させる）**:
```
draft ──提出──▶ pending_review ──承認──▶ approved ──停止──▶ suspended ──再承認──▶ approved
                    │├─差し戻し─▶ revision_required ──再提出──▶ pending_review
                    └─却下────▶ rejected                （archived: 将来用）
```
マーケット掲載は `approved` のみ。支援可能条件も `approved` のみ。

### project_evidences
`id, project_id, file_url(PoCでは空), file_name, file_type, description, uploaded_by, created_at` — **実ファイルは保存せずメタデータのみ**。

### verification_runs（検証補助の実行記録）
`id, project_id, requested_by, assistant_kind(local_demo_rules_v1), assistant_label, outcome, summary, checks[], missing_items[], risk_signals[], input_fingerprint, generated_at, final_decision, final_reviewer_id, final_decided_at`

- **outcome**: `ready_for_human_review / needs_review / abstain`
- `input_fingerprint` はプロジェクト定量値・算定方法・証憑メタデータから決定論的に生成する16桁hex。改変防止の暗号学的保証ではなく、PoC上の同一入力識別子。
- 実行しても `carbon_projects.review_status` は変化しない。`final_decision` は人間の審査操作後にだけ記録する。

### environmental_records（検証済み環境記録・候補）
`id, project_id, verification_run_id, record_type, status, estimated_co2_reduction, unit, methodology_reference, input_fingerprint, verification_outcome, final_reviewer_id, final_comment, approved_at, previous_record_hash, record_hash, ledger_mode, credit_status, created_at`

- **status**: `verified_candidate / suspended_candidate`
- **ledger_mode**: `offchain_hash_chain`
- **credit_status**: `candidate_not_issued` 固定。正式なカーボンクレジットの発行・移転・償却を表さない。
- `record_hash` は `NAFT-ER-` + 16桁hex。新しい記録は直前の `record_hash` を `previous_record_hash` に保持する。
- 作成条件は、管理者ロールによる `reviewAction(..., 'approve')` の明示操作。補助エンジンやバッチからは作成しない。

### transactions（台帳）
`id, transaction_code(TX-YYYYMMDD-XXXXXX), from_wallet_id, to_wallet_id, amount, token_type, transaction_type, related_project_id, related_reward_id, region_id, prefecture, municipality, status, note, created_by, created_at`
**Web3拡張カラム（全取引に確保・現状null/'offchain_only'）**: `transaction_hash, chain_id, token_contract_address, credit_token_id, offchain_transaction_id, onchain_status`
- **token_type**: `NAFT_POINT / DEMO_STABLE / CARBON_REWARD / CREDIT_RESERVATION`
- **transaction_type**: `initial_grant / support_project / reserve_credit / reward_issue / reward_redeem / merchant_reward / project_reward / admin_adjustment / revoke / refund`
- 疑似ウォレットID: `SYSTEM / PROJECT_POOL / MERCHANT / RESERVATION_BOOK`

### rewards（チケット定義）
`id, region_id(null=全国), related_project_id, title, description, issuer_name, reward_type(fixed_amount/percent), reward_value(表示文字列), available_region_ids[], available_prefectures[], nationwide_available, usage_scope, valid_from, valid_until, status, created_at`
**usage_scope（5種）**: `local_only / regional / prefecture_wide / multi_region / nationwide`

### user_rewards（発行済みチケット）
`id, user_id, reward_id, status(available/used/expired/revoked), qr_code_value(NAFT-RWD-XXXXXXXXXX), origin_note(由来プロジェクト+CO2貢献の説明文), issued_at, used_at, expired_at`
**発行ロジック**: 1,000pt以上の支援時、`related_project_id一致 → region_id一致 → nationwide` の優先順で1枚自動発行。

### project_reviews
`id, project_id, reviewer_id(null=システム/提出), action(submit/approve/request_revision/reject/suspend), comment, created_at`

### audit_logs（削除不可）
`id, actor_user_id('system'可), action, entity_type, entity_id, note, created_at`

### reservations（購入予約=意思表示）
`id, user_id, project_id, quantity(t-CO2), expected_unit_price(3000円/t固定・参考値), total_expected_price, status(registered/cancelled), created_at` — 決済・残高変動なし。台帳に `CREDIT_RESERVATION` として併記。

## 計算式

- **CO2貢献(kg)** = 支援額 ÷ 目標額 × 推定CO2削減量(t) × 1000（小数1位丸め）
- **地域の推定CO2削減(進捗換算, t)** = Σ approved projects: `est_co2 × min(1, current/target)`
- **異常取引アラート**: `token_type=NAFT_POINT AND amount ≥ 50,000`
