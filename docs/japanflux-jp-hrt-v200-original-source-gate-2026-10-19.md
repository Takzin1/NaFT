# JapanFlux2024 v2.00 JP-Hrt：原著ZIP・CH4欠測・QC意味論ゲート

2026-10-19。対象：JapanFlux2024 Version 2.00、JP-Hrt Hiratsuka Rice Paddy。公式メタデータ番号 A20241210-020。**原著実測値そのものはリポジトリに含めない。** 保存するのは原バイトSHA256・列数・欠測分布などの構造的証拠のみ。

原典：[NIPR公式データメタデータ](https://ads.nipr.ac.jp/data/meta/A20241210-020)／[データDOI](https://doi.org/10.17592/001.2024121020)／[論文](https://doi.org/10.5194/essd-17-3807-2025)。

## 解凍・調査済みの実ファイル

ユーザー提供ZIP：A20241210-020_2.00_selected(1).zip、約153MiB、33件。ZIP全体およびHH・DD・付属PDFのSHA256を[研究証拠JSON](../research/japanflux-jp-hrt-v200/selected-native-source-coverage.json)に固定。

付属PDF（A20241210-020_v200.pdf）にVersion 2.00、ライセンス表示CC BY 4.0、CH4測定手法としてHREA法とチャンバー法が記載。CO2や熱フラックスに使われる渦相関法を**この地点のCH4値の測定手法と勝手に同一視しない**。PDFの一般的な手法説明だけではCH4列の全観測値と方法が1対1で対応する根拠にはならない。

| 対象 | 行数 | 列数 | 数値候補FCH4 | 欠測FCH4 |
| --- | ---: | ---: | ---: | ---: |
| ALLVARS_HH：2013年30分グリッド | 17,520 | 85 | 1,915（10.930%） | 15,605 |
| ALLVARS_DD：2013年日次グリッド | 365 | 89 | **0** | **365** |

数値の候補は2013年6月218、7月822、8月663、9月212行のみ。FCH4とFCH4_1_1_1は原著HH CSVの全行で一致。別列のCH4_1_1_1はCH4の濃度であってフラックスではない。欠測は -9999 系のセンチネルであり、排出フラックスのゼロを示すものではない。正規化前の数値候補は研究上のQC合格と認定していない。

## オフラインZIP事前検査

~~~sh
python3 scripts/inspect-japanflux-jp-hrt-v200.py \
  --zip '/path/to/A20241210-020_2.00_selected(1).zip'
~~~

ネットワークアクセスはなく、ZIPパス・メンバ数・サイズ上限を検証し、HH/DD CSVとPDFのみ読み込む。巨大なERA5データは抽出しない。元ZIPと選択した各ファイル／ヘッダーのハッシュ一致、30分境界の連続性、行数、二重FCH4列の一致、欠測数、数値候補の有限性を検査する。

出力はJP_HRT_NATIVE_STRUCTURE_ONLY_REPLAY_BLOCKED。観測の測定値を一覧出力・GitHub公開せず、時間積分や排出削減量算定は実施しない。--synthetic-fixtureオプションはCIテスト専用であり、元原著を検証したという主張には使用できない。

別レイヤーの scripts/lib/japanflux-jp-hrt-source-gate.mjs は、固定された研究用JSONを入力として、数値候補をNUMERIC_QC_UNKNOWN、欠測をMISSINGに区別する。VERIFIED_MEASURED=0、VERIFIED_GAP_FILLED=0。正規化・年間排出量の出力を阻止する。

## 原著Normalizerを解禁するために必要な確認

1. FCH4の分子／質量単位・符号・FCH4_1_1_1との対応。
2. タイムスタンプの実際のUTCオフセットと観測区間の意味（行の30分という幅は判明、タイムゾーンは不明）。
3. HREA/チャンバー観測の品質基準、補完値・外れ値・欠測の区分。科学的に検証されるまではOBSERVED_GOODを割り当てない。
4. BADM器械・運用・圃場管理記録と作期・区画の一致。現状はワークブックの存在だけ確認し、属性マッピング未検証。
5. 配布元記録と版の照合、CC BY 4.0表示に適したクレジット表記の維持。元ZIP一致は出版社の独立認証ではない。

この5条件が揃うまでは、汎用EDDY_NMOL_CH4_M2_S_V1アダプターをJP-Hrtへ自動適用しない。途中の期間観測値が数値でも、年平均・年積算・J-クレジット認証量へ外挿しない。

テスト：python3 tests/japanflux-jp-hrt-v200-source.test.py、node tests/japanflux-jp-hrt-source-gate.test.mjs、および bash tests/run.sh。

**原著の測定行のリポジトリ再配布・正式認証・市場販売や登録は一切行わない。**
