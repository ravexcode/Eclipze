"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import DashLayout from "@/components/layouts/dash";
import Button from "@/components/ui/button";
import AgentComposer from "@/components/agents/composer";
import MarkdownMessage from "@/components/agents/markdown-message";
import WorkspaceDialog from "@/components/agents/workspace-dialog";

import type { AiProviderConnection } from "@/types/ai";
import type { AgentRun, LibrarySkill, WorkspaceRepository } from "@/types/agent-runner";
import {
  AGENT_CREDITS_UPDATED_EVENT,
  AGENT_NEW_CHAT_EVENT,
  AGENT_REPOSITORY_EVENT
} from "@/constants/agent-events";
import { DEFAULT_AGENT_MODEL, DEFAULT_AGENT_PERMISSION_MODE } from "@/constants/agents";

import { apiFetch } from "@/utils/api-fetch";
import { getSessionUser } from "@/utils/session";
import { findMentionedAgent, stripAgentMention } from "@/utils/agents/mentions";
import { useMentionableAgents } from "@/utils/agents/use-mentionable-agents";
import { readJson } from "@/utils/json-payload";

export default function AgentsPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const mentionableAgents = useMentionableAgents();
  const mentionedAgent = findMentionedAgent(prompt, mentionableAgents);
  const [skills, setSkills] = useState<LibrarySkill[]>([]);
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
  const [repositoryId, setRepositoryId] = useState("");
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [defaultBranch, setDefaultBranch] = useState("main");
  const [showRepositoryForm, setShowRepositoryForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDecidingApproval, setIsDecidingApproval] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNoProvidersSnackbar, setShowNoProvidersSnackbar] = useState(false);
  const [activeRun, setActiveRun] = useState<AgentRun | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPage() {
      try {
        const user = await getSessionUser();
        if (!user) {
          router.replace("/auth/signin");
          return;
        }

        const [providerResponse, repositoryResponse, skillResponse, creditsResponse] = await Promise.all([
          apiFetch("/api/ai-providers", { credentials: "include", cache: "no-store" }),
          apiFetch("/api/repositories", { cache: "no-store" }),
          apiFetch("/api/skills", { cache: "no-store" }),
          apiFetch("/api/ai-credits", { cache: "no-store" }),
        ]);
        const [providerPayload, repositoryPayload, skillPayload, creditsPayload] = await Promise.all([
          readJson(providerResponse), readJson(repositoryResponse), readJson(skillResponse), readJson(creditsResponse),
        ]) as [
            { connections?: AiProviderConnection[]; serviceOpenRouterAvailable?: boolean; message?: string },
            { repositories?: WorkspaceRepository[]; message?: string },
            { skills?: LibrarySkill[]; message?: string },
            { message?: string },
          ];

        if (cancelled) return;
        if (!providerResponse.ok) throw new Error(providerPayload.message ?? "Unable to load your AI provider.");
        if (!repositoryResponse.ok) throw new Error(repositoryPayload.message ?? "Unable to load repositories.");
        if (!skillResponse.ok) throw new Error(skillPayload.message ?? "Unable to load your skills.");
        if (!creditsResponse.ok) throw new Error(creditsPayload.message ?? "Unable to load your AI credit balance.");

        const connections = providerPayload.connections ?? [];
        const hasOpenRouterConnection = connections.some(connection => connection.provider === "OPENROUTER" && connection.connected);
        const hasOpenRouter = hasOpenRouterConnection || Boolean(providerPayload.serviceOpenRouterAvailable);
        setShowNoProvidersSnackbar(!hasOpenRouter);
        const nextRepositories = repositoryPayload.repositories ?? [];
        const savedRepositoryId = window.localStorage.getItem("agent-repository-id");
        setRepositoryId(current => current || (savedRepositoryId && nextRepositories.some(repository => repository.id === savedRepositoryId)
          ? savedRepositoryId
          : nextRepositories[0]?.id || ""));
        setSkills(skillPayload.skills ?? []);
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Unable to load the task workspace.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadPage();
    return () => { cancelled = true; };
  }, [router]);

  useEffect(() => {
    const handleRepositorySelected = (event: Event) => {
      const detail = (event as CustomEvent<{ repositoryId?: string }>).detail;
      setRepositoryId(detail?.repositoryId ?? "");
    };
    window.addEventListener(AGENT_REPOSITORY_EVENT, handleRepositorySelected);
    return () => window.removeEventListener(AGENT_REPOSITORY_EVENT, handleRepositorySelected);
  }, []);

  useEffect(() => {
    if (!activeRun || !["QUEUED", "RUNNING", "WAITING_FOR_APPROVAL"].includes(activeRun.status)) return;
    const timer = window.setTimeout(async () => {
      const response = await apiFetch(`/api/agent-runs/${activeRun.id}`, { cache: "no-store" });
      const payload = await readJson(response) as { run?: AgentRun };
      if (response.ok && payload.run) setActiveRun(payload.run);
    }, 1_500);
    return () => window.clearTimeout(timer);
  }, [activeRun]);

  useEffect(() => {
    if (!activeRun || ["QUEUED", "RUNNING", "WAITING_FOR_APPROVAL"].includes(activeRun.status)) return;
    window.dispatchEvent(new Event(AGENT_CREDITS_UPDATED_EVENT));
  }, [activeRun]);

  useEffect(() => {
    const openRepositoryForm = () => setShowRepositoryForm(true);
    window.addEventListener("agent-connect-repository", openRepositoryForm);
    const searchParams = new URLSearchParams(window.location.search);

    if (searchParams.get("action") !== "connect-repository") {
      return () => window.removeEventListener("agent-connect-repository", openRepositoryForm);
    }

    (() => setShowRepositoryForm(true))();
    searchParams.delete("action");

    const search = searchParams.toString();
    const query = search ? `?${search}` : "";
    const nextUrl = `${window.location.pathname}${query}${window.location.hash}`;
    window.history.replaceState(window.history.state, "", nextUrl);
    return () => window.removeEventListener("agent-connect-repository", openRepositoryForm);
  }, []);

  const addRepository = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    try {
      const response = await apiFetch("/api/repositories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repositoryUrl, defaultBranch, projectId: window.localStorage.getItem("agent-project-id") || null }),
      });
      const payload = await readJson(response) as { repository?: WorkspaceRepository; message?: string };
      if (!response.ok || !payload.repository) throw new Error(payload.message ?? "Unable to add this repository.");
      setRepositoryId(payload.repository.id);
      window.localStorage.setItem("agent-repository-id", payload.repository.id);
      window.dispatchEvent(new CustomEvent(AGENT_REPOSITORY_EVENT, { detail: { repositoryId: payload.repository.id } }));
      window.dispatchEvent(new Event("agent-workspace-updated"));
      setRepositoryUrl("");
      setShowRepositoryForm(false);
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : "Unable to add this repository.");
    }
  };

  const submitTask = async () => {
    if (!repositoryId || (showNoProvidersSnackbar && !mentionedAgent)) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await apiFetch("/api/agent-runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repositoryId,
          prompt: mentionedAgent ? stripAgentMention(prompt, mentionedAgent) : prompt,
          agentId: mentionedAgent?.id,
          model: DEFAULT_AGENT_MODEL,
          skillIds: selectedSkillIds,
          permissionMode: DEFAULT_AGENT_PERMISSION_MODE,
        }),
      });
      const payload = await readJson(response) as { run?: AgentRun; message?: string; availableCredits?: number };
      if (!response.ok || !payload.run) throw new Error(payload.message ?? "Unable to start this task.");
      setPrompt("");
      setActiveRun(payload.run);
      window.dispatchEvent(new Event("agent-runs-updated"));
      window.dispatchEvent(new Event(AGENT_CREDITS_UPDATED_EVENT));
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to start this task.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const decideApproval = async (approvalId: string, approved: boolean) => {
    if (!activeRun) return;
    setIsDecidingApproval(true);
    try {
      const response = await apiFetch(`/api/agent-runs/${activeRun.id}/approvals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalId, approved }),
      });
      const payload = await readJson(response) as { message?: string };
      if (!response.ok) throw new Error(payload.message ?? "Unable to update approval.");
      const runResponse = await apiFetch(`/api/agent-runs/${activeRun.id}`, { cache: "no-store" });
      const runPayload = await readJson(runResponse) as { run?: AgentRun };
      if (runResponse.ok && runPayload.run) setActiveRun(runPayload.run);
    } catch (approvalError) {
      setError(approvalError instanceof Error ? approvalError.message : "Unable to update approval.");
    } finally {
      setIsDecidingApproval(false);
    }
  };

  const toggleSkill = (skillId: string) => {
    setSelectedSkillIds(current => current.includes(skillId)
      ? current.filter(id => id !== skillId)
      : [...current, skillId]);
  };

  const startNewChat = useCallback(() => {
    setActiveRun(null);
    setPrompt("");
    setError(null);
  }, []);

  useEffect(() => {
    window.addEventListener(AGENT_NEW_CHAT_EVENT, startNewChat);
    return () => window.removeEventListener(AGENT_NEW_CHAT_EVENT, startNewChat);
  }, [startNewChat]);

  const activeRunOutput = activeRun?.events
    ?.filter(event => event.type === "OUTPUT")
    .map(event => event.message)
    .join("") ?? "";

  const decidedApprovalIds = new Set(activeRun?.events
    ?.filter(event => event.type === "SYSTEM" && typeof event.metadata?.approvalId === "string")
    .map(event => event.metadata?.approvalId as string) ?? []);

  const pendingApproval = activeRun?.events
    ?.filter(event => event.type === "APPROVAL" && typeof event.metadata?.approvalId === "string")
    .find(event => !decidedApprovalIds.has(event.metadata?.approvalId as string));

  return (
    <DashLayout current="agents" router={router}>
      <main
        className="flex min-h-dvh min-w-0 flex-col">

        <header className="flex h-10 shrink-0 items-center justify-end px-4">
          <WorkspaceDialog />
        </header>

        <section className="flex min-h-0 flex-1 flex-col px-5 pb-8 sm:px-8">

          {activeRun ? (
            <div className="mx-auto flex w-full max-w-250 flex-1 flex-col gap-4 overflow-y-auto pb-6">
              {activeRun.prompt ? <p className="ml-auto max-w-[min(100%,600px)] whitespace-pre-wrap rounded-md bg-accent px-3 py-2.5 text-xs leading-6 text-white">{activeRun.prompt}</p> : null}
              {activeRunOutput ? <MarkdownMessage>{activeRunOutput}</MarkdownMessage> : null}
              {activeRun.changePatch ? (
                <details className="rounded-md border border-background-focus bg-background-card p-3">
                  <summary className="cursor-pointer text-xs font-medium">Review isolated changes</summary>
                  <pre className="mt-3 max-h-100 overflow-auto whitespace-pre-wrap text-xs leading-6 text-foreground-off">{activeRun.changePatch}</pre>
                </details>
              ) : null}
              {pendingApproval ? (
                <div className="max-w-150 rounded-md border border-background-focus bg-background-card p-3">
                  <p className="text-xs font-medium">Approve {String(pendingApproval.metadata?.toolName ?? "agent action")}?</p>
                  <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-xs leading-6 text-foreground-off">{JSON.stringify(pendingApproval.metadata?.input ?? {}, null, 2)}</pre>
                  <div className="mt-3 flex justify-end gap-2">
                    <Button variant="ghost" disabled={isDecidingApproval} onClick={() => void decideApproval(pendingApproval.metadata?.approvalId as string, false)}>Deny</Button>
                    <Button variant="secondary" disabled={isDecidingApproval} onClick={() => void decideApproval(pendingApproval.metadata?.approvalId as string, true)}>{isDecidingApproval ? "Saving…" : "Approve"}</Button>
                  </div>
                </div>
              ) : null}
              {activeRun.events?.filter(event => event.type === "ERROR").map(event => (
                <p key={event.id} className="text-xs text-priority-high">{event.message}</p>
              ))}
              {["QUEUED", "RUNNING", "WAITING_FOR_APPROVAL"].includes(activeRun.status) ? <p role="status" className="text-xs text-foreground-off">{activeRun.status === "QUEUED" ? "Waiting for an agent…" : activeRun.status === "WAITING_FOR_APPROVAL" ? "Waiting for your approval…" : "Agent is working…"}</p> : null}
              {["FAILED", "BLOCKED", "CANCELLED"].includes(activeRun.status) ? <p className="text-xs text-priority-high">Task {activeRun.status.toLowerCase()}.</p> : null}
            </div>
          ) : null}

          <div className={`mx-auto w-full max-w-250 ${activeRun ? "shrink-0" : "my-auto"}`}>

            <AgentComposer
              id="agent-prompt"
              value={prompt}
              placeholder="What should your agent help you deliver?"
              isSendDisabled={isLoading || isSubmitting || (showNoProvidersSnackbar && !mentionedAgent) || !repositoryId || !prompt.trim()}
              currentRunId={activeRun?.id}
              skills={skills}
              selectedSkillIds={selectedSkillIds}
              agents={mentionableAgents}
              onChange={setPrompt}
              onSend={() => void submitTask()}
              onSelectSession={runId => router.push(`/agents/${runId}`)}
              onToggleSkill={toggleSkill} />

            {error &&
              <p
                role="alert"
                className="mt-3 text-xs text-priority-high">
                {error}
              </p>
            }
            {isLoading &&
              <p
                role="status"
                className="mt-2 text-center text-xs text-foreground-off">
                Loading your workspace…
              </p>
            }

            {showRepositoryForm ? (
              <fieldset
                className="mt-3 flex flex-col gap-3 rounded-md border border-background-focus bg-background-card p-4">
                <legend
                  className="px-1 text-xs font-medium">
                  Connect a public repository
                </legend>
                <form
                  onSubmit={addRepository}
                  className="flex flex-col gap-3">
                  <input
                    required
                    type="url"
                    value={repositoryUrl}
                    onChange={event => setRepositoryUrl(event.target.value)}
                    placeholder="https://github.com/owner/repository"
                    className="rounded-md bg-background-focus px-3 py-1.5 text-xs" />
                  <div
                    className="grid gap-3 sm:grid-cols-2">
                    <input
                      value={defaultBranch}
                      onChange={event => setDefaultBranch(event.target.value)}
                      placeholder="Default branch (main)"
                      className="rounded-md bg-background-focus px-3 py-1.5 text-xs" />
                    <p
                      className="self-center text-xs text-foreground-off">
                      Project assignment follows your Agent workspace selection.
                    </p>
                  </div>
                  <div
                    className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowRepositoryForm(false)}>
                      Cancel
                    </Button>
                    <Button
                      type="submit">
                      Add repository
                    </Button>
                  </div>
                </form>
              </fieldset>
            ) : null}
          </div>
        </section>

      </main>
    </DashLayout>
  );
}
