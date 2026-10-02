"use client";

import { IconArrowUpRight, IconPlus, IconTrash } from "@tabler/icons-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import Button from "@/components/ui/button";
import {
  emptyProjectForm,
  PROJECT_STATUS_DOT,
  PROJECT_STATUS_LABELS,
} from "@/constants/workspace";
import type { ProjectStatus, WorkspaceProject } from "@/types/user";
import type { AgentRun } from "@/types/agent-runner";
import { apiFetch } from "@/utils/api-fetch";
import { errorMessage, readJson } from "@/utils/json-payload";

type ProjectFormState = {
  name: string;
  description: string;
  externalUrl: string;
  status: ProjectStatus;
};

export default function ProjectsWorkspace() {
  const [projects, setProjects] = useState<WorkspaceProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProjectFormState>(emptyProjectForm);
  const [saving, setSaving] = useState(false);
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [projectRuns, setProjectRuns] = useState<Record<string, AgentRun[]>>({});
  const [loadingProjectRunsId, setLoadingProjectRunsId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiFetch("/api/projects");
      const payload = await readJson(response) as {
        projects?: WorkspaceProject[];
        message?: string;
      };

      if (!response.ok) {
        throw new Error(payload?.message ?? "Unable to load projects.");
      }

      setProjects(payload.projects ?? []);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load projects.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);

    if (searchParams.get("action") !== "create") {
      return;
    }

    const openFormTimer = window.setTimeout(() => setShowForm(true), 0);
    searchParams.delete("action");

    const search = searchParams.toString();
    const query = search ? `?${search}` : "";
    const nextUrl = `${window.location.pathname}${query}${window.location.hash}`;
    window.history.replaceState(window.history.state, "", nextUrl);
    return () => window.clearTimeout(openFormTimer);
  }, []);

  const startCreate = () => {
    setEditingId(null);
    setForm(emptyProjectForm);
    setShowForm(true);
  };

  const startEdit = (project: WorkspaceProject) => {
    setEditingId(project.id);
    setForm({
      name: project.name,
      description: project.description ?? "",
      externalUrl: project.externalUrl ?? "",
      status: project.status,
    });
    setShowForm(true);
  };

  const toggleProjectSessions = async (projectId: string) => {
    if (expandedProjectId === projectId) {
      setExpandedProjectId(null);
      return;
    }

    setExpandedProjectId(projectId);
    setLoadingProjectRunsId(projectId);
    try {
      const response = await apiFetch(`/api/agent-runs?projectId=${encodeURIComponent(projectId)}`, { cache: "no-store" });
      const payload = await readJson(response) as { runs?: AgentRun[]; message?: string };
      if (!response.ok) throw new Error(payload.message ?? "Unable to load project sessions.");
      setProjectRuns(current => ({ ...current, [projectId]: payload.runs ?? [] }));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load project sessions.");
      setProjectRuns(current => ({ ...current, [projectId]: [] }));
    } finally {
      setLoadingProjectRunsId(null);
    }
  };

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const body = {
      name: form.name,
      description: form.description || null,
      externalUrl: form.externalUrl || null,
      status: form.status,
    };

    const response = await apiFetch(
      editingId ? `/api/projects/${editingId}` : "/api/projects",
      {
        method: editingId ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    const payload = await readJson(response);

    if (!response.ok) {
      setError(errorMessage(payload, "Unable to save project."));
      setSaving(false);
      return;
    }

    setShowForm(false);
    setEditingId(null);
    setForm(emptyProjectForm);
    setSaving(false);
    await load();
  };

  const remove = async (projectId: string) => {
    const confirmed = window.confirm(
      "Delete this project? Linked issues stay, but the project is removed.",
    );

    if (!confirmed) {
      return;
    }

    const response = await apiFetch(`/api/projects/${projectId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const payload = await readJson(response);
      setError(errorMessage(payload, "Unable to delete project."));
      return;
    }

    await load();
  };

  return (
    <div className="mx-auto flex w-full max-w-245 flex-col gap-6 px-5 py-8 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-base font-semibold tracking-[-0.02em]">
            Your projects
          </p>
          <p className="mt-1 text-xs text-foreground-off">
            Track status, link repositories, and keep related issues together.
          </p>
        </div>
        <Button type="button" onClick={startCreate}>
          <IconPlus size={16} strokeWidth={1.8} className="mr-1" />
          New project
        </Button>
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-xs border border-alert-red bg-surface p-4 text-sm text-alert-red">
          {error}
        </p>
      ) : null}

      {showForm ? (
        <form
          onSubmit={save}
          className="flex flex-col gap-4 rounded-xs border border-background-focus bg-surface p-5">
          <div className="grid gap-4 md:grid-cols-[1fr_180px]">
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
                className="rounded-xs bg-surface-raised px-3 py-2 text-sm outline-hidden focus-visible:ring-1 focus-visible:ring-accent"
                placeholder="Eclipse"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              Status
              <select
                value={form.status}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    status: event.target.value as ProjectStatus,
                  }))
                }
                className="rounded-xs bg-surface-raised px-3 py-2 text-sm outline-hidden focus-visible:ring-1 focus-visible:ring-accent">
                <option value="ACTIVE">Active</option>
                <option value="AT_RISK">At risk</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-2 text-sm">
            Description
            <textarea
              value={form.description}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  description: event.target.value,
                }))
              }
              className="min-h-24 resize-y rounded-xs bg-surface-raised px-3 py-2 text-sm outline-hidden focus-visible:ring-1 focus-visible:ring-accent"
              placeholder="What is this project for?"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            External URL
            <input
              type="url"
              value={form.externalUrl}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  externalUrl: event.target.value,
                }))
              }
              className="rounded-xs bg-surface-raised px-3 py-2 text-sm outline-hidden focus-visible:ring-1 focus-visible:ring-accent"
              placeholder="https://github.com/org/repo"
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving
                ? "Saving…"
                : editingId
                  ? "Save project"
                  : "Create project"}
            </Button>
          </div>
        </form>
      ) : null}

      {loading ? (
        <p className="text-sm text-foreground-off" role="status">
          Loading projects…
        </p>
      ) : projects.length === 0 ? (
        <article className="rounded-xs border border-background-focus bg-surface p-6">
          <p className="text-sm font-semibold">No projects yet</p>
          <p className="mt-2 text-xs leading-5 text-foreground-off">
            Create a project to attach repositories and group issues.
          </p>
        </article>
      ) : (
        <div className="flex flex-col gap-2">
          {projects.map((project) => (
            <article
              key={project.id}
              className="flex flex-col gap-4 rounded-xs border border-background-focus bg-surface p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${PROJECT_STATUS_DOT[project.status]}`}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{project.name}</p>
                    <p className="mt-1 text-xs text-foreground-off">
                      {PROJECT_STATUS_LABELS[project.status]}
                    </p>
                    <p className="mt-2 max-w-xl text-xs leading-5 text-foreground-off">
                      {project.description ?? "No description yet."}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => void toggleProjectSessions(project.id)}
                    aria-expanded={expandedProjectId === project.id}>
                    {expandedProjectId === project.id ? "Hide sessions" : "Sessions"}
                  </Button>
                  {project.externalUrl ? (
                    <a
                      href={project.externalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-xs px-2 py-1 text-xs text-foreground-off hover:bg-surface-raised hover:text-foreground">
                      Open
                      <IconArrowUpRight size={14} />
                    </a>
                  ) : null}
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => startEdit(project)}>
                    Edit
                  </Button>
                  <button
                    type="button"
                    onClick={() => void remove(project.id)}
                    className="rounded-xs p-2 text-foreground-off hover:bg-surface-raised hover:text-alert-red"
                    aria-label={`Delete ${project.name}`}>
                    <IconTrash size={16} />
                  </button>
                </div>
              </div>
              {expandedProjectId === project.id ? (
                <section className="border-t border-background-focus pt-3" aria-label={`${project.name} agent sessions`}>
                  {loadingProjectRunsId === project.id ? <p role="status" className="text-xs text-foreground-off">Loading sessions…</p> : null}
                  {projectRuns[project.id]?.length ? (
                    <div className="flex flex-col gap-1">
                      {projectRuns[project.id].map(run => (
                        <Link key={run.id} href={`/agents/${run.id}`} className="flex min-w-0 items-center justify-between gap-3 rounded-xs px-2.5 py-2 text-xs hover:bg-surface-raised">
                          <span className="truncate">{run.prompt?.split("\n")[0] || "Agent session"}</span>
                          <span className="shrink-0 text-[10px] text-foreground-off">{run.status}</span>
                        </Link>
                      ))}
                    </div>
                  ) : loadingProjectRunsId !== project.id ? <p className="text-xs text-foreground-off">No sessions for this project yet.</p> : null}
                </section>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
