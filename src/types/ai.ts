export const AI_PROVIDERS = [
  {
    id: "CLAUDE",
    label: "Claude",
    description: "Use Anthropic models with your API key.",
    kind: "api-key",
  },
  {
    id: "GPT",
    label: "OpenAI",
    description: "Use OpenAI models with an OpenAI API key.",
    kind: "api-key",
  },
  {
    id: "OPENROUTER",
    label: "OpenRouter",
    description: "Route models through your OpenRouter account.",
    kind: "api-key",
  },
  {
    id: "ZAI",
    label: "Z.Ai",
    description: "Use Z.Ai models with your API key.",
    kind: "api-key",
  },
  {
    id: "XAI",
    label: "xAI",
    description: "Use xAI models with your API key.",
    kind: "api-key",
  },
] as const;

export type AiProviderConfig = (typeof AI_PROVIDERS)[number];
export type AiProvider = AiProviderConfig["id"];

export type AiProviderConnection = {
  provider: AiProvider;
  connected: boolean;
  keyHint: string | null;
  updatedAt: string;
};

export function isAiProvider(value: unknown): value is AiProvider {
  return typeof value === "string" && AI_PROVIDERS.some(provider => provider.id === value);
}
