# NaFT P7｜水田CH₄観測データの供給源拡充とオフライン品質検査（2026-11-02）

## 目的

競合する農業dMRVには、**現地の水田実測データ**と衛星・気象データの対応、測定方法の相違、独立QCの証拠を説明する能力が必要。NaFTのP7では6件の新規公開ソースを選び、既存Gimje研究データ1件を追加検証し、**出典候補7件の研究用索引**を更新した。ただし、**今回新規取得・検証できた外部の実測生データは0ファイル・0行**。データ発見と新規データの投入完了を混同しない。

| ソース | 原典 | スコープ | 今回の状態 |
|---|---|---|---|
| 中国・武漢大学 AWD CH₄/N₂O | [Zenodo 14010496](https://zenodo.org/records/14010496) | フラックス／AWD実験用Excel、公開MD5 `8d954606493316fa897d48b8f05f57d4` | 出典・ファイル名確認／**実バイト未取得**／ライセンス要再確認 |
| メタン気泡放出・MLデータと再現コード | [Zenodo DOI 21259926](https://doi.org/10.5281/zenodo.21259926)・[大学機関台帳](https://investiga.upo.es/documentos/6a833a21cd36db0f5e3e9016) | モデル外部ベンチマーク | 大学台帳ではCC BY 4.0、**配布ファイル個別ライセンス・実バイト未照合** |
| FAOSTAT QCL | [FAO正式カタログ](https://data.fao.org/catalog/iso/d24a448b-3b62-4c09-8c1d-4a39bb599876) | 国・年別稲作収穫面積、生産量、収量の**集計統計** | CC BY 4.0確認／**実数行未取得**。同じ圃場の年間作付け回数をまたいで面積が二重計上される場合に注意 |
| NASA POWER | [日次API仕様](https://power.larc.nasa.gov/docs/services/api/temporal/daily/) | 格子化した気温・降水量などの補助情報 | API仕様確認／**日時・緯度経度を指定した実データ取得未実施** |
| Copernicus Sentinel-1 | [公式Sentinel-1製品一覧](https://dataspace.copernicus.eu/data-collections/copernicus-sentinel-missions/sentinel-1) | CバンドSARによる水田水管理の**補助的調査** | SARの製品カタログ確認／シーン未取得・AWD検証なし |
| IPCC 2019 Refinement | [2019 Vol4 Ch5の公式公開索引](https://www.ipcc-tfi.iges.or.jp/public/2019rf/vol4.html) | 国別インベントリ推計の方法論、**プロジェクト固有の認証係数とは別** | 存在・公開索引を確認、原PDF・改訂箇所のSHA未取得 |
| 韓国Gimje（既存候補） | [Zenodo 17111992](https://zenodo.org/records/17111992)・[研究コード](https://github.com/lhs0218/gimje_ch4) | 2022〜2024年の日次静置チャンバーCH₄フラックス | **旧来の候補**で新規には数えない。公開GitHubの`ch4.zip` blob SHA-1 `55a376b6ce071a22f7676e15d5a88b5fd6c1babe`を追加記録。元データのSHA-256、QCは依然未検証 |

公開GitHubのGit blob SHA-1はファイル内容のGit内部識別であり、Zenodoの配布ファイルのSHA-256や出版社保証と**同一視しない**。研究用のメタデータは再配布するが、元CSV/XLSX/ZIP/SAR画像をライセンス確認なしに公開リポジトリへ転載しない。

## P7の実装

- `research/p7-rice-observation-source-intake-2026-11-02.json`：ソース分類、地域・DOI、観測粒度、MD5・Git blobの公開識別子、ライセンス確認状態、許されない用途、ファイル未取得状態を明記する。
- `scripts/p7-offline-observation-qc.mjs`：**手元で、出典を明示して正規化したCSV中間ファイル**だけを受け付ける。入力CSVのSHA-256、レコードの重複・時点・不正な日付、欠測、単位の不統一、マイナスフラックス、異常な大きさ、水管理、測定方式、公開元が付けたQCラベルの違いを検出し、人間向けのレビューリストをJSONで出す。
- `fixtures/p7-synthetic-daily-flux-qc.csv`：重複、欠測、異常値、2024-02-30、負値、不明な測定方法を盛り込んだ**人工テストデータ**。実際の農地のデータではなく、実装の合格数に数えても観測サンプルとしては数えない。
- `tests/p7-offline-observation-qc.test.mjs`：実測と気象・集計・SAR・IPCCデータとの取り違え防止、不正単位や偽の独立QCの禁止、JSON改ざん・ハッシュ変更に対するリプレイ検証。

### インポートするCSVの契約

現段階では、**ZenodoのZIP/XLSXから直接自動変換したり、発行元原本と一致すると自動宣言する機能はない。** 以下の8カラムの研究用**中間CSV**へ、人間が原本の列・単位・日付の意味を確認してマッピングすることが前提。

```csv
source_record_id,field_id,observation_date,flux_value,flux_unit,water_management,measurement_method,qc_flag
R1,FIELD_A,2024-06-01,0.12,g_CH4_m2_day,AWD,STATIC_CHAMBER,REPORTED_PASS
```

※上の1行は**合成例**。正式な実測値ではない。

- `flux_unit`: `g_CH4_m2_day` または `mg_CH4_m2_day` のどちらかを毎行明記。互換性のない単位・体積濃度・kg/ha/yearなどは拒否。
- `water_management`: `AWD` / `CONTINUOUS_FLOOD` / `SINGLE_DRAINAGE` / `UNKNOWN`。
- `measurement_method`: `STATIC_CHAMBER` / `EDDY_COVARIANCE` / `UNKNOWN`。
- `qc_flag`: `REPORTED_PASS` / `FLAGGED` / `UNKNOWN`。**REPORTED_PASSは配布者の自己評価であり、独立QC合格を意味しない**。
- 負のCH₄フラックスは吸収・ノイズ・補正の可能性があるので削除せず要レビュー。極端に大きい値も有効性の証拠を残して判定。欠測の**自動ゼロ補完をしない**。
- 日次の複数測定は反復観測の可能性もあるため、同日・同圃場は自動削除せず要レビュー。単位混在、欠測、不明なデータを集約して有効な総排出量とみなさない。
- **平均値／累積積分／削減率／J-クレジットやVerraにおける公式認証量は出力しない**。原データ出所、測定の代表性、QA/QC、外部監査が未検証だから。

### 利用方法

```bash
node scripts/p7-offline-observation-qc.mjs sources

node scripts/p7-offline-observation-qc.mjs analyze \
  KR_GIMJE_DAILY_2022_2024 /secure/research-normalized.csv \
  > /tmp/p7-source-review.json

node scripts/p7-offline-observation-qc.mjs verify \
  KR_GIMJE_DAILY_2022_2024 /secure/research-normalized.csv \
  /tmp/p7-source-review.json

node tests/p7-offline-observation-qc.test.mjs
bash tests/run.sh
```

※上の `/secure/research-normalized.csv` は**利用者が権利・原資料の列を確認した後に作成するパス例**であり、今は実ファイルを同梱していない。

## 次段階（P8）の確度向上

1. 実ファイルを研究利用条件に従い取得して**公開のMD5と独立SHA-256**を照合し、原データのヘッダーと値域、検出限界、採取日付・水管理ラベルを検査する。
2. 静置チャンバーと渦相関の違い・測定期間・層別・測定単位を独立レビューした後に**実測原本 → 正規化CSVの行単位対応表**を作る。
3. 同じ地点と日付のNASA気象／Sentinel-1の補助資料を比較するが、格子やSAR推定を圃場の実測と偽らない。
4. 圃場条件を満たし欠測・不確実性を明記したものだけを独立再演算へ渡す。形式的な入力成功だけで認証に進めない。
