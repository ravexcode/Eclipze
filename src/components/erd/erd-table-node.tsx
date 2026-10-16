import type { PointerEvent as ReactPointerEvent } from "react";
import { IconKey, IconLink, IconTable } from "@tabler/icons-react";

import {
  ERD_COLUMN_ROW_HEIGHT,
  ERD_TABLE_HEADER_HEIGHT,
  ERD_TABLE_WIDTH,
} from "@/constants/erd";
import type { ErdTable } from "@/types/erd";

interface Props {
  table: ErdTable;
  isSelected: boolean;
  foreignKeyColumnIds: Set<string>;
  onSelect(tableId: string): void;
  onStartDrag(event: ReactPointerEvent<HTMLElement>, table: ErdTable): void;
}

export default function ErdTableNode(props: Props) {
  const { table } = props;

  return (
    <article
      data-erd-node
      aria-label={`${table.name} table`}
      className={`absolute overflow-hidden rounded-md border bg-background-card shadow-2xl transition-colors duration-200 ${props.isSelected ? "border-accent" : "border-background-focus hover:border-foreground-off/40"}`}
      style={{
        left: table.x,
        top: table.y,
        width: ERD_TABLE_WIDTH,
      }}
      onPointerDown={event => {
        event.stopPropagation();
        props.onSelect(table.id);
      }}>
      <header
        className="flex cursor-grab items-center gap-2 border-b border-background-focus bg-background-focus/60 px-3 active:cursor-grabbing"
        style={{ height: ERD_TABLE_HEADER_HEIGHT }}
        onPointerDown={event => {
          event.stopPropagation();
          props.onSelect(table.id);
          props.onStartDrag(event, table);
        }}>
        <IconTable
          size={14}
          strokeWidth={1.7}
          className="shrink-0 text-foreground-off" />
        <h3 className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
          {table.name}
        </h3>
        <span className="shrink-0 text-[10px] text-foreground-off">
          {table.columns.length}
        </span>
      </header>

      {table.columns.length === 0 ? (
        <p
          className="flex items-center px-3 text-xs text-foreground-off"
          style={{ height: ERD_COLUMN_ROW_HEIGHT }}>
          No columns
        </p>
      ) : (
        <ul>
          {table.columns.map(column => (
            <li
              key={column.id}
              className="flex items-center gap-2 px-3 text-xs"
              style={{ height: ERD_COLUMN_ROW_HEIGHT }}>
              <span className="flex w-3.5 shrink-0 justify-center">
                {column.isPrimaryKey ? (
                  <IconKey
                    size={12}
                    strokeWidth={1.8}
                    aria-label="Primary key"
                    className="text-priority-medium" />
                ) : props.foreignKeyColumnIds.has(column.id) ? (
                  <IconLink
                    size={12}
                    strokeWidth={1.8}
                    aria-label="Foreign key"
                    className="text-status-cyan" />
                ) : null}
              </span>
              <span className="min-w-0 flex-1 truncate text-foreground">
                {column.name}
              </span>
              <span className="shrink-0 font-mono text-[11px] text-foreground-off">
                {column.type}
                {column.isNullable && !column.isPrimaryKey ? "?" : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
