import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { badRequest, enumString, notFound, optionalString, ownedProject, parseBody, requiredString } from "@/lib/workspace-api";
import { serializeIssue } from "@/lib/workspace";
import prisma from "@/lib/prisma";

const SEVERITIES = ["IMPORTANT", "MEDIUM", "LOW"] as const;
const STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED"] as const;
type Context = { params: Promise<{ id: string }> };

async function findIssue(userId: string, id: string) {
  return prisma.issue.findFirst({ where: { id, userId } });
}

export async function GET(_request: Request, context: Context) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const issue = await findIssue(user.id, id);
  if (!issue) return notFound("Issue not found.");
  return NextResponse.json({ issue: serializeIssue(issue) });
}

export async function PATCH(request: Request, context: Context) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const existing = await findIssue(user.id, id);
  if (!existing) return notFound("Issue not found.");
  const body = await parseBody(request);
  if (!body) return badRequest("Invalid JSON body.");
  const data: { title?: string; description?: string | null; projectId?: string | null; severity?: typeof SEVERITIES[number]; status?: typeof STATUSES[number]; resolvedAt?: Date | null } = {};
  if (body.title !== undefined) {
    const title = requiredString(body.title, "title");
    if (title.error) return title.error;
    data.title = title.value;
  }
  if (body.description !== undefined) {
    const description = optionalString(body.description, "description");
    if (description.error) return description.error;
    data.description = description.value;
  }
  if (body.projectId !== undefined) {
    const projectId = optionalString(body.projectId, "projectId");
    if (projectId.error) return projectId.error;
    if (projectId.value && !(await ownedProject(user.id, projectId.value))) return notFound("Project not found.");
    data.projectId = projectId.value;
  }
  if (body.severity !== undefined) {
    const severity = enumString(body.severity, SEVERITIES, "severity");
    if (severity.error) return severity.error;
    data.severity = severity.value;
  }
  if (body.status !== undefined) {
    const status = enumString(body.status, STATUSES, "status");
    if (status.error) return status.error;
    data.status = status.value;
    data.resolvedAt = status.value === "RESOLVED" ? new Date() : null;
  }
  const issue = await prisma.issue.update({ where: { id }, data });
  return NextResponse.json({ issue: serializeIssue(issue) });
}

export async function DELETE(_request: Request, context: Context) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  if (!(await findIssue(user.id, id))) return notFound("Issue not found.");
  await prisma.issue.delete({ where: { id } });
  return NextResponse.json({ message: "Issue deleted." });
}
