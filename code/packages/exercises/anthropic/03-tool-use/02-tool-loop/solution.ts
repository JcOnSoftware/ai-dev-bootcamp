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
 * Solution: 2-turn tool-use loop.
 *
 * Turn 1: Claude receives user message + tools → responds with tool_use block.
 * Turn 2: We feed back the tool result → Claude responds with end_turn text.
 */
export default async function run() {
  const userMessage = "What's the weather like in London right now?";

  // ── Turn 1: send request with tools ──────────────────────────────────────
  const response1 = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    tools: [GET_WEATHER_TOOL],
    messages: [{ role: "user", content: userMessage }],
  });

  // ── Extract tool_use block ────────────────────────────────────────────────
  const toolUseBlock = response1.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
  );

  if (!toolUseBlock) {
    throw new Error(
      "Expected a tool_use block in turn 1 but got none. Content: " +
        JSON.stringify(response1.content),
    );
  }

  // ── Execute the tool locally ──────────────────────────────────────────────
  const toolInput = toolUseBlock.input as { location: string; unit?: "celsius" | "fahrenheit" };
  const toolResult = executeGetWeather(toolInput);

  // ── Turn 2: provide tool result ───────────────────────────────────────────
  const response2 = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    tools: [GET_WEATHER_TOOL],
    messages: [
      { role: "user", content: userMessage },
      { role: "assistant", content: response1.content },
      {
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: toolUseBlock.id,
            content: toolResult,
          },
        ],
      },
    ],
  });

  return response2;
}
