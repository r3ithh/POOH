"use strict";

let transversalCore = null;
try {
  if (typeof importScripts === "function") {
    importScripts(
      "../src/core/i18n.js",
      "../src/core/worker-i18n.js",
      "../src/core/transversal.js"
    );
  }
  if (typeof self !== "undefined" && self.PoohTransversalCore) {
    transversalCore = self.PoohTransversalCore;
  }
} catch (error) {
  transversalCore = null;
}

function workerT(key, params) {
  return self.PoohWorkerI18n && typeof self.PoohWorkerI18n.t === "function"
    ? self.PoohWorkerI18n.t(key, params)
    : String(key || "");
}

function nowMs() {
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    return performance.now();
  }
  return Date.now();
}

function asInt(value) {
  if (Number.isFinite(value)) {
    return Math.trunc(value);
  }
  const parsed = parseInt(String(value || 0), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toBit(value) {
  return asInt(value) > 0 ? 1 : 0;
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

function normalizeStrategy(value) {
  const safe = String(value || "all").toLowerCase();
  if (safe === "xtr" || safe === "dlx" || safe === "backtracking" || safe === "greedy") {
    return safe;
  }
  return "all";
}

function sortIndicesByLabels(indices, labels) {
  const sorted = (Array.isArray(indices) ? indices.slice() : [])
    .map((index) => asInt(index))
    .filter((index) => index >= 0 && index < labels.length);
  sorted.sort((a, b) => naturalLabelCompare(labels[a], labels[b]));
  return sorted;
}

function indicesToLabels(indices, labels) {
  return sortIndicesByLabels(indices, labels).map((index) => String(labels[index]));
}

function countTrue(values) {
  let count = 0;
  for (let i = 0; i < values.length; i += 1) {
    if (values[i]) {
      count += 1;
    }
  }
  return count;
}

function evaluateSolution(indices, edges) {
  const selected = new Set((Array.isArray(indices) ? indices : []).map((index) => asInt(index)));
  let coversAll = true;
  let exact = true;
  let coveredEdges = 0;
  const uncovered = [];
  const overcovered = [];

  for (let edgeIndex = 0; edgeIndex < edges.length; edgeIndex += 1) {
    const edge = edges[edgeIndex];
    let hits = 0;
    for (let i = 0; i < edge.length; i += 1) {
      if (selected.has(edge[i])) {
        hits += 1;
      }
    }
    if (hits === 0) {
      coversAll = false;
      exact = false;
      uncovered.push(edgeIndex);
      continue;
    }
    coveredEdges += 1;
    if (hits !== 1) {
      exact = false;
      if (hits > 1) {
        overcovered.push(edgeIndex);
      }
    }
  }

  return {
    coversAll,
    exact,
    coveredEdges,
    totalEdges: edges.length,
    uncovered,
    overcovered
  };
}

function buildHypergraph(payload) {
  const matrix = Array.isArray(payload.matrix) ? payload.matrix : [];
  const rowLabelsInput = Array.isArray(payload.rowLabels) ? payload.rowLabels : [];
  const colLabelsInput = Array.isArray(payload.colLabels) ? payload.colLabels : [];

  const rowCount = matrix.length;
  const colCount = colLabelsInput.length > 0
    ? colLabelsInput.length
    : (rowCount > 0 && Array.isArray(matrix[0]) ? matrix[0].length : 0);

  const rowLabels = Array.from({ length: rowCount }, (_, index) => (
    rowLabelsInput[index] !== undefined ? String(rowLabelsInput[index]) : `E${index + 1}`
  ));
  const colLabels = Array.from({ length: colCount }, (_, index) => (
    colLabelsInput[index] !== undefined ? String(colLabelsInput[index]) : `V${index + 1}`
  ));

  const edges = [];
  const rowsByCol = Array.from({ length: colCount }, () => []);

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    const row = Array.isArray(matrix[rowIndex]) ? matrix[rowIndex] : [];
    const edge = [];
    for (let colIndex = 0; colIndex < colCount; colIndex += 1) {
      if (toBit(row[colIndex]) === 1) {
        edge.push(colIndex);
        rowsByCol[colIndex].push(rowIndex);
      }
    }
    edges.push(edge);
  }

  return {
    rowLabels,
    colLabels,
    edges,
    rowsByCol,
    rowCount,
    colCount
  };
}

function countActiveRows(activeRows) {
  let count = 0;
  for (let i = 0; i < activeRows.length; i += 1) {
    if (activeRows[i]) {
      count += 1;
    }
  }
  return count;
}

function rowCandidatesExact(hg, rowIndex, activeCols, counters) {
  const edge = hg.edges[rowIndex] || [];
  const out = [];
  for (let i = 0; i < edge.length; i += 1) {
    const colIndex = edge[i];
    if (counters) {
      counters.candidateChecks += 1;
    }
    if (activeCols[colIndex]) {
      out.push(colIndex);
    }
  }
  return out;
}

function chooseRowMinCandidatesExact(hg, activeRows, activeCols, counters) {
  let bestRow = -1;
  let bestCandidates = null;

  for (let rowIndex = 0; rowIndex < activeRows.length; rowIndex += 1) {
    if (!activeRows[rowIndex]) {
      continue;
    }
    const candidates = rowCandidatesExact(hg, rowIndex, activeCols, counters);
    if (candidates.length === 0) {
      return {
        solved: false,
        dead: true,
        rowIndex,
        candidates: []
      };
    }
    if (bestCandidates === null || candidates.length < bestCandidates.length) {
      bestRow = rowIndex;
      bestCandidates = candidates;
      if (bestCandidates.length <= 1) {
        break;
      }
    }
  }

  if (bestRow < 0) {
    return {
      solved: true,
      dead: false,
      rowIndex: -1,
      candidates: []
    };
  }

  return {
    solved: false,
    dead: false,
    rowIndex: bestRow,
    candidates: bestCandidates || []
  };
}

function applyExactChoice(hg, state, colIndex, counters) {
  if (!state.activeCols[colIndex]) {
    return null;
  }

  const coveredRows = [];
  const rowList = hg.rowsByCol[colIndex] || [];
  for (let i = 0; i < rowList.length; i += 1) {
    const rowIndex = rowList[i];
    if (state.activeRows[rowIndex]) {
      coveredRows.push(rowIndex);
    }
  }
  if (coveredRows.length === 0) {
    return null;
  }

  const nextActiveRows = state.activeRows.slice();
  for (let i = 0; i < coveredRows.length; i += 1) {
    nextActiveRows[coveredRows[i]] = false;
  }

  const nextActiveCols = state.activeCols.slice();
  const conflict = new Set();
  for (let i = 0; i < coveredRows.length; i += 1) {
    const edge = hg.edges[coveredRows[i]] || [];
    for (let j = 0; j < edge.length; j += 1) {
      conflict.add(edge[j]);
      if (counters) {
        counters.conflictMarks += 1;
      }
    }
  }
  conflict.forEach((idx) => {
    nextActiveCols[idx] = false;
  });

  const nextSelected = state.selected.slice();
  nextSelected.push(colIndex);

  if (counters) {
    counters.choiceApplications += 1;
    counters.rowsCovered += coveredRows.length;
    counters.columnsDisabled += conflict.size;
  }

  return {
    activeRows: nextActiveRows,
    activeCols: nextActiveCols,
    selected: nextSelected
  };
}

function exactLowerBound(hg, activeRows, activeCols, counters) {
  const uncoveredRows = countActiveRows(activeRows);
  if (uncoveredRows <= 0) {
    return 0;
  }

  let maxCover = 0;
  for (let colIndex = 0; colIndex < activeCols.length; colIndex += 1) {
    if (!activeCols[colIndex]) {
      continue;
    }
    let cover = 0;
    const rowList = hg.rowsByCol[colIndex] || [];
    for (let i = 0; i < rowList.length; i += 1) {
      if (activeRows[rowList[i]]) {
        cover += 1;
      }
      if (counters) {
        counters.boundChecks += 1;
      }
    }
    if (cover > maxCover) {
      maxCover = cover;
    }
  }

  if (maxCover <= 0) {
    return Number.POSITIVE_INFINITY;
  }
  return Math.ceil(uncoveredRows / maxCover);
}

function runDlxLikeExact(hg) {
  const started = nowMs();
  const counters = {
    nodesVisited: 0,
    branches: 0,
    deadEnds: 0,
    boundPrunes: 0,
    candidateChecks: 0,
    boundChecks: 0,
    choiceApplications: 0,
    rowsCovered: 0,
    columnsDisabled: 0,
    conflictMarks: 0
  };

  if (hg.rowCount === 0) {
    return {
      method: "dlx",
      runtimeMs: Math.max(0, nowMs() - started),
      found: true,
      solution: [],
      counters
    };
  }

  let best = null;
  let bestSize = Number.POSITIVE_INFINITY;

  function recurse(state) {
    counters.nodesVisited += 1;

    if (state.selected.length >= bestSize) {
      counters.boundPrunes += 1;
      return;
    }

    const lb = exactLowerBound(hg, state.activeRows, state.activeCols, counters);
    if (!Number.isFinite(lb)) {
      counters.deadEnds += 1;
      return;
    }
    if (state.selected.length + lb >= bestSize) {
      counters.boundPrunes += 1;
      return;
    }

    const pick = chooseRowMinCandidatesExact(hg, state.activeRows, state.activeCols, counters);
    if (pick.solved) {
      best = state.selected.slice();
      bestSize = best.length;
      return;
    }
    if (pick.dead || !Array.isArray(pick.candidates) || pick.candidates.length === 0) {
      counters.deadEnds += 1;
      return;
    }

    const candidates = pick.candidates.slice().sort((a, b) => {
      const aCover = (hg.rowsByCol[a] || []).filter((rowIndex) => state.activeRows[rowIndex]).length;
      const bCover = (hg.rowsByCol[b] || []).filter((rowIndex) => state.activeRows[rowIndex]).length;
      if (aCover !== bCover) {
        return bCover - aCover;
      }
      return naturalLabelCompare(hg.colLabels[a], hg.colLabels[b]);
    });

    for (let i = 0; i < candidates.length; i += 1) {
      const colIndex = candidates[i];
      counters.branches += 1;
      const nextState = applyExactChoice(hg, state, colIndex, counters);
      if (!nextState) {
        continue;
      }
      recurse(nextState);
    }
  }

  recurse({
    activeRows: new Array(hg.rowCount).fill(true),
    activeCols: new Array(hg.colCount).fill(true),
    selected: []
  });

  return {
    method: "dlx",
    runtimeMs: Math.max(0, nowMs() - started),
    found: Array.isArray(best),
    solution: Array.isArray(best) ? best : [],
    counters
  };
}

function propagateForcedExact(hg, state, counters) {
  let changed = true;
  let current = {
    activeRows: state.activeRows.slice(),
    activeCols: state.activeCols.slice(),
    selected: state.selected.slice()
  };

  while (changed) {
    changed = false;
    for (let rowIndex = 0; rowIndex < current.activeRows.length; rowIndex += 1) {
      if (!current.activeRows[rowIndex]) {
        continue;
      }
      const candidates = rowCandidatesExact(hg, rowIndex, current.activeCols, counters);
      if (candidates.length === 0) {
        return {
          ok: false,
          state: current
        };
      }
      if (candidates.length === 1) {
        const nextState = applyExactChoice(hg, current, candidates[0], counters);
        if (!nextState) {
          return {
            ok: false,
            state: current
          };
        }
        current = nextState;
        changed = true;
        if (counters) {
          counters.forcedSelections += 1;
        }
        break;
      }
    }
  }

  return {
    ok: true,
    state: current
  };
}

function runBacktrackingExact(hg) {
  const started = nowMs();
  const counters = {
    nodesVisited: 0,
    branches: 0,
    deadEnds: 0,
    boundPrunes: 0,
    candidateChecks: 0,
    boundChecks: 0,
    choiceApplications: 0,
    rowsCovered: 0,
    columnsDisabled: 0,
    conflictMarks: 0,
    forcedSelections: 0
  };

  if (hg.rowCount === 0) {
    return {
      method: "backtracking-exact",
      runtimeMs: Math.max(0, nowMs() - started),
      found: true,
      solution: [],
      counters
    };
  }

  let best = null;
  let bestSize = Number.POSITIVE_INFINITY;

  function recurse(state) {
    counters.nodesVisited += 1;

    const propagated = propagateForcedExact(hg, state, counters);
    if (!propagated.ok) {
      counters.deadEnds += 1;
      return;
    }

    const current = propagated.state;
    if (current.selected.length >= bestSize) {
      counters.boundPrunes += 1;
      return;
    }

    const lb = exactLowerBound(hg, current.activeRows, current.activeCols, counters);
    if (!Number.isFinite(lb)) {
      counters.deadEnds += 1;
      return;
    }
    if (current.selected.length + lb >= bestSize) {
      counters.boundPrunes += 1;
      return;
    }

    const pick = chooseRowMinCandidatesExact(hg, current.activeRows, current.activeCols, counters);
    if (pick.solved) {
      best = current.selected.slice();
      bestSize = best.length;
      return;
    }
    if (pick.dead || !Array.isArray(pick.candidates) || pick.candidates.length === 0) {
      counters.deadEnds += 1;
      return;
    }

    const candidates = pick.candidates.slice().sort((a, b) => {
      const aCover = (hg.rowsByCol[a] || []).filter((rowIndex) => current.activeRows[rowIndex]).length;
      const bCover = (hg.rowsByCol[b] || []).filter((rowIndex) => current.activeRows[rowIndex]).length;
      if (aCover !== bCover) {
        return bCover - aCover;
      }
      return naturalLabelCompare(hg.colLabels[a], hg.colLabels[b]);
    });

    for (let i = 0; i < candidates.length; i += 1) {
      const colIndex = candidates[i];
      counters.branches += 1;
      const nextState = applyExactChoice(hg, current, colIndex, counters);
      if (!nextState) {
        continue;
      }
      recurse(nextState);
    }
  }

  recurse({
    activeRows: new Array(hg.rowCount).fill(true),
    activeCols: new Array(hg.colCount).fill(true),
    selected: []
  });

  return {
    method: "backtracking-exact",
    runtimeMs: Math.max(0, nowMs() - started),
    found: Array.isArray(best),
    solution: Array.isArray(best) ? best : [],
    counters
  };
}

function runXtrGreedyExact(hg) {
  const started = nowMs();
  const counters = {
    iterations: 0,
    forcedSelections: 0,
    candidateChecks: 0,
    choiceApplications: 0,
    rowsCovered: 0,
    columnsDisabled: 0,
    conflictMarks: 0,
    deadEnds: 0
  };

  let state = {
    activeRows: new Array(hg.rowCount).fill(true),
    activeCols: new Array(hg.colCount).fill(true),
    selected: []
  };

  if (hg.rowCount === 0) {
    return {
      method: "xtr",
      runtimeMs: Math.max(0, nowMs() - started),
      found: true,
      solution: [],
      counters
    };
  }

  while (true) {
    counters.iterations += 1;
    const activeRowCount = countActiveRows(state.activeRows);
    if (activeRowCount === 0) {
      return {
        method: "xtr",
        runtimeMs: Math.max(0, nowMs() - started),
        found: true,
        solution: state.selected.slice(),
        counters
      };
    }

    const propagated = propagateForcedExact(hg, state, counters);
    if (!propagated.ok) {
      counters.deadEnds += 1;
      return {
        method: "xtr",
        runtimeMs: Math.max(0, nowMs() - started),
        found: false,
        solution: [],
        counters
      };
    }
    if (propagated.state.selected.length !== state.selected.length) {
      counters.forcedSelections += propagated.state.selected.length - state.selected.length;
    }
    state = propagated.state;

    const afterPropRows = countActiveRows(state.activeRows);
    if (afterPropRows === 0) {
      return {
        method: "xtr",
        runtimeMs: Math.max(0, nowMs() - started),
        found: true,
        solution: state.selected.slice(),
        counters
      };
    }

    const pick = chooseRowMinCandidatesExact(hg, state.activeRows, state.activeCols, counters);
    if (pick.solved) {
      return {
        method: "xtr",
        runtimeMs: Math.max(0, nowMs() - started),
        found: true,
        solution: state.selected.slice(),
        counters
      };
    }
    if (pick.dead || !Array.isArray(pick.candidates) || pick.candidates.length === 0) {
      counters.deadEnds += 1;
      return {
        method: "xtr",
        runtimeMs: Math.max(0, nowMs() - started),
        found: false,
        solution: [],
        counters
      };
    }

    let bestCol = pick.candidates[0];
    let bestCover = -1;
    for (let i = 0; i < pick.candidates.length; i += 1) {
      const candidate = pick.candidates[i];
      const cover = (hg.rowsByCol[candidate] || []).filter((rowIndex) => state.activeRows[rowIndex]).length;
      if (cover > bestCover) {
        bestCover = cover;
        bestCol = candidate;
        continue;
      }
      if (cover === bestCover && naturalLabelCompare(hg.colLabels[candidate], hg.colLabels[bestCol]) < 0) {
        bestCol = candidate;
      }
    }

    const nextState = applyExactChoice(hg, state, bestCol, counters);
    if (!nextState) {
      counters.deadEnds += 1;
      return {
        method: "xtr",
        runtimeMs: Math.max(0, nowMs() - started),
        found: false,
        solution: [],
        counters
      };
    }
    state = nextState;
  }
}

function rowCandidatesRegular(hg, rowIndex, selectedSet, counters) {
  const edge = hg.edges[rowIndex] || [];
  const out = [];
  for (let i = 0; i < edge.length; i += 1) {
    const colIndex = edge[i];
    if (counters) {
      counters.candidateChecks += 1;
    }
    if (!selectedSet.has(colIndex)) {
      out.push(colIndex);
    }
  }
  return out;
}

function chooseRowMinCandidatesRegular(hg, activeRows, selectedSet, counters) {
  let bestRow = -1;
  let bestCandidates = null;

  for (let rowIndex = 0; rowIndex < activeRows.length; rowIndex += 1) {
    if (!activeRows[rowIndex]) {
      continue;
    }
    const candidates = rowCandidatesRegular(hg, rowIndex, selectedSet, counters);
    if (candidates.length === 0) {
      return {
        solved: false,
        dead: true,
        rowIndex,
        candidates: []
      };
    }
    if (bestCandidates === null || candidates.length < bestCandidates.length) {
      bestRow = rowIndex;
      bestCandidates = candidates;
      if (bestCandidates.length <= 1) {
        break;
      }
    }
  }

  if (bestRow < 0) {
    return {
      solved: true,
      dead: false,
      rowIndex: -1,
      candidates: []
    };
  }

  return {
    solved: false,
    dead: false,
    rowIndex: bestRow,
    candidates: bestCandidates || []
  };
}

function regularLowerBound(hg, activeRows, selectedSet, counters) {
  const uncovered = countTrue(activeRows);
  if (uncovered <= 0) {
    return 0;
  }

  let maxCover = 0;
  for (let colIndex = 0; colIndex < hg.colCount; colIndex += 1) {
    if (selectedSet.has(colIndex)) {
      continue;
    }
    let cover = 0;
    const rows = hg.rowsByCol[colIndex] || [];
    for (let i = 0; i < rows.length; i += 1) {
      if (activeRows[rows[i]]) {
        cover += 1;
      }
      if (counters) {
        counters.boundChecks += 1;
      }
    }
    if (cover > maxCover) {
      maxCover = cover;
    }
  }

  if (maxCover <= 0) {
    return Number.POSITIVE_INFINITY;
  }
  return Math.ceil(uncovered / maxCover);
}

function applyRegularChoice(hg, state, colIndex, counters) {
  if (state.selectedSet.has(colIndex)) {
    return null;
  }

  const nextActiveRows = state.activeRows.slice();
  const rows = hg.rowsByCol[colIndex] || [];
  let coveredNow = 0;
  for (let i = 0; i < rows.length; i += 1) {
    if (nextActiveRows[rows[i]]) {
      nextActiveRows[rows[i]] = false;
      coveredNow += 1;
    }
  }

  const nextSelected = state.selected.slice();
  nextSelected.push(colIndex);
  const nextSelectedSet = new Set(state.selectedSet);
  nextSelectedSet.add(colIndex);

  if (counters) {
    counters.choiceApplications += 1;
    counters.rowsCovered += coveredNow;
  }

  return {
    activeRows: nextActiveRows,
    selected: nextSelected,
    selectedSet: nextSelectedSet
  };
}

function runBacktrackingRegular(hg) {
  const started = nowMs();
  const counters = {
    nodesVisited: 0,
    branches: 0,
    deadEnds: 0,
    boundPrunes: 0,
    candidateChecks: 0,
    boundChecks: 0,
    choiceApplications: 0,
    rowsCovered: 0
  };

  if (hg.rowCount === 0) {
    return {
      method: "backtracking-regular",
      runtimeMs: Math.max(0, nowMs() - started),
      found: true,
      solution: [],
      counters
    };
  }

  let best = null;
  let bestSize = Number.POSITIVE_INFINITY;

  function recurse(state) {
    counters.nodesVisited += 1;

    if (state.selected.length >= bestSize) {
      counters.boundPrunes += 1;
      return;
    }

    const lb = regularLowerBound(hg, state.activeRows, state.selectedSet, counters);
    if (!Number.isFinite(lb)) {
      counters.deadEnds += 1;
      return;
    }
    if (state.selected.length + lb >= bestSize) {
      counters.boundPrunes += 1;
      return;
    }

    const pick = chooseRowMinCandidatesRegular(hg, state.activeRows, state.selectedSet, counters);
    if (pick.solved) {
      best = state.selected.slice();
      bestSize = best.length;
      return;
    }
    if (pick.dead || !Array.isArray(pick.candidates) || pick.candidates.length === 0) {
      counters.deadEnds += 1;
      return;
    }

    const candidates = pick.candidates.slice().sort((a, b) => {
      const aCover = (hg.rowsByCol[a] || []).filter((rowIndex) => state.activeRows[rowIndex]).length;
      const bCover = (hg.rowsByCol[b] || []).filter((rowIndex) => state.activeRows[rowIndex]).length;
      if (aCover !== bCover) {
        return bCover - aCover;
      }
      return naturalLabelCompare(hg.colLabels[a], hg.colLabels[b]);
    });

    for (let i = 0; i < candidates.length; i += 1) {
      const colIndex = candidates[i];
      counters.branches += 1;
      const nextState = applyRegularChoice(hg, state, colIndex, counters);
      if (!nextState) {
        continue;
      }
      recurse(nextState);
    }
  }

  recurse({
    activeRows: new Array(hg.rowCount).fill(true),
    selected: [],
    selectedSet: new Set()
  });

  return {
    method: "backtracking-regular",
    runtimeMs: Math.max(0, nowMs() - started),
    found: Array.isArray(best),
    solution: Array.isArray(best) ? best : [],
    counters
  };
}

function runGreedyRegular(hg) {
  const started = nowMs();
  const counters = {
    iterations: 0,
    essentialSelections: 0,
    degreeSelections: 0,
    candidateChecks: 0,
    rowsCovered: 0,
    deadEnds: 0
  };

  const activeRows = new Array(hg.rowCount).fill(true);
  const selectedSet = new Set();
  const selected = [];

  if (hg.rowCount === 0) {
    return {
      method: "greedy",
      runtimeMs: Math.max(0, nowMs() - started),
      found: true,
      solution: [],
      counters
    };
  }

  function selectVertex(colIndex) {
    if (selectedSet.has(colIndex)) {
      return;
    }
    selectedSet.add(colIndex);
    selected.push(colIndex);
    const rows = hg.rowsByCol[colIndex] || [];
    for (let i = 0; i < rows.length; i += 1) {
      if (activeRows[rows[i]]) {
        activeRows[rows[i]] = false;
        counters.rowsCovered += 1;
      }
    }
  }

  while (countTrue(activeRows) > 0) {
    counters.iterations += 1;

    let essentialCandidate = -1;
    let deadEdgeFound = false;

    for (let rowIndex = 0; rowIndex < activeRows.length; rowIndex += 1) {
      if (!activeRows[rowIndex]) {
        continue;
      }
      const candidates = rowCandidatesRegular(hg, rowIndex, selectedSet, counters);
      if (candidates.length === 0) {
        deadEdgeFound = true;
        break;
      }
      if (candidates.length === 1) {
        essentialCandidate = candidates[0];
        break;
      }
    }

    if (deadEdgeFound) {
      counters.deadEnds += 1;
      return {
        method: "greedy",
        runtimeMs: Math.max(0, nowMs() - started),
        found: false,
        solution: [],
        counters
      };
    }

    if (essentialCandidate >= 0) {
      counters.essentialSelections += 1;
      selectVertex(essentialCandidate);
      continue;
    }

    let bestCol = -1;
    let bestDegree = -1;
    for (let colIndex = 0; colIndex < hg.colCount; colIndex += 1) {
      if (selectedSet.has(colIndex)) {
        continue;
      }
      let degree = 0;
      const rows = hg.rowsByCol[colIndex] || [];
      for (let i = 0; i < rows.length; i += 1) {
        if (activeRows[rows[i]]) {
          degree += 1;
        }
      }
      if (degree > bestDegree) {
        bestDegree = degree;
        bestCol = colIndex;
        continue;
      }
      if (degree === bestDegree && bestCol >= 0) {
        if (naturalLabelCompare(hg.colLabels[colIndex], hg.colLabels[bestCol]) < 0) {
          bestCol = colIndex;
        }
      }
    }

    if (bestCol < 0 || bestDegree <= 0) {
      counters.deadEnds += 1;
      return {
        method: "greedy",
        runtimeMs: Math.max(0, nowMs() - started),
        found: false,
        solution: [],
        counters
      };
    }

    counters.degreeSelections += 1;
    selectVertex(bestCol);
  }

  return {
    method: "greedy",
    runtimeMs: Math.max(0, nowMs() - started),
    found: true,
    solution: selected,
    counters
  };
}

function wrapMethodResult(hg, raw, mode) {
  const safe = raw || {};
  const indices = Array.isArray(safe.solution) ? sortIndicesByLabels(safe.solution, hg.colLabels) : [];
  const evalData = evaluateSolution(indices, hg.edges);

  return {
    method: String(safe.method || mode || "unknown"),
    runtimeMs: Number(safe.runtimeMs || 0),
    found: Boolean(safe.found),
    mode: mode || "regular",
    solutionIndices: indices,
    solutionLabels: indicesToLabels(indices, hg.colLabels),
    size: indices.length,
    coversAll: evalData.coversAll,
    exact: evalData.exact,
    coveredEdges: evalData.coveredEdges,
    totalEdges: evalData.totalEdges,
    uncoveredEdges: evalData.uncovered,
    overcoveredEdges: evalData.overcovered,
    counters: safe.counters || {}
  };
}

function preferBetterSolution(a, b) {
  if (!a) {
    return b || null;
  }
  if (!b) {
    return a;
  }
  if (a.size !== b.size) {
    return a.size < b.size ? a : b;
  }
  if (a.runtimeMs !== b.runtimeMs) {
    return a.runtimeMs < b.runtimeMs ? a : b;
  }
  return naturalLabelCompare(a.method, b.method) <= 0 ? a : b;
}

function summarizeAndSelect(hg, strategy, isXtInput, results) {
  const executed = Object.keys(results);
  let bestExact = null;
  let bestRegular = null;

  executed.forEach((name) => {
    const item = results[name];
    if (!item || !item.found) {
      return;
    }
    if (item.coversAll && item.exact) {
      bestExact = preferBetterSolution(bestExact, item);
    }
    if (item.coversAll) {
      bestRegular = preferBetterSolution(bestRegular, item);
    }
  });

  let recommended = null;
  let reason = "";

  if (bestExact) {
    recommended = {
      ...bestExact,
      type: "exact"
    };
    if (isXtInput) {
      reason = workerT("core.transversal.recommendExactXt");
    } else {
      reason = workerT("core.transversal.recommendExactNonXt");
    }
  } else if (bestRegular) {
    recommended = {
      ...bestRegular,
      type: "regular"
    };
    reason = workerT("core.transversal.recommendRegular");
  } else {
    recommended = {
      method: "none",
      found: false,
      type: "none",
      size: 0,
      solutionLabels: [],
      solutionIndices: [],
      coversAll: false,
      exact: false,
      runtimeMs: 0
    };
    reason = workerT("core.transversal.noCover");
  }

  return {
    strategy,
    isXtInput,
    executed,
    results,
    bestExact,
    bestRegular,
    recommended,
    recommendationReason: reason,
    rowCount: hg.rowCount,
    colCount: hg.colCount
  };
}

function postProgress(jobId, phase, message) {
  postMessage({
    type: "progress",
    jobId,
    phase,
    message
  });
}

function runTransversalPipeline(payload, jobId) {
  const started = nowMs();
  const strategy = normalizeStrategy(payload.strategy);
  const isXtInput = payload && payload.xtrec && typeof payload.xtrec.isXt === "boolean"
    ? Boolean(payload.xtrec.isXt)
    : null;

  const hg = buildHypergraph(payload || {});
  if (hg.colCount === 0 && hg.rowCount > 0) {
    throw new Error(workerT("core.transversal.noVertices"));
  }
  for (let rowIndex = 0; rowIndex < hg.edges.length; rowIndex += 1) {
    if ((hg.edges[rowIndex] || []).length === 0) {
      throw new Error(workerT("core.transversal.emptyEdge", { edge: hg.rowLabels[rowIndex] }));
    }
  }

  const results = {};
  const runExactXtr = strategy === "all" || strategy === "xtr" || (isXtInput === true && strategy === "greedy");
  const runExactDlx = strategy === "all" || strategy === "dlx";
  const runExactBacktracking = strategy === "all" || strategy === "backtracking";

  if (runExactXtr) {
    postProgress(jobId, "xtr", workerT("core.transversal.startXtr"));
    const xtrRaw = runXtrGreedyExact(hg);
    results.xtr = wrapMethodResult(hg, xtrRaw, "exact");
    postProgress(
      jobId,
      "xtr",
      results.xtr.found && results.xtr.exact
        ? workerT("core.transversal.exactFound", { method: "XTR", size: results.xtr.size })
        : workerT("core.transversal.exactNotFound", { method: "XTR" })
    );
  }

  if (runExactDlx) {
    postProgress(jobId, "dlx", workerT("core.transversal.startDlx"));
    const dlxRaw = runDlxLikeExact(hg);
    results.dlx = wrapMethodResult(hg, dlxRaw, "exact");
    postProgress(
      jobId,
      "dlx",
      results.dlx.found && results.dlx.exact
        ? workerT("core.transversal.exactFound", { method: "DLX", size: results.dlx.size })
        : workerT("core.transversal.exactNotFound", { method: "DLX" })
    );
  }

  if (runExactBacktracking) {
    postProgress(jobId, "backtracking", workerT("core.transversal.startExactBacktracking"));
    const exactRaw = runBacktrackingExact(hg);
    results.backtrackingExact = wrapMethodResult(hg, exactRaw, "exact");
    postProgress(
      jobId,
      "backtracking",
      results.backtrackingExact.found && results.backtrackingExact.exact
        ? workerT("core.transversal.exactFound", { method: "Backtracking exact", size: results.backtrackingExact.size })
        : workerT("core.transversal.exactNotFound", { method: "Backtracking exact" })
    );
  }

  const hasExact = Object.values(results).some((item) => item && item.found && item.coversAll && item.exact);
  const runRegularBacktracking = strategy === "all"
    || strategy === "backtracking"
    || (strategy === "dlx" && !hasExact);
  const runRegularGreedy = strategy === "all"
    || strategy === "greedy"
    || (strategy === "xtr" && !hasExact);

  if (runRegularBacktracking) {
    postProgress(jobId, "backtracking", workerT("core.transversal.startRegularBacktracking"));
    const regularRaw = runBacktrackingRegular(hg);
    results.backtrackingRegular = wrapMethodResult(hg, regularRaw, "regular");
    postProgress(
      jobId,
      "backtracking",
      results.backtrackingRegular.found && results.backtrackingRegular.coversAll
        ? workerT("core.transversal.coverFound", { method: "Backtracking regular", size: results.backtrackingRegular.size })
        : workerT("core.transversal.coverNotFound", { method: "Backtracking regular" })
    );
  }

  if (runRegularGreedy) {
    postProgress(jobId, "greedy", workerT("core.transversal.startGreedy"));
    const greedyRaw = runGreedyRegular(hg);
    results.greedy = wrapMethodResult(hg, greedyRaw, "regular");
    postProgress(
      jobId,
      "greedy",
      results.greedy.found && results.greedy.coversAll
        ? workerT("core.transversal.coverFound", { method: "Greedy", size: results.greedy.size })
        : workerT("core.transversal.coverNotFound", { method: "Greedy" })
    );
  }

  const summary = summarizeAndSelect(hg, strategy, isXtInput, results);
  summary.runtimeMs = Math.max(0, nowMs() - started);
  summary.rowLabels = hg.rowLabels.slice();
  summary.colLabels = hg.colLabels.slice();

  return summary;
}

function handleCompute(jobId, payload) {
  try {
    const result = transversalCore && typeof transversalCore.computeTransversals === "function"
      ? transversalCore.computeTransversals(payload || {}, {
        onProgress(progress) {
          const safe = progress || {};
          postProgress(jobId, safe.phase || "compute", safe.message || "");
        }
      })
      : runTransversalPipeline(payload || {}, jobId);
    postMessage({
      type: "result",
      jobId,
      payload: result
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : workerT("worker.transversal.unknown");
    postMessage({
      type: "error",
      jobId,
      message
    });
  }
}

self.onmessage = (event) => {
  const data = event.data || {};
  if (self.PoohWorkerI18n) {
    self.PoohWorkerI18n.configure(data);
  }
  if (data.type !== "compute") {
    return;
  }
  const jobId = asInt(data.jobId || 0);
  if (!jobId) {
    return;
  }
  handleCompute(jobId, data.payload || {});
};
