"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  buildAlphaCutReport,
  buildOptimizationCandidate,
  compareOptimizationCandidates,
  evaluateFuzzyTransversal,
  evaluateSelectedMaxPlusMapping,
  optimizeFuzzyTransversal,
  solveAlphaExactCover,
  summarizeAlphaSweep
} = require("../src/core/fuzzy-transversal");

function sampleCase() {
  const entries = [
    { label: "D1", supportPlaces: ["P1"] },
    { label: "D2", supportPlaces: ["P2"] },
    { label: "D3", supportPlaces: ["P1", "P2"] }
  ];
  const placeIds = ["P1", "P2"];
  const membership = new Map([
    ["P1", new Map([["D1", 0.9], ["D2", 0], ["D3", 0.8]])],
    ["P2", new Map([["D1", 0], ["D2", 0.85], ["D3", 0.8]])]
  ]);
  const couplingByLabel = new Map([
    ["D1", { sharedWith: [{ label: "D2", normalized: 0.1 }, { label: "D3", normalized: 0.4 }] }],
    ["D2", { sharedWith: [{ label: "D1", normalized: 0.1 }, { label: "D3", normalized: 0.5 }] }],
    ["D3", { sharedWith: [{ label: "D1", normalized: 0.4 }, { label: "D2", normalized: 0.5 }] }]
  ]);
  const maxPlusSubnets = [
    { label: "D1", lambda: 2 },
    { label: "D2", lambda: 1 },
    { label: "D3", noMaxPlus: true }
  ];
  return { entries, placeIds, membership, couplingByLabel, maxPlusSubnets };
}

test("fuzzy transversal core solves alpha-cut exact cover and ranks feasible candidates", () => {
  const { entries, placeIds, membership, couplingByLabel, maxPlusSubnets } = sampleCase();
  const constraints = { maxComponents: 2, maxCoupling: 0.2, lambdaLimit: 3 };

  const solved = solveAlphaExactCover(placeIds, entries, membership, 0.8);
  assert.equal(solved.found, true);
  assert.deepEqual(solved.solutionLabels, ["D1", "D2"]);

  const quality = evaluateFuzzyTransversal(["D1", "D2"], placeIds, membership, couplingByLabel);
  assert.equal(Number(quality.quality.toFixed(3)), 0.85);
  assert.equal(Number(quality.coupling.toFixed(3)), 0.1);

  const alphaCuts = buildAlphaCutReport(entries, placeIds, membership, couplingByLabel, maxPlusSubnets, 0.8, 0.5, constraints);
  assert.deepEqual(alphaCuts.map((row) => row.alpha), [0, 0.5, 0.8, 1]);
  const selected = alphaCuts.find((row) => row.selected);
  assert.equal(selected.found, true);
  assert.equal(selected.feasible, true);
  assert.deepEqual(selected.solutionLabels, ["D1", "D2"]);
  assert.equal(selected.maxPlus.complete, true);

  const summary = summarizeAlphaSweep(alphaCuts, 0.8);
  assert.equal(summary.exactLevels, 3);
  assert.equal(summary.selectedAlphaExact, true);
  assert.equal(summary.bestAlpha, 0.8);

  const optimization = optimizeFuzzyTransversal(entries, placeIds, membership, couplingByLabel, maxPlusSubnets, constraints);
  assert.equal(optimization.found, true);
  assert.equal(optimization.exact, true);
  assert.deepEqual(optimization.best.selectedLabels, ["D1", "D2"]);
});

test("fuzzy transversal core reports max-plus mapping and constraint violations", () => {
  const { placeIds, membership, couplingByLabel, maxPlusSubnets } = sampleCase();
  const maxPlusByLabel = new Map(maxPlusSubnets.map((item) => [item.label, item]));

  const mapping = evaluateSelectedMaxPlusMapping(["D1", "D3"], maxPlusByLabel);
  assert.equal(mapping.coverage, 0.5);
  assert.equal(mapping.complete, false);
  assert.deepEqual(mapping.unmappedLabels, ["D3"]);

  const candidate = buildOptimizationCandidate(
    ["D1", "D3"],
    placeIds,
    membership,
    couplingByLabel,
    maxPlusByLabel,
    { maxComponents: 2, maxCoupling: 0.2, lambdaLimit: 3 },
    1
  );
  assert.equal(candidate.feasible, false);
  assert.equal(candidate.violations.includes("coupling"), true);
  assert.equal(candidate.violations.includes("maxplus-mapping"), true);

  const better = buildOptimizationCandidate(
    ["D1", "D2"],
    placeIds,
    membership,
    couplingByLabel,
    maxPlusByLabel,
    { maxComponents: 2, maxCoupling: 0.2, lambdaLimit: 3 },
    2
  );
  assert.equal(compareOptimizationCandidates(better, candidate) < 0, true);
});
