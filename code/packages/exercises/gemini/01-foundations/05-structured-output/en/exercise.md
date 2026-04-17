# Exercise 05 — Structured output with responseSchema

## Concept

When you build a real feature on top of an LLM, free-form text is the enemy. You need the model to return data in a shape your TypeScript code can trust — not a string you have to parse with regex and pray.

Gemini calls this **structured output**. You pass two things in `config`:

1. `responseMimeType: "application/json"` — tells the model to emit JSON, not prose.
2. `responseSchema` — a schema object (not JSON Schema — Google's simplified shape using the `Type` enum from `@google/genai`) describing the expected fields, types, and which ones are required.

With both set, the SDK returns `response.text` as a JSON string that **is guaranteed to match the schema**. You parse it, TypeScript-narrow the result, and move on.

The `Type` enum values you'll use most: `Type.OBJECT`, `Type.STRING`, `Type.NUMBER`, `Type.INTEGER`, `Type.BOOLEAN`, `Type.ARRAY`. Enum values go in the `enum: [...]` field on a string property.

## Docs & references

1. [Structured output guide](https://ai.google.dev/gemini-api/docs/structured-output) — responseMimeType + responseSchema patterns with examples
2. [`Schema` type reference](https://ai.google.dev/api/caching#Schema) — all fields (`type`, `properties`, `required`, `enum`, `items`, `description`)
3. [`@google/genai` SDK README](https://github.com/googleapis/js-genai) — includes the `Type` enum import

## Your task

Analyze this input text:

> `"This new CLI tool is a lifesaver — saved me hours on the demo."`

1. Import `Type` from `@google/genai` alongside `GoogleGenAI`.
2. Call `generateContent` with `model: "gemini-2.5-flash-lite"`, `maxOutputTokens: 128`, and a `contents` prompt asking the model to analyze the sentiment.
3. Set `config.responseMimeType: "application/json"`.
4. Set `config.responseSchema` to describe an object with:
   - `sentiment`: string, one of `"positive" | "negative" | "neutral"` (use `enum`)
   - `confidence`: number
   - `required`: both fields
5. `JSON.parse(response.text)` and return the parsed object as `{ sentiment, confidence }`.

## How to verify

```bash
aidev verify 05-structured-output
```

Tests check:
- Exactly 1 API call is made
- Request `config.responseMimeType === "application/json"`
- Request `config.responseSchema` declares `sentiment` and `confidence` properties
- Return value has `sentiment: string` and `confidence: number`
- `sentiment` is one of the three enum values
- `confidence` is between 0 and 1 (inclusive)
- For this clearly positive review, the model returns `sentiment: "positive"`

## Extra concept (optional)

Structured output **does not replace input validation**. The schema constrains output format, but the model can still return `{ sentiment: "positive", confidence: 0.99 }` for text that any human would read as negative. Run ground-truth evals on real data before trusting the model's confidence.

For complex nested shapes (arrays of objects, unions, discriminated types), Gemini's schema language is expressive but more limited than Zod/JSON Schema Draft 2020. If your real-world schema won't fit, consider: (a) asking for JSON without `responseSchema` and validating with Zod on your side, or (b) breaking the task into multiple smaller calls each with a simple schema.
