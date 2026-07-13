"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  FUZZY_MEMBERSHIP_DEFAULT_WEIGHTS,
  buildFuzzyMembership,
  buildFuzzyMembershipRows,
  clamp01,
  finiteOrNull,
  normalizeFuzzyMembershipWeights
} = require("../src/core/fuzzy-membership");

test("fuzzy membership core clamps numeric helpers and normalizes weights", () => {
  assert.equal(clamp01(-1), 0);
  assert.equal(clamp01(2), 1);
  assert.equal(clamp01("0.25"), 0.25);
  assert.equal(finiteOrNull(""), null);
  assert.equal(finiteOrNull("2.5"), 2.5);

  const weights = normalizeFuzzyMembershipWeights({
    base: 2,
    concurrency: -1,
    timing: 0.25
  });

  assert.equal(FUZZY_MEMBERSHIP_DEFAULT_WEIGHTS.base, 0.34);
  assert.equal(weights.base, 1);
  assert.equal(weights.concurrency, 0);
  assert.equal(weights.timing, 0.25);
  assert.equal(weights.noConflict, 0.16);
});

test("fuzzy membership core builds deterministic mu matrix and detail rows", () => {
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
