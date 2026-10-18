# NaFT 日本語版：AG-005参照計算・GX-ETS燃料参照計算・再検証費用の同期
作成日: 2026-10-18 / ステータス: **RESEARCH_ONLY / NOT_CERTIFIED**

## 研究用の計算仕様
- **AG-005**: 参照した文書はVer.3.3（[e-Gov PDF](https://public-comment.e-gov.go.jp/pcm/download?seqNo=0000288301)）。Ver.3.5の現行適用原典のバイト列・係数表・経過措置は未検証。最新版の制度適格性は計算しない。
- **稲わら・堆肥**: Ver.3.3の参照分岐を再現。稲わら<90%なら `E0+(Es-E0)*w/90`、堆肥<1t/10aなら `E0+(Ec-E0)*x`、両方ある場合は `min(E0+(Es-E0)*min(w,90)/90+(Ec-E0)*min(x,1),max(Es,Ec))`。各係数はデモ入力された**合成値**。
- **排水性**: Ver.3.3の参考分類 `d* = 1.22*d`; <7.5, 7.5〜<12.5, ≥12.5 (mm/日)。測定証跡がないため正式な区分決定はしない。
- **中干し日数**: 旧作付日数の平均切り上げ、実施期間両端算入、出穂日前日までの切り詰め、7日延長の算術テスト。履歴が2作以上あっても制度上必要な年度・営農証憑の十分性は未確認。
- **削減量の参照計算**: `A_ha*(EF_BL-EF_PJ)*(16/12)*GWP_CH4*0.001`。Ver.3.3参照の `EF_PJ=0.7*EF_BL` は架空パラメータでの計算専用。**正式認証 tCO2e と適格性は常に null**。
- **GX-ETS**: J-クレジットと独立した燃料起源CO₂の参照計算 `Q_fuel*HV*(tC/GJ)*(44/12)`。燃料単位と発熱量単位が一致しない入力、購入電力等の別排出源を拒否。公式係数、報告値、排出枠・クレジット量は計算しない。

## コスト同期
移植元: [IEEE版のコスト計算](https://github.com/Takzin1/NaFT-IEEE_Climate_Hackthon_Edition/blob/main/src/cost-estimator.js)。
同一計算エンジンと[仮定値config](../config/cost-estimator.defaults.json)を日本語版に移植。
合成100 Claim `NAFT-SYNTHETIC@1→@2` を**実際の影響解析エンジン**で再計算した件数から、総件数・再検証件数を表示し、任意入力の作業時間、時間単価、固定費、為替から全件/選択的コストを試算する。

費用モデルは `reviewed_plots * hours_per_plot * hourly_rate_jpy + (reviewed_plots>0 ? fixed_overhead_jpy : 0)`。
**コストは実測ではない。** 30/70は合成fixtureの構成であり、費用70%削減を実証した数字ではない。
案件ごとの難易度、証憑取得コスト、制度審査費用、追加固定費、費用実績を含めない。費用推計からJ-クレジットの収益や認証量を算出しない。

## 分離すべき領域
1. 科学的観測/研究値 (RESEARCH_OBSERVATION)。
2. 適用ルールに従う計算値 (METHOD_CALCULATION)。
3. 第三者承認・登録を経た認証値 (CERTIFIED_AMOUNT)。
4. 人間の再検証費用の仮定計算 (ILLUSTRATIVE_COST)。
これらは別スキーマ・別単位であり、演算で合算しない。

## 将来の制度適合ゲート
1. [J-クレジット公式一覧](https://japancredit.go.jp/about/methodology/)から最新AG-005原文と効力・経過措置を取得しSHA-256で固定。
2. [NIESインベントリ](https://www.nies.go.jp/gio/aboutghg/)で適用版・年度・地域・排水性・施用区分・係数を固定。
3. [農水省シミュレーター](https://www.maff.go.jp/j/kanbo/kankyo/seisaku/climate/jcredit/241226.html)と原典事例の独立比較。丸め、按分、年度別条件を追完。
4. [METI GX-ETS](https://www.meti.go.jp/policy/energy_environment/global_warming/ets.html)の燃料別係数、組織境界と第三者確認を別プラグインで実装。
5. 監査実測工数と単価を収集するまで、コスト結果は**仮定**として表示し続ける。

本モジュールは既存のCompiler Rule Packや監査判断を上書きしない。デモの研究用計算値を正式なGHG検証パッケージに混入させない。
