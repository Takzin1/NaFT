# NaFT P5｜公式公開資料の条項→証憑→再検証候補グラフ（2026-11-02）

**位置づけ：研究用の条項索引・確認先の提示。正式な制度適格性、排出削減量・認証量、VVB評価を自動決定しない。**

## 2026-11-02の外部資料調査で発見した重要点

### Gold StandardのSOCルール更新は2つの公開資料があり期限が異なる

1. Gold Standard [適用中Rule Updatesの公式一覧](https://globalgoals.goldstandard.org/rule-updates/)では、SOC損失リスクの更新資料は**2025-12-22付**で掲示。
2. [2025-12-22版の原文PDF](https://globalgoals.goldstandard.org/standards/RU_2025_Accounting-of-SOC-Loss-Risk-in-Activities-Applying-Rice-Methodology-1.pdf)の表紙と§1.1.2〜1.1.3では、**2026-07-01を含む、またはそれ以降の監視期間**への一般的な対応と、任意早期導入・CCPラベルの時点差を規定。標準記載は一般の期限だけで全条件を確定しない。農場ごとの適用判断はVVB・制度側の確認事項。
3. [旧2025-07-07版PDF](https://globalgoals.goldstandard.org/standards/RU_2025_Accounting-of-SOC-Loss-Risk-in-Activities-Applying-Rice-Methodology.pdf)には**2026-01-01**の記載がある。旧資料を現在の一般対応期限として自動採用すると不正確。P5では旧版を「参照上の差異」として保管するが、現行条項グラフには接続しない。
4. §2.3.3〜2.3.4、§2.4.1〜2.4.7、Appendix A / AWD.25、AWD.26から、SOC保全管理策、VVBによる評価、監視期間中の管理策・収量、必要時のSOC直接測定・標本設計・不確実性を**証憑チェック候補**に落とす。原文にある控除率や損失率の数値を勝手に計算式へ転写しない。

### Verra VM0051 v1.1

[Verra公式方法論ページ](https://verra.org/methodologies/vm0051-improved-management-in-rice-production-systems-v1-1/)では、**2026-07-14からv1.1有効**。公式変更要約に§9.3.1のモニタリング計画にSOC保護策に関する専門家推奨を含む点、§9.3.3の専門家評価の範囲に関する追記がある。v1.0の停止日**2027-08-01**、提出種別と旧版案件の経過措置もある。P5は**Verra版をGold Standard制度と同一視しない**。

### J-クレジット AG-005

[過去のe-Gov参考資料3.1](https://public-comment.e-gov.go.jp/pcm/download?seqNo=0000281460)には基準中干しと実施記録等の参考要件があるが、**現行採択版、効力日、最新原典のSHA-256は確定できていない**。既存Compiler Packの `CONFIG_REQUIRED` と算定 `null` を維持する。

## 追加したコード

| 対象 | 役割 |
| --- | --- |
| `research/method-governance/p5-official-clause-evidence-trace-2026-11-02.json` | 公式出典URL・旧版注意・版候補・14条項と証憑21種類、レビュー種別13、候補モジュール9の対応グラフ |
| `scripts/p5-clause-evidence-trace.mjs` | 入力で指定された条項だけから証憑・レビュー候補を列挙。存在しない条項、制度間混用、証憑未列挙、無根拠な独立検証フラグを拒否 |
| `fixtures/p5-gs-soc-clause-trace-request.json` | GSの4条項と監視期間が2026-07-01を跨ぐ研究サンプル。証憑はMISSING/PROVIDED_UNVERIFIEDのみ |
| `fixtures/p5-verra-soc-clause-trace-request.json` | Verra v1.1のSOC保護策サンプル |
| `tests/p5-clause-evidence-trace.test.mjs` | 不正な入力、旧版SOC期限、改ざん、他制度条項の混用、偽のクレジット認証を拒否する自動回帰テスト |

入力の `changed_clause_ids` は**人手で判断・指定した変更影響確認候補**であり、P4のPDF差分から条文が自動抽出された事実ではない。画面に出る `candidate_replay_modules` も**検査先モジュールの索引**であり、実際の農地データの再計算を実行していない。

## 再現例

```bash
node scripts/p5-clause-evidence-trace.mjs generate \
  fixtures/p5-gs-soc-clause-trace-request.json > /tmp/p5-trace.json
node scripts/p5-clause-evidence-trace.mjs verify \
  fixtures/p5-gs-soc-clause-trace-request.json /tmp/p5-trace.json
node scripts/p5-clause-evidence-trace.mjs markdown \
  fixtures/p5-gs-soc-clause-trace-request.json
node tests/p5-clause-evidence-trace.test.mjs
bash tests/run.sh
```

## 取得と証拠の限界

公開のGold Standard原文PDFやVerra公式ページの文字内容は公開ウェブで確認した。しかし外部原本PDFのバイト列を本開発環境で独立取得できず、**Gold Standard / Verraの最新版PDF SHA-256は固定していない**。原典の全文自動パース・条文差分解析・Publisher署名検証・最新規則一式との完全整合は未実施。本PRでは原PDFを再配布せず、条項の概要と出典URL/条項番号だけ保持する。

**研究的な到達点**はP4の「PDF単位の差分候補」からP5の「条項単位の証憑・レビュー・再実行先候補」への追跡可能性。次に必要なのは出版社原PDF取得とSHA、変更版の条文全文比較、対象圃場IDへの依存関係、独立QCの上での計算差分再演算。これらを通る前は `officially_certified_tco2e=null` を保つ。
