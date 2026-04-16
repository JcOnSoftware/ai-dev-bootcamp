# Exercise 04 — Dataset-driven batch evaluation

## Concept

In production, evaluation is not done case by case — it's done in **batch** over a complete dataset. An evaluation dataset is a collection of `(input, expected_output)` pairs that represents the cases your system must handle correctly.

The key metric is **accuracy**: what percentage of the dataset cases the model answers correctly. If you have 100 cases and the model fails 20, your accuracy is 0.8. When you deploy a new version, you run the dataset again and compare. If accuracy drops, the change introduced a regression.

This is how ML teams measure real improvements. "It seems to work better" is not enough — you need numbers. An accuracy of 0.85 vs 0.82 is a measurable 3.6% improvement, regardless of intuition.

For this exercise, the dataset contains simple factual questions (country capitals). In a real system, the dataset would be curated by domain experts and have hundreds or thousands of cases. What matters is understanding the pattern: iterate over the dataset, evaluate each case, calculate aggregate metrics.

## Docs & references

1. [Chat Completions API](https://platform.openai.com/docs/api-reference/chat/create) — endpoint reference for the 5 calls in the loop.
2. [Model IDs](https://platform.openai.com/docs/models) — list of available models.
3. [OpenAI Node SDK](https://github.com/openai/openai-node) — SDK README, installation, and examples.

## Your task

Implement the `run()` function in `starter.ts`:

1. Create an OpenAI client with `new OpenAI()`.
2. Define the dataset inline — an array of 5 objects `{ prompt, expectedContains: string[] }`:
   - `{ prompt: "What is the capital of France?", expectedContains: ["Paris"] }`
   - `{ prompt: "What is the capital of Germany?", expectedContains: ["Berlin"] }`
   - `{ prompt: "What is the capital of Japan?", expectedContains: ["Tokyo"] }`
   - `{ prompt: "What is the capital of Australia?", expectedContains: ["Canberra"] }`
   - `{ prompt: "What is the capital of Brazil?", expectedContains: ["Brasilia", "Brasília"] }`
3. Iterate the dataset with `for...of`. For each entry, call the API:
   - `model`: `"gpt-4.1-nano"`, `max_completion_tokens`: `100`
   - `messages`: `[{ role: "user", content: entry.prompt }]`
4. Extract the output: `response.choices[0].message.content ?? ""`
5. Check if at least one of the `expectedContains` values is in the output (case-insensitive): `entry.expectedContains.some(e => output.toLowerCase().includes(e.toLowerCase()))`.
6. Calculate aggregate metrics:
   - `totalTests`: 5
   - `passed`: count of results where `passed === true`
   - `failed`: count of results where `passed === false`
   - `accuracy`: `passed / totalTests`
7. Return `{ totalTests, passed, failed, accuracy }`.

## How to verify

```bash
aidev verify 04-dataset-testing
```

The tests check that:

- Exactly **5 API calls** were made.
- `totalTests` is `5`.
- `passed + failed === 5`.
- `accuracy` is a number between 0 and 1.
- At least 3 tests pass (the factual questions are simple).
- The last call uses `model: "gpt-4.1-nano"`.

## Extra concept (optional)

How do you build a good evaluation dataset? First, you collect real production cases (user logs) and annotate them with the correct answer. Then, you add **edge cases**: boundary cases you suspect the model might fail. A good dataset has a balanced distribution of easy, medium, and hard cases. This is called a **golden dataset** or **eval set**.
