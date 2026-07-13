"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  buildHypergraph,
  computeTransversals,
  normalizeStrategy
} = require("../src/core/transversal");

test("normalizes transversal strategy values for worker-compatible payloads", () => {
  assert.equal(normalizeStrategy("DLX"), "dlx");
  assert.equal(normalizeStrategy("backtracking"), "backtracking");
  assert.equal(normalizeStrategy("unknown"), "all");
});

test("computes exact transversals with the shared core contract", () => {
  const progress = [];
  const result = computeTransversals({
    matrix: [
      [1, 0],
      [0, 1]
    ],
    rowLabels: ["E1", "E2"],
    colLabels: ["D1", "D2"],
    strategy: "all",
    xtrec: { isXt: true }
  }, {
    onProgress(item) {
      progress.push(item);
    }
  });

  assert.equal(result.strategy, "all");
  assert.equal(result.isXtInput, true);
  assert.deepEqual(result.executed, ["xtr", "dlx", "backtrackingExact", "backtrackingRegular", "greedy"]);
  assert.equal(result.recommended.type, "exact");
  assert.equal(result.recommended.exact, true);
  assert.deepEqual(result.recommended.solutionLabels, ["D1", "D2"]);
  assert.equal(result.bestRegular.exact, true);
  assert.equal(result.results.xtr.found, true);
  assert.equal(result.results.dlx.found, true);
  assert.equal(result.results.backtrackingExact.found, true);
  assert.ok(progress.some((item) => item.phase === "xtr"));
  assert.ok(Number.isFinite(result.runtimeMs));
});

test("falls back to a regular transversal when exact selection does not exist", () => {
  const result = computeTransversals({
    matrix: [
      [1, 1, 0],
      [0, 1, 1],
      [1, 0, 1]
    ],
    rowLabels: ["E1", "E2", "E3"],
    colLabels: ["D1", "D2", "D3"],
    strategy: "all",
    xtrec: { isXt: false }
  });

  assert.equal(result.bestExact, null);
  assert.equal(result.recommended.type, "regular");
  assert.equal(result.recommended.coversAll, true);
  assert.equal(result.recommended.exact, false);
  assert.equal(result.recommended.size, 2);
  assert.deepEqual(result.recommended.solutionLabels, ["D1", "D2"]);
  assert.equal(result.results.backtrackingRegular.found, true);
  assert.equal(result.results.greedy.found, true);
});

test("builds hypergraph data with deterministic default labels", () => {
  const hg = buildHypergraph({
    matrix: [
      [1, 0, 1],
      [0, 1, 0]
    ]
  });

  assert.deepEqual(hg.rowLabels, ["E1", "E2"]);
  assert.deepEqual(hg.colLabels, ["V1", "V2", "V3"]);
  assert.deepEqual(hg.edges, [[0, 2], [1]]);
  assert.deepEqual(hg.rowsByCol, [[0], [1], [0]]);
});
