(function(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("./i18n"));
  } else {
    root.PoohWorkerI18n = factory(root.PoohI18n);
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function(i18n) {
  "use strict";

  function configure(message) {
    const data = message && typeof message === "object" ? message : {};
    if (i18n && typeof i18n.configure === "function" && data.i18n) {
      i18n.configure(data.i18n);
    }
    return api;
  }

  function t(key, params) {
    return i18n && typeof i18n.t === "function"
      ? i18n.t(key, params)
      : String(key || "");
  }

  const api = { configure, t };
  return api;
});
