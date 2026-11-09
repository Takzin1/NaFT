# NaFT P35｜福島県農耕地土壌GISの原本検証とGX Data Atlasへの登録

2026-11-09にユーザー提供「福島県(1).zip」を実際に解凍し、構成7ファイルの原バイト・SHA-256、Shapefileの形状、DBFの全属性2,407件を照合した。これまでの北海道P29、青森P30、岩手P31、宮城P32、山形P33、秋田P34とは独立した「福島県コード07」の研究用ソースである。

## 原本の固定仕様

- 原本ZIP：18,951,682 bytes、SHA-256 `db264851d4e3ca44bcb90bf778e1cfa58a877f1af1ce1a5c77958ea1f56f7de6`。
- 日本語CP932名の7ファイル：`k07福島県/k7福島県.dbf`、`.prj`、`.sbn`、`.sbx`、`.shp`、`.shp.xml`、`.shx`。合計29,683,752 bytes。全7ファイルのSHA-256は研究台帳に収録。
- GIS：ESRI Polygon（shapeType 5）、SHP 2,407件、SHX 2,407件、DBF 2,407件。PythonのShapefile readerでも全2,407件を走査できた。
- JGD2000（GCS_JGD_2000）、bbox [139.28773851975052,36.7546237957464,141.03852980345184,37.97169932055496]。
- KEN_1：全件「福島県」、JCODE：全59市町村の5桁コード、SICHO：全件空欄。
- 土壌の「群コード」19種類、「包括_統群」77種類。XMLメタデータ作成日は2017-01-17。これは調査時点・2026年の現況を意味しない。

## ポリゴン件数（地目区分）

| 地目 | 件数 |
| --- | ---: |
| 田 | 865 |
| 普通畑 | 856 |
| 牧草地 | 259 |
| 樹園地 | 427 |
| **合計** | **2,407** |

これは土壌分類を伴う図形（ポリゴン）レコードの件数。農地面積ha、圃場筆数、農家数、現況作付け・耕作状況ではない。59市町村×4地目の集計は `research/p35-fukushima-soil-shapefile-source-v1.json` に保存。福島市、会津若松市、田村市、双葉町、大熊町、浪江町、飯舘村などを含む。

## GitHub実装

- `research/p35-fukushima-soil-shapefile-source-v1.json`：元ZIPのSHA、全7ファイルのSHA・サイズ、bbox、59市町村別・地目別の派生集計、公開・利用制限。
- `scripts/p35-fukushima-soil-audit.py`：Python標準ライブラリで元ZIPの全バイト・7メンバSHA・SHP/SHXヘッダ・DBF全2,407件・59市町村の集計を独立再検証する `verify`、原ZIPを持たないCIでレジストリ値の整合性だけを見る `audit`。
- `src/gx-fukushima-soil.js`：GX Data Atlasの都道府県選択「福島県」で地目別カードと59市町村の詳細表を表示。
- `tests/p35-fukushima-soil-gis.test.mjs`：SHA/レジストリ件数、UIの県コードと改変検知、旧6道県の機能保持、土壌から営農可否を推論しない境界を検査。

元ZIPが手元にある環境で完全再検証：

    python3 scripts/p35-fukushima-soil-audit.py verify '/local/private/福島県(1).zip'

公開CIでは原本ZIPを保管しないため、次を実行：

    python3 scripts/p35-fukushima-soil-audit.py audit
    node tests/p35-fukushima-soil-gis.test.mjs

GitHub CIの `audit` 成功は原ZIPの再照合成功を意味しない。元のZIPと7構成ファイルは受け入れ元の作業環境で別途SHA・形状・全属性件数を検査済み。

## 福島県で特に重要な科学的境界

- **放射性物質の測定値（例：土壌・農産物中の放射性セシウム）、避難指示区域の指定・解除、営農再開状況・許認可は本ファイルには含まれない。** 土壌GISが示す土壌分類やポリゴンの存在から「安全」「危険」「耕作可能」「営農再開済み」などを判定してはいけない。
- 2017年メタデータの土壌分類と2024年の米統計やJAXA土地被覆は、時間・位置・分類体系を照合する前に結合しない。
- CH₄実測、土壌炭素実測、CO₂e削減量、認証済みJ-クレジット量は計算しない（`official_credit_tco2e=null`）。
- 原本の配布元・再配布ライセンスを独立確認できないため、元Shapefile/DBF/ZIPは公開GitHubには複製せず、原本を特定するハッシュと派生集計だけを登録する。
