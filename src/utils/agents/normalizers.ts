import { apiFetch } from "@/utils/api-fetch";
import {
  type Agent,
  type AgentSession,
  type ApiResult,
  type Project,
  type Repository,
  type RunEvent,
  type RunSnapshot,
  type Skill,
  MODEL_OPTIONS,
} from "@/constants/agents";

export function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
}

export function readString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

export function readNullableString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

export function readCollection(payload: unknown, key: string) {
  const value = asRecord(payload)[key];
  return Array.isArray(value) ? value : [];
}

export function readMessage(payload: unknown, fallback: string) {
  const message = asRecord(payload).message;
  return typeof message === "string" && message.trim() ? message : fallback;
}

export function normalizeAgent(value: unknown): Agent | null {
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

export function normalizeProject(value: unknown): Project | null {
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

export function normalizeRepository(value: unknown): Repository | null {
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

export function normalizeSession(value: unknown): AgentSession | null {
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

export function normalizeSkill(value: unknown): Skill | null {
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

export function normalizeEvent(value: unknown, index: number): RunEvent | null {
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

export function normalizeRun(value: unknown): RunSnapshot | null {
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

export async function requestJson(input: RequestInfo | URL, init: RequestInit = {}): Promise<ApiResult> {
  const response = await apiFetch(input, init);
  const payload = await response.json().catch(() => null);
  return { response, payload };
}

export function jsonInit(method: string, body: Record<string, unknown>): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  };
}

export function formatDate(value: string) {
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

