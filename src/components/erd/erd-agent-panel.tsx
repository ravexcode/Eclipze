"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { IconArrowUp, IconDatabase, IconSparkles, IconX } from "@tabler/icons-react";

import MarkdownMessage from "@/components/agents/markdown-message";
import ErdChangeList from "@/components/erd/erd-change-list";
import Button from "@/components/ui/button";
import MenuSelector from "@/components/ui/menu-selector";
import { DATABASE_PROVIDER_LABELS } from "@/constants/database-connections";
import { ERD_AGENT_SUGGESTIONS } from "@/constants/erd";
import type { DatabaseConnectionSummary, DatabaseProject } from "@/types/database-connections";
import type { ErdDocument } from "@/types/erd";
import type { WorkspaceAgent } from "@/types/user";
import { apiFetch } from "@/utils/api-fetch";
import { isErdAgentProvider } from "@/utils/erd-agent";
import { errorMessage, readJson } from "@/utils/json-payload";
import { loadDatabaseProjects } from "@/utils/use-database-connections";
import { useErdAgentChat } from "@/utils/use-erd-agent-chat";

interface Props {
  projectId: string | null;
  document: ErdDocument;
  connections: DatabaseConnectionSummary[];
  onDocumentChange(document: ErdDocument): void;
  onOpenDatabase(): void;
  onClose(): void;
}

export default function ErdAgentPanel(props: Props) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [agents, setAgents] = useState<WorkspaceAgent[]>([]);
  const [agentsError, setAgentsError] = useState<string | null>(null);
  const [agentId, setAgentId] = useState("");
  const [connectionId, setConnectionId] = useState("");
  const [databaseProjects, setDatabaseProjects] = useState<DatabaseProject[]>([]);
  const [databaseProjectId, setDatabaseProjectId] = useState("");
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const chat = useErdAgentChat({
    projectId: props.projectId,
    document: props.document,
    onDocumentChange: props.onDocumentChange,
  });

  useEffect(() => {
    let cancelled = false;

    const loadAgents = async () => {
      try {
        const response = await apiFetch("/api/agents");
        const payload = await readJson(response) as { agents?: WorkspaceAgent[] } | null;

        if (!response.ok) {
          throw new Error(errorMessage(payload, "Unable to load agents."));
        }

        if (cancelled) return;

        const usableAgents = (payload?.agents ?? []).filter(agent => (
          agent.status === "ACTIVE" && isErdAgentProvider(agent.provider)
        ));

        setAgents(usableAgents);
        setAgentId(current => current || usableAgents[0]?.id || "");
      } catch (error) {
        if (!cancelled) {
          setAgentsError(error instanceof Error ? error.message : "Unable to load agents.");
        }
      }
    };

    void loadAgents();

    return () => {
      cancelled = true;
    };
  }, []);

  // Drop the selection when its connection is removed from the database dialog.
  const activeConnectionId = props.connections.some(connection => connection.id === connectionId)
    ? connectionId
    : "";

  useEffect(() => {
    if (!activeConnectionId) {
      return;
    }

    let cancelled = false;

    const loadProjects = async () => {
      setProjectsLoading(true);
      setProjectsError(null);
      setDatabaseProjects([]);
      setDatabaseProjectId("");

      try {
        const projects = await loadDatabaseProjects(activeConnectionId);

        if (cancelled) return;

        setDatabaseProjects(projects);
        setDatabaseProjectId(projects[0]?.id ?? "");
      } catch (error) {
        if (!cancelled) {
          setProjectsError(error instanceof Error ? error.message : "Unable to load projects.");
        }
      } finally {
        if (!cancelled) {
          setProjectsLoading(false);
        }
      }
    };

    void loadProjects();

    return () => {
      cancelled = true;
    };
  }, [activeConnectionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [chat.messages, chat.isSending]);

  const agentOptions = agents.map(agent => ({
    value: agent.id,
    label: agent.name,
    description: agent.defaultModel,
  }));
  const connectionOptions = [
    { value: "", label: "No database" },
    ...props.connections.map(connection => ({
      value: connection.id,
      label: DATABASE_PROVIDER_LABELS[connection.provider],
      description: connection.credentialHint ?? undefined,
    })),
  ];
  const databaseProjectOptions = databaseProjects.map(project => ({
    value: project.id,
    label: project.name,
    description: project.detail ?? undefined,
  }));

  const database = activeConnectionId && databaseProjectId
    ? { connectionId: activeConnectionId, projectId: databaseProjectId }
    : null;
  const isDatabaseIncomplete = Boolean(activeConnectionId) && !databaseProjectId;
  const canSend = Boolean(draft.trim()) && Boolean(agentId) && Boolean(props.projectId) && !chat.isSending && !isDatabaseIncomplete;

  const send = (content = draft) => {
    if (!agentId || chat.isSending || isDatabaseIncomplete || !content.trim()) return;

    setDraft("");
    void chat.send(content, agentId, database);
  };

  return (
    <aside
      data-lenis-prevent
      aria-label="ERD agent"
      className="menu-enter flex max-h-[70vh] w-full shrink-0 flex-col border-t border-background-focus bg-background-card md:max-h-none md:w-88 md:border-l md:border-t-0">
      <header className="flex items-center justify-between gap-3 border-b border-background-focus px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <IconSparkles size={15} strokeWidth={1.8} className="text-foreground-off" />
          <p className="truncate text-sm font-medium">
            Agent
          </p>
        </div>
        <div className="flex items-center gap-1">
          {chat.messages.length > 0 ? (
            <Button
              variant="ghost"
              onClick={chat.clear}
              disabled={chat.isSending}>
              Clear
            </Button>
          ) : null}
          <button
            type="button"
            onClick={props.onClose}
            aria-label="Close agent"
            className="rounded-md p-1 text-foreground-off transition-colors hover:bg-background-focus hover:text-foreground">
            <IconX size={15} />
          </button>
        </div>
      </header>

      <section className="flex flex-col gap-2 border-b border-background-focus px-4 py-3">
        {agentsError ? (
          <p
            role="alert"
            className="text-xs text-alert-red">
            {agentsError}
          </p>
        ) : agents.length === 0 ? (
          <p className="text-xs text-foreground-off">
            Create an active OpenRouter, Claude, or OpenAI agent to start chatting.{" "}
            <Link
              href="/agents"
              className="text-foreground underline underline-offset-2">
              Open agents
            </Link>
          </p>
        ) : (
          <MenuSelector
            ariaLabel="Agent"
            options={agentOptions}
            value={agentId}
            placeholder="Select an agent"
            onChange={setAgentId} />
        )}

        <div className="flex items-center gap-2">
          <MenuSelector
            ariaLabel="Database connection"
            className="min-w-0 flex-1"
            options={connectionOptions}
            value={activeConnectionId}
            placeholder="No database"
            onChange={setConnectionId} />
          <button
            type="button"
            onClick={props.onOpenDatabase}
            aria-label="Manage database connections"
            title="Manage database connections"
            className="rounded-md p-1.5 text-foreground-off transition-colors hover:bg-background-focus hover:text-foreground">
            <IconDatabase size={14} strokeWidth={1.8} />
          </button>
        </div>

        {activeConnectionId ? (
          projectsLoading ? (
            <p
              role="status"
              className="text-xs text-foreground-off">
              Loading projects…
            </p>
          ) : projectsError ? (
            <p
              role="alert"
              className="text-xs text-alert-red">
              {projectsError}
            </p>
          ) : databaseProjects.length === 0 ? (
            <p className="text-xs text-foreground-off">
              No projects found for this account.
            </p>
          ) : (
            <MenuSelector
              ariaLabel="Database project"
              options={databaseProjectOptions}
              value={databaseProjectId}
              placeholder="Select a project"
              onChange={setDatabaseProjectId} />
          )
        ) : null}
      </section>

      <div className="flex min-h-48 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
        {chat.messages.length === 0 ? (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-foreground-off">
              Ask the agent to create ERDs, review the list of changes against your database, or update the database. Agents on Eclipse AI credits spend credits per message; agents on your own API key bill your provider.
            </p>
            {ERD_AGENT_SUGGESTIONS.map(suggestion => (
              <button
                key={suggestion}
                type="button"
                onClick={() => send(suggestion)}
                disabled={!agentId || chat.isSending || isDatabaseIncomplete}
                className="rounded-md border border-background-focus px-3 py-2 text-left text-xs text-foreground-off transition-colors hover:bg-background-focus hover:text-foreground disabled:pointer-events-none disabled:opacity-40">
                {suggestion}
              </button>
            ))}
          </div>
        ) : null}

        {chat.messages.map(message => (
          message.role === "user" ? (
            <p
              key={message.id}
              className="ml-6 self-end whitespace-pre-wrap rounded-md bg-background-focus px-3 py-2 text-xs leading-5">
              {message.content}
            </p>
          ) : (
            <div
              key={message.id}
              className="min-w-0">
              {message.isError ? (
                <p
                  role="alert"
                  className="text-xs leading-5 text-alert-red">
                  {message.content}
                </p>
              ) : (
                <MarkdownMessage>{message.content}</MarkdownMessage>
              )}
              {message.changes ? (
                <ErdChangeList changes={message.changes} />
              ) : null}
            </div>
          )
        ))}

        {chat.isSending ? (
          <p
            role="status"
            className="animate-pulse text-xs text-foreground-off">
            Thinking…
          </p>
        ) : null}

        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={event => {
          event.preventDefault();
          send();
        }}
        className="border-t border-background-focus p-3">
        <div className="flex items-end gap-2 rounded-md bg-background p-2">
          <label
            htmlFor="erd-agent-message"
            className="sr-only">
            Message the agent
          </label>
          <textarea
            id="erd-agent-message"
            rows={1}
            value={draft}
            onChange={event => setDraft(event.target.value)}
            onKeyDown={event => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                send();
              }
            }}
            placeholder="Message the agent"
            className="field-sizing-content max-h-40 min-h-8 flex-1 resize-none bg-transparent px-1 py-1 text-xs leading-5 outline-hidden placeholder:text-foreground-off" />
          <button
            type="submit"
            disabled={!canSend}
            aria-label="Send"
            className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-white transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-40">
            <IconArrowUp size={15} strokeWidth={2.2} />
          </button>
        </div>
      </form>
    </aside>
  );
}
