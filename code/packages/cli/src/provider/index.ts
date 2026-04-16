import type { SupportedProvider } from "./types.ts";

export type { SupportedProvider };
export { SUPPORTED_PROVIDERS, DEFAULT_PROVIDER } from "./types.ts";

// Module-level singleton — set once per process via initProvider().
let activeProvider: SupportedProvider | null = null;

/**
 * Must be called once at process startup (in commander's preAction hook) before
 * any getActiveProvider() calls. Calling it multiple times is allowed — last wins.
 */
export function initProvider(provider: SupportedProvider): void {
  activeProvider = provider;
}

/**
 * Returns the provider set via the last initProvider() call.
 * Throws if called before initProvider().
 */
export function getActiveProvider(): SupportedProvider {
  if (activeProvider === null) {
    throw new Error(
      "[provider] getActiveProvider() called before initProvider(). Call initProvider(provider) in the preAction hook first.",
    );
  }
  return activeProvider;
}

/**
 * Testing-only escape hatch. Resets the singleton state.
 * Do NOT call this in production code.
 */
export function _resetForTesting(): void {
  activeProvider = null;
}
