/**
 * Render module for the `aidev run` command.
 *
 * Converts HarnessResult + Exercise metadata into a human-readable string
 * for display in the terminal. All user-facing strings go through t().
 */

import type { HarnessResult } from "@aidev/runner";
import type { Exercise } from "./exercises.ts";

/**
 * Structural alias for Anthropic SDK Message — keeps CLI package free of a
 * direct `@anthropic-ai/sdk` dependency while remaining compatible at runtime.
 */
interface SdkMessage {
  id: string;
  type: "message";
  role: "assistant";
  content: Array<{ type: string; [key: string]: unknown }>;
  model: string;
  stop_reason: string | null;
  stop_sequence: string | null;
  usage: { input_tokens: number; output_tokens: number };
}
import { t } from "./i18n/index.ts";
import { estimateCost, MODEL_PRICES } from "./cost.ts";

/**
 * Structural alias for OpenAI ChatCompletion — keeps CLI package free of a
 * direct `openai` dependency while remaining compatible at runtime.
 */
interface SdkChatCompletion {
  id: string;
  object: "chat.completion";
  choices: Array<{
    index: number;
    message: {
      role: "assistant";
      content: string | null;
    };
    finish_reason: string | null;
  }>;
  model: string;
  usage: { prompt_tokens: number; completion_tokens: number };
}

export function isChatCompletion(v: unknown): v is SdkChatCompletion {
  return (
    typeof v === "object" &&
    v !== null &&
    "object" in v &&
    (v as Record<string, unknown>)["object"] === "chat.completion" &&
    "choices" in v &&
    Array.isArray((v as Record<string, unknown>)["choices"])
  );
}

export function extractTextFromCompletion(msg: SdkChatCompletion): string {
  return msg.choices
    .map((c) => c.message.content ?? "")
    .filter(Boolean)
    .join("\n");
}

/**
 * Structural alias for a Gemini `GenerateContentResponse` — keeps CLI package
 * free of a direct `@google/genai` dependency while staying compatible.
 */
interface SdkGeminiResponse {
  candidates: Array<{
    content: { parts: Array<{ text?: string }>; role?: string };
    finishReason?: string;
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
    cachedContentTokenCount?: number;
    thoughtsTokenCount?: number;
  };
  modelVersion?: string;
}

export function isGeminiResponse(v: unknown): v is SdkGeminiResponse {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  // Distinguishing shape: `candidates` array whose entries have `content.parts`
  // (Anthropic uses `content` as an array of blocks, OpenAI uses `choices`).
  if (!Array.isArray(o["candidates"])) return false;
  const first = (o["candidates"] as unknown[])[0];
  if (!first || typeof first !== "object") return false;
  const content = (first as Record<string, unknown>)["content"];
  if (!content || typeof content !== "object") return false;
  return Array.isArray((content as Record<string, unknown>)["parts"]);
}

export function extractTextFromGemini(resp: SdkGeminiResponse): string {
  return resp.candidates
    .flatMap((c) => c.content.parts.map((p) => p.text ?? ""))
    .filter(Boolean)
    .join("");
}

export interface RenderOptions {
  full: boolean;
  target: "starter" | "solution";
}

/** Maximum number of visible characters before truncation kicks in. */
export const MAX_CHARS = 2000;

/**
 * Truncates a string to MAX_CHARS visible characters, appending a localized
 * indicator. Pass `full=true` to disable truncation entirely.
 */
export function truncate(s: string, full: boolean): string {
  if (full || s.length <= MAX_CHARS) return s;
  const cut = s.length - MAX_CHARS;
  return s.slice(0, MAX_CHARS) + "\n" + t("run.truncated", { n: String(cut) });
}

/**
 * Returns true if `v` looks like an Anthropic SDK Message object
 * (has `id: string` + `content: Array`).
 */
export function isMessage(v: unknown): v is SdkMessage {
  return (
    typeof v === "object" &&
    v !== null &&
    "id" in v &&
    typeof (v as Record<string, unknown>)["id"] === "string" &&
    "content" in v &&
    Array.isArray((v as Record<string, unknown>)["content"])
  );
}

/**
 * Extracts the text content from a Message's content blocks.
 * Multiple text blocks are joined with newlines; non-text blocks are ignored.
 */
export function extractText(msg: SdkMessage): string {
  return msg.content
    .filter((b) => b["type"] === "text")
    .map((b) => String(b["text"] ?? ""))
    .join("\n");
}

/**
 * Renders an exercise return value into a human-readable string.
 *
 * Shape detection order:
 * 1. `isMessage(v)` → extract text
 * 2. Plain object (not array, not null, not Message) → per-key labeled rendering
 * 3. Fallback → JSON.stringify under run.return_value_label
 */
export function renderReturn(value: unknown, full: boolean): string {
  if (isMessage(value)) {
    return truncate(extractText(value), full);
  }
  if (isChatCompletion(value)) {
    return truncate(extractTextFromCompletion(value), full);
  }
  if (isGeminiResponse(value)) {
    return truncate(extractTextFromGemini(value), full);
  }

  if (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    const entries = Object.entries(value as Record<string, unknown>);
    return entries
      .map(([k, v]) => {
        if (isMessage(v)) {
          return `--- ${k} ---\n${truncate(extractText(v), full)}`;
        }
        if (isGeminiResponse(v)) {
          return `--- ${k} ---\n${truncate(extractTextFromGemini(v), full)}`;
        }
        if (
          typeof v === "string" ||
          typeof v === "number" ||
          typeof v === "boolean"
        ) {
          return `${k}: ${String(v)}`;
        }
        return `--- ${k} ---\n${truncate(JSON.stringify(v, null, 2), full)}`;
      })
      .join("\n\n");
  }

  // Fallback: primitive, array, or anything else
  return `${t("run.return_value_label")}: ${truncate(JSON.stringify(value, null, 2), full)}`;
}

/**
 * Builds the full summary string for `aidev run` output.
 *
 * Composes: title, model, tokens, cost, duration, then the return value.
 */
export function renderSummary(
  result: HarnessResult,
  exercise: Exercise,
  opts: RenderOptions,
): string {
  const lines: string[] = [];

  // Title
  lines.push(t("run.title", { id: exercise.meta.id, target: opts.target }));
  lines.push("");

  const call = result.lastCall;

  // Model — Anthropic/OpenAI expose `model`, Gemini exposes `modelVersion`.
  const callResp = call?.response as unknown as Record<string, unknown> | undefined;
  const model = (callResp?.["model"] as string | undefined) ?? (callResp?.["modelVersion"] as string | undefined) ?? "unknown";
  lines.push(t("run.summary.model", { model }));

  // Tokens — handle all three shapes:
  //   Anthropic: input_tokens / output_tokens (top-level on response.usage)
  //   OpenAI:    prompt_tokens / completion_tokens (on response.usage)
  //   Gemini:    promptTokenCount / candidatesTokenCount (on response.usageMetadata)
  if (call) {
    const usage = (call.response.usage as unknown as Record<string, number>) ?? {};
    const geminiUsage = (callResp?.["usageMetadata"] as Record<string, number> | undefined) ?? {};
    const input =
      usage["input_tokens"] ?? usage["prompt_tokens"] ?? geminiUsage["promptTokenCount"] ?? 0;
    const output =
      usage["output_tokens"] ?? usage["completion_tokens"] ?? geminiUsage["candidatesTokenCount"] ?? 0;
    lines.push(
      t("run.summary.tokens", {
        input: String(input),
        output: String(output),
      }),
    );
  }

  // Cost — resolution order: hint > computed > unknown
  const hint = exercise.meta.model_cost_hint;
  if (hint) {
    lines.push(t("run.summary.cost", { cost: hint }));
  } else if (call) {
    const computed = estimateCost(model, call.response.usage);
    if (computed !== null) {
      lines.push(
        t("run.summary.cost", {
          cost: `${computed} (est, prices ${MODEL_PRICES.lastUpdated})`,
        }),
      );
    } else {
      lines.push(t("run.summary.cost", { cost: t("run.cost_unknown") }));
    }
  }

  // Duration (sum across all calls)
  const totalMs = result.calls.reduce((acc, c) => acc + c.durationMs, 0);
  lines.push(t("run.summary.duration", { ms: String(Math.round(totalMs)) }));

  lines.push("");

  // Return value
  lines.push(renderReturn(result.userReturn, opts.full));

  return lines.join("\n");
}
