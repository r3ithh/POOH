"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { parsePnhText } = require("../src/core/pnh");
const { listExampleCases, verifyAllExampleReferences } = require("../scripts/example_reference");

const exampleRoot = path.join(__dirname, "..", "examples");

test("all example PNH inputs are parseable", () => {
  const cases = listExampleCases(exampleRoot);
  cases.forEach((caseName) => {
    const inputPath = path.join(exampleRoot, caseName, "input.pnh");
    const parsed = parsePnhText(fs.readFileSync(inputPath, "utf8"));
    assert.ok(parsed.nodes.length > 0, `${caseName} has nodes`);
    assert.ok(parsed.arcs.length > 0, `${caseName} has arcs`);
  });
});

test("example reference outputs are reproducible", async () => {
  const references = await verifyAllExampleReferences(exampleRoot);
  assert.equal(references.length, 3);
  references.forEach((reference) => {
    assert.equal(reference.schemaVersion, "pooh-example-reference-1");
    assert.ok(reference.pinvariants.invariants.length > 0, `${reference.caseName} has P-invariants`);
    assert.ok(reference.transversals.minimalCount > 0, `${reference.caseName} has transversals`);
  });
});
