/**
 * Runner harness.
 *
 * Intercepts Anthropic SDK calls so tests can assert on both the request the
 * user made AND the response they got, without the user code needing any
 * awareness of the harness.
 *
 * Two methods are monkey-patched on `Messages.prototype`:
 *  - `create`: captures non-streaming responses (plain Message).
 *  - `stream`: captures MessageStream via its `.finalMessage()` helper.
 *
 * Critical: `create` returns an `APIPromise` (a thenable with extra methods
 * like `.withResponse()`). We MUST preserve that return value as-is — the
 * SDK's own `.stream()` helper chains `.withResponse()` on it. Wrapping the
 * patched `create` in `async function` breaks those methods and crashes the
 * stream helper. We attach capture as a side-effect via `.then()` instead.
 */

import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import Anthropic from "@anthropic-ai/sdk";
import type { Message, MessageCreateParams } from "@anthropic-ai/sdk/resources/messages/messages";

export interface CapturedCall {
  request: MessageCreateParams;
  response: Message;
  durationMs: number;
  /** True if the call used streaming (via `.stream()` or `{ stream: true }`). */
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
 * the work. Any Anthropic `messages.create` or `messages.stream` call is
 * captured.
 */
export async function runUserCode(
  filePath: string,
  options: RunOptions = {},
): Promise<HarnessResult> {
  const calls: CapturedCall[] = [];
  const pendingCaptures: Promise<void>[] = [];
  const restore = patchMessages(calls, pendingCaptures);

  try {
    const absolutePath = resolve(filePath);
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
 * Patches `Messages.prototype.create` and `Messages.prototype.stream`.
 *
 * Returns a restore function that undoes both patches.
 */
function patchMessages(
  calls: CapturedCall[],
  pendingCaptures: Promise<void>[],
): () => void {
  const probe = new Anthropic({ apiKey: "probe-not-used" });
  const proto = probe.messages.constructor.prototype as {
    create: (...args: unknown[]) => unknown;
    stream: (...args: unknown[]) => unknown;
  };
  const originalCreate = proto.create;
  const originalStream = proto.stream;

  // Patch create: preserve the APIPromise return value. Attach capture as
  // a side-effect via .then() so we don't break the SDK's chainable methods.
  proto.create = function patchedCreate(this: unknown, ...args: unknown[]): unknown {
    const request = args[0] as MessageCreateParams;
    const start = performance.now();
    const apiPromise = originalCreate.apply(this, args);

    if (apiPromise && typeof (apiPromise as PromiseLike<unknown>).then === "function") {
      (apiPromise as PromiseLike<unknown>).then(
        (response) => {
          // Only capture non-streaming Message here. Streaming (`.stream()`)
          // is handled by the stream patch below, so we don't double-count.
          if (isMessage(response)) {
            calls.push({
              request,
              response,
              durationMs: performance.now() - start,
              streamed: Boolean((request as { stream?: unknown }).stream),
            });
          }
        },
        () => {
          // Error surfaces through the user's await — nothing to capture.
        },
      );
    }

    return apiPromise;
  };

  // Patch stream: MessageStream returns synchronously. We register a capture
  // promise that awaits `.finalMessage()` — runUserCode awaits all pending
  // captures before returning.
  proto.stream = function patchedStream(this: unknown, ...args: unknown[]): unknown {
    const request = args[0] as MessageCreateParams;
    const start = performance.now();
    const messageStream = originalStream.apply(this, args);

    if (isStreamResponse(messageStream)) {
      pendingCaptures.push(captureStreamWhenDone(messageStream, request, start, calls));
    }

    return messageStream;
  };

  return () => {
    proto.create = originalCreate;
    proto.stream = originalStream;
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
    calls.push({
      request: { ...request, stream: true } as MessageCreateParams,
      response: finalMessage,
      durationMs: performance.now() - startTime,
      streamed: true,
    });
  } catch {
    // Stream errored. The user's iteration will surface the error —
    // swallow here so pendingCaptures doesn't reject.
  }
}
