"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  buildBenchmarkProfileCsv,
  buildBenchmarkProfileRows,
  buildBenchmarkCsv,
  buildBenchmarkLatexTable,
  buildBenchmarkRows,
  selectRepresentativeBenchmarkProfileRows,
  summarizeBenchmarkRecord
} = require("../src/core/benchmark");

function sampleRecord() {
  return {
    libraryName: "SoftwareX examples",
    fileName: "small_petri_net.pnh",
    environment: {
      platform: "test-platform",
      hardwareConcurrency: 8,
      deviceMemoryGb: 24,
      webGpuSupported: true,
      webGlSupported: true,
      userAgent: "node-test"
    },
    runs: [
      {
        places: 2,
        transitions: 2,
        invariantsCount: 1,
        correctSubnetsCount: 1,
        hypergraphEdges: 1,
        hypergraphVertices: 1,
        hypergraphMinEdgeSize: 1,
        hypergraphMaxEdgeSize: 1,
        pinvariantMs: 0.4,
        transposeMs: NaN,
        fraMs: 0.1,
        selectionMs: 0.2,
        xtrecMs: 0.1,
        pinvariantAccelerationRequested: "CPU",
        pinvariantAccelerationUsed: "CPU",
        xtrecAccelerationRequested: "CPU",
        xtrecAccelerationUsed: "CPU",
        pinvariantDotOps: 2,
        pinvariantCombinationOps: 1,
        transposeOps: 6,
        fraOps: 5,
        selectionOps: 11,
        xtrecProjectionOps: 0,
        xtrecChecks: 1,
        xtrecMinPairComparisons: 0,
        xtrecTotalOps: 4,
        xtClass: true,
        structuralXtCertified: true,
        structuralXtSufficientRules: "R1|R3|R4|R5",
        structuralXtR1: "pass",
        structuralXtR2: "pass",
        structuralXtR3: "pass",
        structuralXtR4: "pass",
        structuralXtR5: "pass",
        structuralXtR6: "pass"
      }
    ]
  };
}

function sampleGpuRecord() {
  const record = sampleRecord();
  record.runs[0] = {
    ...record.runs[0],
    pinvariantMs: 0.2,
    xtrecMs: 0.05,
    pinvariantAccelerationRequested: "WEBGPU",
    pinvariantAccelerationUsed: "WEBGPU",
    xtrecAccelerationRequested: "WEBGPU",
    xtrecAccelerationUsed: "WEBGPU"
  };
  record.pinvariantAccelerationRequested = "WEBGPU";
  record.xtrecAccelerationRequested = "WEBGPU";
  return record;
}

test("benchmark core summarizes successful runs deterministically", () => {
  const summary = summarizeBenchmarkRecord(sampleRecord());
  assert.equal(summary.fileName, "small_petri_net.pnh");
  assert.equal(summary.libraryName, "SoftwareX examples");
  assert.equal(summary.repeats, 1);
  assert.equal(summary.okRuns, 1);
  assert.equal(summary.xtClass, "YES");
  assert.equal(summary.pinvariantAccelerationRequested, "CPU");
  assert.equal(summary.pinvariantAccelerationUsed, "CPU");
  assert.equal(summary.xtrecAccelerationRequested, "CPU");
  assert.equal(summary.xtrecAccelerationUsed, "CPU");
  assert.equal(summary.structuralXtCertified, "YES");
  assert.equal(summary.structuralXtR4, "OK");
  assert.equal(summary.environmentPlatform, "test-platform");
  assert.equal(summary.environmentHardwareConcurrency, "8");
  assert.equal(summary.environmentDeviceMemoryGb, "24");
  assert.equal(summary.environmentWebGpuSupported, "true");
});

test("benchmark core reports mixed and failed runs", () => {
  const summary = summarizeBenchmarkRecord({
    libraryName: "L",
    fileName: "mixed.pnh",
    runs: [
      { xtClass: true, structuralXtCertified: true, structuralXtR1: "pass" },
      { xtClass: false, structuralXtCertified: false, structuralXtR1: "fail" },
      { error: "boom" }
    ]
  });
  assert.equal(summary.repeats, 3);
  assert.equal(summary.okRuns, 2);
  assert.equal(summary.failedRuns, 1);
  assert.equal(summary.xtClass, "MIX");
  assert.equal(summary.structuralXtCertified, "MIX");
  assert.equal(summary.structuralXtR1, "MIX");
  assert.equal(summary.lastError, "boom");
});

test("benchmark core computes speedups against per-file CPU baselines", () => {
  const rows = buildBenchmarkRows([sampleRecord(), sampleGpuRecord()]);
  assert.equal(rows.length, 2);
  const cpuRow = rows.find((row) => row.pinvariantAccelerationUsed === "CPU");
  const gpuRow = rows.find((row) => row.pinvariantAccelerationUsed === "WEBGPU");
  assert.ok(cpuRow);
  assert.ok(gpuRow);
  assert.equal(cpuRow.pinvariantSpeedupVsCpu, 1);
  assert.equal(cpuRow.xtrecSpeedupVsCpu, 1);
  assert.equal(gpuRow.pinvariantSpeedupVsCpu, 2);
  assert.equal(gpuRow.xtrecSpeedupVsCpu, 2);
});

test("benchmark core exports library profile CSV", () => {
  const profile = [
    {
      libraryName: "Default",
      fileName: "model.pnh",
      sizeBytes: 1234,
      format: "matrix",
      places: 10,
      transitions: 8,
      arcs: 24,
      markedPlaces: 1,
      tokensTotal: 1,
      arcDensity: 0.15,
      warnings: "",
      error: ""
    }
  ];
  const rows = buildBenchmarkProfileRows(profile);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].places, 10);
  const csv = buildBenchmarkProfileCsv(profile);
  assert.match(csv, /^library,file,size_bytes,format,places,transitions,arcs/);
  assert.match(csv, /"Default","model\.pnh","1234","matrix","10","8","24","1","1","0\.150000","",""/);
});

test("benchmark core selects a deterministic representative profile sample", () => {
  const profile = [
    { libraryName: "L", fileName: "tiny.pnh", sizeBytes: 100, format: "matrix", places: 2, transitions: 2, arcs: 4, markedPlaces: 1, tokensTotal: 1, arcDensity: 0.5, warnings: "", error: "" },
    { libraryName: "L", fileName: "medium.pnh", sizeBytes: 200, format: "matrix", places: 8, transitions: 7, arcs: 20, markedPlaces: 1, tokensTotal: 1, arcDensity: 0.18, warnings: "", error: "" },
    { libraryName: "L", fileName: "warning.pnh", sizeBytes: 300, format: "matrix", places: 9, transitions: 10, arcs: 32, markedPlaces: 3, tokensTotal: 4, arcDensity: 0.45, warnings: "Declared 11 transitions, parsed 10.", error: "" },
    { libraryName: "L", fileName: "dense.pnh", sizeBytes: 400, format: "matrix", places: 12, transitions: 12, arcs: 120, markedPlaces: 2, tokensTotal: 2, arcDensity: 0.8, warnings: "", error: "" },
    { libraryName: "L", fileName: "large.pnh", sizeBytes: 500, format: "matrix", places: 40, transitions: 30, arcs: 140, markedPlaces: 5, tokensTotal: 8, arcDensity: 0.1, warnings: "", error: "" },
    { libraryName: "L", fileName: "broken.pnh", sizeBytes: 80, format: "", places: NaN, transitions: NaN, arcs: NaN, markedPlaces: NaN, tokensTotal: NaN, arcDensity: NaN, warnings: "", error: "Invalid initial marking row." }
  ];
  const sample = selectRepresentativeBenchmarkProfileRows(profile, { targetSize: 5 });
  assert.equal(sample.targetSize, 5);
  assert.equal(sample.totalRows, 6);
  assert.equal(sample.parseableRows, 5);
  assert.equal(sample.errorRows, 1);
  assert.equal(sample.skippedErrorRows.length, 1);
  assert.equal(sample.selectedRows.length, 5);
  assert.ok(sample.selectedFileNames.includes("tiny.pnh"));
  assert.ok(sample.selectedFileNames.includes("large.pnh"));
  assert.ok(sample.selectedFileNames.includes("warning.pnh"));
  assert.ok(sample.warningRows >= 1);
  assert.ok(!sample.selectedFileNames.includes("broken.pnh"));
});

test("benchmark core exports CSV and LaTeX in the browser contract format", () => {
  const records = [sampleRecord()];
  const rows = buildBenchmarkRows(records);
  assert.equal(rows.length, 1);

  const csv = buildBenchmarkCsv(records);
  assert.match(csv, /^library,benchmark,repeats,ok_runs/);
  assert.match(csv, /pinv_speedup_vs_cpu/);
  assert.match(csv, /xtrec_speedup_vs_cpu/);
  assert.match(csv, /env_platform/);
  assert.match(csv, /"SoftwareX examples","small_petri_net\.pnh","1","1"/);
  assert.match(csv, /"CPU","CPU","1\.000000","YES","CPU","CPU","1\.000000","YES","R1\|R3\|R4\|R5"/);
  assert.match(csv, /"test-platform","8","24","true","true","node-test"/);

  const latex = buildBenchmarkLatexTable(records);
  assert.match(latex, /\\begin\{table\}/);
  assert.match(latex, /small\\_petri\\_net\.pnh/);
  assert.match(latex, /MS xCPU/);
  assert.match(latex, /CPU & CPU & 1\.000 & YES & CPU & CPU & 1\.000 & YES & OK & OK & OK & OK & OK & OK/);
});
