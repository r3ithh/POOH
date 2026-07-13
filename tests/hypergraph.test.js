"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  analyzeCExactSpectrum,
  analyzeRExact,
  analyzeStructure,
  enumerateTransversals,
  parseManualHypergraphText,
  reduceFra
} = require("../src/core/hypergraph");

test("enumerates exact and minimal transversals for a small XT-like hypergraph", () => {
  const matrix = [
    [1, 1, 0],
    [0, 1, 1]
  ];
  const result = enumerateTransversals(matrix, ["D1", "D2", "D3"]);
  assert.deepEqual(result.exact.map((indices) => indices.map((index) => result.labels[index])), [
    ["D2"],
    ["D1", "D3"]
  ]);
  assert.equal(result.minimal.length, 2);
  assert.equal(result.checkedSubsets, 7);
  assert.equal(result.totalSubsets, 8);
});

test("r-exact analysis reports XT as 1-exact when r* <= 1", () => {
  const matrix = [
    [1, 0],
    [0, 1]
  ];
  const result = analyzeRExact(matrix, ["E1", "E2"], ["D1", "D2"], 1);
  assert.equal(result.isOneExact, true);
  assert.equal(result.isRExact, true);
  assert.equal(result.rStar, 1);
  assert.equal(result.witness.hits, 1);
  assert.deepEqual(result.distribution, { 1: 1 });
});

test("FRA reduction removes dominated structures deterministically", () => {
  const matrix = [
    [1, 1, 0],
    [1, 0, 0],
    [0, 1, 1]
  ];
  const result = reduceFra(matrix, ["P1", "P2", "P3"], ["D1", "D2", "D3"]);
  assert.ok(result.reducedRowLabels.length <= 3);
  assert.ok(result.reducedColLabels.length <= 3);
  assert.equal(result.originalMatrix.length, 3);
  assert.equal(typeof result.metrics.ms, "number");
  assert.ok(result.metrics.rowPairComparisons > 0);
});

test("hypergraph structure analysis reports common structural classes", () => {
  const result = analyzeStructure(
    [
      [1, 1, 0],
      [0, 1, 1]
    ],
    ["E1", "E2"],
    ["v1", "v2", "v3"]
  );
  assert.equal(result.vertexCount, 3);
  assert.equal(result.edgeCount, 2);
  assert.equal(result.rank, 2);
  assert.equal(result.isUniform, true);
  assert.equal(result.isLinear, true);
  assert.equal(result.isSimple, true);
  assert.equal(result.isClutter, true);
  assert.equal(result.isRegular, false);
  assert.deepEqual(result.degrees, [1, 2, 1]);
  assert.match(result.cExactSummary, /c=1: 2/);
});

test("c-exact spectrum enumerates levels and candidates", () => {
  const result = analyzeCExactSpectrum(
    [
      [1, 1, 0],
      [0, 1, 1]
    ],
    ["v1", "v2", "v3"],
    2
  );
  assert.equal(result.solutionCount, 3);
  assert.deepEqual(result.levels.map((level) => [level.cValue, level.count]), [[1, 2], [2, 1]]);
  assert.deepEqual(result.levels[0].example, [1]);
  assert.equal(result.checkedSubsets, 7);
  assert.equal(result.totalSubsets, 8);
});

test("manual hypergraph parser builds deterministic matrix data", () => {
  const result = parseManualHypergraphText(`
    E2: v10, v2, v2
    E1 = {v1 v2} # comment
    v3 v1
  `, { createdAt: "2026-01-01T00:00:00.000Z" });
  assert.deepEqual(result.rowLabels, ["E2", "E1", "E3"]);
  assert.deepEqual(result.colLabels, ["v1", "v2", "v3", "v10"]);
  assert.deepEqual(result.matrix, [
    [0, 1, 0, 1],
    [1, 1, 0, 0],
    [1, 0, 1, 0]
  ]);
  assert.equal(result.createdAt, "2026-01-01T00:00:00.000Z");
});

test("manual hypergraph parser rejects empty input and empty edges", () => {
  assert.throws(() => parseManualHypergraphText(""), /at least one hyperedge/);
  assert.throws(() => parseManualHypergraphText("E1: {}"), /contains no hypervertices/);
});
