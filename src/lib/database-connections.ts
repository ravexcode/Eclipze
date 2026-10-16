import "server-only";

import { NextResponse } from "next/server";

import { DATABASE_PRIVATE_HEADERS, DATABASE_PROVIDER_LABELS } from "@/constants/database-connections";
import { decryptApiKey, encryptApiKey } from "@/lib/ai-credentials";
import { DATABASE_PROVIDER_CLIENTS } from "@/lib/database-providers";
import { assertPublicMongoHosts } from "@/lib/database-providers/mongodb";
import type { DatabaseCredential } from "@/lib/database-providers/types";
import { assertPublicHttpsUrl } from "@/lib/mcp-url";
import prisma from "@/lib/prisma";
import type { DatabaseConnectionSummary, DatabaseProvider } from "@/types/database-connections";
import { createCredentialHint } from "@/utils/database-connections";

type StoredConnection = {
  id: string;
  provider: DatabaseProvider;
  encryptedCredential: string;
  credentialHint: string | null;
  baseUrl: string | null;
  updatedAt: Date;
};

export function databaseJson(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: DATABASE_PRIVATE_HEADERS });
}

export function serializeDatabaseConnection(connection: StoredConnection): DatabaseConnectionSummary {
  return {
    id: connection.id,
    provider: connection.provider,
    credentialHint: connection.credentialHint,
    baseUrl: connection.baseUrl,
    updatedAt: connection.updatedAt.toISOString(),
  };
}

export function readDatabaseCredential(connection: StoredConnection): DatabaseCredential {
  try {
    return {
      provider: connection.provider,
      secret: decryptApiKey(connection.encryptedCredential),
      baseUrl: connection.baseUrl,
    };
  } catch {
    throw new Error(`Unable to read the saved ${DATABASE_PROVIDER_LABELS[connection.provider]} connection. Reconnect it.`);
  }
}

export async function findDatabaseConnection(userId: string, connectionId: string) {
  return prisma.databaseConnection.findFirst({
    where: { id: connectionId, userId },
  });
}

async function normalizeBaseUrl(provider: DatabaseProvider, baseUrl: string | null) {
  if (provider !== "INSFORGE") return null;
  if (!baseUrl) throw new Error("Enter your InsForge project URL.");

  try {
    const url = await assertPublicHttpsUrl(baseUrl);
    return url.origin;
  } catch {
    throw new Error("The InsForge project URL must be a public https URL.");
  }
}

// Validates the credential against the provider before anything is stored.
export async function connectDatabaseProvider(input: {
  userId: string;
  provider: DatabaseProvider;
  credential: string;
  baseUrl: string | null;
}) {
  if (input.provider === "MONGODB") {
    await assertPublicMongoHosts(input.credential);
  }

  const credential: DatabaseCredential = {
    provider: input.provider,
    secret: input.credential,
    baseUrl: await normalizeBaseUrl(input.provider, input.baseUrl),
  };

  await DATABASE_PROVIDER_CLIENTS[input.provider].validate(credential);

  const data = {
    encryptedCredential: encryptApiKey(credential.secret),
    credentialHint: createCredentialHint(input.provider, credential.secret),
    baseUrl: credential.baseUrl,
  };

  return prisma.databaseConnection.upsert({
    where: { userId_provider: { userId: input.userId, provider: input.provider } },
    create: { userId: input.userId, provider: input.provider, ...data },
    update: data,
  });
}
