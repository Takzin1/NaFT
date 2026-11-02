# NaFT P4｜方法論文書の版変更・再検証影響候補（2026-11-02）

## P3 → P4 の進化

P3で**ローカルに渡されたPDFのバイト列**とAG-005・Gold Standard SOCの出典候補をハッシュ付きで照合した。P4では**旧版と新版の2セットの宣言とバイト列を、P3のゲートを毎回再実行して比較**する。

- 比較するもの：制度名、宣言版ラベル、ローカルPDFのSHA-256、出典URL（事前台帳と一致する候補のみ）、ファイル名。
- 比較しないもの：PDF内の条項や表、数式、正式採択の事実、実際の農地影響、クレジット認証。外部原典PDFを新規取得したわけでもない。
- 出力：原資料のドリフト状態、出典・規則・モニタリング・QC・不確実性・独立再演算・最終承認の**レビュー候補7領域**。Gold Standard SOCならSOC会計の独立確認を加え**8領域**。
- 旧/新P3レシートのSHA-256とP2レポートのSHA-256を再計算し、変更影響計画のSHA-256とともに固定。
- 全域で `officially_certified_tco2e=null`、`safe_to_release_rule_pack=false`、`final_attestation_allowed=false`。**PDFが異なるだけでルール本文が変更されたと認定しない。**

## 状態の分類

| 分類 | 解釈 |
| --- | --- |
| `NO_LOCAL_REFERENCE_CHANGE_OFFICIAL_REVIEW_STILL_REQUIRED` | 版・ローカルハッシュ・URL・ファイル名は一致。**制度適格性は未証明** |
| `UNEXPLAINED_SAME_VERSION_LABEL_DIFFERENT_BYTES_BLOCKED` | 同じ版と称するローカルPDFが異なる。正式資料か、改版か、破損か、人間が確かめるまでブロック |
| `VERSION_LABEL_CHANGED_IDENTICAL_BYTES_REVIEW_REQUIRED` | 版ラベルだけ変わりバイト同一。同じPDFを異なる版として扱わないため要調査 |
| `VERSION_AND_LOCAL_BYTES_CHANGED_REVIEW_REQUIRED` | 宣言版とPDFが変化。条文・計算式が何か変わったかを人間が独立比較する |
| `SOURCE_DECLARATION_METADATA_CHANGED_REVIEW_REQUIRED` | URLかファイル名等の宣言メタデータが変化。出所の差を再確認 |

## 使用方法

外部PDFを2組用意する。リポジトリ内には原典のバイト列を**保存しない**。下記のパスは例であり、実際に合法的に取得したPDFを配置しない限りコマンドは成功しない。

```bash
node scripts/p4-method-source-impact.mjs generate \
  fixtures/p3-ag005-unverified-intake-request.json /secure/previous.pdf \
  fixtures/p3-ag005-unverified-intake-request.json /secure/current.pdf \
  > /tmp/p4-method-impact-plan.json

node scripts/p4-method-source-impact.mjs verify \
  fixtures/p3-ag005-unverified-intake-request.json /secure/previous.pdf \
  fixtures/p3-ag005-unverified-intake-request.json /secure/current.pdf \
  /tmp/p4-method-impact-plan.json

node scripts/p4-method-source-impact.mjs markdown \
  fixtures/p3-ag005-unverified-intake-request.json /secure/previous.pdf \
  fixtures/p3-ag005-unverified-intake-request.json /secure/current.pdf

node tests/p4-method-source-impact.test.mjs
bash tests/run.sh
```

現在の固定研究レジストリにはAG-005 **3.1と3.3の参照ページのみ**が登録され、3.4/3.5の原文URLは未固定。3.1は既存の研究用PDFハッシュと一致することが必須。このため、**資料の真正性を確認できない環境での版比較結果を正式算定と誤認させない**。

## 次段階 P5の受入要件

1. 制度の原文一次資料を権利を守って取得し、取得URL・有効版・適用日・SHA-256を独立確認する。
2. 文書版間の**条文単位の差分**を検証可能な抽出方法で作る（表・脚注・附則・参照先含む）。このP4は文書のバイト差分のみ。
3. 条文とRule Pack、証拠カテゴリ、係数、適用条件を**明示的な依存グラフで対応付け**る。
4. 依存関係が既知の案件だけを対象に、前後の入力・計算結果・誤差・不確実性の独立再演算を行う。影響がないと断定する前に被覆不足を評価。
5. 人間の正式な承認・外部監査・クレジット認証の責任境界は引き続き分離する。

関連： [P3原典バイト検査](p3-method-document-intake-ja-2026-11-02.md) ｜ [P2制度/SOCゲート](p2-ag005-soc-source-gates-ja-2026-11-02.md)。
