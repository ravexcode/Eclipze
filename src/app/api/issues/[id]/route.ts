import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { badRequest, enumString, notFound, optionalString, parseBody, requiredString } from "@/lib/workspace-api";
import { serializeIssue } from "@/lib/workspace";
import prisma from "@/lib/prisma";

const TYPES = ["BUG", "FEATURE", "SUPPORT"] as const;
const PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;
const STATUSES = ["OPEN", "IN_PROGRESS", "WAITING_FOR_USER", "RESOLVED", "CLOSED"] as const;
type Context = { params: Promise<{ id: string }> };

async function findIssue(userId: string, role: string, id: string) {
  return prisma.issue.findFirst({ where: { id, ...(role === "DEVELOPER" ? {} : { userId }) }, include: { user: { select: { id: true, username: true, email: true } }, messages: { orderBy: { createdAt: "asc" }, include: { author: { select: { id: true, username: true, email: true, role: true } } } } } });
}

export async function GET(_request: Request, context: Context) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const issue = await findIssue(user.id, user.role, (await context.params).id);
  if (!issue) return notFound("Issue not found.");
  return NextResponse.json({ issue: { ...serializeIssue(issue), requester: issue.user, messages: issue.messages.map(message => ({ ...message, createdAt: message.createdAt.toISOString(), updatedAt: message.updatedAt.toISOString() })) } }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function PATCH(request: Request, context: Context) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const issue = await findIssue(user.id, user.role, (await context.params).id);
  if (!issue) return notFound("Issue not found.");
  const body = await parseBody(request);
  if (!body) return badRequest("Invalid JSON body.");
  const data: Record<string, unknown> = {};
  if (body.title !== undefined) { const title = requiredString(body.title, "title"); if (title.error) return title.error; data.title = title.value; }
  if (body.description !== undefined) { const description = optionalString(body.description, "description"); if (description.error) return description.error; data.description = description.value; }
  if (body.type !== undefined) { const type = enumString(body.type, TYPES, "type"); if (type.error) return type.error; data.type = type.value; }
  if (user.role === "DEVELOPER") {
    if (body.priority !== undefined) { const priority = enumString(body.priority, PRIORITIES, "priority"); if (priority.error) return priority.error; data.priority = priority.value; }
    if (body.status !== undefined) { const status = enumString(body.status, STATUSES, "status"); if (status.error) return status.error; data.status = status.value; data.resolvedAt = status.value === "RESOLVED" ? new Date() : null; data.closedAt = status.value === "CLOSED" ? new Date() : null; }
  } else if (body.priority !== undefined || body.status !== undefined) return NextResponse.json({ message: "Only Developers can change issue priority or status." }, { status: 403 });
  if (!Object.keys(data).length) return badRequest("No issue changes provided.");
  data.lastActivityAt = new Date();
  const updated = await prisma.issue.update({ where: { id: issue.id }, data });
  const notifications = [] as Array<{ userId: string; issueId: string; type: "ISSUE_STATUS_CHANGED" | "ISSUE_PRIORITY_CHANGED" }>;
  if (user.role === "DEVELOPER" && data.status !== undefined) notifications.push({ userId: issue.userId, issueId: issue.id, type: "ISSUE_STATUS_CHANGED" });
  if (user.role === "DEVELOPER" && data.priority !== undefined) notifications.push({ userId: issue.userId, issueId: issue.id, type: "ISSUE_PRIORITY_CHANGED" });
  if (notifications.length) await prisma.notification.createMany({ data: notifications });
  return NextResponse.json({ issue: serializeIssue(updated) });
}
