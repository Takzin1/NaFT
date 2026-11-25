# 既知の制約

- **方法論対応範囲:** AG-005 `3.1-reference`は歴史的参照版として保持しており、現行制度対応を意味しない。e-Gov一次資料でVer.3.3は確認済み、第三者資料には2025年9月のVer.3.4参照があるが、現行最新版の原文byte列・SHA-256・完全差分は本repositoryで固定していない。AG-004はVer.2.4原文を確認済みだがExecutable Pack未実装のためCompiler上は`UNKNOWN / UNSUPPORTED`を維持する。適用係数と完全な制度翻訳は未確認であり、制度評価はfail closedする。
- **ルール表現力:** 現在は小規模な宣言的comparison / conditional / multiplication interpreterである。複雑なstrata、例外、係数適用条件、計算結果に応じて必要Evidenceが変わる循環的評価構造は未実装で、未踏期間の研究課題である。
- **Evidence adapter:** raw-byte SHA-256、metadata、JSON構文の正規化まで。写真内容理解、農学的意味抽出、センサー校正、GIS幾何検証、権威あるidentity resolutionは行わない。expected hashはtrust anchorであり外部真正性証明ではない。
- **変更影響解析:** Activity粒度の保守的dependency pathを扱う。適用rule・使用parameterに基づく選択的再検証は実装済み。独立Full Re-computation Oracleとの614件adversarial matrixではTP 429 / TN 78 / FP 107 / FN 0で、現在サポートするinterpreter/change APIのtested state spaceではfalse negativeは見つかっていない。ただし任意の実制度Methodologyに対するsoundness/minimalityの普遍的証明ではなく、107 false positivesは保守的over-verificationを示す。100 Claimの30 / 70も性能指標ではなくfixture構成に由来し、実制度の再検証率を予測しない。
- **永続化・セキュリティ:** role checkはクライアント側研究デモであり、server authentication、tenant isolation、並行transaction、独立audit witness、安全な証憑原本保管はない。全データを支配する主体は監査chain全体を再構築できるため、hashは電子署名や独立証明の代替ではない。
- **Workflow:** append-only successor、stale current-export拒否、例外単位の`ACCEPT / REJECT / NEED_MORE_EVIDENCE / ABSTAIN`は実装済み。宣誓の取消・修正protocol、cross-owner field change、外部署名、legacy snapshot migrationは未実装。
- **ブラウザ検証:** GitHub Actionsのheadless ChromeでReviewer Demoを375×812相当にし、100 / 30 / 70 / 15 / 15のDOM描画、first-view位置、横overflowを検証する。さらに同じ実ブラウザでOperator選択 → Activity登録 → SYNTHETIC Evidence追加 → Evaluation → 通常6 route全遷移を実行し、各routeの横overflow・render/status error・runtime/console errorを検査する。新CompilerについてはOperator draft → Maintainer Pack release → Reviewer attestation → attested JSON exportまで実ブラウザで通し、研究用境界を確認する。Evidence file inputについてはrunner上の実ファイルをChromeへ渡し、attach→SHA-256 Manifest→同一原本recheck=MATCHまで検証する。ただしnative OS file-picker UXそのもの、iOS Safari等のnative download挙動、永続化、accessibility、全端末visual inspection、外部認証主体を含むproduction E2Eは未実施である。
- **有効性の証拠境界:** 36件の合成適合性テスト、100 Claimの合成方法論改定実験、614件の決定論的adversarial impact proofがengineering evidenceの範囲。いずれも合成データ/合成ルールであり、field accuracyや制度受入れの証拠ではない。時間短縮、MRV費用削減、reviewer工数、農家所得、検証機関受入れは未計測で、field-PoC KPIはnullのまま。

## Evidence Intelligence 層（2026-11-14 追加）の制約

- **位置づけ:** `src/evidence-intel-*.js` は追加モジュールで、既存の `compileEvidence` / `analyzeImpact` / 6画面には接続していない。`naft-app.html` は読み込まない。2026-11-25に `src/evidence-intel-session.js` で既存の保存・役割・監査ガードには接続したが、画面からは呼ばれず、実ブラウザでの操作は未検証。エンジンのレコード自体は判断前の評価で、人間の判断と最終確認はセッション層で記録する。
- **会計文脈:** GHG Protocol Land Sector and Removals Standard v1.1 は企業インベントリ算定の基準として**スコープ参照のみ**登録した。原文PDFはネットワーク制限で取得できず、`source_hash: UNKNOWN`・`primary_text_verified: false`。企業GHGインベントリ算定は未実装で、要求は常に `EI_INVENTORY_ACCOUNTING_NOT_IMPLEMENTED` で拒否する。クレジット認証も行わない。
- **係数:** 実行されるのは合成係数（`SYN-EF`）だけ。実在の排出係数は登録していない。活動期間が2つの版にまたがる場合の按分は未実装で fail closed。
- **差分再計算の正しさ:** 614件の反例行列・60ステップの擬似乱数変更列・各変更種別で「差分結果＝全再構築」「既存コンパイラと一致」を確認した範囲に限る。任意の制度方法論に対する健全性・最小性の証明ではない。過剰再検証0件は、エンジンがオラクルと同じ意味論定義で差分を取るための結果であり、実制度の再検証率を予測しない。
- **算定:** 四則・最小・最大・丸めのみ。条件分岐、表引き、層別、積算期間をまたぐ計算、不確かさの伝播は未実装。既存 `multiply` 仕様は互換のため浮動小数点の値を保持し、正確な値を並記するにとどまる。
- **AI説明:** リポジトリは生成モデルを呼び出さない。**AIによる説明生成は未実装・未検証**で、実装・検証したのは説明境界と検証器だけである。検証は語彙的（引用の実在、数値の一致、禁止語、マークアップ）で、文の意味の正しさは証明しない。言い換えによる誤誘導を検出できない可能性がある。
- **監査ログ:** ハッシュ連鎖は部分的改変を検出するが、署名・外部タイムスタンプ・独立した証人ではない。全コピーを支配する主体は連鎖を作り直せる。チェックポイント検証はそれ以前のエントリを再検査しない。既存セッションの監査連鎖とは未結合。
- **API:** 状態を持たないローカル計算用。認証・レート制限・TLSは無く、HTTPアダプタは 127.0.0.1 のみ。共有ネットワークや本番公開を想定しない。
- **性能:** 計測は合成Claim（小さな証憑）・単一プロセス・純JSのSHA-256・GC制御なし・信頼区間なし。状態は全てメモリ上で、永続化と並行実行は未実装。5,000件を超える規模、大きな証憑バイト、ブラウザでの大規模実行は未計測。
- **ブラウザ:** 新モジュールは本セッションで headless Chromium に読み込み、Nodeと同一のハッシュになることを1回確認しただけで、CIのブラウザ検査には含まれない。UIは未実装。

## Web3 来歴アンカー（2026-11-25 追加）の制約

- **取引機能は実装していない。** トークンの発行・移転・売買、価値の移転、数量の表示は行わない。`LICENSE` と `AGENTS.md` の境界は変更していない。取引機能を検討する前の条件は [法務論点整理](web3-token-legal-issues-ja.md) 第5節を参照。
- **送信していない。** `eiAnchorArguments` は `anchorPackage(bytes32,bytes32,bytes32,bytes32)` 形式の引数を用意するだけで、`chain_status` は常に `NOT_SUBMITTED`。署名用の秘密情報もネットワークも扱わない。既存コントラクトにポートフォリオ単位のアンカーを送った場合の意味づけ・挙動は未検証。
- **観測照合は取得しない。** `eiVerifyObservedAnchor` は、呼び出し側が渡したチェーン上の値を照合するだけで、取引の実在・確定を確認しない。
- **アンカーが示すのは、そのハッシュが記録されたことだけ。** 観測の真実性、適格性、制度上の受入れ、削減量は示さない。包含証明はClaimのハッシュと状態を開示するため、Claim IDに個人・圃場を特定できる情報を入れない運用が必要。
- **法務論点は検索結果の要約に基づく。** 2026年の金融商品取引法改正（暗号資産の移管）、東証カーボン・クレジット市場、GX-ETS、ICVCMの原則は、原文・条文を読まずに整理した。施行日、移転不可トークンの扱い、トークン化に関する各制度の現行方針は未確認。法的助言ではない。

## Evidence Intelligence セッション統合（2026-11-25 追加）の制約

- 読み取りのたびに全Claimを再構築するため、実行が大きいほど遅くなる（キャッシュを持たない方針による。規模ごとの計測は [実測結果](evidence-intelligence-measurements-ja.md) の全件評価を参照）。
- 既存セッションと同じく、役割はクライアント側の研究デモで、本番の認証・テナント分離・並行トランザクションは無い。保存失敗時は `db` 全体を操作前に戻す単一プロセス前提の方式。
- 系譜はラベル単位で、Claimを別のラベルへ移す操作、実行の取消、最終確認の取消・修正は未実装。
- 判断の陳腐化検査・最終確認出力の現行性検査は、正規の操作では先にハッシュ束縛で止まる防御の重ね掛けで、テストでは束縛を保ったまま内容が古い記録を直接書き込んで確認している。
