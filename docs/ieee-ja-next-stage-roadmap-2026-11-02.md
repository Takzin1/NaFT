# NaFT IEEE→日本語版 移植監査と次段階の改造方針（2026-11-02）

## 判断
IEEE版（`NaFT-IEEE_Climate_Hackathon_Edition/main`）から日本語版への移植は**機能ごとの選択移植**にする。英語ソースを無条件で全コピーすると、日本語版のAG-005参照境界、独立オラクル、既存研究ゲート、元データの配布権を破壊しかねない。原計算と機械的エラーコードは維持し、画面文言・操作説明・公開する検証結果を日本語にする。

PR #44 の `#/climatechain` には、合成100件の影響解析、申請別トレース、改ざん検出、3要素証明、監査レシート、全件/選択的ベンチマーク、原本SHA-256に束縛した独立観測再計算（JS/Python）、出典受入ゲート、**既存の**Sepolia P1/P2参照を移植済み。ただし **PRは未マージ**。CI成功は研究結果の外部認証を意味しない。

## 未移植コンポーネントの区分（IEEE mainとのファイル差分に基づく）
| 優先 | IEEE由来モジュール・論点 | 統合方針 | 完了条件 |
| --- | --- | --- | --- |
| **P0** | JapanFlux JP-Hrtの原著/公開観測間のlineage、QC・欠測・観測日境界 | 既存日本語PR #40（根拠ゲート）→ #41（研究証拠readinessレポート）を先に監査し、PR #44との依存関係を整理して別段階で統合 | 元の2013年研究・公開JapanFlux行を同一測定として扱わず、判定不能はnull/保留、原観測を無断再配布しない |
| **P1** | `scripts/ieee-gs-worksheet-replay.mjs`, `ieee-gs-worksheet-independent-oracle.py`, `ieee-gs-selective-reverification.mjs`, `rice-methodology-router.mjs` | Gold Standard / Verra / J-クレジットの**制度・文書版・出典別**検証アダプターを作成。原資料を根拠登録してからローカル再計算だけ接続 | 原文献のワークブック条件を復元、独立演算に一致、Tier番号の制度横断変換を拒否、未知の数式はUNSUPPORTED |
| **P1** | `ieee-gimje-*-preflight.py`, `ieee-third-party-evidence-map.py`, 原観測データ候補 | 韓国・水田などの観測元データは、ライセンス、出版者、取得時点、対象期間・単位・QC・欠測を独立検査する「候補受入」にとどめる | 出典真正性未確認時には認証値への昇格禁止。生データZIP/XLSXを権利未確認のまま日本語Repoへコピーしない |
| **P2** | `verify-climatechain-testnet.mjs`, `contracts/NaFTMRVAnchor.sol`, `ieee-verified-source-dual-link.mjs` | 公開チェーンの**読取専用**独立照合、source receiptとP1→P2の関連付けを追加。新規書込みは別設計・別承認 | 既存トランザクションのbytecode・event・head照合を再現し、ブラウザ表示がRPCの実測と混同されない |
| **P2** | UI/UX・アクセシビリティ | 既存の翻訳アダプターから段階的に `ja/en` キー辞書へ。操作後メッセージ、ARIA、モバイル、失敗時の説明をテスト | `data-action`, `id`, JSON, hash, code, Etherscan URLが不変で、日本語主要導線の実ブラウザ検証が成功 |
| **P3** | 実証・経済性 | サンプル現場フローを用い、完全再検証と差分再検証の監査工数・人的判断・処理時間を**別々**に測定 | 入力条件と測定環境を開示。合成70件非影響を70%時間・費用削減と言い換えない |

## 次の実装順（提案）
1. **PR #44の移植を堅牢化**：日本語の操作後メッセージ、信頼境界、利用者説明を整え、構造とデータ識別子は不変にする。CIとブラウザ動作を確認し、mainへのマージは別途判断。
2. **P0 Evidence Readiness**：既存PR #40/#41を独立監査し、説明可能な「データ入手→出典/QC判定→不足証憑→担当者確認」の流れとして日本語UIに提示する。数字を埋めるための推定補完は禁止。
3. **P1 Methods Adapter**：GS/Verra/J-Creditをバージョン付き方法論として分離し、独立ワークブック再計算＋敵対的fixtureで誤認を拒否。制度間のTier対応は根拠のある**明示的な**対応表以外禁止。
4. **P2 Proof & Audit**：オフチェーンの観測・算定レシートと公開チェーンのハッシュ継承を明確に分離し、第三者が読取専用で追試できる日本語「監査パケット」を出力。
5. **P3 Pilot**：実務担当者へのヒアリングで原資料の所在、QC/欠測の責任者、改定時の処理時間を確かめる。PoCの費用・労力削減は実測まで未主張。

## 横断的な受入ゲート
- `bash tests/run.sh` および追加モジュールのJS/Python独立テストが通ること。GitHub Actionsは**変更後の正確なhead SHA**で確認する。
- ユーザー提供・出典不明・未承認の資料は研究用メタデータと公式認定ソースを区別し、`certified_tco2e=null` を維持。
- 単位・測定期間・方法論版・ソースの不一致でfail closed。数値が同じでもprovenance不一致を受け入れない。
- 公開チェーンはハッシュと継承関係の証人であり、現場観測の正確性・認証・クレジット発行を証明しない。
- `main` には自動マージしない。PR #40/#41のstack関係とPR #44の競合を解消してから、ユーザーのマージ承認を得る。

### 参照
- [日本語移植PR #44](https://github.com/Takzin1/NaFT/pull/44)
- [既存日本語JP-Hrt研究PR #40](https://github.com/Takzin1/NaFT/pull/40)
- [研究証拠readiness PR #41](https://github.com/Takzin1/NaFT/pull/41)
- [IEEE版（元実装）](https://github.com/Takzin1/NaFT-IEEE_Climate_Hackathon_Edition)
