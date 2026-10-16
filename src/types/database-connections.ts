import type { ErdColumnType } from "@/types/erd";

export type DatabaseProvider = "SUPABASE" | "PRISMA" | "MONGODB" | "NEON" | "INSFORGE";

export type DatabaseProviderConfig = {
  id: DatabaseProvider;
  label: string;
  description: string;
  credentialLabel: string;
  credentialPlaceholder: string;
  credentialHelp: string;
  credentialHelpUrl: string;
  needsBaseUrl: boolean;
  isSql: boolean;
};

export type DatabaseConnectionSummary = {
  id: string;
  provider: DatabaseProvider;
  credentialHint: string | null;
  baseUrl: string | null;
  updatedAt: string;
};

export type DatabaseProject = {
  id: string;
  name: string;
  detail: string | null;
};

export type DatabaseSchemaColumn = {
  name: string;
  type: ErdColumnType;
  rawType: string;
  isNullable: boolean;
  isPrimaryKey: boolean;
  isUnique: boolean;
};

export type DatabaseSchemaTable = {
  name: string;
  columns: DatabaseSchemaColumn[];
  // MongoDB only: the $jsonSchema validator currently applied to the collection.
  validator?: Record<string, unknown> | null;
};

export type DatabaseSchemaForeignKey = {
  name: string;
  table: string;
  column: string;
  referencedTable: string;
  referencedColumn: string;
};

export type DatabaseSchema = {
  tables: DatabaseSchemaTable[];
  foreignKeys: DatabaseSchemaForeignKey[];
};

export type DatabaseTarget = {
  connectionId: string;
  projectId: string;
};
