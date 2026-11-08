# NaFT ドキュメント索引

[READMEへ戻る](../README.md) ／ [審査用デモ](https://takzin1.github.io/NaFT/naft-app.html#/reviewer-demo)

この索引は、審査員・カーボンクレジット／MRV実務者・開発者が目的別に必要な資料へ進むためのものです。**研究用の合成結果、実原本のハッシュ一致、正式な認証・削減効果は別の証拠水準**として扱います。

## まず見る（審査員・初回訪問者）

| 読みたいこと | ドキュメント |
| --- | --- |
| 60秒で動作を確認する | [審査用デモの操作](demo-script.md) |
| 何を実装済みで何を認証していないか | [既知の制約](known-limitations.md) |
| テストをどう数え、何を主張できるか | [テスト報告](test-report.md)、[反例検査の範囲](impact-soundness.md) |
| 技育展向け日本語デモ・説明資料 | [日本語デモ](gikuten-demo.md)、[応募向け説明](gikuten-2026-entry.md) |
| 将来計画の位置づけ | [ロードマップ](roadmap.md)、[研究構想](mitou-advanced-concept.md) |

## 仕組みを調べる（MRV実務・開発）

| 領域 | ドキュメント |
| --- | --- |
| 版管理と変更影響解析の構成 | [アーキテクチャ](architecture.md)、[データモデル](data-model.md) |
| Why/Where来歴理論の研究用実装（添付論文2本） | [Why/Where Provenance Foundations](provenance-why-where-foundations.md)、[論文根拠台帳](../research/literature-2026-11-08/provenance-foundations.json) |
| OPM v1.1・FAIR原則の互換研究 | [OPM/FAIR相互運用](opm-fair-interoperability-ja.md)、[出典・原本SHA](../research/literature-2026-11-08/opm-fair-sources.json) |
| 増分計算・選択的再計算の研究（論文3本） | [增分Compiler研究](incremental-compiler-research-ja.md)、[研究根拠と原本SHA](../research/literature-2026-11-08/incremental-foundations.json) |
| 例外判断・最終確認の条件 | [Human-in-the-loop](human-in-the-loop.md) |
| AG-005/AG-004の制度資料と未確認部分 | [方法論出典](methodology-sources.md)、[現行版の判定境界](ja-ag005-gxets-cost-sync.md) |
| ルール群の比較、条項→証憑→Claimの追跡 | [制度別比較](p1-method-comparison-ja-2026-11-02.md)、[条項・証憑の追跡](p5-clause-evidence-trace-ja-2026-11-02.md) |
| 方法論PDFのローカル確認と版変更 | [原典取込](p3-method-document-intake-ja-2026-11-02.md)、[変更影響](p4-method-source-impact-ja-2026-11-02.md) |
| ソース・品質の準備状況 | [Source readiness](source-readiness-ja-2026-11-02.md)、[調査レポート](research-readiness-evidence-report-2026-10-19.md) |
| 安全性と法的制約 | [セキュリティ](security-checklist.md)、[法務リスク](legal-risk-map.md) |

## 公開データ・原本検証（研究用）

下記は**元ファイルの真正性や再配布権を一括保証するリストではありません**。個々の資料に原典・SHA・実測／合成・対象年・欠測・適用可能範囲を記録しています。

| テーマ | 入口 |
| --- | --- |
| 全国47都道府県の水稲統計とGX画面 | [GXデータ画面](p10-gx-climatetech-ui-data-atlas-ja-2026-11-03.md)、[2025年Excel原本](p12-estat-2025-real-xls-47prefecture-ja-2026-11-03.md)、[2023/24年原本](p13-estat-2023-2024-original-xls-ja-2026-11-03.md) |
| 日本の6作物・1883〜2022年の履歴 | [原本ZIP監査](p16-japan-six-crop-history-real-zip-ja-2026-11-03.md)、[公開CSVと出典](../data/japan-crops-1883-2022/remastered-v1/README.md) |
| 水稲CH₄実測と欠測・品質管理 | [Gimje原本](p14-gimje-original-real-zip-intake-ja-2026-11-03.md)、[日付・観測間隔の品質検査](p15-gimje-sampling-cadence-qc-ja-2026-11-03.md)、[日本の観測原典](japan-original-field-replay-protocol-2026-10-18.md) |
| アジアの水稲CH₄年次GeoTIFF | [P19年次ラスタ研究](p19-asia-rice-ch4-annual-rasters-ja-2026-11-03.md)、[P20元ZIP→公開タイルの再現](p20-rice-ch4-source-replay-ja-2026-11-03.md) |
| 農水省 令和7年気候適応レポート詳細2/3・3/3（P26追加） | [原本SHA・元レポート54〜174頁の索引・選択的適応ケース](p26-maff-r7-adaptation-details-ja.md)、[2分割の出典台帳](../research/registry-source-intake-2026-11-08/maff-r7-adaptation-parts-2-3.json)、[9ケース＋安全政策情報](../data/registry-source-intake-2026-11-08/maff-r7-adaptation-curated-cases.json) |
| 公的MRV PDF 4本（P26：国交省・環境省/NIES・農水省） | [原本版・頁別データ・BDAS CSV／中干し証憑事前検査](p26-government-official-mrv-pdfs-ja.md)、[SHA-256出典台帳](../research/registry-source-intake-2026-11-08/official-mrv-pdfs-2026.json)、[2024/2025公的実績の背景データ](../data/registry-source-intake-2026-11-08/official-2026-government-context.json) |
| J-クレジット・国内クレジット・J-VER登録一覧（P26追加） | [登録見込み1,537行・AG-005方法論版・平日以降の登録簿照合](p26-jcredit-registration-lists-ja.md)、[2原本SHA・5シートの台帳](../research/registry-source-intake-2026-11-08/jcredit-project-registration-sources.json)、[方法論・地域集計](../data/registry-source-intake-2026-11-08/jcredit-registration-summary.json) |
| Jブルー認証手引 Ver.2.6／購入者実証論文（P26追加） | [算定要件・市場エビデンス](p26-jblue-guidance-market-evidence-ja.md)、[原本SHA・制度チェックリスト](../research/registry-source-intake-2026-11-08/jblue-guidance-market-evidence.json) |
| 世界のクレジット登録簿・Jブルー履歴（P26） | [Berkeley＋Jブルー出典取込手順](p26-global-carbon-registry-intake-ja-2026-11-08.md)、[4原本のSHA台帳](../research/registry-source-intake-2026-11-08/sources.json)、[手数料参照値](../data/registry-source-intake-2026-11-08/jblue-fees.json) |
| JAXA 2024土地被覆マップ（段階取込） | [P21最初の3タイル](p21-jaxa-lulc-batch01-ja-2026-11-03.md)、[P22追加の1タイル](p22-jaxa-lulc-batch02-ja-2026-11-03.md)、[P23追加の6タイル](p23-jaxa-lulc-batch03-ja-2026-11-03.md)、[P24追加の6タイル](p24-jaxa-lulc-batch04-ja-2026-11-03.md)、[P25追加の6タイル](p25-jaxa-lulc-batch05-ja-2026-11-04.md) |
| 中干し・J-クレジットの説明資料 | [P18農水省PDF2冊の出典・頁別登録](p18-maff-ag005-guidance-source-intake-ja-2026-11-03.md)、[制度境界](p2-ag005-soc-source-gates-ja-2026-11-02.md) |
| IEEE日本語版の出典・研究移植 | [移植範囲](ieee-japanese-port-2026-10-25.md)、[次段階の監査](ieee-ja-next-stage-roadmap-2026-11-02.md) |
| 原観測の独立演算 | [観測アダプター](japan-observation-adapter-coverage-2026-10-19.md)、[観測統合](japan-aggregate-reconciliation-2026-10-19.md) |

## テスト・貢献方法

- **実行コマンド**：`npm test` または `bash tests/run.sh`。両者は同じスクリプトを呼び、Node.js 20以上・Python 3・Bashが必要です。GitHub ActionsではNode.js 24を利用します。
- **headless Chromeの画面検査**：`bash scripts/ci-browser-smoke.sh`。Chrome/Chromiumが必要で、CIの別ステップで実行されます。
- **貢献前の確認**：[変更チェックリスト](pr-checklist.md)、[デバッグ](debugging-guide.md)、[セキュリティ](security-checklist.md)。
- **結果の読み方**：[テスト報告](test-report.md)、[再検証の健全性](impact-soundness.md)。
- **旧READMEの詳細記録**：[2026-11-03時点の研究ログ](readme-research-log-2026-11-03.md)。新版READMEから移した履歴であり、現在の制度適合・実測精度を保証しません。

## 注意：研究用の数値と正式認証

- 合成デモの「100件のうち70件が影響なし」は、その合成fixture固有の結果です。業務工数削減70％の実測ではありません。
- 614件の反例検査における見逃し0件は、試した計算ルールと変更APIに限定されます。
- 公開統計・原本照合・衛星データが追加されても、現行AG-005の完全実装、測定の真実性、J-クレジット認証が自動で成立するわけではありません。
