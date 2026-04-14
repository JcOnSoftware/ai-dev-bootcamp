import { spawn } from "node:child_process";
import { join } from "node:path";
import { Command } from "commander";
import pc from "picocolors";
import { findExercise } from "../exercises.ts";

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

    if (!process.env["ANTHROPIC_API_KEY"]) {
      console.error(
        pc.red("ANTHROPIC_API_KEY not set.") +
          pc.dim(" Add it to code/.env or export it in your shell."),
      );
      process.exit(1);
    }

    const testFile = join(exercise.dir, "tests.test.ts");
    const target = opts.solution ? "solution" : "starter";
    console.log(
      pc.dim(`→ ${exercise.meta.id} against ${target}.ts`),
    );

    const child = spawn("bun", ["test", testFile], {
      stdio: "inherit",
      env: { ...process.env, AIDEV_TARGET: target },
    });

    child.on("exit", (code) => {
      process.exit(code ?? 1);
    });
  });
