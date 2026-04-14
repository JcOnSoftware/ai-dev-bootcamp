import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";

// NOTE: homedir() on macOS reads from getpwuid() NOT $HOME env, so we cannot
// override the config file path via process.env.HOME. Instead we test the core
// locale resolution logic via resolveLocaleFromConfig() which accepts an already-
// loaded Config, and test resolveLocale() for env-var and flag scenarios only.

describe("validateLocale", () => {
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
    process.exit = exitMock as typeof process.exit;
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
    process.exit = exitMock as typeof process.exit;
    try {
      expect(() => validateLocale("")).toThrow("process.exit called");
    } finally {
      process.exit = origExit;
    }
  });
});

describe("resolveLocaleFromConfig", () => {
  // Tests the pure resolution logic given a pre-loaded Config object.

  test("returns default 'es' when no flag, no env, no config.locale", async () => {
    const { resolveLocaleFromConfig } = await import("./config.ts");
    const locale = resolveLocaleFromConfig({}, undefined, undefined);
    expect(locale).toBe("es");
  });

  test("returns config.locale when no flag or env override", async () => {
    const { resolveLocaleFromConfig } = await import("./config.ts");
    const locale = resolveLocaleFromConfig({ locale: "en" }, undefined, undefined);
    expect(locale).toBe("en");
  });

  test("env takes precedence over config.locale", async () => {
    const { resolveLocaleFromConfig } = await import("./config.ts");
    const locale = resolveLocaleFromConfig({ locale: "es" }, undefined, "en");
    expect(locale).toBe("en");
  });

  test("flag takes precedence over env and config.locale", async () => {
    const { resolveLocaleFromConfig } = await import("./config.ts");
    const locale = resolveLocaleFromConfig({ locale: "es" }, "en", "es");
    expect(locale).toBe("en");
  });

  test("invalid config.locale value calls process.exit(1)", async () => {
    const { resolveLocaleFromConfig } = await import("./config.ts");
    const exitMock = mock(() => {
      throw new Error("process.exit called");
    });
    const origExit = process.exit;
    process.exit = exitMock as typeof process.exit;
    try {
      expect(() =>
        resolveLocaleFromConfig({ locale: "zz" as "es" }, undefined, undefined),
      ).toThrow(
        "process.exit called",
      );
      expect(exitMock).toHaveBeenCalledWith(1);
    } finally {
      process.exit = origExit;
    }
  });
});

describe("resolveLocale (async — env var path)", () => {
  let origEnvLocale: string | undefined;

  beforeEach(() => {
    origEnvLocale = process.env["AIDEV_LOCALE"];
    delete process.env["AIDEV_LOCALE"];
  });

  afterEach(() => {
    if (origEnvLocale !== undefined) {
      process.env["AIDEV_LOCALE"] = origEnvLocale;
    } else {
      delete process.env["AIDEV_LOCALE"];
    }
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

  test("invalid flag value calls process.exit(1)", async () => {
    const { resolveLocale } = await import("./config.ts");
    const exitMock = mock(() => {
      throw new Error("process.exit called");
    });
    const origExit = process.exit;
    process.exit = exitMock as typeof process.exit;
    try {
      await expect(resolveLocale("zz")).rejects.toThrow("process.exit called");
      expect(exitMock).toHaveBeenCalledWith(1);
    } finally {
      process.exit = origExit;
    }
  });
});
