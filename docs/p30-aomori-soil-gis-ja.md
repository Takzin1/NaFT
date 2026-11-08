# NaFT P30｜青森県農耕地土壌GISの検証・研究用集計

2026-11-09。ユーザー提供の「青森県(1).zip」を実際に解凍し、
内部Shapefile・DBF・座標定義・メタデータを確認した。
既存の北海道P29と混同せず、青森県コード02の独立データソースとして登録する。

## 原本

- ZIP：9,300,558 bytes、SHA-256 = 8fc34f2d1dfa18569c4411f36c6fc6dac5400fa63763734b4efc18af7484d321
- ZIP内：k02青森県/k2青森県.dbf / .prj / .sbn / .sbx / .shp / .shp.xml / .shx（計7ファイル・展開後14,669,992 bytes）。
- 日本語ファイル名はZIPの旧Shift-JIS（CP932）をCP437経由で復元。未知のパスへの展開はしない。
- GIS：ESRI POLYGON、GCS_JGD_2000、形状レコード1,311、40市町村（JCODE 5桁）。
- 範囲：東経139.864006〜141.786506、北緯40.229649〜41.540653（原本のbbox、未改変）。
- Esri XMLメタデータの作成日2017-01-17。これは作成日であり最新の改訂日や2026年の調査実施を主張しない。

## 実データの集計

| 地目区分 | ポリゴン数 |
| --- | ---: |
| 田 | 457 |
| 普通畑 | 394 |
| 牧草地 | 180 |
| 樹園地 | 280 |
| **合計** | **1,311** |

土壌分類は「群コード」19種、「包括_統群」69種。SICHOは全行空欄であるため、
北海道P29と異なり「振興局別集計」は行わない。代わりに40市町村・地目別集計を
research/p30-aomori-soil-shapefile-source-v1.jsonに記録した。

## GitHubへの反映

- JSON：ファイル7本のバイト長とSHA、出典原本ハッシュ、地目別と40市町村別の派生集計。
- scripts/p30-aomori-soil-audit.py：Python標準ライブラリで元ZIP・全7ファイルSHA・SHP/SHXヘッダ・DBF1,311行・属性集計をオフライン照合。
- src/gx-aomori-soil.js：GX Data Atlasで青森県を選択した場合のみ地目別概要と40市町村一覧を表示。
- tests/p30-aomori-soil-gis.test.mjs：登録値の整合性、画面の境界および基本的な拒否系テスト。

原本ZIPが手元にある環境で完全再照合：

    python3 scripts/p30-aomori-soil-audit.py verify '/local/private/青森県(1).zip'

GitHub ActionsのCIでは原本ZIPを保存していないため、次の台帳整合性検査だけを実施する：

    python3 scripts/p30-aomori-soil-audit.py audit
    node tests/p30-aomori-soil-gis.test.mjs

## 科学的・法的境界

- **1,311はポリゴンの件数**であって、筆数・農家数・水田面積haではない。
- このGISから圃場のCH₄実測値や土壌炭素重量は得られない。排出係数やJ-クレジット認証量にも自動転用しない。
- 2017年メタデータの土壌分類と2024・2025年の稲作統計、JAXA土地被覆は別データ。空間・時間・土壌定義の照合が済むまで自動統合しない。
- 配布元・元データの再配布許諾を独立確認できないため、生のShapefile・DBF・ZIPは公開GitHubに転載しない。
- 原典性・改定履歴や商用利用条件の判断は別途必要。
