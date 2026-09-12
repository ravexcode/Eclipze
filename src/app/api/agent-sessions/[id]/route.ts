import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { badRequest, enumString, notFound, optionalString, ownedAgent, ownedProject, parseBody, requiredString } from "@/lib/workspace-api";
import { serializeAgentSession } from "@/lib/workspace";
import prisma from "@/lib/prisma";

const STATUSES = ["ACTIVE", "COMPLETED", "FAILED", "CANCELLED"] as const;
type Context = { params: Promise<{ id: string }> };

async function findSession(userId: string, id: string) {
  return prisma.agentSession.findFirst({ where: { id, userId } });
}

export async function GET(_request: Request, context: Context) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const session = await findSession(user.id, id);
  if (!session) return notFound("Agent session not found.");
  return NextResponse.json({ agentSession: serializeAgentSession(session) });
}

export async function PATCH(request: Request, context: Context) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  if (!(await findSession(user.id, id))) return notFound("Agent session not found.");
  const body = await parseBody(request);
  if (!body) return badRequest("Invalid JSON body.");
  const data: { agentId?: string; projectId?: string | null; description?: string; model?: string; status?: typeof STATUSES[number]; startedAt?: Date; endedAt?: Date | null } = {};
  if (body.agentId !== undefined) {
    const value = requiredString(body.agentId, "agentId");
    if (value.error) return value.error;
    if (!(await ownedAgent(user.id, value.value))) return notFound("Agent not found.");
    data.agentId = value.value;
  }
  if (body.projectId !== undefined) {
    const value = optionalString(body.projectId, "projectId");
    if (value.error) return value.error;
    if (value.value && !(await ownedProject(user.id, value.value))) return notFound("Project not found.");
    data.projectId = value.value;
  }
  if (body.description !== undefined) {
    const value = requiredString(body.description, "description");
    if (value.error) return value.error;
    data.description = value.value;
  }
  if (body.model !== undefined) {
    const value = requiredString(body.model, "model");
    if (value.error) return value.error;
    data.model = value.value;
  }
  if (body.startedAt !== undefined) {
    const value = new Date(String(body.startedAt));
    if (Number.isNaN(value.getTime())) return badRequest("startedAt must be a valid date.");
    data.startedAt = value;
  }
  if (body.status !== undefined) {
    const value = enumString(body.status, STATUSES, "status");
    if (value.error) return value.error;
    data.status = value.value;
    data.endedAt = value.value === "ACTIVE" ? null : new Date();
  }
  const session = await prisma.agentSession.update({ where: { id }, data });
  return NextResponse.json({ agentSession: serializeAgentSession(session) });
}

export async function DELETE(_request: Request, context: Context) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  if (!(await findSession(user.id, id))) return notFound("Agent session not found.");
  await prisma.agentSession.delete({ where: { id } });
  return NextResponse.json({ message: "Agent session deleted." });
}
