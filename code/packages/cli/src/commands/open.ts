import { join } from "node:path";
import { Command } from "commander";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { t } from "../i18n/index.ts";
import { getActiveLocale } from "../i18n/index.ts";
import {
  findExercise,
  listExercises,
  exerciseDocPath,
  type Exercise,
} from "../exercises.ts";
import { readProgress } from "../config.ts";
import { openInEditor } from "../editor.ts";

async function openExercise(exercise: Exercise, solution: boolean): Promise<void> {
  const locale = getActiveLocale();
  const docPath = exerciseDocPath(exercise, locale);
  const target = solution ? "solution.ts" : "starter.ts";
  const targetPath = join(exercise.dir, target);

  const editor = await openInEditor([targetPath, docPath]);

  console.log(t("open.opening", { editor, target }));
  console.log(pc.dim(t("open.hint", { id: exercise.meta.id })));
}

async function selectExercise(): Promise<Exercise | undefined> {
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
    // Group separator — uses the track name as a non-selectable hint via a separator
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

export const openCommand = new Command("open")
  .description("Open an exercise in your editor (starter.ts + exercise.md).")
  .argument("[id]", "Exercise ID (e.g. 01-first-call). Omit to pick from list.")
  .option("--solution", "Open solution.ts instead of starter.ts")
  .option("--locale <code>", "Locale override for this invocation (es|en)")
  .action(async (id: string | undefined, opts: { solution?: boolean }) => {
    if (id) {
      const exercise = await findExercise(id);
      if (!exercise) {
        console.error(pc.red(t("open.not_found", { id })));
        process.exit(1);
      }
      await openExercise(exercise, !!opts.solution);
    } else {
      const exercise = await selectExercise();
      if (exercise) {
        await openExercise(exercise, !!opts.solution);
      }
    }
  });
