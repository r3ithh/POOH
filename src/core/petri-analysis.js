(function(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("./i18n"));
  } else {
    root.PoohPetriAnalysisCore = factory(root.PoohI18n);
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function(i18n) {
  "use strict";

  function tr(key, params) {
    return i18n && typeof i18n.t === "function" ? i18n.t(key, params) : String(key || "");
  }

  function naturalLabelCompare(a, b) {
    return String(a || "").localeCompare(String(b || ""), "pl", {
      numeric: true,
      sensitivity: "base"
    });
  }

  function normalizePetriWeight(value) {
    return Math.max(1, parseInt(String(value || 1), 10) || 1);
  }

  function hasCommonElement(a, b) {
    if (!a || !b) {
      return false;
    }
    for (const item of a) {
      if (b.has(item)) {
        return true;
      }
    }
    return false;
  }

  function sameSet(a, b) {
    if (!a || !b || a.size !== b.size) {
      return false;
    }
    for (const item of a) {
      if (!b.has(item)) {
        return false;
      }
    }
    return true;
  }

  function computeClassificationFor(nodes, arcs) {
    const safeNodes = Array.isArray(nodes) ? nodes : [];
    const safeArcs = Array.isArray(arcs) ? arcs : [];
    const nodeMap = new Map(safeNodes.map((node) => [String(node && node.id), node || {}]));
    const places = safeNodes.filter((node) => node && node.type === "place");
    const transitions = safeNodes.filter((node) => node && node.type === "transition");

    const inByTransition = new Map(transitions.map((node) => [String(node.id), new Set()]));
    const outByTransition = new Map(transitions.map((node) => [String(node.id), new Set()]));
    const inByPlace = new Map(places.map((node) => [String(node.id), new Set()]));
    const outByPlace = new Map(places.map((node) => [String(node.id), new Set()]));

    let pn = true;
    let ordinary = true;

    safeArcs.forEach((arc) => {
      const from = nodeMap.get(String(arc && arc.from));
      const to = nodeMap.get(String(arc && arc.to));
      if (!from || !to || from.type === to.type) {
        pn = false;
        return;
      }
      if (normalizePetriWeight(arc && arc.weight) !== 1) {
        ordinary = false;
      }

      if (from.type === "place") {
        const transitionInputs = inByTransition.get(String(to.id));
        const placeOutputs = outByPlace.get(String(from.id));
        if (transitionInputs) transitionInputs.add(String(from.id));
        if (placeOutputs) placeOutputs.add(String(to.id));
      } else {
        const transitionOutputs = outByTransition.get(String(from.id));
        const placeInputs = inByPlace.get(String(to.id));
        if (transitionOutputs) transitionOutputs.add(String(to.id));
        if (placeInputs) placeInputs.add(String(from.id));
      }
    });

    const sm = transitions.length > 0 && transitions.every((transition) =>
      (inByTransition.get(String(transition.id)) || new Set()).size === 1 &&
      (outByTransition.get(String(transition.id)) || new Set()).size === 1
    );

    const mg = places.length > 0 && places.every((place) =>
      (inByPlace.get(String(place.id)) || new Set()).size === 1 &&
      (outByPlace.get(String(place.id)) || new Set()).size === 1
    );

    let fc = true;
    places.forEach((place) => {
      if (!fc) {
        return;
      }
      const outputs = outByPlace.get(String(place.id));
      if (!outputs || outputs.size <= 1) {
        return;
      }
      outputs.forEach((transitionId) => {
        const inSet = inByTransition.get(String(transitionId));
        if (!inSet || inSet.size !== 1) {
          fc = false;
        }
      });
    });

    let efc = true;
    for (let i = 0; i < transitions.length; i += 1) {
      if (!efc) {
        break;
      }
      for (let j = i + 1; j < transitions.length; j += 1) {
        const inA = inByTransition.get(String(transitions[i].id)) || new Set();
        const inB = inByTransition.get(String(transitions[j].id)) || new Set();
        if (hasCommonElement(inA, inB) && !sameSet(inA, inB)) {
          efc = false;
          break;
        }
      }
    }

    return [
      { code: "PN", ok: pn, note: tr("core.petri.pnNote") },
      { code: "OPN", ok: pn && ordinary, note: tr("core.petri.opnNote") },
      { code: "SM", ok: pn && sm, note: tr("core.petri.smNote") },
      { code: "MG", ok: pn && mg, note: tr("core.petri.mgNote") },
      { code: "FC", ok: pn && fc, note: tr("core.petri.fcNote") },
      { code: "EFC", ok: pn && efc, note: tr("core.petri.efcNote") }
    ];
  }

  function classificationToMap(classificationRows) {
    const result = new Map();
    (Array.isArray(classificationRows) ? classificationRows : []).forEach((item) => {
      result.set(String(item && item.code), Boolean(item && item.ok));
    });
    return result;
  }

  function buildTransitionRulesFor(nodes, arcs, placeIds) {
    const safeNodes = Array.isArray(nodes) ? nodes : [];
    const safeArcs = Array.isArray(arcs) ? arcs : [];
    const safePlaceIds = Array.isArray(placeIds) ? placeIds.map((id) => String(id)) : [];
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
      (Array.isArray(transition.inputs) ? transition.inputs : []).every((input) =>
        Number(safeMarking[input.index] || 0) >= Number(input.weight || 1)
      )
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

  function computeLivenessSafenessFor(nodes, arcs, maxStates) {
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

    if (places.length === 0 || transitions.length === 0) {
      return {
        placeCount: places.length,
        transitionCount: transitions.length,
        statesCount: 0,
        safe: true,
        live: false,
        truncated: false,
        maxTokenSeen: 0,
        deadlocksCount: 0,
        transitionCountChecked: transitions.length
      };
    }

    const limit = Math.max(200, parseInt(String(maxStates || 3500), 10) || 3500);
    const placeIds = places.map((place) => String(place.id));
    const initial = places.map((place) => Math.max(0, parseInt(String(place.tokens || 0), 10) || 0));
    const transitionRules = buildTransitionRulesFor(safeNodes, safeArcs, placeIds);

    const queue = [initial];
    const markingByKey = new Map();
    const adjacency = new Map();
    const reverseAdj = new Map();
    const enabledByState = new Map();
    const deadlocks = [];

    const initialKey = initial.join(",");
    markingByKey.set(initialKey, initial);
    let truncated = false;
    let maxTokenSeen = 0;
    let safe = true;

    while (queue.length > 0) {
      const current = queue.shift();
      const currentKey = current.join(",");
      adjacency.set(currentKey, adjacency.get(currentKey) || []);
      reverseAdj.set(currentKey, reverseAdj.get(currentKey) || []);

      current.forEach((value) => {
        if (value > maxTokenSeen) {
          maxTokenSeen = value;
        }
        if (value > 1) {
          safe = false;
        }
      });

      const enabled = computeEnabledTransitionsForMarking(current, transitionRules);
      enabledByState.set(currentKey, enabled.map((item) => item.id));
      if (enabled.length === 0) {
        deadlocks.push(currentKey);
      }

      enabled.forEach((transitionRule) => {
        const next = fireOnMarking(current, transitionRule);
        const nextKey = next.join(",");

        adjacency.get(currentKey).push({ to: nextKey, transitionId: transitionRule.id });
        if (!reverseAdj.has(nextKey)) {
          reverseAdj.set(nextKey, []);
        }
        reverseAdj.get(nextKey).push({ from: currentKey, transitionId: transitionRule.id });

        if (!markingByKey.has(nextKey)) {
          if (markingByKey.size >= limit) {
            truncated = true;
            return;
          }
          markingByKey.set(nextKey, next);
          queue.push(next);
        }
      });

      if (truncated) {
        break;
      }
    }

    const allStateKeys = Array.from(markingByKey.keys());
    const transitionIds = transitionRules.map((item) => item.id);
    const perTransitionLive = new Map();

    transitionIds.forEach((transitionId) => {
      const enablingStates = allStateKeys.filter((stateKey) => {
        const enabled = enabledByState.get(stateKey) || [];
        return enabled.includes(transitionId);
      });

      if (enablingStates.length === 0) {
        perTransitionLive.set(transitionId, false);
        return;
      }

      const canReachEnabled = new Set(enablingStates);
      const reverseQueue = enablingStates.slice();
      while (reverseQueue.length > 0) {
        const currentKey = reverseQueue.shift();
        const reverseEdges = reverseAdj.get(currentKey) || [];
        reverseEdges.forEach((edge) => {
          if (canReachEnabled.has(edge.from)) {
            return;
          }
          canReachEnabled.add(edge.from);
          reverseQueue.push(edge.from);
        });
      }

      perTransitionLive.set(
        transitionId,
        allStateKeys.every((stateKey) => canReachEnabled.has(stateKey))
      );
    });

    return {
      placeCount: places.length,
      transitionCount: transitions.length,
      statesCount: markingByKey.size,
      safe,
      live: transitionIds.every((id) => perTransitionLive.get(id)),
      truncated,
      maxTokenSeen,
      deadlocksCount: deadlocks.length,
      transitionCountChecked: transitionIds.length,
      statesLimit: limit
    };
  }

  return {
    naturalLabelCompare,
    normalizePetriWeight,
    hasCommonElement,
    sameSet,
    computeClassificationFor,
    classificationToMap,
    buildTransitionRulesFor,
    computeEnabledTransitionsForMarking,
    fireOnMarking,
    computeLivenessSafenessFor
  };
});
