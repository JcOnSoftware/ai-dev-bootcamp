# Exercise 04 — Parallel tool calls in a single response

## Concept

When a user says "**get me the weather in Tokyo, Buenos Aires, and Berlin**", you don't want three sequential model turns — one per city. Latency would be terrible. Gemini supports **parallel tool calling**: in a single response, the model returns MULTIPLE `functionCall` parts. You dispatch all three in parallel (e.g. `Promise.all`), collect results, and feed them back together on the next turn.

This is the same mechanism you've already seen — the only difference is that `response.functionCalls` now has >1 entry. Your code must handle `functionCalls` as an array, not grab `[0]` and ignore the rest.

For this exercise, you just prove the parallel calls happen. The actual "execute + feedback" mirrors exercise 02 but wrapped in `Promise.all` — covered conceptually here and fully in track 05 (agents).

## Docs & references

1. [Parallel function calling](https://ai.google.dev/gemini-api/docs/function-calling#parallel) — how Gemini decides to emit multiple calls
2. [`GenerateContentResponse.functionCalls`](https://ai.google.dev/api/generate-content#GenerateContentResponse) — the SDK's convenience array
3. [Function calling guide](https://ai.google.dev/gemini-api/docs/function-calling) — the full workflow

## Your task

1. Declare `get_weather(location)` exactly as in exercise 01.
2. Call `generateContent`:
   - `model`: `"gemini-2.5-flash-lite"`
   - `contents`: `"What's the weather in Tokyo, Buenos Aires, and Berlin?"`
   - `config.tools`: `[{ functionDeclarations: [weatherDecl] }]`
   - `config.maxOutputTokens`: `256`
3. Read `response.functionCalls` (an ARRAY).
4. Map it into `calledFunctions: string[]` and `locations: string[]`.
5. Return `{ calledFunctions, locations }`.

## How to verify

```bash
aidev verify 04-parallel-tools
```

Tests check:
- Exactly 1 API call (single response, multiple function calls inside)
- Return has two arrays: `calledFunctions` and `locations`
- `calledFunctions.length >= 2` — parallel calls happened
- Every entry in `calledFunctions` is `"get_weather"`
- At least 2 of the 3 cities (Tokyo, Buenos Aires, Berlin) are extracted into `locations`

## Extra concept (optional)

In production the next step is to `Promise.all(locations.map(getWeather))`, then send ONE turn-2 message containing as many `functionResponse` parts as there were `functionCall` parts. Gemini merges them and replies with a single grounded answer.

Parallel calling is opportunistic — the model decides when tasks are independent enough. For "what's the weather in Tokyo AND what appointments do I have today?" you'll often get parallel calls to two DIFFERENT functions (`get_weather` + `list_calendar_events`). That's the real power: the model reasons about independence, you just dispatch.
