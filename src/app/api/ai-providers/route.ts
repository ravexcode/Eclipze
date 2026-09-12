import { NextResponse } from "next/server";

import { encryptApiKey } from "@/lib/ai-credentials";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { AI_PROVIDERS, isAiProvider, type AiProvider } from "@/types/ai";

const PRIVATE_NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
};

const PROVIDER_LABELS: Record<AiProvider, string> = {
  CLAUDE: "Claude",
  GPT: "OpenAI",
  OPENROUTER: "OpenRouter",
  ZAI: "Z.Ai",
  XAI: "xAI",
};

async function validateOpenAiApiKey(apiKey: string) {
  try {
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });

    if (response.ok) return { valid: true as const };

    if (response.status === 401 || response.status === 403) {
      return {
        valid: false as const,
        status: 400,
        message: "OpenAI rejected this API key. Check the key and try again.",
      };
    }

    return {
      valid: false as const,
      status: 502,
      message: "OpenAI could not verify the API key right now. Try again later.",
    };
  } catch {
    return {
      valid: false as const,
      status: 503,
      message: "Unable to reach OpenAI to verify the API key. Try again later.",
    };
  }
}

function serializeConnection(connection: {
  provider: AiProvider;
  keyHint: string | null;
  updatedAt: Date;
}) {
  return {
    provider: connection.provider,
    connected: true,
    keyHint: connection.keyHint,
    updatedAt: connection.updatedAt.toISOString(),
  };
}

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401, headers: PRIVATE_NO_STORE_HEADERS });
  }

  const connections = await prisma.aiProviderConnection.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      provider: true,
      keyHint: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({
    connections: connections.flatMap(connection => {
      const provider = connection.provider as string;

      if (!isAiProvider(provider)) {
        return [];
      }

      return [serializeConnection({ ...connection, provider })];
    }),
  }, { headers: PRIVATE_NO_STORE_HEADERS });
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401, headers: PRIVATE_NO_STORE_HEADERS });
  }

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;

  if (!body || !isAiProvider(body.provider)) {
    return NextResponse.json({ message: "A valid AI provider is required." }, { status: 400 });
  }

  const provider = body.provider;
  const providerConfig = AI_PROVIDERS.find(item => item.id === provider);

  if (!providerConfig) {
    return NextResponse.json({ message: "A valid AI provider is required." }, { status: 400 });
  }

  let encryptedApiKey: string | null = null;
  let keyHint: string | null = null;

  if (providerConfig.kind === "api-key") {
    if (typeof body.apiKey !== "string") {
      return NextResponse.json({ message: "API key is required." }, { status: 400 });
    }

    const apiKey = body.apiKey.trim();

    if (!apiKey) {
      const existingConnection = await prisma.aiProviderConnection.findUnique({
        where: {
          userId_provider: {
            userId: user.id,
            provider,
          },
        },
        select: {
          provider: true,
          keyHint: true,
          updatedAt: true,
        },
      });

      if (!existingConnection) {
        return NextResponse.json({ message: "API key is required." }, { status: 400 });
      }

      return NextResponse.json({
        message: `${PROVIDER_LABELS[provider]} connection unchanged.`,
        connection: serializeConnection({ ...existingConnection, provider }),
      }, { headers: PRIVATE_NO_STORE_HEADERS });
    }

    if (apiKey.length > 500) {
      return NextResponse.json({ message: "API key is too long." }, { status: 400 });
    }

    if (provider === "GPT") {
      const validation = await validateOpenAiApiKey(apiKey);

      if (!validation.valid) {
        return NextResponse.json({ message: validation.message }, { status: validation.status });
      }
    }

    try {
      encryptedApiKey = encryptApiKey(apiKey);
    } catch (error) {
      if (error instanceof Error && error.message === "AI_CREDENTIALS_ENCRYPTION_KEY is not configured.") {
        return NextResponse.json({ message: "AI provider storage is not configured. Add AI_CREDENTIALS_ENCRYPTION_KEY." }, { status: 503 });
      }

      throw error;
    }

    keyHint = apiKey.slice(-4);
  }

  const connection = await prisma.aiProviderConnection.upsert({
    where: {
      userId_provider: {
        userId: user.id,
        provider,
      },
    },
    create: {
      userId: user.id,
      provider,
      encryptedApiKey,
      keyHint,
    },
    update: {
      encryptedApiKey,
      keyHint,
    },
    select: {
      provider: true,
      keyHint: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({
    message: `${PROVIDER_LABELS[provider]} connected successfully.`,
    connection: serializeConnection({ ...connection, provider }),
  }, { headers: PRIVATE_NO_STORE_HEADERS });
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401, headers: PRIVATE_NO_STORE_HEADERS });
  }

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;

  if (!body || !isAiProvider(body.provider)) {
    return NextResponse.json({ message: "A valid AI provider is required." }, { status: 400 });
  }

  await prisma.aiProviderConnection.deleteMany({
    where: {
      userId: user.id,
      provider: body.provider,
    },
  });

  return NextResponse.json({
    message: `${PROVIDER_LABELS[body.provider]} disconnected successfully.`,
  }, { headers: PRIVATE_NO_STORE_HEADERS });
}
