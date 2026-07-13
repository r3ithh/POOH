(function(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("./i18n"));
  } else {
    root.PoohHypergraphCore = factory(root.PoohI18n);
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function(i18n) {
  "use strict";

  function tr(key, params) {
    return i18n && typeof i18n.t === "function" ? i18n.t(key, params) : String(key || "");
  }

  function nowMs() {
    if (typeof performance !== "undefined" && typeof performance.now === "function") {
      return performance.now();
    }
    return Date.now();
  }

  function naturalLabelCompare(a, b) {
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

  function toBit(value) {
    return Number(value || 0) > 0 ? 1 : 0;
  }

  function normalizeMatrix(matrix) {
    return (Array.isArray(matrix) ? matrix : []).map((row) => (
      Array.isArray(row) ? row.map(toBit) : []
    ));
  }

  function parseManualHypergraphText(text, options) {
    const opts = options && typeof options === "object" ? options : {};
    const raw = String(text || "").trim();
    if (!raw) {
      throw new Error(tr("core.hypergraph.edgeRequired"));
    }
    const chunks = raw
      .split(/\n|;/)
      .map((line) => line.replace(/#.*/, "").trim())
      .filter(Boolean);
    if (chunks.length === 0) {
      throw new Error(tr("core.hypergraph.noEdgesParsed"));
    }
    const edgeRows = [];
    const vertexSet = new Set();
    chunks.forEach((chunk, index) => {
      let label = `E${index + 1}`;
      let body = chunk;
      const match = /^([^:={]+)\s*[:=]\s*(.+)$/.exec(chunk);
      if (match) {
        label = match[1].trim() || label;
        body = match[2].trim();
      }
      body = body
        .replace(/[{}()[\]]/g, " ")
        .replace(/,/g, " ")
        .trim();
      const members = body
        .split(/\s+/)
        .map((item) => item.trim())
        .filter(Boolean);
      if (members.length === 0) {
        throw new Error(tr("core.hypergraph.edgeEmpty", { edge: label }));
      }
      members.forEach((member) => vertexSet.add(member));
      edgeRows.push({ label, members: Array.from(new Set(members)).sort(naturalLabelCompare) });
    });
    const colLabels = Array.from(vertexSet).sort(naturalLabelCompare);
    const indexByVertex = new Map(colLabels.map((label, index) => [label, index]));
    const matrix = edgeRows.map((edge) => {
      const row = new Array(colLabels.length).fill(0);
      edge.members.forEach((member) => {
        const index = indexByVertex.get(member);
        if (index !== undefined) {
          row[index] = 1;
        }
      });
      return row;
    });
    return {
      matrix,
      rowLabels: edgeRows.map((edge) => edge.label),
      colLabels,
      sourceText: raw,
      createdAt: opts.createdAt ? String(opts.createdAt) : new Date().toISOString()
    };
  }

  function vectorDominates(a, b, metrics) {
    if (a.length !== b.length) {
      return false;
    }
    let strict = false;
    for (let index = 0; index < a.length; index += 1) {
      if (metrics) {
        metrics.vectorCellComparisons = Number(metrics.vectorCellComparisons || 0) + 1;
      }
      if (toBit(a[index]) < toBit(b[index])) {
        return false;
      }
      if (toBit(a[index]) > toBit(b[index])) {
        strict = true;
      }
    }
    return strict;
  }

  function vectorsEqual(a, b, metrics) {
    if (a.length !== b.length) {
      return false;
    }
    for (let index = 0; index < a.length; index += 1) {
      if (metrics) {
        metrics.vectorCellComparisons = Number(metrics.vectorCellComparisons || 0) + 1;
      }
      if (toBit(a[index]) !== toBit(b[index])) {
        return false;
      }
    }
    return true;
  }

  function removeRowsWithLabels(matrix, labels, removeIndices) {
    const rows = [];
    const keptLabels = [];
    matrix.forEach((row, index) => {
      if (!removeIndices.has(index)) {
        rows.push(row.slice());
        keptLabels.push(labels[index]);
      }
    });
    return { matrix: rows, labels: keptLabels };
  }

  function removeColsWithLabels(matrix, labels, removeIndices) {
    return {
      matrix: matrix.map((row) => row.filter((_, index) => !removeIndices.has(index))),
      labels: labels.filter((_, index) => !removeIndices.has(index))
    };
  }

  function findEssentialColumns(matrix, metrics) {
    const result = new Set();
    if (metrics) {
      metrics.essentialRowsScanned = Number(metrics.essentialRowsScanned || 0) + matrix.length;
    }
    matrix.forEach((row) => {
      let ones = 0;
      let oneIndex = -1;
      for (let index = 0; index < row.length; index += 1) {
        if (metrics) {
          metrics.essentialCellChecks = Number(metrics.essentialCellChecks || 0) + 1;
        }
        if (toBit(row[index]) === 1) {
          ones += 1;
          oneIndex = index;
        }
      }
      if (ones === 1 && oneIndex >= 0) {
        result.add(oneIndex);
      }
    });
    return result;
  }

  function findDominatingRowsToRemove(matrix, metrics) {
    const remove = new Set();
    for (let i = 0; i < matrix.length; i += 1) {
      if (remove.has(i)) {
        continue;
      }
      for (let j = i + 1; j < matrix.length; j += 1) {
        if (remove.has(j)) {
          continue;
        }
        if (metrics) {
          metrics.rowPairComparisons = Number(metrics.rowPairComparisons || 0) + 1;
        }
        if (vectorsEqual(matrix[i], matrix[j], metrics)) {
          remove.add(j);
          continue;
        }
        if (vectorDominates(matrix[i], matrix[j], metrics)) {
          remove.add(i);
          break;
        }
        if (vectorDominates(matrix[j], matrix[i], metrics)) {
          remove.add(j);
        }
      }
    }
    return remove;
  }

  function findDominatedColumnsToRemove(matrix, metrics) {
    if (matrix.length === 0 || matrix[0].length === 0) {
      return new Set();
    }
    const colCount = matrix[0].length;
    const columns = Array.from({ length: colCount }, (_, colIndex) => (
      matrix.map((row) => toBit(row[colIndex]))
    ));
    const remove = new Set();
    for (let i = 0; i < columns.length; i += 1) {
      if (remove.has(i)) {
        continue;
      }
      for (let j = i + 1; j < columns.length; j += 1) {
        if (remove.has(j)) {
          continue;
        }
        if (metrics) {
          metrics.colPairComparisons = Number(metrics.colPairComparisons || 0) + 1;
        }
        if (vectorsEqual(columns[i], columns[j], metrics)) {
          remove.add(j);
          continue;
        }
        if (vectorDominates(columns[i], columns[j], metrics)) {
          remove.add(j);
          continue;
        }
        if (vectorDominates(columns[j], columns[i], metrics)) {
          remove.add(i);
          break;
        }
      }
    }
    return remove;
  }

  function reduceFra(matrix, rowLabels, colLabels) {
    const start = nowMs();
    let reducedMatrix = normalizeMatrix(matrix);
    let reducedRowLabels = (Array.isArray(rowLabels) ? rowLabels : []).slice();
    let reducedColLabels = (Array.isArray(colLabels) ? colLabels : []).slice();
    const removedRowLabels = [];
    const removedColLabels = [];
    const essentialLabels = [];
    const metrics = {
      cycles: 0,
      essentialRowsScanned: 0,
      essentialCellChecks: 0,
      rowPairComparisons: 0,
      colPairComparisons: 0,
      vectorCellComparisons: 0,
      removedRows: 0,
      removedCols: 0,
      ms: 0
    };

    let changed = true;
    while (changed && reducedMatrix.length > 0 && reducedColLabels.length > 0) {
      changed = false;
      metrics.cycles += 1;

      findEssentialColumns(reducedMatrix, metrics).forEach((colIndex) => {
        const label = reducedColLabels[colIndex];
        if (label && !essentialLabels.includes(label)) {
          essentialLabels.push(label);
        }
      });

      const rowsToRemove = findDominatingRowsToRemove(reducedMatrix, metrics);
      if (rowsToRemove.size > 0) {
        rowsToRemove.forEach((rowIndex) => {
          if (reducedRowLabels[rowIndex]) {
            removedRowLabels.push(reducedRowLabels[rowIndex]);
          }
        });
        const reduced = removeRowsWithLabels(reducedMatrix, reducedRowLabels, rowsToRemove);
        reducedMatrix = reduced.matrix;
        reducedRowLabels = reduced.labels;
        metrics.removedRows += rowsToRemove.size;
        changed = true;
      }

      const colsToRemove = findDominatedColumnsToRemove(reducedMatrix, metrics);
      if (colsToRemove.size > 0) {
        colsToRemove.forEach((colIndex) => {
          if (reducedColLabels[colIndex]) {
            removedColLabels.push(reducedColLabels[colIndex]);
          }
        });
        const reduced = removeColsWithLabels(reducedMatrix, reducedColLabels, colsToRemove);
        reducedMatrix = reduced.matrix;
        reducedColLabels = reduced.labels;
        metrics.removedCols += colsToRemove.size;
        changed = true;
      }
    }

    metrics.ms = nowMs() - start;
    return {
      originalMatrix: normalizeMatrix(matrix),
      originalRowLabels: (Array.isArray(rowLabels) ? rowLabels : []).slice(),
      originalColLabels: (Array.isArray(colLabels) ? colLabels : []).slice(),
      reducedMatrix,
      reducedRowLabels,
      reducedColLabels,
      removedRowLabels,
      removedColLabels,
      essentialLabels: essentialLabels.sort(naturalLabelCompare),
      metrics
    };
  }

  function rowSets(matrix) {
    return normalizeMatrix(matrix).map((row) => (
      row.flatMap((bit, index) => bit ? [index] : [])
    ));
  }

  function evaluateRowSets(rowSetList, indices) {
    const selected = new Set(Array.isArray(indices) ? indices : []);
    let coversAll = true;
    let exact = true;
    const hits = rowSetList.map((rowSet) => rowSet.reduce((sum, colIndex) => (
      sum + (selected.has(colIndex) ? 1 : 0)
    ), 0));
    hits.forEach((count) => {
      if (count === 0) {
        coversAll = false;
      }
      if (count !== 1) {
        exact = false;
      }
    });
    return { coversAll, exact, hits };
  }

  function evaluateSubset(matrix, indices) {
    return evaluateRowSets(rowSets(matrix), indices);
  }

  function isMinimalTransversal(matrix, indices) {
    const rowSetList = rowSets(matrix);
    if (!evaluateRowSets(rowSetList, indices).coversAll) {
      return false;
    }
    return !(Array.isArray(indices) ? indices : []).some((_, removeIndex) => (
      evaluateRowSets(rowSetList, indices.filter((__, index) => index !== removeIndex)).coversAll
    ));
  }

  function formatSetForSort(indices, labels) {
    return (Array.isArray(indices) ? indices : [])
      .map((index) => labels[index])
      .filter(Boolean)
      .join(",");
  }

  function enumerateTransversals(matrix, colLabels, options) {
    const opts = options && typeof options === "object" ? options : {};
    const labels = (Array.isArray(colLabels) ? colLabels : []).slice();
    const rowSetList = rowSets(matrix);
    if (labels.length === 0 || rowSetList.length === 0) {
      throw new Error(tr("core.hypergraph.graphRequired"));
    }
    const emptyIndex = rowSetList.findIndex((row) => row.length === 0);
    if (emptyIndex >= 0) {
      throw new Error(tr("core.hypergraph.emptyEdgeNoTransversal", { edge: emptyIndex + 1 }));
    }
    const maxVertices = Number.isFinite(Number(opts.maxVertices)) ? Number(opts.maxVertices) : 20;
    if (labels.length > maxVertices) {
      throw new Error(tr("core.hypergraph.enumerationLimit", { limit: maxVertices }));
    }

    const totalSubsets = Math.pow(2, labels.length);
    const resultLimit = Number.isFinite(Number(opts.resultLimit)) ? Number(opts.resultLimit) : 2000;
    const result = {
      labels,
      minimal: [],
      exact: [],
      checkedSubsets: 0,
      totalSubsets,
      truncated: false,
      minimalTruncated: false,
      exactTruncated: false
    };

    for (let mask = 1; mask < totalSubsets; mask += 1) {
      result.checkedSubsets += 1;
      const indices = [];
      for (let bit = 0; bit < labels.length; bit += 1) {
        if ((mask & (1 << bit)) !== 0) {
          indices.push(bit);
        }
      }
      const evaluation = evaluateRowSets(rowSetList, indices);
      if (!evaluation.coversAll) {
        continue;
      }
      if (evaluation.exact) {
        if (result.exact.length < resultLimit) {
          result.exact.push(indices.slice());
        } else {
          result.exactTruncated = true;
        }
      }
      const minimal = !indices.some((_, removeIndex) => (
        evaluateRowSets(rowSetList, indices.filter((__, index) => index !== removeIndex)).coversAll
      ));
      if (minimal) {
        if (result.minimal.length < resultLimit) {
          result.minimal.push(indices.slice());
        } else {
          result.minimalTruncated = true;
        }
      }
      if (result.exactTruncated && result.minimalTruncated) {
        result.truncated = true;
        break;
      }
    }

    result.truncated = Boolean(result.truncated || result.minimalTruncated || result.exactTruncated);
    result.minimal.sort((a, b) => a.length - b.length || naturalLabelCompare(formatSetForSort(a, labels), formatSetForSort(b, labels)));
    result.exact.sort((a, b) => a.length - b.length || naturalLabelCompare(formatSetForSort(a, labels), formatSetForSort(b, labels)));
    return result;
  }

  function countHits(row, indices) {
    const safeRow = Array.isArray(row) ? row : [];
    return (Array.isArray(indices) ? indices : []).reduce((sum, colIndex) => (
      sum + (toBit(safeRow[colIndex]) ? 1 : 0)
    ), 0);
  }

  function countIntersection(rowA, rowB) {
    const a = Array.isArray(rowA) ? rowA : [];
    const b = Array.isArray(rowB) ? rowB : [];
    const length = Math.max(a.length, b.length);
    let count = 0;
    for (let index = 0; index < length; index += 1) {
      if (toBit(a[index]) > 0 && toBit(b[index]) > 0) {
        count += 1;
      }
    }
    return count;
  }

  function isRowSubset(rowA, rowB) {
    const a = Array.isArray(rowA) ? rowA : [];
    const b = Array.isArray(rowB) ? rowB : [];
    const length = Math.max(a.length, b.length);
    let hasA = false;
    let strictlySmaller = false;
    for (let index = 0; index < length; index += 1) {
      const inA = toBit(a[index]) > 0;
      const inB = toBit(b[index]) > 0;
      if (inA) {
        hasA = true;
      }
      if (inA && !inB) {
        return false;
      }
      if (!inA && inB) {
        strictlySmaller = true;
      }
    }
    return hasA && strictlySmaller;
  }

  function rowKey(row) {
    return (Array.isArray(row) ? row : []).map((value) => (toBit(value) ? "1" : "0")).join("");
  }

  function formatSetLabels(indices, labels) {
    return `[${(Array.isArray(indices) ? indices : []).map((index) => labels[index]).filter(Boolean).join(", ")}]`;
  }

  function analyzeCExactSpectrum(matrix, colLabels, rank) {
    const labels = Array.isArray(colLabels) ? colLabels.slice() : [];
    const rows = normalizeMatrix(matrix);
    if (labels.length === 0 || rows.length === 0) {
      return { summary: "-", note: "", levels: [], candidates: [], labels, checkedSubsets: 0, totalSubsets: 0, solutionCount: 0 };
    }
    if (labels.length > 20) {
      return {
        summary: tr("core.hypergraph.cExactSkipped"),
        note: tr("core.hypergraph.cExactLimit"),
        levels: [],
        candidates: [],
        labels,
        checkedSubsets: 0,
        totalSubsets: 0,
        solutionCount: 0,
        truncated: true
      };
    }
    const maxC = Math.max(1, Number(rank || 0));
    const counts = {};
    const examples = {};
    const totalSubsets = Math.pow(2, labels.length);
    const candidateLimit = 800;
    const candidates = [];
    let checkedSubsets = 0;
    let truncated = false;
    for (let mask = 1; mask < totalSubsets; mask += 1) {
      checkedSubsets += 1;
      const indices = [];
      for (let bit = 0; bit < labels.length; bit += 1) {
        if ((mask & (1 << bit)) !== 0) {
          indices.push(bit);
        }
      }
      let cValue = null;
      let exactForC = true;
      for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
        const hits = countHits(rows[rowIndex], indices);
        if (hits < 1) {
          exactForC = false;
          break;
        }
        if (cValue === null) {
          cValue = hits;
        } else if (hits !== cValue) {
          exactForC = false;
          break;
        }
      }
      if (!exactForC || cValue === null || cValue > maxC) {
        continue;
      }
      counts[cValue] = Number(counts[cValue] || 0) + 1;
      if (!examples[cValue]) {
        examples[cValue] = indices.slice();
      }
      if (candidates.length < candidateLimit) {
        candidates.push({
          cValue,
          indices: indices.slice()
        });
      } else {
        truncated = true;
      }
    }
    const levelKeys = Object.keys(counts)
      .map((key) => Number(key))
      .filter((key) => Number.isFinite(key))
      .sort((a, b) => a - b);
    const levels = levelKeys.map((key) => ({
      cValue: key,
      count: Number(counts[key] || 0),
      example: examples[key] ? examples[key].slice() : []
    }));
    const summary = levelKeys
      .map((key) => {
        const example = examples[key] ? tr("core.hypergraph.example", { set: formatSetLabels(examples[key], labels) }) : "";
        return `c=${Math.round(key)}: ${Math.round(Number(counts[key] || 0))}${example}`;
      })
      .join("; ");
    const solutionCount = levelKeys.reduce((sum, key) => sum + Number(counts[key] || 0), 0);
    return {
      summary: summary || tr("core.hypergraph.noCExact"),
      note: truncated ? tr("core.hypergraph.cExactReportLimit") : "",
      levels,
      candidates,
      labels,
      checkedSubsets,
      totalSubsets,
      solutionCount,
      truncated,
      candidateLimit
    };
  }

  function analyzeStructure(matrix, rowLabels, colLabels) {
    const rows = normalizeMatrix(matrix);
    const rowLabelList = Array.isArray(rowLabels) ? rowLabels : [];
    const labels = Array.isArray(colLabels) ? colLabels.slice() : [];
    if (rows.length === 0 || labels.length === 0) {
      throw new Error(tr("core.hypergraph.classificationInput"));
    }
    const edgeSizes = rows.map((row) => row.reduce((sum, value) => sum + toBit(value), 0));
    const minEdgeSize = Math.min(...edgeSizes);
    const rank = Math.max(...edgeSizes);
    const isUniform = edgeSizes.every((size) => size === edgeSizes[0]);
    const duplicateKeys = new Map();
    rows.forEach((row) => {
      const key = rowKey(row);
      duplicateKeys.set(key, Number(duplicateKeys.get(key) || 0) + 1);
    });
    const duplicateEdgeCount = Array.from(duplicateKeys.values()).reduce((sum, count) => sum + Math.max(0, count - 1), 0);
    let isLinear = true;
    let maxIntersection = 0;
    let containedPair = null;
    for (let i = 0; i < rows.length; i += 1) {
      for (let j = i + 1; j < rows.length; j += 1) {
        const intersection = countIntersection(rows[i], rows[j]);
        maxIntersection = Math.max(maxIntersection, intersection);
        if (intersection > 1) {
          isLinear = false;
        }
        if (!containedPair && (isRowSubset(rows[i], rows[j]) || isRowSubset(rows[j], rows[i]))) {
          containedPair = [i, j];
        }
      }
    }
    const degrees = labels.map((_, colIndex) => rows.reduce((sum, row) => sum + toBit(row[colIndex]), 0));
    const minDegree = degrees.length ? Math.min(...degrees) : 0;
    const maxDegree = degrees.length ? Math.max(...degrees) : 0;
    const isRegular = degrees.every((degree) => degree === degrees[0]);
    const cExact = analyzeCExactSpectrum(rows, labels, rank);
    const containedText = containedPair
      ? `${rowLabelList[containedPair[0]] || `E${containedPair[0] + 1}`}⊂${rowLabelList[containedPair[1]] || `E${containedPair[1] + 1}`}`
      : "";
    return {
      vertexCount: labels.length,
      edgeCount: rows.length,
      rank,
      minEdgeSize,
      uniformity: isUniform ? edgeSizes[0] : null,
      isUniform,
      isLinear,
      maxIntersection,
      isSimple: duplicateEdgeCount === 0,
      duplicateEdgeCount,
      isClutter: !containedPair && duplicateEdgeCount === 0,
      containedText,
      isRegular,
      regularity: isRegular ? degrees[0] : null,
      minDegree,
      maxDegree,
      edgeSizes,
      degrees,
      cExactSummary: cExact.summary,
      note: cExact.note
    };
  }

  function analyzeRExact(matrix, rowLabels, colLabels, targetR, options) {
    const rows = normalizeMatrix(matrix);
    const safeRowLabels = (Array.isArray(rowLabels) ? rowLabels : []).slice();
    const safeColLabels = (Array.isArray(colLabels) ? colLabels : []).slice();
    const all = enumerateTransversals(rows, safeColLabels, options);
    const minimal = Array.isArray(all.minimal) ? all.minimal : [];
    if (minimal.length === 0) {
      throw new Error(tr("core.hypergraph.noMinimalForRExact"));
    }

    let rStar = 0;
    let witness = null;
    const rowMaxHits = rows.map((_, rowIndex) => ({
      label: safeRowLabels[rowIndex] || `E${rowIndex + 1}`,
      maxHits: 0,
      transversalIndex: -1,
      transversal: []
    }));
    const distribution = {};

    minimal.forEach((indices, transversalIndex) => {
      let localMax = 0;
      rows.forEach((row, rowIndex) => {
        const hits = countHits(row, indices);
        localMax = Math.max(localMax, hits);
        if (rowMaxHits[rowIndex] && hits > rowMaxHits[rowIndex].maxHits) {
          rowMaxHits[rowIndex] = {
            ...rowMaxHits[rowIndex],
            maxHits: hits,
            transversalIndex,
            transversal: indices.slice()
          };
        }
        if (hits > rStar) {
          rStar = hits;
          witness = {
            hits,
            rowIndex,
            rowLabel: safeRowLabels[rowIndex] || `E${rowIndex + 1}`,
            transversalIndex,
            indices: indices.slice(),
            labels: indices.map((index) => safeColLabels[index]).filter(Boolean)
          };
        }
      });
      distribution[localMax] = Number(distribution[localMax] || 0) + 1;
    });

    const threshold = Math.max(1, parseInt(String(targetR || 1), 10) || 1);
    return {
      rStar,
      targetR: threshold,
      isRExact: rStar <= threshold,
      isOneExact: rStar <= 1,
      minimalCount: minimal.length,
      exactCount: Array.isArray(all.exact) ? all.exact.length : 0,
      checkedSubsets: all.checkedSubsets,
      totalSubsets: all.totalSubsets,
      truncated: Boolean(all.truncated || all.minimalTruncated || all.exactTruncated),
      labels: safeColLabels.slice(),
      rowLabels: safeRowLabels.slice(),
      rowMaxHits,
      distribution,
      witness
    };
  }

  return {
    reduceFra,
    parseManualHypergraphText,
    enumerateTransversals,
    evaluateSubset,
    analyzeStructure,
    analyzeCExactSpectrum,
    analyzeRExact,
    rowSets
  };
});
