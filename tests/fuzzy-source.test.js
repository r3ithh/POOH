"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  buildFuzzyManualHypergraphResearchSource,
  buildFuzzyPetriResearchSource,
  buildNoMaxPlusSubnet,
  normalizeFuzzyHypergraphMapping
} = require("../src/core/fuzzy-source");

test("fuzzy source core normalizes graphic hypergraph mappings and no-max-plus placeholders", () => {
  const mapping = normalizeFuzzyHypergraphMapping({
    mapped: true,
    source: "SMC",
    label: "D1",
    supportPlaces: ["P2", "P1"],
    transitionIds: ["T2", "T1"]
  });

  assert.equal(mapping.mapped, true);
  assert.deepEqual(mapping.supportPlaces, ["P1", "P2"]);
  assert.deepEqual(mapping.transitionIds, ["T1", "T2"]);

  const placeholder = buildNoMaxPlusSubnet({
    label: "H1",
    supportPlaces: ["E1"],
    mapping
  });
  assert.equal(placeholder.noMaxPlus, true);
  assert.equal(placeholder.mapping.source, "SMC");
  assert.deepEqual(placeholder.mapping.places, ["P1", "P2"]);
});

test("fuzzy source core builds manual hypergraph research sources", () => {
  const source = buildFuzzyManualHypergraphResearchSource({
    options: {
      alpha: 0.7,
      constraints: { maxComponents: 2, maxCoupling: 0.5, lambdaLimit: null }
    },
    hypergraph: {
      rowLabels: ["E1", "E2"],
      colLabels: ["H1", "H2"],
      matrix: [
        [1, 1],
        [0, 1]
      ]
    },
    mappingsByLabel: new Map([
      ["H1", { mapped: true, source: "SMC", label: "D1", supportPlaces: ["P1"], transitionIds: ["T1"] }],
      ["H2", { mapped: false, source: "none", label: "", supportPlaces: [], transitionIds: [] }]
    ]),
    mappingCandidateCount: 3,
    buildMaxPlusModel: (entry) => ({
      label: entry.label,
      transitions: entry.transitionIds.slice(),
      transitionCount: entry.transitionIds.length,
      edgeCount: entry.supportPlaces.length,
      lambda: 2,
      throughput: 0.5,
      matrix: [[0]],
      edgeRows: [],
      stronglyConnected: true,
      criticalCycle: null,
      sampleTrajectory: [],
      operations: 1
    })
  });

  assert.deepEqual(source.placeIds, ["E1", "E2"]);
  assert.deepEqual(source.entries.map((entry) => entry.supportPlaces), [["E1"], ["E1", "E2"]]);
  assert.equal(source.mappedCount, 1);
  assert.equal(source.mappingCandidateCount, 3);
  assert.equal(source.maxPlusSubnets[0].lambda, 2);
  assert.equal(source.maxPlusSubnets[1].noMaxPlus, true);
  assert.equal(source.metrics.get("H2").concurrencyDensity, 1);
  assert.equal(source.relationSummary.incidence, 3);
  assert.equal(source.petriXt.counts.concurrency, 1);
  assert.deepEqual(source.sourceSignature.mappings[0], {
    hypervertex: "H1",
    source: "SMC",
    component: "D1",
    places: ["P1"],
    transitions: ["T1"]
  });
});

test("fuzzy source core builds Petri/XT research sources from structural relations", () => {
  const entries = [
    { label: "D1", supportPlaces: ["P1", "P2"], transitionIds: ["T1", "T2"] },
    { label: "D2", supportPlaces: ["P2", "P3"], transitionIds: ["T2", "T3"] }
  ];
  const source = buildFuzzyPetriResearchSource({
    entries,
    placeIds: ["P1", "P2", "P3"],
    maxPlusSubnets: [
      { label: "D1", lambda: 3, throughput: 1 / 3, edgeCount: 2 },
      { label: "D2", lambda: 2, throughput: 0.5, edgeCount: 3 }
    ],
    relations: {
      transitionIds: ["T1", "T2", "T3"],
      conflictPairs: new Set(["T1|T2"]),
      coenabledPairs: new Set(["T1|T3"]),
      sequentialPairs: new Set(["T1->T2", "T2->T3"]),
      stateCount: 5,
      statesLimit: 100,
      truncated: false,
      safe: true
    }
  });

  assert.deepEqual(source.placeIds, ["P1", "P2", "P3"]);
  assert.equal(source.relationSummary.transitions, 3);
  assert.equal(source.relationSummary.conflicts, 1);
  assert.equal(source.petriXt.matrices.conflict[0][1], 1);
  assert.equal(source.petriXt.matrices.concurrency[0][2], 1);
  assert.equal(source.petriXt.matrices.sequential[0][1], 1);
  assert.equal(source.metrics.get("D1").conflictDensity, 1);
  assert.equal(source.metrics.get("D1").concurrencyDensity, 0);
  assert.equal(source.metrics.get("D1").sequentialLinks, 1);
  assert.equal(source.metrics.get("D1").sharedTransitionRatio, 0.5);
  assert.equal(Number(source.couplingByLabel.get("D1").normalized.toFixed(3)), 0.333);
  assert.equal(source.metrics.get("D2").lambda, 2);
});
