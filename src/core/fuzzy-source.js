(function(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("./max-plus"), require("./i18n"));
  } else {
    root.PoohFuzzySourceCore = factory(root.PoohMaxPlusCore, root.PoohI18n);
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function(maxPlusDependency, i18n) {
  "use strict";

  function tr(key, params) {
    return i18n && typeof i18n.t === "function" ? i18n.t(key, params) : String(key || "");
  }

  const maxPlusCore = maxPlusDependency || {};
  const {
    clamp01,
    finiteOrNull,
    naturalLabelCompare,
    toSortedStringArray,
    toStringArray,
    buildSharedTransitionSetForSubnets,
    computeSubnetCoupling,
    buildPetriXtRelationMatrices,
    buildPetriXtRelationSummary,
    computeFuzzySubnetMetrics
  } = maxPlusCore;

  function buildFuzzyPetriResearchSource(config) {
    const safeConfig = config && typeof config === "object" ? config : {};
    const entries = Array.isArray(safeConfig.entries) ? safeConfig.entries : [];
    const placeIds = Array.isArray(safeConfig.placeIds)
      ? toSortedStringArray(safeConfig.placeIds)
      : Array.from(new Set(entries.flatMap((entry) => toSortedStringArray(entry && entry.supportPlaces)))).sort(naturalLabelCompare);
    const maxPlusSubnets = Array.isArray(safeConfig.maxPlusSubnets) ? safeConfig.maxPlusSubnets : [];
    const sharedTransitionSet = safeConfig.sharedTransitionSet && typeof safeConfig.sharedTransitionSet.has === "function"
      ? safeConfig.sharedTransitionSet
      : buildSharedTransitionSetForSubnets(entries);
    const relations = safeConfig.relations && typeof safeConfig.relations === "object" ? safeConfig.relations : {};
    const petriXt = buildPetriXtRelationMatrices(relations);
    const metrics = computeFuzzySubnetMetrics(entries, maxPlusSubnets, relations, sharedTransitionSet);
    const couplingByLabel = computeSubnetCoupling(entries);
    return {
      entries,
      placeIds,
      maxPlusSubnets,
      metrics,
      couplingByLabel,
      petriXt,
      relationSummary: buildPetriXtRelationSummary(relations),
      sharedTransitionSet
    };
  }

  function lookupMappingByLabel(mappingsByLabel, label) {
    if (!mappingsByLabel) {
      return null;
    }
    if (typeof mappingsByLabel.get === "function") {
      return mappingsByLabel.get(label) || null;
    }
    return mappingsByLabel[label] || null;
  }

  function normalizeFuzzyHypergraphMapping(mapping) {
    const safe = mapping && typeof mapping === "object" ? mapping : {};
    return {
      mapped: Boolean(safe.mapped),
      source: safe.source ? String(safe.source) : "none",
      label: safe.label ? String(safe.label) : "",
      supportPlaces: toSortedStringArray(safe.supportPlaces),
      transitionIds: toSortedStringArray(safe.transitionIds)
    };
  }

  function buildNoMaxPlusSubnet(entry, note) {
    const mapping = entry && entry.mapping ? normalizeFuzzyHypergraphMapping(entry.mapping) : normalizeFuzzyHypergraphMapping(null);
    return {
      label: String(entry && entry.label !== undefined ? entry.label : ""),
      transitions: [],
      transitionCount: 0,
      edgeCount: Array.isArray(entry && entry.supportPlaces) ? entry.supportPlaces.length : 0,
      matrix: [],
      edgeRows: [],
      stronglyConnected: false,
      lambda: null,
      throughput: null,
      criticalCycle: null,
      sampleTrajectory: [],
      operations: 0,
      noMaxPlus: true,
      mapping: {
        source: mapping.source,
        label: mapping.label,
        places: mapping.supportPlaces.slice(),
        transitions: mapping.transitionIds.slice()
      },
      note: note || tr("core.fuzzySource.mappingMissing")
    };
  }

  function buildFuzzyManualHypergraphResearchSource(config) {
    const safeConfig = config && typeof config === "object" ? config : {};
    const options = safeConfig.options && typeof safeConfig.options === "object" ? safeConfig.options : {};
    const hypergraph = safeConfig.hypergraph && typeof safeConfig.hypergraph === "object" ? safeConfig.hypergraph : {};
    const colLabels = toStringArray(hypergraph.colLabels);
    const rowLabels = toStringArray(hypergraph.rowLabels);
    const sourceMatrix = Array.isArray(hypergraph.matrix) ? hypergraph.matrix : [];
    const matrix = rowLabels.map((_, rowIndex) => {
      const row = Array.isArray(sourceMatrix[rowIndex]) ? sourceMatrix[rowIndex] : [];
      return colLabels.map((__, colIndex) => (Number(row[colIndex] || 0) > 0 ? 1 : 0));
    });

    if (!colLabels.length || !rowLabels.length) {
      throw new Error(tr("core.fuzzySource.hypergraphRequired"));
    }
    const incidenceCount = matrix.reduce((sum, row) => (
      sum + row.reduce((rowSum, value) => rowSum + (Number(value || 0) > 0 ? 1 : 0), 0)
    ), 0);
    if (incidenceCount === 0) {
      throw new Error(tr("core.fuzzySource.incidenceMissing"));
    }

    const entries = colLabels.map((label, colIndex) => {
      const supportPlaces = rowLabels.filter((_, rowIndex) => Number((matrix[rowIndex] || [])[colIndex] || 0) > 0);
      const mapping = normalizeFuzzyHypergraphMapping(lookupMappingByLabel(safeConfig.mappingsByLabel, label));
      return {
        label,
        supportPlaces,
        transitionIds: mapping.transitionIds.slice(),
        maxPlusSupportPlaces: mapping.supportPlaces.slice(),
        mapping,
        source: "graphic-hypergraph-vertex"
      };
    });
    const mappedEntries = entries.filter((entry) => entry.mapping && entry.mapping.mapped);
    const sharedTransitionSet = buildSharedTransitionSetForSubnets(entries);
    const maxPlusSubnets = entries.map((entry) => {
      if (entry.mapping && entry.mapping.mapped && typeof safeConfig.buildMaxPlusModel === "function") {
        const maxPlusEntry = {
          ...entry,
          supportPlaces: entry.maxPlusSupportPlaces.slice(),
          transitionIds: entry.transitionIds.slice()
        };
        const maxPlus = safeConfig.buildMaxPlusModel(maxPlusEntry, sharedTransitionSet, options) || {};
        return {
          ...maxPlus,
          label: String(maxPlus.label || entry.label),
          mapping: {
            source: entry.mapping.source,
            label: entry.mapping.label,
            places: entry.mapping.supportPlaces.slice(),
            transitions: entry.mapping.transitionIds.slice()
          }
        };
      }
      return buildNoMaxPlusSubnet(entry);
    });
    const couplingByLabel = computeSubnetCoupling(entries);
    const metrics = new Map();
    entries.forEach((entry) => {
      const coverageRatio = rowLabels.length > 0 ? entry.supportPlaces.length / rowLabels.length : 0;
      const maxPlus = maxPlusSubnets.find((item) => item.label === entry.label) || {};
      metrics.set(entry.label, {
        conflictDensity: 0,
        concurrencyDensity: clamp01(coverageRatio),
        sequentialLinks: 0,
        sharedTransitionRatio: entry.transitionIds.length > 0
          ? entry.transitionIds.filter((transitionId) => sharedTransitionSet.has(transitionId)).length / entry.transitionIds.length
          : 0,
        coupling: couplingByLabel.get(entry.label) || { raw: 0, normalized: 0, sharedWith: [] },
        lambda: finiteOrNull(maxPlus.lambda),
        throughput: finiteOrNull(maxPlus.throughput),
        edgeCount: Number(maxPlus.edgeCount || entry.supportPlaces.length)
      });
    });

    const coMembershipMatrix = colLabels.map((leftLabel, leftIndex) => colLabels.map((rightLabel, rightIndex) => {
      if (leftLabel === rightLabel) {
        return 0;
      }
      return matrix.some((row) => Number((row || [])[leftIndex] || 0) > 0 && Number((row || [])[rightIndex] || 0) > 0) ? 1 : 0;
    }));
    const zeroMatrix = colLabels.map(() => colLabels.map(() => 0));
    const coMembershipCount = coMembershipMatrix.reduce((sum, row) => (
      sum + row.reduce((rowSum, value) => rowSum + (Number(value || 0) > 0 ? 1 : 0), 0)
    ), 0) / 2;
    const petriXt = {
      mode: "graphic-hypergraph",
      transitions: colLabels.slice(),
      hyperedges: rowLabels.slice(),
      complete: true,
      safe: null,
      stateCount: 0,
      statesLimit: 0,
      counts: {
        conflict: 0,
        concurrency: coMembershipCount,
        sequential: 0,
        incidence: incidenceCount
      },
      sources: {
        conflict: "not derived: graphic hypergraph source",
        concurrency: "co-membership: two hypervertices share at least one hyperedge",
        sequential: "not derived: no Petri transition order in graphic hypergraph source"
      },
      matrices: {
        conflict: zeroMatrix,
        concurrency: coMembershipMatrix,
        sequential: zeroMatrix
      }
    };
    const relationSummary = {
      mode: "graphic-hypergraph",
      transitions: 0,
      candidates: colLabels.length,
      hyperedges: rowLabels.length,
      incidence: incidenceCount,
      mappedMaxPlus: mappedEntries.length,
      mappingCandidates: Number(safeConfig.mappingCandidateCount || 0),
      states: 0,
      statesLimit: 0,
      truncated: false,
      safe: null,
      conflicts: 0,
      sequential: 0,
      concurrent: coMembershipCount
    };
    const sourceSignature = {
      sourceMode: "graphic-hypergraph-exact",
      vertices: colLabels.slice(),
      hyperedges: rowLabels.slice(),
      matrix: matrix.map((row) => row.slice()),
      mappings: entries.map((entry) => ({
        hypervertex: entry.label,
        source: entry.mapping.source,
        component: entry.mapping.label,
        places: entry.mapping.supportPlaces.slice(),
        transitions: entry.mapping.transitionIds.slice()
      })),
      alpha: options.alpha,
      constraints: options.constraints
    };

    return {
      entries,
      placeIds: rowLabels.slice(),
      maxPlusSubnets,
      metrics,
      couplingByLabel,
      petriXt,
      relationSummary,
      sourceSignature,
      mappedCount: mappedEntries.length,
      mappingCandidateCount: Number(safeConfig.mappingCandidateCount || 0)
    };
  }

  return {
    buildFuzzyPetriResearchSource,
    buildFuzzyManualHypergraphResearchSource,
    normalizeFuzzyHypergraphMapping,
    buildNoMaxPlusSubnet
  };
});
