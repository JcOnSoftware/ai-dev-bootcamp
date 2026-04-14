import { Command } from "commander";
import pc from "picocolors";
import { t } from "../i18n/index.ts";
import { listExercises } from "../exercises.ts";
import { readProgress } from "../config.ts";

export const progressCommand = new Command("progress")
  .description("Show how many exercises you've completed, grouped by track.")
  .option("--locale <code>", "Locale override for this invocation (es|en)")
  .action(async () => {
    const [exercises, progress] = await Promise.all([listExercises(), readProgress()]);

    if (exercises.length === 0) {
      console.log(pc.yellow(t("list.empty")));
      return;
    }

    const byTrack = new Map<string, typeof exercises>();
    for (const ex of exercises) {
      if (!byTrack.has(ex.trackSlug)) byTrack.set(ex.trackSlug, []);
      byTrack.get(ex.trackSlug)!.push(ex);
    }

    let totalPassed = 0;
    for (const [track, items] of byTrack) {
      const passed = items.filter((ex) => progress[ex.meta.id]).length;
      totalPassed += passed;
      const pct = Math.round((passed / items.length) * 100);
      const bar = renderBar(passed, items.length);
      console.log();
      console.log(`${pc.bold(pc.cyan(track))}  ${bar}  ${passed}/${items.length}  ${pc.dim(`${pct}%`)}`);
      for (const ex of items) {
        const done = progress[ex.meta.id];
        const mark = done ? pc.green("✓") : pc.dim("·");
        const when = done ? pc.dim(` (${new Date(done.passedAt).toLocaleDateString()})`) : "";
        console.log(`  ${mark} ${ex.meta.id.padEnd(20)} ${ex.meta.title}${when}`);
      }
    }
    console.log();
    console.log(pc.dim(t("progress.total", { done: String(totalPassed), total: String(exercises.length) })));
  });

function renderBar(done: number, total: number, width = 16): string {
  const filled = Math.round((done / total) * width);
  return pc.green("█".repeat(filled)) + pc.dim("░".repeat(width - filled));
}
