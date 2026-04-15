import { existsSync } from "node:fs";
import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { SupportedLocale } from "./i18n/types.ts";
import { SUPPORTED_LOCALES } from "./i18n/types.ts";
import { t as _t } from "./i18n/index.ts";

/**
 * Defensive wrapper around `t()`. If `initI18n` has not been called yet (e.g.
 * in unit tests that exercise the `exercises.ts` module directly), falls back
 * to the raw `fallback` string instead of throwing a programmer-error.
 * In production code, `initI18n` is always called in the preAction hook before
 * any command action runs, so `_t` is always safe there.
 */
function safeT(key: string, vars?: Record<string, string>, fallback?: string): string {
  try {
    return _t(key, vars);
  } catch {
    // i18n not initialized — fall back to raw message.
    if (fallback !== undefined) return fallback;
    // Build a basic interpolation from vars for the raw fallback.
    if (!vars) return key;
    return key.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? "");
  }
}

export interface ExerciseMeta {
  id: string;
  track: string;
  title: string;
  version: string;
  valid_until: string;
  concepts: string[];
  estimated_minutes: number;
  requires: string[];
  model_cost_hint?: string;
  locales: SupportedLocale[];
}

export interface Exercise {
  meta: ExerciseMeta;
  dir: string;
  trackSlug: string;
  idSlug: string;
}

/**
 * Module-level Set for deduplicating discovery and runtime warnings.
 * Keyed as `${exerciseId}:${locale}`. Shared by listExercises() and exerciseDocPath().
 * Testing-only reset via _resetWarnedSet().
 */
let warnedMissingContent: Set<string> = new Set();

/**
 * Testing-only escape hatch — clears the dedup Set so tests can re-exercise
 * the warning path. Do NOT call in production code.
 */
export function _resetWarnedSet(): void {
  warnedMissingContent = new Set();
}

/** Locates the exercises root relative to this file. Works in dev and in an installed copy. */
export function exercisesRoot(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  return resolve(here, "..", "..", "exercises");
}

export async function listExercises(): Promise<Exercise[]> {
  const root = exercisesRoot();
  const trackDirs = await readdir(root, { withFileTypes: true });
  const exercises: Exercise[] = [];

  for (const trackEntry of trackDirs) {
    if (!trackEntry.isDirectory()) continue;
    const trackPath = join(root, trackEntry.name);
    const exerciseDirs = await readdir(trackPath, { withFileTypes: true });

    for (const exEntry of exerciseDirs) {
      if (!exEntry.isDirectory()) continue;
      const exDir = join(trackPath, exEntry.name);
      const metaPath = join(exDir, "meta.json");

      try {
        await stat(metaPath);
      } catch {
        continue;
      }

      const raw = await readFile(metaPath, "utf-8");
      const meta = JSON.parse(raw) as Partial<ExerciseMeta> & Record<string, unknown>;

      // Contract validation: locales field is required.
      if (!Array.isArray(meta["locales"]) || (meta["locales"] as unknown[]).length === 0) {
        process.stderr.write(
          `Exercise ${exEntry.name}: meta.json missing required "locales" field — excluded from results.\n`,
        );
        continue;
      }

      // Validate each declared locale is supported.
      const validLocales: SupportedLocale[] = [];
      let hasInvalidLocale = false;
      for (const loc of meta["locales"] as unknown[]) {
        if (
          typeof loc === "string" &&
          (SUPPORTED_LOCALES as readonly string[]).includes(loc)
        ) {
          validLocales.push(loc as SupportedLocale);
        } else {
          process.stderr.write(
            `Exercise ${exEntry.name}: unsupported locale "${String(loc)}" in meta.json — excluded from results.\n`,
          );
          hasInvalidLocale = true;
          break;
        }
      }
      if (hasInvalidLocale) continue;

      // Warn once per (id, locale) pair if the declared locale's file is missing.
      // Keep the exercise in results (partial availability — spec §localized-exercise-content).
      for (const locale of validLocales) {
        const candidate = join(exDir, locale, "exercise.md");
        if (!existsSync(candidate)) {
          const warnKey = `${exEntry.name}:${locale}`;
          if (!warnedMissingContent.has(warnKey)) {
            warnedMissingContent.add(warnKey);
            process.stderr.write(
              `Exercise ${exEntry.name}: declared locale "${locale}" but ${locale}/exercise.md is missing.\n`,
            );
          }
        }
      }

      exercises.push({
        meta: meta as ExerciseMeta,
        dir: exDir,
        trackSlug: trackEntry.name,
        idSlug: exEntry.name,
      });
    }
  }

  exercises.sort((a, b) => {
    if (a.trackSlug !== b.trackSlug) return a.trackSlug.localeCompare(b.trackSlug);
    return a.idSlug.localeCompare(b.idSlug);
  });
  return exercises;
}

export async function findExercise(id: string): Promise<Exercise | undefined> {
  const all = await listExercises();
  return all.find((e) => e.meta.id === id || e.idSlug === id);
}

export function isStale(meta: ExerciseMeta, now: Date = new Date()): boolean {
  const validUntil = new Date(meta.valid_until);
  if (Number.isNaN(validUntil.getTime())) return false;
  // A date-only string (YYYY-MM-DD) parses to midnight UTC. Treat valid_until
  // as the full day: the exercise is still valid through end-of-day UTC.
  const endOfDay = validUntil.getTime() + 24 * 60 * 60 * 1000 - 1;
  return now.getTime() > endOfDay;
}

/**
 * Resolves the path to `exercise.md` for the given locale.
 *
 * 1. If `<exercise-dir>/<locale>/exercise.md` exists → return it.
 * 2. If not, and locale !== "es" → fallback to `es/exercise.md` with a
 *    stderr warning (deduped by the module-level Set).
 * 3. If `es/exercise.md` also doesn't exist → throw (critically malformed).
 */
export function exerciseDocPath(exercise: Exercise, locale: SupportedLocale): string {
  const candidate = join(exercise.dir, locale, "exercise.md");
  if (existsSync(candidate)) {
    return candidate;
  }

  if (locale !== "es") {
    // Warn once per (id, locale) — reuse the discovery Set.
    const warnKey = `${exercise.meta.id}:${locale}`;
    if (!warnedMissingContent.has(warnKey)) {
      warnedMissingContent.add(warnKey);
      process.stderr.write(
        safeT(
          "errors.locale_fallback",
          { id: exercise.meta.id, requested: locale },
          `Exercise ${exercise.meta.id}: no "${locale}" content; showing "es".`,
        ) + "\n",
      );
    }
    const fallback = join(exercise.dir, "es", "exercise.md");
    if (existsSync(fallback)) {
      return fallback;
    }
    throw new Error(
      `Exercise ${exercise.meta.id}: es/exercise.md is missing (critically malformed exercise).`,
    );
  }

  // locale === "es" and candidate didn't exist
  throw new Error(
    `Exercise ${exercise.meta.id}: es/exercise.md is missing (critically malformed exercise).`,
  );
}
