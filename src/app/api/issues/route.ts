import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { badRequest, enumString, notFound, optionalString, ownedProject, parseBody, requiredString } from "@/lib/workspace-api";
import { serializeIssue } from "@/lib/workspace";
import prisma from "@/lib/prisma";

const SEVERITIES = ["IMPORTANT", "MEDIUM", "LOW"] as const;
const STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED"] as const;

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const issues = await prisma.issue.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ issues: issues.map(serializeIssue) });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const body = await parseBody(request);
  if (!body) return badRequest("Invalid JSON body.");
  const title = requiredString(body.title, "title");
  if (title.error) return title.error;
  const description = optionalString(body.description, "description");
  if (description.error) return description.error;
  let projectId: string | null = null;
  if (body.projectId !== undefined) {
    const parsedProjectId = optionalString(body.projectId, "projectId");
    if (parsedProjectId.error) return parsedProjectId.error;
    projectId = parsedProjectId.value;
  }
  if (projectId && !(await ownedProject(user.id, projectId))) return notFound("Project not found.");
  const severity = enumString(body.severity, SEVERITIES, "severity", "MEDIUM");
  if (severity.error) return severity.error;
  const status = enumString(body.status, STATUSES, "status", "OPEN");
  if (status.error) return status.error;
  const issue = await prisma.issue.create({ data: { userId: user.id, title: title.value, description: description.value, projectId, severity: severity.value, status: status.value } });
  return NextResponse.json({ issue: serializeIssue(issue) }, { status: 201 });
}
