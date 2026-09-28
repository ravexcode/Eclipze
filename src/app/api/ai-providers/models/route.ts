import { NextResponse } from "next/server";

import { decryptApiKey } from "@/lib/ai-credentials";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

const PRIVATE_NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
};

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401, headers: PRIVATE_NO_STORE_HEADERS },
    );
  }

  const connection = await prisma.aiProviderConnection.findUnique({
    where: {
      userId_provider: {
        userId: user.id,
        provider: "OPENROUTER",
      },
    },
    select: { encryptedApiKey: true },
  });

  if (!connection?.encryptedApiKey) {
    return NextResponse.json(
      { message: "Connect your OpenRouter API key in Settings first." },
      { status: 404, headers: PRIVATE_NO_STORE_HEADERS },
    );
  }

  let apiKey: string;

  try {
    apiKey = decryptApiKey(connection.encryptedApiKey);
  } catch {
    return NextResponse.json(
      { message: "Unable to read the saved OpenRouter connection." },
      { status: 503, headers: PRIVATE_NO_STORE_HEADERS },
    );
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          message: response.status === 401 || response.status === 403
            ? "OpenRouter rejected the saved API key. Reconnect it in Settings."
            : "Unable to load models from OpenRouter right now.",
        },
        { status: response.status === 401 || response.status === 403 ? 502 : 503, headers: PRIVATE_NO_STORE_HEADERS },
      );
    }

    const payload = await response.json() as {
      data?: Array<{ id?: unknown; name?: unknown }>;
    };
    const models = Array.isArray(payload.data)
      ? Array.from(
          new Map(
            payload.data.flatMap(model => typeof model.id === "string"
              ? [[model.id, {
                  id: model.id,
                  name: typeof model.name === "string" ? model.name : model.id,
                  provider: "OPENROUTER" as const,
                }] as const]
              : []),
          ).values(),
        )
      : [];

    return NextResponse.json({ models }, { headers: PRIVATE_NO_STORE_HEADERS });
  } catch {
    return NextResponse.json(
      { message: "Unable to reach OpenRouter right now." },
      { status: 503, headers: PRIVATE_NO_STORE_HEADERS },
    );
  }
}
