(function(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory({
      en: require("../../locales/en.json"),
      pl: require("../../locales/pl.json")
    });
  } else {
    root.PoohI18n = factory(root.POOH_I18N_CATALOGS || {});
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function(initialCatalogs) {
  "use strict";

  const DEFAULT_LANGUAGE = "en";
  const SUPPORTED_LANGUAGES = Object.freeze(["en", "pl"]);
  let currentLanguage = DEFAULT_LANGUAGE;
  let catalogs = normalizeCatalogs(initialCatalogs);

  function normalizeLanguage(value) {
    const code = String(value || "")
      .trim()
      .toLowerCase()
      .split(/[-_]/)[0];
    return SUPPORTED_LANGUAGES.includes(code) ? code : DEFAULT_LANGUAGE;
  }

  function normalizeCatalogs(value) {
    const source = value && typeof value === "object" ? value : {};
    const normalized = {};
    SUPPORTED_LANGUAGES.forEach((language) => {
      const catalog = source[language];
      normalized[language] = catalog && typeof catalog === "object"
        ? Object.assign({}, catalog)
        : {};
    });
    return normalized;
  }

  function configure(options) {
    const opts = options && typeof options === "object" ? options : {};
    if (opts.catalogs && typeof opts.catalogs === "object") {
      catalogs = normalizeCatalogs(opts.catalogs);
    } else if (opts.catalog && typeof opts.catalog === "object") {
      const language = normalizeLanguage(opts.language || currentLanguage);
      catalogs[language] = Object.assign({}, opts.catalog);
    }
    if (opts.language !== undefined) {
      currentLanguage = normalizeLanguage(opts.language);
    }
    return api;
  }

  function setLanguage(value) {
    currentLanguage = normalizeLanguage(value);
    return currentLanguage;
  }

  function getLanguage() {
    return currentLanguage;
  }

  function getCatalog(language) {
    const code = normalizeLanguage(language || currentLanguage);
    return Object.assign({}, catalogs[code] || {});
  }

  function interpolate(template, params) {
    const values = params && typeof params === "object" ? params : {};
    return String(template).replace(/\{([A-Za-z0-9_]+)\}/g, (match, name) => (
      Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : match
    ));
  }

  function t(key, params, language) {
    const safeKey = String(key || "");
    const code = normalizeLanguage(language || currentLanguage);
    const selected = catalogs[code] || {};
    const fallback = catalogs[DEFAULT_LANGUAGE] || {};
    const secondary = catalogs.pl || {};
    let value;
    if (Object.prototype.hasOwnProperty.call(selected, safeKey)) {
      value = selected[safeKey];
    } else if (Object.prototype.hasOwnProperty.call(fallback, safeKey)) {
      value = fallback[safeKey];
    } else if (Object.prototype.hasOwnProperty.call(secondary, safeKey)) {
      value = secondary[safeKey];
    } else {
      value = safeKey;
    }
    return interpolate(value, params);
  }

  function createTranslator(language) {
    const code = normalizeLanguage(language);
    return (key, params) => t(key, params, code);
  }

  function exportWorkerConfig(language) {
    const code = normalizeLanguage(language || currentLanguage);
    return {
      language: code,
      catalogs: {
        en: getCatalog("en"),
        pl: getCatalog("pl")
      }
    };
  }

  const api = {
    DEFAULT_LANGUAGE,
    SUPPORTED_LANGUAGES,
    configure,
    normalizeLanguage,
    setLanguage,
    getLanguage,
    getCatalog,
    interpolate,
    t,
    createTranslator,
    exportWorkerConfig
  };

  return api;
});
