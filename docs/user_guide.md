# User Guide

## Language

Use the language selector in the application header to choose `English` or
`Polski`. The selection applies immediately to the interface, validation and
error messages, progress notifications, algorithm reports and newly started
Web Worker computations. The choice is retained for later browser sessions.

English is the fallback language, while a first request can honor the browser's
language preference. Select English explicitly when generating figures and
artifacts for an English-language publication.

## Basic Workflow

1. Load or draw a Petri net.
2. Run liveness/safeness analysis if needed.
3. Run `(1) Compute p-invariants`.
4. Run `(2) Compute selection hypergraph (XTREC)`.
5. Inspect transversals and exact transversals.
6. Draw the selection hypergraph before/after FRA.
7. Continue to SFC/PLC or `(max,+) / Fuzzy` research modules.

## Selection Hypergraph Drawing

The analysis panel exposes a drawing variant:

- `After FRA` - visualizes the reduced selection hypergraph.
- `Before FRA` - visualizes the original dual hypergraph before FRA.

After drawing, the graphical hypergraph tab can highlight computed transversals and exact transversals. `Check XT` runs XTREC on the currently visible original or reduced variant.

Use `Compare before/after FRA` to open a side-by-side comparison panel in the graphical hypergraph workspace. The panel renders the original selection hypergraph and the FRA-reduced hypergraph together with size, incidence and XTREC summaries.

## Research Outputs

The application can export JSON, CSV, LaTeX and text reports for benchmark and fuzzy/max-plus workflows. Use saved research runs when preparing tables for publications.
