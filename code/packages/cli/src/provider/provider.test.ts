import { describe, test, expect, beforeEach } from "bun:test";
import { initProvider, getActiveProvider, _resetForTesting } from "./index.ts";

describe("provider singleton", () => {
  beforeEach(() => {
    _resetForTesting();
  });

  test("getActiveProvider throws before initProvider", () => {
    expect(() => getActiveProvider()).toThrow("[provider]");
  });

  test("initProvider sets active provider", () => {
    initProvider("anthropic");
    expect(getActiveProvider()).toBe("anthropic");
  });

  test("initProvider can be called with openai", () => {
    initProvider("openai");
    expect(getActiveProvider()).toBe("openai");
  });

  test("last initProvider call wins", () => {
    initProvider("anthropic");
    initProvider("openai");
    expect(getActiveProvider()).toBe("openai");
  });

  test("_resetForTesting makes getActiveProvider throw again", () => {
    initProvider("anthropic");
    _resetForTesting();
    expect(() => getActiveProvider()).toThrow("[provider]");
  });
});
