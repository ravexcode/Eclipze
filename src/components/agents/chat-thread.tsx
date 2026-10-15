"use client";

import { useEffect, useRef } from "react";
import {
  IconAlertTriangle,
  IconChevronRight,
  IconCircleCheck,
  IconGitCompare,
  IconShieldCheck,
  IconSparkles,
} from "@tabler/icons-react";

import Button from "@/components/ui/button";
import MarkdownMessage from "@/components/agents/markdown-message";
import type { AgentRun, AgentRunEvent } from "@/types/agent-runner";
import { AGENT_RUN_STATUS_DOT_CLASSES } from "@/constants/agents";
import {
  AGENT_RUN_ACTIVITY_LABELS,
  AGENT_RUN_STATUS_LABELS,
  CHAT_CARD_CLASSES,
} from "@/constants/chat-thread";
import {
  countPatchLines,
  getAgentRunErrors,
  getAgentRunOutput,
  getPendingApproval,
  isAgentRunActive,
  isAgentRunFailed,
} from "@/utils/agents/chat-thread";

interface Props {
  run: AgentRun;
  isDecidingApproval?: boolean;
  onCancel?(): void;
  onDecideApproval?(approvalId: string, approved: boolean): void;
}

export default function ChatThread(props: Props) {
  const { run } = props;
  const endRef = useRef<HTMLDivElement>(null);

  const output = getAgentRunOutput(run);
  const errors = getAgentRunErrors(run);
  const pendingApproval = getPendingApproval(run);
  const isActive = isAgentRunActive(run);
  const isFailed = isAgentRunFailed(run);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [output.length, run.status]);

  return (
    <div className="flex flex-col gap-6">
      {run.prompt ? <UserMessage prompt={run.prompt} /> : null}

      <article className="flex gap-3">
        <AgentAvatar isActive={isActive} />

        <div className="flex min-w-0 flex-1 flex-col gap-3 pt-0.5">
          <header className="flex items-center gap-2 text-xs">
            <span className="font-medium text-foreground">Agent</span>
            <StatusChip status={run.status} />
          </header>

          {output ? <MarkdownMessage>{output}</MarkdownMessage> : null}

          {run.changePatch ? <ChangesCard patch={run.changePatch} /> : null}

          {pendingApproval && props.onDecideApproval ? (
            <ApprovalCard
              approval={pendingApproval}
              isDeciding={props.isDecidingApproval ?? false}
              onDecide={props.onDecideApproval} />
          ) : null}

          {errors.map(event => (
            <Notice key={event.id} tone="error">
              {event.message}
            </Notice>
          ))}

          {isFailed && !errors.length ? (
            <Notice tone="error">
              Task {run.status.toLowerCase()}.
            </Notice>
          ) : null}

          {run.resultSummary ? (
            <Notice tone="success">
              {run.resultSummary}
            </Notice>
          ) : null}

          {isActive ? (
            <ActivityIndicator
              label={AGENT_RUN_ACTIVITY_LABELS[run.status]}
              onCancel={props.onCancel} />
          ) : null}
        </div>
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

function AgentAvatar({ isActive }: { isActive: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`flex size-7 shrink-0 items-center justify-center rounded-full border border-background-focus bg-background-card text-foreground ${isActive ? "animate-pulse" : ""}`}>
      <IconSparkles size={14} strokeWidth={1.8} />
    </span>
  );
}

function StatusChip({ status }: { status: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-background-focus px-2 py-0.5 text-[11px] text-foreground-off">
      <span className={`size-1.5 rounded-full ${AGENT_RUN_STATUS_DOT_CLASSES[status] ?? "bg-foreground-off"}`} />
      {AGENT_RUN_STATUS_LABELS[status] ?? status}
    </span>
  );
}

function ActivityIndicator(props: { label?: string; onCancel?(): void }) {
  return (
    <div
      role="status"
      className="flex items-center justify-between gap-3 text-xs text-foreground-off">
      <span className="flex items-center gap-2">
        <span aria-hidden="true" className="flex gap-1">
          <span className="size-1 animate-bounce rounded-full bg-foreground-off [animation-delay:-0.3s]" />
          <span className="size-1 animate-bounce rounded-full bg-foreground-off [animation-delay:-0.15s]" />
          <span className="size-1 animate-bounce rounded-full bg-foreground-off" />
        </span>
        {props.label}
      </span>

      {props.onCancel ? (
        <Button
          type="button"
          variant="ghost"
          onClick={props.onCancel}>
          Cancel
        </Button>
      ) : null}
    </div>
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

function Notice(props: { tone: "error" | "success"; children: React.ReactNode }) {
  const isError = props.tone === "error";
  const Icon = isError ? IconAlertTriangle : IconCircleCheck;

  return (
    <div
      role={isError ? "alert" : undefined}
      className={`flex gap-2 rounded-lg border px-3 py-2.5 text-xs leading-6 ${isError ? "border-priority-high/25 bg-priority-high/5 text-priority-high" : "border-status-green/20 bg-status-green/5 text-foreground"}`}>
      <Icon
        size={14}
        className={`mt-1 shrink-0 ${isError ? "text-priority-high" : "text-status-green"}`} />
      <p className="min-w-0 whitespace-pre-wrap">{props.children}</p>
    </div>
  );
}
