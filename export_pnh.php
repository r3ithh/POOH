<?php
declare(strict_types=1);

require_once __DIR__ . '/src/I18n.php';
require_once __DIR__ . '/src/PnhExporter.php';

header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: no-referrer');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Content-Type: text/plain; charset=utf-8');
    echo PoohI18n::translate('api.methodPostOnly') . "\n";
    exit;
}

$rawJson = $_POST['net_json'] ?? null;
if (!is_string($rawJson) || trim($rawJson) === '') {
    http_response_code(400);
    header('Content-Type: text/plain; charset=utf-8');
    echo PoohI18n::translate('export.netDataRequired') . "\n";
    exit;
}

try {
    $decoded = json_decode($rawJson, true, 512, JSON_THROW_ON_ERROR);
    if (!is_array($decoded)) {
        throw new InvalidArgumentException(PoohI18n::translate('export.jsonObjectRequired'));
    }

    $exporter = new PnhExporter();
    $pnh = $exporter->export($decoded);

    $filename = 'petri-net-' . date('Ymd-His') . '.pnh';
    header('Content-Type: text/plain; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Content-Length: ' . strlen($pnh));
    echo $pnh;
} catch (InvalidArgumentException $exception) {
    http_response_code(422);
    header('Content-Type: text/plain; charset=utf-8');
    echo PoohI18n::translate('export.generationFailed', ['message' => $exception->getMessage()]) . "\n";
} catch (Throwable $exception) {
    error_log('[POOH][export_pnh] ' . $exception->getMessage() . ' in ' . $exception->getFile() . ':' . $exception->getLine());
    http_response_code(500);
    header('Content-Type: text/plain; charset=utf-8');
    echo PoohI18n::translate('api.serverError') . "\n";
}
