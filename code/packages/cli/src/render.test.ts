import { describe, it, expect, beforeEach } from "bun:test";
import { initI18n, _resetForTesting } from "./i18n/index.ts";
import {
  truncate,
  isMessage,
  extractText,
  renderReturn,
  renderSummary,
  MAX_CHARS,
} from "./render.ts";
import type { HarnessResult, CapturedCall } from "@aidev/runner";

// Minimal structural type matching Anthropic SDK Message
interface FakeMessage {
  id: string;
  type: "message";
  role: "assistant";
  content: Array<{ type: string; [key: string]: unknown }>;
  model: string;
  stop_reason: string | null;
  stop_sequence: string | null;
  usage: { input_tokens: number; output_tokens: number };
}

// Helper to create a minimal Message object
function makeMessage(text: string): FakeMessage {
  return {
    id: "msg_test_123",
    type: "message",
    role: "assistant",
    content: [{ type: "text", text }],
    model: "claude-haiku-4-5",
    stop_reason: "end_turn",
    stop_sequence: null,
    usage: { input_tokens: 10, output_tokens: 20 },
  };
}

// Helper to create a minimal CapturedCall (cast to CapturedCall since FakeMessage is structurally compatible)
function makeCall(text: string, model = "claude-haiku-4-5"): CapturedCall {
  return {
    request: { model, messages: [{ role: "user", content: "hi" }], max_tokens: 100 },
    response: makeMessage(text) as unknown as CapturedCall["response"],
    durationMs: 42,
    streamed: false,
  };
}

// Helper to create a minimal HarnessResult
function makeResult(
  calls: CapturedCall[],
  userReturn: unknown = undefined,
): HarnessResult {
  return {
    calls,
    lastCall: calls[calls.length - 1],
    userReturn,
  };
}

// Fake Exercise shape (minimal)
const fakeExercise = {
  meta: {
    id: "01-first-call",
    track: "01-foundations",
    title: "First Call",
    version: "1.0.0",
    valid_until: "2099-01-01",
    concepts: [],
    estimated_minutes: 30,
    requires: [],
    locales: ["es" as const],
    provider: "anthropic" as const,
  },
  dir: "/fake/dir",
  trackSlug: "01-foundations",
  idSlug: "01-first-call",
};

beforeEach(() => {
  _resetForTesting();
  initI18n("en");
});

// ─── truncate ───────────────────────────────────────────────────────────────

describe("truncate", () => {
  it("returns a short string unchanged", () => {
    const short = "Hello world";
    expect(truncate(short, false)).toBe(short);
  });

  it("truncates a string exceeding MAX_CHARS and appends localized suffix", () => {
    const long = "a".repeat(MAX_CHARS + 50);
    const result = truncate(long, false);
    expect(result.length).toBeLessThan(long.length);
    // Starts with MAX_CHARS of 'a'
    expect(result.startsWith("a".repeat(MAX_CHARS))).toBe(true);
    // Contains the truncation hint (English: "truncated")
    expect(result).toContain("truncated");
    // The count of omitted chars is 50
    expect(result).toContain("50");
  });

  it("does NOT truncate when full=true even for very long strings", () => {
    const long = "z".repeat(MAX_CHARS * 2);
    expect(truncate(long, true)).toBe(long);
  });
});

// ─── isMessage ──────────────────────────────────────────────────────────────

describe("isMessage", () => {
  it("returns true for a valid Message object", () => {
    expect(isMessage(makeMessage("hi"))).toBe(true);
  });

  it("returns false for a plain string", () => {
    expect(isMessage("hello")).toBe(false);
  });

  it("returns false for an object without id", () => {
    expect(isMessage({ content: [] })).toBe(false);
  });

  it("returns false for null", () => {
    expect(isMessage(null)).toBe(false);
  });
});

// ─── extractText ────────────────────────────────────────────────────────────

describe("extractText", () => {
  it("extracts text from a single text block", () => {
    const msg = makeMessage("Hello from Claude");
    expect(extractText(msg)).toBe("Hello from Claude");
  });

  it("joins multiple text blocks with newline", () => {
    const msg = {
      ...makeMessage("first"),
      content: [
        { type: "text", text: "first" },
        { type: "text", text: "second" },
      ],
    } as FakeMessage;
    expect(extractText(msg)).toBe("first\nsecond");
  });

  it("ignores non-text blocks (e.g. tool_use)", () => {
    const msg = {
      ...makeMessage(""),
      content: [
        { type: "tool_use", id: "tool_1", name: "calc", input: {} },
        { type: "text", text: "result" },
      ],
    } as FakeMessage;
    expect(extractText(msg)).toBe("result");
  });
});

// ─── renderReturn ────────────────────────────────────────────────────────────

describe("renderReturn", () => {
  it("renders a Message value as extracted text", () => {
    const msg = makeMessage("I am Claude");
    const result = renderReturn(msg, false);
    expect(result).toBe("I am Claude");
  });

  it("renders { a: Message, b: Message } with labeled sections", () => {
    const msgA = makeMessage("response A");
    const msgB = makeMessage("response B");
    const result = renderReturn({ deterministic: msgA, creative: msgB }, false);
    expect(result).toContain("--- deterministic ---");
    expect(result).toContain("response A");
    expect(result).toContain("--- creative ---");
    expect(result).toContain("response B");
  });

  it("renders a primitive string with return_value_label", () => {
    const result = renderReturn("just a string", false);
    expect(result).toContain("Return value");
    expect(result).toContain('"just a string"');
  });

  it("renders an array with return_value_label", () => {
    const result = renderReturn([1, 2, 3], false);
    expect(result).toContain("Return value");
    expect(result).toContain("[");
  });

  it("renders { text: string, msg: Message } mixed object (key-by-key)", () => {
    const msg = makeMessage("the message");
    const result = renderReturn({ accumulatedText: "hello world", finalMessage: msg }, false);
    // String field renders as key: value (no label section)
    expect(result).toContain("accumulatedText: hello world");
    // Message field renders as labeled section
    expect(result).toContain("--- finalMessage ---");
    expect(result).toContain("the message");
  });
});

// ─── renderSummary ───────────────────────────────────────────────────────────

describe("renderSummary", () => {
  it("includes model line from lastCall", () => {
    const call = makeCall("hello");
    const result = makeResult([call], makeMessage("hello"));
    const summary = renderSummary(result, fakeExercise, { full: false, target: "starter" });
    expect(summary).toContain("Model:");
    expect(summary).toContain("claude-haiku-4-5");
  });

  it("includes tokens line with input and output counts", () => {
    const call = makeCall("hello");
    const result = makeResult([call], makeMessage("hello"));
    const summary = renderSummary(result, fakeExercise, { full: false, target: "starter" });
    expect(summary).toContain("Tokens:");
    expect(summary).toContain("10");
    expect(summary).toContain("20");
  });

  it("uses model_cost_hint verbatim when present", () => {
    const exerciseWithHint = {
      ...fakeExercise,
      meta: { ...fakeExercise.meta, model_cost_hint: "~$0.001/run (Haiku)" },
    };
    const call = makeCall("hello");
    const result = makeResult([call], makeMessage("hello"));
    const summary = renderSummary(result, exerciseWithHint, { full: false, target: "starter" });
    expect(summary).toContain("~$0.001/run (Haiku)");
  });

  it("computes cost from table when model_cost_hint absent", () => {
    const call = makeCall("hello");
    const result = makeResult([call], makeMessage("hello"));
    const summary = renderSummary(result, fakeExercise, { full: false, target: "starter" });
    expect(summary).toContain("~$");
  });

  it("shows run.cost_unknown when model is unrecognized", () => {
    const call = {
      ...makeCall("hello"),
      request: { model: "unknown-model-xyz", messages: [], max_tokens: 1 },
      response: {
        ...makeMessage("hello"),
        model: "unknown-model-xyz",
      } as unknown as CapturedCall["response"],
    };
    const result = makeResult([call], makeMessage("hello"));
    const summary = renderSummary(result, fakeExercise, { full: false, target: "starter" });
    expect(summary).toContain("check model pricing");
  });

  it("includes duration line", () => {
    const call = makeCall("hello");
    const result = makeResult([call], makeMessage("hello"));
    const summary = renderSummary(result, fakeExercise, { full: false, target: "starter" });
    expect(summary).toContain("Duration:");
    expect(summary).toContain("ms");
  });
});
