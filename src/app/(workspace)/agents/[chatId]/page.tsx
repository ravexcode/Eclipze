"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { IconArrowLeft, IconArrowUp } from "@tabler/icons-react";

import DashLayout from "@/components/layouts/dash";
import Button from "@/components/ui/button";
import SelectorInput from "@/components/ui/selector";
import MarkdownMessage from "@/components/agents/markdown-message";
import { AGENT_CREDITS_UPDATED_EVENT } from "@/components/layouts/workspace-sidebar";
import type { AgentRun } from "@/types/agent-runner";
import type { AiProviderConnection } from "@/types/ai";
import { apiFetch } from "@/utils/api-fetch";
import { readJson } from "@/utils/json-payload";
import { getAvailableModels, type AvailableModel } from "@/utils/agents";

export default function AgentRunPage() {
  const router = useRouter();
  const params = useParams<{ chatId: string }>();
  const [run, setRun] = useState<AgentRun | null>(null);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [models, setModels] = useState<AvailableModel[]>([]);
  const [model, setModel] = useState("");

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
    let cancelled = false;
    async function loadModels() {
      try {
        const providerResponse = await apiFetch("/api/ai-providers", { cache: "no-store" });
        const providerPayload = await readJson(providerResponse) as { connections?: AiProviderConnection[] };
        if (!providerResponse.ok) return;
        const connections = providerPayload.connections ?? [];
        const hasOpenRouter = connections.some(connection => connection.provider === "OPENROUTER" && connection.connected);
        let discoveredModels: AvailableModel[] = [];
        if (hasOpenRouter) {
          const response = await apiFetch("/api/ai-providers/models", { cache: "no-store" });
          const payload = await readJson(response) as { models?: AvailableModel[] };
          if (response.ok) discoveredModels = payload.models ?? [];
        }
        if (cancelled) return;
        setModels(getAvailableModels(connections, discoveredModels).filter(item => item.provider === "OPENROUTER"));
      } catch {
        if (!cancelled) setModels([]);
      }
    }
    void loadModels();
    return () => { cancelled = true; };
  }, []);

  const selectedModel = model || run?.model || "";
  const runOutput = run?.events
    ?.filter(event => event.type === "OUTPUT")
    .map(event => event.message)
    .join("") ?? "";

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

  const submitFollowUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!run || !prompt.trim()) return;

    setSending(true);
    setError(null);

    try {
      const response = await apiFetch("/api/agent-runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repositoryId: run.repositoryId, model: selectedModel, prompt }),
      });
      const payload = await readJson(response) as { run?: AgentRun; message?: string };

      if (!response.ok || !payload.run) {
        throw new Error(payload.message ?? "Unable to start this task.");
      }

      setPrompt("");
      window.dispatchEvent(new Event("agent-runs-updated"));
      router.push(`/agents/${payload.run.id}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to start this task.");
    } finally {
      setSending(false);
    }
  };

  return (
    <DashLayout current="agents" router={router}>
      <main className="flex min-h-dvh min-w-0 flex-col">
        <header className="flex h-10 shrink-0 items-center border-b border-background-focus px-4">
          <button type="button" onClick={() => router.push("/agents")} className="inline-flex items-center gap-1.5 rounded-xs px-2 py-1 text-xs text-foreground-off transition-colors hover:bg-background-focus hover:text-foreground">
            <IconArrowLeft size={14} /> Agents
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col">
          <section aria-live="polite" className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-8">
            <div className="mx-auto flex w-full max-w-250 flex-col gap-4">
              {loading ? <p role="status" className="text-xs text-foreground-off">Loading task…</p> : null}
              {run?.prompt ? <p className="ml-auto max-w-[min(100%,450px)] whitespace-pre-wrap rounded-sm bg-accent px-3 py-2.5 text-xs leading-5 text-white">{run.prompt}</p> : null}

              {runOutput ? <MarkdownMessage>{runOutput}</MarkdownMessage> : null}
              {run?.events?.filter(event => event.type === "ERROR").map(event => (
                <p key={event.id} className="text-xs text-priority-high">{event.message}</p>
              ))}

              {run && ["QUEUED", "RUNNING"].includes(run.status) ? (
                <div className="flex items-center justify-between gap-3 rounded-full bg-background-card px-3 py-1.5 text-[10px] text-foreground-off">
                  <span>{run.status === "QUEUED" ? "Waiting for an agent…" : "Agent is working…"}</span>
                  <Button type="button" variant="ghost" onClick={() => void cancelRun()}>Cancel</Button>
                </div>
              ) : null}

              {run && ["FAILED", "BLOCKED", "CANCELLED"].includes(run.status) ? (
                <p className="text-xs text-priority-high">Task {run.status.toLowerCase()}.</p>
              ) : null}
              {run?.resultSummary ? <p className="whitespace-pre-wrap text-xs leading-5 text-foreground sm:text-sm">{run.resultSummary}</p> : null}
              {error ? <p role="alert" className="text-xs text-priority-high">{error}</p> : null}
            </div>
          </section>

          <form onSubmit={submitFollowUp} className="mx-auto mb-5 w-[calc(100%-2.5rem)] max-w-250 rounded-sm bg-background-card p-2.5 sm:mb-6 sm:p-3">
            <label htmlFor="agent-follow-up" className="sr-only">Ask a follow-up question</label>
            <input
              id="agent-follow-up"
              onChange={event => setPrompt(event.target.value)}
                placeholder="What should your agent do next?"
              className="min-h-11 w-full bg-transparent px-1.5 py-1 text-sm outline-hidden placeholder:text-foreground-off"
            />
            <div className="flex items-center justify-between px-1 pt-1.5">
              <div className="max-w-55">
                {models.length ? <SelectorInput current={selectedModel} setCurrent={setModel} values={models} /> : <span className="text-[10px] text-foreground-off">{selectedModel || "Agent"}</span>}
              </div>
              <button type="submit" disabled={sending || !run || !prompt.trim()} aria-label="Send follow-up" className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-white transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-40">
                <IconArrowUp size={15} strokeWidth={2.2} />
              </button>
            </div>
          </form>
        </div>
      </main>
    </DashLayout>
  );
}
