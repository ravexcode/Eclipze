import "server-only";

import { Client } from "pg";

import {
  DATABASE_CONNECT_TIMEOUT_MS,
  DATABASE_STATEMENT_TIMEOUT_MS,
  POSTGRES_INTROSPECTION_QUERY,
} from "@/constants/database-connections";
import type { DatabaseSchema } from "@/types/database-connections";
import { readPostgresSchema } from "@/utils/database-connections";

async function withPostgresClient<T>(connectionString: string, label: string, callback: (client: Client) => Promise<T>) {
  const client = new Client({
    connectionString,
    connectionTimeoutMillis: DATABASE_CONNECT_TIMEOUT_MS,
    statement_timeout: DATABASE_STATEMENT_TIMEOUT_MS,
  });

  try {
    await client.connect();
  } catch {
    throw new Error(`Unable to connect to the ${label} database.`);
  }

  try {
    return await callback(client);
  } finally {
    await client.end().catch(() => undefined);
  }
}

export async function inspectPostgres(connectionString: string, label: string): Promise<DatabaseSchema> {
  return withPostgresClient(connectionString, label, async client => {
    const result = await client.query<{ schema: unknown }>(POSTGRES_INTROSPECTION_QUERY);

    return readPostgresSchema(result.rows[0]?.schema);
  });
}

// Runs every statement in one transaction so a failure leaves the database unchanged.
export async function executePostgres(connectionString: string, label: string, statements: string[]) {
  return withPostgresClient(connectionString, label, async client => {
    let affectedRows = 0;

    await client.query("BEGIN");

    try {
      for (const statement of statements) {
        const result = await client.query(statement);
        affectedRows += result.rowCount ?? 0;
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);

      const detail = error instanceof Error ? error.message : "Statement failed.";
      throw new Error(`${label} rolled back the changes: ${detail}`);
    }

    return `Applied ${statements.length} statement(s) in one transaction. Rows affected: ${affectedRows}.`;
  });
}
