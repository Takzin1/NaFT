# NaFT P3｜方法論文書のローカル原典バイト検査（2026-11-02）

## 目的

P2では、AG-005の版候補とGold Standard AWDのSOCリスクを **未検証のまま合格にしない** 判定を実装した。P3では、それらの候補に対応する**利用者がローカルで用意したPDFファイルのバイト列**を検査し、研究レジストリの版候補・出典記録へ結び付ける。

**重要：PDFのハッシュを計算できても、公式サイトから原典を正しく取得したこと・出版社の原本と同一であること・方法論の版が正式採択されたこと・再配布が許可されたことは証明できない。** PDFのヘッダー・EOFを確認するが、PDFの全文をパース・検証したわけでもない。

このPRでは**原典ファイル自体は取得・コミットしていない**。著作権・利用規約・大容量ファイル、個人情報の混入を避けるため、ローカルの元データはリポジトリへ追加しない。

## 入力と出力

- `scripts/p3-method-document-intake.mjs`：ローカルPDFを最大12MiBで読み取り、PDFマーカーの簡易検査・SHA-256・P2の未解決証拠要件との紐付けを実行。
- `fixtures/p3-ag005-unverified-intake-request.json`：AG-005 3.3の研究用出典ページと提出ファイル名を宣言した入力例。資料の所在と版は**自己申告**であり、PDFの全文・正式版は確認していない。
- `fixtures/p3-gold-soc-unverified-intake-request.json`：Gold StandardのSOC関連更新案内ページを示す入力例。**このURLが、投入するPDF原本の直接ダウンロードURLであるとは限らない**。
- 検査結果は `naft-p3-method-document-intake-receipt-v1` のJSON。受け取った**原典ファイルのバイト列・ファイルパス・PDF内部テキストは出力しない**。宣言されたファイル名とハッシュ、出典候補、P2レポートのSHA-256、未解決確認項目を保持する。
- `verify` で入力リクエスト・ローカルPDF・研究レジストリから**同じレシートを再作成して突合**する。後日の原典すり替えや、レシートへの偽装済み認証量の混入を拒否。
- 研究レジストリに以前記録した**AG-005 3.1参考PDFのSHA-256**との一致はチェックできる。これも出版社署名や正式採択の証明ではない。3.3以降の参考資料は原本ハッシュ未固定なので、自動では現行採択版にならない。

## 実行

J-クレジットAG-005の例（`/secure/source.pdf` は**手元で合法的に入手したローカルファイル**へ置き換える。存在しないパスなら実行は失敗する）：

```bash
node scripts/p3-method-document-intake.mjs generate \
  fixtures/p3-ag005-unverified-intake-request.json \
  /secure/source.pdf > /tmp/naft-p3-source-receipt.json

node scripts/p3-method-document-intake.mjs verify \
  fixtures/p3-ag005-unverified-intake-request.json \
  /secure/source.pdf \
  /tmp/naft-p3-source-receipt.json

node scripts/p3-method-document-intake.mjs markdown \
  fixtures/p3-ag005-unverified-intake-request.json \
  /secure/source.pdf
```

現時点のCIは、**実在する公式原典での成功を主張しない**。短い合成バイト列を用いたテストのみで、ハッシュ不整合・未固定の版・未知のURL・パストラバーサル・シンボリックリンク・偽の認証量を拒否する。

```bash
node tests/p3-method-document-intake.test.mjs
bash tests/run.sh
```

## あと何が必要か

| 審査対象 | 自動検査できる | **別途必要** |
| --- | --- | --- |
| PDFのバイト同一性 | SHA-256で可能 | 独立した出版社配布元・取得記録との照合 |
| PDFの種類 | PDFマーカーの簡易確認 | 原文の安全な構造検証、ページ数・本文・方法論改定箇所の照合 |
| AG-005現行版 | 過去の版候補を識別 | J-クレジット事務局の現行採択版、有効日、移行措置の独立確認 |
| GS SOCの正式要件 | 案内ページへの研究用紐付け | 正式方法論原典の版、SOC損失会計、適用範囲、評価方法 |
| 環境効果・クレジット | 自動承認を拒否 | 原観測QC、対象農地・基準年・係数、VVB等の正式審査 |

原典の受け入れから、実測・計算・正式発行までの各段階には**別々の承認責任**がある。P3は最初のバイト再現性を提供するが、独立の承認は代行しない。

関連：[P2 原証憑レビュー](p2-audit-packet-preflight-ja-2026-11-02.md) ／ [AG-005版とGS SOCの予備評価](p2-ag005-soc-source-gates-ja-2026-11-02.md)。
