import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

function repoRoot(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  return resolve(here, "..", "..", "..", "..");
}

/** Default path to the project-local .env: <repo>/code/.env. */
export function defaultProjectEnvPath(): string {
  return resolve(repoRoot(), "code", ".env");
}

/**
 * Parses a .env file content into a flat record. Supports:
 *   - KEY=VALUE lines
 *   - Blank lines and # comments
 *   - Values optionally wrapped in single or double quotes
 *   - export KEY=VALUE prefix
 * Unsupported (intentional): multi-line values, variable interpolation.
 */
function parseDotenv(contents: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const raw of contents.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const withoutExport = line.startsWith("export ") ? line.slice("export ".length) : line;
    const eq = withoutExport.indexOf("=");
    if (eq === -1) continue;
    const key = withoutExport.slice(0, eq).trim();
    if (!key) continue;
    let value = withoutExport.slice(eq + 1).trim();
    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

/**
 * Loads environment variables from a .env file into `process.env`, but does
 * NOT overwrite variables already present — shell exports always win.
 *
 * Resolution order for keys across the CLI:
 *   1. process.env (shell)       — highest
 *   2. code/.env (this function) — middle
 *   3. ~/.aidev/config.json      — lowest (via resolveApiKey)
 */
export function loadProjectEnv(envPath: string = defaultProjectEnvPath()): void {
  if (!existsSync(envPath)) return;
  const parsed = parseDotenv(readFileSync(envPath, "utf-8"));
  for (const [key, value] of Object.entries(parsed)) {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}
