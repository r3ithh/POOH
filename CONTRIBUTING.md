# Contributing

POOH is research software. Contributions should preserve reproducibility and avoid changing mathematical behavior without tests.

## Development Workflow

1. Create a focused branch.
2. Run:

   ```bash
   npm test
   npm run check
   php -l index.php
   php -l library_api.php
   php -l export_pnh.php
   ```

3. Document algorithmic changes in `docs/algorithms.md`.
4. Add or update examples when a feature affects published workflows.
5. Update `CHANGELOG.md`.

## Coding Guidelines

- Keep UI changes separate from algorithmic changes when possible.
- Prefer deterministic, testable functions in `src/core/`.
- Do not rewrite worker algorithms without preserving benchmark/regression behavior.
- Do not remove PNH examples or runtime data without author approval.

## Reporting Issues

For scientific issues, include:

- input `.pnh` file,
- steps to reproduce,
- expected and observed result,
- browser/PHP/Node versions,
- whether the issue affects a publication figure/table.
