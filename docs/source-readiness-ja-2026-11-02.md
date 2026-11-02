# NaFT P0改造: Source-Bound Research Evidence Readiness（日本語UI / 2026-11-02）

## 実装とアクセス
- 対象: [IEEE主要機能の日本語版 PR #44](https://github.com/Takzin1/NaFT/pull/44) に積み重ねる独立開発ブランチ `feat/naft-evidence-readiness-ja-20261102`。
- ローカル画面: `naft-app.html#/source-readiness`。日本語MRV画面と `#/climatechain` の両方からアクセス可能。
- `src/research-readiness-ja.js` は**固定資料時点の読み取り専用ビュー**。API接続、原観測値の再取得、改ざん不能証明、外部認証は提供しない。
- `scripts/lib/research-readiness-report.mjs` および `scripts/report-research-readiness.mjs` を既存PR #41の実装からコード同一のまま取り込み、先行PR #40の出典ゲートと組み合わせる。履歴操作・原資料再配布は行わない。

## 科学的境界（厳守）
- JP-Hrtの公開30分データ：17,520枠、FCH4数値候補1,915（**QC不明**）、欠測15,605、独立QC確認済みとして認定できる観測行0。これらは固定された研究用資料監査の数値であり、実測値の正確性を保証しない。
- 1,689の数値候補はBADM記録のCH4測定開始日より前にあるため、期間・測定法の原典確認を要する。
- 2013年の学位論文、2012年のTellus実験、JapanFlux2024公表FCH4、Gold Standardワークブック、Verra VM0051は**異なる研究・文書・対象**。互いの結果を無断変換・同一視しない。
- 明示的な未解決ブロッカー：P0×4件、P1×3件。人の判断で欠測・QC不明・文書衝突を合格扱いにしない。
- 科学的な年間CH4積算、正式認証済みtCO2e、クレジット発行を **null** に維持する。外部トランザクションやウォレット操作はない。

## 再現とテスト
```sh
node scripts/report-research-readiness.mjs --format json
node scripts/report-research-readiness.mjs --format markdown
node tests/research-readiness-report.test.mjs
node tests/research-readiness-ja.test.mjs
bash tests/run.sh
```
- `tests/research-readiness-ja.test.mjs` はサーバサイドの独立した出典監査レポートを**実行**して画面の参照数・合成的な表示値・ブロッカーID/優先度/対象ソースと突き合わせる。
- 画面の固定値が原典監査結果からずれたらCIで失敗。改ざんによりQC認定行が増加、認証額が発生、枠内訳が不一致でも表示を拒否。
- 日本語表示ではHTMLエスケープを適用、改変した表示名からスクリプトが実行されないことを単体で確認。
- GitHub Actionsは最新コミットSHA上で確認する。実機でのアクセシビリティ・画面のレイアウト、専門家による科学的評価は別途。

## 次のP1へ渡す入力
1. 元センサーデータと公開行の対応表、QC判定理由、欠測補完、現場測定期間・タイムゾーンの確定。
2. Gold StandardとVerraの制度・版・Tier/QAの名称空間を固定し、独立ワークブック再計算器へ入力。
3. UIに承認ボタンを付けず、未確認は未確認のまま保存。証拠が増えた場合は原典とソースゲート・レポート・UIを同時にレビューする。

## 移植由来
- [PR #40 原文献・QC・Tier不整合ゲート](https://github.com/Takzin1/NaFT/pull/40)
- [PR #41 出典監査レポート](https://github.com/Takzin1/NaFT/pull/41)
- [PR #44 IEEE主要機能 日本語版](https://github.com/Takzin1/NaFT/pull/44)
