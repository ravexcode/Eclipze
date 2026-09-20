import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  normalizeRepositoryUrl,
  parseDefaultBranch,
  parseRepositoryProvider,
} from "@/lib/workspace-repository";
import { badRequest, notFound, parseBody } from "@/lib/workspace-api";

type RouteContext = { params: Promise<{ id: string }> };

function serializeRepository(repository: {
  id: string;
  projectId: string | null;
  provider: string;
  repositoryUrl: string;
  defaultBranch: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: repository.id,
    projectId: repository.projectId,
    provider: repository.provider,
    repositoryUrl: repository.repositoryUrl,
    defaultBranch: repository.defaultBranch,
    status: repository.status,
    createdAt: repository.createdAt.toISOString(),
    updatedAt: repository.updatedAt.toISOString(),
  };
}

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const repository = await prisma.workspaceRepository.findFirst({ where: { id, userId: user.id } });

  if (!repository) {
    return notFound("Repository not found.");
  }

  const body = await parseBody(request);

  if (!body) {
    return badRequest("Invalid JSON body.");
  }

  const data: {
    repositoryUrl?: string;
    defaultBranch?: string;
    projectId?: string | null;
    provider?: "GITHUB" | "GITLAB" | "BITBUCKET" | "OTHER";
  } = {};

  if (body.repositoryUrl !== undefined) {
    const repositoryUrl = normalizeRepositoryUrl(body.repositoryUrl);

    if (repositoryUrl.error) {
      return badRequest(repositoryUrl.error);
    }

    data.repositoryUrl = repositoryUrl.value;
    data.provider = parseRepositoryProvider(undefined, repositoryUrl.value).value;
  }

  if (body.defaultBranch !== undefined) {
    const defaultBranch = parseDefaultBranch(body.defaultBranch);

    if (defaultBranch.error) {
      return badRequest(defaultBranch.error);
    }

    data.defaultBranch = defaultBranch.value;
  }

  if (body.projectId !== undefined) {
    if (body.projectId === null || body.projectId === "") {
      data.projectId = null;
    } else if (typeof body.projectId !== "string") {
      return badRequest("projectId must be a string.");
    } else {
      const project = await prisma.project.findFirst({ where: { id: body.projectId, userId: user.id }, select: { id: true } });

      if (!project) {
        return notFound("Project not found.");
      }

      data.projectId = project.id;
    }
  }

  if (data.repositoryUrl) {
    const duplicate = await prisma.workspaceRepository.findFirst({
      where: { userId: user.id, repositoryUrl: data.repositoryUrl, id: { not: repository.id } },
      select: { id: true },
    });

    if (duplicate) {
      return NextResponse.json({ message: "Repository is already connected." }, { status: 409 });
    }
  }

  const updatedRepository = await prisma.workspaceRepository.update({ where: { id }, data });

  return NextResponse.json({ repository: serializeRepository(updatedRepository) });
}

export async function DELETE(request: Request, context: RouteContext) {
  void request;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const repository = await prisma.workspaceRepository.findFirst({ where: { id, userId: user.id }, select: { id: true } });

  if (!repository) {
    return notFound("Repository not found.");
  }

  await prisma.workspaceRepository.delete({ where: { id: repository.id } });
  return NextResponse.json({ message: "Repository disconnected." });
}
