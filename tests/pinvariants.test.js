"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { parsePnhText } = require("../src/core/pnh");
const {
  buildIncidence,
  computePinvariantsMartinezSilva,
  normalizeVector,
  vectorDot
} = require("../src/core/pinvariants");

function readExampleNet(name) {
  const filePath = path.join(__dirname, "..", "examples", name, "input.pnh");
  return parsePnhText(fs.readFileSync(filePath, "utf8"));
}

test("builds incidence matrix and marking from Petri net nodes/arcs", () => {
  const net = buildIncidence(
    [
      { id: "P2", type: "place", tokens: 0 },
      { id: "P1", type: "place", tokens: 1 },
      { id: "T1", type: "transition" }
    ],
    [
      { from: "P1", to: "T1", weight: 1 },
      { from: "T1", to: "P2", weight: 2 }
    ]
  );

  assert.deepEqual(net.placeIds, ["P1", "P2"]);
  assert.deepEqual(net.transitionIds, ["T1"]);
  assert.deepEqual(net.markedPlaces, [true, false]);
  assert.deepEqual(net.incidence, [[-1], [2]]);
});

test("computes cover-stop P-invariants for the small SoftwareX fixture", async () => {
  const net = readExampleNet("small_petri_net");
  const progress = [];
  const result = await computePinvariantsMartinezSilva(net.nodes, net.arcs, "cover-stop", "cpu", {
    onProgress(item) {
      progress.push(item);
    }
  });

  assert.equal(result.mode, "cover-stop");
  assert.deepEqual(result.placeIds, ["P1", "P2"]);
  assert.deepEqual(result.transitionIds, ["T1", "T2"]);
  assert.equal(result.coveredAllPlaces, true);
  assert.equal(result.correctSubnetsCount, 1);
  assert.equal(result.earlyStopped, true);
  assert.equal(result.processedStages, 1);
  assert.deepEqual(result.invariants.map((item) => item.vector), [[1, 1]]);
  assert.deepEqual(result.invariants[0].supportPlaces, ["P1", "P2"]);
  assert.equal(result.invariants[0].correctSubnet, true);
  assert.equal(result.accelerationUsed, "cpu");
  assert.ok(result.operations.dotProductEvaluations > 0);
  assert.ok(progress.some((item) => /coverage=YES/.test(item.message)));
});

test("computes full P-invariants for the XT decomposition fixture", async () => {
  const net = readExampleNet("xt_decomposition_case");
  const result = await computePinvariantsMartinezSilva(net.nodes, net.arcs, "full", "cpu");

  assert.equal(result.mode, "full");
  assert.deepEqual(result.placeIds, ["P1", "P2", "P3"]);
  assert.deepEqual(result.transitionIds, ["T1", "T2", "T3"]);
  assert.equal(result.processedStages, 3);
  assert.equal(result.totalStages, 3);
  assert.equal(result.earlyStopped, false);
  assert.equal(result.coveredAllPlaces, true);
  assert.deepEqual(result.invariants.map((item) => item.vector), [[1, 1, 1]]);
  assert.equal(result.invariants[0].markedSupportCount, 1);
  assert.equal(result.invariants[0].correctSubnet, true);
});

test("normalizes vectors and computes dot products deterministically", () => {
  assert.deepEqual(normalizeVector([2, 4, 0]), [1, 2, 0]);
  assert.deepEqual(normalizeVector([0, 0, 0]), [0, 0, 0]);
  assert.equal(vectorDot([1, 2, 3], [4, 0, -1]), 1);
});
