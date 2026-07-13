(function(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("./hypergraph"), require("./i18n"));
  } else {
    root.PoohSelectionHypergraphCore = factory(root.PoohHypergraphCore, root.PoohI18n);
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function(hypergraphCore, i18n) {
  "use strict";

  function tr(key, params) {
    return i18n && typeof i18n.t === "function" ? i18n.t(key, params) : String(key || "");
  }

  function nowMs() {
    if (typeof performance !== "undefined" && typeof performance.now === "function") {
      return performance.now();
    }
    return Date.now();
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

  function requireHypergraphCore() {
    if (!hypergraphCore || typeof hypergraphCore.reduceFra !== "function") {
      throw new Error(tr("core.selection.hypergraphCoreMissing"));
    }
    return hypergraphCore;
  }

  function sumFraOps(metrics) {
    const safe = metrics && typeof metrics === "object" ? metrics : {};
    return Number(safe.essentialCellChecks || 0)
      + Number(safe.rowPairComparisons || 0)
      + Number(safe.colPairComparisons || 0)
      + Number(safe.vectorCellComparisons || 0);
  }

  function buildComponentPlaceMap(labels, sourceMap) {
    return labels.reduce((acc, label) => {
      acc[label] = Array.isArray(sourceMap[label]) ? sourceMap[label].slice() : [];
      return acc;
    }, {});
  }

  function buildSelectionHypergraphFromPinvariants(pinvariantResult) {
    if (!pinvariantResult || !Array.isArray(pinvariantResult.placeIds) || !Array.isArray(pinvariantResult.invariants)) {
      throw new Error(tr("core.selection.pinvariantsMissing"));
    }

    const core = requireHypergraphCore();
    const startSelectionMs = nowMs();
    const placeIds = pinvariantResult.placeIds.map(String).sort(naturalLabelCompare);
    const placeIndexById = new Map(placeIds.map((id, index) => [id, index]));
    const tagged = pinvariantResult.invariants.map((invariant, index) => ({
      ...invariant,
      _label: `D${index + 1}`
    }));
    const correct = tagged.filter((invariant) => invariant && invariant.correctSubnet === true);
    if (correct.length === 0) {
      throw new Error(tr("core.selection.noAutomataSubnets"));
    }

    const subnetLabels = correct.map((invariant) => invariant._label);
    const subnetPlaceMap = {};
    correct.forEach((invariant) => {
      subnetPlaceMap[invariant._label] = Array.from(new Set(Array.isArray(invariant.supportPlaces) ? invariant.supportPlaces.map(String) : []))
        .filter(Boolean)
        .sort(naturalLabelCompare);
    });

    const transposeMetrics = {
      cellAssignments: 0,
      supportWrites: 0,
      ms: 0
    };

    const transposeStartMs = nowMs();
    const subnetMatrix = correct.map((invariant) => {
      const row = new Array(placeIds.length).fill(0);
      const support = Array.isArray(invariant.supportPlaces) ? invariant.supportPlaces : [];
      support.forEach((placeId) => {
        const index = placeIndexById.get(String(placeId));
        if (index !== undefined) {
          row[index] = 1;
          transposeMetrics.supportWrites += 1;
        }
      });
      return row;
    });
    transposeMetrics.cellAssignments = subnetMatrix.length * placeIds.length;

    const originalRowLabels = placeIds.slice();
    const originalColLabels = subnetLabels.slice();
    const originalDualMatrix = originalRowLabels.map((_, placeIndex) => (
      subnetMatrix.map((row) => row[placeIndex] || 0)
    ));
    transposeMetrics.cellAssignments += originalRowLabels.length * subnetMatrix.length;
    transposeMetrics.ms = nowMs() - transposeStartMs;

    const fra = core.reduceFra(originalDualMatrix, originalRowLabels, originalColLabels);
    const fraMetrics = fra.metrics || {};
    const transposeOps = Number(transposeMetrics.cellAssignments || 0) + Number(transposeMetrics.supportWrites || 0);
    const fraOps = sumFraOps(fraMetrics);

    return {
      placeIds,
      subnetLabels,
      subnetPlaceMap,
      originalRowLabels,
      originalColLabels,
      originalDualMatrix,
      originalComponentPlaces: buildComponentPlaceMap(originalColLabels, subnetPlaceMap),
      reducedComponentPlaces: buildComponentPlaceMap(fra.reducedColLabels || [], subnetPlaceMap),
      subnetMatrix,
      essentialLabels: Array.isArray(fra.essentialLabels) ? fra.essentialLabels.slice().sort(naturalLabelCompare) : [],
      reducedRowLabels: Array.isArray(fra.reducedRowLabels) ? fra.reducedRowLabels.slice() : [],
      reducedColLabels: Array.isArray(fra.reducedColLabels) ? fra.reducedColLabels.slice() : [],
      reducedDualMatrix: Array.isArray(fra.reducedMatrix) ? fra.reducedMatrix.map((row) => row.slice()) : [],
      fra,
      metrics: {
        transpose: transposeMetrics,
        fra: fraMetrics,
        totalMs: nowMs() - startSelectionMs,
        totalOps: transposeOps + fraOps
      }
    };
  }

  return {
    buildSelectionHypergraphFromPinvariants
  };
});
