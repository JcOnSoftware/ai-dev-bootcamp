// Docs:
//   SDK README       : https://github.com/openai/openai-node
//   Function Calling : https://platform.openai.com/docs/guides/function-calling
//   API ref          : https://platform.openai.com/docs/api-reference/chat/create

import OpenAI from "openai";

/**
 * TODO:
 *   1. Create an OpenAI client.
 *   2. Create a mutable `notes: string[]` array — this is your agent's external state.
 *   3. Build a messages array starting with:
 *        [{ role: "user", content: "Take a note that I need to buy milk, then take a note about the meeting at 3pm, then list all notes." }]
 *   4. Define a `note_taker` tool with two operations via a required `action` parameter:
 *        - action: "add_note" + text: string — adds text to the notes array
 *        - action: "list_notes" — returns all notes
 *   5. Run the agent loop. When the tool is called:
 *        - If action is "add_note": push text to the notes array, return { success: true, note: text }
 *        - If action is "list_notes": return { notes }
 *   6. Track `turnCount` — how many times the loop iterated (increment each time you process tool calls).
 *   7. Return { notes, turnCount }.
 *
 * Read es/exercise.md or en/exercise.md for full context.
 */
export default async function run(): Promise<{ notes: string[]; turnCount: number }> {
  void OpenAI;
  throw new Error("TODO: implement state management agent. Read exercise.md for context.");
}
