# NaFT Core｜OPM v1.1 × FAIR 研究連携 Ver.0.1

## 対象原典：3つのPDFは2つの研究

1. **The Open Provenance Model Core Specification (v1.1)** — Moreau et al.; [DOI: 10.1016/j.future.2010.07.005](https://doi.org/10.1016/j.future.2010.07.005)。アップロードされた15頁版（2010年7月）と30頁版（2009年12月）は同じ仕様の異なる原稿版。仕様・節・行の相違があるため、別の独立した論文2本とは数えない。
2. **The FAIR Guiding Principles for scientific data management and stewardship** — Wilkinson et al. (2016); [DOI: 10.1038/sdata.2016.18](https://doi.org/10.1038/sdata.2016.18)。F/A/I/Rの15の指針。PDF p.4のBox 2にF1–F4、A1–A2、I1–I3、R1–R1.3が整理されている。

各アップロード原本のSHA-256、版、頁数、再配布の権利が未確認であることは [source registry](../research/literature-2026-11-08/opm-fair-sources.json) に登録。**PDF原本や大部分の本文はPublic Repoに投入しない**。

## OPM v1.1の重要な仕様とNaFT独自グラフ

- OPM v1.1は **Artifact / Process / Agent** の3種類を区別する。5つの因果関係は `used`, `wasGeneratedBy`, `wasControlledBy`, `wasDerivedFrom`, `wasTriggeredBy`。`used` / `wasGeneratedBy` / `wasControlledBy` は役割（role）が必須。
- **OPMの辺は結果（effect）→原因（cause）**。NaFTの内部 `provenance_graph` は **依存元（dependency）→派生物（dependent）**。方向を逆転させずにそのまま同じ意味だと扱うことは禁止。
- `src/opm-fair-interop.js` の `naftOpmCrosswalk` は **新しい読み取り専用の別グラフ** を構築する。各元データや方法論Packのハッシュから入力Artifactを作り、`compileEvidence` を1つの履歴上のProcess、Packageを結果Artifactとして扱う。
- この粗いモデルでは現在の確認済みイベントとして `used` と `wasGeneratedBy` のみ実際に生成。残り3関係は型／方向／role／DAGの検証器で対応するが、証明されていないAgentや個別の生成・審査イベントを**自動捏造しない**。
- 出力に `source_package_hash`、`source_graph_hash`、`crosswalk_hash`、原本と変換後の辺方向を保持する。
- 既存のMethodology Pack、実際の算定値、Compiler Package、ハッシュ、既存の影響解析APIは変更しない。完全なOPM v1.1適合・一般的な因果性を証明したわけではない。

## FAIR原則の自己点検（15項目）

`naftFairPackageMetadata` はPackage情報から記録を作るが、外部で取得していないものを勝手に埋めない：真の永続識別子、検索インデックス、到達可能なメタデータAPI、ライセンス、権利審査、認証制度の採用確認は **null / UNKNOWN** のまま。

`naftFairSelfCheck` は **15原則のメタデータ存在チェック**：`DECLARED_UNVERIFIED` と `MISSING_OR_UNESTABLISHED` の2分類。FAIR適合証明でも成熟度スコアでもない。特に：

- **F1**: `urn:naft:package:sha256:...` は内部識別子であってDOI等の登録済み永続IDではない。
- **A1/A2**: データを公開しなくてもメタデータをアクセス可能にする検討はできる。対象ファイルの機密性に留意。
- **I1/I2**: JSONだけで共有された知識表現／FAIRな統制語彙が成立するわけではない。
- **R1.1**: ライセンス＋権利確認が必要。無料閲覧、OA、アップロードされたPDFであることは再配布許可ではない。
- **R1.2**: NaFTの入力・Pack・Packageハッシュは局所的来歴を表すが、取得元真正性や観測事実の真実性は別。

## 実装で試す

ブラウザーの `naft-app.html` でCompilerのデモ/Runを作ると、**Download OPM/FAIR research receipt** が使用可能。画面に表示されたRunの保存Packageを検証して、`naft-opm-fair-research-receipt.json` を端末へ書き出す。Runが旧Packageを継承している場合、`supersedes` も再計算ハッシュの検証に使う。外部送信・クラウド保存は行わない。

開発用JavaScript（Compilerの依存モジュールを読み込んだ後）：

    const input=syntheticClaim('OPM-FAIR-TEST');
    const pack=COMPILER_REGISTRY['NAFT-SYNTHETIC@1'];
    const pkg=compileEvidence(input,pack);
    const receipt=naftResearchInteropReceipt(pkg,input,pack);
    const result=naftFairSelfCheck(receipt.metadata);

テスト：

    node tests/opm-fair-interop.test.js
    bash tests/run.sh

不正な辺方向、型違い、role欠損、循環依存、原Packageハッシュ不一致、メタデータ不足、架空のライセンス付与、`supersedes` 不一致を検査する。

## 適用範囲と次の段階

- 研究用・合成データを中心にした運用であり、正式なJ-クレジットやBlue Carbonの認証済み排出削減量は **null**。
- 論文2本を追加しただけで、算定値の科学的妥当性、FAIRへの完全準拠、完全なOPM v1.1互換性、外部データ真正性、秘密保持は証明されない。
- Blue Carbon/IEEEに広げる際は、この共通形式への変換を追加する。まず外部Editionが実際に提供するArtifact/Process/Agentの対応を事前定義し、テストした後に接続する。
- Web3のオンチェーン記録は未実施。署名・アクセス権・第三者検証は別の工程。
