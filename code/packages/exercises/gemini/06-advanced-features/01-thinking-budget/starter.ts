// Docs:
//   Thinking guide       : https://ai.google.dev/gemini-api/docs/thinking
//   thinkingConfig field : https://ai.google.dev/api/generate-content#ThinkingConfig
//   UsageMetadata fields : https://ai.google.dev/api/generate-content#UsageMetadata

import { GoogleGenAI } from "@google/genai";

export interface ThinkingReport {
  /** Tokens the model spent reasoning internally before answering. */
  thoughtsTokenCount: number;
  /** Tokens in the visible answer. */
  candidatesTokenCount: number;
  /** The final answer text. */
  answer: string;
}

/**
 * TODO:
 *   Gemini 2.5 models can "think" before answering — invisible reasoning
 *   tokens that improve answer quality on hard problems. You control the
 *   budget via config.thinkingConfig.thinkingBudget.
 *
 *   Budget semantics:
 *     0            = thinking OFF (fastest, cheapest)
 *     -1           = dynamic (model picks)
 *     1..24576     = fixed ceiling on thinking tokens (2.5-flash default: 8192)
 *
 *   1. Call ai.models.generateContent({
 *        model: "gemini-2.5-flash",
 *        contents: "A train leaves NYC at 8:00 AM traveling 60 mph. Another leaves Boston at 9:00 AM traveling 70 mph toward NYC. The cities are 215 miles apart. At what time do they meet?",
 *        config: { thinkingConfig: { thinkingBudget: 1024 }, maxOutputTokens: 400 },
 *      })
 *   2. Read usage.thoughtsTokenCount + usage.candidatesTokenCount from
 *      response.usageMetadata.
 *   3. Return { thoughtsTokenCount, candidatesTokenCount, answer: response.text }.
 */
export default async function run(): Promise<ThinkingReport> {
  throw new Error("TODO: enable thinking and report usage breakdown. Read exercise.md.");
}
