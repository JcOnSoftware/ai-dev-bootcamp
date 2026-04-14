import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { SupportedLocale } from "./i18n/types.ts";

// We need to stub process.exit and console.error for the invalid-locale path.
// We also need to control HOME so readConfig() reads from a temp dir.

describe("validateLocale", () => {
  // We import inline so the module isn't polluted across describe blocks.
  test("accepts 'es'", async () => {
    const { validateLocale } = await import("./config.ts");
    expect(validateLocale("es")).toBe("es");
  });

  test("accepts 'en'", async () => {
    const { validateLocale } = await import("./config.ts");
    expect(validateLocale("en")).toBe("en");
  });

  test("rejects unknown locale — calls process.exit(1)", async () => {
    const { validateLocale } = await import("./config.ts");
    const exitMock = mock(() => {
      throw new Error("process.exit called");
    });
    const origExit = process.exit;
    // @ts-expect-error — mock replaces exit for test
    process.exit = exitMock;
    try {
      expect(() => validateLocale("fr")).toThrow("process.exit called");
      expect(exitMock).toHaveBeenCalledWith(1);
    } finally {
      process.exit = origExit;
    }
  });

  test("rejects empty string", async () => {
    const { validateLocale } = await import("./config.ts");
    const exitMock = mock(() => {
      throw new Error("process.exit called");
    });
    const origExit = process.exit;
    // @ts-expect-error — mock
    process.exit = exitMock;
    try {
      expect(() => validateLocale("")).toThrow("process.exit called");
    } finally {
      process.exit = origExit;
    }
  });
});

describe("resolveLocale", () => {
  let tmpDir: string;
  let origEnvLocale: string | undefined;
  let origEnvHome: string | undefined;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "aidev-config-test-"));
    origEnvLocale = process.env["AIDEV_LOCALE"];
    origEnvHome = process.env["HOME"];
    delete process.env["AIDEV_LOCALE"];
    // Point HOME to tmpDir so readConfig reads from tmpDir/.aidev/config.json
    process.env["HOME"] = tmpDir;
  });

  afterEach(async () => {
    if (origEnvLocale !== undefined) {
      process.env["AIDEV_LOCALE"] = origEnvLocale;
    } else {
      delete process.env["AIDEV_LOCALE"];
    }
    if (origEnvHome !== undefined) {
      process.env["HOME"] = origEnvHome;
    } else {
      delete process.env["HOME"];
    }
    await rm(tmpDir, { recursive: true, force: true });
  });

  test("returns default 'es' when no flag, no env, no config", async () => {
    const { resolveLocale } = await import("./config.ts");
    const locale = await resolveLocale();
    expect(locale).toBe("es");
  });

  test("returns env AIDEV_LOCALE when set (no flag)", async () => {
    process.env["AIDEV_LOCALE"] = "en";
    const { resolveLocale } = await import("./config.ts");
    const locale = await resolveLocale();
    expect(locale).toBe("en");
  });

  test("flag value takes precedence over env", async () => {
    process.env["AIDEV_LOCALE"] = "es";
    const { resolveLocale } = await import("./config.ts");
    const locale = await resolveLocale("en");
    expect(locale).toBe("en");
  });

  test("returns config file locale when no flag or env", async () => {
    const configDir = join(tmpDir, ".aidev");
    const configFile = join(configDir, "config.json");
    await import("node:fs/promises").then(async (fs) => {
      await fs.mkdir(configDir, { recursive: true });
      await fs.writeFile(configFile, JSON.stringify({ locale: "en" }), "utf-8");
    });
    const { resolveLocale } = await import("./config.ts");
    const locale = await resolveLocale();
    expect(locale).toBe("en");
  });

  test("invalid flag value calls process.exit(1)", async () => {
    const { resolveLocale } = await import("./config.ts");
    const exitMock = mock(() => {
      throw new Error("process.exit called");
    });
    const origExit = process.exit;
    // @ts-expect-error — mock
    process.exit = exitMock;
    try {
      await expect(resolveLocale("zz")).rejects.toThrow("process.exit called");
      expect(exitMock).toHaveBeenCalledWith(1);
    } finally {
      process.exit = origExit;
    }
  });
});
