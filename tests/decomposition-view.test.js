"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const view = require("../src/core/decomposition-view");

const CANVAS = {
  width: 1600,
  height: 900,
  yesText: "YES",
  noText: "NO",
  labels: {
    exactTransversal: "T*",
    selectionHypergraph: "Hsel",
    pinvariants: "Pinv",
    sourceLayout: "source",
    autoLayout: "auto",
    sfcSource: "model SFC/(max,+)",
    sfcMark: "SFC",
    smcMark: "SMC",
    sfcStatus: "SFC view",
    maxPlusStatus: "Max-plus view",
    automataStatus: "Automata view"
  }
};

const PETRI_STATE = {
  nodes: [
    { id: "P1", label: "P1", type: "place", x: 0, y: 0, tokens: 1 },
    { id: "P2", label: "P2", type: "place", x: 100, y: 0, tokens: 0 },
    { id: "P3", label: "P3", type: "place", x: 200, y: 0, tokens: 0 },
    { id: "T1", label: "T1", type: "transition", x: 50, y: 60, angle: 90 },
    { id: "T2", label: "T2", type: "transition", x: 150, y: 60, angle: -90 }
  ],
  arcs: [
    { from: "P1", to: "T1", weight: 1 },
    { from: "T1", to: "P2", weight: 1 },
    { from: "P2", to: "T2", weight: 1 },
    { from: "T2", to: "P1", weight: 1 },
    { from: "P3", to: "T2", weight: 1 },
    { from: "T2", to: "P3", weight: 1 }
  ]
};

const PINVARIANT_RESULT = {
  invariants: [
    { supportPlaces: ["P1", "P2"], markedSupportCount: 1, correctSubnet: true },
    { supportPlaces: ["P3"], markedSupportCount: 0, correctSubnet: true },
    { supportPlaces: ["P1", "P3"], markedSupportCount: 1, correctSubnet: false }
  ]
};

test("decomposition view core builds selection-hypergraph entries and view graphs", () => {
  const entry = view.buildHypergraphEntryFromMatrix(
    [
      [1, 0, 1],
      [0, 1, 1]
    ],
    ["P1", "P2"],
    ["D1", "D2", "D3"],
    {
      label: "Hsel",
      title: "Selection hypergraph",
      sourceMode: "selection",
      xtrec: { isXt: true },
      transversal: {
        recommended: {
          found: true,
          solutionLabels: ["D1", "D2"],
          size: 2,
          type: "exact"
        }
      }
    }
  );

  const graph = view.buildHypergraphGraph(entry, CANVAS);

  assert.equal(graph.type, "hypergraph");
  assert.deepEqual(graph.nodes.map((node) => node.id), ["D1", "D2", "D3"]);
  assert.equal(graph.hyperedges.length, 2);
  assert.deepEqual(graph.hyperedges[0].members, ["D1", "D3"]);
  assert.deepEqual(graph.hyperedges[1].members, ["D2", "D3"]);
  assert.equal(graph.details.some((line) => /XTREC: TRUE/.test(line)), true);
  assert.equal(graph.details.some((line) => /D1, D2/.test(line)), true);
});

test("decomposition view core preserves imported Petri subnet topology in source layout", () => {
  const entry = {
    label: "D1",
    supportPlaces: ["P1", "P2"],
    transitionIds: ["T1"],
    markedSupportCount: 1,
    correctSubnet: true,
    nodes: [
      { id: "P1", label: "P1", shape: "place", x: 0, y: 0, tokens: 1 },
      { id: "T1", label: "T1", shape: "transition", x: 500, y: 300, angle: 0 },
      { id: "P2", label: "P2", shape: "place", x: 1000, y: 600, tokens: 0 }
    ],
    edges: [
      { from: "P1", to: "T1", label: "" },
      { from: "T1", to: "P2", label: "" }
    ]
  };

  const graph = view.buildAutomataGraph(entry, "source", CANVAS);

  assert.equal(graph.nodes.length, 3);
  assert.equal(graph.edges.length, 2);
  graph.nodes.forEach((node) => {
    assert.equal(Number.isFinite(node.x), true);
    assert.equal(Number.isFinite(node.y), true);
    assert.equal(node.x >= 0 && node.x <= CANVAS.width, true);
    assert.equal(node.y >= 0 && node.y <= CANVAS.height, true);
  });
  assert.equal(graph.details.some((line) => /Valid subnet: YES/.test(line)), true);
});

test("decomposition view core builds automata subnet entries from P-invariants and exact selections", () => {
  const selection = {
    transversal: {
      recommended: {
        found: true,
        solutionLabels: ["D1"]
      }
    }
  };

  const selected = view.buildAutomataSubnetsForView("automata-transversal", PINVARIANT_RESULT, PETRI_STATE, selection);
  const allCorrect = view.buildAutomataSubnetsForView("automata-all", PINVARIANT_RESULT, PETRI_STATE, selection);
  const allPinvariants = view.buildAutomataSubnetsForView("automata-pinv", PINVARIANT_RESULT, PETRI_STATE, selection);

  assert.deepEqual(selected.map((entry) => entry.label), ["D1"]);
  assert.deepEqual(selected[0].supportPlaces, ["P1", "P2"]);
  assert.deepEqual(selected[0].transitionIds, ["T1", "T2"]);
  assert.equal(selected[0].inTransversal, true);
  assert.deepEqual(allCorrect.map((entry) => entry.label), ["D1", "D2"]);
  assert.deepEqual(allPinvariants.map((entry) => entry.label), ["D1", "D2", "D3"]);
});

test("decomposition view core formats mode labels and status summaries", () => {
  assert.equal(view.normalizeDecompositionViewMode("missing"), "automata-transversal");
  assert.equal(view.normalizeDecompositionViewMode("MAXPLUS"), "maxplus");

  const automataEntry = view.buildAutomataSubnetsForView(
    "automata-transversal",
    PINVARIANT_RESULT,
    PETRI_STATE,
    {
      transversal: {
        recommended: {
          found: true,
          solutionLabels: ["D1"]
        }
      }
    }
  )[0];
  assert.equal(view.getSubnetOptionLabel("automata-transversal", automataEntry, CANVAS), "D1 (2 P / 2 T) ✓");

  const automataView = view.buildDecompositionGraphForMode("automata-transversal", automataEntry, "source", CANVAS);
  assert.equal(automataView.graph.nodes.length > 0, true);
  assert.match(automataView.status, /Automata view D1 \[T\*\]/);

  const maxPlusEntry = view.buildMaxPlusGraphEntry(
    "D1",
    ["T1"],
    [[1]],
    1,
    1,
    "model SFC/(max,+)",
    []
  );
  assert.equal(view.getSubnetOptionLabel("maxplus", maxPlusEntry, CANVAS), "D1 (1 T, λ=1.000, SFC)");
  const maxPlusView = view.buildDecompositionGraphForMode("maxplus", maxPlusEntry, "auto", CANVAS);
  assert.match(maxPlusView.status, /Max-plus view D1/);
});

test("decomposition view core builds SFC subnet entries without DOM state", () => {
  const entries = view.buildSfcSubnetsForView({
    subnets: [
      {
        label: "D1",
        initialStep: "S1",
        steps: ["S1", "S2"],
        transitions: [
          { id: "T1", from: ["S1"], to: ["S2"] }
        ]
      }
    ]
  });

  assert.equal(entries.length, 1);
  assert.deepEqual(entries[0].steps, ["S1", "S2"]);
  assert.deepEqual(entries[0].transitions, ["T1"]);
  assert.equal(entries[0].nodes.length, 3);
  assert.equal(entries[0].edges.length, 2);
  assert.equal(entries[0].nodes.find((node) => node.id === "step:S1").tokens, 1);
});

test("decomposition view core builds max-plus transition graphs with critical-cycle metadata", () => {
  const entry = view.buildMaxPlusGraphEntry(
    "D1",
    ["T1", "T2"],
    [
      [null, 2],
      [3, null]
    ],
    2.5,
    0.4,
    "SFC/max-plus",
    [{ from: "T1", to: "T2", placeId: "P1" }]
  );

  const graph = view.buildMaxPlusGraph(entry, CANVAS);

  assert.equal(graph.nodes.length, 2);
  assert.equal(graph.edges.length, 2);
  assert.equal(graph.edges.some((edge) => edge.critical), true);
  assert.equal(graph.nodes.some((node) => node.critical), true);
  assert.equal(graph.details.some((line) => /Lambda: 2\.500000/.test(line)), true);
  assert.equal(graph.details.some((line) => /Critical cycle/.test(line)), true);
});

test("decomposition view core builds max-plus subnet entries from automata fallback data", () => {
  const entries = view.buildMaxPlusSubnetsForView(
    {
      pinvariantResult: PINVARIANT_RESULT,
      petriState: PETRI_STATE,
      selectionHypergraphResult: {
        transversal: {
          recommended: {
            found: true,
            solutionLabels: ["D1"]
          }
        }
      },
      maxPlusOptions: {
        defaultDelay: 2,
        syncOverhead: 0,
        delayMap: {}
      },
      labels: {
        exactTransversal: "T*",
        selectionHypergraph: "Hsel",
        pinvariants: "Pinv"
      }
    },
    CANVAS
  );

  assert.equal(entries.length, 1);
  assert.equal(entries[0].label, "D1");
  assert.equal(entries[0].sourceMode, "T*");
  assert.deepEqual(entries[0].transitions, ["T1", "T2"]);
  assert.equal(entries[0].edges.length, 2);
  assert.equal(entries[0].edgeRows.length, 2);
  assert.equal(entries[0].lambda, 2);
  assert.equal(entries[0].throughput, 0.5);
});
