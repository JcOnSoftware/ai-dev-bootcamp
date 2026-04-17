# Exercise 02 — Ground answers with Google Search

## Concept

By default, a model's knowledge is frozen at training time. Ask "who won Best Picture in 2024?" and a model trained in 2023 will either refuse or hallucinate.

Gemini ships a **built-in tool** (different from the custom functions you've declared so far) that lets the model call Google Search mid-generation. You enable it with a single line:

```ts
config.tools = [{ googleSearch: {} }]
```

Empty config object — Google provides the tool, you just opt in. The model decides per-request whether to invoke it. When it does, the response includes `candidates[0].groundingMetadata` with `groundingChunks` — each a `{ web: { uri, title } }` pointer to a source URL the model consulted.

Three important constraints:

1. **Mutually exclusive with custom tools** in the current API: you can pass `googleSearch` OR your own `functionDeclarations` on a single request, not both.
2. **Billed separately**: grounding requests have an additional fee on top of generation (see [pricing](https://ai.google.dev/pricing)).
3. **Non-deterministic sources**: the same query can return different grounding chunks across runs. Your code should not assume a fixed source set.

## Docs & references

1. [Grounding with Google Search](https://ai.google.dev/gemini-api/docs/grounding) — overview + pricing notes
2. [Built-in tools in function calling](https://ai.google.dev/gemini-api/docs/function-calling#built-in-tools) — googleSearch, codeExecution, urlContext
3. [`GroundingMetadata`](https://ai.google.dev/api/generate-content#GroundingMetadata) — shape of `groundingChunks`

## Your task

1. Call `generateContent` with:
   - `model`: `"gemini-2.5-flash"`
   - `contents`: `"Who won the Best Picture Oscar in 2024?"`
   - `config.tools`: `[{ googleSearch: {} }]`
   - `config.maxOutputTokens`: `400`
2. Read `response.text` → the natural-language answer.
3. Check `response.candidates[0].groundingMetadata`:
   - `hasGroundingMetadata = !!groundingMetadata`
   - `sourceCount = groundingMetadata?.groundingChunks?.length ?? 0`
4. Return `{ answer, hasGroundingMetadata, sourceCount }`.

## How to verify

```bash
aidev verify 02-google-search-grounding
```

Tests check:
- Exactly 1 `generateContent` call
- Request `config.tools` includes `{ googleSearch: {} }`
- Non-empty `answer`
- `hasGroundingMetadata === true` (search actually ran)
- `sourceCount > 0`
- Answer mentions the actual winner (Oppenheimer) or clearly describes the Oscar event

## Extra concept (optional)

For regulated or contentious topics you often want **strict grounding** — the answer should ONLY assert things backed by retrieved sources. Gemini doesn't enforce this automatically; combine grounding with a prompt instruction like "only answer using facts from the search results; otherwise say you don't have that information."

Source attribution is another production win: walk `groundingMetadata.groundingChunks` and show each `web.uri + web.title` to the user. That gives them a paper trail they can verify. For legal or medical apps this is often mandatory.

`googleSearch` is one of three built-in tools. Exercise 03 covers `codeExecution` and exercise 04 covers `urlContext` — each follows the same "empty config object, Google provides the tool" pattern.
