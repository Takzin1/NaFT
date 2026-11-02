# NaFT P6｜原著ファイル実SHA固定と条項単位の研究証拠台帳（2026-11-02）

> 既存研究台帳とユーザー提供**原文コピー3ファイルの実バイトSHA-256**を照合した結果を固定。研究用。正式採択・現行最新規則・利用許諾・発行者認証・削減量認証を保証しない。

## 実ファイル検証（開発者のローカル作業環境）

| 出典 | 形式／ページ | 実バイト | SHA-256 |
|---|---:|---:|---|
| Verra VM0051 v1.1, 2026-07-14 `方法論2026(1).pdf` | PDF 90ページ | 1,335,524 | `9b9738840824f5919e3a76f8807c68743ae3d64b5d931cda27598f3ab32c64e2` |
| Gold Standard `シナリオ3類型(1).pdf` | PDF 2ページ | 100,924 | `77519262ddf83e00a3dd04f89be7cef46a79f534c50496f1c770325e5f1ef461` |
| Gold Standard AWD Validation Checklist v1.0 `チェックリスト(1).docx` | DOCX 38ページ相当 | 276,403 | `532ec2c31daf95d911367b2516a5e0c67d17ba47031457c89d9d55844217478a` |

3つのSHA値は既存 `research/rice-methodology-routing/source-formula-register.json` の記録と全て一致した。この値は**以前の研究用ファイルコピーの同一性**の証拠で、出版社署名、公式配信元の当日取得や正式現行版認証の証拠ではない。

**原著のファイル本体を公開GitHubにはコミットしない。** 出版社のライセンス・再配布権を確認していないため。ユーザーが権利上問題なく取得できるファイルをローカルに保持し、以下の方法でバイト照合する。

## 現物から抽出した重要な調査事項

1. **VM0051 §4, pp.9-10**: 灌漑可能な稲作と適用条件、土壌炭素投入量を実質的に減らす活動の除外。SOC増加のクレジット化はVM0051に含めない。
2. **VM0051 §8.1, Table 3, pp.18-21**: QA1（モデル）・QA2（直接測定）・QA3（排出係数）は温室効果ガスの発生源別に適用範囲が異なる。メタン酸化菌・バイオ炭等は特定条件でQA2を要する。手法の別制度流用を禁止する。
3. **VM0051 §8.5-8.6, pp.38-40**: CH4だけでなくN2O/CO2、漏出・付随排出・不確実性を区別。15%控除等は条件付きであり全案件に一律適用しない。
4. **VM0051 §9.3.1-9.3.3, pp.69-72**: 監視、電子アーカイブ、独立QA/QC、専門家の層別営農管理策、VVBによる不遵守是正。
5. **VM0051 Appendix 2, pp.79-81**: QA2直接チャンバー法の層別基準/事業測定地点・反復数・時間・ラボ校正等を原著記載の証憑チェック対象とする。**過去の観測データを勝手に合格扱いしない**。
6. **VM0051 Appendix 4, pp.85-87**: DMRVのRS空間/時間分解能、雲・反射率補正、MLの特徴量の説明、独立ground truth・VVB spot checksの再現性。
7. **GS Training Exercise Scenarios, pp.1-2**: 3つの研修シナリオにある面積・係数・排出量は**教育用の設問値**。Verraの正式係数や実農地排出量へ混入させない。
8. **GS AWD Checklist v1.0, pp.1-4**: 2024年版検証チェックリストのVVB向け証憑参照、CAR/CL/FAR、対象方式・施設・訓練等を調査。**2025年12月のGS SOC更新や現行採択制度の代替とはしない。**

研究台帳の全15項目には出典ID、原著ページ範囲、条項位置、必要証憑、P5リンク（必要な部分だけ）、採択・算定・認証の未確認フラグを登録。

## 機械的な整合性検査

- `research/method-governance/p6-user-supplied-original-source-register-2026-11-02.json`: 検証した実SHA-256・正規化された原著主張15件と必要証憑36区分。
- `scripts/p6-local-original-evidence.mjs`: P5条項グラフと既存GS/Verra出典台帳を突合し、出典・ページ・研究用主張・制度間の混用・証憑カバレッジを検査する。レシート再実行照合に対応。
- `tests/p6-local-original-evidence.test.mjs`: DOIや発行元認証を勝手に装う資料、ページ範囲外、版不一致、偽のQC・認証量、他制度/異なる教材への混用を拒否する回帰テスト。

ユーザーが**手元に保管した元ファイル**の任意再チェック：

```bash
node scripts/p6-local-original-evidence.mjs verify-original \
  VERRA_VM0051_2026 '/path/to/方法論2026(1).pdf'

node scripts/p6-local-original-evidence.mjs generate \
  fixtures/p6-verra-original-evidence-review-request.json > /tmp/p6-review.json
node scripts/p6-local-original-evidence.mjs verify \
  fixtures/p6-verra-original-evidence-review-request.json /tmp/p6-review.json

node scripts/p6-local-original-evidence.mjs markdown \
  fixtures/p6-verra-original-evidence-review-request.json

node tests/p6-local-original-evidence.test.mjs
bash tests/run.sh
```

CIには再配布できない原著の生バイトを投入していないため、CIの本体は**過去に独立取得した手元コピーのSHA固定値と既存レジストリの整合性・誤認を防ぐテスト**。原著の生バイトの再照合は `verify-original` を元ファイルのある環境で実行する必要がある。

## P7で実証すべきこと

- VM0051 Appendix 2に従った直接測定・サンプルID・層別性・時刻・校正・検出限界などを**現地の元データ**と結び付ける。
- GIS/RS・MLを使うなら公開/ライセンス確認、サンプリング・雲遮蔽・時間分解能の実測点検と独立holdoutによる誤差校正。
- P5条項依存グラフを圃場ID・元データ・方法論版へ結び付け、実際にその原文に対応するルールが変更された時だけ独立再演算を走らせる。
- 旧GSチェックリスト・教育用例・Verraの制度ルールを統合数値に混ぜない。J-Credit AG-005の正式版・施行条件は別の公式原本で確定する。

**現段階では正式なtCO2e、農家データに基づく削減量、クレジット発行はいずれも未実施・null。**
