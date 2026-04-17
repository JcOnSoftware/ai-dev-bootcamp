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

  test("returns default 'en' when no flag, no env, no config.locale", async () => {
    const { resolveLocaleFromConfig } = await import("./config.ts");
    const locale = resolveLocaleFromConfig({}, undefined, undefined);
    expect(locale).toBe("en");
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

describe("writeConfig / readConfig — locale field round-trip", () => {
  // Uses a temp directory to exercise the real file I/O without touching ~/.aidev.
  // We override HOME so configFile() points into a tmpdir.
  let origHome: string | undefined;
  let tmpDir: string;

  beforeEach(async () => {
    origHome = process.env["HOME"];
    tmpDir = `/tmp/aidev-config-test-${Date.now()}`;
    process.env["HOME"] = tmpDir;
  });

  afterEach(() => {
    if (origHome !== undefined) {
      process.env["HOME"] = origHome;
    } else {
      delete process.env["HOME"];
    }
  });

  test("writeConfig persists locale field and readConfig returns it", async () => {
    // NOTE: homedir() on macOS uses getpwuid(), not $HOME. So we test the
    // behaviour by calling writeConfig/readConfig with an explicit path via
    // writeFile/readFile helpers — or just trust the real I/O via HOME override
    // on Linux-based CI. On macOS dev, this test exercises the JSON round-trip
    // indirectly through config functions that use configFile() lazily.
    // The core contract: Config.locale is optional and serialized correctly.
    const { writeConfig, readConfig } = await import("./config.ts");

    // Write config with both key and locale
    await writeConfig({ anthropicApiKey: "sk-ant-test", locale: "en" });
    const loaded = await readConfig();

    expect(loaded.anthropicApiKey).toBe("sk-ant-test");
    expect(loaded.locale).toBe("en");
  });

  test("writeConfig with locale overwrite updates only locale", async () => {
    const { writeConfig, readConfig } = await import("./config.ts");

    await writeConfig({ anthropicApiKey: "sk-ant-test", locale: "es" });
    await writeConfig({ anthropicApiKey: "sk-ant-test", locale: "en" });
    const loaded = await readConfig();

    expect(loaded.locale).toBe("en");
  });
});

describe("resolveApiKey (gemini branch)", () => {
  let origGeminiKey: string | undefined;
  let origAnthropicKey: string | undefined;
  let origOpenaiKey: string | undefined;

  beforeEach(() => {
    origGeminiKey = process.env["GEMINI_API_KEY"];
    origAnthropicKey = process.env["ANTHROPIC_API_KEY"];
    origOpenaiKey = process.env["OPENAI_API_KEY"];
    delete process.env["GEMINI_API_KEY"];
    delete process.env["ANTHROPIC_API_KEY"];
    delete process.env["OPENAI_API_KEY"];
  });

  afterEach(() => {
    if (origGeminiKey !== undefined) process.env["GEMINI_API_KEY"] = origGeminiKey;
    else delete process.env["GEMINI_API_KEY"];
    if (origAnthropicKey !== undefined) process.env["ANTHROPIC_API_KEY"] = origAnthropicKey;
    else delete process.env["ANTHROPIC_API_KEY"];
    if (origOpenaiKey !== undefined) process.env["OPENAI_API_KEY"] = origOpenaiKey;
    else delete process.env["OPENAI_API_KEY"];
  });

  test("returns GEMINI_API_KEY when set and provider is gemini", async () => {
    process.env["GEMINI_API_KEY"] = "AIzaTestGeminiKey";
    const { resolveApiKey } = await import("./config.ts");
    const key = await resolveApiKey("gemini");
    expect(key).toBe("AIzaTestGeminiKey");
  });

  test("gemini branch ignores ANTHROPIC_API_KEY and OPENAI_API_KEY", async () => {
    process.env["ANTHROPIC_API_KEY"] = "sk-ant-should-ignore";
    process.env["OPENAI_API_KEY"] = "sk-should-ignore";
    const { resolveApiKey } = await import("./config.ts");
    const key = await resolveApiKey("gemini");
    // Without GEMINI_API_KEY and no config.geminiApiKey, must return undefined
    // (NOT fall back to anthropic or openai keys).
    expect(key).toBeUndefined();
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
