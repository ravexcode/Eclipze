import type { WorkspaceAgentSession, WorkspaceIssue } from "@/types/user";

export type MonthIssueDay = {
  day: number;
  count: number;
};

export type YearIssueDay = {
  date: Date;
  dateKey: string;
  count: number;
  week: number;
  weekday: number;
};

export type AgentUsagePeriod = {
  label: string;
  totalMilliseconds: number;
  sessionCount: number;
};

export function formatOverviewMonth(date: Date) {
  const month = new Intl.DateTimeFormat("en", { month: "long" }).format(date);

  return `${month} ${date.getFullYear()} Issues`;
}

export function getMonthIssueDays(issues: WorkspaceIssue[], date = new Date()): MonthIssueDay[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const countsByDay = new Map<number, number>();

  for (const issue of issues) {
    const createdAt = new Date(issue.createdAt);

    if (createdAt.getFullYear() !== year || createdAt.getMonth() !== month) {
      continue;
    }

    const day = createdAt.getDate();
    countsByDay.set(day, (countsByDay.get(day) ?? 0) + 1);
  }

  return Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;

    return {
      day,
      count: countsByDay.get(day) ?? 0,
    };
  });
}

export function getYearIssueDays(issues: WorkspaceIssue[], date = new Date()): YearIssueDay[] {
  const year = date.getFullYear();
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  const mondayOffset = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - mondayOffset);

  const countsByDate = new Map<string, number>();

  for (const issue of issues) {
    const createdAt = new Date(issue.createdAt);

    if (createdAt.getFullYear() !== year) {
      continue;
    }

    const dateKey = `${year}-${String(createdAt.getMonth() + 1).padStart(2, "0")}-${String(createdAt.getDate()).padStart(2, "0")}`;
    countsByDate.set(dateKey, (countsByDate.get(dateKey) ?? 0) + 1);
  }

  const days: YearIssueDay[] = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    const dateKey = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
    const dayOfYear = Math.floor((cursor.getTime() - start.getTime()) / 86_400_000);

    days.push({
      date: new Date(cursor),
      dateKey,
      count: countsByDate.get(dateKey) ?? 0,
      week: Math.floor(dayOfYear / 7),
      weekday: (cursor.getDay() + 6) % 7,
    });

    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

function getPeriodStart(period: "day" | "week" | "month", date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  if (period === "week") {
    const daysSinceMonday = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - daysSinceMonday);
  }

  if (period === "month") {
    start.setDate(1);
  }

  return start.getTime();
}

function getSessionOverlap(session: WorkspaceAgentSession, from: number, to: number) {
  const sessionStart = new Date(session.startedAt).getTime();
  const sessionEnd = session.endedAt ? new Date(session.endedAt).getTime() : to;
  const overlapStart = Math.max(sessionStart, from);
  const overlapEnd = Math.min(sessionEnd, to);

  return Math.max(0, overlapEnd - overlapStart);
}

export function getAgentUsagePeriods(sessions: WorkspaceAgentSession[], date = new Date()): AgentUsagePeriod[] {
  const now = date.getTime();
  const periods = [
    { label: "Today", key: "day" as const },
    { label: "This week", key: "week" as const },
    { label: "This month", key: "month" as const },
  ];

  return periods.map(period => {
    const start = getPeriodStart(period.key, date);
    let totalMilliseconds = 0;
    let sessionCount = 0;

    for (const session of sessions) {
      const overlap = getSessionOverlap(session, start, now);

      if (overlap <= 0) {
        continue;
      }

      totalMilliseconds += overlap;
      sessionCount += 1;
    }

    return {
      label: period.label,
      totalMilliseconds,
      sessionCount,
    };
  });
}

export function formatUsageDuration(milliseconds: number) {
  const totalMinutes = Math.floor(milliseconds / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes}m`;
  }

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
}
