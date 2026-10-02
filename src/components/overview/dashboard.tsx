import { IconArrowUpRight, IconInbox } from "@tabler/icons-react";

import { ISSUE_HEAT_LEVELS } from "@/constants/overview";
import type { WorkspaceIssue, WorkspaceSnapshot } from "@/types/user";
import {
  formatUsageDuration,
  getAgentUsagePeriods,
  getYearIssueDays,
  getNotificationLabel,
} from "@/utils/overview";

type OverviewDashboardProps = {
  snapshot: WorkspaceSnapshot | null;
  loading: boolean;
  error: string | null;
  onOpenIssue: (issue: WorkspaceIssue) => void;
  onOpenIssues: () => void;
};

export default function OverviewDashboard({
  snapshot,
  loading,
  error,
  onOpenIssue,
  onOpenIssues,
}: OverviewDashboardProps) {
  const now = new Date();
  const issues = snapshot?.issues ?? [];
  const sessions = snapshot?.agentSessions ?? [];
  const notifications = snapshot?.notifications ?? [];
  const yearDays = getYearIssueDays(issues, now);
  const usagePeriods = getAgentUsagePeriods(sessions, now);
  const peakIssueCount = Math.max(1, ...yearDays.map(day => day.count));
  const peakUsage = Math.max(0, ...usagePeriods.map(period => period.totalMilliseconds));
  const weekCount = Math.max(...yearDays.map(day => day.week)) + 1;
  const monthLabels = yearDays
    .filter(day => day.date.getDate() === 1)
    .map(day => ({
      label: new Intl.DateTimeFormat("en", { month: "short" }).format(day.date),
      week: day.week,
    }));

  return (
    <main className="min-h-dvh w-full min-w-0 px-5 py-5 sm:px-8 sm:py-6">
      <div className="mx-auto flex w-full max-w-[750px] flex-col gap-[30px]">
        {error ? (
          <p role="alert" className="text-[15px] text-alert-red">
            {error}
          </p>
        ) : null}

        <section aria-labelledby="issue-activity-title" className="flex flex-col gap-[15px] rounded-sm bg-background-card p-[15px] sm:p-5">
          <h1 id="issue-activity-title" className="text-[18px] font-medium">
            {now.getFullYear()} Issues
          </h1>

          {loading && !snapshot ? (
            <p role="status" className="text-[15px] text-foreground-off">
              Loading issue activity…
            </p>
          ) : (
            <div className="min-w-0 overflow-x-auto pb-1">
              <div className="grid min-w-[650px] gap-x-1.5 gap-y-1.5" style={{ gridTemplateColumns: `repeat(${weekCount}, minmax(0, 1fr))` }}>
                <div className="col-span-full grid h-5 text-[11px] text-foreground-off" style={{ gridTemplateColumns: `repeat(${weekCount}, minmax(0, 1fr))` }} aria-hidden="true">
                  {monthLabels.map(month => (
                    <span key={`${month.label}-${month.week}`} style={{ gridColumnStart: month.week + 1 }}>{month.label}</span>
                  ))}
                </div>
                {yearDays.map(day => {
                const level = day.count === 0
                  ? 0
                  : Math.min(3, Math.ceil((day.count / peakIssueCount) * 3));

                return (
                  <div key={day.dateKey} className="aspect-square min-w-0 rounded-[3px]" style={{ gridColumnStart: day.week + 1, gridRowStart: day.weekday + 2 }}>
                    <div
                      className={`h-full w-full rounded-[2px] ${ISSUE_HEAT_LEVELS[level]}`}
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

        <section aria-labelledby="agents-usage-title" className="flex flex-col gap-[15px] rounded-sm bg-background-card p-[15px] sm:p-5">
          <h2 id="agents-usage-title" className="text-[18px] font-medium">
            Agents usage
          </h2>

          {loading && !snapshot ? (
            <p role="status" className="text-[15px] text-foreground-off">
              Loading agent usage…
            </p>
          ) : (
            <div className="flex flex-col gap-[15px]">
              {usagePeriods.map(period => {
                const percentage = peakUsage === 0
                  ? 0
                  : Math.round((period.totalMilliseconds / peakUsage) * 100);

                return (
                  <div key={period.label} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-4 text-[14px]">
                      <span className="text-foreground-off">{period.label}</span>
                      <span className="text-foreground">
                        {formatUsageDuration(period.totalMilliseconds)}
                        <span className="ml-2 text-foreground-off">
                          {period.sessionCount} session{period.sessionCount === 1 ? "" : "s"}
                        </span>
                      </span>
                    </div>
                    <div
                      className="h-[7px] overflow-hidden rounded-full bg-background-focus"
                      role="progressbar"
                      aria-label={`${period.label} agent usage`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={percentage}>
                      <div
                        className="h-full rounded-full bg-status-purple transition-[width] duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section aria-labelledby="inbox-title" className="flex flex-col gap-[15px] rounded-sm bg-background-card p-[15px] sm:p-5">
          <div className="flex items-center justify-between gap-4">
            <h2 id="inbox-title" className="text-[18px] font-medium">
              Inbox
            </h2>
            <button
              type="button"
              onClick={onOpenIssues}
              className="inline-flex items-center gap-1.5 text-[14px] text-foreground-off transition-colors hover:text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent">
              Open all messages
              <IconArrowUpRight size={16} strokeWidth={1.8} />
            </button>
          </div>

          {loading && !snapshot ? (
            <p role="status" className="text-[15px] text-foreground-off">
              Loading inbox…
            </p>
          ) : notifications.length > 0 ? (
            <div className="flex flex-col">
              {notifications.slice(0, 6).map(notification => {
                const issue = issues.find(candidate => candidate.id === notification.issueId);

                return (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => issue ? onOpenIssue(issue) : onOpenIssues()}
                    className="flex min-h-9 items-center gap-2.5 border-b border-background-focus/70 py-2 text-left text-[14px] transition-colors hover:text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent">
                    <span
                      aria-hidden="true"
                      className={`h-2 w-2 shrink-0 rounded-full ${notification.readAt ? "bg-foreground-off/50" : "bg-status-purple"}`}
                    />
                    <span className="min-w-0 flex-1 truncate text-foreground-off">
                      {getNotificationLabel(notification)}
                    </span>
                    <IconArrowUpRight className="shrink-0 text-foreground-off" size={15} strokeWidth={1.8} />
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-2.5 py-2.5 text-[15px] text-foreground-off">
              <IconInbox size={19} strokeWidth={1.7} />
              <p>No messages yet.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
