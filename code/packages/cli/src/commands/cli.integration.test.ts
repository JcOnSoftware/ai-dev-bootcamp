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

describe("list command — locale-aware output", () => {
  test("aidev list --locale es uses ES strings in hint", async () => {
    const { exitCode, stdout } = await runCli(["list", "--locale", "es"]);
    expect(exitCode).toBe(0);
    // ES hint from es.json: "Ejecutá los tests de un ejercicio: aidev verify <id>"
    expect(stdout).toContain("Ejecutá los tests");
  });

  test("aidev list --locale en uses EN strings in hint", async () => {
    const { exitCode, stdout } = await runCli(["list", "--locale", "en"]);
    expect(exitCode).toBe(0);
    // EN hint from en.json: "Run an exercise's tests: aidev verify <id>"
    expect(stdout).toContain("Run an exercise");
  });
});

describe("progress command — locale-aware output", () => {
  test("aidev progress --locale es uses ES total string", async () => {
    const { exitCode, stdout } = await runCli(["progress", "--locale", "es"]);
    expect(exitCode).toBe(0);
    // ES total from es.json: "Total: {done}/{total} ejercicios completados."
    expect(stdout).toContain("ejercicios completados");
  });

  test("aidev progress --locale en uses EN total string", async () => {
    const { exitCode, stdout } = await runCli(["progress", "--locale", "en"]);
    expect(exitCode).toBe(0);
    // EN total from en.json: "Total: {done}/{total} exercises completed."
    expect(stdout).toContain("exercises completed");
  });
});

describe("editor — --editor flag and AIDEV_EDITOR env", () => {
  test("aidev --help mentions --editor option", async () => {
    const { exitCode, stdout } = await runCli(["--help"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("--editor");
  });

  test("aidev open --help shows --editor option", async () => {
    const { exitCode, stdout } = await runCli(["open", "--help"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("--editor");
  });

  test("aidev next --help shows --editor option", async () => {
    const { exitCode, stdout } = await runCli(["next", "--help"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("--editor");
  });

  test("AIDEV_EDITOR env is respected (reflected in open.opening output)", async () => {
    // We pass --locale en so the opening message is predictable.
    // aidev open without a valid exercise id will fail, but we can test by checking
    // the 'opening' line which prints the editor name after resolution.
    // Since aidev open on a nonexistent ID exits 1, use a known exercise ID.
    // However exercises require API keys for verify — open just opens the file.
    // The exit code may not be 0 if exercise not found, check the output.
    const { stdout, stderr } = await runCli(
      ["open", "01-first-call", "--locale", "en"],
      { AIDEV_EDITOR: "my-custom-editor", HOME: "/tmp/aidev-test-no-home" },
    );
    const combined = stdout + stderr;
    // The opening message includes the editor name.
    expect(combined).toContain("my-custom-editor");
  });
});

describe("verify command — exercise.md path line", () => {
  test("aidev verify 01-first-call --locale en prints EN exercise doc path", async () => {
    // No ANTHROPIC_API_KEY → verify will fail on API key check, but the doc path
    // line is printed BEFORE the API key check per spec (Phase 7.3).
    // We assert on the exercise doc path line only.
    const { stdout, stderr } = await runCli(["verify", "01-first-call", "--locale", "en"], {
      HOME: "/tmp/aidev-test-no-home",
    });
    const combined = stdout + stderr;
    // Should print: "→ Exercise: <path>/en/exercise.md"
    expect(combined).toContain("en/exercise.md");
  });

  test("aidev verify 01-first-call --locale es prints ES exercise doc path", async () => {
    const { stdout, stderr } = await runCli(["verify", "01-first-call", "--locale", "es"], {
      HOME: "/tmp/aidev-test-no-home",
    });
    const combined = stdout + stderr;
    // Should print: "→ Ejercicio: <path>/es/exercise.md"
    expect(combined).toContain("es/exercise.md");
  });
});
