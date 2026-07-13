"use strict";

let sfcCore = null;

try {
  if (typeof importScripts === "function") {
    importScripts(
      "../src/core/i18n.js",
      "../src/core/worker-i18n.js",
      "../src/core/sfc.js"
    );
  }
  if (typeof self !== "undefined" && self.PoohSfcCore) {
    sfcCore = self.PoohSfcCore;
  }
} catch (error) {
  sfcCore = null;
}

function workerT(key, params) {
  return self.PoohWorkerI18n && typeof self.PoohWorkerI18n.t === "function"
    ? self.PoohWorkerI18n.t(key, params)
    : String(key || "");
}

function asInt(value, fallback) {
  const parsed = parseInt(String(value), 10);
  if (Number.isFinite(parsed)) {
    return parsed;
  }
  return Number.isFinite(fallback) ? fallback : 0;
}

function requireSfcCore() {
  if (sfcCore && typeof sfcCore.runSfcComputation === "function") {
    return sfcCore;
  }
  throw new Error(workerT("worker.sfc.coreMissing"));
}

self.onmessage = (event) => {
  const data = event.data || {};
  if (self.PoohWorkerI18n) {
    self.PoohWorkerI18n.configure(data);
  }
  if (data.type !== "compute") {
    return;
  }

  const jobId = asInt(data.jobId, 0);
  const payload = data.payload || {};

  try {
    const core = requireSfcCore();
    core.setProgressSink((message) => postMessage(message));
    const result = core.runSfcComputation(jobId, payload);
    postMessage({
      type: "result",
      jobId,
      payload: result
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : workerT("worker.sfc.unknown");
    postMessage({
      type: "error",
      jobId,
      message
    });
  } finally {
    if (sfcCore && typeof sfcCore.clearProgressSink === "function") {
      sfcCore.clearProgressSink();
    }
  }
};
