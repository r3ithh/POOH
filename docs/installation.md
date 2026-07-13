# Installation

## Requirements

- PHP 8.1 or newer.
- Node.js 18 or newer for tests.
- A modern desktop browser.

## Local Setup

Run these commands from the repository root:

```bash
npm ci
npm test
php -S 127.0.0.1:8000
```

Open `http://127.0.0.1:8000`.

## Full Local Validation

```bash
npm run ci
npx playwright install chromium
npm run test:browser
```

`npm run test:browser` uses Playwright and starts the PHP built-in server automatically when no compatible local server is already running.

## Data Directories

- `data/pnh_libraries/` stores server-side PNH libraries.
- `data/research_runs/` stores saved research experiments.
- `accesses/` stores local authentication/audit support data.

Public releases should contain only empty default configuration in these
directories. Before a public deployment, protect `accesses/` at the web-server
level and do not use the PHP built-in development server as an Internet-facing
service.

## Deployment Mode and Features

`config/app.php` is the active global configuration and
`config/app.default.php` is the publication-safe baseline. The default release
uses `public` mode:

```php
return [
    'deployment' => ['mode' => 'public'],
    'features' => ['researchTeam' => false],
];
```

Public mode always suppresses the `Research team` menu, its metrics editor and
the author data returned by the public API. A deployment-specific,
version-control-ignored `config/app.local.php` can enable the module only for an
internal or development installation:

```php
return [
    'deployment' => ['mode' => 'internal'],
    'features' => ['researchTeam' => true],
];
```

Equivalent environment overrides are `POOH_DEPLOYMENT_MODE=internal` and
`POOH_RESEARCH_TEAM_ENABLED=true`. Public mode remains authoritative even when
the feature flag is accidentally enabled.

After changing the configuration, reload the application. With both settings
enabled, the `Research team` item, author profiles and metrics editor are
rendered. Setting either the deployment mode back to `public` or the feature
flag to `false` disables the complete module, including its API operations.

## Authentication Setup

No enabled user account or default password is created automatically. Public
analysis remains available, while authenticated library-management operations
require an enabled user row in `accesses/users.csv`.

The following reset templates are included:

- `accesses/users.default.csv` - disabled `admin` account template,
- `accesses/authors.default.csv` - research-team schema with a fictional author,
- `accesses/turnstile.default.json` - disabled Cloudflare Turnstile settings,
- `accesses/scholar_metrics.default.json` - metrics matching the fictional author.

When an active access file is missing, the API initializes it from its matching
`.default` template. Existing active files are never overwritten.

Generate a bcrypt password hash locally:

```bash
php -r '$password = trim(fgets(STDIN)); echo password_hash($password, PASSWORD_BCRYPT), PHP_EOL;'
```

Set the generated hash in the administrator row and change `enabled` to `1`:

```text
admin,PASTE_GENERATED_BCRYPT_HASH_HERE,Administrator,admin,1
```

Never commit populated access files, audit logs or Turnstile secrets to a
public repository.

## Research Team Data

The author and metrics templates use the shared identifier `example_author`.
The record is fictional and exists only to document the file contract. For an
internal deployment, replace it with project data in the active
`accesses/authors.csv` and `accesses/scholar_metrics.json` files. Keep the
`.default` files as recoverable examples.

### `authors.csv` columns

| Column | Required | Meaning |
| --- | --- | --- |
| `id` | yes | Stable, unique author identifier. It is also the top-level key in `scholar_metrics.json`. |
| `full_name_pl` | one name | Polish display name. |
| `full_name_en` | one name | English display name; falls back to the Polish name when empty. |
| `degree_pl` | no | Academic degree/title displayed in Polish. |
| `degree_en` | no | Academic degree/title displayed in English. |
| `emails` | no | One or more addresses; use semicolons between values. |
| `unit_pl` | no | Polish institution/unit names; semicolon-separated when there is more than one. |
| `unit_en` | no | English institution/unit names; semicolon-separated when there is more than one. |
| `project_role_pl` | no | Polish project roles; semicolon-separated. |
| `project_role_en` | no | English project roles; semicolon-separated. |
| `research_area_pl` | no | Polish research keywords; semicolon-separated. |
| `research_area_en` | no | English research keywords; semicolon-separated. |
| `orcid` | no | Bare ORCID identifier, for example `0000-0000-0000-0000`, without the URL prefix. |
| `google_scholar` | no | Complete Google Scholar profile URL containing the `user` query parameter. |
| `researchgate` | no | Complete ResearchGate profile URL. |
| `wos` | no | Web of Science author-record identifier, without the URL prefix. |
| `website` | no | Complete personal or institutional website URL. |

CSV values containing commas must be enclosed in double quotes. Semicolons are
recommended for multi-value fields because they remain unambiguous in CSV.

### `scholar_metrics.json` fields

The root JSON object is keyed by the author `id`. Each author can contain a
`googleScholar` object, a `wos` object, or both. Each source supports:

| Field | Type | Meaning |
| --- | --- | --- |
| `articles` | non-negative integer or `null` | Number of indexed publications. |
| `citations` | non-negative integer or `null` | Citation count. |
| `hIndex` | non-negative integer or `null` | h-index reported by the source. |
| `i10Index` | non-negative integer or `null` | i10-index; use `null` when the source does not report it. |
| `updatedAt` | ISO 8601 string | Time at which the source data was collected or entered. |

The metrics editor writes the same structure. Google Scholar values can also be
refreshed by POOH when `google_scholar` contains a valid profile URL; Web of
Science values are currently entered through the editor.

### `users.csv` columns

| Column | Required | Meaning |
| --- | --- | --- |
| `username` | yes | Unique login name. |
| `password_hash` | yes | Bcrypt hash generated locally; never store a plaintext password. |
| `display_name` | no | Name shown for the authenticated user. |
| `role` | no | Deployment role label, normally `admin`. |
| `enabled` | yes for new files | Boolean account switch. Use `1` to enable and `0` to disable. |

To activate the complete internal module:

1. Enable `internal` mode and `researchTeam` in `config/app.local.php`.
2. Replace the fictional records in the active author and metrics files.
3. Generate an administrator password hash and set `enabled` to `1` in
   `accesses/users.csv` when metrics editing or library management is needed.
4. Protect the `accesses/` directory at the web-server level and use HTTPS.
