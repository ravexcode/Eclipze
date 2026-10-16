import "server-only";

import { resolveSrv } from "node:dns/promises";

import { MongoClient, type Document } from "mongodb";

import {
  DATABASE_CONNECT_TIMEOUT_MS,
  DATABASE_PROVIDER_LABELS,
  DATABASE_STATEMENT_TIMEOUT_MS,
  MONGODB_ALLOWED_COMMANDS,
  MONGODB_INSPECT_SAMPLE_SIZE,
  MONGODB_SYSTEM_DATABASES,
} from "@/constants/database-connections";
import { getHostAddressStatus } from "@/lib/mcp-url";
import type { DatabaseCredential, DatabaseProviderClient } from "@/lib/database-providers/types";
import type { DatabaseSchemaTable } from "@/types/database-connections";
import { readMongoSampleColumns, readMongoValidatorColumns } from "@/utils/database-connections";

const LABEL = DATABASE_PROVIDER_LABELS.MONGODB;

function readHosts(connectionString: string) {
  const match = /^mongodb(\+srv)?:\/\/(?:[^@/]*@)?([^/?]+)/.exec(connectionString);

  if (!match) throw new Error("Enter a connection string that starts with mongodb:// or mongodb+srv://.");

  return {
    isSrv: Boolean(match[1]),
    hosts: match[2].split(",").map(host => host.replace(/:\d+$/, "")),
  };
}

// Blocks connection strings that point at private networks, including hosts behind SRV records.
export async function assertPublicMongoHosts(connectionString: string) {
  const { isSrv, hosts } = readHosts(connectionString);
  const targets = isSrv
    ? (await resolveSrv(`_mongodb._tcp.${hosts[0]}`).catch(() => [])).map(record => record.name)
    : hosts;

  if (targets.length === 0) throw new Error("The MongoDB host could not be resolved.");

  for (const target of targets) {
    const status = await getHostAddressStatus(target);

    if (status === "unresolved") throw new Error("The MongoDB host could not be resolved.");
    if (status === "private") throw new Error("The MongoDB cluster must be reachable on the public internet.");
  }
}

async function withMongoClient<T>(credential: DatabaseCredential, callback: (client: MongoClient) => Promise<T>) {
  await assertPublicMongoHosts(credential.secret);

  const client = new MongoClient(credential.secret, {
    serverSelectionTimeoutMS: DATABASE_CONNECT_TIMEOUT_MS,
    connectTimeoutMS: DATABASE_CONNECT_TIMEOUT_MS,
    socketTimeoutMS: DATABASE_STATEMENT_TIMEOUT_MS,
  });

  try {
    await client.connect();
  } catch {
    await client.close().catch(() => undefined);
    throw new Error("Unable to connect to MongoDB. Check the connection string and the cluster's IP access list.");
  }

  try {
    return await callback(client);
  } finally {
    await client.close().catch(() => undefined);
  }
}

function parseCommand(statement: string) {
  let command: unknown;

  try {
    command = JSON.parse(statement);
  } catch {
    throw new Error("MongoDB statements must be JSON database commands.");
  }

  if (typeof command !== "object" || command === null || Array.isArray(command)) {
    throw new Error("MongoDB statements must be JSON objects.");
  }

  const commandName = Object.keys(command)[0];

  if (!commandName || !MONGODB_ALLOWED_COMMANDS.has(commandName)) {
    throw new Error(`Only these MongoDB commands are allowed: ${[...MONGODB_ALLOWED_COMMANDS].join(", ")}.`);
  }

  return command as Document;
}

export const mongodbProvider: DatabaseProviderClient = {
  async validate(credential) {
    await withMongoClient(credential, client => client.db("admin").command({ ping: 1 }));
  },

  async listProjects(credential) {
    return withMongoClient(credential, async client => {
      const { databases } = await client.db("admin").admin().listDatabases({ nameOnly: true });

      return databases
        .filter(database => !MONGODB_SYSTEM_DATABASES.has(database.name))
        .map(database => ({ id: database.name, name: database.name, detail: null }));
    });
  },

  async inspect(credential, projectId) {
    return withMongoClient(credential, async client => {
      const database = client.db(projectId);
      const collections = await database.listCollections({ type: "collection" }).toArray();
      const tables: DatabaseSchemaTable[] = [];

      for (const collection of collections) {
        const indexes = await database.collection(collection.name).indexes();
        const uniqueFields = new Set(indexes.flatMap(index => (
          index.unique && Object.keys(index.key).length === 1 ? Object.keys(index.key) : []
        )));
        const validator = "options" in collection ? collection.options?.validator as Record<string, unknown> | undefined : undefined;
        const columns = validator?.$jsonSchema
          ? readMongoValidatorColumns(validator, uniqueFields)
          : readMongoSampleColumns(
              await database.collection(collection.name).find({}).limit(MONGODB_INSPECT_SAMPLE_SIZE).toArray(),
              uniqueFields,
            );

        tables.push({ name: collection.name, columns, validator: validator ?? null });
      }

      return { tables, foreignKeys: [] };
    });
  },

  async execute(credential, projectId, statements) {
    const commands = statements.map(parseCommand);

    return withMongoClient(credential, async client => {
      const database = client.db(projectId);

      // MongoDB DDL commands cannot share a transaction, so they apply in order.
      for (const [index, command] of commands.entries()) {
        try {
          await database.command(command);
        } catch (error) {
          const detail = error instanceof Error ? error.message : "Command failed.";
          throw new Error(`Command ${index + 1} of ${commands.length} failed after ${index} applied: ${detail}`);
        }
      }

      return `Applied ${commands.length} MongoDB command(s).`;
    });
  },
};
