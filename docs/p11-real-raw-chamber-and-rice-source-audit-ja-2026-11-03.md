# NaFT P11｜原ファイルを取得してからの検証・投入（2026-11-03）

## 実際にGitHubへ投入した原ファイル

研究公開リポジトリ **[mthayne527/fluxCH4](https://github.com/mthayne527/fluxCH4)** の、実在するファイル `inst/extdata/sample_data_CH4.csv` の全テキスト（**292,577 bytes、3,005観測記録、12列、5つのチャンバー測定セット**）をGitHub経由で取得し、NaFTの `research/p11-upstream-chamber-raw/sample_data_CH4.csv` へ**元CSVの内容そのままで**追加した。

- GitHub上流版：`9977f63563acebaa4e021801beadfebb06d0ed48`
- 原ファイルGit blob SHA-1：`891ab51885c79cccbbe5d3d4625854ba4eab5923`
- 上流ソフトウェアのMITライセンス通知（Michael W. Thayne, 2025–2026）を `UPSTREAM-LICENSE.txt` に同梱。元リポジトリにデータ専用ライセンスの別記は見つかっていないため、原著者の原ファイルとの帰属を明記。
- `scripts/p11-original-chamber-source-audit.mjs` は**Git blob SHA-1とNaFTコピーの内容一致**をチェックし、実バイトのSHA-256を再計算、CH₄濃度(ppm)・容積(m³)・面積(m²)・気温(℃)・大気圧(mbar)・秒単位時系列の値域／重複／欠測を監査して、再現可能なレシートを出す。
- 5回のチャンバー測定セット e1、e10、e11、e12、e13（各601点）。**機器が記録した濃度であり、日次排出フラックスでも水田の実証結果でもない。** 元サンプルの `inst/examples/run_example_CH4.R` はLI-7810記録を入力に使用するとしているが、圃場位置や機器校正の独立確認は行っていない。

## 水田の現地採取データも直接確認（原データは未転載）

別の**[2023年水田研究の公開GitHub](https://github.com/echeverriaseba/Thesis_Gasera)** の原CSV `data/Field_sheet_chrom_2023.csv` を、GitHubから実際に読み、列構造・ファイル長・Git blobを照合した。論文：[Climate change mitigation through irrigation strategies during rice growing season is off-set in fallow season](https://doi.org/10.1016/j.jenvman.2025.125060)。

- ソースの固定版：`e51c176983c5bc5c38a6c7f15a0fcbb49052c58f`
- CSV原本：**122,694 bytes、718行、28列**、Git blob `575c6bc2826c1b0a7e829ea45463c77ac7048bbd`。
- 採取日は20日、2023年。管理区分は **AWD 239行、MSD 239行、CON 240行**。
- 原資料は個々の採取時点の `CCH4_ppm`、`CCO2_ppm`、`NN2O_ppm`などの**ガス濃度**。718日間の実測データ、あるいは718件の有効な日次排出係数では**ない**。
- 補助資料 `data/Yield_2023.csv` は15行、`data/Field_records_Gasera.csv` は537行を実際に確認。生のガス濃度の比較には測定時点・チャンバー寸法・温度・圧力・回帰モデル・QCをつなぐ必要があり、単純連結しない。
- 研究リポジトリ内で**データ再配布ライセンスを独立して確認できなかった**ため、生の `Field_sheet_chrom_2023.csv` をNaFTへコピーせず、Git blob・行構造・出典・監査制約を `research/p11-rice-chromatography-source-2026-11-03.json` に格納した。将来的に元ファイルを利用権限に沿ってローカルで保管した場合、`scripts/p11-rice-chromatography-guard.mjs` で完全一致検査できる。

## 最新の公式統計・長期統計の元ファイル探索

| ファイル | 事実 | 状況 |
|---|---|---|
| [2025年産 e-Stat 都道府県別水稲確報Excel](https://www.e-stat.go.jp/stat-search/files?stat_infid=000040420282) | 農水省の2026-03-06公開、表番号1の水稲（全国農業地域別・都道府県別）Excel | 正式な存在を確認。ただし**コンテナ側のDNS制限でダウンロード失敗**。2025年47県分を実インポート済みと主張しない |
| [Gimje水田メタン原本](https://zenodo.org/records/17111992) | `ch4.zip` と `input_fields_meta.xlsx`、原著とチェックサムはP8で登録 | 取得を再試行したが環境のDNS制限により未取得。P8の原本→P7パイプラインは実装済み |
| [日本1883–2022年・6作物×47県](https://doi.org/10.6084/m9.figshare.29135699) | [Scientific Data論文](https://www.nature.com/articles/s41597-025-06394-7)のCC BY 4.0資料。圃場のCH₄実測ではなく、歴史的農業統計 | 元ZIPの実バイト取得・SHA固定は未達 |
| [日本3地点・水田気象・フラックス観測](https://data.mendeley.com/datasets/tv23z95r5g/2) | 西都・佐賀・阿蘇の気象・フラックス等。CC BY 4.0。項目辞書からCH₄列の有無を確認すべき | 元CSV未取得、メタン実測と同一視しない |

**GitHub公開原ファイルの存在を直接確認したことと、外部配布ファイルを自分の作業環境にダウンロードしたことは違う**。本実装はこれらをメタデータの状態・数値で明確に区別する。

## CLIの使い方

```bash
node scripts/p11-original-chamber-source-audit.mjs audit \
  > /tmp/naft-p11-chamber-qc.json

node scripts/p11-original-chamber-source-audit.mjs verify \
  research/p11-upstream-chamber-raw/sample_data_CH4.csv \
  /tmp/naft-p11-chamber-qc.json

# 研究元サイトから許可された範囲で自分のディレクトリへ原本を取得した場合のみ
node scripts/p11-rice-chromatography-guard.mjs sources
node scripts/p11-rice-chromatography-guard.mjs verify-original \
  /private/research/Field_sheet_chrom_2023.csv

node tests/p11-real-chamber-source-audit.test.mjs
node tests/p11-rice-chromatography-guard.test.mjs
bash tests/run.sh
```

`verify-original` は、確認された原CSVのサイズとGit blobを一致させた場合にのみ、CH₄濃度、採取区分、日付の検査を行う。正式なCH₄フラックスや炭素クレジットは計算せず、別途物理量・測定器校正・モデルを審査する。

## 次の一段

- **最優先**：2025年都道府県別e-Stat Excel原本の取得とファイルSHA-256固定、国/県コード・水稲全体/主食用・ふるい目幅・2024年の公表統計との版判別。原本不在で2025年47行を捏造しない。
- **次**：水田研究のチャンバー原観測で、原著に定義された単位と校正情報を読み、定数・体積・面積・時間差から導出したガス濃度傾きとCO₂/N₂O/CH₄フラックスの式を独立再演算できる条件を明文化。水管理、収穫量との因果関係は研究デザインに従い別途判断。
- **制度**：P5–P9のJ-クレジット・Verra・GSによる証拠要件への接続には、制度正式適用条件、測定法と監査実務の外部確認が不可欠。未確認データは公式クレジット算定へ自動投入しない。
