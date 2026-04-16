# Exercise 01 — Prompt evaluation with LLM-as-judge

## Concept

Before shipping a prompt to production, you need to know if it produces good-quality outputs. The problem: how do you measure "good quality" in an automated way? A widely used technique is **LLM-as-judge**: you use a second model to evaluate the output of the first.

The idea is simple but powerful. The first LLM answers your real question. The second acts as an impartial judge: it reads the response and scores it according to criteria you define (clarity, accuracy, tone, etc.). That score can be saved, graphed, and compared across prompt versions.

This is the foundation of production evaluation systems. Companies like Anthropic, OpenAI, and Google use variants of this pattern internally. When a team says "we improved the model by 8% on our internal benchmark", they're using exactly this.

The important thing is that the judge is also an LLM, so its outputs are non-deterministic. That's why you should ask for structured JSON: it gives you a numeric score you can compare, not just free text.

## Docs & references

1. [Chat Completions API](https://platform.openai.com/docs/api-reference/chat/create) — full reference for the endpoint you'll use for both calls.
2. [Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs) — how to force the model to return valid JSON using `response_format: { type: "json_schema" }`.
3. [OpenAI Node SDK](https://github.com/openai/openai-node) — SDK README, installation, and basic examples.

## Your task

Implement the `run()` function in `starter.ts` following these steps:

1. Create an OpenAI client with `new OpenAI()`.
2. **Call 1 — the subject**: ask the model to explain recursion to a 5-year-old.
   - `model`: `"gpt-4.1-nano"`, `max_completion_tokens`: `300`
   - Save the response text: `response.choices[0].message.content`
3. **Call 2 — the judge**: ask the same model to evaluate the previous response.
   - `model`: `"gpt-4.1-nano"`, `max_completion_tokens`: `256`
   - System message: `"Rate the following explanation on a scale of 1-5 for clarity and simplicity. Respond with JSON: {\"score\": <number 1-5>, \"reasoning\": <string>}"`
   - User message: the text from call 1
   - Use `response_format: { type: "json_schema" }` with a schema that has `score` (number) and `reasoning` (string), both required, `strict: true`.
4. Parse the JSON from call 2 with `JSON.parse(...)`.
5. Return `{ output, score, reasoning }`.

## How to verify

```bash
aidev verify 01-prompt-evaluation
```

The tests check that:

- Exactly **2 API calls** were made.
- The second call uses `response_format` with `type: "json_schema"`.
- The return value has `output` (non-empty string).
- The return value has `score` (number between 1 and 5 inclusive).
- The return value has `reasoning` (non-empty string).

## Extra concept (optional)

What if the judge has a bias? For example, LLMs tend to give high scores. One technique to counteract this is **calibration**: you run the judge on a set of examples with known scores and adjust the scale. Another option is to use multiple judges and average the results, similar to a panel of referees. This is called **ensemble judging**.
