# Exercise 03 — Let the model run Python with code execution

## Concept

LLMs are famously bad at arithmetic. They're also bad at sorting, deduping, and anything that benefits from running a real program. Gemini's **`codeExecution` tool** sidesteps the problem: the model writes Python, Google runs it in a sandbox, returns the output, and the model incorporates the result into its answer.

You enable it the same way as `googleSearch`:

```ts
config.tools = [{ codeExecution: {} }]
```

The response shape is richer though — `candidates[0].content.parts` can now contain THREE distinct part types:

```ts
{ executableCode: { language: "PYTHON", code: "..." } }
{ codeExecutionResult: { outcome: "OUTCOME_OK", output: "..." } }
{ text: "... natural language wrap-up ..." }
```

Your code walks the parts array and separates them. You typically get ONE executableCode, ONE codeExecutionResult, and one or more text parts (before/after).

## Docs & references

1. [Code execution guide](https://ai.google.dev/gemini-api/docs/code-execution) — when/why it helps, sandbox limits
2. [Built-in tools](https://ai.google.dev/gemini-api/docs/function-calling#built-in-tools) — other built-ins
3. [Part shape](https://ai.google.dev/api/caching#Part) — text / executableCode / codeExecutionResult / functionCall

## Your task

1. Call `generateContent` with:
   - `model`: `"gemini-2.5-flash"`
   - `contents`: `"Compute 17 * 23 and the sum of the first 100 integers. Show the Python you ran."`
   - `config.tools`: `[{ codeExecution: {} }]`
   - `config.maxOutputTokens`: `600`
2. Walk `response.candidates[0].content.parts`. For each part:
   - If `executableCode.code` is a string, push to `codes[]`.
   - If `codeExecutionResult.output` is a string, push to `outputs[]`.
   - If `text` is a string, push to `texts[]`.
3. Join each array (`"\n\n"` for code, `"\n"` for the others).
4. Return `{ generatedCode, sandboxOutput, summary }`.

## How to verify

```bash
aidev verify 03-code-execution
```

Tests check:
- Request `config.tools` includes `{ codeExecution: {} }`
- Return has three string fields
- `generatedCode` contains Python-ish markers (`print`, `sum`, `range`, `import`, `def`, `=`)
- **`sandboxOutput` contains `391`** (= 17 × 23)
- **`sandboxOutput` contains `5050`** (= sum 1..100)
- `summary` is non-empty

## Extra concept (optional)

The sandbox is stateful within a single generation but isolated from your filesystem and network. It's pre-loaded with common libs (numpy, pandas, matplotlib) but has no API access. Use it for:

- Arithmetic and statistics
- String/data manipulation
- Quick verification of the model's own reasoning
- Chart generation (returns base64-encoded PNGs in `inlineData` parts you can render in UIs)

`codeExecutionResult.outcome` tells you whether execution succeeded. Possible values: `OUTCOME_OK`, `OUTCOME_FAILED`, `OUTCOME_DEADLINE_EXCEEDED`. In production, log non-OK outcomes — they often indicate the model wrote code that hit a resource limit or imported a library not available in the sandbox.

Like `googleSearch`, `codeExecution` is billed separately from generation. See the pricing page.
