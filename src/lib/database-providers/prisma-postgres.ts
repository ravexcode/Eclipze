import "server-only";

import {
  DATABASE_PROJECT_LIST_LIMIT,
  DATABASE_PROVIDER_LABELS,
  PRISMA_API_URL,
} from "@/constants/database-connections";
import { executePostgres, inspectPostgres } from "@/lib/database-providers/postgres";
import { requestProviderJson } from "@/lib/database-providers/http";
import type { DatabaseCredential, DatabaseProviderClient } from "@/lib/database-providers/types";

const LABEL = DATABASE_PROVIDER_LABELS.PRISMA;

type PrismaDatabase = {
  id: string;
  name: string;
  status?: string;
  region?: { name?: string } | string | null;
  project?: { name?: string };
};

type PrismaConnection = {
  id: string;
  endpoints?: { direct?: { connectionString?: string } };
};

// Prisma only returns connection secrets on creation, so each operation uses a short-lived connection.
async function withTemporaryConnection<T>(
  credential: DatabaseCredential,
  databaseId: string,
  callback: (connectionString: string) => Promise<T>,
) {
  const { data: connection } = await requestProviderJson<{ data: PrismaConnection }>({
    label: LABEL,
    url: `${PRISMA_API_URL}/databases/${encodeURIComponent(databaseId)}/connections`,
    token: credential.secret,
    method: "POST",
    body: { name: `eclipse-erd-${Date.now()}` },
  });
  const connectionString = connection?.endpoints?.direct?.connectionString;

  try {
    if (!connectionString) throw new Error("Prisma did not return a direct connection string.");

    return await callback(connectionString);
  } finally {
    if (connection?.id) {
      await requestProviderJson({
        label: LABEL,
        url: `${PRISMA_API_URL}/connections/${encodeURIComponent(connection.id)}`,
        token: credential.secret,
        method: "DELETE",
      }).catch(() => undefined);
    }
  }
}

export const prismaPostgresProvider: DatabaseProviderClient = {
  async validate(credential) {
    await requestProviderJson({
      label: LABEL,
      url: `${PRISMA_API_URL}/projects?limit=1`,
      token: credential.secret,
    });
  },

  async listProjects(credential) {
    const { data } = await requestProviderJson<{ data?: PrismaDatabase[] }>({
      label: LABEL,
      url: `${PRISMA_API_URL}/databases?limit=${DATABASE_PROJECT_LIST_LIMIT}`,
      token: credential.secret,
    });

    return (data ?? []).map(database => ({
      id: database.id,
      name: database.project?.name ? `${database.project.name} / ${database.name}` : database.name,
      detail: database.status ?? null,
    }));
  },

  async inspect(credential, projectId) {
    return withTemporaryConnection(credential, projectId, connectionString => inspectPostgres(connectionString, LABEL));
  },

  async execute(credential, projectId, statements) {
    return withTemporaryConnection(credential, projectId, connectionString => executePostgres(connectionString, LABEL, statements));
  },
};
