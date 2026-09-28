import type { AiProviderConnection } from "@/types/ai";

export type AvailableModel = {
  id: string;
  name: string;
  provider: AiProviderConnection["provider"];
};

function getReadableModelName(id: string) {
  const modelName = id.split("/").at(-1) ?? id;
  return modelName
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, character => character.toUpperCase());
}

export function getAvailableModels(
  connections: AiProviderConnection[],
  discoveredModels: AvailableModel[] = [],
) {
  const availableModels = new Map<string, AvailableModel>();

  for (const connection of connections) {
    const id = connection.model?.trim();
    if (!connection.connected || !id) continue;

    availableModels.set(id, {
      id,
      name: getReadableModelName(id),
      provider: connection.provider,
    });
  }

  for (const model of discoveredModels) {
    const id = model.id.trim();
    if (!id) continue;

    availableModels.set(id, {
      ...model,
      id,
      name: model.name.trim() || getReadableModelName(id),
    });
  }

  return Array.from(availableModels.values());
}
