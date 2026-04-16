# Exercise 03 — Multi-criteria output scoring

## Concept

A single score (1-5) is useful, but it doesn't tell you WHAT is failing. Is the answer not relevant? Or is it relevant but has an inappropriate tone? Or is it relevant with a good tone but the facts are wrong? To answer this, you need **multi-criteria scoring**.

The idea is to evaluate the model's output on multiple dimensions simultaneously: relevance (does it answer what was asked?), accuracy (are the facts correct?), tone (is the style appropriate?), and an overall score. Each dimension gives actionable information: if relevance drops, the prompt is poorly focused; if accuracy drops, the model is hallucinating.

This pattern is widely used in RAG (Retrieval Augmented Generation) systems where it's critical to know if the model correctly used the retrieved context. It's also used in customer support chatbots to verify that responses are both technically correct AND friendly.

Structured outputs are essential here: you need the judge to return a JSON with exactly the fields you expect, not free text that you have to parse with regex.

## Docs & references

1. [Chat Completions API](https://platform.openai.com/docs/api-reference/chat/create) — endpoint reference for both calls.
2. [Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs) — how to use `response_format: { type: "json_schema" }` with `strict: true`.
3. [OpenAI Node SDK](https://github.com/openai/openai-node) — SDK README, installation, and examples.

## Your task

Implement the `run()` function in `starter.ts`:

1. Create an OpenAI client with `new OpenAI()`.
2. **Call 1 — the answer**: ask the model to answer a technical question.
   - `model`: `"gpt-4.1-nano"`, `max_completion_tokens`: `300`
   - System: `"You are a helpful assistant. Answer concisely and accurately."`
   - User: `"What are the main benefits of TypeScript over JavaScript?"`
   - Save the text: `response.choices[0].message.content`
3. **Call 2 — the scorer**: evaluate the answer on multiple dimensions.
   - `model`: `"gpt-4.1-nano"`, `max_completion_tokens`: `300`
   - System: `"You are an expert evaluator. Score the following answer on these criteria (1-5 each): relevance, accuracy, tone. Also provide an overall score and brief feedback."`
   - User: `"Question: What are the main benefits of TypeScript over JavaScript?\n\nAnswer: " + <text from call 1>`
   - `response_format: { type: "json_schema" }` with schema having `relevance`, `accuracy`, `tone`, `overall` (all `number`) and `feedback` (`string`), all required, `strict: true`.
4. Parse the JSON from call 2.
5. Return `{ answer: <text from call 1>, scores: <parsed object> }`.

## How to verify

```bash
aidev verify 03-output-scoring
```

The tests check that:

- Exactly **2 API calls** were made.
- The second call uses `response_format` with `type: "json_schema"`.
- The return value has `answer` (non-empty string).
- `scores.relevance`, `scores.accuracy`, `scores.tone`, `scores.overall` are numbers between 1 and 5.
- `scores.feedback` is a non-empty string.

## Extra concept (optional)

In real systems, scoring dimensions are designed together with the product team. For example, a support chatbot might evaluate: `technical_accuracy`, `customer_empathy`, `resolution_clarity`, `response_time_appropriate`. Each dimension is weighted differently according to business objectives. This is called **weighted scoring**.
