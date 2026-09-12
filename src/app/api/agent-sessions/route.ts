import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { badRequest, enumString, notFound, optionalString, ownedAgent, ownedProject, parseBody, requiredString } from "@/lib/workspace-api";
import { serializeAgentSession } from "@/lib/workspace";
import prisma from "@/lib/prisma";

const STATUSES = ["ACTIVE", "COMPLETED", "FAILED", "CANCELLED"] as const;

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const sessions = await prisma.agentSession.findMany({ where: { userId: user.id }, orderBy: { startedAt: "desc" } });
  return NextResponse.json({ agentSessions: sessions.map(serializeAgentSession) });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const body = await parseBody(request);
  if (!body) return badRequest("Invalid JSON body.");
  const agentId = requiredString(body.agentId, "agentId");
  if (agentId.error) return agentId.error;
  if (!(await ownedAgent(user.id, agentId.value))) return notFound("Agent not found.");
  const description = requiredString(body.description, "description");
  if (description.error) return description.error;
  const model = requiredString(body.model, "model");
  if (model.error) return model.error;
  let projectId: string | null = null;
  if (body.projectId !== undefined) {
    const parsedProjectId = optionalString(body.projectId, "projectId");
    if (parsedProjectId.error) return parsedProjectId.error;
    projectId = parsedProjectId.value;
  }
  if (projectId && !(await ownedProject(user.id, projectId))) return notFound("Project not found.");
  const status = enumString(body.status, STATUSES, "status", "ACTIVE");
  if (status.error) return status.error;
  const startedAt = body.startedAt === undefined ? new Date() : new Date(String(body.startedAt));
  if (Number.isNaN(startedAt.getTime())) return badRequest("startedAt must be a valid date.");
  const session = await prisma.agentSession.create({ data: { userId: user.id, agentId: agentId.value, projectId, description: description.value, model: model.value, status: status.value, startedAt, endedAt: status.value === "ACTIVE" ? null : new Date() } });
  return NextResponse.json({ agentSession: serializeAgentSession(session) }, { status: 201 });
}
