# Evidence Intelligence 設計書（第1段階）

Version-aware MRV Evidence Compiler + Re-verification Engine に、**追加モジュールとして**載せた Evidence Intelligence 層の設計です。既存の `compileEvidence` / `analyzeImpact` / セッション層・6画面・`DISCLAIMER` は変更していません。

関連：[既存コードの監査結果](evidence-intelligence-audit-ja.md) ／ [実測結果](evidence-intelligence-measurements-ja.md) ／ [API](evidence-intelligence-api.md) ／ [既知の制約](known-limitations.md)

## 1. 目的と非目的

| 対象 | この段階で実装したもの |
| --- | --- |
| ① 依存関係グラフ | 証憑バイト・証憑メタデータ・属性・ルール・証憑要件・係数・算定・評価・レコード・集計を**ノード単位**で結ぶグラフ。グラフがそのまま計算手順になる |
| ② バージョン管理 | 係数（coefficient）の独立した版・有効期間・置換関係、方法論の期間別候補、証憑の改訂履歴、基準書のスコープ台帳 |
| ③ 影響解析・差分再計算 | 変更されたノードの下流だけを再計算し、値が変わらなければそこで伝播を止める |
| ④ 決定論的算定とAI説明の分離 | 有理数による正確な算定エンジンと、一方向の説明境界（検証器つき） |
| ⑤ 監査ログ | 入力・算定・検証結果・変更・レポート・説明を型付きで記録するハッシュ連鎖 |
| ⑥ 根拠付きレポートとAPI | 全ての文に根拠ノードとハッシュを付けたレポート、状態を持たない計算API |
| ⑦ テストと性能測定 | 独立オラクル、既存実装との差分検査、実測ベンチマーク |

**非目的（この段階では行わない）**：正式な認証・登録・クレジット発行、企業GHGインベントリの算定、AG-005/AG-004の制度対応、実在の排出係数の登録、外部APIや生成モデルの呼び出し、セッション層・UIへの統合、本番運用。

## 2. 会計文脈の分離（GHGインベントリ算定 ≠ カーボンクレジット認証）

`src/evidence-intel-versions.js` の `EI_STANDARDS_SCOPE` に、参照する基準の**適用範囲**を登録します。

| 基準 | 会計文脈 | NaFTでの扱い |
| --- | --- | --- |
| GHG Protocol Land Sector and Removals Standard v1.1 | `CORPORATE_INVENTORY`（企業・組織単位の年次インベントリ算定・報告。Corporate Standard と Scope 3 Standard の補足） | **スコープ参照のみ**。実行可能なPackは無い |
| J-クレジット AG-005 `3.1-reference` / AG-004 | `PROJECT_CREDITING`（クレジット制度の方法論に基づく活動単位の算定。認証は制度側） | 参照用の事前チェックのみ。`result: null` |
| NAFT-SYNTHETIC 系 | `SYNTHETIC_ENGINEERING` | 工学的試験。制度上の意味なし |

確認できた範囲と限界：

- LSR Standard は v1.0 が 2026-01-30 公表、発効は 2027-01-01、その後の軽微な非実質的修正で **v1.1 が参照すべき版**とされている——ここまでは検索結果に表示された公式ページの記述と複数の二次資料で確認しました。
- **原文PDFは本セッションのネットワーク制限で取得できていません**（`ghgprotocol.org` が許可ドメイン外）。そのため台帳では `source_hash: 'UNKNOWN'`、`primary_text_verified: false`、`verification: 'SEARCH_INDEX_AND_SECONDARY_SUMMARIES_ONLY'` としています。v1.1 の公表日（日単位）も未確認です。
- 「購入・売却したクレジットは物理的インベントリと分けて報告し、相殺しない」という点は二次資料の要約に基づく記述であり、条文番号までは確認していません。

コード上の強制：

- `eiAssertIntendedUse(context, use)`：`CORPORATE_INVENTORY` としての出力要求は、どの方法論でも常に `EI_INVENTORY_ACCOUNTING_NOT_IMPLEMENTED` で拒否。合成結果をクレジット事前チェックと称することも `EI_ACCOUNTING_CONTEXT_MISMATCH` で拒否。
- レポートは `is_ghg_inventory: false`、`is_credit_certification: false`、`certified_result: null` を必ず持つ。
- 集計はプログラム・方法論・会計文脈・単位が同じClaimの間だけで行い、`certified_total` は常に `null`。

## 3. モジュール構成

| ファイル | 役割 | 依存 |
| --- | --- | --- |
| `src/evidence-intel-calc.js` | BigInt有理数による式評価、明示的な丸め、単位次元の検査、計算過程の記録 | Core の `canonicalize` |
| `src/evidence-intel-versions.js` | スコープ台帳、係数レジストリ、方法論候補、証憑改訂履歴、拡張合成Pack | Core / Compiler / calc |
| `src/evidence-intel-engine.js` | 計画（planner）、ノード演算、再利用つき評価、差分適用、グラフ出力・探索、既存実装との一致検査 | 上記 |
| `src/evidence-intel-report.js` | 根拠付きレポート、再検証、Markdown描画、影響・ポートフォリオレポート | engine |
| `src/evidence-intel-explain.js` | 説明境界（文脈の生成、テンプレート説明、外部ドラフトの検証） | report のみ |
| `src/evidence-intel-audit.js` | 型付き監査ログ（ハッシュ連鎖、チェックポイント、照会、状態との突合） | engine |
| `src/evidence-intel-api.js` | 輸送層に依存しないAPIルーター | 全て |
| `scripts/evidence-intel-api.mjs` | ループバック専用HTTPアダプタと単発CLI | api |
| `src/evidence-intel-anchor.js` | 取引しない来歴アンカー（Merkle、呼び出し引数、照合） | engine / report / audit |
| `src/evidence-intel-session.js` | 既存の保存・役割・監査ガードを通したセッション操作 | 上記と mrv-core |

既存の流儀に合わせ、ビルド不要のグローバル関数（接頭辞 `ei` / `EI_`）で、ブラウザの `<script>` と Node の `vm` の両方で読み込めます。**`naft-app.html` にはまだ読み込ませていません**（UI統合は次段階）。セッション統合（10.5節）は保存・役割・監査に接続済みですが、画面からは呼ばれません。

## 4. 依存関係グラフ

### 4.1 ノード

| 区分 | 種類（`kind`） | 内容 |
| --- | --- | --- |
| 共有（Pack・係数） | `pack` `source` `rule` `requirement` `parameter` `exception` `unsupported_condition` `calculation_spec` `factor` | 方法論の版ごとの定義。`source` は出典URL・ハッシュなど**意味に影響しない来歴**を分離 |
| Claim入力（葉） | `identity` `attribute` `evidence_content` `evidence_meta` `parameter_override` `peers` `claim_input` | 属性はルール・条件・算定が参照するパスごとに1ノード。証憑は**バイト**と**メタデータ**を分ける |
| Claim導出 | `input_root` `evidence_digest` `manifest` `evidence_check` `evidence_set` `identity_check` `condition` `parameter_value` `parameter_check` `rule_result` `requirement_result` `exception_result` `calculation` `evaluation` `record` | 既存 `compileEvidence` の各判定を1ノードずつに分解 |
| 集計 | `aggregate` | プログラム×方法論×会計文脈×単位 |

辺の向きは既存の `naft-provenance-1` と同じ **依存元 → 依存先**。

### 4.2 「グラフ＝計算」であること

導出ノードの演算（`EI_OPS`）には、**宣言した依存ノードの値だけ**が渡されます。Claim全体や入力オブジェクトには触れられません。したがって、宣言していない依存は構造上持てません。テストでは全導出ノードを依存値だけから単独で再計算し、ハッシュが一致することを確認しています。

これにより既存グラフ（Activity粒度で全証憑→全ルール→算定を結ぶ保守的な表現）よりも細かい追跡ができます。例：

- 証憑バイトの下流は、その証憑の要件・検査・評価・レコード・集計まで。**算定や無関係なルールには届かない**。
- 算定の上流は、算定仕様・使用する入力属性・使用する係数**だけ**。
- 使われていないパラメータは、どの算定・ルール・評価にも届かない。

### 4.3 探索

`eiGraphIndex` が隣接表を作り、`eiTrace`（上流・下流）、`eiTopologicalOrder`（閉路検出）、`eiDependencyPath`（最短の依存経路）は O(V+E) です。既存の `traceDependents` は変更していません。

## 5. バージョン管理

- **方法論**：既存どおり `methodology_id@version` を完全一致で固定。`eiPackCandidates` は期間に対して有効な版を**参考として**列挙するだけで、「最新」を自動選択しません。有効期間が `UNKNOWN` の版（AG-005、AG-004）は決して候補になりません。既存4版のハッシュは拡張レジストリ内でも不変です。
- **係数**：`createFactorRegistry` が `factor_id@version` を不変に保持。各版は値（10進文字列）・単位・状態（`SYNTHETIC` / `REFERENCE` / `CONFIG_REQUIRED`）・有効期間・出典・`supersedes` を持ちます。`resolveFactor` は活動期間**全体**を覆う版がちょうど1つ（同一期間の訂正版は置換元を除外）のときだけ解決し、期間が2つの版にまたがる場合・未知・曖昧な場合は fail closed。**実行されるのは `SYNTHETIC` のみ**で、`AG005-EF@UNKNOWN` は「係数を発明しない」ことの明示的な記録です。
- **証憑**：差分適用のたびに、内容ハッシュまたはメタデータが変わった証憑へ改訂エントリ（`revision` / `supersedes` / `change_hash`）を連結。置換前のレコードハッシュは `history` に残ります。
- **スコープ台帳**：第2節。

## 6. 影響解析と差分再計算

`eiApplyChange(state, change, ctx)` は新しい状態と差分を返し、渡された状態は変更しません（未変更のClaimは構造共有）。

1. 変更の種類から**調べるClaim**を決める（Claim ID、圃場ID、Packキー、係数の解決結果）。
2. そのClaimを再計画し、各導出ノードについて「演算・引数・依存値ハッシュ列」が前の状態と同じなら値を**再利用**。
3. 再計算したノードの値ハッシュが前と同じなら、その下流は再利用される（**早期打ち切り**）。
4. レコードの `semantic_hash`（検証意味論のみのハッシュ）で分類する。

| 分類 | 意味 | 再検証 |
| --- | --- | --- |
| `SEMANTIC_CHANGE` | ルール判定・証憑要件・検出事項・使用係数・算定値・状態のいずれかが変化 | 必要 |
| `PROVENANCE_ONLY` | レコードのハッシュは変わるが検証意味論は同じ（出典メタデータ、版の識別子など） | 意味論上は不要。ただし**以前の人間判断は使えない** |
| `NO_OP` | 何も変わらない | 不要 |

対応する変更：`methodology` / `evidence` / `evidence_add` / `evidence_withdraw` / `parameter` / `field` / `activity` / `factor_registry`。これ以外（説明文を含む）は `EI_UNSUPPORTED_CHANGE_TYPE`。Claim・圃場の識別子を書き換えるパッチと、プロトタイプ汚染キーは既存と同様に拒否します。

**正しさの根拠と限界**：差分適用の結果は、(a) 変更後の入力から作り直した状態と全ノードのハッシュで一致し、(b) 既存 `compileEvidence` の結果とも一致することを、614件の反例行列・60ステップの擬似乱数変更列・各変更種別で検査しています。これは**試験した範囲での一致**であり、任意の制度方法論に対する健全性の証明ではありません。`eiVerifyState` はいつでも全再構築と突合できます。

集計は有理数で保持するため、「旧寄与を引いて新寄与を足す」更新が全再計算と厳密に一致します（浮動小数点では保証できません）。

## 7. 決定論的算定エンジンと説明の厳密な分離

### 7.1 算定

- 入力は10進文字列または数値（数値は最短往復表現の文字列として読む）を BigInt の有理数に変換。加減乗除・最小・最大・符号反転・丸めのみ。
- 丸めは仕様に**明示**（`HALF_EVEN` / `HALF_UP` / `DOWN` と小数桁）。割り切れない結果を丸めずに出すことは `NON_TERMINATING_RESULT_REQUIRES_ROUNDING` で拒否。
- 単位は指数マップ（例 `{index:1, ha:-1, day:-1}`）。加減は同一単位のみ、宣言した結果単位と合わなければ `UNIT_MISMATCH`。
- 未知の演算・欠損値・負値（明示許可なし）・ゼロ除算・深さや桁数の上限超過は例外を投げず `status: 'ERROR'` で fail closed。
- 既存の `multiply` 仕様は、**パッケージ一致のため浮動小数点の畳み込みをビット単位でそのまま**残し、正確な値を並記します。

出力は `arithmetic_preview` と `exact` だけで、`result` は常に `null` です。

### 7.2 説明境界

```
状態 → 根拠付きレポート → 説明コンテキスト（事実の一覧）→ 説明サイドカー
```

- 一方向です。算定・版管理・エンジン・レポート・監査の各モジュールは説明モジュールを参照しません（テストがソースを静的に検査）。説明モジュールは計算・変更・保存の関数を呼びません。
- 説明は**サイドカー**で、`authoritative: false`、`affects_calculation: false`。レコード・レポート・パッケージのハッシュに含まれず、変更として投入することもできません。
- リポジトリ内蔵の説明器は**固定テンプレート**です（事実1件につき1文）。
- 生成モデルなど境界の外で書かれたドラフトは**信頼しない入力**として `eiValidateExternalExplanation` を通します。全文が実在する事実IDを引用し、文中の数値（全角を含む）が引用した事実に存在し、認証・適格・保証などの語、マークアップ、リンクを含まない場合のみ `ACCEPTED_AS_NON_AUTHORITATIVE`。1件でも違反すれば `REJECTED` で本文を保持しません。

**限界**：検査は語彙的です。「引用と数値が事実に結び付いている」ことは確認しますが、文の意味が正しいことは証明しません。**このリポジトリは生成モデルを呼び出しておらず、AIによる説明生成そのものは未実装・未検証**です。実装・検証したのは境界と検証器です。

## 8. 監査ログ

`src/evidence-intel-audit.js`。エントリ型：`INPUT`（入力のMerkle値、Packハッシュ、証憑のハッシュ、係数の版）、`CALCULATION`（演算、値、正確な結果、計算過程のハッシュ、エンジン版、`result: null`）、`VERIFICATION`（状態、検出事項、レコードハッシュ）、`CHANGE`、`REPORT`、`EXPLANATION`。

- 追記は新しいログを返す純粋関数。**時計を読みません**（時刻は呼び出し側が渡すか `null`）。
- `eiAuditVerify(log)` は全検証。呼び出し側が持つチェックポイントを渡すと、それ以降だけを再ハッシュします（チェックポイント以前の改変は全検証でのみ検出）。
- `eiAuditCrossCheck(log, state)` は、各Claimの最新 `VERIFICATION` が状態のレコードハッシュと一致するかを確認します。

**限界**：ハッシュ連鎖は部分的な改変を検出しますが、署名でも独立した証人でもありません。全コピーを支配する主体は連鎖を作り直せます。既存セッションの監査連鎖（`audit()`）とはまだ結合していません。

## 9. 根拠付きレポート

`eiClaimReport(state, claimId, {locale, intended_use})` は、境界・方法論・係数・証憑・検証・算定の各文に `grounds: [{node, hash}]` を付けます。`eiVerifyReport` は (1) レポートのハッシュ、(2) 各根拠ノードの現在のハッシュ、(3) 根拠のない文が無いこと、(4) 状態からの再生成と一致すること、を確認し、入力が変われば `STALE_OR_TAMPERED` になります。日本語・英語のテンプレートがあります。

## 10. API

`eiApiHandle({method, path, body})` は状態を持たない純粋関数で、同じリクエストには同じレスポンス（`data_hash` つき）を返します。認可エンドポイントではなく**計算インターフェース**です。保存、人間判断、最終確認、登録・発行に相当する操作は存在しません。HTTPアダプタは 127.0.0.1 のみにバインドし、Hostヘッダを検査し、CORSヘッダを出しません。詳細は [APIリファレンス](evidence-intelligence-api.md)。

AGENTS.md の「external APIs を使わない」は外部サービスの呼び出しを禁じる規定と解釈し、本APIは外部呼び出しを一切行わないローカルの読み取り専用計算として実装しました。

## 10.5 セッション統合（`src/evidence-intel-session.js`、2026-11-25追加）

既存の `db`・`saveDB`・役割ガード・監査連鎖を使い、新しい保存先は作りません。

| 操作 | 役割 | 内容 |
| --- | --- | --- |
| `eiSessionCompile(claims, {label, factor_registry})` | operator | ラベルごとに1系譜。同じClaimを2つの現行実行に入れることはできない（他のoperatorのClaimは `ROLE_BLOCKED`） |
| `eiSessionApplyChange(runId, change)` | 所有者のoperator | 現行実行にのみ適用し、`supersedes` で連結した後継実行を追加する。旧実行・旧判断・旧最終確認は履歴として残る |
| `eiSessionApprovePack(key, note)` | maintainer | 拡張Packの研究用リリース。既存の `pack_releases` と `validRelease` をそのまま使い、公式採用状況は変えない |
| `eiSessionDecide(runId, claimId, code, decision, reason)` | reviewer | `HUMAN_REVIEW_REQUIRED` の例外1件ずつ。実行ハッシュとレコードハッシュに束縛する |
| `eiSessionAttest(runId, claimId, note, ack)` | reviewer | 阻害要因が無く、判断事項が全て `ACCEPT` で、Packがリリース済みのときだけ。根拠付きレポートを含む不変の研究パッケージを作る |
| `eiSessionExport(runId, claimId, attested)` | 所有者またはreviewer | 最終確認済みの出力は、完全性・現行性・リリース・レポートの根拠を毎回再検証する |
| `eiSessionAnchor(runId)` | reviewer | 最終確認済みパッケージを含む実行だけを対象に、来歴アンカーを `NOT_SUBMITTED` で記録し、直前のアンカーに連結する |
| `eiSessionSummary` / `eiSessionVerifyAnchors` | 所有者またはreviewer | 読み取りのみ |

- **保存するのは入力とハッシュだけ**です。読み取りのたびに入力からエンジン状態を作り直し、保存したダイジェスト・レコードハッシュ・エンジン監査ログの先頭ハッシュと照合します。長期の完全性キャッシュは持ちません。
- 保存するレコードは、それぞれ封印したうえで既存の `audit()` の監査イベント（`ei_run` / `ei_decision` / `ei_attested` / `ei_anchor` / `pack_release`）に結び付けます。
- **保存に失敗した場合**は、操作前の `db` に戻します（実行も監査イベントも残りません）。
- **旧スナップショット**：4つの配列（`ei_runs` / `ei_decisions` / `ei_attestations` / `ei_anchors`）が無い旧データもそのまま読めます。配列は初回使用時に作ります。
- **検証**：`tests/evidence-intel-session.test.js` に90アサーションがあります。主要な検査17箇所を1つずつ外す変異テストでは、全てがテストの失敗として検出されることを確認しました。過程で、冗長な所有者チェックと系譜の重複検査を削除し、保存失敗・束縛は正しいが内容が古い記録・系譜の分岐のテストを追加しました。

## 11. 互換性（破壊的変更の回避）

- 既存の `src/*.js`・テスト・フィクスチャ・レポート・ワークフローは**変更していません**（追加のみ。`tests/run.sh` に実行行を追加）。
- 既存Packの同一性、既存パッケージのハッシュ、既存1,165アサーションはそのままです。
- 拡張機能（係数参照、10進文字列パラメータ、式による算定）を使うPackを既存コンパイラに渡すと `UNSUPPORTED` で止まります（テスト済み）。
- 人間の例外判断・Pack承認・最終確認は既存セッション層のまま。エンジンのレコードは「判断前」の評価であり、`human_review: 'NOT_IN_ENGINE_SCOPE'` と明記します。

## 12. 次のPR計画

[実装状況と次のPR](../.github/ISSUES_BACKLOG.md#evidence-intelligence-次のpr計画) を参照。
