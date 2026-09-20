export const AGENT_RUN_STATUSES = [
  "QUEUED",
  "RUNNING",
  "SUCCEEDED",
  "FAILED",
  "CANCELLED",
  "BLOCKED",
] as const;

export type AgentRunStatus = (typeof AGENT_RUN_STATUSES)[number];

export const AGENT_RUN_EVENT_TYPES = [
  "SYSTEM",
  "COMMAND",
  "OUTPUT",
  "ERROR",
  "RESULT",
] as const;

export type AgentRunEventType = (typeof AGENT_RUN_EVENT_TYPES)[number];

export const WORKSPACE_REPOSITORY_PROVIDERS = [
  "GITHUB",
  "GITLAB",
  "BITBUCKET",
  "OTHER",
] as const;

export type WorkspaceRepositoryProvider =
  (typeof WORKSPACE_REPOSITORY_PROVIDERS)[number];

export const WORKSPACE_REPOSITORY_STATUSES = [
  "CONNECTED",
  "UNAVAILABLE",
] as const;

export type WorkspaceRepositoryStatus =
  (typeof WORKSPACE_REPOSITORY_STATUSES)[number];

export type WorkspaceRepository = {
  id: string;
  projectId: string | null;
  provider: WorkspaceRepositoryProvider;
  repositoryUrl: string;
  defaultBranch: string;
  status: WorkspaceRepositoryStatus;
  createdAt: string;
  updatedAt: string;
};

export type WorkspaceSkill = {
  slug: string;
  version: string;
  name: string;
  description: string;
  instruction: string;
};

export type AgentSkillSelection = {
  slug: string;
  version: string;
};

export type AgentRunEvent = {
  id: string;
  runId: string;
  sequence: number;
  type: AgentRunEventType;
  message: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type AgentRun = {
  id: string;
  agentSessionId: string;
  repositoryId: string;
  status: AgentRunStatus;
  model: string;
  commandKey: string;
  instructionsDigest: string;
  skills: AgentSkillSelection[];
  workspaceKey: string;
  errorCode: string | null;
  resultSummary: string | null;
  cancelRequestedAt: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  events?: AgentRunEvent[];
};
