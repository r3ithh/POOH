"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { enumerateTransversals } = require("../src/core/hypergraph");
const {
  benchmarkRowsToLatex,
  buildFuzzyAlphaSweepCsv,
  buildFuzzyLatex,
  buildFuzzyMembershipCsv,
  buildFuzzyRulesCsv,
  buildPinvariantAnalysisRows,
  buildSelectionHypergraphAnalysisRows,
  buildFuzzyTextReport,
  formatCandidateMaxPlusCoverage,
  formatFuzzyMembershipOutput,
  formatFuzzyPipelineOutput,
  formatFuzzyRelationsOutput,
  formatMaxPlusMatrixRow,
  formatHypergraphEditorOutput,
  formatManualHypergraphOutput,
  formatPinvariantMatrixBlock,
  formatPinvariantOutput,
  formatPinvariantVector,
  formatSfcMaxPlusResultOutput,
  formatSfcModelOutput,
  formatSfcValidationOutput,
  formatStandaloneMaxPlusOutput,
  formatTakagiSugenoRulesOutput,
  formatSelectionHypergraphOutput,
  hypergraphToText,
  toCsv,
  transversalsToCsv
} = require("../src/core/exporters");

test("CSV export quotes values deterministically", () => {
  const csv = toCsv(["name", "value"], [
    { name: "alpha", value: "1" },
    { name: "comma", value: "a,b" },
    { name: "quote", value: "\"x\"" }
  ]);
  assert.equal(csv, [
    "\"name\",\"value\"",
    "\"alpha\",\"1\"",
    "\"comma\",\"a,b\"",
    "\"quote\",\"\"\"x\"\"\""
  ].join("\n"));
});

test("hypergraph text export lists edges and members", () => {
  const text = hypergraphToText({
    matrix: [[1, 0], [1, 1]],
    rowLabels: ["E1", "E2"],
    colLabels: ["D1", "D2"],
    title: "Selection hypergraph"
  });
  assert.match(text, /Selection hypergraph/);
  assert.match(text, /E2: \{D1, D2\}/);
});

test("transversal CSV export covers minimal and exact rows", () => {
  const result = enumerateTransversals([[1, 0], [0, 1]], ["D1", "D2"]);
  const csv = transversalsToCsv(result);
  assert.match(csv, /"minimal","1","2","D1 D2"/);
  assert.match(csv, /"exact","1","2","D1 D2"/);
});

test("benchmark LaTeX export escapes special characters", () => {
  const latex = benchmarkRowsToLatex([
    { benchmark: "case_1%raw", places: 2, transitions: 3, invariants: 1, xt: "YES" }
  ]);
  assert.match(latex, /case\\_1\\%raw/);
  assert.match(latex, /Benchmark & Places & Transitions/);
});

test("pinvariant report and matrix block use the browser contract format", () => {
  const result = {
    mode: "cover-stop",
    placeIds: ["P1", "P2", "P3"],
    transitionIds: ["T1", "T2"],
    invariants: [
      { vector: [1, 1, 0], supportPlaces: ["P1", "P2"], correctSubnet: true },
      { vector: [0, 0, 12], supportPlaces: ["P3"], correctSubnet: false }
    ],
    accelerationRequested: "webgpu",
    accelerationUsed: "cpu",
    accelerationWarning: "fallback",
    processedStages: 1,
    totalStages: 2,
    candidateCap: 100,
    finalCandidateCap: 200,
    earlyStopped: true,
    coveredAllPlaces: false,
    uncoveredPlaces: ["P3"],
    wasTrimmed: true,
    memoryGuardTriggered: true,
    correctSubnetsCount: 1
  };

  assert.equal(formatPinvariantVector([1, 0, 2]), "102");
  assert.equal(formatPinvariantVector([1, 12, 0]), "1 12 0");
  assert.equal(formatPinvariantMatrixBlock(result), [
    "[P1,P2,P3]",
    "3",
    "2",
    "110",
    "001"
  ].join("\n"));

  const report = formatPinvariantOutput(result);
  assert.match(report, /P-invariants found: 2/);
  assert.match(report, /GPU acceleration: unavailable/);
  assert.match(report, /Place coverage: NO \(missing: P3\)/);
  assert.match(report, /2\. 0 0 12 \| support=\[P3\] \| subnet=NO/);

  const rows = buildPinvariantAnalysisRows(result);
  assert.equal(rows.find((row) => row.key === "Acceleration").status, "WARN");
  assert.equal(rows.find((row) => row.key === "Valid subnets").message, "1/2 (criterion: exactly one initially marked place).");
  assert.equal(rows.find((row) => row.key === "Memory guard").status, "WARN");
});

test("selection hypergraph report includes matrices, XTREC and transversal summary", () => {
  const result = {
    placeIds: ["P1", "P2"],
    subnetMatrix: [[1, 0], [0, 1]],
    essentialLabels: ["D1"],
    originalColLabels: ["D1", "D2"],
    originalRowLabels: ["P1", "P2"],
    originalDualMatrix: [[1, 0], [0, 1]],
    reducedColLabels: ["D1", "D2"],
    reducedRowLabels: ["P1", "P2"],
    reducedDualMatrix: [[1, 0], [0, 1]],
    metrics: {
      transpose: { ms: 1.2345, cellAssignments: 8, supportWrites: 2 },
      fra: { ms: 0.5, cycles: 1, removedRows: 0, removedCols: 0, essentialCellChecks: 4, rowPairComparisons: 1, colPairComparisons: 1, vectorCellComparisons: 2 },
      totalMs: 2
    },
    xtrec: {
      isXt: true,
      accelerationUsed: "cpu",
      checksPerformed: 3,
      checksTotal: 3,
      operations: { projectionOps: 1, intersectionChecks: 2, minPairComparisons: 3 }
    },
    transversal: {
      strategy: "all",
      runtimeMs: 0.75,
      executed: ["xtr"],
      results: {
        xtr: {
          exact: true,
          coversAll: true,
          size: 2,
          runtimeMs: 0.25,
          counters: { checks: 5 },
          solutionLabels: ["D1", "D2"]
        }
      },
      recommended: {
        found: true,
        type: "exact",
        method: "xtr",
        size: 2,
        solutionLabels: ["D1", "D2"]
      }
    }
  };
  const text = formatSelectionHypergraphOutput(result);
  assert.match(text, /Dual matrix after FRA reduction/);
  assert.match(text, /XTREC after FRA \(Eiter\): TRUE/);
  assert.match(text, /Recommendation: exact transversal/);

  const rows = buildSelectionHypergraphAnalysisRows(result);
  assert.equal(rows.find((row) => row.key === "XT class (XTREC)").status, "OK");
  assert.equal(rows.find((row) => row.key === "XTREC operations").message, "6 operations.");
  assert.equal(rows.find((row) => row.key === "Selected cover").message, "Exact (XTR (Eiter)), |D|=2, subnets=[D1, D2].");
  assert.equal(rows.find((row) => row.key === "Research paths").message, "XTR (Eiter)");
});

test("SFC and max-plus text reports keep the browser output contract", () => {
  const result = {
    model: {
      name: "Demo_SFC",
      profile: "hybrid",
      syncMode: "handshake",
      sharedTransitions: ["Tsync"],
      coordinatorSt: true,
      codesysPackage: { xml: "<xml/>" },
      tiaPackage: { sclFiles: ["main.scl"] },
      subnets: [
        {
          label: "D1",
          steps: ["P1", "P2"],
          transitions: ["T1", "T2"],
          initialStep: "P1"
        }
      ],
      maxPlus: {
        equation: "x(k+1)=A⊗x(k)",
        variant: "xt-synchronized-event-graph",
        global: { lambda: 2, throughput: 0.5, note: "global ok" },
        options: { defaultDelay: 1, syncOverhead: 0.25 },
        subnets: [
          {
            label: "D1",
            transitionCount: 2,
            edgeCount: 2,
            lambda: 2,
            throughput: 0.5,
            stronglyConnected: true,
            transitions: ["T1", "T2"],
            matrix: [[0, null], [1, 2.5]],
            sampleTrajectory: [{ k: 0, values: [0, 1] }]
          }
        ],
        summary: { runtimeMs: 1.25, operations: 8 }
      }
    },
    summary: { runtimeMs: 3.5, operations: 12, note: "synthesis ok" },
    validation: {
      passed: false,
      stepsChecked: 4,
      mismatchCount: 1,
      coverageRatio: 0.75,
      avgStepMs: 0.01,
      mismatches: [{ step: 2, pn: ["P1"], sfc: ["P2"] }]
    }
  };

  assert.equal(formatMaxPlusMatrixRow([0, null, 2.5]), "0.000 -inf 2.500");

  const modelReport = formatSfcModelOutput(result);
  assert.match(modelReport, /SFC model/);
  assert.match(modelReport, /Name: Demo_SFC/);
  assert.match(modelReport, /CODESYS package: YES/);
  assert.match(modelReport, /\(max,\+\) global lambda: 2\.000000/);

  const validationReport = formatSfcValidationOutput(result);
  assert.match(validationReport, /PN <-> SFC trace validation/);
  assert.match(validationReport, /Status: DIFFERENCES/);
  assert.match(validationReport, /k=2: PN=\[P1\], SFC=\[P2\]/);

  const maxPlusReport = formatSfcMaxPlusResultOutput(result);
  assert.match(maxPlusReport, /\(max,\+\) timing analysis/);
  assert.match(maxPlusReport, /Semiring: a⊕b=max\(a,b\), a⊗b=a\+b/);
  assert.match(maxPlusReport, /lambda=2\.000000/);
  assert.match(maxPlusReport, /0\.000 -inf/);
});

test("fuzzy max-plus text reports keep the research output contract", () => {
  const result = {
    sourceMode: "exact-transversal",
    version: "pooh-ts-maxplus-1",
    experiment: { id: "exp-demo" },
    options: {
      alpha: 0.7,
      alphaStep: 0.1,
      defaultDelay: 1,
      syncOverhead: 0.2,
      constraints: { maxComponents: 2, maxCoupling: 0.5, lambdaLimit: 3 }
    },
    summary: { subnetCount: 2, ruleCount: 1, runtimeMs: 4.5 },
    relationSummary: { conflicts: 1, sequential: 2, concurrent: 3, states: 4, safe: true, truncated: false },
    petriXt: {
      transitions: ["T1", "T2"],
      matrices: {
        conflict: [[0, 1], [1, 0]],
        concurrency: [[0, 0], [0, 0]],
        sequential: [[0, 1], [0, 0]]
      },
      counts: { conflict: 1, concurrency: 0, sequential: 1 },
      sources: { conflict: "shared preset", concurrency: "reachability", sequential: "flow" },
      stateCount: 4,
      statesLimit: 100,
      safe: true,
      complete: false
    },
    fuzzy: {
      membershipModel: {
        weights: { base: 0.3, concurrency: 0.2, noConflict: 0.2, timing: 0.1, lowCoupling: 0.1, lowReconfiguration: 0.1 }
      },
      membershipRows: [
        {
          edge: "E1",
          values: [
            {
              label: "D1",
              mu: 0.8,
              detail: {
                covered: true,
                components: { concurrency: 0.7, noConflict: 1, timing: 0.6, lowCoupling: 0.9, lowReconfiguration: 0.8 }
              }
            },
            { label: "D2", mu: 0 }
          ]
        }
      ],
      alphaSweep: { levels: 2, exactLevels: 1, feasibleLevels: 1, maxExactAlpha: 0.7, bestAlpha: 0.7 },
      alphaCuts: [
        {
          alpha: 0.7,
          selected: true,
          found: true,
          feasible: true,
          size: 1,
          solutionLabels: ["D1"],
          quality: { quality: 0.8, minCoverage: 0.8, redundancy: 1, coupling: 0.1 },
          maxPlus: { mappedCount: 1, unmappedCount: 0, coverage: 1 },
          lambda: 2
        }
      ],
      optimization: {
        found: true,
        method: "enumeration",
        exact: true,
        evaluatedCount: 2,
        feasibleCount: 1,
        best: {
          selectedLabels: ["D1"],
          size: 1,
          feasible: true,
          lambda: 2,
          quality: { quality: 0.8, minCoverage: 0.8, redundancy: 1, coupling: 0.1 },
          maxPlus: { mappedCount: 1, unmappedCount: 0, coverage: 1, localLambda: 2 }
        }
      }
    },
    maxPlus: {
      available: true,
      equation: "x(k+1)=A⊗x(k)",
      global: { lambda: 2, throughput: 0.5 },
      transversal: {
        available: true,
        complete: true,
        mapping: { mappedCount: 1, unmappedCount: 0, coverage: 1 },
        selectedLabels: ["D1"],
        supportPlaces: ["P1"],
        transitions: ["T1"],
        transitionCount: 1,
        edgeCount: 1,
        lambda: 2,
        throughput: 0.5,
        stronglyConnected: true,
        matrix: [[0]]
      },
      subnets: [
        {
          label: "D1",
          mapping: { source: "SMC", label: "D1", places: ["P1"], transitions: ["T1"] },
          transitionCount: 1,
          edgeCount: 1,
          lambda: 2,
          throughput: 0.5,
          stronglyConnected: true,
          transitions: ["T1"],
          matrix: [[0]],
          criticalCycle: { transitions: ["T1"], mean: 2, weight: 2 }
        }
      ]
    },
    rules: [
      {
        id: "R1",
        label: "D1",
        activation: 0.8,
        antecedent: { concurrency: "high", conflict: "low", coupling: "low", reconfiguration: "low", timing: "fast" },
        consequent: { equation: "x1(k+1)=A1⊗x1(k)", lambda: 2, throughput: 0.5, maxPlusAvailable: true, transitions: ["T1"] },
        source: "SMC D1"
      }
    ],
    supervisor: {
      status: "ready",
      mpc: { horizon: 3, candidateFeasible: true },
      selectedConfiguration: ["D1"],
      activeRules: ["R1"],
      verification: {
        implementationReadiness: "alpha",
        maxPlusMappingCoverage: 1,
        maxPlusMappingComplete: true,
        maxPlusMappingOk: true,
        maxPlusUnmapped: [],
        maxPlusAvailable: true,
        reachabilityComplete: false,
        safe: true,
        timingOk: true
      }
    }
  };

  assert.equal(formatCandidateMaxPlusCoverage({ mappedCount: 1, unmappedCount: 0, coverage: 1 }, 1), "1/1 (1.000)");

  assert.match(formatFuzzyPipelineOutput(result), /Petri -> XT -> SMC -> max-plus -> T-S/);
  assert.match(formatFuzzyPipelineOutput(result), /T\*: \[D1\]/);
  assert.match(formatFuzzyMembershipOutput(result), /D1=0\.800/);
  assert.match(formatFuzzyMembershipOutput(result), /E\^α: \[D1\]/);
  assert.match(formatFuzzyRelationsOutput(result), /Petri\/XT structural relations/);
  assert.match(formatFuzzyRelationsOutput(result), /Warning: Q may be incomplete/);
  assert.match(formatStandaloneMaxPlusOutput(result), /Global transversal model A_T\*/);
  assert.match(formatStandaloneMaxPlusOutput(result), /A_T\*:/);
  assert.match(formatTakagiSugenoRulesOutput(result), /Structurally generated Takagi-Sugeno rules/);
  assert.match(formatTakagiSugenoRulesOutput(result), /Max-plus mapping: coverage=1\.000/);
  assert.match(buildFuzzyTextReport(result), /# POOH Petri -> XT -> max-plus -> T-S fuzzy/);

  const rulesCsv = buildFuzzyRulesCsv(result);
  assert.match(rulesCsv, /^experiment,rule,subnet,selected,activation/m);
  assert.match(rulesCsv, /"exp-demo","R1","D1","1","0\.800000"/);

  const alphaCsv = buildFuzzyAlphaSweepCsv(result);
  assert.match(alphaCsv, /^experiment,alpha,selected_alpha,alpha_exact/m);
  assert.match(alphaCsv, /"exp-demo","0\.70","1","1","1","1","0\.800000"/);

  const membershipCsv = buildFuzzyMembershipCsv(result);
  assert.match(membershipCsv, /^experiment,alpha,edge,subnet,covered/m);
  assert.match(membershipCsv, /"exp-demo","0\.70","E1","D1","1","1","0\.800000"/);

  const latex = buildFuzzyLatex(result);
  assert.match(latex, /Takagi--Sugeno max-plus/);
  assert.match(latex, /Comparison of fuzzy exact transversal levels/);
  assert.match(latex, /Fuzzy exact transversal optimization result/);
});

test("manual hypergraph report includes vertices, edges and XTREC result", () => {
  const text = formatManualHypergraphOutput({
    matrix: [[1, 0], [1, 1]],
    rowLabels: ["E1", "E2"],
    colLabels: ["v1", "v2"],
    xtrec: {
      isXt: false,
      accelerationUsed: "cpu",
      runtimeMs: 0.5,
      checksPerformed: 2,
      checksTotal: 3,
      witness: { message: "test witness" }
    }
  });
  assert.match(text, /Manual hypergraph/);
  assert.match(text, /E2: \{v1, v2\}/);
  assert.match(text, /XTREC: FALSE/);
  assert.match(text, /Witness: test witness/);
});

test("hypergraph editor report includes FRA, transversals, c-exact and r-exact blocks", () => {
  const text = formatHypergraphEditorOutput({
    matrix: [[1, 0], [1, 1]],
    rowLabels: ["E1", "E2"],
    colLabels: ["v1", "v2"],
    reducedResult: {
      reducedRowLabels: ["E2"],
      reducedColLabels: ["v1", "v2"],
      removedRowLabels: ["E1"],
      removedColLabels: [],
      essentialLabels: ["v2"],
      metrics: { rowPairComparisons: 1, colPairComparisons: 2, vectorCellComparisons: 3 }
    },
    analysis: {
      transversal: { found: true, indices: [0], labels: ["v1", "v2"] },
      exactTransversal: { found: true, indices: [1], labels: ["v1", "v2"] },
      allTransversals: {
        labels: ["v1", "v2"],
        minimal: [[0], [1]],
        exact: [[1]],
        checkedSubsets: 3,
        totalSubsets: 4
      },
      structure: {
        vertexCount: 2,
        edgeCount: 2,
        rank: 2,
        minEdgeSize: 1,
        isUniform: false,
        isLinear: true,
        isSimple: true,
        isClutter: true,
        isRegular: false,
        minDegree: 1,
        maxDegree: 2,
        cExactSummary: "c=1: 1"
      },
      cExact: {
        labels: ["v1", "v2"],
        levels: [{ cValue: 1, count: 1, example: [1] }],
        checkedSubsets: 3,
        totalSubsets: 4,
        solutionCount: 1,
        selected: { cValue: 1, indices: [1] }
      },
      rExact: {
        isRExact: true,
        targetR: 2,
        rStar: 1,
        isOneExact: true,
        minimalCount: 2,
        exactCount: 1,
        distribution: { 1: 2 },
        witness: { transversalIndex: 0, labels: ["v1"], rowLabel: "E1", hits: 1 }
      },
      xtrec: {
        isXt: true,
        accelerationUsed: "cpu",
        runtimeMs: 0.25
      }
    }
  });
  assert.match(text, /Graphic hypergraph/);
  assert.match(text, /FRA: 2x2 -> 1x2/);
  assert.match(text, /All minimal transversals: 2/);
  assert.match(text, /c-exact spectrum/);
  assert.match(text, /r-exact: YES for r=2/);
  assert.match(text, /XTREC: TRUE/);
});
