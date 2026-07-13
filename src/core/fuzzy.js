(function(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("./max-plus"), require("./fuzzy-source"), require("./fuzzy-membership"), require("./fuzzy-transversal"), require("./takagi-sugeno"), require("./fuzzy-artifact"));
  } else {
    root.PoohFuzzyCore = factory(root.PoohMaxPlusCore, root.PoohFuzzySourceCore, root.PoohFuzzyMembershipCore, root.PoohFuzzyTransversalCore, root.PoohTakagiSugenoCore, root.PoohFuzzyArtifactCore);
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function(maxPlusDependency, fuzzySourceDependency, fuzzyMembershipDependency, fuzzyTransversalDependency, takagiSugenoDependency, fuzzyArtifactDependency) {
  "use strict";

  const maxPlusCore = maxPlusDependency || {};
  const {
    clamp01,
    finiteOrNull,
    naturalLabelCompare,
    toSortedStringArray,
    toStringArray,
    createFuzzyNullMatrix,
    fuzzyMaxPlusMultiply,
    fuzzyMatrixAdjacency,
    computeFuzzySccCount,
    computeFuzzyMaxCycleMean,
    canonicalDirectedCycleKey,
    computeFuzzyCriticalCycle,
    getFuzzyPlaceDelay,
    buildStandaloneMaxPlusForAutomata,
    getEntryMaxPlusSupportPlaces,
    compactTransversalMaxPlus,
    buildMaxPlusTransversalModel,
    buildSharedTransitionSetForSubnets,
    computeSubnetCoupling,
    relationPairKey,
    relationArrowKey,
    buildTransitionRulesFor,
    computeEnabledTransitionsForMarking,
    fireOnMarking,
    computePetriXtRelations,
    buildPetriXtRelationMatrices,
    buildPetriXtRelationSummary,
    computeFuzzySubnetMetrics
  } = maxPlusCore;

  const fuzzySourceCore = fuzzySourceDependency || {};
  const {
    buildFuzzyPetriResearchSource,
    buildFuzzyManualHypergraphResearchSource
  } = fuzzySourceCore;

  const fuzzyMembershipCore = fuzzyMembershipDependency || {};
  const {
    FUZZY_MEMBERSHIP_DEFAULT_WEIGHTS,
    normalizeFuzzyMembershipWeights,
    buildFuzzyMembership,
    buildFuzzyMembershipRows
  } = fuzzyMembershipCore;

  const fuzzyTransversalCore = fuzzyTransversalDependency || {};
  const {
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
  } = fuzzyTransversalCore;

  const takagiSugenoCore = takagiSugenoDependency || {};
  const {
    classifyFuzzyLevel,
    buildTakagiSugenoRules,
    buildFuzzySupervisorReport
  } = takagiSugenoCore;

  const fuzzyArtifactCore = fuzzyArtifactDependency || {};
  const {
    buildFuzzyResearchArtifact
  } = fuzzyArtifactCore;

  return {
    FUZZY_MEMBERSHIP_DEFAULT_WEIGHTS,
    clamp01,
    finiteOrNull,
    normalizeFuzzyMembershipWeights,
    createFuzzyNullMatrix,
    fuzzyMaxPlusMultiply,
    fuzzyMatrixAdjacency,
    computeFuzzySccCount,
    computeFuzzyMaxCycleMean,
    canonicalDirectedCycleKey,
    computeFuzzyCriticalCycle,
    getFuzzyPlaceDelay,
    buildStandaloneMaxPlusForAutomata,
    getEntryMaxPlusSupportPlaces,
    compactTransversalMaxPlus,
    buildMaxPlusTransversalModel,
    buildSharedTransitionSetForSubnets,
    computeSubnetCoupling,
    relationPairKey,
    relationArrowKey,
    buildTransitionRulesFor,
    computeEnabledTransitionsForMarking,
    fireOnMarking,
    computePetriXtRelations,
    buildPetriXtRelationMatrices,
    buildPetriXtRelationSummary,
    computeFuzzySubnetMetrics,
    buildFuzzyPetriResearchSource,
    buildFuzzyManualHypergraphResearchSource,
    buildFuzzyMembership,
    buildFuzzyMembershipRows,
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
    buildAlphaCutReport,
    classifyFuzzyLevel,
    buildTakagiSugenoRules,
    buildFuzzySupervisorReport,
    buildFuzzyResearchArtifact
  };
});
