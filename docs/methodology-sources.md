# Methodology source verification — 2026-09-20

| Source | Retrieval and implementation boundary |
|---|---|
| [AG-005 public-comment reference PDF](https://public-comment.e-gov.go.jp/pcm/download?seqNo=0000281460) | HTTP 200, 384,171 bytes; document title identifies Ver.3.1. SHA-256 `f861e4af40f3fa1fb3a0b54327cd7720f6e5028ae99455bf39274f97140a2050` |
| [Official methodology index](https://japancredit.go.jp/about/methodology/) | HTTP 403 for full body during this work; latest adopted version not established |
| [AG-005 official PDF endpoint](https://japancredit.go.jp/pdf/methodology/AG-005.pdf) | HTTP 403; no new confirmed version created |
| [AG-004 official PDF endpoint](https://japancredit.go.jp/pdf/methodology/AG-004.pdf) | HTTP 403; version and rules remain UNKNOWN / UNSUPPORTED |

The existing AG-005 3.1-reference object is retained. The separate Compiler Pack binds the retrieved source hash and marks official adoption, effective dates, coefficients and complete rule translation unresolved. The reference PDF describes the two-year baseline and seven-day extension (section 1, pp.1–2); mapping those fragments does not establish complete eligibility. No later version number, official transition, factor or evidence requirement was inferred.

AG-004 is a schema-complete fail-closed placeholder, not a supported calculation. `source_checked_at=UNKNOWN` distinguishes an unsuccessful access attempt from an inspected source; `source_attempted_at` records the attempt.

NAFT-SYNTHETIC 1/2 are invented engineering protocols under a separate methodology ID. Their source hash covers canonical Pack JSON without source_hash, as indicated by source_hash_scope. Dates, coefficients and evidence categories are synthetic. The version-2 additional intensive-only rule/parameter/evidence requirement and conditional judgement exception are not AG-005 policy claims. They demonstrate the mechanics without fabricating institutional changes.
