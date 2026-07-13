# xt_decomposition_case

Small input model for checking the Petri -> selection hypergraph -> exact transversal workflow.

## Run

```bash
npm run examples
php -S 127.0.0.1:8000
```

Open `http://127.0.0.1:8000`, load `examples/xt_decomposition_case/input.pnh`, then run:

1. P-invariant analysis.
2. Selection hypergraph construction.
3. XTREC and transversal computation.
4. Optional drawing of the selection hypergraph before and after FRA.

## Expected Result

- The model is small enough for deterministic smoke testing.
- Full P-invariant computation returns one correct subnet with vector `[1, 1, 1]`.
- FRA-reduced selection hypergraph has shape `1x1`.
- One minimal and exact transversal is expected: `D1`.

The machine-readable reference output is stored in `expected.json` and verified by `npm run examples`.

## Interpretation

This case is not intended as a performance benchmark. It is a minimal reproducibility example for reviewer-side inspection of the decomposition pipeline.
