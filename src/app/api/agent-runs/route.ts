import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { resolveSkillSnapshot } from "@/lib/agent-skills";
import { appendRunEvent, serializeAgentRun, startAgentRun } from "@/lib/agent-runs";
import { resolveAllowedCommand, createInstructionsDigest } from "@/lib/agent-runner";
import prisma from "@/lib/prisma";
import { badRequest, notFound, parseBody, requiredString } from "@/lib/workspace-api";

const PRIVATE_NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
};

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401, headers: PRIVATE_NO_STORE_HEADERS });
  }

  const runs = await prisma.agentRun.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { events: { orderBy: { sequence: "asc" }, take: 100 } },
  });

  return NextResponse.json(
    { runs: runs.map(serializeAgentRun) },
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

  const sessionId = requiredString(body.sessionId, "sessionId");
  const repositoryId = requiredString(body.repositoryId, "repositoryId");
  const instructions = requiredString(body.instructions, "instructions");

  if (sessionId.error) return sessionId.error;
  if (repositoryId.error) return repositoryId.error;
  if (instructions.error) return instructions.error;
  if (instructions.value.length > 8_000) return badRequest("instructions is too long.");

  const session = await prisma.agentSession.findFirst({
    where: { id: sessionId.value, userId: user.id },
    include: { agent: { include: { skillSelections: true } } },
  });

  if (!session) {
    return notFound("Agent session not found.");
  }

  const repository = await prisma.workspaceRepository.findFirst({
    where: { id: repositoryId.value, userId: user.id },
    select: { id: true },
  });

  if (!repository) {
    return notFound("Repository not found.");
  }

  const commandKey = typeof body.commandKey === "string" && body.commandKey.trim()
    ? body.commandKey.trim()
    : "git-status";
  const command = resolveAllowedCommand(commandKey);

  if (!command) {
    return badRequest("Command is not allowed.");
  }

  const skillSnapshot = resolveSkillSnapshot(body.skills, session.agent.skillSelections.map(skill => ({ slug: skill.slug, version: skill.version })));

  if (skillSnapshot.error) {
    return badRequest(skillSnapshot.error);
  }

  const model = typeof body.model === "string" && body.model.trim()
    ? body.model.trim()
    : session.model || session.agent.defaultModel;

  if (model.length > 200) {
    return badRequest("model is too long.");
  }

  const run = await prisma.agentRun.create({
    data: {
      userId: user.id,
      agentSessionId: session.id,
      repositoryId: repository.id,
      model,
      commandKey: command.key,
      instructionsDigest: createInstructionsDigest(instructions.value),
      skillSnapshot: skillSnapshot.skills.map(skill => ({ slug: skill.slug, version: skill.version })),
      workspaceKey: randomUUID(),
    },
    include: { events: true },
  });

  await appendRunEvent(run.id, { type: "SYSTEM", message: "Run queued." });
  startAgentRun(run.id, user.id);

  const createdRun = await prisma.agentRun.findUnique({
    where: { id: run.id },
    include: { events: { orderBy: { sequence: "asc" } } },
  });

  return NextResponse.json(
    { run: createdRun ? serializeAgentRun(createdRun) : serializeAgentRun(run) },
    { status: 202, headers: PRIVATE_NO_STORE_HEADERS },
  );
}
