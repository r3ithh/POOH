# concurrent_control_case

Small concurrent-control case composed of two independent cyclic subprocesses.

## Run

```bash
npm run examples
php -S 127.0.0.1:8000
```

Open `http://127.0.0.1:8000`, load `examples/concurrent_control_case/input.pnh`, then run liveness/safeness and P-invariant analysis.

## Expected Result

- 4 places, 4 transitions.
- Initial marking has one token in each independent subprocess.
- P-invariant analysis should expose two local cyclic components.
- FRA-reduced selection hypergraph has shape `2x2`.
- One minimal and exact transversal is expected: `D1, D2`.

The machine-readable reference output is stored in `expected.json` and verified by `npm run examples`.

## Interpretation

The case is intentionally small but structurally concurrent: it provides a quick example for checking whether decomposition and relation reporting distinguish independent subprocesses.
