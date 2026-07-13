# POOH

**POOH: Power Objects of Hypergraphs** is a research software platform for Petri-net-based modelling, analysis and decomposition of concurrent control systems. The current research direction is:

`Petri net -> P-invariants / SMC -> selection hypergraph -> XT / r-exact decomposition -> (max,+) timing -> Takagi-Sugeno fuzzy supervision`

The application combines an interactive web UI with reproducible example data, server-side PNH libraries and a gradually extracted testable algorithmic core.

## Scientific Use

POOH supports experiments on:

- safe Petri nets for concurrent control systems,
- P-invariant based decomposition into state-machine components,
- construction and reduction of selection hypergraphs,
- exact transversals, XT-hypergraphs and r-exact hypergraphs,
- SFC/PLC prototyping,
- max-plus timing analysis and throughput estimation,
- fuzzy exact transversals and structurally generated Takagi-Sugeno max-plus rules.
- CPU/GPU benchmark reporting for selected heavy algorithms, including WebGPU-enabled P-invariant and XTREC checks, CPU fallback, `xCPU` speedups and browser/platform metadata.
- PNH library profiling and deterministic representative-sample selection for large benchmark collections, including file size, Petri-net dimensions, arc density and parser warnings/errors.

## Requirements

- PHP 8.1+ for the web application and local API endpoints.
- Modern browser with JavaScript enabled.
- Node.js 18+ for reproducibility tests, example scripts and browser smoke tests.

## Languages

The user interface, validation errors, algorithm progress messages and
human-readable research reports are available in English and Polish. English
is the deterministic fallback; on the first request the application can honor
the browser's `Accept-Language` preference. The language selector in the
application header persists the explicit choice in browser storage and a
cookie so that PHP endpoints, the main browser thread and Web Workers use the
same language. Select English explicitly for publication workflows.

Translations are maintained centrally in `locales/en.json` and
`locales/pl.json`. Command-line reports can select a language with
`POOH_LANGUAGE=en` or `POOH_LANGUAGE=pl`.

## Deployment Configuration

Global deployment and feature settings live in `config/app.php`, with the
publication-safe baseline preserved in `config/app.default.php`. The tracked
configuration uses `public` mode, which forces the `Research team` menu and
author/metrics API surface off. Deployment-specific settings can be placed in
the ignored `config/app.local.php` file or supplied through
`POOH_DEPLOYMENT_MODE` and `POOH_RESEARCH_TEAM_ENABLED`.

For an internal installation, create `config/app.local.php` with:

```php
<?php
return [
    'deployment' => ['mode' => 'internal'],
    'features' => ['researchTeam' => true],
];
```

Then populate `accesses/authors.csv` and `accesses/scholar_metrics.json` from
the documented templates. The complete field reference and administrator setup
are described in [docs/installation.md](docs/installation.md#research-team-data).

Access-file templates are stored next to their active counterparts under
`accesses/`. `users.default.csv` contains a disabled `admin` row with a password
hash placeholder; no predictable administrator password is distributed. The
author and metrics templates contain matching, explicitly fictional example
records that demonstrate the supported schema.

## Installation

```bash
git clone https://github.com/r3ithh/POOH.git
cd POOH
npm ci
npm test
```

## Run the Application

```bash
php -S 127.0.0.1:8000
```

Open [http://127.0.0.1:8000](http://127.0.0.1:8000).

This preserves the current lightweight deployment model: PHP built-in server plus static JavaScript assets.

## First Example in 5 Minutes

1. Start the app with `php -S 127.0.0.1:8000`.
2. Open the application in a browser and select English if needed.
3. Import `examples/small_petri_net/input.pnh`.
4. Go to `Analysis`.
5. Run `(1) Compute p-invariants`.
6. Run `(2) Compute selection hypergraph (XTREC)`.
7. Use `Draw hypergraph` to visualize the selection hypergraph before or after FRA.

Expected: the small model loads, PNH parsing succeeds, and the analysis pipeline can be exercised without using server-side uploaded libraries.

## Input Data Format

POOH uses `.pnh` files. Two PNH variants are supported:

- **Matrix format**: number of places, number of transitions, transition/place incidence rows, initial marking row, optional metadata lines beginning with `;`.
- **Section format**: `PNH 1.0` with `[PLACES]`, `[TRANSITIONS]`, `[ARCS]`, `[MARKING]`.

See [docs/input_output_formats.md](docs/input_output_formats.md).

## Main Modules

- `index.php` - application shell and HTML UI.
- `config/` and `src/AppConfig.php` - deployment mode and server-enforced
  feature configuration.
- `library_api.php` - server-side PNH libraries, documentation data and research-run persistence.
- `export_pnh.php` and `src/PnhExporter.php` - server-side PNH export.
- `locales/`, `src/I18n.php`, `src/core/i18n.js` and
  `src/core/worker-i18n.js` - shared English/Polish message catalogs and runtime
  adapters for PHP, browser, Node.js and Web Workers.
- `public/app.js` - current browser application controller, visualization and research UI.
- `public/*-worker.js` - web worker adapters for P-invariants, XTREC, transversal solving, SFC/max-plus and generation.
- `public/hypergraph-structural-xt.js` - structural XT condition checker.
- `src/core/` - testable research-core modules used by tests, examples and selected browser UI adapters, including PNH parsing/import layout, P-invariant computation, selection-hypergraph construction, XTREC recognition, manual hypergraph analysis, transversal solving, random generation, SFC/(max,+) synthesis, decomposition-view entry/data preparation, decomposition SVG rendering helpers, report/export formatting and benchmark reporting.
- `tests/` - reproducibility and algorithmic smoke tests.
- `examples/` - reviewer-friendly example cases.
- `RELEASE_MANIFEST.md` - public-release contents, exclusions and validation commands.

## Tests

```bash
npm test
npm run examples
npm run ci
```

Large local PNH libraries can be profiled without running the heavy algorithms:

```bash
npm run profile:library -- lib_55033290a3fc3aa4 /tmp/pooh-library-profile.csv
npm run profile:library -- lib_55033290a3fc3aa4 /tmp/pooh-library-profile.csv --sample=12 --sample-output=/tmp/pooh-library-sample.csv
```

Browser smoke tests use Playwright and start the local PHP app automatically:

```bash
npx playwright install chromium
npm run test:browser
```

Additional syntax checks are also available separately:

```bash
npm run check
npm run check:php
```

## Citation

Use the metadata in [CITATION.cff](CITATION.cff). Before the first public
release, replace the marked GitHub-login and ORCID placeholders and confirm the
release date. Add the Zenodo version and concept DOIs only after Zenodo has
archived the tagged release.

## License

The repository is prepared with the MIT License. Confirm this choice before public archival release if institutional or third-party constraints apply.

## Documentation

- [Installation](docs/installation.md)
- [User Guide](docs/user_guide.md)
- [Developer Guide](docs/developer_guide.md)
- [Input and Output Formats](docs/input_output_formats.md)
- [Algorithms](docs/algorithms.md)
- [Reviewer Guide](docs/reviewer_guide.md)
- [Release Manifest](RELEASE_MANIFEST.md)
