"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { IconArrowUpRight, IconCode, IconFolders, IconSettings } from "@tabler/icons-react";

import Dialog from "@/components/ui/dialog";
import MenuSelector from "@/components/ui/menu-selector";
import type { WorkspaceRepository } from "@/types/agent-runner";
import { AGENT_CREDITS_UPDATED_EVENT, AGENT_REPOSITORY_EVENT } from "@/constants/agent-events";
import { apiFetch } from "@/utils/api-fetch";
import { readJson } from "@/utils/json-payload";

type ProjectOption = { id: string; name: string };

type CreditBalance = {
  availableCredits: number;
  reservedCredits: number;
};

const ACTION_LINK_CLASSES = "group flex items-center gap-3 rounded-md px-2.5 py-2.5 text-foreground-off transition-colors hover:bg-background-focus hover:text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent";

export default function WorkspaceDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [repositories, setRepositories] = useState<WorkspaceRepository[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [creditBalance, setCreditBalance] = useState<CreditBalance | null>(null);
  const [repositoryId, setRepositoryId] = useState("");
  const [projectId, setProjectId] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    async function loadWorkspaceOptions() {
      try {
        const [repositoryResponse, projectResponse, creditsResponse] = await Promise.all([
          apiFetch("/api/repositories", { cache: "no-store" }),
          apiFetch("/api/projects", { cache: "no-store" }),
          apiFetch("/api/ai-credits", { cache: "no-store" }),
        ]);
        const [repositoryPayload, projectPayload, creditsPayload] = await Promise.all([
          readJson(repositoryResponse),
          readJson(projectResponse),
          readJson(creditsResponse),
        ]) as [
            { repositories?: WorkspaceRepository[] },
            { projects?: ProjectOption[] },
            { availableCredits?: number; reservedCredits?: number },
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

        if (creditsResponse.ok) {
          setCreditBalance({
            availableCredits: creditsPayload.availableCredits ?? 0,
            reservedCredits: creditsPayload.reservedCredits ?? 0,
          });
        }
      } catch {
        if (!cancelled) {
          setRepositories([]);
          setProjects([]);
        }
      }
    }

    void loadWorkspaceOptions();
    window.addEventListener(AGENT_CREDITS_UPDATED_EVENT, loadWorkspaceOptions);

    return () => {
      cancelled = true;
      window.removeEventListener(AGENT_CREDITS_UPDATED_EVENT, loadWorkspaceOptions);
    };
  }, [isOpen]);

  const filteredRepositories = useMemo(
    () => projectId
      ? repositories.filter(repository => repository.projectId === projectId)
      : repositories,
    [projectId, repositories],
  );

  const announceRepository = (nextRepositoryId: string) => {
    setRepositoryId(nextRepositoryId);
    window.localStorage.setItem("agent-repository-id", nextRepositoryId);
    window.dispatchEvent(new CustomEvent(AGENT_REPOSITORY_EVENT, { detail: { repositoryId: nextRepositoryId } }));
  };

  const selectProject = (nextProjectId: string) => {
    setProjectId(nextProjectId);
    window.localStorage.setItem("agent-project-id", nextProjectId);

    const nextRepositories = nextProjectId
      ? repositories.filter(repository => repository.projectId === nextProjectId)
      : repositories;
    const nextRepositoryId = nextRepositories.some(repository => repository.id === repositoryId)
      ? repositoryId
      : nextRepositories[0]?.id ?? "";

    announceRepository(nextRepositoryId);
  };

  const repositoryPlaceholder = filteredRepositories.length
    ? "Select a repository"
    : "No repository available";

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-haspopup="dialog"
        className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs text-foreground-off transition-colors hover:bg-background-focus hover:text-foreground">
        <IconSettings size={14} />
        Workspace
      </button>

      <Dialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Agent workspace"
        description="Choose a project and repository before you delegate work.">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <p className="text-xs text-foreground/80">Project</p>
            <MenuSelector
              ariaLabel="Project"
              onChange={selectProject}
              options={[
                { value: "", label: "All projects" },
                ...projects.map(project => ({ value: project.id, label: project.name })),
              ]}
              placeholder="All projects"
              value={projectId} />
          </div>

          <div className="flex flex-col gap-1.5">
            <p className="text-xs text-foreground/80">Repository</p>
            <MenuSelector
              ariaLabel="Repository"
              disabled={!filteredRepositories.length}
              onChange={announceRepository}
              options={[
                { value: "", label: repositoryPlaceholder },
                ...filteredRepositories.map(repository => ({
                  value: repository.id,
                  label: repository.repositoryUrl,
                })),
              ]}
              placeholder={repositoryPlaceholder}
              value={repositoryId} />
          </div>

          {creditBalance ? (
            <p className="rounded-md bg-background-focus px-3 py-2 text-xs text-foreground-off">
              <span className="text-foreground">{creditBalance.availableCredits}</span> credits available
              {creditBalance.reservedCredits > 0 ? ` · ${creditBalance.reservedCredits} reserved` : ""}
            </p>
          ) : null}

          <nav aria-label="Agent workspace actions" className="flex flex-col gap-0.5 border-t border-background-focus pt-3">
            <Link
              href="/projects?action=create"
              className={ACTION_LINK_CLASSES}>
              <IconFolders size={16} strokeWidth={1.8} className="shrink-0" />
              <span className="flex-1 text-xs text-foreground">Create a project</span>
              <IconArrowUpRight size={14} className="opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
            </Link>
            <Link
              href="/agents?action=connect-repository"
              onClick={() => {
                setIsOpen(false);
                window.dispatchEvent(new Event("agent-connect-repository"));
              }}
              className={ACTION_LINK_CLASSES}>
              <IconCode size={16} strokeWidth={1.8} className="shrink-0" />
              <span className="flex-1 text-xs text-foreground">Connect repository</span>
              <IconArrowUpRight size={14} className="opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
            </Link>
          </nav>
        </div>
      </Dialog>
    </>
  );
}
