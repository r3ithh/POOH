"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  buildMaxPlusTransversalModel,
  buildStandaloneMaxPlusForAutomata,
  computePetriXtRelations,
  fuzzyMaxPlusMultiply
} = require("../src/core/max-plus");

test("max-plus core builds local and transversal timing models", () => {
  const arcs = [
    { from: "T1", to: "P1" },
    { from: "P1", to: "T2" },
    { from: "T2", to: "P2" },
    { from: "P2", to: "T1" }
  ];
  const local = buildStandaloneMaxPlusForAutomata(
    { label: "D1", supportPlaces: ["P1", "P2"], transitionIds: ["T1", "T2"] },
    new Set(),
    { delayMap: { P1: 2, P2: 3 } },
    arcs
  );

  assert.deepEqual(local.matrix, [
    [null, 3],
    [2, null]
  ]);
  assert.equal(local.lambda, 2.5);
  assert.deepEqual(fuzzyMaxPlusMultiply(local.matrix, [0, 1]), [4, 2]);

  const global = buildMaxPlusTransversalModel(
    ["D1"],
    [{ label: "D1", supportPlaces: ["P1", "P2"], transitionIds: ["T1", "T2"] }],
    { delayMap: { P1: 2, P2: 3 } },
    "A_T",
    true,
    arcs
  );

  assert.equal(global.complete, true);
  assert.equal(global.lambda, 2.5);
  assert.equal(global.matrix[1][0], 2);
});

test("max-plus core computes Petri/XT relation reachability", () => {
  const relations = computePetriXtRelations([
    { id: "P0", type: "place", tokens: 1 },
    { id: "P1", type: "place", tokens: 1 },
    { id: "T1", type: "transition" },
    { id: "T2", type: "transition" }
  ], [
    { from: "P0", to: "T1" },
    { from: "P0", to: "T2" },
    { from: "P1", to: "T2" },
    { from: "T1", to: "P1" }
  ], 20);

  assert.equal(relations.conflictPairs.has("T1|T2"), true);
  assert.equal(relations.sequentialPairs.has("T1->T2"), true);
  assert.equal(relations.stateCount > 0, true);
  assert.equal(relations.truncated, false);
});
