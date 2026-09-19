import type { IssueItem } from "@/types/issues";
import type { IssueStatus, IssueType } from "@/types/user";

export function dateLabel(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
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
