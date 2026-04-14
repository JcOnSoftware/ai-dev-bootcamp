import { describe, expect, test } from "bun:test";
import { spawn } from "node:child_process";
import { resolve } from "node:path";

// Resolves the CLI entry point relative to this file.
const CLI_ENTRY = resolve(import.meta.dirname, "../index.ts");

/**
 * Spawns the CLI with the given args and returns { exitCode, stdout, stderr }.
 * Uses a 10-second timeout to prevent hanging tests.
 */
function runCli(
  args: string[],
  env?: Record<string, string>,
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn("bun", ["run", CLI_ENTRY, ...args], {
      env: {
        // Strip HOME so config reads don't find a real config with locale set.
        // Pass a non-existent home to force config-not-found → default "es".
        HOME: "/tmp/aidev-test-no-home",
        PATH: process.env["PATH"] ?? "",
        // Do NOT include AIDEV_LOCALE or ANTHROPIC_API_KEY so defaults apply.
        ...(env ?? {}),
      },
    });

    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (d: Buffer) => { stdout += d.toString(); });
    child.stderr?.on("data", (d: Buffer) => { stderr += d.toString(); });

    const timer = setTimeout(() => {
      child.kill("SIGTERM");
    }, 10_000);

    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ exitCode: code ?? 1, stdout, stderr });
    });
  });
}

describe("CLI smoke tests", () => {
  test("aidev --help exits 0 and prints usage", async () => {
    const { exitCode, stdout } = await runCli(["--help"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("Usage:");
  });

  test("aidev --version exits 0 and prints version string", async () => {
    const { exitCode, stdout } = await runCli(["--version"]);
    expect(exitCode).toBe(0);
    expect(stdout.trim()).toMatch(/\d+\.\d+\.\d+/);
  });

  test("aidev list --help shows --locale option", async () => {
    const { exitCode, stdout } = await runCli(["list", "--help"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("--locale");
  });

  test("aidev verify --help shows --locale option", async () => {
    const { exitCode, stdout } = await runCli(["verify", "--help"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("--locale");
  });

  test("aidev --locale xx (invalid) exits 1 and lists valid locales", async () => {
    const { exitCode, stderr } = await runCli(["--locale", "xx", "list"]);
    expect(exitCode).toBe(1);
    // Error message printed to stderr by validateLocale
    expect(stderr).toContain("Unsupported locale");
    expect(stderr).toMatch(/es.*en|en.*es/);
  });

  test("aidev list --locale fr (invalid subcommand flag) exits 1", async () => {
    const { exitCode, stderr } = await runCli(["list", "--locale", "fr"]);
    expect(exitCode).toBe(1);
    expect(stderr).toContain("Unsupported locale");
  });
});
