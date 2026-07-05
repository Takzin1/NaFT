# セキュリティチェックリスト

## 1. 公開前スキャン結果（2026-07 実施・現リポジトリ）

| 検査項目 | 結果 |
|---|---|
| `fetch(` / `axios` / XHR 等のネットワーク呼び出し | **なし**（アプリはネットワーク通信ゼロ） |
| `Supabase / Firebase / OpenAI / Anthropic / Alchemy / Infura / WalletConnect` SDK・エンドポイント | **なし** |
| `apiKey / api_key / Bearer / access_token / client_secret / private key` 等の秘密情報 | **なし** |
| `localStorage / sessionStorage / IndexedDB` | **不使用**（window.storage + メモリフォールバックのみ） |
| 外部リソース参照 | qrcodejs 1.0.0（cdnjs）の`<script>`1件のみ（失敗時フォールバックあり） |
| `.env` / 認証情報ファイル | 存在しない |

再実行コマンド:
```bash
grep -rniE 'axios|supabase|firebase|openai|anthropic|alchemy|infura|walletconnect|bearer|api[_-]?key|private[_ -]?key|client_secret|access_token|fetch\(' --include='*.html' --include='*.sol' .
```

## 2. 実装済みの対策

- ユーザー入力の描画は `esc()`（HTMLエスケープ）を経由
- 監査ログ削除UIなし／台帳は追記のみ（`unshift`）
- パスワードは平文保存せずハッシュ化（※デモ用djb2。known-limitations参照）
- 大口取引（50,000pt以上）の自動ハイライトとアラート

## 3. 継続チェックリスト（PR毎 / docs/pr-checklist.md と連動）

- [ ] 新規の外部通信・CDN・SDKを追加していない（追加する場合はREADMEとこの文書を更新）
- [ ] 秘密情報・APIキー・ウォレット秘密鍵をコミットしていない
- [ ] ユーザー入力を `esc()` なしで `innerHTML` に混ぜていない
- [ ] `addTx()` / `audit()` を迂回する価値移動・管理操作を追加していない
- [ ] `DISCLAIMER` の表示箇所を削除・弱体化していない
- [ ] onclick属性内に埋め込む値がエスケープ済み・引用符安全である

## 4. 本番移行時の必須対応（未実装）

サーバー側での認可強制（RLS）／Argon2id等によるパスワード保護／セッショントークン＋失効／CSP・SRI（CDN完全性検証）／レート制限／証憑ファイルのウイルススキャンとハッシュ保全／依存パッケージのSCA（脆弱性監査）
