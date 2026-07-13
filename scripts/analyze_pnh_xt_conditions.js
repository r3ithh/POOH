#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const i18n = require("../src/core/i18n");

i18n.setLanguage(process.env.POOH_LANGUAGE || process.env.LANG || "en");

function tr(key, params) {
  return i18n.t(key, params);
}

const ROOT = path.resolve(__dirname, "..");
const DEFAULT_DIR = path.join(ROOT, "data/pnh_libraries/lib_55033290a3fc3aa4/files");

function naturalCompare(a, b) {
  return String(a || "").localeCompare(String(b || ""), i18n.getLanguage(), { numeric: true, sensitivity: "base" });
}

function normalizeLine(line) {
  return String(line || "").replace(/^\uFEFF/, "").replace(/\u0000/g, "").trim();
}

function parseStrictPositiveIntLine(line) {
  const compact = normalizeLine(line).replace(/\s+/g, "");
  if (!/^[0-9]+$/.test(compact)) {
    return null;
  }
  const value = parseInt(compact, 10);
  return Number.isInteger(value) && value > 0 ? value : null;
}

function parseMetadata(lines) {
  const out = [];
  lines.forEach((line) => {
    const clean = normalizeLine(line);
    if (!clean.startsWith(";")) {
      return;
    }
    const body = clean.slice(1).trim();
    if (!body) {
      return;
    }
    const eqIndex = body.indexOf("=");
    const colonIndex = body.indexOf(":");
    let splitIndex = -1;
    if (eqIndex > 0 && (colonIndex < 0 || eqIndex < colonIndex)) {
      splitIndex = eqIndex;
    } else if (colonIndex > 0) {
      splitIndex = colonIndex;
    }
    if (splitIndex > 0) {
      out.push({
        key: body.slice(0, splitIndex).trim(),
        value: body.slice(splitIndex + 1).trim()
      });
    }
  });
  return out;
}

function metadataValue(metadata, key) {
  const lowered = String(key || "").toLowerCase();
  const found = metadata.find((item) => String(item.key || "").toLowerCase() === lowered);
  return found ? String(found.value || "") : "";
}

function parseNameList(raw, expectedCount, fallbackPrefix) {
  const parts = String(raw || "")
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);
  return Array.from({ length: expectedCount }, (_, index) => parts[index] || `${fallbackPrefix}${index + 1}`);
}

function parseMarking(raw, placeCount) {
  const compact = String(raw || "").replace(/\s+/g, "");
  if (new RegExp(`^[0-9]{${placeCount}}$`).test(compact)) {
    return compact.split("").map((char) => parseInt(char, 10));
  }
  const parts = String(raw || "").split(/[\s,;]+/).filter(Boolean);
  if (parts.length !== placeCount) {
    return Array.from({ length: placeCount }, () => 0);
  }
  return parts.map((part) => Math.max(0, parseInt(part, 10) || 0));
}

function findMatrixHeaderIndex(dataLines) {
  for (let index = 0; index < dataLines.length - 1; index += 1) {
    const placeCount = parseStrictPositiveIntLine(dataLines[index]);
    const transitionCount = parseStrictPositiveIntLine(dataLines[index + 1]);
    if (placeCount === null || transitionCount === null) {
      continue;
    }
    const firstMatrixCandidate = normalizeLine(dataLines[index + 2] || "").replace(/\s+/g, "");
    if (firstMatrixCandidate && /^[xX0-9]+$/.test(firstMatrixCandidate)) {
      return index;
    }
  }
  return -1;
}

function parseMatrixPnh(rawText) {
  const lines = String(rawText || "").split(/\r?\n/);
  const metadata = parseMetadata(lines);
  const dataLines = lines
    .map((line) => normalizeLine(line))
    .filter((line) => line && !line.startsWith(";") && !line.startsWith("#") && !line.startsWith("//"));
  const headerIndex = findMatrixHeaderIndex(dataLines);
  if (headerIndex < 0) {
    throw new Error(tr("script.analyzePnh.matrixHeaderMissing"));
  }
  const payload = dataLines.slice(headerIndex);
  const placeCount = parseInt(payload[0], 10);
  const declaredTransitionCount = parseInt(payload[1], 10);
  const payloadLines = payload.slice(2).map((row) => normalizeLine(row)).filter(Boolean);
  if (payloadLines.length < 2) {
    throw new Error(tr("script.analyzePnh.tooFewRows"));
  }
  const markingRow = payloadLines[payloadLines.length - 1];
  const matrixRows = payloadLines.slice(0, -1).map((row) => row.replace(/\s+/g, ""));
  const transitionCount = matrixRows.length;
  const placeLabels = parseNameList(metadataValue(metadata, "Places"), placeCount, "P");
  const transitionLabels = parseNameList(metadataValue(metadata, "Transitions"), transitionCount, "T");
  const marking = parseMarking(markingRow, placeCount);
  const nodes = [];
  for (let place = 0; place < placeCount; place += 1) {
    nodes.push({
      id: `P${place + 1}`,
      label: placeLabels[place],
      type: "place",
      tokens: marking[place] || 0
    });
  }
  for (let transition = 0; transition < transitionCount; transition += 1) {
    nodes.push({
      id: `T${transition + 1}`,
      label: transitionLabels[transition],
      type: "transition",
      tokens: 0
    });
  }
  const arcs = [];
  let arcCounter = 1;
  matrixRows.forEach((row, transitionIndex) => {
    if (row.length !== placeCount) {
      throw new Error(tr("script.analyzePnh.invalidColumnCount", {
        row: transitionIndex + 1,
        actual: row.length,
        expected: placeCount
      }));
    }
    for (let placeIndex = 0; placeIndex < placeCount; placeIndex += 1) {
      const symbol = row[placeIndex];
      const placeId = `P${placeIndex + 1}`;
      const transitionId = `T${transitionIndex + 1}`;
      if (symbol === "x" || symbol === "X") {
        arcs.push({ id: `A${arcCounter++}`, from: placeId, to: transitionId, weight: 1 });
      } else if (/^[1-9]$/.test(symbol)) {
        arcs.push({ id: `A${arcCounter++}`, from: transitionId, to: placeId, weight: parseInt(symbol, 10) });
      } else if (symbol !== "0") {
        throw new Error(tr("script.analyzePnh.unknownSymbol", { symbol }));
      }
    }
  });
  return {
    nodes,
    arcs,
    metadata,
    declaredTransitionCount,
    transitionCount,
    placeCount
  };
}

function loadWorker(filePath) {
  const code = fs.readFileSync(filePath, "utf8");
  const context = {
    console,
    setTimeout,
    clearTimeout,
    Uint32Array,
    Int32Array,
    ArrayBuffer,
    Date,
    Math,
    Map,
    Set,
    Error,
    Promise,
    performance: { now: () => Date.now() },
    postMessage() {},
    self: {}
  };
  context.self = context;
  vm.createContext(context);
  vm.runInContext(code, context, { filename: filePath });
  return context;
}

function vectorsEqual(a, b) {
  const length = Math.max(a.length, b.length);
  for (let i = 0; i < length; i += 1) {
    if ((a[i] || 0) !== (b[i] || 0)) {
      return false;
    }
  }
  return true;
}

function vectorDominates(a, b) {
  let strictlyGreater = false;
  const length = Math.max(a.length, b.length);
  for (let i = 0; i < length; i += 1) {
    const va = Number(a[i] || 0);
    const vb = Number(b[i] || 0);
    if (va < vb) {
      return false;
    }
    if (va > vb) {
      strictlyGreater = true;
    }
  }
  return strictlyGreater;
}

function removeRowsWithLabels(matrix, labels, removeIndices) {
  return {
    matrix: matrix.filter((_, index) => !removeIndices.has(index)),
    labels: labels.filter((_, index) => !removeIndices.has(index))
  };
}

function removeColsWithLabels(matrix, labels, removeIndices) {
  return {
    matrix: matrix.map((row) => row.filter((_, index) => !removeIndices.has(index))),
    labels: labels.filter((_, index) => !removeIndices.has(index))
  };
}

function findEssentialColumns(matrix) {
  const result = new Set();
  matrix.forEach((row) => {
    let ones = 0;
    let oneIndex = -1;
    row.forEach((value, index) => {
      if (value === 1) {
        ones += 1;
        oneIndex = index;
      }
    });
    if (ones === 1 && oneIndex >= 0) {
      result.add(oneIndex);
    }
  });
  return result;
}

function findDominatingRowsToRemove(matrix) {
  const remove = new Set();
  for (let i = 0; i < matrix.length; i += 1) {
    if (remove.has(i)) {
      continue;
    }
    for (let j = i + 1; j < matrix.length; j += 1) {
      if (remove.has(j)) {
        continue;
      }
      if (vectorsEqual(matrix[i], matrix[j])) {
        remove.add(j);
      } else if (vectorDominates(matrix[i], matrix[j])) {
        remove.add(i);
        break;
      } else if (vectorDominates(matrix[j], matrix[i])) {
        remove.add(j);
      }
    }
  }
  return remove;
}

function findDominatedColumnsToRemove(matrix) {
  if (matrix.length === 0 || matrix[0].length === 0) {
    return new Set();
  }
  const columns = Array.from({ length: matrix[0].length }, (_, colIndex) => matrix.map((row) => row[colIndex] || 0));
  const remove = new Set();
  for (let i = 0; i < columns.length; i += 1) {
    if (remove.has(i)) {
      continue;
    }
    for (let j = i + 1; j < columns.length; j += 1) {
      if (remove.has(j)) {
        continue;
      }
      if (vectorsEqual(columns[i], columns[j])) {
        remove.add(j);
      } else if (vectorDominates(columns[i], columns[j])) {
        remove.add(j);
      } else if (vectorDominates(columns[j], columns[i])) {
        remove.add(i);
        break;
      }
    }
  }
  return remove;
}

function computeSelectionHypergraph(pinvariantResult) {
  const placeIds = pinvariantResult.placeIds.slice().sort(naturalCompare);
  const placeIndexById = new Map(placeIds.map((id, index) => [id, index]));
  const tagged = pinvariantResult.invariants.map((inv, index) => ({ ...inv, _label: `D${index + 1}` }));
  const correct = tagged.filter((inv) => inv && inv.correctSubnet === true);
  if (correct.length === 0) {
    throw new Error(tr("script.analyzePnh.noValidSubnets"));
  }
  const subnetLabels = correct.map((inv) => inv._label);
  const subnetPlaceMap = {};
  correct.forEach((inv) => {
    subnetPlaceMap[inv._label] = Array.from(new Set(Array.isArray(inv.supportPlaces) ? inv.supportPlaces.map(String) : []))
      .filter(Boolean)
      .sort(naturalCompare);
  });
  const subnetMatrix = correct.map((inv) => {
    const line = new Array(placeIds.length).fill(0);
    (Array.isArray(inv.supportPlaces) ? inv.supportPlaces : []).forEach((placeId) => {
      const idx = placeIndexById.get(placeId);
      if (idx !== undefined) {
        line[idx] = 1;
      }
    });
    return line;
  });
  let dualRowLabels = placeIds.slice();
  let dualColLabels = subnetLabels.slice();
  let dualMatrix = dualRowLabels.map((_, placeIdx) => subnetMatrix.map((row) => row[placeIdx] || 0));
  const essentialLabels = [];
  let changed = true;
  let cycles = 0;
  while (changed && dualMatrix.length > 0 && dualColLabels.length > 0) {
    cycles += 1;
    changed = false;
    Array.from(findEssentialColumns(dualMatrix)).forEach((colIndex) => {
      const label = dualColLabels[colIndex];
      if (label && !essentialLabels.includes(label)) {
        essentialLabels.push(label);
      }
    });
    const rows = findDominatingRowsToRemove(dualMatrix);
    if (rows.size > 0) {
      const reduced = removeRowsWithLabels(dualMatrix, dualRowLabels, rows);
      dualMatrix = reduced.matrix;
      dualRowLabels = reduced.labels;
      changed = true;
    }
    const cols = findDominatedColumnsToRemove(dualMatrix);
    if (cols.size > 0) {
      const reduced = removeColsWithLabels(dualMatrix, dualColLabels, cols);
      dualMatrix = reduced.matrix;
      dualColLabels = reduced.labels;
      changed = true;
    }
  }
  return {
    placeIds,
    subnetLabels,
    subnetMatrix,
    subnetPlaceMap,
    reducedRowLabels: dualRowLabels.slice(),
    reducedColLabels: dualColLabels.slice(),
    reducedDualMatrix: dualMatrix.map((row) => row.slice()),
    reducedComponentPlaces: dualColLabels.reduce((acc, label) => {
      acc[label] = Array.isArray(subnetPlaceMap[label]) ? subnetPlaceMap[label].slice() : [];
      return acc;
    }, {}),
    essentialLabels: essentialLabels.sort(naturalCompare),
    cycles
  };
}

function edgeSizes(matrix) {
  return matrix.map((row) => row.reduce((sum, value) => sum + (Number(value || 0) > 0 ? 1 : 0), 0));
}

function columnDegrees(matrix, colCount) {
  return Array.from({ length: colCount }, (_, colIndex) =>
    matrix.reduce((sum, row) => sum + (Number((row || [])[colIndex] || 0) > 0 ? 1 : 0), 0)
  );
}

function relationMetrics(matrix) {
  const sizes = edgeSizes(matrix);
  const maxEdge = sizes.length ? Math.max(...sizes) : 0;
  const minEdge = sizes.length ? Math.min(...sizes) : 0;
  const degrees = columnDegrees(matrix, matrix[0] ? matrix[0].length : 0);
  return {
    edgeCount: matrix.length,
    vertexCount: matrix[0] ? matrix[0].length : 0,
    minEdge,
    maxEdge,
    avgEdge: sizes.length ? sizes.reduce((a, b) => a + b, 0) / sizes.length : 0,
    minDegree: degrees.length ? Math.min(...degrees) : 0,
    maxDegree: degrees.length ? Math.max(...degrees) : 0
  };
}

function toCsv(rows) {
  return rows.map((row) => row.map((value) => {
    const text = String(value === undefined || value === null ? "" : value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }).join(",")).join("\n");
}

async function main() {
  const args = process.argv.slice(2);
  const dir = path.resolve(args[0] || DEFAULT_DIR);
  const limitArg = args.find((arg) => arg.startsWith("--limit="));
  const limit = limitArg ? Math.max(1, parseInt(limitArg.slice("--limit=".length), 10) || 1) : Infinity;
  const modeArg = args.find((arg) => arg.startsWith("--mode="));
  const mode = modeArg ? modeArg.slice("--mode=".length) : "cover-stop";
  const files = fs.readdirSync(dir)
    .filter((file) => /\.pnh$/i.test(file))
    .sort(naturalCompare)
    .slice(0, limit);

  require(path.join(ROOT, "public/hypergraph-structural-xt.js"));
  const structural = globalThis.PoohStructuralXt;
  const pinv = loadWorker(path.join(ROOT, "public/pinvariant-worker.js"));
  const xtrec = loadWorker(path.join(ROOT, "public/xtrec-worker.js"));

  const rows = [];
  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const filePath = path.join(dir, file);
    const started = Date.now();
    try {
      const parsed = parseMatrixPnh(fs.readFileSync(filePath, "utf8"));
      const pinvResult = await pinv.computePinvariantsMartinezSilva(parsed.nodes, parsed.arcs, mode, "cpu", index + 1);
      const selection = computeSelectionHypergraph(pinvResult);
      const xt = await xtrec.computeXtrec({
        matrix: selection.reducedDualMatrix,
        rowLabels: selection.reducedRowLabels,
        colLabels: selection.reducedColLabels,
        acceleration: "cpu"
      }, index + 1);
      const structuralResult = structural.analyze({
        source: "selection",
        matrix: selection.reducedDualMatrix,
        rowLabels: selection.reducedRowLabels,
        colLabels: selection.reducedColLabels,
        componentPlaces: selection.reducedComponentPlaces,
        xtrec: xt,
        petri: null
      });
      const rules = Object.fromEntries(structuralResult.rules.map((rule) => [rule.id, rule.status]));
      const metrics = relationMetrics(selection.reducedDualMatrix);
      rows.push({
        file,
        status: "ok",
        places: parsed.placeCount,
        transitions: parsed.transitionCount,
        invariants: pinvResult.invariants.length,
        correctSubnets: pinvResult.correctSubnetsCount,
        covered: pinvResult.coveredAllPlaces,
        earlyStopped: pinvResult.earlyStopped,
        memoryGuard: pinvResult.memoryGuardTriggered,
        hEdges: metrics.edgeCount,
        hVertices: metrics.vertexCount,
        minEdge: metrics.minEdge,
        maxEdge: metrics.maxEdge,
        avgEdge: metrics.avgEdge.toFixed(3),
        minDegree: metrics.minDegree,
        maxDegree: metrics.maxDegree,
        xt: xt.isXt,
        structuralCertified: structuralResult.structurallyCertified,
        sufficientRules: structuralResult.sufficientRules.join("|"),
        R1: rules.R1,
        R2: rules.R2,
        R3: rules.R3,
        R4: rules.R4,
        R5: rules.R5,
        R6: rules.R6,
        xtChecks: `${xt.checksPerformed}/${xt.checksTotal}`,
        ms: Date.now() - started
      });
      process.stderr.write(`[${index + 1}/${files.length}] ${file}: XT=${xt.isXt ? "TAK" : "NIE"}, cert=${structuralResult.structurallyCertified ? "TAK" : "NIE"}\n`);
    } catch (error) {
      rows.push({
        file,
        status: "error",
        error: error instanceof Error ? error.message : String(error)
      });
      process.stderr.write(`[${index + 1}/${files.length}] ${file}: ERROR ${rows[rows.length - 1].error}\n`);
    }
  }

  const headers = Array.from(rows.reduce((set, row) => {
    Object.keys(row).forEach((key) => set.add(key));
    return set;
  }, new Set()));
  process.stdout.write(toCsv([headers, ...rows.map((row) => headers.map((key) => row[key]))]));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
