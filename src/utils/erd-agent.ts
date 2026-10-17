import {
  ERD_AGENT_LAYOUT_COLUMNS,
  ERD_AGENT_LAYOUT_GAP_X,
  ERD_AGENT_LAYOUT_GAP_Y,
  ERD_AGENT_LAYOUT_ORIGIN,
  ERD_AGENT_PROVIDERS,
  ERD_CARDINALITIES,
  ERD_COLUMN_TYPES,
  ERD_SQL_COLUMN_TYPES,
  ERD_TABLE_WIDTH,
} from "@/constants/erd";
import type { AiProvider } from "@/types/ai";
import type { DatabaseSchema, DatabaseSchemaTable } from "@/types/database-connections";
import type {
  ErdCardinality,
  ErdColumn,
  ErdColumnType,
  ErdDatabaseChange,
  ErdDocument,
  ErdRelation,
  ErdTable,
} from "@/types/erd";
import { createMongoValidator } from "@/utils/database-connections";
import {
  createErdColumnSql,
  createErdId,
  createErdRelationSql,
  createErdTableSql,
  createErdUniqueIndexSql,
  findErdTable,
  getErdJoinTableName,
  getErdTableHeight,
  getOneToOneForeignKeys,
  quoteSql,
} from "@/utils/erd";

type AgentResult<T> = { value: T; error?: never } | { value?: never; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sameName(left: string, right: string) {
  return left.toLowerCase() === right.toLowerCase();
}

// Agent context

export function summarizeErdForAgent(document: ErdDocument) {
  return JSON.stringify({
    tables: document.tables.map(table => ({
      name: table.name,
      columns: table.columns.map(column => ({
        name: column.name,
        type: column.type,
        isPrimaryKey: column.isPrimaryKey,
        isNullable: column.isNullable,
        isUnique: column.isUnique,
      })),
    })),
    relations: document.relations.map(relation => {
      const fromTable = findErdTable(document, relation.fromTableId);
      const toTable = findErdTable(document, relation.toTableId);

      return {
        fromTable: fromTable?.name,
        fromColumn: fromTable?.columns.find(column => column.id === relation.fromColumnId)?.name,
        toTable: toTable?.name,
        toColumn: toTable?.columns.find(column => column.id === relation.toColumnId)?.name,
        cardinality: relation.cardinality,
      };
    }),
  });
}

export function summarizeDatabaseSchemaForAgent(schema: DatabaseSchema) {
  return JSON.stringify({
    tables: schema.tables.map(table => ({
      name: table.name,
      columns: table.columns.map(column => ({
        name: column.name,
        type: column.type,
        databaseType: column.rawType,
        isPrimaryKey: column.isPrimaryKey,
        isNullable: column.isNullable,
        isUnique: column.isUnique,
      })),
    })),
    foreignKeys: schema.foreignKeys,
  });
}

// Building a diagram from the update_erd tool input

function readAgentColumn(value: unknown, tableName: string, existingTable: ErdTable | undefined): AgentResult<ErdColumn> {
  if (!isRecord(value) || typeof value.name !== "string") {
    return { error: `Every column in ${tableName} needs a name.` };
  }

  if (!ERD_COLUMN_TYPES.includes(value.type as ErdColumnType)) {
    return { error: `Column ${tableName}.${value.name} must use one of: ${ERD_COLUMN_TYPES.join(", ")}.` };
  }

  const existingColumn = existingTable?.columns.find(column => sameName(column.name, value.name as string));

  return {
    value: {
      id: existingColumn?.id ?? createErdId(),
      name: value.name,
      type: value.type as ErdColumnType,
      isPrimaryKey: value.isPrimaryKey === true,
      isNullable: value.isNullable === true,
      isUnique: value.isUnique === true,
    },
  };
}

function findColumnByName(tables: ErdTable[], tableName: unknown, columnName: unknown) {
  if (typeof tableName !== "string" || typeof columnName !== "string") return null;

  const table = tables.find(item => sameName(item.name, tableName));
  const column = table?.columns.find(item => sameName(item.name, columnName));

  return table && column ? { table, column } : null;
}

function placeNewTables(tables: ErdTable[], preservedTables: ErdTable[]) {
  const baseY = preservedTables.length > 0
    ? Math.max(...preservedTables.map(table => table.y + getErdTableHeight(table))) + ERD_AGENT_LAYOUT_GAP_Y
    : ERD_AGENT_LAYOUT_ORIGIN;
  let rowY = baseY;
  let rowHeight = 0;
  let slot = 0;

  for (const table of tables) {
    const column = slot % ERD_AGENT_LAYOUT_COLUMNS;

    if (slot > 0 && column === 0) {
      rowY += rowHeight + ERD_AGENT_LAYOUT_GAP_Y;
      rowHeight = 0;
    }

    table.x = ERD_AGENT_LAYOUT_ORIGIN + column * (ERD_TABLE_WIDTH + ERD_AGENT_LAYOUT_GAP_X);
    table.y = rowY;
    rowHeight = Math.max(rowHeight, getErdTableHeight(table));
    slot += 1;
  }
}

// Turns the agent's name-based schema into a diagram, keeping ids and positions of tables that already exist.
export function buildErdFromAgentSchema(current: ErdDocument, input: Record<string, unknown>): AgentResult<ErdDocument> {
  if (!Array.isArray(input.tables)) {
    return { error: "tables must be an array." };
  }

  const tables: ErdTable[] = [];
  const newTables: ErdTable[] = [];

  for (const tableValue of input.tables) {
    if (!isRecord(tableValue) || typeof tableValue.name !== "string" || !Array.isArray(tableValue.columns)) {
      return { error: "Every table needs a name and a columns array." };
    }

    const existingTable = current.tables.find(table => sameName(table.name, tableValue.name as string));
    const columns: ErdColumn[] = [];

    for (const columnValue of tableValue.columns) {
      const column = readAgentColumn(columnValue, tableValue.name, existingTable);

      if (column.error !== undefined) {
        return { error: column.error };
      }

      columns.push(column.value);
    }

    const table: ErdTable = {
      id: existingTable?.id ?? createErdId(),
      name: tableValue.name,
      x: existingTable?.x ?? 0,
      y: existingTable?.y ?? 0,
      columns,
    };

    tables.push(table);

    if (!existingTable) {
      newTables.push(table);
    }
  }

  placeNewTables(newTables, tables.filter(table => !newTables.includes(table)));

  const relationValues = Array.isArray(input.relations) ? input.relations : [];
  const relations: ErdRelation[] = [];

  for (const relationValue of relationValues) {
    if (!isRecord(relationValue)) {
      return { error: "Every relation must be an object." };
    }

    const from = findColumnByName(tables, relationValue.fromTable, relationValue.fromColumn);
    const to = findColumnByName(tables, relationValue.toTable, relationValue.toColumn);

    if (!from || !to) {
      return {
        error: `Relation ${String(relationValue.fromTable)}.${String(relationValue.fromColumn)} -> ${String(relationValue.toTable)}.${String(relationValue.toColumn)} references a missing table or column.`,
      };
    }

    const cardinality = ERD_CARDINALITIES.includes(relationValue.cardinality as ErdCardinality)
      ? relationValue.cardinality as ErdCardinality
      : "ONE_TO_MANY";
    const existingRelation = current.relations.find(relation => (
      relation.fromColumnId === from.column.id && relation.toColumnId === to.column.id
    ));

    relations.push({
      id: existingRelation?.id ?? createErdId(),
      fromTableId: from.table.id,
      fromColumnId: from.column.id,
      toTableId: to.table.id,
      toColumnId: to.column.id,
      cardinality,
    });
  }

  return { value: { tables, relations } };
}

// Change review: Postgres

function findSchemaTable(schema: DatabaseSchema, name: string) {
  return schema.tables.find(table => table.name === name);
}

function describeRelationTarget(document: ErdDocument, relation: ErdRelation) {
  const fromTable = findErdTable(document, relation.fromTableId);
  const toTable = findErdTable(document, relation.toTableId);
  const fromColumn = fromTable?.columns.find(column => column.id === relation.fromColumnId);
  const toColumn = toTable?.columns.find(column => column.id === relation.toColumnId);

  if (!fromTable || !toTable || !fromColumn || !toColumn) {
    return null;
  }

  return { fromTable, toTable, fromColumn, toColumn };
}

export function diffErdWithPostgres(document: ErdDocument, schema: DatabaseSchema): ErdDatabaseChange[] {
  const oneToOneForeignKeys = getOneToOneForeignKeys(document);
  const erdTableNames = new Set(document.tables.map(table => table.name));
  const joinTableNames = new Set<string>();
  const expectedForeignKeys = new Set<string>();

  for (const relation of document.relations) {
    const target = describeRelationTarget(document, relation);

    if (!target) continue;

    if (relation.cardinality === "MANY_TO_MANY") {
      joinTableNames.add(getErdJoinTableName(target.fromTable, target.toTable));
    } else {
      expectedForeignKeys.add(`${target.fromTable.name}.${target.fromColumn.name}->${target.toTable.name}.${target.toColumn.name}`);
    }
  }

  const droppedForeignKeys: ErdDatabaseChange[] = [];
  const createdTables: ErdDatabaseChange[] = [];
  const alteredColumns: ErdDatabaseChange[] = [];
  const addedRelations: ErdDatabaseChange[] = [];
  const droppedColumns: ErdDatabaseChange[] = [];
  const droppedTables: ErdDatabaseChange[] = [];

  for (const foreignKey of schema.foreignKeys) {
    const key = `${foreignKey.table}.${foreignKey.column}->${foreignKey.referencedTable}.${foreignKey.referencedColumn}`;
    const tableIsKept = erdTableNames.has(foreignKey.table) || joinTableNames.has(foreignKey.table);

    if (!tableIsKept || joinTableNames.has(foreignKey.table) || expectedForeignKeys.has(key)) continue;

    droppedForeignKeys.push({
      kind: "alter",
      target: foreignKey.table,
      description: `Remove foreign key ${foreignKey.table}.${foreignKey.column} -> ${foreignKey.referencedTable}.${foreignKey.referencedColumn}.`,
      statement: `ALTER TABLE ${quoteSql(foreignKey.table)} DROP CONSTRAINT ${quoteSql(foreignKey.name)};`,
      isDestructive: false,
    });
  }

  for (const table of document.tables) {
    const schemaTable = findSchemaTable(schema, table.name);

    if (!schemaTable) {
      for (const statement of createErdTableSql(table, oneToOneForeignKeys)) {
        createdTables.push({
          kind: "create",
          target: table.name,
          description: statement.startsWith("CREATE TABLE")
            ? `Create table ${table.name} with ${table.columns.length} column(s).`
            : `Add a unique index to ${table.name}.`,
          statement,
          isDestructive: false,
        });
      }

      continue;
    }

    for (const column of table.columns) {
      const schemaColumn = schemaTable.columns.find(item => item.name === column.name);
      const target = `${table.name}.${column.name}`;
      const requiresNotNull = !(column.isNullable && !column.isPrimaryKey);
      const needsUnique = !column.isPrimaryKey && (column.isUnique || oneToOneForeignKeys.has(column.id));
      const uniqueIndexChange: ErdDatabaseChange = {
        kind: "alter",
        target,
        description: `Add a unique index to ${target}. Fails if duplicate values exist.`,
        statement: createErdUniqueIndexSql(table, column),
        isDestructive: false,
      };

      if (!schemaColumn) {
        alteredColumns.push({
          kind: "alter",
          target,
          description: requiresNotNull
            ? `Add required column ${target}. Fails if ${table.name} already has rows.`
            : `Add optional column ${target}.`,
          statement: `ALTER TABLE ${quoteSql(table.name)} ADD COLUMN ${createErdColumnSql(column)};`,
          isDestructive: false,
        });

        if (needsUnique) {
          alteredColumns.push(uniqueIndexChange);
        }

        continue;
      }

      if (schemaColumn.type !== column.type) {
        const sqlType = ERD_SQL_COLUMN_TYPES[column.type];

        alteredColumns.push({
          kind: "alter",
          target,
          description: `Change ${target} from ${schemaColumn.rawType} to ${sqlType}.`,
          statement: `ALTER TABLE ${quoteSql(table.name)} ALTER COLUMN ${quoteSql(column.name)} TYPE ${sqlType} USING ${quoteSql(column.name)}::${sqlType};`,
          isDestructive: true,
        });
      }

      if (requiresNotNull && schemaColumn.isNullable) {
        alteredColumns.push({
          kind: "alter",
          target,
          description: `Make ${target} required. Fails if any row has a null value.`,
          statement: `ALTER TABLE ${quoteSql(table.name)} ALTER COLUMN ${quoteSql(column.name)} SET NOT NULL;`,
          isDestructive: false,
        });
      }

      if (!requiresNotNull && !schemaColumn.isNullable && !schemaColumn.isPrimaryKey) {
        alteredColumns.push({
          kind: "alter",
          target,
          description: `Make ${target} optional.`,
          statement: `ALTER TABLE ${quoteSql(table.name)} ALTER COLUMN ${quoteSql(column.name)} DROP NOT NULL;`,
          isDestructive: false,
        });
      }

      if (needsUnique && !schemaColumn.isUnique && !schemaColumn.isPrimaryKey) {
        alteredColumns.push(uniqueIndexChange);
      }
    }

    for (const schemaColumn of schemaTable.columns) {
      if (table.columns.some(column => column.name === schemaColumn.name)) continue;

      droppedColumns.push({
        kind: "drop",
        target: `${table.name}.${schemaColumn.name}`,
        description: `Drop column ${table.name}.${schemaColumn.name} and its data.`,
        statement: `ALTER TABLE ${quoteSql(table.name)} DROP COLUMN ${quoteSql(schemaColumn.name)};`,
        isDestructive: true,
      });
    }
  }

  for (const relation of document.relations) {
    const target = describeRelationTarget(document, relation);
    const statement = createErdRelationSql(document, relation);

    if (!target || !statement) continue;

    if (relation.cardinality === "MANY_TO_MANY") {
      const joinTable = getErdJoinTableName(target.fromTable, target.toTable);

      if (findSchemaTable(schema, joinTable)) continue;

      addedRelations.push({
        kind: "create",
        target: joinTable,
        description: `Create join table ${joinTable} for ${target.fromTable.name} and ${target.toTable.name}.`,
        statement,
        isDestructive: false,
      });
      continue;
    }

    const exists = schema.foreignKeys.some(foreignKey => (
      foreignKey.table === target.fromTable.name
      && foreignKey.column === target.fromColumn.name
      && foreignKey.referencedTable === target.toTable.name
      && foreignKey.referencedColumn === target.toColumn.name
    ));

    if (exists) continue;

    addedRelations.push({
      kind: "alter",
      target: target.fromTable.name,
      description: `Add foreign key ${target.fromTable.name}.${target.fromColumn.name} -> ${target.toTable.name}.${target.toColumn.name}.`,
      statement,
      isDestructive: false,
    });
  }

  for (const schemaTable of schema.tables) {
    if (erdTableNames.has(schemaTable.name) || joinTableNames.has(schemaTable.name)) continue;

    droppedTables.push({
      kind: "drop",
      target: schemaTable.name,
      description: `Drop table ${schemaTable.name} and all of its data.`,
      statement: `DROP TABLE ${quoteSql(schemaTable.name)};`,
      isDestructive: true,
    });
  }

  return [
    ...droppedForeignKeys,
    ...createdTables,
    ...alteredColumns,
    ...addedRelations,
    ...droppedColumns,
    ...droppedTables,
  ];
}

// Change review: MongoDB

function createMongoUniqueIndexChanges(table: ErdTable, schemaTable: DatabaseSchemaTable | undefined) {
  return table.columns
    .filter(column => column.isUnique && !column.isPrimaryKey)
    .filter(column => !schemaTable?.columns.some(item => item.name === column.name && item.isUnique))
    .map((column): ErdDatabaseChange => ({
      kind: schemaTable ? "alter" : "create",
      target: `${table.name}.${column.name}`,
      description: `Add a unique index to ${table.name}.${column.name}.`,
      statement: JSON.stringify({
        createIndexes: table.name,
        indexes: [{ key: { [column.name]: 1 }, name: `${column.name}_unique`, unique: true }],
      }),
      isDestructive: false,
    }));
}

export function diffErdWithMongo(document: ErdDocument, schema: DatabaseSchema): ErdDatabaseChange[] {
  const changes: ErdDatabaseChange[] = [];
  const droppedCollections: ErdDatabaseChange[] = [];

  for (const table of document.tables) {
    const schemaTable = findSchemaTable(schema, table.name);
    const validator = createMongoValidator(table);

    if (!schemaTable) {
      changes.push({
        kind: "create",
        target: table.name,
        description: `Create collection ${table.name} with a schema validator for ${table.columns.length} field(s).`,
        statement: JSON.stringify({ create: table.name, validator }),
        isDestructive: false,
      });
    } else if (JSON.stringify(schemaTable.validator ?? null) !== JSON.stringify(validator)) {
      changes.push({
        kind: "alter",
        target: table.name,
        description: `Update the schema validator of ${table.name}. Existing documents are kept; new writes must match.`,
        statement: JSON.stringify({ collMod: table.name, validator, validationLevel: "moderate" }),
        isDestructive: false,
      });
    }

    changes.push(...createMongoUniqueIndexChanges(table, schemaTable));
  }

  for (const schemaTable of schema.tables) {
    if (document.tables.some(table => table.name === schemaTable.name)) continue;

    droppedCollections.push({
      kind: "drop",
      target: schemaTable.name,
      description: `Drop collection ${schemaTable.name} and all of its documents.`,
      statement: JSON.stringify({ drop: schemaTable.name }),
      isDestructive: true,
    });
  }

  return [...changes, ...droppedCollections];
}

export function isErdAgentProvider(provider: string): provider is AiProvider {
  return ERD_AGENT_PROVIDERS.some(item => item === provider);
}
