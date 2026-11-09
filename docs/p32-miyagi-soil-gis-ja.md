# NaFT P32｜宮城県・農耕地土壌GIS原本の検証とGX Data Atlas反映

2026-11-09、ユーザー提供の「宮城県(1).zip」を解凍し、Shapefile、属性DBF、空間参照、Esri XMLを検査した。北海道P29、青森県P30、岩手県P31とは独立した宮城県コード04のソースとして受け入れた。

## 原本の来歴と固定

- 原本ZIP：10,603,446バイト。SHA-256 d6f9d7f637ae210d269c806aafcea6b9498c9cc3ff37068db4ae012bc6606c4f。
- 日本語ZIP名はCP932由来：k04宮城県/k4宮城県.dbf、.prj、.sbn、.sbx、.shp、.shp.xml、.shxの7ファイル。
- 全ファイルのサイズ・SHA-256は research/p32-miyagi-soil-shapefile-source-v1.json に記載。7ファイルの非圧縮合計16,787,142バイト。
- Shapefile：ESRI POLYGON、JGD2000（GCS_JGD_2000）、形状1,588件。SHP/SHX/DBFの1,588件と一致。
- bbox：東経140.28617994472927–141.67068446607755、北緯37.750934461853944–38.981866385479684。
- Esriメタデータ作成日2017-01-17。これは原本メタデータの作成日であって、2026年の現況調査日ではない。
- 土壌「群コード」16種、「包括_統群」96種。県名属性は全件「宮城県」、SICHOは全件空欄。

## 地目別の土壌ポリゴン件数

| 地目 | ポリゴン数 |
| --- | ---: |
| 田 | 625 |
| 普通畑 | 551 |
| 牧草地 | 216 |
| 樹園地 | 196 |
| **合計** | **1,588** |

39個のJCODEがあるが、04101～04105は仙台市の各行政区（青葉区、宮城野区、若林区、太白区、泉区）。「39市町村」とは表現せず「39行政区分」とし、市町村相当のまとまりは35（仙台市の5区を1市として扱う場合）と区別する。
JCODE 04423の元名称は「富谷町」。過去の名称を現行自治体名に自動置換せず原本の通り保持。地目・自治体境界の年次整合も保証しない。

## 取り込んだ成果物

- research/p32-miyagi-soil-shapefile-source-v1.json：7ソースのSHA、ZIP SHA、座標系、分類、39行政区分×4地目の集計、法的・科学的境界。
- scripts/p32-miyagi-soil-audit.py：原本ZIPの全バイト、メンバSHA、SHP/SHXヘッダー、DBFの全1,588行、行政区分別集計をPython標準ライブラリだけでオフライン検証。
- src/gx-miyagi-soil.js：GX Data Atlasの都道府県「宮城県」を選択すると、地目別カード・39行政区分の詳細表と制約を表示。
- tests/p32-miyagi-soil-gis.test.mjs：台帳整合性、旧称・仙台市5区の保持、画面制御・改ざん拒否のテスト。

原本ZIPを保持している環境での完全検証：

    python3 scripts/p32-miyagi-soil-audit.py verify '/local/private/宮城県(1).zip'

GitHub CIでは原本は公開しないため以下の台帳監査を実行：

    python3 scripts/p32-miyagi-soil-audit.py audit
    node tests/p32-miyagi-soil-gis.test.mjs

CIのaudit成功だけで原ZIPの内容を検証済みと主張しない。元ZIPは受入時に別途実読・SHA-256照合した。

## 利用の制約

元データの発行者・再配布許諾を独立に確定できていないため、元Shapefile・DBFやZIPは公開GitHubにコミットしない。公開は原本を特定するハッシュと派生集計だけ。

ポリゴンの数は筆数、面積ha、農地所有者数ではない。2017年メタデータの土壌分類と2024年水稲統計・JAXA土地被覆は異なるため無検証で空間結合しない。CH₄実測値・土壌炭素実測・公的排出係数はなく、認証済みCO₂eやJ-クレジットの計算・発行は行わない（official_credit_tco2eはnull）。
