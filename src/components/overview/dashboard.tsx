import { IconArrowUpRight, IconInbox } from "@tabler/icons-react";

import UsageLimits from "@/components/overview/usage-limits";
import { ISSUE_HEAT_LEVELS } from "@/constants/overview";
import type { WorkspaceIssue, WorkspaceSnapshot } from "@/types/user";
import { getYearIssueDays } from "@/utils/overview";

const MONTH_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  timeZone: "UTC",
});

type OverviewDashboardProps = {
  snapshot: WorkspaceSnapshot | null;
  loading: boolean;
  error: string | null;
  onOpenIssue: (issue: WorkspaceIssue) => void;
  onOpenInbox: () => void;
};

export default function OverviewDashboard({
  snapshot,
  loading,
  error,
  onOpenInbox,
}: OverviewDashboardProps) {
  const now = new Date();
  const issues = snapshot?.issues ?? [];
  const mails = snapshot?.mails ?? [];
  const yearDays = getYearIssueDays(issues, now);
  const yearIssueCount = yearDays.reduce((total, day) => total + day.count, 0);
  const peakIssueCount = Math.max(1, ...yearDays.map(day => day.count));
  const weekCount = Math.max(...yearDays.map(day => day.week)) + 1;
  const monthLabels = yearDays
    .filter(day => day.date.getDate() === 1)
    .map(day => ({
      label: MONTH_FORMATTER.format(day.date),
      week: day.week,
    }));
  const isInitialLoad = loading && !snapshot;

  return (
    <main className="flex min-h-dvh min-w-0 flex-col">
      <header className="flex h-10 shrink-0 items-center px-4">
        <h1 className="text-xs text-foreground-off">
          Overview
        </h1>
      </header>

      <section className="flex min-h-0 flex-1 flex-col px-5 pb-8 sm:px-8">
        <div className="mx-auto flex w-full max-w-250 flex-col gap-4 pt-4">
          {error ? (
            <p
              role="alert"
              className="text-xs text-alert-red">
              {error}
            </p>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <UsageLimits />

            <section
              aria-labelledby="inbox-title"
              className="flex flex-col gap-3 rounded-md border border-background-focus bg-background-card p-4">
              <div className="flex items-center justify-between gap-4">
                <h2
                  id="inbox-title"
                  className="text-xs font-medium">
                  Inbox
                </h2>
                <button
                  type="button"
                  onClick={onOpenInbox}
                  className="inline-flex items-center gap-1 text-xs text-foreground-off transition-colors hover:text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent">
                  Open all
                  <IconArrowUpRight size={14} strokeWidth={1.8} />
                </button>
              </div>

              {isInitialLoad ? (
                <p
                  role="status"
                  className="text-xs text-foreground-off">
                  Loading inbox…
                </p>
              ) : mails.length > 0 ? (
                <div className="flex flex-col">
                  {mails.slice(0, 5).map(mail => (
                    <button
                      key={mail.id}
                      type="button"
                      onClick={onOpenInbox}
                      className="flex min-h-9 items-center gap-2.5 rounded-md px-2 py-2 text-left text-xs transition-colors hover:bg-background-focus focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent">
                      <span
                        aria-hidden="true"
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${mail.readAt ? "bg-background-focus" : "bg-foreground"}`}
                      />
                      <span className="min-w-0 flex-1 truncate text-foreground-off">
                        <span className="mr-2 text-foreground">
                          {mail.sender.username ?? mail.sender.email}
                        </span>
                        {mail.subject}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-1 items-center justify-center gap-2 py-6 text-xs text-foreground-off">
                  <IconInbox size={16} strokeWidth={1.7} />
                  <p>No mail yet.</p>
                </div>
              )}
            </section>
          </div>

          <section
            aria-labelledby="issue-activity-title"
            className="flex flex-col gap-3 rounded-md border border-background-focus bg-background-card p-4">
            <div className="flex items-center justify-between gap-4">
              <h2
                id="issue-activity-title"
                className="text-xs font-medium">
                {now.getFullYear()} issues
              </h2>
              {!isInitialLoad ? (
                <span className="text-xs text-foreground-off">
                  {yearIssueCount} created
                </span>
              ) : null}
            </div>

            {isInitialLoad ? (
              <p
                role="status"
                className="text-xs text-foreground-off">
                Loading issue activity…
              </p>
            ) : (
              <div className="min-w-0 overflow-x-auto pb-1">
                <div
                  className="grid min-w-[650px] gap-1"
                  style={{ gridTemplateColumns: `repeat(${weekCount}, minmax(0, 1fr))` }}>
                  <div
                    aria-hidden="true"
                    className="col-span-full grid min-h-5 text-[10px] text-foreground-off"
                    style={{ gridTemplateColumns: `repeat(${weekCount}, minmax(0, 1fr))` }}>
                    {monthLabels.map(month => (
                      <span
                        key={`${month.label}-${month.week}`}
                        style={{ gridColumnStart: month.week + 1 }}>
                        {month.label}
                      </span>
                    ))}
                  </div>

                  {yearDays.map(day => {
                    const level = day.count === 0
                      ? 0
                      : Math.min(3, Math.ceil((day.count / peakIssueCount) * 3));

                    return (
                      <div
                        key={day.dateKey}
                        className="aspect-square min-w-0"
                        style={{
                          gridColumnStart: day.week + 1,
                          gridRowStart: day.weekday + 2,
                        }}>
                        <div
                          className={`h-full w-full rounded-[3px] ${ISSUE_HEAT_LEVELS[level]}`}
                          title={`${day.date.toLocaleDateString("en", { month: "short", day: "numeric" })}: ${day.count} issue${day.count === 1 ? "" : "s"}`}
                          aria-label={`${day.date.toLocaleDateString("en", { month: "long", day: "numeric" })}: ${day.count} issues`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
