(function(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("./i18n"));
  } else {
    root.PoohPetriLayoutCore = factory(root.PoohI18n);
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function(i18n) {
  "use strict";

  function tr(key, params) {
    return i18n && typeof i18n.t === "function" ? i18n.t(key, params) : String(key || "");
  }

  const DEFAULT_LAYOUT_MODE = "smart";
  const DEFAULT_WIDTH = 1600;
  const DEFAULT_HEIGHT = 900;
  const DEFAULT_PADDING = 70;
  const DEFAULT_CLAMP_MARGIN = 36;

  function normalizeLayoutOptions(options) {
    const source = options && typeof options === "object" ? options : {};
    const width = Number(source.width);
    const height = Number(source.height);
    const padding = Number(source.padding);
    const clampMargin = Number(source.clampMargin);
    return {
      width: Number.isFinite(width) && width > 0 ? width : DEFAULT_WIDTH,
      height: Number.isFinite(height) && height > 0 ? height : DEFAULT_HEIGHT,
      padding: Number.isFinite(padding) && padding >= 0 ? padding : DEFAULT_PADDING,
      clampMargin: Number.isFinite(clampMargin) && clampMargin >= 0 ? clampMargin : DEFAULT_CLAMP_MARGIN,
      defaultLayoutMode: String(source.defaultLayoutMode || DEFAULT_LAYOUT_MODE)
    };
  }

  function normalizeAngle(value) {
    const snapped = Math.round((Number(value) || 0) / 45) * 45;
    return ((snapped % 360) + 360) % 360;
  }

  function normalizeMetadata(entries) {
    if (!Array.isArray(entries)) {
      return [];
    }
    return entries
      .map((entry) => {
        if (!entry || typeof entry !== "object") {
          return null;
        }
        const key = String(entry.key || "Info").trim() || "Info";
        const value = String(entry.value || "").trim();
        if (!value) {
          return null;
        }
        return {
          key,
          value,
          raw: String(entry.raw || `${key}: ${value}`)
        };
      })
      .filter(Boolean);
  }

  function inferCounter(prefix, items) {
    const numbers = (Array.isArray(items) ? items : [])
      .map((item) => String(item && item.id ? item.id : ""))
      .filter((id) => id.startsWith(prefix))
      .map((id) => parseInt(id.slice(prefix.length), 10))
      .filter((num) => Number.isInteger(num));
    return numbers.length ? Math.max(...numbers) : 0;
  }

  function clampToCanvas(point, options) {
    const ctx = normalizeLayoutOptions(options);
    const margin = Math.min(ctx.clampMargin, ctx.width / 2, ctx.height / 2);
    return {
      x: Math.max(margin, Math.min(ctx.width - margin, Number(point && point.x) || 0)),
      y: Math.max(margin, Math.min(ctx.height - margin, Number(point && point.y) || 0))
    };
  }

  function hasCoordinateSpread(nodes) {
    const safeNodes = Array.isArray(nodes) ? nodes : [];
    const withCoords = safeNodes.filter((node) => Number.isFinite(node.x) && Number.isFinite(node.y));
    if (withCoords.length < Math.ceil(safeNodes.length * 0.6)) {
      return false;
    }
    const xs = withCoords.map((node) => Number(node.x));
    const ys = withCoords.map((node) => Number(node.y));
    return Math.max(...xs) - Math.min(...xs) >= 40 || Math.max(...ys) - Math.min(...ys) >= 40;
  }

  function fitLayoutToCanvas(nodes, options) {
    const safeNodes = Array.isArray(nodes) ? nodes : [];
    const ctx = normalizeLayoutOptions(options);
    if (safeNodes.length === 0) {
      return [];
    }
    const xs = safeNodes.map((node) => node.x);
    const ys = safeNodes.map((node) => node.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const spreadX = Math.max(1, maxX - minX);
    const spreadY = Math.max(1, maxY - minY);
    const usableW = ctx.width - ctx.padding * 2;
    const usableH = ctx.height - ctx.padding * 2;
    const scale = Math.min(usableW / spreadX, usableH / spreadY);
    const offsetX = (usableW - spreadX * scale) / 2;
    const offsetY = (usableH - spreadY * scale) / 2;
    return safeNodes.map((node) => ({
      ...node,
      x: ctx.padding + offsetX + (node.x - minX) * scale,
      y: ctx.padding + offsetY + (node.y - minY) * scale
    }));
  }

  function buildUndirectedAdjacency(nodes, arcs) {
    const adjacency = new Map((Array.isArray(nodes) ? nodes : []).map((node) => [node.id, new Set()]));
    (Array.isArray(arcs) ? arcs : []).forEach((arc) => {
      if (!adjacency.has(arc.from) || !adjacency.has(arc.to)) {
        return;
      }
      adjacency.get(arc.from).add(arc.to);
      adjacency.get(arc.to).add(arc.from);
    });
    return adjacency;
  }

  function getConnectedComponents(nodeIds, adjacency) {
    const remaining = new Set(Array.isArray(nodeIds) ? nodeIds : []);
    const components = [];
    while (remaining.size > 0) {
      const start = remaining.values().next().value;
      const queue = [start];
      const component = [];
      remaining.delete(start);
      while (queue.length > 0) {
        const current = queue.shift();
        component.push(current);
        const neighbors = adjacency.get(current) || new Set();
        neighbors.forEach((neighbor) => {
          if (!remaining.has(neighbor)) {
            return;
          }
          remaining.delete(neighbor);
          queue.push(neighbor);
        });
      }
      components.push(component);
    }
    return components;
  }

  function chooseComponentRoot(componentIds, adjacency, nodeMap) {
    return componentIds
      .slice()
      .sort((a, b) => {
        const degreeDiff = (adjacency.get(b) || new Set()).size - (adjacency.get(a) || new Set()).size;
        if (degreeDiff !== 0) {
          return degreeDiff;
        }
        const typeA = nodeMap.get(a).type === "place" ? 0 : 1;
        const typeB = nodeMap.get(b).type === "place" ? 0 : 1;
        if (typeA !== typeB) {
          return typeA - typeB;
        }
        return a.localeCompare(b, "pl");
      })[0];
  }

  function assignLayerDepths(componentIds, rootId, adjacency) {
    const componentSet = new Set(componentIds);
    const depths = new Map([[rootId, 0]]);
    const queue = [rootId];
    let cursor = 0;
    while (cursor < queue.length) {
      const current = queue[cursor++];
      const currentDepth = depths.get(current) || 0;
      const neighbors = adjacency.get(current) || new Set();
      neighbors.forEach((neighbor) => {
        if (!componentSet.has(neighbor) || depths.has(neighbor)) {
          return;
        }
        depths.set(neighbor, currentDepth + 1);
        queue.push(neighbor);
      });
    }
    componentIds.forEach((id) => {
      if (!depths.has(id)) {
        depths.set(id, 0);
      }
    });
    return depths;
  }

  function orientDepthsForDirection(componentIds, depths, arcs) {
    const componentSet = new Set(componentIds);
    let score = 0;
    (Array.isArray(arcs) ? arcs : []).forEach((arc) => {
      if (!componentSet.has(arc.from) || !componentSet.has(arc.to)) {
        return;
      }
      const fromDepth = depths.get(arc.from) || 0;
      const toDepth = depths.get(arc.to) || 0;
      score += fromDepth <= toDepth ? 1 : -1;
    });

    if (score >= 0) {
      return depths;
    }

    const maxDepth = Math.max(...Array.from(depths.values()));
    const reversed = new Map();
    depths.forEach((value, id) => {
      reversed.set(id, maxDepth - value);
    });
    return reversed;
  }

  function buildLayersFromDepths(componentIds, depths, nodeMap) {
    const layersMap = new Map();
    componentIds.forEach((id) => {
      const depth = depths.get(id) || 0;
      if (!layersMap.has(depth)) {
        layersMap.set(depth, []);
      }
      layersMap.get(depth).push(id);
    });

    return Array.from(layersMap.keys())
      .sort((a, b) => a - b)
      .map((depth) => layersMap.get(depth).slice().sort((a, b) => {
        const nodeA = nodeMap.get(a);
        const nodeB = nodeMap.get(b);
        if (nodeA.type !== nodeB.type) {
          return nodeA.type === "place" ? -1 : 1;
        }
        return a.localeCompare(b, "pl");
      }));
  }

  function reorderLayerByNeighborBarycenter(layerIds, anchorIds, adjacency) {
    if (!anchorIds || anchorIds.length === 0 || layerIds.length <= 1) {
      return layerIds.slice();
    }

    const positions = new Map(anchorIds.map((id, index) => [id, index]));
    return layerIds
      .map((id, index) => {
        const neighbors = Array.from(adjacency.get(id) || new Set())
          .filter((neighbor) => positions.has(neighbor))
          .map((neighbor) => positions.get(neighbor));
        const barycenter = neighbors.length === 0
          ? index
          : neighbors.reduce((sum, value) => sum + value, 0) / neighbors.length;
        return { id, barycenter, index };
      })
      .sort((a, b) => (a.barycenter - b.barycenter) || (a.index - b.index))
      .map((entry) => entry.id);
  }

  function reduceCrossingsInLayers(layers, adjacency) {
    const ordered = layers.map((layer) => layer.slice());
    if (ordered.length <= 1) {
      return ordered;
    }
    for (let sweep = 0; sweep < 6; sweep += 1) {
      for (let i = 1; i < ordered.length; i += 1) {
        ordered[i] = reorderLayerByNeighborBarycenter(ordered[i], ordered[i - 1], adjacency);
      }
      for (let i = ordered.length - 2; i >= 0; i -= 1) {
        ordered[i] = reorderLayerByNeighborBarycenter(ordered[i], ordered[i + 1], adjacency);
      }
    }
    return ordered;
  }

  function placeComponentLayers(layers, nodeMap, xOffset, columnGap, rowGap) {
    const placed = [];
    layers.forEach((layer, layerIndex) => {
      const centerOffset = (layer.length - 1) / 2;
      layer.forEach((id, rowIndex) => {
        const source = nodeMap.get(id);
        placed.push({
          ...source,
          x: xOffset + layerIndex * columnGap,
          y: (rowIndex - centerOffset) * rowGap
        });
      });
    });
    return placed;
  }

  function layoutLayered(nodes, arcs, options) {
    const safeNodes = Array.isArray(nodes) ? nodes : [];
    const ctx = normalizeLayoutOptions(options);
    if (safeNodes.length <= 1) {
      return safeNodes.map((node) => ({ ...node, x: ctx.width / 2, y: ctx.height / 2 }));
    }
    const nodeMap = new Map(safeNodes.map((node) => [node.id, node]));
    const adjacency = buildUndirectedAdjacency(safeNodes, arcs);
    const components = getConnectedComponents(safeNodes.map((node) => node.id), adjacency)
      .sort((a, b) => b.length - a.length);

    const columnGap = 190;
    const rowGap = 90;
    const componentGap = 220;
    let xOffset = 0;
    const placed = [];

    components.forEach((componentIds) => {
      const rootId = chooseComponentRoot(componentIds, adjacency, nodeMap);
      const depths = orientDepthsForDirection(componentIds, assignLayerDepths(componentIds, rootId, adjacency), arcs);
      const layers = buildLayersFromDepths(componentIds, depths, nodeMap);
      const orderedLayers = reduceCrossingsInLayers(layers, adjacency);
      placed.push(...placeComponentLayers(orderedLayers, nodeMap, xOffset, columnGap, rowGap));
      xOffset += Math.max(1, orderedLayers.length - 1) * columnGap + componentGap;
    });

    return fitLayoutToCanvas(placed, ctx);
  }

  function buildBfsLevels(nodes, adjacency, rootId) {
    const levels = new Map([[rootId, 0]]);
    const queue = [rootId];
    let cursor = 0;
    while (cursor < queue.length) {
      const current = queue[cursor++];
      const level = levels.get(current) || 0;
      const neighbors = adjacency.get(current) || new Set();
      neighbors.forEach((neighbor) => {
        if (levels.has(neighbor)) {
          return;
        }
        levels.set(neighbor, level + 1);
        queue.push(neighbor);
      });
    }
    nodes.forEach((node) => {
      if (!levels.has(node.id)) {
        levels.set(node.id, 0);
      }
    });
    return levels;
  }

  function layoutRadial(nodes, arcs, options) {
    const safeNodes = Array.isArray(nodes) ? nodes : [];
    const ctx = normalizeLayoutOptions(options);
    if (safeNodes.length <= 1) {
      return safeNodes.map((node) => ({ ...node, x: ctx.width / 2, y: ctx.height / 2 }));
    }

    const nodeMap = new Map(safeNodes.map((node) => [node.id, node]));
    const adjacency = buildUndirectedAdjacency(safeNodes, arcs);
    const components = getConnectedComponents(safeNodes.map((node) => node.id), adjacency)
      .sort((a, b) => b.length - a.length);

    const centers = [];
    const cols = Math.ceil(Math.sqrt(components.length));
    const spacing = 560;
    components.forEach((_, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      centers.push({ x: col * spacing, y: row * spacing });
    });

    const placed = [];
    components.forEach((componentIds, index) => {
      const rootId = chooseComponentRoot(componentIds, adjacency, nodeMap);
      const levels = buildBfsLevels(componentIds.map((id) => nodeMap.get(id)), adjacency, rootId);
      const byLevel = new Map();
      componentIds.forEach((id) => {
        const level = levels.get(id) || 0;
        if (!byLevel.has(level)) {
          byLevel.set(level, []);
        }
        byLevel.get(level).push(id);
      });

      const center = centers[index];
      Array.from(byLevel.keys()).sort((a, b) => a - b).forEach((level) => {
        const ids = byLevel.get(level).slice().sort((a, b) => a.localeCompare(b, "pl"));
        const radius = level === 0 ? 0 : 120 + (level - 1) * 110;
        ids.forEach((id, pos) => {
          const angle = ids.length === 1 ? -Math.PI / 2 : (2 * Math.PI * pos) / ids.length - Math.PI / 2;
          const source = nodeMap.get(id);
          placed.push({
            ...source,
            x: center.x + Math.cos(angle) * radius,
            y: center.y + Math.sin(angle) * radius
          });
        });
      });
    });

    return fitLayoutToCanvas(placed, ctx);
  }

  function layoutOrganic(nodes, arcs, options) {
    const safeNodes = Array.isArray(nodes) ? nodes : [];
    const ctx = normalizeLayoutOptions(options);
    if (safeNodes.length <= 1) {
      return safeNodes.map((node) => ({ ...node, x: ctx.width / 2, y: ctx.height / 2 }));
    }

    const start = layoutRadial(safeNodes, arcs, ctx).map((node) => ({ ...node }));
    const indexById = new Map(start.map((node, index) => [node.id, index]));
    const positions = start.map((node) => ({ x: node.x, y: node.y }));
    const velocities = start.map(() => ({ x: 0, y: 0 }));

    const springs = (Array.isArray(arcs) ? arcs : [])
      .map((arc) => {
        const a = indexById.get(arc.from);
        const b = indexById.get(arc.to);
        if (a === undefined || b === undefined) {
          return null;
        }
        return { a, b, target: 145 + Math.min(80, arc.weight * 8) };
      })
      .filter(Boolean);

    const repulsion = 9800;
    const springK = 0.014;
    const damping = 0.83;
    const iterations = 220;

    for (let iter = 0; iter < iterations; iter += 1) {
      const forces = positions.map(() => ({ x: 0, y: 0 }));

      for (let i = 0; i < positions.length; i += 1) {
        for (let j = i + 1; j < positions.length; j += 1) {
          const dx = positions[j].x - positions[i].x;
          const dy = positions[j].y - positions[i].y;
          const distSq = dx * dx + dy * dy + 0.1;
          const dist = Math.sqrt(distSq);
          const force = repulsion / distSq;
          const ux = dx / dist;
          const uy = dy / dist;
          forces[i].x -= ux * force;
          forces[i].y -= uy * force;
          forces[j].x += ux * force;
          forces[j].y += uy * force;
        }
      }

      springs.forEach((edge) => {
        const pA = positions[edge.a];
        const pB = positions[edge.b];
        const dx = pB.x - pA.x;
        const dy = pB.y - pA.y;
        const dist = Math.hypot(dx, dy) || 0.001;
        const stretch = dist - edge.target;
        const fx = (dx / dist) * stretch * springK;
        const fy = (dy / dist) * stretch * springK;
        forces[edge.a].x += fx;
        forces[edge.a].y += fy;
        forces[edge.b].x -= fx;
        forces[edge.b].y -= fy;
      });

      for (let i = 0; i < positions.length; i += 1) {
        velocities[i].x = (velocities[i].x + forces[i].x) * damping;
        velocities[i].y = (velocities[i].y + forces[i].y) * damping;
        positions[i].x += velocities[i].x;
        positions[i].y += velocities[i].y;
      }
    }

    const merged = start.map((node, index) => ({ ...node, x: positions[index].x, y: positions[index].y }));
    return fitLayoutToCanvas(merged, ctx);
  }

  function normalizeCoordinates(nodes, fallbackNodes, options) {
    const safeNodes = Array.isArray(nodes) ? nodes : [];
    const ctx = normalizeLayoutOptions(options);
    const withCoords = safeNodes.filter((node) => Number.isFinite(node.x) && Number.isFinite(node.y));
    const xs = withCoords.map((node) => Number(node.x));
    const ys = withCoords.map((node) => Number(node.y));
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const spreadX = Math.max(1, maxX - minX);
    const spreadY = Math.max(1, maxY - minY);
    const usableW = ctx.width - ctx.padding * 2;
    const usableH = ctx.height - ctx.padding * 2;
    const scale = Math.min(usableW / spreadX, usableH / spreadY);
    const offsetX = (usableW - spreadX * scale) / 2;
    const offsetY = (usableH - spreadY * scale) / 2;
    const fallbackMap = new Map((Array.isArray(fallbackNodes) ? fallbackNodes : []).map((node) => [node.id, node]));

    return safeNodes.map((node) => {
      if (Number.isFinite(node.x) && Number.isFinite(node.y)) {
        return {
          ...node,
          x: ctx.padding + offsetX + (Number(node.x) - minX) * scale,
          y: ctx.padding + offsetY + (Number(node.y) - minY) * scale
        };
      }

      const fallback = fallbackMap.get(node.id);
      return {
        ...node,
        x: fallback ? fallback.x : ctx.width / 2,
        y: fallback ? fallback.y : ctx.height / 2
      };
    });
  }

  function spreadOverlaps(nodes) {
    const result = (Array.isArray(nodes) ? nodes : []).map((node) => ({ ...node }));
    const minimumDistance = 72;

    for (let iteration = 0; iteration < 12; iteration += 1) {
      for (let i = 0; i < result.length; i += 1) {
        for (let j = i + 1; j < result.length; j += 1) {
          const a = result[i];
          const b = result[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const distance = Math.hypot(dx, dy) || 0.001;
          if (distance >= minimumDistance) {
            continue;
          }
          const push = (minimumDistance - distance) / 2;
          const ux = dx / distance;
          const uy = dy / distance;
          a.x -= ux * push;
          a.y -= uy * push;
          b.x += ux * push;
          b.y += uy * push;
        }
      }
    }

    return result;
  }

  function layoutNodesByMode(nodes, arcs, modeName, options) {
    const ctx = normalizeLayoutOptions(options);
    const mode = modeName || ctx.defaultLayoutMode;
    if (mode === "layered") {
      return spreadOverlaps(layoutLayered(nodes, arcs, ctx));
    }
    if (mode === "radial") {
      return spreadOverlaps(layoutRadial(nodes, arcs, ctx));
    }
    if (mode === "organic") {
      return spreadOverlaps(layoutOrganic(nodes, arcs, ctx));
    }

    if (mode === "coordinates") {
      if (hasCoordinateSpread(nodes)) {
        return spreadOverlaps(normalizeCoordinates(nodes, layoutLayered(nodes, arcs, ctx), ctx));
      }
      return spreadOverlaps(layoutLayered(nodes, arcs, ctx));
    }

    if (mode === "smart") {
      if (hasCoordinateSpread(nodes)) {
        return spreadOverlaps(normalizeCoordinates(nodes, layoutLayered(nodes, arcs, ctx), ctx));
      }
      return spreadOverlaps(layoutLayered(nodes, arcs, ctx));
    }

    return spreadOverlaps(layoutLayered(nodes, arcs, ctx));
  }

  function layoutImportedNodes(nodes, arcs, modeName, options) {
    const ctx = normalizeLayoutOptions(options);
    const laidOut = layoutNodesByMode(nodes, arcs, modeName, ctx);
    return laidOut.map((node) => {
      const clamped = clampToCanvas({ x: node.x, y: node.y }, ctx);
      return {
        ...node,
        x: clamped.x,
        y: clamped.y,
        angle: node.type === "transition" ? normalizeAngle(node.angle || 0) : 0
      };
    });
  }

  function buildImportedStateFromParsedPnh(parsed, layoutMode, options) {
    if (!parsed || !Array.isArray(parsed.nodes) || !Array.isArray(parsed.arcs)) {
      throw new Error(tr("core.petriLayout.invalidParserResult"));
    }
    const ctx = normalizeLayoutOptions(options);
    const mode = String(layoutMode || ctx.defaultLayoutMode || DEFAULT_LAYOUT_MODE);
    const nodes = parsed.nodes.map((node) => ({
      id: String(node.id || "").trim(),
      type: node.type === "transition" ? "transition" : "place",
      label: String(node.label || node.id || "").trim() || String(node.id || ""),
      tokens: node.type === "place" ? Math.max(0, parseInt(String(node.tokens || 0), 10) || 0) : 0,
      x: Number.isFinite(Number(node.x)) ? Number(node.x) : null,
      y: Number.isFinite(Number(node.y)) ? Number(node.y) : null,
      angle: node.type === "transition" ? normalizeAngle(node.angle || 0) : 0
    }));
    const arcs = parsed.arcs.map((arc) => ({
      id: String(arc.id || "").trim(),
      from: String(arc.from || "").trim(),
      to: String(arc.to || "").trim(),
      weight: Math.max(1, parseInt(String(arc.weight || 1), 10) || 1)
    }));
    const metadata = normalizeMetadata(parsed.metadata || []);
    (Array.isArray(parsed.warnings) ? parsed.warnings : []).forEach((warning) => {
      const text = String(warning || "").trim();
      if (text) {
        metadata.push({ key: "ImportWarning", value: text, raw: "core-warning" });
      }
    });
    const laidOutNodes = layoutImportedNodes(nodes, arcs, mode, ctx);
    return {
      nodes: laidOutNodes,
      arcs,
      metadata: normalizeMetadata(metadata),
      counters: {
        place: inferCounter("P", nodes) + 1,
        transition: inferCounter("T", nodes) + 1,
        arc: inferCounter("A", arcs) + 1
      },
      settings: {
        layoutMode: mode
      }
    };
  }

  return {
    normalizeAngle,
    normalizeMetadata,
    inferCounter,
    clampToCanvas,
    hasCoordinateSpread,
    buildUndirectedAdjacency,
    layoutNodesByMode,
    layoutImportedNodes,
    buildImportedStateFromParsedPnh
  };
});
