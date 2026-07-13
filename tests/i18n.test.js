const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const i18n = require("../src/core/i18n");
const workerI18n = require("../src/core/worker-i18n");
const { parseManualHypergraphText } = require("../src/core/hypergraph");
const { parsePnhText } = require("../src/core/pnh");
const en = require("../locales/en.json");
const pl = require("../locales/pl.json");

test("language catalogs expose the same keys", () => {
  assert.deepEqual(Object.keys(en).sort(), Object.keys(pl).sort());
});

test("language catalogs use matching interpolation parameters", () => {
  const placeholders = (value) => [...String(value).matchAll(/\{([A-Za-z0-9_]+)\}/g)]
    .map((match) => match[1])
    .sort();
  Object.keys(en).forEach((key) => {
    assert.deepEqual(placeholders(en[key]), placeholders(pl[key]), key);
  });
});

test("i18n defaults to English and interpolates named values", () => {
  i18n.configure({ catalogs: { en, pl }, language: "en" });
  assert.equal(i18n.normalizeLanguage("pl-PL"), "pl");
  assert.equal(i18n.normalizeLanguage("de-DE"), "en");
  assert.equal(i18n.t("api.uploadFailed", { code: 3 }), "File upload failed (code 3).");
});

test("i18n can export complete worker configuration", () => {
  const config = i18n.exportWorkerConfig("pl");
  assert.equal(config.language, "pl");
  assert.equal(config.catalogs.en["nav.sim"], "Analysis");
  assert.equal(config.catalogs.pl["nav.sim"], "Analiza");
});

test("workers and core modules follow the configured language", () => {
  workerI18n.configure({ i18n: i18n.exportWorkerConfig("pl") });
  assert.equal(workerI18n.t("core.hypergraph.edgeRequired"), "Wpisz co najmniej jedną hiperkrawędź.");
  assert.throws(() => parseManualHypergraphText(""), /Wpisz co najmniej jedną hiperkrawędź/);
  assert.throws(() => parsePnhText("[MARKING]\ninvalid"), /Nieprawidłowy wiersz/);

  workerI18n.configure({ i18n: i18n.exportWorkerConfig("en") });
  assert.equal(workerI18n.t("core.hypergraph.edgeRequired"), "Enter at least one hyperedge.");
});

test("production sources contain no embedded Polish messages", () => {
  const root = path.resolve(__dirname, "..");
  const files = ["index.php", "library_api.php", "export_pnh.php"];

  function collect(relativeDir) {
    const absoluteDir = path.join(root, relativeDir);
    fs.readdirSync(absoluteDir, { withFileTypes: true }).forEach((entry) => {
      const relative = path.join(relativeDir, entry.name);
      if (entry.isDirectory()) {
        collect(relative);
      } else if (/\.(?:js|php)$/.test(entry.name)) {
        files.push(relative);
      }
    });
  }

  ["public", "src", "scripts"].forEach(collect);
  const polishCharacters = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/;
  const legacyPhrases = /\b(?:Nie znaleziono|Brak danych|Wyznacz hipergraf|Zmien parametry|Proba \d|Wygenerowana siec|Tryb edycji|Dokumentacja systemu|Wycentruj widok|Eksport profilu|Profil zakresu)\b/i;
  files.forEach((relative) => {
    const source = fs.readFileSync(path.join(root, relative), "utf8");
    assert.doesNotMatch(source, polishCharacters, relative);
    assert.doesNotMatch(source, legacyPhrases, relative);
  });
});
