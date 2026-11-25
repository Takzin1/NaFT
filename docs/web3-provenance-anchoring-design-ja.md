# Web3 来歴アンカー 設計書（取引しない記録）

Evidence Intelligence 層の評価結果を、ブロックチェーンに**記録できる形**にまとめる機能の設計です。実装は `src/evidence-intel-anchor.js` です。**トークンの発行・移転・売買、価値の移転、数量の表示はいずれも行いません。**

関連：[Web3トークン取引の法務論点整理](web3-token-legal-issues-ja.md) ／ [Evidence Intelligence 設計書](evidence-intelligence-design-ja.md) ／ [既知の制約](known-limitations.md)

## 1. なぜ「取引可能トークン」ではなく「来歴アンカー」か

| 前提 | 結果 |
| --- | --- |
| `LICENSE` と `AGENTS.md` は、法務確認なしの交換可能トークン・決済・認証済みクレジット取引の実装を禁じている | 境界は変更しない |
| NaFTの算定結果は設計上 `result: null`（認証済み削減量ではない） | トークンが表すべき権利・数量が存在しない |
| 取引可能トークンには、暗号資産・セキュリティトークン・クレジット二重計上などの法務・制度論点がある | [法務論点整理](web3-token-legal-issues-ja.md)に分離して整理する |

改ざん検出に役立つのは、**ある時点にどのバイト列が存在したか**を外部の台帳に残すことです。これは価値を持たない記録で足ります。

## 2. 何を記録するか

`eiAnchorPayload(state, options)` は次の要素を持つ `naft-provenance-anchor-1` を返します。

| フィールド | 内容 |
| --- | --- |
| `claims.root` / `claims.count` | 全Claimの `{claim_id, pack_key, record_hash, semantic_hash, status}` を葉にしたMerkle根と件数 |
| `state_digest` | エンジン状態全体のダイジェスト（全ノードのハッシュと集計） |
| `factor_registry_hash` | 使用した係数レジストリ |
| `audit`（任意） | 型付き監査ログの先頭ハッシュと件数。ログが正当で、状態と突合できる場合だけ受け付ける |
| `reports`（任意） | 検証済みの根拠付きレポートのハッシュのMerkle根と件数 |
| `previous_anchor_hash` | 直前のアンカー（最初は `null`）。アンカーはハッシュで連結される |
| `boundary` | 固定値。`transferable: false`、`value_bearing: false`、`represents_quantity: false`、`token: null`、`formal_certification: false`、`certified_result: null`、`carbon_credit_issued: false` |
| `anchor_hash` | 上記全体の SHA-256 |

アンカーに含まれる数値は**件数だけ**です。算定プレビュー、合計値、残高、価格、保有者、移転先は含めません（テストで構造を検査）。

### Merkle木

- 葉は `SHA-256("naft-merkle-leaf:" + 葉ハッシュ)`、節は `SHA-256("naft-merkle-node:" + 左 + 右)`。葉と節の領域を分け、節を葉と偽れないようにしています。
- 奇数個の段は最後の要素を**そのまま上げます**（複製しない）。末尾の葉を複製した別の木と根が一致することを防ぐためです。
- `eiAnchorClaimProof` は1件のClaimの包含証明を返します。証明が開示するのは、そのClaimのハッシュと状態だけです。他のClaimの内容は開示しません。

## 3. 既存のテストネット記録との関係

既存の `src/climatechain-demo.js` は、`NaFTMRVAnchor.anchorPackage(bytes32,bytes32,bytes32,bytes32)` 向けの引数を用意し、送信はしない設計です。`src/climatechain-testnet-record.js` は、別リポジトリ（IEEE版）で実施済みのSepolia記録を参照します。`eiAnchorArguments(anchor)` は同じ関数シグネチャで次の4引数を用意します。

| 引数 | 値 |
| --- | --- |
| 1 | `SHA-256("naft-anchor-subject:" + label)` |
| 2 | `anchor_hash` |
| 3 | `factor_registry_hash` |
| 4 | `previous_anchor_hash`（最初は0） |

`value_wei` は常に `"0"`、`chain_status` は常に `NOT_SUBMITTED` です。

**この引数を既存コントラクトに送った場合の挙動は未検証です。** 既存コントラクトの各引数の意味はClaim単位のパッケージ（claim_id_hash, package_hash, methodology_hash, previous_package_hash）なので、ポートフォリオ単位のアンカーを載せるには、コントラクト側の意味づけを決める必要があります（次のPR）。

## 4. 検証

| 関数 | 確かめること |
| --- | --- |
| `eiVerifyAnchorIntegrity(anchor)` | ハッシュの一致、境界フィールドが固定値のままか、未定義フィールド（例：`token_supply`、`owner`）が無いか |
| `eiVerifyAnchor(state, anchor, options)` | 状態からアンカーを作り直して一致するか。入力が変われば `MISMATCH`（来歴だけの変更でも根が変わる） |
| `eiVerifyClaimProof(proof, anchor)` | 1件のClaimがアンカーに含まれるか |
| `eiAnchorChainValid(anchors)` | アンカー列の連結、ラベルが途中で変わらないか |
| `eiVerifyObservedAnchor(anchor, observed)` | 呼び出し側が**自分で読み取って渡した**チェーン上の呼び出し（チェーンID、コントラクト、取引ハッシュ、関数、引数、送金額0）が期待値と一致するか |

`eiVerifyObservedAnchor` はネットワークに接続しません。`MATCH` は「渡された値が一致した」という意味です。取引が実在すること、確定していること、主張が正しいこと、認証されたことは意味しません。この旨を結果の `meaning` に明記しています。

監査ログには `ANCHOR` 型のエントリ（`chain_status: NOT_SUBMITTED`、`transferable: false`）を追記できます。

## 5. 脅威モデルと限界

- **アンカーが証明するのは「そのハッシュが、その時点までに記録された」ことだけ**です。観測データの真実性、方法論への適格性、制度上の受入れ、削減量は証明しません。
- 送信は実装していません。送信には署名用の秘密情報とネットワークが必要です。これは純粋なモジュールの外で、人間の判断を経て行うべき操作であり、`AGENTS.md` の外部API禁止とも関わるため、別途の判断事項とします。
- 包含証明はハッシュと状態を開示します。Claim IDに個人や圃場を特定できる情報を入れないことは、運用側の責任です。
- アンカー列の一貫性は、連結とラベルで検査します。分岐（同じ直前アンカーから2つの後継）はチェーン上の順序でしか解決できません。
- ハッシュはSHA-256です。EVMで検証する場合はSHA-256のプリコンパイルを使う前提で、keccak256には対応していません。

## 6. API

`POST /v1/anchor/payload`、`POST /v1/anchor/proof`、`POST /v1/anchor/verify`。監査ログとレポートは、リクエストに含めず**サーバー側でClaimから作り直します**（`include_audit` / `include_reports`）。リクエストに含めた未定義フィールド（例：`token_supply`）は無視され、アンカーに入りません。転送・発行・売買・ウォレット・署名・送信に当たる経路はありません（テストで経路名を検査）。詳細は [APIリファレンス](evidence-intelligence-api.md)。

## 7. 検証結果

- `tests/evidence-intel-anchor.test.js`：115アサーション。1〜17葉の全包含証明、改ざん・切り詰め・延長・左右入れ替え、奇数段の昇格と領域分離、境界の固定、件数以外の数値が無いこと、変更への感度、連結、呼び出し側の観測との照合、API、静的境界を検査。静的境界とは、ランタイムに transfer / mint / ERC規格 / 取引送信の実装が無いこと、`LICENSE`・`AGENTS.md` の境界が変わっていないこと。
- `tests/evidence-intel-independent-oracle.test.py`：PythonのhashlibがJSと同じMerkle根と `anchor_hash` を再計算できることを確認（13件）。

## 8. 次の段階（別PR、それぞれ判断が必要）

1. **コントラクト側の意味づけ**：ポートフォリオアンカー用の関数またはイベントの定義と、テストネットでの検証。送金不可、所有権なし、移転関数なしをコントラクトの不変条件にする。
2. **送信ツール**：純粋なコアの外に置く。人間の明示的な操作、テストネット限定、秘密情報はリポジトリ外で管理する。送信後の読み戻し検証を行う。`AGENTS.md` の外部API規定の扱いを先に決める必要がある。
3. **セッション統合**：アンカーを既存の監査連鎖・最終確認と結合する。最終確認済みのパッケージだけをアンカー対象にする選択肢も検討する。
