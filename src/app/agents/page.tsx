"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import DashLayout from "@/components/layouts/dash";
import SkillLibrary from "@/components/agents/skill-library";
import Heading from "@/components/ui/heading";
import SelectorInput from "@/components/ui/selector";
import Snackbar from "@/components/ui/snackbar";
import Button from "@/components/ui/button";
import type { AiProviderConnection } from "@/types/ai";
import type { AgentRun, LibrarySkill, WorkspaceRepository } from "@/types/agent-runner";
import { apiFetch } from "@/utils/api-fetch";
import { getSessionUser } from "@/utils/session";
import { getAvailableModels, type AvailableModel } from "@/utils/agents";
import { errorMessage, readJson } from "@/utils/json-payload";

type ProjectOption = { id: string; name: string };

export default function AgentsPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [models, setModels] = useState<AvailableModel[]>([]);
  const [model, setModel] = useState("");
  const [repositories, setRepositories] = useState<WorkspaceRepository[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [skills, setSkills] = useState<LibrarySkill[]>([]);
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
  const [repositoryId, setRepositoryId] = useState("");
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [defaultBranch, setDefaultBranch] = useState("main");
  const [projectId, setProjectId] = useState("");
  const [showRepositoryForm, setShowRepositoryForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNoProvidersSnackbar, setShowNoProvidersSnackbar] = useState(false);
  const [activeRun, setActiveRun] = useState<AgentRun | null>(null);

  const loadSkills = useCallback(async (newSkillId?: string) => {
    const response = await apiFetch("/api/skills", { cache: "no-store" });
    const payload = await readJson(response) as { skills?: LibrarySkill[]; message?: string };
    if (!response.ok) throw new Error(payload.message ?? "Unable to load your skills.");
    const nextSkills = payload.skills ?? [];
    setSkills(nextSkills);
    if (newSkillId) setSelectedSkillIds(current => current.includes(newSkillId) ? current : [...current, newSkillId]);
  }, []);

  const loadRepositories = useCallback(async () => {
    const response = await apiFetch("/api/repositories", { cache: "no-store" });
    const payload = await readJson(response) as { repositories?: WorkspaceRepository[]; message?: string };
    if (!response.ok) throw new Error(payload.message ?? "Unable to load repositories.");
    const nextRepositories = payload.repositories ?? [];
    setRepositories(nextRepositories);
    setRepositoryId(current => current || nextRepositories[0]?.id || "");
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

        const [providerResponse, repositoryResponse, projectResponse, skillResponse] = await Promise.all([
          apiFetch("/api/ai-providers", { credentials: "include", cache: "no-store" }),
          apiFetch("/api/repositories", { cache: "no-store" }),
          apiFetch("/api/projects", { cache: "no-store" }),
          apiFetch("/api/skills", { cache: "no-store" }),
        ]);
        const [providerPayload, repositoryPayload, projectPayload, skillPayload] = await Promise.all([
          readJson(providerResponse), readJson(repositoryResponse), readJson(projectResponse), readJson(skillResponse),
        ]) as [
          { connections?: AiProviderConnection[]; message?: string },
          { repositories?: WorkspaceRepository[]; message?: string },
          { projects?: ProjectOption[]; message?: string },
          { skills?: LibrarySkill[]; message?: string },
        ];

        if (cancelled) return;
        if (!providerResponse.ok) throw new Error(providerPayload.message ?? "Unable to load your AI provider.");
        if (!repositoryResponse.ok) throw new Error(repositoryPayload.message ?? "Unable to load repositories.");
        if (!projectResponse.ok) throw new Error(projectPayload.message ?? "Unable to load projects.");
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
        setRepositories(nextRepositories);
        setRepositoryId(current => current || nextRepositories[0]?.id || "");
        setProjects(projectPayload.projects ?? []);
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
    if (!activeRun || !["QUEUED", "RUNNING"].includes(activeRun.status)) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      try {
        const response = await apiFetch(`/api/agent-runs/${activeRun.id}`, { cache: "no-store" });
        const payload = await readJson(response) as { run?: AgentRun; message?: string };
        if (!response.ok || !payload.run) throw new Error(payload.message ?? "Unable to load task progress.");
        if (cancelled) return;
        setActiveRun(payload.run);
        if (["QUEUED", "RUNNING"].includes(payload.run.status)) timer = setTimeout(poll, 1_500);
      } catch (pollError) {
        if (!cancelled) setError(pollError instanceof Error ? pollError.message : "Unable to load task progress.");
      }
    };

    timer = setTimeout(poll, 800);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [activeRun]);

  const addRepository = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    try {
      const response = await apiFetch("/api/repositories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repositoryUrl, defaultBranch, projectId: projectId || null }),
      });
      const payload = await readJson(response) as { repository?: WorkspaceRepository; message?: string };
      if (!response.ok || !payload.repository) throw new Error(payload.message ?? "Unable to add this repository.");
      await loadRepositories();
      setRepositoryId(payload.repository.id);
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
    setActiveRun(null);
    try {
      const response = await apiFetch("/api/agent-runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repositoryId, prompt, model, skillIds: selectedSkillIds }),
      });
      const payload = await readJson(response) as { run?: AgentRun; message?: string };
      if (!response.ok || !payload.run) throw new Error(payload.message ?? "Unable to start this task.");
      setActiveRun(payload.run);
      setPrompt("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to start this task.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelTask = async () => {
    if (!activeRun) return;
    const response = await apiFetch(`/api/agent-runs/${activeRun.id}/cancel`, { method: "POST" });
    const payload = await readJson(response) as { run?: AgentRun; message?: string };
    if (!response.ok) {
      setError(payload.message ?? "Unable to cancel this task.");
      return;
    }
    if (payload.run) setActiveRun(payload.run);
  };

  const toggleSkill = (id: string) => {
    setSelectedSkillIds(current => current.includes(id) ? current.filter(skillId => skillId !== id) : [...current, id]);
  };

  return (
    <DashLayout current="agents" router={router}>
      <main className="flex min-h-dvh min-w-0 flex-col">
        <Heading label="Agent" />
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-5 py-8 sm:px-8 lg:px-10">
          <section className="flex flex-col gap-5 rounded-sm border border-background-focus bg-background-card p-5 sm:p-6">
            <div>
              <h1 className="text-lg font-semibold">Start a task</h1>
              <p className="mt-1 text-sm text-foreground-off">Describe what you want to understand or work through in a repository.</p>
            </div>

            {error ? <p role="alert" className="text-sm text-priority-high">{error}</p> : null}
            {isLoading ? <p role="status" className="text-sm text-foreground-off">Loading your workspace…</p> : null}

            <label className="flex flex-col gap-2 text-sm font-medium">
              Task
              <textarea
                required
                maxLength={8_000}
                rows={6}
                value={prompt}
                onChange={event => setPrompt(event.target.value)}
                placeholder="Explain what should be explored, reviewed, or planned…"
                className="resize-y rounded-sm bg-background-focus px-4 py-3 text-sm outline-hidden focus-visible:ring-1 focus-visible:ring-accent" />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium">
                Repository
                <select value={repositoryId} onChange={event => setRepositoryId(event.target.value)} disabled={!repositories.length} className="min-h-10 rounded-sm bg-background-focus px-3 text-sm disabled:brightness-[0.8] disabled:cursor-not-allowed">
                  <option value="">Select a repository</option>
                  {repositories.map(repository => <option key={repository.id} value={repository.id}>{repository.repositoryUrl} ({repository.defaultBranch})</option>)}
                </select>
              </label>
              <div className="flex flex-col gap-2 text-sm font-medium">
                Model
                {isLoading ? <span role="status" className="text-foreground-off">Loading models…</span> : (
                  <SelectorInput current={model} setCurrent={setModel} values={models} disabled={!models.length || showNoProvidersSnackbar} />
                )}
              </div>
            </div>

            {!showRepositoryForm ? (
              <button type="button" onClick={() => setShowRepositoryForm(true)} className="self-start text-sm text-accent hover:underline">
                + Add a repository
              </button>
            ) : (
              <fieldset className="flex flex-col gap-3 rounded-sm border border-background-focus p-4">
                <legend className="px-1 text-sm font-medium">Connect a public repository</legend>
                <form onSubmit={addRepository} className="flex flex-col gap-3">
                  <input required type="url" value={repositoryUrl} onChange={event => setRepositoryUrl(event.target.value)} placeholder="https://github.com/owner/repository" className="rounded-sm bg-background-focus px-3 py-2 text-sm" />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input value={defaultBranch} onChange={event => setDefaultBranch(event.target.value)} placeholder="Default branch (main)" className="rounded-sm bg-background-focus px-3 py-2 text-sm" />
                    <select value={projectId} onChange={event => setProjectId(event.target.value)} className="rounded-sm bg-background-focus px-3 py-2 text-sm">
                      <option value="">No project</option>
                      {projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}
                    </select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={() => setShowRepositoryForm(false)}>Cancel</Button>
                    <Button type="submit">Add repository</Button>
                  </div>
                </form>
              </fieldset>
            )}

            <div className="flex justify-end border-t border-background-focus pt-4">
              <Button type="button" onClick={() => void submitTask()} disabled={isLoading || isSubmitting || showNoProvidersSnackbar || !repositoryId || !prompt.trim()}>
                {isSubmitting ? "Starting…" : "Start task"}
              </Button>
            </div>
          </section>

          <SkillLibrary
            skills={skills}
            selectedSkillIds={selectedSkillIds}
            onToggle={toggleSkill}
            onSkillsChanged={loadSkills} />

          {activeRun ? (
            <section className="flex flex-col gap-4 rounded-sm border border-background-focus bg-background-card p-5" aria-live="polite">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold">Task progress</h2>
                  <p className="mt-1 text-xs text-foreground-off">{activeRun.status}</p>
                </div>
                {["QUEUED", "RUNNING"].includes(activeRun.status) ? <Button type="button" variant="secondary" onClick={() => void cancelTask()}>Cancel</Button> : null}
              </div>
              <div className="flex flex-col gap-2">
                {(activeRun.events ?? []).map(event => (
                  <article key={event.id} className="rounded-xs bg-background-focus p-3">
                    <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-foreground-off">{event.type}</p>
                    <p className="whitespace-pre-wrap break-words text-sm">{event.message}</p>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </main>
      {showNoProvidersSnackbar ? (
        <Snackbar mode="warn" message="You don't have an active OpenRouter provider. Connect one in Settings to choose a model." onClose={() => setShowNoProvidersSnackbar(false)} />
      ) : null}
    </DashLayout>
  );
}
