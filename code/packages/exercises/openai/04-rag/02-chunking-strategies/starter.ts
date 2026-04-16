// Docs:
//   SDK README       : https://github.com/openai/openai-node
//   Embeddings guide : https://platform.openai.com/docs/guides/embeddings
//   Chat Completions : https://platform.openai.com/docs/api-reference/chat/create

/**
 * TODO:
 *   1. Use the SAMPLE_TEXT constant below (do not modify it).
 *   2. Implement chunkText(text, chunkSize, overlap) that:
 *        - Splits the text into chunks of at most `chunkSize` characters
 *        - Each consecutive chunk starts `chunkSize - overlap` characters after the previous one
 *        - No empty chunks allowed
 *   3. Call chunkText(SAMPLE_TEXT, 200, 50).
 *   4. Return { chunks, chunkCount } where chunkCount === chunks.length.
 *
 * There is NO API call in this exercise — it is pure algorithm.
 *
 * If you get stuck, think of it as a sliding window:
 *   start = 0, then start += (chunkSize - overlap), repeat until start >= text.length.
 */

const SAMPLE_TEXT = `Artificial intelligence (AI) is intelligence demonstrated by machines, as opposed to the natural intelligence displayed by animals including humans. AI research has been defined as the field of study of intelligent agents, which refers to any system that perceives its environment and takes actions that maximize its chance of achieving its goals.

The term "artificial intelligence" had previously been used to describe machines that mimic and display human cognitive skills associated with the human mind, such as learning and problem-solving. This definition has since been rejected by major AI researchers who now describe AI in terms of rationality and acting rationally, which does not limit how intelligence can be articulated.

AI applications include advanced web search engines, recommendation systems, understanding human speech, self-driving cars, automated decision-making, and competing at the highest level in strategic game systems. As machines become increasingly capable, tasks considered to require intelligence are often removed from the definition of AI, a phenomenon known as the AI effect.

Machine learning is a method of inquiry in artificial intelligence research, defined as the capability of an agent to improve its performance on a given task through experience. Machine learning algorithms build a model based on sample data, known as training data, in order to make predictions or decisions without being explicitly programmed to do so.`;

export default async function run(): Promise<{ chunks: string[]; chunkCount: number }> {
  throw new Error("TODO: implement fixed-size chunking with overlap. Read exercise.md for context.");
}
