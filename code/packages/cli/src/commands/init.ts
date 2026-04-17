import { execSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { t, initI18n } from "../i18n/index.ts";
import { paths, readConfig, writeConfig, resetProgress } from "../config.ts";
import type { SupportedLocale } from "../i18n/types.ts";
import type { SupportedProvider } from "../provider/types.ts";
import { PROVIDER_ENV_VAR } from "../provider/types.ts";

/** Resolves the git repo root (two levels above code/packages/cli/src/). */
function repoRoot(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  return resolve(here, "..", "..", "..", "..");
}

function printWelcomeBanner(): void {
  console.log();
  console.log(pc.bold(pc.cyan("  ╔══════════════════════════════════╗")));
  console.log(pc.bold(pc.cyan("  ║   AI Dev Bootcamp               ║")));
  console.log(pc.bold(pc.cyan(`  ║   ${pc.dim(t("init.welcome_subtitle"))}       ║`)));
  console.log(pc.bold(pc.cyan("  ╚══════════════════════════════════╝")));
  console.log();
  console.log(`  ${pc.dim(t("init.stats"))}`);
  console.log();
}

async function runConfigure(): Promise<void> {
  const existing = await readConfig();

  // --- Provider ---
  let newProvider: SupportedProvider = existing.provider ?? "anthropic";

  if (existing.provider) {
    const overwriteProvider = await p.confirm({
      message: t("init.provider_exists", { provider: existing.provider }),
      initialValue: false,
    });
    if (p.isCancel(overwriteProvider)) {
      p.cancel(t("init.cancelled"));
      return;
    }
    if (overwriteProvider) {
      const selected = await p.select<SupportedProvider>({
        message: t("init.provider_prompt"),
        options: [
          { value: "anthropic" as SupportedProvider, label: "Anthropic (Claude)" },
          { value: "openai" as SupportedProvider, label: "OpenAI (GPT)" },
          { value: "gemini" as SupportedProvider, label: "Google (Gemini)" },
        ],
      });
      if (p.isCancel(selected)) {
        p.cancel(t("init.cancelled"));
        return;
      }
      newProvider = selected;
    }
  } else {
    const selected = await p.select<SupportedProvider>({
      message: t("init.provider_prompt"),
      options: [
        { value: "anthropic" as SupportedProvider, label: "Anthropic (Claude)" },
        { value: "openai" as SupportedProvider, label: "OpenAI (GPT)" },
        { value: "gemini" as SupportedProvider, label: "Google (Gemini)" },
      ],
    });
    if (p.isCancel(selected)) {
      p.cancel(t("init.cancelled"));
      return;
    }
    newProvider = selected;
  }

  // --- API key (provider-aware validation) ---
  // If the provider's key is already in process.env (from shell export or
  // code/.env loaded at CLI startup), skip the prompt entirely. The env path
  // wins over config.json at resolve time, so writing to config would be dead
  // weight — and the user clearly already set it where they wanted it.
  const envVar = PROVIDER_ENV_VAR[newProvider];
  const keyFromEnv = process.env[envVar];
  let key: string | undefined;

  if (keyFromEnv) {
    console.log(`  ${pc.green("✓")} ${t("init.key_detected_in_env", { envVar })}`);
  } else {
    const existingKey =
      newProvider === "anthropic" ? existing.anthropicApiKey
      : newProvider === "openai" ? existing.openaiApiKey
      : existing.geminiApiKey;
    if (existingKey) {
      const overwrite = await p.confirm({
        message: t("init.key_exists"),
        initialValue: false,
      });
      if (p.isCancel(overwrite) || !overwrite) {
        p.cancel(t("init.cancelled"));
        return;
      }
    }

    const entered = await p.password({
      message: t("init.key_prompt"),
      validate(value) {
        if (!value) return "An API key is required.";
        if (newProvider === "anthropic" && !value.startsWith("sk-ant-")) {
          return "That doesn't look like an Anthropic key (expected sk-ant-...).";
        }
        if (newProvider === "openai" && !value.startsWith("sk-")) {
          return "That doesn't look like an OpenAI key (expected sk-...).";
        }
        if (newProvider === "gemini" && !value.startsWith("AIza")) {
          return "That doesn't look like a Gemini key (expected AIza...). If you're using a GCP service account, ignore this warning.";
        }
      },
    });

    if (p.isCancel(entered)) {
      p.cancel(t("init.cancelled"));
      return;
    }
    key = entered;
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

  // Switch i18n immediately so remaining messages use the chosen locale
  initI18n(newLocale);

  const keyField =
    newProvider === "anthropic" ? "anthropicApiKey"
    : newProvider === "openai" ? "openaiApiKey"
    : "geminiApiKey";
  const nextConfig: typeof existing = { ...existing, provider: newProvider, locale: newLocale };
  if (key !== undefined) {
    nextConfig[keyField] = key;
  }
  await writeConfig(nextConfig);
  p.outro(
    `${pc.green("✓")} ${t("init.saved", { path: pc.dim(paths.configFile), nextCmd: pc.cyan("aidev list") })}`,
  );
  console.log();
  console.log(pc.bold(t("init.next_steps")));
}

async function runReset(): Promise<void> {
  const confirm = await p.confirm({
    message: t("init.reset_confirm"),
    initialValue: false,
  });
  if (p.isCancel(confirm) || !confirm) {
    p.cancel(t("init.cancelled"));
    return;
  }

  // 1. Clear progress file
  await resetProgress();

  // 2. Restore all starter.ts files to their git-committed state
  const root = repoRoot();
  try {
    execSync("git checkout -- code/packages/exercises/anthropic/**/starter.ts code/packages/exercises/openai/**/starter.ts code/packages/exercises/gemini/**/starter.ts", {
      cwd: root,
      stdio: "pipe",
    });
  } catch {
    // If git checkout fails (no git, no changes, etc.), that's fine — progress is already cleared.
  }

  p.outro(`${pc.green("✓")} ${t("init.reset_done")}`);
}

async function runUpdate(): Promise<void> {
  const root = repoRoot();

  // Check current commit before pull
  let beforeHash: string;
  try {
    beforeHash = execSync("git rev-parse HEAD", { cwd: root, stdio: "pipe" }).toString().trim();
  } catch {
    console.error(pc.red(t("init.update_no_git")));
    return;
  }

  // Stash any local changes before pulling (package.json, starters, etc.)
  let didStash = false;
  try {
    const status = execSync("git status --porcelain", {
      cwd: root,
      stdio: "pipe",
    }).toString().trim();
    if (status) {
      console.log(pc.dim(t("init.update_stashing")));
      execSync("git stash push -m 'aidev-update: auto-stash before pull'", {
        cwd: root,
        stdio: "pipe",
      });
      didStash = true;
    }
  } catch {
    // git status/stash failed — try pulling anyway
  }

  console.log(pc.dim(t("init.update_pulling")));
  try {
    execSync("git pull --rebase", { cwd: root, stdio: "inherit" });
  } catch {
    // If pull fails, restore stash before exiting
    if (didStash) {
      try {
        execSync("git stash pop", { cwd: root, stdio: "pipe" });
      } catch { /* stash pop failed — user can recover manually */ }
    }
    console.error(pc.red(t("init.update_failed")));
    return;
  }

  // Restore local changes after successful pull
  if (didStash) {
    try {
      execSync("git stash pop", { cwd: root, stdio: "pipe" });
      console.log(pc.dim(t("init.update_restored")));
    } catch {
      console.warn(pc.yellow(t("init.update_stash_conflict")));
    }
  }

  const afterHash = execSync("git rev-parse HEAD", { cwd: root, stdio: "pipe" }).toString().trim();
  if (beforeHash === afterHash) {
    p.outro(`${pc.green("✓")} ${t("init.update_up_to_date")}`);
  } else {
    p.outro(`${pc.green("✓")} ${t("init.update_done")}`);
  }
}

export const initCommand = new Command("init")
  .description("Configure aidev (API key, preferences).")
  .option("--locale <code>", "Locale override for this invocation (es|en)")
  .action(async () => {
    printWelcomeBanner();
    p.intro(pc.bgCyan(pc.black(t("init.intro"))));

    const existing = await readConfig();
    const isReturningUser = !!(existing.anthropicApiKey || existing.openaiApiKey || existing.geminiApiKey);

    if (!isReturningUser) {
      // First-time user: go straight to configure
      await runConfigure();
      return;
    }

    // Returning user: show action menu
    const action = await p.select<"configure" | "reset" | "update">({
      message: t("init.action_prompt"),
      options: [
        { value: "configure" as const, label: t("init.action_configure") },
        { value: "reset" as const, label: t("init.action_reset") },
        { value: "update" as const, label: t("init.action_update") },
      ],
    });

    if (p.isCancel(action)) {
      p.cancel(t("init.cancelled"));
      return;
    }

    if (action === "configure") {
      await runConfigure();
    } else if (action === "reset") {
      await runReset();
    } else {
      await runUpdate();
    }
  });
