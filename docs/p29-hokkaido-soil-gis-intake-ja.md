# NaFT P29｜北海道・農地土壌Shapefileの原本照合とGX Atlasへの反映

2026-11-09。ユーザー提供の北海道(1).zip（43,028,818バイト）を実際に解凍・検査した。
P28の「県独自PDF資料の索引」とは別種の原本なので、土壌GISの独立したP29として扱う。

## 原本と属性

- ZIP原本SHA-256：1b645c6234a6eb1a712246d9d5a8163b02592ab08a14afc01850ab0ded5414e3
- ファイル7本：.shp / .shx / .dbf / .prj / .sbn / .sbx / .shp.xml
- ZIPの日本語パスはCP437に誤表示されることがあり、元のShift-JIS名はk01北海道/k1北海道.*。
- Shapefileの形状はPOLYGON、座標系はGCS_JGD_2000、レコードは5,477件、市町村コード186種類、振興局14種類。
- 地目：田1,390、普通畑2,092、牧草地1,813、樹園地182。これはポリゴン数であり、面積haや土壌炭素量ではない。
- 土壌の「群コード」22種類、「包括_統群」150種類。Esriメタデータの作成日は2017-01-17。発行元、更新状況および再配布許諾は原本単独では未確認。

## 反映範囲

- research/p29-hokkaido-soil-shapefile-source-v1.json：原本・7ファイルのバイト長とSHA-256、座標系、地目・振興局別集計、認証境界を保存
- src/gx-hokkaido-soil.js：GX Data Atlasで北海道を選んだときに、土壌GISの概要と14振興局の集計を表示
- scripts/p29-hokkaido-soil-audit.py：Python標準ライブラリのみでZIPの原バイト、SHP/SHXヘッダー、DBFの全レコードおよび集計を照合

検証方法：

    python3 scripts/p29-hokkaido-soil-audit.py audit
    python3 scripts/p29-hokkaido-soil-audit.py verify '/private/北海道(1).zip'
    node tests/p29-hokkaido-soil-source.test.mjs

auditはコミットされた研究台帳の整合性だけを確認する。verifyは実際の元ZIPが手元にある場合にのみ原本をSHAで検証する。CIには原本ZIPを配布していないため、CIのaudit成功は原本再検証成功を意味しない。今回の元ZIPは別環境で全7ファイルのハッシュ、DBF5,477行と振興局集計一致まで確認済み。

## 科学的・公開上の制限

- 県の土壌分類図と2024年の水稲統計、JAXA 2024年土地被覆は定義も年代も異なる。空間結合・面積集計や統計的妥当性はまだ検証していない。
- 2026年現在の土壌状態や地目、圃場の個別位置、カーボン量を実測したデータではない。
- 原本Shapefileのライセンスが未確認のため、生のGISファイルは公開GitHubへアップロードしない。引用・再配布・商用利用可否は原配布元に要確認。
- official_credit_tco2eは常にnull。炭素クレジットやJ-クレジットへの自動算定・発行は行わない。
