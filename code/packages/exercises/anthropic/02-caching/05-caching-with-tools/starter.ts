// Docs:
//   Prompt caching guide: https://docs.claude.com/en/docs/build-with-claude/prompt-caching
//   Tool use guide: https://docs.claude.com/en/docs/build-with-claude/tool-use
//   Multi-turn conversations: https://docs.claude.com/en/docs/build-with-claude/tool-use#handling-tool-use-and-tool-results

import Anthropic from "@anthropic-ai/sdk";
import { LONG_SYSTEM_PROMPT } from "../fixtures/long-system-prompt.ts";

const client = new Anthropic();

/**
 * Exercise 05-caching-with-tools
 *
 * Task: combine prompt caching with tool use in a 2-turn conversation.
 *
 * Steps:
 * 1. Define at least 1 tool. Add cache_control: { type: "ephemeral" } to the LAST tool (breakpoint 2).
 * 2. Use LONG_SYSTEM_PROMPT as a cached system block (breakpoint 1).
 * 3. Turn 1: send a user message that encourages tool use. Claude responds with tool_use block.
 * 4. Turn 2: send tool_result + next user message. The second call should read from cache.
 * 5. Return both responses.
 *
 * Key insight: the system + tools cache is reused across turns — the second call
 * doesn't re-process LONG_SYSTEM_PROMPT or the tool definitions.
 */
export default async function run() {
  // TODO: implement caching with tools
  throw new Error("TODO: implement run()");
}
