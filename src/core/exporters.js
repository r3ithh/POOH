(function(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("./i18n"));
  } else {
    root.PoohExportersCore = factory(root.PoohI18n);
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function(i18n) {
  "use strict";

  function tr(key, params) {
    return i18n && typeof i18n.t === "function" ? i18n.t(key, params) : String(key || "");
  }

  function yesNo(value) {
    return tr(value ? "common.yes" : "common.no");
  }

  function csvCell(value) {
    return `"${String(value ?? "").replace(/"/g, "\"\"")}"`;
  }

  function toCsv(headers, rows) {
    const safeHeaders = Array.isArray(headers) ? headers : [];
    const safeRows = Array.isArray(rows) ? rows : [];
    return [
      safeHeaders.map(csvCell).join(","),
      ...safeRows.map((row) => safeHeaders.map((header) => csvCell(row && row[header])).join(","))
    ].join("\n");
  }

  function latexEscape(value) {
    return String(value ?? "")
      .replace(/\\/g, "\\textbackslash{}")
      .replace(/([&_#$%{}])/g, "\\$1")
      .replace(/\^/g, "\\textasciicircum{}")
      .replace(/~/g, "\\textasciitilde{}");
  }

  function formatInteger(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return "-";
    }
    return String(Math.round(numeric));
  }

  function formatNumber(value, digits) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return "-";
    }
    return numeric.toFixed(Number.isFinite(Number(digits)) ? Number(digits) : 3);
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

  function clamp01(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return 0;
    }
    return Math.max(0, Math.min(1, numeric));
  }

  function naturalLabelCompare(a, b) {
    return String(a ?? "").localeCompare(String(b ?? ""), undefined, { numeric: true, sensitivity: "base" });
  }

  const FUZZY_MEMBERSHIP_DEFAULT_WEIGHTS = Object.freeze({
    base: 0.34,
    concurrency: 0.16,
    noConflict: 0.16,
    timing: 0.16,
    lowCoupling: 0.10,
    lowReconfiguration: 0.08
  });

  function normalizeFuzzyMembershipWeights(weights) {
    const source = weights && typeof weights === "object" ? weights : {};
    return {
      base: clamp01(source.base !== undefined ? source.base : FUZZY_MEMBERSHIP_DEFAULT_WEIGHTS.base),
      concurrency: clamp01(source.concurrency !== undefined ? source.concurrency : FUZZY_MEMBERSHIP_DEFAULT_WEIGHTS.concurrency),
      noConflict: clamp01(source.noConflict !== undefined ? source.noConflict : FUZZY_MEMBERSHIP_DEFAULT_WEIGHTS.noConflict),
      timing: clamp01(source.timing !== undefined ? source.timing : FUZZY_MEMBERSHIP_DEFAULT_WEIGHTS.timing),
      lowCoupling: clamp01(source.lowCoupling !== undefined ? source.lowCoupling : FUZZY_MEMBERSHIP_DEFAULT_WEIGHTS.lowCoupling),
      lowReconfiguration: clamp01(source.lowReconfiguration !== undefined ? source.lowReconfiguration : FUZZY_MEMBERSHIP_DEFAULT_WEIGHTS.lowReconfiguration)
    };
  }

  function formatPinvariantVector(vector) {
    if (!Array.isArray(vector)) {
      return "";
    }
    const allDigits = vector.every((value) => Number.isInteger(value) && value >= 0 && value <= 9);
    return allDigits ? vector.join("") : vector.join(" ");
  }

  function formatSubnetMatrixRow(vector, placesCount) {
    const width = Math.max(0, parseInt(String(placesCount || 0), 10) || 0);
    if (!Array.isArray(vector) || width === 0) {
      return "";
    }
    const chars = [];
    for (let i = 0; i < width; i += 1) {
      chars.push((vector[i] || 0) > 0 ? "1" : "0");
    }
    return chars.join("");
  }

  function formatPinvariantMatrixBlock(result) {
    const safeResult = result && typeof result === "object" ? result : {};
    const placeIds = Array.isArray(safeResult.placeIds) ? safeResult.placeIds : [];
    const invariants = Array.isArray(safeResult.invariants) ? safeResult.invariants : [];
    const lines = [];
    lines.push(`[${placeIds.join(",")}]`);
    lines.push(String(placeIds.length));
    lines.push(String(invariants.length));
    invariants.forEach((inv) => {
      lines.push(formatSubnetMatrixRow(inv && inv.vector ? inv.vector : [], placeIds.length));
    });
    return lines.join("\n");
  }

  function formatPinvariantOutput(result, options) {
    const opts = options && typeof options === "object" ? options : {};
    if (!result || !Array.isArray(result.invariants)) {
      return opts.emptyText || tr("export.pinvariant.empty");
    }
    const lines = [];
    const modeLabel = result.mode === "cover-stop"
      ? tr("export.pinvariant.modeCoverStop")
      : tr("export.pinvariant.modeFull");
    const accelerationUsed = String(result.accelerationUsed || "cpu").toLowerCase();
    const accelerationRequested = String(result.accelerationRequested || accelerationUsed).toLowerCase();
    const accelerationLabel = accelerationUsed === "webgpu" ? "WebGPU (GPU)" : "CPU";
    lines.push(tr("export.pinvariant.algorithm", { mode: modeLabel }));
    lines.push(tr("export.pinvariant.acceleration", { value: accelerationLabel }));
    if (accelerationRequested === "webgpu" && accelerationUsed !== "webgpu") {
      lines.push(tr("export.pinvariant.gpuFallback"));
    }
    if (result.accelerationWarning) {
      lines.push(tr("export.pinvariant.accelerationInfo", { message: result.accelerationWarning }));
    }
    lines.push(tr("export.pinvariant.dimensions", {
      places: Array.isArray(result.placeIds) ? result.placeIds.length : 0,
      transitions: Array.isArray(result.transitionIds) ? result.transitionIds.length : 0
    }));
    lines.push(tr("export.pinvariant.found", { count: result.invariants.length }));
    lines.push(tr("export.pinvariant.stages", { processed: result.processedStages || 0, total: result.totalStages || 0 }));
    if (result.candidateCap) {
      lines.push(tr("export.pinvariant.candidateCap", {
        stage: result.candidateCap,
        final: result.finalCandidateCap || result.candidateCap
      }));
    }
    lines.push(result.earlyStopped
      ? tr("export.pinvariant.stopCovered")
      : tr("export.pinvariant.stopFull"));
    if (result.coveredAllPlaces) {
      lines.push(tr("export.pinvariant.coverage", { value: yesNo(true) }));
    } else if (Array.isArray(result.uncoveredPlaces) && result.uncoveredPlaces.length > 0) {
      lines.push(tr("export.pinvariant.coverageMissing", { value: yesNo(false), places: result.uncoveredPlaces.join(", ") }));
    } else {
      lines.push(tr("export.pinvariant.coverage", { value: yesNo(false) }));
    }
    if (result.wasTrimmed) {
      lines.push(tr("export.pinvariant.trimmed"));
    }
    if (result.memoryGuardTriggered) {
      lines.push(tr("export.pinvariant.memoryGuard"));
    }
    lines.push("");
    lines.push(tr("export.pinvariant.invariants"));
    result.invariants.forEach((inv, index) => {
      const vector = formatPinvariantVector(inv && inv.vector ? inv.vector : []);
      const support = Array.isArray(inv && inv.supportPlaces) ? inv.supportPlaces.join(", ") : "";
      const marker = inv && inv.correctSubnet ? "OK" : "NO";
      lines.push(`${index + 1}. ${vector} | support=[${support}] | subnet=${marker}`);
    });
    return lines.join("\n");
  }

  function buildPinvariantAnalysisRows(result) {
    const safeResult = result && typeof result === "object" ? result : {};
    const rows = [];
    const accelerationUsed = String(safeResult.accelerationUsed || "cpu").toLowerCase();
    const accelerationRequested = String(safeResult.accelerationRequested || accelerationUsed).toLowerCase();
    rows.push({
      key: tr("export.pinvariant.row.acceleration"),
      status: accelerationUsed === "webgpu" ? "OK" : accelerationRequested === "webgpu" ? "WARN" : "OK",
      message: accelerationUsed === "webgpu"
        ? "WebGPU (GPU)."
        : accelerationRequested === "webgpu"
          ? tr("export.pinvariant.webgpuFallback")
          : "CPU."
    });
    rows.push({
      key: tr("export.pinvariant.row.pinvariants"),
      status: "OK",
      message: safeResult.mode === "cover-stop"
        ? tr("export.pinvariant.modeCoverStopSentence")
        : tr("export.pinvariant.modeFullSentence")
    });
    rows.push({
      key: tr("export.pinvariant.row.count"),
      status: Array.isArray(safeResult.invariants) && safeResult.invariants.length > 0 ? "OK" : "WARN",
      message: `${Array.isArray(safeResult.invariants) ? safeResult.invariants.length : 0}.`
    });
    rows.push({
      key: tr("export.pinvariant.row.coverage"),
      status: safeResult.coveredAllPlaces ? "OK" : "NO",
      message: safeResult.coveredAllPlaces
        ? tr("export.pinvariant.baseCovered")
        : tr("export.pinvariant.uncovered", {
          places: (safeResult.uncoveredPlaces || []).join(", ") || tr("export.pinvariant.unknownPlaces")
        })
    });
    const correctCount = Number(safeResult.correctSubnetsCount || 0);
    const allCount = Array.isArray(safeResult.invariants) ? safeResult.invariants.length : 0;
    rows.push({
      key: tr("export.pinvariant.row.validSubnets"),
      status: allCount > 0 && correctCount === allCount ? "OK" : "WARN",
      message: tr("export.pinvariant.validSubnetCriterion", { correct: correctCount, total: allCount })
    });
    rows.push({
      key: tr("export.pinvariant.row.stages"),
      status: safeResult.earlyStopped ? "WARN" : "OK",
      message: tr("export.pinvariant.stageRow", {
        processed: safeResult.processedStages || 0,
        total: safeResult.totalStages || 0,
        suffix: safeResult.earlyStopped ? tr("export.pinvariant.stoppedSuffix") : ""
      })
    });
    if (safeResult.memoryGuardTriggered) {
      rows.push({
        key: tr("export.pinvariant.row.memoryGuard"),
        status: "WARN",
        message: tr("export.pinvariant.memoryGuardLimit", {
          stage: safeResult.candidateCap || "?",
          final: safeResult.finalCandidateCap || "?"
        })
      });
    }
    return rows;
  }

  function hypergraphToText({ matrix, rowLabels, colLabels, title = "Hypergraph" }) {
    const safeMatrix = Array.isArray(matrix) ? matrix : [];
    const safeRows = Array.isArray(rowLabels) ? rowLabels : [];
    const safeCols = Array.isArray(colLabels) ? colLabels : [];
    const lines = [title, `|E|=${safeRows.length}, |V|=${safeCols.length}`];
    safeRows.forEach((label, rowIndex) => {
      const row = Array.isArray(safeMatrix[rowIndex]) ? safeMatrix[rowIndex] : [];
      const members = safeCols.filter((_, colIndex) => Number(row[colIndex] || 0) > 0);
      lines.push(`${label}: {${members.join(", ")}}`);
    });
    return lines.join("\n");
  }

  function transversalsToCsv(result) {
    const labels = Array.isArray(result && result.labels) ? result.labels : [];
    const rows = [];
    (result && Array.isArray(result.minimal) ? result.minimal : []).forEach((indices, index) => {
      rows.push({
        kind: "minimal",
        index: index + 1,
        size: indices.length,
        labels: indices.map((item) => labels[item]).join(" ")
      });
    });
    (result && Array.isArray(result.exact) ? result.exact : []).forEach((indices, index) => {
      rows.push({
        kind: "exact",
        index: index + 1,
        size: indices.length,
        labels: indices.map((item) => labels[item]).join(" ")
      });
    });
    return toCsv(["kind", "index", "size", "labels"], rows);
  }

  function benchmarkRowsToLatex(rows, caption) {
    const safeRows = Array.isArray(rows) ? rows : [];
    const safeCaption = caption || tr("export.benchmark.defaultCaption");
    const lines = [
      "\\begin{table}[ht]",
      "\\centering",
      `\\caption{${latexEscape(safeCaption)}}`,
      "\\begin{tabular}{lrrrr}",
      "\\hline",
      tr("export.benchmark.latexHeader"),
      "\\hline"
    ];
    safeRows.forEach((row) => {
      lines.push(`${latexEscape(row.benchmark)} & ${Number(row.places || 0)} & ${Number(row.transitions || 0)} & ${Number(row.invariants || 0)} & ${latexEscape(row.xt || "-")} \\\\`);
    });
    lines.push("\\hline", "\\end{tabular}", "\\end{table}");
    return lines.join("\n");
  }

  function selectionXtrecStatusText(xtrec) {
    return xtrec && typeof xtrec.isXt === "boolean"
      ? tr("export.selection.xtStatus", {
        value: yesNo(xtrec.isXt),
        acceleration: String(xtrec.accelerationUsed || "cpu").toUpperCase()
      })
      : tr("export.selection.xtNotChecked");
  }

  function summarizeCounterObject(counters) {
    const safe = counters && typeof counters === "object" ? counters : {};
    return Object.values(safe).reduce((sum, value) => {
      const numeric = Number(value);
      return Number.isFinite(numeric) ? sum + numeric : sum;
    }, 0);
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
      return tr("export.transversal.method.backtrackingExact");
    }
    if (safe === "backtrackingregular") {
      return tr("export.transversal.method.backtrackingRegular");
    }
    if (safe === "greedy") {
      return "Greedy";
    }
    return String(methodName || tr("export.transversal.method.fallback"));
  }

  function structuralXtStatusLabel(status) {
    const safe = String(status || "").toLowerCase();
    if (safe === "pass") {
      return "OK";
    }
    if (safe === "fail") {
      return tr("common.no");
    }
    if (safe === "warn") {
      return "WARN";
    }
    if (safe === "unknown") {
      return "?";
    }
    return safe ? safe.toUpperCase() : "-";
  }

  function formatStructuralXtBlock(result) {
    if (!result) {
      return tr("export.structural.notRun");
    }
    const lines = [];
    lines.push(tr("export.structural.title"));
    lines.push(tr("export.structural.conclusion", {
      result: result.structurallyCertified ? tr("export.structural.certificate") : tr("export.structural.noFullCertificate"),
      rules: (result.sufficientRules || []).length ? ` (${result.sufficientRules.join(", ")})` : ""
    }));
    lines.push(tr("export.structural.supportSource", {
      source: result.notes && result.notes.componentSupportSource === "component-places"
        ? tr("export.structural.componentPlaces")
        : tr("export.structural.hypergraphIncidences")
    }));
    (result.rules || []).forEach((rule) => {
      lines.push(`${rule.id}. ${rule.title}: ${structuralXtStatusLabel(rule.status)} - ${rule.summary || ""}`);
      (rule.evidence || []).forEach((entry) => lines.push(`  - ${entry}`));
    });
    return lines.join("\n");
  }

  function formatSelectionHypergraphOutput(result) {
    const safe = result && typeof result === "object" ? result : {};
    const placeIds = Array.isArray(safe.placeIds) ? safe.placeIds : [];
    const subnetMatrix = Array.isArray(safe.subnetMatrix) ? safe.subnetMatrix : [];
    const essentialLabels = Array.isArray(safe.essentialLabels) ? safe.essentialLabels : [];
    const reducedColLabels = Array.isArray(safe.reducedColLabels) ? safe.reducedColLabels : [];
    const reducedRowLabels = Array.isArray(safe.reducedRowLabels) ? safe.reducedRowLabels : [];
    const reducedDualMatrix = Array.isArray(safe.reducedDualMatrix) ? safe.reducedDualMatrix : [];
    const lines = [];
    lines.push(tr("export.selection.method"));
    lines.push("");
    lines.push(tr("export.selection.subnetMatrixInput"));
    lines.push(`[${placeIds.join(",")}]`);
    lines.push(String(placeIds.length));
    lines.push(String(subnetMatrix.length));
    subnetMatrix.forEach((row) => lines.push((Array.isArray(row) ? row : []).join("")));
    lines.push("");
    lines.push(tr("export.selection.essentialVertices", { values: essentialLabels.join(",") }));
    lines.push("");

    if (Array.isArray(safe.originalDualMatrix) && safe.originalDualMatrix.length > 0) {
      lines.push(tr("export.selection.dualBeforeFra"));
      lines.push(`[${(safe.originalColLabels || []).join(",")}]`);
      lines.push(String((safe.originalRowLabels || []).length));
      lines.push(String((safe.originalColLabels || []).length));
      safe.originalDualMatrix.forEach((row) => lines.push((Array.isArray(row) ? row : []).join("")));
      lines.push("");
    }

    lines.push(tr("export.selection.dualAfterFra"));
    lines.push(`[${reducedColLabels.join(",")}]`);
    lines.push(String(reducedRowLabels.length));
    lines.push(String(reducedColLabels.length));
    reducedDualMatrix.forEach((row) => lines.push((Array.isArray(row) ? row : []).join("")));
    lines.push("");

    if (safe.metrics) {
      const transpose = safe.metrics.transpose || {};
      const fra = safe.metrics.fra || {};
      const transposeOps = Number(transpose.cellAssignments || 0) + Number(transpose.supportWrites || 0);
      const fraOps = Number(fra.essentialCellChecks || 0)
        + Number(fra.rowPairComparisons || 0)
        + Number(fra.colPairComparisons || 0)
        + Number(fra.vectorCellComparisons || 0);
      lines.push(tr("export.selection.metric", { name: tr("export.selection.transpose"), ms: formatNumber(Number(transpose.ms || NaN), 3), operations: formatInteger(transposeOps) }));
      lines.push(tr("export.selection.metric", { name: "FRA", ms: formatNumber(Number(fra.ms || NaN), 3), operations: formatInteger(fraOps) }));
      lines.push(tr("export.selection.metric", { name: tr("export.selection.selectionHypergraph"), ms: formatNumber(Number(safe.metrics.totalMs || NaN), 3), operations: formatInteger(transposeOps + fraOps) }));
      lines.push(tr("export.selection.fraReductions", {
        cycles: formatInteger(Number(fra.cycles || 0)),
        rows: formatInteger(Number(fra.removedRows || 0)),
        columns: formatInteger(Number(fra.removedCols || 0))
      }));
      lines.push("");
    }

    lines.push(tr("export.selection.xtBeforeFra", { status: selectionXtrecStatusText(safe.xtrecOriginal).replace(/^XT\/1-exact=/, "") }));
    lines.push(tr("export.selection.xtAfterFra", { status: selectionXtrecStatusText(safe.xtrec).replace(/^XT\/1-exact=/, "") }));
    lines.push("");

    if (safe.xtrec && typeof safe.xtrec.isXt === "boolean") {
      lines.push(tr("export.selection.xtrecAfterFra", { status: safe.xtrec.isXt ? tr("export.xtrec.true") : tr("export.xtrec.false") }));
      lines.push(tr("export.xtrec.mode", { mode: String(safe.xtrec.accelerationUsed || "cpu").toUpperCase() }));
      if (safe.xtrec.accelerationWarning) {
        lines.push(tr("export.common.warning", { message: safe.xtrec.accelerationWarning }));
      }
      lines.push(tr("export.xtrec.checks", { performed: Number(safe.xtrec.checksPerformed || 0), total: Number(safe.xtrec.checksTotal || 0) }));
      if (safe.xtrec.operations) {
        const xtOps = safe.xtrec.operations || {};
        const xtTotalOps = Number(xtOps.projectionOps || 0)
          + Number(xtOps.intersectionChecks || 0)
          + Number(xtOps.minPairComparisons || 0)
          + Number(xtOps.essentialUnionOps || 0)
          + Number(xtOps.veMaskUnionOps || 0)
          + Number(xtOps.starCellChecks || 0)
          + Number(xtOps.projectionEdgeScans || 0);
        lines.push(tr("export.xtrec.operations", {
          total: formatInteger(xtTotalOps),
          projections: formatInteger(Number(xtOps.projectionOps || 0)),
          intersections: formatInteger(Number(xtOps.intersectionChecks || 0)),
          minComparisons: formatInteger(Number(xtOps.minPairComparisons || 0))
        }));
      }
      if (safe.xtrec.witness && safe.xtrec.witness.message) {
        lines.push(tr("export.xtrec.failureWitness", { message: safe.xtrec.witness.message }));
      }
      lines.push("");
    } else if (safe.xtrecPending) {
      lines.push(tr("export.xtrec.running"));
      lines.push("");
    } else {
      lines.push(tr("export.xtrec.notRun"));
      lines.push("");
    }

    if (safe.structuralXt) {
      lines.push(formatStructuralXtBlock(safe.structuralXt));
      lines.push("");
    } else if (safe.structuralXtError) {
      lines.push(tr("export.structural.error", { message: safe.structuralXtError }));
      lines.push("");
    }

    if (safe.transversal && safe.transversal.results) {
      const summary = safe.transversal;
      lines.push(tr("export.transversal.coverageTitle"));
      lines.push(tr("export.transversal.strategy", { strategy: String(summary.strategy || "all").toUpperCase() }));
      if (typeof summary.isXtInput === "boolean") {
        lines.push(tr("export.transversal.inputXt", { value: yesNo(summary.isXtInput) }));
      }
      lines.push(tr("export.transversal.runtime", { ms: formatNumber(Number(summary.runtimeMs || NaN), 3) }));
      lines.push("");

      (Array.isArray(summary.executed) ? summary.executed : []).forEach((key) => {
        const method = summary.results[key];
        if (!method) {
          return;
        }
        const label = transversalMethodLabel(String(key || "").replace(/[^A-Za-z]/g, ""));
        const modeText = method.exact
          ? tr("export.transversal.exact")
          : (method.coversAll ? tr("export.transversal.regular") : tr("export.transversal.none"));
        const sizeText = method.coversAll ? `|D|=${formatInteger(Number(method.size || 0))}` : "|D|=-";
        const opText = `ops=${formatInteger(summarizeCounterObject(method.counters || {}))}`;
        lines.push(`${label}: ${modeText}, ${sizeText}, t=${formatNumber(Number(method.runtimeMs || NaN), 3)} ms, ${opText}`);
        if (Array.isArray(method.solutionLabels) && method.solutionLabels.length > 0) {
          lines.push(`  -> [${method.solutionLabels.join(", ")}]`);
        }
      });
      lines.push("");

      if (summary.recommended && summary.recommended.found) {
        const rec = summary.recommended;
        const recMethod = transversalMethodLabel(String(rec.method || ""));
        lines.push(tr("export.transversal.recommendation", {
          type: rec.type === "exact" ? tr("export.transversal.exactTransversal") : tr("export.transversal.regularTransversal"),
          method: recMethod,
          size: formatInteger(Number(rec.size || 0))
        }));
        lines.push(tr("export.transversal.selectedSubnets", { values: Array.isArray(rec.solutionLabels) ? rec.solutionLabels.join(", ") : "" }));
      } else {
        lines.push(tr("export.transversal.noRecommendation"));
      }
      if (summary.recommendationReason) {
        lines.push(tr("export.transversal.reason", { message: summary.recommendationReason }));
      }
    } else if (safe.transversalPending) {
      lines.push(tr("export.transversal.running"));
    } else {
      lines.push(tr("export.transversal.notRun"));
    }
    return lines.join("\n");
  }

  function buildSelectionHypergraphAnalysisRows(result) {
    const safe = result && typeof result === "object" ? result : {};
    const xtrec = safe.xtrec || null;
    const xtrecKnown = xtrec && typeof xtrec.isXt === "boolean";
    const subnetMatrix = Array.isArray(safe.subnetMatrix) ? safe.subnetMatrix : [];
    const placeIds = Array.isArray(safe.placeIds) ? safe.placeIds : [];
    const essentialLabels = Array.isArray(safe.essentialLabels) ? safe.essentialLabels : [];
    const reducedRowLabels = Array.isArray(safe.reducedRowLabels) ? safe.reducedRowLabels : [];
    const reducedColLabels = Array.isArray(safe.reducedColLabels) ? safe.reducedColLabels : [];
    const originalDualMatrix = Array.isArray(safe.originalDualMatrix) ? safe.originalDualMatrix : [];
    const originalRowLabels = Array.isArray(safe.originalRowLabels) ? safe.originalRowLabels : [];
    const originalColLabels = Array.isArray(safe.originalColLabels) ? safe.originalColLabels : [];
    const rows = [
      {
        key: tr("export.analysis.method"),
        status: "OK",
        message: tr("export.selection.analysisMethod")
      },
      {
        key: tr("export.selection.row.inputSubnets"),
        status: subnetMatrix.length > 0 ? "OK" : "WARN",
        message: tr("export.selection.inputCounts", { subnets: subnetMatrix.length, places: placeIds.length })
      },
      {
        key: tr("export.selection.row.essentialVertices"),
        status: essentialLabels.length > 0 ? "OK" : "WARN",
        message: essentialLabels.length > 0 ? essentialLabels.join(", ") : tr("export.selection.noEssentialVertices")
      },
      {
        key: tr("export.selection.row.selectionHypergraph"),
        status: "OK",
        message: tr("export.selection.reducedMatrix", { rows: reducedRowLabels.length, columns: reducedColLabels.length })
      },
      {
        key: tr("export.selection.row.beforeFra"),
        status: originalDualMatrix.length > 0 ? "OK" : "WARN",
        message: originalDualMatrix.length > 0
          ? tr("export.selection.matrixAndXt", { rows: originalRowLabels.length, columns: originalColLabels.length, xt: selectionXtrecStatusText(safe.xtrecOriginal) })
          : tr("export.selection.noOriginalMatrix")
      },
      {
        key: tr("export.selection.row.afterFra"),
        status: "OK",
        message: tr("export.selection.matrixAndXt", { rows: reducedRowLabels.length, columns: reducedColLabels.length, xt: selectionXtrecStatusText(safe.xtrec) })
      },
      {
        key: tr("export.selection.row.transposeFra"),
        status: safe.metrics ? "OK" : "WARN",
        message: safe.metrics
          ? tr("export.selection.timingMetrics", {
            transpose: formatNumber(Number(safe.metrics.transpose && safe.metrics.transpose.ms || NaN), 3),
            fra: formatNumber(Number(safe.metrics.fra && safe.metrics.fra.ms || NaN), 3),
            selection: formatNumber(Number(safe.metrics.totalMs || NaN), 3)
          })
          : tr("export.selection.noTimingMetrics")
      },
      {
        key: tr("export.selection.row.xtClass"),
        status: xtrecKnown ? (xtrec.isXt ? "OK" : "WARN") : "WARN",
        message: xtrecKnown
          ? (xtrec.isXt ? tr("export.xtrec.yesResult") : tr("export.xtrec.noResult"))
          : tr("export.xtrec.missingResult")
      },
      {
        key: tr("export.selection.row.xtrecMode"),
        status: xtrecKnown ? "OK" : "WARN",
        message: xtrecKnown ? `${String(xtrec.accelerationUsed || "cpu").toUpperCase()}` : tr("common.notRun")
      },
      {
        key: tr("export.selection.row.xtrecOperations"),
        status: xtrec && xtrec.operations ? "OK" : "WARN",
        message: xtrec && xtrec.operations
          ? `${formatInteger(
            Number(xtrec.operations.projectionOps || 0)
            + Number(xtrec.operations.intersectionChecks || 0)
            + Number(xtrec.operations.minPairComparisons || 0)
            + Number(xtrec.operations.essentialUnionOps || 0)
            + Number(xtrec.operations.veMaskUnionOps || 0)
            + Number(xtrec.operations.starCellChecks || 0)
            + Number(xtrec.operations.projectionEdgeScans || 0)
          )} ${tr("export.common.operationsSuffix")}`
          : tr("export.xtrec.noOperationCounters")
      }
    ];

    const structuralXt = safe.structuralXt || null;
    if (structuralXt) {
      rows.push({
        key: tr("export.structural.title"),
        status: structuralXt.structurallyCertified ? "OK" : "WARN",
        message: structuralXt.structurallyCertified
          ? tr("export.structural.sufficientCertificate", { rules: (structuralXt.sufficientRules || []).join(", ") })
          : tr("export.structural.inspectDetails")
      });
      (structuralXt.rules || []).forEach((rule) => {
        rows.push({
          key: tr("export.structural.condition", { id: rule.id }),
          status: rule.status === "pass" ? "OK" : rule.status === "fail" ? "NO" : "WARN",
          message: rule.summary || "-"
        });
      });
    } else if (safe.structuralXtError) {
      rows.push({
        key: tr("export.structural.title"),
        status: "WARN",
        message: safe.structuralXtError
      });
    }

    const transversal = safe.transversal || null;
    if (!transversal || !transversal.results) {
      rows.push({
        key: tr("export.transversal.row.transversals"),
        status: safe.transversalPending ? "WARN" : "NO",
        message: safe.transversalPending ? tr("export.transversal.computing") : tr("export.transversal.missingResult")
      });
      return rows;
    }

    const recommended = transversal.recommended || null;
    rows.push({
      key: tr("export.transversal.row.strategy"),
      status: "OK",
      message: tr("export.transversal.strategyRuntime", {
        strategy: String(transversal.strategy || "all").toUpperCase(),
        ms: formatNumber(Number(transversal.runtimeMs || NaN), 3)
      })
    });
    if (recommended && recommended.found) {
      rows.push({
        key: tr("export.transversal.row.selectedCover"),
        status: recommended.type === "exact" ? "OK" : "WARN",
        message: tr("export.transversal.selectedCover", {
          type: recommended.type === "exact" ? tr("export.transversal.exactCapital") : tr("export.transversal.regularCapital"),
          method: transversalMethodLabel(recommended.method),
          size: formatInteger(Number(recommended.size || 0)),
          subnets: (recommended.solutionLabels || []).join(", ")
        })
      });
    } else {
      rows.push({
        key: tr("export.transversal.row.selectedCover"),
        status: "NO",
        message: tr("export.transversal.noCover")
      });
    }
    rows.push({
      key: tr("export.transversal.row.researchPaths"),
      status: "OK",
      message: Array.isArray(transversal.executed) && transversal.executed.length > 0
        ? transversal.executed.map((name) => transversalMethodLabel(String(name || "").replace(/[^A-Za-z]/g, ""))).join(", ")
        : tr("export.transversal.noMethods")
    });
    return rows;
  }

  function formatSfcModelOutput(result, options) {
    const opts = options && typeof options === "object" ? options : {};
    if (!result || !result.model) {
      return opts.emptyText || tr("export.sfc.modelEmpty");
    }
    const model = result.model;
    const summary = result.summary || {};
    const lines = [];
    lines.push(tr("export.sfc.modelTitle"));
    lines.push("");
    lines.push(tr("export.sfc.name", { value: String(model.name || "POOH_SFC_Model") }));
    lines.push(tr("export.sfc.profile", { value: String(model.profile || "hybrid") }));
    lines.push(tr("export.sfc.synchronization", { value: String(model.syncMode || "handshake") }));
    lines.push(tr("export.sfc.subnets", { count: formatInteger(Array.isArray(model.subnets) ? model.subnets.length : 0) }));
    lines.push(tr("export.sfc.sharedTransitions", { count: formatInteger(Array.isArray(model.sharedTransitions) ? model.sharedTransitions.length : 0) }));
    lines.push(tr("export.sfc.coordinator", { value: yesNo(Boolean(model.coordinatorSt)) }));
    lines.push(tr("export.sfc.codesysPackage", { value: yesNo(Boolean(model.codesysPackage && model.codesysPackage.xml)) }));
    lines.push(tr("export.sfc.tiaPackage", { value: yesNo(Boolean(model.tiaPackage && Array.isArray(model.tiaPackage.sclFiles) && model.tiaPackage.sclFiles.length > 0)) }));
    if (model.maxPlus && model.maxPlus.global) {
      lines.push(tr("export.sfc.maxPlusLambda", { value: formatNumber(Number(model.maxPlus.global.lambda || NaN), 6) }));
      lines.push(tr("export.sfc.maxPlusThroughput", { value: formatNumber(Number(model.maxPlus.global.throughput || NaN), 6) }));
    }
    lines.push("");
    const subnets = Array.isArray(model.subnets) ? model.subnets : [];
    subnets.forEach((subnet, index) => {
      const header = `${index + 1}. ${String(subnet.label || `D${index + 1}`)}`;
      const steps = Array.isArray(subnet.steps) ? subnet.steps : [];
      const transitions = Array.isArray(subnet.transitions) ? subnet.transitions : [];
      lines.push(tr("export.sfc.subnetLine", {
        header,
        steps: steps.length,
        transitions: transitions.length,
        start: String(subnet.initialStep || "-")
      }));
    });
    lines.push("");
    if (summary && typeof summary === "object") {
      lines.push(tr("export.sfc.synthesisTime", { ms: formatNumber(Number(summary.runtimeMs || NaN), 3) }));
      lines.push(tr("export.sfc.synthesisOperations", { count: formatInteger(Number(summary.operations || 0)) }));
      if (summary.note) {
        lines.push(tr("export.common.info", { message: summary.note }));
      }
    }
    return lines.join("\n");
  }

  function formatSfcValidationOutput(result, options) {
    const opts = options && typeof options === "object" ? options : {};
    if (!result || !result.validation) {
      return opts.emptyText || tr("export.sfc.validationEmpty");
    }
    const validation = result.validation;
    const lines = [];
    lines.push(tr("export.sfc.validationTitle"));
    lines.push("");
    lines.push(tr("export.sfc.validationStatus", { value: validation.passed ? tr("export.sfc.consistent") : tr("export.sfc.differences") }));
    lines.push(tr("export.sfc.stepsCompared", { count: formatInteger(Number(validation.stepsChecked || 0)) }));
    lines.push(tr("export.sfc.stepsMismatched", { count: formatInteger(Number(validation.mismatchCount || 0)) }));
    lines.push(tr("export.sfc.comparisonCoverage", { value: formatNumber(Number(validation.coverageRatio || NaN) * 100, 2) }));
    lines.push(tr("export.sfc.averageStepTime", { ms: formatNumber(Number(validation.avgStepMs || NaN), 6) }));
    if (Array.isArray(validation.mismatches) && validation.mismatches.length > 0) {
      lines.push("");
      lines.push(tr("export.sfc.sampleMismatches"));
      validation.mismatches.slice(0, 12).forEach((item) => {
        lines.push(`- k=${formatInteger(Number(item.step || 0))}: PN=[${(item.pn || []).join(",")}], SFC=[${(item.sfc || []).join(",")}]`);
      });
    }
    return lines.join("\n");
  }

  function formatMaxPlusMatrixRow(row) {
    if (!Array.isArray(row)) {
      return "";
    }
    return row.map((value) => {
      if (value === null || value === undefined) {
        return "-inf";
      }
      const numeric = Number(value);
      return Number.isFinite(numeric) ? formatNumber(numeric, 3) : "-inf";
    }).join(" ");
  }

  function formatSfcMaxPlusResultOutput(result, options) {
    const opts = options && typeof options === "object" ? options : {};
    const model = result && result.model ? result.model : null;
    const maxPlus = model && model.maxPlus ? model.maxPlus : null;
    if (!maxPlus) {
      return opts.emptyText || tr("export.sfc.maxPlusEmpty");
    }
    const lines = [];
    lines.push(tr("export.sfc.maxPlusTitle"));
    lines.push("");
    lines.push("Semiring: a⊕b=max(a,b), a⊗b=a+b");
    lines.push(tr("export.maxPlus.stateEquation", { equation: String(maxPlus.equation || "x(k+1)=A⊗x(k)") }));
    lines.push(tr("export.maxPlus.xtModel", { model: String(maxPlus.variant || "xt-synchronized-event-graph") }));
    lines.push(tr("export.maxPlus.subnets", { count: formatInteger(Array.isArray(maxPlus.subnets) ? maxPlus.subnets.length : 0) }));
    if (maxPlus.global) {
      lines.push(tr("export.maxPlus.globalLambda", { value: formatNumber(Number(maxPlus.global.lambda || NaN), 6) }));
      lines.push(tr("export.maxPlus.globalThroughput", { value: formatNumber(Number(maxPlus.global.throughput || NaN), 6) }));
      if (maxPlus.global.note) {
        lines.push(tr("export.common.info", { message: maxPlus.global.note }));
      }
    }
    if (maxPlus.options) {
      lines.push(tr("export.maxPlus.defaultPlaceDelay", { value: formatNumber(Number(maxPlus.options.defaultDelay || NaN), 3) }));
      lines.push(tr("export.maxPlus.syncOverhead", { value: formatNumber(Number(maxPlus.options.syncOverhead || NaN), 3) }));
    }
    lines.push("");
    const subnets = Array.isArray(maxPlus.subnets) ? maxPlus.subnets : [];
    subnets.forEach((subnet, index) => {
      lines.push(`${index + 1}. ${String(subnet.label || `D${index + 1}`)}`);
      lines.push(`   |T|=${formatInteger(Number(subnet.transitionCount || 0))}, |E|=${formatInteger(Number(subnet.edgeCount || 0))}`);
      lines.push(`   lambda=${formatNumber(Number(subnet.lambda || NaN), 6)}, throughput=${formatNumber(Number(subnet.throughput || NaN), 6)}, SCC=${yesNo(subnet.stronglyConnected)}`);
      const transitions = Array.isArray(subnet.transitions) ? subnet.transitions : [];
      lines.push(`   [${transitions.join(",")}]`);
      lines.push(tr("export.maxPlus.matrixA", { rows: formatInteger(transitions.length), columns: formatInteger(transitions.length) }));
      const matrix = Array.isArray(subnet.matrix) ? subnet.matrix : [];
      matrix.forEach((row) => lines.push(`   ${formatMaxPlusMatrixRow(row)}`));
      if (Array.isArray(subnet.sampleTrajectory) && subnet.sampleTrajectory.length > 0) {
        const preview = subnet.sampleTrajectory
          .slice(0, 4)
          .map((step) => `k${formatInteger(Number(step.k || 0))}=[${(step.values || []).map((value) => formatNumber(Number(value || 0), 3)).join(",")}]`)
          .join("; ");
        lines.push(`   traj: ${preview}`);
      }
    });
    if (maxPlus.summary) {
      lines.push("");
      lines.push(tr("export.maxPlus.computationTime", { ms: formatNumber(Number(maxPlus.summary.runtimeMs || NaN), 3) }));
      lines.push(tr("export.common.operations", { count: formatInteger(Number(maxPlus.summary.operations || 0)) }));
    }
    return lines.join("\n");
  }

  function formatFuzzyMembershipWeights(weights) {
    const safe = normalizeFuzzyMembershipWeights(weights);
    return [
      `base=${formatNumber(safe.base, 2)}`,
      `Q=${formatNumber(safe.concurrency, 2)}`,
      `¬C=${formatNumber(safe.noConflict, 2)}`,
      `time=${formatNumber(safe.timing, 2)}`,
      `¬coupling=${formatNumber(safe.lowCoupling, 2)}`,
      `¬reconf=${formatNumber(safe.lowReconfiguration, 2)}`
    ].join(", ");
  }

  function formatFuzzyMembershipDetail(item) {
    const safeItem = item && typeof item === "object" ? item : {};
    const detail = safeItem.detail || null;
    if (!detail) {
      return `${safeItem.label}=${formatNumber(Number(safeItem.mu), 3)}`;
    }
    if (!detail.covered) {
      return `${safeItem.label}=0.000`;
    }
    const components = detail.components || {};
    return `${safeItem.label}=${formatNumber(Number(safeItem.mu), 3)}{Q=${formatNumber(Number(components.concurrency || 0), 2)},¬C=${formatNumber(Number(components.noConflict || 0), 2)},T=${formatNumber(Number(components.timing || 0), 2)},¬δ=${formatNumber(Number(components.lowCoupling || 0), 2)},¬R=${formatNumber(Number(components.lowReconfiguration || 0), 2)}}`;
  }

  function formatFuzzyMembershipOutput(result, options) {
    const opts = options && typeof options === "object" ? options : {};
    if (!result || !result.fuzzy) {
      return opts.emptyText || tr("export.fuzzy.membershipEmpty");
    }
    const model = result.fuzzy.membershipModel || {};
    const alpha = Number(result.options && result.options.alpha);
    const alphaThreshold = Number.isFinite(alpha) ? alpha : 0;
    const lines = [];
    lines.push(tr("export.fuzzy.membershipTitle"));
    lines.push("");
    lines.push("Model: μ=clamp01(base + wQ·Q + wC·(1-C) + wT·time + wδ·(1-coupling) + wR·(1-reconfig))");
    lines.push(tr("export.fuzzy.weights", { values: formatFuzzyMembershipWeights(model.weights) }));
    lines.push(`α-cut: E_j^α={v∈E_j: μ(v,E_j)≥${formatNumber(alphaThreshold, 2)}}`);
    lines.push("");
    lines.push(tr("export.fuzzy.membershipMatrix"));
    (result.fuzzy.membershipRows || []).forEach((row) => {
      const active = (row.values || [])
        .filter((item) => Number(item.mu) > 0)
        .sort((a, b) => Number(b.mu) - Number(a.mu) || naturalLabelCompare(a.label, b.label));
      const alphaLabels = active
        .filter((item) => Number(item.mu) >= alphaThreshold)
        .map((item) => item.label);
      const compact = active.map(formatFuzzyMembershipDetail).join(", ");
      lines.push(`${row.edge}: ${compact || "-"}`);
      lines.push(`   E^α: [${alphaLabels.length > 0 ? alphaLabels.join(", ") : "-"}]`);
    });
    return lines.join("\n");
  }

  function formatCandidateMaxPlusCoverage(maxPlus, size) {
    const mapped = Number(maxPlus && maxPlus.mappedCount || 0);
    const unmapped = Number(maxPlus && maxPlus.unmappedCount || 0);
    const fallbackTotal = mapped + unmapped;
    const total = Number.isFinite(Number(size)) && Number(size) > 0 ? Number(size) : fallbackTotal;
    const coverage = maxPlus && Number.isFinite(Number(maxPlus.coverage))
      ? Number(maxPlus.coverage)
      : (total > 0 ? mapped / total : 0);
    return `${formatInteger(mapped)}/${formatInteger(total)} (${formatNumber(clamp01(coverage), 3)})`;
  }

  function formatFuzzyPipelineOutput(result, options) {
    const opts = options && typeof options === "object" ? options : {};
    if (!result) {
      return opts.emptyText || tr("export.fuzzy.pipelineEmpty");
    }
    const lines = [];
    const isGraphicHypergraph = result.sourceMode === "graphic-hypergraph-exact";
    const resultOptions = result.options || {};
    const constraints = resultOptions.constraints || {};
    const summary = result.summary || {};
    const relationSummary = result.relationSummary || {};
    const fuzzy = result.fuzzy || {};
    lines.push(isGraphicHypergraph ? tr("export.fuzzy.graphicPipelineTitle") : tr("export.fuzzy.petriPipelineTitle"));
    lines.push("");
    lines.push(tr("export.fuzzy.artifactVersion", { version: result.version }));
    lines.push(tr("export.fuzzy.experiment", { id: result.experiment && result.experiment.id ? result.experiment.id : "-" }));
    if (isGraphicHypergraph) {
      lines.push(tr("export.fuzzy.exactSource", { source: result.sourceLabel || tr("export.fuzzy.manualHypergraph") }));
    } else {
      lines.push(tr("export.fuzzy.smcSource", {
        source: result.sourceMode === "exact-transversal"
          ? tr("export.fuzzy.recommendedExactTransversal")
          : tr("export.fuzzy.allValidSubnets")
      }));
    }
    lines.push(tr("export.fuzzy.alphaCut", { alpha: formatNumber(Number(resultOptions.alpha), 2), step: formatNumber(Number(resultOptions.alphaStep || 0.05), 2) }));
    lines.push(tr("export.fuzzy.constraints", {
      components: constraints.maxComponents || "∞",
      coupling: formatNumber(Number(constraints.maxCoupling), 2),
      lambda: formatOptionalNumber(constraints.lambdaLimit, 3)
    }));
    lines.push(tr("export.fuzzy.membershipModel", { values: formatFuzzyMembershipWeights(fuzzy.membershipModel ? fuzzy.membershipModel.weights : null) }));
    lines.push(tr(isGraphicHypergraph ? "export.fuzzy.candidatesRules" : "export.fuzzy.subnetsRules", {
      subnets: formatInteger(Number(summary.subnetCount || 0)),
      rules: formatInteger(Number(summary.ruleCount || 0))
    }));
    if (isGraphicHypergraph) {
      lines.push(tr("export.fuzzy.hypergraphSummary", {
        vertices: formatInteger(Number(relationSummary.candidates || 0)),
        edges: formatInteger(Number(relationSummary.hyperedges || 0)),
        incidences: formatInteger(Number(relationSummary.incidence || 0)),
        coMembership: formatInteger(Number(relationSummary.concurrent || 0))
      }));
      const mappedCount = Number(relationSummary.mappedMaxPlus || 0);
      const candidateCount = Number(relationSummary.mappingCandidates || 0);
      lines.push(result.maxPlus && result.maxPlus.available
        ? tr("export.fuzzy.maxPlusPartial", { mapped: formatInteger(mappedCount), total: formatInteger(Number(summary.subnetCount || 0)), candidates: formatInteger(candidateCount) })
        : tr("export.fuzzy.maxPlusPendingMapping"));
    } else {
      lines.push(tr("export.fuzzy.relationsSummary", {
        conflicts: formatInteger(relationSummary.conflicts),
        sequential: formatInteger(relationSummary.sequential),
        concurrent: formatInteger(relationSummary.concurrent)
      }));
      lines.push(tr("export.fuzzy.reachabilitySummary", {
        states: formatInteger(relationSummary.states),
        safe: yesNo(relationSummary.safe),
        completeness: relationSummary.truncated ? tr("common.incompleteUpper") : tr("common.completeWithinLimit")
      }));
    }
    if (fuzzy.alphaSweep) {
      const sweep = fuzzy.alphaSweep;
      lines.push(tr("export.fuzzy.alphaSweep", {
        levels: formatInteger(Number(sweep.levels || 0)),
        exact: formatInteger(Number(sweep.exactLevels || 0)),
        feasible: formatInteger(Number(sweep.feasibleLevels || 0)),
        maxExact: formatOptionalNumber(sweep.maxExactAlpha, 2),
        best: formatOptionalNumber(sweep.bestAlpha, 2)
      }));
    }
    lines.push("");
    lines.push(tr("export.fuzzy.alphaCutTransversal"));
    (fuzzy.alphaCuts || []).forEach((row) => {
      const labels = row.solutionLabels && row.solutionLabels.length > 0 ? row.solutionLabels.join(",") : "-";
      const marker = row.selected ? "*" : " ";
      const quality = row.quality || {};
      const violations = Array.isArray(row.violations) && row.violations.length > 0
        ? tr("export.fuzzy.violationsSuffix", { values: row.violations.join(", ") })
        : "";
      lines.push(`${marker} α=${formatNumber(row.alpha, 2)}: ${row.found ? "α-exact" : tr("export.transversal.none")} [${labels}], |T|=${formatInteger(Number(row.size || 0))}, E(T)=${formatNumber(quality.quality, 3)}, coupling=${formatNumber(quality.coupling, 3)}, M+=${formatCandidateMaxPlusCoverage(row.maxPlus, row.size)}, λ=${formatOptionalNumber(row.lambda, 3)}, feasible=${yesNo(row.feasible)}${violations}`);
    });
    lines.push("");
    lines.push(tr("export.fuzzy.optimizationTitle"));
    const optimization = fuzzy.optimization || {};
    const best = optimization.best || null;
    if (best && optimization.found) {
      const transversalModel = result.maxPlus && result.maxPlus.transversal ? result.maxPlus.transversal : null;
      const transversalLambda = finiteOrNull(transversalModel && transversalModel.lambda);
      const localLambda = best.maxPlus ? finiteOrNull(best.maxPlus.localLambda) : finiteOrNull(best.localLambda);
      const bestQuality = best.quality || {};
      lines.push(tr("export.fuzzy.optimizationMethod", {
        method: optimization.method,
        kind: optimization.exact ? tr("export.fuzzy.exactParenthetical") : tr("export.fuzzy.heuristicParenthetical")
      }));
      lines.push(`T*: [${(best.selectedLabels || []).join(", ")}], |T|=${formatInteger(best.size)}, E(T)=${formatNumber(bestQuality.quality, 3)}`);
      lines.push(`coverage=${formatNumber(bestQuality.minCoverage, 3)}, redundancy=${formatNumber(bestQuality.redundancy, 3)}, coupling=${formatNumber(bestQuality.coupling, 3)}, M+=${formatCandidateMaxPlusCoverage(best.maxPlus, best.size)}, λ(A_T*)=${formatOptionalNumber(transversalLambda, 6)}, λ_i^max=${formatOptionalNumber(localLambda, 6)}`);
      if (best.maxPlus && Array.isArray(best.maxPlus.unmappedLabels) && best.maxPlus.unmappedLabels.length > 0) {
        lines.push(tr("export.fuzzy.maxPlusUnmapped", { values: best.maxPlus.unmappedLabels.join(", ") }));
      }
      lines.push(tr("export.fuzzy.evaluatedFeasible", { evaluated: formatInteger(optimization.evaluatedCount), feasible: formatInteger(optimization.feasibleCount) }));
    } else {
      lines.push(tr("export.fuzzy.noFeasibleConfiguration", { evaluated: formatInteger(optimization.evaluatedCount || 0) }));
    }
    lines.push("");
    lines.push("μ(v,E_j):");
    (fuzzy.membershipRows || []).forEach((row) => {
      const compact = (row.values || [])
        .filter((item) => Number(item.mu) > 0)
        .map((item) => `${item.label}=${formatNumber(Number(item.mu), 3)}`)
        .join(", ");
      lines.push(`${row.edge}: ${compact || "-"}`);
    });
    return lines.join("\n");
  }

  function formatBinaryRelationMatrix(title, labels, matrix, directed) {
    const safeLabels = Array.isArray(labels) ? labels : [];
    const rows = Array.isArray(matrix) ? matrix : [];
    if (safeLabels.length === 0) {
      return [`${title}: -`];
    }
    const width = Math.max(2, ...safeLabels.map((label) => String(label).length));
    const pad = (value) => String(value).padStart(width, " ");
    const lines = [];
    lines.push(`${title}${directed ? tr("export.relations.directedSuffix") : ""}:`);
    lines.push(`${" ".repeat(width)} ${safeLabels.map(pad).join(" ")}`);
    safeLabels.forEach((label, rowIndex) => {
      const row = Array.isArray(rows[rowIndex]) ? rows[rowIndex] : [];
      const values = safeLabels.map((_, colIndex) => (Number(row[colIndex] || 0) > 0 ? "1" : "."));
      lines.push(`${pad(label)} ${values.map((value) => value.padStart(width, " ")).join(" ")}`);
    });
    return lines;
  }

  function formatFuzzyRelationsOutput(result, options) {
    const opts = options && typeof options === "object" ? options : {};
    const petriXt = result && result.petriXt ? result.petriXt : null;
    if (!petriXt) {
      return opts.emptyText || tr("export.relations.empty");
    }
    if (petriXt.mode === "graphic-hypergraph") {
      const labels = Array.isArray(petriXt.transitions) ? petriXt.transitions : [];
      const hyperedges = Array.isArray(petriXt.hyperedges) ? petriXt.hyperedges : [];
      const matrices = petriXt.matrices || {};
      const counts = petriXt.counts || {};
      const lines = [];
      lines.push(tr("export.relations.manualTitle"));
      lines.push("");
      lines.push(tr("export.hypergraph.vertices", { values: labels.length > 0 ? labels.join(", ") : "-" }));
      lines.push(tr("export.hypergraph.edges", { values: hyperedges.length > 0 ? hyperedges.join(", ") : "-" }));
      lines.push(tr("export.relations.incidenceSummary", {
        incidences: formatInteger(Number(counts.incidence || 0)),
        coMembership: formatInteger(Number(counts.concurrency || 0))
      }));
      lines.push("");
      lines.push(tr("export.relations.sourceTitle"));
      lines.push(tr("export.relations.coMembershipSource"));
      lines.push(tr("export.relations.neutralPetriProfile"));
      lines.push("");
      formatBinaryRelationMatrix(tr("export.relations.coMembershipMatrix"), labels, matrices.concurrency, false).forEach((line) => lines.push(line));
      return lines.join("\n");
    }
    const labels = Array.isArray(petriXt.transitions) ? petriXt.transitions : [];
    const matrices = petriXt.matrices || {};
    const counts = petriXt.counts || {};
    const sources = petriXt.sources || {};
    const lines = [];
    lines.push(tr("export.relations.petriTitle"));
    lines.push("");
    lines.push(tr("export.relations.transitions", { values: labels.length > 0 ? labels.join(", ") : "-" }));
    lines.push(tr("export.relations.reachability", {
      states: formatInteger(Number(petriXt.stateCount || 0)),
      limit: formatInteger(Number(petriXt.statesLimit || 0)),
      safe: yesNo(petriXt.safe),
      completeness: petriXt.complete ? tr("common.completeWithinLimit") : tr("common.incompleteUpper")
    }));
    lines.push(tr("export.relations.counts", {
      conflict: formatInteger(Number(counts.conflict || 0)),
      concurrency: formatInteger(Number(counts.concurrency || 0)),
      sequential: formatInteger(Number(counts.sequential || 0))
    }));
    lines.push("");
    lines.push(tr("export.relations.sourceTitle"));
    lines.push(tr("export.relations.conflictSource", { source: sources.conflict || "-" }));
    lines.push(tr("export.relations.concurrencySource", { source: sources.concurrency || "-" }));
    lines.push(tr("export.relations.sequentialSource", { source: sources.sequential || "-" }));
    if (!petriXt.complete) {
      lines.push(tr("export.relations.incompleteWarning"));
    }
    lines.push("");
    formatBinaryRelationMatrix(tr("export.relations.conflictMatrix"), labels, matrices.conflict, false).forEach((line) => lines.push(line));
    lines.push("");
    formatBinaryRelationMatrix(tr("export.relations.concurrencyMatrix"), labels, matrices.concurrency, false).forEach((line) => lines.push(line));
    lines.push("");
    formatBinaryRelationMatrix(tr("export.relations.sequentialMatrix"), labels, matrices.sequential, true).forEach((line) => lines.push(line));
    return lines.join("\n");
  }

  function formatStandaloneMaxPlusOutput(result, options) {
    const opts = options && typeof options === "object" ? options : {};
    if (!result || !result.maxPlus) {
      return opts.emptyText || tr("export.maxPlus.standaloneEmpty");
    }
    const lines = [];
    const maxPlus = result.maxPlus;
    const resultOptions = result.options || {};
    const summary = result.summary || {};
    lines.push(tr("export.maxPlus.standaloneTitle"));
    lines.push("");
    if (maxPlus.available === false) {
      lines.push(tr("export.maxPlus.pendingMappingStatus"));
      lines.push(maxPlus.note || tr("export.maxPlus.manualNoMatrices"));
      lines.push("");
      lines.push(tr("export.maxPlus.availableNow"));
      lines.push("- fuzzy exact transversal / α-cut,");
      lines.push(tr("export.maxPlus.availableCoupling"));
      lines.push(tr("export.maxPlus.availableTsSketch"));
      return lines.join("\n");
    }
    lines.push(tr("export.maxPlus.equation", { equation: maxPlus.equation }));
    if (maxPlus.global) {
      lines.push(tr("export.maxPlus.globalLambda", { value: formatOptionalNumber(maxPlus.global.lambda, 6) }));
      lines.push(tr("export.maxPlus.globalThroughput", { value: formatOptionalNumber(maxPlus.global.throughput, 6) }));
    }
    if (maxPlus.transversal) {
      const transversal = maxPlus.transversal;
      lines.push("");
      lines.push(tr("export.maxPlus.globalTransversalTitle"));
      lines.push(tr("export.maxPlus.globalTransversalStatus", {
        status: transversal.available ? tr("common.built") : tr("common.noData"),
        complete: yesNo(transversal.complete),
        mapping: formatCandidateMaxPlusCoverage(transversal.mapping, transversal.selectedLabels ? transversal.selectedLabels.length : 0)
      }));
      lines.push(`T*: [${(transversal.selectedLabels || []).join(", ")}]`);
      lines.push(tr("export.maxPlus.transversalPlaces", { values: (transversal.supportPlaces || []).join(", ") }));
      lines.push(tr("export.maxPlus.transversalTransitions", { values: (transversal.transitions || []).join(", ") }));
      lines.push(`|T_A|=${formatInteger(Number(transversal.transitionCount || 0))}, |E_A|=${formatInteger(Number(transversal.edgeCount || 0))}, λ(A_T*)=${formatOptionalNumber(transversal.lambda, 6)}, throughput=${formatOptionalNumber(transversal.throughput, 6)}, SCC=${yesNo(transversal.stronglyConnected)}`);
      if (transversal.criticalCycle) {
        lines.push(tr("export.maxPlus.transversalCriticalCycle", {
          transitions: (transversal.criticalCycle.transitions || []).join(" -> "),
          mean: formatOptionalNumber(transversal.criticalCycle.mean, 6),
          weight: formatOptionalNumber(transversal.criticalCycle.weight, 3)
        }));
      } else {
        lines.push(tr("export.maxPlus.transversalCriticalCycleNone"));
      }
      if (transversal.mapping && Array.isArray(transversal.mapping.unmappedLabels) && transversal.mapping.unmappedLabels.length > 0) {
        lines.push(tr("export.maxPlus.transversalUnmapped", { values: transversal.mapping.unmappedLabels.join(", ") }));
      }
      if (Array.isArray(transversal.matrix) && transversal.matrix.length > 0 && transversal.matrix.length <= 12) {
        lines.push("A_T*:");
        transversal.matrix.forEach((row) => lines.push(`   ${formatMaxPlusMatrixRow(row)}`));
      } else if (Array.isArray(transversal.matrix) && transversal.matrix.length > 12) {
        lines.push(tr("export.maxPlus.matrixHidden", { size: formatInteger(transversal.matrix.length) }));
      }
    }
    lines.push(tr("export.maxPlus.defaultPlaceDelay", { value: formatNumber(Number(resultOptions.defaultDelay), 3) }));
    lines.push(tr("export.maxPlus.syncReconfigOverhead", { value: formatNumber(Number(resultOptions.syncOverhead), 3) }));
    lines.push("");
    (maxPlus.subnets || []).forEach((subnet, index) => {
      lines.push(`${index + 1}. ${subnet.label}`);
      if (subnet.mapping) {
        const mappingLabel = subnet.mapping.label ? `${subnet.mapping.source}:${subnet.mapping.label}` : tr("common.none");
        lines.push(tr("export.maxPlus.mapping", { mapping: mappingLabel, places: (subnet.mapping.places || []).join(", "), transitions: (subnet.mapping.transitions || []).join(", ") }));
      }
      if (subnet.noMaxPlus) {
        lines.push(tr("export.maxPlus.matrixMissing", { note: subnet.note || tr("export.maxPlus.hypervertexUnmapped") }));
        return;
      }
      lines.push(`   |T|=${formatInteger(subnet.transitionCount)}, |E|=${formatInteger(subnet.edgeCount)}, λ=${formatOptionalNumber(subnet.lambda, 6)}, throughput=${formatOptionalNumber(subnet.throughput, 6)}, SCC=${yesNo(subnet.stronglyConnected)}`);
      lines.push(tr("export.maxPlus.transitionsIndented", { values: (subnet.transitions || []).join(", ") }));
      if (subnet.criticalCycle) {
        lines.push(tr("export.maxPlus.criticalCycleIndented", {
          transitions: (subnet.criticalCycle.transitions || []).join(" -> "),
          mean: formatOptionalNumber(subnet.criticalCycle.mean, 6),
          weight: formatOptionalNumber(subnet.criticalCycle.weight, 3)
        }));
      } else {
        lines.push(tr("export.maxPlus.criticalCycleNoneIndented"));
      }
      lines.push("   A:");
      (subnet.matrix || []).forEach((row) => lines.push(`   ${formatMaxPlusMatrixRow(row)}`));
    });
    lines.push("");
    lines.push(tr("export.maxPlus.artifactBuildTime", { ms: formatNumber(Number(summary.runtimeMs || NaN), 3) }));
    return lines.join("\n");
  }

  function formatTakagiSugenoRulesOutput(result, options) {
    const opts = options && typeof options === "object" ? options : {};
    if (!result || !Array.isArray(result.rules) || result.rules.length === 0) {
      return opts.emptyText || tr("export.ts.empty");
    }
    const lines = [];
    lines.push(tr("export.ts.title"));
    lines.push("");
    result.rules.forEach((rule) => {
      const antecedent = rule.antecedent || {};
      const consequent = rule.consequent || {};
      lines.push(tr("export.ts.ruleActivation", { id: rule.id, label: rule.label, value: formatNumber(Number(rule.activation), 3) }));
      lines.push(tr("export.ts.antecedent", {
        concurrency: antecedent.concurrency,
        conflict: antecedent.conflict,
        coupling: antecedent.coupling,
        reconfiguration: antecedent.reconfiguration,
        timing: antecedent.timing
      }));
      lines.push(`THEN ${consequent.equation}, λ=${formatOptionalNumber(consequent.lambda, 6)}, throughput=${formatOptionalNumber(consequent.throughput, 6)}`);
      lines.push(tr("export.ts.source", { source: rule.source }));
      lines.push("");
    });
    if (result.supervisor) {
      const supervisor = result.supervisor;
      const mpc = supervisor.mpc || {};
      const verification = supervisor.verification || {};
      lines.push("");
      lines.push(tr("export.ts.mpcVerification"));
      lines.push(tr("export.ts.supervisorStatus", { status: supervisor.status, horizon: formatInteger(Number(mpc.horizon || 0)) }));
      lines.push(tr("export.ts.configuration", { values: (supervisor.selectedConfiguration || []).join(", ") }));
      lines.push(tr("export.ts.activeRules", { values: (supervisor.activeRules || []).join(", ") }));
      lines.push(`Feasible=${yesNo(mpc.candidateFeasible)}, readiness=${verification.implementationReadiness || "-"}`);
      const unmapped = Array.isArray(verification.maxPlusUnmapped) ? verification.maxPlusUnmapped : [];
      if (verification.maxPlusMappingCoverage === null || verification.maxPlusMappingCoverage === undefined) {
        lines.push(tr("export.ts.noTransversalMapping"));
      } else {
        lines.push(tr("export.ts.maxPlusMapping", {
          coverage: formatOptionalNumber(verification.maxPlusMappingCoverage, 3),
          complete: yesNo(verification.maxPlusMappingComplete),
          requirements: verification.maxPlusMappingOk ? "OK" : "CHECK",
          missing: unmapped.join(", ")
        }));
      }
      if (verification.maxPlusAvailable === false) {
        lines.push(tr("export.ts.verificationMapping", {
          exact: verification.alphaExact || verification.optimizedFeasible ? "OK" : "CHECK",
          timing: verification.timingOk ? "OK" : "CHECK"
        }));
      } else {
        lines.push(tr("export.ts.verification", {
          reachability: verification.reachabilityComplete ? tr("common.complete") : tr("common.incomplete"),
          safe: yesNo(verification.safe),
          timing: verification.timingOk ? "OK" : "CHECK"
        }));
      }
    }
    return lines.join("\n").trim();
  }

  function buildFuzzyRulesCsv(result) {
    const selected = new Set(result && result.fuzzy && result.fuzzy.optimization && result.fuzzy.optimization.best
      ? result.fuzzy.optimization.best.selectedLabels
      : []);
    const experimentId = result && result.experiment ? result.experiment.id : "";
    const header = ["experiment", "rule", "subnet", "selected", "activation", "concurrency", "conflict", "coupling", "reconfiguration", "timing", "lambda", "throughput", "maxplus_available", "transitions"];
    const rows = [header.join(",")];
    (result && result.rules ? result.rules : []).forEach((rule) => {
      const antecedent = rule.antecedent || {};
      const consequent = rule.consequent || {};
      const values = [
        experimentId,
        rule.id,
        rule.label,
        selected.has(rule.label) ? "1" : "0",
        formatNumber(Number(rule.activation), 6),
        antecedent.concurrency,
        antecedent.conflict,
        antecedent.coupling,
        antecedent.reconfiguration,
        antecedent.timing,
        formatOptionalNumber(consequent.lambda, 6),
        formatOptionalNumber(consequent.throughput, 6),
        consequent.maxPlusAvailable ? "1" : "0",
        (consequent.transitions || []).join(" ")
      ];
      rows.push(values.map(csvCell).join(","));
    });
    return rows.join("\n");
  }

  function buildFuzzyAlphaSweepCsv(result) {
    const experimentId = result && result.experiment ? result.experiment.id : "";
    const header = [
      "experiment",
      "alpha",
      "selected_alpha",
      "alpha_exact",
      "feasible",
      "size",
      "E",
      "coverage",
      "redundancy",
      "coupling",
      "maxplus_mapped",
      "maxplus_unmapped",
      "maxplus_coverage",
      "maxplus_unmapped_labels",
      "lambda",
      "lambda_source",
      "lambda_local",
      "lambda_transversal",
      "throughput",
      "solution",
      "candidate_edges",
      "empty_edges",
      "violations"
    ];
    const rows = [header.join(",")];
    (result && result.fuzzy && Array.isArray(result.fuzzy.alphaCuts) ? result.fuzzy.alphaCuts : []).forEach((row) => {
      const quality = row.quality || {};
      const maxPlus = row.maxPlus || {};
      const values = [
        experimentId,
        formatNumber(Number(row.alpha), 2),
        row.selected ? "1" : "0",
        row.found ? "1" : "0",
        row.feasible ? "1" : "0",
        formatInteger(Number(row.size || 0)),
        formatNumber(Number(quality.quality || 0), 6),
        formatNumber(Number(quality.minCoverage || 0), 6),
        formatNumber(Number(quality.redundancy || 0), 6),
        formatNumber(Number(quality.coupling || 0), 6),
        formatInteger(Number(maxPlus.mappedCount || 0)),
        formatInteger(Number(maxPlus.unmappedCount || 0)),
        formatNumber(Number(maxPlus.coverage || 0), 6),
        Array.isArray(maxPlus.unmappedLabels) ? maxPlus.unmappedLabels.join(" ") : "",
        formatOptionalNumber(row.lambda, 6),
        row.lambdaSource || "",
        formatOptionalNumber(row.localLambda, 6),
        formatOptionalNumber(maxPlus.transversalLambda, 6),
        formatOptionalNumber(row.throughput, 6),
        (row.solutionLabels || []).join(" "),
        formatInteger(Number(row.candidateEdgeCount || 0)),
        (row.emptyEdges || []).join(" "),
        (row.violations || []).join(" ")
      ];
      rows.push(values.map(csvCell).join(","));
    });
    return rows.join("\n");
  }

  function buildFuzzyMembershipCsv(result) {
    const experimentId = result && result.experiment ? result.experiment.id : "";
    const alpha = result && result.options ? Number(result.options.alpha) : NaN;
    const alphaThreshold = Number.isFinite(alpha) ? alpha : 0;
    const model = result && result.fuzzy && result.fuzzy.membershipModel ? result.fuzzy.membershipModel : {};
    const weights = normalizeFuzzyMembershipWeights(model.weights);
    const header = [
      "experiment",
      "alpha",
      "edge",
      "subnet",
      "covered",
      "alpha_candidate",
      "mu",
      "raw_mu",
      "component_concurrency",
      "component_no_conflict",
      "component_timing",
      "component_low_coupling",
      "component_low_reconfiguration",
      "contribution_base",
      "contribution_concurrency",
      "contribution_no_conflict",
      "contribution_timing",
      "contribution_low_coupling",
      "contribution_low_reconfiguration",
      "metric_conflict_density",
      "metric_concurrency_density",
      "metric_coupling",
      "metric_shared_transition_ratio",
      "metric_lambda",
      "weight_base",
      "weight_concurrency",
      "weight_no_conflict",
      "weight_timing",
      "weight_low_coupling",
      "weight_low_reconfiguration"
    ];
    const rows = [header.join(",")];
    (result && result.fuzzy && Array.isArray(result.fuzzy.membershipRows) ? result.fuzzy.membershipRows : []).forEach((row) => {
      (row.values || []).forEach((item) => {
        const detail = item && item.detail ? item.detail : null;
        const components = detail && detail.components ? detail.components : {};
        const contributions = detail && detail.contributions ? detail.contributions : {};
        const metrics = detail && detail.metrics ? detail.metrics : {};
        const mu = Number(item && item.mu ? item.mu : 0);
        const values = [
          experimentId,
          formatNumber(alphaThreshold, 2),
          row.edge,
          item.label,
          detail && detail.covered ? "1" : "0",
          mu >= alphaThreshold && mu > 0 ? "1" : "0",
          formatNumber(mu, 6),
          formatOptionalNumber(detail ? detail.raw : null, 6),
          formatOptionalNumber(components.concurrency, 6),
          formatOptionalNumber(components.noConflict, 6),
          formatOptionalNumber(components.timing, 6),
          formatOptionalNumber(components.lowCoupling, 6),
          formatOptionalNumber(components.lowReconfiguration, 6),
          formatOptionalNumber(contributions.base, 6),
          formatOptionalNumber(contributions.concurrency, 6),
          formatOptionalNumber(contributions.noConflict, 6),
          formatOptionalNumber(contributions.timing, 6),
          formatOptionalNumber(contributions.lowCoupling, 6),
          formatOptionalNumber(contributions.lowReconfiguration, 6),
          formatOptionalNumber(metrics.conflictDensity, 6),
          formatOptionalNumber(metrics.concurrencyDensity, 6),
          formatOptionalNumber(metrics.coupling, 6),
          formatOptionalNumber(metrics.sharedTransitionRatio, 6),
          formatOptionalNumber(metrics.lambda, 6),
          formatNumber(weights.base, 6),
          formatNumber(weights.concurrency, 6),
          formatNumber(weights.noConflict, 6),
          formatNumber(weights.timing, 6),
          formatNumber(weights.lowCoupling, 6),
          formatNumber(weights.lowReconfiguration, 6)
        ];
        rows.push(values.map(csvCell).join(","));
      });
    });
    return rows.join("\n");
  }

  function buildFuzzyLatex(result) {
    const lines = [];
    lines.push("\\begin{table}[ht]");
    lines.push("\\centering");
    lines.push(`\\caption{${latexEscape(tr("export.fuzzy.latex.rulesCaption"))}}`);
    lines.push("\\begin{tabular}{llllrr}");
    lines.push("\\hline");
    lines.push(tr("export.fuzzy.latex.rulesHeader"));
    lines.push("\\hline");
    (result && result.rules ? result.rules : []).forEach((rule) => {
      const antecedent = rule.antecedent || {};
      const consequent = rule.consequent || {};
      lines.push(`${latexEscape(rule.id)} & ${latexEscape(rule.label)} & ${latexEscape(antecedent.concurrency)} & ${latexEscape(antecedent.conflict)} & ${formatOptionalNumber(consequent.lambda, 3)} & ${formatNumber(Number(rule.activation), 3)} \\\\`);
    });
    lines.push("\\hline");
    lines.push("\\end{tabular}");
    lines.push("\\end{table}");
    if (result && result.fuzzy && result.fuzzy.membershipModel) {
      const weights = normalizeFuzzyMembershipWeights(result.fuzzy.membershipModel.weights);
      lines.push("");
      lines.push("\\begin{table}[ht]");
      lines.push("\\centering");
      lines.push(`\\caption{${latexEscape(tr("export.fuzzy.latex.weightsCaption"))} $\\mu(v,E)$}`);
      lines.push("\\begin{tabular}{rrrrrr}");
      lines.push("\\hline");
      lines.push("base & $Q$ & $1-C$ & time & $1-coupling$ & $1-reconfig$ \\\\");
      lines.push("\\hline");
      lines.push(`${formatNumber(weights.base, 2)} & ${formatNumber(weights.concurrency, 2)} & ${formatNumber(weights.noConflict, 2)} & ${formatNumber(weights.timing, 2)} & ${formatNumber(weights.lowCoupling, 2)} & ${formatNumber(weights.lowReconfiguration, 2)} \\\\`);
      lines.push("\\hline");
      lines.push("\\end{tabular}");
      lines.push("\\end{table}");
    }
    if (result && result.fuzzy && Array.isArray(result.fuzzy.alphaCuts) && result.fuzzy.alphaCuts.length > 0) {
      lines.push("");
      lines.push("\\begin{table}[ht]");
      lines.push("\\centering");
      lines.push(`\\caption{${latexEscape(tr("export.fuzzy.latex.alphaCaption"))} $\\alpha$}`);
      lines.push("\\begin{tabular}{rrrrrrrl}");
      lines.push("\\hline");
      lines.push("$\\alpha$ & exact & feasible & $|T|$ & $E(T)$ & $M_+$ & $\\lambda$ & $T_\\alpha$ \\\\");
      lines.push("\\hline");
      result.fuzzy.alphaCuts.forEach((row) => {
        const labels = row.solutionLabels && row.solutionLabels.length > 0 ? row.solutionLabels.join(",") : "-";
        const maxPlusMap = row.maxPlus ? `${formatInteger(Number(row.maxPlus.mappedCount || 0))}/${formatInteger(Number(row.size || 0))}` : "-";
        lines.push(`${formatNumber(Number(row.alpha), 2)} & ${row.found ? "yes" : "no"} & ${row.feasible ? "yes" : "no"} & ${formatInteger(Number(row.size || 0))} & ${formatNumber(Number(row.quality && row.quality.quality || 0), 3)} & ${latexEscape(maxPlusMap)} & ${formatOptionalNumber(row.lambda, 3)} & ${latexEscape(labels)} \\\\`);
      });
      lines.push("\\hline");
      lines.push("\\end{tabular}");
      lines.push("\\end{table}");
    }
    if (result && result.fuzzy && result.fuzzy.optimization && result.fuzzy.optimization.best) {
      const best = result.fuzzy.optimization.best;
      const bestQuality = best.quality || {};
      lines.push("");
      lines.push("\\begin{table}[ht]");
      lines.push("\\centering");
      lines.push(`\\caption{${latexEscape(tr("export.fuzzy.latex.optimizationCaption"))}}`);
      lines.push("\\begin{tabular}{lrrrrrr}");
      lines.push("\\hline");
      lines.push("$T^*$ & $|T|$ & $E(T)$ & coupling & $M_+$ & $\\lambda(A_T)$ & feasible \\\\");
      lines.push("\\hline");
      const bestMaxPlusMap = best.maxPlus ? `${formatInteger(Number(best.maxPlus.mappedCount || 0))}/${formatInteger(Number(best.size || 0))}` : "-";
      const bestTransversalLambda = best.maxPlus ? finiteOrNull(best.maxPlus.transversalLambda) : null;
      lines.push(`${latexEscape((best.selectedLabels || []).join(","))} & ${formatInteger(best.size)} & ${formatNumber(bestQuality.quality, 3)} & ${formatNumber(bestQuality.coupling, 3)} & ${latexEscape(bestMaxPlusMap)} & ${formatOptionalNumber(bestTransversalLambda !== null ? bestTransversalLambda : best.lambda, 3)} & ${best.feasible ? "yes" : "no"} \\\\`);
      lines.push("\\hline");
      lines.push("\\end{tabular}");
      lines.push("\\end{table}");
    }
    return lines.join("\n");
  }

  function buildFuzzyTextReport(result, options) {
    if (!result) {
      return "";
    }
    const opts = options && typeof options === "object" ? options : {};
    const title = result.sourceMode === "graphic-hypergraph-exact"
      ? "# POOH fuzzy exact hypergraph -> alpha-cut -> T-S sketch"
      : "# POOH Petri -> XT -> max-plus -> T-S fuzzy";
    return [
      title,
      "",
      formatFuzzyPipelineOutput(result, { emptyText: opts.pipelineEmptyText }),
      "",
      formatFuzzyMembershipOutput(result, { emptyText: opts.membershipEmptyText }),
      "",
      formatFuzzyRelationsOutput(result, { emptyText: opts.relationsEmptyText }),
      "",
      formatStandaloneMaxPlusOutput(result, { emptyText: opts.maxPlusEmptyText }),
      "",
      formatTakagiSugenoRulesOutput(result, { emptyText: opts.rulesEmptyText })
    ].join("\n");
  }

  function formatManualHypergraphOutput(result, options) {
    const opts = options && typeof options === "object" ? options : {};
    if (!result) {
      return opts.emptyText || tr("export.hypergraph.analysisEmpty");
    }
    const colLabels = Array.isArray(result.colLabels) ? result.colLabels : [];
    const rowLabels = Array.isArray(result.rowLabels) ? result.rowLabels : [];
    const matrix = Array.isArray(result.matrix) ? result.matrix : [];
    const lines = [];
    lines.push(tr("export.hypergraph.manualTitle"));
    lines.push("");
    lines.push(tr("export.hypergraph.verticesCount", { count: formatInteger(colLabels.length), values: colLabels.join(", ") }));
    lines.push(tr("export.hypergraph.edgesCount", { count: formatInteger(rowLabels.length), values: rowLabels.join(", ") }));
    rowLabels.forEach((label, rowIndex) => {
      const row = Array.isArray(matrix[rowIndex]) ? matrix[rowIndex] : [];
      const members = colLabels.filter((_, colIndex) => Number(row[colIndex] || 0) > 0);
      lines.push(`${label}: {${members.join(", ")}}`);
    });
    lines.push("");
    if (result.xtrecPending) {
      lines.push(tr("export.xtrec.running"));
    } else if (result.xtrec && typeof result.xtrec.isXt === "boolean") {
      lines.push(tr("export.xtrec.result", { status: result.xtrec.isXt ? tr("export.xtrec.true") : tr("export.xtrec.false") }));
      lines.push(tr("export.xtrec.modeRuntime", { mode: String(result.xtrec.accelerationUsed || "cpu").toUpperCase(), ms: formatNumber(Number(result.xtrec.runtimeMs || NaN), 3) }));
      lines.push(tr("export.xtrec.tests", { performed: formatInteger(Number(result.xtrec.checksPerformed || 0)), total: formatInteger(Number(result.xtrec.checksTotal || 0)) }));
      if (result.xtrec.witness && result.xtrec.witness.message) {
        lines.push(tr("export.common.witness", { message: result.xtrec.witness.message }));
      }
    } else {
      lines.push(tr("export.xtrec.notRun"));
    }
    if (result.structuralXt) {
      lines.push("");
      lines.push(formatStructuralXtBlock(result.structuralXt));
    } else if (result.structuralXtError) {
      lines.push("");
      lines.push(tr("export.structural.error", { message: result.structuralXtError }));
    }
    return lines.join("\n");
  }

  function formatSetLabels(indices, labels) {
    return `[${(Array.isArray(indices) ? indices : []).map((index) => labels[index]).filter(Boolean).join(", ")}]`;
  }

  function formatTransversalSolution(solution) {
    if (!solution || !solution.found) {
      return tr("common.notFound");
    }
    return `${formatSetLabels(solution.indices, solution.labels || [])}, |T|=${formatInteger((solution.indices || []).length)}`;
  }

  function formatAllTransversalBlock(result) {
    if (!result) {
      return tr("export.hypergraph.allTransversalsNotRun");
    }
    const minimal = Array.isArray(result.minimal) ? result.minimal : [];
    const exact = Array.isArray(result.exact) ? result.exact : [];
    const labels = Array.isArray(result.labels) ? result.labels : [];
    const lines = [];
    lines.push(tr("export.hypergraph.allMinimal", {
      count: formatInteger(minimal.length),
      suffix: result.truncated ? tr("export.hypergraph.truncatedSuffix") : ""
    }));
    minimal.slice(0, 80).forEach((indices, index) => {
      lines.push(`  T${index + 1}=${formatSetLabels(indices, labels)}`);
    });
    if (minimal.length > 80) {
      lines.push(`  ... +${formatInteger(minimal.length - 80)}`);
    }
    lines.push(tr("export.hypergraph.allExact", {
      count: formatInteger(exact.length),
      suffix: result.truncated ? tr("export.hypergraph.truncatedSuffix") : ""
    }));
    exact.slice(0, 80).forEach((indices, index) => {
      lines.push(`  X${index + 1}=${formatSetLabels(indices, labels)}`);
    });
    if (exact.length > 80) {
      lines.push(`  ... +${formatInteger(exact.length - 80)}`);
    }
    lines.push(tr("export.hypergraph.searchSpace", { checked: formatInteger(result.checkedSubsets), total: formatInteger(result.totalSubsets) }));
    return lines.join("\n");
  }

  function formatHypergraphStructureBlock(result) {
    if (!result) {
      return tr("export.hypergraph.classificationNotRun");
    }
    const lines = [];
    lines.push(tr("export.hypergraph.classificationTitle"));
    lines.push(tr("export.hypergraph.dimensions", { vertices: formatInteger(result.vertexCount), edges: formatInteger(result.edgeCount), rank: formatInteger(result.rank), minEdge: formatInteger(result.minEdgeSize) }));
    lines.push(tr("export.hypergraph.uniform", { value: result.isUniform ? tr("export.hypergraph.uniformYes", { value: formatInteger(result.uniformity) }) : yesNo(false) }));
    lines.push(tr("export.hypergraph.linear", { value: result.isLinear ? yesNo(true) : tr("export.hypergraph.linearNo", { value: formatInteger(result.maxIntersection) }) }));
    lines.push(tr("export.hypergraph.simple", { value: result.isSimple ? yesNo(true) : tr("export.hypergraph.simpleNo", { count: formatInteger(result.duplicateEdgeCount) }) }));
    lines.push(tr("export.hypergraph.clutter", { value: result.isClutter ? yesNo(true) : `${yesNo(false)}${result.containedText ? ` (${result.containedText})` : ""}` }));
    lines.push(tr("export.hypergraph.regular", { value: result.isRegular
      ? tr("export.hypergraph.regularYes", { value: formatInteger(result.regularity) })
      : tr("export.hypergraph.regularNo", { min: formatInteger(result.minDegree), max: formatInteger(result.maxDegree) }) }));
    lines.push(`c-exact: ${result.cExactSummary || "-"}`);
    if (result.note) {
      lines.push(tr("export.common.warning", { message: result.note }));
    }
    return lines.join("\n");
  }

  function formatHypergraphCExactBlock(result) {
    if (!result) {
      return tr("export.hypergraph.cExactNotRun");
    }
    const labels = Array.isArray(result.labels) ? result.labels : [];
    const lines = [];
    lines.push(tr("export.hypergraph.cExactTitle"));
    lines.push(tr("export.hypergraph.cExactLevels", { levels: formatInteger((result.levels || []).length), solutions: formatInteger(Number(result.solutionCount || 0)) }));
    lines.push(tr("export.hypergraph.searchSpace", { checked: formatInteger(Number(result.checkedSubsets || 0)), total: formatInteger(Number(result.totalSubsets || 0)) }));
    (result.levels || []).forEach((level) => {
      const example = Array.isArray(level.example) && level.example.length
        ? tr("export.hypergraph.exampleSuffix", { value: formatSetLabels(level.example, labels) })
        : "";
      lines.push(`c=${formatInteger(Number(level.cValue || 0))}: ${formatInteger(Number(level.count || 0))}${example}`);
    });
    const selected = result.selected || ((result.candidates || [])[0] || null);
    if (selected) {
      lines.push(tr("export.hypergraph.selectedCExact", { c: formatInteger(Number(selected.cValue || 0)), value: formatSetLabels(selected.indices || [], labels) }));
    }
    if (result.truncated || result.note) {
      lines.push(tr("export.common.warning", { message: result.note || tr("export.hypergraph.cExactReportLimit") }));
    }
    return lines.join("\n");
  }

  function formatHypergraphRExactBlock(result) {
    if (!result) {
      return tr("export.hypergraph.rExactNotRun");
    }
    const lines = [];
    lines.push(tr("export.hypergraph.rExactResult", { value: yesNo(result.isRExact), r: formatInteger(Number(result.targetR || 0)) }));
    lines.push(tr("export.hypergraph.rStar", { value: formatInteger(Number(result.rStar || 0)) }));
    lines.push(tr("export.hypergraph.xtAsOneExact", { value: yesNo(result.isOneExact) }));
    lines.push(tr("export.hypergraph.transversalCounts", { minimal: formatInteger(Number(result.minimalCount || 0)), exact: formatInteger(Number(result.exactCount || 0)) }));
    if (result.truncated) {
      lines.push(tr("export.hypergraph.rExactTruncated"));
    }
    if (result.witness) {
      lines.push(tr("export.hypergraph.rStarWitness", {
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
      lines.push(tr("export.hypergraph.rDistribution", { distribution }));
    }
    return lines.join("\n");
  }

  function formatHypergraphEditorOutput(input, options) {
    const payload = input && typeof input === "object" ? input : {};
    const opts = options && typeof options === "object" ? options : {};
    const matrix = Array.isArray(payload.matrix) ? payload.matrix : [];
    const rowLabels = Array.isArray(payload.rowLabels) ? payload.rowLabels : [];
    const colLabels = Array.isArray(payload.colLabels) ? payload.colLabels : [];
    const reducedResult = payload.reducedResult || null;
    const analysis = payload.analysis && typeof payload.analysis === "object" ? payload.analysis : {};
    if (colLabels.length === 0 && rowLabels.length === 0) {
      return opts.emptyText || tr("export.hypergraph.analysisEmpty");
    }

    const lines = [];
    lines.push(tr("export.hypergraph.graphicTitle"));
    lines.push("");
    lines.push(tr("export.hypergraph.verticesCount", { count: formatInteger(colLabels.length), values: colLabels.join(", ") }));
    lines.push(tr("export.hypergraph.edgesCount", { count: formatInteger(rowLabels.length), values: rowLabels.join(", ") }));
    rowLabels.forEach((label, rowIndex) => {
      const row = Array.isArray(matrix[rowIndex]) ? matrix[rowIndex] : [];
      const members = colLabels.filter((_, colIndex) => Number(row[colIndex] || 0) > 0);
      lines.push(`${label}: {${members.join(", ")}}`);
    });

    if (reducedResult) {
      const fra = reducedResult.metrics || {};
      lines.push("");
      lines.push(`FRA: ${rowLabels.length}x${colLabels.length} -> ${(reducedResult.reducedRowLabels || []).length}x${(reducedResult.reducedColLabels || []).length}`);
      lines.push(tr("export.hypergraph.removedEdges", { values: (reducedResult.removedRowLabels || []).join(", ") }));
      lines.push(tr("export.hypergraph.removedVertices", { values: (reducedResult.removedColLabels || []).join(", ") }));
      lines.push(tr("export.hypergraph.essentialVertices", { values: (reducedResult.essentialLabels || []).join(", ") }));
      lines.push(tr("export.hypergraph.fraOperations", {
        rows: formatInteger(Number(fra.rowPairComparisons || 0)),
        columns: formatInteger(Number(fra.colPairComparisons || 0)),
        cells: formatInteger(Number(fra.vectorCellComparisons || 0))
      }));
    }

    if (analysis.transversal) {
      lines.push("");
      lines.push(tr("export.hypergraph.transversal", { value: formatTransversalSolution(analysis.transversal) }));
    }
    if (analysis.exactTransversal) {
      lines.push(tr("export.hypergraph.exactTransversal", { value: formatTransversalSolution(analysis.exactTransversal) }));
    }
    if (analysis.allTransversals) {
      lines.push("");
      lines.push(formatAllTransversalBlock(analysis.allTransversals));
    }
    if (analysis.structure) {
      lines.push("");
      lines.push(formatHypergraphStructureBlock(analysis.structure));
    }
    if (analysis.cExact) {
      lines.push("");
      lines.push(formatHypergraphCExactBlock(analysis.cExact));
    }
    if (analysis.rExact) {
      lines.push("");
      lines.push(formatHypergraphRExactBlock(analysis.rExact));
    }
    if (analysis.structuralXt) {
      lines.push("");
      lines.push(formatStructuralXtBlock(analysis.structuralXt));
    }
    if (analysis.xtrec) {
      const xt = analysis.xtrec;
      lines.push("");
      lines.push(tr("export.xtrec.result", { status: xt.isXt ? tr("export.xtrec.true") : tr("export.xtrec.false") }));
      lines.push(tr("export.xtrec.modeRuntime", { mode: String(xt.accelerationUsed || "cpu").toUpperCase(), ms: formatNumber(Number(xt.runtimeMs || NaN), 3) }));
      if (xt.witness && xt.witness.message) {
        lines.push(tr("export.common.witness", { message: xt.witness.message }));
      }
    }
    return lines.join("\n");
  }

  return {
    csvCell,
    toCsv,
    latexEscape,
    formatInteger,
    formatNumber,
    formatOptionalNumber,
    formatPinvariantVector,
    formatSubnetMatrixRow,
    formatPinvariantMatrixBlock,
    formatPinvariantOutput,
    buildPinvariantAnalysisRows,
    hypergraphToText,
    transversalsToCsv,
    benchmarkRowsToLatex,
    selectionXtrecStatusText,
    formatStructuralXtBlock,
    formatSelectionHypergraphOutput,
    buildSelectionHypergraphAnalysisRows,
    formatSfcModelOutput,
    formatSfcValidationOutput,
    formatMaxPlusMatrixRow,
    formatSfcMaxPlusResultOutput,
    normalizeFuzzyMembershipWeights,
    formatFuzzyMembershipWeights,
    formatFuzzyMembershipDetail,
    formatFuzzyMembershipOutput,
    formatCandidateMaxPlusCoverage,
    formatFuzzyPipelineOutput,
    formatBinaryRelationMatrix,
    formatFuzzyRelationsOutput,
    formatStandaloneMaxPlusOutput,
    formatTakagiSugenoRulesOutput,
    buildFuzzyRulesCsv,
    buildFuzzyAlphaSweepCsv,
    buildFuzzyMembershipCsv,
    buildFuzzyLatex,
    buildFuzzyTextReport,
    formatManualHypergraphOutput,
    formatSetLabels,
    formatTransversalSolution,
    formatAllTransversalBlock,
    formatHypergraphStructureBlock,
    formatHypergraphCExactBlock,
    formatHypergraphRExactBlock,
    formatHypergraphEditorOutput
  };
});
