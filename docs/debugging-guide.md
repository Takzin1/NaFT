# デバッグガイド

## 基本ループ

```bash
bash tests/run.sh                       # 構文 + 46項目
python3 tests/extract-app-js.py         # JSだけ抽出 (tests/_app.js)
node --check tests/_app.js              # 構文エラーの位置特定
node tests/smoke.test.js                # 失敗アサーションの特定
```

ブラウザでは DevTools コンソールで `db` / `S` を直接確認できます（グローバル変数）。

## 状態の全体像

- `db` … 全データ（12コレクション）。`saveDB()` で永続化、`resetDB()` で初期化。
- `S` … UI状態 `{user, modal, toast, mf(検索フィルタ), ob(オンボーディング), rwTab, adminRegion}`。
- 画面 = `render()` が `route()` の返すHTML文字列を `#root` に流し込むだけ。**表示がおかしい時は該当 `pg*()` 関数の戻り値を疑う**。

## よくある症状と原因

| 症状 | 原因と対処 |
|---|---|
| 画面が真っ白/「エラーが発生しました」 | `pg*()` 内の例外。`render()` がcatchしてメッセージ表示。node側で同関数を直接呼んで再現 |
| 入力中に文字が消える | `render()` の全再描画。入力中の再描画を発生させない（送信時読取が原則） |
| ボタンが反応しない | onclick内の関数がグローバルにない/引用符崩れ。onclick属性へは英数字IDのみ埋め込む |
| データが保存されない | `saveDB()` 忘れ、または非Artifact環境（メモリフォールバック=リロードで消えるのは仕様） |
| QRが表示されない | CDN未読込。`.qr-target` はコード文字列表示へフォールバックする（仕様） |
| テストで `db is not defined` | require()で読み込んでいる。`vm.runInThisContext` を使う（tests/smoke.test.js参照） |
| 支援できない | 仕様上のガード: 未承認/停止中プロジェクト、残高不足、市民ロール以外 |

## デバッグ用スニペット（ブラウザコンソール）

```js
db.transactions.slice(0,5)                       // 直近の台帳
db.audit_logs.slice(0,5)                         // 直近の監査ログ
db.projects.map(p=>[p.id,p.review_status])       // 審査状態一覧
S.user                                            // ログイン中ユーザー
await resetDB(); location.hash='#/'; location.reload?.()  // 初期化
```

## 新規バグ報告の書式

再現手順（ロール/画面/操作）→ 期待/実際 → `db`関連スナップショット → 追加すべきsmoke アサーション案。ISSUES_BACKLOGの書式に合わせる。
