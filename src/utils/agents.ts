import type { AiProviderConnection } from "@/types/ai";

export function getAvailableModels(connections: AiProviderConnection[]) {
  return Array.from(
    new Set(
      connections
        .filter(connection => connection.connected)
        .map(connection => connection.model?.trim() ?? "")
        .filter(Boolean),
    ),
  );
}
