import type { MenuSelectorOption } from "@/components/ui/menu-selector";
import { SUBSCRIPTION_PLANS } from "@/constants/plans";
import type {
  ErdCardinality,
  ErdColumnType,
  ErdDocument,
  ErdExportFormat,
  ErdSaveState,
  ErdViewport,
} from "@/types/erd";
import type { UserPlan } from "@/types/user";

// Access: developer accounts on any paid plan.
export const ERD_ALLOWED_PLANS: readonly UserPlan[] = ["PLUS", "MAX", "TEAM"];

// Node geometry in canvas units, shared by table nodes and relation lines.
export const ERD_TABLE_WIDTH = 240;
export const ERD_TABLE_HEADER_HEIGHT = 36;
export const ERD_COLUMN_ROW_HEIGHT = 28;
export const ERD_RELATION_CURVE_OFFSET = 60;

export const ERD_MIN_SCALE = 0.4;
export const ERD_MAX_SCALE = 1.6;
export const ERD_SCALE_STEP = 0.1;

// Canvas interaction.
export const ERD_GRID_SIZE = 20;
export const ERD_SNAP_SIZE = 4;
export const ERD_WHEEL_ZOOM_SENSITIVITY = 0.0015;
export const ERD_CARDINALITY_MARKER_OFFSET = 12;
export const ERD_NEW_TABLE_STAGGER = 24;

export const ERD_AUTOSAVE_DELAY_MS = 1200;
export const ERD_COPY_FEEDBACK_MS = 1600;
export const ERD_PROJECT_SEARCH_PARAM = "project";

export const ERD_TOOLBAR_ICON_BUTTON_CLASSES = "rounded-md p-1.5 text-foreground-off transition-colors hover:bg-background-focus hover:text-foreground disabled:pointer-events-none disabled:opacity-40";

export const ERD_UPGRADE_PLANS = SUBSCRIPTION_PLANS.filter(plan => plan.key !== "free");

export const ERD_DEFAULT_VIEWPORT: ErdViewport = {
  x: 40,
  y: 40,
  scale: 1,
};

// Server-side limits for stored diagrams.
export const ERD_MAX_TABLES = 100;
export const ERD_MAX_COLUMNS_PER_TABLE = 60;
export const ERD_MAX_RELATIONS = 300;
export const ERD_MAX_NAME_LENGTH = 64;
export const ERD_MAX_ID_LENGTH = 64;
export const ERD_MAX_COORDINATE = 100_000;

export const ERD_PRIVATE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
};

export const ERD_NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

export const ERD_EMPTY_DOCUMENT: ErdDocument = {
  tables: [],
  relations: [],
};

export const ERD_COLUMN_TYPES: readonly ErdColumnType[] = [
  "String",
  "Int",
  "BigInt",
  "Float",
  "Decimal",
  "Boolean",
  "DateTime",
  "Json",
  "Bytes",
];

export const ERD_COLUMN_TYPE_OPTIONS: MenuSelectorOption<ErdColumnType>[] = ERD_COLUMN_TYPES.map(type => ({
  value: type,
  label: type,
}));

export const ERD_SQL_COLUMN_TYPES: Record<ErdColumnType, string> = {
  String: "TEXT",
  Int: "INTEGER",
  BigInt: "BIGINT",
  Float: "DOUBLE PRECISION",
  Decimal: "DECIMAL(65,30)",
  Boolean: "BOOLEAN",
  DateTime: "TIMESTAMP(3)",
  Json: "JSONB",
  Bytes: "BYTEA",
};

export const ERD_CARDINALITIES: readonly ErdCardinality[] = [
  "ONE_TO_ONE",
  "ONE_TO_MANY",
  "MANY_TO_MANY",
];

export const ERD_CARDINALITY_LABELS: Record<ErdCardinality, string> = {
  ONE_TO_ONE: "One to one",
  ONE_TO_MANY: "One to many",
  MANY_TO_MANY: "Many to many",
};

// Markers drawn at the source and target ends of a relation line.
export const ERD_CARDINALITY_MARKERS: Record<ErdCardinality, { from: string; to: string }> = {
  ONE_TO_ONE: { from: "1", to: "1" },
  ONE_TO_MANY: { from: "N", to: "1" },
  MANY_TO_MANY: { from: "N", to: "N" },
};

export const ERD_CARDINALITY_OPTIONS: MenuSelectorOption<ErdCardinality>[] = ERD_CARDINALITIES.map(cardinality => ({
  value: cardinality,
  label: ERD_CARDINALITY_LABELS[cardinality],
}));

export const ERD_EXPORT_FORMATS: readonly ErdExportFormat[] = ["prisma", "sql"];

export const ERD_EXPORT_FORMAT_LABELS: Record<ErdExportFormat, string> = {
  prisma: "Prisma",
  sql: "PostgreSQL",
};

export const ERD_SAVE_STATE_LABELS: Record<ErdSaveState, string> = {
  saved: "All changes saved",
  unsaved: "Unsaved changes",
  saving: "Saving…",
  error: "Unable to save",
};

export const ERD_SAVE_STATE_DOT: Record<ErdSaveState, string> = {
  saved: "bg-status-green",
  unsaved: "bg-warning",
  saving: "bg-status-cyan",
  error: "bg-alert-red",
};
