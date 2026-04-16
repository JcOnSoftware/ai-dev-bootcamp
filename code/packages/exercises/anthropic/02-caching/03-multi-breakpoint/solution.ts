// Docs:
//   Prompt caching guide: https://docs.claude.com/en/docs/build-with-claude/prompt-caching
//   Cache breakpoints: https://docs.claude.com/en/docs/build-with-claude/prompt-caching#cache-limitations-and-considerations
//   Tool use guide: https://docs.claude.com/en/docs/build-with-claude/tool-use

import Anthropic from "@anthropic-ai/sdk";
import { LONG_SYSTEM_PROMPT } from "../fixtures/long-system-prompt.ts";

const client = new Anthropic();

const MODEL = "claude-haiku-4-5-20251001";

// ── Tool definitions ──────────────────────────────────────────────────────────
// Two tools. cache_control goes on the LAST tool (breakpoint 2).
// This caches the entire prefix up to and including the last tool.
const tools: (Anthropic.Tool & { cache_control?: { type: "ephemeral" } })[] = [
  {
    name: "get_http_status",
    description: "Returns the meaning and typical use case for an HTTP status code.",
    input_schema: {
      type: "object" as const,
      properties: {
        code: { type: "number", description: "HTTP status code, e.g. 404" },
      },
      required: ["code"],
    },
  },
  {
    name: "get_rest_principle",
    description: "Explains a named REST architectural principle.",
    input_schema: {
      type: "object" as const,
      properties: {
        principle: {
          type: "string",
          description: "Name of the REST principle, e.g. 'statelessness'",
        },
      },
      required: ["principle"],
    },
    // Breakpoint 2: cache system + all tools up to here.
    cache_control: { type: "ephemeral" },
  },
];

// ── System block (breakpoint 1) ───────────────────────────────────────────────
const systemBlock: Anthropic.TextBlockParam & {
  cache_control: { type: "ephemeral" };
} = {
  type: "text",
  text: LONG_SYSTEM_PROMPT,
  cache_control: { type: "ephemeral" },
};

/**
 * Solution: Three cache breakpoints in one request.
 *
 *   BP 1 — system block (LONG_SYSTEM_PROMPT)
 *   BP 2 — last tool definition (get_rest_principle)
 *   BP 3 — prior assistant turn cached in message history
 *
 * NOTE: Claude supports a maximum of 4 cache breakpoints per request.
 * Adding a 5th cache_control marker silently drops the oldest breakpoint.
 * Always keep the count at or below 4.
 */
export default async function run() {
  const userQuestion = "Explain the statelessness constraint in REST. Be concise.";

  // ── Call 1: warmup — no cached history yet ────────────────────────────────
  const response1 = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: [systemBlock],
    tools: tools as Anthropic.Tool[],
    messages: [{ role: "user", content: userQuestion }],
  });

  // ── Call 2: second turn — add cached assistant history ────────────────────
  // BP 3: cache the prior assistant response in message history.
  // We add cache_control to the last content block of the assistant message.
  const assistantContent: (Anthropic.ContentBlock & {
    cache_control?: { type: "ephemeral" };
  })[] = response1.content.map((block, index) => ({
    ...block,
    // Only mark the LAST block of the assistant turn.
    ...(index === response1.content.length - 1
      ? { cache_control: { type: "ephemeral" } }
      : {}),
  }));

  // If the first response used tools, we must provide tool_result blocks before
  // continuing the conversation. Build a user message with tool results.
  const toolUseBlocks = response1.content.filter(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
  );

  // Build the next user message: tool results (if any) + the follow-up question.
  const nextUserContent: Anthropic.MessageParam["content"] = [
    ...toolUseBlocks.map(
      (b): Anthropic.ToolResultBlockParam => ({
        type: "tool_result",
        tool_use_id: b.id,
        content: `Result for ${b.name}: (simulated response for caching demo)`,
      })
    ),
    { type: "text", text: "Now explain the uniform interface constraint." },
  ];

  const response2 = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: [systemBlock],
    tools: tools as Anthropic.Tool[],
    messages: [
      { role: "user", content: userQuestion },
      { role: "assistant", content: assistantContent },
      { role: "user", content: nextUserContent },
    ],
  });

  return { call1: response1, call2: response2 };
}
