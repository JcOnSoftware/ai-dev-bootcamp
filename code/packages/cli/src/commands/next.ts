import { join } from "node:path";
import { Command } from "commander";
import pc from "picocolors";
import { t } from "../i18n/index.ts";
import { getActiveLocale } from "../i18n/index.ts";
import { listExercises, exerciseDocPath } from "../exercises.ts";
import { readProgress } from "../config.ts";
import { openInEditor } from "../editor.ts";

export const nextCommand = new Command("next")
  .description("Open the next incomplete exercise in your editor.")
  .option("--locale <code>", "Locale override for this invocation (es|en)")
  .action(async () => {
    const [exercises, progress] = await Promise.all([
      listExercises(),
      readProgress(),
    ]);

    const next = exercises.find((ex) => !progress[ex.meta.id]);

    if (!next) {
      console.log(pc.green(t("next.all_done")));
      return;
    }

    // Count track progress
    const trackExercises = exercises.filter(
      (ex) => ex.trackSlug === next.trackSlug,
    );
    const trackDone = trackExercises.filter(
      (ex) => progress[ex.meta.id],
    ).length;

    console.log(
      pc.bold(t("next.found", { id: next.meta.id, title: next.meta.title })),
    );
    console.log(
      pc.dim(
        t("next.track_progress", {
          track: next.trackSlug,
          done: String(trackDone),
          total: String(trackExercises.length),
        }),
      ),
    );
    console.log();

    const locale = getActiveLocale();
    const docPath = exerciseDocPath(next, locale);
    const targetPath = join(next.dir, "starter.ts");

    const editor = await openInEditor([targetPath, docPath]);

    console.log(t("open.opening", { editor, target: "starter.ts" }));
    console.log(pc.dim(t("open.hint", { id: next.meta.id })));
  });
