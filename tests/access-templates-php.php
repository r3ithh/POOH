<?php
declare(strict_types=1);

function fail_access_template_test(string $message): never
{
    fwrite(STDERR, $message . "\n");
    exit(1);
}

function read_default_csv_record(string $path): array
{
    $handle = fopen($path, 'rb');
    if ($handle === false) {
        fail_access_template_test("Cannot open template: $path");
    }

    $header = fgetcsv($handle, null, ',', '"', '');
    $row = fgetcsv($handle, null, ',', '"', '');
    fclose($handle);

    if (!is_array($header) || !is_array($row) || count($header) !== count($row)) {
        fail_access_template_test("Invalid CSV example record: $path");
    }

    $record = array_combine($header, $row);
    if (!is_array($record)) {
        fail_access_template_test("Cannot map CSV example record: $path");
    }
    return $record;
}

$root = dirname(__DIR__);
$author = read_default_csv_record($root . '/accesses/authors.default.csv');
if (($author['id'] ?? '') !== 'example_author' || ($author['full_name_en'] ?? '') !== 'Example Researcher') {
    fail_access_template_test('The default author must remain explicitly fictional.');
}

$metricsRaw = file_get_contents($root . '/accesses/scholar_metrics.default.json');
$metrics = is_string($metricsRaw) ? json_decode($metricsRaw, true) : null;
if (!is_array($metrics) || !is_array($metrics[$author['id']] ?? null)) {
    fail_access_template_test('Default metrics must reference the example author id.');
}
foreach (['googleScholar', 'wos'] as $source) {
    $sourceMetrics = $metrics[$author['id']][$source] ?? null;
    if (!is_array($sourceMetrics)) {
        fail_access_template_test("Missing $source example metrics.");
    }
    foreach (['articles', 'citations', 'hIndex', 'i10Index'] as $field) {
        if (!isset($sourceMetrics[$field]) || !is_int($sourceMetrics[$field]) || $sourceMetrics[$field] < 0) {
            fail_access_template_test("Invalid $source.$field example metric.");
        }
    }
}

$user = read_default_csv_record($root . '/accesses/users.default.csv');
if (($user['username'] ?? '') !== 'admin'
    || ($user['enabled'] ?? '') !== '0'
    || ($user['password_hash'] ?? '') !== 'REPLACE_WITH_BCRYPT_HASH') {
    fail_access_template_test('The default administrator must remain disabled and passwordless.');
}

$turnstileRaw = file_get_contents($root . '/accesses/turnstile.default.json');
$turnstile = is_string($turnstileRaw) ? json_decode($turnstileRaw, true) : null;
if (!is_array($turnstile)
    || ($turnstile['enabled'] ?? true) !== false
    || ($turnstile['siteKey'] ?? null) !== ''
    || ($turnstile['secretKey'] ?? null) !== '') {
    fail_access_template_test('The default Turnstile configuration must remain disabled and secret-free.');
}

fwrite(STDOUT, "PHP access-template tests passed.\n");
