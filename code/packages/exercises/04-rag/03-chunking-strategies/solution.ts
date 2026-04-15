// Docs:
//   Long context tips:  https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/long-context-tips

import { DOCS_CHUNKS } from "../fixtures/docs-chunks.ts";

/**
 * Fixed-size sliding window chunking.
 *
 * Step = size - overlap. Each window starts `step` chars after the previous.
 * The last chunk includes all remaining text (may be shorter than `size`).
 */
export function chunk(text: string, options: { size: number; overlap: number }): string[] {
  if (text.length === 0) return [];

  const { size, overlap } = options;
  const step = size - overlap;
  const chunks: string[] = [];

  let start = 0;
  while (start < text.length) {
    chunks.push(text.slice(start, start + size));
    start += step;
  }

  return chunks;
}

/**
 * Splits text into sentences by breaking on .!? followed by whitespace or end.
 * Trims each segment and filters out empty strings.
 */
function chunkBySentence(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Splits text into paragraphs by breaking on double newlines.
 * Trims each segment and filters out empty strings.
 */
function chunkByParagraph(text: string): string[] {
  return text
    .split(/\n\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Demonstrates three chunking strategies on the first DOCS_CHUNK:
 *
 * 1. fixed     — sliding window, size=200 chars, overlap=50 chars
 * 2. sentence  — split on sentence-ending punctuation
 * 3. paragraph — split on double newlines
 *
 * Cost: $0.000 — pure computation, zero API calls.
 */
export default async function run(): Promise<{
  fixed: string[];
  sentence: string[];
  paragraph: string[];
}> {
  // Use the first chunk as sample text; it's 200-300 tokens of technical content
  const sampleText = DOCS_CHUNKS[0]!.text;

  const fixed = chunk(sampleText, { size: 200, overlap: 50 });
  const sentence = chunkBySentence(sampleText);
  const paragraph = chunkByParagraph(sampleText);

  console.log(`Sample text length: ${sampleText.length} chars`);
  console.log(`Fixed chunks (size=200, overlap=50): ${fixed.length}`);
  console.log(`Sentence chunks:   ${sentence.length}`);
  console.log(`Paragraph chunks:  ${paragraph.length}`);

  return { fixed, sentence, paragraph };
}
