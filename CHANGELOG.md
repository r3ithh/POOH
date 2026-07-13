# Changelog

All notable changes to POOH are documented here.

## [Unreleased]

### Changed

- Added the Zenodo version DOI `10.5281/zenodo.21341387` and concept DOI
  `10.5281/zenodo.21341386` to the citation metadata and README after the
  archival v1.0.0 release was published.

## [1.0.0] - 2026-07-13

### Added

- Server-side deployment configuration in `config/` and `src/AppConfig.php`,
  with public/internal/development modes, feature flags, local overrides and
  environment overrides.
- Safe `.default` templates for users, research-team authors, Turnstile and
  scholar metrics. The user template includes a disabled `admin` row without a
  usable default password; author and metrics templates contain matching,
  explicitly fictional example records.
- PHP and browser regression coverage for public-mode feature gating.
- Central English/Polish catalogs in `locales/`, shared JavaScript/Node and Web
  Worker i18n runtimes, and a PHP request-language adapter in `src/I18n.php`.
- Regression tests for language-catalog key/placeholder parity, worker/core
  language propagation, dynamic browser language switching and accidental
  embedded Polish production messages.
- Research-software repository structure with `docs/`, `examples/`, `tests/`,
  `data/`, `scripts/` and the reusable `src/core/` modules.
- `CITATION.cff`, `LICENSE`, `CONTRIBUTING.md` and reviewer-oriented
  research-software documentation.
- Testable research-core modules in `src/core/` for PNH parsing/export, P-invariant computation, selection hypergraph construction, FRA, transversals and r-exact smoke analysis.
- Export-format helpers in `src/core/exporters.js` and a `src/core/index.js` module entry point.
- Browser/Node benchmark core in `src/core/benchmark.js` for benchmark summaries and CSV/LaTeX exports.
- Browser/Node PNH core in `src/core/pnh.js`, now loaded by the web UI as the single PNH parsing implementation.
- Browser/Node Petri layout core in `src/core/petri-layout.js` for deterministic imported-state construction and Petri-net layout modes after PNH parsing.
- Browser/Worker/Node P-invariant core in `src/core/pinvariants.js`, now used by the P-invariant worker for Martinez-Silva/Farkas-family computation and SMC correctness flags.
- Browser/Node hypergraph core in `src/core/hypergraph.js`, now loaded by the web UI for manual FRA, transversal enumeration and r-exact analysis.
- Browser/Worker/Node XTREC core in `src/core/xtrec.js`, now used by the XTREC worker for XT recognition with CPU/WebGPU/WebGL acceleration selection.
- WebGPU XTREC intersection engine for batched bitset-intersection checks, with WebGL/CPU fallback paths for browser compatibility.
- Browser/Worker/Node transversal core in `src/core/transversal.js`, now used by the selection-hypergraph worker for exact/regular transversal solving and recommendation.
- Browser/Node selection-hypergraph core in `src/core/selection-hypergraph.js`, now loaded by the web UI for Petri P-invariant to selection-hypergraph construction.
- Browser/Node Petri analysis core in `src/core/petri-analysis.js` for PN/OPN/SM/MG/FC/EFC classification, transition firing rules and bounded liveness/safeness summaries.
- Browser/Worker/Node random Petri-net generator core in `src/core/generator.js` for constructive XT generation, live+safe generation, adaptive generation and time-limited search.
- Browser/Worker/Node SFC/(max,+) core in `src/core/sfc.js` for SFC/PLC synthesis, PN-to-SFC validation and SFC-local max-plus recomputation.
- Browser/Node decomposition-view core in `src/core/decomposition-view.js` for automata, SFC, `(max,+)` and selection-hypergraph entry/graph-data preparation before SVG rendering.
- Browser/Node decomposition-renderer core in `src/core/decomposition-renderer.js` for decomposition-view SVG path planning, hyperedge region planning and browser rendering.
- Browser/Node exporters core in `src/core/exporters.js`, now loaded by the web UI for selection-hypergraph, manual-hypergraph, hypergraph-editor, SFC/(max,+), fuzzy max-plus/T-S text reports and fuzzy CSV/LaTeX research exports.
- Browser/Node max-plus core in `src/core/max-plus.js`, now loaded by the web UI for local `A_i` generation, global transversal `A_T` generation, Petri/XT relation reachability and shared coupling/timing helpers.
- Browser/Node fuzzy source core in `src/core/fuzzy-source.js`, now loaded by the web UI for Petri/XT and graphic-hypergraph research source assembly.
- Browser/Node fuzzy membership core in `src/core/fuzzy-membership.js`, now loaded by the web UI for membership-weight normalization, `μ(v,E)` matrix construction and membership detail rows.
- Browser/Node fuzzy transversal core in `src/core/fuzzy-transversal.js`, now loaded by the web UI for alpha-cut exact covers, fuzzy exact-transversal quality `E(T)`, q/coupling/lambda constraint checks and fuzzy transversal optimization.
- Browser/Node Takagi-Sugeno core in `src/core/takagi-sugeno.js`, now loaded by the web UI for structural T-S max-plus rule generation and supervisor/verification reports.
- Browser/Node fuzzy artifact core in `src/core/fuzzy-artifact.js`, now loaded by the web UI for reproducible fuzzy max-plus research artifact assembly.
- Browser/Node fuzzy facade in `src/core/fuzzy.js`, now loaded by the web UI as a compatibility export surface over the split fuzzy source/membership/transversal/T-S/artifact modules.
- Node.js test suite using the built-in `node:test` runner.
- Playwright browser smoke tests for the web shell, PNH import through shared parser/layout cores, P-invariants, selection hypergraph construction, SFC worker synthesis/validation/max-plus recomputation, drawing before/after FRA, XTREC checks, random generator worker execution, multi-fixture CPU/WebGPU benchmark execution, benchmark cancellation, invalid PNH import handling and CSV/LaTeX exports.
- GitHub Actions CI workflow for Node/PHP checks and browser smoke testing.
- Three reproducible example cases.
- Small `SoftwareX examples` PNH library fixture for deterministic browser benchmark tests.
- Machine-readable `examples/*/expected.json` reference outputs for reproducible example cases.
- `scripts/example_reference.js` and `scripts/run_examples.js` for deterministic example reference validation.
- `.gitignore` for local dependency and Playwright artifacts.

### Changed

- Public mode now omits the `Research team` menu, panel and metrics editor from
  rendered HTML, avoids loading author data and disables the related API
  surface. Internal deployments can enable it globally in server configuration.
- Missing active access files are initialized from matching `.default`
  templates without overwriting existing deployment data; `users.csv` supports
  an explicit `enabled` column.
- User-facing PHP/JavaScript errors, progress messages, validation output and
  human-readable research reports now resolve through the selected language
  catalog; English is the deterministic fallback, while an explicit UI choice
  is persisted for publication workflows.
- Fresh installations use safe access templates: the administrator remains
  disabled without a password, while fictional author and metrics records
  document the internal research-team data contract.
- README rewritten around installation, first run, research purpose, citation and testing.
- Developer, reviewer and reproducibility documentation now describe `npm run ci` and `npm run test:browser`.
- Example documentation now names the expected P-invariant, selection-hypergraph and transversal outputs verified by `npm run examples`.
- Benchmark summaries and benchmark CSV/LaTeX exports now use the shared `src/core/benchmark.js` module from the browser UI, with legacy in-app fallback preserved.
- Benchmark CSV/LaTeX exports now include requested and actually used acceleration modes plus CPU speedup columns for Martinez-Silva P-invariants and XTREC.
- Benchmark CSV exports now include browser/platform reproducibility metadata: platform, logical CPU count, declared device memory and WebGPU/WebGL availability.
- Benchmark panel now supports filtered/limited visible file ranges, lightweight PNH-library profiling and profile CSV export before running expensive CPU/WebGPU benchmarks.
- Benchmark panel now supports deterministic representative-sample selection from a profile and one-click CPU/WebGPU execution on that sample.
- `scripts/profile_pnh_library.js` and `npm run profile:library` provide a reproducible CLI path for profiling large PNH benchmark libraries and exporting representative-sample CSV files with `--sample` and `--sample-output`.
- Browser benchmarks can compare CPU versus WebGPU for P-invariants and XTREC; XTREC also keeps WebGL as a compatibility acceleration mode.
- Browser benchmark fallbacks in `public/app.js` were reduced to compact emergency paths; the full benchmark summary/export contract now lives in `src/core/benchmark.js`.
- PNH import now routes through shared `src/core/pnh.js` in the browser UI, while preserving the previous in-app parser as a compatibility fallback.
- Imported-state construction and Petri-net layout modes after PNH parsing now route through `src/core/petri-layout.js`; the duplicate layout implementation was removed from `public/app.js`.
- P-invariant computation now routes through shared `src/core/pinvariants.js` inside `public/pinvariant-worker.js`, while preserving the previous worker implementation as fallback.
- P-invariant text reports, matrix blocks and analysis-row summaries now route through shared `src/core/exporters.js`, while preserving compact UI fallbacks.
- Manual hypergraph parsing, FRA, transversals, c-exact, r-exact and structural checks now route through shared `src/core/hypergraph.js` without duplicate in-app algorithm fallbacks.
- XTREC recognition now routes through shared `src/core/xtrec.js` inside `public/xtrec-worker.js`, while preserving the previous worker implementation as fallback.
- Selection hypergraph construction now routes through shared `src/core/selection-hypergraph.js` without the previous duplicate in-app implementation.
- Petri net classification and bounded liveness/safeness analysis now route through shared `src/core/petri-analysis.js` in the browser UI.
- Selection-hypergraph exact/regular transversal solving now routes through shared `src/core/transversal.js` inside `public/transversal-worker.js`, while preserving the previous worker implementation as fallback.
- Selection-hypergraph text reports, analysis rows, manual-hypergraph reports, hypergraph-editor text reports, SFC/(max,+) text reports, fuzzy max-plus/T-S text reports and fuzzy CSV/LaTeX research exports now route through shared `src/core/exporters.js`.
- Browser benchmark summaries and CSV/LaTeX exports now require `src/core/benchmark.js` and no longer keep duplicate in-app fallback implementations.
- Random Petri-net generation now routes through `src/core/generator.js`; `public/generator-worker.js` is a thin Web Worker adapter, and the duplicate in-main-thread generator fallback was removed from `public/app.js`.
- `src/core/generator.js` uses shared `src/core/petri-analysis.js` for Petri classification/bounded liveness/safeness checks and full `src/core/xtrec.js` for forced XT-hypergraph generation checks.
- SFC/PLC synthesis, PN-to-SFC validation and SFC-local max-plus recomputation now route through `src/core/sfc.js`; `public/sfc-worker.js` is a thin Web Worker adapter.
- Decomposition visualization entry and graph-data builders for automata subnets, SFC views, local `(max,+)` transition graphs and selection-hypergraph drawings now route through `src/core/decomposition-view.js`; `public/app.js` keeps state wiring, SVG drawing and interaction code.
- Decomposition visualization SVG rendering now routes through `src/core/decomposition-renderer.js`; `public/app.js` keeps pan/zoom, drag state and event handling.
- Decomposition visualization mode normalization, subnet option labels, graph selection and status summaries now route through `src/core/decomposition-view.js`; `public/app.js` keeps DOM select synchronization and status assignment.
- `npm run check` now includes `public/generator-worker.js`.
- `npm run check` now includes `src/core/generator.js`.
- `npm run check` now includes `src/core/sfc.js`.
- `npm run check` now includes `src/core/decomposition-view.js`.
- `npm run check` now includes `src/core/decomposition-renderer.js`.
- `npm run check` now includes `src/core/petri-layout.js`.
- Generator status labels now distinguish constructive XT and constructive live+safe generation modes.
- Browser report formatter fallbacks in `public/app.js` for P-invariants, selection hypergraphs, manual/editor hypergraphs, SFC/(max,+) and fuzzy max-plus/T-S were reduced to thin adapters over `src/core/exporters.js`.
- Max-plus timing, Petri/XT relation reachability, Petri/XT relation matrices, local max-plus graph helpers, standalone local `A_i` generation, global transversal `A_T` generation from Petri arcs and shared coupling helpers now live in `src/core/max-plus.js`; `src/core/fuzzy.js` re-exports that public contract as a compatibility facade.
- Petri/XT and graphic-hypergraph fuzzy research source assembly now live in `src/core/fuzzy-source.js`; `src/core/fuzzy.js` re-exports the previous public source functions for browser and Node compatibility.
- Fuzzy membership weights, `μ(v,E)` matrix construction and membership detail rows now live in `src/core/fuzzy-membership.js`; `src/core/fuzzy.js` re-exports the previous public functions for browser and Node compatibility.
- Alpha-cut XT, fuzzy exact-transversal quality `E(T)`, max-plus mapping checks, q/coupling/lambda constraint evaluation and fuzzy transversal optimization now live in `src/core/fuzzy-transversal.js`; `src/core/fuzzy.js` re-exports the previous public functions for browser and Node compatibility.
- Structural Takagi-Sugeno max-plus rule generation, fuzzy level classification and supervisor verification reports now live in `src/core/takagi-sugeno.js`; `src/core/fuzzy.js` re-exports the previous public functions for browser and Node compatibility.
- Reproducible fuzzy max-plus artifact assembly now lives in `src/core/fuzzy-artifact.js`; `src/core/fuzzy.js` re-exports the previous artifact builder for browser and Node compatibility.
- Fuzzy/max-plus research fallbacks in `public/app.js` for membership construction, alpha-cut exact covers, fuzzy transversal optimization, T-S rules and supervisor reports were reduced to thin adapters over `src/core/fuzzy.js`.

### Notes

- Existing browser/PHP application behavior is preserved.
- Further migration of browser-controller logic from `public/app.js` into
  reusable `src/core/` modules remains planned for post-v1.0.0 development.

[Unreleased]: https://github.com/r3ithh/POOH/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/r3ithh/POOH/releases/tag/v1.0.0
