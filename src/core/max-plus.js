(function(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("./i18n"));
  } else {
    root.PoohMaxPlusCore = factory(root.PoohI18n);
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function(i18n) {
  "use strict";

  function tr(key, params) {
    return i18n && typeof i18n.t === "function" ? i18n.t(key, params) : String(key || "");
  }

  function clamp01(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return 0;
    }
    return Math.max(0, Math.min(1, numeric));
  }

  function finiteOrNull(value) {
    if (value === null || value === undefined || value === "") {
      return null;
    }
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }

  function naturalLabelCompare(a, b) {
    return String(a ?? "").localeCompare(String(b ?? ""), undefined, { numeric: true, sensitivity: "base" });
  }

  function toSortedStringArray(values) {
    return Array.isArray(values)
      ? values.map((value) => String(value)).filter(Boolean).sort(naturalLabelCompare)
      : [];
  }

  function toStringArray(values) {
    return Array.isArray(values)
      ? values.map((value) => String(value)).filter(Boolean)
      : [];
  }

  function createFuzzyNullMatrix(size) {
    const n = Math.max(0, parseInt(String(size || 0), 10) || 0);
    return Array.from({ length: n }, () => Array.from({ length: n }, () => null));
  }

  function fuzzyMaxPlusMultiply(matrix, vector) {
    const safeMatrix = Array.isArray(matrix) ? matrix : [];
    const n = safeMatrix.length;
    const safeVector = Array.isArray(vector) ? vector : [];
    const next = new Array(n).fill(0);
    for (let i = 0; i < n; i += 1) {
      let best = Number.NEGATIVE_INFINITY;
      const row = Array.isArray(safeMatrix[i]) ? safeMatrix[i] : [];
      for (let j = 0; j < n; j += 1) {
        const weight = row[j];
        if (weight === null || weight === undefined) {
          continue;
        }
        const candidate = Number(weight) + Number(safeVector[j] || 0);
        if (candidate > best) {
          best = candidate;
        }
      }
      next[i] = Number.isFinite(best) ? best : Number(safeVector[i] || 0);
    }
    return next;
  }

  function fuzzyMatrixAdjacency(matrix) {
    const safeMatrix = Array.isArray(matrix) ? matrix : [];
    const n = safeMatrix.length;
    const adj = Array.from({ length: n }, () => []);
    const rev = Array.from({ length: n }, () => []);
    for (let to = 0; to < n; to += 1) {
      const row = Array.isArray(safeMatrix[to]) ? safeMatrix[to] : [];
      for (let from = 0; from < n; from += 1) {
        const weight = row[from];
        if (weight === null || weight === undefined) {
          continue;
        }
        adj[from].push(to);
        rev[to].push(from);
      }
    }
    return { adj, rev };
  }

  function computeFuzzySccCount(matrix) {
    const safeMatrix = Array.isArray(matrix) ? matrix : [];
    const n = safeMatrix.length;
    if (n === 0) {
      return 0;
    }
    const graph = fuzzyMatrixAdjacency(safeMatrix);
    const visited = new Array(n).fill(false);
    const order = [];

    for (let start = 0; start < n; start += 1) {
      if (visited[start]) {
        continue;
      }
      const stack = [{ node: start, exit: false }];
      while (stack.length > 0) {
        const item = stack.pop();
        if (item.exit) {
          order.push(item.node);
          continue;
        }
        if (visited[item.node]) {
          continue;
        }
        visited[item.node] = true;
        stack.push({ node: item.node, exit: true });
        graph.adj[item.node].forEach((next) => {
          if (!visited[next]) {
            stack.push({ node: next, exit: false });
          }
        });
      }
    }

    const assigned = new Array(n).fill(false);
    let components = 0;
    for (let i = order.length - 1; i >= 0; i -= 1) {
      const start = order[i];
      if (assigned[start]) {
        continue;
      }
      components += 1;
      const stack = [start];
      assigned[start] = true;
      while (stack.length > 0) {
        const node = stack.pop();
        graph.rev[node].forEach((next) => {
          if (!assigned[next]) {
            assigned[next] = true;
            stack.push(next);
          }
        });
      }
    }
    return components;
  }

  function computeFuzzyMaxCycleMean(matrix) {
    const safeMatrix = Array.isArray(matrix) ? matrix : [];
    const n = safeMatrix.length;
    if (n === 0) {
      return null;
    }
    const inEdges = Array.from({ length: n }, () => []);
    for (let to = 0; to < n; to += 1) {
      const row = Array.isArray(safeMatrix[to]) ? safeMatrix[to] : [];
      for (let from = 0; from < n; from += 1) {
        const weight = row[from];
        if (weight === null || weight === undefined) {
          continue;
        }
        inEdges[to].push({ from, weight: Number(weight) });
      }
    }

    const dp = Array.from({ length: n + 1 }, () => Array.from({ length: n }, () => Number.NEGATIVE_INFINITY));
    for (let v = 0; v < n; v += 1) {
      dp[0][v] = 0;
    }

    for (let k = 1; k <= n; k += 1) {
      for (let v = 0; v < n; v += 1) {
        let best = Number.NEGATIVE_INFINITY;
        inEdges[v].forEach((edge) => {
          const previous = dp[k - 1][edge.from];
          if (!Number.isFinite(previous)) {
            return;
          }
          best = Math.max(best, previous + edge.weight);
        });
        dp[k][v] = best;
      }
    }

    let lambda = Number.NEGATIVE_INFINITY;
    for (let v = 0; v < n; v += 1) {
      if (!Number.isFinite(dp[n][v])) {
        continue;
      }
      let localMin = Number.POSITIVE_INFINITY;
      for (let k = 0; k < n; k += 1) {
        if (!Number.isFinite(dp[k][v])) {
          continue;
        }
        const ratio = (dp[n][v] - dp[k][v]) / (n - k);
        if (ratio < localMin) {
          localMin = ratio;
        }
      }
      if (Number.isFinite(localMin) && localMin > lambda) {
        lambda = localMin;
      }
    }
    return Number.isFinite(lambda) ? lambda : null;
  }

  function canonicalDirectedCycleKey(cycleNodes) {
    const nodes = Array.isArray(cycleNodes) ? cycleNodes.map(String) : [];
    if (nodes.length === 0) {
      return "";
    }
    let best = null;
    for (let i = 0; i < nodes.length; i += 1) {
      const rotated = nodes.slice(i).concat(nodes.slice(0, i)).join(">");
      if (best === null || rotated < best) {
        best = rotated;
      }
    }
    return best || "";
  }

  function computeFuzzyCriticalCycle(matrix, transitions, lambdaHint) {
    const labels = Array.isArray(transitions) ? transitions.map(String) : [];
    const safeMatrix = Array.isArray(matrix) ? matrix : [];
    const n = Math.min(labels.length, safeMatrix.length);
    if (n === 0) {
      return null;
    }
    const adj = Array.from({ length: n }, () => []);
    for (let to = 0; to < n; to += 1) {
      const row = Array.isArray(safeMatrix[to]) ? safeMatrix[to] : [];
      for (let from = 0; from < n; from += 1) {
        const weight = row[from];
        if (weight === null || weight === undefined || !Number.isFinite(Number(weight))) {
          continue;
        }
        adj[from].push({ to, weight: Number(weight) });
      }
    }

    let best = null;
    const seenCycles = new Set();
    let visitedCycles = 0;
    let truncated = false;
    const maxCycles = 20000;

    function considerCycle(pathNodes, pathEdges) {
      if (pathEdges.length === 0) {
        return;
      }
      const cycleLabels = pathNodes.map((index) => labels[index]);
      const key = canonicalDirectedCycleKey(cycleLabels);
      if (!key || seenCycles.has(key)) {
        return;
      }
      seenCycles.add(key);
      visitedCycles += 1;
      const weight = pathEdges.reduce((sum, edge) => sum + edge.weight, 0);
      const mean = weight / pathEdges.length;
      if (!best || mean > best.mean + 0.000001 || (Math.abs(mean - best.mean) <= 0.000001 && pathEdges.length < best.length)) {
        best = {
          mean,
          weight,
          length: pathEdges.length,
          transitions: cycleLabels.concat(cycleLabels[0]),
          edgeKeys: pathEdges.map((edge) => `${labels[edge.from]}->${labels[edge.to]}`),
          edges: pathEdges.map((edge) => ({
            from: labels[edge.from],
            to: labels[edge.to],
            weight: edge.weight
          }))
        };
      }
      if (visitedCycles >= maxCycles) {
        truncated = true;
      }
    }

    for (let start = 0; start < n && !truncated; start += 1) {
      const visited = new Set([start]);
      function dfs(current, pathNodes, pathEdges) {
        if (truncated) {
          return;
        }
        adj[current].forEach((edge) => {
          if (truncated) {
            return;
          }
          const nextEdges = pathEdges.concat({ from: current, to: edge.to, weight: edge.weight });
          if (edge.to === start) {
            considerCycle(pathNodes.slice(), nextEdges);
            return;
          }
          if (visited.has(edge.to) || pathNodes.length >= n) {
            return;
          }
          visited.add(edge.to);
          dfs(edge.to, pathNodes.concat(edge.to), nextEdges);
          visited.delete(edge.to);
        });
      }
      dfs(start, [start], []);
    }

    if (!best) {
      return null;
    }
    const lambdaValue = finiteOrNull(lambdaHint);
    return {
      lambda: lambdaValue !== null ? lambdaValue : best.mean,
      mean: best.mean,
      weight: best.weight,
      length: best.length,
      transitions: best.transitions,
      edgeKeys: best.edgeKeys,
      edges: best.edges,
      search: {
        cyclesChecked: visitedCycles,
        truncated
      }
    };
  }

  function getFuzzyPlaceDelay(placeId, options) {
    const safeOptions = options && typeof options === "object" ? options : {};
    if (safeOptions.delayMap && Object.prototype.hasOwnProperty.call(safeOptions.delayMap, placeId)) {
      const mapped = Number(safeOptions.delayMap[placeId]);
      return Number.isFinite(mapped) ? mapped : 0;
    }
    return Number.isFinite(Number(safeOptions.defaultDelay)) ? Number(safeOptions.defaultDelay) : 1;
  }

  function buildStandaloneMaxPlusForAutomata(entry, sharedTransitionSet, options, arcs) {
    const safeEntry = entry && typeof entry === "object" ? entry : {};
    const safeOptions = options && typeof options === "object" ? options : {};
    const safeArcs = Array.isArray(arcs) ? arcs : [];
    const sharedTransitions = sharedTransitionSet && typeof sharedTransitionSet.has === "function"
      ? sharedTransitionSet
      : new Set(toSortedStringArray(sharedTransitionSet));
    const transitions = toSortedStringArray(safeEntry.transitionIds);
    const indexByTransition = new Map(transitions.map((transitionId, index) => [transitionId, index]));
    const matrix = createFuzzyNullMatrix(transitions.length);
    const edgeRows = [];
    let operations = 0;
    const supportSet = new Set(toSortedStringArray(safeEntry.supportPlaces));

    supportSet.forEach((placeId) => {
      const fromTransitions = safeArcs
        .filter((arc) => String(arc && arc.to) === placeId && indexByTransition.has(String(arc && arc.from)))
        .map((arc) => String(arc.from))
        .sort(naturalLabelCompare);
      const toTransitions = safeArcs
        .filter((arc) => String(arc && arc.from) === placeId && indexByTransition.has(String(arc && arc.to)))
        .map((arc) => String(arc.to))
        .sort(naturalLabelCompare);
      if (fromTransitions.length === 0 || toTransitions.length === 0) {
        return;
      }
      const baseDelay = getFuzzyPlaceDelay(placeId, safeOptions);
      fromTransitions.forEach((fromTransition) => {
        toTransitions.forEach((toTransition) => {
          const fromIdx = indexByTransition.get(fromTransition);
          const toIdx = indexByTransition.get(toTransition);
          if (fromIdx === undefined || toIdx === undefined) {
            return;
          }
          const syncPenalty = Number(safeOptions.syncOverhead || 0) > 0
            && (sharedTransitions.has(fromTransition) || sharedTransitions.has(toTransition))
            ? Number(safeOptions.syncOverhead || 0)
            : 0;
          const weight = baseDelay + syncPenalty;
          const current = matrix[toIdx][fromIdx];
          if (current === null || weight > current) {
            matrix[toIdx][fromIdx] = weight;
          }
          edgeRows.push({ from: fromTransition, to: toTransition, placeId, weight });
          operations += 1;
        });
      });
    });

    const sccCount = computeFuzzySccCount(matrix);
    const lambda = computeFuzzyMaxCycleMean(matrix);
    const throughput = Number.isFinite(lambda) && lambda > 0 ? 1 / lambda : null;
    const criticalCycle = computeFuzzyCriticalCycle(matrix, transitions, lambda);
    const sampleTrajectory = [];
    let x = new Array(transitions.length).fill(0);
    sampleTrajectory.push({ k: 0, values: x.slice() });
    for (let step = 1; step <= 6; step += 1) {
      x = fuzzyMaxPlusMultiply(matrix, x);
      sampleTrajectory.push({ k: step, values: x.slice() });
    }

    return {
      label: String(safeEntry.label || ""),
      transitions,
      transitionCount: transitions.length,
      edgeCount: edgeRows.length,
      matrix,
      edgeRows,
      stronglyConnected: sccCount === 1 && transitions.length > 0,
      lambda,
      throughput,
      criticalCycle,
      sampleTrajectory,
      operations
    };
  }

  function getEntryMaxPlusSupportPlaces(entry) {
    if (entry && Object.prototype.hasOwnProperty.call(entry, "maxPlusSupportPlaces")) {
      return toSortedStringArray(entry.maxPlusSupportPlaces);
    }
    return toSortedStringArray(entry && entry.supportPlaces);
  }

  function compactTransversalMaxPlus(model) {
    if (!model) {
      return null;
    }
    return {
      available: Boolean(model.available),
      complete: Boolean(model.complete),
      lambda: finiteOrNull(model.lambda),
      throughput: finiteOrNull(model.throughput),
      transitionCount: Number(model.transitionCount || 0),
      edgeCount: Number(model.edgeCount || 0),
      supportPlaceCount: Number(model.supportPlaceCount || 0),
      selectedLabels: Array.isArray(model.selectedLabels) ? model.selectedLabels.slice() : [],
      mapping: model.mapping ? {
        mappedCount: Number(model.mapping.mappedCount || 0),
        unmappedCount: Number(model.mapping.unmappedCount || 0),
        coverage: Number(model.mapping.coverage || 0),
        unmappedLabels: Array.isArray(model.mapping.unmappedLabels) ? model.mapping.unmappedLabels.slice() : []
      } : null
    };
  }

  function buildSharedTransitionSetForSubnets(entries) {
    const counts = new Map();
    (Array.isArray(entries) ? entries : []).forEach((entry) => {
      toSortedStringArray(entry && entry.transitionIds).forEach((transitionId) => {
        counts.set(transitionId, (counts.get(transitionId) || 0) + 1);
      });
    });
    const shared = new Set();
    counts.forEach((count, transitionId) => {
      if (count > 1) {
        shared.add(transitionId);
      }
    });
    return shared;
  }

  function buildMaxPlusTransversalModel(selectedLabels, entries, options, label, includeMatrix, arcs) {
    const labels = Array.from(new Set(toSortedStringArray(selectedLabels))).sort(naturalLabelCompare);
    const safeEntries = Array.isArray(entries) ? entries : [];
    const entryByLabel = new Map(safeEntries.map((entry) => [String(entry && entry.label !== undefined ? entry.label : ""), entry]));
    const selectedEntries = [];
    const unmappedLabels = [];

    labels.forEach((selectedLabel) => {
      const entry = entryByLabel.get(selectedLabel);
      if (!entry) {
        unmappedLabels.push(selectedLabel);
        return;
      }
      const supportPlaces = getEntryMaxPlusSupportPlaces(entry);
      const transitionIds = toSortedStringArray(entry.transitionIds);
      const mapped = supportPlaces.length > 0
        && transitionIds.length > 0
        && !(entry.mapping && entry.mapping.mapped === false);
      if (!mapped) {
        unmappedLabels.push(selectedLabel);
      }
      selectedEntries.push({
        label: entry.label,
        supportPlaces,
        transitionIds,
        mapped
      });
    });

    const mappedEntries = selectedEntries.filter((entry) => entry.mapped);
    const supportPlaces = Array.from(new Set(mappedEntries.flatMap((entry) => entry.supportPlaces))).sort(naturalLabelCompare);
    const transitionIds = Array.from(new Set(mappedEntries.flatMap((entry) => entry.transitionIds))).sort(naturalLabelCompare);
    const sharedTransitionSet = buildSharedTransitionSetForSubnets(mappedEntries);
    const mapping = {
      mappedCount: mappedEntries.length,
      unmappedCount: unmappedLabels.length,
      coverage: labels.length > 0 ? clamp01(mappedEntries.length / labels.length) : 0,
      mappedLabels: mappedEntries.map((entry) => entry.label).sort(naturalLabelCompare),
      unmappedLabels: unmappedLabels.slice().sort(naturalLabelCompare)
    };
    const complete = labels.length > 0 && unmappedLabels.length === 0;
    const available = supportPlaces.length > 0 && transitionIds.length > 0;
    let model = null;
    if (available) {
      model = buildStandaloneMaxPlusForAutomata({
        label: label || "A_T",
        supportPlaces,
        transitionIds
      }, sharedTransitionSet, options, arcs);
    }

    const result = {
      label: label || "A_T",
      selectedLabels: labels,
      available,
      complete,
      partial: available && !complete,
      mapping,
      supportPlaces,
      supportPlaceCount: supportPlaces.length,
      transitions: model ? model.transitions : transitionIds,
      transitionCount: model ? model.transitionCount : transitionIds.length,
      edgeCount: model ? model.edgeCount : 0,
      lambda: model ? finiteOrNull(model.lambda) : null,
      throughput: model ? finiteOrNull(model.throughput) : null,
      stronglyConnected: model ? model.stronglyConnected : false,
      criticalCycle: model ? model.criticalCycle : null,
      operations: model ? model.operations : 0,
      note: complete
        ? tr("core.maxPlus.transversalComplete")
        : tr("core.maxPlus.transversalPartial")
    };

    if (includeMatrix && model) {
      result.matrix = model.matrix;
      result.edgeRows = model.edgeRows;
      result.sampleTrajectory = model.sampleTrajectory;
    }

    return result;
  }

  function computeSubnetCoupling(entries) {
    const safeEntries = Array.isArray(entries) ? entries : [];
    const byLabel = new Map();
    safeEntries.forEach((entry) => {
      byLabel.set(String(entry && entry.label !== undefined ? entry.label : ""), { raw: 0, normalized: 0, sharedWith: [] });
    });
    for (let i = 0; i < safeEntries.length; i += 1) {
      for (let j = i + 1; j < safeEntries.length; j += 1) {
        const a = safeEntries[i] || {};
        const b = safeEntries[j] || {};
        const aLabel = String(a.label !== undefined ? a.label : "");
        const bLabel = String(b.label !== undefined ? b.label : "");
        const aPlaces = toSortedStringArray(a.supportPlaces);
        const bPlaces = toSortedStringArray(b.supportPlaces);
        const aTransitions = toSortedStringArray(a.transitionIds);
        const bTransitions = toSortedStringArray(b.transitionIds);
        const sharedPlaces = aPlaces.filter((placeId) => bPlaces.includes(placeId));
        const sharedTransitions = aTransitions.filter((transitionId) => bTransitions.includes(transitionId));
        const unionSize = new Set([...aPlaces, ...bPlaces, ...aTransitions, ...bTransitions]).size || 1;
        const raw = sharedPlaces.length + sharedTransitions.length;
        const normalized = raw / unionSize;
        if (raw > 0) {
          const aRow = byLabel.get(aLabel);
          const bRow = byLabel.get(bLabel);
          if (aRow) aRow.sharedWith.push({ label: bLabel, raw, normalized });
          if (bRow) bRow.sharedWith.push({ label: aLabel, raw, normalized });
        }
        const aRow = byLabel.get(aLabel);
        const bRow = byLabel.get(bLabel);
        if (aRow) {
          aRow.raw += raw;
          aRow.normalized += normalized;
        }
        if (bRow) {
          bRow.raw += raw;
          bRow.normalized += normalized;
        }
      }
    }
    byLabel.forEach((value) => {
      value.normalized = safeEntries.length > 1 ? value.normalized / (safeEntries.length - 1) : 0;
    });
    return byLabel;
  }

  function relationPairKey(a, b) {
    return [String(a), String(b)].sort(naturalLabelCompare).join("|");
  }

  function relationArrowKey(a, b) {
    return `${String(a)}->${String(b)}`;
  }

  function hasCommonElement(a, b) {
    if (!a || !b) {
      return false;
    }
    for (const value of a) {
      if (b.has(value)) {
        return true;
      }
    }
    return false;
  }

  function normalizePetriWeight(value) {
    return Math.max(1, parseInt(String(value || 1), 10) || 1);
  }

  function buildTransitionRulesFor(nodes, arcs, placeIds) {
    const safeNodes = Array.isArray(nodes) ? nodes : [];
    const safeArcs = Array.isArray(arcs) ? arcs : [];
    const safePlaceIds = toStringArray(placeIds);
    const nodeMap = new Map(safeNodes.map((node) => [String(node && node.id), node || {}]));
    const transitions = safeNodes
      .filter((node) => node && node.type === "transition")
      .slice()
      .sort((a, b) => naturalLabelCompare(a.id, b.id));
    const placeIndex = new Map(safePlaceIds.map((id, index) => [id, index]));

    return transitions.map((transition) => {
      const transitionId = String(transition.id);
      const inputs = safeArcs
        .filter((arc) => String(arc && arc.to) === transitionId)
        .map((arc) => {
          const fromNode = nodeMap.get(String(arc && arc.from));
          return {
            index: fromNode && fromNode.type === "place" ? placeIndex.get(String(fromNode.id)) : undefined,
            weight: normalizePetriWeight(arc && arc.weight)
          };
        })
        .filter((item) => item.index !== undefined);

      const outputs = safeArcs
        .filter((arc) => String(arc && arc.from) === transitionId)
        .map((arc) => {
          const toNode = nodeMap.get(String(arc && arc.to));
          return {
            index: toNode && toNode.type === "place" ? placeIndex.get(String(toNode.id)) : undefined,
            weight: normalizePetriWeight(arc && arc.weight)
          };
        })
        .filter((item) => item.index !== undefined);

      return {
        id: transitionId,
        label: transition.label,
        inputs,
        outputs
      };
    });
  }

  function computeEnabledTransitionsForMarking(marking, transitionRules) {
    const safeMarking = Array.isArray(marking) ? marking : [];
    return (Array.isArray(transitionRules) ? transitionRules : []).filter((transition) =>
      (Array.isArray(transition.inputs) ? transition.inputs : []).every((input) => Number(safeMarking[input.index] || 0) >= Number(input.weight || 1))
    );
  }

  function fireOnMarking(marking, transitionRule) {
    const next = Array.isArray(marking) ? marking.slice() : [];
    const safeRule = transitionRule && typeof transitionRule === "object" ? transitionRule : {};
    (Array.isArray(safeRule.inputs) ? safeRule.inputs : []).forEach((input) => {
      next[input.index] -= Number(input.weight || 1);
    });
    (Array.isArray(safeRule.outputs) ? safeRule.outputs : []).forEach((output) => {
      next[output.index] += Number(output.weight || 1);
    });
    return next;
  }

  function computePetriXtRelations(nodes, arcs, maxStates) {
    const safeNodes = Array.isArray(nodes) ? nodes : [];
    const safeArcs = Array.isArray(arcs) ? arcs : [];
    const places = safeNodes
      .filter((node) => node && node.type === "place")
      .slice()
      .sort((a, b) => naturalLabelCompare(a.id, b.id));
    const transitions = safeNodes
      .filter((node) => node && node.type === "transition")
      .slice()
      .sort((a, b) => naturalLabelCompare(a.id, b.id));
    const transitionIds = transitions.map((transition) => String(transition.id));
    const pre = new Map();
    const post = new Map();
    transitionIds.forEach((transitionId) => {
      pre.set(transitionId, new Set());
      post.set(transitionId, new Set());
    });
    safeArcs.forEach((arc) => {
      const from = String(arc && arc.from);
      const to = String(arc && arc.to);
      if (pre.has(to)) {
        pre.get(to).add(from);
      }
      if (post.has(from)) {
        post.get(from).add(to);
      }
    });

    const conflictPairs = new Set();
    const sequentialPairs = new Set();
    for (let i = 0; i < transitionIds.length; i += 1) {
      for (let j = i + 1; j < transitionIds.length; j += 1) {
        const a = transitionIds[i];
        const b = transitionIds[j];
        if (hasCommonElement(pre.get(a) || new Set(), pre.get(b) || new Set())) {
          conflictPairs.add(relationPairKey(a, b));
        }
      }
    }
    transitionIds.forEach((fromTransition) => {
      transitionIds.forEach((toTransition) => {
        if (fromTransition === toTransition) {
          return;
        }
        if (hasCommonElement(post.get(fromTransition) || new Set(), pre.get(toTransition) || new Set())) {
          sequentialPairs.add(relationArrowKey(fromTransition, toTransition));
        }
      });
    });

    const limit = Math.max(200, parseInt(String(maxStates || 3500), 10) || 3500);
    const placeIds = places.map((place) => String(place.id));
    const transitionRules = buildTransitionRulesFor(safeNodes, safeArcs, placeIds);
    const initial = places.map((place) => Math.max(0, parseInt(String(place.tokens || 0), 10) || 0));
    const queue = [initial];
    const seen = new Map([[initial.join(","), initial]]);
    const coenabledPairs = new Set();
    let truncated = false;

    while (queue.length > 0) {
      const current = queue.shift();
      const enabled = computeEnabledTransitionsForMarking(current, transitionRules);
      for (let i = 0; i < enabled.length; i += 1) {
        for (let j = i + 1; j < enabled.length; j += 1) {
          coenabledPairs.add(relationPairKey(enabled[i].id, enabled[j].id));
        }
      }
      enabled.forEach((rule) => {
        const next = fireOnMarking(current, rule);
        const key = next.join(",");
        if (seen.has(key)) {
          return;
        }
        if (seen.size >= limit) {
          truncated = true;
          return;
        }
        seen.set(key, next);
        queue.push(next);
      });
      if (truncated) {
        break;
      }
    }

    return {
      transitionIds,
      conflictPairs,
      sequentialPairs,
      coenabledPairs,
      stateCount: seen.size,
      truncated,
      statesLimit: limit,
      safe: seen.size > 0 && Array.from(seen.values()).every((marking) => marking.every((tokens) => Number(tokens) <= 1))
    };
  }

  function relationSetHas(source, key) {
    if (!source) {
      return false;
    }
    if (typeof source.has === "function") {
      return source.has(key);
    }
    if (Array.isArray(source)) {
      return source.includes(key);
    }
    return Boolean(source[key]);
  }

  function relationSetSize(source) {
    if (!source) {
      return 0;
    }
    if (typeof source.size === "number") {
      return source.size;
    }
    if (Array.isArray(source)) {
      return source.length;
    }
    return Object.keys(source).filter((key) => source[key]).length;
  }

  function buildBinaryRelationMatrix(labels, predicate) {
    return labels.map((rowLabel) => labels.map((colLabel) => {
      if (rowLabel === colLabel) {
        return 0;
      }
      return predicate(rowLabel, colLabel) ? 1 : 0;
    }));
  }

  function buildPetriXtRelationMatrices(relations) {
    const safeRelations = relations && typeof relations === "object" ? relations : {};
    const transitions = toSortedStringArray(safeRelations.transitionIds);
    const conflict = buildBinaryRelationMatrix(transitions, (a, b) => relationSetHas(safeRelations.conflictPairs, relationPairKey(a, b)));
    const concurrency = buildBinaryRelationMatrix(transitions, (a, b) => relationSetHas(safeRelations.coenabledPairs, relationPairKey(a, b)));
    const sequential = buildBinaryRelationMatrix(transitions, (a, b) => relationSetHas(safeRelations.sequentialPairs, relationArrowKey(a, b)));
    return {
      transitions,
      complete: !safeRelations.truncated,
      safe: Boolean(safeRelations.safe),
      stateCount: Number(safeRelations.stateCount || 0),
      statesLimit: Number(safeRelations.statesLimit || 0),
      counts: {
        conflict: relationSetSize(safeRelations.conflictPairs),
        concurrency: relationSetSize(safeRelations.coenabledPairs),
        sequential: relationSetSize(safeRelations.sequentialPairs)
      },
      sources: {
        conflict: "incidence: shared input place, symmetric C(t_i,t_j)",
        concurrency: "reachability: co-enabled transition pair, symmetric Q(t_i,t_j)",
        sequential: "incidence: post(t_i) intersects pre(t_j), directed S(t_i,t_j)"
      },
      matrices: {
        conflict,
        concurrency,
        sequential
      }
    };
  }

  function buildPetriXtRelationSummary(relations) {
    const safeRelations = relations && typeof relations === "object" ? relations : {};
    return {
      transitions: Array.isArray(safeRelations.transitionIds) ? safeRelations.transitionIds.length : 0,
      states: Number(safeRelations.stateCount || 0),
      statesLimit: Number(safeRelations.statesLimit || 0),
      truncated: Boolean(safeRelations.truncated),
      safe: Boolean(safeRelations.safe),
      conflicts: relationSetSize(safeRelations.conflictPairs),
      sequential: relationSetSize(safeRelations.sequentialPairs),
      concurrent: relationSetSize(safeRelations.coenabledPairs)
    };
  }

  function computeFuzzySubnetMetrics(entries, maxPlusSubnets, relations, sharedTransitionSet) {
    const safeEntries = Array.isArray(entries) ? entries : [];
    const safeMaxPlusSubnets = Array.isArray(maxPlusSubnets) ? maxPlusSubnets : [];
    const safeRelations = relations && typeof relations === "object" ? relations : {};
    const sharedTransitions = sharedTransitionSet && typeof sharedTransitionSet.has === "function"
      ? sharedTransitionSet
      : new Set(toSortedStringArray(sharedTransitionSet));
    const coupling = computeSubnetCoupling(safeEntries);
    const maxPlusByLabel = new Map(safeMaxPlusSubnets.map((item) => [String(item && item.label !== undefined ? item.label : ""), item || {}]));
    const metrics = new Map();
    safeEntries.forEach((entry) => {
      const label = String(entry && entry.label !== undefined ? entry.label : "");
      const transitions = toSortedStringArray(entry && entry.transitionIds);
      const pairTotal = transitions.length > 1 ? (transitions.length * (transitions.length - 1)) / 2 : 0;
      let conflictPairs = 0;
      let concurrencyPairs = 0;
      let sequentialLinks = 0;
      for (let i = 0; i < transitions.length; i += 1) {
        for (let j = i + 1; j < transitions.length; j += 1) {
          const key = relationPairKey(transitions[i], transitions[j]);
          if (relationSetHas(safeRelations.conflictPairs, key)) {
            conflictPairs += 1;
          }
          if (relationSetHas(safeRelations.coenabledPairs, key)) {
            concurrencyPairs += 1;
          }
        }
      }
      transitions.forEach((fromTransition) => {
        transitions.forEach((toTransition) => {
          if (fromTransition !== toTransition && relationSetHas(safeRelations.sequentialPairs, relationArrowKey(fromTransition, toTransition))) {
            sequentialLinks += 1;
          }
        });
      });
      const sharedTransitionCount = transitions.filter((transitionId) => sharedTransitions.has(transitionId)).length;
      const maxPlus = maxPlusByLabel.get(label) || {};
      metrics.set(label, {
        conflictDensity: pairTotal > 0 ? conflictPairs / pairTotal : 0,
        concurrencyDensity: pairTotal > 0 ? concurrencyPairs / pairTotal : 0.5,
        sequentialLinks,
        sharedTransitionRatio: transitions.length > 0 ? sharedTransitionCount / transitions.length : 0,
        coupling: coupling.get(label) || { raw: 0, normalized: 0, sharedWith: [] },
        lambda: finiteOrNull(maxPlus.lambda),
        throughput: finiteOrNull(maxPlus.throughput),
        edgeCount: Number(maxPlus.edgeCount || 0)
      });
    });
    return metrics;
  }

  return {
    clamp01,
    finiteOrNull,
    naturalLabelCompare,
    toSortedStringArray,
    toStringArray,
    createFuzzyNullMatrix,
    fuzzyMaxPlusMultiply,
    fuzzyMatrixAdjacency,
    computeFuzzySccCount,
    computeFuzzyMaxCycleMean,
    canonicalDirectedCycleKey,
    computeFuzzyCriticalCycle,
    getFuzzyPlaceDelay,
    buildStandaloneMaxPlusForAutomata,
    getEntryMaxPlusSupportPlaces,
    compactTransversalMaxPlus,
    buildSharedTransitionSetForSubnets,
    buildMaxPlusTransversalModel,
    computeSubnetCoupling,
    relationPairKey,
    relationArrowKey,
    buildTransitionRulesFor,
    computeEnabledTransitionsForMarking,
    fireOnMarking,
    computePetriXtRelations,
    buildPetriXtRelationMatrices,
    buildPetriXtRelationSummary,
    computeFuzzySubnetMetrics
  };
});
