import type { AgentRunEventType, AgentRunStatus } from "@/types/agent-runner";

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

export const THINKING_EVENT_TYPES: AgentRunEventType[] = [
  "SYSTEM",
  "COMMAND",
  "OUTPUT",
  "ERROR",
];

export const AGENT_RUN_ACTIVITY_LABELS: Record<string, string> = {
  QUEUED: "Waiting for an agent…",
  RUNNING: "Thinking…",
  WAITING_FOR_APPROVAL: "Waiting for your approval…",
};

export const STARTING_TASK_LABEL = "Starting your task…";

export const CHAT_CARD_CLASSES = "rounded-lg border border-background-focus bg-background-card";
