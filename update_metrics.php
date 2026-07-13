#!/usr/bin/env php
<?php
/**
 * POOH — Scholar Metrics Updater
 *
 * Fetches scientific indices (articles, citations, h-index, i10-index)
 * from Google Scholar for each author and saves them to scholar_metrics.json.
 *
 * Usage (CLI only):
 *   php update_metrics.php                 # update all authors
 *   php update_metrics.php author_1        # update specific author
 *   php update_metrics.php --dry-run       # show what would be fetched, don't save
 *
 * Cron example (daily at 3:17 AM):
 *   17 3 * * * cd /path/to/pooh && php update_metrics.php >> accesses/logs/metrics.log 2>&1
 *
 * Web of Science metrics must be updated manually in scholar_metrics.json
 * (WoS API requires institutional access and API key).
 *
 * SECURITY: This script must NOT be executed via HTTP.
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    header('Content-Type: text/plain; charset=utf-8');
    echo "Access denied. This script can only be run from the command line.\n";
    exit(1);
}

declare(strict_types=1);

define('ACCESSES_DIR', __DIR__ . '/accesses');
define('AUTHORS_CSV', ACCESSES_DIR . '/authors.csv');
define('METRICS_JSON', ACCESSES_DIR . '/scholar_metrics.json');
define('REQUEST_DELAY_SECONDS', 3);
define('HTTP_TIMEOUT_SECONDS', 15);

function log_msg(string $level, string $message): void
{
    $timestamp = date('Y-m-d H:i:s');
    fprintf(STDERR, "[%s] [%s] %s\n", $timestamp, strtoupper($level), $message);
}

function load_existing_metrics(): array
{
    if (!is_file(METRICS_JSON)) {
        return [];
    }
    $raw = file_get_contents(METRICS_JSON);
    if ($raw === false) {
        return [];
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function save_metrics(array $metrics): bool
{
    $json = json_encode($metrics, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) {
        log_msg('error', 'Failed to encode metrics as JSON.');
        return false;
    }
    $result = file_put_contents(METRICS_JSON, $json . "\n", LOCK_EX);
    if ($result === false) {
        log_msg('error', 'Failed to write ' . METRICS_JSON);
        return false;
    }
    return true;
}

function read_authors_csv(): array
{
    if (!is_file(AUTHORS_CSV)) {
        log_msg('error', 'Authors CSV not found: ' . AUTHORS_CSV);
        return [];
    }
    $handle = fopen(AUTHORS_CSV, 'r');
    if ($handle === false) {
        return [];
    }
    $headers = fgetcsv($handle);
    if ($headers === false) {
        fclose($handle);
        return [];
    }
    $headers = array_map('trim', $headers);
    $authors = [];
    while (($row = fgetcsv($handle)) !== false) {
        if (count($row) < count($headers)) {
            $row = array_pad($row, count($headers), '');
        }
        $assoc = array_combine($headers, array_slice($row, 0, count($headers)));
        if ($assoc === false) {
            continue;
        }
        $id = trim($assoc['id'] ?? '');
        $scholarUrl = trim($assoc['google_scholar'] ?? '');
        if ($id !== '') {
            $authors[] = [
                'id' => $id,
                'name' => trim($assoc['full_name_pl'] ?? $assoc['full_name'] ?? ''),
                'google_scholar_url' => $scholarUrl,
            ];
        }
    }
    fclose($handle);
    return $authors;
}

/**
 * Extract Google Scholar user ID from URL.
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
 * Fetch a URL. Prefer cURL, fallback to file_get_contents.
 * @return string|false
 */
function scholar_http_get_cli(string $url, int $timeout = 15)
{
    $headers = [
        'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept: text/html,application/xhtml+xml',
        'Accept-Language: en-US,en;q=0.9',
    ];

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

    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => implode("\r\n", $headers),
            'timeout' => $timeout,
            'ignore_errors' => true,
        ],
        'ssl' => ['verify_peer' => true, 'verify_peer_name' => true],
    ]);
    $html = @file_get_contents($url, false, $context);
    return (is_string($html) && $html !== '') ? $html : false;
}

function scholar_count_rows(string $html): int
{
    return preg_match_all('/<tr class="gsc_a_tr"/', $html, $m) ? count($m[0]) : 0;
}

/**
 * Fetch Google Scholar metrics with article pagination.
 */
function fetch_google_scholar_metrics(string $userId): ?array
{
    $baseUrl = 'https://scholar.google.com/citations?user=' . urlencode($userId) . '&hl=en';
    $pageSize = 100;
    $maxPages = 10;

    $html = scholar_http_get_cli($baseUrl . '&cstart=0&pagesize=' . $pageSize);
    if ($html === false) {
        log_msg('warn', "Failed to fetch Scholar page for user: {$userId}");
        return null;
    }

    $result = ['articles' => null, 'citations' => null, 'hIndex' => null, 'i10Index' => null];

    // Parse stats table
    if (preg_match('/<table id="gsc_rsb_st"[^>]*>(.*?)<\/table>/s', $html, $tableMatch)) {
        if (preg_match_all('/<tr[^>]*>(.*?)<\/tr>/s', $tableMatch[1], $rowMatches)) {
            foreach ($rowMatches[1] as $rowHtml) {
                if (preg_match_all('/<td[^>]*>(.*?)<\/td>/s', $rowHtml, $cellMatches)) {
                    $cells = array_map('strip_tags', $cellMatches[1]);
                    if (count($cells) >= 2) {
                        $label = strtolower(trim($cells[0]));
                        $val = (int) trim($cells[1]);
                        if (strpos($label, 'citation') !== false) $result['citations'] = $val;
                        elseif (strpos($label, 'h-index') !== false) $result['hIndex'] = $val;
                        elseif (strpos($label, 'i10') !== false) $result['i10Index'] = $val;
                    }
                }
            }
        }
    }

    if ($result['citations'] === null && $result['hIndex'] === null) {
        log_msg('warn', "Could not parse metrics from Scholar page for user: {$userId}");
        return null;
    }

    // Count articles with pagination
    $totalArticles = scholar_count_rows($html);
    if ($totalArticles >= $pageSize) {
        for ($page = 1; $page < $maxPages; $page++) {
            sleep(REQUEST_DELAY_SECONDS);
            $pageHtml = scholar_http_get_cli($baseUrl . '&cstart=' . ($page * $pageSize) . '&pagesize=' . $pageSize);
            if ($pageHtml === false) break;
            $rows = scholar_count_rows($pageHtml);
            if ($rows === 0) break;
            $totalArticles += $rows;
            if ($rows < $pageSize) break;
        }
    }
    $result['articles'] = $totalArticles > 0 ? $totalArticles : null;

    return $result;
}

// ── Main ─────────────────────────────────────────────

$dryRun = in_array('--dry-run', $argv, true);
$targetAuthorId = null;
foreach (array_slice($argv, 1) as $arg) {
    if ($arg !== '--dry-run' && strpos($arg, '-') !== 0) {
        $targetAuthorId = $arg;
    }
}

log_msg('info', 'POOH Scholar Metrics Updater started' . ($dryRun ? ' (DRY RUN)' : ''));

$authors = read_authors_csv();
if (empty($authors)) {
    log_msg('error', 'No authors found in CSV. Exiting.');
    exit(1);
}

$metrics = load_existing_metrics();
$updated = 0;
$skipped = 0;
$failed = 0;

foreach ($authors as $index => $author) {
    $id = $author['id'];
    $name = $author['name'];

    if ($targetAuthorId !== null && $id !== $targetAuthorId) {
        continue;
    }

    $scholarUserId = extract_scholar_user_id($author['google_scholar_url']);
    if ($scholarUserId === '') {
        log_msg('info', "[{$id}] {$name}: No Google Scholar URL configured. Skipping.");
        $skipped++;
        continue;
    }

    log_msg('info', "[{$id}] {$name}: Fetching Google Scholar (user={$scholarUserId})...");

    if ($dryRun) {
        log_msg('info', "[{$id}] DRY RUN — would fetch from Scholar.");
        continue;
    }

    // Rate limiting: delay between requests
    if ($index > 0) {
        sleep(REQUEST_DELAY_SECONDS);
    }

    $scholarData = fetch_google_scholar_metrics($scholarUserId);
    if ($scholarData !== null) {
        if (!isset($metrics[$id])) {
            $metrics[$id] = [];
        }
        $metrics[$id]['googleScholar'] = array_merge($scholarData, [
            'updatedAt' => date('c'),
        ]);
        $updated++;
        log_msg('info', sprintf(
            "[%s] Google Scholar OK — citations: %s, h-index: %s, i10-index: %s, articles: %s",
            $id,
            $scholarData['citations'] ?? '?',
            $scholarData['hIndex'] ?? '?',
            $scholarData['i10Index'] ?? '?',
            $scholarData['articles'] ?? '?'
        ));
    } else {
        $failed++;
        log_msg('warn', "[{$id}] Google Scholar fetch failed. Keeping existing data.");
    }
}

if (!$dryRun && ($updated > 0)) {
    if (save_metrics($metrics)) {
        log_msg('info', "Saved metrics to " . METRICS_JSON);
    } else {
        log_msg('error', "Failed to save metrics!");
        exit(1);
    }
}

log_msg('info', sprintf(
    "Done. Updated: %d, Skipped: %d, Failed: %d",
    $updated,
    $skipped,
    $failed
));
