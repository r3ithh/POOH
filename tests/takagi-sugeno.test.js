"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  buildFuzzySupervisorReport,
  buildTakagiSugenoRules,
  classifyFuzzyLevel
} = require("../src/core/takagi-sugeno");

function sampleTsCase() {
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
  return { entries, maxPlusSubnets, metrics, membership };
}

test("Takagi-Sugeno core classifies fuzzy levels and builds structural rules", () => {
  assert.equal(classifyFuzzyLevel(0.8, false), "high");
  assert.equal(classifyFuzzyLevel(0.5, false), "medium");
  assert.equal(classifyFuzzyLevel(0.1, false), "low");
  assert.equal(classifyFuzzyLevel(0.1, true), "high");

  const { entries, maxPlusSubnets, metrics, membership } = sampleTsCase();
  const rules = buildTakagiSugenoRules(entries, maxPlusSubnets, metrics, membership, {
    maxPlusAvailable: true,
    sourceText: "unit source"
  });

  assert.equal(rules.length, 2);
  assert.equal(rules[0].id, "R1");
  assert.equal(rules[0].activation, 0.9);
  assert.equal(rules[0].antecedent.concurrency, "high");
  assert.equal(rules[0].antecedent.conflict, "low");
  assert.equal(rules[0].consequent.equation, "x_D1(k+1)=A_D1⊗x_D1(k)");
  assert.equal(rules[0].consequent.lambda, 2);
  assert.deepEqual(rules[0].consequent.transitions, ["T1"]);
  assert.equal(rules[0].source, "unit source");
  assert.equal(rules[1].consequent.maxPlusAvailable, false);
  assert.equal(rules[1].consequent.equation, "A_D2: waiting for Petri/SMC mapping");
});

test("Takagi-Sugeno core builds supervisor verification report", () => {
  const { entries, maxPlusSubnets, metrics, membership } = sampleTsCase();
  const rules = buildTakagiSugenoRules(entries, maxPlusSubnets, metrics, membership, {
    maxPlusAvailable: true,
    sourceText: "unit source"
  });
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
  assert.deepEqual(supervisor.selectedConfiguration, ["D1"]);
  assert.deepEqual(supervisor.activeRules, ["R1"]);
  assert.equal(supervisor.mpc.horizon, 4);
  assert.equal(supervisor.mpc.candidateFeasible, true);
  assert.equal(supervisor.mpc.predictedLambda, 2);
  assert.equal(supervisor.verification.implementationReadiness, "candidate");
});
