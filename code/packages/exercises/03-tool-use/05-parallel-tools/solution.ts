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
  const temperatures: Record<string, number> = {
    celsius: 18,
    fahrenheit: 64,
  };
  return JSON.stringify({
    location: input.location,
    temperature: temperatures[unit],
    unit,
    description: "Partly cloudy with a gentle breeze",
  });
}

/**
 * Solution: parallel tool use.
 *
 * When Claude receives a prompt asking about multiple cities, it may call
 * get_weather for each city in a single response (parallel tool calls).
 *
 * The key insight: collect ALL tool_use blocks from call 1 and return a
 * tool_result for EACH one in a single user message in call 2.
 */
export default async function run() {
  const userMessage =
    "Please call the get_weather tool twice: once for London, UK and once for Tokyo, JP. I need the weather for both cities.";

  // ── Turn 1: prompt Claude to call get_weather for multiple cities ─────────
  const response1 = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    tools: [GET_WEATHER_TOOL],
    tool_choice: { type: "any" },
    messages: [{ role: "user", content: userMessage }],
  });

  // ── Collect ALL tool_use blocks ───────────────────────────────────────────
  const toolUseBlocks = response1.content.filter(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
  );

  if (toolUseBlocks.length === 0) {
    throw new Error(
      "Expected at least one tool_use block but got none. Content: " +
        JSON.stringify(response1.content),
    );
  }

  // ── Build tool_result for EACH tool_use block ─────────────────────────────
  const toolResults: Anthropic.ToolResultBlockParam[] = toolUseBlocks.map((tu) => ({
    type: "tool_result",
    tool_use_id: tu.id,
    content: executeGetWeather(tu.input as { location: string; unit?: "celsius" | "fahrenheit" }),
  }));

  // ── Turn 2: provide ALL tool results in one message ───────────────────────
  const response2 = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    tools: [GET_WEATHER_TOOL],
    messages: [
      { role: "user", content: userMessage },
      { role: "assistant", content: response1.content },
      { role: "user", content: toolResults },
    ],
  });

  return response2;
}
