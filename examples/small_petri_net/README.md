# small_petri_net

Minimal cyclic Petri net used as a smoke test for PNH import/export.

## Run

```bash
npm run examples
php -S 127.0.0.1:8000
```

Open `http://127.0.0.1:8000`, load `examples/small_petri_net/input.pnh`, then run:

1. `Analysis -> (1) Compute p-invariants`
2. `Analysis -> (2) Compute selection hypergraph (XTREC)`

## Expected Result

- 2 places, 2 transitions, 4 arcs.
- One token moves cyclically between `P1` and `P2`.
- Full P-invariant computation returns one correct subnet with vector `[1, 1]`.
- FRA-reduced selection hypergraph has shape `1x1`.
- One minimal and exact transversal is expected: `D1`.

The machine-readable reference output is stored in `expected.json` and verified by `npm run examples`.

## Interpretation

This case verifies that the basic matrix PNH format is parsed consistently and that a tiny safe cycle can be loaded without relying on server-side libraries.
