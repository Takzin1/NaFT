# NaFT P2 — AG-005 版付きソースゲートと Gold Standard SOC 審査準備

最終更新：2026-11-02。**研究用ソース管理・証憑不足の判定**であり、制度の正式な現行版確定、認証量の発行、SOC削減の定量評価ではない。

## 何を実装したか

- `research/method-governance/p2-jcredit-gs-soc-source-boundaries-2026-11-02.json` に過去の研究資料上のAG-005版候補を区別して登録。3.1は過去に取得したpublic-comment PDFのSHA-256参照値を保持、3.3はe-Gov本文を過去に読んだ記録があるが原PDFバイト未固定、3.4は二次資料のみ、3.5は版名に言及があるものの原文未固定。**どの候補も「現行採択版」とは認定しない。**
- `scripts/p2-method-soc-gate.mjs` は候補版と証憑4項目を厳密に検査し、P2監査準備レポートのハッシュへ接続。現在の `AG-005@3.1-reference` Compiler Packが`CONFIG_REQUIRED` / 算定`null`を維持していることをコードから検証。公式採択・適用・新係数は`UNKNOWN`のまま。
- SOC（土壌有機炭素）の損失リスクを、(1) 基準SOC、(2) 事業SOC、(3) 測定の比較可能性、(4) SOC会計範囲という**研究者の予備点検リスト**で表示。これら4項目がGold Standardの正式要件の全文であると主張しない。
- 証憑値は`MISSING`または`PROVIDED_UNVERIFIED`に限定。4項目全てが後者でも**独立検証済み・制度適格・SOCのtCO₂e量には昇格させない**。
- 結果のSHA-256と、`verify`による再実行突合、改ざん拒否、4版に対する回帰テストを備える。
- 金銭取引、Registry上のクレジット操作、API通信、実地観測の承認は実施しない。

## 再現手順

```bash
node scripts/p2-method-soc-gate.mjs generate fixtures/p2-method-soc-research-request.json > /tmp/p2-gate.json
node scripts/p2-method-soc-gate.mjs verify fixtures/p2-method-soc-research-request.json /tmp/p2-gate.json
node scripts/p2-method-soc-gate.mjs markdown fixtures/p2-method-soc-research-request.json
node tests/p2-method-soc-gate.test.mjs
bash tests/run.sh
```

## 素材・バージョン対応表

| 資料の候補 | このリポジトリで検証した範囲 | 現行版・正式制度の算定 |
|---|---|---|
| AG-005 3.1 | 過去取得のpublic-comment参考資料と固定SHA-256。実行時に原PDFバイトは再検査しない | 不可 |
| AG-005 3.3 | 過去のe-Gov本文の読解記録。原PDFのバイト・SHA未固定 | 不可 |
| AG-005 3.4 | 二次情報に版名があるが一次の原文未固定 | 不可 |
| AG-005 3.5 | 他の研究メモに言及。今回原典と効力は未検証 | 不可 |
| Gold Standard AWD | SOC損失リスクに関する公式情報へのURLが研究メモに残るが、今回改定本文バイト・適用日・公式適格条件を再確認できていない | 不可 |

**注意**：3.1の資料上のハッシュがあっても、過去の取得資料が現在の公式採択版である証明にはならない。同じく `source_link` を保持するだけでは出版社署名・変更の真正性・正式適用可能性は証明できない。

参照：[`docs/methodology-sources.md`](methodology-sources.md)、[`docs/ja-ag005-gxets-cost-sync.md`](ja-ag005-gxets-cost-sync.md)、[`docs/p2-audit-packet-preflight-ja-2026-11-02.md`](p2-audit-packet-preflight-ja-2026-11-02.md)。

## 次段階で入手すべき一次資料

1. J-クレジット事務局が現時点で公表するAG-005採択版の原文、原本SHA-256、効力発生日、旧版からの経過措置。二次資料の版名だけでは現行版を確定しない。
2. Gold Standardが公表するSOC損失の取扱いに関する正式文書、効力日、対象方法論、監査・計算要件。今回の4項目は予備スクリーンであり公式のチェックリストではない。
3. 正式原典が入手できた後に、既存の2024 GS教材ワークブックと新版SOC会計との非同値を注記し、CH4削減／SOC損失／他GHG・漏出を個別に再現。
4. 実証で使うJP-Hrt観測はP0の独立QCが0件のため、行単位のQC・原観測同定・タイムゾーンや欠測を先に解決する。

**P2完了基準**は「現行版の自動承認」ではない。出典・版・証憑のレビューが第三者にも追跡でき、不足項目に対して機械的なFAILと人間の追加確認を出し、検証されていないtCO₂eを`null`に保てること。
