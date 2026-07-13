"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { parsePnhText, exportSectionPnh } = require("../src/core/pnh");

test("matrix PNH import parses places, transitions, arcs and marking", () => {
  const input = [
    "2",
    "2",
    "x1",
    "1x",
    "10",
    "",
    ";Places=P1;P2",
    ";Transitions=t1;t2"
  ].join("\n");
  const net = parsePnhText(input);
  assert.equal(net.format, "matrix");
  assert.equal(net.nodes.filter((node) => node.type === "place").length, 2);
  assert.equal(net.nodes.filter((node) => node.type === "transition").length, 2);
  assert.equal(net.arcs.length, 4);
  assert.equal(net.nodes.find((node) => node.id === "P1").tokens, 1);
});

test("matrix PNH import reports transition count mismatch as warning", () => {
  const input = [
    "2",
    "5",
    "x1",
    "1x",
    "10"
  ].join("\n");
  const net = parsePnhText(input);
  assert.equal(net.format, "matrix");
  assert.equal(net.nodes.filter((node) => node.type === "transition").length, 2);
  assert.match(net.warnings.join("\n"), /Declared 5 transitions; parsed 2/);
});

test("section PNH export can be imported again", () => {
  const net = {
    nodes: [
      { id: "P1", type: "place", label: "P1", tokens: 1, x: 0, y: 0 },
      { id: "P2", type: "place", label: "P2", tokens: 0, x: 0, y: 0 },
      { id: "T1", type: "transition", label: "t1", x: 0, y: 0, angle: 0 }
    ],
    arcs: [
      { id: "A1", from: "P1", to: "T1", weight: 1 },
      { id: "A2", from: "T1", to: "P2", weight: 1 }
    ]
  };
  const exported = exportSectionPnh(net);
  const parsed = parsePnhText(exported);
  assert.equal(parsed.format, "section");
  assert.equal(parsed.nodes.length, 3);
  assert.equal(parsed.arcs.length, 2);
});

test("section PNH import preserves META attributes", () => {
  const input = [
    "PNH 1.0",
    "META source=\"unit test\" profile=softwarex",
    "[PLACES]",
    "P1 label=\"Ready\" tokens=1",
    "[TRANSITIONS]",
    "T1 label=\"go\" angle=90",
    "[ARCS]",
    "A1 P1 -> T1 weight=1",
    "[MARKING]",
    "P1=1",
    "END"
  ].join("\n");
  const parsed = parsePnhText(input);
  assert.equal(parsed.format, "section");
  assert.equal(parsed.metadata.find((entry) => entry.key === "META.source").value, "unit test");
  assert.equal(parsed.metadata.find((entry) => entry.key === "META.profile").value, "softwarex");
  assert.equal(parsed.nodes.find((node) => node.id === "T1").angle, 90);
});
