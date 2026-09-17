import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { badRequest, enumString, notFound, optionalString, ownedProject, parseBody, requiredString } from "@/lib/workspace-api";
import { serializeIssue } from "@/lib/workspace";
import prisma from "@/lib/prisma";

const TYPES = ["BUG", "FEATURE", "SUPPORT"] as const;
const PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const issues = await prisma.issue.findMany({
    where: user.role === "DEVELOPER" ? {} : { userId: user.id },
    orderBy: { lastActivityAt: "desc" },
    include: { user: { select: { id: true, username: true, email: true } } },
  });

  return NextResponse.json({ requests: issues.map(issue => ({ ...serializeIssue(issue), requester: issue.user })) });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const body = await parseBody(request);
  if (!body) return badRequest("Invalid JSON body.");

  const title = requiredString(body.title, "title");
  if (title.error) return title.error;
  const description = requiredString(body.description, "description");
  if (description.error) return description.error;
  const type = enumString(body.type, TYPES, "type", "SUPPORT");
  if (type.error) return type.error;
  const priority = enumString(body.priority, PRIORITIES, "priority", "MEDIUM");
  if (priority.error) return priority.error;
  const projectId = optionalString(body.projectId, "projectId");
  if (projectId.error) return projectId.error;
  if (projectId.value && !(await ownedProject(user.id, projectId.value))) return notFound("Project not found.");

  const issue = await prisma.issue.create({
    data: {
      userId: user.id,
      projectId: projectId.value,
      title: title.value,
      description: description.value,
      type: type.value,
      priority: priority.value,
      lastActivityAt: new Date(),
    },
  });

  const developers = await prisma.user.findMany({ where: { role: "DEVELOPER", id: { not: user.id } }, select: { id: true } });
  if (developers.length) {
    await prisma.notification.createMany({
      data: developers.map(developer => ({ userId: developer.id, issueId: issue.id, type: "ISSUE_CREATED" as const })),
    });
  }

  return NextResponse.json({ request: serializeIssue(issue) }, { status: 201 });
}
