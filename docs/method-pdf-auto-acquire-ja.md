# 方法論PDFの自動取得（P78 follow-up / 2026-11-18）

利用者が明示的に起動するローカルCLI。Compiler、ブラウザ、GitHub Actionsには通信を追加しない。PDF原本・隔離ファイル・レシートはリポジトリ外の専用ディレクトリに保存。公開再配布はしない。

## 取得先

- AG005_31_PC: PUBLIC_COMMENT_REFERENCE — https://public-comment.e-gov.go.jp/pcm/download?seqNo=0000281460
- AG005_33_PC: PUBLIC_COMMENT_DRAFT — https://public-comment.e-gov.go.jp/pcm/download?seqNo=0000288301
- AG005_35_CANDIDATE: METHOD_VERSION_CANDIDATE — https://japancredit.go.jp/pdf/methodology/AG-005_v3.5.pdf
- FO001_64_CANDIDATE: METHOD_VERSION_CANDIDATE — https://japancredit.go.jp/pdf/methodology/FO-001_v6.4.pdf
- MAFF_AG005_OVERVIEW: GUIDANCE — https://www.maff.go.jp/j/seisan/kankyo/ondanka/attach/pdf/index-175.pdf
- MAFF_AG005_ACTIVITY_GUIDE: GUIDANCE — https://www.maff.go.jp/j/seisan/kankyo/ondanka/pdf/nakaboshi_guide.pdf

AG-005 3.5のURLは版番号からの候補、FO-001 6.4のURLは公開文献の参照先。2026-11-18時点の直接取得は双方HTTP 403。e-Govは過去の参考・改定案であり正式採択版の代替ではない。農水省ガイドは制度文書そのものではない。既存P3/P18の記録済みハッシュは変更しない。取得成功を意味するハッシュは実際に受信した時だけ生成する。

## コマンド

```sh
node scripts/method-pdf-acquire.mjs list
node scripts/method-pdf-acquire.mjs fetch all
node scripts/method-pdf-acquire.mjs fetch AG005_35_CANDIDATE
# 取得結果に表示される directory/receipts.json を指定
node scripts/method-pdf-acquire.mjs verify /tmp/naft-method-pdf-EXAMPLE/receipts.json AG005_33_PC
node scripts/method-pdf-acquire.mjs compare OLD/receipts.json AG005_33_PC NEW/receipts.json AG005_35_CANDIDATE
```

取得は固定HTTPS URLのみ、リダイレクト・403の回避・認証情報送信なし。1件12MiB、30秒。PDF MIME、先頭とEOFを確認し原本SHA-256を計算する。既知ハッシュとの不一致は隔離し、verify/compareの入力から排除する。PDF未取得の項目があればfetchは終了コード2。既存スナップショットは上書きしない。compareは同一方法論の原本バイトを再ハッシュしてから変化を確認する。変更検出は条文差分の証明ではない。受信時刻はローカル時計で、第三者時刻証明ではない。

## 境界

正式採択、有効期間、係数、逐条レビュー、再配布権は未確認。正式認証やRule Packの自動昇格は禁止。AG-005は既存P3/P4の手動審査、ガイドはP18の既存ハッシュ照合に接続できるが、本CLIはそれらの承認を代行しない。テストは合成レスポンスのみでネットワーク不要。

```sh
node --test tests/method-pdf-acquire.test.mjs
```
