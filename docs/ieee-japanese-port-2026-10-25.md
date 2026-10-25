# IEEE ClimateChain主要機能の日本語版への選択移植（2026-10-25）

## 目標・構成
IEEEの発表向けに強化したNaFTの主要機能を、日本語版の **独立ルート `#/climatechain`** へ追加した。
コアの `mrv-core`, `mrv-compiler`, `methodology-packs`、AG-005の歴史的参照機能、日本の観測研究アダプターは置換しない。表示専用 `src/climatechain-ja.js` を原IEEEレンダラーの後段に入れて見出し・説明・主ボタンを日本語へ置換する。ソースハッシュ、数式、識別子、`data-action`、JSON内容やSepolia取引を翻訳しない。

## 今回移植した主要機能

| 項目 | 実際に行うこと | 境界 |
| --- | --- | --- |
| 合成100件差分再検証 | 70件非影響、15件自動再評価、15件証拠不足で停止。影響理由と後継関係を辿れる | 合成方法論であり実際のAG-005改定ではない |
| 改ざん検出・監査レシート | 1バイトの証拠改変でhash不整合を検出、元の出力を独立に再計算・監査 | 元の観測そのものの正確性は判断しない |
| 3要素整合性検証 | 改ざん拒否、選択的再検証、P1/P2参照を結びつけたJSONを再演算 | Sepoliaをブラウザから再検証するわけではない |
| Ethereum Sepolia既存のP1/P2 | デプロイ・後継パッケージへのリンクとsource commitを表示 | ブラウザから送信せず、排出量の真実やクレジットを認証しない |
| 全件/選択的ベンチマーク | 合成100/200/500件で実行時間と生成パッケージ数を比較 | 実務上の削減コスト・人手時間とは無関係 |
| Versioned source snapshot | ローカルで提供された2つのJSONのデータ差分を検査し、hash付きレポート生成 | 元資料の権利・真正性や出版社の承認は検証しない |

## 安全境界
- **NaFTの日本語版は正式なJ-クレジット認証システムではない。**
- 100/30/70/15/15は合成fixture構成由来であり効率改善率ではない。614件の反例検証でFNゼロは試験した合成空間に限定される。
- 公開のSepolia記録が証明するのはパッケージhashの継承であって、環境測定の真実や正式なCredit発行ではない。
- IEEE原著CLI名と機械的エラーコードは互換性のため維持し、主にユーザー表示層を日本語化している。高度なデバッグ文には英語も残る。
- 元論文のPDF・観測ZIP・付帯の生データ・ライセンス不明資料はこのPRでは再配布しない。
- IEEE版の外部原データ研究ツールすべてを移植済みとは主張しない。未マージのPR #40, #41 の研究内容は別途レビューが必要。

## ローカル実行
```bash
bash tests/run.sh
node tests/climatechain-japanese.test.mjs
node tests/ieee-audit.test.mjs
node tests/ieee-triad-proof.test.mjs
node tests/ieee-source-snapshot.test.mjs
node tests/ieee-benchmark.test.mjs
```

ブラウザ: `naft-app.html#/climatechain`

## 出典
IEEE原実装：[NaFT IEEE ClimateChain edition](https://github.com/Takzin1/NaFT-IEEE_Climate_Hackathon_Edition)。
公式J-クレジット制度との完全適合ではなく、公式採択方法論の現行版と、旧文書・参照版は分けて管理する。研究ベースは `docs/methodology-sources.md`。
