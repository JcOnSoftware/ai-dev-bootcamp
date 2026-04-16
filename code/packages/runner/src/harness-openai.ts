/**
 * OpenAI harness.
 *
 * Intercepts OpenAI SDK calls so tests can assert on both the request the
 * user made AND the response they got. Mirrors harness-anthropic.ts structure.
 *
 * Monkey-patches `Completions.prototype.create` to capture non-streaming
 * responses. For streaming, wraps the returned async iterable in a Proxy
 * that intercepts iteration to capture chunks and reconstruct a response.
 */

import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import OpenAI from "openai";
import type {
  ChatCompletion,
  ChatCompletionCreateParams,
  ChatCompletionChunk,
} from "openai/resources/chat/completions";
import { HarnessError, type RunOptions } from "./types.ts";

export interface CapturedCallOpenAI {
  request: ChatCompletionCreateParams;
  response: ChatCompletion;
  durationMs: number;
  streamed: boolean;
}

export interface HarnessResultOpenAI {
  calls: CapturedCallOpenAI[];
  lastCall: CapturedCallOpenAI | undefined;
  userReturn: unknown;
}

export async function runUserCodeOpenAI(
  filePath: string,
  options: RunOptions = {},
): Promise<HarnessResultOpenAI> {
  const calls: CapturedCallOpenAI[] = [];
  const pendingCaptures: Promise<void>[] = [];
  const restore = patchCompletions(calls, pendingCaptures, options.onStreamEvent);

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

/**
 * Patches `Completions.prototype.create` to capture requests and responses.
 *
 * Non-streaming: attaches capture as a .then() side-effect on the returned promise.
 * Streaming: wraps the returned Stream in a Proxy that intercepts async iteration.
 */
function patchCompletions(
  calls: CapturedCallOpenAI[],
  pendingCaptures: Promise<void>[],
  onStreamEvent?: (event: unknown) => void,
): () => void {
  const probe = new OpenAI({ apiKey: "probe-not-used" });
  const proto = probe.chat.completions.constructor.prototype as {
    create: (...args: unknown[]) => unknown;
  };
  const originalCreate = proto.create;

  proto.create = function patchedCreate(this: unknown, ...args: unknown[]): unknown {
    const request = args[0] as ChatCompletionCreateParams;
    const start = performance.now();
    const result = originalCreate.apply(this, args);

    // OpenAI SDK always returns a Promise (APIPromise).
    // For streaming: it resolves to a Stream (async iterable).
    // For non-streaming: it resolves to a ChatCompletion.
    if (result && typeof (result as PromiseLike<unknown>).then === "function") {
      if (request.stream) {
        // Streaming: intercept the promise, wrap the resolved Stream in a proxy
        const wrappedPromise = (result as PromiseLike<unknown>).then(
          (stream) => {
            if (stream && typeof stream === "object" && Symbol.asyncIterator in stream) {
              return wrapStreamProxy(
                stream as object,
                request,
                start,
                calls,
                pendingCaptures,
                onStreamEvent,
              );
            }
            return stream;
          },
        );
        return wrappedPromise;
      }

      // Non-streaming: capture the resolved ChatCompletion
      (result as PromiseLike<unknown>).then(
        (response) => {
          if (isChatCompletion(response)) {
            calls.push({
              request,
              response,
              durationMs: performance.now() - start,
              streamed: false,
            });
          }
        },
        () => {
          // Error surfaces through user's await
        },
      );
    }

    return result;
  };

  return () => {
    proto.create = originalCreate;
  };
}

function isChatCompletion(value: unknown): value is ChatCompletion {
  return (
    typeof value === "object" &&
    value !== null &&
    "choices" in value &&
    Array.isArray((value as { choices: unknown }).choices) &&
    "model" in value
  );
}

/**
 * Wraps an OpenAI Stream in a Proxy that intercepts async iteration.
 *
 * Each chunk is forwarded to onStreamEvent (if provided). When iteration
 * completes, a synthetic ChatCompletion is assembled from accumulated chunks
 * and pushed to the calls array.
 */
function wrapStreamProxy(
  stream: object,
  request: ChatCompletionCreateParams,
  startTime: number,
  calls: CapturedCallOpenAI[],
  pendingCaptures: Promise<void>[],
  onStreamEvent?: (event: unknown) => void,
): object {
  const chunks: ChatCompletionChunk[] = [];

  // We need to capture the entire iteration, so we create a promise
  // that resolves when the async iterator is done.
  let resolveCapture: () => void;
  const capturePromise = new Promise<void>((resolve) => {
    resolveCapture = resolve;
  });
  pendingCaptures.push(capturePromise);

  const originalIterator = (stream as AsyncIterable<ChatCompletionChunk>)[Symbol.asyncIterator]();
  let iterationStarted = false;

  const proxyIterator: AsyncIterator<ChatCompletionChunk> = {
    async next() {
      iterationStarted = true;
      const result = await originalIterator.next();
      if (!result.done) {
        chunks.push(result.value);
        if (onStreamEvent) {
          try {
            onStreamEvent(result.value);
          } catch {
            // Never crash user code
          }
        }
      } else {
        // Stream complete — assemble and capture
        const assembled = assembleFromChunks(chunks, request);
        if (assembled) {
          calls.push({
            request: { ...request, stream: true } as ChatCompletionCreateParams,
            response: assembled,
            durationMs: performance.now() - startTime,
            streamed: true,
          });
        }
        resolveCapture();
      }
      return result;
    },
  };

  return new Proxy(stream, {
    get(target, prop) {
      if (prop === Symbol.asyncIterator) {
        return () => proxyIterator;
      }
      // Forward everything else (e.g., .controller, .response, .toReadableStream)
      const val = Reflect.get(target, prop);
      if (typeof val === "function") {
        return val.bind(target);
      }
      return val;
    },
  });
}

/**
 * Assembles a synthetic ChatCompletion from accumulated streaming chunks.
 *
 * OpenAI streaming chunks have: id, model, choices[].delta, and optionally
 * usage on the last chunk (when stream_options.include_usage is true).
 */
function assembleFromChunks(
  chunks: ChatCompletionChunk[],
  request: ChatCompletionCreateParams,
): ChatCompletion | null {
  if (chunks.length === 0) return null;

  const first = chunks[0]!;
  const last = chunks[chunks.length - 1]!;

  // Concatenate text deltas per choice index
  const textByChoice = new Map<number, string>();
  let finishReason: string | null = null;

  for (const chunk of chunks) {
    for (const choice of chunk.choices) {
      const existing = textByChoice.get(choice.index) ?? "";
      textByChoice.set(choice.index, existing + (choice.delta?.content ?? ""));
      if (choice.finish_reason) {
        finishReason = choice.finish_reason;
      }
    }
  }

  // Usage from last chunk (if stream_options.include_usage was set)
  const usage = last.usage ?? {
    prompt_tokens: 0,
    completion_tokens: 0,
    total_tokens: 0,
  };

  return {
    id: first.id,
    object: "chat.completion",
    created: first.created,
    model: first.model,
    choices: Array.from(textByChoice.entries()).map(([index, content]) => ({
      index,
      message: {
        role: "assistant" as const,
        content,
        refusal: null,
      },
      finish_reason: (finishReason ?? "stop") as "stop" | "tool_calls" | "length" | "content_filter" | "function_call",
      logprobs: null,
    })),
    usage: {
      prompt_tokens: usage.prompt_tokens,
      completion_tokens: usage.completion_tokens,
      total_tokens: usage.total_tokens,
    },
  };
}
