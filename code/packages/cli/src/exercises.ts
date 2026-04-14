import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

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
}

export interface Exercise {
  meta: ExerciseMeta;
  dir: string;
  trackSlug: string;
  idSlug: string;
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
      const meta = JSON.parse(raw) as ExerciseMeta;
      exercises.push({
        meta,
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
  return now > validUntil;
}
