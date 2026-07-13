"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const pnh = require("../src/core/pnh");
const layout = require("../src/core/petri-layout");

const CANVAS = { width: 1600, height: 900, padding: 70, clampMargin: 36 };

function assertNodesOnCanvas(nodes) {
  nodes.forEach((node) => {
    assert.equal(Number.isFinite(node.x), true, `${node.id}.x should be finite`);
    assert.equal(Number.isFinite(node.y), true, `${node.id}.y should be finite`);
    assert.equal(node.x >= 36 && node.x <= 1564, true, `${node.id}.x should be clamped`);
    assert.equal(node.y >= 36 && node.y <= 864, true, `${node.id}.y should be clamped`);
  });
}

test("Petri layout core builds deterministic imported state from matrix PNH", () => {
  const parsed = pnh.parsePnhText([
    "2",
    "5",
    "x1",
    "1x",
    "10"
  ].join("\n"));

  const first = layout.buildImportedStateFromParsedPnh(parsed, "layered", CANVAS);
  const second = layout.buildImportedStateFromParsedPnh(parsed, "layered", CANVAS);

  assert.deepEqual(first, second);
  assert.equal(first.nodes.length, 4);
  assert.equal(first.arcs.length, 4);
  assert.deepEqual(first.counters, { place: 3, transition: 3, arc: 5 });
  assert.equal(first.settings.layoutMode, "layered");
  assert.match(first.metadata.find((entry) => entry.key === "ImportWarning").value, /Declared 5 transitions/);
  assertNodesOnCanvas(first.nodes);
});

test("Petri layout core normalizes section PNH coordinates and transition angles", () => {
  const parsed = pnh.parsePnhText([
    "PNH 1.0",
    "META source=\"layout test\"",
    "[PLACES]",
    "P1 label=\"Start\" tokens=1 x=0 y=0",
    "P2 label=\"End\" tokens=0 x=1000 y=500",
    "[TRANSITIONS]",
    "T1 label=\"go\" angle=92 x=500 y=250",
    "[ARCS]",
    "A1 P1 -> T1 weight=1",
    "A2 T1 -> P2 weight=1",
    "END"
  ].join("\n"));

  const state = layout.buildImportedStateFromParsedPnh(parsed, "coordinates", CANVAS);
  const byId = new Map(state.nodes.map((node) => [node.id, node]));

  assert.equal(state.metadata.find((entry) => entry.key === "META.source").value, "layout test");
  assert.equal(byId.get("T1").angle, 90);
  assert.equal(byId.get("P1").x < byId.get("P2").x, true);
  assert.equal(byId.get("P1").y < byId.get("P2").y, true);
  assertNodesOnCanvas(state.nodes);
});

test("Petri layout core supports direct relayout modes", () => {
  const nodes = [
    { id: "P1", type: "place", label: "P1", tokens: 1 },
    { id: "P2", type: "place", label: "P2", tokens: 0 },
    { id: "T1", type: "transition", label: "T1", angle: 0 }
  ];
  const arcs = [
    { id: "A1", from: "P1", to: "T1", weight: 1 },
    { id: "A2", from: "T1", to: "P2", weight: 1 }
  ];

  ["smart", "layered", "radial", "organic"].forEach((mode) => {
    const relayout = layout.layoutImportedNodes(nodes, arcs, mode, CANVAS);
    assert.equal(relayout.length, nodes.length);
    assertNodesOnCanvas(relayout);
  });
});
