import { join } from "node:path";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { t } from "./i18n/index.ts";
import { getActiveLocale } from "./i18n/index.ts";
import { listExercises, exerciseDocPath, type Exercise } from "./exercises.ts";
import { readProgress } from "./config.ts";
import { openInEditor } from "./editor.ts";

/**
 * Shows an interactive exercise picker with progress checkmarks.
 * Returns the selected exercise or undefined if cancelled.
 */
export async function selectExercise(): Promise<Exercise | undefined> {
  const [exercises, progress] = await Promise.all([
    listExercises(),
    readProgress(),
  ]);

  if (exercises.length === 0) {
    console.log(pc.yellow(t("list.empty")));
    return undefined;
  }

  const byTrack = new Map<string, typeof exercises>();
  for (const ex of exercises) {
    if (!byTrack.has(ex.trackSlug)) byTrack.set(ex.trackSlug, []);
    byTrack.get(ex.trackSlug)!.push(ex);
  }

  const options: { value: Exercise; label: string; hint?: string }[] = [];
  for (const [track, items] of byTrack) {
    options.push({
      value: items[0]!,
      label: pc.bold(pc.cyan(`▸ ${track}`)),
      hint: `${items.filter((ex) => progress[ex.meta.id]).length}/${items.length}`,
    });

    for (const ex of items) {
      const done = progress[ex.meta.id];
      const mark = done ? pc.green("✓") : pc.dim("·");
      options.push({
        value: ex,
        label: `  ${mark} ${ex.meta.id.padEnd(20)} ${ex.meta.title}`,
        hint: `~${ex.meta.estimated_minutes} min`,
      });
    }
  }

  const selected = await p.select<Exercise>({
    message: t("open.select_prompt"),
    options,
  });

  if (p.isCancel(selected)) {
    p.cancel(t("init.cancelled"));
    return undefined;
  }

  return selected;
}

/**
 * Opens an exercise in the user's editor and prints action hints
 * (verify, run, run --stream-live).
 */
export async function openAndHint(exercise: Exercise, solution: boolean): Promise<void> {
  const locale = getActiveLocale();
  const docPath = exerciseDocPath(exercise, locale);
  const target = solution ? "solution.ts" : "starter.ts";
  const targetPath = join(exercise.dir, target);

  const editor = await openInEditor([targetPath, docPath]);
  const id = exercise.meta.id;

  console.log(t("open.opening", { editor, target }));
  console.log();
  console.log(pc.dim(t("open.hint_verify", { id })));
  console.log(pc.dim(t("open.hint_run", { id })));
  console.log(pc.dim(t("open.hint_stream", { id })));
  if (!solution) {
    console.log(pc.dim(t("open.hint_solution", { id })));
  }
}
