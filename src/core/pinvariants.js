(function(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("./i18n"));
  } else {
    root.PoohPinvariantsCore = factory(root.PoohI18n);
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function(i18n) {
"use strict";

function tr(key, params) {
  return i18n && typeof i18n.t === "function" ? i18n.t(key, params) : String(key || "");
}

const GPU_WORKGROUP_SIZE = 64;
const MAX_TOTAL_VECTOR_ELEMENTS = 1800000;
const STAGE_MAX_CANDIDATE_CAP = 50000;
const FINAL_MAX_CANDIDATE_CAP = 80000;
const COVERAGE_REDUCE_MAX = 200000;
const MAX_COMBINATIONS_FACTOR = 10;
const MIN_COMBINATIONS_LIMIT = 25000;

function nowMs() {
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    return performance.now();
  }
  return Date.now();
}

function naturalIdCompare(a, b) {
  const aText = String(a || "");
  const bText = String(b || "");

  const aMatch = /^([A-Za-z_]+)(\d+)$/.exec(aText);
  const bMatch = /^([A-Za-z_]+)(\d+)$/.exec(bText);
  if (aMatch && bMatch) {
    const prefixCmp = aMatch[1].localeCompare(bMatch[1], "pl", { sensitivity: "base" });
    if (prefixCmp !== 0) {
      return prefixCmp;
    }
    const aNum = parseInt(aMatch[2], 10);
    const bNum = parseInt(bMatch[2], 10);
    if (aNum !== bNum) {
      return aNum - bNum;
    }
  }

  return aText.localeCompare(bText, "pl", { numeric: true, sensitivity: "base" });
}

function gcd(a, b) {
  let x = Math.abs(parseInt(String(a || 0), 10) || 0);
  let y = Math.abs(parseInt(String(b || 0), 10) || 0);
  while (y !== 0) {
    const tmp = x % y;
    x = y;
    y = tmp;
  }
  return x;
}

function gcdVector(vector) {
  let g = 0;
  for (let i = 0; i < vector.length; i += 1) {
    const value = Math.abs(parseInt(String(vector[i] || 0), 10) || 0);
    if (value === 0) {
      continue;
    }
    g = g === 0 ? value : gcd(g, value);
    if (g === 1) {
      return 1;
    }
  }
  return g === 0 ? 1 : g;
}

function normalizeVector(vector) {
  const normalized = vector.map((value) => Math.max(0, parseInt(String(value || 0), 10) || 0));
  const factor = gcdVector(normalized);
  if (factor <= 1) {
    return normalized;
  }
  return normalized.map((value) => Math.floor(value / factor));
}

function vectorDot(a, b) {
  let sum = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i += 1) {
    sum += a[i] * b[i];
  }
  return sum;
}

function supportIndices(vector) {
  const support = [];
  for (let i = 0; i < vector.length; i += 1) {
    if (vector[i] > 0) {
      support.push(i);
    }
  }
  return support;
}

function estimateCandidateCap(placeCount, hardLimit) {
  const safePlaceCount = Math.max(1, parseInt(String(placeCount || 1), 10) || 1);
  const byElements = Math.floor(MAX_TOTAL_VECTOR_ELEMENTS / safePlaceCount);
  return Math.max(1, Math.min(hardLimit, byElements));
}

function compareCandidateVectors(a, b) {
  const supA = a.reduce((acc, value) => acc + (value > 0 ? 1 : 0), 0);
  const supB = b.reduce((acc, value) => acc + (value > 0 ? 1 : 0), 0);
  if (supA !== supB) {
    return supA - supB;
  }
  const sumA = a.reduce((acc, value) => acc + value, 0);
  const sumB = b.reduce((acc, value) => acc + value, 0);
  if (sumA !== sumB) {
    return sumA - sumB;
  }
  for (let i = 0; i < Math.min(a.length, b.length); i += 1) {
    if (a[i] !== b[i]) {
      return a[i] - b[i];
    }
  }
  return a.length - b.length;
}

function sortCandidateVectors(vectors) {
  return vectors.slice().sort(compareCandidateVectors);
}

function addCandidateVector(uniqueMap, candidate, maxCandidates) {
  const normalized = normalizeVector(candidate);
  if (normalized.every((value) => value === 0)) {
    return "zero";
  }

  const key = normalized.join(",");
  if (uniqueMap.has(key)) {
    return "exists";
  }
  if (uniqueMap.size >= maxCandidates) {
    return "full";
  }

  uniqueMap.set(key, normalized);
  return "added";
}

function pruneCandidateVectors(candidates, maxCandidates) {
  const unique = new Map();
  let trimmed = false;
  const safeCandidates = Array.isArray(candidates) ? candidates : [];

  for (let index = 0; index < safeCandidates.length; index += 1) {
    const status = addCandidateVector(unique, safeCandidates[index], maxCandidates);
    if (status === "full") {
      trimmed = true;
      break;
    }
  }

  let vectors = sortCandidateVectors(Array.from(unique.values()));
  if (vectors.length > maxCandidates) {
    vectors = vectors.slice(0, maxCandidates);
    trimmed = true;
  }

  return { vectors, trimmed };
}

function computeCoverage(vectors, placeIds) {
  const covered = new Array(placeIds.length).fill(false);
  vectors.forEach((vector) => {
    for (let i = 0; i < vector.length; i += 1) {
      if (vector[i] > 0) {
        covered[i] = true;
      }
    }
  });
  const uncoveredPlaces = [];
  for (let i = 0; i < placeIds.length; i += 1) {
    if (!covered[i]) {
      uncoveredPlaces.push(placeIds[i]);
    }
  }
  return {
    coveredAllPlaces: uncoveredPlaces.length === 0,
    uncoveredPlaces
  };
}

function filterCompleteInvariants(candidates, columns, nextStageIndex, operationCounters) {
  if (nextStageIndex >= columns.length) {
    return candidates.slice();
  }

  const complete = [];
  for (let i = 0; i < candidates.length; i += 1) {
    const vector = candidates[i];
    let ok = true;
    for (let colIndex = nextStageIndex; colIndex < columns.length; colIndex += 1) {
      if (operationCounters) {
        operationCounters.coverageDotChecks += 1;
      }
      if (vectorDot(vector, columns[colIndex]) !== 0) {
        ok = false;
        break;
      }
    }
    if (ok) {
      complete.push(vector);
    }
  }
  return complete;
}

function reduceVectorsByCoverage(vectors, placeIds) {
  const unique = pruneCandidateVectors(vectors, COVERAGE_REDUCE_MAX).vectors;
  if (unique.length <= 1) {
    return unique;
  }

  const placeCount = placeIds.length;
  const coverCount = new Array(placeCount).fill(0);
  unique.forEach((vector) => {
    for (let i = 0; i < placeCount; i += 1) {
      if ((vector[i] || 0) > 0) {
        coverCount[i] += 1;
      }
    }
  });

  const keep = new Array(unique.length).fill(true);
  const indexByKey = new Map(unique.map((vector, index) => [vector.join(","), index]));
  const order = sortCandidateVectors(unique)
    .map((vector) => indexByKey.get(vector.join(",")))
    .filter((index) => index !== undefined);

  order.forEach((idx) => {
    if (!keep[idx]) {
      return;
    }
    const vector = unique[idx];
    let removable = true;
    for (let p = 0; p < placeCount; p += 1) {
      if ((vector[p] || 0) > 0 && coverCount[p] <= 1) {
        removable = false;
        break;
      }
    }
    if (!removable) {
      return;
    }

    keep[idx] = false;
    for (let p = 0; p < placeCount; p += 1) {
      if ((vector[p] || 0) > 0) {
        coverCount[p] -= 1;
      }
    }
  });

  return unique.filter((_, index) => keep[index]);
}

function buildIncidence(nodes, arcs) {
  const safeNodes = Array.isArray(nodes) ? nodes : [];
  const safeArcs = Array.isArray(arcs) ? arcs : [];
  const places = safeNodes
    .filter((node) => node && node.type === "place" && node.id)
    .slice()
    .sort((a, b) => naturalIdCompare(a.id, b.id));
  const transitions = safeNodes
    .filter((node) => node && node.type === "transition" && node.id)
    .slice()
    .sort((a, b) => naturalIdCompare(a.id, b.id));

  const placeIds = places.map((place) => String(place.id));
  const transitionIds = transitions.map((transition) => String(transition.id));
  const placeIndex = new Map(placeIds.map((id, index) => [id, index]));
  const transitionIndex = new Map(transitionIds.map((id, index) => [id, index]));

  const incidence = Array.from({ length: placeIds.length }, () =>
    Array.from({ length: transitionIds.length }, () => 0)
  );

  safeArcs.forEach((arc) => {
    const from = String(arc && arc.from ? arc.from : "");
    const to = String(arc && arc.to ? arc.to : "");
    const weight = Math.max(1, parseInt(String(arc && arc.weight ? arc.weight : 1), 10) || 1);

    const pFrom = placeIndex.get(from);
    const pTo = placeIndex.get(to);
    const tFrom = transitionIndex.get(from);
    const tTo = transitionIndex.get(to);

    if (pFrom !== undefined && tTo !== undefined) {
      incidence[pFrom][tTo] -= weight;
      return;
    }
    if (tFrom !== undefined && pTo !== undefined) {
      incidence[pTo][tFrom] += weight;
    }
  });

  const markedPlaces = places.map((place) => Math.max(0, parseInt(String(place.tokens || 0), 10) || 0) > 0);
  return {
    incidence,
    placeIds,
    transitionIds,
    markedPlaces
  };
}

function combineByCancellation(posVector, posValue, negVector, negValue) {
  const posCoeff = Math.abs(negValue);
  const negCoeff = Math.abs(posValue);
  const result = new Array(posVector.length).fill(0);
  for (let i = 0; i < posVector.length; i += 1) {
    result[i] = (posCoeff * posVector[i]) + (negCoeff * negVector[i]);
  }
  return normalizeVector(result);
}

function evaluateSubnets(invariantVectors, placeIds, markedPlaces) {
  const invariants = invariantVectors.map((vector) => {
    const support = supportIndices(vector);
    const supportPlaces = support.map((index) => placeIds[index]);
    let markedSupportCount = 0;
    support.forEach((index) => {
      if (markedPlaces[index]) {
        markedSupportCount += 1;
      }
    });
    return {
      vector,
      supportPlaces,
      markedSupportCount,
      correctSubnet: markedSupportCount === 1
    };
  });

  const correctSubnetsCount = invariants.filter((item) => item.correctSubnet).length;
  return { invariants, correctSubnetsCount };
}

class WebGpuDotEngine {
  constructor(device) {
    this.device = device;
    const shaderCode = `
struct Params {
  rows: u32,
  cols: u32,
  _pad0: u32,
  _pad1: u32,
};

@group(0) @binding(0) var<storage, read> matrix: array<i32>;
@group(0) @binding(1) var<storage, read> column: array<i32>;
@group(0) @binding(2) var<storage, read_write> outValues: array<i32>;
@group(0) @binding(3) var<uniform> params: Params;

@compute @workgroup_size(${GPU_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let row = gid.x;
  if (row >= params.rows) {
    return;
  }

  var sum: i32 = 0;
  let base = row * params.cols;
  for (var c: u32 = 0u; c < params.cols; c = c + 1u) {
    sum = sum + matrix[base + c] * column[c];
  }
  outValues[row] = sum;
}
`;
    const shaderModule = this.device.createShaderModule({ code: shaderCode });
    this.pipeline = this.device.createComputePipeline({
      layout: "auto",
      compute: {
        module: shaderModule,
        entryPoint: "main"
      }
    });
  }

  static async create() {
    if (!self.navigator || !self.navigator.gpu) {
      throw new Error(tr("core.pinvariant.webgpuUnavailable"));
    }
    const adapter = await self.navigator.gpu.requestAdapter();
    if (!adapter) {
      throw new Error(tr("core.pinvariant.webgpuAdapterMissing"));
    }
    const device = await adapter.requestDevice();
    return new WebGpuDotEngine(device);
  }

  async computeDots(candidates, column) {
    const rows = candidates.length;
    const cols = column.length;
    if (rows === 0) {
      return new Int32Array(0);
    }
    if (cols === 0) {
      return new Int32Array(rows);
    }

    const cells = rows * cols;
    if (cells > 35000000) {
      throw new Error(tr("core.pinvariant.webgpuMatrixTooLarge"));
    }

    const matrixData = new Int32Array(cells);
    for (let r = 0; r < rows; r += 1) {
      const row = candidates[r];
      const offset = r * cols;
      for (let c = 0; c < cols; c += 1) {
        matrixData[offset + c] = parseInt(String(row[c] || 0), 10) || 0;
      }
    }

    const columnData = new Int32Array(cols);
    for (let i = 0; i < cols; i += 1) {
      columnData[i] = parseInt(String(column[i] || 0), 10) || 0;
    }

    const matrixBuffer = this.device.createBuffer({
      size: matrixData.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    });
    const columnBuffer = this.device.createBuffer({
      size: columnData.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    });
    const outputBuffer = this.device.createBuffer({
      size: rows * 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
    });
    const paramsBuffer = this.device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    const readBuffer = this.device.createBuffer({
      size: rows * 4,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
    });

    this.device.queue.writeBuffer(matrixBuffer, 0, matrixData);
    this.device.queue.writeBuffer(columnBuffer, 0, columnData);
    this.device.queue.writeBuffer(paramsBuffer, 0, new Uint32Array([rows, cols, 0, 0]));

    const bindGroup = this.device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: matrixBuffer } },
        { binding: 1, resource: { buffer: columnBuffer } },
        { binding: 2, resource: { buffer: outputBuffer } },
        { binding: 3, resource: { buffer: paramsBuffer } }
      ]
    });

    const encoder = this.device.createCommandEncoder();
    const pass = encoder.beginComputePass();
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.dispatchWorkgroups(Math.ceil(rows / GPU_WORKGROUP_SIZE));
    pass.end();
    encoder.copyBufferToBuffer(outputBuffer, 0, readBuffer, 0, rows * 4);

    this.device.queue.submit([encoder.finish()]);
    await readBuffer.mapAsync(GPUMapMode.READ);
    const mapped = readBuffer.getMappedRange();
    const result = new Int32Array(mapped.slice(0));
    readBuffer.unmap();

    matrixBuffer.destroy();
    columnBuffer.destroy();
    outputBuffer.destroy();
    paramsBuffer.destroy();
    readBuffer.destroy();

    return result;
  }
}

function createCpuDotEngine() {
  return {
    kind: "cpu",
    async computeDots(candidates, column) {
      const out = new Int32Array(candidates.length);
      for (let i = 0; i < candidates.length; i += 1) {
        out[i] = vectorDot(candidates[i], column);
      }
      return out;
    }
  };
}

async function resolveDotEngine(accelerationMode) {
  const requested = accelerationMode === "webgpu" ? "webgpu" : "cpu";
  if (requested !== "webgpu") {
    return {
      requested,
      used: "cpu",
      warning: "",
      engine: createCpuDotEngine()
    };
  }

  try {
    const gpuEngine = await WebGpuDotEngine.create();
    return {
      requested,
      used: "webgpu",
      warning: "",
      engine: gpuEngine
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : tr("worker.pinvariant.webgpuInitUnknown");
    return {
      requested,
      used: "cpu",
      warning: tr("core.pinvariant.webgpuFallback", { reason: message }),
      engine: createCpuDotEngine()
    };
  }
}

function emitProgress(onProgress, stage, total, message) {
  if (typeof onProgress === "function") {
    onProgress({
      stage,
      total,
      message
    });
  }
}

async function computePinvariantsMartinezSilva(nodes, arcs, mode, accelerationMode, options) {
  const selectedMode = mode === "full" ? "full" : "cover-stop";
  const startedAt = nowMs();
  const onProgress = options && typeof options.onProgress === "function" ? options.onProgress : null;
  const operationCounters = {
    stageCount: 0,
    dotEngineCalls: 0,
    dotProductEvaluations: 0,
    dotCellOperations: 0,
    positiveVectors: 0,
    negativeVectors: 0,
    zeroVectors: 0,
    addCandidateCalls: 0,
    addCandidateAdded: 0,
    addCandidateExists: 0,
    addCandidateZero: 0,
    addCandidateFull: 0,
    combinationAttempts: 0,
    nonZeroCombinations: 0,
    coverageDotChecks: 0,
    coverageReductionPasses: 0,
    coverageReductionRemoved: 0,
    finalCandidateCount: 0
  };
  const net = buildIncidence(nodes, arcs);
  const placeCount = net.placeIds.length;
  const transitionCount = net.transitionIds.length;
  const stageCandidateCap = estimateCandidateCap(placeCount, STAGE_MAX_CANDIDATE_CAP);
  const finalCandidateCap = estimateCandidateCap(placeCount, FINAL_MAX_CANDIDATE_CAP);

  const engineInfo = await resolveDotEngine(accelerationMode);
  if (engineInfo.warning) {
    emitProgress(onProgress, 0, Math.max(transitionCount, 1), engineInfo.warning);
  }

  if (placeCount === 0 || transitionCount === 0) {
    return {
      mode: selectedMode,
      placeIds: net.placeIds,
      transitionIds: net.transitionIds,
      invariants: [],
      coveredAllPlaces: false,
      uncoveredPlaces: net.placeIds.slice(),
      correctSubnetsCount: 0,
      processedStages: 0,
      totalStages: transitionCount,
      earlyStopped: false,
      wasTrimmed: false,
      accelerationRequested: engineInfo.requested,
      accelerationUsed: engineInfo.used,
      accelerationWarning: engineInfo.warning,
      candidateCap: stageCandidateCap,
      finalCandidateCap,
      memoryGuardTriggered: false,
      runtimeMs: Math.max(0, nowMs() - startedAt),
      operations: operationCounters
    };
  }

  const columns = Array.from({ length: transitionCount }, (_, colIndex) =>
    net.incidence.map((row) => row[colIndex] || 0)
  );

  let candidates = Array.from({ length: placeCount }, (_, rowIndex) => {
    const vector = new Array(placeCount).fill(0);
    vector[rowIndex] = 1;
    return vector;
  });

  let processedStages = 0;
  let earlyStopped = false;
  let wasTrimmed = false;
  let memoryGuardTriggered = false;

  function registerAddCandidateStatus(status) {
    operationCounters.addCandidateCalls += 1;
    if (status === "added") {
      operationCounters.addCandidateAdded += 1;
    } else if (status === "exists") {
      operationCounters.addCandidateExists += 1;
    } else if (status === "zero") {
      operationCounters.addCandidateZero += 1;
    } else if (status === "full") {
      operationCounters.addCandidateFull += 1;
    }
  }

  for (let stage = 0; stage < columns.length; stage += 1) {
    const column = columns[stage];
    operationCounters.stageCount += 1;
    operationCounters.dotEngineCalls += 1;
    operationCounters.dotProductEvaluations += candidates.length;
    operationCounters.dotCellOperations += candidates.length * column.length;
    const dotValues = await engineInfo.engine.computeDots(candidates, column);

    const positive = [];
    const negative = [];
    const zero = [];

    for (let i = 0; i < candidates.length; i += 1) {
      const value = dotValues[i] || 0;
      const vector = candidates[i];
      if (value > 0) {
        positive.push({ vector, value });
      } else if (value < 0) {
        negative.push({ vector, value });
      } else {
        zero.push(vector);
      }
    }
    operationCounters.positiveVectors += positive.length;
    operationCounters.negativeVectors += negative.length;
    operationCounters.zeroVectors += zero.length;

    const nextMap = new Map();
    let stageTrimmed = false;

    for (let i = 0; i < zero.length; i += 1) {
      const status = addCandidateVector(nextMap, zero[i], stageCandidateCap);
      registerAddCandidateStatus(status);
      if (status === "full") {
        stageTrimmed = true;
        memoryGuardTriggered = true;
        break;
      }
    }

    const combinationsLimit = Math.max(MIN_COMBINATIONS_LIMIT, stageCandidateCap * MAX_COMBINATIONS_FACTOR);
    let combinationsProcessed = 0;
    let breakOuter = stageTrimmed;

    for (let i = 0; i < positive.length && !breakOuter; i += 1) {
      for (let j = 0; j < negative.length; j += 1) {
        combinationsProcessed += 1;
        operationCounters.combinationAttempts += 1;
        if (combinationsProcessed > combinationsLimit && nextMap.size >= stageCandidateCap) {
          stageTrimmed = true;
          memoryGuardTriggered = true;
          breakOuter = true;
          break;
        }

        const combined = combineByCancellation(
          positive[i].vector,
          positive[i].value,
          negative[j].vector,
          negative[j].value
        );
        if (!combined.some((value) => value > 0)) {
          continue;
        }
        operationCounters.nonZeroCombinations += 1;

        const status = addCandidateVector(nextMap, combined, stageCandidateCap);
        registerAddCandidateStatus(status);
        if (status === "full") {
          stageTrimmed = true;
          memoryGuardTriggered = true;
          breakOuter = true;
          break;
        }
      }
    }

    candidates = sortCandidateVectors(Array.from(nextMap.values()));
    if (stageTrimmed) {
      wasTrimmed = true;
    }

    processedStages = stage + 1;
    let completeAtStage = [];
    let coverageAtStage = { coveredAllPlaces: false, uncoveredPlaces: net.placeIds.slice() };

    if (selectedMode === "cover-stop") {
      completeAtStage = filterCompleteInvariants(candidates, columns, processedStages, operationCounters);
      coverageAtStage = computeCoverage(completeAtStage, net.placeIds);
    }

    const progressSuffix = selectedMode === "cover-stop"
      ? tr("worker.pinvariant.completeSuffix", {
          count: completeAtStage.length,
          coverage: coverageAtStage.coveredAllPlaces ? tr("worker.pinvariant.coverageYes") : ""
        })
      : "";

    emitProgress(
      onProgress,
      processedStages,
      columns.length,
      tr("worker.pinvariant.stageProgress", {
        stage: processedStages,
        total: columns.length,
        mode: engineInfo.used.toUpperCase(),
        candidates: candidates.length,
        suffix: progressSuffix
      })
    );

    if (
      selectedMode === "cover-stop"
      && coverageAtStage.coveredAllPlaces
      && completeAtStage.length > 0
      && processedStages < columns.length
    ) {
      operationCounters.coverageReductionPasses += 1;
      const reducedCover = reduceVectorsByCoverage(completeAtStage, net.placeIds);
      if (reducedCover.length < completeAtStage.length) {
        wasTrimmed = true;
        operationCounters.coverageReductionRemoved += (completeAtStage.length - reducedCover.length);
      }
      candidates = reducedCover;
      earlyStopped = true;
      break;
    }

    if (candidates.length === 0) {
      break;
    }
  }

  const finalPruned = pruneCandidateVectors(candidates, finalCandidateCap);
  candidates = finalPruned.vectors;
  if (finalPruned.trimmed) {
    wasTrimmed = true;
    memoryGuardTriggered = true;
  }

  if (selectedMode === "cover-stop" && candidates.length > 0) {
    operationCounters.coverageReductionPasses += 1;
    const reducedByCoverage = reduceVectorsByCoverage(candidates, net.placeIds);
    if (reducedByCoverage.length < candidates.length) {
      wasTrimmed = true;
      operationCounters.coverageReductionRemoved += (candidates.length - reducedByCoverage.length);
    }
    candidates = reducedByCoverage;
  }

  operationCounters.finalCandidateCount = candidates.length;

  const coverage = computeCoverage(candidates, net.placeIds);
  const subnetEval = evaluateSubnets(candidates, net.placeIds, net.markedPlaces);

  return {
    mode: selectedMode,
    placeIds: net.placeIds,
    transitionIds: net.transitionIds,
    invariants: subnetEval.invariants,
    coveredAllPlaces: coverage.coveredAllPlaces,
    uncoveredPlaces: coverage.uncoveredPlaces,
    correctSubnetsCount: subnetEval.correctSubnetsCount,
    processedStages,
    totalStages: columns.length,
    earlyStopped,
    wasTrimmed,
    accelerationRequested: engineInfo.requested,
    accelerationUsed: engineInfo.used,
    accelerationWarning: engineInfo.warning,
    candidateCap: stageCandidateCap,
    finalCandidateCap,
    memoryGuardTriggered,
    runtimeMs: Math.max(0, nowMs() - startedAt),
    operations: operationCounters
  };
}

return {
  naturalIdCompare,
  gcd,
  gcdVector,
  normalizeVector,
  vectorDot,
  supportIndices,
  buildIncidence,
  evaluateSubnets,
  createCpuDotEngine,
  resolveDotEngine,
  computePinvariantsMartinezSilva
};
});
