(function (root) {
  "use strict";

  function tr(key, params) {
    return root.PoohI18n && typeof root.PoohI18n.t === "function"
      ? root.PoohI18n.t(key, params)
      : String(key || "");
  }

  function asArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function normalizeLabels(labels, prefix, count) {
    const safe = asArray(labels).map((label) => String(label || "").trim());
    const out = [];
    for (let index = 0; index < count; index += 1) {
      out.push(safe[index] || `${prefix}${index + 1}`);
    }
    return out;
  }

  function normalizeMatrix(matrix) {
    const rows = asArray(matrix);
    const colCount = rows.reduce((max, row) => Math.max(max, asArray(row).length), 0);
    return rows.map((row) => {
      const safeRow = asArray(row);
      return Array.from({ length: colCount }, (_, index) => Number(safeRow[index] || 0) > 0 ? 1 : 0);
    });
  }

  function rowKey(row) {
    return asArray(row).map((value) => Number(value || 0) > 0 ? "1" : "0").join("");
  }

  function compareSetValues(a, b) {
    const aNumber = Number(a);
    const bNumber = Number(b);
    if (Number.isFinite(aNumber) && Number.isFinite(bNumber)) {
      return aNumber - bNumber;
    }
    return String(a).localeCompare(String(b), "pl", { numeric: true, sensitivity: "base" });
  }

  function setKey(set) {
    return Array.from(set || []).sort(compareSetValues).join("|");
  }

  function membersOfRow(row) {
    const members = [];
    asArray(row).forEach((value, index) => {
      if (Number(value || 0) > 0) {
        members.push(index);
      }
    });
    return members;
  }

  function hasIntersection(a, b) {
    const smaller = a.size <= b.size ? a : b;
    const larger = a.size <= b.size ? b : a;
    for (const value of smaller) {
      if (larger.has(value)) {
        return true;
      }
    }
    return false;
  }

  function isSubset(a, b) {
    for (const value of a) {
      if (!b.has(value)) {
        return false;
      }
    }
    return true;
  }

  function isProperSubset(a, b) {
    return a.size < b.size && isSubset(a, b);
  }

  function labelsFromSet(set, labels, limit) {
    const safeLimit = Math.max(1, Number(limit || 8));
    const values = Array.from(set || [])
      .sort(compareSetValues)
      .slice(0, safeLimit)
      .map((index) => {
        if (Number.isInteger(index) && labels[index] !== undefined) {
          return labels[index];
        }
        return String(index);
      });
    const suffix = set && set.size > safeLimit ? ", ..." : "";
    return `{${values.join(", ")}${suffix}}`;
  }

  function sampleList(items, limit) {
    return asArray(items).slice(0, Math.max(1, Number(limit || 4)));
  }

  function makeRule(id, title, status, summary, evidence) {
    return {
      id,
      title,
      status,
      passed: status === "pass",
      summary,
      evidence: sampleList(evidence, 6)
    };
  }

  function buildEdgeData(matrix, rowLabels, colLabels) {
    return matrix.map((row, rowIndex) => {
      const members = membersOfRow(row);
      return {
        index: rowIndex,
        label: rowLabels[rowIndex] || `E${rowIndex + 1}`,
        members,
        memberSet: new Set(members),
        size: members.length,
        memberLabels: members.map((index) => colLabels[index] || `v${index + 1}`)
      };
    });
  }

  function buildColumnSupports(matrix, rowLabels, colLabels) {
    return colLabels.map((label, colIndex) => {
      const indices = [];
      matrix.forEach((row, rowIndex) => {
        if (Number(asArray(row)[colIndex] || 0) > 0) {
          indices.push(rowIndex);
        }
      });
      return {
        index: colIndex,
        label,
        set: new Set(indices),
        placeLabels: indices.map((index) => rowLabels[index] || `E${index + 1}`)
      };
    });
  }

  function normalizeComponentPlaces(componentPlaces, colLabels) {
    if (!componentPlaces || typeof componentPlaces !== "object") {
      return null;
    }
    const mapped = colLabels.map((label, index) => {
      let raw = componentPlaces[label];
      if (raw === undefined) {
        raw = componentPlaces[index];
      }
      const values = asArray(raw)
        .map((value) => String(value || "").trim())
        .filter(Boolean);
      return {
        index,
        label,
        set: new Set(values),
        placeLabels: values
      };
    });
    return mapped.some((item) => item.set.size > 0) ? mapped : null;
  }

  function detectDuplicateEdges(edgeData, colLabels) {
    const classes = new Map();
    edgeData.forEach((edge) => {
      const key = setKey(edge.memberSet);
      if (!classes.has(key)) {
        classes.set(key, []);
      }
      classes.get(key).push(edge);
    });
    return Array.from(classes.values())
      .filter((items) => items.length > 1)
      .map((items) => ({
        labels: items.map((item) => item.label),
        vertices: labelsFromSet(items[0].memberSet, colLabels)
      }));
  }

  function detectDominatedVertices(supports, labelsForSets) {
    const examples = [];
    for (let i = 0; i < supports.length; i += 1) {
      for (let j = 0; j < supports.length; j += 1) {
        if (i === j) {
          continue;
        }
        const a = supports[i];
        const b = supports[j];
        if (a.set.size > 0 && isProperSubset(a.set, b.set)) {
          examples.push(`${a.label}⊂${b.label}: ${labelsFromSet(a.set, labelsForSets)}`);
          if (examples.length >= 6) {
            return examples;
          }
        }
      }
    }
    return examples;
  }

  function analyzeDisjointModules(edgeData, componentSupports, colLabels, hasComponentPlaces) {
    const examples = [];
    for (let i = 0; i < componentSupports.length; i += 1) {
      for (let j = i + 1; j < componentSupports.length; j += 1) {
        const left = componentSupports[i];
        const right = componentSupports[j];
        if (hasIntersection(left.set, right.set)) {
          examples.push(`${left.label}∩${right.label}=${labelsFromSet(intersectionSet(left.set, right.set), hasComponentPlaces ? [] : edgeData.map((edge) => edge.label))}`);
          if (examples.length >= 5) {
            break;
          }
        }
      }
    }
    if (examples.length === 0) {
      return makeRule(
        "R1",
        tr("structural.r1.title"),
        "pass",
        hasComponentPlaces
          ? tr("structural.r1.disjointPlaces")
          : tr("structural.r1.trivial"),
        []
      );
    }
    return makeRule(
      "R1",
      tr("structural.r1.title"),
      "fail",
      tr("structural.r1.overlap"),
      examples
    );
  }

  function intersectionSet(a, b) {
    const out = new Set();
    const smaller = a.size <= b.size ? a : b;
    const larger = a.size <= b.size ? b : a;
    for (const value of smaller) {
      if (larger.has(value)) {
        out.add(value);
      }
    }
    return out;
  }

  function analyzeDuplicateReduction(edgeData, colLabels, reduction) {
    const duplicates = detectDuplicateEdges(edgeData, colLabels);
    const removedRows = asArray(reduction && reduction.removedRowLabels).length;
    const removedCols = asArray(reduction && reduction.removedColLabels).length;
    if (duplicates.length === 0) {
      const reductionText = removedRows || removedCols
        ? tr("structural.r2.reduced", { edges: removedRows, vertices: removedCols })
        : tr("structural.r2.noDuplicates");
      return makeRule("R2", tr("structural.r2.title"), "pass", reductionText, []);
    }
    return makeRule(
      "R2",
      tr("structural.r2.title"),
      "fail",
      tr("structural.r2.duplicates"),
      duplicates.map((entry) => `${entry.labels.join("=")} ${entry.vertices}`)
    );
  }

  function analyzeLaminarity(componentSupports, labelsForSets, sourceNote) {
    const crossing = [];
    const dominated = detectDominatedVertices(componentSupports, labelsForSets);
    for (let i = 0; i < componentSupports.length; i += 1) {
      for (let j = i + 1; j < componentSupports.length; j += 1) {
        const left = componentSupports[i];
        const right = componentSupports[j];
        if (!hasIntersection(left.set, right.set)) {
          continue;
        }
        if (!isSubset(left.set, right.set) && !isSubset(right.set, left.set)) {
          crossing.push(`${left.label}/${right.label}: ${labelsFromSet(intersectionSet(left.set, right.set), labelsForSets)}`);
          if (crossing.length >= 6) {
            break;
          }
        }
      }
    }
    if (crossing.length > 0) {
      return makeRule(
        "R3",
        tr("structural.r3.title"),
        "fail",
        tr("structural.r3.notLaminar", { source: sourceNote }),
        crossing
      );
    }
    if (dominated.length > 0) {
      return makeRule(
        "R3",
        tr("structural.r3.title"),
        "warn",
        tr("structural.r3.dominated", { source: sourceNote }),
        dominated
      );
    }
    return makeRule(
      "R3",
      tr("structural.r3.title"),
      "pass",
      tr("structural.r3.pass", { source: sourceNote }),
      []
    );
  }

  function analyzeXtrec(xtrec) {
    if (!xtrec || typeof xtrec.isXt !== "boolean") {
      return makeRule(
        "R4",
        tr("structural.r4.title"),
        "unknown",
        tr("structural.r4.noResult"),
        []
      );
    }
    const checks = `${Number(xtrec.checksPerformed || 0)}/${Number(xtrec.checksTotal || 0)}`;
    const mode = String(xtrec.accelerationUsed || "cpu").toUpperCase();
    if (xtrec.isXt) {
      return makeRule(
        "R4",
        tr("structural.r4.title"),
        "pass",
        tr("structural.r4.result", { value: "TRUE", mode, checks }),
        []
      );
    }
    const evidence = xtrec.witness && xtrec.witness.message ? [String(xtrec.witness.message)] : [];
    return makeRule(
      "R4",
      tr("structural.r4.title"),
      "fail",
      tr("structural.r4.result", { value: "FALSE", mode, checks }),
      evidence
    );
  }

  function analyzeStarForest(edgeData, colLabels) {
    const duplicateEdges = detectDuplicateEdges(edgeData, colLabels);
    const largeEdges = edgeData.filter((edge) => edge.size > 2);
    if (duplicateEdges.length > 0 || largeEdges.length > 0) {
      const evidence = [];
      duplicateEdges.forEach((entry) => evidence.push(tr("structural.r5.duplicate", { labels: entry.labels.join("=") })));
      largeEdges.forEach((edge) => evidence.push(`${edge.label}: |E|=${edge.size}`));
      return makeRule(
        "R5",
        tr("structural.r5.title"),
        "fail",
        tr("structural.r5.requirement"),
        evidence
      );
    }

    const adjacency = colLabels.map(() => new Set());
    const singletonVertices = new Set();
    edgeData.forEach((edge) => {
      if (edge.size === 1) {
        singletonVertices.add(edge.members[0]);
      } else if (edge.size === 2) {
        adjacency[edge.members[0]].add(edge.members[1]);
        adjacency[edge.members[1]].add(edge.members[0]);
      }
    });

    const visited = new Set();
    const centerByVertex = new Map();
    const failures = [];

    for (let start = 0; start < colLabels.length; start += 1) {
      if (visited.has(start)) {
        continue;
      }
      const queue = [start];
      const component = [];
      visited.add(start);
      while (queue.length > 0) {
        const current = queue.shift();
        component.push(current);
        adjacency[current].forEach((next) => {
          if (!visited.has(next)) {
            visited.add(next);
            queue.push(next);
          }
        });
      }
      const degrees = component.map((index) => ({ index, degree: adjacency[index].size }));
      if (component.length === 1) {
        centerByVertex.set(component[0], true);
        continue;
      }
      const centers = degrees.filter((item) => item.degree === component.length - 1);
      const leavesOk = degrees.every((item) => item.degree === 1 || item.degree === component.length - 1);
      if (centers.length !== 1 || !leavesOk) {
        failures.push(tr("structural.r5.componentNotStar", { component: labelsFromSet(new Set(component), colLabels) }));
      } else {
        centerByVertex.set(centers[0].index, true);
      }
    }

    singletonVertices.forEach((vertexIndex) => {
      const degree = adjacency[vertexIndex].size;
      if (degree > 0 && !centerByVertex.get(vertexIndex)) {
        failures.push(tr("structural.r5.singletonNotCenter", { vertex: colLabels[vertexIndex] }));
      }
    });

    if (failures.length > 0) {
      return makeRule(
        "R5",
        tr("structural.r5.title"),
        "fail",
        tr("structural.r5.failure"),
        failures
      );
    }

    return makeRule(
      "R5",
      tr("structural.r5.title"),
      "pass",
      tr("structural.r5.pass"),
      []
    );
  }

  function analyzePetriAssumptions(petri, source) {
    if (source !== "selection") {
      return makeRule(
        "R6",
        tr("structural.r6.title"),
        "unknown",
        tr("structural.r6.manual"),
        []
      );
    }
    if (!petri || typeof petri !== "object") {
      return makeRule(
        "R6",
        tr("structural.r6.title"),
        "unknown",
        tr("structural.r6.noSnapshot"),
        []
      );
    }
    const evidence = [
      tr("structural.r6.states", {
        count: Number(petri.statesCount || petri.stateCount || 0),
        limit: Number(petri.statesLimit || 0) || "?"
      }),
      `maxToken=${Number(petri.maxTokenSeen || 0)}`,
      tr(petri.truncated ? "structural.r6.reachabilityIncomplete" : "structural.r6.reachabilityComplete")
    ];
    if (petri.safe && petri.live && !petri.truncated) {
      return makeRule(
        "R6",
        tr("structural.r6.title"),
        "pass",
        tr("structural.r6.pass"),
        evidence
      );
    }
    const status = petri.truncated ? "warn" : "fail";
    return makeRule(
      "R6",
      tr("structural.r6.title"),
      status,
      tr("structural.r6.result", {
        safe: tr(petri.safe ? "app.hypergraph.yes" : "app.hypergraph.no"),
        live: tr(petri.live ? "app.hypergraph.yes" : "app.hypergraph.no")
      }),
      evidence
    );
  }

  function analyze(input) {
    const safeInput = input && typeof input === "object" ? input : {};
    const matrix = normalizeMatrix(safeInput.matrix);
    const colCount = matrix.reduce((max, row) => Math.max(max, row.length), 0);
    const rowLabels = normalizeLabels(safeInput.rowLabels, "E", matrix.length);
    const colLabels = normalizeLabels(safeInput.colLabels, "v", colCount);
    const edgeData = buildEdgeData(matrix, rowLabels, colLabels);
    const columnSupports = buildColumnSupports(matrix, rowLabels, colLabels);
    const componentPlaces = normalizeComponentPlaces(safeInput.componentPlaces, colLabels);
    const componentSupports = componentPlaces || columnSupports;
    const labelsForComponentSets = componentPlaces
      ? Array.from(new Set(componentPlaces.flatMap((item) => item.placeLabels))).sort()
      : rowLabels;
    const hasComponentPlaces = Boolean(componentPlaces);
    const rules = [
      analyzeDisjointModules(edgeData, componentSupports, colLabels, hasComponentPlaces),
      analyzeDuplicateReduction(edgeData, colLabels, safeInput.reduction),
      analyzeLaminarity(
        componentSupports,
        labelsForComponentSets,
        tr(hasComponentPlaces ? "structural.source.componentPlaces" : "structural.source.incidence")
      ),
      analyzeXtrec(safeInput.xtrec),
      analyzeStarForest(edgeData, colLabels),
      analyzePetriAssumptions(safeInput.petri, String(safeInput.source || "manual"))
    ];
    const sufficientRules = rules
      .filter((rule) => rule.passed && (rule.id === "R1" || rule.id === "R3" || rule.id === "R4" || rule.id === "R5"))
      .map((rule) => rule.id);
    const petriRule = rules.find((rule) => rule.id === "R6");
    const source = String(safeInput.source || "manual");
    const petriOk = source !== "selection" || (petriRule && petriRule.status === "pass");
    const structurallyCertified = sufficientRules.length > 0 && petriOk;
    const xtrec = safeInput.xtrec && typeof safeInput.xtrec.isXt === "boolean" ? {
      available: true,
      isXt: Boolean(safeInput.xtrec.isXt),
      accelerationUsed: safeInput.xtrec.accelerationUsed || "cpu",
      checksPerformed: Number(safeInput.xtrec.checksPerformed || 0),
      checksTotal: Number(safeInput.xtrec.checksTotal || 0)
    } : { available: false, isXt: null };
    return {
      source,
      vertexCount: colLabels.length,
      edgeCount: rowLabels.length,
      rowLabels,
      colLabels,
      rules,
      sufficientRules,
      structurallyCertified,
      xtrec,
      conclusion: structurallyCertified ? "certified" : (xtrec.available ? (xtrec.isXt ? "xtrec-pass" : "fail") : "unknown"),
      notes: {
        componentSupportSource: hasComponentPlaces ? "component-places" : "incidence-supports",
        duplicateEdgeCount: detectDuplicateEdges(edgeData, colLabels).reduce((sum, item) => sum + item.labels.length - 1, 0)
      }
    };
  }

  root.PoohStructuralXt = {
    analyze,
    version: "2026-06-structural-xt"
  };
})(typeof window !== "undefined" ? window : globalThis);
