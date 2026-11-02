# NaFT P1：方法論別の再現計算と日本語比較（2026-11-02）

## 目的
IEEE版のGold Standard教材計算を日本語NaFTに移植し、P0の原観測証憑ゲートと並べて**「算術の再現」と「科学的・制度的な妥当性」を分ける**。Gold Standard（教材）、Verra（VM0051参照）、J-クレジット（AG-005参照）を別名前空間で扱う。

実装ブランチ：`feat/p1-rice-methods-independent-replay-ja-20261102`。P0 [PR #45](https://github.com/Takzin1/NaFT/pull/45) を親とする。**mainは変更しない**。

## 今回実装
1. **出典・式のレジストリ**：`research/rice-methodology-routing/source-formula-register.json`。Gold Standardの3教材式、Verra VM0051 1.1のQA1/QA2/QA3の参照経路、文書ハッシュと要件を保持する。
2. **GS教材の厳密演算**：`scripts/ieee-gs-worksheet-replay.mjs`。BigInt有理数、3つのExcelセル式の限定再計算、非承認時null、入力変更のSHA-256レシート。
3. **独立Python計算**：`scripts/ieee-gs-worksheet-independent-oracle.py`。JavaScriptロジックをインポートせずDecimalで別計算。
4. **新規・毎回二重演算**：`scripts/p1-gs-independent-replay.mjs`。許可された教材リクエストについて同じ入力ファイルを**毎回実際に**JSとPythonで処理。式・セル・12桁小数値が一致しなければ失敗。元の出典メタデータ・両エンジンのハッシュ・入力ハッシュ付きのレシートを生成。生成レシートのverify時も両エンジンを再実行。
5. **GS選択的な教材再計算**：`scripts/ieee-gs-selective-reverification.mjs`。既存レシートを確認し、変更入力だけを再演算する実装。ただし独立Pythonの毎回実行はこのバッチ処理には組み込まれていない（各リクエストの二重検証は上記CLIで別途行う）。
6. **比較レポート**：`scripts/p1-method-family-comparison.mjs` によりGS/Verra/J-Creditの文書版・分類・算定可否を日本語JSON/Markdownで出力。日本語UI `naft-app.html#/method-family` は固定研究時点の表示で、CIが動的レジストリと突き合わせる。

## コマンド（研究教材のサンプル）
```bash
node scripts/rice-methodology-router.mjs check-registry
node scripts/p1-method-family-comparison.mjs --format markdown
node scripts/p1-method-family-comparison.mjs --format json
node scripts/p1-gs-independent-replay.mjs generate fixtures/p1-gs-training-tier2-request.json > /tmp/naft-p1-training-receipt.json
node scripts/p1-gs-independent-replay.mjs verify fixtures/p1-gs-training-tier2-request.json /tmp/naft-p1-training-receipt.json
node tests/p1-gs-independent-replay.test.mjs
bash tests/run.sh
```
この教材サンプルの算術出力は `6.480836784000`（**教材のシート計算値**）。tCO2eとしての実績値ではない。入力の `evidence: true` は教材のルート選択用自己申告であり、証拠ファイルが真正であるという宣誓・確認ではない。

## 実装した式（特定のExcel教材セルに限定）
| Gold Standard教材のシート | セル | 原式 |
| --- | --- | --- |
| Tier 1_Simplified | E5 | `=E9*E10*E14/1000*E15*(1-E30)` |
| Tier 2_Country specific | E4 | `=(E8-E22)*(1-E60)` |
| Tier 3_Direct measurement | E4 | `=(E8-E17)*(1-E49)` |

原ワークブックの編集・実行、制度全体の計算、シナリオの全GHG積算は未実装。既存の例示係数（CH4 GWP28等）を現在の公式値とみなさない。原Excel、研究PDF、観測生ZIPは今回コピーしていない。

## 残る科学的な制約
- Gold Standard VVBチェックリストQ23のTier 1/3説明はワークブックと不一致。未解決のまま保持する。
- Verra QA2のフラックスチャンバー要件をJapanFluxのECデータと同義に扱わない。GS TierとVerra QAは番号一致でも自動変換しない。
- J-クレジットAG-005の**現行採択版・係数の適用範囲**は本資料から確認できない。Verra/GSの式をJ-Creditに移植しない。
- P0で明らかになったJP-HrtのFCH4数値候補1,915件は独立QC未確認、欠測15,605件、BADM開始日前の候補1,689件の根拠不一致が残る。今回の算術一致はその問題を解消しない。
- 出典のSHAは資料バイト/作成コードの整合性であり、出版社真正性・外部検証・正式認証ではない。正式 `certified_tco2e`、年実測CH4、クレジット発行額は常にnull。
- リアルタイム外部データ、正式な方法論の現行版確認、実際のExcel再実行、独立VVB判断、チェーン取引は行っていない。

## P2への受け渡し
全計算の入力と計算ロジック、観測のQC、版付きルール、例外判断の根拠、変更差分、再現レシートを一つの監査パケットに束ねる。ただし無確認の入力からの正式認証値は引き続き拒否。

## 主要な参照
- IEEE元実装：[GitHub IEEE ClimateChain Edition](https://github.com/Takzin1/NaFT-IEEE_Climate_Hackathon_Edition)
- [P0原観測エビデンスの限界](source-readiness-ja-2026-11-02.md)
- [GS教材の独立算術再現仕様](ieee-gs-independent-workbook-replay-2026-10-19.md)
- [制度別式ルーティングの背景](rice-methodology-formula-routing-2026-10-19.md)
