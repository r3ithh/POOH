<?php
declare(strict_types=1);

require_once __DIR__ . '/../src/AppConfig.php';

function assert_config_same(mixed $expected, mixed $actual, string $label): void
{
    if ($expected === $actual) {
        return;
    }

    fwrite(STDERR, sprintf(
        "%s failed. Expected %s, received %s.\n",
        $label,
        json_encode($expected),
        json_encode($actual)
    ));
    exit(1);
}

$root = dirname(__DIR__);
$publicConfig = PoohAppConfig::load($root, []);
assert_config_same('public', PoohAppConfig::deploymentMode($publicConfig), 'Public mode');
assert_config_same(false, PoohAppConfig::researchTeamEnabled($publicConfig), 'Public team gate');

$internalConfig = PoohAppConfig::load($root, [
    'POOH_DEPLOYMENT_MODE' => 'internal',
    'POOH_RESEARCH_TEAM_ENABLED' => 'true',
]);
assert_config_same('internal', PoohAppConfig::deploymentMode($internalConfig), 'Internal mode override');
assert_config_same(true, PoohAppConfig::researchTeamEnabled($internalConfig), 'Internal team override');

$forcedPublicConfig = PoohAppConfig::load($root, [
    'POOH_DEPLOYMENT_MODE' => 'public',
    'POOH_RESEARCH_TEAM_ENABLED' => 'true',
]);
assert_config_same(false, PoohAppConfig::researchTeamEnabled($forcedPublicConfig), 'Public safety gate');
assert_config_same(
    ['deploymentMode' => 'public', 'features' => ['researchTeam' => false]],
    PoohAppConfig::clientConfig($forcedPublicConfig),
    'Public client configuration'
);

fwrite(STDOUT, "PHP application configuration tests passed.\n");
