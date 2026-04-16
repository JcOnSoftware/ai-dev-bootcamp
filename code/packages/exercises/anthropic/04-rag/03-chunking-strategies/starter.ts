// Docs:
//   Long context tips:  https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/long-context-tips

import { DOCS_CHUNKS } from "../fixtures/docs-chunks.ts";

/**
 * Fixed-size sliding window chunking.
 * Splits text into overlapping windows of `size` characters with `overlap` characters shared
 * between consecutive windows.
 *
 * Example: text="abcdefghij", size=6, overlap=2
 *   chunk[0] = "abcdef"   (chars 0-5)
 *   chunk[1] = "efghij"   (chars 4-9, step = size - overlap = 4)
 *
 * @param text     Input text to split
 * @param options  { size: characters per chunk, overlap: characters shared with next chunk }
 * @returns        Array of string chunks
 */
export function chunk(text: string, options: { size: number; overlap: number }): string[] {
  throw new Error("TODO: implementá chunk() — ventana deslizante de tamaño fijo con overlap.");
}

/**
 * Demonstrates three chunking strategies on a sample text from DOCS_CHUNKS:
 *
 * 1. fixed   — chunk() with size=200, overlap=50
 * 2. sentence — split on sentence-ending punctuation (. ! ?)
 * 3. paragraph — split on double newline (\n\n)
 *
 * Returns all three arrays — no API calls required.
 * Cost: $0.000 (pure computation)
 */
export default async function run(): Promise<{
  fixed: string[];
  sentence: string[];
  paragraph: string[];
}> {
  throw new Error("TODO: implementá run() demostrando las 3 estrategias de chunking.");
}
