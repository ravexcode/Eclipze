import type { AgentRun, AgentRunEvent } from "@/types/agent-runner";
import {
  ACTIVE_AGENT_RUN_STATUSES,
  FAILED_AGENT_RUN_STATUSES,
} from "@/constants/chat-thread";

export function isAgentRunActive(run: AgentRun) {
  return ACTIVE_AGENT_RUN_STATUSES.includes(run.status);
}

export function isAgentRunFailed(run: AgentRun) {
  return FAILED_AGENT_RUN_STATUSES.includes(run.status);
}

export function getAgentRunOutput(run: AgentRun) {
  return run.events
    ?.filter(event => event.type === "OUTPUT")
    .map(event => event.message)
    .join("") ?? "";
}

export function getAgentRunErrors(run: AgentRun) {
  return run.events?.filter(event => event.type === "ERROR") ?? [];
}

export function getPendingApproval(run: AgentRun): AgentRunEvent | undefined {
  const decidedApprovalIds = new Set(
    run.events
      ?.filter(event => event.type === "SYSTEM" && typeof event.metadata?.approvalId === "string")
      .map(event => event.metadata?.approvalId as string) ?? [],
  );

  return run.events
    ?.filter(event => event.type === "APPROVAL" && typeof event.metadata?.approvalId === "string")
    .find(event => !decidedApprovalIds.has(event.metadata?.approvalId as string));
}

export function countPatchLines(patch: string) {
  const lines = patch.split("\n");

  return {
    additions: lines.filter(line => line.startsWith("+") && !line.startsWith("+++")).length,
    deletions: lines.filter(line => line.startsWith("-") && !line.startsWith("---")).length,
  };
}
