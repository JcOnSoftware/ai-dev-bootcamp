// Docs:
//   Prompt caching guide: https://docs.claude.com/en/docs/build-with-claude/prompt-caching
//   Extended TTL (1h): https://docs.claude.com/en/docs/build-with-claude/prompt-caching#extended-cache-ttl
//   Cache pricing: https://docs.claude.com/en/docs/build-with-claude/prompt-caching#pricing

import Anthropic from "@anthropic-ai/sdk";
import { LONG_SYSTEM_PROMPT } from "../fixtures/long-system-prompt.ts";

const client = new Anthropic();

const MODEL = "claude-haiku-4-5-20251001";

/**
 * Calculate the minimum number of cache reads needed for the 1-hour TTL
 * to be cheaper than repeatedly writing with the default 5-minute TTL.
 *
 * Formula derivation:
 *   cost_1h(N reads) = write1h_cost + N * read_cost
 *   cost_5m(N reads) = N * write5m_cost  (assuming each read also re-writes at 5m TTL)
 *
 *   Break-even: write1h + N*read < N*write5m
 *   => write1h < N*(write5m - read)
 *   => N > write1h / (write5m - read)
 *
 *   With per-token costs (price cancels out since it's a multiplier on both sides):
 *     write1h  = 2.0 × P
 *     write5m  = 1.25 × P
 *     read     = 0.1 × P
 *
 *   N > 2.0 / (1.25 - 0.1) = 2.0 / 1.15 ≈ 1.739
 *   result = Math.ceil(1.739) = 2
 *
 * Note: The exact break-even depends on whether you're comparing:
 *   A) 1h write + N reads  vs  N × (5m write + read)  => N > 2.0/1.15 ≈ 1.74 → 2
 *   B) 1h write overhead  vs  savings from read       => N > 0.75/1.15 ≈ 0.65 → 1
 *
 * We use formula A (full cost comparison) as it is more accurate in practice.
 *
 * @param cacheTokens - Number of tokens being cached (scales both sides equally).
 * @param pricePerMillion - Input price per 1M tokens in USD (scales both sides equally).
 * @returns Minimum integer reads needed for 1h TTL to break even vs 5m TTL.
 */
export function breakEvenCalls(_cacheTokens: number, _pricePerMillion: number): number {
  // Multipliers (relative to input price):
  const write1h = 2.0;
  const write5m = 1.25;
  const read = 0.1;

  // N > write1h / (write5m - read)
  // Note: cacheTokens and pricePerMillion cancel out (both sides of the inequality
  // are multiplied by the same factor), so we don't actually need them.
  const n = write1h / (write5m - read);
  return Math.ceil(n);
}

/**
 * Solution: Two calls using cache_control: { type: "ephemeral", ttl: "1h" }.
 *
 * The 1h TTL costs 2.0x the input price on write (vs 1.25x for default 5m).
 * It's worth it when the cache will be read more than breakEvenCalls() times
 * within the hour — in this case, after 2 reads the premium is paid off.
 */
export default async function run() {
  // Log the break-even calculation for educational visibility.
  const minReads = breakEvenCalls(4200, 1.0);
  console.log(
    `Break-even: ${minReads} read(s) needed for 1h TTL to be cheaper than 5m TTL.`,
  );

  // System block with 1-hour TTL.
  const systemBlock: Anthropic.TextBlockParam & {
    cache_control: { type: "ephemeral"; ttl: "1h" };
  } = {
    type: "text",
    text: LONG_SYSTEM_PROMPT,
    cache_control: { type: "ephemeral", ttl: "1h" },
  };

  const userMessage = "What are the key differences between offset and cursor-based pagination in REST APIs?";

  // Call 1: writes the 1h cache (cache_creation_input_tokens > 0)
  const response1 = await client.messages.create({
    model: MODEL,
    max_tokens: 256,
    system: [systemBlock],
    messages: [{ role: "user", content: userMessage }],
  });

  console.log("Call 1 usage:", response1.usage);

  // Call 2: reads from the 1h cache (cache_read_input_tokens > 0)
  const response2 = await client.messages.create({
    model: MODEL,
    max_tokens: 256,
    system: [systemBlock],
    messages: [{ role: "user", content: userMessage }],
  });

  console.log("Call 2 usage:", response2.usage);

  return { call1: response1, call2: response2 };
}
