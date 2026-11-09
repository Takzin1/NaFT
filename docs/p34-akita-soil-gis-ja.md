# NaFT P34｜秋田県農耕地土壌GISの受入検証とGX Data Atlas反映

2026-11-09、ユーザー提供の「秋田県(1).zip」を解凍し、全7ファイルの原バイト・SHA-256、Shapefile形状1046件、DBF全1046レコードを検査。北海道（P29）、青森（P30）、岩手（P31）、宮城（P32）、山形（P33）とは独立した秋田県（コード05）の研究用ソースとして登録。

## 原本の仕様

- ZIP：10,481,614 bytes。SHA-256 `3c5b27c3d7da16265add6de7958e10d0cd7cee286d7de093d8f3df760621fa34`。
- 元ZIPのCP932ファイル名：k05秋田県/k5秋田県.dbf、.prj、.sbn、.sbx、.shp、.shp.xml、.shx（計7個）。展開後合計16,098,322 bytes。
- 原本の7構成ファイルそれぞれのバイト数・SHA-256は `research/p34-akita-soil-shapefile-source-v1.json` に固定。
- GIS：ESRI Polygon（shapeType=5）、1,046レコード。SHPとSHX形状1,046件、DBF属性1,046件が一致。pyshpでも全1,046形状を正常に走査した。
- 座標系：JGD2000（GCS_JGD_2000）、bbox [139.69867954562713,38.9384878368476,140.97844407518144,40.42182813770626]。
- Esri XMLメタデータの作成日は2017-01-17。最新の農地現況・調査日とは解釈できない。
- DBFのKEN_1全件「秋田県」。地目4区分、25市町村コード（JCODE 5桁）。SICHO全件空欄。
- 土壌「群コード」17種類、「包括_統群」79種類。

## 原本属性の地目別ポリゴン件数

| 地目 | 件数 |
| --- | ---: |
| 田 | 432 |
| 普通畑 | 342 |
| 牧草地 | 113 |
| 樹園地 | 159 |
| **合計** | **1,046** |

25市町村と4地目の一覧も研究台帳に収録。数字はポリゴン（形状）レコード数であり、農地面積（ha）、筆数、農家数ではない。

## GitHubでの実装

- `research/p34-akita-soil-shapefile-source-v1.json`：原本ZIPと全7メンバのハッシュ、bbox、地目別・25市町村別集計、公開と科学的利用の境界。
- `scripts/p34-akita-soil-audit.py`：Python標準ライブラリのみで原ZIPを再照合（全7ファイルSHA、SHP/SHXヘッダー、DBF 1,046件、市町村×地目集計）。原本ZIPなしでも台帳監査（audit）を実行可能。
- `src/gx-akita-soil.js`：GX Data Atlasで秋田県を選択したときに地目別概要・市町村別表と制約を表示。
- `tests/p34-akita-soil-gis.test.mjs`：原本台帳、CSVと同じ集計、変造拒否、都道府県の出し分け、既存5道県表示の維持を確認。

原本ZIPが手元にある場合の完全オフライン再検証：

    python3 scripts/p34-akita-soil-audit.py verify '/local/private/秋田県(1).zip'

公開CIでは原本を保管しないため、台帳の整合性とUIだけを検査：

    python3 scripts/p34-akita-soil-audit.py audit
    node tests/p34-akita-soil-gis.test.mjs

CI上のaudit成功は元ZIPの検証完了とは別。元ZIPの全7メンバSHAと1046件の実データについては受入時のローカル環境で検査済み。

## 科学的・権利面の境界

原GISの発行元の真正性と再配布ライセンスが未確認のため、元Shapefile・DBF・ZIPを公開GitHubへコミットしない。公開するのは原本ハッシュと派生集計のみ。

GISポリゴンの件数は面積ha、土壌炭素量、CH₄実測値、排出削減量ではない。2024年の水稲作付統計やJAXA土地被覆と自動的に重ね合わせず、証拠がない状態で認証済み削減量・J-クレジットに変換しない（official_credit_tco2e=null）。
