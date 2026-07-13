<?php
declare(strict_types=1);

final class PoohI18n
{
    private const DEFAULT_LANGUAGE = 'en';
    private const SUPPORTED_LANGUAGES = ['en', 'pl'];

    /** @var array<string,array<string,string>>|null */
    private static ?array $catalogs = null;

    public static function normalizeLanguage(?string $value): string
    {
        $candidate = strtolower(trim((string) $value));
        $candidate = preg_split('/[-_]/', $candidate)[0] ?? '';
        return in_array($candidate, self::SUPPORTED_LANGUAGES, true)
            ? $candidate
            : self::DEFAULT_LANGUAGE;
    }

    public static function detectLanguage(): string
    {
        $candidates = [
            $_GET['lang'] ?? null,
            $_POST['language'] ?? null,
            $_SERVER['HTTP_X_POOH_LANGUAGE'] ?? null,
            $_COOKIE['pooh_language'] ?? null,
        ];

        foreach ($candidates as $candidate) {
            if (is_string($candidate) && trim($candidate) !== '') {
                return self::normalizeLanguage($candidate);
            }
        }

        $acceptLanguage = (string) ($_SERVER['HTTP_ACCEPT_LANGUAGE'] ?? '');
        if ($acceptLanguage !== '') {
            $first = trim(explode(',', $acceptLanguage)[0] ?? '');
            if ($first !== '') {
                return self::normalizeLanguage($first);
            }
        }

        return self::DEFAULT_LANGUAGE;
    }

    /** @return array<string,array<string,string>> */
    public static function catalogs(): array
    {
        if (self::$catalogs !== null) {
            return self::$catalogs;
        }

        $catalogs = [];
        foreach (self::SUPPORTED_LANGUAGES as $language) {
            $path = dirname(__DIR__) . '/locales/' . $language . '.json';
            $raw = is_file($path) ? file_get_contents($path) : false;
            $decoded = is_string($raw) ? json_decode($raw, true) : null;
            $catalogs[$language] = is_array($decoded) ? $decoded : [];
        }
        self::$catalogs = $catalogs;
        return self::$catalogs;
    }

    /** @param array<string,scalar|null> $params */
    public static function translate(string $key, array $params = [], ?string $language = null): string
    {
        $catalogs = self::catalogs();
        $selectedLanguage = self::normalizeLanguage($language ?? self::detectLanguage());
        $value = $catalogs[$selectedLanguage][$key]
            ?? $catalogs[self::DEFAULT_LANGUAGE][$key]
            ?? $catalogs['pl'][$key]
            ?? $key;

        return preg_replace_callback(
            '/\{([A-Za-z0-9_]+)\}/',
            static function (array $match) use ($params): string {
                $name = $match[1];
                return array_key_exists($name, $params) ? (string) $params[$name] : $match[0];
            },
            (string) $value
        ) ?? (string) $value;
    }
}
