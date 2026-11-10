# NaFT P59｜鳥取県農耕地土壌GIS：原本来歴・行政属性監査・安全な再利用

## 対象原本と検証方針

2026-11-10に提供された鳥取県.zip（5,198,920 bytes、SHA-256 a4bdf588790b48d87d445d25c03151caae781937b5ccb3b3054e574acf558915）を監査。元ZIPにはk31鳥取県のDBF/PRJ/SBN/SBX/SHP/SHP.XML/SHXの7ファイル（展開計8,588,590 bytes）が含まれる。ShapefileはESRI POLYGON（shapeType 5）、GCS_JGD_2000で、SHP/SHX/DBFとも1,032件。XML元メタデータ作成日2017-01-17。

出典候補は農研機構「日本土壌インベントリー」（https://soil-inventory.rad.naro.go.jp/download5.html）。公式ZIPとのバイト単位照合、権利者認証、再配布の明示的許諾は未確認。元ZIP・座標付きSHP・DBFはGitHubへ公開せず、元バイトのSHA-256・派生集計・独立監査手順のみ収録する。

## 地目別集計（単位：ポリゴン件数）

| 田 | 普通畑 | 牧草地 | 樹園地 | 計 |
|---:|---:|---:|---:|---:|
| 352 | 358 | 41 | 281 | **1,032** |

## 原本属性と要照合警告

- 市町村名19種類、JCODE20種類、JCODE×名称40組、GUN×名称33組。群コード20種類・土壌詳細分類97種類、土壌分類必須フィールドの欠損0件。
- 兵庫県系JCODE 28586が2件（岩美町1件・鳥取市1件）。元データの県名KEN_1はいずれも鳥取県。原因未確定のため値を修正しない。
- 兵庫県の郡名「美方郡」が2件（岩美町の田1件・鳥取市の牧草地1件）。県境・郡名の対応を無断補完しない。
- GUN空欄356件。複数JCODEと市町村名の多対多対応、複数の非空郡名を持つ市町村名が存在。行政コード・郡名で現行自治体へ機械JOINしない。
- 1,032はポリゴン数であり農地面積ha、土壌炭素貯留量、メタン排出量、CO₂e削減量、認証済みJ-クレジット量ではない。

## 再現手順

公開データ台帳：research/p59-tottori-soil-shapefile-source-v1.json。
公開CIで実行：python3 scripts/p59-tottori-soil-audit.py audit および node tests/p59-tottori-soil-gis.test.mjs。
元ZIPを保持する許諾済みローカル環境だけで実行：python3 scripts/p59-tottori-soil-audit.py verify /private/鳥取県.zip。
verifyはZIP全バイトSHA-256、7ファイルのハッシュ、SHP/SHXの1,032インデックス・レコード、DBF1,032行のCP932解釈、地目・JCODE・GUN集計を照合する。公開CIでは非公開ZIPの全バイト検証を行わない。

GX Data AtlasではprefCode=31選択時に地目別件数、JCODE×市町村名40組、GUN×市町村名33組、および要照合を表示。原本のデータ品質問題を隠さず、人手確認後の別レイヤーへの接続を前提とする。
