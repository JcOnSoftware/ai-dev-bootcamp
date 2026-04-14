/**
 * Runner harness.
 *
 * Intercepts Anthropic SDK calls (monkey-patches Messages.prototype.create)
 * before loading the user's exercise code, so tests can assert on both the
 * request the user made AND the response they got — without the user code
 * needing any awareness of the harness.
 */

import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import Anthropic from "@anthropic-ai/sdk";
import type { Message, MessageCreateParams } from "@anthropic-ai/sdk/resources/messages/messages";

export interface CapturedCall {
  request: MessageCreateParams;
  response: Message;
  durationMs: number;
}

export interface HarnessResult {
  calls: CapturedCall[];
  lastCall: CapturedCall | undefined;
  userReturn: unknown;
}

export interface RunOptions {
  /** Function name to invoke on the exercise module. Defaults to the default export. */
  entry?: string;
}

/**
 * Runs the user's exercise file and returns captured API interactions.
 *
 * The exercise module must export (default) an async function that performs
 * the work. Any Anthropic `messages.create` call it makes is captured.
 */
export async function runUserCode(
  filePath: string,
  options: RunOptions = {},
): Promise<HarnessResult> {
  const calls: CapturedCall[] = [];
  const restore = patchMessagesCreate(calls);

  try {
    const absolutePath = resolve(filePath);
    // Cache-bust so repeated runs (e.g. in a test suite) don't reuse a stale module.
    const moduleUrl = `${pathToFileURL(absolutePath).href}?t=${Date.now()}`;
    const mod = (await import(moduleUrl)) as Record<string, unknown>;

    const entryName = options.entry ?? "default";
    const entry = mod[entryName];
    if (typeof entry !== "function") {
      throw new HarnessError(
        `Exercise at ${filePath} must export ${
          entryName === "default" ? "a default async function" : `function '${entryName}'`
        }, got ${typeof entry}.`,
      );
    }

    const userReturn = await (entry as () => unknown | Promise<unknown>)();

    return {
      calls,
      lastCall: calls[calls.length - 1],
      userReturn,
    };
  } finally {
    restore();
  }
}

export class HarnessError extends Error {
  override name = "HarnessError";
}

export type ExerciseTarget = "starter" | "solution";

/**
 * Resolves the exercise file to run, based on the `AIDEV_TARGET` env var
 * (defaults to "starter"). Call from a test file passing `import.meta.url`.
 *
 * Lets the same test file validate either the user's in-progress `starter.ts`
 * or the reference `solution.ts` without swapping files.
 */
export function resolveExerciseFile(
  importMetaUrl: string,
  override?: ExerciseTarget,
): string {
  const target = override ?? (process.env["AIDEV_TARGET"] as ExerciseTarget | undefined) ?? "starter";
  if (target !== "starter" && target !== "solution") {
    throw new HarnessError(
      `Invalid AIDEV_TARGET '${target}'. Must be 'starter' or 'solution'.`,
    );
  }
  const testDir = dirname(fileURLToPath(importMetaUrl));
  return resolve(testDir, `${target}.ts`);
}

/**
 * Monkey-patches Anthropic's Messages.prototype.create.
 *
 * We grab the Messages class from a throwaway client instance because it's not
 * exported at the top level of the SDK. Returns a restore function so callers
 * can always undo the patch (even if the user's code throws).
 */
function patchMessagesCreate(calls: CapturedCall[]): () => void {
  const probe = new Anthropic({ apiKey: "probe-not-used" });
  const MessagesCtor = probe.messages.constructor as {
    prototype: { create: (...args: unknown[]) => Promise<unknown> };
  };
  const proto = MessagesCtor.prototype;
  const original = proto.create;

  proto.create = async function patched(
    this: unknown,
    ...args: unknown[]
  ): Promise<unknown> {
    const request = args[0] as MessageCreateParams;
    const start = performance.now();
    const response = (await original.apply(this, args)) as Message;
    const durationMs = performance.now() - start;

    // We don't capture streams in v1 — the first-call exercise is non-streaming.
    // When we add streaming exercises, we'll tee the stream here.
    if (isMessage(response)) {
      calls.push({ request, response, durationMs });
    }

    return response;
  };

  return () => {
    proto.create = original;
  };
}

function isMessage(value: unknown): value is Message {
  return (
    typeof value === "object" &&
    value !== null &&
    "content" in value &&
    Array.isArray((value as { content: unknown }).content)
  );
}
