import type { WorkspaceAgentSession } from "@/types/user";

export function sessionGroupLabel(isoDate: string) {
  const started = new Date(isoDate);

  if (Number.isNaN(started.getTime())) {
    return "Earlier";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const day = new Date(started);
  day.setHours(0, 0, 0, 0);

  const diffDays = Math.round((today.getTime() - day.getTime()) / 86_400_000);

  if (diffDays === 0) {
    return "Today";
  }

  if (diffDays === 1) {
    return "Yesterday";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(started);
}

export function groupSessionsByDay(sessions: WorkspaceAgentSession[]) {
  const groups = new Map<string, WorkspaceAgentSession[]>();

  for (const session of sessions) {
    const label = sessionGroupLabel(session.startedAt);
    const existing = groups.get(label) ?? [];
    existing.push(session);
    groups.set(label, existing);
  }

  return [...groups.entries()];
}

export function chartBarHeight(count: number, peak: number) {
  if (peak <= 0) {
    return 8;
  }

  return Math.max(8, Math.round((count / peak) * 88));
}
