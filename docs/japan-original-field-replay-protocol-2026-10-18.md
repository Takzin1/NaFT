# NaFT 日本語版｜原著実測集計値の独立計算と差分按分プロトコル

2026-10-18 / **実装状態：PUBLISHED_AGGREGATES_REPLAY_ONLY** / J-クレジット認証・現場測定の代替ではない。

## 1. 原著を確認したケースと「同じ環境」の厳密な意味

### Yagi et al. (1996) ― 同一試験地・同一年の処理区比較
- 原著: **Yagi, K., H. Tsuruta, K. Kanda, K. Minami (1996)**, *Effect of water management on methane emission from a Japanese rice paddy field: Automated methane monitoring*, Global Biogeochemical Cycles 10(2), 255–267. [DOI 10.1029/96GB00517](https://doi.org/10.1029/96GB00517)
- 実験: ひとつの日本の水田試験地に、常時湛水区（5〜8月の継続灌漑）と、複数回の短期間排水区。自動CH₄モニタリング。
- **論文Abstractに明記された実測集計値**: 1991年の常時湛水14.8、間断排水8.63 g-CH₄/m²/作期。1993年は9.49対5.18 g-CH₄/m²/作期。
- 比較軸: **同じ年・同じ報告試験地**の処理区間差のみ。1991と1993の数値を、そのまま「同じ気候条件」の対照として引き算しない。
- **未取得**: 日単位の気温・降雨・灌漑量・土壌Eh・CH₄フラックス原系列と測定値ごとの不確実性。測定環境を物理的に再現した、とは表明しない。

独立計算（値は原著に記載の**測定集計値**で、合成データではない）:

\`\`\`text
year=1991: 14.8−8.63=6.17 g-CH4/m²/作期 =61.7 kg-CH4/ha/作期
           6.17/14.8×100 =41.689189...% （比較年内の差）
year=1993: 9.49−5.18=4.31 g-CH4/m²/作期 =43.1 kg-CH4/ha/作期
           4.31/9.49×100 =45.416227...%
1 g/m² = 10 kg/ha （CH4自体の質量単位; CH4-Cとの換算ではない）
\`\`\`

これらは**処理区間の観測差**であり、日本J-クレジットAG-005のベースライン、クレジット発行量、因果推論の寄与度配分ではない。

### Nishimura et al. (2004) ― 2002年の通年フラックス集計
- 原著: *Methane and nitrous oxide emissions from a paddy field with Japanese conventional water management and fertilizer application*, Global Biogeochemical Cycles, [DOI 10.1029/2003GB002207](https://doi.org/10.1029/2003GB002207).
- 観測: 2002-01-01〜2002-12-31、2つの自動密閉チャンバー。作付期2002-05-09〜2002-09-24。湛水は概ね2002-07-03まで、最終落水は概ね2002-09-05。およそ1cm/dayの浸透量。施肥は50+30+10 kg N/ha、稲わらすき込みを伴う栽培。
- 論文Table 1の公表値（**平均**。括弧の±は**標準偏差**、標準誤差ではない）:

| Gas / mass basis | 作付期 | 休閑期 | 年間 | printed resolution |
| --- | ---: | ---: | ---: | ---: |
| CH₄, mg-CH₄/m² | 3180 | -51 | 3128 | 1 mg |
| N₂O, **mg-N/m²** | 2.6 | 57.7 | 60.2 | 0.1 mg |

復元すると CH₄: 3180 − 51 = **3129**、年間表示3128との差は **−1 mg/m²**。N₂O-N: 2.6+57.7=**60.3**、年間表示60.2との差は **−0.1 mg-N/m²**。どちらも3つの公表値をそれぞれ表示桁へ丸めた時の合成理論誤差上限1.5×最小表示桁の範囲内。ただしこれは「丸めで説明可能」の意味であり、独立に生データが一致した証明ではない。

CH₄の年間質量は3128mg/m²=**31.28 kg-CH₄/ha/年**。N₂O-Nの年間値は60.2mg-N/m²=**0.602 kg N/ha/年**で、N₂O分子量への換算には44/28を掛け、**0.946 kg-N₂O/ha/年**となる。N₂O-NをCH₄やN₂Oの質量と混同しないこと。

元の研究は日次の測定欠損を隣接日に基づく線形補間で扱っているが、その原時系列を再取得できていないため、NaFTでは観測日ごとの補間を再現しない。

## 2. 差分按分のプロトコル（誤った因果帰属を防止）

三つの差分を、**互いに混ぜずに**扱う。

| 差分 | 基準 | 配分できる内容 | 配分できない内容 |
| --- | --- | --- | --- |
| A: 観測処理区差 | 同年・同一研究地の常時湛水 vs 間断排水 | CH₄の質量差・%・基準区/処理区 | 温度・水位・施肥などの因果的寄与率 |
| B: 期間集計の照合差 | 同年同論文の作付期 + 休閑期 vs 年間 | 作付期分・休閑期分・表示丸めによる残差 | 別年度/他の圃場を混ぜた擬似的な年間量 |
| C: NaFTモデル−観測差 | 同一site, year, crop-cycle, water regime, gas, mass basis | 正規化後の残差の全量を \`UNATTRIBUTED\` として出力 | 日次実測・気象実測などの裏付けなしに気温30%、土壌20%等を付ける行為 |

\`\`\`text
D = estimate_model − measured_observation
D = Σ(検証された差分寄与) + 未帰属残差
\`\`\`

現在は検証可能な気象・土壌・水位等の独立寄与が無いため **Σ=0、未帰属残差=D**。利用者が任意の係数で「要因按分」を入力しても拒否する。日次生データが得られても観測整合性だけでは因果分解にならず、実験設計・交絡調整等が必要。

## 3. raw experiment environment matching gate

数値・列の観測条件を \`source_record_id, year, crop cycle, plot/treatment, location, soil class, drainage schedule, temperature record, precipitation record, flux unit/time step, instrument method, calibration and gap-fill policy\` として固定する。

\`actual_daily_air_temperature=null\` 等のフィールドが欠けているときは \`ENVIRONMENT_MATCH_UNVERIFIED\`。公表集計値の単純な換算と独立演算は続行できても、完全な物理条件再現・制度適格性は主張しない。

韓国Gimje原データ候補 [Zenodo: 10.5281/zenodo.17111992](https://doi.org/10.5281/zenodo.17111992) は、2022〜2024年の日次フラックス、気温、降水量、水管理、移植後日数、圃場メタデータを含むが、**今回アーカイブ本体の取得に失敗**。original_bytes_downloaded=false、license=NOT_CONFIRMEDのまま取り込みゲートを閉じる。将来rawを取得した場合はZIPと内部ファイルのハッシュ、CSV列、圃場ID、期間、単位、チャンバー観測日と補間方針を検査してから独立再計算する。

## 4. 実装・検証

- JSON: \`data/japan-original-field-observation-aggregates.json\`（原著公表値、DOI、条件の未知部分を明示）
- Core: \`src/japan-field-study-replay.js\`（BigInt固定小数点で実測集計・丸め差・年内処理差・未帰属モデル残差を計算）
- Independent oracle: \`tests/japan-field-independent-oracle.test.py\`（**別実装**のPython Decimalで実測集計値を独立計算しJS結果を照合）
- CLI: \`node scripts/japan-field-observation-replay.mjs\`
- Japanese browser: \`gikuten.html\` 下段「原著論文の実測集計値」カード。

\`\`\`bash
node tests/japan-field-study-replay.test.js
python3 tests/japan-field-independent-oracle.test.py
bash tests/run.sh
\`\`\`

**未解決:** 原著の時系列数値・付随実測環境・適法な原ファイル取得、AG-005 Ver.3.5の現行公式算定、NID係数、実圃場における環境条件マッチング、正式なクレジット量。どれも \`null / 未検証\` で維持する。
