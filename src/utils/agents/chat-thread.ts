import type { AgentRun, AgentRunEvent } from "@/types/agent-runner";
import {
  ACTIVE_AGENT_RUN_STATUSES,
  FAILED_AGENT_RUN_STATUSES,
  THINKING_EVENT_TYPES,
} from "@/constants/chat-thread";

export type ThinkingStep = {
  id: string;
  type: AgentRunEvent["type"];
  text: string;
};

export function isAgentRunActive(run: AgentRun) {
  return ACTIVE_AGENT_RUN_STATUSES.includes(run.status);
}

export function isAgentRunFailed(run: AgentRun) {
  return FAILED_AGENT_RUN_STATUSES.includes(run.status);
}

function isFinalAnswerEvent(event: AgentRunEvent) {
  return event.type === "OUTPUT" && event.metadata?.isFinalAnswer === true;
}

function hasMarkedFinalAnswer(run: AgentRun) {
  return run.events?.some(isFinalAnswerEvent) ?? false;
}

export function getAgentRunAnswer(run: AgentRun) {
  const events = run.events ?? [];

  if (hasMarkedFinalAnswer(run)) {
    return events
      .filter(isFinalAnswerEvent)
      .map(event => event.message)
      .join("");
  }

  // Runs created before final answers were marked only stored the answer as plain output.
  if (run.status !== "SUCCEEDED") {
    return "";
  }

  return events
    .filter(event => event.type === "OUTPUT")
    .map(event => event.message)
    .join("");
}

export function getThinkingSteps(run: AgentRun) {
  const isLegacyRun = !hasMarkedFinalAnswer(run) && run.status === "SUCCEEDED";
  const steps: ThinkingStep[] = [];

  for (const event of run.events ?? []) {
    if (!THINKING_EVENT_TYPES.includes(event.type)) continue;
    if (isFinalAnswerEvent(event)) continue;
    if (isLegacyRun && event.type === "OUTPUT") continue;

    const previousStep = steps.at(-1);
    const isStreamChunk = event.type === "OUTPUT" || event.type === "ERROR";

    if (isStreamChunk && previousStep?.type === event.type) {
      previousStep.text += event.message;
      continue;
    }

    steps.push({
      id: event.id,
      type: event.type,
      text: event.message,
    });
  }

  return steps.filter(step => step.text.trim());
}

export function getThinkingSeconds(run: AgentRun) {
  if (!run.startedAt || !run.finishedAt) return null;

  const milliseconds = new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime();
  return Math.max(1, Math.round(milliseconds / 1_000));
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
