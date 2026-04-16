// Docs:
//   Tool use overview:     https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview
//   Tool choice:           https://docs.claude.com/en/docs/agents-and-tools/tool-use/implement-tool-use

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

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

const tools = [GET_WEATHER_TOOL, CALCULATE_TOOL];
const userMessage = "What is 12 times 15?";
const messages: Anthropic.MessageParam[] = [{ role: "user", content: userMessage }];
const model = "claude-haiku-4-5-20251001";

/**
 * Solution: 4 back-to-back calls with different tool_choice values.
 *
 * - auto: Claude decides (may or may not use a tool).
 * - any: Claude MUST use at least one tool.
 * - tool+name: Claude MUST use the specified tool.
 * - none: Claude MUST NOT use any tool.
 */
export default async function run(): Promise<{
  auto: Anthropic.Message;
  any: Anthropic.Message;
  named: Anthropic.Message;
  none: Anthropic.Message;
}> {
  // Sequential calls so harness captures them in order: calls[0]=auto, [1]=any, [2]=named, [3]=none
  const auto = await client.messages.create({
    model,
    max_tokens: 256,
    tools,
    messages,
    // tool_choice defaults to "auto" — omitting it is equivalent to { type: "auto" }
  });

  const any = await client.messages.create({
    model,
    max_tokens: 256,
    tools,
    messages,
    tool_choice: { type: "any" },
  });

  const named = await client.messages.create({
    model,
    max_tokens: 256,
    tools,
    messages,
    tool_choice: { type: "tool", name: "calculate" },
  });

  const none = await client.messages.create({
    model,
    max_tokens: 256,
    tools,
    messages,
    tool_choice: { type: "none" },
  });

  return { auto, any, named, none };
}
