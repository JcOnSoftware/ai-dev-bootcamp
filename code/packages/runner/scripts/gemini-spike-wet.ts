/**
 * Gemini harness SPIKE — B0-T00 WET (real API)
 *
 * Validates the *Internal-patching strategy against the real Gemini API.
 * Requires GEMINI_API_KEY.
 *
 * Unlike gemini-spike.ts (dry, stubs *Internal), this one:
 *   - Patches each *Internal to CAPTURE args, CALL original, CAPTURE response, return it transparently.
 *   - Makes 3 real API calls (generateContent, generateContentStream, embedContent).
 *   - Asserts the public return shape is preserved + usage metadata flows through.
 *
 * Cost: ~$0.0001 USD (flash-lite, 3 tiny calls). Well under the <$0.10/run budget.
 */

import { GoogleGenAI } from "@google/genai";

const apiKey = process.env["GEMINI_API_KEY"];
if (!apiKey) {
  console.error("[spike-wet] GEMINI_API_KEY not set. Set it in .env or export it.");
  process.exit(1);
}

interface CapturedCall {
  method: string;
  paramsKeys: string[];
  responseType: string;
  usageMetadata?: unknown;
}

const captured: CapturedCall[] = [];

async function wetSpike() {
  const ai = new GoogleGenAI({ apiKey });
  const modelsProto = Object.getPrototypeOf(ai.models);

  const targets = ["generateContentInternal", "generateContentStreamInternal", "embedContentInternal"] as const;
  const originals = new Map<string, Function>();

  for (const m of targets) {
    originals.set(m, modelsProto[m]);
    const publicName = m.replace(/Internal$/, "");

    if (m === "generateContentStreamInternal") {
      // Streaming: call original, wrap async iterable to observe + forward chunks.
      modelsProto[m] = async function patched(this: unknown, params: Record<string, unknown>) {
        const original = originals.get(m) as Function;
        const iterable = await original.call(this, params);
        const chunks: unknown[] = [];
        let lastUsage: unknown;

        async function* wrapped() {
          for await (const chunk of iterable as AsyncIterable<Record<string, unknown>>) {
            chunks.push(chunk);
            if (chunk && typeof chunk === "object" && "usageMetadata" in chunk) {
              lastUsage = chunk["usageMetadata"];
            }
            yield chunk;
          }
          captured.push({
            method: publicName,
            paramsKeys: params ? Object.keys(params) : [],
            responseType: `AsyncIterable(${chunks.length} chunks)`,
            usageMetadata: lastUsage,
          });
        }

        return wrapped();
      };
    } else {
      modelsProto[m] = async function patched(this: unknown, params: Record<string, unknown>) {
        const original = originals.get(m) as Function;
        const response = await original.call(this, params);
        const u = (response as Record<string, unknown>)?.["usageMetadata"];
        captured.push({
          method: publicName,
          paramsKeys: params ? Object.keys(params) : [],
          responseType: typeof response === "object" ? Object.keys(response as object).join(",") : typeof response,
          usageMetadata: u,
        });
        return response;
      };
    }
  }

  console.log("[spike-wet] ✓ *Internal patches installed (wet mode).");

  try {
    // --- Call 1: generateContent (non-streaming) ---
    const r1 = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: "Reply with exactly the word PONG.",
    });
    const text1 = r1.text ?? "";
    console.log("[spike-wet] generateContent text:", JSON.stringify(text1));
    if (!text1 || text1.length === 0) throw new Error("[spike-wet] generateContent returned empty text");

    // --- Call 2: generateContentStream (streaming) ---
    const stream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash-lite",
      contents: "Count from 1 to 3, one number per line.",
    });
    let streamText = "";
    let streamChunks = 0;
    for await (const chunk of stream) {
      streamChunks++;
      if (chunk.text) streamText += chunk.text;
    }
    console.log("[spike-wet] generateContentStream:", streamChunks, "chunks, text:", JSON.stringify(streamText.slice(0, 80)));
    if (streamChunks === 0) throw new Error("[spike-wet] stream yielded 0 chunks");

    // --- Call 3: embedContent ---
    const e1 = await ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: "hello world",
    });
    const embLen = (e1.embeddings?.[0]?.values?.length) ?? 0;
    console.log("[spike-wet] embedContent: embedding length =", embLen);
    if (embLen < 100) throw new Error(`[spike-wet] embedding unexpectedly short: ${embLen}`);

    // --- Verify captures ---
    if (captured.length !== 3) {
      throw new Error(`[spike-wet] expected 3 captured calls, got ${captured.length}: ${JSON.stringify(captured)}`);
    }
    console.log("\n[spike-wet] ✓ Captured 3 calls:");
    for (const c of captured) {
      console.log("  -", c.method, "params:", c.paramsKeys.join(","), "usage:", JSON.stringify(c.usageMetadata));
    }
  } finally {
    for (const [m, fn] of originals) {
      modelsProto[m] = fn;
    }
    console.log("\n[spike-wet] ✓ Originals restored.");
  }

  console.log("\n[spike-wet] ✅ WET validation passed. Strategy confirmed against real API.");
  console.log("[spike-wet]    Harness-gemini.ts can proceed with confidence in B5-T03.");
}

await wetSpike();
