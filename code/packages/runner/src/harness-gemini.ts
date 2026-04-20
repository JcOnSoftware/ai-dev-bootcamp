/**
 * Gemini harness.
 *
 * Intercepts `@google/genai` SDK calls so tests can assert on both the request
 * the user made AND the response they got. Mirrors the pattern used by
 * harness-anthropic.ts and harness-openai.ts.
 *
 * CRITICAL — patching strategy (from B0-T00 spike):
 *   Public methods `generateContent`, `generateContentStream`, `embedContent`
 *   are INSTANCE-LEVEL bindings (added per-instance by the constructor) —
 *   they are NOT on the `Models` prototype. Patching the prototype for those
 *   names has NO effect on instance calls.
 *
 *   The real logic lives in `*Internal` methods on the prototype:
 *     - generateContentInternal
 *     - generateContentStreamInternal
 *     - embedContentInternal
 *
 *   Public wrappers delegate via `this.*Internal(params)` after param
 *   normalization. Patching the Internal methods intercepts every instance
 *   globally, while preserving whatever pre-processing the public wrapper does.
 */

import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { GoogleGenAI } from "@google/genai";
import { HarnessError, type RunOptions } from "./types.ts";

/** Usage metadata shape returned by Gemini (camelCase). */
export interface GeminiUsageMetadata {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
  cachedContentTokenCount?: number;
  thoughtsTokenCount?: number;
}

/** One Gemini generate/stream/embed call captured by the harness. */
export interface CapturedCallGemini {
  /** Which public method was invoked. */
  method: "generateContent" | "generateContentStream" | "embedContent";
  /** Normalized params passed to the Internal method (after public-wrapper pre-processing). */
  request: Record<string, unknown>;
  /** The resolved response from the SDK. For streaming calls, this is an assembled response built from accumulated chunks. */
  response: Record<string, unknown>;
  durationMs: number;
  streamed: boolean;
}

export interface HarnessResultGemini {
  calls: CapturedCallGemini[];
  lastCall: CapturedCallGemini | undefined;
  userReturn: unknown;
}

/**
 * Gemini's backend returns 503 UNAVAILABLE on model-capacity spikes and 429
 * on quota. Neither indicates a bug in the learner's code, so the harness
 * retries the whole exercise run (fresh import, fresh patches) up to 3 times
 * with exponential backoff. Non-transient errors (bad request, auth, etc.)
 * propagate immediately.
 */
function isTransientGeminiError(err: unknown): boolean {
  const status = (err as { status?: number } | null | undefined)?.status;
  return status === 503 || status === 429 || status === 500;
}

export async function runUserCodeGemini(
  filePath: string,
  options: RunOptions = {},
): Promise<HarnessResultGemini> {
  const MAX_ATTEMPTS = 3;
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const calls: CapturedCallGemini[] = [];
    const pendingCaptures: Promise<void>[] = [];
    const restore = patchModels(calls, pendingCaptures, options.onStreamEvent);

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
    } catch (err) {
      lastError = err;
      if (attempt < MAX_ATTEMPTS && isTransientGeminiError(err)) {
        await new Promise((r) => setTimeout(r, 1000 * 2 ** (attempt - 1)));
        continue;
      }
      throw err;
    } finally {
      restore();
    }
  }

  throw lastError ?? new HarnessError("runUserCodeGemini: unreachable");
}

/**
 * Patches the three `*Internal` methods on `Models.prototype`:
 *   generateContentInternal, generateContentStreamInternal, embedContentInternal
 *
 * Returns a restore function that reverts the prototype to its original state.
 */
function patchModels(
  calls: CapturedCallGemini[],
  pendingCaptures: Promise<void>[],
  onStreamEvent?: (event: unknown) => void,
): () => void {
  // The Models class is not exported by @google/genai. Read its prototype off
  // an instance — the public API guarantees `ai.models` is a Models instance.
  const probe = new GoogleGenAI({ apiKey: "probe-not-used" });
  const proto = Object.getPrototypeOf(probe.models) as Record<string, unknown>;

  const originalGenerate = proto["generateContentInternal"] as
    | ((params: Record<string, unknown>) => Promise<Record<string, unknown>>)
    | undefined;
  const originalStream = proto["generateContentStreamInternal"] as
    | ((params: Record<string, unknown>) => Promise<AsyncIterable<Record<string, unknown>>>)
    | undefined;
  const originalEmbed = proto["embedContentInternal"] as
    | ((params: Record<string, unknown>) => Promise<Record<string, unknown>>)
    | undefined;

  if (!originalGenerate || !originalStream || !originalEmbed) {
    throw new HarnessError(
      "Gemini harness: expected *Internal methods on Models.prototype — the @google/genai SDK may have changed shape. See harness-gemini.ts docs.",
    );
  }

  // --- generateContentInternal (non-streaming) ---
  proto["generateContentInternal"] = async function patched(
    this: unknown,
    params: Record<string, unknown>,
  ) {
    const start = performance.now();
    const response = (await originalGenerate.call(this, params)) as Record<string, unknown>;
    calls.push({
      method: "generateContent",
      request: params,
      response,
      durationMs: performance.now() - start,
      streamed: false,
    });
    return response;
  };

  // --- embedContentInternal ---
  proto["embedContentInternal"] = async function patched(
    this: unknown,
    params: Record<string, unknown>,
  ) {
    const start = performance.now();
    const response = (await originalEmbed.call(this, params)) as Record<string, unknown>;
    calls.push({
      method: "embedContent",
      request: params,
      response,
      durationMs: performance.now() - start,
      streamed: false,
    });
    return response;
  };

  // --- generateContentStreamInternal (streaming) ---
  // The Internal method returns a Promise<AsyncGenerator>. Wrap the generator
  // to capture each chunk + assemble a final response when iteration completes.
  proto["generateContentStreamInternal"] = async function patched(
    this: unknown,
    params: Record<string, unknown>,
  ) {
    const start = performance.now();
    const sourceIterable = await originalStream.call(this, params);

    let resolveCapture!: () => void;
    const capturePromise = new Promise<void>((r) => {
      resolveCapture = r;
    });
    pendingCaptures.push(capturePromise);

    async function* wrapped(): AsyncGenerator<Record<string, unknown>> {
      const chunks: Record<string, unknown>[] = [];
      try {
        for await (const chunk of sourceIterable) {
          chunks.push(chunk);
          if (onStreamEvent) {
            try { onStreamEvent(chunk); } catch { /* never crash user code */ }
          }
          yield chunk;
        }
      } finally {
        // Always capture on exhaustion — even if user broke early.
        const assembled = assembleFromChunks(chunks);
        calls.push({
          method: "generateContentStream",
          request: params,
          response: assembled,
          durationMs: performance.now() - start,
          streamed: true,
        });
        resolveCapture();
      }
    }

    return wrapped();
  };

  return () => {
    proto["generateContentInternal"] = originalGenerate;
    proto["generateContentStreamInternal"] = originalStream;
    proto["embedContentInternal"] = originalEmbed;
  };
}

/**
 * Assembles a synthetic `GenerateContentResponse` from accumulated streaming
 * chunks so tests/cost estimation see the same shape as non-streaming calls.
 *
 * Concatenates `text` parts across all chunks into a single candidate, and
 * uses the LATEST chunk's `usageMetadata` (Gemini reports cumulative usage
 * in the final chunk).
 */
function assembleFromChunks(
  chunks: Record<string, unknown>[],
): Record<string, unknown> {
  if (chunks.length === 0) {
    return { candidates: [], usageMetadata: {} };
  }

  const parts: { text: string }[] = [];
  let finishReason: string | undefined;
  let usageMetadata: GeminiUsageMetadata = {};
  let modelVersion: string | undefined;

  for (const chunk of chunks) {
    const candidates = chunk["candidates"] as unknown[] | undefined;
    if (Array.isArray(candidates) && candidates.length > 0) {
      const first = candidates[0] as Record<string, unknown>;
      const content = first["content"] as { parts?: Array<{ text?: string }> } | undefined;
      if (content?.parts) {
        for (const part of content.parts) {
          if (typeof part.text === "string" && part.text.length > 0) {
            parts.push({ text: part.text });
          }
        }
      }
      if (typeof first["finishReason"] === "string") {
        finishReason = first["finishReason"] as string;
      }
    }
    if (chunk["usageMetadata"] && typeof chunk["usageMetadata"] === "object") {
      usageMetadata = chunk["usageMetadata"] as GeminiUsageMetadata;
    }
    if (typeof chunk["modelVersion"] === "string") {
      modelVersion = chunk["modelVersion"] as string;
    }
  }

  const assembled: Record<string, unknown> = {
    candidates: [
      {
        content: { parts, role: "model" },
        ...(finishReason !== undefined ? { finishReason } : {}),
      },
    ],
    usageMetadata,
  };
  if (modelVersion !== undefined) {
    assembled["modelVersion"] = modelVersion;
  }
  return assembled;
}
