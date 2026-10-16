"use client";

import { useState } from "react";
import { IconArrowRight, IconPlus, IconTrash, IconX } from "@tabler/icons-react";

import ErdToggleChip from "@/components/erd/erd-toggle-chip";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import MenuSelector from "@/components/ui/menu-selector";
import {
  ERD_CARDINALITY_LABELS,
  ERD_CARDINALITY_OPTIONS,
  ERD_COLUMN_TYPE_OPTIONS,
} from "@/constants/erd";
import type {
  ErdColumn,
  ErdDocument,
  ErdRelation,
  ErdRelationDraft,
  ErdTable,
} from "@/types/erd";
import {
  createErdRelationDraft,
  describeErdColumn,
  findErdTable,
  getErdNameError,
  getPrimaryKeyColumn,
} from "@/utils/erd";

interface Props {
  document: ErdDocument;
  table: ErdTable;
  onChangeTable(changes: Partial<ErdTable>): void;
  onAddColumn(): void;
  onChangeColumn(columnId: string, changes: Partial<ErdColumn>): void;
  onRemoveColumn(columnId: string): void;
  onAddRelation(relation: Omit<ErdRelation, "id">): void;
  onRemoveRelation(relationId: string): void;
  onRemoveTable(): void;
  onClose(): void;
}

export default function ErdTablePanel(props: Props) {
  const { document, table } = props;
  const [relationDraft, setRelationDraft] = useState<ErdRelationDraft>(() => createErdRelationDraft(document, table));
  const [isAddingRelation, setIsAddingRelation] = useState(false);

  const otherTableNames = document.tables
    .filter(otherTable => otherTable.id !== table.id)
    .map(otherTable => otherTable.name);
  const tableNameError = getErdNameError(table.name, otherTableNames);

  const tableRelations = document.relations.filter(relation => (
    relation.fromTableId === table.id || relation.toTableId === table.id
  ));

  const fromColumnOptions = table.columns.map(column => ({
    value: column.id,
    label: column.name || "untitled",
  }));
  const targetTableOptions = document.tables.map(targetTable => ({
    value: targetTable.id,
    label: targetTable.name || "Untitled",
  }));
  const targetTable = findErdTable(document, relationDraft.toTableId);
  const targetColumnOptions = (targetTable?.columns ?? []).map(column => ({
    value: column.id,
    label: column.name || "untitled",
  }));

  const canAddRelation = Boolean(
    table.columns.some(column => column.id === relationDraft.fromColumnId)
    && targetTable?.columns.some(column => column.id === relationDraft.toColumnId),
  );

  const startRelation = () => {
    setRelationDraft(createErdRelationDraft(document, table));
    setIsAddingRelation(true);
  };

  const changeTargetTable = (toTableId: string) => {
    const nextTargetTable = findErdTable(document, toTableId);

    setRelationDraft(current => ({
      ...current,
      toTableId,
      toColumnId: nextTargetTable ? getPrimaryKeyColumn(nextTargetTable)?.id ?? "" : "",
    }));
  };

  const addRelation = () => {
    if (!canAddRelation) {
      return;
    }

    props.onAddRelation({
      fromTableId: table.id,
      fromColumnId: relationDraft.fromColumnId,
      toTableId: relationDraft.toTableId,
      toColumnId: relationDraft.toColumnId,
      cardinality: relationDraft.cardinality,
    });
    setIsAddingRelation(false);
  };

  return (
    <aside
      data-lenis-prevent
      aria-label={`Edit ${table.name} table`}
      className="menu-enter flex w-full shrink-0 flex-col overflow-y-auto border-t border-background-focus bg-background-card md:w-88 md:border-l md:border-t-0">
      <header className="flex items-center justify-between gap-3 border-b border-background-focus px-4 py-3">
        <div className="min-w-0">
          <p className="text-xs text-foreground-off">
            Table
          </p>
          <p className="truncate text-sm font-medium">
            {table.name || "Untitled"}
          </p>
        </div>
        <button
          type="button"
          onClick={props.onClose}
          aria-label="Close table editor"
          className="rounded-md p-1 text-foreground-off transition-colors hover:bg-background-focus hover:text-foreground">
          <IconX size={15} />
        </button>
      </header>

      <section className="flex flex-col gap-2 border-b border-background-focus px-4 py-4">
        <label
          htmlFor={`erd-table-name-${table.id}`}
          className="text-xs text-foreground-off">
          Name
        </label>
        <Input
          id={`erd-table-name-${table.id}`}
          value={table.name}
          onChange={name => props.onChangeTable({ name: name.trim() })}
          aria-invalid={tableNameError ? true : undefined}
          spellCheck={false}
          autoComplete="off" />
        {tableNameError ? (
          <p
            role="alert"
            className="text-xs text-alert-red">
            {tableNameError}
          </p>
        ) : null}
      </section>

      <section className="flex flex-col gap-3 border-b border-background-focus px-4 py-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-medium">
            Columns
          </h4>
          <Button
            variant="ghost"
            onClick={props.onAddColumn}>
            <IconPlus size={13} strokeWidth={1.8} className="mr-1" />
            Add column
          </Button>
        </div>

        {table.columns.length === 0 ? (
          <p className="rounded-md border border-dashed border-background-focus px-3 py-4 text-center text-xs text-foreground-off">
            This table has no columns yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {table.columns.map(column => {
              const otherColumnNames = table.columns
                .filter(otherColumn => otherColumn.id !== column.id)
                .map(otherColumn => otherColumn.name);
              const columnNameError = getErdNameError(column.name, otherColumnNames);

              return (
                <li
                  key={column.id}
                  className="flex flex-col gap-2 rounded-md border border-background-focus bg-background p-2">
                  <div className="flex items-center gap-2">
                    <Input
                      value={column.name}
                      onChange={name => props.onChangeColumn(column.id, { name: name.trim() })}
                      aria-label="Column name"
                      aria-invalid={columnNameError ? true : undefined}
                      spellCheck={false}
                      autoComplete="off"
                      className="min-w-0 flex-1 bg-background-card! text-xs!" />
                    <MenuSelector
                      ariaLabel="Column type"
                      className="w-28 shrink-0"
                      options={ERD_COLUMN_TYPE_OPTIONS}
                      value={column.type}
                      placeholder="Type"
                      onChange={type => props.onChangeColumn(column.id, { type })} />
                    <button
                      type="button"
                      onClick={() => props.onRemoveColumn(column.id)}
                      aria-label={`Remove ${column.name || "column"}`}
                      className="shrink-0 rounded-md p-1 text-foreground-off transition-colors hover:bg-background-focus hover:text-alert-red">
                      <IconTrash size={14} strokeWidth={1.7} />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <ErdToggleChip
                      label="Primary key"
                      isActive={column.isPrimaryKey}
                      onToggle={() => props.onChangeColumn(column.id, {
                        isPrimaryKey: !column.isPrimaryKey,
                        isNullable: column.isPrimaryKey ? column.isNullable : false,
                      })} />
                    <ErdToggleChip
                      label="Nullable"
                      isActive={column.isNullable}
                      disabled={column.isPrimaryKey}
                      onToggle={() => props.onChangeColumn(column.id, { isNullable: !column.isNullable })} />
                    <ErdToggleChip
                      label="Unique"
                      isActive={column.isUnique}
                      disabled={column.isPrimaryKey}
                      onToggle={() => props.onChangeColumn(column.id, { isUnique: !column.isUnique })} />
                  </div>

                  {columnNameError ? (
                    <p
                      role="alert"
                      className="text-xs text-alert-red">
                      {columnNameError}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3 border-b border-background-focus px-4 py-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-medium">
            Relations
          </h4>
          {!isAddingRelation ? (
            <Button
              variant="ghost"
              onClick={startRelation}
              disabled={table.columns.length === 0}>
              <IconPlus size={13} strokeWidth={1.8} className="mr-1" />
              Add relation
            </Button>
          ) : null}
        </div>

        {isAddingRelation ? (
          <div className="flex flex-col gap-2 rounded-md border border-background-focus bg-background p-3">
            <p className="text-xs text-foreground-off">
              Foreign key in {table.name || "this table"}
            </p>
            <MenuSelector
              ariaLabel="Foreign key column"
              options={fromColumnOptions}
              value={relationDraft.fromColumnId}
              placeholder="Select a column"
              onChange={fromColumnId => setRelationDraft(current => ({ ...current, fromColumnId }))} />

            <p className="text-xs text-foreground-off">
              References
            </p>
            <div className="flex gap-2">
              <MenuSelector
                ariaLabel="Referenced table"
                className="min-w-0 flex-1"
                options={targetTableOptions}
                value={relationDraft.toTableId}
                placeholder="Table"
                onChange={changeTargetTable} />
              <MenuSelector
                ariaLabel="Referenced column"
                className="min-w-0 flex-1"
                options={targetColumnOptions}
                value={relationDraft.toColumnId}
                placeholder="Column"
                onChange={toColumnId => setRelationDraft(current => ({ ...current, toColumnId }))} />
            </div>

            <p className="text-xs text-foreground-off">
              Cardinality
            </p>
            <MenuSelector
              ariaLabel="Cardinality"
              options={ERD_CARDINALITY_OPTIONS}
              value={relationDraft.cardinality}
              placeholder="Cardinality"
              onChange={cardinality => setRelationDraft(current => ({ ...current, cardinality }))} />

            <div className="mt-1 flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => setIsAddingRelation(false)}>
                Cancel
              </Button>
              <Button
                onClick={addRelation}
                disabled={!canAddRelation}>
                Add relation
              </Button>
            </div>
          </div>
        ) : null}

        {tableRelations.length === 0 && !isAddingRelation ? (
          <p className="text-xs text-foreground-off">
            No relations yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {tableRelations.map(relation => (
              <li
                key={relation.id}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-background-focus/50">
                <div className="min-w-0 flex-1">
                  <p className="flex min-w-0 items-center gap-1.5 font-mono text-[11px]">
                    <span className="truncate">
                      {describeErdColumn(document, relation.fromTableId, relation.fromColumnId)}
                    </span>
                    <IconArrowRight size={12} className="shrink-0 text-foreground-off" />
                    <span className="truncate">
                      {describeErdColumn(document, relation.toTableId, relation.toColumnId)}
                    </span>
                  </p>
                  <p className="mt-0.5 text-foreground-off">
                    {ERD_CARDINALITY_LABELS[relation.cardinality]}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => props.onRemoveRelation(relation.id)}
                  aria-label="Remove relation"
                  className="shrink-0 rounded-md p-1 text-foreground-off transition-colors hover:bg-background-focus hover:text-alert-red">
                  <IconTrash size={14} strokeWidth={1.7} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="px-4 py-4">
        <Button
          variant="secondary"
          onClick={props.onRemoveTable}
          className="w-full text-alert-red!">
          <IconTrash size={13} strokeWidth={1.8} className="mr-1" />
          Delete table
        </Button>
      </section>
    </aside>
  );
}
