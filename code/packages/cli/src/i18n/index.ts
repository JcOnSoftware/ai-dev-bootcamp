import type { SupportedLocale } from "./types.ts";
import esDict from "./es.json" with { type: "json" };
import enDict from "./en.json" with { type: "json" };

export type { SupportedLocale };
export { SUPPORTED_LOCALES } from "./types.ts";

// Module-level singleton — set once per process via initI18n().
let activeLocale: SupportedLocale | null = null;
let activeDict: Record<string, string> | null = null;

const DICTS: Record<SupportedLocale, Record<string, string>> = {
  es: esDict as Record<string, string>,
  en: enDict as Record<string, string>,
};

/**
 * Must be called once at process startup (in commander's preAction hook) before
 * any `t()` calls. Calling it multiple times is allowed — the last call wins.
 */
export function initI18n(locale: SupportedLocale): void {
  activeLocale = locale;
  activeDict = DICTS[locale];
}

/**
 * Returns the translated string for `key` in the active locale.
 *
 * - Unknown key: returns the key literal unchanged (no crash).
 * - Missing variable in template: replaced with empty string when `vars` is provided.
 * - No `vars` argument at all: placeholders left intact (useful for debugging).
 * - Called before initI18n: throws a programmer-error immediately.
 */
export function t(key: string, vars?: Record<string, string>): string {
  if (activeDict === null) {
    throw new Error(
      "[i18n] t() called before initI18n(). Call initI18n(locale) in the preAction hook first.",
    );
  }

  const template = activeDict[key] ?? key;

  if (vars === undefined) {
    // No vars supplied — leave placeholders as-is so the caller can debug drift.
    return template;
  }

  // Single-pass replacement. Missing var key → empty string.
  return template.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? "");
}

/**
 * Returns the locale that was set via the last `initI18n()` call.
 * Throws if called before `initI18n()`.
 */
export function getActiveLocale(): SupportedLocale {
  if (activeLocale === null) {
    throw new Error(
      "[i18n] getActiveLocale() called before initI18n(). Call initI18n(locale) first.",
    );
  }
  return activeLocale;
}

/**
 * Testing-only escape hatch. Resets the singleton state so tests can exercise
 * the "before initI18n" path without module re-loading.
 * Do NOT call this in production code.
 */
export function _resetForTesting(): void {
  activeLocale = null;
  activeDict = null;
}
