import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { badRequest, enumString, parseBody, requiredString } from "@/lib/workspace-api";
import { serializeAgent } from "@/lib/workspace";
import prisma from "@/lib/prisma";

const STATUSES = ["ACTIVE", "INACTIVE"] as const;

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const agents = await prisma.agent.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" } });
  return NextResponse.json({ agents: agents.map(serializeAgent) });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return badRequest("Invalid JSON body.");
  const name = requiredString(body.name, "name");
  if (name.error) return name.error;
  const defaultModel = requiredString(body.defaultModel, "defaultModel");
  if (defaultModel.error) return defaultModel.error;
  const status = enumString(body.status, STATUSES, "status", "ACTIVE");
  if (status.error) return status.error;
  const agent = await prisma.agent.create({ data: { userId: user.id, name: name.value, defaultModel: defaultModel.value, status: status.value } });
  return NextResponse.json({ agent: serializeAgent(agent) }, { status: 201 });
}
