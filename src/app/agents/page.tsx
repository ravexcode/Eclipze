"use client";

import DashLayout from "@/components/layouts/dash";
import Heading from "@/components/ui/heading";
import type { AiProviderConnection } from "@/types/ai";
import type { WorkspaceAgent, WorkspaceAgentSession } from "@/types/user";
import { apiFetch } from "@/utils/api-fetch";
import {
  IconBrain,
  IconChevronDown,
  IconClock,
  IconLayoutSidebar,
  IconMessage2,
  IconPlus,
  IconSend,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type ModelOption = {
  id: string;
  label: string;
  provider: string;
};

const fallbackModels: ModelOption[] = [
  { id: "gpt-4o", label: "GPT-4o", provider: "OpenAI" },
  { id: "claude-sonnet-4", label: "Claude Sonnet 4", provider: "Anthropic" },
  { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro", provider: "Google" },
];

function formatSessionDate(value: string) {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(date);
}

function sessionTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function ModelSelect({
  model,
  models,
  onChange,
}: {
  model: string;
  models: ModelOption[];
  onChange: (value: string) => void;
}) {
  const selectedModel = models.find((item) => item.id === model) ?? models[0];

  return (
    <label className="relative flex min-w-0 items-center gap-2 text-xs text-foreground-off">
      <span className="sr-only">Select model</span>
      <IconBrain size={16} strokeWidth={1.8} />
      <select
        value={model}
        onChange={(event) => onChange(event.target.value)}
        className="max-w-48 appearance-none bg-transparent pr-5 text-foreground outline-hidden"
        aria-label="Select model">
        {models.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label}
          </option>
        ))}
      </select>
      <IconChevronDown
        className="pointer-events-none absolute right-0"
        size={14}
        strokeWidth={1.8}
      />
      {selectedModel && <span className="sr-only">{selectedModel.provider}</span>}
    </label>
  );
}

function SessionRow({
  session,
  selected,
  onSelect,
}: {
  session: WorkspaceAgentSession;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group flex w-full items-start gap-3 rounded-sm p-3 text-left transition-colors ${
        selected
          ? "bg-background-focus text-foreground"
          : "text-foreground-off hover:bg-background-focus/70 hover:text-foreground"
      }`}>
      <IconMessage2 className="mt-0.5 shrink-0" size={16} strokeWidth={1.8} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-foreground">
          {session.description}
        </span>
        <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-foreground-off">
          <span>{session.model}</span>
          <span>·</span>
          <span>{sessionTime(session.startedAt)}</span>
        </span>
      </span>
      <span
        className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${
          session.status === "ACTIVE"
            ? "bg-priority-medium"
            : session.status === "FAILED"
              ? "bg-priority-high"
              : "bg-priority-low"
        }`}
        aria-label={session.status.toLowerCase()}
      />
    </button>
  );
}

export default function AgentsPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<WorkspaceAgent[]>([]);
  const [sessions, setSessions] = useState<WorkspaceAgentSession[]>([]);
  const [connections, setConnections] = useState<AiProviderConnection[]>([]);
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState(fallbackModels[0].id);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [sessionsOpen, setSessionsOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadAgentWorkspace = async () => {
      try {
        const [agentsResponse, sessionsResponse, providersResponse] =
          await Promise.all([
            apiFetch("/api/agents", { credentials: "include" }),
            apiFetch("/api/agent-sessions", { credentials: "include" }),
            apiFetch("/api/ai-providers", {
              credentials: "include",
              cache: "no-store",
            }),
          ]);

        const agentsData = (await agentsResponse.json()) as {
          agents?: WorkspaceAgent[];
        };
        const sessionsData = (await sessionsResponse.json()) as {
          agentSessions?: WorkspaceAgentSession[];
        };
        const providersData = (await providersResponse.json()) as {
          connections?: AiProviderConnection[];
        };

        if (cancelled) return;

        if (!agentsResponse.ok || !sessionsResponse.ok) {
          throw new Error("Unable to load the agent workspace.");
        }

        const nextAgents = agentsData.agents ?? [];
        const nextSessions = sessionsData.agentSessions ?? [];
        const nextConnections = providersData.connections ?? [];

        setAgents(nextAgents);
        setSessions(nextSessions);
        setConnections(nextConnections);

        const firstConfiguredModel = nextConnections.find(
          (connection) => connection.model,
        )?.model;
        const firstAgentModel = nextAgents[0]?.defaultModel;
        setSelectedModel(firstConfiguredModel ?? firstAgentModel ?? fallbackModels[0].id);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load the agent workspace.",
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void loadAgentWorkspace();

    return () => {
      cancelled = true;
    };
  }, []);

  const models = useMemo(() => {
    const configuredModels = connections.flatMap((connection) => {
      if (!connection.model) return [];
      return [
        {
          id: connection.model,
          label: connection.model,
          provider: connection.provider,
        },
      ];
    });
    const agentModels = agents.map((agent) => ({
      id: agent.defaultModel,
      label: agent.defaultModel,
      provider: "Agent default",
    }));
    const available = [...configuredModels, ...agentModels, ...fallbackModels];

    return available.filter(
      (model, index) => available.findIndex((item) => item.id === model.id) === index,
    );
  }, [agents, connections]);

  const groupedSessions = useMemo(() => {
    return sessions.reduce<Record<string, WorkspaceAgentSession[]>>((groups, session) => {
      const label = formatSessionDate(session.startedAt);
      groups[label] = [...(groups[label] ?? []), session];
      return groups;
    }, {});
  }, [sessions]);

  const sendPrompt = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const description = prompt.trim();
    const agent = agents[0];

    if (!description || !agent) return;

    setError(null);
    setIsSending(true);

    try {
      const response = await apiFetch("/api/agent-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          agentId: agent.id,
          description,
          model: selectedModel,
        }),
      });
      const data = (await response.json()) as {
        message?: string;
        agentSession?: WorkspaceAgentSession;
      };

      if (!response.ok || !data.agentSession) {
        throw new Error(data.message ?? "Unable to start the agent session.");
      }

      setSessions((current) => [data.agentSession!, ...current]);
      setSelectedSession(data.agentSession.id);
      setPrompt("");
      setSessionsOpen(true);
    } catch (sendError) {
      setError(
        sendError instanceof Error
          ? sendError.message
          : "Unable to start the agent session.",
      );
    } finally {
      setIsSending(false);
    }
  };

  const hasAgents = agents.length > 0;
  const canSend = prompt.trim().length > 0 && hasAgents && !isSending;

  return (
    <DashLayout current="agents" router={router}>
      <main className="flex min-h-dvh w-full min-w-0 flex-col">
        <Heading label="Agent" />

        <div
          className={`grid min-h-[calc(100dvh-57px)] min-w-0 flex-1 grid-cols-1 ${
            sessionsOpen ? "lg:grid-cols-[minmax(0,1fr)_300px]" : "lg:grid-cols-1"
          }`}>
          <section className="relative flex min-h-160 min-w-0 flex-col items-center justify-center px-4 py-12 md:px-8">
            <div className="w-full max-w-180">
              <div className="mb-8 text-center">
                <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-sm bg-background-card text-foreground">
                  <IconBrain size={24} strokeWidth={1.6} />
                </div>
                <h1 className="text-2xl font-medium tracking-[-0.03em] md:text-3xl">
                  What should your agent work on?
                </h1>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-foreground-off">
                  Describe a task, ask a question, or give your agent the next step.
                </p>
              </div>

              <form onSubmit={sendPrompt} className="rounded-sm bg-background-card p-2">
                <textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                      event.preventDefault();
                      event.currentTarget.form?.requestSubmit();
                    }
                  }}
                  className="min-h-32 w-full resize-none bg-transparent px-3 py-3 text-sm leading-6 text-foreground outline-hidden placeholder:text-foreground-off/70"
                  placeholder="Ask your agent to investigate, plan, or build…"
                  aria-label="Message your agent"
                />
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-background-focus px-3 pt-2">
                  <div className="flex min-w-0 items-center gap-3">
                    <ModelSelect
                      model={selectedModel}
                      models={models}
                      onChange={setSelectedModel}
                    />
                    <span className="hidden text-xs text-foreground-off/60 sm:inline">
                      ⌘ Enter to send
                    </span>
                  </div>
                  <button
                    type="submit"
                    disabled={!canSend}
                    className="flex items-center gap-2 rounded-sm bg-accent px-3 py-2 text-sm text-foreground transition-opacity hover:brightness-125 disabled:cursor-not-allowed disabled:opacity-40"
                    title={!hasAgents ? "Create an agent before sending a task" : undefined}>
                    <span>{isSending ? "Starting…" : "Send"}</span>
                    <IconSend size={16} strokeWidth={1.8} />
                  </button>
                </div>
              </form>

              {error && (
                <p
                  role="alert"
                  className="mt-4 rounded-sm border border-priority-high bg-background-card p-3 text-sm text-priority-high">
                  {error}
                </p>
              )}

              {!isLoading && !hasAgents && (
                <div className="mt-4 flex items-center justify-between gap-4 rounded-sm bg-background-card p-4 text-sm">
                  <div>
                    <p className="text-foreground">No agents configured yet.</p>
                    <p className="mt-1 text-xs text-foreground-off">
                      Create an agent to start a real session from this composer.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push("/agents/gestor")}
                    className="flex shrink-0 items-center gap-1.5 text-xs text-foreground hover:text-foreground-off">
                    <IconPlus size={15} />
                    Manage agents
                  </button>
                </div>
              )}

              <p className="mt-4 text-center text-[11px] text-foreground-off/60">
                Agent sessions are saved to your workspace and can be reopened from the sidebar.
              </p>
            </div>
          </section>

          <aside
            className={`border-t border-background-focus bg-background-card lg:border-l lg:border-t-0 ${
              sessionsOpen ? "block" : "hidden"
            }`}>
            <div className="flex h-full min-h-120 flex-col">
              <div className="flex items-center justify-between border-b border-background-focus px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Sessions</p>
                  <p className="mt-0.5 text-xs text-foreground-off">
                    {sessions.length} saved {sessions.length === 1 ? "session" : "sessions"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSessionsOpen(false)}
                  className="rounded-sm p-2 text-foreground-off hover:bg-background-focus hover:text-foreground"
                  aria-label="Close sessions sidebar">
                  <IconLayoutSidebar size={17} strokeWidth={1.8} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-2">
                {isLoading ? (
                  <div className="flex flex-col gap-2 p-2" aria-label="Loading sessions">
                    {[1, 2, 3].map((item) => (
                      <div key={item} className="h-16 animate-pulse rounded-sm bg-background-focus/50" />
                    ))}
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                    <IconClock size={20} className="text-foreground-off" strokeWidth={1.6} />
                    <p className="mt-3 text-sm">No sessions yet</p>
                    <p className="mt-1 text-xs leading-5 text-foreground-off">
                      Your agent tasks will appear here after you send the first one.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {Object.entries(groupedSessions).map(([label, items]) => (
                      <section key={label}>
                        <p className="px-3 pb-1.5 text-[11px] uppercase tracking-[0.12em] text-foreground-off">
                          {label}
                        </p>
                        <div className="flex flex-col gap-0.5">
                          {items.map((session) => (
                            <SessionRow
                              key={session.id}
                              session={session}
                              selected={selectedSession === session.id}
                              onSelect={() => setSelectedSession(session.id)}
                            />
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-background-focus p-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSession(null);
                    setPrompt("");
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-sm bg-background-focus px-3 py-2 text-xs text-foreground-off hover:text-foreground">
                  <IconPlus size={15} />
                  New session
                </button>
              </div>
            </div>
          </aside>
        </div>

        {!sessionsOpen && (
          <button
            type="button"
            onClick={() => setSessionsOpen(true)}
            className="fixed bottom-5 right-5 flex items-center gap-2 rounded-sm bg-background-card px-3 py-2 text-xs text-foreground-off hover:bg-background-focus hover:text-foreground"
            aria-label="Open sessions sidebar">
            <IconLayoutSidebar size={16} strokeWidth={1.8} />
            Sessions
          </button>
        )}
      </main>
    </DashLayout>
  );
}
