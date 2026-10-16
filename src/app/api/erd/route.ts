import { getCurrentUser } from "@/lib/auth";
import { ERD_EMPTY_DOCUMENT } from "@/constants/erd";
import {
  erdAccessError,
  erdJson,
  parseErdDocument,
  readStoredErdDocument,
} from "@/lib/erd";
import { ownedProject, parseBody } from "@/lib/workspace-api";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return erdJson({ message: "Unauthorized" }, 401);
  }

  const accessError = erdAccessError(user);

  if (accessError) {
    return accessError;
  }

  const projectId = new URL(request.url).searchParams.get("projectId");
  const project = await ownedProject(user.id, projectId);

  if (!project) {
    return erdJson({ message: "Project not found." }, 404);
  }

  const diagram = await prisma.erdDiagram.findUnique({
    where: { projectId: project.id },
    select: { document: true, updatedAt: true },
  });

  return erdJson({
    document: diagram ? readStoredErdDocument(diagram.document) : ERD_EMPTY_DOCUMENT,
    updatedAt: diagram?.updatedAt.toISOString() ?? null,
  });
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return erdJson({ message: "Unauthorized" }, 401);
  }

  const accessError = erdAccessError(user);

  if (accessError) {
    return accessError;
  }

  const body = await parseBody(request);

  if (!body) {
    return erdJson({ message: "Invalid JSON body." }, 400);
  }

  const project = await ownedProject(user.id, typeof body.projectId === "string" ? body.projectId : null);

  if (!project) {
    return erdJson({ message: "Project not found." }, 404);
  }

  const document = parseErdDocument(body.document);

  if (document.error !== undefined) {
    return erdJson({ message: document.error }, 400);
  }

  const diagram = await prisma.erdDiagram.upsert({
    where: { projectId: project.id },
    create: {
      userId: user.id,
      projectId: project.id,
      document: document.value,
    },
    update: {
      document: document.value,
    },
    select: { updatedAt: true },
  });

  return erdJson({
    message: "Diagram saved.",
    document: document.value,
    updatedAt: diagram.updatedAt.toISOString(),
  });
}
