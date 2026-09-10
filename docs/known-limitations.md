# 既知の制約（Known Limitations）

PoCとして意図的に許容している制約と、その影響・対応予定です。

## セキュリティ・認証
- **クライアント完結**: 権限チェック・残高検証はすべてブラウザ内。悪意ある利用者はDevToolsで改変可能。→ 本番はサーバー側強制（Next.js API + RLS）が必須。
- **パスワード**: djb2の簡易ハッシュ（デモ用）。ソルトなし・総当たり耐性なし。→ 本番はArgon2id等＋サーバー保管。
- **セッション**: ユーザーIDをストレージに保存するのみ。トークン・有効期限なし。
- **XSS**: ユーザー入力は `esc()` でエスケープしているが、`innerHTML` ベースのため新規コードでのエスケープ漏れが単一障害点。→ pr-checklist の必須確認項目。

## 永続化
- Artifact環境以外では**メモリ内のみ**（リロードで初期化）。
- 単一JSONドキュメント保存のため、同時編集・部分更新・トランザクション分離なし（値上限5MB）。
- 楽観ロック・競合解決なし（シングルユーザーデモ前提）。

## 機能
- Generic IEEE証憑はメタデータのみ。Primary MRVでは実ファイル本文のSHA-256とManifestを記録し再選択照合できるが、ファイル保管・本文解析・真正性確認は行わない。
- IEEE版の検証補助は証憑メタデータとプロジェクト入力を対象にしたローカルルールであり、PDF・画像・表計算の本文解析、OCR、外部方法論データベース照合は行わない。
- `input_fingerprint`、`evidence_set_hash`、環境記録・移転記録はcanonical JSONに対するSHA-256。暗号学的署名、第三者タイムスタンプ、改ざん耐性ストレージではない。
- `environmental_records` はオフチェーンの**候補記録**。正式なカーボンクレジット発行・移転・償却や、ブロックチェーンへの書込みは行わない。
- メール認証・KYC・パスワードリセットなし。
- チケットの期限切れ判定は表示時の遅延評価（バッチなし）。
- CSVダウンロードはブラウザ/サンドボックス制約で失敗する場合あり（コピーで代替可能）。
- QRコードはCDN読込失敗時に文字列表示へフォールバック（照合はコード文字列の手入力）。
- 通知・多言語・アクセシビリティ検証（スクリーンリーダー）は未対応。

## アーキテクチャ
- 単一HTMLファイル。関数は責務分離済みだがモジュール境界は物理分割されていない（docs/architecture.md §5 が分割設計図）。
- `render()` は全画面再構築のため、入力途中の再描画でフォーカス喪失（設計上、送信時読取で回避）。
- 監査ログは地域スコープでのフィルタ未実装（全ロールの管理者に全件表示）。

## スマートコントラクト
- `contracts/` は**未接続の雛形**。コンパイル・テスト・監査未実施。メインネットデプロイ禁止をコメントで明記済み。

## Candidate-unit lifecycle boundary

- Simulation-only issuance, custody transfer and retirement are implemented. They do not issue, settle or retire a carbon credit in any external registry.
- Duplicate prevention matches an exact record or canonical input within one dataset. Changed metadata, partially overlapping projects, differently worded claims and cross-registry duplicates are not detected. Browser reload/reset/import/state tampering can replace this dataset.
- Hashes expose a tamper-evident design direction but are not cryptographic signatures, independently anchored timestamps or a decentralized consensus mechanism. Replacing all data and recomputing all hashes is possible.
- Role buttons simulate identities. Client-side checks cannot provide production authorization, durable uniqueness or multi-client transaction isolation. Save failures may use the existing memory fallback.
- Quantity is the operator's estimate (up to 6 decimals), without independent methodology validation, additionality, leakage, permanence or uncertainty calculations.
- The 20-character ABSTAIN gate requires a documented reason but cannot establish its sufficiency. Full human evidence review remains necessary outside this metadata demo.
- `voided_candidate` is reserved; there is no voiding or unretirement workflow. Retired quantities remain unavailable through all supported operations.
- CarbonMarketplace now inherits OpenZeppelin `ERC1155Holder` to accept ERC1155 safe transfers. This addresses the missing receiver interface by source inspection only. No compiler, testnet deployment or Solidity audit is claimed; all contracts remain a Future testnet extension.
- This environment's Cloud Browser URL policy blocked both localhost and file URLs, so actual browser layout/click verification was not completed. Node smoke tests exercise rendering and the full lifecycle, but do not substitute for browser interaction verification.

## Primary Industry MRV limitations

- AG-005 `3.1-reference` is based on an official public-comment attachment, with adopted/current status unconfirmed. CONFIG REQUIRED is deliberate. The reference check subset, single project crop, operator sustainability declaration and NaFT inventory are not exhaustive J-Credit eligibility. Land changes fail closed.
- Formula arithmetic is implemented; coefficient selection/defaults, applicability, current GWP, methodology exceptions and officially usable reduction calculation are not. Supplied-parameter preview is illustrative; result stays null.
- Monitoring Package is an incomplete reviewed draft. It is not a registered submission, external-verifier-approved report or formal certification. It contains a local audit reference, not a self-contained selective audit proof. CSV/PDF exports are not implemented for this package.
- Evidence originals remain on the user's device. File hashing accepts up to 5 MiB; declared type/year/source may be false. Synthetic generated evidence proves only pipeline behavior. A matching hash does not prove climate activity.
- A local audit anchor detects ordinary alteration/deletion/reordering. Replacement of the full dataset/checkpoint and recomputation of hashes is outside detection. Legacy anchor creation attests current stored bytes only. New methodology actions fail on a broken chain; existing generic actions retain their original behavior.
- Field identity is caller-provided and normalized; no cadastral, GIS or registry reconciliation. Overlap detection is scoped to identical field ID, methodology and activity type in this dataset. Aliases, different methodologies, partial geometry overlap, external datasets and concurrent clients remain outside the guard.
- The Program test covers model aggregation of 100 farmers/500 ha, not live multi-user scale. Names are local grouping labels, not legal identity. Field ownership/area changes and approved-record amendments need workflows not implemented here.
- No live field PoC, third-party verifier acceptance, measured administrative cost reduction or income increase is demonstrated. Browser layout/click verification remains uncompleted under the previously observed browser URL restriction; tests execute generated handlers in a DOM stub.
