import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { badRequest, enumString, notFound, optionalString, parseBody, requiredString } from "@/lib/workspace-api";
import { serializeProject } from "@/lib/workspace";
import prisma from "@/lib/prisma";

const PROJECT_STATUSES = ["ACTIVE", "AT_RISK", "COMPLETED"] as const;

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const project = await prisma.project.findFirst({ where: { id, userId: user.id } });
  if (!project) return notFound("Project not found.");
  return NextResponse.json({ project: serializeProject(project) });
}

export async function PATCH(request: Request, context: Context) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const existing = await prisma.project.findFirst({ where: { id, userId: user.id } });
  if (!existing) return notFound("Project not found.");
  const body = await parseBody(request);
  if (!body) return badRequest("Invalid JSON body.");

  const data: { name?: string; description?: string | null; externalUrl?: string | null; status?: typeof PROJECT_STATUSES[number] } = {};
  if (body.name !== undefined) {
    const name = requiredString(body.name, "name");
    if (name.error) return name.error;
    data.name = name.value;
  }
  if (body.description !== undefined) {
    const description = optionalString(body.description, "description");
    if (description.error) return description.error;
    data.description = description.value;
  }
  if (body.externalUrl !== undefined) {
    const externalUrl = optionalString(body.externalUrl, "externalUrl");
    if (externalUrl.error) return externalUrl.error;
    data.externalUrl = externalUrl.value;
  }
  if (body.status !== undefined) {
    const status = enumString(body.status, PROJECT_STATUSES, "status");
    if (status.error) return status.error;
    data.status = status.value;
  }

  const project = await prisma.project.update({ where: { id }, data });
  return NextResponse.json({ project: serializeProject(project) });
}

export async function DELETE(_request: Request, context: Context) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const existing = await prisma.project.findFirst({ where: { id, userId: user.id }, select: { id: true } });
  if (!existing) return notFound("Project not found.");
  await prisma.project.delete({ where: { id } });
  return NextResponse.json({ message: "Project deleted." });
}
