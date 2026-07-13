# Developer Guide

## Architecture

POOH currently uses a lightweight architecture:

- PHP endpoints for persistence and export.
- Vanilla JavaScript, SVG and Web Workers for the browser UI.
- No build step for the web application.
- Node.js built-in tests for the extracted core modules.
- Playwright browser smoke tests for the main web shell.

## Application Configuration

`src/AppConfig.php` merges `config/app.default.php`, `config/app.php` and the
optional ignored `config/app.local.php`, then applies environment overrides.
Only a sanitized client configuration is exposed as `window.POOH_APP_CONFIG`.
Security-sensitive feature gates must also be enforced in PHP endpoints; hiding
a browser control alone is not sufficient.

The `researchTeam` feature is enabled only when its flag is true and deployment
mode is `internal` or `development`. Public mode removes the menu and panel from
server-rendered HTML, prevents the browser from loading author records, returns
an empty author list from the public API and rejects metrics-management actions.

## Internationalization

POOH uses one shared English/Polish message contract across PHP, browser code,
Node.js tools and Web Workers:

- `locales/en.json` and `locales/pl.json` are the only message catalogs.
- `src/core/i18n.js` provides catalog loading, language normalization,
  interpolation and fallback behavior for browser and Node.js code.
- `src/core/worker-i18n.js` configures workers from the language payload sent by
  the main application.
- `src/I18n.php` detects the request language and translates PHP/API messages.
- `index.php` renders the initial document with translated values and injects
  both catalogs for immediate client-side switching.

English is the fallback language. PHP request-language precedence is `lang`
query parameter, posted `language`, `X-POOH-Language`, `pooh_language` cookie,
then the first `Accept-Language` value. Browser API requests send the selected
language through `X-POOH-Language`.

Add every new user-facing message to both catalogs with identical placeholder
names, then call the relevant `t(...)`/`translate(...)` adapter. Do not embed
user-facing messages in PHP or JavaScript. `tests/i18n.test.js` checks catalog
key parity, placeholder parity, language switching and accidental Polish
message literals in production sources.

## Important Files

- `public/app.js` is the main application controller. It currently contains UI code and several algorithmic helpers.
- `public/pinvariant-worker.js` is the browser worker adapter for P-invariant computation.
- `public/xtrec-worker.js` is the browser worker adapter for XTREC recognition.
- `public/transversal-worker.js` is the browser worker adapter for exact and regular transversals.
- `public/generator-worker.js` is the thin browser worker adapter for random Petri-net generation.
- `public/sfc-worker.js` is the thin browser worker adapter for SFC/PLC and SFC-local max-plus artifacts.
- `src/core/` contains small, testable modules for PNH, Petri-net import layout, P-invariants, selection hypergraphs, XTREC recognition, hypergraph analysis, transversal computation, random generation, SFC/(max,+), decomposition-view data preparation, decomposition SVG rendering helpers, export formatting and benchmark reporting.
- `src/core/pnh.js` is a UMD module: Node.js tests import it with `require`, while `index.php` loads it in the browser before `public/app.js` as `window.PoohPnhCore`.
- `src/core/petri-layout.js` is a UMD module used by Node.js tests and by `public/app.js` as `window.PoohPetriLayoutCore` for deterministic imported-state construction and Petri-net layouts after PNH parsing.
- `src/core/pinvariants.js` is a UMD module used by Node.js tests and by `public/pinvariant-worker.js` as `self.PoohPinvariantsCore` for Martinez-Silva/Farkas-family P-invariant computation, optional WebGPU candidate checks and SMC correctness flags.
- `src/core/hypergraph.js` is a UMD module used by Node.js tests and by the manual hypergraph editor as `window.PoohHypergraphCore` for manual text parsing, FRA, transversals, structural classification, c-exact spectrum and r-exact checks.
- `src/core/xtrec.js` is a UMD module used by Node.js tests and by `public/xtrec-worker.js` as `self.PoohXtrecCore` for XTREC recognition with CPU/WebGPU/WebGL acceleration selection.
- `src/core/transversal.js` is a UMD module used by Node.js tests and by `public/transversal-worker.js` as `self.PoohTransversalCore` for exact/regular transversal computation and recommendation.
- `src/core/selection-hypergraph.js` is a UMD module used by Node.js tests and by the analysis panel as `window.PoohSelectionHypergraphCore` for P-invariant to selection-hypergraph construction.
- `src/core/generator.js` is a UMD module used by Node.js tests and by `public/generator-worker.js` as `self.PoohGeneratorCore` for random Petri-net generation, constructive XT generation and time-limited generator search.
- `src/core/sfc.js` is a UMD module used by Node.js tests and by `public/sfc-worker.js` as `self.PoohSfcCore` for SFC/PLC synthesis, trace validation and SFC-local max-plus recomputation.
- `src/core/decomposition-view.js` is a UMD module used by Node.js tests and by `public/app.js` as `window.PoohDecompositionViewCore` for preparing automata/SFC/max-plus subnet entries, mode labels/status summaries and automata, SFC, `(max,+)` and selection-hypergraph graph data before SVG rendering.
- `src/core/decomposition-renderer.js` is a UMD module used by Node.js tests and by `public/app.js` as `window.PoohDecompositionRendererCore` for deterministic SVG path/region planning and decomposition-view rendering.
- `src/core/exporters.js` is a UMD module used by Node.js tests and by the browser as `window.PoohExportersCore` for selected text/CSV/LaTeX reports, including hypergraph editor reports.
- `src/core/benchmark.js` is a UMD module: Node.js tests import it with `require`, while `index.php` loads it in the browser before `public/app.js` as `window.PoohBenchmarkCore`.
- `src/core/i18n.js` is the shared runtime for browser/Node translations;
  `src/core/worker-i18n.js` applies the same catalog and language in workers.

For public versus protected deployments, see `docs/ip_protection_strategy.md`.

## Refactoring Rule

Do not move logic out of `public/app.js` unless the moved module is covered by tests and the UI behavior is verified. The SoftwareX v1.0 release should prioritize reproducibility over risky rewrites.

Recommended extraction order:

1. PNH parsing, imported-state construction and serialization. PNH parsing is already routed through `src/core/pnh.js`; imported-state construction and deterministic Petri layout are routed through `src/core/petri-layout.js`; server-side PNH export remains in PHP.
2. P-invariants / SMC decomposition. P-invariant computation is routed through `src/core/pinvariants.js` via `public/pinvariant-worker.js`.
3. FRA and selection hypergraph construction. Manual hypergraph FRA is already routed through `src/core/hypergraph.js`; selection hypergraph construction is already routed through `src/core/selection-hypergraph.js`.
4. XT/r-exact/c-exact predicates and transversal summaries. Manual text parsing, manual-editor transversals, structural classification, c-exact spectrum and r-exact checks are already routed through `src/core/hypergraph.js`; XTREC recognition is routed through `src/core/xtrec.js`; selection-hypergraph exact/regular transversal solving is routed through `src/core/transversal.js` via `public/transversal-worker.js`.
5. Export formatters for JSON, CSV, LaTeX and text reports. Selection/manual/editor hypergraph text reports are already routed through `src/core/exporters.js`; benchmark CSV/LaTeX is already routed through `src/core/benchmark.js`.
6. Random Petri-net generation. Generation is already routed through `src/core/generator.js` via `public/generator-worker.js`.
7. SFC/PLC and SFC-local max-plus. SFC synthesis, validation and recomputation are already routed through `src/core/sfc.js` via `public/sfc-worker.js`.
8. Decomposition visualization data and rendering. Automata/SFC/max-plus subnet entry builders, graph-data builders, mode labels and status summaries are already routed through `src/core/decomposition-view.js`; SVG path planning and rendering are routed through `src/core/decomposition-renderer.js`; selection state and event handling remain in `public/app.js`.
9. UI adapters that call the stable `src/core/` modules.

## Test Commands

```bash
npm ci
npm test
npm run test:php
npm run examples
npm run check
npm run check:php
npm run ci
npx playwright install chromium
npm run test:browser
```
