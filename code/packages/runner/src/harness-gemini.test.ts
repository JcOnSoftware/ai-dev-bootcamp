import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { writeFile, mkdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runUserCodeGemini } from "./harness-gemini.ts";

const hasKey = !!process.env["GEMINI_API_KEY"];
const here = dirname(fileURLToPath(import.meta.url));

describe.if(hasKey)("harness-gemini (integration, real API)", () => {
  // Fixture files need to live inside the workspace so @google/genai resolves.
  const tmpDir = join(here, "__test_fixtures_gemini__");

  beforeAll(async () => {
    await mkdir(tmpDir, { recursive: true });
  });

  afterAll(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  test("captures generateContent call", async () => {
    const file = join(tmpDir, "ex-generate.ts");
    await writeFile(
      file,
      `
import { GoogleGenAI } from "@google/genai";
export default async function run() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: "Reply with exactly: PING",
  });
}
`,
      "utf-8",
    );
    const result = await runUserCodeGemini(file);
    expect(result.calls).toHaveLength(1);
    const call = result.calls[0]!;
    expect(call.method).toBe("generateContent");
    expect(call.streamed).toBe(false);
    expect(call.request["model"]).toBe("gemini-2.5-flash-lite");
    // Gemini responses have `candidates` array.
    expect(Array.isArray(call.response["candidates"])).toBe(true);
    // Usage should be populated
    const usage = call.response["usageMetadata"] as Record<string, number> | undefined;
    expect(usage).toBeDefined();
    expect(usage!["promptTokenCount"]).toBeGreaterThan(0);
  }, 30_000);

  test("captures generateContentStream call (streaming)", async () => {
    const file = join(tmpDir, "ex-stream.ts");
    await writeFile(
      file,
      `
import { GoogleGenAI } from "@google/genai";
export default async function run() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const stream = await ai.models.generateContentStream({
    model: "gemini-2.5-flash-lite",
    contents: "Count 1 2 3",
  });
  let text = "";
  for await (const chunk of stream) {
    if (chunk.text) text += chunk.text;
  }
  return { text };
}
`,
      "utf-8",
    );
    const result = await runUserCodeGemini(file);
    expect(result.calls).toHaveLength(1);
    const call = result.calls[0]!;
    expect(call.method).toBe("generateContentStream");
    expect(call.streamed).toBe(true);
    // Assembled response should have candidates with text
    const candidates = call.response["candidates"] as unknown[];
    expect(Array.isArray(candidates)).toBe(true);
    expect(candidates.length).toBeGreaterThan(0);
    // User return must have received the streamed text
    const userReturn = result.userReturn as { text: string };
    expect(typeof userReturn.text).toBe("string");
    expect(userReturn.text.length).toBeGreaterThan(0);
  }, 30_000);

  test("captures embedContent call", async () => {
    const file = join(tmpDir, "ex-embed.ts");
    await writeFile(
      file,
      `
import { GoogleGenAI } from "@google/genai";
export default async function run() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: "hello world",
  });
}
`,
      "utf-8",
    );
    const result = await runUserCodeGemini(file);
    expect(result.calls).toHaveLength(1);
    const call = result.calls[0]!;
    expect(call.method).toBe("embedContent");
    expect(call.streamed).toBe(false);
    const embeddings = call.response["embeddings"] as Array<{ values: number[] }>;
    expect(Array.isArray(embeddings)).toBe(true);
    expect(embeddings[0]!.values.length).toBeGreaterThan(100);
  }, 30_000);

  test("original prototype methods are restored after run", async () => {
    // Run something, then confirm the SDK still works normally.
    const file = join(tmpDir, "ex-restore.ts");
    await writeFile(
      file,
      `
import { GoogleGenAI } from "@google/genai";
export default async function run() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return ai.models.generateContent({ model: "gemini-2.5-flash-lite", contents: "hi" });
}
`,
      "utf-8",
    );
    await runUserCodeGemini(file);

    // Now call the SDK directly — no harness active. Should NOT throw.
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey: process.env["GEMINI_API_KEY"]! });
    const r = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: "say hi",
    });
    expect(r.text).toBeDefined();
  }, 30_000);
});

describe.if(!hasKey)("harness-gemini (skipped — no GEMINI_API_KEY)", () => {
  test("skipped", () => {
    // Presence-only test so the suite doesn't report as empty in CI without the key.
    expect(true).toBe(true);
  });
});
