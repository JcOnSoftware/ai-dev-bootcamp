# Exercise 01 — Declare your first tool

## Concept

Up to now every response from Gemini has been pure text (or structured JSON). **Function calling** changes that: you describe one or more functions, the model decides whether the user's question requires calling one of them, and returns the function name + arguments — NOT the final answer yet.

The contract is:

1. **You** declare what functions exist (`config.tools[0].functionDeclarations`).
2. **Gemini** decides whether to call them. If yes, `response.functionCalls[]` contains `{ name, args }`.
3. **You** execute the function yourself and feed the result back on a follow-up turn (exercise 02).

This pattern powers real agent workflows: "check inventory", "send email", "query database" — anything the model shouldn't invent from training data.

A `FunctionDeclaration` uses the same `Type` enum you saw in exercise 05 of Foundations. Good descriptions matter — the model reads them to decide whether to invoke your function.

## Docs & references

1. [Function calling guide](https://ai.google.dev/gemini-api/docs/function-calling) — the full lifecycle (declaration → model call → execution → feedback)
2. [`FunctionDeclaration` schema](https://ai.google.dev/api/caching#FunctionDeclaration) — fields: `name`, `description`, `parameters`
3. [`Schema` type reference](https://ai.google.dev/api/caching#Schema) — recap of `Type.OBJECT`, `Type.STRING`, required fields

## Your task

1. Declare a single function:
   - `name`: `"get_current_weather"`
   - `description`: one clear sentence about what the function returns
   - `parameters`: `Type.OBJECT` with:
     - `properties.location`: `{ type: Type.STRING, description: "City and country, e.g. 'Tokyo, Japan'" }`
     - `required`: `["location"]`
2. Call `ai.models.generateContent({ ... })` with:
   - `model`: `"gemini-2.5-flash-lite"`
   - `contents`: `"What's the weather in Tokyo right now?"`
   - `config.tools`: `[{ functionDeclarations: [yourDecl] }]`
   - `config.maxOutputTokens`: `256`
3. Read `response.functionCalls[0]` (the SDK convenience getter that collects all `functionCall` parts across candidates).
4. Return `{ calledFunction: call.name, calledArgs: call.args }`.

## How to verify

```bash
aidev verify 01-first-tool
```

Tests check:
- Exactly 1 API call is made
- Request `config.tools[0].functionDeclarations` has at least one entry
- The declaration's `name` contains `weather` and parameters include a `location` property
- Return has `calledFunction: string` and `calledArgs: object`
- The model chose to call the weather function (its name includes `weather`)
- `calledArgs.location` is a non-empty string mentioning `tokyo`

## Extra concept (optional)

Why declare a `description`? The model uses it alongside the function name to route requests. With three tools (`get_weather`, `send_email`, `book_flight`), the model reads each description and picks the best fit. Weak descriptions cause bad routing — "sends stuff" isn't the same as "Sends an email to the specified recipient with the given subject and body."

Arguments can also have `description` fields on each property. Use them when the name isn't self-explanatory (`{ priority: { ..., description: "'low' | 'normal' | 'high'" } }`).
