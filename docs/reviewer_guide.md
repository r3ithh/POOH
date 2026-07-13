# Reviewer Guide

## Quick Reproduction

```bash
npm ci
npm test
npm run examples
npm run ci
php -S 127.0.0.1:8000
```

Then open `http://127.0.0.1:8000`.

`npm run examples` validates the machine-readable `expected.json` files stored with each example. These references cover PNH import, full CPU P-invariant computation, selection-hypergraph construction, FRA reduction and minimal/exact transversal enumeration.

## Automated Browser Smoke Test

```bash
npm run ci
npx playwright install chromium
npm run test:browser
```

The Playwright smoke tests load the web shell, confirm shared browser cores, import `examples/xt_decomposition_case/input.pnh`, compute P-invariants, build the selection hypergraph, synthesize and validate an SFC/(max,+) model, draw the hypergraph before and after FRA, and run XTREC on both displayed variants. Additional browser tests profile the `SoftwareX examples` library, select a representative benchmark sample, run that sample with CPU/WebGPU comparison settings, verify profile/benchmark CSV and LaTeX exports with acceleration metadata, `xCPU` speedups and browser/platform metadata, reject an invalid PNH import without corrupting the canvas, cancel an in-progress benchmark and exercise the forced XT generator worker path.

## Suggested Manual Checks

1. Import `examples/small_petri_net/input.pnh`.
2. Run P-invariant analysis.
3. Run selection hypergraph analysis.
4. Draw the selection hypergraph before and after FRA.
5. Run `Check XT` on both variants.
6. Inspect benchmark results and exports from the `SoftwareX examples` library.
7. Profile a larger local library with `npm run profile:library -- lib_55033290a3fc3aa4 /tmp/pooh-library-profile.csv --sample=12 --sample-output=/tmp/pooh-library-sample.csv` when available.

## What Is Stable

- PNH import/export.
- Web UI execution model.
- Worker-based P-invariant, XTREC and transversal computation.
- CPU/WebGPU benchmark comparison for P-invariants and XTREC, with `xCPU` speedup reporting and CPU fallback on machines without WebGPU.
- Testable core smoke tests.
- CI workflow for Node/PHP checks and Playwright smoke testing.
- Deterministic benchmark fixture under `data/pnh_libraries/lib_softwarex_examples/`.
- Deterministic example reference outputs under `examples/*/expected.json`.
- Browser smoke coverage for invalid PNH import and benchmark cancellation.

## What Is Research ALPHA

- `(max,+) / Fuzzy`.
- fuzzy exact transversal optimization.
- generated Takagi-Sugeno supervisor reports.
- full migration of algorithmic code from `public/app.js` to `src/core`.
