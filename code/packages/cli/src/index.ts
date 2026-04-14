#!/usr/bin/env bun
import { Command } from "commander";
import { listCommand } from "./commands/list.ts";
import { verifyCommand } from "./commands/verify.ts";

const program = new Command();

program
  .name("aidev")
  .description("Interactive CLI to learn AI tools through progressive exercises.")
  .version("0.0.1");

program.addCommand(listCommand);
program.addCommand(verifyCommand);

program.parseAsync(process.argv).catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
