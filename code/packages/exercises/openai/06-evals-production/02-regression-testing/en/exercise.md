# Exercise 02 — Regression testing for prompt consistency

## Concept

When you modify a prompt in production, how do you know you haven't broken anything? The answer is to have a **regression test suite**: a set of inputs with expected output patterns that you run before and after each change.

The idea comes from traditional software testing. A regression test verifies that something that worked before still works after a modification. In the LLM world, you can't compare exact text (output is non-deterministic), but you can verify **patterns**: if you ask for the capital of France, the answer must contain "Paris".

This pattern is especially valuable when you upgrade the model (for example, from `gpt-4.1-nano` to a newer version) or when you adjust the system prompt. You run the tests before and after, and if the `passRate` drops significantly, you know the change broke something.

The key is defining good `expectedPattern` values. They're too strict if they expect exact text; they're too loose if they accept anything. The goal is to capture the semantics of the correct answer with a regex that has few false negatives.

## Docs & references

1. [Chat Completions API](https://platform.openai.com/docs/api-reference/chat/create) — endpoint reference for the 3 calls in the loop.
2. [Model IDs](https://platform.openai.com/docs/models) — list of available models and their capabilities.
3. [OpenAI Node SDK](https://github.com/openai/openai-node) — SDK README, installation, and examples.

## Your task

Implement the `run()` function in `starter.ts`:

1. Create an OpenAI client with `new OpenAI()`.
2. Define an array of 3 test cases with `{ input: string, expectedPattern: RegExp }`:
   - `{ input: "What is the capital of France?", expectedPattern: /paris/i }`
   - `{ input: "What is 2 + 2?", expectedPattern: /4|four/i }`
   - `{ input: "Name one primary color.", expectedPattern: /red|blue|yellow/i }`
3. Iterate over the test cases with `for...of`. For each, call `client.chat.completions.create`:
   - `model`: `"gpt-4.1-nano"`, `max_completion_tokens`: `100`
   - `messages`: `[{ role: "user", content: testCase.input }]`
4. Extract the text: `response.choices[0].message.content ?? ""`
5. Check if it matches the pattern: `testCase.expectedPattern.test(output)` → `passed` (boolean).
6. Accumulate into `results`: `[{ input, output, passed }]`.
7. Calculate `passRate` as `(number of passed) / results.length`.
8. Return `{ results, passRate }`.

## How to verify

```bash
aidev verify 02-regression-testing
```

The tests check that:

- Exactly **3 API calls** were made (one per test case).
- The return value has `results` (array of 3 elements).
- Each result has `input` (string), `output` (string), `passed` (boolean).
- `passRate` is a number between 0 and 1.
- The last call uses `model: "gpt-4.1-nano"`.

## Extra concept (optional)

In production, test cases are not hardcoded — they're loaded from a JSON file or a database. This allows the QA team to update tests without touching the code. You can also version the dataset alongside the prompt to have a history of regressions.
