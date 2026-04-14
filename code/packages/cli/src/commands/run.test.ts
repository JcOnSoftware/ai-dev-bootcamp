/**
 * Integration tests for `aidev run` command.
 *
 * Two levels:
 *  - Unit-level (no API): unknown id → exit 1; missing API key → exit 1.
 *  - Integration (guarded by ANTHROPIC_API_KEY): real API calls.
 *
 * Test pattern: spawn the CLI via `bun run` and assert on stdout/stderr/exitCode.
 */
import { describe, expect, test, beforeAll } from "bun:test";
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { stat } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

const CLI_ENTRY = resolve(import.meta.dirname, "../index.ts");

function runCli(
  args: string[],
  env?: Record<string, string>,
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  return new Promise((res) => {
    const child = spawn("bun", ["run", CLI_ENTRY, ...args], {
      env: {
        HOME: "/tmp/aidev-test-no-home",
        PATH: process.env["PATH"] ?? "",
        ...(env ?? {}),
      },
    });

    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (d: Buffer) => { stdout += d.toString(); });
    child.stderr?.on("data", (d: Buffer) => { stderr += d.toString(); });

    const timer = setTimeout(() => { child.kill("SIGTERM"); }, 30_000);

    child.on("close", (code) => {
      clearTimeout(timer);
      res({ exitCode: code ?? 1, stdout, stderr });
    });
  });
}

// ─── Unit-level tests (no API key needed) ─────────────────────────────────────

describe("run command — unit-level (no API)", () => {
  test("unknown exercise id → exit 1 with not_found message", async () => {
    const { exitCode, stderr } = await runCli(["run", "xx-missing"], {
      ANTHROPIC_API_KEY: "sk-ant-fake-key-for-test",
    });
    expect(exitCode).toBe(1);
    expect(stderr).toContain("xx-missing");
  });

  test("missing ANTHROPIC_API_KEY → exit 1 with no_key message", async () => {
    // Explicitly unset ANTHROPIC_API_KEY + fake HOME (no config) → no_key path.
    const { exitCode, stderr } = await runCli(["run", "01-first-call"], {
      ANTHROPIC_API_KEY: "",
    });
    expect(exitCode).toBe(1);
    // Should contain either ES or EN "no key" message
    const combined = stderr;
    const hasNoKey =
      combined.includes("No se encontró API key") ||
      combined.includes("No Anthropic API key found");
    expect(hasNoKey).toBe(true);
  });

  test("aidev run --help exits 0 and shows usage", async () => {
    const { exitCode, stdout } = await runCli(["run", "--help"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("run");
    expect(stdout).toContain("--solution");
    expect(stdout).toContain("--stream-live");
  });
});

// ─── Integration tests (guarded by ANTHROPIC_API_KEY) ─────────────────────────

const apiKey = process.env["ANTHROPIC_API_KEY"];

describe("run command — integration (real API)", () => {
  beforeAll(() => {
    if (!apiKey) {
      console.log("Skipping integration tests: ANTHROPIC_API_KEY not set.");
    }
  });

  test("run 01-first-call --solution exits 0 and prints Model: line", async () => {
    if (!apiKey) return;

    const { exitCode, stdout } = await runCli(
      ["run", "01-first-call", "--solution"],
      { ANTHROPIC_API_KEY: apiKey },
    );
    expect(exitCode).toBe(0);
    // Should contain a "Model:" (EN) or "Modelo:" (ES) line
    const hasModel = stdout.includes("Model:") || stdout.includes("Modelo:");
    expect(hasModel).toBe(true);
  });

  test("run 01-first-call --solution prints non-empty response text", async () => {
    if (!apiKey) return;

    const { exitCode, stdout } = await runCli(
      ["run", "01-first-call", "--solution"],
      { ANTHROPIC_API_KEY: apiKey },
    );
    expect(exitCode).toBe(0);
    // Output should have content beyond just the summary header
    expect(stdout.trim().length).toBeGreaterThan(50);
  });

  test("run 03-streaming --solution --stream-live has deltas BEFORE Model: line", async () => {
    if (!apiKey) return;

    const { exitCode, stdout } = await runCli(
      ["run", "03-streaming", "--solution", "--stream-live"],
      { ANTHROPIC_API_KEY: apiKey },
    );
    expect(exitCode).toBe(0);
    // Find position of first Model: line (summary start)
    const modelLineIdx = stdout.search(/Model:|Modelo:/);
    expect(modelLineIdx).toBeGreaterThan(0);
    // Content before the Model: line should be non-empty (the deltas)
    const beforeSummary = stdout.slice(0, modelLineIdx).trim();
    expect(beforeSummary.length).toBeGreaterThan(0);
  });

  test("run 01-first-call does NOT write progress.json", async () => {
    if (!apiKey) return;

    const progressPath = join(homedir(), ".aidev", "progress.json");
    let statBefore: { mtime: Date } | undefined;
    try {
      const s = await stat(progressPath);
      statBefore = { mtime: s.mtime };
    } catch {
      statBefore = undefined;
    }

    await runCli(["run", "01-first-call", "--solution"], { ANTHROPIC_API_KEY: apiKey });

    let statAfter: { mtime: Date } | undefined;
    try {
      const s = await stat(progressPath);
      statAfter = { mtime: s.mtime };
    } catch {
      statAfter = undefined;
    }

    // If file didn't exist before, it must not exist now
    if (!statBefore) {
      expect(statAfter).toBeUndefined();
    } else {
      // mtime must not have changed
      expect(statAfter?.mtime.getTime()).toBe(statBefore.mtime.getTime());
    }
  });

  test("run 01-first-call --solution --locale en uses EN labels", async () => {
    if (!apiKey) return;

    const { exitCode, stdout } = await runCli(
      ["run", "01-first-call", "--solution", "--locale", "en"],
      { ANTHROPIC_API_KEY: apiKey },
    );
    expect(exitCode).toBe(0);
    expect(stdout).toContain("Model:");
  });
});
