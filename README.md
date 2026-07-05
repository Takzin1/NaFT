# NaFT — Natural-Fungible Token（自然代替性トークン）

**市民参加型GXプロトコルのPoC** — 自然保全・脱炭素・地域GX活動への市民参加、貢献の可視化、非換金ポイント／チケット還元、人間による審査（Human-in-the-loop）、取引台帳、監査ログ、地域ダッシュボードを、ひとつのプロトコルとして統合する研究開発プロトタイプです。

> 炭素を、まちで巡る価値に変える。

```
ステータス: PoC / 法務レビュー前の研究開発プロトタイプ（未踏アドバンスト提案準備中）
実決済: なし ｜ 実カーボンクレジット売買: なし ｜ 換金性: なし ｜ Web3: 将来拡張（未接続）
```

---

## ⚠️ 必ずお読みください（本プロジェクトの位置づけ）

> NaFTポイントおよびデモステーブルトークンは、法定通貨・暗号資産・電子決済手段ではありません。本サービスの初期版は、地域GX活動と環境価値の可視化を目的としたPoC・実証実験用のシステムです。実際のカーボンクレジット売買・償却・金融決済は、専門家・提携機関との確認を経て段階的に実装予定です。

| 本PoCが**行うこと** | 本PoCが**行わないこと** |
|---|---|
| 非換金ポイントによる支援の意思の可視化 | 実際の金融取引・資金決済・送金 |
| クレジット**候補**プロジェクトの登録・審査・掲載 | 暗号資産の発行・交換・売買 |
| 購入予約（=意思表示の記録のみ） | 電子決済手段・ステーブルコインの発行 |
| GX還元チケット（炭素配当）の発行・利用の**記録** | 認証済みカーボンクレジットの売買・償却 |
| 取引台帳・監査ログ・ダッシュボード | 金融商品の勧誘・投資助言・利回りの提示 |
| **人間の管理者による審査**（AIは補助のみ） | AIによる承認・付与の自動化 |

詳細: [docs/legal-risk-map.md](docs/legal-risk-map.md) ／ [docs/human-in-the-loop.md](docs/human-in-the-loop.md)

## 🚀 クイックスタート

**1. 動かす** — `naft-app.html` をブラウザで開くだけです（ビルド・サーバー不要）。

**2. デモログイン**（パスワードはすべて `demo1234`、ログイン画面にワンクリックボタンあり）

| メール | ロール | 見どころ |
|---|---|---|
| `citizen@naft.demo` | 市民 | ウォレット／支援→炭素配当チケット発行→QR表示 |
| `producer@naft.demo` | 事業者 | プロジェクト登録（下書き→審査提出） |
| `admin@naft.demo` | 地域管理者 | 証憑確認→承認／差し戻し（Human-in-the-loop審査） |
| `bank@naft.demo` | 地域金融パートナー | 複数地域の切替管理 |
| `merchant@naft.demo` | 加盟店 | チケットQR照合・利用記録 |
| `platform@naft.demo` | 全国管理者 | 全国ダッシュボード・地域登録・異常取引アラート |

**3. テスト実行**（Node 18+ / Python 3、依存パッケージなし）

```bash
bash tests/run.sh   # 構文チェック + スモークテスト46項目
```

ロール別のデモ手順: [docs/demo-script.md](docs/demo-script.md)

## 📦 データ永続化について（重要）

- **localStorage / sessionStorage / IndexedDB は使用していません。**
- Claude.ai の Artifact 環境では `window.storage`（Artifact永続ストレージAPI）にJSONドキュメントとして保存され、セッションをまたいで保持されます。
- 通常のブラウザで直接開いた場合は**メモリ内フォールバック**となり、リロードで初期データに戻ります（デモ用途としては毎回クリーンな状態で始められる仕様）。
- 永続化は `store` アダプタ（`get/set/del` の3メソッド）に隔離されており、ここを差し替えるだけでサーバーDBへ移行できます。→ [docs/architecture.md](docs/architecture.md)

## 🗂 リポジトリ構成

```
naft/
├── naft-app.html            # アプリ本体（単一HTML SPA・全ロール・全フロー実装済み）
├── contracts/               # Solidity雛形3種（テストネット専用・未接続・将来拡張）
├── tests/                   # スモークテスト46項目（Node標準のみで実行可）
├── docs/                    # アーキテクチャ／未踏ADV構想／法務リスクマップ 等
├── skills/                  # Claude Skills（戦略・法務レビュー・保守・未踏応募）
├── AGENTS.md                # AIエージェント（Opus/Sonnet/Codex）向け開発ガイド
└── .github/
    ├── copilot-instructions.md
    └── ISSUES_BACKLOG.md    # 次にAIエージェントで着手できるIssue一覧
```

## 🏗 アーキテクチャ概要

単一HTMLファイル内で、責務を明確なレイヤに分離しています（将来のモジュール分割・Next.js移植を前提とした設計）:

```
[Storage Adapter] → [Constants/Domain定義] → [Seed Data] → [DB Helpers + Ledger]
      → [State + Hash Router] → [Shared UI Components] → [Role別ページ] → [Use-case Actions]
```

- **台帳原則**: すべての価値移動は `addTx()` を通り、取引コード・Web3拡張カラム（`transaction_hash`/`chain_id`/`onchain_status` 等）付きで記録
- **監査原則**: すべての管理操作・審査・付与は `audit()` で監査ログに記録（削除不可）
- **HITL原則**: 承認・却下・チケット利用確定は必ず人間のロールが実行

詳細: [docs/architecture.md](docs/architecture.md) ／ [docs/data-model.md](docs/data-model.md)

## 📚 ドキュメント

| ドキュメント | 内容 |
|---|---|
| [docs/mitou-advanced-concept.md](docs/mitou-advanced-concept.md) | 未踏ADV向け構想（200/400/1000字説明文つき） |
| [docs/architecture.md](docs/architecture.md) | アーキテクチャ・責務分離・移植方針 |
| [docs/data-model.md](docs/data-model.md) | 12コレクションのデータモデルと状態遷移 |
| [docs/legal-risk-map.md](docs/legal-risk-map.md) | 法務リスクマップと表現ガイドライン |
| [docs/human-in-the-loop.md](docs/human-in-the-loop.md) | AI補助×人間審査の設計原則 |
| [docs/demo-script.md](docs/demo-script.md) | ロール別デモシナリオ |
| [docs/test-report.md](docs/test-report.md) | テスト方針と46項目の結果 |
| [docs/roadmap.md](docs/roadmap.md) | 開発ロードマップ（未踏期間の計画含む） |
| [docs/known-limitations.md](docs/known-limitations.md) | 既知の制約 |
| [docs/security-checklist.md](docs/security-checklist.md) | セキュリティチェックリストとスキャン結果 |

## 🤖 AIエージェントでの継続開発

本リポジトリは Claude（Opus/Sonnet）・Codex・GitHub Copilot での継続的なデバッグ・改良を前提に構造化されています。

- 開発規約・ガードレール・タスクレシピ: [AGENTS.md](AGENTS.md)
- Copilot向け: [.github/copilot-instructions.md](.github/copilot-instructions.md)
- モデル別の役割分担: [docs/ai-agent-roles.md](docs/ai-agent-roles.md)
- デバッグ手順: [docs/debugging-guide.md](docs/debugging-guide.md)
- 着手可能なIssue: [.github/ISSUES_BACKLOG.md](.github/ISSUES_BACKLOG.md)

## ライセンス

[MIT License](LICENSE)（PoC成果物としての提供。§⚠️の位置づけに関する記載はライセンスに優先して常に維持してください）
