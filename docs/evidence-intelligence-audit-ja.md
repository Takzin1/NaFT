# 既存リポジトリの監査結果（2026-11-14）

Evidence Intelligence 層を追加する前に、既存コード・既存テスト・データモデルを検証した記録です。対象コミットは `24177fd`（P77）。変更前に `bash tests/run.sh` が全件通過することを確認しました。

関連：[設計書](evidence-intelligence-design-ja.md) ／ [実測結果](evidence-intelligence-measurements-ja.md)

## 検証した範囲

- 中核：`src/mrv-core.js`、`src/methodology-packs.js`、`src/mrv-compiler.js`、`src/compiler-session.js`、`src/compiler-demo.js`、`src/incremental-compiler-research.js`、`src/provenance-why-where.js`
- テスト：`tests/smoke.test.js`（182）、`tests/compiler.test.js`（354）、`tests/mitou-impact.test.js`（10）、`tests/impact-proof.test.js`（619）、`tests/run.sh` 全体、`tests/security.sh`、`tests/check-static.py`
- 文書：`docs/architecture.md`、`docs/data-model.md`、`docs/known-limitations.md`、`docs/human-in-the-loop.md`、`docs/impact-soundness.md`、`.github/ISSUES_BACKLOG.md`

データ取込（P1〜P77）とGX画面は今回の対象外で、変更していません。

## 維持すべき強み

- 正規化JSONとSHA-256による再現可能なパッケージ、純粋関数としてのコンパイル（時計・乱数・通信なし）。
- 版を完全一致で固定する不変Packレジストリと、未確認の制度設定を `UNKNOWN` / `CONFIG_REQUIRED` / `UNSUPPORTED` で止める fail closed。
- 例外単位の人間判断（入力指紋とPackハッシュに束縛）、Pack承認、最終確認、古い現行エクスポートの拒否。
- 独立した全再計算オラクルによる614件の反例検査（見逃し0件）。

## 技術負債と欠落（要件別）

| # | 要件 | 所見 | 根拠 | 今回の対応 |
| --- | --- | --- | --- | --- |
| 1 | ① 依存グラフ | グラフはActivity粒度。全証憑→Activity→全ルール→算定と結ばれ、証憑1件の変更が算定にも到達する。証憑要件・算定入力・係数版のノードが無い。Claimをまたぐグラフも無い | `src/mrv-compiler.js:152-166` | ノード単位のグラフを追加（既存グラフは不変） |
| 2 | ① 依存グラフ | `traceDependents` は取り出したノードごとに全辺を走査し `queue.shift()` を使うため O(V·E) | `src/mrv-compiler.js:167-171` | 隣接表つき O(V+E) 探索を追加し実測 |
| 3 | ② 版管理 | 係数・パラメータはPackに埋め込み。係数単独の版・有効期間・置換関係が無い（`emission_factors: 'UNKNOWN'`） | `src/methodology-packs.js:11` | 係数レジストリを追加（合成係数のみ実行） |
| 4 | ② 版管理 | 証憑の置換はID一致で上書きする計算であり、証憑自体の改訂履歴が無い | `src/mrv-compiler.js:200-202` | 証憑改訂の連結履歴を追加 |
| 5 | ② 版管理 | Packに有効期間はあるが、期間から版を調べる機能と版同士の置換関係が無い。レジストリが2系統（`METHODOLOGY_REGISTRY` と `COMPILER_REGISTRY`）でスキーマが異なる | `src/mrv-core.js:108-109`、`src/mrv-compiler.js:17` | 候補列挙（参考用）を追加。2系統の統合は未着手 |
| 6 | ③ 影響解析 | `analyzeImpact` は状態を持たず、変更と無関係なClaimも含めて全件の旧パッケージを再コンパイルする | `src/mrv-compiler.js:189` | 状態を保持する差分適用を追加し実測 |
| 7 | ③ 影響解析 | 既存の選択的解析は安全側で、意味が変わらない185件中107件を再検証対象にする（文書化済み） | `reports/impact-proof.json` | 同じ614件で新エンジンを判定（過剰再検証0件） |
| 8 | ③ 差分再計算 | 既存のClaim単位キャッシュは、スナップショット検証で全文書を再ハッシュするため、**全件コンパイルより遅い**（本環境の60件：更新 112 ms、全件コンパイル 53 ms） | `src/incremental-compiler-research.js:27-50`、`scripts/benchmark-incremental-research.js` | ノード単位の再利用を追加。既存モジュールは不変 |
| 9 | ④ 決定論的算定 | 算定は倍精度浮動小数点の畳み込み。一般には演算順で結果が変わり、丸め規則・単位検査が無い | `src/mrv-compiler.js:112-115`、`src/mrv-core.js:58` | 有理数の算定エンジンを追加（既存の値は互換のため保持） |
| 10 | ④ 決定論的算定 | `canonicalize` は `NaN` / `Infinity` を `null` として直列化するため、`{a: NaN}` と `{a: null}` のハッシュが一致する | `src/mrv-core.js:6` | 新エンジンの入口で非有限数を拒否。既存関数は既存ハッシュ維持のため不変 |
| 11 | ④ AI説明の分離 | 説明層も、生成結果を計算から隔離する境界も存在しない | — | 一方向の説明境界と検証器を追加（生成モデルの呼び出しは無し） |
| 12 | ⑤ 監査ログ | セッション監査は実行のハッシュだけを記録し、入力・算定・検証結果を個別に照会できない。変更適用そのものの記録が無い | `src/compiler-session.js:143-161` | 型付き監査ログを追加（セッション連鎖との結合は次段階） |
| 13 | ⑤ 監査ログ | `audit()` は追記のたびに連鎖全体を再検証するため、追記コストがイベント数に比例する（設計上の方針：長寿命の完全性キャッシュを持たない） | `src/mrv-core.js:134-141` | 変更せず実測して記録 |
| 14 | ⑥ レポート・API | 出力は生のJSONとOPM/FAIR受領書のみ。文ごとの根拠を持つレポートも、プログラムから呼べるAPIも無い | `src/compiler-session.js:134-142` | 根拠付きレポートと状態を持たないAPIを追加 |
| 15 | ⑦ 性能測定 | ベンチマークは60件・5試行のみ。大きなデータセットは未計測と文書に明記 | `docs/mrv-visibility-performance.md` | 100 / 1,000 / 5,000件で実測 |
| 16 | 会計文脈 | データモデルに「インベントリ算定」と「クレジット認証」を区別する項目が無い（`DISCLAIMER` は認証否定のみ） | `src/mrv-core.js:107` | 会計文脈と用途ガードを追加 |
| 17 | 構造 | グローバル関数をスクリプト連結で共有し、読み込み順に依存する。`mrv-core.js` は1行関数が密集（270行・約33 KB） | `tests/compiler.test.js:3` | 変更せず。新規コードは接頭辞 `ei` で名前衝突を回避 |
| 18 | 永続化 | 変更適用のロールバックは `db` 全体の複製に依存し、単一プロセス前提 | `src/compiler-session.js:155-159` | 未着手（既知の制約のまま） |

## 判断

- 既存の関数・ハッシュ・テストは**変更しない**。新機能は追加モジュールとし、既存実装を「差分検査のオラクル」として使う。
- 制度上の未確認事項（AG-005の採用状況・係数、AG-004）は fail closed のまま。新しい係数レジストリにも実在の排出係数は登録しない。
- セッション層・UIへの統合、2系統レジストリの統合、監査連鎖の結合は、今回の検証結果を前提に次のPRで扱う。
