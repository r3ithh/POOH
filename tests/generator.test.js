"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const generator = require("../src/core/generator");

test("generator core builds a forced XT Petri net through shared XTREC", async () => {
  const progress = [];
  generator.setProgressSink((message) => progress.push(message));

  try {
    const params = generator.sanitizeParams({
      placeCount: 4,
      transitionCount: 4,
      netType: "any",
      method: "adaptive",
      liveOption: "any",
      safeOption: "any",
      redundantCount: 0,
      xtHypergraph: true
    });
    params.layoutMode = "smart";

    const result = await generator.generateRandomNetWithConstraints(params, 42);

    assert.equal(result.usedParams.method, "xt-hypergraph-constructive");
    assert.equal(result.xtHypergraphInfo.isXt, true);
    assert.equal(result.analysis.truncated, false);
    assert.equal(result.nodes.some((node) => node.type === "place"), true);
    assert.equal(result.nodes.some((node) => node.type === "transition"), true);
    assert.equal(result.arcs.length > 0, true);
    assert.equal(progress.some((message) => message.jobId === 42 && message.type === "progress"), true);
  } finally {
    generator.clearProgressSink();
  }
});
