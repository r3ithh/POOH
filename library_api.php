<?php
declare(strict_types=1);

require_once __DIR__ . '/src/I18n.php';
require_once __DIR__ . '/src/AppConfig.php';

$appConfig = PoohAppConfig::load(__DIR__);

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start([
        'cookie_httponly' => true,
        'cookie_secure'   => (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
        'cookie_samesite' => 'Strict',
    ]);
}

// ---------------------------------------------------------------------------
// Security headers — emitted on every API response
// ---------------------------------------------------------------------------
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: no-referrer');
header('X-XSS-Protection: 1; mode=block');

function json_response(array $payload, int $statusCode = 200): void
{
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/** @param array<string,scalar|null> $params */
function api_t(string $key, array $params = []): string
{
    return PoohI18n::translate($key, $params);
}

function research_team_enabled(): bool
{
    global $appConfig;
    return PoohAppConfig::researchTeamEnabled(is_array($appConfig) ? $appConfig : []);
}

// ---------------------------------------------------------------------------
// Audit logging
// ---------------------------------------------------------------------------
function audit_log(string $action, string $details = ''): void
{
    $logDir = __DIR__ . '/accesses/logs';
    if (!is_dir($logDir) && !mkdir($logDir, 0775, true) && !is_dir($logDir)) {
        return; // silently fail — do not break the request
    }
    $logFile = $logDir . '/audit_' . date('Y-m') . '.log';
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $user = $_SESSION['pooh_auth_user']['username'] ?? 'anonymous';
    $line = sprintf(
        "[%s] ip=%s user=%s action=%s %s\n",
        date(DATE_ATOM),
        $ip,
        $user,
        $action,
        $details
    );
    @file_put_contents($logFile, $line, FILE_APPEND | LOCK_EX);
}

// ---------------------------------------------------------------------------
// CSRF token management
// ---------------------------------------------------------------------------
function csrf_token(): string
{
    if (empty($_SESSION['pooh_csrf_token'])) {
        $_SESSION['pooh_csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['pooh_csrf_token'];
}

function validate_csrf_token(): void
{
    $token = (string) ($_POST['csrf_token'] ?? $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '');
    if ($token === '' || !hash_equals(csrf_token(), $token)) {
        audit_log('csrf_fail', 'Invalid or missing CSRF token');
        json_response(['ok' => false, 'error' => api_t('api.csrfInvalid')], 403);
    }
}

// ---------------------------------------------------------------------------
// Rate limiting (file-based, per IP)
// ---------------------------------------------------------------------------
function rate_limit_check(string $action, int $maxAttempts = 5, int $windowSeconds = 900): bool
{
    $rateDir = __DIR__ . '/accesses/rate_limits';
    if (!is_dir($rateDir) && !mkdir($rateDir, 0775, true) && !is_dir($rateDir)) {
        return true; // fail open if cannot create dir
    }

    $ip = preg_replace('/[^a-fA-F0-9.:_-]/', '_', $_SERVER['REMOTE_ADDR'] ?? 'unknown');
    $file = $rateDir . '/' . $action . '_' . md5($ip) . '.json';
    $now = time();

    $attempts = [];
    if (is_file($file)) {
        $raw = file_get_contents($file);
        if ($raw !== false) {
            $decoded = json_decode($raw, true);
            if (is_array($decoded)) {
                $attempts = $decoded;
            }
        }
    }

    // Remove expired attempts
    $attempts = array_values(array_filter($attempts, static fn(int $ts): bool => ($now - $ts) < $windowSeconds));

    if (count($attempts) >= $maxAttempts) {
        return false; // rate limited
    }

    $attempts[] = $now;
    file_put_contents($file, json_encode($attempts), LOCK_EX);
    return true;
}

function rate_limit_clear(string $action): void
{
    $rateDir = __DIR__ . '/accesses/rate_limits';
    $ip = preg_replace('/[^a-fA-F0-9.:_-]/', '_', $_SERVER['REMOTE_ADDR'] ?? 'unknown');
    $file = $rateDir . '/' . $action . '_' . md5($ip) . '.json';
    if (is_file($file)) {
        @unlink($file);
    }
}

// ---------------------------------------------------------------------------
// Data directories
// ---------------------------------------------------------------------------
function ensure_data_root(): string
{
    $root = __DIR__ . '/data/pnh_libraries';
    if (!is_dir($root) && !mkdir($root, 0775, true) && !is_dir($root)) {
        throw new RuntimeException(api_t('api.libraryDataDirectoryCreateFailed'));
    }
    return $root;
}

// ---------------------------------------------------------------------------
// Documentation (system description, algorithms, articles)
// ---------------------------------------------------------------------------
function docs_path(): string
{
    $root = __DIR__ . '/data';
    if (!is_dir($root) && !mkdir($root, 0775, true) && !is_dir($root)) {
        throw new RuntimeException(api_t('api.dataDirectoryCreateFailed'));
    }
    return $root . '/docs.json';
}

/**
 * @return array<string,mixed>
 */
function default_docs(): array
{
    return [
        'description' => [
            'en' => PoohI18n::translate('docs.default.description', [], 'en'),
            'pl' => PoohI18n::translate('docs.default.description', [], 'pl'),
        ],
        'algorithms' => [
            [
                'id' => 'alg-msa',
                'name' => ['en' => PoohI18n::translate('docs.algorithm.martinezName', [], 'en'), 'pl' => PoohI18n::translate('docs.algorithm.martinezName', [], 'pl')],
                'description' => [
                    'en' => PoohI18n::translate('docs.algorithm.martinezDescription', [], 'en'),
                    'pl' => PoohI18n::translate('docs.algorithm.martinezDescription', [], 'pl'),
                ],
                'complexity' => 'Exponential worst case; practical on real-world nets',
                'references' => 'Martinez J., Silva M., 1980',
            ],
            [
                'id' => 'alg-xtrec',
                'name' => ['en' => PoohI18n::translate('docs.algorithm.xtrecName', [], 'en'), 'pl' => PoohI18n::translate('docs.algorithm.xtrecName', [], 'pl')],
                'description' => [
                    'en' => PoohI18n::translate('docs.algorithm.xtrecDescription', [], 'en'),
                    'pl' => PoohI18n::translate('docs.algorithm.xtrecDescription', [], 'pl'),
                ],
                'complexity' => 'Polynomial',
                'references' => '',
            ],
            [
                'id' => 'alg-fra',
                'name' => ['en' => PoohI18n::translate('docs.algorithm.fraName', [], 'en'), 'pl' => PoohI18n::translate('docs.algorithm.fraName', [], 'pl')],
                'description' => [
                    'en' => PoohI18n::translate('docs.algorithm.fraDescription', [], 'en'),
                    'pl' => PoohI18n::translate('docs.algorithm.fraDescription', [], 'pl'),
                ],
                'complexity' => 'Polynomial',
                'references' => '',
            ],
            [
                'id' => 'alg-ts-maxplus-fuzzy',
                'name' => ['en' => PoohI18n::translate('docs.algorithm.fuzzyName', [], 'en'), 'pl' => PoohI18n::translate('docs.algorithm.fuzzyName', [], 'pl')],
                'description' => [
                    'en' => PoohI18n::translate('docs.algorithm.fuzzyDescription', [], 'en'),
                    'pl' => PoohI18n::translate('docs.algorithm.fuzzyDescription', [], 'pl'),
                ],
                'complexity' => 'Structural scoring is polynomial; alpha-cut exact cover and exact max E(T) enumeration are exponential in the selected cover instance, with beam search fallback for larger instances',
                'references' => 'Takagi-Sugeno fuzzy models; max-plus discrete event systems; XT/r-exact decomposition',
            ],
        ],
        'articles' => [
            [
                'id' => 'art-1',
                'title' => 'Decomposition of Petri nets via XT-hypergraphs',
                'authors' => 'Authors TBA',
                'year' => 2024,
                'venue' => '',
                'doi' => '',
                'url' => '',
                'abstract' => 'Placeholder — administrator should fill in actual publications related to POOH.',
            ],
        ],
        'updatedAt' => date(DATE_ATOM),
    ];
}

/**
 * @return array<string,mixed>
 */
function load_docs(): array
{
    $path = docs_path();
    if (!is_file($path)) {
        return default_docs();
    }
    $raw = file_get_contents($path);
    if ($raw === false || trim($raw) === '') {
        return default_docs();
    }
    try {
        $decoded = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
        if (!is_array($decoded)) {
            return default_docs();
        }
    } catch (Throwable $exception) {
        return default_docs();
    }
    // Merge with defaults to ensure all expected keys exist
    $defaults = default_docs();
    foreach (['description', 'algorithms', 'articles'] as $key) {
        if (!isset($decoded[$key])) {
            $decoded[$key] = $defaults[$key];
        }
    }
    return $decoded;
}

function sanitize_docs_string(string $value, int $maxLen = 8000): string
{
    $trimmed = trim($value);
    // Reject control chars except \n, \r, \t
    $trimmed = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F]/u', '', $trimmed) ?? '';
    return mb_substr($trimmed, 0, $maxLen, 'UTF-8');
}

/**
 * @param array<string,mixed> $payload
 * @return array<string,mixed>
 */
function sanitize_docs_payload(array $payload): array
{
    $description = is_array($payload['description'] ?? null) ? $payload['description'] : [];
    $algorithms = is_array($payload['algorithms'] ?? null) ? $payload['algorithms'] : [];
    $articles = is_array($payload['articles'] ?? null) ? $payload['articles'] : [];

    $sanitizedDescription = [
        'en' => sanitize_docs_string((string) ($description['en'] ?? ''), 8000),
        'pl' => sanitize_docs_string((string) ($description['pl'] ?? ''), 8000),
    ];

    $sanitizedAlgorithms = [];
    foreach (array_slice($algorithms, 0, 100) as $alg) {
        if (!is_array($alg)) {
            continue;
        }
        $name = is_array($alg['name'] ?? null) ? $alg['name'] : [];
        $description2 = is_array($alg['description'] ?? null) ? $alg['description'] : [];
        $sanitizedAlgorithms[] = [
            'id' => preg_replace('/[^a-zA-Z0-9_-]/', '', (string) ($alg['id'] ?? '')) ?: ('alg-' . bin2hex(random_bytes(4))),
            'name' => [
                'en' => sanitize_docs_string((string) ($name['en'] ?? ''), 200),
                'pl' => sanitize_docs_string((string) ($name['pl'] ?? ''), 200),
            ],
            'description' => [
                'en' => sanitize_docs_string((string) ($description2['en'] ?? ''), 3000),
                'pl' => sanitize_docs_string((string) ($description2['pl'] ?? ''), 3000),
            ],
            'complexity' => sanitize_docs_string((string) ($alg['complexity'] ?? ''), 200),
            'references' => sanitize_docs_string((string) ($alg['references'] ?? ''), 500),
        ];
    }

    $sanitizedArticles = [];
    foreach (array_slice($articles, 0, 200) as $art) {
        if (!is_array($art)) {
            continue;
        }
        $year = filter_var($art['year'] ?? '', FILTER_VALIDATE_INT, ['options' => ['min_range' => 1900, 'max_range' => 2100]]);
        $url = trim((string) ($art['url'] ?? ''));
        if ($url !== '' && !preg_match('#^https?://#i', $url)) {
            $url = '';
        }
        $sanitizedArticles[] = [
            'id' => preg_replace('/[^a-zA-Z0-9_-]/', '', (string) ($art['id'] ?? '')) ?: ('art-' . bin2hex(random_bytes(4))),
            'title' => sanitize_docs_string((string) ($art['title'] ?? ''), 500),
            'authors' => sanitize_docs_string((string) ($art['authors'] ?? ''), 500),
            'year' => $year !== false ? (int) $year : null,
            'venue' => sanitize_docs_string((string) ($art['venue'] ?? ''), 300),
            'doi' => sanitize_docs_string((string) ($art['doi'] ?? ''), 200),
            'url' => $url,
            'abstract' => sanitize_docs_string((string) ($art['abstract'] ?? ''), 4000),
        ];
    }

    return [
        'description' => $sanitizedDescription,
        'algorithms' => $sanitizedAlgorithms,
        'articles' => $sanitizedArticles,
        'updatedAt' => date(DATE_ATOM),
    ];
}

function save_docs(array $docs): void
{
    $json = json_encode($docs, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    $result = file_put_contents(docs_path(), $json . "\n", LOCK_EX);
    if ($result === false) {
        throw new RuntimeException(api_t('api.documentationSaveFailed'));
    }
}

function validate_library_id(string $id): bool
{
    return (bool) preg_match('/^[a-zA-Z0-9_-]{6,64}$/', $id);
}

function normalize_name(string $name, string $fallback): string
{
    $normalized = trim(preg_replace('/\s+/u', ' ', $name) ?? '');
    if ($normalized === '') {
        return $fallback;
    }
    return substr($normalized, 0, 120);
}

function library_dir(string $libraryId): string
{
    return ensure_data_root() . '/' . $libraryId;
}

function library_meta_path(string $libraryId): string
{
    return library_dir($libraryId) . '/library.json';
}

function library_files_dir(string $libraryId): string
{
    return library_dir($libraryId) . '/files';
}

function assert_library_exists(string $libraryId): void
{
    if (!validate_library_id($libraryId)) {
        throw new InvalidArgumentException(api_t('api.libraryIdInvalid'));
    }
    if (!is_dir(library_dir($libraryId))) {
        throw new InvalidArgumentException(api_t('api.libraryNotFound'));
    }
}

/**
 * @return array<string,mixed>
 */
function read_library_meta(string $libraryId): array
{
    $metaPath = library_meta_path($libraryId);
    if (!is_file($metaPath)) {
        return [
            'id' => $libraryId,
            'name' => $libraryId,
            'createdAt' => date(DATE_ATOM),
            'updatedAt' => date(DATE_ATOM),
        ];
    }

    $raw = file_get_contents($metaPath);
    if ($raw === false || trim($raw) === '') {
        return [
            'id' => $libraryId,
            'name' => $libraryId,
            'createdAt' => date(DATE_ATOM),
            'updatedAt' => date(DATE_ATOM),
        ];
    }

    try {
        $decoded = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
        if (!is_array($decoded)) {
            throw new RuntimeException(api_t('api.jsonInvalid'));
        }
    } catch (Throwable $exception) {
        return [
            'id' => $libraryId,
            'name' => $libraryId,
            'createdAt' => date(DATE_ATOM),
            'updatedAt' => date(DATE_ATOM),
        ];
    }

    $decoded['id'] = $libraryId;
    $decoded['name'] = normalize_name((string) ($decoded['name'] ?? ''), $libraryId);
    $decoded['createdAt'] = (string) ($decoded['createdAt'] ?? date(DATE_ATOM));
    $decoded['updatedAt'] = (string) ($decoded['updatedAt'] ?? date(DATE_ATOM));
    return $decoded;
}

/**
 * @param array<string,mixed> $meta
 */
function save_library_meta(string $libraryId, array $meta): void
{
    $metaPath = library_meta_path($libraryId);
    $payload = [
        'id' => $libraryId,
        'name' => normalize_name((string) ($meta['name'] ?? ''), $libraryId),
        'createdAt' => (string) ($meta['createdAt'] ?? date(DATE_ATOM)),
        'updatedAt' => (string) ($meta['updatedAt'] ?? date(DATE_ATOM)),
    ];
    $encoded = json_encode(
        $payload,
        JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR
    );
    file_put_contents($metaPath, $encoded . PHP_EOL, LOCK_EX);
}

function safe_uploaded_file_name(string $originalName, string $targetDirectory): string
{
    $base = pathinfo($originalName, PATHINFO_FILENAME);
    $base = preg_replace('/[^a-zA-Z0-9._-]+/', '_', $base) ?? '';
    $base = trim($base, '._-');
    if ($base === '') {
        $base = 'model';
    }
    $base = substr($base, 0, 80);

    $candidate = $base . '.pnh';
    $counter = 2;
    while (is_file($targetDirectory . '/' . $candidate)) {
        $candidate = $base . '-' . $counter . '.pnh';
        $counter += 1;
    }
    return $candidate;
}

function ensure_accesses_root(): string
{
    $root = __DIR__ . '/accesses';
    if (!is_dir($root) && !mkdir($root, 0775, true) && !is_dir($root)) {
        throw new RuntimeException(api_t('api.accessDirectoryCreateFailed'));
    }
    return $root;
}

function users_csv_path(): string
{
    return ensure_accesses_root() . '/users.csv';
}

function load_turnstile_config(): array
{
    $path = ensure_accesses_root() . '/turnstile.json';
    if (!is_file($path)) {
        return ['enabled' => false, 'siteKey' => '', 'secretKey' => ''];
    }
    $raw = file_get_contents($path);
    if ($raw === false) {
        return ['enabled' => false, 'siteKey' => '', 'secretKey' => ''];
    }
    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        return ['enabled' => false, 'siteKey' => '', 'secretKey' => ''];
    }
    return [
        'enabled' => !empty($decoded['enabled']),
        'siteKey' => (string) ($decoded['siteKey'] ?? ''),
        'secretKey' => (string) ($decoded['secretKey'] ?? ''),
    ];
}

function scholar_metrics_path(): string
{
    return ensure_accesses_root() . '/scholar_metrics.json';
}

function load_scholar_metrics(): array
{
    $path = scholar_metrics_path();
    if (!is_file($path)) {
        return [];
    }
    $raw = file_get_contents($path);
    if ($raw === false) {
        return [];
    }
    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        return [];
    }
    return $decoded;
}

function save_scholar_metrics(array $metrics): void
{
    $json = json_encode($metrics, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) {
        throw new RuntimeException(api_t('api.metricsJsonEncodeFailed'));
    }
    $result = file_put_contents(scholar_metrics_path(), $json . "\n", LOCK_EX);
    if ($result === false) {
        throw new RuntimeException(api_t('api.metricsSaveFailed'));
    }
}

/**
 * Extract Google Scholar user ID from profile URL.
 */
function extract_scholar_user_id(string $url): string
{
    if ($url === '') {
        return '';
    }
    $parsed = parse_url($url);
    if (!isset($parsed['query'])) {
        return '';
    }
    parse_str($parsed['query'], $params);
    return trim($params['user'] ?? '');
}

/**
 * Fetch a URL using cURL (preferred) or file_get_contents (fallback).
 * Returns HTML string or false on failure.
 *
 * @return string|false
 */
function scholar_http_get(string $url, int $timeout = 15)
{
    $headers = [
        'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept: text/html,application/xhtml+xml',
        'Accept-Language: en-US,en;q=0.9',
    ];

    // Prefer cURL
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        if ($ch !== false) {
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_MAXREDIRS => 3,
                CURLOPT_TIMEOUT => $timeout,
                CURLOPT_CONNECTTIMEOUT => 10,
                CURLOPT_HTTPHEADER => $headers,
                CURLOPT_SSL_VERIFYPEER => true,
                CURLOPT_SSL_VERIFYHOST => 2,
                CURLOPT_ENCODING => '',
            ]);
            $html = curl_exec($ch);
            $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            if (is_string($html) && $httpCode === 200 && $html !== '') {
                return $html;
            }
        }
    }

    // Fallback to file_get_contents
    if (ini_get('allow_url_fopen')) {
        $context = stream_context_create([
            'http' => [
                'method' => 'GET',
                'header' => implode("\r\n", $headers),
                'timeout' => $timeout,
                'ignore_errors' => true,
            ],
            'ssl' => [
                'verify_peer' => true,
                'verify_peer_name' => true,
            ],
        ]);
        $html = @file_get_contents($url, false, $context);
        if (is_string($html) && $html !== '') {
            return $html;
        }
    }

    return false;
}

/**
 * Count article rows (<tr class="gsc_a_tr">) on a Scholar page.
 */
function scholar_count_article_rows(string $html): int
{
    if (preg_match_all('/<tr class="gsc_a_tr"/', $html, $m)) {
        return count($m[0]);
    }
    return 0;
}

/**
 * Parse citation stats table (id="gsc_rsb_st") from Scholar HTML.
 *
 * @return array{citations: ?int, hIndex: ?int, i10Index: ?int}
 */
function scholar_parse_stats_table(string $html): array
{
    $result = ['citations' => null, 'hIndex' => null, 'i10Index' => null];

    if (!preg_match('/<table id="gsc_rsb_st"[^>]*>(.*?)<\/table>/s', $html, $tableMatch)) {
        return $result;
    }

    if (!preg_match_all('/<tr[^>]*>(.*?)<\/tr>/s', $tableMatch[1], $rowMatches)) {
        return $result;
    }

    foreach ($rowMatches[1] as $rowHtml) {
        if (!preg_match_all('/<td[^>]*>(.*?)<\/td>/s', $rowHtml, $cellMatches)) {
            continue;
        }
        $cells = array_map('strip_tags', $cellMatches[1]);
        if (count($cells) < 2) {
            continue;
        }
        $label = strtolower(trim($cells[0]));
        $allValue = (int) trim($cells[1]);
        if (strpos($label, 'citation') !== false) {
            $result['citations'] = $allValue;
        } elseif (strpos($label, 'h-index') !== false || strpos($label, 'h index') !== false) {
            $result['hIndex'] = $allValue;
        } elseif (strpos($label, 'i10') !== false) {
            $result['i10Index'] = $allValue;
        }
    }

    return $result;
}

/**
 * Fetch Google Scholar metrics for a given user ID.
 *
 * Retrieves citations, h-index and i10-index from the stats sidebar.
 * Counts total articles by paginating through the profile (pagesize=100)
 * to handle authors with more than 20 publications.
 *
 * @return array{articles: ?int, citations: ?int, hIndex: ?int, i10Index: ?int}|null
 */
function fetch_scholar_metrics(string $userId): ?array
{
    $baseUrl = 'https://scholar.google.com/citations?user=' . urlencode($userId) . '&hl=en';
    $pageSize = 100;   // max allowed by Scholar
    $maxPages = 10;    // safety limit (up to 1000 articles)
    $delayBetweenPages = 1; // seconds between paginated requests

    // ── First page: stats table + first batch of articles ──
    $firstPageUrl = $baseUrl . '&cstart=0&pagesize=' . $pageSize;
    $html = scholar_http_get($firstPageUrl);
    if (!is_string($html) || $html === '') {
        return null;
    }

    // Parse citation metrics from the sidebar stats table
    $stats = scholar_parse_stats_table($html);
    if ($stats['citations'] === null && $stats['hIndex'] === null) {
        return null;
    }

    // ── Count total articles across all pages ──
    $totalArticles = scholar_count_article_rows($html);
    $firstPageCount = $totalArticles;

    // If the first page is full, there may be more pages
    if ($firstPageCount >= $pageSize) {
        for ($page = 1; $page < $maxPages; $page++) {
            $cstart = $page * $pageSize;
            $pageUrl = $baseUrl . '&cstart=' . $cstart . '&pagesize=' . $pageSize;

            if ($delayBetweenPages > 0) {
                sleep($delayBetweenPages);
            }

            $pageHtml = scholar_http_get($pageUrl);
            if (!is_string($pageHtml) || $pageHtml === '') {
                break;
            }

            $rowsOnPage = scholar_count_article_rows($pageHtml);
            if ($rowsOnPage === 0) {
                break;
            }

            $totalArticles += $rowsOnPage;

            // If this page wasn't full, we've reached the end
            if ($rowsOnPage < $pageSize) {
                break;
            }
        }
    }

    return [
        'articles'  => $totalArticles > 0 ? $totalArticles : null,
        'citations' => $stats['citations'],
        'hIndex'    => $stats['hIndex'],
        'i10Index'  => $stats['i10Index'],
    ];
}

/**
 * Run metrics update for all authors. Returns a log of actions taken.
 *
 * @return array{updated: int, skipped: int, failed: int, log: string[]}
 */
function run_metrics_update(): array
{
    $authors = list_authors();
    $metrics = load_scholar_metrics();
    $log = [];
    $updated = 0;
    $skipped = 0;
    $failed = 0;

    foreach ($authors as $author) {
        $id = $author['id'];
        $scholarUrl = $author['googleScholar'] ?? '';
        $userId = extract_scholar_user_id($scholarUrl);

        if ($userId === '') {
            $log[] = api_t('api.scholarUrlMissing', ['id' => $id]);
            $skipped++;
            continue;
        }

        $log[] = api_t('api.scholarFetching', ['id' => $id, 'userId' => $userId]);

        $data = fetch_scholar_metrics($userId);
        if ($data !== null) {
            if (!isset($metrics[$id])) {
                $metrics[$id] = [];
            }
            $metrics[$id]['googleScholar'] = array_merge($data, [
                'updatedAt' => date('c'),
            ]);
            $updated++;
            $log[] = api_t('api.scholarUpdated', [
                'id' => $id,
                'articles' => $data['articles'] ?? '?',
                'citations' => $data['citations'] ?? '?',
                'hIndex' => $data['hIndex'] ?? '?',
                'i10Index' => $data['i10Index'] ?? '?',
            ]);
        } else {
            $failed++;
            $log[] = api_t('api.scholarFetchFailed', ['id' => $id]);
        }
    }

    if ($updated > 0) {
        save_scholar_metrics($metrics);
        $log[] = api_t('api.metricsSaved');
    }

    return [
        'updated' => $updated,
        'skipped' => $skipped,
        'failed' => $failed,
        'log' => $log,
    ];
}

function verify_turnstile_token(string $token, string $secretKey): bool
{
    $url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
    $data = [
        'secret' => $secretKey,
        'response' => $token,
    ];
    if (!empty($_SERVER['REMOTE_ADDR'])) {
        $data['remoteip'] = $_SERVER['REMOTE_ADDR'];
    }

    $ch = curl_init($url);
    if ($ch === false) {
        return false;
    }
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $response = curl_exec($ch);
    curl_close($ch);

    if (!is_string($response)) {
        return false;
    }
    $result = json_decode($response, true);
    return is_array($result) && !empty($result['success']);
}

function authors_csv_path(): string
{
    return ensure_accesses_root() . '/authors.csv';
}

function ensure_default_access_files(): void
{
    $root = ensure_accesses_root();
    $definitions = [
        'users.csv' => [
            'default' => 'users.default.csv',
            'fallback' => "username,password_hash,display_name,role,enabled\nadmin,REPLACE_WITH_BCRYPT_HASH,Administrator,admin,0\n",
        ],
        'authors.csv' => [
            'default' => 'authors.default.csv',
            'fallback' => "id,full_name_pl,full_name_en,degree_pl,degree_en,emails,unit_pl,unit_en,project_role_pl,project_role_en,research_area_pl,research_area_en,orcid,google_scholar,researchgate,wos,website\nexample_author,Example Researcher,Example Researcher,\"dr inz.\",\"PhD Eng.\",researcher@example.org,\"Przykladowe Laboratorium Systemow Wspolbieznych\",\"Example Concurrent Systems Laboratory\",\"Przykladowy badacz\",\"Example Researcher\",\"Sieci Petriego; Hipergrafy; Systemy wspolbiezne\",\"Petri nets; Hypergraphs; Concurrent systems\",,,,,https://example.org\n",
        ],
        'turnstile.json' => [
            'default' => 'turnstile.default.json',
            'fallback' => "{\n  \"enabled\": false,\n  \"siteKey\": \"\",\n  \"secretKey\": \"\"\n}\n",
        ],
        'scholar_metrics.json' => [
            'default' => 'scholar_metrics.default.json',
            'fallback' => "{\n  \"example_author\": {\n    \"googleScholar\": {\n      \"articles\": 12,\n      \"citations\": 34,\n      \"hIndex\": 4,\n      \"i10Index\": 2,\n      \"updatedAt\": \"2026-01-01T00:00:00+00:00\"\n    },\n    \"wos\": {\n      \"articles\": 10,\n      \"citations\": 27,\n      \"hIndex\": 3,\n      \"i10Index\": 1,\n      \"updatedAt\": \"2026-01-01T00:00:00+00:00\"\n    }\n  }\n}\n",
        ],
    ];

    foreach ($definitions as $targetName => $definition) {
        $targetPath = $root . '/' . $targetName;
        if (is_file($targetPath)) {
            continue;
        }
        $defaultPath = $root . '/' . $definition['default'];
        $contents = is_file($defaultPath) ? file_get_contents($defaultPath) : false;
        file_put_contents(
            $targetPath,
            is_string($contents) ? $contents : $definition['fallback'],
            LOCK_EX
        );
    }
}

function normalize_csv_header(string $value): string
{
    $clean = str_replace("\xEF\xBB\xBF", '', trim($value));
    return strtolower($clean);
}

function detect_csv_delimiter(string $line): string
{
    $candidates = [',' => substr_count($line, ','), ';' => substr_count($line, ';'), "\t" => substr_count($line, "\t")];
    arsort($candidates);
    $delimiter = (string) key($candidates);
    return $delimiter !== '' ? $delimiter : ',';
}

/**
 * @return array<int,array<string,string>>
 */
function read_csv_assoc_rows(string $path): array
{
    if (!is_file($path)) {
        return [];
    }

    $handle = fopen($path, 'rb');
    if ($handle === false) {
        throw new RuntimeException(api_t('api.csvReadFailed', ['file' => basename($path)]));
    }

    $firstLine = fgets($handle);
    if ($firstLine === false) {
        fclose($handle);
        return [];
    }
    $delimiter = detect_csv_delimiter($firstLine);
    rewind($handle);

    $header = fgetcsv($handle, 0, $delimiter, '"', '\\');
    if (!is_array($header)) {
        fclose($handle);
        return [];
    }
    $normalizedHeader = array_map(
        static function ($item): string {
            return normalize_csv_header((string) $item);
        },
        $header
    );

    $rows = [];
    while (($row = fgetcsv($handle, 0, $delimiter, '"', '\\')) !== false) {
        if (!is_array($row)) {
            continue;
        }
        $assoc = [];
        foreach ($normalizedHeader as $index => $column) {
            if ($column === '') {
                continue;
            }
            $assoc[$column] = trim((string) ($row[$index] ?? ''));
        }
        if (count(array_filter($assoc, static fn ($value): bool => (string) $value !== '')) === 0) {
            continue;
        }
        $rows[] = $assoc;
    }
    fclose($handle);

    return $rows;
}

/**
 * @return array<string,mixed>|null
 */
function get_authenticated_user(): ?array
{
    $user = $_SESSION['pooh_auth_user'] ?? null;
    return is_array($user) ? $user : null;
}

/**
 * @param array<string,mixed> $user
 */
function set_authenticated_user(array $user): void
{
    $_SESSION['pooh_auth_user'] = [
        'username' => (string) ($user['username'] ?? ''),
        'displayName' => (string) ($user['displayName'] ?? ''),
        'role' => (string) ($user['role'] ?? ''),
        'loggedAt' => date(DATE_ATOM),
    ];
}

function clear_authenticated_user(): void
{
    $_SESSION = [];

    // Delete the session cookie on the client
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(
            session_name(),
            '',
            time() - 42000,
            $params['path'],
            $params['domain'],
            $params['secure'],
            $params['httponly']
        );
    }

    session_destroy();
}

function require_authenticated(): void
{
    if (get_authenticated_user() === null) {
        json_response(['ok' => false, 'error' => api_t('api.authenticationRequired')], 401);
    }
}

/**
 * @param array<string,string> $row
 */
function verify_user_password(array $row, string $password): bool
{
    $hash = trim((string) ($row['password_hash'] ?? $row['hash'] ?? ''));
    if ($hash !== '') {
        if (preg_match('/^\$2y\$|^\$2a\$|^\$argon2/i', $hash)) {
            return password_verify($password, $hash);
        }
        // Support SHA-256 hashes (legacy) — timing-safe comparison
        if (preg_match('/^[a-f0-9]{64}$/i', $hash)) {
            $sha256 = hash('sha256', $password);
            return hash_equals($hash, $sha256);
        }
        // Unknown hash format — reject
        return false;
    }

    // Legacy: plaintext password column — verify but schedule for upgrade
    $plain = (string) ($row['password'] ?? $row['pass'] ?? '');
    if ($plain === '') {
        return false;
    }
    return hash_equals($plain, $password);
}

/**
 * If verified via legacy plaintext/SHA-256, upgrade to bcrypt in-place.
 */
function maybe_upgrade_password_hash(string $username, string $password): void
{
    $csvPath = users_csv_path();
    if (!is_file($csvPath)) {
        return;
    }

    $handle = fopen($csvPath, 'rb');
    if ($handle === false) {
        return;
    }

    $firstLine = fgets($handle);
    if ($firstLine === false) {
        fclose($handle);
        return;
    }
    $delimiter = detect_csv_delimiter($firstLine);
    rewind($handle);

    $header = fgetcsv($handle, 0, $delimiter, '"', '\\');
    if (!is_array($header)) {
        fclose($handle);
        return;
    }

    $normalizedHeader = array_map(fn($h) => normalize_csv_header((string) $h), $header);
    $hashColIdx = array_search('password_hash', $normalizedHeader, true);
    $passColIdx = array_search('password', $normalizedHeader, true);
    $userColIdx = array_search('username', $normalizedHeader, true);
    if ($userColIdx === false) {
        $userColIdx = array_search('login', $normalizedHeader, true);
    }

    if ($userColIdx === false) {
        fclose($handle);
        return;
    }

    $allRows = [$header];
    $upgraded = false;
    while (($row = fgetcsv($handle, 0, $delimiter, '"', '\\')) !== false) {
        if (!is_array($row)) {
            $allRows[] = $row;
            continue;
        }
        $rowUser = trim((string) ($row[$userColIdx] ?? ''));
        $rowUserNorm = function_exists('mb_strtolower') ? mb_strtolower($rowUser, 'UTF-8') : strtolower($rowUser);
        $usernameNorm = function_exists('mb_strtolower') ? mb_strtolower($username, 'UTF-8') : strtolower($username);

        if ($rowUserNorm === $usernameNorm) {
            $currentHash = ($hashColIdx !== false) ? trim((string) ($row[$hashColIdx] ?? '')) : '';
            $needsUpgrade = false;

            if ($currentHash === '') {
                // Was using plaintext password column
                $needsUpgrade = true;
            } elseif (preg_match('/^[a-f0-9]{64}$/i', $currentHash)) {
                // SHA-256 — upgrade to bcrypt
                $needsUpgrade = true;
            }

            if ($needsUpgrade) {
                $bcryptHash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
                if ($hashColIdx !== false) {
                    $row[$hashColIdx] = $bcryptHash;
                } else {
                    // Add password_hash column — replace header first
                    if (!$upgraded) {
                        $allRows[0][] = 'password_hash';
                    }
                    $row[] = $bcryptHash;
                }
                // Clear plaintext password if present
                if ($passColIdx !== false) {
                    $row[$passColIdx] = '';
                }
                $upgraded = true;
                audit_log('password_upgrade', "user=$rowUser hash_type=bcrypt");
            }
        }
        $allRows[] = $row;
    }
    fclose($handle);

    if ($upgraded) {
        $output = fopen($csvPath, 'wb');
        if ($output !== false) {
            foreach ($allRows as $csvRow) {
                fputcsv($output, $csvRow, $delimiter);
            }
            fclose($output);
        }
    }
}

/**
 * @return array<string,mixed>|null
 */
function authenticate_user(string $username, string $password): ?array
{
    $trimmedUserName = trim($username);
    $userNameNormalized = function_exists('mb_strtolower')
        ? mb_strtolower($trimmedUserName, 'UTF-8')
        : strtolower($trimmedUserName);
    if ($userNameNormalized === '' || $password === '') {
        return null;
    }

    foreach (read_csv_assoc_rows(users_csv_path()) as $row) {
        $enabledValue = trim((string) ($row['enabled'] ?? ''));
        if ($enabledValue !== '') {
            $enabled = filter_var($enabledValue, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if ($enabled !== true) {
                continue;
            }
        }
        $rowUsername = (string) ($row['username'] ?? $row['login'] ?? $row['user'] ?? '');
        if ($rowUsername === '') {
            continue;
        }
        $rowNormalized = function_exists('mb_strtolower')
            ? mb_strtolower($rowUsername, 'UTF-8')
            : strtolower($rowUsername);
        if ($rowNormalized !== $userNameNormalized) {
            continue;
        }
        if (!verify_user_password($row, $password)) {
            continue;
        }

        return [
            'username' => $rowUsername,
            'displayName' => (string) ($row['display_name'] ?? $row['name'] ?? $rowUsername),
            'role' => (string) ($row['role'] ?? ''),
        ];
    }

    return null;
}

/**
 * @return array<int,array<string,mixed>>
 */
function list_authors(): array
{
    $authors = [];
    $rows = read_csv_assoc_rows(authors_csv_path());
    $splitMulti = static function (string $raw): array {
        $parts = preg_split('/\s*[;,]\s*/u', $raw, -1, PREG_SPLIT_NO_EMPTY);
        return array_values(array_map('trim', array_map('strval', $parts ?: [])));
    };
    $splitBySemicolon = static function (string $raw): array {
        $parts = preg_split('/\s*;\s*/u', $raw, -1, PREG_SPLIT_NO_EMPTY);
        return array_values(array_map('trim', array_map('strval', $parts ?: [])));
    };
    foreach ($rows as $index => $row) {
        $namePl = (string) ($row['full_name_pl'] ?? $row['full_name'] ?? $row['name'] ?? $row['author'] ?? '');
        $nameEn = (string) ($row['full_name_en'] ?? '');
        if ($namePl === '' && $nameEn === '') {
            continue;
        }
        $emailsRaw = (string) ($row['emails'] ?? $row['email'] ?? '');
        $unitPl = (string) ($row['unit_pl'] ?? $row['unit'] ?? $row['organization'] ?? '');
        $unitEn = (string) ($row['unit_en'] ?? '');
        $authors[] = [
            'id' => (string) ($row['id'] ?? ('author_' . ($index + 1))),
            'fullName' => ['pl' => $namePl, 'en' => $nameEn ?: $namePl],
            'degree' => [
                'pl' => (string) ($row['degree_pl'] ?? $row['degree'] ?? $row['title'] ?? ''),
                'en' => (string) ($row['degree_en'] ?? ''),
            ],
            'emails' => $splitMulti($emailsRaw),
            'units' => [
                'pl' => $splitMulti($unitPl),
                'en' => $splitMulti($unitEn),
            ],
            'projectRole' => [
                'pl' => $splitBySemicolon((string) ($row['project_role_pl'] ?? $row['project_role'] ?? $row['role'] ?? '')),
                'en' => $splitBySemicolon((string) ($row['project_role_en'] ?? '')),
            ],
            'researchArea' => [
                'pl' => $splitBySemicolon((string) ($row['research_area_pl'] ?? '')),
                'en' => $splitBySemicolon((string) ($row['research_area_en'] ?? '')),
            ],
            'orcid' => (string) ($row['orcid'] ?? ''),
            'googleScholar' => (string) ($row['google_scholar'] ?? ''),
            'researchgate' => (string) ($row['researchgate'] ?? ''),
            'wos' => (string) ($row['wos'] ?? ''),
            'website' => (string) ($row['website'] ?? ''),
        ];
    }

    $allMetrics = load_scholar_metrics();
    foreach ($authors as &$author) {
        $id = $author['id'];
        $author['metrics'] = $allMetrics[$id] ?? null;
    }
    unset($author);

    return $authors;
}

/**
 * @return array<int,array<string,mixed>>
 */
function list_libraries(): array
{
    $root = ensure_data_root();
    $entries = scandir($root);
    if ($entries === false) {
        return [];
    }

    $libraries = [];
    foreach ($entries as $entry) {
        if ($entry === '.' || $entry === '..') {
            continue;
        }
        $fullPath = $root . '/' . $entry;
        if (!is_dir($fullPath) || !validate_library_id($entry)) {
            continue;
        }

        $filesDir = library_files_dir($entry);
        if (!is_dir($filesDir)) {
            mkdir($filesDir, 0775, true);
        }

        $meta = read_library_meta($entry);
        $files = glob($filesDir . '/*.pnh') ?: [];
        $latestTs = filemtime(library_meta_path($entry)) ?: 0;
        foreach ($files as $filePath) {
            $ts = filemtime($filePath) ?: 0;
            if ($ts > $latestTs) {
                $latestTs = $ts;
            }
        }

        $libraries[] = [
            'id' => $entry,
            'name' => (string) ($meta['name'] ?? $entry),
            'createdAt' => (string) ($meta['createdAt'] ?? date(DATE_ATOM)),
            'updatedAt' => $latestTs > 0 ? date(DATE_ATOM, $latestTs) : (string) ($meta['updatedAt'] ?? date(DATE_ATOM)),
            'filesCount' => count($files),
        ];
    }

    usort(
        $libraries,
        static function (array $a, array $b): int {
            $nameCompare = strnatcasecmp((string) ($a['name'] ?? ''), (string) ($b['name'] ?? ''));
            if ($nameCompare !== 0) {
                return $nameCompare;
            }
            return strcmp((string) ($a['id'] ?? ''), (string) ($b['id'] ?? ''));
        }
    );

    return $libraries;
}

/**
 * @return array<int,array<string,mixed>>
 */
function list_library_files(string $libraryId): array
{
    assert_library_exists($libraryId);
    $filesDir = library_files_dir($libraryId);
    if (!is_dir($filesDir) && !mkdir($filesDir, 0775, true) && !is_dir($filesDir)) {
        throw new RuntimeException(api_t('api.libraryFilesDirectoryCreateFailed'));
    }

    $result = [];
    $entries = scandir($filesDir);
    if ($entries === false) {
        return [];
    }

    foreach ($entries as $entry) {
        if ($entry === '.' || $entry === '..') {
            continue;
        }
        if (!preg_match('/\.pnh$/i', $entry)) {
            continue;
        }
        if (!preg_match('/^[a-zA-Z0-9._-]{1,120}\.pnh$/', $entry)) {
            continue;
        }

        $fullPath = $filesDir . '/' . $entry;
        if (!is_file($fullPath)) {
            continue;
        }
        $result[] = [
            'name' => $entry,
            'size' => filesize($fullPath) ?: 0,
            'updatedAt' => date(DATE_ATOM, filemtime($fullPath) ?: time()),
        ];
    }

    usort(
        $result,
        static function (array $a, array $b): int {
            return strnatcasecmp((string) ($a['name'] ?? ''), (string) ($b['name'] ?? ''));
        }
    );

    return $result;
}

function research_runs_dir(): string
{
    $root = __DIR__ . '/data/research_runs';
    if (!is_dir($root) && !mkdir($root, 0775, true) && !is_dir($root)) {
        throw new RuntimeException(api_t('api.researchDirectoryCreateFailed'));
    }
    return $root;
}

function validate_research_run_id(string $id): bool
{
    return (bool) preg_match('/^run_[a-f0-9]{16}$/', $id);
}

function research_run_path(string $runId): string
{
    if (!validate_research_run_id($runId)) {
        throw new InvalidArgumentException(api_t('api.researchIdInvalid'));
    }
    return research_runs_dir() . '/' . $runId . '.json';
}

function numeric_or_null(mixed $value): ?float
{
    if (is_int($value) || is_float($value) || is_string($value)) {
        $numeric = filter_var($value, FILTER_VALIDATE_FLOAT);
        return $numeric !== false ? (float) $numeric : null;
    }
    return null;
}

/**
 * @param array<string,mixed> $run
 * @return array<string,mixed>
 */
function summarize_research_run(array $run, string $runId, string $savedAt): array
{
    $experiment = is_array($run['experiment'] ?? null) ? $run['experiment'] : [];
    $model = is_array($experiment['model'] ?? null) ? $experiment['model'] : [];
    $options = is_array($run['options'] ?? null) ? $run['options'] : [];
    $summary = is_array($run['summary'] ?? null) ? $run['summary'] : [];
    $fuzzy = is_array($run['fuzzy'] ?? null) ? $run['fuzzy'] : [];
    $optimization = is_array($fuzzy['optimization'] ?? null) ? $fuzzy['optimization'] : [];
    $best = is_array($optimization['best'] ?? null) ? $optimization['best'] : [];
    $quality = is_array($best['quality'] ?? null) ? $best['quality'] : [];
    $bestMaxPlus = is_array($best['maxPlus'] ?? null) ? $best['maxPlus'] : [];
    $bestMaxPlusMapped = filter_var($bestMaxPlus['mappedCount'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 0]]);
    $bestMaxPlusUnmapped = filter_var($bestMaxPlus['unmappedCount'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 0]]);
    $bestTransversalTransitions = filter_var($bestMaxPlus['transversalTransitionCount'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 0]]);
    $bestTransversalEdges = filter_var($bestMaxPlus['transversalEdgeCount'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 0]]);
    $alphaSweep = is_array($fuzzy['alphaSweep'] ?? null) ? $fuzzy['alphaSweep'] : [];

    return [
        'id' => $runId,
        'experimentId' => (string) ($experiment['id'] ?? $runId),
        'label' => (string) ($experiment['label'] ?? ''),
        'savedAt' => $savedAt,
        'generatedAt' => (string) ($run['generatedAt'] ?? ''),
        'artifactVersion' => (string) ($experiment['artifactVersion'] ?? ($run['version'] ?? '')),
        'hash' => (string) ($experiment['hash'] ?? ''),
        'sourceMode' => (string) ($run['sourceMode'] ?? ''),
        'alpha' => numeric_or_null($options['alpha'] ?? null),
        'alphaStep' => numeric_or_null($options['alphaStep'] ?? null),
        'bestE' => numeric_or_null($quality['quality'] ?? null),
        'bestCoverage' => numeric_or_null($quality['minCoverage'] ?? null),
        'bestCoupling' => numeric_or_null($quality['coupling'] ?? null),
        'bestLambda' => numeric_or_null($best['lambda'] ?? null),
        'bestMaxPlusCoverage' => numeric_or_null($bestMaxPlus['coverage'] ?? null),
        'bestMaxPlusMapped' => is_int($bestMaxPlusMapped) ? $bestMaxPlusMapped : null,
        'bestMaxPlusUnmapped' => is_int($bestMaxPlusUnmapped) ? $bestMaxPlusUnmapped : null,
        'bestMaxPlusUnmappedLabels' => is_array($bestMaxPlus['unmappedLabels'] ?? null) ? array_values(array_map('strval', $bestMaxPlus['unmappedLabels'])) : [],
        'bestTransversalLambda' => numeric_or_null($bestMaxPlus['transversalLambda'] ?? null),
        'bestTransversalThroughput' => numeric_or_null($bestMaxPlus['transversalThroughput'] ?? null),
        'bestTransversalTransitionCount' => is_int($bestTransversalTransitions) ? $bestTransversalTransitions : null,
        'bestTransversalEdgeCount' => is_int($bestTransversalEdges) ? $bestTransversalEdges : null,
        'bestSize' => filter_var($best['size'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 0]]) ?: null,
        'bestLabels' => is_array($best['selectedLabels'] ?? null) ? array_values(array_map('strval', $best['selectedLabels'])) : [],
        'optimizerFound' => !empty($optimization['found']),
        'alphaLevels' => filter_var($alphaSweep['levels'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 0]]) ?: 0,
        'alphaExactLevels' => filter_var($alphaSweep['exactLevels'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 0]]) ?: 0,
        'alphaFeasibleLevels' => filter_var($alphaSweep['feasibleLevels'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 0]]) ?: 0,
        'maxExactAlpha' => numeric_or_null($alphaSweep['maxExactAlpha'] ?? null),
        'subnetCount' => filter_var($summary['subnetCount'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 0]]) ?: 0,
        'ruleCount' => filter_var($summary['ruleCount'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 0]]) ?: 0,
        'placeCount' => filter_var($model['places'] ?? ($summary['placeCount'] ?? null), FILTER_VALIDATE_INT, ['options' => ['min_range' => 0]]) ?: 0,
        'transitionCount' => filter_var($model['transitions'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 0]]) ?: 0,
    ];
}

/**
 * @return array<int,array<string,mixed>>
 */
function list_research_runs(): array
{
    $dir = research_runs_dir();
    $files = glob($dir . '/run_*.json') ?: [];
    $runs = [];
    foreach ($files as $filePath) {
        $raw = file_get_contents($filePath);
        if ($raw === false || trim($raw) === '') {
            continue;
        }
        try {
            $stored = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
        } catch (Throwable $exception) {
            continue;
        }
        if (!is_array($stored) || !is_array($stored['summary'] ?? null)) {
            continue;
        }
        $runs[] = $stored['summary'];
    }

    usort(
        $runs,
        static function (array $a, array $b): int {
            return strcmp((string) ($b['savedAt'] ?? ''), (string) ($a['savedAt'] ?? ''));
        }
    );

    return $runs;
}

/**
 * @return array<string,mixed>
 */
function read_research_run(string $runId): array
{
    $path = research_run_path($runId);
    if (!is_file($path)) {
        throw new InvalidArgumentException(api_t('api.researchNotFound'));
    }
    $raw = file_get_contents($path);
    if ($raw === false || trim($raw) === '') {
        throw new RuntimeException(api_t('api.researchReadFailed'));
    }
    $stored = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
    if (!is_array($stored) || !is_array($stored['result'] ?? null)) {
        throw new RuntimeException(api_t('api.researchFormatInvalid'));
    }
    return $stored;
}

/**
 * @param array<string,mixed> $run
 * @return array<string,mixed>
 */
function save_research_run(array $run): array
{
    $runId = 'run_' . bin2hex(random_bytes(8));
    $savedAt = date(DATE_ATOM);
    $user = get_authenticated_user();
    $summary = summarize_research_run($run, $runId, $savedAt);
    $stored = [
        'id' => $runId,
        'savedAt' => $savedAt,
        'savedBy' => $user ? (string) ($user['username'] ?? '') : '',
        'summary' => $summary,
        'result' => $run,
    ];
    $json = json_encode($stored, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    $result = file_put_contents(research_run_path($runId), $json . "\n", LOCK_EX);
    if ($result === false) {
        throw new RuntimeException(api_t('api.researchSaveFailed'));
    }
    return $stored;
}

// ===========================================================================
// REQUEST ROUTING
// ===========================================================================
try {
    ensure_default_access_files();

    $action = (string) ($_GET['action'] ?? $_POST['action'] ?? '');
    if ($action === '') {
        json_response(['ok' => false, 'error' => api_t('api.actionRequired')], 400);
    }

    // ------ Public GET endpoints (no CSRF needed) ------

    if ($action === 'auth_status') {
        $user = get_authenticated_user();
        json_response([
            'ok' => true,
            'loggedIn' => $user !== null,
            'user' => $user,
            'csrfToken' => csrf_token(),
        ]);
    }

    if ($action === 'login') {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            json_response(['ok' => false, 'error' => api_t('api.methodPostOnly')], 405);
        }

        // Rate limiting — 5 attempts per 15 minutes per IP
        if (!rate_limit_check('login', 5, 900)) {
            audit_log('login_rate_limited');
            json_response(['ok' => false, 'error' => api_t('api.loginRateLimited')], 429);
        }

        $turnstileCfg = load_turnstile_config();
        if ($turnstileCfg['enabled'] && $turnstileCfg['secretKey'] !== '') {
            $cfToken = (string) ($_POST['cf-turnstile-response'] ?? '');
            if ($cfToken === '' || !verify_turnstile_token($cfToken, $turnstileCfg['secretKey'])) {
                audit_log('login_captcha_fail');
                json_response(['ok' => false, 'error' => api_t('api.captchaFailed')], 403);
            }
        }

        $username = (string) ($_POST['username'] ?? '');
        $password = (string) ($_POST['password'] ?? '');
        $user = authenticate_user($username, $password);
        if ($user === null) {
            audit_log('login_fail', "username=$username");
            json_response(['ok' => false, 'error' => api_t('api.credentialsInvalid')], 401);
        }

        // Successful login — clear rate limits, upgrade password if needed
        rate_limit_clear('login');
        maybe_upgrade_password_hash($username, $password);

        session_regenerate_id(true);
        set_authenticated_user($user);
        audit_log('login_success', "username=$username");
        json_response([
            'ok' => true,
            'loggedIn' => true,
            'user' => get_authenticated_user(),
            'csrfToken' => csrf_token(),
        ]);
    }

    if ($action === 'logout') {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            json_response(['ok' => false, 'error' => api_t('api.methodPostOnly')], 405);
        }
        audit_log('logout');
        clear_authenticated_user();
        if (session_status() !== PHP_SESSION_ACTIVE) {
            session_start([
                'cookie_httponly' => true,
                'cookie_secure'   => (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
                'cookie_samesite' => 'Strict',
            ]);
        }
        json_response(['ok' => true, 'loggedIn' => false, 'user' => null, 'csrfToken' => csrf_token()]);
    }

    if ($action === 'authors') {
        json_response(['ok' => true, 'authors' => research_team_enabled() ? list_authors() : []]);
    }

    if ($action === 'libraries') {
        json_response(['ok' => true, 'libraries' => list_libraries()]);
    }

    if ($action === 'research_runs') {
        json_response(['ok' => true, 'runs' => list_research_runs()]);
    }

    if ($action === 'get_research_run') {
        $runId = (string) ($_GET['id'] ?? '');
        $stored = read_research_run($runId);
        json_response([
            'ok' => true,
            'summary' => $stored['summary'] ?? null,
            'run' => $stored['result'],
        ]);
    }

    // ------ Protected POST endpoints (require CSRF + authentication) ------

    if ($action === 'save_research_run') {
        require_authenticated();
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            json_response(['ok' => false, 'error' => api_t('api.methodPostOnly')], 405);
        }
        validate_csrf_token();

        $rawJson = (string) ($_POST['run_json'] ?? '');
        if ($rawJson === '') {
            json_response(['ok' => false, 'error' => api_t('api.researchDataRequired')], 422);
        }
        if (strlen($rawJson) > 3 * 1024 * 1024) {
            json_response(['ok' => false, 'error' => api_t('api.researchTooLarge')], 413);
        }
        try {
            $decoded = json_decode($rawJson, true, 128, JSON_THROW_ON_ERROR);
        } catch (Throwable $exception) {
            json_response(['ok' => false, 'error' => api_t('api.researchJsonInvalid')], 422);
        }
        if (!is_array($decoded)) {
            json_response(['ok' => false, 'error' => api_t('api.researchObjectRequired')], 422);
        }

        $stored = save_research_run($decoded);
        $summary = is_array($stored['summary'] ?? null) ? $stored['summary'] : [];
        audit_log('save_research_run', sprintf('id=%s experiment=%s', (string) ($stored['id'] ?? ''), (string) ($summary['experimentId'] ?? '')));
        json_response([
            'ok' => true,
            'summary' => $summary,
            'runs' => list_research_runs(),
        ]);
    }

    if ($action === 'delete_research_run') {
        require_authenticated();
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            json_response(['ok' => false, 'error' => api_t('api.methodPostOnly')], 405);
        }
        validate_csrf_token();

        $runId = (string) ($_POST['id'] ?? '');
        $path = research_run_path($runId);
        if (!is_file($path)) {
            json_response(['ok' => false, 'error' => api_t('api.researchNotFound')], 404);
        }
        if (!unlink($path)) {
            throw new RuntimeException(api_t('api.researchDeleteFailed'));
        }
        audit_log('delete_research_run', "id=$runId");
        json_response(['ok' => true, 'runs' => list_research_runs()]);
    }

    if ($action === 'update_metrics') {
        if (!research_team_enabled()) {
            json_response(['ok' => false, 'error' => api_t('api.actionUnknown')], 404);
        }
        require_authenticated();
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            json_response(['ok' => false, 'error' => api_t('api.methodPostOnly')], 405);
        }
        validate_csrf_token();

        $result = run_metrics_update();
        audit_log('update_metrics', sprintf(
            'updated=%d skipped=%d failed=%d',
            $result['updated'],
            $result['skipped'],
            $result['failed']
        ));

        json_response([
            'ok' => true,
            'log' => implode("\n", $result['log']),
            'updated' => $result['updated'],
            'failed' => $result['failed'],
            'authors' => list_authors(),
        ]);
    }

    if ($action === 'save_author_metrics') {
        if (!research_team_enabled()) {
            json_response(['ok' => false, 'error' => api_t('api.actionUnknown')], 404);
        }
        require_authenticated();
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            json_response(['ok' => false, 'error' => api_t('api.methodPostOnly')], 405);
        }
        validate_csrf_token();

        $authorId = trim((string) ($body['authorId'] ?? ''));
        if ($authorId === '') {
            json_response(['ok' => false, 'error' => api_t('api.authorIdRequired')], 400);
        }

        $incoming = is_array($body['metrics'] ?? null) ? $body['metrics'] : [];
        $sanitized = [];
        $now = date('c');

        foreach (['googleScholar', 'wos'] as $source) {
            $src = is_array($incoming[$source] ?? null) ? $incoming[$source] : null;
            if ($src === null) {
                continue;
            }
            $articles = filter_var($src['articles'] ?? '', FILTER_VALIDATE_INT, ['options' => ['min_range' => 0]]);
            $citations = filter_var($src['citations'] ?? '', FILTER_VALIDATE_INT, ['options' => ['min_range' => 0]]);
            $hIndex = filter_var($src['hIndex'] ?? '', FILTER_VALIDATE_INT, ['options' => ['min_range' => 0]]);
            $i10Index = filter_var($src['i10Index'] ?? '', FILTER_VALIDATE_INT, ['options' => ['min_range' => 0]]);

            $hasAny = ($articles !== false) || ($citations !== false) || ($hIndex !== false) || ($i10Index !== false);
            if (!$hasAny) {
                continue;
            }
            $sanitized[$source] = [
                'articles'  => $articles !== false ? (int) $articles : null,
                'citations' => $citations !== false ? (int) $citations : null,
                'hIndex'    => $hIndex !== false ? (int) $hIndex : null,
                'i10Index'  => $i10Index !== false ? (int) $i10Index : null,
                'updatedAt' => $now,
            ];
        }

        $metrics = load_scholar_metrics();
        if (empty($sanitized)) {
            unset($metrics[$authorId]);
        } else {
            $metrics[$authorId] = $sanitized;
        }
        save_scholar_metrics($metrics);

        audit_log('save_author_metrics', sprintf('author=%s sources=%s', $authorId, implode(',', array_keys($sanitized))));

        json_response([
            'ok' => true,
            'authors' => list_authors(),
        ]);
    }

    if ($action === 'create_library') {
        require_authenticated();
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            json_response(['ok' => false, 'error' => api_t('api.methodPostOnly')], 405);
        }
        validate_csrf_token();

        $name = normalize_name((string) ($_POST['name'] ?? ''), api_t('api.libraryDefaultName'));
        $libraryId = 'lib_' . bin2hex(random_bytes(8));
        $filesDir = library_files_dir($libraryId);
        if (!mkdir($filesDir, 0775, true) && !is_dir($filesDir)) {
            throw new RuntimeException(api_t('api.libraryCreateFailed'));
        }

        save_library_meta($libraryId, [
            'name' => $name,
            'createdAt' => date(DATE_ATOM),
            'updatedAt' => date(DATE_ATOM),
        ]);

        audit_log('create_library', "id=$libraryId name=$name");
        json_response([
            'ok' => true,
            'library' => [
                'id' => $libraryId,
                'name' => $name,
                'createdAt' => date(DATE_ATOM),
                'updatedAt' => date(DATE_ATOM),
                'filesCount' => 0,
            ],
        ]);
    }

    if ($action === 'rename_library') {
        require_authenticated();
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            json_response(['ok' => false, 'error' => api_t('api.methodPostOnly')], 405);
        }
        validate_csrf_token();

        $libraryId = (string) ($_POST['library_id'] ?? '');
        $newName = normalize_name((string) ($_POST['name'] ?? ''), '');
        if ($newName === '') {
            json_response(['ok' => false, 'error' => api_t('api.libraryNameRequired')], 422);
        }
        assert_library_exists($libraryId);

        $meta = read_library_meta($libraryId);
        $meta['name'] = $newName;
        $meta['updatedAt'] = date(DATE_ATOM);
        save_library_meta($libraryId, $meta);

        audit_log('rename_library', "id=$libraryId name=$newName");
        json_response(['ok' => true, 'library' => $meta]);
    }

    if ($action === 'files') {
        $libraryId = (string) ($_GET['library_id'] ?? '');
        if ($libraryId === '') {
            json_response(['ok' => false, 'error' => api_t('api.libraryIdRequired')], 422);
        }
        $files = list_library_files($libraryId);
        json_response(['ok' => true, 'files' => $files]);
    }

    if ($action === 'upload_pnh') {
        require_authenticated();
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            json_response(['ok' => false, 'error' => api_t('api.methodPostOnly')], 405);
        }
        validate_csrf_token();

        $libraryId = (string) ($_POST['library_id'] ?? '');
        assert_library_exists($libraryId);

        if (!isset($_FILES['pnh_file']) || !is_array($_FILES['pnh_file'])) {
            json_response(['ok' => false, 'error' => api_t('api.pnhFileRequired')], 422);
        }

        $file = $_FILES['pnh_file'];
        $errorCode = (int) ($file['error'] ?? UPLOAD_ERR_NO_FILE);
        if ($errorCode !== UPLOAD_ERR_OK) {
            json_response(['ok' => false, 'error' => api_t('api.uploadFailed', ['code' => $errorCode])], 422);
        }

        $tmpName = (string) ($file['tmp_name'] ?? '');
        $originalName = (string) ($file['name'] ?? 'model.pnh');
        $size = (int) ($file['size'] ?? 0);
        if ($size <= 0 || $size > 5 * 1024 * 1024) {
            json_response(['ok' => false, 'error' => api_t('api.uploadSizeInvalid')], 422);
        }
        if (!preg_match('/\.pnh$/i', $originalName)) {
            json_response(['ok' => false, 'error' => api_t('api.uploadExtensionInvalid')], 422);
        }

        $filesDir = library_files_dir($libraryId);
        if (!is_dir($filesDir) && !mkdir($filesDir, 0775, true) && !is_dir($filesDir)) {
            throw new RuntimeException(api_t('api.libraryFilesDirectoryCreateFailed'));
        }

        $targetName = safe_uploaded_file_name($originalName, $filesDir);
        $targetPath = $filesDir . '/' . $targetName;
        if (!move_uploaded_file($tmpName, $targetPath)) {
            throw new RuntimeException(api_t('api.uploadSaveFailed'));
        }

        $meta = read_library_meta($libraryId);
        $meta['updatedAt'] = date(DATE_ATOM);
        save_library_meta($libraryId, $meta);

        audit_log('upload_pnh', "library=$libraryId file=$targetName size=$size");
        json_response([
            'ok' => true,
            'file' => [
                'name' => $targetName,
                'size' => filesize($targetPath) ?: 0,
                'updatedAt' => date(DATE_ATOM, filemtime($targetPath) ?: time()),
            ],
        ]);
    }

    if ($action === 'get_pnh') {
        $libraryId = (string) ($_GET['library_id'] ?? '');
        $fileName = basename((string) ($_GET['file_name'] ?? ''));
        assert_library_exists($libraryId);

        if ($fileName === '' || !preg_match('/^[a-zA-Z0-9._-]{1,120}\.pnh$/i', $fileName)) {
            json_response(['ok' => false, 'error' => api_t('api.fileNameInvalid')], 422);
        }

        $fullPath = library_files_dir($libraryId) . '/' . $fileName;
        if (!is_file($fullPath)) {
            json_response(['ok' => false, 'error' => api_t('api.fileNotFound')], 404);
        }

        $content = file_get_contents($fullPath);
        if ($content === false) {
            throw new RuntimeException(api_t('api.fileReadFailed'));
        }

        json_response([
            'ok' => true,
            'file' => [
                'name' => $fileName,
                'size' => filesize($fullPath) ?: 0,
                'updatedAt' => date(DATE_ATOM, filemtime($fullPath) ?: time()),
                'content' => $content,
            ],
        ]);
    }

    if ($action === 'docs') {
        json_response(['ok' => true, 'docs' => load_docs()]);
    }

    if ($action === 'save_docs') {
        require_authenticated();
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            json_response(['ok' => false, 'error' => api_t('api.methodPostOnly')], 405);
        }
        validate_csrf_token();

        $rawJson = (string) ($_POST['docs_json'] ?? '');
        if ($rawJson === '') {
            json_response(['ok' => false, 'error' => api_t('api.documentationDataRequired')], 422);
        }
        try {
            $decoded = json_decode($rawJson, true, 16, JSON_THROW_ON_ERROR);
        } catch (Throwable $exception) {
            json_response(['ok' => false, 'error' => api_t('api.documentationJsonInvalid')], 422);
        }
        if (!is_array($decoded)) {
            json_response(['ok' => false, 'error' => api_t('api.documentationObjectRequired')], 422);
        }

        $sanitized = sanitize_docs_payload($decoded);
        save_docs($sanitized);
        audit_log('save_docs', sprintf('algorithms=%d articles=%d', count($sanitized['algorithms']), count($sanitized['articles'])));
        json_response(['ok' => true, 'docs' => $sanitized]);
    }

    json_response(['ok' => false, 'error' => api_t('api.actionUnknown')], 404);
} catch (InvalidArgumentException $exception) {
    json_response(['ok' => false, 'error' => $exception->getMessage()], 422);
} catch (Throwable $exception) {
    error_log('[POOH][library_api] ' . $exception->getMessage() . ' in ' . $exception->getFile() . ':' . $exception->getLine());
    audit_log('server_error', 'action=' . ($_GET['action'] ?? $_POST['action'] ?? 'unknown'));
    json_response(['ok' => false, 'error' => api_t('api.serverError')], 500);
}
