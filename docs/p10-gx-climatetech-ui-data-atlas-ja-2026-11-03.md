# NaFT P10｜ClimateTech UI + 公的稲作データ・版別アトラス

**基準日 2026-11-03。研究用。GHG実測・J-Credit適格性・炭素クレジット発行の証拠には使わない。**

## GX / ClimateTech デザイン

Google Labsの[DESIGN.md形式仕様](https://github.com/google-labs-code/design.md/blob/main/docs/spec.md)を調査し、NaFT独自の[ルートDESIGN.md](../DESIGN.md)（YAML design tokens + デザイン理由）を策定した。参考軸は[Carbonfuture](https://www.carbonfuture.com/)の独立検証・Trust Infrastructureという情報設計、[Gaia](https://gaiacompany.io/)の落ち着いたデータカード構成、[WCAG 2.2](https://www.w3.org/TR/WCAG22/)のフォーカスとコントラスト要件。**他社のデザイン成果物・CSS・画像を複製していない**。元サービスの商標・成果・認証量をNaFTへ移植しない。

CSS: `src/gx-design-system.css`（森林グリーン×オフホワイト、明るいライムのアクセント、研究的階層、レスポンシブ・フォーカス・動き抑制）。従来のIEEEページは `body[data-page=climatechain]` のテーマを優先して競合しない。

## 公的データの追加（「同じ収穫量」の中の違い）

- **2024年産**：農水省作物統計を掲載した北海道公式PDF由来、47県の水稲全体の作付面積・収穫量。**7,345,000t**（P9、全国）。
- **2025年産確報**：農水省主食用米・生産者ふるい目幅、作付面積**1,367,000ha**、収穫量**7,181,000t**。確報の公表日2026-03-06。[農水省公表結果](https://www.maff.go.jp/j/syouan/keikaku/soukatu/r6_kome_ryutu.html)・[e-Stat都道府県別水稲確報メタデータ](https://www.e-stat.go.jp/stat-search/files?cycle=7&layout=datalist&lid=000001468110&month=0&page=1&stat_infid=000040420282&tclass1=000001032288&tclass2=000001032753&tclass3=000001233662&toukei=00500215&tstat=000001013427&year=20250)。
- **2026年産予測**：農水省主食用米・生産者ふるい目幅、**9月25日現在**の作付面積**1,360,000ha**、予想収穫量**7,105,000t**、10aあたり予想収量**524kg**。公表日**2026-10-13**。[農水省公式の年別公表一覧](https://www.maff.go.jp/j/tokei/kouhyou/sakumotu/sakkyou_kome/)・[中国四国農政局の全国解説](https://www.maff.go.jp/chushi/topics/r8estimatedyield.html)。**確報ではない**。
- **2026年・関東農政局管内予測**：面積274,700ha、予想収穫量1,443,000t、単収525kg/10a（9月25日現在）。[関東農政局](https://www.maff.go.jp/kanto/press/toukei/kikaku/261013.html)
- **2026年・九州農政局管内予測**：面積153,900ha、予想収穫量747,900t、単収486kg/10a（9月25日現在）。[九州農政局](https://www.maff.go.jp/kyusyu/press/toukei/261013.html)

**2024年（全水稲）の7,345,000tと2025/2026年（主食用・ふるい目幅）の7,181,000/7,105,000tを同一の収穫指標として時系列グラフにしない。**

2025年確報と2026年予想で一応主食用・生産者ふるい目幅の範囲は一致し、`7,105,000-7,181,000=-76,000t`という**公表値同士の暫定差**は示せるが、2026年の確定した減収ではない。令和8年産の確報が公表されるまで結論を保留する。単収や面積は丸め値であり積と収穫量が完全一致する前提も置かない。

## 実装した機能

1. `research/p10-maff-rice-release-vintages-2026-11-03.json`: 年度・確報/予想・主食用/全水稲・ふるい目幅・単位・地域・公表日を分離した一次資料メタデータ。
2. `scripts/p10-maff-vintage-gate.mjs`: 数値や出典の未検証状態を固定する改ざん防止ゲート。範囲・定義が異なる場合は `BLOCKED_DIFFERENT_CROP_SCOPE_OR_SIEVE` で差を出さない。2025→2026は `NON_FINAL_ILLUSTRATIVE_PUBLISHED_DIFFERENCE_ONLY`。
3. `src/gx-data-explorer.js`: `#/gx-data` という追加ページ。P9の2024年47都道府県の値を静的に表示し、セレクターで県別に切替。県の農業技術PDF候補がある場合は原出典へリンク（15件、残り32は未調査の旨を明示）。収量と面積×単収の照合値を示すが公表値を上書きしない。
4. `src/mrv-ui.js`：既存の6段階MRV・追加のレビュー/気候デモのルートを保ったままGX Atlasリンクと県セレクトを接続。`gx-data`は**表示専用**で、権限操作・認証・発行・変更を追加しない。
5. `src/gx-design-system.css` と `naft-app.html`: 社内デザイントークンをUIに適用、外部フォント・リモート画像なし。P7/P8/P9の研究ガードは変更しない。

## データを入れていない領域

- 2025確報e-Statの47県Excelファイル実バイトは**未ダウンロード**。2025都道府県別の行が既にインサート済みとは主張しない。
- 2026年の県別予測も**未インサート**。関東・九州の管内数値は都道府県レベル観測や水田メタン実測とは別。
- PDFバイトSHA-256、県別観測CH₄排出、認証係数、認証済みtCO₂eはいずれも追加**0件**。新規の全国統計は米生産量であり炭素排出量ではない。

## 検証

```bash
node tests/p10-gx-design-data.test.mjs
node scripts/p10-maff-vintage-gate.mjs inspect
node scripts/p10-maff-vintage-gate.mjs compare MAFF_RICE_2025_MAIN_FOOD_FINAL MAFF_RICE_2026_MAIN_FOOD_SEP25_FORECAST
bash tests/run.sh
```

デザイン確認はデスクトップと小型画面で視認性、タップ、リンク、行末折返し、見出し、Keyboard focus、低モーションを確認する。Playwrightの既存ブラウザ検証が通ったことは**専門的なアクセシビリティ認証・全端末での視覚審査とは別**。
