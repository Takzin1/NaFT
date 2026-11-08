# P26｜世界クレジット登録簿・Jブルー原本の段階取込（2026-11-08）

**NaFT Coreの初回4ファイル登録。原本SHA、出典、公開可能な少数事実、11,856プロジェクトのローカル正規化プログラムを追加。今後の追加投入に対応。**

> **重要**：公開されたクレジット発行履歴は、NaFTによる権利保有、現在の登録簿状態、譲渡権限、Web3トークン発行権限を保証しない。

## 今回登録した資料

| 資料 | 収録内容・版 | GitHubに置いたもの |
| --- | --- | --- |
| Berkeley VROD v2026-08 | 10シート・11,856プロジェクト、2026-08-31まで | CC BY 4.0帰属、SHA、6登録簿集計、ローカル用正規化プログラム |
| Berkeley Registry Files v2026-08 | 31シート・約64MB、各登録簿の発行・償却・プロジェクト | SHA、31シートの範囲一覧。元の各登録簿データの再配布権は別審査 |
| Jブルークレジット管理簿 ver5.0 | 2026-10-16時点・PDF 1頁 | 三つのプロジェクト、五つの小規模シリアル区間を手動確認して登録 |
| Jブルークレジット手数料 | 2026-06-29時点・PDF 2頁 | 制度説明の少数の金額・条件・頁番号 |

[原本ハッシュ・出典台帳](../research/registry-source-intake-2026-11-08/sources.json)、
[31シート一覧](../research/registry-source-intake-2026-11-08/registry-sheets.json)。

Berkeley本体のREAD FIRSTシート8–9行目には、CC BY 4.0と指定引用文がある：

> Pamela Quartson, Barbara K Haya, Tyler Bernard, Aline Abayo, Xinyun Rong, Ivy S So, Micah Elias. (2026). Voluntary Registry Offsets Database v2026-08, Berkeley Carbon Trading Project, University of California, Berkeley. https://gspp.berkeley.edu/berkeley-carbon-trading-project/offsets-database

上記本体と、各第三者登録簿の原資料の権利は同一だと仮定しない。原本4ファイルや全シリアル表はPublic Repoに置かない。

## 実際のファイルから検査した値

Berkeley PROJECTSシート全11,856レコードをストリーミング処理。登録簿別のプロジェクト件数：

| ACR | ART | CAR | GOLD | ISO | VCS |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 998 | 30 | 1,283 | 4,189 | 71 | 5,285 |

登録簿とProject IDの組による重複は0件。Issued/Retired/Remainingの公開集計は[こちら](../data/registry-source-intake-2026-11-08/berkeley-summary.json)。Excel内部の浮動小数の表示ずれがあるため、集計値は小数第3位で表示。独立したレジストリ検証や保有残高照合ではない。

Jブルー資料では、32.5 t-CO₂が325シリアルの連続範囲に対応する事例を確認した。本例は0.1 t-CO₂/シリアルであり、**全レジストリをこの係数で固定してはいけない**。別件の4.9 t-CO₂と0.1 t-CO₂の2区間も確認し、[少数の登録簿実例](../data/registry-source-intake-2026-11-08/jblue-ledger-examples.json)に記録。

手数料資料では、公募譲渡によらない認証発行は税込110,000円、一般移転登録は税込1,100円＋公募譲渡平均参考単価×10%×数量（t-CO₂）。2026-06-29時点の平均参考単価は税込75,900円/t-CO₂。これをリアルタイム市場価格と誤認しない。[手数料と条件](../data/registry-source-intake-2026-11-08/jblue-fees.json)。

## ローカル4原本を照合して全PROJECTSを正規化

    python3 scripts/p26-global-registry-intake.py \
      --vrod "/local/Voluntary-Registry-Offsets-Database--v2026-08.xlsx" \
      --registry "/local/VROD-registry-files--2026-08.xlsx" \
      --jblue-ledger "/local/ブルーカーボン.pdf" \
      --jblue-fees "/local/BlueCarbon2026:6:29.pdf" \
      --out ".naft-local/registry-intake"

生成結果は大容量の全11,856行のberkeley-vrod-projects.ndjsonとintake-report.json。元Excel行、方法論、国、Issued/Retired/Remainingの**文字列**、出典ID、未認証状態を保持する。ファイルはGit管理対象外のローカルディレクトリに出力し、元ファイルのSHA・サイズ・31シート・11,856行を検証する。将来新版の原本は新しい出典ID・別SHAで登録し、以前の出典を上書きしない。

CI用のテストは第三者の原本を不要とする架空の2レコードXLSXを生成し、正常変換、改ざん検出、重複ID、数量整合、出典台帳を点検する。

    python3 tests/p26-global-registry-intake.test.py

## 法的・科学的境界

- 出典ハッシュはアップロードされたバイト列との一致であって、登録簿のリアルタイム真正性や法的権利を証明しない。
- 具体的な保有・償却・譲渡状態は制度ごとの有効な規約と正本/API確認が必要。
- 正規化結果に認証済t-CO₂やWeb3発行権限を勝手に付与しない。トークン発行、販売、償却、RPC通信は行わない。
- 元PDF・登録簿別の生の大容量ExcelをPublic Repoに再配布しない。
- 手数料は資料記載時点の参考値。料金改定や個別例外に対応できるよう日付・出典節を記録する。

## 次の投入

J-クレジット登録簿CSV、CAD Trust、Verra、Gold Standard、JPX価格資料は、それぞれの版・権利を確認したうえで別登録する。まず出典、次に数量・シリアル・無効化履歴、最後に実務者レビューと発行権限を確認する。
