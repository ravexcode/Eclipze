"use client";

import { useEffect, useMemo, useState } from "react";
import { IconArrowUpRight, IconCode, IconFolders, IconLayoutSidebarRightCollapse } from "@tabler/icons-react";
import Link from "next/link";

import MenuSelector from "@/components/ui/menu-selector";
import type { WorkspaceRepository } from "@/types/agent-runner";
import { apiFetch } from "@/utils/api-fetch";
import { readJson } from "@/utils/json-payload";

type ProjectOption = { id: string; name: string };
type Props = { onCollapse: () => void };

export const AGENT_REPOSITORY_EVENT = "agent-repository-selected";

export default function WorkspaceSidebar({ onCollapse }: Props) {
  const [repositories, setRepositories] = useState<WorkspaceRepository[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [repositoryId, setRepositoryId] = useState("");
  const [projectId, setProjectId] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadWorkspaceOptions() {
      try {
        const [repositoryResponse, projectResponse] = await Promise.all([
          apiFetch("/api/repositories", { cache: "no-store" }),
          apiFetch("/api/projects", { cache: "no-store" }),
        ]);
        const [repositoryPayload, projectPayload] = await Promise.all([
          readJson(repositoryResponse),
          readJson(projectResponse),
        ]) as [
          { repositories?: WorkspaceRepository[] },
          { projects?: ProjectOption[] },
        ];

        if (cancelled) return;
        const nextRepositories = repositoryPayload.repositories ?? [];
        const savedRepositoryId = window.localStorage.getItem("agent-repository-id") ?? "";
        const savedProjectId = window.localStorage.getItem("agent-project-id") ?? "";
        const projectRepositories = savedProjectId
          ? nextRepositories.filter(repository => repository.projectId === savedProjectId)
          : nextRepositories;
        const selectedRepositoryId = projectRepositories.some(repository => repository.id === savedRepositoryId)
          ? savedRepositoryId
          : projectRepositories[0]?.id ?? "";
        setRepositories(nextRepositories);
        setProjects(projectPayload.projects ?? []);
        setProjectId(savedProjectId);
        setRepositoryId(selectedRepositoryId);
      } catch {
        if (!cancelled) {
          setRepositories([]);
          setProjects([]);
        }
      }
    }

    const loadTimer = window.setTimeout(() => { void loadWorkspaceOptions(); }, 0);
    window.addEventListener("agent-workspace-updated", loadWorkspaceOptions);
    return () => {
      cancelled = true;
      window.clearTimeout(loadTimer);
      window.removeEventListener("agent-workspace-updated", loadWorkspaceOptions);
    };
  }, []);

  const filteredRepositories = useMemo(
    () => projectId
      ? repositories.filter(repository => repository.projectId === projectId)
      : repositories,
    [projectId, repositories],
  );

  const selectProject = (nextProjectId: string) => {
    setProjectId(nextProjectId);
    window.localStorage.setItem("agent-project-id", nextProjectId);
    const nextRepositories = nextProjectId
      ? repositories.filter(repository => repository.projectId === nextProjectId)
      : repositories;
    const nextRepositoryId = nextRepositories.some(repository => repository.id === repositoryId)
      ? repositoryId
      : nextRepositories[0]?.id ?? "";
    setRepositoryId(nextRepositoryId);
    window.localStorage.setItem("agent-repository-id", nextRepositoryId);
    window.dispatchEvent(new CustomEvent(AGENT_REPOSITORY_EVENT, { detail: { repositoryId: nextRepositoryId } }));
  };

  const selectRepository = (nextRepositoryId: string) => {
    setRepositoryId(nextRepositoryId);
    window.localStorage.setItem("agent-repository-id", nextRepositoryId);
    window.dispatchEvent(new CustomEvent(AGENT_REPOSITORY_EVENT, { detail: { repositoryId: nextRepositoryId } }));
  };

  return (
    <aside className="w-full border-t border-background-focus bg-surface px-4 py-5 md:px-5 xl:sticky xl:top-0 xl:h-dvh xl:border-l xl:border-t-0 xl:px-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between px-2">
          <div>
            <h2 className="text-xs font-medium text-foreground">Agent workspace</h2>
            <p className="mt-1 text-xs text-foreground-off">Choose where your agent works.</p>
          </div>
          <button type="button" onClick={onCollapse} aria-label="Hide right sidebar" className="rounded-xs p-1.5 text-foreground-off hover:bg-surface-raised hover:text-foreground">
            <IconLayoutSidebarRightCollapse size={17} strokeWidth={1.8} />
          </button>
        </div>

        <div className="flex flex-col gap-1.5 px-2">
          <p className="text-xs text-foreground/80">Project</p>
          <MenuSelector
            ariaLabel="Project"
            onChange={selectProject}
            options={[
              { value: "", label: "All projects" },
              ...projects.map(project => ({ value: project.id, label: project.name })),
            ]}
            placeholder="All projects"
            value={projectId}
          />
        </div>

        <div className="flex flex-col gap-1.5 px-2">
          <p className="text-xs text-foreground/80">Repository</p>
          <MenuSelector
            ariaLabel="Repository"
            disabled={!filteredRepositories.length}
            onChange={selectRepository}
            options={[
              {
                value: "",
                label: filteredRepositories.length
                  ? "Select a repository"
                  : "No repository available",
              },
              ...filteredRepositories.map(repository => ({
                value: repository.id,
                label: repository.repositoryUrl,
              })),
            ]}
            placeholder={filteredRepositories.length ? "Select a repository" : "No repository available"}
            value={repositoryId}
          />
        </div>

        <nav aria-label="Agent workspace actions" className="flex flex-col gap-1.5">
          <Link href="/projects?action=create" className="group flex items-start gap-3 rounded-xs px-2.5 py-3 text-foreground-off transition-colors hover:bg-surface-raised hover:text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent">
            <IconFolders size={19} strokeWidth={1.8} className="mt-0.5 shrink-0" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm text-foreground">Create a project</span>
              <span className="mt-1 block text-xs leading-5">Organize related work</span>
            </span>
            <IconArrowUpRight size={15} strokeWidth={1.8} className="mt-0.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
          </Link>
          <Link href="/agents?action=connect-repository" onClick={() => window.dispatchEvent(new Event("agent-connect-repository"))} className="group flex items-start gap-3 rounded-xs px-2.5 py-3 text-foreground-off transition-colors hover:bg-surface-raised hover:text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent">
            <IconCode size={19} strokeWidth={1.8} className="mt-0.5 shrink-0" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm text-foreground">Connect repository</span>
              <span className="mt-1 block text-xs leading-5">Add a public HTTPS repository</span>
            </span>
            <IconArrowUpRight size={15} strokeWidth={1.8} className="mt-0.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
          </Link>
        </nav>
      </div>
    </aside>
  );
}
