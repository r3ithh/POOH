"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const renderer = require("../src/core/decomposition-renderer");
const view = require("../src/core/decomposition-view");

const RENDER_OPTIONS = {
  width: 1600,
  height: 900,
  placeRadius: 26,
  transitionHalfW: 10,
  transitionHalfH: 30
};

test("decomposition renderer computes Petri-style connection points", () => {
  const placePoint = renderer.getConnectionPoint(
    { type: "place", x: 0, y: 0 },
    100,
    0,
    RENDER_OPTIONS
  );
  assert.equal(Math.round(placePoint.x), 26);
  assert.equal(Math.round(placePoint.y), 0);

  const transitionPoint = renderer.getConnectionPoint(
    { type: "transition", x: 0, y: 0, angle: 0 },
    100,
    0,
    RENDER_OPTIONS
  );
  assert.equal(Math.round(transitionPoint.x), 10);
  assert.equal(Math.round(transitionPoint.y), 0);
});

test("decomposition renderer builds edge paths for direct, parallel and self-loop arcs", () => {
  const from = { id: "P1", shape: "place", x: 0, y: 0 };
  const to = { id: "T1", shape: "transition", x: 100, y: 0, angle: 0 };

  const direct = renderer.buildDecompositionEdgePlan(
    { from: "P1", to: "T1", label: "2" },
    from,
    to,
    0,
    1,
    RENDER_OPTIONS
  );
  assert.match(direct.d, /^M /);
  assert.match(direct.d, / L /);
  assert.equal(direct.label, "2");

  const parallel = renderer.buildDecompositionEdgePlan(
    { from: "P1", to: "T1" },
    from,
    to,
    1,
    2,
    RENDER_OPTIONS
  );
  assert.match(parallel.d, / Q /);

  const selfLoop = renderer.buildDecompositionEdgePlan(
    { from: "T1", to: "T1", critical: true },
    to,
    to,
    0,
    1,
    RENDER_OPTIONS
  );
  assert.match(selfLoop.d, / C /);
  assert.match(selfLoop.className, /decomp-critical-edge/);
});

test("decomposition renderer builds hyperedge region plans for empty, binary and polygon edges", () => {
  const nodes = new Map([
    ["D1", { id: "D1", x: 100, y: 100 }],
    ["D2", { id: "D2", x: 300, y: 100 }],
    ["D3", { id: "D3", x: 200, y: 260 }]
  ]);

  const empty = renderer.buildHypergraphRegionPlan(
    { label: "E0", members: [], index: 0, color: "#111111" },
    nodes,
    RENDER_OPTIONS
  );
  assert.equal(empty.shape.tag, "rect");
  assert.equal(empty.shape.attrs["fill-opacity"], 0);
  assert.equal(empty.label.text, "E0");

  const binary = renderer.buildHypergraphRegionPlan(
    { label: "E1", members: ["D1", "D2"], index: 1, color: "#222222" },
    nodes,
    RENDER_OPTIONS
  );
  assert.equal(binary.shape.tag, "path");
  assert.match(binary.shape.attrs.d, /^M /);
  assert.equal(binary.memberPoints.length, 2);

  const polygon = renderer.buildHypergraphRegionPlan(
    { label: "E2", members: ["D1", "D2", "D3"], index: 2, color: "#333333" },
    nodes,
    RENDER_OPTIONS
  );
  assert.equal(polygon.shape.tag, "path");
  assert.match(polygon.shape.attrs.d, / Q /);
  assert.equal(polygon.memberPoints.length, 3);
});

test("decomposition view rounds hyperedge polygons without cutting through corners", () => {
  const path = view.roundedPolygonPath([
    { x: 0, y: 0 },
    { x: 120, y: 0 },
    { x: 60, y: 100 }
  ], 16);

  assert.match(path, /^M /);
  assert.match(path, / Q /);
  assert.match(path, / L /);
  assert.doesNotMatch(path, /^M 30 50/);
});

test("decomposition view expands hyperedge hulls around vertex disks", () => {
  const hull = view.expandPointsToDiskHull([
    { x: 100, y: 100 },
    { x: 240, y: 100 },
    { x: 170, y: 220 }
  ], 44, 16);

  assert.ok(hull.length >= 6);
  assert.ok(Math.min(...hull.map((point) => point.x)) <= 56);
  assert.ok(Math.max(...hull.map((point) => point.x)) >= 284);
  assert.ok(Math.min(...hull.map((point) => point.y)) <= 56);
  assert.ok(Math.max(...hull.map((point) => point.y)) >= 264);
});
