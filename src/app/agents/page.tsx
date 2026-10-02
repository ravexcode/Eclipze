"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import DashLayout from "@/components/layouts/dash";
import SkillLibrary from "@/components/agents/skill-library";
import SelectorInput from "@/components/ui/selector";
import Snackbar from "@/components/ui/snackbar";
import Button from "@/components/ui/button";
import { IconAdjustments, IconArrowUp, IconCode, IconSparkles } from "@tabler/icons-react";
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
  const [showTaskSettings, setShowTaskSettings] = useState(false);

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
    try {
      const response = await apiFetch("/api/agent-runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repositoryId, prompt, model, skillIds: selectedSkillIds }),
      });
      const payload = await readJson(response) as { run?: AgentRun; message?: string };
      if (!response.ok || !payload.run) throw new Error(payload.message ?? "Unable to start this task.");
      setPrompt("");
      router.push(`/agents/${payload.run.id}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to start this task.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSkill = (id: string) => {
    setSelectedSkillIds(current => current.includes(id) ? current.filter(skillId => skillId !== id) : [...current, id]);
  };

  return (
    <DashLayout current="agents" router={router}>
      <main className="flex min-h-dvh min-w-0 flex-col">
        <section className="flex flex-1 flex-col items-center justify-center px-5 py-10">
          <div className="w-full max-w-[600px]">
            <div className="rounded-sm bg-background-card p-2.5 sm:p-3">
              <label htmlFor="agent-prompt" className="sr-only">Ask an agent</label>
              <textarea
                id="agent-prompt"
                required
                maxLength={8_000}
                rows={2}
                value={prompt}
                onChange={event => setPrompt(event.target.value)}
                onKeyDown={event => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void submitTask();
                  }
                }}
                placeholder="Ask me anything…"
                className="min-h-12 w-full resize-y bg-transparent px-1.5 py-1 text-sm outline-hidden placeholder:text-foreground-off focus-visible:ring-1 focus-visible:ring-accent"
              />
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  {isLoading ? <span role="status" className="text-[10px] text-foreground-off">Loading models…</span> : (
                    <div className="max-w-[220px]">
                      <SelectorInput current={model} setCurrent={setModel} values={models} disabled={!models.length || showNoProvidersSnackbar} />
                    </div>
                  )}
                  <span className="hidden text-[10px] text-foreground-off sm:inline">{repositories.find(repository => repository.id === repositoryId)?.repositoryUrl ?? "Select repository"}</span>
                </div>
                <button
                  type="button"
                  onClick={() => void submitTask()}
                  disabled={isLoading || isSubmitting || showNoProvidersSnackbar || !repositoryId || !prompt.trim()}
                  aria-label="Start task"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-white transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <IconArrowUp size={15} strokeWidth={2.2} />
                </button>
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 px-1">
              <button type="button" onClick={() => setShowTaskSettings(value => !value)} aria-expanded={showTaskSettings} className="inline-flex items-center gap-1.5 rounded-xs px-2 py-1.5 text-[10px] text-foreground-off transition-colors hover:bg-background-focus hover:text-foreground">
                <IconAdjustments size={13} />{showTaskSettings ? "Hide settings" : "Task settings"}
              </button>
              <button type="button" onClick={() => setShowRepositoryForm(value => !value)} className="inline-flex items-center gap-1.5 rounded-xs px-2 py-1.5 text-[10px] text-foreground-off transition-colors hover:bg-background-focus hover:text-foreground">
                <IconCode size={13} />{showRepositoryForm ? "Cancel repository" : repositories.length ? "Add repository" : "Connect repository"}
              </button>
            </div>

            {error ? <p role="alert" className="mt-3 text-xs text-priority-high">{error}</p> : null}
            {isLoading ? <p role="status" className="mt-2 text-center text-[10px] text-foreground-off">Loading your workspace…</p> : null}

            {showRepositoryForm ? (
              <fieldset className="mt-3 flex flex-col gap-3 rounded-sm border border-background-focus bg-background-card p-4">
                <legend className="px-1 text-xs font-medium">Connect a public repository</legend>
                <form onSubmit={addRepository} className="flex flex-col gap-3">
                  <input required type="url" value={repositoryUrl} onChange={event => setRepositoryUrl(event.target.value)} placeholder="https://github.com/owner/repository" className="rounded-sm bg-background-focus px-3 py-2 text-xs" />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input value={defaultBranch} onChange={event => setDefaultBranch(event.target.value)} placeholder="Default branch (main)" className="rounded-sm bg-background-focus px-3 py-2 text-xs" />
                    <select value={projectId} onChange={event => setProjectId(event.target.value)} className="rounded-sm bg-background-focus px-3 py-2 text-xs">
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
            ) : null}

            {showTaskSettings ? (
              <div className="mt-3 flex flex-col gap-4 rounded-sm border border-background-focus bg-background-card p-4">
                <label className="flex flex-col gap-2 text-xs font-medium">
                  Repository
                  <select value={repositoryId} onChange={event => setRepositoryId(event.target.value)} disabled={!repositories.length} className="min-h-9 rounded-sm bg-background-focus px-3 text-xs disabled:brightness-[0.8] disabled:cursor-not-allowed">
                    <option value="">Select a repository</option>
                    {repositories.map(repository => <option key={repository.id} value={repository.id}>{repository.repositoryUrl} ({repository.defaultBranch})</option>)}
                  </select>
                </label>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-1.5 text-xs font-medium"><IconSparkles size={14} />Skills</div>
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
