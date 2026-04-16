# Exercise 03 — Multiple tools and automatic routing

## Concept

In the previous exercise you defined a single tool. In real applications you'll have dozens. The model acts as a **router**: it reads the descriptions of all available tools and decides which one (or which ones) to call based on what the user asked. You don't need to tell it which to use — the model infers it on its own.

The key is the `description` on each tool and each parameter. These are the "contract" between you and the model. If a description is vague or ambiguous, the model may choose wrong. If it's precise, the model routes correctly even with dozens of tools.

```typescript
// With 3 tools defined and the message "What time is it in Tokyo and what's 15 * 7?"
// the model may respond with 2 tool_calls in a single response:
// → get_time({ timezone: "Asia/Tokyo" })
// → calculate({ expression: "15 * 7" })
```

That's called **parallel tool calling** and it's the default behavior in OpenAI. You dive deeper into it in exercise 04.

## Docs & references

1. [Node.js SDK](https://github.com/openai/openai-node) — client setup and usage
2. [Function Calling guide](https://platform.openai.com/docs/guides/function-calling) — official guide covering routing and multiple tools
3. [Chat Completions API](https://platform.openai.com/docs/api-reference/chat/create) — reference for the `tools` parameter

## Your task

1. Open `starter.ts`.
2. Create an OpenAI client.
3. Define **3 tools**:
   - `get_weather(location: string)` — current weather for a location
   - `get_time(timezone: string)` — current time in a timezone (IANA)
   - `calculate(expression: string)` — evaluate a math expression
   Each parameter must have a clear `description`.
4. Start messages with: `"What time is it in Tokyo and what's 15 * 7?"`
5. Make the **first API call** with `model: "gpt-4.1-nano"`, `max_completion_tokens: 512`.
6. For each `tool_call` in the response, dispatch to the corresponding fake function and push a `role: "tool"` message.
7. Make the **second API call** with the updated messages.
8. Return the final response.

## How to verify

```bash
aidev verify 03-multi-tool-routing
```

The tests verify:
- At least 2 API calls are made
- The first call has at least 3 tools defined
- The first call responds with `finish_reason: "tool_calls"`
- The first response has at least 2 tool_calls (model calls multiple)
- The second call has at least 1 `role: "tool"` message
- The final response has text content and `finish_reason: "stop"`

## Extra concept (optional)

Automatic routing has limits. With 50 tools with similar names and descriptions, the model can get confused or pick wrong. Strategies for scaling: (1) categorize tools and pre-filter before sending to the model, (2) use embeddings to retrieve only tools relevant to the query (RAG for tools), (3) split into specialized sub-agents. All of this is agent architecture — covered in the advanced track.
