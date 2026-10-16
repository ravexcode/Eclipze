import type { ErdColumnType } from "@/types/erd";
import type { DatabaseProvider, DatabaseProviderConfig } from "@/types/database-connections";

export const DATABASE_PROVIDERS: readonly DatabaseProviderConfig[] = [
  {
    id: "SUPABASE",
    label: "Supabase",
    description: "Connect your Supabase account with a personal access token.",
    credentialLabel: "Personal access token",
    credentialPlaceholder: "sbp_…",
    credentialHelp: "Create a token in Supabase under Account → Access Tokens.",
    credentialHelpUrl: "https://supabase.com/dashboard/account/tokens",
    needsBaseUrl: false,
    isSql: true,
  },
  {
    id: "PRISMA",
    label: "Prisma Postgres",
    description: "Connect your Prisma Data Platform workspace with a service token.",
    credentialLabel: "Service token",
    credentialPlaceholder: "Paste your workspace service token",
    credentialHelp: "Create a service token in Prisma Console under your workspace settings.",
    credentialHelpUrl: "https://console.prisma.io",
    needsBaseUrl: false,
    isSql: true,
  },
  {
    id: "MONGODB",
    label: "MongoDB",
    description: "Connect a MongoDB cluster with its connection string.",
    credentialLabel: "Connection string",
    credentialPlaceholder: "mongodb+srv://user:password@cluster.example.mongodb.net",
    credentialHelp: "Copy the driver connection string from Atlas under Connect → Drivers. Allow this server in the cluster's IP access list.",
    credentialHelpUrl: "https://www.mongodb.com/docs/atlas/connect-to-database-deployment/",
    needsBaseUrl: false,
    isSql: false,
  },
  {
    id: "NEON",
    label: "Neon",
    description: "Connect your Neon account with an API key.",
    credentialLabel: "API key",
    credentialPlaceholder: "napi_…",
    credentialHelp: "Create an organization API key in Neon under Organization settings → API keys.",
    credentialHelpUrl: "https://console.neon.tech/app/settings/api-keys",
    needsBaseUrl: false,
    isSql: true,
  },
  {
    id: "INSFORGE",
    label: "InsForge",
    description: "Connect an InsForge project with its URL and admin API key.",
    credentialLabel: "Admin API key",
    credentialPlaceholder: "ik_…",
    credentialHelp: "Copy the project URL and API key from your InsForge dashboard.",
    credentialHelpUrl: "https://insforge.dev",
    needsBaseUrl: true,
    isSql: true,
  },
];

export const DATABASE_PROVIDER_IDS = DATABASE_PROVIDERS.map(provider => provider.id);

export const DATABASE_PROVIDER_LABELS = Object.fromEntries(
  DATABASE_PROVIDERS.map(provider => [provider.id, provider.label]),
) as Record<DatabaseProvider, string>;

export const DATABASE_PRIVATE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
};

// Provider APIs.
export const SUPABASE_API_URL = "https://api.supabase.com/v1";
export const NEON_API_URL = "https://console.neon.tech/api/v2";
export const PRISMA_API_URL = "https://api.prisma.io/v1";
export const INSFORGE_RAW_SQL_PATH = "/api/database/advance/rawsql";
// Relaxed mode can read pg_catalog; Eclipse uses it only for its fixed, read-only introspection query.
export const INSFORGE_UNRESTRICTED_RAW_SQL_PATH = "/api/database/advance/rawsql/unrestricted";

export const DATABASE_REQUEST_TIMEOUT_MS = 20_000;
export const DATABASE_CONNECT_TIMEOUT_MS = 10_000;
export const DATABASE_STATEMENT_TIMEOUT_MS = 30_000;
export const DATABASE_PROJECT_LIST_LIMIT = 100;
export const DATABASE_MAX_CREDENTIAL_LENGTH = 4_000;
export const DATABASE_MAX_STATEMENTS = 50;
export const DATABASE_MAX_STATEMENT_LENGTH = 20_000;

export const POSTGRES_SCHEMA = "public";

// Tables managed by migration tooling are hidden from diagrams and change reviews.
export const POSTGRES_IGNORED_TABLES = new Set(["_prisma_migrations"]);

export const MONGODB_SYSTEM_DATABASES = new Set(["admin", "config", "local"]);
export const MONGODB_ALLOWED_COMMANDS = new Set(["create", "collMod", "drop", "createIndexes", "dropIndexes"]);
export const MONGODB_INSPECT_SAMPLE_SIZE = 20;

// Maps information_schema data types to the closest ERD column type; unknown types read as String.
export const POSTGRES_ERD_TYPES: Record<string, ErdColumnType> = {
  "text": "String",
  "character varying": "String",
  "character": "String",
  "uuid": "String",
  "citext": "String",
  "smallint": "Int",
  "integer": "Int",
  "bigint": "BigInt",
  "real": "Float",
  "double precision": "Float",
  "numeric": "Decimal",
  "boolean": "Boolean",
  "date": "DateTime",
  "timestamp without time zone": "DateTime",
  "timestamp with time zone": "DateTime",
  "time without time zone": "DateTime",
  "time with time zone": "DateTime",
  "json": "Json",
  "jsonb": "Json",
  "bytea": "Bytes",
};

export const MONGODB_BSON_TYPES: Record<ErdColumnType, string> = {
  String: "string",
  Int: "int",
  BigInt: "long",
  Float: "double",
  Decimal: "decimal",
  Boolean: "bool",
  DateTime: "date",
  Json: "object",
  Bytes: "binData",
};

export const MONGODB_ERD_TYPES: Record<string, ErdColumnType> = {
  string: "String",
  objectId: "String",
  int: "Int",
  long: "BigInt",
  double: "Float",
  decimal: "Decimal",
  bool: "Boolean",
  date: "DateTime",
  timestamp: "DateTime",
  object: "Json",
  array: "Json",
  binData: "Bytes",
};

// One read-only query returns columns, single-column unique/primary indexes, and foreign keys as JSON.
export const POSTGRES_INTROSPECTION_QUERY = `
SELECT json_build_object(
  'columns', (
    SELECT COALESCE(json_agg(json_build_object(
      'table', c.table_name,
      'column', c.column_name,
      'dataType', c.data_type,
      'isNullable', c.is_nullable = 'YES'
    ) ORDER BY c.table_name, c.ordinal_position), '[]'::json)
    FROM information_schema.columns c
    JOIN information_schema.tables t
      ON t.table_schema = c.table_schema AND t.table_name = c.table_name
    WHERE c.table_schema = '${POSTGRES_SCHEMA}' AND t.table_type = 'BASE TABLE'
  ),
  'indexes', (
    SELECT COALESCE(json_agg(json_build_object(
      'table', tbl.relname,
      'column', att.attname,
      'isPrimary', idx.indisprimary,
      'columnCount', idx.indnatts
    )), '[]'::json)
    FROM pg_index idx
    JOIN pg_class tbl ON tbl.oid = idx.indrelid
    JOIN pg_namespace ns ON ns.oid = tbl.relnamespace
    JOIN pg_attribute att ON att.attrelid = tbl.oid AND att.attnum = ANY(idx.indkey)
    WHERE ns.nspname = '${POSTGRES_SCHEMA}' AND (idx.indisprimary OR idx.indisunique)
  ),
  'foreignKeys', (
    SELECT COALESCE(json_agg(json_build_object(
      'name', con.conname,
      'table', src.relname,
      'column', src_att.attname,
      'referencedTable', dst.relname,
      'referencedColumn', dst_att.attname
    )), '[]'::json)
    FROM pg_constraint con
    JOIN pg_class src ON src.oid = con.conrelid
    JOIN pg_class dst ON dst.oid = con.confrelid
    JOIN pg_namespace ns ON ns.oid = src.relnamespace
    JOIN pg_attribute src_att ON src_att.attrelid = src.oid AND src_att.attnum = con.conkey[1]
    JOIN pg_attribute dst_att ON dst_att.attrelid = dst.oid AND dst_att.attnum = con.confkey[1]
    WHERE ns.nspname = '${POSTGRES_SCHEMA}' AND con.contype = 'f' AND array_length(con.conkey, 1) = 1
  )
) AS schema`;
