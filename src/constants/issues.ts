import type { MenuSelectorOption } from "@/components/ui/menu-selector";
import type { IssueFormValues } from "@/types/issues";
import type { IssuePriority, IssueStatus, IssueType } from "@/types/user";

export const initialIssueForm: IssueFormValues = {
  title: "",
  description: "",
  type: "SUPPORT",
  priority: "MEDIUM",
};

export const typeLabels: Record<IssueType, string> = {
  BUG: "Bug",
  FEATURE: "Feature",
  SUPPORT: "Support",
};

export const statusLabels: Record<IssueStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  WAITING_FOR_USER: "Waiting for user",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

export const priorityLabels: Record<IssuePriority, string> = {
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

export const priorityClasses: Record<IssuePriority, string> = {
  HIGH: "text-priority-high",
  MEDIUM: "text-priority-medium",
  LOW: "text-priority-low",
};

export const ISSUE_TYPE_OPTIONS: MenuSelectorOption<IssueType>[] = [
  { value: "SUPPORT", label: "Support" },
  { value: "BUG", label: "Bug" },
  { value: "FEATURE", label: "Feature" },
];

export const ISSUE_PRIORITY_OPTIONS: MenuSelectorOption<IssuePriority>[] = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
];

export const ISSUE_STATUS_OPTIONS: MenuSelectorOption<IssueStatus>[] = [
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "WAITING_FOR_USER", label: "Waiting for user" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
];

export const ISSUE_STATUS_FILTER_OPTIONS: MenuSelectorOption<"ALL" | IssueStatus>[] = [
  { value: "ALL", label: "All statuses" },
  ...ISSUE_STATUS_OPTIONS,
];

export const ISSUE_TYPE_FILTER_OPTIONS: MenuSelectorOption<"ALL" | IssueType>[] = [
  { value: "ALL", label: "All types" },
  ...ISSUE_TYPE_OPTIONS,
];
