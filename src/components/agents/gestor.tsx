"use client";

import { useCallback, useEffect, useState } from "react";

import Button from "@/components/ui/button";
import type { WorkspaceSkill } from "@/types/agent-runner";
import type { WorkspaceAgent, WorkspaceProject } from "@/types/user";
import type { WorkspaceRepository } from "@/types/agent-runner";
import { apiFetch } from "@/utils/api-fetch";
import { errorMessage, readJson } from "@/utils/json-payload";

type AgentForm = {
  name: string;
  defaultModel: string;
  status: "ACTIVE" | "INACTIVE";
};

const emptyAgentForm: AgentForm = {
  name: "",
  defaultModel: "",
  status: "ACTIVE",
};

export default function AgentsGestor() {
  const [agents, setAgents] = useState<WorkspaceAgent[]>([]);
  const [skills, setSkills] = useState<WorkspaceSkill[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<Record<string, string[]>>(
    {},
  );
  const [projects, setProjects] = useState<WorkspaceProject[]>([]);
  const [repositories, setRepositories] = useState<WorkspaceRepository[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<AgentForm>(emptyAgentForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [repoUrl, setRepoUrl] = useState("");
  const [repoBranch, setRepoBranch] = useState("main");
  const [repoProjectId, setRepoProjectId] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [agentsResponse, skillsResponse, projectsResponse, reposResponse] =
        await Promise.all([
          apiFetch("/api/agents"),
          apiFetch("/api/skills"),
          apiFetch("/api/projects"),
          apiFetch("/api/repositories"),
        ]);

      const agentsPayload = (await readJson(agentsResponse)) as {
        agents?: WorkspaceAgent[];
        message?: string;
      };
      const skillsPayload = (await readJson(skillsResponse)) as {
        skills?: WorkspaceSkill[];
      };
      const projectsPayload = (await readJson(projectsResponse)) as {
        projects?: WorkspaceProject[];
      };
      const reposPayload = (await readJson(reposResponse)) as {
        repositories?: WorkspaceRepository[];
      };

      if (!agentsResponse.ok) {
        throw new Error(agentsPayload.message ?? "Unable to load agents.");
      }

      setAgents(agentsPayload.agents ?? []);
      setSkills(skillsPayload.skills ?? []);
      setProjects(projectsPayload.projects ?? []);
      setRepositories(reposPayload.repositories ?? []);

      const skillMap: Record<string, string[]> = {};

      await Promise.all(
        (agentsPayload.agents ?? []).map(async (agent) => {
          const response = await apiFetch(`/api/agents/${agent.id}/skills`);
          const payload = (await readJson(response)) as {
            skills?: Array<{ slug: string }>;
          };
          skillMap[agent.id] = (payload.skills ?? []).map((skill) => skill.slug);
        }),
      );

      setSelectedSkills(skillMap);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load agent settings.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const saveAgent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const response = await apiFetch(
      editingId ? `/api/agents/${editingId}` : "/api/agents",
      {
        method: editingId ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      },
    );
    const payload = await readJson(response);

    if (!response.ok) {
      setError(errorMessage(payload, "Unable to save agent."));
      setSaving(false);
      return;
    }

    setForm(emptyAgentForm);
    setEditingId(null);
    setSaving(false);
    await load();
  };

  const toggleSkill = async (agentId: string, slug: string) => {
    const current = selectedSkills[agentId] ?? [];
    const next = current.includes(slug)
      ? current.filter((value) => value !== slug)
      : [...current, slug];

    setSelectedSkills((previous) => ({ ...previous, [agentId]: next }));

    const response = await apiFetch(`/api/agents/${agentId}/skills`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ skills: next }),
    });

    if (!response.ok) {
      const payload = await readJson(response);
      setError(errorMessage(payload, "Unable to update skills."));
      await load();
    }
  };

  const removeAgent = async (agentId: string) => {
    if (!window.confirm("Delete this agent and its sessions?")) {
      return;
    }

    const response = await apiFetch(`/api/agents/${agentId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const payload = await readJson(response);
      setError(errorMessage(payload, "Unable to delete agent."));
      return;
    }

    await load();
  };

  const connectRepository = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const response = await apiFetch("/api/repositories", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        repositoryUrl: repoUrl,
        defaultBranch: repoBranch,
        projectId: repoProjectId || null,
      }),
    });
    const payload = await readJson(response);

    if (!response.ok) {
      setError(errorMessage(payload, "Unable to connect repository."));
      return;
    }

    setRepoUrl("");
    setRepoBranch("main");
    setRepoProjectId("");
    await load();
  };

  const disconnectRepository = async (repositoryId: string) => {
    const response = await apiFetch(`/api/repositories/${repositoryId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const payload = await readJson(response);
      setError(errorMessage(payload, "Unable to disconnect repository."));
      return;
    }

    await load();
  };

  return (
    <div className="mx-auto flex w-full max-w-[980px] flex-col gap-10 px-5 py-8 sm:px-8">
      {error ? (
        <p
          role="alert"
          className="rounded-xs border border-alert-red bg-surface p-4 text-sm text-alert-red">
          {error}
        </p>
      ) : null}

      <section className="flex flex-col gap-4">
        <div>
          <p className="text-base font-semibold tracking-[-0.02em]">Agents</p>
          <p className="mt-1 text-xs text-foreground-off">
            Create agents, pick a default model, and attach skills.
          </p>
        </div>

        <form
          onSubmit={saveAgent}
          className="flex flex-col gap-4 rounded-xs bg-surface p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              Name
              <input
                required
                value={form.name}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    name: event.target.value,
                  }))
                }
                className="rounded-xs bg-surface-raised px-3 py-2 text-sm outline-hidden"
                placeholder="Reviewer"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              Default model
              <input
                required
                value={form.defaultModel}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    defaultModel: event.target.value,
                  }))
                }
                className="rounded-xs bg-surface-raised px-3 py-2 text-sm outline-hidden"
                placeholder="openai/gpt-5-mini"
              />
            </label>
          </div>
          <label className="flex flex-col gap-2 text-sm">
            Status
            <select
              value={form.status}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  status: event.target.value as AgentForm["status"],
                }))
              }
              className="max-w-xs rounded-xs bg-surface-raised px-3 py-2 text-sm outline-hidden">
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </label>
          <div className="flex justify-end gap-2">
            {editingId ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyAgentForm);
                }}>
                Cancel
              </Button>
            ) : null}
            <Button type="submit" disabled={saving}>
              {saving
                ? "Saving…"
                : editingId
                  ? "Save agent"
                  : "Create agent"}
            </Button>
          </div>
        </form>

        {loading ? (
          <p className="text-sm text-foreground-off">Loading agents…</p>
        ) : agents.length === 0 ? (
          <p className="text-sm text-foreground-off">
            No agents yet. Create one to start a session.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {agents.map((agent) => (
              <article
                key={agent.id}
                className="flex flex-col gap-4 rounded-xs bg-surface p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{agent.name}</p>
                    <p className="mt-1 text-xs text-foreground-off">
                      {agent.defaultModel} · {agent.status.toLowerCase()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setEditingId(agent.id);
                        setForm({
                          name: agent.name,
                          defaultModel: agent.defaultModel,
                          status: agent.status,
                        });
                      }}>
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => void removeAgent(agent.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => {
                    const selected = (selectedSkills[agent.id] ?? []).includes(
                      skill.slug,
                    );

                    return (
                      <button
                        key={skill.slug}
                        type="button"
                        onClick={() => void toggleSkill(agent.id, skill.slug)}
                        className={`rounded-xs px-3 py-1.5 text-xs ${selected ? "bg-surface-raised text-foreground" : "text-foreground-off hover:bg-surface-raised"}`}>
                        {skill.name}
                      </button>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <p className="text-base font-semibold tracking-[-0.02em]">
            Repositories
          </p>
          <p className="mt-1 text-xs text-foreground-off">
            Connect a public HTTPS repository so agent runs can clone and inspect
            it.
          </p>
        </div>

        <form
          onSubmit={connectRepository}
          className="grid gap-4 rounded-xs bg-surface p-5 md:grid-cols-[1fr_140px_180px_auto]">
          <label className="flex flex-col gap-2 text-sm">
            Repository URL
            <input
              required
              type="url"
              value={repoUrl}
              onChange={(event) => setRepoUrl(event.target.value)}
              className="rounded-xs bg-surface-raised px-3 py-2 text-sm outline-hidden"
              placeholder="https://github.com/org/repo"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            Branch
            <input
              required
              value={repoBranch}
              onChange={(event) => setRepoBranch(event.target.value)}
              className="rounded-xs bg-surface-raised px-3 py-2 text-sm outline-hidden"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            Project
            <select
              value={repoProjectId}
              onChange={(event) => setRepoProjectId(event.target.value)}
              className="rounded-xs bg-surface-raised px-3 py-2 text-sm outline-hidden">
              <option value="">None</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <Button type="submit">Connect</Button>
          </div>
        </form>

        {repositories.length === 0 ? (
          <p className="text-sm text-foreground-off">
            No repositories connected.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {repositories.map((repository) => (
              <article
                key={repository.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xs bg-surface px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm">{repository.repositoryUrl}</p>
                  <p className="mt-1 text-xs text-foreground-off">
                    {repository.provider} · {repository.defaultBranch} ·{" "}
                    {repository.status.toLowerCase()}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => void disconnectRepository(repository.id)}>
                  Disconnect
                </Button>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
