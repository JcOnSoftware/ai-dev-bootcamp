// Docs:
//   SDK README       : https://github.com/openai/openai-node
//   Function Calling : https://platform.openai.com/docs/guides/function-calling
//   API ref          : https://platform.openai.com/docs/api-reference/chat/create

import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

/**
 * Fake data — do not change these functions.
 */
function fakeGetPopulation(city: string): { city: string; population: number } {
  const data: Record<string, number> = {
    Tokyo: 13960000,
    London: 8982000,
  };
  return { city, population: data[city] ?? 0 };
}

function fakeGetArea(city: string): { city: string; areaKm2: number } {
  const data: Record<string, number> = {
    Tokyo: 2194,
    London: 1572,
  };
  return { city, areaKm2: data[city] ?? 0 };
}

function fakeCalculate(expression: string): number {
  const sanitized = expression.replace(/[^0-9+\-*/().]/g, "");
  return Function(`"use strict"; return (${sanitized})`)() as number;
}

/**
 * TODO:
 *   1. Create an OpenAI client.
 *   2. Build a messages array starting with:
 *        [{ role: "user", content: "Which city has higher population density: Tokyo or London?" }]
 *   3. Define three tools: `get_population(city)`, `get_area(city)`, `calculate(expression)`.
 *   4. Run the agent loop (same while loop pattern from 01-planner-executor).
 *   5. Execute each tool call with the matching fake function.
 *   6. Return { totalCalls: calls.length, finalAnswer } where calls is the list of API calls made
 *      and finalAnswer is the last assistant message content.
 *
 * Read es/exercise.md or en/exercise.md for full context.
 */
export default async function run(): Promise<{ totalCalls: number; finalAnswer: string }> {
  void fakeGetPopulation;
  void fakeGetArea;
  void fakeCalculate;
  throw new Error("TODO: implement multi-step reasoning agent. Read exercise.md for context.");
}
