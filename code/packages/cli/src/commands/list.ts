import { Command } from "commander";
import pc from "picocolors";
import { t } from "../i18n/index.ts";
import { isStale, listExercises } from "../exercises.ts";
import { readProgress } from "../config.ts";
import { selectExercise, openAndHint } from "../pick.ts";

export const listCommand = new Command("list")
  .alias("ls")
  .description("List all available exercises, grouped by track.")
  .option("--locale <code>", "Locale override for this invocation (es|en)")
  .action(async () => {
    const [exercises, progress] = await Promise.all([
      listExercises(),
      readProgress(),
    ]);

    if (exercises.length === 0) {
      console.log(pc.yellow(t("list.empty")));
      return;
    }

    const byTrack = new Map<string, typeof exercises>();
    for (const ex of exercises) {
      const key = ex.trackSlug;
      if (!byTrack.has(key)) byTrack.set(key, []);
      byTrack.get(key)!.push(ex);
    }

    for (const [track, items] of byTrack) {
      const done = items.filter((ex) => progress[ex.meta.id]).length;
      console.log();
      console.log(
        `${pc.bold(pc.cyan(`▸ ${track}`))}  ${pc.dim(`${done}/${items.length}`)}`,
      );
      for (const ex of items) {
        const passed = progress[ex.meta.id];
        const mark = passed ? pc.green("✓") : pc.dim("·");
        const stale = isStale(ex.meta) ? pc.yellow(t("common.stale")) : "";
        console.log(
          `  ${mark} ${pc.dim(ex.meta.id.padEnd(20))}  ${ex.meta.title}${stale}`,
        );
        console.log(
          pc.dim(
            `                        ~${ex.meta.estimated_minutes} min · ${ex.meta.concepts.join(", ")}`,
          ),
        );
      }
    }
    console.log();

    // Interactive picker — only in a TTY (skip in CI / piped output)
    if (process.stdout.isTTY) {
      const selected = await selectExercise();
      if (selected) {
        await openAndHint(selected, false);
      }
    } else {
      console.log(pc.dim(t("list.hint")));
    }
  });
