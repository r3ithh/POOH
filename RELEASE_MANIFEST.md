# POOH v1.0.0 Release Manifest

This directory is the curated POOH v1.0.0 research-software snapshot prepared
for publication as a public repository and Zenodo/SoftwareX artifact.

## Included

- Browser/PHP application entry points: `index.php`, `library_api.php`,
  `export_pnh.php`, `update_metrics.php`.
- Client application code and workers: `public/`.
- Extracted reusable research core: `src/`.
- Shared English/Polish message catalogs and runtime adapters: `locales/`,
  `src/I18n.php`, `src/core/i18n.js`, `src/core/worker-i18n.js`.
- Publication-safe deployment configuration: `config/`, `src/AppConfig.php`.
- Documentation: `README.md`, `docs/`, `CONTRIBUTING.md`, `CHANGELOG.md`.
- Citation and licensing metadata: `CITATION.cff`, `LICENSE`.
- Reproducible examples: `examples/`.
- Minimal public PNH library fixture: `data/pnh_libraries/lib_softwarex_examples/`.
- Empty research-run placeholder: `data/research_runs/.gitkeep`.
- Tests, CI and reproducibility scripts: `tests/`, `scripts/`,
  `playwright.config.js`, `.github/`.
- Batch XT-condition analysis: `scripts/analyze_pnh_xt_conditions.js`, using
  the bundled PNH fixture by default.
- Sanitized default access configuration under `accesses/`, with no real
  users, passwords, Turnstile secrets or private access logs. Matching
  `.default` templates include a disabled administrator placeholder and a
  clearly fictional author/metrics pair documenting the internal-team schema.

## Deliberately Excluded

- `node_modules/` and other generated dependency directories.
- `test-results/` and browser test reports.
- `.git/`, local Codex/agent folders and operating-system files such as
  `.DS_Store`.
- LaTeX auxiliary build files: `*.aux`, `*.log`, `*.out`, `*.spl`.
- Local access audit logs from `accesses/logs/`.
- Third-party or externally sourced PNH libraries that are not authored by the
  project author.
- Author-only article workspace, editorial notes and generated figures:
  `softwarex/`.
- Article-figure generator: `scripts/generate_softwarex_figures.js`.
- Internal deployment/IP strategy note: `docs/ip_protection_strategy.md`.

## Validation Commands

From this directory:

```bash
npm ci
npm run ci
npm run analyze:xt-conditions -- --limit=3 > /tmp/pooh-xt-conditions.csv
npm run test:browser
php -S 127.0.0.1:8000
```

The release is intended to be archived as `v1.0.0` and described as a stable,
citable research snapshot of an actively developed project.
