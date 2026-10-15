import type { MenuSelectorOption } from "@/components/ui/menu-selector";
import type { ProjectStatus } from "@/types/user";

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  ACTIVE: "Active",
  AT_RISK: "At risk",
  COMPLETED: "Completed",
};

export const PROJECT_STATUS_OPTIONS: MenuSelectorOption<ProjectStatus>[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "AT_RISK", label: "At risk" },
  { value: "COMPLETED", label: "Completed" },
];

export const PROJECT_STATUS_DOT: Record<ProjectStatus, string> = {
  ACTIVE: "bg-status-cyan",
  AT_RISK: "bg-alert-red",
  COMPLETED: "bg-status-green",
};

export const emptyProjectForm = {
  name: "",
  description: "",
  externalUrl: "",
  status: "ACTIVE" as ProjectStatus,
};
