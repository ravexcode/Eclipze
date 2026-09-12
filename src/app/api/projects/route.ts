import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { badRequest, enumString, parseBody, requiredString } from "@/lib/workspace-api";
import { serializeProject } from "@/lib/workspace";
import prisma from "@/lib/prisma";

const PROJECT_STATUSES = ["ACTIVE", "AT_RISK", "COMPLETED"] as const;

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const projects = await prisma.project.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" } });
  return NextResponse.json({ projects: projects.map(serializeProject) });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const body = await parseBody(request);
  if (!body) return badRequest("Invalid JSON body.");

  const name = requiredString(body.name, "name");
  if (name.error) return name.error;
  const description = typeof body.description === "string" ? body.description.trim() || null : null;
  const externalUrl = typeof body.externalUrl === "string" ? body.externalUrl.trim() || null : null;
  const status = enumString(body.status, PROJECT_STATUSES, "status", "ACTIVE");
  if (status.error) return status.error;

  const project = await prisma.project.create({
    data: { userId: user.id, name: name.value, description, externalUrl, status: status.value },
  });
  return NextResponse.json({ project: serializeProject(project) }, { status: 201 });
}
