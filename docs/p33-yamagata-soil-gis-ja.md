# NaFT P33｜山形県農耕地土壌GISの原本検証・研究用集計

2026-11-09、ユーザー提供の「山形県(1).zip」を実際に解凍し、全7構成ファイルの原バイト・ハッシュ、Shapefileの形状、DBF全1,651件を検証した。既存の北海道P29・青森県P30・岩手県P31・宮城県P32とは独立した山形県コード06のGISレイヤーである。

## 原本

- 原ZIP 10,756,335 bytes、SHA-256：ec2890ef0329b30054159a8a85ba731027d13f952f5ec1c849c36a38d4ec7e2c。
- ZIPにはCP932の日本語ファイル名で k06山形県/k6山形県.dbf、.prj、.sbn、.sbx、.shp、.shp.xml、.shx の計7構成ファイルを収録。合計17,175,180 bytes。各ファイルのSHA-256は研究台帳へ固定。
- Shapefile：ESRI Polygon（型5）、1,651件。SHP本体・SHXインデックス・DBF属性レコード数を照合。JGD2000（GCS_JGD_2000）。
- 元データのbbox（経度、緯度）：[139.5489311470065, 37.79515834071243, 140.62155752318338, 39.10712316809213]。
- DBF内の県名KEN_1は全件「山形県」。JCODEは35市町村コード、SICHOは全件空欄。
- 土壌の「群コード」は18種類、「包括_統群」は93種類。
- XMLメタデータの作成日は2017-01-17。調査実施日や2026年現在の現況とは同一視しない。

## 地目別ポリゴン数

| 地目 | ポリゴン件数 |
| --- | ---: |
| 田 | 618 |
| 普通畑 | 500 |
| 牧草地 | 138 |
| 樹園地 | 395 |
| **合計** | **1,651** |

35市町村それぞれの地目別集計は research/p33-yamagata-soil-shapefile-source-v1.json に固定する。数字はポリゴン（図形）の数であり、農地面積ha、農家数、区画・筆数ではない。

## GitHub実装

- research/p33-yamagata-soil-shapefile-source-v1.json：ZIP、全7ファイルのSHA・サイズ、bbox、35市町村別4地目集計、科学的利用制約。
- scripts/p33-yamagata-soil-audit.py：Python標準ライブラリで元ZIPバイトと全メンバSHAを確認し、SHP/SHX/DBFと全行の市町村別集計を再照合。原本がある場合の verify と台帳のみを検証する audit を分離。
- src/gx-yamagata-soil.js：GX Data Atlasの都道府県を山形県にした場合にのみ、地目集計・35市町村表を表示。
- tests/p33-yamagata-soil-gis.test.mjs：原本台帳、地目合計・市町村行、UIの地域出し分け、改ざん検知、CI境界を確認。

手元に原ZIPがある場合の原本の完全再検証：

    python3 scripts/p33-yamagata-soil-audit.py verify '/local/private/山形県(1).zip'

公開CIは元ZIPを含まないため、次のレジストリ監査とUI回帰のみ実施：

    python3 scripts/p33-yamagata-soil-audit.py audit
    node tests/p33-yamagata-soil-gis.test.mjs

auditの成功は原ZIPのバイト再照合成功を意味しない。元ZIPは本取込環境で別途全7ファイルのSHA、全1,651属性と形状件数まで検証済み。

## 利用上の制約

原GISの配布元・再配布許諾を独立に確定できないため、Shapefile、DBF、ZIPの生データは公開GitHubに複製せず、原本を特定するSHAと派生集計のみ記録する。

本GISの地目分類を2024年米統計・JAXA土地被覆に自動で重ね合わせない。圃場のCH₄実測、土壌炭素量、CO₂e削減量、認証済みクレジット量を算出しない（official_credit_tco2e=null）。
