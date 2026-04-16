// Dispatcher
export { runUserCode, type HarnessResult } from "./harness.ts";

// Shared types
export { resolveExerciseFile, HarnessError, type RunOptions, type ExerciseTarget } from "./types.ts";

// Provider-specific types (for tests that need to narrow)
export { type CapturedCallAnthropic, type CapturedCall } from "./harness-anthropic.ts";
export { type CapturedCallOpenAI } from "./harness-openai.ts";

// Anthropic stream events (backward compat)
export type { MessageStreamEvent } from "@anthropic-ai/sdk/resources/messages/messages";
