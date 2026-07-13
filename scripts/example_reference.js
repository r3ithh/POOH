"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { parsePnhText } = require("../src/core/pnh");
const { computePinvariantsMartinezSilva } = require("../src/core/pinvariants");
const { buildSelectionHypergraphFromPinvariants } = require("../src/core/selection-hypergraph");
const { enumerateTransversals } = require("../src/core/hypergraph");

const EXAMPLE_REFERENCE_SCHEMA = "pooh-example-reference-1";
const DEFAULT_EXAMPLES_ROOT = path.join(__dirname, "..", "examples");

function listExampleCases(rootDir = DEFAULT_EXAMPLES_ROOT) {
  return fs.readdirSync(rootDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((caseName) => fs.existsSync(path.join(rootDir, caseName, "input.pnh")))
    .sort();
}

function matrixColumnCount(matrix) {
  return matrix[0] ? matrix[0].length : 0;
}

function labeledTransversals(transversals, labels) {
  return transversals.map((row) => row.map((index) => labels[index]));
}

async function buildExampleReference(caseName, rootDir = DEFAULT_EXAMPLES_ROOT) {
  const inputPath = path.join(rootDir, caseName, "input.pnh");
  const parsed = parsePnhText(fs.readFileSync(inputPath, "utf8"));
  const places = parsed.nodes.filter((node) => node.type === "place");
  const transitions = parsed.nodes.filter((node) => node.type === "transition");
  const pinvariants = await computePinvariantsMartinezSilva(parsed.nodes, parsed.arcs, "full", "cpu");
  const selection = buildSelectionHypergraphFromPinvariants(pinvariants);
  const transversals = enumerateTransversals(selection.reducedDualMatrix, selection.reducedColLabels);

  return {
    schemaVersion: EXAMPLE_REFERENCE_SCHEMA,
    caseName,
    input: {
      format: parsed.format,
      places: places.length,
      transitions: transitions.length,
      arcs: parsed.arcs.length,
      markedPlaces: places.filter((node) => Number(node.tokens || 0) > 0).map((node) => node.id),
    },
    pinvariants: {
      mode: pinvariants.mode,
      placeIds: pinvariants.placeIds,
      transitionIds: pinvariants.transitionIds,
      coveredAllPlaces: pinvariants.coveredAllPlaces,
      uncoveredPlaces: pinvariants.uncoveredPlaces,
      correctSubnetsCount: pinvariants.correctSubnetsCount,
      invariants: pinvariants.invariants.map((item) => ({
        vector: item.vector,
        supportPlaces: item.supportPlaces,
        markedSupportCount: item.markedSupportCount,
        correctSubnet: item.correctSubnet,
      })),
    },
    selectionHypergraph: {
      originalRows: selection.originalDualMatrix.length,
      originalCols: matrixColumnCount(selection.originalDualMatrix),
      originalRowLabels: selection.originalRowLabels,
      originalColLabels: selection.originalColLabels,
      originalDualMatrix: selection.originalDualMatrix,
      reducedRows: selection.reducedDualMatrix.length,
      reducedCols: matrixColumnCount(selection.reducedDualMatrix),
      reducedRowLabels: selection.reducedRowLabels,
      reducedColLabels: selection.reducedColLabels,
      reducedDualMatrix: selection.reducedDualMatrix,
      removedRowLabels: selection.fra ? selection.fra.removedRowLabels : [],
      removedColLabels: selection.fra ? selection.fra.removedColLabels : [],
      essentialLabels: selection.essentialLabels,
    },
    transversals: {
      minimalCount: transversals.minimal.length,
      exactCount: transversals.exact.length,
      minimal: labeledTransversals(transversals.minimal, transversals.labels),
      exact: labeledTransversals(transversals.exact, transversals.labels),
    },
  };
}

function readExpectedReference(caseName, rootDir = DEFAULT_EXAMPLES_ROOT) {
  const expectedPath = path.join(rootDir, caseName, "expected.json");
  return JSON.parse(fs.readFileSync(expectedPath, "utf8"));
}

async function verifyExampleReference(caseName, rootDir = DEFAULT_EXAMPLES_ROOT) {
  const actual = await buildExampleReference(caseName, rootDir);
  const expected = readExpectedReference(caseName, rootDir);
  assert.deepStrictEqual(actual, expected, `${caseName} expected.json is out of date`);
  return actual;
}

async function verifyAllExampleReferences(rootDir = DEFAULT_EXAMPLES_ROOT) {
  const cases = listExampleCases(rootDir);
  const verified = [];
  for (const caseName of cases) {
    verified.push(await verifyExampleReference(caseName, rootDir));
  }
  return verified;
}

function summarizeReference(reference) {
  const input = reference.input;
  const pinvariants = reference.pinvariants;
  const hypergraph = reference.selectionHypergraph;
  const transversals = reference.transversals;
  return [
    `${reference.caseName}:`,
    `places=${input.places}`,
    `transitions=${input.transitions}`,
    `arcs=${input.arcs}`,
    `p-invariants=${pinvariants.invariants.length}`,
    `correct-subnets=${pinvariants.correctSubnetsCount}`,
    `selection=${hypergraph.reducedRows}x${hypergraph.reducedCols}`,
    `exact-transversals=${transversals.exactCount}`,
  ].join(" ");
}

module.exports = {
  DEFAULT_EXAMPLES_ROOT,
  EXAMPLE_REFERENCE_SCHEMA,
  buildExampleReference,
  listExampleCases,
  readExpectedReference,
  summarizeReference,
  verifyAllExampleReferences,
  verifyExampleReference,
};
