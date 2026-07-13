(function(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("./petri-analysis"), require("./xtrec"), require("./i18n"));
  } else {
    root.PoohGeneratorCore = factory(root.PoohPetriAnalysisCore, root.PoohXtrecCore, root.PoohI18n);
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function(petriAnalysisDependency, xtrecDependency, i18n) {
  "use strict";

  function tr(key, params) {
    return i18n && typeof i18n.t === "function" ? i18n.t(key, params) : String(key || "");
  }

  const petriAnalysisCore = petriAnalysisDependency || {};
  const xtrecCore = xtrecDependency || {};
  let progressSink = null;

  function setProgressSink(callback) {
    progressSink = typeof callback === "function" ? callback : null;
  }

  function clearProgressSink() {
    progressSink = null;
  }

  function postMessage(message) {
    if (message && message.type === "progress" && typeof progressSink === "function") {
      progressSink(message);
    }
  }

  function requirePetriAnalysisCoreFunction(name) {
    if (petriAnalysisCore && typeof petriAnalysisCore[name] === "function") {
      return petriAnalysisCore[name].bind(petriAnalysisCore);
    }
    throw new Error(tr("core.generator.petriCoreMissing", { name }));
  }

  function requireXtrecCoreFunction(name) {
    if (xtrecCore && typeof xtrecCore[name] === "function") {
      return xtrecCore[name].bind(xtrecCore);
    }
    throw new Error(tr("core.generator.xtrecCoreMissing", { name }));
  }

  function computeClassificationFor(nodes, arcs) {
    return requirePetriAnalysisCoreFunction("computeClassificationFor")(nodes, arcs);
  }

  function classificationToMap(classificationRows) {
    return requirePetriAnalysisCoreFunction("classificationToMap")(classificationRows);
  }

  function buildTransitionRulesFor(nodes, arcs, placeIds) {
    return requirePetriAnalysisCoreFunction("buildTransitionRulesFor")(nodes, arcs, placeIds);
  }

  function computeEnabledTransitionsForMarking(marking, transitionRules) {
    return requirePetriAnalysisCoreFunction("computeEnabledTransitionsForMarking")(marking, transitionRules);
  }

  function fireOnMarking(marking, transitionRule) {
    return requirePetriAnalysisCoreFunction("fireOnMarking")(marking, transitionRule);
  }

  function computeLivenessSafenessFor(nodes, arcs, maxStates) {
    return requirePetriAnalysisCoreFunction("computeLivenessSafenessFor")(nodes, arcs, maxStates);
  }

function randomInt(maxExclusive) {
  const limit = Math.max(1, parseInt(String(maxExclusive || 1), 10) || 1);
  return Math.floor(Math.random() * limit);
}

function shuffled(values) {
  const arr = values.slice();
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

function pickDistinct(values, count) {
  if (values.length === 0) {
    return [];
  }
  const n = Math.max(1, Math.min(values.length, count));
  return shuffled(values).slice(0, n);
}

function addArcUnique(arcs, arcKeySet, from, to, weight) {
  if (!from || !to || from === to) {
    return;
  }
  const fromIsPlace = from.startsWith("P");
  const toIsPlace = to.startsWith("P");
  if (fromIsPlace === toIsPlace) {
    return;
  }
  const safeWeight = Math.max(1, parseInt(String(weight || 1), 10) || 1);
  const key = `${from}->${to}@${safeWeight}`;
  if (arcKeySet.has(key)) {
    return;
  }
  arcKeySet.add(key);
  arcs.push({
    id: `A${arcs.length + 1}`,
    from,
    to,
    weight: safeWeight
  });
}

function computeModuleCount(placeCount, transitionCount, requested) {
  const hardCap = Math.floor(Math.min(placeCount, transitionCount) / 2);
  if (hardCap <= 0) {
    return 0;
  }
  let target = Math.max(0, parseInt(String(requested || 0), 10) || 0);
  target = Math.min(target, hardCap);
  if (target === 0) {
    target = 1;
  }
  while (target > 0 && (placeCount - target * 2 < 0 || transitionCount - target * 2 < 0)) {
    target -= 1;
  }
  return Math.max(0, target);
}

function createBaseGeneratorNodes(placeCount, transitionCount) {
  const nodes = [];
  const placeIds = [];
  const transitionIds = [];

  for (let i = 1; i <= placeCount; i += 1) {
    const id = `P${i}`;
    placeIds.push(id);
    nodes.push({
      id,
      type: "place",
      label: id,
      tokens: 0,
      x: null,
      y: null,
      angle: 0
    });
  }

  for (let i = 1; i <= transitionCount; i += 1) {
    const id = `T${i}`;
    transitionIds.push(id);
    nodes.push({
      id,
      type: "transition",
      label: id,
      tokens: 0,
      x: null,
      y: null,
      angle: 0
    });
  }

  return { nodes, placeIds, transitionIds };
}

function generateCoreArcsByType(netType, placeIds, transitionIds, arcs, arcKeySet, preferSafe) {
  if (placeIds.length === 0 || transitionIds.length === 0) {
    return { efcInputSet: [] };
  }

  if (netType === "mg") {
    const shuffledPlaces = shuffled(placeIds);
    const outTransitions = shuffled(transitionIds);
    const inTransitions = shuffled(transitionIds);
    shuffledPlaces.forEach((placeId, index) => {
      addArcUnique(arcs, arcKeySet, placeId, outTransitions[index % outTransitions.length], 1);
      addArcUnique(arcs, arcKeySet, inTransitions[index % inTransitions.length], placeId, 1);
    });
    return { efcInputSet: [] };
  }

  if (netType === "efc") {
    const inputSet = shuffled(placeIds).slice(0, Math.min(2, placeIds.length));
    transitionIds.forEach((transitionId, index) => {
      inputSet.forEach((placeId) => addArcUnique(arcs, arcKeySet, placeId, transitionId, 1));
      inputSet.forEach((placeId) => addArcUnique(arcs, arcKeySet, transitionId, placeId, 1));
      if (!preferSafe && placeIds.length > inputSet.length) {
        const target = placeIds[(index + inputSet.length) % placeIds.length];
        addArcUnique(arcs, arcKeySet, transitionId, target, 1);
      }
    });
    return { efcInputSet: inputSet };
  }

  if (netType === "fc" || netType === "sm") {
    const inPlaces = shuffled(placeIds);
    const outPlaces = shuffled(placeIds);
    transitionIds.forEach((transitionId, index) => {
      addArcUnique(arcs, arcKeySet, inPlaces[index % inPlaces.length], transitionId, 1);
      addArcUnique(arcs, arcKeySet, transitionId, outPlaces[(index + 1) % outPlaces.length], 1);
    });
    return { efcInputSet: [] };
  }

  transitionIds.forEach((transitionId, index) => {
    const inCount = 1 + ((Math.random() < 0.45 && placeIds.length > 1) ? 1 : 0);
    const outCount = 1 + ((Math.random() < 0.45 && placeIds.length > 1) ? 1 : 0);
    pickDistinct(placeIds, inCount).forEach((placeId) => addArcUnique(arcs, arcKeySet, placeId, transitionId, 1));
    pickDistinct(placeIds, outCount).forEach((placeId) => addArcUnique(arcs, arcKeySet, transitionId, placeId, 1));
    addArcUnique(arcs, arcKeySet, placeIds[index % placeIds.length], transitionId, 1);
    addArcUnique(arcs, arcKeySet, transitionId, placeIds[(index + 1) % placeIds.length], 1);
  });

  return { efcInputSet: [] };
}

function applyInitialMarking(nodes, placeIds, modules, corePlaceIds, options, efcInputSet) {
  const liveOption = options.liveOption;
  const safeOption = options.safeOption;
  const netType = options.netType;
  const tokenById = new Map(placeIds.map((id) => [id, 0]));

  if (liveOption === "no") {
    placeIds.forEach((id) => tokenById.set(id, 0));
  } else if (liveOption === "yes") {
    modules.forEach((module) => {
      if (module.places[0]) {
        tokenById.set(module.places[0], 1);
      }
    });
    if (netType === "mg") {
      corePlaceIds.forEach((id) => tokenById.set(id, 1));
    } else if (netType === "efc") {
      const basis = efcInputSet.length > 0 ? efcInputSet : corePlaceIds.slice(0, 1);
      basis.forEach((id) => tokenById.set(id, 1));
    } else if (corePlaceIds.length > 0) {
      tokenById.set(corePlaceIds[0], 1);
    }
  } else {
    modules.forEach((module) => {
      if (module.places[0]) {
        tokenById.set(module.places[0], 1);
      }
    });
    if (corePlaceIds.length > 0) {
      tokenById.set(corePlaceIds[0], 1);
    }
  }

  if (safeOption === "yes") {
    placeIds.forEach((id) => tokenById.set(id, Math.min(1, tokenById.get(id) || 0)));
  } else if (safeOption === "no" && placeIds.length > 0) {
    const target = placeIds[randomInt(placeIds.length)];
    tokenById.set(target, Math.max(2, (tokenById.get(target) || 0) + 2));
  }

  if (liveOption === "no") {
    placeIds.forEach((id) => tokenById.set(id, 0));
    if (safeOption === "no" && placeIds.length > 0) {
      tokenById.set(placeIds[0], 2);
    }
  }

  nodes.forEach((node) => {
    if (node.type === "place") {
      node.tokens = Math.max(0, tokenById.get(node.id) || 0);
    }
  });
}

function ensureWeakConnectivity(nodes, arcs, arcKeySet) {
  if (nodes.length === 0) return;

  const adj = new Map();
  nodes.forEach(function(n) { adj.set(n.id, new Set()); });
  arcs.forEach(function(a) {
    if (adj.has(a.from) && adj.has(a.to)) {
      adj.get(a.from).add(a.to);
      adj.get(a.to).add(a.from);
    }
  });

  var visited = new Set();
  var components = [];

  nodes.forEach(function(n) {
    if (visited.has(n.id)) return;
    var comp = [];
    var stack = [n.id];
    while (stack.length > 0) {
      var cur = stack.pop();
      if (visited.has(cur)) continue;
      visited.add(cur);
      comp.push(cur);
      (adj.get(cur) || new Set()).forEach(function(nb) {
        if (!visited.has(nb)) stack.push(nb);
      });
    }
    components.push(comp);
  });

  if (components.length <= 1) return;

  var nodeMap = new Map(nodes.map(function(n) { return [n.id, n]; }));
  var mainComp = components[0];

  for (var ci = 1; ci < components.length; ci++) {
    var comp = components[ci];
    var places_main = mainComp.filter(function(id) { return nodeMap.get(id).type === "place"; });
    var trans_main = mainComp.filter(function(id) { return nodeMap.get(id).type === "transition"; });
    var places_comp = comp.filter(function(id) { return nodeMap.get(id).type === "place"; });
    var trans_comp = comp.filter(function(id) { return nodeMap.get(id).type === "transition"; });

    var bridged = false;
    if (places_main.length > 0 && trans_comp.length > 0) {
      var pm = places_main[randomInt(places_main.length)];
      var tc = trans_comp[randomInt(trans_comp.length)];
      addArcUnique(arcs, arcKeySet, pm, tc, 1);
      bridged = true;
    }
    if (trans_main.length > 0 && places_comp.length > 0) {
      var tm = trans_main[randomInt(trans_main.length)];
      var pc = places_comp[randomInt(places_comp.length)];
      addArcUnique(arcs, arcKeySet, tm, pc, 1);
      bridged = true;
    }
    if (!bridged) {
      if (places_comp.length > 0 && trans_main.length > 0) {
        addArcUnique(arcs, arcKeySet, places_comp[0], trans_main[0], 1);
      } else if (trans_comp.length > 0 && places_main.length > 0) {
        addArcUnique(arcs, arcKeySet, trans_comp[0], places_main[0], 1);
      }
    }
    mainComp = mainComp.concat(comp);
  }
}

function ensureNoDanglingNodes(nodes, arcs, arcKeySet) {
  var places = nodes.filter(function(n) { return n.type === "place"; });
  var transitions = nodes.filter(function(n) { return n.type === "transition"; });
  var connected = new Set();
  arcs.forEach(function(a) { connected.add(a.from); connected.add(a.to); });

  places.forEach(function(p) {
    if (connected.has(p.id)) return;
    if (transitions.length > 0) {
      var t = transitions[randomInt(transitions.length)];
      addArcUnique(arcs, arcKeySet, p.id, t.id, 1);
      addArcUnique(arcs, arcKeySet, t.id, p.id, 1);
      connected.add(p.id);
    }
  });

  transitions.forEach(function(t) {
    if (connected.has(t.id)) return;
    if (places.length > 0) {
      var p = places[randomInt(places.length)];
      addArcUnique(arcs, arcKeySet, p.id, t.id, 1);
      addArcUnique(arcs, arcKeySet, t.id, p.id, 1);
      connected.add(t.id);
    }
  });
}

function generateRefinementCoreArcs(netType, placeIds, transitionIds, arcs, arcKeySet, preferSafe) {
  if (placeIds.length === 0 || transitionIds.length === 0) {
    return { efcInputSet: [], starterPlaceIds: [] };
  }

  if (netType === "mg" || netType === "efc" || netType === "sm") {
    var info = generateCoreArcsByType(netType, placeIds, transitionIds, arcs, arcKeySet, preferSafe);
    return {
      efcInputSet: info.efcInputSet || [],
      starterPlaceIds: placeIds.slice(0, 1)
    };
  }

  var usedPlaces = new Set();
  var usedTransitions = new Set();

  var seedP = placeIds[0];
  var seedT = transitionIds[0];
  addArcUnique(arcs, arcKeySet, seedP, seedT, 1);
  addArcUnique(arcs, arcKeySet, seedT, seedP, 1);
  usedPlaces.add(seedP);
  usedTransitions.add(seedT);

  var poolP = placeIds.slice(1);
  var poolT = transitionIds.slice(1);

  var allUsed = function() { return poolP.length === 0 && poolT.length === 0; };

  var maxIter = (placeIds.length + transitionIds.length) * 3;
  var iter = 0;

  while (!allUsed() && iter < maxIter) {
    iter++;
    var roll = randomInt(100);
    var usedPArr = Array.from(usedPlaces);
    var usedTArr = Array.from(usedTransitions);

    if (roll < 30 && poolP.length >= 1 && poolT.length >= 1) {
      var newP = poolP.shift();
      var newT = poolT.shift();
      var existP = usedPArr[randomInt(usedPArr.length)];
      var existT = usedTArr[randomInt(usedTArr.length)];
      addArcUnique(arcs, arcKeySet, existP, newT, 1);
      addArcUnique(arcs, arcKeySet, newT, newP, 1);
      addArcUnique(arcs, arcKeySet, newP, existT, 1);
      usedPlaces.add(newP);
      usedTransitions.add(newT);
    }
    else if (roll < 55 && poolP.length >= 2 && poolT.length >= 2) {
      var pA = poolP.shift();
      var pB = poolP.shift();
      var tSplit = poolT.shift();
      var tJoin = poolT.shift();
      var anchorP = usedPArr[randomInt(usedPArr.length)];
      var anchorT = usedTArr[randomInt(usedTArr.length)];
      addArcUnique(arcs, arcKeySet, anchorP, tSplit, 1);
      addArcUnique(arcs, arcKeySet, tSplit, pA, 1);
      addArcUnique(arcs, arcKeySet, tSplit, pB, 1);
      addArcUnique(arcs, arcKeySet, pA, tJoin, 1);
      addArcUnique(arcs, arcKeySet, pB, tJoin, 1);
      addArcUnique(arcs, arcKeySet, tJoin, anchorP, 1);
      usedPlaces.add(pA); usedPlaces.add(pB);
      usedTransitions.add(tSplit); usedTransitions.add(tJoin);
    }
    else if (roll < 75 && poolP.length >= 1 && poolT.length >= 2) {
      var loopP = poolP.shift();
      var tIn = poolT.shift();
      var tOut = poolT.shift();
      var baseP = usedPArr[randomInt(usedPArr.length)];
      addArcUnique(arcs, arcKeySet, baseP, tIn, 1);
      addArcUnique(arcs, arcKeySet, tIn, loopP, 1);
      addArcUnique(arcs, arcKeySet, loopP, tOut, 1);
      addArcUnique(arcs, arcKeySet, tOut, baseP, 1);
      usedPlaces.add(loopP);
      usedTransitions.add(tIn); usedTransitions.add(tOut);
    }
    else if (roll < 90 && poolP.length >= 1) {
      var extraP = poolP.shift();
      var srcT = usedTArr[randomInt(usedTArr.length)];
      var dstT = usedTArr[randomInt(usedTArr.length)];
      addArcUnique(arcs, arcKeySet, srcT, extraP, 1);
      addArcUnique(arcs, arcKeySet, extraP, dstT, 1);
      usedPlaces.add(extraP);
    }
    else if (poolT.length >= 1) {
      var extraT = poolT.shift();
      var srcP = usedPArr[randomInt(usedPArr.length)];
      var dstP = usedPArr[randomInt(usedPArr.length)];
      addArcUnique(arcs, arcKeySet, srcP, extraT, 1);
      addArcUnique(arcs, arcKeySet, extraT, dstP, 1);
      usedTransitions.add(extraT);
    }
    else if (poolP.length >= 1) {
      var lastP = poolP.shift();
      var anyT = usedTArr[randomInt(usedTArr.length)];
      addArcUnique(arcs, arcKeySet, anyT, lastP, 1);
      addArcUnique(arcs, arcKeySet, lastP, usedTArr[randomInt(usedTArr.length)], 1);
      usedPlaces.add(lastP);
    }
  }

  return {
    efcInputSet: [],
    starterPlaceIds: [seedP]
  };
}

function sanitizeGenerationMethod(value) {
  const raw = String(value || "adaptive").toLowerCase();
  if (raw === "workflow" || raw === "region" || raw === "refinement") {
    return raw;
  }
  return "adaptive";
}

function generationMethodLabel(methodName) {
  const method = sanitizeGenerationMethod(methodName);
  if (method === "workflow") {
    return "Workflow patterns (process-tree)";
  }
  if (method === "region") {
    return "Region-inspired (TS -> PN)";
  }
  if (method === "refinement") {
    return "Stepwise Refinement";
  }
  return tr("core.generator.method.adaptive");
}

function generationMethodReference(methodName) {
  const method = sanitizeGenerationMethod(methodName);
  if (method === "workflow") {
    return "Jouck et al. (BPMD 2016) + van Zelst et al. (Algorithms 2020)";
  }
  if (method === "region") {
    return tr("core.generator.reference.region");
  }
  if (method === "refinement") {
    return "Murata (1989), Desel & Esparza (1995), MCC benchmark generation";
  }
  return "Esparza, Desel (free-choice/decomposition inspired)";
}

function createRedundantAutomataModules(modulePlaceIds, moduleTransitionIds, arcs, arcKeySet) {
  const modules = [];
  const moduleCount = Math.floor(Math.min(modulePlaceIds.length, moduleTransitionIds.length) / 2);
  for (let i = 0; i < moduleCount; i += 1) {
    const p1 = modulePlaceIds[i * 2];
    const p2 = modulePlaceIds[i * 2 + 1];
    const t1 = moduleTransitionIds[i * 2];
    const t2 = moduleTransitionIds[i * 2 + 1];
    if (!p1 || !p2 || !t1 || !t2) {
      continue;
    }
    addArcUnique(arcs, arcKeySet, p1, t1, 1);
    addArcUnique(arcs, arcKeySet, t1, p2, 1);
    addArcUnique(arcs, arcKeySet, p2, t2, 1);
    addArcUnique(arcs, arcKeySet, t2, p1, 1);
    modules.push({
      places: [p1, p2],
      transitions: [t1, t2]
    });
  }
  return modules;
}

function generateWorkflowCoreArcs(netType, placeIds, transitionIds, arcs, arcKeySet, preferSafe) {
  if (placeIds.length === 0 || transitionIds.length === 0) {
    return { efcInputSet: [], starterPlaceIds: [] };
  }

  if (netType === "mg" || netType === "efc") {
    const info = generateCoreArcsByType(netType, placeIds, transitionIds, arcs, arcKeySet, preferSafe);
    return {
      efcInputSet: info.efcInputSet || [],
      starterPlaceIds: placeIds.slice(0, 1)
    };
  }

  const orderedPlaces = shuffled(placeIds);
  const orderedTransitions = shuffled(transitionIds);
  orderedTransitions.forEach((transitionId, index) => {
    const inPlace = orderedPlaces[index % orderedPlaces.length];
    const outPlace = orderedPlaces[(index + 1) % orderedPlaces.length];
    addArcUnique(arcs, arcKeySet, inPlace, transitionId, 1);
    addArcUnique(arcs, arcKeySet, transitionId, outPlace, 1);
  });

  if (netType === "any") {
    const patternPasses = Math.max(1, Math.floor(transitionIds.length / 4));
    for (let pass = 0; pass < patternPasses; pass += 1) {
      const pick = randomInt(100);
      if (pick < 45 && transitionIds.length >= 2) {
        const pair = pickDistinct(transitionIds, 2);
        if (pair.length >= 2) {
          const inPlace = orderedPlaces[randomInt(orderedPlaces.length)];
          const outPlace = orderedPlaces[(randomInt(orderedPlaces.length) + 1) % orderedPlaces.length];
          addArcUnique(arcs, arcKeySet, inPlace, pair[0], 1);
          addArcUnique(arcs, arcKeySet, inPlace, pair[1], 1);
          addArcUnique(arcs, arcKeySet, pair[0], outPlace, 1);
          addArcUnique(arcs, arcKeySet, pair[1], outPlace, 1);
        }
        continue;
      }
      if (pick < 80 && transitionIds.length >= 3 && placeIds.length >= 3) {
        const ts = pickDistinct(transitionIds, 3);
        if (ts.length === 3) {
          const pEntry = orderedPlaces[randomInt(orderedPlaces.length)];
          const pBranch = orderedPlaces[(randomInt(orderedPlaces.length) + 2) % orderedPlaces.length];
          const pExit = orderedPlaces[(randomInt(orderedPlaces.length) + 1) % orderedPlaces.length];
          addArcUnique(arcs, arcKeySet, pEntry, ts[0], 1);
          addArcUnique(arcs, arcKeySet, ts[0], pBranch, 1);
          addArcUnique(arcs, arcKeySet, pBranch, ts[1], 1);
          addArcUnique(arcs, arcKeySet, pBranch, ts[2], 1);
          addArcUnique(arcs, arcKeySet, ts[1], pExit, 1);
          addArcUnique(arcs, arcKeySet, ts[2], pExit, 1);
        }
        continue;
      }
      const tLoop = orderedTransitions[pass % orderedTransitions.length];
      const pIn = orderedPlaces[(pass + 1) % orderedPlaces.length];
      const pOut = orderedPlaces[pass % orderedPlaces.length];
      addArcUnique(arcs, arcKeySet, pIn, tLoop, 1);
      addArcUnique(arcs, arcKeySet, tLoop, pOut, 1);
    }
  }

  return {
    efcInputSet: [],
    starterPlaceIds: orderedPlaces.slice(0, 1)
  };
}

function generateRegionInspiredCoreArcs(netType, placeIds, transitionIds, arcs, arcKeySet, preferSafe) {
  if (placeIds.length === 0 || transitionIds.length === 0) {
    return { efcInputSet: [], starterPlaceIds: [] };
  }

  if (netType === "mg" || netType === "efc") {
    const info = generateCoreArcsByType(netType, placeIds, transitionIds, arcs, arcKeySet, preferSafe);
    return {
      efcInputSet: info.efcInputSet || [],
      starterPlaceIds: placeIds.slice(0, 1)
    };
  }

  const states = shuffled(placeIds);
  const events = shuffled(transitionIds);
  events.forEach((transitionId, index) => {
    const fromState = states[index % states.length];
    const toState = states[(index + 1) % states.length];
    addArcUnique(arcs, arcKeySet, fromState, transitionId, 1);
    addArcUnique(arcs, arcKeySet, transitionId, toState, 1);
  });

  if (netType === "any") {
    const extraEdges = Math.max(1, Math.floor(transitionIds.length / 2));
    for (let i = 0; i < extraEdges; i += 1) {
      const transitionId = events[i % events.length];
      const fromState = states[randomInt(states.length)];
      const toState = states[randomInt(states.length)];
      addArcUnique(arcs, arcKeySet, fromState, transitionId, 1);
      addArcUnique(arcs, arcKeySet, transitionId, toState, 1);
    }
  }

  return {
    efcInputSet: [],
    starterPlaceIds: states.slice(0, 1)
  };
}

function generateCoreArcsByMethod(params, corePlaceIds, coreTransitionIds, arcs, arcKeySet) {
  const method = sanitizeGenerationMethod(params.method);
  const resolvedType = params.netType === "pn" ? "any" : params.netType;
  const preferSafe = params.safeOption === "yes";

  if (method === "workflow") {
    const info = generateWorkflowCoreArcs(resolvedType, corePlaceIds, coreTransitionIds, arcs, arcKeySet, preferSafe);
    return {
      method,
      resolvedType,
      efcInputSet: info.efcInputSet || [],
      starterPlaceIds: info.starterPlaceIds || []
    };
  }

  if (method === "region") {
    const info = generateRegionInspiredCoreArcs(resolvedType, corePlaceIds, coreTransitionIds, arcs, arcKeySet, preferSafe);
    return {
      method,
      resolvedType,
      efcInputSet: info.efcInputSet || [],
      starterPlaceIds: info.starterPlaceIds || []
    };
  }

  if (method === "refinement") {
    const info = generateRefinementCoreArcs(resolvedType, corePlaceIds, coreTransitionIds, arcs, arcKeySet, preferSafe);
    return {
      method,
      resolvedType,
      efcInputSet: info.efcInputSet || [],
      starterPlaceIds: info.starterPlaceIds || []
    };
  }

  const info = generateCoreArcsByType(resolvedType, corePlaceIds, coreTransitionIds, arcs, arcKeySet, preferSafe);
  return {
    method: "adaptive",
    resolvedType,
    efcInputSet: info.efcInputSet || [],
    starterPlaceIds: corePlaceIds.slice(0, 1)
  };
}

/**
 * Constructive generation of live + safe Petri nets.
 *
 * Based on:
 *  - Commoner/Hack theorem (FC nets: live iff every siphon contains marked trap)
 *  - Marked graph liveness (strongly connected + every cycle has a token)
 *  - SM-cover composition (state machine components with 1 token each)
 *
 * Algorithm:
 *  1. Build a strongly connected backbone cycle: P1→T1→P2→T2→...→Pn→Tn→P1
 *  2. Apply liveness+safety-preserving refinements (parallel branches, choice blocks)
 *  3. Place exactly 1 token per S-component (cycle)
 *  4. Verify via state space (should pass on first or second attempt)
 */
function buildLiveSafeCandidate(placeCount, transitionCount, netType, method) {
  var nodes = [];
  var arcs = [];
  var arcKeySet = new Set();
  var pIds = [];
  var tIds = [];

  for (var i = 1; i <= placeCount; i++) {
    var pid = "P" + i;
    pIds.push(pid);
    nodes.push({ id: pid, type: "place", label: pid, tokens: 0, x: null, y: null, angle: 0 });
  }
  for (var j = 1; j <= transitionCount; j++) {
    var tid = "T" + j;
    tIds.push(tid);
    nodes.push({ id: tid, type: "transition", label: tid, tokens: 0, x: null, y: null, angle: 0 });
  }

  if (pIds.length === 0 || tIds.length === 0) {
    return { nodes: nodes, arcs: arcs, pIds: pIds, tIds: tIds };
  }

  var coreSize = Math.min(pIds.length, tIds.length);

  if (netType === "mg") {
    // Marked Graph: strongly connected, 1 input + 1 output per place
    // Build Hamiltonian cycle, then connect remaining nodes
    var sp = shuffled(pIds);
    var st = shuffled(tIds);
    for (var k = 0; k < coreSize; k++) {
      addArcUnique(arcs, arcKeySet, sp[k], st[k], 1);
      addArcUnique(arcs, arcKeySet, st[k], sp[(k + 1) % coreSize], 1);
    }
    // Extra transitions → insert into cycle
    for (var m = coreSize; m < tIds.length; m++) {
      var insertAfter = randomInt(coreSize);
      addArcUnique(arcs, arcKeySet, sp[insertAfter], st[m], 1);
      addArcUnique(arcs, arcKeySet, st[m], sp[(insertAfter + 1) % coreSize], 1);
    }
    // Extra places → insert into cycle
    for (var n = coreSize; n < pIds.length; n++) {
      var tSrc = randomInt(st.length);
      var tDst = randomInt(st.length);
      if (tDst === tSrc) tDst = (tSrc + 1) % st.length;
      addArcUnique(arcs, arcKeySet, st[tSrc], sp[n], 1);
      addArcUnique(arcs, arcKeySet, sp[n], st[tDst], 1);
    }
    // Marking: 1 token in first place of cycle → guarantees liveness for SC MG
    nodes.forEach(function(nd) {
      if (nd.type === "place") nd.tokens = 0;
    });
    nodes.find(function(nd) { return nd.id === sp[0]; }).tokens = 1;
    // Add tokens to additional cycles if needed
    if (pIds.length > coreSize) {
      for (var q = coreSize; q < pIds.length; q++) {
        if (Math.random() < 0.3) {
          nodes.find(function(nd) { return nd.id === sp[q]; }).tokens = 1;
        }
      }
    }
  }
  else if (netType === "sm") {
    // State Machine: each T has exactly 1 input P and 1 output P
    var smp = shuffled(pIds);
    var smt = shuffled(tIds);
    for (var k2 = 0; k2 < coreSize; k2++) {
      addArcUnique(arcs, arcKeySet, smp[k2], smt[k2], 1);
      addArcUnique(arcs, arcKeySet, smt[k2], smp[(k2 + 1) % coreSize], 1);
    }
    for (var m2 = coreSize; m2 < tIds.length; m2++) {
      var pIn = randomInt(smp.length);
      var pOut = (pIn + 1 + randomInt(Math.max(1, smp.length - 1))) % smp.length;
      addArcUnique(arcs, arcKeySet, smp[pIn], smt[m2], 1);
      addArcUnique(arcs, arcKeySet, smt[m2], smp[pOut], 1);
    }
    for (var n2 = coreSize; n2 < pIds.length; n2++) {
      var tA = randomInt(smt.length);
      var tB = (tA + 1) % smt.length;
      addArcUnique(arcs, arcKeySet, smt[tA], smp[n2], 1);
      addArcUnique(arcs, arcKeySet, smp[n2], smt[tB], 1);
    }
    nodes.forEach(function(nd) { if (nd.type === "place") nd.tokens = 0; });
    nodes.find(function(nd) { return nd.id === smp[0]; }).tokens = 1;
  }
  else {
    // General PN / FC / EFC / any — SM-cover composition
    // Build overlapping state machine cycles that cover all places
    var allP = shuffled(pIds);
    var allT = shuffled(tIds);

    // Phase 1: Build backbone cycle through all places
    var backboneT = allT.slice(0, Math.min(allP.length, allT.length));
    var bbSize = Math.min(allP.length, backboneT.length);
    for (var b = 0; b < bbSize; b++) {
      addArcUnique(arcs, arcKeySet, allP[b], backboneT[b], 1);
      addArcUnique(arcs, arcKeySet, backboneT[b], allP[(b + 1) % allP.length], 1);
    }

    // Phase 2: Remaining transitions — create choice/parallel structures
    var remainingT = allT.slice(bbSize);
    for (var r = 0; r < remainingT.length; r++) {
      var roll = randomInt(100);
      if (roll < 50) {
        // Choice: share input place with existing T, different output
        var srcP = allP[randomInt(allP.length)];
        var dstP = allP[randomInt(allP.length)];
        addArcUnique(arcs, arcKeySet, srcP, remainingT[r], 1);
        addArcUnique(arcs, arcKeySet, remainingT[r], dstP, 1);
      } else {
        // Parallel path between two places
        var pFrom = randomInt(allP.length);
        var pTo = (pFrom + 1 + randomInt(Math.max(1, allP.length - 1))) % allP.length;
        addArcUnique(arcs, arcKeySet, allP[pFrom], remainingT[r], 1);
        addArcUnique(arcs, arcKeySet, remainingT[r], allP[pTo], 1);
      }
    }

    // Phase 3: Extra places (not in backbone) — insert between existing transitions
    for (var ep = bbSize; ep < allP.length && ep < pIds.length; ep++) {
      if (backboneT.length > 0) {
        var tSrc2 = backboneT[randomInt(backboneT.length)];
        var tDst2 = (allT.length > 1) ? allT[randomInt(allT.length)] : backboneT[0];
        addArcUnique(arcs, arcKeySet, tSrc2, allP[ep], 1);
        addArcUnique(arcs, arcKeySet, allP[ep], tDst2, 1);
      }
    }

    // Phase 4: Smart marking — 1 token in backbone, propagate S-invariant
    nodes.forEach(function(nd) { if (nd.type === "place") nd.tokens = 0; });
    nodes.find(function(nd) { return nd.id === allP[0]; }).tokens = 1;

    // Add second token in a strategic position for larger nets
    if (allP.length > 6 && backboneT.length > 3) {
      var midPoint = Math.floor(allP.length / 2);
      nodes.find(function(nd) { return nd.id === allP[midPoint]; }).tokens = 1;
    }
  }

  ensureNoDanglingNodes(nodes, arcs, arcKeySet);
  ensureWeakConnectivity(nodes, arcs, arcKeySet);

  // Clamp all tokens to max 1 (safety)
  nodes.forEach(function(nd) {
    if (nd.type === "place" && nd.tokens > 1) nd.tokens = 1;
  });

  return { nodes: nodes, arcs: arcs, pIds: pIds, tIds: tIds };
}

function buildGeneratedNetCandidate(params) {
  const placeCount = params.placeCount;
  const transitionCount = params.transitionCount;
  const requestedModules = params.redundantCount;
  const selectedMethod = sanitizeGenerationMethod(params.method);

  const base = createBaseGeneratorNodes(placeCount, transitionCount);
  const nodes = base.nodes;
  const placeIds = base.placeIds;
  const transitionIds = base.transitionIds;
  const arcs = [];
  const arcKeySet = new Set();

  const moduleCount = computeModuleCount(placeCount, transitionCount, requestedModules);
  const modulePlaceIds = placeIds.slice(0, moduleCount * 2);
  const moduleTransitionIds = transitionIds.slice(0, moduleCount * 2);
  const corePlaceIds = placeIds.slice(moduleCount * 2);
  const coreTransitionIds = transitionIds.slice(moduleCount * 2);

  const modules = createRedundantAutomataModules(modulePlaceIds, moduleTransitionIds, arcs, arcKeySet);
  const coreInfo = generateCoreArcsByMethod(
    {
      netType: params.netType,
      safeOption: params.safeOption,
      method: selectedMethod
    },
    corePlaceIds,
    coreTransitionIds,
    arcs,
    arcKeySet
  );

  if ((coreInfo.resolvedType === "any") && corePlaceIds.length > 0) {
    modules.forEach((module, index) => {
      const corePlace = corePlaceIds[index % corePlaceIds.length];
      addArcUnique(arcs, arcKeySet, corePlace, module.transitions[0], 1);
      addArcUnique(arcs, arcKeySet, module.transitions[1], corePlace, 1);
    });
  }

  ensureNoDanglingNodes(nodes, arcs, arcKeySet);
  ensureWeakConnectivity(nodes, arcs, arcKeySet);

  const starterPlaces = (coreInfo.starterPlaceIds || []).concat(corePlaceIds);
  const optionsForMarking = {
    liveOption: params.liveOption,
    safeOption: params.safeOption,
    netType: params.netType
  };
  applyInitialMarking(nodes, placeIds, modules, starterPlaces, optionsForMarking, coreInfo.efcInputSet || []);
  const methodLabel = generationMethodLabel(selectedMethod);
  const methodReference = generationMethodReference(selectedMethod);

  return {
    nodes,
    arcs,
    metadata: [
      { key: "Generator", value: "POOH Random Net Generator" },
      { key: "GeneratedType", value: params.netType.toUpperCase() },
      { key: "GeneratedMethod", value: methodLabel },
      { key: "GeneratedMethodReference", value: methodReference },
      { key: "GeneratedPlaces", value: String(placeCount) },
      { key: "GeneratedTransitions", value: String(transitionCount) },
      { key: "GeneratedRedundantAutomataSubnets", value: String(modules.length) },
      { key: "GeneratedLiveTarget", value: params.liveOption },
      { key: "GeneratedSafeTarget", value: params.safeOption }
    ],
    counters: {
      place: placeCount + 1,
      transition: transitionCount + 1,
      arc: arcs.length + 1
    },
    actualModules: modules.length
  };
}

function matchesExpectedFlag(option, value) {
  if (option === "any") {
    return true;
  }
  if (option === "yes") {
    return value === true;
  }
  return value === false;
}

function matchesRequestedNetType(typeName, classificationMap) {
  const type = typeName || "any";
  if (type === "any" || type === "pn") {
    return classificationMap.get("PN") === true;
  }
  if (type === "mg") {
    return classificationMap.get("MG") === true;
  }
  if (type === "fc") {
    return classificationMap.get("FC") === true;
  }
  if (type === "efc") {
    return classificationMap.get("EFC") === true;
  }
  if (type === "sm") {
    return classificationMap.get("SM") === true;
  }
  return classificationMap.get("PN") === true;
}

function sanitizeCount(value, fallback) {
  const parsed = parseInt(String(value || fallback), 10);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }
  return Math.min(240, parsed);
}

/**
 * Compute minimal p-invariant supports for a generated net (inline, lightweight).
 * Returns array of Sets of place IDs representing SM-component supports.
 */
function computeSmComponentSupports(nodes, arcs) {
  var places = nodes.filter(function(n) { return n.type === "place"; })
    .sort(function(a, b) { return a.id.localeCompare(b.id); });
  var transitions = nodes.filter(function(n) { return n.type === "transition"; })
    .sort(function(a, b) { return a.id.localeCompare(b.id); });

  var pIdx = new Map(); places.forEach(function(p, i) { pIdx.set(p.id, i); });
  var tIdx = new Map(); transitions.forEach(function(t, i) { tIdx.set(t.id, i); });

  var nP = places.length, nT = transitions.length;
  if (nP === 0 || nT === 0) return [];

  // Build incidence matrix
  var C = [];
  for (var i = 0; i < nP; i++) { C.push(new Array(nT).fill(0)); }
  arcs.forEach(function(a) {
    var w = Math.max(1, parseInt(String(a.weight || 1), 10) || 1);
    var pF = pIdx.get(a.from), pT = pIdx.get(a.to);
    var tF = tIdx.get(a.from), tT = tIdx.get(a.to);
    if (pF !== undefined && tT !== undefined) C[pF][tT] -= w;
    if (tF !== undefined && pT !== undefined) C[pT][tF] += w;
  });

  // Farkas/Martinez-Silva: find minimal non-negative solutions of C^T * x = 0
  // Simplified: compute supports of SM-components via structural analysis
  // For each transition, find input and output places
  var tIn = new Map(), tOut = new Map();
  transitions.forEach(function(t) { tIn.set(t.id, new Set()); tOut.set(t.id, new Set()); });
  arcs.forEach(function(a) {
    if (pIdx.has(a.from) && tIdx.has(a.to)) tIn.get(a.to).add(a.from);
    if (tIdx.has(a.from) && pIdx.has(a.to)) tOut.get(a.from).add(a.to);
  });

  // Find SM-components: subnets where each transition has |•t|=1, |t•|=1, and subnet is strongly connected
  // Start from each place, try to build SM cycle
  var supports = [];
  var supportKeys = new Set();

  function trySMFrom(startPlace) {
    // BFS/DFS to find a cycle through places and transitions
    // where each transition on the path has exactly 1 input and 1 output in the subnet
    var visited = new Set();
    var path = [];

    function dfs(place) {
      if (visited.has(place)) {
        if (place === startPlace && path.length >= 2) {
          // Found a cycle — collect places
          var cyclePlaces = new Set();
          for (var pi = 0; pi < path.length; pi++) {
            if (pIdx.has(path[pi])) cyclePlaces.add(path[pi]);
          }
          if (cyclePlaces.size >= 2) {
            var key = Array.from(cyclePlaces).sort().join(",");
            if (!supportKeys.has(key)) {
              supportKeys.add(key);
              supports.push(cyclePlaces);
            }
          }
          return;
        }
        return;
      }
      visited.add(place);
      path.push(place);

      // Find transitions that this place feeds into
      var outTrans = [];
      arcs.forEach(function(a) {
        if (a.from === place && tIdx.has(a.to)) outTrans.push(a.to);
      });

      outTrans.forEach(function(tid) {
        // Find output places of this transition
        var outPlaces = [];
        arcs.forEach(function(a) {
          if (a.from === tid && pIdx.has(a.to)) outPlaces.push(a.to);
        });
        if (outPlaces.length > 0) {
          path.push(tid);
          outPlaces.forEach(function(nextP) { dfs(nextP); });
          path.pop();
        }
      });

      visited.delete(place);
      path.pop();
    }

    dfs(startPlace);
  }

  places.forEach(function(p) { trySMFrom(p.id); });

  // Filter: keep only minimal supports
  var minimal = [];
  for (var a = 0; a < supports.length; a++) {
    var isMinimal = true;
    for (var b = 0; b < supports.length; b++) {
      if (a === b) continue;
      if (supports[b].size < supports[a].size) {
        var isSubset = true;
        supports[b].forEach(function(v) { if (!supports[a].has(v)) isSubset = false; });
        if (isSubset) { isMinimal = false; break; }
      }
    }
    if (isMinimal) minimal.push(supports[a]);
  }

  return minimal;
}

/**
 * Check if a generated net's selection hypergraph is an xt-hypergraph.
 * Returns { isXt: boolean, componentCount: number, reason: string }.
 */
async function checkSelectionHypergraphXt(nodes, arcs) {
  var supports = computeSmComponentSupports(nodes, arcs);
  if (supports.length === 0) {
    return { isXt: false, componentCount: 0, reason: "no_sm_components" };
  }

  // Build selection hypergraph: vertices = places, edges = SM-component supports
  var places = nodes.filter(function(n) { return n.type === "place"; });
  var placeSet = new Set(places.map(function(p) { return p.id; }));

  // Check coverage: all places must be in at least one SM-component
  var covered = new Set();
  supports.forEach(function(s) { s.forEach(function(v) { covered.add(v); }); });
  var uncovered = [];
  placeSet.forEach(function(p) { if (!covered.has(p)) uncovered.push(p); });
  if (uncovered.length > 0) {
    return { isXt: false, componentCount: supports.length, reason: "uncovered_places" };
  }

  var placeList = Array.from(placeSet);
  var matrix = supports.map(function(support, index) {
    return placeList.map(function(placeId) {
      return support.has(placeId) ? 1 : 0;
    });
  });
  var rowLabels = supports.map(function(_, index) { return "D" + (index + 1); });

  var result = await requireXtrecCoreFunction("computeXtrec")({
    matrix: matrix,
    rowLabels: rowLabels,
    colLabels: placeList,
    acceleration: "cpu"
  });
  return {
    isXt: Boolean(result && result.isXt),
    componentCount: supports.length,
    reason: result && result.isXt
      ? "xtrec_passed"
      : ((result && result.witness && result.witness.message) ? result.witness.message : "xtrec_failed"),
    xtrec: result
  };
}

/**
 * Constructive generation of a Petri net whose selection hypergraph is guaranteed to be an xt-hypergraph.
 *
 * Strategy (based on Eiter 1994 + Wisniewski/Stefanowicz SM-cover theory):
 * 1. Partition places into k SM-components (cycles)
 * 2. Each component forms an automaton cycle: P1→T1→P2→T2→...→Pk→Tk→P1
 * 3. Share transitions between adjacent components (creating synchronization points)
 * 4. This ensures each place belongs to exactly one SM-component → trivially xt
 * 5. Optionally add controlled overlaps that preserve the xt property
 */
function buildXtHypergraphNet(placeCount, transitionCount, netType) {
  var nodes = [];
  var arcs = [];
  var arcKeySet = new Set();
  var pIds = [], tIds = [];

  for (var i = 1; i <= placeCount; i++) {
    var pid = "P" + i;
    pIds.push(pid);
    nodes.push({ id: pid, type: "place", label: pid, tokens: 0, x: null, y: null, angle: 0 });
  }
  for (var j = 1; j <= transitionCount; j++) {
    var tid = "T" + j;
    tIds.push(tid);
    nodes.push({ id: tid, type: "transition", label: tid, tokens: 0, x: null, y: null, angle: 0 });
  }

  if (pIds.length < 2 || tIds.length < 2) {
    // Too small — just make a simple cycle
    if (pIds.length > 0 && tIds.length > 0) {
      addArcUnique(arcs, arcKeySet, pIds[0], tIds[0], 1);
      addArcUnique(arcs, arcKeySet, tIds[0], pIds[0], 1);
      nodes.find(function(n) { return n.id === pIds[0]; }).tokens = 1;
    }
    return { nodes: nodes, arcs: arcs };
  }

  // Determine number of SM-components
  // Each component needs at least 2 places and 2 transitions
  var maxComponents = Math.floor(Math.min(placeCount, transitionCount) / 2);
  var numComponents = Math.max(1, Math.min(maxComponents, Math.floor(Math.sqrt(placeCount))));

  // Distribute places across components (each component gets at least 2)
  var componentPlaces = [];
  var placesPerComp = Math.max(2, Math.floor(placeCount / numComponents));
  var pPool = shuffled(pIds);
  for (var c = 0; c < numComponents; c++) {
    var start = c * placesPerComp;
    var end = (c === numComponents - 1) ? pPool.length : Math.min(start + placesPerComp, pPool.length);
    if (start >= pPool.length) break;
    var compPlaces = pPool.slice(start, end);
    if (compPlaces.length >= 2) {
      componentPlaces.push(compPlaces);
    } else if (componentPlaces.length > 0) {
      // Merge into previous component
      compPlaces.forEach(function(p) { componentPlaces[componentPlaces.length - 1].push(p); });
    }
  }

  // Distribute transitions
  var tPool = shuffled(tIds);
  var tPoolIdx = 0;

  // Phase 1: Build each SM-component as a cycle
  var componentTransitions = [];
  componentPlaces.forEach(function(compP) {
    var compT = [];
    // Each component needs at least as many transitions as places (for a cycle)
    var needed = compP.length;
    for (var ci = 0; ci < needed && tPoolIdx < tPool.length; ci++) {
      compT.push(tPool[tPoolIdx++]);
    }
    // If we don't have enough transitions, reuse from this component
    while (compT.length < compP.length) {
      compT.push(compT[compT.length % Math.max(1, compT.length)]);
    }
    componentTransitions.push(compT);

    // Build cycle: P[0]→T[0]→P[1]→T[1]→...→P[n-1]→T[n-1]→P[0]
    for (var k = 0; k < compP.length; k++) {
      var tIdx = k % compT.length;
      addArcUnique(arcs, arcKeySet, compP[k], compT[tIdx], 1);
      addArcUnique(arcs, arcKeySet, compT[tIdx], compP[(k + 1) % compP.length], 1);
    }
  });

  // Phase 2: Connect components via shared transitions (synchronization)
  // This preserves xt property because places still belong to their component
  for (var ci = 0; ci < componentPlaces.length - 1 && ci + 1 < componentPlaces.length; ci++) {
    var compA = componentPlaces[ci];
    var compB = componentPlaces[ci + 1];

    if (tPoolIdx < tPool.length) {
      // Use fresh transition as synchronization point
      var syncT = tPool[tPoolIdx++];
      addArcUnique(arcs, arcKeySet, compA[0], syncT, 1);
      addArcUnique(arcs, arcKeySet, syncT, compA[0], 1);
      addArcUnique(arcs, arcKeySet, compB[0], syncT, 1);
      addArcUnique(arcs, arcKeySet, syncT, compB[0], 1);
    } else {
      // Share an existing transition between components
      var sharedT = componentTransitions[ci][0];
      addArcUnique(arcs, arcKeySet, compB[0], sharedT, 1);
      addArcUnique(arcs, arcKeySet, sharedT, compB[0], 1);
    }
  }

  // Phase 3: Use remaining transitions
  while (tPoolIdx < tPool.length) {
    var extraT = tPool[tPoolIdx++];
    var compIdx = randomInt(componentPlaces.length);
    var comp = componentPlaces[compIdx];
    if (comp.length >= 2) {
      var pA = comp[randomInt(comp.length)];
      var pB = comp[(comp.indexOf(pA) + 1) % comp.length];
      addArcUnique(arcs, arcKeySet, pA, extraT, 1);
      addArcUnique(arcs, arcKeySet, extraT, pB, 1);
    }
  }

  // Phase 4: Initial marking — one token per SM-component
  componentPlaces.forEach(function(compP) {
    var nd = nodes.find(function(n) { return n.id === compP[0]; });
    if (nd) nd.tokens = 1;
  });

  // Clamp tokens for safety
  nodes.forEach(function(nd) {
    if (nd.type === "place" && nd.tokens > 1) nd.tokens = 1;
  });

  ensureNoDanglingNodes(nodes, arcs, arcKeySet);
  ensureWeakConnectivity(nodes, arcs, arcKeySet);

  return { nodes: nodes, arcs: arcs };
}

function sanitizeParams(raw) {
  const placeCount = sanitizeCount(raw.placeCount, 12);
  const transitionCount = sanitizeCount(raw.transitionCount, 12);
  const netType = String(raw.netType || "any");
  const method = sanitizeGenerationMethod(raw.method || "adaptive");
  const liveOption = String(raw.liveOption || "any");
  const safeOption = String(raw.safeOption || "any");
  const redundantRaw = parseInt(String(raw.redundantCount || 1), 10);
  const redundantCount = Math.max(0, Number.isInteger(redundantRaw) ? redundantRaw : 1);
  const xtHypergraph = Boolean(raw.xtHypergraph);
  return {
    placeCount,
    transitionCount,
    netType,
    method,
    liveOption,
    safeOption,
    redundantCount,
    xtHypergraph
  };
}

function clampCount(value) {
  return Math.max(1, Math.min(240, parseInt(String(value || 1), 10) || 1));
}

function buildAdaptiveParamSchedule(baseParams) {
  const basePlace = clampCount(baseParams.placeCount);
  const baseTransition = clampCount(baseParams.transitionCount);
  const maxShift = Math.max(2, Math.min(30, Math.floor((basePlace + baseTransition) / 4)));
  const variants = [];

  for (let dp = -maxShift; dp <= maxShift; dp += 1) {
    for (let dt = -maxShift; dt <= maxShift; dt += 1) {
      const placeCount = clampCount(basePlace + dp);
      const transitionCount = clampCount(baseTransition + dt);
      const key = `${placeCount}:${transitionCount}`;
      variants.push({
        placeCount,
        transitionCount,
        netType: baseParams.netType,
        method: sanitizeGenerationMethod(baseParams.method),
        liveOption: baseParams.liveOption,
        safeOption: baseParams.safeOption,
        redundantCount: baseParams.redundantCount,
        _distance: Math.abs(dp) + Math.abs(dt),
        _key: `${key}:${sanitizeGenerationMethod(baseParams.method)}`
      });
    }
  }

  variants.sort((a, b) => {
    if (a._distance !== b._distance) {
      return a._distance - b._distance;
    }
    return randomInt(3) - 1;
  });

  const seen = new Set();
  const deduped = [];
  variants.forEach((item) => {
    if (seen.has(item._key)) {
      return;
    }
    seen.add(item._key);
    deduped.push({
      placeCount: item.placeCount,
      transitionCount: item.transitionCount,
      netType: item.netType,
      method: item.method,
      liveOption: item.liveOption,
      safeOption: item.safeOption,
      redundantCount: item.redundantCount
    });
  });

  return deduped.slice(0, 600);
}

async function generateRandomNetWithConstraints(params, jobId) {
  var useLiveSafe = (params.liveOption === "yes" && params.safeOption === "yes");
  var requireXt = Boolean(params.xtHypergraph);

  // ── xt-hypergraph constructive path ──
  if (requireXt) {
    var xtAttemptsLimit = 300;
    var xtLastReason = tr("core.generator.noXtNet");

    for (var xtAttempt = 1; xtAttempt <= xtAttemptsLimit; xtAttempt++) {
      if (xtAttempt === 1 || xtAttempt % 5 === 0) {
        postMessage({
          type: "progress",
          jobId: jobId,
          attempt: xtAttempt,
          total: xtAttemptsLimit,
          message: tr("core.generator.attempt", {
            attempt: xtAttempt,
            total: xtAttemptsLimit,
            method: tr("core.generator.method.constructiveXt"),
            places: params.placeCount,
            transitions: params.transitionCount
          })
        });
      }

      var xtResult = buildXtHypergraphNet(params.placeCount, params.transitionCount, params.netType);
      var xtClassRows = computeClassificationFor(xtResult.nodes, xtResult.arcs);
      var xtClassMap = classificationToMap(xtClassRows);

      if (!matchesRequestedNetType(params.netType, xtClassMap)) {
        xtLastReason = tr("core.generator.wrongNetType");
        continue;
      }

      var xtAnalysis = computeLivenessSafenessFor(xtResult.nodes, xtResult.arcs, 2600);

      if (xtAnalysis.truncated) {
        xtLastReason = tr("core.generator.stateLimitReached");
        continue;
      }

      // Check liveness/safety constraints
      if (!matchesExpectedFlag(params.liveOption, xtAnalysis.live)) {
        xtLastReason = tr("core.generator.livenessFailedXt");
        continue;
      }
      if (!matchesExpectedFlag(params.safeOption, xtAnalysis.safe)) {
        xtLastReason = tr("core.generator.safenessFailedXt");
        continue;
      }

      // Verify xt-hypergraph property
      var xtCheck = await checkSelectionHypergraphXt(xtResult.nodes, xtResult.arcs);
      if (!xtCheck.isXt) {
        xtLastReason = tr("core.generator.selectionNotXt", { reason: xtCheck.reason });
        continue;
      }

      var xtMethodLabel = "Constructive xt-hypergraph (SM-cover partition)";
      var xtMethodRef = "Eiter (1994), Wisniewski & Stefanowicz (2013/2018), SM-cover decomposition";

      return {
        nodes: xtResult.nodes,
        arcs: xtResult.arcs,
        metadata: [
          { key: "Generator", value: "POOH Random Net Generator" },
          { key: "GeneratedType", value: params.netType.toUpperCase() },
          { key: "GeneratedMethod", value: xtMethodLabel },
          { key: "GeneratedMethodReference", value: xtMethodRef },
          { key: "GeneratedPlaces", value: String(params.placeCount) },
          { key: "GeneratedTransitions", value: String(params.transitionCount) },
          { key: "GeneratedRedundantAutomataSubnets", value: "0" },
          { key: "GeneratedLiveTarget", value: params.liveOption },
          { key: "GeneratedSafeTarget", value: params.safeOption },
          { key: "GeneratedXtHypergraph", value: "yes" },
          { key: "GeneratedSmComponents", value: String(xtCheck.componentCount) }
        ],
        counters: {
          place: params.placeCount + 1,
          transition: params.transitionCount + 1,
          arc: xtResult.arcs.length + 1
        },
        actualModules: 0,
        settings: { layoutMode: String(params.layoutMode || "smart") },
        view: { zoom: 1, panX: 0, panY: 0 },
        analysis: xtAnalysis,
        attempt: xtAttempt,
        classification: xtClassRows,
        xtHypergraphInfo: xtCheck,
        usedParams: {
          placeCount: params.placeCount,
          transitionCount: params.transitionCount,
          redundantCount: 0,
          method: "xt-hypergraph-constructive"
        }
      };
    }

    throw new Error(tr("core.generator.changeParameters", { reason: xtLastReason }));
  }

  // ── Constructive live+safe path ──
  if (useLiveSafe) {
    var lsAttemptsLimit = 200;
    var lsLastReason = tr("core.generator.noMatchingModel");
    var resolvedType = params.netType === "pn" ? "any" : params.netType;

    for (var lsAttempt = 1; lsAttempt <= lsAttemptsLimit; lsAttempt++) {
      if (lsAttempt === 1 || lsAttempt % 5 === 0) {
        postMessage({
          type: "progress",
          jobId: jobId,
          attempt: lsAttempt,
          total: lsAttemptsLimit,
          message: tr("core.generator.attempt", {
            attempt: lsAttempt,
            total: lsAttemptsLimit,
            method: tr("core.generator.method.constructiveLiveSafe"),
            places: params.placeCount,
            transitions: params.transitionCount
          })
        });
      }

      var lsResult = buildLiveSafeCandidate(params.placeCount, params.transitionCount, resolvedType, params.method);
      var lsClassRows = computeClassificationFor(lsResult.nodes, lsResult.arcs);
      var lsClassMap = classificationToMap(lsClassRows);

      if (!matchesRequestedNetType(params.netType, lsClassMap)) {
        lsLastReason = tr("core.generator.wrongNetType");
        continue;
      }

      var lsAnalysis = computeLivenessSafenessFor(lsResult.nodes, lsResult.arcs, 2600);

      if (lsAnalysis.truncated) {
        lsLastReason = tr("core.generator.stateLimitReached");
        continue;
      }
      if (!lsAnalysis.live) {
        lsLastReason = tr("core.generator.livenessFailedConstructive");
        continue;
      }
      if (!lsAnalysis.safe) {
        lsLastReason = tr("core.generator.safenessFailedConstructive");
        continue;
      }

      var lsMethodLabel = "Constructive live+safe (SM-cover / SC-backbone)";
      var lsMethodRef = "Commoner/Hack theorem, SM-cover composition, Desel & Esparza (1995)";

      return {
        nodes: lsResult.nodes,
        arcs: lsResult.arcs,
        metadata: [
          { key: "Generator", value: "POOH Random Net Generator" },
          { key: "GeneratedType", value: params.netType.toUpperCase() },
          { key: "GeneratedMethod", value: lsMethodLabel },
          { key: "GeneratedMethodReference", value: lsMethodRef },
          { key: "GeneratedPlaces", value: String(params.placeCount) },
          { key: "GeneratedTransitions", value: String(params.transitionCount) },
          { key: "GeneratedRedundantAutomataSubnets", value: "0" },
          { key: "GeneratedLiveTarget", value: "yes" },
          { key: "GeneratedSafeTarget", value: "yes" }
        ],
        counters: {
          place: params.placeCount + 1,
          transition: params.transitionCount + 1,
          arc: lsResult.arcs.length + 1
        },
        actualModules: 0,
        settings: { layoutMode: String(params.layoutMode || "smart") },
        view: { zoom: 1, panX: 0, panY: 0 },
        analysis: lsAnalysis,
        attempt: lsAttempt,
        classification: lsClassRows,
        usedParams: {
          placeCount: params.placeCount,
          transitionCount: params.transitionCount,
          redundantCount: 0,
          method: "live-safe-constructive"
        }
      };
    }

    throw new Error(tr("core.generator.changeParametersExample", { reason: lsLastReason }));
  }

  // Standard generate-and-test approach
  const adaptiveParams = buildAdaptiveParamSchedule(params);
  const attemptsLimit = Math.max(220, Math.min(2800, adaptiveParams.length * 3));
  let lastReason = tr("core.generator.noMatchingModel");

  for (let attempt = 1; attempt <= attemptsLimit; attempt += 1) {
    const variantIndex = (attempt - 1) % adaptiveParams.length;
    const currentParams = adaptiveParams[variantIndex];
    if (attempt === 1 || attempt % 5 === 0) {
      postMessage({
        type: "progress",
        jobId,
        attempt,
        total: attemptsLimit,
        message: tr("core.generator.attempt", {
          attempt,
          total: attemptsLimit,
          method: generationMethodLabel(currentParams.method),
          places: currentParams.placeCount,
          transitions: currentParams.transitionCount
        })
      });
    }

    const candidate = buildGeneratedNetCandidate(currentParams);
    const classRows = computeClassificationFor(candidate.nodes, candidate.arcs);
    const classMap = classificationToMap(classRows);
    if (!matchesRequestedNetType(currentParams.netType, classMap)) {
      lastReason = tr("core.generator.wrongNetType");
      continue;
    }

    const analysis = computeLivenessSafenessFor(candidate.nodes, candidate.arcs, 2600);
    if ((currentParams.liveOption !== "any" || currentParams.safeOption !== "any") && analysis.truncated) {
      lastReason = tr("core.generator.stateLimitReached");
      continue;
    }
    if (!matchesExpectedFlag(currentParams.liveOption, analysis.live)) {
      lastReason = tr("core.generator.livenessFailed");
      continue;
    }
    if (!matchesExpectedFlag(currentParams.safeOption, analysis.safe)) {
      lastReason = tr("core.generator.safenessFailed");
      continue;
    }

    candidate.settings = { layoutMode: String(params.layoutMode || "smart") };
    candidate.view = { zoom: 1, panX: 0, panY: 0 };
    candidate.analysis = analysis;
    candidate.attempt = attempt;
    candidate.classification = classRows;
    candidate.usedParams = {
      placeCount: currentParams.placeCount,
      transitionCount: currentParams.transitionCount,
      redundantCount: currentParams.redundantCount,
      method: sanitizeGenerationMethod(currentParams.method)
    };
    return candidate;
  }

  throw new Error(tr("core.generator.changeParameters", { reason: lastReason }));
}

/**
 * Time-limited exhaustive search across P/T ranges.
 *
 * Iterates through all (P,T) combinations within [minP..maxP]x[minT..maxT],
 * trying multiple random candidates at each size, respecting the time limit.
 * Returns the best result found (prefers live+safe, then live, then safe, then any valid).
 */
function runTimeLimitedSearch(searchParams, jobId) {
  var minP = Math.max(1, Math.min(240, parseInt(String(searchParams.minPlaces || 1), 10) || 1));
  var maxP = Math.max(minP, Math.min(240, parseInt(String(searchParams.maxPlaces || 20), 10) || 20));
  var minT = Math.max(1, Math.min(240, parseInt(String(searchParams.minTransitions || 1), 10) || 1));
  var maxT = Math.max(minT, Math.min(240, parseInt(String(searchParams.maxTransitions || 20), 10) || 20));
  var timeLimitMs = Math.max(1000, Math.min(600000, parseInt(String(searchParams.timeLimitMs || 30000), 10) || 30000));
  var netType = String(searchParams.netType || "any");
  var method = sanitizeGenerationMethod(searchParams.method || "adaptive");
  var liveOption = String(searchParams.liveOption || "any");
  var safeOption = String(searchParams.safeOption || "any");
  var redundantCount = Math.max(0, parseInt(String(searchParams.redundantCount || 0), 10) || 0);
  var layoutMode = String(searchParams.layoutMode || "smart");

  var startTime = Date.now();
  var bestResult = null;
  var bestScore = -1;
  var totalAttempts = 0;
  var testedCombinations = 0;
  var totalCombinations = (maxP - minP + 1) * (maxT - minT + 1);

  // Build list of (P,T) pairs sorted by distance from center
  var centerP = Math.round((minP + maxP) / 2);
  var centerT = Math.round((minT + maxT) / 2);
  var pairs = [];
  for (var p = minP; p <= maxP; p++) {
    for (var t = minT; t <= maxT; t++) {
      pairs.push({ p: p, t: t, dist: Math.abs(p - centerP) + Math.abs(t - centerT) });
    }
  }
  // Shuffle within same distance for variety
  pairs.sort(function(a, b) {
    if (a.dist !== b.dist) return a.dist - b.dist;
    return Math.random() - 0.5;
  });

  var useLiveSafe = (liveOption === "yes" && safeOption === "yes");

  for (var pi = 0; pi < pairs.length; pi++) {
    var elapsed = Date.now() - startTime;
    if (elapsed >= timeLimitMs) break;

    var pair = pairs[pi];
    testedCombinations++;

    // How many attempts per combination — more time left = more attempts
    var remainingMs = timeLimitMs - elapsed;
    var remainingPairs = pairs.length - pi;
    var attemptsPerPair = Math.max(3, Math.min(50, Math.floor(remainingMs / (remainingPairs * 15))));

    for (var att = 0; att < attemptsPerPair; att++) {
      if (Date.now() - startTime >= timeLimitMs) break;
      totalAttempts++;

      if (totalAttempts === 1 || totalAttempts % 10 === 0) {
        postMessage({
          type: "progress",
          jobId: jobId,
          attempt: totalAttempts,
          total: 0,
          message: "Szukanie: P=" + pair.p + " T=" + pair.t + " (" + testedCombinations + "/" + totalCombinations + " kombinacji, " + totalAttempts + " prob, " + Math.round(elapsed / 1000) + "s/" + Math.round(timeLimitMs / 1000) + "s)"
        });
      }

      try {
        var candidate;
        var params = {
          placeCount: pair.p,
          transitionCount: pair.t,
          netType: netType,
          method: method,
          liveOption: liveOption,
          safeOption: safeOption,
          redundantCount: redundantCount,
          layoutMode: layoutMode
        };

        if (useLiveSafe) {
          var resolvedType = netType === "pn" ? "any" : netType;
          var lsResult = buildLiveSafeCandidate(pair.p, pair.t, resolvedType, method);
          candidate = {
            nodes: lsResult.nodes,
            arcs: lsResult.arcs,
            metadata: [
              { key: "Generator", value: "POOH Random Net Generator (Search)" },
              { key: "GeneratedType", value: netType.toUpperCase() },
              { key: "GeneratedMethod", value: "Constructive live+safe (time-limited search)" },
              { key: "GeneratedMethodReference", value: "Commoner/Hack, SM-cover" },
              { key: "GeneratedPlaces", value: String(pair.p) },
              { key: "GeneratedTransitions", value: String(pair.t) },
              { key: "GeneratedLiveTarget", value: "yes" },
              { key: "GeneratedSafeTarget", value: "yes" },
              { key: "SearchTimeLimitMs", value: String(timeLimitMs) },
              { key: "SearchRange", value: "P[" + minP + "-" + maxP + "] T[" + minT + "-" + maxT + "]" }
            ],
            counters: { place: pair.p + 1, transition: pair.t + 1, arc: lsResult.arcs.length + 1 },
            actualModules: 0
          };
        } else {
          candidate = buildGeneratedNetCandidate(params);
        }

        var classRows = computeClassificationFor(candidate.nodes, candidate.arcs);
        var classMap = classificationToMap(classRows);

        if (!matchesRequestedNetType(netType, classMap)) continue;

        var analysis = computeLivenessSafenessFor(candidate.nodes, candidate.arcs, 2600);
        if (analysis.truncated) continue;

        // Score: higher is better
        var score = 0;
        if (analysis.live) score += 10;
        if (analysis.safe) score += 10;
        if (liveOption === "yes" && !analysis.live) continue;
        if (liveOption === "no" && analysis.live) continue;
        if (safeOption === "yes" && !analysis.safe) continue;
        if (safeOption === "no" && analysis.safe) continue;

        // Bonus for matching exact requested P/T counts
        score += 5 - Math.min(5, Math.abs(pair.p - centerP) + Math.abs(pair.t - centerT));

        if (score > bestScore) {
          bestScore = score;
          candidate.settings = { layoutMode: layoutMode };
          candidate.view = { zoom: 1, panX: 0, panY: 0 };
          candidate.analysis = analysis;
          candidate.attempt = totalAttempts;
          candidate.classification = classRows;
          candidate.usedParams = {
            placeCount: pair.p,
            transitionCount: pair.t,
            redundantCount: redundantCount,
            method: useLiveSafe ? "live-safe-constructive" : method
          };

          // Update metadata with search info
          if (!useLiveSafe) {
            candidate.metadata = candidate.metadata || [];
            candidate.metadata.push({ key: "SearchTimeLimitMs", value: String(timeLimitMs) });
            candidate.metadata.push({ key: "SearchRange", value: "P[" + minP + "-" + maxP + "] T[" + minT + "-" + maxT + "]" });
            candidate.metadata.push({ key: "SearchAttempt", value: String(totalAttempts) });
          }

          bestResult = candidate;

          // Perfect match — stop early
          if ((liveOption !== "yes" || analysis.live) &&
              (liveOption !== "no" || !analysis.live) &&
              (safeOption !== "yes" || analysis.safe) &&
              (safeOption !== "no" || !analysis.safe)) {
            // Found a valid result, but keep searching for better if time allows
            if (score >= 20) break; // Perfect live+safe
          }
        }
      } catch (e) {
        // Candidate generation failed, try next
      }
    }

    // If we found a perfect result, stop the outer loop too
    if (bestScore >= 20) break;
  }

  var totalElapsed = Date.now() - startTime;

  if (!bestResult) {
    throw new Error(tr("core.generator.searchTimeout", {
      seconds: Math.round(totalElapsed / 1000),
      attempts: totalAttempts,
      minPlaces: minP,
      maxPlaces: maxP,
      minTransitions: minT,
      maxTransitions: maxT
    }));
  }

  // Add search summary to metadata
  bestResult.metadata = bestResult.metadata || [];
  bestResult.metadata.push({ key: "SearchDurationMs", value: String(totalElapsed) });
  bestResult.metadata.push({ key: "SearchTotalAttempts", value: String(totalAttempts) });
  bestResult.metadata.push({ key: "SearchTestedCombinations", value: String(testedCombinations) + "/" + String(totalCombinations) });

  return bestResult;
}

  return {
    setProgressSink,
    clearProgressSink,
    sanitizeParams,
    sanitizeGenerationMethod,
    generationMethodLabel,
    generateRandomNetWithConstraints,
    runTimeLimitedSearch,
    buildGeneratedNetCandidate,
    buildLiveSafeCandidate,
    buildXtHypergraphNet,
    checkSelectionHypergraphXt,
    computeSmComponentSupports
  };
});
