# P14｜Gimje水田CH₄原本ZIP＋圃場Excel：実バイト取込・検証結果
**2026-11-03 / source-native evidence intake / 研究用途・認証用途外**

## 原本をこのターンで実際に開いた
ユーザーが提供した `ch4(1).zip` と `input_fields_meta(1).xlsx` は、[Zenodo 10.5281/zenodo.17111992](https://zenodo.org/records/17111992)に掲載された元の `ch4.zip` および `input_fields_meta.xlsx` と**公開MD5値が一致**した。

| 原本 | 実バイト長 | 公表MD5と一致 | 実測SHA-256 |
|---|---:|---|---|
| `ch4.zip` | 66,312 | `b9ada3a76a2bce1dbd3c9c77f51424f7` | `719b148d1a4f08e31bc146f412c920ae1472ca1a3a4d6dd81d882c1ef79fe813` |
| `input_fields_meta.xlsx` | 16,705 | `ba661a41238697b7ac1915c0d3890aa2` | `6c609759ab25bc84cb909830800be4bac086e42a51ac43a11c4367a9c52b1298` |

MD5一致は公開配布ファイルの**同一性の根拠**であり、測定器の校正・論文著者の真正性・データ品質・原本再配布許可の保証ではない。再配布権限を独立に認証していないため、公表GitHubに元ZIP・XLSX・解凍した60実測CSV・完全なP7変換CSVを転載しない（オフラインで本人が利用できる）。座標・現場担当者・圃場別原観測は新規掲載しない。

## ZIPを解凍した結果
- `ch4/` 内の**60ファイルのCSV**と、メタデータシートの**60圃場**の`field_id`が全件一対一に一致。
- CSV合計**8,391日別行**、うち`ch4_flux`が非欠測の値は**1,422行**（16.9%）、欠測は**6,969行**。負フラックス**31件**は観測符号のまま残し、計測アーティファクトか物理現象か判断留保する。
- 日単位の`course_type`は **flooding 5,895、drainage 2,019、awd 477**。これは状態列であり、`input_fields_meta.xlsx`の圃場処理`water_management`とは別。
- 原Excelの処理群は`cf`21、`md_14days`9、`md_21days`9、`md_28days`3、`md_14days+awd`9、`md_21days+awd`6、`md_28days+awd`3圃場。無理にAWD/CFの二択へ変換しない。
- 2022年：18圃場 / 2,502日別行 / CH₄値576 / 欠測1,926 / 負19。
- 2023年：15圃場 / 2,055日別行 / CH₄値330 / 欠測1,725 / 負0。
- 2024年：27圃場 / 3,834日別行 / CH₄値516 / 欠測3,318 / 負12。

**P7研究用CSV**は既存の`scripts/p8-gimje-native-dock.py`仕様に従って再作成。生成CSVは**826,396 bytes**、SHA-256
`132e1cc623df49e3bae8dc57289037dcc6b218954773e450df50e65f65c4b140`。
`DAT`の日付＝メタデータの植付日＋原CSVのDAT（元著者Rコードの扱いと一致）。元の空欄は`NA`、QCは`UNKNOWN`、ソース元データの圃場処理とその日の水状態を混同しないため、従来のP7`water_management`は`UNKNOWN`を維持する（これはP7フィールド粒度の限界）。

## NaFTに組み込んだもの
- `research/p14-gimje-real-original-source-audit-2026-11-03.json`：実原本のSHA/公表MD5、原データ・年度・処理区分の検査件数、研究上の制限。
- `scripts/p14-gimje-real-original-audit.py`：**実原本を再読込**して既存P8→P7の変換を実行、SHA・全年度集計・処理別件数・欠測と負の値を比較する厳格なオフラインゲート。元ファイルはGitHubに書き出さない。
- `src/gimje-real-source-view.js`：`#/gx-data`で、研究用の実測データ件数、欠測、負値、年別、処理群別に表示。
- `tests/p14-gimje-real-source-audit.test.mjs`：固定原本ハッシュ、集計整合、既存UIを損なわないこと、勝手なMRV認証への昇格禁止をCIで検査する。
- P8が以前「外部ファイル未取得」と記述した文書は**当時の履歴**として保持。今回の新たなP14成果により、この特定2ファイルの実バイト照合は実行済みとなった。

## 原本の実行・再検証
ローカルの**権限を持った環境のみ**で次を実行できる。セキュリティ上ZIPは`scripts/p8-gimje-native-dock.py`の展開制限を通過させる。

```bash
python3 scripts/p14-gimje-real-original-audit.py /private/ch4.zip /private/input_fields_meta.xlsx
python3 scripts/p8-gimje-native-dock.py dock /private/ch4.zip /private/input_fields_meta.xlsx /private/gimje-p7.csv /private/gimje-p8-receipt.json
python3 scripts/p8-gimje-native-dock.py verify /private/ch4.zip /private/input_fields_meta.xlsx /private/gimje-p7.csv /private/gimje-p8-receipt.json
node tests/p14-gimje-real-source-audit.test.mjs
bash tests/run.sh
```

## 明示的な未検証範囲
このファイルは公開原本と一致する研究データであって、**8,391件の測定済CH₄フラックスではない**。原Excelの`seasonal_ch4`と`grain_yield`は報告値として存在するが、P14では非欠測1,422行だけから季節積分値を自動計算・再現したと称さない。独立した測定QC・校正・機器条件・日間補間規則・分散構造・サンプル独立性・単位検証・出典原データ再頒布権は未判定。水管理群の単純平均や比較は処理効果・因果推論ではなく、J-Credit/Verra/排出削減量/tCO₂eへの自動接続は禁止する。
