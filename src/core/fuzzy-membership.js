(function(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("./max-plus"));
  } else {
    root.PoohFuzzyMembershipCore = factory(root.PoohMaxPlusCore);
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function(maxPlusDependency) {
  "use strict";

  const maxPlusCore = maxPlusDependency || {};

  const FUZZY_MEMBERSHIP_DEFAULT_WEIGHTS = Object.freeze({
    base: 0.34,
    concurrency: 0.16,
    noConflict: 0.16,
    timing: 0.16,
    lowCoupling: 0.10,
    lowReconfiguration: 0.08
  });

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

  function lookupMetric(metrics, label) {
    if (!metrics) {
      return {};
    }
    if (typeof metrics.get === "function") {
      return metrics.get(label) || {};
    }
    return metrics[label] || {};
  }

  function buildFuzzyMembership(entries, placeIds, maxPlusSubnets, metrics, options) {
    const safeEntries = Array.isArray(entries) ? entries : [];
    const safePlaceIds = Array.isArray(placeIds) ? placeIds : [];
    const safeMaxPlusSubnets = Array.isArray(maxPlusSubnets) ? maxPlusSubnets : [];
    const weights = normalizeFuzzyMembershipWeights(options && options.membershipWeights);
    const finiteLambdas = safeMaxPlusSubnets
      .map((item) => finiteOrNull(item && item.lambda))
      .filter((value) => value !== null && value >= 0);
    const maxLambda = finiteLambdas.length > 0 ? Math.max(...finiteLambdas) : 0;
    const membership = new Map();
    const details = [];
    safePlaceIds.forEach((placeId) => {
      const row = new Map();
      safeEntries.forEach((entry) => {
        const label = String(entry && entry.label !== undefined ? entry.label : "");
        const supportPlaces = Array.isArray(entry && entry.supportPlaces) ? entry.supportPlaces : [];
        const covered = supportPlaces.includes(placeId);
        if (!covered) {
          row.set(label, 0);
          details.push({
            edge: placeId,
            label,
            covered: false,
            raw: 0,
            mu: 0,
            components: {
              concurrency: 0,
              noConflict: 0,
              timing: 0,
              lowCoupling: 0,
              lowReconfiguration: 0
            },
            contributions: {
              base: 0,
              concurrency: 0,
              noConflict: 0,
              timing: 0,
              lowCoupling: 0,
              lowReconfiguration: 0
            }
          });
          return;
        }
        const metric = lookupMetric(metrics, label);
        const lambda = finiteOrNull(metric.lambda);
        const timeQuality = lambda !== null && maxLambda > 0
          ? 1 - (lambda / Math.max(maxLambda, 0.000001)) * 0.75
          : 0.72;
        const components = {
          concurrency: clamp01(metric.concurrencyDensity),
          noConflict: 1 - clamp01(metric.conflictDensity),
          timing: clamp01(timeQuality),
          lowCoupling: 1 - clamp01(metric.coupling && metric.coupling.normalized),
          lowReconfiguration: 1 - clamp01(metric.sharedTransitionRatio)
        };
        const contributions = {
          base: weights.base,
          concurrency: weights.concurrency * components.concurrency,
          noConflict: weights.noConflict * components.noConflict,
          timing: weights.timing * components.timing,
          lowCoupling: weights.lowCoupling * components.lowCoupling,
          lowReconfiguration: weights.lowReconfiguration * components.lowReconfiguration
        };
        const raw = Object.values(contributions).reduce((sum, value) => sum + Number(value || 0), 0);
        const mu = clamp01(raw);
        row.set(label, mu);
        details.push({
          edge: placeId,
          label,
          covered: true,
          raw,
          mu,
          components,
          contributions,
          metrics: {
            conflictDensity: clamp01(metric.conflictDensity),
            concurrencyDensity: clamp01(metric.concurrencyDensity),
            coupling: clamp01(metric.coupling && metric.coupling.normalized),
            sharedTransitionRatio: clamp01(metric.sharedTransitionRatio),
            lambda
          }
        });
      });
      membership.set(placeId, row);
    });
    return {
      membership,
      details,
      model: {
        formula: "mu(v,E)=clamp01(base+wQ*Q+wC*(1-C)+wT*time+wD*(1-coupling)+wR*(1-reconfiguration))",
        weights,
        maxLambda,
        components: ["concurrency", "noConflict", "timing", "lowCoupling", "lowReconfiguration"]
      }
    };
  }

  function buildFuzzyMembershipRows(placeIds, entries, membership, details) {
    const safePlaceIds = Array.isArray(placeIds) ? placeIds : [];
    const safeEntries = Array.isArray(entries) ? entries : [];
    const membershipDetailByKey = new Map((Array.isArray(details) ? details : []).map((item) => [`${item.edge}|${item.label}`, item]));
    return safePlaceIds.map((placeId) => {
      const row = membership && typeof membership.get === "function" ? membership.get(placeId) || new Map() : new Map();
      return {
        edge: placeId,
        values: safeEntries.map((entry) => {
          const label = String(entry && entry.label !== undefined ? entry.label : "");
          return {
            label,
            mu: Number(row.get(label) || 0),
            detail: membershipDetailByKey.get(`${placeId}|${label}`) || null
          };
        })
      };
    });
  }

  return {
    FUZZY_MEMBERSHIP_DEFAULT_WEIGHTS,
    clamp01,
    finiteOrNull,
    normalizeFuzzyMembershipWeights,
    buildFuzzyMembership,
    buildFuzzyMembershipRows
  };
});
