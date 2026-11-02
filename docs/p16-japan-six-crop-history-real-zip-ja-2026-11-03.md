# P16｜日本の6作物・140年（1883–2022）をNaFTに取り込む

**2026-11-03 / ユーザー提供ZIPの原本照合・研究統計データアトラス**

## 実際に検証したアーカイブ
ユーザー提供 `CropProduction_JP_1883-2022(1).zip` を安全に展開し、主データ・出典表・都道府県コード・和暦コードを確認した。

| ZIP内原本 | 実バイト長 | SHA-256 |
|---|---:|---|
| ZIP全体 | 1,062,661 | `8e8ec4ef894f179b9d3ceb66fe8e9319f707b45cc652f4ece50a29a14e8772e6` |
| `CropProduction_JP_1883-2022.csv` | 17,163,494 | `6cfaec5fe79fcead2149c2427490e57acbf9c4f24c370e847131c9bde41a920e` |
| `Japanese_Calendar.csv` | 1,390 | `60486f75c7b1944a2b0c4446880f4b20d45fc46adc7dbbf93d095864d025638a` |
| `Prefecture_Code.csv` | 1,446 | `e9f060db9bbdaf659ff20de0e104bb657087d71e53acec3d040708995432cd2a` |
| `CropProduction_JP_DataSources.xlsx` | 39,322 | `2b31928c9e67a9c22c3b3f1947429e4edb9e9002b014f7d487090c4e0ae404ec` |

元ZIPはmacOSの補助ファイルを含む12エントリーで構成され、研究用の4本だけを明示的に選んだ。CSVは全146,160行、**6作物 × 140年 ×（47都道府県 + 10地域集計 + 全国1件）× 3指標**。作物はRice、Wheat、Barley、Soybean、Potato、SweetPotato。指標は`production (tonnes)`、`surface (ha)`、`yield (tonnes/ha)`。地域・県・年コードと単位を原ファイルから検査。

`CropProduction_JP_DataSources.xlsx`には主に歴史的農業統計の文献目録と、e-Statの旧形式URLが載っている。一部の引用範囲は2012年まで。**2022年データの原官庁資料・統計定義が全て独立に照合されたことは意味しない**。CSV各行の`source`にはCalculated dataや原資料名があり、国の行が`Calculated data`になっていることに注意する。

## 原本のチェック結果
- 生産量・面積について、**地域10区分と全国値がそれぞれ所属都道府県の合計に一致**（原CSVに重複する小計・総計を生産量へ二重計上しない）。
- 面積が正の場合、公表単収と`production / surface`の差は最大0.005t/ha（小数2桁の丸め差）。
- **生産量が正、報告面積が0ha、単収0の組み合わせが59件**。丸め・転記・統計範囲差の可能性を残し、推測で面積・単収を上書きしない。これらから単収を算出できない。
- 大豆、ジャガイモ、サツマイモの7年（**1885、1886、1888、1889、1890、1891、1893**）は全国生産量・面積・単収がすべて0。**実際に全国生産がゼロだったと断言せず、欠測/未登録の可能性**を明示し、チャートを接続しない。
- 2022年サツマイモは47都道府県中41件の生産量が0である。原データの0を現実のゼロと自動判定しない。
- 1883〜2022年の県界・統計定義・調査水準の時系列調和は未実施。地域や歴史期間間の比較は記述統計に限定する。

## 実装した機能
- `scripts/p16-japan-six-crop-original-zip-audit.py`：標準ライブラリのみのオフライン原本監査。ZIPパス、容量、CRC、SHA-256、正確なCSVスキーマ、146,160行、都道府県表58行、暦140行、47県/10地方/1全国の分類、全年度合計、単収、59疑義行、特殊ゼロ年、情報源ラベルを再評価。原本不一致は必ず停止。
- `research/p16-japan-six-crop-1883-2022-original-source-receipt.json`：原本ハッシュと構造・疑義・科学的制限を固定。**公開GitHubには元の17MB CSV・Excel・ZIPを転載しない**。再配布条件を独立に確認できていないため。
- `src/gx-japan-crop-history.js`：全国の**6作物×140年＝840作物年×生産量・面積・単収**を元ZIPから抽出し、軽量な36進数表記で保存。元の県別観測行は公開せず、固定ベクトルSHA-256をレジストリで監査。NaFTの`#/gx-data`画面で作物/年を選択し、歴史的推移を確認できる。
- `tests/p16-japan-crop-history-original-source.test.mjs`：ソースSHA、140年×6作物の全件構造、抽出値・出典0の例外・年変更・グラフ描画・既存GX配線・CO₂eの無根拠な算出禁止をCIで監査。
- 全件146,160行の**私有環境での再演算・CSV出力**にも対応。原本をそのまま必要とする研究者のみ操作する。生ファイルを自動で公開しない。

## ローカル再検証の実行方法
```bash
# ZIPを手元に保持し、ハッシュを確認した上で実行
python3 scripts/p16-japan-six-crop-original-zip-audit.py \
  /private/CropProduction_JP_1883-2022.zip \
  --public-register research/p16-japan-six-crop-1883-2022-original-source-receipt.json

# 必要なら正規化された全146,160行CSVをprivate領域へ、0600権限で新規作成
python3 scripts/p16-japan-six-crop-original-zip-audit.py \
  /private/CropProduction_JP_1883-2022.zip \
  --private-csv /private/japan-six-crop-full-1883-2022.csv

# 公開アーカイブなしでの検証
node tests/p16-japan-crop-history-original-source.test.mjs
```

## 既存データとの比較境界
このP16は2022年までの歴史的な作物生産に関する**別の編纂統計**である。従来のNaFTの2023・2024水稲原Excel、2025確報、2026予測とは出典の粒度や範囲が違う。米の「生産量」を玄米の「主食用収穫量」に自動変換したり、歴史統計からCH₄削減量・tCO₂e・クレジット発行を認証したりしない。1950年と2022年を直接比較した「政策の因果効果」も断言しない。

**出典の再配布許諾・e-Statのリンク先と原簿の独立確認、県界補正・0値の意味の確定は、明示的に未完了。**
