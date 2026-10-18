# NaFT日本語版：外部観測CSVのオフライン受入・独立再演算（2026-10-19）

**Research only / 非認証。** このPRでは、従来サンプル専用だった研究用CH₄観測再演算CLIを、ユーザーが保持する **ローカルCSV＋JSON manifest** でも呼び出せるようにした。データのダウンロード、アップロード、出版社真正性検証、正式J-クレジット審査は実施しない。ブラウザUIや既存のv1厳格積算エンジンの仕様は変更しない。

## 実行例

```sh
# 既存の人工データをそのまま再演算（互換性維持）
node scripts/replay-japan-observation-adapters.mjs daily

# ローカルで入力ファイルをコピーしてから明示的なファイルパスを指定
cp research/japan-observation-adapters-2026-10-19/daily.csv /tmp/naft-observation.csv
cp research/japan-observation-adapters-2026-10-19/daily.manifest.json /tmp/naft-observation.manifest.json
node scripts/replay-japan-observation-adapters.mjs \
  --csv /tmp/naft-observation.csv \
  --manifest /tmp/naft-observation.manifest.json

# 科学計算・CLI両方のテスト
node tests/japan-offline-import-cli.test.mjs
python3 tests/japan-observation-adapters-independent.test.py
bash tests/run.sh
```

実測原本に使う場合は、研究者本人が正規の取得経路・権利・原典DOI・測定方法・機器QC・時間解像度を確認する必要がある。**原本CSV列を無審査で置き換えて読み込まないこと。** `start_utc,end_utc,value,qc_status` の正規化契約に合致する、**区間平均フラックスのみ**許可する。生のチャンバー濃度、瞬時測定、モデル推定、時刻未確認の記録はこのCLIにそのまま通せない。単位と質量基準の間違いを防ぐため、[観測Adapterの5方式](japan-observation-adapter-coverage-2026-10-19.md)を参照する。

## 検証条件・安全上の境界

- CSV: 2,000,000 bytes以内、UTF-8、LF改行、末尾改行必須。manifest: 50,000 bytes以内、UTF-8 JSON。いずれもローカルの通常ファイルだけを受け付ける（起動時の `stat` と読込後サイズを検査）。
- `csv_sha256` は**読み込んだファイルの原バイト**のSHA-256と一致しなければ処理を停止。例: `sha256sum /tmp/naft-observation.csv`。**自分で記入したSHA-256の一致だけでは出版社発行原本かどうかは証明できない。**
- `data_class` は `SYNTHETIC` または `USER_SUPPLIED_UNVERIFIED` のみ。外部取得した研究用ファイルは実測でもこの後者であり、承認データ・独立検証済みという種類へ自己昇格できない。
- manifestに `original_publisher_bytes_verified:false`、`conditions_independently_matched:false`、`official_eligibility_verified:false`、`gap_fill_policy:"FORBID"` を必須指定する。source URL、site・plot、測定法、ライセンス状況等の欄は、**真偽が別途確認済みという意味ではない**。
- 観測期間外／重複／順序入替／単位不一致／QC矛盾／未対応時刻形式は中止。欠測・補間区間は観測量から除き、全期間未網羅なら `full_window_total_*` を `null` に固定する。
- 出力は `RESEARCH_UNATTESTED`。 `certified_tco2e`、`official_japan_factor_applicable`、`uncertainty_interval`、`causal_attribution` は `null`。**検算は制度適格性・観測の信頼性を保証しない。**
- ファイルは指定されたローカルパスから読み取り、結果JSONを標準出力するだけ。外部通信・GitHubへの生データ送信・新たなストレージは追加しない。標準出力の結果にはファイルパスを含めない。

## 独立演算・残された課題

同一CSV・manifestについてJavaScript BigIntの積算値、Python Decimalで別実装した積算値、QC coverage、部分積算時に全期間値を返さない制御をテスト。従来の `daily` fixture の**完全一致**に加え、`USER_SUPPLIED_UNVERIFIED` として指定パスから読み込む独立突合を回帰テストへ追加した。新しく取得・承認された実測原本は一件もない。

次段階では、Publisher MD5/SHA-256照合済み研究データから**再配布可能性と利用許諾**を確認し、各データセットのネイティブ列・時刻・観測QCを別途仕様化した上で専用Adapterを開発する。取得した論文集計値を元の観測区間で再現できるかどうかは、まず測定条件ごとの照合から始める。数値差を説明できない場合、任意に要因へ配分しない。
