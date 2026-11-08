# NaFT P28｜県ごとの農業資料の取り込み

2026-11-09：2024年と2025年の統計は全国47県分が登録済みですが、県独自の農業技術PDF索引は15県分でした。既存P9の検証コードがこの15件を固定していたため、残り32県のURLをその台帳へ直接追加する運用は安全ではありません。

P28は既存15件を維持し、新たな県公式PDFの候補を別レジストリに追加します。元PDFのアップロードは不要で、PDFファイルを指定した場合もSHA-256とサイズを記録するだけです。PDF本文や数値を抽出していないこと、原典公開者による同一性確認をしていないことを明示します。

## 実行方法

まず取り込みたい県の資料が掲載されている実際の公式URLを確認してください。以下のURLは書式を示す架空の例で、実在確認済みではありません。

manifest.json の内容例：

    {
      "schema": "naft-p28-prefecture-pdf-intake-v1",
      "candidates": [{
        "prefecture_code": "05",
        "title": "実際の公式PDF資料名",
        "year": 2025,
        "source_url": "https://www.pref.akita.lg.jp/official-document.pdf",
        "local_pdf": "./file.pdf"
      }]
    }

元PDFがある場合はmanifestと同じフォルダへ置いてください。local_pdfは省略可能ですが、その場合はバイト照合を実行しません。既に索引済みの15道県の重複追加は拒否します。

    node scripts/p28-prefecture-intake.mjs status
    node scripts/p28-prefecture-intake.mjs preview /path/to/manifest.json
    node scripts/p28-prefecture-intake.mjs import /path/to/manifest.json
    node tests/p28-prefecture-intake.test.mjs

previewは書き込みを行いません。importはresearch/p28-prefecture-candidates-v1.jsonとsrc/gx-prefecture-candidates.jsを更新します。変更をGitHubにコミットすると、GX Data Atlasの該当県に「追加候補・原典未検証」と表示されます。

## 注意事項

- 国の2024年水稲統計（47都道府県）と2025年e-Stat統計（47都道府県）は変更しません。
- この仕組みは県資料の出典索引を取り込みます。県PDFの数字、CSV/XLS/XLSXの表、排出係数、圃場CH4の実測値は取り込みません。
- PDFのローカルSHA-256は公開者の原本との同一性証明ではありません。
- 2024年統計値の上書き、排出係数への自動転用、炭素クレジット発行は禁止します。
- 元PDF自体を公開リポジトリへ複製しません。
