# Exercise 04 — Fetch URLs on demand with urlContext

## Concept

`googleSearch` (exercise 02) runs an open-ended web search — the model picks what to read. Sometimes you want tighter control: "read THIS specific page and answer from it." That's the **`urlContext`** tool.

Enable it the same way as the other built-ins:

```ts
config.tools = [{ urlContext: {} }]
```

Then include the target URL directly in your prompt text. Gemini fetches the page content and uses it to answer. This is handy for:

- **Doc QA**: "Look at our API reference at https://api.example.com/docs and list the authentication endpoints"
- **Release notes**: "Summarize the changes in https://github.com/org/repo/releases/latest"
- **Targeted grounding**: avoid the variance of search by pointing directly at the source of truth

Unlike `googleSearch`, `urlContext` answers stay focused on the URL you name. It fails cleanly when the URL isn't fetchable (auth-gated, paywall, 404) — the model will say so rather than fabricate.

## Docs & references

1. [URL context guide](https://ai.google.dev/gemini-api/docs/url-context) — supported URL schemes, size limits
2. [Built-in tools](https://ai.google.dev/gemini-api/docs/function-calling#built-in-tools) — googleSearch / codeExecution / urlContext
3. [Grounding metadata](https://ai.google.dev/api/generate-content#GroundingMetadata) — same metadata shape as googleSearch when urlContext hits

## Your task

1. Call `generateContent` with:
   - `model`: `"gemini-2.5-flash"`
   - `contents`: `"Using https://ai.google.dev/ as a reference, what does Google describe as Gemini's focus? Quote one short phrase."`
   - `config.tools`: `[{ urlContext: {} }]`
   - `config.maxOutputTokens`: `400`
2. Read `response.text`.
3. Return:
   ```ts
   {
     answer: response.text,
     toolRequested: true,
     mentionsTopic: /gemini/i.test(answer),
   }
   ```

## How to verify

```bash
aidev verify 04-url-context
```

Tests check:
- Request `config.tools` includes `{ urlContext: {} }`
- Prompt `contents` includes at least one `https://...` URL
- Return has the three expected fields
- `answer` is non-empty
- Answer mentions "Gemini" (proves the URL's content was used)

## Extra concept (optional)

`urlContext` is less flexible than `googleSearch` but more predictable. Use it when:

- You already KNOW the canonical source for the answer (an API doc, a release page, a policy doc)
- You want to LIMIT what the model can learn from — tighter guardrails for legal/compliance workflows
- You're paying for grounding and want a cheaper targeted fetch instead of a broad search

Current limits: Gemini caps the number of URLs per request (check the guide for the latest number — typically 20). URLs must be publicly accessible; auth-gated pages return an error that surfaces in the model's answer rather than silently failing.

You can combine `urlContext` with `googleSearch` in the same tools array for a hybrid: "search broadly, but also fetch this specific URL." Great for support chatbots that always pull from the runbook plus general web.
