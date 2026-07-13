(function(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("./max-plus"), require("./i18n"));
  } else {
    root.PoohTakagiSugenoCore = factory(root.PoohMaxPlusCore, root.PoohI18n);
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function(maxPlusDependency, i18n) {
  "use strict";

  function tr(key, params) {
    return i18n && typeof i18n.t === "function" ? i18n.t(key, params) : String(key || "");
  }

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

  function lookupMetric(metrics, label) {
    if (!metrics) {
      return {};
    }
    if (typeof metrics.get === "function") {
      return metrics.get(label) || {};
    }
    return metrics[label] || {};
  }

  function classifyFuzzyLevel(value, invert) {
    const numeric = clamp01(value);
    const effective = invert ? 1 - numeric : numeric;
    if (effective >= 0.67) {
      return tr("core.fuzzyLevel.high");
    }
    if (effective >= 0.34) {
      return tr("core.fuzzyLevel.medium");
    }
    return tr("core.fuzzyLevel.low");
  }

  function buildTakagiSugenoRules(entries, maxPlusSubnets, metrics, membership, context) {
    const safeEntries = Array.isArray(entries) ? entries : [];
    const safeMaxPlusSubnets = Array.isArray(maxPlusSubnets) ? maxPlusSubnets : [];
    const globalMaxPlusAvailable = !(context && context.maxPlusAvailable === false);
    const sourceText = context && context.sourceText
      ? String(context.sourceText)
      : "SMC generated from 1-exact/XT decomposition";
    const maxPlusByLabel = new Map(safeMaxPlusSubnets.map((item) => [item.label, item]));
    return safeEntries.map((entry, index) => {
      const label = String(entry && entry.label !== undefined ? entry.label : "");
      const metric = lookupMetric(metrics, label);
      const lambda = finiteOrNull(metric.lambda);
      const supports = Array.isArray(entry && entry.supportPlaces) ? entry.supportPlaces : [];
      const muValues = supports.map((placeId) => {
        const row = membership && typeof membership.get === "function" ? membership.get(placeId) || new Map() : new Map();
        return Number(row.get(label) || 0);
      });
      const activation = muValues.length > 0
        ? muValues.reduce((sum, value) => sum + value, 0) / muValues.length
        : 0;
      const maxPlus = maxPlusByLabel.get(label) || {};
      const localMaxPlusAvailable = globalMaxPlusAvailable && !maxPlus.noMaxPlus;
      const equation = localMaxPlusAvailable
        ? `x_${label}(k+1)=A_${label}⊗x_${label}(k)`
        : tr("core.takagiSugeno.mappingPending", { label });
      return {
        id: `R${index + 1}`,
        label,
        activation: clamp01(activation),
        antecedent: {
          concurrency: classifyFuzzyLevel(metric.concurrencyDensity, false),
          conflict: classifyFuzzyLevel(metric.conflictDensity, false),
          coupling: classifyFuzzyLevel(metric.coupling && metric.coupling.normalized, false),
          reconfiguration: classifyFuzzyLevel(metric.sharedTransitionRatio, false),
          timing: classifyFuzzyLevel(lambda !== null ? 1 / (1 + lambda) : 0.5, false)
        },
        consequent: {
          equation,
          lambda: finiteOrNull(maxPlus.lambda),
          throughput: finiteOrNull(maxPlus.throughput),
          transitions: Array.isArray(maxPlus.transitions) ? maxPlus.transitions.slice() : [],
          maxPlusAvailable: localMaxPlusAvailable
        },
        source: sourceText
      };
    });
  }

  function buildFuzzySupervisorReport(optimization, alphaCut, rules, relationSummary, options, context) {
    const safeOptions = options && typeof options === "object" ? options : {};
    const safeRules = Array.isArray(rules) ? rules : [];
    const maxPlusAvailable = !(context && context.maxPlusAvailable === false);
    const selectedLabels = optimization && optimization.best
      ? optimization.best.selectedLabels
      : alphaCut && Array.isArray(alphaCut.solutionLabels)
        ? alphaCut.solutionLabels
        : [];
    const selectedSet = new Set(selectedLabels);
    const activeRules = safeRules.filter((rule) => selectedSet.has(rule.label));
    const constraints = safeOptions.constraints || {};
    const best = optimization && optimization.best ? optimization.best : null;
    const bestTransversalLambda = best && best.maxPlus ? finiteOrNull(best.maxPlus.transversalLambda) : null;
    const bestLambda = bestTransversalLambda !== null
      ? bestTransversalLambda
      : (best ? finiteOrNull(best.lambda) : null);
    const lambdaLimitActive = constraints.lambdaLimit !== null && constraints.lambdaLimit !== undefined;
    const maxPlusMapping = best && best.maxPlus ? best.maxPlus : null;
    const maxPlusMappingComplete = Boolean(maxPlusMapping && maxPlusMapping.complete);
    const maxPlusMappingOk = Boolean(best) && (!lambdaLimitActive || maxPlusMappingComplete);
    const timingOk = !lambdaLimitActive
      || !best
      || (maxPlusMappingOk && (bestLambda === null || bestLambda <= Number(constraints.lambdaLimit) + 0.000001));
    const couplingOk = !best
      || !Number.isFinite(Number(best.quality && best.quality.coupling))
      || Number(best.quality.coupling) <= Number(constraints.maxCoupling || 1) + 0.000001;
    const sizeOk = !constraints.maxComponents || selectedLabels.length <= Number(constraints.maxComponents);
    const reachabilityComplete = maxPlusAvailable && relationSummary && !relationSummary.truncated;
    return {
      type: "Takagi-Sugeno max-plus fuzzy supervisor",
      status: maxPlusAvailable ? "report-only" : "exact-hypergraph-report",
      selectedConfiguration: selectedLabels,
      activeRules: activeRules.map((rule) => rule.id),
      mpc: {
        status: maxPlusAvailable ? "skeleton" : "requires-petri-smc-mapping",
        horizon: safeOptions.mpc && safeOptions.mpc.horizon ? safeOptions.mpc.horizon : 6,
        objective: maxPlusAvailable
          ? "minimize max-plus lambda, coupling and reconfiguration cost while preserving fuzzy exact coverage"
          : "select fuzzy exact candidates; max-plus timing objective awaits Petri/SMC mapping",
        decisionVariables: maxPlusAvailable
          ? ["selected SMC configuration", "transition delays", "schedule offsets", "reconfiguration trigger"]
          : ["selected hypervertices", "alpha level", "coupling threshold"],
        constraints: {
          maxComponents: constraints.maxComponents,
          maxCoupling: constraints.maxCoupling,
          lambdaLimit: constraints.lambdaLimit
        },
        candidateFeasible: Boolean(best && best.feasible),
        predictedLambda: bestLambda,
        predictedThroughput: bestTransversalLambda !== null && bestLambda > 0
          ? 1 / bestLambda
          : (best ? best.throughput : null),
        maxPlusMappingCoverage: maxPlusMapping ? maxPlusMapping.coverage : null,
        maxPlusMappingComplete,
        maxPlusUnmapped: maxPlusMapping ? maxPlusMapping.unmappedLabels : []
      },
      verification: {
        reachabilityComplete,
        stateCount: relationSummary ? relationSummary.states : 0,
        safe: relationSummary ? relationSummary.safe : false,
        alphaExact: Boolean(alphaCut && alphaCut.found),
        optimizedFeasible: Boolean(best && best.feasible),
        timingOk,
        couplingOk,
        sizeOk,
        maxPlusMappingOk,
        maxPlusMappingComplete,
        maxPlusMappingCoverage: maxPlusMapping ? maxPlusMapping.coverage : null,
        maxPlusUnmapped: maxPlusMapping ? maxPlusMapping.unmappedLabels : [],
        maxPlusAvailable,
        implementationReadiness: maxPlusAvailable && reachabilityComplete && timingOk && couplingOk && sizeOk && maxPlusMappingComplete
          ? "candidate"
          : "requires-petri-smc-mapping"
      }
    };
  }

  return {
    classifyFuzzyLevel,
    buildTakagiSugenoRules,
    buildFuzzySupervisorReport
  };
});
