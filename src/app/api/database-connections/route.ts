import { getCurrentUser } from "@/lib/auth";
import { DATABASE_MAX_CREDENTIAL_LENGTH, DATABASE_PROVIDER_IDS } from "@/constants/database-connections";
import {
  connectDatabaseProvider,
  databaseJson,
  serializeDatabaseConnection,
} from "@/lib/database-connections";
import { erdAccessError } from "@/lib/erd";
import prisma from "@/lib/prisma";
import { enumString, parseBody, requiredString } from "@/lib/workspace-api";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return databaseJson({ message: "Unauthorized" }, 401);
  }

  const accessError = erdAccessError(user);

  if (accessError) {
    return accessError;
  }

  const connections = await prisma.databaseConnection.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });

  return databaseJson({
    connections: connections.map(serializeDatabaseConnection),
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return databaseJson({ message: "Unauthorized" }, 401);
  }

  const accessError = erdAccessError(user);

  if (accessError) {
    return accessError;
  }

  const body = await parseBody(request);

  if (!body) {
    return databaseJson({ message: "Invalid JSON body." }, 400);
  }

  const provider = enumString(body.provider, DATABASE_PROVIDER_IDS, "provider");

  if (provider.error) return provider.error;

  const credential = requiredString(body.credential, "credential");

  if (credential.error) return credential.error;

  if (credential.value.length > DATABASE_MAX_CREDENTIAL_LENGTH) {
    return databaseJson({ message: "The credential is too long." }, 400);
  }

  const baseUrl = typeof body.baseUrl === "string" && body.baseUrl.trim()
    ? body.baseUrl.trim()
    : null;

  try {
    const connection = await connectDatabaseProvider({
      userId: user.id,
      provider: provider.value,
      credential: credential.value.trim(),
      baseUrl,
    });

    return databaseJson({
      message: "Database account connected.",
      connection: serializeDatabaseConnection(connection),
    }, 201);
  } catch (error) {
    return databaseJson({
      message: error instanceof Error ? error.message : "Unable to verify the credential.",
    }, 400);
  }
}
