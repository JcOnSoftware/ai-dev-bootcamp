# Exercise 05 — Configure safety thresholds per request

## Concept

Every Gemini response is evaluated against a fixed set of harm categories. If any category's detected risk exceeds a configured threshold, the model **blocks** the response — you get an empty `candidate` with `finishReason: "SAFETY"` and a list of triggered `safetyRatings`.

The **four core HarmCategories**:

- `HARM_CATEGORY_HARASSMENT`
- `HARM_CATEGORY_HATE_SPEECH`
- `HARM_CATEGORY_SEXUALLY_EXPLICIT`
- `HARM_CATEGORY_DANGEROUS_CONTENT`

The threshold enum (`HarmBlockThreshold`):

| Value | Blocks when risk is... |
|---|---|
| `BLOCK_LOW_AND_ABOVE` | low / medium / high — most aggressive |
| `BLOCK_MEDIUM_AND_ABOVE` | medium / high — production default |
| `BLOCK_ONLY_HIGH` | high only — permissive |
| `BLOCK_NONE` | never — you take full responsibility |

You pass the settings per request:

```ts
config.safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  ...
]
```

This exercise uses a benign prompt, so nothing actually trips the filter — but the configuration SHAPE is what matters. Get it right here and you can lock down (or loosen) safety anywhere in your app.

## Docs & references

1. [Safety settings guide](https://ai.google.dev/gemini-api/docs/safety-settings) — categories, thresholds, examples
2. [`HarmCategory` enum](https://ai.google.dev/api/generate-content#HarmCategory) — full list (beyond the 4 defaults)
3. [`HarmBlockThreshold` enum](https://ai.google.dev/api/generate-content#HarmBlockThreshold) — all threshold values

## Your task

1. Import `HarmCategory` and `HarmBlockThreshold` from `@google/genai` alongside `GoogleGenAI`.
2. Build a 4-entry `safetySettings` array covering HARASSMENT, HATE_SPEECH, SEXUALLY_EXPLICIT, DANGEROUS_CONTENT — all with threshold `BLOCK_MEDIUM_AND_ABOVE`.
3. Call `generateContent` with:
   - `model`: `"gemini-2.5-flash-lite"`
   - `contents`: `"Tell me a harmless one-sentence joke about programmers."`
   - `config.safetySettings`: the 4-entry array
   - `config.maxOutputTokens`: `128`
4. Return `{ answer, finishReason, configuredCategories }` where `configuredCategories` is an array of the category strings you configured.

## How to verify

```bash
aidev verify 05-safety-settings
```

Tests check:
- Exactly 1 `generateContent` call
- Request `config.safetySettings` has ≥4 entries
- Each entry has `category` and `threshold` as strings
- The 4 core categories are all covered
- Return has the three expected fields
- The benign prompt produced a non-empty `answer` AND `finishReason !== "SAFETY"`
- `configuredCategories` reports back ≥4 categories

## Extra concept (optional)

Production systems usually lock safety at `BLOCK_MEDIUM_AND_ABOVE` (the default) for general-audience content and consider `BLOCK_LOW_AND_ABOVE` for kid-focused or highly regulated contexts. `BLOCK_NONE` is rarely the right answer in production — it means you're accepting liability for every output, which most orgs can't justify.

When safety fires, `response.candidates[0]` can be missing entirely — check `response.promptFeedback?.blockReason` to understand WHY (prompt was blocked vs. output was blocked). For UX, tell the user their prompt wasn't allowed; don't expose internal category names (that's a red team cheat sheet).

Beyond the 4 main categories, Gemini also has `HARM_CATEGORY_CIVIC_INTEGRITY` (political) and additional categories on some models. If you're building for elections or public-health contexts, configure those explicitly — the defaults often leave them at a permissive setting.
