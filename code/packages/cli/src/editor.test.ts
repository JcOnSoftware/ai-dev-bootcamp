/**
 * Unit tests for editor.ts — resolution order and isEditorInPath.
 *
 * TDD cycle: these tests are written BEFORE the implementation is in place.
 * They will fail until the corresponding code is added to editor.ts / config.ts.
 */
import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomBytes } from "node:crypto";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function tmpHome(): string {
  return join(tmpdir(), `aidev-editor-test-${randomBytes(6).toString("hex")}`);
}

async function writeConfig(home: string, data: Record<string, unknown>): Promise<void> {
  const dir = join(home, ".aidev");
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, "config.json"), JSON.stringify(data, null, 2));
}

// ---------------------------------------------------------------------------
// SUGGESTED_EDITORS export
// ---------------------------------------------------------------------------

describe("SUGGESTED_EDITORS", () => {
  test("exports a non-empty array with binary + label", async () => {
    const { SUGGESTED_EDITORS } = await import("./editor.ts");
    expect(Array.isArray(SUGGESTED_EDITORS)).toBe(true);
    expect(SUGGESTED_EDITORS.length).toBeGreaterThan(0);
    for (const item of SUGGESTED_EDITORS) {
      expect(typeof item.binary).toBe("string");
      expect(item.binary.length).toBeGreaterThan(0);
      expect(typeof item.label).toBe("string");
      expect(item.label.length).toBeGreaterThan(0);
    }
  });

  test("includes VS Code, Cursor, Zed, Neovim, WebStorm", async () => {
    const { SUGGESTED_EDITORS } = await import("./editor.ts");
    const binaries = SUGGESTED_EDITORS.map((e) => e.binary);
    expect(binaries).toContain("code");
    expect(binaries).toContain("cursor");
    expect(binaries).toContain("zed");
    expect(binaries).toContain("nvim");
    expect(binaries).toContain("webstorm");
  });
});

// ---------------------------------------------------------------------------
// isEditorInPath
// ---------------------------------------------------------------------------

describe("isEditorInPath", () => {
  test("returns true for a binary that exists in PATH (bun)", async () => {
    const { isEditorInPath } = await import("./editor.ts");
    // "bun" is always in PATH when running bun test
    const result = await isEditorInPath("bun");
    expect(result).toBe(true);
  });

  test("returns false for a binary that does not exist in PATH", async () => {
    const { isEditorInPath } = await import("./editor.ts");
    const result = await isEditorInPath("__nonexistent_binary_xyz_123__");
    expect(result).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// resolveEditor — resolution order
// ---------------------------------------------------------------------------

describe("resolveEditor — resolution order", () => {
  let home: string;
  let savedEnv: Record<string, string | undefined>;

  beforeEach(async () => {
    home = tmpHome();
    await mkdir(home, { recursive: true });
    // Save env vars we'll manipulate
    savedEnv = {
      HOME: process.env["HOME"],
      AIDEV_EDITOR: process.env["AIDEV_EDITOR"],
      VISUAL: process.env["VISUAL"],
      EDITOR: process.env["EDITOR"],
    };
  });

  afterEach(async () => {
    // Restore env
    for (const [key, val] of Object.entries(savedEnv)) {
      if (val === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = val;
      }
    }
    await rm(home, { recursive: true, force: true });
  });

  test("flag beats AIDEV_EDITOR env", async () => {
    const { resolveEditor } = await import("./editor.ts");
    process.env["HOME"] = home;
    process.env["AIDEV_EDITOR"] = "nvim";
    delete process.env["VISUAL"];
    delete process.env["EDITOR"];
    const result = await resolveEditor("zed");
    expect(result).toBe("zed");
  });

  test("AIDEV_EDITOR env beats VISUAL", async () => {
    const { resolveEditor } = await import("./editor.ts");
    process.env["HOME"] = home;
    process.env["AIDEV_EDITOR"] = "cursor";
    process.env["VISUAL"] = "emacs";
    delete process.env["EDITOR"];
    const result = await resolveEditor(undefined);
    expect(result).toBe("cursor");
  });

  test("VISUAL beats EDITOR", async () => {
    const { resolveEditor } = await import("./editor.ts");
    process.env["HOME"] = home;
    delete process.env["AIDEV_EDITOR"];
    process.env["VISUAL"] = "vim";
    process.env["EDITOR"] = "nano";
    const result = await resolveEditor(undefined);
    expect(result).toBe("vim");
  });

  test("EDITOR beats config.editor", async () => {
    const { resolveEditor } = await import("./editor.ts");
    process.env["HOME"] = home;
    delete process.env["AIDEV_EDITOR"];
    delete process.env["VISUAL"];
    process.env["EDITOR"] = "nano";
    await writeConfig(home, { editor: "windsurf" });
    const result = await resolveEditor(undefined);
    expect(result).toBe("nano");
  });

  // NOTE: config.editor resolution cannot be tested purely at unit level because
  // node:os homedir() is cached at process start and does not follow dynamic HOME changes.
  // The config.editor → resolveEditor path is covered by CLI integration tests instead.
  // See "editor — resolution order (integration)" describe block in cli.integration.test.ts.

  test("defaults to 'code' when nothing is set", async () => {
    const { resolveEditor } = await import("./editor.ts");
    process.env["HOME"] = home;
    delete process.env["AIDEV_EDITOR"];
    delete process.env["VISUAL"];
    delete process.env["EDITOR"];
    // No config file written
    const result = await resolveEditor(undefined);
    expect(result).toBe("code");
  });
});

// ---------------------------------------------------------------------------
// Config: editor field persists via readConfig / writeConfig
// ---------------------------------------------------------------------------

describe("Config editor field persistence", () => {
  let home: string;
  let savedHome: string | undefined;

  beforeEach(async () => {
    home = tmpHome();
    await mkdir(home, { recursive: true });
    savedHome = process.env["HOME"];
    process.env["HOME"] = home;
  });

  afterEach(async () => {
    if (savedHome === undefined) {
      delete process.env["HOME"];
    } else {
      process.env["HOME"] = savedHome;
    }
    await rm(home, { recursive: true, force: true });
  });

  test("writeConfig persists editor field; readConfig retrieves it", async () => {
    const { readConfig, writeConfig } = await import("./config.ts");
    await writeConfig({ editor: "cursor" });
    const config = await readConfig();
    expect(config.editor).toBe("cursor");
  });

  test("writeConfig with no editor field leaves editor undefined", async () => {
    const { readConfig, writeConfig } = await import("./config.ts");
    await writeConfig({ provider: "anthropic" });
    const config = await readConfig();
    expect(config.editor).toBeUndefined();
  });
});
