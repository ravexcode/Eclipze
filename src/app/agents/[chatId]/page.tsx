"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { IconArrowLeft, IconArrowUp } from "@tabler/icons-react";

import DashLayout from "@/components/layouts/dash";
import Button from "@/components/ui/button";
import type { AgentRun } from "@/types/agent-runner";
import { apiFetch } from "@/utils/api-fetch";
import { readJson } from "@/utils/json-payload";

export default function AgentRunPage() {
  const router = useRouter();
  const params = useParams<{ chatId: string }>();
  const [run, setRun] = useState<AgentRun | null>(null);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
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
    void loadRun();
  }, [loadRun]);

  useEffect(() => {
    if (!run || !["QUEUED", "RUNNING"].includes(run.status)) return;

    const timer = setTimeout(() => void loadRun(), 1_500);
    return () => clearTimeout(timer);
  }, [loadRun, run]);

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
        body: JSON.stringify({ repositoryId: run.repositoryId, model: run.model, prompt }),
      });
      const payload = await readJson(response) as { run?: AgentRun; message?: string };

      if (!response.ok || !payload.run) {
        throw new Error(payload.message ?? "Unable to start this task.");
      }

      setPrompt("");
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
            <div className="mx-auto flex w-full max-w-[590px] flex-col gap-4">
              {loading ? <p role="status" className="text-xs text-foreground-off">Loading task…</p> : null}
              {run?.prompt ? <p className="ml-auto max-w-[min(100%,450px)] whitespace-pre-wrap rounded-sm bg-accent px-3 py-2.5 text-xs leading-5 text-white">{run.prompt}</p> : null}

              {run?.events?.map(event => (
                <article key={event.id} className="whitespace-pre-wrap break-words text-xs leading-[1.55] text-foreground-off sm:text-sm">
                  {event.message}
                </article>
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

          <form onSubmit={submitFollowUp} className="mx-auto mb-5 w-[calc(100%-2.5rem)] max-w-[600px] rounded-sm bg-background-card p-2.5 sm:mb-6 sm:p-3">
            <label htmlFor="agent-follow-up" className="sr-only">Ask a follow-up question</label>
            <textarea
              id="agent-follow-up"
              rows={2}
              maxLength={8_000}
              value={prompt}
              onChange={event => setPrompt(event.target.value)}
              placeholder="Ask me anything…"
              className="min-h-11 w-full resize-y bg-transparent px-1.5 py-1 text-sm outline-hidden placeholder:text-foreground-off focus-visible:ring-1 focus-visible:ring-accent"
            />
            <div className="flex items-center justify-between px-1 pt-1.5">
              <span className="max-w-[75%] truncate text-[10px] text-foreground-off">{run?.model ?? "Agent"}</span>
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
