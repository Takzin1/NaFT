# NaFT — Version-aware MRV Evidence Infrastructure

**NaFT transforms heterogeneous environmental evidence into methodology-aware, reproducible, human-reviewable MRV packages.**

異なる環境証憑を、方法論の版と結び付けて評価・追跡し、人間が確認できるMRVパッケージへ変換する研究開発プロトタイプです。

- **実装済み**：AG-005参照Rule Packの版・hash固定、実ファイルSHA-256 Manifest、Program → Farmer → Field → Activity、決定論的チェック／算術、証憑競合・日付・重複検知、例外判断、最終宣誓、監査チェーン、再現可能なMonitoring Package JSON、Program集計。
- **人間の役割**：Human-on-the-exception + Human-at-the-attestation。通常案件は途中承認不要。Rule Packのrelease approvalはPack単位で一度、最終宣誓はパッケージ単位で一度です。
- **未解決**：AG-005の正式採択版・適用係数は未確認。`CONFIG REQUIRED`を維持し、正式削減量`result`は常に`null`です。参照Packは1件のみ。原本の解析・保管、外部検証機関の受入れ、本番認証・複数利用者の同時更新は未実装です。

内部PASS・Pack承認・最終宣誓は正式な環境認証ではありません。外部登録簿への接続はありません。

## 起動・検証

`index.html`または`naft-app.html`をブラウザで開いてください。ビルド・依存パッケージ・外部CDNは不要です。JS本体は`src/mrv-core.js`と`src/mrv-ui.js`です。

```bash
bash tests/run.sh
```

Node.js 20+を使用します。**182 assertions passed / 0 failed**（加えて静的参照・構文・セキュリティ検査）。Node DOM stubの検証であり、実ブラウザ検証とは区別しています。

## 6画面

| Hash route | 責務 |
|---|---|
| `#/methodologies` | Rule Packの版・出典・hash・人間によるprototype release approval |
| `#/evidence` | 活動登録、実バイトhash、Manifest、原本再照合、10件ページ送り |
| `#/readiness` | 決定論的評価、Calculation Assist、自動パッケージ下書き |
| `#/exceptions` | blocking例外と判断を要する証憑競合の分離 |
| `#/review` | 制約を明示した最終パッケージ宣誓 |
| `#/packages` | 再現可能なJSON、Program集計、明示的監査検証 |

表示順：Methodology → Evidence → Evaluation → Exception → Human Review → Monitoring Package。

画面上のDemo actorはOperator / Reviewer / Pack maintainerだけです。本人認証を行う仕組みではありません。[操作手順](docs/demo-script.md)を参照してください。

## データと再現性

専用の`naft_mrv_core_v1`名前空間を使用し、別系統の保存データを自動移行しません。通常ブラウザではメモリ内のみでリロードすると初期化されます。Artifactの`window.storage`がある場合はアダプタ経由で保存します。外部APIは使用しません。

同一の保存済み評価・例外判断から同じcanonical JSONを生成します。宣誓済みパッケージは固定した文書とhashを保存し、無関係な監査イベントで内容が変わりません。export時には現在の入力・評価・監査チェーンを再検査します。独立した新規セッション間でID・作成日時まで一致するという意味ではありません。

## 設計資料

[Architecture](docs/architecture.md) · [Data model](docs/data-model.md) · [Human boundaries](docs/human-in-the-loop.md) · [Known limitations](docs/known-limitations.md) · [Test report](docs/test-report.md) · [研究問い](docs/mitou-advanced-concept.md) · [Rule Packの範囲](docs/primary-industry-mrv.md)

[MIT License](LICENSE)
