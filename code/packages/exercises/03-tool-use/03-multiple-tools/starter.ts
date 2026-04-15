// Docs:
//   Tool use overview:     https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview
//   Implement tool use:    https://docs.claude.com/en/docs/agents-and-tools/tool-use/implement-tool-use

import Anthropic from "@anthropic-ai/sdk";

// ── Tool definitions ──────────────────────────────────────────────────────────
export const GET_WEATHER_TOOL: Anthropic.Tool = {
  name: "get_weather",
  description:
    "Get the current weather for a given location. Returns temperature and a short description.",
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
 * Execute the get_weather tool.
 * TODO: implement.
 */
export function executeGetWeather(_input: {
  location: string;
  unit?: "celsius" | "fahrenheit";
}): string {
  throw new Error("TODO: implement executeGetWeather");
}

/**
 * Execute the calculate tool.
 * Should throw on divide by zero.
 * TODO: implement.
 */
export function executeCalculate(_input: {
  operation: "add" | "subtract" | "multiply" | "divide";
  a: number;
  b: number;
}): string {
  throw new Error("TODO: implement executeCalculate");
}

/**
 * Route a tool call by name to the correct executor.
 * Throws on unknown tool names.
 * TODO: implement.
 */
export function executeTool(_name: string, _input: Record<string, unknown>): string {
  throw new Error("TODO: implement executeTool");
}

/**
 * Run the exercise.
 *
 * Steps:
 * 1. Call messages.create with BOTH tools and a prompt that requires calculation.
 *    Prompt hint: "What is 73 multiplied by 72?"
 * 2. Extract the tool_use block and call executeTool(name, input).
 * 3. Feed back the tool_result in a second call.
 * 4. Return the second response.
 */
export default async function run() {
  const _client = new Anthropic();
  throw new Error("TODO: implement run()");
}
