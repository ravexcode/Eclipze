import "server-only";

import {
  ANTHROPIC_API_VERSION,
  ANTHROPIC_MODELS_URL,
  CURSOR_API_URL,
  PROVIDER_LABELS,
} from "@/constants/agent-providers";
import { getCursorAuthorization } from "@/lib/agent-providers";
import type { AiProvider } from "@/types/ai";

export async function validateProviderApiKey(provider: "CLAUDE" | "CURSOR", apiKey: string) {
  const label = PROVIDER_LABELS[provider as AiProvider];
  const request: { url: string; headers: Record<string, string> } = provider === "CLAUDE"
    ? {
        url: ANTHROPIC_MODELS_URL,
        headers: { "x-api-key": apiKey, "anthropic-version": ANTHROPIC_API_VERSION },
      }
    : {
        url: `${CURSOR_API_URL}/me`,
        headers: { Authorization: getCursorAuthorization(apiKey) },
      };

  try {
    const response = await fetch(request.url, {
      headers: request.headers,
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });

    if (response.ok) return { valid: true as const };

    if (response.status === 401 || response.status === 403) {
      return {
        valid: false as const,
        status: 400,
        message: `${label} rejected this API key. Check the key and try again.`,
      };
    }

    return {
      valid: false as const,
      status: 502,
      message: `${label} could not verify the API key right now. Try again later.`,
    };
  } catch {
    return {
      valid: false as const,
      status: 503,
      message: `Unable to reach ${label} to verify the API key. Try again later.`,
    };
  }
}
