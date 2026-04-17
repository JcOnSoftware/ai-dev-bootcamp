/**
 * Harness dispatcher.
 *
 * Reads AIDEV_PROVIDER env var and delegates to the correct provider-specific
 * harness. Default: anthropic (backward compatible).
 */

import { runUserCodeAnthropic, type HarnessResultAnthropic } from "./harness-anthropic.ts";
import { runUserCodeOpenAI, type HarnessResultOpenAI } from "./harness-openai.ts";
import { runUserCodeGemini, type HarnessResultGemini } from "./harness-gemini.ts";
import { HarnessError, type RunOptions } from "./types.ts";

/** Default HarnessResult type — Anthropic for backward compat. Use provider-specific types for narrowing. */
export type HarnessResult = HarnessResultAnthropic;

export async function runUserCode(
  filePath: string,
  options: RunOptions = {},
): Promise<HarnessResult> {
  const provider = process.env["AIDEV_PROVIDER"] ?? "anthropic";

  switch (provider) {
    case "anthropic":
      return runUserCodeAnthropic(filePath, options);
    case "openai":
      return runUserCodeOpenAI(filePath, options) as unknown as HarnessResult;
    case "gemini":
      return runUserCodeGemini(filePath, options) as unknown as HarnessResult;
    default:
      throw new HarnessError(`Unsupported provider: ${provider}`);
  }
}
