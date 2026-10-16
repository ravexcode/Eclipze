import { NextResponse } from "next/server";

import {
  ERD_CARDINALITIES,
  ERD_COLUMN_TYPES,
  ERD_EMPTY_DOCUMENT,
  ERD_MAX_COLUMNS_PER_TABLE,
  ERD_MAX_COORDINATE,
  ERD_MAX_ID_LENGTH,
  ERD_MAX_NAME_LENGTH,
  ERD_MAX_RELATIONS,
  ERD_MAX_TABLES,
  ERD_NAME_PATTERN,
  ERD_PRIVATE_HEADERS,
} from "@/constants/erd";
import type {
  ErdCardinality,
  ErdColumn,
  ErdColumnType,
  ErdDocument,
  ErdRelation,
  ErdTable,
} from "@/types/erd";
import type { UserPlan, UserRole } from "@/types/user";
import { canAccessErd } from "@/utils/erd";

type ParseResult<T> = { value: T; error?: never } | { value?: never; error: string };

export function erdJson(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: ERD_PRIVATE_HEADERS });
}

export function erdAccessError(user: { role: UserRole; plan: UserPlan }) {
  if (!canAccessErd(user)) {
    return erdJson({ message: "ERD requires a developer account on a paid plan." }, 403);
  }

  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidId(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= ERD_MAX_ID_LENGTH;
}

function isValidName(value: unknown): value is string {
  return typeof value === "string"
    && value.length <= ERD_MAX_NAME_LENGTH
    && ERD_NAME_PATTERN.test(value);
}

function isValidCoordinate(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && Math.abs(value) <= ERD_MAX_COORDINATE;
}

function parseColumn(value: unknown, tableName: string): ParseResult<ErdColumn> {
  if (!isRecord(value) || !isValidId(value.id)) {
    return { error: `Table ${tableName} has an invalid column.` };
  }

  if (!isValidName(value.name)) {
    return { error: `Column names in ${tableName} must start with a letter or underscore and use only letters, numbers, or underscores.` };
  }

  if (!ERD_COLUMN_TYPES.includes(value.type as ErdColumnType)) {
    return { error: `Column ${tableName}.${value.name} has an invalid type.` };
  }

  return {
    value: {
      id: value.id,
      name: value.name,
      type: value.type as ErdColumnType,
      isPrimaryKey: value.isPrimaryKey === true,
      isNullable: value.isNullable === true,
      isUnique: value.isUnique === true,
    },
  };
}

function parseTable(value: unknown): ParseResult<ErdTable> {
  if (!isRecord(value) || !isValidId(value.id)) {
    return { error: "A table is invalid." };
  }

  if (!isValidName(value.name)) {
    return { error: "Table names must start with a letter or underscore and use only letters, numbers, or underscores." };
  }

  if (!isValidCoordinate(value.x) || !isValidCoordinate(value.y)) {
    return { error: `Table ${value.name} has an invalid position.` };
  }

  if (!Array.isArray(value.columns) || value.columns.length > ERD_MAX_COLUMNS_PER_TABLE) {
    return { error: `Table ${value.name} can have up to ${ERD_MAX_COLUMNS_PER_TABLE} columns.` };
  }

  const columns: ErdColumn[] = [];
  const columnNames = new Set<string>();

  for (const columnValue of value.columns) {
    const column = parseColumn(columnValue, value.name);

    if (column.error !== undefined) {
      return { error: column.error };
    }

    const normalizedName = column.value.name.toLowerCase();

    if (columnNames.has(normalizedName)) {
      return { error: `Table ${value.name} has a duplicate column named ${column.value.name}.` };
    }

    columnNames.add(normalizedName);
    columns.push(column.value);
  }

  return {
    value: {
      id: value.id,
      name: value.name,
      x: Math.round(value.x),
      y: Math.round(value.y),
      columns,
    },
  };
}

function parseRelation(value: unknown, tables: ErdTable[]): ParseResult<ErdRelation> {
  if (
    !isRecord(value)
    || !isValidId(value.id)
    || !isValidId(value.fromTableId)
    || !isValidId(value.fromColumnId)
    || !isValidId(value.toTableId)
    || !isValidId(value.toColumnId)
  ) {
    return { error: "A relation is invalid." };
  }

  if (!ERD_CARDINALITIES.includes(value.cardinality as ErdCardinality)) {
    return { error: "A relation has an invalid cardinality." };
  }

  const fromTable = tables.find(table => table.id === value.fromTableId);
  const toTable = tables.find(table => table.id === value.toTableId);
  const fromColumnExists = fromTable?.columns.some(column => column.id === value.fromColumnId);
  const toColumnExists = toTable?.columns.some(column => column.id === value.toColumnId);

  if (!fromColumnExists || !toColumnExists) {
    return { error: "A relation references a missing table or column." };
  }

  return {
    value: {
      id: value.id,
      fromTableId: value.fromTableId,
      fromColumnId: value.fromColumnId,
      toTableId: value.toTableId,
      toColumnId: value.toColumnId,
      cardinality: value.cardinality as ErdCardinality,
    },
  };
}

export function parseErdDocument(value: unknown): ParseResult<ErdDocument> {
  if (!isRecord(value) || !Array.isArray(value.tables) || !Array.isArray(value.relations)) {
    return { error: "document must include tables and relations." };
  }

  if (value.tables.length > ERD_MAX_TABLES) {
    return { error: `A diagram can have up to ${ERD_MAX_TABLES} tables.` };
  }

  if (value.relations.length > ERD_MAX_RELATIONS) {
    return { error: `A diagram can have up to ${ERD_MAX_RELATIONS} relations.` };
  }

  const tables: ErdTable[] = [];
  const tableNames = new Set<string>();
  const ids = new Set<string>();

  for (const tableValue of value.tables) {
    const table = parseTable(tableValue);

    if (table.error !== undefined) {
      return { error: table.error };
    }

    const normalizedName = table.value.name.toLowerCase();

    if (tableNames.has(normalizedName)) {
      return { error: `There is more than one table named ${table.value.name}.` };
    }

    const tableIds = [table.value.id, ...table.value.columns.map(column => column.id)];

    if (tableIds.some(id => ids.has(id))) {
      return { error: "Diagram ids must be unique." };
    }

    tableIds.forEach(id => ids.add(id));
    tableNames.add(normalizedName);
    tables.push(table.value);
  }

  const relations: ErdRelation[] = [];

  for (const relationValue of value.relations) {
    const relation = parseRelation(relationValue, tables);

    if (relation.error !== undefined) {
      return { error: relation.error };
    }

    if (ids.has(relation.value.id)) {
      return { error: "Diagram ids must be unique." };
    }

    ids.add(relation.value.id);
    relations.push(relation.value);
  }

  return {
    value: {
      tables,
      relations,
    },
  };
}

// Stored documents were validated on write; fall back to an empty diagram if one is unreadable.
export function readStoredErdDocument(value: unknown): ErdDocument {
  const document = parseErdDocument(value);

  return document.value ?? ERD_EMPTY_DOCUMENT;
}
