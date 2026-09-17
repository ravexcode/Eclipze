"use client";

import type { AiProviderConnection } from "@/types/ai";
import { IconAlertTriangle, IconKey } from "@tabler/icons-react";
import { getProviderLabel } from "./types";

function keyLabel(connection: AiProviderConnection) {
  return (
    getProviderLabel(connection.provider) +
    " " +
    (connection.keyHint ? "••••" + connection.keyHint : "connected")
  );
}

export default function KeyHints({
  connections,
  compact = false,
}: {
  connections: AiProviderConnection[];
  compact?: boolean;
}) {
  if (connections.length === 0) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-warning">
        <IconAlertTriangle size={14} strokeWidth={1.8} />
        No API keys connected
      </span>
    );
  }

  return (
    <span
      className={"flex min-w-0 items-center gap-1.5 text-xs text-foreground-off " + (compact ? "max-w-44" : "")}
      title={connections.map(keyLabel).join(", ")}>
      <IconKey size={14} strokeWidth={1.8} />
      <span className="truncate">{connections.map(keyLabel).join(" · ")}</span>
    </span>
  );
}
