import type { AgentRunStatus } from "@/types/agent-runner";

export const ACTIVE_AGENT_RUN_STATUSES: AgentRunStatus[] = [
  "QUEUED",
  "RUNNING",
  "WAITING_FOR_APPROVAL",
];

export const FAILED_AGENT_RUN_STATUSES: AgentRunStatus[] = [
  "FAILED",
  "BLOCKED",
  "CANCELLED",
];

export const AGENT_RUN_STATUS_LABELS: Record<string, string> = {
  QUEUED: "Queued",
  RUNNING: "Working",
  WAITING_FOR_APPROVAL: "Needs approval",
  SUCCEEDED: "Done",
  FAILED: "Failed",
  BLOCKED: "Blocked",
  CANCELLED: "Cancelled",
};

export const AGENT_RUN_ACTIVITY_LABELS: Record<string, string> = {
  QUEUED: "Waiting for an agent…",
  RUNNING: "Agent is working…",
  WAITING_FOR_APPROVAL: "Waiting for your approval…",
};

export const CHAT_CARD_CLASSES = "rounded-lg border border-background-focus bg-background-card";
