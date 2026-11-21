# NaFT Environmental Asset Valuation Engine

## デモと境界

AG-005 P9の元fixtureを既存の歴史式で再計算し、入力ハッシュと計算レシートを別々に記録する。2.24 tCO₂e、1,500 JPY/tCO₂e、150.25 JPY/USD、1 USD/SIM-USD、手数料25 bpの場合、参考評価額は3,360円、22.362728 USD。控除前22.362728単位、手数料0.055906単位、差引22.306822単位。すべて仮定に基づく参考値。RESEARCH_SCENARIO_ONLY、formal_certification=false、certified_quantity=nullを常に保持する。

| 入口 | 評価に用いる数量・条件 |
|---|---|
| ag005 FILE ID | P9合成入力を元の関数で再生した差分。日数precheck失敗時は数量未確定 |
| blue FILE | 既存のBlue Carbon bridgeで元bundleを再検証した研究推定の合計。欠落があれば停止 |
| compiler FILE | packageの正準SHA-256・方法論版・入力指紋を検査し、合成計算の成功したtCO₂eのみ表示。他単位やCONFIG_REQUIREDは停止 |
| forest FILE | FO-001向け外部研究値。数量と単位、元証拠のSHA-256、林分ID、方法論版と検証状態が必要。面積から吸収量を補完しない |
| 土壌炭素・メタン・その他 | 種別は予約済み。数量アダプター追加まで評価を停止 |

森林の入力例は以下。ハッシュは説明用の合成値。証拠の真正性や正式認証を示さない。

```json
{"schema":"naft-forest-research-estimate/1","stand_id":"SYN-STAND-1","methodology_id":"FO-001","methodology_version":"scenario-v1","evidence_package_sha256":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","verification_status":"REFERENCE","quantity":"12.5","quantity_unit":"tCO2e","rights_status":"UNVERIFIED","formal_certification":false}
```

## 入力と計算

CLIはNode 20以降（テスト環境Node 24）。ブラウザはlocalhostまたはHTTPSで動作する。日時はミリ秒付きUTC。履歴再現では時刻を明示する。CLIの通常見積りは実行時刻を使う。単価・FX・ペッグには観測日時、適用日時、有効期限、出典、出典種別、選択した価格種別を記録する。異なるpair、負値、指数記法、過剰精度を拒否する。参照価格が欠けた場合はnullを保存できる。観測の不整合・期限切れ・不明な出典はBLOCKED。±5%を超えるペッグ乖離で停止する。これは研究シナリオに選んだ閾値で、発行体の基準ではない。

計算はBigIntを使用する。数量は整数部12桁・小数部18桁、単価は9桁・6桁、FXとペッグは9桁・4桁まで。数量×単価の最大24桁の小数部分をレシートに残す。既存Marketの整数円仕様に合わせて換算元金を1円未満切り捨てとし、元金は最大999,999,999,999円。USDとステーブル参照数量は元金からそれぞれ直接計算し、小数6桁で切り捨てる。手数料も最小表示単位で切り捨て、差引と手数料の和を控除前数量に一致させる。JPYCの元金にはJPYを用いる。6桁は参考表示の精度で、トークンのdecimalsはUNKNOWN。

`SnapshotProvider.read(lane)` は price / fx / peg の観測を返す。将来取得したデータもまずこのスナップショット形式で固定し、査定時に問い合わせない。市場価格、固定償還価値、ユーザー仮定値の欄を分け、償還価値を市場価格として選択する操作を拒否する。

## 再評価とMarket接続

```sh
# NaFTのルートで実行。別々のcheckoutを隣接配置する。
T=2026-11-21T00:00:00.000Z
node scripts/valuation.mjs demo "$T" > /tmp/naft-valuation.json
node scripts/valuation.mjs replay /tmp/naft-valuation.json
node -e "const r=require('/tmp/naft-valuation.json'); console.log(JSON.stringify([r.input]))" > /tmp/valuation-inputs.json
node scripts/valuation.mjs ledger - /tmp/valuation-inputs.json "$T" > /tmp/valuation-history.json
cd ../Natural-Fungible-Token-Market
node scripts/valuation-book.mjs examples/p80-scenario.json examples/p80-bindings.json /tmp/naft-valuation.json "$T" --html > /tmp/p80-market.html
```

現在時刻で試すには、demoの時刻引数を省略する。固定デモのbindingは固定の履歴にのみ対応する。更新時は信頼できる経路で新しいcurrent_receipt_sha256を取得する。Marketはこの値と各前版へのハッシュを検査する。Marketが独立に宣言した合成シリアル・注文だけが対象になる。

同じasset_idとvaluation_scenario_idで新しい入力を作り、`ledger OLD_HISTORY NEW_INPUTS UTC` に渡す。全対象の現在入力を渡し、更新は直前版にリンクする。既存履歴の整合性を確認後、入力変更または時間境界を跨いだ対象のみ計算する。同一証拠を同一シナリオで別資産として再評価しない。複数シナリオの評価額を合算しない。旧ファイルを保存し、新規出力先を指定する。複数の書き手が同じheadから分岐した場合、採用するheadは呼出元が決める。

Compilerの変更影響レポートは `impact INPUTS REPORT` に渡す。`analyzeImpact`のrequires_reverification行だけを選び、previous_package_hashを照合してsuccessorへ差し替える。その出力をledgerに渡す。数量・係数由来の指紋・原証拠・方法論版・単価・FX・ペッグ・権利状態も評価履歴の依存入力である。REVOKED、AUTHENTICITY_FAILEDまたは期限切れの権利は後続のBLOCKEDレシートになる。撤回の自動配信はなく、Marketの最新head更新が必要。

## 検証

```sh
bash tests/run.sh
bash scripts/ci-browser-smoke.sh
node --test tests/p80-valuation.test.mjs tests/edition-bridge.test.mjs
```

評価専用32ケースと既存Blue Carbonスイートへの1ケースを追加。Python Fractionによる独立検算は135組。既存の6ルートを維持し、監査画面から評価JSON・履歴JSONを保存できる。時刻、ハッシュと数式の一致から原証拠の真正性や法的権利は判定できない。
