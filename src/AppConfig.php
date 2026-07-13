<?php
declare(strict_types=1);

final class PoohAppConfig
{
    private const DEPLOYMENT_MODES = ['public', 'internal', 'development'];

    /** @param array<string,string|null>|null $environment */
    public static function load(?string $projectRoot = null, ?array $environment = null): array
    {
        $root = $projectRoot ?? dirname(__DIR__);
        $config = [
            'deployment' => ['mode' => 'public'],
            'features' => ['researchTeam' => false],
        ];

        foreach (['app.default.php', 'app.php', 'app.local.php'] as $fileName) {
            $config = array_replace_recursive(
                $config,
                self::readConfigurationFile($root . '/config/' . $fileName)
            );
        }

        $modeOverride = self::environmentValue('POOH_DEPLOYMENT_MODE', $environment);
        if ($modeOverride !== null && trim($modeOverride) !== '') {
            $config['deployment']['mode'] = $modeOverride;
        }

        $teamOverride = self::environmentValue('POOH_RESEARCH_TEAM_ENABLED', $environment);
        if ($teamOverride !== null && trim($teamOverride) !== '') {
            $config['features']['researchTeam'] = self::normalizeBoolean($teamOverride, false);
        }

        $config['deployment']['mode'] = self::normalizeDeploymentMode(
            (string) ($config['deployment']['mode'] ?? 'public')
        );
        $config['features']['researchTeam'] = self::normalizeBoolean(
            $config['features']['researchTeam'] ?? false,
            false
        );

        return $config;
    }

    /** @param array<string,mixed> $config */
    public static function researchTeamEnabled(array $config): bool
    {
        return self::deploymentMode($config) !== 'public'
            && self::normalizeBoolean($config['features']['researchTeam'] ?? false, false);
    }

    /** @param array<string,mixed> $config */
    public static function clientConfig(array $config): array
    {
        return [
            'deploymentMode' => self::deploymentMode($config),
            'features' => [
                'researchTeam' => self::researchTeamEnabled($config),
            ],
        ];
    }

    /** @param array<string,mixed> $config */
    public static function deploymentMode(array $config): string
    {
        return self::normalizeDeploymentMode((string) ($config['deployment']['mode'] ?? 'public'));
    }

    /** @return array<string,mixed> */
    private static function readConfigurationFile(string $path): array
    {
        if (!is_file($path)) {
            return [];
        }

        $loaded = (static function (string $configurationPath) {
            return require $configurationPath;
        })($path);

        return is_array($loaded) ? $loaded : [];
    }

    /** @param array<string,string|null>|null $environment */
    private static function environmentValue(string $name, ?array $environment): ?string
    {
        if ($environment !== null) {
            return array_key_exists($name, $environment) && $environment[$name] !== null
                ? (string) $environment[$name]
                : null;
        }

        $value = getenv($name);
        return $value === false ? null : (string) $value;
    }

    private static function normalizeDeploymentMode(string $value): string
    {
        $mode = strtolower(trim($value));
        return in_array($mode, self::DEPLOYMENT_MODES, true) ? $mode : 'public';
    }

    private static function normalizeBoolean(mixed $value, bool $fallback): bool
    {
        if (is_bool($value)) {
            return $value;
        }
        if (is_int($value) || is_float($value)) {
            return $value !== 0;
        }
        if (is_string($value)) {
            $normalized = filter_var(trim($value), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            return $normalized ?? $fallback;
        }
        return $fallback;
    }
}
