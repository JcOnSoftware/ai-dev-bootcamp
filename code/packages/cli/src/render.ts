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

  // Model
  const model = call?.response.model ?? "unknown";
  lines.push(t("run.summary.model", { model }));

  // Tokens
  if (call) {
    const { input_tokens, output_tokens } = call.response.usage;
    lines.push(
      t("run.summary.tokens", {
        input: String(input_tokens),
        output: String(output_tokens),
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
