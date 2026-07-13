# Algorithms

## PNH Import and Petri Layout

PNH parsing is implemented in `src/core/pnh.js`. Deterministic conversion from parsed PNH data to application state, including coordinate normalization and `smart/layered/radial/organic/coordinates` Petri-net layouts, is implemented in `src/core/petri-layout.js` and loaded in the browser as `window.PoohPetriLayoutCore`.

## P-invariants

P-invariants are computed by the shared research-core module `src/core/pinvariants.js` using a Martinez-Silva/Farkas-family column-elimination workflow. The browser executes it through `public/pinvariant-worker.js`.

The result contains invariant vectors, support places, the number of marked places in each support, and the `correctSubnet` flag used as the SMC filter for selection-hypergraph construction.

The worker supports CPU execution and an optional WebGPU dot-product engine for batched Farkas-family candidate checks. Benchmark runs record both the requested acceleration mode and the mode actually used, so reviewer machines without WebGPU still produce reproducible CPU fallback results.

## Selection Hypergraph

Correct state-machine components become hypervertices. Places become hyperedges. A candidate component covers a place when the corresponding P-invariant support contains that place.

The dual matrix can be inspected before and after FRA reduction.

## FRA Reduction

FRA removes dominated hyperedges and dominated hypervertices, while tracking essential vertices. The implementation is available in the UI and in `src/core/hypergraph.js` for reproducibility tests.

## XT and Exact Transversals

XTREC is implemented as a shared research-core module in `src/core/xtrec.js` and executed in the browser through `public/xtrec-worker.js`. POOH treats the historical XT-hypergraph path as the `1-exact` case inside the broader `r-exact` direction.

Exact and regular transversal solving for selection hypergraphs is implemented in `src/core/transversal.js` and executed through `public/transversal-worker.js`.

XTREC supports CPU, WebGPU and WebGL execution modes. The WebGPU path batches bitset-intersection checks in a compute shader, WebGL remains a compatibility path, and CPU remains the deterministic fallback used by CI when browser acceleration is unavailable.

## Random Petri-net Generation

Random Petri-net generation is implemented in `src/core/generator.js` and executed in the browser through the thin adapter `public/generator-worker.js`. The forced XT path uses shared `src/core/xtrec.js`, while classification and bounded liveness/safeness checks use `src/core/petri-analysis.js`.

## SFC and max-plus Worker Pipeline

SFC/PLC synthesis, PN-to-SFC trace validation and SFC-local `(max,+)` recomputation are implemented in `src/core/sfc.js`. The browser executes these operations through the thin adapter `public/sfc-worker.js`, so the same computational contract is available to Node.js tests and the UI.

## Decomposition View Data

Entry and graph-data preparation for decomposition visualizations is implemented in `src/core/decomposition-view.js`. The module prepares automata subnet entries from P-invariants and exact selections, SFC subnet entries, local `(max,+)` entries from SFC or Petri/SMC fallback data, selection-hypergraph drawings, hyperedge geometry helpers, mode labels, status summaries and textual details. The browser keeps selection/event wiring in `public/app.js`, while deterministic layout/data preparation is covered by Node.js tests.

SVG path planning and rendering for the decomposition view is implemented in `src/core/decomposition-renderer.js`. It covers Petri-style connection points, parallel/self-loop edge paths, hyperedge region plans and the browser renderer used by `public/app.js`.

## r-exact Hypergraphs

For minimal transversals, POOH computes:

```text
r* = max |T ∩ E_j|
```

The hypergraph satisfies an `r` threshold when `r* <= r`; `XT/1-exact` corresponds to `r* <= 1`.

## max-plus and Fuzzy

The `(max,+) / Fuzzy` module builds local max-plus models from SMC components, computes structural relation matrices, derives fuzzy exact transversals through alpha-cuts and sketches Takagi-Sugeno max-plus rules. Shared max-plus helpers for the research path live in `src/core/max-plus.js`; SFC-specific PLC-oriented max-plus reports live in `src/core/sfc.js`.

## Benchmark Acceleration Metadata

The benchmark module can run CPU versus WebGPU comparison matrices for Martinez-Silva P-invariants and XTREC. CSV and LaTeX exports include the requested and actually used acceleration modes, plus `xCPU` speedup columns for both stages. CSV exports also include browser/platform reproducibility metadata, making GPU availability and fallback behavior explicit in publication tables.

For large libraries, POOH also supports a lightweight profile pass before expensive benchmark execution. The profile records file size, PNH format, `|P|`, `|T|`, number of arcs, marked places, total tokens, arc density and parser warnings/errors. The same profile CSV contract is available in the browser and through `npm run profile:library`.

The benchmark panel can derive a deterministic representative sample from the current profile. The sampler covers small/medium/large models by `|P|+|T|+arcs`, low/high arc density, parser-warning cases, high initial marking and place/transition imbalance. Parser-error rows are reported but excluded from the default CPU/WebGPU speedup sample, because they do not produce meaningful algorithm timings. The same logic is exposed from `src/core/benchmark.js` and from `scripts/profile_pnh_library.js --sample=N`.
