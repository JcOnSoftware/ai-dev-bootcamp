# 03 — Multiple Tools

## Objective

Learn how to offer multiple tools in a single call and route execution based on which
tool Claude chose. Claude selects the most appropriate tool for the given prompt.

---

## Context

When you pass an array of tools, Claude picks which one to use based on the prompt.
Your code needs to inspect `toolUseBlock.name` and dispatch to the correct function.

This exercise introduces `CALCULATE_TOOL` alongside `GET_WEATHER_TOOL`:

```typescript
// The calculate tool schema (enum of operations):
{
  name: "calculate",
  input_schema: {
    properties: {
      operation: { enum: ["add", "subtract", "multiply", "divide"] },
      a: { type: "number" },
      b: { type: "number" }
    }
  }
}
```

Using an `enum` in the schema teaches Claude the valid values for `operation`,
preventing arbitrary strings and making `switch`-based dispatch straightforward.

---

## Your task

1. Implement `executeCalculate({ operation, a, b })` — returns JSON `{ result: number }`.
   Throw an error on divide by zero.
2. Implement `executeTool(name, input)` — route to `executeGetWeather` or `executeCalculate`
   based on `name`. Throw for unknown names.
3. Implement `run()`:
   - Use the prompt `"What is 2 multiplied by 2627?"` — forces use of `calculate`.
   - Pass `tools: [GET_WEATHER_TOOL, CALCULATE_TOOL]`.
   - 2-turn loop with `executeTool(toolUseBlock.name, toolUseBlock.input)`.
   - Return `response2`.

---

## Hints

- The enum in the schema makes Claude send exactly `"multiply"`, `"add"`, etc.
- `executeCalculate` receives actual numbers — not strings — because the schema declares `"type": "number"`.
- The test verifies that `toolUseBlock.input.operation === "multiply"` and the final
  response contains `5254` (2 × 2627).

---

## Success criteria

- `executeCalculate({ operation: "multiply", a: 6, b: 7 })` returns `'{"result":42}'` (no API).
- `executeCalculate({ operation: "divide", a: 10, b: 0 })` throws (no API).
- `calls.length === 2`.
- `calls[0].request.tools.length === 2`.
- The tool chosen in `calls[0]` is `"calculate"` with `operation === "multiply"`.
- The final response contains `5254` or `5,254`.
- Model is haiku.

---

## Resources

- [Tool use — Overview](https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview)
- [Tool use — Implementation](https://docs.claude.com/en/docs/agents-and-tools/tool-use/implement-tool-use)
