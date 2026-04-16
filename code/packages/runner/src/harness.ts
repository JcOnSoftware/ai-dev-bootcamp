/**
 * Harness dispatcher.
 *
 * Reads AIDEV_PROVIDER env var and delegates to the correct provider-specific
 * harness. Default: anthropic (backward compatible).
 */

import { runUserCodeAnthropic, type HarnessResultAnthropic } from "./harness-anthropic.ts";
import { HarnessError, type RunOptions } from "./types.ts";

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
      // OpenAI harness will be implemented when exercises exist
      throw new HarnessError(
        `OpenAI harness not yet implemented. Install exercises first via the OpenAI track SDDs.`,
      );
    default:
      throw new HarnessError(`Unsupported provider: ${provider}`);
  }
}
