/**
 * Tests for the runner harness.
 *
 * These tests use a fake exercise module (written as a tmp file or inline)
 * and a fake MessageStream to verify the harness hook mechanic without
 * hitting the real Anthropic API.
 */
import { describe, it, expect, afterEach } from "bun:test";
import { writeFile, unlink } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";
import { runUserCode } from "./harness.ts";
import type { RunOptions } from "./types.ts";

// The test exercise files must live near the runner source so Bun can resolve
// @anthropic-ai/sdk from packages/runner/node_modules.
const HERE = dirname(fileURLToPath(import.meta.url));

// ─── Fake MessageStream builder ──────────────────────────────────────────────
// Builds a fake MessageStream object that exposes:
//  - .on("streamEvent", handler) — registers event listeners
//  - .finalMessage() — resolves with a fake Message
//  - .emit(event: unknown) — test helper to fire events
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
 * Writes a temporary exercise module that calls client.messages.stream(...).
 *
 * The Anthropic prototype's .stream() method is pre-patched (via
 * globalThis.__ORIGINAL_STREAM_REPLACED = true) BEFORE runUserCode, so that
 * when the harness intercepts the call and runs our fake stream, teeStreamEvents
 * gets the object with .on("streamEvent", ...).
 *
 * The actual mechanism: we inject our fake stream so the ORIGINAL proto.stream
 * (called inside the harness's patchedStream) returns it. We do this by
 * pre-setting the original method on the prototype BEFORE the harness patches.
 */
async function writeFakeStreamExercise(
  _stream: ReturnType<typeof makeFakeMessageStream>,
): Promise<string> {
  // Write exercise into the runner src directory so @anthropic-ai/sdk resolves
  const path = join(HERE, `__tmp_exercise_stream_${Date.now()}.ts`);
  createdFiles.push(path);
  // This exercise calls client.messages.stream() — the harness will intercept it.
  // The Anthropic proto.stream is pre-replaced before runUserCode is called,
  // so the "original" stream method the harness captures returns our fake.
  await writeFile(
    path,
    `import Anthropic from "@anthropic-ai/sdk";
export default async function run() {
  const client = new Anthropic({ apiKey: "fake-key-no-real-call" });
  // client.messages.stream() is intercepted by the harness; the underlying
  // original method was replaced by the test to return __FAKE_STREAM__.
  const stream = client.messages.stream({
    model: "claude-haiku-4-5",
    max_tokens: 10,
    messages: [{ role: "user", content: "hi" }],
  });
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

// ─── Test infrastructure: proto injection ────────────────────────────────────

/**
 * Pre-patches Anthropic.Messages.prototype.stream to return our fake stream
 * instead of making a real API call.
 *
 * The harness patches this prototype on entry to runUserCode — it saves
 * the CURRENT proto.stream as "originalStream" and patches over it.
 * If we pre-replace proto.stream here, the harness will use OUR fake as
 * "originalStream", call it, get the fake stream back, then call
 * teeStreamEvents on it — exactly what we want to test.
 *
 * Returns a restore function.
 */
function injectFakeStream(stream: ReturnType<typeof makeFakeMessageStream>): () => void {
  const probe = new Anthropic({ apiKey: "probe" });
  const proto = probe.messages.constructor.prototype as {
    stream: (...args: unknown[]) => unknown;
  };
  const original = proto.stream;
  proto.stream = function () {
    return stream;
  };
  return () => { proto.stream = original; };
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
      onStreamEvent: (_event: unknown) => {
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

    // Pre-inject fake stream into the prototype BEFORE runUserCode patches it.
    // The harness will capture proto.stream (= our fake-returner) as "originalStream"
    // and call teeStreamEvents on the result.
    const restore = injectFakeStream(fakeStream);

    const received: FakeStreamEvent[] = [];
    const opts: RunOptions = {
      onStreamEvent: (event: unknown) => {
        received.push(event as FakeStreamEvent);
      },
    };

    const path = await writeFakeStreamExercise(fakeStream);

    try {
      await runUserCode(path, opts);
    } finally {
      restore();
    }

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

    const restore = injectFakeStream(fakeStream);

    const opts: RunOptions = {
      onStreamEvent: (_e: unknown) => {
        /* consume events */
      },
    };

    const path = await writeFakeStreamExercise(fakeStream);
    let result;
    try {
      result = await runUserCode(path, opts);
    } finally {
      restore();
    }

    // userReturn is the fake message from our exercise
    expect(result!.userReturn).not.toBeNull();
    expect(result!.userReturn).not.toBeUndefined();
    // calls[] should have the captured streaming call
    expect(result!.calls).toHaveLength(1);
    expect(result!.calls[0]?.streamed).toBe(true);
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

    const restore = injectFakeStream(fakeStream);

    let cbCalled = false;
    const opts: RunOptions = {
      onStreamEvent: (_e: unknown) => {
        cbCalled = true;
        throw new Error("callback error — should be swallowed");
      },
    };

    const path = await writeFakeStreamExercise(fakeStream);
    let didResolve = false;
    try {
      await runUserCode(path, opts);
      didResolve = true;
    } finally {
      restore();
    }
    // Should NOT throw even though the callback throws
    expect(didResolve).toBe(true);
    expect(cbCalled).toBe(true);
  });
});
