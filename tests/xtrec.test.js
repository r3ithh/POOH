"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  buildHypergraphFromMatrix,
  computeXtrec
} = require("../src/core/xtrec");

test("builds XTREC bitset hypergraph from matrix input", () => {
  const hg = buildHypergraphFromMatrix(
    [
      [1, 0],
      [0, 1]
    ],
    ["E1", "E2"],
    ["v1", "v2"]
  );

  assert.equal(hg.vertexCount, 2);
  assert.equal(hg.wordCount, 1);
  assert.deepEqual(hg.vertexLabels, ["v1", "v2"]);
  assert.equal(hg.edgeEntries.length, 2);
  assert.equal(hg.edgeEntries[0].label, "E1");
});

test("recognizes a simple XT hypergraph with CPU engine", async () => {
  const progress = [];
  const result = await computeXtrec({
    matrix: [
      [1, 0],
      [0, 1]
    ],
    rowLabels: ["E1", "E2"],
    colLabels: ["v1", "v2"],
    acceleration: "cpu"
  }, {
    onProgress(item) {
      progress.push(item);
    }
  });

  assert.equal(result.isXt, true);
  assert.equal(result.edgeCount, 2);
  assert.equal(result.vertexCount, 2);
  assert.equal(result.checksTotal, 2);
  assert.equal(result.checksPerformed, 2);
  assert.equal(result.witness, null);
  assert.equal(result.accelerationRequested, "cpu");
  assert.equal(result.accelerationUsed, "cpu");
  assert.ok(result.operations.intersectionChecks >= 2);
  assert.ok(progress.some((item) => /XTREC: v=/.test(item.message)));
});

test("reports a witness for a non-XT triangle hypergraph", async () => {
  const result = await computeXtrec({
    matrix: [
      [1, 1, 0],
      [0, 1, 1],
      [1, 0, 1]
    ],
    rowLabels: ["Eab", "Ebc", "Eac"],
    colLabels: ["a", "b", "c"],
    acceleration: "cpu"
  });

  assert.equal(result.isXt, false);
  assert.equal(result.edgeCount, 3);
  assert.equal(result.vertexCount, 3);
  assert.ok(result.checksPerformed > 0);
  assert.ok(result.checksPerformed <= result.checksTotal);
  assert.ok(result.witness);
  assert.match(result.witness.message, /Naruszenie warunku XT/);
  assert.equal(result.accelerationUsed, "cpu");
  assert.ok(result.operations.intersectionHits >= 1);
});

test("falls back when WebGPU XTREC acceleration is unavailable", async () => {
  const result = await computeXtrec({
    matrix: [
      [1, 0],
      [0, 1]
    ],
    rowLabels: ["E1", "E2"],
    colLabels: ["v1", "v2"],
    acceleration: "webgpu"
  });

  assert.equal(result.isXt, true);
  assert.equal(result.accelerationRequested, "webgpu");
  assert.match(result.accelerationWarning, /WebGPU is unavailable|Switched/);
  assert.ok(["cpu", "webgl", "webgpu"].includes(result.accelerationUsed));
});

test("treats an empty hypergraph as XT with no checks", async () => {
  const result = await computeXtrec({
    matrix: [],
    acceleration: "cpu"
  });

  assert.equal(result.isXt, true);
  assert.equal(result.edgeCount, 0);
  assert.equal(result.vertexCount, 0);
  assert.equal(result.checksTotal, 0);
  assert.equal(result.checksPerformed, 0);
});
