"use client";

import { IconChevronDown } from "@tabler/icons-react";
import { useState } from "react";

import { AGENT_PERMISSION_MODE_OPTIONS } from "@/constants/agents";
import type { AgentPermissionMode } from "@/types/agent-runner";

interface Props {
  value: AgentPermissionMode;
  onChange: (value: AgentPermissionMode) => void;
}

export default function PermissionModeSelector({ value, onChange }: Props) {
  const [expanded, setExpanded] = useState(false);
  const selectedMode = AGENT_PERMISSION_MODE_OPTIONS.find(
    (option) => option.value === value,
  );

  return (
    <div className="relative w-44 shrink-0 text-xs">
      <button
        type="button"
        aria-label={`Permission mode: ${selectedMode?.label ?? "Select a mode"}`}
        aria-haspopup="listbox"
        aria-expanded={expanded}
        onClick={() => setExpanded((previous) => !previous)}
        className="flex w-full items-center justify-between gap-3 rounded-sm bg-background-card px-3 py-2 text-left transition-colors hover:bg-background-focus focus-visible:outline-2 focus-visible:outline-accent">
        <span className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 text-foreground/80">Mode</span>
          <span className="truncate font-medium text-foreground">
            {selectedMode?.label ?? "Select a mode"}
          </span>
        </span>
        <IconChevronDown
          size={14}
          strokeWidth={1.8}
          className={`shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded ? (
        <div className="absolute left-0 top-full z-30 mt-1 w-64 overflow-hidden rounded-sm border border-background-focus bg-background-card p-1">
          <div role="listbox" aria-label="Permission modes">
            {AGENT_PERMISSION_MODE_OPTIONS.map((option) => {
              const selected = option.value === value;

              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onChange(option.value);
                    setExpanded(false);
                  }}
                  className={`flex w-full flex-col gap-1 rounded-xs px-3 py-2 text-left transition-colors hover:bg-background-focus focus-visible:outline-2 focus-visible:outline-accent ${
                    selected ? "bg-background-focus" : ""
                  }`}>
                  <span className="font-medium text-foreground">
                    {option.label}
                  </span>
                  <span className="text-[10px] leading-4 text-foreground/80">
                    {option.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
