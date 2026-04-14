import { Command } from "commander";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { paths, readConfig, writeConfig } from "../config.ts";

export const initCommand = new Command("init")
  .description("Configure aidev (API key, preferences).")
  .action(async () => {
    p.intro(pc.bgCyan(pc.black(" ai-dev-bootcamp · init ")));

    const existing = await readConfig();
    if (existing.anthropicApiKey) {
      const overwrite = await p.confirm({
        message: "An Anthropic API key is already stored. Overwrite it?",
        initialValue: false,
      });
      if (p.isCancel(overwrite) || !overwrite) {
        p.cancel("Keeping existing config.");
        return;
      }
    }

    const key = await p.password({
      message: "Paste your Anthropic API key (starts with sk-ant-)",
      validate(value) {
        if (!value) return "An API key is required.";
        if (!value.startsWith("sk-ant-")) {
          return "That doesn't look like an Anthropic key (expected sk-ant-...).";
        }
      },
    });

    if (p.isCancel(key)) {
      p.cancel("Aborted.");
      return;
    }

    await writeConfig({ ...existing, anthropicApiKey: key });
    p.outro(
      `${pc.green("✓")} Saved to ${pc.dim(paths.configFile)}\n  Next: ${pc.cyan("aidev list")}`,
    );
  });
