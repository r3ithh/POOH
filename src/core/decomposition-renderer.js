(function(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("./decomposition-view"), require("./i18n"));
  } else {
    root.PoohDecompositionRendererCore = factory(root.PoohDecompositionViewCore, root.PoohI18n);
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function(viewCore, i18n) {
  "use strict";

  function tr(key, params) {
    return i18n && typeof i18n.t === "function" ? i18n.t(key, params) : String(key || "");
  }

  const DEFAULT_NS = "http://www.w3.org/2000/svg";
  const DEFAULT_PLACE_RADIUS = 26;
  const DEFAULT_TRANSITION_HALF_W = 10;
  const DEFAULT_TRANSITION_HALF_H = 30;
  const DEFAULT_WIDTH = 1600;
  const DEFAULT_HEIGHT = 900;

  function rendererOptions(options) {
    const source = options && typeof options === "object" ? options : {};
    return {
      ns: String(source.ns || DEFAULT_NS),
      width: Number.isFinite(Number(source.width)) && Number(source.width) > 0 ? Number(source.width) : DEFAULT_WIDTH,
      height: Number.isFinite(Number(source.height)) && Number(source.height) > 0 ? Number(source.height) : DEFAULT_HEIGHT,
      placeRadius: Number.isFinite(Number(source.placeRadius)) ? Number(source.placeRadius) : DEFAULT_PLACE_RADIUS,
      transitionHalfW: Number.isFinite(Number(source.transitionHalfW)) ? Number(source.transitionHalfW) : DEFAULT_TRANSITION_HALF_W,
      transitionHalfH: Number.isFinite(Number(source.transitionHalfH)) ? Number(source.transitionHalfH) : DEFAULT_TRANSITION_HALF_H,
      legendTitle: String(source.legendTitle || tr("core.decompositionRenderer.hyperedges")),
      formatInteger: typeof source.formatInteger === "function" ? source.formatInteger : formatInteger
    };
  }

  function formatInteger(value) {
    if (!Number.isFinite(Number(value))) {
      return "-";
    }
    return String(Math.round(Number(value)));
  }

  function normalizeAngle(value) {
    if (viewCore && typeof viewCore.normalizeAngle === "function") {
      return viewCore.normalizeAngle(value);
    }
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return 0;
    }
    return ((numeric % 360) + 360) % 360;
  }

  function requireViewFunction(name) {
    if (viewCore && typeof viewCore[name] === "function") {
      return viewCore[name].bind(viewCore);
    }
    throw new Error(tr("core.decompositionRenderer.dependencyMissing", { name }));
  }

  function createSvg(documentRef, ns, tagName) {
    if (!documentRef || typeof documentRef.createElementNS !== "function") {
      throw new Error(tr("core.decompositionRenderer.domRequired"));
    }
    return documentRef.createElementNS(ns, tagName);
  }

  function setAttrs(element, attrs) {
    Object.keys(attrs || {}).forEach((key) => {
      if (attrs[key] === null || attrs[key] === undefined) {
        return;
      }
      element.setAttribute(key, String(attrs[key]));
    });
  }

  function getConnectionPoint(node, towardX, towardY, options) {
    const opts = rendererOptions(options);
    const type = String(node && node.type ? node.type : node && node.shape ? node.shape : "");
    const x = Number(node && node.x);
    const y = Number(node && node.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return { x: 0, y: 0 };
    }
    if (type !== "transition") {
      const dx = Number(towardX) - x;
      const dy = Number(towardY) - y;
      const length = Math.max(1, Math.hypot(dx, dy));
      return {
        x: x + (dx / length) * opts.placeRadius,
        y: y + (dy / length) * opts.placeRadius
      };
    }

    const angle = (normalizeAngle(node.angle || 0) * Math.PI) / 180;
    const dx = Number(towardX) - x;
    const dy = Number(towardY) - y;
    const cos = Math.cos(-angle);
    const sin = Math.sin(-angle);
    const localX = dx * cos - dy * sin;
    const localY = dx * sin + dy * cos;
    const scaleX = Math.abs(localX) / opts.transitionHalfW;
    const scaleY = Math.abs(localY) / opts.transitionHalfH;
    const scale = Math.max(scaleX, scaleY, 1);
    const hitLocalX = localX / scale;
    const hitLocalY = localY / scale;
    const outCos = Math.cos(angle);
    const outSin = Math.sin(angle);
    return {
      x: x + hitLocalX * outCos - hitLocalY * outSin,
      y: y + hitLocalX * outSin + hitLocalY * outCos
    };
  }

  function buildDecompositionEdgePlan(edge, fromNode, toNode, usedIndex, totalCount, options) {
    const opts = rendererOptions(options);
    const safeEdge = edge && typeof edge === "object" ? edge : {};
    const from = fromNode && typeof fromNode === "object" ? fromNode : {};
    const to = toNode && typeof toNode === "object" ? toNode : {};
    let labelX = (Number(from.x) + Number(to.x)) / 2;
    let labelY = (Number(from.y) + Number(to.y)) / 2 - 8;
    let d = "";

    if (String(from.id) === String(to.id)) {
      const sx = Number(from.x) + 18;
      const sy = Number(from.y) - 20;
      const ex = Number(from.x) - 18;
      const ey = Number(from.y) - 20;
      const c1x = Number(from.x) + 62;
      const c1y = Number(from.y) - 96;
      const c2x = Number(from.x) - 62;
      const c2y = Number(from.y) - 96;
      d = `M ${sx} ${sy} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${ex} ${ey}`;
      labelX = Number(from.x);
      labelY = Number(from.y) - 106;
    } else {
      const fromShape = {
        type: from.shape === "transition" ? "transition" : "place",
        x: Number(from.x),
        y: Number(from.y),
        angle: normalizeAngle(from.angle || 0)
      };
      const toShape = {
        type: to.shape === "transition" ? "transition" : "place",
        x: Number(to.x),
        y: Number(to.y),
        angle: normalizeAngle(to.angle || 0)
      };
      const start = getConnectionPoint(fromShape, to.x, to.y, opts);
      const end = getConnectionPoint(toShape, from.x, from.y, opts);
      const total = Math.max(1, Number(totalCount) || 1);
      const used = Math.max(0, Number(usedIndex) || 0);
      const shift = total > 1 ? (used - (total - 1) / 2) * 20 : 0;
      if (Math.abs(shift) < 0.5) {
        d = `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
      } else {
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const norm = Math.max(1, Math.hypot(dx, dy));
        const nx = -dy / norm;
        const ny = dx / norm;
        const cx = midX + nx * shift;
        const cy = midY + ny * shift;
        d = `M ${start.x} ${start.y} Q ${cx} ${cy} ${end.x} ${end.y}`;
        labelX = cx;
        labelY = cy - 8;
      }
    }

    return {
      d,
      labelX,
      labelY,
      className: `decomp-arc-line${safeEdge.critical ? " decomp-critical-edge" : ""}`,
      label: safeEdge.label ? String(safeEdge.label) : ""
    };
  }

  function buildHypergraphRegionPlan(edge, nodeById, options) {
    const opts = rendererOptions(options);
    const safeEdge = edge && typeof edge === "object" ? edge : {};
    const members = Array.isArray(safeEdge.members) ? safeEdge.members : [];
    const memberPoints = members
      .map((member) => nodeById && typeof nodeById.get === "function" ? nodeById.get(member) : null)
      .filter(Boolean)
      .map((node) => ({ x: Number(node.x), y: Number(node.y) }))
      .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
    const color = safeEdge.color || requireViewFunction("hypergraphColor")(safeEdge.index);
    let shape = null;
    let labelPoint = memberPoints.length > 0
      ? requireViewFunction("hyperedgeCentroid")(memberPoints)
      : { x: 150 + ((Number(safeEdge.index) || 0) % 6) * 190, y: opts.height - 80 };

    if (memberPoints.length === 0) {
      shape = {
        tag: "rect",
        attrs: {
          x: labelPoint.x - 66,
          y: labelPoint.y - 28,
          width: 132,
          height: 56,
          rx: 16,
          class: "hypergraph-empty-edge hyperedge-region",
          fill: color,
          "fill-opacity": 0,
          stroke: color,
          "stroke-opacity": 0.85
        }
      };
    } else if (memberPoints.length === 1) {
      const radius = 54 + ((Number(safeEdge.index) || 0) % 5) * 8;
      shape = {
        tag: "ellipse",
        attrs: {
          cx: memberPoints[0].x,
          cy: memberPoints[0].y,
          rx: radius + 8,
          ry: radius,
          class: "hyperedge-region",
          fill: color,
          "fill-opacity": 0.16,
          stroke: color,
          "stroke-opacity": 0.85
        }
      };
      labelPoint = { x: memberPoints[0].x, y: memberPoints[0].y - radius - 16 };
    } else {
      let d = "";
      if (memberPoints.length === 2) {
        d = requireViewFunction("capsulePath")(memberPoints[0], memberPoints[1], 54 + ((Number(safeEdge.index) || 0) % 3) * 6);
      } else {
        const radius = 42 + ((Number(safeEdge.index) || 0) % 3) * 5;
        const hull = requireViewFunction("expandPointsToDiskHull")(memberPoints, radius, 18);
        d = requireViewFunction("roundedPolygonPath")(hull, 12);
      }
      shape = {
        tag: "path",
        attrs: {
          d,
          class: "hyperedge-region",
          fill: color,
          "fill-opacity": 0.16,
          stroke: color,
          "stroke-opacity": 0.85
        }
      };
    }

    return {
      shape,
      label: {
        tag: "text",
        text: String(safeEdge.label || ""),
        attrs: {
          x: labelPoint.x,
          y: labelPoint.y,
          class: "hyperedge-label",
          fill: color
        }
      },
      memberPoints
    };
  }

  function clearDecompositionCanvas(env) {
    const options = rendererOptions(env);
    const canvas = env && env.canvas ? env.canvas : null;
    const documentRef = env && env.document ? env.document : (typeof document !== "undefined" ? document : null);
    if (!canvas) {
      return { viewport: null };
    }

    while (canvas.lastChild && canvas.lastChild.tagName !== "defs") {
      if (canvas.lastChild.id === "decomp-viewport") {
        canvas.lastChild.innerHTML = "";
        break;
      }
      canvas.removeChild(canvas.lastChild);
    }

    const hasBg = typeof canvas.querySelector === "function"
      ? canvas.querySelector("rect.canvas-bg")
      : null;
    let viewport = env && env.viewport ? env.viewport : null;
    if (!hasBg) {
      const bg = createSvg(documentRef, options.ns, "rect");
      setAttrs(bg, {
        x: 0,
        y: 0,
        width: options.width,
        height: options.height,
        class: "canvas-bg"
      });
      if (viewport && typeof canvas.insertBefore === "function") {
        canvas.insertBefore(bg, viewport);
      } else {
        canvas.appendChild(bg);
      }
    }

    if (!viewport) {
      viewport = typeof canvas.querySelector === "function"
        ? canvas.querySelector("#decomp-viewport")
        : null;
    }
    if (!viewport) {
      viewport = createSvg(documentRef, options.ns, "g");
      viewport.id = "decomp-viewport";
      canvas.appendChild(viewport);
    }

    return { viewport };
  }

  function prepareRenderTarget(env) {
    if (env && env.isDragging && env.viewport) {
      env.viewport.innerHTML = "";
      return env.viewport;
    }
    if (env && typeof env.clearCanvas === "function") {
      env.clearCanvas();
      return env.viewport || env.canvas;
    }
    const result = clearDecompositionCanvas(env);
    return result.viewport || (env && env.viewport) || (env && env.canvas) || null;
  }

  function drawHypergraphRegion(renderTarget, edge, nodeById, env) {
    const options = rendererOptions(env);
    const documentRef = env && env.document ? env.document : (typeof document !== "undefined" ? document : null);
    const plan = buildHypergraphRegionPlan(edge, nodeById, options);
    const shape = createSvg(documentRef, options.ns, plan.shape.tag);
    setAttrs(shape, plan.shape.attrs);
    renderTarget.appendChild(shape);

    const label = createSvg(documentRef, options.ns, plan.label.tag);
    setAttrs(label, plan.label.attrs);
    label.textContent = plan.label.text;
    renderTarget.appendChild(label);
  }

  function drawHypergraphLegend(renderTarget, graph, env) {
    const options = rendererOptions(env);
    const documentRef = env && env.document ? env.document : (typeof document !== "undefined" ? document : null);
    const edges = Array.isArray(graph && graph.hyperedges) ? graph.hyperedges : [];
    if (edges.length === 0) {
      return;
    }
    const group = createSvg(documentRef, options.ns, "g");
    group.setAttribute("transform", "translate(28 28)");
    const title = createSvg(documentRef, options.ns, "text");
    setAttrs(title, { x: 0, y: 0, class: "hypergraph-legend-title" });
    title.textContent = options.legendTitle;
    group.appendChild(title);

    edges.slice(0, 18).forEach((edge, index) => {
      const y = 20 + index * 18;
      const swatch = createSvg(documentRef, options.ns, "rect");
      setAttrs(swatch, {
        x: 0,
        y: y - 10,
        width: 13,
        height: 13,
        rx: 3,
        fill: edge.color || requireViewFunction("hypergraphColor")(edge.index),
        "fill-opacity": 0.7
      });
      group.appendChild(swatch);

      const text = createSvg(documentRef, options.ns, "text");
      setAttrs(text, { x: 20, y, class: "hypergraph-legend-text" });
      const members = Array.isArray(edge.members) && edge.members.length > 0 ? edge.members.join(",") : "∅";
      text.textContent = `${edge.label}: {${members}}`;
      group.appendChild(text);
    });

    if (edges.length > 18) {
      const text = createSvg(documentRef, options.ns, "text");
      setAttrs(text, { x: 0, y: 20 + 18 * 18, class: "hypergraph-legend-text" });
      text.textContent = `... +${options.formatInteger(edges.length - 18)}`;
      group.appendChild(text);
    }
    renderTarget.appendChild(group);
  }

  function drawHypergraphGraph(graph, env) {
    const options = rendererOptions(env);
    const documentRef = env && env.document ? env.document : (typeof document !== "undefined" ? document : null);
    const renderTarget = prepareRenderTarget(env);
    const nodes = graph && Array.isArray(graph.nodes) ? graph.nodes : [];
    if (!renderTarget || !env || !env.canvas || nodes.length === 0) {
      return { graph, nodes: nodes.length > 0 ? nodes : null };
    }

    const nodeById = new Map(nodes.map((node) => [node.id, node]));
    (graph.hyperedges || []).forEach((edge) => drawHypergraphRegion(renderTarget, edge, nodeById, env));
    nodes.forEach((node) => {
      const circle = createSvg(documentRef, options.ns, "circle");
      setAttrs(circle, {
        cx: node.x,
        cy: node.y,
        r: 28,
        class: "hypervertex-node"
      });
      renderTarget.appendChild(circle);

      const label = createSvg(documentRef, options.ns, "text");
      setAttrs(label, {
        x: node.x,
        y: node.y,
        class: "hypervertex-label"
      });
      label.textContent = String(node.label || node.id);
      renderTarget.appendChild(label);
    });
    drawHypergraphLegend(renderTarget, graph, env);
    return { graph, nodes };
  }

  function drawDecompositionGraph(graph, env) {
    if (graph && graph.type === "hypergraph") {
      return drawHypergraphGraph(graph, env);
    }
    const options = rendererOptions(env);
    const documentRef = env && env.document ? env.document : (typeof document !== "undefined" ? document : null);
    const renderTarget = prepareRenderTarget(env);
    const nodes = graph && Array.isArray(graph.nodes) ? graph.nodes : [];
    if (!renderTarget || !env || !env.canvas || nodes.length === 0) {
      return { graph, nodes: nodes.length > 0 ? nodes : null };
    }

    const nodeById = new Map(nodes.map((node) => [node.id, node]));
    const pairCounts = new Map();
    (graph.edges || []).forEach((edge) => {
      const key = `${edge.from}->${edge.to}`;
      pairCounts.set(key, (pairCounts.get(key) || 0) + 1);
    });
    const pairIndex = new Map();

    (graph.edges || []).forEach((edge) => {
      const fromNode = nodeById.get(edge.from);
      const toNode = nodeById.get(edge.to);
      if (!fromNode || !toNode) {
        return;
      }
      const key = `${edge.from}->${edge.to}`;
      const used = pairIndex.get(key) || 0;
      pairIndex.set(key, used + 1);
      const plan = buildDecompositionEdgePlan(edge, fromNode, toNode, used, pairCounts.get(key) || 1, options);
      const path = createSvg(documentRef, options.ns, "path");
      setAttrs(path, { class: plan.className, d: plan.d });
      renderTarget.appendChild(path);
      if (plan.label) {
        const text = createSvg(documentRef, options.ns, "text");
        setAttrs(text, { x: plan.labelX, y: plan.labelY, class: "arc-weight" });
        text.textContent = plan.label;
        renderTarget.appendChild(text);
      }
    });

    nodes.forEach((node) => {
      if (node.shape === "transition") {
        const rect = createSvg(documentRef, options.ns, "rect");
        setAttrs(rect, {
          x: Number(node.x) - options.transitionHalfW,
          y: Number(node.y) - options.transitionHalfH,
          width: options.transitionHalfW * 2,
          height: options.transitionHalfH * 2,
          transform: `rotate(${normalizeAngle(node.angle || 0)} ${node.x} ${node.y})`,
          class: `node-transition${node.critical ? " decomp-critical-node" : ""}`
        });
        renderTarget.appendChild(rect);
      } else {
        const circle = createSvg(documentRef, options.ns, "circle");
        setAttrs(circle, {
          cx: node.x,
          cy: node.y,
          r: options.placeRadius,
          class: `node-place${node.critical ? " decomp-critical-node" : ""}`
        });
        renderTarget.appendChild(circle);
      }

      if (node.shape !== "transition" && Number(node.tokens) > 0) {
        const token = createSvg(documentRef, options.ns, "text");
        setAttrs(token, {
          x: node.x,
          y: Number(node.y) + 5,
          class: "token-count"
        });
        token.textContent = String(node.tokens);
        renderTarget.appendChild(token);
      }

      const label = createSvg(documentRef, options.ns, "text");
      setAttrs(label, {
        x: node.x,
        y: Number(node.y) + (node.shape === "transition" ? 58 : 46),
        class: "node-label"
      });
      label.textContent = String(node.label || node.id);
      renderTarget.appendChild(label);
    });
    return { graph, nodes };
  }

  return {
    normalizeAngle,
    getConnectionPoint,
    buildDecompositionEdgePlan,
    buildHypergraphRegionPlan,
    clearDecompositionCanvas,
    drawHypergraphGraph,
    drawDecompositionGraph
  };
});
