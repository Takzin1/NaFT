# NaFT P8｜Gimje原観測ZIP＋圃場Excel → NaFT P7への真正なドッキング経路

**研究用。配布元チェックサムによるファイル同一性と、圃場データの科学的な正しさは別。**

2026年11月2日、[Zenodo公式データセット](https://zenodo.org/records/17111992)と[著者による原実装](https://github.com/lhs0218/gimje_ch4)を再照合した。

| 配布元ファイル | Zenodo掲載サイズ | Zenodo掲載MD5 | データ用途 |
|---|---:|---|---|
| `ch4.zip` | 66,312 bytes | `b9ada3a76a2bce1dbd3c9c77f51424f7` | 圃場別CSV、DAT、CH₄ flux等 |
| `input_fields_meta.xlsx` | 16,705 bytes | `ba661a41238697b7ac1915c0d3890aa2` | field_id、planting_date、その他圃場属性 |

Zenodoの説明ではチャンバー法による**2022〜2024年の水田CH₄日次観測**、フラックスは `g CH4 m-2 day-1`。著者Rコード `01.train_RF_gimje.R` ではCSVファイルのbasenameを圃場IDに、メタデータの `planting_date + DAT` を観測日に用い、`ch4_flux`、`course_type`等を扱う。これを元の列の意味に忠実に再現した。

## 今回の実装内容

- `scripts/p8-gimje-native-dock.py`：`acquire`（明示的に要求した場合だけZenodoからHTTPS取得）、`dock`（ZIP/XLSXを解析してP7の8カラム中間CSVへ）、`verify`（元のZIP/XLSXと生成CSV、レシートを独立再作成して一致照合）。
- **Zenodo掲載MD5＋正確なファイル長を必須照合**。別ファイル、改ざん、部分ダウンロードを拒否。SHA-256はローカル実バイトから再計算する。MD5は配布元メタデータ照合であり、署名・出版社による認証ではない。
- ZIPファイルのディレクトリトラバーサル、シンボリックリンク、展開爆弾的な容量、重複圃場名、欠落メタデータを拒否する。
- Excelも**標準ライブラリのみ**で読み、`field_id`と`planting_date`が揃うシートがちょうど1つある場合にのみ変換。YYYY-MM-DDやExcel日付シリアルを認識し、不明なら停止する。データ源の `course_type` はAWD/CF等の明示的なラベルにのみマップし、不明ラベルは `UNKNOWN` にしてレシートへ記録する。
- P7のQCへ**自動的に通し**、不正な日付・欠測・負フラックス・重複・発行元QC不明などの警告と入力CSVのSHA-256を結合。元CSVに出版社の独立QCフラグがないため、出力の `qc_flag` は例外なく `UNKNOWN`。
- 圃場の位置・氏名、ZIP/XLSXの元バイトは**GitHubに含まれない**。CLIは元のダウンロード先に加え、CSVとレシートの出力先を利用者に明示させる。既存ファイルは上書きしない。

### 重要な科学的制限

この処理によって**圃場データの事実性・測定の精度・2026年11月時点の現行Verra/J-Credit制度適格性が検証されるわけではない**。元RコードのDAT加算を再現するが、各ファイルが「日次の独立測定値」なのか反復や補間済みの日別推定値なのか、測定プロトコル・QC・季節積分の妥当性を追加審査する必要がある。

特に以下は禁止する。

- `REPORTED_PASS` / `independent_chamber_qc_approved=true` を自動的に付与しない。
- 原著にないAWS/Sentinel-1/FAOSTAT値を実測 `ch4_flux` として代用しない。
- `course_type` の数値や日本語ラベルを推測でAWD/CFへ自動変換しない。
- 実際の発行済みクレジット・公式認証tCO₂eをこの変換結果から計算したと主張しない。
- 著作権・利用許諾の確認なしに原ZIP・Excelを公開GitHubへ転載しない。コード側のMITライセンスを、観測値の再配布ライセンスと自動的に同一視しない。

## 実データにアクセスできる環境での利用

ネットワーク接続できるローカル環境で、公開サイトの利用条件を確認した後に実行：

```bash
mkdir -p "$HOME/naft-private-p8"
python3 scripts/p8-gimje-native-dock.py acquire "$HOME/naft-private-p8"

python3 scripts/p8-gimje-native-dock.py dock \
  "$HOME/naft-private-p8/ch4.zip" \
  "$HOME/naft-private-p8/input_fields_meta.xlsx" \
  "$HOME/naft-private-p8/gimje-p7-canonical.csv" \
  "$HOME/naft-private-p8/gimje-p8-receipt.json"

python3 scripts/p8-gimje-native-dock.py verify \
  "$HOME/naft-private-p8/ch4.zip" \
  "$HOME/naft-private-p8/input_fields_meta.xlsx" \
  "$HOME/naft-private-p8/gimje-p7-canonical.csv" \
  "$HOME/naft-private-p8/gimje-p8-receipt.json"
```

`dock` 実行時、内部で `node scripts/p7-offline-observation-qc.mjs analyze ...` を実行する。ユーザーが承認した圃場管理情報の公開可能範囲は別途検討する。

## 状態／検証の正確な申告

**このChatGPT開発環境からのZenodo元ファイル取得はネットワーク制限で失敗。今ターンにおける現地CH₄実測ファイルの新規取得：0件、新規実測行の成功した統合：0行。** P8のGitHub CIでは自作した小容量の**合成**ZIP/XLSXを使ってDAT→日付変換、P7へリプレイ、上書き防止、ソースハッシュ・悪性ZIP検出を回帰テストする。

既存のP7出典登録にはGimjeの外部ファイルを**未取得**として維持。外部アクセスできる環境で本スクリプトの`acquire`→`dock`→`verify`が通った時にのみ、真の実測行数・SHAと欠測率を集計してP9研究パケットに載せられる。

## P9（他システムとのドッキング）

- 原本を検証したGimje実測と、NASA POWERの日次気温・降雨を**同じ圃場位置・日付・格子時空間解像度の証拠付きで**マッチする。ERA5-LandやMODIS等の既存著者コードの共変量はプロジェクト条件を分けて扱う。
- 武漢大学AWD実験XLSXについても**ファイルMD5確認→シート・単位監査→別アダプタ→P7**。Gimjeの列名・測定単位を流用しない。
- 実測値を使う独立再演算の範囲は**研究の比較**として区切る。既存のP5/P6方法論条文、正式な適用確認、VVB審査とは接続前に独立ゲートを設ける。
