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

    try {
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
        return;
      }

      setShowForm(false);
      setEditingId(null);
      setForm(emptyProjectForm);
      await load();
    } catch {
      setError("Unable to save project.");
    } finally {
      setSaving(false);
    }
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
    <main className="flex min-h-dvh min-w-0 flex-col">
      <header className="flex h-10 shrink-0 items-center px-4">
        <h1 className="text-xs text-foreground-off">
          Projects
        </h1>
      </header>

      <section className="flex min-h-0 flex-1 flex-col px-5 pb-8 sm:px-8">
        <div className="mx-auto flex w-full max-w-250 flex-col gap-4 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">
                Your projects
              </p>
              <p className="mt-1 text-xs text-foreground-off">
                Track status, link repositories, and keep related issues together.
              </p>
            </div>
            <Button
              type="button"
              onClick={startCreate}>
              <IconPlus size={14} strokeWidth={1.8} className="mr-1" />
              New project
            </Button>
          </div>

          {error ? (
            <p
              role="alert"
              className="text-xs text-alert-red">
              {error}
            </p>
          ) : null}

          {showForm ? (
            <fieldset className="flex flex-col gap-3 rounded-md border border-background-focus bg-background-card p-4">
              <legend className="px-1 text-xs font-medium">
                {editingId ? "Edit project" : "New project"}
              </legend>
              <form
                onSubmit={save}
                className="flex flex-col gap-3">
                <div className="grid gap-3 md:grid-cols-[1fr_180px]">
                  <label className="flex flex-col gap-1.5 text-xs">
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
                      className="rounded-md bg-background-focus px-3 py-1.5 text-xs outline-hidden focus-visible:ring-1 focus-visible:ring-accent"
                      placeholder="Eclipse"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-xs">
                    Status
                    <select
                      value={form.status}
                      onChange={(event) =>
                        setForm((previous) => ({
                          ...previous,
                          status: event.target.value as ProjectStatus,
                        }))
                      }
                      className="rounded-md bg-background-focus px-3 py-1.5 text-xs outline-hidden focus-visible:ring-1 focus-visible:ring-accent">
                      <option value="ACTIVE">Active</option>
                      <option value="AT_RISK">At risk</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                  </label>
                </div>
                <label className="flex flex-col gap-1.5 text-xs">
                  Description
                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        description: event.target.value,
                      }))
                    }
                    className="min-h-20 resize-y rounded-md bg-background-focus px-3 py-1.5 text-xs outline-hidden focus-visible:ring-1 focus-visible:ring-accent"
                    placeholder="What is this project for?"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-xs">
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
                    className="rounded-md bg-background-focus px-3 py-1.5 text-xs outline-hidden focus-visible:ring-1 focus-visible:ring-accent"
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
                  <Button
                    type="submit"
                    disabled={saving}>
                    {saving
                      ? "Saving…"
                      : editingId
                        ? "Save project"
                        : "Create project"}
                  </Button>
                </div>
              </form>
            </fieldset>
          ) : null}

          {loading ? (
            <p
              role="status"
              className="text-xs text-foreground-off">
              Loading projects…
            </p>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center gap-1 rounded-md border border-dashed border-background-focus px-4 py-10 text-center">
              <p className="text-xs font-medium">
                No projects yet
              </p>
              <p className="text-xs text-foreground-off">
                Create a project to attach repositories and group issues.
              </p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-background-focus rounded-md border border-background-focus bg-background-card">
              {projects.map((project) => (
                <article
                  key={project.id}
                  className="flex flex-col gap-3 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <span
                        aria-hidden="true"
                        className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${PROJECT_STATUS_DOT[project.status]}`}
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                          <p className="text-sm font-medium">
                            {project.name}
                          </p>
                          <span className="text-xs text-foreground-off">
                            {PROJECT_STATUS_LABELS[project.status]}
                          </span>
                        </div>
                        <p className="mt-1 max-w-xl text-xs leading-6 text-foreground-off">
                          {project.description ?? "No description yet."}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => void toggleProjectSessions(project.id)}
                        aria-expanded={expandedProjectId === project.id}>
                        {expandedProjectId === project.id ? "Hide sessions" : "Sessions"}
                      </Button>
                      {project.externalUrl ? (
                        <a
                          href={project.externalUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium text-foreground-off hover:bg-background-focus hover:text-foreground">
                          Open
                          <IconArrowUpRight size={14} />
                        </a>
                      ) : null}
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => startEdit(project)}>
                        Edit
                      </Button>
                      <button
                        type="button"
                        onClick={() => void remove(project.id)}
                        className="rounded-md p-2 text-foreground-off hover:bg-background-focus hover:text-alert-red"
                        aria-label={`Delete ${project.name}`}>
                        <IconTrash size={14} />
                      </button>
                    </div>
                  </div>

                  {expandedProjectId === project.id ? (
                    <section
                      aria-label={`${project.name} agent sessions`}
                      className="ml-4.5 border-l border-background-focus pl-3">
                      {loadingProjectRunsId === project.id ? (
                        <p
                          role="status"
                          className="text-xs text-foreground-off">
                          Loading sessions…
                        </p>
                      ) : projectRuns[project.id]?.length ? (
                        <div className="flex flex-col">
                          {projectRuns[project.id].map(run => (
                            <Link
                              key={run.id}
                              href={`/agents/${run.id}`}
                              className="flex min-w-0 items-center justify-between gap-3 rounded-md px-2 py-1.5 text-xs hover:bg-background-focus">
                              <span className="truncate">
                                {run.prompt?.split("\n")[0] || "Agent session"}
                              </span>
                              <span className="shrink-0 text-foreground-off">
                                {run.status.toLowerCase().replaceAll("_", " ")}
                              </span>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-foreground-off">
                          No sessions for this project yet.
                        </p>
                      )}
                    </section>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
