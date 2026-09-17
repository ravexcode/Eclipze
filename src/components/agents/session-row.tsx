"use client";

import { IconMessage2 } from "@tabler/icons-react";
import type { WorkspaceAgentSession } from "@/types/user";
import { sessionTime } from "./types";

export default function SessionRow({
  session,
  selected,
  onSelect,
}: {
  session: WorkspaceAgentSession;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={
        "group flex w-full items-start gap-3 rounded-sm p-3 text-left transition-colors " +
        (selected
          ? "bg-background-focus text-foreground"
          : "text-foreground-off hover:bg-background-focus/70 hover:text-foreground")
      }>
      <IconMessage2 className="mt-0.5 shrink-0" size={16} strokeWidth={1.8} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-foreground">
          {session.description}
        </span>
        <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-foreground-off">
          <span>{session.model}</span>
          <span>·</span>
          <span>{sessionTime(session.startedAt)}</span>
        </span>
      </span>
      <span
        className={
          "mt-1 h-1.5 w-1.5 shrink-0 rounded-full " +
          (session.status === "ACTIVE"
            ? "bg-priority-medium"
            : session.status === "FAILED"
              ? "bg-priority-high"
              : "bg-priority-low")
        }
        aria-label={session.status.toLowerCase()}
      />
    </button>
  );
}
