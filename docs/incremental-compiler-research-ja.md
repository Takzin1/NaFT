# NaFT Core — 増分計算・変更伝播の研究基盤 v0.1

## 原典と区別する範囲

3つのアップロードされた研究論文を参照し、**PDF原本や図・実装コードはコピーせず**、NaFT独自のソフトウェアとして狭い適用範囲を試験する。

1. Gupta, Mumick & Subrahmanian (1993), *Maintaining Views Incrementally*, SIGMOD extended abstract（アップロード版10頁）。SQL/Datalogでのマテリアライズドビュー更新、非再帰的な代替導出数のカウント、再帰的なDRedを区別。**NaFTでは非再帰の支持カウントだけ実装**。
2. Acar, Blelloch, Blume, Harper & Tangwongsan (2006), *A Library for Self-Adjusting Computation*（DOI [10.1016/j.entcs.2005.11.043](https://doi.org/10.1016/j.entcs.2005.11.043)）。動的依存グラフとメモ化、変化伝播、正しさのための再利用制約。**NaFTではClaim単位の保守的なキャッシュ再利用のみ実装**。SMLのmodifiable referencesや動的呼出し階層を再実装していない。
3. Acar, Blelloch, Blume & Tangwongsan (2006), *An Experimental Analysis of Self-Adjusting Computation*（DOI候補 [10.1145/1133981.1133993](https://doi.org/10.1145/1133981.1133993)）。初回実行のオーバーヘッド、変更伝播の利得、メモリ／GC費用を分けて測る研究。**NaFTでは独立の全件コンパイルを正しさのOracleとして使用**。NaFT固有の高速化率はまだ測定していない。

原本のSHA-256、出典、権利の未確認点: [incremental-foundations.json](../research/literature-2026-11-08/incremental-foundations.json)。公開RepoにPDFを置かない。

## 動くもの

`src/incremental-compiler-research.js` は既存の `mrv-core.js`、`methodology-packs.js`、`mrv-compiler.js` を読み込んだ研究環境で使う **read-onlyな計算スナップショット**。同じClaim ID・入力ハッシュ・方法論Pack ID・Packハッシュが維持された場合に限り、前回のPackageを再利用する。

- 初回は全件 `compileEvidence` を実行。更新時は変更Claim・新規Claim・Pack変更に該当するものを再コンパイルし、削除済みClaimはスナップショットから除去。
- 再利用するスナップショットは自身のハッシュ、Claim/Packageハッシュ、ユニークID、整列を検査する。不整合はFail-closed。これらのハッシュは外部署名ではなく、独立した発行者や観測の真正性を証明しない。
- `compareIncrementalWithFull` は **全件** `compileEvidence` で再実行し、同じ入力のPackageハッシュと比較。Oracleは評価時に明示的に実行するため、常時ONにすると速度最適化の利得はなくなる。
- `incSupportView` と `updateResearchSupports` は、非再帰の架空の導出経路について、代替導出が残れば出力を保持する。**完全なSQL、Datalog、DRed、ネガティブ依存、温室効果ガス制度判定には未対応**。

### 再現コマンド

    node tests/incremental-compiler-research.test.js

または、従来の全回帰テスト：

    npm test

現在のテストでは、40件の合成Claimに対して、変更ゼロ、1件の圃場属性変更、1件の証憑変更、Claimの挿入・削除、Pack係数変更による全件失効、全件Oracleとの一致、偽造・重複・欠損の拒否を検査する。代替導出経路の残存と削除も別途検査。

### 利用方法の例

    const claims = [syntheticClaim('CASE-01'), syntheticClaim('CASE-02')];
    const packs = {'NAFT-SYNTHETIC@1': COMPILER_REGISTRY['NAFT-SYNTHETIC@1']};
    const before = compileIncrementalResearch(claims, packs);
    const modified = claims.map(c => clone(c));
    modified[0].field.area_ha += 1;
    const after = compileIncrementalResearch(modified, packs, before.snapshot);
    const oracle = compareIncrementalWithFull(after.snapshot, modified, packs);
    // oracle.status === 'MATCH'

## 安全境界

- 実測の正しさ・公式方法論への準拠・炭素クレジット発行は **一切保証しない**。研究用の合成検証であり、公式認証済みトン数は null のまま。
- **Claim間の動的依存**がある場合は現在のCacheを使わない。現行Compilerの入力に他のClaimから派生した事実が入るなら、その関係を明示したDependency Graphと失効規則が必要。人間レビュー・権限・監査イベントの変更も、ここではキャッシュキー対象外。正式な判定・証跡処理は従来のセキュアな実行経路を使用する。
- スナップショット内には原データの正規化内容が含まれうる。**Public RepoやWeb3へ自動公開しない**。
- 速度改善、汎用DRed、O(Δ)計算量、完全な自己調整計算を実証したとは主張しない。ベンチマークは別PRで、公平な初期構築費用、差分コスト、検査コスト、メモリ費を計測する。
- 既存のNaFT Compiler、IEEE、Blue Carbon、OPM/FAIRのPackage・認証境界を変更しない。
