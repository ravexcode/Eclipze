import {
  IconActivity,
  IconArrowUpRight,
  IconBug,
  IconFolders,
  IconSparkles,
  IconTerminal2,
} from "@tabler/icons-react";

import { PROJECT_STATUS_DOT } from "@/constants/workspace";
import type { WorkspaceSnapshot } from "@/types/user";
import { chartBarHeight, groupSessionsByDay } from "@/utils/overview";

type OverviewDashboardProps = {
  snapshot: WorkspaceSnapshot | null;
  loading: boolean;
  error: string | null;
  onOpenIssues: () => void;
  onOpenProjects: () => void;
  onOpenAgents: () => void;
};

export default function OverviewDashboard({
  snapshot,
  loading,
  error,
  onOpenIssues,
  onOpenProjects,
  onOpenAgents,
}: OverviewDashboardProps) {
  const metrics = snapshot?.metrics;
  const peak = Math.max(
    1,
    ...(metrics?.issuesByDay.map((day) => day.count) ?? [0]),
  );
  const featuredProject = snapshot?.projects[0] ?? null;
  const sessionGroups = groupSessionsByDay(
    snapshot?.agentSessions.slice(0, 12) ?? [],
  );

  return (
    <div className="mx-auto flex w-full max-w-245 flex-col gap-10 px-5 py-8 sm:px-8 lg:py-10">
      {error ? (
        <p
          role="alert"
          className="rounded-xs border border-alert-red bg-surface p-4 text-sm text-alert-red">
          {error}
        </p>
      ) : null}

      {loading && !snapshot ? (
        <p className="text-sm text-foreground-off" role="status">
          Loading workspace…
        </p>
      ) : null}

      <section className="flex flex-col gap-3 animate-fade-in-up">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-base font-semibold tracking-[-0.02em]">
              Current issues
            </p>
            <p className="mt-1 text-xs text-foreground-off">
              A clear view of what needs attention.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenIssues}
            className="inline-flex items-center gap-1 rounded-xs px-2 py-1 text-xs text-foreground-off transition-colors hover:bg-surface-raised hover:text-foreground">
            Open issues
            <IconArrowUpRight size={14} strokeWidth={1.8} />
          </button>
        </div>

        <article className="grid gap-px overflow-hidden rounded-xs border border-background-focus bg-background-focus sm:grid-cols-[minmax(0,1fr)_180px]">
          <div className="bg-surface p-5 sm:p-6">
            <div className="flex items-center gap-2 text-xs text-foreground-off">
              <IconBug size={16} strokeWidth={1.8} />
              <p>Issue activity</p>
            </div>

            {metrics && metrics.issuesByDay.some((day) => day.count > 0) ? (
              <div className="mt-8 flex h-24 items-end gap-2 border-y border-dashed border-background-focus px-1 py-2">
                {metrics.issuesByDay.map((day) => (
                  <div
                    key={day.date}
                    className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                    <span
                      className="w-full max-w-4 bg-accent"
                      style={{ height: `${chartBarHeight(day.count, peak)}%` }}
                      title={`${day.date}: ${day.count}`}
                    />
                    <span className="text-[10px] text-foreground-off">
                      {day.date.slice(8)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-8 flex h-24 items-center justify-center border-y border-dashed border-background-focus px-1">
                <p className="text-[11px] text-foreground-off">
                  No activity to chart yet.
                </p>
              </div>
            )}

            <p className="mt-3 text-xs text-foreground-off">
              {metrics && metrics.issuesTotal > 0
                ? `${metrics.issuesTotal} open issue${metrics.issuesTotal === 1 ? "" : "s"} across the last seven days.`
                : "No issue data yet. Activity will appear here when you create issues."}
            </p>
          </div>

          <div className="flex flex-col justify-between bg-surface-raised p-5 sm:p-6">
            <p className="text-xs text-foreground-off">Total issues</p>
            <p className="text-4xl font-normal tracking-[-0.06em]">
              {metrics?.issuesTotal ?? 0}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-foreground-off">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-priority-high" />
                Important {metrics?.issuesByPriority.HIGH ?? 0}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-priority-medium" />
                Medium {metrics?.issuesByPriority.MEDIUM ?? 0}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-foreground-off" />
                Low {metrics?.issuesByPriority.LOW ?? 0}
              </span>
            </div>
          </div>
        </article>
      </section>

      <section className="flex flex-col gap-3 animate-fade-in-up">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-base font-semibold tracking-[-0.02em]">
              Projects
            </p>
            <p className="mt-1 text-xs text-foreground-off">
              Keep the work that matters within reach.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenProjects}
            className="inline-flex items-center gap-1 rounded-xs px-2 py-1 text-xs text-foreground-off transition-colors hover:bg-surface-raised hover:text-foreground">
            View projects
            <IconArrowUpRight size={14} strokeWidth={1.8} />
          </button>
        </div>

        <article
          className={`rounded-xs bg-surface p-5 sm:p-6 ${featuredProject?.status === "AT_RISK" ? "border border-alert-red" : "border border-background-focus"}`}>
          {featuredProject ? (
            <div className="flex items-start justify-between gap-5">
              <div className="flex items-start gap-3">
                <span
                  className={`mt-1.5 h-2 w-2 rounded-full ${PROJECT_STATUS_DOT[featuredProject.status]}`}
                />
                <div>
                  <p className="text-sm font-semibold">{featuredProject.name}</p>
                  <p className="mt-2 max-w-xl text-xs leading-5 text-foreground-off">
                    {featuredProject.description ?? "No description yet."}
                  </p>
                  {snapshot && snapshot.projects.length > 1 ? (
                    <p className="mt-3 text-[11px] text-foreground-off">
                      +{snapshot.projects.length - 1} more project
                      {snapshot.projects.length === 2 ? "" : "s"}
                    </p>
                  ) : null}
                </div>
              </div>
              <IconFolders
                className="shrink-0 text-foreground-off"
                size={18}
                strokeWidth={1.7}
              />
            </div>
          ) : (
            <div className="flex items-start justify-between gap-5">
              <div className="flex items-start gap-3">
                <span className="mt-1.5 h-2 w-2 rounded-full bg-status-cyan" />
                <div>
                  <p className="text-sm font-semibold">No projects yet</p>
                  <p className="mt-2 max-w-xl text-xs leading-5 text-foreground-off">
                    Create a project to group issues, repositories, and agent
                    sessions.
                  </p>
                </div>
              </div>
              <IconFolders
                className="shrink-0 text-foreground-off"
                size={18}
                strokeWidth={1.7}
              />
            </div>
          )}
        </article>
      </section>

      <section className="flex flex-col gap-3 animate-fade-in-up">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-base font-semibold tracking-[-0.02em]">
              Agent sessions
            </p>
            <p className="mt-1 text-xs text-foreground-off">
              Recent runs from the agents in your workspace.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenAgents}
            className="inline-flex items-center gap-1 rounded-xs px-2 py-1 text-xs text-foreground-off transition-colors hover:bg-surface-raised hover:text-foreground">
            Open agent
            <IconArrowUpRight size={14} strokeWidth={1.8} />
          </button>
        </div>

        {sessionGroups.length === 0 ? (
          <article className="rounded-xs border border-background-focus bg-surface p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <IconSparkles
                className="mt-0.5 shrink-0 text-foreground-off"
                size={18}
                strokeWidth={1.7}
              />
              <div>
                <p className="text-sm font-semibold">No agent sessions yet</p>
                <p className="mt-2 text-xs leading-5 text-foreground-off">
                  Sessions will appear here when an agent has run in this
                  workspace.
                </p>
              </div>
            </div>
          </article>
        ) : (
          <div className="flex flex-col gap-5">
            {sessionGroups.map(([label, sessions]) => (
              <div key={label} className="flex flex-col gap-2">
                <p className="text-[11px] text-foreground-off">{label}</p>
                {sessions.map((session) => (
                  <article
                    key={session.id}
                    className="flex min-h-9.25 items-center gap-3 rounded-xs bg-surface px-4 py-2">
                    <IconTerminal2
                      className="shrink-0 text-foreground-off"
                      size={16}
                      strokeWidth={1.7}
                    />
                    <p className="min-w-0 flex-1 truncate text-xs">
                      {session.description}
                    </p>
                    <span className="shrink-0 text-[11px] text-foreground-off">
                      {session.model}
                    </span>
                  </article>
                ))}
              </div>
            ))}
          </div>
        )}

        <div className="hidden items-center gap-2 text-[11px] text-foreground-off sm:flex">
          <IconActivity size={14} strokeWidth={1.7} />
          <span>
            {metrics
              ? `${metrics.activeSessionsTotal} active session${metrics.activeSessionsTotal === 1 ? "" : "s"} · ${metrics.projectsTotal} project${metrics.projectsTotal === 1 ? "" : "s"}`
              : "Workspace activity will appear once your data is loaded."}
          </span>
        </div>
      </section>
    </div>
  );
}
