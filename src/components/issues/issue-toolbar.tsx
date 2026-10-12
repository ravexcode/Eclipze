import { IconBell, IconPlus, IconRefresh } from "@tabler/icons-react";

type IssueToolbarProps = {
  unread: number;
  loading: boolean;
  onRefresh: () => void;
  onCreateIssue: () => void;
};

export default function IssueToolbar({
  unread,
  loading,
  onRefresh,
  onCreateIssue,
}: IssueToolbarProps) {
  return (
    <section className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-lg font-medium">
          Your issues
        </p>
        <p className="mt-1 text-base text-foreground-off">
          Track bugs, ideas, and support conversations in one place.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <span
          className="flex items-center gap-1 rounded-sm bg-background-card px-3 py-2 text-base text-foreground-off"
          title="Unread notifications">
          <IconBell size={15} /> {unread}
        </span>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="rounded-sm bg-background-card p-2 text-foreground-off hover:bg-background-focus focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent disabled:opacity-50"
          aria-label="Refresh issues"
          title="Refresh from server">
          <IconRefresh size={17} />
        </button>

        <button
          type="button"
          onClick={onCreateIssue}
          className="flex items-center gap-2 rounded-sm bg-accent px-3 py-2 text-base transition-colors hover:bg-accent-strong focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent">
          <IconPlus size={16} /> New issue
        </button>
      </div>
    </section>
  );
}
