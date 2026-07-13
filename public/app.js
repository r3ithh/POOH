(function () {
  "use strict";

  const NS = "http://www.w3.org/2000/svg";
  const PLACE_RADIUS = 26;
  const TRANSITION_HALF_W = 10;
  const TRANSITION_HALF_H = 30;
  const LAYOUT_PADDING = 70;
  const STORAGE_KEY = "pooh-petri-state";
  const THEME_KEY = "pooh-theme";
  const SIDEBAR_TAB_KEY = "pooh-sidebar-tab";
  const LANGUAGE_KEY = "pooh-language";
  const APP_CONFIG = window.POOH_APP_CONFIG && typeof window.POOH_APP_CONFIG === "object"
    ? window.POOH_APP_CONFIG
    : { deploymentMode: "public", features: { researchTeam: false } };
  const RESEARCH_TEAM_ENABLED = Boolean(
    APP_CONFIG.features && APP_CONFIG.features.researchTeam === true
  );
  const LIBRARY_STORAGE_KEY = "pooh-library-id";
  const LIBRARY_FILE_STORAGE_KEY = "pooh-library-file-map";
  const HYPERGRAPH_STORAGE_KEY = "pooh-hypergraph-editor-state";
  let csrfToken = "";
  const DEFAULT_LAYOUT_MODE = "smart";
  const MIN_ZOOM = 0.3;
  const MAX_ZOOM = 3.5;
  const ZOOM_STEP = 1.15;
  const ARC_POINT_MARGIN = 8;
  const ARC_HANDLE_RADIUS = 6;

  const svg = document.getElementById("canvas");
  const modeButtons = Array.from(document.querySelectorAll("[data-mode]"));
  const fireSelectedBtn = document.getElementById("fire-selected-btn");
  const stepBtn = document.getElementById("step-btn");
  const autoBtn = document.getElementById("auto-btn");
  const enabledList = document.getElementById("enabled-list");
  const canvasFireSelectedBtn = document.getElementById("canvas-fire-selected-btn");
  const canvasStepBtn = document.getElementById("canvas-step-btn");
  const canvasAutoBtn = document.getElementById("canvas-auto-btn");
  const canvasEnabledList = document.getElementById("canvas-enabled-list");
  const canvasNetName = document.getElementById("canvas-net-name");
  const analyzeBtn = document.getElementById("analyze-btn");
  const pinvModeSelect = document.getElementById("pinv-mode-select");
  const pinvRunBtn = document.getElementById("pinv-run-btn");
  const pinvStatus = document.getElementById("pinv-status");
  const pinvOutput = document.getElementById("pinv-output");
  const pinvMatrixOutput = document.getElementById("pinv-matrix-output");
  const selectionHypergraphBtn = document.getElementById("selection-hypergraph-btn");
  const selectionHypergraphDrawBtn = document.getElementById("selection-hypergraph-draw-btn");
  const selectionHypergraphCompareBtn = document.getElementById("selection-hypergraph-compare-btn");
  const selectionHypergraphViewSelect = document.getElementById("selection-hypergraph-view-select");
  const selectionHypergraphStatus = document.getElementById("selection-hypergraph-status");
  const selectionHypergraphOutput = document.getElementById("selection-hypergraph-output");
  const transversalStrategySelect = document.getElementById("transversal-strategy-select");
  const manualHypergraphInput = document.getElementById("manual-hypergraph-input");
  const manualHypergraphRunBtn = document.getElementById("manual-hypergraph-run-btn");
  const manualHypergraphStatus = document.getElementById("manual-hypergraph-status");
  const manualHypergraphOutput = document.getElementById("manual-hypergraph-output");
  const hypergraphOpenEditorBtn = document.getElementById("hypergraph-open-editor-btn");
  const hypergraphEditorPanelStatus = document.getElementById("hypergraph-editor-panel-status");
  const hypergraphEditorSummary = document.getElementById("hypergraph-editor-summary");
  const hypergraphCanvas = document.getElementById("hypergraph-canvas");
  const hypergraphViewport = document.getElementById("hypergraph-viewport");
  const hypergraphModeButtons = Array.from(document.querySelectorAll("[data-hypergraph-mode]"));
  const hypergraphFinishEdgeBtn = document.getElementById("hypergraph-finish-edge-btn");
  const hypergraphDeleteBtn = document.getElementById("hypergraph-delete-btn");
  const hypergraphClearBtn = document.getElementById("hypergraph-clear-btn");
  const hypergraphFraBtn = document.getElementById("hypergraph-fra-btn");
  const hypergraphToggleReducedBtn = document.getElementById("hypergraph-toggle-reduced-btn");
  const hypergraphTransversalBtn = document.getElementById("hypergraph-transversal-btn");
  const hypergraphExactTransversalBtn = document.getElementById("hypergraph-exact-transversal-btn");
  const hypergraphAllTransversalsBtn = document.getElementById("hypergraph-all-transversals-btn");
  const hypergraphStructureBtn = document.getElementById("hypergraph-structure-btn");
  const hypergraphCExactBtn = document.getElementById("hypergraph-cexact-btn");
  const hypergraphStructuralXtBtn = document.getElementById("hypergraph-structural-xt-btn");
  const hypergraphAnalysisInfoBtn = document.getElementById("hypergraph-analysis-info-btn");
  const hypergraphAnalysisInfo = document.getElementById("hypergraph-analysis-info");
  const hypergraphXtrecBtn = document.getElementById("hypergraph-xtrec-btn");
  const hypergraphRExactInput = document.getElementById("hypergraph-rexact-r-input");
  const hypergraphRExactBtn = document.getElementById("hypergraph-rexact-btn");
  const hypergraphResultsToggleBtn = document.getElementById("hypergraph-results-toggle-btn");
  const hypergraphResultsPanel = document.getElementById("hypergraph-results-panel");
  const hypergraphRExactSummary = document.getElementById("hypergraph-rexact-summary");
  const hypergraphStructureSummary = document.getElementById("hypergraph-structure-summary");
  const hypergraphCExactSummary = document.getElementById("hypergraph-cexact-summary");
  const hypergraphStructuralXtSummary = document.getElementById("hypergraph-structural-xt-summary");
  const hypergraphTransversalPicker = document.getElementById("hypergraph-transversal-picker");
  const hypergraphTransversalSelect = document.getElementById("hypergraph-transversal-select");
  const hypergraphTransversalDetails = document.getElementById("hypergraph-transversal-details");
  const hypergraphClearTransversalBtn = document.getElementById("hypergraph-clear-transversal-btn");
  const hypergraphEditorStatus = document.getElementById("hypergraph-editor-status");
  const hypergraphEditorOutput = document.getElementById("hypergraph-editor-output");
  const selectionHypergraphComparisonPanel = document.getElementById("selection-hypergraph-comparison-panel");
  const selectionHypergraphComparisonCloseBtn = document.getElementById("selection-hypergraph-comparison-close-btn");
  const selectionHypergraphComparisonTitle = document.getElementById("selection-hypergraph-comparison-title");
  const selectionHypergraphComparisonNote = document.getElementById("selection-hypergraph-comparison-note");
  const selectionHypergraphBeforeTitle = document.getElementById("selection-hypergraph-before-title");
  const selectionHypergraphAfterTitle = document.getElementById("selection-hypergraph-after-title");
  const selectionHypergraphBeforeSvg = document.getElementById("selection-hypergraph-before-svg");
  const selectionHypergraphAfterSvg = document.getElementById("selection-hypergraph-after-svg");
  const selectionHypergraphBeforeSummary = document.getElementById("selection-hypergraph-before-summary");
  const selectionHypergraphAfterSummary = document.getElementById("selection-hypergraph-after-summary");
  const hypergraphZoomOutBtn = document.getElementById("hypergraph-zoom-out-btn");
  const hypergraphZoomInBtn = document.getElementById("hypergraph-zoom-in-btn");
  const hypergraphZoomResetBtn = document.getElementById("hypergraph-zoom-reset-btn");
  const hypergraphPanLeftBtn = document.getElementById("hypergraph-pan-left-btn");
  const hypergraphPanRightBtn = document.getElementById("hypergraph-pan-right-btn");
  const hypergraphPanUpBtn = document.getElementById("hypergraph-pan-up-btn");
  const hypergraphPanDownBtn = document.getElementById("hypergraph-pan-down-btn");
  const hypergraphCenterBtn = document.getElementById("hypergraph-center-btn");
  const hypergraphZoomLevel = document.getElementById("hypergraph-zoom-level");
  const analysisResult = document.getElementById("analysis-result");
  const sfcProfileSelect = document.getElementById("sfc-profile-select");
  const sfcSyncSelect = document.getElementById("sfc-sync-select");
  const sfcSourceSelect = document.getElementById("sfc-source-select");
  const sfcIdeTargetSelect = document.getElementById("sfc-ide-target-select");
  const sfcTraceLengthInput = document.getElementById("sfc-trace-length");
  const sfcMaxPlusDefaultDelayInput = document.getElementById("sfc-maxplus-default-delay");
  const sfcMaxPlusDelayMapInput = document.getElementById("sfc-maxplus-delay-map");
  const sfcMaxPlusSyncOverheadInput = document.getElementById("sfc-maxplus-sync-overhead");
  const sfcBuildBtn = document.getElementById("sfc-build-btn");
  const sfcValidateBtn = document.getElementById("sfc-validate-btn");
  const sfcMaxPlusRunBtn = document.getElementById("sfc-maxplus-run-btn");
  const sfcExportXmlBtn = document.getElementById("sfc-export-xml-btn");
  const sfcExportStBtn = document.getElementById("sfc-export-st-btn");
  const sfcExportIdeBtn = document.getElementById("sfc-export-ide-btn");
  const sfcStatus = document.getElementById("sfc-status");
  const sfcOutput = document.getElementById("sfc-output");
  const sfcValidationOutput = document.getElementById("sfc-validation-output");
  const sfcMaxPlusOutput = document.getElementById("sfc-maxplus-output");
  const fuzzyAlphaInput = document.getElementById("fuzzy-alpha-input");
  const fuzzySourceSelect = document.getElementById("fuzzy-source-select");
  const fuzzySourceNote = document.getElementById("fuzzy-source-note");
  const fuzzyMappingCard = document.getElementById("fuzzy-hypergraph-mapping-card");
  const fuzzyMappingList = document.getElementById("fuzzy-mapping-list");
  const fuzzyMappingStatus = document.getElementById("fuzzy-mapping-status");
  const fuzzyMappingRefreshBtn = document.getElementById("fuzzy-mapping-refresh-btn");
  const fuzzyMappingAutoBtn = document.getElementById("fuzzy-mapping-auto-btn");
  const fuzzyMappingClearBtn = document.getElementById("fuzzy-mapping-clear-btn");
  const fuzzyAlphaStepInput = document.getElementById("fuzzy-alpha-step-input");
  const fuzzyDefaultDelayInput = document.getElementById("fuzzy-default-delay-input");
  const fuzzyDelayMapInput = document.getElementById("fuzzy-delay-map-input");
  const fuzzySyncOverheadInput = document.getElementById("fuzzy-sync-overhead-input");
  const fuzzyMuBaseInput = document.getElementById("fuzzy-mu-base-input");
  const fuzzyMuConcurrencyInput = document.getElementById("fuzzy-mu-concurrency-input");
  const fuzzyMuConflictInput = document.getElementById("fuzzy-mu-conflict-input");
  const fuzzyMuTimeInput = document.getElementById("fuzzy-mu-time-input");
  const fuzzyMuCouplingInput = document.getElementById("fuzzy-mu-coupling-input");
  const fuzzyMuReconfigurationInput = document.getElementById("fuzzy-mu-reconfiguration-input");
  const fuzzyMaxSizeInput = document.getElementById("fuzzy-max-size-input");
  const fuzzyMaxCouplingInput = document.getElementById("fuzzy-max-coupling-input");
  const fuzzyLambdaLimitInput = document.getElementById("fuzzy-lambda-limit-input");
  const fuzzyMpcHorizonInput = document.getElementById("fuzzy-mpc-horizon-input");
  const fuzzyExperimentLabelInput = document.getElementById("fuzzy-experiment-label-input");
  const fuzzyBuildBtn = document.getElementById("fuzzy-build-btn");
  const fuzzyShowHypergraphSolutionBtn = document.getElementById("fuzzy-show-hypergraph-solution-btn");
  const fuzzyExportJsonBtn = document.getElementById("fuzzy-export-json-btn");
  const fuzzyExportCsvBtn = document.getElementById("fuzzy-export-csv-btn");
  const fuzzyExportAlphaCsvBtn = document.getElementById("fuzzy-export-alpha-csv-btn");
  const fuzzyExportMuCsvBtn = document.getElementById("fuzzy-export-mu-csv-btn");
  const fuzzyExportLatexBtn = document.getElementById("fuzzy-export-latex-btn");
  const fuzzyExportReportBtn = document.getElementById("fuzzy-export-report-btn");
  const fuzzySaveRunBtn = document.getElementById("fuzzy-save-run-btn");
  const fuzzyRefreshRunsBtn = document.getElementById("fuzzy-refresh-runs-btn");
  const fuzzyRunsStatus = document.getElementById("fuzzy-runs-status");
  const fuzzyRunsList = document.getElementById("fuzzy-runs-list");
  const fuzzyRunsCompare = document.getElementById("fuzzy-runs-compare");
  const fuzzyStatus = document.getElementById("fuzzy-status");
  const fuzzyPipelineOutput = document.getElementById("fuzzy-pipeline-output");
  const fuzzyMembershipOutput = document.getElementById("fuzzy-membership-output");
  const fuzzyRelationsOutput = document.getElementById("fuzzy-relations-output");
  const fuzzyMaxPlusOutput = document.getElementById("fuzzy-maxplus-output");
  const fuzzyRulesOutput = document.getElementById("fuzzy-rules-output");

  const newNetBtn = document.getElementById("new-net-btn");
  const saveJsonBtn = document.getElementById("save-json-btn");
  const loadJsonBtn = document.getElementById("load-json-btn");
  const loadJsonInput = document.getElementById("load-json-input");
  const loadPnhBtn = document.getElementById("load-pnh-btn");
  const loadPnhInput = document.getElementById("load-pnh-input");
  const exportPnhBtn = document.getElementById("export-pnh-btn");
  const relayoutBtn = document.getElementById("relayout-btn");
  const layoutModeSelect = document.getElementById("layout-mode-select");
  const layoutBadge = document.getElementById("layout-badge");
  const zoomOutBtn = document.getElementById("zoom-out-btn");
  const zoomInBtn = document.getElementById("zoom-in-btn");
  const zoomResetBtn = document.getElementById("zoom-reset-btn");
  const zoomLevel = document.getElementById("zoom-level");
  const panLeftBtn = document.getElementById("pan-left-btn");
  const panRightBtn = document.getElementById("pan-right-btn");
  const panUpBtn = document.getElementById("pan-up-btn");
  const panDownBtn = document.getElementById("pan-down-btn");
  const centerNetBtn = document.getElementById("center-net-btn");

  const sidebarToggle = document.getElementById("sidebar-toggle");
  const inspectorToggle = document.getElementById("inspector-toggle");
  const INSPECTOR_COLLAPSED_KEY = "pooh-inspector-collapsed";
  const themeToggle = document.getElementById("theme-toggle");
  const languageSelect = document.getElementById("language-select");

  const inspectorEmpty = document.getElementById("inspector-empty");
  const inspectorNode = document.getElementById("inspector-node");
  const inspectorArc = document.getElementById("inspector-arc");
  const nodeLabelInput = document.getElementById("node-label-input");
  const tokensLabel = document.getElementById("tokens-label");
  const nodeTokensInput = document.getElementById("node-tokens-input");
  const transitionRotation = document.getElementById("transition-rotation");
  const rotate45Btn = document.getElementById("rotate-45-btn");
  const rotate90Btn = document.getElementById("rotate-90-btn");
  const rotateResetBtn = document.getElementById("rotate-reset-btn");
  const transitionAngleInfo = document.getElementById("transition-angle-info");
  const arcWeightInput = document.getElementById("arc-weight-input");
  const arcClearBendsBtn = document.getElementById("arc-clear-bends-btn");
  const deleteBtn = document.getElementById("delete-btn");
  const petriInspectorTools = document.getElementById("petri-inspector-tools");
  const hypergraphInspectorTools = document.getElementById("hypergraph-inspector-tools");

  const metadataFilterInput = document.getElementById("metadata-filter-input");
  const metadataList = document.getElementById("metadata-list");
  const classificationList = document.getElementById("classification-list");
  const authorsEmpty = document.getElementById("authors-empty");
  const authorTabs = document.getElementById("author-tabs");
  const authorCard = document.getElementById("author-card");
  const authorNameValue = document.getElementById("author-name-value");
  const authorDegreeValue = document.getElementById("author-degree-value");
  const authorEmailsValue = document.getElementById("author-emails-value");
  const authorUnitValue = document.getElementById("author-unit-value");
  const authorRoleValue = document.getElementById("author-role-value");
  const authorResearchAreaValue = document.getElementById("author-research-area-value");
  const authorProfilesValue = document.getElementById("author-profiles-value");
  const authorMetricsValue = document.getElementById("author-metrics-value");
  const authorMetricsRefreshBtn = document.getElementById("author-metrics-refresh-btn");
  const authorMetricsRefreshStatus = document.getElementById("author-metrics-refresh-status");
  const authorMetricsEditBtn = document.getElementById("author-metrics-edit-btn");
  const metricsEditModal = document.getElementById("metrics-edit-modal");
  const metricsEditCloseBtn = document.getElementById("metrics-edit-close-btn");
  const metricsEditSaveBtn = document.getElementById("metrics-edit-save-btn");
  const metricsEditCancelBtn = document.getElementById("metrics-edit-cancel-btn");
  const metricsEditError = document.getElementById("metrics-edit-error");
  const metricsEditSubtitle = document.getElementById("metrics-edit-modal-subtitle");
  const librarySelect = document.getElementById("library-select");
  const libraryNameInput = document.getElementById("library-name-input");
  const libraryAuthRequiredHint = document.getElementById("library-auth-required-hint");

  const headerLoginBtn = document.getElementById("header-login-btn");
  const headerLogoutBtn = document.getElementById("header-logout-btn");
  const headerAuthLoggedOut = document.getElementById("header-auth-logged-out");
  const headerAuthLoggedIn = document.getElementById("header-auth-logged-in");
  const headerAuthUserInfo = document.getElementById("header-auth-user-info");

  const loginModal = document.getElementById("login-modal");
  const loginModalCloseBtn = document.getElementById("login-modal-close-btn");
  const loginModalUsername = document.getElementById("login-modal-username");
  const loginModalPassword = document.getElementById("login-modal-password");
  const loginModalSubmitBtn = document.getElementById("login-modal-submit-btn");
  const loginModalCancelBtn = document.getElementById("login-modal-cancel-btn");
  const loginModalError = document.getElementById("login-modal-error");
  const loginModalTurnstileContainer = document.getElementById("login-modal-turnstile");

  const aboutOpenBtn = document.getElementById("about-open-btn");
  const aboutModal = document.getElementById("about-modal");
  const aboutModalCloseBtn = document.getElementById("about-modal-close-btn");

  // Documentation panel
  const docsReloadBtn = document.getElementById("docs-reload-btn");
  const docsEditBtn = document.getElementById("docs-edit-btn");
  const docsSaveBtn = document.getElementById("docs-save-btn");
  const docsCancelBtn = document.getElementById("docs-cancel-btn");
  const docsStatus = document.getElementById("docs-status");
  const docsView = document.getElementById("docs-view");
  const docsEditView = document.getElementById("docs-edit-view");
  const docsDescriptionBody = document.getElementById("docs-description-body");
  const docsAlgorithmsList = document.getElementById("docs-algorithms-list");
  const docsArticlesList = document.getElementById("docs-articles-list");
  const docsEditDescEn = document.getElementById("docs-edit-desc-en");
  const docsEditDescPl = document.getElementById("docs-edit-desc-pl");
  const docsEditAlgorithmsList = document.getElementById("docs-edit-algorithms-list");
  const docsEditArticlesList = document.getElementById("docs-edit-articles-list");
  const docsAddAlgorithmBtn = document.getElementById("docs-add-algorithm-btn");
  const docsAddArticleBtn = document.getElementById("docs-add-article-btn");

  const libraryProtectedArea = document.getElementById("library-protected-area");
  const libraryManageArea = document.getElementById("library-manage-area");
  const createLibraryBtn = document.getElementById("create-library-btn");
  const renameLibraryBtn = document.getElementById("rename-library-btn");
  const refreshLibraryBtn = document.getElementById("refresh-library-btn");
  const libraryUploadBtn = document.getElementById("library-upload-btn");
  const libraryUploadInput = document.getElementById("library-upload-input");
  const libraryUploadFolderBtn = document.getElementById("library-upload-folder-btn");
  const libraryUploadFolderInput = document.getElementById("library-upload-folder-input");
  const libraryFileSelect = document.getElementById("library-file-select");
  const libraryFileOptions = document.getElementById("library-file-options");
  const loadLibraryFileBtn = document.getElementById("load-library-file-btn");
  const libraryStatus = document.getElementById("library-status");
  const benchmarkFilesSelect = document.getElementById("benchmark-files-select");
  const benchmarkFileFilterInput = document.getElementById("benchmark-file-filter");
  const benchmarkFileLimitInput = document.getElementById("benchmark-file-limit");
  const benchmarkStrataTargetInput = document.getElementById("benchmark-strata-target");
  const benchmarkApplyFilterBtn = document.getElementById("benchmark-apply-filter-btn");
  const benchmarkSelectAllBtn = document.getElementById("benchmark-select-all-btn");
  const benchmarkClearSelectionBtn = document.getElementById("benchmark-clear-selection-btn");
  const benchmarkFileFilterStatus = document.getElementById("benchmark-file-filter-status");
  const benchmarkRepeatCountInput = document.getElementById("benchmark-repeat-count");
  const benchmarkPinvModeSelect = document.getElementById("benchmark-pinv-mode");
  const benchmarkPinvAccelerationSelect = document.getElementById("benchmark-pinv-acceleration");
  const benchmarkXtrecAccelerationSelect = document.getElementById("benchmark-xtrec-acceleration");
  const benchmarkProfileBtn = document.getElementById("benchmark-profile-btn");
  const benchmarkSelectRepresentativeBtn = document.getElementById("benchmark-select-representative-btn");
  const benchmarkRunRepresentativeBtn = document.getElementById("benchmark-run-representative-btn");
  const benchmarkExportProfileCsvBtn = document.getElementById("benchmark-export-profile-csv-btn");
  const benchmarkRunBtn = document.getElementById("benchmark-run-btn");
  const benchmarkCancelBtn = document.getElementById("benchmark-cancel-btn");
  const benchmarkExportCsvBtn = document.getElementById("benchmark-export-csv-btn");
  const benchmarkExportLatexBtn = document.getElementById("benchmark-export-latex-btn");
  const benchmarkStatus = document.getElementById("benchmark-status");
  const benchmarkCurrent = document.getElementById("benchmark-current");
  const benchmarkResults = document.getElementById("benchmark-results");
  const benchmarkLatexOutput = document.getElementById("benchmark-latex-output");
  const sidebarTabButtons = Array.from(document.querySelectorAll(".sidebar-tab-btn"));
  const sidebarTabPanels = Array.from(document.querySelectorAll(".sidebar-tab-panel"));
  const workspaceTabCanvas = document.getElementById("workspace-tab-canvas");
  const workspaceTabHypergraph = document.getElementById("workspace-tab-hypergraph");
  const workspaceTabTools = document.getElementById("workspace-tab-tools");
  const workspaceTabDecomposition = document.getElementById("workspace-tab-decomposition");
  const workspaceTabBenchmark = document.getElementById("workspace-tab-benchmark");
  const workspaceCanvasPanel = document.getElementById("workspace-canvas-panel");
  const workspaceHypergraphPanel = document.getElementById("workspace-hypergraph-panel");
  const workspaceToolsPanel = document.getElementById("workspace-tools-panel");
  const workspaceToolsContent = document.getElementById("workspace-tools-content");
  const workspaceToolsTitle = document.getElementById("workspace-tools-title");
  const workspaceDecompositionPanel = document.getElementById("workspace-decomposition-panel");
  const workspaceBenchmarkPanel = document.getElementById("workspace-benchmark-panel");
  const workspaceHypergraphLabel = document.getElementById("workspace-hypergraph-label");
  const workspaceDecompositionLabel = document.getElementById("workspace-decomposition-label");
  const decompositionCanvas = document.getElementById("decomposition-canvas");
  const decompViewport = document.getElementById("decomp-viewport");
  const decompositionViewModeSelect = document.getElementById("decomposition-view-mode");
  const decompositionSubnetSelect = document.getElementById("decomposition-subnet-select");
  const decompositionLayoutModeSelect = document.getElementById("decomposition-layout-mode");
  const decompositionStatus = document.getElementById("decomposition-status");
  const decompositionDetails = document.getElementById("decomposition-details");
  const genPlaceCountInput = document.getElementById("gen-place-count");
  const genTransitionCountInput = document.getElementById("gen-transition-count");
  const genNetTypeSelect = document.getElementById("gen-net-type");
  const genMethodSelect = document.getElementById("gen-method");
  const genLiveOptionSelect = document.getElementById("gen-live-option");
  const genSafeOptionSelect = document.getElementById("gen-safe-option");
  const genRedundantCountInput = document.getElementById("gen-redundant-count");
  const genXtHypergraphCheckbox = document.getElementById("gen-xt-hypergraph");
  const generateNetBtn = document.getElementById("generate-net-btn");
  const generateStatus = document.getElementById("generate-status");
  const genSearchMinPlaces = document.getElementById("gen-search-min-places");
  const genSearchMaxPlaces = document.getElementById("gen-search-max-places");
  const genSearchMinTransitions = document.getElementById("gen-search-min-transitions");
  const genSearchMaxTransitions = document.getElementById("gen-search-max-transitions");
  const genSearchTimeLimit = document.getElementById("gen-search-time-limit");
  const genSearchBtn = document.getElementById("gen-search-btn");
  const computeModal = document.getElementById("compute-modal");
  const computeModalTitle = document.getElementById("compute-modal-title");
  const computeModalMessage = document.getElementById("compute-modal-message");
  const computeModalCancelBtn = document.getElementById("compute-modal-cancel-btn");

  const viewBox = svg.viewBox.baseVal;
  const CANVAS_W = viewBox.width;
  const CANVAS_H = viewBox.height;
  const decompViewBox = decompositionCanvas ? decompositionCanvas.viewBox.baseVal : viewBox;
  const DECOMP_CANVAS_W = decompViewBox.width;
  const DECOMP_CANVAS_H = decompViewBox.height;
  const hypergraphViewBox = hypergraphCanvas ? hypergraphCanvas.viewBox.baseVal : viewBox;
  const HYPERGRAPH_CANVAS_W = hypergraphViewBox.width;
  const HYPERGRAPH_CANVAS_H = hypergraphViewBox.height;

  const state = {
    nodes: [],
    arcs: [],
    metadata: [],
    counters: {
      place: 1,
      transition: 1,
      arc: 1
    },
    view: {
      zoom: 1,
      panX: 0,
      panY: 0
    },
    library: {
      selectedId: null,
      libraries: [],
      files: []
    },
    auth: {
      loggedIn: false,
      user: null
    },
    authors: {
      items: [],
      selectedId: ""
    },
    docs: {
      data: null,
      draft: null,
      mode: "view"
    },
    researchRuns: {
      items: [],
      selectedId: ""
    },
    settings: {
      layoutMode: DEFAULT_LAYOUT_MODE,
      language: String(window.POOH_INITIAL_LANGUAGE || "en")
    }
  };

  const hypergraphState = {
    vertices: [],
    edges: [],
    counters: {
      vertex: 1,
      edge: 1
    },
    view: {
      zoom: 1,
      panX: 0,
      panY: 0
    }
  };

  let mode = "select";
  let selected = { kind: null, id: null };
  let selectedNodeIds = new Set();
  let selectedArcPoint = { arcId: null, index: -1 };
  let dragInfo = null;
  let multiDragInfo = null;
  let arcPointDragInfo = null;
  let panInfo = null;
  let isSpacePressed = false;
  let suppressCanvasClick = false;
  let blockNextContextMenu = false;
  let arcSourceNodeId = null;
  let autoTimer = null;
  let viewportLayer = null;
  let generatorWorker = null;
  let generatorJobSequence = 0;
  let activeGeneratorJobId = 0;
  let generatorIsRunning = false;
  let pinvariantWorker = null;
  let pinvariantJobSequence = 0;
  let activePinvariantJobId = 0;
  let pinvariantIsRunning = false;
  let lastPinvariantResult = null;
  let xtrecWorker = null;
  let xtrecJobSequence = 0;
  let activeXtrecJobId = 0;
  let xtrecIsRunning = false;
  let activeTransversalWorker = null;
  let transversalJobSequence = 0;
  let activeTransversalJobId = 0;
  let pendingSelectionHypergraphResult = null;
  let lastSelectionHypergraphResult = null;
  let manualXtrecWorker = null;
  let manualXtrecJobSequence = 0;
  let activeManualXtrecJobId = 0;
  let lastManualHypergraphResult = null;
  let hypergraphEditorMode = "select";
  let hypergraphSelectedVertexId = null;
  let hypergraphSelectedEdgeId = null;
  let hypergraphPendingEdgeVertexIds = new Set();
  let hypergraphDragInfo = null;
  let hypergraphPanInfo = null;
  let hypergraphSuppressClick = false;
  let hypergraphShowReduced = false;
  let hypergraphResultsVisible = false;
  let hypergraphAnalysisInfoVisible = false;
  let hypergraphReducedResult = null;
  let hypergraphEditorSourceInfo = null;
  let hypergraphEditorAnalysis = {
    xtrec: null,
    transversal: null,
    exactTransversal: null,
    allTransversals: null,
    rExact: null,
    structure: null,
    cExact: null,
    structuralXt: null
  };
  let hypergraphTransversalView = {
    mode: "",
    labels: [],
    candidates: [],
    selectedIndex: -1
  };
  let hypergraphXtrecWorker = null;
  let hypergraphXtrecJobSequence = 0;
  let activeHypergraphXtrecJobId = 0;
  let sfcWorker = null;
  let sfcJobSequence = 0;
  let activeSfcJobId = 0;
  let sfcIsRunning = false;
  let lastSfcResult = null;
  let benchmarkIsRunning = false;
  let benchmarkCancelRequested = false;
  let benchmarkSessionId = 0;
  let benchmarkRecords = [];
  let benchmarkProfileRecords = [];
  let benchmarkRepresentativeSelection = null;
  let benchmarkActivePinvariantWorker = null;
  let benchmarkActiveXtrecWorker = null;
  let activeWorkspaceTab = "canvas";
  let decompositionSelectionLabel = "";
  let activeComputation = null;
  let lastFuzzyMaxPlusResult = null;
  let fuzzyHypergraphMappings = {};

  const I18N = window.POOH_I18N_CATALOGS || {};
  const i18n = window.PoohI18n;

  function normalizeLanguage(value) {
    return i18n && typeof i18n.normalizeLanguage === "function"
      ? i18n.normalizeLanguage(value)
      : (value === "pl" ? "pl" : "en");
  }

  function t(key, params) {
    const lang = normalizeLanguage(state.settings.language);
    if (i18n && typeof i18n.t === "function") {
      return i18n.t(key, params, lang);
    }
    const dict = I18N[lang] || I18N.en || {};
    const fallback = I18N.en || I18N.pl || {};
    const value = Object.prototype.hasOwnProperty.call(dict, key)
      ? dict[key]
      : (Object.prototype.hasOwnProperty.call(fallback, key) ? fallback[key] : key);
    return String(value).replace(/\{([A-Za-z0-9_]+)\}/g, (match, name) => (
      params && Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match
    ));
  }

  function getWorkerI18nConfig() {
    if (i18n && typeof i18n.exportWorkerConfig === "function") {
      return i18n.exportWorkerConfig(state.settings.language);
    }
    return {
      language: normalizeLanguage(state.settings.language),
      catalogs: I18N
    };
  }

  function postLocalizedWorkerMessage(worker, message) {
    worker.postMessage({
      ...message,
      i18n: getWorkerI18nConfig()
    });
  }

  function setElementText(element, key) {
    if (!element) {
      return;
    }
    element.textContent = t(key);
  }

  function setSelectOptionText(select, optionValue, key) {
    if (!select) {
      return;
    }
    const option = Array.from(select.options).find((item) => item.value === optionValue);
    if (!option) {
      return;
    }
    option.textContent = t(key);
  }

  function setLabelTextForControl(control, key) {
    if (!control) {
      return;
    }
    const label = control.closest("label");
    if (!label) {
      return;
    }
    Array.from(label.childNodes).forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE && String(node.textContent || "").trim()) {
        node.textContent = "";
      }
    });
    let span = label.querySelector(":scope > .i18n-label");
    if (!span) {
      span = document.createElement("span");
      span.className = "i18n-label";
      label.insertBefore(span, label.firstChild);
    }
    span.textContent = t(key);
  }

  function setPanelTitle(panelId, key) {
    const title = document.querySelector(`#${panelId} .sidebar-panel-title`);
    if (!title) {
      return;
    }
    const textNode = Array.from(title.childNodes).find((node) => node.nodeType === Node.TEXT_NODE);
    if (textNode) {
      textNode.textContent = ` ${t(key)}`;
      return;
    }
    title.appendChild(document.createTextNode(` ${t(key)}`));
  }

  function translateDefaultText(element, defaultKey) {
    if (!element) {
      return;
    }
    const current = String(element.textContent || "").trim();
    const plText = String((I18N.pl && I18N.pl[defaultKey]) || "");
    const enText = String((I18N.en && I18N.en[defaultKey]) || "");
    if (!current || current === plText || current === enText) {
      element.textContent = t(defaultKey);
    }
  }

  function applyTranslations() {
    document.documentElement.lang = normalizeLanguage(state.settings.language);

    document.querySelectorAll("[data-i18n]").forEach((element) => {
      element.textContent = t(element.getAttribute("data-i18n"));
    });
    ["title", "aria-label", "placeholder"].forEach((attribute) => {
      document.querySelectorAll(`[data-i18n-${attribute}]`).forEach((element) => {
        element.setAttribute(attribute, t(element.getAttribute(`data-i18n-${attribute}`)));
      });
    });

    setElementText(document.getElementById("brand-subtitle"), "brand.subtitle");
    setElementText(document.getElementById("theme-toggle-label"), "header.darkTheme");
    setElementText(document.getElementById("language-select-label"), "header.language");
    setElementText(document.getElementById("system-version-label"), "header.systemVersion");

    setElementText(document.querySelector("#sidebar-tab-sim .sidebar-tab-text"), "nav.sim");
    setElementText(document.querySelector("#sidebar-tab-sfc .sidebar-tab-text"), "nav.sfc");
    setElementText(document.querySelector("#sidebar-tab-fuzzy .sidebar-tab-text"), "nav.fuzzy");
    setElementText(document.querySelector("#sidebar-tab-draw .sidebar-tab-text"), "nav.draw");
    setElementText(document.querySelector("#sidebar-tab-io .sidebar-tab-text"), "nav.io");
    setElementText(document.querySelector("#sidebar-tab-gen .sidebar-tab-text"), "nav.gen");
    setElementText(document.querySelector("#sidebar-tab-lib .sidebar-tab-text"), "nav.lib");
    setElementText(document.querySelector("#sidebar-tab-bench .sidebar-tab-text"), "nav.bench");
    setElementText(document.querySelector("#sidebar-tab-meta .sidebar-tab-text"), "nav.meta");
    setElementText(document.querySelector("#sidebar-tab-class .sidebar-tab-text"), "nav.class");
    setElementText(document.querySelector("#sidebar-tab-auth .sidebar-tab-text"), "nav.auth");
    setElementText(document.querySelector(".sidebar-note"), "sidebar.note");
    [
      ["sidebar-tab-sim", "nav.sim"],
      ["sidebar-tab-sfc", "nav.sfc"],
      ["sidebar-tab-fuzzy", "nav.fuzzy"],
      ["sidebar-tab-draw", "nav.draw"],
      ["sidebar-tab-io", "nav.io"],
      ["sidebar-tab-gen", "nav.gen"],
      ["sidebar-tab-lib", "nav.lib"],
      ["sidebar-tab-bench", "nav.bench"],
      ["sidebar-tab-meta", "nav.meta"],
      ["sidebar-tab-class", "nav.class"],
      ["sidebar-tab-auth", "nav.auth"]
    ].forEach(([id, key]) => {
      const button = document.getElementById(id);
      if (button) {
        button.title = t(key);
      }
    });

    setElementText(workspaceTabCanvas, "workspace.canvasTab");
    setElementText(workspaceTabHypergraph, "workspace.hypergraphTab");
    setElementText(workspaceTabTools, "workspace.toolsTab");
    setElementText(workspaceTabDecomposition, "workspace.decompositionTab");
    setElementText(workspaceTabBenchmark, "workspace.benchmarkTab");
    setElementText(document.getElementById("workspace-canvas-label"), "workspace.canvasLabel");
    setElementText(workspaceHypergraphLabel, "workspace.hypergraphLabel");
    setElementText(workspaceDecompositionLabel, "workspace.decompositionLabel");
    setElementText(document.getElementById("workspace-benchmark-label"), "workspace.benchmarkLabel");

    setPanelTitle("sidebar-panel-sim", "panel.sim");
    setPanelTitle("sidebar-panel-sfc", "panel.sfc");
    setPanelTitle("sidebar-panel-fuzzy", "panel.fuzzy");
    setPanelTitle("sidebar-panel-draw", "panel.draw");
    setPanelTitle("sidebar-panel-io", "panel.io");
    setPanelTitle("sidebar-panel-gen", "panel.gen");
    setPanelTitle("sidebar-panel-lib", "panel.lib");
    setPanelTitle("sidebar-panel-bench", "panel.bench");
    setPanelTitle("sidebar-panel-meta", "panel.meta");
    setPanelTitle("sidebar-panel-class", "panel.class");
    setPanelTitle("sidebar-panel-auth", "panel.auth");

    modeButtons.forEach((button) => {
      if (button.classList.contains("canvas-mode-btn")) {
        return;
      }
      if (button.dataset.mode === "select") {
        button.textContent = t("mode.select");
      } else if (button.dataset.mode === "place") {
        button.textContent = t("mode.place");
      } else if (button.dataset.mode === "transition") {
        button.textContent = t("mode.transition");
      } else if (button.dataset.mode === "arc") {
        button.textContent = t("mode.arc");
      }
    });
    document.querySelectorAll(".canvas-mode-label").forEach((label) => {
      const modeKey = label.dataset.modeLabel;
      if (modeKey) {
        label.textContent = t("mode." + modeKey + "Short");
      }
    });
    document.querySelectorAll(".canvas-mode-btn").forEach((btn) => {
      const modeKey = btn.dataset.mode;
      if (modeKey) {
        btn.title = t("mode." + modeKey);
      }
    });
    setElementText(fireSelectedBtn, "sim.fireSelected");
    setElementText(stepBtn, "sim.stepRandom");
    setElementText(document.getElementById("canvas-fire-selected-text"), "sim.fireSelected");
    setElementText(document.getElementById("canvas-step-text"), "sim.stepRandom");
    if (canvasFireSelectedBtn) {
      canvasFireSelectedBtn.title = t("sim.fireSelected");
    }
    if (canvasStepBtn) {
      canvasStepBtn.title = t("sim.stepRandom");
    }
    updateAutoSimulationLabels();
    translateDefaultText(canvasEnabledList, "sim.enabledNone");
    setElementText(document.getElementById("analysis-check-kicker"), "analysis.checkKicker");
    setElementText(document.getElementById("analysis-check-title"), "analysis.checkTitle");
    setElementText(document.getElementById("analysis-pinv-title"), "analysis.pinvTitle");
    setElementText(document.getElementById("analysis-pinv-note"), "analysis.pinvNote");
    setElementText(document.getElementById("analysis-hypergraph-title"), "analysis.hypergraphTitle");
    setElementText(document.getElementById("analysis-hypergraph-note"), "analysis.hypergraphNote");
    setElementText(analyzeBtn, "sim.analyze");
    setLabelTextForControl(pinvModeSelect, "sim.pinvLabel");
    setSelectOptionText(pinvModeSelect, "cover-stop", "pinv.mode.coverStop");
    setSelectOptionText(pinvModeSelect, "full", "pinv.mode.full");
    setElementText(pinvRunBtn, "sim.runPinv");
    setLabelTextForControl(transversalStrategySelect, "sim.transversalLabel");
    setSelectOptionText(transversalStrategySelect, "all", "transversal.all");
    setSelectOptionText(transversalStrategySelect, "xtr", "transversal.xtr");
    setSelectOptionText(transversalStrategySelect, "dlx", "transversal.dlx");
    setSelectOptionText(transversalStrategySelect, "backtracking", "transversal.backtracking");
    setSelectOptionText(transversalStrategySelect, "greedy", "transversal.greedy");
    setLabelTextForControl(selectionHypergraphViewSelect, "sim.selectionDrawVariant");
    setSelectOptionText(selectionHypergraphViewSelect, "reduced", "selection.draw.reduced");
    setSelectOptionText(selectionHypergraphViewSelect, "original", "selection.draw.original");
    setElementText(selectionHypergraphBtn, "sim.selectionButton");
    setElementText(selectionHypergraphDrawBtn, "sim.drawSelectionHypergraph");
    setElementText(selectionHypergraphCompareBtn, "sim.compareSelectionHypergraph");
    setElementText(selectionHypergraphComparisonTitle, "selection.compare.title");
    setElementText(selectionHypergraphComparisonNote, "selection.compare.note");
    setElementText(selectionHypergraphBeforeTitle, "selection.compare.before");
    setElementText(selectionHypergraphAfterTitle, "selection.compare.after");
    setElementText(selectionHypergraphComparisonCloseBtn, "selection.compare.hide");
    setElementText(document.getElementById("manual-hypergraph-title"), "manualHypergraph.title");
    setElementText(document.getElementById("manual-hypergraph-hint"), "manualHypergraph.hint");
    setElementText(document.getElementById("manual-hypergraph-input-label"), "manualHypergraph.input");
    if (manualHypergraphInput) {
      manualHypergraphInput.placeholder = t("manualHypergraph.placeholder");
    }
    setElementText(manualHypergraphRunBtn, "manualHypergraph.run");
    setElementText(hypergraphOpenEditorBtn, "hypergraphEditor.open");
    setElementText(hypergraphResultsToggleBtn, hypergraphResultsVisible ? "hypergraphEditor.hideResults" : "hypergraphEditor.showResults");
    setElementText(document.getElementById("hypergraph-mode-select-label"), "hypergraphEditor.modeSelect");
    setElementText(document.getElementById("hypergraph-mode-vertex-label"), "hypergraphEditor.modeVertex");
    setElementText(document.getElementById("hypergraph-mode-edge-label"), "hypergraphEditor.modeEdge");
    setElementText(hypergraphFinishEdgeBtn, "hypergraphEditor.finishEdge");
    setElementText(hypergraphDeleteBtn, "hypergraphEditor.delete");
    setElementText(hypergraphClearBtn, "hypergraphEditor.clear");
    setElementText(hypergraphFraBtn, "hypergraphEditor.fra");
    setElementText(hypergraphTransversalBtn, "hypergraphEditor.transversal");
    setElementText(hypergraphExactTransversalBtn, "hypergraphEditor.exactTransversal");
    setElementText(hypergraphAllTransversalsBtn, "hypergraphEditor.allTransversals");
    setElementText(hypergraphStructureBtn, "hypergraphEditor.structure");
    setElementText(hypergraphCExactBtn, "hypergraphEditor.cExact");
    setElementText(hypergraphStructuralXtBtn, "hypergraphEditor.structuralXt");
    if (hypergraphAnalysisInfoBtn) {
      hypergraphAnalysisInfoBtn.title = t("hypergraphEditor.infoButtonTitle");
      hypergraphAnalysisInfoBtn.setAttribute("aria-label", t("hypergraphEditor.infoButtonTitle"));
    }
    renderHypergraphAnalysisInfo();
    setElementText(hypergraphXtrecBtn, "hypergraphEditor.xtrec");
    setElementText(hypergraphRExactBtn, "hypergraphEditor.rExact");
    setElementText(document.getElementById("hypergraph-rexact-r-label"), "hypergraphEditor.rExactLabel");
    translateDefaultText(hypergraphRExactSummary, "hypergraphEditor.rExactIdle");
    translateDefaultText(hypergraphStructureSummary, "hypergraphEditor.structureIdle");
    translateDefaultText(hypergraphCExactSummary, "hypergraphEditor.cExactIdle");
    translateDefaultText(hypergraphStructuralXtSummary, "hypergraphEditor.structuralXtIdle");
    if (hypergraphEditorAnalysis.rExact) {
      renderHypergraphRExactSummary(hypergraphEditorAnalysis.rExact);
    }
    if (hypergraphEditorAnalysis.structure) {
      renderHypergraphStructureSummary(hypergraphEditorAnalysis.structure);
    }
    if (hypergraphEditorAnalysis.cExact) {
      renderHypergraphCExactSummary(hypergraphEditorAnalysis.cExact);
    }
    if (hypergraphEditorAnalysis.structuralXt) {
      renderHypergraphStructuralXtSummary(hypergraphEditorAnalysis.structuralXt);
    }
    setElementText(document.getElementById("hypergraph-transversal-picker-label"), "hypergraphEditor.transversalPicker");
    translateDefaultText(hypergraphTransversalDetails, "hypergraphEditor.transversalHint");
    setElementText(hypergraphClearTransversalBtn, "hypergraphEditor.clearTransversal");
    if (hypergraphToggleReducedBtn) {
      hypergraphToggleReducedBtn.textContent = hypergraphShowReduced
        ? t("hypergraphEditor.showOriginal")
        : t("hypergraphEditor.showReduced");
    }
    translateDefaultText(pinvStatus, "status.pinvIdle");
    translateDefaultText(pinvOutput, "status.pinvOutputNone");
    translateDefaultText(pinvMatrixOutput, "status.pinvMatrixNone");
    translateDefaultText(selectionHypergraphStatus, "status.selectionIdle");
    translateDefaultText(selectionHypergraphOutput, "status.selectionOutputNone");
    translateDefaultText(manualHypergraphStatus, "status.manualHypergraphIdle");
    translateDefaultText(manualHypergraphOutput, "status.manualHypergraphOutputNone");
    translateDefaultText(hypergraphEditorPanelStatus, "hypergraphEditor.panelStatus");
    translateDefaultText(hypergraphEditorSummary, "hypergraphEditor.summaryNone");
    translateDefaultText(hypergraphEditorStatus, "status.hypergraphEditorIdle");
    translateDefaultText(hypergraphEditorOutput, "status.hypergraphEditorOutputNone");

    setLabelTextForControl(sfcProfileSelect, "sfc.profile");
    setSelectOptionText(sfcProfileSelect, "hybrid", "sfc.profile.hybrid");
    setSelectOptionText(sfcProfileSelect, "strict", "sfc.profile.strict");
    setLabelTextForControl(sfcSyncSelect, "sfc.sync");
    setSelectOptionText(sfcSyncSelect, "handshake", "sfc.sync.handshake");
    setSelectOptionText(sfcSyncSelect, "none", "sfc.sync.none");
    setLabelTextForControl(sfcSourceSelect, "sfc.source");
    setSelectOptionText(sfcSourceSelect, "recommended", "sfc.source.recommended");
    setSelectOptionText(sfcSourceSelect, "all-correct", "sfc.source.allCorrect");
    setLabelTextForControl(sfcIdeTargetSelect, "sfc.ideTarget");
    setSelectOptionText(sfcIdeTargetSelect, "codesys", "sfc.ideTarget.codesys");
    setSelectOptionText(sfcIdeTargetSelect, "tia", "sfc.ideTarget.tia");
    setLabelTextForControl(sfcTraceLengthInput, "sfc.traceLength");
    setLabelTextForControl(sfcMaxPlusDefaultDelayInput, "sfc.maxplus.defaultDelay");
    setLabelTextForControl(sfcMaxPlusDelayMapInput, "sfc.maxplus.delayMap");
    setLabelTextForControl(sfcMaxPlusSyncOverheadInput, "sfc.maxplus.syncOverhead");
    if (sfcMaxPlusDelayMapInput) {
      sfcMaxPlusDelayMapInput.placeholder = t("sfc.maxplus.delayMapPlaceholder");
    }
    if (sfcBuildBtn) {
      sfcBuildBtn.textContent = sfcIsRunning
        ? t("sfc.buildRunning")
        : t("sfc.build");
    }
    if (sfcValidateBtn) {
      sfcValidateBtn.textContent = sfcIsRunning
        ? t("sfc.validateRunning")
        : t("sfc.validate");
    }
    if (sfcMaxPlusRunBtn) {
      sfcMaxPlusRunBtn.textContent = sfcIsRunning
        ? t("sfc.maxplus.runRunning")
        : t("sfc.maxplus.run");
    }
    setElementText(sfcExportXmlBtn, "sfc.exportXml");
    setElementText(sfcExportStBtn, "sfc.exportSt");
    setElementText(sfcExportIdeBtn, "sfc.exportIde");
    translateDefaultText(sfcStatus, "status.sfcReady");
    translateDefaultText(sfcOutput, "status.sfcOutputNone");
    translateDefaultText(sfcValidationOutput, "status.sfcValidationNone");
    translateDefaultText(sfcMaxPlusOutput, "status.sfcMaxPlusNone");
    setElementText(document.getElementById("fuzzy-panel-hint"), "fuzzy.hint");
    setLabelTextForControl(fuzzySourceSelect, "fuzzy.source");
    setSelectOptionText(fuzzySourceSelect, "petri", "fuzzy.sourcePetri");
    setSelectOptionText(fuzzySourceSelect, "hypergraph", "fuzzy.sourceHypergraph");
    updateFuzzySourceNote();
    setElementText(document.getElementById("fuzzy-mapping-title"), "fuzzy.mappingTitle");
    setElementText(document.getElementById("fuzzy-mapping-hint"), "fuzzy.mappingHint");
    setElementText(fuzzyMappingRefreshBtn, "fuzzy.mappingRefresh");
    setElementText(fuzzyMappingAutoBtn, "fuzzy.mappingAuto");
    setElementText(fuzzyMappingClearBtn, "fuzzy.mappingClear");
    renderFuzzyHypergraphMappingPanel();
    setElementText(document.getElementById("fuzzy-alpha-label"), "fuzzy.alpha");
    setElementText(document.getElementById("fuzzy-alpha-step-label"), "fuzzy.alphaStep");
    setElementText(document.getElementById("fuzzy-default-delay-label"), "fuzzy.defaultDelay");
    setElementText(document.getElementById("fuzzy-delay-map-label"), "fuzzy.delayMap");
    setElementText(document.getElementById("fuzzy-sync-overhead-label"), "fuzzy.syncOverhead");
    setElementText(document.getElementById("fuzzy-membership-title"), "fuzzy.membershipTitle");
    setElementText(document.getElementById("fuzzy-mu-base-label"), "fuzzy.muBase");
    setElementText(document.getElementById("fuzzy-mu-concurrency-label"), "fuzzy.muConcurrency");
    setElementText(document.getElementById("fuzzy-mu-conflict-label"), "fuzzy.muConflict");
    setElementText(document.getElementById("fuzzy-mu-time-label"), "fuzzy.muTime");
    setElementText(document.getElementById("fuzzy-mu-coupling-label"), "fuzzy.muCoupling");
    setElementText(document.getElementById("fuzzy-mu-reconfiguration-label"), "fuzzy.muReconfiguration");
    setElementText(document.getElementById("fuzzy-max-size-label"), "fuzzy.maxSize");
    setElementText(document.getElementById("fuzzy-max-coupling-label"), "fuzzy.maxCoupling");
    setElementText(document.getElementById("fuzzy-lambda-limit-label"), "fuzzy.lambdaLimit");
    setElementText(document.getElementById("fuzzy-mpc-horizon-label"), "fuzzy.mpcHorizon");
    setElementText(document.getElementById("fuzzy-experiment-label-label"), "fuzzy.experimentLabel");
    if (fuzzyDelayMapInput) {
      fuzzyDelayMapInput.placeholder = t("fuzzy.delayMapPlaceholder");
    }
    if (fuzzyLambdaLimitInput) {
      fuzzyLambdaLimitInput.placeholder = t("fuzzy.lambdaLimitPlaceholder");
    }
    if (fuzzyExperimentLabelInput) {
      fuzzyExperimentLabelInput.placeholder = t("fuzzy.experimentLabelPlaceholder");
    }
    setElementText(fuzzyBuildBtn, "fuzzy.build");
    setElementText(fuzzyShowHypergraphSolutionBtn, "fuzzy.showHypergraphSolution");
    setElementText(fuzzyExportJsonBtn, "fuzzy.exportJson");
    setElementText(fuzzyExportCsvBtn, "fuzzy.exportCsv");
    setElementText(fuzzyExportAlphaCsvBtn, "fuzzy.exportAlphaCsv");
    setElementText(fuzzyExportMuCsvBtn, "fuzzy.exportMuCsv");
    setElementText(fuzzyExportLatexBtn, "fuzzy.exportLatex");
    setElementText(fuzzyExportReportBtn, "fuzzy.exportReport");
    setElementText(fuzzySaveRunBtn, "fuzzy.saveRun");
    setElementText(fuzzyRefreshRunsBtn, "fuzzy.refreshRuns");
    translateDefaultText(fuzzyRunsStatus, "status.fuzzyRunsReady");
    translateDefaultText(fuzzyRunsCompare, "status.fuzzyRunsNone");
    translateDefaultText(fuzzyStatus, "status.fuzzyReady");
    translateDefaultText(fuzzyPipelineOutput, "status.fuzzyPipelineNone");
    translateDefaultText(fuzzyMembershipOutput, "status.fuzzyMembershipNone");
    translateDefaultText(fuzzyRelationsOutput, "status.fuzzyRelationsNone");
    translateDefaultText(fuzzyMaxPlusOutput, "status.fuzzyMaxPlusNone");
    translateDefaultText(fuzzyRulesOutput, "status.fuzzyRulesNone");
    setElementText(document.getElementById("decomposition-view-mode-label"), "decomposition.viewMode");
    setSelectOptionText(decompositionViewModeSelect, "automata-transversal", "decomposition.view.transversal");
    setSelectOptionText(decompositionViewModeSelect, "automata-all", "decomposition.view.allCorrect");
    setSelectOptionText(decompositionViewModeSelect, "automata-pinv", "decomposition.view.allPinv");
    setSelectOptionText(decompositionViewModeSelect, "hypergraph-selection", "decomposition.view.hypergraphSelection");
    setSelectOptionText(decompositionViewModeSelect, "hypergraph-manual", "decomposition.view.hypergraphManual");
    setSelectOptionText(decompositionViewModeSelect, "sfc", "decomposition.view.sfc");
    setSelectOptionText(decompositionViewModeSelect, "maxplus", "decomposition.view.maxplus");
    setElementText(document.getElementById("decomposition-subnet-label"), "decomposition.subnet");
    setElementText(document.getElementById("decomposition-layout-label"), "decomposition.layout");
    setSelectOptionText(decompositionLayoutModeSelect, "source", "decomposition.layout.source");
    setSelectOptionText(decompositionLayoutModeSelect, "auto", "decomposition.layout.auto");
    translateDefaultText(decompositionStatus, "status.decompositionNone");
    translateDefaultText(decompositionDetails, "status.decompositionDetailsNone");

    translateDefaultText(analysisResult, "status.analysisIdle");

    setLabelTextForControl(layoutModeSelect, "io.layoutModeLabel");
    setSelectOptionText(layoutModeSelect, "smart", "layout.smart");
    setSelectOptionText(layoutModeSelect, "layered", "layout.layered");
    setSelectOptionText(layoutModeSelect, "radial", "layout.radial");
    setSelectOptionText(layoutModeSelect, "organic", "layout.organic");
    setSelectOptionText(layoutModeSelect, "coordinates", "layout.coordinates");
    setElementText(relayoutBtn, "io.relayout");
    setElementText(newNetBtn, "io.newNet");
    setElementText(saveJsonBtn, "io.saveJson");
    setElementText(loadJsonBtn, "io.loadJson");
    setElementText(loadPnhBtn, "io.loadPnh");
    setElementText(exportPnhBtn, "io.exportPnh");

    setLabelTextForControl(genPlaceCountInput, "gen.placeCount");
    setLabelTextForControl(genTransitionCountInput, "gen.transitionCount");
    setLabelTextForControl(genNetTypeSelect, "gen.netType");
    setSelectOptionText(genNetTypeSelect, "any", "gen.netType.any");
    setSelectOptionText(genNetTypeSelect, "mg", "gen.netType.mg");
    setSelectOptionText(genNetTypeSelect, "fc", "gen.netType.fc");
    setSelectOptionText(genNetTypeSelect, "efc", "gen.netType.efc");
    setSelectOptionText(genNetTypeSelect, "sm", "gen.netType.sm");
    setSelectOptionText(genNetTypeSelect, "pn", "gen.netType.pn");
    setLabelTextForControl(genMethodSelect, "gen.method");
    setSelectOptionText(genMethodSelect, "adaptive", "gen.method.adaptive");
    setSelectOptionText(genMethodSelect, "workflow", "gen.method.workflow");
    setSelectOptionText(genMethodSelect, "region", "gen.method.region");
    setSelectOptionText(genMethodSelect, "refinement", "gen.method.refinement");
    setLabelTextForControl(genLiveOptionSelect, "gen.live");
    setSelectOptionText(genLiveOptionSelect, "any", "gen.live.any");
    setSelectOptionText(genLiveOptionSelect, "yes", "gen.live.yes");
    setSelectOptionText(genLiveOptionSelect, "no", "gen.live.no");
    setLabelTextForControl(genSafeOptionSelect, "gen.safe");
    setSelectOptionText(genSafeOptionSelect, "any", "gen.safe.any");
    setSelectOptionText(genSafeOptionSelect, "yes", "gen.safe.yes");
    setSelectOptionText(genSafeOptionSelect, "no", "gen.safe.no");
    setLabelTextForControl(genRedundantCountInput, "gen.redundant");
    setElementText(document.getElementById("gen-xt-hypergraph-label"), "gen.xtHypergraph");
    setElementText(generateNetBtn, "gen.generate");
    translateDefaultText(generateStatus, "status.generatorReady");
    setElementText(document.getElementById("gen-search-summary"), "gen.searchSummary");
    setLabelTextForControl(genSearchMinPlaces, "gen.searchMinPlaces");
    setLabelTextForControl(genSearchMaxPlaces, "gen.searchMaxPlaces");
    setLabelTextForControl(genSearchMinTransitions, "gen.searchMinTransitions");
    setLabelTextForControl(genSearchMaxTransitions, "gen.searchMaxTransitions");
    setLabelTextForControl(genSearchTimeLimit, "gen.searchTimeLimit");
    setElementText(genSearchBtn, "gen.searchBtn");

    setLabelTextForControl(librarySelect, "lib.library");
    setLabelTextForControl(libraryFileSelect, "lib.file");
    if (libraryNameInput) {
      libraryNameInput.placeholder = t("lib.namePlaceholder");
    }
    if (libraryFileSelect) {
      libraryFileSelect.placeholder = t("lib.filePlaceholder");
    }
    setElementText(libraryAuthRequiredHint, "lib.manageHint");

    setElementText(document.getElementById("header-login-btn-label"), "header.login");
    setElementText(document.getElementById("header-logout-btn-label"), "header.logout");
    setElementText(document.getElementById("login-modal-title"), "login.title");
    setElementText(document.getElementById("login-modal-subtitle"), "login.subtitle");
    setElementText(document.getElementById("login-modal-username-label"), "login.username");
    setElementText(document.getElementById("login-modal-password-label"), "login.password");
    setElementText(loginModalSubmitBtn, "login.submit");
    setElementText(loginModalCancelBtn, "login.cancel");
    if (loginModalUsername) loginModalUsername.placeholder = t("login.usernamePlaceholder");
    if (loginModalPassword) loginModalPassword.placeholder = t("login.passwordPlaceholder");

    setElementText(document.getElementById("about-description-label"), "about.description.label");
    setElementText(document.getElementById("about-description-intro"), "about.description.intro");
    (function() {
      var listEl = document.getElementById("about-description-list");
      if (listEl) {
        var items = listEl.querySelectorAll("li");
        if (items[0]) items[0].textContent = t("about.description.item1");
        if (items[1]) items[1].textContent = t("about.description.item2");
        if (items[2]) items[2].textContent = t("about.description.item3");
      }
    })();
    setElementText(document.getElementById("about-tech-label"), "about.tech.label");
    setElementText(document.getElementById("about-tech-value"), "about.tech.value");
    setElementText(document.getElementById("about-license-label"), "about.license.label");
    setElementText(document.getElementById("about-license-value"), "about.license.value");
    setElementText(document.getElementById("about-disclaimer-label"), "about.disclaimer.label");
    setElementText(document.getElementById("about-disclaimer-value"), "about.disclaimer.value");

    setElementText(renameLibraryBtn, "lib.rename");
    setElementText(createLibraryBtn, "lib.new");
    setElementText(refreshLibraryBtn, "lib.refresh");
    setElementText(libraryUploadBtn, "lib.uploadFiles");
    setElementText(libraryUploadFolderBtn, "lib.uploadFolder");
    setElementText(loadLibraryFileBtn, "lib.loadSelected");
    translateDefaultText(libraryStatus, "status.libraryEmpty");
    updateLibraryAuthUi();

    setLabelTextForControl(benchmarkFilesSelect, "bench.files");
    setLabelTextForControl(benchmarkFileFilterInput, "bench.fileFilter");
    if (benchmarkFileFilterInput) {
      benchmarkFileFilterInput.placeholder = t("bench.fileFilterPlaceholder");
    }
    setLabelTextForControl(benchmarkFileLimitInput, "bench.fileLimit");
    setLabelTextForControl(benchmarkStrataTargetInput, "bench.strataTarget");
    setElementText(benchmarkApplyFilterBtn, "bench.applyFilter");
    setElementText(benchmarkSelectAllBtn, "bench.selectAll");
    setElementText(benchmarkClearSelectionBtn, "bench.clearSelection");
    setLabelTextForControl(benchmarkRepeatCountInput, "bench.repeatCount");
    setLabelTextForControl(benchmarkPinvModeSelect, "bench.pinvMode");
    setSelectOptionText(benchmarkPinvModeSelect, "cover-stop", "pinv.mode.coverStop");
    setSelectOptionText(benchmarkPinvModeSelect, "full", "pinv.mode.full");
    setLabelTextForControl(benchmarkXtrecAccelerationSelect, "bench.acceleration");
    setLabelTextForControl(benchmarkPinvAccelerationSelect, "bench.pinvAcceleration");
    setSelectOptionText(benchmarkPinvAccelerationSelect, "cpu", "bench.accel.cpu");
    setSelectOptionText(benchmarkPinvAccelerationSelect, "webgpu", "bench.accel.webgpu");
    setSelectOptionText(benchmarkPinvAccelerationSelect, "compare-cpu-webgpu", "bench.accel.compareCpuWebgpu");
    setSelectOptionText(benchmarkXtrecAccelerationSelect, "cpu", "bench.accel.cpu");
    setSelectOptionText(benchmarkXtrecAccelerationSelect, "webgpu", "bench.accel.webgpu");
    setSelectOptionText(benchmarkXtrecAccelerationSelect, "webgl", "bench.accel.webgl");
    setSelectOptionText(benchmarkXtrecAccelerationSelect, "compare-cpu-webgpu", "bench.accel.compareCpuWebgpu");
    setElementText(benchmarkProfileBtn, "bench.profile");
    setElementText(benchmarkSelectRepresentativeBtn, "bench.selectRepresentative");
    setElementText(benchmarkRunRepresentativeBtn, "bench.runRepresentative");
    setElementText(benchmarkExportProfileCsvBtn, "bench.exportProfileCsv");
    if (benchmarkRunBtn) {
      benchmarkRunBtn.textContent = benchmarkIsRunning ? t("bench.running") : t("bench.run");
    }
    setElementText(benchmarkCancelBtn, "bench.cancel");
    setElementText(benchmarkExportCsvBtn, "bench.exportCsv");
    setElementText(benchmarkExportLatexBtn, "bench.exportLatex");
    setElementText(document.getElementById("benchmark-hint"), "bench.hint");
    translateDefaultText(benchmarkStatus, "status.benchReady");
    translateDefaultText(benchmarkCurrent, "status.benchCurrentIdle");
    translateDefaultText(benchmarkResults, "status.benchNoResults");
    translateDefaultText(benchmarkLatexOutput, "status.benchLatexNone");

    setLabelTextForControl(metadataFilterInput, "meta.filter");
    if (metadataFilterInput) {
      metadataFilterInput.placeholder = t("meta.placeholder");
    }
    translateDefaultText(metadataList, "status.metaNone");
    translateDefaultText(classificationList, "status.classNone");
    setElementText(document.getElementById("author-card-title"), "author.cardTitle");
    setElementText(document.getElementById("author-card-subtitle"), "author.cardSubtitle");
    setElementText(document.getElementById("author-name-label"), "author.name");
    setElementText(document.getElementById("author-degree-label"), "author.degree");
    setElementText(document.getElementById("author-emails-label"), "author.emails");
    setElementText(document.getElementById("author-unit-label"), "author.unit");
    setElementText(document.getElementById("author-role-label"), "author.role");
    setElementText(document.getElementById("author-research-area-label"), "author.researchArea");
    setElementText(document.getElementById("author-profiles-label"), "author.profiles");
    setElementText(document.getElementById("author-metrics-label"), "author.metrics");
    translateDefaultText(authorsEmpty, "author.empty");
    renderAuthorsPanel();

    setElementText(document.getElementById("inspector-title"), "inspector.title");
    setElementText(inspectorEmpty, activeWorkspaceTab === "hypergraph" ? "inspector.hypergraphTools" : "inspector.empty");
    setLabelTextForControl(nodeLabelInput, "inspector.nodeLabel");
    setLabelTextForControl(nodeTokensInput, "inspector.tokens");
    setElementText(rotate45Btn, "inspector.rotate45");
    setElementText(rotate90Btn, "inspector.rotate90");
    setElementText(rotateResetBtn, "inspector.rotateReset");
    setLabelTextForControl(arcWeightInput, "inspector.arcWeight");
    setElementText(arcClearBendsBtn, "inspector.clearArcBends");
    setElementText(document.getElementById("arc-bend-hint"), "inspector.arcHint");
    setElementText(deleteBtn, "inspector.delete");

    if (zoomOutBtn) {
      zoomOutBtn.title = t("zoom.outTitle");
    }
    if (zoomInBtn) {
      zoomInBtn.title = t("zoom.inTitle");
    }
    if (zoomResetBtn) {
      zoomResetBtn.title = t("zoom.resetTitle");
    }
    if (panLeftBtn) panLeftBtn.title = t("pan.leftTitle");
    if (panRightBtn) panRightBtn.title = t("pan.rightTitle");
    if (panUpBtn) panUpBtn.title = t("pan.upTitle");
    if (panDownBtn) panDownBtn.title = t("pan.downTitle");
    if (centerNetBtn) centerNetBtn.title = t("pan.centerTitle");

    setElementText(computeModalTitle, "modal.title");
    setElementText(computeModalMessage, "modal.message");
    setElementText(computeModalCancelBtn, "modal.cancel");

    if (languageSelect) {
      setSelectOptionText(languageSelect, "pl", "language.pl");
      setSelectOptionText(languageSelect, "en", "language.en");
      languageSelect.setAttribute("aria-label", t("header.language"));
    }

    setLayoutMode(state.settings.layoutMode);
    const activeSidebarButton = sidebarTabButtons.find((button) => button.classList.contains("active"));
    updateWorkspaceToolsTitle(activeSidebarButton ? String(activeSidebarButton.dataset.sidebarTab || "edit") : "edit");
    updateEnabledTransitionsLabel(getEnabledTransitions());
    syncDecompositionSubnetOptions();
    if (activeWorkspaceTab === "decomposition") {
      refreshDecompositionView();
    }
  }

  function setLanguage(languageCode, persist, rerender) {
    const next = normalizeLanguage(languageCode);
    state.settings.language = next;
    if (i18n && typeof i18n.setLanguage === "function") {
      i18n.setLanguage(next);
    }
    if (languageSelect && languageSelect.value !== next) {
      languageSelect.value = next;
    }
    const flagEl = document.getElementById("language-current-flag");
    if (flagEl) {
      flagEl.textContent = next === "pl" ? "🇵🇱" : "🇬🇧";
    }
    if (persist !== false) {
      localStorage.setItem(LANGUAGE_KEY, next);
      document.cookie = `pooh_language=${encodeURIComponent(next)}; Path=/; Max-Age=31536000; SameSite=Strict`;
    }
    applyTranslations();
    if (state.docs && state.docs.data && typeof renderDocsView === "function") {
      renderDocsView();
    }
    if (state.researchRuns && Array.isArray(state.researchRuns.items)) {
      renderResearchRuns();
    }
    if (rerender !== false) {
      render();
    }
  }

  function mountSidebarPanelsInWorkspace() {
    if (!workspaceToolsContent) {
      return;
    }
    const panelsContainer = document.querySelector(".sidebar-panels");
    if (!panelsContainer) {
      return;
    }
    if (panelsContainer.parentElement === workspaceToolsContent) {
      return;
    }
    workspaceToolsContent.appendChild(panelsContainer);
  }

  function getSidebarTabLabel(tabName) {
    const button = sidebarTabButtons.find((item) => String(item.dataset.sidebarTab || "") === tabName);
    if (!button) {
      return t("workspace.toolsTab");
    }
    const textEl = button.querySelector(".sidebar-tab-text");
    const label = textEl ? String(textEl.textContent || "").trim() : "";
    return label || t("workspace.toolsTab");
  }

  function updateWorkspaceToolsTitle(tabName) {
    if (!workspaceToolsTitle) {
      return;
    }
    const label = getSidebarTabLabel(tabName);
    workspaceToolsTitle.textContent = `${t("workspace.toolsPrefix")}: ${label}`;
  }

  function setTheme(themeName) {
    const theme = themeName === "dark" ? "dark" : "light";
    document.body.dataset.theme = theme;
    if (themeToggle) {
      themeToggle.checked = theme === "dark";
    }
    localStorage.setItem(THEME_KEY, theme);
  }

  function initTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme === "dark" || savedTheme === "light") {
      setTheme(savedTheme);
      return;
    }
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(prefersDark ? "dark" : "light");
  }

  function setLayoutMode(modeName) {
    const knownModes = new Set(["smart", "layered", "radial", "organic", "coordinates"]);
    const next = knownModes.has(modeName) ? modeName : DEFAULT_LAYOUT_MODE;
    state.settings.layoutMode = next;
    if (layoutModeSelect && layoutModeSelect.value !== next) {
      layoutModeSelect.value = next;
    }

    const labels = {
      smart: t("layout.smart"),
      layered: t("layout.layered"),
      radial: t("layout.radial"),
      organic: t("layout.organic"),
      coordinates: t("layout.coordinates")
    };
    if (layoutBadge) {
      layoutBadge.textContent = `${t("workspace.modePrefix")}: ${labels[next] || next}`;
    }
  }

  function setMode(nextMode) {
    mode = nextMode;
    arcSourceNodeId = null;
    dragInfo = null;
    multiDragInfo = null;
    arcPointDragInfo = null;
    if (mode !== "select") {
      selectedNodeIds.clear();
      clearSelectedArcPoint();
    }
    modeButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.mode === nextMode);
    });
    if (svg && svg.classList) {
      ["select", "place", "transition", "arc"].forEach(function(name) {
        svg.classList.toggle("mode-" + name, mode === name);
      });
    }
  }

  function setActiveSidebarTab(tabName, persist, openWorkspaceTab) {
    if (sidebarTabButtons.length === 0 || sidebarTabPanels.length === 0) {
      return;
    }

    const availableTabs = sidebarTabPanels
      .map((panel) => String(panel.dataset.sidebarPanel || "").trim())
      .filter(Boolean);
    if (availableTabs.length === 0) {
      return;
    }

    const requested = String(tabName || "").trim();
    const nextTab = availableTabs.includes(requested) ? requested : availableTabs[0];

    sidebarTabButtons.forEach((button) => {
      const isActive = String(button.dataset.sidebarTab || "") === nextTab;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    sidebarTabPanels.forEach((panel) => {
      const isActive = String(panel.dataset.sidebarPanel || "") === nextTab;
      panel.classList.toggle("active", isActive);
      panel.classList.toggle("hidden", !isActive);
    });
    updateWorkspaceToolsTitle(nextTab);

    if (openWorkspaceTab !== false) {
      setActiveWorkspaceTab(nextTab === "draw" ? "hypergraph" : "tools");
    }

    if (persist !== false) {
      localStorage.setItem(SIDEBAR_TAB_KEY, nextTab);
    }
  }

  function setLibraryStatus(message, isError) {
    if (!libraryStatus) {
      return;
    }
    libraryStatus.textContent = message;
    libraryStatus.style.color = isError ? "var(--danger)" : "";
  }

  function normalizeAuthUser(user) {
    if (!user || typeof user !== "object") {
      return null;
    }
    const username = String(user.username || "").trim();
    const displayName = String(user.displayName || "").trim();
    const role = String(user.role || "").trim();
    if (!username && !displayName) {
      return null;
    }
    return {
      username,
      displayName: displayName || username,
      role
    };
  }

  function isLibraryAuthenticated() {
    return Boolean(state.auth && state.auth.loggedIn);
  }

  function setLibraryAuthSession(loggedIn, user) {
    const enabled = Boolean(loggedIn);
    state.auth.loggedIn = enabled;
    state.auth.user = enabled ? normalizeAuthUser(user) : null;
    if (!enabled) {
      state.auth.user = null;
    }
    updateLibraryAuthUi();
    if (typeof updateDocsAdminVisibility === "function") {
      updateDocsAdminVisibility();
    }
  }

  function updateLibraryAuthUi() {
    const loggedIn = isLibraryAuthenticated();
    const currentUser = state.auth.user;

    if (headerAuthLoggedOut) {
      headerAuthLoggedOut.classList.toggle("hidden", loggedIn);
    }
    if (headerAuthLoggedIn) {
      headerAuthLoggedIn.classList.toggle("hidden", !loggedIn);
    }
    if (headerAuthUserInfo && loggedIn && currentUser) {
      const roleSuffix = currentUser.role ? ` (${currentUser.role})` : "";
      headerAuthUserInfo.textContent = `${t("header.loggedInAs")} ${currentUser.displayName}${roleSuffix}`;
    }

    if (libraryAuthRequiredHint) {
      libraryAuthRequiredHint.classList.toggle("hidden", loggedIn);
    }
    if (authorMetricsRefreshBtn) {
      authorMetricsRefreshBtn.classList.toggle("hidden", !loggedIn);
    }
    if (authorMetricsEditBtn) {
      authorMetricsEditBtn.classList.toggle("hidden", !loggedIn);
    }
    if (libraryManageArea) {
      libraryManageArea.classList.toggle("is-locked", !loggedIn);
    }
    if (libraryProtectedArea) {
      libraryProtectedArea.classList.remove("is-locked");
    }

    const managementTargets = [
      libraryNameInput,
      createLibraryBtn,
      renameLibraryBtn,
      libraryUploadBtn,
      libraryUploadInput,
      libraryUploadFolderBtn,
      libraryUploadFolderInput
    ];
    managementTargets.forEach((element) => {
      if (!element) {
        return;
      }
      element.disabled = !loggedIn;
    });

    if (refreshLibraryBtn) {
      refreshLibraryBtn.disabled = false;
    }
    if (librarySelect && state.library.libraries.length === 0) {
      librarySelect.disabled = true;
    } else if (librarySelect) {
      librarySelect.disabled = false;
    }
    if (libraryFileSelect && state.library.files.length === 0) {
      libraryFileSelect.disabled = true;
    } else if (libraryFileSelect) {
      libraryFileSelect.disabled = false;
    }
    if (loadLibraryFileBtn && libraryFileSelect) {
      loadLibraryFileBtn.disabled = libraryFileSelect.disabled;
    }
  }

  function clearLibraryState() {
    state.library.selectedId = null;
    state.library.libraries = [];
    state.library.files = [];
    renderLibrarySelect();
    renderLibraryFiles("");
    updateLibraryAuthUi();
  }

  function setGenerateStatus(message, isError) {
    if (!generateStatus) {
      return;
    }
    generateStatus.textContent = message;
    generateStatus.style.color = isError ? "var(--danger)" : "";
  }

  function setBenchmarkStatus(message, isError) {
    if (!benchmarkStatus) {
      return;
    }
    benchmarkStatus.textContent = message || "";
    benchmarkStatus.style.color = isError ? "var(--danger)" : "";
  }

  function setBenchmarkCurrent(message) {
    if (!benchmarkCurrent) {
      return;
    }
    benchmarkCurrent.textContent = message || "";
  }

  function setBenchmarkLatexOutput(text) {
    if (!benchmarkLatexOutput) {
      return;
    }
    benchmarkLatexOutput.textContent = text && String(text).trim()
      ? String(text)
      : t("status.benchLatexNone");
  }

  function hasBenchmarkResultsForWorkspaceTab() {
    if (benchmarkIsRunning) {
      return true;
    }
    if (benchmarkProfileRecords.length > 0) {
      return true;
    }
    return benchmarkRecords.some((record) =>
      Array.isArray(record && record.runs) && record.runs.length > 0
    );
  }

  function syncInspectorToolMode() {
    const isHypergraphTab = activeWorkspaceTab === "hypergraph";
    if (petriInspectorTools) {
      petriInspectorTools.classList.toggle("hidden", isHypergraphTab);
    }
    if (hypergraphInspectorTools) {
      hypergraphInspectorTools.classList.toggle("hidden", !isHypergraphTab);
    }
  }

  function setActiveWorkspaceTab(tabName) {
    const prevTab = activeWorkspaceTab;
    const requested = (
      tabName === "benchmark"
      || tabName === "hypergraph"
      || tabName === "tools"
      || tabName === "decomposition"
    ) ? tabName : "canvas";
    const toolsTabVisible = Boolean(workspaceTabTools && !workspaceTabTools.classList.contains("hidden"));
    const decompositionTabVisible = Boolean(workspaceTabDecomposition && !workspaceTabDecomposition.classList.contains("hidden"));
    const benchmarkTabVisible = Boolean(workspaceTabBenchmark && !workspaceTabBenchmark.classList.contains("hidden"));
    let nextTab = requested;
    if (nextTab === "benchmark" && !benchmarkTabVisible) {
      nextTab = toolsTabVisible ? "tools" : "canvas";
    }
    if (nextTab === "decomposition" && !decompositionTabVisible) {
      nextTab = toolsTabVisible ? "tools" : "canvas";
    }
    if (nextTab === "tools" && !toolsTabVisible) {
      nextTab = "canvas";
    }
    activeWorkspaceTab = nextTab;

    if (workspaceTabCanvas) {
      const isActive = nextTab === "canvas";
      workspaceTabCanvas.classList.toggle("active", isActive);
      workspaceTabCanvas.setAttribute("aria-selected", isActive ? "true" : "false");
    }
    if (workspaceTabHypergraph) {
      const isActive = nextTab === "hypergraph";
      workspaceTabHypergraph.classList.toggle("active", isActive);
      workspaceTabHypergraph.setAttribute("aria-selected", isActive ? "true" : "false");
    }
    if (workspaceTabTools) {
      const isActive = nextTab === "tools";
      workspaceTabTools.classList.toggle("active", isActive);
      workspaceTabTools.setAttribute("aria-selected", isActive ? "true" : "false");
    }
    if (workspaceTabDecomposition) {
      const isActive = nextTab === "decomposition";
      workspaceTabDecomposition.classList.toggle("active", isActive);
      workspaceTabDecomposition.setAttribute("aria-selected", isActive ? "true" : "false");
    }
    if (workspaceTabBenchmark) {
      const isActive = nextTab === "benchmark";
      workspaceTabBenchmark.classList.toggle("active", isActive);
      workspaceTabBenchmark.setAttribute("aria-selected", isActive ? "true" : "false");
    }
    if (workspaceCanvasPanel) {
      workspaceCanvasPanel.classList.toggle("active", nextTab === "canvas");
      workspaceCanvasPanel.classList.toggle("hidden", nextTab !== "canvas");
    }
    if (workspaceHypergraphPanel) {
      workspaceHypergraphPanel.classList.toggle("active", nextTab === "hypergraph");
      workspaceHypergraphPanel.classList.toggle("hidden", nextTab !== "hypergraph");
    }
    if (workspaceToolsPanel) {
      workspaceToolsPanel.classList.toggle("active", nextTab === "tools");
      workspaceToolsPanel.classList.toggle("hidden", nextTab !== "tools");
    }
    if (workspaceDecompositionPanel) {
      workspaceDecompositionPanel.classList.toggle("active", nextTab === "decomposition");
      workspaceDecompositionPanel.classList.toggle("hidden", nextTab !== "decomposition");
    }
    if (workspaceBenchmarkPanel) {
      workspaceBenchmarkPanel.classList.toggle("active", nextTab === "benchmark");
      workspaceBenchmarkPanel.classList.toggle("hidden", nextTab !== "benchmark");
    }
    syncInspectorToolMode();
    updateInspector();

    if (nextTab === "canvas" && prevTab !== "canvas") {
      render();
    } else if (nextTab === "hypergraph" && prevTab !== "hypergraph") {
      renderHypergraphEditor();
    } else if (nextTab === "decomposition" && prevTab !== "decomposition") {
      refreshDecompositionView();
    }
  }

  function updateWorkspaceTabs() {
    const showToolsTab = Boolean(workspaceTabTools && workspaceToolsContent && workspaceToolsContent.childElementCount > 0);
    if (workspaceTabTools) {
      workspaceTabTools.classList.toggle("hidden", !showToolsTab);
    }
    const showBenchmarkTab = hasBenchmarkResultsForWorkspaceTab();
    if (workspaceTabBenchmark) {
      workspaceTabBenchmark.classList.toggle("hidden", !showBenchmarkTab);
    }
    if (!showToolsTab && activeWorkspaceTab === "tools") {
      setActiveWorkspaceTab("canvas");
      return;
    }
    if (workspaceTabDecomposition && activeWorkspaceTab === "decomposition" && workspaceTabDecomposition.classList.contains("hidden")) {
      setActiveWorkspaceTab(showToolsTab ? "tools" : "canvas");
      return;
    }
    if (!showBenchmarkTab && activeWorkspaceTab === "benchmark") {
      setActiveWorkspaceTab(showToolsTab ? "tools" : "canvas");
      return;
    }
    setActiveWorkspaceTab(activeWorkspaceTab);
  }

  function setBenchmarkRunning(isRunning) {
    benchmarkIsRunning = Boolean(isRunning);
    if (benchmarkRunBtn) {
      benchmarkRunBtn.disabled = benchmarkIsRunning;
      benchmarkRunBtn.textContent = benchmarkIsRunning ? t("bench.running") : t("bench.run");
    }
    if (benchmarkCancelBtn) {
      benchmarkCancelBtn.disabled = !benchmarkIsRunning;
    }
    if (benchmarkExportCsvBtn) {
      benchmarkExportCsvBtn.disabled = benchmarkIsRunning || benchmarkRecords.length === 0;
    }
    if (benchmarkExportLatexBtn) {
      benchmarkExportLatexBtn.disabled = benchmarkIsRunning || benchmarkRecords.length === 0;
    }
    if (benchmarkExportProfileCsvBtn) {
      benchmarkExportProfileCsvBtn.disabled = benchmarkIsRunning || benchmarkProfileRecords.length === 0;
    }
    if (benchmarkProfileBtn) {
      benchmarkProfileBtn.disabled = benchmarkIsRunning;
    }
    if (benchmarkSelectRepresentativeBtn) {
      benchmarkSelectRepresentativeBtn.disabled = benchmarkIsRunning || benchmarkProfileRecords.length === 0;
    }
    if (benchmarkRunRepresentativeBtn) {
      benchmarkRunRepresentativeBtn.disabled = benchmarkIsRunning || benchmarkProfileRecords.length === 0;
    }
    if (benchmarkApplyFilterBtn) {
      benchmarkApplyFilterBtn.disabled = benchmarkIsRunning;
    }
    if (benchmarkFileFilterInput) {
      benchmarkFileFilterInput.disabled = benchmarkIsRunning;
    }
    if (benchmarkFileLimitInput) {
      benchmarkFileLimitInput.disabled = benchmarkIsRunning;
    }
    if (benchmarkStrataTargetInput) {
      benchmarkStrataTargetInput.disabled = benchmarkIsRunning;
    }
    if (benchmarkXtrecAccelerationSelect) {
      benchmarkXtrecAccelerationSelect.disabled = benchmarkIsRunning;
    }
    if (benchmarkPinvAccelerationSelect) {
      benchmarkPinvAccelerationSelect.disabled = benchmarkIsRunning;
    }
    if (benchmarkPinvModeSelect) {
      benchmarkPinvModeSelect.disabled = benchmarkIsRunning;
    }
    if (benchmarkFilesSelect) {
      benchmarkFilesSelect.disabled = benchmarkIsRunning || benchmarkFilesSelect.options.length === 0;
    }
    updateWorkspaceTabs();
  }

  function parseJsonFromStorage(key) {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return {};
    }
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return {};
      }
      return parsed;
    } catch (error) {
      return {};
    }
  }

  function setRememberedLibraryFileName(libraryId, fileName) {
    const id = String(libraryId || "").trim();
    if (!id) {
      return;
    }
    const nextFile = String(fileName || "").trim();
    const map = parseJsonFromStorage(LIBRARY_FILE_STORAGE_KEY);
    if (!nextFile) {
      delete map[id];
    } else {
      map[id] = nextFile;
    }
    localStorage.setItem(LIBRARY_FILE_STORAGE_KEY, JSON.stringify(map));
  }

  function getRememberedLibraryFileName(libraryId) {
    const id = String(libraryId || "").trim();
    if (!id) {
      return "";
    }
    const map = parseJsonFromStorage(LIBRARY_FILE_STORAGE_KEY);
    const remembered = map[id];
    return remembered ? String(remembered).trim() : "";
  }

  function isComputationDialogOpen() {
    return Boolean(activeComputation);
  }

  function showComputationDialog(taskType, title, message, cancelable) {
    if (!computeModal) {
      return;
    }
    activeComputation = {
      type: String(taskType || ""),
      cancelable: cancelable !== false
    };
    if (computeModalTitle) {
      computeModalTitle.textContent = title || t("modal.title");
    }
    if (computeModalMessage) {
      computeModalMessage.textContent = message || t("app.common.processing");
    }
    if (computeModalCancelBtn) {
      computeModalCancelBtn.classList.toggle("hidden", !activeComputation.cancelable);
      computeModalCancelBtn.disabled = !activeComputation.cancelable;
    }
    computeModal.classList.add("is-open");
    computeModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  }

  function updateComputationDialog(message) {
    if (!computeModal || !isComputationDialogOpen()) {
      return;
    }
    if (computeModalMessage) {
      computeModalMessage.textContent = String(message || t("app.common.processing"));
    }
  }

  function hideComputationDialog() {
    activeComputation = null;
    if (!computeModal) {
      return;
    }
    computeModal.classList.remove("is-open");
    computeModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  function getSelectedLibrary() {
    if (!state.library.selectedId) {
      return null;
    }
    return state.library.libraries.find((item) => item.id === state.library.selectedId) || null;
  }

  function findLibraryFileByName(fileName) {
    const expected = String(fileName || "").trim();
    if (!expected) {
      return null;
    }
    const files = Array.isArray(state.library.files) ? state.library.files : [];
    return files.find((item) => String(item && item.name ? item.name : "") === expected) || null;
  }

  function resolveLibraryFileName(query) {
    const raw = String(query || "").trim();
    if (!raw) {
      return "";
    }
    const files = (Array.isArray(state.library.files) ? state.library.files : [])
      .map((item) => String(item && item.name ? item.name : ""))
      .filter(Boolean);
    if (files.length === 0) {
      return "";
    }

    const exact = files.find((name) => name === raw);
    if (exact) {
      return exact;
    }

    const normalizedRaw = raw.toLocaleLowerCase("pl");
    const caseInsensitive = files.find((name) => name.toLocaleLowerCase("pl") === normalizedRaw);
    if (caseInsensitive) {
      return caseInsensitive;
    }

    const startsWithMatches = files.filter((name) => name.toLocaleLowerCase("pl").startsWith(normalizedRaw));
    if (startsWithMatches.length === 1) {
      return startsWithMatches[0];
    }

    const containsMatches = files.filter((name) => name.toLocaleLowerCase("pl").includes(normalizedRaw));
    if (containsMatches.length === 1) {
      return containsMatches[0];
    }

    return "";
  }

  function getSelectedLibraryFileName() {
    if (!libraryFileSelect || libraryFileSelect.disabled) {
      return "";
    }
    const raw = String(libraryFileSelect.value || "").trim();
    if (!raw) {
      return "";
    }
    return resolveLibraryFileName(raw) || raw;
  }

  function getPreferredLibraryFileName(selectedLibrary, explicitFileName) {
    const explicit = String(explicitFileName || "").trim();
    if (explicit) {
      return explicit;
    }
    if (!selectedLibrary || !selectedLibrary.id) {
      return "";
    }
    const remembered = getRememberedLibraryFileName(selectedLibrary.id);
    if (remembered) {
      return remembered;
    }
    const fromMetadata = getMetadataValue(state.metadata, "LibraryFile");
    if (!fromMetadata) {
      return "";
    }
    const metadataLibrary = getMetadataValue(state.metadata, "Library");
    if (metadataLibrary && metadataLibrary !== selectedLibrary.name) {
      return "";
    }
    return fromMetadata;
  }

  async function callLibraryApi(action, options) {
    const opts = options || {};
    const query = opts.query || {};
    const url = new URL("library_api.php", window.location.href);
    url.searchParams.set("action", action);
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        return;
      }
      url.searchParams.set(key, String(value));
    });

    const method = opts.method || "GET";
    const fetchOptions = {
      method,
      cache: "no-store",
      credentials: "same-origin",
      headers: {
        "X-POOH-Language": normalizeLanguage(state.settings.language)
      }
    };

    if (opts.body instanceof FormData) {
      if (csrfToken && method !== "GET") {
        opts.body.append("csrf_token", csrfToken);
      }
      fetchOptions.body = opts.body;
    } else if (opts.body && method !== "GET") {
      const bodyWithCsrf = Object.assign({}, opts.body);
      if (csrfToken) {
        bodyWithCsrf.csrf_token = csrfToken;
      }
      fetchOptions.body = new URLSearchParams(bodyWithCsrf);
      fetchOptions.headers["Content-Type"] = "application/x-www-form-urlencoded;charset=UTF-8";
    } else if (method !== "GET" && csrfToken) {
      fetchOptions.body = new URLSearchParams({ csrf_token: csrfToken });
      fetchOptions.headers["Content-Type"] = "application/x-www-form-urlencoded;charset=UTF-8";
    }

    const response = await fetch(url.toString(), fetchOptions);
    const text = await response.text();
    let payload = null;
    try {
      payload = JSON.parse(text);
    } catch (error) {
      throw new Error(t("app.api.invalidResponse", { status: response.status }));
    }
    if (payload && payload.csrfToken) {
      csrfToken = payload.csrfToken;
    }
    if (payload && Object.prototype.hasOwnProperty.call(payload, "loggedIn")) {
      setLibraryAuthSession(Boolean(payload.loggedIn), payload.user || null);
    } else if (response.status === 401) {
      setLibraryAuthSession(false, null);
    }
    if (!response.ok || !payload || payload.ok !== true) {
      throw new Error((payload && payload.error) ? payload.error : t("app.api.libraryOperationFailed"));
    }
    return payload;
  }

  function renderLibrarySelect() {
    if (!librarySelect || !libraryNameInput) {
      return;
    }
    librarySelect.innerHTML = "";
    const options = (state.library.libraries || [])
      .slice()
      .sort((a, b) =>
        String((a && a.name) || "").localeCompare(
          String((b && b.name) || ""),
          "pl",
          { numeric: true, sensitivity: "base" }
        )
      );
    if (!Array.isArray(options) || options.length === 0) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = t("lib.noneLibraries");
      librarySelect.appendChild(option);
      librarySelect.disabled = true;
      libraryNameInput.value = "";
      updateLibraryAuthUi();
      return;
    }

    librarySelect.disabled = false;
    options.forEach((item) => {
      const option = document.createElement("option");
      option.value = item.id;
      option.textContent = `${item.name} (${item.filesCount || 0})`;
      librarySelect.appendChild(option);
    });

    if (!options.some((item) => item.id === state.library.selectedId)) {
      state.library.selectedId = options[0].id;
    }
    librarySelect.value = state.library.selectedId;
    const selectedLibrary = getSelectedLibrary();
    libraryNameInput.value = selectedLibrary ? selectedLibrary.name : "";
    localStorage.setItem(LIBRARY_STORAGE_KEY, state.library.selectedId || "");
    updateLibraryAuthUi();
  }

  function renderLibraryFiles(preferredFileName) {
    if (!libraryFileSelect) {
      return;
    }
    if (libraryFileOptions) {
      libraryFileOptions.innerHTML = "";
    }
    const files = (state.library.files || [])
      .slice()
      .sort((a, b) =>
        String((a && a.name) || "").localeCompare(
          String((b && b.name) || ""),
          "pl",
          { numeric: true, sensitivity: "base" }
        )
      );
    if (files.length === 0) {
      libraryFileSelect.value = "";
      libraryFileSelect.disabled = true;
      renderBenchmarkFileOptions();
      updateLibraryAuthUi();
      return;
    }

    libraryFileSelect.disabled = false;
    files.forEach((fileItem) => {
      if (libraryFileOptions) {
        const option = document.createElement("option");
        option.value = fileItem.name;
        libraryFileOptions.appendChild(option);
      }
    });

    const preferred = String(preferredFileName || "").trim();
    const hasPreferred = preferred && files.some((item) => item.name === preferred);
    let nextValue = hasPreferred ? preferred : "";
    if (!nextValue) {
      const resolvedCurrent = resolveLibraryFileName(String(libraryFileSelect.value || ""));
      if (resolvedCurrent && files.some((item) => item.name === resolvedCurrent)) {
        nextValue = resolvedCurrent;
      } else {
        nextValue = files[0].name;
      }
    }
    libraryFileSelect.value = nextValue;
    const selectedLibrary = getSelectedLibrary();
    if (selectedLibrary && selectedLibrary.id) {
      setRememberedLibraryFileName(selectedLibrary.id, libraryFileSelect.value || "");
    }
    renderBenchmarkFileOptions();
    updateLibraryAuthUi();
  }

  function assertLibraryAuthenticated() {
    if (!isLibraryAuthenticated()) {
      throw new Error(t("lib.authRequired"));
    }
  }

  async function refreshLibraryAuthStatus() {
    const payload = await callLibraryApi("auth_status");
    setLibraryAuthSession(Boolean(payload.loggedIn), payload.user || null);
  }

  let turnstileWidgetId = null;
  const turnstileEnabled = document.body.dataset.turnstileEnabled === "1";
  const turnstileSiteKey = document.body.dataset.turnstileSitekey || "";

  function openLoginModal() {
    if (!loginModal) return;
    if (loginModalUsername) loginModalUsername.value = "";
    if (loginModalPassword) loginModalPassword.value = "";
    if (loginModalError) { loginModalError.textContent = ""; loginModalError.classList.add("hidden"); }
    if (loginModalSubmitBtn) loginModalSubmitBtn.disabled = false;

    loginModal.classList.add("is-open");
    loginModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");

    if (turnstileEnabled && turnstileSiteKey && loginModalTurnstileContainer) {
      loginModalTurnstileContainer.innerHTML = "";
      const waitForTurnstile = () => {
        if (typeof window.turnstile !== "undefined") {
          turnstileWidgetId = window.turnstile.render(loginModalTurnstileContainer, {
            sitekey: turnstileSiteKey,
            theme: document.body.dataset.theme === "dark" ? "dark" : "light",
            callback: function () {}
          });
        } else {
          setTimeout(waitForTurnstile, 200);
        }
      };
      waitForTurnstile();
    }

    setTimeout(() => { if (loginModalUsername) loginModalUsername.focus(); }, 100);
  }

  function closeLoginModal() {
    if (!loginModal) return;
    loginModal.classList.remove("is-open");
    loginModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");

    if (turnstileWidgetId !== null && typeof window.turnstile !== "undefined") {
      try { window.turnstile.remove(turnstileWidgetId); } catch (e) {}
      turnstileWidgetId = null;
    }
    if (loginModalTurnstileContainer) loginModalTurnstileContainer.innerHTML = "";
  }

  function openAboutModal() {
    if (!aboutModal) return;
    aboutModal.classList.add("is-open");
    aboutModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  }

  function closeAboutModal() {
    if (!aboutModal) return;
    aboutModal.classList.remove("is-open");
    aboutModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  function showLoginError(msg) {
    if (!loginModalError) return;
    loginModalError.textContent = msg;
    loginModalError.classList.remove("hidden");
  }

  async function submitLoginModal() {
    const username = loginModalUsername ? String(loginModalUsername.value || "").trim() : "";
    const password = loginModalPassword ? String(loginModalPassword.value || "") : "";
    if (!username || !password) {
      showLoginError(t("login.credentialsRequired"));
      return;
    }

    let cfToken = "";
    if (turnstileEnabled && turnstileSiteKey) {
      if (typeof window.turnstile !== "undefined" && turnstileWidgetId !== null) {
        cfToken = window.turnstile.getResponse(turnstileWidgetId) || "";
      }
      if (!cfToken) {
        showLoginError(t("login.captchaRequired"));
        return;
      }
    }

    if (loginModalSubmitBtn) loginModalSubmitBtn.disabled = true;
    if (loginModalError) loginModalError.classList.add("hidden");

    try {
      const bodyData = { username, password };
      if (cfToken) bodyData["cf-turnstile-response"] = cfToken;

      const payload = await callLibraryApi("login", {
        method: "POST",
        body: bodyData
      });
      setLibraryAuthSession(Boolean(payload.loggedIn), payload.user || null);
      closeLoginModal();
      await ensureDefaultLibrary();
      setLibraryStatus(t("status.libraryLoggedIn"), false);
    } catch (error) {
      const message = error instanceof Error ? error.message : t("login.error");
      showLoginError(message);
      if (turnstileWidgetId !== null && typeof window.turnstile !== "undefined") {
        try { window.turnstile.reset(turnstileWidgetId); } catch (e) {}
      }
    } finally {
      if (loginModalSubmitBtn) loginModalSubmitBtn.disabled = false;
    }
  }

  async function logoutFromLibraryAccess() {
    const preferredLibraryId = state.library.selectedId || "";
    const preferredFileName = libraryFileSelect ? String(libraryFileSelect.value || "") : "";
    try {
      await callLibraryApi("logout", {
        method: "POST",
        body: {}
      });
    } catch (ignored) {
      // Always clear local session regardless of API result
    }
    setLibraryAuthSession(false, null);
    try {
      await refreshLibraries(preferredLibraryId, preferredFileName);
    } catch (error) {
      clearLibraryState();
    }
    setLibraryStatus(t("status.libraryLoggedOut"), false);
  }

  function authorLang(field) {
    if (!field || typeof field !== "object") return String(field || "");
    const lang = normalizeLanguage(state.settings.language);
    const val = String(field[lang] || "").trim();
    if (val) return val;
    return String(field.pl || field.en || "").trim();
  }

  function authorLangArray(field) {
    if (!field || typeof field !== "object") return [];
    const lang = normalizeLanguage(state.settings.language);
    const arr = Array.isArray(field[lang]) ? field[lang] : [];
    if (arr.length > 0) return arr;
    const fallback = Array.isArray(field.pl) ? field.pl : (Array.isArray(field.en) ? field.en : []);
    return fallback;
  }

  function renderListIntoUl(ulElement, items) {
    ulElement.innerHTML = "";
    if (items.length === 0) {
      const emptyItem = document.createElement("li");
      emptyItem.textContent = "-";
      ulElement.appendChild(emptyItem);
    } else {
      items.forEach((text) => {
        const item = document.createElement("li");
        item.textContent = String(text);
        ulElement.appendChild(item);
      });
    }
  }

  function renderAuthorMetrics(container, metrics) {
    container.innerHTML = "";
    if (!metrics || (typeof metrics !== "object")) {
      var empty = document.createElement("span");
      empty.className = "author-metrics-empty";
      empty.textContent = "-";
      container.appendChild(empty);
      return;
    }

    var sources = [
      { key: "googleScholar", label: "Google Scholar", color: "#4285f4" },
      { key: "wos", label: "Web of Science", color: "#5c2d91" }
    ];

    var hasAny = sources.some(function(s) { return metrics[s.key] && typeof metrics[s.key] === "object"; });
    if (!hasAny) {
      var emptyEl = document.createElement("span");
      emptyEl.className = "author-metrics-empty";
      emptyEl.textContent = "-";
      container.appendChild(emptyEl);
      return;
    }

    var table = document.createElement("table");
    table.className = "author-metrics-table";

    var thead = document.createElement("thead");
    var headerRow = document.createElement("tr");
    [t("author.metricsSource"), t("author.metricsArticles"), t("author.metricsCitations"), t("author.metricsHIndex"), t("author.metricsI10Index")].forEach(function(text) {
      var th = document.createElement("th");
      th.textContent = text;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    var tbody = document.createElement("tbody");
    var latestDate = null;

    sources.forEach(function(src) {
      var data = metrics[src.key];
      if (!data || typeof data !== "object") return;

      var tr = document.createElement("tr");

      var tdSource = document.createElement("td");
      tdSource.className = "author-metrics-source";
      var dot = document.createElement("span");
      dot.className = "author-metrics-dot";
      dot.style.background = src.color;
      tdSource.appendChild(dot);
      var nameSpan = document.createElement("span");
      nameSpan.textContent = src.label;
      tdSource.appendChild(nameSpan);
      tr.appendChild(tdSource);

      var fields = ["articles", "citations", "hIndex", "i10Index"];
      fields.forEach(function(field) {
        var td = document.createElement("td");
        td.className = "author-metrics-num";
        var val = data[field];
        td.textContent = (val !== undefined && val !== null && val !== "") ? String(val) : "–";
        tr.appendChild(td);
      });

      tbody.appendChild(tr);

      if (data.updatedAt) {
        var d = new Date(data.updatedAt);
        if (!isNaN(d.getTime()) && (!latestDate || d > latestDate)) {
          latestDate = d;
        }
      }
    });

    table.appendChild(tbody);
    container.appendChild(table);

    if (latestDate) {
      var updatedEl = document.createElement("div");
      updatedEl.className = "author-metrics-updated";
      var lang = normalizeLanguage(state.settings.language);
      var dateStr = latestDate.toLocaleDateString(lang === "pl" ? "pl-PL" : "en-US", {
        year: "numeric", month: "2-digit", day: "2-digit"
      });
      updatedEl.textContent = t("author.metricsUpdated") + ": " + dateStr;
      container.appendChild(updatedEl);
    }
  }

  function renderAuthorProfiles(container, author) {
    container.innerHTML = "";
    const profiles = [
      {
        key: "orcid",
        url: author.orcid ? "https://orcid.org/" + author.orcid : "",
        label: "ORCID",
        svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="18" height="18"><path fill="#a6ce39" d="M256 128c0 70.7-57.3 128-128 128S0 198.7 0 128 57.3 0 128 0s128 57.3 128 128z"/><path fill="#fff" d="M86.3 186.2H70.9V79.1h15.4v107.1zm22.6 0h42.7c52.3 0 52.3-107.1 0-107.1h-42.7v107.1zm15.4-93.1h24.5c36.1 0 36.1 79.1 0 79.1h-24.5V93.1zM88.7 56.8c0 5.5-4.5 10-10 10s-10-4.5-10-10 4.5-10 10-10 10 4.5 10 10z"/></svg>'
      },
      {
        key: "googleScholar",
        url: author.googleScholar || "",
        label: "Google Scholar",
        svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="18" height="18"><path fill="#4285f4" d="M256 411.12L0 202.667 256 0z"/><path fill="#356ac3" d="M256 411.12l256-208.453L256 0z"/><circle fill="#a0c3ff" cx="256" cy="362.667" r="149.333"/><path fill="#76a7fa" d="M121.037 298.667c23.968-50.453 75.392-85.334 134.963-85.334s110.995 34.881 134.963 85.334H121.037z"/></svg>'
      },
      {
        key: "researchgate",
        url: author.researchgate || "",
        label: "ResearchGate",
        svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="16" height="16"><path fill="#00d0af" d="M0 32v448h448V32H0zm262.2 334.4c-6.6 3-33.2 6-50-14.2-9.2-10.6-25.3-33.3-42.2-63.6-8.9 0-14.7 0-21.4-.6v46.4c0 23.5 6 21.2 25.8 23.9v8.1c-6.9-.3-23.1-.8-35.6-.8-13.1 0-26.1.6-33.6.8v-8.1c15.5-2.9 22-1.3 22-23.9V225c0-22.6-6.4-21-22-23.9V193c13.4.3 30 .8 38 .8 37.7 0 78.2 2.7 78.2 44.9 0 25.2-17.6 43.5-44.7 49 12 14.6 29.6 40.4 42.6 56.5 10.2 12.9 17.1 18 28.3 20.2v8zm-76.9-186.8c0 30.1 33.2 24 33.2 24 22.5-.7 35.4-18 35.4-38.8 0-30.4-26.1-37.6-43.4-37.6h-25.2v52.4z"/></svg>'
      },
      {
        key: "wos",
        url: author.wos ? "https://www.webofscience.com/wos/author/record/" + author.wos : "",
        label: "Web of Science",
        svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18"><path fill="#5c2d91" d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm-.5 5.5h1.8l1.2 4.5 1.3-4.5h1.7l-2.2 7h-1.6l-1.2-4.3-1.2 4.3H9.7L7.5 5.5h1.8l1.2 4.5 1-4.5zm-5 8h8v1.5h-8V13.5zm1 3h6v1.5h-6V16.5z"/></svg>'
      },
      {
        key: "website",
        url: author.website || "",
        label: "WWW",
        svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z"/></svg>'
      }
    ];
    const hasAny = profiles.some(function(p) { return Boolean(p.url); });
    if (!hasAny) {
      const empty = document.createElement("span");
      empty.className = "author-profiles-empty";
      empty.textContent = "-";
      container.appendChild(empty);
      return;
    }
    profiles.forEach(function(p) {
      if (!p.url) return;
      var link = document.createElement("a");
      link.href = p.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.className = "author-profile-badge author-profile-" + p.key;
      link.title = p.label;
      link.innerHTML = p.svg + '<span class="author-profile-badge-label">' + p.label + "</span>";
      container.appendChild(link);
    });
  }

  function renderAuthorsPanel() {
    if (!authorTabs || !authorCard || !authorNameValue || !authorDegreeValue || !authorEmailsValue || !authorUnitValue || !authorRoleValue) {
      return;
    }
    authorTabs.innerHTML = "";
    const items = Array.isArray(state.authors.items) ? state.authors.items : [];
    if (items.length === 0) {
      authorCard.classList.add("hidden");
      if (authorsEmpty) {
        authorsEmpty.classList.remove("hidden");
      }
      authorNameValue.textContent = "-";
      authorDegreeValue.textContent = "-";
      authorRoleValue.innerHTML = "";
      authorEmailsValue.innerHTML = "<li>-</li>";
      authorUnitValue.innerHTML = "<li>-</li>";
      if (authorResearchAreaValue) authorResearchAreaValue.innerHTML = "<li>-</li>";
      if (authorProfilesValue) authorProfilesValue.innerHTML = "";
      if (authorMetricsValue) authorMetricsValue.innerHTML = "";
      return;
    }

    if (!items.some((item) => String(item.id || "") === state.authors.selectedId)) {
      state.authors.selectedId = String(items[0].id || "");
    }
    const selectedAuthor = items.find((item) => String(item.id || "") === state.authors.selectedId) || items[0];
    state.authors.selectedId = String(selectedAuthor.id || "");

    items.forEach((author) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `author-tab-btn ${String(author.id || "") === state.authors.selectedId ? "active" : ""}`;
      const tabDegree = authorLang(author.degree);
      const tabName = authorLang(author.fullName) || String(author.id || "");
      const lang = normalizeLanguage(state.settings.language);
      button.textContent = lang === "en"
        ? (tabName + (tabDegree ? ", " + tabDegree : ""))
        : ((tabDegree ? tabDegree + " " : "") + tabName);
      button.addEventListener("click", () => {
        state.authors.selectedId = String(author.id || "");
        renderAuthorsPanel();
      });
      authorTabs.appendChild(button);
    });

    authorCard.classList.remove("hidden");
    if (authorsEmpty) {
      authorsEmpty.classList.add("hidden");
    }
    authorNameValue.textContent = authorLang(selectedAuthor.fullName) || "-";
    authorDegreeValue.textContent = authorLang(selectedAuthor.degree) || "-";
    var roles = authorLangArray(selectedAuthor.projectRole);
    authorRoleValue.innerHTML = "";
    if (roles.length === 0) {
      authorRoleValue.innerHTML = '<span class="author-role-badge">-</span>';
    } else {
      roles.forEach(function(role) {
        var badge = document.createElement("span");
        badge.className = "author-role-badge";
        badge.textContent = role;
        authorRoleValue.appendChild(badge);
      });
    }

    const emails = Array.isArray(selectedAuthor.emails) ? selectedAuthor.emails : [];
    authorEmailsValue.innerHTML = "";
    if (emails.length === 0) {
      var emptyLi = document.createElement("li");
      emptyLi.textContent = "-";
      authorEmailsValue.appendChild(emptyLi);
    } else {
      emails.forEach(function(email) {
        var li = document.createElement("li");
        var a = document.createElement("a");
        a.href = "mailto:" + encodeURIComponent(String(email));
        a.textContent = String(email);
        a.className = "author-email-link";
        li.appendChild(a);
        authorEmailsValue.appendChild(li);
      });
    }

    const units = authorLangArray(selectedAuthor.units);
    renderListIntoUl(authorUnitValue, units);

    if (authorResearchAreaValue) {
      const areas = authorLangArray(selectedAuthor.researchArea);
      renderListIntoUl(authorResearchAreaValue, areas);
    }

    if (authorMetricsValue) {
      renderAuthorMetrics(authorMetricsValue, selectedAuthor.metrics);
    }

    if (authorProfilesValue) {
      renderAuthorProfiles(authorProfilesValue, selectedAuthor);
    }
  }

  async function refreshAuthors() {
    if (!RESEARCH_TEAM_ENABLED) {
      return;
    }
    if (authorsEmpty) {
      authorsEmpty.textContent = t("author.loading");
      authorsEmpty.classList.remove("hidden");
    }
    const payload = await callLibraryApi("authors");
    state.authors.items = Array.isArray(payload.authors) ? payload.authors : [];
    renderAuthorsPanel();
  }

  // ── Documentation ─────────────────────────────────────────
  function docsLang() {
    return normalizeLanguage(state.settings.language);
  }

  function docsLangText(bilingual) {
    if (!bilingual || typeof bilingual !== "object") {
      return "";
    }
    const lang = docsLang();
    return String(bilingual[lang] || bilingual.en || bilingual.pl || "");
  }

  function ensureDocsShape(input) {
    const out = {
      description: { en: "", pl: "" },
      algorithms: [],
      articles: [],
      updatedAt: ""
    };
    if (!input || typeof input !== "object") return out;
    if (input.description && typeof input.description === "object") {
      out.description.en = String(input.description.en || "");
      out.description.pl = String(input.description.pl || "");
    }
    if (Array.isArray(input.algorithms)) {
      out.algorithms = input.algorithms.map(a => ({
        id: String(a.id || ("alg-" + Math.random().toString(36).slice(2, 10))),
        name: { en: String((a.name && a.name.en) || ""), pl: String((a.name && a.name.pl) || "") },
        description: { en: String((a.description && a.description.en) || ""), pl: String((a.description && a.description.pl) || "") },
        complexity: String(a.complexity || ""),
        references: String(a.references || "")
      }));
    }
    if (Array.isArray(input.articles)) {
      out.articles = input.articles.map(a => ({
        id: String(a.id || ("art-" + Math.random().toString(36).slice(2, 10))),
        title: String(a.title || ""),
        authors: String(a.authors || ""),
        year: Number.isFinite(parseInt(a.year, 10)) ? parseInt(a.year, 10) : null,
        venue: String(a.venue || ""),
        doi: String(a.doi || ""),
        url: String(a.url || ""),
        abstract: String(a.abstract || "")
      }));
    }
    out.updatedAt = String(input.updatedAt || "");
    return out;
  }

  function setDocsStatus(message, isError) {
    if (!docsStatus) return;
    docsStatus.textContent = message || "";
    docsStatus.style.color = isError ? "var(--danger)" : "";
  }

  function updateDocsAdminVisibility() {
    if (!docsEditBtn) return;
    docsEditBtn.classList.toggle("hidden", !isLibraryAuthenticated() || state.docs.mode === "edit");
  }

  function renderDocsView() {
    if (!docsView) return;
    const data = state.docs.data || ensureDocsShape(null);
    if (docsDescriptionBody) {
      docsDescriptionBody.textContent = docsLangText(data.description) || "—";
    }
    if (docsAlgorithmsList) {
      docsAlgorithmsList.innerHTML = "";
      if (data.algorithms.length === 0) {
        const empty = document.createElement("div");
        empty.className = "hint";
        empty.textContent = t("app.docs.noAlgorithms");
        docsAlgorithmsList.appendChild(empty);
      } else {
        data.algorithms.forEach(a => {
          const card = document.createElement("div");
          card.className = "docs-card";
          const title = document.createElement("h4");
          title.className = "docs-card-title";
          title.textContent = docsLangText(a.name) || a.id;
          card.appendChild(title);
          if (a.complexity || a.references) {
            const meta = document.createElement("div");
            meta.className = "docs-card-meta";
            const parts = [];
            if (a.complexity) parts.push(a.complexity);
            if (a.references) parts.push(a.references);
            meta.textContent = parts.join(" · ");
            card.appendChild(meta);
          }
          const desc = document.createElement("div");
          desc.className = "docs-card-desc";
          desc.textContent = docsLangText(a.description);
          card.appendChild(desc);
          docsAlgorithmsList.appendChild(card);
        });
      }
    }
    if (docsArticlesList) {
      docsArticlesList.innerHTML = "";
      if (data.articles.length === 0) {
        const empty = document.createElement("div");
        empty.className = "hint";
        empty.textContent = t("app.docs.noArticles");
        docsArticlesList.appendChild(empty);
      } else {
        data.articles.forEach(a => {
          const card = document.createElement("div");
          card.className = "docs-card";
          const title = document.createElement("h4");
          title.className = "docs-card-title";
          title.textContent = a.title || a.id;
          card.appendChild(title);
          const metaParts = [];
          if (a.authors) metaParts.push(a.authors);
          if (a.year) metaParts.push(String(a.year));
          if (a.venue) metaParts.push(a.venue);
          if (metaParts.length) {
            const meta = document.createElement("div");
            meta.className = "docs-card-meta";
            meta.textContent = metaParts.join(" · ");
            card.appendChild(meta);
          }
          if (a.abstract) {
            const abs = document.createElement("div");
            abs.className = "docs-card-desc";
            abs.textContent = a.abstract;
            card.appendChild(abs);
          }
          if (a.url && /^https?:\/\//i.test(a.url)) {
            const link = document.createElement("a");
            link.className = "docs-card-link";
            link.href = a.url;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.textContent = a.doi ? ("DOI: " + a.doi) : a.url;
            card.appendChild(link);
          } else if (a.doi) {
            const doiSpan = document.createElement("div");
            doiSpan.className = "docs-card-meta";
            doiSpan.textContent = "DOI: " + a.doi;
            card.appendChild(doiSpan);
          }
          docsArticlesList.appendChild(card);
        });
      }
    }
  }

  function makeRemoveButton(onClick) {
    const wrap = document.createElement("div");
    wrap.className = "docs-edit-card-actions";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "docs-remove-btn";
    btn.textContent = t("app.docs.remove");
    btn.addEventListener("click", onClick);
    wrap.appendChild(btn);
    return wrap;
  }

  function renderDocsEditor() {
    if (!docsEditView) return;
    const draft = state.docs.draft;
    if (!draft) return;
    if (docsEditDescEn) {
      docsEditDescEn.value = draft.description.en || "";
      docsEditDescEn.oninput = () => { draft.description.en = docsEditDescEn.value; };
    }
    if (docsEditDescPl) {
      docsEditDescPl.value = draft.description.pl || "";
      docsEditDescPl.oninput = () => { draft.description.pl = docsEditDescPl.value; };
    }

    if (docsEditAlgorithmsList) {
      docsEditAlgorithmsList.innerHTML = "";
      draft.algorithms.forEach((a, idx) => {
        const card = document.createElement("div");
        card.className = "docs-edit-card";

        const row1 = document.createElement("div");
        row1.className = "docs-edit-card-row";
        ["en", "pl"].forEach(lang => {
          const lbl = document.createElement("label");
          const txt = document.createElement("span");
          txt.textContent = "Name (" + lang.toUpperCase() + ")";
          const inp = document.createElement("input");
          inp.type = "text";
          inp.maxLength = 200;
          inp.value = a.name[lang] || "";
          inp.addEventListener("input", () => { a.name[lang] = inp.value; });
          lbl.appendChild(txt);
          lbl.appendChild(inp);
          row1.appendChild(lbl);
        });
        card.appendChild(row1);

        ["en", "pl"].forEach(lang => {
          const lbl = document.createElement("label");
          const txt = document.createElement("span");
          txt.textContent = "Description (" + lang.toUpperCase() + ")";
          const ta = document.createElement("textarea");
          ta.maxLength = 3000;
          ta.value = a.description[lang] || "";
          ta.addEventListener("input", () => { a.description[lang] = ta.value; });
          lbl.appendChild(txt);
          lbl.appendChild(ta);
          card.appendChild(lbl);
        });

        const row2 = document.createElement("div");
        row2.className = "docs-edit-card-row";
        const lblC = document.createElement("label");
        const txtC = document.createElement("span");
        txtC.textContent = t("app.docs.complexity");
        const inpC = document.createElement("input");
        inpC.type = "text";
        inpC.maxLength = 200;
        inpC.value = a.complexity || "";
        inpC.addEventListener("input", () => { a.complexity = inpC.value; });
        lblC.appendChild(txtC);
        lblC.appendChild(inpC);
        row2.appendChild(lblC);

        const lblR = document.createElement("label");
        const txtR = document.createElement("span");
        txtR.textContent = docsLang() === "pl" ? "Referencje" : "References";
        const inpR = document.createElement("input");
        inpR.type = "text";
        inpR.maxLength = 500;
        inpR.value = a.references || "";
        inpR.addEventListener("input", () => { a.references = inpR.value; });
        lblR.appendChild(txtR);
        lblR.appendChild(inpR);
        row2.appendChild(lblR);
        card.appendChild(row2);

        card.appendChild(makeRemoveButton(() => {
          draft.algorithms.splice(idx, 1);
          renderDocsEditor();
        }));
        docsEditAlgorithmsList.appendChild(card);
      });
    }

    if (docsEditArticlesList) {
      docsEditArticlesList.innerHTML = "";
      draft.articles.forEach((a, idx) => {
        const card = document.createElement("div");
        card.className = "docs-edit-card";

        function addInput(labelText, key, maxLen, type) {
          const lbl = document.createElement("label");
          const txt = document.createElement("span");
          txt.textContent = labelText;
          const inp = document.createElement("input");
          inp.type = type || "text";
          inp.maxLength = maxLen;
          inp.value = a[key] == null ? "" : String(a[key]);
          inp.addEventListener("input", () => {
            if (type === "number") {
              const v = parseInt(inp.value, 10);
              a[key] = Number.isFinite(v) ? v : null;
            } else {
              a[key] = inp.value;
            }
          });
          lbl.appendChild(txt);
          lbl.appendChild(inp);
          return lbl;
        }

        card.appendChild(addInput(t("app.docs.title"), "title", 500));
        card.appendChild(addInput(docsLang() === "pl" ? "Autorzy" : "Authors", "authors", 500));

        const row = document.createElement("div");
        row.className = "docs-edit-card-row";
        row.appendChild(addInput(docsLang() === "pl" ? "Rok" : "Year", "year", 4, "number"));
        row.appendChild(addInput("DOI", "doi", 200));
        card.appendChild(row);

        card.appendChild(addInput(docsLang() === "pl" ? "Konferencja / Wydawnictwo" : "Venue / Publisher", "venue", 300));
        card.appendChild(addInput("URL", "url", 500, "url"));

        const lblA = document.createElement("label");
        const txtA = document.createElement("span");
        txtA.textContent = t("app.docs.abstract");
        const ta = document.createElement("textarea");
        ta.maxLength = 4000;
        ta.value = a.abstract || "";
        ta.addEventListener("input", () => { a.abstract = ta.value; });
        lblA.appendChild(txtA);
        lblA.appendChild(ta);
        card.appendChild(lblA);

        card.appendChild(makeRemoveButton(() => {
          draft.articles.splice(idx, 1);
          renderDocsEditor();
        }));
        docsEditArticlesList.appendChild(card);
      });
    }
  }

  function setDocsMode(nextMode) {
    state.docs.mode = nextMode;
    if (docsView) docsView.classList.toggle("hidden", nextMode !== "view");
    if (docsEditView) docsEditView.classList.toggle("hidden", nextMode !== "edit");
    if (docsSaveBtn) docsSaveBtn.classList.toggle("hidden", nextMode !== "edit");
    if (docsCancelBtn) docsCancelBtn.classList.toggle("hidden", nextMode !== "edit");
    updateDocsAdminVisibility();
  }

  async function loadDocs() {
    try {
      setDocsStatus(t("app.docs.loading"));
      const payload = await callLibraryApi("docs");
      state.docs.data = ensureDocsShape(payload && payload.docs);
      renderDocsView();
      setDocsStatus("");
    } catch (error) {
      setDocsStatus((error && error.message) || "Error", true);
    }
  }

  function enterDocsEdit() {
    if (!isLibraryAuthenticated()) {
      setDocsStatus(t("app.docs.loginRequired"), true);
      return;
    }
    // Deep clone current data into draft
    state.docs.draft = ensureDocsShape(JSON.parse(JSON.stringify(state.docs.data || {})));
    setDocsMode("edit");
    renderDocsEditor();
  }

  function cancelDocsEdit() {
    state.docs.draft = null;
    setDocsMode("view");
  }

  async function saveDocsDraft() {
    if (!state.docs.draft) return;
    try {
      setDocsStatus(t("app.docs.saving"));
      const payload = await callLibraryApi("save_docs", {
        method: "POST",
        body: { docs_json: JSON.stringify(state.docs.draft) }
      });
      state.docs.data = ensureDocsShape(payload && payload.docs);
      state.docs.draft = null;
      setDocsMode("view");
      renderDocsView();
      setDocsStatus(t("app.docs.saved"));
    } catch (error) {
      setDocsStatus((error && error.message) || "Error", true);
    }
  }

  async function refreshLibraryFiles(preferredFileName) {
    const selectedLibrary = getSelectedLibrary();
    state.library.files = [];
    benchmarkProfileRecords = [];
    benchmarkRepresentativeSelection = null;
    benchmarkRecords = [];
    setBenchmarkLatexOutput("");
    renderLibraryFiles("");
    renderBenchmarkResults();
    if (!selectedLibrary) {
      setLibraryStatus(t("app.library.noneSelected"), false);
      return;
    }

    const payload = await callLibraryApi("files", {
      query: { library_id: selectedLibrary.id }
    });
    state.library.files = Array.isArray(payload.files) ? payload.files : [];
    const resolvedPreferred = getPreferredLibraryFileName(selectedLibrary, preferredFileName || "");
    renderLibraryFiles(resolvedPreferred);
    const count = state.library.files.length;
    setLibraryStatus(t("app.library.summary", { name: selectedLibrary.name, count }), false);
  }

  async function refreshLibraries(preferredLibraryId, preferredFileName) {
    const payload = await callLibraryApi("libraries");
    state.library.libraries = Array.isArray(payload.libraries) ? payload.libraries : [];

    const knownIds = new Set(state.library.libraries.map((item) => item.id));
    const rememberedId = localStorage.getItem(LIBRARY_STORAGE_KEY) || "";
    const selectedCandidates = [
      preferredLibraryId || "",
      state.library.selectedId || "",
      rememberedId
    ];
    const nextSelectedId = selectedCandidates.find((candidate) => knownIds.has(candidate))
      || (state.library.libraries[0] ? state.library.libraries[0].id : null);
    state.library.selectedId = nextSelectedId;
    renderLibrarySelect();
    await refreshLibraryFiles(preferredFileName || "");
  }

  async function ensureDefaultLibrary() {
    assertLibraryAuthenticated();
    await refreshLibraries();
    if (state.library.libraries.length > 0) {
      return;
    }
    const payload = await callLibraryApi("create_library", {
      method: "POST",
      body: { name: t("app.library.defaultName") }
    });
    const createdId = payload.library && payload.library.id ? String(payload.library.id) : null;
    await refreshLibraries(createdId || "");
  }

  async function createLibraryFromInput() {
    assertLibraryAuthenticated();
    const requestedName = libraryNameInput ? libraryNameInput.value.trim() : "";
    const payload = await callLibraryApi("create_library", {
      method: "POST",
      body: { name: requestedName || "Nowa biblioteka" }
    });
    const createdId = payload.library && payload.library.id ? String(payload.library.id) : "";
    await refreshLibraries(createdId);
    setLibraryStatus(t("app.library.created"), false);
  }

  async function renameCurrentLibrary() {
    assertLibraryAuthenticated();
    const selectedLibrary = getSelectedLibrary();
    if (!selectedLibrary) {
      throw new Error(t("app.library.selectFirst"));
    }
    const newName = libraryNameInput ? libraryNameInput.value.trim() : "";
    if (!newName) {
      throw new Error(t("app.library.nameRequired"));
    }
    await callLibraryApi("rename_library", {
      method: "POST",
      body: {
        library_id: selectedLibrary.id,
        name: newName
      }
    });
    await refreshLibraries(selectedLibrary.id);
    setLibraryStatus(t("app.library.renamed"), false);
  }

  function isPnhFileName(fileName) {
    return /\.pnh$/i.test(String(fileName || "").trim());
  }

  function buildServerUploadFileName(file, includeFolderPath) {
    const baseName = String(file.name || "model.pnh");
    if (!includeFolderPath) {
      return baseName;
    }
    const relativePath = String(file.webkitRelativePath || "").trim();
    if (!relativePath) {
      return baseName;
    }
    const normalized = relativePath
      .replace(/\\/g, "/")
      .split("/")
      .filter(Boolean)
      .join("__");
    return normalized || baseName;
  }

  async function uploadManyPnhToCurrentLibrary(fileList, includeFolderPath) {
    assertLibraryAuthenticated();
    const selectedLibrary = getSelectedLibrary();
    if (!selectedLibrary) {
      throw new Error(t("app.library.selectFirst"));
    }

    const incoming = Array.from(fileList || []);
    if (incoming.length === 0) {
      throw new Error(t("app.library.noFilesSelected"));
    }

    const accepted = incoming.filter((file) => isPnhFileName(file.name));
    if (accepted.length === 0) {
      throw new Error(t("app.library.noPnhFiles"));
    }

    let lastUploadedName = "";
    let uploadedCount = 0;
    for (let index = 0; index < accepted.length; index += 1) {
      const file = accepted[index];
      setLibraryStatus(t("app.library.uploading", {
        index: index + 1,
        total: accepted.length,
        file: file.name
      }), false);
      const formData = new FormData();
      formData.append("library_id", selectedLibrary.id);
      const serverName = buildServerUploadFileName(file, includeFolderPath);
      formData.append("pnh_file", file, serverName);
      const payload = await callLibraryApi("upload_pnh", {
        method: "POST",
        body: formData
      });
      uploadedCount += 1;
      lastUploadedName = String(payload.file && payload.file.name ? payload.file.name : lastUploadedName);
    }

    await refreshLibraries(selectedLibrary.id, lastUploadedName);
    const skippedCount = incoming.length - accepted.length;
    if (skippedCount > 0) {
      setLibraryStatus(t("app.library.uploadedWithSkipped", { uploaded: uploadedCount, skipped: skippedCount }), false);
      return;
    }
    setLibraryStatus(t("app.library.uploaded", { uploaded: uploadedCount, library: selectedLibrary.name }), false);
  }

  async function uploadPnhSelection(fileList, includeFolderPath) {
    try {
      await uploadManyPnhToCurrentLibrary(fileList, includeFolderPath);
    } catch (error) {
      const message = error instanceof Error ? error.message : t("app.library.uploadFailed");
      alert(message);
      setLibraryStatus(message, true);
    } finally {
      if (includeFolderPath && libraryUploadFolderInput) {
        libraryUploadFolderInput.value = "";
      }
      if (!includeFolderPath && libraryUploadInput) {
        libraryUploadInput.value = "";
      }
    }
  }

  async function loadCurrentLibraryFile() {
    const selectedLibrary = getSelectedLibrary();
    if (!selectedLibrary) {
      throw new Error(t("app.library.selectFirst"));
    }
    const queryValue = getSelectedLibraryFileName();
    if (!queryValue) {
      throw new Error(t("app.library.selectFile"));
    }
    const resolvedFileName = resolveLibraryFileName(queryValue);
    if (!resolvedFileName || !findLibraryFileByName(resolvedFileName)) {
      throw new Error(t("app.library.fileNotFound"));
    }
    if (libraryFileSelect) {
      libraryFileSelect.value = resolvedFileName;
    }

    const payload = await callLibraryApi("get_pnh", {
      query: {
        library_id: selectedLibrary.id,
        file_name: resolvedFileName
      }
    });
    const rawPnh = String(payload.file && payload.file.content ? payload.file.content : "");
    const modeName = layoutModeSelect.value || state.settings.layoutMode;
    const parsed = parsePnhText(rawPnh, modeName);
    const importedMetadata = normalizeMetadata(parsed.metadata || []);
    importedMetadata.push(
      { key: "Library", value: selectedLibrary.name, raw: `Library: ${selectedLibrary.name}` },
      { key: "LibraryFile", value: resolvedFileName, raw: `LibraryFile: ${resolvedFileName}` }
    );
    parsed.metadata = importedMetadata;
    setRememberedLibraryFileName(selectedLibrary.id, resolvedFileName);
    applyState(parsed);
    setActiveWorkspaceTab("canvas");
    setLibraryStatus(t("app.library.loaded", {
      file: resolvedFileName,
      library: selectedLibrary.name
    }), false);
  }

  function generateId(kind) {
    if (kind === "place") {
      return `P${state.counters.place++}`;
    }
    if (kind === "transition") {
      return `T${state.counters.transition++}`;
    }
    return `A${state.counters.arc++}`;
  }

  function getNode(nodeId) {
    return state.nodes.find((node) => node.id === nodeId) || null;
  }

  function getArc(arcId) {
    return state.arcs.find((arc) => arc.id === arcId) || null;
  }

  function toSvgPoint(event) {
    const rect = svg.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (CANVAS_W / rect.width);
    const y = (event.clientY - rect.top) * (CANVAS_H / rect.height);
    return { x, y };
  }

  function clampView(zoom, panX, panY) {
    const safeZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Number(zoom) || 1));
    const scaledWidth = CANVAS_W * safeZoom;
    const scaledHeight = CANVAS_H * safeZoom;

    const marginX = Math.max(CANVAS_W, scaledWidth) * 0.8;
    const marginY = Math.max(CANVAS_H, scaledHeight) * 0.8;

    const minPanX = CANVAS_W - scaledWidth - marginX;
    const maxPanX = marginX;
    const minPanY = CANVAS_H - scaledHeight - marginY;
    const maxPanY = marginY;

    return {
      zoom: safeZoom,
      panX: Math.max(minPanX, Math.min(maxPanX, Number(panX) || 0)),
      panY: Math.max(minPanY, Math.min(maxPanY, Number(panY) || 0))
    };
  }

  function updateZoomUi() {
    if (!zoomLevel) {
      return;
    }
    const percent = Math.round(state.view.zoom * 100);
    zoomLevel.textContent = `${percent}%`;
  }

  function applyViewTransform() {
    if (!viewportLayer) {
      return;
    }
    viewportLayer.setAttribute(
      "transform",
      `translate(${state.view.panX} ${state.view.panY}) scale(${state.view.zoom})`
    );
  }

  function setView(zoom, panX, panY) {
    state.view = clampView(zoom, panX, panY);
    updateZoomUi();
    applyViewTransform();
  }

  function zoomAt(factor, centerPoint) {
    const safeFactor = Number(factor) || 1;
    if (safeFactor <= 0) {
      return;
    }
    const center = centerPoint || { x: CANVAS_W / 2, y: CANVAS_H / 2 };
    const currentZoom = state.view.zoom;
    const nextZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, currentZoom * safeFactor));
    if (Math.abs(nextZoom - currentZoom) < 0.0001) {
      return;
    }
    const worldX = (center.x - state.view.panX) / currentZoom;
    const worldY = (center.y - state.view.panY) / currentZoom;
    const nextPanX = center.x - worldX * nextZoom;
    const nextPanY = center.y - worldY * nextZoom;
    setView(nextZoom, nextPanX, nextPanY);
  }

  const PAN_STEP = 80;

  function panBy(dx, dy) {
    setView(state.view.zoom, state.view.panX + dx, state.view.panY + dy);
  }

  function getNetBoundingBox() {
    const nodes = state.nodes;
    if (nodes.length === 0) return null;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    nodes.forEach((node) => {
      const r = node.type === "place" ? PLACE_RADIUS : Math.max(TRANSITION_HALF_W, TRANSITION_HALF_H);
      if (node.x - r < minX) minX = node.x - r;
      if (node.y - r < minY) minY = node.y - r;
      if (node.x + r > maxX) maxX = node.x + r;
      if (node.y + r > maxY) maxY = node.y + r;
    });
    state.arcs.forEach((arc) => {
      if (Array.isArray(arc.bends)) {
        arc.bends.forEach((b) => {
          if (b.x < minX) minX = b.x;
          if (b.y < minY) minY = b.y;
          if (b.x > maxX) maxX = b.x;
          if (b.y > maxY) maxY = b.y;
        });
      }
    });
    const w = maxX - minX;
    const h = maxY - minY;
    if (w <= 0 && h <= 0) return null;
    return { minX, minY, maxX, maxY, w: Math.max(w, 1), h: Math.max(h, 1) };
  }

  function centerNet() {
    const bb = getNetBoundingBox();
    if (!bb) {
      setView(1, 0, 0);
      return;
    }
    const margin = LAYOUT_PADDING;
    const availW = CANVAS_W - 2 * margin;
    const availH = CANVAS_H - 2 * margin;
    const fitZoom = Math.min(availW / bb.w, availH / bb.h);
    const zoom = Math.max(MIN_ZOOM, Math.min(1.0, fitZoom));
    const centerX = (bb.minX + bb.maxX) / 2;
    const centerY = (bb.minY + bb.maxY) / 2;
    const panX = (CANVAS_W / 2) - centerX * zoom;
    const panY = (CANVAS_H / 2) - centerY * zoom;
    state.view = { zoom, panX, panY };
    updateZoomUi();
    applyViewTransform();
  }

  function toCanvasPoint(event) {
    const svgPoint = toSvgPoint(event);
    return {
      x: (svgPoint.x - state.view.panX) / state.view.zoom,
      y: (svgPoint.y - state.view.panY) / state.view.zoom
    };
  }

  function clampToCanvas(point) {
    return {
      x: Math.max(36, Math.min(CANVAS_W - 36, point.x)),
      y: Math.max(36, Math.min(CANVAS_H - 36, point.y))
    };
  }

  function clampArcPoint(point) {
    return {
      x: Math.max(ARC_POINT_MARGIN, Math.min(CANVAS_W - ARC_POINT_MARGIN, Number(point.x) || 0)),
      y: Math.max(ARC_POINT_MARGIN, Math.min(CANVAS_H - ARC_POINT_MARGIN, Number(point.y) || 0))
    };
  }

  function normalizeArcPoints(points) {
    if (!Array.isArray(points)) {
      return [];
    }
    const normalized = [];
    points.forEach((point) => {
      const x = Number(point && point.x);
      const y = Number(point && point.y);
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        return;
      }
      normalized.push(clampArcPoint({ x, y }));
    });
    return normalized;
  }

  function normalizeAngle(value) {
    const snapped = Math.round((Number(value) || 0) / 45) * 45;
    return ((snapped % 360) + 360) % 360;
  }

  function isEditableTarget(target) {
    if (!target || !(target instanceof HTMLElement)) {
      return false;
    }
    if (target.isContentEditable) {
      return true;
    }
    const tag = target.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
  }

  function isPanBackgroundTarget(target) {
    if (target === svg) {
      return true;
    }
    return target instanceof SVGElement && target.classList.contains("canvas-bg");
  }

  function shouldStartPanDrag(event) {
    if (event.button === 1 || event.button === 2) {
      return true;
    }
    if (event.button !== 0) {
      return false;
    }
    if (isSpacePressed) {
      return true;
    }
    // LMB on empty canvas background pans the view regardless of zoom level.
    return mode === "select" && isPanBackgroundTarget(event.target);
  }

  function startPanDrag(event) {
    const point = toSvgPoint(event);
    panInfo = {
      startX: point.x,
      startY: point.y,
      originPanX: state.view.panX,
      originPanY: state.view.panY,
      moved: false
    };
    svg.classList.add("is-panning");
    if (event.button === 2) {
      blockNextContextMenu = true;
    }
  }

  function stopPanDrag() {
    if (panInfo && panInfo.moved) {
      suppressCanvasClick = true;
    }
    panInfo = null;
    svg.classList.remove("is-panning");
  }

  function clearSelectedArcPoint() {
    selectedArcPoint = { arcId: null, index: -1 };
  }

  function setSelectedArcPoint(arcId, index) {
    const arc = getArc(arcId);
    if (!arc || !Array.isArray(arc.points)) {
      clearSelectedArcPoint();
      return;
    }
    const safeIndex = Number.isInteger(index) ? index : parseInt(String(index), 10);
    if (!Number.isInteger(safeIndex) || safeIndex < 0 || safeIndex >= arc.points.length) {
      clearSelectedArcPoint();
      return;
    }
    selectedArcPoint = { arcId: arcId, index: safeIndex };
  }

  function ensureArcPointsArray(arc) {
    if (!arc || !Array.isArray(arc.points)) {
      if (arc) {
        arc.points = [];
      }
      return [];
    }
    return arc.points;
  }

  function clearSelection() {
    selected = { kind: null, id: null };
    selectedNodeIds.clear();
    clearSelectedArcPoint();
    updateInspector();
  }

  function selectAllNodes() {
    selectedNodeIds.clear();
    state.nodes.forEach(function(node) {
      selectedNodeIds.add(node.id);
    });
    selected = { kind: null, id: null };
    clearSelectedArcPoint();
    updateInspector();
    render();
  }

  function selectElement(kind, id) {
    selected = { kind, id };
    selectedNodeIds.clear();
    if (kind !== "arc" || selectedArcPoint.arcId !== id) {
      clearSelectedArcPoint();
    }
    updateInspector();
  }

  function createNode(type, point) {
    const id = generateId(type);
    const clamped = clampToCanvas(point);
    const node = {
      id,
      type,
      x: clamped.x,
      y: clamped.y,
      label: id,
      tokens: type === "place" ? 0 : 0,
      angle: type === "transition" ? 0 : 0
    };
    state.nodes.push(node);
    selectElement("node", id);
  }

  function areArcEndpointsValid(fromId, toId) {
    const from = getNode(fromId);
    const to = getNode(toId);
    if (!from || !to || from.id === to.id) {
      return false;
    }
    return from.type !== to.type;
  }

  function createArc(fromId, toId) {
    if (!areArcEndpointsValid(fromId, toId)) {
      alert(t("app.petri.arcBipartiteRequired"));
      return;
    }

    const duplicate = state.arcs.some((arc) => arc.from === fromId && arc.to === toId);
    if (duplicate) {
      alert(t("app.petri.arcDuplicate"));
      return;
    }

    const arc = {
      id: generateId("arc"),
      from: fromId,
      to: toId,
      weight: 1,
      points: []
    };
    state.arcs.push(arc);
    selectElement("arc", arc.id);
  }

  function deleteSelectedArcPoint() {
    if (selected.kind !== "arc" || selectedArcPoint.arcId !== selected.id) {
      return false;
    }
    const arc = getArc(selected.id);
    if (!arc) {
      clearSelectedArcPoint();
      return false;
    }
    const points = ensureArcPointsArray(arc);
    const index = selectedArcPoint.index;
    if (!Number.isInteger(index) || index < 0 || index >= points.length) {
      clearSelectedArcPoint();
      return false;
    }
    points.splice(index, 1);
    clearSelectedArcPoint();
    return true;
  }

  function deleteSelected() {
    if (deleteSelectedArcPoint()) {
      render();
      return;
    }
    if (selected.kind === "node") {
      state.nodes = state.nodes.filter((node) => node.id !== selected.id);
      state.arcs = state.arcs.filter((arc) => arc.from !== selected.id && arc.to !== selected.id);
    } else if (selected.kind === "arc") {
      state.arcs = state.arcs.filter((arc) => arc.id !== selected.id);
    }
    clearSelection();
    render();
  }

  function rotateSelectedTransition(step) {
    if (selected.kind !== "node") {
      return;
    }
    const node = getNode(selected.id);
    if (!node || node.type !== "transition") {
      return;
    }
    node.angle = normalizeAngle((node.angle || 0) + step);
    render();
  }

  function updateInspector() {
    syncInspectorToolMode();
    if (activeWorkspaceTab === "hypergraph") {
      inspectorEmpty.textContent = t("inspector.hypergraphTools");
      inspectorEmpty.classList.remove("hidden");
      deleteBtn.classList.add("hidden");
      inspectorNode.classList.add("hidden");
      inspectorArc.classList.add("hidden");
      if (arcClearBendsBtn) {
        arcClearBendsBtn.disabled = true;
      }
      return;
    }

    const hasSelection = Boolean(selected.kind && selected.id);
    inspectorEmpty.textContent = t("inspector.empty");
    inspectorEmpty.classList.toggle("hidden", hasSelection);
    deleteBtn.classList.toggle("hidden", !hasSelection);
    inspectorNode.classList.add("hidden");
    inspectorArc.classList.add("hidden");
    if (arcClearBendsBtn) {
      arcClearBendsBtn.disabled = true;
    }

    if (selected.kind === "node") {
      const node = getNode(selected.id);
      if (!node) {
        clearSelection();
        return;
      }

      inspectorNode.classList.remove("hidden");
      nodeLabelInput.value = node.label;
      const isPlace = node.type === "place";
      const isTransition = node.type === "transition";
      tokensLabel.classList.toggle("hidden", !isPlace);
      transitionRotation.classList.toggle("hidden", !isTransition);

      if (isPlace) {
        nodeTokensInput.value = String(node.tokens);
      }
      if (isTransition) {
        transitionAngleInfo.textContent = `${t("inspector.anglePrefix")}: ${normalizeAngle(node.angle)}°`;
      }
    } else if (selected.kind === "arc") {
      const arc = getArc(selected.id);
      if (!arc) {
        clearSelection();
        return;
      }
      inspectorArc.classList.remove("hidden");
      arcWeightInput.value = String(arc.weight);
      if (arcClearBendsBtn) {
        arcClearBendsBtn.disabled = ensureArcPointsArray(arc).length === 0;
      }
    }
  }

  function getConnectionPoint(node, towardX, towardY) {
    const dx = towardX - node.x;
    const dy = towardY - node.y;

    if (node.type === "place") {
      const length = Math.hypot(dx, dy) || 1;
      return {
        x: node.x + (dx / length) * PLACE_RADIUS,
        y: node.y + (dy / length) * PLACE_RADIUS
      };
    }

    const angleRad = (normalizeAngle(node.angle) * Math.PI) / 180;
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);

    const localX = cos * dx + sin * dy;
    const localY = -sin * dx + cos * dy;

    const scaleX = Math.abs(localX) / TRANSITION_HALF_W;
    const scaleY = Math.abs(localY) / TRANSITION_HALF_H;
    const scale = Math.max(scaleX, scaleY, 1e-6);
    const hitLocalX = localX / scale;
    const hitLocalY = localY / scale;

    return {
      x: node.x + cos * hitLocalX - sin * hitLocalY,
      y: node.y + sin * hitLocalX + cos * hitLocalY
    };
  }

  function incomingArcs(nodeId) {
    return state.arcs.filter((arc) => arc.to === nodeId);
  }

  function outgoingArcs(nodeId) {
    return state.arcs.filter((arc) => arc.from === nodeId);
  }

  function getEnabledTransitionsWithMarking(markingByPlaceId) {
    return state.nodes
      .filter((node) => node.type === "transition")
      .filter((transition) => {
        const inputs = incomingArcs(transition.id);
        return inputs.every((arc) => {
          const fromNode = getNode(arc.from);
          if (!fromNode || fromNode.type !== "place") {
            return false;
          }
          const tokens = markingByPlaceId ? markingByPlaceId.get(fromNode.id) : fromNode.tokens;
          return (tokens || 0) >= arc.weight;
        });
      });
  }

  function getEnabledTransitions() {
    return getEnabledTransitionsWithMarking(null);
  }

  function fireTransition(transitionId) {
    const transition = getNode(transitionId);
    if (!transition || transition.type !== "transition") {
      return false;
    }

    const enabledIds = new Set(getEnabledTransitions().map((item) => item.id));
    if (!enabledIds.has(transitionId)) {
      return false;
    }

    incomingArcs(transitionId).forEach((arc) => {
      const place = getNode(arc.from);
      if (place && place.type === "place") {
        place.tokens -= arc.weight;
      }
    });

    outgoingArcs(transitionId).forEach((arc) => {
      const place = getNode(arc.to);
      if (place && place.type === "place") {
        place.tokens += arc.weight;
      }
    });

    render();
    return true;
  }

  function renderTokens(group, placeNode) {
    if (placeNode.tokens <= 0) {
      return;
    }

    if (placeNode.tokens <= 4) {
      const offsets = [
        { x: 0, y: 0 },
        { x: -8, y: -6 },
        { x: 8, y: 6 },
        { x: -8, y: 6 }
      ];
      for (let i = 0; i < placeNode.tokens; i += 1) {
        const token = document.createElementNS(NS, "circle");
        token.setAttribute("cx", String(placeNode.x + offsets[i].x));
        token.setAttribute("cy", String(placeNode.y + offsets[i].y));
        token.setAttribute("r", "4");
        token.setAttribute("fill", "currentColor");
        token.style.color = "var(--accent)";
        group.appendChild(token);
      }
      return;
    }

    const text = document.createElementNS(NS, "text");
    text.setAttribute("x", String(placeNode.x));
    text.setAttribute("y", String(placeNode.y + 5));
    text.setAttribute("class", "token-count");
    text.textContent = String(placeNode.tokens);
    group.appendChild(text);
  }

  function getArcPolyline(arc) {
    const from = getNode(arc.from);
    const to = getNode(arc.to);
    if (!from || !to) {
      return null;
    }
    const points = ensureArcPointsArray(arc);
    const firstTarget = points.length > 0 ? points[0] : { x: to.x, y: to.y };
    const lastSource = points.length > 0 ? points[points.length - 1] : { x: from.x, y: from.y };
    const start = getConnectionPoint(from, firstTarget.x, firstTarget.y);
    const end = getConnectionPoint(to, lastSource.x, lastSource.y);
    return [start, ...points, end];
  }

  function buildPolylinePath(points) {
    if (!Array.isArray(points) || points.length === 0) {
      return "";
    }
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let index = 1; index < points.length; index += 1) {
      path += ` L ${points[index].x} ${points[index].y}`;
    }
    return path;
  }

  function projectPointOnSegment(point, a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lengthSq = dx * dx + dy * dy;
    if (lengthSq <= 1e-9) {
      const distSq = (point.x - a.x) ** 2 + (point.y - a.y) ** 2;
      return { x: a.x, y: a.y, distSq, t: 0 };
    }
    const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSq));
    const x = a.x + dx * t;
    const y = a.y + dy * t;
    const distSq = (point.x - x) ** 2 + (point.y - y) ** 2;
    return { x, y, distSq, t };
  }

  function findClosestPolylineSegmentIndex(polyline, point) {
    if (!Array.isArray(polyline) || polyline.length < 2) {
      return 0;
    }
    let bestIndex = 0;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (let index = 0; index < polyline.length - 1; index += 1) {
      const projected = projectPointOnSegment(point, polyline[index], polyline[index + 1]);
      if (projected.distSq < bestDistance) {
        bestDistance = projected.distSq;
        bestIndex = index;
      }
    }
    return bestIndex;
  }

  function getPolylineCenterLabelPoint(polyline) {
    if (!Array.isArray(polyline) || polyline.length === 0) {
      return { x: 0, y: -6 };
    }
    if (polyline.length === 1) {
      return { x: polyline[0].x, y: polyline[0].y - 6 };
    }

    const segments = [];
    let totalLength = 0;
    for (let index = 0; index < polyline.length - 1; index += 1) {
      const a = polyline[index];
      const b = polyline[index + 1];
      const length = Math.hypot(b.x - a.x, b.y - a.y);
      segments.push({ a, b, length });
      totalLength += length;
    }

    if (totalLength <= 1e-9) {
      return { x: polyline[0].x, y: polyline[0].y - 6 };
    }

    let remaining = totalLength / 2;
    for (const segment of segments) {
      if (remaining <= segment.length || segment.length <= 1e-9) {
        const ratio = segment.length <= 1e-9 ? 0 : remaining / segment.length;
        const x = segment.a.x + (segment.b.x - segment.a.x) * ratio;
        const y = segment.a.y + (segment.b.y - segment.a.y) * ratio;
        const dx = segment.b.x - segment.a.x;
        const dy = segment.b.y - segment.a.y;
        const norm = Math.hypot(dx, dy) || 1;
        return {
          x: x + (-dy / norm) * 10,
          y: y + (dx / norm) * 10
        };
      }
      remaining -= segment.length;
    }

    const last = polyline[polyline.length - 1];
    return { x: last.x, y: last.y - 6 };
  }

  function createArcElement(arc) {
    const polyline = getArcPolyline(arc);
    if (!polyline || polyline.length < 2) {
      return null;
    }

    const group = document.createElementNS(NS, "g");
    group.dataset.kind = "arc";
    group.dataset.id = arc.id;

    const line = document.createElementNS(NS, "path");
    line.setAttribute("d", buildPolylinePath(polyline));
    line.setAttribute("class", `arc-line ${selected.kind === "arc" && selected.id === arc.id ? "arc-selected" : ""}`);
    line.addEventListener("click", (event) => {
      event.stopPropagation();
      selectElement("arc", arc.id);
      clearSelectedArcPoint();
      render();
    });
    line.addEventListener("dblclick", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (mode !== "select") {
        return;
      }
      const points = ensureArcPointsArray(arc);
      const point = clampArcPoint(toCanvasPoint(event));
      const insertIndex = findClosestPolylineSegmentIndex(polyline, point);
      points.splice(insertIndex, 0, point);
      selectElement("arc", arc.id);
      setSelectedArcPoint(arc.id, insertIndex);
      render();
    });
    group.appendChild(line);

    if (arc.weight > 1) {
      const center = getPolylineCenterLabelPoint(polyline);
      const weight = document.createElementNS(NS, "text");
      weight.setAttribute("x", String(center.x));
      weight.setAttribute("y", String(center.y));
      weight.setAttribute("class", "arc-weight");
      weight.textContent = String(arc.weight);
      group.appendChild(weight);
    }

    if (mode === "select" && selected.kind === "arc" && selected.id === arc.id) {
      const points = ensureArcPointsArray(arc);
      points.forEach((point, index) => {
        const handle = document.createElementNS(NS, "circle");
        handle.setAttribute("cx", String(point.x));
        handle.setAttribute("cy", String(point.y));
        handle.setAttribute("r", String(ARC_HANDLE_RADIUS));
        const isActiveHandle = selectedArcPoint.arcId === arc.id && selectedArcPoint.index === index;
        handle.setAttribute("class", `arc-handle ${isActiveHandle ? "arc-handle-selected" : ""}`);
        handle.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          selectElement("arc", arc.id);
          setSelectedArcPoint(arc.id, index);
          render();
        });
        handle.addEventListener("mousedown", (event) => {
          if (event.button !== 0) {
            return;
          }
          event.preventDefault();
          event.stopPropagation();
          dragInfo = null;
          selectElement("arc", arc.id);
          setSelectedArcPoint(arc.id, index);
          arcPointDragInfo = { arcId: arc.id, index };
          render();
        });
        handle.addEventListener("dblclick", (event) => {
          event.preventDefault();
          event.stopPropagation();
          const currentPoints = ensureArcPointsArray(arc);
          if (index < 0 || index >= currentPoints.length) {
            return;
          }
          currentPoints.splice(index, 1);
          clearSelectedArcPoint();
          arcPointDragInfo = null;
          render();
        });
        group.appendChild(handle);
      });
    }

    return group;
  }

  function createNodeElement(node, enabledTransitionIds) {
    const group = document.createElementNS(NS, "g");
    group.dataset.kind = "node";
    group.dataset.id = node.id;

    if (node.type === "place") {
      const circle = document.createElementNS(NS, "circle");
      circle.setAttribute("cx", String(node.x));
      circle.setAttribute("cy", String(node.y));
      circle.setAttribute("r", String(PLACE_RADIUS));
      circle.setAttribute("class", `node-place ${(selected.kind === "node" && selected.id === node.id) || selectedNodeIds.has(node.id) ? "node-selected" : ""}`);
      group.appendChild(circle);
    } else {
      const rect = document.createElementNS(NS, "rect");
      rect.setAttribute("x", String(node.x - TRANSITION_HALF_W));
      rect.setAttribute("y", String(node.y - TRANSITION_HALF_H));
      rect.setAttribute("width", String(TRANSITION_HALF_W * 2));
      rect.setAttribute("height", String(TRANSITION_HALF_H * 2));
      rect.setAttribute("transform", `rotate(${normalizeAngle(node.angle)} ${node.x} ${node.y})`);
      const enabledClass = enabledTransitionIds.has(node.id) ? "transition-enabled" : "";
      rect.setAttribute(
        "class",
        `node-transition ${enabledClass} ${(selected.kind === "node" && selected.id === node.id) || selectedNodeIds.has(node.id) ? "node-selected" : ""}`
      );
      group.appendChild(rect);
    }

    renderTokens(group, node);

    const label = document.createElementNS(NS, "text");
    label.setAttribute("x", String(node.x));
    label.setAttribute("y", String(node.type === "place" ? node.y + 46 : node.y + 58));
    label.setAttribute("class", "node-label");
    label.textContent = node.label;
    group.appendChild(label);

    group.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    group.addEventListener("mousedown", (event) => {
      event.stopPropagation();
      const point = toCanvasPoint(event);

      if (mode === "arc") {
        if (!arcSourceNodeId) {
          arcSourceNodeId = node.id;
          selectElement("node", node.id);
          render();
          return;
        }
        createArc(arcSourceNodeId, node.id);
        arcSourceNodeId = null;
        render();
        return;
      }

      if (mode === "select") {
        if (selectedNodeIds.size > 1 && selectedNodeIds.has(node.id)) {
          multiDragInfo = {
            startX: point.x,
            startY: point.y,
            origins: []
          };
          state.nodes.forEach(function(n) {
            if (selectedNodeIds.has(n.id)) {
              multiDragInfo.origins.push({ id: n.id, x: n.x, y: n.y });
            }
          });
        } else {
          selectElement("node", node.id);
          dragInfo = {
            nodeId: node.id,
            dx: node.x - point.x,
            dy: node.y - point.y
          };
        }
        render();
      }
    });

    return group;
  }

  function updateEnabledTransitionsLabel(enabledTransitions) {
    const text = enabledTransitions.length === 0
      ? t("sim.enabledNone")
      : `${t("sim.enabledPrefix")} ${enabledTransitions.map((item) => item.label).join(", ")}`;
    if (enabledList) {
      enabledList.textContent = text;
    }
    if (canvasEnabledList) {
      canvasEnabledList.textContent = text;
    }
  }

  function updateAutoSimulationLabels() {
    const text = autoTimer ? t("sim.stopAuto") : t("sim.startAuto");
    if (autoBtn) {
      autoBtn.textContent = text;
      autoBtn.title = text;
    }
    const canvasAutoText = document.getElementById("canvas-auto-text");
    if (canvasAutoText) {
      canvasAutoText.textContent = text;
    }
    if (canvasAutoBtn) {
      canvasAutoBtn.title = text;
    }
  }

  function fireSelectedTransitionFromUi() {
    if (selected.kind !== "node") {
      alert(t("app.sim.transitionRequired"));
      return;
    }
    const node = getNode(selected.id);
    if (!node || node.type !== "transition") {
      alert(t("app.sim.selectedNotTransition"));
      return;
    }
    if (!fireTransition(node.id)) {
      alert(t("app.sim.transitionInactive"));
    }
  }

  function fireRandomEnabledTransitionFromUi() {
    const enabled = getEnabledTransitions();
    if (enabled.length === 0) {
      alert(t("app.sim.noEnabled"));
      return;
    }
    const choice = enabled[Math.floor(Math.random() * enabled.length)];
    fireTransition(choice.id);
  }

  function computeClassificationFor(nodes, arcs) {
    return requirePetriAnalysisCoreFunction("computeClassificationFor")(nodes, arcs);
  }

  function classificationToMap(classificationRows) {
    return requirePetriAnalysisCoreFunction("classificationToMap")(classificationRows);
  }

  function classifyNet() {
    return computeClassificationFor(state.nodes, state.arcs);
  }

  function renderClassificationPanel() {
    classificationList.innerHTML = "";
    if (state.nodes.length === 0) {
      classificationList.textContent = t("status.classNone");
      classificationList.className = "hint";
      return;
    }

    classificationList.className = "class-list";
    classifyNet().forEach((item) => {
      const row = document.createElement("div");
      row.className = "class-row";

      const name = document.createElement("span");
      name.className = "class-name";
      name.textContent = item.code;

      const status = document.createElement("span");
      status.className = `class-status ${item.ok ? "class-ok" : "class-no"}`;
      status.textContent = item.ok ? t("class.yes") : t("class.no");

      row.appendChild(name);
      row.appendChild(status);

      const note = document.createElement("div");
      note.className = "class-note";
      note.style.gridColumn = "1 / -1";
      note.textContent = item.note;
      row.appendChild(note);

      classificationList.appendChild(row);
    });
  }

  function normalizeMetadata(entries) {
    if (!Array.isArray(entries)) {
      return [];
    }
    return entries
      .map((entry) => {
        if (!entry || typeof entry !== "object") {
          return null;
        }
        const key = String(entry.key || "Info").trim() || "Info";
        const value = String(entry.value || "").trim();
        if (!value) {
          return null;
        }
        return {
          key,
          value,
          raw: String(entry.raw || `${key}: ${value}`)
        };
      })
      .filter(Boolean);
  }

  function renderMetadataPanel() {
    metadataList.innerHTML = "";
    const all = normalizeMetadata(state.metadata);
    const phrase = (metadataFilterInput.value || "").trim().toLowerCase();

    const filtered = phrase
      ? all.filter((item) => `${item.key} ${item.value}`.toLowerCase().includes(phrase))
      : all;

    if (filtered.length === 0) {
      metadataList.className = "hint";
      metadataList.textContent = all.length === 0
        ? t("status.metaNone")
        : t("status.metaFilteredNone");
      return;
    }

    metadataList.className = "meta-list";
    filtered.forEach((item) => {
      const row = document.createElement("div");
      row.className = "meta-row";

      const key = document.createElement("span");
      key.className = "meta-key";
      key.textContent = `${item.key}:`;

      const value = document.createElement("span");
      value.className = "meta-value";
      value.textContent = item.value;

      row.appendChild(key);
      row.appendChild(value);
      metadataList.appendChild(row);
    });
  }

  function setAnalysisMessage(rows, plainFallback) {
    analysisResult.innerHTML = "";
    if (!Array.isArray(rows) || rows.length === 0) {
      analysisResult.className = "hint";
      analysisResult.textContent = plainFallback || t("status.analysisNone");
      return;
    }

    analysisResult.className = "analysis-list";
    rows.forEach((rowData) => {
      const row = document.createElement("div");
      row.className = "analysis-row";

      const key = document.createElement("span");
      key.className = "analysis-key";
      key.textContent = rowData.key;

      const status = document.createElement("span");
      const statusClass = rowData.status === "OK"
        ? "analysis-ok"
        : rowData.status === "WARN"
          ? "analysis-warn"
          : "analysis-no";
      status.className = `analysis-status ${statusClass}`;
      status.textContent = rowData.status;

      row.appendChild(key);
      row.appendChild(status);

      const value = document.createElement("div");
      value.className = "analysis-value";
      value.style.gridColumn = "1 / -1";
      value.textContent = rowData.message;
      row.appendChild(value);

      analysisResult.appendChild(row);
    });
  }

  function setPinvariantStatus(message, isError) {
    if (!pinvStatus) {
      return;
    }
    pinvStatus.textContent = message || "";
    pinvStatus.className = isError ? "analysis-value" : "hint";
  }

  function setPinvariantOutput(text) {
    if (!pinvOutput) {
      return;
    }
    pinvOutput.textContent = text && String(text).trim()
      ? String(text)
      : t("status.pinvOutputNone");
  }

  function setPinvariantMatrixOutput(text) {
    if (!pinvMatrixOutput) {
      return;
    }
    pinvMatrixOutput.textContent = text && String(text).trim()
      ? String(text)
      : t("status.pinvMatrixNone");
  }

  function setPinvariantRunning(isRunning) {
    pinvariantIsRunning = Boolean(isRunning);
    if (!pinvRunBtn) {
      return;
    }
    pinvRunBtn.disabled = pinvariantIsRunning;
    pinvRunBtn.textContent = pinvariantIsRunning
      ? t("sim.runPinvRunning")
      : t("sim.runPinv");
  }

  function cancelPinvariantComputation() {
    if (pinvariantWorker) {
      pinvariantWorker.terminate();
      pinvariantWorker = null;
    }
    activePinvariantJobId = 0;
    setPinvariantRunning(false);
  }

  function cancelPinvariantComputationByUser() {
    cancelPinvariantComputation();
    lastPinvariantResult = null;
    cancelXtrecComputation();
    lastSelectionHypergraphResult = null;
    pendingSelectionHypergraphResult = null;
    lastSfcResult = null;
    setPinvariantStatus(t("app.cancel.pinvariant"), true);
    setPinvariantOutput(t("app.cancel.pinvariantOutput"));
    setPinvariantMatrixOutput(t("app.cancel.pinvariantOutput"));
    setSelectionHypergraphStatus(t("app.pinvariant.selectionWaitingValid"), true);
    setSelectionHypergraphOutput("");
    setSfcStatus(t("app.pinvariant.sfcMissing"), true);
    setSfcOutput("");
    setSfcValidationOutput("");
    setSfcMaxPlusOutput("");
    setSfcRunning(false);
    clearFuzzyResult();
  }

  function cancelXtrecComputation() {
    if (xtrecWorker) {
      xtrecWorker.terminate();
      xtrecWorker = null;
    }
    if (activeTransversalWorker) {
      activeTransversalWorker.terminate();
      activeTransversalWorker = null;
    }
    activeXtrecJobId = 0;
    activeTransversalJobId = 0;
    setSelectionHypergraphRunning(false);
    pendingSelectionHypergraphResult = null;
  }

  function cancelXtrecComputationByUser() {
    const pendingResult = pendingSelectionHypergraphResult;
    const lastResult = lastSelectionHypergraphResult;
    const wasTransversalPhase = Boolean(pendingResult && pendingResult.transversalPending);
    cancelXtrecComputation();
    clearFuzzyResult();
    setSelectionHypergraphStatus(
      wasTransversalPhase
        ? t("app.cancel.selectionTransversal")
        : t("app.cancel.selectionXtrec"),
      true
    );
    if (pendingResult) {
      const snapshot = {
        ...pendingResult,
        xtrecPending: false,
        transversalPending: false
      };
      lastSelectionHypergraphResult = snapshot;
      setSelectionHypergraphOutput(formatSelectionHypergraphOutput(snapshot));
      setAnalysisMessage(buildSelectionHypergraphAnalysisRows(snapshot), t("status.selectionOutputNone"));
    } else if (lastResult) {
      setSelectionHypergraphOutput(formatSelectionHypergraphOutput(lastResult));
      setAnalysisMessage(buildSelectionHypergraphAnalysisRows(lastResult), t("status.selectionOutputNone"));
    } else {
      setSelectionHypergraphOutput(t("app.selection.cancelledOutput"));
    }
  }

  function cancelHypergraphXtrecComputationByUser() {
    if (hypergraphXtrecWorker) {
      hypergraphXtrecWorker.terminate();
      hypergraphXtrecWorker = null;
    }
    activeHypergraphXtrecJobId = 0;
    setHypergraphEditorStatus(t("app.cancel.hypergraphXtrec"), true);
    refreshHypergraphEditorText();
    ensureHypergraphResultsVisible();
  }

  function cancelActiveComputation() {
    if (!activeComputation || !activeComputation.cancelable) {
      return;
    }
    const type = activeComputation.type;
    if (type === "pinvariant") {
      cancelPinvariantComputationByUser();
    } else if (type === "generator") {
      cancelGeneratorComputation();
      setGenerateStatus(t("app.cancel.generator"), true);
    } else if (type === "xtrec" || type === "transversal") {
      cancelXtrecComputationByUser();
    } else if (type === "hypergraph-xtrec") {
      cancelHypergraphXtrecComputationByUser();
    } else if (type === "sfc") {
      cancelSfcComputationByUser();
    } else if (type === "benchmark") {
      cancelBenchmarkComputation();
      setBenchmarkStatus(t("app.cancel.benchmark"), true);
    }
    hideComputationDialog();
  }

  function collectPinvariantNetSnapshot() {
    const nodes = state.nodes.map((node) => ({
      id: node.id,
      type: node.type,
      tokens: node.type === "place" ? Math.max(0, parseInt(String(node.tokens || 0), 10) || 0) : 0
    }));
    const arcs = state.arcs.map((arc) => ({
      from: arc.from,
      to: arc.to,
      weight: Math.max(1, parseInt(String(arc.weight || 1), 10) || 1)
    }));
    return { nodes, arcs };
  }

  function formatPinvariantMatrixBlock(result) {
    return requireExportersCoreFunction("formatPinvariantMatrixBlock")(result);
  }

  function formatPinvariantOutput(result) {
    return requireExportersCoreFunction("formatPinvariantOutput")(result, { emptyText: t("status.pinvOutputNone") });
  }

  function buildPinvariantAnalysisRows(result) {
    return requireExportersCoreFunction("buildPinvariantAnalysisRows")(result);
  }

  function setSelectionHypergraphStatus(message, isError) {
    if (!selectionHypergraphStatus) {
      return;
    }
    selectionHypergraphStatus.textContent = message || "";
    selectionHypergraphStatus.className = isError ? "analysis-value" : "hint";
  }

  function setSelectionHypergraphOutput(text) {
    if (!selectionHypergraphOutput) {
      return;
    }
    selectionHypergraphOutput.textContent = text && String(text).trim()
      ? String(text)
      : t("status.selectionOutputNone");
  }

  function setSelectionHypergraphRunning(isRunning) {
    xtrecIsRunning = Boolean(isRunning);
    if (selectionHypergraphBtn) {
      selectionHypergraphBtn.disabled = xtrecIsRunning;
      selectionHypergraphBtn.textContent = xtrecIsRunning
        ? t("sim.selectionButtonRunning")
        : t("sim.selectionButton");
    }
    if (transversalStrategySelect) {
      transversalStrategySelect.disabled = xtrecIsRunning;
    }
    if (selectionHypergraphViewSelect) {
      selectionHypergraphViewSelect.disabled = xtrecIsRunning;
    }
    if (selectionHypergraphDrawBtn) {
      selectionHypergraphDrawBtn.disabled = xtrecIsRunning;
    }
    if (selectionHypergraphCompareBtn) {
      selectionHypergraphCompareBtn.disabled = xtrecIsRunning;
    }
  }

  function setManualHypergraphStatus(message, isError) {
    if (!manualHypergraphStatus) {
      return;
    }
    manualHypergraphStatus.textContent = message || "";
    manualHypergraphStatus.className = isError ? "analysis-value" : "hint";
  }

  function setManualHypergraphOutput(text) {
    if (!manualHypergraphOutput) {
      return;
    }
    manualHypergraphOutput.textContent = text && String(text).trim()
      ? String(text)
      : t("status.manualHypergraphOutputNone");
  }

  function setManualHypergraphRunning(isRunning) {
    if (manualHypergraphRunBtn) {
      manualHypergraphRunBtn.disabled = Boolean(isRunning);
      manualHypergraphRunBtn.textContent = Boolean(isRunning)
        ? t("app.selection.checkingXt")
        : t("manualHypergraph.run");
    }
  }

  function setSfcStatus(message, isError) {
    if (!sfcStatus) {
      return;
    }
    sfcStatus.textContent = message || "";
    sfcStatus.className = isError ? "analysis-value" : "hint";
  }

  function setSfcOutput(text) {
    if (!sfcOutput) {
      return;
    }
    sfcOutput.textContent = text && String(text).trim()
      ? String(text)
      : t("status.sfcOutputNone");
  }

  function setSfcValidationOutput(text) {
    if (!sfcValidationOutput) {
      return;
    }
    sfcValidationOutput.textContent = text && String(text).trim()
      ? String(text)
      : t("status.sfcValidationNone");
  }

  function setSfcMaxPlusOutput(text) {
    if (!sfcMaxPlusOutput) {
      return;
    }
    sfcMaxPlusOutput.textContent = text && String(text).trim()
      ? String(text)
      : t("status.sfcMaxPlusNone");
  }

  function setDecompositionStatus(message, isError) {
    if (!decompositionStatus) {
      return;
    }
    decompositionStatus.textContent = message || "";
    decompositionStatus.style.color = isError ? "var(--danger)" : "";
  }

  function setDecompositionDetails(text) {
    if (!decompositionDetails) {
      return;
    }
    decompositionDetails.textContent = text && String(text).trim()
      ? String(text)
      : t("status.decompositionDetailsNone");
  }

  function setSfcRunning(isRunning) {
    sfcIsRunning = Boolean(isRunning);
    const hasModel = Boolean(lastSfcResult && lastSfcResult.model);

    if (sfcBuildBtn) {
      sfcBuildBtn.disabled = sfcIsRunning;
      sfcBuildBtn.textContent = sfcIsRunning ? t("sfc.buildRunning") : t("sfc.build");
    }
    if (sfcValidateBtn) {
      sfcValidateBtn.disabled = sfcIsRunning || !hasModel;
      sfcValidateBtn.textContent = sfcIsRunning ? t("sfc.validateRunning") : t("sfc.validate");
    }
    if (sfcMaxPlusRunBtn) {
      sfcMaxPlusRunBtn.disabled = sfcIsRunning || !hasModel;
      sfcMaxPlusRunBtn.textContent = sfcIsRunning ? t("sfc.maxplus.runRunning") : t("sfc.maxplus.run");
    }
    if (sfcExportXmlBtn) {
      sfcExportXmlBtn.disabled = sfcIsRunning || !hasModel;
    }
    if (sfcExportStBtn) {
      sfcExportStBtn.disabled = sfcIsRunning || !hasModel;
    }
    if (sfcExportIdeBtn) {
      sfcExportIdeBtn.disabled = sfcIsRunning || !hasModel;
    }
    if (sfcProfileSelect) {
      sfcProfileSelect.disabled = sfcIsRunning;
    }
    if (sfcSyncSelect) {
      sfcSyncSelect.disabled = sfcIsRunning;
    }
    if (sfcSourceSelect) {
      sfcSourceSelect.disabled = sfcIsRunning;
    }
    if (sfcIdeTargetSelect) {
      sfcIdeTargetSelect.disabled = sfcIsRunning;
    }
    if (sfcMaxPlusDefaultDelayInput) {
      sfcMaxPlusDefaultDelayInput.disabled = sfcIsRunning;
    }
    if (sfcMaxPlusDelayMapInput) {
      sfcMaxPlusDelayMapInput.disabled = sfcIsRunning;
    }
    if (sfcMaxPlusSyncOverheadInput) {
      sfcMaxPlusSyncOverheadInput.disabled = sfcIsRunning;
    }
    if (sfcTraceLengthInput) {
      sfcTraceLengthInput.disabled = sfcIsRunning;
    }
  }

  function cancelSfcComputation() {
    if (sfcWorker) {
      sfcWorker.terminate();
      sfcWorker = null;
    }
    activeSfcJobId = 0;
    setSfcRunning(false);
  }

  function cancelSfcComputationByUser() {
    const hasModel = Boolean(lastSfcResult && lastSfcResult.model);
    cancelSfcComputation();
    setSfcStatus(t("app.cancel.sfc"), true);
    if (!hasModel) {
      setSfcOutput(t("app.sfc.cancelledOutput"));
    }
  }

  function benchmarkNowMs() {
    if (typeof performance !== "undefined" && typeof performance.now === "function") {
      return performance.now();
    }
    return Date.now();
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function getBenchmarkCore() {
    const core = window.PoohBenchmarkCore;
    return core && typeof core === "object" ? core : null;
  }

  function requireBenchmarkCoreFunction(name) {
    const core = getBenchmarkCore();
    if (core && typeof core[name] === "function") {
      return core[name].bind(core);
    }
    throw new Error(t("app.core.missing", { module: "benchmark", name, path: "src/core/benchmark.js" }));
  }

  function getHypergraphCore() {
    const core = window.PoohHypergraphCore;
    return core && typeof core === "object" ? core : null;
  }

  function requireHypergraphCoreFunction(name) {
    const core = getHypergraphCore();
    if (core && typeof core[name] === "function") {
      return core[name].bind(core);
    }
    throw new Error(t("app.core.missing", { module: "hypergraph", name, path: "src/core/hypergraph.js" }));
  }

  function getSelectionHypergraphCore() {
    const core = window.PoohSelectionHypergraphCore;
    return core && typeof core === "object" ? core : null;
  }

  function requireSelectionHypergraphCoreFunction(name) {
    const core = getSelectionHypergraphCore();
    if (core && typeof core[name] === "function") {
      return core[name].bind(core);
    }
    throw new Error(t("app.core.missing", { module: "selection hypergraph", name, path: "src/core/selection-hypergraph.js" }));
  }

  function getPetriAnalysisCore() {
    const core = window.PoohPetriAnalysisCore;
    return core && typeof core === "object" ? core : null;
  }

  function requirePetriAnalysisCoreFunction(name) {
    const core = getPetriAnalysisCore();
    if (core && typeof core[name] === "function") {
      return core[name].bind(core);
    }
    throw new Error(t("app.core.missing", { module: "Petri analysis", name, path: "src/core/petri-analysis.js" }));
  }

  function getExportersCore() {
    const core = window.PoohExportersCore;
    return core && typeof core === "object" ? core : null;
  }

  function requireExportersCoreFunction(name) {
    const core = getExportersCore();
    if (core && typeof core[name] === "function") {
      return core[name].bind(core);
    }
    throw new Error(t("app.core.missing", { module: "exporters", name, path: "src/core/exporters.js" }));
  }

  function getFuzzyCore() {
    const core = window.PoohFuzzyCore;
    return core && typeof core === "object" ? core : null;
  }

  function requireFuzzyCoreFunction(name) {
    const core = getFuzzyCore();
    if (core && typeof core[name] === "function") {
      return core[name].bind(core);
    }
    throw new Error(t("app.core.missing", { module: "fuzzy", name, path: "src/core/fuzzy.js" }));
  }

  function formatNumber(value, digits) {
    if (!Number.isFinite(value)) {
      return "-";
    }
    return Number(value).toFixed(digits);
  }

  function formatOptionalNumber(value, digits) {
    if (value === null || value === undefined || value === "") {
      return "-";
    }
    return formatNumber(Number(value), digits);
  }

  function finiteOrNull(value) {
    if (value === null || value === undefined || value === "") {
      return null;
    }
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }

  function sanitizeExportName(value) {
    const normalized = String(value || "export")
      .trim()
      .replace(/[^\w.-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);
    return normalized || "export";
  }

  function formatInteger(value) {
    if (!Number.isFinite(value)) {
      return "-";
    }
    return String(Math.round(value));
  }

  function formatBytes(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric < 0) {
      return "-";
    }
    if (numeric < 1024) {
      return `${Math.round(numeric)} B`;
    }
    if (numeric < 1024 * 1024) {
      return `${(numeric / 1024).toFixed(1)} KB`;
    }
    return `${(numeric / (1024 * 1024)).toFixed(2)} MB`;
  }

  function formatRatio(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return "-";
    }
    return formatNumber(numeric, 4);
  }

  function formatSpeedup(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return "-";
    }
    return `${formatNumber(numeric, 2)}x`;
  }

  function buildBenchmarkRows() {
    return requireBenchmarkCoreFunction("buildBenchmarkRows")(benchmarkRecords);
  }

  function buildBenchmarkProfileRows() {
    return requireBenchmarkCoreFunction("buildBenchmarkProfileRows")(benchmarkProfileRecords);
  }

  function buildBenchmarkProfileCsv() {
    return requireBenchmarkCoreFunction("buildBenchmarkProfileCsv")(benchmarkProfileRecords);
  }

  function selectRepresentativeBenchmarkProfileRows(options) {
    return requireBenchmarkCoreFunction("selectRepresentativeBenchmarkProfileRows")(benchmarkProfileRecords, options);
  }

  function getBenchmarkStrataTargetSize() {
    if (!benchmarkStrataTargetInput) {
      return 12;
    }
    const numeric = parseInt(String(benchmarkStrataTargetInput.value || "").trim(), 10);
    if (!Number.isInteger(numeric) || numeric <= 0) {
      return 12;
    }
    return Math.max(1, Math.min(100, numeric));
  }

  function getRepresentativeBenchmarkFileNameSet() {
    const names = benchmarkRepresentativeSelection && Array.isArray(benchmarkRepresentativeSelection.selectedFileNames)
      ? benchmarkRepresentativeSelection.selectedFileNames
      : [];
    return new Set(names.map((name) => String(name || "").trim()).filter(Boolean));
  }

  function applyBenchmarkRepresentativeSelection(selection) {
    benchmarkRepresentativeSelection = selection && typeof selection === "object" ? selection : null;
    renderBenchmarkFileOptions();
    const selectedNames = getRepresentativeBenchmarkFileNameSet();
    if (benchmarkFilesSelect) {
      Array.from(benchmarkFilesSelect.options).forEach((option) => {
        option.selected = selectedNames.has(option.value);
      });
    }
    renderBenchmarkResults();
    updateWorkspaceTabs();
  }

  function selectBenchmarkRepresentativeSample(showStatus) {
    if (benchmarkProfileRecords.length === 0) {
      setBenchmarkStatus(t("app.benchmark.profileRequired"), true);
      return null;
    }
    const selection = selectRepresentativeBenchmarkProfileRows({
      targetSize: getBenchmarkStrataTargetSize(),
      includeErrors: false
    });
    if (!selection || !Array.isArray(selection.selectedFileNames) || selection.selectedFileNames.length === 0) {
      benchmarkRepresentativeSelection = selection || null;
      renderBenchmarkResults();
      setBenchmarkStatus(t("app.benchmark.sampleNoModels"), true);
      return null;
    }
    applyBenchmarkRepresentativeSelection(selection);
    if (showStatus !== false) {
      const skipped = Number(selection.skippedErrorRows && selection.skippedErrorRows.length) || 0;
      setBenchmarkStatus(t("app.benchmark.sampleSelected", {
        selected: selection.selectedFileNames.length,
        parseable: selection.parseableRows,
        skipped
      }), false);
    }
    return selection;
  }

  async function runBenchmarkRepresentativeSample() {
    const selection = benchmarkRepresentativeSelection && benchmarkRepresentativeSelection.selectedFileNames && benchmarkRepresentativeSelection.selectedFileNames.length > 0
      ? benchmarkRepresentativeSelection
      : selectBenchmarkRepresentativeSample(false);
    if (!selection || !Array.isArray(selection.selectedFileNames) || selection.selectedFileNames.length === 0) {
      setBenchmarkStatus(t("app.benchmark.sampleRequired"), true);
      return;
    }
    if (benchmarkPinvAccelerationSelect) {
      benchmarkPinvAccelerationSelect.value = "compare-cpu-webgpu";
    }
    if (benchmarkXtrecAccelerationSelect) {
      benchmarkXtrecAccelerationSelect.value = "compare-cpu-webgpu";
    }
    applyBenchmarkRepresentativeSelection(selection);
    setBenchmarkStatus(t("app.benchmark.sampleStarting", { count: selection.selectedFileNames.length }), false);
    await runBenchmarkModule();
  }

  function renderBenchmarkResults() {
    if (!benchmarkResults) {
      updateWorkspaceTabs();
      return;
    }
    const rows = buildBenchmarkRows();
    const profileRows = buildBenchmarkProfileRows();
    if (rows.length === 0 && profileRows.length === 0) {
      benchmarkResults.className = "benchmark-results hint";
      benchmarkResults.textContent = t("status.benchNoResults");
      updateWorkspaceTabs();
      return;
    }

    const profileTable = profileRows.length > 0 ? (() => {
      const parsedRows = profileRows.filter((row) => !row.error);
      const errorRows = profileRows.length - parsedRows.length;
      const totalPlaces = parsedRows.reduce((sum, row) => sum + (Number.isFinite(row.places) ? row.places : 0), 0);
      const totalTransitions = parsedRows.reduce((sum, row) => sum + (Number.isFinite(row.transitions) ? row.transitions : 0), 0);
      const totalArcs = parsedRows.reduce((sum, row) => sum + (Number.isFinite(row.arcs) ? row.arcs : 0), 0);
      const tableRows = profileRows.map((row) => `
        <tr>
          <td>${escapeHtml(row.fileName)}</td>
          <td>${escapeHtml(row.format || "-")}</td>
          <td class="num">${formatBytes(row.sizeBytes)}</td>
          <td class="num">${formatInteger(row.places)}</td>
          <td class="num">${formatInteger(row.transitions)}</td>
          <td class="num">${formatInteger(row.arcs)}</td>
          <td class="num">${formatInteger(row.markedPlaces)}</td>
          <td class="num">${formatInteger(row.tokensTotal)}</td>
          <td class="num">${formatRatio(row.arcDensity)}</td>
          <td>${escapeHtml(row.error || row.warnings || "")}</td>
        </tr>
      `).join("");
      return `
        <section class="benchmark-profile-block">
          <div class="benchmark-section-header">
            <h3>${escapeHtml(t("app.benchmark.profileTitle"))}</h3>
            <button type="button" id="benchmark-export-profile-results-csv-btn" class="secondary">${escapeHtml(t("app.benchmark.exportProfileCsv"))}</button>
          </div>
          <p class="hint">${escapeHtml(t("app.benchmark.profileSummary", {
            files: profileRows.length,
            valid: parsedRows.length,
            errors: errorRows,
            places: formatInteger(totalPlaces),
            transitions: formatInteger(totalTransitions),
            arcs: formatInteger(totalArcs)
          }))}</p>
          <table class="benchmark-table">
            <thead>
              <tr>
                <th>${escapeHtml(t("app.benchmark.file"))}</th>
                <th>${escapeHtml(t("app.benchmark.format"))}</th>
                <th>${escapeHtml(t("app.benchmark.size"))}</th>
                <th>|P|</th>
                <th>|T|</th>
                <th>${escapeHtml(t("app.benchmark.arcs"))}</th>
                <th>${escapeHtml(t("app.benchmark.marked"))}</th>
                <th>${escapeHtml(t("app.benchmark.tokens"))}</th>
                <th>${escapeHtml(t("app.benchmark.density"))}</th>
                <th>${escapeHtml(t("app.benchmark.warnings"))}</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
        </section>
      `;
    })() : "";

    const representativeTable = benchmarkRepresentativeSelection
      && Array.isArray(benchmarkRepresentativeSelection.selectedRows)
      && benchmarkRepresentativeSelection.selectedRows.length > 0
      ? (() => {
        const selectedRows = benchmarkRepresentativeSelection.selectedRows;
        const skippedErrors = Array.isArray(benchmarkRepresentativeSelection.skippedErrorRows)
          ? benchmarkRepresentativeSelection.skippedErrorRows
          : [];
        const strataSummary = benchmarkRepresentativeSelection.selectedSizeStrata || {};
        const strataText = Object.keys(strataSummary)
          .sort()
          .map((key) => `${key}=${strataSummary[key]}`)
          .join(", ");
        const skippedText = skippedErrors.length > 0
          ? t("app.benchmark.skippedInputs", {
              files: `${skippedErrors.slice(0, 5).map((row) => row.fileName).join(", ")}${skippedErrors.length > 5 ? "..." : ""}`
            })
          : "";
        const selectedRowsHtml = selectedRows.map((row) => `
          <tr>
            <td class="num">${formatInteger(row.rank)}</td>
            <td>${escapeHtml(row.fileName)}</td>
            <td>${escapeHtml(row.sizeStratum || "-")}</td>
            <td>${escapeHtml(row.selectionReason || "-")}</td>
            <td class="num">${formatInteger(row.places)}</td>
            <td class="num">${formatInteger(row.transitions)}</td>
            <td class="num">${formatInteger(row.arcs)}</td>
            <td class="num">${formatRatio(row.arcDensity)}</td>
            <td>${escapeHtml(row.warnings || "")}</td>
          </tr>
        `).join("");
        return `
          <section class="benchmark-profile-block">
            <div class="benchmark-section-header">
              <h3>${escapeHtml(t("app.benchmark.representativeTitle"))}</h3>
            </div>
            <p class="hint">${escapeHtml(t("app.benchmark.representativeSummary", {
              selected: selectedRows.length,
              parseable: benchmarkRepresentativeSelection.parseableRows,
              target: benchmarkRepresentativeSelection.targetSize,
              strata: strataText || "-"
            }))}${escapeHtml(skippedText)}</p>
            <table class="benchmark-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>${escapeHtml(t("app.benchmark.file"))}</th>
                  <th>${escapeHtml(t("app.benchmark.stratum"))}</th>
                  <th>${escapeHtml(t("app.benchmark.selectionReason"))}</th>
                  <th>|P|</th>
                  <th>|T|</th>
                  <th>${escapeHtml(t("app.benchmark.arcs"))}</th>
                  <th>${escapeHtml(t("app.benchmark.density"))}</th>
                  <th>${escapeHtml(t("app.benchmark.warnings"))}</th>
                </tr>
              </thead>
              <tbody>${selectedRowsHtml}</tbody>
            </table>
          </section>
        `;
      })()
      : "";

    let benchmarkTable = "";
    const tableRows = rows.map((row) => {
      const status = row.failedRuns > 0 ? `${row.okRuns}/${row.repeats}` : `${row.okRuns}`;
      const errorCell = row.failedRuns > 0 ? escapeHtml(row.lastError) : "";
      return `
        <tr>
          <td>${escapeHtml(row.fileName)}</td>
          <td class="num">${escapeHtml(status)}</td>
          <td class="num">${formatInteger(row.places)}</td>
          <td class="num">${formatInteger(row.transitions)}</td>
          <td class="num">${formatInteger(row.invariantsCount)}</td>
          <td class="num time-metric">${formatNumber(row.pinvariantMsMedian, 3)}</td>
          <td class="num time-metric">${formatNumber(row.transposeMsMedian, 3)}</td>
          <td class="num time-metric">${formatNumber(row.fraMsMedian, 3)}</td>
          <td class="num time-metric">${formatNumber(row.selectionMsMedian, 3)}</td>
          <td class="num time-metric">${formatNumber(row.xtrecMsMedian, 3)}</td>
          <td class="num ops-metric">${formatInteger(row.pinvariantDotOpsMean + row.pinvariantCombinationOpsMean)}</td>
          <td class="num ops-metric">${formatInteger(row.selectionOpsMean)}</td>
          <td class="num ops-metric">${formatInteger(row.xtrecTotalOpsMean)}</td>
          <td>${escapeHtml(row.pinvariantAccelerationRequested)}</td>
          <td>${escapeHtml(row.pinvariantAccelerationUsed)}</td>
          <td class="num speedup-metric">${formatSpeedup(row.pinvariantSpeedupVsCpu)}</td>
          <td>${escapeHtml(row.xtClass)}</td>
          <td>${escapeHtml(row.xtrecAccelerationRequested)}</td>
          <td>${escapeHtml(row.xtrecAccelerationUsed)}</td>
          <td class="num speedup-metric">${formatSpeedup(row.xtrecSpeedupVsCpu)}</td>
          <td class="condition-metric">${escapeHtml(row.structuralXtCertified)}</td>
          <td class="condition-metric">${escapeHtml(row.structuralXtR1)}</td>
          <td class="condition-metric">${escapeHtml(row.structuralXtR2)}</td>
          <td class="condition-metric">${escapeHtml(row.structuralXtR3)}</td>
          <td class="condition-metric">${escapeHtml(row.structuralXtR4)}</td>
          <td class="condition-metric">${escapeHtml(row.structuralXtR5)}</td>
          <td class="condition-metric">${escapeHtml(row.structuralXtR6)}</td>
          <td>${errorCell}</td>
        </tr>
      `;
    }).join("");

    if (rows.length > 0) {
      benchmarkTable = `
      <table class="benchmark-table">
        <thead>
          <tr>
            <th rowspan="2" title="${escapeHtml(t("app.benchmark.table.benchmarkTitle"))}">Benchmark</th>
            <th rowspan="2" title="${escapeHtml(t("app.benchmark.table.okTitle"))}">OK</th>
            <th rowspan="2" title="${escapeHtml(t("app.benchmark.table.placesTitle"))}">|P|</th>
            <th rowspan="2" title="${escapeHtml(t("app.benchmark.table.transitionsTitle"))}">|T|</th>
            <th rowspan="2" title="${escapeHtml(t("app.benchmark.table.invariantsTitle"))}">Inv</th>
            <th colspan="5" class="benchmark-group-head" title="${escapeHtml(t("app.benchmark.table.timeTitle"))}">${escapeHtml(t("app.benchmark.table.time"))}</th>
            <th colspan="3" class="benchmark-group-head" title="${escapeHtml(t("app.benchmark.table.operationsTitle"))}">${escapeHtml(t("app.benchmark.table.operations"))}</th>
            <th colspan="3" class="benchmark-group-head" title="${escapeHtml(t("app.benchmark.table.msAccelerationTitle"))}">${escapeHtml(t("app.benchmark.table.msAcceleration"))}</th>
            <th rowspan="2" title="${escapeHtml(t("app.benchmark.table.xtTitle"))}">XT</th>
            <th colspan="3" class="benchmark-group-head" title="${escapeHtml(t("app.benchmark.table.xtrecAccelerationTitle"))}">${escapeHtml(t("app.benchmark.table.xtrecAcceleration"))}</th>
            <th colspan="7" class="benchmark-group-head" title="${escapeHtml(t("app.benchmark.table.xtConditionsTitle"))}">${escapeHtml(t("app.benchmark.table.xtConditions"))}</th>
            <th rowspan="2" title="${escapeHtml(t("app.benchmark.table.errorTitle"))}">${escapeHtml(t("app.benchmark.table.error"))}</th>
          </tr>
          <tr>
            <th title="${escapeHtml(t("app.benchmark.table.msTimeTitle"))}">MS</th>
            <th title="${escapeHtml(t("app.benchmark.table.transposeTimeTitle"))}">Tr</th>
            <th title="${escapeHtml(t("app.benchmark.table.fraTimeTitle"))}">FRA</th>
            <th title="${escapeHtml(t("app.benchmark.table.hypergraphTimeTitle"))}">Hsel</th>
            <th title="${escapeHtml(t("app.benchmark.table.xtrecTimeTitle"))}">XTREC</th>
            <th title="${escapeHtml(t("app.benchmark.table.msOpsTitle"))}">Ops MS</th>
            <th title="${escapeHtml(t("app.benchmark.table.fraOpsTitle"))}">Ops Tr+FRA</th>
            <th title="${escapeHtml(t("app.benchmark.table.xtrecOpsTitle"))}">Ops XTREC</th>
            <th title="${escapeHtml(t("app.benchmark.table.requestedTitle"))}">Req</th>
            <th title="${escapeHtml(t("app.benchmark.table.usedTitle"))}">Used</th>
            <th title="${escapeHtml(t("app.benchmark.table.speedupTitle"))}">xCPU</th>
            <th title="${escapeHtml(t("app.benchmark.table.requestedTitle"))}">Req</th>
            <th title="${escapeHtml(t("app.benchmark.table.usedTitle"))}">Used</th>
            <th title="${escapeHtml(t("app.benchmark.table.speedupTitle"))}">xCPU</th>
            <th title="${escapeHtml(t("app.benchmark.table.certificateTitle"))}">Cert</th>
            <th title="R1: module disjointness.">R1</th>
            <th title="R2: duplicate/dominance reduction.">R2</th>
            <th title="R3: laminarity / avoidance of partial overlaps.">R3</th>
            <th title="${escapeHtml(t("app.benchmark.table.r4Title"))}">R4</th>
            <th title="R5: bounded multiplicity / star forest.">R5</th>
            <th title="R6: safety and liveness assumptions.">R6</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
    `;
    }
    benchmarkResults.className = "benchmark-results";
    benchmarkResults.innerHTML = `${profileTable}${representativeTable}${benchmarkTable}`;
    updateWorkspaceTabs();
  }

  function renderBenchmarkFileOptions() {
    if (!benchmarkFilesSelect) {
      return;
    }
    const previous = Array.from(benchmarkFilesSelect.selectedOptions).map((option) => option.value);
    benchmarkFilesSelect.innerHTML = "";

    const allFiles = getSortedBenchmarkFileItems();
    let files = getVisibleBenchmarkFileItems(allFiles);
    const requiredNames = new Set(previous.filter(Boolean));
    getRepresentativeBenchmarkFileNameSet().forEach((name) => requiredNames.add(name));
    if (requiredNames.size > 0) {
      const visibleNames = new Set(files.map((fileItem) => String(fileItem && fileItem.name ? fileItem.name : "")));
      const extraFiles = allFiles.filter((fileItem) => {
        const name = String(fileItem && fileItem.name ? fileItem.name : "");
        return requiredNames.has(name) && !visibleNames.has(name);
      });
      if (extraFiles.length > 0) {
        files = files.concat(extraFiles).sort((a, b) =>
          String((a && a.name) || "").localeCompare(
            String((b && b.name) || ""),
            "pl",
            { numeric: true, sensitivity: "base" }
          )
        );
      }
    }

    if (allFiles.length === 0) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = t("app.benchmark.noPnhFiles");
      benchmarkFilesSelect.appendChild(option);
      benchmarkFilesSelect.disabled = true;
      updateBenchmarkFileFilterStatus(files.length, allFiles.length);
      return;
    }

    if (files.length === 0) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = t("app.benchmark.noFilteredFiles");
      benchmarkFilesSelect.appendChild(option);
      benchmarkFilesSelect.disabled = true;
      updateBenchmarkFileFilterStatus(files.length, allFiles.length);
      return;
    }

    benchmarkFilesSelect.disabled = benchmarkIsRunning;
    files.forEach((fileItem) => {
      const option = document.createElement("option");
      option.value = fileItem.name;
      const representativeSuffix = getRepresentativeBenchmarkFileNameSet().has(fileItem.name) ? t("app.benchmark.sampleSuffix") : "";
      option.textContent = `${fileItem.name}${representativeSuffix} (${formatBytes(fileItem.size)})`;
      option.selected = previous.includes(fileItem.name) || getRepresentativeBenchmarkFileNameSet().has(fileItem.name);
      benchmarkFilesSelect.appendChild(option);
    });
    updateBenchmarkFileFilterStatus(files.length, allFiles.length);
  }

  function getSortedBenchmarkFileItems() {
    return (state.library.files || [])
      .slice()
      .sort((a, b) =>
        String((a && a.name) || "").localeCompare(
          String((b && b.name) || ""),
          "pl",
          { numeric: true, sensitivity: "base" }
        )
      );
  }

  function getBenchmarkFileFilterText() {
    return String(benchmarkFileFilterInput ? benchmarkFileFilterInput.value : "").trim().toLocaleLowerCase("pl");
  }

  function getBenchmarkFileLimit() {
    if (!benchmarkFileLimitInput) {
      return null;
    }
    const raw = String(benchmarkFileLimitInput.value || "").trim();
    if (!raw) {
      return null;
    }
    const numeric = parseInt(raw, 10);
    if (!Number.isInteger(numeric) || numeric <= 0) {
      return null;
    }
    return Math.min(1000, numeric);
  }

  function getVisibleBenchmarkFileItems(allFiles) {
    const filter = getBenchmarkFileFilterText();
    const limit = getBenchmarkFileLimit();
    let files = (Array.isArray(allFiles) ? allFiles : getSortedBenchmarkFileItems()).filter((fileItem) => {
      const name = String(fileItem && fileItem.name ? fileItem.name : "");
      return !filter || name.toLocaleLowerCase("pl").includes(filter);
    });
    if (limit !== null) {
      files = files.slice(0, limit);
    }
    return files;
  }

  function updateBenchmarkFileFilterStatus(visibleCount, totalCount) {
    if (!benchmarkFileFilterStatus) {
      return;
    }
    const filter = getBenchmarkFileFilterText();
    const limit = getBenchmarkFileLimit();
    const filterPart = filter ? `, filtr="${filter}"` : "";
    const limitPart = limit !== null ? `, limit=${limit}` : ", bez limitu";
    const representativeCount = getRepresentativeBenchmarkFileNameSet().size;
    const representativePart = representativeCount > 0 ? t("app.benchmark.samplePart", { count: representativeCount }) : "";
    benchmarkFileFilterStatus.textContent = t("app.benchmark.filterStatus", {
      visible: visibleCount,
      total: totalCount,
      filter: filterPart,
      limit: limitPart,
      sample: representativePart
    });
  }

  function getSelectedBenchmarkFileNames() {
    if (!benchmarkFilesSelect || benchmarkFilesSelect.disabled) {
      return [];
    }
    const selected = Array.from(benchmarkFilesSelect.selectedOptions)
      .map((option) => String(option.value || "").trim())
      .filter(Boolean);
    if (selected.length > 0) {
      return selected;
    }
    return getVisibleBenchmarkFileItems()
      .map((fileItem) => String(fileItem.name || ""))
      .filter(Boolean);
  }

  function downloadTextFile(filename, content, mimeType) {
    const blob = new Blob([String(content || "")], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function buildBenchmarkCsv() {
    return requireBenchmarkCoreFunction("buildBenchmarkCsv")(benchmarkRecords);
  }

  function buildBenchmarkLatexTable() {
    return requireBenchmarkCoreFunction("buildBenchmarkLatexTable")(benchmarkRecords);
  }

  function naturalLabelCompare(a, b) {
    const aText = String(a || "");
    const bText = String(b || "");
    const aMatch = /^([A-Za-z_]+)(\d+)$/.exec(aText);
    const bMatch = /^([A-Za-z_]+)(\d+)$/.exec(bText);
    if (aMatch && bMatch) {
      const prefixCmp = aMatch[1].localeCompare(bMatch[1], "pl", { sensitivity: "base" });
      if (prefixCmp !== 0) {
        return prefixCmp;
      }
      const aNum = parseInt(aMatch[2], 10);
      const bNum = parseInt(bMatch[2], 10);
      if (aNum !== bNum) {
        return aNum - bNum;
      }
    }
    return aText.localeCompare(bText, "pl", { numeric: true, sensitivity: "base" });
  }

  function computeSelectionHypergraphFromPinvariants(pinvariantResult) {
    return requireSelectionHypergraphCoreFunction("buildSelectionHypergraphFromPinvariants")(pinvariantResult);
  }

  function normalizeSelectionHypergraphVariant(value) {
    return String(value || "").toLowerCase() === "original" ? "original" : "reduced";
  }

  function getSelectionHypergraphDrawVariant() {
    return normalizeSelectionHypergraphVariant(
      selectionHypergraphViewSelect ? selectionHypergraphViewSelect.value : "reduced"
    );
  }

  function selectionHypergraphVariantLabel(variant) {
    return t(normalizeSelectionHypergraphVariant(variant) === "original"
      ? "app.selection.beforeFra"
      : "app.selection.afterFra");
  }

  function getSelectionHypergraphVariantData(result, variant) {
    const safe = result && typeof result === "object" ? result : {};
    const modeName = normalizeSelectionHypergraphVariant(variant);
    if (modeName === "original") {
      return {
        variant: "original",
        sourceLabel: "original",
        displayLabel: t("app.selection.beforeFra"),
        matrix: Array.isArray(safe.originalDualMatrix) ? safe.originalDualMatrix.map((row) => row.slice()) : [],
        rowLabels: Array.isArray(safe.originalRowLabels) ? safe.originalRowLabels.slice() : [],
        colLabels: Array.isArray(safe.originalColLabels) ? safe.originalColLabels.slice() : [],
        componentPlaces: safe.originalComponentPlaces || safe.subnetPlaceMap || null,
        xtrec: safe.xtrecOriginal || null
      };
    }
    return {
      variant: "reduced",
      sourceLabel: "reduced",
      displayLabel: t("app.selection.afterFra"),
      matrix: Array.isArray(safe.reducedDualMatrix) ? safe.reducedDualMatrix.map((row) => row.slice()) : [],
      rowLabels: Array.isArray(safe.reducedRowLabels) ? safe.reducedRowLabels.slice() : [],
      colLabels: Array.isArray(safe.reducedColLabels) ? safe.reducedColLabels.slice() : [],
      componentPlaces: safe.reducedComponentPlaces || null,
      xtrec: safe.xtrec || null
    };
  }

  function buildSelectionFraResultForEditor(result) {
    if (!result || !Array.isArray(result.originalDualMatrix) || !Array.isArray(result.reducedDualMatrix)) {
      return null;
    }
    const originalRowLabels = Array.isArray(result.originalRowLabels) ? result.originalRowLabels.slice() : [];
    const originalColLabels = Array.isArray(result.originalColLabels) ? result.originalColLabels.slice() : [];
    const reducedRowLabels = Array.isArray(result.reducedRowLabels) ? result.reducedRowLabels.slice() : [];
    const reducedColLabels = Array.isArray(result.reducedColLabels) ? result.reducedColLabels.slice() : [];
    const reducedRowSet = new Set(reducedRowLabels.map(String));
    const reducedColSet = new Set(reducedColLabels.map(String));
    return {
      originalMatrix: result.originalDualMatrix.map((row) => row.slice()),
      originalRowLabels,
      originalColLabels,
      reducedMatrix: result.reducedDualMatrix.map((row) => row.slice()),
      reducedRowLabels,
      reducedColLabels,
      removedRowLabels: originalRowLabels.filter((label) => !reducedRowSet.has(String(label))),
      removedColLabels: originalColLabels.filter((label) => !reducedColSet.has(String(label))),
      essentialLabels: Array.isArray(result.essentialLabels) ? result.essentialLabels.slice() : [],
      metrics: result.metrics && result.metrics.fra ? { ...result.metrics.fra } : {}
    };
  }

  function computeHypergraphEditorVertexPositions(labels) {
    const safeLabels = Array.isArray(labels) ? labels.map(String) : [];
    const positions = new Map();
    if (safeLabels.length === 0) {
      return positions;
    }
    const cx = HYPERGRAPH_CANVAS_W / 2;
    const cy = HYPERGRAPH_CANVAS_H / 2;
    if (safeLabels.length === 1) {
      positions.set(safeLabels[0], { x: cx, y: cy });
      return positions;
    }
    if (safeLabels.length <= 18) {
      const radius = Math.max(150, Math.min(HYPERGRAPH_CANVAS_W, HYPERGRAPH_CANVAS_H) * 0.34);
      safeLabels.forEach((label, index) => {
        const angle = ((Math.PI * 2) / safeLabels.length) * index - Math.PI / 2;
        positions.set(label, {
          x: cx + Math.cos(angle) * radius,
          y: cy + Math.sin(angle) * radius
        });
      });
      return positions;
    }
    const cols = Math.ceil(Math.sqrt(safeLabels.length * 1.45));
    const rows = Math.ceil(safeLabels.length / cols);
    const x0 = 100;
    const y0 = 105;
    const xGap = (HYPERGRAPH_CANVAS_W - 200) / Math.max(1, cols - 1);
    const yGap = (HYPERGRAPH_CANVAS_H - 210) / Math.max(1, rows - 1);
    safeLabels.forEach((label, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      positions.set(label, {
        x: x0 + col * xGap,
        y: y0 + row * yGap
      });
    });
    return positions;
  }

  function buildHypergraphEditorStateFromMatrix(matrix, rowLabels, colLabels) {
    const safeMatrix = Array.isArray(matrix) ? matrix : [];
    const safeRows = Array.isArray(rowLabels) ? rowLabels.map(String) : [];
    const safeCols = Array.isArray(colLabels) ? colLabels.map(String) : [];
    const positions = computeHypergraphEditorVertexPositions(safeCols);
    const vertices = safeCols.map((label, index) => {
      const point = positions.get(label) || { x: HYPERGRAPH_CANVAS_W / 2, y: HYPERGRAPH_CANVAS_H / 2 };
      return {
        id: `sel-v-${index + 1}`,
        label,
        x: point.x,
        y: point.y
      };
    });
    const vertexIdByLabel = new Map(vertices.map((vertex) => [String(vertex.label), vertex.id]));
    const edges = safeMatrix.map((row, rowIndex) => {
      const vertexIds = safeCols
        .filter((_, colIndex) => Number((Array.isArray(row) ? row : [])[colIndex] || 0) > 0)
        .map((label) => vertexIdByLabel.get(String(label)))
        .filter(Boolean);
      return {
        id: `sel-e-${rowIndex + 1}`,
        label: safeRows[rowIndex] || `E${rowIndex + 1}`,
        vertexIds
      };
    }).filter((edge) => edge.vertexIds.length > 0);
    return {
      vertices,
      edges,
      counters: {
        vertex: vertices.length + 1,
        edge: edges.length + 1
      },
      view: {
        zoom: 1,
        panX: 0,
        panY: 0
      }
    };
  }

  function addSelectionTransversalCandidate(candidates, seen, labels, solution, kind, fallbackIndex) {
    if (!solution || !solution.found || !solution.coversAll || !Array.isArray(solution.solutionLabels)) {
      return;
    }
    const indices = hypergraphLabelsToIndices(solution.solutionLabels, labels);
    if (indices.length === 0) {
      return;
    }
    const method = String(solution.method || solution.name || kind || "transversal");
    const key = `${method}:${indices.join(",")}:${solution.exact ? "x" : "t"}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    candidates.push(makeHypergraphTransversalEntry(
      indices,
      Boolean(solution.exact),
      Number.isFinite(Number(fallbackIndex)) ? Number(fallbackIndex) : candidates.length,
      "selection",
      null,
      {
        method,
        source: kind,
        type: solution.type || (solution.exact ? "exact" : "regular"),
        runtimeMs: solution.runtimeMs,
        size: solution.size
      }
    ));
  }

  function buildSelectionTransversalView(result, variantData) {
    const labels = Array.isArray(variantData && variantData.colLabels) ? variantData.colLabels.slice() : [];
    const summary = result && result.transversal ? result.transversal : null;
    const candidates = [];
    const seen = new Set();
    if (!summary || !summary.results) {
      return { labels, candidates };
    }
    if (summary.recommended && summary.recommended.found) {
      addSelectionTransversalCandidate(candidates, seen, labels, summary.recommended, "recommended", 0);
    }
    const executed = Array.isArray(summary.executed) ? summary.executed.slice() : Object.keys(summary.results || {});
    executed.forEach((key, index) => {
      addSelectionTransversalCandidate(candidates, seen, labels, summary.results[key], key, index + 1);
    });
    if (summary.bestExact && summary.bestExact.found) {
      addSelectionTransversalCandidate(candidates, seen, labels, summary.bestExact, "bestExact", candidates.length);
    }
    if (summary.bestRegular && summary.bestRegular.found) {
      addSelectionTransversalCandidate(candidates, seen, labels, summary.bestRegular, "bestRegular", candidates.length);
    }
    return { labels, candidates };
  }

  function transversalMethodLabel(methodName) {
    const safe = String(methodName || "").toLowerCase().replace(/[^a-z]/g, "");
    if (safe === "xtr") {
      return "XTR (Eiter)";
    }
    if (safe === "dlx") {
      return "DLX (Algorithm X)";
    }
    if (safe === "backtrackingexact") {
      return "Backtracking (dokladna)";
    }
    if (safe === "backtrackingregular") {
      return "Backtracking (zwykla)";
    }
    if (safe === "greedy") {
      return "Greedy";
    }
    return String(methodName || "Metoda");
  }

  function formatSelectionHypergraphOutput(result) {
    return requireExportersCoreFunction("formatSelectionHypergraphOutput")(result);
  }

  function parseManualHypergraphText(text) {
    return requireHypergraphCoreFunction("parseManualHypergraphText")(text);
  }

  function formatManualHypergraphOutput(result) {
    return requireExportersCoreFunction("formatManualHypergraphOutput")(result, {
      emptyText: t("status.manualHypergraphOutputNone")
    });
  }

  function showHypergraphInDecomposition(mode) {
    if (decompositionViewModeSelect) {
      decompositionViewModeSelect.value = normalizeDecompositionViewMode(mode);
    }
    decompositionSelectionLabel = "";
    setActiveWorkspaceTab("decomposition");
    syncDecompositionSubnetOptions();
    refreshDecompositionView();
  }

  function selectionXtrecStatusText(xtrec) {
    return xtrec && typeof xtrec.isXt === "boolean"
      ? t("app.selection.xtStatus", {
          value: t(xtrec.isXt ? "app.hypergraph.yes" : "app.hypergraph.no"),
          acceleration: String(xtrec.accelerationUsed || "cpu").toUpperCase()
        })
      : t("app.selection.xtUnchecked");
  }

  function ensureSelectionHypergraphResultForDrawing() {
    if (!lastSelectionHypergraphResult && !pendingSelectionHypergraphResult) {
      if (!lastPinvariantResult) {
        throw new Error(t("app.selection.stepOneRequired"));
      }
      lastSelectionHypergraphResult = {
        ...computeSelectionHypergraphFromPinvariants(lastPinvariantResult),
        xtrecPending: false,
        transversalPending: false
      };
      lastSelectionHypergraphResult = withSelectionStructuralXt(lastSelectionHypergraphResult);
      setSelectionHypergraphOutput(formatSelectionHypergraphOutput(lastSelectionHypergraphResult));
      setSelectionHypergraphStatus(t("app.selection.drawnWithoutXtrec"), false);
    }
    return lastSelectionHypergraphResult || pendingSelectionHypergraphResult;
  }

  function hideSelectionHypergraphComparison() {
    if (selectionHypergraphComparisonPanel) {
      selectionHypergraphComparisonPanel.classList.add("hidden");
    }
  }

  function hypergraphMatrixIncidenceCount(matrix) {
    return (Array.isArray(matrix) ? matrix : []).reduce((sum, row) => (
      sum + (Array.isArray(row) ? row : []).reduce((rowSum, cell) => rowSum + (Number(cell || 0) > 0 ? 1 : 0), 0)
    ), 0);
  }

  function setSelectionHypergraphComparisonSummary(target, variantData, fraResult) {
    if (!target) {
      return;
    }
    const data = variantData && typeof variantData === "object" ? variantData : {};
    const matrix = Array.isArray(data.matrix) ? data.matrix : [];
    const rows = Array.isArray(data.rowLabels) ? data.rowLabels : [];
    const cols = Array.isArray(data.colLabels) ? data.colLabels : [];
    const incidence = hypergraphMatrixIncidenceCount(matrix);
    const lines = [
      `|V|=${formatInteger(cols.length)}, |E|=${formatInteger(rows.length)}, incydencje=${formatInteger(incidence)}`,
      selectionXtrecStatusText(data.xtrec)
    ];
    if (data.variant === "reduced" && fraResult) {
      lines.push(t("app.selection.fraRemoved", {
        edges: formatInteger((fraResult.removedRowLabels || []).length),
        vertices: formatInteger((fraResult.removedColLabels || []).length)
      }));
    }
    target.textContent = lines.join("\n");
  }

  function drawSelectionHypergraphStaticSvg(svgElement, variantData) {
    if (!svgElement) {
      return;
    }
    svgElement.innerHTML = "";
    const background = document.createElementNS(NS, "rect");
    background.setAttribute("x", "0");
    background.setAttribute("y", "0");
    background.setAttribute("width", String(HYPERGRAPH_CANVAS_W));
    background.setAttribute("height", String(HYPERGRAPH_CANVAS_H));
    background.setAttribute("class", "canvas-bg");
    svgElement.appendChild(background);

    const data = variantData && typeof variantData === "object" ? variantData : {};
    const state = buildHypergraphEditorStateFromMatrix(data.matrix || [], data.rowLabels || [], data.colLabels || []);
    const nodeById = new Map(state.vertices.map((vertex) => [vertex.id, vertex]));
    state.edges.forEach((edge, index) => {
      const points = (edge.vertexIds || [])
        .map((vertexId) => nodeById.get(vertexId))
        .filter(Boolean)
        .map((vertex) => ({ x: vertex.x, y: vertex.y }));
      if (!points.length) {
        return;
      }
      const color = hypergraphColor(index);
      let shape = null;
      if (points.length === 1) {
        shape = document.createElementNS(NS, "ellipse");
        shape.setAttribute("cx", String(points[0].x));
        shape.setAttribute("cy", String(points[0].y));
        shape.setAttribute("rx", "70");
        shape.setAttribute("ry", "60");
      } else {
        shape = document.createElementNS(NS, "path");
        shape.setAttribute("d", points.length === 2
          ? capsulePath(points[0], points[1], 58)
          : roundedPolygonPath(expandPointsToDiskHull(points, 44, 18)));
      }
      shape.setAttribute("class", "hypergraph-editor-edge");
      shape.setAttribute("fill", color);
      shape.setAttribute("stroke", color);
      svgElement.appendChild(shape);

      const labelPoint = hyperedgeCentroid(points);
      const label = document.createElementNS(NS, "text");
      label.setAttribute("x", String(labelPoint.x));
      label.setAttribute("y", String(labelPoint.y));
      label.setAttribute("class", "hypergraph-editor-edge-label");
      label.setAttribute("fill", color);
      label.textContent = String(edge.label || `E${index + 1}`);
      svgElement.appendChild(label);
    });

    state.vertices.forEach((vertex) => {
      const circle = document.createElementNS(NS, "circle");
      circle.setAttribute("cx", String(vertex.x));
      circle.setAttribute("cy", String(vertex.y));
      circle.setAttribute("r", "30");
      circle.setAttribute("class", "hypergraph-editor-vertex");
      svgElement.appendChild(circle);

      const label = document.createElementNS(NS, "text");
      label.setAttribute("x", String(vertex.x));
      label.setAttribute("y", String(vertex.y));
      label.setAttribute("class", "hypergraph-editor-vertex-label");
      label.textContent = String(vertex.label || vertex.id);
      svgElement.appendChild(label);
    });
  }

  function showSelectionHypergraphComparison(result) {
    const safeResult = result && typeof result === "object" ? result : {};
    const originalData = getSelectionHypergraphVariantData(safeResult, "original");
    const reducedData = getSelectionHypergraphVariantData(safeResult, "reduced");
    if (!originalData.matrix.length || !originalData.colLabels.length) {
      throw new Error(t("app.selection.originalMissing"));
    }
    if (!reducedData.matrix.length || !reducedData.colLabels.length) {
      throw new Error(t("app.selection.reducedMissing"));
    }
    const fraResult = buildSelectionFraResultForEditor(safeResult);
    setElementText(selectionHypergraphComparisonTitle, "selection.compare.title");
    setElementText(selectionHypergraphComparisonNote, "selection.compare.note");
    setElementText(selectionHypergraphBeforeTitle, "selection.compare.before");
    setElementText(selectionHypergraphAfterTitle, "selection.compare.after");
    drawSelectionHypergraphStaticSvg(selectionHypergraphBeforeSvg, originalData);
    drawSelectionHypergraphStaticSvg(selectionHypergraphAfterSvg, reducedData);
    setSelectionHypergraphComparisonSummary(selectionHypergraphBeforeSummary, originalData, fraResult);
    setSelectionHypergraphComparisonSummary(selectionHypergraphAfterSummary, reducedData, fraResult);
    if (selectionHypergraphComparisonPanel) {
      selectionHypergraphComparisonPanel.classList.remove("hidden");
    }
    setActiveWorkspaceTab("hypergraph");
    const status = t("app.selection.comparison", {
      before: `${originalData.rowLabels.length}x${originalData.colLabels.length}`,
      after: `${reducedData.rowLabels.length}x${reducedData.colLabels.length}`
    });
    setHypergraphEditorStatus(status, false);
    setSelectionHypergraphStatus(status, false);
  }

  function importSelectionHypergraphToEditor(result, variant) {
    const variantData = getSelectionHypergraphVariantData(result, variant);
    if (!variantData.matrix.length || !variantData.colLabels.length) {
      throw new Error(t("app.selection.variantMissing", { variant: selectionHypergraphVariantLabel(variant) }));
    }
    const originalData = getSelectionHypergraphVariantData(result, "original");
    const baseData = originalData.matrix.length && originalData.colLabels.length
      ? originalData
      : variantData;

    const editorState = buildHypergraphEditorStateFromMatrix(
      baseData.matrix,
      baseData.rowLabels,
      baseData.colLabels
    );
    applyHypergraphEditorState(editorState);
    hypergraphEditorSourceInfo = {
      type: "selection",
      variant: variantData.variant
    };
    hypergraphReducedResult = buildSelectionFraResultForEditor(result);
    hypergraphShowReduced = variantData.variant === "reduced" && Boolean(hypergraphReducedResult);
    hypergraphSelectedVertexId = null;
    hypergraphSelectedEdgeId = null;
    hypergraphPendingEdgeVertexIds.clear();
    hypergraphEditorAnalysis = {
      xtrec: variantData.xtrec && typeof variantData.xtrec.isXt === "boolean"
        ? { ...variantData.xtrec, sourceLabel: variantData.sourceLabel }
        : null,
      transversal: null,
      exactTransversal: null,
      allTransversals: null,
      rExact: null,
      structure: null,
      cExact: null,
      structuralXt: null
    };
    setHypergraphRExactSummary("");
    setHypergraphStructureSummary("");
    setHypergraphCExactSummary("");
    setHypergraphStructuralXtSummary("");

    const view = buildSelectionTransversalView(result, variantData);
    hypergraphTransversalView = {
      mode: "selection",
      labels: view.labels.slice(),
      candidates: view.candidates,
      selectedIndex: view.candidates.length > 0 ? 0 : -1
    };
    if (view.candidates.length > 0) {
      applyHypergraphTransversalSelection(0, false);
    } else {
      syncHypergraphTransversalPicker();
    }

    if (hypergraphToggleReducedBtn) {
      hypergraphToggleReducedBtn.disabled = !hypergraphReducedResult;
      hypergraphToggleReducedBtn.textContent = hypergraphShowReduced
        ? t("hypergraphEditor.showOriginal")
        : t("hypergraphEditor.showReduced");
    }

    try {
      const structuralXt = analyzeStructuralXtInput({
        source: "selection",
        matrix: variantData.matrix,
        rowLabels: variantData.rowLabels,
        colLabels: variantData.colLabels,
        componentPlaces: variantData.componentPlaces || null,
        petri: getSelectionPetriAssumptions(),
        xtrec: hypergraphEditorAnalysis.xtrec,
        reduction: hypergraphReducedResult || null
      });
      hypergraphEditorAnalysis.structuralXt = structuralXt;
      renderHypergraphStructuralXtSummary(structuralXt);
    } catch (error) {
      setHypergraphStructuralXtSummary(error instanceof Error ? error.message : t("app.hypergraph.structuralCheckFailed"), true);
    }

    syncManualHypergraphResultFromEditor();
    persistHypergraphEditorState();
    setActiveWorkspaceTab("hypergraph");
    ensureHypergraphResultsVisible();
    refreshHypergraphEditorText();
    renderHypergraphEditor();
    const transversalCount = view.candidates.length;
    const xtrecText = selectionXtrecStatusText(hypergraphEditorAnalysis.xtrec);
    const status = t("app.selection.drawn", {
      variant: variantData.displayLabel,
      xtrec: xtrecText,
      count: formatInteger(transversalCount)
    });
    setHypergraphEditorStatus(status, false);
    setSelectionHypergraphStatus(status, false);
  }

  function syncSelectionHypergraphXtrecFromEditor(data, xtrec) {
    if (!hypergraphEditorSourceInfo || hypergraphEditorSourceInfo.type !== "selection") {
      return;
    }
    const base = lastSelectionHypergraphResult || pendingSelectionHypergraphResult;
    if (!base || !xtrec || typeof xtrec.isXt !== "boolean") {
      return;
    }
    const sourceLabel = String(data && data.sourceLabel ? data.sourceLabel : "");
    const variant = sourceLabel === "original" ? "original" : "reduced";
    const updated = withSelectionStructuralXt({
      ...base,
      xtrec: variant === "reduced" ? { ...xtrec } : base.xtrec || null,
      xtrecOriginal: variant === "original" ? { ...xtrec } : base.xtrecOriginal || null
    });
    if (lastSelectionHypergraphResult) {
      lastSelectionHypergraphResult = updated;
    } else {
      pendingSelectionHypergraphResult = updated;
    }
    setSelectionHypergraphOutput(formatSelectionHypergraphOutput(updated));
    setAnalysisMessage(buildSelectionHypergraphAnalysisRows(updated), t("status.selectionOutputNone"));
    refreshDecompositionView();
  }

  function drawSelectionHypergraphFromAnalysis() {
    try {
      importSelectionHypergraphToEditor(
        ensureSelectionHypergraphResultForDrawing(),
        getSelectionHypergraphDrawVariant()
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : t("app.selection.drawFailed");
      setSelectionHypergraphStatus(message, true);
    }
  }

  function compareSelectionHypergraphBeforeAfterFra() {
    try {
      showSelectionHypergraphComparison(ensureSelectionHypergraphResultForDrawing());
    } catch (error) {
      const message = error instanceof Error ? error.message : t("app.selection.compareFailed");
      setSelectionHypergraphStatus(message, true);
    }
  }

  function runManualHypergraphXtrec() {
    if (manualXtrecWorker) {
      manualXtrecWorker.terminate();
      manualXtrecWorker = null;
    }
    if (!("Worker" in window)) {
      setManualHypergraphStatus(t("app.hypergraph.workerUnsupported"), true);
      return;
    }
    let parsed = null;
    try {
      parsed = parseManualHypergraphText(manualHypergraphInput ? manualHypergraphInput.value : "");
    } catch (error) {
      const message = error instanceof Error ? error.message : t("app.hypergraph.descriptionInvalid");
      setManualHypergraphStatus(message, true);
      setManualHypergraphOutput("");
      return;
    }

    manualXtrecJobSequence += 1;
    activeManualXtrecJobId = manualXtrecJobSequence;
    const currentJobId = activeManualXtrecJobId;
    lastManualHypergraphResult = {
      ...parsed,
      xtrec: null,
      xtrecPending: true
    };
    lastManualHypergraphResult = withManualStructuralXt(lastManualHypergraphResult);
    setManualHypergraphRunning(true);
    setManualHypergraphStatus(t("app.hypergraph.manualRunning"), false);
    setManualHypergraphOutput(formatManualHypergraphOutput(lastManualHypergraphResult));
    showHypergraphInDecomposition("hypergraph-manual");

    const worker = new Worker(`public/xtrec-worker.js?v=${Date.now()}`);
    manualXtrecWorker = worker;
    worker.onmessage = (event) => {
      const payload = event.data || {};
      if (Number(payload.jobId || 0) !== currentJobId) {
        return;
      }
      if (payload.type === "progress") {
        const message = payload.message ? String(payload.message) : t("app.hypergraph.xtrecProgressShort");
        setManualHypergraphStatus(message, false);
        return;
      }
      if (payload.type === "error") {
        if (manualXtrecWorker === worker) {
          manualXtrecWorker = null;
        }
        worker.terminate();
        lastManualHypergraphResult = {
          ...lastManualHypergraphResult,
          xtrecPending: false
        };
        lastManualHypergraphResult = withManualStructuralXt(lastManualHypergraphResult);
        setManualHypergraphRunning(false);
        setManualHypergraphStatus(payload.message || t("app.hypergraph.manualXtrecFailed"), true);
        setManualHypergraphOutput(formatManualHypergraphOutput(lastManualHypergraphResult));
        refreshDecompositionView();
        return;
      }
      if (payload.type === "result") {
        if (manualXtrecWorker === worker) {
          manualXtrecWorker = null;
        }
        worker.terminate();
        const xtrec = payload.payload || {};
        lastManualHypergraphResult = {
          ...lastManualHypergraphResult,
          xtrec,
          xtrecPending: false
        };
        lastManualHypergraphResult = withManualStructuralXt(lastManualHypergraphResult);
        setManualHypergraphRunning(false);
        setManualHypergraphStatus(t("app.hypergraph.manualXtrecResult", {
          result: xtrec && xtrec.isXt ? "TRUE" : "FALSE"
        }), !(xtrec && xtrec.isXt));
        setManualHypergraphOutput(formatManualHypergraphOutput(lastManualHypergraphResult));
        refreshDecompositionView();
      }
    };
    worker.onerror = (event) => {
      if (manualXtrecWorker === worker) {
        manualXtrecWorker = null;
      }
      worker.terminate();
      lastManualHypergraphResult = {
        ...lastManualHypergraphResult,
        xtrecPending: false
      };
      lastManualHypergraphResult = withManualStructuralXt(lastManualHypergraphResult);
      setManualHypergraphRunning(false);
      const message = event && event.message
        ? t("app.worker.xtrecFailed", { message: event.message })
        : t("app.worker.xtrecFailedGeneric");
      setManualHypergraphStatus(message, true);
      setManualHypergraphOutput(formatManualHypergraphOutput(lastManualHypergraphResult));
      refreshDecompositionView();
    };
    postLocalizedWorkerMessage(worker, {
      type: "compute",
      jobId: currentJobId,
      payload: {
        matrix: parsed.matrix,
        rowLabels: parsed.rowLabels,
        colLabels: parsed.colLabels,
        acceleration: "cpu"
      }
    });
  }

  function setHypergraphEditorStatus(message, isError) {
    if (hypergraphEditorStatus) {
      hypergraphEditorStatus.textContent = message || "";
      hypergraphEditorStatus.style.color = isError ? "var(--danger)" : "";
    }
    if (hypergraphEditorPanelStatus) {
      hypergraphEditorPanelStatus.textContent = message || "";
      hypergraphEditorPanelStatus.style.color = isError ? "var(--danger)" : "";
    }
  }

  function setHypergraphEditorOutput(text) {
    if (!hypergraphEditorOutput) {
      return;
    }
    hypergraphEditorOutput.textContent = text && String(text).trim()
      ? String(text)
      : t("status.hypergraphEditorOutputNone");
  }

  function setHypergraphResultsVisible(visible, shouldFocus) {
    hypergraphResultsVisible = Boolean(visible);
    if (hypergraphResultsPanel) {
      hypergraphResultsPanel.classList.toggle("hidden", !hypergraphResultsVisible);
    }
    if (hypergraphResultsToggleBtn) {
      hypergraphResultsToggleBtn.textContent = hypergraphResultsVisible
        ? t("hypergraphEditor.hideResults")
        : t("hypergraphEditor.showResults");
      hypergraphResultsToggleBtn.classList.toggle("is-active", hypergraphResultsVisible);
    }
    if (hypergraphResultsVisible && shouldFocus !== false && hypergraphResultsPanel) {
      requestAnimationFrame(() => {
        hypergraphResultsPanel.scrollIntoView({ block: "nearest", inline: "nearest" });
      });
    }
  }

  function ensureHypergraphResultsVisible() {
    setHypergraphResultsVisible(true, true);
  }

  function renderHypergraphAnalysisInfo() {
    if (!hypergraphAnalysisInfo) {
      return;
    }
    const items = [
      ["hypergraphEditor.infoTransversalTitle", "hypergraphEditor.infoTransversalText"],
      ["hypergraphEditor.infoExactTitle", "hypergraphEditor.infoExactText"],
      ["hypergraphEditor.infoCExactTitle", "hypergraphEditor.infoCExactText"],
      ["hypergraphEditor.infoXtTitle", "hypergraphEditor.infoXtText"],
      ["hypergraphEditor.infoRExactTitle", "hypergraphEditor.infoRExactText"],
      ["hypergraphEditor.infoStructuralXtTitle", "hypergraphEditor.infoStructuralXtText"]
    ];
    hypergraphAnalysisInfo.replaceChildren();
    const title = document.createElement("div");
    title.className = "hypergraph-analysis-info-title";
    title.textContent = t("hypergraphEditor.infoTitle");
    hypergraphAnalysisInfo.appendChild(title);
    items.forEach(([titleKey, textKey]) => {
      const row = document.createElement("div");
      row.className = "hypergraph-analysis-info-row";
      const rowTitle = document.createElement("strong");
      rowTitle.textContent = t(titleKey);
      const rowText = document.createElement("span");
      rowText.textContent = t(textKey);
      row.append(rowTitle, rowText);
      hypergraphAnalysisInfo.appendChild(row);
    });
  }

  function setHypergraphAnalysisInfoVisible(visible) {
    hypergraphAnalysisInfoVisible = Boolean(visible);
    if (hypergraphAnalysisInfo) {
      hypergraphAnalysisInfo.classList.toggle("hidden", !hypergraphAnalysisInfoVisible);
    }
    if (hypergraphAnalysisInfoBtn) {
      hypergraphAnalysisInfoBtn.classList.toggle("is-active", hypergraphAnalysisInfoVisible);
      hypergraphAnalysisInfoBtn.setAttribute("aria-expanded", hypergraphAnalysisInfoVisible ? "true" : "false");
    }
  }

  function createHypergraphRExactMetric(label, value, tone) {
    const metric = document.createElement("div");
    metric.className = "hypergraph-rexact-metric";
    if (tone) {
      metric.classList.add(`is-${tone}`);
    }
    const labelEl = document.createElement("span");
    labelEl.className = "hypergraph-rexact-metric-label";
    labelEl.textContent = label;
    const valueEl = document.createElement("strong");
    valueEl.className = "hypergraph-rexact-metric-value";
    valueEl.textContent = value;
    metric.append(labelEl, valueEl);
    return metric;
  }

  function createHypergraphTypeBadge(label, pass, detail) {
    const badge = document.createElement("div");
    badge.className = "hypergraph-type-badge";
    badge.classList.add(pass ? "is-pass" : "is-fail");
    const name = document.createElement("span");
    name.className = "hypergraph-type-badge-name";
    name.textContent = label;
    const value = document.createElement("strong");
    value.className = "hypergraph-type-badge-value";
    value.textContent = pass ? t("hypergraphEditor.rExactPass") : t("hypergraphEditor.rExactFail");
    badge.append(name, value);
    if (detail) {
      const detailEl = document.createElement("span");
      detailEl.className = "hypergraph-type-badge-detail";
      detailEl.textContent = detail;
      badge.appendChild(detailEl);
    }
    return badge;
  }

  function setHypergraphStructureSummary(text, isError) {
    if (!hypergraphStructureSummary) {
      return;
    }
    const hasText = text && String(text).trim();
    hypergraphStructureSummary.replaceChildren();
    hypergraphStructureSummary.textContent = hasText
      ? String(text)
      : t("hypergraphEditor.structureIdle");
    hypergraphStructureSummary.classList.toggle("hidden", !hasText);
    hypergraphStructureSummary.classList.remove("is-error");
    if (isError && hasText) {
      hypergraphStructureSummary.classList.add("is-error");
    }
    hypergraphStructureSummary.style.color = isError ? "var(--danger)" : "";
  }

  function renderHypergraphStructureSummary(result) {
    if (!hypergraphStructureSummary) {
      return;
    }
    if (!result) {
      setHypergraphStructureSummary("");
      return;
    }
    hypergraphStructureSummary.replaceChildren();
    hypergraphStructureSummary.classList.remove("hidden", "is-error");
    hypergraphStructureSummary.style.color = "";

    const title = document.createElement("div");
    title.className = "hypergraph-structure-title";
    title.textContent = t("hypergraphEditor.structureTitle");

    const badges = document.createElement("div");
    badges.className = "hypergraph-type-badges";
    badges.append(
      createHypergraphTypeBadge(t("hypergraphEditor.structureUniform"), result.isUniform, result.isUniform ? `${result.uniformity}-uniform` : ""),
      createHypergraphTypeBadge(t("hypergraphEditor.structureLinear"), result.isLinear, ""),
      createHypergraphTypeBadge(t("hypergraphEditor.structureClutter"), result.isClutter, ""),
      createHypergraphTypeBadge(t("hypergraphEditor.structureSimple"), result.isSimple, result.duplicateEdgeCount ? `duplikaty=${formatInteger(result.duplicateEdgeCount)}` : ""),
      createHypergraphTypeBadge(t("hypergraphEditor.structureRegular"), result.isRegular, result.isRegular ? `${result.regularity}-regular` : "")
    );

    const metrics = document.createElement("div");
    metrics.className = "hypergraph-rexact-metrics";
    metrics.append(
      createHypergraphRExactMetric("|V|", formatInteger(Number(result.vertexCount || 0)), "primary"),
      createHypergraphRExactMetric("|E|", formatInteger(Number(result.edgeCount || 0)), "primary"),
      createHypergraphRExactMetric(t("hypergraphEditor.structureRank"), `${formatInteger(Number(result.minEdgeSize || 0))}..${formatInteger(Number(result.rank || 0))}`, ""),
      createHypergraphRExactMetric(t("hypergraphEditor.structureMaxDegree"), formatInteger(Number(result.maxDegree || 0)), "")
    );

    hypergraphStructureSummary.append(title, badges, metrics);

    const cExact = document.createElement("div");
    cExact.className = "hypergraph-rexact-note";
    const cExactLabel = document.createElement("span");
    cExactLabel.className = "hypergraph-rexact-note-label";
    cExactLabel.textContent = t("hypergraphEditor.structureCExact");
    const cExactValue = document.createElement("span");
    cExactValue.className = "hypergraph-rexact-note-value";
    cExactValue.textContent = result.cExactSummary || "-";
    cExact.append(cExactLabel, cExactValue);
    hypergraphStructureSummary.appendChild(cExact);

    if (result.note) {
      const note = document.createElement("div");
      note.className = "hypergraph-rexact-warning";
      note.textContent = result.note;
      hypergraphStructureSummary.appendChild(note);
    }
  }

  function setHypergraphCExactSummary(text, isError) {
    if (!hypergraphCExactSummary) {
      return;
    }
    const hasText = text && String(text).trim();
    hypergraphCExactSummary.replaceChildren();
    hypergraphCExactSummary.textContent = hasText
      ? String(text)
      : t("hypergraphEditor.cExactIdle");
    hypergraphCExactSummary.classList.toggle("hidden", !hasText);
    hypergraphCExactSummary.classList.remove("is-error");
    if (isError && hasText) {
      hypergraphCExactSummary.classList.add("is-error");
    }
    hypergraphCExactSummary.style.color = isError ? "var(--danger)" : "";
  }

  function renderHypergraphCExactSummary(result) {
    if (!hypergraphCExactSummary) {
      return;
    }
    if (!result) {
      setHypergraphCExactSummary("");
      return;
    }
    hypergraphCExactSummary.replaceChildren();
    hypergraphCExactSummary.classList.remove("hidden", "is-error");
    hypergraphCExactSummary.style.color = "";

    const title = document.createElement("div");
    title.className = "hypergraph-structure-title";
    title.textContent = t("hypergraphEditor.cExactTitle");

    const metrics = document.createElement("div");
    metrics.className = "hypergraph-rexact-metrics";
    metrics.append(
      createHypergraphRExactMetric(t("hypergraphEditor.cExactLevels"), formatInteger(Number((result.levels || []).length)), "primary"),
      createHypergraphRExactMetric(t("hypergraphEditor.cExactSolutions"), formatInteger(Number(result.solutionCount || 0)), "primary"),
      createHypergraphRExactMetric("checked", `${formatInteger(Number(result.checkedSubsets || 0))}/${formatInteger(Number(result.totalSubsets || 0))}`, ""),
      createHypergraphRExactMetric("stored", formatInteger(Number((result.candidates || []).length)), "")
    );

    const chips = document.createElement("div");
    chips.className = "hypergraph-rexact-chips";
    (result.levels || []).forEach((level) => {
      const chip = document.createElement("span");
      chip.className = "hypergraph-rexact-chip";
      chip.textContent = `c=${formatInteger(Number(level.cValue || 0))}: ${formatInteger(Number(level.count || 0))}`;
      chips.appendChild(chip);
    });

    hypergraphCExactSummary.append(title, metrics);
    if ((result.levels || []).length > 0) {
      const levelBlock = document.createElement("div");
      levelBlock.className = "hypergraph-rexact-distribution";
      const levelLabel = document.createElement("span");
      levelLabel.className = "hypergraph-rexact-note-label";
      levelLabel.textContent = t("hypergraphEditor.cExactLevels");
      levelBlock.append(levelLabel, chips);
      hypergraphCExactSummary.appendChild(levelBlock);
    }

    const selected = result.selected || ((result.candidates || [])[0] || null);
    if (selected) {
      const selectedBlock = document.createElement("div");
      selectedBlock.className = "hypergraph-rexact-note";
      const selectedLabel = document.createElement("span");
      selectedLabel.className = "hypergraph-rexact-note-label";
      selectedLabel.textContent = t("hypergraphEditor.cExactSelected");
      const selectedValue = document.createElement("span");
      selectedValue.className = "hypergraph-rexact-note-value";
      selectedValue.textContent = `c=${formatInteger(Number(selected.cValue || 0))}, ${formatSetLabels(selected.indices || [], result.labels || [])}`;
      selectedBlock.append(selectedLabel, selectedValue);
      hypergraphCExactSummary.appendChild(selectedBlock);
    }

    if (result.note || result.truncated) {
      const note = document.createElement("div");
      note.className = "hypergraph-rexact-warning";
      note.textContent = result.note || t("app.hypergraph.cExactLimit");
      hypergraphCExactSummary.appendChild(note);
    }
  }

  function setHypergraphStructuralXtSummary(text, isError) {
    if (!hypergraphStructuralXtSummary) {
      return;
    }
    const hasText = text && String(text).trim();
    hypergraphStructuralXtSummary.replaceChildren();
    hypergraphStructuralXtSummary.textContent = hasText
      ? String(text)
      : t("hypergraphEditor.structuralXtIdle");
    hypergraphStructuralXtSummary.classList.toggle("hidden", !hasText);
    hypergraphStructuralXtSummary.classList.remove("is-pass", "is-fail", "is-warn", "is-error");
    if (isError && hasText) {
      hypergraphStructuralXtSummary.classList.add("is-error");
    }
    hypergraphStructuralXtSummary.style.color = isError ? "var(--danger)" : "";
  }

  function structuralXtStatusLabel(status) {
    const safe = String(status || "").toLowerCase();
    if (safe === "pass") {
      return "OK";
    }
    if (safe === "warn") {
      return "WARN";
    }
    if (safe === "fail") {
      return t("app.hypergraph.no");
    }
    return "?";
  }

  function structuralXtStatusTone(status) {
    const safe = String(status || "").toLowerCase();
    if (safe === "pass") {
      return "pass";
    }
    if (safe === "fail") {
      return "fail";
    }
    if (safe === "warn") {
      return "primary";
    }
    return "";
  }

  function createStructuralXtRuleRow(rule) {
    const row = document.createElement("div");
    row.className = "hypergraph-structural-rule";
    row.classList.add(`is-${String(rule.status || "unknown").toLowerCase()}`);

    const badge = document.createElement("span");
    badge.className = "hypergraph-structural-rule-badge";
    badge.textContent = structuralXtStatusLabel(rule.status);

    const content = document.createElement("div");
    content.className = "hypergraph-structural-rule-content";

    const title = document.createElement("strong");
    title.textContent = `${rule.id}. ${rule.title}`;

    const summary = document.createElement("span");
    summary.textContent = rule.summary || "";
    content.append(title, summary);

    const evidence = Array.isArray(rule.evidence) ? rule.evidence.filter(Boolean) : [];
    if (evidence.length > 0) {
      const evidenceWrap = document.createElement("div");
      evidenceWrap.className = "hypergraph-structural-rule-evidence";
      evidenceWrap.textContent = evidence.join(" | ");
      content.appendChild(evidenceWrap);
    }

    row.append(badge, content);
    return row;
  }

  function renderHypergraphStructuralXtSummary(result) {
    if (!hypergraphStructuralXtSummary) {
      return;
    }
    if (!result) {
      setHypergraphStructuralXtSummary("");
      return;
    }
    const certified = Boolean(result.structurallyCertified);
    hypergraphStructuralXtSummary.replaceChildren();
    hypergraphStructuralXtSummary.classList.remove("hidden", "is-error", "is-pass", "is-fail", "is-warn");
    hypergraphStructuralXtSummary.classList.add(certified ? "is-pass" : (result.conclusion === "unknown" ? "is-warn" : "is-fail"));
    hypergraphStructuralXtSummary.style.color = "";

    const header = document.createElement("div");
    header.className = "hypergraph-rexact-head";

    const titleWrap = document.createElement("div");
    titleWrap.className = "hypergraph-rexact-title-wrap";
    const title = document.createElement("div");
    title.className = "hypergraph-rexact-title";
    title.textContent = t("hypergraphEditor.structuralXtTitle");
    const subtitle = document.createElement("div");
    subtitle.className = "hypergraph-rexact-subtitle";
    subtitle.textContent = t("app.hypergraph.source", {
      source: t(result.source === "selection" ? "app.hypergraph.sourceSelection" : "app.hypergraph.sourceManual")
    });
    titleWrap.append(title, subtitle);

    const verdict = document.createElement("div");
    verdict.className = "hypergraph-rexact-verdict";
    verdict.textContent = certified
      ? t("hypergraphEditor.structuralXtCertified")
      : t("hypergraphEditor.structuralXtNoCert");
    header.append(titleWrap, verdict);

    const xtrecText = result.xtrec && result.xtrec.available
      ? (result.xtrec.isXt ? "TRUE" : "FALSE")
      : "-";
    const metrics = document.createElement("div");
    metrics.className = "hypergraph-rexact-metrics";
    metrics.append(
      createHypergraphRExactMetric("|V|", formatInteger(Number(result.vertexCount || 0)), "primary"),
      createHypergraphRExactMetric("|E|", formatInteger(Number(result.edgeCount || 0)), "primary"),
      createHypergraphRExactMetric("XTREC", xtrecText, result.xtrec && result.xtrec.isXt ? "pass" : (result.xtrec && result.xtrec.available ? "fail" : "")),
      createHypergraphRExactMetric(t("app.hypergraph.rules"), (result.sufficientRules || []).length ? (result.sufficientRules || []).join(", ") : "-", certified ? "pass" : "")
    );

    const ruleList = document.createElement("div");
    ruleList.className = "hypergraph-structural-rules";
    (result.rules || []).forEach((rule) => {
      ruleList.appendChild(createStructuralXtRuleRow(rule));
    });

    hypergraphStructuralXtSummary.append(header, metrics, ruleList);
    const note = document.createElement("div");
    note.className = certified ? "hypergraph-rexact-note" : "hypergraph-rexact-warning";
    const label = document.createElement("span");
    label.className = "hypergraph-rexact-note-label";
    label.textContent = t("app.hypergraph.conclusion");
    const value = document.createElement("span");
    value.className = "hypergraph-rexact-note-value";
    value.textContent = certified
      ? t("app.hypergraph.sufficientRule", { rules: (result.sufficientRules || []).join(", ") })
      : t("app.hypergraph.noCertificate");
    note.append(label, value);
    hypergraphStructuralXtSummary.appendChild(note);
  }

  function getStructuralXtLibrary() {
    return window.PoohStructuralXt && typeof window.PoohStructuralXt.analyze === "function"
      ? window.PoohStructuralXt
      : null;
  }

  function analyzeStructuralXtInput(input) {
    const library = getStructuralXtLibrary();
    if (!library) {
      throw new Error(t("app.hypergraph.structuralLibraryMissing"));
    }
    return library.analyze(input);
  }

  function getSelectionPetriAssumptions() {
    try {
      return computeLivenessSafenessFor(state.nodes, state.arcs, 3500);
    } catch (_) {
      return null;
    }
  }

  function buildSelectionStructuralXtInput(result) {
    return {
      source: "selection",
      matrix: result && result.reducedDualMatrix ? result.reducedDualMatrix : [],
      rowLabels: result && result.reducedRowLabels ? result.reducedRowLabels : [],
      colLabels: result && result.reducedColLabels ? result.reducedColLabels : [],
      componentPlaces: result && result.reducedComponentPlaces ? result.reducedComponentPlaces : null,
      petri: getSelectionPetriAssumptions(),
      xtrec: result && result.xtrec ? result.xtrec : null,
      reduction: result && result.fra ? result.fra : null
    };
  }

  function withSelectionStructuralXt(result) {
    if (!result) {
      return result;
    }
    try {
      return {
        ...result,
        structuralXt: analyzeStructuralXtInput(buildSelectionStructuralXtInput(result))
      };
    } catch (error) {
      return {
        ...result,
        structuralXtError: error instanceof Error ? error.message : t("app.hypergraph.structuralCheckFailed")
      };
    }
  }

  function buildManualStructuralXtInput(result) {
    return {
      source: "manual",
      matrix: result && result.matrix ? result.matrix : [],
      rowLabels: result && result.rowLabels ? result.rowLabels : [],
      colLabels: result && result.colLabels ? result.colLabels : [],
      xtrec: result && result.xtrec ? result.xtrec : null,
      reduction: result && result.fra ? result.fra : null
    };
  }

  function withManualStructuralXt(result) {
    if (!result) {
      return result;
    }
    try {
      return {
        ...result,
        structuralXt: analyzeStructuralXtInput(buildManualStructuralXtInput(result))
      };
    } catch (error) {
      return {
        ...result,
        structuralXtError: error instanceof Error ? error.message : t("app.hypergraph.structuralCheckFailed")
      };
    }
  }

  function getDisplayedHypergraphMatrixForStructuralXt() {
    if (hypergraphShowReduced && hypergraphReducedResult) {
      return {
        matrix: hypergraphReducedResult.reducedMatrix.map((row) => row.slice()),
        rowLabels: hypergraphReducedResult.reducedRowLabels.slice(),
        colLabels: hypergraphReducedResult.reducedColLabels.slice(),
        fra: hypergraphReducedResult,
        sourceLabel: "reduced"
      };
    }
    const data = getHypergraphMatrixFromState();
    return {
      matrix: data.matrix.map((row) => row.slice()),
      rowLabels: data.rowLabels.slice(),
      colLabels: data.colLabels.slice(),
      fra: hypergraphReducedResult || null,
      sourceLabel: "original"
    };
  }

  function buildEditorStructuralXtInput() {
    const data = getDisplayedHypergraphMatrixForStructuralXt();
    const xtrec = hypergraphEditorAnalysis.xtrec && hypergraphEditorAnalysis.xtrec.sourceLabel === data.sourceLabel
      ? hypergraphEditorAnalysis.xtrec
      : null;
    return {
      source: "manual",
      matrix: data.matrix,
      rowLabels: data.rowLabels,
      colLabels: data.colLabels,
      xtrec,
      reduction: data.fra || null
    };
  }

  function refreshEditorStructuralXtAnalysis() {
    if (!hypergraphEditorAnalysis.structuralXt) {
      return null;
    }
    const result = analyzeStructuralXtInput(buildEditorStructuralXtInput());
    hypergraphEditorAnalysis.structuralXt = result;
    syncManualHypergraphResultFromEditor();
    renderHypergraphStructuralXtSummary(result);
    return result;
  }

  function formatStructuralXtBlock(result) {
    if (!result) {
      return `${t("app.hypergraph.structuralTitle")}: ${t("app.hypergraph.notRun")}.`;
    }
    const lines = [];
    lines.push(t("app.hypergraph.structuralTitle"));
    lines.push(t("app.hypergraph.structuralConclusion", {
      conclusion: t(result.structurallyCertified ? "app.hypergraph.certificate" : "app.hypergraph.noFullCertificate"),
      rules: (result.sufficientRules || []).length ? ` (${result.sufficientRules.join(", ")})` : ""
    }));
    lines.push(t("app.hypergraph.supportSource", {
      source: t(result.notes && result.notes.componentSupportSource === "component-places"
        ? "app.hypergraph.componentPlaces"
        : "app.hypergraph.incidenceSupports")
    }));
    (result.rules || []).forEach((rule) => {
      lines.push(`${rule.id}. ${rule.title}: ${structuralXtStatusLabel(rule.status)} - ${rule.summary || ""}`);
      (rule.evidence || []).forEach((entry) => lines.push(`  • ${entry}`));
    });
    return lines.join("\n");
  }

  function runHypergraphStructuralXtAnalysis(options) {
    const opts = options && typeof options === "object" ? options : {};
    try {
      const data = getDisplayedHypergraphMatrixForStructuralXt();
      if (data.rowLabels.length === 0 || data.colLabels.length === 0) {
        setHypergraphEditorStatus(t("app.hypergraph.structuralInputRequired"), true);
        return null;
      }
      const result = analyzeStructuralXtInput({
        source: "manual",
        matrix: data.matrix,
        rowLabels: data.rowLabels,
        colLabels: data.colLabels,
        xtrec: hypergraphEditorAnalysis.xtrec && hypergraphEditorAnalysis.xtrec.sourceLabel === data.sourceLabel
          ? hypergraphEditorAnalysis.xtrec
          : null,
        reduction: data.fra || null
      });
      hypergraphEditorAnalysis.structuralXt = result;
      syncManualHypergraphResultFromEditor();
      renderHypergraphStructuralXtSummary(result);
      refreshHypergraphEditorText();
      ensureHypergraphResultsVisible();
      const xtrecHint = result.xtrec && result.xtrec.available ? "" : t("app.hypergraph.r4Hint");
      setHypergraphEditorStatus(
        (result.structurallyCertified
          ? t("app.hypergraph.certificateForSource", { source: t(`app.hypergraph.${data.sourceLabel}`) })
          : t("app.hypergraph.noCertificateForSource", { source: t(`app.hypergraph.${data.sourceLabel}`) })) + xtrecHint,
        !result.structurallyCertified && !(result.xtrec && result.xtrec.available && result.xtrec.isXt)
      );
      if (opts.requestXtrec && !(result.xtrec && result.xtrec.available)) {
        void runHypergraphXtrec().catch((error) => {
          const message = error instanceof Error ? error.message : t("app.hypergraph.xtrecRunFailed");
          setHypergraphEditorStatus(message, true);
          if (activeComputation && activeComputation.type === "hypergraph-xtrec") {
            hideComputationDialog();
          }
        });
      }
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : t("app.hypergraph.structuralCheckFailed");
      setHypergraphStructuralXtSummary(message, true);
      ensureHypergraphResultsVisible();
      setHypergraphEditorStatus(message, true);
      return null;
    }
  }

  function setHypergraphRExactSummary(text, isError) {
    if (!hypergraphRExactSummary) {
      return;
    }
    const hasText = text && String(text).trim();
    hypergraphRExactSummary.replaceChildren();
    hypergraphRExactSummary.textContent = hasText
      ? String(text)
      : t("hypergraphEditor.rExactIdle");
    hypergraphRExactSummary.classList.toggle("hidden", !hasText);
    hypergraphRExactSummary.classList.remove("is-pass", "is-fail", "is-error");
    if (isError && hasText) {
      hypergraphRExactSummary.classList.add("is-error");
    }
    hypergraphRExactSummary.style.color = isError ? "var(--danger)" : "";
  }

  function renderHypergraphRExactSummary(result) {
    if (!hypergraphRExactSummary) {
      return;
    }
    if (!result) {
      setHypergraphRExactSummary("");
      return;
    }

    const pass = Boolean(result.isRExact);
    hypergraphRExactSummary.replaceChildren();
    hypergraphRExactSummary.classList.remove("hidden", "is-error", "is-pass", "is-fail");
    hypergraphRExactSummary.classList.add(pass ? "is-pass" : "is-fail");
    hypergraphRExactSummary.style.color = "";

    const header = document.createElement("div");
    header.className = "hypergraph-rexact-head";

    const titleWrap = document.createElement("div");
    titleWrap.className = "hypergraph-rexact-title-wrap";
    const title = document.createElement("div");
    title.className = "hypergraph-rexact-title";
    title.textContent = t("hypergraphEditor.rExactCardTitle");
    const subtitle = document.createElement("div");
    subtitle.className = "hypergraph-rexact-subtitle";
    subtitle.textContent = result.truncated
      ? t("hypergraphEditor.rExactPartial")
      : `${t("hypergraphEditor.rExactRStar")}=${formatInteger(Number(result.rStar || 0))}`;
    titleWrap.append(title, subtitle);

    const verdict = document.createElement("div");
    verdict.className = "hypergraph-rexact-verdict";
    verdict.textContent = `${pass ? t("hypergraphEditor.rExactPass") : t("hypergraphEditor.rExactFail")} ${t("hypergraphEditor.rExactForThreshold")}=${formatInteger(Number(result.targetR || 0))}`;
    header.append(titleWrap, verdict);

    const metrics = document.createElement("div");
    metrics.className = "hypergraph-rexact-metrics";
    metrics.append(
      createHypergraphRExactMetric(t("hypergraphEditor.rExactRStar"), formatInteger(Number(result.rStar || 0)), "primary"),
      createHypergraphRExactMetric(t("hypergraphEditor.rExactThreshold"), formatInteger(Number(result.targetR || 0)), pass ? "pass" : "fail"),
      createHypergraphRExactMetric(t("hypergraphEditor.rExactXt"), result.isOneExact ? t("hypergraphEditor.rExactPass") : t("hypergraphEditor.rExactFail"), result.isOneExact ? "pass" : "fail"),
      createHypergraphRExactMetric(t("hypergraphEditor.rExactMinimal"), formatInteger(Number(result.minimalCount || 0)), ""),
      createHypergraphRExactMetric(t("hypergraphEditor.rExactExact"), formatInteger(Number(result.exactCount || 0)), ""),
      createHypergraphRExactMetric(
        t("hypergraphEditor.rExactSearch"),
        `${formatInteger(Number(result.checkedSubsets || 0))}/${formatInteger(Number(result.totalSubsets || 0))}`,
        ""
      )
    );

    hypergraphRExactSummary.append(header, metrics);

    if (result.witness) {
      const witness = document.createElement("div");
      witness.className = "hypergraph-rexact-note";
      const label = document.createElement("span");
      label.className = "hypergraph-rexact-note-label";
      label.textContent = t("hypergraphEditor.rExactWitness");
      const value = document.createElement("span");
      value.className = "hypergraph-rexact-note-value";
      const witnessLabels = (result.witness.labels || []).join(", ");
      value.textContent = `T${Number(result.witness.transversalIndex || 0) + 1}=[${witnessLabels}], ${result.witness.rowLabel}, |T∩E|=${formatInteger(Number(result.witness.hits || 0))}`;
      witness.append(label, value);
      hypergraphRExactSummary.appendChild(witness);
    }

    const distribution = Object.keys(result.distribution || {})
      .map((key) => Number(key))
      .filter((key) => Number.isFinite(key))
      .sort((a, b) => a - b);
    if (distribution.length) {
      const distributionWrap = document.createElement("div");
      distributionWrap.className = "hypergraph-rexact-distribution";
      const distributionLabel = document.createElement("span");
      distributionLabel.className = "hypergraph-rexact-note-label";
      distributionLabel.textContent = t("hypergraphEditor.rExactDistribution");
      const chips = document.createElement("div");
      chips.className = "hypergraph-rexact-chips";
      distribution.forEach((key) => {
        const chip = document.createElement("span");
        chip.className = "hypergraph-rexact-chip";
        chip.textContent = `r=${formatInteger(key)}: ${formatInteger(Number(result.distribution[key] || 0))}`;
        chips.appendChild(chip);
      });
      distributionWrap.append(distributionLabel, chips);
      hypergraphRExactSummary.appendChild(distributionWrap);
    }

    if (result.truncated) {
      const warning = document.createElement("div");
      warning.className = "hypergraph-rexact-warning";
      warning.textContent = t("hypergraphEditor.rExactTruncated");
      hypergraphRExactSummary.appendChild(warning);
    }
  }

  function revealHypergraphRExactSummary() {
    if (!hypergraphRExactSummary || hypergraphRExactSummary.classList.contains("hidden")) {
      return;
    }
    requestAnimationFrame(() => {
      hypergraphRExactSummary.scrollIntoView({ block: "nearest", inline: "nearest" });
    });
  }

  function serializeHypergraphEditorState() {
    return {
      vertices: hypergraphState.vertices.map((vertex) => ({ ...vertex })),
      edges: hypergraphState.edges.map((edge) => ({ ...edge, vertexIds: (edge.vertexIds || []).slice() })),
      counters: { ...hypergraphState.counters },
      view: { ...hypergraphState.view }
    };
  }

  function persistHypergraphEditorState() {
    try {
      localStorage.setItem(HYPERGRAPH_STORAGE_KEY, JSON.stringify(serializeHypergraphEditorState()));
    } catch (_) {
      // Local persistence is best-effort only.
    }
  }

  function applyHypergraphEditorState(data) {
    if (!data || typeof data !== "object") {
      return false;
    }
    const vertices = Array.isArray(data.vertices) ? data.vertices : [];
    const edges = Array.isArray(data.edges) ? data.edges : [];
    const usedVertexIds = new Set();
    hypergraphState.vertices = vertices.map((vertex, index) => {
      const id = String(vertex.id || `hv${index + 1}`).trim() || `hv${index + 1}`;
      usedVertexIds.add(id);
      return {
        id,
        label: String(vertex.label || id),
        x: Number.isFinite(Number(vertex.x)) ? Number(vertex.x) : HYPERGRAPH_CANVAS_W / 2,
        y: Number.isFinite(Number(vertex.y)) ? Number(vertex.y) : HYPERGRAPH_CANVAS_H / 2
      };
    });
    hypergraphState.edges = edges.map((edge, index) => ({
      id: String(edge.id || `he${index + 1}`).trim() || `he${index + 1}`,
      label: String(edge.label || `E${index + 1}`),
      vertexIds: Array.from(new Set(Array.isArray(edge.vertexIds) ? edge.vertexIds.map(String) : []))
        .filter((id) => usedVertexIds.has(id))
    })).filter((edge) => edge.vertexIds.length > 0);
    hypergraphState.counters = {
      vertex: Math.max(1, Number(data.counters && data.counters.vertex) || inferCounter("hv", hypergraphState.vertices) + 1),
      edge: Math.max(1, Number(data.counters && data.counters.edge) || inferCounter("he", hypergraphState.edges) + 1)
    };
    if (data.view && typeof data.view === "object") {
      hypergraphState.view.zoom = Math.max(0.15, Math.min(8, Number(data.view.zoom) || 1));
      hypergraphState.view.panX = Number(data.view.panX) || 0;
      hypergraphState.view.panY = Number(data.view.panY) || 0;
    }
    return true;
  }

  function loadHypergraphEditorState() {
    try {
      const raw = localStorage.getItem(HYPERGRAPH_STORAGE_KEY);
      if (!raw) {
        return false;
      }
      return applyHypergraphEditorState(JSON.parse(raw));
    } catch (_) {
      return false;
    }
  }

  function getHypergraphVertexLabel(vertexId) {
    const vertex = hypergraphState.vertices.find((item) => item.id === vertexId);
    return vertex ? String(vertex.label || vertex.id) : String(vertexId || "");
  }

  function getHypergraphMatrixFromState() {
    const vertices = hypergraphState.vertices.slice();
    const vertexIndex = new Map(vertices.map((vertex, index) => [vertex.id, index]));
    const matrix = hypergraphState.edges.map((edge) => {
      const row = new Array(vertices.length).fill(0);
      (edge.vertexIds || []).forEach((vertexId) => {
        const index = vertexIndex.get(vertexId);
        if (index !== undefined) {
          row[index] = 1;
        }
      });
      return row;
    });
    return {
      matrix,
      rowLabels: hypergraphState.edges.map((edge) => String(edge.label || edge.id)),
      colLabels: vertices.map((vertex) => String(vertex.label || vertex.id)),
      vertices,
      edges: hypergraphState.edges.slice()
    };
  }

  function syncManualHypergraphResultFromEditor() {
    const data = getHypergraphMatrixFromState();
    if (data.colLabels.length === 0 && data.rowLabels.length === 0) {
      lastManualHypergraphResult = null;
      return;
    }
    lastManualHypergraphResult = {
      matrix: data.matrix.map((row) => row.slice()),
      rowLabels: data.rowLabels.slice(),
      colLabels: data.colLabels.slice(),
      sourceText: "graphic-editor",
      createdAt: new Date().toISOString(),
      xtrec: hypergraphEditorAnalysis.xtrec || null,
      xtrecPending: false,
      transversal: hypergraphEditorAnalysis.transversal || hypergraphEditorAnalysis.exactTransversal || null,
      rExact: hypergraphEditorAnalysis.rExact || null,
      structure: hypergraphEditorAnalysis.structure || null,
      cExact: hypergraphEditorAnalysis.cExact || null,
      structuralXt: hypergraphEditorAnalysis.structuralXt || null,
      fra: hypergraphReducedResult || null
    };
  }

  function invalidateHypergraphEditorAnalysis(clearFra) {
    hypergraphEditorSourceInfo = null;
    hypergraphEditorAnalysis = {
      xtrec: null,
      transversal: null,
      exactTransversal: null,
      allTransversals: null,
      rExact: null,
      structure: null,
      cExact: null,
      structuralXt: null
    };
    setHypergraphRExactSummary("");
    setHypergraphStructureSummary("");
    setHypergraphCExactSummary("");
    setHypergraphStructuralXtSummary("");
    clearHypergraphTransversalView(false);
    if (clearFra !== false) {
      hypergraphReducedResult = null;
      hypergraphShowReduced = false;
    }
    if (hypergraphToggleReducedBtn) {
      hypergraphToggleReducedBtn.disabled = !hypergraphReducedResult;
      hypergraphToggleReducedBtn.textContent = hypergraphShowReduced
        ? t("hypergraphEditor.showOriginal")
        : t("hypergraphEditor.showReduced");
    }
    syncManualHypergraphResultFromEditor();
  }

  function updateHypergraphEditorSummary() {
    const data = getHypergraphMatrixFromState();
    const xtrecText = hypergraphEditorAnalysis.xtrec && typeof hypergraphEditorAnalysis.xtrec.isXt === "boolean"
      ? `XTREC=${hypergraphEditorAnalysis.xtrec.isXt ? "TRUE" : "FALSE"}`
      : "XTREC=-";
    const fraText = hypergraphReducedResult
      ? `FRA=${hypergraphReducedResult.reducedRowLabels.length}x${hypergraphReducedResult.reducedColLabels.length}`
      : "FRA=-";
    const rExactText = hypergraphEditorAnalysis.rExact
      ? `r*=${formatInteger(Number(hypergraphEditorAnalysis.rExact.rStar || 0))}`
      : "r*=-";
    const structureText = hypergraphEditorAnalysis.structure
      ? `rank=${formatInteger(Number(hypergraphEditorAnalysis.structure.rank || 0))}`
      : "rank=-";
    const cExactText = hypergraphEditorAnalysis.cExact
      ? `c-levels=${formatInteger(Number((hypergraphEditorAnalysis.cExact.levels || []).length))}`
      : "c-levels=-";
    const structuralXtText = t("app.hypergraph.structuralFlag", {
      value: hypergraphEditorAnalysis.structuralXt
        ? t(hypergraphEditorAnalysis.structuralXt.structurallyCertified ? "app.hypergraph.yes" : "app.hypergraph.no")
        : "-"
    });
    const text = [
      t("app.hypergraph.graphicalSummary", {
        vertices: formatInteger(data.colLabels.length),
        edges: formatInteger(data.rowLabels.length)
      }),
      `${fraText}, ${structureText}, ${cExactText}, ${rExactText}, ${structuralXtText}, ${xtrecText}`,
      t("app.hypergraph.verticesLine", { labels: data.colLabels.join(", ") }),
      t("app.hypergraph.edgesLine", { labels: data.rowLabels.join(", ") })
    ].join("\n");
    if (hypergraphEditorSummary) {
      hypergraphEditorSummary.textContent = data.colLabels.length || data.rowLabels.length
        ? text
        : t("hypergraphEditor.summaryNone");
    }
  }

  function formatSetLabels(indices, labels) {
    return `[${(Array.isArray(indices) ? indices : []).map((index) => labels[index]).filter(Boolean).join(", ")}]`;
  }

  function formatTransversalSolution(solution) {
    if (!solution || !solution.found) {
      return t("app.hypergraph.notFound");
    }
    return `${formatSetLabels(solution.indices, solution.labels || [])}, |T|=${formatInteger((solution.indices || []).length)}`;
  }

  function makeHypergraphTransversalEntry(indices, exact, displayIndex, kind, cValue, meta) {
    return {
      indices: Array.isArray(indices) ? indices.slice() : [],
      exact: Boolean(exact),
      displayIndex: Number.isFinite(Number(displayIndex)) ? Number(displayIndex) : 0,
      kind: String(kind || (exact ? "exact" : "regular")),
      cValue: Number.isFinite(Number(cValue)) ? Number(cValue) : null,
      meta: meta && typeof meta === "object" ? { ...meta } : {}
    };
  }

  function makeHypergraphTransversalSolution(entry, labels) {
    if (!entry || !Array.isArray(entry.indices)) {
      return { found: false, exact: Boolean(entry && entry.exact), indices: [], labels: Array.isArray(labels) ? labels.slice() : [] };
    }
    return {
      found: true,
      exact: Boolean(entry.exact),
      indices: entry.indices.slice(),
      labels: Array.isArray(labels) ? labels.slice() : []
    };
  }

  function formatHypergraphTransversalEntry(entry, labels) {
    if (!entry) {
      return "";
    }
    if (entry.kind === "cexact") {
      const cValue = Number(entry.cValue || 0);
      const displayIndex = Number(entry.displayIndex || 0) + 1;
      return `C${formatInteger(cValue)}.${displayIndex}: ${formatSetLabels(entry.indices, labels)} |S|=${formatInteger((entry.indices || []).length)}`;
    }
    if (entry.kind === "fuzzy-best") {
      const quality = entry.meta && entry.meta.quality !== undefined
        ? `, E=${formatNumber(Number(entry.meta.quality), 3)}`
        : "";
      const coupling = entry.meta && entry.meta.coupling !== undefined
        ? `, coupling=${formatNumber(Number(entry.meta.coupling), 3)}`
        : "";
      return `T*: ${formatSetLabels(entry.indices, labels)} |T|=${formatInteger((entry.indices || []).length)}${quality}${coupling}`;
    }
    if (entry.kind === "fuzzy-alpha") {
      const alpha = entry.meta && entry.meta.alpha !== undefined
        ? formatNumber(Number(entry.meta.alpha), 2)
        : "-";
      const quality = entry.meta && entry.meta.quality !== undefined
        ? `, E=${formatNumber(Number(entry.meta.quality), 3)}`
        : "";
      return `α=${alpha}: ${formatSetLabels(entry.indices, labels)} |T|=${formatInteger((entry.indices || []).length)}${quality}`;
    }
    if (entry.kind === "selection") {
      const method = entry.meta && entry.meta.method
        ? transversalMethodLabel(String(entry.meta.method || ""))
        : t("app.hypergraph.method");
      const source = entry.meta && entry.meta.source === "recommended" ? t("app.hypergraph.recommendation") : method;
      const prefix = entry.exact ? "X" : "T";
      return `${prefix} ${source}: ${formatSetLabels(entry.indices, labels)} |T|=${formatInteger((entry.indices || []).length)}`;
    }
    const prefix = entry.exact ? "X" : "T";
    const displayIndex = Number(entry.displayIndex || 0) + 1;
    return `${prefix}${displayIndex}: ${formatSetLabels(entry.indices, labels)} |T|=${formatInteger((entry.indices || []).length)}`;
  }

  function getSelectedHypergraphTransversalEntry() {
    const candidates = Array.isArray(hypergraphTransversalView.candidates)
      ? hypergraphTransversalView.candidates
      : [];
    const index = Number(hypergraphTransversalView.selectedIndex);
    if (!Number.isInteger(index) || index < 0 || index >= candidates.length) {
      return null;
    }
    return candidates[index] || null;
  }

  function getSelectedHypergraphTransversalLabels() {
    const entry = getSelectedHypergraphTransversalEntry();
    const labels = Array.isArray(hypergraphTransversalView.labels)
      ? hypergraphTransversalView.labels
      : [];
    if (!entry) {
      return null;
    }
    const selectedLabels = (entry.indices || [])
      .map((index) => labels[index])
      .filter(Boolean);
    return {
      labels: selectedLabels,
      labelSet: new Set(selectedLabels.map(String)),
      exact: Boolean(entry.exact),
      entry
    };
  }

  function setHypergraphTransversalDetails(text) {
    if (!hypergraphTransversalDetails) {
      return;
    }
    hypergraphTransversalDetails.textContent = text && String(text).trim()
      ? String(text)
      : t("hypergraphEditor.transversalHint");
  }

  function syncHypergraphTransversalPicker() {
    const candidates = Array.isArray(hypergraphTransversalView.candidates)
      ? hypergraphTransversalView.candidates
      : [];
    if (!hypergraphTransversalPicker || !hypergraphTransversalSelect) {
      return;
    }
    const hasCandidates = candidates.length > 0;
    hypergraphTransversalPicker.classList.toggle("hidden", !hasCandidates);
    hypergraphTransversalSelect.innerHTML = "";
    if (!hasCandidates) {
      setHypergraphTransversalDetails("");
      return;
    }
    const labels = Array.isArray(hypergraphTransversalView.labels)
      ? hypergraphTransversalView.labels
      : [];
    candidates.forEach((entry, index) => {
      const option = document.createElement("option");
      option.value = String(index);
      option.textContent = formatHypergraphTransversalEntry(entry, labels);
      hypergraphTransversalSelect.appendChild(option);
    });
    const selectedIndex = Math.max(0, Math.min(candidates.length - 1, Number(hypergraphTransversalView.selectedIndex) || 0));
    hypergraphTransversalView.selectedIndex = selectedIndex;
    hypergraphTransversalSelect.value = String(selectedIndex);
    const activeEntry = candidates[selectedIndex];
    if (activeEntry) {
      let prefix = t(activeEntry.exact ? "app.hypergraph.exactTransversal" : "app.hypergraph.transversal");
      if (activeEntry.kind === "cexact") {
        prefix = `${t("hypergraphEditor.cExactSelected")} c=${formatInteger(Number(activeEntry.cValue || 0))}`;
      } else if (activeEntry.kind === "fuzzy-best") {
        prefix = "Fuzzy T*";
      } else if (activeEntry.kind === "fuzzy-alpha") {
        prefix = `α-cut ${activeEntry.meta && activeEntry.meta.alpha !== undefined ? formatNumber(Number(activeEntry.meta.alpha), 2) : ""}`.trim();
      } else if (activeEntry.kind === "selection") {
        const method = activeEntry.meta && activeEntry.meta.method
          ? transversalMethodLabel(String(activeEntry.meta.method || ""))
          : t("app.hypergraph.method");
        prefix = `${t(activeEntry.exact ? "app.hypergraph.exactTransversal" : "app.hypergraph.transversal")} (${method})`;
      }
      setHypergraphTransversalDetails(`${prefix}: ${formatSetLabels(activeEntry.indices, labels)}`);
    } else {
      setHypergraphTransversalDetails("");
    }
  }

  function clearHypergraphTransversalView(shouldRender) {
    hypergraphTransversalView = {
      mode: "",
      labels: [],
      candidates: [],
      selectedIndex: -1
    };
    syncHypergraphTransversalPicker();
    if (shouldRender !== false) {
      renderHypergraphEditor();
    }
  }

  function applyHypergraphTransversalSelection(index, shouldRender) {
    const candidates = Array.isArray(hypergraphTransversalView.candidates)
      ? hypergraphTransversalView.candidates
      : [];
    if (candidates.length === 0) {
      clearHypergraphTransversalView(shouldRender);
      return;
    }
    const selectedIndex = Math.max(0, Math.min(candidates.length - 1, Number(index) || 0));
    hypergraphTransversalView.selectedIndex = selectedIndex;
    const entry = candidates[selectedIndex];
    const solution = makeHypergraphTransversalSolution(entry, hypergraphTransversalView.labels);
    if (entry.kind === "cexact" && hypergraphEditorAnalysis.cExact) {
      hypergraphEditorAnalysis.cExact.selected = {
        indices: entry.indices.slice(),
        cValue: Number(entry.cValue || 0),
        labels: hypergraphTransversalView.labels.slice()
      };
      renderHypergraphCExactSummary(hypergraphEditorAnalysis.cExact);
    } else if (entry.exact) {
      hypergraphEditorAnalysis.exactTransversal = solution;
    } else {
      hypergraphEditorAnalysis.transversal = solution;
    }
    syncManualHypergraphResultFromEditor();
    syncHypergraphTransversalPicker();
    if (entry.kind === "cexact" && hypergraphEditorAnalysis.cExact) {
      setHypergraphEditorOutput(formatHypergraphEditorOutput());
    }
    if (shouldRender !== false) {
      renderHypergraphEditor();
    }
  }

  function formatAllTransversalBlock(result) {
    if (!result) {
      return t("app.hypergraph.allNotRun");
    }
    const lines = [];
    lines.push(t("app.hypergraph.allMinimal", {
      count: formatInteger(result.minimal.length),
      truncated: result.truncated ? t("app.hypergraph.truncated") : ""
    }));
    result.minimal.slice(0, 80).forEach((indices, index) => {
      lines.push(`  T${index + 1}=${formatSetLabels(indices, result.labels)}`);
    });
    if (result.minimal.length > 80) {
      lines.push(`  ... +${formatInteger(result.minimal.length - 80)}`);
    }
    lines.push(t("app.hypergraph.allExact", {
      count: formatInteger(result.exact.length),
      truncated: result.truncated ? t("app.hypergraph.truncated") : ""
    }));
    result.exact.slice(0, 80).forEach((indices, index) => {
      lines.push(`  X${index + 1}=${formatSetLabels(indices, result.labels)}`);
    });
    if (result.exact.length > 80) {
      lines.push(`  ... +${formatInteger(result.exact.length - 80)}`);
    }
    lines.push(t("app.hypergraph.searchSpace", {
      checked: formatInteger(result.checkedSubsets),
      total: formatInteger(result.totalSubsets)
    }));
    return lines.join("\n");
  }

  function countHypergraphHits(row, indices) {
    return (Array.isArray(indices) ? indices : []).reduce((sum, colIndex) => (
      sum + (Number((Array.isArray(row) ? row : [])[colIndex] || 0) > 0 ? 1 : 0)
    ), 0);
  }

  function analyzeHypergraphCExactSpectrum(matrix, colLabels, rank) {
    return requireHypergraphCoreFunction("analyzeCExactSpectrum")(matrix, colLabels, rank);
  }

  function analyzeHypergraphStructure(matrix, rowLabels, colLabels) {
    return requireHypergraphCoreFunction("analyzeStructure")(matrix, rowLabels, colLabels);
  }

  function formatHypergraphStructureBlock(result) {
    if (!result) {
      return t("app.hypergraph.classificationNotRun");
    }
    const lines = [];
    lines.push(t("app.hypergraph.classificationTitle"));
    lines.push(t("app.hypergraph.structureMetrics", {
      vertices: formatInteger(result.vertexCount),
      edges: formatInteger(result.edgeCount),
      rank: formatInteger(result.rank),
      minEdge: formatInteger(result.minEdgeSize)
    }));
    lines.push(t("app.hypergraph.uniform", {
      value: result.isUniform
        ? `${t("app.hypergraph.yes")} (${t("app.hypergraph.uniformValue", { value: formatInteger(result.uniformity) })})`
        : t("app.hypergraph.no")
    }));
    lines.push(t("app.hypergraph.linear", {
      value: result.isLinear
        ? t("app.hypergraph.yes")
        : t("app.hypergraph.linearFailure", { value: formatInteger(result.maxIntersection) })
    }));
    lines.push(t("app.hypergraph.simple", {
      value: result.isSimple
        ? t("app.hypergraph.yes")
        : t("app.hypergraph.simpleFailure", { value: formatInteger(result.duplicateEdgeCount) })
    }));
    lines.push(t("app.hypergraph.clutter", {
      value: result.isClutter
        ? t("app.hypergraph.yes")
        : `${t("app.hypergraph.no")}${result.containedText ? ` (${result.containedText})` : ""}`
    }));
    lines.push(t("app.hypergraph.regular", {
      value: result.isRegular
        ? `${t("app.hypergraph.yes")} (${t("app.hypergraph.regularValue", { value: formatInteger(result.regularity) })})`
        : t("app.hypergraph.regularFailure", {
            min: formatInteger(result.minDegree),
            max: formatInteger(result.maxDegree)
          })
    }));
    lines.push(t("app.hypergraph.cExactLine", { value: result.cExactSummary || "-" }));
    if (result.note) {
      lines.push(t("app.hypergraph.note", { note: result.note }));
    }
    return lines.join("\n");
  }

  function formatHypergraphCExactBlock(result) {
    if (!result) {
      return t("app.hypergraph.cSpectrumNotRun");
    }
    const lines = [];
    lines.push(t("app.hypergraph.cSpectrumTitle"));
    lines.push(t("app.hypergraph.cLevels", {
      levels: formatInteger((result.levels || []).length),
      solutions: formatInteger(Number(result.solutionCount || 0))
    }));
    lines.push(t("app.hypergraph.searchSpace", {
      checked: formatInteger(Number(result.checkedSubsets || 0)),
      total: formatInteger(Number(result.totalSubsets || 0))
    }));
    (result.levels || []).forEach((level) => {
      const example = Array.isArray(level.example) && level.example.length
        ? t("app.hypergraph.example", { value: formatSetLabels(level.example, result.labels || []) })
        : "";
      lines.push(`c=${formatInteger(Number(level.cValue || 0))}: ${formatInteger(Number(level.count || 0))}${example}`);
    });
    const selected = result.selected || ((result.candidates || [])[0] || null);
    if (selected) {
      lines.push(t("app.hypergraph.cSelected", {
        c: formatInteger(Number(selected.cValue || 0)),
        set: formatSetLabels(selected.indices || [], result.labels || [])
      }));
    }
    if (result.truncated || result.note) {
      lines.push(t("app.hypergraph.note", { note: result.note || t("app.hypergraph.cExactLimit") }));
    }
    return lines.join("\n");
  }

  function runHypergraphStructureAnalysis() {
    try {
      const data = getHypergraphMatrixFromState();
      const result = analyzeHypergraphStructure(data.matrix, data.rowLabels, data.colLabels);
      hypergraphEditorAnalysis.structure = result;
      syncManualHypergraphResultFromEditor();
      renderHypergraphStructureSummary(result);
      refreshHypergraphEditorText();
      ensureHypergraphResultsVisible();
      setHypergraphEditorStatus(t("app.hypergraph.classificationComplete"), false);
    } catch (error) {
      const message = error instanceof Error ? error.message : t("app.hypergraph.classificationFailed");
      setHypergraphStructureSummary(message, true);
      ensureHypergraphResultsVisible();
      setHypergraphEditorStatus(message, true);
    }
  }

  function runHypergraphCExactSpectrum() {
    try {
      const data = getHypergraphMatrixFromState();
      const structure = analyzeHypergraphStructure(data.matrix, data.rowLabels, data.colLabels);
      const result = analyzeHypergraphCExactSpectrum(data.matrix, data.colLabels, structure.rank);
      result.structure = structure;
      hypergraphEditorAnalysis.structure = structure;
      hypergraphEditorAnalysis.cExact = result;
      const cExactEntries = (result.candidates || []).map((entry, index) => (
        makeHypergraphTransversalEntry(entry.indices, false, index, "cexact", entry.cValue)
      ));
      hypergraphTransversalView = {
        mode: "cexact",
        labels: result.labels.slice(),
        candidates: cExactEntries,
        selectedIndex: cExactEntries.length > 0 ? 0 : -1
      };
      if (cExactEntries.length > 0) {
        applyHypergraphTransversalSelection(0, false);
      } else {
        syncHypergraphTransversalPicker();
      }
      syncManualHypergraphResultFromEditor();
      renderHypergraphStructureSummary(structure);
      renderHypergraphCExactSummary(result);
      refreshHypergraphEditorText();
      ensureHypergraphResultsVisible();
      renderHypergraphEditor();
      setHypergraphEditorStatus(
        (result.levels || []).length > 0
          ? t("app.hypergraph.cExactFound", {
              levels: formatInteger((result.levels || []).length),
              solutions: formatInteger(Number(result.solutionCount || 0))
            })
          : t("app.hypergraph.cExactNone"),
        (result.levels || []).length === 0
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : t("app.hypergraph.cExactFailed");
      setHypergraphCExactSummary(message, true);
      ensureHypergraphResultsVisible();
      setHypergraphEditorStatus(message, true);
    }
  }

  function analyzeHypergraphRExact(matrix, rowLabels, colLabels, targetR) {
    return requireHypergraphCoreFunction("analyzeRExact")(matrix, rowLabels, colLabels, targetR);
  }

  function formatHypergraphRExactSummary(result) {
    if (!result) {
      return "";
    }
    const verdict = t(result.isRExact ? "app.hypergraph.yes" : "app.hypergraph.no");
    const xtText = t("app.hypergraph.xtOneExactValue", {
      value: t(result.isOneExact ? "app.hypergraph.yes" : "app.hypergraph.no")
    });
    return t("app.hypergraph.rSummary", {
      rStar: formatInteger(Number(result.rStar || 0)),
      threshold: formatInteger(Number(result.targetR || 0)),
      verdict,
      xt: xtText,
      minimal: formatInteger(Number(result.minimalCount || 0)),
      warning: result.truncated ? t("app.hypergraph.partial") : ""
    });
  }

  function formatHypergraphRExactBlock(result) {
    if (!result) {
      return t("app.hypergraph.rNotRun");
    }
    const lines = [];
    lines.push(t("app.hypergraph.rResult", {
      value: t(result.isRExact ? "app.hypergraph.yes" : "app.hypergraph.no"),
      r: formatInteger(Number(result.targetR || 0))
    }));
    lines.push(t("app.hypergraph.rRequired", { r: formatInteger(Number(result.rStar || 0)) }));
    lines.push(t("app.hypergraph.xtAsOneExact", {
      value: t(result.isOneExact ? "app.hypergraph.yes" : "app.hypergraph.no")
    }));
    lines.push(t("app.hypergraph.rCounts", {
      minimal: formatInteger(Number(result.minimalCount || 0)),
      exact: formatInteger(Number(result.exactCount || 0))
    }));
    if (result.truncated) {
      lines.push(t("app.hypergraph.rTruncated"));
    }
    if (result.witness) {
      lines.push(t("app.hypergraph.rWitness", {
        index: Number(result.witness.transversalIndex || 0) + 1,
        labels: (result.witness.labels || []).join(", "),
        edge: result.witness.rowLabel,
        hits: formatInteger(Number(result.witness.hits || 0))
      }));
    }
    const distribution = Object.keys(result.distribution || {})
      .map((key) => Number(key))
      .filter((key) => Number.isFinite(key))
      .sort((a, b) => a - b)
      .map((key) => `r=${formatInteger(key)}: ${formatInteger(Number(result.distribution[key] || 0))}`)
      .join(", ");
    if (distribution) {
      lines.push(t("app.hypergraph.rDistribution", { distribution }));
    }
    return lines.join("\n");
  }

  function getHypergraphRExactThreshold() {
    const raw = hypergraphRExactInput ? Number(hypergraphRExactInput.value) : 2;
    return Math.max(1, Math.floor(Number.isFinite(raw) ? raw : 2));
  }

  function runHypergraphRExactAnalysis() {
    try {
      const data = getHypergraphMatrixFromState();
      const targetR = getHypergraphRExactThreshold();
      const result = analyzeHypergraphRExact(data.matrix, data.rowLabels, data.colLabels, targetR);
      hypergraphEditorAnalysis.rExact = result;
      syncManualHypergraphResultFromEditor();
      renderHypergraphRExactSummary(result);
      refreshHypergraphEditorText();
      ensureHypergraphResultsVisible();
      revealHypergraphRExactSummary();
      setHypergraphEditorStatus(formatHypergraphRExactSummary(result), !result.isRExact);
    } catch (error) {
      const message = error instanceof Error ? error.message : t("app.hypergraph.rExactFailed");
      setHypergraphRExactSummary(message, true);
      ensureHypergraphResultsVisible();
      setHypergraphEditorStatus(message, true);
    }
  }

  function formatHypergraphEditorOutput() {
    const data = getHypergraphMatrixFromState();
    return requireExportersCoreFunction("formatHypergraphEditorOutput")({
      matrix: data.matrix,
      rowLabels: data.rowLabels,
      colLabels: data.colLabels,
      reducedResult: hypergraphReducedResult,
      analysis: hypergraphEditorAnalysis
    }, {
      emptyText: t("status.hypergraphEditorOutputNone")
    });
  }

  function refreshHypergraphEditorText() {
    updateHypergraphEditorSummary();
    setHypergraphEditorOutput(formatHypergraphEditorOutput());
    if (hypergraphEditorAnalysis.rExact) {
      renderHypergraphRExactSummary(hypergraphEditorAnalysis.rExact);
    }
    if (hypergraphEditorAnalysis.structure) {
      renderHypergraphStructureSummary(hypergraphEditorAnalysis.structure);
    }
    if (hypergraphEditorAnalysis.cExact) {
      renderHypergraphCExactSummary(hypergraphEditorAnalysis.cExact);
    }
    if (hypergraphEditorAnalysis.structuralXt) {
      renderHypergraphStructuralXtSummary(hypergraphEditorAnalysis.structuralXt);
    }
    syncHypergraphTransversalPicker();
  }

  function applyHypergraphViewTransform() {
    if (!hypergraphViewport) {
      return;
    }
    hypergraphViewport.setAttribute(
      "transform",
      `translate(${hypergraphState.view.panX} ${hypergraphState.view.panY}) scale(${hypergraphState.view.zoom})`
    );
  }

  function updateHypergraphZoomUi() {
    if (hypergraphZoomLevel) {
      hypergraphZoomLevel.textContent = `${Math.round(hypergraphState.view.zoom * 100)}%`;
    }
  }

  function setHypergraphView(zoom, panX, panY) {
    hypergraphState.view.zoom = Math.max(0.15, Math.min(8, Number(zoom) || 1));
    hypergraphState.view.panX = Number(panX) || 0;
    hypergraphState.view.panY = Number(panY) || 0;
    applyHypergraphViewTransform();
    updateHypergraphZoomUi();
    persistHypergraphEditorState();
  }

  function hypergraphPanBy(dx, dy) {
    setHypergraphView(hypergraphState.view.zoom, hypergraphState.view.panX + dx, hypergraphState.view.panY + dy);
  }

  function hypergraphCenter() {
    setHypergraphView(1, 0, 0);
  }

  function hypergraphZoomAt(factor, cx, cy) {
    const current = hypergraphState.view.zoom;
    const next = Math.max(0.15, Math.min(8, current * factor));
    if (Math.abs(next - current) < 0.0001) {
      return;
    }
    const wx = (cx - hypergraphState.view.panX) / current;
    const wy = (cy - hypergraphState.view.panY) / current;
    setHypergraphView(next, cx - wx * next, cy - wy * next);
  }

  function toHypergraphSvgPoint(event) {
    if (!hypergraphCanvas) {
      return { x: 0, y: 0 };
    }
    const pt = hypergraphCanvas.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    const ctm = hypergraphCanvas.getScreenCTM();
    if (!ctm) {
      return { x: pt.x, y: pt.y };
    }
    const transformed = pt.matrixTransform(ctm.inverse());
    return { x: transformed.x, y: transformed.y };
  }

  function toHypergraphCanvasPoint(event) {
    const pt = toHypergraphSvgPoint(event);
    return {
      x: (pt.x - hypergraphState.view.panX) / hypergraphState.view.zoom,
      y: (pt.y - hypergraphState.view.panY) / hypergraphState.view.zoom
    };
  }

  function setHypergraphEditorMode(nextMode) {
    const modeName = nextMode === "vertex" || nextMode === "edge" ? nextMode : "select";
    hypergraphEditorMode = modeName;
    if (modeName !== "edge") {
      hypergraphPendingEdgeVertexIds.clear();
    }
    hypergraphModeButtons.forEach((button) => {
      button.classList.toggle("active", String(button.dataset.hypergraphMode || "") === modeName);
    });
    if (hypergraphCanvas) {
      ["select", "vertex", "edge"].forEach((name) => {
        hypergraphCanvas.classList.toggle(`mode-${name}`, modeName === name);
      });
    }
    const status = modeName === "vertex"
      ? t("app.hypergraph.modeVertexHint")
      : modeName === "edge"
        ? t("app.hypergraph.modeEdgeHint")
        : t("status.hypergraphEditorIdle");
    setHypergraphEditorStatus(status, false);
    renderHypergraphEditor();
  }

  function clearHypergraphSelection() {
    hypergraphSelectedVertexId = null;
    hypergraphSelectedEdgeId = null;
  }

  function resetHypergraphComputedState(clearFra) {
    invalidateHypergraphEditorAnalysis(clearFra);
    refreshHypergraphEditorText();
    syncDecompositionSubnetOptions();
    renderFuzzyHypergraphMappingPanel();
    if (activeWorkspaceTab === "decomposition") {
      refreshDecompositionView();
    }
  }

  function createHypergraphVertex(x, y) {
    const id = `hv${hypergraphState.counters.vertex++}`;
    const label = `v${hypergraphState.vertices.length + 1}`;
    hypergraphState.vertices.push({ id, label, x, y });
    clearHypergraphSelection();
    hypergraphSelectedVertexId = id;
    resetHypergraphComputedState(true);
    persistHypergraphEditorState();
    renderHypergraphEditor();
    setHypergraphEditorStatus(t("app.hypergraph.vertexAdded", { label }), false);
  }

  function createHypergraphEdgeFromPending() {
    const vertexIds = Array.from(hypergraphPendingEdgeVertexIds)
      .filter((id) => hypergraphState.vertices.some((vertex) => vertex.id === id));
    if (vertexIds.length === 0) {
      setHypergraphEditorStatus(t("app.hypergraph.edgeSelectionRequired"), true);
      return;
    }
    const id = `he${hypergraphState.counters.edge++}`;
    const label = `E${hypergraphState.edges.length + 1}`;
    hypergraphState.edges.push({ id, label, vertexIds });
    hypergraphPendingEdgeVertexIds.clear();
    clearHypergraphSelection();
    hypergraphSelectedEdgeId = id;
    resetHypergraphComputedState(true);
    persistHypergraphEditorState();
    renderHypergraphEditor();
    setHypergraphEditorStatus(t("app.hypergraph.edgeAdded", { label }), false);
  }

  function deleteSelectedHypergraphElement() {
    if (hypergraphShowReduced) {
      setHypergraphEditorStatus(t("app.hypergraph.editOriginalRequired"), true);
      return;
    }
    if (hypergraphSelectedVertexId) {
      const removed = getHypergraphVertexLabel(hypergraphSelectedVertexId);
      hypergraphState.vertices = hypergraphState.vertices.filter((vertex) => vertex.id !== hypergraphSelectedVertexId);
      hypergraphState.edges = hypergraphState.edges
        .map((edge) => ({ ...edge, vertexIds: (edge.vertexIds || []).filter((id) => id !== hypergraphSelectedVertexId) }))
        .filter((edge) => edge.vertexIds.length > 0);
      hypergraphPendingEdgeVertexIds.delete(hypergraphSelectedVertexId);
      clearHypergraphSelection();
      resetHypergraphComputedState(true);
      persistHypergraphEditorState();
      renderHypergraphEditor();
      setHypergraphEditorStatus(t("app.hypergraph.vertexRemoved", { label: removed }), false);
      return;
    }
    if (hypergraphSelectedEdgeId) {
      const edge = hypergraphState.edges.find((item) => item.id === hypergraphSelectedEdgeId);
      hypergraphState.edges = hypergraphState.edges.filter((item) => item.id !== hypergraphSelectedEdgeId);
      clearHypergraphSelection();
      resetHypergraphComputedState(true);
      persistHypergraphEditorState();
      renderHypergraphEditor();
      setHypergraphEditorStatus(t("app.hypergraph.edgeRemoved", { label: edge ? edge.label : "" }), false);
      return;
    }
    setHypergraphEditorStatus(t("app.hypergraph.deleteSelectionRequired"), true);
  }

  function clearHypergraphEditor() {
    const hasData = hypergraphState.vertices.length > 0 || hypergraphState.edges.length > 0;
    if (!hasData) {
      setHypergraphEditorStatus(t("app.hypergraph.alreadyEmpty"), false);
      return;
    }
    if (!window.confirm(t("app.hypergraph.clearConfirm"))) {
      return;
    }
    hypergraphState.vertices = [];
    hypergraphState.edges = [];
    hypergraphState.counters.vertex = 1;
    hypergraphState.counters.edge = 1;
    hypergraphPendingEdgeVertexIds.clear();
    clearHypergraphSelection();
    resetHypergraphComputedState(true);
    persistHypergraphEditorState();
    renderHypergraphEditor();
    setHypergraphEditorStatus(t("app.hypergraph.cleared"), false);
  }

  function renameHypergraphVertex(vertexId) {
    if (hypergraphShowReduced) {
      return;
    }
    const vertex = hypergraphState.vertices.find((item) => item.id === vertexId);
    if (!vertex) {
      return;
    }
    const next = window.prompt(t("app.hypergraph.vertexLabelPrompt"), vertex.label);
    if (next === null) {
      return;
    }
    const label = String(next || "").trim();
    if (!label) {
      setHypergraphEditorStatus(t("app.hypergraph.labelRequired"), true);
      return;
    }
    if (hypergraphState.vertices.some((item) => item.id !== vertexId && item.label === label)) {
      setHypergraphEditorStatus(t("app.hypergraph.vertexLabelDuplicate"), true);
      return;
    }
    vertex.label = label;
    resetHypergraphComputedState(true);
    persistHypergraphEditorState();
    renderHypergraphEditor();
  }

  function renameHypergraphEdge(edgeId) {
    if (hypergraphShowReduced) {
      return;
    }
    const edge = hypergraphState.edges.find((item) => item.id === edgeId);
    if (!edge) {
      return;
    }
    const next = window.prompt(t("app.hypergraph.edgeLabelPrompt"), edge.label);
    if (next === null) {
      return;
    }
    const label = String(next || "").trim();
    if (!label) {
      setHypergraphEditorStatus(t("app.hypergraph.labelRequired"), true);
      return;
    }
    if (hypergraphState.edges.some((item) => item.id !== edgeId && item.label === label)) {
      setHypergraphEditorStatus(t("app.hypergraph.edgeLabelDuplicate"), true);
      return;
    }
    edge.label = label;
    resetHypergraphComputedState(true);
    persistHypergraphEditorState();
    renderHypergraphEditor();
  }

  function reduceHypergraphFra(matrix, rowLabels, colLabels) {
    return requireHypergraphCoreFunction("reduceFra")(matrix, rowLabels, colLabels);
  }

  function runHypergraphFraReduction() {
    const data = getHypergraphMatrixFromState();
    if (data.rowLabels.length === 0 || data.colLabels.length === 0) {
      setHypergraphEditorStatus(t("app.hypergraph.fraInputRequired"), true);
      return;
    }
    hypergraphReducedResult = reduceHypergraphFra(data.matrix, data.rowLabels, data.colLabels);
    hypergraphShowReduced = true;
    if (hypergraphToggleReducedBtn) {
      hypergraphToggleReducedBtn.disabled = false;
      hypergraphToggleReducedBtn.textContent = t("hypergraphEditor.showOriginal");
    }
    syncManualHypergraphResultFromEditor();
    if (hypergraphEditorAnalysis.structuralXt) {
      try {
        refreshEditorStructuralXtAnalysis();
      } catch (error) {
        setHypergraphStructuralXtSummary(error instanceof Error ? error.message : t("app.hypergraph.structuralRefreshFailed"), true);
      }
    }
    refreshHypergraphEditorText();
    renderHypergraphEditor();
    ensureHypergraphResultsVisible();
    setHypergraphEditorStatus(t("app.hypergraph.fraApplied"), false);
  }

  function toggleReducedHypergraphView() {
    if (!hypergraphReducedResult) {
      setHypergraphEditorStatus(t("app.hypergraph.fraRequired"), true);
      return;
    }
    hypergraphShowReduced = !hypergraphShowReduced;
    if (hypergraphToggleReducedBtn) {
      hypergraphToggleReducedBtn.textContent = hypergraphShowReduced
        ? t("hypergraphEditor.showOriginal")
        : t("hypergraphEditor.showReduced");
    }
    if (hypergraphEditorAnalysis.structuralXt) {
      try {
        refreshEditorStructuralXtAnalysis();
      } catch (error) {
        setHypergraphStructuralXtSummary(error instanceof Error ? error.message : t("app.hypergraph.structuralRefreshFailed"), true);
      }
      refreshHypergraphEditorText();
    }
    renderHypergraphEditor();
  }

  function enumerateHypergraphTransversals(matrix, colLabels) {
    return requireHypergraphCoreFunction("enumerateTransversals")(matrix, colLabels);
  }

  function runHypergraphTransversal(kind) {
    try {
      const data = getHypergraphMatrixFromState();
      const all = enumerateHypergraphTransversals(data.matrix, data.colLabels);
      if (kind === "exact") {
        hypergraphEditorAnalysis.transversal = null;
      } else if (kind === "regular") {
        hypergraphEditorAnalysis.exactTransversal = null;
      } else if (kind === "all") {
        hypergraphEditorAnalysis.transversal = null;
        hypergraphEditorAnalysis.exactTransversal = null;
      }
      if (kind === "all") {
        hypergraphEditorAnalysis.allTransversals = all;
        const minimalEntries = all.minimal.map((indices, index) => makeHypergraphTransversalEntry(indices, false, index));
        const exactEntries = all.exact.map((indices, index) => makeHypergraphTransversalEntry(indices, true, index));
        hypergraphTransversalView = {
          mode: "all",
          labels: all.labels.slice(),
          candidates: minimalEntries.concat(exactEntries),
          selectedIndex: minimalEntries.length + exactEntries.length > 0 ? 0 : -1
        };
        if (hypergraphTransversalView.candidates.length > 0) {
          applyHypergraphTransversalSelection(0, false);
        } else {
          syncHypergraphTransversalPicker();
        }
        setHypergraphEditorStatus(t("app.hypergraph.transversalsComputed", {
          minimal: formatInteger(all.minimal.length),
          exact: formatInteger(all.exact.length)
        }), false);
      } else if (kind === "exact") {
        const exactEntries = all.exact.map((indices, index) => makeHypergraphTransversalEntry(indices, true, index));
        hypergraphTransversalView = {
          mode: "exact",
          labels: all.labels.slice(),
          candidates: exactEntries,
          selectedIndex: exactEntries.length > 0 ? 0 : -1
        };
        if (exactEntries.length > 0) {
          applyHypergraphTransversalSelection(0, false);
        } else {
          hypergraphEditorAnalysis.exactTransversal = { found: false, exact: true, indices: [], labels: all.labels };
          syncHypergraphTransversalPicker();
        }
        setHypergraphEditorStatus(exactEntries.length > 0
          ? t("app.hypergraph.exactFound", { count: formatInteger(exactEntries.length) })
          : t("app.hypergraph.exactNone"), exactEntries.length === 0);
      } else {
        const minimalEntries = all.minimal.map((indices, index) => makeHypergraphTransversalEntry(indices, false, index));
        hypergraphTransversalView = {
          mode: "regular",
          labels: all.labels.slice(),
          candidates: minimalEntries,
          selectedIndex: minimalEntries.length > 0 ? 0 : -1
        };
        if (minimalEntries.length > 0) {
          applyHypergraphTransversalSelection(0, false);
        } else {
          hypergraphEditorAnalysis.transversal = { found: false, exact: false, indices: [], labels: all.labels };
          syncHypergraphTransversalPicker();
        }
        setHypergraphEditorStatus(minimalEntries.length > 0
          ? t("app.hypergraph.minimalFound", { count: formatInteger(minimalEntries.length) })
          : t("app.hypergraph.minimalNone"), minimalEntries.length === 0);
      }
      syncManualHypergraphResultFromEditor();
      refreshHypergraphEditorText();
      renderHypergraphEditor();
      ensureHypergraphResultsVisible();
    } catch (error) {
      const message = error instanceof Error ? error.message : t("app.hypergraph.transversalFailed");
      ensureHypergraphResultsVisible();
      setHypergraphEditorStatus(message, true);
    }
  }

  async function runHypergraphXtrec() {
    if (isComputationDialogOpen()) {
      return;
    }
    if (hypergraphXtrecWorker) {
      hypergraphXtrecWorker.terminate();
      hypergraphXtrecWorker = null;
    }
    if (!("Worker" in window)) {
      setHypergraphEditorStatus(t("app.hypergraph.workerUnsupported"), true);
      return;
    }
    const data = getDisplayedHypergraphMatrixForStructuralXt();
    if (data.rowLabels.length === 0 || data.colLabels.length === 0) {
      setHypergraphEditorStatus(t("app.hypergraph.xtrecInputRequired"), true);
      return;
    }
    const accelerationMode = await askSelectionHypergraphAccelerationMode();
    if (accelerationMode === "cancel") {
      setHypergraphEditorStatus(t("app.hypergraph.xtrecCancelledBeforeStart"), false);
      return;
    }
    const accelerationLabel = getXtrecAccelerationLabel(accelerationMode);
    hypergraphXtrecJobSequence += 1;
    activeHypergraphXtrecJobId = hypergraphXtrecJobSequence;
    const currentJobId = activeHypergraphXtrecJobId;
    setHypergraphEditorStatus(t("app.hypergraph.xtrecRunning", {
      acceleration: accelerationLabel,
      source: t(`app.hypergraph.${data.sourceLabel}`)
    }), false);
    showComputationDialog(
      "hypergraph-xtrec",
      t("app.hypergraph.xtrecDialogTitle"),
      t("app.hypergraph.xtrecProgress", {
        source: t(`app.hypergraph.${data.sourceLabel}`),
        acceleration: accelerationLabel
      }),
      true
    );
    const worker = new Worker(`public/xtrec-worker.js?v=${Date.now()}`);
    hypergraphXtrecWorker = worker;
    worker.onmessage = (event) => {
      const payload = event.data || {};
      if (Number(payload.jobId || 0) !== currentJobId) {
        return;
      }
      if (payload.type === "progress") {
        const message = payload.message ? String(payload.message) : t("app.hypergraph.xtrecProgressShort");
        setHypergraphEditorStatus(message, false);
        if (activeComputation && activeComputation.type === "hypergraph-xtrec") {
          updateComputationDialog(message);
        }
        return;
      }
      if (payload.type === "error") {
        if (hypergraphXtrecWorker === worker) {
          hypergraphXtrecWorker = null;
        }
        worker.terminate();
        activeHypergraphXtrecJobId = 0;
        setHypergraphEditorStatus(payload.message || t("app.hypergraph.xtrecFailed"), true);
        ensureHypergraphResultsVisible();
        if (activeComputation && activeComputation.type === "hypergraph-xtrec") {
          hideComputationDialog();
        }
        return;
      }
      if (payload.type === "result") {
        if (hypergraphXtrecWorker === worker) {
          hypergraphXtrecWorker = null;
        }
        worker.terminate();
        activeHypergraphXtrecJobId = 0;
        hypergraphEditorAnalysis.xtrec = {
          ...(payload.payload || {}),
          sourceLabel: data.sourceLabel
        };
        syncSelectionHypergraphXtrecFromEditor(data, hypergraphEditorAnalysis.xtrec);
        if (hypergraphEditorAnalysis.structuralXt) {
          try {
            refreshEditorStructuralXtAnalysis();
          } catch (error) {
            setHypergraphStructuralXtSummary(error instanceof Error ? error.message : t("app.hypergraph.structuralRefreshFailed"), true);
          }
        }
        syncManualHypergraphResultFromEditor();
        refreshHypergraphEditorText();
        renderHypergraphEditor();
        ensureHypergraphResultsVisible();
        const isXt = Boolean(hypergraphEditorAnalysis.xtrec && hypergraphEditorAnalysis.xtrec.isXt);
        setHypergraphEditorStatus(t("app.hypergraph.xtrecResultForSource", {
          result: isXt ? "TRUE" : "FALSE",
          source: t(`app.hypergraph.${data.sourceLabel}`)
        }), !isXt);
        if (activeComputation && activeComputation.type === "hypergraph-xtrec") {
          hideComputationDialog();
        }
      }
    };
    worker.onerror = (event) => {
      if (hypergraphXtrecWorker === worker) {
        hypergraphXtrecWorker = null;
      }
      worker.terminate();
      activeHypergraphXtrecJobId = 0;
      setHypergraphEditorStatus(event && event.message
        ? t("app.worker.xtrecFailed", { message: event.message })
        : t("app.worker.xtrecFailedGeneric"), true);
      ensureHypergraphResultsVisible();
      if (activeComputation && activeComputation.type === "hypergraph-xtrec") {
        hideComputationDialog();
      }
    };
    postLocalizedWorkerMessage(worker, {
      type: "compute",
      jobId: currentJobId,
      payload: {
        matrix: data.matrix,
        rowLabels: data.rowLabels,
        colLabels: data.colLabels,
        acceleration: normalizeXtrecAccelerationMode(accelerationMode)
      }
    });
  }

  function buildHypergraphEditorGraphData() {
    if (!hypergraphShowReduced || !hypergraphReducedResult) {
      return {
        vertices: hypergraphState.vertices.map((vertex) => ({ ...vertex, reduced: false })),
        edges: hypergraphState.edges.map((edge, index) => ({
          ...edge,
          vertexIds: (edge.vertexIds || []).slice(),
          color: hypergraphColor(index),
          reduced: false
        })),
        reduced: false
      };
    }
    const originalByLabel = new Map(hypergraphState.vertices.map((vertex) => [String(vertex.label || vertex.id), vertex]));
    const fallback = computeHypergraphVertexPositions(hypergraphReducedResult.reducedColLabels);
    const vertices = hypergraphReducedResult.reducedColLabels.map((label) => {
      const source = originalByLabel.get(label);
      const point = source ? { x: source.x, y: source.y } : (fallback.get(label) || { x: HYPERGRAPH_CANVAS_W / 2, y: HYPERGRAPH_CANVAS_H / 2 });
      return {
        id: `reduced:${label}`,
        label,
        x: point.x,
        y: point.y,
        reduced: true
      };
    });
    const idByLabel = new Map(vertices.map((vertex) => [vertex.label, vertex.id]));
    const edges = hypergraphReducedResult.reducedRowLabels.map((label, rowIndex) => {
      const row = hypergraphReducedResult.reducedMatrix[rowIndex] || [];
      const vertexIds = hypergraphReducedResult.reducedColLabels
        .filter((_, colIndex) => Number(row[colIndex] || 0) > 0)
        .map((vertexLabel) => idByLabel.get(vertexLabel))
        .filter(Boolean);
      return {
        id: `reduced-edge:${label}`,
        label,
        vertexIds,
        color: hypergraphColor(rowIndex),
        reduced: true
      };
    });
    return { vertices, edges, reduced: true };
  }

  function drawHypergraphEditorEdge(renderTarget, edge, nodeById, transversalSelection) {
    const points = (edge.vertexIds || [])
      .map((vertexId) => nodeById.get(vertexId))
      .filter(Boolean)
      .map((vertex) => ({ x: vertex.x, y: vertex.y }));
    const color = edge.color || hypergraphColor(0);
    const transversalLabels = transversalSelection && transversalSelection.labelSet instanceof Set
      ? transversalSelection.labelSet
      : null;
    const transversalHits = transversalLabels
      ? (edge.vertexIds || []).reduce((count, vertexId) => {
        const vertex = nodeById.get(vertexId);
        return vertex && transversalLabels.has(String(vertex.label || vertex.id)) ? count + 1 : count;
      }, 0)
      : 0;
    let shape = null;
    let labelPoint = points.length > 0
      ? hyperedgeCentroid(points)
      : { x: HYPERGRAPH_CANVAS_W / 2, y: HYPERGRAPH_CANVAS_H / 2 };
    if (points.length === 1) {
      shape = document.createElementNS(NS, "ellipse");
      shape.setAttribute("cx", String(points[0].x));
      shape.setAttribute("cy", String(points[0].y));
      shape.setAttribute("rx", "70");
      shape.setAttribute("ry", "60");
      labelPoint = { x: points[0].x, y: points[0].y - 78 };
    } else if (points.length === 2) {
      shape = document.createElementNS(NS, "path");
      shape.setAttribute("d", capsulePath(points[0], points[1], 58));
    } else {
      shape = document.createElementNS(NS, "path");
      shape.setAttribute("d", roundedPolygonPath(expandPointsToDiskHull(points, 44, 18)));
    }
    const edgeClasses = [
      "hypergraph-editor-edge",
      hypergraphSelectedEdgeId === edge.id ? "selected" : "",
      edge.reduced ? "reduced" : "",
      transversalLabels && transversalHits > 0 ? "transversal-covered" : "",
      transversalLabels && transversalHits > 1 ? "transversal-overhit" : ""
    ].filter(Boolean).join(" ");
    shape.setAttribute("class", edgeClasses);
    shape.setAttribute("fill", color);
    shape.setAttribute("stroke", color);
    shape.dataset.hyperedgeId = edge.id;
    renderTarget.appendChild(shape);

    const label = document.createElementNS(NS, "text");
    label.setAttribute("x", String(labelPoint.x));
    label.setAttribute("y", String(labelPoint.y));
    label.setAttribute("class", `hypergraph-editor-edge-label${transversalLabels && transversalHits > 0 ? " transversal-covered" : ""}`);
    label.setAttribute("fill", color);
    label.dataset.hyperedgeId = edge.id;
    label.textContent = String(edge.label || edge.id);
    renderTarget.appendChild(label);
  }

  function renderHypergraphEditor() {
    if (!hypergraphCanvas || !hypergraphViewport) {
      return;
    }
    hypergraphViewport.innerHTML = "";
    applyHypergraphViewTransform();
    const graph = buildHypergraphEditorGraphData();
    const nodeById = new Map(graph.vertices.map((vertex) => [vertex.id, vertex]));
    const transversalSelection = getSelectedHypergraphTransversalLabels();
    const transversalLabelSet = transversalSelection && transversalSelection.labelSet instanceof Set
      ? transversalSelection.labelSet
      : null;
    graph.edges.forEach((edge) => drawHypergraphEditorEdge(hypergraphViewport, edge, nodeById, transversalSelection));

    if (!graph.reduced && hypergraphPendingEdgeVertexIds.size > 1) {
      const pendingPoints = Array.from(hypergraphPendingEdgeVertexIds)
        .map((vertexId) => nodeById.get(vertexId))
        .filter(Boolean)
        .map((vertex) => ({ x: vertex.x, y: vertex.y }));
      const pendingShape = document.createElementNS(NS, "path");
      if (pendingPoints.length === 2) {
        pendingShape.setAttribute("d", capsulePath(pendingPoints[0], pendingPoints[1], 46));
      } else if (pendingPoints.length > 2) {
        pendingShape.setAttribute("d", roundedPolygonPath(expandPointsToDiskHull(pendingPoints, 38, 18)));
      }
      pendingShape.setAttribute("class", "hypergraph-editor-pending-edge");
      hypergraphViewport.appendChild(pendingShape);
    }

    graph.vertices.forEach((vertex) => {
      const group = document.createElementNS(NS, "g");
      group.setAttribute("class", "hypergraph-editor-vertex-group");
      group.dataset.hypervertexId = vertex.id;
      const isSelected = hypergraphSelectedVertexId === vertex.id;
      const isPending = !graph.reduced && hypergraphPendingEdgeVertexIds.has(vertex.id);
      const isTransversalVertex = transversalLabelSet && transversalLabelSet.has(String(vertex.label || vertex.id));
      const isTransversalMuted = transversalLabelSet && !isTransversalVertex;
      const circle = document.createElementNS(NS, "circle");
      circle.setAttribute("cx", String(vertex.x));
      circle.setAttribute("cy", String(vertex.y));
      circle.setAttribute("r", "30");
      circle.setAttribute("class", [
        "hypergraph-editor-vertex",
        isSelected ? "selected" : "",
        isPending ? "pending" : "",
        vertex.reduced ? "reduced" : "",
        isTransversalVertex ? "transversal" : "",
        isTransversalMuted ? "transversal-muted" : ""
      ].filter(Boolean).join(" "));
      circle.dataset.hypervertexId = vertex.id;
      group.appendChild(circle);
      const label = document.createElementNS(NS, "text");
      label.setAttribute("x", String(vertex.x));
      label.setAttribute("y", String(vertex.y));
      label.setAttribute("class", [
        "hypergraph-editor-vertex-label",
        isTransversalVertex ? "transversal" : "",
        isTransversalMuted ? "transversal-muted" : ""
      ].filter(Boolean).join(" "));
      label.dataset.hypervertexId = vertex.id;
      label.textContent = String(vertex.label || vertex.id);
      group.appendChild(label);
      hypergraphViewport.appendChild(group);
    });
    updateHypergraphZoomUi();
    refreshHypergraphEditorText();
  }

  function getHypergraphVertexIdFromEvent(event) {
    const target = event.target;
    if (!(target instanceof Element)) {
      return "";
    }
    const node = target.closest("[data-hypervertex-id]");
    return node ? String(node.getAttribute("data-hypervertex-id") || "") : "";
  }

  function getHypergraphEdgeIdFromEvent(event) {
    const target = event.target;
    if (!(target instanceof Element)) {
      return "";
    }
    const node = target.closest("[data-hyperedge-id]");
    return node ? String(node.getAttribute("data-hyperedge-id") || "") : "";
  }

  function buildSelectionHypergraphAnalysisRows(result) {
    return requireExportersCoreFunction("buildSelectionHypergraphAnalysisRows")(result);
  }

  function normalizeSfcProfile(value) {
    return String(value || "").toLowerCase() === "strict" ? "strict" : "hybrid";
  }

  function normalizeSfcSyncMode(value) {
    return String(value || "").toLowerCase() === "none" ? "none" : "handshake";
  }

  function normalizeSfcSourceMode(value) {
    return String(value || "").toLowerCase() === "all-correct" ? "all-correct" : "recommended";
  }

  function normalizeSfcIdeTarget(value) {
    return String(value || "").toLowerCase() === "tia" ? "tia" : "codesys";
  }

  function getSfcTraceLength() {
    const raw = sfcTraceLengthInput ? parseInt(String(sfcTraceLengthInput.value || "300"), 10) : 300;
    if (!Number.isInteger(raw)) {
      return 300;
    }
    return Math.max(10, Math.min(5000, raw));
  }

  function parseSfcMaxPlusDelayMap(rawText) {
    const text = String(rawText || "").trim();
    if (!text) {
      return {};
    }
    const out = {};
    text.split(/[;,]+/).forEach((entry) => {
      const item = String(entry || "").trim();
      if (!item) {
        return;
      }
      const parts = item.split("=");
      if (parts.length !== 2) {
        return;
      }
      const key = String(parts[0] || "").trim();
      const value = Number(String(parts[1] || "").replace(",", "."));
      if (!key || !Number.isFinite(value) || value < 0) {
        return;
      }
      out[key] = value;
    });
    return out;
  }

  function getSfcMaxPlusOptions() {
    const defaultDelayRaw = Number(sfcMaxPlusDefaultDelayInput ? sfcMaxPlusDefaultDelayInput.value : 1);
    const defaultDelay = Number.isFinite(defaultDelayRaw) && defaultDelayRaw >= 0 ? defaultDelayRaw : 1;
    const syncOverheadRaw = Number(sfcMaxPlusSyncOverheadInput ? sfcMaxPlusSyncOverheadInput.value : 0);
    const syncOverhead = Number.isFinite(syncOverheadRaw) && syncOverheadRaw >= 0 ? syncOverheadRaw : 0;
    const delayMap = parseSfcMaxPlusDelayMap(sfcMaxPlusDelayMapInput ? sfcMaxPlusDelayMapInput.value : "");
    return {
      defaultDelay,
      syncOverhead,
      delayMap
    };
  }

  function collectSfcNetSnapshot() {
    return {
      nodes: state.nodes.map((node) => ({
        id: node.id,
        type: node.type,
        label: String(node.label || node.id),
        tokens: node.type === "place" ? Math.max(0, parseInt(String(node.tokens || 0), 10) || 0) : 0
      })),
      arcs: state.arcs.map((arc) => ({
        from: arc.from,
        to: arc.to,
        weight: Math.max(1, parseInt(String(arc.weight || 1), 10) || 1)
      }))
    };
  }

  function collectSfcSubnetSelection(sourceMode) {
    if (!lastPinvariantResult || !Array.isArray(lastPinvariantResult.invariants)) {
      throw new Error(t("app.sfc.pinvariantsRequired"));
    }

    const mode = normalizeSfcSourceMode(sourceMode);
    const invariants = lastPinvariantResult.invariants;
    const requestedLabels = [];

    if (mode === "recommended") {
      const recommended = lastSelectionHypergraphResult
        && lastSelectionHypergraphResult.transversal
        && lastSelectionHypergraphResult.transversal.recommended
        ? lastSelectionHypergraphResult.transversal.recommended
        : null;
      const labels = Array.isArray(recommended && recommended.solutionLabels)
        ? recommended.solutionLabels
        : [];
      if (!recommended || !recommended.found || labels.length === 0) {
        throw new Error(t("app.sfc.recommendedRequired"));
      }
      labels.forEach((label) => requestedLabels.push(String(label)));
    } else {
      invariants.forEach((inv, index) => {
        if (inv && inv.correctSubnet) {
          requestedLabels.push(`D${index + 1}`);
        }
      });
    }

    const selected = [];
    const seen = new Set();
    requestedLabels.forEach((labelText) => {
      const label = String(labelText || "").trim();
      const match = /^D(\d+)$/i.exec(label);
      if (!match) {
        return;
      }
      const invIndex = parseInt(match[1], 10) - 1;
      if (!Number.isInteger(invIndex) || invIndex < 0 || invIndex >= invariants.length) {
        return;
      }
      const inv = invariants[invIndex];
      if (!inv || inv.correctSubnet !== true || seen.has(invIndex)) {
        return;
      }
      seen.add(invIndex);
      selected.push({
        label: `D${invIndex + 1}`,
        index: invIndex,
        supportPlaces: Array.isArray(inv.supportPlaces)
          ? inv.supportPlaces.slice().sort(naturalLabelCompare)
          : [],
        vector: Array.isArray(inv.vector) ? inv.vector.slice() : [],
        markedSupportCount: Number(inv.markedSupportCount || 0),
        correctSubnet: Boolean(inv.correctSubnet)
      });
    });

    if (selected.length === 0) {
      throw new Error(t("app.sfc.noAutomataSubnets"));
    }
    return selected;
  }

  function buildSfcJobPayload(actionName) {
    const action = String(actionName || "").toLowerCase();
    const netSnapshot = collectSfcNetSnapshot();
    const profile = normalizeSfcProfile(sfcProfileSelect ? sfcProfileSelect.value : "hybrid");
    const syncMode = normalizeSfcSyncMode(sfcSyncSelect ? sfcSyncSelect.value : "handshake");
    const sourceMode = normalizeSfcSourceMode(sfcSourceSelect ? sfcSourceSelect.value : "recommended");
    const ideTarget = normalizeSfcIdeTarget(sfcIdeTargetSelect ? sfcIdeTargetSelect.value : "codesys");
    const traceLength = getSfcTraceLength();
    const maxPlus = getSfcMaxPlusOptions();
    const benchmarkName = getMetadataValue(state.metadata, "Benchmark") || getMetadataValue(state.metadata, "LibraryFile") || "POOH_Net";

    const payload = {
      action,
      net: netSnapshot,
      options: {
        profile,
        syncMode,
        sourceMode,
        ideTarget,
        traceLength,
        maxPlus
      },
      modelName: String(benchmarkName || "POOH_Net")
    };

    if (action === "build") {
      payload.subnets = collectSfcSubnetSelection(sourceMode);
      payload.placeIds = Array.isArray(lastPinvariantResult && lastPinvariantResult.placeIds)
        ? lastPinvariantResult.placeIds.slice()
        : [];
    } else if (action === "validate") {
      if (!lastSfcResult || !lastSfcResult.model) {
        throw new Error(t("app.sfc.validationModelRequired"));
      }
      payload.model = lastSfcResult.model;
    } else if (action === "maxplus") {
      if (!lastSfcResult || !lastSfcResult.model) {
        throw new Error(t("app.sfc.maxPlusModelRequired"));
      }
      payload.model = lastSfcResult.model;
    } else {
      throw new Error(t("app.sfc.actionUnsupported"));
    }

    return payload;
  }

  function formatSfcModelOutput(result) {
    return requireExportersCoreFunction("formatSfcModelOutput")(result, { emptyText: t("status.sfcOutputNone") });
  }

  function formatSfcValidationOutput(result) {
    return requireExportersCoreFunction("formatSfcValidationOutput")(result, { emptyText: t("status.sfcValidationNone") });
  }

  function formatSfcMaxPlusResultOutput(result) {
    return requireExportersCoreFunction("formatSfcMaxPlusResultOutput")(result, { emptyText: t("status.sfcMaxPlusNone") });
  }

  function clamp01(value) {
    const core = getFuzzyCore();
    if (core && typeof core.clamp01 === "function") {
      return core.clamp01(value);
    }
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return 0;
    }
    return Math.max(0, Math.min(1, numeric));
  }

  const FUZZY_MEMBERSHIP_DEFAULT_WEIGHTS = Object.freeze({
    base: 0.34,
    concurrency: 0.16,
    noConflict: 0.16,
    timing: 0.16,
    lowCoupling: 0.10,
    lowReconfiguration: 0.08
  });

  function readFuzzyWeight(input, fallback) {
    const numeric = Number(input ? input.value : fallback);
    return Number.isFinite(numeric) && numeric >= 0 ? clamp01(numeric) : fallback;
  }

  function getFuzzySourceMode() {
    const value = fuzzySourceSelect ? String(fuzzySourceSelect.value || "") : "petri";
    return value === "hypergraph" ? "hypergraph" : "petri";
  }

  function updateFuzzySourceNote() {
    if (!fuzzySourceNote) {
      return;
    }
    fuzzySourceNote.textContent = getFuzzySourceMode() === "hypergraph"
      ? t("fuzzy.sourceNoteHypergraph")
      : t("fuzzy.sourceNotePetri");
  }

  function getFuzzyMappingRecord(label) {
    const key = String(label || "");
    if (!fuzzyHypergraphMappings[key] || typeof fuzzyHypergraphMappings[key] !== "object") {
      fuzzyHypergraphMappings[key] = {
        subnetLabel: "",
        customPlaces: "",
        customTransitions: ""
      };
    }
    return fuzzyHypergraphMappings[key];
  }

  function parseFuzzyMappingIdList(text) {
    return Array.from(new Set(String(text || "")
      .replace(/[;|]/g, ",")
      .split(/[,\s]+/)
      .map((item) => item.trim())
      .filter(Boolean)))
      .sort(naturalLabelCompare);
  }

  function getPetriNodeIdsByType(typeName) {
    return new Set(state.nodes
      .filter((node) => node.type === typeName)
      .map((node) => String(node.id)));
  }

  function filterExistingPetriIds(ids, typeName) {
    const allowed = getPetriNodeIdsByType(typeName);
    return (Array.isArray(ids) ? ids : [])
      .map(String)
      .filter((id) => allowed.has(id))
      .sort(naturalLabelCompare);
  }

  function deriveTransitionsFromPlaces(placeIds) {
    const placeSet = new Set(filterExistingPetriIds(placeIds, "place"));
    const transitionIds = new Set();
    state.arcs.forEach((arc) => {
      if (placeSet.has(String(arc.from))) {
        const node = state.nodes.find((item) => item.id === arc.to);
        if (node && node.type === "transition") {
          transitionIds.add(String(arc.to));
        }
      }
      if (placeSet.has(String(arc.to))) {
        const node = state.nodes.find((item) => item.id === arc.from);
        if (node && node.type === "transition") {
          transitionIds.add(String(arc.from));
        }
      }
    });
    return Array.from(transitionIds).sort(naturalLabelCompare);
  }

  function derivePlacesFromTransitions(transitionIds) {
    const transitionSet = new Set(filterExistingPetriIds(transitionIds, "transition"));
    const placeIds = new Set();
    state.arcs.forEach((arc) => {
      if (transitionSet.has(String(arc.from))) {
        const node = state.nodes.find((item) => item.id === arc.to);
        if (node && node.type === "place") {
          placeIds.add(String(arc.to));
        }
      }
      if (transitionSet.has(String(arc.to))) {
        const node = state.nodes.find((item) => item.id === arc.from);
        if (node && node.type === "place") {
          placeIds.add(String(arc.from));
        }
      }
    });
    return Array.from(placeIds).sort(naturalLabelCompare);
  }

  function getFuzzySmcMappingCandidates() {
    const modes = [
      { mode: "automata-transversal", source: "T*", priority: 0 },
      { mode: "automata-all", source: "SMC", priority: 1 },
      { mode: "automata-pinv", source: "P-inv", priority: 2 }
    ];
    const byLabel = new Map();
    modes.forEach((config) => {
      buildAutomataSubnetsForView(config.mode).forEach((entry) => {
        const label = String(entry.label || "");
        if (!label || byLabel.has(label)) {
          return;
        }
        byLabel.set(label, {
          ...entry,
          source: config.source,
          priority: config.priority,
          display: `${label} [${config.source}] ${formatInteger((entry.supportPlaces || []).length)}P/${formatInteger((entry.transitionIds || []).length)}T`
        });
      });
    });
    return Array.from(byLabel.values())
      .filter((entry) => Array.isArray(entry.supportPlaces) && entry.supportPlaces.length > 0)
      .sort((a, b) => Number(a.priority || 0) - Number(b.priority || 0) || naturalLabelCompare(a.label, b.label));
  }

  function resolveFuzzyHypergraphMapping(label, candidatesByLabel) {
    const record = getFuzzyMappingRecord(label);
    const customPlacesRaw = parseFuzzyMappingIdList(record.customPlaces);
    const customTransitionsRaw = parseFuzzyMappingIdList(record.customTransitions);
    let customPlaces = filterExistingPetriIds(customPlacesRaw, "place");
    let customTransitions = filterExistingPetriIds(customTransitionsRaw, "transition");

    if (customPlaces.length > 0 && customTransitions.length === 0) {
      customTransitions = deriveTransitionsFromPlaces(customPlaces);
    }
    if (customTransitions.length > 0 && customPlaces.length === 0) {
      customPlaces = derivePlacesFromTransitions(customTransitions);
    }
    if (customPlaces.length > 0 || customTransitions.length > 0) {
      return {
        mapped: customPlaces.length > 0 && customTransitions.length > 0,
        source: "custom",
        label: "custom",
        supportPlaces: customPlaces,
        transitionIds: customTransitions
      };
    }

    const subnetLabel = String(record.subnetLabel || "");
    const candidate = subnetLabel ? candidatesByLabel.get(subnetLabel) : null;
    if (candidate) {
      return {
        mapped: true,
        source: candidate.source || "SMC",
        label: candidate.label,
        supportPlaces: (candidate.supportPlaces || []).slice().sort(naturalLabelCompare),
        transitionIds: (candidate.transitionIds || []).slice().sort(naturalLabelCompare)
      };
    }

    return {
      mapped: false,
      source: "none",
      label: "",
      supportPlaces: [],
      transitionIds: []
    };
  }

  function countResolvedFuzzyMappings(labels, candidatesByLabel) {
    return (Array.isArray(labels) ? labels : []).reduce((count, label) => {
      const resolved = resolveFuzzyHypergraphMapping(label, candidatesByLabel);
      return count + (resolved.mapped ? 1 : 0);
    }, 0);
  }

  function setFuzzyMappingStatus(text, isError) {
    if (!fuzzyMappingStatus) {
      return;
    }
    fuzzyMappingStatus.textContent = text || "";
    fuzzyMappingStatus.style.color = isError ? "var(--danger)" : "";
  }

  function renderFuzzyHypergraphMappingPanel() {
    if (!fuzzyMappingCard || !fuzzyMappingList) {
      return;
    }
    const enabled = getFuzzySourceMode() === "hypergraph";
    fuzzyMappingCard.classList.toggle("hidden", !enabled);
    if (!enabled) {
      return;
    }

    const data = getHypergraphMatrixFromState();
    const labels = data.colLabels || [];
    const candidates = getFuzzySmcMappingCandidates();
    const candidatesByLabel = new Map(candidates.map((entry) => [String(entry.label), entry]));
    fuzzyMappingList.replaceChildren();

    if (labels.length === 0) {
      setFuzzyMappingStatus(t("fuzzy.mappingNone"), true);
      return;
    }

    const mappedCount = countResolvedFuzzyMappings(labels, candidatesByLabel);
    const statusTemplate = t("fuzzy.mappingStatus");
    setFuzzyMappingStatus(
      statusTemplate
        .replace("{vertices}", formatInteger(labels.length))
        .replace("{smc}", formatInteger(candidates.length))
        .replace("{mapped}", formatInteger(mappedCount)),
      candidates.length === 0 && mappedCount === 0
    );
    if (candidates.length === 0) {
      const warning = document.createElement("div");
      warning.className = "fuzzy-mapping-warning";
      warning.textContent = t("fuzzy.mappingNoSmc");
      fuzzyMappingList.appendChild(warning);
    }

    labels.forEach((label, colIndex) => {
      const record = getFuzzyMappingRecord(label);
      const supportEdges = data.rowLabels.filter((_, rowIndex) => Number((data.matrix[rowIndex] || [])[colIndex] || 0) > 0);
      const row = document.createElement("div");
      row.className = "fuzzy-mapping-row";

      const head = document.createElement("div");
      head.className = "fuzzy-mapping-row-head";
      const name = document.createElement("strong");
      name.textContent = String(label);
      const support = document.createElement("span");
      support.textContent = `E: [${supportEdges.join(", ")}]`;
      head.append(name, support);

      const selectLabel = document.createElement("label");
      const selectTitle = document.createElement("span");
      selectTitle.textContent = t("fuzzy.mappingSubnet");
      const select = document.createElement("select");
      const empty = document.createElement("option");
      empty.value = "";
      empty.textContent = t("fuzzy.mappingUnmapped");
      select.appendChild(empty);
      candidates.forEach((candidate) => {
        const option = document.createElement("option");
        option.value = candidate.label;
        option.textContent = candidate.display;
        select.appendChild(option);
      });
      select.value = candidatesByLabel.has(record.subnetLabel) ? record.subnetLabel : "";
      select.addEventListener("change", () => {
        record.subnetLabel = select.value;
        lastFuzzyMaxPlusResult = null;
        clearFuzzyResult();
        renderFuzzyHypergraphMappingPanel();
      });
      selectLabel.append(selectTitle, select);

      const placesLabel = document.createElement("label");
      const placesTitle = document.createElement("span");
      placesTitle.textContent = t("fuzzy.mappingCustomPlaces");
      const placesInput = document.createElement("input");
      placesInput.type = "text";
      placesInput.value = record.customPlaces || "";
      placesInput.placeholder = "np. P1 P2";
      placesInput.addEventListener("input", () => {
        record.customPlaces = placesInput.value;
        lastFuzzyMaxPlusResult = null;
        clearFuzzyResult();
      });
      placesLabel.append(placesTitle, placesInput);

      const transitionsLabel = document.createElement("label");
      const transitionsTitle = document.createElement("span");
      transitionsTitle.textContent = t("fuzzy.mappingCustomTransitions");
      const transitionsInput = document.createElement("input");
      transitionsInput.type = "text";
      transitionsInput.value = record.customTransitions || "";
      transitionsInput.placeholder = "np. T1 T2";
      transitionsInput.addEventListener("input", () => {
        record.customTransitions = transitionsInput.value;
        lastFuzzyMaxPlusResult = null;
        clearFuzzyResult();
      });
      transitionsLabel.append(transitionsTitle, transitionsInput);

      row.append(head, selectLabel, placesLabel, transitionsLabel);
      fuzzyMappingList.appendChild(row);
    });
  }

  function autoMapFuzzyHypergraphVertices() {
    const data = getHypergraphMatrixFromState();
    const candidates = getFuzzySmcMappingCandidates();
    if (!data.colLabels.length || candidates.length === 0) {
      renderFuzzyHypergraphMappingPanel();
      return;
    }
    data.colLabels.forEach((label, index) => {
      const record = getFuzzyMappingRecord(label);
      const candidate = candidates[index] || null;
      record.subnetLabel = candidate ? candidate.label : "";
      record.customPlaces = "";
      record.customTransitions = "";
    });
    clearFuzzyResult();
    renderFuzzyHypergraphMappingPanel();
  }

  function clearFuzzyHypergraphMappings() {
    fuzzyHypergraphMappings = {};
    clearFuzzyResult();
    renderFuzzyHypergraphMappingPanel();
  }

  function getFuzzyOptions() {
    const alphaRaw = Number(fuzzyAlphaInput ? fuzzyAlphaInput.value : 0.7);
    const alphaStepRaw = Number(fuzzyAlphaStepInput ? fuzzyAlphaStepInput.value : 0.05);
    const defaultDelayRaw = Number(fuzzyDefaultDelayInput ? fuzzyDefaultDelayInput.value : 1);
	    const syncOverheadRaw = Number(fuzzySyncOverheadInput ? fuzzySyncOverheadInput.value : 0);
	    const maxSizeRaw = parseInt(String(fuzzyMaxSizeInput ? fuzzyMaxSizeInput.value : "0"), 10);
	    const maxCouplingRaw = Number(fuzzyMaxCouplingInput ? fuzzyMaxCouplingInput.value : 1);
	    const lambdaLimitText = String(fuzzyLambdaLimitInput ? fuzzyLambdaLimitInput.value : "").trim();
	    const lambdaLimitRaw = lambdaLimitText === "" ? null : Number(lambdaLimitText);
	    const mpcHorizonRaw = parseInt(String(fuzzyMpcHorizonInput ? fuzzyMpcHorizonInput.value : "6"), 10);
    return {
      source: getFuzzySourceMode(),
      alpha: Number.isFinite(alphaRaw) ? clamp01(alphaRaw) : 0.7,
      alphaStep: Number.isFinite(alphaStepRaw) && alphaStepRaw > 0 ? Math.max(0.01, Math.min(0.5, alphaStepRaw)) : 0.05,
      defaultDelay: Number.isFinite(defaultDelayRaw) && defaultDelayRaw >= 0 ? defaultDelayRaw : 1,
	      syncOverhead: Number.isFinite(syncOverheadRaw) && syncOverheadRaw >= 0 ? syncOverheadRaw : 0,
	      delayMap: parseSfcMaxPlusDelayMap(fuzzyDelayMapInput ? fuzzyDelayMapInput.value : ""),
      membershipWeights: {
        base: readFuzzyWeight(fuzzyMuBaseInput, FUZZY_MEMBERSHIP_DEFAULT_WEIGHTS.base),
        concurrency: readFuzzyWeight(fuzzyMuConcurrencyInput, FUZZY_MEMBERSHIP_DEFAULT_WEIGHTS.concurrency),
        noConflict: readFuzzyWeight(fuzzyMuConflictInput, FUZZY_MEMBERSHIP_DEFAULT_WEIGHTS.noConflict),
        timing: readFuzzyWeight(fuzzyMuTimeInput, FUZZY_MEMBERSHIP_DEFAULT_WEIGHTS.timing),
        lowCoupling: readFuzzyWeight(fuzzyMuCouplingInput, FUZZY_MEMBERSHIP_DEFAULT_WEIGHTS.lowCoupling),
        lowReconfiguration: readFuzzyWeight(fuzzyMuReconfigurationInput, FUZZY_MEMBERSHIP_DEFAULT_WEIGHTS.lowReconfiguration)
      },
	      constraints: {
	        maxComponents: Number.isInteger(maxSizeRaw) && maxSizeRaw > 0 ? maxSizeRaw : null,
	        maxCoupling: Number.isFinite(maxCouplingRaw) ? clamp01(maxCouplingRaw) : 1,
	        lambdaLimit: Number.isFinite(lambdaLimitRaw) && lambdaLimitRaw >= 0 ? lambdaLimitRaw : null
	      },
	      mpc: {
	        horizon: Number.isInteger(mpcHorizonRaw) ? Math.max(1, Math.min(50, mpcHorizonRaw)) : 6
	      },
	      experimentLabel: String(fuzzyExperimentLabelInput ? fuzzyExperimentLabelInput.value : "").trim()
	    };
	  }

  function setFuzzyStatus(message, isError) {
    if (!fuzzyStatus) {
      return;
    }
    fuzzyStatus.textContent = message || "";
    fuzzyStatus.style.color = isError ? "var(--danger)" : "";
  }

  function setFuzzyPipelineOutput(text) {
    if (!fuzzyPipelineOutput) {
      return;
    }
    fuzzyPipelineOutput.textContent = text && String(text).trim()
      ? String(text)
      : t("status.fuzzyPipelineNone");
  }

  function setFuzzyMembershipOutput(text) {
    if (!fuzzyMembershipOutput) {
      return;
    }
    fuzzyMembershipOutput.textContent = text && String(text).trim()
      ? String(text)
      : t("status.fuzzyMembershipNone");
  }

  function setFuzzyRelationsOutput(text) {
    if (!fuzzyRelationsOutput) {
      return;
    }
    fuzzyRelationsOutput.textContent = text && String(text).trim()
      ? String(text)
      : t("status.fuzzyRelationsNone");
  }

  function setFuzzyMaxPlusOutput(text) {
    if (!fuzzyMaxPlusOutput) {
      return;
    }
    fuzzyMaxPlusOutput.textContent = text && String(text).trim()
      ? String(text)
      : t("status.fuzzyMaxPlusNone");
  }

  function setFuzzyRulesOutput(text) {
    if (!fuzzyRulesOutput) {
      return;
    }
    fuzzyRulesOutput.textContent = text && String(text).trim()
      ? String(text)
      : t("status.fuzzyRulesNone");
  }

  function clearFuzzyResult() {
    lastFuzzyMaxPlusResult = null;
    setFuzzyStatus(t("status.fuzzyReady"), false);
    setFuzzyPipelineOutput("");
    setFuzzyMembershipOutput("");
    setFuzzyRelationsOutput("");
    setFuzzyMaxPlusOutput("");
    setFuzzyRulesOutput("");
  }

  function createFuzzyNullMatrix(size) {
    const core = getFuzzyCore();
    if (core && typeof core.createFuzzyNullMatrix === "function") {
      return core.createFuzzyNullMatrix(size);
    }
    throw new Error(t("app.core.missing", { module: "fuzzy", name: "max-plus matrix", path: "src/core/fuzzy.js" }));
  }

  function fuzzyMaxPlusMultiply(matrix, vector) {
    const core = getFuzzyCore();
    if (core && typeof core.fuzzyMaxPlusMultiply === "function") {
      return core.fuzzyMaxPlusMultiply(matrix, vector);
    }
    throw new Error(t("app.core.missing", { module: "fuzzy", name: "max-plus multiplication", path: "src/core/fuzzy.js" }));
  }

  function fuzzyMatrixAdjacency(matrix) {
    const core = getFuzzyCore();
    if (core && typeof core.fuzzyMatrixAdjacency === "function") {
      return core.fuzzyMatrixAdjacency(matrix);
    }
    throw new Error(t("app.core.missing", { module: "fuzzy", name: "max-plus matrix graph", path: "src/core/fuzzy.js" }));
  }

  function computeFuzzySccCount(matrix) {
    const core = getFuzzyCore();
    if (core && typeof core.computeFuzzySccCount === "function") {
      return core.computeFuzzySccCount(matrix);
    }
    throw new Error(t("app.core.missing", { module: "fuzzy", name: "max-plus SCC", path: "src/core/fuzzy.js" }));
  }

  function computeFuzzyMaxCycleMean(matrix) {
    const core = getFuzzyCore();
    if (core && typeof core.computeFuzzyMaxCycleMean === "function") {
      return core.computeFuzzyMaxCycleMean(matrix);
    }
    throw new Error(t("app.core.missing", { module: "fuzzy", name: "max-plus lambda", path: "src/core/fuzzy.js" }));
  }

  function canonicalDirectedCycleKey(cycleNodes) {
    const core = getFuzzyCore();
    if (core && typeof core.canonicalDirectedCycleKey === "function") {
      return core.canonicalDirectedCycleKey(cycleNodes);
    }
    throw new Error(t("app.core.missing", { module: "fuzzy", name: "cycle key", path: "src/core/fuzzy.js" }));
  }

  function computeFuzzyCriticalCycle(matrix, transitions, lambdaHint) {
    const core = getFuzzyCore();
    if (core && typeof core.computeFuzzyCriticalCycle === "function") {
      return core.computeFuzzyCriticalCycle(matrix, transitions, lambdaHint);
    }
    throw new Error(t("app.core.missing", { module: "fuzzy", name: "max-plus critical cycle", path: "src/core/fuzzy.js" }));
  }

  function getFuzzyPlaceDelay(placeId, options) {
    const core = getFuzzyCore();
    if (core && typeof core.getFuzzyPlaceDelay === "function") {
      return core.getFuzzyPlaceDelay(placeId, options);
    }
    throw new Error(t("app.core.missing", { module: "fuzzy", name: "place delays", path: "src/core/fuzzy.js" }));
  }

  function buildSharedTransitionSetForSubnets(entries) {
    const core = getFuzzyCore();
    if (core && typeof core.buildSharedTransitionSetForSubnets === "function") {
      return core.buildSharedTransitionSetForSubnets(entries);
    }
    throw new Error(t("app.core.missing", { module: "fuzzy", name: "shared transitions", path: "src/core/fuzzy.js" }));
  }

  function buildStandaloneMaxPlusForAutomata(entry, sharedTransitionSet, options) {
    const core = getFuzzyCore();
    if (core && typeof core.buildStandaloneMaxPlusForAutomata === "function") {
      return core.buildStandaloneMaxPlusForAutomata(entry, sharedTransitionSet, options, state.arcs);
    }
    throw new Error(t("app.core.missing", { module: "fuzzy", name: "local max-plus model", path: "src/core/fuzzy.js" }));
  }

  function getEntryMaxPlusSupportPlaces(entry) {
    const core = getFuzzyCore();
    if (core && typeof core.getEntryMaxPlusSupportPlaces === "function") {
      return core.getEntryMaxPlusSupportPlaces(entry);
    }
    throw new Error(t("app.core.missing", { module: "fuzzy", name: "max-plus support places", path: "src/core/fuzzy.js" }));
  }

  function compactTransversalMaxPlus(model) {
    const core = getFuzzyCore();
    if (core && typeof core.compactTransversalMaxPlus === "function") {
      return core.compactTransversalMaxPlus(model);
    }
    throw new Error(t("app.core.missing", { module: "fuzzy", name: "A_T summary", path: "src/core/fuzzy.js" }));
  }

  function buildMaxPlusTransversalModel(selectedLabels, entries, options, label, includeMatrix) {
    const core = getFuzzyCore();
    if (core && typeof core.buildMaxPlusTransversalModel === "function") {
      return core.buildMaxPlusTransversalModel(selectedLabels, entries, options, label, includeMatrix, state.arcs);
    }
    throw new Error(t("app.core.missing", { module: "fuzzy", name: "global A_T model", path: "src/core/fuzzy.js" }));
  }

  function relationPairKey(a, b) {
    const core = getFuzzyCore();
    return core && typeof core.relationPairKey === "function"
      ? core.relationPairKey(a, b)
      : [String(a), String(b)].sort(naturalLabelCompare).join("|");
  }

  function relationArrowKey(a, b) {
    const core = getFuzzyCore();
    return core && typeof core.relationArrowKey === "function"
      ? core.relationArrowKey(a, b)
      : `${String(a)}->${String(b)}`;
  }

  function computePetriXtRelations(maxStates) {
    const core = getFuzzyCore();
    if (core && typeof core.computePetriXtRelations === "function") {
      return core.computePetriXtRelations(state.nodes, state.arcs, maxStates);
    }
    throw new Error(t("app.core.missing", { module: "fuzzy", name: "Petri/XT relations", path: "src/core/fuzzy.js" }));
  }

  function normalizeFuzzyMembershipWeights(weights) {
    return requireFuzzyCoreFunction("normalizeFuzzyMembershipWeights")(weights);
  }

  function buildFuzzyMembership(entries, placeIds, maxPlusSubnets, metrics, options) {
    return requireFuzzyCoreFunction("buildFuzzyMembership")(entries, placeIds, maxPlusSubnets, metrics, options);
  }

  function solveAlphaExactCover(placeIds, entries, membership, alpha) {
    return requireFuzzyCoreFunction("solveAlphaExactCover")(placeIds, entries, membership, alpha);
  }

  function computeSelectedCoupling(solutionLabels, couplingByLabel) {
    return requireFuzzyCoreFunction("computeSelectedCoupling")(solutionLabels, couplingByLabel);
  }

  function computeSelectedLambda(solutionLabels, maxPlusByLabel) {
    return requireFuzzyCoreFunction("computeSelectedLambda")(solutionLabels, maxPlusByLabel);
  }

  function evaluateSelectedMaxPlusMapping(solutionLabels, maxPlusByLabel) {
    return requireFuzzyCoreFunction("evaluateSelectedMaxPlusMapping")(solutionLabels, maxPlusByLabel);
  }

  function evaluateFuzzyTransversal(solutionLabels, placeIds, membership, couplingByLabel) {
    return requireFuzzyCoreFunction("evaluateFuzzyTransversal")(solutionLabels, placeIds, membership, couplingByLabel);
  }

  function buildOptimizationCandidate(solutionLabels, placeIds, membership, couplingByLabel, maxPlusByLabel, constraints, evaluatedCount, globalMaxPlusResolver) {
    return requireFuzzyCoreFunction("buildOptimizationCandidate")(solutionLabels, placeIds, membership, couplingByLabel, maxPlusByLabel, constraints, evaluatedCount, globalMaxPlusResolver);
  }

  function compareOptimizationCandidates(a, b) {
    return requireFuzzyCoreFunction("compareOptimizationCandidates")(a, b);
  }

  function optimizeFuzzyTransversal(entries, placeIds, membership, couplingByLabel, maxPlusSubnets, constraints, globalMaxPlusResolver) {
    return requireFuzzyCoreFunction("optimizeFuzzyTransversal")(entries, placeIds, membership, couplingByLabel, maxPlusSubnets, constraints, globalMaxPlusResolver);
  }

  function buildAlphaSweepLevels(selectedAlpha, alphaStep) {
    return requireFuzzyCoreFunction("buildAlphaSweepLevels")(selectedAlpha, alphaStep);
  }

  function summarizeAlphaSweep(alphaCuts, selectedAlpha) {
    return requireFuzzyCoreFunction("summarizeAlphaSweep")(alphaCuts, selectedAlpha);
  }

  function buildAlphaCutReport(entries, placeIds, membership, couplingByLabel, maxPlusSubnets, selectedAlpha, alphaStep, constraints, globalMaxPlusResolver) {
    return requireFuzzyCoreFunction("buildAlphaCutReport")(entries, placeIds, membership, couplingByLabel, maxPlusSubnets, selectedAlpha, alphaStep, constraints, globalMaxPlusResolver);
  }

  function classifyFuzzyLevel(value, invert) {
    return requireFuzzyCoreFunction("classifyFuzzyLevel")(value, invert);
  }

  function buildTakagiSugenoRules(entries, maxPlusSubnets, metrics, membership, context) {
    return requireFuzzyCoreFunction("buildTakagiSugenoRules")(entries, maxPlusSubnets, metrics, membership, context);
  }

  function simpleHashString(value) {
    const text = String(value || "");
    let hash = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  }

  function buildFuzzyExperimentMetadata(options, sourceMode, entries, placeIds, sourceSignature) {
    const modelSignature = sourceSignature || {
      nodes: state.nodes.map((node) => ({
        id: node.id,
        type: node.type,
        tokens: node.type === "place" ? Number(node.tokens || 0) : 0
      })),
      arcs: state.arcs.map((arc) => ({
        from: arc.from,
        to: arc.to,
        weight: Number(arc.weight || 1)
      })),
      sourceMode,
      alpha: options.alpha,
      constraints: options.constraints
    };
    const hash = simpleHashString(JSON.stringify(modelSignature));
    const label = String(options.experimentLabel || "").trim();
    return {
      id: label || `pooh-exp-${hash}`,
      hash,
      schemaVersion: "pooh-research-experiment-1",
      artifactVersion: "pooh-fuzzy-maxplus-optimizer-1",
      createdAt: new Date().toISOString(),
      label,
      model: {
        places: placeIds.length,
        transitions: state.nodes.filter((node) => node.type === "transition").length,
        arcs: state.arcs.length,
        subnets: entries.length,
        sourceMode,
        source: options.source || "petri"
      },
      assumptions: [
        t("app.fuzzy.safeAssumption"),
        t("app.fuzzy.membershipAssumption"),
        t("app.fuzzy.lambdaAssumption")
      ]
    };
  }

  function buildFuzzySupervisorReport(optimization, alphaCut, rules, relationSummary, options, context) {
    return requireFuzzyCoreFunction("buildFuzzySupervisorReport")(optimization, alphaCut, rules, relationSummary, options, context);
  }

  function buildFuzzyMembershipRows(placeIds, entries, membership, details) {
    return requireFuzzyCoreFunction("buildFuzzyMembershipRows")(placeIds, entries, membership, details);
  }

  function buildFuzzyResearchArtifact(config) {
    const core = getFuzzyCore();
    if (!core || typeof core.buildFuzzyResearchArtifact !== "function") {
      throw new Error(t("app.core.missing", { module: "fuzzy", name: "buildFuzzyMembership", path: "src/core/fuzzy.js" }));
    }
    const options = config.options;
    const entries = config.entries;
    const placeIds = config.placeIds;
    return core.buildFuzzyResearchArtifact({
      ...config,
      experiment: buildFuzzyExperimentMetadata(options, config.sourceMode, entries, placeIds, config.sourceSignature),
      generatedAt: new Date().toISOString(),
      nowMs: () => performance.now(),
      transversalResolver: (solutionLabels, includeMatrix) => buildMaxPlusTransversalModel(
        solutionLabels,
        entries,
        options,
        includeMatrix ? "A_T*" : "A_T",
        Boolean(includeMatrix)
      )
    });
  }

  function buildFuzzyPetriResearchModel(options, started) {
    if (!lastPinvariantResult || !Array.isArray(lastPinvariantResult.invariants)) {
      throw new Error(t("app.fuzzy.pinvariantsRequired"));
    }
    if (!lastSelectionHypergraphResult) {
      throw new Error(t("app.fuzzy.selectionRequired"));
    }

    const allEntries = buildAutomataSubnetsForView("automata-all");
    const transversalEntries = buildAutomataSubnetsForView("automata-transversal");
    const entries = transversalEntries.length > 0 ? transversalEntries : allEntries;
    const sourceMode = transversalEntries.length > 0 ? "exact-transversal" : "all-correct-subnets";
    if (entries.length === 0) {
      throw new Error(t("app.fuzzy.smcRequired"));
    }

    const placeIds = Array.isArray(lastPinvariantResult.placeIds)
      ? lastPinvariantResult.placeIds.slice().sort(naturalLabelCompare)
      : Array.from(new Set(entries.flatMap((entry) => entry.supportPlaces || []))).sort(naturalLabelCompare);
    const sharedTransitionSet = buildSharedTransitionSetForSubnets(entries);
    const maxPlusSubnets = entries.map((entry) => buildStandaloneMaxPlusForAutomata(entry, sharedTransitionSet, options));
    const relations = computePetriXtRelations(3500);
    const core = getFuzzyCore();
    if (!core || typeof core.buildFuzzyPetriResearchSource !== "function") {
      throw new Error(t("app.core.missing", { module: "fuzzy", name: "Petri/XT source", path: "src/core/fuzzy.js" }));
    }
    const source = core.buildFuzzyPetriResearchSource({
      entries,
      placeIds,
      maxPlusSubnets,
      relations,
      sharedTransitionSet
    });

    return buildFuzzyResearchArtifact({
      options,
      started,
      entries: source.entries,
      placeIds: source.placeIds,
      maxPlusSubnets: source.maxPlusSubnets,
      metrics: source.metrics,
      couplingByLabel: source.couplingByLabel,
      sourceMode,
      sourceLabel: sourceMode === "exact-transversal" ? "Petri/XT recommended exact transversal" : "Petri/XT all correct SMC subnets",
      pipeline: ["Petri net", "1-exact/XT hypergraph", "SMC decomposition", "local max-plus models", "fuzzy exact optimization", "Takagi-Sugeno fuzzy supervisor", "MPC / verification skeleton"],
      relationSummary: source.relationSummary,
      petriXt: source.petriXt,
      maxPlusAvailable: true,
      ruleSource: "SMC generated from 1-exact/XT decomposition"
    });
  }

  function buildManualHypergraphResearchSource(options) {
    const core = getFuzzyCore();
    if (!core || typeof core.buildFuzzyManualHypergraphResearchSource !== "function") {
      throw new Error(t("app.core.missing", { module: "fuzzy", name: "research pipeline", path: "src/core/fuzzy.js" }));
    }
    const data = getHypergraphMatrixFromState();
    const mappingCandidates = getFuzzySmcMappingCandidates();
    const mappingCandidatesByLabel = new Map(mappingCandidates.map((entry) => [String(entry.label), entry]));
    const mappingsByLabel = new Map((data.colLabels || []).map((label) => [
      String(label),
      resolveFuzzyHypergraphMapping(label, mappingCandidatesByLabel)
    ]));
    return core.buildFuzzyManualHypergraphResearchSource({
      options,
      hypergraph: data,
      mappingsByLabel,
      mappingCandidateCount: mappingCandidates.length,
      buildMaxPlusModel: (entry, sharedTransitionSet, modelOptions) => buildStandaloneMaxPlusForAutomata(
        entry,
        sharedTransitionSet,
        modelOptions || options
      )
    });
  }

  function buildFuzzyManualHypergraphResearchModel(options, started) {
    const source = buildManualHypergraphResearchSource(options);
    return buildFuzzyResearchArtifact({
      options,
      started,
      entries: source.entries,
      placeIds: source.placeIds,
      maxPlusSubnets: source.maxPlusSubnets,
      metrics: source.metrics,
      couplingByLabel: source.couplingByLabel,
      sourceMode: "graphic-hypergraph-exact",
      sourceLabel: "Graphic exact hypergraph",
      pipeline: source.mappedCount > 0
        ? ["graphic hypergraph", "fuzzy exact transversal", "Petri/SMC mapping", "local max-plus models", "structural T-S rules"]
        : ["graphic hypergraph", "fuzzy exact transversal", "alpha-cut XT", "structural T-S rule sketch", "Petri/SMC mapping pending"],
      relationSummary: source.relationSummary,
      petriXt: source.petriXt,
      maxPlusAvailable: source.mappedCount > 0,
      maxPlusNote: source.mappedCount > 0
        ? t("app.fuzzy.mappingSummary", {
            mapped: formatInteger(source.mappedCount),
            total: formatInteger(source.entries.length)
          })
        : t("app.fuzzy.mappingRequired"),
      ruleSource: source.mappedCount > 0
        ? t("app.fuzzy.consequentsGenerated")
        : t("app.fuzzy.candidatesPendingMapping"),
      version: source.mappedCount > 0 ? "pooh-fuzzy-exact-hypergraph-maxplus-1" : "pooh-fuzzy-exact-hypergraph-1",
      sourceSignature: source.sourceSignature
    });
  }

  function buildFuzzyMaxPlusResearchModel() {
    const options = getFuzzyOptions();
    const started = performance.now();
    if (options.source === "hypergraph") {
      return buildFuzzyManualHypergraphResearchModel(options, started);
    }
    return buildFuzzyPetriResearchModel(options, started);
  }

  function formatFuzzyMembershipOutput(result) {
    return requireExportersCoreFunction("formatFuzzyMembershipOutput")(result, { emptyText: t("status.fuzzyMembershipNone") });
  }

  function formatFuzzyPipelineOutput(result) {
    return requireExportersCoreFunction("formatFuzzyPipelineOutput")(result, { emptyText: t("status.fuzzyPipelineNone") });
  }

  function formatFuzzyRelationsOutput(result) {
    return requireExportersCoreFunction("formatFuzzyRelationsOutput")(result, { emptyText: t("status.fuzzyRelationsNone") });
  }

  function formatStandaloneMaxPlusOutput(result) {
    return requireExportersCoreFunction("formatStandaloneMaxPlusOutput")(result, { emptyText: t("status.fuzzyMaxPlusNone") });
  }

  function formatTakagiSugenoRulesOutput(result) {
    return requireExportersCoreFunction("formatTakagiSugenoRulesOutput")(result, { emptyText: t("status.fuzzyRulesNone") });
  }

  function buildFuzzyRulesCsv(result) {
    return requireExportersCoreFunction("buildFuzzyRulesCsv")(result);
  }

  function buildFuzzyAlphaSweepCsv(result) {
    return requireExportersCoreFunction("buildFuzzyAlphaSweepCsv")(result);
  }

  function buildFuzzyMembershipCsv(result) {
    return requireExportersCoreFunction("buildFuzzyMembershipCsv")(result);
  }

  function buildFuzzyLatex(result) {
    return requireExportersCoreFunction("buildFuzzyLatex")(result);
  }

  function buildFuzzyTextReport(result) {
    return requireExportersCoreFunction("buildFuzzyTextReport")(result, {
      pipelineEmptyText: t("status.fuzzyPipelineNone"),
      membershipEmptyText: t("status.fuzzyMembershipNone"),
      relationsEmptyText: t("status.fuzzyRelationsNone"),
      maxPlusEmptyText: t("status.fuzzyMaxPlusNone"),
      rulesEmptyText: t("status.fuzzyRulesNone")
    });
  }

  function hypergraphLabelsToIndices(selectedLabels, labels) {
    const indexByLabel = new Map((Array.isArray(labels) ? labels : []).map((label, index) => [String(label), index]));
    return Array.from(new Set(Array.isArray(selectedLabels) ? selectedLabels.map(String) : []))
      .map((label) => indexByLabel.get(label))
      .filter((index) => Number.isInteger(index))
      .sort((a, b) => a - b);
  }

  function isHypergraphSelectionClassicallyExact(data, selectedLabels) {
    const indices = hypergraphLabelsToIndices(selectedLabels, data && data.colLabels ? data.colLabels : []);
    const rows = Array.isArray(data && data.matrix) ? data.matrix : [];
    return indices.length > 0 && rows.length > 0 && rows.every((row) => countHypergraphHits(row, indices) === 1);
  }

  function buildFuzzyHypergraphVisualizationCandidates(result) {
    if (!result || result.sourceMode !== "graphic-hypergraph-exact") {
      return { labels: [], candidates: [] };
    }
    const data = getHypergraphMatrixFromState();
    const labels = data.colLabels.slice();
    const candidates = [];
    const seen = new Set();

    function addCandidate(kind, selectedLabels, meta) {
      const indices = hypergraphLabelsToIndices(selectedLabels, labels);
      if (indices.length === 0) {
        return;
      }
      const key = `${kind}:${indices.join(",")}`;
      if (seen.has(key)) {
        return;
      }
      seen.add(key);
      candidates.push(makeHypergraphTransversalEntry(
        indices,
        isHypergraphSelectionClassicallyExact(data, selectedLabels),
        candidates.length,
        kind,
        null,
        meta
      ));
    }

    const best = result.fuzzy && result.fuzzy.optimization && result.fuzzy.optimization.best
      ? result.fuzzy.optimization.best
      : null;
    if (best && Array.isArray(best.selectedLabels)) {
      addCandidate("fuzzy-best", best.selectedLabels, {
        quality: best.quality && best.quality.quality,
        coupling: best.quality && best.quality.coupling,
        lambda: best.lambda
      });
    }

    const activeAlpha = result.fuzzy && result.fuzzy.activeAlphaCut ? result.fuzzy.activeAlphaCut : null;
    if (activeAlpha && activeAlpha.found && Array.isArray(activeAlpha.solutionLabels)) {
      addCandidate("fuzzy-alpha", activeAlpha.solutionLabels, {
        alpha: activeAlpha.alpha,
        quality: activeAlpha.quality && activeAlpha.quality.quality,
        coupling: activeAlpha.quality && activeAlpha.quality.coupling
      });
    }

    const bestAlpha = result.fuzzy && result.fuzzy.alphaSweep && result.fuzzy.alphaSweep.bestAlpha !== null
      ? result.fuzzy.alphaSweep.bestAlpha
      : null;
    const bestAlphaRow = bestAlpha !== null && result.fuzzy && Array.isArray(result.fuzzy.alphaCuts)
      ? result.fuzzy.alphaCuts.find((row) => Math.abs(Number(row.alpha) - Number(bestAlpha)) < 0.000001)
      : null;
    if (bestAlphaRow && bestAlphaRow.found && Array.isArray(bestAlphaRow.solutionLabels)) {
      addCandidate("fuzzy-alpha", bestAlphaRow.solutionLabels, {
        alpha: bestAlphaRow.alpha,
        quality: bestAlphaRow.quality && bestAlphaRow.quality.quality,
        coupling: bestAlphaRow.quality && bestAlphaRow.quality.coupling
      });
    }

    return { labels, candidates };
  }

  function showFuzzyHypergraphSolution() {
    if (!lastFuzzyMaxPlusResult || lastFuzzyMaxPlusResult.sourceMode !== "graphic-hypergraph-exact") {
      if (getFuzzySourceMode() !== "hypergraph") {
        setFuzzyStatus(t("app.fuzzy.visualizationManualOnly"), true);
        return;
      }
      runFuzzyMaxPlusResearchModel();
    }
    if (!lastFuzzyMaxPlusResult || lastFuzzyMaxPlusResult.sourceMode !== "graphic-hypergraph-exact") {
      return;
    }

    const view = buildFuzzyHypergraphVisualizationCandidates(lastFuzzyMaxPlusResult);
    if (!view.candidates.length) {
      setFuzzyStatus(t("app.fuzzy.noSolution"), true);
      return;
    }

    hypergraphTransversalView = {
      mode: "fuzzy-exact",
      labels: view.labels.slice(),
      candidates: view.candidates,
      selectedIndex: 0
    };
    applyHypergraphTransversalSelection(0, false);
    setActiveWorkspaceTab("hypergraph");
    syncHypergraphTransversalPicker();
    renderHypergraphEditor();
    const first = view.candidates[0];
    const firstLabel = formatHypergraphTransversalEntry(first, view.labels);
    setHypergraphEditorStatus(t("app.fuzzy.solutionShown", { result: firstLabel }), false);
    setFuzzyStatus(t("app.fuzzy.solutionShownOnHypergraph", { result: firstLabel }), false);
  }

  function runFuzzyMaxPlusResearchModel() {
	    try {
	      const result = buildFuzzyMaxPlusResearchModel();
	      lastFuzzyMaxPlusResult = result;
	      const optimizerLabel = result.fuzzy && result.fuzzy.optimization && result.fuzzy.optimization.found
	        ? `, E*=${formatNumber(result.fuzzy.optimization.best.quality.quality, 3)}`
	        : t("app.fuzzy.noFeasible");
	      const sweepLabel = result.fuzzy && result.fuzzy.alphaSweep
	        ? `, α-sweep=${formatInteger(Number(result.fuzzy.alphaSweep.exactLevels || 0))}/${formatInteger(Number(result.fuzzy.alphaSweep.levels || 0))}`
	        : "";
	      const buildLabel = result.sourceMode === "graphic-hypergraph-exact"
	        ? t("app.fuzzy.buildExactLabel")
	        : t("app.fuzzy.buildMaxPlusLabel");
      setFuzzyStatus(
	        t("app.fuzzy.buildSummary", {
            label: buildLabel,
            rules: formatInteger(result.rules.length),
            alpha: formatNumber(result.options.alpha, 2),
            optimizer: optimizerLabel,
            sweep: sweepLabel,
            experiment: result.experiment.id
          }),
	        false
      );
      setFuzzyPipelineOutput(formatFuzzyPipelineOutput(result));
      setFuzzyMembershipOutput(formatFuzzyMembershipOutput(result));
      setFuzzyRelationsOutput(formatFuzzyRelationsOutput(result));
      setFuzzyMaxPlusOutput(formatStandaloneMaxPlusOutput(result));
      setFuzzyRulesOutput(formatTakagiSugenoRulesOutput(result));
    } catch (error) {
      lastFuzzyMaxPlusResult = null;
      const message = error instanceof Error ? error.message : t("app.fuzzy.buildFailed");
      setFuzzyStatus(message, true);
      setFuzzyPipelineOutput("");
      setFuzzyMembershipOutput("");
      setFuzzyRelationsOutput("");
      setFuzzyMaxPlusOutput("");
      setFuzzyRulesOutput("");
    }
  }

  function exportFuzzyJson() {
    if (!lastFuzzyMaxPlusResult) {
      runFuzzyMaxPlusResearchModel();
    }
    if (!lastFuzzyMaxPlusResult) {
      return;
	    }
	    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
	    const experimentId = sanitizeExportName(lastFuzzyMaxPlusResult.experiment && lastFuzzyMaxPlusResult.experiment.id || "experiment");
	    downloadTextFile(`pooh-${experimentId}-${stamp}.json`, JSON.stringify(lastFuzzyMaxPlusResult, null, 2), "application/json;charset=utf-8");
	  }

  function exportFuzzyCsv() {
    if (!lastFuzzyMaxPlusResult) {
      runFuzzyMaxPlusResearchModel();
    }
    if (!lastFuzzyMaxPlusResult) {
      return;
    }
	    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
	    const experimentId = sanitizeExportName(lastFuzzyMaxPlusResult.experiment && lastFuzzyMaxPlusResult.experiment.id || "experiment");
	    downloadTextFile(`pooh-${experimentId}-rules-${stamp}.csv`, buildFuzzyRulesCsv(lastFuzzyMaxPlusResult), "text/csv;charset=utf-8");
	  }

  function exportFuzzyAlphaCsv() {
    if (!lastFuzzyMaxPlusResult) {
      runFuzzyMaxPlusResearchModel();
    }
    if (!lastFuzzyMaxPlusResult) {
      return;
    }
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const experimentId = sanitizeExportName(lastFuzzyMaxPlusResult.experiment && lastFuzzyMaxPlusResult.experiment.id || "experiment");
    downloadTextFile(`pooh-${experimentId}-alpha-sweep-${stamp}.csv`, buildFuzzyAlphaSweepCsv(lastFuzzyMaxPlusResult), "text/csv;charset=utf-8");
  }

  function exportFuzzyMembershipCsv() {
    if (!lastFuzzyMaxPlusResult) {
      runFuzzyMaxPlusResearchModel();
    }
    if (!lastFuzzyMaxPlusResult) {
      return;
    }
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const experimentId = sanitizeExportName(lastFuzzyMaxPlusResult.experiment && lastFuzzyMaxPlusResult.experiment.id || "experiment");
    downloadTextFile(`pooh-${experimentId}-membership-mu-${stamp}.csv`, buildFuzzyMembershipCsv(lastFuzzyMaxPlusResult), "text/csv;charset=utf-8");
  }

  function exportFuzzyLatex() {
    if (!lastFuzzyMaxPlusResult) {
      runFuzzyMaxPlusResearchModel();
    }
    if (!lastFuzzyMaxPlusResult) {
      return;
    }
	    const latex = buildFuzzyLatex(lastFuzzyMaxPlusResult);
	    setFuzzyRulesOutput(formatTakagiSugenoRulesOutput(lastFuzzyMaxPlusResult) + "\n\nLaTeX:\n" + latex);
	    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
	    const experimentId = sanitizeExportName(lastFuzzyMaxPlusResult.experiment && lastFuzzyMaxPlusResult.experiment.id || "experiment");
	    downloadTextFile(`pooh-${experimentId}-tables-${stamp}.tex`, latex, "text/plain;charset=utf-8");
	  }

  function exportFuzzyReport() {
    if (!lastFuzzyMaxPlusResult) {
      runFuzzyMaxPlusResearchModel();
    }
    if (!lastFuzzyMaxPlusResult) {
      return;
    }
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const experimentId = sanitizeExportName(lastFuzzyMaxPlusResult.experiment && lastFuzzyMaxPlusResult.experiment.id || "experiment");
    downloadTextFile(`pooh-${experimentId}-report-${stamp}.txt`, buildFuzzyTextReport(lastFuzzyMaxPlusResult), "text/plain;charset=utf-8");
  }

  function setFuzzyRunsStatus(message, isError) {
    if (!fuzzyRunsStatus) {
      return;
    }
    fuzzyRunsStatus.textContent = message || "";
    fuzzyRunsStatus.style.color = isError ? "var(--danger)" : "";
  }

  function formatResearchRunDate(value) {
    const date = new Date(String(value || ""));
    if (Number.isNaN(date.getTime())) {
      return "-";
    }
    return date.toLocaleString(docsLang() === "pl" ? "pl-PL" : "en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function formatResearchRunTitle(run) {
    const experimentId = String(run && run.experimentId ? run.experimentId : "");
    const label = String(run && run.label ? run.label : "");
    return label || experimentId || String(run && run.id ? run.id : "experiment");
  }

  function formatResearchRunsComparison(runs) {
    const items = Array.isArray(runs) ? runs : [];
    if (items.length === 0) {
      return t("status.fuzzyRunsNone");
    }
    const lines = [];
    lines.push(t("app.fuzzy.registryTitle"));
    lines.push("");
    lines.push(t("app.fuzzy.registryHeader"));
    lines.push("---|---:|---:|---:|---:|---:|---:|---:|---:|---");
    items.forEach((run) => {
      const id = formatResearchRunTitle(run);
      lines.push([
        id,
        formatOptionalNumber(run.alpha, 2),
        formatOptionalNumber(run.bestE, 3),
        formatOptionalNumber(run.bestSize, 0),
        formatOptionalNumber(run.bestCoupling, 3),
        `${formatInteger(Number(run.bestMaxPlusMapped || 0))}/${formatOptionalNumber(run.bestSize, 0)}`,
        formatOptionalNumber(run.bestTransversalLambda !== null && run.bestTransversalLambda !== undefined ? run.bestTransversalLambda : run.bestLambda, 3),
        `${formatInteger(Number(run.alphaExactLevels || 0))}/${formatInteger(Number(run.alphaLevels || 0))}`,
        formatInteger(Number(run.ruleCount || 0)),
        formatResearchRunDate(run.savedAt)
      ].join(" | "));
    });
    return lines.join("\n");
  }

  function renderResearchRuns() {
    const runs = Array.isArray(state.researchRuns.items) ? state.researchRuns.items : [];
    if (fuzzyRunsCompare) {
      fuzzyRunsCompare.textContent = formatResearchRunsComparison(runs);
    }
    if (!fuzzyRunsList) {
      return;
    }
    fuzzyRunsList.innerHTML = "";
    if (runs.length === 0) {
      const empty = document.createElement("div");
      empty.className = "hint";
      empty.textContent = t("status.fuzzyRunsNone");
      fuzzyRunsList.appendChild(empty);
      return;
    }
    runs.slice(0, 8).forEach((run) => {
      const item = document.createElement("div");
      item.className = "research-run-item";

      const title = document.createElement("p");
      title.className = "research-run-title";
      title.textContent = formatResearchRunTitle(run);
      item.appendChild(title);

      const meta = document.createElement("p");
      meta.className = "research-run-meta";
      const labels = Array.isArray(run.bestLabels) && run.bestLabels.length > 0 ? run.bestLabels.join(",") : "-";
      const runLambda = run.bestTransversalLambda !== null && run.bestTransversalLambda !== undefined ? run.bestTransversalLambda : run.bestLambda;
      meta.textContent = `E*=${formatOptionalNumber(run.bestE, 3)}, |T*|=${formatOptionalNumber(run.bestSize, 0)}, α=${formatOptionalNumber(run.alpha, 2)}, M+=${formatInteger(Number(run.bestMaxPlusMapped || 0))}/${formatOptionalNumber(run.bestSize, 0)}, λT=${formatOptionalNumber(runLambda, 3)}, T*=[${labels}], ${formatResearchRunDate(run.savedAt)}`;
      item.appendChild(meta);

      const actions = document.createElement("div");
      actions.className = "research-run-actions";
      const loadBtn = document.createElement("button");
      loadBtn.type = "button";
      loadBtn.textContent = t("app.fuzzy.loadReport");
      loadBtn.addEventListener("click", () => loadResearchRun(run.id));
      actions.appendChild(loadBtn);

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.textContent = t("app.fuzzy.delete");
      deleteBtn.addEventListener("click", () => deleteResearchRun(run.id));
      actions.appendChild(deleteBtn);

      item.appendChild(actions);
      fuzzyRunsList.appendChild(item);
    });
  }

  async function refreshResearchRuns() {
    try {
      setFuzzyRunsStatus(t("app.fuzzy.registryLoading"), false);
      const payload = await callLibraryApi("research_runs");
      state.researchRuns.items = Array.isArray(payload.runs) ? payload.runs : [];
      renderResearchRuns();
      setFuzzyRunsStatus(
        state.researchRuns.items.length > 0
          ? t("app.fuzzy.savedCount", { count: formatInteger(state.researchRuns.items.length) })
          : t("status.fuzzyRunsNone"),
        false
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : t("app.fuzzy.registryRefreshFailed");
      setFuzzyRunsStatus(message, true);
    }
  }

  async function saveCurrentResearchRun() {
    try {
      if (!lastFuzzyMaxPlusResult) {
        runFuzzyMaxPlusResearchModel();
      }
      if (!lastFuzzyMaxPlusResult) {
        return;
      }
      setFuzzyRunsStatus(t("app.fuzzy.saving"), false);
      const form = new FormData();
      form.append("run_json", JSON.stringify(lastFuzzyMaxPlusResult));
      const payload = await callLibraryApi("save_research_run", {
        method: "POST",
        body: form
      });
      state.researchRuns.items = Array.isArray(payload.runs) ? payload.runs : [];
      renderResearchRuns();
      const saved = payload.summary && payload.summary.experimentId ? payload.summary.experimentId : "experiment";
      setFuzzyRunsStatus(t("app.fuzzy.saved", { id: saved }), false);
    } catch (error) {
      const message = error instanceof Error ? error.message : t("app.fuzzy.saveFailed");
      setFuzzyRunsStatus(message, true);
    }
  }

  async function loadResearchRun(runId) {
    try {
      const safeId = String(runId || "");
      if (!safeId) {
        return;
      }
      setFuzzyRunsStatus(t("app.fuzzy.loading"), false);
      const payload = await callLibraryApi("get_research_run", {
        query: { id: safeId }
      });
      if (!payload.run || typeof payload.run !== "object") {
        throw new Error(t("app.fuzzy.formatInvalid"));
      }
      lastFuzzyMaxPlusResult = payload.run;
      setFuzzyPipelineOutput(formatFuzzyPipelineOutput(lastFuzzyMaxPlusResult));
      setFuzzyMembershipOutput(formatFuzzyMembershipOutput(lastFuzzyMaxPlusResult));
      setFuzzyRelationsOutput(formatFuzzyRelationsOutput(lastFuzzyMaxPlusResult));
      setFuzzyMaxPlusOutput(formatStandaloneMaxPlusOutput(lastFuzzyMaxPlusResult));
      setFuzzyRulesOutput(formatTakagiSugenoRulesOutput(lastFuzzyMaxPlusResult));
      const title = payload.summary && payload.summary.experimentId ? payload.summary.experimentId : safeId;
      setFuzzyStatus(t("app.fuzzy.loaded", { id: title }), false);
      setFuzzyRunsStatus(t("app.fuzzy.active", { id: title }), false);
    } catch (error) {
      const message = error instanceof Error ? error.message : t("app.fuzzy.loadFailed");
      setFuzzyRunsStatus(message, true);
    }
  }

  async function deleteResearchRun(runId) {
    try {
      const safeId = String(runId || "");
      if (!safeId) {
        return;
      }
      if (!window.confirm(t("app.fuzzy.deleteConfirm"))) {
        return;
      }
      setFuzzyRunsStatus(t("app.fuzzy.deleting"), false);
      const payload = await callLibraryApi("delete_research_run", {
        method: "POST",
        body: { id: safeId }
      });
      state.researchRuns.items = Array.isArray(payload.runs) ? payload.runs : [];
      renderResearchRuns();
      setFuzzyRunsStatus(t("app.fuzzy.deleted"), false);
    } catch (error) {
      const message = error instanceof Error ? error.message : t("app.fuzzy.deleteFailed");
      setFuzzyRunsStatus(message, true);
    }
  }

  function normalizeDecompositionViewMode(value) {
    return requireDecompositionViewCoreFunction("normalizeDecompositionViewMode")(value);
  }

  function normalizeDecompositionLayoutMode(value) {
    return String(value || "").toLowerCase() === "auto" ? "auto" : "source";
  }

  // ── Decomposition pan/zoom state ──
  var decompView = { zoom: 1, panX: 0, panY: 0 };
  var decompPanInfo = null;
  var decompDragInfo = null;
  var lastDecompGraph = null;
  var lastDecompGraphNodes = null;

  function applyDecompViewTransform() {
    if (!decompViewport) return;
    decompViewport.setAttribute("transform",
      "translate(" + decompView.panX + " " + decompView.panY + ") scale(" + decompView.zoom + ")");
  }

  function setDecompView(zoom, panX, panY) {
    decompView.zoom = Math.max(0.15, Math.min(8, zoom));
    decompView.panX = panX;
    decompView.panY = panY;
    applyDecompViewTransform();
    updateDecompZoomUi();
  }

  function updateDecompZoomUi() {
    var el = document.getElementById("decomp-zoom-level");
    if (el) {
      el.textContent = Math.round(decompView.zoom * 100) + "%";
    }
  }

  function decompPanBy(dx, dy) {
    setDecompView(decompView.zoom, decompView.panX + dx, decompView.panY + dy);
  }

  function decompCenter() {
    setDecompView(1, 0, 0);
  }

  function decompZoomAt(factor, cx, cy) {
    var cur = decompView.zoom;
    var next = Math.max(0.15, Math.min(8, cur * factor));
    if (Math.abs(next - cur) < 0.0001) return;
    var wx = (cx - decompView.panX) / cur;
    var wy = (cy - decompView.panY) / cur;
    setDecompView(next, cx - wx * next, cy - wy * next);
  }

  function resetDecompView() {
    setDecompView(1, 0, 0);
  }

  function toDecompSvgPoint(event) {
    if (!decompositionCanvas) return { x: 0, y: 0 };
    var pt = decompositionCanvas.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    var ctm = decompositionCanvas.getScreenCTM();
    if (ctm) {
      var inv = ctm.inverse();
      var transformed = pt.matrixTransform(inv);
      return { x: transformed.x, y: transformed.y };
    }
    return { x: pt.x, y: pt.y };
  }

  function toDecompCanvasPoint(event) {
    var svgPt = toDecompSvgPoint(event);
    return {
      x: (svgPt.x - decompView.panX) / decompView.zoom,
      y: (svgPt.y - decompView.panY) / decompView.zoom
    };
  }

  function clearDecompositionCanvas() {
    requireDecompositionRendererFunction("clearDecompositionCanvas")(getDecompositionRendererOptions());
    resetDecompView();
  }

  function getDecompositionRendererCore() {
    const core = window.PoohDecompositionRendererCore;
    return core && typeof core === "object" ? core : null;
  }

  function requireDecompositionRendererFunction(name) {
    const core = getDecompositionRendererCore();
    if (core && typeof core[name] === "function") {
      return core[name].bind(core);
    }
    throw new Error(t("app.core.missing", { module: "decomposition renderer", name, path: "src/core/decomposition-renderer.js" }));
  }

  function getDecompositionRendererOptions() {
    return {
      document,
      ns: NS,
      canvas: decompositionCanvas,
      viewport: decompViewport,
      width: DECOMP_CANVAS_W,
      height: DECOMP_CANVAS_H,
      placeRadius: PLACE_RADIUS,
      transitionHalfW: TRANSITION_HALF_W,
      transitionHalfH: TRANSITION_HALF_H,
      legendTitle: t("app.decomposition.hyperedges"),
      formatInteger
    };
  }

  function getDecompositionViewCore() {
    const core = window.PoohDecompositionViewCore;
    return core && typeof core === "object" ? core : null;
  }

  function requireDecompositionViewCoreFunction(name) {
    const core = getDecompositionViewCore();
    if (core && typeof core[name] === "function") {
      return core[name].bind(core);
    }
    throw new Error(t("app.core.missing", { module: "decomposition view", name, path: "src/core/decomposition-view.js" }));
  }

  function getDecompositionViewOptions() {
    return {
      width: DECOMP_CANVAS_W,
      height: DECOMP_CANVAS_H,
      yesText: t("class.yes"),
      noText: t("class.no"),
      formatInteger,
      formatOptionalNumber,
      labels: {
        hypergraphFallback: t("app.decomposition.hypergraphFallback"),
        exactTransversal: t("app.decomposition.exactTransversal"),
        selectionHypergraph: t("app.decomposition.selectionHypergraph"),
        pinvariants: t("app.decomposition.pinvariants"),
        sourceLayout: t("app.decomposition.sourceLayout"),
        autoLayout: "auto",
        sfcSource: t("app.decomposition.sfcSource"),
        sfcMark: "SFC",
        smcMark: "SMC",
        sfcStatus: t("app.decomposition.sfcStatus"),
        maxPlusStatus: t("app.decomposition.maxPlusStatus"),
        automataStatus: t("app.decomposition.automataSubnet")
      }
    };
  }

  function hypergraphColor(index) {
    return requireDecompositionViewCoreFunction("hypergraphColor")(index);
  }

  function buildHypergraphEntryFromMatrix(matrix, rowLabels, colLabels, options) {
    return requireDecompositionViewCoreFunction("buildHypergraphEntryFromMatrix")(matrix, rowLabels, colLabels, options);
  }

  function getSelectionHypergraphEntryForView() {
    const result = lastSelectionHypergraphResult || pendingSelectionHypergraphResult;
    if (!result || !Array.isArray(result.reducedDualMatrix)) {
      return null;
    }
    return buildHypergraphEntryFromMatrix(
      result.reducedDualMatrix,
      result.reducedRowLabels,
      result.reducedColLabels,
      {
        label: "Hsel",
        title: t("app.decomposition.selectionHypergraph"),
        sourceMode: "selection",
        xtrec: result.xtrec || null,
        xtrecPending: Boolean(result.xtrecPending),
        transversal: result.transversal || null
      }
    );
  }

  function getManualHypergraphEntryForView() {
    if (!lastManualHypergraphResult) {
      return null;
    }
    return buildHypergraphEntryFromMatrix(
      lastManualHypergraphResult.matrix,
      lastManualHypergraphResult.rowLabels,
      lastManualHypergraphResult.colLabels,
      {
        label: "Hmanual",
        title: t("app.decomposition.manualHypergraph"),
        sourceMode: "manual",
        xtrec: lastManualHypergraphResult.xtrec || null,
        xtrecPending: Boolean(lastManualHypergraphResult.xtrecPending),
        transversal: lastManualHypergraphResult.transversal || null
      }
    );
  }

  function computeHypergraphVertexPositions(vertices) {
    return requireDecompositionViewCoreFunction("computeHypergraphVertexPositions")(vertices, getDecompositionViewOptions());
  }

  function convexHull(points) {
    return requireDecompositionViewCoreFunction("convexHull")(points);
  }

  function expandPointsFromCentroid(points, padding) {
    return requireDecompositionViewCoreFunction("expandPointsFromCentroid")(points, padding);
  }

  function expandPointsToDiskHull(points, radius, samples) {
    return requireDecompositionViewCoreFunction("expandPointsToDiskHull")(points, radius, samples);
  }

  function roundedPolygonPath(points) {
    return requireDecompositionViewCoreFunction("roundedPolygonPath")(points);
  }

  function capsulePath(a, b, padding) {
    return requireDecompositionViewCoreFunction("capsulePath")(a, b, padding);
  }

  function hyperedgeCentroid(points) {
    return requireDecompositionViewCoreFunction("hyperedgeCentroid")(points);
  }

  function buildAutomataSubnetsForView(filterMode) {
    return requireDecompositionViewCoreFunction("buildAutomataSubnetsForView")(
      filterMode,
      lastPinvariantResult,
      { nodes: state.nodes, arcs: state.arcs },
      lastSelectionHypergraphResult
    );
  }

  function buildSfcSubnetsForView() {
    const model = lastSfcResult && lastSfcResult.model ? lastSfcResult.model : null;
    return requireDecompositionViewCoreFunction("buildSfcSubnetsForView")(model);
  }

  function getAutomataSubnetsForMaxPlusView() {
    return requireDecompositionViewCoreFunction("getAutomataSubnetsForMaxPlusView")(
      lastPinvariantResult,
      { nodes: state.nodes, arcs: state.arcs },
      lastSelectionHypergraphResult,
      {
        exactTransversal: t("app.decomposition.exactTransversal"),
        selectionHypergraph: t("app.decomposition.selectionHypergraph"),
        pinvariants: t("app.decomposition.pinvariants")
      }
    );
  }

  function buildMaxPlusSubnetsForView() {
    const model = lastSfcResult && lastSfcResult.model ? lastSfcResult.model : null;
    return requireDecompositionViewCoreFunction("buildMaxPlusSubnetsForView")(
      {
        sfcModel: model,
        pinvariantResult: lastPinvariantResult,
        petriState: { nodes: state.nodes, arcs: state.arcs },
        selectionHypergraphResult: lastSelectionHypergraphResult,
        maxPlusOptions: getSfcMaxPlusOptions(),
        labels: {
          exactTransversal: t("app.decomposition.exactTransversal"),
          selectionHypergraph: t("app.decomposition.selectionHypergraph"),
          pinvariants: t("app.decomposition.pinvariants"),
          sfcSource: t("app.decomposition.sfcSource")
        }
      },
      getDecompositionViewOptions()
    );
  }

  function getDecompositionEntries(viewMode) {
    const mode = normalizeDecompositionViewMode(viewMode);
    if (mode === "hypergraph-selection") {
      const entry = getSelectionHypergraphEntryForView();
      return entry ? [entry] : [];
    }
    if (mode === "hypergraph-manual") {
      const entry = getManualHypergraphEntryForView();
      return entry ? [entry] : [];
    }
    if (mode === "sfc") {
      return buildSfcSubnetsForView();
    }
    if (mode === "maxplus") {
      return buildMaxPlusSubnetsForView();
    }
    return buildAutomataSubnetsForView(mode);
  }

  function drawDecompositionGraph(graph) {
    const result = requireDecompositionRendererFunction("drawDecompositionGraph")(
      graph,
      {
        ...getDecompositionRendererOptions(),
        isDragging: Boolean(decompDragInfo && decompViewport),
        clearCanvas: clearDecompositionCanvas
      }
    );
    lastDecompGraph = graph;
    lastDecompGraphNodes = result && Array.isArray(result.nodes) ? result.nodes : null;
  }

  function getSubnetOptionLabel(mode, entry) {
    return requireDecompositionViewCoreFunction("getSubnetOptionLabel")(mode, entry, getDecompositionViewOptions());
  }

  function syncDecompositionSubnetOptions() {
    const mode = normalizeDecompositionViewMode(decompositionViewModeSelect ? decompositionViewModeSelect.value : "automata");
    const entries = getDecompositionEntries(mode);

    if (decompositionLayoutModeSelect) {
      const isAutomata = mode.startsWith("automata");
      decompositionLayoutModeSelect.disabled = !isAutomata;
      if (!isAutomata) decompositionLayoutModeSelect.value = "auto";
    }

    if (!decompositionSubnetSelect) {
      return { mode, entries, selectedLabel: "" };
    }

    const previous = decompositionSelectionLabel || decompositionSubnetSelect.value || "";
    decompositionSubnetSelect.innerHTML = "";

    if (entries.length === 0) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = t("status.decompositionNone");
      decompositionSubnetSelect.appendChild(option);
      decompositionSubnetSelect.value = "";
      decompositionSubnetSelect.disabled = true;
      decompositionSelectionLabel = "";
      return { mode, entries, selectedLabel: "" };
    }

    entries.forEach((entry) => {
      const option = document.createElement("option");
      option.value = entry.label;
      option.textContent = getSubnetOptionLabel(mode, entry);
      decompositionSubnetSelect.appendChild(option);
    });

    const selectedLabel = entries.some((entry) => entry.label === previous)
      ? previous
      : entries[0].label;
    decompositionSubnetSelect.value = selectedLabel;
    decompositionSubnetSelect.disabled = false;
    decompositionSelectionLabel = selectedLabel;
    return { mode, entries, selectedLabel };
  }

  function refreshDecompositionView() {
    if (!decompositionCanvas) {
      return;
    }

    const synced = syncDecompositionSubnetOptions();
    const mode = synced.mode;
    const entries = synced.entries;
    const selectedLabel = synced.selectedLabel;
    if (entries.length === 0 || !selectedLabel) {
      clearDecompositionCanvas();
      setDecompositionStatus(t("status.decompositionNone"), false);
      setDecompositionDetails("");
      return;
    }

    const selectedEntry = entries.find((entry) => entry.label === selectedLabel) || entries[0];
    const layoutMode = normalizeDecompositionLayoutMode(
      decompositionLayoutModeSelect ? decompositionLayoutModeSelect.value : "source"
    );

    const viewResult = requireDecompositionViewCoreFunction("buildDecompositionGraphForMode")(
      mode,
      selectedEntry,
      layoutMode,
      getDecompositionViewOptions()
    );
    const graph = viewResult && viewResult.graph ? viewResult.graph : { nodes: [], edges: [], details: [] };
    setDecompositionStatus(viewResult && viewResult.status ? viewResult.status : "", false);

    drawDecompositionGraph(graph);
    setDecompositionDetails(Array.isArray(graph.details) ? graph.details.join("\n") : "");
  }

  function ensureSfcWorker() {
    if (sfcWorker) {
      return sfcWorker;
    }
    if (!("Worker" in window)) {
      return null;
    }

    sfcWorker = new Worker(`public/sfc-worker.js?v=${Date.now()}`);
    sfcWorker.onmessage = (event) => {
      const payload = event.data || {};
      const jobId = Number(payload.jobId || 0);
      if (!jobId || jobId !== activeSfcJobId) {
        return;
      }

      if (payload.type === "progress") {
        const message = payload.message
          ? String(payload.message)
          : t("app.sfc.processing");
        setSfcStatus(message, false);
        if (activeComputation && activeComputation.type === "sfc") {
          updateComputationDialog(message);
        }
        return;
      }

      if (payload.type === "error") {
        setSfcRunning(false);
        activeSfcJobId = 0;
        const message = payload.message
          ? String(payload.message)
          : t("app.sfc.computationFailed");
        setSfcStatus(message, true);
        refreshDecompositionView();
        if (activeComputation && activeComputation.type === "sfc") {
          hideComputationDialog();
        }
        return;
      }

      if (payload.type === "result") {
        const response = payload.payload || {};
        const action = String(response.action || "").toLowerCase();
        if (action === "build") {
          lastSfcResult = {
            model: response.model || null,
            summary: response.summary || {},
            validation: null,
            generatedAt: Date.now()
          };
          setSfcOutput(formatSfcModelOutput(lastSfcResult));
          setSfcValidationOutput("");
          setSfcMaxPlusOutput(formatSfcMaxPlusResultOutput(lastSfcResult));
          setSfcStatus(t("app.sfc.generated"), false);
        } else if (action === "validate") {
          if (!lastSfcResult) {
            lastSfcResult = { model: null, summary: {}, validation: null, generatedAt: Date.now() };
          }
          lastSfcResult.validation = response.validation || null;
          setSfcValidationOutput(formatSfcValidationOutput(lastSfcResult));
          const mismatches = Number(response.validation && response.validation.mismatchCount || 0);
          setSfcStatus(
            mismatches > 0
              ? t("app.sfc.validationMismatch", { count: formatInteger(mismatches) })
              : t("app.sfc.validationOk"),
            mismatches > 0
          );
        } else if (action === "maxplus") {
          if (!lastSfcResult) {
            lastSfcResult = { model: null, summary: {}, validation: null, generatedAt: Date.now() };
          }
          const nextModel = response.model || (lastSfcResult.model ? { ...lastSfcResult.model } : null);
          if (nextModel) {
            lastSfcResult.model = nextModel;
          }
          setSfcMaxPlusOutput(formatSfcMaxPlusResultOutput(lastSfcResult));
          setSfcStatus(t("app.sfc.maxPlusComplete"), false);
        }
        refreshDecompositionView();
        setSfcRunning(false);
        activeSfcJobId = 0;
        if (activeComputation && activeComputation.type === "sfc") {
          hideComputationDialog();
        }
      }
    };

    sfcWorker.onerror = (event) => {
      setSfcRunning(false);
      activeSfcJobId = 0;
      const message = event && event.message
        ? t("app.worker.sfcFailed", { message: event.message })
        : t("app.worker.sfcFailedGeneric");
      setSfcStatus(message, true);
      refreshDecompositionView();
      if (activeComputation && activeComputation.type === "sfc") {
        hideComputationDialog();
      }
    };

    return sfcWorker;
  }

  async function runSfcBuildComputation() {
    if (sfcIsRunning || isComputationDialogOpen()) {
      return;
    }
    const worker = ensureSfcWorker();
    if (!worker) {
      setSfcStatus(t("app.sfc.workerUnsupported"), true);
      return;
    }

    const payload = buildSfcJobPayload("build");
    sfcJobSequence += 1;
    activeSfcJobId = sfcJobSequence;
    lastSfcResult = null;
    setSfcRunning(true);
    setSfcStatus(t("app.sfc.buildStarted"), false);
    setSfcOutput(t("app.sfc.buildInProgress"));
    setSfcValidationOutput("");
    setSfcMaxPlusOutput(t("app.sfc.maxPlusAfterSynthesis"));
    showComputationDialog(
      "sfc",
      "Synteza modelu SFC",
      t("app.sfc.buildProgress"),
      true
    );
    postLocalizedWorkerMessage(worker, {
      type: "compute",
      jobId: activeSfcJobId,
      payload
    });
  }

  async function runSfcValidationComputation() {
    if (sfcIsRunning || isComputationDialogOpen()) {
      return;
    }
    if (!lastSfcResult || !lastSfcResult.model) {
      setSfcStatus(t("app.sfc.modelRequired"), true);
      return;
    }
    const worker = ensureSfcWorker();
    if (!worker) {
      setSfcStatus(t("app.sfc.workerUnsupported"), true);
      return;
    }

    const payload = buildSfcJobPayload("validate");
    sfcJobSequence += 1;
    activeSfcJobId = sfcJobSequence;
    setSfcRunning(true);
    setSfcStatus(t("app.sfc.validationStarted"), false);
    setSfcValidationOutput("Walidacja PN ↔ SFC w toku...");
    showComputationDialog(
      "sfc",
      "Walidacja modelu SFC",
      t("app.sfc.validationProgress"),
      true
    );
    postLocalizedWorkerMessage(worker, {
      type: "compute",
      jobId: activeSfcJobId,
      payload
    });
  }

  async function runSfcMaxPlusComputation() {
    if (sfcIsRunning || isComputationDialogOpen()) {
      return;
    }
    if (!lastSfcResult || !lastSfcResult.model) {
      setSfcStatus(t("app.sfc.noMaxPlusModel"), true);
      return;
    }
    const worker = ensureSfcWorker();
    if (!worker) {
      setSfcStatus(t("app.sfc.workerUnsupported"), true);
      return;
    }

    const payload = buildSfcJobPayload("maxplus");
    sfcJobSequence += 1;
    activeSfcJobId = sfcJobSequence;
    setSfcRunning(true);
    setSfcStatus(t("app.sfc.maxPlusStarted"), false);
    setSfcMaxPlusOutput("Analiza (max,+) w toku...");
    showComputationDialog(
      "sfc",
      "Analiza czasowa (max,+)",
      t("app.sfc.maxPlusProgress"),
      true
    );
    postLocalizedWorkerMessage(worker, {
      type: "compute",
      jobId: activeSfcJobId,
      payload
    });
  }

  function exportSfcPlcopenXml() {
    if (!lastSfcResult || !lastSfcResult.model || !lastSfcResult.model.plcopenXml) {
      setSfcStatus(t("app.sfc.noPlcopen"), true);
      return;
    }
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    downloadTextFile(`pooh-sfc-${stamp}.xml`, lastSfcResult.model.plcopenXml, "application/xml;charset=utf-8");
    setSfcStatus(t("app.sfc.plcopenExported"), false);
  }

  function exportSfcCoordinatorSt() {
    if (!lastSfcResult || !lastSfcResult.model || !lastSfcResult.model.coordinatorSt) {
      setSfcStatus(t("app.sfc.noCoordinatorSt"), true);
      return;
    }
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    downloadTextFile(`pooh-sfc-coordinator-${stamp}.st`, lastSfcResult.model.coordinatorSt, "text/plain;charset=utf-8");
    setSfcStatus(t("app.sfc.coordinatorExported"), false);
  }

  function downloadFileBatch(files) {
    const safeFiles = Array.isArray(files) ? files.filter(Boolean) : [];
    safeFiles.forEach((entry, index) => {
      window.setTimeout(() => {
        downloadTextFile(entry.name, entry.content, entry.mimeType);
      }, index * 120);
    });
  }

  function getSfcIdeTarget() {
    return normalizeSfcIdeTarget(sfcIdeTargetSelect ? sfcIdeTargetSelect.value : "codesys");
  }

  function exportSfcIdeMapping() {
    if (!lastSfcResult || !lastSfcResult.model) {
      setSfcStatus(t("app.sfc.noIdeModel"), true);
      return;
    }

    const model = lastSfcResult.model;
    const target = getSfcIdeTarget();
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");

    if (target === "codesys") {
      const pkg = model.codesysPackage || null;
      if (!pkg || !pkg.xml) {
        setSfcStatus(t("app.sfc.noCodesysPackage"), true);
        return;
      }
      const files = [
        {
          name: `pooh-codesys-${stamp}.xml`,
          content: pkg.xml,
          mimeType: "application/xml;charset=utf-8"
        }
      ];
      if (pkg.mainProgramSt) {
        files.push({
          name: `pooh-codesys-main-${stamp}.st`,
          content: pkg.mainProgramSt,
          mimeType: "text/plain;charset=utf-8"
        });
      }
      if (pkg.coordinatorSt) {
        files.push({
          name: `pooh-codesys-coord-${stamp}.st`,
          content: pkg.coordinatorSt,
          mimeType: "text/plain;charset=utf-8"
        });
      }
      if (model.maxPlus) {
        files.push({
          name: `pooh-maxplus-report-${stamp}.txt`,
          content: formatSfcMaxPlusResultOutput(lastSfcResult),
          mimeType: "text/plain;charset=utf-8"
        });
      }
      downloadFileBatch(files);
      setSfcStatus(t("app.sfc.codesysExported"), false);
      return;
    }

    const tia = model.tiaPackage || null;
    if (!tia || !Array.isArray(tia.sclFiles) || tia.sclFiles.length === 0) {
      setSfcStatus(t("app.sfc.noTiaPackage"), true);
      return;
    }

    const files = [];
    if (tia.mappingXml) {
      files.push({
        name: `pooh-tia-mapping-${stamp}.xml`,
        content: tia.mappingXml,
        mimeType: "application/xml;charset=utf-8"
      });
    }
    tia.sclFiles.forEach((entry, index) => {
      const safeName = String(entry && entry.name ? entry.name : `pooh-tia-${index + 1}.scl`);
      files.push({
        name: `${safeName.replace(/\s+/g, "_")}-${stamp}.scl`,
        content: String(entry && entry.content ? entry.content : ""),
        mimeType: "text/plain;charset=utf-8"
      });
    });
    if (model.maxPlus) {
      files.push({
        name: `pooh-maxplus-report-${stamp}.txt`,
        content: formatSfcMaxPlusResultOutput(lastSfcResult),
        mimeType: "text/plain;charset=utf-8"
      });
    }
    downloadFileBatch(files);
    setSfcStatus(t("app.sfc.tiaExported", { count: formatInteger(files.length) }), false);
  }

  function normalizeXtrecAccelerationMode(value) {
    const safe = String(value || "").toLowerCase();
    if (safe === "webgpu" || safe === "webgl") {
      return safe;
    }
    return "cpu";
  }

  function getXtrecAccelerationLabel(value) {
    const mode = normalizeXtrecAccelerationMode(value);
    if (mode === "webgpu") {
      return "WebGPU";
    }
    if (mode === "webgl") {
      return "WebGL";
    }
    return "CPU";
  }

  function normalizeTransversalStrategy(value) {
    const safe = String(value || "").toLowerCase();
    if (safe === "xtr" || safe === "dlx" || safe === "backtracking" || safe === "greedy") {
      return safe;
    }
    return "all";
  }

  function getTransversalStrategy() {
    return normalizeTransversalStrategy(
      transversalStrategySelect ? transversalStrategySelect.value : "all"
    );
  }

  function canUseWebGlAcceleration() {
    try {
      const probe = document.createElement("canvas");
      return Boolean(
        (window.WebGL2RenderingContext && probe.getContext("webgl2"))
        || (window.WebGLRenderingContext && probe.getContext("webgl"))
      );
    } catch (error) {
      return false;
    }
  }

  async function askSelectionHypergraphAccelerationMode() {
    const webGpuReady = await canUseWebGpuAcceleration();
    if (webGpuReady) {
      const useWebGpu = window.confirm(
        t("app.xtrec.webgpuPrompt")
      );
      if (useWebGpu) {
        return "webgpu";
      }
    }

    const webGlReady = canUseWebGlAcceleration();
    if (webGlReady) {
      const useWebGl = window.confirm(
        t("app.xtrec.webglPrompt")
      );
      return useWebGl ? "webgl" : "cpu";
    }
    const proceedCpu = window.confirm(
      t("app.xtrec.cpuPrompt")
    );
    return proceedCpu ? "cpu" : "cancel";
  }

  function runTransversalWorkerForSelection(baseResult, strategy) {
    return new Promise((resolve, reject) => {
      if (!("Worker" in window)) {
        reject(new Error(t("app.transversal.workerUnsupported")));
        return;
      }

      if (activeTransversalWorker) {
        activeTransversalWorker.terminate();
        activeTransversalWorker = null;
      }

      const worker = new Worker(`public/transversal-worker.js?v=${Date.now()}`);
      activeTransversalWorker = worker;
      transversalJobSequence += 1;
      activeTransversalJobId = transversalJobSequence;
      const currentJobId = activeTransversalJobId;

      const cleanup = () => {
        if (activeTransversalWorker === worker) {
          activeTransversalWorker = null;
        }
        if (activeTransversalJobId === currentJobId) {
          activeTransversalJobId = 0;
        }
        worker.terminate();
      };

      worker.onmessage = (event) => {
        const message = event.data || {};
        if (Number(message.jobId || 0) !== currentJobId) {
          return;
        }

        if (message.type === "progress") {
          const phase = String(message.phase || "transversal").toUpperCase();
          const text = message.message
            ? String(message.message)
            : t("app.transversal.running", { phase });
          setSelectionHypergraphStatus(t("app.transversal.status", { message: text }), false);
          if (activeComputation && (activeComputation.type === "xtrec" || activeComputation.type === "transversal")) {
            updateComputationDialog(t("app.transversal.status", { message: text }));
          }
          return;
        }

        if (message.type === "error") {
          cleanup();
          reject(new Error(message.message || t("app.transversal.computationFailed")));
          return;
        }

        if (message.type === "result") {
          const payload = message.payload || {};
          cleanup();
          resolve(payload);
        }
      };

      worker.onerror = (event) => {
        cleanup();
        reject(new Error(event && event.message
          ? t("app.worker.transversalFailed", { message: event.message })
          : t("app.worker.transversalFailedGeneric")));
      };

      postLocalizedWorkerMessage(worker, {
        type: "compute",
        jobId: currentJobId,
        payload: {
          matrix: baseResult.reducedDualMatrix,
          rowLabels: baseResult.reducedRowLabels,
          colLabels: baseResult.reducedColLabels,
          strategy: normalizeTransversalStrategy(strategy),
          xtrec: baseResult.xtrec || null
        }
      });
    });
  }

  function ensureXtrecWorker() {
    if (xtrecWorker) {
      return xtrecWorker;
    }
    if (!("Worker" in window)) {
      return null;
    }
    const workerUrl = `public/xtrec-worker.js?v=${Date.now()}`;
    xtrecWorker = new Worker(workerUrl);
    xtrecWorker.onmessage = (event) => {
      const payload = event.data || {};
      const jobId = Number(payload.jobId || 0);
      if (!jobId || jobId !== activeXtrecJobId) {
        return;
      }

      if (payload.type === "progress") {
        const message = payload.message
          ? String(payload.message)
          : `Test ${payload.stage || 0}/${payload.total || 0}`;
        setSelectionHypergraphStatus(`XTREC: ${message}`, false);
        if (activeComputation && activeComputation.type === "xtrec") {
          updateComputationDialog(`XTREC: ${message}`);
        }
        return;
      }

      if (payload.type === "error") {
        setSelectionHypergraphRunning(false);
        pendingSelectionHypergraphResult = null;
        const message = payload.message
          ? String(payload.message)
          : t("app.xtrec.computationFailed");
        setSelectionHypergraphStatus(message, true);
        if (activeComputation && (activeComputation.type === "xtrec" || activeComputation.type === "transversal")) {
          hideComputationDialog();
        }
        return;
      }

      if (payload.type === "result") {
        const baseResult = pendingSelectionHypergraphResult;
        const xtrec = payload.payload || {};
        if (!baseResult) {
          setSelectionHypergraphRunning(false);
          pendingSelectionHypergraphResult = null;
          setSelectionHypergraphStatus(t("app.selection.inputMissing"), true);
          setSelectionHypergraphOutput("");
          if (activeComputation && (activeComputation.type === "xtrec" || activeComputation.type === "transversal")) {
            hideComputationDialog();
          }
          return;
        }

        const strategy = getTransversalStrategy();
        const strategyLabelMap = {
          all: "ALL",
          xtr: "XTR",
          dlx: "DLX",
          backtracking: "BACKTRACKING",
          greedy: "GREEDY"
        };
        const strategyLabel = strategyLabelMap[strategy] || "ALL";
        const mergedPending = withSelectionStructuralXt({
          ...baseResult,
          xtrec,
          xtrecPending: false,
          transversalPending: true
        });
        pendingSelectionHypergraphResult = mergedPending;
	        lastSelectionHypergraphResult = mergedPending;
	        clearFuzzyResult();
	        setSelectionHypergraphOutput(formatSelectionHypergraphOutput(mergedPending));
	        setAnalysisMessage(buildSelectionHypergraphAnalysisRows(mergedPending), t("status.selectionOutputNone"));
	        refreshDecompositionView();
	        setSelectionHypergraphStatus(t("app.selection.xtrecCompleteStartingTransversal", { strategy: strategyLabel }), false);
        showComputationDialog(
          "transversal",
          t("app.transversal.dialogTitle"),
          t("app.transversal.dialogProgress", { strategy: strategyLabel }),
          true
        );

        const expectedXtrecJobId = jobId;
        void runTransversalWorkerForSelection(mergedPending, strategy)
          .then((transversalResult) => {
            if (activeXtrecJobId !== expectedXtrecJobId) {
              return;
            }
            const finalResult = withSelectionStructuralXt({
              ...mergedPending,
              transversal: transversalResult,
              transversalPending: false
            });
            pendingSelectionHypergraphResult = null;
            lastSelectionHypergraphResult = finalResult;
            clearFuzzyResult();
	            setSelectionHypergraphRunning(false);
	            setSelectionHypergraphOutput(formatSelectionHypergraphOutput(finalResult));
	            setAnalysisMessage(buildSelectionHypergraphAnalysisRows(finalResult), t("status.selectionOutputNone"));
	            refreshDecompositionView();

            const recommended = transversalResult && transversalResult.recommended ? transversalResult.recommended : null;
            if (recommended && recommended.found) {
              const coverType = recommended.type === "exact" ? "dokladna" : "zwykla";
              setSelectionHypergraphStatus(
                t("app.selection.completeWithCover", {
                  xtrec: xtrec && xtrec.isXt ? "TRUE" : "FALSE",
                  coverType,
                  size: formatInteger(Number(recommended.size || 0))
                }),
                false
              );
            } else {
              setSelectionHypergraphStatus(
                t("app.selection.completeNoCover", { xtrec: xtrec && xtrec.isXt ? "TRUE" : "FALSE" }),
                true
              );
            }
            if (activeComputation && (activeComputation.type === "xtrec" || activeComputation.type === "transversal")) {
              hideComputationDialog();
            }
          })
          .catch((error) => {
            if (activeXtrecJobId !== expectedXtrecJobId) {
              return;
            }
            const fallback = withSelectionStructuralXt({
              ...mergedPending,
              transversalPending: false
            });
            pendingSelectionHypergraphResult = null;
            lastSelectionHypergraphResult = fallback;
            clearFuzzyResult();
	            setSelectionHypergraphRunning(false);
	            setSelectionHypergraphOutput(formatSelectionHypergraphOutput(fallback));
	            setAnalysisMessage(buildSelectionHypergraphAnalysisRows(fallback), t("status.selectionOutputNone"));
	            refreshDecompositionView();
            const message = error instanceof Error ? error.message : t("app.hypergraph.transversalFailed");
            setSelectionHypergraphStatus(t("app.selection.transversalAfterXtrecFailed", { message }), true);
            if (activeComputation && (activeComputation.type === "xtrec" || activeComputation.type === "transversal")) {
              hideComputationDialog();
            }
          });
      }
    };

    xtrecWorker.onerror = (event) => {
      setSelectionHypergraphRunning(false);
      pendingSelectionHypergraphResult = null;
      const message = event && event.message
        ? t("app.worker.xtrecFailed", { message: event.message })
        : t("app.worker.xtrecFailedGeneric");
      setSelectionHypergraphStatus(message, true);
      if (activeComputation && (activeComputation.type === "xtrec" || activeComputation.type === "transversal")) {
        hideComputationDialog();
      }
    };

    return xtrecWorker;
  }

  async function runSelectionHypergraphMethod() {
    if (xtrecIsRunning || isComputationDialogOpen()) {
      return;
    }
    if (!lastPinvariantResult) {
      setSelectionHypergraphStatus(t("app.selection.stepResultRequired"), true);
      setSelectionHypergraphOutput("");
      return;
    }

    try {
      lastSfcResult = null;
      setSfcStatus(t("app.selection.sfcStale"), true);
      setSfcOutput("");
      setSfcValidationOutput("");
      setSfcMaxPlusOutput("");
      setSfcRunning(false);
      clearFuzzyResult();
      setSelectionHypergraphStatus(t("app.selection.building"), false);
      const baseResult = withSelectionStructuralXt(computeSelectionHypergraphFromPinvariants(lastPinvariantResult));
      const worker = ensureXtrecWorker();
      if (!worker) {
        lastSelectionHypergraphResult = {
          ...baseResult,
          xtrecPending: false,
          transversalPending: false
        };
        lastSelectionHypergraphResult = withSelectionStructuralXt(lastSelectionHypergraphResult);
	        clearFuzzyResult();
	        setSelectionHypergraphOutput(formatSelectionHypergraphOutput(lastSelectionHypergraphResult));
	        setSelectionHypergraphStatus(t("app.hypergraph.workerUnsupported"), true);
	        setAnalysisMessage(buildSelectionHypergraphAnalysisRows(lastSelectionHypergraphResult), t("status.selectionOutputNone"));
	        refreshDecompositionView();
	        return;
      }

      const accelerationMode = await askSelectionHypergraphAccelerationMode();
      if (accelerationMode === "cancel") {
        lastSelectionHypergraphResult = {
          ...baseResult,
          xtrecPending: false,
          transversalPending: false
        };
        lastSelectionHypergraphResult = withSelectionStructuralXt(lastSelectionHypergraphResult);
	        clearFuzzyResult();
	        setSelectionHypergraphOutput(formatSelectionHypergraphOutput(lastSelectionHypergraphResult));
	        setSelectionHypergraphStatus(t("app.selection.xtrecCancelled"), false);
	        setAnalysisMessage(buildSelectionHypergraphAnalysisRows(lastSelectionHypergraphResult), t("status.selectionOutputNone"));
	        refreshDecompositionView();
	        return;
      }

      const accelerationLabel = getXtrecAccelerationLabel(accelerationMode);
      xtrecJobSequence += 1;
      activeXtrecJobId = xtrecJobSequence;
      pendingSelectionHypergraphResult = {
        ...baseResult,
        xtrecPending: true,
        transversalPending: false
      };
      pendingSelectionHypergraphResult = withSelectionStructuralXt(pendingSelectionHypergraphResult);
      lastSelectionHypergraphResult = null;
      clearFuzzyResult();
      setSelectionHypergraphRunning(true);
      setSelectionHypergraphOutput(formatSelectionHypergraphOutput(pendingSelectionHypergraphResult));
      setSelectionHypergraphStatus(t("app.selection.xtrecStarted", { acceleration: accelerationLabel }), false);
      showComputationDialog(
        "xtrec",
        t("app.hypergraph.xtrecDialogTitle"),
        t("app.selection.xtrecDialogProgress", { acceleration: accelerationLabel }),
        true
      );
      postLocalizedWorkerMessage(worker, {
        type: "compute",
        jobId: activeXtrecJobId,
        payload: {
          matrix: baseResult.reducedDualMatrix,
          rowLabels: baseResult.reducedRowLabels,
          colLabels: baseResult.reducedColLabels,
          acceleration: normalizeXtrecAccelerationMode(accelerationMode)
        }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : t("app.selection.computeFailed");
      pendingSelectionHypergraphResult = null;
      setSelectionHypergraphRunning(false);
      setSelectionHypergraphStatus(message, true);
      setSelectionHypergraphOutput("");
      clearFuzzyResult();
    }
  }

  function getBenchmarkRepeatCount() {
    const raw = benchmarkRepeatCountInput ? parseInt(String(benchmarkRepeatCountInput.value || 1), 10) : 1;
    if (!Number.isInteger(raw)) {
      return 1;
    }
    return Math.max(1, Math.min(20, raw));
  }

  function getBenchmarkXtrecAccelerationMode() {
    const safe = String(benchmarkXtrecAccelerationSelect ? benchmarkXtrecAccelerationSelect.value : "cpu").toLowerCase();
    if (safe === "compare-cpu-webgpu") {
      return "compare-cpu-webgpu";
    }
    return normalizeXtrecAccelerationMode(safe);
  }

  function getBenchmarkXtrecAccelerationModes(value) {
    if (value === "compare-cpu-webgpu") {
      return ["cpu", "webgpu"];
    }
    return [normalizeXtrecAccelerationMode(value)];
  }

  function getBenchmarkPinvariantAccelerationMode() {
    const safe = String(benchmarkPinvAccelerationSelect ? benchmarkPinvAccelerationSelect.value : "cpu").toLowerCase();
    if (safe === "compare-cpu-webgpu") {
      return "compare-cpu-webgpu";
    }
    return normalizePinvariantAccelerationMode(safe);
  }

  function getBenchmarkPinvariantAccelerationModes(value) {
    if (value === "compare-cpu-webgpu") {
      return ["cpu", "webgpu"];
    }
    return [normalizePinvariantAccelerationMode(value)];
  }

  function getBenchmarkEnvironmentSnapshot() {
    const nav = window.navigator || {};
    const userAgentData = nav.userAgentData || null;
    const hardwareConcurrency = Number(nav.hardwareConcurrency || NaN);
    const deviceMemoryGb = Number(nav.deviceMemory || NaN);
    return {
      userAgent: String(nav.userAgent || ""),
      platform: String((userAgentData && userAgentData.platform) || nav.platform || ""),
      hardwareConcurrency: Number.isFinite(hardwareConcurrency) ? hardwareConcurrency : "",
      deviceMemoryGb: Number.isFinite(deviceMemoryGb) ? deviceMemoryGb : "",
      webGpuSupported: Boolean(window.isSecureContext && nav.gpu && typeof nav.gpu.requestAdapter === "function"),
      webGlSupported: canUseWebGlAcceleration()
    };
  }

  function createBenchmarkNetSnapshot(parsedState) {
    const safe = parsedState || {};
    const nodes = Array.isArray(safe.nodes) ? safe.nodes : [];
    const arcs = Array.isArray(safe.arcs) ? safe.arcs : [];
    return {
      nodes: nodes.map((node) => ({
        id: node.id,
        type: node.type,
        tokens: node.type === "place" ? Math.max(0, parseInt(String(node.tokens || 0), 10) || 0) : 0
      })),
      arcs: arcs.map((arc) => ({
        from: arc.from,
        to: arc.to,
        weight: Math.max(1, parseInt(String(arc.weight || 1), 10) || 1)
      }))
    };
  }

  function runPinvariantWorkerForBenchmark(payload, onProgress) {
    return new Promise((resolve, reject) => {
      const worker = new Worker(`public/pinvariant-worker.js?v=${Date.now()}`);
      benchmarkActivePinvariantWorker = worker;
      const jobId = 1;
      let finished = false;

      const cleanup = () => {
        if (!finished) {
          finished = true;
        }
        if (benchmarkActivePinvariantWorker === worker) {
          benchmarkActivePinvariantWorker = null;
        }
        worker.terminate();
      };

      worker.onmessage = (event) => {
        const message = event.data || {};
        if (Number(message.jobId || 0) !== jobId) {
          return;
        }
        if (message.type === "progress") {
          if (typeof onProgress === "function") {
            onProgress(message);
          }
          return;
        }
        if (message.type === "error") {
          cleanup();
          reject(new Error(message.message || t("app.pinvariant.computationFailed")));
          return;
        }
        if (message.type === "result") {
          cleanup();
          resolve(message.payload || {});
        }
      };

      worker.onerror = (event) => {
        cleanup();
        reject(new Error(event && event.message
          ? t("app.worker.pinvariantFailed", { message: event.message })
          : t("app.worker.pinvariantFailedGeneric")));
      };

      postLocalizedWorkerMessage(worker, {
        type: "compute",
        jobId,
        payload
      });
    });
  }

  function runXtrecWorkerForBenchmark(payload, onProgress) {
    return new Promise((resolve, reject) => {
      const worker = new Worker(`public/xtrec-worker.js?v=${Date.now()}`);
      benchmarkActiveXtrecWorker = worker;
      const jobId = 1;
      let finished = false;

      const cleanup = () => {
        if (!finished) {
          finished = true;
        }
        if (benchmarkActiveXtrecWorker === worker) {
          benchmarkActiveXtrecWorker = null;
        }
        worker.terminate();
      };

      worker.onmessage = (event) => {
        const message = event.data || {};
        if (Number(message.jobId || 0) !== jobId) {
          return;
        }
        if (message.type === "progress") {
          if (typeof onProgress === "function") {
            onProgress(message);
          }
          return;
        }
        if (message.type === "error") {
          cleanup();
          reject(new Error(message.message || t("app.xtrec.computationFailed")));
          return;
        }
        if (message.type === "result") {
          cleanup();
          resolve(message.payload || {});
        }
      };

      worker.onerror = (event) => {
        cleanup();
        reject(new Error(event && event.message
          ? t("app.worker.xtrecFailed", { message: event.message })
          : t("app.worker.xtrecFailedGeneric")));
      };

      postLocalizedWorkerMessage(worker, {
        type: "compute",
        jobId,
        payload
      });
    });
  }

  function estimateTextByteLength(value) {
    const text = String(value || "");
    if (typeof TextEncoder !== "undefined") {
      return new TextEncoder().encode(text).length;
    }
    return text.length;
  }

  function buildBenchmarkProfileRecord(libraryName, fileName, rawPnhContent, fileMeta) {
    const content = String(rawPnhContent || "");
    const sizeBytes = Number(fileMeta && fileMeta.size) || estimateTextByteLength(content);
    try {
      const parsed = requirePnhCoreFunction("parsePnhText")(content);
      const nodes = Array.isArray(parsed.nodes) ? parsed.nodes : [];
      const arcs = Array.isArray(parsed.arcs) ? parsed.arcs : [];
      const places = nodes.filter((node) => node.type === "place");
      const transitions = nodes.filter((node) => node.type === "transition");
      const markedPlaces = places.filter((place) => Number(place.tokens || 0) > 0);
      const tokensTotal = places.reduce((sum, place) => sum + Math.max(0, Number(place.tokens || 0)), 0);
      const maxDirectedArcs = Math.max(1, places.length * transitions.length * 2);
      const warnings = Array.isArray(parsed.warnings) ? parsed.warnings.filter(Boolean).join(" | ") : "";
      return {
        libraryName,
        fileName,
        sizeBytes,
        format: String(parsed.format || (content.trim().startsWith("PNH") ? "section" : "matrix")),
        places: places.length,
        transitions: transitions.length,
        arcs: arcs.length,
        markedPlaces: markedPlaces.length,
        tokensTotal,
        arcDensity: arcs.length / maxDirectedArcs,
        warnings,
        error: ""
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : t("app.pnh.parseFailed");
      return {
        libraryName,
        fileName,
        sizeBytes,
        format: "",
        places: NaN,
        transitions: NaN,
        arcs: NaN,
        markedPlaces: NaN,
        tokensTotal: NaN,
        arcDensity: NaN,
        warnings: "",
        error: message
      };
    }
  }

  async function runBenchmarkProfile() {
    if (benchmarkIsRunning || isComputationDialogOpen()) {
      return;
    }

    const selectedLibrary = getSelectedLibrary();
    if (!selectedLibrary || !selectedLibrary.id) {
      setBenchmarkStatus(t("app.benchmark.libraryRequired"), true);
      return;
    }

    const selectedFileNames = getSelectedBenchmarkFileNames();
    if (selectedFileNames.length === 0) {
      setBenchmarkStatus(t("app.benchmark.profileFilesMissing"), true);
      return;
    }

    benchmarkCancelRequested = false;
    benchmarkSessionId += 1;
    const currentSessionId = benchmarkSessionId;
    benchmarkProfileRecords = [];
    benchmarkRepresentativeSelection = null;
    renderBenchmarkResults();
    setBenchmarkRunning(true);
    setBenchmarkStatus(t("app.benchmark.profileStarted", { count: selectedFileNames.length }), false);
    setBenchmarkCurrent(t("app.benchmark.profilePreparing"));
    showComputationDialog(
      "benchmark-profile",
      t("app.benchmark.profileDialogTitle"),
      t("app.benchmark.profileProgress"),
      true
    );

    try {
      for (let fileIndex = 0; fileIndex < selectedFileNames.length; fileIndex += 1) {
        if (benchmarkCancelRequested || benchmarkSessionId !== currentSessionId) {
          break;
        }
        const fileName = selectedFileNames[fileIndex];
        const progressLabel = t("app.benchmark.profileJob", {
          index: fileIndex + 1,
          total: selectedFileNames.length,
          file: fileName
        });
        setBenchmarkCurrent(progressLabel);
        updateComputationDialog(progressLabel);
        try {
          const payload = await callLibraryApi("get_pnh", {
            query: {
              library_id: selectedLibrary.id,
              file_name: fileName
            }
          });
          const fileContent = String(payload.file && payload.file.content ? payload.file.content : "");
          const fileMeta = findLibraryFileByName(fileName);
          benchmarkProfileRecords.push(buildBenchmarkProfileRecord(selectedLibrary.name, fileName, fileContent, fileMeta));
        } catch (error) {
          const message = error instanceof Error ? error.message : t("app.benchmark.pnhLoadFailed");
          const fileMeta = findLibraryFileByName(fileName);
          benchmarkProfileRecords.push({
            libraryName: selectedLibrary.name,
            fileName,
            sizeBytes: Number(fileMeta && fileMeta.size) || NaN,
            format: "",
            places: NaN,
            transitions: NaN,
            arcs: NaN,
            markedPlaces: NaN,
            tokensTotal: NaN,
            arcDensity: NaN,
            warnings: "",
            error: message
          });
        }
        renderBenchmarkResults();
      }
    } finally {
      const cancelled = benchmarkCancelRequested || benchmarkSessionId !== currentSessionId;
      setBenchmarkRunning(false);
      hideComputationDialog();
      setBenchmarkCurrent(cancelled ? t("status.benchCancelled") : t("status.benchCurrentIdle"));
      setBenchmarkStatus(
        cancelled
          ? t("app.benchmark.profileCancelled")
          : t("app.benchmark.profileComplete", { count: benchmarkProfileRecords.length }),
        cancelled
      );
      renderBenchmarkResults();
    }
  }

  async function runSingleBenchmark(rawPnhContent, options, progressSink) {
    const parsed = parsePnhText(String(rawPnhContent || ""), "coordinates");
    const snapshot = createBenchmarkNetSnapshot(parsed);
    const places = snapshot.nodes.filter((node) => node.type === "place").length;
    const transitions = snapshot.nodes.filter((node) => node.type === "transition").length;
    if (places <= 0 || transitions <= 0) {
      throw new Error(t("app.benchmark.invalidNet"));
    }

    const pinvMode = normalizePinvariantMode(options && options.pinvMode ? options.pinvMode : "cover-stop");
    const pinvAcceleration = normalizePinvariantAccelerationMode(
      options && options.pinvAcceleration ? options.pinvAcceleration : "cpu"
    );
    const xtrecAcceleration = normalizeXtrecAccelerationMode(
      options && options.xtrecAcceleration ? options.xtrecAcceleration : "cpu"
    );
    const pinvariantResult = await runPinvariantWorkerForBenchmark({
      mode: pinvMode,
      acceleration: pinvAcceleration,
      nodes: snapshot.nodes,
      arcs: snapshot.arcs
    }, (message) => {
      if (typeof progressSink === "function") {
        progressSink("martinez", message);
      }
    });

    const selectionResult = computeSelectionHypergraphFromPinvariants(pinvariantResult);
    const xtrecResult = await runXtrecWorkerForBenchmark({
      matrix: selectionResult.reducedDualMatrix,
      rowLabels: selectionResult.reducedRowLabels,
      colLabels: selectionResult.reducedColLabels,
      acceleration: xtrecAcceleration
    }, (message) => {
      if (typeof progressSink === "function") {
        progressSink("xtrec", message);
      }
    });
    if (typeof progressSink === "function") {
      progressSink("structural-xt", { message: t("app.benchmark.structuralProgress") });
    }
    let petriAssumptions = null;
    try {
      petriAssumptions = computeLivenessSafenessFor(snapshot.nodes, snapshot.arcs, 3500);
    } catch (_) {
      petriAssumptions = null;
    }
    const structuralXtResult = analyzeStructuralXtInput({
      source: "selection",
      matrix: selectionResult.reducedDualMatrix,
      rowLabels: selectionResult.reducedRowLabels,
      colLabels: selectionResult.reducedColLabels,
      componentPlaces: selectionResult.reducedComponentPlaces || null,
      xtrec: xtrecResult,
      petri: petriAssumptions
    });
    const structuralRules = {};
    (structuralXtResult.rules || []).forEach((rule) => {
      structuralRules[rule.id] = rule.status || "";
    });
    const hypergraphEdgeSizes = (selectionResult.reducedDualMatrix || []).map((row) => (
      (Array.isArray(row) ? row : []).reduce((sum, value) => sum + (Number(value || 0) > 0 ? 1 : 0), 0)
    ));

    const pinvOps = pinvariantResult.operations || {};
    const selectionMetrics = selectionResult.metrics || {};
    const fraMetrics = selectionMetrics.fra || {};
    const transposeMetrics = selectionMetrics.transpose || {};
    const xtOps = xtrecResult.operations || {};
    const transposeOps = Number(transposeMetrics.cellAssignments || 0) + Number(transposeMetrics.supportWrites || 0);
    const fraOps = Number(fraMetrics.essentialCellChecks || 0)
      + Number(fraMetrics.rowPairComparisons || 0)
      + Number(fraMetrics.colPairComparisons || 0)
      + Number(fraMetrics.vectorCellComparisons || 0);
    const selectionOps = Number(selectionMetrics.totalOps || (transposeOps + fraOps));
    const xtrecTotalOps = Number(xtOps.projectionOps || 0)
      + Number(xtOps.intersectionChecks || 0)
      + Number(xtOps.minPairComparisons || 0)
      + Number(xtOps.essentialUnionOps || 0)
      + Number(xtOps.veMaskUnionOps || 0)
      + Number(xtOps.starCellChecks || 0)
      + Number(xtOps.projectionEdgeScans || 0);

    return {
      error: "",
      places,
      transitions,
      invariantsCount: Array.isArray(pinvariantResult.invariants) ? pinvariantResult.invariants.length : 0,
      correctSubnetsCount: Number(pinvariantResult.correctSubnetsCount || 0),
      hypergraphEdges: Array.isArray(selectionResult.reducedRowLabels) ? selectionResult.reducedRowLabels.length : 0,
      hypergraphVertices: Array.isArray(selectionResult.reducedColLabels) ? selectionResult.reducedColLabels.length : 0,
      hypergraphMinEdgeSize: hypergraphEdgeSizes.length ? Math.min(...hypergraphEdgeSizes) : NaN,
      hypergraphMaxEdgeSize: hypergraphEdgeSizes.length ? Math.max(...hypergraphEdgeSizes) : NaN,
      pinvariantMs: Number(pinvariantResult.runtimeMs || NaN),
      pinvariantAccelerationRequested: String(pinvariantResult.accelerationRequested || pinvAcceleration).toUpperCase(),
      pinvariantAccelerationUsed: String(pinvariantResult.accelerationUsed || pinvAcceleration).toUpperCase(),
      pinvariantDotOps: Number(pinvOps.dotProductEvaluations || 0),
      pinvariantCombinationOps: Number(pinvOps.combinationAttempts || 0),
      transposeMs: Number(transposeMetrics.ms || NaN),
      transposeOps,
      fraMs: Number(fraMetrics.ms || NaN),
      fraOps,
      selectionMs: Number(selectionMetrics.totalMs || NaN),
      selectionOps,
      xtrecMs: Number(xtrecResult.runtimeMs || NaN),
      xtrecAccelerationRequested: String(xtrecResult.accelerationRequested || xtrecAcceleration).toUpperCase(),
      xtrecAccelerationUsed: String(xtrecResult.accelerationUsed || xtrecAcceleration).toUpperCase(),
      xtrecProjectionOps: Number(xtOps.projectionOps || 0),
      xtrecChecks: Number(xtOps.intersectionChecks || 0),
      xtrecMinPairComparisons: Number(xtOps.minPairComparisons || 0),
      xtrecTotalOps,
      xtClass: typeof xtrecResult.isXt === "boolean" ? xtrecResult.isXt : null,
      structuralXtCertified: Boolean(structuralXtResult.structurallyCertified),
      structuralXtSufficientRules: Array.isArray(structuralXtResult.sufficientRules) && structuralXtResult.sufficientRules.length
        ? structuralXtResult.sufficientRules.join("|")
        : "-",
      structuralXtR1: structuralRules.R1 || "",
      structuralXtR2: structuralRules.R2 || "",
      structuralXtR3: structuralRules.R3 || "",
      structuralXtR4: structuralRules.R4 || "",
      structuralXtR5: structuralRules.R5 || "",
      structuralXtR6: structuralRules.R6 || "",
      environment: options && options.environment ? options.environment : null
    };
  }

  function cancelBenchmarkComputation() {
    if (!benchmarkIsRunning) {
      return;
    }
    benchmarkCancelRequested = true;
    if (benchmarkActivePinvariantWorker) {
      benchmarkActivePinvariantWorker.terminate();
      benchmarkActivePinvariantWorker = null;
    }
    if (benchmarkActiveXtrecWorker) {
      benchmarkActiveXtrecWorker.terminate();
      benchmarkActiveXtrecWorker = null;
    }
    setBenchmarkStatus(t("app.benchmark.cancelling"), true);
  }

  async function runBenchmarkModule() {
    if (benchmarkIsRunning || isComputationDialogOpen()) {
      return;
    }

    const selectedLibrary = getSelectedLibrary();
    if (!selectedLibrary || !selectedLibrary.id) {
      setBenchmarkStatus(t("app.benchmark.libraryRequired"), true);
      return;
    }

    const selectedFileNames = getSelectedBenchmarkFileNames();
    if (selectedFileNames.length === 0) {
      setBenchmarkStatus(t("app.benchmark.filesMissing"), true);
      return;
    }

    const repeats = getBenchmarkRepeatCount();
    const pinvMode = normalizePinvariantMode(benchmarkPinvModeSelect ? benchmarkPinvModeSelect.value : "cover-stop");
    const pinvAcceleration = getBenchmarkPinvariantAccelerationMode();
    const pinvAccelerationModes = getBenchmarkPinvariantAccelerationModes(pinvAcceleration);
    const xtrecAcceleration = getBenchmarkXtrecAccelerationMode();
    const xtrecAccelerationModes = getBenchmarkXtrecAccelerationModes(xtrecAcceleration);
    const pinvAccelerationLabel = pinvAcceleration === "compare-cpu-webgpu"
      ? "CPU vs WebGPU"
      : getPinvariantAccelerationLabel(pinvAcceleration);
    const xtrecAccelerationLabel = xtrecAcceleration === "compare-cpu-webgpu"
      ? "CPU vs WebGPU"
      : getXtrecAccelerationLabel(xtrecAcceleration);
    const benchmarkEnvironment = getBenchmarkEnvironmentSnapshot();
    const accelerationPairs = [];
    pinvAccelerationModes.forEach((pinvAccel) => {
      xtrecAccelerationModes.forEach((xtrecAccel) => {
        accelerationPairs.push({ pinvAccel, xtrecAccel });
      });
    });
    const totalBenchmarkJobs = selectedFileNames.length * accelerationPairs.length;

    benchmarkCancelRequested = false;
    benchmarkSessionId += 1;
    const currentSessionId = benchmarkSessionId;
    benchmarkRecords = [];
    setBenchmarkLatexOutput("");
    renderBenchmarkResults();
    setBenchmarkRunning(true);
    setBenchmarkStatus(
      t("app.benchmark.started", {
        files: selectedFileNames.length,
        repetitions: repeats,
        ms: pinvAccelerationLabel,
        xtrec: xtrecAccelerationLabel
      }),
      false
    );
    setBenchmarkCurrent(t("app.benchmark.preparing"));
    showComputationDialog(
      "benchmark",
      t("app.benchmark.dialogTitle"),
      t("app.benchmark.progress"),
      true
    );

    try {
      for (let fileIndex = 0; fileIndex < selectedFileNames.length; fileIndex += 1) {
        if (benchmarkCancelRequested || benchmarkSessionId !== currentSessionId) {
          break;
        }

        const fileName = selectedFileNames[fileIndex];

        let fileContent = "";
        try {
          const payload = await callLibraryApi("get_pnh", {
            query: {
              library_id: selectedLibrary.id,
              file_name: fileName
            }
          });
          fileContent = String(payload.file && payload.file.content ? payload.file.content : "");
          if (!fileContent.trim()) {
            throw new Error(t("app.benchmark.emptyPnh"));
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : t("app.benchmark.fileLoadFailed");
          const record = {
            libraryName: selectedLibrary.name,
            fileName,
            pinvariantAccelerationRequested: pinvAccelerationLabel,
            xtrecAccelerationRequested: xtrecAccelerationLabel,
            environment: benchmarkEnvironment,
            runs: [{ error: message }]
          };
          benchmarkRecords.push(record);
          setBenchmarkStatus(t("app.benchmark.fileError", { file: fileName, message }), true);
          renderBenchmarkResults();
          continue;
        }

        for (let modeIndex = 0; modeIndex < accelerationPairs.length; modeIndex += 1) {
          const modePair = accelerationPairs[modeIndex];
          const pinvModeLabel = getPinvariantAccelerationLabel(modePair.pinvAccel);
          const xtrecModeLabel = getXtrecAccelerationLabel(modePair.xtrecAccel);
          const record = {
            libraryName: selectedLibrary.name,
            fileName,
            pinvariantAccelerationRequested: pinvModeLabel,
            xtrecAccelerationRequested: xtrecModeLabel,
            environment: benchmarkEnvironment,
            runs: []
          };
          benchmarkRecords.push(record);
          renderBenchmarkResults();

          for (let repeatIndex = 0; repeatIndex < repeats; repeatIndex += 1) {
            if (benchmarkCancelRequested || benchmarkSessionId !== currentSessionId) {
              break;
            }

            const jobIndex = (fileIndex * accelerationPairs.length) + modeIndex + 1;
            const progressLabel = t("app.benchmark.jobLabel", {
              index: jobIndex,
              total: totalBenchmarkJobs,
              file: fileName,
              ms: pinvModeLabel,
              xtrec: xtrecModeLabel,
              repetition: repeatIndex + 1,
              repetitions: repeats
            });
            setBenchmarkCurrent(progressLabel);
            updateComputationDialog(progressLabel);

            try {
              const runResult = await runSingleBenchmark(fileContent, {
                pinvMode,
                pinvAcceleration: modePair.pinvAccel,
                xtrecAcceleration: modePair.xtrecAccel,
                environment: benchmarkEnvironment
              }, (phase, message) => {
                if (benchmarkCancelRequested || benchmarkSessionId !== currentSessionId) {
                  return;
                }
                const phaseLabel = phase === "xtrec"
                  ? "XTREC"
                  : (phase === "structural-xt" ? t("app.benchmark.xtConditionsPhase") : "Martinez-Silva");
                const detail = message && message.message ? String(message.message) : "";
                const progressText = detail
                  ? `${progressLabel} | ${phaseLabel}: ${detail}`
                  : `${progressLabel} | ${phaseLabel}`;
                setBenchmarkCurrent(progressText);
                updateComputationDialog(progressText);
              });
              record.runs.push(runResult);
              setBenchmarkStatus(t("app.benchmark.jobComplete", { label: progressLabel }), false);
            } catch (error) {
              if (benchmarkCancelRequested || benchmarkSessionId !== currentSessionId) {
                break;
              }
              const message = error instanceof Error ? error.message : t("app.benchmark.unknownError");
              record.runs.push({ error: message });
              setBenchmarkStatus(t("app.benchmark.jobError", { label: progressLabel, message }), true);
            }

            renderBenchmarkResults();
          }
        }
      }
    } finally {
      benchmarkActivePinvariantWorker = null;
      benchmarkActiveXtrecWorker = null;
      const cancelled = benchmarkCancelRequested || benchmarkSessionId !== currentSessionId;
      setBenchmarkRunning(false);
      hideComputationDialog();
      if (cancelled) {
        setBenchmarkStatus(t("app.benchmark.cancelled"), true);
      } else {
        setBenchmarkStatus(t("app.benchmark.complete"), false);
      }
      setBenchmarkCurrent(cancelled ? t("status.benchCancelled") : t("status.benchCurrentIdle"));
      renderBenchmarkResults();
    }
  }

  function exportBenchmarkCsv() {
    if (benchmarkRecords.length === 0) {
      setBenchmarkStatus(t("app.benchmark.csvMissing"), true);
      return;
    }
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    downloadTextFile(`pooh-benchmark-${stamp}.csv`, buildBenchmarkCsv(), "text/csv;charset=utf-8");
    setBenchmarkStatus(t("app.benchmark.csvExported"), false);
  }

  function exportBenchmarkProfileCsv() {
    if (benchmarkProfileRecords.length === 0) {
      setBenchmarkStatus(t("app.benchmark.profileCsvMissing"), true);
      return;
    }
    const selectedLibrary = getSelectedLibrary();
    const safeLibrary = sanitizeExportName(selectedLibrary ? selectedLibrary.name : "library");
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    downloadTextFile(`pooh-benchmark-profile-${safeLibrary}-${stamp}.csv`, buildBenchmarkProfileCsv(), "text/csv;charset=utf-8");
    setBenchmarkStatus(t("app.benchmark.profileCsvExported"), false);
  }

  function exportBenchmarkLatex() {
    if (benchmarkRecords.length === 0) {
      setBenchmarkStatus(t("app.benchmark.latexMissing"), true);
      return;
    }
    const latex = buildBenchmarkLatexTable();
    setBenchmarkLatexOutput(latex);
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    downloadTextFile(`pooh-benchmark-${stamp}.tex`, latex, "text/plain;charset=utf-8");
    setBenchmarkStatus(t("app.benchmark.latexGenerated"), false);
  }

  function render() {
    while (svg.lastChild && svg.lastChild.tagName !== "defs") {
      svg.removeChild(svg.lastChild);
    }
    viewportLayer = null;

    const bg = document.createElementNS(NS, "rect");
    bg.setAttribute("x", "0");
    bg.setAttribute("y", "0");
    bg.setAttribute("width", String(CANVAS_W));
    bg.setAttribute("height", String(CANVAS_H));
    bg.setAttribute("class", "canvas-bg");
    svg.appendChild(bg);

    viewportLayer = document.createElementNS(NS, "g");
    viewportLayer.setAttribute("id", "viewport-layer");
    svg.appendChild(viewportLayer);
    applyViewTransform();

    const enabled = getEnabledTransitions();
    const enabledIds = new Set(enabled.map((item) => item.id));

    state.arcs.forEach((arc) => {
      const element = createArcElement(arc);
      if (element) {
        viewportLayer.appendChild(element);
      }
    });

    state.nodes.forEach((node) => {
      viewportLayer.appendChild(createNodeElement(node, enabledIds));
    });

    updateEnabledTransitionsLabel(enabled);
    updateZoomUi();
    updateInspector();
    renderMetadataPanel();
    renderClassificationPanel();
    if (activeWorkspaceTab === "decomposition") {
      refreshDecompositionView();
    }
    persistToLocalStorage();
  }

  function serializeState() {
    return {
      nodes: state.nodes,
      arcs: state.arcs,
      metadata: state.metadata,
      counters: state.counters,
      view: state.view,
      settings: state.settings
    };
  }

  function persistToLocalStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeState()));
  }

  function inferCounter(prefix, items) {
    const numbers = items
      .map((item) => item.id)
      .filter((id) => id.startsWith(prefix))
      .map((id) => parseInt(id.slice(prefix.length), 10))
      .filter((num) => Number.isInteger(num));
    return numbers.length ? Math.max(...numbers) : 0;
  }

  function applyState(nextState) {
    if (!nextState || !Array.isArray(nextState.nodes) || !Array.isArray(nextState.arcs)) {
      throw new Error(t("app.data.formatInvalid"));
    }

    const usedNodeIds = new Set();
    const mappedNodes = nextState.nodes.map((node) => {
      const id = String(node.id || "").trim();
      if (!id) {
        throw new Error(t("app.data.nodeIdRequired"));
      }
      if (usedNodeIds.has(id)) {
        throw new Error(t("app.data.nodeIdDuplicate", { id }));
      }
      usedNodeIds.add(id);

      const type = node.type === "transition" ? "transition" : "place";
      const x = Number(node.x);
      const y = Number(node.y);
      const clamped = clampToCanvas({
        x: Number.isFinite(x) ? x : 50,
        y: Number.isFinite(y) ? y : 50
      });

      return {
        id,
        type,
        x: clamped.x,
        y: clamped.y,
        label: String(node.label || id),
        tokens: type === "place" ? Math.max(0, parseInt(String(node.tokens || 0), 10) || 0) : 0,
        angle: type === "transition" ? normalizeAngle(node.angle || 0) : 0
      };
    });

    const nodeMap = new Map(mappedNodes.map((node) => [node.id, node]));
    const usedArcIds = new Set();
    const mappedArcs = nextState.arcs.map((arc) => {
      const id = String(arc.id || "").trim();
      if (!id) {
        throw new Error(t("app.data.arcIdRequired"));
      }
      if (usedArcIds.has(id)) {
        throw new Error(t("app.data.arcIdDuplicate", { id }));
      }
      usedArcIds.add(id);

      const from = String(arc.from || "").trim();
      const to = String(arc.to || "").trim();
      const fromNode = nodeMap.get(from);
      const toNode = nodeMap.get(to);
      if (!fromNode || !toNode) {
        throw new Error(t("app.data.arcNodesMissing", { id }));
      }
      if (fromNode.type === toNode.type) {
        throw new Error(t("app.data.arcBipartiteRequired", { id }));
      }

      return {
        id,
        from,
        to,
        weight: Math.max(1, parseInt(String(arc.weight || 1), 10) || 1),
        points: normalizeArcPoints(arc.points)
      };
    });

    state.nodes = mappedNodes;
    state.arcs = mappedArcs;
    state.metadata = normalizeMetadata(nextState.metadata);
    state.counters = {
      place: Number(nextState.counters?.place) || inferCounter("P", mappedNodes) + 1,
      transition: Number(nextState.counters?.transition) || inferCounter("T", mappedNodes) + 1,
      arc: Number(nextState.counters?.arc) || inferCounter("A", mappedArcs) + 1
    };

    const desiredLayout = nextState.settings?.layoutMode || state.settings.layoutMode;
    const desiredLanguage = normalizeLanguage(nextState.settings?.language || state.settings.language);
    setLanguage(desiredLanguage, true, false);
    setLayoutMode(desiredLayout);
    const nextView = nextState.view || { zoom: 1, panX: 0, panY: 0 };
    setView(nextView.zoom, nextView.panX, nextView.panY);

    clearSelection();
    dragInfo = null;
    arcPointDragInfo = null;
    stopAutoSimulation();
    cancelGeneratorComputation();
    cancelPinvariantComputation();
    cancelXtrecComputation();
    cancelSfcComputation();
    cancelBenchmarkComputation();
    hideComputationDialog();
    lastPinvariantResult = null;
    lastSelectionHypergraphResult = null;
    lastSfcResult = null;
    setPinvariantStatus(t("status.pinvIdle"), false);
    setPinvariantOutput("");
    setPinvariantMatrixOutput("");
    setSelectionHypergraphStatus(t("status.selectionIdle"), false);
    setSelectionHypergraphOutput("");
    setSfcStatus(t("status.sfcReady"), false);
    setSfcOutput("");
    setSfcValidationOutput("");
    setSfcMaxPlusOutput("");
    setSfcRunning(false);
    clearFuzzyResult();
    setAnalysisMessage([], t("status.analysisIdle"));
    updateCanvasNetName();
    render();
  }

  function updateCanvasNetName() {
    if (!canvasNetName) return;
    var fileName = getMetadataValue(state.metadata, "LibraryFile");
    if (fileName) {
      canvasNetName.textContent = fileName;
      canvasNetName.classList.remove("hidden");
    } else {
      canvasNetName.textContent = "";
      canvasNetName.classList.add("hidden");
    }
  }

  function loadFromLocalStorage() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return false;
    }
    try {
      applyState(JSON.parse(raw));
      return true;
    } catch (error) {
      return false;
    }
  }

  function resetState() {
    state.nodes = [];
    state.arcs = [];
    state.metadata = [];
    state.counters = { place: 1, transition: 1, arc: 1 };
    setView(1, 0, 0);
    clearSelection();
    dragInfo = null;
    arcPointDragInfo = null;
    stopAutoSimulation();
    cancelGeneratorComputation();
    cancelPinvariantComputation();
    cancelXtrecComputation();
    cancelSfcComputation();
    cancelBenchmarkComputation();
    hideComputationDialog();
    lastPinvariantResult = null;
    lastSelectionHypergraphResult = null;
    lastSfcResult = null;
    setPinvariantStatus(t("status.pinvIdle"), false);
    setPinvariantOutput("");
    setPinvariantMatrixOutput("");
    setSelectionHypergraphStatus(t("status.selectionIdle"), false);
    setSelectionHypergraphOutput("");
    setSfcStatus(t("status.sfcReady"), false);
    setSfcOutput("");
    setSfcValidationOutput("");
    setSfcMaxPlusOutput("");
    setSfcRunning(false);
    clearFuzzyResult();
    setAnalysisMessage([], t("status.analysisIdle"));
    updateCanvasNetName();
    render();
  }

  function exportJsonFile() {
    const payload = JSON.stringify(serializeState(), null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "pooh-petri-net.json";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function exportPNH() {
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "export_pnh.php";
    form.target = "_blank";

    const input = document.createElement("input");
    input.type = "hidden";
    input.name = "net_json";
    input.value = JSON.stringify(serializeState());

    const languageInput = document.createElement("input");
    languageInput.type = "hidden";
    languageInput.name = "language";
    languageInput.value = normalizeLanguage(state.settings.language);

    form.append(input, languageInput);
    document.body.appendChild(form);
    form.submit();
    form.remove();
  }

  function getMetadataValue(metadata, keyName) {
    const lowered = keyName.toLowerCase();
    const found = metadata.find((entry) => entry.key.toLowerCase() === lowered);
    return found ? found.value : "";
  }

  function getPnhCore() {
    const core = window.PoohPnhCore;
    return core && typeof core === "object" ? core : null;
  }

  function requirePnhCoreFunction(name) {
    const core = getPnhCore();
    if (core && typeof core[name] === "function") {
      return core[name].bind(core);
    }
    throw new Error(t("app.core.missing", { module: "PNH", name, path: "src/core/pnh.js" }));
  }

  function getPetriLayoutCore() {
    const core = window.PoohPetriLayoutCore;
    return core && typeof core === "object" ? core : null;
  }

  function requirePetriLayoutCoreFunction(name) {
    const core = getPetriLayoutCore();
    if (core && typeof core[name] === "function") {
      return core[name].bind(core);
    }
    throw new Error(t("app.core.missing", { module: "Petri layout", name, path: "src/core/petri-layout.js" }));
  }

  function getPetriLayoutOptions() {
    return {
      width: CANVAS_W,
      height: CANVAS_H,
      padding: LAYOUT_PADDING,
      clampMargin: 36,
      defaultLayoutMode: DEFAULT_LAYOUT_MODE
    };
  }

  function buildImportedStateFromPnhCore(parsed, layoutMode) {
    return requirePetriLayoutCoreFunction("buildImportedStateFromParsedPnh")(parsed, layoutMode, getPetriLayoutOptions());
  }

  function parsePnhText(rawText, layoutMode) {
    return buildImportedStateFromPnhCore(requirePnhCoreFunction("parsePnhText")(rawText), layoutMode);
  }

  function layoutImportedNodes(nodes, arcs, modeName) {
    return requirePetriLayoutCoreFunction("layoutImportedNodes")(nodes, arcs, modeName, getPetriLayoutOptions());
  }

  function relayoutCurrentNet(modeName) {
    if (state.nodes.length === 0) {
      return;
    }
    const currentNodes = state.nodes.map((node) => ({ ...node }));
    const currentArcs = state.arcs.map((arc) => ({ ...arc }));
    const laidOut = layoutImportedNodes(currentNodes, currentArcs, modeName || state.settings.layoutMode);
    const posById = new Map(laidOut.map((node) => [node.id, node]));

    state.nodes = state.nodes.map((node) => {
      const next = posById.get(node.id);
      if (!next) {
        return node;
      }
      return {
        ...node,
        x: next.x,
        y: next.y,
        angle: next.angle
      };
    });
    render();
  }

  function buildTransitionRulesFor(nodes, arcs, placeIds) {
    return requirePetriAnalysisCoreFunction("buildTransitionRulesFor")(nodes, arcs, placeIds);
  }

  function computeEnabledTransitionsForMarking(marking, transitionRules) {
    return requirePetriAnalysisCoreFunction("computeEnabledTransitionsForMarking")(marking, transitionRules);
  }

  function fireOnMarking(marking, transitionRule) {
    return requirePetriAnalysisCoreFunction("fireOnMarking")(marking, transitionRule);
  }

  function computeLivenessSafenessFor(nodes, arcs, maxStates) {
    return requirePetriAnalysisCoreFunction("computeLivenessSafenessFor")(nodes, arcs, maxStates);
  }

  function analyzeLivenessAndSafeness() {
    const analysis = computeLivenessSafenessFor(state.nodes, state.arcs, 3500);
    if (analysis.placeCount === 0 || analysis.transitionCount === 0) {
      setAnalysisMessage([
        { key: t("app.analysis.analysis"), status: "WARN", message: t("app.analysis.modelRequired") }
      ]);
      return;
    }

    const rows = [];
    rows.push({
      key: t("app.analysis.safeness"),
      status: analysis.safe ? "OK" : "NO",
      message: analysis.safe
        ? t("app.analysis.safe")
        : t("app.analysis.unsafe", { maximum: analysis.maxTokenSeen })
    });

    if (analysis.truncated) {
      rows.push({
        key: t("app.analysis.liveness"),
        status: "WARN",
        message: t("app.analysis.partialLiveness", {
          limit: analysis.statesLimit,
          result: t(analysis.live ? "app.analysis.allAppearLive" : "app.analysis.someNotLive")
        })
      });
    } else {
      rows.push({
        key: t("app.analysis.liveness"),
        status: analysis.live ? "OK" : "NO",
        message: analysis.live
          ? t("app.analysis.live")
          : t("app.analysis.notLive")
      });
    }

    rows.push({
      key: "Deadlock",
      status: analysis.deadlocksCount === 0 ? "OK" : "NO",
      message: analysis.deadlocksCount === 0
        ? t("app.analysis.noDeadlocks")
        : t("app.analysis.deadlocks", { count: analysis.deadlocksCount })
    });

    rows.push({
      key: t("app.analysis.searchedStates"),
      status: analysis.truncated ? "WARN" : "OK",
      message: t("app.analysis.states", {
        count: analysis.statesCount,
        truncated: analysis.truncated ? t("app.analysis.limitReached") : ""
      })
    });

    setAnalysisMessage(rows);
  }

  function sanitizeGenerationMethod(value) {
    const raw = String(value || "adaptive").toLowerCase();
    if (raw === "workflow" || raw === "region" || raw === "refinement") {
      return raw;
    }
    return "adaptive";
  }

  function generationMethodLabel(methodName) {
    const raw = String(methodName || "adaptive").toLowerCase();
    if (raw === "xt-hypergraph-constructive") {
      return "Constructive xt-hypergraph";
    }
    if (raw === "live-safe-constructive") {
      return "Constructive live+safe";
    }
    const method = sanitizeGenerationMethod(raw);
    if (method === "workflow") {
      return "Workflow patterns (process-tree)";
    }
    if (method === "region") {
      return "Region-inspired (TS -> PN)";
    }
    if (method === "refinement") {
      return "Stepwise Refinement";
    }
    return t("app.generator.adaptive");
  }

  function sanitizeCount(value, fallback) {
    const parsed = parseInt(String(value || fallback), 10);
    if (!Number.isInteger(parsed) || parsed < 1) {
      return fallback;
    }
    return Math.min(240, parsed);
  }

  function buildGeneratorParamsFromUi() {
    const placeCount = sanitizeCount(genPlaceCountInput ? genPlaceCountInput.value : 12, 12);
    const transitionCount = sanitizeCount(genTransitionCountInput ? genTransitionCountInput.value : 12, 12);
    const netType = genNetTypeSelect ? String(genNetTypeSelect.value || "any") : "any";
    const method = sanitizeGenerationMethod(genMethodSelect ? String(genMethodSelect.value || "adaptive") : "adaptive");
    const liveOption = genLiveOptionSelect ? String(genLiveOptionSelect.value || "any") : "any";
    const safeOption = genSafeOptionSelect ? String(genSafeOptionSelect.value || "any") : "any";
    const redundantCountRaw = parseInt(String(genRedundantCountInput ? genRedundantCountInput.value : 1), 10);
    const redundantCount = Math.max(0, Number.isInteger(redundantCountRaw) ? redundantCountRaw : 1);
    const xtHypergraph = genXtHypergraphCheckbox ? genXtHypergraphCheckbox.checked : false;
    return {
      placeCount,
      transitionCount,
      netType,
      method,
      liveOption,
      safeOption,
      redundantCount,
      xtHypergraph
    };
  }

  function setGeneratorRunning(isRunning) {
    generatorIsRunning = Boolean(isRunning);
    if (!generateNetBtn) {
      return;
    }
    generateNetBtn.disabled = generatorIsRunning;
    generateNetBtn.textContent = t(generatorIsRunning ? "app.generator.running" : "app.generator.generate");
  }

  function cancelGeneratorComputation() {
    if (generatorWorker) {
      generatorWorker.terminate();
      generatorWorker = null;
    }
    activeGeneratorJobId = 0;
    setGeneratorRunning(false);
  }

  function ensureGeneratorWorker() {
    if (generatorWorker) {
      return generatorWorker;
    }
    if (!("Worker" in window)) {
      return null;
    }

    const workerUrl = `public/generator-worker.js?v=${Date.now()}`;
    generatorWorker = new Worker(workerUrl);
    generatorWorker.onmessage = (event) => {
      const payload = event.data || {};
      const jobId = Number(payload.jobId || 0);
      if (!jobId || jobId !== activeGeneratorJobId) {
        return;
      }

      if (payload.type === "progress") {
        const attempt = Number(payload.attempt || 0);
        const total = Number(payload.total || 0);
        const details = payload.message ? String(payload.message) : t("app.generator.attempt", { attempt, total });
        setGenerateStatus(t("app.generator.backgroundProgress", { details }), false);
        if (activeComputation && activeComputation.type === "generator") {
          updateComputationDialog(t("app.generator.dialogProgress", { details }));
        }
        return;
      }

      if (payload.type === "error") {
        setGeneratorRunning(false);
        const message = payload.message ? String(payload.message) : t("app.generator.backgroundError");
        setGenerateStatus(message, true);
        if (activeComputation && activeComputation.type === "generator") {
          hideComputationDialog();
        }
        return;
      }

      if (payload.type === "result") {
        setGeneratorRunning(false);
        const generated = payload.payload || {};
        const nodes = Array.isArray(generated.nodes) ? generated.nodes : [];
        const arcs = Array.isArray(generated.arcs) ? generated.arcs : [];
        const laidOutNodes = layoutImportedNodes(nodes, arcs, state.settings.layoutMode);
        const nextPayload = {
          nodes: laidOutNodes,
          arcs,
          metadata: generated.metadata || [],
          counters: generated.counters || null,
          view: { zoom: 1, panX: 0, panY: 0 },
          settings: {
            layoutMode: state.settings.layoutMode
          }
        };
        applyState(nextPayload);

        const usedParams = generated.usedParams || {};
        if (genPlaceCountInput && Number.isInteger(parseInt(String(usedParams.placeCount || ""), 10))) {
          genPlaceCountInput.value = String(usedParams.placeCount);
        }
        if (genTransitionCountInput && Number.isInteger(parseInt(String(usedParams.transitionCount || ""), 10))) {
          genTransitionCountInput.value = String(usedParams.transitionCount);
        }
        if (genMethodSelect && usedParams.method) {
          genMethodSelect.value = sanitizeGenerationMethod(usedParams.method);
        }

        const analysis = generated.analysis || {};
        const safeLabel = t(analysis.safe ? "app.generator.safe" : "app.generator.unsafe");
        const liveLabel = t(analysis.live ? "app.generator.live" : "app.generator.notLive");
        const attempt = Number(generated.attempt || 0);
        const placesLabel = usedParams.placeCount || nodes.filter((node) => node.type === "place").length;
        const transitionsLabel = usedParams.transitionCount || nodes.filter((node) => node.type === "transition").length;
        const methodLabel = generationMethodLabel(usedParams.method);
        setGenerateStatus(
          t("app.generator.complete", {
            method: methodLabel,
            places: placesLabel,
            transitions: transitionsLabel,
            attempt: attempt || 1,
            live: liveLabel,
            safe: safeLabel
          }),
          false
        );
        setAnalysisMessage([], t("app.generator.loaded"));
        if (activeComputation && activeComputation.type === "generator") {
          hideComputationDialog();
        }
      }
    };

    generatorWorker.onerror = (event) => {
      setGeneratorRunning(false);
      const message = event && event.message
        ? t("app.worker.generatorFailed", { message: event.message })
        : t("app.worker.generatorFailedGeneric");
      setGenerateStatus(message, true);
      if (activeComputation && activeComputation.type === "generator") {
        hideComputationDialog();
      }
    };

    return generatorWorker;
  }

  function runRandomGenerator() {
    if (generatorIsRunning || isComputationDialogOpen()) {
      return;
    }

    const params = buildGeneratorParamsFromUi();
    params.layoutMode = state.settings.layoutMode;
    const worker = ensureGeneratorWorker();
    if (!worker) {
      const message = t("app.generator.workerRequired");
      setGenerateStatus(message, true);
      setAnalysisMessage([
        {
          key: "Generator",
          status: "WARN",
          message
        }
      ]);
      return;
    }

    generatorJobSequence += 1;
    activeGeneratorJobId = generatorJobSequence;
    setGeneratorRunning(true);
    setGenerateStatus(t("app.generator.started"), false);
    showComputationDialog(
      "generator",
      t("app.generator.dialogTitle"),
      t("app.generator.progress"),
      true
    );
    postLocalizedWorkerMessage(worker, {
      type: "generate",
      jobId: activeGeneratorJobId,
      params
    });
  }

  function runTimeLimitedSearch() {
    if (generatorIsRunning || isComputationDialogOpen()) {
      return;
    }

    var minP = parseInt(String(genSearchMinPlaces ? genSearchMinPlaces.value : 3), 10) || 3;
    var maxP = parseInt(String(genSearchMaxPlaces ? genSearchMaxPlaces.value : 20), 10) || 20;
    var minT = parseInt(String(genSearchMinTransitions ? genSearchMinTransitions.value : 3), 10) || 3;
    var maxT = parseInt(String(genSearchMaxTransitions ? genSearchMaxTransitions.value : 20), 10) || 20;
    var timeSec = parseInt(String(genSearchTimeLimit ? genSearchTimeLimit.value : 30), 10) || 30;

    if (minP > maxP) { var tmp = minP; minP = maxP; maxP = tmp; }
    if (minT > maxT) { var tmp2 = minT; minT = maxT; maxT = tmp2; }

    var searchParams = {
      minPlaces: minP,
      maxPlaces: maxP,
      minTransitions: minT,
      maxTransitions: maxT,
      timeLimitMs: timeSec * 1000,
      netType: genNetTypeSelect ? String(genNetTypeSelect.value || "any") : "any",
      method: sanitizeGenerationMethod(genMethodSelect ? String(genMethodSelect.value || "adaptive") : "adaptive"),
      liveOption: genLiveOptionSelect ? String(genLiveOptionSelect.value || "any") : "any",
      safeOption: genSafeOptionSelect ? String(genSafeOptionSelect.value || "any") : "any",
      redundantCount: parseInt(String(genRedundantCountInput ? genRedundantCountInput.value : 0), 10) || 0,
      layoutMode: state.settings.layoutMode
    };

    var worker = ensureGeneratorWorker();
    if (!worker) {
      setGenerateStatus(t("app.generator.searchWorkerRequired"), true);
      return;
    }

    generatorJobSequence += 1;
    activeGeneratorJobId = generatorJobSequence;
    setGeneratorRunning(true);
    setGenerateStatus(t("app.generator.searchStarted", {
      seconds: timeSec,
      minPlaces: minP,
      maxPlaces: maxP,
      minTransitions: minT,
      maxTransitions: maxT
    }), false);
    showComputationDialog(
      "generator",
      t("gen.searchTitle"),
      t("gen.searchMessage"),
      true
    );
    postLocalizedWorkerMessage(worker, {
      type: "search",
      jobId: activeGeneratorJobId,
      params: searchParams
    });
  }

  function normalizePinvariantMode(value) {
    const mode = String(value || "cover-stop");
    return mode === "full" ? "full" : "cover-stop";
  }

  function normalizePinvariantAccelerationMode(value) {
    return String(value || "").toLowerCase() === "webgpu" ? "webgpu" : "cpu";
  }

  function getPinvariantAccelerationLabel(value) {
    return normalizePinvariantAccelerationMode(value) === "webgpu" ? "WebGPU" : "CPU";
  }

  async function canUseWebGpuAcceleration() {
    if (!window.isSecureContext || !navigator.gpu || typeof navigator.gpu.requestAdapter !== "function") {
      return false;
    }
    try {
      const adapter = await navigator.gpu.requestAdapter();
      return Boolean(adapter);
    } catch (error) {
      return false;
    }
  }

  async function askPinvariantAccelerationMode() {
    const webGpuReady = await canUseWebGpuAcceleration();
    if (webGpuReady) {
      const useGpu = window.confirm(
        t("app.pinvariant.webgpuAvailable")
      );
      return useGpu ? "webgpu" : "cpu";
    }
    const proceedCpu = window.confirm(
      t("app.pinvariant.webgpuUnavailable")
    );
    return proceedCpu ? "cpu" : "cancel";
  }

  function ensurePinvariantWorker() {
    if (pinvariantWorker) {
      return pinvariantWorker;
    }
    if (!("Worker" in window)) {
      return null;
    }

    const workerUrl = `public/pinvariant-worker.js?v=${Date.now()}`;
    pinvariantWorker = new Worker(workerUrl);
    pinvariantWorker.onmessage = (event) => {
      const payload = event.data || {};
      const jobId = Number(payload.jobId || 0);
      if (!jobId || jobId !== activePinvariantJobId) {
        return;
      }

      if (payload.type === "progress") {
        const message = payload.message
          ? String(payload.message)
          : t("app.pinvariant.stage", { stage: payload.stage || 0, total: payload.total || 0 });
        setPinvariantStatus(t("app.pinvariant.progress", { message }), false);
        if (activeComputation && activeComputation.type === "pinvariant") {
          updateComputationDialog(`Martinez-Silva: ${message}`);
        }
        return;
      }

      if (payload.type === "error") {
        setPinvariantRunning(false);
        lastPinvariantResult = null;
        lastSelectionHypergraphResult = null;
        pendingSelectionHypergraphResult = null;
        lastSfcResult = null;
        const message = payload.message
          ? String(payload.message)
          : t("app.pinvariant.failed");
        setPinvariantStatus(message, true);
        setPinvariantOutput("");
        setPinvariantMatrixOutput("");
        setSelectionHypergraphStatus(t("app.pinvariant.selectionWaitingValid"), true);
        setSelectionHypergraphOutput("");
        setSfcStatus(t("app.pinvariant.sfcMissing"), true);
        setSfcOutput("");
        setSfcValidationOutput("");
        setSfcMaxPlusOutput("");
        setSfcRunning(false);
        clearFuzzyResult();
        refreshDecompositionView();
        if (activeComputation && activeComputation.type === "pinvariant") {
          hideComputationDialog();
        }
        return;
      }

      if (payload.type === "result") {
        setPinvariantRunning(false);
        const result = payload.payload || {};
        lastPinvariantResult = result;
        lastSelectionHypergraphResult = null;
        pendingSelectionHypergraphResult = null;
        lastSfcResult = null;
        setPinvariantStatus(t("app.pinvariant.complete"), false);
        setPinvariantOutput(formatPinvariantOutput(result));
        setPinvariantMatrixOutput(formatPinvariantMatrixBlock(result));
        setSelectionHypergraphStatus(t("app.pinvariant.selectionReady"), false);
        setSelectionHypergraphOutput("");
        setSfcStatus(t("app.pinvariant.sfcStale"), true);
        setSfcOutput("");
        setSfcValidationOutput("");
        setSfcMaxPlusOutput("");
        setSfcRunning(false);
        clearFuzzyResult();
        refreshDecompositionView();
        setAnalysisMessage(buildPinvariantAnalysisRows(result), t("status.pinvOutputNone"));
        if (activeComputation && activeComputation.type === "pinvariant") {
          hideComputationDialog();
        }
      }
    };

    pinvariantWorker.onerror = (event) => {
      setPinvariantRunning(false);
      lastPinvariantResult = null;
      lastSelectionHypergraphResult = null;
      pendingSelectionHypergraphResult = null;
      lastSfcResult = null;
      const message = event && event.message
        ? t("app.worker.pinvariantFailed", { message: event.message })
        : t("app.worker.pinvariantFailedGeneric");
      setPinvariantStatus(message, true);
      setPinvariantOutput("");
      setPinvariantMatrixOutput("");
      setSelectionHypergraphStatus(t("app.pinvariant.selectionWaitingValid"), true);
      setSelectionHypergraphOutput("");
      setSfcStatus(t("app.pinvariant.sfcMissing"), true);
      setSfcOutput("");
      setSfcValidationOutput("");
      setSfcMaxPlusOutput("");
      setSfcRunning(false);
      clearFuzzyResult();
      refreshDecompositionView();
      if (activeComputation && activeComputation.type === "pinvariant") {
        hideComputationDialog();
      }
    };

    return pinvariantWorker;
  }

  async function runPinvariantComputation() {
    if (pinvariantIsRunning || isComputationDialogOpen()) {
      return;
    }
    const snapshot = collectPinvariantNetSnapshot();
    const placeCount = snapshot.nodes.filter((node) => node.type === "place").length;
    const transitionCount = snapshot.nodes.filter((node) => node.type === "transition").length;
    if (placeCount === 0 || transitionCount === 0) {
      lastPinvariantResult = null;
      lastSelectionHypergraphResult = null;
      pendingSelectionHypergraphResult = null;
      lastSfcResult = null;
      setPinvariantStatus(t("app.pinvariant.modelRequired"), true);
      setPinvariantOutput("");
      setPinvariantMatrixOutput("");
      setSelectionHypergraphStatus(t("app.pinvariant.selectionWaitingValid"), true);
      setSelectionHypergraphOutput("");
      setSfcStatus(t("app.pinvariant.sfcMissing"), true);
      setSfcOutput("");
      setSfcValidationOutput("");
      setSfcMaxPlusOutput("");
      setSfcRunning(false);
      clearFuzzyResult();
      return;
    }

    cancelXtrecComputation();
    lastSelectionHypergraphResult = null;
    pendingSelectionHypergraphResult = null;
    lastSfcResult = null;
    setSfcStatus(t("app.pinvariant.sfcStaleGeneric"), true);
    setSfcOutput("");
    setSfcValidationOutput("");
    setSfcMaxPlusOutput("");
    setSfcRunning(false);
    clearFuzzyResult();

    const worker = ensurePinvariantWorker();
    if (!worker) {
      lastPinvariantResult = null;
      lastSelectionHypergraphResult = null;
      pendingSelectionHypergraphResult = null;
      lastSfcResult = null;
      setPinvariantStatus(t("app.pinvariant.workerUnsupported"), true);
      setPinvariantOutput("");
      setPinvariantMatrixOutput("");
      setSelectionHypergraphStatus(t("app.pinvariant.selectionWaitingValid"), true);
      setSelectionHypergraphOutput("");
      setSfcStatus(t("app.pinvariant.sfcMissing"), true);
      setSfcOutput("");
      setSfcValidationOutput("");
      setSfcMaxPlusOutput("");
      setSfcRunning(false);
      clearFuzzyResult();
      return;
    }

    const accelerationMode = await askPinvariantAccelerationMode();
    if (accelerationMode === "cancel") {
      setPinvariantStatus(t("app.pinvariant.startCancelled"), false);
      return;
    }
    const accelerationLabel = accelerationMode === "webgpu" ? "WebGPU (GPU)" : "CPU";

    pinvariantJobSequence += 1;
    activePinvariantJobId = pinvariantJobSequence;
    const mode = normalizePinvariantMode(pinvModeSelect ? pinvModeSelect.value : "cover-stop");
    lastPinvariantResult = null;
    lastSelectionHypergraphResult = null;
    pendingSelectionHypergraphResult = null;
    lastSfcResult = null;
    setPinvariantRunning(true);
    setPinvariantStatus(t("app.pinvariant.started", { acceleration: accelerationLabel }), false);
    setPinvariantOutput(t("app.pinvariant.inProgress"));
    setPinvariantMatrixOutput(t("app.pinvariant.inProgress"));
    setSelectionHypergraphStatus(t("app.pinvariant.selectionWaiting"), false);
    setSelectionHypergraphOutput("");
    setSfcStatus(t("app.pinvariant.sfcStaleGeneric"), true);
    setSfcOutput("");
    setSfcValidationOutput("");
    setSfcMaxPlusOutput("");
    setSfcRunning(false);
    clearFuzzyResult();
    showComputationDialog(
      "pinvariant",
      t("app.pinvariant.dialogTitle"),
      t("app.pinvariant.dialogProgress", { acceleration: accelerationLabel }),
      true
    );
    postLocalizedWorkerMessage(worker, {
      type: "compute",
      jobId: activePinvariantJobId,
      payload: {
        mode,
        acceleration: accelerationMode,
        nodes: snapshot.nodes,
        arcs: snapshot.arcs
      }
    });
  }

  function loadFromJsonFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        applyState(JSON.parse(String(reader.result || "")));
        setActiveWorkspaceTab("canvas");
      } catch (error) {
        alert(t("app.pnh.jsonLoadFailed"));
      }
    };
    reader.readAsText(file);
  }

  function loadFromPnhFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const modeName = layoutModeSelect.value || state.settings.layoutMode;
        const parsed = parsePnhText(String(reader.result || ""), modeName);
        applyState(parsed);
        setActiveWorkspaceTab("canvas");
      } catch (error) {
        const message = error instanceof Error ? error.message : t("app.pnh.importUnknownError");
        alert(t("app.pnh.loadFailed", { message }));
      }
    };
    reader.readAsText(file);
  }

  function stopAutoSimulation() {
    if (autoTimer) {
      window.clearInterval(autoTimer);
      autoTimer = null;
    }
    updateAutoSimulationLabels();
  }

  function toggleAutoSimulation() {
    if (autoTimer) {
      stopAutoSimulation();
      return;
    }

    autoTimer = window.setInterval(() => {
      const enabled = getEnabledTransitions();
      if (enabled.length === 0) {
        stopAutoSimulation();
        return;
      }
      const choice = enabled[Math.floor(Math.random() * enabled.length)];
      fireTransition(choice.id);
    }, 800);
    updateAutoSimulationLabels();
  }

  // ── Lens (magnifying glass) system ──
  var LENS_ZOOM_LEVELS = [1.5, 2, 3, 4, 6];
  var LENS_DEFAULT_INDEX = 1; // 2x
  var LENS_RADIUS = 100; // half of 200 viewBox
  var LENS_SIZE = 180; // CSS px

  function setupLens(config) {
    var sourceSvg = config.sourceSvg;
    var lensEl = config.lensEl;
    var lensContent = config.lensContent;
    var toggleBtn = config.toggleBtn;
    var wrapEl = config.wrapEl;
    var getViewTransform = config.getViewTransform;

    if (!sourceSvg || !lensEl || !lensContent || !toggleBtn || !wrapEl) return;

    var lensActive = false;
    var lensZoomIndex = LENS_DEFAULT_INDEX;

    function currentZoom() { return LENS_ZOOM_LEVELS[lensZoomIndex]; }

    // Add zoom badge
    var badge = document.createElement("span");
    badge.className = "canvas-lens-badge";
    badge.textContent = currentZoom() + "x";
    toggleBtn.appendChild(badge);

    function updateBadge() {
      badge.textContent = currentZoom() + "x";
    }

    toggleBtn.addEventListener("click", function(event) {
      if (event.shiftKey || event.ctrlKey || event.metaKey) {
        // Shift/Ctrl+click cycles zoom level without toggling
        lensZoomIndex = (lensZoomIndex + 1) % LENS_ZOOM_LEVELS.length;
        updateBadge();
        return;
      }
      lensActive = !lensActive;
      toggleBtn.classList.toggle("active", lensActive);
      if (!lensActive) lensEl.classList.add("hidden");
    });

    // Right-click on toggle → cycle zoom
    toggleBtn.addEventListener("contextmenu", function(event) {
      event.preventDefault();
      lensZoomIndex = (lensZoomIndex + 1) % LENS_ZOOM_LEVELS.length;
      updateBadge();
    });

    // Scroll on lens element area changes zoom level
    lensEl.style.pointerEvents = "none"; // lens itself doesn't capture
    // We intercept scroll on wrapEl when lens is active + Alt held
    wrapEl.addEventListener("wheel", function(event) {
      if (!lensActive || !event.altKey) return;
      event.preventDefault();
      if (event.deltaY < 0) {
        lensZoomIndex = Math.min(lensZoomIndex + 1, LENS_ZOOM_LEVELS.length - 1);
      } else {
        lensZoomIndex = Math.max(lensZoomIndex - 1, 0);
      }
      updateBadge();
      updateLens(event.clientX, event.clientY);
    }, { passive: false });

    function updateLens(clientX, clientY) {
      if (!lensActive) return;
      var z = currentZoom();

      var wrapRect = wrapEl.getBoundingClientRect();
      var relX = clientX - wrapRect.left;
      var relY = clientY - wrapRect.top;

      lensEl.style.left = (relX - LENS_SIZE / 2) + "px";
      lensEl.style.top = (relY - LENS_SIZE / 2) + "px";
      lensEl.classList.remove("hidden");

      var pt = sourceSvg.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      var ctm = sourceSvg.getScreenCTM();
      if (!ctm) return;
      var svgPt = pt.matrixTransform(ctm.inverse());

      var vt = getViewTransform();
      var worldX = (svgPt.x - vt.panX) / vt.zoom;
      var worldY = (svgPt.y - vt.panY) / vt.zoom;

      var sourceGroup = sourceSvg.querySelector("g[id$='viewport'], g[id$='-viewport']")
        || sourceSvg.querySelector("g");

      if (sourceGroup) {
        var tx = LENS_RADIUS - worldX * z;
        var ty = LENS_RADIUS - worldY * z;
        lensContent.innerHTML = sourceGroup.innerHTML;
        lensContent.setAttribute("transform", "translate(" + tx + " " + ty + ") scale(" + z + ")");
      }
    }

    wrapEl.addEventListener("mousemove", function(event) {
      if (lensActive) updateLens(event.clientX, event.clientY);
    });

    wrapEl.addEventListener("mouseleave", function() {
      lensEl.classList.add("hidden");
    });

    wrapEl.addEventListener("mouseenter", function(event) {
      if (lensActive) updateLens(event.clientX, event.clientY);
    });

    // Alt key toggle
    window.addEventListener("keydown", function(event) {
      if (event.key === "Alt" && wrapEl.matches(":hover")) {
        lensActive = true;
        toggleBtn.classList.add("active");
      }
    });
    window.addEventListener("keyup", function(event) {
      if (event.key === "Alt") {
        lensActive = false;
        toggleBtn.classList.remove("active");
        lensEl.classList.add("hidden");
      }
    });
  }

  function wireEvents() {
    if (sidebarTabButtons.length > 0) {
      sidebarTabButtons.forEach((button) => {
        button.addEventListener("click", () => {
          setActiveSidebarTab(button.dataset.sidebarTab || "");
        });
      });
    }

    if (workspaceTabCanvas) {
      workspaceTabCanvas.addEventListener("click", () => {
        setActiveWorkspaceTab("canvas");
      });
    }
    if (workspaceTabHypergraph) {
      workspaceTabHypergraph.addEventListener("click", () => {
        setActiveWorkspaceTab("hypergraph");
      });
    }
    if (workspaceTabTools) {
      workspaceTabTools.addEventListener("click", () => {
        setActiveWorkspaceTab("tools");
      });
    }
    if (workspaceTabDecomposition) {
      workspaceTabDecomposition.addEventListener("click", () => {
        setActiveWorkspaceTab("decomposition");
      });
    }
    if (workspaceTabBenchmark) {
      workspaceTabBenchmark.addEventListener("click", () => {
        setActiveWorkspaceTab("benchmark");
      });
    }

    if (hypergraphOpenEditorBtn) {
      hypergraphOpenEditorBtn.addEventListener("click", () => {
        setActiveWorkspaceTab("hypergraph");
      });
    }
    if (hypergraphResultsToggleBtn) {
      hypergraphResultsToggleBtn.addEventListener("click", () => {
        setHypergraphResultsVisible(!hypergraphResultsVisible, true);
      });
    }
    hypergraphModeButtons.forEach((button) => {
      button.addEventListener("click", () => {
        setHypergraphEditorMode(button.dataset.hypergraphMode || "select");
      });
    });
    if (hypergraphFinishEdgeBtn) {
      hypergraphFinishEdgeBtn.addEventListener("click", createHypergraphEdgeFromPending);
    }
    if (hypergraphDeleteBtn) {
      hypergraphDeleteBtn.addEventListener("click", deleteSelectedHypergraphElement);
    }
    if (hypergraphClearBtn) {
      hypergraphClearBtn.addEventListener("click", clearHypergraphEditor);
    }
    if (hypergraphFraBtn) {
      hypergraphFraBtn.addEventListener("click", runHypergraphFraReduction);
    }
    if (hypergraphToggleReducedBtn) {
      hypergraphToggleReducedBtn.addEventListener("click", toggleReducedHypergraphView);
    }
    if (hypergraphTransversalBtn) {
      hypergraphTransversalBtn.addEventListener("click", () => runHypergraphTransversal("regular"));
    }
    if (hypergraphExactTransversalBtn) {
      hypergraphExactTransversalBtn.addEventListener("click", () => runHypergraphTransversal("exact"));
    }
    if (hypergraphAllTransversalsBtn) {
      hypergraphAllTransversalsBtn.addEventListener("click", () => runHypergraphTransversal("all"));
    }
    if (hypergraphAnalysisInfoBtn) {
      hypergraphAnalysisInfoBtn.addEventListener("click", () => {
        setHypergraphAnalysisInfoVisible(!hypergraphAnalysisInfoVisible);
      });
    }
    if (hypergraphStructureBtn) {
      hypergraphStructureBtn.addEventListener("click", runHypergraphStructureAnalysis);
    }
    if (hypergraphCExactBtn) {
      hypergraphCExactBtn.addEventListener("click", runHypergraphCExactSpectrum);
    }
    if (hypergraphStructuralXtBtn) {
      hypergraphStructuralXtBtn.addEventListener("click", () => {
        runHypergraphStructuralXtAnalysis({ requestXtrec: false });
      });
    }
    if (hypergraphRExactBtn) {
      hypergraphRExactBtn.addEventListener("click", runHypergraphRExactAnalysis);
    }
    if (hypergraphRExactInput) {
      hypergraphRExactInput.addEventListener("input", () => {
        const normalized = getHypergraphRExactThreshold();
        if (String(hypergraphRExactInput.value || "") !== String(normalized)) {
          hypergraphRExactInput.value = String(normalized);
        }
      });
    }
    if (hypergraphTransversalSelect) {
      hypergraphTransversalSelect.addEventListener("change", () => {
        applyHypergraphTransversalSelection(Number(hypergraphTransversalSelect.value || 0), true);
      });
    }
    if (hypergraphClearTransversalBtn) {
      hypergraphClearTransversalBtn.addEventListener("click", () => {
        clearHypergraphTransversalView(true);
        setHypergraphEditorStatus(t("app.hypergraph.highlightHidden"), false);
      });
    }
    if (hypergraphXtrecBtn) {
      hypergraphXtrecBtn.addEventListener("click", () => {
        runHypergraphXtrec().catch((error) => {
          const message = error instanceof Error ? error.message : t("app.hypergraph.xtrecRunFailed");
          setHypergraphEditorStatus(message, true);
          if (activeComputation && activeComputation.type === "hypergraph-xtrec") {
            hideComputationDialog();
          }
        });
      });
    }
    if (hypergraphZoomOutBtn) {
      hypergraphZoomOutBtn.addEventListener("click", () => hypergraphZoomAt(1 / ZOOM_STEP, HYPERGRAPH_CANVAS_W / 2, HYPERGRAPH_CANVAS_H / 2));
    }
    if (hypergraphZoomInBtn) {
      hypergraphZoomInBtn.addEventListener("click", () => hypergraphZoomAt(ZOOM_STEP, HYPERGRAPH_CANVAS_W / 2, HYPERGRAPH_CANVAS_H / 2));
    }
    if (hypergraphZoomResetBtn) {
      hypergraphZoomResetBtn.addEventListener("click", hypergraphCenter);
    }
    if (hypergraphPanLeftBtn) hypergraphPanLeftBtn.addEventListener("click", () => hypergraphPanBy(70, 0));
    if (hypergraphPanRightBtn) hypergraphPanRightBtn.addEventListener("click", () => hypergraphPanBy(-70, 0));
    if (hypergraphPanUpBtn) hypergraphPanUpBtn.addEventListener("click", () => hypergraphPanBy(0, 70));
    if (hypergraphPanDownBtn) hypergraphPanDownBtn.addEventListener("click", () => hypergraphPanBy(0, -70));
    if (hypergraphCenterBtn) hypergraphCenterBtn.addEventListener("click", hypergraphCenter);

    if (hypergraphCanvas) {
      hypergraphCanvas.addEventListener("mousedown", (event) => {
        const vertexId = getHypergraphVertexIdFromEvent(event);
        const edgeId = getHypergraphEdgeIdFromEvent(event);
        const isBackground = event.target === hypergraphCanvas
          || (event.target instanceof SVGElement && event.target.classList.contains("canvas-bg"));
        if (event.button === 1 || event.button === 2 || (event.button === 0 && isBackground && hypergraphEditorMode === "select")) {
          event.preventDefault();
          const pt = toHypergraphSvgPoint(event);
          hypergraphPanInfo = {
            startX: pt.x,
            startY: pt.y,
            originPanX: hypergraphState.view.panX,
            originPanY: hypergraphState.view.panY
          };
          hypergraphCanvas.classList.add("is-panning");
          return;
        }
        if (event.button === 0 && hypergraphEditorMode === "select" && vertexId && !hypergraphShowReduced) {
          event.preventDefault();
          const vertex = hypergraphState.vertices.find((item) => item.id === vertexId);
          const cp = toHypergraphCanvasPoint(event);
          if (vertex) {
            hypergraphDragInfo = {
              vertexId,
              dx: vertex.x - cp.x,
              dy: vertex.y - cp.y,
              moved: false
            };
            clearHypergraphSelection();
            hypergraphSelectedVertexId = vertexId;
            renderHypergraphEditor();
          }
          return;
        }
        if (event.button === 0 && hypergraphEditorMode === "select" && edgeId && !hypergraphShowReduced) {
          clearHypergraphSelection();
          hypergraphSelectedEdgeId = edgeId;
          renderHypergraphEditor();
        }
      });

      hypergraphCanvas.addEventListener("click", (event) => {
        if (hypergraphSuppressClick) {
          hypergraphSuppressClick = false;
          return;
        }
        const vertexId = getHypergraphVertexIdFromEvent(event);
        const edgeId = getHypergraphEdgeIdFromEvent(event);
        if (hypergraphShowReduced) {
          return;
        }
        if (hypergraphEditorMode === "vertex") {
          if (!vertexId && !edgeId) {
            const pt = toHypergraphCanvasPoint(event);
            createHypergraphVertex(pt.x, pt.y);
          }
          return;
        }
        if (hypergraphEditorMode === "edge") {
          if (!vertexId) {
            return;
          }
          if (hypergraphPendingEdgeVertexIds.has(vertexId)) {
            hypergraphPendingEdgeVertexIds.delete(vertexId);
          } else {
            hypergraphPendingEdgeVertexIds.add(vertexId);
          }
          setHypergraphEditorStatus(t("app.hypergraph.edgePendingCount", {
            count: formatInteger(hypergraphPendingEdgeVertexIds.size)
          }), false);
          renderHypergraphEditor();
          return;
        }
        if (vertexId) {
          clearHypergraphSelection();
          hypergraphSelectedVertexId = vertexId;
        } else if (edgeId) {
          clearHypergraphSelection();
          hypergraphSelectedEdgeId = edgeId;
        } else {
          clearHypergraphSelection();
        }
        renderHypergraphEditor();
      });

      hypergraphCanvas.addEventListener("dblclick", (event) => {
        const vertexId = getHypergraphVertexIdFromEvent(event);
        const edgeId = getHypergraphEdgeIdFromEvent(event);
        if (vertexId) {
          renameHypergraphVertex(vertexId);
        } else if (edgeId) {
          renameHypergraphEdge(edgeId);
        }
      });

      hypergraphCanvas.addEventListener("wheel", (event) => {
        event.preventDefault();
        const pt = toHypergraphSvgPoint(event);
        hypergraphZoomAt(event.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP, pt.x, pt.y);
      }, { passive: false });

      hypergraphCanvas.addEventListener("contextmenu", (event) => {
        event.preventDefault();
      });
    }

    window.addEventListener("mousemove", (event) => {
      if (hypergraphPanInfo) {
        const pt = toHypergraphSvgPoint(event);
        const dx = pt.x - hypergraphPanInfo.startX;
        const dy = pt.y - hypergraphPanInfo.startY;
        setHypergraphView(
          hypergraphState.view.zoom,
          hypergraphPanInfo.originPanX + dx,
          hypergraphPanInfo.originPanY + dy
        );
        return;
      }
      if (hypergraphDragInfo && !hypergraphShowReduced) {
        const cp = toHypergraphCanvasPoint(event);
        const vertex = hypergraphState.vertices.find((item) => item.id === hypergraphDragInfo.vertexId);
        if (vertex) {
          vertex.x = cp.x + hypergraphDragInfo.dx;
          vertex.y = cp.y + hypergraphDragInfo.dy;
          hypergraphDragInfo.moved = true;
          renderHypergraphEditor();
        }
      }
    });

    window.addEventListener("mouseup", () => {
      if (hypergraphPanInfo) {
        hypergraphPanInfo = null;
        if (hypergraphCanvas) {
          hypergraphCanvas.classList.remove("is-panning");
        }
      }
      if (hypergraphDragInfo) {
        hypergraphSuppressClick = Boolean(hypergraphDragInfo.moved);
        hypergraphDragInfo = null;
        persistHypergraphEditorState();
      }
    });

    if (decompositionViewModeSelect) {
      decompositionViewModeSelect.addEventListener("change", () => {
        syncDecompositionSubnetOptions();
        refreshDecompositionView();
      });
    }
    if (decompositionSubnetSelect) {
      decompositionSubnetSelect.addEventListener("change", () => {
        decompositionSelectionLabel = decompositionSubnetSelect.value || "";
        refreshDecompositionView();
      });
    }
    if (decompositionLayoutModeSelect) {
      decompositionLayoutModeSelect.addEventListener("change", () => {
        refreshDecompositionView();
      });
    }

    // Decomposition canvas: pan (any-button drag on empty bg), zoom (wheel), node drag (LMB on node)
    if (decompositionCanvas) {
      decompositionCanvas.addEventListener("mousedown", function(event) {
        var target = event.target;
        var isBackground = target === decompositionCanvas
          || (target instanceof SVGElement && target.classList && target.classList.contains("canvas-bg"));

        if (event.button === 1 || event.button === 2 || (event.button === 0 && event.shiftKey)) {
          // Force-pan drag (MMB / RMB / Shift+LMB) — anywhere
          event.preventDefault();
          var pt = toDecompSvgPoint(event);
          decompPanInfo = { startX: pt.x, startY: pt.y, originPanX: decompView.panX, originPanY: decompView.panY };
          decompositionCanvas.classList.add("is-panning");
          return;
        }
        if (event.button === 0) {
          // LMB on empty canvas background pans the view (parity with main canvas)
          if (isBackground) {
            event.preventDefault();
            var ptBg = toDecompSvgPoint(event);
            decompPanInfo = { startX: ptBg.x, startY: ptBg.y, originPanX: decompView.panX, originPanY: decompView.panY };
            decompositionCanvas.classList.add("is-panning");
            return;
          }
          // Otherwise — node drag (find closest node within tolerance)
          var cp = toDecompCanvasPoint(event);
          var closestNode = null;
          var closestDist = 40;
          if (lastDecompGraphNodes) {
            lastDecompGraphNodes.forEach(function(n) {
              var dx = cp.x - n.x;
              var dy = cp.y - n.y;
              var dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < closestDist) {
                closestDist = dist;
                closestNode = n;
              }
            });
          }
          if (closestNode) {
            event.preventDefault();
            decompDragInfo = { nodeId: closestNode.id, dx: closestNode.x - cp.x, dy: closestNode.y - cp.y };
          }
        }
      });

      window.addEventListener("mousemove", function(event) {
        if (decompPanInfo) {
          var pt = toDecompSvgPoint(event);
          var dx = pt.x - decompPanInfo.startX;
          var dy = pt.y - decompPanInfo.startY;
          setDecompView(decompView.zoom, decompPanInfo.originPanX + dx, decompPanInfo.originPanY + dy);
          return;
        }
        if (decompDragInfo && lastDecompGraphNodes) {
          var cp = toDecompCanvasPoint(event);
          var node = lastDecompGraphNodes.find(function(n) { return n.id === decompDragInfo.nodeId; });
          if (node) {
            node.x = cp.x + decompDragInfo.dx;
            node.y = cp.y + decompDragInfo.dy;
            drawDecompositionGraph(lastDecompGraph);
          }
        }
      });

      window.addEventListener("mouseup", function() {
        if (decompPanInfo) {
          decompPanInfo = null;
          decompositionCanvas.classList.remove("is-panning");
        }
        decompDragInfo = null;
      });

      decompositionCanvas.addEventListener("wheel", function(event) {
        event.preventDefault();
        var pt = toDecompSvgPoint(event);
        var factor = event.deltaY < 0 ? 1.15 : 1 / 1.15;
        decompZoomAt(factor, pt.x, pt.y);
      }, { passive: false });

      decompositionCanvas.addEventListener("contextmenu", function(event) {
        event.preventDefault();
      });
    }

    // Help overlay toggles
    document.querySelectorAll(".canvas-help-toggle").forEach(function(btn) {
      btn.addEventListener("click", function() {
        var overlay = btn.nextElementSibling;
        if (overlay && overlay.classList.contains("canvas-help-overlay")) {
          overlay.classList.toggle("hidden");
        }
      });
    });

    // Close help overlays on click outside
    document.addEventListener("click", function(event) {
      document.querySelectorAll(".canvas-help-overlay:not(.hidden)").forEach(function(overlay) {
        var toggle = overlay.previousElementSibling;
        if (!overlay.contains(event.target) && event.target !== toggle) {
          overlay.classList.add("hidden");
        }
      });
    });

    // Setup lenses
    setupLens({
      sourceSvg: svg,
      lensEl: document.getElementById("canvas-lens"),
      lensContent: document.getElementById("canvas-lens-content"),
      toggleBtn: document.getElementById("canvas-lens-toggle"),
      wrapEl: svg ? svg.closest(".canvas-wrap") : null,
      getViewTransform: function() { return { zoom: state.view.zoom, panX: state.view.panX, panY: state.view.panY }; }
    });

    setupLens({
      sourceSvg: decompositionCanvas,
      lensEl: document.getElementById("decomp-lens"),
      lensContent: document.getElementById("decomp-lens-content"),
      toggleBtn: document.getElementById("decomp-lens-toggle"),
      wrapEl: decompositionCanvas ? decompositionCanvas.closest(".canvas-wrap") : null,
      getViewTransform: function() { return { zoom: decompView.zoom, panX: decompView.panX, panY: decompView.panY }; }
    });

    modeButtons.forEach((button) => {
      button.addEventListener("click", () => setMode(button.dataset.mode));
    });

    svg.addEventListener("mousedown", (event) => {
      if (!shouldStartPanDrag(event)) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      startPanDrag(event);
    }, true);

    svg.addEventListener("wheel", (event) => {
      event.preventDefault();
      const factor = event.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP;
      zoomAt(factor, toSvgPoint(event));
    }, { passive: false });

    svg.addEventListener("contextmenu", (event) => {
      if (!blockNextContextMenu) {
        return;
      }
      blockNextContextMenu = false;
      event.preventDefault();
    });

    svg.addEventListener("click", (event) => {
      if (suppressCanvasClick) {
        suppressCanvasClick = false;
        return;
      }
      if (mode !== "place" && mode !== "transition") {
        if (mode === "select") {
          clearSelection();
          render();
        }
        return;
      }
      createNode(mode, clampToCanvas(toCanvasPoint(event)));
      render();
    });

    window.addEventListener("mousemove", (event) => {
      if (panInfo) {
        const point = toSvgPoint(event);
        const nextPanX = panInfo.originPanX + (point.x - panInfo.startX);
        const nextPanY = panInfo.originPanY + (point.y - panInfo.startY);
        if (Math.hypot(point.x - panInfo.startX, point.y - panInfo.startY) > 2) {
          panInfo.moved = true;
        }
        setView(state.view.zoom, nextPanX, nextPanY);
        return;
      }

      if (arcPointDragInfo && mode === "select") {
        const arc = getArc(arcPointDragInfo.arcId);
        if (!arc) {
          arcPointDragInfo = null;
          clearSelectedArcPoint();
          return;
        }
        const points = ensureArcPointsArray(arc);
        if (arcPointDragInfo.index < 0 || arcPointDragInfo.index >= points.length) {
          arcPointDragInfo = null;
          clearSelectedArcPoint();
          return;
        }
        const movedPoint = clampArcPoint(toCanvasPoint(event));
        points[arcPointDragInfo.index] = movedPoint;
        setSelectedArcPoint(arc.id, arcPointDragInfo.index);
        render();
        return;
      }

      if (multiDragInfo && mode === "select") {
        const mpt = toCanvasPoint(event);
        const deltaX = mpt.x - multiDragInfo.startX;
        const deltaY = mpt.y - multiDragInfo.startY;
        multiDragInfo.origins.forEach(function(origin) {
          const n = getNode(origin.id);
          if (n) {
            const cl = clampToCanvas({
              x: origin.x + deltaX,
              y: origin.y + deltaY
            });
            n.x = cl.x;
            n.y = cl.y;
          }
        });
        render();
        return;
      }

      if (!dragInfo || mode !== "select") {
        return;
      }
      const node = getNode(dragInfo.nodeId);
      if (!node) {
        return;
      }
      const point = toCanvasPoint(event);
      const clamped = clampToCanvas({
        x: point.x + dragInfo.dx,
        y: point.y + dragInfo.dy
      });
      node.x = clamped.x;
      node.y = clamped.y;
      render();
    });

    window.addEventListener("mouseup", () => {
      stopPanDrag();
      dragInfo = null;
      multiDragInfo = null;
      arcPointDragInfo = null;
    });

    nodeLabelInput.addEventListener("input", () => {
      if (selected.kind !== "node") {
        return;
      }
      const node = getNode(selected.id);
      if (!node) {
        return;
      }
      node.label = nodeLabelInput.value.trim() || node.id;
      render();
    });

    nodeTokensInput.addEventListener("input", () => {
      if (selected.kind !== "node") {
        return;
      }
      const node = getNode(selected.id);
      if (!node || node.type !== "place") {
        return;
      }
      node.tokens = Math.max(0, parseInt(nodeTokensInput.value || "0", 10) || 0);
      render();
    });

    arcWeightInput.addEventListener("input", () => {
      if (selected.kind !== "arc") {
        return;
      }
      const arc = getArc(selected.id);
      if (!arc) {
        return;
      }
      arc.weight = Math.max(1, parseInt(arcWeightInput.value || "1", 10) || 1);
      render();
    });

    if (arcClearBendsBtn) {
      arcClearBendsBtn.addEventListener("click", () => {
        if (selected.kind !== "arc") {
          return;
        }
        const arc = getArc(selected.id);
        if (!arc) {
          return;
        }
        arc.points = [];
        clearSelectedArcPoint();
        arcPointDragInfo = null;
        render();
      });
    }

    rotate45Btn.addEventListener("click", () => rotateSelectedTransition(45));
    rotate90Btn.addEventListener("click", () => rotateSelectedTransition(90));
    rotateResetBtn.addEventListener("click", () => {
      if (selected.kind !== "node") {
        return;
      }
      const node = getNode(selected.id);
      if (!node || node.type !== "transition") {
        return;
      }
      node.angle = 0;
      render();
    });

    deleteBtn.addEventListener("click", deleteSelected);
    metadataFilterInput.addEventListener("input", renderMetadataPanel);
    zoomOutBtn.addEventListener("click", () => zoomAt(1 / ZOOM_STEP));
    zoomInBtn.addEventListener("click", () => zoomAt(ZOOM_STEP));
    zoomResetBtn.addEventListener("click", () => setView(1, 0, 0));
    if (panLeftBtn) panLeftBtn.addEventListener("click", () => panBy(PAN_STEP, 0));
    if (panRightBtn) panRightBtn.addEventListener("click", () => panBy(-PAN_STEP, 0));
    if (panUpBtn) panUpBtn.addEventListener("click", () => panBy(0, PAN_STEP));

    // Decomposition canvas toolbar controls
    const decompZoomOutBtn = document.getElementById("decomp-zoom-out-btn");
    const decompZoomInBtn = document.getElementById("decomp-zoom-in-btn");
    const decompZoomResetBtn = document.getElementById("decomp-zoom-reset-btn");
    const decompPanLeftBtn = document.getElementById("decomp-pan-left-btn");
    const decompPanRightBtn = document.getElementById("decomp-pan-right-btn");
    const decompPanUpBtn = document.getElementById("decomp-pan-up-btn");
    const decompPanDownBtn = document.getElementById("decomp-pan-down-btn");
    const decompCenterBtn = document.getElementById("decomp-center-btn");
    const decompZoomCenter = () => {
      // Zoom relative to viewport center (in SVG units)
      const vb = decompositionCanvas ? decompositionCanvas.viewBox.baseVal : null;
      return { cx: vb ? vb.width / 2 : 800, cy: vb ? vb.height / 2 : 450 };
    };
    if (decompZoomOutBtn) decompZoomOutBtn.addEventListener("click", () => {
      const c = decompZoomCenter();
      decompZoomAt(1 / 1.15, c.cx, c.cy);
    });
    if (decompZoomInBtn) decompZoomInBtn.addEventListener("click", () => {
      const c = decompZoomCenter();
      decompZoomAt(1.15, c.cx, c.cy);
    });
    if (decompZoomResetBtn) decompZoomResetBtn.addEventListener("click", () => resetDecompView());
    if (decompPanLeftBtn) decompPanLeftBtn.addEventListener("click", () => decompPanBy(PAN_STEP, 0));
    if (decompPanRightBtn) decompPanRightBtn.addEventListener("click", () => decompPanBy(-PAN_STEP, 0));
    if (decompPanUpBtn) decompPanUpBtn.addEventListener("click", () => decompPanBy(0, PAN_STEP));
    if (decompPanDownBtn) decompPanDownBtn.addEventListener("click", () => decompPanBy(0, -PAN_STEP));
    if (decompCenterBtn) decompCenterBtn.addEventListener("click", () => decompCenter());
    if (panDownBtn) panDownBtn.addEventListener("click", () => panBy(0, -PAN_STEP));
    if (centerNetBtn) centerNetBtn.addEventListener("click", () => centerNet());
    if (computeModalCancelBtn) {
      computeModalCancelBtn.addEventListener("click", cancelActiveComputation);
    }

    if (headerLoginBtn) {
      headerLoginBtn.addEventListener("click", () => openLoginModal());
    }

    if (headerLogoutBtn) {
      headerLogoutBtn.addEventListener("click", async () => {
        try {
          await logoutFromLibraryAccess();
        } catch (error) {
          setLibraryAuthSession(false, null);
          setLibraryStatus(t("status.libraryLoggedOut"), false);
        }
      });
    }

    if (authorMetricsRefreshBtn) {
      authorMetricsRefreshBtn.addEventListener("click", async () => {
        if (authorMetricsRefreshBtn.disabled) return;
        authorMetricsRefreshBtn.disabled = true;
        authorMetricsRefreshBtn.classList.add("is-spinning");
        if (authorMetricsRefreshStatus) {
          authorMetricsRefreshStatus.textContent = t("author.metricsRefreshing");
          authorMetricsRefreshStatus.className = "author-metrics-refresh-status";
        }
        try {
          const payload = await callLibraryApi("update_metrics", { method: "POST" });
          if (Array.isArray(payload.authors)) {
            state.authors.items = payload.authors;
            renderAuthorsPanel();
          }
          if (authorMetricsRefreshStatus) {
            authorMetricsRefreshStatus.textContent = t("author.metricsRefreshOk");
            authorMetricsRefreshStatus.className = "author-metrics-refresh-status is-success";
          }
        } catch (error) {
          if (authorMetricsRefreshStatus) {
            authorMetricsRefreshStatus.textContent = t("author.metricsRefreshFail");
            authorMetricsRefreshStatus.className = "author-metrics-refresh-status is-error";
          }
        } finally {
          authorMetricsRefreshBtn.disabled = false;
          authorMetricsRefreshBtn.classList.remove("is-spinning");
          setTimeout(() => {
            if (authorMetricsRefreshStatus) authorMetricsRefreshStatus.classList.add("hidden");
          }, 5000);
        }
      });
    }

    // ── Metrics edit modal ──
    function openMetricsEditModal() {
      if (!metricsEditModal) return;
      const selectedAuthor = getSelectedAuthor();
      if (!selectedAuthor) return;

      var lang = normalizeLanguage(state.settings.language);
      var authorName = authorLang(selectedAuthor.fullName) || selectedAuthor.id;
      if (metricsEditSubtitle) {
        metricsEditSubtitle.textContent = authorName;
      }
      if (metricsEditError) {
        metricsEditError.textContent = "";
        metricsEditError.classList.add("hidden");
      }

      var m = selectedAuthor.metrics || {};
      var gs = m.googleScholar || {};
      var wos = m.wos || {};

      var setVal = function(id, val) {
        var el = document.getElementById(id);
        if (el) el.value = (val !== undefined && val !== null && val !== "") ? String(val) : "";
      };
      setVal("metrics-edit-gs-articles", gs.articles);
      setVal("metrics-edit-gs-citations", gs.citations);
      setVal("metrics-edit-gs-hindex", gs.hIndex);
      setVal("metrics-edit-gs-i10index", gs.i10Index);
      setVal("metrics-edit-wos-articles", wos.articles);
      setVal("metrics-edit-wos-citations", wos.citations);
      setVal("metrics-edit-wos-hindex", wos.hIndex);
      setVal("metrics-edit-wos-i10index", wos.i10Index);

      // Translate modal
      var titleEl = document.getElementById("metrics-edit-modal-title");
      if (titleEl) titleEl.textContent = t("author.metricsEditTitle");
      if (metricsEditSaveBtn) metricsEditSaveBtn.textContent = t("author.metricsEditSave");
      if (metricsEditCancelBtn) metricsEditCancelBtn.textContent = t("author.metricsEditCancel");

      metricsEditModal.classList.add("is-open");
      metricsEditModal.setAttribute("aria-hidden", "false");
      document.body.classList.add("modal-open");
    }

    function closeMetricsEditModal() {
      if (!metricsEditModal) return;
      metricsEditModal.classList.remove("is-open");
      metricsEditModal.setAttribute("aria-hidden", "true");
      if (!loginModal || !loginModal.classList.contains("is-open")) {
        document.body.classList.remove("modal-open");
      }
    }

    function getSelectedAuthor() {
      var items = Array.isArray(state.authors.items) ? state.authors.items : [];
      return items.find(function(item) { return String(item.id || "") === state.authors.selectedId; }) || null;
    }

    async function saveMetricsFromModal() {
      var selectedAuthor = getSelectedAuthor();
      if (!selectedAuthor) return;

      if (metricsEditSaveBtn) metricsEditSaveBtn.disabled = true;

      var getVal = function(id) {
        var el = document.getElementById(id);
        if (!el || el.value.trim() === "") return null;
        var v = parseInt(el.value, 10);
        return isNaN(v) ? null : v;
      };

      var gsArticles = getVal("metrics-edit-gs-articles");
      var gsCitations = getVal("metrics-edit-gs-citations");
      var gsHIndex = getVal("metrics-edit-gs-hindex");
      var gsI10 = getVal("metrics-edit-gs-i10index");
      var wosArticles = getVal("metrics-edit-wos-articles");
      var wosCitations = getVal("metrics-edit-wos-citations");
      var wosHIndex = getVal("metrics-edit-wos-hindex");
      var wosI10 = getVal("metrics-edit-wos-i10index");

      var metricsPayload = {};
      if (gsArticles !== null || gsCitations !== null || gsHIndex !== null || gsI10 !== null) {
        metricsPayload.googleScholar = {
          articles: gsArticles,
          citations: gsCitations,
          hIndex: gsHIndex,
          i10Index: gsI10
        };
      }
      if (wosArticles !== null || wosCitations !== null || wosHIndex !== null || wosI10 !== null) {
        metricsPayload.wos = {
          articles: wosArticles,
          citations: wosCitations,
          hIndex: wosHIndex,
          i10Index: wosI10
        };
      }

      try {
        var payload = await callLibraryApi("save_author_metrics", {
          method: "POST",
          body: {
            authorId: selectedAuthor.id,
            metrics: metricsPayload
          }
        });
        if (Array.isArray(payload.authors)) {
          state.authors.items = payload.authors;
          renderAuthorsPanel();
        }
        closeMetricsEditModal();
        if (authorMetricsRefreshStatus) {
          authorMetricsRefreshStatus.textContent = t("author.metricsEditSaved");
          authorMetricsRefreshStatus.className = "author-metrics-refresh-status is-success";
          authorMetricsRefreshStatus.classList.remove("hidden");
          setTimeout(function() { authorMetricsRefreshStatus.classList.add("hidden"); }, 4000);
        }
      } catch (error) {
        if (metricsEditError) {
          metricsEditError.textContent = t("author.metricsEditFail");
          metricsEditError.classList.remove("hidden");
        }
      } finally {
        if (metricsEditSaveBtn) metricsEditSaveBtn.disabled = false;
      }
    }

    if (authorMetricsEditBtn) {
      authorMetricsEditBtn.addEventListener("click", function() { openMetricsEditModal(); });
    }
    if (metricsEditCloseBtn) {
      metricsEditCloseBtn.addEventListener("click", function() { closeMetricsEditModal(); });
    }
    if (metricsEditCancelBtn) {
      metricsEditCancelBtn.addEventListener("click", function() { closeMetricsEditModal(); });
    }
    if (metricsEditSaveBtn) {
      metricsEditSaveBtn.addEventListener("click", function() { saveMetricsFromModal(); });
    }
    if (metricsEditModal) {
      metricsEditModal.addEventListener("click", function(event) {
        if (event.target === metricsEditModal) closeMetricsEditModal();
      });
    }

    if (loginModalSubmitBtn) {
      loginModalSubmitBtn.addEventListener("click", () => submitLoginModal());
    }

    if (loginModalCancelBtn) {
      loginModalCancelBtn.addEventListener("click", () => closeLoginModal());
    }

    if (loginModalCloseBtn) {
      loginModalCloseBtn.addEventListener("click", () => closeLoginModal());
    }

    if (loginModal) {
      loginModal.addEventListener("click", (event) => {
        if (event.target === loginModal) closeLoginModal();
      });
    }

    if (loginModalPassword) {
      loginModalPassword.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") return;
        event.preventDefault();
        submitLoginModal();
      });
    }

    if (loginModalUsername) {
      loginModalUsername.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") return;
        event.preventDefault();
        if (loginModalPassword) loginModalPassword.focus();
      });
    }

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && loginModal && loginModal.classList.contains("is-open")) {
        closeLoginModal();
      }
      if (event.key === "Escape" && aboutModal && aboutModal.classList.contains("is-open")) {
        closeAboutModal();
      }
    });

    if (aboutOpenBtn) {
      aboutOpenBtn.addEventListener("click", () => openAboutModal());
    }

    if (aboutModalCloseBtn) {
      aboutModalCloseBtn.addEventListener("click", () => closeAboutModal());
    }

    if (aboutModal) {
      aboutModal.addEventListener("click", (event) => {
        if (event.target === aboutModal) closeAboutModal();
      });
    }

    if (librarySelect) {
      librarySelect.addEventListener("change", async () => {
        state.library.selectedId = librarySelect.value || null;
        localStorage.setItem(LIBRARY_STORAGE_KEY, state.library.selectedId || "");
        renderLibrarySelect();
        try {
          await refreshLibraryFiles();
        } catch (error) {
          const message = error instanceof Error ? error.message : t("app.library.fileListRefreshFailed");
          setLibraryStatus(message, true);
        }
      });
    }

    if (createLibraryBtn) {
      createLibraryBtn.addEventListener("click", async () => {
        try {
          await createLibraryFromInput();
        } catch (error) {
          const message = error instanceof Error ? error.message : t("app.library.createFailed");
          alert(message);
          setLibraryStatus(message, true);
        }
      });
    }

    if (renameLibraryBtn) {
      renameLibraryBtn.addEventListener("click", async () => {
        try {
          await renameCurrentLibrary();
        } catch (error) {
          const message = error instanceof Error ? error.message : t("app.library.renameFailed");
          alert(message);
          setLibraryStatus(message, true);
        }
      });
    }

    if (refreshLibraryBtn) {
      refreshLibraryBtn.addEventListener("click", async () => {
        try {
          await refreshLibraries(state.library.selectedId || "");
        } catch (error) {
          const message = error instanceof Error ? error.message : t("app.library.refreshFailed");
          alert(message);
          setLibraryStatus(message, true);
        }
      });
    }

    if (libraryUploadBtn && libraryUploadInput) {
      libraryUploadBtn.addEventListener("click", () => {
        const selectedLibrary = getSelectedLibrary();
        if (!selectedLibrary) {
          alert(t("app.library.createOrSelect"));
          return;
        }
        libraryUploadInput.click();
      });

      libraryUploadInput.addEventListener("change", async () => {
        const files = libraryUploadInput.files;
        if (!files || files.length === 0) {
          return;
        }
        await uploadPnhSelection(files, false);
      });
    }

    if (libraryUploadFolderBtn && libraryUploadFolderInput) {
      libraryUploadFolderBtn.addEventListener("click", () => {
        const selectedLibrary = getSelectedLibrary();
        if (!selectedLibrary) {
          alert(t("app.library.createOrSelect"));
          return;
        }
        libraryUploadFolderInput.click();
      });

      libraryUploadFolderInput.addEventListener("change", async () => {
        const files = libraryUploadFolderInput.files;
        if (!files || files.length === 0) {
          return;
        }
        await uploadPnhSelection(files, true);
      });
    }

    if (loadLibraryFileBtn) {
      loadLibraryFileBtn.addEventListener("click", async () => {
        try {
          await loadCurrentLibraryFile();
        } catch (error) {
          const message = error instanceof Error ? error.message : t("app.library.loadFailed");
          alert(message);
          setLibraryStatus(message, true);
        }
      });
    }

    if (libraryFileSelect) {
      const rememberSelectedLibraryFile = () => {
        const selectedLibrary = getSelectedLibrary();
        if (!selectedLibrary || !selectedLibrary.id) {
          return;
        }
        const resolved = resolveLibraryFileName(libraryFileSelect.value || "");
        if (!resolved) {
          return;
        }
        libraryFileSelect.value = resolved;
        setRememberedLibraryFileName(selectedLibrary.id, resolved);
      };

      libraryFileSelect.addEventListener("change", rememberSelectedLibraryFile);
      libraryFileSelect.addEventListener("blur", rememberSelectedLibraryFile);

      libraryFileSelect.addEventListener("keydown", async (event) => {
        if (event.key !== "Enter") {
          return;
        }
        event.preventDefault();
        try {
          await loadCurrentLibraryFile();
        } catch (error) {
          const message = error instanceof Error ? error.message : t("app.library.loadFailed");
          alert(message);
          setLibraryStatus(message, true);
        }
      });

      libraryFileSelect.addEventListener("dblclick", async () => {
        try {
          await loadCurrentLibraryFile();
        } catch (error) {
          const message = error instanceof Error ? error.message : t("app.library.loadFailed");
          alert(message);
          setLibraryStatus(message, true);
        }
      });
    }

    if (benchmarkSelectAllBtn && benchmarkFilesSelect) {
      benchmarkSelectAllBtn.addEventListener("click", () => {
        Array.from(benchmarkFilesSelect.options).forEach((option) => {
          if (option.value) {
            option.selected = true;
          }
        });
      });
    }

    if (benchmarkApplyFilterBtn) {
      benchmarkApplyFilterBtn.addEventListener("click", () => {
        renderBenchmarkFileOptions();
      });
    }
    if (benchmarkFileFilterInput) {
      benchmarkFileFilterInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          renderBenchmarkFileOptions();
        }
      });
    }
    if (benchmarkFileLimitInput) {
      benchmarkFileLimitInput.addEventListener("change", () => {
        renderBenchmarkFileOptions();
      });
    }
    if (benchmarkStrataTargetInput) {
      benchmarkStrataTargetInput.addEventListener("change", () => {
        if (benchmarkProfileRecords.length > 0) {
          selectBenchmarkRepresentativeSample(true);
        }
      });
    }

    if (benchmarkClearSelectionBtn && benchmarkFilesSelect) {
      benchmarkClearSelectionBtn.addEventListener("click", () => {
        benchmarkRepresentativeSelection = null;
        Array.from(benchmarkFilesSelect.options).forEach((option) => {
          option.selected = false;
        });
        renderBenchmarkFileOptions();
        renderBenchmarkResults();
      });
    }

    if (fireSelectedBtn) {
      fireSelectedBtn.addEventListener("click", fireSelectedTransitionFromUi);
    }
    if (stepBtn) {
      stepBtn.addEventListener("click", fireRandomEnabledTransitionFromUi);
    }
    if (autoBtn) {
      autoBtn.addEventListener("click", toggleAutoSimulation);
    }
    if (canvasFireSelectedBtn) {
      canvasFireSelectedBtn.addEventListener("click", fireSelectedTransitionFromUi);
    }
    if (canvasStepBtn) {
      canvasStepBtn.addEventListener("click", fireRandomEnabledTransitionFromUi);
    }
    if (canvasAutoBtn) {
      canvasAutoBtn.addEventListener("click", () => {
        toggleAutoSimulation();
      });
    }
    analyzeBtn.addEventListener("click", analyzeLivenessAndSafeness);
    if (pinvRunBtn) {
      pinvRunBtn.addEventListener("click", () => {
        runPinvariantComputation().catch((error) => {
          const message = error instanceof Error ? error.message : t("app.pinvariant.computationFailed");
          setPinvariantStatus(message, true);
          hideComputationDialog();
        });
      });
    }
    if (selectionHypergraphBtn) {
      selectionHypergraphBtn.addEventListener("click", () => {
        runSelectionHypergraphMethod().catch((error) => {
          const message = error instanceof Error ? error.message : t("app.xtrec.computationFailed");
          setSelectionHypergraphStatus(message, true);
          hideComputationDialog();
        });
      });
    }
    if (selectionHypergraphDrawBtn) {
      selectionHypergraphDrawBtn.addEventListener("click", drawSelectionHypergraphFromAnalysis);
    }
    if (selectionHypergraphCompareBtn) {
      selectionHypergraphCompareBtn.addEventListener("click", compareSelectionHypergraphBeforeAfterFra);
    }
    if (selectionHypergraphComparisonCloseBtn) {
      selectionHypergraphComparisonCloseBtn.addEventListener("click", hideSelectionHypergraphComparison);
    }
    if (manualHypergraphRunBtn) {
      manualHypergraphRunBtn.addEventListener("click", runManualHypergraphXtrec);
    }
    if (sfcBuildBtn) {
      sfcBuildBtn.addEventListener("click", () => {
        runSfcBuildComputation().catch((error) => {
          const message = error instanceof Error ? error.message : t("app.action.sfcBuildFailed");
          setSfcStatus(message, true);
          setSfcRunning(false);
          hideComputationDialog();
        });
      });
    }
    if (sfcValidateBtn) {
      sfcValidateBtn.addEventListener("click", () => {
        runSfcValidationComputation().catch((error) => {
          const message = error instanceof Error ? error.message : t("app.action.sfcValidateFailed");
          setSfcStatus(message, true);
          setSfcRunning(false);
          hideComputationDialog();
        });
      });
    }
    if (sfcMaxPlusRunBtn) {
      sfcMaxPlusRunBtn.addEventListener("click", () => {
        runSfcMaxPlusComputation().catch((error) => {
          const message = error instanceof Error ? error.message : t("app.action.maxPlusFailed");
          setSfcStatus(message, true);
          setSfcRunning(false);
          hideComputationDialog();
        });
      });
    }
    if (sfcExportXmlBtn) {
      sfcExportXmlBtn.addEventListener("click", exportSfcPlcopenXml);
    }
    if (sfcExportStBtn) {
      sfcExportStBtn.addEventListener("click", exportSfcCoordinatorSt);
    }
    if (sfcExportIdeBtn) {
      sfcExportIdeBtn.addEventListener("click", exportSfcIdeMapping);
    }
    if (fuzzyBuildBtn) {
      fuzzyBuildBtn.addEventListener("click", runFuzzyMaxPlusResearchModel);
    }
    if (fuzzyShowHypergraphSolutionBtn) {
      fuzzyShowHypergraphSolutionBtn.addEventListener("click", showFuzzyHypergraphSolution);
    }
    if (fuzzyMappingRefreshBtn) {
      fuzzyMappingRefreshBtn.addEventListener("click", renderFuzzyHypergraphMappingPanel);
    }
    if (fuzzyMappingAutoBtn) {
      fuzzyMappingAutoBtn.addEventListener("click", autoMapFuzzyHypergraphVertices);
    }
    if (fuzzyMappingClearBtn) {
      fuzzyMappingClearBtn.addEventListener("click", clearFuzzyHypergraphMappings);
    }
    if (fuzzySourceSelect) {
      fuzzySourceSelect.addEventListener("change", () => {
        updateFuzzySourceNote();
        clearFuzzyResult();
        renderFuzzyHypergraphMappingPanel();
      });
    }
    if (fuzzyExportJsonBtn) {
      fuzzyExportJsonBtn.addEventListener("click", exportFuzzyJson);
    }
    if (fuzzyExportCsvBtn) {
      fuzzyExportCsvBtn.addEventListener("click", exportFuzzyCsv);
    }
    if (fuzzyExportAlphaCsvBtn) {
      fuzzyExportAlphaCsvBtn.addEventListener("click", exportFuzzyAlphaCsv);
    }
    if (fuzzyExportMuCsvBtn) {
      fuzzyExportMuCsvBtn.addEventListener("click", exportFuzzyMembershipCsv);
    }
    if (fuzzyExportLatexBtn) {
      fuzzyExportLatexBtn.addEventListener("click", exportFuzzyLatex);
    }
    if (fuzzyExportReportBtn) {
      fuzzyExportReportBtn.addEventListener("click", exportFuzzyReport);
    }
    if (fuzzySaveRunBtn) {
      fuzzySaveRunBtn.addEventListener("click", () => {
        saveCurrentResearchRun();
      });
    }
    if (fuzzyRefreshRunsBtn) {
      fuzzyRefreshRunsBtn.addEventListener("click", () => {
        refreshResearchRuns();
      });
    }
    [
      fuzzyAlphaInput,
      fuzzyAlphaStepInput,
      fuzzyDefaultDelayInput,
      fuzzyDelayMapInput,
      fuzzySyncOverheadInput,
      fuzzyMuBaseInput,
      fuzzyMuConcurrencyInput,
      fuzzyMuConflictInput,
      fuzzyMuTimeInput,
      fuzzyMuCouplingInput,
      fuzzyMuReconfigurationInput,
      fuzzyMaxSizeInput,
      fuzzyMaxCouplingInput,
      fuzzyLambdaLimitInput,
      fuzzyMpcHorizonInput,
      fuzzyExperimentLabelInput
    ].forEach((input) => {
      if (!input) {
        return;
      }
      input.addEventListener("input", () => {
        lastFuzzyMaxPlusResult = null;
      });
    });
    if (benchmarkRunBtn) {
      benchmarkRunBtn.addEventListener("click", () => {
        runBenchmarkModule().catch((error) => {
          const message = error instanceof Error ? error.message : t("app.action.benchmarkFailed");
          setBenchmarkStatus(message, true);
          setBenchmarkRunning(false);
          hideComputationDialog();
        });
      });
    }
    if (benchmarkProfileBtn) {
      benchmarkProfileBtn.addEventListener("click", () => {
        runBenchmarkProfile().catch((error) => {
          const message = error instanceof Error ? error.message : t("app.action.profileFailed");
          setBenchmarkStatus(message, true);
          setBenchmarkRunning(false);
          hideComputationDialog();
        });
      });
    }
    if (benchmarkSelectRepresentativeBtn) {
      benchmarkSelectRepresentativeBtn.addEventListener("click", () => {
        try {
          selectBenchmarkRepresentativeSample(true);
        } catch (error) {
          const message = error instanceof Error ? error.message : t("app.action.sampleSelectFailed");
          setBenchmarkStatus(message, true);
        }
      });
    }
    if (benchmarkRunRepresentativeBtn) {
      benchmarkRunRepresentativeBtn.addEventListener("click", () => {
        runBenchmarkRepresentativeSample().catch((error) => {
          const message = error instanceof Error ? error.message : t("app.action.sampleRunFailed");
          setBenchmarkStatus(message, true);
          setBenchmarkRunning(false);
          hideComputationDialog();
        });
      });
    }
    if (benchmarkCancelBtn) {
      benchmarkCancelBtn.addEventListener("click", () => {
        if (!benchmarkIsRunning) {
          return;
        }
        cancelBenchmarkComputation();
      });
    }
    if (benchmarkExportCsvBtn) {
      benchmarkExportCsvBtn.addEventListener("click", exportBenchmarkCsv);
    }
    if (benchmarkExportLatexBtn) {
      benchmarkExportLatexBtn.addEventListener("click", exportBenchmarkLatex);
    }
    if (benchmarkExportProfileCsvBtn) {
      benchmarkExportProfileCsvBtn.addEventListener("click", exportBenchmarkProfileCsv);
    }
    if (benchmarkResults) {
      benchmarkResults.addEventListener("click", (event) => {
        if (event.target && event.target.id === "benchmark-export-profile-results-csv-btn") {
          exportBenchmarkProfileCsv();
        }
      });
    }
    if (generateNetBtn) {
      generateNetBtn.addEventListener("click", () => {
        try {
          runRandomGenerator();
        } catch (error) {
          const message = error instanceof Error ? error.message : t("app.action.generateFailed");
          alert(message);
          setGenerateStatus(message, true);
        }
      });
    }
    if (genSearchBtn) {
      genSearchBtn.addEventListener("click", () => {
        try {
          runTimeLimitedSearch();
        } catch (error) {
          const message = error instanceof Error ? error.message : t("app.action.searchFailed");
          setGenerateStatus(message, true);
        }
      });
    }

    newNetBtn.addEventListener("click", () => {
      if (confirm(t("app.net.clearConfirm"))) {
        resetState();
      }
    });

    saveJsonBtn.addEventListener("click", exportJsonFile);
    loadJsonBtn.addEventListener("click", () => loadJsonInput.click());
    loadJsonInput.addEventListener("change", () => {
      const file = loadJsonInput.files && loadJsonInput.files[0];
      if (!file) {
        return;
      }
      loadFromJsonFile(file);
      loadJsonInput.value = "";
    });

    loadPnhBtn.addEventListener("click", () => loadPnhInput.click());
    loadPnhInput.addEventListener("change", () => {
      const file = loadPnhInput.files && loadPnhInput.files[0];
      if (!file) {
        return;
      }
      loadFromPnhFile(file);
      loadPnhInput.value = "";
    });

    exportPnhBtn.addEventListener("click", exportPNH);

    relayoutBtn.addEventListener("click", () => {
      relayoutCurrentNet(state.settings.layoutMode);
      setAnalysisMessage([], t("status.relayoutHint"));
    });

    layoutModeSelect.addEventListener("change", () => {
      setLayoutMode(layoutModeSelect.value);
      render();
    });

    sidebarToggle.addEventListener("click", () => {
      document.body.classList.toggle("sidebar-collapsed");
    });

    if (inspectorToggle) {
      const savedCollapsed = localStorage.getItem(INSPECTOR_COLLAPSED_KEY) === "1";
      document.body.classList.toggle("inspector-collapsed", savedCollapsed);
      inspectorToggle.classList.toggle("is-active", savedCollapsed);
      inspectorToggle.addEventListener("click", () => {
        const collapsed = document.body.classList.toggle("inspector-collapsed");
        inspectorToggle.classList.toggle("is-active", collapsed);
        try {
          localStorage.setItem(INSPECTOR_COLLAPSED_KEY, collapsed ? "1" : "0");
        } catch (e) { /* localStorage unavailable */ }
      });
    }

    // Documentation panel listeners
    if (docsReloadBtn) docsReloadBtn.addEventListener("click", () => loadDocs());
    if (docsEditBtn) docsEditBtn.addEventListener("click", () => enterDocsEdit());
    if (docsCancelBtn) docsCancelBtn.addEventListener("click", () => cancelDocsEdit());
    if (docsSaveBtn) docsSaveBtn.addEventListener("click", () => saveDocsDraft());
    if (docsAddAlgorithmBtn) {
      docsAddAlgorithmBtn.addEventListener("click", () => {
        if (!state.docs.draft) return;
        state.docs.draft.algorithms.push({
          id: "alg-" + Math.random().toString(36).slice(2, 10),
          name: { en: "", pl: "" },
          description: { en: "", pl: "" },
          complexity: "",
          references: ""
        });
        renderDocsEditor();
      });
    }
    if (docsAddArticleBtn) {
      docsAddArticleBtn.addEventListener("click", () => {
        if (!state.docs.draft) return;
        state.docs.draft.articles.push({
          id: "art-" + Math.random().toString(36).slice(2, 10),
          title: "",
          authors: "",
          year: null,
          venue: "",
          doi: "",
          url: "",
          abstract: ""
        });
        renderDocsEditor();
      });
    }

    themeToggle.addEventListener("change", () => {
      setTheme(themeToggle.checked ? "dark" : "light");
      render();
    });
    if (languageSelect) {
      languageSelect.addEventListener("change", () => {
        setLanguage(languageSelect.value, true, true);
      });
    }

    window.addEventListener("keydown", (event) => {
      if (isComputationDialogOpen()) {
        if (event.key === "Escape") {
          event.preventDefault();
          cancelActiveComputation();
        } else if (!computeModal || !computeModal.contains(event.target)) {
          event.preventDefault();
        }
        return;
      }

      if ((event.key === " " || event.code === "Space") && !isEditableTarget(event.target)) {
        isSpacePressed = true;
        svg.classList.add("pan-ready");
        event.preventDefault();
      }

      if (event.key === "Delete" && activeWorkspaceTab === "hypergraph" && !isEditableTarget(event.target)) {
        event.preventDefault();
        deleteSelectedHypergraphElement();
        return;
      }

      if (event.key === "Delete") {
        deleteSelected();
      }
      if (event.key === "a" && (event.ctrlKey || event.metaKey) && mode === "select" && !isEditableTarget(event.target)) {
        event.preventDefault();
        selectAllNodes();
      }
      if (event.key === "Escape") {
        if (activeWorkspaceTab === "hypergraph") {
          hypergraphPendingEdgeVertexIds.clear();
          clearHypergraphSelection();
          setHypergraphEditorMode("select");
          renderHypergraphEditor();
          return;
        }
        stopPanDrag();
        isSpacePressed = false;
        svg.classList.remove("pan-ready");
        arcSourceNodeId = null;
        clearSelection();
        render();
      }
      if ((event.key === "+" || event.key === "=") && !isEditableTarget(event.target)) {
        event.preventDefault();
        zoomAt(ZOOM_STEP);
      }
      if ((event.key === "-" || event.key === "_") && !isEditableTarget(event.target)) {
        event.preventDefault();
        zoomAt(1 / ZOOM_STEP);
      }
      if (event.key === "0" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        setView(1, 0, 0);
      }
      if (event.key === "ArrowLeft" && !isEditableTarget(event.target)) {
        event.preventDefault();
        panBy(PAN_STEP, 0);
      }
      if (event.key === "ArrowRight" && !isEditableTarget(event.target)) {
        event.preventDefault();
        panBy(-PAN_STEP, 0);
      }
      if (event.key === "ArrowUp" && !isEditableTarget(event.target)) {
        event.preventDefault();
        panBy(0, PAN_STEP);
      }
      if (event.key === "ArrowDown" && !isEditableTarget(event.target)) {
        event.preventDefault();
        panBy(0, -PAN_STEP);
      }
      if (event.key === "c" && !isEditableTarget(event.target) && !event.ctrlKey && !event.metaKey) {
        centerNet();
      }
    });

    window.addEventListener("keyup", (event) => {
      if (event.key === " " || event.code === "Space") {
        isSpacePressed = false;
        svg.classList.remove("pan-ready");
      }
    });

    window.addEventListener("blur", () => {
      isSpacePressed = false;
      svg.classList.remove("pan-ready");
      stopPanDrag();
      dragInfo = null;
      arcPointDragInfo = null;
    });
  }

  async function init() {
    initTheme();
    mountSidebarPanelsInWorkspace();
    const savedLanguage = normalizeLanguage(localStorage.getItem(LANGUAGE_KEY) || state.settings.language);
    setLanguage(savedLanguage, false, false);
    setLayoutMode(DEFAULT_LAYOUT_MODE);
    setView(1, 0, 0);
    setMode("select");
    setActiveSidebarTab(localStorage.getItem(SIDEBAR_TAB_KEY) || "sim", false, false);
    setPinvariantStatus(t("status.pinvIdle"), false);
    setPinvariantOutput("");
    setPinvariantMatrixOutput("");
    setSelectionHypergraphRunning(false);
    pendingSelectionHypergraphResult = null;
    lastSelectionHypergraphResult = null;
    setSelectionHypergraphStatus(t("status.selectionIdle"), false);
    setSelectionHypergraphOutput("");
    lastSfcResult = null;
    setSfcStatus(t("status.sfcReady"), false);
    setSfcOutput("");
    setSfcValidationOutput("");
    setSfcMaxPlusOutput("");
    setSfcRunning(false);
    clearFuzzyResult();
    setDecompositionStatus(t("status.decompositionNone"), false);
    setDecompositionDetails("");
    syncDecompositionSubnetOptions();
    benchmarkRecords = [];
    setBenchmarkRunning(false);
    setBenchmarkStatus(t("status.benchReady"), false);
    setBenchmarkCurrent(t("status.benchCurrentIdle"));
    setBenchmarkLatexOutput("");
    renderBenchmarkResults();
    loadHypergraphEditorState();
    syncManualHypergraphResultFromEditor();
    refreshHypergraphEditorText();
    renderHypergraphEditor();
    setActiveWorkspaceTab("canvas");
    updateWorkspaceTabs();
    hideComputationDialog();
    wireEvents();

    setLibraryAuthSession(false, null);
    clearLibraryState();
    setLibraryStatus(t("status.libraryLoading"), false);

    if (RESEARCH_TEAM_ENABLED) {
      try {
        await refreshAuthors();
      } catch (error) {
        if (authorsEmpty) {
          const message = error instanceof Error ? error.message : t("author.empty");
          authorsEmpty.textContent = message;
          authorsEmpty.classList.remove("hidden");
        }
      }
    }

    try {
      await loadDocs();
    } catch (error) {
      setDocsStatus(error instanceof Error ? error.message : "Error loading docs", true);
    }

    try {
      await refreshLibraryAuthStatus();
    } catch (error) {
      const message = error instanceof Error ? error.message : t("app.auth.statusFailed");
      setLibraryStatus(message, true);
    }

    try {
      await refreshResearchRuns();
    } catch (error) {
      const message = error instanceof Error ? error.message : t("app.init.researchRunsFailed");
      setFuzzyRunsStatus(message, true);
    }

    try {
      await refreshLibraries();
      if (isLibraryAuthenticated() && state.library.libraries.length === 0) {
        await ensureDefaultLibrary();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : t("app.init.librariesFailed");
      setLibraryStatus(message, true);
    }

    if (!loadFromLocalStorage()) {
      setAnalysisMessage([], t("status.analysisIdle"));
      render();
      return;
    }

    if (getSelectedLibrary()) {
      try {
        await refreshLibraryFiles();
      } catch (error) {
        const message = error instanceof Error ? error.message : t("app.init.libraryFilesFailed");
        setLibraryStatus(message, true);
      }
    } else if (!isLibraryAuthenticated()) {
      setLibraryStatus(t("status.libraryLocked"), false);
    }
  }

  init().catch((error) => {
    const message = error instanceof Error ? error.message : t("app.init.failed");
    setLibraryStatus(message, true);
  });
})();
