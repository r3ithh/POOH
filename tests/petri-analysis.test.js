"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  classificationToMap,
  computeClassificationFor,
  computeLivenessSafenessFor
} = require("../src/core/petri-analysis");

test("petri analysis core classifies a simple state-machine marked graph", () => {
  const nodes = [
    { id: "P1", type: "place", tokens: 1 },
    { id: "P2", type: "place", tokens: 0 },
    { id: "T1", type: "transition" },
    { id: "T2", type: "transition" }
  ];
  const arcs = [
    { from: "P1", to: "T1", weight: 1 },
    { from: "T1", to: "P2", weight: 1 },
    { from: "P2", to: "T2", weight: 1 },
    { from: "T2", to: "P1", weight: 1 }
  ];

  const classes = classificationToMap(computeClassificationFor(nodes, arcs));
  assert.equal(classes.get("PN"), true);
  assert.equal(classes.get("OPN"), true);
  assert.equal(classes.get("SM"), true);
  assert.equal(classes.get("MG"), true);
  assert.equal(classes.get("FC"), true);
  assert.equal(classes.get("EFC"), true);
});

test("petri analysis core computes bounded liveness and safeness summary", () => {
  const result = computeLivenessSafenessFor([
    { id: "P1", type: "place", tokens: 1 },
    { id: "P2", type: "place", tokens: 0 },
    { id: "T1", type: "transition" },
    { id: "T2", type: "transition" }
  ], [
    { from: "P1", to: "T1", weight: 1 },
    { from: "T1", to: "P2", weight: 1 },
    { from: "P2", to: "T2", weight: 1 },
    { from: "T2", to: "P1", weight: 1 }
  ], 20);

  assert.equal(result.safe, true);
  assert.equal(result.live, true);
  assert.equal(result.truncated, false);
  assert.equal(result.statesCount, 2);
  assert.equal(result.deadlocksCount, 0);
});

test("petri analysis core reports incomplete empty models consistently", () => {
  const result = computeLivenessSafenessFor([], [], 20);
  assert.equal(result.placeCount, 0);
  assert.equal(result.transitionCount, 0);
  assert.equal(result.safe, true);
  assert.equal(result.live, false);
  assert.equal(result.statesCount, 0);
});
