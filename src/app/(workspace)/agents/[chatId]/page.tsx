"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { IconArrowLeft } from "@tabler/icons-react";

import DashLayout from "@/components/layouts/dash";
import AgentComposer from "@/components/agents/composer";
import ChatThread from "@/components/agents/chat-thread";
import WorkspaceDialog from "@/components/agents/workspace-dialog";
import { AGENT_CREDITS_UPDATED_EVENT } from "@/constants/agent-events";
import type { AgentRun } from "@/types/agent-runner";
import { DEFAULT_AGENT_MODEL, DEFAULT_AGENT_PERMISSION_MODE } from "@/constants/agents";
import { apiFetch } from "@/utils/api-fetch";
import { readJson } from "@/utils/json-payload";
import { findMentionedAgent, stripAgentMention } from "@/utils/agents/mentions";
import { useMentionableAgents } from "@/utils/agents/use-mentionable-agents";

export default function AgentRunPage() {
  const router = useRouter();
  const params = useParams<{ chatId: string }>();
  const [run, setRun] = useState<AgentRun | null>(null);
  const [prompt, setPrompt] = useState("");
  const mentionableAgents = useMentionableAgents();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const [pendingChatId, setPendingChatId] = useState(params.chatId);

  // Drop the optimistic follow-up once the new task page takes over.
  if (pendingChatId !== params.chatId) {
    setPendingChatId(params.chatId);
    setPendingPrompt(null);
  }
  const [error, setError] = useState<string | null>(null);

  const loadRun = useCallback(async () => {
    try {
      const response = await apiFetch(`/api/agent-runs/${params.chatId}`, { cache: "no-store" });
      const payload = await readJson(response) as { run?: AgentRun; message?: string };

      if (!response.ok || !payload.run) {
        throw new Error(payload.message ?? "Unable to load this agent session.");
      }

      setRun(payload.run);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load this agent session.");
    } finally {
      setLoading(false);
    }
  }, [params.chatId]);

  useEffect(() => {
    (() => void loadRun())();
  }, [loadRun]);

  useEffect(() => {
    if (!run || !["QUEUED", "RUNNING"].includes(run.status)) return;

    const timer = setTimeout(() => void loadRun(), 1_500);
    return () => clearTimeout(timer);
  }, [loadRun, run]);

  useEffect(() => {
    if (!run || ["QUEUED", "RUNNING", "WAITING_FOR_APPROVAL"].includes(run.status)) return;
    window.dispatchEvent(new Event(AGENT_CREDITS_UPDATED_EVENT));
  }, [run]);

  const cancelRun = async () => {
    if (!run) return;
    const response = await apiFetch(`/api/agent-runs/${run.id}/cancel`, { method: "POST" });
    const payload = await readJson(response) as { run?: AgentRun; message?: string };

    if (!response.ok) {
      setError(payload.message ?? "Unable to cancel this task.");
      return;
    }

    if (payload.run) setRun(payload.run);
  };

  const submitFollowUp = async () => {
    if (!run || !prompt.trim()) return;

    const submittedPrompt = prompt;
    const mentionedAgent = findMentionedAgent(submittedPrompt, mentionableAgents);

    setSending(true);
    setError(null);
    setPendingPrompt(submittedPrompt);
    setPrompt("");

    try {
      const response = await apiFetch("/api/agent-runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repositoryId: run.repositoryId,
          model: DEFAULT_AGENT_MODEL,
          permissionMode: DEFAULT_AGENT_PERMISSION_MODE,
          agentId: mentionedAgent?.id,
          prompt: mentionedAgent ? stripAgentMention(submittedPrompt, mentionedAgent) : submittedPrompt,
        }),
      });
      const payload = await readJson(response) as { run?: AgentRun; message?: string };

      if (!response.ok || !payload.run) {
        throw new Error(payload.message ?? "Unable to start this task.");
      }

      window.dispatchEvent(new Event("agent-runs-updated"));
      router.push(`/agents/${payload.run.id}`);
    } catch (submitError) {
      setPendingPrompt(null);
      setPrompt(submittedPrompt);
      setError(submitError instanceof Error ? submitError.message : "Unable to start this task.");
    } finally {
      setSending(false);
    }
  };

  return (
    <DashLayout current="agents" router={router}>
      <main className="flex h-full min-w-0 flex-col">
        <header className="flex h-10 shrink-0 items-center justify-between border-b border-background-focus px-4">
          <button type="button" onClick={() => router.push("/agents")} className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-foreground-off transition-colors hover:bg-background-focus hover:text-foreground">
            <IconArrowLeft size={14} /> Agents
          </button>
          <WorkspaceDialog />
        </header>

        <div className="flex min-h-0 flex-1 flex-col">
          <section aria-live="polite" className="min-h-0 flex-1 overflow-y-auto px-5 py-8 sm:px-8">
            <div className="mx-auto flex w-full max-w-200 flex-col gap-4">
              {loading ? (
                <p role="status" className="text-xs text-foreground-off">
                  Loading task…
                </p>
              ) : null}

              {run ? (
                <ChatThread
                  run={run}
                  onCancel={["QUEUED", "RUNNING"].includes(run.status) ? () => void cancelRun() : undefined} />
              ) : null}

              {pendingPrompt ? <ChatThread pendingPrompt={pendingPrompt} /> : null}

              {error ? (
                <p role="alert" className="text-xs text-priority-high">
                  {error}
                </p>
              ) : null}
            </div>
          </section>

          <div className="mx-auto mb-5 w-[calc(100%-2.5rem)] max-w-200 sm:mb-6">
            <AgentComposer
              id="agent-follow-up"
              value={prompt}
              placeholder="What should your agent do next?"
              isSendDisabled={sending || !run || !prompt.trim()}
              currentRunId={run?.id}
              agents={mentionableAgents}
              onChange={setPrompt}
              onSend={() => void submitFollowUp()}
              onSelectSession={runId => router.push(`/agents/${runId}`)} />
          </div>
        </div>
      </main>
    </DashLayout>
  );
}
