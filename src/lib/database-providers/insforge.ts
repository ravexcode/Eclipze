import "server-only";

import {
  DATABASE_PROVIDER_LABELS,
  INSFORGE_RAW_SQL_PATH,
  INSFORGE_UNRESTRICTED_RAW_SQL_PATH,
  POSTGRES_INTROSPECTION_QUERY,
} from "@/constants/database-connections";
import { requestProviderJson } from "@/lib/database-providers/http";
import type { DatabaseCredential, DatabaseProviderClient } from "@/lib/database-providers/types";
import { readPostgresSchema } from "@/utils/database-connections";

const LABEL = DATABASE_PROVIDER_LABELS.INSFORGE;

// InsForge credentials belong to one project, so the project list has a single entry.
const INSFORGE_PROJECT_ID = "default";

type RawSqlResult = { rows?: Array<Record<string, unknown>>; rowCount?: number };

function runRawSql(credential: DatabaseCredential, path: string, query: string) {
  if (!credential.baseUrl) throw new Error("This InsForge connection is missing its project URL.");

  return requestProviderJson<RawSqlResult>({
    label: LABEL,
    url: new URL(path, credential.baseUrl).toString(),
    token: credential.secret,
    method: "POST",
    body: { query },
  });
}

export const insforgeProvider: DatabaseProviderClient = {
  async validate(credential) {
    await runRawSql(credential, INSFORGE_RAW_SQL_PATH, "SELECT 1");
  },

  async listProjects(credential) {
    return [{
      id: INSFORGE_PROJECT_ID,
      name: credential.baseUrl ? new URL(credential.baseUrl).hostname : LABEL,
      detail: null,
    }];
  },

  async inspect(credential) {
    const result = await runRawSql(credential, INSFORGE_UNRESTRICTED_RAW_SQL_PATH, POSTGRES_INTROSPECTION_QUERY);

    return readPostgresSchema(result.rows?.[0]?.schema);
  },

  async execute(credential, _projectId, statements) {
    let affectedRows = 0;

    // The raw SQL endpoint runs one statement per request, so statements apply in order without a shared transaction.
    for (const [index, statement] of statements.entries()) {
      try {
        const result = await runRawSql(credential, INSFORGE_RAW_SQL_PATH, statement);
        affectedRows += result.rowCount ?? 0;
      } catch (error) {
        const detail = error instanceof Error ? error.message : "Statement failed.";
        throw new Error(`Statement ${index + 1} of ${statements.length} failed after ${index} applied: ${detail}`);
      }
    }

    return `Applied ${statements.length} statement(s). Rows affected: ${affectedRows}.`;
  },
};
