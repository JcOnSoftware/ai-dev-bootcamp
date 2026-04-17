// Docs:
//   URL context guide : https://ai.google.dev/gemini-api/docs/url-context
//   Built-in tools    : https://ai.google.dev/gemini-api/docs/function-calling#built-in-tools

import { GoogleGenAI } from "@google/genai";

export interface UrlContextResult {
  answer: string;
  /** Was the urlContext tool config present on the request? */
  toolRequested: boolean;
  /** Does the final answer reference the target URL's content? */
  mentionsTopic: boolean;
}

/**
 * TODO:
 *   `urlContext` is a built-in tool that lets the model FETCH a specific
 *   URL on demand. Unlike googleSearch (broad search), you tell the model
 *   exactly WHICH page to read.
 *
 *   1. Call ai.models.generateContent({
 *        model: "gemini-2.5-flash",
 *        contents: "Using https://ai.google.dev/ as a reference, what does Google describe as Gemini's focus? Quote one short phrase.",
 *        config: { tools: [{ urlContext: {} }], maxOutputTokens: 400 },
 *      })
 *
 *   2. Read response.text.
 *
 *   3. Return {
 *        answer: response.text,
 *        toolRequested: true (if config.tools had urlContext),
 *        mentionsTopic: true if the answer contains "Gemini" (the topic),
 *      }
 *
 *   The test verifies that urlContext was enabled AND that the model
 *   actually used the content of the URL in its answer.
 */
export default async function run(): Promise<UrlContextResult> {
  throw new Error("TODO: use urlContext to fetch ai.google.dev. Read exercise.md.");
}
