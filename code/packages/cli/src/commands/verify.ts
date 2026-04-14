import { spawn } from "node:child_process";
import { join } from "node:path";
import { Command } from "commander";
import pc from "picocolors";
import { findExercise } from "../exercises.ts";
import { recordPass, resolveApiKey } from "../config.ts";

export const verifyCommand = new Command("verify")
  .description("Run the tests for a given exercise.")
  .argument("<id>", "Exercise id (e.g. 01-first-call)")
  .option("--solution", "Run tests against solution.ts instead of starter.ts")
  .action(async (id: string, opts: { solution?: boolean }) => {
    const exercise = await findExercise(id);
    if (!exercise) {
      console.error(pc.red(`Exercise '${id}' not found. Try: aidev list`));
      process.exit(1);
    }

    const apiKey = await resolveApiKey();
    if (!apiKey) {
      console.error(
        pc.red("No Anthropic API key found.") +
          pc.dim("\n  Run 'aidev init' to configure, or export ANTHROPIC_API_KEY."),
      );
      process.exit(1);
    }

    const testFile = join(exercise.dir, "tests.test.ts");
    const target = opts.solution ? "solution" : "starter";
    console.log(pc.dim(`→ ${exercise.meta.id} against ${target}.ts`));

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
        console.log(pc.green(`\n✓ Progress saved for ${exercise.meta.id}.`));
      }
      process.exit(code ?? 1);
    });
  });
