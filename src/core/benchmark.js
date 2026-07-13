(function(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("./i18n"));
  } else {
    root.PoohBenchmarkCore = factory(root.PoohI18n);
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function(i18n) {
  "use strict";

  function tr(key, params) {
    return i18n && typeof i18n.t === "function" ? i18n.t(key, params) : String(key || "");
  }

  function toFiniteNumber(value) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : NaN;
  }

  function mean(values) {
    const safe = (Array.isArray(values) ? values : []).filter((value) => Number.isFinite(value));
    if (safe.length === 0) {
      return NaN;
    }
    return safe.reduce((sum, value) => sum + value, 0) / safe.length;
  }

  function median(values) {
    const safe = (Array.isArray(values) ? values : []).filter((value) => Number.isFinite(value)).slice().sort((a, b) => a - b);
    if (safe.length === 0) {
      return NaN;
    }
    const mid = Math.floor(safe.length / 2);
    return safe.length % 2 === 1 ? safe[mid] : (safe[mid - 1] + safe[mid]) / 2;
  }

  function formatNumber(value, digits) {
    if (!Number.isFinite(value)) {
      return "-";
    }
    return Number(value).toFixed(digits);
  }

  function formatInteger(value) {
    if (!Number.isFinite(value)) {
      return "-";
    }
    return String(Math.round(value));
  }

  function escapeLatex(value) {
    return String(value || "")
      .replace(/\\/g, "\\textbackslash{}")
      .replace(/([{}_#$%&])/g, "\\$1")
      .replace(/\^/g, "\\textasciicircum{}")
      .replace(/~/g, "\\textasciitilde{}");
  }

  function summarizeBooleanLabel(values) {
    const safe = (Array.isArray(values) ? values : []).filter((value) => typeof value === "boolean");
    if (safe.length === 0) {
      return "-";
    }
    if (safe.every(Boolean)) {
      return tr("common.yes");
    }
    if (safe.every((value) => !value)) {
      return tr("common.no");
    }
    return "MIX";
  }

  function structuralRuleStatusLabel(status) {
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

  function summarizeStructuralRuleStatus(values) {
    const safe = (Array.isArray(values) ? values : [])
      .map((value) => String(value || "").toLowerCase())
      .filter(Boolean);
    if (safe.length === 0) {
      return "-";
    }
    const first = safe[0];
    return safe.every((value) => value === first) ? structuralRuleStatusLabel(first) : "MIX";
  }

  function summarizeTextLabel(values) {
    const safe = (Array.isArray(values) ? values : [])
      .map((value) => String(value || "").trim())
      .filter(Boolean);
    if (safe.length === 0) {
      return "-";
    }
    const first = safe[0];
    return safe.every((value) => value === first) ? first : "MIX";
  }

  function summarizeBenchmarkRecord(record) {
    const runs = Array.isArray(record && record.runs) ? record.runs : [];
    const okRuns = runs.filter((run) => !run.error);
    const failedRuns = runs.length - okRuns.length;
    const firstOk = okRuns[0] || null;

    const summary = {
      fileName: String(record && record.fileName ? record.fileName : ""),
      libraryName: String(record && record.libraryName ? record.libraryName : ""),
      repeats: runs.length,
      okRuns: okRuns.length,
      failedRuns,
      places: firstOk ? firstOk.places : NaN,
      transitions: firstOk ? firstOk.transitions : NaN,
      invariantsCount: firstOk ? firstOk.invariantsCount : NaN,
      correctSubnetsCount: firstOk ? firstOk.correctSubnetsCount : NaN,
      hypergraphEdges: firstOk ? firstOk.hypergraphEdges : NaN,
      hypergraphVertices: firstOk ? firstOk.hypergraphVertices : NaN,
      hypergraphMinEdgeSize: firstOk ? firstOk.hypergraphMinEdgeSize : NaN,
      hypergraphMaxEdgeSize: firstOk ? firstOk.hypergraphMaxEdgeSize : NaN,
      pinvariantMsMedian: median(okRuns.map((run) => toFiniteNumber(run.pinvariantMs))),
      transposeMsMedian: median(okRuns.map((run) => toFiniteNumber(run.transposeMs))),
      fraMsMedian: median(okRuns.map((run) => toFiniteNumber(run.fraMs))),
      selectionMsMedian: median(okRuns.map((run) => toFiniteNumber(run.selectionMs))),
      xtrecMsMedian: median(okRuns.map((run) => toFiniteNumber(run.xtrecMs))),
      pinvariantAccelerationRequested: summarizeTextLabel(
        okRuns.map((run) => run.pinvariantAccelerationRequested || (record && record.pinvariantAccelerationRequested))
      ),
      pinvariantAccelerationUsed: summarizeTextLabel(okRuns.map((run) => run.pinvariantAccelerationUsed)),
      xtrecAccelerationRequested: summarizeTextLabel(
        okRuns.map((run) => run.xtrecAccelerationRequested || (record && record.xtrecAccelerationRequested))
      ),
      xtrecAccelerationUsed: summarizeTextLabel(okRuns.map((run) => run.xtrecAccelerationUsed)),
      pinvariantSpeedupVsCpu: NaN,
      xtrecSpeedupVsCpu: NaN,
      pinvariantDotOpsMean: mean(okRuns.map((run) => toFiniteNumber(run.pinvariantDotOps))),
      pinvariantCombinationOpsMean: mean(okRuns.map((run) => toFiniteNumber(run.pinvariantCombinationOps))),
      transposeOpsMean: mean(okRuns.map((run) => toFiniteNumber(run.transposeOps))),
      fraOpsMean: mean(okRuns.map((run) => toFiniteNumber(run.fraOps))),
      selectionOpsMean: mean(okRuns.map((run) => toFiniteNumber(run.selectionOps))),
      xtrecProjectionOpsMean: mean(okRuns.map((run) => toFiniteNumber(run.xtrecProjectionOps))),
      xtrecCheckOpsMean: mean(okRuns.map((run) => toFiniteNumber(run.xtrecChecks))),
      xtrecMinPairOpsMean: mean(okRuns.map((run) => toFiniteNumber(run.xtrecMinPairComparisons))),
      xtrecTotalOpsMean: mean(okRuns.map((run) => toFiniteNumber(run.xtrecTotalOps))),
      xtClass: "-",
      structuralXtCertified: summarizeBooleanLabel(okRuns.map((run) => run.structuralXtCertified)),
      structuralXtSufficientRules: summarizeTextLabel(okRuns.map((run) => run.structuralXtSufficientRules)),
      structuralXtR1: summarizeStructuralRuleStatus(okRuns.map((run) => run.structuralXtR1)),
      structuralXtR2: summarizeStructuralRuleStatus(okRuns.map((run) => run.structuralXtR2)),
      structuralXtR3: summarizeStructuralRuleStatus(okRuns.map((run) => run.structuralXtR3)),
      structuralXtR4: summarizeStructuralRuleStatus(okRuns.map((run) => run.structuralXtR4)),
      structuralXtR5: summarizeStructuralRuleStatus(okRuns.map((run) => run.structuralXtR5)),
      structuralXtR6: summarizeStructuralRuleStatus(okRuns.map((run) => run.structuralXtR6)),
      environmentPlatform: summarizeEnvironmentValue(record, "platform"),
      environmentHardwareConcurrency: summarizeEnvironmentValue(record, "hardwareConcurrency"),
      environmentDeviceMemoryGb: summarizeEnvironmentValue(record, "deviceMemoryGb"),
      environmentWebGpuSupported: summarizeEnvironmentValue(record, "webGpuSupported"),
      environmentWebGlSupported: summarizeEnvironmentValue(record, "webGlSupported"),
      environmentUserAgent: summarizeEnvironmentValue(record, "userAgent")
    };

    if (okRuns.length > 0) {
      const xtValues = okRuns
        .map((run) => (typeof run.xtClass === "boolean" ? run.xtClass : null))
        .filter((value) => value !== null);
      if (xtValues.length === okRuns.length && xtValues.length > 0) {
        summary.xtClass = xtValues.every(Boolean) ? tr("common.yes") : (xtValues.every((value) => !value) ? tr("common.no") : "MIX");
      } else if (xtValues.length > 0) {
        summary.xtClass = "MIX";
      }
    }

    summary.lastError = failedRuns > 0
      ? runs.map((run) => run.error).filter(Boolean).slice(-1)[0] || tr("core.benchmark.unknownError")
      : "";
    return summary;
  }

  function summarizeEnvironmentValue(record, key) {
    const runs = Array.isArray(record && record.runs) ? record.runs : [];
    const values = [];
    if (record && record.environment && record.environment[key] !== undefined && record.environment[key] !== null) {
      values.push(record.environment[key]);
    }
    runs.forEach((run) => {
      if (run && run.environment && run.environment[key] !== undefined && run.environment[key] !== null) {
        values.push(run.environment[key]);
      }
    });
    return summarizeTextLabel(values);
  }

  function benchmarkGroupKey(row) {
    return `${String(row.libraryName || "")}\u0000${String(row.fileName || "")}`;
  }

  function computeSpeedup(cpuMs, currentMs) {
    const baseline = toFiniteNumber(cpuMs);
    const current = toFiniteNumber(currentMs);
    if (!Number.isFinite(baseline) || !Number.isFinite(current) || baseline <= 0 || current <= 0) {
      return NaN;
    }
    return baseline / current;
  }

  function applyBenchmarkSpeedups(rows) {
    const baselines = new Map();
    rows.forEach((row) => {
      const key = benchmarkGroupKey(row);
      if (!baselines.has(key)) {
        baselines.set(key, { pinvariantCpu: [], xtrecCpu: [] });
      }
      const entry = baselines.get(key);
      if (String(row.pinvariantAccelerationUsed || "").toUpperCase() === "CPU" && Number.isFinite(row.pinvariantMsMedian)) {
        entry.pinvariantCpu.push(row.pinvariantMsMedian);
      }
      if (String(row.xtrecAccelerationUsed || "").toUpperCase() === "CPU" && Number.isFinite(row.xtrecMsMedian)) {
        entry.xtrecCpu.push(row.xtrecMsMedian);
      }
    });

    rows.forEach((row) => {
      const entry = baselines.get(benchmarkGroupKey(row));
      const pinvariantCpu = entry ? median(entry.pinvariantCpu) : NaN;
      const xtrecCpu = entry ? median(entry.xtrecCpu) : NaN;
      row.pinvariantSpeedupVsCpu = computeSpeedup(pinvariantCpu, row.pinvariantMsMedian);
      row.xtrecSpeedupVsCpu = computeSpeedup(xtrecCpu, row.xtrecMsMedian);
    });
    return rows;
  }

  function buildBenchmarkRows(records) {
    return applyBenchmarkSpeedups((Array.isArray(records) ? records : []).map((record) => summarizeBenchmarkRecord(record)));
  }

  const benchmarkCsvHeader = [
    "library",
    "benchmark",
    "repeats",
    "ok_runs",
    "places",
    "transitions",
    "invariants",
    "correct_subnets",
    "h_edges",
    "h_vertices",
    "h_min_edge_size",
    "h_max_edge_size",
    "pinv_accel_requested",
    "pinv_accel_used",
    "pinv_speedup_vs_cpu",
    "xt_class",
    "xtrec_accel_requested",
    "xtrec_accel_used",
    "xtrec_speedup_vs_cpu",
    "xt_structural_cert",
    "xt_structural_sufficient_rules",
    "xt_R1",
    "xt_R2",
    "xt_R3",
    "xt_R4",
    "xt_R5",
    "xt_R6",
    "t_ms_martinez_median",
    "t_ms_transpose_median",
    "t_ms_fra_median",
    "t_ms_selection_hypergraph_median",
    "t_ms_xtrec_median",
    "ops_ms_dot_mean",
    "ops_ms_comb_mean",
    "ops_transpose_mean",
    "ops_fra_mean",
    "ops_selection_total_mean",
    "ops_xtrec_projection_mean",
    "ops_xtrec_checks_mean",
    "ops_xtrec_min_pairs_mean",
    "ops_xtrec_total_mean",
    "env_platform",
    "env_hardware_concurrency",
    "env_device_memory_gb",
    "env_webgpu_supported",
    "env_webgl_supported",
    "env_user_agent",
    "last_error"
  ];

  const benchmarkProfileCsvHeader = [
    "library",
    "file",
    "size_bytes",
    "format",
    "places",
    "transitions",
    "arcs",
    "marked_places",
    "tokens_total",
    "arc_density",
    "warnings",
    "error"
  ];

  function csvCell(value) {
    const safe = value === null || value === undefined ? "" : String(value);
    return `"${safe.replace(/"/g, "\"\"")}"`;
  }

  function buildBenchmarkCsv(records) {
    const rows = buildBenchmarkRows(records);
    const csvLines = [benchmarkCsvHeader.join(",")];
    rows.forEach((row) => {
      const values = [
        row.libraryName,
        row.fileName,
        row.repeats,
        row.okRuns,
        formatInteger(row.places),
        formatInteger(row.transitions),
        formatInteger(row.invariantsCount),
        formatInteger(row.correctSubnetsCount),
        formatInteger(row.hypergraphEdges),
        formatInteger(row.hypergraphVertices),
        formatInteger(row.hypergraphMinEdgeSize),
        formatInteger(row.hypergraphMaxEdgeSize),
        row.pinvariantAccelerationRequested,
        row.pinvariantAccelerationUsed,
        formatNumber(row.pinvariantSpeedupVsCpu, 6),
        row.xtClass,
        row.xtrecAccelerationRequested,
        row.xtrecAccelerationUsed,
        formatNumber(row.xtrecSpeedupVsCpu, 6),
        row.structuralXtCertified,
        row.structuralXtSufficientRules,
        row.structuralXtR1,
        row.structuralXtR2,
        row.structuralXtR3,
        row.structuralXtR4,
        row.structuralXtR5,
        row.structuralXtR6,
        formatNumber(row.pinvariantMsMedian, 6),
        formatNumber(row.transposeMsMedian, 6),
        formatNumber(row.fraMsMedian, 6),
        formatNumber(row.selectionMsMedian, 6),
        formatNumber(row.xtrecMsMedian, 6),
        formatInteger(row.pinvariantDotOpsMean),
        formatInteger(row.pinvariantCombinationOpsMean),
        formatInteger(row.transposeOpsMean),
        formatInteger(row.fraOpsMean),
        formatInteger(row.selectionOpsMean),
        formatInteger(row.xtrecProjectionOpsMean),
        formatInteger(row.xtrecCheckOpsMean),
        formatInteger(row.xtrecMinPairOpsMean),
        formatInteger(row.xtrecTotalOpsMean),
        row.environmentPlatform,
        row.environmentHardwareConcurrency,
        row.environmentDeviceMemoryGb,
        row.environmentWebGpuSupported,
        row.environmentWebGlSupported,
        row.environmentUserAgent,
        row.lastError || ""
      ].map(csvCell);
      csvLines.push(values.join(","));
    });
    return csvLines.join("\n");
  }

  function buildBenchmarkProfileRows(records) {
    return (Array.isArray(records) ? records : []).map((record) => ({
      libraryName: String(record && record.libraryName ? record.libraryName : ""),
      fileName: String(record && record.fileName ? record.fileName : ""),
      sizeBytes: toFiniteNumber(record && record.sizeBytes),
      format: String(record && record.format ? record.format : ""),
      places: toFiniteNumber(record && record.places),
      transitions: toFiniteNumber(record && record.transitions),
      arcs: toFiniteNumber(record && record.arcs),
      markedPlaces: toFiniteNumber(record && record.markedPlaces),
      tokensTotal: toFiniteNumber(record && record.tokensTotal),
      arcDensity: toFiniteNumber(record && record.arcDensity),
      warnings: String(record && record.warnings ? record.warnings : ""),
      error: String(record && record.error ? record.error : "")
    }));
  }

  function buildBenchmarkProfileCsv(records) {
    const rows = buildBenchmarkProfileRows(records);
    const csvLines = [benchmarkProfileCsvHeader.join(",")];
    rows.forEach((row) => {
      const values = [
        row.libraryName,
        row.fileName,
        formatInteger(row.sizeBytes),
        row.format,
        formatInteger(row.places),
        formatInteger(row.transitions),
        formatInteger(row.arcs),
        formatInteger(row.markedPlaces),
        formatInteger(row.tokensTotal),
        formatNumber(row.arcDensity, 6),
        row.warnings,
        row.error
      ].map(csvCell);
      csvLines.push(values.join(","));
    });
    return csvLines.join("\n");
  }

  function compareProfileRowsByName(a, b) {
    const libraryCompare = String(a && a.libraryName ? a.libraryName : "").localeCompare(
      String(b && b.libraryName ? b.libraryName : ""),
      "pl",
      { numeric: true, sensitivity: "base" }
    );
    if (libraryCompare !== 0) {
      return libraryCompare;
    }
    return String(a && a.fileName ? a.fileName : "").localeCompare(
      String(b && b.fileName ? b.fileName : ""),
      "pl",
      { numeric: true, sensitivity: "base" }
    );
  }

  function profileRowKey(row) {
    return `${String(row && row.libraryName ? row.libraryName : "")}\u0000${String(row && row.fileName ? row.fileName : "")}`;
  }

  function profileRowComplexity(row) {
    const places = toFiniteNumber(row && row.places);
    const transitions = toFiniteNumber(row && row.transitions);
    const arcs = toFiniteNumber(row && row.arcs);
    return (Number.isFinite(places) ? places : 0)
      + (Number.isFinite(transitions) ? transitions : 0)
      + (Number.isFinite(arcs) ? arcs : 0);
  }

  function compareProfileRowsByComplexity(a, b) {
    const complexityCompare = profileRowComplexity(a) - profileRowComplexity(b);
    return complexityCompare !== 0 ? complexityCompare : compareProfileRowsByName(a, b);
  }

  function buildSizeStrata(rows) {
    const sorted = (Array.isArray(rows) ? rows : []).slice().sort(compareProfileRowsByComplexity);
    const result = new Map();
    const total = sorted.length;
    sorted.forEach((row, index) => {
      let stratum = "small";
      if (total > 2) {
        if (index >= Math.ceil((total * 2) / 3)) {
          stratum = "large";
        } else if (index >= Math.ceil(total / 3)) {
          stratum = "medium";
        }
      } else if (total === 2 && index === 1) {
        stratum = "large";
      }
      result.set(profileRowKey(row), stratum);
    });
    return result;
  }

  function countBy(values) {
    const result = {};
    (Array.isArray(values) ? values : []).forEach((value) => {
      const key = String(value || "unknown");
      result[key] = (result[key] || 0) + 1;
    });
    return result;
  }

  function maxBy(rows, scoreFn) {
    let best = null;
    let bestScore = Number.NEGATIVE_INFINITY;
    (Array.isArray(rows) ? rows : []).forEach((row) => {
      const score = toFiniteNumber(scoreFn(row));
      if (!Number.isFinite(score)) {
        return;
      }
      if (best === null || score > bestScore || (score === bestScore && compareProfileRowsByName(row, best) < 0)) {
        best = row;
        bestScore = score;
      }
    });
    return best;
  }

  function minBy(rows, scoreFn) {
    let best = null;
    let bestScore = Number.POSITIVE_INFINITY;
    (Array.isArray(rows) ? rows : []).forEach((row) => {
      const score = toFiniteNumber(scoreFn(row));
      if (!Number.isFinite(score)) {
        return;
      }
      if (best === null || score < bestScore || (score === bestScore && compareProfileRowsByName(row, best) < 0)) {
        best = row;
        bestScore = score;
      }
    });
    return best;
  }

  function selectRepresentativeBenchmarkProfileRows(records, options) {
    const opts = options && typeof options === "object" ? options : {};
    const requestedTarget = Number.isFinite(Number(opts.targetSize)) ? Math.floor(Number(opts.targetSize)) : 12;
    const targetSize = Math.max(1, Math.min(100, requestedTarget));
    const includeErrors = Boolean(opts.includeErrors);
    const rows = buildBenchmarkProfileRows(records).sort(compareProfileRowsByName);
    const parseableRows = rows
      .filter((row) => !row.error && Number.isFinite(row.places) && Number.isFinite(row.transitions) && row.places > 0 && row.transitions > 0)
      .sort(compareProfileRowsByComplexity);
    const warningRows = parseableRows.filter((row) => String(row.warnings || "").trim());
    const errorRows = rows.filter((row) => row.error).sort(compareProfileRowsByName);
    const sizeStrata = buildSizeStrata(parseableRows);
    const selected = [];
    const selectedKeys = new Set();

    function add(row, reason) {
      if (!row || selected.length >= targetSize) {
        return false;
      }
      const key = profileRowKey(row);
      if (selectedKeys.has(key)) {
        return false;
      }
      selectedKeys.add(key);
      selected.push(Object.assign({}, row, {
        rank: selected.length + 1,
        complexity: profileRowComplexity(row),
        sizeStratum: sizeStrata.get(key) || (row.error ? "error" : "unknown"),
        selectionReason: reason
      }));
      return true;
    }

    if (parseableRows.length > 0) {
      add(parseableRows[0], tr("core.benchmark.reason.smallest"));
      add(parseableRows[Math.floor(parseableRows.length / 2)], tr("core.benchmark.reason.median"));
      add(parseableRows[parseableRows.length - 1], tr("core.benchmark.reason.largest"));
      add(minBy(parseableRows, (row) => row.arcDensity), tr("core.benchmark.reason.lowestArcDensity"));
      add(maxBy(parseableRows, (row) => row.arcDensity), tr("core.benchmark.reason.highestArcDensity"));
      add(maxBy(warningRows, (row) => profileRowComplexity(row)), tr("core.benchmark.reason.parserWarning"));
      add(maxBy(parseableRows, (row) => (toFiniteNumber(row.tokensTotal) * 1000) + toFiniteNumber(row.markedPlaces)), tr("core.benchmark.reason.largestInitialMarking"));
      add(maxBy(parseableRows, (row) => toFiniteNumber(row.transitions) / Math.max(1, toFiniteNumber(row.places))), tr("core.benchmark.reason.transitionDominance"));
      add(maxBy(parseableRows, (row) => toFiniteNumber(row.places) / Math.max(1, toFiniteNumber(row.transitions))), tr("core.benchmark.reason.placeDominance"));

      const bins = ["small", "medium", "large"].map((stratum) => ({
        stratum,
        rows: parseableRows
          .filter((row) => sizeStrata.get(profileRowKey(row)) === stratum)
          .slice()
          .sort(compareProfileRowsByComplexity)
      }));
      let cursor = 0;
      while (selected.length < targetSize && bins.some((bin) => bin.rows.length > 0)) {
        const bin = bins[cursor % bins.length];
        cursor += 1;
        while (bin.rows.length > 0 && selectedKeys.has(profileRowKey(bin.rows[0]))) {
          bin.rows.shift();
        }
        if (bin.rows.length > 0) {
          add(bin.rows.shift(), tr("core.benchmark.reason.stratumFill", { stratum: bin.stratum }));
        }
      }

      parseableRows
        .slice()
        .sort((a, b) => compareProfileRowsByComplexity(b, a))
        .forEach((row) => add(row, tr("core.benchmark.reason.largestFill")));
    }

    if (includeErrors && selected.length < targetSize) {
      errorRows.forEach((row) => {
        add(Object.assign({}, row), tr("core.benchmark.reason.invalidInputControl"));
      });
    }

    return {
      targetSize,
      selectedRows: selected,
      selectedFileNames: selected.map((row) => row.fileName),
      totalRows: rows.length,
      parseableRows: parseableRows.length,
      warningRows: warningRows.length,
      errorRows: errorRows.length,
      skippedErrorRows: includeErrors ? [] : errorRows,
      sizeStrata: countBy(parseableRows.map((row) => sizeStrata.get(profileRowKey(row)))),
      selectedSizeStrata: countBy(selected.map((row) => row.sizeStratum))
    };
  }

  function buildBenchmarkLatexTable(records) {
    const rows = buildBenchmarkRows(records);
    if (rows.length === 0) {
      return "";
    }

    const lines = [];
    lines.push("\\begin{table}[ht]");
    lines.push("\\centering");
    lines.push("\\scriptsize");
    lines.push(`\\caption{${escapeLatex(tr("core.benchmark.latexCaption"))}}`);
    lines.push("\\begin{tabular}{lrrrrrrrrrrrllrlllrlllllll}");
    lines.push("\\hline");
    lines.push("Benchmark & |P| & |T| & Inv & MS [ms] & Tr [ms] & FRA [ms] & Hsel [ms] & XTREC [ms] & Ops MS & Ops Tr+FRA & Ops XTREC & MS Req & MS Used & MS xCPU & XT & XT Req & XT Used & XT xCPU & Cert & R1 & R2 & R3 & R4 & R5 & R6 \\\\");
    lines.push("\\hline");
    rows.forEach((row) => {
      lines.push(
        `${escapeLatex(row.fileName)} & ${formatInteger(row.places)} & ${formatInteger(row.transitions)} & ${formatInteger(row.invariantsCount)} & ${formatNumber(row.pinvariantMsMedian, 3)} & ${formatNumber(row.transposeMsMedian, 3)} & ${formatNumber(row.fraMsMedian, 3)} & ${formatNumber(row.selectionMsMedian, 3)} & ${formatNumber(row.xtrecMsMedian, 3)} & ${formatInteger(row.pinvariantDotOpsMean + row.pinvariantCombinationOpsMean)} & ${formatInteger(row.selectionOpsMean)} & ${formatInteger(row.xtrecTotalOpsMean)} & ${escapeLatex(row.pinvariantAccelerationRequested)} & ${escapeLatex(row.pinvariantAccelerationUsed)} & ${formatNumber(row.pinvariantSpeedupVsCpu, 3)} & ${escapeLatex(row.xtClass)} & ${escapeLatex(row.xtrecAccelerationRequested)} & ${escapeLatex(row.xtrecAccelerationUsed)} & ${formatNumber(row.xtrecSpeedupVsCpu, 3)} & ${escapeLatex(row.structuralXtCertified)} & ${escapeLatex(row.structuralXtR1)} & ${escapeLatex(row.structuralXtR2)} & ${escapeLatex(row.structuralXtR3)} & ${escapeLatex(row.structuralXtR4)} & ${escapeLatex(row.structuralXtR5)} & ${escapeLatex(row.structuralXtR6)} \\\\`
      );
    });
    lines.push("\\hline");
    lines.push("\\end{tabular}");
    lines.push("\\end{table}");
    return lines.join("\n");
  }

  return {
    toFiniteNumber,
    mean,
    median,
    formatNumber,
    formatInteger,
    escapeLatex,
    summarizeBooleanLabel,
    structuralRuleStatusLabel,
    summarizeStructuralRuleStatus,
    summarizeTextLabel,
    summarizeEnvironmentValue,
    summarizeBenchmarkRecord,
    applyBenchmarkSpeedups,
    buildBenchmarkRows,
    buildBenchmarkCsv,
    buildBenchmarkProfileRows,
    buildBenchmarkProfileCsv,
    selectRepresentativeBenchmarkProfileRows,
    buildBenchmarkLatexTable,
    benchmarkCsvHeader: benchmarkCsvHeader.slice(),
    benchmarkProfileCsvHeader: benchmarkProfileCsvHeader.slice()
  };
});
