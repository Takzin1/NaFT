---
version: alpha
name: NaFT Climate Evidence Studio
description: ClimateTech research interface for version-aware agricultural MRV and audit-ready evidence
colors:
  primary: "#12392F"
  secondary: "#36594E"
  tertiary: "#8DC6A1"
  neutral: "#F5F8F3"
  background: "#F5F8F3"
  surface: "#FFFFFF"
  foreground: "#14352E"
  muted: "#536B63"
  border: "#D8E4DA"
  accent: "#BAE883"
  warning: "#A86615"
  danger: "#9F3831"
typography:
  h1:
    fontFamily: "system-ui"
    fontSize: "clamp(2.2rem, 4vw, 4rem)"
    fontWeight: 800
    lineHeight: 1.08
    letterSpacing: "-0.045em"
  body-md:
    fontFamily: "system-ui"
    fontSize: "1rem"
    lineHeight: 1.65
  label-caps:
    fontFamily: "system-ui"
    fontSize: "0.75rem"
    fontWeight: 700
    letterSpacing: "0.11em"
rounded:
  sm: "8px"
  md: "14px"
  lg: "24px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
---
# NaFT / Climate Evidence Studio

## Purpose and identity

**Evidence before emissions.** A serious climate-science workbench, not a promotional credit marketplace. Think a quiet climate research publication with the rigor of scientific laboratory software: forest-green ink, off-white paper, fern-green signal and a sparing acid-lime action color. White data cards feel like laboratory sheets sitting over pale mineral paper. Climate-tech imagery is optional; **never fabricate satellite results, maps, savings, or measured carbon values as hero decoration**.

This is an **original design system for NaFT**, written using the [Google Labs DESIGN.md format](https://github.com/google-labs-code/design.md/blob/main/docs/spec.md). It was not copied from a competitor or misrepresented as a third-party asset.

## References and reasoning

- [Carbonfuture: Digital Trust Infrastructure](https://www.carbonfuture.com/): clear information hierarchy around verification and provenance. NaFT uses this design *idea*, not trademarks, copy or images.
- [Gaia climate software](https://gaiacompany.io/): low-density dashboard cards and use of restrained earth tones.
- [Google Labs DESIGN.md specification](https://github.com/google-labs-code/design.md/blob/main/docs/spec.md): YAML tokens followed by explanatory Markdown; consistency across design work.
- [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/): visible keyboard focus, minimum target sizes where feasible, contrast for interface controls.

## Components

1. **Research masthead**: name, category, clearly labeled research status, direct route links. Avoid large false performance KPIs.
2. **Hero**: dark conifer gradient with restrained topographic concentric rings drawn in CSS; highlight original evidence lifecycle, not offsets sold or emitted tonnage.
3. **Status strip**: persistent warning that official approval, real-field QA and certified tCO₂e have not been established.
4. **Data cards**: labels specify season, scope, unit, provisional/final status, source. Large figures only for real published values (and identify synthetic demo metrics).
5. **Workflow**: six existing MRV stages remain accessible, current route has a strong aria-current indication. Extra datasets route is separate and **read-only**.
6. **Dense tables**: horizontal overflow at narrow widths rather than truncating cells or silently removing uncertainty labels. All links have focus and hover treatments.
7. **Actions**: mint/lime signal for primary action; outlines for secondary, no automated formal certification or auto-issue button.

## Responsive behavior

- At widths below 760px, hero content, filter bar and insight cards stack; navigation remains scrollable/wrappable and touch targets are at least 44px where practical.
- Honor `prefers-reduced-motion`; do not use autoplay or parallax. Buttons are high contrast, focusable and non-animated for reduced-motion users.
- Do not load remote fonts or images; default to Japanese-capable OS system fonts. The static application works on GitHub Pages/offline after local files load.

## Implementation and guardrails

Normative UI tokens are the YAML block above, implemented in `src/gx-design-system.css`. The pre-existing `src/climatechain-theme.css` remains scoped to the competition microsite to avoid conflicting with its separate aesthetic.

No client-side display must infer **certified emissions from hectares, harvest, or model predictions**. A red/amber badge indicates review or missing evidence only, **not compliance**. 2024 all-rice harvest, 2025 main-food finalized harvest and 2026 main-food forecast must never be presented as directly compatible time-series values.

## QA acceptance

- Exact existing six routes, reviewer route, ClimateChain route and local-source routes remain working.
- `#/gx-data` is a read-only 47-prefecture data explorer with independently reproducible figures copied from P9 canonical data.
- All source links open original governmental sites, no user submissions sent.
- Desktop and 390px mobile visual acceptance, keyboard navigation, WCAG contrast and data provenance reviewed.
