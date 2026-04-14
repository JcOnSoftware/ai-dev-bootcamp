import { Command } from "commander";
import pc from "picocolors";
import { isStale, listExercises } from "../exercises.ts";

export const listCommand = new Command("list")
  .alias("ls")
  .description("List all available exercises, grouped by track.")
  .action(async () => {
    const exercises = await listExercises();
    if (exercises.length === 0) {
      console.log(pc.yellow("No exercises found."));
      return;
    }

    const byTrack = new Map<string, typeof exercises>();
    for (const ex of exercises) {
      const key = ex.trackSlug;
      if (!byTrack.has(key)) byTrack.set(key, []);
      byTrack.get(key)!.push(ex);
    }

    for (const [track, items] of byTrack) {
      console.log();
      console.log(pc.bold(pc.cyan(`▸ ${track}`)));
      for (const ex of items) {
        const stale = isStale(ex.meta) ? pc.yellow(" ⚠ stale") : "";
        console.log(
          `  ${pc.dim(ex.meta.id.padEnd(20))}  ${ex.meta.title}${stale}`,
        );
        console.log(
          pc.dim(
            `                        ~${ex.meta.estimated_minutes} min · ${ex.meta.concepts.join(", ")}`,
          ),
        );
      }
    }
    console.log();
    console.log(pc.dim(`Run an exercise's tests: aidev verify <id>`));
  });
