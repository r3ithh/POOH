<?php
declare(strict_types=1);

require_once __DIR__ . '/src/I18n.php';
require_once __DIR__ . '/src/AppConfig.php';

$appConfig = PoohAppConfig::load(__DIR__);
$clientAppConfig = PoohAppConfig::clientConfig($appConfig);
$researchTeamEnabled = PoohAppConfig::researchTeamEnabled($appConfig);

header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: no-referrer');
header('X-XSS-Protection: 1; mode=block');

$cssPath = __DIR__ . '/public/styles.css';
$i18nCorePath = __DIR__ . '/src/core/i18n.js';
$structuralXtPath = __DIR__ . '/public/hypergraph-structural-xt.js';
$pnhCorePath = __DIR__ . '/src/core/pnh.js';
$petriLayoutCorePath = __DIR__ . '/src/core/petri-layout.js';
$hypergraphCorePath = __DIR__ . '/src/core/hypergraph.js';
$selectionHypergraphCorePath = __DIR__ . '/src/core/selection-hypergraph.js';
$petriAnalysisCorePath = __DIR__ . '/src/core/petri-analysis.js';
$exportersCorePath = __DIR__ . '/src/core/exporters.js';
$maxPlusCorePath = __DIR__ . '/src/core/max-plus.js';
$decompositionViewCorePath = __DIR__ . '/src/core/decomposition-view.js';
$decompositionRendererCorePath = __DIR__ . '/src/core/decomposition-renderer.js';
$fuzzySourceCorePath = __DIR__ . '/src/core/fuzzy-source.js';
$fuzzyMembershipCorePath = __DIR__ . '/src/core/fuzzy-membership.js';
$fuzzyTransversalCorePath = __DIR__ . '/src/core/fuzzy-transversal.js';
$takagiSugenoCorePath = __DIR__ . '/src/core/takagi-sugeno.js';
$fuzzyArtifactCorePath = __DIR__ . '/src/core/fuzzy-artifact.js';
$fuzzyCorePath = __DIR__ . '/src/core/fuzzy.js';
$benchmarkCorePath = __DIR__ . '/src/core/benchmark.js';
$jsPath  = __DIR__ . '/public/app.js';
$cssHash = is_file($cssPath) ? substr(md5_file($cssPath), 0, 12) : '0';
$i18nCoreHash = is_file($i18nCorePath) ? substr(md5_file($i18nCorePath), 0, 12) : '0';
$structuralXtHash = is_file($structuralXtPath) ? substr(md5_file($structuralXtPath), 0, 12) : '0';
$pnhCoreHash = is_file($pnhCorePath) ? substr(md5_file($pnhCorePath), 0, 12) : '0';
$petriLayoutCoreHash = is_file($petriLayoutCorePath) ? substr(md5_file($petriLayoutCorePath), 0, 12) : '0';
$hypergraphCoreHash = is_file($hypergraphCorePath) ? substr(md5_file($hypergraphCorePath), 0, 12) : '0';
$selectionHypergraphCoreHash = is_file($selectionHypergraphCorePath) ? substr(md5_file($selectionHypergraphCorePath), 0, 12) : '0';
$petriAnalysisCoreHash = is_file($petriAnalysisCorePath) ? substr(md5_file($petriAnalysisCorePath), 0, 12) : '0';
$exportersCoreHash = is_file($exportersCorePath) ? substr(md5_file($exportersCorePath), 0, 12) : '0';
$maxPlusCoreHash = is_file($maxPlusCorePath) ? substr(md5_file($maxPlusCorePath), 0, 12) : '0';
$decompositionViewCoreHash = is_file($decompositionViewCorePath) ? substr(md5_file($decompositionViewCorePath), 0, 12) : '0';
$decompositionRendererCoreHash = is_file($decompositionRendererCorePath) ? substr(md5_file($decompositionRendererCorePath), 0, 12) : '0';
$fuzzySourceCoreHash = is_file($fuzzySourceCorePath) ? substr(md5_file($fuzzySourceCorePath), 0, 12) : '0';
$fuzzyMembershipCoreHash = is_file($fuzzyMembershipCorePath) ? substr(md5_file($fuzzyMembershipCorePath), 0, 12) : '0';
$fuzzyTransversalCoreHash = is_file($fuzzyTransversalCorePath) ? substr(md5_file($fuzzyTransversalCorePath), 0, 12) : '0';
$takagiSugenoCoreHash = is_file($takagiSugenoCorePath) ? substr(md5_file($takagiSugenoCorePath), 0, 12) : '0';
$fuzzyArtifactCoreHash = is_file($fuzzyArtifactCorePath) ? substr(md5_file($fuzzyArtifactCorePath), 0, 12) : '0';
$fuzzyCoreHash = is_file($fuzzyCorePath) ? substr(md5_file($fuzzyCorePath), 0, 12) : '0';
$benchmarkCoreHash = is_file($benchmarkCorePath) ? substr(md5_file($benchmarkCorePath), 0, 12) : '0';
$jsHash  = is_file($jsPath) ? substr(md5_file($jsPath), 0, 12) : '0';
$assetVersion = (string) time();
$initialLanguage = PoohI18n::detectLanguage();
$pageT = static fn(string $key): string => htmlspecialchars(
    PoohI18n::translate($key, [], $initialLanguage),
    ENT_QUOTES,
    'UTF-8'
);
$i18nCatalogsJson = json_encode(
    PoohI18n::catalogs(),
    JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT
);
if (!is_string($i18nCatalogsJson)) {
    $i18nCatalogsJson = '{"en":{},"pl":{}}';
}
$clientAppConfigJson = json_encode(
    $clientAppConfig,
    JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT
);
if (!is_string($clientAppConfigJson)) {
    $clientAppConfigJson = '{"deploymentMode":"public","features":{"researchTeam":false}}';
}
$logoCandidates = [
    __DIR__ . '/public/img/pooh-logo.png',
    __DIR__ . '/public/logo.png',
    __DIR__ . '/public/logo.svg',
    __DIR__ . '/public/logo.jpg',
    __DIR__ . '/public/pooh-logo.png',
];
$logoPublicPath = null;
foreach ($logoCandidates as $candidate) {
    if (is_file($candidate)) {
        $logoPublicPath = str_replace(__DIR__ . '/', '', $candidate);
        break;
    }
}

$turnstileConfig = ['enabled' => false, 'siteKey' => ''];
$turnstileConfigPath = __DIR__ . '/accesses/turnstile.json';
if (is_file($turnstileConfigPath)) {
    $raw = file_get_contents($turnstileConfigPath);
    if ($raw !== false) {
        $decoded = json_decode($raw, true);
        if (is_array($decoded)) {
            $turnstileConfig = [
                'enabled' => !empty($decoded['enabled']),
                'siteKey' => (string) ($decoded['siteKey'] ?? ''),
            ];
        }
    }
}
?>
<!doctype html>
<html lang="<?= htmlspecialchars($initialLanguage, ENT_QUOTES, 'UTF-8') ?>">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="keywords" content="Petri nets, hypergraphs, exact transversals, r-exact hypergraphs, 1-exact hypergraphs, XT-hypergraphs, decomposition, concurrent control systems, P-invariants, state machine components, FPGA prototyping, PLC prototyping, tool">
  <title>POOH: Power Objects of Hypergraphs</title>
  <link rel="stylesheet" href="public/styles.css?v=<?= htmlspecialchars($cssHash, ENT_QUOTES, 'UTF-8') ?>">
<?php if ($turnstileConfig['enabled'] && $turnstileConfig['siteKey']): ?>
  <script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" async defer></script>
<?php endif; ?>
</head>
<body data-theme="light" data-deployment-mode="<?= htmlspecialchars(PoohAppConfig::deploymentMode($appConfig), ENT_QUOTES, 'UTF-8') ?>" data-turnstile-enabled="<?= $turnstileConfig['enabled'] ? '1' : '0' ?>" data-turnstile-sitekey="<?= htmlspecialchars($turnstileConfig['siteKey'], ENT_QUOTES, 'UTF-8') ?>">
  <header class="app-header">
    <div class="brand-wrap">
      <button type="button" class="icon-btn" id="sidebar-toggle" aria-label="<?= $pageT('header.sidebarToggle') ?>" data-i18n-aria-label="header.sidebarToggle">☰</button>
      <div class="brand">
        <?php if ($logoPublicPath !== null): ?>
          <img src="<?= htmlspecialchars($logoPublicPath, ENT_QUOTES, 'UTF-8') ?>?v=<?= htmlspecialchars($assetVersion, ENT_QUOTES, 'UTF-8') ?>" alt="POOH logo" class="brand-logo">
        <?php else: ?>
          <div class="brand-fallback">POOH</div>
        <?php endif; ?>
	        <div>
	          <h1>POOH</h1>
	          <p id="brand-subtitle" data-i18n="brand.subtitle"><?= $pageT('brand.subtitle') ?></p>
	        </div>
	      </div>
	    </div>

	    <div class="header-center">
      <button type="button" id="about-open-btn" class="system-version-bar" aria-label="<?= $pageT('header.aboutSystem') ?>" data-i18n-aria-label="header.aboutSystem">
	        <span class="system-version-dot" aria-hidden="true"></span>
	        <span id="system-version-label" class="system-version-label" data-i18n="header.systemVersion"><?= $pageT('header.systemVersion') ?></span>
	        <strong id="system-version-text" class="system-version-text">v1.0b33a1 BETA</strong>
	      </button>
	    </div>

	    <div class="header-actions">
	      <label class="theme-switch" for="theme-toggle">
	        <input type="checkbox" id="theme-toggle">
	        <span id="theme-toggle-label" data-i18n="header.darkTheme"><?= $pageT('header.darkTheme') ?></span>
	      </label>
	      <div id="header-auth-area" class="header-auth-area">
	        <div id="header-auth-logged-out" class="header-auth-logged-out">
	          <button type="button" id="header-login-btn" class="header-login-btn">🔐 <span id="header-login-btn-label" data-i18n="lib.login"><?= $pageT('lib.login') ?></span></button>
	        </div>
	        <div id="header-auth-logged-in" class="header-auth-logged-in hidden">
	          <span id="header-auth-user-info" class="header-auth-user-info"></span>
	          <button type="button" id="header-logout-btn" class="header-logout-btn"><span id="header-logout-btn-label" data-i18n="lib.logout"><?= $pageT('lib.logout') ?></span></button>
	        </div>
	      </div>
	      <label class="language-switch" for="language-select">
	        <span id="language-select-label" data-i18n="header.language"><?= $pageT('header.language') ?></span>
	        <span id="language-current-flag" class="language-flag" aria-hidden="true">🇬🇧</span>
	        <select id="language-select" aria-label="<?= $pageT('header.languageChoice') ?>" data-i18n-aria-label="header.languageChoice">
	          <option value="en" data-flag="🇬🇧">🇬🇧 English</option>
	          <option value="pl" data-flag="🇵🇱">🇵🇱 Polski</option>
	        </select>
	      </label>
	      <button type="button" class="icon-btn" id="inspector-toggle" aria-label="<?= $pageT('inspector.toggle') ?>" data-i18n-aria-label="inspector.toggle" title="<?= $pageT('inspector.toggle') ?>" data-i18n-title="inspector.toggle">⚙</button>
	    </div>
	  </header>
  <main class="app-shell">
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-nav" role="tablist" aria-label="<?= $pageT('nav.menuCategories') ?>" data-i18n-aria-label="nav.menuCategories">
        <button type="button" id="sidebar-tab-sim" class="sidebar-tab-btn active" data-sidebar-tab="sim" role="tab" aria-selected="true" aria-controls="sidebar-panel-sim" title="<?= $pageT('nav.sim') ?>" data-i18n-title="nav.sim">
          <span class="sidebar-tab-icon">▶</span>
          <span class="sidebar-tab-text" data-i18n="nav.sim"><?= $pageT('nav.sim') ?></span>
          <span class="sidebar-tab-badge beta">BETA</span>
        </button>
        <button type="button" id="sidebar-tab-sfc" class="sidebar-tab-btn" data-sidebar-tab="sfc" role="tab" aria-selected="false" aria-controls="sidebar-panel-sfc" title="<?= $pageT('panel.sfc') ?>" data-i18n-title="panel.sfc">
          <span class="sidebar-tab-icon">⌬</span>
          <span class="sidebar-tab-text" data-i18n="nav.sfc"><?= $pageT('nav.sfc') ?></span>
          <span class="sidebar-tab-badge alpha">ALPHA</span>
        </button>
        <button type="button" id="sidebar-tab-fuzzy" class="sidebar-tab-btn" data-sidebar-tab="fuzzy" role="tab" aria-selected="false" aria-controls="sidebar-panel-fuzzy" title="<?= $pageT('panel.fuzzy') ?>" data-i18n-title="panel.fuzzy">
          <span class="sidebar-tab-icon">μ</span>
          <span class="sidebar-tab-text" data-i18n="nav.fuzzy"><?= $pageT('nav.fuzzy') ?></span>
          <span class="sidebar-tab-badge alpha">ALPHA</span>
        </button>
        <button type="button" id="sidebar-tab-draw" class="sidebar-tab-btn" data-sidebar-tab="draw" role="tab" aria-selected="false" aria-controls="sidebar-panel-draw" title="<?= $pageT('workspace.hypergraphTab') ?>" data-i18n-title="workspace.hypergraphTab">
          <span class="sidebar-tab-icon">⬡</span>
          <span class="sidebar-tab-text" data-i18n="nav.draw"><?= $pageT('nav.draw') ?></span>
          <span class="sidebar-tab-badge alpha">ALPHA</span>
        </button>
        <button type="button" id="sidebar-tab-io" class="sidebar-tab-btn" data-sidebar-tab="io" role="tab" aria-selected="false" aria-controls="sidebar-panel-io" title="<?= $pageT('panel.io') ?>" data-i18n-title="panel.io">
          <span class="sidebar-tab-icon">⇅</span>
          <span class="sidebar-tab-text" data-i18n="nav.io"><?= $pageT('nav.io') ?></span>
        </button>
        <button type="button" id="sidebar-tab-gen" class="sidebar-tab-btn" data-sidebar-tab="gen" role="tab" aria-selected="false" aria-controls="sidebar-panel-gen" title="<?= $pageT('panel.gen') ?>" data-i18n-title="panel.gen">
          <span class="sidebar-tab-icon">⚙</span>
          <span class="sidebar-tab-text" data-i18n="nav.gen"><?= $pageT('nav.gen') ?></span>
        </button>
        <button type="button" id="sidebar-tab-lib" class="sidebar-tab-btn" data-sidebar-tab="lib" role="tab" aria-selected="false" aria-controls="sidebar-panel-lib" title="<?= $pageT('panel.lib') ?>" data-i18n-title="panel.lib">
          <span class="sidebar-tab-icon">▦</span>
          <span class="sidebar-tab-text" data-i18n="nav.lib"><?= $pageT('nav.lib') ?></span>
        </button>
        <button type="button" id="sidebar-tab-bench" class="sidebar-tab-btn" data-sidebar-tab="bench" role="tab" aria-selected="false" aria-controls="sidebar-panel-bench" title="<?= $pageT('nav.bench') ?>" data-i18n-title="nav.bench">
          <span class="sidebar-tab-icon">⏱</span>
          <span class="sidebar-tab-text" data-i18n="nav.bench"><?= $pageT('nav.bench') ?></span>
        </button>
        <button type="button" id="sidebar-tab-meta" class="sidebar-tab-btn" data-sidebar-tab="meta" role="tab" aria-selected="false" aria-controls="sidebar-panel-meta" title="<?= $pageT('panel.meta') ?>" data-i18n-title="panel.meta">
          <span class="sidebar-tab-icon">⌘</span>
          <span class="sidebar-tab-text" data-i18n="nav.meta"><?= $pageT('nav.meta') ?></span>
        </button>
        <button type="button" id="sidebar-tab-class" class="sidebar-tab-btn" data-sidebar-tab="class" role="tab" aria-selected="false" aria-controls="sidebar-panel-class" title="<?= $pageT('panel.class') ?>" data-i18n-title="panel.class">
          <span class="sidebar-tab-icon">◈</span>
          <span class="sidebar-tab-text" data-i18n="nav.class"><?= $pageT('nav.class') ?></span>
        </button>
<?php if ($researchTeamEnabled): ?>
        <button type="button" id="sidebar-tab-auth" class="sidebar-tab-btn" data-sidebar-tab="auth" role="tab" aria-selected="false" aria-controls="sidebar-panel-auth" title="<?= $pageT('nav.auth') ?>" data-i18n-title="nav.auth">
          <span class="sidebar-tab-icon">👥</span>
          <span class="sidebar-tab-text" data-i18n="nav.team"><?= $pageT('nav.team') ?></span>
        </button>
<?php endif; ?>
        <button type="button" id="sidebar-tab-docs" class="sidebar-tab-btn" data-sidebar-tab="docs" role="tab" aria-selected="false" aria-controls="sidebar-panel-docs" title="<?= $pageT('docs.systemTitle') ?>" data-i18n-title="docs.systemTitle">
          <span class="sidebar-tab-icon">📖</span>
          <span class="sidebar-tab-text" data-i18n="docs.title"><?= $pageT('docs.title') ?></span>
        </button>
      </div>
      <p class="sidebar-note" data-i18n="sidebar.note"><?= $pageT('sidebar.note') ?></p>

      <div class="sidebar-panels">
        <section id="sidebar-panel-sim" class="sidebar-tab-panel active" data-sidebar-panel="sim" role="tabpanel" aria-labelledby="sidebar-tab-sim">
          <h2 class="sidebar-panel-title"><span class="sidebar-panel-icon">▶</span><?= $pageT('panel.sim') ?></h2>
          <div class="analysis-flow">
            <section class="analysis-tool-card" aria-labelledby="analysis-check-title">
              <div class="analysis-card-heading">
                <span id="analysis-check-kicker" class="analysis-card-kicker" data-i18n="analysis.checkKicker"><?= $pageT('analysis.checkKicker') ?></span>
                <h3 id="analysis-check-title" class="analysis-card-title" data-i18n="analysis.checkTitle"><?= $pageT('analysis.checkTitle') ?></h3>
              </div>
              <div class="button-group analysis-action-group">
                <button type="button" id="analyze-btn" data-i18n="sim.analyze"><?= $pageT('sim.analyze') ?></button>
              </div>
              <div id="analysis-result" class="hint" data-i18n="status.analysisIdle"><?= $pageT('status.analysisIdle') ?></div>
            </section>

            <section class="analysis-step-card" aria-labelledby="analysis-pinv-title">
              <div class="analysis-step-header">
                <span class="analysis-step-index">(1)</span>
                <div>
                  <h3 id="analysis-pinv-title" class="analysis-card-title" data-i18n="analysis.pinvTitle"><?= $pageT('analysis.pinvTitle') ?></h3>
                  <p id="analysis-pinv-note" class="analysis-step-note" data-i18n="analysis.pinvNote"><?= $pageT('analysis.pinvNote') ?></p>
                </div>
              </div>
              <label class="analysis-control">
                <span class="i18n-label" data-i18n="sim.pinvLabel"><?= $pageT('sim.pinvLabel') ?></span>
                <select id="pinv-mode-select">
                  <option value="cover-stop" data-i18n="pinv.mode.coverStop"><?= $pageT('pinv.mode.coverStop') ?></option>
                  <option value="full" data-i18n="pinv.mode.full"><?= $pageT('pinv.mode.full') ?></option>
                </select>
              </label>
              <div class="button-group analysis-action-group">
                <button type="button" id="pinv-run-btn" data-i18n="sim.runPinv"><?= $pageT('sim.runPinv') ?></button>
              </div>
              <div id="pinv-status" class="hint" data-i18n="status.pinvIdle"><?= $pageT('status.pinvIdle') ?></div>
              <pre id="pinv-output" class="result-pre hint" data-i18n="status.pinvOutputNone"><?= $pageT('status.pinvOutputNone') ?></pre>
              <pre id="pinv-matrix-output" class="result-pre hint" data-i18n="status.pinvMatrixNone"><?= $pageT('status.pinvMatrixNone') ?></pre>
            </section>

            <section class="analysis-step-card" aria-labelledby="analysis-hypergraph-title">
              <div class="analysis-step-header">
                <span class="analysis-step-index">(2)</span>
                <div>
                  <h3 id="analysis-hypergraph-title" class="analysis-card-title" data-i18n="analysis.hypergraphTitle"><?= $pageT('analysis.hypergraphTitle') ?></h3>
                  <p id="analysis-hypergraph-note" class="analysis-step-note" data-i18n="analysis.hypergraphNote"><?= $pageT('analysis.hypergraphNote') ?></p>
                </div>
              </div>
              <label class="analysis-control">
                <span class="i18n-label" data-i18n="sim.transversalLabel"><?= $pageT('sim.transversalLabel') ?></span>
                <select id="transversal-strategy-select">
                  <option value="all" data-i18n="transversal.all"><?= $pageT('transversal.all') ?></option>
                  <option value="xtr" data-i18n="transversal.xtr"><?= $pageT('transversal.xtr') ?></option>
                  <option value="dlx" data-i18n="transversal.dlx"><?= $pageT('transversal.dlx') ?></option>
                  <option value="backtracking" data-i18n="transversal.backtracking"><?= $pageT('transversal.backtracking') ?></option>
                  <option value="greedy" data-i18n="transversal.greedy"><?= $pageT('transversal.greedy') ?></option>
                </select>
              </label>
              <label class="analysis-control">
                <span class="i18n-label" data-i18n="sim.selectionDrawVariant"><?= $pageT('sim.selectionDrawVariant') ?></span>
                <select id="selection-hypergraph-view-select">
                  <option value="reduced" data-i18n="selection.draw.reduced"><?= $pageT('selection.draw.reduced') ?></option>
                  <option value="original" data-i18n="selection.draw.original"><?= $pageT('selection.draw.original') ?></option>
                </select>
              </label>
              <div class="button-group analysis-action-group">
                <button type="button" id="selection-hypergraph-btn" data-i18n="sim.selectionButton"><?= $pageT('sim.selectionButton') ?></button>
                <button type="button" id="selection-hypergraph-draw-btn" data-i18n="sim.drawSelectionHypergraph"><?= $pageT('sim.drawSelectionHypergraph') ?></button>
                <button type="button" id="selection-hypergraph-compare-btn" data-i18n="sim.compareSelectionHypergraph"><?= $pageT('sim.compareSelectionHypergraph') ?></button>
              </div>
              <div id="selection-hypergraph-status" class="hint" data-i18n="status.selectionIdle"><?= $pageT('status.selectionIdle') ?></div>
              <pre id="selection-hypergraph-output" class="result-pre hint" data-i18n="status.selectionOutputNone"><?= $pageT('status.selectionOutputNone') ?></pre>
            </section>
          </div>
        </section>

        <section id="sidebar-panel-sfc" class="sidebar-tab-panel hidden" data-sidebar-panel="sfc" role="tabpanel" aria-labelledby="sidebar-tab-sfc">
          <h2 class="sidebar-panel-title"><span class="sidebar-panel-icon">⌬</span><?= $pageT('panel.sfc') ?></h2>
          <label>
            <?= $pageT('sfc.profile') ?>
            <select id="sfc-profile-select">
              <option value="hybrid" data-i18n="sfc.profile.hybrid"><?= $pageT('sfc.profile.hybrid') ?></option>
              <option value="strict" data-i18n="sfc.profile.strict"><?= $pageT('sfc.profile.strict') ?></option>
            </select>
          </label>
          <label>
            <?= $pageT('sfc.sync') ?>
            <select id="sfc-sync-select">
              <option value="handshake" data-i18n="sfc.sync.handshake"><?= $pageT('sfc.sync.handshake') ?></option>
              <option value="none" data-i18n="sfc.sync.none"><?= $pageT('sfc.sync.none') ?></option>
            </select>
          </label>
          <label>
            <?= $pageT('sfc.source') ?>
            <select id="sfc-source-select">
              <option value="recommended" data-i18n="sfc.source.recommended"><?= $pageT('sfc.source.recommended') ?></option>
              <option value="all-correct" data-i18n="sfc.source.allCorrect"><?= $pageT('sfc.source.allCorrect') ?></option>
            </select>
          </label>
          <label>
            <?= $pageT('sfc.ideTarget') ?>
            <select id="sfc-ide-target-select">
              <option value="codesys" data-i18n="sfc.ideTarget.codesys"><?= $pageT('sfc.ideTarget.codesys') ?></option>
              <option value="tia" data-i18n="sfc.ideTarget.tia"><?= $pageT('sfc.ideTarget.tia') ?></option>
            </select>
          </label>
          <label>
            <?= $pageT('sfc.traceLength') ?>
            <input type="number" id="sfc-trace-length" min="10" max="5000" step="10" value="300">
          </label>
          <label>
            <?= $pageT('sfc.maxplus.defaultDelay') ?>
            <input type="number" id="sfc-maxplus-default-delay" min="0" step="0.1" value="1">
          </label>
          <label>
            <?= $pageT('sfc.maxplus.delayMap') ?>
            <input type="text" id="sfc-maxplus-delay-map" placeholder="<?= $pageT('sfc.maxplus.delayMapPlaceholder') ?>" data-i18n-placeholder="sfc.maxplus.delayMapPlaceholder">
          </label>
          <label>
            <?= $pageT('sfc.maxplus.syncOverhead') ?>
            <input type="number" id="sfc-maxplus-sync-overhead" min="0" step="0.1" value="0">
          </label>
          <div class="button-group">
            <button type="button" id="sfc-build-btn" data-i18n="sfc.build"><?= $pageT('sfc.build') ?></button>
            <button type="button" id="sfc-validate-btn" data-i18n="sfc.validate"><?= $pageT('sfc.validate') ?></button>
            <button type="button" id="sfc-maxplus-run-btn" data-i18n="sfc.maxplus.run"><?= $pageT('sfc.maxplus.run') ?></button>
          </div>
          <div class="button-group">
            <button type="button" id="sfc-export-xml-btn" data-i18n="sfc.exportXml"><?= $pageT('sfc.exportXml') ?></button>
            <button type="button" id="sfc-export-st-btn" data-i18n="sfc.exportSt"><?= $pageT('sfc.exportSt') ?></button>
            <button type="button" id="sfc-export-ide-btn" data-i18n="sfc.exportIde"><?= $pageT('sfc.exportIde') ?></button>
          </div>
          <div id="sfc-status" class="hint" data-i18n="status.sfcReady"><?= $pageT('status.sfcReady') ?></div>
          <pre id="sfc-output" class="result-pre hint" data-i18n="status.sfcOutputNone"><?= $pageT('status.sfcOutputNone') ?></pre>
          <pre id="sfc-validation-output" class="result-pre hint" data-i18n="status.sfcValidationNone"><?= $pageT('status.sfcValidationNone') ?></pre>
          <pre id="sfc-maxplus-output" class="result-pre hint" data-i18n="status.sfcMaxPlusNone"><?= $pageT('status.sfcMaxPlusNone') ?></pre>
        </section>

        <section id="sidebar-panel-fuzzy" class="sidebar-tab-panel hidden" data-sidebar-panel="fuzzy" role="tabpanel" aria-labelledby="sidebar-tab-fuzzy">
          <h2 class="sidebar-panel-title"><span class="sidebar-panel-icon">μ</span><?= $pageT('panel.fuzzy') ?></h2>
          <div class="research-pipeline">
            <span>Petri</span>
            <span>XT</span>
            <span>SMC</span>
            <span>max-plus</span>
            <span>T-S</span>
          </div>
          <p id="fuzzy-panel-hint" class="hint" data-i18n="fuzzy.hint"><?= $pageT('fuzzy.hint') ?></p>

          <label>
            <span id="fuzzy-source-label" data-i18n="fuzzy.source"><?= $pageT('fuzzy.source') ?></span>
            <select id="fuzzy-source-select">
              <option value="petri" data-i18n="fuzzy.sourcePetri"><?= $pageT('fuzzy.sourcePetri') ?></option>
              <option value="hypergraph" data-i18n="fuzzy.sourceHypergraph"><?= $pageT('fuzzy.sourceHypergraph') ?></option>
            </select>
          </label>
          <div id="fuzzy-source-note" class="fuzzy-source-note hint" data-i18n="fuzzy.sourceCombinedNote"><?= $pageT('fuzzy.sourceCombinedNote') ?></div>
          <div id="fuzzy-hypergraph-mapping-card" class="fuzzy-mapping-card hidden">
            <div id="fuzzy-mapping-title" class="fuzzy-membership-title" data-i18n="fuzzy.mappingTitle"><?= $pageT('fuzzy.mappingTitle') ?></div>
            <div id="fuzzy-mapping-hint" class="hint" data-i18n="fuzzy.mappingHint"><?= $pageT('fuzzy.mappingHint') ?></div>
            <div class="button-group fuzzy-mapping-actions">
              <button type="button" id="fuzzy-mapping-refresh-btn" data-i18n="fuzzy.mappingRefresh"><?= $pageT('fuzzy.mappingRefresh') ?></button>
              <button type="button" id="fuzzy-mapping-auto-btn" data-i18n="fuzzy.mappingAuto"><?= $pageT('fuzzy.mappingAuto') ?></button>
              <button type="button" id="fuzzy-mapping-clear-btn" data-i18n="fuzzy.mappingClear"><?= $pageT('fuzzy.mappingClear') ?></button>
            </div>
            <div id="fuzzy-mapping-status" class="hint" data-i18n="fuzzy.mappingWaiting"><?= $pageT('fuzzy.mappingWaiting') ?></div>
            <div id="fuzzy-mapping-list" class="fuzzy-mapping-list"></div>
          </div>

          <div class="inline-two-equal">
            <label>
              <span id="fuzzy-alpha-label" data-i18n="fuzzy.alpha"><?= $pageT('fuzzy.alpha') ?></span>
              <input type="number" id="fuzzy-alpha-input" min="0" max="1" step="0.05" value="0.70">
            </label>
            <label>
              <span id="fuzzy-alpha-step-label" data-i18n="fuzzy.alphaStep"><?= $pageT('fuzzy.alphaStep') ?></span>
              <input type="number" id="fuzzy-alpha-step-input" min="0.01" max="0.5" step="0.01" value="0.05">
            </label>
          </div>
          <div class="inline-two-equal">
            <label>
              <span id="fuzzy-default-delay-label" data-i18n="fuzzy.defaultDelay"><?= $pageT('fuzzy.defaultDelay') ?></span>
              <input type="number" id="fuzzy-default-delay-input" min="0" step="0.1" value="1">
            </label>
            <label>
              <span id="fuzzy-sync-overhead-label" data-i18n="fuzzy.syncOverhead"><?= $pageT('fuzzy.syncOverhead') ?></span>
              <input type="number" id="fuzzy-sync-overhead-input" min="0" step="0.1" value="0">
            </label>
          </div>
          <label>
            <span id="fuzzy-delay-map-label" data-i18n="fuzzy.delayMap"><?= $pageT('fuzzy.delayMap') ?></span>
            <input type="text" id="fuzzy-delay-map-input" placeholder="<?= $pageT('sfc.maxplus.delayMapPlaceholder') ?>" data-i18n-placeholder="sfc.maxplus.delayMapPlaceholder">
          </label>
          <div class="fuzzy-membership-card">
            <div id="fuzzy-membership-title" class="fuzzy-membership-title" data-i18n="fuzzy.membershipTitle"><?= $pageT('fuzzy.membershipTitle') ?></div>
            <div class="fuzzy-membership-grid">
              <label>
                <span id="fuzzy-mu-base-label" data-i18n="fuzzy.muBase"><?= $pageT('fuzzy.muBase') ?></span>
                <input type="number" id="fuzzy-mu-base-input" min="0" max="1" step="0.01" value="0.34">
              </label>
              <label>
                <span id="fuzzy-mu-concurrency-label" data-i18n="fuzzy.muConcurrency"><?= $pageT('fuzzy.muConcurrency') ?></span>
                <input type="number" id="fuzzy-mu-concurrency-input" min="0" max="1" step="0.01" value="0.16">
              </label>
              <label>
                <span id="fuzzy-mu-conflict-label" data-i18n="fuzzy.muConflict"><?= $pageT('fuzzy.muConflict') ?></span>
                <input type="number" id="fuzzy-mu-conflict-input" min="0" max="1" step="0.01" value="0.16">
              </label>
              <label>
                <span id="fuzzy-mu-time-label" data-i18n="fuzzy.muTime"><?= $pageT('fuzzy.muTime') ?></span>
                <input type="number" id="fuzzy-mu-time-input" min="0" max="1" step="0.01" value="0.16">
              </label>
              <label>
                <span id="fuzzy-mu-coupling-label" data-i18n="fuzzy.muCoupling"><?= $pageT('fuzzy.muCoupling') ?></span>
                <input type="number" id="fuzzy-mu-coupling-input" min="0" max="1" step="0.01" value="0.10">
              </label>
              <label>
                <span id="fuzzy-mu-reconfiguration-label" data-i18n="fuzzy.muReconfiguration"><?= $pageT('fuzzy.muReconfiguration') ?></span>
                <input type="number" id="fuzzy-mu-reconfiguration-input" min="0" max="1" step="0.01" value="0.08">
              </label>
            </div>
          </div>
	          <div class="fuzzy-constraint-grid">
	            <label>
	              <span id="fuzzy-max-size-label" data-i18n="fuzzy.maxSize"><?= $pageT('fuzzy.maxSize') ?></span>
	              <input type="number" id="fuzzy-max-size-input" min="0" step="1" value="0">
	            </label>
	            <label>
	              <span id="fuzzy-max-coupling-label" data-i18n="fuzzy.maxCoupling"><?= $pageT('fuzzy.maxCoupling') ?></span>
	              <input type="number" id="fuzzy-max-coupling-input" min="0" max="1" step="0.05" value="1">
	            </label>
	            <label>
	              <span id="fuzzy-lambda-limit-label" data-i18n="fuzzy.lambdaLimit"><?= $pageT('fuzzy.lambdaLimit') ?></span>
	              <input type="number" id="fuzzy-lambda-limit-input" min="0" step="0.1" placeholder="<?= $pageT('fuzzy.lambdaLimitPlaceholder') ?>" data-i18n-placeholder="fuzzy.lambdaLimitPlaceholder">
	            </label>
	            <label>
	              <span id="fuzzy-mpc-horizon-label" data-i18n="fuzzy.mpcHorizon"><?= $pageT('fuzzy.mpcHorizon') ?></span>
	              <input type="number" id="fuzzy-mpc-horizon-input" min="1" max="50" step="1" value="6">
	            </label>
	          </div>
	          <label>
	            <span id="fuzzy-experiment-label-label" data-i18n="fuzzy.experimentLabel"><?= $pageT('fuzzy.experimentLabel') ?></span>
	            <input type="text" id="fuzzy-experiment-label-input" maxlength="120" placeholder="<?= $pageT('fuzzy.experimentLabelPlaceholder') ?>" data-i18n-placeholder="fuzzy.experimentLabelPlaceholder">
	          </label>

	          <div class="button-group">
	            <button type="button" id="fuzzy-build-btn" data-i18n="fuzzy.build"><?= $pageT('fuzzy.build') ?></button>
	            <button type="button" id="fuzzy-show-hypergraph-solution-btn" data-i18n="fuzzy.showHypergraphSolution"><?= $pageT('fuzzy.showHypergraphSolution') ?></button>
	          </div>
	          <div class="button-group fuzzy-export-actions">
	            <button type="button" id="fuzzy-export-json-btn" data-i18n="fuzzy.exportJson"><?= $pageT('fuzzy.exportJson') ?></button>
	            <button type="button" id="fuzzy-export-csv-btn" data-i18n="bench.exportCsv"><?= $pageT('bench.exportCsv') ?></button>
	            <button type="button" id="fuzzy-export-alpha-csv-btn" data-i18n="fuzzy.exportAlphaCsv"><?= $pageT('fuzzy.exportAlphaCsv') ?></button>
	            <button type="button" id="fuzzy-export-mu-csv-btn" data-i18n="fuzzy.exportMuCsv"><?= $pageT('fuzzy.exportMuCsv') ?></button>
	            <button type="button" id="fuzzy-export-latex-btn" data-i18n="fuzzy.exportLatex"><?= $pageT('fuzzy.exportLatex') ?></button>
	            <button type="button" id="fuzzy-export-report-btn" data-i18n="fuzzy.exportReport"><?= $pageT('fuzzy.exportReport') ?></button>
	          </div>
	          <div class="fuzzy-run-registry">
	            <div class="button-group fuzzy-run-actions">
	              <button type="button" id="fuzzy-save-run-btn" data-i18n="fuzzy.saveRun"><?= $pageT('fuzzy.saveRun') ?></button>
	              <button type="button" id="fuzzy-refresh-runs-btn" data-i18n="fuzzy.refreshRuns"><?= $pageT('fuzzy.refreshRuns') ?></button>
	            </div>
	            <div id="fuzzy-runs-status" class="hint" data-i18n="status.fuzzyRunsReady"><?= $pageT('status.fuzzyRunsReady') ?></div>
	            <div id="fuzzy-runs-list" class="research-run-list"></div>
	            <pre id="fuzzy-runs-compare" class="result-pre hint" data-i18n="status.fuzzyRunsNone"><?= $pageT('status.fuzzyRunsNone') ?></pre>
	          </div>
          <div id="fuzzy-status" class="hint" data-i18n="status.fuzzyReady"><?= $pageT('status.fuzzyReady') ?></div>
          <pre id="fuzzy-pipeline-output" class="result-pre hint" data-i18n="status.fuzzyPipelineNone"><?= $pageT('status.fuzzyPipelineNone') ?></pre>
          <pre id="fuzzy-membership-output" class="result-pre hint" data-i18n="status.fuzzyMembershipNone"><?= $pageT('status.fuzzyMembershipNone') ?></pre>
          <pre id="fuzzy-relations-output" class="result-pre hint" data-i18n="status.fuzzyRelationsNone"><?= $pageT('status.fuzzyRelationsNone') ?></pre>
          <pre id="fuzzy-maxplus-output" class="result-pre hint" data-i18n="status.fuzzyMaxPlusNone"><?= $pageT('status.fuzzyMaxPlusNone') ?></pre>
          <pre id="fuzzy-rules-output" class="result-pre hint" data-i18n="status.fuzzyRulesNone"><?= $pageT('status.fuzzyRulesNone') ?></pre>
        </section>

        <section id="sidebar-panel-draw" class="sidebar-tab-panel hidden" data-sidebar-panel="draw" role="tabpanel" aria-labelledby="sidebar-tab-draw">
          <h2 class="sidebar-panel-title"><span class="sidebar-panel-icon">⬡</span><?= $pageT('workspace.hypergraphTab') ?></h2>
          <div class="button-group analysis-action-group">
            <button type="button" id="hypergraph-open-editor-btn" data-i18n="hypergraphEditor.open"><?= $pageT('hypergraphEditor.open') ?></button>
          </div>
          <div id="hypergraph-editor-panel-status" class="hint" data-i18n="hypergraphEditor.panelStatus"><?= $pageT('hypergraphEditor.panelStatus') ?></div>
          <pre id="hypergraph-editor-summary" class="result-pre hint" data-i18n="hypergraphEditor.summaryNone"><?= $pageT('hypergraphEditor.summaryNone') ?></pre>
        </section>

        <section id="sidebar-panel-io" class="sidebar-tab-panel hidden" data-sidebar-panel="io" role="tabpanel" aria-labelledby="sidebar-tab-io">
          <h2 class="sidebar-panel-title"><span class="sidebar-panel-icon">⇅</span><?= $pageT('panel.io') ?></h2>
          <label>
            <?= $pageT('io.layoutModeLabel') ?>
            <select id="layout-mode-select">
              <option value="smart" data-i18n="layout.smart"><?= $pageT('layout.smart') ?></option>
              <option value="layered" data-i18n="layout.layered"><?= $pageT('layout.layered') ?></option>
              <option value="radial" data-i18n="layout.radial"><?= $pageT('layout.radial') ?></option>
              <option value="organic" data-i18n="layout.organic"><?= $pageT('layout.organic') ?></option>
              <option value="coordinates" data-i18n="layout.coordinates"><?= $pageT('layout.coordinates') ?></option>
            </select>
          </label>

          <div class="button-group">
            <button type="button" id="relayout-btn" data-i18n="io.relayout"><?= $pageT('io.relayout') ?></button>
          </div>

          <div class="button-group">
            <button type="button" id="new-net-btn" data-i18n="io.newNet"><?= $pageT('io.newNet') ?></button>
            <button type="button" id="save-json-btn" data-i18n="io.saveJson"><?= $pageT('io.saveJson') ?></button>
            <button type="button" id="load-json-btn" data-i18n="io.loadJson"><?= $pageT('io.loadJson') ?></button>
            <input type="file" id="load-json-input" accept=".json,application/json" hidden>
            <button type="button" id="load-pnh-btn" data-i18n="io.loadPnh"><?= $pageT('io.loadPnh') ?></button>
            <input type="file" id="load-pnh-input" accept=".pnh,text/plain" hidden>
            <button type="button" id="export-pnh-btn" data-i18n="io.exportPnh"><?= $pageT('io.exportPnh') ?></button>
          </div>
        </section>

        <section id="sidebar-panel-gen" class="sidebar-tab-panel hidden" data-sidebar-panel="gen" role="tabpanel" aria-labelledby="sidebar-tab-gen">
          <h2 class="sidebar-panel-title"><span class="sidebar-panel-icon">⚙</span><?= $pageT('panel.gen') ?></h2>
          <div class="inline-two-equal">
            <label>
              <?= $pageT('gen.placeCount') ?>
              <input type="number" id="gen-place-count" min="1" step="1" value="12">
            </label>
            <label>
              <?= $pageT('gen.transitionCount') ?>
              <input type="number" id="gen-transition-count" min="1" step="1" value="12">
            </label>
          </div>

          <label>
            <?= $pageT('gen.netType') ?>
            <select id="gen-net-type">
              <option value="any" data-i18n="gen.netType.any"><?= $pageT('gen.netType.any') ?></option>
              <option value="mg" data-i18n="gen.netType.mg"><?= $pageT('gen.netType.mg') ?></option>
              <option value="fc" data-i18n="gen.netType.fc"><?= $pageT('gen.netType.fc') ?></option>
              <option value="efc" data-i18n="gen.netType.efc"><?= $pageT('gen.netType.efc') ?></option>
              <option value="sm" data-i18n="gen.netType.sm"><?= $pageT('gen.netType.sm') ?></option>
              <option value="pn" data-i18n="gen.netType.pn"><?= $pageT('gen.netType.pn') ?></option>
            </select>
          </label>

          <label>
            <?= $pageT('gen.method') ?>
            <select id="gen-method">
              <option value="adaptive" data-i18n="gen.method.adaptive"><?= $pageT('gen.method.adaptive') ?></option>
              <option value="workflow" data-i18n="gen.method.workflow"><?= $pageT('gen.method.workflow') ?></option>
              <option value="region" data-i18n="gen.method.region"><?= $pageT('gen.method.region') ?></option>
              <option value="refinement" data-i18n="gen.method.refinement"><?= $pageT('gen.method.refinement') ?></option>
            </select>
          </label>

          <div class="inline-two-equal">
            <label>
              <?= $pageT('gen.live') ?>
              <select id="gen-live-option">
                <option value="any" data-i18n="gen.live.any"><?= $pageT('gen.live.any') ?></option>
                <option value="yes" data-i18n="gen.live.yes"><?= $pageT('gen.live.yes') ?></option>
                <option value="no" data-i18n="gen.live.no"><?= $pageT('gen.live.no') ?></option>
              </select>
            </label>
            <label>
              <?= $pageT('gen.safe') ?>
              <select id="gen-safe-option">
                <option value="any" data-i18n="gen.safe.any"><?= $pageT('gen.safe.any') ?></option>
                <option value="yes" data-i18n="gen.safe.yes"><?= $pageT('gen.safe.yes') ?></option>
                <option value="no" data-i18n="gen.safe.no"><?= $pageT('gen.safe.no') ?></option>
              </select>
            </label>
          </div>

          <label>
            <?= $pageT('gen.redundant') ?>
            <input type="number" id="gen-redundant-count" min="0" step="1" value="1">
          </label>

          <label class="gen-checkbox-label">
            <input type="checkbox" id="gen-xt-hypergraph">
            <span id="gen-xt-hypergraph-label" data-i18n="gen.xtHypergraph"><?= $pageT('gen.xtHypergraph') ?></span>
          </label>

          <div class="button-group">
            <button type="button" id="generate-net-btn" data-i18n="gen.generate"><?= $pageT('gen.generate') ?></button>
          </div>
          <div id="generate-status" class="hint" data-i18n="status.generatorReady"><?= $pageT('status.generatorReady') ?></div>

          <details class="gen-search-details">
            <summary id="gen-search-summary" data-i18n="gen.searchSummary"><?= $pageT('gen.searchSummary') ?></summary>
            <div class="gen-search-content">
              <div class="inline-two-equal">
                <label>
                  <?= $pageT('gen.searchMinPlaces') ?>
                  <input type="number" id="gen-search-min-places" min="1" max="240" step="1" value="3">
                </label>
                <label>
                  <?= $pageT('gen.searchMaxPlaces') ?>
                  <input type="number" id="gen-search-max-places" min="1" max="240" step="1" value="20">
                </label>
              </div>
              <div class="inline-two-equal">
                <label>
                  <?= $pageT('gen.searchMinTransitions') ?>
                  <input type="number" id="gen-search-min-transitions" min="1" max="240" step="1" value="3">
                </label>
                <label>
                  <?= $pageT('gen.searchMaxTransitions') ?>
                  <input type="number" id="gen-search-max-transitions" min="1" max="240" step="1" value="20">
                </label>
              </div>
              <label>
                <?= $pageT('gen.searchTimeLimit') ?>
                <input type="number" id="gen-search-time-limit" min="1" max="600" step="1" value="30">
              </label>
              <div class="button-group">
                <button type="button" id="gen-search-btn" data-i18n="gen.searchBtn"><?= $pageT('gen.searchBtn') ?></button>
              </div>
            </div>
          </details>
        </section>

        <section id="sidebar-panel-lib" class="sidebar-tab-panel hidden" data-sidebar-panel="lib" role="tabpanel" aria-labelledby="sidebar-tab-lib">
          <h2 class="sidebar-panel-title"><span class="sidebar-panel-icon">▦</span><?= $pageT('panel.lib') ?></h2>
          <div id="library-auth-required-hint" class="hint" data-i18n="lib.manageHint"><?= $pageT('lib.manageHint') ?></div>

          <div id="library-protected-area" class="library-protected-area">
            <label>
              <?= $pageT('nav.lib') ?>
              <select id="library-select"></select>
            </label>

            <div class="button-group">
              <button type="button" id="refresh-library-btn" data-i18n="lib.refresh"><?= $pageT('lib.refresh') ?></button>
            </div>

            <div id="library-manage-area" class="library-manage-area">
              <div class="inline-two">
                <input type="text" id="library-name-input" maxlength="120" placeholder="<?= $pageT('lib.namePlaceholder') ?>" data-i18n-placeholder="lib.namePlaceholder">
                <button type="button" id="rename-library-btn" data-i18n="lib.rename"><?= $pageT('lib.rename') ?></button>
              </div>

              <div class="button-group">
                <button type="button" id="create-library-btn" data-i18n="lib.new"><?= $pageT('lib.new') ?></button>
                <button type="button" id="library-upload-btn" data-i18n="lib.uploadFiles"><?= $pageT('lib.uploadFiles') ?></button>
                <input type="file" id="library-upload-input" accept=".pnh,text/plain" multiple hidden>
                <button type="button" id="library-upload-folder-btn" data-i18n="lib.uploadFolder"><?= $pageT('lib.uploadFolder') ?></button>
                <input type="file" id="library-upload-folder-input" webkitdirectory directory multiple hidden>
              </div>
            </div>

            <label>
              <?= $pageT('lib.file') ?>
              <input type="text" id="library-file-select" list="library-file-options" placeholder="<?= $pageT('lib.filePlaceholder') ?>" data-i18n-placeholder="lib.filePlaceholder">
              <datalist id="library-file-options"></datalist>
            </label>

            <div class="button-group">
              <button type="button" id="load-library-file-btn" data-i18n="lib.loadSelected"><?= $pageT('lib.loadSelected') ?></button>
            </div>
          </div>

          <div id="library-status" class="hint" data-i18n="status.libraryEmpty"><?= $pageT('status.libraryEmpty') ?></div>
        </section>

        <section id="sidebar-panel-bench" class="sidebar-tab-panel hidden" data-sidebar-panel="bench" role="tabpanel" aria-labelledby="sidebar-tab-bench">
          <h2 class="sidebar-panel-title"><span class="sidebar-panel-icon">⏱</span><?= $pageT('nav.bench') ?></h2>
          <label>
            <?= $pageT('bench.files') ?>
            <select id="benchmark-files-select" multiple size="8"></select>
          </label>

          <label>
            <?= $pageT('bench.fileFilter') ?>
            <input type="text" id="benchmark-file-filter" placeholder="<?= $pageT('bench.fileFilterPlaceholder') ?>" data-i18n-placeholder="bench.fileFilterPlaceholder">
          </label>

          <label>
            <?= $pageT('bench.fileLimit') ?>
            <input type="number" id="benchmark-file-limit" min="1" max="1000" step="1" value="50">
          </label>

          <label>
            <?= $pageT('bench.strataTarget') ?>
            <input type="number" id="benchmark-strata-target" min="1" max="100" step="1" value="12">
          </label>

          <div class="inline-two">
            <button type="button" id="benchmark-apply-filter-btn" data-i18n="bench.applyFilter"><?= $pageT('bench.applyFilter') ?></button>
            <button type="button" id="benchmark-select-all-btn" data-i18n="bench.selectAll"><?= $pageT('bench.selectAll') ?></button>
            <button type="button" id="benchmark-clear-selection-btn" data-i18n="bench.clearSelection"><?= $pageT('bench.clearSelection') ?></button>
          </div>

          <div id="benchmark-file-filter-status" class="hint" data-i18n="bench.filterNoVisibleFiles"><?= $pageT('bench.filterNoVisibleFiles') ?></div>

          <label>
            <?= $pageT('bench.repeatCount') ?>
            <input type="number" id="benchmark-repeat-count" min="1" max="20" step="1" value="3">
          </label>

          <label>
            <?= $pageT('bench.pinvMode') ?>
            <select id="benchmark-pinv-mode">
              <option value="cover-stop" data-i18n="pinv.mode.coverStop"><?= $pageT('pinv.mode.coverStop') ?></option>
              <option value="full" data-i18n="pinv.mode.full"><?= $pageT('pinv.mode.full') ?></option>
            </select>
          </label>

          <label>
            <?= $pageT('bench.pinvAcceleration') ?>
            <select id="benchmark-pinv-acceleration">
              <option value="cpu" data-i18n="bench.accel.cpu"><?= $pageT('bench.accel.cpu') ?></option>
              <option value="webgpu" data-i18n="bench.accel.webgpu"><?= $pageT('bench.accel.webgpu') ?></option>
              <option value="compare-cpu-webgpu" data-i18n="bench.accel.compareCpuWebgpu"><?= $pageT('bench.accel.compareCpuWebgpu') ?></option>
            </select>
          </label>

          <label>
            <?= $pageT('bench.acceleration') ?>
            <select id="benchmark-xtrec-acceleration">
              <option value="cpu" data-i18n="bench.accel.cpu"><?= $pageT('bench.accel.cpu') ?></option>
              <option value="webgpu" data-i18n="bench.accel.webgpu"><?= $pageT('bench.accel.webgpu') ?></option>
              <option value="webgl" data-i18n="bench.accel.webgl"><?= $pageT('bench.accel.webgl') ?></option>
              <option value="compare-cpu-webgpu" data-i18n="bench.accel.compareCpuWebgpu"><?= $pageT('bench.accel.compareCpuWebgpu') ?></option>
            </select>
          </label>

          <div class="button-group">
            <button type="button" id="benchmark-profile-btn" data-i18n="bench.profile"><?= $pageT('bench.profile') ?></button>
            <button type="button" id="benchmark-select-representative-btn" data-i18n="bench.selectRepresentative"><?= $pageT('bench.selectRepresentative') ?></button>
            <button type="button" id="benchmark-run-representative-btn" data-i18n="bench.runRepresentative"><?= $pageT('bench.runRepresentative') ?></button>
            <button type="button" id="benchmark-export-profile-csv-btn" data-i18n="bench.exportProfileCsv"><?= $pageT('bench.exportProfileCsv') ?></button>
            <button type="button" id="benchmark-run-btn" data-i18n="bench.run"><?= $pageT('bench.run') ?></button>
            <button type="button" id="benchmark-cancel-btn" class="danger" data-i18n="bench.cancel"><?= $pageT('bench.cancel') ?></button>
          </div>
	          <div id="benchmark-hint" class="hint" data-i18n="bench.hint"><?= $pageT('bench.hint') ?></div>
        </section>

        <section id="sidebar-panel-meta" class="sidebar-tab-panel hidden" data-sidebar-panel="meta" role="tabpanel" aria-labelledby="sidebar-tab-meta">
          <h2 class="sidebar-panel-title"><span class="sidebar-panel-icon">⌘</span><?= $pageT('panel.meta') ?></h2>
          <label>
            <?= $pageT('meta.filter') ?>
            <input type="text" id="metadata-filter-input" placeholder="<?= $pageT('meta.placeholder') ?>" data-i18n-placeholder="meta.placeholder">
          </label>
          <div id="metadata-list" class="hint" data-i18n="status.metaNone"><?= $pageT('status.metaNone') ?></div>
        </section>

        <section id="sidebar-panel-class" class="sidebar-tab-panel hidden" data-sidebar-panel="class" role="tabpanel" aria-labelledby="sidebar-tab-class">
          <h2 class="sidebar-panel-title"><span class="sidebar-panel-icon">◈</span><?= $pageT('panel.class') ?></h2>
          <div id="classification-list" class="hint" data-i18n="status.classNone"><?= $pageT('status.classNone') ?></div>
        </section>

<?php if ($researchTeamEnabled): ?>
        <section id="sidebar-panel-auth" class="sidebar-tab-panel hidden" data-sidebar-panel="auth" role="tabpanel" aria-labelledby="sidebar-tab-auth">
          <h2 class="sidebar-panel-title"><span class="sidebar-panel-icon">👥</span><?= $pageT('nav.auth') ?></h2>
          <div id="authors-empty" class="hint" data-i18n="author.empty"><?= $pageT('author.empty') ?></div>
          <div id="author-tabs" class="author-tabs"></div>
          <div id="author-card" class="author-card hidden">
            <div class="author-card-head">
              <div class="author-avatar">👤</div>
              <div>
                <div id="author-card-title" class="author-card-title" data-i18n="author.cardTitle"><?= $pageT('author.cardTitle') ?></div>
                <div id="author-card-subtitle" class="author-card-subtitle" data-i18n="author.cardSubtitle"><?= $pageT('author.cardSubtitle') ?></div>
              </div>
            </div>
            <div class="author-read-grid">
              <div class="author-read-row">
                <div id="author-name-label" class="author-read-label" data-i18n="author.name"><?= $pageT('author.name') ?></div>
                <div id="author-name-value" class="author-read-value">-</div>
              </div>
              <div class="author-read-row">
                <div id="author-degree-label" class="author-read-label" data-i18n="author.degree"><?= $pageT('author.degree') ?></div>
                <div id="author-degree-value" class="author-read-value">-</div>
              </div>
              <div class="author-read-row">
                <div id="author-emails-label" class="author-read-label" data-i18n="author.emails"><?= $pageT('author.emails') ?></div>
                <ul id="author-emails-value" class="author-email-list">
                  <li>-</li>
                </ul>
              </div>
              <div class="author-read-row">
                <div id="author-unit-label" class="author-read-label" data-i18n="author.unit"><?= $pageT('author.unit') ?></div>
                <ul id="author-unit-value" class="author-list">
                  <li>-</li>
                </ul>
              </div>
              <div class="author-read-row">
                <div id="author-role-label" class="author-read-label" data-i18n="author.role"><?= $pageT('author.role') ?></div>
                <div id="author-role-value" class="author-role-badges"></div>
              </div>
              <div class="author-read-row">
                <div id="author-research-area-label" class="author-read-label" data-i18n="author.researchArea"><?= $pageT('author.researchArea') ?></div>
                <ul id="author-research-area-value" class="author-list">
                  <li>-</li>
                </ul>
              </div>
              <div class="author-read-row">
                <div class="author-read-label-row">
                  <div id="author-metrics-label" class="author-read-label" data-i18n="author.metrics"><?= $pageT('author.metrics') ?></div>
                  <button type="button" id="author-metrics-refresh-btn" class="author-metrics-refresh-btn hidden" title="<?= $pageT('author.metricsRefresh') ?>" data-i18n-title="author.metricsRefresh">⟳</button>
                  <button type="button" id="author-metrics-edit-btn" class="author-metrics-edit-btn hidden" title="<?= $pageT('author.metricsEditTitle') ?>" data-i18n-title="author.metricsEditTitle">✎</button>
                </div>
                <div id="author-metrics-value" class="author-metrics"></div>
                <div id="author-metrics-refresh-status" class="author-metrics-refresh-status hidden"></div>
              </div>
              <div class="author-read-row">
                <div id="author-profiles-label" class="author-read-label" data-i18n="author.profiles"><?= $pageT('author.profiles') ?></div>
                <div id="author-profiles-value" class="author-profiles"></div>
              </div>
            </div>
          </div>
        </section>
<?php endif; ?>

        <section id="sidebar-panel-docs" class="sidebar-tab-panel hidden" data-sidebar-panel="docs" role="tabpanel" aria-labelledby="sidebar-tab-docs">
          <h2 class="sidebar-panel-title"><span class="sidebar-panel-icon">📖</span><span id="docs-panel-title" data-i18n="docs.title"><?= $pageT('docs.title') ?></span></h2>
          <p class="hint" id="docs-panel-hint" data-i18n="docs.panelHint"><?= $pageT('docs.panelHint') ?></p>

          <div class="docs-toolbar">
            <button type="button" id="docs-reload-btn"><span id="docs-reload-label" data-i18n="docs.reload"><?= $pageT('docs.reload') ?></span></button>
            <button type="button" id="docs-edit-btn" class="hidden"><span id="docs-edit-label" data-i18n="docs.editAdmin"><?= $pageT('docs.editAdmin') ?></span></button>
            <button type="button" id="docs-save-btn" class="hidden"><span id="docs-save-label" data-i18n="author.metricsEditSave"><?= $pageT('author.metricsEditSave') ?></span></button>
            <button type="button" id="docs-cancel-btn" class="hidden"><span id="docs-cancel-label" data-i18n="author.metricsEditCancel"><?= $pageT('author.metricsEditCancel') ?></span></button>
          </div>
          <div id="docs-status" class="hint"></div>

          <!-- Read view -->
          <div id="docs-view" class="docs-view">
            <article class="docs-section">
              <h3 id="docs-description-heading" class="docs-section-title" data-i18n="docs.descriptionHeading"><?= $pageT('docs.descriptionHeading') ?></h3>
              <div id="docs-description-body" class="docs-prose"></div>
            </article>

            <article class="docs-section">
              <h3 id="docs-algorithms-heading" class="docs-section-title" data-i18n="docs.algorithmsHeading"><?= $pageT('docs.algorithmsHeading') ?></h3>
              <div id="docs-algorithms-list" class="docs-cards"></div>
            </article>

            <article class="docs-section">
              <h3 id="docs-articles-heading" class="docs-section-title" data-i18n="docs.relatedArticles"><?= $pageT('docs.relatedArticles') ?></h3>
              <div id="docs-articles-list" class="docs-cards"></div>
            </article>
          </div>

          <!-- Edit view (admin only) -->
          <div id="docs-edit-view" class="docs-edit-view hidden">
            <article class="docs-section">
              <h3 class="docs-section-title"><span id="docs-edit-description-heading" data-i18n="docs.descriptionHeading"><?= $pageT('docs.descriptionHeading') ?></span></h3>
              <label>
                <span id="docs-edit-desc-en-label" data-i18n="docs.descriptionEn"><?= $pageT('docs.descriptionEn') ?></span>
                <textarea id="docs-edit-desc-en" rows="6" maxlength="8000"></textarea>
              </label>
              <label>
                <span id="docs-edit-desc-pl-label" data-i18n="docs.descriptionPl"><?= $pageT('docs.descriptionPl') ?></span>
                <textarea id="docs-edit-desc-pl" rows="6" maxlength="8000"></textarea>
              </label>
            </article>

            <article class="docs-section">
              <h3 class="docs-section-title"><span id="docs-edit-algorithms-heading" data-i18n="docs.algorithmsHeading"><?= $pageT('docs.algorithmsHeading') ?></span></h3>
              <div id="docs-edit-algorithms-list" class="docs-edit-cards"></div>
              <button type="button" id="docs-add-algorithm-btn" class="docs-add-btn"><span id="docs-add-algorithm-label" data-i18n="docs.addAlgorithm"><?= $pageT('docs.addAlgorithm') ?></span></button>
            </article>

            <article class="docs-section">
              <h3 class="docs-section-title"><span id="docs-edit-articles-heading" data-i18n="docs.relatedArticles"><?= $pageT('docs.relatedArticles') ?></span></h3>
              <div id="docs-edit-articles-list" class="docs-edit-cards"></div>
              <button type="button" id="docs-add-article-btn" class="docs-add-btn"><span id="docs-add-article-label" data-i18n="docs.addArticle"><?= $pageT('docs.addArticle') ?></span></button>
            </article>
          </div>
        </section>
      </div>
    </aside>

    <section class="workspace">
      <div class="workspace-tabs" role="tablist" aria-label="<?= $pageT('workspace.viewsAria') ?>" data-i18n-aria-label="workspace.viewsAria">
        <button
          type="button"
          id="workspace-tab-canvas"
          class="workspace-tab active"
          data-workspace-tab="canvas"
          role="tab"
          aria-selected="true"
          aria-controls="workspace-canvas-panel"
         data-i18n="workspace.canvasTab">
          <?= $pageT('workspace.canvasTab') ?>
        </button>
        <button
          type="button"
          id="workspace-tab-hypergraph"
          class="workspace-tab"
          data-workspace-tab="hypergraph"
          role="tab"
          aria-selected="false"
          aria-controls="workspace-hypergraph-panel"
         data-i18n="workspace.hypergraphTab">
          <?= $pageT('workspace.hypergraphTab') ?>
        </button>
        <button
          type="button"
          id="workspace-tab-tools"
          class="workspace-tab"
          data-workspace-tab="tools"
          role="tab"
          aria-selected="false"
          aria-controls="workspace-tools-panel"
         data-i18n="workspace.toolsTab">
          <?= $pageT('workspace.toolsTab') ?>
        </button>
        <button
          type="button"
          id="workspace-tab-decomposition"
          class="workspace-tab"
          data-workspace-tab="decomposition"
          role="tab"
          aria-selected="false"
          aria-controls="workspace-decomposition-panel"
         data-i18n="workspace.decompositionTab">
          <?= $pageT('workspace.decompositionTab') ?>
        </button>
        <button
          type="button"
          id="workspace-tab-benchmark"
          class="workspace-tab hidden"
          data-workspace-tab="benchmark"
          role="tab"
          aria-selected="false"
          aria-controls="workspace-benchmark-panel"
         data-i18n="workspace.benchmarkTab">
          <?= $pageT('workspace.benchmarkTab') ?>
        </button>
      </div>

      <section id="workspace-canvas-panel" class="workspace-panel active" role="tabpanel" aria-labelledby="workspace-tab-canvas">
        <div class="workspace-topbar">
	          <div class="workspace-label-group">
	            <div id="workspace-canvas-label" class="workspace-label" data-i18n="workspace.canvasTab"><?= $pageT('workspace.canvasTab') ?></div>
	            <span id="canvas-net-name" class="canvas-net-name hidden"></span>
	          </div>
          <div class="workspace-tools">
            <div class="zoom-controls" aria-label="<?= $pageT('canvas.zoomControls') ?>" data-i18n-aria-label="canvas.zoomControls">
              <button type="button" id="zoom-out-btn" title="<?= $pageT('zoom.outTitle') ?>" data-i18n-title="zoom.outTitle">−</button>
              <button type="button" id="zoom-in-btn" title="<?= $pageT('zoom.inTitle') ?>" data-i18n-title="zoom.inTitle">+</button>
              <button type="button" id="zoom-reset-btn" title="<?= $pageT('zoom.resetTitle') ?>" data-i18n-title="zoom.resetTitle">100%</button>
              <span id="zoom-level" class="zoom-level">100%</span>
            </div>
            <div class="pan-controls" aria-label="<?= $pageT('canvas.panControls') ?>" data-i18n-aria-label="canvas.panControls">
              <button type="button" id="pan-left-btn" title="<?= $pageT('pan.leftTitle') ?>" data-i18n-title="pan.leftTitle">◀</button>
              <button type="button" id="pan-up-btn" title="<?= $pageT('pan.upTitle') ?>" data-i18n-title="pan.upTitle">▲</button>
              <button type="button" id="pan-down-btn" title="<?= $pageT('pan.downTitle') ?>" data-i18n-title="pan.downTitle">▼</button>
              <button type="button" id="pan-right-btn" title="<?= $pageT('pan.rightTitle') ?>" data-i18n-title="pan.rightTitle">▶</button>
              <button type="button" id="center-net-btn" title="<?= $pageT('pan.centerTitle') ?>" data-i18n-title="pan.centerTitle">⊙</button>
            </div>
            <div id="layout-badge" class="layout-badge"><?= $pageT('workspace.modePrefix') ?>: Smart</div>
          </div>
        </div>
        <div id="canvas-enabled-list" class="canvas-enabled-hint hint" data-i18n="sim.enabledNone"><?= $pageT('sim.enabledNone') ?></div>

        <div class="canvas-wrap">
          <svg id="canvas" viewBox="0 0 1600 900" aria-label="<?= $pageT('workspace.canvasTab') ?>" data-i18n-aria-label="workspace.canvasTab">
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto">
                <polygon points="0,0 10,4 0,8"></polygon>
              </marker>
            </defs>
            <rect x="0" y="0" width="1600" height="900" class="canvas-bg"></rect>
          </svg>
          <button type="button" id="canvas-lens-toggle" class="canvas-lens-toggle" title="<?= $pageT('canvas.lens') ?>" data-i18n-title="canvas.lens">🔍</button>
          <div id="canvas-lens" class="canvas-lens hidden">
            <svg class="canvas-lens-svg" viewBox="0 0 200 200">
              <defs><clipPath id="lens-clip"><circle cx="100" cy="100" r="100"/></clipPath></defs>
              <g clip-path="url(#lens-clip)"><g id="canvas-lens-content"></g></g>
              <circle cx="100" cy="100" r="99" fill="none" stroke="var(--accent)" stroke-width="2" opacity="0.6"/>
            </svg>
          </div>
          <button type="button" id="canvas-help-toggle" class="canvas-help-toggle" title="<?= $pageT('canvas.help') ?>" data-i18n-title="canvas.help">?</button>
          <div id="canvas-help-overlay" class="canvas-help-overlay hidden">
            <div class="canvas-help-content">
              <div class="canvas-help-title" data-i18n="canvas.helpTitle"><?= $pageT('canvas.helpTitle') ?></div>
              <table class="canvas-help-table">
                <tr><td class="help-key" data-i18n="canvas.help.nodeDragKey"><?= $pageT('canvas.help.nodeDragKey') ?></td><td data-i18n="canvas.help.nodeDrag"><?= $pageT('canvas.help.nodeDrag') ?></td></tr>
                <tr><td class="help-key" data-i18n="canvas.help.groupDragKey"><?= $pageT('canvas.help.groupDragKey') ?></td><td data-i18n="canvas.help.groupDrag"><?= $pageT('canvas.help.groupDrag') ?></td></tr>
                <tr><td class="help-key" data-i18n="canvas.help.panEmptyKey"><?= $pageT('canvas.help.panEmptyKey') ?></td><td data-i18n="canvas.help.pan"><?= $pageT('canvas.help.pan') ?></td></tr>
                <tr><td class="help-key" data-i18n="canvas.help.panAlternateKey"><?= $pageT('canvas.help.panAlternateKey') ?></td><td data-i18n="canvas.help.panAlternate"><?= $pageT('canvas.help.panAlternate') ?></td></tr>
                <tr><td class="help-key" data-i18n="canvas.help.spacePanKey"><?= $pageT('canvas.help.spacePanKey') ?></td><td data-i18n="canvas.help.spacePan"><?= $pageT('canvas.help.spacePan') ?></td></tr>
                <tr><td class="help-key">Scroll</td><td data-i18n="canvas.help.scroll"><?= $pageT('canvas.help.scroll') ?></td></tr>
                <tr><td class="help-key">Ctrl + A</td><td data-i18n="canvas.help.selectAll"><?= $pageT('canvas.help.selectAll') ?></td></tr>
                <tr><td class="help-key">Delete / Backspace</td><td data-i18n="canvas.help.delete"><?= $pageT('canvas.help.delete') ?></td></tr>
                <tr><td class="help-key" data-i18n="canvas.help.editNodeKey"><?= $pageT('canvas.help.editNodeKey') ?></td><td data-i18n="canvas.help.editNode"><?= $pageT('canvas.help.editNode') ?></td></tr>
                <tr><td class="help-key" data-i18n="canvas.help.editArcKey"><?= $pageT('canvas.help.editArcKey') ?></td><td data-i18n="canvas.help.editArc"><?= $pageT('canvas.help.editArc') ?></td></tr>
                <tr><td class="help-key" data-i18n="canvas.help.centerKey"><?= $pageT('canvas.help.centerKey') ?></td><td data-i18n="pan.centerTitle"><?= $pageT('pan.centerTitle') ?></td></tr>
                <tr><td class="help-key">🔍 / Alt</td><td data-i18n="canvas.help.lens"><?= $pageT('canvas.help.lens') ?></td></tr>
              </table>
              <div class="canvas-help-title" style="margin-top:8px" data-i18n="canvas.help.editModes"><?= $pageT('canvas.help.editModes') ?></div>
              <table class="canvas-help-table">
                <tr><td class="help-key" data-i18n="mode.selectShort"><?= $pageT('mode.selectShort') ?></td><td data-i18n="canvas.help.nodeDrag"><?= $pageT('canvas.help.nodeDrag') ?></td></tr>
                <tr><td class="help-key" data-i18n="mode.placeShort"><?= $pageT('mode.placeShort') ?></td><td data-i18n="canvas.help.addPlace"><?= $pageT('canvas.help.addPlace') ?></td></tr>
                <tr><td class="help-key" data-i18n="mode.transitionShort"><?= $pageT('mode.transitionShort') ?></td><td data-i18n="canvas.help.addTransition"><?= $pageT('canvas.help.addTransition') ?></td></tr>
                <tr><td class="help-key" data-i18n="mode.arcShort"><?= $pageT('mode.arcShort') ?></td><td data-i18n="canvas.help.addArc"><?= $pageT('canvas.help.addArc') ?></td></tr>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section id="workspace-hypergraph-panel" class="workspace-panel hidden" role="tabpanel" aria-labelledby="workspace-tab-hypergraph">
        <div class="workspace-topbar hypergraph-editor-topbar">
          <div id="workspace-hypergraph-label" class="workspace-label" data-i18n="workspace.hypergraphTab"><?= $pageT('workspace.hypergraphTab') ?></div>
          <div class="hypergraph-editor-topbar-actions">
            <button type="button" id="hypergraph-results-toggle-btn" data-i18n="hypergraphEditor.showResults"><?= $pageT('hypergraphEditor.showResults') ?></button>
          </div>
        </div>
        <div class="workspace-hypergraph-content">
          <div id="hypergraph-editor-status" class="hint" data-i18n="hypergraphEditor.statusIdle"><?= $pageT('hypergraphEditor.statusIdle') ?></div>
          <div id="selection-hypergraph-comparison-panel" class="selection-hypergraph-comparison-panel hidden">
            <div class="selection-hypergraph-comparison-header">
              <div>
                <div id="selection-hypergraph-comparison-title" class="selection-hypergraph-comparison-title" data-i18n="selection.compare.title"><?= $pageT('selection.compare.title') ?></div>
                <div id="selection-hypergraph-comparison-note" class="selection-hypergraph-comparison-note" data-i18n="selection.compare.shortNote"><?= $pageT('selection.compare.shortNote') ?></div>
              </div>
              <button type="button" id="selection-hypergraph-comparison-close-btn" data-i18n="selection.compare.hide"><?= $pageT('selection.compare.hide') ?></button>
            </div>
            <div class="selection-hypergraph-comparison-grid">
              <article class="selection-hypergraph-comparison-card">
                <div id="selection-hypergraph-before-title" class="selection-hypergraph-comparison-card-title" data-i18n="selection.draw.original"><?= $pageT('selection.draw.original') ?></div>
                <svg id="selection-hypergraph-before-svg" viewBox="0 0 1600 900" aria-label="<?= $pageT('selection.compare.beforeAria') ?>" data-i18n-aria-label="selection.compare.beforeAria"></svg>
                <div id="selection-hypergraph-before-summary" class="selection-hypergraph-comparison-summary"></div>
              </article>
              <article class="selection-hypergraph-comparison-card">
                <div id="selection-hypergraph-after-title" class="selection-hypergraph-comparison-card-title" data-i18n="selection.draw.reduced"><?= $pageT('selection.draw.reduced') ?></div>
                <svg id="selection-hypergraph-after-svg" viewBox="0 0 1600 900" aria-label="<?= $pageT('selection.compare.afterAria') ?>" data-i18n-aria-label="selection.compare.afterAria"></svg>
                <div id="selection-hypergraph-after-summary" class="selection-hypergraph-comparison-summary"></div>
              </article>
            </div>
          </div>
          <div class="canvas-wrap hypergraph-canvas-wrap">
            <svg id="hypergraph-canvas" viewBox="0 0 1600 900" aria-label="<?= $pageT('hypergraph.canvasAria') ?>" data-i18n-aria-label="hypergraph.canvasAria">
              <rect x="0" y="0" width="1600" height="900" class="canvas-bg"></rect>
              <g id="hypergraph-viewport"></g>
            </svg>
            <button type="button" id="hypergraph-help-toggle" class="canvas-help-toggle" title="<?= $pageT('canvas.help') ?>" data-i18n-title="canvas.help">?</button>
            <div id="hypergraph-help-overlay" class="canvas-help-overlay hidden">
              <div class="canvas-help-content">
                <div class="canvas-help-title" data-i18n="hypergraph.helpTitle"><?= $pageT('hypergraph.helpTitle') ?></div>
                <table class="canvas-help-table">
                  <tr><td class="help-key" data-i18n="hypergraph.help.vertex"><?= $pageT('hypergraph.help.vertex') ?></td><td data-i18n="hypergraph.help.vertexAction"><?= $pageT('hypergraph.help.vertexAction') ?></td></tr>
                  <tr><td class="help-key" data-i18n="hypergraph.help.edge"><?= $pageT('hypergraph.help.edge') ?></td><td data-i18n="hypergraph.help.edgeAction"><?= $pageT('hypergraph.help.edgeAction') ?></td></tr>
                  <tr><td class="help-key" data-i18n="mode.selectShort"><?= $pageT('mode.selectShort') ?></td><td data-i18n="hypergraph.help.selectAction"><?= $pageT('hypergraph.help.selectAction') ?></td></tr>
                  <tr><td class="help-key" data-i18n="hypergraph.help.doubleClick"><?= $pageT('hypergraph.help.doubleClick') ?></td><td data-i18n="hypergraph.help.doubleClickAction"><?= $pageT('hypergraph.help.doubleClickAction') ?></td></tr>
                  <tr><td class="help-key" data-i18n="hypergraph.help.panKey"><?= $pageT('hypergraph.help.panKey') ?></td><td data-i18n="hypergraph.help.panAction"><?= $pageT('hypergraph.help.panAction') ?></td></tr>
                  <tr><td class="help-key">Scroll</td><td data-i18n="hypergraph.help.scrollAction"><?= $pageT('hypergraph.help.scrollAction') ?></td></tr>
                </table>
              </div>
            </div>
          </div>
          <div id="hypergraph-results-panel" class="hypergraph-results-panel hidden">
            <div id="hypergraph-rexact-summary" class="hypergraph-rexact-summary hint hidden" data-i18n="hypergraphEditor.rExactIdle"><?= $pageT('hypergraphEditor.rExactIdle') ?></div>
            <div id="hypergraph-structure-summary" class="hypergraph-structure-summary hint hidden" data-i18n="hypergraphEditor.structureIdle"><?= $pageT('hypergraphEditor.structureIdle') ?></div>
            <div id="hypergraph-cexact-summary" class="hypergraph-cexact-summary hint hidden" data-i18n="hypergraphEditor.cExactIdle"><?= $pageT('hypergraphEditor.cExactIdle') ?></div>
            <div id="hypergraph-structural-xt-summary" class="hypergraph-structural-xt-summary hint hidden" data-i18n="hypergraphEditor.structuralXtIdle"><?= $pageT('hypergraphEditor.structuralXtIdle') ?></div>
            <pre id="hypergraph-editor-output" class="result-pre hint" data-i18n="hypergraphEditor.outputNone"><?= $pageT('hypergraphEditor.outputNone') ?></pre>
          </div>
        </div>
      </section>

      <section id="workspace-tools-panel" class="workspace-panel hidden" role="tabpanel" aria-labelledby="workspace-tab-tools">
        <div class="workspace-topbar">
          <div id="workspace-tools-title" class="workspace-label" data-i18n="workspace.toolsEdit"><?= $pageT('workspace.toolsEdit') ?></div>
        </div>
        <div id="workspace-tools-content" class="workspace-tools-content"></div>
      </section>

      <section id="workspace-decomposition-panel" class="workspace-panel hidden" role="tabpanel" aria-labelledby="workspace-tab-decomposition">
        <div class="workspace-topbar">
          <div id="workspace-decomposition-label" class="workspace-label" data-i18n="workspace.decompositionTab"><?= $pageT('workspace.decompositionTab') ?></div>
          <div class="workspace-tools decomposition-toolbar">
            <label class="decomposition-control">
              <span id="decomposition-view-mode-label" data-i18n="decomposition.viewMode"><?= $pageT('decomposition.viewMode') ?></span>
              <select id="decomposition-view-mode">
                <option value="automata-transversal" data-i18n="decomposition.view.transversal"><?= $pageT('decomposition.view.transversal') ?></option>
                <option value="automata-all" data-i18n="decomposition.view.allCorrect"><?= $pageT('decomposition.view.allCorrect') ?></option>
                <option value="automata-pinv" data-i18n="decomposition.view.allPinv"><?= $pageT('decomposition.view.allPinv') ?></option>
                <option value="hypergraph-selection" data-i18n="analysis.hypergraphTitle"><?= $pageT('analysis.hypergraphTitle') ?></option>
                <option value="hypergraph-manual" data-i18n="decomposition.view.hypergraphManual"><?= $pageT('decomposition.view.hypergraphManual') ?></option>
                <option value="sfc" data-i18n="decomposition.view.sfc"><?= $pageT('decomposition.view.sfc') ?></option>
                <option value="maxplus" data-i18n="decomposition.view.maxplus"><?= $pageT('decomposition.view.maxplus') ?></option>
              </select>
            </label>
            <label class="decomposition-control">
              <span id="decomposition-subnet-label" data-i18n="decomposition.subnet"><?= $pageT('decomposition.subnet') ?></span>
              <select id="decomposition-subnet-select">
                <option value="" data-i18n="author.metricsNoData"><?= $pageT('author.metricsNoData') ?></option>
              </select>
            </label>
            <label class="decomposition-control">
              <span id="decomposition-layout-label" data-i18n="decomposition.layout"><?= $pageT('decomposition.layout') ?></span>
              <select id="decomposition-layout-mode">
                <option value="source" data-i18n="decomposition.layout.source"><?= $pageT('decomposition.layout.source') ?></option>
                <option value="auto" data-i18n="decomposition.layout.auto"><?= $pageT('decomposition.layout.auto') ?></option>
              </select>
            </label>
            <div class="zoom-controls" aria-label="<?= $pageT('canvas.zoomControls') ?>" data-i18n-aria-label="canvas.zoomControls">
              <button type="button" id="decomp-zoom-out-btn" title="<?= $pageT('zoom.outTitle') ?>" data-i18n-title="zoom.outTitle">−</button>
              <button type="button" id="decomp-zoom-in-btn" title="<?= $pageT('zoom.inTitle') ?>" data-i18n-title="zoom.inTitle">+</button>
              <button type="button" id="decomp-zoom-reset-btn" title="<?= $pageT('zoom.resetTitle') ?>" data-i18n-title="zoom.resetTitle">100%</button>
              <span id="decomp-zoom-level" class="zoom-level">100%</span>
            </div>
            <div class="pan-controls" aria-label="<?= $pageT('canvas.panControls') ?>" data-i18n-aria-label="canvas.panControls">
              <button type="button" id="decomp-pan-left-btn" title="<?= $pageT('pan.leftTitle') ?>" data-i18n-title="pan.leftTitle">◀</button>
              <button type="button" id="decomp-pan-up-btn" title="<?= $pageT('pan.upTitle') ?>" data-i18n-title="pan.upTitle">▲</button>
              <button type="button" id="decomp-pan-down-btn" title="<?= $pageT('pan.downTitle') ?>" data-i18n-title="pan.downTitle">▼</button>
              <button type="button" id="decomp-pan-right-btn" title="<?= $pageT('pan.rightTitle') ?>" data-i18n-title="pan.rightTitle">▶</button>
              <button type="button" id="decomp-center-btn" title="<?= $pageT('pan.centerTitle') ?>" data-i18n-title="pan.centerTitle">⊙</button>
            </div>
          </div>
        </div>
        <div class="workspace-decomposition-content">
          <div id="decomposition-status" class="hint" data-i18n="status.decompositionNone"><?= $pageT('status.decompositionNone') ?></div>
          <div class="canvas-wrap decomposition-canvas-wrap">
            <svg id="decomposition-canvas" viewBox="0 0 1600 900" aria-label="<?= $pageT('workspace.decompositionTab') ?>" data-i18n-aria-label="workspace.decompositionTab">
              <defs>
                <marker id="decomp-arrowhead" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto">
                  <polygon points="0,0 10,4 0,8"></polygon>
                </marker>
              </defs>
              <rect x="0" y="0" width="1600" height="900" class="canvas-bg"></rect>
              <g id="decomp-viewport"></g>
            </svg>
            <button type="button" id="decomp-lens-toggle" class="canvas-lens-toggle" title="<?= $pageT('canvas.lens') ?>" data-i18n-title="canvas.lens">🔍</button>
            <div id="decomp-lens" class="canvas-lens hidden">
              <svg class="canvas-lens-svg" viewBox="0 0 200 200">
                <defs><clipPath id="decomp-lens-clip"><circle cx="100" cy="100" r="100"/></clipPath></defs>
                <g clip-path="url(#decomp-lens-clip)"><g id="decomp-lens-content"></g></g>
                <circle cx="100" cy="100" r="99" fill="none" stroke="var(--accent)" stroke-width="2" opacity="0.6"/>
              </svg>
            </div>
            <button type="button" id="decomp-help-toggle" class="canvas-help-toggle" title="<?= $pageT('canvas.help') ?>" data-i18n-title="canvas.help">?</button>
            <div id="decomp-help-overlay" class="canvas-help-overlay hidden">
              <div class="canvas-help-content">
                <div class="canvas-help-title" data-i18n="decomposition.helpTitle"><?= $pageT('decomposition.helpTitle') ?></div>
                <table class="canvas-help-table">
                  <tr><td class="help-key" data-i18n="decomposition.help.nodeDragKey"><?= $pageT('decomposition.help.nodeDragKey') ?></td><td data-i18n="decomposition.help.nodeDrag"><?= $pageT('decomposition.help.nodeDrag') ?></td></tr>
                  <tr><td class="help-key" data-i18n="decomposition.help.panEmptyKey"><?= $pageT('decomposition.help.panEmptyKey') ?></td><td data-i18n="canvas.help.pan"><?= $pageT('canvas.help.pan') ?></td></tr>
                  <tr><td class="help-key" data-i18n="canvas.help.panAlternateKey"><?= $pageT('canvas.help.panAlternateKey') ?></td><td data-i18n="decomposition.help.panAlternate"><?= $pageT('decomposition.help.panAlternate') ?></td></tr>
                  <tr><td class="help-key" data-i18n="decomposition.help.shiftPanKey"><?= $pageT('decomposition.help.shiftPanKey') ?></td><td data-i18n="decomposition.help.shiftPan"><?= $pageT('decomposition.help.shiftPan') ?></td></tr>
                  <tr><td class="help-key">Scroll</td><td data-i18n="canvas.help.scroll"><?= $pageT('canvas.help.scroll') ?></td></tr>
                  <tr><td class="help-key">🔍 / Alt</td><td data-i18n="canvas.help.lens"><?= $pageT('canvas.help.lens') ?></td></tr>
                </table>
                <div class="canvas-help-title" style="margin-top:8px" data-i18n="decomposition.viewMode"><?= $pageT('decomposition.viewMode') ?></div>
                <table class="canvas-help-table">
                  <tr><td class="help-key" data-i18n="hypergraphEditor.transversal"><?= $pageT('hypergraphEditor.transversal') ?></td><td data-i18n="decomposition.help.transversal"><?= $pageT('decomposition.help.transversal') ?></td></tr>
                  <tr><td class="help-key" data-i18n="decomposition.view.hypergraphSelection"><?= $pageT('decomposition.view.hypergraphSelection') ?></td><td data-i18n="sfc.source.allCorrect"><?= $pageT('sfc.source.allCorrect') ?></td></tr>
                  <tr><td class="help-key" data-i18n="decomposition.view.allPinv"><?= $pageT('decomposition.view.allPinv') ?></td><td data-i18n="decomposition.help.allPinvariants"><?= $pageT('decomposition.help.allPinvariants') ?></td></tr>
                  <tr><td class="help-key" data-i18n="decomposition.help.sourceKey"><?= $pageT('decomposition.help.sourceKey') ?></td><td data-i18n="decomposition.help.source"><?= $pageT('decomposition.help.source') ?></td></tr>
                  <tr><td class="help-key">Auto</td><td data-i18n="decomposition.help.auto"><?= $pageT('decomposition.help.auto') ?></td></tr>
                </table>
              </div>
            </div>
          </div>
          <pre id="decomposition-details" class="result-pre hint" data-i18n="status.decompositionDetailsNone"><?= $pageT('status.decompositionDetailsNone') ?></pre>
        </div>
      </section>

      <section id="workspace-benchmark-panel" class="workspace-panel hidden" role="tabpanel" aria-labelledby="workspace-tab-benchmark">
        <div class="workspace-topbar">
	          <div id="workspace-benchmark-label" class="workspace-label" data-i18n="workspace.benchmarkLabel"><?= $pageT('workspace.benchmarkLabel') ?></div>
          <div class="workspace-tools">
            <button type="button" id="benchmark-export-csv-btn" data-i18n="bench.exportCsv"><?= $pageT('bench.exportCsv') ?></button>
            <button type="button" id="benchmark-export-latex-btn" data-i18n="bench.exportLatex"><?= $pageT('bench.exportLatex') ?></button>
          </div>
        </div>
        <div class="workspace-benchmark-content">
          <div id="benchmark-status" class="hint" data-i18n="status.benchReady"><?= $pageT('status.benchReady') ?></div>
          <div id="benchmark-current" class="hint" data-i18n="status.benchCurrentIdle"><?= $pageT('status.benchCurrentIdle') ?></div>
          <div id="benchmark-results" class="benchmark-results hint" data-i18n="status.benchNoResults"><?= $pageT('status.benchNoResults') ?></div>
          <pre id="benchmark-latex-output" class="result-pre hint" data-i18n="status.benchLatexNone"><?= $pageT('status.benchLatexNone') ?></pre>
        </div>
      </section>
    </section>

	    <aside class="inspector">
	      <div class="inspector-content">
	      <h2 id="inspector-title" data-i18n="inspector.title"><?= $pageT('inspector.title') ?></h2>
      <div id="inspector-empty" class="hint" data-i18n="inspector.empty"><?= $pageT('inspector.empty') ?></div>

      <div id="inspector-node" class="inspector-group hidden">
        <label>
          <?= $pageT('inspector.nodeLabel') ?>
          <input type="text" id="node-label-input" maxlength="64">
        </label>
        <label id="tokens-label" class="hidden">
          <?= $pageT('inspector.tokens') ?>
          <input type="number" id="node-tokens-input" min="0" step="1">
        </label>
        <div id="transition-rotation" class="hidden">
          <div class="inline-actions">
            <button type="button" id="rotate-45-btn" data-i18n="inspector.rotate45"><?= $pageT('inspector.rotate45') ?></button>
            <button type="button" id="rotate-90-btn" data-i18n="inspector.rotate90"><?= $pageT('inspector.rotate90') ?></button>
            <button type="button" id="rotate-reset-btn" data-i18n="inspector.rotateReset"><?= $pageT('inspector.rotateReset') ?></button>
          </div>
          <div id="transition-angle-info" class="hint"></div>
        </div>
      </div>

      <div id="inspector-arc" class="inspector-group hidden">
        <label>
          <?= $pageT('inspector.arcWeight') ?>
          <input type="number" id="arc-weight-input" min="1" step="1">
        </label>
        <div class="inline-actions single-action">
          <button type="button" id="arc-clear-bends-btn" data-i18n="inspector.clearArcBends"><?= $pageT('inspector.clearArcBends') ?></button>
        </div>
	        <div id="arc-bend-hint" class="hint" data-i18n="inspector.arcHint"><?= $pageT('inspector.arcHint') ?></div>
      </div>

	      <button type="button" id="delete-btn" class="danger hidden" data-i18n="hypergraphEditor.delete"><?= $pageT('hypergraphEditor.delete') ?></button>
	      </div>

	      <div class="canvas-edit-toolbar inspector-tools" id="petri-inspector-tools">
	        <div class="canvas-tools-section">
	          <div class="canvas-tools-title" data-i18n="workspace.editMode"><?= $pageT('workspace.editMode') ?></div>
	          <div class="canvas-mode-buttons">
	            <button type="button" data-mode="select" class="canvas-mode-btn active" title="<?= $pageT('mode.select') ?>" data-i18n-title="mode.select">
	              <span class="mode-btn-icon">🔘</span>
	              <span class="canvas-mode-label" data-mode-label="select" data-i18n="mode.selectShort"><?= $pageT('mode.selectShort') ?></span>
	            </button>
	            <button type="button" data-mode="place" class="canvas-mode-btn" title="<?= $pageT('mode.place') ?>" data-i18n-title="mode.place">
	              <span class="mode-btn-icon">⭕</span>
	              <span class="canvas-mode-label" data-mode-label="place" data-i18n="mode.placeShort"><?= $pageT('mode.placeShort') ?></span>
	            </button>
	            <button type="button" data-mode="transition" class="canvas-mode-btn" title="<?= $pageT('mode.transition') ?>" data-i18n-title="mode.transition">
	              <span class="mode-btn-icon">▬</span>
	              <span class="canvas-mode-label" data-mode-label="transition" data-i18n="mode.transitionShort"><?= $pageT('mode.transitionShort') ?></span>
	            </button>
	            <button type="button" data-mode="arc" class="canvas-mode-btn" title="<?= $pageT('mode.arc') ?>" data-i18n-title="mode.arc">
	              <span class="mode-btn-icon">➜</span>
	              <span class="canvas-mode-label" data-mode-label="arc" data-i18n="mode.arcShort"><?= $pageT('mode.arcShort') ?></span>
	            </button>
	          </div>
	        </div>
	        <div class="canvas-tools-section">
	          <div class="canvas-tools-title" data-i18n="workspace.simulation"><?= $pageT('workspace.simulation') ?></div>
	          <div class="canvas-sim-buttons">
	            <button type="button" id="canvas-fire-selected-btn" title="<?= $pageT('sim.fireSelected') ?>" data-i18n-title="sim.fireSelected">
	              <span class="sim-btn-icon">⏯</span>
	              <span id="canvas-fire-selected-text" data-i18n="sim.fireSelected"><?= $pageT('sim.fireSelected') ?></span>
	            </button>
	            <button type="button" id="canvas-step-btn" title="<?= $pageT('sim.stepRandom') ?>" data-i18n-title="sim.stepRandom">
	              <span class="sim-btn-icon">⏭</span>
	              <span id="canvas-step-text" data-i18n="sim.stepRandom"><?= $pageT('sim.stepRandom') ?></span>
	            </button>
	            <button type="button" id="canvas-auto-btn" title="<?= $pageT('sim.startAuto') ?>" data-i18n-title="sim.startAuto">
	              <span class="sim-btn-icon">⏵</span>
	              <span id="canvas-auto-text" data-i18n="sim.startAuto"><?= $pageT('sim.startAuto') ?></span>
	            </button>
	          </div>
	        </div>
	      </div>

	      <div class="canvas-edit-toolbar inspector-tools hypergraph-inspector-tools hidden" id="hypergraph-inspector-tools">
	        <div class="canvas-tools-section">
	          <div class="canvas-tools-title" data-i18n="workspace.hypergraphMode"><?= $pageT('workspace.hypergraphMode') ?></div>
	          <div class="canvas-mode-buttons" aria-label="<?= $pageT('workspace.hypergraphEditModes') ?>" data-i18n-aria-label="workspace.hypergraphEditModes">
	            <button type="button" class="canvas-mode-btn hypergraph-mode-btn active" data-hypergraph-mode="select" id="hypergraph-mode-select-btn" title="<?= $pageT('mode.selectShort') ?>" data-i18n-title="mode.selectShort">
	              <span class="mode-btn-icon">↖</span>
	              <span id="hypergraph-mode-select-label" class="canvas-mode-label" data-i18n="mode.selectShort"><?= $pageT('mode.selectShort') ?></span>
	            </button>
	            <button type="button" class="canvas-mode-btn hypergraph-mode-btn" data-hypergraph-mode="vertex" id="hypergraph-mode-vertex-btn" title="<?= $pageT('hypergraph.vertexTitle') ?>" data-i18n-title="hypergraph.vertexTitle">
	              <span class="mode-btn-icon">○</span>
	              <span id="hypergraph-mode-vertex-label" class="canvas-mode-label" data-i18n="hypergraphEditor.modeVertex"><?= $pageT('hypergraphEditor.modeVertex') ?></span>
	            </button>
	            <button type="button" class="canvas-mode-btn hypergraph-mode-btn" data-hypergraph-mode="edge" id="hypergraph-mode-edge-btn" title="<?= $pageT('hypergraph.edgeTitle') ?>" data-i18n-title="hypergraph.edgeTitle">
	              <span class="mode-btn-icon">⬡</span>
	              <span id="hypergraph-mode-edge-label" class="canvas-mode-label" data-i18n="hypergraphEditor.modeEdge"><?= $pageT('hypergraphEditor.modeEdge') ?></span>
	            </button>
	          </div>
	        </div>
	        <div class="canvas-tools-section">
	          <div class="canvas-tools-title" data-i18n="manualHypergraph.input"><?= $pageT('manualHypergraph.input') ?></div>
	          <div class="hypergraph-inspector-button-grid">
	            <button type="button" id="hypergraph-finish-edge-btn" data-i18n="hypergraphEditor.finishEdge"><?= $pageT('hypergraphEditor.finishEdge') ?></button>
	            <button type="button" id="hypergraph-delete-btn" data-i18n="hypergraphEditor.delete"><?= $pageT('hypergraphEditor.delete') ?></button>
	            <button type="button" id="hypergraph-clear-btn" data-i18n="hypergraphEditor.clear"><?= $pageT('hypergraphEditor.clear') ?></button>
	          </div>
	        </div>
	        <div class="canvas-tools-section">
	          <div class="canvas-tools-title-row">
	            <div class="canvas-tools-title" data-i18n="nav.sim"><?= $pageT('nav.sim') ?></div>
	            <button type="button" id="hypergraph-analysis-info-btn" class="hypergraph-info-btn" aria-expanded="false" title="<?= $pageT('hypergraphEditor.infoButtonTitle') ?>" data-i18n-title="hypergraphEditor.infoButtonTitle">i</button>
	          </div>
	          <div id="hypergraph-analysis-info" class="hypergraph-analysis-info hidden"></div>
	          <div class="hypergraph-inspector-button-grid">
	            <button type="button" id="hypergraph-fra-btn" data-i18n="hypergraphEditor.fra"><?= $pageT('hypergraphEditor.fra') ?></button>
	            <button type="button" id="hypergraph-toggle-reduced-btn" disabled data-i18n="hypergraphEditor.showReduced"><?= $pageT('hypergraphEditor.showReduced') ?></button>
	            <button type="button" id="hypergraph-transversal-btn" data-i18n="hypergraphEditor.transversal"><?= $pageT('hypergraphEditor.transversal') ?></button>
	            <button type="button" id="hypergraph-exact-transversal-btn" data-i18n="hypergraphEditor.exactTransversal"><?= $pageT('hypergraphEditor.exactTransversal') ?></button>
	            <button type="button" id="hypergraph-all-transversals-btn" data-i18n="hypergraphEditor.allTransversals"><?= $pageT('hypergraphEditor.allTransversals') ?></button>
	            <button type="button" id="hypergraph-structure-btn" data-i18n="hypergraphEditor.structure"><?= $pageT('hypergraphEditor.structure') ?></button>
	            <button type="button" id="hypergraph-cexact-btn" data-i18n="hypergraphEditor.cExact"><?= $pageT('hypergraphEditor.cExact') ?></button>
	            <button type="button" id="hypergraph-structural-xt-btn" data-i18n="hypergraphEditor.structuralXt"><?= $pageT('hypergraphEditor.structuralXt') ?></button>
	            <div class="hypergraph-rexact-row">
	              <label for="hypergraph-rexact-r-input">
	                <span id="hypergraph-rexact-r-label" data-i18n="hypergraphEditor.rExactLabel"><?= $pageT('hypergraphEditor.rExactLabel') ?></span>
	                <input type="number" id="hypergraph-rexact-r-input" min="1" step="1" value="2">
	              </label>
	              <button type="button" id="hypergraph-rexact-btn" data-i18n="hypergraphEditor.rExact"><?= $pageT('hypergraphEditor.rExact') ?></button>
	            </div>
	            <button type="button" id="hypergraph-xtrec-btn" data-i18n="hypergraphEditor.xtrec"><?= $pageT('hypergraphEditor.xtrec') ?></button>
	          </div>
	          <div id="hypergraph-transversal-picker" class="hypergraph-transversal-picker hidden">
	            <label for="hypergraph-transversal-select">
	              <span id="hypergraph-transversal-picker-label" data-i18n="hypergraphEditor.transversalPicker"><?= $pageT('hypergraphEditor.transversalPicker') ?></span>
	              <select id="hypergraph-transversal-select"></select>
	            </label>
	            <div id="hypergraph-transversal-details" class="hint" data-i18n="hypergraphEditor.transversalHint"><?= $pageT('hypergraphEditor.transversalHint') ?></div>
	            <button type="button" id="hypergraph-clear-transversal-btn" data-i18n="hypergraphEditor.clearTransversal"><?= $pageT('hypergraphEditor.clearTransversal') ?></button>
	          </div>
	        </div>
	        <div class="canvas-tools-section">
	          <div class="canvas-tools-title" data-i18n="workspace.view"><?= $pageT('workspace.view') ?></div>
	          <div class="zoom-controls hypergraph-inspector-zoom" aria-label="<?= $pageT('hypergraph.zoomControls') ?>" data-i18n-aria-label="hypergraph.zoomControls">
	            <button type="button" id="hypergraph-zoom-out-btn" title="<?= $pageT('zoom.outTitle') ?>" data-i18n-title="zoom.outTitle">−</button>
	            <button type="button" id="hypergraph-zoom-in-btn" title="<?= $pageT('zoom.inTitle') ?>" data-i18n-title="zoom.inTitle">+</button>
	            <button type="button" id="hypergraph-zoom-reset-btn" title="<?= $pageT('zoom.resetTitle') ?>" data-i18n-title="zoom.resetTitle">100%</button>
	            <span id="hypergraph-zoom-level" class="zoom-level">100%</span>
	          </div>
	          <div class="pan-controls hypergraph-inspector-pan" aria-label="<?= $pageT('hypergraph.panControls') ?>" data-i18n-aria-label="hypergraph.panControls">
	            <button type="button" id="hypergraph-pan-left-btn" title="<?= $pageT('pan.leftTitle') ?>" data-i18n-title="pan.leftTitle">◀</button>
	            <button type="button" id="hypergraph-pan-up-btn" title="<?= $pageT('pan.upTitle') ?>" data-i18n-title="pan.upTitle">▲</button>
	            <button type="button" id="hypergraph-pan-down-btn" title="<?= $pageT('pan.downTitle') ?>" data-i18n-title="pan.downTitle">▼</button>
	            <button type="button" id="hypergraph-pan-right-btn" title="<?= $pageT('pan.rightTitle') ?>" data-i18n-title="pan.rightTitle">▶</button>
	            <button type="button" id="hypergraph-center-btn" title="<?= $pageT('pan.centerTitle') ?>" data-i18n-title="pan.centerTitle">⊙</button>
	          </div>
	        </div>
	      </div>
	    </aside>
	  </main>

	  <div id="about-modal" class="about-modal" aria-hidden="true">
	    <div class="about-modal-card" role="dialog" aria-modal="true" aria-labelledby="about-modal-title">
	      <button type="button" id="about-modal-close-btn" class="about-modal-close" aria-label="<?= $pageT('common.close') ?>" data-i18n-aria-label="common.close">&times;</button>
	      <?php if ($logoPublicPath !== null): ?>
	        <img src="<?= htmlspecialchars($logoPublicPath, ENT_QUOTES, 'UTF-8') ?>?v=<?= htmlspecialchars($assetVersion, ENT_QUOTES, 'UTF-8') ?>" alt="POOH logo" class="about-modal-logo">
	      <?php else: ?>
	        <div class="about-modal-logo-fallback">POOH</div>
	      <?php endif; ?>
	      <h2 id="about-modal-title" class="about-modal-title">POOH</h2>
	      <p class="about-modal-subtitle" data-i18n="brand.subtitle"><?= $pageT('brand.subtitle') ?></p>
	      <div class="about-modal-version">
	        <span class="about-modal-version-badge">v1.0b33a1 BETA</span>
	      </div>
	      <div class="about-modal-info">
	        <div class="about-modal-row">
	          <span id="about-description-label" class="about-modal-label" data-i18n="about.description.label"><?= $pageT('about.description.label') ?></span>
	          <div id="about-description-value" class="about-modal-value">
	            <p id="about-description-intro" class="about-description-intro" data-i18n="about.description.intro"><?= $pageT('about.description.intro') ?></p>
	            <ul id="about-description-list" class="about-description-list">
	              <li data-i18n="about.description.item1"><?= $pageT('about.description.item1') ?></li>
	              <li data-i18n="about.description.item2"><?= $pageT('about.description.item2') ?></li>
	              <li data-i18n="about.description.item3"><?= $pageT('about.description.item3') ?></li>
	            </ul>
	          </div>
	        </div>
	        <div class="about-modal-row">
	          <span id="about-tech-label" class="about-modal-label" data-i18n="about.tech.label"><?= $pageT('about.tech.label') ?></span>
	          <span id="about-tech-value" class="about-modal-value" data-i18n="about.tech.value"><?= $pageT('about.tech.value') ?></span>
	        </div>
	        <div class="about-modal-row">
	          <span id="about-license-label" class="about-modal-label" data-i18n="about.license.label"><?= $pageT('about.license.label') ?></span>
	          <span id="about-license-value" class="about-modal-value" data-i18n="about.license.value"><?= $pageT('about.license.value') ?></span>
	        </div>
	        <div class="about-modal-row">
	          <span id="about-disclaimer-label" class="about-modal-label about-label-warn" data-i18n="about.disclaimer.label"><?= $pageT('about.disclaimer.label') ?></span>
	          <span id="about-disclaimer-value" class="about-modal-value about-value-warn" data-i18n="about.disclaimer.value"><?= $pageT('about.disclaimer.value') ?></span>
	        </div>
	      </div>
	      <div class="about-modal-footer">
	        <span id="about-footer-text" class="about-modal-footer-text">© 2025–<?= date('Y') ?> POOH Research Team</span>
	      </div>
	    </div>
	  </div>

	  <div id="login-modal" class="login-modal" aria-hidden="true">
	    <div class="login-modal-card" role="dialog" aria-modal="true" aria-labelledby="login-modal-title">
	      <button type="button" id="login-modal-close-btn" class="login-modal-close" aria-label="<?= $pageT('common.close') ?>" data-i18n-aria-label="common.close">&times;</button>
	      <div class="login-modal-icon">🔐</div>
	      <h2 id="login-modal-title" data-i18n="login.title"><?= $pageT('login.title') ?></h2>
	      <p id="login-modal-subtitle" class="login-modal-subtitle" data-i18n="login.subtitle"><?= $pageT('login.subtitle') ?></p>
	      <div id="login-modal-error" class="login-modal-error hidden"></div>
	      <div class="login-modal-fields">
	        <label class="login-modal-label">
	          <span id="login-modal-username-label" data-i18n="lib.username"><?= $pageT('lib.username') ?></span>
	          <input type="text" id="login-modal-username" placeholder="<?= $pageT('lib.loginPlaceholder') ?>" data-i18n-placeholder="lib.loginPlaceholder" autocomplete="username">
	        </label>
	        <label class="login-modal-label">
	          <span id="login-modal-password-label" data-i18n="lib.password"><?= $pageT('lib.password') ?></span>
	          <input type="password" id="login-modal-password" placeholder="<?= $pageT('lib.passwordPlaceholder') ?>" data-i18n-placeholder="lib.passwordPlaceholder" autocomplete="current-password">
	        </label>
	      </div>
	      <div id="login-modal-turnstile" class="login-modal-turnstile"></div>
	      <div class="login-modal-actions">
	        <button type="button" id="login-modal-submit-btn" class="login-modal-submit" data-i18n="lib.login"><?= $pageT('lib.login') ?></button>
	        <button type="button" id="login-modal-cancel-btn" class="login-modal-cancel" data-i18n="author.metricsEditCancel"><?= $pageT('author.metricsEditCancel') ?></button>
	      </div>
	    </div>
	  </div>

<?php if ($researchTeamEnabled): ?>
	  <div id="metrics-edit-modal" class="login-modal" aria-hidden="true">
	    <div class="login-modal-card metrics-edit-card" role="dialog" aria-modal="true" aria-labelledby="metrics-edit-modal-title">
	      <button type="button" id="metrics-edit-close-btn" class="login-modal-close" aria-label="<?= $pageT('common.close') ?>" data-i18n-aria-label="common.close">&times;</button>
	      <div class="login-modal-icon">📊</div>
	      <h2 id="metrics-edit-modal-title" data-i18n="author.metricsEditTitle"><?= $pageT('author.metricsEditTitle') ?></h2>
	      <p id="metrics-edit-modal-subtitle" class="login-modal-subtitle metrics-edit-subtitle"></p>
	      <div id="metrics-edit-error" class="login-modal-error hidden"></div>
	      <div class="metrics-edit-section">
	        <h3 class="metrics-edit-section-title"><span class="metrics-edit-dot" style="background:#4285f4"></span>Google Scholar</h3>
	        <div class="metrics-edit-grid">
	          <label class="metrics-edit-label"><span data-i18n="author.metricsArticles"><?= $pageT('author.metricsArticles') ?></span><input type="number" id="metrics-edit-gs-articles" min="0" step="1"></label>
	          <label class="metrics-edit-label"><span data-i18n="author.metricsCitations"><?= $pageT('author.metricsCitations') ?></span><input type="number" id="metrics-edit-gs-citations" min="0" step="1"></label>
	          <label class="metrics-edit-label"><span data-i18n="author.metricsHIndex"><?= $pageT('author.metricsHIndex') ?></span><input type="number" id="metrics-edit-gs-hindex" min="0" step="1"></label>
	          <label class="metrics-edit-label"><span data-i18n="author.metricsI10Index"><?= $pageT('author.metricsI10Index') ?></span><input type="number" id="metrics-edit-gs-i10index" min="0" step="1"></label>
	        </div>
	      </div>
	      <div class="metrics-edit-section">
	        <h3 class="metrics-edit-section-title"><span class="metrics-edit-dot" style="background:#5c2d91"></span>Web of Science</h3>
	        <div class="metrics-edit-grid">
	          <label class="metrics-edit-label"><span data-i18n="author.metricsArticles"><?= $pageT('author.metricsArticles') ?></span><input type="number" id="metrics-edit-wos-articles" min="0" step="1"></label>
	          <label class="metrics-edit-label"><span data-i18n="author.metricsCitations"><?= $pageT('author.metricsCitations') ?></span><input type="number" id="metrics-edit-wos-citations" min="0" step="1"></label>
	          <label class="metrics-edit-label"><span data-i18n="author.metricsHIndex"><?= $pageT('author.metricsHIndex') ?></span><input type="number" id="metrics-edit-wos-hindex" min="0" step="1"></label>
	          <label class="metrics-edit-label"><span data-i18n="author.metricsI10Index"><?= $pageT('author.metricsI10Index') ?></span><input type="number" id="metrics-edit-wos-i10index" min="0" step="1"></label>
	        </div>
	      </div>
	      <div class="login-modal-actions">
	        <button type="button" id="metrics-edit-save-btn" class="login-modal-submit" data-i18n="author.metricsEditSave"><?= $pageT('author.metricsEditSave') ?></button>
	        <button type="button" id="metrics-edit-cancel-btn" class="login-modal-cancel" data-i18n="author.metricsEditCancel"><?= $pageT('author.metricsEditCancel') ?></button>
	      </div>
	    </div>
	  </div>
<?php endif; ?>

	  <div id="compute-modal" class="compute-modal" aria-hidden="true">
    <div class="compute-modal-card" role="dialog" aria-modal="true" aria-labelledby="compute-modal-title">
      <div class="compute-modal-spinner" aria-hidden="true"></div>
      <h2 id="compute-modal-title" data-i18n="modal.title"><?= $pageT('modal.title') ?></h2>
      <p id="compute-modal-message" data-i18n="modal.message"><?= $pageT('modal.message') ?></p>
      <div class="compute-modal-actions">
        <button type="button" id="compute-modal-cancel-btn" class="danger" data-i18n="modal.cancel"><?= $pageT('modal.cancel') ?></button>
      </div>
    </div>
  </div>

	  <script>
	    window.POOH_INITIAL_LANGUAGE = <?= json_encode($initialLanguage, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT) ?>;
	    window.POOH_I18N_CATALOGS = <?= $i18nCatalogsJson ?>;
	    window.POOH_APP_CONFIG = <?= $clientAppConfigJson ?>;
	  </script>
	  <script src="src/core/i18n.js?v=<?= htmlspecialchars($i18nCoreHash, ENT_QUOTES, 'UTF-8') ?>"></script>
	  <script src="public/hypergraph-structural-xt.js?v=<?= htmlspecialchars($structuralXtHash, ENT_QUOTES, 'UTF-8') ?>"></script>
  <script src="src/core/pnh.js?v=<?= htmlspecialchars($pnhCoreHash, ENT_QUOTES, 'UTF-8') ?>"></script>
  <script src="src/core/petri-layout.js?v=<?= htmlspecialchars($petriLayoutCoreHash, ENT_QUOTES, 'UTF-8') ?>"></script>
  <script src="src/core/hypergraph.js?v=<?= htmlspecialchars($hypergraphCoreHash, ENT_QUOTES, 'UTF-8') ?>"></script>
  <script src="src/core/selection-hypergraph.js?v=<?= htmlspecialchars($selectionHypergraphCoreHash, ENT_QUOTES, 'UTF-8') ?>"></script>
  <script src="src/core/petri-analysis.js?v=<?= htmlspecialchars($petriAnalysisCoreHash, ENT_QUOTES, 'UTF-8') ?>"></script>
  <script src="src/core/exporters.js?v=<?= htmlspecialchars($exportersCoreHash, ENT_QUOTES, 'UTF-8') ?>"></script>
  <script src="src/core/max-plus.js?v=<?= htmlspecialchars($maxPlusCoreHash, ENT_QUOTES, 'UTF-8') ?>"></script>
  <script src="src/core/decomposition-view.js?v=<?= htmlspecialchars($decompositionViewCoreHash, ENT_QUOTES, 'UTF-8') ?>"></script>
  <script src="src/core/decomposition-renderer.js?v=<?= htmlspecialchars($decompositionRendererCoreHash, ENT_QUOTES, 'UTF-8') ?>"></script>
  <script src="src/core/fuzzy-source.js?v=<?= htmlspecialchars($fuzzySourceCoreHash, ENT_QUOTES, 'UTF-8') ?>"></script>
  <script src="src/core/fuzzy-membership.js?v=<?= htmlspecialchars($fuzzyMembershipCoreHash, ENT_QUOTES, 'UTF-8') ?>"></script>
  <script src="src/core/fuzzy-transversal.js?v=<?= htmlspecialchars($fuzzyTransversalCoreHash, ENT_QUOTES, 'UTF-8') ?>"></script>
  <script src="src/core/takagi-sugeno.js?v=<?= htmlspecialchars($takagiSugenoCoreHash, ENT_QUOTES, 'UTF-8') ?>"></script>
  <script src="src/core/fuzzy-artifact.js?v=<?= htmlspecialchars($fuzzyArtifactCoreHash, ENT_QUOTES, 'UTF-8') ?>"></script>
  <script src="src/core/fuzzy.js?v=<?= htmlspecialchars($fuzzyCoreHash, ENT_QUOTES, 'UTF-8') ?>"></script>
  <script src="src/core/benchmark.js?v=<?= htmlspecialchars($benchmarkCoreHash, ENT_QUOTES, 'UTF-8') ?>"></script>
  <script src="public/app.js?v=<?= htmlspecialchars($jsHash, ENT_QUOTES, 'UTF-8') ?>"></script>
</body>
</html>
