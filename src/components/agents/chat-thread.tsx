"use client";

import { useEffect, useRef, useState } from "react";
import {
  IconAlertTriangle,
  IconChevronRight,
  IconGitCompare,
  IconShieldCheck,
} from "@tabler/icons-react";

import Button from "@/components/ui/button";
import MarkdownMessage from "@/components/agents/markdown-message";
import type { AgentRun, AgentRunEvent } from "@/types/agent-runner";
import {
  AGENT_RUN_ACTIVITY_LABELS,
  CHAT_CARD_CLASSES,
  STARTING_TASK_LABEL,
} from "@/constants/chat-thread";
import {
  countPatchLines,
  getAgentRunAnswer,
  getPendingApproval,
  getThinkingSeconds,
  getThinkingSteps,
  isAgentRunActive,
  isAgentRunFailed,
  type ThinkingStep,
} from "@/utils/agents/chat-thread";

interface Props {
  run?: AgentRun | null;
  pendingPrompt?: string;
  isDecidingApproval?: boolean;
  onCancel?(): void;
  onDecideApproval?(approvalId: string, approved: boolean): void;
}

export default function ChatThread(props: Props) {
  const endRef = useRef<HTMLDivElement>(null);
  const { run } = props;

  const answer = run ? getAgentRunAnswer(run) : "";
  const thinkingSteps = run ? getThinkingSteps(run) : [];

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [answer.length, thinkingSteps.length, run?.status, props.pendingPrompt]);

  if (!run) {
    return (
      <div className="flex flex-col gap-6">
        {props.pendingPrompt ? <UserMessage prompt={props.pendingPrompt} /> : null}
        <ActivityLabel label={STARTING_TASK_LABEL} />
        <div ref={endRef} />
      </div>
    );
  }

  const pendingApproval = getPendingApproval(run);
  const isActive = isAgentRunActive(run);
  const isFailed = isAgentRunFailed(run);

  return (
    <div className="flex flex-col gap-6">
      {run.prompt ? <UserMessage prompt={run.prompt} /> : null}

      <article className="flex min-w-0 flex-col gap-4">
        {isActive || thinkingSteps.length ? (
          <ThinkingSection
            run={run}
            steps={thinkingSteps}
            isActive={isActive}
            onCancel={props.onCancel} />
        ) : null}

        {answer ? <MarkdownMessage>{answer}</MarkdownMessage> : null}

        {run.changePatch ? <ChangesCard patch={run.changePatch} /> : null}

        {pendingApproval && props.onDecideApproval ? (
          <ApprovalCard
            approval={pendingApproval}
            isDeciding={props.isDecidingApproval ?? false}
            onDecide={props.onDecideApproval} />
        ) : null}

        {isFailed ? (
          <FailureNotice
            message={run.status === "FAILED" && run.resultSummary
              ? run.resultSummary
              : `Task ${run.status.toLowerCase()}.`} />
        ) : null}
      </article>

      <div ref={endRef} />
    </div>
  );
}

function UserMessage({ prompt }: { prompt: string }) {
  return (
    <p className="ml-auto max-w-[min(100%,560px)] whitespace-pre-wrap rounded-xl rounded-br-sm bg-accent px-3.5 py-2.5 text-xs leading-6 text-white">
      {prompt}
    </p>
  );
}

function ActivityLabel({ label }: { label?: string }) {
  return (
    <span
      role="status"
      className="flex items-center gap-2 text-xs text-foreground-off">
      <span aria-hidden="true" className="flex gap-1">
        <span className="size-1 animate-bounce rounded-full bg-foreground-off [animation-delay:-0.3s]" />
        <span className="size-1 animate-bounce rounded-full bg-foreground-off [animation-delay:-0.15s]" />
        <span className="size-1 animate-bounce rounded-full bg-foreground-off" />
      </span>
      {label}
    </span>
  );
}

function ThinkingSection(props: {
  run: AgentRun;
  steps: ThinkingStep[];
  isActive: boolean;
  onCancel?(): void;
}) {
  const [isExpanded, setIsExpanded] = useState(props.isActive);
  const [wasActive, setWasActive] = useState(props.isActive);

  // Collapse the thinking log as soon as the agent finishes its task.
  if (wasActive !== props.isActive) {
    setWasActive(props.isActive);
    setIsExpanded(props.isActive);
  }

  const seconds = getThinkingSeconds(props.run);
  const doneLabel = seconds ? `Thought for ${seconds}s` : "Thought process";

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setIsExpanded(current => !current)}
          aria-expanded={isExpanded}
          disabled={!props.steps.length}
          className="group inline-flex items-center gap-1.5 text-xs text-foreground-off transition-colors hover:text-foreground disabled:pointer-events-none">
          {props.isActive ? (
            <ActivityLabel label={AGENT_RUN_ACTIVITY_LABELS[props.run.status]} />
          ) : (
            <span>{doneLabel}</span>
          )}
          {props.steps.length ? (
            <IconChevronRight
              size={13}
              className={`shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
          ) : null}
        </button>

        {props.isActive && props.onCancel ? (
          <Button
            type="button"
            variant="ghost"
            onClick={props.onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>

      {isExpanded && props.steps.length ? (
        <ol className="ml-1.5 flex flex-col gap-1.5 border-l border-background-focus pl-3.5">
          {props.steps.map(step => (
            <li key={step.id}>
              <ThinkingStepLine step={step} />
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}

function ThinkingStepLine({ step }: { step: ThinkingStep }) {
  if (step.type === "COMMAND") {
    return (
      <code className="font-mono text-[11px] leading-5 text-foreground">
        $ {step.text}
      </code>
    );
  }

  if (step.type === "OUTPUT" || step.type === "ERROR") {
    return (
      <pre className={`max-h-40 overflow-auto font-mono text-[11px] leading-5 whitespace-pre-wrap ${step.type === "ERROR" ? "text-priority-high/80" : "text-foreground-off"}`}>
        {step.text.trim()}
      </pre>
    );
  }

  return (
    <p className="text-xs leading-5 text-foreground-off">
      {step.text}
    </p>
  );
}

function ChangesCard({ patch }: { patch: string }) {
  const { additions, deletions } = countPatchLines(patch);

  return (
    <details className={`group ${CHAT_CARD_CLASSES}`}>
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-xs [&::-webkit-details-marker]:hidden">
        <IconChevronRight
          size={14}
          className="shrink-0 text-foreground-off transition-transform group-open:rotate-90" />
        <IconGitCompare size={14} className="shrink-0 text-foreground-off" />
        <span className="flex-1 font-medium text-foreground">Review isolated changes</span>
        <span className="text-status-green">+{additions}</span>
        <span className="text-priority-high">-{deletions}</span>
      </summary>
      <pre className="max-h-100 overflow-auto border-t border-background-focus p-3 text-xs leading-6 whitespace-pre-wrap text-foreground-off">
        {patch}
      </pre>
    </details>
  );
}

function ApprovalCard(props: {
  approval: AgentRunEvent;
  isDeciding: boolean;
  onDecide(approvalId: string, approved: boolean): void;
}) {
  const approvalId = props.approval.metadata?.approvalId as string;
  const toolName = String(props.approval.metadata?.toolName ?? "agent action");

  return (
    <div className={`max-w-150 border-priority-medium/30 ${CHAT_CARD_CLASSES}`}>
      <div className="flex items-center gap-2 px-3 pt-3 text-xs font-medium text-foreground">
        <IconShieldCheck size={14} className="shrink-0 text-priority-medium" />
        Approve {toolName}?
      </div>
      <pre className="mx-3 mt-2 max-h-40 overflow-auto rounded-md bg-background-focus p-2.5 text-xs leading-6 whitespace-pre-wrap text-foreground-off">
        {JSON.stringify(props.approval.metadata?.input ?? {}, null, 2)}
      </pre>
      <div className="flex justify-end gap-2 p-3">
        <Button
          variant="ghost"
          disabled={props.isDeciding}
          onClick={() => props.onDecide(approvalId, false)}>
          Deny
        </Button>
        <Button
          variant="secondary"
          disabled={props.isDeciding}
          onClick={() => props.onDecide(approvalId, true)}>
          {props.isDeciding ? "Saving…" : "Approve"}
        </Button>
      </div>
    </div>
  );
}

function FailureNotice({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="flex gap-2 text-xs leading-6 text-priority-high">
      <IconAlertTriangle size={14} className="mt-1 shrink-0" />
      <span className="min-w-0 whitespace-pre-wrap">{message}</span>
    </p>
  );
}
