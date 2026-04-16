# Exercise 02 — Parameters: deterministic vs creative

## Concept

The parameters you pass to `messages.create` are not cosmetic — **they change the model's behavior** in ways you have to control depending on your use case.

The three that matter from day one:

1. **`temperature`** (0.0 to 1.0) — controls randomness of token sampling.
   - `0` → **deterministic**. Same input, same (or nearly same) output. What you want for structured extraction, parsing, classification, or any task where the answer is "right or wrong".
   - `0.7 - 1.0` → **creative**. Output varies between runs. What you want for brainstorming, marketing copy, content variations.
   - `0.3 - 0.6` → gray zone. Avoid it until you know WHY.

2. **`top_p`** (0.0 to 1.0) — alternative sampling (nucleus sampling). **Use ONE of the two**: temperature OR top_p, not both. The v1 convention is to use `temperature` — it's more intuitive.

3. **`max_tokens`** — hard limit on output tokens. You used it in exercise 01, but here treat it as **defense against runaway cost**. A buggy loop could make the model generate thousands of tokens; `max_tokens` covers you.

**The important point**: there is no universal "correct value". There's the correct value FOR YOUR USE CASE. The same model with temp=0 is an extraction machine; with temp=0.9 it's a brainstorm partner. Same code, different product.

## Docs & references

1. **Messages API reference** — all params (`temperature`, `top_p`, `top_k`, `stop_sequences`, `system`, etc.):
   → https://docs.claude.com/en/api/messages
2. **SDK README (TypeScript)** — how to pass multiple params to the call:
   → https://github.com/anthropics/anthropic-sdk-typescript
3. **Models overview** — each model has its own `max_tokens` ceiling:
   → https://docs.claude.com/en/docs/about-claude/models/overview

> Tip: the SDK ships TS types. Hover over the object you pass to `messages.create` — you'll see every optional param typed.

## Your task

Open `starter.ts`. There's a `run` function that must make **TWO calls** to Claude Haiku:

1. **Deterministic call**: `temperature: 0`. Message: ask the model to extract structured information (e.g. "extract the name and email from the following text: 'My name is Juan and my email is juan@example.com'").

2. **Creative call**: `temperature >= 0.7`. Message: ask for something that requires creativity (e.g. "Write 3 creative titles for an article about artificial intelligence").

Both calls must:
- Use a Haiku model (see "Model IDs" in docs).
- Pass a reasonable `max_tokens` (≤ 300).

Return an object `{ deterministic, creative }` with both responses.

## How to verify

```bash
# From code/, with ANTHROPIC_API_KEY configured:
aidev verify 02-params
```

The tests check:
- You made exactly TWO API calls.
- At least one call has `temperature === 0` (deterministic).
- At least one call has `temperature >= 0.7` (creative).
- Both used a Claude Haiku model.
- Both passed `max_tokens` between 1 and 500.
- Each call has a `user` message with non-empty content.
- Both responses came back with at least one text block.

## Extra concept (optional)

Once tests pass, try running the exercise **twice in a row** and compare the responses:

- The `deterministic` should be equal or near-identical across runs.
- The `creative` should vary.

That's `temperature` in action. It's not magic — the model is literally sampling differently from the probability distribution.

Bonus: look at the `usage` object of each call. Which one cost more? Why? (Hint: it's not the temperature.)
