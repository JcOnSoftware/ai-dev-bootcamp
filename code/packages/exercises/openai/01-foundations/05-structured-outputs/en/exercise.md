# Exercise 05 — Structured outputs with JSON schema

## Concept

LLMs generate free-form text by default — which is a problem when you need structured data to parse in your application. OpenAI solves this with **Structured Outputs**: you pass a JSON Schema and the model is **guaranteed** to return JSON that conforms to it, thanks to _constrained decoding_.

With `response_format: { type: "json_schema", json_schema: { name, strict: true, schema } }`, the model:
1. Generates tokens valid within the schema's grammar
2. Never invents extra fields (when `additionalProperties: false`)
3. Always includes required fields (`required: [...]`)

The response still arrives in `choices[0].message.content` — but now it's a JSON string you can parse with confidence.

```typescript
const parsed = JSON.parse(response.choices[0]!.message.content!);
// parsed is { name: "...", birth_date: "...", birth_city: "..." }
```

Important: `strict: true` requires all schema fields to be in `required` and `additionalProperties` to be `false`. If you don't satisfy that, the API returns an error.

## Docs & references

1. [Node.js SDK](https://github.com/openai/openai-node) — client setup and configuration
2. [Structured Outputs guide](https://platform.openai.com/docs/guides/structured-outputs) — official guide with full examples
3. [Chat Completions API](https://platform.openai.com/docs/api-reference/chat/create) — full endpoint reference

## Your task

1. Open `starter.ts`.
2. Create an OpenAI client and call `client.chat.completions.create` with:
   - `model: "gpt-4.1-nano"`, `max_completion_tokens: 256`
   - Two messages: a system message (`"Extract structured data from the user message."`) and a user message (`"My name is Ada Lovelace. I was born on December 10, 1815 in London."`)
   - `response_format` with `type: "json_schema"`, `json_schema.name: "person_info"`, `strict: true`, and a schema with properties `name`, `birth_date`, `birth_city` (all strings), all required, `additionalProperties: false`
3. Parse the content with `JSON.parse(response.choices[0]!.message.content!)`.
4. Return `{ response, parsed }`.

## How to verify

```bash
aidev verify 05-structured-outputs
```

Tests check:
- Exactly 1 API call is made
- The request includes `response_format` with `type: "json_schema"`
- The `json_schema` has `strict: true`
- Returns a non-null `parsed` object
- `parsed.name` is a non-empty string
- `parsed.birth_date` is a non-empty string
- `parsed.birth_city` is a non-empty string

Tests do NOT assert on exact values — the model may format the date in different ways.

## Extra concept (optional)

The OpenAI SDK also has a higher-level helper called `client.beta.chat.completions.parse()` that uses Zod to define the schema and returns the already-parsed, fully-typed object:

```typescript
import { z } from "zod";

const PersonInfo = z.object({
  name: z.string(),
  birth_date: z.string(),
  birth_city: z.string(),
});

const completion = await client.beta.chat.completions.parse({
  model: "gpt-4o-mini",
  messages: [...],
  response_format: zodResponseFormat(PersonInfo, "person_info"),
});

const person = completion.choices[0].message.parsed;
// person is typed as { name: string; birth_date: string; birth_city: string }
```

This is more convenient for TypeScript but requires `zod` and the SDK's `beta` methods.
