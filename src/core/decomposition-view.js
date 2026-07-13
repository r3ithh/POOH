(function(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("./max-plus"), require("./i18n"));
  } else {
    root.PoohDecompositionViewCore = factory(root.PoohMaxPlusCore, root.PoohI18n);
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function(maxPlusCore, i18n) {
  "use strict";

  function tr(key, params) {
    return i18n && typeof i18n.t === "function" ? i18n.t(key, params) : String(key || "");
  }

  const DEFAULT_WIDTH = 1600;
  const DEFAULT_HEIGHT = 900;
  const HYPERGRAPH_PALETTE = [
    "#2563eb",
    "#dc2626",
    "#16a34a",
    "#9333ea",
    "#ea580c",
    "#0891b2",
    "#be185d",
    "#65a30d",
    "#7c3aed",
    "#0f766e",
    "#c2410c",
    "#4f46e5"
  ];

  function viewOptions(options) {
    const source = options && typeof options === "object" ? options : {};
    const width = Number(source.width);
    const height = Number(source.height);
    return {
      width: Number.isFinite(width) && width > 0 ? width : DEFAULT_WIDTH,
      height: Number.isFinite(height) && height > 0 ? height : DEFAULT_HEIGHT,
      yesText: String(source.yesText || tr("app.hypergraph.yes")),
      noText: String(source.noText || tr("app.hypergraph.no")),
      formatInteger: typeof source.formatInteger === "function" ? source.formatInteger : formatInteger,
      formatOptionalNumber: typeof source.formatOptionalNumber === "function" ? source.formatOptionalNumber : formatOptionalNumber
    };
  }

  function naturalLabelCompare(a, b) {
    return String(a ?? "").localeCompare(String(b ?? ""), undefined, { numeric: true, sensitivity: "base" });
  }

  function finiteOrNull(value) {
    if (value === null || value === undefined || value === "") {
      return null;
    }
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }

  function formatNumber(value, digits) {
    if (!Number.isFinite(value)) {
      return "-";
    }
    return Number(value).toFixed(Number.isFinite(Number(digits)) ? Number(digits) : 3);
  }

  function formatOptionalNumber(value, digits) {
    if (value === null || value === undefined || value === "") {
      return "-";
    }
    return formatNumber(Number(value), digits);
  }

  function formatInteger(value) {
    if (!Number.isFinite(value)) {
      return "-";
    }
    return String(Math.round(value));
  }

  function normalizeAngle(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return 0;
    }
    return ((numeric % 360) + 360) % 360;
  }

  function normalizeDecompositionViewMode(value) {
    const safe = String(value || "").toLowerCase();
    if (
      safe === "sfc"
      || safe === "maxplus"
      || safe === "automata-all"
      || safe === "automata-transversal"
      || safe === "automata-pinv"
      || safe === "hypergraph-selection"
      || safe === "hypergraph-manual"
    ) {
      return safe;
    }
    return "automata-transversal";
  }

  function normalizeDecompositionLayoutMode(value) {
    return String(value || "").toLowerCase() === "auto" ? "auto" : "source";
  }

  function decompositionTextOptions(options) {
    const ctx = viewOptions(options);
    const source = options && typeof options === "object" ? options : {};
    const labels = source.labels && typeof source.labels === "object" ? source.labels : {};
    return {
      ...ctx,
      labels: {
        hypergraphFallback: String(labels.hypergraphFallback || tr("app.decomposition.hypergraphFallback")),
        exactTransversal: String(labels.exactTransversal || tr("app.decomposition.exactTransversal")),
        selectionHypergraph: String(labels.selectionHypergraph || tr("app.decomposition.selectionHypergraph")),
        pinvariants: String(labels.pinvariants || tr("app.decomposition.pinvariants")),
        sourceLayout: String(labels.sourceLayout || tr("app.decomposition.sourceLayout")),
        autoLayout: String(labels.autoLayout || "auto"),
        sfcSource: String(labels.sfcSource || tr("app.decomposition.sfcSource")),
        sfcMark: String(labels.sfcMark || "SFC"),
        smcMark: String(labels.smcMark || "SMC"),
        sfcStatus: String(labels.sfcStatus || tr("app.decomposition.sfcStatus")),
        maxPlusStatus: String(labels.maxPlusStatus || tr("app.decomposition.maxPlusStatus")),
        automataStatus: String(labels.automataStatus || tr("app.decomposition.automataSubnet"))
      }
    };
  }

  function fitSourcePositionsToCanvas(nodes, options) {
    const ctx = viewOptions(options);
    const points = Array.isArray(nodes) ? nodes.filter((node) => Number.isFinite(node.x) && Number.isFinite(node.y)) : [];
    if (points.length === 0) {
      return null;
    }

    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    points.forEach((node) => {
      minX = Math.min(minX, Number(node.x));
      minY = Math.min(minY, Number(node.y));
      maxX = Math.max(maxX, Number(node.x));
      maxY = Math.max(maxY, Number(node.y));
    });

    const spreadX = Math.max(1, maxX - minX);
    const spreadY = Math.max(1, maxY - minY);
    const padding = 90;
    const usableW = Math.max(10, ctx.width - padding * 2);
    const usableH = Math.max(10, ctx.height - padding * 2);
    const scale = Math.min(usableW / spreadX, usableH / spreadY);
    const offsetX = (usableW - spreadX * scale) / 2;
    const offsetY = (usableH - spreadY * scale) / 2;

    const positions = new Map();
    points.forEach((node) => {
      positions.set(node.id, {
        x: padding + offsetX + (Number(node.x) - minX) * scale,
        y: padding + offsetY + (Number(node.y) - minY) * scale
      });
    });
    return positions;
  }

  function computeLayerPositions(ids, yStart, rowGap, options) {
    const ctx = viewOptions(options);
    const safeIds = Array.isArray(ids) ? ids.slice() : [];
    const positions = new Map();
    if (safeIds.length === 0) {
      return positions;
    }
    const maxCols = Math.max(1, Math.min(12, Math.ceil(Math.sqrt(safeIds.length * 1.6))));
    const rows = Math.max(1, Math.ceil(safeIds.length / maxCols));
    for (let row = 0; row < rows; row += 1) {
      const start = row * maxCols;
      const chunk = safeIds.slice(start, start + maxCols);
      if (chunk.length === 0) {
        continue;
      }
      const minX = 110;
      const maxX = ctx.width - 110;
      const span = Math.max(1, chunk.length - 1);
      chunk.forEach((id, index) => {
        positions.set(id, {
          x: chunk.length === 1 ? ctx.width / 2 : minX + ((maxX - minX) * index) / span,
          y: yStart + row * rowGap
        });
      });
    }
    return positions;
  }

  function computeCircularPositions(ids, options) {
    const ctx = viewOptions(options);
    const safeIds = Array.isArray(ids) ? ids.slice() : [];
    const positions = new Map();
    if (safeIds.length === 0) {
      return positions;
    }
    if (safeIds.length === 1) {
      positions.set(safeIds[0], { x: ctx.width / 2, y: ctx.height / 2 });
      return positions;
    }

    const cx = ctx.width / 2;
    const cy = ctx.height / 2;
    const radius = Math.max(140, Math.min(ctx.width, ctx.height) * 0.33);
    safeIds.forEach((id, index) => {
      const angle = ((Math.PI * 2) / safeIds.length) * index - Math.PI / 2;
      positions.set(id, {
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius
      });
    });
    return positions;
  }

  function hypergraphColor(index) {
    return HYPERGRAPH_PALETTE[((Number(index) || 0) % HYPERGRAPH_PALETTE.length + HYPERGRAPH_PALETTE.length) % HYPERGRAPH_PALETTE.length];
  }

  function buildHypergraphEntryFromMatrix(matrix, rowLabels, colLabels, options) {
    const safeMatrix = Array.isArray(matrix) ? matrix : [];
    const vertices = (Array.isArray(colLabels) ? colLabels : [])
      .map((label) => String(label))
      .filter(Boolean);
    const edges = safeMatrix.map((row, rowIndex) => {
      const members = [];
      const safeRow = Array.isArray(row) ? row : [];
      vertices.forEach((label, colIndex) => {
        if (Number(safeRow[colIndex] || 0) > 0) {
          members.push(label);
        }
      });
      const label = Array.isArray(rowLabels) && rowLabels[rowIndex] !== undefined
        ? String(rowLabels[rowIndex])
        : `E${rowIndex + 1}`;
      return { label, members };
    });
    const opts = options && typeof options === "object" ? options : {};
    return {
      type: "hypergraph",
      label: String(opts.label || "H"),
      title: String(opts.title || tr("app.decomposition.hypergraphFallback")),
      sourceMode: String(opts.sourceMode || "manual"),
      vertices,
      edges,
      matrix: safeMatrix.map((row) => Array.isArray(row) ? row.slice() : []),
      rowLabels: Array.isArray(rowLabels) ? rowLabels.map(String) : [],
      colLabels: vertices.slice(),
      xtrec: opts.xtrec || null,
      xtrecPending: Boolean(opts.xtrecPending),
      transversal: opts.transversal || null
    };
  }

  function copyPetriNodeForDecomposition(baseNode) {
    if (!baseNode || typeof baseNode !== "object") {
      return null;
    }
    const type = String(baseNode.type || baseNode.shape || "");
    return {
      id: String(baseNode.id || ""),
      label: String(baseNode.label || baseNode.id || ""),
      shape: type === "transition" ? "transition" : "place",
      x: Number(baseNode.x),
      y: Number(baseNode.y),
      angle: type === "transition" ? normalizeAngle(baseNode.angle || 0) : 0,
      tokens: type === "place" ? Math.max(0, parseInt(String(baseNode.tokens || 0), 10) || 0) : 0
    };
  }

  function buildAutomataSubnetsForView(filterMode, pinvariantResult, petriState, selectionHypergraphResult) {
    if (!pinvariantResult || !Array.isArray(pinvariantResult.invariants)) {
      return [];
    }

    const rawMode = String(filterMode || "automata-transversal");
    const mode = rawMode === "automata-all" || rawMode === "automata-pinv" || rawMode === "automata-transversal"
      ? rawMode
      : "automata-transversal";
    const nodes = Array.isArray(petriState && petriState.nodes) ? petriState.nodes : [];
    const arcs = Array.isArray(petriState && petriState.arcs) ? petriState.arcs : [];
    const invariants = pinvariantResult.invariants;
    const baseNodesById = new Map(nodes.map((node) => [String(node.id || ""), node]));
    const allTransitions = nodes
      .filter((node) => String(node.type || "") === "transition")
      .slice()
      .sort((a, b) => naturalLabelCompare(a.id, b.id));

    let allowedIndices = null;
    if (mode === "automata-transversal") {
      const recommended = selectionHypergraphResult
        && selectionHypergraphResult.transversal
        && selectionHypergraphResult.transversal.recommended
        ? selectionHypergraphResult.transversal.recommended
        : null;
      if (!recommended || !recommended.found || !Array.isArray(recommended.solutionLabels) || recommended.solutionLabels.length === 0) {
        return [];
      }
      allowedIndices = new Set();
      recommended.solutionLabels.forEach((label) => {
        const match = /^D(\d+)$/i.exec(String(label));
        if (match) {
          allowedIndices.add(parseInt(match[1], 10) - 1);
        }
      });
    } else if (mode === "automata-all") {
      allowedIndices = new Set();
      invariants.forEach((invariant, index) => {
        if (invariant && invariant.correctSubnet === true) {
          allowedIndices.add(index);
        }
      });
      if (allowedIndices.size === 0) {
        return [];
      }
    }

    const entries = [];
    invariants.forEach((invariant, index) => {
      if (!invariant) {
        return;
      }
      if (allowedIndices !== null && !allowedIndices.has(index)) {
        return;
      }
      if (allowedIndices === null && mode !== "automata-pinv" && invariant.correctSubnet !== true) {
        return;
      }

      const supportPlaces = Array.isArray(invariant.supportPlaces)
        ? invariant.supportPlaces
          .map((placeId) => String(placeId))
          .filter((placeId) => {
            const node = baseNodesById.get(placeId);
            return Boolean(node && String(node.type || "") === "place");
          })
          .sort(naturalLabelCompare)
        : [];
      if (supportPlaces.length === 0) {
        return;
      }

      const supportSet = new Set(supportPlaces);
      const transitionIds = [];
      allTransitions.forEach((transition) => {
        const transitionId = String(transition.id || "");
        const hasInputFromSupport = arcs.some((arc) => String(arc.to || "") === transitionId && supportSet.has(String(arc.from || "")));
        const hasOutputToSupport = arcs.some((arc) => String(arc.from || "") === transitionId && supportSet.has(String(arc.to || "")));
        if (hasInputFromSupport || hasOutputToSupport) {
          transitionIds.push(transitionId);
        }
      });
      transitionIds.sort(naturalLabelCompare);

      const nodeIdSet = new Set(supportPlaces.concat(transitionIds));
      const viewNodes = Array.from(nodeIdSet)
        .map((nodeId) => copyPetriNodeForDecomposition(baseNodesById.get(nodeId)))
        .filter(Boolean);
      const edges = arcs
        .filter((arc) => nodeIdSet.has(String(arc.from || "")) && nodeIdSet.has(String(arc.to || "")))
        .map((arc) => ({
          from: String(arc.from || ""),
          to: String(arc.to || ""),
          label: Number(arc.weight || 0) > 1 ? String(arc.weight) : ""
        }));

      entries.push({
        label: `D${index + 1}`,
        supportPlaces,
        transitionIds,
        nodes: viewNodes,
        edges,
        markedSupportCount: Number(invariant.markedSupportCount || 0),
        correctSubnet: Boolean(invariant.correctSubnet),
        inTransversal: allowedIndices !== null && mode === "automata-transversal"
      });
    });

    return entries.sort((a, b) => naturalLabelCompare(a.label, b.label));
  }

  function buildSfcSubnetsForView(model) {
    if (!model || !Array.isArray(model.subnets)) {
      return [];
    }

    return model.subnets
      .map((subnet, index) => {
        const steps = Array.isArray(subnet.steps) ? subnet.steps.map((step) => String(step)) : [];
        const transitions = Array.isArray(subnet.transitions) ? subnet.transitions : [];
        const nodes = [];
        const edges = [];

        steps.forEach((stepId) => {
          nodes.push({
            id: `step:${stepId}`,
            label: stepId,
            shape: "place",
            x: Number.NaN,
            y: Number.NaN,
            tokens: stepId === subnet.initialStep ? 1 : 0
          });
        });

        transitions.forEach((transition, transitionIndex) => {
          const transitionId = String(transition && transition.id ? transition.id : `T${transitionIndex + 1}`);
          const nodeId = `trans:${transitionId}:${transitionIndex}`;
          nodes.push({
            id: nodeId,
            label: transitionId,
            shape: "transition",
            x: Number.NaN,
            y: Number.NaN,
            angle: 0
          });
          const fromSteps = Array.isArray(transition && transition.from) ? transition.from : [];
          const toSteps = Array.isArray(transition && transition.to) ? transition.to : [];
          fromSteps.forEach((stepId) => {
            edges.push({ from: `step:${stepId}`, to: nodeId, label: "" });
          });
          toSteps.forEach((stepId) => {
            edges.push({ from: nodeId, to: `step:${stepId}`, label: "" });
          });
        });

        return {
          label: String(subnet.label || `D${index + 1}`),
          initialStep: String(subnet.initialStep || ""),
          steps,
          transitions: transitions.map((transition) => String(transition && transition.id ? transition.id : "")),
          nodes,
          edges
        };
      })
      .sort((a, b) => naturalLabelCompare(a.label, b.label));
  }

  function getAutomataSubnetsForMaxPlusView(pinvariantResult, petriState, selectionHypergraphResult, labels) {
    const safeLabels = labels && typeof labels === "object" ? labels : {};
    const exactLabel = String(safeLabels.exactTransversal || tr("app.decomposition.exactTransversal"));
    const selectionLabel = String(safeLabels.selectionHypergraph || tr("app.decomposition.selectionHypergraph"));
    const pinvariantLabel = String(safeLabels.pinvariants || "p-inwarianty");

    const transversalEntries = buildAutomataSubnetsForView("automata-transversal", pinvariantResult, petriState, selectionHypergraphResult);
    if (transversalEntries.length > 0) {
      return { entries: transversalEntries, sourceMode: exactLabel };
    }

    const selectionEntries = buildAutomataSubnetsForView("automata-all", pinvariantResult, petriState, selectionHypergraphResult);
    if (selectionEntries.length > 0) {
      return { entries: selectionEntries, sourceMode: selectionLabel };
    }

    const pinvariantEntries = buildAutomataSubnetsForView("automata-pinv", pinvariantResult, petriState, selectionHypergraphResult)
      .filter((entry) => entry.correctSubnet || entry.transitionIds.length > 0);
    return { entries: pinvariantEntries, sourceMode: pinvariantLabel };
  }

  function computeHypergraphVertexPositions(vertices, options) {
    const ctx = viewOptions(options);
    const labels = Array.isArray(vertices) ? vertices.slice().sort(naturalLabelCompare) : [];
    const positions = new Map();
    if (labels.length === 0) {
      return positions;
    }
    const cx = ctx.width / 2;
    const cy = ctx.height / 2 + 10;
    if (labels.length === 1) {
      positions.set(labels[0], { x: cx, y: cy });
      return positions;
    }
    if (labels.length <= 18) {
      const radius = Math.max(170, Math.min(ctx.width, ctx.height) * 0.34);
      labels.forEach((label, index) => {
        const angle = ((Math.PI * 2) / labels.length) * index - Math.PI / 2;
        positions.set(label, {
          x: cx + Math.cos(angle) * radius,
          y: cy + Math.sin(angle) * radius
        });
      });
      return positions;
    }

    const cols = Math.ceil(Math.sqrt(labels.length * 1.45));
    const rows = Math.ceil(labels.length / cols);
    const x0 = 110;
    const y0 = 120;
    const xGap = (ctx.width - 220) / Math.max(1, cols - 1);
    const yGap = (ctx.height - 260) / Math.max(1, rows - 1);
    labels.forEach((label, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      positions.set(label, {
        x: x0 + col * xGap,
        y: y0 + row * yGap
      });
    });
    return positions;
  }

  function convexHull(points) {
    const pts = (Array.isArray(points) ? points : [])
      .filter((point) => point && Number.isFinite(point.x) && Number.isFinite(point.y))
      .slice()
      .sort((a, b) => a.x === b.x ? a.y - b.y : a.x - b.x);
    if (pts.length <= 2) {
      return pts;
    }
    const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
    const lower = [];
    pts.forEach((point) => {
      while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) {
        lower.pop();
      }
      lower.push(point);
    });
    const upper = [];
    for (let i = pts.length - 1; i >= 0; i -= 1) {
      const point = pts[i];
      while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) {
        upper.pop();
      }
      upper.push(point);
    }
    upper.pop();
    lower.pop();
    return lower.concat(upper);
  }

  function expandPointsFromCentroid(points, padding) {
    const safe = Array.isArray(points) ? points : [];
    if (safe.length === 0) {
      return [];
    }
    const centroid = safe.reduce((acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }), { x: 0, y: 0 });
    centroid.x /= safe.length;
    centroid.y /= safe.length;
    return safe.map((point) => {
      const dx = point.x - centroid.x;
      const dy = point.y - centroid.y;
      const dist = Math.max(1, Math.hypot(dx, dy));
      const factor = (dist + padding) / dist;
      return {
        x: centroid.x + dx * factor,
        y: centroid.y + dy * factor
      };
    });
  }

  function expandPointsToDiskHull(points, radius, samples) {
    const safe = (Array.isArray(points) ? points : [])
      .filter((point) => point && Number.isFinite(point.x) && Number.isFinite(point.y));
    if (safe.length === 0) {
      return [];
    }
    const r = Math.max(0, Number.isFinite(Number(radius)) ? Number(radius) : 0);
    if (r <= 0) {
      return convexHull(safe);
    }
    const sampleCount = Math.max(8, Math.min(32, Math.round(Number(samples) || 16)));
    const expanded = [];
    safe.forEach((point) => {
      for (let index = 0; index < sampleCount; index += 1) {
        const angle = ((Math.PI * 2) / sampleCount) * index;
        expanded.push({
          x: point.x + Math.cos(angle) * r,
          y: point.y + Math.sin(angle) * r
        });
      }
    });
    return convexHull(expanded);
  }

  function roundedPolygonPath(points, cornerRadius) {
    const pts = Array.isArray(points) ? points : [];
    if (pts.length === 0) {
      return "";
    }
    if (pts.length === 1) {
      return `M ${pts[0].x} ${pts[0].y}`;
    }
    const radius = Math.max(0, Number.isFinite(Number(cornerRadius)) ? Number(cornerRadius) : 34);
    const pointToward = (from, to, distance) => {
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const len = Math.max(1, Math.hypot(dx, dy));
      const step = Math.min(distance, len / 2);
      return {
        x: from.x + (dx / len) * step,
        y: from.y + (dy / len) * step
      };
    };
    const corners = pts.map((point, index) => {
      const prev = pts[(index - 1 + pts.length) % pts.length];
      const next = pts[(index + 1) % pts.length];
      return {
        point,
        before: pointToward(point, prev, radius),
        after: pointToward(point, next, radius)
      };
    });
    let d = `M ${corners[0].before.x} ${corners[0].before.y}`;
    for (let i = 0; i < pts.length; i += 1) {
      const current = corners[i];
      const next = corners[(i + 1) % corners.length];
      d += ` Q ${current.point.x} ${current.point.y} ${current.after.x} ${current.after.y}`;
      d += ` L ${next.before.x} ${next.before.y}`;
    }
    d += " Z";
    return d;
  }

  function capsulePath(a, b, padding) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.max(1, Math.hypot(dx, dy));
    const ux = dx / len;
    const uy = dy / len;
    const nx = -uy;
    const ny = ux;
    const endPad = 32;
    const p1 = { x: a.x - ux * endPad + nx * padding, y: a.y - uy * endPad + ny * padding };
    const p2 = { x: b.x + ux * endPad + nx * padding, y: b.y + uy * endPad + ny * padding };
    const p3 = { x: b.x + ux * endPad - nx * padding, y: b.y + uy * endPad - ny * padding };
    const p4 = { x: a.x - ux * endPad - nx * padding, y: a.y - uy * endPad - ny * padding };
    return `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} Q ${b.x + ux * (endPad + padding)} ${b.y + uy * (endPad + padding)} ${p3.x} ${p3.y} L ${p4.x} ${p4.y} Q ${a.x - ux * (endPad + padding)} ${a.y - uy * (endPad + padding)} ${p1.x} ${p1.y} Z`;
  }

  function hyperedgeCentroid(points) {
    const safe = Array.isArray(points) ? points : [];
    if (safe.length === 0) {
      return { x: 0, y: 0 };
    }
    return safe.reduce((acc, point) => ({ x: acc.x + point.x / safe.length, y: acc.y + point.y / safe.length }), { x: 0, y: 0 });
  }

  function buildMaxPlusGraphEntry(label, transitions, matrix, lambda, throughput, sourceMode, edgeRows, criticalCycleHint, options) {
    const opts = viewOptions(options);
    const safeTransitions = Array.isArray(transitions)
      ? transitions.map((transitionId) => String(transitionId)).filter(Boolean)
      : [];
    const safeMatrix = Array.isArray(matrix) ? matrix : [];
    const nodes = safeTransitions.map((transitionId) => ({
      id: transitionId,
      label: transitionId,
      shape: "transition",
      x: Number.NaN,
      y: Number.NaN,
      angle: 0
    }));

    const cycleResolver = maxPlusCore && typeof maxPlusCore.computeFuzzyCriticalCycle === "function"
      ? maxPlusCore.computeFuzzyCriticalCycle
      : null;
    const criticalCycle = criticalCycleHint || (cycleResolver ? cycleResolver(safeMatrix, safeTransitions, lambda) : null);
    const criticalEdgeKeys = new Set(criticalCycle && Array.isArray(criticalCycle.edgeKeys) ? criticalCycle.edgeKeys : []);
    const criticalNodeSet = new Set();
    if (criticalCycle && Array.isArray(criticalCycle.transitions)) {
      criticalCycle.transitions.forEach((transitionId) => criticalNodeSet.add(String(transitionId)));
    }

    const edges = [];
    for (let toIndex = 0; toIndex < safeMatrix.length; toIndex += 1) {
      const row = Array.isArray(safeMatrix[toIndex]) ? safeMatrix[toIndex] : [];
      for (let fromIndex = 0; fromIndex < row.length; fromIndex += 1) {
        const weight = row[fromIndex];
        if (weight === null || weight === undefined) {
          continue;
        }
        const fromId = safeTransitions[fromIndex];
        const toId = safeTransitions[toIndex];
        if (!fromId || !toId) {
          continue;
        }
        const edgeKey = `${fromId}->${toId}`;
        edges.push({
          from: fromId,
          to: toId,
          label: opts.formatOptionalNumber(weight, 3),
          weight: Number(weight),
          critical: criticalEdgeKeys.has(edgeKey)
        });
      }
    }

    return {
      label,
      transitions: safeTransitions,
      lambda: finiteOrNull(lambda),
      throughput: finiteOrNull(throughput),
      nodes: nodes.map((node) => ({ ...node, critical: criticalNodeSet.has(node.id) })),
      edges,
      criticalCycle,
      sourceMode,
      edgeRows: Array.isArray(edgeRows) ? edgeRows : []
    };
  }

  function buildMaxPlusSubnetsForView(source, options) {
    const data = source && typeof source === "object" ? source : {};
    const model = data.sfcModel && typeof data.sfcModel === "object" ? data.sfcModel : null;
    const maxPlus = model && model.maxPlus ? model.maxPlus : null;
    const labels = data.labels && typeof data.labels === "object" ? data.labels : {};
    const sfcSourceLabel = String(labels.sfcSource || "model SFC/(max,+)");

    if (maxPlus && Array.isArray(maxPlus.subnets) && maxPlus.subnets.length > 0) {
      return maxPlus.subnets
        .map((subnet, index) => buildMaxPlusGraphEntry(
          String(subnet && subnet.label ? subnet.label : `D${index + 1}`),
          Array.isArray(subnet && subnet.transitions) ? subnet.transitions : [],
          Array.isArray(subnet && subnet.matrix) ? subnet.matrix : [],
          subnet ? subnet.lambda : null,
          subnet ? subnet.throughput : null,
          sfcSourceLabel,
          subnet ? subnet.edgeRows : null,
          null,
          options
        ))
        .sort((a, b) => naturalLabelCompare(a.label, b.label));
    }

    const automataSource = getAutomataSubnetsForMaxPlusView(
      data.pinvariantResult,
      data.petriState,
      data.selectionHypergraphResult,
      labels
    );
    if (automataSource.entries.length === 0) {
      return [];
    }

    if (
      !maxPlusCore
      || typeof maxPlusCore.buildSharedTransitionSetForSubnets !== "function"
      || typeof maxPlusCore.buildStandaloneMaxPlusForAutomata !== "function"
    ) {
      throw new Error(tr("core.decomposition.maxPlusMissing"));
    }

    const arcs = Array.isArray(data.petriState && data.petriState.arcs) ? data.petriState.arcs : [];
    const maxPlusOptions = data.maxPlusOptions && typeof data.maxPlusOptions === "object" ? data.maxPlusOptions : {};
    const sharedTransitionSet = maxPlusCore.buildSharedTransitionSetForSubnets(automataSource.entries);
    return automataSource.entries
      .map((entry) => {
        const maxPlusSubnet = maxPlusCore.buildStandaloneMaxPlusForAutomata(entry, sharedTransitionSet, maxPlusOptions, arcs);
        return buildMaxPlusGraphEntry(
          entry.label,
          maxPlusSubnet.transitions,
          maxPlusSubnet.matrix,
          maxPlusSubnet.lambda,
          maxPlusSubnet.throughput,
          automataSource.sourceMode,
          maxPlusSubnet.edgeRows,
          maxPlusSubnet.criticalCycle,
          options
        );
      })
      .sort((a, b) => naturalLabelCompare(a.label, b.label));
  }

  function buildAutomataGraph(entry, layoutMode, options) {
    const ctx = viewOptions(options);
    const nodes = Array.isArray(entry && entry.nodes) ? entry.nodes.map((node) => ({ ...node })) : [];
    const edges = Array.isArray(entry && entry.edges) ? entry.edges.map((edge) => ({ ...edge })) : [];
    if (nodes.length === 0) {
      return { nodes: [], edges: [], details: [] };
    }

    const positions = normalizeDecompositionLayoutMode(layoutMode) === "source"
      ? fitSourcePositionsToCanvas(nodes, ctx)
      : null;
    const placeIds = nodes.filter((node) => node.shape === "place").map((node) => node.id).sort(naturalLabelCompare);
    const transitionIds = nodes.filter((node) => node.shape === "transition").map((node) => node.id).sort(naturalLabelCompare);

    let autoPositions = null;
    if (!positions) {
      autoPositions = new Map();
      const placeLayer = computeLayerPositions(placeIds, 190, 120, ctx);
      const transitionLayer = computeLayerPositions(transitionIds, 510, 120, ctx);
      placeLayer.forEach((value, key) => autoPositions.set(key, value));
      transitionLayer.forEach((value, key) => autoPositions.set(key, value));
    }

    nodes.forEach((node) => {
      const point = positions ? positions.get(node.id) : autoPositions.get(node.id);
      if (point) {
        node.x = point.x;
        node.y = point.y;
      }
      if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) {
        node.x = ctx.width / 2;
        node.y = ctx.height / 2;
      }
    });

    const details = [
      tr("core.decomposition.subnet", { label: entry.label }),
      tr("core.decomposition.places", { values: entry.supportPlaces.join(", ") }),
      tr("core.decomposition.transitions", { values: entry.transitionIds.join(", ") }),
      tr("core.decomposition.markedPlaces", { count: ctx.formatInteger(Number(entry.markedSupportCount || 0)) }),
      tr("core.decomposition.correctSubnet", { value: entry.correctSubnet ? ctx.yesText : ctx.noText })
    ];

    return { nodes, edges, details };
  }

  function buildSfcGraph(entry, options) {
    const ctx = viewOptions(options);
    const nodes = Array.isArray(entry && entry.nodes) ? entry.nodes.map((node) => ({ ...node })) : [];
    const edges = Array.isArray(entry && entry.edges) ? entry.edges.map((edge) => ({ ...edge })) : [];
    if (nodes.length === 0) {
      return { nodes: [], edges: [], details: [] };
    }

    const stepIds = nodes.filter((node) => node.shape === "place").map((node) => node.id).sort(naturalLabelCompare);
    const transitionIds = nodes.filter((node) => node.shape === "transition").map((node) => node.id).sort(naturalLabelCompare);
    const stepPositions = computeLayerPositions(stepIds, 190, 110, ctx);
    const transitionPositions = computeLayerPositions(transitionIds, 520, 110, ctx);
    const stepX = new Map();
    stepPositions.forEach((point, nodeId) => stepX.set(nodeId, point.x));

    nodes.forEach((node, index) => {
      if (node.shape === "place") {
        const point = stepPositions.get(node.id);
        node.x = point ? point.x : ctx.width / 2;
        node.y = point ? point.y : 220;
        return;
      }
      const incoming = edges.filter((edge) => edge.to === node.id && stepX.has(edge.from));
      const outgoing = edges.filter((edge) => edge.from === node.id && stepX.has(edge.to));
      const values = incoming.concat(outgoing).map((edge) => stepX.get(edge.from) || stepX.get(edge.to)).filter(Number.isFinite);
      const base = transitionPositions.get(node.id);
      node.x = values.length > 0
        ? values.reduce((sum, value) => sum + value, 0) / values.length + ((index % 3) - 1) * 12
        : (base ? base.x : ctx.width / 2);
      node.y = base ? base.y : 520;
    });

    const details = [
      tr("core.decomposition.sfcSubnet", { label: entry.label }),
      tr("core.decomposition.initialStep", { step: entry.initialStep || "-" }),
      tr("core.decomposition.steps", { values: entry.steps.join(", ") }),
      tr("core.decomposition.transitions", { values: entry.transitions.join(", ") })
    ];
    return { nodes, edges, details };
  }

  function buildMaxPlusGraph(entry, options) {
    const ctx = viewOptions(options);
    const nodes = Array.isArray(entry && entry.nodes) ? entry.nodes.map((node) => ({ ...node })) : [];
    const edges = Array.isArray(entry && entry.edges) ? entry.edges.map((edge) => ({ ...edge })) : [];
    if (nodes.length === 0) {
      return { nodes: [], edges: [], details: [] };
    }

    const ids = nodes.map((node) => node.id).sort(naturalLabelCompare);
    const positions = computeCircularPositions(ids, ctx);
    nodes.forEach((node) => {
      const point = positions.get(node.id);
      node.x = point ? point.x : ctx.width / 2;
      node.y = point ? point.y : ctx.height / 2;
    });

    const details = [
      tr("core.decomposition.maxPlusSubnet", { label: entry.label }),
      tr("core.decomposition.source", { source: entry.sourceMode || tr("app.decomposition.sfcSource") }),
      tr("core.decomposition.transitions", { values: entry.transitions.join(", ") }),
      `Lambda: ${ctx.formatOptionalNumber(entry.lambda, 6)}`,
      tr("core.decomposition.throughput", { value: ctx.formatOptionalNumber(entry.throughput, 6) }),
      tr("core.decomposition.weightedEdges", { count: ctx.formatInteger(edges.length) })
    ];
    if (Array.isArray(entry.edgeRows) && entry.edgeRows.length > 0) {
      const delayPlaces = Array.from(new Set(entry.edgeRows.map((edge) => edge.placeId).filter(Boolean))).sort(naturalLabelCompare);
      details.push(tr("core.decomposition.delayPlaces", { values: delayPlaces.join(", ") }));
    }
    if (entry.criticalCycle) {
      details.push(tr("core.decomposition.criticalCycle", { transitions: (entry.criticalCycle.transitions || []).join(" -> ") }));
      details.push(tr("core.decomposition.cycleMean", {
        mean: ctx.formatOptionalNumber(entry.criticalCycle.mean, 6),
        weight: ctx.formatOptionalNumber(entry.criticalCycle.weight, 3),
        length: ctx.formatInteger(Number(entry.criticalCycle.length || 0))
      }));
      if (entry.criticalCycle.search && entry.criticalCycle.search.truncated) {
        details.push(tr("core.decomposition.cycleTruncated", {
          count: ctx.formatInteger(Number(entry.criticalCycle.search.cyclesChecked || 0))
        }));
      }
    } else {
      details.push(tr("core.decomposition.noCriticalCycle"));
    }
    return { nodes, edges, details };
  }

  function buildHypergraphGraph(entry, options) {
    const ctx = viewOptions(options);
    const vertices = Array.isArray(entry && entry.vertices) ? entry.vertices.slice().sort(naturalLabelCompare) : [];
    const positions = computeHypergraphVertexPositions(vertices, ctx);
    const nodes = vertices.map((label) => {
      const point = positions.get(label) || { x: ctx.width / 2, y: ctx.height / 2 };
      return {
        id: label,
        label,
        shape: "hypervertex",
        x: point.x,
        y: point.y
      };
    });
    const nodeById = new Map(nodes.map((node) => [node.id, node]));
    const hyperedges = (Array.isArray(entry && entry.edges) ? entry.edges : []).map((edge, index) => ({
      label: String(edge && edge.label ? edge.label : `E${index + 1}`),
      members: (Array.isArray(edge && edge.members) ? edge.members : [])
        .map(String)
        .filter((member) => nodeById.has(member))
        .sort(naturalLabelCompare),
      color: hypergraphColor(index),
      index
    }));
    const xtrec = entry && entry.xtrec ? entry.xtrec : null;
    const xtLabel = entry && entry.xtrecPending
      ? tr("core.decomposition.xtrecRunning")
      : xtrec && typeof xtrec.isXt === "boolean"
        ? `XTREC: ${xtrec.isXt ? tr("core.decomposition.xtrecTrue") : "FALSE"}`
        : tr("core.decomposition.xtrecNotRun");
    const details = [
      `${entry.title || tr("app.decomposition.hypergraphFallback")}: ${entry.label || "H"}`,
      tr("core.decomposition.source", {
        source: tr(entry.sourceMode === "selection" ? "core.decomposition.selectionSource" : "core.decomposition.manualSource")
      }),
      tr("core.decomposition.vertices", { count: ctx.formatInteger(vertices.length), values: vertices.join(", ") }),
      tr("core.decomposition.hyperedges", {
        count: ctx.formatInteger(hyperedges.length),
        values: hyperedges.map((edge) => edge.label).join(", ")
      }),
      xtLabel
    ];
    if (xtrec && xtrec.witness && xtrec.witness.message) {
      details.push(tr("core.decomposition.witness", { message: xtrec.witness.message }));
    }
    if (entry && entry.transversal && entry.transversal.recommended && entry.transversal.recommended.found) {
      const rec = entry.transversal.recommended;
      details.push(tr("core.decomposition.recommended", {
        values: (rec.solutionLabels || []).join(", "),
        size: ctx.formatInteger(Number(rec.size || 0)),
        type: rec.type || "-"
      }));
    }
    hyperedges.forEach((edge) => {
      details.push(`${edge.label}: {${edge.members.join(", ") || "∅"}}`);
    });
    return {
      type: "hypergraph",
      nodes,
      hyperedges,
      details
    };
  }

  function getSubnetOptionLabel(mode, entry, options) {
    const ctx = decompositionTextOptions(options);
    const safeMode = normalizeDecompositionViewMode(mode);
    if (!entry) {
      return "-";
    }
    if (safeMode === "hypergraph-selection" || safeMode === "hypergraph-manual") {
      const xt = entry.xtrec && typeof entry.xtrec.isXt === "boolean"
        ? (entry.xtrec.isXt ? "XT" : "non-XT")
        : (entry.xtrecPending ? "XTREC..." : "XT?");
      return `${entry.title || entry.label} (|V|=${ctx.formatInteger((entry.vertices || []).length)}, |E|=${ctx.formatInteger((entry.edges || []).length)}, ${xt})`;
    }
    if (safeMode === "sfc") {
      return `${entry.label} (${ctx.formatInteger((entry.steps || []).length)} S / ${ctx.formatInteger((entry.transitions || []).length)} T)`;
    }
    if (safeMode === "maxplus") {
      const sourceMark = entry.sourceMode === ctx.labels.sfcSource ? ctx.labels.sfcMark : ctx.labels.smcMark;
      return `${entry.label} (${ctx.formatInteger((entry.transitions || []).length)} T, λ=${ctx.formatOptionalNumber(entry.lambda, 3)}, ${sourceMark})`;
    }
    const pCount = ctx.formatInteger((entry.supportPlaces || []).length);
    const tCount = ctx.formatInteger((entry.transitionIds || []).length);
    const correctMark = entry.correctSubnet ? " ✓" : "";
    return `${entry.label} (${pCount} P / ${tCount} T)${correctMark}`;
  }

  function buildDecompositionGraphForMode(mode, entry, layoutMode, options) {
    const ctx = decompositionTextOptions(options);
    const safeMode = normalizeDecompositionViewMode(mode);
    const safeLayoutMode = normalizeDecompositionLayoutMode(layoutMode);
    if (safeMode === "hypergraph-selection" || safeMode === "hypergraph-manual") {
      const graph = buildHypergraphGraph(entry, options);
      return {
        graph,
        status: `${entry.title || ctx.labels.hypergraphFallback}: |V|=${ctx.formatInteger((entry.vertices || []).length)}, |E|=${ctx.formatInteger((entry.edges || []).length)}.`
      };
    }
    if (safeMode === "sfc") {
      return {
        graph: buildSfcGraph(entry, options),
        status: `${ctx.labels.sfcStatus} ${entry.label}.`
      };
    }
    if (safeMode === "maxplus") {
      return {
        graph: buildMaxPlusGraph(entry, options),
        status: `${ctx.labels.maxPlusStatus} ${entry.label}.`
      };
    }

    const modeLabel = safeMode === "automata-transversal"
      ? ctx.labels.exactTransversal
      : safeMode === "automata-all"
        ? ctx.labels.selectionHypergraph
        : ctx.labels.pinvariants;
    const layoutLabel = safeLayoutMode === "source" ? ctx.labels.sourceLayout : ctx.labels.autoLayout;
    return {
      graph: buildAutomataGraph(entry, safeLayoutMode, options),
      status: `${ctx.labels.automataStatus} ${entry.label} [${modeLabel}] (${(entry.supportPlaces || []).length}P / ${(entry.transitionIds || []).length}T, ${layoutLabel}).`
    };
  }

  return {
    naturalLabelCompare,
    finiteOrNull,
    normalizeAngle,
    normalizeDecompositionViewMode,
    normalizeDecompositionLayoutMode,
    fitSourcePositionsToCanvas,
    computeLayerPositions,
    computeCircularPositions,
    hypergraphColor,
    buildHypergraphEntryFromMatrix,
    copyPetriNodeForDecomposition,
    buildAutomataSubnetsForView,
    buildSfcSubnetsForView,
    getAutomataSubnetsForMaxPlusView,
    computeHypergraphVertexPositions,
    convexHull,
    expandPointsFromCentroid,
    expandPointsToDiskHull,
    roundedPolygonPath,
    capsulePath,
    hyperedgeCentroid,
    buildMaxPlusGraphEntry,
    buildMaxPlusSubnetsForView,
    buildAutomataGraph,
    buildSfcGraph,
    buildMaxPlusGraph,
    buildHypergraphGraph,
    getSubnetOptionLabel,
    buildDecompositionGraphForMode
  };
});
