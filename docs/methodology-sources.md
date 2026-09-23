# Methodology source verification — 2026-09-20

| Source | Retrieval and implementation boundary |
|---|---|
| [AG-005 public-comment reference PDF](https://public-comment.e-gov.go.jp/pcm/download?seqNo=0000281460) | HTTP 200, 384,171 bytes; document title identifies Ver.3.1. SHA-256 `f861e4af40f3fa1fb3a0b54327cd7720f6e5028ae99455bf39274f97140a2050` |
| [Official methodology index](https://japancredit.go.jp/about/methodology/) | HTTP 403 for full body during this work; latest adopted version not established |
| [AG-005 official PDF endpoint](https://japancredit.go.jp/pdf/methodology/AG-005.pdf) | HTTP 403; no new confirmed version created |
| AG-004 Ver.2.4 | 2026-09-23時点の研究状況では原文を確認済み。ただし原文byte snapshot / SHA-256を本repositoryへ固定しておらず、Executable Packへの翻訳も未実装。Compilerは`AG-004@UNKNOWN` / `UNSUPPORTED`のfail-closed placeholderを維持 |

The existing AG-005 3.1-reference object is retained. The separate Compiler Pack binds the retrieved source hash and marks official adoption, effective dates, coefficients and complete rule translation unresolved. The reference PDF describes the two-year baseline and seven-day extension (section 1, pp.1–2); mapping those fragments does not establish complete eligibility. No later version number, official transition, factor or evidence requirement was inferred.

AG-004については、その後の研究でVer.2.4原文を確認した。ただし「原文を確認した」ことと「NaFTが制度対応した」ことは別である。現時点ではExecutable Pack、制度条件の完全翻訳、Pack hash固定、計算実装は行っていないため、Compiler上は`AG-004@UNKNOWN` / `UNSUPPORTED`のfail-closed placeholderを維持する。AG-004特有の条件依存・循環的評価構造は今後の研究対象であり、正式対応済みとは表現しない。既存placeholderの`source_checked_at=UNKNOWN` / `source_attempted_at=2026-09-20`は、repository上のExecutable Packに原文検証結果を取り込んでいないことを示す。

NAFT-SYNTHETIC 1/2 are invented engineering protocols under a separate methodology ID. Their source hash covers canonical Pack JSON without source_hash, as indicated by source_hash_scope. Dates, coefficients and evidence categories are synthetic. The version-2 additional intensive-only rule/parameter/evidence requirement and conditional judgement exception are not AG-005 policy claims. They demonstrate the mechanics without fabricating institutional changes.

## 2026-09-21 repair re-check boundary

The requested AG-005 v3.5 re-check could not be completed against a non-GitHub primary source in this repair environment. No repository copy of the v3.5 original bytes or independently verified SHA-256 was available. Therefore NaFT does **not** register `AG-005@3.5`, does not claim its publication/effective status, and does not infer any v3.1→v3.5 institutional rule delta. The existing `AG-005@3.1-reference` remains unchanged. This is a merge-blocking source-verification limitation, not evidence that v3.5 does not exist.
