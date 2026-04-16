#!/usr/bin/env bun
import { Command } from "commander";
import { resolveLocale } from "./config.ts";
import { initI18n } from "./i18n/index.ts";
import { initCommand } from "./commands/init.ts";
import { listCommand } from "./commands/list.ts";
import { progressCommand } from "./commands/progress.ts";
import { verifyCommand } from "./commands/verify.ts";
import { runCommand } from "./commands/run.ts";
import { openCommand } from "./commands/open.ts";
import { nextCommand } from "./commands/next.ts";

const program = new Command();

program
  .name("aidev")
  .description("Interactive CLI to learn AI tools through progressive exercises.")
  .version("0.0.1")
  .option("--locale <code>", "Locale override for this invocation (es|en)");

// Resolve locale and initialize i18n BEFORE any command action runs.
// Commander does NOT call preAction for --help / --version built-ins.
program.hook("preAction", async (thisCommand, actionCommand) => {
  // Per-command --locale flag takes priority over root-level --locale.
  const flag =
    (actionCommand.opts() as Record<string, string | undefined>)["locale"] ??
    (thisCommand.opts() as Record<string, string | undefined>)["locale"];
  const locale = await resolveLocale(flag);
  initI18n(locale);
});

program.addCommand(initCommand);
program.addCommand(listCommand);
program.addCommand(verifyCommand);
program.addCommand(progressCommand);
program.addCommand(runCommand);
program.addCommand(openCommand);
program.addCommand(nextCommand);

program.parseAsync(process.argv).catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
