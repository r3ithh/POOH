"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  buildFuzzyResearchArtifact,
  readNowMs,
  resolveExperimentMetadata
} = require("../src/core/fuzzy-artifact");

function sampleArtifactConfig() {
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
  return { entries, placeIds, maxPlusSubnets, metrics };
}

test("fuzzy artifact core resolves time and experiment metadata deterministically", () => {
  assert.equal(readNowMs({ nowMs: () => 12.5 }), 12.5);
  assert.equal(readNowMs({ nowMs: 7 }), 7);

  const metadata = resolveExperimentMetadata({
    sourceMode: "unit",
    sourceSignature: { id: "sig" },
    experimentFactory: ({ sourceMode, entries, placeIds, sourceSignature }) => ({
      id: `${sourceMode}-${entries.length}-${placeIds.length}`,
      sourceSignature
    })
  }, {}, [{ label: "D1" }], ["P1", "P2"]);

  assert.deepEqual(metadata, {
    id: "unit-1-2",
    sourceSignature: { id: "sig" }
  });
});

test("fuzzy artifact core assembles reproducible fuzzy max-plus research artifacts", () => {
  const { entries, placeIds, maxPlusSubnets, metrics } = sampleArtifactConfig();
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
    experiment: { id: "exp-artifact", schemaVersion: "pooh-research-experiment-1" },
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

  assert.equal(artifact.version, "pooh-fuzzy-maxplus-optimizer-1");
  assert.equal(artifact.generatedAt, "2026-01-01T00:00:00.000Z");
  assert.equal(artifact.experiment.id, "exp-artifact");
  assert.equal(artifact.summary.runtimeMs, 5);
  assert.equal(artifact.summary.ruleCount, 2);
  assert.equal(artifact.fuzzy.alphaSweep.selectedAlphaExact, true);
  assert.deepEqual(artifact.fuzzy.optimization.best.selectedLabels, ["D1", "D2"]);
  assert.equal(artifact.maxPlus.global.lambda, 2);
  assert.equal(artifact.maxPlus.transversal.lambda, 2);
  assert.equal(artifact.supervisor.mpc.horizon, 3);
  assert.equal(artifact.supervisor.verification.implementationReadiness, "candidate");
  assert.equal(artifact.rules[0].source, "unit source");
});
