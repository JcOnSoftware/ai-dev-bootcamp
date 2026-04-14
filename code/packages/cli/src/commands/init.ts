import { Command } from "commander";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { t } from "../i18n/index.ts";
import { paths, readConfig, writeConfig } from "../config.ts";
import type { SupportedLocale } from "../i18n/types.ts";

export const initCommand = new Command("init")
  .description("Configure aidev (API key, preferences).")
  .option("--locale <code>", "Locale override for this invocation (es|en)")
  .action(async () => {
    p.intro(pc.bgCyan(pc.black(t("init.intro"))));

    const existing = await readConfig();

    // --- API key ---
    if (existing.anthropicApiKey) {
      const overwrite = await p.confirm({
        message: t("init.key_exists"),
        initialValue: false,
      });
      if (p.isCancel(overwrite) || !overwrite) {
        p.cancel(t("init.cancelled"));
        return;
      }
    }

    const key = await p.password({
      message: t("init.key_prompt"),
      validate(value) {
        if (!value) return "An API key is required.";
        if (!value.startsWith("sk-ant-")) {
          return "That doesn't look like an Anthropic key (expected sk-ant-...).";
        }
      },
    });

    if (p.isCancel(key)) {
      p.cancel(t("init.cancelled"));
      return;
    }

    // --- Locale ---
    let newLocale: SupportedLocale = existing.locale ?? "es";

    if (existing.locale) {
      const overwriteLocale = await p.confirm({
        message: t("init.locale_exists", { locale: existing.locale }),
        initialValue: false,
      });
      if (p.isCancel(overwriteLocale)) {
        p.cancel(t("init.cancelled"));
        return;
      }
      if (overwriteLocale) {
        const selected = await p.select<SupportedLocale>({
          message: t("init.locale_prompt"),
          options: [
            { value: "es" as SupportedLocale, label: "Español" },
            { value: "en" as SupportedLocale, label: "English" },
          ],
        });
        if (p.isCancel(selected)) {
          p.cancel(t("init.cancelled"));
          return;
        }
        newLocale = selected;
      }
    } else {
      const selected = await p.select<SupportedLocale>({
        message: t("init.locale_prompt"),
        options: [
          { value: "es" as SupportedLocale, label: "Español" },
          { value: "en" as SupportedLocale, label: "English" },
        ],
      });
      if (p.isCancel(selected)) {
        p.cancel(t("init.cancelled"));
        return;
      }
      newLocale = selected;
    }

    await writeConfig({ ...existing, anthropicApiKey: key, locale: newLocale });
    p.outro(
      `${pc.green("✓")} ${t("init.saved", { path: pc.dim(paths.configFile), nextCmd: pc.cyan("aidev list") })}`,
    );
  });
