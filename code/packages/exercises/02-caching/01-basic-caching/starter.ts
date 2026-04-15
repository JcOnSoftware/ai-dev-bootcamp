// Docs:
//   Prompt caching guide: https://docs.claude.com/en/docs/build-with-claude/prompt-caching
//   Messages API reference: https://docs.claude.com/en/api/messages
//   cache_control parameter: https://docs.claude.com/en/docs/build-with-claude/prompt-caching#how-to-implement-prompt-caching

import Anthropic from "@anthropic-ai/sdk";
import { LONG_SYSTEM_PROMPT } from "../fixtures/long-system-prompt.ts";

const client = new Anthropic();

/**
 * Exercise 01-basic-caching
 *
 * Task: Make two sequential messages.create calls, both using the
 * LONG_SYSTEM_PROMPT as a cached system block. The first call should
 * create the cache; the second should read from it.
 *
 * Steps:
 * 1. Build a system array with a single text block that includes
 *    cache_control: { type: "ephemeral" }.
 * 2. Make call 1 — this writes the cache (cache_creation_input_tokens > 0).
 * 3. Make call 2 with the same system — this reads the cache (cache_read_input_tokens > 0).
 * 4. Return both responses (the harness captures them via result.calls).
 */
export default async function run() {
  // TODO: implement the two-call caching exercise
  throw new Error("TODO: implement run()");
}
