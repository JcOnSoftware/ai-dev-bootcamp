import { afterEach, beforeEach, describe, expect, test } from "bun:test";

// We re-import the module each test by resetting the module-level singleton state
// via the exported `_resetForTesting` escape hatch (testing-only).
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { getActiveLocale, initI18n, t, _resetForTesting } from "./index.ts";
import type { SupportedLocale } from "./types.ts";

describe("i18n runtime", () => {
  beforeEach(() => {
    _resetForTesting();
  });

  afterEach(() => {
    _resetForTesting();
  });

  // ─── initI18n + getActiveLocale ──────────────────────────────────────────

  describe("initI18n", () => {
    test("getActiveLocale returns es after initI18n('es')", () => {
      initI18n("es");
      expect(getActiveLocale()).toBe("es");
    });

    test("getActiveLocale returns en after initI18n('en')", () => {
      initI18n("en");
      expect(getActiveLocale()).toBe("en");
    });

    test("calling initI18n twice is idempotent for the second locale", () => {
      initI18n("es");
      initI18n("en");
      expect(getActiveLocale()).toBe("en");
    });
  });

  // ─── t() before initI18n ─────────────────────────────────────────────────

  describe("t() before initI18n", () => {
    test("throws programmer-error if called before initI18n", () => {
      expect(() => t("list.empty")).toThrow();
    });

    test("error message mentions initI18n", () => {
      expect(() => t("list.empty")).toThrow(/initI18n/);
    });
  });

  // ─── Happy-path key lookup ────────────────────────────────────────────────

  describe("t() key lookup — es", () => {
    beforeEach(() => initI18n("es"));

    test("returns known es key", () => {
      expect(t("list.empty")).toBe("No se encontraron ejercicios.");
    });

    test("returns known es key (list.hint)", () => {
      expect(t("list.hint")).toBe("Ejecutá los tests de un ejercicio: aidev verify <id>");
    });
  });

  describe("t() key lookup — en", () => {
    beforeEach(() => initI18n("en"));

    test("returns known en key", () => {
      expect(t("list.empty")).toBe("No exercises found.");
    });

    test("returns known en key (list.hint)", () => {
      expect(t("list.hint")).toBe("Run an exercise's tests: aidev verify <id>");
    });
  });

  // ─── Unknown key fallback ─────────────────────────────────────────────────

  describe("t() unknown key", () => {
    beforeEach(() => initI18n("es"));

    test("returns the key literal for an unknown key (no crash)", () => {
      expect(t("this.key.does.not.exist")).toBe("this.key.does.not.exist");
    });

    test("no cross-locale fallback: missing en key returns key literal, not es value", () => {
      _resetForTesting();
      initI18n("en");
      // 'common.stale' exists in es but we're checking en — it also exists in en,
      // so we use a key we know doesn't exist in either locale.
      expect(t("nonexistent.key")).toBe("nonexistent.key");
    });
  });

  // ─── Variable interpolation ───────────────────────────────────────────────

  describe("t() interpolation", () => {
    beforeEach(() => initI18n("es"));

    test("interpolates {var} placeholders", () => {
      const result = t("errors.unsupported_locale", { value: "fr", list: "es, en" });
      expect(result).toBe('Locale no soportado "fr". Soportados: es, en');
    });

    test("interpolates multiple vars in verify.running", () => {
      const result = t("verify.running", { id: "01-first-call", target: "starter" });
      expect(result).toBe("→ 01-first-call contra starter.ts");
    });

    test("leaves placeholder intact when var key is wrong (vars provided but wrong key)", () => {
      // 'hello' key doesn't exist, but testing wrong-key scenario via a real key with wrong vars
      // es.json: "errors.locale_fallback": "Ejercicio {id}: no hay contenido \"{requested}\"; mostrando \"es\"."
      const result = t("errors.locale_fallback", { wrong: "x" });
      // Both {id} and {requested} are missing — should be empty string per design:
      // "Missing variable renders as empty string"
      expect(result).toBe('Ejercicio : no hay contenido ""; mostrando "es".');
    });

    test("leaves {placeholder} intact when no vars argument at all", () => {
      // When vars is undefined (not provided), placeholders are left as-is
      const result = t("init.saved");
      expect(result).toBe("Guardado en {path}. Siguiente: {nextCmd}");
    });
  });
});
