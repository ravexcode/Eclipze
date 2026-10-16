import {
  ERD_ALLOWED_PLANS,
  ERD_COLUMN_ROW_HEIGHT,
  ERD_MAX_NAME_LENGTH,
  ERD_MAX_SCALE,
  ERD_MIN_SCALE,
  ERD_NAME_PATTERN,
  ERD_PROJECT_SEARCH_PARAM,
  ERD_RELATION_CURVE_OFFSET,
  ERD_SNAP_SIZE,
  ERD_SQL_COLUMN_TYPES,
  ERD_TABLE_HEADER_HEIGHT,
  ERD_TABLE_WIDTH,
} from "@/constants/erd";
import type {
  ErdColumn,
  ErdDocument,
  ErdRelation,
  ErdRelationDraft,
  ErdTable,
} from "@/types/erd";
import type { UserPlan, UserRole } from "@/types/user";

type Point = {
  x: number;
  y: number;
};

export type ErdRelationGeometry = {
  path: string;
  from: Point;
  to: Point;
  fromDirection: 1 | -1;
  toDirection: 1 | -1;
};

// Access

export function canAccessErd(user: { role: UserRole; plan: UserPlan } | null | undefined) {
  if (!user) {
    return false;
  }

  return user.role === "DEVELOPER" && ERD_ALLOWED_PLANS.includes(user.plan);
}

// Document editing

export function createErdId() {
  return crypto.randomUUID();
}

export function createErdColumn(overrides: Partial<ErdColumn> = {}): ErdColumn {
  return {
    id: createErdId(),
    name: "column",
    type: "String",
    isPrimaryKey: false,
    isNullable: false,
    isUnique: false,
    ...overrides,
  };
}

export function createUniqueTableName(tables: ErdTable[], baseName = "Table") {
  const existingNames = new Set(tables.map(table => table.name.toLowerCase()));

  if (!existingNames.has(baseName.toLowerCase())) {
    return baseName;
  }

  let suffix = 2;

  while (existingNames.has(`${baseName}${suffix}`.toLowerCase())) {
    suffix += 1;
  }

  return `${baseName}${suffix}`;
}

export function createUniqueColumnName(table: ErdTable, baseName = "column") {
  const existingNames = new Set(table.columns.map(column => column.name.toLowerCase()));
  let name = baseName;
  let suffix = 2;

  while (existingNames.has(name.toLowerCase())) {
    name = `${baseName}${suffix}`;
    suffix += 1;
  }

  return name;
}

export function createErdTable(tables: ErdTable[], position: Point): ErdTable {
  return {
    id: createErdId(),
    name: createUniqueTableName(tables),
    x: Math.round(position.x),
    y: Math.round(position.y),
    columns: [
      createErdColumn({
        name: "id",
        isPrimaryKey: true,
      }),
    ],
  };
}

export function updateErdTable(document: ErdDocument, tableId: string, changes: Partial<ErdTable>): ErdDocument {
  return {
    ...document,
    tables: document.tables.map(table => (
      table.id === tableId
        ? { ...table, ...changes }
        : table
    )),
  };
}

export function removeErdTable(document: ErdDocument, tableId: string): ErdDocument {
  return {
    tables: document.tables.filter(table => table.id !== tableId),
    relations: document.relations.filter(relation => (
      relation.fromTableId !== tableId && relation.toTableId !== tableId
    )),
  };
}

export function removeErdColumn(document: ErdDocument, tableId: string, columnId: string): ErdDocument {
  const nextDocument = updateErdTable(document, tableId, {
    columns: findErdTable(document, tableId)?.columns.filter(column => column.id !== columnId) ?? [],
  });

  return {
    ...nextDocument,
    relations: nextDocument.relations.filter(relation => (
      relation.fromColumnId !== columnId && relation.toColumnId !== columnId
    )),
  };
}

export function findErdTable(document: ErdDocument, tableId: string) {
  return document.tables.find(table => table.id === tableId);
}

export function getPrimaryKeyColumn(table: ErdTable) {
  return table.columns.find(column => column.isPrimaryKey) ?? table.columns[0];
}

export function createErdRelationDraft(document: ErdDocument, table: ErdTable): ErdRelationDraft {
  const fromColumn = table.columns.find(column => !column.isPrimaryKey) ?? table.columns[0];
  const targetTable = document.tables.find(otherTable => otherTable.id !== table.id) ?? table;

  return {
    fromColumnId: fromColumn?.id ?? "",
    toTableId: targetTable.id,
    toColumnId: getPrimaryKeyColumn(targetTable)?.id ?? "",
    cardinality: "ONE_TO_MANY",
  };
}

export function describeErdColumn(document: ErdDocument, tableId: string, columnId: string) {
  const table = findErdTable(document, tableId);
  const column = table?.columns.find(item => item.id === columnId);

  return `${table?.name ?? "?"}.${column?.name ?? "?"}`;
}

export function snapErdCoordinate(value: number) {
  return Math.round(value / ERD_SNAP_SIZE) * ERD_SNAP_SIZE;
}

export function readErdProjectFromUrl() {
  return new URLSearchParams(window.location.search).get(ERD_PROJECT_SEARCH_PARAM);
}

export function writeErdProjectToUrl(projectId: string) {
  const searchParams = new URLSearchParams(window.location.search);
  searchParams.set(ERD_PROJECT_SEARCH_PARAM, projectId);

  window.history.replaceState(
    window.history.state,
    "",
    `${window.location.pathname}?${searchParams.toString()}`,
  );
}

export function clampErdScale(scale: number) {
  const clampedScale = Math.min(ERD_MAX_SCALE, Math.max(ERD_MIN_SCALE, scale));

  return Math.round(clampedScale * 100) / 100;
}

// Geometry

export function getErdTableHeight(table: ErdTable) {
  return ERD_TABLE_HEADER_HEIGHT + Math.max(table.columns.length, 1) * ERD_COLUMN_ROW_HEIGHT;
}

function getColumnAnchorY(table: ErdTable, columnId: string) {
  const columnIndex = Math.max(
    table.columns.findIndex(column => column.id === columnId),
    0,
  );

  return table.y + ERD_TABLE_HEADER_HEIGHT + columnIndex * ERD_COLUMN_ROW_HEIGHT + ERD_COLUMN_ROW_HEIGHT / 2;
}

export function getErdRelationGeometry(document: ErdDocument, relation: ErdRelation): ErdRelationGeometry | null {
  const fromTable = findErdTable(document, relation.fromTableId);
  const toTable = findErdTable(document, relation.toTableId);

  if (!fromTable || !toTable) {
    return null;
  }

  const fromY = getColumnAnchorY(fromTable, relation.fromColumnId);
  const toY = getColumnAnchorY(toTable, relation.toColumnId);

  const targetIsRight = toTable.x >= fromTable.x + ERD_TABLE_WIDTH;
  const targetIsLeft = toTable.x + ERD_TABLE_WIDTH <= fromTable.x;

  // Tables that overlap horizontally (or self relations) connect through their right edges.
  const fromDirection: 1 | -1 = targetIsLeft ? -1 : 1;
  const toDirection: 1 | -1 = targetIsRight ? -1 : 1;

  const from = {
    x: fromDirection === 1 ? fromTable.x + ERD_TABLE_WIDTH : fromTable.x,
    y: fromY,
  };
  const to = {
    x: toDirection === 1 ? toTable.x + ERD_TABLE_WIDTH : toTable.x,
    y: toY,
  };

  const firstControl = {
    x: from.x + fromDirection * ERD_RELATION_CURVE_OFFSET,
    y: from.y,
  };
  const secondControl = {
    x: to.x + toDirection * ERD_RELATION_CURVE_OFFSET,
    y: to.y,
  };

  return {
    path: `M ${from.x} ${from.y} C ${firstControl.x} ${firstControl.y}, ${secondControl.x} ${secondControl.y}, ${to.x} ${to.y}`,
    from,
    to,
    fromDirection,
    toDirection,
  };
}

// Export

function lowerFirst(value: string) {
  return value.charAt(0).toLowerCase() + value.slice(1);
}

function claimFieldName(usedNames: Set<string>, baseName: string) {
  let fieldName = baseName;
  let suffix = 2;

  while (usedNames.has(fieldName)) {
    fieldName = `${baseName}${suffix}`;
    suffix += 1;
  }

  usedNames.add(fieldName);
  return fieldName;
}

function formatPrismaColumn(column: ErdColumn, isOneToOneForeignKey: boolean) {
  const attributes: string[] = [];

  if (column.isPrimaryKey) {
    attributes.push(column.type === "String" ? "@id @default(cuid())" : "@id");
  }

  if (!column.isPrimaryKey && (column.isUnique || isOneToOneForeignKey)) {
    attributes.push("@unique");
  }

  const optionalMarker = column.isNullable && !column.isPrimaryKey ? "?" : "";

  return [`${column.name}`, `${column.type}${optionalMarker}`, ...attributes];
}

function alignPrismaFields(rows: string[][]) {
  const nameWidth = Math.max(0, ...rows.map(row => row[0].length));
  const typeWidth = Math.max(0, ...rows.map(row => (row[1] ?? "").length));

  return rows.map(row => {
    const [name, type, ...attributes] = row;
    const parts = [name.padEnd(nameWidth), type.padEnd(typeWidth), ...attributes];

    return `  ${parts.join(" ").trimEnd()}`;
  });
}

export function exportErdToPrisma(document: ErdDocument) {
  const fieldRows = new Map<string, string[][]>();
  const usedFieldNames = new Map<string, Set<string>>();
  const oneToOneForeignKeys = new Set(
    document.relations
      .filter(relation => relation.cardinality === "ONE_TO_ONE")
      .map(relation => relation.fromColumnId),
  );

  for (const table of document.tables) {
    usedFieldNames.set(table.id, new Set(table.columns.map(column => column.name)));
    fieldRows.set(table.id, table.columns.map(column => (
      formatPrismaColumn(column, oneToOneForeignKeys.has(column.id))
    )));
  }

  for (const relation of document.relations) {
    const fromTable = findErdTable(document, relation.fromTableId);
    const toTable = findErdTable(document, relation.toTableId);
    const fromColumn = fromTable?.columns.find(column => column.id === relation.fromColumnId);
    const toColumn = toTable?.columns.find(column => column.id === relation.toColumnId);

    if (!fromTable || !toTable || !fromColumn || !toColumn) {
      continue;
    }

    const relationName = `"${fromTable.name}_${fromColumn.name}_${toTable.name}"`;
    const fromNames = usedFieldNames.get(fromTable.id)!;
    const toNames = usedFieldNames.get(toTable.id)!;

    if (relation.cardinality === "MANY_TO_MANY") {
      fieldRows.get(fromTable.id)!.push([
        claimFieldName(fromNames, `${lowerFirst(toTable.name)}List`),
        `${toTable.name}[]`,
        `@relation(${relationName})`,
      ]);
      fieldRows.get(toTable.id)!.push([
        claimFieldName(toNames, `${lowerFirst(fromTable.name)}List`),
        `${fromTable.name}[]`,
        `@relation(${relationName})`,
      ]);
      continue;
    }

    const optionalMarker = fromColumn.isNullable ? "?" : "";

    fieldRows.get(fromTable.id)!.push([
      claimFieldName(fromNames, lowerFirst(toTable.name)),
      `${toTable.name}${optionalMarker}`,
      `@relation(${relationName}, fields: [${fromColumn.name}], references: [${toColumn.name}])`,
    ]);

    const backReferenceType = relation.cardinality === "ONE_TO_ONE"
      ? `${fromTable.name}?`
      : `${fromTable.name}[]`;
    const backReferenceName = relation.cardinality === "ONE_TO_ONE"
      ? lowerFirst(fromTable.name)
      : `${lowerFirst(fromTable.name)}List`;

    fieldRows.get(toTable.id)!.push([
      claimFieldName(toNames, backReferenceName),
      backReferenceType,
      `@relation(${relationName})`,
    ]);
  }

  return document.tables
    .map(table => [
      `model ${table.name} {`,
      ...alignPrismaFields(fieldRows.get(table.id) ?? []),
      "}",
    ].join("\n"))
    .join("\n\n");
}

function quoteSql(identifier: string) {
  return `"${identifier}"`;
}

export function exportErdToSql(document: ErdDocument) {
  const statements: string[] = [];
  const oneToOneForeignKeys = new Set(
    document.relations
      .filter(relation => relation.cardinality === "ONE_TO_ONE")
      .map(relation => relation.fromColumnId),
  );

  for (const table of document.tables) {
    const definitions = table.columns.map(column => {
      const notNull = column.isNullable && !column.isPrimaryKey ? "" : " NOT NULL";

      return `    ${quoteSql(column.name)} ${ERD_SQL_COLUMN_TYPES[column.type]}${notNull}`;
    });

    const primaryKeys = table.columns.filter(column => column.isPrimaryKey);

    if (primaryKeys.length > 0) {
      definitions.push(
        `    CONSTRAINT ${quoteSql(`${table.name}_pkey`)} PRIMARY KEY (${primaryKeys.map(column => quoteSql(column.name)).join(", ")})`,
      );
    }

    statements.push(`CREATE TABLE ${quoteSql(table.name)} (\n${definitions.join(",\n")}\n);`);

    for (const column of table.columns) {
      const needsUniqueIndex = !column.isPrimaryKey && (column.isUnique || oneToOneForeignKeys.has(column.id));

      if (needsUniqueIndex) {
        statements.push(
          `CREATE UNIQUE INDEX ${quoteSql(`${table.name}_${column.name}_key`)} ON ${quoteSql(table.name)}(${quoteSql(column.name)});`,
        );
      }
    }
  }

  for (const relation of document.relations) {
    const fromTable = findErdTable(document, relation.fromTableId);
    const toTable = findErdTable(document, relation.toTableId);
    const fromColumn = fromTable?.columns.find(column => column.id === relation.fromColumnId);
    const toColumn = toTable?.columns.find(column => column.id === relation.toColumnId);

    if (!fromTable || !toTable || !fromColumn || !toColumn) {
      continue;
    }

    if (relation.cardinality === "MANY_TO_MANY") {
      const joinTable = `_${fromTable.name}To${toTable.name}`;
      const fromKey = `${lowerFirst(fromTable.name)}_${fromColumn.name}`;
      const toKey = `${lowerFirst(toTable.name)}_${toColumn.name}`;

      statements.push([
        `CREATE TABLE ${quoteSql(joinTable)} (`,
        `    ${quoteSql(fromKey)} ${ERD_SQL_COLUMN_TYPES[fromColumn.type]} NOT NULL REFERENCES ${quoteSql(fromTable.name)}(${quoteSql(fromColumn.name)}) ON DELETE CASCADE,`,
        `    ${quoteSql(toKey)} ${ERD_SQL_COLUMN_TYPES[toColumn.type]} NOT NULL REFERENCES ${quoteSql(toTable.name)}(${quoteSql(toColumn.name)}) ON DELETE CASCADE,`,
        `    PRIMARY KEY (${quoteSql(fromKey)}, ${quoteSql(toKey)})`,
        ");",
      ].join("\n"));
      continue;
    }

    statements.push(
      `ALTER TABLE ${quoteSql(fromTable.name)} ADD CONSTRAINT ${quoteSql(`${fromTable.name}_${fromColumn.name}_fkey`)} FOREIGN KEY (${quoteSql(fromColumn.name)}) REFERENCES ${quoteSql(toTable.name)}(${quoteSql(toColumn.name)}) ON DELETE RESTRICT ON UPDATE CASCADE;`,
    );
  }

  return statements.join("\n\n");
}

// Validation hints

export function getErdNameError(name: string, siblingNames: string[]) {
  if (!name) {
    return "Name is required.";
  }

  if (name.length > ERD_MAX_NAME_LENGTH) {
    return `Use ${ERD_MAX_NAME_LENGTH} characters or fewer.`;
  }

  if (!ERD_NAME_PATTERN.test(name)) {
    return "Start with a letter or underscore. Use only letters, numbers, or underscores.";
  }

  const normalizedName = name.toLowerCase();

  if (siblingNames.some(siblingName => siblingName.toLowerCase() === normalizedName)) {
    return "This name is already used.";
  }

  return null;
}

export function getErdDocumentError(document: ErdDocument) {
  for (const table of document.tables) {
    const otherTableNames = document.tables
      .filter(otherTable => otherTable.id !== table.id)
      .map(otherTable => otherTable.name);
    const tableError = getErdNameError(table.name, otherTableNames);

    if (tableError) {
      return `Table "${table.name || "Untitled"}": ${tableError}`;
    }

    for (const column of table.columns) {
      const otherColumnNames = table.columns
        .filter(otherColumn => otherColumn.id !== column.id)
        .map(otherColumn => otherColumn.name);
      const columnError = getErdNameError(column.name, otherColumnNames);

      if (columnError) {
        return `Column "${table.name}.${column.name || "untitled"}": ${columnError}`;
      }
    }
  }

  return null;
}
