"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { buildBenchmarkProfileCsv, selectRepresentativeBenchmarkProfileRows } = require("../src/core/benchmark");
const { parsePnhText } = require("../src/core/pnh");
const i18n = require("../src/core/i18n");

i18n.setLanguage(process.env.POOH_LANGUAGE || process.env.LANG || "en");

function tr(key, params) {
  return i18n.t(key, params);
}

const repoRoot = path.resolve(__dirname, "..");
const dataRoot = path.join(repoRoot, "data", "pnh_libraries");

function parseArgs(argv) {
  const args = {
    libraryId: "lib_55033290a3fc3aa4",
    output: "",
    filter: "",
    limit: 0,
    sample: 0,
    sampleOutput: "",
    includeErrors: false
  };
  const positional = [];
  argv.forEach((arg) => {
    if (arg.startsWith("--filter=")) {
      args.filter = arg.slice("--filter=".length).trim().toLowerCase();
      return;
    }
    if (arg.startsWith("--limit=")) {
      const value = parseInt(arg.slice("--limit=".length), 10);
      args.limit = Number.isInteger(value) && value > 0 ? value : 0;
      return;
    }
    if (arg.startsWith("--sample=")) {
      const value = parseInt(arg.slice("--sample=".length), 10);
      args.sample = Number.isInteger(value) && value > 0 ? value : 0;
      return;
    }
    if (arg.startsWith("--sample-output=")) {
      args.sampleOutput = arg.slice("--sample-output=".length).trim();
      return;
    }
    if (arg === "--include-errors") {
      args.includeErrors = true;
      return;
    }
    positional.push(arg);
  });
  if (positional[0]) {
    args.libraryId = positional[0];
  }
  if (positional[1]) {
    args.output = positional[1];
  }
  return args;
}

function readLibraryName(libraryId) {
  const metaPath = path.join(dataRoot, libraryId, "library.json");
  try {
    const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
    return String(meta.name || libraryId);
  } catch (_) {
    return libraryId;
  }
}

function listPnhFiles(libraryId, filter, limit) {
  const filesDir = path.join(dataRoot, libraryId, "files");
  if (!fs.existsSync(filesDir)) {
    throw new Error(tr("script.profile.libraryDirectoryMissing", { path: filesDir }));
  }
  let names = fs.readdirSync(filesDir)
    .filter((name) => /\.pnh$/i.test(name))
    .sort((a, b) => a.localeCompare(b, i18n.getLanguage(), { numeric: true, sensitivity: "base" }));
  if (filter) {
    names = names.filter((name) => name.toLowerCase().includes(filter));
  }
  if (limit > 0) {
    names = names.slice(0, limit);
  }
  return names.map((name) => ({
    name,
    path: path.join(filesDir, name)
  }));
}

function profileFile(libraryName, item) {
  const content = fs.readFileSync(item.path, "utf8");
  const stat = fs.statSync(item.path);
  try {
    const parsed = parsePnhText(content);
    const nodes = Array.isArray(parsed.nodes) ? parsed.nodes : [];
    const arcs = Array.isArray(parsed.arcs) ? parsed.arcs : [];
    const places = nodes.filter((node) => node.type === "place");
    const transitions = nodes.filter((node) => node.type === "transition");
    const markedPlaces = places.filter((place) => Number(place.tokens || 0) > 0);
    const tokensTotal = places.reduce((sum, place) => sum + Math.max(0, Number(place.tokens || 0)), 0);
    const maxDirectedArcs = Math.max(1, places.length * transitions.length * 2);
    return {
      libraryName,
      fileName: item.name,
      sizeBytes: stat.size || Buffer.byteLength(content, "utf8"),
      format: String(parsed.format || ""),
      places: places.length,
      transitions: transitions.length,
      arcs: arcs.length,
      markedPlaces: markedPlaces.length,
      tokensTotal,
      arcDensity: arcs.length / maxDirectedArcs,
      warnings: Array.isArray(parsed.warnings) ? parsed.warnings.filter(Boolean).join(" | ") : "",
      error: ""
    };
  } catch (error) {
    return {
      libraryName,
      fileName: item.name,
      sizeBytes: stat.size || Buffer.byteLength(content, "utf8"),
      format: "",
      places: NaN,
      transitions: NaN,
      arcs: NaN,
      markedPlaces: NaN,
      tokensTotal: NaN,
      arcDensity: NaN,
      warnings: "",
      error: error instanceof Error ? error.message : tr("script.profile.parseError")
    };
  }
}

function summarize(records) {
  const ok = records.filter((record) => !record.error);
  const totals = ok.reduce((acc, record) => {
    acc.places += Number(record.places || 0);
    acc.transitions += Number(record.transitions || 0);
    acc.arcs += Number(record.arcs || 0);
    return acc;
  }, { places: 0, transitions: 0, arcs: 0 });
  return `profiled=${records.length} ok=${ok.length} errors=${records.length - ok.length} places=${totals.places} transitions=${totals.transitions} arcs=${totals.arcs}`;
}

function csvCell(value) {
  const safe = value === null || value === undefined ? "" : String(value);
  return `"${safe.replace(/"/g, "\"\"")}"`;
}

function formatNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toFixed(6) : "";
}

function formatInteger(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? String(Math.round(numeric)) : "";
}

function buildSampleCsv(selection) {
  const header = [
    "rank",
    "library",
    "file",
    "size_stratum",
    "selection_reason",
    "complexity",
    "places",
    "transitions",
    "arcs",
    "arc_density",
    "warnings",
    "error"
  ];
  const lines = [header.join(",")];
  (selection.selectedRows || []).forEach((row) => {
    lines.push([
      formatInteger(row.rank),
      row.libraryName,
      row.fileName,
      row.sizeStratum,
      row.selectionReason,
      formatInteger(row.complexity),
      formatInteger(row.places),
      formatInteger(row.transitions),
      formatInteger(row.arcs),
      formatNumber(row.arcDensity),
      row.warnings,
      row.error
    ].map(csvCell).join(","));
  });
  return lines.join("\n");
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const libraryName = readLibraryName(args.libraryId);
  const files = listPnhFiles(args.libraryId, args.filter, args.limit);
  const records = files.map((item) => profileFile(libraryName, item));
  const csv = buildBenchmarkProfileCsv(records);
  if (args.output) {
    const outPath = path.resolve(repoRoot, args.output);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, `${csv}\n`, "utf8");
    console.log(`${summarize(records)} output=${path.relative(repoRoot, outPath)}`);
  } else {
    process.stdout.write(`${csv}\n`);
    console.error(summarize(records));
  }

  if (args.sample > 0 || args.sampleOutput) {
    const selection = selectRepresentativeBenchmarkProfileRows(records, {
      targetSize: args.sample > 0 ? args.sample : 12,
      includeErrors: args.includeErrors
    });
    const sampleCsv = buildSampleCsv(selection);
    if (args.sampleOutput) {
      const samplePath = path.resolve(repoRoot, args.sampleOutput);
      fs.mkdirSync(path.dirname(samplePath), { recursive: true });
      fs.writeFileSync(samplePath, `${sampleCsv}\n`, "utf8");
      console.log(`sample=${selection.selectedRows.length}/${selection.parseableRows} skipped_errors=${selection.skippedErrorRows.length} sample_output=${path.relative(repoRoot, samplePath)}`);
    } else {
      console.error(`sample=${selection.selectedRows.length}/${selection.parseableRows} skipped_errors=${selection.skippedErrorRows.length}`);
      process.stderr.write(`${sampleCsv}\n`);
    }
  }
}

if (require.main === module) {
  main();
}
