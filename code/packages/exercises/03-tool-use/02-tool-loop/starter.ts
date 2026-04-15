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
 * 1. Call 1: messages.create with tools + user message asking about weather.
 * 2. Extract the tool_use block from call 1's response.
 * 3. Call executeGetWeather with the input from the tool_use block.
 * 4. Call 2: messages.create with the full conversation history + a user message
 *    containing the tool_result block (type: "tool_result", tool_use_id, content).
 * 5. Return call 2's response.
 */
export default async function run() {
  const _client = new Anthropic();
  throw new Error("TODO: implement run()");
}
