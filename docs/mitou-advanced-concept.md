# 未踏アドバンスト向け技術問い

**NaFT = Version-aware MRV Evidence Infrastructure**

NaFT transforms heterogeneous environmental evidence into methodology-aware, reproducible, human-reviewable MRV packages.

## 問い

環境証憑・圃場／活動identity・方法論の版・評価結果・人間判断を、再現可能なパッケージとして結び付けられるか。方法論や入力が変化したとき、何が再評価を要し、どの判断を再利用できず、誰が例外に責任を持つべきか。

## 現時点の実装

AG-005参照Packの版・hash固定、証憑実バイトSHA-256とManifest、日付・必要証憑・重複／期間重なりチェック、決定論的算術、入力変更の失効検知、証憑競合の例外判断、Packのprototype release approval、最終パッケージ宣誓、監査チェーン、canonical JSON export、Program集計。

正常案件は機械評価から最終宣誓へ進む。人間は例外の判断と最終証明責任に集中する。正式な外部検証はアプリ外に残る。

## 未解決

方法論は参照Pack 1件であり、複数版にわたる差分解析や影響範囲の追跡は未実装。正式採択版・係数は未確定のため削減量result=null。証憑の意味解析・原本保管・独立監査証跡・複数利用者の整合性・外部検証者の受入れは未実証。

## 評価対象

再評価の再現性、古い判断の誤再利用防止、変更影響の検出、例外の見逃し／過検知、人間の操作数・確認時間、原資料からパッケージへの追跡可能性。現在のテストは合成データ上のソフトウェア挙動を検証し、現場での価値や制度適合性を証明するものではない。
