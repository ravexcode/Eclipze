import "server-only";

import {
  ANTHROPIC_API_VERSION,
  ANTHROPIC_MAX_OUTPUT_TOKENS,
  ANTHROPIC_MESSAGES_URL,
  CURSOR_API_URL,
  CURSOR_MAX_WAIT_MS,
  CURSOR_POLL_INTERVAL_MS,
  OPENAI_CHAT_COMPLETIONS_URL,
  OPENAI_MAX_OUTPUT_TOKENS,
  OPENROUTER_CHAT_COMPLETIONS_URL,
  OPENROUTER_MAX_OUTPUT_TOKENS,
  PROVIDER_LABELS,
} from "@/constants/agent-providers";
import { DEFAULT_AGENT_REASONING_EFFORT } from "@/constants/agents";
import type { AiProvider } from "@/types/ai";

export type ChatMessage = Record<string, unknown>;

export type ChatToolCall = {
  id?: string;
  function?: { name?: string; arguments?: string };
};

export type ChatCompletionResult = {
  content: unknown;
  toolCalls: ChatToolCall[];
  costUsd: number | null;
  inputTokens: number | null;
  outputTokens: number | null;
};

type ChatCompletionInput = {
  provider: AiProvider;
  apiKey: string;
  model: string;
  userId: string;
  messages: ChatMessage[];
  tools?: Array<{ function: { name: string; description: string; parameters: unknown } }>;
};

function readFiniteNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function describeProviderFailure(provider: AiProvider, status: number) {
  const label = PROVIDER_LABELS[provider];

  if (status === 401 || status === 403) return `${label} rejected the saved API key. Reconnect it in Settings.`;
  if (status === 429) return `${label} rate limit reached. Try again shortly.`;
  return `${label} could not complete this task.`;
}

async function postJson(input: {
  provider: AiProvider;
  url: string;
  headers: Record<string, string>;
  body: unknown;
}) {
  let response: Response;

  try {
    response = await fetch(input.url, {
      method: "POST",
      headers: { ...input.headers, "Content-Type": "application/json" },
      body: JSON.stringify(input.body),
      cache: "no-store",
      signal: AbortSignal.timeout(60_000),
    });
  } catch {
    throw new Error(`Unable to reach ${PROVIDER_LABELS[input.provider]}. Try again in a moment.`);
  }

  if (!response.ok) {
    throw new Error(describeProviderFailure(input.provider, response.status));
  }

  return response.json() as Promise<Record<string, unknown>>;
}

async function requestOpenAiCompatible(input: ChatCompletionInput): Promise<ChatCompletionResult> {
  const isOpenRouter = input.provider === "OPENROUTER";
  const payload = await postJson({
    provider: input.provider,
    url: isOpenRouter ? OPENROUTER_CHAT_COMPLETIONS_URL : OPENAI_CHAT_COMPLETIONS_URL,
    headers: { Authorization: `Bearer ${input.apiKey}` },
    body: {
      model: input.model,
      messages: input.messages,
      user: input.userId,
      ...(input.tools ? { tools: input.tools, tool_choice: "auto" } : {}),
      ...(isOpenRouter
        ? {
            max_tokens: OPENROUTER_MAX_OUTPUT_TOKENS,
            reasoning: { effort: DEFAULT_AGENT_REASONING_EFFORT },
            usage: { include: true },
          }
        : { max_completion_tokens: OPENAI_MAX_OUTPUT_TOKENS }),
    },
  }) as {
    choices?: Array<{
      message?: { content?: unknown; tool_calls?: ChatToolCall[] };
    }>;
    usage?: { cost?: unknown; prompt_tokens?: unknown; completion_tokens?: unknown };
  };

  const message = payload.choices?.[0]?.message;
  const cost = readFiniteNumber(payload.usage?.cost);

  return {
    content: message?.content ?? null,
    toolCalls: Array.isArray(message?.tool_calls) ? message.tool_calls : [],
    costUsd: cost !== null && cost >= 0 ? cost : null,
    inputTokens: readFiniteNumber(payload.usage?.prompt_tokens),
    outputTokens: readFiniteNumber(payload.usage?.completion_tokens),
  };
}

function toAnthropicMessages(messages: ChatMessage[]) {
  const converted: Array<{ role: "user" | "assistant"; content: unknown }> = [];

  for (const message of messages) {
    if (message.role === "user") {
      converted.push({ role: "user", content: String(message.content ?? "") });
      continue;
    }

    if (message.role === "assistant") {
      const blocks: Array<Record<string, unknown>> = [];
      if (typeof message.content === "string" && message.content.trim()) {
        blocks.push({ type: "text", text: message.content });
      }

      const toolCalls = Array.isArray(message.tool_calls) ? message.tool_calls as ChatToolCall[] : [];
      for (const toolCall of toolCalls) {
        let toolInput: unknown = {};
        try {
          toolInput = JSON.parse(toolCall.function?.arguments ?? "{}");
        } catch {
          toolInput = {};
        }
        blocks.push({
          type: "tool_use",
          id: toolCall.id,
          name: toolCall.function?.name,
          input: toolInput,
        });
      }

      converted.push({ role: "assistant", content: blocks });
      continue;
    }

    if (message.role === "tool") {
      const toolResult = {
        type: "tool_result",
        tool_use_id: message.tool_call_id,
        content: String(message.content ?? ""),
      };
      const previous = converted.at(-1);
      const canMerge = previous?.role === "user" && Array.isArray(previous.content);

      if (canMerge) {
        (previous.content as unknown[]).push(toolResult);
      } else {
        converted.push({ role: "user", content: [toolResult] });
      }
    }
  }

  return converted;
}

async function requestAnthropic(input: ChatCompletionInput): Promise<ChatCompletionResult> {
  const systemMessage = input.messages.find(message => message.role === "system");
  const payload = await postJson({
    provider: input.provider,
    url: ANTHROPIC_MESSAGES_URL,
    headers: {
      "x-api-key": input.apiKey,
      "anthropic-version": ANTHROPIC_API_VERSION,
    },
    body: {
      model: input.model,
      max_tokens: ANTHROPIC_MAX_OUTPUT_TOKENS,
      system: String(systemMessage?.content ?? ""),
      messages: toAnthropicMessages(input.messages.filter(message => message.role !== "system")),
      ...(input.tools
        ? {
            tools: input.tools.map(tool => ({
              name: tool.function.name,
              description: tool.function.description,
              input_schema: tool.function.parameters,
            })),
            tool_choice: { type: "auto" },
          }
        : {}),
    },
  }) as {
    content?: Array<{ type?: string; text?: string; id?: string; name?: string; input?: unknown }>;
    usage?: { input_tokens?: unknown; output_tokens?: unknown };
  };

  const blocks = Array.isArray(payload.content) ? payload.content : [];

  return {
    content: blocks
      .filter(block => block.type === "text" && typeof block.text === "string")
      .map(block => block.text)
      .join("\n"),
    toolCalls: blocks
      .filter(block => block.type === "tool_use")
      .map(block => ({
        id: block.id,
        function: { name: block.name, arguments: JSON.stringify(block.input ?? {}) },
      })),
    costUsd: null,
    inputTokens: readFiniteNumber(payload.usage?.input_tokens),
    outputTokens: readFiniteNumber(payload.usage?.output_tokens),
  };
}

export async function requestChatCompletion(input: ChatCompletionInput) {
  if (input.provider === "CLAUDE") return requestAnthropic(input);
  if (input.provider === "OPENROUTER" || input.provider === "GPT") return requestOpenAiCompatible(input);

  throw new Error(`${PROVIDER_LABELS[input.provider]} is not available for agent tasks.`);
}

export function getCursorAuthorization(apiKey: string) {
  return `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`;
}

async function requestCursor(input: {
  apiKey: string;
  path: string;
  method?: "GET" | "POST";
  body?: unknown;
}) {
  let response: Response;

  try {
    response = await fetch(`${CURSOR_API_URL}${input.path}`, {
      method: input.method ?? "GET",
      headers: {
        Authorization: getCursorAuthorization(input.apiKey),
        "Content-Type": "application/json",
      },
      body: input.body ? JSON.stringify(input.body) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    throw new Error("Unable to reach Cursor. Try again in a moment.");
  }

  if (!response.ok) throw new Error(describeProviderFailure("CURSOR", response.status));

  return response.json() as Promise<Record<string, unknown>>;
}

export async function runCursorAgent(input: {
  apiKey: string;
  model: string;
  prompt: string;
  repositoryUrl: string;
  branch: string;
  isCancelled(): Promise<boolean>;
}) {
  const launched = await requestCursor({
    apiKey: input.apiKey,
    path: "/agents",
    method: "POST",
    body: {
      prompt: { text: input.prompt },
      ...(input.model && input.model !== "default" ? { model: input.model } : {}),
      source: { repository: input.repositoryUrl, ref: input.branch },
      target: { autoCreatePr: false },
    },
  });
  const agentId = typeof launched.id === "string" ? launched.id : "";
  if (!agentId) throw new Error("Cursor did not start an agent for this task.");

  const deadline = Date.now() + CURSOR_MAX_WAIT_MS;
  while (Date.now() < deadline) {
    if (await input.isCancelled()) {
      await requestCursor({ apiKey: input.apiKey, path: `/agents/${agentId}/stop`, method: "POST" }).catch(() => undefined);
      throw new Error("Task cancelled.");
    }

    await new Promise(resolve => setTimeout(resolve, CURSOR_POLL_INTERVAL_MS));
    const agent = await requestCursor({ apiKey: input.apiKey, path: `/agents/${agentId}` });

    if (agent.status === "FINISHED") {
      const conversation = await requestCursor({ apiKey: input.apiKey, path: `/agents/${agentId}/conversation` });
      const messages = Array.isArray(conversation.messages) ? conversation.messages as Array<Record<string, unknown>> : [];
      const lastReply = messages.findLast(message => message.type === "assistant_message" && typeof message.text === "string");
      const summary = typeof agent.summary === "string" ? agent.summary : "";
      const answer = String(lastReply?.text ?? summary).trim();

      if (!answer) throw new Error("Cursor returned an empty response.");
      return answer;
    }

    if (agent.status === "FAILED" || agent.status === "ERROR" || agent.status === "STOPPED") {
      throw new Error("Cursor could not complete this task.");
    }
  }

  throw new Error("Cursor took too long to finish this task.");
}
