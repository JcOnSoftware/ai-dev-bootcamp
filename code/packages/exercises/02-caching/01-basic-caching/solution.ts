// Docs:
//   Prompt caching guide: https://docs.claude.com/en/docs/build-with-claude/prompt-caching
//   Messages API reference: https://docs.claude.com/en/api/messages
//   cache_control parameter: https://docs.claude.com/en/docs/build-with-claude/prompt-caching#how-to-implement-prompt-caching

import Anthropic from "@anthropic-ai/sdk";
import { LONG_SYSTEM_PROMPT } from "../fixtures/long-system-prompt.ts";

const client = new Anthropic();

/**
 * Solution: Two sequential API calls sharing a cached system prompt.
 *
 * The LONG_SYSTEM_PROMPT (~22k chars, >4096 tokens) is marked with
 * cache_control: { type: "ephemeral" }. Haiku 4.5 requires a minimum of
 * 4,096 tokens to activate prompt caching.
 *
 * Call 1: cache MISS (writes cache) → cache_creation_input_tokens > 0
 * Call 2: cache HIT (reads cache)   → cache_read_input_tokens > 0
 */
export default async function run() {
  // The system block is identical for both calls — this is what the cache key is based on.
  const systemBlock: Anthropic.TextBlockParam & {
    cache_control: { type: "ephemeral" };
  } = {
    type: "text",
    text: LONG_SYSTEM_PROMPT,
    cache_control: { type: "ephemeral" },
  };

  const userMessage = "Briefly summarize the key principles of REST API versioning.";

  // Call 1: writes the cache (cache_creation_input_tokens > 0)
  const response1 = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    system: [systemBlock],
    messages: [{ role: "user", content: userMessage }],
  });

  // Call 2: reads from cache (cache_read_input_tokens > 0)
  const response2 = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    system: [systemBlock],
    messages: [{ role: "user", content: userMessage }],
  });

  return { call1: response1, call2: response2 };
}
