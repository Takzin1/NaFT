# Rice MRV: Verra VM0051 v1.1 vs Gold Standard AWD training files

2026-10-19. RESEARCH PRE-FLIGHT ONLY. Neither verified credits nor independent full calculation replay. Source files are not redistributed to GitHub.

## Original user-supplied source files

| File | Document identity | SHA256 |
| --- | --- | --- |
| 方法論2026.pdf (90p) | Verra VM0051 v1.1, 14 July 2026 | 9b9738840824f5919e3a76f8807c68743ae3d64b5d931cda27598f3ab32c64e2 |
| シナリオ3類型.pdf (2p) | Gold Standard AWD, 3 training exercises | 77519262ddf83e00a3dd04f89be7cef46a79f534c50496f1c770325e5f1ef461 |
| 計算式ツール.xlsx | Gold Standard AWD methodology v1.0; workbook v1.1; Cover date 04.07.2024 | 92ddfcf926ec2eaead54e674c06a608f8a29b8e6ff0698a0468aa29152cd8040 |
| チェックリスト.docx (38 rendered pages) | Gold Standard AWD VVB validation checklist v1.0, 05 April 2024 | 532ec2c31daf95d911367b2516a5e0c67d17ba47031457c89d9d55844217478a |

Official Verra methodology: https://verra.org/methodologies/vm0051-improved-management-in-rice-production-systems-v1-1/ . Gold Standard training context: https://globalgoals.goldstandard.org/ .

## Critical discovery: Tier and QA numbering is source-specific

Verra VM0051 PDF pages 18–19 (Section 8.1) defines QA1 = biogeochemical process modeling, QA2 = direct CH4 field chamber measurement, QA3 = default emission factors. Its Section 6 requires at least three years of historical field management records for the baseline. Section 8.2 requires baseline control field chamber measurement under QA2. Appendix 4 (pp.85–88) calls for verifiable DMRV, remote sensing or ML against independent ground truth, processing-data auditability, and independent VVB spot-checks.

The attached Gold Standard scenarios and calculation workbook use Tier 1 = simplified/default factors, Tier 2 = country-specific factors, Tier 3 = direct measurement.

In contrast, **Gold Standard VVB checklist, Section E, question 23, rendered PDF p.16, prints Tier 1 = direct measurement, Tier 2 = country-specific factors, Tier 3 = IPCC default factors**. This **contradiction in original document labels is retained** rather than silently corrected. The function resolveRiceApproach requires explicit institution, exact version, document kind, approach label and declared semantics. No bare Tier1 or universal number-to-method mapping is permitted. The checklist is a 2024 Gold Standard document, not a Verra 2026 approval.

## Excel model inspection (not yet independent replay)

The attached workbook has seven tabs: Instructions, Cover, Input_ER, Tier 1_Simplified, Tier 2_Country specific, Tier 3_Direct measurement and ER. It contains formulas with saved example values, not necessarily initialized for the attached 3 exercises.

| Original cell | Formula text |
| --- | --- |
| Tier 1_Simplified!E5 | =E9*E10*E14/1000*E15*(1-E30) |
| Tier 2_Country specific!E4 | =(E8-E22)*(1-E60) |
| Tier 3_Direct measurement!E4 | =(E8-E17)*(1-E49) |
| ER!F9 | =IF(F8="Tier 1",'Tier 1_Simplified'!E5,IF(F8="Tier 2",'Tier 2_Country specific'!E4,'Tier 3_Direct measurement'!E4)) |

Input_ER C3/C4 show IPCC AR5 GWP values CH4=28 and N2O=265. These are workbook inputs, not generalized or updated values for Verra VM0051, J-Credit AG-005 or an official certification.

## A narrowly scoped independent training arithmetic check

Gold Standard training scenario 3 states 10,000 ha, baseline 420 kg CH4/ha/year, project 95 kg CH4/ha/year, uncertainty reduction 10%. Using the workbook-specific CH4 GWP 28 gives:

- Mass difference: (420 − 95) × 10,000 = 3,250,000 kg CH4/year.
- CH4-only conversion: 3,250,000 × 28 / 1000 = 91,000 tCO2e/year.
- Illustrative 10% deduction: 91,000 × 0.90 = **81,900 tCO2e/year**.

This is just an independently checked CH4-only arithmetic term, **not the complete Gold Standard emission reduction result**. No full Excel scenario replay was performed. N2O, diesel, leakage, eligibility, uncertainty method and other project-specific sources may affect the outcome. The script therefore always produces final_certified_emission_reductions_tco2e = null.

## Files and next verification milestones

- research/rice-mrv-2026-10-19/standards-and-training-source-manifest.json: exact file digests, versions, key statements, scenario numeric metadata and 4 original spreadsheet formula excerpts.
- scripts/lib/rice-standards-source-gate.mjs: pure deterministic source audit, namespace-scoped method label resolution, and a training-only BigInt CH4 term check.
- tests/rice-standards-source-gate.test.mjs: adversarial hashes, version mismatch, Gold/VVB Tier collision, unauthorized Verra↔Gold translation, no certified amounts.
- Remaining: Gold workbook scenario parameter-cell bindings and full recalculation independent of cached values, Gold Standard's clarification of conflicting Tier labels, Verra QA1/QA2/QA3 eligibility evidence, VVB field monitoring, and project-specific third-party attestation.

No copyrighted source binaries copied into the repo. This new registry does not change JP-Hrt's still-unresolved original 10Hz→published FCH4 provenance or its zero approved observation count.
