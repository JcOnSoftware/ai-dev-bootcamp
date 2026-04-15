import { join } from "node:path";
import { Command } from "commander";
import pc from "picocolors";
import { runUserCode, type MessageStreamEvent } from "@aidev/runner";
import { t } from "../i18n/index.ts";
import { findExercise, isStale } from "../exercises.ts";
import { resolveApiKey } from "../config.ts";
import { renderSummary } from "../render.ts";

export const runCommand = new Command("run")
  .description("Execute an exercise against the real API and print model output.")
  .argument("<id>", "Exercise id (e.g. 02-params)")
  .option("--solution", "Run solution.ts instead of starter.ts")
  .option("--stream-live", "Print streaming deltas in real time")
  .option("--full", "Disable output truncation")
  .option("--locale <code>", "Locale override for this invocation (es|en)")
  .action(
    async (
      id: string,
      opts: { solution?: boolean; streamLive?: boolean; full?: boolean },
    ) => {
      const exercise = await findExercise(id);
      if (!exercise) {
        console.error(pc.red(t("run.not_found", { id })));
        process.exit(1);
      }

      if (isStale(exercise.meta)) {
        console.warn(
          pc.yellow(
            t("common.stale_warning", { valid_until: exercise.meta.valid_until }),
          ),
        );
      }

      const apiKey = await resolveApiKey();
      if (!apiKey) {
        console.error(
          pc.red(t("run.no_key")) + pc.dim(`\n${t("run.no_key_hint")}`),
        );
        process.exit(1);
      }

      process.env["ANTHROPIC_API_KEY"] = apiKey;
      const target = opts.solution ? "solution" : "starter";
      process.env["AIDEV_TARGET"] = target;
      const filePath = join(exercise.dir, `${target}.ts`);

      console.log(pc.dim(t("run.running", { id: exercise.meta.id, target })));

      const onStreamEvent = opts.streamLive
        ? (e: MessageStreamEvent) => {
            if (
              e.type === "content_block_delta" &&
              e.delta.type === "text_delta"
            ) {
              process.stdout.write(e.delta.text);
            }
          }
        : undefined;

      try {
        const result = await runUserCode(filePath, { onStreamEvent });
        if (opts.streamLive) process.stdout.write("\n");
        console.log(
          renderSummary(result, exercise, {
            full: Boolean(opts.full),
            target,
          }),
        );
        process.exit(0);
      } catch (err) {
        console.error(
          pc.red(t("run.error.message", { message: (err as Error).message })),
        );
        console.error(pc.dim((err as Error).stack ?? ""));
        process.exit(1);
      }
    },
  );
