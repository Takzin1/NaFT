# NaFT P22｜JAXA土地被覆2024 v25.04 第２バッチ（LC_N30E129）

## 原本検査結果（2026-11-03）
今回のユーザー提供GeoTIFF１枚をオフラインで全画素走査し、既存P21のJAXA 2024年 v25.04へ追加した。

| 項目 | 確認値 |
|---|---|
| 原本ファイル | `LC_N30E129.tif` |
| 原本SHA-256 | `a77b4d6a4f2e7bd4702c4b035fe51c2579abb8916ebad8b830d629c3bcc9a766` |
| 原本サイズ | 651,876 bytes |
| 地理範囲 | 東経129〜130°、北緯30〜31° |
| CRS / 画像寸法 | EPSG:4326 / 12,000×12,000、uint8 |
| 分解能 | 1/12,000 度の角度格子 |
| TIFF内部圧縮 | DEFLATE |
| ファイル個別NoData | **未設定** |
| 分類1: 水域 | **143,766,652 画素** |
| 分類3: 水田 | **0 画素** |
| その他の分類 | 機械可読台帳の15分類配列に厳密記録 |
| 値0・コード16以上 | **0画素** |

分類コードは前回のJAXA同梱README・日英凡例に従う。水域(1)は欠損ではなく、NoDataと決して同一視しない。水田分類が0であっても、島嶼・海域を含むタイルでは科学的に妥当な観察結果となり得る。

登録済みのP21第１バッチ３タイルは維持し、新しく１枚を追加したので、NaFTが保持する**地域タイル数は計４枚**（日本全国を網羅する意味ではない）。元GeoTIFFはGitHubに再配布しない。バイト列の公的配布元との独立照合やデータの商用利用・派生データ再配布の許諾確認は未完了。

## 技術的な実装
- `research/p22-jaxa-lulc-2024-v25-04-batch02.json` : 前回台帳を参照する追加入力と全15分類、原本SHA-256。
- `scripts/p22-jaxa-lulc-batch02-verifier.py` : ローカルGeoTIFFをバイト照合し、ブロック単位で15分類・CRS・座標・NoDataを独立再計算する。
- `src/gx-jaxa-landcover-2024.js` : 公開GX Atlasのタイル切替４枚対応。フロントに公開するのは画素数の集計のみ。
- `tests/p22-jaxa-lulc-batch02.test.mjs`、`tests/p22-jaxa-lulc-batch02.test.py` とブラウザスモーク：既存P21との整合、不正入力のfail-closed。
- 次回からも同じ入稿方法でタイル追加可能。地域と年次が異なるデータを直接重ね合わせて因果推論したり、2024年から2001〜2015年のCH₄を認証量へ転用しない。

## 再現
```bash
python3 -m pip install rasterio numpy
python3 scripts/p22-jaxa-lulc-batch02-verifier.py '/private/LC_N30E129.tif'
node tests/p22-jaxa-lulc-batch02.test.mjs
python3 tests/p22-jaxa-lulc-batch02.test.py
```

正式な農地面積ha、J-クレジットAG-005の適格性、GHG削減量・tCO₂eは未算定・未認証のままとする。