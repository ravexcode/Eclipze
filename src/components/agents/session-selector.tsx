"use client";

import { useEffect, useRef, useState } from "react";
import { IconHistory } from "@tabler/icons-react";

import type { AgentRun } from "@/types/agent-runner";
import { AGENT_RUN_STATUS_DOT_CLASSES } from "@/constants/agents";
import { apiFetch } from "@/utils/api-fetch";
import { readJson } from "@/utils/json-payload";

interface Props {
  currentRunId?: string;
  onSelect(runId: string): void;
}

export default function SessionSelector(props: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    async function loadRuns() {
      setIsLoading(true);
      try {
        const response = await apiFetch("/api/agent-runs", { cache: "no-store" });
        const payload = await readJson(response) as { runs?: AgentRun[] };
        if (cancelled) return;
        if (response.ok) setRuns(payload.runs ?? []);
      } catch {
        if (cancelled) return;
        setRuns([]);
      } finally {
        if (cancelled) return;
        setIsLoading(false);
      }
    }

    void loadRuns();
    return () => { cancelled = true; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(value => !value)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs text-foreground-off transition-colors hover:bg-background-focus hover:text-foreground">
        <IconHistory size={14} />
        Sessions
      </button>

      {isOpen ? (
        <div
          role="listbox"
          aria-label="Previous sessions"
          className="absolute bottom-full left-0 z-20 mb-2 max-h-72 w-72 overflow-y-auto rounded-md border border-background-focus bg-background-card p-1 shadow-lg">
          {isLoading && runs.length === 0 ? (
            <p role="status" className="px-2.5 py-2 text-xs text-foreground-off">Loading sessions…</p>
          ) : null}
          {!isLoading && runs.length === 0 ? (
            <p className="px-2.5 py-2 text-xs text-foreground-off">No sessions yet.</p>
          ) : null}

          {runs.map(run => (
            <button
              key={run.id}
              type="button"
              role="option"
              aria-selected={run.id === props.currentRunId}
              onClick={() => {
                setIsOpen(false);
                props.onSelect(run.id);
              }}
              className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs transition-colors hover:bg-background-focus ${run.id === props.currentRunId ? "bg-background-focus" : ""}`}>
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${AGENT_RUN_STATUS_DOT_CLASSES[run.status] ?? "bg-foreground-off"}`} />
              <span className="min-w-0 flex-1 truncate">{run.prompt || "Untitled session"}</span>
              <span className="shrink-0 text-foreground-off">{new Date(run.createdAt).toLocaleDateString()}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
