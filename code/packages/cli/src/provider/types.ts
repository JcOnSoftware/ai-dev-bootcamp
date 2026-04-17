export type SupportedProvider = "anthropic" | "openai" | "gemini";

export const SUPPORTED_PROVIDERS: readonly SupportedProvider[] = ["anthropic", "openai", "gemini"] as const;

export const DEFAULT_PROVIDER: SupportedProvider = "anthropic";

/** Environment variable name used to resolve the API key for each provider. */
export const PROVIDER_ENV_VAR: Record<SupportedProvider, string> = {
  anthropic: "ANTHROPIC_API_KEY",
  openai: "OPENAI_API_KEY",
  gemini: "GEMINI_API_KEY",
};

/** Human-readable display name for each provider (used in error messages, prompts, UI). */
export const PROVIDER_DISPLAY_NAME: Record<SupportedProvider, string> = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  gemini: "Gemini",
};
