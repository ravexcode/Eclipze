"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import DashLayout from "@/components/layouts/dash";
import SkillLibrary from "@/components/agents/skill-library";
import SelectorInput from "@/components/ui/selector";
import Snackbar from "@/components/ui/snackbar";
import Button from "@/components/ui/button";
import { IconAdjustments, IconArrowUp, IconSparkles } from "@tabler/icons-react";
import type { AiProviderConnection } from "@/types/ai";
import type { AgentRun, LibrarySkill, WorkspaceRepository } from "@/types/agent-runner";
import MarkdownMessage from "@/components/agents/markdown-message";
import { apiFetch } from "@/utils/api-fetch";
import { getSessionUser } from "@/utils/session";
import { getAvailableModels, type AvailableModel } from "@/utils/agents";
import { readJson } from "@/utils/json-payload";
import { AGENT_REPOSITORY_EVENT } from "@/components/layouts/workspace-sidebar";

export default function AgentsPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [models, setModels] = useState<AvailableModel[]>([]);
  const [model, setModel] = useState("");
  const [skills, setSkills] = useState<LibrarySkill[]>([]);
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
  const [repositoryId, setRepositoryId] = useState("");
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [defaultBranch, setDefaultBranch] = useState("main");
  const [showRepositoryForm, setShowRepositoryForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNoProvidersSnackbar, setShowNoProvidersSnackbar] = useState(false);
  const [showTaskSettings, setShowTaskSettings] = useState(false);
  const [activeRun, setActiveRun] = useState<AgentRun | null>(null);

  const loadSkills = useCallback(async (newSkillId?: string) => {
    const response = await apiFetch("/api/skills", { cache: "no-store" });
    const payload = await readJson(response) as { skills?: LibrarySkill[]; message?: string };
    if (!response.ok) throw new Error(payload.message ?? "Unable to load your skills.");
    const nextSkills = payload.skills ?? [];
    setSkills(nextSkills);
    if (newSkillId) setSelectedSkillIds(current => current.includes(newSkillId) ? current : [...current, newSkillId]);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadPage() {
      try {
        const user = await getSessionUser();
        if (!user) {
          router.replace("/auth/signin");
          return;
        }

        const [providerResponse, repositoryResponse, skillResponse] = await Promise.all([
          apiFetch("/api/ai-providers", { credentials: "include", cache: "no-store" }),
          apiFetch("/api/repositories", { cache: "no-store" }),
          apiFetch("/api/skills", { cache: "no-store" }),
        ]);
        const [providerPayload, repositoryPayload, skillPayload] = await Promise.all([
          readJson(providerResponse), readJson(repositoryResponse), readJson(skillResponse),
        ]) as [
            { connections?: AiProviderConnection[]; message?: string },
            { repositories?: WorkspaceRepository[]; message?: string },
            { skills?: LibrarySkill[]; message?: string },
          ];

        if (cancelled) return;
        if (!providerResponse.ok) throw new Error(providerPayload.message ?? "Unable to load your AI provider.");
        if (!repositoryResponse.ok) throw new Error(repositoryPayload.message ?? "Unable to load repositories.");
        if (!skillResponse.ok) throw new Error(skillPayload.message ?? "Unable to load your skills.");

        const connections = providerPayload.connections ?? [];
        const hasOpenRouter = connections.some(connection => connection.provider === "OPENROUTER" && connection.connected);
        let discoveredModels: AvailableModel[] = [];
        if (hasOpenRouter) {
          const modelsResponse = await apiFetch("/api/ai-providers/models", { cache: "no-store" });
          const modelsPayload = await readJson(modelsResponse) as { models?: AvailableModel[]; message?: string };
          if (cancelled) return;
          if (!modelsResponse.ok) throw new Error(modelsPayload.message ?? "Unable to load OpenRouter models.");
          discoveredModels = modelsPayload.models ?? [];
        }

        if (cancelled) return;
        const availableModels = getAvailableModels(connections, discoveredModels)
          .filter(availableModel => availableModel.provider === "OPENROUTER");
        setModels(availableModels);
        setModel(current => current || availableModels[0]?.id || "");
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
    if (!activeRun || !["QUEUED", "RUNNING"].includes(activeRun.status)) return;
    const timer = window.setTimeout(async () => {
      try {
        const response = await apiFetch(`/api/agent-runs/${activeRun.id}`, { cache: "no-store" });
        const payload = await readJson(response) as { run?: AgentRun };
        if (response.ok && payload.run) setActiveRun(payload.run);
      } catch {
        // The sidebar still links to this persisted run if polling is interrupted.
      }
    }, 1_500);
    return () => window.clearTimeout(timer);
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
    if (!repositoryId || !model || showNoProvidersSnackbar) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await apiFetch("/api/agent-runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repositoryId, prompt, model, skillIds: selectedSkillIds }),
      });
      const payload = await readJson(response) as { run?: AgentRun; message?: string };
      if (!response.ok || !payload.run) throw new Error(payload.message ?? "Unable to start this task.");
      setPrompt("");
      setActiveRun(payload.run);
      window.dispatchEvent(new Event("agent-runs-updated"));
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to start this task.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSkill = (id: string) => {
    setSelectedSkillIds(current => current.includes(id) ? current.filter(skillId => skillId !== id) : [...current, id]);
  };

  const startNewChat = () => {
    setActiveRun(null);
    setPrompt("");
    setError(null);
  };

  const activeRunOutput = activeRun?.events
    ?.filter(event => event.type === "OUTPUT")
    .map(event => event.message)
    .join("") ?? "";

  return (
    <DashLayout current="agents" router={router}>
      <main
        className="flex min-h-dvh min-w-0 flex-col">

        <section className="flex min-h-0 flex-1 flex-col px-5 py-8 sm:px-8">

          {activeRun ? (
            <div className="mx-auto flex w-full max-w-250 flex-1 flex-col gap-4 overflow-y-auto pb-6">
              <div className="flex items-center justify-between border-b border-background-focus pb-3">
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium">{activeRun.prompt?.split("\n")[0] || "Agent session"}</p>
                  <p className="mt-1 text-[10px] text-foreground-off">{activeRun.model}</p>
                </div>
                <button type="button" onClick={startNewChat} className="shrink-0 rounded-xs px-2 py-1.5 text-xs text-foreground-off hover:bg-background-focus hover:text-foreground">New chat</button>
              </div>
              {activeRun.prompt ? <p className="ml-auto max-w-[min(100%,600px)] whitespace-pre-wrap rounded-sm bg-accent px-3 py-2.5 text-xs leading-5 text-white">{activeRun.prompt}</p> : null}
              {activeRunOutput ? <MarkdownMessage>{activeRunOutput}</MarkdownMessage> : null}
              {activeRun.events?.filter(event => event.type === "ERROR").map(event => (
                <p key={event.id} className="text-xs text-priority-high">{event.message}</p>
              ))}
              {["QUEUED", "RUNNING"].includes(activeRun.status) ? <p role="status" className="text-xs text-foreground-off">{activeRun.status === "QUEUED" ? "Waiting for an agent…" : "Agent is working…"}</p> : null}
              {["FAILED", "BLOCKED", "CANCELLED"].includes(activeRun.status) ? <p className="text-xs text-priority-high">Task {activeRun.status.toLowerCase()}.</p> : null}
            </div>
          ) : null}

          <div className={`mx-auto w-full max-w-250 ${activeRun ? "shrink-0" : "my-auto"}`}>

            <div
              className="rounded-sm bg-background-card p-2.5 sm:p-3">

              <input
                id="agent-prompt"
                required
                onChange={event => setPrompt(event.target.value)}
                onKeyDown={event => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void submitTask();
                  }
                }}
                placeholder="Ask me anything…"
                className="min-h-12 w-full bg-transparent px-1.5 py-1 text-sm outline-hidden placeholder:text-foreground-off"
              />

              <div
                className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <div
                  className="flex min-w-0 flex-1 items-center gap-2">
                  {isLoading ?
                    <span
                      role="status"
                      className="text-[10px] text-foreground-off">
                      Loading models…
                    </span> : (
                      <div className="max-w-55">
                        <SelectorInput
                          current={model}
                          setCurrent={setModel}
                          values={models}
                          disabled={!models.length || showNoProvidersSnackbar} />
                      </div>
                    )}
                </div>

                <button
                  type="button"
                  onClick={() => void submitTask()}
                  disabled={isLoading || isSubmitting || showNoProvidersSnackbar || !repositoryId || !prompt.trim()}
                  aria-label="Start task"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-white transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-40">
                  <IconArrowUp size={15} strokeWidth={2.2} />
                </button>

              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 px-1">
              <button type="button" onClick={() => setShowTaskSettings(value => !value)} aria-expanded={showTaskSettings} className="inline-flex items-center gap-1.5 rounded-xs px-2 py-1.5 text-[10px] text-foreground-off transition-colors hover:bg-background-focus hover:text-foreground">
                <IconAdjustments size={13} />{showTaskSettings ? "Hide skills" : "Skills"}
              </button>
              {showRepositoryForm ? <button type="button" onClick={() => setShowRepositoryForm(false)} className="rounded-xs px-2 py-1.5 text-[10px] text-foreground-off hover:bg-background-focus">Cancel repository</button> : null}
            </div>

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
                className="mt-2 text-center text-[10px] text-foreground-off">
                Loading your workspace…
              </p>
            }

            {showRepositoryForm ? (
              <fieldset className="mt-3 flex flex-col gap-3 rounded-sm border border-background-focus bg-background-card p-4">
                <legend className="px-1 text-xs font-medium">Connect a public repository</legend>
                <form onSubmit={addRepository} className="flex flex-col gap-3">
                  <input required type="url" value={repositoryUrl} onChange={event => setRepositoryUrl(event.target.value)} placeholder="https://github.com/owner/repository" className="rounded-sm bg-background-focus px-3 py-2 text-xs" />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input value={defaultBranch} onChange={event => setDefaultBranch(event.target.value)} placeholder="Default branch (main)" className="rounded-sm bg-background-focus px-3 py-2 text-xs" />
                    <p className="self-center text-xs text-foreground-off">Project assignment follows your Agent workspace selection.</p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={() => setShowRepositoryForm(false)}>Cancel</Button>
                    <Button type="submit">Add repository</Button>
                  </div>
                </form>
              </fieldset>
            ) : null}

            {showTaskSettings ? (
              <div className="mt-3 flex flex-col gap-4 rounded-sm border border-background-focus bg-background-card p-4">
                <label className="flex flex-col gap-2 text-xs font-medium">
                  Skills
                </label>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-1.5 text-xs font-medium"><IconSparkles size={14} />Available skills</div>
                  <SkillLibrary skills={skills} selectedSkillIds={selectedSkillIds} onToggle={toggleSkill} onSkillsChanged={loadSkills} />
                </div>
              </div>
            ) : null}
          </div>
        </section>

      </main>
      {showNoProvidersSnackbar ? (
        <Snackbar mode="warn" message="You don't have an active OpenRouter provider. Connect one in Settings to choose a model." onClose={() => setShowNoProvidersSnackbar(false)} />
      ) : null}
    </DashLayout>
  );
}
