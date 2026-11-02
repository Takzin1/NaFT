# NaFT P2｜監査パケット事前点検（2026-11-02）

## 機能と責任境界

`scripts/p2-audit-packet-preflight.mjs` は、P0の研究データ出典・QC検査と、P1の制度別方法論比較を**同じ実行で再計算**し、SHA-256付きの研究段階の準備状況を出力する。第三者による真正性確認、原データの再収集、Gold Standard原Excelの完全再実行、クレジット認証・発行とは異なる。

- P0: `buildResearchReadinessReport()` によりJapanFlux JP-Hrtの観測候補・欠測・系譜・保留証拠7件を再構築する。
- P1: `buildP1Comparison()` によりGold Standard、Verra VM0051、J-クレジットAG-005の参照体系・版・未確認事項を再構築する。
- Source manifest 5ファイル、それぞれの内容ハッシュと、P0/P1結果のハッシュを記録する。**資料のバイト検証や出版社署名の真正性ではなく、固定済みローカル研究マニフェストの再現性**を表す。
- 算術を2エンジンで再実行する機能はP1の別コマンド `scripts/p1-gs-independent-replay.mjs` に存在するが、P2事前点検はそのPythonを実行したとは主張しない。
- 発行・金銭・ウォレット操作・外部通信は行わない。科学的に有効と承認されたJP-Hrt FCH4観測は現在0行、公式認証量は `null` のまま。

## 再現方法

```bash
node scripts/p2-audit-packet-preflight.mjs --format markdown
node scripts/p2-audit-packet-preflight.mjs --format json > /tmp/naft-p2-preflight.json
node scripts/p2-audit-packet-preflight.mjs --verify /tmp/naft-p2-preflight.json
node tests/p2-audit-packet-preflight.test.mjs
bash tests/run.sh
```

## P2の実装受入基準

| 項目 | 現在の状態 | 完了の前提 |
| --- | --- | --- |
| S01 原観測→公開行 | 証拠不足 | 観測原本、行対応、QC/ギャップ補完ログ、公開版との対応を第三者が確認 |
| S02 制度と版 | 人間レビュー待ち | 正式な適用文書版、申請資格、GS Q23齟齬とVerra/J-クレジット間の非同値を確認 |
| S03 独立算術 | 教材3セルの2エンジン検証のみ | 必要GHG、漏出、期間、変更影響、現行係数を含む独立かつ適法な再計算 |
| S04 変更差分・不確実性 | 研究用差分リプレイは実装済み | 原観測・適用方法論・係数の変更影響、独立測定QC、感度・不確実性分布 |
| S05 外部検証 | 未取得 | 独立VVB/外部レビューと証明可能な承認の根拠、原資料の真正性 |

重要なのは**検証できた技術的な再現性**と**実際の環境便益を証明できたか**を分けること。前者の達成を理由に後者を自動的にPASSにしない。

## 完了を阻む現時点の固定観測事実

- 半時間枠17,520、FCH4数値候補だがQC不明1,915、欠測15,605。
- 確認済み独立QC合格観測数：0。BADM報告期間との差やタイムゾーン・原観測と公開表の系譜などをまだ解消していない。
- GS教材のTier 1/3とチェックリストQ23の分類衝突は未解決。
- Gold Standard・Verra・J-クレジットは計算式・要件・採択文書版が異なる。J-クレジット現行適用版は未確認。
- 暗号学的ハッシュはファイル内容の一致には役立つが、出版社・独立監査人の公的署名の代替ではない。

このpreflight出力は研究開発のレビュー支援であり、制度上の監査証明書ではない。

## 2026-11-02 公開一次資料の調査メモ（コードの公式適用承認ではない）

- **Verra VM0051 v1.1** は[方法論公式ページ](https://verra.org/methodologies/vm0051-improved-management-in-rice-production-systems-v1-1/)で2026-07-14からActiveと記載されている。v1.0の新規適用等には2027-07-31までの提出期限、2027-08-01の失効予定がある。CCP適合の方法論でもプロジェクト・発行クレジットに対する追加条件やVVB/Verraの審査が必要であり、本研究成果に認証適格性を付与しない。
- **Gold Standard** は[AWD稲作へのSOC損失リスク更新](https://globalgoals.goldstandard.org/methodology-standards-paris-agreement-alignment-and-other-updates/)を公開している。2025年の改定により、乾田化によるメタン削減だけでなく土壌有機炭素（SOC）の損失を保守的に取り扱う必要がある。元の3つの教材セル式だけではこの評価に対応できない。
- **日本のJ-クレジット**：農林水産省の[水田メタン対策案内](https://www.maff.go.jp/j/seisan/kankyo/ondanka/)は2026-07-23更新の説明資料を案内している。一方、Webで見つかるAG-005旧版PDF（Ver.2.0）やe-Govの改定案は、**2026年11月時点の採択版の確定根拠としては不十分**。さらに[制度文書の2026-10-21付意見募集](https://public-comment.e-gov.go.jp/servlet/Public?CLASSNAME=PCMMSTDETAIL&Mode=0&id=595320043)が2026-11-04 18:00に締め切られる。改定案と確定版の混同を防ぐこと。

**次の取得優先順位**：①各制度が公表した正式な適用版と有効日を一覧表化、②Gold Standard SOCとVerraの追加適格性要件のレジストリ化、③AG-005実施・生産管理記録の最低証憑項目、④JP-Hrt原観測とQC履歴の独立照合。版が確定する前の自動算定・認証ゲート開放はしない。
