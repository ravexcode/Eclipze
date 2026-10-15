import type { IssueItem } from "@/types/issues";
import type { IssueStatus, IssueType } from "@/types/user";

const ISSUE_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

export function dateLabel(value: string) {
  return ISSUE_DATE_FORMATTER.format(new Date(value));
}

export function filterIssues(
  issues: IssueItem[],
  query: string,
  status: "ALL" | IssueStatus,
  type: "ALL" | IssueType,
) {
  const normalizedQuery = query.trim().toLowerCase();

  return issues.filter((item) => {
    const searchableText = `${item.title} ${item.description ?? ""} ${item.requester?.username ?? ""}`.toLowerCase();
    const matchesQuery =
      !normalizedQuery || searchableText.includes(normalizedQuery);

    return (
      matchesQuery &&
      (status === "ALL" || item.status === status) &&
      (type === "ALL" || item.type === type)
    );
  });
}
