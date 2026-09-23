# NaFT — Version-aware MRV Evidence Compiler + Re-verification Engine

**版管理されたMRV証憑コンパイラ＋差分再検証エンジン。**\n\nNaFTは、方法論・証憑・係数・人間判断を版付きで保持し、変更時にどのClaimを再検証すべきかを依存関係と変更差分から根拠付きで特定する研究プロトタイプです。

- **研究上の問題**：方法論の版・証憑・係数・圃場情報が変わると、どのClaimの再検証が必要か追跡しにくい。
- **現在のプロトタイプ**：ビルド不要のJavaScript研究プロトタイプ。入力Evidenceを正規化し、版を固定した評価・依存graph・Monitoring Packageを生成する。
- **中心研究問い**：「頻繁に改定されるMRV方法論と異種Evidenceを第三者が再計算・再検証可能な構造へ変換し、変更時に影響を受けるClaimだけを特定できるか？」
- **実装済み**：Versioned Pack registry、決定論的diff、JSON provenance graph、4種の変更の影響分析・再評価、exception単位の`ACCEPT / REJECT / NEED_MORE_EVIDENCE / ABSTAIN`、最終宣誓、hash付きJSON export、36件のSynthetic conformance corpusと自動KPI、100 Claimの合成版変更実験。従来のAG-005参照評価と182件の回帰テストも維持。
- **未実装・未確認**：AG-005 v3.5一次資料byte snapshot/hashの独立検証、AG-004本文の確認、完全な制度ルール翻訳、現場での正確性・費用削減・検証機関受入れ。公式要件不明は`UNKNOWN / CONFIG_REQUIRED / UNSUPPORTED`で停止。正式削減量`result`は常に`null`。
- **審査用デモ**：`naft-app.html#/reviewer-demo`を開くと、未踏審査向けの60秒Reviewer Demoで100 Claimの変更影響解析をlive計算できる。通常研究UIでは**Demo A / B / C**も維持。A＝自動draft、B＝6 Claimの軽量版変更fixture、C＝曖昧なidentityから人間判断。[操作手順](docs/demo-script.md)。

内部PASS、Pack release approval、最終宣誓は正式認証ではありません。外部登録簿へ接続しません。

## 実行・テスト

Node.js 20+、Python 3、bashを使用します。GitHub ActionsではNode 24で全テストを実行します。ビルド、外部CDN、実行時依存パッケージはありません。

```bash
bash tests/run.sh
```

**525 passed / 0 failed**（既存182＋Compiler333＋Mitou impact experiment 10）。加えて、GitHub Actions上のheadless Chromeで `#/reviewer-demo` の実ブラウザroute renderをsmoke検証しています。[Test report](docs/test-report.md)、[自動生成KPI](reports/evaluation-kpis.json)、[100 Claim影響解析実験](reports/mitou-impact-experiment.json)を参照。

## 未踏アドバンスト審査用Reviewer Demo

`#/reviewer-demo` は申請書で使う100 Claim合成改定実験を、同じ `analyzeImpact` と同じClaim生成規則でブラウザから実行する審査向け表示です。100 / 30 / 70 / 15 / 15 は固定ラベルではなく実行結果から描画します。代表Claimではdependency理由、successor有無、`supersedes`を確認できます。Human Decisionのbindingについては、input fingerprint / Pack hashが変わればstaleになることを合成データで表示します。

これは研究用Synthetic demoです。70%は件数ベースのscope reductionであり、時間・費用・field accuracy・verifier acceptanceを意味しません。通常の6 workflow routesは削除していません。

## 100 Claim 合成差分再検証実験

`NAFT-SYNTHETIC@1 → @2` の明示的な合成方法論改定を100 Claimへ適用する決定論的実験をCIに固定しています。100件すべてが変更版の候補集合に入る一方、active dependency projectionにより**30件だけを再検証対象として抽出し、70件はsuccessorを生成せず非影響として残します**。30件の内訳は15件が自動再評価、15件が新規Evidence不足で停止です。

これは**件数ベースの再検証スコープ70%削減**であり、処理時間70%短縮、MRV費用70%削減、実制度での精度・受入れを意味しません。元Claimの不変性、再実行決定性、reverified successorの`supersedes`連結もテストします。

## 方法論Packと境界

| Pack | 実装上の扱い |
|---|---|
| AG-005 `3.1-reference` | 既存版を保持。公開意見募集PDFの保存済みSHA-256を固定。採択状態・適用係数・完全なCompiler翻訳は未確認 |
| AG-005 `3.5` | **NOT REGISTERED**。2026-09-21の修正時点で一次資料byte列とSHA-256を独立検証できず、制度内容を推測してPack化していない |
| AG-004 `UNKNOWN` | 研究上はAG-004 Ver.2.4原文を確認済み。ただしExecutable Packへの翻訳は未実装で、Compiler上は`UNSUPPORTED`のfail-closed placeholderを維持。制度対応済みとは扱わない |
| NAFT-SYNTHETIC `1` / `2` | 差分・再検証実験の明示的合成ルール。公式方法論改定でも実農家データでもない |

新しい公式AG-005 Packは、一次資料の原文byte列・出典・versionを検証できるまで追加しません。[出典確認記録](docs/methodology-sources.md)。

## 審査用Reviewer Demo + 6つの研究ワークフロー

| Hash route | Responsibility |
|---|---|
| `#/reviewer-demo` | **審査用entry point**。100 Claimの変更影響解析をブラウザ上で再計算し、代表Claimの理由を表示 |
| `#/methodologies` | Registry、出典・版・Pack承認、デモ入口 |
| `#/evidence` | Raw/structured JSON Evidence入力、Manifest、従来のファイルhash検証 |
| `#/readiness` | 決定論的評価、自動draft、保存済みClaimへの版変更適用 |
| `#/exceptions` | 証憑競合、identity、係数変更、方法論例外 |
| `#/review` | 明示的例外判断、最終Package attestation |
| `#/packages` | 再現可能なJSON、graph、Program集計 |

以下の6 routeが研究ワークフロー本体です。Reviewer Demoはその1ステップではなく、審査向けentry pointです。\n\n通常案件：Evidence → evaluation → draftまで途中承認なし。人間は各`HUMAN_REVIEW_REQUIRED`例外を個別に判断し、Pack公開承認、最終宣誓を担当します。hard error（`UNSUPPORTED / EVIDENCE_REQUIRED / tamper / methodology mismatch / deterministic failure`）はHuman override不可です。Operator / Reviewer / Maintainerはローカルデモ役割で、本番認証ではありません。

## Reproduction and data

Compilerはclock・乱数をPackage生成に使いません。同じ入力・Pack・任意の明示的判断・supersedesから同じhashを生成します。写真のbyte列、営農・IoT・GISのJSONをhash/構文/metadataのレベルで正規化します。画像理解やセンサー校正、GIS幾何検証は未実装です。

`naft_mrv_core_v1`の既存storeを使用します。通常ブラウザはメモリのみで再読込時に消去、`window.storage`があれば同じadapterで保存します。新しいrunは旧runを履歴として残し、旧Packageの現行exportを停止します。従来AG-005操作のID・日時は実行ごとに変わります。

[Architecture](docs/architecture.md) · [Data model](docs/data-model.md) · [Human boundaries](docs/human-in-the-loop.md) · [Limitations](docs/known-limitations.md) · [研究段階](docs/mitou-advanced-concept.md) · [Before / After](reports/baseline.json) · [MIT License](LICENSE)
