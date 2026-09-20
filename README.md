# NaFT — Version-aware MRV Evidence Compiler + Re-verification Engine

**NaFT transforms heterogeneous environmental evidence into methodology-aware, reproducible, human-reviewable MRV packages.**

- **Problem**：方法論の版・証憑・係数・圃場情報が変わると、どのClaimの再検証が必要か追跡しにくい。
- **Current Prototype**：ビルド不要のJavaScript研究プロトタイプ。入力Evidenceを正規化し、版を固定した評価・依存graph・Monitoring Packageを生成する。
- **Research Question**：「頻繁に改定されるMRV方法論と異種Evidenceを第三者が再計算・再検証可能な構造へ変換し、変更時に影響を受けるClaimだけを特定できるか？」
- **Implemented**：Versioned Pack registry、決定論的diff、JSON provenance graph、4種の変更の影響分析・再評価、例外判断、最終宣誓、hash付きJSON export、36ケースの合成Corpusと自動KPI。従来のAG-005参照評価と182件の回帰テストも維持。
- **Not Implemented**：AG-005最新採択版・AG-004本文の確認と完全な制度ルール翻訳、現場での正確性・費用削減・検証機関受入れ。公式要件不明は`UNKNOWN / CONFIG_REQUIRED / UNSUPPORTED`で停止。正式削減量`result`は常に`null`。
- **How to Run Demo**：`naft-app.html`をブラウザで開き、**Demo A / B / C**を順に押す。A＝自動draft、B＝版変更と影響Claim、C＝曖昧なidentityから人間判断。[3分操作手順](docs/demo-script.md)。

内部PASS、Pack release approval、最終宣誓は正式認証ではありません。外部登録簿へ接続しません。

## Run / test

Node.js 20+、Python 3、bashを使用します。ビルド、外部CDN、実行時依存パッケージはありません。

```bash
bash tests/run.sh
```

**500 passed / 0 failed**（既存182＋Compiler318）。DOM stub検証を含みますが、実ブラウザ検証ではありません。[Test report](docs/test-report.md)と[自動生成KPI](reports/evaluation-kpis.json)を参照。

## Packs and boundaries

| Pack | 実装上の扱い |
|---|---|
| AG-005 `3.1-reference` | 既存版を保持。公開意見募集PDFを再取得しSHA-256確認。最新採択・適用係数・完全なCompiler翻訳は未確認 |
| AG-004 `UNKNOWN` | 本文取得403。版・制度パラメータを推測せずUNSUPPORTED |
| NAFT-SYNTHETIC `1` / `2` | 差分・再検証実験の明示的合成ルール。公式方法論改定でも実農家データでもない |

最新の公式AG-005新版を確認できなかったため、公式新版Packは追加していません。[出典確認記録](docs/methodology-sources.md)。

## Six routes

| Hash route | Responsibility |
|---|---|
| `#/methodologies` | Registry、出典・版・Pack承認、デモ入口 |
| `#/evidence` | Raw/structured JSON Evidence入力、Manifest、従来のファイルhash検証 |
| `#/readiness` | 決定論的評価、自動draft、保存済みClaimへの版変更適用 |
| `#/exceptions` | 証憑競合、identity、係数変更、方法論例外 |
| `#/review` | 明示的例外判断、最終Package attestation |
| `#/packages` | 再現可能なJSON、graph、Program集計 |

通常案件：Evidence → evaluation → draftまで途中承認なし。人間は例外、Pack公開承認、最終宣誓を担当します。Operator / Reviewer / Maintainerはローカルデモ役割で、本番認証ではありません。

## Reproduction and data

Compilerはclock・乱数をPackage生成に使いません。同じ入力・Pack・任意の明示的判断・supersedesから同じhashを生成します。写真のbyte列、営農・IoT・GISのJSONをhash/構文/metadataのレベルで正規化します。画像理解やセンサー校正、GIS幾何検証は未実装です。

`naft_mrv_core_v1`の既存storeを使用します。通常ブラウザはメモリのみで再読込時に消去、`window.storage`があれば同じadapterで保存します。新しいrunは旧runを履歴として残し、旧Packageの現行exportを停止します。従来AG-005操作のID・日時は実行ごとに変わります。

[Architecture](docs/architecture.md) · [Data model](docs/data-model.md) · [Human boundaries](docs/human-in-the-loop.md) · [Limitations](docs/known-limitations.md) · [研究段階](docs/mitou-advanced-concept.md) · [Before / After](reports/baseline.json) · [MIT License](LICENSE)
