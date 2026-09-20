# MRV App visibility and performance — 2026-09-13

## Implemented requirements

| Use | App behavior | Acceptance evidence |
|---|---|---|
| IEEE | Existing eight-stage lifecycle; provenance opens on request; latest retirement reason stays visible | Existing IEEE flow and escaping assertions retained; inspection preserves the review note |
| Mitou Advanced | Selected-field progress, missing/failed checks, next human action, current run/record integrity, explicit unresolved configuration | Stale/tampered views and authoritative refusal tests |
| Saitama / regional operator | Program work queue with field/farmer/program/year search and saved-status filtering | Scoped, paginated work-queue tests; no income or certified-quantity claims |
| Lightweight inspection | Ten-row activity/evidence pages; file selector follows evidence page; JSON generated only on explicit inspection | Default large-fixture HTML below 50 KB; off-page rows absent |
| Human workflow | Same-user/field notes and selected file nodes survive view-only changes; changing field clears those drafts | DOM-stub restoration and field-change tests |

Registration still uses the existing structured JSON editor. This change improves visibility and runtime costs; it does not add a methodology, change official configuration, implement server storage or create a new certification state. The six Primary MRV progress cards are not a score or probability of certification. `CONFIG REQUIRED` stays visible after human approval.

## Measured render cost

Measured locally using Node **v24.19.0**, sequential before/after runs, nine render samples per version; median is reported. Baseline is main `51b8ade`, before this change.

Synthetic render fixture: 100 activities, 1,092 manifests (300 on the selected activity), 1,016 audit rows and one reviewed draft. This stresses rendering and does not represent 100 real farms or a concurrent-user benchmark. Both versions render the same constructed fixture. The fixture's unrelated activity copies are for view load, not methodology validation.

| Metric | Baseline | Updated |
|---|---:|---:|
| Median `pgPrimaryMRV()` HTML-string generation | 108.90 ms | 27.15 ms |
| Default generated HTML, UTF-8 bytes | 1,014,505 | 19,822 |
| Database unchanged by rendering | Yes | Yes |

In this run, generation time fell by approximately **75%**, and default HTML by approximately **98%**. This is not browser paint/FPS, mobile-device latency, memory-heap profiling, network transfer size or a production throughput result. The application source itself gains view code; the reduction is in computation/allocation and generated page payload.

## What changed internally

- One fresh selected-field snapshot per render, reused only inside that render. Manifest integrity checked once per manifest; latest rechecks and work-queue joins use per-call maps.
- Full audit-history verification removed from passive rendering. The UI says **Last explicit verification**, shows a timestamp and explains that this is historical. Clicking the verifier checks the full current chain. Methodology actions, human decisions and Monitoring Package export keep full verification regardless of the displayed result.
- SHA-256 padding/schedule use typed arrays and scalar rounds instead of creating an array every compression round. Byte output remains standard SHA-256, including tested padding boundaries and binary input; old hashes do not require migration.
- Closed record, manifest, calculation and IEEE provenance JSON is not generated. Paging reduces default output. Explicit full-record inspection can still be large.
- No long-lived integrity/authorization cache, new dependency, external request or storage schema migration.

## Reproduce

Run `bash tests/run.sh`, then `node tests/render-benchmark.js` for the current version. The benchmark is optional; CI uses deterministic correctness/output-size gates rather than a machine-speed threshold.

To produce the baseline script without changing the checkout:

```bash
python3 - <<'PY'
import pathlib, re, subprocess
html = subprocess.check_output(['git', 'show', '51b8ade:naft-app.html'], text=True)
pathlib.Path('/tmp/naft-baseline.js').write_text('\n;\n'.join(re.findall(r'<script>(.*?)</script>', html, re.S)))
PY
node tests/render-benchmark.js /tmp/naft-baseline.js
node tests/render-benchmark.js
```

Final regression result: **276 passed / 0 failed**, including all prior 231 assertions and 45 added checks. Real-browser visual/file-input interaction verification remains uncompleted in this environment; the supplied tests use a DOM stub. Whole-state replacement, cross-client races, external-registry duplicates and unconfirmed AG-005 configuration remain existing limitations.
