// Docs:
//   Tool use overview:     https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview
//   Tool choice:           https://docs.claude.com/en/docs/agents-and-tools/tool-use/implement-tool-use

import Anthropic from "@anthropic-ai/sdk";

// ── Tool definitions ──────────────────────────────────────────────────────────
export const GET_WEATHER_TOOL: Anthropic.Tool = {
  name: "get_weather",
  description: "Get the current weather for a given location.",
  input_schema: {
    type: "object" as const,
    properties: {
      location: { type: "string", description: "The city and country, e.g. 'London, UK'" },
      unit: { type: "string", enum: ["celsius", "fahrenheit"] },
    },
    required: ["location"],
  },
};

export const CALCULATE_TOOL: Anthropic.Tool = {
  name: "calculate",
  description: "Perform a basic arithmetic operation on two numbers.",
  input_schema: {
    type: "object" as const,
    properties: {
      operation: {
        type: "string",
        enum: ["add", "subtract", "multiply", "divide"],
        description: "The arithmetic operation to perform.",
      },
      a: { type: "number", description: "First operand." },
      b: { type: "number", description: "Second operand." },
    },
    required: ["operation", "a", "b"],
  },
};

/**
 * Run the exercise.
 *
 * Make 4 sequential calls with the same prompt "What is 12 times 15?" and both
 * tools, but vary tool_choice each time:
 *   - Call 1: tool_choice auto (or omit — it's the default)
 *   - Call 2: tool_choice { type: "any" }
 *   - Call 3: tool_choice { type: "tool", name: "calculate" }
 *   - Call 4: tool_choice { type: "none" }
 *
 * Return all 4 responses as { auto, any, named, none }.
 *
 * Observe how each tool_choice option changes Claude's behavior!
 */
export default async function run(): Promise<{
  auto: Anthropic.Message;
  any: Anthropic.Message;
  named: Anthropic.Message;
  none: Anthropic.Message;
}> {
  const _client = new Anthropic();
  throw new Error("TODO: implement run()");
}
