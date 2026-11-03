# NaFT P20｜年間水田CH₄原本ZIP→公開GXタイル全15年の独立再現 (2026-11-03)

## 結果
提供された `RiceCH4_mgCH4m2day_annual(2).zip` を安全に展開・バイト検査した結果、既にP19で導入した `annual(1)` と **SHA-256が完全一致**。新たな15年の独立データセットではないため再登録・二重計上しない。

- ZIP SHA-256：`082cab760b66e217529f58898890eb408ffd2e757177359ffb04f1c9653d9f98` (2,517,191 bytes)
- ZIP MD5（ローカル算出）：`59743e36d366b4d25691d7069d0adea4`
- 15 GeoTIFF + 15 Nodata XML。2001〜2015年、1年につき2808×1516画素、各年48×26の粗視化プレビュー。
- オフライン再生成した15年の公開タイルpack総合SHA-256：`8b8f985720b0ef90139670bae00b3ad41dbf8e560cd6e91c35062fa33544539b`。P19 GitHubで公開されたpackと**全15年完全一致**。

**今回増えたのは「データ本体」ではなく「原本からの再演算を繰り返せる検証ツール」**。

## 操作
`scripts/p20-rice-ch4-original-replay.py` は元ZIPをローカルで受け取り、原本SHA、15年各GeoTIFF・XMLハッシュ、空間投影、正値画素・0値数、正値平均、非重複タイル境界、全年度のプレビューpackを再演算して固定されたP19 SHAと突合する。元GeoTIFFは一切公開しない。

```bash
# オフライン原本再演算には numpy / rasterio のみ別途インストール
python3 -m pip install numpy rasterio
python3 scripts/p20-rice-ch4-original-replay.py '/private/RiceCH4_mgCH4m2day_annual.zip'
# 合成テスト・ハッシュ不一致拒否など。CIでは原本もrasterioも不要
python3 tests/p20-rice-ch4-original-replay.test.py
```

ローカルでの原本に対する結果：`EXACT_SOURCE_TO_PUBLIC_PREVIEW_REPLAY_MATCH`。これは**同じモデル由来のデータ加工の再現性**であり、衛星・観測値の正しさや公的認証の確認ではない。元データに関する配布元の認証、利用権、値0の定義、実測との独立比較、J-クレジットの正式な係数、tCO₂e・クレジット発行は一切検証・実施していない。

## GitHub CIの境界
`tests/run.sh` にPython stdlibのみで動く5種類の単体テストを追加した。**大容量の原本をGitHubに公開せず、CIでは全画素再演算も行わない。** 実原本の全画素再演算は2026-11-03にアップロードされたローカルZIPを使って一度実施済み。次に新しい原本が届いたら本スクリプトを再実行する。

本番UIの「08 / RICE CH₄」では検査済み原本から再演算した事実と、研究用途・正式認証不可の境界を表示する。
