# JapanFlux2024 JP-Hrt V2.00：BADM機器・時刻・管理情報とFCH4の照合

**2026-10-19、研究用一次資料クロスチェック。** [原著ZIP元データ調査](japanflux-jp-hrt-v200-original-source-gate-2026-10-19.md)の続き。ユーザーが提供したA20241210-020_2.00_selected(1).zipに収録されるBADM XLSX **6冊**、HH CSVおよびメタデータPDFをローカルで分析した。XLSX原本・個人連絡先・元の測定値はGitHubに再配布しない。[JapanFlux ADS](https://ads.nipr.ac.jp/data/meta/A20241210-020)／[DOI](https://doi.org/10.17592/001.2024121020)。

## 判明した事実と齟齬

| 項目 | 記載内容 | NaFTの扱い |
| --- | --- | --- |
| PDF V2.00 | CH4測定はHREAおよびChamber | BADMの測定手法と一致しない |
| BADM Site General Info | CO2, H2O, CH4ともにEddy Covariance | CH4のFCH4列にどちらの手法が対応するか未確認 |
| BADM UTC_OFFSET | **9時間** | 地点の宣言として記録するが、CSV行のUTC変換には承認しない |
| BADM FLUX_MEASUREMENTS_DATE_START | CO2, H2O, CH4とも**20130831** | CSVのFCH4数値候補は2013-06-01から存在。BADMの開始日より前に**1,689行** |
| BADM Instrument | Campbell EC150、Picarro G2301-f、Campbell CSAT-3A | 機器登録は確認。各FCH4値との機器マッピングは未確認 |
| BADM Disturbance and Management | DM_WATER = Irrigation | 水管理の語彙にすぎず、個別の中干し・湛水期間を確証しない |
| 原著HH CSVヘッダー | FCH4とFCH4_1_1_1を含むがFCH4専用QC列なし | 他の気象・CO2品質フラグをCH4へ転用しない |

FCH4は30分グリッド17,520行中1,915行のみ数値候補（残り15,605行欠測）。数値候補の初期時刻は201306010700、終端時刻の開始値は201309201030。**この矛盾だけで測定誤りと断定してはいけない。** BADMの提出・更新の範囲、PDFの調査方法とFCH4列の作成経路の説明を確認する必要がある。

## 実装した検査

- scripts/inspect-japanflux-jp-hrt-badm.py：元ZIP、BADM6冊およびHH CSVのSHA256で識別。標準PythonのZIP/XMLで事前許可した非個人メタデータだけを読み出し、整合性の事実をJSON出力する。元の測定値を表示・保存・再配布しない。
- research/japanflux-jp-hrt-v200/badm-concordance-2026-10-19.json：元のBADM6冊のハッシュと、UTC+9、手法の食い違い、開始日との矛盾、登録機器を記録。
- scripts/lib/japanflux-jp-hrt-badm-gate.mjs：元のPDFとBADMの方法不一致、BADM開始日よりも早いFCH4 1,689件、単位/QCが未検証という不変条件をチェック。
- scripts/lib/japanflux-jp-hrt-source-gate.mjs：BADM証拠を必須とし、自己申告による科学的承認や積算への移行を拒否。
- JavaScript・Pythonの合成異常系テストをtests/run.shに統合。

## ローカル再実行

~~~sh
python3 scripts/inspect-japanflux-jp-hrt-badm.py \
  --zip '/path/to/A20241210-020_2.00_selected(1).zip'

python3 tests/japanflux-jp-hrt-badm.test.py
node tests/japanflux-jp-hrt-source-gate.test.mjs
~~~

## 次に必要な原典レビュー

1. HREA/chamberとEddy Covarianceの記載差の理由、および各FCH4値の作成方法。
2. BADMの20130831より前のFCH4数値候補1,689行の由来。
3. FCH4の質量・モル単位、符号、補完区分とCH4専用QC・機器校正。
4. UTC_OFFSET +9をCSVの時間列へ適用するための時刻仕様。
5. 圃場別の水管理、土壌、作期と制度上の基準条件。

上記が説明できるまでは観測値としての積算、年積算・J-クレジットの認証計算は**禁止**。元CSVのFCH4の数値は研究用の未判定候補にとどめ、年間排出量と認証CO2eはnullのまま。
