import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

export interface Config {
  anthropicApiKey?: string;
}

export interface ProgressEntry {
  passedAt: string;
  target: "starter" | "solution";
}

export type ProgressMap = Record<string, ProgressEntry>;

const CONFIG_DIR = join(homedir(), ".aidev");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");
const PROGRESS_FILE = join(CONFIG_DIR, "progress.json");

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
  return (await readJsonIfExists<Config>(CONFIG_FILE)) ?? {};
}

export async function writeConfig(config: Config): Promise<void> {
  await writeJson(CONFIG_FILE, config);
}

export async function readProgress(): Promise<ProgressMap> {
  return (await readJsonIfExists<ProgressMap>(PROGRESS_FILE)) ?? {};
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
  await writeJson(PROGRESS_FILE, progress);
}

/** Resolves the Anthropic API key from env first, falling back to the config file. */
export async function resolveApiKey(): Promise<string | undefined> {
  if (process.env["ANTHROPIC_API_KEY"]) return process.env["ANTHROPIC_API_KEY"];
  const config = await readConfig();
  return config.anthropicApiKey;
}

export const paths = {
  configDir: CONFIG_DIR,
  configFile: CONFIG_FILE,
  progressFile: PROGRESS_FILE,
};
