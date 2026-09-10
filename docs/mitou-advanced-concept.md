# NaFT — Primary Industry MRV Infrastructure

提案者：弓田隆仁 / Takahito Yumita

**一次産業の環境活動を第三者検証可能なデータへ変換するMRV基盤**

社会インパクトの仮説は「一次産業の環境価値を新しい所得へ接続する」。現在の実装は、その手前にある証憑整理・方法論対応・審査準備のPrototypeである。制度上の認証、所得増加、第三者検証への受入れは実証していない。未踏アドバンスト2026年度下期向けの技術構想として整理し、公募資格・日程への適合判定は含めない。

## 課題と役割

中干し、バイオ炭などの環境活動があっても、写真、営農記録、面積情報、算定根拠が別々に保管され、不足資料や説明の手戻りが発生する。小規模農家を束ねる運営者にも、圃場ごとの確認と証憑管理が積み上がる。これらの負担が所得への接続を妨げる、という仮説を実証対象にする。

NaFTは環境価値を作るサービスではない。環境活動のEvidenceを、制度が受け取れる検証可能なデータに変換する取引コストの低減を目指す。市場取引、Tokenomics、市民ポイントを研究の中心に置かない。

## 技術上の問い

| 課題 | 本研究で問うこと |
|---|---|
| Heterogeneous / incomplete evidence | 異なる形式の証憑を来歴を失わず束ね、不足を説明できるか。 |
| Methodology-aware rules | 条件・証憑要件・例外・版変更を、再現可能なルールとして表現できるか。 |
| Deterministic calculation | 入力、係数出典、式、ルール版の組合せから同じ計算を再現できるか。 |
| Human-in-the-loop | 機械の判定不能と人間の承認責任を分離し、手戻りを減らせるか。 |
| Provenance / audit | Evidence・検査・人間判断・候補記録を結び、変更の検知範囲を説明できるか。 |
| Field/activity identity | 別名・地番変更・重複期間を含む同一活動をどこまで識別できるか。 |
| Program aggregation | 複数農家・複数圃場の審査準備を、権限と欠損情報を保って集約できるか。 |
| Verifier-ready package | 検証者が受け入れられる項目・証憑・補正履歴の形を共同設計できるか。 |

## 応募前に実装した範囲

- Generic IEEE MRV：Evidence → 決定論的Readiness → 人間審査 → 候補環境記録 → Demo Unit発行・移転・償却 → ローカル重複防止。
- AG-005参照版Rule Pack：期間・延長日数・圃場情報・証憑カテゴリの構造化検査。最終採択版と適用係数が確定できないためCONFIG REQUIRED。制度適合の完全実装ではない。
- 実ファイル本文のSHA-256、Evidence Manifest、再選択による改変検査。ファイル保管・OCR・真正性検証は含まない。
- 圃場×方法論×作期×活動×期間のidentity、同一IDの重複・期間重複防止。
- 算定式、入力、版、欠損パラメータを保存するCalculation Assist。係数の任意入力に対する算術previewを分離し、制度上の削減量resultはnull。
- 既存監査ログを保全した移行、SHA-256監査チェーン、VALID/BROKEN検証。
- 人間承認後のcandidate recordとMonitoring Package JSON。出力は未完了事項を残すreviewed draft。
- Program / Farmers / Fields / Activities / Evidence / Candidate Records。100農家・500haのデータモデル集約を自動テスト。

実装・参照元・再現手順は [primary-industry-mrv.md](primary-industry-mrv.md)、テスト結果は [test-report.md](test-report.md) に記載する。

## 未踏期間の研究開発差分

| 研究開発 | 応募前との差分・検証成果物 |
|---|---|
| AG-004等の複数方法論 | AG-005専用コードから、版管理されたrule DSL/configurationと共通評価器へ。専門家と係数・例外の適合性を確認。 |
| Provenance graph | 線形snapshotから証憑・導出・修正・判断の依存グラフへ。影響を受ける審査の再評価を比較検証。 |
| Secure evidence storage | ローカルに保管しない試作から、権限・保存期間・原本保全・外部anchorを備える保管系へ。 |
| Server authorization / multi-tenant | ブラウザロールからサーバー側認可、テナント分離、競合時の一意性とトランザクションへ。 |
| Large program aggregation | モデル上の100農家から、多人数同時作業、異なる欠損状態、訂正履歴を含む集約へ。 |
| External verifier interface | 独自JSON draftから、実際の検証者と合意した受渡し・補正プロトコルへ。 |
| Registry adapter | 未接続から、制度・運営者の合意と認可を前提とする接続仕様の研究へ。実発行を前提にしない。 |
| Cross-project duplicate detection | 同じローカル圃場IDから、別名・空間・活動期間・方法論の関係を考慮した照合へ。誤検知も測定。 |
| Quantitative evaluation / real PoC | 合成データテストから、同意を得た現場記録と検証者による比較実験へ。 |

これらは現時点の完成機能として記載しない。外部AIは導入しておらず、自動認証は開発目標に含めない。Web3は必要性を評価する将来adapterの一候補に留める。

## 評価KPIと測定計画

数値目標・削減率は未設定。現場の基準値と測定可能性を確かめてから設定する。

| KPI | 測定定義 |
|---|---|
| Evidence completeness detection accuracy | 専門家が正解を付けた証憑要件ごとの充足/不足判定との一致率。対象版と例外を記録。 |
| Missing Evidence precision / recall | 不足検出の適合率・再現率。判定不能を別集計し、見逃しを隠さない。 |
| Calculation reproducibility | 同一入力・係数・ルール版での再計算一致率。丸め規約と環境差を記録。 |
| Human review time | 審査開始から判断までの実作業時間。経験・案件難度を揃えて比較。 |
| Monitoring Package preparation time | 証憑収集後から受渡し可能な資料作成までの実作業時間。 |
| Rework rate | 一次レビュー後に補正が必要になった案件数 / 対象案件数。 |
| Duplicate detection rate | 正解付き重複集合での検出率。非重複の誤BLOCK率も併記。 |
| Audit chain verification rate | 未改変データの検証成功率と、改変種別ごとの検知率を別々に測る。 |
| Third-party verifier correction count | 検証者による追加要求・修正指摘数。重大度と理由を分類。 |
| MRV administrative time per field | 圃場ごとの収集・入力・算定補助・審査準備の累積工数。 |
| MRV administrative cost per hectare | 作業工数×明示した労務単価＋対象管理費を面積で除す。制度認証費用とは分離。 |

単体テストのPASSを、現場精度・所得効果・検証者受入れの達成値に読み替えない。実証は農家・運営者・検証者との協力合意、個人情報の扱い、評価用データの使用同意が前提となる。

## 各用途への共通Core

IEEEでは人間判断を含む監査可能なlifecycleを示す。埼玉では地域運営者が圃場を束ねる実務と事業仮説を、INACOMEでは農山漁村の環境活動を所得へ接続するための事務負担低減を示す。未踏ではこの共通Coreを方法論・証憑・主体の違いに耐えるMRV基盤へ発展させる技術課題を示す。事業性や採択可能性は実装だけでは実証されない。
