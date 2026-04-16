// Docs:
//   Tool use overview:     https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview
//   Implement tool use:    https://docs.claude.com/en/docs/agents-and-tools/tool-use/implement-tool-use

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

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
 */
export function executeGetWeather(input: {
  location: string;
  unit?: "celsius" | "fahrenheit";
}): string {
  const unit = input.unit ?? "celsius";
  const temp = unit === "celsius" ? 18 : 64;
  return JSON.stringify({
    location: input.location,
    temperature: temp,
    unit,
    description: "Partly cloudy with a gentle breeze",
  });
}

/**
 * Solution: single messages.create call with tools.
 *
 * Claude will respond with stop_reason === "tool_use" and a tool_use content
 * block. We return the response as-is — the actual tool execution (the "loop")
 * is covered in the next exercise.
 */
export default async function run() {
  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    tools: [GET_WEATHER_TOOL],
    messages: [
      {
        role: "user",
        content: "What's the weather like in London right now?",
      },
    ],
  });

  return response;
}
