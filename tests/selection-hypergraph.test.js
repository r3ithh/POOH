"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { buildSelectionHypergraphFromPinvariants } = require("../src/core/selection-hypergraph");
const { enumerateTransversals } = require("../src/core/hypergraph");

test("builds a selection hypergraph from correct state-machine components", () => {
  const result = buildSelectionHypergraphFromPinvariants({
    placeIds: ["P1", "P2", "P3"],
    invariants: [
      { label: "custom-a", correctSubnet: true, supportPlaces: ["P1", "P2"] },
      { label: "custom-b", correctSubnet: true, supportPlaces: ["P2", "P3"] },
      { label: "custom-c", correctSubnet: false, supportPlaces: ["P1"] }
    ]
  });
  assert.deepEqual(result.originalColLabels, ["D1", "D2"]);
  assert.equal(result.originalDualMatrix.length, 3);
  assert.ok(result.reducedDualMatrix.length <= result.originalDualMatrix.length);
  assert.deepEqual(result.subnetPlaceMap.D1, ["P1", "P2"]);
  assert.deepEqual(result.originalComponentPlaces.D2, ["P2", "P3"]);
  assert.ok(result.metrics.transpose.cellAssignments > 0);
  assert.equal(result.metrics.totalOps, result.metrics.transpose.cellAssignments + result.metrics.transpose.supportWrites
    + result.metrics.fra.essentialCellChecks
    + result.metrics.fra.rowPairComparisons
    + result.metrics.fra.colPairComparisons
    + result.metrics.fra.vectorCellComparisons);
  assert.deepEqual(result.fra.reducedMatrix, result.reducedDualMatrix);
});

test("selection hypergraph supports exact transversal extraction", () => {
  const result = buildSelectionHypergraphFromPinvariants({
    placeIds: ["P1", "P2"],
    invariants: [
      { label: "D1", correctSubnet: true, supportPlaces: ["P1"] },
      { label: "D2", correctSubnet: true, supportPlaces: ["P2"] }
    ]
  });
  const transversals = enumerateTransversals(result.reducedDualMatrix, result.reducedColLabels);
  assert.deepEqual(transversals.exact[0].map((index) => transversals.labels[index]), ["D1", "D2"]);
});
