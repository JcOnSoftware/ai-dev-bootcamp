// Docs:
//   Tool use overview:     https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview
//   Implement tool use:    https://docs.claude.com/en/docs/agents-and-tools/tool-use/implement-tool-use

import Anthropic from "@anthropic-ai/sdk";

// ── Tool definition (copy verbatim into your solution) ────────────────────────
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
 * 1. Create an Anthropic client.
 * 2. Call messages.create with model "claude-haiku-4-5-20251001",
 *    tools: [GET_WEATHER_TOOL], and a user message asking about the weather.
 * 3. Return the response.
 *
 * You only need ONE call for this exercise — don't process tool results yet.
 * That comes in the next exercise.
 */
export default async function run() {
  const _client = new Anthropic();
  throw new Error("TODO: implement run()");
}
