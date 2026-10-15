import type { WorkspaceIssue } from "@/types/user";

const OVERVIEW_MONTH_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "long",
  timeZone: "UTC",
});

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

export function formatOverviewMonth(date: Date) {
  const month = OVERVIEW_MONTH_FORMATTER.format(date);

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
