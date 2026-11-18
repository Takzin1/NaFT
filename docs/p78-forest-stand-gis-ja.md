# NaFT P78｜森林GIS（小班）× FO-001 × 変更影響、GISレイヤーの遅延読込

## 目的

NaFTの「ルールや入力が変わったとき、見直す申請だけを示す」仕組みを、農地から森林へ広げる。対象として、J-クレジットの森林経営活動方法論（FO-001）を想定し、森林簿・森林計画図の**小班**を単位にする。

## 追加したもの

| 要素 | ファイル | 内容 |
|---|---|---|
| FO-001参照Pack | `src/forest-packs.js` | 林野庁の実務ガイド（Ver.2.0、2026-03-31）にある適用条件1〜4と算定対象①〜③を`REFERENCE`ルールとして要約。原文・版・係数は未固定なので`CONFIG_REQUIRED`で、Compilerは常に自動判定を止める |
| 合成Pack v1/v2 | `src/forest-packs.js` | `FOREST-SYNTHETIC@1→@2`。2026年の制度運営委員会の議題（天然生林の幹材積表の更新、主伐時期の確認）を**模した合成の変更**。実際の改定ではない |
| 別レジストリ | `FOREST_REGISTRY` | 農業用の`COMPILER_REGISTRY`とその検査件数には手を入れない |
| 小班ID・取込 | `scripts/lib/forest-stand-identity.mjs` | 森林簿CSVの正規化、森林計画図のハッシュ化と突合、恒久`stand_id`、人の承認つき対応づけ、Compiler用claim生成 |
| ローカルCLI | `scripts/forest-stand-cli.mjs` | `init / import-register / import-map / add-stand / suggest / propose / review / evidence / receipt / claims / impact` |
| 取込プロファイル | `config/forest-register-profiles/` | 列名・林種の対応・主伐期・**利用条件**を明示する。合成用と、実データ用の雛形 |
| 画面 | `src/gx-forest-stand.js` | `#/gx-data`に60小班の変更影響（Compilerの実計算）を表示 |

## データモデル

- **`stand_id`**（`std_`＋UUID v4）：NaFT内部の恒久ID。地番・所有権・境界とは別物。
- **観測**：計画年度ごとの森林簿の1行（＋計画図ポリゴンのハッシュ）。キーは`市町村コード-林班-小班-枝番`だが、計画の見直しで番号が変わり、分割・統合も起きるので、**IDとしては使わない**。
- **対応づけ**：同じ林小班番号の前年度観測があれば「候補」を出すだけ（`auto_approved:false`）。承認には審査者参照ハッシュ、判断証拠のハッシュ、20文字以上の理由が必須。
- **林種区分**：プロファイルで原本の林種を`IKUSEI / TENNEN / BAMBOO / TREELESS`に対応づける。対応表にない値は`UNKNOWN`として残し、Compilerは止まる。
- **主伐期**：育成林だけ、プロファイルの樹種別しきい値で`MATURE / IMMATURE`。しきい値がなければ`UNKNOWN`（Compilerは止まる）。合成プロファイルの値は架空で、実際の標準伐期齢は市町村森林整備計画から写すこと。

## 守っている境界

- 状態ファイル・claimファイルはリポジトリの外にしか書けない。
- 列名に所有者・氏名・住所などがあれば取り込みを止める。
- 計画図の座標は検証後にハッシュだけを残し、保存しない。公開レシートは件数のみで、林小班番号も出さない。
- 森林簿の行以外の証拠（経営計画の認定書、施業記録など）はハッシュで登録する。claimを作るときに**元ファイルを読み直して一致した場合だけ**照合済みとして渡し、それ以外はCompilerが`content_hash`エラーで止める。
- `formal_certification:false`、`certified_tco2_removals:null`を状態の不変条件にしている。

## 使い方（合成データ）

```bash
S=/tmp/naft-forest.json
P=config/forest-register-profiles/synthetic-v1.json
node scripts/forest-stand-cli.mjs --action init --state $S
node scripts/forest-stand-cli.mjs --action import-register --state $S --input fixtures/p78-forest-register-2026-synthetic.csv --profile $P --pref 20 --year 2026
node scripts/forest-stand-cli.mjs --action import-map --state $S --input fixtures/p78-forest-plan-2026-synthetic.geojsons --profile $P --pref 20 --year 2026
node scripts/forest-stand-cli.mjs --action receipt --state $S
```

`add-stand → propose → review → evidence → claims → impact`の順で、Compilerによる再検証の一覧まで手元で出せる。2027年版の合成CSVはShift_JISで、分割（1-3→1-3-1/1-3-2）、番号の付け替え（4-1→8-1）、重複行を含む。

## 実データへ進むとき

1. 林野庁が2026年2月に発表した全国統一仕様の森林GISオープンデータ（森林計画対象森林レイヤ、20mの森林資源メッシュ等、G空間情報センター）か、都道府県の森林簿・森林計画図を選ぶ。
2. **利用条件を読む**。県によって条件が異なり、複製・譲渡・販売を禁じている例もある。雛形の`redistribution`は`NOT_VERIFIED`のままにし、許諾が明記されている場合だけ`PERMITTED`にする。
3. `TEMPLATE-prefecture.json`をリポジトリ外にコピーし、実際のCSVヘッダーと林種の値を書き写す。存在しない列があれば取り込みは止まる。
4. GeoPackageやShapefileはGDALの`ogr2ogr`があれば取り込める。

## 検査

- `tests/p78-forest-stand.test.mjs`：CSV解析、プロファイル・個人情報・利用条件のガード、計画図の突合、分割・番号付け替えで勝手に紐づかないこと、監査チェーンの改ざん検出、未照合証拠で止まること、FO-001参照Packが常に止まること、60小班の影響が独立した全再計算と矛盾しないこと（見逃し0）、CLIがリポジトリ内に書かないこと。
- `tests/p78-gis-layer-manifest.test.mjs`：47県の遅延読込定義が、パネルの県コード・P76レジストリと一致し、不正なパスや種別を拒否すること。
- `tests/browser-p78-forest-smoke.mjs`（実Chrome）：起動直後は土壌モジュール0本、選んだ県だけ読み込み、新潟(15)で新潟県の台帳が出ること、森林パネルの件数とCompilerの結果の一致、390pxで横はみ出しがないこと。

- 森林簿の合成CSV 2件は原本のCRLF・UTF-8／Shift_JISのバイト列を保持する。`.gitattributes`はこの2件だけCRLFを正規の行末とし、実際の末尾空白検査は残す。回帰テストは両ファイルのGit blobハッシュと文字コードを固定して検査する。

## 同時に直したこと

- **P76全国土壌レジストリの県コード誤り**：配布ZIPのフォルダ番号（例：`k18新潟県`）をJISコードとして使っていたため、新潟〜静岡の8県のコードがずれ、新潟(15)を選ぶと山梨県の台帳が表示されていた。県名からJIS X 0401コードを引き、元の番号は`source_folder_code`として保持する。
- **47県の土壌パネルを遅延読込に**：起動時の76本のスクリプト（土壌だけで約476KB）を、選んだ県の分だけ読む形にした。

## 限界

FO-001の正式な適用判定、森林吸収量、伐採木材、永続性・追加性、クレジット発行量は扱わない。合成の小班・ルール・結果は工学上の検査であり、森林の現場や審査機関での有効性を示さない。
