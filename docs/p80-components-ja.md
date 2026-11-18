# NaFT P80｜運用に足りなかった構成要素：ルール演算、入力の事前チェック、稲作の取込、見直しリスト

「データを入れる → 評価する → ルールが変わる → 人が対応する」を端から端までたどり、欠けていた部品を足した。

## A. ルール演算の拡張（`src/mrv-compiler.js`）

| 追加 | 意味 |
|---|---|
| `lte` / `lt` | 以下・未満 |
| `neq` | 等しくない |
| `in` | 値の配列のどれか（`value`は配列必須） |
| `input_ref` | 定数やパラメータではなく、別の入力パスと比べる |

右辺が複数ある（`input_ref`と`value`／`parameter`の併用）、`in`に配列がない、未知の演算などは`Unsupported rule operation`で止まる。既存の演算の結果と出力の形は変えておらず、中核の1,165件の検査はそのまま通る。

これで、AG-005 Ver.3.1の「登録申請の翌暦年まで」（`lte 1`）と、Ver.3.3の「延長を始めた年より前でない」（`cert_start_year ≥ extension_start_year`）を事前計算なしに書けるようになった。3.1→3.3の差分には「翌暦年の選択肢の廃止」が加わる。

## D. Packが要求する入力の事前チェック（`packInputPaths` / `preflightClaim`）

Packのルール・条件・計算が参照する入力パスを列挙し、claimに欠けがあれば`INPUT_REQUIRED`を返す。例外・対象外条件の入力は、評価では「欠けている＝条件に当たらない」と扱われて素通りするので、別に`CONDITION_INPUT_UNCONFIRMED`として表に出す。既存の農業デモ（NAFT-SYNTHETIC）は`expert_case`と`special_process`を持っておらず、このチェックで初めて見えるようになった（評価結果そのものは変えていない）。

## B. 生産管理記録 → AG-005の申請データ（`scripts/lib/ag005-farm-log.mjs`, `scripts/ag005-claims-cli.mjs`）

P79で読んだ本文どおりに正規化する。

- 中干し日数は開始日・終了日をそれぞれ1日と数える。期間中に出穂したら出穂の前日を終了日にする。出穂が開始日以前なら取込を止める。
- 基準は事業年の前年から連続する直近2か年以上。年2作以上は日数の合計を総作期数で割り、端数は切り上げる。年が飛んでいる圃場はその圃場だけ保留にし（理由を記録）、ほかは続ける。
- 排水性は日減水深×1.22で区分（7.5／12.5 mm/日）。実測がなければデフォルト区分。
- 施用有機物は稲わら90%以上・堆肥1t/10a以上・式5/6/7の経路を記録する（係数は固定しない）。
- 証拠ファイルは一覧から読み直してハッシュを取り、読めたものだけ照合済みとして渡す。読めないものはCompilerが止める。
- 列名に氏名・住所などがあれば止め、出力はリポジトリの外にしか書けない。

```bash
node scripts/ag005-claims-cli.mjs --log fixtures/p80-ag005-farm-log-synthetic.csv \
  --profile config/ag005-farm-log-profiles/synthetic-v1.json --program fixtures/p80-ag005-program-synthetic.json \
  --out /tmp/claims.json
```

## C. 再検証の見直しリスト（`src/reverification-worklist.js`, `scripts/naft-worklist.mjs`）

影響分析の結果を、claimごとの作業に落とす。作業の種類は、証拠を追加／記録・入力を是正／証拠ファイルを再照合／人が判断／対象外／必須入力を補う／例外条件の入力を確認など。各行に、Packの項目、条文（あれば）、変更で新たに生じたかどうか、現在の値と基準を付ける。参照用Packであることなどの設定上の停止理由は、claimごとに繰り返さず全体で1回だけ示す。CSVはBOM付きUTF-8・CRLFで、`= + - @`で始まるセルは表計算の数式として実行されないように無害化する。

```bash
node scripts/naft-worklist.mjs --registry ag005-text --claims /tmp/claims.json \
  --from AG-005@3.1-pc-text --to AG-005@3.3-pc-draft-text --out-csv /tmp/worklist.csv
```

画面（`#/gx-data`）のAG-005と森林のパネルからも、合成データの見直しリストをCSVでダウンロードできる。

## 検査

- `tests/p80-rule-ops-preflight.test.mjs`：新しい演算、不正な書き方で止まること、既存の出力の形が変わらないこと、`input_ref`の参照先の変更を影響分析が拾うこと、事前チェック。
- `tests/p80-ag005-farm-log-worklist.test.mjs`：日数・出穂・基準年・排水性・施用有機物の境界値、取込のガード、両Packでのコンパイル、見直しリストとP79の振り分けの一致、CSVの安全性、CLIの一連の流れ。
- 実Chrome：見直しリストのリンクがCompilerの結果から作られ、BOM付きCSVとして取得できること。

## まだ足りないもの

- 排出係数表（インベントリ）・GWPの版管理と、それを使う計算。原典の数値を固定しないかぎり計算はしない。
- Ver.3.5の原文、FO-001の方法論本文。
- 見直し作業の担当・期限・完了の記録（作業の状態管理）と、複数人での承認・署名。
