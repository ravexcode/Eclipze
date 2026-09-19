import type { IssueItem } from "@/types/issues";
import type { UserRole } from "@/types/user";
import {
  priorityClasses,
  priorityLabels,
  statusLabels,
  typeLabels,
} from "@/constants/issues";
import { dateLabel } from "@/utils/issues";

type IssueResultsProps = {
  error: string | null;
  loading: boolean;
  issues: IssueItem[];
  role: UserRole;
  onOpenIssue: (issueId: string) => void;
};

export default function IssueResults({
  error,
  loading,
  issues,
  role,
  onOpenIssue,
}: IssueResultsProps) {
  return (
    <>
      {error && (
        <p
          role="alert"
          className="rounded-sm border border-priority-high bg-background-card p-3 text-sm text-priority-high">
          {error}
        </p>
      )}

      {loading ? (
        <p className="py-8 text-sm text-foreground-off">Loading issues…</p>
      ) : issues.length === 0 ? (
        <div className="rounded-sm bg-background-card p-8 text-center">
          <p className="text-lg">No issues found</p>
          <p className="mt-2 text-sm text-foreground-off">
            Create an issue when you need help or want to propose a feature.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {issues.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onOpenIssue(item.id)}
              className="flex w-full flex-col gap-3 rounded-sm bg-background-card p-4 text-left hover:bg-background-focus md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-medium">{item.title}</span>
                  <span className="text-xs text-foreground-off">
                    {typeLabels[item.type]}
                  </span>
                  {role === "DEVELOPER" && item.requester && (
                    <span className="text-xs text-foreground-off">
                      by {item.requester.username ?? item.requester.email}
                    </span>
                  )}
                </div>

                <p className="mt-1 line-clamp-2 text-sm text-foreground-off">
                  {item.description}
                </p>
                <p className="mt-2 text-xs text-foreground-off">
                  Updated {dateLabel(item.lastActivityAt)}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-3 text-xs">
                <span className={priorityClasses[item.priority]}>
                  {priorityLabels[item.priority]}
                </span>
                <span className="text-foreground-off">
                  {statusLabels[item.status]}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
