export type SupportedProvider = "anthropic" | "openai";

export const SUPPORTED_PROVIDERS: readonly SupportedProvider[] = ["anthropic", "openai"] as const;

export const DEFAULT_PROVIDER: SupportedProvider = "anthropic";
