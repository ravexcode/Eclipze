import {
  MONGODB_BSON_TYPES,
  MONGODB_ERD_TYPES,
  POSTGRES_ERD_TYPES,
  POSTGRES_IGNORED_TABLES,
} from "@/constants/database-connections";
import type {
  DatabaseProvider,
  DatabaseSchema,
  DatabaseSchemaColumn,
  DatabaseSchemaTable,
} from "@/types/database-connections";
import type { ErdColumnType, ErdTable } from "@/types/erd";

type PostgresColumnRow = {
  table: string;
  column: string;
  dataType: string;
  isNullable: boolean;
};

type PostgresIndexRow = {
  table: string;
  column: string;
  isPrimary: boolean;
  columnCount: number;
};

type PostgresForeignKeyRow = {
  name: string;
  table: string;
  column: string;
  referencedTable: string;
  referencedColumn: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value.filter(isRecord) as T[] : [];
}

// Credentials

export function createCredentialHint(provider: DatabaseProvider, credential: string) {
  if (provider === "MONGODB") {
    try {
      return new URL(credential).hostname || null;
    } catch {
      return null;
    }
  }

  return credential.length > 8 ? `…${credential.slice(-4)}` : null;
}

// Postgres

export function mapPostgresType(dataType: string): ErdColumnType {
  return POSTGRES_ERD_TYPES[dataType.toLowerCase()] ?? "String";
}

// Reads the JSON produced by POSTGRES_INTROSPECTION_QUERY.
export function readPostgresSchema(value: unknown): DatabaseSchema {
  const raw = typeof value === "string" ? JSON.parse(value) as unknown : value;

  if (!isRecord(raw)) {
    throw new Error("The database returned an unreadable schema.");
  }

  const columns = readArray<PostgresColumnRow>(raw.columns);
  const indexes = readArray<PostgresIndexRow>(raw.indexes);
  const foreignKeys = readArray<PostgresForeignKeyRow>(raw.foreignKeys);
  const tables = new Map<string, DatabaseSchemaTable>();

  for (const row of columns) {
    if (POSTGRES_IGNORED_TABLES.has(row.table)) continue;

    const table = tables.get(row.table) ?? { name: row.table, columns: [] };
    const tableIndexes = indexes.filter(index => index.table === row.table && index.column === row.column);

    table.columns.push({
      name: row.column,
      type: mapPostgresType(row.dataType),
      rawType: row.dataType,
      isNullable: row.isNullable,
      isPrimaryKey: tableIndexes.some(index => index.isPrimary),
      isUnique: tableIndexes.some(index => !index.isPrimary && Number(index.columnCount) === 1),
    });
    tables.set(row.table, table);
  }

  return {
    tables: [...tables.values()],
    foreignKeys: foreignKeys.filter(foreignKey => tables.has(foreignKey.table)),
  };
}

// MongoDB

export function createMongoValidator(table: ErdTable) {
  const properties: Record<string, unknown> = {};
  const required: string[] = [];

  for (const column of table.columns) {
    const bsonType = MONGODB_BSON_TYPES[column.type];
    const isNullable = column.isNullable && !column.isPrimaryKey;

    properties[column.name] = {
      bsonType: isNullable ? [bsonType, "null"] : bsonType,
    };

    if (!isNullable) {
      required.push(column.name);
    }
  }

  return {
    $jsonSchema: {
      bsonType: "object",
      ...(required.length > 0 ? { required } : {}),
      properties,
    },
  };
}

export function readMongoValidatorColumns(validator: unknown, uniqueFields: Set<string>): DatabaseSchemaColumn[] {
  const jsonSchema = isRecord(validator) && isRecord(validator.$jsonSchema) ? validator.$jsonSchema : null;
  const properties = jsonSchema && isRecord(jsonSchema.properties) ? jsonSchema.properties : {};
  const required = new Set(Array.isArray(jsonSchema?.required) ? jsonSchema.required as string[] : []);

  return Object.entries(properties).map(([name, definition]) => {
    const declaredTypes = isRecord(definition) ? definition.bsonType : undefined;
    const types = Array.isArray(declaredTypes) ? declaredTypes : [declaredTypes];
    const mainType = types.find(type => typeof type === "string" && type !== "null");

    return {
      name,
      type: MONGODB_ERD_TYPES[String(mainType)] ?? "String",
      rawType: types.filter(Boolean).join(" | "),
      isNullable: !required.has(name) || types.includes("null"),
      isPrimaryKey: name === "_id",
      isUnique: uniqueFields.has(name),
    };
  });
}

export function readMongoSampleColumns(documents: Record<string, unknown>[], uniqueFields: Set<string>): DatabaseSchemaColumn[] {
  const columns = new Map<string, DatabaseSchemaColumn>();

  for (const document of documents) {
    for (const [name, value] of Object.entries(document)) {
      if (columns.has(name)) continue;

      const type = describeMongoValue(value);

      columns.set(name, {
        name,
        type: MONGODB_ERD_TYPES[type] ?? "String",
        rawType: type,
        isNullable: value === null,
        isPrimaryKey: name === "_id",
        isUnique: uniqueFields.has(name),
      });
    }
  }

  return [...columns.values()];
}

function describeMongoValue(value: unknown) {
  if (value === null || value === undefined) return "null";
  if (typeof value === "string") return "string";
  if (typeof value === "boolean") return "bool";
  if (typeof value === "number") return Number.isInteger(value) ? "int" : "double";
  if (typeof value === "bigint") return "long";
  if (value instanceof Date) return "date";
  if (Array.isArray(value)) return "array";

  const bsonType = isRecord(value) ? value._bsontype : undefined;

  if (bsonType === "ObjectId") return "objectId";
  if (bsonType === "Decimal128") return "decimal";
  if (bsonType === "Long") return "long";
  if (bsonType === "Double") return "double";
  if (bsonType === "Int32") return "int";
  if (bsonType === "Binary") return "binData";
  if (bsonType === "Timestamp") return "timestamp";

  return "object";
}
