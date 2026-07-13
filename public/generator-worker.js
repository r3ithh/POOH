"use strict";

let generatorCore = null;

try {
  if (typeof importScripts === "function") {
    importScripts(
      "../src/core/i18n.js",
      "../src/core/worker-i18n.js",
      "../src/core/petri-analysis.js",
      "../src/core/xtrec.js",
      "../src/core/generator.js"
    );
  }
  if (typeof self !== "undefined" && self.PoohGeneratorCore) {
    generatorCore = self.PoohGeneratorCore;
  }
} catch (error) {
  generatorCore = null;
}

function workerT(key, params) {
  return self.PoohWorkerI18n && typeof self.PoohWorkerI18n.t === "function"
    ? self.PoohWorkerI18n.t(key, params)
    : String(key || "");
}

function requireGeneratorCore() {
  if (generatorCore
      && typeof generatorCore.sanitizeParams === "function"
      && typeof generatorCore.generateRandomNetWithConstraints === "function"
      && typeof generatorCore.runTimeLimitedSearch === "function") {
    return generatorCore;
  }
  throw new Error(workerT("worker.generator.coreMissing"));
}

function postWorkerError(jobId, fallbackMessage, error) {
  const message = error instanceof Error ? error.message : fallbackMessage;
  postMessage({
    type: "error",
    jobId,
    message
  });
}

self.onmessage = async (event) => {
  const payload = event.data || {};
  if (self.PoohWorkerI18n) {
    self.PoohWorkerI18n.configure(payload);
  }
  const jobId = payload.jobId;

  try {
    const core = requireGeneratorCore();
    core.setProgressSink((message) => postMessage(message));

    if (payload.type === "generate") {
      const params = core.sanitizeParams(payload.params || {});
      params.layoutMode = String((payload.params && payload.params.layoutMode) || "smart");
      const result = await core.generateRandomNetWithConstraints(params, jobId);
      postMessage({
        type: "result",
        jobId,
        payload: result
      });
      return;
    }

    if (payload.type === "search") {
      const result = core.runTimeLimitedSearch(payload.params || {}, jobId);
      postMessage({
        type: "result",
        jobId,
        payload: result
      });
    }
  } catch (error) {
    const fallback = payload.type === "search"
      ? workerT("worker.generator.searchUnknown")
      : workerT("worker.generator.unknown");
    postWorkerError(jobId, fallback, error);
  } finally {
    if (generatorCore && typeof generatorCore.clearProgressSink === "function") {
      generatorCore.clearProgressSink();
    }
  }
};
