export type AgentStatus = "ACTIVE" | "INACTIVE";
export type ProjectStatus = "ACTIVE" | "AT_RISK" | "COMPLETED";
export type SessionStatus = "ACTIVE" | "COMPLETED" | "FAILED" | "CANCELLED";
export type RunState = "idle" | "starting" | "running" | "completed" | "failed" | "cancelled" | "unavailable";

export type Agent = {
  id: string;
  name: string;
  defaultModel: string;
  status: AgentStatus;
  createdAt?: string;
  updatedAt?: string;
};

export type Project = {
  id: string;
  name: string;
  description: string | null;
  externalUrl: string | null;
  status: ProjectStatus;
  createdAt?: string;
  updatedAt?: string;
};

export type Repository = {
  id: string;
  projectId: string | null;
  provider: string;
  repositoryUrl: string;
  defaultBranch: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
};

export type AgentSession = {
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

export type Skill = {
  id: string;
  name: string;
  description: string;
  version?: string | null;
  enabled?: boolean;
};

export type RunEvent = {
  id: string;
  type: string;
  message: string;
  createdAt?: string;
  level?: "info" | "success" | "warning" | "error";
};

export type RunSnapshot = {
  id: string;
  sessionId?: string | null;
  status?: string;
  error?: string | null;
  result?: string | null;
  events: RunEvent[];
  files: string[];
  diff: string | null;
};

export type ApiResult = {
  response: Response;
  payload: unknown;
};

export const MODEL_OPTIONS = [
  "openai/gpt-5",
  "anthropic/claude-sonnet-4",
  "openrouter/auto",
];

export const COMMAND_OPTIONS = [
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

export const RUN_ENDPOINT = "/api/agent-runs";
export const SKILLS_ENDPOINT = "/api/skills";
