"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  buildAlphaCutReport,
  buildFuzzyMembership,
  buildFuzzyMembershipRows,
  buildFuzzyManualHypergraphResearchSource,
  buildFuzzyPetriResearchSource,
  buildFuzzyResearchArtifact,
  buildFuzzySupervisorReport,
  buildMaxPlusTransversalModel,
  buildStandaloneMaxPlusForAutomata,
  buildTakagiSugenoRules,
  clamp01,
  computeFuzzyCriticalCycle,
  computeFuzzyMaxCycleMean,
  computeFuzzySccCount,
  computePetriXtRelations,
  createFuzzyNullMatrix,
  classifyFuzzyLevel,
  fuzzyMaxPlusMultiply,
  optimizeFuzzyTransversal,
  solveAlphaExactCover,
  summarizeAlphaSweep,
  normalizeFuzzyMembershipWeights
} = require("../src/core/fuzzy");

test("fuzzy core clamps values and normalizes membership weights", () => {
  assert.equal(clamp01(-1), 0);
  assert.equal(clamp01(2), 1);
  assert.equal(clamp01("0.25"), 0.25);

  const weights = normalizeFuzzyMembershipWeights({
    base: 2,
    concurrency: -1,
    timing: 0.25
  });

  assert.equal(weights.base, 1);
  assert.equal(weights.concurrency, 0);
  assert.equal(weights.timing, 0.25);
  assert.equal(weights.noConflict, 0.16);
});

test("fuzzy core evaluates local max-plus graph helpers", () => {
  assert.deepEqual(createFuzzyNullMatrix(2), [
    [null, null],
    [null, null]
  ]);

  const matrix = [
    [null, 2],
    [3, null]
  ];
  assert.deepEqual(fuzzyMaxPlusMultiply(matrix, [0, 1]), [3, 3]);
  assert.equal(computeFuzzySccCount(matrix), 1);
  assert.equal(computeFuzzyMaxCycleMean(matrix), 2.5);

  const criticalCycle = computeFuzzyCriticalCycle(matrix, ["T1", "T2"], null);
  assert.equal(criticalCycle.lambda, 2.5);
  assert.equal(criticalCycle.weight, 5);
  assert.deepEqual(criticalCycle.transitions, ["T1", "T2", "T1"]);
  assert.deepEqual(criticalCycle.edgeKeys, ["T1->T2", "T2->T1"]);
});

test("fuzzy core builds standalone local max-plus models from Petri arcs", () => {
  const model = buildStandaloneMaxPlusForAutomata(
    { label: "D1", supportPlaces: ["P1", "P2"], transitionIds: ["T1", "T2"] },
    new Set(),
    { defaultDelay: 1, delayMap: { P1: 2, P2: 3 }, syncOverhead: 0 },
    [
      { from: "T1", to: "P1" },
      { from: "P1", to: "T2" },
      { from: "T2", to: "P2" },
      { from: "P2", to: "T1" }
    ]
  );

  assert.equal(model.label, "D1");
  assert.deepEqual(model.transitions, ["T1", "T2"]);
  assert.deepEqual(model.matrix, [
    [null, 3],
    [2, null]
  ]);
  assert.equal(model.edgeCount, 2);
  assert.equal(model.operations, 2);
  assert.equal(model.stronglyConnected, true);
  assert.equal(model.lambda, 2.5);
  assert.equal(model.throughput, 0.4);
  assert.deepEqual(model.sampleTrajectory[1].values, [3, 2]);
  assert.deepEqual(model.criticalCycle.transitions, ["T1", "T2", "T1"]);
});

test("fuzzy core builds global max-plus transversal models", () => {
  const entries = [
    { label: "D1", supportPlaces: ["P1"], transitionIds: ["T1", "T2"] },
    { label: "D2", supportPlaces: ["P2"], transitionIds: ["T2", "T3"] },
    { label: "D3", supportPlaces: [], transitionIds: [], mapping: { mapped: false } }
  ];
  const arcs = [
    { from: "T1", to: "P1" },
    { from: "P1", to: "T2" },
    { from: "T2", to: "P2" },
    { from: "P2", to: "T3" },
    { from: "T3", to: "P1" }
  ];

  const model = buildMaxPlusTransversalModel(["D2", "D1"], entries, {
    defaultDelay: 1,
    delayMap: { P1: 2, P2: 3 },
    syncOverhead: 0
  }, "A_T*", true, arcs);

  assert.equal(model.label, "A_T*");
  assert.deepEqual(model.selectedLabels, ["D1", "D2"]);
  assert.equal(model.available, true);
  assert.equal(model.complete, true);
  assert.deepEqual(model.supportPlaces, ["P1", "P2"]);
  assert.deepEqual(model.transitions, ["T1", "T2", "T3"]);
  assert.equal(model.edgeCount, 3);
  assert.equal(model.matrix[1][0], 2);
  assert.equal(model.matrix[2][1], 3);
  assert.equal(model.matrix[1][2], 2);
  assert.equal(model.lambda, 2.5);
  assert.equal(model.mapping.coverage, 1);

  const partial = buildMaxPlusTransversalModel(["D1", "D3"], entries, { defaultDelay: 1 }, "A_T", false, arcs);
  assert.equal(partial.complete, false);
  assert.equal(partial.partial, true);
  assert.deepEqual(partial.mapping.unmappedLabels, ["D3"]);
  assert.equal(partial.mapping.coverage, 0.5);
  assert.equal(Object.prototype.hasOwnProperty.call(partial, "matrix"), false);
});

test("fuzzy core computes Petri/XT relations from nodes and arcs", () => {
  const nodes = [
    { id: "P0", type: "place", tokens: 1 },
    { id: "P1", type: "place", tokens: 1 },
    { id: "P2", type: "place", tokens: 0 },
    { id: "T1", type: "transition" },
    { id: "T2", type: "transition" },
    { id: "T3", type: "transition" }
  ];
  const arcs = [
    { from: "P0", to: "T1" },
    { from: "P1", to: "T1" },
    { from: "P0", to: "T2" },
    { from: "P1", to: "T3" },
    { from: "T1", to: "P2" },
    { from: "T1", to: "P1" },
    { from: "T3", to: "P1" }
  ];

  const relations = computePetriXtRelations(nodes, arcs, 20);
  assert.deepEqual(relations.transitionIds, ["T1", "T2", "T3"]);
  assert.equal(relations.conflictPairs.has("T1|T2"), true);
  assert.equal(relations.sequentialPairs.has("T1->T3"), true);
  assert.equal(relations.coenabledPairs.has("T1|T3"), true);
  assert.equal(relations.coenabledPairs.has("T2|T3"), true);
  assert.equal(relations.truncated, false);
  assert.equal(relations.safe, true);
  assert.equal(relations.stateCount > 0, true);
});

test("fuzzy core builds deterministic mu membership rows", () => {
  const entries = [
    { label: "D1", supportPlaces: ["P1", "P2"] },
    { label: "D2", supportPlaces: ["P2"] }
  ];
  const placeIds = ["P1", "P2"];
  const maxPlusSubnets = [
    { label: "D1", lambda: 2 },
    { label: "D2", lambda: 4 }
  ];
  const metrics = new Map([
    ["D1", {
      conflictDensity: 0.25,
      concurrencyDensity: 0.5,
      coupling: { normalized: 0.2 },
      sharedTransitionRatio: 0.1,
      lambda: 2
    }],
    ["D2", {
      conflictDensity: 1,
      concurrencyDensity: 0.2,
      coupling: { normalized: 0.4 },
      sharedTransitionRatio: 0,
      lambda: 4
    }]
  ]);
  const result = buildFuzzyMembership(entries, placeIds, maxPlusSubnets, metrics, {
    membershipWeights: {
      base: 0.2,
      concurrency: 0.2,
      noConflict: 0.2,
      timing: 0.2,
      lowCoupling: 0.1,
      lowReconfiguration: 0.1
    }
  });

  assert.equal(result.model.maxLambda, 4);
  assert.equal(Number(result.membership.get("P1").get("D1").toFixed(3)), 0.745);
  assert.equal(result.membership.get("P1").get("D2"), 0);
  assert.equal(Number(result.membership.get("P2").get("D2").toFixed(3)), 0.45);

  const rows = buildFuzzyMembershipRows(placeIds, entries, result.membership, result.details);
  assert.equal(rows.length, 2);
  assert.deepEqual(rows[0].values.map((item) => item.label), ["D1", "D2"]);
  assert.equal(rows[0].values[0].detail.covered, true);
  assert.equal(rows[0].values[1].detail.covered, false);
  assert.equal(Number(rows[1].values[1].detail.components.timing.toFixed(3)), 0.25);
});

test("fuzzy core solves alpha-cut exact covers and summarizes sweep levels", () => {
  const entries = [
    { label: "D1", supportPlaces: ["P1"] },
    { label: "D2", supportPlaces: ["P2"] },
    { label: "D3", supportPlaces: ["P1", "P2"] }
  ];
  const placeIds = ["P1", "P2"];
  const membership = new Map([
    ["P1", new Map([["D1", 0.9], ["D2", 0], ["D3", 0.8]])],
    ["P2", new Map([["D1", 0], ["D2", 0.85], ["D3", 0.8]])]
  ]);
  const couplingByLabel = new Map([
    ["D1", { sharedWith: [{ label: "D2", normalized: 0.1 }] }],
    ["D2", { sharedWith: [{ label: "D1", normalized: 0.1 }] }],
    ["D3", { sharedWith: [] }]
  ]);
  const maxPlusSubnets = [
    { label: "D1", lambda: 2 },
    { label: "D2", lambda: 1 },
    { label: "D3", noMaxPlus: true }
  ];
  const constraints = { maxComponents: 2, maxCoupling: 0.2, lambdaLimit: 3 };

  const solved = solveAlphaExactCover(placeIds, entries, membership, 0.8);
  assert.equal(solved.found, true);
  assert.deepEqual(solved.solutionLabels, ["D1", "D2"]);

  const alphaCuts = buildAlphaCutReport(entries, placeIds, membership, couplingByLabel, maxPlusSubnets, 0.8, 0.5, constraints);
  assert.deepEqual(alphaCuts.map((row) => row.alpha), [0, 0.5, 0.8, 1]);
  const selected = alphaCuts.find((row) => row.selected);
  assert.equal(selected.found, true);
  assert.equal(selected.feasible, true);
  assert.deepEqual(selected.solutionLabels, ["D1", "D2"]);
  assert.equal(Number(selected.quality.quality.toFixed(3)), 0.85);
  assert.equal(selected.maxPlus.complete, true);

  const summary = summarizeAlphaSweep(alphaCuts, 0.8);
  assert.equal(summary.levels, 4);
  assert.equal(summary.exactLevels, 3);
  assert.equal(summary.selectedAlphaExact, true);
  assert.equal(summary.bestAlpha, 0.8);

  const optimization = optimizeFuzzyTransversal(entries, placeIds, membership, couplingByLabel, maxPlusSubnets, constraints);
  assert.equal(optimization.found, true);
  assert.equal(optimization.exact, true);
  assert.deepEqual(optimization.best.selectedLabels, ["D1", "D2"]);
  assert.equal(optimization.best.feasible, true);
});

test("fuzzy core builds structural Takagi-Sugeno rules and supervisor report", () => {
  assert.equal(classifyFuzzyLevel(0.8, false), "high");
  assert.equal(classifyFuzzyLevel(0.5, false), "medium");
  assert.equal(classifyFuzzyLevel(0.1, false), "low");

  const entries = [
    { label: "D1", supportPlaces: ["P1"] },
    { label: "D2", supportPlaces: ["P2"] }
  ];
  const maxPlusSubnets = [
    { label: "D1", lambda: 2, throughput: 0.5, transitions: ["T1"] },
    { label: "D2", noMaxPlus: true, transitions: [] }
  ];
  const metrics = new Map([
    ["D1", {
      conflictDensity: 0.1,
      concurrencyDensity: 0.8,
      coupling: { normalized: 0.1 },
      sharedTransitionRatio: 0.2,
      lambda: 2
    }],
    ["D2", {
      conflictDensity: 0.8,
      concurrencyDensity: 0.2,
      coupling: { normalized: 0.6 },
      sharedTransitionRatio: 0.5,
      lambda: null
    }]
  ]);
  const membership = new Map([
    ["P1", new Map([["D1", 0.9], ["D2", 0]])],
    ["P2", new Map([["D1", 0], ["D2", 0.7]])]
  ]);

  const rules = buildTakagiSugenoRules(entries, maxPlusSubnets, metrics, membership, {
    maxPlusAvailable: true,
    sourceText: "test source"
  });
  assert.equal(rules.length, 2);
  assert.equal(rules[0].id, "R1");
  assert.equal(rules[0].antecedent.concurrency, "high");
  assert.equal(rules[0].consequent.equation, "x_D1(k+1)=A_D1⊗x_D1(k)");
  assert.equal(rules[1].consequent.maxPlusAvailable, false);
  assert.equal(rules[1].consequent.equation, "A_D2: waiting for Petri/SMC mapping");

  const optimization = {
    best: {
      selectedLabels: ["D1"],
      feasible: true,
      lambda: 2,
      throughput: 0.5,
      quality: { coupling: 0.1 },
      maxPlus: { complete: true, coverage: 1, unmappedLabels: [], transversalLambda: 2 }
    }
  };
  const supervisor = buildFuzzySupervisorReport(
    optimization,
    { found: true, solutionLabels: ["D1"] },
    rules,
    { truncated: false, states: 3, safe: true },
    { constraints: { maxComponents: 2, maxCoupling: 0.2, lambdaLimit: 3 }, mpc: { horizon: 4 } },
    { maxPlusAvailable: true }
  );

  assert.equal(supervisor.type, "Takagi-Sugeno max-plus fuzzy supervisor");
  assert.deepEqual(supervisor.activeRules, ["R1"]);
  assert.equal(supervisor.mpc.horizon, 4);
  assert.equal(supervisor.mpc.candidateFeasible, true);
  assert.equal(supervisor.verification.implementationReadiness, "candidate");
});

test("fuzzy core assembles reproducible research artifacts", () => {
  const entries = [
    { label: "D1", supportPlaces: ["P1"], transitionIds: ["T1"] },
    { label: "D2", supportPlaces: ["P2"], transitionIds: ["T2"] }
  ];
  const placeIds = ["P1", "P2"];
  const maxPlusSubnets = [
    { label: "D1", lambda: 2, throughput: 0.5, transitions: ["T1"] },
    { label: "D2", lambda: 1, throughput: 1, transitions: ["T2"] }
  ];
  const metrics = new Map([
    ["D1", {
      conflictDensity: 0,
      concurrencyDensity: 1,
      coupling: { normalized: 0 },
      sharedTransitionRatio: 0,
      lambda: 2
    }],
    ["D2", {
      conflictDensity: 0,
      concurrencyDensity: 1,
      coupling: { normalized: 0 },
      sharedTransitionRatio: 0,
      lambda: 1
    }]
  ]);
  const artifact = buildFuzzyResearchArtifact({
    options: {
      alpha: 0.8,
      alphaStep: 0.5,
      constraints: { maxComponents: 2, maxCoupling: 0.2, lambdaLimit: 3 },
      mpc: { horizon: 3 }
    },
    started: 10,
    nowMs: () => 15,
    generatedAt: "2026-01-01T00:00:00.000Z",
    experiment: { id: "exp-core", schemaVersion: "pooh-research-experiment-1" },
    entries,
    placeIds,
    maxPlusSubnets,
    metrics,
    couplingByLabel: new Map(),
    sourceMode: "unit",
    sourceLabel: "Unit source",
    pipeline: ["Petri", "XT", "max-plus", "T-S"],
    relationSummary: { truncated: false, states: 2, safe: true },
    petriXt: { mode: "unit" },
    ruleSource: "unit source",
    transversalResolver: (labels, includeMatrix) => ({
      lambda: labels.includes("D1") ? 2 : 1,
      throughput: labels.includes("D1") ? 0.5 : 1,
      edgeCount: labels.length,
      transitionCount: labels.length,
      complete: true,
      matrix: includeMatrix ? [[0]] : []
    })
  });

  assert.equal(artifact.generatedAt, "2026-01-01T00:00:00.000Z");
  assert.equal(artifact.experiment.id, "exp-core");
  assert.equal(artifact.summary.runtimeMs, 5);
  assert.equal(artifact.summary.ruleCount, 2);
  assert.equal(artifact.fuzzy.alphaSweep.selectedAlphaExact, true);
  assert.deepEqual(artifact.fuzzy.optimization.best.selectedLabels, ["D1", "D2"]);
  assert.equal(artifact.maxPlus.transversal.lambda, 2);
  assert.equal(artifact.supervisor.mpc.horizon, 3);
  assert.equal(artifact.supervisor.verification.implementationReadiness, "candidate");
  assert.equal(artifact.rules[0].source, "unit source");
});

test("fuzzy core builds manual hypergraph research sources", () => {
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

test("fuzzy core builds Petri/XT research sources from structural relations", () => {
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
