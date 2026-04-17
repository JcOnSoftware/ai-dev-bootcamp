/**
 * Gemini harness SPIKE — B0-T00 (v2)
 *
 * Findings from inspection (gemini-inspect.ts):
 *   - Public methods (`generateContent`, `generateContentStream`, `embedContent`) are
 *     INSTANCE-LEVEL (bound in constructor), NOT on the prototype.
 *   - Prototype exposes `*Internal` variants (`generateContentInternal`, etc.) where
 *     the actual logic lives. Public methods are thin wrappers that delegate.
 *
 * Strategy: monkey-patch the `*Internal` methods on the prototype.
 *   - Patches affect all instances globally (harness semantics).
 *   - Internal methods receive the processed params + return the SDK response.
 *   - Public methods' pre-processing is preserved (we sit BELOW them).
 *
 * This spike validates:
 *   1. Patching `generateContentInternal` on the prototype intercepts public `generateContent` calls.
 *   2. Patching `generateContentStreamInternal` intercepts public stream calls AND preserves async-iterable semantics.
 *   3. Patching `embedContentInternal` intercepts embed calls.
 *   4. `this` binding + arg passing work correctly.
 *   5. Restoration via `finally` cleanly reverts.
 *
 * Dry: no real API call. Internal methods are stubbed so the public wrapper returns our stub.
 * Wet validation (real GEMINI_API_KEY) comes later in B5-T03 integration tests.
 *
 * Run: `bun run packages/runner/scripts/gemini-spike.ts` (from code/)
 */

import { GoogleGenAI } from "@google/genai";

interface CapturedCall {
  method: string;
  argsShape: string;
}

const captured: CapturedCall[] = [];

async function spike() {
  const ai = new GoogleGenAI({ apiKey: "AIza-spike-placeholder-not-real" });
  const modelsProto = Object.getPrototypeOf(ai.models);

  const targets = ["generateContentInternal", "generateContentStreamInternal", "embedContentInternal"] as const;

  for (const m of targets) {
    if (typeof modelsProto[m] !== "function") {
      throw new Error(`[spike] expected Models.prototype.${m} to be a function, got ${typeof modelsProto[m]}`);
    }
  }
  console.log("[spike] ✓ All *Internal target methods present on prototype.");

  const originals = new Map<string, Function>();
  for (const m of targets) {
    originals.set(m, modelsProto[m]);
    const publicName = m.replace(/Internal$/, "");
    modelsProto[m] = function patched(this: unknown, params: Record<string, unknown>) {
      captured.push({ method: publicName, argsShape: params ? Object.keys(params).join(",") : "(none)" });

      if (m === "generateContentStreamInternal") {
        return (async function* () {
          yield { candidates: [{ content: { parts: [{ text: "stub-chunk-1" }] } }], usageMetadata: { promptTokenCount: 1 } };
          yield { candidates: [{ content: { parts: [{ text: "stub-chunk-2" }] } }], usageMetadata: { candidatesTokenCount: 2, totalTokenCount: 3 } };
        })();
      }

      if (m === "embedContentInternal") {
        return Promise.resolve({ embeddings: [{ values: [0.1, 0.2, 0.3] }] });
      }

      return Promise.resolve({
        candidates: [{ content: { parts: [{ text: "stub-response" }] } }],
        usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 1, totalTokenCount: 2 },
      });
    };
  }
  console.log("[spike] ✓ *Internal patches installed.");

  try {
    const r1 = await ai.models.generateContent({ model: "gemini-2.5-flash-lite", contents: "hi" });
    console.log("[spike] generateContent returned:", JSON.stringify(r1).slice(0, 120), "...");

    const stream = await ai.models.generateContentStream({ model: "gemini-2.5-flash-lite", contents: "hi" });
    const chunks: unknown[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    console.log("[spike] generateContentStream yielded", chunks.length, "chunks");

    const e1 = await ai.models.embedContent({ model: "gemini-embedding-001", contents: "hi" });
    console.log("[spike] embedContent returned:", JSON.stringify(e1).slice(0, 120));

    if (captured.length !== 3) {
      throw new Error(`[spike] expected 3 captured calls, got ${captured.length}: ${JSON.stringify(captured)}`);
    }
    console.log("[spike] ✓ Captured 3 calls:", captured);
  } finally {
    for (const [m, fn] of originals) {
      modelsProto[m] = fn;
    }
    console.log("[spike] ✓ Originals restored.");
  }

  console.log("\n[spike] ✅ Prototype-patching mechanics validated for public generate/stream/embed.");
  console.log("[spike]    Strategy: patch *Internal methods on prototype (public methods are instance-bound).");
  console.log("[spike]    Next: wet integration test with real GEMINI_API_KEY in B5-T03.");
  console.log("[spike]    Track 06 (Live API): separate spike required — ai.live.connect uses WebSockets.");
}

await spike();
