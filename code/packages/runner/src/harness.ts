/**
 * Runner harness.
 *
 * Intercepts Anthropic SDK calls (monkey-patches Messages.prototype.create)
 * before loading the user's exercise code, so tests can assert on both the
 * request the user made AND the response they got — without the user code
 * needing any awareness of the harness.
 *
 * Both non-streaming and streaming calls are captured:
 *  - Non-streaming: response is a Message — pushed immediately.
 *  - Streaming: response is a MessageStream — we await its .finalMessage()
 *    in the background and push when it resolves. `runUserCode()` waits for
 *    all in-flight stream captures before returning, so tests see a stable
 *    `calls[]` array.
 */

import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import Anthropic from "@anthropic-ai/sdk";
import type { Message, MessageCreateParams } from "@anthropic-ai/sdk/resources/messages/messages";

export interface CapturedCall {
  request: MessageCreateParams;
  response: Message;
  durationMs: number;
  /** True if the call used streaming (request.stream === true). */
  streamed: boolean;
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
 * the work. Any Anthropic `messages.create` call (streaming or not) is
 * captured.
 */
export async function runUserCode(
  filePath: string,
  options: RunOptions = {},
): Promise<HarnessResult> {
  const calls: CapturedCall[] = [];
  const pendingCaptures: Promise<void>[] = [];
  const restore = patchMessagesCreate(calls, pendingCaptures);

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

    // Wait for any background stream captures to complete before returning.
    // Without this, tests would race against async stream finalization.
    if (pendingCaptures.length > 0) {
      await Promise.all(pendingCaptures);
    }

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
function patchMessagesCreate(
  calls: CapturedCall[],
  pendingCaptures: Promise<void>[],
): () => void {
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
    const response = await original.apply(this, args);

    if (isStreamResponse(response)) {
      // Streaming: don't block — capture in background while the user's
      // iterator consumes events. runUserCode() awaits pendingCaptures.
      pendingCaptures.push(captureStreamWhenDone(response, request, start, calls));
      return response;
    }

    if (isMessage(response)) {
      const durationMs = performance.now() - start;
      calls.push({ request, response, durationMs, streamed: false });
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

/**
 * A MessageStream exposes `.finalMessage()` to await the accumulated result.
 * That signature is our structural marker — no need to import the internal
 * class (which is not a top-level SDK export).
 */
interface StreamLike {
  finalMessage(): Promise<Message>;
}

function isStreamResponse(value: unknown): value is StreamLike {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { finalMessage?: unknown }).finalMessage === "function"
  );
}

async function captureStreamWhenDone(
  stream: StreamLike,
  request: MessageCreateParams,
  startTime: number,
  calls: CapturedCall[],
): Promise<void> {
  try {
    const finalMessage = await stream.finalMessage();
    const durationMs = performance.now() - startTime;
    calls.push({ request, response: finalMessage, durationMs, streamed: true });
  } catch {
    // Stream errored. The user's iteration will surface the error itself —
    // we just skip capture. Swallow so the pendingCaptures promise doesn't
    // reject and blow up unrelated assertions.
  }
}
