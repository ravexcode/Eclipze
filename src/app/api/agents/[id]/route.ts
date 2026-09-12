import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { badRequest, enumString, notFound, parseBody, requiredString } from "@/lib/workspace-api";
import { serializeAgent } from "@/lib/workspace";
import prisma from "@/lib/prisma";

const STATUSES = ["ACTIVE", "INACTIVE"] as const;
type Context = { params: Promise<{ id: string }> };

async function findAgent(userId: string, id: string) {
  return prisma.agent.findFirst({ where: { id, userId } });
}

export async function GET(_request: Request, context: Context) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const agent = await findAgent(user.id, id);
  if (!agent) return notFound("Agent not found.");
  return NextResponse.json({ agent: serializeAgent(agent) });
}

export async function PATCH(request: Request, context: Context) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  if (!(await findAgent(user.id, id))) return notFound("Agent not found.");
  const body = await parseBody(request);
  if (!body) return badRequest("Invalid JSON body.");
  const data: { name?: string; defaultModel?: string; status?: typeof STATUSES[number] } = {};
  if (body.name !== undefined) {
    const name = requiredString(body.name, "name");
    if (name.error) return name.error;
    data.name = name.value;
  }
  if (body.defaultModel !== undefined) {
    const defaultModel = requiredString(body.defaultModel, "defaultModel");
    if (defaultModel.error) return defaultModel.error;
    data.defaultModel = defaultModel.value;
  }
  if (body.status !== undefined) {
    const status = enumString(body.status, STATUSES, "status");
    if (status.error) return status.error;
    data.status = status.value;
  }
  const agent = await prisma.agent.update({ where: { id }, data });
  return NextResponse.json({ agent: serializeAgent(agent) });
}

export async function DELETE(_request: Request, context: Context) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  if (!(await findAgent(user.id, id))) return notFound("Agent not found.");
  await prisma.agent.delete({ where: { id } });
  return NextResponse.json({ message: "Agent deleted." });
}
