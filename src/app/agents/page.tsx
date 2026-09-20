"use client";

import DashLayout from "@/components/layouts/dash";
import Heading from "@/components/ui/heading";
import { apiFetch } from "@/utils/api-fetch";

import {
  IconAlertCircle,
  IconCheck,
  IconChevronDown,
  IconCode,
  IconFileCode,
  IconFolder,
  IconGitBranch,
  IconLoader2,
  IconPencil,
  IconPlayerPlay,
  IconPlayerStop,
  IconPlus,
  IconRefresh,
  IconRobot,
  IconSparkles,
  IconTerminal2,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type AgentStatus = "ACTIVE" | "INACTIVE";
type ProjectStatus = "ACTIVE" | "AT_RISK" | "COMPLETED";
type SessionStatus = "ACTIVE" | "COMPLETED" | "FAILED" | "CANCELLED";
type RunState = "idle" | "starting" | "running" | "completed" | "failed" | "cancelled" | "unavailable";

type Agent = {
  id: string;
  name: string;
  defaultModel: string;
  status: AgentStatus;
  createdAt?: string;
  updatedAt?: string;
};

type Project = {
  id: string;
  name: string;
  description: string | null;
  externalUrl: string | null;
  status: ProjectStatus;
  createdAt?: string;
  updatedAt?: string;
};

type Repository = {
  id: string;
  projectId: string | null;
  provider: string;
  repositoryUrl: string;
  defaultBranch: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
};

type AgentSession = {
  id: string;
  agentId: string;
  projectId: string | null;
  description: string;
  model: string;
  status: SessionStatus;
  startedAt: string;
  endedAt: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type Skill = {
  id: string;
  name: string;
  description: string;
  version?: string | null;
  enabled?: boolean;
};

type RunEvent = {
  id: string;
  type: string;
  message: string;
  createdAt?: string;
  level?: "info" | "success" | "warning" | "error";
};

type RunSnapshot = {
  id: string;
  sessionId?: string | null;
  status?: string;
  error?: string | null;
  result?: string | null;
  events: RunEvent[];
  files: string[];
  diff: string | null;
};

type ApiResult = {
  response: Response;
  payload: unknown;
};

const MODEL_OPTIONS = [
  "openai/gpt-5",
  "anthropic/claude-sonnet-4",
  "openrouter/auto",
];

const COMMAND_OPTIONS = [
  { key: "git-status", label: "Git status" },
  { key: "git-diff-stat", label: "Git diff stat" },
  { key: "git-rev-parse", label: "Git repository check" },
  { key: "pnpm-test", label: "pnpm test" },
  { key: "pnpm-build", label: "pnpm build" },
  { key: "pnpm-typecheck", label: "pnpm typecheck" },
  { key: "npm-test", label: "npm test" },
  { key: "npm-build", label: "npm build" },
  { key: "npm-typecheck", label: "npm typecheck" },
  { key: "pytest", label: "pytest" },
  { key: "go-test", label: "go test" },
];

const RUN_ENDPOINT = "/api/agent-runs";
const SKILLS_ENDPOINT = "/api/skills";

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
}

function readString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function readNullableString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function readCollection(payload: unknown, key: string) {
  const value = asRecord(payload)[key];
  return Array.isArray(value) ? value : [];
}

function readMessage(payload: unknown, fallback: string) {
  const message = asRecord(payload).message;
  return typeof message === "string" && message.trim() ? message : fallback;
}

function normalizeAgent(value: unknown): Agent | null {
  const item = asRecord(value);
  const id = readString(item.id);
  const name = readString(item.name);
  if (!id || !name) return null;

  return {
    id,
    name,
    defaultModel: readString(item.defaultModel, MODEL_OPTIONS[0]),
    status: item.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
    createdAt: readString(item.createdAt) || undefined,
    updatedAt: readString(item.updatedAt) || undefined,
  };
}

function normalizeProject(value: unknown): Project | null {
  const item = asRecord(value);
  const id = readString(item.id);
  const name = readString(item.name);
  if (!id || !name) return null;

  return {
    id,
    name,
    description: readNullableString(item.description),
    externalUrl: readNullableString(item.externalUrl ?? item.repositoryUrl),
    status: item.status === "AT_RISK" || item.status === "COMPLETED" ? item.status : "ACTIVE",
    createdAt: readString(item.createdAt) || undefined,
    updatedAt: readString(item.updatedAt) || undefined,
  };
}

function normalizeRepository(value: unknown): Repository | null {
  const item = asRecord(value);
  const id = readString(item.id);
  const repositoryUrl = readString(item.repositoryUrl);
  if (!id || !repositoryUrl) return null;

  return {
    id,
    projectId: readNullableString(item.projectId),
    provider: readString(item.provider, "OTHER"),
    repositoryUrl,
    defaultBranch: readString(item.defaultBranch, "main"),
    status: readString(item.status, "CONNECTED"),
    createdAt: readString(item.createdAt) || undefined,
    updatedAt: readString(item.updatedAt) || undefined,
  };
}

function normalizeSession(value: unknown): AgentSession | null {
  const item = asRecord(value);
  const id = readString(item.id);
  const agentId = readString(item.agentId);
  if (!id || !agentId) return null;

  const status = item.status === "COMPLETED" || item.status === "FAILED" || item.status === "CANCELLED"
    ? item.status
    : "ACTIVE";

  return {
    id,
    agentId,
    projectId: readNullableString(item.projectId),
    description: readString(item.description, "Agent session"),
    model: readString(item.model, MODEL_OPTIONS[0]),
    status,
    startedAt: readString(item.startedAt, new Date().toISOString()),
    endedAt: readNullableString(item.endedAt),
    createdAt: readString(item.createdAt) || undefined,
    updatedAt: readString(item.updatedAt) || undefined,
  };
}

function normalizeSkill(value: unknown): Skill | null {
  const item = asRecord(value);
  const id = readString(item.id ?? item.slug);
  const name = readString(item.name ?? item.title);
  if (!id || !name) return null;

  return {
    id,
    name,
    description: readString(item.description, "Available for code runs."),
    version: readNullableString(item.version),
    enabled: item.enabled !== false,
  };
}

function normalizeEvent(value: unknown, index: number): RunEvent | null {
  const item = asRecord(value);
  const message = readString(item.message ?? item.text ?? item.output);
  if (!message) return null;

  const level = item.level === "success" || item.level === "warning" || item.level === "error"
    ? item.level
    : item.type === "ERROR"
      ? "error"
      : item.type === "RESULT"
        ? "success"
        : "info";

  return {
    id: readString(item.id, `event-${index}`),
    type: readString(item.type, "activity"),
    message,
    createdAt: readString(item.createdAt) || undefined,
    level,
  };
}

function normalizeRun(value: unknown): RunSnapshot | null {
  const item = asRecord(value);
  const id = readString(item.id ?? item.runId ?? item.sessionId);
  if (!id) return null;

  const rawEvents = Array.isArray(item.events) ? item.events : [];
  const rawFiles = Array.isArray(item.files) ? item.files : [];

  return {
    id,
    sessionId: readNullableString(item.sessionId ?? item.agentSessionId),
    status: readString(item.status),
    error: readNullableString(item.error ?? item.errorCode),
    result: readNullableString(item.result ?? item.output ?? item.resultSummary),
    events: rawEvents.map(normalizeEvent).filter((event): event is RunEvent => event !== null),
    files: rawFiles.filter((file): file is string => typeof file === "string"),
    diff: readNullableString(item.diff),
  };
}

async function requestJson(input: RequestInfo | URL, init: RequestInit = {}): Promise<ApiResult> {
  const response = await apiFetch(input, init);
  const payload = await response.json().catch(() => null);
  return { response, payload };
}

function jsonInit(method: string, body: Record<string, unknown>): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  };
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown time";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function statusColor(status: string) {
  if (status === "COMPLETED" || status === "SUCCEEDED" || status === "ACTIVE") return "bg-status-green";
  if (status === "FAILED" || status === "AT_RISK") return "bg-alert-red";
  if (status === "CANCELLED") return "bg-warning";
  return "bg-foreground-off";
}

function statusLabel(status: string) {
  return status.replaceAll("_", " ").toLowerCase();
}

function Panel(props: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-sm bg-surface ${props.className ?? ""}`}>
      {props.children}
    </section>
  );
}

function PanelHeading(props: { icon: React.ReactNode; label: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-background-focus px-4 py-3 sm:px-5">
      <div className="flex min-w-0 items-center gap-2">
        <span className="text-foreground-off">{props.icon}</span>
        <h2 className="truncate text-sm font-semibold text-foreground">{props.label}</h2>
      </div>
      {props.action}
    </div>
  );
}

function StatusIndicator(props: { status: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs text-foreground-off">
      <span className={`h-2 w-2 rounded-full ${statusColor(props.status)}`} />
      {statusLabel(props.status)}
    </span>
  );
}

function SmallButton(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: "default" | "accent" | "danger" }) {
  const tone = props.tone ?? "default";
  const toneClass = tone === "accent"
    ? "bg-accent text-foreground hover:bg-accent-strong"
    : tone === "danger"
      ? "text-alert-red hover:bg-alert-red/10"
      : "text-foreground-off hover:bg-background-focus hover:text-foreground";

  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-xs px-3 py-2 text-xs transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-40 ${toneClass} ${props.className ?? ""}`} />
  );
}

function FieldLabel(props: { children: React.ReactNode }) {
  return <span className="mb-2 block text-[11px] uppercase tracking-[0.12em] text-foreground-off">{props.children}</span>;
}

const fieldClassName = "w-full rounded-xs border border-background-focus bg-background px-3 py-2.5 text-sm text-foreground outline-hidden transition-colors placeholder:text-foreground-off/60 focus:border-accent focus:ring-1 focus:ring-accent";

export default function AgentsPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [sessions, setSessions] = useState<AgentSession[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillsAvailable, setSkillsAvailable] = useState(true);
  const [skillsError, setSkillsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
  const [activeRun, setActiveRun] = useState<RunSnapshot | null>(null);
  const [runState, setRunState] = useState<RunState>("idle");
  const [runError, setRunError] = useState<string | null>(null);
  const [agentForm, setAgentForm] = useState({ id: "", name: "", defaultModel: MODEL_OPTIONS[0], status: "ACTIVE" as AgentStatus });
  const [projectForm, setProjectForm] = useState({ id: "", name: "", description: "", repositoryUrl: "", defaultBranch: "main", status: "ACTIVE" as ProjectStatus });
  const [composer, setComposer] = useState({ agentId: "", model: MODEL_OPTIONS[0], projectId: "", commandKey: "git-status", instructions: "" });
  const [savingAgent, setSavingAgent] = useState(false);
  const [savingProject, setSavingProject] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const selectedAgent = useMemo(
    () => agents.find(agent => agent.id === composer.agentId) ?? null,
    [agents, composer.agentId],
  );
  const selectedRepository = useMemo(
    () => repositories.find(repository => repository.projectId === composer.projectId && repository.status === "CONNECTED") ?? null,
    [repositories, composer.projectId],
  );
  const selectedSession = useMemo(
    () => sessions.find(session => session.id === selectedSessionId) ?? null,
    [sessions, selectedSessionId],
  );

  async function loadWorkspace() {
    setLoading(true);
    setLoadError(null);

    try {
      const [agentsResult, projectsResult, repositoriesResult, sessionsResult, skillsResult] = await Promise.all([
        requestJson("/api/agents"),
        requestJson("/api/projects"),
        requestJson("/api/repositories"),
        requestJson("/api/agent-sessions"),
        requestJson(SKILLS_ENDPOINT),
      ]);

      const failedResult = [agentsResult, projectsResult, repositoriesResult, sessionsResult].find(result => !result.response.ok);
      if (failedResult) {
        throw new Error(readMessage(failedResult.payload, `Workspace request failed with status ${failedResult.response.status}.`));
      }

      const nextAgents = readCollection(agentsResult.payload, "agents").map(normalizeAgent).filter((agent): agent is Agent => agent !== null);
      const nextProjects = readCollection(projectsResult.payload, "projects").map(normalizeProject).filter((project): project is Project => project !== null);
      const nextRepositories = readCollection(repositoriesResult.payload, "repositories").map(normalizeRepository).filter((repository): repository is Repository => repository !== null);
      const nextSessions = readCollection(sessionsResult.payload, "agentSessions").map(normalizeSession).filter((session): session is AgentSession => session !== null);

      setAgents(nextAgents);
      setProjects(nextProjects);
      setRepositories(nextRepositories);
      setSessions(nextSessions);
      setComposer(previous => {
        const nextAgent = nextAgents.find(agent => agent.id === previous.agentId) ?? nextAgents[0];
        const nextProject = nextProjects.find(project => project.id === previous.projectId) ?? nextProjects[0];
        const nextRepository = nextRepositories.find(repository => repository.projectId === nextProject?.id);
        return {
          ...previous,
          agentId: nextAgent?.id ?? "",
          model: previous.agentId ? previous.model : nextAgent?.defaultModel ?? previous.model,
          projectId: nextRepository?.projectId ?? nextProject?.id ?? "",
        };
      });

      if (skillsResult.response.status === 404) {
        setSkillsAvailable(false);
        setSkills([]);
      } else if (!skillsResult.response.ok) {
        setSkillsAvailable(false);
        setSkillsError(readMessage(skillsResult.payload, `Skills request failed with status ${skillsResult.response.status}.`));
      } else {
        setSkillsAvailable(true);
        setSkillsError(null);
        setSkills(readCollection(skillsResult.payload, "skills").map(normalizeSkill).filter((skill): skill is Skill => skill !== null));
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Unable to load Agents workspace.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadWorkspace(), 0);
    return () => window.clearTimeout(initialLoad);
  }, []);

  useEffect(() => {
    if (!activeRun?.id || runState !== "running") return;

    let cancelled = false;
    const pollRun = async () => {
      try {
        const result = await requestJson(`${RUN_ENDPOINT}/${activeRun.id}`);
        if (cancelled || result.response.status === 404) return;
        if (!result.response.ok) {
          setRunError(readMessage(result.payload, `Run status failed with status ${result.response.status}.`));
          return;
        }

        const nextRun = normalizeRun(asRecord(result.payload).run ?? asRecord(result.payload).agentRun ?? result.payload);
        if (!nextRun) return;
        setActiveRun(previous => ({ ...previous, ...nextRun, events: nextRun.events.length ? nextRun.events : previous?.events ?? [] }));

        const status = nextRun.status?.toUpperCase();
        if (status === "COMPLETED" || status === "SUCCEEDED") setRunState("completed");
        if (status === "FAILED") setRunState("failed");
        if (status === "CANCELLED") setRunState("cancelled");
      } catch (error) {
        if (!cancelled) setRunError(error instanceof Error ? error.message : "Unable to poll run status.");
      }
    };

    void pollRun();
    const interval = window.setInterval(() => void pollRun(), 2500);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [activeRun?.id, runState]);

  function setAgentForEdit(agent: Agent) {
    setAgentForm({ id: agent.id, name: agent.name, defaultModel: agent.defaultModel, status: agent.status });
  }

  function resetAgentForm() {
    setAgentForm({ id: "", name: "", defaultModel: MODEL_OPTIONS[0], status: "ACTIVE" });
  }

  function setProjectForEdit(project: Project) {
    const repository = repositories.find(item => item.projectId === project.id);
    setProjectForm({
      id: project.id,
      name: project.name,
      description: project.description ?? "",
      repositoryUrl: repository?.repositoryUrl ?? project.externalUrl ?? "",
      defaultBranch: repository?.defaultBranch ?? "main",
      status: project.status,
    });
  }

  function resetProjectForm() {
    setProjectForm({ id: "", name: "", description: "", repositoryUrl: "", defaultBranch: "main", status: "ACTIVE" });
  }

  async function saveAgent() {
    if (!agentForm.name.trim() || !agentForm.defaultModel.trim()) {
      setActionError("Agent name and model are required.");
      return;
    }

    setSavingAgent(true);
    setActionError(null);
    try {
      const endpoint = agentForm.id ? `/api/agents/${agentForm.id}` : "/api/agents";
      const method = agentForm.id ? "PATCH" : "POST";
      const result = await requestJson(endpoint, jsonInit(method, {
        name: agentForm.name,
        defaultModel: agentForm.defaultModel,
        status: agentForm.status,
      }));
      if (!result.response.ok) throw new Error(readMessage(result.payload, "Agent could not be saved."));

      const saved = normalizeAgent(asRecord(result.payload).agent);
      if (saved) {
        setAgents(previous => agentForm.id ? previous.map(agent => agent.id === saved.id ? saved : agent) : [saved, ...previous]);
        if (!composer.agentId) setComposer(previous => ({ ...previous, agentId: saved.id, model: saved.defaultModel }));
      }
      resetAgentForm();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Agent could not be saved.");
    } finally {
      setSavingAgent(false);
    }
  }

  async function deleteAgent(agent: Agent) {
    if (!window.confirm(`Delete agent “${agent.name}”?`)) return;
    setDeletingId(agent.id);
    setActionError(null);
    try {
      const result = await requestJson(`/api/agents/${agent.id}`, { method: "DELETE", credentials: "include" });
      if (!result.response.ok) throw new Error(readMessage(result.payload, "Agent could not be deleted."));
      setAgents(previous => previous.filter(item => item.id !== agent.id));
      if (composer.agentId === agent.id) setComposer(previous => ({ ...previous, agentId: "" }));
      if (agentForm.id === agent.id) resetAgentForm();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Agent could not be deleted.");
    } finally {
      setDeletingId(null);
    }
  }

  async function saveProject() {
    if (!projectForm.name.trim()) {
      setActionError("Project name is required.");
      return;
    }

    setSavingProject(true);
    setActionError(null);
    try {
      const endpoint = projectForm.id ? `/api/projects/${projectForm.id}` : "/api/projects";
      const method = projectForm.id ? "PATCH" : "POST";
      const result = await requestJson(endpoint, jsonInit(method, {
        name: projectForm.name,
        description: projectForm.description,
        externalUrl: projectForm.repositoryUrl,
        status: projectForm.status,
      }));
      if (!result.response.ok) throw new Error(readMessage(result.payload, "Project could not be saved."));

      const saved = normalizeProject(asRecord(result.payload).project);
      if (saved) {
        setProjects(previous => projectForm.id ? previous.map(project => project.id === saved.id ? saved : project) : [saved, ...previous]);
        if (!composer.projectId) setComposer(previous => ({ ...previous, projectId: saved.id }));
        await saveRepository(saved.id);
      }
      resetProjectForm();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Project could not be saved.");
    } finally {
      setSavingProject(false);
    }
  }

  async function saveRepository(projectId: string) {
    const existing = repositories.find(repository => repository.projectId === projectId);
    const repositoryUrl = projectForm.repositoryUrl.trim();

    if (!repositoryUrl) {
      if (existing) {
        const result = await requestJson(`/api/repositories/${existing.id}`, { method: "DELETE", credentials: "include" });
        if (!result.response.ok) throw new Error(readMessage(result.payload, "Repository could not be disconnected."));
        setRepositories(previous => previous.filter(repository => repository.id !== existing.id));
      }
      return;
    }

    const result = await requestJson(
      existing ? `/api/repositories/${existing.id}` : "/api/repositories",
      jsonInit(existing ? "PATCH" : "POST", {
        projectId,
        repositoryUrl,
        defaultBranch: projectForm.defaultBranch.trim() || "main",
      }),
    );
    if (!result.response.ok) throw new Error(readMessage(result.payload, "Repository could not be connected."));

    const saved = normalizeRepository(asRecord(result.payload).repository);
    if (saved) {
      setRepositories(previous => existing
        ? previous.map(repository => repository.id === saved.id ? saved : repository)
        : [saved, ...previous]);
    }
  }

  async function deleteProject(project: Project) {
    if (!window.confirm(`Delete project “${project.name}”?`)) return;
    setDeletingId(project.id);
    setActionError(null);
    try {
      const result = await requestJson(`/api/projects/${project.id}`, { method: "DELETE", credentials: "include" });
      if (!result.response.ok) throw new Error(readMessage(result.payload, "Project could not be deleted."));
      setProjects(previous => previous.filter(item => item.id !== project.id));
      if (composer.projectId === project.id) setComposer(previous => ({ ...previous, projectId: "" }));
      if (projectForm.id === project.id) resetProjectForm();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Project could not be deleted.");
    } finally {
      setDeletingId(null);
    }
  }

  async function disconnectRepository(project: Project) {
    const repository = repositories.find(item => item.projectId === project.id);
    if (!repository) return;
    setActionError(null);
    try {
      const result = await requestJson(`/api/repositories/${repository.id}`, { method: "DELETE", credentials: "include" });
      if (!result.response.ok) throw new Error(readMessage(result.payload, "Repository could not be disconnected."));
      setRepositories(previous => previous.filter(item => item.id !== repository.id));
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Repository could not be disconnected.");
    }
  }

  function toggleSkill(skillId: string) {
    setSelectedSkillIds(previous => previous.includes(skillId)
      ? previous.filter(id => id !== skillId)
      : [...previous, skillId]);
  }

  async function startRun() {
    if (!composer.agentId || !composer.instructions.trim() || !composer.projectId || !selectedRepository) {
      setRunError("Select an agent, connected repository, and instructions before starting a run.");
      return;
    }

    setRunState("starting");
    setRunError(null);
    setActiveRun(null);

    try {
      const sessionResult = await requestJson("/api/agent-sessions", jsonInit("POST", {
        agentId: composer.agentId,
        projectId: composer.projectId,
        description: composer.instructions.trim().slice(0, 500),
        model: composer.model,
      }));
      if (!sessionResult.response.ok) throw new Error(readMessage(sessionResult.payload, "Agent session could not be created."));
      const session = normalizeSession(asRecord(sessionResult.payload).agentSession);
      if (!session) throw new Error("Server created a session but returned no session identity.");

      const result = await requestJson(RUN_ENDPOINT, jsonInit("POST", {
        sessionId: session.id,
        repositoryId: selectedRepository.id,
        model: composer.model,
        instructions: composer.instructions.trim(),
        commandKey: composer.commandKey,
        skills: selectedSkillIds,
      }));

      if (!result.response.ok) {
        throw new Error(readMessage(result.payload, result.response.status === 404
          ? "Code runner is not available on this server yet."
          : `Run could not start. Server returned ${result.response.status}.`));
      }

      const run = normalizeRun(asRecord(result.payload).run ?? asRecord(result.payload).agentRun ?? asRecord(result.payload).agentSession ?? result.payload);
      if (!run) throw new Error("Server started a run but returned no run identity.");

      setActiveRun(run);
      setSelectedSessionId(run.sessionId ?? session.id);
      setRunState("running");
      await loadWorkspace();
    } catch (error) {
      setRunState("unavailable");
      setRunError(error instanceof Error ? error.message : "Code runner could not start.");
    }
  }

  async function cancelRun() {
    if (!activeRun?.id) return;
    setRunError(null);
    try {
      const result = await requestJson(`${RUN_ENDPOINT}/${activeRun.id}/cancel`, { method: "POST", credentials: "include" });
      if (!result.response.ok && result.response.status !== 404) {
        throw new Error(readMessage(result.payload, "Run could not be cancelled."));
      }

      if (result.response.status === 404 && activeRun.sessionId) {
        const sessionResult = await requestJson(`/api/agent-sessions/${activeRun.sessionId}`, jsonInit("PATCH", { status: "CANCELLED" }));
        if (!sessionResult.response.ok) throw new Error(readMessage(sessionResult.payload, "Run cancellation is not supported by the server."));
      }

      setRunState("cancelled");
      setActiveRun(previous => previous ? { ...previous, status: "CANCELLED" } : previous);
      await loadWorkspace();
    } catch (error) {
      setRunError(error instanceof Error ? error.message : "Run could not be cancelled.");
    }
  }

  async function deleteSession(session: AgentSession) {
    if (!window.confirm(`Delete session “${session.description}”?`)) return;

    setActionError(null);

    try {
      const result = await requestJson(`/api/agent-sessions/${session.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!result.response.ok) {
        throw new Error(readMessage(result.payload, "Session could not be deleted."));
      }

      setSessions(previous => previous.filter(item => item.id !== session.id));

      if (selectedSessionId === session.id) {
        setSelectedSessionId(null);
        setActiveRun(null);
        setRunState("idle");
      }
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Session could not be deleted.");
    }
  }

  function selectSession(session: AgentSession) {
    setSelectedSessionId(session.id);
    setRunError(null);
    setActiveRun({ id: session.id, sessionId: session.id, status: session.status, events: [], files: [], diff: null });
    setRunState(session.status === "ACTIVE" ? "running" : session.status === "COMPLETED" ? "completed" : session.status === "FAILED" ? "failed" : "cancelled");
  }

  return (
    <DashLayout current="agents" router={router}>
      <main className="min-w-0 w-full">
        <Heading label="Agents" />

        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5 px-5 py-6 sm:px-8 lg:px-10 lg:py-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">Workspace / code runner</p>
              <h1 className="mt-2 text-2xl font-normal tracking-[-0.02em] text-foreground sm:text-3xl">Build with agents.</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground-off">Connect a repository, choose skills, and send bounded work to your server-side runner.</p>
            </div>
            <SmallButton onClick={() => void loadWorkspace()} disabled={loading}>
              <IconRefresh size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </SmallButton>
          </div>

          {loadError ? (
            <div className="flex items-start gap-3 rounded-sm border border-alert-red bg-alert-red/10 px-4 py-3 text-sm text-foreground">
              <IconAlertCircle size={18} className="mt-0.5 shrink-0 text-alert-red" />
              <div className="min-w-0">
                <p className="font-medium">Workspace unavailable</p>
                <p className="mt-1 break-words text-foreground-off">{loadError}</p>
              </div>
            </div>
          ) : null}

          {actionError ? (
            <div className="flex items-start justify-between gap-3 rounded-sm border border-alert-red bg-alert-red/10 px-4 py-3 text-sm text-foreground">
              <div className="flex min-w-0 items-start gap-3">
                <IconAlertCircle size={18} className="mt-0.5 shrink-0 text-alert-red" />
                <p className="break-words text-foreground-off">{actionError}</p>
              </div>
              <button type="button" onClick={() => setActionError(null)} className="text-foreground-off hover:text-foreground" aria-label="Dismiss error">
                <IconX size={16} />
              </button>
            </div>
          ) : null}

          <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
            <Panel className="min-w-0">
              <PanelHeading icon={<IconCode size={19} />} label="Run composer" />
              <div className="space-y-5 p-4 sm:p-5">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <label className="min-w-0">
                    <FieldLabel>Agent</FieldLabel>
                    <div className="relative">
                      <select
                        value={composer.agentId}
                        onChange={event => {
                          const agent = agents.find(item => item.id === event.target.value);
                          setComposer(previous => ({ ...previous, agentId: event.target.value, model: agent?.defaultModel ?? previous.model }));
                        }}
                        className={`${fieldClassName} appearance-none pr-8`}
                        disabled={loading || agents.length === 0}>
                        <option value="">Select agent</option>
                        {agents.map(agent => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
                      </select>
                      <IconChevronDown size={16} className="pointer-events-none absolute right-3 top-3 text-foreground-off" />
                    </div>
                  </label>
                  <label className="min-w-0">
                    <FieldLabel>Model</FieldLabel>
                    <div className="relative">
                      <select value={composer.model} onChange={event => setComposer(previous => ({ ...previous, model: event.target.value }))} className={`${fieldClassName} appearance-none pr-8`}>
                        {[...new Set([composer.model, ...MODEL_OPTIONS])].map(model => <option key={model} value={model}>{model}</option>)}
                      </select>
                      <IconChevronDown size={16} className="pointer-events-none absolute right-3 top-3 text-foreground-off" />
                    </div>
                  </label>
                  <label className="min-w-0">
                    <FieldLabel>Repository</FieldLabel>
                    <div className="relative">
                      <select value={composer.projectId} onChange={event => setComposer(previous => ({ ...previous, projectId: event.target.value }))} className={`${fieldClassName} appearance-none pr-8`}>
                        <option value="">No repository</option>
                        {projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}
                      </select>
                      <IconChevronDown size={16} className="pointer-events-none absolute right-3 top-3 text-foreground-off" />
                    </div>
                  </label>
                  <label className="min-w-0">
                    <FieldLabel>Command</FieldLabel>
                    <div className="relative">
                      <select value={composer.commandKey} onChange={event => setComposer(previous => ({ ...previous, commandKey: event.target.value }))} className={`${fieldClassName} appearance-none pr-8`}>
                        {COMMAND_OPTIONS.map(command => <option key={command.key} value={command.key}>{command.label}</option>)}
                      </select>
                      <IconChevronDown size={16} className="pointer-events-none absolute right-3 top-3 text-foreground-off" />
                    </div>
                  </label>
                </div>

                <label className="block">
                  <FieldLabel>Instructions</FieldLabel>
                  <textarea
                    value={composer.instructions}
                    onChange={event => setComposer(previous => ({ ...previous, instructions: event.target.value }))}
                    placeholder="Review the authentication flow. Run tests. Explain every change."
                    rows={7}
                    className={`${fieldClassName} resize-y leading-6`} />
                </label>

                <div className="flex flex-col gap-4 border-t border-background-focus pt-4 sm:flex-row sm:items-end sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground">Runner limits</p>
                    <p className="mt-1 text-xs leading-5 text-foreground-off">120s timeout · 250 KB output · allowlisted commands only</p>
                  </div>
                  <SmallButton tone="accent" onClick={() => void startRun()} disabled={runState === "starting" || runState === "running" || loading || !selectedAgent}>
                    {runState === "starting" ? <IconLoader2 size={16} className="animate-spin" /> : <IconPlayerPlay size={16} />}
                    {runState === "starting" ? "Starting" : "Start run"}
                  </SmallButton>
                </div>

                {runError ? (
                  <div className="flex items-start gap-3 rounded-xs border border-alert-red bg-alert-red/10 px-3 py-3 text-xs text-foreground">
                    <IconAlertCircle size={16} className="mt-0.5 shrink-0 text-alert-red" />
                    <p className="break-words">{runError}</p>
                  </div>
                ) : null}
              </div>
            </Panel>

            <Panel className="min-w-0">
              <PanelHeading
                icon={<IconSparkles size={19} />}
                label="Skills"
                action={<span className="text-[11px] text-foreground-off">{selectedSkillIds.length} selected</span>} />
              <div className="p-4 sm:p-5">
                {!skillsAvailable ? (
                  <div className="rounded-xs bg-background px-3 py-3 text-xs leading-5 text-foreground-off">
                    <p className="font-medium text-foreground">Skills API unavailable</p>
                    <p className="mt-1">Server does not expose {SKILLS_ENDPOINT}. Runs send selected skill slugs when available.</p>
                    {skillsError ? <p className="mt-2 break-words text-alert-red">{skillsError}</p> : null}
                  </div>
                ) : skills.length === 0 ? (
                  <div className="rounded-xs bg-background px-3 py-6 text-center text-xs text-foreground-off">No skills available.</div>
                ) : (
                  <div className="space-y-2">
                    {skills.map(skill => {
                      const selected = selectedSkillIds.includes(skill.id);
                      return (
                        <button
                          key={skill.id}
                          type="button"
                          onClick={() => toggleSkill(skill.id)}
                          className={`flex w-full items-start gap-3 rounded-xs px-3 py-3 text-left transition-colors ${selected ? "bg-background-focus" : "bg-background hover:bg-background-focus/70"}`}>
                          <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-xs border ${selected ? "border-accent bg-accent text-foreground" : "border-foreground-off/50 text-transparent"}`}>
                            <IconCheck size={12} />
                          </span>
                          <span className="min-w-0">
                            <span className="flex flex-wrap items-center gap-2 text-xs font-medium text-foreground">
                              {skill.name}
                              {skill.version ? <span className="font-mono text-[10px] text-foreground-off">v{skill.version}</span> : null}
                            </span>
                            <span className="mt-1 block text-xs leading-5 text-foreground-off">{skill.description}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </Panel>
          </div>

          <div className="grid min-w-0 gap-5 lg:grid-cols-2">
            <Panel className="min-w-0">
              <PanelHeading icon={<IconRobot size={19} />} label="Agents" action={<span className="text-[11px] text-foreground-off">{agents.length} total</span>} />
              <div className="p-4 sm:p-5">
                <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                  <input value={agentForm.name} onChange={event => setAgentForm(previous => ({ ...previous, name: event.target.value }))} placeholder="Agent name" className={fieldClassName} />
                  <input value={agentForm.defaultModel} onChange={event => setAgentForm(previous => ({ ...previous, defaultModel: event.target.value }))} placeholder="Default model" className={fieldClassName} />
                  <SmallButton tone="accent" onClick={() => void saveAgent()} disabled={savingAgent}>
                    {savingAgent ? <IconLoader2 size={15} className="animate-spin" /> : <IconPlus size={15} />}
                    {agentForm.id ? "Update" : "Add"}
                  </SmallButton>
                </div>

                {agentForm.id ? (
                  <div className="mb-4 flex items-center justify-between rounded-xs bg-background px-3 py-2 text-xs text-foreground-off">
                    Editing agent
                    <button type="button" onClick={resetAgentForm} className="text-foreground hover:text-accent">Cancel</button>
                  </div>
                ) : null}

                <div className="space-y-2">
                  {loading ? <p className="py-5 text-center text-xs text-foreground-off">Loading agents…</p> : null}
                  {!loading && agents.length === 0 ? <p className="rounded-xs bg-background px-3 py-5 text-center text-xs text-foreground-off">No agents yet. Create one to start a run.</p> : null}
                  {agents.map(agent => (
                    <div key={agent.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xs bg-background px-3 py-3">
                      <button type="button" className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => setComposer(previous => ({ ...previous, agentId: agent.id, model: agent.defaultModel }))}>
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xs bg-background-focus text-foreground-off"><IconRobot size={17} /></span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm text-foreground">{agent.name}</span>
                          <span className="mt-1 block truncate font-mono text-[10px] text-foreground-off">{agent.defaultModel}</span>
                        </span>
                      </button>
                      <div className="flex items-center gap-1">
                        <StatusIndicator status={agent.status} />
                        <SmallButton onClick={() => setAgentForEdit(agent)} aria-label={`Edit ${agent.name}`}><IconPencil size={15} /></SmallButton>
                        <SmallButton tone="danger" onClick={() => void deleteAgent(agent)} disabled={deletingId === agent.id} aria-label={`Delete ${agent.name}`}><IconTrash size={15} /></SmallButton>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>

            <Panel className="min-w-0">
              <PanelHeading icon={<IconFolder size={19} />} label="Projects & repositories" action={<span className="text-[11px] text-foreground-off">{projects.length} connected</span>} />
              <div className="p-4 sm:p-5">
                <div className="mb-4 grid gap-3 sm:grid-cols-2">
                  <input value={projectForm.name} onChange={event => setProjectForm(previous => ({ ...previous, name: event.target.value }))} placeholder="Project name" className={fieldClassName} />
                  <input value={projectForm.repositoryUrl} onChange={event => setProjectForm(previous => ({ ...previous, repositoryUrl: event.target.value }))} placeholder="Repository URL" className={fieldClassName} />
                  <input value={projectForm.defaultBranch} onChange={event => setProjectForm(previous => ({ ...previous, defaultBranch: event.target.value }))} placeholder="Default branch" className={fieldClassName} />
                  <input value={projectForm.description} onChange={event => setProjectForm(previous => ({ ...previous, description: event.target.value }))} placeholder="Description" className={`${fieldClassName} sm:col-span-2`} />
                  <div className="flex items-center gap-2 sm:col-span-2">
                    <SmallButton tone="accent" onClick={() => void saveProject()} disabled={savingProject}>
                      {savingProject ? <IconLoader2 size={15} className="animate-spin" /> : <IconPlus size={15} />}
                      {projectForm.id ? "Update project" : "Add project"}
                    </SmallButton>
                    {projectForm.id ? <SmallButton onClick={resetProjectForm}>Cancel</SmallButton> : null}
                  </div>
                </div>

                <div className="space-y-2">
                  {!loading && projects.length === 0 ? <p className="rounded-xs bg-background px-3 py-5 text-center text-xs text-foreground-off">No repositories connected.</p> : null}
                  {projects.map(project => (
                    <div key={project.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xs bg-background px-3 py-3">
                      <button type="button" className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => setComposer(previous => ({ ...previous, projectId: project.id }))}>
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xs bg-background-focus text-foreground-off"><IconGitBranch size={17} /></span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm text-foreground">{project.name}</span>
                        <span className="mt-1 block truncate text-[10px] text-foreground-off">{repositories.find(repository => repository.projectId === project.id)?.repositoryUrl ?? "No repository URL"}</span>
                        </span>
                      </button>
                      <div className="flex items-center gap-1">
                        <StatusIndicator status={project.status} />
                        {repositories.some(repository => repository.projectId === project.id) ? <SmallButton onClick={() => void disconnectRepository(project)} aria-label={`Disconnect repository from ${project.name}`}><IconGitBranch size={15} /></SmallButton> : null}
                        <SmallButton onClick={() => setProjectForEdit(project)} aria-label={`Edit ${project.name}`}><IconPencil size={15} /></SmallButton>
                        <SmallButton tone="danger" onClick={() => void deleteProject(project)} disabled={deletingId === project.id} aria-label={`Delete ${project.name}`}><IconTrash size={15} /></SmallButton>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>
          </div>

          <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(300px,0.72fr)_minmax(0,1.28fr)]">
            <Panel className="min-w-0">
              <PanelHeading icon={<IconTerminal2 size={19} />} label="Sessions" action={<span className="text-[11px] text-foreground-off">{sessions.length} total</span>} />
              <div className="space-y-2 p-4 sm:p-5">
                {loading ? <p className="py-5 text-center text-xs text-foreground-off">Loading sessions…</p> : null}
                {!loading && sessions.length === 0 ? <p className="rounded-xs bg-background px-3 py-5 text-center text-xs text-foreground-off">No sessions yet.</p> : null}
                {sessions.map(session => {
                  const agent = agents.find(item => item.id === session.agentId);
                  const project = projects.find(item => item.id === session.projectId);
                  const selected = selectedSessionId === session.id;
                  return (
                    <div
                      key={session.id}
                      className={`flex items-start gap-2 rounded-xs px-3 py-3 transition-colors ${selected ? "bg-background-focus" : "bg-background hover:bg-background-focus/70"}`}>
                      <button
                        type="button"
                        onClick={() => selectSession(session)}
                        className="min-w-0 flex-1 text-left">
                        <div className="flex items-start justify-between gap-3">
                          <span className="flex min-w-0 items-start gap-3">
                            <IconTerminal2 size={17} className="mt-0.5 shrink-0 text-foreground-off" />
                            <span className="min-w-0">
                              <span className="block line-clamp-2 text-xs leading-5 text-foreground">{session.description}</span>
                              <span className="mt-1 block truncate text-[10px] text-foreground-off">{agent?.name ?? "Unknown agent"}{project ? ` · ${project.name}` : ""}</span>
                            </span>
                          </span>
                          <StatusIndicator status={session.status} />
                        </div>
                        <span className="mt-2 block pl-7 text-[10px] text-foreground-off">{formatDate(session.startedAt)}</span>
                      </button>
                      <SmallButton
                        tone="danger"
                        onClick={() => void deleteSession(session)}
                        aria-label={`Delete ${session.description}`}>
                        <IconTrash size={15} />
                      </SmallButton>
                    </div>
                  );
                })}
              </div>
            </Panel>

            <Panel className="min-w-0">
              <PanelHeading
                icon={<IconSparkles size={19} />}
                label="Activity"
                action={runState === "running" ? <SmallButton tone="danger" onClick={() => void cancelRun()}><IconPlayerStop size={15} />Cancel</SmallButton> : null} />
              <div className="p-4 sm:p-5">
                {!selectedSession && !activeRun ? (
                  <div className="flex min-h-48 flex-col items-center justify-center rounded-xs bg-background px-5 text-center">
                    <IconTerminal2 size={22} className="text-foreground-off" />
                    <p className="mt-3 text-sm text-foreground">No session selected</p>
                    <p className="mt-1 max-w-sm text-xs leading-5 text-foreground-off">Start a run or select a previous session to inspect server events, files, and diff.</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xs bg-background px-3 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm text-foreground">{selectedSession?.description ?? "Current run"}</p>
                        <p className="mt-1 font-mono text-[10px] text-foreground-off">{activeRun?.id ?? selectedSession?.id}</p>
                      </div>
                      <StatusIndicator status={activeRun?.status ?? runState.toUpperCase()} />
                    </div>

                    {activeRun?.error || runError ? (
                      <div className="flex items-start gap-3 rounded-xs border border-alert-red bg-alert-red/10 px-3 py-3 text-xs text-foreground">
                        <IconAlertCircle size={16} className="mt-0.5 shrink-0 text-alert-red" />
                        <p className="break-words">{activeRun?.error ?? runError}</p>
                      </div>
                    ) : null}

                    <div>
                      <p className="mb-2 text-[11px] uppercase tracking-[0.12em] text-foreground-off">Events</p>
                      {activeRun?.events.length ? (
                        <div className="space-y-2">
                          {activeRun.events.map(event => (
                            <div key={event.id} className="flex gap-3 rounded-xs bg-background px-3 py-3 text-xs">
                              <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${event.level === "error" ? "bg-alert-red" : event.level === "success" ? "bg-status-green" : event.level === "warning" ? "bg-warning" : "bg-accent"}`} />
                              <div className="min-w-0">
                                <p className="break-words leading-5 text-foreground">{event.message}</p>
                                <p className="mt-1 font-mono text-[10px] text-foreground-off">{event.type}{event.createdAt ? ` · ${formatDate(event.createdAt)}` : ""}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="rounded-xs bg-background px-3 py-4 text-xs text-foreground-off">No events returned by server.</p>
                      )}
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      <div>
                        <p className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-foreground-off"><IconFileCode size={14} /> Files</p>
                        {activeRun?.files.length ? <div className="space-y-1">{activeRun.files.map(file => <p key={file} className="truncate rounded-xs bg-background px-3 py-2 font-mono text-[10px] text-foreground-off">{file}</p>)}</div> : <p className="rounded-xs bg-background px-3 py-4 text-xs text-foreground-off">No files returned.</p>}
                      </div>
                      <div>
                        <p className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-foreground-off"><IconCode size={14} /> Diff</p>
                        {activeRun?.diff ? <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-xs bg-background p-3 font-mono text-[10px] leading-5 text-foreground-off">{activeRun.diff}</pre> : <p className="rounded-xs bg-background px-3 py-4 text-xs text-foreground-off">No diff returned.</p>}
                      </div>
                    </div>

                    {activeRun?.result ? <div className="rounded-xs bg-background px-3 py-3 text-xs leading-5 text-foreground-off">{activeRun.result}</div> : null}
                  </div>
                )}
              </div>
            </Panel>
          </div>

          <p className="flex items-start gap-2 text-[11px] leading-5 text-foreground-off">
            <IconAlertCircle size={14} className="mt-0.5 shrink-0" />
            Repository credentials and provider keys stay server-side. This page never sends secrets in prompts or logs.
          </p>
        </div>
      </main>
    </DashLayout>
  );
}
