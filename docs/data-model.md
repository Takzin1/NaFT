# NaFT データモデル

単一JSONドキュメント（storage key: `naft_db_v1`）内の26コレクション（DB version 3 + primary_schema_version 1）。ID規約: `u_*`(users) / `w`(wallets) / `r`(regions) / `p`(producers) / `pj`(projects) / `ev` / `rw` / `ur` / `tx` / `rev` / `al` / `rsv` / `vr` / `er`。シードデータはプレフィックス+連番（`u1`,`pj1`…）。DB version 2で `verification_runs` と `environmental_records` を追加し、version 1の保存データは読込時に空配列を補完する。

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
`id, project_id, requested_by, assistant_kind(deterministic_mrv_v2), assistant_label, outcome, summary, checks[], missing_items[], risk_signals[], input_fingerprint, generated_at, final_decision, final_reviewer_id, final_decided_at`

- **outcome**: `ready_for_human_review / needs_review / abstain`
- `input_fingerprint` はcanonicalized input（主体・地域・活動期間・定量値・算定方法・説明・証憑メタデータ）から生成する64桁SHA-256 hex。意味的な同一性や排出削減量の真実性は証明しない。
- 実行しても `carbon_projects.review_status` は変化しない。`final_decision` は人間の審査操作後にだけ記録する。

### environmental_records（検証済み環境記録・候補）
`id, project_id, verification_run_id, record_type, status, estimated_co2_reduction, unit, methodology_reference, input_fingerprint, verification_outcome, final_reviewer_id, final_comment, approved_at, previous_record_hash, record_hash, ledger_mode, credit_status, created_at`

- **status**: `verified_candidate / suspended_candidate`
- **ledger_mode**: `offchain_hash_linked_prototype`
- **credit_status**: `candidate_not_formally_issued` 固定。正式なカーボンクレジットの発行・移転・償却を表さない。
- `record_hash` は `NAFT-ER-` + 64桁SHA-256 hex。新しい記録は直前の `record_hash` を `previous_record_hash` に保持する。
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

### audit_logs（編集・削除UIなし）
`id, actor_user_id('system'可), action, entity_type, entity_id, note, created_at`

### reservations（購入予約=意思表示）
`id, user_id, project_id, quantity(t-CO2), expected_unit_price(3000円/t固定・参考値), total_expected_price, status(registered/cancelled), created_at` — 決済・残高変動なし。台帳に `CREDIT_RESERVATION` として併記。

## 計算式

- **CO2貢献(kg)** = 支援額 ÷ 目標額 × 推定CO2削減量(t) × 1000（小数1位丸め）
- **地域の推定CO2削減(進捗換算, t)** = Σ approved projects: `est_co2 × min(1, current/target)`
- **異常取引アラート**: `token_type=NAFT_POINT AND amount ≥ 50,000`

## IEEE v3 additions

DB version 3 appends empty lifecycle collections to v1/v2 data without deleting prior records or silently rehashing old fingerprints. Legacy 16-character runs are stale and must be rerun with a fresh human decision. Historic record links remain unchanged.

### Hash fields

`verification_runs`: adds `evidence_set_hash`, `hash_algorithm: SHA-256`. New `assistant_kind` is `deterministic_mrv_v2`; displayed name is **Deterministic Verification Assist**.

`environmental_records`: adds `evidence_set_hash`, `environmental_record_hash` (64 lowercase hex), `hash_algorithm`, `vintage`. `record_hash` is the display alias `NAFT-ER-` + uppercase hash. `recordPayload()` covers every stored field except the two hash aliases and mutable `status`, including quantity, unit, methodology, reviewer, full comment, approval time and previous hash. Status changes use audit logs. The previous link hashes the preceding approved payload, not its later status.

`input_fingerprint` deliberately excludes the local project ID, so cloning the same payload under a new ID does not make a new claim. Evidence metadata arrays are sorted by canonical content. Metadata edits can yield another fingerprint: this is an exact-input guard, not semantic deduplication. `evidence_set_hash` hashes metadata, never file bytes.

### candidate_units (`cu_*`)

`id, project_id, environmental_record_id, input_fingerprint, issuance_fingerprint, vintage, quantity_total, quantity_available, quantity_retired, unit, methodology_reference, status, credit_status, created_by, created_at, holder_balances[]`

- `status`: `active_candidate / fully_retired / voided_candidate` (voiding reserved; no UI creates it).
- `credit_status`: `candidate_not_formally_issued` always.
- `issuance_fingerprint`: SHA-256 of `{schema: naft-candidate-issuance-v1, input_fingerprint}`.
- Duplicate checks include every existing unit, including retired and voided candidates. Match on record ID **or** input fingerprint **or** issuance fingerprint.
- `holder_balances`: `{holder, quantity}` for `demo_operator` and `demo_partner`, fixed simulated custody accounts unrelated to citizen wallets or points.
- `quantity_total = quantity_available + quantity_retired`; sum of holder balances equals available. Operations calculate integer millionths with a safe-integer limit; stored values use at most 6 decimals. No rounding of unsupported input quantities into an accepted amount.

### unit_transfers (`ut_*`)

`id, candidate_unit_id, from_holder, to_holder, quantity, transfer_type, reason, previous_transfer_hash, transfer_hash, created_by, created_at, ledger_mode`

`transfer_type`: `demo_transfer / retirement_transfer`. Chain is per candidate unit; newest row first, genesis previous hash null. SHA-256 includes every field except `transfer_hash`. `demo_transfer` subtracts one holder and adds another; aggregate available stays constant. Retirement sends to `demo_retirement_sink`, which is not a spendable holder.

### unit_retirements (`urc_*`)

`id, candidate_unit_id, transfer_id, quantity, reason, holder, created_by, created_at, retirement_type: demo_only`

Reason is required. Quantity must be positive, finite, within both global available and the retiring holder's balance. Only an explicit authorized reviewer action can retire. Full retirement sets `fully_retired`. No restore/unretire operation exists; reloading memory or replacing a dataset is outside the guard.

### Ledger / audit extensions

All successful lifecycle changes also use `addTx()` with `token_type: CANDIDATE_SIMULATION`, and `transaction_type: candidate_unit_issue / candidate_unit_transfer / candidate_unit_retirement`. Amount means simulated t-CO2 quantity, not points or money.

Audit successes: `candidate_unit_issued`, `candidate_unit_transferred`, `candidate_unit_retired`.
Audit rejections: `candidate_unit_issue_blocked`, `candidate_unit_transfer_blocked`, `candidate_unit_retirement_blocked`, with reason code. `DUPLICATE_ISSUANCE_BLOCKED`, `RETIRED_UNITS_CANNOT_BE_REUSED`, `AVAILABLE_QUANTITY_EXCEEDED`, `HOLDER_BALANCE_EXCEEDED`, stale/authorization/integrity failures persist without changing a unit balance.

## Primary schema 1 (additive to DB v3)

| Collection | Key fields / relation |
|---|---|
| programs | id, name, owner_user_id, created_at |
| farmers | id, name, program_id |
| fields | id, field_id (normalized external identity), farmer_id, program_id, area_ha, region |
| activities | id, program_id, farmer_id, field_ref, field_id, field_area_ha, region, methodology_id/version, activity_year, crop_year, project_start_year, activity_type, activity_start/end, baseline_periods[], project_drainage, sustainability_confirmed, land_change, calculation_parameters, created_by/at |
| evidence_manifests | evidence_id, activity_id, hash, hash_algorithm, byte_length, actor, created_at, activity_period, field_id, methodology_id, evidence_type, crop_year, original_filename, source, review_status, content_storage, manifest_hash |
| evidence_content_checks | id, evidence_id, hash of reselected bytes, result (MATCH/MISMATCH), actor, created_at |
| methodology_runs | id, activity_id, created_by/at, methodology/rule versions, checks[], eligibility_status, baseline/project/extension days, evidence_completeness, calculation_readiness, calculation, reviewer_status (pending assist result), warnings, input_fingerprint, run_hash |
| primary_reviews | id, activity_id, run_id, reviewer, decision, note, created_at; separate human decision history |
| primary_records | id, activity_id, program_id, field/method/activity/period identity, field_identity_hash, input_fingerprint, run_id, reviewer, review_timestamp/note, reviewer_status, status, credit_status, snapshot, assessment, audit_chain_reference, candidate_record_hash |

Baseline/project drainage periods contain start, end and heading_date; baseline rows additionally contain crop_year. Calculation parameters contain baseline_ef, project_ef, gwp_ch4, coefficient_source, coefficient_version and stratum. No official coefficient defaults are stored. Calculation output preserves inputs, rule_version, calculation_version, formula, result (null), optional arithmetic_preview, unit, warnings and missing_parameters.

`primary_records.status = candidate_reviewed_draft`; `credit_status = candidate_not_formally_issued`. Manifest review_status stays pending as ingestion metadata; the separate human decision/record and exported evidence_review identify the review. No approval is inferred from file ingestion or a readiness PASS.

`audit_logs` keep prior names: created_at is timestamp, actor_user_id is actor, entity_type/entity_id are target. New fields are sequence, previous_hash, payload_digest and event_hash. Root `audit_chain` contains legacy_count, legacy_digest, event_count and head_hash. Legacy rows are unchanged. Root `primary_schema_version` marks the one-time migration.

Monitoring Package JSON is an export, not an additional collection. It contains the reviewed snapshot, manifests, field identity, rule reference, checks, calculation, decision, warnings, missing items, audit reference/current verification and candidate hash. Original file bodies and unrelated audit events are excluded. Program area sums distinct field rows once, not annual activity rows.
