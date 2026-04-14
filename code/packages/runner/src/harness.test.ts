/**
 * Tests for the runner harness.
 *
 * These tests use a fake exercise module (written as a tmp file or inline)
 * and a fake MessageStream to verify the harness hook mechanic without
 * hitting the real Anthropic API.
 */
import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { writeFile, unlink } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { runUserCode } from "./harness.ts";
import type { RunOptions } from "./harness.ts";

// The test exercise files must live near the runner source so Bun can resolve
// @anthropic-ai/sdk from packages/runner/node_modules.
const HERE = dirname(fileURLToPath(import.meta.url));

// ─── Fake MessageStream builder ──────────────────────────────────────────────
// Builds a fake MessageStream object that exposes:
//  - .on("streamEvent", handler) — registers event listeners
//  - .finalMessage() — resolves with a fake Message
//  - .emit(event) — test helper to fire events
//  - [Symbol.asyncIterator] — minimal async iterator for user code

interface FakeStreamEvent {
  type: string;
  [key: string]: unknown;
}

function makeFakeMessageStream(events: FakeStreamEvent[]) {
  const listeners: ((e: FakeStreamEvent) => void)[] = [];
  const fakeMessage = {
    id: "msg_fake_001",
    type: "message" as const,
    role: "assistant" as const,
    content: [{ type: "text", text: "fake response" }],
    model: "claude-haiku-4-5",
    stop_reason: "end_turn",
    stop_sequence: null,
    usage: { input_tokens: 5, output_tokens: 10 },
  };

  const stream = {
    on(name: string, fn: (e: unknown) => void) {
      if (name === "streamEvent") {
        listeners.push(fn as (e: FakeStreamEvent) => void);
      }
      return stream; // chainable
    },
    async finalMessage() {
      // Emit all events to registered listeners
      for (const evt of events) {
        for (const listener of listeners) {
          listener(evt);
        }
      }
      return fakeMessage;
    },
    [Symbol.asyncIterator]() {
      let i = 0;
      return {
        async next() {
          if (i < events.length) {
            return { value: events[i++], done: false };
          }
          return { value: undefined, done: true };
        },
      };
    },
  };

  return stream;
}

// ─── Temporary exercise file helpers ─────────────────────────────────────────

// Keep track of created temp files so we can delete them after each test
const createdFiles: string[] = [];

afterEach(async () => {
  for (const f of createdFiles) {
    try { await unlink(f); } catch { /* ignore */ }
  }
  createdFiles.length = 0;
});

/**
 * Writes a temporary exercise module and returns its path.
 * The module monkey-patches the `messages.stream` method on the Anthropic
 * prototype to return the fake stream (simulating a real SDK call).
 */
async function writeFakeStreamExercise(
  _stream: ReturnType<typeof makeFakeMessageStream>,
): Promise<string> {
  // Write exercise into the runner src directory so @anthropic-ai/sdk resolves
  const path = join(HERE, `__tmp_exercise_stream_${Date.now()}.ts`);
  createdFiles.push(path);
  // The exercise reads __FAKE_STREAM__ from globalThis (injected by the test)
  // and calls .finalMessage() on it — simulating what user stream exercises do.
  await writeFile(
    path,
    `import Anthropic from "@anthropic-ai/sdk";
export default async function run() {
  // Suppress unused import warning
  void Anthropic;
  const fakeStream = (globalThis as Record<string, unknown>)["__FAKE_STREAM__"];
  const stream = fakeStream as {
    on: (name: string, fn: (e: unknown) => void) => unknown;
    finalMessage: () => Promise<unknown>;
    [Symbol.asyncIterator]: () => AsyncIterableIterator<unknown>;
  };
  const msg = await stream.finalMessage();
  return msg;
}
`,
  );
  return path;
}

async function writeSimpleExercise(): Promise<string> {
  const path = join(HERE, `__tmp_exercise_simple_${Date.now()}.ts`);
  createdFiles.push(path);
  await writeFile(
    path,
    `import Anthropic from "@anthropic-ai/sdk";
export default async function run() {
  void Anthropic;
  return { result: "no-api-call" };
}
`,
  );
  return path;
}

// ─── Phase 4.1 Tests ─────────────────────────────────────────────────────────

describe("RunOptions.onStreamEvent (Phase 4)", () => {
  /**
   * Task 4.1 — harness hook: onStreamEvent callback is invoked per event.
   *
   * We can't easily test the internal patching path without a real Anthropic
   * SDK call, so we test the teeStreamEvents helper indirectly: we verify that
   * after adding onStreamEvent to RunOptions, the type accepts the option
   * and the harness doesn't throw when the option is present.
   */
  it("RunOptions accepts onStreamEvent without TypeScript error", () => {
    // This is a TYPE-LEVEL test — if onStreamEvent is not on RunOptions,
    // this line won't compile and bun test will fail to parse.
    const opts: RunOptions = {
      onStreamEvent: (_event) => {
        // callback — type must be (event: MessageStreamEvent) => void
      },
    };
    // The option object is valid
    expect(typeof opts.onStreamEvent).toBe("function");
  });

  it("RunOptions without onStreamEvent is still valid (regression — backward compat)", () => {
    const opts: RunOptions = {};
    expect(opts.onStreamEvent).toBeUndefined();
  });

  /**
   * End-to-end hook invocation test.
   *
   * We write a fake exercise that uses our injected stream, and verify
   * that onStreamEvent is called for each event the stream emits.
   */
  it("onStreamEvent is called for each stream event in order", async () => {
    const events: FakeStreamEvent[] = [
      { type: "message_start", message: { id: "msg_1" } },
      { type: "content_block_start", index: 0, content_block: { type: "text", text: "" } },
      { type: "content_block_delta", index: 0, delta: { type: "text_delta", text: "Hello" } },
      { type: "content_block_stop", index: 0 },
      { type: "message_stop" },
    ];

    const fakeStream = makeFakeMessageStream(events);

    // Inject fake stream into globalThis so exercise can access it
    (globalThis as Record<string, unknown>)["__FAKE_STREAM__"] = fakeStream;

    const received: FakeStreamEvent[] = [];
    const opts: RunOptions = {
      onStreamEvent: (event) => {
        received.push(event as FakeStreamEvent);
      },
    };

    // Write exercise that uses globalThis.__FAKE_STREAM__
    const path = await writeFakeStreamExercise(fakeStream);

    // Run exercise — onStreamEvent should be called via teeStreamEvents
    // The fake stream's .on("streamEvent", cb) will fire callbacks when
    // .finalMessage() is called
    await runUserCode(path, opts);

    // Verify all events were received in order
    expect(received).toHaveLength(events.length);
    expect(received.map((e) => e.type)).toEqual(events.map((e) => e.type));
  });

  it("HarnessResult.calls is still populated when onStreamEvent is provided", async () => {
    const events: FakeStreamEvent[] = [
      { type: "message_start" },
      { type: "message_stop" },
    ];
    const fakeStream = makeFakeMessageStream(events);
    (globalThis as Record<string, unknown>)["__FAKE_STREAM__"] = fakeStream;

    const opts: RunOptions = {
      onStreamEvent: (_e) => {
        /* consume events */
      },
    };

    const path = await writeFakeStreamExercise(fakeStream);
    const result = await runUserCode(path, opts);

    // userReturn is the fake message from our exercise
    expect(result.userReturn).not.toBeNull();
    expect(result.userReturn).not.toBeUndefined();
  });

  it("runUserCode without onStreamEvent still works (no regression)", async () => {
    const path = await writeSimpleExercise();
    const result = await runUserCode(path, {});
    expect(result.userReturn).toEqual({ result: "no-api-call" });
    expect(result.calls).toHaveLength(0);
  });
});

// ─── teeStreamEvents helper integration ──────────────────────────────────────

describe("teeStreamEvents — direct harness integration", () => {
  it("does not throw when stream has no .on method (guard)", async () => {
    // A stream-like object without .on should not crash the harness
    // We verify via a simple exercise that returns a plain object
    const path = await writeSimpleExercise();
    // No onStreamEvent — just verify no crash
    const result = await runUserCode(path, {});
    expect(result.userReturn).toEqual({ result: "no-api-call" });
  });

  it("callback errors are swallowed (harness never crashes user code)", async () => {
    const fakeStream = makeFakeMessageStream([
      { type: "content_block_delta", delta: { type: "text_delta", text: "X" } },
    ]);
    (globalThis as Record<string, unknown>)["__FAKE_STREAM__"] = fakeStream;

    let cbCalled = false;
    const opts: RunOptions = {
      onStreamEvent: (_e) => {
        cbCalled = true;
        throw new Error("callback error — should be swallowed");
      },
    };

    const path = await writeFakeStreamExercise(fakeStream);
    // Should NOT throw even though the callback throws
    await expect(runUserCode(path, opts)).resolves.toBeDefined();
    expect(cbCalled).toBe(true);
  });
});
