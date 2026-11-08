# P27｜東南アジア9か国 水田CH₄再現研究パック v1.0.0

**2026-11-08 / NaFT Core。歴史的な国別排出推計・不確実性の研究用取込。個別圃場の認証、権利保有、Web3発行を意味しない。**

## 受領・解凍済みの原本

| 項目 | 結果 |
|---|---|
| ZIP原本 | zenodo_package_v1.0.0.zip |
| 原本サイズ | 3,863,169 bytes |
| SHA-256 | 41750fd4d1e1b83a0a5855808d9b9cbed78eebbfa2282c331cf1602cdc635b09 |
| 展開後 | 53ファイル、41,913,541 bytes |
| 内訳 | Python 22、CSV 13、NetCDF 8、NPZ 2、その他8 |
| 年度・範囲 | 2020–2021、東南アジア9か国、0.1度格子 |
| 著者 | Gianmarco Goycochea Casas / Zool Hilmi Ismail |
| コード／データの権利 | MIT ／ CC BY 4.0（ZIP付属LICENSE） |

タイトル：*Rice CH4 inventory and validation data + code for Southeast Asia (0.1 deg, 2020-2021)*。付随原稿 *Emission factors dominate the rice methane gap with EDGAR in Southeast Asia: a 10 m harvested-area assessment* は、ZIPのREADMEに**under review**（査読中）と記載。確定したZenodo DOIはアーカイブ内に未記載。勝手に確定DOI・査読完了とは表示しない。

原著者、著作物名、バージョン、MIT／CC BY 4.0を明示。元のOpen-SEA-Rice-10、JRC EDGAR、Peat-ML、TROPOMI等の権利は別途検討が必要。

[完全原本のSHAと研究上の制約](../research/sea9-rice-ch4-2026-11-08/source-register-v1.json)

## 実データの照合結果

- **行政界マスク内9か国**：6.613796 Tg CH₄/年（[国別CSV](../data/sea9-rice-ch4-2026-11-08/ch4_country_comparison.csv)）。
- **計算領域の矩形全域**：6.745448 Tg CH₄/年（[全域集計JSON](../data/sea9-rice-ch4-2026-11-08/04_inventory_summary.json)）。**両者は地理的集計範囲が違う**。
- EDGAR v8.0の行政界マスク内9か国合計：9.910227 Tg CH₄/年。
- **Monte Carlo 2,000試行**：平均7.229279 Tg、中央値6.795320 Tg、5–95%分位点3.855539–12.308781 Tg（[統計JSON](../data/sea9-rice-ch4-2026-11-08/ch4_mc_diagnostics.json)）。
- 2,000試行のNPZから平均・分位点・標本標準偏差・EDGAR未満比率を再計算し、パッケージ統計と照合済み。**元30GBの入力を使うMonte Carlo全パイプラインの再実行ではない**。
- EDGARの国別行合計は9,910.226825 Gg、総計行は9,910.227 Gg。0.000175 Gg程度の表示丸めを記録し、黙って修正しない。
- ZIP READMEの「栽培面積28.98×10³ha」は、同梱JSONの28979.929 kha（28.98百万ha）と単位が整合しない。元資料の記載を尊重して**未解決の表記不一致**として保持。

TROPOMIの大気カラム濃度（ppb）は水田の地表排出フラックスではない。また本パックは登録簿の発行済みクレジットでもない。

## 全53ファイルの安全なローカル再展開

    python3 scripts/p27-sea9-archive-intake.py \
      --archive "/local/zenodo_package_v1.0.0.zip" \
      --out ".naft-local/sea9-v100" \
      --extract-all

- source/zenodo_package/… に**全53ファイル**をローカル再展開。
- source-members-sha256.json に各ファイルのサイズとSHA。
- sea9-countries.ndjson に出典付き9か国の値。
- intake-report.json に原本一致・空間スコープ・Monte Carlo統計・認証範囲を保存。

ZIPのSHA・サイズ・ファイル数・展開サイズ、パストラバーサルとsymlink、国別整合とNPZ数値を検証。外部APIや上流Pythonコードの実行はしない。CIでは外部原本を配布せず、架空NPZ・出典固定・9か国統計のみ検査する。

    python3 tests/p27-sea9-archive-intake.test.py

## GitHub投入範囲と残課題

**GitHubへ登録済み**：固定出典台帳、国別10行の実データ、2統計JSON、標準ライブラリの安全なZIP取込プログラム、研究用テスト、文書。**GitHubへ未投入**：NetCDF/NPZのバイナリ原本、元の22 Pythonスクリプト、ZIP全体。公開Repoへ全53原本を反映したとは主張しない。

元の完全再実行には上流10mタイルやEDGAR等の外部原本、Earth Engine、合計約30GBの元入力が必要。作者の一部Pythonスクリプトには特定PC向けの絶対パスがあり、環境を修正しないまま自動実行しない。

本データは**歴史的な広域推計**。個別圃場のAG-005排出削減量、J-クレジットのシリアル、正規の法的権利、暗号資産の発行権限を示さない。研究の品質評価、制度認証、商用発行は独立のゲートとして保持する。
