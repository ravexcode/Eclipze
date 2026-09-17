import type {
  DashboardMetrics,
  WorkspaceAgent,
  WorkspaceAgentSession,
  WorkspaceIssue,
  WorkspaceProject,
  WorkspaceSnapshot,
} from "@/types/user";
import { serializeUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

function iso(value: Date | null) {
  return value?.toISOString() ?? null;
}

type WorkspaceUser = {
  id: string;
  email: string;
  username: string | null;
  avatarUrl: string | null;
  role: "USER" | "DEVELOPER";
  emailVerifiedAt: Date | null;
  createdAt: Date;
};

export function serializeProject(project: {
  id: string;
  name: string;
  description: string | null;
  externalUrl: string | null;
  status: WorkspaceProject["status"];
  createdAt: Date;
  updatedAt: Date;
}): WorkspaceProject {
  return { ...project, createdAt: project.createdAt.toISOString(), updatedAt: project.updatedAt.toISOString() };
}

export function serializeIssue(issue: {
  id: string;
  projectId: string | null;
  title: string;
  description: string | null;
  type: WorkspaceIssue["type"];
  priority: WorkspaceIssue["priority"];
  status: WorkspaceIssue["status"];
  resolvedAt: Date | null;
  closedAt: Date | null;
  lastActivityAt: Date;
  createdAt: Date;
  updatedAt: Date;
}): WorkspaceIssue {
  return {
    ...issue,
    resolvedAt: iso(issue.resolvedAt),
    closedAt: iso(issue.closedAt),
    lastActivityAt: issue.lastActivityAt.toISOString(),
    createdAt: issue.createdAt.toISOString(),
    updatedAt: issue.updatedAt.toISOString(),
  };
}

export function serializeAgent(agent: {
  id: string;
  name: string;
  defaultModel: string;
  status: WorkspaceAgent["status"];
  createdAt: Date;
  updatedAt: Date;
}): WorkspaceAgent {
  return { ...agent, createdAt: agent.createdAt.toISOString(), updatedAt: agent.updatedAt.toISOString() };
}

export function serializeAgentSession(session: {
  id: string;
  agentId: string;
  projectId: string | null;
  description: string;
  model: string;
  status: WorkspaceAgentSession["status"];
  startedAt: Date;
  endedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): WorkspaceAgentSession {
  return {
    ...session,
    startedAt: session.startedAt.toISOString(),
    endedAt: iso(session.endedAt),
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
  };
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getLastSevenDates() {
  const dates: string[] = [];
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  for (let index = 6; index >= 0; index -= 1) {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() - index);
    dates.push(dateKey(date));
  }

  return dates;
}

export function buildDashboardMetrics(input: {
  issues: Array<{ priority: WorkspaceIssue["priority"]; status: WorkspaceIssue["status"]; createdAt: Date }>;
  projectsTotal: number;
  activeSessionsTotal: number;
}): DashboardMetrics {
  const issuesByPriority: DashboardMetrics["issuesByPriority"] = { HIGH: 0, MEDIUM: 0, LOW: 0 };
  const openIssues = input.issues.filter(issue => issue.status !== "RESOLVED" && issue.status !== "CLOSED");

  for (const issue of openIssues) {
    issuesByPriority[issue.priority] += 1;
  }

  const countByDay = new Map(getLastSevenDates().map(date => [date, 0]));

  for (const issue of input.issues) {
    const date = dateKey(issue.createdAt);
    if (countByDay.has(date)) countByDay.set(date, (countByDay.get(date) ?? 0) + 1);
  }

  return {
    issuesTotal: openIssues.length,
    issuesByPriority,
    issuesByDay: [...countByDay].map(([date, count]) => ({ date, count })),
    projectsTotal: input.projectsTotal,
    activeSessionsTotal: input.activeSessionsTotal,
  };
}

export async function getWorkspaceSnapshot(user: WorkspaceUser): Promise<WorkspaceSnapshot> {
  const userId = user.id;
  const [projects, issues, agents, agentSessions] = await Promise.all([
    prisma.project.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: { id: true, name: true, description: true, externalUrl: true, status: true, createdAt: true, updatedAt: true },
    }),
    prisma.issue.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { id: true, projectId: true, title: true, description: true, type: true, priority: true, status: true, resolvedAt: true, closedAt: true, lastActivityAt: true, createdAt: true, updatedAt: true },
    }),
    prisma.agent.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: { id: true, name: true, defaultModel: true, status: true, createdAt: true, updatedAt: true },
    }),
    prisma.agentSession.findMany({
      where: { userId },
      orderBy: { startedAt: "desc" },
      select: { id: true, agentId: true, projectId: true, description: true, model: true, status: true, startedAt: true, endedAt: true, createdAt: true, updatedAt: true },
    }),
  ]);

  return {
    user: serializeUser(user),
    projects: projects.map(serializeProject),
    issues: issues.map(serializeIssue),
    agents: agents.map(serializeAgent),
    agentSessions: agentSessions.map(serializeAgentSession),
    metrics: buildDashboardMetrics({ issues, projectsTotal: projects.length, activeSessionsTotal: agentSessions.filter(session => session.status === "ACTIVE").length }),
  };
}
