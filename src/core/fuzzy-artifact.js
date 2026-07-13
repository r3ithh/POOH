(function(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(
      require("./max-plus"),
      require("./fuzzy-membership"),
      require("./fuzzy-transversal"),
      require("./takagi-sugeno")
    );
  } else {
    root.PoohFuzzyArtifactCore = factory(
      root.PoohMaxPlusCore,
      root.PoohFuzzyMembershipCore,
      root.PoohFuzzyTransversalCore,
      root.PoohTakagiSugenoCore
    );
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function(maxPlusDependency, fuzzyMembershipDependency, fuzzyTransversalDependency, takagiSugenoDependency) {
  "use strict";

  const maxPlusCore = maxPlusDependency || {};
  const fuzzyMembershipCore = fuzzyMembershipDependency || {};
  const fuzzyTransversalCore = fuzzyTransversalDependency || {};
  const takagiSugenoCore = takagiSugenoDependency || {};

  const { finiteOrNull } = maxPlusCore;
  const { buildFuzzyMembership, buildFuzzyMembershipRows } = fuzzyMembershipCore;
  const {
    buildAlphaCutReport,
    summarizeAlphaSweep,
    optimizeFuzzyTransversal
  } = fuzzyTransversalCore;
  const {
    buildTakagiSugenoRules,
    buildFuzzySupervisorReport
  } = takagiSugenoCore;

  function readNowMs(config) {
    if (config && typeof config.nowMs === "function") {
      const callbackValue = Number(config.nowMs());
      if (Number.isFinite(callbackValue)) {
        return callbackValue;
      }
    }
    if (config && Number.isFinite(Number(config.nowMs))) {
      return Number(config.nowMs);
    }
    if (typeof performance !== "undefined" && performance && typeof performance.now === "function") {
      return performance.now();
    }
    return Date.now();
  }

  function resolveExperimentMetadata(config, options, entries, placeIds) {
    if (config && config.experiment) {
      return config.experiment;
    }
    if (config && typeof config.experimentFactory === "function") {
      return config.experimentFactory({
        options,
        sourceMode: config.sourceMode,
        entries,
        placeIds,
        sourceSignature: config.sourceSignature
      });
    }
    return {
      id: "",
      schemaVersion: "pooh-research-experiment-1",
      sourceMode: config ? config.sourceMode : "",
      componentCount: entries.length,
      edgeCount: placeIds.length
    };
  }

  function buildFuzzyResearchArtifact(config) {
    const safeConfig = config && typeof config === "object" ? config : {};
    const options = safeConfig.options && typeof safeConfig.options === "object" ? safeConfig.options : {};
    const entries = Array.isArray(safeConfig.entries) ? safeConfig.entries : [];
    const placeIds = Array.isArray(safeConfig.placeIds) ? safeConfig.placeIds : [];
    const maxPlusSubnets = Array.isArray(safeConfig.maxPlusSubnets) ? safeConfig.maxPlusSubnets : [];
    const metrics = safeConfig.metrics || new Map();
    const couplingByLabel = safeConfig.couplingByLabel || new Map();
    const maxPlusAvailable = safeConfig.maxPlusAvailable !== false;
    const started = Number.isFinite(Number(safeConfig.started)) ? Number(safeConfig.started) : readNowMs(safeConfig);
    const maxPlusResolver = typeof safeConfig.transversalResolver === "function"
      ? safeConfig.transversalResolver
      : null;
    const membershipArtifact = buildFuzzyMembership(entries, placeIds, maxPlusSubnets, metrics, options);
    const membership = membershipArtifact.membership;
    const alphaCuts = buildAlphaCutReport(
      entries,
      placeIds,
      membership,
      couplingByLabel,
      maxPlusSubnets,
      options.alpha,
      options.alphaStep,
      options.constraints,
      maxPlusResolver
    );
    const activeAlphaCut = alphaCuts.find((item) => Math.abs(Number(item.alpha) - Number(options.alpha)) < 0.0001) || alphaCuts[0] || null;
    const alphaSweep = summarizeAlphaSweep(alphaCuts, options.alpha);
    const optimization = optimizeFuzzyTransversal(
      entries,
      placeIds,
      membership,
      couplingByLabel,
      maxPlusSubnets,
      options.constraints,
      maxPlusResolver
    );
    const transversalMaxPlus = optimization && optimization.best && maxPlusResolver
      ? maxPlusResolver(optimization.best.selectedLabels, true)
      : null;
    if (optimization && optimization.best && transversalMaxPlus) {
      optimization.best.maxPlus = optimization.best.maxPlus || {};
      optimization.best.maxPlus.transversalLambda = finiteOrNull(transversalMaxPlus.lambda);
      optimization.best.maxPlus.transversalThroughput = finiteOrNull(transversalMaxPlus.throughput);
      optimization.best.maxPlus.transversalEdgeCount = Number(transversalMaxPlus.edgeCount || 0);
      optimization.best.maxPlus.transversalTransitionCount = Number(transversalMaxPlus.transitionCount || 0);
      optimization.best.maxPlus.transversalComplete = Boolean(transversalMaxPlus.complete);
    }
    const rules = buildTakagiSugenoRules(entries, maxPlusSubnets, metrics, membership, {
      maxPlusAvailable,
      sourceText: safeConfig.ruleSource
    });
    const finiteLambdas = maxPlusSubnets.map((item) => finiteOrNull(item && item.lambda)).filter((value) => value !== null);
    const globalLambda = finiteLambdas.length > 0 ? Math.max(...finiteLambdas) : null;
    const globalThroughput = Number.isFinite(globalLambda) && globalLambda > 0 ? 1 / globalLambda : null;
    const experiment = resolveExperimentMetadata(safeConfig, options, entries, placeIds);
    const supervisor = buildFuzzySupervisorReport(optimization, activeAlphaCut, rules, safeConfig.relationSummary, options, {
      maxPlusAvailable
    });
    const membershipRows = buildFuzzyMembershipRows(placeIds, entries, membership, membershipArtifact.details || []);
    const generatedAt = safeConfig.generatedAt || new Date().toISOString();

    return {
      version: safeConfig.version || "pooh-fuzzy-maxplus-optimizer-1",
      generatedAt,
      experiment,
      sourceMode: safeConfig.sourceMode,
      sourceLabel: safeConfig.sourceLabel,
      pipeline: safeConfig.pipeline,
      options,
      relationSummary: safeConfig.relationSummary,
      petriXt: safeConfig.petriXt,
      maxPlus: {
        available: maxPlusAvailable,
        semiring: "max-plus",
        equation: maxPlusAvailable ? "x_i(k+1)=A_i⊗x_i(k)" : "pending Petri/SMC mapping",
        global: {
          lambda: globalLambda,
          throughput: globalThroughput
        },
        transversal: transversalMaxPlus,
        subnets: maxPlusSubnets,
        note: safeConfig.maxPlusNote || ""
      },
      fuzzy: {
        membershipModel: membershipArtifact.model,
        membershipRows,
        alphaCuts,
        alphaSweep,
        activeAlphaCut,
        optimization
      },
      supervisor,
      rules,
      summary: {
        subnetCount: entries.length,
        placeCount: placeIds.length,
        ruleCount: rules.length,
        runtimeMs: readNowMs(safeConfig) - started
      }
    };
  }

  return {
    readNowMs,
    resolveExperimentMetadata,
    buildFuzzyResearchArtifact
  };
});
