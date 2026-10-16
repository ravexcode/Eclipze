import { IconAlertTriangle } from "@tabler/icons-react";

import {
  ERD_DATABASE_CHANGE_KIND_CLASSES,
  ERD_DATABASE_CHANGE_KIND_LABELS,
} from "@/constants/erd";
import type { ErdDatabaseChange } from "@/types/erd";

interface Props {
  changes: ErdDatabaseChange[];
}

export default function ErdChangeList(props: Props) {
  if (props.changes.length === 0) {
    return null;
  }

  const destructiveCount = props.changes.filter(change => change.isDestructive).length;

  return (
    <section
      aria-label="Database changes"
      className="mt-2 rounded-md border border-background-focus bg-background">
      <header className="flex items-center justify-between gap-2 border-b border-background-focus px-3 py-2 text-xs">
        <span className="font-medium">
          {props.changes.length} change{props.changes.length === 1 ? "" : "s"}
        </span>
        {destructiveCount > 0 ? (
          <span className="flex items-center gap-1 text-alert-red">
            <IconAlertTriangle size={12} strokeWidth={1.8} />
            {destructiveCount} destructive
          </span>
        ) : null}
      </header>

      <ol className="flex flex-col divide-y divide-background-focus">
        {props.changes.map((change, index) => (
          <li
            key={`${index}-${change.statement}`}
            className="px-3 py-2">
            <p className="flex items-baseline gap-2 text-xs">
              <span className={`shrink-0 font-medium ${ERD_DATABASE_CHANGE_KIND_CLASSES[change.kind]}`}>
                {ERD_DATABASE_CHANGE_KIND_LABELS[change.kind]}
              </span>
              <span className="min-w-0 text-foreground">
                {change.description}
              </span>
            </p>
            <details className="mt-1">
              <summary className="cursor-pointer text-xs text-foreground-off">
                Statement
              </summary>
              <pre
                data-lenis-prevent
                className="mt-1 overflow-x-auto rounded-md bg-background-focus p-2 font-mono text-xs leading-5 text-foreground">
                <code>{change.statement}</code>
              </pre>
            </details>
          </li>
        ))}
      </ol>
    </section>
  );
}
