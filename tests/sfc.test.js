"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const sfc = require("../src/core/sfc");

function samplePayload() {
  return {
    action: "build",
    modelName: "Unit_SFC",
    net: {
      nodes: [
        { id: "P1", type: "place", tokens: 1 },
        { id: "P2", type: "place", tokens: 0 },
        { id: "T1", type: "transition" },
        { id: "T2", type: "transition" }
      ],
      arcs: [
        { from: "P1", to: "T1", weight: 1 },
        { from: "T1", to: "P2", weight: 1 },
        { from: "P2", to: "T2", weight: 1 },
        { from: "T2", to: "P1", weight: 1 }
      ]
    },
    subnets: [
      { label: "D1", supportPlaces: ["P1", "P2"], markedSupportCount: 1 }
    ],
    options: {
      profile: "hybrid",
      syncMode: "handshake",
      traceLength: 12,
      maxPlus: {
        defaultDelay: 1,
        syncOverhead: 0,
        includeMatrix: true,
        delayMap: { P1: 2, P2: 3 }
      }
    }
  };
}

test("SFC core synthesizes, validates and recomputes max-plus artifacts", () => {
  const progress = [];
  sfc.setProgressSink((message) => progress.push(message));

  try {
    const build = sfc.runSfcComputation(7, samplePayload());
    assert.equal(build.action, "build");
    assert.equal(build.model.name, "Unit_SFC");
    assert.equal(build.model.subnets.length, 1);
    assert.equal(build.model.subnets[0].steps.length, 2);
    assert.equal(build.model.subnets[0].transitions.length, 2);
    assert.equal(build.model.maxPlus.global.lambda, 2.5);
    assert.match(build.model.plcopenXml, /Unit_SFC/);
    assert.equal(Boolean(build.model.codesysPackage.xml), true);
    assert.equal(Array.isArray(build.model.tiaPackage.sclFiles), true);

    const validate = sfc.runSfcComputation(7, {
      action: "validate",
      net: samplePayload().net,
      model: build.model,
      options: { traceLength: 12 }
    });
    assert.equal(validate.action, "validate");
    assert.equal(validate.validation.mismatchCount, 0);

    const maxplus = sfc.runSfcComputation(7, {
      action: "maxplus",
      net: samplePayload().net,
      model: build.model,
      options: samplePayload().options
    });
    assert.equal(maxplus.action, "maxplus");
    assert.equal(maxplus.model.maxPlus.global.lambda, 2.5);
    assert.equal(progress.some((message) => message.jobId === 7 && message.type === "progress"), true);
  } finally {
    sfc.clearProgressSink();
  }
});
