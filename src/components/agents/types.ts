import type { AiProviderConnection } from "@/types/ai";
import type { WorkspaceAgentSession } from "@/types/user";

export type ModelOption = {
  id: string;
  label: string;
  provider: string;
  providerId: AiProviderConnection["provider"] | null;
  keyHint: string | null;
  isPrimary?: boolean;
};

export const PRIMARY_MODEL: ModelOption = {
  id: "gpt-5.6-luna-high",
  label: "GPT 5.6 Luna High",
  provider: "OpenAI",
  providerId: "GPT",
  keyHint: null,
  isPrimary: true,
};

const providerLabels: Record<AiProviderConnection["provider"], string> = {
  CLAUDE: "Claude",
  GPT: "OpenAI",
  OPENROUTER: "OpenRouter",
  ZAI: "Z.AI",
  XAI: "xAI",
};

export function getProviderLabel(provider: AiProviderConnection["provider"]) {
  return providerLabels[provider];
}

export function buildModelOptions(connections: AiProviderConnection[]) {
  const primaryConnection = connections.find(
    (connection) => connection.provider === PRIMARY_MODEL.providerId,
  );
  const primaryModel = {
    ...PRIMARY_MODEL,
    keyHint: primaryConnection?.keyHint ?? null,
  };
  const configuredModels = connections.flatMap((connection) => {
    if (!connection.model) return [];

    return [
      {
        id: connection.model,
        label: connection.model,
        provider: getProviderLabel(connection.provider),
        providerId: connection.provider,
        keyHint: connection.keyHint,
      },
    ];
  });

  return [
    primaryModel,
    ...configuredModels.filter((model) => model.id !== primaryModel.id),
  ].filter(
    (model, index, options) =>
      options.findIndex((item) => item.id === model.id) === index,
  );
}

export function formatSessionDate(value: string) {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function sessionTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function groupSessions(sessions: WorkspaceAgentSession[]) {
  return sessions.reduce<Record<string, WorkspaceAgentSession[]>>(
    (groups, session) => {
      const label = formatSessionDate(session.startedAt);
      groups[label] = [...(groups[label] ?? []), session];
      return groups;
    },
    {},
  );
}
