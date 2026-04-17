# Exercise 02 — Close the tool loop with a function response

## Concept

Exercise 01 stopped after the model said "I want to call `get_current_weather`". That's useless by itself — the learner hasn't received an answer. The **tool loop** is how you close it:

1. **Turn 1**: user question → model returns a `functionCall`.
2. **You** execute the function (locally, in your code).
3. **Turn 2**: send the full conversation (user message + model's call + your result) → model returns a natural-language answer grounded in the tool's output.

The shape of turn 2's `contents` is important. It's a THREE-item array:

```ts
[
  { role: "user",  parts: [{ text: "<original question>" }] },
  { role: "model", parts: [{ functionCall: { name, args } }] },      // what model said on turn 1
  { role: "user",  parts: [{ functionResponse: { name, response } }] }, // your tool's result
]
```

Note the role of the function response: `"user"`, not `"tool"` (unlike some other SDKs). Gemini treats the tool result as part of the user side of the conversation.

## Docs & references

1. [Function calling guide](https://ai.google.dev/gemini-api/docs/function-calling) — complete overview including multi-turn
2. [Multi-turn tool loop](https://ai.google.dev/gemini-api/docs/function-calling#multi-turn) — the exact contents shape you need
3. [`Content` resource](https://ai.google.dev/api/caching#Content) — roles and parts reference

## Your task

1. Reuse the `WEATHER_DECL` pattern from exercise 01 (you can inline it here).
2. Make turn 1 with `contents: "What's the weather in Tokyo?"` and `config.tools`. Read `response.functionCalls[0]`.
3. Execute `getCurrentWeather(call.args)` (the stub is already in `starter.ts`).
4. Make turn 2 with the 3-item `contents` array shown above, passing the same `config.tools` again.
5. Count turns (`turnCount` should equal 2).
6. Return `{ answer, calledFunction, calledArgs, turnCount }`.

## How to verify

```bash
aidev verify 02-tool-response-loop
```

Tests check:
- Exactly 2 generateContent calls
- Turn 2's `contents` is an array containing a part with `functionResponse`
- Turn 2's `contents` also includes the prior model turn's `functionCall`
- Returned `answer` is non-empty
- `turnCount === 2`
- `calledFunction` includes `weather` and `calledArgs.location` is a string
- The answer grounds in the stub's output (mentions `partly cloudy`, `cloudy`, or `18`)

## Extra concept (optional)

In real agent systems the tool result is not always a plain object — it could be a JSON string, an error message, or even another structured output. The convention is: put a JSON-serializable object in `response`, and the model handles it. Don't try to embed pre-rendered natural language in `response.response` — that defeats the point of the separation between "data" and "how the model describes data."

When a tool fails, pass back an error shape like `{ response: { error: "rate_limited", details: "..." } }`. The model will acknowledge the failure in its answer instead of hallucinating success. That's safer than throwing in your code, because the model can then decide whether to retry with different args or apologize to the user.
