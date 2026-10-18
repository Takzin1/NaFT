# NaFT日本語版：原著ネイティブCSVの事前検査（2026-10-19）

**研究用の構造検査であり、実測フラックスの正規化・積算ではない。** 原著CSVを既存のオフライン積算・集計値比較へ直接送らないための独立ゲートを追加した。

## 原典と対象ファイル

[Zenodo 10.5281/zenodo.8067998](https://doi.org/10.5281/zenodo.8067998) の中国水田CH₄関連ファイル。既存の[GitHub Actions一時取得ログ](https://github.com/Takzin1/NaFT/actions/runs/39142424578)にある公表MD5、取得時SHA-256、ファイルサイズ、列名を固定する。元ファイルはリポジトリに収録・再配布していない。

| ソースID | 元ファイル | CH₄列・基準 |
| --- | --- | --- |
| CN_2023_DAILY_CARBON | Supporting information data2.csv | CH4-gC/m2/day（CH₄-Cの炭素質量） |
| CN_2023_HOURLY_MOLECULAR | Supporting information data1.csv | CH4-umol/m2/s（CH₄分子モル量） |

これらを同じ質量単位・観測時間だと扱わない。Year、DOY、Month/day、Hour/Minuteの暦上の一致を検査するが、タイムスタンプが区間開始・終了・代表時刻のいずれか、時間帯（UTC差）、欠測・補完・QCは未確認。数字の文字列を見つけても、有効な測定値とは断定しない。

## CLI

~~~sh
# 正規の方法で入手した元ファイルをローカルでのみ検査
node scripts/preflight-china-rice-native.mjs \
  --csv '/path/to/Supporting information data2.csv' \
  --source CN_2023_DAILY_CARBON \
  --data-class USER_SUPPLIED_UNVERIFIED

node scripts/preflight-china-rice-native.mjs \
  --csv '/path/to/Supporting information data1.csv' \
  --source CN_2023_HOURLY_MOLECULAR \
  --data-class USER_SUPPLIED_UNVERIFIED

node tests/china-rice-native-preflight.test.mjs
bash tests/run.sh
~~~

**実データを入手していない場合に実測分析済みと主張しない。** テストは人工的なソース型行のみを使用し、原著の行データをGitHubへcommitしない。

## Fail-closed条件

1. ヘッダー完全一致、列数・各行数を検査。未対応の引用符・BOM・未知エンコーディング・NULL・不正改行・行数超過は拒否。実ファイルの引用符やエンコーディングには追加のレビューが必要。
2. Year/DOY/Month/dayの暦日不整合、存在しない日付、重複・逆順、時間値の範囲外を拒否。ここでの日付演算は表示された暦の整合性だけであり、UTCの実測時間を確定しない。
3. 日付間隔の空白は参考の構造情報として記録するのみ。フラックスの時間積分・欠測補完・全期間の完全性推定を実施しない。
4. USER_SUPPLIED_UNVERIFIEDでは公表MD5・一時取得SHA-256・サイズの3条件の一致を要求。一致しても独立した原著認証・科学的有効性・ライセンス許諾は証明しない。SYNTHETICでは一致を要求しない代わりに一致済みフラグを出さない。
5. 出力の状態は SOURCE_SHAPE_ONLY_REPLAY_BLOCKED。正規化CSV・積算量・不確かさ・認証tCO₂eはすべてnull。ローカル処理のみで外部通信なし。

## 実測へ進めるための条件

原著本文と測定プロトコルの一次ソースから、各CH₄列の時間支持、UTC差・センサーQC・欠測埋め・環境/圃場条件・ライセンスを検証する。そのうえで出典別に明示的なNormalization Adapterを構築し、既存の[観測差分検査](japan-aggregate-reconciliation-2026-10-19.md)との比較条件を審査する。日本のYagi(1996)・Nishimura(2004)は原著の時系列がまだないため、生データAdapterを推測実装しない。

**ブラウザUIは変更しない。** CIで試験するのは合成CSVの構造・日付・ハッシュ・異常系であり、原著の実測値の妥当性ではない。
