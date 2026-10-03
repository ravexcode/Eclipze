import "server-only";

import { createHash } from "node:crypto";

import { decryptApiKey } from "@/lib/ai-credentials";
import prisma from "@/lib/prisma";

export async function getOpenRouterCredential(userId: string) {
  const serviceKey = process.env.OPENROUTER_API_KEY?.trim();
  if (serviceKey) {
    return { apiKey: serviceKey, isServiceKey: true };
  }

  const connection = await prisma.aiProviderConnection.findUnique({
    where: { userId_provider: { userId, provider: "OPENROUTER" } },
    select: { encryptedApiKey: true },
  });

  if (!connection?.encryptedApiKey) return null;

  try {
    return { apiKey: decryptApiKey(connection.encryptedApiKey), isServiceKey: false };
  } catch {
    throw new Error("Unable to read the saved OpenRouter connection. Reconnect it in Settings.");
  }
}

export type OpenRouterModelPricing = {
  prompt: number;
  completion: number;
};

export type OpenRouterModel = {
  id: string;
  name: string;
  pricing: OpenRouterModelPricing;
};

const modelCache = new Map<string, { expiresAt: number; models: OpenRouterModel[] }>();

export async function getOpenRouterModels(apiKey: string, forceRefresh = false) {
  const cacheKey = createHash("sha256").update(apiKey).digest("hex");
  const cachedModels = modelCache.get(cacheKey);
  if (!forceRefresh && cachedModels && cachedModels.expiresAt > Date.now()) {
    return cachedModels.models;
  }

  const response = await fetch("https://openrouter.ai/api/v1/models", {
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(response.status === 401 || response.status === 403
      ? "OpenRouter rejected the configured API key. Check the server connection."
      : "Unable to load models from OpenRouter right now.");
  }

  const payload = await response.json() as {
    data?: Array<{
      id?: unknown;
      name?: unknown;
      pricing?: { prompt?: unknown; completion?: unknown };
    }>;
  };

  const models = (payload.data ?? []).flatMap(model => {
    if (typeof model.id !== "string") return [];
    const prompt = Number(model.pricing?.prompt);
    const completion = Number(model.pricing?.completion);
    if (!Number.isFinite(prompt) || prompt < 0 || !Number.isFinite(completion) || completion < 0) return [];

    return [{
      id: model.id,
      name: typeof model.name === "string" ? model.name : model.id,
      pricing: { prompt, completion },
    }];
  });

  modelCache.set(cacheKey, { models, expiresAt: Date.now() + 5 * 60_000 });
  return models;
}
