"use strict";

const path = require("node:path");
const fs = require("node:fs/promises");
const { test, expect } = require("@playwright/test");

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("pooh-language", "en");
  });
});

async function expectPetriCanvasHasModel(page) {
  await expect.poll(async () => page.locator("#canvas [data-kind='node']").count()).toBeGreaterThan(0);
  await expect.poll(async () => page.locator("#canvas [data-kind='arc']").count()).toBeGreaterThan(0);
}

async function expectHypergraphCanvasHasModel(page) {
  await expect.poll(async () => page.locator("#hypergraph-viewport [data-hypervertex-id]").count()).toBeGreaterThan(0);
  await expect.poll(async () => page.locator("#hypergraph-viewport .hypergraph-editor-edge").count()).toBeGreaterThan(0);
}

async function runHypergraphXtrecAndWait(page, sourceLabel) {
  await page.locator("#hypergraph-xtrec-btn").click();
  await expect(page.locator("#hypergraph-editor-status")).toContainText(
    `for the ${sourceLabel} hypergraph`,
    { timeout: 15000 }
  );
  await expect(page.locator("#hypergraph-editor-status")).toContainText(/XTREC=(TRUE|FALSE)/);
  await expect(page.locator("#compute-modal")).toHaveAttribute("aria-hidden", "true");
}

async function readDownloadedText(download) {
  const filePath = await download.path();
  if (!filePath) {
    throw new Error(`Download path unavailable for ${download.suggestedFilename()}`);
  }
  return fs.readFile(filePath, "utf8");
}

test("POOH browser workflow imports PNH, computes selection hypergraph and checks XT before/after FRA", async ({ page }) => {
  test.setTimeout(60000);
  const consoleErrors = [];
  const dialogs = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    consoleErrors.push(error.message);
  });
  page.on("dialog", async (dialog) => {
    const message = dialog.message();
    dialogs.push(`${dialog.type()}: ${message}`);
    if (dialog.type() === "confirm" && /Web(?:GPU|GL) was detected/.test(message)) {
      await dialog.dismiss();
      return;
    }
    await dialog.accept();
  });

  await page.goto("/");
  await expect(page).toHaveTitle(/POOH/);
  await expect(page.locator("body")).toHaveAttribute("data-deployment-mode", "public");
  await expect(page.locator("#sidebar-tab-auth")).toHaveCount(0);
  await expect(page.locator("#sidebar-panel-auth")).toHaveCount(0);
  await expect.poll(async () => page.evaluate(() => (
    Boolean(window.POOH_APP_CONFIG
      && window.POOH_APP_CONFIG.deploymentMode === "public"
      && window.POOH_APP_CONFIG.features
      && window.POOH_APP_CONFIG.features.researchTeam === false)
  ))).toBe(true);
  const publicAuthorsPayload = await page.evaluate(async () => {
    const response = await fetch("library_api.php?action=authors");
    return response.json();
  });
  expect(publicAuthorsPayload).toEqual({ ok: true, authors: [] });
  await expect.poll(async () => page.evaluate(() => (
    Boolean(window.PoohPnhCore && typeof window.PoohPnhCore.parsePnhText === "function")
  ))).toBe(true);
  await expect.poll(async () => page.evaluate(() => (
    Boolean(window.PoohPetriLayoutCore && typeof window.PoohPetriLayoutCore.buildImportedStateFromParsedPnh === "function")
  ))).toBe(true);
  await expect.poll(async () => page.evaluate(() => (
    Boolean(window.PoohHypergraphCore
      && typeof window.PoohHypergraphCore.reduceFra === "function"
      && typeof window.PoohHypergraphCore.parseManualHypergraphText === "function")
  ))).toBe(true);
  await expect.poll(async () => page.evaluate(() => (
    Boolean(window.PoohSelectionHypergraphCore && typeof window.PoohSelectionHypergraphCore.buildSelectionHypergraphFromPinvariants === "function")
  ))).toBe(true);
  await expect.poll(async () => page.evaluate(() => (
    Boolean(window.PoohExportersCore && typeof window.PoohExportersCore.formatSelectionHypergraphOutput === "function")
  ))).toBe(true);
  await expect.poll(async () => page.evaluate(() => (
    Boolean(window.PoohMaxPlusCore && typeof window.PoohMaxPlusCore.buildMaxPlusTransversalModel === "function")
  ))).toBe(true);
  await expect.poll(async () => page.evaluate(() => (
    Boolean(window.PoohDecompositionViewCore && typeof window.PoohDecompositionViewCore.buildHypergraphGraph === "function")
  ))).toBe(true);
  await expect.poll(async () => page.evaluate(() => (
    Boolean(window.PoohDecompositionRendererCore && typeof window.PoohDecompositionRendererCore.drawDecompositionGraph === "function")
  ))).toBe(true);
  await expect.poll(async () => page.evaluate(() => (
    Boolean(window.PoohFuzzySourceCore && typeof window.PoohFuzzySourceCore.buildFuzzyPetriResearchSource === "function")
  ))).toBe(true);
  await expect.poll(async () => page.evaluate(() => (
    Boolean(window.PoohFuzzyMembershipCore && typeof window.PoohFuzzyMembershipCore.buildFuzzyMembership === "function")
  ))).toBe(true);
  await expect.poll(async () => page.evaluate(() => (
    Boolean(window.PoohFuzzyTransversalCore && typeof window.PoohFuzzyTransversalCore.buildAlphaCutReport === "function")
  ))).toBe(true);
  await expect.poll(async () => page.evaluate(() => (
    Boolean(window.PoohTakagiSugenoCore && typeof window.PoohTakagiSugenoCore.buildTakagiSugenoRules === "function")
  ))).toBe(true);
  await expect.poll(async () => page.evaluate(() => (
    Boolean(window.PoohFuzzyArtifactCore && typeof window.PoohFuzzyArtifactCore.buildFuzzyResearchArtifact === "function")
  ))).toBe(true);
  await expect.poll(async () => page.evaluate(() => (
    Boolean(window.PoohFuzzyCore && typeof window.PoohFuzzyCore.buildFuzzyMembership === "function")
  ))).toBe(true);
  await expect(page.locator("#sidebar-tab-sim")).toBeVisible();

  await page.locator("#workspace-tab-tools").click();
  await expect(page.locator("#pinv-run-btn")).toBeVisible();
  await expect(page.locator("#selection-hypergraph-view-select")).toBeVisible();
  await expect(page.locator("#selection-hypergraph-draw-btn")).toBeVisible();

  await expect(page.locator("#selection-hypergraph-view-select option")).toHaveCount(2);
  const variants = await page.locator("#selection-hypergraph-view-select option").evaluateAll((options) => (
    options.map((option) => option.value)
  ));
  expect(variants).toEqual(["reduced", "original"]);

  await page.locator("#sidebar-tab-io").click();
  await expect(page.locator("#load-pnh-btn")).toBeVisible();
  await page.locator("#load-pnh-input").setInputFiles(path.join(__dirname, "..", "examples", "xt_decomposition_case", "input.pnh"));
  await expectPetriCanvasHasModel(page);

  await page.locator("#workspace-tab-tools").click();
  await page.locator("#sidebar-tab-sim").click();
  await page.evaluate(() => {
    window.__poohExportersCoreCalls = { pinvariantOutput: 0, pinvariantMatrix: 0 };
    const originalOutput = window.PoohExportersCore && window.PoohExportersCore.formatPinvariantOutput;
    if (typeof originalOutput === "function") {
      window.PoohExportersCore.formatPinvariantOutput = function(...args) {
        window.__poohExportersCoreCalls.pinvariantOutput += 1;
        return originalOutput.apply(this, args);
      };
    }
    const originalMatrix = window.PoohExportersCore && window.PoohExportersCore.formatPinvariantMatrixBlock;
    if (typeof originalMatrix === "function") {
      window.PoohExportersCore.formatPinvariantMatrixBlock = function(...args) {
        window.__poohExportersCoreCalls.pinvariantMatrix += 1;
        return originalMatrix.apply(this, args);
      };
    }
  });
  await page.locator("#pinv-run-btn").click();
  await expect(page.locator("#pinv-status")).toContainText("P-invariant computation completed", { timeout: 15000 });
  await expect(page.locator("#pinv-output")).toContainText("P-invariants found");
  await expect(page.locator("#pinv-matrix-output")).toContainText("[P1,P2,P3]");
  expect(await page.evaluate(() => window.__poohExportersCoreCalls.pinvariantOutput)).toBeGreaterThan(0);
  expect(await page.evaluate(() => window.__poohExportersCoreCalls.pinvariantMatrix)).toBeGreaterThan(0);

  await page.evaluate(() => {
    window.__poohSelectionHypergraphCoreCalls = 0;
    window.__poohExportersCoreCalls.selection = 0;
    window.__poohExportersCoreCalls.selectionRows = 0;
    const original = window.PoohSelectionHypergraphCore && window.PoohSelectionHypergraphCore.buildSelectionHypergraphFromPinvariants;
    if (typeof original === "function") {
      window.PoohSelectionHypergraphCore.buildSelectionHypergraphFromPinvariants = function(...args) {
        window.__poohSelectionHypergraphCoreCalls += 1;
        return original.apply(this, args);
      };
    }
    const originalExporter = window.PoohExportersCore && window.PoohExportersCore.formatSelectionHypergraphOutput;
    if (typeof originalExporter === "function") {
      window.PoohExportersCore.formatSelectionHypergraphOutput = function(...args) {
        window.__poohExportersCoreCalls.selection += 1;
        return originalExporter.apply(this, args);
      };
    }
    const originalRows = window.PoohExportersCore && window.PoohExportersCore.buildSelectionHypergraphAnalysisRows;
    if (typeof originalRows === "function") {
      window.PoohExportersCore.buildSelectionHypergraphAnalysisRows = function(...args) {
        window.__poohExportersCoreCalls.selectionRows += 1;
        return originalRows.apply(this, args);
      };
    }
  });
  await page.locator("#selection-hypergraph-btn").click();
  await expect(page.locator("#selection-hypergraph-status")).toContainText("Selection hypergraph computation completed", { timeout: 20000 });
  await expect(page.locator("#selection-hypergraph-output")).toContainText("Dual matrix after FRA reduction");
  await expect(page.locator("#selection-hypergraph-output")).toContainText("XT/1-exact after FRA");
  expect(await page.evaluate(() => window.__poohSelectionHypergraphCoreCalls)).toBeGreaterThan(0);
  expect(await page.evaluate(() => window.__poohExportersCoreCalls.selection)).toBeGreaterThan(0);
  expect(await page.evaluate(() => window.__poohExportersCoreCalls.selectionRows)).toBeGreaterThan(0);

  await page.locator("#sidebar-tab-sfc").click();
  await page.locator("#sfc-source-select").selectOption("recommended");
  await page.locator("#sfc-trace-length").fill("20");
  await page.locator("#sfc-build-btn").click();
  await expect(page.locator("#sfc-status")).toContainText("The SFC model was generated", { timeout: 20000 });
  await expect(page.locator("#compute-modal")).toHaveAttribute("aria-hidden", "true");
  await expect(page.locator("#sfc-output")).toContainText("SFC model (decomposition -> PLC)");
  await expect(page.locator("#sfc-output")).toContainText("SFC subnets");
  await expect(page.locator("#sfc-maxplus-output")).toContainText("(max,+) timing analysis");

  await page.locator("#sfc-validate-btn").click();
  await expect(page.locator("#sfc-status")).toContainText("Validation completed", { timeout: 20000 });
  await expect(page.locator("#compute-modal")).toHaveAttribute("aria-hidden", "true");
  await expect(page.locator("#sfc-validation-output")).toContainText("PN <-> SFC trace validation");

  await page.locator("#sfc-maxplus-run-btn").click();
  await expect(page.locator("#sfc-status")).toContainText("The (max,+) analysis completed", { timeout: 20000 });
  await expect(page.locator("#compute-modal")).toHaveAttribute("aria-hidden", "true");
  await expect(page.locator("#sfc-maxplus-output")).toContainText("Global lambda");

  await page.locator("#sidebar-tab-sim").click();
  await page.locator("#selection-hypergraph-compare-btn").click();
  await expect(page.locator("#workspace-hypergraph-panel")).toBeVisible();
  await expect(page.locator("#selection-hypergraph-comparison-panel")).toBeVisible();
  await expect(page.locator("#selection-hypergraph-before-summary")).toContainText("|V|=");
  await expect(page.locator("#selection-hypergraph-after-summary")).toContainText("Removed by FRA");
  await page.locator("#selection-hypergraph-comparison-close-btn").click();
  await expect(page.locator("#selection-hypergraph-comparison-panel")).toBeHidden();

  await page.locator("#sidebar-tab-sim").click();
  await page.locator("#selection-hypergraph-view-select").selectOption("original");
  await page.locator("#selection-hypergraph-draw-btn").click();
  await expect(page.locator("#workspace-hypergraph-panel")).toBeVisible();
  await expectHypergraphCanvasHasModel(page);
  await expect(page.locator("#hypergraph-editor-status")).toContainText("before FRA");
  await expect(page.locator("#hypergraph-structural-xt-summary")).toBeVisible();
  await runHypergraphXtrecAndWait(page, "original");

  await page.evaluate(() => {
    window.__poohHypergraphCoreCalls = {
      reduceFra: 0,
      enumerateTransversals: 0,
      analyzeRExact: 0,
      analyzeStructure: 0,
      analyzeCExactSpectrum: 0
    };
    window.__poohExportersCoreCalls = window.__poohExportersCoreCalls || {};
    window.__poohExportersCoreCalls.editor = 0;
    ["reduceFra", "enumerateTransversals", "analyzeRExact", "analyzeStructure", "analyzeCExactSpectrum"].forEach((name) => {
      const original = window.PoohHypergraphCore && window.PoohHypergraphCore[name];
      if (typeof original !== "function") {
        return;
      }
      window.PoohHypergraphCore[name] = function(...args) {
        window.__poohHypergraphCoreCalls[name] += 1;
        return original.apply(this, args);
      };
    });
    const originalEditorReport = window.PoohExportersCore && window.PoohExportersCore.formatHypergraphEditorOutput;
    if (typeof originalEditorReport === "function") {
      window.PoohExportersCore.formatHypergraphEditorOutput = function(...args) {
        window.__poohExportersCoreCalls.editor += 1;
        return originalEditorReport.apply(this, args);
      };
    }
  });
  await page.locator("#hypergraph-structure-btn").click();
  await expect(page.locator("#hypergraph-structure-summary")).toBeVisible();
  await page.locator("#hypergraph-cexact-btn").click();
  await expect(page.locator("#hypergraph-cexact-summary")).toBeVisible();
  await page.locator("#hypergraph-transversal-btn").click();
  await expect(page.locator("#hypergraph-transversal-picker")).toBeVisible();
  await page.locator("#hypergraph-rexact-btn").click();
  await expect(page.locator("#hypergraph-rexact-summary")).toBeVisible();
  await page.locator("#hypergraph-fra-btn").click();
  await expect(page.locator("#hypergraph-editor-status")).toContainText("FRA reduction was applied");
  const hypergraphCoreCalls = await page.evaluate(() => window.__poohHypergraphCoreCalls);
  expect(hypergraphCoreCalls.enumerateTransversals).toBeGreaterThan(0);
  expect(hypergraphCoreCalls.analyzeRExact).toBeGreaterThan(0);
  expect(hypergraphCoreCalls.reduceFra).toBeGreaterThan(0);
  expect(hypergraphCoreCalls.analyzeStructure).toBeGreaterThan(0);
  expect(hypergraphCoreCalls.analyzeCExactSpectrum).toBeGreaterThan(0);
  expect(await page.evaluate(() => window.__poohExportersCoreCalls.editor)).toBeGreaterThan(0);

  await page.locator("#workspace-tab-tools").click();
  await page.locator("#selection-hypergraph-view-select").selectOption("reduced");
  await page.locator("#selection-hypergraph-draw-btn").click();
  await expect(page.locator("#workspace-hypergraph-panel")).toBeVisible();
  await expectHypergraphCanvasHasModel(page);
  await expect(page.locator("#hypergraph-editor-status")).toContainText("after FRA");
  await expect(page.locator("#hypergraph-toggle-reduced-btn")).toBeEnabled();
  await runHypergraphXtrecAndWait(page, "reduced");

  expect(dialogs.some((message) => /WebGPU/.test(message))).toBeTruthy();
  expect(dialogs.some((message) => /WebGL/.test(message))).toBeTruthy();
  expect(consoleErrors).toEqual([]);
});

test("POOH benchmark workflow runs all SoftwareX fixtures and exports CSV/LaTeX", async ({ page }) => {
  test.setTimeout(60000);
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    consoleErrors.push(error.message);
  });

  await page.goto("/");
  await expect(page).toHaveTitle(/POOH/);
  await expect.poll(async () => page.evaluate(() => (
    Boolean(window.PoohBenchmarkCore && typeof window.PoohBenchmarkCore.summarizeBenchmarkRecord === "function")
  ))).toBe(true);
  await page.evaluate(() => {
    window.__poohBenchmarkCoreCalls = { rows: 0, csv: 0, latex: 0 };
    const rowsOriginal = window.PoohBenchmarkCore && window.PoohBenchmarkCore.buildBenchmarkRows;
    if (typeof rowsOriginal === "function") {
      window.PoohBenchmarkCore.buildBenchmarkRows = function(...args) {
        window.__poohBenchmarkCoreCalls.rows += 1;
        return rowsOriginal.apply(this, args);
      };
    }
    const csvOriginal = window.PoohBenchmarkCore && window.PoohBenchmarkCore.buildBenchmarkCsv;
    if (typeof csvOriginal === "function") {
      window.PoohBenchmarkCore.buildBenchmarkCsv = function(...args) {
        window.__poohBenchmarkCoreCalls.csv += 1;
        return csvOriginal.apply(this, args);
      };
    }
    const latexOriginal = window.PoohBenchmarkCore && window.PoohBenchmarkCore.buildBenchmarkLatexTable;
    if (typeof latexOriginal === "function") {
      window.PoohBenchmarkCore.buildBenchmarkLatexTable = function(...args) {
        window.__poohBenchmarkCoreCalls.latex += 1;
        return latexOriginal.apply(this, args);
      };
    }
  });

  await page.locator("#workspace-tab-tools").click();
  await page.locator("#sidebar-tab-lib").click();
  await expect(page.locator("#library-select option[value='lib_softwarex_examples']")).toHaveCount(1, { timeout: 10000 });
  await page.locator("#library-select").selectOption("lib_softwarex_examples");
  await expect(page.locator("#library-status")).toContainText("SoftwareX examples");
  await expect(page.locator("#benchmark-files-select option[value='small_petri_net.pnh']")).toHaveCount(1, { timeout: 10000 });
  await expect(page.locator("#benchmark-files-select option[value='concurrent_control_case.pnh']")).toHaveCount(1, { timeout: 10000 });
  await expect(page.locator("#benchmark-files-select option[value='xt_decomposition_case.pnh']")).toHaveCount(1, { timeout: 10000 });

  await page.locator("#sidebar-tab-bench").click();
  await expect(page.locator("#benchmark-run-btn")).toBeVisible();
  await page.locator("#benchmark-repeat-count").fill("1");
  await page.locator("#benchmark-strata-target").fill("3");
  await page.locator("#benchmark-pinv-mode").selectOption("cover-stop");
  await page.locator("#benchmark-pinv-acceleration").selectOption("compare-cpu-webgpu");
  await page.locator("#benchmark-xtrec-acceleration").selectOption("compare-cpu-webgpu");
  await page.locator("#benchmark-files-select").selectOption([
    "small_petri_net.pnh",
    "concurrent_control_case.pnh",
    "xt_decomposition_case.pnh"
  ]);

  await page.locator("#benchmark-profile-btn").click();
  await expect(page.locator("#benchmark-status")).toContainText("Profiling completed", { timeout: 30000 });
  await page.locator("#benchmark-select-representative-btn").click();
  await expect(page.locator("#benchmark-status")).toContainText("Selected representative sample");
  await page.locator("#workspace-tab-benchmark").click();
  await expect(page.locator("#benchmark-results")).toContainText("Benchmark range profile");
  await expect(page.locator("#benchmark-results")).toContainText("Representative CPU/WebGPU sample");
  await expect(page.locator("#benchmark-results")).toContainText("small_petri_net.pnh");
  const profileDownloadPromise = page.waitForEvent("download");
  await page.locator("#benchmark-export-profile-results-csv-btn").click();
  const profileDownload = await profileDownloadPromise;
  expect(profileDownload.suggestedFilename()).toMatch(/^pooh-benchmark-profile-.*\.csv$/);
  const profileCsv = await readDownloadedText(profileDownload);
  expect(profileCsv).toContain("library,file,size_bytes,format,places,transitions,arcs");
  expect(profileCsv).toContain("\"SoftwareX examples\",\"small_petri_net.pnh\"");

  await page.locator("#workspace-tab-tools").click();
  await page.locator("#sidebar-tab-bench").click();
  await page.locator("#benchmark-run-representative-btn").click();
  await expect(page.locator("#benchmark-status")).toContainText("Benchmarks completed", { timeout: 30000 });
  await expect(page.locator("#compute-modal")).toHaveAttribute("aria-hidden", "true");
  await expect(page.locator("#workspace-tab-benchmark")).toBeVisible();

  await page.locator("#workspace-tab-benchmark").click();
  await expect(page.getByRole("table").filter({ hasText: "Benchmark OK" })).toBeVisible();
  await expect(page.locator("#benchmark-results")).toContainText("small_petri_net.pnh");
  await expect(page.locator("#benchmark-results")).toContainText("concurrent_control_case.pnh");
  await expect(page.locator("#benchmark-results")).toContainText("xt_decomposition_case.pnh");
  await expect(page.locator("#benchmark-results")).toContainText("xCPU");
  expect(await page.evaluate(() => window.__poohBenchmarkCoreCalls.rows)).toBeGreaterThan(0);
  await expect(page.locator("#benchmark-export-csv-btn")).toBeEnabled();
  await expect(page.locator("#benchmark-export-latex-btn")).toBeEnabled();

  const csvDownloadPromise = page.waitForEvent("download");
  await page.locator("#benchmark-export-csv-btn").click();
  const csvDownload = await csvDownloadPromise;
  expect(csvDownload.suggestedFilename()).toMatch(/^pooh-benchmark-.*\.csv$/);
  const csv = await readDownloadedText(csvDownload);
  expect(csv).toContain("library,benchmark,repeats,ok_runs");
  expect(csv).toContain("pinv_speedup_vs_cpu");
  expect(csv).toContain("xtrec_speedup_vs_cpu");
  expect(csv).toContain("env_platform");
  expect(csv).toContain("env_webgpu_supported");
  expect(csv).toContain("\"SoftwareX examples\",\"small_petri_net.pnh\",\"1\",\"1\"");
  expect(csv).toContain("\"SoftwareX examples\",\"concurrent_control_case.pnh\",\"1\",\"1\"");
  expect(csv).toContain("\"SoftwareX examples\",\"xt_decomposition_case.pnh\",\"1\",\"1\"");
  expect(csv).toContain("\"CPU\"");
  expect(csv).toContain("\"WEBGPU\"");
  expect(await page.evaluate(() => window.__poohBenchmarkCoreCalls.csv)).toBeGreaterThan(0);
  await expect(page.locator("#benchmark-status")).toContainText("CSV");

  const latexDownloadPromise = page.waitForEvent("download");
  await page.locator("#benchmark-export-latex-btn").click();
  const latexDownload = await latexDownloadPromise;
  expect(latexDownload.suggestedFilename()).toMatch(/^pooh-benchmark-.*\.tex$/);
  const latex = await readDownloadedText(latexDownload);
  expect(latex).toContain("\\begin{table}");
  expect(latex).toContain("small\\_petri\\_net.pnh");
  expect(latex).toContain("concurrent\\_control\\_case.pnh");
  expect(latex).toContain("xt\\_decomposition\\_case.pnh");
  expect(latex).toContain("WEBGPU");
  expect(latex).toContain("MS xCPU");
  expect(latex).toContain("XT xCPU");
  expect(await page.evaluate(() => window.__poohBenchmarkCoreCalls.latex)).toBeGreaterThan(0);
  await expect(page.locator("#benchmark-latex-output")).toContainText("\\begin{table}");
  await expect(page.locator("#benchmark-status")).toContainText("LaTeX");

  expect(consoleErrors).toEqual([]);
});

test("POOH handles invalid PNH import without corrupting the current canvas", async ({ page }) => {
  test.setTimeout(30000);
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    consoleErrors.push(error.message);
  });

  await page.goto("/");
  await page.locator("#sidebar-tab-io").click();
  await page.locator("#load-pnh-input").setInputFiles(path.join(__dirname, "..", "examples", "small_petri_net", "input.pnh"));
  await expectPetriCanvasHasModel(page);
  const nodesBefore = await page.locator("#canvas [data-kind='node']").count();
  const arcsBefore = await page.locator("#canvas [data-kind='arc']").count();

  const dialogPromise = page.waitForEvent("dialog");
  await page.locator("#load-pnh-input").setInputFiles({
    name: "invalid-smoke.pnh",
    mimeType: "text/plain",
    buffer: Buffer.from("this is not a valid PNH model\n")
  });
  const dialog = await dialogPromise;
  expect(dialog.type()).toBe("alert");
  expect(dialog.message()).toContain("The PNH file could not be loaded");
  await dialog.accept();

  await page.locator("#language-select").selectOption("pl");
  const polishDialogPromise = page.waitForEvent("dialog");
  await page.locator("#load-pnh-input").setInputFiles({
    name: "invalid-smoke-pl.pnh",
    mimeType: "text/plain",
    buffer: Buffer.from("this is not a valid PNH model\n")
  });
  const polishDialog = await polishDialogPromise;
  expect(polishDialog.type()).toBe("alert");
  expect(polishDialog.message()).toContain("Nie udało się wczytać pliku PNH");
  await polishDialog.accept();

  await expect.poll(async () => page.locator("#canvas [data-kind='node']").count()).toBe(nodesBefore);
  await expect.poll(async () => page.locator("#canvas [data-kind='arc']").count()).toBe(arcsBefore);
  expect(consoleErrors).toEqual([]);
});

test("POOH benchmark workflow can be cancelled cleanly", async ({ page }) => {
  test.setTimeout(30000);
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    consoleErrors.push(error.message);
  });
  await page.route("**/library_api.php?action=get_pnh**", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    await route.continue();
  });

  await page.goto("/");
  await page.locator("#workspace-tab-tools").click();
  await page.locator("#sidebar-tab-lib").click();
  await expect(page.locator("#library-select option[value='lib_softwarex_examples']")).toHaveCount(1, { timeout: 10000 });
  await page.locator("#library-select").selectOption("lib_softwarex_examples");
  await expect(page.locator("#benchmark-files-select option[value='xt_decomposition_case.pnh']")).toHaveCount(1, { timeout: 10000 });

  await page.locator("#sidebar-tab-bench").click();
  await page.locator("#benchmark-repeat-count").fill("1");
  await page.locator("#benchmark-pinv-mode").selectOption("cover-stop");
  await page.locator("#benchmark-xtrec-acceleration").selectOption("cpu");
  await page.locator("#benchmark-files-select").selectOption(["xt_decomposition_case.pnh"]);

  await page.locator("#benchmark-run-btn").click();
  await expect(page.locator("#compute-modal")).toHaveAttribute("aria-hidden", "false");
  await expect(page.locator("#compute-modal-cancel-btn")).toBeVisible();
  await page.locator("#compute-modal-cancel-btn").click();
  await expect(page.locator("#benchmark-status")).toContainText("Benchmarks were cancelled", { timeout: 10000 });
  await expect(page.locator("#compute-modal")).toHaveAttribute("aria-hidden", "true");
  await expect(page.locator("#benchmark-run-btn")).toBeEnabled();

  expect(consoleErrors).toEqual([]);
});

test("POOH forced XT generator worker loads shared Petri analysis and XTREC cores", async ({ page }) => {
  test.setTimeout(30000);
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    consoleErrors.push(error.message);
  });

  await page.goto("/");
  await expect(page).toHaveTitle(/POOH/);
  await expect.poll(async () => page.evaluate(() => (
    Boolean(window.PoohPetriAnalysisCore
      && typeof window.PoohPetriAnalysisCore.computeClassificationFor === "function"
      && typeof window.PoohPetriAnalysisCore.computeLivenessSafenessFor === "function")
  ))).toBe(true);

  await page.locator("#sidebar-tab-gen").click();
  await page.locator("#gen-place-count").fill("4");
  await page.locator("#gen-transition-count").fill("4");
  await page.locator("#gen-net-type").selectOption("any");
  await page.locator("#gen-method").selectOption("adaptive");
  await page.locator("#gen-live-option").selectOption("any");
  await page.locator("#gen-safe-option").selectOption("any");
  await page.locator("#gen-redundant-count").fill("0");
  await page.locator("#gen-xt-hypergraph").check();

  await page.locator("#generate-net-btn").click();
  await expect(page.locator("#generate-status")).toContainText("Generation completed", { timeout: 15000 });
  await expect(page.locator("#generate-status")).toContainText("Constructive xt-hypergraph");
  await expect(page.locator("#compute-modal")).toHaveAttribute("aria-hidden", "true");
  await expectPetriCanvasHasModel(page);
  await page.locator("#sidebar-tab-class").click();
  await expect(page.locator("#classification-list")).toContainText("PN");

  expect(consoleErrors).toEqual([]);
});
