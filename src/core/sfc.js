(function(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("./i18n"));
  } else {
    root.PoohSfcCore = factory(root.PoohI18n);
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function(i18n) {
  "use strict";

  function tr(key, params) {
    return i18n && typeof i18n.t === "function" ? i18n.t(key, params) : String(key || "");
  }

  let progressSink = null;

  function setProgressSink(callback) {
    progressSink = typeof callback === "function" ? callback : null;
  }

  function clearProgressSink() {
    progressSink = null;
  }

function nowMs() {
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    return performance.now();
  }
  return Date.now();
}

function asInt(value, fallback) {
  const parsed = parseInt(String(value), 10);
  if (Number.isFinite(parsed)) {
    return parsed;
  }
  return Number.isFinite(fallback) ? fallback : 0;
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
    const aNum = asInt(aMatch[2], 0);
    const bNum = asInt(bMatch[2], 0);
    if (aNum !== bNum) {
      return aNum - bNum;
    }
  }
  return aText.localeCompare(bText, "pl", { numeric: true, sensitivity: "base" });
}

function postProgress(jobId, message) {
  if (typeof progressSink === "function") {
    progressSink({
      type: "progress",
      jobId,
      message: String(message || "Przetwarzanie...")
    });
  }
}

function safeBool(value) {
  return Boolean(value);
}

function xmlEscape(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function stIdent(value) {
  return String(value || "")
    .replace(/[^A-Za-z0-9_]/g, "_")
    .replace(/^[0-9]/, "_$&")
    .replace(/_+/g, "_");
}

function transitionSignalName(transitionId) {
  return `TR_${stIdent(transitionId)}`;
}

function cloneArray(values) {
  return Array.isArray(values) ? values.slice() : [];
}

function normalizeProfile(value) {
  return String(value || "").toLowerCase() === "strict" ? "strict" : "hybrid";
}

function normalizeSync(value) {
  return String(value || "").toLowerCase() === "none" ? "none" : "handshake";
}

function buildNet(netPayload) {
  const payload = netPayload && typeof netPayload === "object" ? netPayload : {};
  const nodes = Array.isArray(payload.nodes) ? payload.nodes : [];
  const arcs = Array.isArray(payload.arcs) ? payload.arcs : [];

  const places = nodes
    .filter((node) => node && node.type === "place" && node.id)
    .map((node) => ({
      id: String(node.id),
      label: String(node.label || node.id),
      tokens: Math.max(0, asInt(node.tokens, 0))
    }))
    .sort((a, b) => naturalLabelCompare(a.id, b.id));

  const transitions = nodes
    .filter((node) => node && node.type === "transition" && node.id)
    .map((node) => ({
      id: String(node.id),
      label: String(node.label || node.id),
      pre: [],
      post: []
    }))
    .sort((a, b) => naturalLabelCompare(a.id, b.id));

  const placeById = new Map(places.map((place) => [place.id, place]));
  const transitionById = new Map(transitions.map((transition) => [transition.id, transition]));

  arcs.forEach((arc) => {
    const from = String(arc && arc.from ? arc.from : "");
    const to = String(arc && arc.to ? arc.to : "");
    const weight = Math.max(1, asInt(arc && arc.weight, 1));
    const fromPlace = placeById.get(from);
    const toPlace = placeById.get(to);
    const fromTransition = transitionById.get(from);
    const toTransition = transitionById.get(to);

    if (fromPlace && toTransition) {
      toTransition.pre.push({ placeId: fromPlace.id, weight });
      return;
    }
    if (fromTransition && toPlace) {
      fromTransition.post.push({ placeId: toPlace.id, weight });
    }
  });

  const initialMarking = new Map(places.map((place) => [place.id, place.tokens]));
  return {
    places,
    transitions,
    placeById,
    transitionById,
    initialMarking
  };
}

function normalizeSubnets(subnetsPayload, net) {
  const subnets = Array.isArray(subnetsPayload) ? subnetsPayload : [];
  return subnets
    .map((subnet, index) => {
      const label = String(subnet && subnet.label ? subnet.label : `D${index + 1}`);
      const supportPlaces = cloneArray(subnet && subnet.supportPlaces)
        .map((placeId) => String(placeId))
        .filter((placeId) => net.placeById.has(placeId))
        .sort(naturalLabelCompare);
      if (supportPlaces.length === 0) {
        return null;
      }
      return {
        label,
        supportPlaces,
        markedSupportCount: Math.max(0, asInt(subnet && subnet.markedSupportCount, 0))
      };
    })
    .filter(Boolean);
}

function selectTransitionEndpoints(transition, supportSet) {
  const from = (transition.pre || [])
    .map((item) => item.placeId)
    .filter((placeId) => supportSet.has(placeId));
  const to = (transition.post || [])
    .map((item) => item.placeId)
    .filter((placeId) => supportSet.has(placeId));
  if (from.length === 0 && to.length === 0) {
    return null;
  }
  return {
    from: Array.from(new Set(from)).sort(naturalLabelCompare),
    to: Array.from(new Set(to)).sort(naturalLabelCompare)
  };
}

function buildCoordinatorSt(sharedTransitions) {
  const rows = [];
  rows.push("(* Auto-generated by POOH: coordinator for shared transitions *)");
  rows.push("VAR");

  sharedTransitions.forEach((item) => {
    const tName = stIdent(item.id);
    rows.push(`  FIRE_${tName} : BOOL;`);
    item.owners.forEach((owner) => {
      rows.push(`  REQ_${tName}_${stIdent(owner)} : BOOL;`);
    });
  });

  rows.push("END_VAR");
  rows.push("");

  sharedTransitions.forEach((item) => {
    const tName = stIdent(item.id);
    const reqExpr = item.owners.map((owner) => `REQ_${tName}_${stIdent(owner)}`).join(" AND ");
    rows.push(`FIRE_${tName} := ${reqExpr || "FALSE"};`);
    rows.push(`IF FIRE_${tName} THEN`);
    item.owners.forEach((owner) => {
      rows.push(`  REQ_${tName}_${stIdent(owner)} := FALSE;`);
    });
    rows.push("END_IF;");
    rows.push("");
  });

  return rows.join("\n");
}

function buildPlcopenXml(model) {
  const lines = [];
  const createdIso = new Date(model.createdAt || Date.now()).toISOString();
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<project xmlns="http://www.plcopen.org/xml/tc6_0201">');
  lines.push(`  <fileHeader companyName="POOH" productName="POOH" productVersion="1.0" creationDateTime="${xmlEscape(createdIso)}"/>`);
  lines.push(`  <contentHeader name="${xmlEscape(model.name)}"/>`);
  lines.push("  <types>");
  lines.push("    <dataTypes/>");
  lines.push("    <pous>");

  const subnets = Array.isArray(model.subnets) ? model.subnets : [];
  subnets.forEach((subnet, subnetIndex) => {
    const pouName = `SFC_${stIdent(subnet.label || `D${subnetIndex + 1}`)}`;
    lines.push(`      <pou name="${xmlEscape(pouName)}" pouType="program">`);
    lines.push("        <interface/>");
    lines.push("        <body>");
    lines.push("          <SFC>");

    const stepLocalId = new Map();
    subnet.steps.forEach((stepId, index) => {
      const localId = 100 + (subnetIndex * 1000) + index;
      stepLocalId.set(stepId, localId);
      const y = 80 + (index * 120);
      const isInitial = stepId === subnet.initialStep;
      lines.push(`            <step localId="${localId}" name="${xmlEscape(stepId)}"${isInitial ? ' initialStep="true"' : ""}>`);
      lines.push(`              <position x="140" y="${y}"/>`);
      lines.push("            </step>");
    });

    subnet.transitions.forEach((transition, index) => {
      const localId = 600 + (subnetIndex * 1000) + index;
      const fromStep = Array.isArray(transition.from) && transition.from.length > 0 ? transition.from[0] : "";
      const toStep = Array.isArray(transition.to) && transition.to.length > 0 ? transition.to[0] : "";
      const fromId = stepLocalId.get(fromStep);
      const toId = stepLocalId.get(toStep);
      const y = 140 + (index * 120);
      lines.push(`            <transition localId="${localId}" name="${xmlEscape(transition.id)}">`);
      lines.push(`              <position x="340" y="${y}"/>`);
      if (fromId !== undefined) {
        lines.push("              <connectionPointIn>");
        lines.push(`                <connection refLocalId="${fromId}"/>`);
        lines.push("              </connectionPointIn>");
      }
      lines.push("              <condition>");
      lines.push(`                <inline><ST>${xmlEscape(String(transition.guard || "TRUE"))}</ST></inline>`);
      lines.push("              </condition>");
      if (toId !== undefined) {
        lines.push("              <connectionPointOut>");
        lines.push(`                <connection refLocalId="${toId}"/>`);
        lines.push("              </connectionPointOut>");
      }
      lines.push("            </transition>");
    });

    lines.push("          </SFC>");
    lines.push("        </body>");
    lines.push("      </pou>");
  });

  if (model.coordinatorSt) {
    lines.push('      <pou name="SFC_COORDINATOR" pouType="program">');
    lines.push("        <interface/>");
    lines.push("        <body>");
    lines.push(`          <ST><![CDATA[${String(model.coordinatorSt)}]]></ST>`);
    lines.push("        </body>");
    lines.push("      </pou>");
  }

  lines.push("    </pous>");
  lines.push("  </types>");
  lines.push("</project>");
  return lines.join("\n");
}

function buildCodesysMainProgramSt(model) {
  const lines = [];
  lines.push("PROGRAM PLC_PRG");
  lines.push("VAR");
  if (model.coordinatorSt) {
    lines.push("  COORD : SFC_COORDINATOR;");
  }
  (model.subnets || []).forEach((subnet) => {
    lines.push(`  INST_${stIdent(subnet.label)} : SFC_${stIdent(subnet.label)};`);
  });
  lines.push("END_VAR");
  lines.push("");
  if (model.coordinatorSt) {
    lines.push("COORD();");
  }
  (model.subnets || []).forEach((subnet) => {
    lines.push(`INST_${stIdent(subnet.label)}();`);
  });
  lines.push("END_PROGRAM");
  return lines.join("\n");
}

function buildCodesysPlcopenXml(model) {
  const lines = [];
  const createdIso = new Date(model.createdAt || Date.now()).toISOString();
  const mainProgramSt = buildCodesysMainProgramSt(model);
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<project xmlns="http://www.plcopen.org/xml/tc6_0201">');
  lines.push(`  <fileHeader companyName="POOH" productName="POOH" productVersion="1.0" creationDateTime="${xmlEscape(createdIso)}"/>`);
  lines.push(`  <contentHeader name="${xmlEscape(model.name)}"/>`);
  lines.push("  <types>");
  lines.push("    <dataTypes/>");
  lines.push("    <pous>");

  (model.subnets || []).forEach((subnet, subnetIndex) => {
    const pouName = `SFC_${stIdent(subnet.label || `D${subnetIndex + 1}`)}`;
    lines.push(`      <pou name="${xmlEscape(pouName)}" pouType="program">`);
    lines.push("        <interface/>");
    lines.push("        <body>");
    lines.push("          <SFC>");

    const stepLocalId = new Map();
    (subnet.steps || []).forEach((stepId, index) => {
      const localId = 100 + (subnetIndex * 1000) + index;
      stepLocalId.set(stepId, localId);
      const y = 80 + (index * 120);
      const isInitial = stepId === subnet.initialStep;
      lines.push(`            <step localId="${localId}" name="${xmlEscape(stepId)}"${isInitial ? ' initialStep="true"' : ""}>`);
      lines.push(`              <position x="140" y="${y}"/>`);
      lines.push("            </step>");
    });

    (subnet.transitions || []).forEach((transition, index) => {
      const localId = 600 + (subnetIndex * 1000) + index;
      const fromStep = Array.isArray(transition.from) && transition.from.length > 0 ? transition.from[0] : "";
      const toStep = Array.isArray(transition.to) && transition.to.length > 0 ? transition.to[0] : "";
      const fromId = stepLocalId.get(fromStep);
      const toId = stepLocalId.get(toStep);
      const y = 140 + (index * 120);
      lines.push(`            <transition localId="${localId}" name="${xmlEscape(transition.id)}">`);
      lines.push(`              <position x="340" y="${y}"/>`);
      if (fromId !== undefined) {
        lines.push("              <connectionPointIn>");
        lines.push(`                <connection refLocalId="${fromId}"/>`);
        lines.push("              </connectionPointIn>");
      }
      lines.push("              <condition>");
      lines.push(`                <inline><ST>${xmlEscape(String(transition.guard || "TRUE"))}</ST></inline>`);
      lines.push("              </condition>");
      if (toId !== undefined) {
        lines.push("              <connectionPointOut>");
        lines.push(`                <connection refLocalId="${toId}"/>`);
        lines.push("              </connectionPointOut>");
      }
      lines.push("            </transition>");
    });

    lines.push("          </SFC>");
    lines.push("        </body>");
    lines.push("      </pou>");
  });

  if (model.coordinatorSt) {
    lines.push('      <pou name="SFC_COORDINATOR" pouType="program">');
    lines.push("        <interface/>");
    lines.push("        <body>");
    lines.push(`          <ST><![CDATA[${String(model.coordinatorSt)}]]></ST>`);
    lines.push("        </body>");
    lines.push("      </pou>");
  }

  lines.push('      <pou name="PLC_PRG" pouType="program">');
  lines.push("        <interface/>");
  lines.push("        <body>");
  lines.push(`          <ST><![CDATA[${mainProgramSt}]]></ST>`);
  lines.push("        </body>");
  lines.push("      </pou>");
  lines.push("    </pous>");
  lines.push("  </types>");
  lines.push("  <instances>");
  lines.push("    <configurations>");
  lines.push('      <configuration name="Configuration">');
  lines.push('        <resource name="Application">');
  lines.push('          <task name="MainTask" interval="PT0.02S" priority="1">');
  lines.push('            <pouInstance name="PLC_PRG" typeName="PLC_PRG"/>');
  lines.push("          </task>");
  lines.push("        </resource>");
  lines.push("      </configuration>");
  lines.push("    </configurations>");
  lines.push("  </instances>");
  lines.push("</project>");

  return {
    xml: lines.join("\n"),
    mainProgramSt
  };
}

function buildTiaSubnetScl(subnet, model) {
  const blockName = `FB_SFC_${stIdent(subnet.label)}`;
  const lines = [];
  const transitionNames = Array.from(new Set((subnet.transitions || []).map((transition) => transition.id)));
  const sharedIds = new Set((model.sharedTransitions || []).map((item) => item.id));
  const fireInputs = transitionNames.filter((transitionId) => sharedIds.has(transitionId) && model.syncMode === "handshake");

  lines.push(`FUNCTION_BLOCK ${blockName}`);
  lines.push("VAR_INPUT");
  transitionNames.forEach((transitionId) => {
    lines.push(`  ${transitionSignalName(transitionId)} : Bool;`);
  });
  fireInputs.forEach((transitionId) => {
    lines.push(`  FIRE_${stIdent(transitionId)} : Bool;`);
  });
  if (transitionNames.length === 0 && fireInputs.length === 0) {
    lines.push("  DUMMY_IN : Bool;");
  }
  lines.push("END_VAR");
  lines.push("VAR");
  (subnet.steps || []).forEach((stepId) => {
    const initValue = stepId === subnet.initialStep ? "TRUE" : "FALSE";
    lines.push(`  STEP_${stIdent(stepId)} : Bool := ${initValue};`);
  });
  if ((subnet.steps || []).length === 0) {
    lines.push("  STEP_EMPTY : Bool := TRUE;");
  }
  lines.push("END_VAR");
  lines.push("BEGIN");

  if ((subnet.transitions || []).length === 0) {
    lines.push(tr("core.sfc.noLocalTransitionsComment"));
  } else {
    (subnet.transitions || []).forEach((transition) => {
      const fromStep = Array.isArray(transition.from) && transition.from.length > 0 ? transition.from[0] : null;
      const toStep = Array.isArray(transition.to) && transition.to.length > 0 ? transition.to[0] : null;
      if (!fromStep || !toStep) {
        return;
      }
      const baseSignal = transitionSignalName(transition.id);
      const guardSignal = transition.shared && model.syncMode === "handshake"
        ? `FIRE_${stIdent(transition.id)}`
        : baseSignal;
      lines.push(`  IF STEP_${stIdent(fromStep)} AND ${guardSignal} THEN`);
      lines.push(`    STEP_${stIdent(fromStep)} := FALSE;`);
      lines.push(`    STEP_${stIdent(toStep)} := TRUE;`);
      lines.push("  END_IF;");
    });
  }

  lines.push(`END_FUNCTION_BLOCK`);
  return {
    name: blockName,
    content: lines.join("\n")
  };
}

function buildTiaCoordinatorScl(model) {
  const lines = [];
  const shared = Array.isArray(model.sharedTransitions) ? model.sharedTransitions : [];
  lines.push("FUNCTION_BLOCK FB_SFC_COORD");
  lines.push("VAR_INPUT");
  shared.forEach((item) => {
    lines.push(`  ${transitionSignalName(item.id)} : Bool;`);
  });
  if (shared.length === 0) {
    lines.push("  DUMMY_IN : Bool;");
  }
  lines.push("END_VAR");
  lines.push("VAR_OUTPUT");
  shared.forEach((item) => {
    lines.push(`  FIRE_${stIdent(item.id)} : Bool;`);
  });
  if (shared.length === 0) {
    lines.push("  DUMMY_OUT : Bool;");
  }
  lines.push("END_VAR");
  lines.push("BEGIN");
  if (shared.length === 0) {
    lines.push("  DUMMY_OUT := DUMMY_IN;");
  } else {
    shared.forEach((item) => {
      lines.push(`  FIRE_${stIdent(item.id)} := ${transitionSignalName(item.id)};`);
    });
  }
  lines.push("END_FUNCTION_BLOCK");
  return lines.join("\n");
}

function buildTiaOb1Scl(model) {
  const lines = [];
  const allTransitionIds = Array.from(new Set((model.subnets || []).flatMap((subnet) =>
    (subnet.transitions || []).map((transition) => transition.id)
  ))).sort(naturalLabelCompare);
  const sharedIds = new Set((model.sharedTransitions || []).map((item) => item.id));

  lines.push("ORGANIZATION_BLOCK OB1");
  lines.push("VAR");
  lines.push("  COORD : FB_SFC_COORD;");
  (model.subnets || []).forEach((subnet) => {
    lines.push(`  INST_${stIdent(subnet.label)} : FB_SFC_${stIdent(subnet.label)};`);
  });
  allTransitionIds.forEach((transitionId) => {
    lines.push(`  ${transitionSignalName(transitionId)} : Bool;`);
  });
  lines.push("END_VAR");
  lines.push("BEGIN");
  if (allTransitionIds.length > 0) {
    const coordParams = allTransitionIds
      .filter((transitionId) => sharedIds.has(transitionId))
      .map((transitionId) => `${transitionSignalName(transitionId)} := ${transitionSignalName(transitionId)}`);
    lines.push(`  COORD(${coordParams.join(", ")});`);
  } else {
    lines.push("  COORD();");
  }

  (model.subnets || []).forEach((subnet) => {
    const transitionIds = Array.from(new Set((subnet.transitions || []).map((transition) => transition.id))).sort(naturalLabelCompare);
    const args = [];
    transitionIds.forEach((transitionId) => {
      args.push(`${transitionSignalName(transitionId)} := ${transitionSignalName(transitionId)}`);
      if (sharedIds.has(transitionId) && model.syncMode === "handshake") {
        args.push(`FIRE_${stIdent(transitionId)} := COORD.FIRE_${stIdent(transitionId)}`);
      }
    });
    lines.push(`  INST_${stIdent(subnet.label)}(${args.join(", ")});`);
  });
  lines.push("END_ORGANIZATION_BLOCK");
  return lines.join("\n");
}

function buildTiaMappingXml(model, sclFiles) {
  const lines = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<tiaMapping version="1.0">');
  lines.push(`  <modelName>${xmlEscape(model.name)}</modelName>`);
  lines.push("  <blocks>");
  (sclFiles || []).forEach((file) => {
    const kind = String(file && file.kind ? file.kind : "FB");
    lines.push(`    <block name="${xmlEscape(file.name)}" kind="${xmlEscape(kind)}" language="SCL" file="${xmlEscape(`${file.name}.scl`)}"/>`);
  });
  lines.push("  </blocks>");
  lines.push("</tiaMapping>");
  return lines.join("\n");
}

function buildTiaPackage(model) {
  const files = [];
  (model.subnets || []).forEach((subnet) => {
    const built = buildTiaSubnetScl(subnet, model);
    files.push({
      kind: "FB",
      name: built.name,
      content: built.content
    });
  });

  const coordinatorContent = buildTiaCoordinatorScl(model);
  files.push({
    kind: "FB",
    name: "FB_SFC_COORD",
    content: coordinatorContent
  });

  const ob1Content = buildTiaOb1Scl(model);
  files.push({
    kind: "OB",
    name: "OB1",
    content: ob1Content
  });

  return {
    mappingXml: buildTiaMappingXml(model, files),
    sclFiles: files
  };
}

function normalizeMaxPlusOptions(options) {
  const source = options && typeof options === "object" ? options : {};
  const maxPlus = source.maxPlus && typeof source.maxPlus === "object" ? source.maxPlus : source;
  const defaultDelayRaw = Number(maxPlus.defaultDelay);
  const syncOverheadRaw = Number(maxPlus.syncOverhead);
  const defaultDelay = Number.isFinite(defaultDelayRaw) && defaultDelayRaw >= 0 ? defaultDelayRaw : 1;
  const syncOverhead = Number.isFinite(syncOverheadRaw) && syncOverheadRaw >= 0 ? syncOverheadRaw : 0;
  const delayMap = {};
  const incomingMap = maxPlus.delayMap && typeof maxPlus.delayMap === "object" ? maxPlus.delayMap : {};
  Object.entries(incomingMap).forEach(([key, value]) => {
    const numeric = Number(value);
    if (!key || !Number.isFinite(numeric) || numeric < 0) {
      return;
    }
    delayMap[String(key)] = numeric;
  });
  return {
    defaultDelay,
    syncOverhead,
    delayMap
  };
}

function getMaxPlusPlaceDelay(placeId, opts) {
  if (Object.prototype.hasOwnProperty.call(opts.delayMap, placeId)) {
    return Number(opts.delayMap[placeId]);
  }
  return Number(opts.defaultDelay);
}

function buildTransitionNodeSet(subnet) {
  return new Set(
    (subnet.transitions || [])
      .map((transition) => String(transition.id || ""))
      .filter(Boolean)
  );
}

function createNullMatrix(size) {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => null));
}

function maxPlusMultiplyMatrixVector(matrix, vector) {
  const n = matrix.length;
  const next = new Array(n).fill(0);
  for (let i = 0; i < n; i += 1) {
    let best = Number.NEGATIVE_INFINITY;
    for (let j = 0; j < n; j += 1) {
      const weight = matrix[i][j];
      if (weight === null || weight === undefined) {
        continue;
      }
      const candidate = Number(weight) + Number(vector[j] || 0);
      if (candidate > best) {
        best = candidate;
      }
    }
    next[i] = Number.isFinite(best) ? best : Number(vector[i] || 0);
  }
  return next;
}

function buildAdjacencyFromMatrix(matrix) {
  const n = matrix.length;
  const adj = Array.from({ length: n }, () => []);
  const rev = Array.from({ length: n }, () => []);
  for (let to = 0; to < n; to += 1) {
    for (let from = 0; from < n; from += 1) {
      const weight = matrix[to][from];
      if (weight === null || weight === undefined) {
        continue;
      }
      adj[from].push(to);
      rev[to].push(from);
    }
  }
  return { adj, rev };
}

function computeSccCount(matrix) {
  const n = matrix.length;
  if (n === 0) {
    return 0;
  }
  const { adj, rev } = buildAdjacencyFromMatrix(matrix);
  const visited = new Array(n).fill(false);
  const order = [];

  function dfs1(start) {
    const stack = [{ node: start, phase: 0 }];
    while (stack.length > 0) {
      const top = stack.pop();
      const node = top.node;
      if (top.phase === 0) {
        if (visited[node]) {
          continue;
        }
        visited[node] = true;
        stack.push({ node, phase: 1 });
        adj[node].forEach((next) => {
          if (!visited[next]) {
            stack.push({ node: next, phase: 0 });
          }
        });
      } else {
        order.push(node);
      }
    }
  }

  for (let i = 0; i < n; i += 1) {
    if (!visited[i]) {
      dfs1(i);
    }
  }

  const assigned = new Array(n).fill(false);
  let components = 0;

  function dfs2(start) {
    const stack = [start];
    assigned[start] = true;
    while (stack.length > 0) {
      const node = stack.pop();
      rev[node].forEach((next) => {
        if (!assigned[next]) {
          assigned[next] = true;
          stack.push(next);
        }
      });
    }
  }

  for (let i = order.length - 1; i >= 0; i -= 1) {
    const node = order[i];
    if (assigned[node]) {
      continue;
    }
    components += 1;
    dfs2(node);
  }

  return components;
}

function computeMaxCycleMeanKarp(matrix) {
  const n = matrix.length;
  if (n === 0) {
    return null;
  }
  const inEdges = Array.from({ length: n }, () => []);
  for (let to = 0; to < n; to += 1) {
    for (let from = 0; from < n; from += 1) {
      const weight = matrix[to][from];
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
        const prev = dp[k - 1][edge.from];
        if (!Number.isFinite(prev)) {
          return;
        }
        const candidate = prev + edge.weight;
        if (candidate > best) {
          best = candidate;
        }
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
      const denom = n - k;
      if (denom <= 0) {
        continue;
      }
      const ratio = (dp[n][v] - dp[k][v]) / denom;
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

function buildMaxPlusForSubnet(subnet, net, sharedTransitionSet, options) {
  const transitionSet = buildTransitionNodeSet(subnet);
  const transitions = Array.from(transitionSet).sort(naturalLabelCompare);
  const indexByTransition = new Map(transitions.map((transitionId, index) => [transitionId, index]));
  const matrix = createNullMatrix(transitions.length);
  const edgeRows = [];
  let operations = 0;

  if (transitions.length === 0) {
    return {
      label: subnet.label,
      transitions,
      transitionCount: 0,
      edgeCount: 0,
      matrix,
      stronglyConnected: false,
      lambda: null,
      throughput: null,
      sampleTrajectory: [],
      operations
    };
  }

  const incomingByPlace = new Map();
  const outgoingByPlace = new Map();
  (subnet.steps || []).forEach((placeId) => {
    incomingByPlace.set(placeId, new Set());
    outgoingByPlace.set(placeId, new Set());
  });

  net.transitions.forEach((transition) => {
    if (!transitionSet.has(transition.id)) {
      return;
    }
    (transition.post || []).forEach((arc) => {
      if (!incomingByPlace.has(arc.placeId)) {
        return;
      }
      incomingByPlace.get(arc.placeId).add(transition.id);
    });
    (transition.pre || []).forEach((arc) => {
      if (!outgoingByPlace.has(arc.placeId)) {
        return;
      }
      outgoingByPlace.get(arc.placeId).add(transition.id);
    });
  });

  (subnet.steps || []).forEach((placeId) => {
    const fromSet = incomingByPlace.get(placeId) || new Set();
    const toSet = outgoingByPlace.get(placeId) || new Set();
    const fromList = Array.from(fromSet).sort(naturalLabelCompare);
    const toList = Array.from(toSet).sort(naturalLabelCompare);
    if (fromList.length === 0 || toList.length === 0) {
      return;
    }
    const baseDelay = getMaxPlusPlaceDelay(placeId, options);
    fromList.forEach((fromTransition) => {
      toList.forEach((toTransition) => {
        const fromIdx = indexByTransition.get(fromTransition);
        const toIdx = indexByTransition.get(toTransition);
        if (fromIdx === undefined || toIdx === undefined) {
          return;
        }
        const syncPenalty = (
          options.syncOverhead > 0
          && (sharedTransitionSet.has(fromTransition) || sharedTransitionSet.has(toTransition))
        ) ? options.syncOverhead : 0;
        const weight = baseDelay + syncPenalty;
        const current = matrix[toIdx][fromIdx];
        if (current === null || weight > current) {
          matrix[toIdx][fromIdx] = weight;
        }
        edgeRows.push({
          from: fromTransition,
          to: toTransition,
          placeId,
          weight
        });
        operations += 1;
      });
    });
  });

  const sccCount = computeSccCount(matrix);
  const stronglyConnected = sccCount === 1 && transitions.length > 0;
  const lambda = computeMaxCycleMeanKarp(matrix);
  const throughput = Number.isFinite(lambda) && lambda > 0 ? (1 / lambda) : null;

  const sampleTrajectory = [];
  let x = new Array(transitions.length).fill(0);
  sampleTrajectory.push({
    k: 0,
    values: x.slice()
  });
  for (let step = 1; step <= 8; step += 1) {
    x = maxPlusMultiplyMatrixVector(matrix, x);
    sampleTrajectory.push({
      k: step,
      values: x.slice()
    });
  }

  return {
    label: subnet.label,
    transitions,
    transitionCount: transitions.length,
    edgeCount: edgeRows.length,
    matrix,
    edgeRows,
    stronglyConnected,
    lambda,
    throughput,
    sampleTrajectory,
    operations
  };
}

function buildMaxPlusModel(model, net, options, jobId) {
  const started = nowMs();
  const resolvedOptions = normalizeMaxPlusOptions(options || {});
  const sharedSet = new Set((model.sharedTransitions || []).map((item) => String(item.id || "")));
  const subnets = Array.isArray(model.subnets) ? model.subnets : [];
  const results = [];
  let operations = 0;

  subnets.forEach((subnet, index) => {
    const row = buildMaxPlusForSubnet(subnet, net, sharedSet, resolvedOptions);
    results.push(row);
    operations += Number(row.operations || 0);
    if ((index + 1) % 2 === 0 || index === subnets.length - 1) {
      postProgress(jobId, tr("core.sfc.maxPlusSubnetProgress", { index: index + 1, total: subnets.length }));
    }
  });

  const lambdaCandidates = results
    .map((item) => Number(item.lambda))
    .filter((value) => Number.isFinite(value));
  const lambdaGlobal = lambdaCandidates.length > 0 ? Math.max(...lambdaCandidates) : null;
  const throughputGlobal = Number.isFinite(lambdaGlobal) && lambdaGlobal > 0 ? (1 / lambdaGlobal) : null;

  let note = tr("core.sfc.globalPeriod");
  if (resolvedOptions.syncOverhead > 0) {
    note += tr("core.sfc.syncOverhead");
  }

  return {
    semiring: "max-plus",
    equation: "x(k+1)=A⊗x(k), (A⊗x)_i=max_j(A_ij + x_j(k))",
    variant: "xt-synchronized-event-graph",
    options: resolvedOptions,
    subnets: results,
    global: {
      lambda: lambdaGlobal,
      throughput: throughputGlobal,
      note
    },
    summary: {
      runtimeMs: Math.max(0, nowMs() - started),
      operations
    }
  };
}

function synthesizeSfcModel(input, jobId) {
  const started = nowMs();
  const net = buildNet(input.net || {});
  const options = input && input.options && typeof input.options === "object" ? input.options : {};
  const profile = normalizeProfile(options.profile);
  const syncMode = normalizeSync(options.syncMode);
  const subnets = normalizeSubnets(input.subnets || [], net);

  if (net.places.length === 0 || net.transitions.length === 0) {
    throw new Error(tr("core.sfc.inputRequired"));
  }
  if (subnets.length === 0) {
    throw new Error(tr("core.sfc.subnetsRequired"));
  }

  postProgress(jobId, tr("core.sfc.building", { count: subnets.length }));

  const transitionOwners = new Map();
  let transitionScans = 0;
  const modelSubnets = subnets.map((subnet, subnetIndex) => {
    const supportSet = new Set(subnet.supportPlaces);
    const initialCandidates = subnet.supportPlaces
      .filter((placeId) => (net.initialMarking.get(placeId) || 0) > 0)
      .sort(naturalLabelCompare);
    const initialStep = initialCandidates[0] || subnet.supportPlaces[0];

    const transitions = [];
    net.transitions.forEach((transition) => {
      transitionScans += 1;
      const endpoints = selectTransitionEndpoints(transition, supportSet);
      if (!endpoints) {
        return;
      }

      const guard = transitionSignalName(transition.id);
      transitions.push({
        id: transition.id,
        label: transition.label,
        from: endpoints.from,
        to: endpoints.to,
        guard,
        shared: false
      });

      if (!transitionOwners.has(transition.id)) {
        transitionOwners.set(transition.id, new Set());
      }
      transitionOwners.get(transition.id).add(subnet.label);
    });

    if ((subnetIndex + 1) % 2 === 0 || subnetIndex === subnets.length - 1) {
      postProgress(jobId, tr("core.sfc.subnetReady", { index: subnetIndex + 1, total: subnets.length }));
    }

    return {
      label: subnet.label,
      steps: subnet.supportPlaces.slice(),
      initialStep,
      transitions
    };
  });

  const sharedTransitions = Array.from(transitionOwners.entries())
    .map(([transitionId, ownersSet]) => ({
      id: transitionId,
      owners: Array.from(ownersSet).sort(naturalLabelCompare)
    }))
    .filter((item) => item.owners.length > 1)
    .sort((a, b) => naturalLabelCompare(a.id, b.id));

  const totalSubnetTransitions = modelSubnets.reduce(
    (sum, subnet) => sum + (Array.isArray(subnet.transitions) ? subnet.transitions.length : 0),
    0
  );
  if (totalSubnetTransitions === 0) {
    throw new Error(tr("core.sfc.noLocalTransitions"));
  }

  modelSubnets.forEach((subnet) => {
    subnet.transitions.forEach((transition) => {
      const ownerInfo = sharedTransitions.find((item) => item.id === transition.id);
      if (ownerInfo) {
        transition.shared = true;
      }
    });
  });

  const warnings = [];
  const maxInitialToken = net.places.reduce((max, place) => Math.max(max, place.tokens), 0);
  if (profile === "strict" && maxInitialToken > 1) {
    warnings.push(tr("core.sfc.strictWarning"));
  }

  const coordinatorSt = syncMode === "handshake" && sharedTransitions.length > 0
    ? buildCoordinatorSt(sharedTransitions)
    : "";

  const model = {
    name: String(input && input.modelName ? input.modelName : "POOH_SFC_Model"),
    createdAt: Date.now(),
    profile,
    syncMode,
    placeIds: net.places.map((place) => place.id),
    transitionIds: net.transitions.map((transition) => transition.id),
    subnets: modelSubnets,
    sharedTransitions,
    coordinatorSt,
    warnings
  };

  postProgress(jobId, tr("core.sfc.generatePlcopen"));
  model.plcopenXml = buildPlcopenXml(model);
  postProgress(jobId, tr("core.sfc.generateCodesys"));
  const codesys = buildCodesysPlcopenXml(model);
  model.codesysPackage = {
    xml: codesys.xml,
    mainProgramSt: codesys.mainProgramSt,
    coordinatorSt: model.coordinatorSt
  };
  postProgress(jobId, tr("core.sfc.generateTia"));
  model.tiaPackage = buildTiaPackage(model);
  postProgress(jobId, tr("core.sfc.timingAnalysis"));
  model.maxPlus = buildMaxPlusModel(model, net, options, jobId);

  const runtimeMs = Math.max(0, nowMs() - started);
  const operations = transitionScans
    + modelSubnets.reduce((sum, subnet) => sum + subnet.transitions.length + subnet.steps.length, 0)
    + sharedTransitions.length;

  return {
    action: "build",
    model,
    summary: {
      runtimeMs,
      operations,
      note: warnings.length > 0 ? warnings.join(" ") : "OK"
    }
  };
}

function markingToKey(marking, placeIds) {
  return placeIds.map((placeId) => String(marking.get(placeId) || 0)).join(",");
}

function setToSortedArray(values) {
  return Array.from(values).sort(naturalLabelCompare);
}

function validatePnSfc(input, jobId) {
  const started = nowMs();
  const net = buildNet(input.net || {});
  const model = input && input.model && typeof input.model === "object" ? input.model : null;
  const options = input && input.options && typeof input.options === "object" ? input.options : {};
  const traceLength = Math.max(10, Math.min(5000, asInt(options.traceLength, 300)));

  if (!model || !Array.isArray(model.subnets) || model.subnets.length === 0) {
    throw new Error(tr("core.sfc.modelEmpty"));
  }

  const transitionById = new Map(net.transitions.map((transition) => [transition.id, transition]));
  const marking = new Map(net.places.map((place) => [place.id, place.tokens]));

  const activeStepBySubnet = new Map();
  model.subnets.forEach((subnet) => {
    activeStepBySubnet.set(subnet.label, String(subnet.initialStep || (subnet.steps && subnet.steps[0]) || ""));
  });

  const transitionOwners = new Map();
  model.subnets.forEach((subnet) => {
    (subnet.transitions || []).forEach((transition) => {
      if (!transitionOwners.has(transition.id)) {
        transitionOwners.set(transition.id, new Set());
      }
      transitionOwners.get(transition.id).add(subnet.label);
    });
  });

  const modeledTransitionIds = setToSortedArray(transitionOwners.keys());
  const mismatches = [];
  let mismatchCount = 0;
  let stepsChecked = 0;

  function enabledPnTransitions() {
    const enabled = new Set();
    net.transitions.forEach((transition) => {
      const ok = transition.pre.every((arc) => (marking.get(arc.placeId) || 0) >= arc.weight);
      if (ok) {
        enabled.add(transition.id);
      }
    });
    return enabled;
  }

  function enabledSfcTransitions() {
    const enabled = new Set();
    transitionOwners.forEach((ownersSet, transitionId) => {
      const owners = Array.from(ownersSet);
      const allReady = owners.every((ownerLabel) => {
        const subnet = model.subnets.find((item) => item.label === ownerLabel);
        if (!subnet) {
          return false;
        }
        const localTransition = (subnet.transitions || []).find((item) => item.id === transitionId);
        if (!localTransition || !Array.isArray(localTransition.from)) {
          return false;
        }
        const active = String(activeStepBySubnet.get(ownerLabel) || "");
        return localTransition.from.includes(active);
      });
      if (allReady) {
        enabled.add(transitionId);
      }
    });
    return enabled;
  }

  function firePn(transitionId) {
    const transition = transitionById.get(transitionId);
    if (!transition) {
      return;
    }
    transition.pre.forEach((arc) => {
      const current = marking.get(arc.placeId) || 0;
      marking.set(arc.placeId, current - arc.weight);
    });
    transition.post.forEach((arc) => {
      const current = marking.get(arc.placeId) || 0;
      marking.set(arc.placeId, current + arc.weight);
    });
  }

  function fireSfc(transitionId) {
    model.subnets.forEach((subnet) => {
      const localTransition = (subnet.transitions || []).find((item) => item.id === transitionId);
      if (!localTransition) {
        return;
      }
      const active = String(activeStepBySubnet.get(subnet.label) || "");
      const from = Array.isArray(localTransition.from) ? localTransition.from : [];
      const to = Array.isArray(localTransition.to) ? localTransition.to : [];
      if (!from.includes(active) || to.length === 0) {
        return;
      }
      activeStepBySubnet.set(subnet.label, String(to[0]));
    });
  }

  for (let step = 1; step <= traceLength; step += 1) {
    const pnEnabledAll = enabledPnTransitions();
    const sfcEnabled = enabledSfcTransitions();
    const pnEnabled = new Set(modeledTransitionIds.filter((transitionId) => pnEnabledAll.has(transitionId)));

    const pnList = setToSortedArray(pnEnabled);
    const sfcList = setToSortedArray(sfcEnabled);

    const same = pnList.length === sfcList.length && pnList.every((item, idx) => item === sfcList[idx]);
    if (!same) {
      mismatchCount += 1;
      if (mismatches.length < 40) {
        mismatches.push({ step, pn: pnList, sfc: sfcList });
      }
    }

    const common = pnList.filter((transitionId) => sfcEnabled.has(transitionId));
    if (common.length > 0) {
      const chosen = common[0];
      firePn(chosen);
      fireSfc(chosen);
      stepsChecked += 1;
    } else if (pnList.length > 0) {
      firePn(pnList[0]);
      stepsChecked += 1;
    } else if (sfcList.length > 0) {
      fireSfc(sfcList[0]);
      stepsChecked += 1;
    } else {
      break;
    }

    if (step % 50 === 0 || step === traceLength) {
      postProgress(jobId, tr("core.sfc.validationProgress", { step, total: traceLength }));
    }
  }

  const runtimeMs = Math.max(0, nowMs() - started);
  const coverageRatio = stepsChecked > 0
    ? (1 - (mismatchCount / stepsChecked))
    : 1;

  return {
    action: "validate",
    validation: {
      passed: mismatchCount === 0,
      mismatchCount,
      stepsChecked,
      coverageRatio: Math.max(0, Math.min(1, coverageRatio)),
      avgStepMs: stepsChecked > 0 ? runtimeMs / stepsChecked : runtimeMs,
      finalPnMarking: markingToKey(marking, net.places.map((place) => place.id)),
      mismatches
    }
  };
}

function recomputeMaxPlus(input, jobId) {
  const net = buildNet(input.net || {});
  const model = input && input.model && typeof input.model === "object" ? input.model : null;
  const options = input && input.options && typeof input.options === "object" ? input.options : {};
  if (!model || !Array.isArray(model.subnets) || model.subnets.length === 0) {
    throw new Error(tr("core.sfc.modelEmpty"));
  }
  postProgress(jobId, tr("core.sfc.maxPlusUpdate"));
  const nextModel = {
    ...model,
    subnets: Array.isArray(model.subnets) ? model.subnets.map((subnet) => ({
      ...subnet,
      steps: Array.isArray(subnet.steps) ? subnet.steps.slice() : [],
      transitions: Array.isArray(subnet.transitions) ? subnet.transitions.map((transition) => ({ ...transition })) : []
    })) : [],
    sharedTransitions: Array.isArray(model.sharedTransitions)
      ? model.sharedTransitions.map((item) => ({ ...item, owners: Array.isArray(item.owners) ? item.owners.slice() : [] }))
      : []
  };
  nextModel.maxPlus = buildMaxPlusModel(nextModel, net, options, jobId);
  return {
    action: "maxplus",
    model: nextModel
  };
}

function runSfcComputation(jobId, payload) {
  const action = String(payload && payload.action ? payload.action : "").toLowerCase();
  if (action === "build") {
    return synthesizeSfcModel(payload, jobId);
  }
  if (action === "validate") {
    return validatePnSfc(payload, jobId);
  }
  if (action === "maxplus") {
    return recomputeMaxPlus(payload, jobId);
  }
  throw new Error(tr("core.sfc.unknownAction"));
}

  return {
    setProgressSink,
    clearProgressSink,
    runSfcComputation,
    synthesizeSfcModel,
    validatePnSfc,
    recomputeMaxPlus,
    buildNet,
    normalizeSubnets,
    buildMaxPlusModel,
    buildPlcopenXml,
    buildCodesysPlcopenXml,
    buildTiaPackage
  };
});
