# 既知の制約

- **方法論対応範囲:** AG-005 `3.1-reference`は歴史的参照版として保持しており、現行制度対応を意味しない。e-Gov一次資料でVer.3.3は確認済み、第三者資料には2025年9月のVer.3.4参照があるが、現行最新版の原文byte列・SHA-256・完全差分は本repositoryで固定していない。AG-004はVer.2.4原文を確認済みだがExecutable Pack未実装のためCompiler上は`UNKNOWN / UNSUPPORTED`を維持する。適用係数と完全な制度翻訳は未確認であり、制度評価はfail closedする。
- **ルール表現力:** 現在は小規模な宣言的comparison / conditional / multiplication interpreterである。複雑なstrata、例外、係数適用条件、計算結果に応じて必要Evidenceが変わる循環的評価構造は未実装で、未踏期間の研究課題である。
- **Evidence adapter:** raw-byte SHA-256、metadata、JSON構文の正規化まで。写真内容理解、農学的意味抽出、センサー校正、GIS幾何検証、権威あるidentity resolutionは行わない。expected hashはtrust anchorであり外部真正性証明ではない。
- **変更影響解析:** Activity粒度の保守的dependency pathを扱う。適用rule・使用parameterに基づく選択的再検証は実装しているが、任意の実制度Methodologyに対する最小影響集合の完全性は未証明。100 Claimの30 / 70は性能指標ではなく、fixture構成（standard 70 / intensive 15 / intensive_complete 15）に由来する合成結果である。fixture構成を変えれば比率も変わり、実制度の再検証率を予測しない。
- **永続化・セキュリティ:** role checkはクライアント側研究デモであり、server authentication、tenant isolation、並行transaction、独立audit witness、安全な証憑原本保管はない。全データを支配する主体は監査chain全体を再構築できるため、hashは電子署名や独立証明の代替ではない。
- **Workflow:** append-only successor、stale current-export拒否、例外単位の`ACCEPT / REJECT / NEED_MORE_EVIDENCE / ABSTAIN`は実装済み。宣誓の取消・修正protocol、cross-owner field change、外部署名、legacy snapshot migrationは未実装。
- **ブラウザ検証:** GitHub Actionsのheadless ChromeでReviewer Demoを375×812相当にし、実験buttonをclickして100 / 30 / 70 / 15 / 15のDOM描画、first-view位置、横overflow、通常Methodology routeの横overflowまで検証する。File選択、iOS SafariでのJSON download、accessibility、永続化、responsive visual inspectionの全端末網羅、通常6 workflow全体の実ブラウザ検証は未実施。
- **有効性の証拠境界:** 36件の合成適合性テスト（Synthetic Conformance Corpus）と100 Claimの合成方法論改定実験のみ。時間短縮、MRV費用削減、field accuracy、reviewer工数、農家所得、検証機関受入れは未計測で、field-PoC KPIはnullのまま。
