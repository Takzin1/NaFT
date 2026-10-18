# NaFT日本語版：公表集計値との差分検査に進むための研究用突合ゲート（2026-10-19）

**算術検証のための入口であり、原著の原本検証ではない。** 前段の [観測CSVオフライン再演算](japan-offline-observation-import-2026-10-19.md) の結果を、外部から持ち込んだ「同一期間・区間平均に基づく累積CH₄量」の参照値と比較する。比較によって原著計測が再現された・J-クレジットが認証された・測定環境が一致したとは**判定しない**。

## 使用方法

```sh
# リポジトリに同梱した人工データの算術比較
node scripts/reconcile-japan-observation.mjs synthetic-interval

# 手元にある、形式を事前にレビューした正規化CSVとJSON参照値を比較
node scripts/reconcile-japan-observation.mjs \
 --csv ./normalized-observations.csv \
 --manifest ./normalized-observations.manifest.json \
 --reference ./supplied-aggregate-reference.json

# 独立演算・負例・パス・容量・原バイトSHA検査
node tests/japan-aggregate-reconciliation.test.mjs
python3 tests/japan-aggregate-reconciliation-independent.test.py
bash tests/run.sh
```

**注意：** GitHubに原著観測原本・ライセンス未確認の元ファイルは追加していない。リポジトリ内の `research/japan-aggregate-reconciliation-2026-10-19/synthetic-interval-reference.json` は人工の参照集計値（2.25 mg-CH₄/m²）であって出版データではない。Yagi（1996）、Nishimura（2004）で原著に掲載された値は、観測原系列・測定期間全体の原本照合ができないので**今回の突合対象に設定していない**。

## 必須の整合条件（Fail Closed）

1. ローカル入力：CSVは最大2,000,000バイト、manifest/reference JSONはそれぞれ最大50,000バイト。ネットワーク取得・原ファイルのGitHubへの送信は実施しない。
2. 既存AdapterでCSVの**原バイト**SHA-256、測定区間、QCと単位を再検査する。事前に作った再演算結果JSONだけを信じない。
3. `coverage_status=COMPLETE_OBSERVED` かつ全観測秒数が一致し、除外QC・未代表期間・gap-fill が一切ない場合のみ比較する。partial/no observation は**比較拒否**（全期推定を行わない）。
4. 参照値の `source_uri/site_id/plot_id/treatment/measurement_method/observation_start_utc/observation_end_utc/country/gas/mass_basis/data_class/source_license_status` がmanifestとすべて同値。参照値の `csv_sha256` は入力CSVのSHA-256と一致させる。**これらは本人が宣言した一致であって、第三者による環境適合性の実証ではない。**
5. `aggregate_semantics=EXPLICIT_WINDOW_CUMULATIVE_CH4`、`window_basis=EXPLICIT_OBSERVED_INTERVALS`、`aggregate_unit=mg_CH4_m2`。参照値の質量基準は `CH4_MOLECULAR` のみに限定。CH₄-C（炭素質量）の元データは観測Adapterの内部換算機能と混同しないよう、本突合エンジンでは意図的に**未対応として停止**。
6. `data_class` は `SYNTHETIC` または `USER_SUPPLIED_UNVERIFIED` に限る。入力が `original_publisher_bytes_verified=true`、`conditions_independently_matched=true` または `official_eligibility_verified=true` を自称しても拒否。
7. 出典自体・論文集計の出典原本は独立検証しない。報告値と表示桁 `printed_resolution_mg_ch4_m2`（正の小数）を**参照データ側で別々に宣言**する。計算値との差分 `replayed_minus_reported` を9桁小数の符号付きmg/m²で出力。

### 出力解釈

- `display_resolution_compatible=true` は差分の絶対値が**宣言された表示最小単位の半分以内**という算術比較で、丸めが誤差の原因であるとの断定ではない（`rounding_cause_verified=false`）。
- `reference_json_sha256` は読み込んだJSONオブジェクトの `JSON.stringify` に対するハッシュ（キー順序に依存）。**出版社の原バイトの独立ハッシュではない**。
- `status=RESEARCH_ARITHMETIC_NOT_SOURCE_VERIFICATION`、`reference_content_independently_attested=false`、`environmental_conditions_independently_verified=false`、`original_publisher_observations_reproduced=false`。
- `uncertainty_interval`、`causal_attribution`、`official_japan_factor_applicable`、`certified_tco2e` は常に `null`。見かけ上の一致から、物理的再現や制度上の排出削減を推論しない。

## 次に実測へ移る際に必要なこと

出版元から正式に入手でき、利用許諾を確認したデータの原バイト・権威ある署名/配布記録を照合し、測定周期・観測器/校正/QC・時間帯・区間平均の推定方法・作期・管理条件を調べる。原著記載の期間累積と同じ対象・同じ処理の**実際の観測原系列**がある場合だけ、原著原本の転記をダブルチェックして参照値を構築する。とくに原著が間欠測定値に線形補間を用いた場合、今回の `gap_fill_policy=FORBID` の結果とは**原理的に比較対象が異なる**ため、別の根拠付き補間プロトコルを先に検証する必要がある。
