// Docs:
//   Tool use overview:     https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview
//   Implement tool use:    https://docs.claude.com/en/docs/agents-and-tools/tool-use/implement-tool-use

import Anthropic from "@anthropic-ai/sdk";

// ── Tool definition ───────────────────────────────────────────────────────────
export const GET_WEATHER_TOOL: Anthropic.Tool = {
  name: "get_weather",
  description:
    "Get the current weather for a given location. Returns temperature and a short description.",
  input_schema: {
    type: "object" as const,
    properties: {
      location: {
        type: "string",
        description: "The city and country, e.g. 'London, UK'",
      },
      unit: {
        type: "string",
        enum: ["celsius", "fahrenheit"],
        description: "Temperature unit. Defaults to celsius.",
      },
    },
    required: ["location"],
  },
};

/**
 * Simulates fetching weather for a location.
 * Returns a JSON string with temperature and description.
 * TODO: implement this function.
 *
 * NOTE: Claude may call get_weather MULTIPLE times in parallel — your code must
 * handle ALL tool_use blocks from call 1, not just the first one.
 */
export function executeGetWeather(_input: {
  location: string;
  unit?: "celsius" | "fahrenheit";
}): string {
  throw new Error("TODO: implement executeGetWeather");
}

/**
 * Run the exercise.
 *
 * Steps:
 * 1. Call 1: messages.create with get_weather tool and a prompt asking about
 *    MULTIPLE cities, e.g. "What's the weather in London, Paris, and Tokyo?".
 *    Use tool_choice: { type: "any" } to ensure Claude uses the tool.
 *
 * 2. Collect ALL tool_use blocks from call 1 response.content (not just [0]).
 *    Claude may call get_weather for each city in parallel.
 *
 * 3. Build tool_result blocks for EACH tool_use block:
 *    [{ type: "tool_result", tool_use_id: tu.id, content: executeGetWeather(tu.input) }]
 *
 * 4. Call 2: messages.create with full history + user message containing ALL tool_results.
 *
 * 5. Return call 2's response.
 */
export default async function run() {
  const _client = new Anthropic();
  throw new Error("TODO: implement run()");
}
