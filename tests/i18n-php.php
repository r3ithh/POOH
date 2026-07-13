<?php
declare(strict_types=1);

require_once __DIR__ . '/../src/I18n.php';

function assert_same(string $expected, string $actual, string $label): void
{
    if ($expected === $actual) {
        return;
    }

    fwrite(STDERR, sprintf(
        "%s failed. Expected %s, received %s.\n",
        $label,
        json_encode($expected, JSON_UNESCAPED_UNICODE),
        json_encode($actual, JSON_UNESCAPED_UNICODE)
    ));
    exit(1);
}

assert_same('en', PoohI18n::normalizeLanguage('de-DE'), 'English fallback');
assert_same('pl', PoohI18n::normalizeLanguage('pl-PL'), 'Polish normalization');
assert_same(
    'File upload failed (code 3).',
    PoohI18n::translate('api.uploadFailed', ['code' => 3], 'en'),
    'English interpolation'
);
assert_same(
    'Błąd uploadu pliku (kod 3).',
    PoohI18n::translate('api.uploadFailed', ['code' => 3], 'pl'),
    'Polish interpolation'
);

$_GET = [];
$_POST = [];
$_COOKIE = [];
unset($_SERVER['HTTP_X_POOH_LANGUAGE'], $_SERVER['HTTP_ACCEPT_LANGUAGE']);

$_SERVER['HTTP_ACCEPT_LANGUAGE'] = 'pl-PL,pl;q=0.9,en;q=0.8';
assert_same('pl', PoohI18n::detectLanguage(), 'Accept-Language detection');

$_COOKIE['pooh_language'] = 'en';
assert_same('en', PoohI18n::detectLanguage(), 'Cookie precedence');

$_SERVER['HTTP_X_POOH_LANGUAGE'] = 'pl';
assert_same('pl', PoohI18n::detectLanguage(), 'Header precedence');

$_POST['language'] = 'en';
assert_same('en', PoohI18n::detectLanguage(), 'POST precedence');

$_GET['lang'] = 'pl';
assert_same('pl', PoohI18n::detectLanguage(), 'Query precedence');

fwrite(STDOUT, "PHP i18n tests passed.\n");
