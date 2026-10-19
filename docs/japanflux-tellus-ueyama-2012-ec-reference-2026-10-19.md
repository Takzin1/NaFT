# Tellus B 2012 EC processing paper: JP-Hrt supporting comparison only

Research date: 2026-10-19. Attached source was named Tellus2013.pdf, but the actual published work is **Ueyama et al. (2012)**, *Influences of various calculation options on heat, water and carbon fluxes determined by open- and closed-path eddy covariance methods*, Tellus B 64, article 19048. DOI: https://doi.org/10.3402/tellusb.v64i0.19048

Received user PDF: **26 pages**, **1,632,633 bytes**, SHA-256 **17f2cc3951d7d853d0ffe269f55dca5d469e4d3f755b761a74a50b2fb0cd5218**. The fingerprint verifies only the user-provided bytes, not independent publisher attestation. PDF page 1 labels the article **CC BY-NC 3.0**; do not redistribute its original PDF via GitHub.

## Source scope

The original experiment examined **sensible heat, latent heat/water vapor and CO2 fluxes** using seven flux sites: BRW, UAF, TSE, TMK, MSE, FHK, PDF. Its rice site **MSE is Mase, Japan (2005)**, not JP-Hrt Hiratsuka (2013). The study does **not provide experiments on original JP-Hrt methane (CH4) observations**. Therefore use it as an EC-processing options comparison, not a methane correction coefficient, a 2013 configuration record, or a per-row quality stamp.

Source PDF pages 3–4 (sites, Table 1), pages 4–5 (Section 3.1), page 6 (Table 2), and page 7 (Figure 3, Section 3.3) were inspected.

## Useful methodological comparison

The 2012 paper describes 10Hz raw sampling and conversion to 30-minute EC flux values. It names two separate software components: **Flux Calculator** for covariance, sonic/flow corrections, lag, rotations, quality information, footprints and high-frequency loss options; **Flux Analysis Tool** for downstream friction velocity threshold, gap-filling and partitioning. This separation matters: the paper does not establish which release or options were actually used at JP-Hrt in 2013.

Table 2 and Figure 3 compare despiking, coordinate rotation (double, extended double, triple, planar fit), optional detrending, wind/temperature corrections, lag time, empirical/theoretical high-frequency loss corrections, WPL, and open-path self-heating. WPL/self-heating are **conditional by measurement system**, and the CO2/H2O effect sizes must not be copied into methane. Source-sensitive changes may affect 30-minute/annual results, but the study does not supply a CH4 transfer factor.

## Implementation

- research/japanflux-jp-hrt-v200/tellus-ueyama-2012-ec-options-reference.json: PDF identity, publication year/license, sites/gases, source page pointers, options, no-transfer constraints.
- scripts/lib/japanflux-ec-tellus-reference-gate.mjs: deterministic validation of those boundaries. Does not calculate a flux or certify emissions.
- scripts/lib/japanflux-jp-hrt-source-gate.mjs: optional 4th argument accepts and audits supplemental Tellus evidence without relaxing scientific eligibility.
- tests/japanflux-tellus-ec-reference.test.mjs: rejects switching 2012 to 2013, MSE to JP-Hrt, CO2 to CH4, asserting raw 2013 options, manipulating a CH4 sensitivity coefficient or approving J-Credit totals.

### Data still needed

The actual 2013 JP-Hrt Flux Calculator version/configuration, 10Hz raw series, QC and rejection audit, time basis, site submission history and public FCH4 row lineage. The Komiya study budget (gap-filled) and JapanFlux unfilled series are distinct. The original PDF, original research graphs, worksheets and raw observations are **not committed**. Scientific totals and certified tCO2e remain null.
