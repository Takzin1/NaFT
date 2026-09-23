# NaFT — Version-aware MRV Evidence Compiler + Re-verification Engine

**版管理されたMRV証憑コンパイラ＋差分再検証エンジン。**

NaFTは、方法論・証憑・係数・人間判断を版付きで保持し、変更時にどのClaimを再検証すべきかを依存関係と変更差分から根拠付きで特定する研究プロトタイプです。

- **研究上の問題**：方法論の版・証憑・係数・圃場情報が変わると、どのClaimの再検証が必要か追跡しにくい。
- **現在のプロトタイプ**：ビルド不要のJavaScript研究プロトタイプ。入力Evidenceを正規化し、版を固定した評価・依存graph・Monitoring Packageを生成する。
- **中心研究問い**：「頻繁に改定されるMRV方法論と異種Evidenceを第三者が再計算・再検証可能な構造へ変換し、変更時に影響を受けるClaimだけを特定できるか？」
- **実装済み**：Versioned Pack registry、決定論的diff、JSON provenance graph、4種の変更の影響分析・再評価、exception単位の`ACCEPT / REJECT / NEED_MORE_EVIDENCE / ABSTAIN`、最終宣誓、hash付きJSON export、36件のSynthetic conformance corpusと自動KPI、100 Claimの合成版変更実験。従来のAG-005参照評価と182件の回帰テストも維持。
- **未実装・未確認**：AG-005の現行制度版をExecutable Packとして固定・完全翻訳すること、AG-004 Ver.2.4のExecutable Pack化、現場での正確性・費用削減・検証機関受入れ。公式要件不明は`UNKNOWN / CONFIG_REQUIRED / UNSUPPORTED`で停止。正式削減量`result`は常に`null`。
- **審査用デモ**：[GitHub Pages Reviewer Demo](https://takzin1.github.io/NaFT/#/reviewer-demo) から直接開ける。100 Claimの変更影響解析をブラウザ上で再計算する。通常研究UIでは**Demo A / B / C**も維持。A＝自動draft、B＝6 Claimの軽量版変更fixture、C＝曖昧なidentityから人間判断。[操作手順](docs/demo-script.md)。

内部PASS、Pack release approval、最終宣誓は正式認証ではありません。外部登録簿へ接続しません。

## 実行・テスト

Node.js 20+、Python 3、bashを使用します。GitHub ActionsではNode 24で全テストを実行します。ビルド、外部CDN、実行時依存パッケージはありません。

```bash
bash tests/run.sh
```

**536 passed / 0 failed**（既存182＋Compiler344＋Mitou impact experiment 10）。既存535 assertionsは削除・skip・書換えせず保持し、lineage cycle専用regression 1 assertionを追加。加えて、GitHub Actions上のheadless Chromeで `#/reviewer-demo` を開き、変更影響実験buttonを実際にclickし、100 / 30 / 70 / 15 / 15のmetric描画まで検証しています。[Test report](docs/test-report.md)、[自動生成KPI](reports/evaluation-kpis.json)、[100 Claim影響解析実験](reports/mitou-impact-experiment.json)を参照。

## 未踏アドバンスト審査用Reviewer Demo

`#/reviewer-demo` は申請書で使う100 Claim合成改定実験を、同じ `analyzeImpact` と同じClaim生成規則でブラウザから実行する審査向け表示です。100 / 30 / 70 / 15 / 15 は固定ラベルではなく実行結果から描画します。代表Claimではdependency理由、successor有無、`supersedes`を確認できます。Human Decisionのbindingについては、input fingerprint / Pack hashが変わればstaleになることを合成データで表示します。

これは研究用Synthetic demoです。**30 / 70は性能指標ではありません。** fixtureをstandard 70 / intensive 15 / intensive_complete 15で構成しているため、この合成実験では30件が再検証対象、70件が非影響になります。fixture構成を変えれば30 / 70も変わります。時間・費用・field accuracy・verifier acceptanceや、実制度での再検証率を意味しません。通常の6 workflow routesは削除していません。

## 100 Claim 合成差分再検証実験

`NAFT-SYNTHETIC@1 → @2` の明示的な合成方法論改定を100 Claimへ適用する決定論的実験をCIに固定しています。fixtureはstandard 70件、intensive 15件、intensive_complete 15件で構成します。v2のintensive専用変更に依存する30件だけを再検証対象とし、standard 70件はsuccessorを生成せず非影響として残します。30件の内訳は15件が自動再評価、15件が新規Evidence不足で停止です。

**この30 / 70はfixture構成に由来する合成結果であり、性能指標ではありません。fixture構成を変えれば比率も変わります。** 処理時間、MRV費用、精度、受入れ、実制度での再検証率を推定する値ではありません。元Claimの不変性、再実行決定性、reverified successorの`supersedes`連結もテストします。

## 方法論Packと境界

| Pack | 実装上の扱い |
|---|---|
| AG-005 `3.1-reference` | **歴史的参照版**として保持。Ver.3.1は2025-02-24までの版であり、現行制度対応を意味しない。保存済みSHA-256を固定しているが、適用係数・完全なCompiler翻訳は未確認 |
| AG-005 現行制度版 | **NOT REGISTERED**。e-Gov一次資料ではVer.3.3を確認済み、2025年9月の第三者資料はVer.3.4を参照しているが、現行最新版の原文byte列・SHA-256・完全な制度差分を本repositoryでは独立固定していないためPack化しない |
| AG-004 `UNKNOWN` | 研究上はAG-004 Ver.2.4原文を確認済み。ただしExecutable Packへの翻訳は未実装で、Compiler上は`UNSUPPORTED`のfail-closed placeholderを維持。制度対応済みとは扱わない |
| NAFT-SYNTHETIC `1` / `2` | 差分・再検証実験の明示的合成ルール。公式方法論改定でも実農家データでもない |

新しい公式AG-005 Packは、一次資料の原文byte列・出典・version・適用条件を検証できるまで追加しません。[出典確認記録](docs/methodology-sources.md)。

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

以下の6 routeが研究ワークフロー本体です。Reviewer Demoはその1ステップではなく、審査向けentry pointです。

通常案件：Evidence → evaluation → draftまで途中承認なし。人間は各`HUMAN_REVIEW_REQUIRED`例外を個別に判断し、Pack公開承認、最終宣誓を担当します。hard error（`UNSUPPORTED / EVIDENCE_REQUIRED / tamper / methodology mismatch / deterministic failure`）はHuman override不可です。Operator / Reviewer / Maintainerはローカルデモ役割で、本番認証ではありません。


## 研究系譜・凍結参照

- [Pre-Mitous full implementation snapshot `6fac0dd`](https://github.com/Takzin1/NaFT/commit/6fac0dddfcfec091bad51a69365cf0e043b9608e) — 当時のREADMEでスモークテスト276項目を記録。
- [IEEE frozen candidate `6f7717d`](https://github.com/Takzin1/NaFT/commit/6f7717da6e737c946b9b09e073a2dfc1ebd4e7fa) — IEEE向けCandidate lifecycleを凍結した履歴点。当時137項目。
- 現在の未踏向けmainは、上記IEEE版からWallet / Marketplace / Token lifecycle等を切り離し、MRV Core / change-controlへ集中している。

## Reproduction and data

Compilerはclock・乱数をPackage生成に使いません。同じ入力・Pack・任意の明示的判断・supersedesから同じhashを生成します。写真のbyte列、営農・IoT・GISのJSONをhash/構文/metadataのレベルで正規化します。画像理解やセンサー校正、GIS幾何検証は未実装です。

`naft_mrv_core_v1`の既存storeを使用します。通常ブラウザはメモリのみで再読込時に消去、`window.storage`があれば同じadapterで保存します。新しいrunは旧runを履歴として残し、旧Packageの現行exportを停止します。従来AG-005操作のID・日時は実行ごとに変わります。

[Architecture](docs/architecture.md) · [Data model](docs/data-model.md) · [Human boundaries](docs/human-in-the-loop.md) · [Limitations](docs/known-limitations.md) · [研究段階](docs/mitou-advanced-concept.md) · [Before / After](reports/baseline.json) · [MIT License](LICENSE)
