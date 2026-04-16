# Exercise 04 — Summarization loops for context compression

## Concept

Simple truncation discards messages — sometimes the ones containing the most important information. A more elegant alternative is **summary-based compression**: when the history gets too long, you ask the model to summarize it in a single sentence, and use that summary as context for subsequent conversations.

The pattern is called **rolling context**:

```
[Turn 1] → [Turn 2] → [Turn 3] → TOO LONG
                                       ↓
                          Ask for a summary → "summary"
                                       ↓
                    New conversation with system: "Context: {summary}"
```

The advantage over truncation is that you don't lose important information — you compress it. The downside is that it costs an extra request and may lose specific details.

## Docs & references

1. [Node.js SDK](https://github.com/openai/openai-node) — client setup and configuration
2. [Chat Completions API](https://platform.openai.com/docs/api-reference/chat/create) — multi-turn message format

## Your task

1. Open `starter.ts`.
2. Create an OpenAI client and a `messages` array.
3. **Turn 1**: user `"I am building a TypeScript REST API using Express and PostgreSQL."` → save response.
4. **Turn 2**: user `"I want to add authentication using JWT tokens."` → save response.
5. **Summarization call**: add `{ role: "user", content: "Summarize our conversation so far in exactly one sentence." }` to messages and send the request. Save the response text as `summary`.
6. **New conversation with the summary**: create a new request with:
   - `system`: `"Context from previous conversation: ${summary}"`
   - `user`: `"What should I implement next?"`
   Save this as `finalResponse`.
7. Return `{ summary, finalResponse }`.

Use `model: "gpt-4.1-nano"`, `max_completion_tokens: 128` (and 64 for the summarization call).

## How to verify

```bash
aidev verify 04-summarization-loops
```

Tests check:
- At least 3 API calls (2 normal + 1 summarize + optionally 1 final)
- `summary` is a non-empty string
- `summary` is reasonably short (< 500 characters) — it's "one sentence"
- `finalResponse` has content
- All calls use `gpt-4.1-nano`

## Extra concept (optional)

In production systems, rolling context typically works like this:

```
if (countTokens(messages) > TOKEN_THRESHOLD) {
  const summary = await summarize(messages);
  messages = [{ role: "system", content: `Previous context: ${summary}` }];
}
```

There are more sophisticated variants that preserve the last N messages *in addition to* the summary (to avoid losing immediate context), and that do incremental summarization (instead of summarizing the whole history, only summarize the older part):

```
messages = [
  { role: "system", content: `Earlier context: ${summary}` },
  ...recentMessages  // last 4-6 messages untouched
];
```

This combination — summary of the past + window of the present — is the most robust pattern for long chat applications.
