import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import type { SupportedLocale } from "./i18n/types.ts";
import { SUPPORTED_LOCALES } from "./i18n/types.ts";

export interface Config {
  anthropicApiKey?: string;
  locale?: SupportedLocale;
}

export interface ProgressEntry {
  passedAt: string;
  target: "starter" | "solution";
}

export type ProgressMap = Record<string, ProgressEntry>;

// Paths computed lazily so tests can override HOME before calling config functions.
function configDir(): string {
  return join(homedir(), ".aidev");
}
function configFile(): string {
  return join(configDir(), "config.json");
}
function progressFile(): string {
  return join(configDir(), "progress.json");
}

async function readJsonIfExists<T>(path: string): Promise<T | undefined> {
  try {
    const raw = await readFile(path, "utf-8");
    return JSON.parse(raw) as T;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw err;
  }
}

async function writeJson(path: string, data: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

export async function readConfig(): Promise<Config> {
  return (await readJsonIfExists<Config>(configFile())) ?? {};
}

export async function writeConfig(config: Config): Promise<void> {
  await writeJson(configFile(), config);
}

export async function readProgress(): Promise<ProgressMap> {
  return (await readJsonIfExists<ProgressMap>(progressFile())) ?? {};
}

export async function recordPass(
  exerciseId: string,
  target: "starter" | "solution",
): Promise<void> {
  // Only record real progress when the user solved it (starter). Running the
  // reference solution just proves the exercise is healthy, not that they learned.
  if (target !== "starter") return;
  const progress = await readProgress();
  progress[exerciseId] = {
    passedAt: new Date().toISOString(),
    target,
  };
  await writeJson(progressFile(), progress);
}

/** Resolves the Anthropic API key from env first, falling back to the config file. */
export async function resolveApiKey(): Promise<string | undefined> {
  if (process.env["ANTHROPIC_API_KEY"]) return process.env["ANTHROPIC_API_KEY"];
  const config = await readConfig();
  return config.anthropicApiKey;
}

/**
 * Validates that `value` is a supported locale string.
 * On invalid input: prints an error and calls process.exit(1).
 * NOTE: does NOT use t() — i18n may not be initialized yet at this call site.
 */
export function validateLocale(value: string): SupportedLocale {
  if ((SUPPORTED_LOCALES as readonly string[]).includes(value)) {
    return value as SupportedLocale;
  }
  const list = SUPPORTED_LOCALES.join(", ");
  console.error(`Unsupported locale "${value}". Supported: ${list}`);
  process.exit(1);
}

/**
 * Core locale resolution logic given an already-loaded Config object.
 * Exported for testability — callers in production use resolveLocale().
 */
export function resolveLocaleFromConfig(
  config: Config,
  flagValue?: string,
  envValue?: string,
): SupportedLocale {
  if (flagValue !== undefined) {
    return validateLocale(flagValue);
  }
  if (envValue) {
    return validateLocale(envValue);
  }
  if (config.locale) {
    return validateLocale(config.locale);
  }
  return "es";
}

/**
 * Resolves the active locale using the priority chain:
 *   flagValue → AIDEV_LOCALE env → config file locale → default "es"
 *
 * Mirrors the shape of resolveApiKey().
 */
export async function resolveLocale(flagValue?: string): Promise<SupportedLocale> {
  const config = await readConfig();
  return resolveLocaleFromConfig(config, flagValue, process.env["AIDEV_LOCALE"]);
}

export const paths = {
  get configDir() { return configDir(); },
  get configFile() { return configFile(); },
  get progressFile() { return progressFile(); },
};
