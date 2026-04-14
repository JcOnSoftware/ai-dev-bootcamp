# Exercise 04 — Tokens and cost: read usage, compute USD

## Concept

You come from APIs where you pay **per request**. With LLMs, no. You pay **per token** — and input and output tokens have different rates.

Every SDK response includes a `usage` object:

```ts
response.usage = {
  input_tokens: 42,       // what you sent (prompt + system)
  output_tokens: 128,     // what the model generated
  cache_creation_input_tokens: 0,   // appears with prompt caching
  cache_read_input_tokens: 0,       // same
}
```

For now we focus on the first two. `cache_*` is its own topic (you'll see it in a future exercise).

**The formula** is plain arithmetic, but it's the foundation of everything that comes next (optimization, budget alerts, billing):

```
costUsd = (input_tokens  / 1_000_000) * pricePerMillionIn
        + (output_tokens / 1_000_000) * pricePerMillionOut
```

Note the `1_000_000`. Prices are always expressed **per million tokens** — a universal industry convention. It's the same unit you see when you google "claude haiku pricing".

**Claude Haiku 4.5 rates** (what you'll use in this exercise):
- Input:  **$1 per million** tokens
- Output: **$5 per million** tokens

That's **5x more expensive to generate than to read**. That's not trivia — it shapes design decisions. A long prompt with a short response is MUCH cheaper than the inverse.

**Why you care:**

- **Budget alerts**: before merging a feature that calls the model, calculate what it'll cost at real scale. A feature that costs $0.001 per request × 100k requests/day = $100/day = $3000/month. Did you know before shipping?
- **Right model**: Haiku costs 5-15x less than Sonnet/Opus. If your task doesn't need complex reasoning, paying for Opus is money down the drain.
- **Prompt engineering has a price**: every extra word in your prompt you pay for. Every time. That's why prompt caching exists.

## Docs & references

1. **Models overview** — current price table by model (Opus 4.6, Sonnet 4.6, Haiku 4.5, and legacy):
   → https://platform.claude.com/docs/en/docs/about-claude/models/overview
2. **Messages API reference** — full `usage` object structure:
   → https://platform.claude.com/docs/en/api/messages
3. **Pricing page** — full detail with batch API discounts and cache rates:
   → https://platform.claude.com/docs/en/about-claude/pricing

> Tip: prices change. The exercise's values are fixed so tests stay stable, but in production **never hardcode prices** without a review date — it will age.

## Your task

Open `starter.ts`. There's a `run` function that must:

1. Create an Anthropic client.
2. Call **Claude Haiku 4.5** asking for something of reasonable length (e.g. "Explain in 3 sentences what a Large Language Model is"). Use `max_tokens` ≤ 300.
3. Read `response.usage.input_tokens` and `response.usage.output_tokens`.
4. Compute USD cost with this formula:
   ```
   costUsd = (input_tokens / 1_000_000) * 1    // $1 per MTok input
           + (output_tokens / 1_000_000) * 5   // $5 per MTok output
   ```
5. Return `{ response, costUsd }`.

## How to verify

```bash
# From code/:
aidev verify 04-tokens-cost

# You can also run it in playground mode to SEE the result:
aidev run 04-tokens-cost --solution
```

Tests check:
- You made exactly ONE API call.
- You used a Claude Haiku model.
- `usage` has `input_tokens > 0` and `output_tokens > 0`.
- Your `costUsd` is a positive `number`.
- Your `costUsd` matches (within floating-point tolerance) the value computed from the real response tokens and Haiku 4.5 rates (input $1/MTok, output $5/MTok).

## Extra concept (optional)

After the tests pass, try:

1. Change the model to **Sonnet** (`claude-sonnet-4-6`). Rates change to $3 input / $15 output. How much more expensive is the same prompt?
2. Change the prompt to something MUCH longer (a 500-word system prompt, for example). Watch `input_tokens` grow — and the cost with them.
3. Think: if you had an app making 1M of these calls per month, which model would you pick? What would you change in the prompt? That intuition is what separates a dev who USES the API from one who USES it WELL.
