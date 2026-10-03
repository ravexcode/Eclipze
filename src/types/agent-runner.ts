export const AGENT_RUN_STATUSES = [
  "QUEUED",
  "RUNNING",
  "WAITING_FOR_APPROVAL",
  "SUCCEEDED",
  "FAILED",
  "CANCELLED",
  "BLOCKED",
] as const;

export type AgentRunStatus = (typeof AGENT_RUN_STATUSES)[number];

export const AGENT_PERMISSION_MODES = [
  "ASK",
  "PLAN",
  "USER_APPROVE",
  "AUTO_APPROVE",
] as const;

export type AgentPermissionMode = (typeof AGENT_PERMISSION_MODES)[number];

export const AGENT_RUN_EVENT_TYPES = [
  "SYSTEM",
  "COMMAND",
  "OUTPUT",
  "ERROR",
  "RESULT",
  "APPROVAL",
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

export type LibrarySkill = {
  id: string;
  sourceId: string | null;
  source: string;
  slug: string;
  name: string;
  description: string;
  content: string;
  version: string;
  createdAt: string;
  updatedAt: string;
};

export type SkillSearchResult = {
  id: string;
  name: string;
  source: string;
  slug: string;
  installs: number;
  description: string;
  url: string | null;
  isDuplicate: boolean;
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
  agentSessionId: string | null;
  repositoryId: string;
  status: AgentRunStatus;
  model: string;
  permissionMode: AgentPermissionMode;
  creditReservation: number;
  prompt: string | null;
  commandKey: string;
  instructionsDigest: string;
  skills: AgentSkillSelection[];
  workspaceKey: string;
  errorCode: string | null;
  resultSummary: string | null;
  changePatch: string | null;
  cancelRequestedAt: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  events?: AgentRunEvent[];
};
