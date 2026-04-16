import { Command } from "commander";
import pc from "picocolors";
import { t } from "../i18n/index.ts";
import { findExercise } from "../exercises.ts";
import { selectExercise, openAndHint } from "../pick.ts";

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
      await openAndHint(exercise, !!opts.solution);
    } else {
      const exercise = await selectExercise();
      if (exercise) {
        await openAndHint(exercise, !!opts.solution);
      }
    }
  });
