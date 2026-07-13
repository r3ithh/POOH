(function(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("./max-plus"));
  } else {
    root.PoohFuzzyTransversalCore = factory(root.PoohMaxPlusCore);
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function(maxPlusDependency) {
  "use strict";

  const maxPlusCore = maxPlusDependency || {};

  const clamp01 = typeof maxPlusCore.clamp01 === "function"
    ? maxPlusCore.clamp01
    : function(value) {
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) {
        return 0;
      }
      return Math.max(0, Math.min(1, numeric));
    };

  const finiteOrNull = typeof maxPlusCore.finiteOrNull === "function"
    ? maxPlusCore.finiteOrNull
    : function(value) {
      if (value === null || value === undefined || value === "") {
        return null;
      }
      const numeric = Number(value);
      return Number.isFinite(numeric) ? numeric : null;
    };

  const naturalLabelCompare = typeof maxPlusCore.naturalLabelCompare === "function"
    ? maxPlusCore.naturalLabelCompare
    : function(a, b) {
      return String(a ?? "").localeCompare(String(b ?? ""), undefined, { numeric: true, sensitivity: "base" });
    };

  function solveAlphaExactCover(placeIds, entries, membership, alpha) {
    const safePlaceIds = Array.isArray(placeIds) ? placeIds : [];
    const labels = (Array.isArray(entries) ? entries : []).map((entry) => entry.label);
    const rowCandidates = new Map();
    safePlaceIds.forEach((placeId) => {
      const row = membership && typeof membership.get === "function" ? membership.get(placeId) || new Map() : new Map();
      const candidates = labels.filter((label) => {
        const mu = Number(row.get(label) || 0);
        return mu > 0 && mu >= alpha;
      });
      rowCandidates.set(placeId, new Set(candidates));
    });

    if (safePlaceIds.some((placeId) => (rowCandidates.get(placeId) || new Set()).size === 0)) {
      return { found: false, solutionLabels: [], rowCandidates };
    }

    const selected = [];
    const coveredRows = new Set();

    function recurse() {
      if (coveredRows.size === safePlaceIds.length) {
        return true;
      }
      let chosenRow = null;
      let chosenCandidates = null;
      safePlaceIds.forEach((placeId) => {
        if (coveredRows.has(placeId)) {
          return;
        }
        const candidates = Array.from(rowCandidates.get(placeId) || [])
          .filter((label) => safePlaceIds.some((rowId) => !coveredRows.has(rowId) && (rowCandidates.get(rowId) || new Set()).has(label)))
          .sort(naturalLabelCompare);
        if (chosenCandidates === null || candidates.length < chosenCandidates.length) {
          chosenRow = placeId;
          chosenCandidates = candidates;
        }
      });
      if (!chosenRow || !chosenCandidates || chosenCandidates.length === 0) {
        return false;
      }

      for (const label of chosenCandidates) {
        const rowsCoveredByLabel = safePlaceIds.filter((placeId) => (rowCandidates.get(placeId) || new Set()).has(label));
        if (rowsCoveredByLabel.some((placeId) => coveredRows.has(placeId))) {
          continue;
        }
        rowsCoveredByLabel.forEach((placeId) => coveredRows.add(placeId));
        selected.push(label);
        if (recurse()) {
          return true;
        }
        selected.pop();
        rowsCoveredByLabel.forEach((placeId) => coveredRows.delete(placeId));
      }
      return false;
    }

    const found = recurse();
    return {
      found,
      solutionLabels: found ? selected.slice().sort(naturalLabelCompare) : [],
      rowCandidates
    };
  }

  function computeSelectedCoupling(solutionLabels, couplingByLabel) {
    const labels = Array.from(new Set(solutionLabels || [])).map(String).sort(naturalLabelCompare);
    if (labels.length <= 1) {
      return 0;
    }
    let sum = 0;
    let pairs = 0;
    for (let i = 0; i < labels.length; i += 1) {
      for (let j = i + 1; j < labels.length; j += 1) {
        const a = labels[i];
        const b = labels[j];
        const source = couplingByLabel && typeof couplingByLabel.get === "function" ? couplingByLabel.get(a) : couplingByLabel && couplingByLabel[a];
        const match = source && Array.isArray(source.sharedWith)
          ? source.sharedWith.find((item) => String(item.label) === b)
          : null;
        sum += match ? Number(match.normalized || 0) : 0;
        pairs += 1;
      }
    }
    return pairs > 0 ? clamp01(sum / pairs) : 0;
  }

  function computeSelectedLambda(solutionLabels, maxPlusByLabel) {
    const lambdas = Array.from(new Set(solutionLabels || []))
      .map((label) => {
        const item = maxPlusByLabel && typeof maxPlusByLabel.get === "function" ? maxPlusByLabel.get(label) : maxPlusByLabel && maxPlusByLabel[label];
        return item ? finiteOrNull(item.lambda) : null;
      })
      .filter((value) => value !== null);
    return lambdas.length > 0 ? Math.max(...lambdas) : null;
  }

  function evaluateSelectedMaxPlusMapping(solutionLabels, maxPlusByLabel) {
    const labels = Array.from(new Set(solutionLabels || [])).map(String).sort(naturalLabelCompare);
    const mappedLabels = [];
    const unmappedLabels = [];
    const lambdaKnownLabels = [];
    labels.forEach((label) => {
      const item = maxPlusByLabel && typeof maxPlusByLabel.get === "function" ? maxPlusByLabel.get(label) : maxPlusByLabel && maxPlusByLabel[label];
      const hasModel = Boolean(item && !item.noMaxPlus);
      if (hasModel) {
        mappedLabels.push(label);
        if (finiteOrNull(item.lambda) !== null) {
          lambdaKnownLabels.push(label);
        }
      } else {
        unmappedLabels.push(label);
      }
    });
    const mappedCount = mappedLabels.length;
    const unmappedCount = unmappedLabels.length;
    const coverage = labels.length > 0 ? mappedCount / labels.length : 0;
    return {
      mappedCount,
      unmappedCount,
      coverage: clamp01(coverage),
      complete: labels.length > 0 && unmappedCount === 0,
      mappedLabels,
      unmappedLabels,
      lambdaKnownCount: lambdaKnownLabels.length,
      lambdaUnknownCount: Math.max(0, mappedCount - lambdaKnownLabels.length)
    };
  }

  function evaluateFuzzyTransversal(solutionLabels, placeIds, membership, couplingByLabel) {
    const solutionSet = new Set(solutionLabels || []);
    if (solutionSet.size === 0) {
      return { quality: 0, minCoverage: 0, redundancy: 0, coupling: 0 };
    }
    const safePlaceIds = Array.isArray(placeIds) ? placeIds : [];
    let globalQuality = 1;
    let minCoverage = 1;
    let minRedundancy = 1;
    safePlaceIds.forEach((placeId) => {
      const row = membership && typeof membership.get === "function" ? membership.get(placeId) || new Map() : new Map();
      const values = Array.from(solutionSet).map((label) => Number(row.get(label) || 0)).filter((value) => value > 0);
      const coverage = values.length > 0 ? Math.max(...values) : 0;
      let redundancy = 1;
      for (let i = 0; i < values.length; i += 1) {
        for (let j = i + 1; j < values.length; j += 1) {
          redundancy = Math.min(redundancy, 1 - Math.min(values[i], values[j]));
        }
      }
      const localQuality = Math.min(coverage, redundancy);
      globalQuality = Math.min(globalQuality, localQuality);
      minCoverage = Math.min(minCoverage, coverage);
      minRedundancy = Math.min(minRedundancy, redundancy);
    });
    const coupling = computeSelectedCoupling(Array.from(solutionSet), couplingByLabel);
    return {
      quality: clamp01(globalQuality),
      minCoverage: clamp01(minCoverage),
      redundancy: clamp01(minRedundancy),
      coupling: clamp01(coupling)
    };
  }

  function buildOptimizationCandidate(solutionLabels, placeIds, membership, couplingByLabel, maxPlusByLabel, constraints, evaluatedCount, globalMaxPlusResolver) {
    const labels = Array.from(new Set(solutionLabels || [])).map(String).sort(naturalLabelCompare);
    const quality = evaluateFuzzyTransversal(labels, placeIds, membership, couplingByLabel);
    const localLambda = computeSelectedLambda(labels, maxPlusByLabel);
    const maxPlus = evaluateSelectedMaxPlusMapping(labels, maxPlusByLabel);
    const lambdaLimit = constraints && constraints.lambdaLimit !== null && constraints.lambdaLimit !== undefined
      ? Number(constraints.lambdaLimit)
      : null;
    const lambdaLimitActive = lambdaLimit !== null && Number.isFinite(lambdaLimit);
    let transversalMaxPlus = null;
    let lambda = localLambda;
    let lambdaSource = "local-max";
    if (lambdaLimitActive && maxPlus.complete && typeof globalMaxPlusResolver === "function") {
      transversalMaxPlus = globalMaxPlusResolver(labels, false);
      const transversalLambda = finiteOrNull(transversalMaxPlus && transversalMaxPlus.lambda);
      if (transversalLambda !== null) {
        lambda = transversalLambda;
        lambdaSource = "A_T";
      }
    }
    if (transversalMaxPlus) {
      maxPlus.transversalLambda = finiteOrNull(transversalMaxPlus.lambda);
      maxPlus.transversalThroughput = finiteOrNull(transversalMaxPlus.throughput);
      maxPlus.transversalEdgeCount = Number(transversalMaxPlus.edgeCount || 0);
      maxPlus.transversalTransitionCount = Number(transversalMaxPlus.transitionCount || 0);
    }
    maxPlus.localLambda = localLambda;
    maxPlus.lambdaSource = lambdaSource;
    const maxComponents = constraints && constraints.maxComponents ? Number(constraints.maxComponents) : null;
    const maxCoupling = constraints && Number.isFinite(Number(constraints.maxCoupling))
      ? Number(constraints.maxCoupling)
      : 1;
    const violations = [];
    if (maxComponents && labels.length > maxComponents) {
      violations.push("size");
    }
    if (quality.coupling > maxCoupling + 0.000001) {
      violations.push("coupling");
    }
    if (lambdaLimitActive && maxPlus.unmappedCount > 0) {
      violations.push("maxplus-mapping");
    }
    if (lambdaLimitActive && Number.isFinite(lambda) && lambda > lambdaLimit + 0.000001) {
      violations.push("lambda");
    }
    if (quality.quality <= 0) {
      violations.push("coverage");
    }
    return {
      selectedLabels: labels,
      size: labels.length,
      quality,
      lambda,
      localLambda,
      lambdaSource,
      throughput: Number.isFinite(lambda) && lambda > 0 ? 1 / lambda : null,
      maxPlus,
      feasible: violations.length === 0 && labels.length > 0,
      violations,
      evaluatedAt: evaluatedCount
    };
  }

  function compareOptimizationCandidates(a, b) {
    if (!a) return b ? 1 : 0;
    if (!b) return -1;
    const scoreA = Number(a.quality && a.quality.quality || 0);
    const scoreB = Number(b.quality && b.quality.quality || 0);
    if (Math.abs(scoreA - scoreB) > 0.000001) return scoreB - scoreA;
    const coverageA = Number(a.quality && a.quality.minCoverage || 0);
    const coverageB = Number(b.quality && b.quality.minCoverage || 0);
    if (Math.abs(coverageA - coverageB) > 0.000001) return coverageB - coverageA;
    const redundancyA = Number(a.quality && a.quality.redundancy || 0);
    const redundancyB = Number(b.quality && b.quality.redundancy || 0);
    if (Math.abs(redundancyA - redundancyB) > 0.000001) return redundancyB - redundancyA;
    const maxPlusCompleteA = a.maxPlus && a.maxPlus.complete ? 1 : 0;
    const maxPlusCompleteB = b.maxPlus && b.maxPlus.complete ? 1 : 0;
    if (maxPlusCompleteA !== maxPlusCompleteB) return maxPlusCompleteB - maxPlusCompleteA;
    const maxPlusCoverageA = Number(a.maxPlus && a.maxPlus.coverage || 0);
    const maxPlusCoverageB = Number(b.maxPlus && b.maxPlus.coverage || 0);
    if (Math.abs(maxPlusCoverageA - maxPlusCoverageB) > 0.000001) return maxPlusCoverageB - maxPlusCoverageA;
    const unmappedA = Number(a.maxPlus && a.maxPlus.unmappedCount || 0);
    const unmappedB = Number(b.maxPlus && b.maxPlus.unmappedCount || 0);
    if (unmappedA !== unmappedB) return unmappedA - unmappedB;
    const lambdaAValue = finiteOrNull(a.lambda);
    const lambdaBValue = finiteOrNull(b.lambda);
    const lambdaA = lambdaAValue !== null ? lambdaAValue : Number.POSITIVE_INFINITY;
    const lambdaB = lambdaBValue !== null ? lambdaBValue : Number.POSITIVE_INFINITY;
    if (Math.abs(lambdaA - lambdaB) > 0.000001) return lambdaA - lambdaB;
    const couplingA = Number(a.quality && a.quality.coupling || 0);
    const couplingB = Number(b.quality && b.quality.coupling || 0);
    if (Math.abs(couplingA - couplingB) > 0.000001) return couplingA - couplingB;
    if (a.size !== b.size) return a.size - b.size;
    return a.selectedLabels.join(",").localeCompare(b.selectedLabels.join(","));
  }

  function optimizeFuzzyTransversal(entries, placeIds, membership, couplingByLabel, maxPlusSubnets, constraints, globalMaxPlusResolver) {
    const safeEntries = Array.isArray(entries) ? entries : [];
    const labels = safeEntries.map((entry) => entry.label).filter(Boolean).sort(naturalLabelCompare);
    const maxPlusByLabel = new Map((Array.isArray(maxPlusSubnets) ? maxPlusSubnets : []).map((item) => [item.label, item]));
    const maxComponents = constraints && constraints.maxComponents ? Number(constraints.maxComponents) : null;
    const exactLimit = 18;
    const beamWidth = 256;
    let evaluatedCount = 0;
    let feasibleCount = 0;
    let best = null;

    function consider(solutionLabels) {
      evaluatedCount += 1;
      const candidate = buildOptimizationCandidate(solutionLabels, placeIds, membership, couplingByLabel, maxPlusByLabel, constraints, evaluatedCount, globalMaxPlusResolver);
      if (candidate.feasible) {
        feasibleCount += 1;
        if (!best || compareOptimizationCandidates(candidate, best) < 0) {
          best = candidate;
        }
      }
      return candidate;
    }

    if (labels.length <= exactLimit) {
      function visit(index, selected) {
        if (selected.length > 0) consider(selected);
        if (index >= labels.length) return;
        if (maxComponents && selected.length >= maxComponents) return;
        for (let i = index; i < labels.length; i += 1) {
          selected.push(labels[i]);
          visit(i + 1, selected);
          selected.pop();
        }
      }
      visit(0, []);
      return { found: Boolean(best), method: "exact-enumeration", exact: true, evaluatedCount, feasibleCount, constraints, best };
    }

    let beam = [[]];
    labels.forEach((label) => {
      const next = [];
      const seen = new Set();
      beam.forEach((solution) => {
        [solution, solution.concat(label)].forEach((candidateLabels) => {
          if (maxComponents && candidateLabels.length > maxComponents) return;
          const key = candidateLabels.join("|");
          if (seen.has(key)) return;
          seen.add(key);
          next.push(candidateLabels);
        });
      });
      beam = next
        .map((solution) => ({ solution, candidate: solution.length > 0 ? consider(solution) : null }))
        .sort((a, b) => {
          if (!a.candidate && !b.candidate) return 0;
          if (!a.candidate) return 1;
          if (!b.candidate) return -1;
          return compareOptimizationCandidates(a.candidate, b.candidate);
        })
        .slice(0, beamWidth)
        .map((item) => item.solution);
    });

    return { found: Boolean(best), method: `beam-search-${beamWidth}`, exact: false, evaluatedCount, feasibleCount, constraints, best };
  }

  function buildAlphaSweepLevels(selectedAlpha, alphaStep) {
    const safeStep = Number.isFinite(Number(alphaStep)) && Number(alphaStep) > 0
      ? Math.max(0.01, Math.min(0.5, Number(alphaStep)))
      : 0.05;
    const levels = new Set([0, 1, clamp01(selectedAlpha)]);
    for (let value = 0; value <= 1 + 0.000001; value += safeStep) {
      levels.add(Number(clamp01(value).toFixed(2)));
    }
    return Array.from(levels).filter((value) => value >= 0 && value <= 1).sort((a, b) => a - b);
  }

  function summarizeAlphaSweep(alphaCuts, selectedAlpha) {
    const rows = Array.isArray(alphaCuts) ? alphaCuts : [];
    const exactRows = rows.filter((row) => row.found);
    const feasibleRows = rows.filter((row) => row.feasible);
    const bestRows = exactRows.slice().sort((a, b) => {
      const qualityDiff = Number(b.quality && b.quality.quality || 0) - Number(a.quality && a.quality.quality || 0);
      if (Math.abs(qualityDiff) > 0.000001) return qualityDiff;
      const alphaDiff = Number(b.alpha || 0) - Number(a.alpha || 0);
      if (Math.abs(alphaDiff) > 0.000001) return alphaDiff;
      return Number(a.size || 0) - Number(b.size || 0);
    });
    const selected = rows.find((row) => Math.abs(Number(row.alpha) - Number(selectedAlpha)) < 0.000001) || null;
    return {
      levels: rows.length,
      exactLevels: exactRows.length,
      feasibleLevels: feasibleRows.length,
      minExactAlpha: exactRows.length > 0 ? Math.min(...exactRows.map((row) => Number(row.alpha))) : null,
      maxExactAlpha: exactRows.length > 0 ? Math.max(...exactRows.map((row) => Number(row.alpha))) : null,
      maxFeasibleAlpha: feasibleRows.length > 0 ? Math.max(...feasibleRows.map((row) => Number(row.alpha))) : null,
      bestAlpha: bestRows.length > 0 ? bestRows[0].alpha : null,
      bestQuality: bestRows.length > 0 ? Number(bestRows[0].quality && bestRows[0].quality.quality || 0) : null,
      selectedAlphaExact: Boolean(selected && selected.found),
      selectedAlphaFeasible: Boolean(selected && selected.feasible)
    };
  }

  function buildAlphaCutReport(entries, placeIds, membership, couplingByLabel, maxPlusSubnets, selectedAlpha, alphaStep, constraints, globalMaxPlusResolver) {
    const safePlaceIds = Array.isArray(placeIds) ? placeIds : [];
    const levels = buildAlphaSweepLevels(selectedAlpha, alphaStep);
    const maxPlusByLabel = new Map((Array.isArray(maxPlusSubnets) ? maxPlusSubnets : []).map((item) => [item.label, item]));
    return levels.map((alpha, index) => {
      const solved = solveAlphaExactCover(safePlaceIds, entries, membership, alpha);
      const candidate = buildOptimizationCandidate(solved.solutionLabels, safePlaceIds, membership, couplingByLabel, maxPlusByLabel, constraints, index + 1, globalMaxPlusResolver);
      return {
        alpha,
        selected: Math.abs(Number(alpha) - Number(selectedAlpha)) < 0.000001,
        found: solved.found,
        solutionLabels: solved.solutionLabels,
        size: solved.solutionLabels.length,
        quality: candidate.quality,
        lambda: candidate.lambda,
        localLambda: candidate.localLambda,
        lambdaSource: candidate.lambdaSource,
        throughput: candidate.throughput,
        maxPlus: candidate.maxPlus,
        feasible: solved.found && candidate.feasible,
        violations: solved.found ? candidate.violations : ["alpha-exact"],
        emptyEdges: safePlaceIds.filter((placeId) => (solved.rowCandidates.get(placeId) || new Set()).size === 0),
        candidateEdgeCount: safePlaceIds.filter((placeId) => (solved.rowCandidates.get(placeId) || new Set()).size > 0).length
      };
    });
  }

  return {
    solveAlphaExactCover,
    computeSelectedCoupling,
    computeSelectedLambda,
    evaluateSelectedMaxPlusMapping,
    evaluateFuzzyTransversal,
    buildOptimizationCandidate,
    compareOptimizationCandidates,
    optimizeFuzzyTransversal,
    buildAlphaSweepLevels,
    summarizeAlphaSweep,
    buildAlphaCutReport
  };
});
