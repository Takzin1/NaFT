# NaFT P77｜圃場ID × 年度別筆ポリゴン × 人間承認の証拠履歴

## 実装範囲

全国47県のP76の集計監査を保持したまま、年度ごとに変化する筆ポリゴンIDとNaFT独自の永続的な圃場IDを分離する研究用ローカルツールを追加。農水省は2022年以降、形状に変更がなくても筆ポリゴンUUID v4を毎年再付与することを明記している。

公式資料：
- 農水省筆ポリゴン https://www.maff.go.jp/j/tokei/porigon/
- UUID変更仕様 https://www.maff.go.jp/j/tokei/porigon/attach/pdf/index-36.pdf
- 2026年版FlatGeobuf配布 https://www.maff.go.jp/j/tokei/census/shuraku_data/2025/mb/index.html
- WAGRIの2026年度データ更新 https://wagri.naro.go.jp/2026_11_04_01/
- FlatGeobuf仕様とGDAL https://github.com/flatgeobuf/flatgeobuf

## データモデル

| 要素 | 役割 |
|---|---|
| `field_id` | NaFT内部の長期識別子（fld_＋UUID v4）。農地の地番・筆界・所有権とは別 |
| `observations[]` | 年度別polygon_uuid、原本SHA-256、geometry SHA-256、地目・行政コードを保存。地物座標は保持しない |
| `candidates[]` | 外部IDと圃場の対応候補。前年UUIDが一致しても未承認のまま |
| `lineage[]` | 分割・統合の複数ID関係。人の明示的な根拠付き承認と循環防止が必須 |
| `evidence[]` | 写真・水位・作業記録などの原本ハッシュ。UUIDの変化で別圃場に勝手に移さない |
| `events[]` | 操作の連番・前イベントのハッシュ・操作内容ハッシュ。研究用監査ログであり暗号学的な外部公証ではない |

## ローカルCLI（最初は合成データで検証）

個別圃場情報・原本ZIP・座標を公開GitHubにコミットしない。私的レジストリはリポジトリ外へ。リポジトリ内のパス・既存の保存ファイルの上書きは拒否する。

```bash
node scripts/p77-field-cli.mjs --action init --state /tmp/naft-p77-private.json
node scripts/p77-field-cli.mjs --action import --state /tmp/naft-p77-private.json --input fixtures/p77-fude-2026-synthetic.geojsons --year 2026 --pref 07 --max 10
node scripts/p77-field-cli.mjs --action receipt --state /tmp/naft-p77-private.json
```

恒久圃場IDを追加するには、リポジトリ外のJSON（例：/tmp/field-request.json）を作り、以下を実行。ID未指定ならUUID v4を自動生成する。

```json
{"field_id":"fld_aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","prefecture_code":"07","reference_hash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}
```

```bash
node scripts/p77-field-cli.mjs --action add-field --state /tmp/naft-p77-private.json --payload /tmp/field-request.json
```

同じCLIで action=propose、review、lineage、evidence を扱える。候補を確定するreviewでは審査者参照ハッシュ、判断証拠SHA、理由が必須。HITLでの承認は研究用のID対応承認であり、土地権利や認証済みクレジットの承認ではない。

## 2026年版FlatGeobufのローカル取込

GDALのogr2ogrがインストールされていれば、`.fgb`をローカルでGeoJSONSeqへ変換し、1地物ずつ検査する。GDALがなければエラーで停止する。実データの仕様・利用条件・分割数・配布元を確認した上で利用し、個別座標や権利情報を公開しない。

```bash
node scripts/p77-field-cli.mjs --action import --state /tmp/naft-p77-private.json --input /your/private/2026-fukushima-part1.fgb --year 2026 --pref 07 --max 20000
```

福島県の2026年版は7分割で配布されており、1ファイルだけを取り込んでも県全体の完全データにはならない。`--max`超過は黙って切り捨てずエラーにする。座標系はローカルGDALでEPSG:4326へ変換するが、元のCRSの適格性や地物の位置精度まで独立に証明するものではない。GeoJSONとGeoJSONSeqもローカルから検査可能。

## 2026年→2027年の追跡

2026年の外部UUID Aを承認した後、2027年のUUID Bにlast_polygon_uuid=Aがあれば同じ圃場の候補を表示できる。ただし自動承認せず、人が判断証拠のハッシュ・理由を記録して初めて研究用の対応が確定する。写真や作業証拠は恒久field_idに残る。分割統合では新しい圃場のIDを発行し、古いIDの証拠を無断承継しない。

## テスト

```bash
node --test tests/p77-field-identity.test.mjs
node --test tests/p77-field-cli.test.mjs
npm test
```

## 現時点の限界

- **実装済み**：年度別UUID、恒久ID、証拠ハッシュ、候補・人の承認、分割／統合、ローカル取込、合成テスト、公開用レシート、GX Data Atlasの合成イメージ。
- **実証前**：2026年版実FlatGeobufによる動作確認、WAGRI API実接続、正式利用規約の個別照合、土壌GISの空間重ね合わせ、法的筆界・権利の認証、正式な面積測定、AG-005適格性判定、外部公証、複数ユーザー運用。

原本ファイルSHA-256は一致検証の手段であり、出典の真正性・再配布権限を自動的に認証しない。筆ポリゴンは測量済みの確定筆界や所有権・クレジット発行権限を示さない。正式なCH4/CO2e削減量も算定・発行しない。
