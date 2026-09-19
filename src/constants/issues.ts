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
