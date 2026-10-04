"use client";

import { useEffect, useMemo, useState } from "react";
import { IconArrowUpRight, IconCode, IconCoin, IconFolders, IconLayoutSidebarRightCollapse } from "@tabler/icons-react";
import Link from "next/link";

import MenuSelector from "@/components/ui/menu-selector";
import type { WorkspaceRepository } from "@/types/agent-runner";
import { apiFetch } from "@/utils/api-fetch";
import { readJson } from "@/utils/json-payload";

type ProjectOption = { id: string; name: string };
type Props = { onCollapse: () => void };
type CreditBalance = {
  availableCredits: number;
  reservedCredits: number;
  serviceOpenRouterAvailable: boolean;
};

export const AGENT_REPOSITORY_EVENT = "agent-repository-selected";
export const AGENT_CREDITS_UPDATED_EVENT = "agent-credits-updated";
export const AGENT_NEW_CHAT_EVENT = "agent-new-chat";

export default function WorkspaceSidebar({ onCollapse }: Props) {
  const [repositories, setRepositories] = useState<WorkspaceRepository[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [creditBalance, setCreditBalance] = useState<CreditBalance | null>(null);
  const [repositoryId, setRepositoryId] = useState("");
  const [projectId, setProjectId] = useState("");

  useEffect(() => {
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
          {
            availableCredits?: number;
            reservedCredits?: number;
            serviceOpenRouterAvailable?: boolean;
          },
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
        if (creditsResponse.ok) {
          setCreditBalance({
            availableCredits: creditsPayload.availableCredits ?? 0,
            reservedCredits: creditsPayload.reservedCredits ?? 0,
            serviceOpenRouterAvailable: Boolean(creditsPayload.serviceOpenRouterAvailable),
          });
        }
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
    window.addEventListener("agent-runs-updated", loadWorkspaceOptions);
    window.addEventListener(AGENT_CREDITS_UPDATED_EVENT, loadWorkspaceOptions);
    return () => {
      cancelled = true;
      window.clearTimeout(loadTimer);
      window.removeEventListener("agent-workspace-updated", loadWorkspaceOptions);
      window.removeEventListener("agent-runs-updated", loadWorkspaceOptions);
      window.removeEventListener(AGENT_CREDITS_UPDATED_EVENT, loadWorkspaceOptions);
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
      <div className="flex h-full flex-col gap-4">
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

        <section className="mt-auto rounded-sm border border-background-focus bg-background-card p-3" aria-label="AI credit balance">
          <div className="flex items-center gap-2 text-xs font-medium text-foreground">
            <IconCoin size={15} strokeWidth={1.8} className="shrink-0 text-foreground-off" />
            <span>AI credits</span>
          </div>
          {creditBalance ? (
            <>
              <p className="mt-3 text-lg font-semibold tabular-nums">
                {creditBalance.availableCredits.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-foreground-off">
                Available
                {creditBalance.reservedCredits > 0 ? ` · ${creditBalance.reservedCredits.toLocaleString()} reserved` : ""}
              </p>
              <p className="mt-3 text-[10px] leading-4 text-foreground-off">
                {creditBalance.serviceOpenRouterAvailable
                  ? "Eclipse-funded OpenRouter"
                  : "Provider billing"}
              </p>
              <Link
                href="/dashboard/settings"
                className="mt-2 inline-flex rounded-xs px-2 py-1.5 text-[10px] text-foreground transition-colors hover:bg-background-focus focus-visible:outline-2 focus-visible:outline-accent">
                Settings
              </Link>
            </>
          ) : (
            <p role="status" className="mt-3 text-xs text-foreground-off">Loading credits...</p>
          )}
        </section>
      </div>
    </aside>
  );
}
