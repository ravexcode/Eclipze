import type { AgentProvider, AiProvider } from "@/types/ai";

export type ExternalAgentProvider = Extract<AiProvider, "CLAUDE" | "GPT" | "CURSOR">;

export const EXTERNAL_AGENT_PROVIDERS: Record<ExternalAgentProvider, {
  agentName: string;
  label: string;
  defaultModel: string;
}> = {
  CLAUDE: {
    agentName: "Claude",
    label: "Claude",
    defaultModel: "claude-sonnet-5-5",
  },
  GPT: {
    agentName: "Codex",
    label: "OpenAI",
    defaultModel: "gpt-5",
  },
  CURSOR: {
    agentName: "Cursor",
    label: "Cursor",
    defaultModel: "default",
  },
};

export const PROVIDER_LABELS: Record<AgentProvider, string> = {
  CLAUDE: "Claude",
  GPT: "OpenAI",
  OPENROUTER: "OpenRouter",
  ZAI: "Z.Ai",
  XAI: "xAI",
  CURSOR: "Cursor",
  MCP: "MCP agent",
};

export const OPENAI_CHAT_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions";
export const OPENROUTER_CHAT_COMPLETIONS_URL = "https://openrouter.ai/api/v1/chat/completions";
export const ANTHROPIC_MESSAGES_URL = "https://api.anthropic.com/v1/messages";
export const ANTHROPIC_MODELS_URL = "https://api.anthropic.com/v1/models";
export const ANTHROPIC_API_VERSION = "2023-06-01";
export const CURSOR_API_URL = "https://api.cursor.com/v0";

export const OPENROUTER_MAX_OUTPUT_TOKENS = 2_048;
export const OPENAI_MAX_OUTPUT_TOKENS = 8_192;
export const ANTHROPIC_MAX_OUTPUT_TOKENS = 4_096;

export const CURSOR_POLL_INTERVAL_MS = 5_000;
export const CURSOR_MAX_WAIT_MS = 10 * 60_000;
