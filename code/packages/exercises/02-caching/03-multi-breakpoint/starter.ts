// Docs:
//   Prompt caching guide: https://docs.claude.com/en/docs/build-with-claude/prompt-caching
//   Cache breakpoints: https://docs.claude.com/en/docs/build-with-claude/prompt-caching#cache-limitations-and-considerations
//   Tool use guide: https://docs.claude.com/en/docs/build-with-claude/tool-use

import Anthropic from "@anthropic-ai/sdk";
import { LONG_SYSTEM_PROMPT } from "../fixtures/long-system-prompt.ts";

const client = new Anthropic();

/**
 * Exercise 03-multi-breakpoint
 *
 * Task: place cache_control on THREE distinct locations:
 *   Breakpoint 1 — system block (LONG_SYSTEM_PROMPT)
 *   Breakpoint 2 — last tool definition in the tools array
 *   Breakpoint 3 — an assistant message content block in the history
 *
 * IMPORTANT: Claude supports a maximum of 4 cache breakpoints per request.
 * Never place more than 4 cache_control markers in a single request.
 *
 * Steps:
 * 1. Define at least 2 tools; add cache_control: { type: "ephemeral" } to the LAST tool.
 * 2. Use LONG_SYSTEM_PROMPT as a cached system block (breakpoint 1).
 * 3. Make call 1 (warmup) — no assistant history yet.
 * 4. Make call 2 with the same system + tools. Include the previous assistant
 *    response in messages with cache_control on its last content block (breakpoint 3).
 * 5. Return both responses.
 */
export default async function run() {
  // TODO: implement multi-breakpoint caching
  throw new Error("TODO: implement run()");
}
