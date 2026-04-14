import { spawn } from "node:child_process";
import { join } from "node:path";
import { Command } from "commander";
import pc from "picocolors";
import { t, getActiveLocale } from "../i18n/index.ts";
import { findExercise, exerciseDocPath } from "../exercises.ts";
import { recordPass, resolveApiKey } from "../config.ts";

export const verifyCommand = new Command("verify")
  .description("Run the tests for a given exercise.")
  .argument("<id>", "Exercise id (e.g. 01-first-call)")
  .option("--solution", "Run tests against solution.ts instead of starter.ts")
  .option("--locale <code>", "Locale override for this invocation (es|en)")
  .action(async (id: string, opts: { solution?: boolean }) => {
    const exercise = await findExercise(id);
    if (!exercise) {
      console.error(pc.red(t("verify.not_found", { id })));
      process.exit(1);
    }

    // Print the active-locale exercise.md path before anything else.
    // exerciseDocPath handles fallback + warning if locale content is missing.
    const locale = getActiveLocale();
    const docPath = exerciseDocPath(exercise, locale);
    console.log(pc.dim(t("verify.exercise_doc", { path: docPath })));

    const apiKey = await resolveApiKey();
    if (!apiKey) {
      console.error(
        pc.red(t("verify.no_key")) +
          pc.dim(`\n${t("verify.no_key_hint")}`),
      );
      process.exit(1);
    }

    const testFile = join(exercise.dir, "tests.test.ts");
    const target = opts.solution ? "solution" : "starter";
    console.log(pc.dim(t("verify.running", { id: exercise.meta.id, target })));

    const child = spawn("bun", ["test", testFile], {
      stdio: "inherit",
      env: {
        ...process.env,
        ANTHROPIC_API_KEY: apiKey,
        AIDEV_TARGET: target,
      },
    });

    child.on("exit", async (code) => {
      if (code === 0 && target === "starter") {
        await recordPass(exercise.meta.id, target);
        console.log(pc.green(`\n${t("verify.progress_saved", { id: exercise.meta.id })}`));
      }
      process.exit(code ?? 1);
    });
  });
