import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  normalizeRepositoryUrl,
  parseDefaultBranch,
  parseRepositoryProvider,
} from "@/lib/workspace-repository";
import { badRequest, notFound, parseBody } from "@/lib/workspace-api";

const PRIVATE_NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
};

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

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401, headers: PRIVATE_NO_STORE_HEADERS });
  }

  const repositories = await prisma.workspaceRepository.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(
    { repositories: repositories.map(serializeRepository) },
    { headers: PRIVATE_NO_STORE_HEADERS },
  );
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401, headers: PRIVATE_NO_STORE_HEADERS });
  }

  const body = await parseBody(request);

  if (!body) {
    return badRequest("Invalid JSON body.");
  }

  const repositoryUrl = normalizeRepositoryUrl(body.repositoryUrl);

  if (repositoryUrl.error) {
    return badRequest(repositoryUrl.error);
  }

  const defaultBranch = parseDefaultBranch(body.defaultBranch);

  if (defaultBranch.error) {
    return badRequest(defaultBranch.error);
  }

  if (
    body.provider !== undefined &&
    (typeof body.provider !== "string" || !["GITHUB", "GITLAB", "BITBUCKET", "OTHER"].includes(body.provider))
  ) {
    return badRequest("provider is invalid.");
  }

  let projectId: string | null = null;

  if (body.projectId !== undefined && body.projectId !== null && body.projectId !== "") {
    if (typeof body.projectId !== "string") {
      return badRequest("projectId must be a string.");
    }

    const project = await prisma.project.findFirst({
      where: { id: body.projectId, userId: user.id },
      select: { id: true },
    });

    if (!project) {
      return notFound("Project not found.");
    }

    projectId = project.id;
  }

  const provider = parseRepositoryProvider(body.provider, repositoryUrl.value);

  const existingRepository = await prisma.workspaceRepository.findFirst({
    where: { userId: user.id, repositoryUrl: repositoryUrl.value },
    select: { id: true },
  });

  if (existingRepository) {
    return NextResponse.json({ message: "Repository is already connected." }, { status: 409 });
  }

  const repository = await prisma.workspaceRepository.create({
    data: {
      userId: user.id,
      projectId,
      provider: provider.value,
      repositoryUrl: repositoryUrl.value,
      defaultBranch: defaultBranch.value,
    },
  });

  return NextResponse.json(
    { repository: serializeRepository(repository) },
    { status: 201, headers: PRIVATE_NO_STORE_HEADERS },
  );
}
