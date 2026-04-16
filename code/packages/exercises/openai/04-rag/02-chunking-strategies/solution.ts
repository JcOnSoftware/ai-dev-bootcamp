// Docs:
//   SDK README       : https://github.com/openai/openai-node
//   Embeddings guide : https://platform.openai.com/docs/guides/embeddings
//   Chat Completions : https://platform.openai.com/docs/api-reference/chat/create

const SAMPLE_TEXT = `Artificial intelligence (AI) is intelligence demonstrated by machines, as opposed to the natural intelligence displayed by animals including humans. AI research has been defined as the field of study of intelligent agents, which refers to any system that perceives its environment and takes actions that maximize its chance of achieving its goals.

The term "artificial intelligence" had previously been used to describe machines that mimic and display human cognitive skills associated with the human mind, such as learning and problem-solving. This definition has since been rejected by major AI researchers who now describe AI in terms of rationality and acting rationally, which does not limit how intelligence can be articulated.

AI applications include advanced web search engines, recommendation systems, understanding human speech, self-driving cars, automated decision-making, and competing at the highest level in strategic game systems. As machines become increasingly capable, tasks considered to require intelligence are often removed from the definition of AI, a phenomenon known as the AI effect.

Machine learning is a method of inquiry in artificial intelligence research, defined as the capability of an agent to improve its performance on a given task through experience. Machine learning algorithms build a model based on sample data, known as training data, in order to make predictions or decisions without being explicitly programmed to do so.`;

function chunkText(text: string, chunkSize: number, overlap: number): string[] {
  const chunks: string[] = [];
  const step = chunkSize - overlap;
  let start = 0;

  while (start < text.length) {
    const chunk = text.slice(start, start + chunkSize);
    if (chunk.trim().length > 0) {
      chunks.push(chunk);
    }
    start += step;
  }

  return chunks;
}

export default async function run(): Promise<{ chunks: string[]; chunkCount: number }> {
  const chunks = chunkText(SAMPLE_TEXT, 200, 50);
  return { chunks, chunkCount: chunks.length };
}
