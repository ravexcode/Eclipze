import { IconArrowUpRight, IconInbox } from "@tabler/icons-react";

import { ISSUE_HEAT_LEVELS } from "@/constants/overview";
import type { WorkspaceIssue, WorkspaceSnapshot } from "@/types/user";
import {
  formatUsageDuration,
  formatOverviewMonth,
  getAgentUsagePeriods,
  getMonthIssueDays,
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
  const monthDays = getMonthIssueDays(issues, now);
  const usagePeriods = getAgentUsagePeriods(sessions, now);
  const peakIssueCount = Math.max(1, ...monthDays.map(day => day.count));
  const peakUsage = Math.max(0, ...usagePeriods.map(period => period.totalMilliseconds));

  return (
    <main className="min-h-dvh w-full min-w-0 px-5 py-5 sm:px-8 sm:py-6">
      <div className="mx-auto flex w-full max-w-[600px] flex-col gap-6">
        {error ? (
          <p role="alert" className="text-xs text-alert-red">
            {error}
          </p>
        ) : null}

        <section aria-labelledby="issue-activity-title" className="flex flex-col gap-3">
          <h1 id="issue-activity-title" className="text-sm font-medium">
            {formatOverviewMonth(now)}
          </h1>

          {loading && !snapshot ? (
            <p role="status" className="text-xs text-foreground-off">
              Loading issue activity…
            </p>
          ) : (
            <div className="grid gap-x-1.5 gap-y-1" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(12px, 1fr))" }}>
              {monthDays.map(day => {
                const level = day.count === 0
                  ? 0
                  : Math.min(3, Math.ceil((day.count / peakIssueCount) * 3));

                return (
                  <div
                    key={day.day}
                    className={`aspect-square min-w-0 rounded-[2px] ${ISSUE_HEAT_LEVELS[level]}`}
                    title={`${now.toLocaleString("en", { month: "long" })} ${day.day}: ${day.count} issue${day.count === 1 ? "" : "s"}`}
                    aria-label={`${day.day}: ${day.count} issues`}
                  />
                );
              })}
            </div>
          )}
        </section>

        <section aria-labelledby="agents-usage-title" className="flex flex-col gap-3">
          <h2 id="agents-usage-title" className="text-sm font-medium">
            Agents usage
          </h2>

          {loading && !snapshot ? (
            <p role="status" className="text-xs text-foreground-off">
              Loading agent usage…
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {usagePeriods.map(period => {
                const percentage = peakUsage === 0
                  ? 0
                  : Math.round((period.totalMilliseconds / peakUsage) * 100);

                return (
                  <div key={period.label} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-4 text-[11px]">
                      <span className="text-foreground-off">{period.label}</span>
                      <span className="text-foreground">
                        {formatUsageDuration(period.totalMilliseconds)}
                        <span className="ml-2 text-foreground-off">
                          {period.sessionCount} session{period.sessionCount === 1 ? "" : "s"}
                        </span>
                      </span>
                    </div>
                    <div
                      className="h-1.5 overflow-hidden rounded-full bg-background-focus"
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

        <section aria-labelledby="inbox-title" className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <h2 id="inbox-title" className="text-sm font-medium">
              Inbox
            </h2>
            <button
              type="button"
              onClick={onOpenIssues}
              className="inline-flex items-center gap-1 text-[11px] text-foreground-off transition-colors hover:text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent">
              Open all messages
              <IconArrowUpRight size={13} strokeWidth={1.8} />
            </button>
          </div>

          {loading && !snapshot ? (
            <p role="status" className="text-xs text-foreground-off">
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
                    className="flex min-h-7 items-center gap-2 border-b border-background-focus/70 py-1.5 text-left text-[11px] transition-colors hover:text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent">
                    <span
                      aria-hidden="true"
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${notification.readAt ? "bg-foreground-off/50" : "bg-status-purple"}`}
                    />
                    <span className="min-w-0 flex-1 truncate text-foreground-off">
                      {getNotificationLabel(notification)}
                    </span>
                    <IconArrowUpRight className="shrink-0 text-foreground-off" size={12} strokeWidth={1.8} />
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-2 py-2 text-xs text-foreground-off">
              <IconInbox size={15} strokeWidth={1.7} />
              <p>No messages yet.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
