(function(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("./i18n"));
  } else {
    root.PoohPnhCore = factory(root.PoohI18n);
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function(i18n) {
  "use strict";

function tr(key, params) {
  return i18n && typeof i18n.t === "function" ? i18n.t(key, params) : String(key || "");
}

function normalizeLine(line) {
  return String(line || "").replace(/^\uFEFF/, "").replace(/\u0000/g, "").trim();
}

function parseAttributes(raw) {
  const attrs = {};
  const pattern = /([A-Za-z_][A-Za-z0-9_-]*)=(?:"((?:\\.|[^"])*)"|([^\s]+))/g;
  let match = pattern.exec(String(raw || ""));
  while (match) {
    const key = match[1].toLowerCase();
    attrs[key] = match[2] !== undefined ? match[2].replace(/\\"/g, "\"") : match[3];
    match = pattern.exec(String(raw || ""));
  }
  return attrs;
}

function parseMetadata(lines) {
  return lines
    .map(normalizeLine)
    .filter((line) => line.startsWith(";"))
    .map((line) => {
      const body = line.slice(1).trim();
      const splitAt = body.includes("=") ? body.indexOf("=") : body.indexOf(":");
      if (splitAt > 0) {
        return {
          key: body.slice(0, splitAt).trim(),
          value: body.slice(splitAt + 1).trim(),
          raw: body
        };
      }
      return { key: "Info", value: body, raw: body };
    })
    .filter((entry) => entry.value);
}

function getMetadata(metadata, key) {
  const lowered = String(key).toLowerCase();
  const found = metadata.find((entry) => String(entry.key).toLowerCase() === lowered);
  return found ? String(found.value) : "";
}

function parseNameList(raw, expectedCount, fallbackPrefix) {
  const parts = String(raw || "").split(";").map((part) => part.trim()).filter(Boolean);
  return Array.from({ length: expectedCount }, (_, index) => parts[index] || `${fallbackPrefix}${index + 1}`);
}

function parseMarking(raw, placeCount) {
  const compact = String(raw || "").replace(/\s+/g, "");
  if (new RegExp(`^[0-9]{${placeCount}}$`).test(compact)) {
    return compact.split("").map((char) => Number.parseInt(char, 10));
  }
  const parts = String(raw || "").split(/[\s,;]+/).map((part) => part.trim()).filter(Boolean);
  if (parts.length !== placeCount) {
    throw new Error(tr("core.pnh.initialMarkingRowInvalid"));
  }
  return parts.map((part) => {
    const value = Number.parseInt(part, 10);
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(tr("core.pnh.initialMarkingValueInvalid"));
    }
    return value;
  });
}

function findMatrixHeaderIndex(dataLines) {
  for (let index = 0; index < dataLines.length - 1; index += 1) {
    const places = Number.parseInt(dataLines[index], 10);
    const transitions = Number.parseInt(dataLines[index + 1], 10);
    if (!Number.isInteger(places) || places <= 0 || !Number.isInteger(transitions) || transitions <= 0) {
      continue;
    }
    const candidate = normalizeLine(dataLines[index + 2] || "").replace(/\s+/g, "");
    if (/^[xX0-9]+$/.test(candidate)) {
      return index;
    }
  }
  return -1;
}

function parseMatrixPnh(dataLines, metadata) {
  const placeCount = Number.parseInt(dataLines[0], 10);
  const declaredTransitionCount = Number.parseInt(dataLines[1], 10);
  if (!Number.isInteger(placeCount) || placeCount <= 0 || !Number.isInteger(declaredTransitionCount) || declaredTransitionCount <= 0) {
    throw new Error(tr("core.pnh.matrixHeaderInvalid"));
  }

  const payload = dataLines.slice(2).map(normalizeLine).filter(Boolean);
  if (payload.length < 2) {
    throw new Error(tr("core.pnh.matrixPayloadTooShort"));
  }
  const marking = parseMarking(payload[payload.length - 1], placeCount);
  const matrixRows = payload.slice(0, -1).map((row) => row.replace(/\s+/g, ""));
  const transitionCount = matrixRows.length;
  const placeLabels = parseNameList(getMetadata(metadata, "Places"), placeCount, "P");
  const transitionLabels = parseNameList(getMetadata(metadata, "Transitions"), transitionCount, "t");

  const nodes = [];
  for (let index = 0; index < placeCount; index += 1) {
    nodes.push({
      id: `P${index + 1}`,
      type: "place",
      label: placeLabels[index],
      tokens: marking[index],
      x: null,
      y: null,
      angle: 0
    });
  }
  for (let index = 0; index < transitionCount; index += 1) {
    nodes.push({
      id: `T${index + 1}`,
      type: "transition",
      label: transitionLabels[index],
      tokens: 0,
      x: null,
      y: null,
      angle: 0
    });
  }

  const arcs = [];
  let arcCounter = 1;
  matrixRows.forEach((row, transitionIndex) => {
    if (row.length !== placeCount) {
      throw new Error(tr("core.pnh.matrixColumnCount", { row: transitionIndex + 1, actual: row.length, expected: placeCount }));
    }
    for (let placeIndex = 0; placeIndex < placeCount; placeIndex += 1) {
      const symbol = row[placeIndex];
      const placeId = `P${placeIndex + 1}`;
      const transitionId = `T${transitionIndex + 1}`;
      if (symbol === "x" || symbol === "X") {
        arcs.push({ id: `A${arcCounter++}`, from: placeId, to: transitionId, weight: 1 });
      } else if (/^[1-9]$/.test(symbol)) {
        arcs.push({ id: `A${arcCounter++}`, from: transitionId, to: placeId, weight: Number.parseInt(symbol, 10) });
      } else if (symbol !== "0") {
        throw new Error(tr("core.pnh.matrixSymbolUnknown", { symbol }));
      }
    }
  });

  return {
    format: "matrix",
    nodes,
    arcs,
    metadata,
    warnings: declaredTransitionCount === transitionCount ? [] : [tr("core.pnh.transitionCountMismatch", { declared: declaredTransitionCount, parsed: transitionCount })]
  };
}

function parseSectionPnh(lines, metadata) {
  const places = new Map();
  const transitions = new Map();
  const arcs = [];
  const markings = new Map();
  let section = "";

  lines.forEach((raw, index) => {
    const line = normalizeLine(raw);
    if (!line || line.startsWith(";") || line.startsWith("#") || line.startsWith("//") || /^PNH\b/i.test(line)) {
      return;
    }
    if (/^META\b/i.test(line)) {
      const attrs = parseAttributes(line.slice(4));
      Object.keys(attrs).forEach((key) => {
        metadata.push({ key: `META.${key}`, value: String(attrs[key]), raw: `${key}=${attrs[key]}` });
      });
      return;
    }
    if (/^END\b/i.test(line)) {
      return;
    }
    if (/^\[[A-Za-z_]+\]$/.test(line)) {
      section = line.slice(1, -1).toUpperCase();
      return;
    }
    if (section === "PLACES") {
      const parts = line.match(/^(\S+)(?:\s+(.*))?$/);
      if (!parts) throw new Error(tr("core.pnh.sectionLineInvalid", { section: "PLACES", line: index + 1 }));
      const attrs = parseAttributes(parts[2] || "");
      places.set(parts[1], {
        id: parts[1],
        type: "place",
        label: attrs.label || parts[1],
        tokens: Math.max(0, Number.parseInt(attrs.tokens || "0", 10) || 0),
        x: attrs.x === undefined ? null : Number(attrs.x),
        y: attrs.y === undefined ? null : Number(attrs.y),
        angle: 0
      });
      return;
    }
    if (section === "TRANSITIONS") {
      const parts = line.match(/^(\S+)(?:\s+(.*))?$/);
      if (!parts) throw new Error(tr("core.pnh.sectionLineInvalid", { section: "TRANSITIONS", line: index + 1 }));
      const attrs = parseAttributes(parts[2] || "");
      transitions.set(parts[1], {
        id: parts[1],
        type: "transition",
        label: attrs.label || parts[1],
        tokens: 0,
        x: attrs.x === undefined ? null : Number(attrs.x),
        y: attrs.y === undefined ? null : Number(attrs.y),
        angle: ((Number.parseInt(attrs.angle || "0", 10) || 0) % 360 + 360) % 360
      });
      return;
    }
    if (section === "ARCS") {
      const parts = line.match(/^(\S+)\s+(\S+)\s*->\s*(\S+)(?:\s+(.*))?$/);
      if (!parts) throw new Error(tr("core.pnh.sectionLineInvalid", { section: "ARCS", line: index + 1 }));
      const attrs = parseAttributes(parts[4] || "");
      arcs.push({
        id: parts[1],
        from: parts[2],
        to: parts[3],
        weight: Math.max(1, Number.parseInt(attrs.weight || "1", 10) || 1)
      });
      return;
    }
    if (section === "MARKING") {
      const parts = line.match(/^(\S+)\s*=\s*(-?\d+)$/);
      if (!parts) throw new Error(tr("core.pnh.sectionLineInvalid", { section: "MARKING", line: index + 1 }));
      markings.set(parts[1], Math.max(0, Number.parseInt(parts[2], 10)));
    }
  });

  markings.forEach((tokens, placeId) => {
    if (places.has(placeId)) {
      places.get(placeId).tokens = tokens;
    }
  });

  const nodes = [...places.values(), ...transitions.values()];
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  arcs.forEach((arc) => {
    const from = nodeById.get(arc.from);
    const to = nodeById.get(arc.to);
    if (!from || !to) throw new Error(tr("core.pnh.arcNodeMissing", { id: arc.id }));
    if (from.type === to.type) throw new Error(tr("core.pnh.arcBipartite", { id: arc.id }));
  });
  if (nodes.length === 0) {
    throw new Error(tr("core.pnh.sectionNoNodes"));
  }
  return { format: "section", nodes, arcs, metadata, warnings: [] };
}

function parsePnhText(rawText) {
  const lines = String(rawText || "").split(/\r?\n/);
  const metadata = parseMetadata(lines);
  const dataLines = lines.map(normalizeLine).filter((line) => line && !line.startsWith(";") && !line.startsWith("#") && !line.startsWith("//"));
  const matrixStart = findMatrixHeaderIndex(dataLines);
  if (matrixStart >= 0) {
    try {
      return parseMatrixPnh(dataLines.slice(matrixStart), metadata);
    } catch (matrixError) {
      try {
        return parseSectionPnh(lines, metadata);
      } catch (_) {
        throw matrixError;
      }
    }
  }
  return parseSectionPnh(lines, metadata);
}

function escapeQuoted(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\r/g, "\\r").replace(/\n/g, "\\n");
}

function exportSectionPnh(net) {
  const nodes = Array.isArray(net && net.nodes) ? net.nodes : [];
  const arcs = Array.isArray(net && net.arcs) ? net.arcs : [];
  const places = nodes.filter((node) => node.type === "place");
  const transitions = nodes.filter((node) => node.type === "transition");
  const lines = ["PNH 1.0", "META generated=POOH-core", "", "[PLACES]"];
  places.forEach((place) => {
    lines.push(`${place.id} label="${escapeQuoted(place.label || place.id)}" tokens=${Number(place.tokens || 0)} x=${Number(place.x || 0)} y=${Number(place.y || 0)}`);
  });
  lines.push("", "[TRANSITIONS]");
  transitions.forEach((transition) => {
    lines.push(`${transition.id} label="${escapeQuoted(transition.label || transition.id)}" x=${Number(transition.x || 0)} y=${Number(transition.y || 0)} angle=${Number(transition.angle || 0)}`);
  });
  lines.push("", "[ARCS]");
  arcs.forEach((arc) => {
    lines.push(`${arc.id} ${arc.from} -> ${arc.to} weight=${Math.max(1, Number(arc.weight || 1))}`);
  });
  lines.push("", "[MARKING]");
  places.forEach((place) => {
    lines.push(`${place.id}=${Number(place.tokens || 0)}`);
  });
  lines.push("", "END", "");
  return lines.join("\n");
}

return {
  parsePnhText,
  exportSectionPnh,
  parseAttributes
};
});
