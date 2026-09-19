import type { UserRole } from "@/types/user";
import { IconBell, IconPlus, IconRefresh } from "@tabler/icons-react";

type IssueToolbarProps = {
  role: UserRole;
  unread: number;
  loading: boolean;
  onRefresh: () => void;
  onManageAccess: () => void;
  onCreateIssue: () => void;
};

export default function IssueToolbar({
  role,
  unread,
  loading,
  onRefresh,
  onManageAccess,
  onCreateIssue,
}: IssueToolbarProps) {
  return (
    <section className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-xl font-medium">
          {role === "DEVELOPER" ? "All user issues" : "Your issues"}
        </p>
        <p className="mt-1 text-sm text-foreground-off">
          Track bugs, ideas, and support conversations in one place.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <span
          className="flex items-center gap-1 rounded-sm bg-background-card px-3 py-2 text-xs text-foreground-off"
          title="Unread notifications">
          <IconBell size={15} /> {unread}
        </span>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="rounded-sm bg-background-card p-2 text-foreground-off hover:bg-background-focus disabled:opacity-50"
          aria-label="Refresh issues"
          title="Refresh from server">
          <IconRefresh size={17} />
        </button>

        {role === "DEVELOPER" && (
          <button
            type="button"
            onClick={onManageAccess}
            className="rounded-sm bg-background-card px-3 py-2 text-xs text-foreground-off hover:bg-background-focus">
            Manage access
          </button>
        )}

        {role === "USER" && (
          <button
            type="button"
            onClick={onCreateIssue}
            className="flex items-center gap-2 rounded-sm bg-accent px-3 py-2 text-sm hover:brightness-125">
            <IconPlus size={16} /> New issue
          </button>
        )}
      </div>
    </section>
  );
}
