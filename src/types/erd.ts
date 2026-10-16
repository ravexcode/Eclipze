export type ErdColumnType =
  | "String"
  | "Int"
  | "BigInt"
  | "Float"
  | "Decimal"
  | "Boolean"
  | "DateTime"
  | "Json"
  | "Bytes";

export type ErdCardinality = "ONE_TO_ONE" | "ONE_TO_MANY" | "MANY_TO_MANY";

export type ErdColumn = {
  id: string;
  name: string;
  type: ErdColumnType;
  isPrimaryKey: boolean;
  isNullable: boolean;
  isUnique: boolean;
};

export type ErdTable = {
  id: string;
  name: string;
  x: number;
  y: number;
  columns: ErdColumn[];
};

export type ErdRelation = {
  id: string;
  fromTableId: string;
  fromColumnId: string;
  toTableId: string;
  toColumnId: string;
  cardinality: ErdCardinality;
};

export type ErdDocument = {
  tables: ErdTable[];
  relations: ErdRelation[];
};

export type ErdViewport = {
  x: number;
  y: number;
  scale: number;
};

export type ErdRelationDraft = Omit<ErdRelation, "id" | "fromTableId">;

export type ErdExportFormat = "prisma" | "sql";

export type ErdSaveState = "saved" | "unsaved" | "saving" | "error";

export type ErdDiagramResponse = {
  document: ErdDocument;
  updatedAt: string | null;
  message?: string;
};

export type ErdDatabaseChangeKind = "create" | "alter" | "drop";

export type ErdDatabaseChange = {
  kind: ErdDatabaseChangeKind;
  target: string;
  description: string;
  statement: string;
  isDestructive: boolean;
};

export type ErdAgentMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  changes?: ErdDatabaseChange[];
  isError?: boolean;
};

export type ErdAgentResponse = {
  answer: string;
  document: ErdDocument | null;
  changes: ErdDatabaseChange[] | null;
  credits: number | null;
  message?: string;
};
