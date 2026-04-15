// Docs:
//   Prompt caching guide: https://docs.claude.com/en/docs/build-with-claude/prompt-caching
//   Tool use guide: https://docs.claude.com/en/docs/build-with-claude/tool-use
//   Multi-turn conversations: https://docs.claude.com/en/docs/build-with-claude/tool-use#handling-tool-use-and-tool-results

import Anthropic from "@anthropic-ai/sdk";
import { LONG_SYSTEM_PROMPT } from "../fixtures/long-system-prompt.ts";

const client = new Anthropic();

const MODEL = "claude-haiku-4-5-20251001";

// ── Tool definitions ──────────────────────────────────────────────────────────
// cache_control goes on the LAST tool (breakpoint 2).
// This caches system + tools together as a single prefix.
const tools: (Anthropic.Tool & { cache_control?: { type: "ephemeral" } })[] = [
  {
    name: "lookup_rest_concept",
    description:
      "Look up a REST API concept from the reference guide and return a concise explanation. " +
      "Use this whenever the user asks about a REST API concept, HTTP method, status code, or design pattern.",
    input_schema: {
      type: "object" as const,
      properties: {
        concept: {
          type: "string",
          description:
            "The REST API concept to look up, e.g. 'idempotency', 'HATEOAS', 'ETags', 'OAuth scopes'",
        },
      },
      required: ["concept"],
    },
    // Breakpoint 2: cache system prompt + this tool definition.
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
 * Solution: 2-turn tool-use conversation with cached system + tools.
 *
 * Turn 1: user asks about a REST concept → Claude uses lookup_rest_concept tool
 * Turn 2: tool result + follow-up → Claude reads cached system+tools (cache_read > 0)
 *
 * The system block and tools are cached after turn 1.
 * Turn 2 reuses the cache — only the message history (new turn) is newly processed.
 */
export default async function run() {
  // ── Turn 1: prompt Claude to use the lookup tool ──────────────────────────
  const response1 = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: [systemBlock],
    tools: tools as Anthropic.Tool[],
    // tool_choice: auto forces Claude to use a tool when available and relevant.
    tool_choice: { type: "any" },
    messages: [
      {
        role: "user",
        content: "Use the lookup_rest_concept tool to look up 'idempotency' for me.",
      },
    ],
  });

  // ── Extract tool_use block ────────────────────────────────────────────────
  const toolUseBlocks = response1.content.filter(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
  );

  if (toolUseBlocks.length === 0) {
    throw new Error(
      "Expected Claude to use a tool on turn 1 but got no tool_use blocks. " +
        "Response content: " + JSON.stringify(response1.content),
    );
  }

  const toolUse = toolUseBlocks[0]!;

  // ── Simulate tool execution ───────────────────────────────────────────────
  const toolResult =
    "Idempotency means that performing an operation multiple times produces the same " +
    "result as performing it once. In REST, PUT and DELETE are idempotent; POST is not. " +
    "Idempotency keys allow POST requests to be safely retried by clients.";

  // ── Turn 2: provide tool result + follow-up question ─────────────────────
  // The second call reuses the cached system + tools (cache_read_input_tokens > 0).
  const response2 = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: [systemBlock],
    tools: tools as Anthropic.Tool[],
    messages: [
      {
        role: "user",
        content: "Use the lookup_rest_concept tool to look up 'idempotency' for me.",
      },
      {
        role: "assistant",
        content: response1.content,
      },
      {
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: toolUse.id,
            content: toolResult,
          },
          {
            type: "text",
            text: "Great! Now use the tool to look up 'statelessness' as well.",
          },
        ],
      },
    ],
  });

  return { call1: response1, call2: response2 };
}
