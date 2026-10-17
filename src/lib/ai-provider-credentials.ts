import "server-only";

import { decryptApiKey } from "@/lib/ai-credentials";
import { getOpenRouterCredential } from "@/lib/openrouter";
import prisma from "@/lib/prisma";
import { PROVIDER_LABELS } from "@/constants/agent-providers";
import type { AiProvider } from "@/types/ai";

export async function getProviderApiKey(userId: string, provider: AiProvider) {
  const connection = await prisma.aiProviderConnection.findUnique({
    where: { userId_provider: { userId, provider } },
    select: { encryptedApiKey: true },
  });

  if (!connection?.encryptedApiKey) return null;

  try {
    return decryptApiKey(connection.encryptedApiKey);
  } catch {
    throw new Error(`Unable to read the saved ${PROVIDER_LABELS[provider]} connection. Reconnect it in Settings.`);
  }
}

// OpenRouter may resolve to the Eclipse service key; other providers use the user's saved key.
export async function getProviderCredential(userId: string, provider: AiProvider) {
  if (provider === "OPENROUTER") return getOpenRouterCredential(userId);

  const apiKey = await getProviderApiKey(userId, provider);
  return apiKey ? { apiKey, isServiceKey: false } : null;
}
